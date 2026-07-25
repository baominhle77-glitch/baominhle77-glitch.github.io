import { readFile, writeFile } from "node:fs/promises";

const autopilotPath = "backend/choice-autopilot.js";
const catalogPath = "backend/choice.js";

function replaceBetween(input, startMarker, endMarker, replacement) {
  const start = input.indexOf(startMarker);
  const end = start >= 0 ? input.indexOf(endMarker, start) : -1;
  if (start < 0 || end < 0) throw new Error(`Không tìm thấy marker: ${startMarker} -> ${endMarker}`);
  return input.slice(0, start) + replacement + input.slice(end);
}

function insertBefore(input, marker, block) {
  const index = input.indexOf(marker);
  if (index < 0) throw new Error(`Không tìm thấy marker chèn: ${marker}`);
  return input.slice(0, index) + block + input.slice(index);
}

let autopilot = await readFile(autopilotPath, "utf8");
autopilot = autopilot.replace(/const MAX_PRODUCTS_PER_CATEGORY = \d+;/, "const MAX_PRODUCTS_PER_CATEGORY = 12;");

if (!autopilot.includes("VIETNAM_MARKETPLACE_POLICY_V1")) {
  const policy = `// VIETNAM_MARKETPLACE_POLICY_V1\nconst VIETNAM_MARKETPLACES = Object.freeze([\n  { id: "shopee", label: "Shopee Việt Nam", domains: ["shopee.vn"] },\n  { id: "lazada", label: "Lazada Việt Nam", domains: ["lazada.vn"] },\n  { id: "tiki", label: "Tiki", domains: ["tiki.vn"] },\n  { id: "sendo", label: "Sendo", domains: ["sendo.vn"] },\n  { id: "tiktok-shop", label: "TikTok Shop Việt Nam", domains: ["shop.tiktok.com", "tiktok.com"] }\n]);\nconst VIETNAM_DATAFEED_DOMAINS = Object.freeze(["shopee.vn", "lazada.vn", "tiki.vn", "sendo.vn"]);\n`;
  autopilot = insertBefore(autopilot, "const LEGACY_SEED_IDS", policy);
}

if (!autopilot.includes("function marketplaceFromUrl")) {
  const helpers = `function marketplaceFromUrl(value) {\n  const raw = safeUrl(value);\n  if (!raw) return null;\n  try {\n    const host = new URL(raw).hostname.toLowerCase();\n    return VIETNAM_MARKETPLACES.find((item) => item.domains.some((domain) => host === domain || host.endsWith(\`.\${domain}\`))) || null;\n  } catch (_) {\n    return null;\n  }\n}\n\nfunction accessTradePubId(value) {\n  const raw = safeUrl(value);\n  if (!raw) return "";\n  try {\n    const url = new URL(raw);\n    const host = url.hostname.toLowerCase();\n    if (!["go.isclix.com", "fast.accesstrade.com.vn"].includes(host)) return "";\n    const match = url.pathname.match(/\\/deep_link\\/([^/?#]+)/);\n    return clean(match?.[1], 100).replace(/[^a-zA-Z0-9_-]/g, "");\n  } catch (_) {\n    return "";\n  }\n}\n\nfunction buildMarketplaceDeepLink(rawAffiliate, merchantUrl, candidate) {\n  const marketplace = marketplaceFromUrl(merchantUrl);\n  const pubId = accessTradePubId(rawAffiliate);\n  if (!marketplace || !pubId) return "";\n  const link = new URL(\`https://go.isclix.com/deep_link/\${pubId}\`);\n  link.searchParams.set("url", merchantUrl);\n  link.searchParams.set("utm_source", "hoi-chon-dung");\n  link.searchParams.set("utm_medium", "recommendation");\n  link.searchParams.set("utm_campaign", clean(candidate?.category || marketplace.id, 60));\n  link.searchParams.set("utm_content", clean(candidate?.source_id || "product", 120));\n  link.searchParams.set("sub1", marketplace.id);\n  return link.toString();\n}\n\nfunction canonicalProductKey(value) {\n  const ignored = new Set(["chinh", "hang", "auth", "official", "freeship", "sale", "giam", "gia", "moi", "cao", "cap", "nhat", "shop", "mall", "viet", "nam"]);\n  const tokens = stripVietnamese(value).toLowerCase().split(/[^a-z0-9]+/)\n    .filter((token) => token.length >= 2 && !ignored.has(token));\n  return slugify(tokens.slice(0, 18).join("-"));\n}\n\n`;
  autopilot = insertBefore(autopilot, "function num(value", helpers);
}

