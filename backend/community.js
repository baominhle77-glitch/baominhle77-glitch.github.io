/*
 * Community account system for Bói toán.
 * Roles: guest, reader. Admin uses ADMIN_TOKEN; private chat oversight additionally
 * requires the single owner device bound in KV.
 */
const APP = "boitoan";
const ACCOUNT_TTL = 3650 * 24 * 60 * 60;
const COMMUNITY_SESSION_TTL = 30 * 24 * 60 * 60;
const GATE_SESSION_TTL = 12 * 60 * 60;
const MESSAGE_TTL = 30 * 24 * 60 * 60;
const REVIEW_TTL = 3650 * 24 * 60 * 60;
const MAX_PAGE = 100;
const enc = new TextEncoder();

const json = (value, status = 200) => new Response(JSON.stringify(value), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  },
});

function clean(value, max = 200) {
  return String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
}
function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}
function validUsername(value) {
  return /^[a-z0-9_]{3,30}$/.test(String(value || "").toLowerCase());
}
function validRole(value) { return value === "guest" || value === "reader"; }
function hasLink(value) {
  const text = String(value || "").toLowerCase();
  return /(?:https?:\/\/|www\.|mailto:|tel:|t\.me\/|@[a-z0-9_]{3,}|\b[a-z0-9-]+\.(?:com|net|org|vn|io|me|app|co|info|xyz)\b)/i.test(text);
}
function validQrData(value) {
  if (!value) return true;
  return /^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(value) && value.length <= 220000;
}
function b64url(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function decodeB64url(value) {
  const raw = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  return atob(raw + "=".repeat((4 - raw.length % 4) % 4));
}
function secureEqual(a, b) {
  const left = String(a || ""), right = String(b || "");
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return diff === 0;
}
async function hmac(secret, data) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}
async function makeJwt(secret, payload, ttl = COMMUNITY_SESSION_TTL) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(enc.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = b64url(enc.encode(JSON.stringify({ ...payload, iat: now, exp: now + ttl })));
  return `${header}.${body}.${await hmac(secret, `${header}.${body}`)}`;
}
async function verifyJwt(secret, token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) return null;
  if (!secureEqual(await hmac(secret, `${parts[0]}.${parts[1]}`), parts[2])) return null;
  try {
    const body = JSON.parse(decodeB64url(parts[1]));
    return body.exp > Math.floor(Date.now() / 1000) ? body : null;
  } catch (_) { return null; }
}
function bearer(request) { return (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, ""); }
async function readJson(request, max = 300000) {
  const size = Number(request.headers.get("content-length") || 0);
  if (size > max) return null;
  const raw = await request.text();
  if (!raw || raw.length > max) return null;
  try { return JSON.parse(raw); } catch (_) { return null; }
}
async function getJson(env, key) {
  const raw = await env.KV.get(key);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (_) { return null; }
}
async function putJson(env, key, value, ttl = ACCOUNT_TTL) {
  await env.KV.put(key, JSON.stringify(value), { expirationTtl: ttl });
}
function sessionSecret(env) { return String(env.SESSION_SECRET || "").length >= 32 ? String(env.SESSION_SECRET) : ""; }
function loginKey(username) { return `community-login:${username}`; }
function profileKey(uid) { return `community-profile:${uid}`; }
function sessionKey(sid) { return `community-session:${sid}`; }
function deviceAccountKey(did) { return `community-device:${APP}:${did}`; }
function readerIndexKey(uid) { return `community-reader:${uid}`; }
function reviewKey(readerId, authorId) { return `community-review:${readerId}:${authorId}`; }
function conversationKey(id) { return `community-conversation:${id}`; }
function userConversationKey(uid, id) { return `community-user-conversation:${uid}:${id}`; }
function messagePrefix(id) { return `community-message:${id}:`; }
function messageKey(id, at, mid) { return `${messagePrefix(id)}${String(at).padStart(13, "0")}:${mid}`; }

async function hashPassword(password, saltBytes, iterations = 210000) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: saltBytes, iterations, hash: "SHA-256" }, key, 256);
  return b64url(bits);
}
async function edgePasswordHash(env, password, salt) {
  const pepper = sessionSecret(env);
  if (!pepper) throw new Error("invalid_session_secret");
  return hmac(pepper, `member-password:v1:${salt}:${password}`);
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
}

async function gateAuth(request, env) {
  const secret = sessionSecret(env);
  if (!secret) return null;
  const claims = await verifyJwt(secret, bearer(request));
  if (!claims || claims.aud !== "gate-chat" || claims.app !== APP || !isUuid(claims.sid) || !isUuid(claims.did)) return null;
  const session = await getJson(env, `session:${claims.sid}`);
  if (!session || !session.active || session.expires_at <= Date.now() || session.app !== APP || session.did !== claims.did) return null;
  return claims;
}
async function communityAuth(request, env) {
  const secret = sessionSecret(env);
  if (!secret) return null;
  const claims = await verifyJwt(secret, bearer(request));
  if (!claims || claims.aud !== "community" || !isUuid(claims.sid) || !isUuid(claims.uid) || !isUuid(claims.did) || !validRole(claims.role)) return null;
  const session = await getJson(env, sessionKey(claims.sid));
  /* Nick mô phỏng nằm trong khoá chỉ mục chứ không có khoá hồ sơ riêng. */
  const profile = (await getJson(env, profileKey(claims.uid)))
    || (claims.mode === "puppet" ? await simProfileById(env, claims.uid) : null);
  if (!session || !session.active || session.expires_at <= Date.now() || session.uid !== claims.uid || session.did !== claims.did || !profile || profile.suspended) return null;
  return { claims, profile };
}
async function issueCommunitySession(env, profile, did, options = {}) {
  const sid = crypto.randomUUID();
  const expiresAt = Date.now() + COMMUNITY_SESSION_TTL * 1000;
  const mode = ["impersonation", "puppet"].includes(options.mode) ? options.mode : "member";
  await putJson(env, sessionKey(sid), { active: true, uid: profile.id, did, mode, expires_at: expiresAt }, COMMUNITY_SESSION_TTL);
  return makeJwt(sessionSecret(env), { aud: "community", sid, uid: profile.id, did, role: profile.role, mode });
}
function publicProfile(profile, includePrivate = false) {
  const base = {
    id: profile.id,
    username: profile.username,
    role: profile.role,
    display_name: profile.display_name,
    bio: profile.bio || "",
    created_at: profile.created_at,
  };
  if (includePrivate) base.suspended = !!profile.suspended;
  if (profile.role === "reader") {
    base.specialties = Array.isArray(profile.specialties) ? profile.specialties : [];
    base.bank = includePrivate || profile.show_payment_publicly !== false ? {
      bank_name: profile.bank_name || "",
      account_number: profile.account_number || "",
      account_name: profile.account_name || "",
      qr_data: profile.qr_data || "",
    } : null;
    base.rating = Number(profile.rating || 0);
    base.review_count = Number(profile.review_count || 0);
  }
  return base;
}
function cleanSpecialties(value) {
  const items = Array.isArray(value) ? value : String(value || "").split(",");
  return [...new Set(items.map((x) => clean(x, 50)).filter(Boolean))].slice(0, 12);
}
function validateProfileBody(body, role) {
  const result = {
    display_name: clean(body.display_name, 80),
    bio: clean(body.bio, 1000),
  };
  if (!result.display_name) return { error: "display_name_required" };
  if (role === "reader") {
    result.specialties = cleanSpecialties(body.specialties);
    result.bank_name = clean(body.bank_name, 80);
    result.account_number = clean(body.account_number, 60);
    result.account_name = clean(body.account_name, 100);
    result.qr_data = String(body.qr_data || "");
    result.show_payment_publicly = body.show_payment_publicly !== false;
    const publicText = [result.display_name, result.bio, ...result.specialties, result.bank_name, result.account_number, result.account_name].join(" ");
    if (hasLink(publicText)) return { error: "links_not_allowed" };
    if (!validQrData(result.qr_data)) return { error: "invalid_qr" };
  }
  return { value: result };
}

