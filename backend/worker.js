import { handleCommunity } from "./community.js";
/*!
 * Cloudflare Worker: approval gate, best-effort access telemetry and owner chat.
 * Secrets: TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, ADMIN_TOKEN,
 * SESSION_SECRET, DECRYPT_KEY, optional DECRYPT_KEY_<APP>, PAYOS_CLIENT_ID,
 * PAYOS_API_KEY and PAYOS_CHECKSUM_KEY. Storage: Workers KV binding "KV".
 */

const APPS = new Set(["spare", "boitoan", "medora"]);
const CLIENT_METHODS = new Set(["password", "remembered", "approved", "saved-key", "session"]);
const REQUEST_TTL = 7 * 24 * 60 * 60;
const SESSION_TTL = 12 * 60 * 60;
const ACCESS_TTL = 90 * 24 * 60 * 60;
const CHAT_TTL = 30 * 24 * 60 * 60;
const TELEGRAM_UPDATE_TTL = 7 * 24 * 60 * 60;
const CHAT_MESSAGE_LIMIT = 100;
// ponytail: Bound KV reads per admin request; tune after production profiling.
const ADMIN_PAGE_LIMIT = 250;
const enc = new TextEncoder();

const json = (obj, status = 200, extra = {}) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...extra,
    },
  });

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allow = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  const ok = allow.length === 0 || allow.includes(origin);
  return {
    "Access-Control-Allow-Origin": ok ? origin || "*" : "null",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, authorization, x-owner-device-id",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function b64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeB64url(value) {
  const raw = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  return atob(raw + "=".repeat((4 - raw.length % 4) % 4));
}

function secureEqual(a, b) {
  const left = String(a || "");
  const right = String(b || "");
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return diff === 0;
}

async function hmacSign(secret, data) {
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

async function hmacHex(secret, data) {
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
  return [...signature].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function makeJWT(secret, payload, ttlSec = SESSION_TTL) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(enc.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = b64url(enc.encode(JSON.stringify({ ...payload, iat: now, exp: now + ttlSec })));
  return `${header}.${body}.${await hmacSign(secret, `${header}.${body}`)}`;
}

async function verifyJWT(secret, token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) return null;
  const expected = await hmacSign(secret, `${parts[0]}.${parts[1]}`);
  if (!secureEqual(expected, parts[2])) return null;
  try {
    const body = JSON.parse(decodeB64url(parts[1]));
    if (!body.exp || Math.floor(Date.now() / 1000) >= body.exp) return null;
    return body;
  } catch (_) {
    return null;
  }
}

function uuid() { return crypto.randomUUID(); }
function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}
function cleanText(value, max) { return String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max); }
function validApp(value) { return APPS.has(String(value || "")) ? String(value) : ""; }
function bearer(request) { return (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, ""); }
function sessionSecret(env) {
  const value = String(env.SESSION_SECRET || "");
  return value.length >= 32 ? value : "";
}

async function readJson(request, max = 12000) {
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > max) return null;
  const raw = await request.text();
  if (!raw || raw.length > max) return null;
  try { return JSON.parse(raw); } catch (_) { return null; }
}

function parseIpv4(value) {
  const parts = String(value || "").split(".");
  if (parts.length !== 4 || parts.some((part) => !/^\d{1,3}$/.test(part) || Number(part) > 255)) return null;
  return parts.map(Number);
}

function expandIpv6(value) {
  let input = String(value || "").toLowerCase();
  if (!input.includes(":")) return null;
  if (input.includes(".")) {
    const splitAt = input.lastIndexOf(":");
    const ipv4 = parseIpv4(input.slice(splitAt + 1));
    if (!ipv4) return null;
    input = `${input.slice(0, splitAt)}:${((ipv4[0] << 8) | ipv4[1]).toString(16)}:${((ipv4[2] << 8) | ipv4[3]).toString(16)}`;
  }
  if ((input.match(/::/g) || []).length > 1) return null;
  let parts;
  if (input.includes("::")) {
    const [leftRaw, rightRaw] = input.split("::");
    const left = leftRaw ? leftRaw.split(":") : [];
    const right = rightRaw ? rightRaw.split(":") : [];
    const missing = 8 - left.length - right.length;
    if (missing < 1) return null;
    parts = [...left, ...Array(missing).fill("0"), ...right];
  } else {
    parts = input.split(":");
  }
  if (parts.length !== 8 || parts.some((part) => !/^[0-9a-f]{1,4}$/.test(part))) return null;
  return parts.map((part) => Number.parseInt(part, 16));
}

function redactIp(value) {
  const alreadyRedacted = String(value || "").toLowerCase();
  if (/^(?:\d{1,3}\.){3}0\/24$/.test(alreadyRedacted)) {
    const base = alreadyRedacted.slice(0, -3);
    return parseIpv4(base) ? alreadyRedacted : "";
  }
  if (/^[0-9a-f:]+::\/64$/.test(alreadyRedacted)) {
    const base = alreadyRedacted.slice(0, -3);
    return expandIpv6(base) ? alreadyRedacted : "";
  }
  const ipv4 = parseIpv4(value);
  if (ipv4) return `${ipv4[0]}.${ipv4[1]}.${ipv4[2]}.0/24`;
  const ipv6 = expandIpv6(value);
  if (ipv6) return `${ipv6.slice(0, 4).map((part) => part.toString(16)).join(":")}::/64`;
  return "";
}

function requestIp(request) { return request.headers.get("cf-connecting-ip") || ""; }
function country(request) {
  return request.cf && /^[A-Z]{2}$/.test(request.cf.country || "") ? request.cf.country : "";
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
function cleanDevice(value) {
  const device = value && typeof value === "object" ? value : {};
  return {
    lang: cleanText(device.lang, 20),
    tz: cleanText(device.tz, 60),
    screen: /^\d{2,5}x\d{2,5}$/.test(String(device.screen || "")) ? String(device.screen) : "",
    platform: cleanText(device.platform, 40),
  };
}

async function rateKey(env, request, route) {
  const secret = sessionSecret(env);
  if (!secret) throw new Error("invalid_session_secret");
  return hmacSign(secret, `${route}:${requestIp(request)}`);
}
async function rateAllowed(binding, key) {
  if (!binding || typeof binding.limit !== "function") return true;
  try { return !!(await binding.limit({ key })).success; } catch (_) { return false; }
}

/* ----------------------------- Telegram ----------------------------- */
async function tg(env, method, body) {
  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) throw new Error("telegram_unavailable");
  return data;
}

