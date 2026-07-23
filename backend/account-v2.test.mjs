import assert from "node:assert/strict";
import { randomBytes, randomUUID, pbkdf2Sync } from "node:crypto";
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
const regularAdminPassword = "test-regular-admin";
const primaryAdminPassword = "test-primary-admin";
const adminSalt = randomBytes(16);
const legacyAdminSalt = randomBytes(16);
const adminIterations = 1500;
const adminHash = (password) => pbkdf2Sync(password, adminSalt, adminIterations, 32, "sha256").toString("base64");
const legacyHash = (password) => pbkdf2Sync(password, legacyAdminSalt, 900, 32, "sha256").toString("base64");
const env = {
  KV: new MemoryKV(), SESSION_SECRET: secret, ADMIN_TOKEN: "legacy-admin-token-must-not-work",
  // Cố ý để lại cấu hình V5/V6 sai. Account V8 phải bỏ qua hoàn toàn các biến này.
  ADMIN_PASSWORD_SALT_B64: legacyAdminSalt.toString("base64"),
  ADMIN_REGULAR_PASSWORD_HASH_B64: legacyHash("legacy-regular-admin"),
  ADMIN_PRIMARY_PASSWORD_HASH_B64: legacyHash("legacy-primary-admin"),
  ADMIN_PASSWORD_ITERATIONS: "900",
  ADMIN_V8_PASSWORD_SALT_B64: adminSalt.toString("base64"),
  ADMIN_V8_REGULAR_PASSWORD_HASH_B64: adminHash(regularAdminPassword),
  ADMIN_V8_PRIMARY_PASSWORD_HASH_B64: adminHash(primaryAdminPassword),
  ADMIN_V8_PASSWORD_ITERATIONS: String(adminIterations),
  DECRYPT_KEY_BOITOAN: "test-boitoan-decrypt-key",
  PUBLIC_RATE_LIMITER: { async limit() { throw new Error("simulated_binding_failure"); } },
};
async function call(path, { method = "GET", token = "", body, device = "" } = {}) {
  const headers = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  if (token) headers.authorization = `Bearer ${token}`;
  if (device) headers["x-owner-device-id"] = device;
  const request = new Request(`https://worker.test${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const response = await handleCommunity(request, env);
  return { status: response.status, data: await response.json() };
}

const regularDid = randomUUID();
const primaryDid1 = randomUUID();
const primaryDid2 = randomUUID();
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
assert.equal(result.data.key, env.DECRYPT_KEY_BOITOAN);
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
assert.equal(result.data.key, env.DECRYPT_KEY_BOITOAN);
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

result = await call("/api/community/admin/login", { method: "POST", device: regularDid, body: { password: "wrong-password", device_id: regularDid, remember: true } });
assert.equal(result.status, 401);
assert.equal(result.data.error, "invalid_admin_login");

result = await call("/api/community/admin/users", { token: env.ADMIN_TOKEN, device: regularDid });
assert.equal(result.status, 401, "ADMIN_TOKEN cũ không được cấp quyền công khai nữa");

result = await call("/api/community/admin/login", { method: "POST", device: regularDid, body: { password: regularAdminPassword, device_id: regularDid, remember: true } });
assert.equal(result.status, 200, "mật khẩu Admin thường phải hoạt động dù Cloudflare còn cấu hình salt/hash V5-V6 cũ");
assert.ok(result.data.token);
assert.equal(result.data.level, "regular");
assert.equal(result.data.primary, false);
assert.equal(result.data.key, env.DECRYPT_KEY_BOITOAN);
assert.equal(await env.KV.get("community-owner-device"), null, "Admin thường không được chiếm thiết bị Admin tổng");
const regularAdminToken = result.data.token;

result = await call("/api/community/admin/session", { token: regularAdminToken, device: regularDid });
assert.equal(result.status, 200);
assert.equal(result.data.level, "regular");
assert.equal(result.data.primary, false);
assert.equal(result.data.key, env.DECRYPT_KEY_BOITOAN);
result = await call("/api/community/admin/users", { token: regularAdminToken, device: regularDid });
assert.equal(result.status, 200, "Admin thường được quản lý tài khoản");
result = await call("/api/community/admin/users", { token: regularAdminToken, device: randomUUID() });
assert.equal(result.status, 401, "JWT Admin phải gắn đúng thiết bị");
result = await call(`/api/community/admin/users/${guestId}/impersonate`, { method: "POST", token: regularAdminToken, device: regularDid });
assert.equal(result.status, 403, "Admin thường không được mở trang cá nhân dưới giao diện member");
assert.equal(result.data.error, "owner_device_required");
result = await call("/api/community/admin/conversations", { token: regularAdminToken, device: regularDid });
assert.equal(result.status, 403, "Admin thường không được đọc hội thoại riêng");
assert.equal(result.data.error, "owner_device_required");

result = await call("/api/community/admin/login", { method: "POST", device: primaryDid1, body: { password: primaryAdminPassword, device_id: primaryDid1, remember: true } });
assert.equal(result.status, 200, "mật khẩu Admin tổng phải hoạt động dù Cloudflare còn cấu hình salt/hash V5-V6 cũ");
assert.equal(result.data.level, "primary");
assert.equal(result.data.primary, true);
assert.equal(result.data.key, env.DECRYPT_KEY_BOITOAN);
assert.equal(await env.KV.get("community-owner-device"), primaryDid1);
const firstPrimaryToken = result.data.token;

result = await call("/api/community/admin/session", { token: firstPrimaryToken, device: primaryDid1 });
assert.equal(result.status, 200);
assert.equal(result.data.level, "primary");
assert.equal(result.data.primary, true);
assert.equal(result.data.key, env.DECRYPT_KEY_BOITOAN);

result = await call("/api/community/admin/login", { method: "POST", device: primaryDid2, body: { password: primaryAdminPassword, device_id: primaryDid2, remember: true } });
assert.equal(result.status, 200, "đăng nhập Admin tổng trên thiết bị mới phải chuyển quyền duy nhất");
assert.equal(result.data.primary, true);
assert.equal(result.data.key, env.DECRYPT_KEY_BOITOAN);
assert.equal(await env.KV.get("community-owner-device"), primaryDid2);
const primaryAdminToken = result.data.token;
result = await call("/api/community/admin/users", { token: firstPrimaryToken, device: primaryDid1 });
assert.equal(result.status, 401, "phiên Admin tổng cũ phải bị thu hồi");
result = await call("/api/community/admin/users", { token: regularAdminToken, device: regularDid });
assert.equal(result.status, 200, "chuyển thiết bị Admin tổng không được thu hồi Admin thường");

result = await call("/api/community/conversations", { method: "POST", token: guestToken, body: { reader_id: readerId } });
assert.equal(result.status, 201);
const conversationId = result.data.conversation.id;
result = await call(`/api/community/conversations/${conversationId}/messages`, { method: "POST", token: guestToken, body: { text: "Tin nhắn kiểm thử riêng tư", client_id: randomUUID() } });
assert.equal(result.status, 201);
result = await call("/api/community/admin/conversations", { token: primaryAdminToken, device: primaryDid2 });
assert.equal(result.status, 200, "Admin tổng được xem danh sách hội thoại");
result = await call(`/api/community/admin/conversations/${conversationId}/messages`, { token: primaryAdminToken, device: primaryDid2 });
assert.equal(result.status, 200, "Admin tổng được xem nội dung hội thoại");
assert.equal(result.data.messages.length, 1);

result = await call("/api/community/admin/posts", { method: "POST", token: regularAdminToken, device: regularDid, body: { title: "Chủ đề chung", text: "Mọi member cùng trao đổi." } });
assert.equal(result.status, 201, "Admin thường được mở bài thảo luận");
const postId = result.data.post.id;
result = await call("/api/community/posts", { token: guestToken });
assert.equal(result.status, 200);
result = await call(`/api/community/posts/${postId}/comments`, { method: "POST", token: guestToken, body: { text: "Bình luận đầu tiên" } });
assert.equal(result.status, 201);

result = await call(`/api/community/admin/users/${guestId}/impersonate`, { method: "POST", token: primaryAdminToken, device: primaryDid2 });
assert.equal(result.status, 200, "Admin tổng được mở trang cá nhân member");
const impersonationToken = result.data.token;
result = await call(`/api/community/posts/${postId}/comments`, { method: "POST", token: impersonationToken, body: { text: "Không được đăng dưới danh nghĩa member" } });
assert.equal(result.status, 403);
assert.equal(result.data.error, "read_only_impersonation");
result = await call("/api/community/me", { method: "DELETE", token: impersonationToken });
assert.equal(result.status, 403, "phiên impersonation không được xóa member");

result = await call(`/api/community/readers/${readerId}/reviews`, { method: "POST", token: guestToken, body: { rating: 5, text: "Đánh giá thử" } });
assert.equal(result.status, 201);
result = await call(`/api/community/admin/reviews/${readerId}/${guestId}`, { method: "DELETE", token: regularAdminToken, device: regularDid });
assert.equal(result.status, 200, "Admin thường được xóa review");

result = await call(`/api/community/admin/users/${guestId}`, { method: "DELETE", token: regularAdminToken, device: regularDid });
assert.equal(result.status, 200, "Admin thường được xóa member");
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

result = await call("/api/community/admin/session", { method: "DELETE", token: regularAdminToken, device: regularDid });
assert.equal(result.status, 200);
result = await call("/api/community/admin/users", { token: regularAdminToken, device: regularDid });
assert.equal(result.status, 401, "đăng xuất phải thu hồi JWT Admin thường");
result = await call("/api/community/admin/session", { method: "DELETE", token: primaryAdminToken, device: primaryDid2 });
assert.equal(result.status, 200);
result = await call("/api/community/admin/users", { token: primaryAdminToken, device: primaryDid2 });
assert.equal(result.status, 401, "đăng xuất phải thu hồi JWT Admin tổng");

const audits = await env.KV.list({ prefix: "community-audit:" });
assert.ok(audits.keys.length >= 7);
console.log("Account V11 dual Admin, encrypted app key contract and edge authentication tests PASS");