async function publicEntry(request, env, body, route) {
  const gate = await gateAuth(request, env);
  if (gate) return { did: gate.did, existingGate: true };
  const did = clean(body && body.device_id, 80);
  if (!body || body.entry !== true || !isUuid(did)) return null;
  if (env.PUBLIC_RATE_LIMITER && typeof env.PUBLIC_RATE_LIMITER.limit === "function") {
    try {
      const ip = request.headers.get("cf-connecting-ip") || "unknown";
      const result = await env.PUBLIC_RATE_LIMITER.limit({ key: `community-entry:${route}:${ip}:${did}` });
      if (!result || !result.success) return { rateLimited: true };
    } catch (_) {
      // Đây chỉ là lớp chống spam best-effort; lỗi binding không được làm hỏng đăng ký hợp lệ.
    }
  }
  return { did, existingGate: false };
}
function entryDecryptKey(env) {
  return String(env.DECRYPT_KEY_BOITOAN || env.DECRYPT_KEY || "");
}
async function issueGateSession(env, profile, did) {
  const secret = sessionSecret(env);
  if (!secret) throw new Error("invalid_session_secret");
  const sid = crypto.randomUUID();
  const cid = (await hmac(secret, `chat:${APP}:${did}`)).slice(0, 32);
  await putJson(env, `session:${sid}`, {
    active: true, app: APP, did, cid, uid: profile.id,
    expires_at: Date.now() + GATE_SESSION_TTL * 1000,
  }, GATE_SESSION_TTL);
  const token = await makeJwt(secret, {
    ver: 2, aud: "gate-chat", app: APP, scope: ["access", "log", "chat"],
    sid, cid, did, sub: profile.id,
  }, GATE_SESSION_TTL);
  return token;
}
function browserLabel(ua) {
  const value = String(ua || "");
  if (/Edg\//.test(value)) return "Edge";
  if (/OPR\//.test(value)) return "Opera";
  if (/Firefox\//.test(value)) return "Firefox";
  if (/CriOS\//.test(value)) return "Chrome iOS";
  if (/Chrome\//.test(value)) return "Chrome";
  if (/Safari\//.test(value) && /Version\//.test(value)) return "Safari";
  return "Khác";
}
function redactedIp(request) {
  const raw = String(request.headers.get("cf-connecting-ip") || "");
  const v4 = raw.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4 && v4.slice(1).every((part) => Number(part) <= 255)) return `${v4[1]}.${v4[2]}.${v4[3]}.0/24`;
  if (raw.includes(":")) return raw.split(":").slice(0, 4).join(":") + "::/64";
  return "";
}
function cleanEntryDevice(value) {
  const device = value && typeof value === "object" ? value : {};
  return {
    ua: clean(device.ua, 260),
    lang: clean(device.lang, 20),
    tz: clean(device.tz, 60),
    screen: /^\d{2,5}x\d{2,5}$/.test(String(device.screen || "")) ? String(device.screen) : "",
    platform: clean(device.platform, 60),
  };
}
async function notifyNewMember(request, env, profile, did, deviceValue) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return false;
  const device = cleanEntryDevice(deviceValue);
  const country = request.cf && /^[A-Z]{2}$/.test(request.cf.country || "") ? request.cf.country : "?";
  const text = [
    "Thành viên mới · Spirituality Market",
    `Vai trò: ${profile.role === "reader" ? "Reader / Người xem bói" : "Khách"}`,
    `Tên hiển thị: ${profile.display_name}`,
    `Tên đăng nhập: ${profile.username}`,
    `Trình duyệt: ${browserLabel(device.ua || request.headers.get("user-agent"))}`,
    `Nền tảng: ${device.platform || "?"} · Màn hình: ${device.screen || "?"}`,
    `Ngôn ngữ: ${device.lang || "?"} · Múi giờ: ${device.tz || "?"}`,
    `Mã trình duyệt: ${did}`,
    `Quốc gia/IP rút gọn: ${country} · ${redactedIp(request) || "không rõ"}`,
    `Lúc: ${new Date().toISOString()}`,
  ].join("\n");
  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text }),
  });
  const data = await response.json().catch(() => ({}));
  return !!(response.ok && data.ok);
}
async function createAccount(env, body, did) {
  const username = clean(body && body.username, 30).toLowerCase();
  const password = String(body && body.password || "");
  const role = body && body.role;
  if (!validUsername(username) || password.length < 8 || password.length > 128 || !validRole(role)) return { error: "invalid_account", status: 400 };
  if (await env.KV.get(loginKey(username))) return { error: "username_exists", status: 409 };
  const validated = validateProfileBody(body || {}, role);
  if (validated.error) return { error: validated.error, status: 400 };
  const id = crypto.randomUUID();
  const now = Date.now();
  const passwordRecord = await createPasswordRecord(env, password);
  const profile = { id, username, role, ...validated.value, suspended: false, rating: 0, review_count: 0, created_at: now, updated_at: now };
  await Promise.all([
    putJson(env, loginKey(username), { id, username, role, password: passwordRecord, created_at: now }),
    putJson(env, profileKey(id), profile),
    putJson(env, deviceAccountKey(did), { uid: id, bound_at: now }),
    role === "reader" ? putJson(env, readerIndexKey(id), { uid: id, created_at: now }) : Promise.resolve(),
  ]);
  return { profile };
}
async function authenticateAccount(env, body, did) {
  const username = clean(body && body.username, 30).toLowerCase();
  const password = String(body && body.password || "");
  const login = validUsername(username) && await getJson(env, loginKey(username));
  if (!login || !(await verifyPassword(env, password, login.password))) return { error: "invalid_login", status: 401 };
  const profile = await getJson(env, profileKey(login.id));
  if (!profile || profile.suspended) return { error: "account_unavailable", status: 403 };
  await putJson(env, deviceAccountKey(did), { uid: profile.id, bound_at: Date.now() });
  return { profile };
}
async function entryResponse(env, profile, did, status = 200, extra = {}) {
  const [communityToken, gateToken] = await Promise.all([
    issueCommunitySession(env, profile, did),
    issueGateSession(env, profile, did),
  ]);
  const payload = { token: communityToken, gate_token: gateToken, profile: publicProfile(profile, true), ...extra };
  const key = entryDecryptKey(env);
  if (key) payload.key = key;
  return json(payload, status);
}