const datafeedLoader = `async function loadDatafeedPool(token, fetchImpl = fetch) {\n  if (choiceDatafeedPoolCache?.token === token) return choiceDatafeedPoolCache.promise;\n  const promise = (async () => {\n    const tasks = VIETNAM_DATAFEED_DOMAINS.flatMap((domain) => [1, 2, 3].map((page) => {\n      const url = new URL(\`${"${API_BASE}"}/v1/datafeeds\`);\n      url.searchParams.set("domain", domain);\n      url.searchParams.set("limit", "200");\n      url.searchParams.set("page", String(page));\n      return fetchJson(url.toString(), token, {}, fetchImpl)\n        .then((data) => Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [])\n        .catch(() => []);\n    }));\n    const settled = await Promise.all(tasks);\n    const rows = settled.flat().filter((row) => marketplaceFromUrl(row?.url));\n    const deduped = new Map();\n    for (const row of rows) {\n      const key = clean(row?.product_id || row?.sku || row?.url, 500);\n      if (key && !deduped.has(key)) deduped.set(key, row);\n    }\n    return [...deduped.values()];\n  })();\n  choiceDatafeedPoolCache = { token, promise };\n  return promise;\n}\n`;
autopilot = replaceBetween(autopilot, "async function loadDatafeedPool", "\n\nfunction normalizeDatafeedCandidate", datafeedLoader);

const datafeedNormalizer = `function normalizeDatafeedCandidate(raw, portfolio, keyword) {\n  const haystack = stripVietnamese([raw?.name, raw?.cate, raw?.desc, raw?.campaign, raw?.domain].filter(Boolean).join(" ")).toLowerCase();\n  const terms = stripVietnamese(keyword).toLowerCase().split(/\\s+/).filter((term) => term.length >= 3);\n  if (!terms.some((term) => haystack.includes(term))) return null;\n\n  const fallbackId = slugify(String(raw?.campaign || "feed") + "-" + String(raw?.name || "product"));\n  const id = clean(raw?.product_id || raw?.sku || fallbackId, 120);\n  const title = clean(raw?.name, 180);\n  const detailLink = safeUrl(raw?.url);\n  const marketplace = marketplaceFromUrl(detailLink);\n  const imageUrl = safeUrl(raw?.image);\n  const shopName = clean(raw?.shop_name || raw?.seller_name || marketplace?.label || raw?.campaign || "Nơi bán", 120);\n  const originalPrice = num(raw?.price);\n  const salePrice = num(raw?.discount, originalPrice);\n  const discount = num(raw?.discount_rate, discountPercent(originalPrice, salePrice));\n  if (!id || !title || !marketplace || !detailLink || blockedTitle(title)) return null;\n  if (!salePrice || salePrice < 20000 || salePrice > 10000000) return null;\n\n  const candidateBase = { source_id: id, category: portfolio.id };\n  const affiliateUrl = buildMarketplaceDeepLink(raw?.aff_link, detailLink, candidateBase);\n  if (!affiliateUrl) return null;\n\n  const updatedAt = Date.parse(String(raw?.update_time || ""));\n  const recentBoost = Number.isFinite(updatedAt) && Date.now() - updatedAt < 30 * 24 * 60 * 60 * 1000 ? 12 : 0;\n  const trendScore = Math.round(Math.min(100, 30 + Math.min(35, discount * 0.7) + (imageUrl ? 10 : 0) + recentBoost));\n  const opportunityScore = Math.round(Math.min(100, trendScore * 0.72 + 18));\n\n  return {\n    source_id: id,\n    source_type: "datafeed",\n    title,\n    detail_link: detailLink,\n    affiliate_url: affiliateUrl,\n    image_url: imageUrl,\n    shop_name: shopName,\n    marketplace: marketplace.id,\n    marketplace_label: marketplace.label,\n    comparison_key: canonicalProductKey(title),\n    price_min: Math.round(salePrice),\n    price_max: Math.round(salePrice),\n    original_price: Math.round(originalPrice || salePrice),\n    commission_rate: 0,\n    commission_amount: 0,\n    units_sold: 0,\n    discount_percent: Math.round(discount),\n    trend_score: trendScore,\n    trend_label: trendScore >= 70 ? "dang-duoc-quan-tam" : "moi-phat-hien",\n    category: portfolio.id,\n    visual: portfolio.visual,\n    keyword,\n    priorities: portfolio.priorities,\n    best_for: portfolio.best_for,\n    avoid_if: portfolio.avoid_if,\n    opportunity_score: opportunityScore\n  };\n}\n`;
autopilot = replaceBetween(autopilot, "function normalizeDatafeedCandidate", "\n\nasync function fetchPortfolioCandidates", datafeedNormalizer);

