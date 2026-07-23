import { readFile, writeFile } from "node:fs/promises";

async function edit(path, mutate) {
  const before = await readFile(path, "utf8");
  const after = mutate(before);
  if (after !== before) await writeFile(path, after, "utf8");
}

function replaceRange(source, startMarker, endMarker, replacement, label) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) throw new Error(`Không tìm thấy khối ${label}`);
  return source.slice(0, start) + replacement + source.slice(end);
}

await edit("backend/community.js", (source) => {
  if (source.includes("/* Account V5 single admin session */")) return source;

  const authBlock = `/* Account V5 single admin session */
const ADMIN_SESSION_SHORT_TTL = 12 * 60 * 60;
const ADMIN_SESSION_LONG_TTL = 30 * 24 * 60 * 60;
function adminSessionKey(sid) { return \`community-admin-session:\${sid}\`; }
function adminPasswordConfig(env) {
  return {
    saltB64: String(env.ADMIN_PASSWORD_SALT_B64 || "G3j83jYozrVpn+u5NTax/Q=="),
    hashB64: String(env.ADMIN_PASSWORD_HASH_B64 || "uylBeIGtVdjVL53g/2nvuJn1yLGq0xEArKc3N5AgUWE="),
    iterations: Number(env.ADMIN_PASSWORD_ITERATIONS || 200000),
  };
}
async function verifyAdminPassword(env, password) {
  const pass = String(password || "");
  if (!pass || pass.length > 128) return false;
  const config = adminPasswordConfig(env);
  try {
    const salt = Uint8Array.from(atob(config.saltB64), (c) => c.charCodeAt(0));
    const got = await hashPassword(pass, salt, config.iterations);
    const want = config.hashB64.replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/, "");
    return secureEqual(got, want);
  } catch (_) { return false; }
}
async function issueAdminSession(env, did, remember) {
  const sid = crypto.randomUUID();
  const ttl = remember ? ADMIN_SESSION_LONG_TTL : ADMIN_SESSION_SHORT_TTL;
  const expiresAt = Date.now() + ttl * 1000;
  await putJson(env, adminSessionKey(sid), { active: true, did, primary: true, expires_at: expiresAt }, ttl);
  return {
    token: await makeJwt(sessionSecret(env), { aud: "community-admin", sid, did, role: "admin", primary: true }, ttl),
    expires_at: expiresAt,
  };
}
async function adminAuth(request, env) {
  const token = bearer(request);
  if (!token) return null;
  if (String(env.ADMIN_TOKEN || "") && secureEqual(token, String(env.ADMIN_TOKEN))) {
    return { legacy: true, primary: false, did: clean(request.headers.get("x-owner-device-id"), 80) };
  }
  const claims = await verifyJwt(sessionSecret(env), token);
  if (!claims || claims.aud !== "community-admin" || !isUuid(claims.sid) || !isUuid(claims.did) || claims.role !== "admin") return null;
  const session = await getJson(env, adminSessionKey(claims.sid));
  const supplied = clean(request.headers.get("x-owner-device-id"), 80);
  if (!session || !session.active || session.expires_at <= Date.now() || session.did !== claims.did || supplied !== claims.did) return null;
  return { ...claims, legacy: false, primary: !!session.primary };
}
async function ownerDeviceOk(request, env, auth) {
  if (!auth) return false;
  const stored = await env.KV.get("community-owner-device");
  const supplied = clean(request.headers.get("x-owner-device-id"), 80);
  return !!stored && !!supplied && secureEqual(stored, supplied) && (auth.legacy || (auth.primary && auth.did === supplied));
}
async function handleAdminLogin(request, env) {
  const body = await readJson(request);
  const deviceId = clean(body && body.device_id, 80);
  if (!isUuid(deviceId)) return json({ error: "invalid_device" }, 400);
  if (!(await verifyAdminPassword(env, body && body.password))) return json({ error: "invalid_admin_login" }, 401);
  const old = await env.KV.get("community-owner-device");
  const existing = await env.KV.list({ prefix: "community-admin-session:", limit: 1000 });
  await Promise.all(existing.keys.map((key) => env.KV.delete(key.name)));
  await env.KV.put("community-owner-device", deviceId);
  const session = await issueAdminSession(env, deviceId, body && body.remember !== false);
  await adminAudit(env, request, old && !secureEqual(old, deviceId) ? "admin_login_owner_replaced" : "admin_login", deviceId);
  return json({ ...session, role: "admin", primary: true, device_id: deviceId });
}

`;

  source = replaceRange(source, "function adminTokenOk(request, env) {", "async function handleAdmin(request, env, path) {", authBlock, "xác thực Admin cũ");
  source = source.replace(
    `async function handleAdmin(request, env, path) {
  if (!adminTokenOk(request, env)) return json({ error: "unauthorized" }, 401);
  const parts = path.split("/").filter(Boolean);
  const action = parts[3] || "";`,
    `async function handleAdmin(request, env, path) {
  const parts = path.split("/").filter(Boolean);
  const action = parts[3] || "";
  if (action === "login" && request.method === "POST") return handleAdminLogin(request, env);
  const auth = await adminAuth(request, env);
  if (!auth) return json({ error: "unauthorized" }, 401);
  if (action === "session" && request.method === "DELETE") {
    if (!auth.legacy && auth.sid) await env.KV.delete(adminSessionKey(auth.sid));
    return json({ ok: true });
  }`
  );
  if (!source.includes('action === "login"') || !source.includes("const auth = await adminAuth")) throw new Error("Không nối được Admin login/session");
  source = source.replaceAll("ownerDeviceOk(request, env)", "ownerDeviceOk(request, env, auth)");
  source = source.replace("\nexport async function handleCommunity", "\n/* Account V5 admin JWT */\nexport async function handleCommunity");
  return source;
});

