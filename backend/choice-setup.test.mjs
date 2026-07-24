import test from "node:test";
import assert from "node:assert/strict";
import {
  handleChoiceSetupRequest,
  handleChoiceSetupTelegram,
  __test
} from "./choice-setup.js";

class MockKV {
  constructor() { this.map = new Map(); }
  async get(key) { return this.map.has(key) ? this.map.get(key) : null; }
  async put(key, value) { this.map.set(key, String(value)); }
  async delete(key) { this.map.delete(key); }
}

function env(extra = {}) {
  return {
    KV: new MockKV(),
    SESSION_SECRET: "s".repeat(64),
    TELEGRAM_CHAT_ID: "123",
    ...extra
  };
}

function cookieFrom(response) {
  const value = response.headers.get("set-cookie") || "";
  return value.split(";", 1)[0];
}

test("route setup không có phiên trả 401 và noindex", async () => {
  const response = await handleChoiceSetupRequest(
    new Request(__test.SETUP_URL),
    env()
  );
  assert.equal(response.status, 401);
  assert.match(response.headers.get("x-robots-tag") || "", /noindex/);
  assert.match(response.headers.get("cache-control") || "", /no-store/);
  assert.match(response.headers.get("x-frame-options") || "", /DENY/);
});

test("vé setup chỉ dùng một lần và đổi thành cookie bảo mật", async () => {
  const state = env();
  const ticketUrl = await __test.createOwnerTicket(state);
  const first = await handleChoiceSetupRequest(new Request(ticketUrl), state);
  assert.equal(first.status, 303);
  const setCookie = first.headers.get("set-cookie") || "";
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /Secure/);
  assert.match(setCookie, /SameSite=Strict/);

  const second = await handleChoiceSetupRequest(new Request(ticketUrl), state);
  assert.equal(second.status, 401);

  const dashboard = await handleChoiceSetupRequest(new Request(__test.SETUP_URL, {
    headers: { cookie: cookieFrom(first) }
  }), state);
  assert.equal(dashboard.status, 200);
  const html = await dashboard.text();
  assert.match(html, /Trung tâm kết nối/);
  assert.match(html, /workspace\.accesstrade\.vn\/authentication\/register/);
  assert.match(html, /pub2\.accesstrade\.vn\/profile\/payment/);
  assert.match(html, /search\.google\.com\/search-console/);
  assert.match(html, /bing\.com\/webmasters/);
  assert.match(html, /business\.pinterest\.com/);
  assert.match(html, /200\.000đ/);
  assert.doesNotMatch(html, /s{32,}/);
});

test("trạng thái chỉ trả boolean và số lượng, không trả credential", async () => {
  const state = env({ ACCESSTRADE_API_TOKEN: "secret-token-value-that-must-never-render" });
  await state.KV.put("choice:catalog:v1", JSON.stringify({ products: [{ id: "a" }, { id: "b" }] }));
  const status = await __test.readSetupStatus(state);
  assert.deepEqual(status, { credential_connected: true, catalog_products: 2 });
  const html = __test.setupHtml(status);
  assert.match(html, /Đã kết nối API/);
  assert.doesNotMatch(html, /secret-token-value/);
});

test("Telegram chỉ đúng owner mới nhận link setup", async () => {
  const state = env();
  const wrong = await handleChoiceSetupTelegram({
    message: { text: "/ketnoi", chat: { id: 999 }, from: { id: 999 } }
  }, state);
  assert.equal(wrong, null);

  const right = await handleChoiceSetupTelegram({
    message: { text: "/ketnoi", chat: { id: 123 }, from: { id: 123 } }
  }, state);
  assert.equal(right?.handled, true);
  assert.equal(right.calls.length, 1);
  assert.match(right.calls[0].body.text, /owner\/choice\/setup\?ticket=/);
  assert.doesNotMatch(right.calls[0].body.text, /ACCESSTRADE_API_TOKEN/);
});

test("logout thu hồi phiên và xóa cookie", async () => {
  const state = env();
  const ticketUrl = await __test.createOwnerTicket(state);
  const login = await handleChoiceSetupRequest(new Request(ticketUrl), state);
  const cookie = cookieFrom(login);
  const logout = await handleChoiceSetupRequest(new Request(`${__test.SETUP_URL}/logout`, {
    method: "POST",
    headers: { cookie }
  }), state);
  assert.equal(logout.status, 303);
  assert.match(logout.headers.get("set-cookie") || "", /Max-Age=0/);

  const after = await handleChoiceSetupRequest(new Request(__test.SETUP_URL, { headers: { cookie } }), state);
  assert.equal(after.status, 401);
});
