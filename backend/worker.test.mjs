import assert from "node:assert/strict";
import worker, { __test } from "./worker.js";

class MemoryKV {
  constructor() { this.values = new Map(); this.options = new Map(); }
  async get(key) { return this.values.get(String(key)) ?? null; }
  async put(key, value, options = {}) {
    this.values.set(String(key), String(value));
    this.options.set(String(key), options);
  }
  async delete(key) { this.values.delete(String(key)); this.options.delete(String(key)); }
  async list({ prefix = "", limit = 1000, cursor = "" } = {}) {
    const all = [...this.values.keys()].filter((key) => key.startsWith(prefix)).sort();
    const offset = Number(cursor) || 0;
    const keys = all.slice(offset, offset + limit);
    const next = offset + keys.length;
    return {
      keys: keys.map((name) => ({ name, metadata: this.options.get(name)?.metadata })),
      list_complete: next >= all.length,
      cursor: next >= all.length ? "" : String(next),
    };
  }
}

const DID = "11111111-1111-4111-8111-111111111111";
const EVENT = "22222222-2222-4222-8222-222222222222";
const CLIENT_MESSAGE = "33333333-3333-4333-8333-333333333333";
const SECRET = "test-session-secret-at-least-32-chars";
let telegramId = 100;
let telegramCalls = [];
let telegramFails = false;

const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, options) => {
  telegramCalls.push({ url: String(url), body: JSON.parse(options.body) });
  if (telegramFails) return new Response(JSON.stringify({ ok: false }), { status: 502 });
  telegramId += 1;
  return new Response(JSON.stringify({ ok: true, result: { message_id: telegramId } }), {
    headers: { "content-type": "application/json" },
  });
};

function env(overrides = {}) {
  return {
    KV: new MemoryKV(),
    ALLOWED_ORIGINS: "https://app.test",
    TELEGRAM_CHAT_ID: "123456789",
    TELEGRAM_BOT_TOKEN: "not-a-real-token",
    TELEGRAM_WEBHOOK_SECRET: "webhook-secret",
    ADMIN_TOKEN: "admin-secret",
    SESSION_SECRET: SECRET,
    DECRYPT_KEY: "decrypt-secret",
    CHAT_ENABLED: "false",
    PUBLIC_RATE_LIMITER: { limit: async () => ({ success: true }) },
    CHAT_RATE_LIMITER: { limit: async () => ({ success: true }) },
    ...overrides,
  };
}