await edit("assets/gate.js", (source) => {
  if (source.includes("/* Account V5 single admin login */")) return source;
  const start = '    forms.admin.addEventListener("submit", function (event) {';
  const end = "\n  }\n\n  /* -------------------------- giao diện khóa";
  const replacement = `    /* Account V5 single admin login */
    forms.admin.addEventListener("submit", function (event) {
      event.preventDefault();
      var form = forms.admin, button = form.querySelector("button[type=submit]"), msg = form.querySelector(".gate-msg"), pass = form.password.value;
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
        if (!data.token || !data.primary) throw new Error("admin_session_incomplete");
        try {
          localStorage.setItem("market_admin_token", data.token);
          localStorage.setItem("market_admin_session", "1");
          localStorage.setItem("market_admin_primary", "1");
          localStorage.removeItem("community_profile_boitoan");
          localStorage.removeItem("community_token_boitoan");
          sessionStorage.setItem(SESSION_KEY, "1");
          if (form.remember.checked) localStorage.setItem(REMEMBER_KEY, "1");
        } catch (e) {}
        msg.className = "gate-msg ok"; msg.textContent = "Đăng nhập thành công. Đang mở Quản trị…";
        location.replace("./community-admin.html");
      }).catch(function (error) {
        button.disabled = false; msg.className = "gate-msg err";
        msg.textContent = error.code === "invalid_admin_login" ? "Mật khẩu Admin không đúng." : "Không đăng nhập được Admin. Vui lòng thử lại.";
      });
    });`;
  source = replaceRange(source, start, end, replacement, "submit Admin hai lớp");
  source = source.replace(
    '          localStorage.removeItem("market_admin_primary");',
    '          localStorage.removeItem("market_admin_primary");\n          localStorage.removeItem("market_admin_token");'
  );
  return source;
});

await edit("assets/community-admin.js", () => `(function () {
  "use strict";
  var BACKEND = String(window.COMMUNITY_BACKEND || "").replace(/\\/+$/, "");
  var status = document.getElementById("community-admin-state");
  var content = document.getElementById("community-admin-content");
  var logoutButton = document.getElementById("community-admin-logout");
  var token = "", deviceId = "", currentTab = "users";
  try { token = localStorage.getItem("market_admin_token") || ""; deviceId = localStorage.getItem("gate_device_id") || ""; } catch (_) {}

  function clearAdmin() {
    try {
      localStorage.removeItem("market_admin_token");
      localStorage.removeItem("market_admin_session");
      localStorage.removeItem("market_admin_primary");
    } catch (_) {}
  }
  function returnToLogin() { clearAdmin(); location.replace("./?admin=1"); }
  if (!token || !deviceId) { returnToLogin(); return; }

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
        var row=el("tr"); cell(row,user.username+"\\n"+user.display_name); cell(row,user.role==="reader"?"Reader / Người xem bói":"Khách"); cell(row,user.bio||""); cell(row,user.suspended?"Đã khóa":"Hoạt động");
        var action=cell(row,""); action.className="community-admin-actions";
        action.append(button(user.suspended?"Mở khóa":"Khóa",user.suspended?"community-secondary":"community-danger",function(){api("/api/community/admin/users/"+user.id,jsonOptions("PATCH",{suspended:!user.suspended})).then(loadUsers);}));
        action.append(button("Xem trang cá nhân","community-secondary",function(){api("/api/community/admin/users/"+user.id+"/impersonate",{method:"POST"}).then(function(result){localStorage.setItem("community_token_boitoan",result.token);localStorage.setItem("community_profile_boitoan",JSON.stringify(result.profile));location.assign("./community.html?admin_view=profile");}).catch(function(error){setStatus(errorText(error),true);});}));
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
  function activateTab(tab){document.querySelectorAll("[data-admin-tab]").forEach(function(node){node.classList.toggle("active",node.dataset.adminTab===tab);});if(tab==="users")loadUsers();else if(tab==="reviews")loadReviews();else if(tab==="posts")loadPosts();else loadConversations();}
  document.querySelectorAll("[data-admin-tab]").forEach(function(node){node.addEventListener("click",function(){activateTab(node.dataset.adminTab);});});
  logoutButton.addEventListener("click",function(){fetch(BACKEND+"/api/community/admin/session",{method:"DELETE",headers:headers()}).catch(function(){}).finally(function(){returnToLogin();});});
  activateTab("users");
}());
`);

