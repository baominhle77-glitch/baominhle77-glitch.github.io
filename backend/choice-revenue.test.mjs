import test from "node:test";
import assert from "node:assert/strict";
import {
  syncChoiceRevenue,
  handleChoiceRevenueRequest,
  handleChoiceRevenueTelegram,
  __test
} from "./choice-revenue.js";

class MockKV {
  constructor() { this.map = new Map(); }
  async get(key) { return this.map.has(key) ? this.map.get(key) : null; }
  async put(key, value) { this.map.set(key, String(value)); }
  async delete(key) { this.map.delete(key); }
  async list({ prefix = "", cursor = undefined, limit = 1000 } = {}) {
    const keys = [...this.map.keys()].filter((key) => key.startsWith(prefix)).sort();
    const start = cursor ? Number(cursor) : 0;
    const slice = keys.slice(start, start + limit);
    const next = start + slice.length;
    return {
      keys: slice.map((name) => ({ name })),
      list_complete: next >= keys.length,
      cursor: next >= keys.length ? undefined : String(next)
    };
  }
}

function env(extra = {}) {
  return {
    KV: new MockKV(),
    SESSION_SECRET: "r".repeat(64),
    TELEGRAM_CHAT_ID: "123",
    ...extra
  };
}

function todayIso() {
  return new Date().toISOString();
}

test("chuẩn hóa order và transaction không giữ dữ liệu khách hàng", () => {
  const order = __test.normalizeOrder({
    order_id: "A-1",
    merchant: "shop",
    sales_time: todayIso(),
    billing: 500000,
    pub_commission: 50000,
    order_approved: 1,
    email: "hidden@example.com"
  });
  assert.equal(order.status, "approved");
  assert.equal(order.billing, 500000);
  assert.equal(order.email, undefined);

  const transaction = __test.normalizeTransaction({
    transaction_id: "TX-1",
    transaction_time: todayIso(),
    status: 0,
    commission: 25000,
    product_name: "Micro thử nghiệm",
    customer_phone: "0900000000"
  });
  assert.equal(transaction.status, "pending");
  assert.equal(transaction.customer_phone, undefined);
});

test("snapshot tính doanh số, hoa hồng, click, EPC và sản phẩm", () => {
  const now = todayIso();
  const date = __test.vnDate(now);
  const orders = [__test.normalizeOrder({
    order_id: "A-1",
    merchant: "shop",
    sales_time: now,
    billing: 500000,
    pub_commission: 50000,
    order_pending: 1,
    utm_campaign: "creator-july"
  })];
  const transactions = [__test.normalizeTransaction({
    transaction_id: "A-1",
    transaction_time: now,
    status: 0,
    transaction_value: 500000,
    commission: 50000,
    product_name: "Micro thử nghiệm",
    utm_content: "source-1"
  })];
  const catalog = {
    count: 1,
    bySource: new Map([["source-1", { id: "micro-thu-nghiem", name: "Micro thử nghiệm", source_id: "source-1" }]]),
    byId: new Map([["micro-thu-nghiem", { id: "micro-thu-nghiem", name: "Micro thử nghiệm", source_id: "source-1" }]])
  };
  const snapshot = __test.buildSnapshot(orders, transactions, [{ date, product_id: "micro-thu-nghiem", clicks: 10 }], catalog, "worker_secret");
  assert.equal(snapshot.ranges.today.orders, 1);
  assert.equal(snapshot.ranges.today.sales, 500000);
  assert.equal(snapshot.ranges.today.commission, 50000);
  assert.equal(snapshot.ranges.today.clicks, 10);
  assert.equal(snapshot.ranges.today.epc, 5000);
  assert.equal(snapshot.top_products[0].key, "Micro thử nghiệm");
  assert.equal(snapshot.top_products[0].clicks, 10);
});