async function handleRegister(request, env) {
  const body = await readJson(request);
  const entry = await publicEntry(request, env, body, "register");
  if (!entry) return json({ error: "gate_approval_required" }, 401);
  if (entry.rateLimited) return json({ error: "rate_limited" }, 429);
  if (!sessionSecret(env)) return json({ error: "community_server" }, 503);
  let created;
  try { created = await createAccount(env, body || {}, entry.did); }
  catch (_) { return json({ error: "register_account_stage" }, 500); }
  if (created.error) return json({ error: created.error }, created.status);
  const telegramNotified = await notifyNewMember(request, env, created.profile, entry.did, body && body.device).catch(() => false);
  try { return await entryResponse(env, created.profile, entry.did, 201, { telegram_notified: telegramNotified }); }
  catch (_) { return json({ error: "register_session_stage" }, 500); }
}
async function handleLogin(request, env) {
  const body = await readJson(request);
  const entry = await publicEntry(request, env, body, "login");
  if (!entry) return json({ error: "gate_approval_required" }, 401);
  if (entry.rateLimited) return json({ error: "rate_limited" }, 429);
  if (!sessionSecret(env)) return json({ error: "community_server" }, 503);
  let authenticated;
  try { authenticated = await authenticateAccount(env, body || {}, entry.did); }
  catch (_) { return json({ error: "login_account_stage" }, 500); }
  if (authenticated.error) return json({ error: authenticated.error }, authenticated.status);
  try { return await entryResponse(env, authenticated.profile, entry.did); }
  catch (_) { return json({ error: "login_session_stage" }, 500); }
}
async function handleMe(request, env) {
  const auth = await communityAuth(request, env);
  if (!auth) return json({ error: "unauthorized" }, 401);
  if (request.method === "GET") return json({ profile: publicProfile(auth.profile, true), session_mode: auth.claims.mode || "member" });
  if (request.method === "DELETE") {
    if (auth.claims.mode === "impersonation") return json({ error: "read_only_impersonation" }, 403);
    await deleteMemberAccount(env, auth.profile.id);
    return json({ ok: true, deleted: auth.profile.id });
  }
  if (auth.claims.mode === "impersonation") return json({ error: "read_only_impersonation" }, 403);
  const body = await readJson(request);
  const validated = validateProfileBody(body || {}, auth.profile.role);
  if (validated.error) return json({ error: validated.error }, 400);
  const profile = { ...auth.profile, ...validated.value, updated_at: Date.now() };
  await putJson(env, profileKey(profile.id), profile);
  return json({ profile: publicProfile(profile, true) });
}

async function listByPrefix(env, prefix, limit = MAX_PAGE) {
  const page = await env.KV.list({ prefix, limit });
  const values = await Promise.all(page.keys.map((k) => getJson(env, k.name)));
  return values.filter(Boolean);
}
async function reviewsForReader(env, readerId) {
  const reviews = await listByPrefix(env, `community-review:${readerId}:`, 100);
  return reviews.sort((a, b) => b.updated_at - a.updated_at).map((r) => ({
    id: r.id, reader_id: r.reader_id, author_id: r.author_id, author_name: r.author_name,
    rating: r.rating, text: r.text, created_at: r.created_at, updated_at: r.updated_at,
  }));
}
async function recalculateRating(env, readerId) {
  const reviews = await reviewsForReader(env, readerId);
  const profile = await getJson(env, profileKey(readerId));
  if (!profile || profile.role !== "reader") return;
  profile.review_count = reviews.length;
  profile.rating = reviews.length ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10 : 0;
  profile.updated_at = Date.now();
  await putJson(env, profileKey(readerId), profile);
}
async function handleReaders(request, env, path) {
  const viewer = await communityAuth(request, env);
  if (!viewer) return json({ error: "unauthorized" }, 401);
  const parts = path.split("/").filter(Boolean);
  const readerId = parts[3] || "";
  const action = parts[4] || "";
  if (!readerId) {
    if (request.method !== "GET") return json({ error: "method_not_allowed" }, 405);
    const refs = await listByPrefix(env, "community-reader:", 100);
    const profiles = (await Promise.all(refs.map((r) => getJson(env, profileKey(r.uid))))).filter((p) => p && !p.suspended && p.role === "reader");
    return json({ readers: profiles.map((p) => publicProfile(p, false)).sort((a, b) => b.rating - a.rating || b.review_count - a.review_count) });
  }
  if (!isUuid(readerId)) return json({ error: "invalid_reader" }, 400);
  const reader = await getJson(env, profileKey(readerId));
  if (!reader || reader.role !== "reader" || reader.suspended) return json({ error: "not_found" }, 404);
  if (!action && request.method === "GET") return json({ reader: publicProfile(reader, false), reviews: await reviewsForReader(env, readerId) });
  if (action !== "reviews") return json({ error: "not_found" }, 404);
  if (request.method === "POST") {
    const auth = viewer;
    if (auth.claims.mode === "impersonation") return json({ error: "read_only_impersonation" }, 403);
    if (auth.profile.role !== "guest") return json({ error: "guest_only" }, 403);
    const body = await readJson(request);
    const rating = Number(body && body.rating);
    const text = clean(body && body.text, 1500);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !text) return json({ error: "invalid_review" }, 400);
    const key = reviewKey(readerId, auth.profile.id);
    const old = await getJson(env, key);
    const review = {
      id: old && old.id || crypto.randomUUID(), reader_id: readerId, author_id: auth.profile.id,
      author_name: auth.profile.display_name, rating, text,
      created_at: old && old.created_at || Date.now(), updated_at: Date.now(),
    };
    await putJson(env, key, review, REVIEW_TTL);
    await recalculateRating(env, readerId);
    return json({ review }, old ? 200 : 201);
  }
  if (request.method === "DELETE") {
    const auth = viewer;
    if (auth.claims.mode === "impersonation") return json({ error: "read_only_impersonation" }, 403);
    const key = reviewKey(readerId, auth.profile.id);
    if (!(await env.KV.get(key))) return json({ error: "not_found" }, 404);
    await env.KV.delete(key);
    await recalculateRating(env, readerId);
    return json({ ok: true });
  }
  return json({ error: "method_not_allowed" }, 405);
}

