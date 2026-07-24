import test from "node:test";
import assert from "node:assert/strict";
import { handleChoiceRequest, handleChoiceTelegramUpdate, __test } from "./choice.js";

class MockKV {
  constructor() { this.map = new Map(); }
  async get(key) { return this.map.has(key) ? this.map.get(key) : null; }
  async put(key, value) { this.map.set(key, String(value)); }
  async list({ prefix = "" } = {}) {
    return { keys: [...this.map.keys()].filter((key) => key.startsWith(prefix)).map((name) => ({ name })), list_complete: true };
  }
}

function env() {
  return { KV: new MockKV(), SESSION_SECRET: "x".repeat(40), TELEGRAM_CHAT_ID: "123" };
}

function request(path, init = {}) {
  return new Request(`https://worker.example${path}`, {
    headers: { "cf-connecting-ip": "203.0.113.9", "user-agent": "choice-test", ...(init.headers || {}) },
    ...init
  });
}

test("URL chỉ nhận https và không nhận credential", () => {
  assert.equal(__test.normalizeUrl("http://example.com"), "");
  assert.equal(__test.normalizeUrl("https://user:pass@example.com"), "");
  assert.equal(__test.normalizeUrl("https://example.com/a"), "https://example.com/a");
});

test("khởi tạo catalog seed và API không lộ link đích", async () => {
  const e = env();
  const response = await handleChoiceRequest(request("/api/choice/products"), e);
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.ok(data.products.length >= 12);
  assert.equal(data.products[0].affiliate_url, undefined);
  assert.equal(data.products[0].merchant_url, undefined);
  assert.match(data.products[0].outbound_path || "", /^\/r\/choice\//);
});

test("bình chọn được khử trùng trong cùng ngày", async () => {
  const e = env();
  await handleChoiceRequest(request("/api/choice/products"), e);
  const makeVote = () => request("/api/choice/vote", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ product_id: "rider-waite-smith-tarot" })
  });
  const first = await handleChoiceRequest(makeVote(), e);
  const firstData = await first.json();
  assert.equal(firstData.duplicate, false);
  const second = await handleChoiceRequest(makeVote(), e);
  const secondData = await second.json();
  assert.equal(secondData.duplicate, true);
  assert.equal(secondData.votes, firstData.votes);
});

test("redirect theo dõi click và chống đếm lặp 5 phút", async () => {
  const e = env();
  await handleChoiceRequest(request("/api/choice/products"), e);
  const first = await handleChoiceRequest(request("/r/choice/rider-waite-smith-tarot"), e);
  assert.equal(first.status, 302);
  assert.match(first.headers.get("location"), /^https:\/\//);
  const second = await handleChoiceRequest(request("/r/choice/rider-waite-smith-tarot"), e);
  assert.equal(second.status, 302);
  assert.equal(await e.KV.get("choice:click-total:rider-waite-smith-tarot"), "1");
});

test("Telegram chỉ cho owner và có thể thêm sản phẩm", async () => {
  const e = env();
  const outsider = await handleChoiceTelegramUpdate({ message: { chat: { id: 999 }, from: { id: 999 }, text: "/dssp" } }, e);
  assert.equal(outsider, null);

  const update = {
    message: {
      chat: { id: 123 },
      from: { id: 123 },
      text: [
        "/themsp",
        "Tên: Sản phẩm test",
        "Danh mục: creator",
        "Mô tả: Dữ liệu thử nghiệm hợp lệ",
        "Giá từ: 100000",
        "Giá đến: 200000",
        "Link affiliate: https://example.com/affiliate"
      ].join("\n")
    }
  };
  const result = await handleChoiceTelegramUpdate(update, e);
  assert.equal(result.handled, true);
  const document = await __test.readDocument(e);
  assert.ok(document.products.some((item) => item.id === "san-pham-test" && item.affiliate_url));
});

test("lọc theo danh mục", async () => {
  const e = env();
  const response = await handleChoiceRequest(request("/api/choice/products?category=3d"), e);
  const data = await response.json();
  assert.ok(data.products.length > 0);
  assert.ok(data.products.every((item) => item.category === "3d"));
});