async function notifyOwner(env, rec) {
  const text = [
    "Yêu cầu truy cập mới",
    `App: ${rec.app}`,
    `Tên: ${rec.name}`,
    rec.note ? `Lý do: ${rec.note}` : "",
    `IP rút gọn: ${rec.ip || "không rõ"} (${rec.country || "?"})`,
    `Trình duyệt: ${rec.browser}`,
    `Múi giờ: ${rec.device.tz || "?"} · MH: ${rec.device.screen || "?"}`,
    `Lúc: ${new Date(rec.created_at).toISOString()}`,
  ].filter(Boolean).join("\n");
  return tg(env, "sendMessage", {
    chat_id: env.TELEGRAM_CHAT_ID,
    text,
    reply_markup: {
      inline_keyboard: [[
        { text: "✅ Duyệt", callback_data: `approve:${rec.id}` },
        { text: "❌ Từ chối", callback_data: `deny:${rec.id}` },
      ]],
    },
  });
}

/* ----------------------------- KV/session helpers ----------------------------- */
const reqKey = (id) => `req:${id}`;
const eventKey = (id) => `evt:${id}`;
const accessKey = (app, id) => `access:${app}:${id}`;
const deviceKey = (app, id) => `device:${app}:${id}`;
const sessionKey = (id) => `session:${id}`;
const chatPrefix = (cid) => `chat:${cid}:`;
const chatKey = (cid, createdAt, id) =>
  `${chatPrefix(cid)}${String(Number.MAX_SAFE_INTEGER - createdAt).padStart(16, "0")}:${id}`;
const telegramMapKey = (chatId, messageId) => `tgmap:${chatId}:${messageId}`;
const adviceKey = (id) => `advice:${id}`;
const adviceClientKey = (sid, clientId) => `advice-client:${sid}:${clientId}`;
const payosOrderKey = (orderCode) => `payos-order:${orderCode}`;

async function getJson(env, key) {
  const value = await env.KV.get(key);
  if (!value) return null;
  try { return JSON.parse(value); } catch (_) { return null; }
}
async function getReq(env, id) { return getJson(env, reqKey(id)); }
async function putReq(env, rec) {
  await env.KV.put(reqKey(rec.id), JSON.stringify(rec), { expirationTtl: REQUEST_TTL });
}

async function issueSession(env, rec) {
  const secret = sessionSecret(env);
  if (!secret) throw new Error("invalid_session_secret");
  const sid = uuid();
  const did = isUuid(rec.device_id) ? rec.device_id : uuid();
  const cid = (await hmacSign(secret, `chat:${rec.app}:${did}`)).slice(0, 32);
  const claims = {
    ver: 2,
    aud: "gate-chat",
    app: rec.app,
    scope: ["access", "log", "chat"],
    sid,
    cid,
    did,
    sub: rec.id,
  };
  await env.KV.put(sessionKey(sid), JSON.stringify({
    active: true,
    app: rec.app,
    did,
    cid,
    expires_at: Date.now() + SESSION_TTL * 1000,
  }), { expirationTtl: SESSION_TTL });
  return { sid, token: await makeJWT(secret, claims) };
}

async function decide(env, id, status) {
  const rec = await getReq(env, id);
  if (!rec) return null;
  if (rec.status === status && status !== "approved") return "";
  if (rec.status === "approved" && status === "approved" && rec.token && rec.session_id) {
    const current = await getJson(env, sessionKey(rec.session_id));
    if (current && current.active && current.expires_at > Date.now()
        && current.app === rec.app && current.did === rec.device_id) return rec.token;
  }
  if (rec.session_id) await env.KV.delete(sessionKey(rec.session_id));
  rec.status = status;
  rec.decided_at = Date.now();
  rec.token = null;
  rec.session_id = null;
  if (status === "approved") {
    const session = await issueSession(env, rec);
    rec.token = session.token;
    rec.session_id = session.sid;
  }
  await putReq(env, rec);
  return rec.token;
}

async function authenticate(request, env, requiredScope) {
  const secret = sessionSecret(env);
  if (!secret) return null;
  const claims = await verifyJWT(secret, bearer(request));
  if (!claims || claims.ver !== 2 || claims.aud !== "gate-chat" || !validApp(claims.app)
      || !isUuid(claims.sid) || !isUuid(claims.did) || !/^[A-Za-z0-9_-]{32}$/.test(claims.cid || "")
      || !Array.isArray(claims.scope) || !claims.scope.includes(requiredScope)) return null;
  const session = await getJson(env, sessionKey(claims.sid));
  if (!session || !session.active || session.expires_at <= Date.now()
      || session.app !== claims.app || session.did !== claims.did || session.cid !== claims.cid) return null;
  return claims;
}

/* ----------------------------- approval and telemetry ----------------------------- */
async function handleRequest(request, env) {
  if (!(await rateAllowed(env.PUBLIC_RATE_LIMITER, await rateKey(env, request, "request")))) {
    return json({ error: "rate_limited" }, 429);
  }
  const body = await readJson(request);
  const app = body && validApp(body.app);
  const name = body && cleanText(body.name, 80);
  if (!body || !app || !name || !isUuid(body.device_id)) return json({ error: "invalid_request" }, 400);
  const rec = {
    id: uuid(),
    app,
    name,
    note: cleanText(body.note, 300),
    device_id: body.device_id,
    ip: redactIp(requestIp(request)),
    country: country(request),
    browser: browserLabel(request.headers.get("user-agent")),
    device: cleanDevice(body.device),
    status: "pending",
    created_at: Date.now(),
  };
  await putReq(env, rec);
  try {
    await notifyOwner(env, rec);
  } catch (_) {
    await env.KV.delete(reqKey(rec.id));
    return json({ error: "telegram_unavailable" }, 503);
  }
  return json({ id: rec.id, status: "pending" });
}

