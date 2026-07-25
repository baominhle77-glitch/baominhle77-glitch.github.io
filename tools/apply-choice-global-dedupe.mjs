import { readFile, writeFile } from "node:fs/promises";

const path = "backend/choice-autopilot.js";
let source = await readFile(path, "utf8");

if (!source.includes("DATAFEED_BEST_CATEGORY_V1")) {
  const classifier = `// DATAFEED_BEST_CATEGORY_V1
function datafeedPortfolioScore(raw, portfolio) {
  const text = stripVietnamese([
    raw?.name, raw?.cate, raw?.desc, raw?.campaign, raw?.domain
  ].filter(Boolean).join(" ")).toLowerCase();
  const rawCategory = stripVietnamese(raw?.cate || "").toLowerCase();
  let score = rawCategory === String(portfolio.id).toLowerCase() ? 80 : 0;
  for (const keyword of portfolio.keywords || []) {
    const phrase = stripVietnamese(keyword).toLowerCase();
    if (phrase && text.includes(phrase)) score += 16;
    for (const token of phrase.split(/\s+/).filter((item) => item.length >= 3)) {
      if (text.includes(token)) score += 2;
    }
  }
  return score;
}

function bestDatafeedPortfolio(raw) {
  let best = null;
  let bestScore = 0;
  for (const portfolio of PORTFOLIO) {
    const score = datafeedPortfolioScore(raw, portfolio);
    if (score > bestScore) {
      best = portfolio.id;
      bestScore = score;
    }
  }
  return best;
}

`;
  source = source.replace("function normalizeDatafeedCandidate(raw, portfolio, keyword) {", classifier + "function normalizeDatafeedCandidate(raw, portfolio, keyword) {");
  source = source.replace(
    "function normalizeDatafeedCandidate(raw, portfolio, keyword) {\n  const haystack",
    "function normalizeDatafeedCandidate(raw, portfolio, keyword) {\n  const assignedPortfolio = bestDatafeedPortfolio(raw);\n  if (assignedPortfolio && assignedPortfolio !== portfolio.id) return null;\n  const haystack"
  );
}

if (!source.includes("GLOBAL_PRODUCT_DEDUPE_V1")) {
  source = source.replace(
    "    const selected = [];\n    const errors = [];",
    "    const selected = [];\n    const errors = [];\n    // GLOBAL_PRODUCT_DEDUPE_V1\n    const globalSelectedSources = new Set();"
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

// Giữ marker cho apply-choice-multiniche đời trước; chính sách Việt Nam vẫn thanh lọc toàn bộ affiliate cũ.
if (!source.includes("const refreshedCategories = new Set")) {
  source = source.replace(
    "    const preserved = existing.products.filter((product) => {",
    "    const refreshedCategories = new Set(selected.map((product) => product.category));\n    void refreshedCategories;\n    const preserved = existing.products.filter((product) => {"
  );
}

for (const marker of [
  "DATAFEED_BEST_CATEGORY_V1",
  "bestDatafeedPortfolio(raw)",
  "GLOBAL_PRODUCT_DEDUPE_V1",
  "globalSelectedSources.has(candidate.source_id)",
  "globalSelectedSources.add(candidate.source_id)",
  "const refreshedCategories = new Set"
]) {
  if (!source.includes(marker)) throw new Error(`Thiếu phân loại/chống trùng hoặc marker tương thích: ${marker}`);
}

await writeFile(path, source);
console.log("choice-global-dedupe-ok: datafeed vào danh mục mạnh nhất, một source chỉ xuất hiện một lần");
