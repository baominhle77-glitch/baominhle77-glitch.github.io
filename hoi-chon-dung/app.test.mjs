import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { CHOICE_CATEGORIES, SEED_PRODUCTS } from "./data/seed-products.js";

const read = (name) => readFile(new URL(name, import.meta.url), "utf8");

test("HTML public có SEO, PWA, structured data và chỉ chứa nội dung hữu ích cho người dùng", async () => {
  const html = await read("./index.html");
  assert.match(html, /<title>Hội Chọn Đúng/);
  assert.match(html, /rel="canonical" href="https:\/\/hiennhi89\.pages\.dev\/hoi-chon-dung\/"/);
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /WebApplication/);
  assert.match(html, /FAQPage/);
  assert.match(html, /CÔNG BỐ LIÊN KẾT TIẾP THỊ/);
  assert.match(html, /manifest\.webmanifest/);
  assert.match(html, /type="module" src="\.\/app\.js"/);
  assert.match(html, /Public audience boundary v3/);
  assert.match(html, /Tôn trọng quyền riêng tư/);
  assert.match(html, /Trước khi mua/);
  assert.doesNotMatch(html, /Autopilot|autopilotBadge|autopilotFooter|onboarding_required|chủ sở hữu|Cloudflare Worker|API key/i);
  assert.doesNotMatch(html, /autopilot-ui\.js/);
});

test("catalog dự phòng có taxonomy đa lĩnh vực, ID duy nhất và URL HTTPS an toàn", () => {
  assert.ok(CHOICE_CATEGORIES.length >= 12);
  assert.ok(SEED_PRODUCTS.length >= 12);
  const categoryIds = CHOICE_CATEGORIES.map((item) => item.id);
  assert.equal(new Set(categoryIds).size, categoryIds.length);
  for (const required of ["tarot", "creator", "3d", "tech", "home", "beauty", "fashion", "mom-baby", "pets", "office", "fitness", "travel"]) {
    assert.ok(categoryIds.includes(required), `thiếu danh mục ${required}`);
  }
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

test("service worker V4 xóa cache taxonomy cũ và có offline navigation fallback", async () => {
  const sw = await read("./sw.js");
  assert.match(sw, /hoi-chon-dung-v4/);
  assert.doesNotMatch(sw, /autopilot-ui\.js/);
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
  assert.doesNotMatch(app, /\/api\/choice\/autopilot\/status|onboarding_required|chủ sở hữu|Autopilot/i);
});

test("module legacy không còn logic gọi trạng thái nội bộ", async () => {
  const source = await read("./autopilot-ui.js");
  assert.doesNotMatch(source, /fetch\(|\/api\/choice\/autopilot\/status|onboarding_required|chủ sở hữu/i);
});

test("sitemap chỉ công khai ứng dụng mới", async () => {
  const sitemap = await read("./sitemap.xml");
  assert.match(sitemap, /https:\/\/hiennhi89\.pages\.dev\/hoi-chon-dung\//);
  assert.doesNotMatch(sitemap, /boitoan|medora|vietnam-travel/);
});
