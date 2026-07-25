import { readFile, writeFile } from "node:fs/promises";
import { BLOCKED_AFFILIATE_TERMS, CHOICE_TAXONOMY } from "./choice-taxonomy.mjs";

const path = "backend/choice-autopilot.js";
let source = await readFile(path, "utf8");

const COMPLETE_V2_MARKERS = [
  'const MAX_PRODUCTS_PER_CATEGORY = 12;',
  'id: "tech"',
  'id: "travel"',
  'id: "fitness"',
  'trend_score: trendScore',
  'const sortFields = ["BEST_SELLERS", "RECOMMENDED", "HIGH_COMMISSION_RATE"]',
  'const shopCounts = new Map()',
  'const selectedSourceIds = new Set()',
  'const globalSelectedSources = new Set()',
  'globalSelectedSources.has(candidate.source_id)'
];

if (COMPLETE_V2_MARKERS.every((marker) => source.includes(marker))) {
  console.log(`choice-multiniche-v2-idempotent: ${CHOICE_TAXONOMY.length} lĩnh vực đã hoàn chỉnh`);
  process.exit(0);
}

const portfolioSource = `const PORTFOLIO = Object.freeze([\n${CHOICE_TAXONOMY.map((item) => `  {\n    id: ${JSON.stringify(item.id)},\n    visual: ${JSON.stringify(item.icon)},\n    keywords: ${JSON.stringify(item.keywords)},\n    priorities: ${JSON.stringify(item.priorities)},\n    best_for: ${JSON.stringify(item.bestFor)},\n    avoid_if: ${JSON.stringify(item.avoidIf)}\n  }`).join(",\n")}\n]);`;

source = source.replace(/const MAX_PRODUCTS_PER_CATEGORY = \d+;/, "const MAX_PRODUCTS_PER_CATEGORY = 12;");
source = source.replace(/const PORTFOLIO = Object\.freeze\(\[[\s\S]*?\n\]\);/, portfolioSource);
source = source.replace(/const BLOCKED_TERMS = \[[\s\S]*?\n\];/, `const BLOCKED_TERMS = ${JSON.stringify(BLOCKED_AFFILIATE_TERMS, null, 2)};`);

if (!source.includes("const trendScore =")) {
  source = source.replace(
    `  const discount = discountPercent(originalMin, saleMin);\n  const opportunityScore = Math.round(\n    Math.min(42, Math.log10(unitsSold + 1) * 13)\n    + Math.min(32, commissionRate * 0.75)\n    + Math.min(14, discount * 0.35)\n    + (imageUrl ? 5 : 0)\n    + 7\n  );`,
    `  const discount = discountPercent(originalMin, saleMin);\n  const trendScore = Math.round(\n    Math.min(55, Math.log10(unitsSold + 1) * 17)\n    + Math.min(20, discount * 0.35)\n    + (imageUrl ? 8 : 0)\n  );\n  const commercialScore = Math.min(32, commissionRate * 0.75)\n    + Math.min(18, Math.log10(commissionAmount + 1) * 4);\n  const opportunityScore = Math.round(Math.min(100, trendScore * 0.62 + commercialScore * 0.38 + 8));`
  );
  source = source.replace(
    `    discount_percent: discount,\n    category: portfolio.id,`,
    `    discount_percent: discount,\n    trend_score: trendScore,\n    trend_label: unitsSold >= 5000 ? "ban-chay" : unitsSold >= 1000 ? "dang-duoc-quan-tam" : "moi-phat-hien",\n    category: portfolio.id,`
  );
}

if (!source.includes('const sortFields = ["BEST_SELLERS", "RECOMMENDED", "HIGH_COMMISSION_RATE"]')) {
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
  source = source.replace(/  const tasks = portfolio\.keywords\.map\(\(keyword, index\) => \{[\s\S]*?\n  \}\);/, taskBlock);
}

if (!source.includes("const selectedSourceIds = new Set()")) {
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
  const startMarker = "      const shortlist = group.candidates.slice(0, MAX_PRODUCTS_PER_CATEGORY * 2);";
  const endMarker = "\n    }\n\n    if (selected.length";
  const start = source.indexOf(startMarker);
  const end = start >= 0 ? source.indexOf(endMarker, start) : -1;
  if (start < 0 || end < 0) throw new Error("Không tìm thấy block tuyển sản phẩm cần nâng cấp lên V2");
  source = source.slice(0, start) + diverseSelection + source.slice(end);
}

if (!source.includes("const globalSelectedSources = new Set()")) {
  source = source.replace(
    "    const selected = [];\n    const errors = [];",
    "    const selected = [];\n    const errors = [];\n    const globalSelectedSources = new Set();"
  );
  source = source.replace(
    "          if (selectedSourceIds.has(candidate.source_id)) continue;",
    "          if (selectedSourceIds.has(candidate.source_id) || globalSelectedSources.has(candidate.source_id)) continue;"
  );
  source = source.replace(
    "            selectedSourceIds.add(candidate.source_id);",
    "            selectedSourceIds.add(candidate.source_id);\n            globalSelectedSources.add(candidate.source_id);"
  );
}

if (!source.includes("trend_score: candidate.trend_score")) {
  source = source.replace(
    `    opportunity_score: candidate.opportunity_score,\n    last_verified_at: now,`,
    `    opportunity_score: candidate.opportunity_score,\n    trend_score: candidate.trend_score,\n    trend_label: candidate.trend_label,\n    last_verified_at: now,`
  );
}

source = source.replace(
  '    if (selected.length < PORTFOLIO.length) throw new Error("insufficient_verified_products");',
  '    if (selected.length < Math.min(8, PORTFOLIO.length)) throw new Error("insufficient_verified_products");'
);

// Marketplace V2 chịu trách nhiệm thanh lọc toàn bộ nguồn affiliate cũ; không tái chèn refreshedCategories đời cũ.
if (!source.includes("categories_covered:")) {
  source = source.replace(
    `      selected_products: selected.length,\n      preserved_products: preserved.length,`,
    `      selected_products: selected.length,\n      categories_covered: [...new Set(selected.map((product) => product.category))].length,\n      preserved_products: preserved.length,`
  );
}

for (const required of COMPLETE_V2_MARKERS) {
  if (!source.includes(required)) throw new Error(`Autopilot V2 thiếu marker: ${required}`);
}

await writeFile(path, source);
console.log(`choice-multiniche-v2-ok: ${CHOICE_TAXONOMY.length} lĩnh vực, quota 12, trend, đa dạng shop và chống trùng toàn catalog`);
