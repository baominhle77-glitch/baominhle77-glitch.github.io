import test from "node:test";
import assert from "node:assert/strict";
import { handleChoiceRequest, __test } from "./choice.js";

class MockKV {
  constructor() { this.map = new Map(); }
  async get(key) { return this.map.has(key) ? this.map.get(key) : null; }
  async put(key, value) { this.map.set(key, String(value)); }
  async delete(key) { this.map.delete(key); }
}

function envWith(products) {
  const env = { KV: new MockKV(), SESSION_SECRET: "s".repeat(64) };
  env.KV.map.set(__test.STORE_KEY, JSON.stringify({ version: 2, updated_at: new Date().toISOString(), products }));
  return env;
}

function product(overrides = {}) {
  return {
    id: "micro-boya-m1",
    name: "Micro BOYA BY-M1",
    category: "creator",
    marketplace: "shopee",
    comparison_key: "micro-boya-by-m1",
    visual: "◉",
    summary: "Micro cài áo dùng cho quay video.",
    price_min: 129000,
    price_max: 129000,
    currency: "VND",
    best_for: ["Quay video"],
    avoid_if: ["Kiểm tra cổng kết nối"],
    pros: ["Gọn"],
    cons: ["Cần kiểm tra tương thích"],
    tags: ["micro"],
    priorities: ["am-thanh"],
    merchant: "Shop A",
    merchant_url: "https://shopee.vn/product/123/456",
    affiliate_url: "https://go.isclix.com/deep_link/123456?url=https%3A%2F%2Fshopee.vn%2Fproduct%2F123%2F456&utm_source=hoi-chon-dung",
    featured: true,
    published: true,
    votes_base: 0,
    ...overrides
  };
}

test("chặn sản phẩm ngoài sàn Việt Nam trước khi chuyển hướng", async () => {
  const env = envWith([product({
    id: "fado-amazon",
    marketplace: "",
    merchant: "Fado",
    merchant_url: "https://fado.vn/us/amazon/example",
    affiliate_url: "https://go.isclix.com/deep_link/123456?url=https%3A%2F%2Ffado.vn%2Fus%2Famazon%2Fexample"
  })]);
  const response = await __test.handleRedirect(new Request("https://worker.test/r/choice/fado-amazon"), env, "fado-amazon");
  assert.equal(response.status, 410);
  assert.equal(response.headers.get("location"), null);
  assert.match(await response.text(), /Liên kết đang được thay mới/);
});

test("cho phép deeplink ACCESSTRADE có URL đích Shopee Việt Nam", async () => {
  const env = envWith([product()]);
  const response = await __test.handleRedirect(new Request("https://worker.test/r/choice/micro-boya-m1", {
    headers: { "user-agent": "Mozilla/5.0", "cf-connecting-ip": "1.2.3.4" }
  }), env, "micro-boya-m1");
  assert.equal(response.status, 302);
  assert.match(response.headers.get("location"), /^https:\/\/go\.isclix\.com\/deep_link\//);
});

test("API nhóm cùng sản phẩm ở hai nơi bán và giữ các mức giá riêng", async () => {
  const env = envWith([
    product(),
    product({
      id: "micro-boya-m1-lazada",
      marketplace: "lazada",
      merchant: "Lazada Shop B",
      merchant_url: "https://www.lazada.vn/products/micro-boya-by-m1-i123.html",
      affiliate_url: "https://go.isclix.com/deep_link/123456?url=https%3A%2F%2Fwww.lazada.vn%2Fproducts%2Fmicro-boya-by-m1-i123.html&utm_source=hoi-chon-dung",
      price_min: 115000,
      price_max: 119000,
      featured: false
    })
  ]);
  const response = await handleChoiceRequest(new Request("https://worker.test/api/choice/products"), env);
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.count, 1);
  assert.equal(data.products[0].offers.length, 2);
  assert.equal(data.products[0].price_min, 115000);
  assert.equal(data.products[0].price_max, 129000);
  assert.deepEqual(data.products[0].offers.map((item) => item.marketplace).sort(), ["lazada", "shopee"]);
  assert.ok(data.products[0].offers.every((item) => item.outbound_path.startsWith("/r/choice/")));
});

test("không tạo đa lựa chọn giả khi chỉ có cùng một người bán", async () => {
  const env = envWith([
    product(),
    product({ id: "micro-boya-m1-duplicate", price_min: 125000, price_max: 125000 })
  ]);
  const response = await handleChoiceRequest(new Request("https://worker.test/api/choice/products"), env);
  const data = await response.json();
  assert.equal(data.count, 2);
  assert.ok(data.products.every((item) => !item.offers));
});
