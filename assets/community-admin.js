(function () {
  "use strict";
  var BACKEND = String(window.COMMUNITY_BACKEND || "").replace(/\/+$/, "");
  /* Account V9 Admin return navigation */
  var status = document.getElementById("community-admin-state");
  var content = document.getElementById("community-admin-content");
  var logoutButton = document.getElementById("community-admin-logout");
  /* Account V6 admin level UI */
  /* Account V7 admin page session guard */
  /* Account V8 admin page contract */
  var ADMIN_AUTH_VERSION = "2026-07-24-v11";
  var token = "", deviceId = "", currentTab = "users", adminLevel = "", primary = false, adminAuthVersion = "";
  try { token = localStorage.getItem("market_admin_token") || ""; deviceId = localStorage.getItem("gate_device_id") || ""; adminLevel = localStorage.getItem("market_admin_level") || ""; primary = adminLevel === "primary"; adminAuthVersion = localStorage.getItem("market_admin_auth_version") || ""; } catch (_) {}

  function clearAdmin() {
    try {
      localStorage.removeItem("market_admin_token");
      localStorage.removeItem("market_admin_session");
      localStorage.removeItem("market_admin_primary");
      localStorage.removeItem("market_admin_level");
      localStorage.removeItem("market_admin_auth_version");
      localStorage.removeItem("gate_remember_boitoan");
      sessionStorage.removeItem("gate_ok_boitoan");
    } catch (_) {}
  }
  var backToApp = document.getElementById("community-back-to-app");
  if (backToApp) backToApp.addEventListener("click", function () {
    try { sessionStorage.setItem("gate_ok_boitoan", "1"); } catch (_) {}
  });
  function returnToLogin() { clearAdmin(); location.replace("./?admin=1&reauth=1"); }
  if (!token || !deviceId || adminAuthVersion !== ADMIN_AUTH_VERSION) { returnToLogin(); return; }
  if (content) content.hidden = true;
  document.querySelectorAll("[data-admin-tab]").forEach(function(node){node.hidden=true;});

  function el(tag, text, cls) { var node = document.createElement(tag); if (text !== undefined && text !== null) node.textContent = String(text); if (cls) node.className = cls; return node; }
  function button(text, cls, handler) { var node = el("button", text, cls); node.type = "button"; node.addEventListener("click", handler); return node; }
  function setStatus(text, error) { status.textContent = text || ""; status.classList.toggle("error", !!error); }
  function headers(extra) { return Object.assign({ authorization: "Bearer " + token, "x-owner-device-id": deviceId }, extra || {}); }
  function api(path, options) {
    options = options || {}; options.headers = headers(options.headers);
    return fetch(BACKEND + path, options).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (data) {
        if (!response.ok) {
          if (response.status === 401) { returnToLogin(); throw new Error("unauthorized"); }
          var error = new Error(data.error || "HTTP " + response.status); error.status = response.status; throw error;
        }
        return data;
      });
    });
  }
  function formatDate(value) { return value ? new Date(value).toLocaleString("vi-VN") : ""; }
  function table(headersList) { var wrap=el("div",null,"community-table-wrap"), tableNode=el("table",null,"community-table"), row=el("tr"); headersList.forEach(function(name){row.append(el("th",name));}); tableNode.append(row); wrap.append(tableNode); return {wrap:wrap,table:tableNode}; }
  function cell(row, value) { var node=el("td",value); row.append(node); return node; }
  function jsonOptions(method, body) { return { method:method, headers:{"content-type":"application/json"}, body:JSON.stringify(body||{}) }; }
  function errorText(error) { if (error.message === "owner_device_required") return "Chỉ thiết bị Admin tổng được sử dụng chức năng này."; return "Không thực hiện được: " + error.message; }
  function confirmAction(text, work) { if (confirm(text)) work(); }

  function loadUsers() {
    currentTab="users"; setStatus("Đang tải tài khoản…");
    api("/api/community/admin/users").then(function(data){
      var t=table(["Tài khoản","Vai trò","Hồ sơ","Trạng thái","Thao tác"]);
      (data.users||[]).forEach(function(user){
        var row=el("tr"); cell(row,user.username+"\n"+user.display_name); cell(row,user.role==="reader"?"Reader / Người xem bói":"Khách"); cell(row,user.bio||""); cell(row,user.suspended?"Đã khóa":"Hoạt động");
        var action=cell(row,""); action.className="community-admin-actions";
        action.append(button(user.suspended?"Mở khóa":"Khóa",user.suspended?"community-secondary":"community-danger",function(){api("/api/community/admin/users/"+user.id,jsonOptions("PATCH",{suspended:!user.suspended})).then(loadUsers);}));
        if (primary) action.append(button("Xem trang cá nhân","community-secondary",function(){api("/api/community/admin/users/"+user.id+"/impersonate",{method:"POST"}).then(function(result){localStorage.setItem("community_token_boitoan",result.token);localStorage.setItem("community_profile_boitoan",JSON.stringify(result.profile));location.assign("./community.html?admin_view=profile");}).catch(function(error){setStatus(errorText(error),true);});}));
        action.append(button("Xóa tài khoản","community-danger",function(){confirmAction("Xóa tài khoản "+user.username+"? Thao tác này không thể hoàn tác.",function(){api("/api/community/admin/users/"+user.id,{method:"DELETE"}).then(loadUsers);});}));
        t.table.append(row);
      });
      content.replaceChildren(el("h2","Tài khoản member"),t.wrap); setStatus("Đã tải "+(data.users||[]).length+" tài khoản.");
    }).catch(function(error){setStatus(errorText(error),true);});
  }
  function loadReviews(){currentTab="reviews";setStatus("Đang tải đánh giá…");api("/api/community/admin/reviews").then(function(data){var t=table(["Reader","Khách","Sao","Nội dung","Lúc",""]);(data.reviews||[]).sort(function(a,b){return b.updated_at-a.updated_at;}).forEach(function(review){var row=el("tr");cell(row,review.reader_id);cell(row,review.author_name||review.author_id);cell(row,review.rating);cell(row,review.text);cell(row,formatDate(review.updated_at));cell(row,"").append(button("Xóa review","community-danger",function(){confirmAction("Xóa review này?",function(){api("/api/community/admin/reviews/"+review.reader_id+"/"+review.author_id,{method:"DELETE"}).then(loadReviews);});}));t.table.append(row);});content.replaceChildren(el("h2","Đánh giá công khai"),t.wrap);setStatus("Đã tải "+(data.reviews||[]).length+" đánh giá.");}).catch(function(error){setStatus(errorText(error),true);});}
  function loadPosts(){currentTab="posts";setStatus("Đang tải bài thảo luận…");api("/api/community/admin/posts").then(function(data){var box=el("div",null,"community-admin-posts"),form=el("form",null,"community-form");form.innerHTML='<label>Tiêu đề<input name="title" maxlength="160" required></label><label>Nội dung mở thảo luận<textarea name="text" rows="5" maxlength="5000" required></textarea></label><button class="community-primary" type="submit">Mở bài thảo luận</button><p class="community-state"></p>';form.addEventListener("submit",function(event){event.preventDefault();var submit=form.querySelector("button"),message=form.querySelector(".community-state");submit.disabled=true;message.textContent="Đang đăng…";api("/api/community/admin/posts",jsonOptions("POST",{title:form.title.value.trim(),text:form.text.value.trim()})).then(loadPosts).catch(function(error){submit.disabled=false;message.textContent=errorText(error);message.classList.add("error");});});box.append(form);(data.posts||[]).forEach(function(post){var item=el("article",null,"community-admin-post");item.append(el("h3",post.title),el("p",post.text),el("small",(post.closed?"Đã đóng · ":"")+Number(post.comment_count||0)+" bình luận · "+formatDate(post.updated_at)));var actions=el("div",null,"community-admin-actions");actions.append(button(post.closed?"Mở lại":"Đóng bài","community-secondary",function(){api("/api/community/admin/posts/"+post.id,jsonOptions("PATCH",{closed:!post.closed})).then(loadPosts);}),button("Xóa bài","community-danger",function(){confirmAction("Xóa bài thảo luận này?",function(){api("/api/community/admin/posts/"+post.id,{method:"DELETE"}).then(loadPosts);});}));item.append(actions);box.append(item);});content.replaceChildren(el("h2","Bài thảo luận chung"),box);setStatus("Đã tải bài thảo luận.");}).catch(function(error){setStatus(errorText(error),true);});}
  function loadConversations(){currentTab="conversations";setStatus("Đang tải hội thoại…");api("/api/community/admin/conversations").then(function(data){var list=el("div",null,"community-conversation-list");(data.conversations||[]).sort(function(a,b){return b.updated_at-a.updated_at;}).forEach(function(conversation){var item=button(conversation.guest_name+" ↔ "+conversation.reader_name,"community-conversation-item",function(){loadMessages(conversation);});item.append(el("small",formatDate(conversation.updated_at)));list.append(item);});if(!(data.conversations||[]).length)list.append(el("p","Chưa có hội thoại.","community-empty"));content.replaceChildren(el("h2","Hội thoại riêng"),list);setStatus("Đã tải hội thoại.");}).catch(function(error){content.replaceChildren(el("h2","Hội thoại riêng"),el("p",errorText(error),"community-state error"));setStatus(errorText(error),true);});}
  function loadMessages(conversation){setStatus("Đang tải nội dung hội thoại…");api("/api/community/admin/conversations/"+conversation.id+"/messages").then(function(data){var back=button("← Danh sách hội thoại","community-secondary",loadConversations),list=el("div",null,"community-chat-messages");(data.messages||[]).forEach(function(message){var item=el("article",null,"community-message"+(message.type==="reading"?" reading":""));item.append(el("strong",message.sender_name+" · "+message.sender_role),el("span",message.text),el("small",formatDate(message.created_at)));list.append(item);});content.replaceChildren(back,el("h2",conversation.guest_name+" ↔ "+conversation.reader_name),list);setStatus("Đã tải "+(data.messages||[]).length+" tin nhắn.");}).catch(function(error){setStatus(errorText(error),true);});}
  function activateTab(tab){if(tab==="conversations"&&!primary)tab="users";document.querySelectorAll("[data-admin-tab]").forEach(function(node){node.classList.toggle("active",node.dataset.adminTab===tab);});if(tab==="users")loadUsers();else if(tab==="reviews")loadReviews();else if(tab==="posts")loadPosts();else loadConversations();}
  document.querySelectorAll("[data-admin-tab]").forEach(function(node){node.addEventListener("click",function(){activateTab(node.dataset.adminTab);});});
  logoutButton.addEventListener("click",function(){fetch(BACKEND+"/api/community/admin/session",{method:"DELETE",headers:headers()}).catch(function(){}).finally(function(){returnToLogin();});});
  api("/api/community/admin/session").then(function(data){
    adminLevel=data.level||"regular";primary=!!data.primary&&adminLevel==="primary";
    try{localStorage.setItem("market_admin_level",adminLevel);localStorage.setItem("market_admin_auth_version",ADMIN_AUTH_VERSION);if(primary)localStorage.setItem("market_admin_primary","1");else localStorage.removeItem("market_admin_primary");}catch(_){}
    document.querySelectorAll("[data-admin-tab]").forEach(function(node){node.hidden=node.dataset.adminTab==="conversations"&&!primary;});
    if(content)content.hidden=false;
    var badge=document.getElementById("community-admin-level-badge"),description=document.getElementById("community-admin-level-description"),conversationTab=document.querySelector('[data-admin-tab="conversations"]');
    if(badge)badge.textContent=primary?"Admin tổng":"Admin";
    if(description)description.textContent=primary?"Toàn quyền quản trị, gồm hội thoại và trang cá nhân member.":"Quản trị tài khoản, đánh giá và bài thảo luận.";
    if(conversationTab)conversationTab.hidden=!primary;
    activateTab("users");
  }).catch(function(error){setStatus(errorText(error),true);});
}());
