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
  if (source.includes("/* Account V4 edge authentication */")) return source;

  const oldPasswordFunctions = `async function createPasswordRecord(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iterations = 210000;
  return { salt: b64url(salt), iterations, hash: await hashPassword(password, salt, iterations) };
}
async function verifyPassword(password, record) {
  try {
    const salt = Uint8Array.from(decodeB64url(record.salt), (c) => c.charCodeAt(0));
    return secureEqual(await hashPassword(password, salt, record.iterations), record.hash);
  } catch (_) { return false; }
}`;

  const newPasswordFunctions = `async function edgePasswordHash(env, password, salt) {
  const pepper = sessionSecret(env);
  if (!pepper) throw new Error("invalid_session_secret");
  return hmac(pepper, \`member-password:v1:\${salt}:\${password}\`);
}
async function createPasswordRecord(env, password) {
  const salt = b64url(crypto.getRandomValues(new Uint8Array(16)));
  return { scheme: "hmac-sha256-v1", salt, hash: await edgePasswordHash(env, password, salt) };
}
async function verifyPassword(env, password, record) {
  try {
    if (record && record.scheme === "hmac-sha256-v1") {
      return secureEqual(await edgePasswordHash(env, password, String(record.salt || "")), record.hash);
    }
    // Đọc tương thích bản PBKDF2 cũ; mọi tài khoản mới dùng HMAC có pepper để phù hợp CPU edge.
    const salt = Uint8Array.from(decodeB64url(record.salt), (c) => c.charCodeAt(0));
    return secureEqual(await hashPassword(password, salt, record.iterations), record.hash);
  } catch (_) { return false; }
}`;
  source = replaceRequired(source, oldPasswordFunctions, newPasswordFunctions, "hàm lưu và xác minh mật khẩu");
  source = replaceRequired(source, "const passwordRecord = await createPasswordRecord(password);", "const passwordRecord = await createPasswordRecord(env, password);", "tạo bản ghi mật khẩu với pepper");
  source = replaceRequired(source, "await verifyPassword(password, login.password)", "await verifyPassword(env, password, login.password)", "xác minh mật khẩu với pepper");

  const oldLimiter = `  if (env.PUBLIC_RATE_LIMITER && typeof env.PUBLIC_RATE_LIMITER.limit === "function") {
    const ip = request.headers.get("cf-connecting-ip") || "unknown";
    const result = await env.PUBLIC_RATE_LIMITER.limit({ key: \`community-entry:\${route}:\${ip}:\${did}\` });
    if (!result || !result.success) return { rateLimited: true };
  }`;
  const newLimiter = `  if (env.PUBLIC_RATE_LIMITER && typeof env.PUBLIC_RATE_LIMITER.limit === "function") {
    try {
      const ip = request.headers.get("cf-connecting-ip") || "unknown";
      const result = await env.PUBLIC_RATE_LIMITER.limit({ key: \`community-entry:\${route}:\${ip}:\${did}\` });
      if (!result || !result.success) return { rateLimited: true };
    } catch (_) {
      // Đây chỉ là lớp chống spam best-effort; lỗi binding không được làm hỏng đăng ký hợp lệ.
    }
  }`;
  source = replaceRequired(source, oldLimiter, newLimiter, "rate limiter fail-open");

  const oldRegisterStage = `  const created = await createAccount(env, body || {}, entry.did);
  if (created.error) return json({ error: created.error }, created.status);
  const telegramNotified = await notifyNewMember(request, env, created.profile, entry.did, body && body.device).catch(() => false);
  return entryResponse(env, created.profile, entry.did, 201, { telegram_notified: telegramNotified });`;
  const newRegisterStage = `  let created;
  try { created = await createAccount(env, body || {}, entry.did); }
  catch (_) { return json({ error: "register_account_stage" }, 500); }
  if (created.error) return json({ error: created.error }, created.status);
  const telegramNotified = await notifyNewMember(request, env, created.profile, entry.did, body && body.device).catch(() => false);
  try { return await entryResponse(env, created.profile, entry.did, 201, { telegram_notified: telegramNotified }); }
  catch (_) { return json({ error: "register_session_stage" }, 500); }`;
  source = replaceRequired(source, oldRegisterStage, newRegisterStage, "mã lỗi pha đăng ký an toàn");

  const oldLoginStage = `  const authenticated = await authenticateAccount(env, body || {}, entry.did);
  if (authenticated.error) return json({ error: authenticated.error }, authenticated.status);
  return entryResponse(env, authenticated.profile, entry.did);`;
  const newLoginStage = `  let authenticated;
  try { authenticated = await authenticateAccount(env, body || {}, entry.did); }
  catch (_) { return json({ error: "login_account_stage" }, 500); }
  if (authenticated.error) return json({ error: authenticated.error }, authenticated.status);
  try { return await entryResponse(env, authenticated.profile, entry.did); }
  catch (_) { return json({ error: "login_session_stage" }, 500); }`;
  source = replaceRequired(source, oldLoginStage, newLoginStage, "mã lỗi pha đăng nhập an toàn");

  source = source.replace("\nexport async function handleCommunity", "\n/* Account V4 edge authentication */\nexport async function handleCommunity");
  return source;
});

const backend = await readFile("backend/community.js", "utf8");
for (const marker of ["Account V4 edge authentication", "hmac-sha256-v1", "edgePasswordHash", "register_account_stage", "register_session_stage", "login_account_stage", "login_session_stage"]) {
  if (!backend.includes(marker)) throw new Error(`Thiếu marker Account V4: ${marker}`);
}
if (backend.includes("const iterations = 210000;\n  return { salt: b64url(salt), iterations")) throw new Error("Tài khoản mới vẫn đang dùng PBKDF2 210000 vòng");
console.log("Account V4: HMAC-SHA256 salt + pepper cho tài khoản mới, legacy PBKDF2 read-only, limiter fail-open.");
