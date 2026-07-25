import test from "node:test";
import assert from "node:assert/strict";
import { handleChoiceRequest, handleChoiceTelegramUpdate, __test } from "./choice.js";

class MockKV {
  constructor() { this.map = new Map(); }
  async get(key) { return this.map.has(key) ? this.map.get(key) : null; }
  async put(key, value) { this.map.set(key, String(value)); }
  async delete(key) { this.map.delete(key); }
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

function validProduct(overrides = {}) {
  return {
    id: "rider-waite-smith-tarot",
    name: "Bộ bài Rider Waite Smith Tarot",
    category: "tarot",
    marketplace: "shopee",
    comparison_key: "rider-waite-smith-tarot",
    visual: "✦",
    summary: "Bộ bài Tarot phổ biến cho người mới.",
    price_min: 150000,
    price_max: 180000,
    currency: "VND",
    best_for: ["Người mới học Tarot"],
    avoid_if: ["Cần kiểm tra kích thước lá"],
    pros: ["Dễ tìm tài liệu"],
    cons: ["Nhiều phiên bản in"],
    tags: ["tarot"],
    priorities: ["de-dung"],
    merchant: "Shopee Shop A",
    merchant_url: "https://shopee.vn/product/123/456",
    affiliate_url: "https://go.isclix.com/deep_link/123456?url=https%3A%2F%2Fshopee.vn%2Fproduct%2F123%2F456&utm_source=hoi-chon-dung",
    featured: true,
    published: true,
    votes_base: 12,
    ...overrides
  };
}

async function seedValid(e, products = [validProduct()]) {
  await __test.writeDocument(e, products);
}

test("URL chỉ nhận https và không nhận credential", () => {
  assert.equal(__test.normalizeUrl("http://example.com"), "");
  assert.equal(__test.normalizeUrl("https://user:pass@example.com"), "");
  assert.equal(__test.normalizeUrl("https://example.com/a"), "https://example.com/a");
});

test("API không lộ link đích và chỉ trả outbound nội bộ", async () => {
  const e = env();
  await seedValid(e);
  const response = await handleChoiceRequest(request("/api/choice/products"), e);
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.products.length, 1);
  assert.equal(data.products[0].affiliate_url, undefined);
  assert.equal(data.products[0].merchant_url, undefined);
  assert.match(data.products[0].outbound_path || "", /^\/r\/choice\//);
  assert.equal(data.products[0].marketplace, "shopee");
});

test("bình chọn được khử trùng trong cùng ngày", async () => {
  const e = env();
  await seedValid(e);
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
  await seedValid(e);
  const first = await handleChoiceRequest(request("/r/choice/rider-waite-smith-tarot"), e);
  assert.equal(first.status, 302);
  assert.match(first.headers.get("location"), /^https:\/\/go\.isclix\.com\/deep_link\//);
  const second = await handleChoiceRequest(request("/r/choice/rider-waite-smith-tarot"), e);
  assert.equal(second.status, 302);
  assert.equal(await e.KV.get("choice:click-total:rider-waite-smith-tarot"), "1");
});

test("Telegram chỉ cho owner và có thể thêm sản phẩm sàn Việt Nam", async () => {
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
        "Nơi bán: Lazada Shop Test",
        "Link tham khảo: https://www.lazada.vn/products/san-pham-test-i123.html",
        "Link affiliate: https://go.isclix.com/deep_link/123456?url=https%3A%2F%2Fwww.lazada.vn%2Fproducts%2Fsan-pham-test-i123.html&utm_source=hoi-chon-dung"
      ].join("\n")
    }
  };
  const result = await handleChoiceTelegramUpdate(update, e);
  assert.equal(result.handled, true);
  const document = await __test.readDocument(e);
  assert.ok(document.products.some((item) => item.id === "san-pham-test" && item.affiliate_url && item.link_ready));
});

test("lọc theo danh mục", async () => {
  const e = env();
  await seedValid(e, [
    validProduct(),
    validProduct({
      id: "filament-pla-test",
      name: "Filament PLA 1.75mm",
      category: "3d",
      comparison_key: "filament-pla-175mm",
      marketplace: "lazada",
      merchant: "Lazada Shop 3D",
      merchant_url: "https://www.lazada.vn/products/filament-pla-i999.html",
      affiliate_url: "https://go.isclix.com/deep_link/123456?url=https%3A%2F%2Fwww.lazada.vn%2Fproducts%2Ffilament-pla-i999.html&utm_source=hoi-chon-dung"
    })
  ]);
  const response = await handleChoiceRequest(request("/api/choice/products?category=3d"), e);
  const data = await response.json();
  assert.equal(data.products.length, 1);
  assert.ok(data.products.every((item) => item.category === "3d"));
});