async function handleStatus(env, url) {
  const id = url.searchParams.get("id");
  const did = url.searchParams.get("did");
  if (!isUuid(id) || !isUuid(did)) return json({ error: "invalid_request" }, 400);
  const rec = await getReq(env, id);
  if (!rec) return json({ status: "unknown" });
  if (!secureEqual(rec.device_id, did)) return json({ error: "forbidden" }, 403);
  let approved = rec.status === "approved" && !!rec.token && !!rec.session_id && !!sessionSecret(env);
  if (approved) {
    const session = rec.session_id && await getJson(env, sessionKey(rec.session_id));
    approved = !!session && session.active && session.expires_at > Date.now()
      && session.app === rec.app && session.did === rec.device_id;
  }
  const appKeyName = "DECRYPT_KEY_" + rec.app.toUpperCase().replace(/[^A-Z0-9_]/g, "");
  const decKey = env[appKeyName] || env.DECRYPT_KEY || undefined;
  return json({
    status: rec.status === "approved" && !approved ? "expired" : rec.status,
    token: approved ? rec.token : undefined,
    key: approved ? decKey : undefined,
  });
}

async function putDevice(env, ev) {
  const key = deviceKey(ev.app, ev.device_id);
  const old = await getJson(env, key);
  const methods = new Set(Array.isArray(old && old.methods) ? old.methods : []);
  const countries = new Set(Array.isArray(old && old.countries) ? old.countries : []);
  methods.add(ev.method === "approved" ? "approved" : ev.client_method || "client-reported");
  if (ev.country) countries.add(ev.country);
  const rec = {
    app: ev.app,
    device_id: ev.device_id,
    first_seen: Number(old && old.first_seen) || ev.created_at,
    last_seen: ev.created_at,
    visits: (Number(old && old.visits) || 0) + 1,
    methods: [...methods],
    countries: [...countries],
    browser: ev.browser,
    ip: ev.ip,
    device: ev.device,
  };
  await env.KV.put(key, JSON.stringify(rec), { expirationTtl: ACCESS_TTL });
}

async function handleAccess(request, env) {
  if (!(await rateAllowed(env.PUBLIC_RATE_LIMITER, await rateKey(env, request, "access")))) {
    return json({ error: "rate_limited" }, 429);
  }
  const body = await readJson(request);
  const app = body && validApp(body.app);
  if (!body || !app || !isUuid(body.device_id) || !isUuid(body.event_id)) {
    return json({ error: "invalid_request" }, 400);
  }
  const key = accessKey(app, body.event_id);
  if (await env.KV.get(key)) return json({ ok: true, duplicate: true });
  const claims = await authenticate(request, env, "access");
  const approved = claims && claims.app === app && claims.did === body.device_id;
  const ev = {
    id: body.event_id,
    app,
    device_id: body.device_id,
    method: approved ? "approved" : "client-reported",
    client_method: CLIENT_METHODS.has(body.client_method) ? body.client_method : "",
    ip: redactIp(requestIp(request)),
    country: country(request),
    browser: browserLabel(request.headers.get("user-agent")),
    device: cleanDevice(body.device),
    created_at: Date.now(),
  };
  await Promise.all([
    env.KV.put(key, JSON.stringify(ev), { expirationTtl: ACCESS_TTL, metadata: ev }),
    putDevice(env, ev),
  ]);
  return json({ ok: true });
}

async function handleLog(request, env) {
  const claims = await authenticate(request, env, "log");
  if (!claims) return json({ error: "unauthorized" }, 401);
  const body = await readJson(request);
  if (!body) return json({ error: "invalid_request" }, 400);
  const ev = {
    id: uuid(),
    request_id: claims.sub,
    app: claims.app,
    kind: cleanText(body.kind || "input", 40),
    data: JSON.stringify(body.data || {}).slice(0, 4000),
    ip: redactIp(requestIp(request)),
    created_at: Date.now(),
  };
  await env.KV.put(eventKey(ev.id), JSON.stringify(ev), { expirationTtl: REQUEST_TTL });
  return json({ ok: true });
}

/* ----------------------------- chat ----------------------------- */
function chatEnabled(env) { return String(env.CHAT_ENABLED || "").toLowerCase() === "true"; }

async function chatAuth(request, env) {
  if (!chatEnabled(env)) return { response: json({ error: "chat_disabled" }, 503) };
  const claims = await authenticate(request, env, "chat");
  if (!claims) return { response: json({ error: "unauthorized" }, 401) };
  return { claims };
}

async function handleChatSend(request, env) {
  const auth = await chatAuth(request, env);
  if (auth.response) return auth.response;
  if (!(await rateAllowed(env.CHAT_RATE_LIMITER, `${auth.claims.sid}:chat-send`))) {
    return json({ error: "rate_limited" }, 429);
  }
  const body = await readJson(request);
  const text = body && cleanText(body.text, 1000);
  const clientId = body && body.client_id;
  if (!text || !isUuid(clientId)) return json({ error: "invalid_request" }, 400);
  const pendingKey = `chat-pending:${auth.claims.sid}:${clientId}`;
  const doneKey = `chat-done:${auth.claims.sid}:${clientId}`;
  const done = await getJson(env, doneKey);
  if (done) return json({ ok: true, id: done.id, duplicate: true });
  if (await env.KV.get(pendingKey)) return json({ error: "message_pending" }, 409);
  await env.KV.put(pendingKey, "1", { expirationTtl: 300 });

  let sent = false;
  try {
    const createdAt = Date.now();
    const telegram = await tg(env, "sendMessage", {
      chat_id: env.TELEGRAM_CHAT_ID,
      text: [`Tin nhắn từ app ${auth.claims.app}`, "", text, "", "Trả lời tin này để nhắn lại."].join("\n"),
    });
    sent = true;
    const telegramMessageId = telegram.result && telegram.result.message_id;
    if (!Number.isInteger(telegramMessageId)) throw new Error("telegram_unavailable");
    const message = { id: clientId, sender: "visitor", text, created_at: createdAt };
    await Promise.all([
      env.KV.put(chatKey(auth.claims.cid, createdAt, clientId), JSON.stringify(message), { expirationTtl: CHAT_TTL }),
      env.KV.put(telegramMapKey(env.TELEGRAM_CHAT_ID, telegramMessageId), JSON.stringify({ cid: auth.claims.cid }), { expirationTtl: CHAT_TTL }),
      env.KV.put(doneKey, JSON.stringify({ id: clientId }), { expirationTtl: CHAT_TTL }),
    ]);
    await env.KV.delete(pendingKey);
    return json({ ok: true, id: clientId });
  } catch (_) {
    if (!sent) await env.KV.delete(pendingKey).catch(() => {});
    return json({ error: "message_unavailable" }, 502);
  }
}