if (!autopilot.includes("const marketplace = marketplaceFromUrl(detailLink);")) {
  autopilot = autopilot.replace(
    "  const detailLink = safeUrl(raw?.detail_link);\n  const imageUrl",
    "  const detailLink = safeUrl(raw?.detail_link);\n  const marketplace = marketplaceFromUrl(detailLink);\n  const imageUrl"
  );
  autopilot = autopilot.replace(
    "  if (!id || !title || !detailLink || !shopName || !raw?.has_inventory) return null;",
    "  if (!id || !title || !detailLink || !marketplace || !shopName || !raw?.has_inventory) return null;"
  );
  autopilot = autopilot.replace(
    "    source_id: id,\n    title,",
    "    source_id: id,\n    title,\n    marketplace: marketplace.id,\n    marketplace_label: marketplace.label,\n    comparison_key: canonicalProductKey(title),"
  );
}

if (!autopilot.includes("marketplace: candidate.marketplace")) {
  autopilot = autopilot.replace(
    "    category: candidate.category,\n    visual:",
    "    category: candidate.category,\n    marketplace: candidate.marketplace,\n    comparison_key: candidate.comparison_key || canonicalProductKey(candidate.title),\n    visual:"
  );
  autopilot = autopilot.replace(
    '    source: "accesstrade:tiktokshop",',
    '    source: candidate.source_type === "datafeed" ? "accesstrade:datafeed" : "accesstrade:tiktokshop",'
  );
}

