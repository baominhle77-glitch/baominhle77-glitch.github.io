(function () {
  "use strict";

  var BACKEND = String(window.COMMUNITY_BACKEND || "").replace(/\/+$/, "");
  var APP = document.getElementById("community-app");
  var ACCOUNT_BUTTON = document.getElementById("community-account-button");
  var GATE_TOKEN_KEY = "gate_token_boitoan";
  var COMMUNITY_TOKEN_KEY = "community_token_boitoan";
  var state = { profile: null, readers: [], conversations: [], activeConversation: null, poll: null };

  function getStorage(key) { try { return localStorage.getItem(key) || ""; } catch (_) { return ""; } }
  function setStorage(key, value) { try { if (value) localStorage.setItem(key, value); else localStorage.removeItem(key); } catch (_) {} }
  function saveProfile(profile) { state.profile = profile || null; setStorage("community_profile_boitoan", profile ? JSON.stringify(profile) : ""); return state.profile; }
  function roleLabel(role) { return role === "reader" ? "Reader / Người xem bói" : role === "guest" ? "Khách" : "Admin"; }
  function tokenClaims() { try { var token=getStorage(COMMUNITY_TOKEN_KEY), part=token.split(".")[1].replace(/-/g,"+").replace(/_/g,"/"); return JSON.parse(atob(part+"=".repeat((4-part.length%4)%4))); } catch (_) { return {}; } }
  function uuid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    var bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
    var hex = Array.prototype.map.call(bytes, function (b) { return b.toString(16).padStart(2, "0"); }).join("");
    return hex.slice(0, 8) + "-" + hex.slice(8, 12) + "-" + hex.slice(12, 16) + "-" + hex.slice(16, 20) + "-" + hex.slice(20);
  }
  function el(tag, text, cls) {
    var node = document.createElement(tag);
    if (text !== undefined && text !== null) node.textContent = String(text);
    if (cls) node.className = cls;
    return node;
  }
  function button(text, cls, handler) {
    var node = el("button", text, cls || "community-secondary");
    node.type = "button";
    if (handler) node.addEventListener("click", handler);
    return node;
  }
  function clearPoll() { if (state.poll) clearTimeout(state.poll); state.poll = null; }
  function formatDate(value) { try { return new Date(value).toLocaleString("vi-VN"); } catch (_) { return ""; } }
  function formatMoney(value) { return new Intl.NumberFormat("vi-VN").format(Number(value || 0)) + " ₫"; }
  function setMessage(node, text, error) { node.textContent = text || ""; node.classList.toggle("error", !!error); }

  function api(path, options, tokenMode) {
    options = options || {};
    var token = tokenMode === "gate" ? getStorage(GATE_TOKEN_KEY) : getStorage(COMMUNITY_TOKEN_KEY);
    options.headers = Object.assign({}, options.headers || {}, token ? { authorization: "Bearer " + token } : {});
    return fetch(BACKEND + path, options).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (data) {
        if (!response.ok) {
          var error = new Error(data.error || ("HTTP " + response.status));
          error.status = response.status; error.data = data;
          throw error;
        }
        return data;
      });
    });
  }
  function jsonOptions(method, body) {
    return { method: method, headers: { "content-type": "application/json" }, body: JSON.stringify(body || {}) };
  }
  function humanError(error) {
    var code = error && error.message;
    var map = {
      gate_approval_required: "Phiên duyệt truy cập đã hết hạn. Hãy quay lại trang Bói toán và xin duyệt lại.",
      invalid_login: "Tên đăng nhập hoặc mật khẩu không đúng.",
      username_exists: "Tên đăng nhập đã được sử dụng.",
      invalid_account: "Thông tin tài khoản chưa hợp lệ. Mật khẩu cần ít nhất 8 ký tự.",
      links_not_allowed: "Hồ sơ Reader không được chứa đường dẫn.",
      invalid_qr: "Ảnh QR không hợp lệ hoặc dung lượng quá lớn.",
      unauthorized: "Phiên đăng nhập đã hết hạn.",
      guest_only: "Chức năng này chỉ dành cho tài khoản Khách.",
      reader_only: "Chức năng này chỉ dành cho Reader.",
      rate_limited: "Bạn thao tác quá nhanh. Hãy thử lại sau.",
      reader_not_found: "Không tìm thấy Reader này.",
      invalid_review: "Đánh giá cần từ 1–5 sao và có nội dung.",
      community_server: "Hệ thống tạm thời chưa xử lý được yêu cầu."
    };
    return map[code] || "Không thực hiện được. Vui lòng thử lại.";
  }

  function fileToDataUrl(file) {
    if (!file) return Promise.resolve("");
    if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 160000) return Promise.reject(new Error("invalid_qr"));
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(String(reader.result || "")); };
      reader.onerror = function () { reject(new Error("invalid_qr")); };
      reader.readAsDataURL(file);
    });
  }

  function renderAuth() {
    clearPoll(); state.profile = null; ACCOUNT_BUTTON.hidden = true;
    APP.replaceChildren(document.getElementById("community-auth-template").content.cloneNode(true));
    var login = document.getElementById("community-login-form");
    var register = document.getElementById("community-register-form");
    var readerFields = register.querySelector(".community-reader-fields");
    register.querySelectorAll('input[name="role"]').forEach(function (input) {
      input.addEventListener("change", function () { readerFields.hidden = register.role.value !== "reader"; });
    });

    login.addEventListener("submit", function (event) {
      event.preventDefault();
      var status = login.querySelector(".community-state");
      var submit = login.querySelector("button[type=submit]");
      submit.disabled = true; setMessage(status, "Đang đăng nhập…");
      api("/api/community/login", jsonOptions("POST", {
        username: login.username.value.trim(), password: login.password.value
      }), "gate").then(function (data) {
        setStorage(COMMUNITY_TOKEN_KEY, data.token); saveProfile(data.profile); return loadDashboard();
      }).catch(function (error) {
        submit.disabled = false; setMessage(status, humanError(error), true);
      });
    });

    register.addEventListener("submit", function (event) {
      event.preventDefault();
      var status = register.querySelector(".community-state");
      var submit = register.querySelector("button[type=submit]");
      submit.disabled = true; setMessage(status, "Đang tạo tài khoản…");
      fileToDataUrl(register.qr_file && register.qr_file.files[0]).then(function (qr) {
        return api("/api/community/register", jsonOptions("POST", {
          role: register.role.value,
          username: register.username.value.trim().toLowerCase(),
          password: register.password.value,
          display_name: register.display_name.value.trim(),
          bio: register.bio.value.trim(),
          specialties: register.specialties ? register.specialties.value : "",
          bank_name: register.bank_name ? register.bank_name.value.trim() : "",
          account_number: register.account_number ? register.account_number.value.trim() : "",
          account_name: register.account_name ? register.account_name.value.trim() : "",
          qr_data: qr
        }), "gate");
      }).then(function (data) {
        setStorage(COMMUNITY_TOKEN_KEY, data.token); saveProfile(data.profile); return loadDashboard();
      }).catch(function (error) {
        submit.disabled = false; setMessage(status, humanError(error), true);
      });
    });
  }

  function topTabs(active) {
    var nav = el("nav", null, "community-tabs");
    var entries = [["posts", "Thảo luận", renderPosts]];
    if (state.profile.role === "guest") entries.push(["readers", "Reader", renderReaders]);
    entries.push(["conversations", state.profile.role === "reader" ? "Khách hàng" : "Trò chuyện", renderConversations]);
    entries.push(["profile", "Trang cá nhân", renderProfile]);
    entries.forEach(function (item) {
      var tab = button(item[1], item[0] === active ? "active" : "", item[2]);
      tab.className = item[0] === active ? "active" : "";
      nav.appendChild(tab);
    });
    return nav;
  }

  function dashboardHeader() {
    var wrap = el("div", null, "community-dashboard-head");
    var identity = el("div", null, "community-account-identity");
    var avatar = el("span", (state.profile.display_name || state.profile.username || "?").trim().slice(0, 1).toUpperCase(), "community-avatar");
    var text = el("div");
    var titleLine = el("div", null, "community-name-line");
    titleLine.append(el("h1", "Xin chào, " + state.profile.display_name), el("span", roleLabel(state.profile.role), "community-role-badge role-" + state.profile.role));
    text.append(titleLine, el("p", state.profile.role === "reader" ? "Quản lý hồ sơ, khách hàng và nội dung luận giải." : "Tìm Reader, trò chuyện, đánh giá và tham gia thảo luận."));
    identity.append(avatar, text);
    var impersonating = tokenClaims().mode === "impersonation";
    var logout = button(impersonating ? "Quay lại Admin" : "Đăng xuất", "community-secondary", function () {
      setStorage(COMMUNITY_TOKEN_KEY, ""); saveProfile(null);
      if (impersonating) { if (history.length > 1) history.back(); else location.assign("./community-admin.html"); return; }
      renderAuth();
    });
    wrap.append(identity, logout);
    return wrap;
  }

  function loadDashboard() {
    ACCOUNT_BUTTON.hidden = false;
    ACCOUNT_BUTTON.onclick = renderProfile;
    return Promise.all([api("/api/community/posts"), api("/api/community/conversations"), state.profile.role === "guest" ? api("/api/community/readers") : Promise.resolve({ readers: [] })]).then(function (results) {
      state.posts = results[0].posts || [];
      state.conversations = results[1].conversations || [];
      state.readers = results[2].readers || [];
      var requestedView = new URLSearchParams(location.search).get("admin_view");
      if (tokenClaims().mode === "impersonation" && requestedView === "profile") renderProfile();
      else if (state.profile.role === "reader") renderConversations(); else renderReaders();
    }).catch(function (error) {
      if (error.status === 401) { setStorage(COMMUNITY_TOKEN_KEY, ""); saveProfile(null); renderAuth(); return; }
      APP.replaceChildren(el("section", humanError(error), "community-card community-state error"));
    });
  }

  function renderPosts() {
    clearPoll();
    var card = el("section", null, "community-card");
    card.append(dashboardHeader(), topTabs("posts"), el("h2", "Thảo luận chung"));
    var list = el("div", null, "community-post-list");
    if (!state.posts || !state.posts.length) list.append(el("p", "Admin chưa mở bài thảo luận nào.", "community-empty"));
    (state.posts || []).forEach(function (post) {
      var item = button(post.title, "community-post-card", function () { openPost(post.id); });
      item.append(el("p", post.text.length > 220 ? post.text.slice(0, 217) + "…" : post.text), el("small", (post.closed ? "Đã đóng · " : "") + Number(post.comment_count || 0) + " bình luận · " + formatDate(post.updated_at || post.created_at)));
      list.append(item);
    });
    card.append(list); APP.replaceChildren(card);
  }

  function openPost(id) {
    clearPoll(); APP.replaceChildren(el("section", "Đang tải bài thảo luận…", "community-card"));
    api("/api/community/posts/" + encodeURIComponent(id)).then(function (data) {
      var card = el("section", null, "community-card");
      card.append(button("← Thảo luận", "community-secondary", renderPosts), dashboardHeader(), topTabs("posts"));
      card.append(el("h2", data.post.title), el("p", data.post.text, "community-post-body"));
      var comments = el("div", null, "community-comment-list");
      (data.comments || []).forEach(function (comment) {
        var row = el("article", null, "community-comment");
        var head = el("div", null, "community-comment-head");
        head.append(el("strong", comment.author_name), el("span", roleLabel(comment.author_role), "community-role-badge role-" + comment.author_role));
        row.append(head, el("p", comment.text), el("small", formatDate(comment.created_at))); comments.append(row);
      });
      if (!(data.comments || []).length) comments.append(el("p", "Chưa có bình luận.", "community-empty"));
      card.append(comments);
      if (!data.post.closed && tokenClaims().mode !== "impersonation") {
        var form = el("form", null, "community-form community-comment-form");
        form.innerHTML = '<label>Tham gia thảo luận<textarea name="text" rows="4" maxlength="2000" required></textarea></label><button class="community-primary" type="submit">Đăng bình luận</button><p class="community-state" role="status"></p>';
        form.addEventListener("submit", function (event) {
          event.preventDefault(); var submit=form.querySelector("button"), status=form.querySelector(".community-state"); submit.disabled=true; setMessage(status,"Đang đăng…");
          api("/api/community/posts/" + encodeURIComponent(id) + "/comments", jsonOptions("POST", { text: form.text.value.trim() })).then(function () { return api("/api/community/posts"); }).then(function (posts) { state.posts=posts.posts||[]; openPost(id); }).catch(function (error) { submit.disabled=false; setMessage(status,humanError(error),true); });
        });
        card.append(form);
      } else if (data.post.closed) card.append(el("p", "Bài thảo luận đã được Admin đóng.", "community-state"));
      APP.replaceChildren(card);
    }).catch(function (error) { APP.replaceChildren(el("section", humanError(error), "community-card community-state error")); });
  }

  function readerCard(reader) {
    var card = el("article", null, "community-reader-card");
    var readerTitle = el("div", null, "community-name-line"); readerTitle.append(el("h3", reader.display_name), el("span", "Reader", "community-role-badge role-reader")); card.append(readerTitle);
    card.append(el("div", "★ " + Number(reader.rating || 0).toFixed(1) + " · " + Number(reader.review_count || 0) + " đánh giá", "community-rating"));
    var bio = reader.bio || "Reader chưa thêm phần giới thiệu.";
    card.append(el("p", bio.length > 170 ? bio.slice(0, 167) + "…" : bio));
    var badges = el("div", null, "community-badges");
    (reader.specialties || []).slice(0, 6).forEach(function (name) { badges.append(el("span", name, "community-badge")); });
    card.append(badges);
    card.append(button("Xem hồ sơ", "community-primary", function () { openReader(reader.id); }));
    return card;
  }

  function renderReaders() {
    clearPoll();
    var card = el("section", null, "community-card");
    card.append(dashboardHeader(), topTabs("readers"));
    var grid = el("div", null, "community-reader-grid");
    if (!state.readers.length) grid.append(el("p", "Chưa có Reader nào tạo hồ sơ.", "community-empty"));
    state.readers.forEach(function (reader) { grid.append(readerCard(reader)); });
    card.append(grid); APP.replaceChildren(card);
  }

  function openReader(readerId) {
    clearPoll();
    APP.replaceChildren(el("section", "Đang tải hồ sơ…", "community-card"));
    api("/api/community/readers/" + encodeURIComponent(readerId)).then(function (data) {
      var reader = data.reader, reviews = data.reviews || [];
      var card = el("section", null, "community-card");
      card.append(button("← Danh sách Reader", "community-secondary", renderReaders));
      var grid = el("div", null, "community-profile-grid");
      var main = el("div");
      main.append(el("h1", reader.display_name));
      main.append(el("div", "★ " + Number(reader.rating || 0).toFixed(1) + " · " + Number(reader.review_count || 0) + " đánh giá", "community-rating"));
      main.append(el("p", reader.bio || "Reader chưa thêm phần giới thiệu."));
      var badges = el("div", null, "community-badges");
      (reader.specialties || []).forEach(function (name) { badges.append(el("span", name, "community-badge")); });
      main.append(badges);
      if (state.profile.role === "guest") main.append(button("Trò chuyện với Reader", "community-primary", function () { startConversation(reader.id); }));

      var pay = el("aside", null, "community-payment-box");
      pay.append(el("h2", "Thông tin nhận phí"));
      if (reader.bank && (reader.bank.bank_name || reader.bank.account_number || reader.bank.account_name || reader.bank.qr_data)) {
        var dl = el("dl");
        [["Ngân hàng", reader.bank.bank_name], ["Số tài khoản", reader.bank.account_number], ["Chủ tài khoản", reader.bank.account_name]].forEach(function (row) {
          if (!row[1]) return; dl.append(el("dt", row[0]), el("dd", row[1]));
        });
        pay.append(dl);
        if (reader.bank.qr_data) { var img = el("img"); img.src = reader.bank.qr_data; img.alt = "QR nhận tiền của " + reader.display_name; img.className = "community-qr"; pay.append(img); }
      } else pay.append(el("p", "Reader chưa công khai thông tin nhận phí."));
      grid.append(main, pay); card.append(grid);
      card.append(renderReviews(reader, reviews)); APP.replaceChildren(card);
    }).catch(function (error) { APP.replaceChildren(el("section", humanError(error), "community-card community-state error")); });
  }

  function renderReviews(reader, reviews) {
    var section = el("section");
    section.append(el("h2", "Đánh giá"));
    if (state.profile.role === "guest") {
      var mine = reviews.find(function (r) { return r.author_id === state.profile.id; });
      var form = el("form", null, "community-form");
      form.innerHTML = '<label>Số sao<select name="rating"><option value="5">5 sao</option><option value="4">4 sao</option><option value="3">3 sao</option><option value="2">2 sao</option><option value="1">1 sao</option></select></label><label>Nội dung đánh giá<textarea name="text" rows="4" maxlength="1500" required></textarea></label><button class="community-primary" type="submit">Đăng đánh giá</button><p class="community-state" role="status"></p>';
      if (mine) { form.rating.value = String(mine.rating); form.text.value = mine.text; form.querySelector("button").textContent = "Cập nhật đánh giá"; }
      form.addEventListener("submit", function (event) {
        event.preventDefault(); var status = form.querySelector(".community-state");
        api("/api/community/readers/" + reader.id + "/reviews", jsonOptions("POST", { rating: Number(form.rating.value), text: form.text.value.trim() })).then(function () { openReader(reader.id); }).catch(function (error) { setMessage(status, humanError(error), true); });
      });
      if (mine) form.append(button("Gỡ đánh giá của tôi", "community-danger", function () {
        api("/api/community/readers/" + reader.id + "/reviews", { method: "DELETE" }).then(function () { openReader(reader.id); });
      }));
      section.append(form);
    }
    var list = el("div", null, "community-review-list");
    reviews.forEach(function (review) {
      var item = el("article", null, "community-review");
      var head = el("header"); head.append(el("strong", review.author_name), el("span", "★".repeat(review.rating), "community-rating"));
      item.append(head, el("p", review.text), el("small", formatDate(review.updated_at)));
      list.append(item);
    });
    if (!reviews.length) list.append(el("p", "Chưa có đánh giá.", "community-empty"));
    section.append(list); return section;
  }

  function startConversation(readerId) {
    api("/api/community/conversations", jsonOptions("POST", { reader_id: readerId })).then(function (data) {
      return api("/api/community/conversations").then(function (list) {
        state.conversations = list.conversations || []; openConversation(data.conversation.id);
      });
    }).catch(function (error) { alert(humanError(error)); });
  }

  function renderConversations() {
    clearPoll();
    api("/api/community/conversations").then(function (data) {
      state.conversations = data.conversations || [];
      var card = el("section", null, "community-card"); card.append(dashboardHeader(), topTabs("conversations"));
      var list = el("div", null, "community-conversation-list");
      state.conversations.forEach(function (conversation) {
        var other = state.profile.id === conversation.reader_id ? conversation.guest_name : conversation.reader_name;
        var item = button(other, "community-conversation-item", function () { openConversation(conversation.id); });
        item.append(el("small", conversation.quote_amount ? formatMoney(conversation.quote_amount) + " · " + paymentLabel(conversation.payment_status) : "Chưa báo phí"));
        list.append(item);
      });
      if (!state.conversations.length) list.append(el("p", "Chưa có hội thoại nào.", "community-empty"));
      card.append(list); APP.replaceChildren(card);
    }).catch(function (error) { APP.replaceChildren(el("section", humanError(error), "community-card community-state error")); });
  }

  function paymentLabel(value) {
    return ({ none: "Chưa báo phí", quoted: "Đã báo phí", customer_reported: "Khách báo đã chuyển", confirmed: "Reader đã xác nhận" })[value] || value;
  }

  function openConversation(id) {
    clearPoll(); state.activeConversation = id;
    Promise.all([
      api("/api/community/conversations/" + encodeURIComponent(id)),
      api("/api/community/conversations/" + encodeURIComponent(id) + "/messages")
    ]).then(function (results) { renderChat(results[0].conversation, results[1].messages || []); });
  }

  function renderChat(conversation, messages) {
    var layout = el("section", null, "community-card community-chat-layout");
    var side = el("aside", null, "community-chat-sidebar");
    side.append(button("← Hội thoại", "community-secondary", renderConversations), el("h3", "Các cuộc trò chuyện"));
    state.conversations.forEach(function (item) {
      var other = state.profile.id === item.reader_id ? item.guest_name : item.reader_name;
      side.append(button(other, "community-conversation-item", function () { openConversation(item.id); }));
    });
    var main = el("div", null, "community-chat-main");
    var head = el("header", null, "community-chat-head");
    var otherName = state.profile.id === conversation.reader_id ? conversation.guest_name : conversation.reader_name;
    head.append(el("h2", otherName), el("small", "Tin nhắn tự xóa sau tối đa 30 ngày"));
    if (conversation.quote_amount) head.append(el("div", formatMoney(conversation.quote_amount) + " · " + paymentLabel(conversation.payment_status), "community-quote"));
    var list = el("div", null, "community-chat-messages"); list.setAttribute("aria-live", "polite");
    function renderMessageItems(items) {
      list.replaceChildren();
      (items || []).forEach(function (message) {
        var item = el("article", null, "community-message" + (message.sender_id === state.profile.id ? " mine" : "") + (message.type === "reading" ? " reading" : ""));
        item.append(el("strong", message.sender_name + (message.type === "reading" ? " · Luận giải" : "")), el("span", message.text), el("small", formatDate(message.created_at)));
        list.append(item);
      });
      list.scrollTop = list.scrollHeight;
    }
    renderMessageItems(messages);
    var compose = el("form", null, "community-chat-compose");
    var input = el("textarea"); input.rows = 2; input.maxLength = 3000; input.required = true; input.placeholder = "Nhập tin nhắn…";
    var send = el("button", "Gửi", "community-primary"); send.type = "submit"; compose.append(input, send);
    compose.addEventListener("submit", function (event) {
      event.preventDefault(); var text = input.value.trim(); if (!text) return; send.disabled = true;
      sendMessage(conversation.id, text, "text").then(function () { input.value = ""; openConversation(conversation.id); }).catch(function (error) { send.disabled = false; alert(humanError(error)); });
    });
    main.append(head, list, compose);
    var tools = el("div", null, "community-chat-tools");
    if (state.profile.id === conversation.reader_id) {
      var quoteForm = el("form", null, "community-quote-form");
      var amount = el("input"); amount.type = "number"; amount.min = "1"; amount.max = "1000000000"; amount.placeholder = "Nhập phí (VND)";
      var quoteButton = el("button", "Báo phí", "community-secondary"); quoteButton.type = "submit"; quoteForm.append(amount, quoteButton);
      quoteForm.addEventListener("submit", function (event) {
        event.preventDefault(); api("/api/community/conversations/" + conversation.id + "/quote", jsonOptions("POST", { amount: Number(amount.value) })).then(function () { openConversation(conversation.id); });
      });
      tools.append(quoteForm);
      tools.append(button("Gửi nội dung luận giải", "community-secondary", function () {
        var text = prompt("Nhập nội dung luận giải:"); if (!text || !text.trim()) return;
        sendMessage(conversation.id, text.trim(), "reading").then(function () { openConversation(conversation.id); });
      }));
      if (conversation.payment_status === "customer_reported") tools.append(button("Xác nhận đã nhận phí", "community-primary", function () {
        api("/api/community/conversations/" + conversation.id + "/confirm-payment", jsonOptions("POST", {})).then(function () { openConversation(conversation.id); });
      }));
    } else if (conversation.quote_amount && conversation.payment_status !== "confirmed") {
      tools.append(button("Tôi đã chuyển khoản", "community-primary", function () {
        api("/api/community/conversations/" + conversation.id + "/payment-notice", jsonOptions("POST", {})).then(function () { openConversation(conversation.id); });
      }));
    }
    main.append(tools); layout.append(side, main); APP.replaceChildren(layout);
    var lastMessageId = messages.length ? messages[messages.length - 1].id : "";
    function pollMessages() {
      if (state.activeConversation !== conversation.id) return;
      api("/api/community/conversations/" + conversation.id + "/messages").then(function (data) {
        if (state.activeConversation !== conversation.id) return;
        var next = data.messages || [];
        var nextLastId = next.length ? next[next.length - 1].id : "";
        if (next.length !== messages.length || nextLastId !== lastMessageId) {
          messages = next;
          lastMessageId = nextLastId;
          renderMessageItems(messages);
        }
        state.poll = setTimeout(pollMessages, 1500);
      }).catch(function () { state.poll = setTimeout(pollMessages, 3000); });
    }
    state.poll = setTimeout(pollMessages, 1500);
  }

  function sendMessage(id, text, type) {
    return api("/api/community/conversations/" + id + "/messages", jsonOptions("POST", { client_id: uuid(), text: text, type: type }));
  }

  function renderProfile() {
    clearPoll();
    var adminView = tokenClaims().mode === "impersonation";
    function leaveAdminView() {
      setStorage(COMMUNITY_TOKEN_KEY, ""); saveProfile(null);
      if (history.length > 1) history.back(); else location.assign("./community-admin.html");
    }
    var card = el("section", null, "community-card");
    card.append(dashboardHeader(), topTabs("profile"), el("h2", "Trang cá nhân"));
    if (adminView) {
      var notice = el("div", null, "community-state");
      notice.append(el("strong", "Admin tổng đang xem trang cá nhân của " + (state.profile.display_name || state.profile.username)), el("span", " · Chế độ chỉ đọc"));
      card.append(notice, button("← Quay lại khu vực Admin", "community-secondary", leaveAdminView));
    }
    var form = el("form", null, "community-form");
    if (adminView) {
      var username = el("input"); username.value = state.profile.username || ""; username.disabled = true;
      var usernameLabel = el("label", "Tên đăng nhập"); usernameLabel.append(username); form.append(usernameLabel);
    }
    var display = el("input"); display.name = "display_name"; display.maxLength = 80; display.required = true; display.value = state.profile.display_name || "";
    var bio = el("textarea"); bio.name = "bio"; bio.maxLength = 1000; bio.rows = 5; bio.value = state.profile.bio || "";
    var displayLabel = el("label", "Tên hiển thị"); displayLabel.append(display);
    var bioLabel = el("label", "Giới thiệu bản thân"); bioLabel.append(bio);
    form.append(displayLabel, bioLabel);
    var specialties, bankName, accountNumber, accountName, qrFile;
    if (state.profile.role === "reader") {
      specialties = el("input"); specialties.value = (state.profile.specialties || []).join(", "); specialties.maxLength = 500;
      bankName = el("input"); bankName.value = state.profile.bank && state.profile.bank.bank_name || "";
      accountNumber = el("input"); accountNumber.value = state.profile.bank && state.profile.bank.account_number || "";
      accountName = el("input"); accountName.value = state.profile.bank && state.profile.bank.account_name || "";
      qrFile = el("input"); qrFile.type = "file"; qrFile.accept = "image/png,image/jpeg,image/webp";
      [["Mảng chuyên sâu", specialties], ["Ngân hàng", bankName], ["Số tài khoản", accountNumber], ["Tên chủ tài khoản", accountName], ["Thay ảnh QR", qrFile]].forEach(function (pair) { var label = el("label", pair[0]); label.append(pair[1]); form.append(label); });
      if (adminView && state.profile.bank && state.profile.bank.qr_data) {
        var qr = el("img"); qr.src = state.profile.bank.qr_data; qr.alt = "QR của " + state.profile.display_name; qr.className = "community-qr";
        var qrLabel = el("div", null, "community-payment-box"); qrLabel.append(el("strong", "QR hiện tại"), qr); form.append(qrLabel);
      }
    }
    if (adminView) {
      [display, bio, specialties, bankName, accountNumber, accountName, qrFile].filter(Boolean).forEach(function (control) { control.disabled = true; });
      form.append(el("p", "Đây là toàn bộ trang cá nhân của member theo dữ liệu hiện có. Admin tổng không thể sửa dưới danh nghĩa member.", "community-state"));
      card.append(form); APP.replaceChildren(card); return;
    }
    var submit = el("button", "Lưu thay đổi", "community-primary"); submit.type = "submit";
    var status = el("p", "", "community-state"); form.append(submit, status); card.append(form); APP.replaceChildren(card);
    form.addEventListener("submit", function (event) {
      event.preventDefault(); submit.disabled = true; setMessage(status, "Đang lưu…");
      var oldQr = state.profile.bank && state.profile.bank.qr_data || "";
      fileToDataUrl(qrFile && qrFile.files[0]).then(function (newQr) {
        return api("/api/community/me", jsonOptions("PUT", {
          display_name: display.value.trim(), bio: bio.value.trim(),
          specialties: specialties ? specialties.value : [], bank_name: bankName ? bankName.value.trim() : "",
          account_number: accountNumber ? accountNumber.value.trim() : "", account_name: accountName ? accountName.value.trim() : "",
          qr_data: newQr || oldQr
        }));
      }).then(function (data) { saveProfile(data.profile); setMessage(status, "Đã lưu."); submit.disabled = false; }).catch(function (error) { submit.disabled = false; setMessage(status, humanError(error), true); });
    });
  }

  function boot() {
    if (!BACKEND) { APP.replaceChildren(el("section", "Thiếu cấu hình backend.", "community-card community-state error")); return; }
    var communityToken = getStorage(COMMUNITY_TOKEN_KEY);
    if (!state.posts) state.posts = [];
    if (communityToken) {
      api("/api/community/me").then(function (data) { saveProfile(data.profile); return loadDashboard(); }).catch(function () { setStorage(COMMUNITY_TOKEN_KEY, ""); renderAuth(); });
      return;
    }
    if (!getStorage(GATE_TOKEN_KEY)) {
      var card = el("section", null, "community-card");
      card.append(el("h1", "Cần phiên truy cập đã được duyệt"), el("p", "Hãy quay lại trang Bói toán, chọn Khách và gửi yêu cầu duyệt trước khi tạo hoặc đăng nhập tài khoản."));
      var link = el("a", "Quay lại trang Bói toán", "community-primary"); link.href = "./"; link.style.display = "inline-flex"; link.style.textDecoration = "none"; card.append(link); APP.replaceChildren(card); return;
    }
    renderAuth();
  }

  /* Admin total member profile view */
  boot();
}());