async function handleChatMessages(request, env) {
  const auth = await chatAuth(request, env);
  if (auth.response) return auth.response;
  if (!(await rateAllowed(env.CHAT_RATE_LIMITER, `${auth.claims.sid}:chat-read`))) {
    return json({ error: "rate_limited" }, 429);
  }
  const page = await env.KV.list({ prefix: chatPrefix(auth.claims.cid), limit: CHAT_MESSAGE_LIMIT });
  const messages = [];
  for (const key of page.keys) {
    const message = await getJson(env, key.name);
    if (message) messages.push(message);
  }
  messages.sort((a, b) => a.created_at - b.created_at);
  return json({ messages: messages.slice(-CHAT_MESSAGE_LIMIT) });
}

async function handleOwnerReply(message, env) {
  if (!message || String(message.chat && message.chat.id) !== String(env.TELEGRAM_CHAT_ID)
      || String(message.from && message.from.id) !== String(env.TELEGRAM_CHAT_ID)
      || !message.reply_to_message || !message.reply_to_message.from || !message.reply_to_message.from.is_bot) return;
  const map = await getJson(env, telegramMapKey(message.chat.id, message.reply_to_message.message_id));
  const text = cleanText(message.text, 1000);
  if (!map || !/^[A-Za-z0-9_-]{32}$/.test(map.cid || "") || !text || !Number.isInteger(message.message_id)) return;
  const createdAt = Number.isInteger(message.date) ? message.date * 1000 : Date.now();
  const rec = { id: `tg-${message.message_id}`, sender: "owner", text, created_at: createdAt };
  await env.KV.put(chatKey(map.cid, createdAt, rec.id), JSON.stringify(rec), { expirationTtl: CHAT_TTL });
}

/* ----------------------------- advice/payment ----------------------------- */
function paymentReturnBase(env) {
  try {
    const url = new URL(String(env.PAYOS_RETURN_URL || ""));
    return url.protocol === "https:" && !url.username && !url.password ? url : null;
  } catch (_) {
    return null;
  }
}

function paymentConfigured(env) {
  return !!(String(env.PAYOS_CLIENT_ID || "") && String(env.PAYOS_API_KEY || "")
    && String(env.PAYOS_CHECKSUM_KEY || "") && paymentReturnBase(env));
}

function adviceBoundTo(rec, claims) {
  return !!rec && rec.app === "boitoan" && secureEqual(rec.cid, claims.cid) && secureEqual(rec.did, claims.did);
}

async function adviceAuth(request, env) {
  const claims = await authenticate(request, env, "chat");
  if (!claims) return { response: json({ error: "unauthorized" }, 401) };
  if (claims.app !== "boitoan") return { response: json({ error: "forbidden" }, 403) };
  return { claims };
}

function adviceKeyboard(rec) {
  const callback = (command) => `advice:${rec.id}:${command}`;
  return {
    inline_keyboard: [
      [1, 2, 3].map((digit) => ({ text: String(digit), callback_data: callback(digit) })),
      [4, 5, 6].map((digit) => ({ text: String(digit), callback_data: callback(digit) })),
      [7, 8, 9].map((digit) => ({ text: String(digit), callback_data: callback(digit) })),
      [
        { text: "0", callback_data: callback(0) },
        { text: "⌫ Xóa", callback_data: callback("back") },
        { text: "Xóa hết", callback_data: callback("clear") },
      ],
      [{ text: "✅ Xác nhận giá", callback_data: callback("confirm") }],
    ],
  };
}

function adviceTelegramText(rec) {
  const lines = [
    "Yêu cầu luận giải chuyên sâu",
    `Phần: ${rec.section}`,
    `Câu hỏi: ${rec.question}`,
    `Mã: ${rec.id}`,
  ];
  if (rec.status === "paid") lines.push(`ĐÃ THANH TOÁN: ${rec.amount} VND`);
  else if (rec.status === "quoted") lines.push(`ĐÃ BÁO GIÁ: ${rec.amount} VND`);
  else lines.push(`Giá đang nhập: ${rec.quote_input || "(chưa nhập)"} VND`);
  return lines.join("\n\n");
}

async function putAdvice(env, rec) {
  await env.KV.put(adviceKey(rec.id), JSON.stringify(rec), { expirationTtl: CHAT_TTL });
}

async function handleAdviceRequest(request, env) {
  const auth = await adviceAuth(request, env);
  if (auth.response) return auth.response;
  if (!(await rateAllowed(env.CHAT_RATE_LIMITER, `${auth.claims.sid}:advice-send`))) {
    return json({ error: "rate_limited" }, 429);
  }
  const body = await readJson(request);
  const clientId = body && body.client_id;
  const section = body && cleanText(body.section, 120);
  const question = body && cleanText(body.question, 1500);
  if (!isUuid(clientId) || !section || !question) return json({ error: "invalid_request" }, 400);

  const doneKey = adviceClientKey(auth.claims.sid, clientId);
  const done = await getJson(env, doneKey);
  if (done && isUuid(done.id)) return json({ id: done.id, status: "pending", duplicate: true });
  const pendingKey = `advice-pending:${auth.claims.sid}:${clientId}`;
  if (await env.KV.get(pendingKey)) return json({ error: "advice_pending" }, 409);
  await env.KV.put(pendingKey, "1", { expirationTtl: 300 });

  let sent = false;
  try {
    const rec = {
      id: uuid(),
      client_id: clientId,
      app: "boitoan",
      cid: auth.claims.cid,
      did: auth.claims.did,
      sid: auth.claims.sid,
      section,
      question,
      quote_input: "",
      amount: null,
      status: "pending",
      payment_status: "unpaid",
      created_at: Date.now(),
    };
    const telegram = await tg(env, "sendMessage", {
      chat_id: env.TELEGRAM_CHAT_ID,
      text: adviceTelegramText(rec),
      reply_markup: adviceKeyboard(rec),
    });
    sent = true;
    const telegramMessageId = telegram.result && telegram.result.message_id;
    if (!Number.isInteger(telegramMessageId)) throw new Error("telegram_unavailable");
    rec.telegram_message_id = telegramMessageId;
    await Promise.all([
      putAdvice(env, rec),
      env.KV.put(doneKey, JSON.stringify({ id: rec.id }), { expirationTtl: CHAT_TTL }),
    ]);
    await env.KV.delete(pendingKey);
    return json({ id: rec.id, status: rec.status });
  } catch (_) {
    if (!sent) await env.KV.delete(pendingKey).catch(() => {});
    return json({ error: "advice_unavailable" }, 502);
  }
}