function request(path, { method = "GET", body, token, ip = "203.0.113.42", headers = {} } = {}) {
  const req = new Request(`https://gate.test${path}`, {
    method,
    headers: {
      origin: "https://app.test",
      "user-agent": "Mozilla/5.0 Chrome/123.0.0.0 Safari/537.36",
      "cf-connecting-ip": ip,
      ...(body === undefined ? {} : { "content-type": "application/json" }),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  Object.defineProperty(req, "cf", { value: { country: "VN" } });
  return req;
}

async function call(environment, path, options) {
  return worker.fetch(request(path, options), environment);
}

async function body(response) { return response.json(); }

try {
  assert.equal(__test.redactIp("203.0.113.42"), "203.0.113.0/24");
  assert.equal(__test.redactIp("203.0.113.0/24"), "203.0.113.0/24");
  assert.equal(__test.redactIp("2001:0db8:85a3:1234:8a2e:0370:7334:abcd"), "2001:db8:85a3:1234::/64");
  assert.equal(__test.redactIp("2001:db8:85a3:1234::/64"), "2001:db8:85a3:1234::/64");
  assert.equal(__test.redactIp("999.1.1.1"), "");
  assert.equal(__test.redactIp("not-an-ip"), "");

  const expired = await __test.makeJWT(SECRET, { sub: "x" }, 0);
  assert.equal(await __test.verifyJWT(SECRET, expired), null, "JWT expires at the exact expiration second");
  const valid = await __test.makeJWT(SECRET, { sub: "x" }, 60);
  assert.equal((await __test.verifyJWT(SECRET, valid)).sub, "x");
  assert.equal(await __test.verifyJWT(SECRET, `${valid.slice(0, -1)}x`), null);

  const e = env();
  let response = await call(e, "/api/request", {
    method: "POST",
    body: {
      app: "spare",
      name: "<img src=x onerror=alert(1)>",
      note: "<script>alert(1)</script>",
      password: "must-not-persist",
      device_id: DID,
      device: { lang: "vi", tz: "Asia/Ho_Chi_Minh", screen: "1080x1920", platform: "Win32" },
    },
  });
  assert.equal(response.status, 200);
  const approval = await body(response);
  const storedRequest = JSON.parse(await e.KV.get(`req:${approval.id}`));
  assert.equal(storedRequest.ip, "203.0.113.0/24");
  assert(!JSON.stringify(storedRequest).includes("203.0.113.42"));
  assert(!JSON.stringify(storedRequest).includes("must-not-persist"));
  assert(!telegramCalls.at(-1).body.text.includes("203.0.113.42"));
  assert.equal(telegramCalls.at(-1).body.parse_mode, undefined, "visitor-controlled text must use Telegram plain text");

  response = await call(e, "/api/request", {
    method: "POST",
    body: { app: "evil", name: "x", device_id: DID },
  });
  assert.equal(response.status, 400, "app must be allowlisted");

  response = await call(e, "/api/status?id=" + approval.id + "&did=" + EVENT);
  assert.equal(response.status, 403, "approval status is bound to browser ID");

  response = await call(e, "/api/access", {
    method: "POST",
    body: { app: "spare", device_id: DID, event_id: EVENT, client_method: "password", password: "never-store" },
  });
  assert.equal(response.status, 200);
  const telemetryResponse = await body(response);
  assert.deepEqual(telemetryResponse, { ok: true }, "public telemetry must not grant credentials");
  const access = JSON.parse(await e.KV.get(`access:spare:${EVENT}`));
  assert.equal(access.method, "client-reported");
  assert.equal(access.client_method, "password");
  assert(!JSON.stringify(access).includes("never-store"));
  assert.equal(e.KV.options.get(`access:spare:${EVENT}`).expirationTtl, __test.ACCESS_TTL);

  response = await call(e, "/api/access", {
    method: "POST",
    body: { app: "spare", device_id: DID, event_id: EVENT, client_method: "password" },
  });
  assert.deepEqual(await body(response), { ok: true, duplicate: true });

  const blocked = env({ PUBLIC_RATE_LIMITER: { limit: async () => ({ success: false }) } });
  response = await call(blocked, "/api/access", {
    method: "POST",
    body: { app: "spare", device_id: DID, event_id: EVENT },
  });
  assert.equal(response.status, 429);

  response = await call(e, "/admin");
  const adminPage = await response.text();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-security-policy"), /default-src 'none'/);
  assert(adminPage.includes("textContent"));
  assert(!adminPage.includes("innerHTML"));
  assert(!adminPage.includes("<img src=x onerror=alert(1)>"), "stored payload must not enter admin HTML");

  response = await call(e, "/api/admin/list", { token: "admin-secret" });
  assert.equal(response.status, 200);
  const adminData = await body(response);
  assert.equal(adminData.requests[0].ip, "203.0.113.0/24");
  assert.equal(adminData.devices[0].visits, 1);
  assert.equal(adminData.cursor, "");

  for (let i = 0; i < 251; i += 1) {
    const id = `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
    await e.KV.put(`device:spare:${id}`, JSON.stringify({
      app: "spare", device_id: id, first_seen: i, last_seen: i, visits: 1,
      methods: ["password"], countries: ["VN"], browser: "Chrome", device: {},
    }));
  }
  response = await call(e, "/api/admin/list", { token: "admin-secret" });
  const firstDevicePage = await body(response);
  assert.equal(firstDevicePage.devices.length, 250);
  assert(firstDevicePage.cursor);
  response = await call(e, `/api/admin/list?cursor=${encodeURIComponent(firstDevicePage.cursor)}`, { token: "admin-secret" });
  const secondDevicePage = await body(response);
  assert.equal(secondDevicePage.devices.length, 2);
  assert.equal(secondDevicePage.cursor, "");
  assert.deepEqual(secondDevicePage.requests, [], "approval records are only loaded with the first device page");

  response = await call(e, "/api/admin/approve", {
    method: "POST",
    token: "admin-secret",
    body: { id: approval.id },
  });
  assert.equal(response.status, 200);
  e.DECRYPT_KEY_SPARE = "spare-decrypt-secret";
  response = await call(e, `/api/status?id=${approval.id}&did=${DID}`);
  const status = await body(response);
  assert.equal(status.status, "approved");
  assert.equal(status.key, "spare-decrypt-secret", "app-specific decryption key must override the fallback key");
  assert(status.token);
  const claims = await __test.verifyJWT(SECRET, status.token);
  assert.equal(claims.ver, 2);
  assert.equal(claims.aud, "gate-chat");
  assert.equal(claims.app, "spare");
  assert(claims.scope.includes("chat"));

  const expiryEnv = env();
  response = await call(expiryEnv, "/api/request", {
    method: "POST",
    body: { app: "spare", name: "Phiên hết hạn", device_id: DID },
  });
  const expiringApproval = await body(response);
  await call(expiryEnv, "/api/admin/approve", {
    method: "POST",
    token: "admin-secret",
    body: { id: expiringApproval.id },
  });
  response = await call(expiryEnv, `/api/status?id=${expiringApproval.id}&did=${DID}`);
  const expiringStatus = await body(response);
  const expiringClaims = await __test.verifyJWT(SECRET, expiringStatus.token);
  await expiryEnv.KV.delete(`session:${expiringClaims.sid}`);
  response = await call(expiryEnv, `/api/status?id=${expiringApproval.id}&did=${DID}`);
  assert.deepEqual(await body(response), { status: "expired" }, "expired session must not return JWT or decryption key");
  response = await call(expiryEnv, "/api/admin/approve", {
    method: "POST",
    token: "admin-secret",
    body: { id: expiringApproval.id },
  });
  assert.equal(response.status, 200);
  response = await call(expiryEnv, `/api/status?id=${expiringApproval.id}&did=${DID}`);
  const renewedStatus = await body(response);
  assert.equal(renewedStatus.status, "approved", "re-approval must renew an expired session");
  assert.notEqual((await __test.verifyJWT(SECRET, renewedStatus.token)).sid, expiringClaims.sid);

  const missingSecretEnv = env();
  response = await call(missingSecretEnv, "/api/request", {
    method: "POST",
    body: { app: "spare", name: "Thiếu secret", device_id: DID },
  });
  const missingSecretApproval = await body(response);
  await call(missingSecretEnv, "/api/admin/approve", {
    method: "POST",
    token: "admin-secret",
    body: { id: missingSecretApproval.id },
  });
  missingSecretEnv.SESSION_SECRET = "";
  response = await call(missingSecretEnv, `/api/status?id=${missingSecretApproval.id}&did=${DID}`);
  assert.deepEqual(await body(response), { status: "expired" }, "missing signing secret must not expose JWT or decryption key");

  response = await call(e, "/api/chat/messages", { token: status.token });
  assert.equal(response.status, 503, "chat feature flag defaults off");
  e.CHAT_ENABLED = "true";

  const oldToken = await __test.makeJWT(SECRET, { sub: approval.id }, 60);
  response = await call(e, "/api/chat/messages", { token: oldToken });
  assert.equal(response.status, 401, "legacy token cannot gain chat privilege");

  telegramCalls = [];
  response = await call(e, "/api/chat/send", {
    method: "POST",
    token: status.token,
    body: { client_id: CLIENT_MESSAGE, cid: "attacker-conversation", text: "Xin chào <script>alert(1)</script>" },
  });
  assert.equal(response.status, 200);
  assert.equal(telegramCalls.length, 1);
  assert.equal(telegramCalls[0].body.parse_mode, undefined);
  assert([...e.KV.values.keys()].some((key) => key.startsWith(`chat:${claims.cid}:`)));
  assert(![...e.KV.values.keys()].some((key) => key.includes("attacker-conversation")));
  assert.equal(e.KV.options.get([...e.KV.values.keys()].find((key) => key.startsWith(`chat:${claims.cid}:`))).expirationTtl, __test.CHAT_TTL);

  response = await call(e, "/api/chat/send", {
    method: "POST",
    token: status.token,
    body: { client_id: CLIENT_MESSAGE, text: "retry" },
  });
  assert.deepEqual(await body(response), { ok: true, id: CLIENT_MESSAGE, duplicate: true });
  assert.equal(telegramCalls.length, 1, "idempotent retry must not duplicate Telegram message");

  const rateKeys = [];
  e.CHAT_RATE_LIMITER = {
    limit: async ({ key }) => {
      rateKeys.push(key);
      return { success: !key.endsWith(":chat-send") };
    },
  };
  response = await call(e, "/api/chat/send", {
    method: "POST",
    token: status.token,
    body: { client_id: "55555555-5555-4555-8555-555555555555", text: "blocked" },
  });
  assert.equal(response.status, 429);
  response = await call(e, "/api/chat/messages", { token: status.token });
  assert.equal(response.status, 200, "read polling must use a quota independent from sending");
  assert(rateKeys.some((key) => key.endsWith(":chat-send")) && rateKeys.some((key) => key.endsWith(":chat-read")));
  e.CHAT_RATE_LIMITER = { limit: async () => ({ success: true }) };

  const historyEnv = env({ CHAT_ENABLED: "true" });
  const historyApproval = "66666666-6666-4666-8666-666666666666";
  await historyEnv.KV.put(`req:${historyApproval}`, JSON.stringify({
    id: historyApproval, app: "spare", name: "Lịch sử", device_id: DID, status: "pending", created_at: 1,
  }));
  await call(historyEnv, "/api/admin/approve", {
    method: "POST", token: "admin-secret", body: { id: historyApproval },
  });
  response = await call(historyEnv, `/api/status?id=${historyApproval}&did=${DID}`);
  const historyStatus = await body(response);
  const historyClaims = await __test.verifyJWT(SECRET, historyStatus.token);
  for (let i = 0; i < 101; i += 1) {
    const id = `77777777-7777-4777-8777-${String(i).padStart(12, "0")}`;
    const message = { id, sender: "visitor", text: `Tin ${i}`, created_at: i };
    await historyEnv.KV.put(__test.chatKey(historyClaims.cid, i, id), JSON.stringify(message));
  }
  response = await call(historyEnv, "/api/chat/messages", { token: historyStatus.token });
  const recentMessages = (await body(response)).messages;
  assert.equal(recentMessages.length, 100);
  assert.equal(recentMessages[0].text, "Tin 1");
  assert.equal(recentMessages.at(-1).text, "Tin 100", "chat history must return the newest 100 messages");

  const mappedTelegramId = telegramId;
  const ownerUpdate = {
    update_id: 9001,
    message: {
      message_id: 501,
      date: 1_700_000_000,
      text: "Chào bạn",
      chat: { id: 123456789 },
      from: { id: 123456789 },
      reply_to_message: { message_id: mappedTelegramId, from: { is_bot: true } },
    },
  };
  response = await call(e, "/telegram/webhook", {
    method: "POST",
    body: ownerUpdate,
    headers: { "X-Telegram-Bot-Api-Secret-Token": "webhook-secret" },
  });
  assert.equal(response.status, 200);
  response = await call(e, "/api/chat/messages", { token: status.token });
  let messages = (await body(response)).messages;
  assert.deepEqual(messages.map((message) => message.sender), ["owner", "visitor"].sort((a, b) => {
    const times = { owner: 1_700_000_000_000, visitor: Number.MAX_SAFE_INTEGER };
    return times[a] - times[b];
  }));
  assert(messages.some((message) => message.text === "Chào bạn"));

  response = await call(env({ TELEGRAM_WEBHOOK_SECRET: "" }), "/telegram/webhook", {
    method: "POST",
    body: { update_id: 9002 },
  });
  assert.equal(response.status, 403, "missing webhook secret must fail closed");

  const requestBeforeForeignCallback = JSON.parse(await e.KV.get(`req:${approval.id}`));
  response = await call(e, "/telegram/webhook", {
    method: "POST",
    body: {
      update_id: 9003,
      callback_query: {
        id: "foreign",
        from: { id: 999999999 },
        data: `deny:${approval.id}`,
        message: { message_id: 1, text: "Yêu cầu", chat: { id: 123456789 } },
      },
    },
    headers: { "X-Telegram-Bot-Api-Secret-Token": "webhook-secret" },
  });
  assert.equal(response.status, 200);
  assert.equal(JSON.parse(await e.KV.get(`req:${approval.id}`)).status, requestBeforeForeignCallback.status,
    "callback from non-owner must not change approval");

  const countBeforeReplay = [...e.KV.values.keys()].filter((key) => key.startsWith(`chat:${claims.cid}:`)).length;
  response = await call(e, "/telegram/webhook", {
    method: "POST",
    body: ownerUpdate,
    headers: { "X-Telegram-Bot-Api-Secret-Token": "webhook-secret" },
  });
  assert.deepEqual(await body(response), { ok: true, duplicate: true });
  assert.equal([...e.KV.values.keys()].filter((key) => key.startsWith(`chat:${claims.cid}:`)).length, countBeforeReplay);

  response = await call(e, "/api/access", {
    method: "POST",
    token: status.token,
    body: { app: "spare", device_id: DID, event_id: "44444444-4444-4444-8444-444444444444", client_method: "password" },
  });
  assert.equal(response.status, 200);
  assert.equal(JSON.parse(await e.KV.get("access:spare:44444444-4444-4444-8444-444444444444")).method, "approved");

  response = await call(e, "/api/admin/deny", {
    method: "POST",
    token: "admin-secret",
    body: { id: approval.id },
  });
  assert.equal(response.status, 200);
  response = await call(e, "/api/chat/messages", { token: status.token });
  assert.equal(response.status, 401, "denial revokes active session");

  telegramFails = true;
  const failureEnv = env({ CHAT_ENABLED: "true" });
  response = await call(failureEnv, "/api/request", {
    method: "POST",
    body: { app: "spare", name: "Khách", device_id: DID },
  });
  assert.equal(response.status, 200, "approval request survives Telegram outage");

  console.log("Worker security and feature tests PASS");
} finally {
  globalThis.fetch = originalFetch;
}
