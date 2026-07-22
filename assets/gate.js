/*!
 * gate.js — Cổng truy cập dùng chung cho các webapp của Hiên Nhi Hiên 89
 * ----------------------------------------------------------------------------
 * MỤC TIÊU: chặn người lạ đọc nội dung khi chưa "đăng nhập".
 *
 * 3 chế độ (đặt trong window.GATE.mode):
 *   'local'    — Khóa bằng mật khẩu, kiểm tra bằng PBKDF2 ngay trong trình duyệt.
 *                Hoạt động OFFLINE. Đây là lớp NGĂN CHẶN (deterrent): người
 *                thường/không rành sẽ bị chặn, nhưng người rành kỹ thuật vẫn có
 *                thể đọc mã nguồn tĩnh. Muốn "tải về cũng không đọc được" thì
 *                bật thêm mã hóa (xem 'encrypted') hoặc dùng backend 'approval'.
 *   'encrypted'— Nội dung thật được mã hóa AES-GCM (xem tools/encrypt.mjs).
 *                Không có mật khẩu đúng thì trong mã nguồn chỉ là chuỗi mã hóa.
 *                Đây là lớp bảo vệ THẬT, vẫn chạy offline, dùng chung 1 mật khẩu.
 *   'approval' — Gọi backend (Cloudflare Worker). Backend ghi lại IP/thiết bị,
 *                gửi Telegram cho chủ để DUYỆT từng người. Chỉ khi được duyệt
 *                mới cấp phiên + (tùy chọn) khóa giải mã. Đây là lớp KIỂM SOÁT
 *                đầy đủ theo yêu cầu "chỉ tôi phê duyệt".
 *
 * Cấu hình: đặt window.GATE = {...} TRƯỚC khi nạp file này. Xem docs/ARCHITECTURE.md
 */
