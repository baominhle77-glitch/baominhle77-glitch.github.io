import { readFile, writeFile } from "node:fs/promises";
import { BLOCKED_AFFILIATE_TERMS, CHOICE_TAXONOMY } from "./choice-taxonomy.mjs";

const seedPath = "hoi-chon-dung/data/seed-products.js";
const autopilotPath = "backend/choice-autopilot.js";
const seoPath = "tools/build-choice-seo.mjs";

const categorySource = `export const CHOICE_CATEGORIES = Object.freeze([\n${CHOICE_TAXONOMY.map((item) =>
  `  { id: ${JSON.stringify(item.id)}, label: ${JSON.stringify(item.label)}, icon: ${JSON.stringify(item.icon)}, description: ${JSON.stringify(item.description)} }`
).join(",\n")}\n]);`;

const portfolioSource = `const PORTFOLIO = Object.freeze([\n${CHOICE_TAXONOMY.map((item) => `  {\n    id: ${JSON.stringify(item.id)},\n    visual: ${JSON.stringify(item.icon)},\n    keywords: ${JSON.stringify(item.keywords)},\n    priorities: ${JSON.stringify(item.priorities)},\n    best_for: ${JSON.stringify(item.bestFor)},\n    avoid_if: ${JSON.stringify(item.avoidIf)}\n  }`).join(",\n")}\n]);`;

const seoConfigSource = `const CATEGORY_CONFIG = Object.freeze({\n${CHOICE_TAXONOMY.map((item) => `  ${JSON.stringify(item.id)}: {\n    slug: ${JSON.stringify(item.slug)},\n    label: ${JSON.stringify(item.label)},\n    title: ${JSON.stringify(item.title)},\n    intro: ${JSON.stringify(item.intro)},\n    guideSlug: ${JSON.stringify(item.guideSlug)},\n    guideTitle: ${JSON.stringify(item.guideTitle)},\n    guideIntro: ${JSON.stringify(item.guideIntro)},\n    tips: ${JSON.stringify(item.tips)}\n  }`).join(",\n")}\n});`;

let seed = await readFile(seedPath, "utf8");
seed = seed.replace(/export const CHOICE_CATEGORIES = Object\.freeze\(\[[\s\S]*?\n\]\);/, categorySource);
for (const id of ["tech", "home", "beauty", "mom-baby", "travel"]) {
  if (!seed.includes(`id: ${JSON.stringify(id)}`)) throw new Error(`Thiếu danh mục public: ${id}`);
}
await writeFile(seedPath, seed);

let autopilot = await readFile(autopilotPath, "utf8");
autopilot = autopilot.replace(/const MAX_PRODUCTS_PER_CATEGORY = \d+;/, "const MAX_PRODUCTS_PER_CATEGORY = 4;");
autopilot = autopilot.replace(/const PORTFOLIO = Object\.freeze\(\[[\s\S]*?\n\]\);/, portfolioSource);
autopilot = autopilot.replace(
  /const BLOCKED_TERMS = \[[\s\S]*?\n\];/,
  `const BLOCKED_TERMS = ${JSON.stringify(BLOCKED_AFFILIATE_TERMS, null, 2)};`
);

if (!autopilot.includes("const trendScore =")) {
  autopilot = autopilot.replace(
    `  const discount = discountPercent(originalMin, saleMin);\n  const opportunityScore = Math.round(\n    Math.min(42, Math.log10(unitsSold + 1) * 13)\n    + Math.min(32, commissionRate * 0.75)\n    + Math.min(14, discount * 0.35)\n    + (imageUrl ? 5 : 0)\n    + 7\n  );`,
    `  const discount = discountPercent(originalMin, saleMin);\n  const trendScore = Math.round(\n    Math.min(55, Math.log10(unitsSold + 1) * 17)\n    + Math.min(20, discount * 0.35)\n    + (imageUrl ? 8 : 0)\n  );\n  const commercialScore = Math.min(32, commissionRate * 0.75)\n    + Math.min(18, Math.log10(commissionAmount + 1) * 4);\n  const opportunityScore = Math.round(Math.min(100, trendScore * 0.62 + commercialScore * 0.38 + 8));`
  );
  autopilot = autopilot.replace(
    `    discount_percent: discount,\n    category: portfolio.id,`,
    `    discount_percent: discount,\n    trend_score: trendScore,\n    trend_label: unitsSold >= 5000 ? "ban-chay" : unitsSold >= 1000 ? "dang-duoc-quan-tam" : "moi-phat-hien",\n    category: portfolio.id,`
  );
}

