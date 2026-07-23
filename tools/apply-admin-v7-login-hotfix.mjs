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
  if (source.includes("/* Account V7 admin login hotfix */")) return source;

  source = replaceRequired(
    source,
    'const ADMIN_AUTH_VERSION = "2026-07-23-v6";',
    '/* Account V7 admin login hotfix */\nconst ADMIN_AUTH_VERSION = "2026-07-23-v7";',
    "phiên Admin V7"
  );

  // Không dùng lại các biến môi trường V5/V6 cũ. Một salt cũ còn tồn tại trên
  // Cloudflare sẽ làm cả hai hash mặc định mới sai dù mật khẩu người dùng đúng.
  source = replaceRequired(source, "env.ADMIN_PASSWORD_SALT_B64", "env.ADMIN_V7_PASSWORD_SALT_B64", "salt Admin V7 độc lập");
  source = replaceRequired(source, "env.ADMIN_REGULAR_PASSWORD_HASH_B64", "env.ADMIN_V7_REGULAR_PASSWORD_HASH_B64", "hash Admin thường V7 độc lập");
  source = replaceRequired(source, "env.ADMIN_PRIMARY_PASSWORD_HASH_B64", "env.ADMIN_V7_PRIMARY_PASSWORD_HASH_B64", "hash Admin tổng V7 độc lập");
  source = replaceRequired(source, "env.ADMIN_PASSWORD_ITERATIONS", "env.ADMIN_V7_PASSWORD_ITERATIONS", "iterations Admin V7 độc lập");
  return source;
});

await edit("assets/gate.js", (source) => {
  if (source.includes("/* Account V7 admin login hotfix */")) return source;

  const oldSessionHelper = `  function marketAdminSession() {
    try { return localStorage.getItem("market_admin_session") === "1" && !storedAccountProfile(); } catch (e) { return false; }
  }

`;
  const newSessionHelper = `  /* Account V7 admin login hotfix */
  var MARKET_ADMIN_AUTH_VERSION = "2026-07-23-v7";
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

  function validateMarketAdminSession() {
    if (APP !== "boitoan" || !marketAdminSession() || !BACKEND) return;
    var token = "";
    try { token = localStorage.getItem("market_admin_token") || ""; } catch (e) {}
    fetch(BACKEND + "/api/community/admin/session", {
      headers: { authorization: "Bearer " + token, "x-owner-device-id": deviceId() },
      cache: "no-store"
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (data) {
        if (!response.ok || (data.level !== "regular" && data.level !== "primary")) throw new Error("invalid_admin_session");
        return data;
      });
    }).then(function (data) {
      try {
        localStorage.setItem("market_admin_session", "1");
        localStorage.setItem("market_admin_level", data.level);
        localStorage.setItem("market_admin_auth_version", MARKET_ADMIN_AUTH_VERSION);
        if (data.primary) localStorage.setItem("market_admin_primary", "1");
        else localStorage.removeItem("market_admin_primary");
      } catch (e) {}
      injectAccountIdentity("admin-session");
      injectCommunity();
    }).catch(function () {
      clearMarketAdminSession();
      location.reload();
    });
  }

`;
  source = replaceRequired(source, oldSessionHelper, newSessionHelper, "xác thực phiên Admin trên trang chính");

  source = replaceRequired(
    source,
    '          localStorage.setItem("market_admin_session", "1");',
    '          localStorage.setItem("market_admin_session", "1");\n          localStorage.setItem("market_admin_auth_version", MARKET_ADMIN_AUTH_VERSION);',
    "ghi phiên bản phiên Admin frontend"
  );

  source = replaceRequired(
    source,
    '      var form = forms.admin, button = form.querySelector("button[type=submit]"), msg = form.querySelector(".gate-msg"), pass = form.password.value;\n      button.disabled = true; msg.className = "gate-msg wait"; msg.textContent = "Đang đăng nhập Admin…";',
    '      var form = forms.admin, button = form.querySelector("button[type=submit]"), msg = form.querySelector(".gate-msg"), pass = form.password.value;\n      var previousAdminToken = clearMarketAdminSession();\n      if (previousAdminToken) revokeMarketAdminSession(previousAdminToken);\n      button.disabled = true; msg.className = "gate-msg wait"; msg.textContent = "Đang đăng nhập Admin…";',
    "xóa phiên Admin cũ trước lần đăng nhập mới"
  );

  source = replaceRequired(
    source,
    '    trackAccess(method || "session");\n    // Watermark chủ sở hữu vẫn giữ lại sau khi mở khóa (không xóa).',
    '    trackAccess(method || "session");\n    validateMarketAdminSession();\n    // Watermark chủ sở hữu vẫn giữ lại sau khi mở khóa (không xóa).',
    "tự dọn phiên Admin cũ khi mở app"
  );

  const oldLock = `    b.addEventListener("click", function () {
      try {
        localStorage.removeItem("gate_key_" + APP);
        localStorage.removeItem(REMEMBER_KEY);
        if (APP === "boitoan") localStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(SESSION_KEY);
      } catch (e) {}
      location.reload();
    });`;
  const newLock = `    b.addEventListener("click", function () {
      var previousAdminToken = APP === "boitoan" ? clearMarketAdminSession() : "";
      if (previousAdminToken) revokeMarketAdminSession(previousAdminToken);
      try {
        localStorage.removeItem("gate_key_" + APP);
        localStorage.removeItem(REMEMBER_KEY);
        if (APP === "boitoan") localStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(SESSION_KEY);
      } catch (e) {}
      location.reload();
    });`;
  source = replaceRequired(source, oldLock, newLock, "nút Khóa phải đăng xuất Admin hoàn toàn");
  return source;
});

