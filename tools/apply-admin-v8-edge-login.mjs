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

const V8 = {
  salt: "Wg1fGuw3MNtQz8jVKobFUA==",
  regularHash: "WP5H0yPnvX7DJ1Gg2ODMiz9m+tAlFhYzf+S4JTXJur0=",
  primaryHash: "nyCS+HxOceWo77FTxDQySuSTZOhKt+HuRHPBM/7uHZM=",
  iterations: 10000,
  healthSalt: "YWRtaW4tdjgtaGVhbHRoIQ==",
  healthHash: "xoVIKKX1VWwMB9PneHorgGENhMbf1uxXohlnJRfX5BU=",
};

await edit("backend/community.js", (source) => {
  if (source.includes("/* Account V8 edge-safe admin authentication */")) return source;

  source = replaceRequired(
    source,
    '/* Account V7 admin login hotfix */\nconst ADMIN_AUTH_VERSION = "2026-07-23-v7";',
    '/* Account V7 admin login hotfix */\n/* Account V8 edge-safe admin authentication */\nconst ADMIN_AUTH_VERSION = "2026-07-23-v8";',
    "auth version Admin V8"
  );

  source = source
    .replaceAll("ADMIN_V7_PASSWORD_SALT_B64", "ADMIN_V8_PASSWORD_SALT_B64")
    .replaceAll("ADMIN_V7_REGULAR_PASSWORD_HASH_B64", "ADMIN_V8_REGULAR_PASSWORD_HASH_B64")
    .replaceAll("ADMIN_V7_PRIMARY_PASSWORD_HASH_B64", "ADMIN_V8_PRIMARY_PASSWORD_HASH_B64")
    .replaceAll("ADMIN_V7_PASSWORD_ITERATIONS", "ADMIN_V8_PASSWORD_ITERATIONS");

  source = replaceRequired(source, '"T+t/d5AqXa95CLN1h5YbRA=="', `"${V8.salt}"`, "salt V8");
  source = replaceRequired(source, '"PZSNL/uBeYjTuTob1uUd5zv2TSUaT4M1h6TquazUxVI="', `"${V8.regularHash}"`, "hash Admin thường V8");
  source = replaceRequired(source, '"a362HLhTqJJ3TcW4ZRSNTrtPW2Cpi4gzrvym+ZT4cxc="', `"${V8.primaryHash}"`, "hash Admin tổng V8");
  source = replaceRequired(source, "Number(env.ADMIN_V8_PASSWORD_ITERATIONS || 200000)", `Number(env.ADMIN_V8_PASSWORD_ITERATIONS || ${V8.iterations})`, "iterations V8");

  const oldVerify = `async function verifyAdminPasswordLevel(env, password) {
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

  const newVerify = `async function verifyAdminPasswordLevel(env, password) {
  const pass = String(password || "").trim();
  if (!pass || pass.length > 128) return "";
  const config = adminPasswordConfig(env);
  try {
    const salt = Uint8Array.from(atob(config.saltB64), (c) => c.charCodeAt(0));
    const got = await hashPassword(pass, salt, config.iterations);
    if (secureEqual(got, normalizedPasswordHash(config.primaryHashB64))) return "primary";
    if (secureEqual(got, normalizedPasswordHash(config.regularHashB64))) return "regular";
    return "";
  } catch (_) { return "__crypto_error__"; }
}

async function adminAuthHealth(env) {
  const config = adminPasswordConfig(env);
  const configOk = config.saltB64 === "${V8.salt}"
    && config.regularHashB64 === "${V8.regularHash}"
    && config.primaryHashB64 === "${V8.primaryHash}"
    && config.iterations === ${V8.iterations};
  let cryptoOk = false;
  try {
    const salt = Uint8Array.from(atob("${V8.healthSalt}"), (c) => c.charCodeAt(0));
    const got = await hashPassword("admin-health-v8", salt, ${V8.iterations});
    cryptoOk = secureEqual(got, normalizedPasswordHash("${V8.healthHash}"));
  } catch (_) {}
  return json({
    service: "community-admin",
    auth_version: ADMIN_AUTH_VERSION,
    algorithm: "PBKDF2-SHA256",
    iterations: config.iterations,
    config_ok: configOk,
    crypto_ok: cryptoOk,
  }, configOk && cryptoOk ? 200 : 503);
}`;
  source = replaceRequired(source, oldVerify, newVerify, "xác minh Admin edge-safe và health test");

  source = replaceRequired(
    source,
    '  const level = await verifyAdminPasswordLevel(env, body && body.password);\n  if (!level) return json({ error: "invalid_admin_login" }, 401);',
    '  const level = await verifyAdminPasswordLevel(env, body && body.password);\n  if (level === "__crypto_error__") return json({ error: "admin_auth_unavailable" }, 503);\n  if (!level) return json({ error: "invalid_admin_login" }, 401);',
    "phân biệt lỗi crypto với sai mật khẩu"
  );

  source = replaceRequired(
    source,
    '  if (action === "login" && request.method === "POST") return handleAdminLogin(request, env);',
    '  if (action === "health" && request.method === "GET") return adminAuthHealth(env);\n  if (action === "login" && request.method === "POST") return handleAdminLogin(request, env);',
    "route health Admin V8"
  );
  return source;
});

await edit("assets/gate.js", (source) => {
  if (source.includes("/* Account V8 frontend auth contract */")) return source;
  source = replaceRequired(
    source,
    '/* Account V7 admin login hotfix */\n  var MARKET_ADMIN_AUTH_VERSION = "2026-07-23-v7";',
    '/* Account V7 admin login hotfix */\n  /* Account V8 frontend auth contract */\n  var MARKET_ADMIN_AUTH_VERSION = "2026-07-23-v8";',
    "frontend auth version V8"
  );
  source = replaceRequired(
    source,
    '        msg.textContent = error.code === "invalid_admin_login" ? "Mật khẩu Admin không đúng." : "Không đăng nhập được Admin. Vui lòng thử lại.";',
    '        msg.textContent = error.code === "invalid_admin_login" ? "Mật khẩu Admin không đúng." : error.code === "admin_auth_unavailable" ? "Hệ thống xác thực Admin đang lỗi. Vui lòng tải lại sau ít phút." : "Không đăng nhập được Admin. Vui lòng thử lại.";',
    "thông báo lỗi crypto riêng"
  );
  return source;
});

await edit("assets/community-admin.js", (source) => {
  if (source.includes("/* Account V8 admin page contract */")) return source;
  source = replaceRequired(
    source,
    '  /* Account V7 admin page session guard */\n  var ADMIN_AUTH_VERSION = "2026-07-23-v7";',
    '  /* Account V7 admin page session guard */\n  /* Account V8 admin page contract */\n  var ADMIN_AUTH_VERSION = "2026-07-23-v8";',
    "trang quản trị auth version V8"
  );
  return source;
});

for (const [path, markers] of [
  ["backend/community.js", ["Account V8 edge-safe admin authentication", 'ADMIN_AUTH_VERSION = "2026-07-23-v8"', "ADMIN_V8_PASSWORD_SALT_B64", "adminAuthHealth", "admin_auth_unavailable", 'action === "health"']],
  ["assets/gate.js", ["Account V8 frontend auth contract", 'MARKET_ADMIN_AUTH_VERSION = "2026-07-23-v8"', "admin_auth_unavailable"]],
  ["assets/community-admin.js", ["Account V8 admin page contract", 'ADMIN_AUTH_VERSION = "2026-07-23-v8"']],
]) {
  const value = await readFile(path, "utf8");
  for (const marker of markers) if (!value.includes(marker)) throw new Error(`Thiếu marker ${marker} trong ${path}`);
}

console.log("Account V8: PBKDF2 10000 vòng phù hợp edge, cấu hình ghim rõ, health production và lỗi crypto tách biệt.");