async function handleAdviceStatus(request, env, url) {
  const auth = await adviceAuth(request, env);
  if (auth.response) return auth.response;
  if (!(await rateAllowed(env.CHAT_RATE_LIMITER, `${auth.claims.sid}:advice-read`))) {
    return json({ error: "rate_limited" }, 429);
  }
  const id = url.searchParams.get("id");
  if (!isUuid(id)) return json({ error: "invalid_request" }, 400);
  const rec = await getJson(env, adviceKey(id));
  if (!adviceBoundTo(rec, auth.claims)) return json({ error: "not_found" }, 404);
  return json({
    id: rec.id,
    section: rec.section,
    status: rec.status,
    amount: Number.isSafeInteger(rec.amount) ? rec.amount : undefined,
    payment_status: rec.payment_status,
    payment_enabled: paymentConfigured(env),
  });
}

async function handleAdviceCallback(cb, env) {
  const match = /^advice:([0-9a-f-]{36}):(\d|back|clear|confirm)$/i.exec(String(cb.data || ""));
  if (!match || !isUuid(match[1])) return { answer: "Lệnh không hợp lệ" };
  const rec = await getJson(env, adviceKey(match[1]));
  if (!rec) return { answer: "Yêu cầu đã hết hạn" };
  if (rec.status !== "pending") return { answer: rec.status === "paid" ? "Đã thanh toán" : "Giá đã được xác nhận" };

  const command = match[2];
  let answer = "Đã cập nhật";
  if (/^\d$/.test(command)) {
    const next = `${rec.quote_input || ""}${command}`;
    if (!Number.isSafeInteger(Number(next))) return { answer: "Số tiền quá lớn" };
    rec.quote_input = next;
  } else if (command === "back") {
    rec.quote_input = String(rec.quote_input || "").slice(0, -1);
  } else if (command === "clear") {
    rec.quote_input = "";
  } else {
    const amount = Number(rec.quote_input);
    if (!/^\d+$/.test(rec.quote_input || "") || !Number.isSafeInteger(amount) || amount <= 0) {
      return { answer: "Nhập số tiền lớn hơn 0" };
    }
    rec.amount = amount;
    rec.status = "quoted";
    rec.payment_status = "unpaid";
    rec.quoted_at = Date.now();
    answer = "Đã xác nhận giá";
  }
  await putAdvice(env, rec);
  return {
    answer,
    edit: {
      chat_id: cb.message.chat.id,
      message_id: cb.message.message_id,
      text: adviceTelegramText(rec),
      reply_markup: rec.status === "pending" ? adviceKeyboard(rec) : { inline_keyboard: [] },
    },
  };
}

function payosDataString(data) {
  return Object.keys(data).sort().filter((key) => data[key] !== undefined).map((key) => {
    let value = data[key];
    if (Array.isArray(value)) {
      value = JSON.stringify(value.map((item) => item && typeof item === "object"
        ? Object.keys(item).sort().reduce((sorted, itemKey) => ({ ...sorted, [itemKey]: item[itemKey] }), {})
        : item));
    }
    if (value === null || value === undefined || value === "null" || value === "undefined") value = "";
    return `${key}=${value}`;
  }).join("&");
}

function orderCodeForAdvice(id) {
  return Number.parseInt(String(id).replace(/-/g, "").slice(0, 13), 16) || 1;
}

function paymentUrl(env, id, result) {
  const url = new URL(paymentReturnBase(env));
  url.searchParams.set("advice", id);
  url.searchParams.set("payment", result);
  return url.href;
}

function checkoutUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" && url.hostname === "pay.payos.vn" && !url.username && !url.password
      ? url.href : "";
  } catch (_) {
    return "";
  }
}

async function recoverPayosCheckout(env, rec) {
  const response = await fetch(`https://api-merchant.payos.vn/v2/payment-requests/${rec.order_code}`, {
    headers: {
      "x-client-id": env.PAYOS_CLIENT_ID,
      "x-api-key": env.PAYOS_API_KEY,
    },
  });
  if (response.status === 404) return "";
  const result = await response.json().catch(() => null);
  const signed = result && result.data && result.signature
    && await hmacHex(env.PAYOS_CHECKSUM_KEY, payosDataString(result.data));
  const paymentLinkId = result && result.data && cleanText(result.data.id, 100);
  // payOS detail omits checkoutUrl; signed id addresses its documented hosted /web/{id} path.
  const url = paymentLinkId && checkoutUrl(`https://pay.payos.vn/web/${encodeURIComponent(paymentLinkId)}`);
  if (!response.ok || !result || result.code !== "00" || !signed
      || !secureEqual(String(signed).toLowerCase(), String(result.signature).toLowerCase()) || !url
      || result.data.orderCode !== rec.order_code || result.data.amount !== rec.amount
      || result.data.status !== "PENDING") throw new Error("payment_unavailable");
  rec.checkout_url = url;
  rec.payment_link_id = paymentLinkId;
  rec.payment_status = "pending";
  await putAdvice(env, rec);
  return url;
}