autopilot = autopilot.replace(
  /    const refreshedCategories = new Set\(selected\.map\(\(product\) => product\.category\)\);\n    const preserved = existing\.products\.filter\(\(product\) => \{[\s\S]*?      if \(LEGACY_SEED_IDS\.has\(String\(product\?\.id \|\| ""\)\)\) return false;/,
  `    const preserved = existing.products.filter((product) => {\n      if (product?.autopilot_managed || String(product?.source || "").startsWith("accesstrade:")) return false;\n      if (LEGACY_SEED_IDS.has(String(product?.id || ""))) return false;`
);

for (const required of [
  "VIETNAM_MARKETPLACE_POLICY_V1",
  "VIETNAM_DATAFEED_DOMAINS",
  "buildMarketplaceDeepLink",
  "canonicalProductKey",
  "const MAX_PRODUCTS_PER_CATEGORY = 12;",
  "marketplace: candidate.marketplace"
]) {
  if (!autopilot.includes(required)) throw new Error(`Autopilot thiếu chính sách sàn Việt Nam: ${required}`);
}
await writeFile(autopilotPath, autopilot);

let catalog = await readFile(catalogPath, "utf8");
if (!catalog.includes("VIETNAM_MARKETPLACE_PUBLIC_V1")) {
  const publicPolicy = `// VIETNAM_MARKETPLACE_PUBLIC_V1\nconst PUBLIC_VIETNAM_MARKETPLACES = Object.freeze([\n  { id: "shopee", domains: ["shopee.vn"] },\n  { id: "lazada", domains: ["lazada.vn"] },\n  { id: "tiki", domains: ["tiki.vn"] },\n  { id: "sendo", domains: ["sendo.vn"] },\n  { id: "tiktok-shop", domains: ["shop.tiktok.com", "tiktok.com"] }\n]);\nconst AFFILIATE_TRACKER_HOSTS = new Set(["go.isclix.com", "fast.accesstrade.com.vn"]);\n`;
  catalog = insertBefore(catalog, "const json =", publicPolicy);
}

if (!catalog.includes("function marketplaceFromMerchantUrl")) {
  const publicHelpers = `function marketplaceFromMerchantUrl(value) {\n  const raw = normalizeUrl(value);\n  if (!raw) return null;\n  try {\n    const host = new URL(raw).hostname.toLowerCase();\n    return PUBLIC_VIETNAM_MARKETPLACES.find((item) => item.domains.some((domain) => host === domain || host.endsWith(\`.\${domain}\`))) || null;\n  } catch (_) {\n    return null;\n  }\n}\n\nfunction normalizeAffiliateUrl(value, merchantUrl) {\n  const raw = normalizeUrl(value);\n  if (!raw || !marketplaceFromMerchantUrl(merchantUrl)) return "";\n  try {\n    const url = new URL(raw);\n    if (!AFFILIATE_TRACKER_HOSTS.has(url.hostname.toLowerCase())) return "";\n    if (!/\\/deep_link\\//.test(url.pathname)) return "";\n    const target = normalizeUrl(url.searchParams.get("url"));\n    if (!target || !marketplaceFromMerchantUrl(target)) return "";\n    return url.toString();\n  } catch (_) {\n    return "";\n  }\n}\n\nfunction linkUnavailablePage() {\n  const body = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Liên kết đang được cập nhật</title><style>body{font-family:system-ui;margin:0;background:#f7f3ea;color:#173b34;display:grid;place-items:center;min-height:100vh}.box{max-width:520px;margin:24px;padding:28px;border:1px solid #d8d1c5;border-radius:22px;background:#fffdf8}a{display:inline-block;margin-top:14px;padding:12px 18px;border-radius:999px;background:#174c43;color:#fff;text-decoration:none;font-weight:800}</style></head><body><main class="box"><h1>Liên kết đang được thay mới</h1><p>Hội Chọn Đúng chỉ mở liên kết đã xác minh thuộc các sàn mua sắm tại Việt Nam. Lựa chọn này đang được cập nhật lại.</p><a href="https://hiennhi89.pages.dev/hoi-chon-dung/">Quay lại danh sách</a></main></body></html>`;\n  return new Response(body, { status: 410, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" } });\n}\n\n`;
  catalog = insertBefore(catalog, "function numberValue", publicHelpers);
}

catalog = catalog.replace(
  "  const affiliateUrl = normalizeUrl(product.affiliate_url);\n  const merchantUrl = normalizeUrl(product.merchant_url);",
  "  const merchantUrl = normalizeUrl(product.merchant_url);\n  const marketplace = marketplaceFromMerchantUrl(merchantUrl);\n  const affiliateUrl = normalizeAffiliateUrl(product.affiliate_url, merchantUrl);"
);
if (!catalog.includes("marketplace: clean(product.marketplace")) {
  catalog = catalog.replace(
    "    category: categoryValue(product.category),\n    visual:",
    "    category: categoryValue(product.category),\n    marketplace: clean(product.marketplace, 40) || marketplace?.id || \"\",\n    comparison_key: slugify(product.comparison_key || product.name),\n    visual:"
  );
}
catalog = catalog.replace(
  "    link_ready: !!(affiliateUrl || merchantUrl),\n    link_type: affiliateUrl ? \"affiliate\" : merchantUrl ? \"reference\" : \"none\",",
  "    link_ready: !!(affiliateUrl && merchantUrl && marketplace),\n    link_type: affiliateUrl && marketplace ? \"affiliate\" : \"none\","
);
if (!catalog.includes("marketplace: input.marketplace")) {
  catalog = catalog.replace(
    "    category,\n    visual:",
    "    category,\n    marketplace: input.marketplace ?? previous?.marketplace ?? \"\",\n    comparison_key: input.comparison_key ?? previous?.comparison_key ?? name,\n    visual:"
  );
}

const groupedStats = `async function withLiveStats(env, products) {\n  const rows = (await Promise.all(products.map(async (product) => {\n    const [votesAdded, clicks] = await Promise.all([\n      readCount(env, \`choice:votes:\${product.id}\`),\n      readCount(env, \`choice:click-total:\${product.id}\`)\n    ]);\n    const safe = publicProduct(product);\n    if (!safe.link_ready) return null;\n    delete safe.affiliate_url;\n    delete safe.merchant_url;\n    return {\n      ...safe,\n      votes: safe.votes_base + votesAdded,\n      clicks,\n      outbound_path: \`/r/choice/\${safe.id}\`\n    };\n  }))).filter(Boolean);\n\n  const groups = new Map();\n  for (const row of rows) {\n    const key = row.comparison_key || row.id;\n    if (!groups.has(key)) groups.set(key, []);\n    groups.get(key).push(row);\n  }\n\n  const result = [];\n  for (const group of groups.values()) {\n    const uniqueOffers = new Map();\n    for (const row of group) {\n      const key = [row.marketplace, row.merchant, row.price_min, row.price_max].join(":");\n      if (!uniqueOffers.has(key)) uniqueOffers.set(key, row);\n    }\n    const offers = [...uniqueOffers.values()].sort((a, b) => a.price_min - b.price_min || b.votes - a.votes);\n    const distinctSellers = new Set(offers.map((item) => \`\${item.marketplace}:\${item.merchant}\`));\n    if (offers.length >= 2 && distinctSellers.size >= 2) {\n      const primary = offers[0];\n      result.push({\n        ...primary,\n        price_min: Math.min(...offers.map((item) => item.price_min || Infinity).filter(Number.isFinite)),\n        price_max: Math.max(...offers.map((item) => item.price_max || item.price_min || 0)),\n        offers: offers.slice(0, 8).map((item) => ({\n          id: item.id,\n          merchant: item.merchant,\n          marketplace: item.marketplace,\n          price_min: item.price_min,\n          price_max: item.price_max,\n          outbound_path: item.outbound_path\n        }))\n      });\n    } else {\n      result.push(...offers);\n    }\n  }\n  return result;\n}\n`;
catalog = replaceBetween(catalog, "async function withLiveStats", "\n\nasync function handleVote", groupedStats);

catalog = catalog.replace(
  "  const target = normalizeUrl(product.affiliate_url) || normalizeUrl(product.merchant_url);\n  if (!target) return json({ error: \"link_unavailable\" }, 404);",
  "  const merchantUrl = normalizeUrl(product.merchant_url);\n  const target = normalizeAffiliateUrl(product.affiliate_url, merchantUrl);\n  if (!target) return linkUnavailablePage();"
);

for (const required of [
  "VIETNAM_MARKETPLACE_PUBLIC_V1",
  "normalizeAffiliateUrl",
  "linkUnavailablePage",
  "offers: offers.slice(0, 8)",
  "marketplace: clean(product.marketplace"
]) {
  if (!catalog.includes(required)) throw new Error(`Catalog thiếu bảo vệ sàn Việt Nam: ${required}`);
}
await writeFile(catalogPath, catalog);

console.log("choice-vn-marketplace-ok: chỉ sàn Việt Nam, deeplink chuẩn hóa, link lỗi bị chặn và nhóm nhiều nơi bán");
