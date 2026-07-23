import { readFile, writeFile } from "node:fs/promises";

async function edit(path, mutate) {
  const before = await readFile(path, "utf8");
  const after = mutate(before);
  if (after !== before) await writeFile(path, after, "utf8");
}

function replaceRequired(source, before, after, label) {
  if (source.includes(after)) return source;
  if (!source.includes(before)) throw new Error(`Không tìm thấy điểm sửa ${label}`);
  return source.replace(before, after);
}

await edit("backend/community.js", (source) => {
  if (source.includes("/* Account V6 dual admin levels */")) return source;

  const oldPasswordBlock = `function adminPasswordConfig(env) {
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
}`;
  const newPasswordBlock = `/* Account V6 dual admin levels */
const ADMIN_AUTH_VERSION = "2026-07-23-v6";
function adminPasswordConfig(env) {
  return {
    saltB64: String(env.ADMIN_PASSWORD_SALT_B64 || "T+t/d5AqXa95CLN1h5YbRA=="),
    regularHashB64: String(env.ADMIN_REGULAR_PASSWORD_HASH_B64 || "PZSNL/uBeYjTuTob1uUd5zv2TSUaT4M1h6TquazUxVI="),
    primaryHashB64: String(env.ADMIN_PRIMARY_PASSWORD_HASH_B64 || "a362HLhTqJJ3TcW4ZRSNTrtPW2Cpi4gzrvym+ZT4cxc="),
    iterations: Number(env.ADMIN_PASSWORD_ITERATIONS || 200000),
  };
}
function normalizedPasswordHash(value) {
  return String(value || "").replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/, "");
}
async function verifyAdminPasswordLevel(env, password) {
  const pass = String(password || "");
  if (!pass || pass.length > 128) return "";
  const config = adminPasswordConfig(env);
  try {
    const salt = Uint8Array.from(atob(config.saltB64), (c) => c.charCodeAt(0));
    const got = await hashPassword(pass, salt, config.iterations);
    if (secureEqual(got, normalizedPasswordHash(config.primaryHashB64))) return "primary";
    if (secureEqual(got, normalizedPasswordHash(config.regularHashB64))) return "regular";
    return "";
  } catch (_) { return ""; }
}`;
  source = replaceRequired(source, oldPasswordBlock, newPasswordBlock, "hai cấu hình mật khẩu Admin");

  const oldIssue = `async function issueAdminSession(env, did, remember) {
  const sid = crypto.randomUUID();
  const ttl = remember ? ADMIN_SESSION_LONG_TTL : ADMIN_SESSION_SHORT_TTL;
  const expiresAt = Date.now() + ttl * 1000;
  await putJson(env, adminSessionKey(sid), { active: true, did, primary: true, expires_at: expiresAt }, ttl);
  return {
    token: await makeJwt(sessionSecret(env), { aud: "community-admin", sid, did, role: "admin", primary: true }, ttl),
    expires_at: expiresAt,
  };
}`;
  const newIssue = `async function issueAdminSession(env, did, remember, level) {
  const sid = crypto.randomUUID();
  const ttl = remember ? ADMIN_SESSION_LONG_TTL : ADMIN_SESSION_SHORT_TTL;
  const expiresAt = Date.now() + ttl * 1000;
  const primary = level === "primary";
  await putJson(env, adminSessionKey(sid), { active: true, did, level, primary, auth_version: ADMIN_AUTH_VERSION, expires_at: expiresAt }, ttl);
  return {
    token: await makeJwt(sessionSecret(env), { aud: "community-admin", sid, did, role: "admin", level, primary, auth_version: ADMIN_AUTH_VERSION }, ttl),
    expires_at: expiresAt,
  };
}`;
  source = replaceRequired(source, oldIssue, newIssue, "phiên theo cấp Admin");

  const oldAuth = `async function adminAuth(request, env) {
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
}`;
  const newAuth = `async function adminAuth(request, env) {
  const token = bearer(request);
  if (!token) return null;
  const claims = await verifyJwt(sessionSecret(env), token);
  if (!claims || claims.aud !== "community-admin" || !isUuid(claims.sid) || !isUuid(claims.did) || claims.role !== "admin" || !["regular", "primary"].includes(claims.level) || claims.auth_version !== ADMIN_AUTH_VERSION) return null;
  const session = await getJson(env, adminSessionKey(claims.sid));
  const supplied = clean(request.headers.get("x-owner-device-id"), 80);
  if (!session || !session.active || session.auth_version !== ADMIN_AUTH_VERSION || session.expires_at <= Date.now() || session.did !== claims.did || session.level !== claims.level || supplied !== claims.did) return null;
  return { ...claims, primary: claims.level === "primary" && !!session.primary };
}`;
  source = replaceRequired(source, oldAuth, newAuth, "vô hiệu ADMIN_TOKEN cũ");

  const oldOwner = `async function ownerDeviceOk(request, env, auth) {
  if (!auth) return false;
  const stored = await env.KV.get("community-owner-device");
  const supplied = clean(request.headers.get("x-owner-device-id"), 80);
  return !!stored && !!supplied && secureEqual(stored, supplied) && (auth.legacy || (auth.primary && auth.did === supplied));
}`;
  const newOwner = `async function ownerDeviceOk(request, env, auth) {
  if (!auth || !auth.primary || auth.level !== "primary") return false;
  const stored = await env.KV.get("community-owner-device");
  const supplied = clean(request.headers.get("x-owner-device-id"), 80);
  return !!stored && !!supplied && secureEqual(stored, supplied) && auth.did === supplied;
}`;
  source = replaceRequired(source, oldOwner, newOwner, "quyền riêng Admin tổng");

  const oldLogin = `async function handleAdminLogin(request, env) {
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
}`;
  const newLogin = `async function handleAdminLogin(request, env) {
  const body = await readJson(request);
  const deviceId = clean(body && body.device_id, 80);
  if (!isUuid(deviceId)) return json({ error: "invalid_device" }, 400);
  if (env.PUBLIC_RATE_LIMITER && typeof env.PUBLIC_RATE_LIMITER.limit === "function") {
    try {
      const ip = request.headers.get("cf-connecting-ip") || "unknown";
      const limited = await env.PUBLIC_RATE_LIMITER.limit({ key: \`admin-login:\${ip}:\${deviceId}\` });
      if (!limited || !limited.success) return json({ error: "rate_limited" }, 429);
    } catch (_) {}
  }
  const level = await verifyAdminPasswordLevel(env, body && body.password);
  if (!level) return json({ error: "invalid_admin_login" }, 401);
  const existing = await env.KV.list({ prefix: "community-admin-session:", limit: 1000 });
  const staleOrPrimary = [];
  for (const key of existing.keys) {
    const record = await getJson(env, key.name);
    if (!record || record.auth_version !== ADMIN_AUTH_VERSION || (level === "primary" && record.primary)) staleOrPrimary.push(key.name);
  }
  await Promise.all(staleOrPrimary.map((key) => env.KV.delete(key)));
  if (level === "primary") await env.KV.put("community-owner-device", deviceId);
  const session = await issueAdminSession(env, deviceId, body && body.remember !== false, level);
  await adminAudit(env, request, level === "primary" ? "admin_primary_login" : "admin_regular_login", deviceId);
  return json({ ...session, role: "admin", level, primary: level === "primary", device_id: deviceId });
}`;
  source = replaceRequired(source, oldLogin, newLogin, "đăng nhập hai cấp Admin");

  const oldSession = `  if (action === "session" && request.method === "DELETE") {
    if (!auth.legacy && auth.sid) await env.KV.delete(adminSessionKey(auth.sid));
    return json({ ok: true });
  }`;
  const newSession = `  if (action === "session" && request.method === "GET") return json({ role: "admin", level: auth.level, primary: !!auth.primary, device_id: auth.did });
  if (action === "session" && request.method === "DELETE") {
    if (auth.sid) await env.KV.delete(adminSessionKey(auth.sid));
    return json({ ok: true });
  }`;
  source = replaceRequired(source, oldSession, newSession, "đọc cấp phiên Admin");
  return source;
});

