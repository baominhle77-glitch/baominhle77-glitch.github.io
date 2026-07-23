import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { handleCommunity } from "./community.js";

class MemoryKV {
  constructor() { this.map = new Map(); }
  async get(key) { return this.map.get(key) ?? null; }
  async put(key, value) { this.map.set(key, String(value)); }
  async delete(key) { this.map.delete(key); }
  async list({ prefix = "", limit = 1000 } = {}) {
    const keys = [...this.map.keys()].filter((key) => key.startsWith(prefix)).sort().slice(0, limit).map((name) => ({ name }));
    return { keys, list_complete: true };
  }
}

const secret = "s".repeat(64);
const env = { KV: new MemoryKV(), SESSION_SECRET: secret, ADMIN_TOKEN: "admin-test" };
function b64url(input) { return Buffer.from(input).toString("base64url"); }
function jwt(payload, ttl = 3600) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(JSON.stringify({ ...payload, iat: now, exp: now + ttl }));
  const sig = createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
}
async function call(path, { method = "GET", token = "", body, admin = false, ownerDevice = "" } = {}) {
  const headers = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  if (token) headers.authorization = `Bearer ${token}`;
  if (admin) headers.authorization = `Bearer ${env.ADMIN_TOKEN}`;
  if (ownerDevice) headers["x-owner-device-id"] = ownerDevice;
  const request = new Request(`https://worker.test${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const response = await handleCommunity(request, env);
  return { status: response.status, data: await response.json() };
}

const did = randomUUID();
let result = await call("/api/community/register", {
  method: "POST",
  body: { entry: true, device_id: did, role: "guest", username: "plain_01", password: "password-plain", display_name: "Khách Plain", bio: "" }
});
assert.equal(result.status, 201, "đăng ký plaintext không được phụ thuộc DECRYPT_KEY");
assert.equal(result.data.key, "");
assert.equal(typeof result.data.gate_token, "string");
assert.equal(typeof result.data.token, "string");
const guestToken = result.data.token;
const guestId = result.data.profile.id;

result = await call("/api/community/register", {
  method: "POST",
  body: { entry: true, device_id: did, role: "guest", username: "plain_01", password: "password-plain", display_name: "Khách Plain", bio: "" }
});
assert.equal(result.status, 200, "đăng ký lại đúng mật khẩu phải khôi phục account tạo dở");
assert.equal(result.data.recovered_existing, true);

result = await call("/api/community/register", {
  method: "POST",
  body: { entry: true, device_id: did, role: "guest", username: "plain_01", password: "password-wrong", display_name: "Khách Plain", bio: "" }
});
assert.equal(result.status, 409);
assert.equal(result.data.error, "username_exists");

result = await call("/api/community/register", {
  method: "POST",
  body: { entry: true, smoke_test: true, device_id: randomUUID(), role: "guest", username: "smoke_ok", password: "password-smoke", display_name: "Smoke" }
});
assert.equal(result.status, 200);
assert.equal(result.data.onboarding_ready, true);

result = await call("/api/community/admin/posts", {
  method: "POST", admin: true, body: { title: "Chủ đề đầu tiên", text: "Mọi member cùng trao đổi." }
});
assert.equal(result.status, 201);
const postId = result.data.post.id;

result = await call("/api/community/posts", { token: guestToken });
assert.equal(result.status, 200);
assert.equal(result.data.posts.length, 1);

result = await call(`/api/community/posts/${postId}/comments`, {
  method: "POST", token: guestToken, body: { text: "Bình luận của Khách" }
});
assert.equal(result.status, 201);

const ownerDid = randomUUID();
result = await call("/api/community/admin/bind-owner-device", {
  method: "POST", admin: true, body: { device_id: ownerDid }
});
assert.equal(result.status, 200);

result = await call(`/api/community/admin/users/${guestId}/impersonate`, {
  method: "POST", admin: true, ownerDevice: randomUUID()
});
assert.equal(result.status, 403);
assert.equal(result.data.error, "owner_device_required");

result = await call(`/api/community/admin/users/${guestId}/impersonate`, {
  method: "POST", admin: true, ownerDevice: ownerDid
});
assert.equal(result.status, 200);
assert.equal(typeof result.data.token, "string");

result = await call(`/api/community/admin/users/${guestId}`, { method: "DELETE", admin: true });
assert.equal(result.status, 200);

result = await call("/api/community/login", {
  method: "POST",
  body: { entry: true, device_id: did, username: "plain_01", password: "password-plain" }
});
assert.equal(result.status, 401, "member đã xóa không được đăng nhập lại");

console.log("onboarding/admin v2 backend tests PASS");
