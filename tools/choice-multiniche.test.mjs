import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { BLOCKED_AFFILIATE_TERMS, CHOICE_TAXONOMY } from "./choice-taxonomy.mjs";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("taxonomy có ít nhất 12 lĩnh vực duy nhất và đủ cấu hình SEO/discovery", () => {
  assert.ok(CHOICE_TAXONOMY.length >= 12);
  assert.equal(new Set(CHOICE_TAXONOMY.map((item) => item.id)).size, CHOICE_TAXONOMY.length);
  assert.equal(new Set(CHOICE_TAXONOMY.map((item) => item.slug)).size, CHOICE_TAXONOMY.length);
  for (const item of CHOICE_TAXONOMY) {
    assert.match(item.id, /^[a-z0-9-]+$/);
    assert.ok(item.label && item.description && item.slug);
    assert.ok(item.title && item.intro && item.guideSlug && item.guideTitle && item.guideIntro);
    assert.ok(Array.isArray(item.tips) && item.tips.length >= 3);
    assert.ok(Array.isArray(item.keywords) && item.keywords.length >= 3);
    assert.ok(Array.isArray(item.priorities) && item.priorities.length >= 3);
    assert.ok(Array.isArray(item.bestFor) && item.bestFor.length >= 1);
    assert.ok(Array.isArray(item.avoidIf) && item.avoidIf.length >= 1);
  }
});

test("blocklist loại nhóm hàng bị cấm hoặc rủi ro cao", () => {
  for (const term of ["thuốc kê đơn", "thực phẩm chức năng", "rượu", "vape", "súng", "chất nổ", "sex toy", "cá cược", "hàng giả"]) {
    assert.ok(BLOCKED_AFFILIATE_TERMS.includes(term), `thiếu ${term}`);
  }
});

test("source materialized có discovery theo xu hướng, đa dạng shop/giá và giữ catalog an toàn", async () => {
  const [seed, autopilot, seo] = await Promise.all([
    read("hoi-chon-dung/data/seed-products.js"),
    read("backend/choice-autopilot.js"),
    read("tools/build-choice-seo.mjs")
  ]);
  for (const id of ["tech", "home", "beauty", "fashion", "mom-baby", "pets", "office", "fitness", "travel"]) {
    assert.match(seed, new RegExp(`id: ["']${id}["']`));
    assert.match(autopilot, new RegExp(`id: ["']${id}["']`));
  }
  assert.match(autopilot, /BEST_SELLERS.+RECOMMENDED.+HIGH_COMMISSION_RATE/s);
  assert.match(autopilot, /trend_score: trendScore/);
  assert.match(autopilot, /const shopCounts = new Map\(\)/);
  assert.match(autopilot, /const priceBands = new Set\(\)/);
  assert.match(autopilot, /const refreshedCategories = new Set/);
  assert.match(autopilot, /selected\.length < Math\.min\(8, PORTFOLIO\.length\)/);
  assert.match(seo, /"tech": \{/);
  assert.match(seo, /"travel": \{/);
  assert.match(seo, /Object\.values\(CATEGORY_CONFIG\)\.slice\(0, 5\)/);
  assert.match(seo, /Array\.isArray\(config\.tips\)/);
});