async function handleAdvicePayment(request, env) {
  const auth = await adviceAuth(request, env);
  if (auth.response) return auth.response;
  if (!paymentConfigured(env)) return json({ error: "payment_not_configured" }, 503);
  if (!(await rateAllowed(env.CHAT_RATE_LIMITER, `${auth.claims.sid}:advice-payment`))) {
    return json({ error: "rate_limited" }, 429);
  }
  const body = await readJson(request);
  if (!body || !isUuid(body.id)) return json({ error: "invalid_request" }, 400);
  const rec = await getJson(env, adviceKey(body.id));
  if (!adviceBoundTo(rec, auth.claims)) return json({ error: "not_found" }, 404);
  if (rec.status === "paid") return json({ error: "already_paid" }, 409);
  if (rec.status !== "quoted" || !Number.isSafeInteger(rec.amount) || rec.amount <= 0) {
    return json({ error: "quote_required" }, 409);
  }
  const existing = checkoutUrl(rec.checkout_url);
  if (existing) return json({ checkout_url: existing, duplicate: true });
  const pendingKey = `advice-payment-pending:${rec.id}`;
  if (await env.KV.get(pendingKey)) return json({ error: "payment_pending" }, 409);
  await env.KV.put(pendingKey, "1", { expirationTtl: 300 });

  try {
    if (Number.isSafeInteger(rec.order_code)) {
      const recovered = await recoverPayosCheckout(env, rec);
      if (recovered) {
        await env.KV.delete(pendingKey);
        return json({ checkout_url: recovered, duplicate: true });
      }
    } else {
      rec.order_code = orderCodeForAdvice(rec.id);
    }
    const data = {
      orderCode: rec.order_code,
      amount: rec.amount,
      description: `LG${String(rec.order_code).slice(-7)}`,
      cancelUrl: paymentUrl(env, rec.id, "cancel"),
      returnUrl: paymentUrl(env, rec.id, "return"),
    };
    data.signature = await hmacHex(env.PAYOS_CHECKSUM_KEY,
      `amount=${data.amount}&cancelUrl=${data.cancelUrl}&description=${data.description}&orderCode=${data.orderCode}&returnUrl=${data.returnUrl}`);
    await Promise.all([
      putAdvice(env, rec),
      env.KV.put(payosOrderKey(rec.order_code), JSON.stringify({ advice_id: rec.id, amount: rec.amount }), { expirationTtl: CHAT_TTL }),
    ]);

    const response = await fetch("https://api-merchant.payos.vn/v2/payment-requests", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-client-id": env.PAYOS_CLIENT_ID,
        "x-api-key": env.PAYOS_API_KEY,
      },
      body: JSON.stringify(data),
    });
    const result = await response.json().catch(() => null);
    const signed = result && result.data && result.signature
      && await hmacHex(env.PAYOS_CHECKSUM_KEY, payosDataString(result.data));
    const url = result && result.data && checkoutUrl(result.data.checkoutUrl);
    if (!response.ok || !result || result.code !== "00" || !signed
        || !secureEqual(String(signed).toLowerCase(), String(result.signature).toLowerCase()) || !url
        || result.data.orderCode !== rec.order_code || result.data.amount !== rec.amount
        || result.data.currency !== "VND") throw new Error("payment_unavailable");
    rec.checkout_url = url;
    rec.payment_link_id = cleanText(result.data.paymentLinkId, 100);
    rec.payment_status = "pending";
    await putAdvice(env, rec);
    await env.KV.delete(pendingKey);
    return json({ checkout_url: url });
  } catch (_) {
    await env.KV.delete(pendingKey).catch(() => {});
    return json({ error: "payment_unavailable" }, 502);
  }
}

async function handlePayosWebhook(request, env) {
  if (!String(env.PAYOS_CHECKSUM_KEY || "")) return json({ error: "payment_not_configured" }, 503);
  const body = await readJson(request, 20000);
  if (!body || !body.data || typeof body.data !== "object" || !/^[0-9a-f]{64}$/i.test(body.signature || "")) {
    return json({ error: "invalid_request" }, 400);
  }
  const expected = await hmacHex(env.PAYOS_CHECKSUM_KEY, payosDataString(body.data));
  if (!secureEqual(expected.toLowerCase(), String(body.signature).toLowerCase())) {
    return json({ error: "invalid_signature" }, 403);
  }
  const data = body.data;
  if (body.success !== true || body.code !== "00" || data.code !== "00"
      || !Number.isSafeInteger(data.orderCode) || !Number.isSafeInteger(data.amount) || data.currency !== "VND") {
    return json({ ok: true });
  }
  const map = await getJson(env, payosOrderKey(data.orderCode));
  const rec = map && await getJson(env, adviceKey(map.advice_id));
  if (!map || !rec || rec.order_code !== data.orderCode || rec.amount !== data.amount || map.amount !== data.amount
      || (rec.payment_link_id && !secureEqual(rec.payment_link_id, cleanText(data.paymentLinkId, 100)))) {
    return json({ ok: true });
  }
  if (rec.status !== "paid") {
    rec.status = "paid";
    rec.payment_status = "paid";
    rec.paid_at = Date.now();
    await putAdvice(env, rec);
    if (Number.isInteger(rec.telegram_message_id)) {
      tg(env, "editMessageText", {
        chat_id: env.TELEGRAM_CHAT_ID,
        message_id: rec.telegram_message_id,
        text: adviceTelegramText(rec),
        reply_markup: { inline_keyboard: [] },
      }).catch(() => {});
    }
  }
  return json({ ok: true });
}

