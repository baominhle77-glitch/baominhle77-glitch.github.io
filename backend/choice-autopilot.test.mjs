import test from "node:test";
import assert from "node:assert/strict";
import {
  runChoiceAutopilot,
  handleChoiceAutopilotRequest,
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

function candidate(id, title, units = 1000, rate = 2500) {
  return {
    id,
    title,
    detail_link: `https://shop.tiktok.com/view/product/${id}?region=VN`,
    main_image_url: `https://p16-oec-va.ibyteimg.com/${id}.jpg`,
    has_inventory: true,
    units_sold: units,
    sale_region: "VN",
    shop: { name: `Shop ${id}` },
    original_price: { currency: "VND", minimum_amount: "500000", maximum_amount: "550000" },
    sales_price: { currency: "VND", minimum_amount: "400000", maximum_amount: "450000" },
    commission: { currency: "VND", amount: "50000", rate }
  };
}

function mockFetch() {
  return async (url, options = {}) => {
    const target = new URL(url);
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
    if (target.pathname.endsWith("/create_link")) {
      const body = JSON.parse(options.body);
      return response({
        status: true,
        data: {
          aff_short_url: `https://go.isclix.com/deep_link/test/${body.product_id}`,
          aff_url: ""
        }
      });
    }
    if (target.pathname === "/v2/tiktokshop_product_feeds") {
      const keyword = target.searchParams.get("title_keywords") || "micro";
      const base = keyword.replace(/\s+/g, "-");
      return response({
        status: true,
        data: {
          products: Array.from({ length: 8 }, (_, index) =>
            candidate(`${base}-${index + 1}`, `${keyword} loại ${index + 1}`, 5000 - index * 100, 2800 - index * 50)
          )
        }
      });
    }
    return response({ error: "not_found" }, 404);
  };
}

test("mã hóa credential và giải mã đúng", async () => {
  const env = makeEnv();
  const encrypted = await __test.encryptCredential(env, "abc-token-12345678901234567890");
  assert.doesNotMatch(encrypted, /abc-token/);
  assert.equal(await __test.decryptCredential(env, encrypted), "abc-token-12345678901234567890");
});

test("lọc sản phẩm nguy cơ và chuẩn hóa ứng viên", () => {
  const portfolio = __test.PORTFOLIO[0];
  assert.equal(__test.blockedTitle("Viên uống giảm cân cấp tốc"), true);
  assert.equal(__test.normalizeCandidate(candidate("1", "Viên uống giảm cân"), portfolio, "tarot"), null);
  const item = __test.normalizeCandidate(candidate("2", "Bộ bài tarot nghệ thuật"), portfolio, "bài tarot");
  assert.equal(item.category, "tarot");
  assert.ok(item.opportunity_score >= 50);
  assert.equal(item.discount_percent, 20);
});

test("thiếu AccessTrade token chuyển sang onboarding, không giả hoàn tất", async () => {
  const env = makeEnv(false);
  const result = await runChoiceAutopilot(env, { trigger: "cron", fetchImpl: mockFetch() });
  assert.equal(result.ok, false);
  assert.equal(result.onboarding_required, true);
  const status = JSON.parse(await env.KV.get(__test.STATUS_KEY));
  assert.equal(status.mode, "onboarding_required");
  assert.equal(status.configured, false);
});

test("Autopilot tự tuyển, tạo deep link và thay catalog seed", async () => {
  const env = makeEnv(true);
  await env.KV.put(__test.STORE_KEY, JSON.stringify({
    version: 1,
    products: [
      { id: "rider-waite-smith-tarot", name: "Seed cũ" },
      { id: "manual-safe", name: "Sản phẩm biên tập", category: "creator", summary: "Giữ lại", published: true }
    ]
  }));
  const result = await runChoiceAutopilot(env, { trigger: "cron", fetchImpl: mockFetch() });
  assert.equal(result.ok, true);
  assert.equal(result.status.mode, "active");
  assert.equal(result.status.selected_products, 18);
  const catalog = JSON.parse(await env.KV.get(__test.STORE_KEY));
  assert.equal(catalog.version, 2);
  assert.equal(catalog.products.some((item) => item.id === "rider-waite-smith-tarot"), false);
  assert.equal(catalog.products.some((item) => item.id === "manual-safe"), true);
  const generated = catalog.products.filter((item) => item.autopilot_managed);
  assert.equal(generated.length, 18);
  assert.ok(generated.every((item) => item.affiliate_url.startsWith("https://go.isclix.com/")));
  assert.ok(generated.every((item) => item.last_verified_at));
});

test("status API chỉ trả trạng thái vận hành, không lộ credential", async () => {
  const env = makeEnv(true);
  await env.KV.put(__test.STATUS_KEY, JSON.stringify({
    mode: "active",
    configured: true,
    selected_products: 18,
    catalog_products: 18,
    orders_7d: 2,
    commission_7d: 100000,
    last_run_at: "2026-07-24T14:00:00Z"
  }));
  const res = await handleChoiceAutopilotRequest(
    new Request("https://worker.example/api/choice/autopilot/status"),
    env
  );
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.mode, "active");
  assert.equal(data.selected_products, 18);
  assert.equal(data.commission_7d, undefined);
  assert.equal(JSON.stringify(data).includes("token"), false);
});
