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
  var TITLE = CFG.title || "Spirituality Market";
  var SUBTITLE = CFG.subtitle || "Nhập mật khẩu để tiếp tục.";
  var SESSION_KEY = "gate_ok_" + APP;
  var REMEMBER_KEY = "gate_remember_" + APP;
  var TOKEN_KEY = "gate_token_" + APP;
  var DEVICE_KEY = "gate_device_id";
  var currentDeviceId = "";
  var chatPollTimer = null;
  var advicePollTimer = null;

  document.documentElement.classList.add("gate-app-" + APP.replace(/[^a-z0-9_-]/gi, ""));

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

  /* Bói toán V11: mọi loại phiên đều đi qua đúng một đường mở nội dung. */
  function openAppContent(key, method) {
    var payload = document.querySelector('script[type="application/gate-payload"]');
    if (!payload) {
      reveal(method || "session");
      return Promise.resolve();
    }
    if (!key) {
      var missing = new Error("decrypt_key_unavailable");
      missing.code = "decrypt_key_unavailable";
      return Promise.reject(missing);
    }
    return decryptPayload(key).then(function (html) {
      injectHtml(html);
      var host = document.getElementById("gate-content");
      if (!host || !host.children.length) throw new Error("empty_decrypted_app");
      reveal(method || "session");
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
      return r.json().then(function (data) {
        if (!r.ok) throw new Error(data.error === "telegram_unavailable"
          ? "Bot Telegram chưa sẵn sàng. Báo Admin kiểm tra bot."
          : "Không gửi được yêu cầu (" + r.status + ").");
        return data;
      });
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
    shell.setAttribute("aria-label", "Chat với Admin");
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
        sender.textContent = message.sender === "owner" ? "Admin" : "Bạn";
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
      title.textContent = "Chat với Admin";
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
      notice.textContent = "Tin nhắn lưu tối đa 30 ngày trong app và gửi bản sao tới Telegram của Admin.";
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

  function injectAdvice() {
    if (APP !== "boitoan" || !BACKEND || document.getElementById("gate-advice")) return;
    var shell = document.createElement("div");
    shell.id = "gate-advice";
    shell.hidden = true;
    shell.innerHTML =
      '<div class="gate-advice-backdrop"></div>' +
      '<section class="gate-advice-dialog" role="dialog" aria-modal="true" aria-labelledby="gate-advice-title">' +
        '<button class="gate-advice-close" type="button" aria-label="Đóng">×</button>' +
        '<h2 id="gate-advice-title">Luận giải chuyên sâu</h2>' +
        '<p class="gate-advice-section"></p>' +
        '<form class="gate-advice-form">' +
          '<label for="gate-advice-question">Câu hỏi của bạn</label>' +
          '<textarea id="gate-advice-question" class="gate-input" maxlength="1500" rows="5" required placeholder="Nhập câu hỏi cần luận giải…"></textarea>' +
          '<button class="gate-btn gate-advice-quote" type="submit" disabled>Yêu cầu báo giá</button>' +
        '</form>' +
        '<div class="gate-advice-state" role="status"></div>' +
        '<div class="gate-advice-price" hidden></div>' +
        '<button class="gate-btn gate-advice-pay" type="button" hidden>Thanh toán</button>' +
        '<small>Thanh toán qua trang bảo mật của đơn vị trung gian. Ngân hàng hoặc cổng thanh toán có thể hiển thị tên người nhận theo quy định.</small>' +
      '</section>';
    document.body.appendChild(shell);

    var dialog = shell.querySelector(".gate-advice-dialog");
    var form = shell.querySelector(".gate-advice-form");
    var question = shell.querySelector("#gate-advice-question");
    var quote = shell.querySelector(".gate-advice-quote");
    var state = shell.querySelector(".gate-advice-state");
    var price = shell.querySelector(".gate-advice-price");
    var pay = shell.querySelector(".gate-advice-pay");
    var section = "Bói toán";
    var adviceId = "";
    var lastTrigger = null;
    var adviceStorageKey = "gate_advice_" + APP;

    function setState(text, isError) {
      state.textContent = text || "";
      state.classList.toggle("err", !!isError);
    }

    function stopAdvicePolling() {
      if (advicePollTimer) clearTimeout(advicePollTimer);
      advicePollTimer = null;
    }

    function close() {
      stopAdvicePolling();
      shell.hidden = true;
      document.body.classList.remove("gate-advice-opened");
      if (lastTrigger) lastTrigger.focus();
    }

    function open(trigger) {
      lastTrigger = trigger;
      section = trigger.getAttribute("data-section") || "Bói toán";
      shell.querySelector(".gate-advice-section").textContent = "Phần: " + section;
      adviceId = "";
      try { sessionStorage.removeItem(adviceStorageKey); } catch (e) {}
      form.hidden = false;
      question.value = "";
      quote.disabled = true;
      price.hidden = true;
      pay.hidden = true;
      pay.disabled = false;
      setState(tokenSupportsChat(accessToken()) ? "Nhập câu hỏi rồi yêu cầu báo giá." : "Cần được chủ duyệt trước khi gửi câu hỏi.", !tokenSupportsChat(accessToken()));
      shell.hidden = false;
      document.body.classList.add("gate-advice-opened");
      question.focus();
    }

    function showQuote(data) {
      var paid = data.status === "paid" || data.payment_status === "paid";
      var pending = !paid && data.payment_status === "pending";
      price.textContent = "Báo giá: " + new Intl.NumberFormat("vi-VN").format(data.amount) + " ₫";
      price.hidden = false;
      pay.hidden = paid;
      pay.disabled = !data.payment_enabled;
      pay.textContent = pending ? "Tiếp tục thanh toán" : "Thanh toán";
      setState(paid
        ? "Thanh toán đã được xác nhận."
        : pending ? "Đang chờ xác nhận. Bạn có thể mở lại trang thanh toán."
          : data.payment_enabled ? "Báo giá đã sẵn sàng. Nhấn Thanh toán để tiếp tục."
          : "Báo giá đã sẵn sàng. Kênh thanh toán chưa được Admin kích hoạt.",
        !paid && !pending && !data.payment_enabled);
    }

    function pollAdvice() {
      if (!adviceId || shell.hidden) return;
      chatApi("/api/advice/status?id=" + encodeURIComponent(adviceId)).then(function (data) {
        if (data.section) {
          section = data.section;
          shell.querySelector(".gate-advice-section").textContent = "Phần: " + section;
        }
        if (data.status === "quoted" || data.status === "paid") {
          showQuote(data);
          if (data.status === "paid" || data.payment_status === "paid") {
            try { sessionStorage.removeItem(adviceStorageKey); } catch (e) {}
          } else if (data.payment_status === "pending") {
            advicePollTimer = setTimeout(pollAdvice, 5000);
          }
          return;
        }
        setState("Đã gửi. Đang chờ Admin báo giá…");
        advicePollTimer = setTimeout(pollAdvice, 5000);
      }).catch(function (error) {
        setState(error.status === 401 ? "Phiên duyệt đã hết hạn." : "Chưa tải được báo giá.", true);
        if (error.status !== 401) advicePollTimer = setTimeout(pollAdvice, 8000);
      });
    }

    question.addEventListener("input", function () {
      quote.disabled = !question.value.trim() || !tokenSupportsChat(accessToken());
    });
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var text = question.value.trim();
      if (!text || !tokenSupportsChat(accessToken())) return;
      quote.disabled = true;
      setState("Đang gửi câu hỏi…");
      chatApi("/api/advice/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ client_id: randomId(), section: section, question: text })
      }).then(function (data) {
        adviceId = data.id;
        try { sessionStorage.setItem(adviceStorageKey, adviceId); } catch (e) {}
        form.hidden = true;
        setState("Đã gửi. Đang chờ Admin báo giá…");
        pollAdvice();
      }).catch(function (error) {
        quote.disabled = false;
        setState(error.status === 401 ? "Phiên duyệt đã hết hạn." : "Không gửi được câu hỏi.", true);
      });
    });
    pay.addEventListener("click", function () {
      if (!adviceId || pay.disabled) return;
      pay.disabled = true;
      setState("Đang mở trang thanh toán…");
      chatApi("/api/advice/payment", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: adviceId })
      }).then(function (data) {
        try { sessionStorage.setItem(adviceStorageKey, adviceId); } catch (e) {}
        location.assign(data.checkout_url);
      }).catch(function (error) {
        pay.disabled = false;
        setState(error.message === "payment_not_configured" ? "Kênh thanh toán chưa được Admin kích hoạt." : "Không tạo được phiên thanh toán.", true);
      });
    });
    shell.querySelector(".gate-advice-close").addEventListener("click", close);
    shell.querySelector(".gate-advice-backdrop").addEventListener("click", close);
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !shell.hidden) close();
    });

    function sectionName(screenNode) {
      var heading = screenNode.querySelector(".shead h2, h2, h1");
      return (heading && heading.textContent.trim()) || screenNode.id || "Bói toán";
    }

    function addButtons() {
      document.querySelectorAll(".screen").forEach(function (screenNode) {
        if (screenNode.querySelector(":scope > .gate-advice-open")) return;
        var button = document.createElement("button");
        button.type = "button";
        button.className = "gate-advice-open";
        button.textContent = "✦ Luận giải chuyên sâu";
        button.setAttribute("data-section", sectionName(screenNode));
        button.addEventListener("click", function () { open(button); });
        screenNode.appendChild(button);
      });
    }
    addButtons();
    new MutationObserver(addButtons).observe(document.getElementById("gate-content") || document.body, { childList: true, subtree: true });

    var returnAdviceId = new URLSearchParams(location.search).get("advice") || "";
    if (!returnAdviceId) {
      try { returnAdviceId = sessionStorage.getItem(adviceStorageKey) || ""; } catch (e) {}
    }
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(returnAdviceId)
        && tokenSupportsChat(accessToken())) {
      adviceId = returnAdviceId;
      form.hidden = true;
      quote.disabled = true;
      price.hidden = true;
      pay.hidden = true;
      shell.querySelector(".gate-advice-section").textContent = "Yêu cầu đã gửi";
      setState("Đang khôi phục yêu cầu…");
      shell.hidden = false;
      document.body.classList.add("gate-advice-opened");
      var cleanUrl = new URL(location.href);
      cleanUrl.searchParams.delete("advice");
      cleanUrl.searchParams.delete("payment");
      history.replaceState(null, "", cleanUrl.href);
      pollAdvice();
    }
    dialog.addEventListener("keydown", function (event) {
      if (event.key === "Tab") {
        var focusable = dialog.querySelectorAll('button:not([hidden]):not(:disabled),textarea:not([hidden]):not(:disabled)');
        if (!focusable.length) return;
        var first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
  }

  function marketSigil() {
    return '<span class="market-sigil" aria-hidden="true"></span>';
  }

  /* Account V7 admin login hotfix */
  /* Account V8 frontend auth contract */
  var MARKET_ADMIN_AUTH_VERSION = "2026-07-24-v11";
  function marketAdminSession() {
    try {
      var level = localStorage.getItem("market_admin_level") || "";
      return localStorage.getItem("market_admin_session") === "1"
        && !!localStorage.getItem("market_admin_token")
        && localStorage.getItem("market_admin_auth_version") === MARKET_ADMIN_AUTH_VERSION
        && (level === "regular" || level === "primary")
        && !storedAccountProfile();
    } catch (e) { return false; }
  }

  function clearMarketAdminSession() {
    var token = "", hadAdmin = false;
    try {
      token = localStorage.getItem("market_admin_token") || "";
      hadAdmin = !!token || localStorage.getItem("market_admin_session") === "1";
      localStorage.removeItem("market_admin_token");
      localStorage.removeItem("market_admin_session");
      localStorage.removeItem("market_admin_primary");
      localStorage.removeItem("market_admin_level");
      localStorage.removeItem("market_admin_auth_version");
      if (hadAdmin) {
        localStorage.removeItem("community_profile_boitoan");
        localStorage.removeItem("community_token_boitoan");
      }
    } catch (e) {}
    return token;
  }

  function revokeMarketAdminSession(token) {
    if (!token || !BACKEND) return;
    fetch(BACKEND + "/api/community/admin/session", {
      method: "DELETE",
      headers: { authorization: "Bearer " + token, "x-owner-device-id": deviceId() },
      keepalive: true
    }).catch(function () {});
  }

  document.addEventListener("click", function(event){
    if (APP !== "boitoan") return;
    var target = event.target && event.target.closest ? event.target.closest("#gate-logout") : null;
    if (!target) return;
    var previousAdminToken = clearMarketAdminSession();
    if (previousAdminToken) revokeMarketAdminSession(previousAdminToken);
  }, true);

  function injectCommunity() {
    if (APP !== "boitoan") return;
    var nav = document.querySelector("body nav");
    if (!nav) { setTimeout(injectCommunity, 80); return; }
    var link = document.getElementById("gate-community-link");
    if (!link) {
      link = document.createElement("a");
      link.id = "gate-community-link";
      link.className = "gate-community-link";
      link.innerHTML = '<span class="i">✦</span><span class="market-nav-label"></span>';
      nav.appendChild(link);
    }
    var admin = marketAdminSession();
    var targetHref = new URL(admin ? "community-admin.html" : "community.html", location.href).href;
    var targetLabel = admin ? "Quản trị" : "Cộng đồng";
    var targetAria = admin ? "Mở khu vực quản trị Spirituality Market" : "Mở Spirituality Market";
    if (link.href !== targetHref) link.href = targetHref;
    var labelNode = link.querySelector(".market-nav-label");
    if (!labelNode) {
      labelNode = document.createElement("span");
      labelNode.className = "market-nav-label";
      link.appendChild(labelNode);
    }
    // MutationObserver của applyMarketBranding theo dõi childList. Không được gán
    // textContent vô điều kiện vì chính thao tác đó tạo mutation mới và lặp vô hạn trên WebKit.
    if (labelNode.textContent !== targetLabel) labelNode.textContent = targetLabel;
    if (link.getAttribute("aria-label") !== targetAria) link.setAttribute("aria-label", targetAria);
    if (!document.body.classList.contains("market-has-community-nav")) document.body.classList.add("market-has-community-nav");
  }

  function applyMarketBranding() {
    if (APP !== "boitoan") return;
    document.body.classList.add("market-brand");
    document.title = "Spirituality Market · Bói toán";
    var headerTitle = document.querySelector("#gate-content .wrap > header h1, body > .wrap > header h1");
    if (headerTitle && !headerTitle.classList.contains("market-brand-title")) {
      headerTitle.classList.add("market-brand-title");
      headerTitle.innerHTML = marketSigil() + '<span>Spirituality Market</span>';
    }
    injectCommunity();
    if (!window.__marketBrandObserver) {
      window.__marketBrandObserver = new MutationObserver(function () { injectCommunity(); });
      window.__marketBrandObserver.observe(document.getElementById("gate-content") || document.body, { childList: true, subtree: true });
    }
  }

  function storedAccountProfile() {
    try { return JSON.parse(localStorage.getItem("community_profile_boitoan") || "null"); } catch (e) { return null; }
  }
  function accountRoleLabel(role) {
    if (role === "reader") return "Reader / Người xem bói";
    if (role === "guest") return "Khách";
    return "Admin";
  }
  function injectAccountIdentity(method) {
    if (APP !== "boitoan") return;
    var old = document.getElementById("market-account-identity");
    if (old) old.remove();
    var profile = storedAccountProfile();
    var admin = !profile && (method === "password" || method === "saved-key" || method === "remembered" || localStorage.getItem("market_admin_session") === "1");
    var role = admin ? "admin" : profile && profile.role;
    if (!role) return;
    var display = admin ? "Admin" : (profile.display_name || profile.username || "Thành viên");
    var primary = false;
    try { primary = admin && localStorage.getItem("market_admin_primary") === "1"; } catch (e) {}
    var chip = document.createElement(admin ? "a" : "div");
    if (admin) { chip.href = new URL("community-admin.html", location.href).href; chip.setAttribute("aria-label", "Mở khu vực quản trị"); }
    chip.id = "market-account-identity";
    chip.className = "market-account-identity role-" + role;
    chip.innerHTML = '<span class="market-account-avatar"></span><span class="market-account-copy"><strong></strong><small></small></span>';
    chip.querySelector(".market-account-avatar").textContent = display.trim().slice(0, 1).toUpperCase() || "✦";
    chip.querySelector("strong").textContent = display;
    chip.querySelector("small").textContent = admin ? ((primary ? "Admin tổng" : "Admin") + " · Mở quản trị") : accountRoleLabel(role);
    var header = document.querySelector("#gate-content .wrap > header, body > .wrap > header");
    if (header) header.appendChild(chip); else document.body.appendChild(chip);
    injectCommunity();
  }
  function reveal(method) {
    document.documentElement.classList.remove("gate-locked");
    var root = document.getElementById("gate-root");
    if (root) root.parentNode.removeChild(root);
    injectLogout(); // nút "khóa lại" nếu máy này đang được ghi nhớ
    injectChat();
    injectAdvice();
    applyMarketBranding();
    injectAccountIdentity(method || "session");
    trackAccess(method || "session");
    // Watermark Admin vẫn giữ lại sau khi mở khóa (không xóa).
  }

  // Nút nhỏ để "quên máy này" (xóa khóa đã lưu) — chỉ hiện khi máy đang được ghi nhớ.
  function injectLogout() {
    var has = false;
    try { has = !!localStorage.getItem("gate_key_" + APP); } catch (e) {}
    if ((!has && APP !== "boitoan") || document.getElementById("gate-logout")) return;
    var b = document.createElement("button");
    b.id = "gate-logout"; b.type = "button";
    b.title = "Quên máy này (bắt nhập lại mật khẩu)";
    b.setAttribute("aria-label", "Khóa ứng dụng");
    b.textContent = APP === "boitoan" ? "🔒 Khóa" : "🔒";
    b.addEventListener("click", function () {
      try {
        localStorage.removeItem("gate_key_" + APP);
        localStorage.removeItem(REMEMBER_KEY);
        if (APP === "boitoan") {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem("community_token_boitoan");
          localStorage.removeItem("community_profile_boitoan");
          localStorage.removeItem("market_admin_session");
          localStorage.removeItem("market_admin_primary");
          localStorage.removeItem("market_admin_level");
          localStorage.removeItem("market_admin_token");
        }
        sessionStorage.removeItem(SESSION_KEY);
      } catch (e) {}
      location.reload();
    });
    document.body.appendChild(b);
  }

  // Watermark Admin: hiện ở ĐẦU trang, CUỐI trang và CHỮ MỜ nền.
  // Bền vững qua cả lúc khóa lẫn sau khi mở khóa. Không chặn thao tác (pointer-events:none).
  function injectOwner() {
    if (!CFG.owner || document.getElementById("gate-owner-wrap")) return;
    var name = String(CFG.owner);
    var w = document.createElement("div");
    w.id = "gate-owner-wrap";
    w.setAttribute("aria-hidden", "true");
    var top = document.createElement("div"); top.className = "gate-owner-top"; top.textContent = "✦ " + name + " ✦";
    var bg = document.createElement("div"); bg.className = "gate-owner-pattern";
    for (var i = 0; i < 18; i++) { var mark = document.createElement("span"); mark.textContent = name; bg.appendChild(mark); }
    var bot = document.createElement("div"); bot.className = "gate-owner-bottom"; bot.textContent = "✦ " + name + " ✦";
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

  function memberEntryError(code) {
    var messages = {
      invalid_login: "Tên đăng nhập hoặc mật khẩu không đúng.",
      username_exists: "Tên đăng nhập đã được sử dụng.",
      invalid_account: "Thông tin chưa hợp lệ. Tên đăng nhập cần 3–30 ký tự; mật khẩu ít nhất 8 ký tự.",
      display_name_required: "Vui lòng nhập tên hiển thị.",
      account_unavailable: "Tài khoản hiện không khả dụng.",
      decrypt_key_unavailable: "Hệ thống chưa sẵn sàng cấp quyền vào app. Vui lòng báo Admin.",
      rate_limited: "Bạn thao tác quá nhanh. Vui lòng thử lại sau.",
      community_server: "Hệ thống tài khoản đang gặp lỗi. Vui lòng thử lại.",
    };
    return messages[code] || "Không thực hiện được. Vui lòng thử lại.";
  }

  function finishMemberEntry(data, remember, method) {
    if (!data || !data.gate_token || !data.token) {
      return Promise.reject(Object.assign(new Error("entry_incomplete"), { code: "entry_incomplete" }));
    }
    try {
      localStorage.setItem(TOKEN_KEY, data.gate_token);
      localStorage.setItem("community_token_boitoan", data.token);
      localStorage.setItem("community_profile_boitoan", JSON.stringify(data.profile || {}));
      clearMarketAdminSession();
      sessionStorage.setItem(SESSION_KEY, "1");
      if (remember) {
        localStorage.setItem(REMEMBER_KEY, "1");
        if (data.key) localStorage.setItem("gate_key_" + APP, data.key);
      } else {
        localStorage.removeItem(REMEMBER_KEY);
        localStorage.removeItem("gate_key_" + APP);
      }
    } catch (e) {}
    return openAppContent(data.key, method || "member");
  }

  function buildBoitoanEntryUI() {
    var root = document.createElement("div");
    root.id = "gate-root";
    root.innerHTML =
      '<div class="gate-card gate-member-card" role="dialog" aria-modal="true" aria-label="Cổng Spirituality Market">' +
        '<div class="gate-entry-brand"><div class="gate-sigil market-gate-sigil" aria-hidden="true"><span></span></div><h1 class="gate-title">Spirituality Market</h1></div>' +
        '<section class="gate-entry-choice" aria-label="Chọn cách truy cập">' +
          '<p class="gate-sub">Chọn một mục để tiếp tục.</p>' +
          '<button type="button" class="gate-entry-option" data-entry-open="login"><strong>Đăng nhập</strong><small>Dành cho Khách hoặc Reader đã có tài khoản.</small><span>›</span></button>' +
          '<button type="button" class="gate-entry-option" data-entry-open="register"><strong>Đăng ký</strong><small>Tạo tài khoản Khách hoặc Reader / Người xem bói.</small><span>›</span></button>' +
          '<button type="button" class="gate-entry-option" data-entry-open="admin"><strong>Admin</strong><small>Mở khu vực quản trị bằng mật khẩu Admin.</small><span>›</span></button>' +
        '</section>' +
        '<section class="gate-entry-stage" data-entry-stage hidden>' +
          '<button type="button" class="gate-entry-back">← Quay lại</button>' +
          '<h2 class="gate-entry-heading"></h2><p class="gate-entry-description"></p>' +
          '<form class="gate-form gate-member-login" autocomplete="on" hidden>' +
            '<label>Tên đăng nhập<input class="gate-input" name="username" required minlength="3" maxlength="30" autocomplete="username"></label>' +
            '<label>Mật khẩu<input class="gate-input" name="password" type="password" required minlength="8" maxlength="128" autocomplete="current-password"></label>' +
            '<label class="gate-remember"><input type="checkbox" name="remember" checked> Ghi nhớ trên thiết bị này</label>' +
            '<button class="gate-btn" type="submit">Vào ứng dụng</button><div class="gate-msg" aria-live="polite"></div>' +
          '</form>' +
          '<form class="gate-form gate-member-register" autocomplete="on" hidden>' +
            '<fieldset class="gate-role-choice"><legend>Chọn loại tài khoản</legend>' +
              '<label class="gate-role-card"><input type="radio" name="role" value="guest" checked><span><strong>Khách</strong><small>Xem bài, tìm Reader, trò chuyện và đánh giá.</small></span></label>' +
              '<label class="gate-role-card"><input type="radio" name="role" value="reader"><span><strong>Reader / Người xem bói</strong><small>Tạo hồ sơ chuyên môn, nhận khách và luận giải.</small></span></label>' +
            '</fieldset>' +
            '<label>Tên hiển thị<input class="gate-input" name="display_name" required maxlength="80" autocomplete="name"></label>' +
            '<label>Tên đăng nhập<input class="gate-input" name="username" required pattern="[a-zA-Z0-9_]{3,30}" maxlength="30" placeholder="Chữ, số hoặc dấu _" autocomplete="username"></label>' +
            '<label>Mật khẩu<input class="gate-input" name="password" type="password" required minlength="8" maxlength="128" placeholder="Tối thiểu 8 ký tự" autocomplete="new-password"></label>' +
            '<label class="gate-remember"><input type="checkbox" name="remember" checked> Ghi nhớ trên thiết bị này</label>' +
            '<p class="gate-privacy">Khi đăng ký, hệ thống gửi Admin tên hiển thị, tên đăng nhập, vai trò và dữ liệu kỹ thuật thiết bị đã nêu. Không gửi mật khẩu.</p>' +
            '<button class="gate-btn" type="submit">Tạo tài khoản và vào app</button><div class="gate-msg" aria-live="polite"></div>' +
          '</form>' +
          '<form class="gate-form gate-admin-login" autocomplete="off" hidden>' +
            '<label>Mật khẩu Admin<input class="gate-input" name="password" type="password" required autocomplete="current-password"></label>' +
            '<label class="gate-remember"><input type="checkbox" name="remember" checked> Ghi nhớ thiết bị Admin</label>' +
            '<button class="gate-btn" type="submit">Đăng nhập Admin</button><div class="gate-msg" aria-live="polite"></div>' +
          '</form>' +
        '</section>' +
        '<div class="gate-foot">Spirituality Market · Truy cập được ghi nhận</div>' +
      '</div>';
    document.body.appendChild(root);

    var choice = root.querySelector(".gate-entry-choice");
    var stage = root.querySelector("[data-entry-stage]");
    var heading = root.querySelector(".gate-entry-heading");
    var description = root.querySelector(".gate-entry-description");
    var forms = {
      login: root.querySelector(".gate-member-login"),
      register: root.querySelector(".gate-member-register"),
      admin: root.querySelector(".gate-admin-login"),
    };
    var copy = {
      login: ["Đăng nhập", "Sử dụng tài khoản Khách hoặc Reader / Người xem bói."],
      register: ["Tạo tài khoản", "Chọn đúng vai trò trước khi hoàn tất đăng ký."],
      admin: ["Admin", "Đăng nhập khu vực quản trị."],
    };
    function openStage(name) {
      choice.hidden = true;
      stage.hidden = false;
      heading.textContent = copy[name][0];
      description.textContent = copy[name][1];
      Object.keys(forms).forEach(function (key) { forms[key].hidden = key !== name; });
      var first = forms[name].querySelector('input:not([type="checkbox"]):not([type="radio"])');
      if (first) setTimeout(function () { first.focus(); }, 20);
    }
    function backToChoice() {
      stage.hidden = true;
      choice.hidden = false;
      Object.keys(forms).forEach(function (key) {
        forms[key].hidden = true;
        var msg = forms[key].querySelector(".gate-msg");
        if (msg) { msg.className = "gate-msg"; msg.textContent = ""; }
      });
    }
    root.querySelectorAll("[data-entry-open]").forEach(function (button) {
      button.addEventListener("click", function () { openStage(button.getAttribute("data-entry-open")); });
    });
    root.querySelector(".gate-entry-back").addEventListener("click", backToChoice);

    function entryRequest(path, payload) {
      return fetch(BACKEND + path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.assign({ entry: true, device_id: deviceId(), device: fingerprint() }, payload)),
      }).then(function (response) {
        return response.json().catch(function () { return {}; }).then(function (data) {
          if (!response.ok) { var error = new Error(data.error || "entry_failed"); error.code = data.error || "entry_failed"; error.detail = data.detail || ""; throw error; }
          return data;
        });
      });
    }

    forms.login.addEventListener("submit", function (event) {
      event.preventDefault();
      var form = forms.login, button = form.querySelector("button[type=submit]"), msg = form.querySelector(".gate-msg");
      button.disabled = true; msg.className = "gate-msg wait"; msg.textContent = "Đang đăng nhập…";
      entryRequest("/api/community/login", { username: form.username.value.trim().toLowerCase(), password: form.password.value })
        .then(function (data) { return finishMemberEntry(data, form.remember.checked, "member-login"); })
        .catch(function (error) { button.disabled = false; msg.className = "gate-msg err"; msg.textContent = memberEntryError(error.code || error.message); });
    });

    forms.register.addEventListener("submit", function (event) {
      event.preventDefault();
      var form = forms.register, button = form.querySelector("button[type=submit]"), msg = form.querySelector(".gate-msg");
      button.disabled = true; msg.className = "gate-msg wait"; msg.textContent = "Đang tạo tài khoản…";
      entryRequest("/api/community/register", {
        role: form.role.value,
        display_name: form.display_name.value.trim(),
        username: form.username.value.trim().toLowerCase(),
        password: form.password.value,
        bio: "",
      }).then(function (data) {
        msg.className = "gate-msg ok";
        msg.textContent = "Đã tạo tài khoản. Đang mở ứng dụng…";
        return finishMemberEntry(data, form.remember.checked, "member-register");
      }).catch(function (error) {
        button.disabled = false; msg.className = "gate-msg err";
        msg.textContent = memberEntryError(error.code || error.message);
        if ((error.code || error.message) === "username_exists") msg.textContent += " Hãy quay lại và chọn Đăng nhập nếu đây là tài khoản vừa tạo trước đó.";
      });
    });

    /* Account V5 single admin login */
    /* Account V6 dual admin UI */
    forms.admin.addEventListener("submit", function (event) {
      event.preventDefault();
      var form = forms.admin, button = form.querySelector("button[type=submit]"), msg = form.querySelector(".gate-msg"), pass = form.password.value;
      var previousAdminToken = clearMarketAdminSession();
      if (previousAdminToken) revokeMarketAdminSession(previousAdminToken);
      button.disabled = true; msg.className = "gate-msg wait"; msg.textContent = "Đang đăng nhập Admin…";
      fetch(BACKEND + "/api/community/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json", "x-owner-device-id": deviceId() },
        body: JSON.stringify({ password: pass, device_id: deviceId(), remember: !!form.remember.checked, device: fingerprint() }),
      }).then(function (response) {
        return response.json().catch(function () { return {}; }).then(function (data) {
          if (!response.ok) { var error = new Error(data.error || "admin_login_failed"); error.code = data.error || "admin_login_failed"; throw error; }
          return data;
        });
      }).then(function (data) {
        if (!data.token || (data.level !== "regular" && data.level !== "primary")) throw new Error("admin_session_incomplete");
        try {
          localStorage.setItem("market_admin_token", data.token);
          localStorage.setItem("market_admin_session", "1");
          localStorage.setItem("market_admin_auth_version", MARKET_ADMIN_AUTH_VERSION);
          localStorage.setItem("market_admin_level", data.level);
          if (data.primary) localStorage.setItem("market_admin_primary", "1");
          else localStorage.removeItem("market_admin_primary");
          localStorage.removeItem("community_profile_boitoan");
          localStorage.removeItem("community_token_boitoan");
          sessionStorage.setItem(SESSION_KEY, "1");
          if (form.remember.checked) localStorage.setItem(REMEMBER_KEY, "1");
        } catch (e) {}
        msg.className = "gate-msg ok"; msg.textContent = "Đăng nhập thành công. Đang mở Quản trị…";
        location.replace("./community-admin.html");
      }).catch(function (error) {
        button.disabled = false; msg.className = "gate-msg err";
        msg.textContent = error.code === "invalid_admin_login" ? "Mật khẩu Admin không đúng." : error.code === "admin_auth_unavailable" ? "Hệ thống xác thực Admin đang lỗi. Vui lòng tải lại sau ít phút." : "Không đăng nhập được Admin. Vui lòng thử lại.";
      });
    });
  }

  /* -------------------------- giao diện khóa -------------------------- */
  function buildUI() {
    if (APP === "boitoan" && MODE === "approval") { buildBoitoanEntryUI(); return; }
    var root = document.createElement("div");
    root.id = "gate-root";
    root.innerHTML =
      '<div class="gate-card" role="dialog" aria-modal="true" aria-label="Cổng truy cập">' +
        '<div class="gate-sigil market-gate-sigil" aria-hidden="true"><span></span></div>' +
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
        '<div class="gate-foot">Spirituality Market · Truy cập được ghi nhận</div>' +
      '</div>';
    document.body.appendChild(root);

    root.querySelector(".gate-title").textContent = TITLE;
    root.querySelector(".gate-sub").textContent = SUBTITLE;
    if (CFG.owner) {
      root.querySelector(".gate-foot").textContent =
        "Spirituality Market · Truy cập được ghi nhận";
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
        root.querySelector(".gate-sub").textContent = "Nhập tên rồi gửi — Admin sẽ duyệt qua Telegram.";
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
                  msg.textContent = "Backend chưa có khóa giải mã. Báo Admin cập nhật cấu hình.";
                  return;
                }
                openAppContent(data.key, "approved")
                  .catch(function () {
                    msg.className = "gate-msg err";
                    msg.textContent = "Khóa giải mã không khớp. Báo Admin cập nhật backend.";
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

  function startWithoutAdminReturn() {
    injectOwner(); // watermark Admin (hiện cả khi khóa lẫn sau mở khóa)
    var hasPayload = !!document.querySelector('script[type="application/gate-payload"]');

    if (hasPayload) {
      // GHI NHỚ MÁY NÀY: nếu máy này đã lưu khóa -> tự giải mã, khỏi nhập lại
      // (bền vững kể cả sau khi tắt máy vì dùng localStorage).
      var savedKey = null;
      try { savedKey = localStorage.getItem("gate_key_" + APP); } catch (e) {}
      if (savedKey) {
        openAppContent(savedKey, "saved-key")
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

  /* Bói toán V11: một state machine duy nhất cho Admin quay lại app. */
  function adminReturnRequested() {
    if (APP !== "boitoan" || !BACKEND) return false;
    try {
      return new URLSearchParams(location.search).get("admin_return") === "1"
        || !!localStorage.getItem("market_admin_token");
    } catch (e) { return false; }
  }

  function clearGateUnlockFlags() {
    try {
      sessionStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(REMEMBER_KEY);
      localStorage.removeItem("gate_key_" + APP);
    } catch (e) {}
  }

  function storeAdminSession(data) {
    localStorage.setItem("market_admin_session", "1");
    localStorage.setItem("market_admin_level", data.level);
    localStorage.setItem("market_admin_auth_version", MARKET_ADMIN_AUTH_VERSION);
    if (data.primary) localStorage.setItem("market_admin_primary", "1");
    else localStorage.removeItem("market_admin_primary");
    sessionStorage.setItem(SESSION_KEY, "1");
  }

  function cleanAdminReturnUrl() {
    try {
      var url = new URL(location.href);
      url.searchParams.delete("admin_return");
      url.searchParams.delete("v");
      history.replaceState(null, "", url.pathname + (url.search ? url.search : "") + url.hash);
    } catch (e) {}
  }

  function restoreAdminApp() {
    var token = "";
    try { token = localStorage.getItem("market_admin_token") || ""; } catch (e) {}
    if (!token) {
      clearMarketAdminSession();
      clearGateUnlockFlags();
      startWithoutAdminReturn();
      return;
    }
    fetch(BACKEND + "/api/community/admin/session", {
      headers: { authorization: "Bearer " + token, "x-owner-device-id": deviceId() },
      cache: "no-store"
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (data) {
        if (!response.ok || (data.level !== "regular" && data.level !== "primary")) {
          var error = new Error(data.error || "invalid_admin_session");
          error.status = response.status;
          throw error;
        }
        return data;
      });
    }).then(function (data) {
      storeAdminSession(data);
      return openAppContent(data.key, "admin-session");
    }).then(cleanAdminReturnUrl).catch(function () {
      clearMarketAdminSession();
      clearGateUnlockFlags();
      startWithoutAdminReturn();
    });
  }

  function start() {
    if (adminReturnRequested()) {
      injectOwner();
      restoreAdminApp();
      return;
    }
    startWithoutAdminReturn();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