test("đồng bộ gần thời gian thực từ order-list và transactions", async () => {
  const e = env({ ACCESSTRADE_API_TOKEN: "token-valid-12345678901234567890" });
  const now = todayIso();
  const date = __test.vnDate(now);
  await e.KV.put("choice:click-day:" + date + ":goi-y-creator-source-1", "12");
  await e.KV.put("choice:catalog:v1", JSON.stringify({ products: [{
    id: "goi-y-creator-source-1",
    name: "Micro thử nghiệm",
    category: "creator",
    source_product_id: "source-1"
  }] }));
  const fetchImpl = async (url) => {
    if (String(url).includes("/v1/order-list")) return new Response(JSON.stringify({ data: [{
      order_id: "ORDER-1",
      merchant: "shop",
      sales_time: now,
      billing: 700000,
      pub_commission: 70000,
      order_pending: 1,
      products_count: 1,
      utm_source: "hoi-chon-dung",
      utm_campaign: "creator-test"
    }] }), { status: 200, headers: { "content-type": "application/json" } });
    if (String(url).includes("/v1/transactions")) return new Response(JSON.stringify({ data: [{
      transaction_id: "ORDER-1",
      merchant: "shop",
      transaction_time: now,
      status: 0,
      transaction_value: 700000,
      commission: 70000,
      product_name: "Micro thử nghiệm",
      utm_source: "hoi-chon-dung",
      utm_content: "source-1"
    }] }), { status: 200, headers: { "content-type": "application/json" } });
    throw new Error("unexpected_url:" + url);
  };
  const snapshot = await syncChoiceRevenue(e, { force: true, fetchImpl });
  assert.equal(snapshot.connected, true);
  assert.equal(snapshot.ranges.today.orders, 1);
  assert.equal(snapshot.ranges.today.clicks, 12);
  assert.equal(snapshot.ranges.today.commission, 70000);
  assert.equal(JSON.parse(await e.KV.get(__test.SNAPSHOT_KEY)).ranges.today.sales, 700000);
});

test("thiếu credential giữ dashboard riêng ở trạng thái cần kết nối", async () => {
  const e = env();
  const snapshot = await syncChoiceRevenue(e, { force: true });
  assert.equal(snapshot.connected, false);
  assert.equal(snapshot.alerts[0].code, "connect_affiliate");
});

test("ticket một lần đổi thành cookie HttpOnly và bảo vệ dashboard", async () => {
  const e = env();
  const link = await __test.createOwnerTicket(e);
  const token = new URL(link).searchParams.get("ticket");
  const exchange = await handleChoiceRevenueRequest(new Request(`https://worker.example/owner/choice/revenue?ticket=${encodeURIComponent(token)}`), e);
  assert.equal(exchange.status, 303);
  const setCookie = exchange.headers.get("set-cookie");
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /SameSite=Strict/);
  const cookie = setCookie.split(";")[0];

  const dashboard = await handleChoiceRevenueRequest(new Request("https://worker.example/owner/choice/revenue", { headers: { cookie } }), e);
  assert.equal(dashboard.status, 200);
  assert.match(dashboard.headers.get("x-robots-tag"), /noindex/);
  assert.match(await dashboard.text(), /Doanh thu & hiệu quả/);

  const reused = await handleChoiceRevenueRequest(new Request(`https://worker.example/owner/choice/revenue?ticket=${encodeURIComponent(token)}`), e);
  assert.equal(reused.status, 401);

  const unauthenticated = await handleChoiceRevenueRequest(new Request("https://worker.example/owner/choice/revenue"), e);
  assert.equal(unauthenticated.status, 401);
});

test("Telegram chỉ cấp dashboard cho đúng owner", async () => {
  const e = env();
  const outsider = await handleChoiceRevenueTelegram({ message: { chat: { id: 999 }, from: { id: 999 }, text: "/doanhthu" } }, e);
  assert.equal(outsider, null);

  const owner = await handleChoiceRevenueTelegram({ message: { chat: { id: 123 }, from: { id: 123 }, text: "/doanhthu" } }, e);
  assert.equal(owner.handled, true);
  assert.match(owner.calls[0].body.text, /dashboard riêng/);
  assert.match(owner.calls[0].body.text, /\/owner\/choice\/revenue\?ticket=/);
});

test("dashboard dùng endpoint tuyệt đối và không tải tài nguyên bên thứ ba", async () => {
  const source = await (await import("node:fs/promises")).readFile(new URL("./choice-revenue.js", import.meta.url), "utf8");
  assert.match(source, /\/owner\/choice\/revenue\/api\/summary/);
  assert.match(source, /\/owner\/choice\/revenue\/api\/refresh/);
  assert.match(source, /\/owner\/choice\/revenue\/logout/);
  assert.doesNotMatch(source, /fetch\(force\?'\.\/api\//);
  assert.doesNotMatch(source, /<script[^>]+src=/);
});