async function conversationId(env, guestId, readerId) {
  return (await hmac(sessionSecret(env), `conversation:${guestId}:${readerId}`)).slice(0, 36).replace(/_/g, "a").replace(/-/g, "b");
}
function participant(rec, uid) { return rec && (rec.guest_id === uid || rec.reader_id === uid); }
async function handleConversations(request, env, path) {
  const auth = await communityAuth(request, env);
  if (!auth) return json({ error: "unauthorized" }, 401);
  if (auth.claims.mode === "impersonation" && request.method !== "GET") return json({ error: "read_only_impersonation" }, 403);
  const parts = path.split("/").filter(Boolean);
  const id = parts[3] || "";
  const action = parts[4] || "";
  if (!id) {
    if (request.method === "GET") {
      const refs = await listByPrefix(env, `community-user-conversation:${auth.profile.id}:`, 100);
      const conversations = (await Promise.all(refs.map((x) => getJson(env, conversationKey(x.id))))).filter(Boolean);
      return json({ conversations: conversations.sort((a, b) => b.updated_at - a.updated_at) });
    }
    if (request.method === "POST") {
      if (auth.profile.role !== "guest") return json({ error: "guest_only" }, 403);
      const body = await readJson(request);
      const readerId = body && body.reader_id;
      const reader = isUuid(readerId) && await getJson(env, profileKey(readerId));
      if (!reader || reader.role !== "reader" || reader.suspended) return json({ error: "reader_not_found" }, 404);
      const cid = await conversationId(env, auth.profile.id, readerId);
      let rec = await getJson(env, conversationKey(cid));
      if (!rec) {
        rec = {
          id: cid, guest_id: auth.profile.id, guest_name: auth.profile.display_name,
          reader_id: reader.id, reader_name: reader.display_name,
          quote_amount: null, payment_status: "none", created_at: Date.now(), updated_at: Date.now(),
        };
        await Promise.all([
          putJson(env, conversationKey(cid), rec, MESSAGE_TTL),
          putJson(env, userConversationKey(auth.profile.id, cid), { id: cid }, MESSAGE_TTL),
          putJson(env, userConversationKey(reader.id, cid), { id: cid }, MESSAGE_TTL),
        ]);
      }
      return json({ conversation: rec }, 201);
    }
    return json({ error: "method_not_allowed" }, 405);
  }
  if (!/^[a-zA-Z0-9_-]{20,50}$/.test(id)) return json({ error: "invalid_conversation" }, 400);
  const rec = await getJson(env, conversationKey(id));
  if (!participant(rec, auth.profile.id)) return json({ error: "not_found" }, 404);
  if (!action && request.method === "GET") return json({ conversation: rec });
  if (action === "messages") {
    if (request.method === "GET") {
      const messages = await listByPrefix(env, messagePrefix(id), 100);
      return json({ messages: messages.sort((a, b) => a.created_at - b.created_at) });
    }
    if (request.method === "POST") {
      const body = await readJson(request);
      const text = clean(body && body.text, 3000);
      const type = body && body.type === "reading" && auth.profile.role === "reader" ? "reading" : "text";
      const clientId = body && body.client_id;
      if (!text || !isUuid(clientId)) return json({ error: "invalid_message" }, 400);
      const dedupe = `community-message-done:${id}:${auth.profile.id}:${clientId}`;
      if (await env.KV.get(dedupe)) return json({ ok: true, duplicate: true });
      const now = Date.now();
      const message = { id: clientId, conversation_id: id, sender_id: auth.profile.id, sender_role: auth.profile.role, sender_name: auth.profile.display_name, type, text, created_at: now };
      rec.updated_at = now;
      await Promise.all([
        putJson(env, messageKey(id, now, clientId), message, MESSAGE_TTL),
        putJson(env, dedupe, { ok: true }, MESSAGE_TTL),
        putJson(env, conversationKey(id), rec, MESSAGE_TTL),
        putJson(env, userConversationKey(rec.guest_id, id), { id }, MESSAGE_TTL),
        putJson(env, userConversationKey(rec.reader_id, id), { id }, MESSAGE_TTL),
      ]);
      return json({ message }, 201);
    }
  }
  if (action === "quote" && request.method === "POST") {
    if (auth.profile.id !== rec.reader_id) return json({ error: "reader_only" }, 403);
    const body = await readJson(request);
    const amount = Number(body && body.amount);
    if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 1000000000) return json({ error: "invalid_amount" }, 400);
    rec.quote_amount = amount; rec.payment_status = "quoted"; rec.updated_at = Date.now();
    await putJson(env, conversationKey(id), rec, MESSAGE_TTL);
    return json({ conversation: rec });
  }
  if (action === "payment-notice" && request.method === "POST") {
    if (auth.profile.id !== rec.guest_id || !rec.quote_amount) return json({ error: "forbidden" }, 403);
    rec.payment_status = "customer_reported"; rec.updated_at = Date.now();
    await putJson(env, conversationKey(id), rec, MESSAGE_TTL);
    return json({ conversation: rec });
  }
  if (action === "confirm-payment" && request.method === "POST") {
    if (auth.profile.id !== rec.reader_id || !rec.quote_amount) return json({ error: "forbidden" }, 403);
    rec.payment_status = "confirmed"; rec.updated_at = Date.now();
    await putJson(env, conversationKey(id), rec, MESSAGE_TTL);
    return json({ conversation: rec });
  }
  return json({ error: "not_found" }, 404);
}

function postKey(id) { return `community-post:${id}`; }
function postCommentPrefix(id) { return `community-post-comment:${id}:`; }
function postCommentKey(id, at, cid) { return `${postCommentPrefix(id)}${String(at).padStart(13, "0")}:${cid}`; }
function auditKey(at, id) { return `community-audit:${String(at).padStart(13, "0")}:${id}`; }
async function adminAudit(env, request, action, target, extra = {}) {
  const at = Date.now();
  try {
  await putJson(env, auditKey(at, crypto.randomUUID()), {
    action, target: clean(target, 120), device_id: clean(request.headers.get("x-owner-device-id"), 80), created_at: at, ...extra,
  }, ACCOUNT_TTL);
  } catch (_) { /* Ghi nhật ký hỏng không được chặn đăng nhập hay thao tác quản trị. */ }
}
async function deleteMemberAccount(env, uid) {
  const profile = isUuid(uid) && await getJson(env, profileKey(uid));
  if (!profile) return null;
  const deletions = [
    env.KV.delete(loginKey(profile.username)), env.KV.delete(profileKey(uid)), env.KV.delete(readerIndexKey(uid)),
  ];
  for (const prefix of ["community-session:", "session:", "community-device:", "community-review:", "community-user-conversation:"]) {
    const page = await env.KV.list({ prefix, limit: 1000 });
    for (const key of page.keys) {
      const value = await getJson(env, key.name);
      if ((value && (value.uid === uid || value.author_id === uid || value.reader_id === uid)) || key.name.startsWith(`community-user-conversation:${uid}:`)) deletions.push(env.KV.delete(key.name));
    }
  }
  await Promise.all(deletions);
  return profile;
}
async function handlePosts(request, env, path) {
  const auth = await communityAuth(request, env);
  if (!auth) return json({ error: "unauthorized" }, 401);
  const parts = path.split("/").filter(Boolean);
  const postId = parts[3] || "";
  const action = parts[4] || "";
  if (!postId && request.method === "GET") {
    const posts = (await listByPrefix(env, "community-post:", 100)).sort((a, b) => b.created_at - a.created_at);
    return json({ posts });
  }
  if (!isUuid(postId)) return json({ error: "invalid_post" }, 400);
  const post = await getJson(env, postKey(postId));
  if (!post) return json({ error: "not_found" }, 404);
  if (!action && request.method === "GET") {
    const comments = (await listByPrefix(env, postCommentPrefix(postId), 200)).sort((a, b) => a.created_at - b.created_at);
    return json({ post, comments, session_mode: auth.claims.mode || "member" });
  }
  if (action === "comments" && request.method === "POST") {
    if (auth.claims.mode === "impersonation") return json({ error: "read_only_impersonation" }, 403);
    if (post.closed) return json({ error: "post_closed" }, 409);
    const body = await readJson(request);
    const text = clean(body && body.text, 2000);
    if (!text) return json({ error: "invalid_comment" }, 400);
    const now = Date.now(), id = crypto.randomUUID();
    const parentId = clean(body && body.parent_id, 60);
    if (parentId && !isUuid(parentId)) return json({ error: "invalid_parent" }, 400);
    if (parentId && !(await findComment(env, postId, parentId))) return json({ error: "parent_not_found" }, 404);
    const comment = { id, post_id: postId, parent_id: parentId || null, author_id: auth.profile.id, author_name: auth.profile.display_name, author_role: auth.profile.role, text, created_at: now, likes: 0, liked_by: [] };
    await putJson(env, postCommentKey(postId, now, id), comment, ACCOUNT_TTL);
    post.comment_count = Number(post.comment_count || 0) + 1; post.updated_at = now;
    await putJson(env, postKey(postId), post, ACCOUNT_TTL);
    return json({ comment }, 201);
  }
  /* Bật/tắt thích một bình luận */
  if (action === "comment-like" && request.method === "POST") {
    if (auth.claims.mode === "impersonation") return json({ error: "read_only_impersonation" }, 403);
    const body = await readJson(request);
    const commentId = clean(body && body.comment_id, 60);
    if (!isUuid(commentId)) return json({ error: "invalid_comment" }, 400);
    const found = await findComment(env, postId, commentId);
    if (!found) return json({ error: "not_found" }, 404);
    const { key, comment } = found;
    const likedBy = Array.isArray(comment.liked_by) ? comment.liked_by : [];
    const uid = auth.profile.id;
    const already = likedBy.indexOf(uid) >= 0;
    comment.liked_by = already ? likedBy.filter((x) => x !== uid) : likedBy.concat([uid]);
    comment.likes = comment.liked_by.length;
    await putJson(env, key, comment, ACCOUNT_TTL);
    return json({ liked: !already, likes: comment.likes });
  }
  /* Bật/tắt thích cả bài đăng */
  if (action === "like" && request.method === "POST") {
    if (auth.claims.mode === "impersonation") return json({ error: "read_only_impersonation" }, 403);
    const likedBy = Array.isArray(post.liked_by) ? post.liked_by : [];
    const uid = auth.profile.id;
    const already = likedBy.indexOf(uid) >= 0;
    post.liked_by = already ? likedBy.filter((x) => x !== uid) : likedBy.concat([uid]);
    post.likes = post.liked_by.length;
    await putJson(env, postKey(postId), post, ACCOUNT_TTL);
    return json({ liked: !already, likes: post.likes });
  }
  return json({ error: "not_found" }, 404);
}
/* Tìm một bình luận theo id trong phạm vi bài đăng (khoá có gắn timestamp nên phải quét). */
async function findComment(env, postId, commentId) {
  const page = await env.KV.list({ prefix: postCommentPrefix(postId), limit: 1000 });
  for (const key of page.keys) {
    if (!key.name.endsWith(`:${commentId}`)) continue;
    const comment = await getJson(env, key.name);
    if (comment) return { key: key.name, comment };
  }
  return null;
}