if (!autopilot.includes('const sortFields = ["BEST_SELLERS", "RECOMMENDED", "HIGH_COMMISSION_RATE"]')) {
  const taskBlock = [
    '  const sortFields = ["BEST_SELLERS", "RECOMMENDED", "HIGH_COMMISSION_RATE"];',
    '  const tasks = portfolio.keywords.flatMap((keyword) => sortFields.map((sortField) => {',
    '    const url = new URL(`${API_BASE}/v2/tiktokshop_product_feeds`);',
    '    url.searchParams.set("sort_field", sortField);',
    '    url.searchParams.set("limit", "30");',
    '    url.searchParams.set("title_keywords", keyword);',
    '    return fetchJson(url.toString(), token, {}, fetchImpl)',
    '      .then((data) => (data?.data?.products || []).map((item) => normalizeCandidate(item, portfolio, keyword)).filter(Boolean));',
    '  }));'
  ].join("\n");
  autopilot = autopilot.replace(
    /  const tasks = portfolio\.keywords\.map\(\(keyword, index\) => \{[\s\S]*?\n  \}\);/,
    taskBlock
  );
}

if (!autopilot.includes("const selectedSourceIds = new Set()")) {
  const diverseSelection = [
    '      const shortlist = group.candidates.slice(0, MAX_PRODUCTS_PER_CATEGORY * 5);',
    '      const shopCounts = new Map();',
    '      const priceBands = new Set();',
    '      const selectedSourceIds = new Set();',
    '      let rank = 0;',
    '      for (const preferNewPriceBand of [true, false]) {',
    '        for (const candidate of shortlist) {',
    '          if (rank >= MAX_PRODUCTS_PER_CATEGORY) break;',
    '          if (selectedSourceIds.has(candidate.source_id)) continue;',
    '          const shopCount = shopCounts.get(candidate.shop_name) || 0;',
    '          const priceBand = candidate.price_min < 200000 ? "low" : candidate.price_min < 1000000 ? "mid" : "high";',
    '          if (shopCount >= 2) continue;',
    '          if (preferNewPriceBand && priceBands.has(priceBand)) continue;',
    '          try {',
    '            const affiliateUrl = await createAffiliateLink(credential.token, candidate, runId, fetchImpl);',
    '            if (!affiliateUrl) continue;',
    '            selected.push(toProduct(candidate, affiliateUrl, rank, previousBySource.get(candidate.source_id)));',
    '            selectedSourceIds.add(candidate.source_id);',
    '            shopCounts.set(candidate.shop_name, shopCount + 1);',
    '            priceBands.add(priceBand);',
    '            rank += 1;',
    '          } catch (error) {',
    '            errors.push(`${candidate.source_id}:${clean(error?.message, 160)}`);',
    '          }',
    '        }',
    '        if (rank >= MAX_PRODUCTS_PER_CATEGORY) break;',
    '      }'
  ].join("\n");
  const selectionStartMarker = "      const shortlist = group.candidates.slice(0, MAX_PRODUCTS_PER_CATEGORY * 2);";
  const selectionEndMarker = "\n    }\n\n    if (selected.length";
  const selectionStart = autopilot.indexOf(selectionStartMarker);
  const selectionEnd = selectionStart >= 0 ? autopilot.indexOf(selectionEndMarker, selectionStart) : -1;
  if (selectionStart < 0 || selectionEnd < 0) throw new Error("Không tìm thấy ranh giới block tuyển sản phẩm cũ");
  autopilot = autopilot.slice(0, selectionStart) + diverseSelection + autopilot.slice(selectionEnd);
}

if (!autopilot.includes("trend_score: candidate.trend_score")) {
  autopilot = autopilot.replace(
    `    opportunity_score: candidate.opportunity_score,\n    last_verified_at: now,`,
    `    opportunity_score: candidate.opportunity_score,\n    trend_score: candidate.trend_score,\n    trend_label: candidate.trend_label,\n    last_verified_at: now,`
  );
}