await edit("assets/gate.js", (source) => {
  if (source.includes("/* Account V6 dual admin UI */")) return source;
  source = replaceRequired(
    source,
    `          localStorage.setItem("market_admin_primary", "1");`,
    `          localStorage.setItem("market_admin_level", data.level || (data.primary ? "primary" : "regular"));
          if (data.primary) localStorage.setItem("market_admin_primary", "1");
          else localStorage.removeItem("market_admin_primary");`,
    "lưu đúng cấp Admin"
  );
  source = source.replaceAll(
    `localStorage.removeItem("market_admin_primary");`,
    `localStorage.removeItem("market_admin_primary");
          localStorage.removeItem("market_admin_level");`
  );
  source = source.replace(
    `/* Account V5 single admin login */`,
    `/* Account V5 single admin login */\n    /* Account V6 dual admin UI */`
  );
  return source;
});

await edit("assets/community-admin.js", (source) => {
  if (source.includes("/* Account V6 admin level UI */")) return source;
  source = replaceRequired(
    source,
    `  var token = "", deviceId = "", currentTab = "users";
  try { token = localStorage.getItem("market_admin_token") || ""; deviceId = localStorage.getItem("gate_device_id") || ""; } catch (_) {}`,
    `  /* Account V6 admin level UI */
  var token = "", deviceId = "", currentTab = "users", adminLevel = "", primary = false;
  try { token = localStorage.getItem("market_admin_token") || ""; deviceId = localStorage.getItem("gate_device_id") || ""; adminLevel = localStorage.getItem("market_admin_level") || ""; primary = adminLevel === "primary"; } catch (_) {}`,
    "trạng thái cấp Admin"
  );
  source = replaceRequired(
    source,
    `      localStorage.removeItem("market_admin_primary");`,
    `      localStorage.removeItem("market_admin_primary");
      localStorage.removeItem("market_admin_level");`,
    "xóa cấp Admin khi đăng xuất"
  );
  source = replaceRequired(
    source,
    `        action.append(button("Xem trang cá nhân","community-secondary",function(){api("/api/community/admin/users/"+user.id+"/impersonate",{method:"POST"}).then(function(result){localStorage.setItem("community_token_boitoan",result.token);localStorage.setItem("community_profile_boitoan",JSON.stringify(result.profile));location.assign("./community.html?admin_view=profile");}).catch(function(error){setStatus(errorText(error),true);});}));`,
    `        if (primary) action.append(button("Xem trang cá nhân","community-secondary",function(){api("/api/community/admin/users/"+user.id+"/impersonate",{method:"POST"}).then(function(result){localStorage.setItem("community_token_boitoan",result.token);localStorage.setItem("community_profile_boitoan",JSON.stringify(result.profile));location.assign("./community.html?admin_view=profile");}).catch(function(error){setStatus(errorText(error),true);});}));`,
    "ẩn hồ sơ member với Admin thường"
  );
  source = replaceRequired(
    source,
    `  function activateTab(tab){document.querySelectorAll("[data-admin-tab]").forEach(function(node){node.classList.toggle("active",node.dataset.adminTab===tab);});if(tab==="users")loadUsers();else if(tab==="reviews")loadReviews();else if(tab==="posts")loadPosts();else loadConversations();}`,
    `  function activateTab(tab){if(tab==="conversations"&&!primary)tab="users";document.querySelectorAll("[data-admin-tab]").forEach(function(node){node.classList.toggle("active",node.dataset.adminTab===tab);});if(tab==="users")loadUsers();else if(tab==="reviews")loadReviews();else if(tab==="posts")loadPosts();else loadConversations();}`,
    "chặn tab hội thoại ở UI Admin thường"
  );
  source = replaceRequired(
    source,
    `  logoutButton.addEventListener("click",function(){fetch(BACKEND+"/api/community/admin/session",{method:"DELETE",headers:headers()}).catch(function(){}).finally(function(){returnToLogin();});});
  activateTab("users");`,
    `  logoutButton.addEventListener("click",function(){fetch(BACKEND+"/api/community/admin/session",{method:"DELETE",headers:headers()}).catch(function(){}).finally(function(){returnToLogin();});});
  api("/api/community/admin/session").then(function(data){
    adminLevel=data.level||"regular";primary=!!data.primary&&adminLevel==="primary";
    try{localStorage.setItem("market_admin_level",adminLevel);if(primary)localStorage.setItem("market_admin_primary","1");else localStorage.removeItem("market_admin_primary");}catch(_){}
    var badge=document.getElementById("community-admin-level-badge"),description=document.getElementById("community-admin-level-description"),conversationTab=document.querySelector('[data-admin-tab="conversations"]');
    if(badge)badge.textContent=primary?"Admin tổng":"Admin";
    if(description)description.textContent=primary?"Toàn quyền quản trị, gồm hội thoại và trang cá nhân member.":"Quản trị tài khoản, đánh giá và bài thảo luận.";
    if(conversationTab)conversationTab.hidden=!primary;
    activateTab("users");
  }).catch(function(error){setStatus(errorText(error),true);});`,
    "xác nhận cấp Admin từ server"
  );
  return source;
});

