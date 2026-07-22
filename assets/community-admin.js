(function () {
  "use strict";
  var BACKEND = String(window.COMMUNITY_BACKEND || "").replace(/\/+$/, "");
  var form = document.getElementById("community-admin-login");
  var tokenInput = document.getElementById("community-admin-token");
  var status = document.getElementById("community-admin-state");
  var content = document.getElementById("community-admin-content");
  var bindButton = document.getElementById("community-bind-owner");
  var deviceId = "";
  try { deviceId = localStorage.getItem("gate_device_id") || ""; } catch (_) {}
  document.getElementById("community-owner-device-id").textContent = deviceId || "Thiết bị này chưa có mã cổng Bói toán.";
  var currentTab = "users";

  function el(tag, text, cls) { var node = document.createElement(tag); if (text !== undefined) node.textContent = String(text); if (cls) node.className = cls; return node; }
  function button(text, cls, handler) { var node = el("button", text, cls); node.type = "button"; node.addEventListener("click", handler); return node; }
  function setStatus(text, error) { status.textContent = text || ""; status.classList.toggle("error", !!error); }
  function headers(extra) {
    return Object.assign({ authorization: "Bearer " + tokenInput.value, "x-owner-device-id": deviceId }, extra || {});
  }
  function api(path, options) {
    options = options || {}; options.headers = headers(options.headers);
    return fetch(BACKEND + path, options).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (data) {
        if (!response.ok) { var error = new Error(data.error || "HTTP " + response.status); error.status = response.status; throw error; }
        return data;
      });
    });
  }
  function formatDate(value) { return value ? new Date(value).toLocaleString("vi-VN") : ""; }
  function table(headersList) {
    var wrap = el("div", null, "community-table-wrap"), tableNode = el("table", null, "community-table"), row = el("tr");
    headersList.forEach(function (name) { row.append(el("th", name)); }); tableNode.append(row); wrap.append(tableNode); return { wrap: wrap, table: tableNode };
  }
  function cell(row, value) { var node = el("td", value); row.append(node); return node; }
  function jsonOptions(method, body) { return { method: method, headers: { "content-type": "application/json" }, body: JSON.stringify(body || {}) }; }
  function errorText(error) {
    if (error.message === "owner_device_required") return "Chỉ thiết bị chủ đã khóa mới được đọc hội thoại riêng.";
    if (error.message === "owner_device_already_bound") return "Đã có một thiết bị chủ khác được khóa. Không thể tự thay thế.";
    if (error.status === 401) return "Mật khẩu Admin không đúng.";
    return "Không tải được dữ liệu: " + error.message;
  }

  function loadUsers() {
    currentTab = "users"; setStatus("Đang tải tài khoản…");
    api("/api/community/admin/users").then(function (data) {
      var t = table(["Tài khoản", "Vai trò", "Hồ sơ", "Đánh giá", "Trạng thái", "Thao tác"]);
      (data.users || []).forEach(function (user) {
        var row = el("tr"); cell(row, user.username + "\n" + user.display_name); cell(row, user.role === "reader" ? "Reader" : "Khách");
        cell(row, user.bio || ""); cell(row, user.role === "reader" ? (Number(user.rating || 0).toFixed(1) + " / " + Number(user.review_count || 0)) : "—");
        cell(row, user.suspended ? "Đã khóa" : "Hoạt động");
        var action = cell(row, "");
        action.append(button(user.suspended ? "Mở khóa" : "Khóa", user.suspended ? "community-secondary" : "community-danger", function () {
          api("/api/community/admin/users/" + user.id, jsonOptions("PATCH", { suspended: !user.suspended })).then(loadUsers);
        }));
        t.table.append(row);
      });
      content.replaceChildren(el("h2", "Tài khoản"), t.wrap); setStatus("Đã tải " + (data.users || []).length + " tài khoản.");
    }).catch(function (error) { setStatus(errorText(error), true); });
  }

  function loadReviews() {
    currentTab = "reviews"; setStatus("Đang tải đánh giá…");
    api("/api/community/admin/reviews").then(function (data) {
      var t = table(["Reader", "Khách", "Sao", "Nội dung", "Lúc", ""]);
      (data.reviews || []).sort(function (a, b) { return b.updated_at - a.updated_at; }).forEach(function (review) {
        var row = el("tr"); cell(row, review.reader_id); cell(row, review.author_name || review.author_id); cell(row, review.rating); cell(row, review.text); cell(row, formatDate(review.updated_at));
        var action = cell(row, ""); action.append(button("Gỡ", "community-danger", function () {
          api("/api/community/admin/reviews/" + review.reader_id + "/" + review.author_id, { method: "DELETE" }).then(loadReviews);
        })); t.table.append(row);
      });
      content.replaceChildren(el("h2", "Đánh giá công khai"), t.wrap); setStatus("Đã tải " + (data.reviews || []).length + " đánh giá.");
    }).catch(function (error) { setStatus(errorText(error), true); });
  }

  function loadConversations() {
    currentTab = "conversations"; setStatus("Đang kiểm tra quyền thiết bị chủ…");
    api("/api/community/admin/conversations").then(function (data) {
      var list = el("div", null, "community-conversation-list");
      (data.conversations || []).sort(function (a, b) { return b.updated_at - a.updated_at; }).forEach(function (conversation) {
        var item = button(conversation.guest_name + " ↔ " + conversation.reader_name, "community-conversation-item", function () { loadMessages(conversation); });
        item.append(el("small", (conversation.quote_amount ? new Intl.NumberFormat("vi-VN").format(conversation.quote_amount) + " ₫ · " : "") + conversation.payment_status + " · " + formatDate(conversation.updated_at)));
        list.append(item);
      });
      if (!(data.conversations || []).length) list.append(el("p", "Chưa có hội thoại.", "community-empty"));
      content.replaceChildren(el("h2", "Hội thoại riêng trên thiết bị chủ"), list); setStatus("Đã tải hội thoại.");
    }).catch(function (error) { content.replaceChildren(el("h2", "Hội thoại riêng"), el("p", errorText(error), "community-state error")); setStatus(errorText(error), true); });
  }

  function loadMessages(conversation) {
    setStatus("Đang tải nội dung hội thoại…");
    api("/api/community/admin/conversations/" + conversation.id + "/messages").then(function (data) {
      var back = button("← Danh sách hội thoại", "community-secondary", loadConversations);
      var list = el("div", null, "community-chat-messages");
      (data.messages || []).forEach(function (message) {
        var item = el("article", null, "community-message" + (message.type === "reading" ? " reading" : ""));
        item.append(el("strong", message.sender_name + " · " + message.sender_role), el("span", message.text), el("small", formatDate(message.created_at))); list.append(item);
      });
      content.replaceChildren(back, el("h2", conversation.guest_name + " ↔ " + conversation.reader_name), list); setStatus("Đã tải " + (data.messages || []).length + " tin nhắn.");
    }).catch(function (error) { setStatus(errorText(error), true); });
  }

  function activateTab(tab) {
    document.querySelectorAll("[data-admin-tab]").forEach(function (node) { node.classList.toggle("active", node.dataset.adminTab === tab); });
    if (tab === "users") loadUsers(); else if (tab === "reviews") loadReviews(); else loadConversations();
  }

  form.addEventListener("submit", function (event) { event.preventDefault(); activateTab(currentTab); });
  document.querySelectorAll("[data-admin-tab]").forEach(function (node) { node.addEventListener("click", function () { activateTab(node.dataset.adminTab); }); });
  bindButton.addEventListener("click", function () {
    if (!deviceId) { setStatus("Thiết bị này chưa có mã cổng Bói toán.", true); return; }
    api("/api/community/admin/bind-owner-device", jsonOptions("POST", { device_id: deviceId })).then(function () { setStatus("Đã khóa thiết bị chủ này. Chỉ thiết bị này được đọc hội thoại riêng."); }).catch(function (error) { setStatus(errorText(error), true); });
  });
}());