if (autopilot.includes('if (selected.length < PORTFOLIO.length)')) {
  autopilot = autopilot.replace(
    '    if (selected.length < PORTFOLIO.length) throw new Error("insufficient_verified_products");',
    '    if (selected.length < Math.min(8, PORTFOLIO.length)) throw new Error("insufficient_verified_products");'
  );
}

if (!autopilot.includes("const refreshedCategories = new Set")) {
  autopilot = autopilot.replace(
    `    const preserved = existing.products.filter((product) => {\n      if (product?.autopilot_managed || product?.source === "accesstrade:tiktokshop") return false;`,
    `    const refreshedCategories = new Set(selected.map((product) => product.category));\n    const preserved = existing.products.filter((product) => {\n      if (product?.autopilot_managed || product?.source === "accesstrade:tiktokshop") {\n        return !refreshedCategories.has(String(product?.category || ""));\n      }`
  );
}

if (!autopilot.includes("categories_covered:")) {
  autopilot = autopilot.replace(
    `      selected_products: selected.length,\n      preserved_products: preserved.length,`,
    `      selected_products: selected.length,\n      categories_covered: [...new Set(selected.map((product) => product.category))].length,\n      preserved_products: preserved.length,`
  );
}

for (const required of [
  'id: "tech"', 'id: "travel"', "trend_score: trendScore",
  'const sortFields = ["BEST_SELLERS", "RECOMMENDED", "HIGH_COMMISSION_RATE"]',
  "const shopCounts = new Map()", "const selectedSourceIds = new Set()",
  "for (const preferNewPriceBand of [true, false])", "const refreshedCategories = new Set",
  "const MAX_PRODUCTS_PER_CATEGORY = 4;"
]) {
  if (!autopilot.includes(required)) throw new Error(`Autopilot đa lĩnh vực thiếu: ${required}`);
}
await writeFile(autopilotPath, autopilot);

let seo = await readFile(seoPath, "utf8");
seo = seo.replace(/const CATEGORY_CONFIG = Object\.freeze\(\{[\s\S]*?\n\}\);/, seoConfigSource);

const oldNav = '<nav><a href="${APP_PATH}/#chon">Chọn sản phẩm</a><a href="${APP_PATH}/danh-muc/tarot/">Tarot</a><a href="${APP_PATH}/danh-muc/sang-tao-noi-dung/">Sáng tạo</a><a href="${APP_PATH}/danh-muc/in-3d/">In 3D</a></nav>';
const dynamicNav = '<nav><a href="${APP_PATH}/#chon">Chọn sản phẩm</a>${Object.values(CATEGORY_CONFIG).slice(0, 5).map((item) => `<a href="${APP_PATH}/danh-muc/${item.slug}/">${esc(item.label)}</a>`).join("")}</nav>';
seo = seo.replace(oldNav, dynamicNav);

if (!seo.includes("const specifics = Array.isArray(config.tips)")) {
  seo = seo.replace(
    /  const specifics = category === "tarot"[\s\S]*?\n      : \["PLA thường dễ bắt đầu; PETG cần kiểm soát độ ẩm và thiết lập tốt hơn\.", "Resin cần thông gió, găng bảo hộ và quy trình rửa–hậu lưu hóa\.", "Kiểm tra đường kính filament hoặc loại resin tương thích với máy trước khi đặt hàng\."\];/,
    `  const specifics = Array.isArray(config.tips) && config.tips.length ? config.tips : [\n    "Xác định nhu cầu, kích thước và điều kiện sử dụng trước khi mua.",\n    "Đối chiếu thông số, đánh giá gần nhất và chính sách đổi trả.",\n    "Không dựa riêng vào phần trăm giảm giá hoặc lời quảng cáo."\n  ];`
  );
}

for (const required of [
  '"tech": {', '"travel": {', "const specifics = Array.isArray(config.tips)",
  "Object.values(CATEGORY_CONFIG).slice(0, 5)"
]) {
  if (!seo.includes(required)) throw new Error(`SEO đa lĩnh vực thiếu: ${required}`);
}
await writeFile(seoPath, seo);

console.log(`choice-multiniche-ok: ${CHOICE_TAXONOMY.length} lĩnh vực, trend scoring, tuyển hai vòng và SEO danh mục động`);