/* ----------------------------- Telegram webhook ----------------------------- */
async function handleTelegramWebhook(request, env) {
  const webhookSecret = env.TELEGRAM_WEBHOOK_SECRET;
  if (!webhookSecret || !secureEqual(request.headers.get("X-Telegram-Bot-Api-Secret-Token"), webhookSecret)) {
    return json({ error: "forbidden" }, 403);
  }
  const update = await readJson(request);
  if (!update || !Number.isInteger(update.update_id)) return json({ error: "invalid_request" }, 400);
  const updateKey = `tgupdate:${update.update_id}`;
  if (await env.KV.get(updateKey)) return json({ ok: true, duplicate: true });

  const cb = update.callback_query;
  if (cb && cb.message && String(cb.message.chat.id) === String(env.TELEGRAM_CHAT_ID)
      && cb.from && String(cb.from.id) === String(env.TELEGRAM_CHAT_ID)) {
    const [action, id] = String(cb.data || "").split(":");
    let answer = "Lệnh không hợp lệ";
    let edit = null;
    if ((action === "approve" || action === "deny") && isUuid(id)) {
      const status = action === "approve" ? "approved" : "denied";
      await decide(env, id, status);
      answer = status === "approved" ? "Đã duyệt" : "Đã từ chối";
      edit = {
        chat_id: cb.message.chat.id,
        message_id: cb.message.message_id,
        text: `${cb.message.text || "Yêu cầu truy cập"}\n\n${status === "approved" ? "ĐÃ DUYỆT" : "ĐÃ TỪ CHỐI"} lúc ${new Date().toISOString()}`,
      };
    } else if (action === "advice") {
      const result = await handleAdviceCallback(cb, env);
      answer = result.answer;
      edit = result.edit || null;
    }
    // Persist after local mutation but before Telegram calls: an edit failure must not replay the command.
    await env.KV.put(updateKey, "1", { expirationTtl: TELEGRAM_UPDATE_TTL });
    await tg(env, "answerCallbackQuery", { callback_query_id: cb.id, text: answer });
    if (edit) await tg(env, "editMessageText", edit);
    return json({ ok: true });
  } else if (update.message) {
    await handleOwnerReply(update.message, env);
  }
  await env.KV.put(updateKey, "1", { expirationTtl: TELEGRAM_UPDATE_TTL });
  return json({ ok: true });
}

/* ----------------------------- admin ----------------------------- */
function publicRequest(rec) {
  return {
    id: rec.id,
    app: validApp(rec.app) || "unknown",
    name: cleanText(rec.name, 80),
    note: cleanText(rec.note, 300),
    ip: redactIp(rec.ip),
    country: /^[A-Z]{2}$/.test(rec.country || "") ? rec.country : "",
    browser: cleanText(rec.browser || browserLabel(rec.ua), 30),
    status: ["pending", "approved", "denied"].includes(rec.status) ? rec.status : "unknown",
    created_at: Number(rec.created_at) || 0,
  };
}

async function listRequests(env, cursor) {
  const out = [];
  const page = await env.KV.list({ prefix: "req:", cursor: cursor || undefined, limit: ADMIN_PAGE_LIMIT });
  const records = await Promise.all(page.keys.map((key) => getJson(env, key.name)));
  for (const rec of records) if (rec) out.push(publicRequest(rec));
  out.sort((a, b) => b.created_at - a.created_at);
  return {
    requests: out,
    cursor: page.list_complete ? "" : cleanText(page.cursor, 4096),
  };
}

async function listDevices(env, cursor) {
  const page = await env.KV.list({ prefix: "device:", cursor: cursor || undefined, limit: ADMIN_PAGE_LIMIT });
  const records = await Promise.all(page.keys.map((key) => getJson(env, key.name)));
  const devices = records.filter((rec) => rec && validApp(rec.app) && isUuid(rec.device_id)).map((rec) => ({
    app: rec.app,
    device_id: rec.device_id,
    first_seen: Number(rec.first_seen) || 0,
    last_seen: Number(rec.last_seen) || 0,
    visits: Math.max(0, Number(rec.visits) || 0),
    methods: Array.isArray(rec.methods) ? rec.methods.map((value) => cleanText(value, 20)).filter(Boolean) : [],
    countries: Array.isArray(rec.countries) ? rec.countries.filter((value) => /^[A-Z]{2}$/.test(value)) : [],
    browser: cleanText(rec.browser, 30),
    ip: redactIp(rec.ip),
    device: cleanDevice(rec.device),
  }));
  return {
    devices: devices.sort((a, b) => b.last_seen - a.last_seen),
    cursor: page.list_complete ? "" : cleanText(page.cursor, 4096),
  };
}