(function () {
  "use strict";

  var CFG = window.GATE || {};
  var APP = CFG.app || "app";
  var MODE = CFG.mode || "local";
  var BACKEND = (CFG.backend || "").replace(/\/+$/, "");
  var TITLE = CFG.title || "Khu vực riêng tư";
  var SUBTITLE = CFG.subtitle || "Nhập mật khẩu để tiếp tục.";
  var SESSION_KEY = "gate_ok_" + APP;
  var REMEMBER_KEY = "gate_remember_" + APP;
  var TOKEN_KEY = "gate_token_" + APP;
  var DEVICE_KEY = "gate_device_id";
  var currentDeviceId = "";
  var chatPollTimer = null;

  function randomId() {
    if (crypto.randomUUID) return crypto.randomUUID();
    var bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    var hex = Array.prototype.map.call(bytes, function (b) { return b.toString(16).padStart(2, "0"); }).join("");
    return hex.slice(0, 8) + "-" + hex.slice(8, 12) + "-" + hex.slice(12, 16) + "-" + hex.slice(16, 20) + "-" + hex.slice(20);
  }

  function deviceId() {
    if (currentDeviceId) return currentDeviceId;
    var id = "";
    try {
      id = localStorage.getItem(DEVICE_KEY) || "";
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
        id = randomId();
        localStorage.setItem(DEVICE_KEY, id);
      }
    } catch (e) {
      id = randomId();
    }
    currentDeviceId = id;
    return currentDeviceId;
  }

  /* -------------------------- tiện ích mã hóa -------------------------- */
  function b64ToBuf(b64) {
    var bin = atob(b64), len = bin.length, buf = new Uint8Array(len);
    for (var i = 0; i < len; i++) buf[i] = bin.charCodeAt(i);
    return buf;
  }
  function bufToB64(buf) {
    var bytes = new Uint8Array(buf), bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  function timingSafeEqual(a, b) {
    if (a.length !== b.length) return false;
    var diff = 0;
    for (var i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
    return diff === 0;
  }

  // Dẫn xuất "bits" từ mật khẩu để so khớp hash (PBKDF2-SHA256).
  function deriveBits(pass, saltBuf, iterations, keylen) {
    return crypto.subtle
      .importKey("raw", new TextEncoder().encode(pass), { name: "PBKDF2" }, false, ["deriveBits"])
      .then(function (baseKey) {
        return crypto.subtle.deriveBits(
          { name: "PBKDF2", salt: saltBuf, iterations: iterations, hash: "SHA-256" },
          baseKey,
          keylen * 8
        );
      });
  }

  // Dẫn xuất khóa AES-GCM từ mật khẩu (dùng cho chế độ mã hóa).
  function deriveAesKey(pass, saltBuf, iterations) {
    return crypto.subtle
      .importKey("raw", new TextEncoder().encode(pass), { name: "PBKDF2" }, false, ["deriveKey"])
      .then(function (baseKey) {
        return crypto.subtle.deriveKey(
          { name: "PBKDF2", salt: saltBuf, iterations: iterations, hash: "SHA-256" },
          baseKey,
          { name: "AES-GCM", length: 256 },
          false,
          ["decrypt"]
        );
      });
  }

  /* -------------------------- kiểm tra mật khẩu (local) -------------------------- */
  function verifyLocal(pass) {
    var p = CFG.pbkdf2 || {};
    var salt = b64ToBuf(p.saltB64);
    return deriveBits(pass, salt, p.iterations, p.keylen).then(function (bits) {
      var got = new Uint8Array(bits);
      var want = b64ToBuf(p.hashB64);
      return timingSafeEqual(got, want);
    });
  }

  /* -------------------------- giải mã nội dung (encrypted) -------------------------- */
  // Trang mã hóa chứa: <script type="application/gate-payload">{saltB64,ivB64,ctB64,iterations}</script>
  function decryptPayload(pass) {
    var el = document.querySelector('script[type="application/gate-payload"]');
    if (!el) return Promise.reject(new Error("Không tìm thấy nội dung mã hóa."));
    var pl = JSON.parse(el.textContent);
    var salt = b64ToBuf(pl.saltB64);
    var iv = b64ToBuf(pl.ivB64);
    var ct = b64ToBuf(pl.ctB64);
    return deriveAesKey(pass, salt, pl.iterations || 200000).then(function (key) {
      return crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, ct);
    }).then(function (plainBuf) {
      return new TextDecoder().decode(plainBuf);
    });
  }

  function injectHtml(html) {
    var host = document.getElementById("gate-content") || document.body;
    host.innerHTML = html;
    // innerHTML không tự chạy <script>, phải tạo lại từng thẻ.
    var scripts = host.querySelectorAll("script");
    scripts.forEach(function (old) {
      var s = document.createElement("script");
      for (var i = 0; i < old.attributes.length; i++) {
        s.setAttribute(old.attributes[i].name, old.attributes[i].value);
      }
      // Giữ đúng THỨ TỰ chạy: script ngoài (src) mặc định async -> ép async=false
      // để data*.js chạy trước app.js như bản gốc.
      if (old.src) s.async = false;
      s.textContent = old.textContent;
      old.parentNode.replaceChild(s, old);
    });
  }

  /* -------------------------- backend duyệt (approval) -------------------------- */
  function fingerprint() {
    // Dấu vết thiết bị nhẹ (không xâm phạm) để chủ nhận diện phiên yêu cầu.
    return {
      ua: navigator.userAgent,
      lang: navigator.language,
      tz: (Intl.DateTimeFormat().resolvedOptions() || {}).timeZone || "",
      screen: (screen.width + "x" + screen.height),
      platform: navigator.platform || ""
    };
  }

  function requestApproval(name, note) {
    return fetch(BACKEND + "/api/request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ app: APP, name: name, note: note, device_id: deviceId(), device: fingerprint() })
    }).then(function (r) {
      if (!r.ok) throw new Error("Không gửi được yêu cầu (" + r.status + ").");
      return r.json();
    });
  }

  function pollStatus(id, onUpdate) {
    var stopped = false;
    function tick() {
      if (stopped) return;
      fetch(BACKEND + "/api/status?id=" + encodeURIComponent(id) + "&did=" + encodeURIComponent(deviceId()))
        .then(function (r) { return r.json(); })
        .then(function (data) {
          onUpdate(data);
          if (data.status === "approved" || data.status === "denied" || data.status === "expired") { stopped = true; return; }
          setTimeout(tick, 3000);
        })
        .catch(function () { setTimeout(tick, 4000); });
    }
    tick();
    return function () { stopped = true; };
  }

  /* -------------------------- mở khóa / hiện nội dung -------------------------- */
  function accessToken() {
    try { return localStorage.getItem(TOKEN_KEY) || ""; } catch (e) { return ""; }
  }

  function trackAccess(method) {
    if (!BACKEND) return;
    var token = accessToken();
    fetch(BACKEND + "/api/access", {
      method: "POST",
      headers: Object.assign(
        { "content-type": "application/json" },
        token ? { "authorization": "Bearer " + token } : {}
      ),
      body: JSON.stringify({
        app: APP,
        device_id: deviceId(),
        event_id: randomId(),
        client_method: method,
        device: fingerprint()
      }),
      keepalive: true
    }).catch(function () {});
  }

  function facebookUrl(value) {
    try {
      var url = new URL(String(value || ""));
      if (url.protocol !== "https:" || url.username || url.password || url.port
          || (url.hostname !== "facebook.com" && url.hostname !== "www.facebook.com" && url.hostname !== "m.facebook.com")) return "";
      return url.href;
    } catch (e) {
      return "";
    }
  }

  function injectReaderShowcase() {
    if (document.getElementById("gate-readers")) return;
    var readers = Array.isArray(CFG.readers) ? CFG.readers : [];
    var valid = readers.map(function (reader) {
      return {
        name: String(reader && reader.name || "").trim().slice(0, 80),
        description: String(reader && reader.description || "").trim().slice(0, 160),
        facebook: facebookUrl(reader && reader.facebook)
      };
    }).filter(function (reader) { return reader.name && reader.facebook; });
    if (!valid.length) return;

    var section = document.createElement("section");
    section.id = "gate-readers";
    section.setAttribute("aria-label", "Reader được giới thiệu");
    var heading = document.createElement("strong");
    heading.textContent = "Reader được giới thiệu";
    var list = document.createElement("div");
    list.className = "gate-readers-list";
    valid.forEach(function (reader) {
      var link = document.createElement("a");
      link.className = "gate-reader";
      link.href = reader.facebook;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      var name = document.createElement("span");
      name.className = "gate-reader-name";
      name.textContent = reader.name;
      link.appendChild(name);
      if (reader.description) {
        var description = document.createElement("span");
        description.textContent = reader.description;
        link.appendChild(description);
      }
      list.appendChild(link);
    });
    section.append(heading, list);
    document.body.insertBefore(section, document.body.firstChild);
  }

  function tokenSupportsChat(token) {
    try {
      var part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      var claims = JSON.parse(atob(part + "=".repeat((4 - part.length % 4) % 4)));
      return claims.ver === 2 && claims.aud === "gate-chat" && claims.app === APP
        && claims.did === deviceId() && Array.isArray(claims.scope) && claims.scope.indexOf("chat") !== -1
        && Number(claims.exp) * 1000 > Date.now();
    } catch (e) {
      return false;
    }
  }

  function chatApi(path, options) {
    options = options || {};
    options.headers = Object.assign({}, options.headers || {}, { "authorization": "Bearer " + accessToken() });
    return fetch(BACKEND + path, options).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (data) {
        if (!response.ok) {
          var error = new Error(data.error || ("HTTP " + response.status));
          error.status = response.status;
          throw error;
        }
        return data;
      });
    });
  }

  function injectChat() {
    if (!BACKEND || document.getElementById("gate-chat")) return;
    var shell = document.createElement("aside");
    shell.id = "gate-chat";
    shell.setAttribute("aria-label", "Chat với chủ app");
    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "gate-chat-toggle";
    toggle.textContent = "Chat";
    toggle.setAttribute("aria-expanded", "false");
    var panel = document.createElement("div");
    panel.className = "gate-chat-panel";
    panel.hidden = true;
    shell.append(toggle, panel);
    document.body.appendChild(shell);

    function status(text, isError) {
      var node = panel.querySelector(".gate-chat-status");
      if (node) {
        node.textContent = text || "";
        node.classList.toggle("err", !!isError);
      }
    }

    function stopPolling() {
      if (chatPollTimer) clearTimeout(chatPollTimer);
      chatPollTimer = null;
    }

    function renderMessages(messages) {
      var list = panel.querySelector(".gate-chat-messages");
      if (!list) return;
      list.replaceChildren();
      (messages || []).forEach(function (message) {
        var item = document.createElement("div");
        item.className = "gate-chat-message " + (message.sender === "owner" ? "owner" : "visitor");
        var sender = document.createElement("strong");
        sender.textContent = message.sender === "owner" ? "Chủ app" : "Bạn";
        var text = document.createElement("span");
        text.textContent = String(message.text || "");
        item.append(sender, text);
        list.appendChild(item);
      });
      list.scrollTop = list.scrollHeight;
    }

    function loadMessages() {
      if (panel.hidden || !tokenSupportsChat(accessToken())) return;
      chatApi("/api/chat/messages").then(function (data) {
        renderMessages(data.messages);
        status("");
        chatPollTimer = setTimeout(loadMessages, 5000);
      }).catch(function (error) {
        if (error.status === 401) {
          try { localStorage.removeItem(TOKEN_KEY); } catch (e) {}
          renderPanel();
          return;
        }
        status(error.message === "chat_disabled" ? "Chat đang tắt." : "Chưa tải được tin nhắn.", true);
        if (error.status !== 503) chatPollTimer = setTimeout(loadMessages, 8000);
      });
    }

    function renderApproved() {
      panel.replaceChildren();
      var title = document.createElement("strong");
      title.textContent = "Chat với chủ app";
      var messages = document.createElement("div");
      messages.className = "gate-chat-messages";
      messages.setAttribute("aria-live", "polite");
      var form = document.createElement("form");
      form.className = "gate-chat-form";
      var input = document.createElement("textarea");
      input.className = "gate-input";
      input.maxLength = 1000;
      input.rows = 2;
      input.required = true;
      input.placeholder = "Nhập tin nhắn…";
      input.setAttribute("aria-label", "Tin nhắn");
      var send = document.createElement("button");
      send.className = "gate-btn";
      send.type = "submit";
      send.textContent = "Gửi";
      var state = document.createElement("div");
      state.className = "gate-chat-status";
      state.setAttribute("role", "status");
      var notice = document.createElement("small");
      notice.textContent = "Tin nhắn lưu tối đa 30 ngày trong app và gửi bản sao tới Telegram của chủ app.";
      form.append(input, send);
      panel.append(title, messages, form, state, notice);
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var text = input.value.trim();
        if (!text) return;
        send.disabled = true;
        status("Đang gửi…");
        chatApi("/api/chat/send", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text: text, client_id: randomId() })
        }).then(function () {
          input.value = "";
          send.disabled = false;
          stopPolling();
          return loadMessages();
        }).catch(function (error) {
          send.disabled = false;
          status(error.message === "chat_disabled" ? "Chat đang tắt." : "Không gửi được tin nhắn.", true);
        });
      });
      loadMessages();
    }

    function renderApproval() {
      panel.replaceChildren();
      var title = document.createElement("strong");
      title.textContent = "Xin quyền chat";
      var description = document.createElement("p");
      description.textContent = "Chat chỉ dành cho hồ sơ đã được chủ duyệt.";
      var form = document.createElement("form");
      form.className = "gate-chat-form";
      var name = document.createElement("input");
      name.className = "gate-input";
      name.required = true;
      name.maxLength = 80;
      name.placeholder = "Tên của bạn";
      name.setAttribute("aria-label", "Tên của bạn");
      var submit = document.createElement("button");
      submit.className = "gate-btn";
      submit.type = "submit";
      submit.textContent = "Gửi yêu cầu một lần";
      var state = document.createElement("div");
      state.className = "gate-chat-status";
      state.setAttribute("role", "status");
      form.append(name, submit);
      panel.append(title, description, form, state);
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        submit.disabled = true;
        status("Đang gửi yêu cầu…");
        requestApproval(name.value.trim(), "Xin quyền chat").then(function (result) {
          status("Đang chờ chủ duyệt…");
          pollStatus(result.id, function (data) {
            if (data.status === "approved" && data.token) {
              try { localStorage.setItem(TOKEN_KEY, data.token); } catch (e) {}
              renderPanel();
            } else if (data.status === "denied") {
              status("Yêu cầu chat bị từ chối.", true);
            } else if (data.status === "expired") {
              status("Phiên duyệt đã hết hạn. Gửi yêu cầu mới.", true);
            }
          });
        }).catch(function () {
          status("Không gửi được yêu cầu.", true);
        });
      });
    }

    function renderPanel() {
      stopPolling();
      if (tokenSupportsChat(accessToken())) renderApproved();
      else renderApproval();
    }

    toggle.addEventListener("click", function () {
      panel.hidden = !panel.hidden;
      toggle.setAttribute("aria-expanded", String(!panel.hidden));
      if (!panel.hidden) renderPanel();
      else stopPolling();
    });
  }

  function reveal(method) {
    document.documentElement.classList.remove("gate-locked");
    var root = document.getElementById("gate-root");
    if (root) root.parentNode.removeChild(root);
    injectLogout(); // nút "khóa lại" nếu máy này đang được ghi nhớ
    injectReaderShowcase();
    injectChat();
    trackAccess(method || "session");
    // Watermark chủ sở hữu vẫn giữ lại sau khi mở khóa (không xóa).
  }

  // Nút nhỏ để "quên máy này" (xóa khóa đã lưu) — chỉ hiện khi máy đang được ghi nhớ.
  function injectLogout() {
    var has = false;
    try { has = !!localStorage.getItem("gate_key_" + APP); } catch (e) {}
    if (!has || document.getElementById("gate-logout")) return;
    var b = document.createElement("button");
    b.id = "gate-logout"; b.type = "button";
    b.title = "Quên máy này (bắt nhập lại mật khẩu)";
    b.textContent = "🔒";
    b.addEventListener("click", function () {
      try {
        localStorage.removeItem("gate_key_" + APP);
        localStorage.removeItem(REMEMBER_KEY);
        sessionStorage.removeItem(SESSION_KEY);
      } catch (e) {}
      location.reload();
    });
    document.body.appendChild(b);
  }

  // Watermark chủ sở hữu: hiện ở ĐẦU trang, CUỐI trang và CHỮ MỜ nền.
  // Bền vững qua cả lúc khóa lẫn sau khi mở khóa. Không chặn thao tác (pointer-events:none).
  function injectOwner() {
    if (!CFG.owner || document.getElementById("gate-owner-wrap")) return;
    var name = String(CFG.owner);
    var w = document.createElement("div");
    w.id = "gate-owner-wrap";
    w.setAttribute("aria-hidden", "true");
    var top = document.createElement("div"); top.className = "gate-owner-top"; top.textContent = "✦ " + name + " ✦";
    var bg = document.createElement("div"); bg.className = "gate-owner-bg"; bg.textContent = name;
    var bot = document.createElement("div"); bot.className = "gate-owner-bottom"; bot.textContent = "✦ " + name + " · khu vực riêng tư ✦";
    w.appendChild(top); w.appendChild(bg); w.appendChild(bot);
    document.body.appendChild(w);
  }

  function unlockLocalOrEncrypted(pass, remember) {
    var work;
    // Nếu trang có nội dung mã hóa (kể cả ở chế độ 'approval' cho CHỦ) -> giải mã bằng mật khẩu.
    var hasPayload = !!document.querySelector('script[type="application/gate-payload"]');
    if (MODE === "encrypted" || hasPayload) {
      work = decryptPayload(pass).then(function (html) { injectHtml(html); });
    } else {
      work = verifyLocal(pass).then(function (ok) {
        if (!ok) throw new Error("BAD_PASS");
      });
    }
    return work.then(function () {
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
        if (remember) {
          localStorage.setItem(REMEMBER_KEY, "1");
          // GHI NHỚ MÁY NÀY: lưu khóa để lần sau TỰ MỞ (kể cả sau khi tắt máy).
          // Chỉ lưu khi trang mã hóa (khóa = mật khẩu để giải mã lại).
          if (MODE === "encrypted" || hasPayload) localStorage.setItem("gate_key_" + APP, pass);
        }
      } catch (e) {}
      reveal("password");
    });
  }

  /* -------------------------- giao diện khóa -------------------------- */
  function buildUI() {
    var root = document.createElement("div");
    root.id = "gate-root";
    root.innerHTML =
      '<div class="gate-card" role="dialog" aria-modal="true" aria-label="Cổng truy cập">' +
        '<div class="gate-sigil">🔒</div>' +
        '<h1 class="gate-title"></h1>' +
        '<p class="gate-sub"></p>' +
        '<form class="gate-form" autocomplete="off">' +
          '<div class="gate-approval-fields" style="display:none">' +
            '<input class="gate-input" name="gname" type="text" placeholder="Tên của bạn" aria-label="Tên của bạn" autocomplete="off">' +
            '<input class="gate-input" name="gnote" type="text" placeholder="Lý do truy cập (tùy chọn)" aria-label="Lý do truy cập (tùy chọn)" autocomplete="off">' +
          '</div>' +
          '<div class="gate-pass-field">' +
            '<input class="gate-input" name="gpass" type="password" placeholder="Mật khẩu" aria-label="Mật khẩu" autocomplete="off" autofocus>' +
          '</div>' +
          '<label class="gate-remember"><input type="checkbox" name="gremember" checked> Ghi nhớ máy này (tự mở lần sau)</label>' +
          '<button class="gate-btn" type="submit">Mở khóa</button>' +
          '<a href="#" class="gate-guest" style="display:none">Bạn là khách? Xin quyền truy cập →</a>' +
          '<div class="gate-msg" aria-live="polite"></div>' +
        '</form>' +
        '<div class="gate-foot">Khu vực riêng tư · Không lập chỉ mục · Truy cập được ghi nhận</div>' +
      '</div>';
    document.body.appendChild(root);

    root.querySelector(".gate-title").textContent = TITLE;
    root.querySelector(".gate-sub").textContent = SUBTITLE;
    if (CFG.owner) {
      root.querySelector(".gate-foot").textContent =
        "Chủ sở hữu: " + CFG.owner + " · Khu vực riêng tư · Không lập chỉ mục";
    }

    var form = root.querySelector(".gate-form");
    var msg = root.querySelector(".gate-msg");
    var passField = root.querySelector(".gate-pass-field");
    var approvalFields = root.querySelector(".gate-approval-fields");
    var btn = root.querySelector(".gate-btn");

    var guestLink = root.querySelector(".gate-guest");
    var guestMode = false; // false = chủ (nhập mật khẩu), true = khách (xin duyệt)

    if (MODE === "approval") {
      // Mặc định: giao diện CHỦ — nhập mật khẩu vào ngay (không làm phiền Telegram).
      passField.style.display = "";
      approvalFields.style.display = "none";
      btn.textContent = "Mở khóa";
      guestLink.style.display = "";
      root.querySelector(".gate-sub").textContent =
        CFG.subtitle || "Chủ: nhập mật khẩu. Khách: bấm 'Xin quyền truy cập' bên dưới.";
      guestLink.addEventListener("click", function (e) {
        e.preventDefault();
        guestMode = true;
        passField.style.display = "none";
        approvalFields.style.display = "";
        guestLink.style.display = "none";
        btn.textContent = "Gửi yêu cầu duyệt";
        msg.className = "gate-msg"; msg.textContent = "";
        root.querySelector(".gate-sub").textContent = "Nhập tên rồi gửi — chủ sẽ duyệt qua Telegram.";
        var gn = form.gname; if (gn) gn.focus();
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      msg.className = "gate-msg";
      var pass = form.gpass ? form.gpass.value : "";
      var remember = form.gremember && form.gremember.checked;

      // KHÁCH xin duyệt (chỉ khi ở approval + đã bấm "xin quyền")
      if (MODE === "approval" && guestMode) {
        var name = (form.gname.value || "").trim();
        if (!name) { msg.textContent = "Vui lòng nhập tên."; msg.className = "gate-msg err"; return; }
        btn.disabled = true; msg.textContent = "Đang gửi yêu cầu…";
        requestApproval(name, (form.gnote.value || "").trim()).then(function (res) {
          msg.className = "gate-msg wait";
          msg.textContent = "Đã gửi. Đang chờ chủ duyệt…";
          form.querySelectorAll("input,button").forEach(function (x) { x.disabled = true; });
          pollStatus(res.id, function (data) {
            if (data.status === "approved") {
              try {
                sessionStorage.setItem(SESSION_KEY, "1");
                if (data.token) localStorage.setItem(TOKEN_KEY, data.token);
              } catch (e) {}
              msg.className = "gate-msg ok"; msg.textContent = "Đã được duyệt. Đang mở…";
              // Nếu backend trả khóa giải mã và trang được mã hóa:
              if (document.querySelector('script[type="application/gate-payload"]')) {
                if (!data.key) {
                  msg.className = "gate-msg err";
                  msg.textContent = "Backend chưa có khóa giải mã. Báo chủ app cập nhật cấu hình.";
                  return;
                }
                decryptPayload(data.key).then(function (html) { injectHtml(html); reveal("approved"); })
                  .catch(function () {
                    msg.className = "gate-msg err";
                    msg.textContent = "Khóa giải mã không khớp. Báo chủ app cập nhật backend.";
                  });
              } else {
                setTimeout(function () { reveal("approved"); }, 500);
              }
            } else if (data.status === "denied") {
              msg.className = "gate-msg err"; msg.textContent = "Yêu cầu bị từ chối.";
            } else if (data.status === "expired") {
              msg.className = "gate-msg err"; msg.textContent = "Phiên duyệt đã hết hạn. Hãy tải lại và gửi yêu cầu mới.";
            }
          });
        }).catch(function (err) {
          btn.disabled = false; msg.className = "gate-msg err";
          msg.textContent = err.message || "Lỗi kết nối backend.";
        });
        return;
      }

      // local / encrypted
      if (!pass) { msg.textContent = "Nhập mật khẩu."; msg.className = "gate-msg err"; return; }
      btn.disabled = true; msg.textContent = "Đang kiểm tra…";
      unlockLocalOrEncrypted(pass, remember).catch(function (err) {
        btn.disabled = false; msg.className = "gate-msg err";
        var hasPayload = !!document.querySelector('script[type="application/gate-payload"]');
        if ((err && err.message === "BAD_PASS") || hasPayload) {
          msg.textContent = (MODE === "approval")
            ? "Sai mật khẩu. Nếu bạn là khách, bấm 'Xin quyền truy cập'."
            : "Sai mật khẩu.";
        } else {
          msg.textContent = "Không mở được: " + (err.message || "lỗi");
        }
      });
    });
  }

  /* -------------------------- khởi động -------------------------- */
  function unlockedMethod() {
    try {
      if (sessionStorage.getItem(SESSION_KEY) === "1") return "session";
      if (localStorage.getItem(REMEMBER_KEY) === "1" && MODE !== "encrypted") return "remembered";
    } catch (e) {}
    return "";
  }

  function start() {
    injectOwner(); // watermark chủ sở hữu (hiện cả khi khóa lẫn sau mở khóa)
    var hasPayload = !!document.querySelector('script[type="application/gate-payload"]');

    if (hasPayload) {
      // GHI NHỚ MÁY NÀY: nếu máy này đã lưu khóa -> tự giải mã, khỏi nhập lại
      // (bền vững kể cả sau khi tắt máy vì dùng localStorage).
      var savedKey = null;
      try { savedKey = localStorage.getItem("gate_key_" + APP); } catch (e) {}
      if (savedKey) {
        decryptPayload(savedKey)
          .then(function (html) { injectHtml(html); reveal("saved-key"); })
          .catch(function () {
            // khóa lưu không còn đúng (vd đổi mật khẩu) -> xóa và hiện lại cổng
            try { localStorage.removeItem("gate_key_" + APP); } catch (e) {}
            buildUI();
          });
        return;
      }
      buildUI();
      return;
    }

    // Trang local (không mã hóa): dùng cờ đã-mở-khóa như cũ.
    var method = unlockedMethod();
    if (method && MODE !== "encrypted") { reveal(method); return; }
    buildUI();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