await edit("boitoan/community-admin.html", () => `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <meta name="theme-color" content="#0b0813">
  <title>Spirituality Market · Quản trị</title>
  <link rel="stylesheet" href="/assets/community.css">
</head>
<body>
  <header class="community-topbar">
    <a class="community-back" href="./">← Bói toán</a>
    <div class="community-brand"><span class="community-sigil" aria-hidden="true"></span><div class="community-brand-copy"><strong>Spirituality Market</strong><small>Quản trị tài khoản, đánh giá và hội thoại</small></div></div>
  </header>
  <main class="community-shell">
    <section class="community-card community-admin-session-card">
      <div class="community-admin-session-copy"><span class="community-role-badge role-admin">Admin tổng</span><div><h1>Khu vực quản trị</h1><p>Phiên bảo mật đã được xác nhận trên thiết bị này.</p></div></div>
      <button id="community-admin-logout" type="button" class="community-secondary">Đăng xuất Admin</button>
      <p id="community-admin-state" class="community-state" role="status">Đang tải dữ liệu…</p>
    </section>
    <nav class="community-tabs" aria-label="Quản trị">
      <button type="button" data-admin-tab="users" class="active">Tài khoản</button>
      <button type="button" data-admin-tab="reviews">Đánh giá</button>
      <button type="button" data-admin-tab="posts">Thảo luận</button>
      <button type="button" data-admin-tab="conversations">Hội thoại</button>
    </nav>
    <section id="community-admin-content" class="community-card"><p>Đang tải dữ liệu quản trị…</p></section>
  </main>
  <script>window.COMMUNITY_BACKEND="https://hiennhi89-gate.hiennhi89.workers.dev";</script>
  <script src="/assets/community-admin.js" defer></script>
</body>
</html>
`);

await edit("assets/community.css", (source) => {
  if (source.includes("/* Account V5 admin session UI */")) return source;
  return source + `

/* Account V5 admin session UI */
.community-admin-session-card{display:grid;gap:14px}.community-admin-session-copy{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.community-admin-session-copy>div{display:grid;gap:3px}.community-admin-session-copy h1,.community-admin-session-copy p{margin:0}.community-role-badge.role-admin{border-color:#f0cf72;color:#f0cf72}.community-admin-session-card>.community-secondary{justify-self:start}
`;
});

const checks = [
  ["backend/community.js", ["Account V5 single admin session", "handleAdminLogin", "community-admin-session:", "invalid_admin_login", "community-admin"]],
  ["assets/gate.js", ["Account V5 single admin login", "market_admin_token", "/api/community/admin/login", "community-admin.html"]],
  ["assets/community-admin.js", ["market_admin_token", "Xem trang cá nhân", "admin_view=profile", "community-admin/session"]],
  ["boitoan/community-admin.html", ["Admin tổng", "community-admin-logout", "data-admin-tab=\"posts\""]],
];
for (const [path, markers] of checks) {
  const value = await readFile(path, "utf8");
  for (const marker of markers) if (!value.includes(marker)) throw new Error(`Thiếu marker ${marker} trong ${path}`);
}
console.log("Account V5: Admin đăng nhập một lần, JWT gắn thiết bị và trang Quản trị tự tải.");