/* Account V5 single admin session */
const ADMIN_SESSION_SHORT_TTL = 12 * 60 * 60;
const ADMIN_SESSION_LONG_TTL = 30 * 24 * 60 * 60;
function adminSessionKey(sid) { return `community-admin-session:${sid}`; }
/* Account V6 dual admin levels */
/* Account V7 admin login hotfix */
/* Account V8 edge-safe admin authentication */
const ADMIN_AUTH_VERSION = "2026-07-24-v11";
/* Trần số bản ghi phiên đời cũ được đọc trong một lần đăng nhập. */
const ADMIN_SESSION_PROBE_LIMIT = 20;
function adminPasswordConfig(env) {
  return {
    saltB64: String(env.ADMIN_V8_PASSWORD_SALT_B64 || "Wg1fGuw3MNtQz8jVKobFUA=="),
    regularHashB64: String(env.ADMIN_V8_REGULAR_PASSWORD_HASH_B64 || "WP5H0yPnvX7DJ1Gg2ODMiz9m+tAlFhYzf+S4JTXJur0="),
    primaryHashB64: String(env.ADMIN_V8_PRIMARY_PASSWORD_HASH_B64 || "nyCS+HxOceWo77FTxDQySuSTZOhKt+HuRHPBM/7uHZM="),
    iterations: Number(env.ADMIN_V8_PASSWORD_ITERATIONS || 10000),
  };
}
function normalizedPasswordHash(value) {
  return String(value || "").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function verifyAdminPasswordLevel(env, password) {
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
  const configOk = config.saltB64 === "Wg1fGuw3MNtQz8jVKobFUA=="
    && config.regularHashB64 === "WP5H0yPnvX7DJ1Gg2ODMiz9m+tAlFhYzf+S4JTXJur0="
    && config.primaryHashB64 === "nyCS+HxOceWo77FTxDQySuSTZOhKt+HuRHPBM/7uHZM="
    && config.iterations === 10000;
  let cryptoOk = false;
  try {
    const salt = Uint8Array.from(atob("YWRtaW4tdjgtaGVhbHRoIQ=="), (c) => c.charCodeAt(0));
    const got = await hashPassword("admin-health-v8", salt, 10000);
    cryptoOk = secureEqual(got, normalizedPasswordHash("xoVIKKX1VWwMB9PneHorgGENhMbf1uxXohlnJRfX5BU="));
  } catch (_) {}
  return json({
    service: "community-admin",
    auth_version: ADMIN_AUTH_VERSION,
    algorithm: "PBKDF2-SHA256",
    iterations: config.iterations,
    config_ok: configOk,
    crypto_ok: cryptoOk,
    decrypt_key_configured: !!entryDecryptKey(env),
  }, configOk && cryptoOk && !!entryDecryptKey(env) ? 200 : 503);
}
async function issueAdminSession(env, did, remember, level) {
  const sid = crypto.randomUUID();
  const ttl = remember ? ADMIN_SESSION_LONG_TTL : ADMIN_SESSION_SHORT_TTL;
  const expiresAt = Date.now() + ttl * 1000;
  const primary = level === "primary";
  /* Gắn metadata để lúc đăng nhập chỉ cần list là biết phiên nào cũ, không phải đọc từng bản ghi. */
  await env.KV.put(
    adminSessionKey(sid),
    JSON.stringify({ active: true, did, level, primary, auth_version: ADMIN_AUTH_VERSION, expires_at: expiresAt }),
    { expirationTtl: ttl, metadata: { v: ADMIN_AUTH_VERSION, p: primary } },
  );
  return {
    token: await makeJwt(sessionSecret(env), { aud: "community-admin", sid, did, role: "admin", level, primary, auth_version: ADMIN_AUTH_VERSION }, ttl),
    expires_at: expiresAt,
  };
}
async function adminAuth(request, env) {
  const token = bearer(request);
  if (!token) return null;
  const claims = await verifyJwt(sessionSecret(env), token);
  if (!claims || claims.aud !== "community-admin" || !isUuid(claims.sid) || !isUuid(claims.did) || claims.role !== "admin" || !["regular", "primary"].includes(claims.level) || claims.auth_version !== ADMIN_AUTH_VERSION) return null;
  const session = await getJson(env, adminSessionKey(claims.sid));
  const supplied = clean(request.headers.get("x-owner-device-id"), 80);
  if (!session || !session.active || session.auth_version !== ADMIN_AUTH_VERSION || session.expires_at <= Date.now() || session.did !== claims.did || session.level !== claims.level || supplied !== claims.did) return null;
  return { ...claims, primary: claims.level === "primary" && !!session.primary };
}
async function ownerDeviceOk(request, env, auth) {
  if (!auth || !auth.primary || auth.level !== "primary") return false;
  const stored = await env.KV.get("community-owner-device");
  const supplied = clean(request.headers.get("x-owner-device-id"), 80);
  return !!stored && !!supplied && secureEqual(stored, supplied) && auth.did === supplied;
}
async function handleAdminLogin(request, env) {
  const body = await readJson(request);
  const deviceId = clean(body && body.device_id, 80);
  if (!isUuid(deviceId)) return json({ error: "invalid_device" }, 400);
  if (env.PUBLIC_RATE_LIMITER && typeof env.PUBLIC_RATE_LIMITER.limit === "function") {
    try {
      const ip = request.headers.get("cf-connecting-ip") || "unknown";
      const limited = await env.PUBLIC_RATE_LIMITER.limit({ key: `admin-login:${ip}:${deviceId}` });
      if (!limited || !limited.success) return json({ error: "rate_limited" }, 429);
    } catch (_) {}
  }
  const level = await verifyAdminPasswordLevel(env, body && body.password);
  if (level === "__crypto_error__") return json({ error: "admin_auth_unavailable" }, 503);
  if (!level) return json({ error: "invalid_admin_login" }, 401);
  const key = entryDecryptKey(env);
  if (!key) return json({ error: "decrypt_key_unavailable" }, 503);
  /* Quét phiên cũ bằng metadata của list; chỉ đọc bản ghi cho các phiên đời cũ chưa có metadata,
   * và giới hạn số lần đọc để một lần đăng nhập không bao giờ chạm trần subrequest. */
  const existing = await env.KV.list({ prefix: "community-admin-session:", limit: 1000 });
  const staleOrPrimary = [];
  let probes = 0;
  for (const key of existing.keys) {
    const meta = key.metadata;
    if (meta && typeof meta === "object") {
      if (meta.v !== ADMIN_AUTH_VERSION || (level === "primary" && meta.p)) staleOrPrimary.push(key.name);
      continue;
    }
    if (probes >= ADMIN_SESSION_PROBE_LIMIT) { staleOrPrimary.push(key.name); continue; }
    probes += 1;
    const record = await getJson(env, key.name);
    if (!record || record.auth_version !== ADMIN_AUTH_VERSION || (level === "primary" && record.primary)) staleOrPrimary.push(key.name);
  }
  try { await Promise.all(staleOrPrimary.map((key) => env.KV.delete(key))); } catch (_) {}
  if (level === "primary") { try { await env.KV.put("community-owner-device", deviceId); } catch (_) {} }
  const session = await issueAdminSession(env, deviceId, body && body.remember !== false, level);
  await adminAudit(env, request, level === "primary" ? "admin_primary_login" : "admin_regular_login", deviceId);
  return json({ ...session, role: "admin", level, primary: level === "primary", device_id: deviceId, key });
}


/* ===== Khoang riêng của Admin tổng: nick mô phỏng =====
 * Chỉ Admin tổng (level primary) thấy và điều khiển. Nick mô phỏng có cờ simulated=true,
 * không đặt mật khẩu đăng nhập nên không ai đăng nhập được từ ngoài; chỉ vào được bằng
 * phiên "puppet" do Admin tổng cấp. QR và số tài khoản để trống cho chủ sở hữu tự đặt.
 */
const SIM_GUESTS = 109, SIM_READERS = 276;
const SIM_HO = ["Nguyễn","Trần","Lê","Phạm","Hoàng","Huỳnh","Phan","Vũ","Võ","Đặng","Bùi","Đỗ","Hồ","Ngô","Dương","Lý","Đinh","Mai","Trịnh","Chu"];
const SIM_DEM = ["Thị","Văn","Minh","Ngọc","Thu","Hải","Quang","Anh","Bảo","Gia","Khánh","Phương","Thanh","Tuấn","Hồng","Xuân","Diệu","Kim","Hữu","Đức"];
const SIM_TEN = ["An","Bình","Chi","Dung","Giang","Hà","Hạnh","Hiếu","Hoa","Huy","Khanh","Lam","Linh","Long","Mai","Nam","Nga","Nhung","Oanh","Phúc","Quân","Quyên","Sơn","Tâm","Thảo","Thắng","Trang","Trung","Tú","Uyên","Vy","Yến","Duy","Kiên","Lộc","My","Ngân","Nhi","Phong","Thư"];
const SIM_SPEC = ["Tarot","Lenormand","Bài Tây","Kinh Dịch","Tử Vi","Bát Tự","Thần số học","Rune","Bài Trà","Chiêm tinh"];
const SIM_BIO_R = [
  "Xem bài hơn 5 năm, chuyên gỡ rối chuyện tình cảm và công việc.",
  "Đọc bài theo lối truyền thống, nói thẳng, không vòng vo.",
  "Nhận luận giải theo câu hỏi cụ thể; ưu tiên việc gần trong vài tuần tới.",
  "Học bài từ trong nhà, quen với các ca gia đạo và hôn nhân.",
  "Chuyên xem hướng nghề nghiệp và thời điểm nên đổi việc.",
  "Đọc kỹ từng lá, trả lời đúng điều được hỏi.",
];
const SIM_BIO_G = [
  "Mới tìm hiểu, thích đọc và học dần.",
  "Hay ghé xem bài ngày và lưu lại để đối chiếu.",
  "Quan tâm chuyện công việc và tài chính.",
  "Thích Tarot, đang tập tự trải bài.",
  "Vào cho vui, hỏi khi có việc cần.",
];
function simPick(list, n) { return list[n % list.length]; }
function simProfile(index, role, now) {
  const id = crypto.randomUUID();
  const ho = simPick(SIM_HO, index * 7 + 3);
  const dem = simPick(SIM_DEM, index * 5 + 1);
  const ten = simPick(SIM_TEN, index * 11 + 2);
  const display = `${ho} ${dem} ${ten}`;
  const username = `sim${role === "reader" ? "r" : "g"}${String(index).padStart(3, "0")}`;
  const base = {
    id, username, role, display_name: display,
    bio: role === "reader" ? simPick(SIM_BIO_R, index * 3) : simPick(SIM_BIO_G, index * 3),
    simulated: true, avatar_hue: (index * 37) % 360,
    qr_data: "", bank_account: "", bank_name: "",
    suspended: false, rating: 0, review_count: 0, created_at: now - (index % 180) * 86400000, updated_at: now,
  };
  if (role === "reader") {
    const a = simPick(SIM_SPEC, index * 3), c = simPick(SIM_SPEC, index * 3 + 1);
    base.specialties = a === c ? [a] : [a, c];
    base.experience_years = 1 + (index % 15);
  }
  return base;
}
const SIM_INDEX_KEY = "community-simulated-index";
const SIM_BATCH = 40; /* Mỗi lượt ghi giới hạn để không vượt trần subrequest của Worker. */
/* Danh sách nick mô phỏng nằm gọn trong MỘT khoá, nên xem danh sách chỉ tốn 1 lượt đọc
 * thay vì quét toàn bộ hồ sơ (cách cũ làm treo request khi số nick lớn). */
async function simIndex(env) {
  return (await getJson(env, SIM_INDEX_KEY)) || { accounts: [], done: 0 };
}
function simPlan(i) {
  return i < SIM_GUESTS ? { index: i, role: "guest" } : { index: i - SIM_GUESTS, role: "reader" };
}
/* Sinh theo từng lô, gọi lại nhiều lần cho tới khi done = 385. */
/* Sinh theo lô. Hồ sơ nick mô phỏng nằm trong CHÍNH khoá chỉ mục, không tạo mỗi nick một khoá:
 * cách cũ tốn ~661 lượt ghi cho 385 nick và đã ngốn sạch hạn mức ghi trong ngày, làm hỏng cả
 * đăng nhập của chủ sở hữu. Cách này chỉ tốn vài lượt ghi cho toàn bộ 385 nick. */
async function seedSimulatedBatch(env) {
  const idx = await simIndex(env);
  const total = SIM_GUESTS + SIM_READERS;
  if (idx.done >= total) return { created: 0, done: idx.done, total, complete: true };
  const now = Date.now();
  const stop = Math.min(idx.done + SIM_BATCH, total);
  for (let i = idx.done; i < stop; i += 1) {
    const plan = simPlan(i);
    idx.accounts.push(simProfile(plan.index, plan.role, now));
  }
  const created = stop - idx.done;
  idx.done = stop;
  try {
    await putJson(env, SIM_INDEX_KEY, idx); /* 1 lượt ghi cho cả lô */
  } catch (error) {
    const detail = String((error && error.message) || error);
    if (detail.includes("limit exceeded")) {
      return { created: 0, done: idx.done - created, total, complete: false, quota_exhausted: true, detail };
    }
    throw error;
  }
  return { created, done: idx.done, total, complete: idx.done >= total };
}
/* Tra hồ sơ nick mô phỏng từ chỉ mục (chúng không có khoá hồ sơ riêng). */
async function simProfileById(env, uid) {
  const idx = await simIndex(env);
  return (idx.accounts || []).find((a) => a && a.id === uid) || null;
}
async function handleSimulated(request, env, path, auth) {
  if (!auth.primary) return json({ error: "primary_admin_required" }, 403);
  const parts = path.split("/").filter(Boolean); /* api community admin simulated [uid] */
  const uid = parts[4] || "";
  if (!uid && request.method === "GET") {
    const idx = await simIndex(env);
    const accounts = idx.accounts || [];
    return json({
      accounts,
      counts: {
        total: accounts.length,
        guests: accounts.filter((a) => a.role === "guest").length,
        readers: accounts.filter((a) => a.role === "reader").length,
      },
      done: idx.done || 0, target: SIM_GUESTS + SIM_READERS,
    });
  }
  if (!uid && request.method === "POST") {
    const result = await seedSimulatedBatch(env);
    await adminAudit(env, request, "simulated_seed", "batch", result);
    return json(result, 201);
  }
  if (uid === "control" && request.method === "POST") {
    const body = await readJson(request);
    const target = clean(body && body.uid, 60);
    if (!isUuid(target)) return json({ error: "invalid_uid" }, 400);
    const profile = (await getJson(env, profileKey(target))) || (await simProfileById(env, target));
    if (!profile) return json({ error: "not_found" }, 404);
    if (!profile.simulated) return json({ error: "not_simulated" }, 403);
    const did = clean(request.headers.get("x-owner-device-id"), 80);
    const token = await issueCommunitySession(env, profile, did, { mode: "puppet" });
    await adminAudit(env, request, "simulated_control", target, { username: profile.username, role: profile.role });
    return json({ token, profile: publicProfile(profile, true) });
  }
  return json({ error: "not_found" }, 404);
}

async function handleAdmin(request, env, path) {
  const parts = path.split("/").filter(Boolean);
  const action = parts[3] || "";
  if (action === "health" && request.method === "GET") return adminAuthHealth(env);
  if (action === "login" && request.method === "POST") return handleAdminLogin(request, env);
  const auth = await adminAuth(request, env);
  if (!auth) return json({ error: "unauthorized" }, 401);
  if (action === "session" && request.method === "GET") {
    const key = entryDecryptKey(env);
    if (!key) return json({ error: "decrypt_key_unavailable" }, 503);
    return json({ role: "admin", level: auth.level, primary: !!auth.primary, device_id: auth.did, key });
  }
  /* Khoang riêng của Admin tổng — nick mô phỏng */
  if (action === "simulated") return await handleSimulated(request, env, path, auth);
  if (action === "session" && request.method === "DELETE") {
    if (auth.sid) await env.KV.delete(adminSessionKey(auth.sid));
    return json({ ok: true });
  }
  if (action === "bind-owner-device" && request.method === "POST") {
    const body = await readJson(request);
    const deviceId = clean(body && body.device_id, 80);
    if (!isUuid(deviceId)) return json({ error: "invalid_device" }, 400);
    const old = await env.KV.get("community-owner-device");
    if (old && !secureEqual(old, deviceId) && body.replace !== true) return json({ error: "owner_device_already_bound" }, 409);
    await env.KV.put("community-owner-device", deviceId);
    await adminAudit(env, request, old && !secureEqual(old, deviceId) ? "owner_device_replaced" : "owner_device_bound", deviceId);
    return json({ ok: true, device_id: deviceId, replaced: !!old && !secureEqual(old, deviceId) });
  }
  if (action === "users" && request.method === "GET") {
    const users = await listByPrefix(env, "community-profile:", 100);
    return json({ users: users.map((p) => ({ ...publicProfile(p, true), suspended: !!p.suspended })) });
  }
  if (action === "users" && parts[4]) {
    const uid = parts[4];
    const profile = isUuid(uid) && await getJson(env, profileKey(uid));
    if (!profile) return json({ error: "not_found" }, 404);
    if (parts[5] === "impersonate" && request.method === "POST") {
      if (!(await ownerDeviceOk(request, env, auth))) return json({ error: "owner_device_required" }, 403);
      const did = clean(request.headers.get("x-owner-device-id"), 80);
      const token = await issueCommunitySession(env, profile, did, { mode: "impersonation" });
      await adminAudit(env, request, "member_view", uid, { role: profile.role });
      return json({ token, profile: publicProfile(profile, true), view_only: true });
    }
    if (request.method === "PATCH") {
      const body = await readJson(request);
      if (typeof body.suspended === "boolean") profile.suspended = body.suspended;
      profile.updated_at = Date.now();
      await putJson(env, profileKey(uid), profile);
      await adminAudit(env, request, profile.suspended ? "member_suspended" : "member_restored", uid);
      return json({ profile: publicProfile(profile, true), suspended: profile.suspended });
    }
    if (request.method === "DELETE") {
      await deleteMemberAccount(env, uid);
      await adminAudit(env, request, "member_deleted", uid, { username: profile.username, role: profile.role });
      return json({ ok: true });
    }
  }
  if (action === "reviews" && request.method === "GET") return json({ reviews: await listByPrefix(env, "community-review:", 100) });
  if (action === "reviews" && parts[4] && parts[5] && request.method === "DELETE") {
    const readerId = parts[4], authorId = parts[5];
    if (!isUuid(readerId) || !isUuid(authorId)) return json({ error: "invalid_review" }, 400);
    await env.KV.delete(reviewKey(readerId, authorId));
    await recalculateRating(env, readerId);
    await adminAudit(env, request, "review_deleted", `${readerId}:${authorId}`);
    return json({ ok: true });
  }
  if (action === "posts") {
    const postId = parts[4] || "";
    if (!postId && request.method === "GET") return json({ posts: (await listByPrefix(env, "community-post:", 100)).sort((a, b) => b.created_at - a.created_at) });
    if (!postId && request.method === "POST") {
      const body = await readJson(request);
      const title = clean(body && body.title, 160), text = clean(body && body.text, 5000);
      if (!title || !text) return json({ error: "invalid_post" }, 400);
      const id = crypto.randomUUID(), now = Date.now();
      const post = { id, title, text, closed: false, comment_count: 0, created_at: now, updated_at: now };
      await putJson(env, postKey(id), post, ACCOUNT_TTL);
      await adminAudit(env, request, "post_created", id);
      return json({ post }, 201);
    }
    const post = isUuid(postId) && await getJson(env, postKey(postId));
    if (!post) return json({ error: "not_found" }, 404);
    if (request.method === "PATCH") {
      const body = await readJson(request);
      if (typeof body.closed === "boolean") post.closed = body.closed;
      post.updated_at = Date.now();
      await putJson(env, postKey(postId), post, ACCOUNT_TTL);
      await adminAudit(env, request, post.closed ? "post_closed" : "post_reopened", postId);
      return json({ post });
    }
    if (request.method === "DELETE") {
      const page = await env.KV.list({ prefix: postCommentPrefix(postId), limit: 1000 });
      await Promise.all([env.KV.delete(postKey(postId)), ...page.keys.map((key) => env.KV.delete(key.name))]);
      await adminAudit(env, request, "post_deleted", postId);
      return json({ ok: true });
    }
  }
  if (action === "conversations") {
    if (!(await ownerDeviceOk(request, env, auth))) return json({ error: "owner_device_required" }, 403);
    const cid = parts[4] || "";
    if (!cid && request.method === "GET") return json({ conversations: await listByPrefix(env, "community-conversation:", 100) });
    if (cid && parts[5] === "messages" && request.method === "GET") return json({ messages: (await listByPrefix(env, messagePrefix(cid), 100)).sort((a, b) => a.created_at - b.created_at) });
  }
  return json({ error: "not_found" }, 404);
}

/* Account V3 plaintext public entry */
/* Account V3 self delete cleanup */
/* Account V4 edge authentication */
/* Account V4 awaited dispatcher */
/* Account V5 admin JWT */

/* Số thành viên — công khai, thời gian thực.
 * Đếm bằng một khoá bộ đếm thay vì quét toàn bộ hồ sơ: quét sẽ vượt trần subrequest
 * của Worker khi số thành viên lớn và làm treo request.
 */
const STATS_CACHE_KEY = "community-stats-counters";
async function readStats(env) {
  return (await getJson(env, STATS_CACHE_KEY)) || null;
}
/* Đếm lại từ đầu — chỉ dùng khi chưa có bộ đếm, và có trần để không treo. */
async function rebuildStats(env) {
  let guests = 0, readers = 0, admins = 0, cursor, scanned = 0;
  do {
    const page = await env.KV.list({ prefix: "community-profile:", limit: 1000, cursor });
    for (const key of page.keys) {
      scanned += 1;
      if (key.name.endsWith(":role:reader")) readers += 1;
    }
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor && scanned < 5000);
  /* Không đọc từng hồ sơ; lấy số reader từ chỉ mục reader cho chính xác. */
  let readerCount = 0, rc;
  do {
    const page = await env.KV.list({ prefix: "community-reader:", limit: 1000, cursor: rc });
    readerCount += page.keys.length;
    rc = page.list_complete ? null : page.cursor;
  } while (rc);
  const simIdxValue = await getJson(env, "community-simulated-index");
  const simAccounts = (simIdxValue && simIdxValue.accounts) || [];
  const simReaders = simAccounts.filter((a) => a && a.role === "reader").length;
  const simGuests = simAccounts.length - simReaders;
  const total = scanned + simAccounts.length;
  readers = readerCount + simReaders;
  guests = Math.max(0, total - readers - admins);
  const value = { members: total, guests, readers, admins, sim: simAccounts.length, updated_at: Date.now() };
  /* Ghi cache là tối ưu, không phải điều kiện bắt buộc: hết hạn mức ghi vẫn phải trả số liệu. */
  try { await putJson(env, STATS_CACHE_KEY, value); } catch (_) {}
  return value;
}
/* Cộng dồn khi có thay đổi, rẻ hơn quét lại. */
async function bumpStats(env, delta, rebuild) {
  try {
  if (rebuild) { await env.KV.delete(STATS_CACHE_KEY); return; }
  const cur = await readStats(env);
  if (!cur) return;
  cur.guests = Math.max(0, Number(cur.guests || 0) + Number(delta.guests || 0));
  cur.readers = Math.max(0, Number(cur.readers || 0) + Number(delta.readers || 0));
  cur.members = cur.guests + cur.readers + Number(cur.admins || 0);
  cur.updated_at = Date.now();
  await putJson(env, STATS_CACHE_KEY, cur);
  } catch (_) {}
}
async function handleStats(request, env) {
  const cached = await readStats(env);
  if (cached) return json(cached);
  return json(await rebuildStats(env));
}

export async function handleCommunity(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  if (!path.startsWith("/api/community/")) return null;
  try {
    /* Công khai: ai cũng xem được số thành viên, không cần đăng nhập. */
    if (path === "/api/community/stats" && request.method === "GET") return await handleStats(request, env);
    if (path === "/api/community/register" && request.method === "POST") return await handleRegister(request, env);
    if (path === "/api/community/login" && request.method === "POST") return await handleLogin(request, env);
    if (path === "/api/community/me" && (request.method === "GET" || request.method === "PUT" || request.method === "DELETE")) return await handleMe(request, env);
    if (path === "/api/community/readers" || path.startsWith("/api/community/readers/")) return await handleReaders(request, env, path);
    if (path === "/api/community/conversations" || path.startsWith("/api/community/conversations/")) return await handleConversations(request, env, path);
    if (path === "/api/community/posts" || path.startsWith("/api/community/posts/")) return await handlePosts(request, env, path);
    if (path.startsWith("/api/community/admin/")) return await handleAdmin(request, env, path);
    return json({ error: "not_found" }, 404);
  } catch (error) {
    const detail = clean(error && error.message, 160);
    /* Hết hạn mức ghi trong ngày là lỗi hạ tầng, phải nói rõ để không bị hiểu là sai mật khẩu. */
    if (String(detail).includes("limit exceeded")) {
      return json({ error: "storage_quota_exhausted", detail,
        message: "Hệ thống đã chạm trần ghi dữ liệu của ngày hôm nay. Đăng nhập và các thao tác ghi sẽ hoạt động lại khi hạn mức làm mới." }, 503);
    }
    return json({ error: "community_server", detail }, 500);
  }
}

export const __test = { validUsername, validRole, hasLink, validQrData, cleanSpecialties, validateProfileBody, secureEqual };
