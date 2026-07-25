import test from "node:test";
import assert from "node:assert/strict";
import { handleChoiceCredentialBootstrapRequest, __test } from "./choice-credential-bootstrap.js";

class MockKV {
  constructor() { this.map = new Map(); }
  async get(key) { return this.map.has(key) ? this.map.get(key) : null; }
  async put(key, value) { this.map.set(key, String(value)); }
  async delete(key) { this.map.delete(key); }
}

function env() {
  return {
    KV: new MockKV(),
    SESSION_SECRET: "s".repeat(64),
    ACCESSTRADE_API_TOKEN: "",
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

function candidate(id, title, price = 400000) {
  return {
    id,
    title,
    detail_link: `https://shop.tiktok.com/view/product/${id}?region=VN`,
    main_image_url: `https://example.com/${id}.jpg`,
    has_inventory: true,
    units_sold: 5000,
    sale_region: "VN",
    shop: { name: `Shop ${id}` },
    original_price: { minimum_amount: String(Math.round(price * 1.25)), maximum_amount: String(Math.round(price * 1.3)) },
    sales_price: { minimum_amount: String(price), maximum_amount: String(price) },
    commission: { amount: "50000", rate: 2800 }
  };
}

function mockFetch() {
  return async (url, options = {}) => {
    const target = new URL(url);
    if (target.pathname === "/v1/campaigns") return response({ total: 1, data: [{ id: "campaign-1" }] });
    if (target.pathname === "/v1/transactions") return response({ data: [] });
    if (target.pathname === "/v1/datafeeds") return response({ data: [] });
    if (target.pathname === "/v2/tiktokshop_product_feeds") {
      const keyword = target.searchParams.get("title_keywords") || "micro";
      const base = keyword.replace(/\s+/g, "-");
      return response({
        status: true,
        data: { products: Array.from({ length: 8 }, (_, index) => candidate(`${base}-${index}`, `${keyword} ${index}`, 120000 + index * 320000)) }
      });
    }
    if (target.pathname.endsWith("/create_link")) {
      const body = JSON.parse(options.body || "{}");
      return response({ status: true, data: { aff_short_url: `https://go.isclix.com/test/${body.product_id}` } });
    }
    return response({ error: "not_found" }, 404);
  };
}

function toB64url(bytes) {
  return Buffer.from(bytes).toString("base64url");
}

async function encryptFor(publicJwk, token) {
  const key = await crypto.subtle.importKey(
    "jwk",
    publicJwk,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"]
  );
  return toB64url(new Uint8Array(await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    key,
    new TextEncoder().encode(token)
  )));
}

test("public-key route no-store/noindex và trả cùng một key khi chưa dùng", async () => {
  const state = env();
  const first = await handleChoiceCredentialBootstrapRequest(
    new Request("https://worker.example/owner/choice/credential/public-key"),
    state
  );
  assert.equal(first.status, 200);
  assert.match(first.headers.get("cache-control") || "", /no-store/);
  assert.match(first.headers.get("x-robots-tag") || "", /noindex/);
  const a = await first.json();
  const second = await handleChoiceCredentialBootstrapRequest(
    new Request("https://worker.example/owner/choice/credential/public-key"),
    state
  );
  const b = await second.json();
  assert.equal(a.public_jwk.n, b.public_jwk.n);
});

test("bootstrap chỉ nhận đúng token hash, lưu ciphertext và tự chạy Autopilot", async () => {
  const state = env();
  const token = "test-token-" + "x".repeat(40);
  state.CHOICE_BOOTSTRAP_EXPECTED_SHA256 = await __test.sha256Hex(token);
  const publicJwk = await __test.ensureBootstrapKeypair(state);
  const cipher = await encryptFor(publicJwk, token);
  const result = await __test.ingestCredential(state, cipher, mockFetch());
  assert.equal(result.connected, true);
  assert.equal(result.autopilot_ok, true);
  const stored = await state.KV.get(__test.CREDENTIAL_KEY);
  assert.ok(stored);
  assert.doesNotMatch(stored, /test-token/);
  assert.ok(await state.KV.get(__test.BOOTSTRAP_USED_KEY));
  assert.equal(await state.KV.get(__test.BOOTSTRAP_KEYPAIR_KEY), null);
});

test("bootstrap từ chối ciphertext giải mã ra token khác", async () => {
  const state = env();
  state.CHOICE_BOOTSTRAP_EXPECTED_SHA256 = await __test.sha256Hex("expected-token-value-1234567890");
  const publicJwk = await __test.ensureBootstrapKeypair(state);
  const cipher = await encryptFor(publicJwk, "wrong-token-value-123456789012345");
  await assert.rejects(
    __test.ingestCredential(state, cipher, mockFetch()),
    /credential_hash_mismatch/
  );
  assert.equal(await state.KV.get(__test.CREDENTIAL_KEY), null);
});

test("sau khi dùng, public-key route trả 410", async () => {
  const state = env();
  await state.KV.put(__test.BOOTSTRAP_USED_KEY, "1");
  const response = await handleChoiceCredentialBootstrapRequest(
    new Request("https://worker.example/owner/choice/credential/public-key"),
    state
  );
  assert.equal(response.status, 410);
});
