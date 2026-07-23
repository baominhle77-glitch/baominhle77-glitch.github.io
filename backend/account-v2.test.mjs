import assert from "node:assert/strict";
import { createHmac, randomBytes, randomUUID, pbkdf2Sync } from "node:crypto";
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
const adminPassword = "test-admin-password";
const adminSalt = randomBytes(16);
const adminIterations = 1500;
const adminHash = pbkdf2Sync(adminPassword, adminSalt, adminIterations, 32, "sha256").toString("base64");
const env = {
  KV: new MemoryKV(), SESSION_SECRET: secret, ADMIN_TOKEN: "legacy-admin-token",
  ADMIN_PASSWORD_SALT_B64: adminSalt.toString("base64"),
  ADMIN_PASSWORD_HASH_B64: adminHash,
  ADMIN_PASSWORD_ITERATIONS: String(adminIterations),
  PUBLIC_RATE_LIMITER: { async limit() { throw new Error("simulated_binding_failure"); } },
};
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
assert.equal(result.status, 201, "lỗi binding limiter best-effort không được chặn đăng ký");
assert.ok(result.data.token);
assert.ok(result.data.gate_token);
assert.equal(result.data.key, undefined);
const guestToken = result.data.token;
const guestId = result.data.profile.id;
const guestLogin = JSON.parse(await env.KV.get("community-login:v2_guest"));
assert.equal(guestLogin.password.scheme, "hmac-sha256-v1", "tài khoản mới phải dùng HMAC salt + pepper phù hợp edge");
assert.ok(guestLogin.password.salt && guestLogin.password.hash);
assert.equal(guestLogin.password.iterations, undefined);

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
const readerLoginRecord = JSON.parse(await env.KV.get("community-login:v2_reader"));
assert.equal(readerLoginRecord.password.scheme, "hmac-sha256-v1");

result = await call("/api/community/login", {
  method: "POST",
  body: { entry: true, device_id: readerSecondDevice, device: { platform: "iPad", screen: "1024x1366" }, username: "v2_reader", password: "password-reader" }
});
assert.equal(result.status, 200, "Reader phải đăng nhập được từ một thiết bị/nền tảng khác");
assert.ok(result.data.token);
assert.ok(result.data.gate_token);
assert.equal(result.data.profile.id, readerId);
assert.equal(result.data.profile.role, "reader");
const readerToken = result.data.token;

result = await call("/api/community/admin/login", { method: "POST", device: ownerDid, body: { password: "wrong-password", device_id: ownerDid, remember: true } });
assert.equal(result.status, 401);
assert.equal(result.data.error, "invalid_admin_login");
result = await call("/api/community/admin/login", { method: "POST", device: ownerDid, body: { password: adminPassword, device_id: ownerDid, remember: true } });
assert.equal(result.status, 200, "Admin phải đăng nhập một lần qua backend");
assert.ok(result.data.token);
assert.equal(result.data.primary, true);
assert.equal(result.data.device_id, ownerDid);
assert.equal(await env.KV.get("community-owner-device"), ownerDid, "thiết bị đăng nhập phải tự thành Admin tổng");
const adminToken = result.data.token;

result = await call("/api/community/admin/users", { token: adminToken, device: ownerDid });
assert.equal(result.status, 200, "JWT Admin phải tải dữ liệu mà không hỏi mật khẩu lần hai");
result = await call("/api/community/admin/users", { token: adminToken, device: randomUUID() });
assert.equal(result.status, 401, "JWT Admin phải gắn đúng thiết bị");

result = await call("/api/community/admin/posts", { method: "POST", token: adminToken, device: ownerDid, body: { title: "Chủ đề chung", text: "Mọi member cùng trao đổi." } });
assert.equal(result.status, 201);
const postId = result.data.post.id;
result = await call("/api/community/posts", { token: guestToken });
assert.equal(result.status, 200);
result = await call(`/api/community/posts/${postId}/comments`, { method: "POST", token: guestToken, body: { text: "Bình luận đầu tiên" } });
assert.equal(result.status, 201);

result = await call(`/api/community/admin/users/${guestId}/impersonate`, { method: "POST", token: adminToken, device: ownerDid });
assert.equal(result.status, 200);
const impersonationToken = result.data.token;
result = await call(`/api/community/posts/${postId}/comments`, { method: "POST", token: impersonationToken, body: { text: "Không được đăng dưới danh nghĩa member" } });
assert.equal(result.status, 403);
assert.equal(result.data.error, "read_only_impersonation");
result = await call("/api/community/me", { method: "DELETE", token: impersonationToken });
assert.equal(result.status, 403, "phiên impersonation không được xóa member");

result = await call(`/api/community/readers/${readerId}/reviews`, { method: "POST", token: guestToken, body: { rating: 5, text: "Đánh giá thử" } });
assert.equal(result.status, 201);
result = await call(`/api/community/admin/reviews/${readerId}/${guestId}`, { method: "DELETE", token: adminToken, device: ownerDid });
assert.equal(result.status, 200);

result = await call(`/api/community/admin/users/${guestId}`, { method: "DELETE", token: adminToken, device: ownerDid });
assert.equal(result.status, 200);
result = await call("/api/community/login", { method: "POST", body: { entry: true, device_id: guestDid, username: "v2_guest", password: "password-guest" } });
assert.equal(result.status, 401);
assert.equal(result.data.error, "invalid_login");

result = await call("/api/community/me", { method: "DELETE", token: readerToken });
assert.equal(result.status, 200, "Reader đã xác thực phải xóa được chính tài khoản của mình");
assert.equal(result.data.deleted, readerId);
result = await call("/api/community/login", { method: "POST", body: { entry: true, device_id: readerSecondDevice, username: "v2_reader", password: "password-reader" } });
assert.equal(result.status, 401);
assert.equal(result.data.error, "invalid_login");
assert.equal(await env.KV.get(`community-profile:${readerId}`), null);
assert.equal(await env.KV.get(`community-reader:${readerId}`), null);
for (const prefix of ["community-session:", "session:", "community-device:"]) {
  for (const key of (await env.KV.list({ prefix })).keys) {
    const value = JSON.parse(await env.KV.get(key.name));
    assert.notEqual(value.uid, readerId, `${prefix} không được giữ phiên/thiết bị Reader đã xóa`);
  }
}

result = await call("/api/community/admin/session", { method: "DELETE", token: adminToken, device: ownerDid });
assert.equal(result.status, 200);
result = await call("/api/community/admin/users", { token: adminToken, device: ownerDid });
assert.equal(result.status, 401, "đăng xuất phải thu hồi JWT Admin");

const audits = await env.KV.list({ prefix: "community-audit:" });
assert.ok(audits.keys.length >= 5);
console.log("Account V5 single Admin session and Account V4 edge authentication tests PASS");