await edit("boitoan/community-admin.html", (source) => {
  if (source.includes('id="community-admin-level-badge"')) return source;
  source = replaceRequired(source, `<span class="community-role-badge role-admin">Admin tổng</span>`, `<span id="community-admin-level-badge" class="community-role-badge role-admin">Admin</span>`, "badge cấp Admin");
  source = replaceRequired(source, `<p>Phiên bảo mật đã được xác nhận trên thiết bị này.</p>`, `<p id="community-admin-level-description">Đang xác nhận cấp quyền quản trị…</p>`, "mô tả cấp Admin");
  return source;
});

const checks = [
  ["backend/community.js", ["Account V6 dual admin levels", "verifyAdminPasswordLevel", "ADMIN_REGULAR_PASSWORD_HASH_B64", "ADMIN_PRIMARY_PASSWORD_HASH_B64", "admin_regular_login", "admin_primary_login"]],
  ["assets/gate.js", ["Account V6 dual admin UI", "market_admin_level"]],
  ["assets/community-admin.js", ["Account V6 admin level UI", "community-admin/session", "if (primary) action.append", "conversationTab.hidden=!primary"]],
  ["boitoan/community-admin.html", ["community-admin-level-badge", "community-admin-level-description"]],
];
for (const [path, markers] of checks) {
  const value = await readFile(path, "utf8");
  for (const marker of markers) if (!value.includes(marker)) throw new Error(`Thiếu marker ${marker} trong ${path}`);
}
console.log("Account V6: hai mật khẩu băm, Admin thường và một thiết bị Admin tổng.");
