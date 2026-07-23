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
// Cố ý KHÔNG cấu hình DECRYPT_KEY: production Bói toán hiện là plaintext sau gate.
const env = { KV: new MemoryKV(), SESSION_SECRET: secret, ADMIN_TOKEN: "admin-pass" };
function b64url(input) { return Buffer.from(input).toString("base64url"); }
function jwt(payload, ttl = 3600) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(JSON.stringify({ ...payload, iat: now, exp: now + ttl }));
  const sig = createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
}
async function call(path, { method = "GET", token = "", body, admin = false, device = "" } = {}) {
  const headers = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  if (token) headers.authorization = `Bearer ${token}`;
  if (admin) headers.authorization = `Bearer ${env.ADMIN_TOKEN}`;
  if (device) headers["x-owner-device-id"] = device;
  const request = new Request(`https://worker.test${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const response = await handleCommunity(request, env);
  return { status: response.status, data: await response.json() };
}

const ownerDid = randomUUID();
const guestDid = randomUUID();
const readerDid = randomUUID();
const readerSecondDevice = randomUUID();

let result = await call("/api/community/register", {
  method: "POST",
  body: { entry: true, device_id: guestDid, device: { platform: "iPhone" }, role: "guest", username: "v2_guest", password: "password-guest", display_name: "Khách V2", bio: "" }
});
assert.equal(result.status, 201);
assert.ok(result.data.token, "đăng ký Khách phải có community token");
assert.ok(result.data.gate_token, "đăng ký Khách phải có gate token");
assert.equal(result.data.key, undefined, "plaintext không cần trả khóa giải mã");
const guestToken = result.data.token;
const guestId = result.data.profile.id;

result = await call("/api/community/register", {
  method: "POST",
  body: { entry: true, device_id: readerDid, device: { platform: "Android", screen: "412x915" }, role: "reader", username: "v2_reader", password: "password-reader", display_name: "Reader V2", bio: "", specialties: "Tarot" }
});
assert.equal(result.status, 201, "Reader phải đăng ký được trên public entry không có DECRYPT_KEY");
assert.ok(result.data.token);
assert.ok(result.data.gate_token);
assert.equal(result.data.profile.role, "reader");
assert.equal(result.data.key, undefined);
const readerId = result.data.profile.id;

result = await call("/api/community/login", {
  method: "POST",
  body: { entry: true, device_id: readerSecondDevice, device: { platform: "iPad", screen: "1024x1366" }, username: "v2_reader", password: "password-reader" }
});
assert.equal(result.status, 200, "Reader phải đăng nhập được từ một thiết bị/nền tảng khác");
assert.ok(result.data.token);
assert.ok(result.data.gate_token);
assert.equal(result.data.profile.id, readerId);
assert.equal(result.data.profile.role, "reader");

result = await call("/api/community/admin/bind-owner-device", { method: "POST", admin: true, device: ownerDid, body: { device_id: ownerDid, replace: true } });
assert.equal(result.status, 200);
result = await call("/api/community/admin/bind-owner-device", { method: "POST", admin: true, device: ownerDid, body: { device_id: randomUUID(), replace: true } });
assert.equal(result.status, 200, "Admin hợp lệ được chuyển thiết bị Admin tổng có audit");
result = await call("/api/community/admin/bind-owner-device", { method: "POST", admin: true, device: ownerDid, body: { device_id: ownerDid, replace: true } });
assert.equal(result.status, 200);

result = await call("/api/community/admin/posts", { method: "POST", admin: true, device: ownerDid, body: { title: "Chủ đề chung", text: "Mọi member cùng trao đổi." } });
assert.equal(result.status, 201);
const postId = result.data.post.id;
result = await call("/api/community/posts", { token: guestToken });
assert.equal(result.status, 200);
assert.equal(result.data.posts.length, 1);
result = await call(`/api/community/posts/${postId}/comments`, { method: "POST", token: guestToken, body: { text: "Bình luận đầu tiên" } });
assert.equal(result.status, 201);

result = await call(`/api/community/admin/users/${guestId}/impersonate`, { method: "POST", admin: true, device: ownerDid });
assert.equal(result.status, 200);
assert.equal(result.data.view_only, true);
const impersonationToken = result.data.token;
result = await call(`/api/community/posts/${postId}/comments`, { method: "POST", token: impersonationToken, body: { text: "Không được đăng dưới danh nghĩa member" } });
assert.equal(result.status, 403);
assert.equal(result.data.error, "read_only_impersonation");

result = await call(`/api/community/readers/${readerId}/reviews`, { method: "POST", token: guestToken, body: { rating: 5, text: "Đánh giá thử" } });
assert.equal(result.status, 201);
result = await call(`/api/community/admin/reviews/${readerId}/${guestId}`, { method: "DELETE", admin: true, device: ownerDid });
assert.equal(result.status, 200);

result = await call(`/api/community/admin/users/${guestId}`, { method: "DELETE", admin: true, device: ownerDid });
assert.equal(result.status, 200);
result = await call("/api/community/login", { method: "POST", body: { entry: true, device_id: guestDid, username: "v2_guest", password: "password-guest" } });
assert.equal(result.status, 401);
assert.equal(result.data.error, "invalid_login");

const audits = await env.KV.list({ prefix: "community-audit:" });
assert.ok(audits.keys.length >= 5, "các thao tác Admin nhạy cảm phải có audit");
console.log("Account V3 backend tests PASS");
