import assert from "node:assert/strict";
import { createHmac, pbkdf2Sync, randomBytes, randomUUID } from "node:crypto";
import { handleCommunity, __test } from "./community.js";

class MemoryKV {
  constructor() { this.map = new Map(); }
  async get(key) { return this.map.get(key) ?? null; }
  async put(key, value) { this.map.set(key, String(value)); }
  async delete(key) { this.map.delete(key); }
  async list({ prefix = "", limit = 100 } = {}) {
    const keys = [...this.map.keys()].filter((key) => key.startsWith(prefix)).sort().slice(0, limit).map((name) => ({ name }));
    return { keys, list_complete: true };
  }
}

const secret = "s".repeat(64);
const primaryAdminPassword = "test-community-primary-admin";
const adminSalt = randomBytes(16);
const adminIterations = 1200;
const adminHash = (password) => pbkdf2Sync(password, adminSalt, adminIterations, 32, "sha256").toString("base64");
const env = {
  KV: new MemoryKV(),
  SESSION_SECRET: secret,
  ADMIN_TOKEN: "legacy-admin-token-must-not-work",
  ADMIN_V8_PASSWORD_SALT_B64: adminSalt.toString("base64"),
  ADMIN_V8_REGULAR_PASSWORD_HASH_B64: adminHash("test-community-regular-admin"),
  ADMIN_V8_PRIMARY_PASSWORD_HASH_B64: adminHash(primaryAdminPassword),
  ADMIN_V8_PASSWORD_ITERATIONS: String(adminIterations),
  DECRYPT_KEY: "test-decrypt-key",
};
function b64url(input) { return Buffer.from(input).toString("base64url"); }
function jwt(payload, ttl = 3600) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(JSON.stringify({ ...payload, iat: now, exp: now + ttl }));
  const sig = createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
}
async function gateToken(did) {
  const sid = randomUUID();
  await env.KV.put(`session:${sid}`, JSON.stringify({ active: true, app: "boitoan", did, cid: "x".repeat(32), expires_at: Date.now() + 3600000 }));
  return jwt({ ver: 2, aud: "gate-chat", app: "boitoan", sid, did, cid: "x".repeat(32), scope: ["access", "chat"] });
}
async function call(path, { method = "GET", token = "", body, ownerDevice = "" } = {}) {
  const headers = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  if (token) headers.authorization = `Bearer ${token}`;
  if (ownerDevice) headers["x-owner-device-id"] = ownerDevice;
  const request = new Request(`https://worker.test${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const response = await handleCommunity(request, env);
  return { status: response.status, data: await response.json() };
}

assert.equal(__test.validUsername("reader_89"), true);
assert.equal(__test.validUsername("ab"), false);
assert.equal(__test.validRole("guest"), true);
assert.equal(__test.validRole("admin"), false);
assert.equal(__test.hasLink("https://example.com"), true);
assert.equal(__test.hasLink("STK 123456789 tại VCB"), false);
assert.equal(__test.validQrData(""), true);
assert.equal(__test.validQrData("data:text/html;base64,WA=="), false);
assert.deepEqual(__test.cleanSpecialties(["Tarot", " Tarot ", "Lenormand"]), ["Tarot", "Lenormand"]);
assert.equal(__test.validateProfileBody({ display_name: "A", bank_name: "x.com" }, "reader").error, "links_not_allowed");
assert.equal(__test.validateProfileBody({ display_name: "A", bank_name: "VCB" }, "reader").value.bank_name, "VCB");
assert.equal(__test.secureEqual("abc", "abc"), true);
assert.equal(__test.secureEqual("abc", "abd"), false);

const entryDid = randomUUID();
let result = await call("/api/community/register", {
  method: "POST",
  body: {
    entry: true,
    device_id: entryDid,
    device: { ua: "Mozilla/5.0 Version/18.0 Mobile Safari/605.1", lang: "vi-VN", tz: "Asia/Bangkok", screen: "1179x2556", platform: "iPhone" },
    role: "guest",
    username: "entry_01",
    password: "password-entry",
    display_name: "Thành viên Cổng",
    bio: ""
  }
});
assert.equal(result.status, 201);
assert.equal(result.data.profile.role, "guest");
assert.equal(result.data.key, env.DECRYPT_KEY);
assert.equal(typeof result.data.gate_token, "string");
assert.equal(typeof result.data.token, "string");
assert.equal(result.data.telegram_notified, false);

result = await call("/api/community/login", {
  method: "POST",
  body: { entry: true, device_id: entryDid, device: { platform: "iPhone" }, username: "entry_01", password: "password-entry" }
});
assert.equal(result.status, 200);
assert.equal(result.data.profile.username, "entry_01");
assert.equal(result.data.key, env.DECRYPT_KEY);
assert.equal(typeof result.data.gate_token, "string");

const guestDid = randomUUID();
const readerDid = randomUUID();
const guestGate = await gateToken(guestDid);
const readerGate = await gateToken(readerDid);

result = await call("/api/community/register", {
  method: "POST", token: guestGate,
  body: { role: "guest", username: "guest_01", password: "password-guest", display_name: "Khách Một", bio: "Tôi là khách" }
});
assert.equal(result.status, 201);
const guestToken = result.data.token;
const guest = result.data.profile;
assert.equal(guest.role, "guest");
assert.equal("rating" in guest, false);

result = await call("/api/community/register", {
  method: "POST", token: readerGate,
  body: {
    role: "reader", username: "reader_01", password: "password-reader", display_name: "Reader Một",
    bio: "Luận giải truyền thống", specialties: ["Tarot", "Lenormand"], bank_name: "VCB",
    account_number: "123456789", account_name: "READER MOT", qr_data: ""
  }
});
assert.equal(result.status, 201);
const readerToken = result.data.token;
const reader = result.data.profile;
assert.equal(reader.role, "reader");
assert.deepEqual(reader.specialties, ["Tarot", "Lenormand"]);

result = await call("/api/community/register", {
  method: "POST", token: await gateToken(randomUUID()),
  body: { role: "reader", username: "reader_link", password: "password-reader", display_name: "Reader Link", bio: "x.com" }
});
assert.equal(result.status, 400);
assert.equal(result.data.error, "links_not_allowed");

result = await call("/api/community/readers", { token: guestToken });
assert.equal(result.status, 200);
assert.equal(result.data.readers.length, 1);
assert.equal(result.data.readers[0].bank.account_number, "123456789");
result = await call("/api/community/readers");
assert.equal(result.status, 401);

result = await call(`/api/community/readers/${reader.id}/reviews`, {
  method: "POST", token: guestToken, body: { rating: 5, text: "Luận giải rõ ràng" }
});
assert.equal(result.status, 201);
result = await call(`/api/community/readers/${reader.id}`, { token: readerToken });
assert.equal(result.status, 200);
assert.equal(result.data.reader.rating, 5);
assert.equal(result.data.reviews.length, 1);
result = await call(`/api/community/readers/${reader.id}/reviews`, { method: "DELETE", token: readerToken });
assert.equal(result.status, 404, "Reader không thể xóa review của Khách");

result = await call("/api/community/conversations", { method: "POST", token: guestToken, body: { reader_id: reader.id } });
assert.equal(result.status, 201);
const conversation = result.data.conversation;
result = await call(`/api/community/conversations/${conversation.id}/messages`, {
  method: "POST", token: guestToken, body: { client_id: randomUUID(), text: "Tôi cần xem bài", type: "text" }
});
assert.equal(result.status, 201);
result = await call(`/api/community/conversations/${conversation.id}/quote`, { method: "POST", token: readerToken, body: { amount: 250000 } });
assert.equal(result.status, 200);
result = await call(`/api/community/conversations/${conversation.id}/payment-notice`, { method: "POST", token: guestToken, body: {} });
assert.equal(result.data.conversation.payment_status, "customer_reported");
result = await call(`/api/community/conversations/${conversation.id}/confirm-payment`, { method: "POST", token: readerToken, body: {} });
assert.equal(result.data.conversation.payment_status, "confirmed");
result = await call(`/api/community/conversations/${conversation.id}/messages`, {
  method: "POST", token: readerToken, body: { client_id: randomUUID(), text: "Nội dung luận giải", type: "reading" }
});
assert.equal(result.status, 201);

const adminDid = randomUUID();
result = await call("/api/community/admin/login", {
  method: "POST", ownerDevice: adminDid,
  body: { password: primaryAdminPassword, device_id: adminDid, remember: true }
});
assert.equal(result.status, 200);
assert.equal(result.data.level, "primary");
assert.equal(result.data.primary, true);
assert.equal(result.data.key, env.DECRYPT_KEY);
const primaryAdminToken = result.data.token;

result = await call("/api/community/admin/users", { token: primaryAdminToken, ownerDevice: adminDid });
assert.equal(result.status, 200);
assert.equal(result.data.users.length, 3);
result = await call("/api/community/admin/conversations", { token: primaryAdminToken, ownerDevice: readerDid });
assert.equal(result.status, 401, "JWT Admin tổng không dùng được trên thiết bị khác");
result = await call("/api/community/admin/conversations", { token: primaryAdminToken, ownerDevice: adminDid });
assert.equal(result.status, 200);
assert.equal(result.data.conversations.length, 1);
result = await call(`/api/community/admin/conversations/${conversation.id}/messages`, { token: primaryAdminToken, ownerDevice: adminDid });
assert.equal(result.status, 200);
assert.equal(result.data.messages.length, 2);

result = await call(`/api/community/admin/reviews/${reader.id}/${guest.id}`, { method: "DELETE", token: primaryAdminToken, ownerDevice: adminDid });
assert.equal(result.status, 200);
result = await call(`/api/community/readers/${reader.id}`, { token: guestToken });
assert.equal(result.data.reviews.length, 0);

console.log("community tests passed");