function adminHtml(nonce) {
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Kiểm soát truy cập</title>
<style nonce="${nonce}">body{font-family:system-ui,sans-serif;background:#0d0b14;color:#e8e2f4;margin:0;padding:16px}h1,h2{color:#d4a94e;font-size:1.1rem}a{color:#b9a6ea}input,button{font:inherit;padding:8px 10px;border-radius:8px;border:1px solid #332a52;background:#161226;color:#e8e2f4}button{cursor:pointer}table{width:100%;border-collapse:collapse;margin:12px 0 28px;font-size:.82rem}td,th{border-bottom:1px solid #332a52;padding:8px;text-align:left;vertical-align:top}.ok{background:#1e5f3f}.no{background:#5f2b1e}.pending{color:#d4a94e}.approved{color:#5fbf8a}.denied{color:#e0785a}.muted,small{color:#a89fc4}.scroll{overflow:auto}.links{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:18px}</style>
</head><body><h1>Kiểm soát truy cập</h1><nav class="links" aria-label="Link hệ thống"><a href="https://hiennhi89.pages.dev/">SPARE</a><a href="https://hiennhi89.pages.dev/boitoan/">Bói toán</a><a href="https://hiennhi89.pages.dev/medora/">MEDORA</a></nav><p class="muted">Mỗi mã là một hồ sơ trình duyệt, không phải thiết bị vật lý. Danh sách gồm cả cách mở bằng mật khẩu, ghi nhớ và phê duyệt trong 90 ngày gần nhất; telemetry online có thể bỏ sót. “Lần cuối” là lần truy cập gần nhất, không khẳng định thiết bị đang online.</p>
<label>ADMIN_TOKEN <input id="tok" type="password" autocomplete="current-password"></label> <button id="load" type="button">Tải dữ liệu</button>
<p id="msg" role="status"></p><h2>Thiết bị</h2><div id="devices" class="scroll"></div><h2>Yêu cầu duyệt</h2><div id="requests" class="scroll"></div>
<script nonce="${nonce}">'use strict';
const $=function(id){return document.getElementById(id)};
function node(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(cls)n.className=cls;return n}
function cell(row,text,cls){const n=node('td',text,cls);row.appendChild(n);return n}
function table(headers){const t=node('table'),head=node('tr');headers.forEach(function(h){head.appendChild(node('th',h))});t.appendChild(head);return t}
async function api(path,opt){opt=opt||{};opt.headers=Object.assign({'authorization':'Bearer '+$('tok').value},opt.headers||{});const r=await fetch(path,opt);const d=await r.json();if(!r.ok)throw new Error(d.error||('HTTP '+r.status));return d}
async function decide(id,action){await api('/api/admin/'+action,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id:id})});await load()}
function renderDevices(items){const t=table(['App','Mã trình duyệt','Cách mở','Lượt gần đúng','Quốc gia/IP rút gọn','Trình duyệt/thiết bị','Lần đầu','Lần cuối']);items.forEach(function(d){const r=node('tr');cell(r,d.app);cell(r,d.device_id);cell(r,(d.methods||[]).join(', '));cell(r,d.visits);cell(r,(d.countries||[]).join(', ')+' '+(d.ip||''));cell(r,[d.browser,d.device&&d.device.platform,d.device&&d.device.screen].filter(Boolean).join(' · '));cell(r,new Date(d.first_seen).toLocaleString());cell(r,new Date(d.last_seen).toLocaleString());t.appendChild(r)});$('devices').replaceChildren(t)}
function renderRequests(items){const t=table(['TT','App','Tên/Lý do','IP rút gọn','Trình duyệt','Lúc','']);items.forEach(function(q){const r=node('tr');cell(r,q.status,q.status);cell(r,q.app);const who=cell(r,q.name);who.appendChild(node('br'));who.appendChild(node('small',q.note||''));cell(r,(q.country||'')+' '+(q.ip||''));cell(r,q.browser);cell(r,new Date(q.created_at).toLocaleString());const actions=cell(r,'');if(q.status==='pending'){const yes=node('button','Duyệt','ok');yes.addEventListener('click',function(){decide(q.id,'approve')});const no=node('button','Từ chối','no');no.addEventListener('click',function(){decide(q.id,'deny')});actions.append(yes,' ',no)}else if(q.status==='approved'){const revoke=node('button','Thu hồi phiên','no');revoke.addEventListener('click',function(){decide(q.id,'deny')});actions.appendChild(revoke)}t.appendChild(r)});$('requests').replaceChildren(t)}
async function loadAll(kind){let cursor='',items=[];do{const d=await api('/api/admin/list?kind='+kind+(cursor?'&cursor='+encodeURIComponent(cursor):''));items=items.concat(d[kind]||[]);cursor=d.cursor||'';$('msg').textContent='Đang tải '+kind+': '+items.length}while(cursor);return items}
async function load(){try{$('msg').textContent='Đang tải…';const requests=await loadAll('requests');const devices=await loadAll('devices');requests.sort(function(a,b){return b.created_at-a.created_at});devices.sort(function(a,b){return b.last_seen-a.last_seen});renderRequests(requests);renderDevices(devices);$('msg').textContent='Đã tải '+requests.length+' yêu cầu và '+devices.length+' hồ sơ trình duyệt.'}catch(e){$('msg').textContent='Lỗi: '+e.message}}
$('load').addEventListener('click',load);
</script></body></html>`;
}

function requireAdmin(request, env) {
  const token = bearer(request);
  return !!token && secureEqual(token, env.ADMIN_TOKEN);
}

/* ----------------------------- entrypoint ----------------------------- */
const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    try {
      const communityResponse = await handleCommunity(request, env);
      if (communityResponse) return withCors(communityResponse, cors);

      if (url.pathname === "/api/request" && request.method === "POST") return withCors(await handleRequest(request, env), cors);
      if (url.pathname === "/api/status" && request.method === "GET") return withCors(await handleStatus(env, url), cors);
      if (url.pathname === "/api/access" && request.method === "POST") return withCors(await handleAccess(request, env), cors);
      if (url.pathname === "/api/log" && request.method === "POST") return withCors(await handleLog(request, env), cors);
      if (url.pathname === "/api/chat/send" && request.method === "POST") return withCors(await handleChatSend(request, env), cors);
      if (url.pathname === "/api/chat/messages" && request.method === "GET") return withCors(await handleChatMessages(request, env), cors);
      if (url.pathname === "/api/advice/request" && request.method === "POST") return withCors(await handleAdviceRequest(request, env), cors);
      if (url.pathname === "/api/advice/status" && request.method === "GET") return withCors(await handleAdviceStatus(request, env, url), cors);
      if (url.pathname === "/api/advice/payment" && request.method === "POST") return withCors(await handleAdvicePayment(request, env), cors);

      if (url.pathname === "/telegram/webhook" && request.method === "POST") return handleTelegramWebhook(request, env);
      if (url.pathname === "/payos/webhook" && request.method === "POST") return handlePayosWebhook(request, env);

      if (url.pathname === "/admin" && request.method === "GET") {
        const nonce = b64url(crypto.getRandomValues(new Uint8Array(16)));
        return new Response(adminHtml(nonce), {
          headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "no-store",
            "content-security-policy": `default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`,
            "referrer-policy": "no-referrer",
            "x-content-type-options": "nosniff",
          },
        });
      }
      if (url.pathname.startsWith("/api/admin/")) {
        if (!requireAdmin(request, env)) return json({ error: "unauthorized" }, 401);
        if (url.pathname === "/api/admin/list" && request.method === "GET") {
          const cursor = cleanText(url.searchParams.get("cursor"), 4096);
          const kind = url.searchParams.get("kind");
          if (kind === "requests") return json(await listRequests(env, cursor));
          if (kind === "devices") return json(await listDevices(env, cursor));
          return json({ error: "invalid_request" }, 400);
        }
        const body = await readJson(request);
        if (!body || !isUuid(body.id)) return json({ error: "invalid_request" }, 400);
        if (url.pathname === "/api/admin/approve" && request.method === "POST") {
          await decide(env, body.id, "approved");
          return json({ ok: true });
        }
        if (url.pathname === "/api/admin/deny" && request.method === "POST") {
          await decide(env, body.id, "denied");
          return json({ ok: true });
        }
      }

      if (url.pathname === "/") return new Response("gate backend OK", { status: 200 });
      return json({ error: "not_found" }, 404);
    } catch (_) {
      return json({ error: "server" }, 500);
    }
  },
};

function withCors(response, cors) {
  const result = new Response(response.body, response);
  Object.entries(cors).forEach(([key, value]) => result.headers.set(key, value));
  return result;
}

export const __test = {
  redactIp, browserLabel, makeJWT, verifyJWT, chatKey, hmacHex, payosDataString, ACCESS_TTL, CHAT_TTL,
};
export default worker;
