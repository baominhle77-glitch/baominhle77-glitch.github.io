import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { CHOICE_CATEGORIES, SEED_PRODUCTS } from "./data/seed-products.js";

const read = (name) => readFile(new URL(name, import.meta.url), "utf8");

test("HTML nguồn có SEO, PWA, structured data và công bố affiliate", async () => {
  const html = await read("./index.html");
  assert.match(html, /<title>Hội Chọn Đúng/);
  assert.match(html, /rel="canonical" href="https:\/\/hiennhi89\.pages\.dev\/hoi-chon-dung\/"/);
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /WebApplication/);
  assert.match(html, /FAQPage/);
  assert.match(html, /CÔNG BỐ LIÊN KẾT TIẾP THỊ/);
  assert.match(html, /manifest\.webmanifest/);
  assert.match(html, /type="module" src="\.\/app\.js"/);
});

test("catalog dự phòng có ba danh mục, ID duy nhất và URL HTTPS an toàn", () => {
  assert.equal(CHOICE_CATEGORIES.length, 3);
  assert.ok(SEED_PRODUCTS.length >= 12);
  const ids = SEED_PRODUCTS.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const item of SEED_PRODUCTS) {
    assert.ok(CHOICE_CATEGORIES.some((category) => category.id === item.category));
    assert.ok(item.name && item.summary && item.published !== false);
    for (const value of [item.affiliate_url, item.merchant_url].filter(Boolean)) {
      const url = new URL(value);
      assert.equal(url.protocol, "https:");
      assert.equal(url.username, "");
      assert.equal(url.password, "");
    }
  }
});

test("service worker cache app shell V2 gồm trạng thái Autopilot và có offline navigation fallback", async () => {
  const sw = await read("./sw.js");
  assert.match(sw, /hoi-chon-dung-v2/);
  assert.match(sw, /autopilot-ui\.js/);
  assert.match(sw, /data\/seed-products\.js/);
  assert.match(sw, /request\.mode === "navigate"/);
  assert.match(sw, /caches\.match\("\.\/index\.html"\)/);
});

test("frontend dùng redirect backend và không lấy URL affiliate thô từ API", async () => {
  const app = await read("./app.js");
  assert.match(app, /\/api\/choice\/products/);
  assert.match(app, /\/api\/choice\/vote/);
  assert.match(app, /outbound_path/);
  assert.match(app, /serviceWorker\.register/);
});

test("giao diện Autopilot chỉ đọc status công khai và không chứa credential", async () => {
  const source = await read("./autopilot-ui.js");
  assert.match(source, /\/api\/choice\/autopilot\/status/);
  assert.match(source, /mode === "active"/);
  assert.match(source, /mode === "onboarding_required"/);
  assert.doesNotMatch(source, /ACCESSTRADE_API_TOKEN|x-choice-autopilot-trigger|\/atkey/);
});

test("sitemap chỉ công khai ứng dụng mới", async () => {
  const sitemap = await read("./sitemap.xml");
  assert.match(sitemap, /https:\/\/hiennhi89\.pages\.dev\/hoi-chon-dung\//);
  assert.doesNotMatch(sitemap, /boitoan|medora|vietnam-travel/);
});
