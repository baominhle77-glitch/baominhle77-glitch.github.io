import test from "node:test";
import assert from "node:assert/strict";
import {
  runChoiceAutopilot,
  __test
} from "./choice-autopilot.js";

class MockKV {
  constructor() { this.map = new Map(); }
  async get(key) { return this.map.has(key) ? this.map.get(key) : null; }
  async put(key, value) { this.map.set(key, String(value)); }
  async delete(key) { this.map.delete(key); }
}

function makeEnv(withToken = false) {
  return {
    KV: new MockKV(),
    SESSION_SECRET: "s".repeat(64),
    ACCESSTRADE_API_TOKEN: withToken ? "token_" + "x".repeat(40) : "",
    TELEGRAM_BOT_TOKEN: "",
    TELEGRAM_CHAT_ID: ""
  };
}

function response(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

function candidate(id, title, units = 1000, rate = 2500, price = 400000) {
  return {
    id,
    title,
    detail_link: `https://shop.tiktok.com/view/product/${id}?region=VN`,
    main_image_url: `https://p16-oec-va.ibyteimg.com/${id}.jpg`,
    has_inventory: true,
    units_sold: units,
    sale_region: "VN",
    shop: { name: `Shop ${id}` },
    original_price: { currency: "VND", minimum_amount: String(Math.round(price * 1.25)), maximum_amount: String(Math.round(price * 1.35)) },
    sales_price: { currency: "VND", minimum_amount: String(price), maximum_amount: String(Math.round(price * 1.1)) },
    commission: { currency: "VND", amount: "50000", rate }
  };
}

function mockFetch() {
  return async (url, options = {}) => {
    const target = new URL(url);
    if (target.pathname === "/v1/campaigns") return response({ total: 1, data: [{ id: "campaign-1" }] });
    if (target.pathname === "/v1/transactions") {
      return response({
        data: [{
          status: 1,
          commission: 60000,
          transaction_value: 700000,
          utm_content: "tarot-1"
        }]
      });
    }
    if (target.pathname === "/v1/datafeeds") return response({ data: [] });
    if (target.pathname.endsWith("/create_link")) {
      const body = JSON.parse(options.body);
      return response({
        status: true,
        data: {
          aff_short_url: `https://go.isclix.com/deep_link/123456?url=${encodeURIComponent(body.product_url)}&utm_source=hoi-chon-dung&utm_content=${body.product_id}`,
          aff_url: ""
        }
      });
    }
    if (target.pathname === "/v2/tiktokshop_product_feeds") {
      const keyword = target.searchParams.get("title_keywords") || "micro";
      const sort = target.searchParams.get("sort_field") || "recommended";
      const base = `${keyword}-${sort}`.replace(/\s+/g, "-");
      const prices = [120000, 350000, 1400000, 420000, 180000, 900000, 2200000, 650000];
      return response({
        status: true,
        data: {
          products: Array.from({ length: 8 }, (_, index) =>
            candidate(`${base}-${index + 1}`, `${keyword} ${sort} loại ${index + 1}`, 5000 - index * 100, 2800 - index * 50, prices[index])
          )
        }
      });
    }
    return response({ error: "not_found" }, 404);
  };
}

function datafeedFallbackFetch() {
  const marketplaceDomains = ["shopee.vn", "lazada.vn", "tiki.vn", "sendo.vn"];
  const rows = __test.PORTFOLIO.flatMap((portfolio) => Array.from({ length: 4 }, (_, index) => {
    const keyword = portfolio.keywords[0];
    const domain = marketplaceDomains[index % marketplaceDomains.length];
    const merchantUrl = domain === "shopee.vn"
      ? `https://shopee.vn/product/${portfolio.id}${index + 1}/${portfolio.id}${index + 100}`
      : domain === "lazada.vn"
        ? `https://www.lazada.vn/products/${portfolio.id}-feed-${index + 1}-i${index + 100}.html`
        : domain === "tiki.vn"
          ? `https://tiki.vn/${portfolio.id}-feed-${index + 1}-p${index + 100}.html`
          : `https://www.sendo.vn/${portfolio.id}-feed-${index + 1}-${index + 100}.html`;
    return {
      product_id: `${portfolio.id}-feed-${index + 1}`,
      sku: `${portfolio.id}-${index + 1}`,
      name: `${keyword} lựa chọn ${index + 1}`,
      cate: portfolio.id,
      desc: `Sản phẩm ${keyword} phù hợp nhu cầu phổ thông`,
      campaign: domain,
      domain,
      image: `https://cdn.example.com/${portfolio.id}-${index + 1}.jpg`,
      price: 500000 + index * 250000,
      discount: 350000 + index * 220000,
      discount_rate: 20,
      url: merchantUrl,
      aff_link: `https://go.isclix.com/deep_link/123456?url=${encodeURIComponent(merchantUrl)}`,
      update_time: "2026-07-25T00:00:00Z"
    };
  }));

  return async (url) => {
    const target = new URL(url);
    if (target.pathname === "/v1/campaigns") return response({ total: 2, data: [{ id: "general" }] });
    if (target.pathname === "/v1/transactions") return response({ data: [] });
    if (target.pathname === "/v1/datafeeds") {
      const domain = target.searchParams.get("domain");
      return response({ total: rows.length, data: rows.filter((row) => row.domain === domain) });
    }
    if (target.pathname === "/v2/tiktokshop_product_feeds") return response({ message: "not_allowed" }, 403);
    return response({ error: "not_found" }, 404);
  };
}

test("mã hóa credential và giải mã đúng", async () => {
  const env = makeEnv();
  const encrypted = await __test.encryptCredential(env, "abc-token-12345678901234567890");
  assert.doesNotMatch(encrypted, /abc-token/);
  assert.equal(await __test.decryptCredential(env, encrypted), "abc-token-12345678901234567890");
});

test("lọc sản phẩm nguy cơ và chuẩn hóa ứng viên TikTok Shop Việt Nam", () => {
  const portfolio = __test.PORTFOLIO[0];
  assert.equal(__test.blockedTitle("Viên uống giảm cân cấp tốc"), true);
  assert.equal(__test.blockedTitle("Rượu vang nhập khẩu"), true);
  assert.equal(__test.normalizeCandidate(candidate("1", "Viên uống giảm cân"), portfolio, "tarot"), null);
  const item = __test.normalizeCandidate(candidate("2", "Bộ bài tarot nghệ thuật", 5000), portfolio, "bài tarot");
  assert.equal(item.category, "tarot");
  assert.equal(item.marketplace, "tiktok-shop");
  assert.ok(item.opportunity_score >= 40);
  assert.ok(item.trend_score > 0);
  assert.equal(item.trend_label, "ban-chay");
  assert.equal(item.discount_percent, 20);
});

test("thiếu AccessTrade token chuyển sang onboarding nội bộ, không giả hoàn tất", async () => {
  const env = makeEnv(false);
  const result = await runChoiceAutopilot(env, { trigger: "cron", fetchImpl: mockFetch() });
  assert.equal(result.ok, false);
  assert.equal(result.onboarding_required, true);
  const status = JSON.parse(await env.KV.get(__test.STATUS_KEY));
  assert.equal(status.mode, "onboarding_required");
  assert.equal(status.configured, false);
});

test("Autopilot tuyển tối đa 12 lựa chọn mỗi lĩnh vực từ TikTok Shop Việt Nam", async () => {
  const env = makeEnv(true);
  await env.KV.put(__test.STORE_KEY, JSON.stringify({
    version: 1,
    products: [
      { id: "rider-waite-smith-tarot", name: "Seed cũ" },
      { id: "manual-safe", name: "Sản phẩm biên tập", category: "creator", summary: "Giữ lại", published: true }
    ]
  }));
  const result = await runChoiceAutopilot(env, { trigger: "cron", fetchImpl: mockFetch() });
  const expected = __test.PORTFOLIO.length * 12;
  assert.equal(result.ok, true);
  assert.equal(result.status.mode, "active");
  assert.equal(result.status.selected_products, expected);
  assert.equal(result.status.categories_covered, __test.PORTFOLIO.length);
  const catalog = JSON.parse(await env.KV.get(__test.STORE_KEY));
  assert.equal(catalog.version, 2);
  assert.equal(catalog.products.some((item) => item.id === "rider-waite-smith-tarot"), false);
  assert.equal(catalog.products.some((item) => item.id === "manual-safe"), true);
  const generated = catalog.products.filter((item) => item.autopilot_managed);
  assert.equal(generated.length, expected);
  assert.ok(generated.every((item) => item.marketplace === "tiktok-shop"));
  assert.ok(generated.every((item) => item.affiliate_url.startsWith("https://go.isclix.com/deep_link/")));
  assert.ok(generated.every((item) => item.affiliate_url.includes("url=https%3A%2F%2Fshop.tiktok.com")));
  assert.ok(generated.every((item) => item.last_verified_at));
  assert.ok(generated.every((item) => Number.isFinite(item.trend_score)));
});

test("Publisher key hợp lệ chạy bằng datafeed chỉ từ Shopee, Lazada, Tiki và Sendo", async () => {
  const env = makeEnv(true);
  const result = await runChoiceAutopilot(env, { trigger: "cron", fetchImpl: datafeedFallbackFetch() });
  const expected = __test.PORTFOLIO.length * 4;
  assert.equal(result.ok, true);
  assert.equal(result.status.selected_products, expected);
  assert.equal(result.status.categories_covered, __test.PORTFOLIO.length);
  const catalog = JSON.parse(await env.KV.get(__test.STORE_KEY));
  const generated = catalog.products.filter((item) => item.autopilot_managed);
  assert.equal(generated.length, expected);
  assert.ok(generated.every((item) => ["shopee", "lazada", "tiki", "sendo"].includes(item.marketplace)));
  assert.ok(generated.every((item) => item.affiliate_url.startsWith("https://go.isclix.com/deep_link/123456?url=")));
  assert.ok(generated.every((item) => !/fado|amazon|taobao|alibaba|ebay/i.test(item.merchant_url)));
  assert.ok(result.status.errors.some((item) => item.includes("tiktokshop_unavailable_using_datafeeds")));
});

test("trạng thái chỉ được đọc nội bộ từ KV, không có public handler", async () => {
  const env = makeEnv(true);
  await env.KV.put(__test.STATUS_KEY, JSON.stringify({
    mode: "active",
    configured: true,
    selected_products: 144,
    catalog_products: 144,
    orders_7d: 2,
    commission_7d: 100000,
    last_run_at: "2026-07-24T14:00:00Z"
  }));
  const data = await __test.readStatus(env);
  assert.equal(data.mode, "active");
  assert.equal(data.selected_products, 144);
  assert.equal(data.commission_7d, 100000);
});