await edit("assets/community-admin.js", (source) => {
  if (source.includes("/* Account V7 admin page session guard */")) return source;

  source = replaceRequired(
    source,
    '  /* Account V6 admin level UI */\n  var token = "", deviceId = "", currentTab = "users", adminLevel = "", primary = false;\n  try { token = localStorage.getItem("market_admin_token") || ""; deviceId = localStorage.getItem("gate_device_id") || ""; adminLevel = localStorage.getItem("market_admin_level") || ""; primary = adminLevel === "primary"; } catch (_) {}',
    '  /* Account V6 admin level UI */\n  /* Account V7 admin page session guard */\n  var ADMIN_AUTH_VERSION = "2026-07-23-v7";\n  var token = "", deviceId = "", currentTab = "users", adminLevel = "", primary = false, adminAuthVersion = "";\n  try { token = localStorage.getItem("market_admin_token") || ""; deviceId = localStorage.getItem("gate_device_id") || ""; adminLevel = localStorage.getItem("market_admin_level") || ""; primary = adminLevel === "primary"; adminAuthVersion = localStorage.getItem("market_admin_auth_version") || ""; } catch (_) {}',
    "phiên bản frontend trang Quản trị"
  );

  source = replaceRequired(
    source,
    '      localStorage.removeItem("market_admin_level");',
    '      localStorage.removeItem("market_admin_level");\n      localStorage.removeItem("market_admin_auth_version");',
    "xóa phiên bản phiên khi đăng xuất"
  );

  source = replaceRequired(
    source,
    '  function returnToLogin() { clearAdmin(); location.replace("./?admin=1"); }\n  if (!token || !deviceId) { returnToLogin(); return; }',
    '  function returnToLogin() { clearAdmin(); location.replace("./?admin=1&reauth=1"); }\n  if (!token || !deviceId || adminAuthVersion !== ADMIN_AUTH_VERSION) { returnToLogin(); return; }\n  if (content) content.hidden = true;\n  document.querySelectorAll("[data-admin-tab]").forEach(function(node){node.hidden=true;});',
    "chặn giao diện Quản trị khi phiên cũ hoặc thiếu"
  );

  source = replaceRequired(
    source,
    '    try{localStorage.setItem("market_admin_level",adminLevel);if(primary)localStorage.setItem("market_admin_primary","1");else localStorage.removeItem("market_admin_primary");}catch(_){}\n    var badge=document.getElementById("community-admin-level-badge"),description=document.getElementById("community-admin-level-description"),conversationTab=document.querySelector(\'[data-admin-tab="conversations"]\');',
    '    try{localStorage.setItem("market_admin_level",adminLevel);localStorage.setItem("market_admin_auth_version",ADMIN_AUTH_VERSION);if(primary)localStorage.setItem("market_admin_primary","1");else localStorage.removeItem("market_admin_primary");}catch(_){}\n    document.querySelectorAll("[data-admin-tab]").forEach(function(node){node.hidden=node.dataset.adminTab==="conversations"&&!primary;});\n    if(content)content.hidden=false;\n    var badge=document.getElementById("community-admin-level-badge"),description=document.getElementById("community-admin-level-description"),conversationTab=document.querySelector(\'[data-admin-tab="conversations"]\');',
    "chỉ hiện trang sau khi server xác nhận phiên"
  );
  return source;
});

for (const [path, markers] of [
  ["backend/community.js", ["Account V7 admin login hotfix", "ADMIN_V7_PASSWORD_SALT_B64", 'ADMIN_AUTH_VERSION = "2026-07-23-v7"']],
  ["assets/gate.js", ["Account V7 admin login hotfix", "clearMarketAdminSession", "validateMarketAdminSession", "market_admin_auth_version"]],
  ["assets/community-admin.js", ["Account V7 admin page session guard", "adminAuthVersion !== ADMIN_AUTH_VERSION", "content.hidden = true"]],
]) {
  const value = await readFile(path, "utf8");
  for (const marker of markers) if (!value.includes(marker)) throw new Error(`Thiếu marker ${marker} trong ${path}`);
}

console.log("Account V7: mật khẩu không bị salt cũ ghi đè, đăng xuất sạch và phiên Admin được xác thực trước khi hiện UI.");
