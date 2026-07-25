import { readFile, writeFile } from "node:fs/promises";

const path = "backend/choice-autopilot.js";
let source = await readFile(path, "utf8");

function replaceBetween(input, startMarker, endMarker, replacement) {
  const start = input.indexOf(startMarker);
  const end = start >= 0 ? input.indexOf(endMarker, start) : -1;
  if (start < 0 || end < 0) throw new Error(`Không tìm thấy marker: ${startMarker} -> ${endMarker}`);
  return input.slice(0, start) + replacement + input.slice(end);
}

if (!source.includes("let choiceTikTokCapabilityCache")) {
  source = source.replace(
    "const FETCH_TIMEOUT_MS = 12000;",
    "const FETCH_TIMEOUT_MS = 12000;\nlet choiceTikTokCapabilityCache = null;\nlet choiceDatafeedPoolCache = null;"
  );
}

const validationBlock = `async function validateAccessToken(token, fetchImpl = fetch) {
  const url = new URL(\`${"${API_BASE}"}/v1/campaigns\`);
  url.searchParams.set("limit", "1");
  url.searchParams.set("page", "1");
  const data = await fetchJson(url.toString(), token, {}, fetchImpl);
  return Array.isArray(data?.data) || Number.isFinite(Number(data?.total));
}
`;
source = replaceBetween(source, "async function validateAccessToken", "\n\nfunction blockedTitle", validationBlock);

const fallbackBlock = `async function supportsTikTokProductFeeds(token, fetchImpl = fetch) {
  if (choiceTikTokCapabilityCache?.token === token) return choiceTikTokCapabilityCache.promise;
  const promise = (async () => {
    try {
      const url = new URL(\`${"${API_BASE}"}/v2/tiktokshop_product_feeds\`);
      url.searchParams.set("sort_field", "RECOMMENDED");
      url.searchParams.set("limit", "1");
      url.searchParams.set("title_keywords", "micro");
      const data = await fetchJson(url.toString(), token, {}, fetchImpl);
      return Array.isArray(data?.data?.products);
    } catch (_) {
      return false;
    }
  })();
  choiceTikTokCapabilityCache = { token, promise };
  return promise;
}

async function loadDatafeedPool(token, fetchImpl = fetch) {
  if (choiceDatafeedPoolCache?.token === token) return choiceDatafeedPoolCache.promise;
  const promise = (async () => {
    const attempts = [
      { limit: "200", page: "1", status_discount: "1" },
      { limit: "200", page: "1" }
    ];
    for (const params of attempts) {
      try {
        const url = new URL(\`${"${API_BASE}"}/v1/datafeeds\`);
        Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
        const data = await fetchJson(url.toString(), token, {}, fetchImpl);
        const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        if (rows.length) return rows;
      } catch (_) { /* thử cấu hình tiếp theo */ }
    }
    return [];
  })();
  choiceDatafeedPoolCache = { token, promise };
  return promise;
}

function normalizeDatafeedCandidate(raw, portfolio, keyword) {
  const haystack = stripVietnamese([
    raw?.name, raw?.cate, raw?.desc, raw?.campaign, raw?.domain
  ].filter(Boolean).join(" ")).toLowerCase();
  const terms = stripVietnamese(keyword).toLowerCase().split(/\\s+/).filter((term) => term.length >= 3);
  if (!terms.some((term) => haystack.includes(term))) return null;

  const fallbackId = slugify(String(raw?.campaign || "feed") + "-" + String(raw?.name || "product"));
  const id = clean(raw?.product_id || raw?.sku || fallbackId, 120);
  const title = clean(raw?.name, 180);
  const detailLink = safeUrl(raw?.url);
  const affiliateUrl = safeUrl(raw?.aff_link);
  const imageUrl = safeUrl(raw?.image);
  const shopName = clean(raw?.campaign || raw?.domain || "Nhà bán trên ACCESSTRADE", 120);
  const originalPrice = num(raw?.price);
  const salePrice = num(raw?.discount, originalPrice);
  const discount = num(raw?.discount_rate, discountPercent(originalPrice, salePrice));
  if (!id || !title || (!detailLink && !affiliateUrl) || blockedTitle(title)) return null;
  if (!salePrice || salePrice < 20000 || salePrice > 10000000) return null;

  const updatedAt = Date.parse(String(raw?.update_time || ""));
  const recentBoost = Number.isFinite(updatedAt) && Date.now() - updatedAt < 30 * 24 * 60 * 60 * 1000 ? 12 : 0;
  const trendScore = Math.round(Math.min(100, 30 + Math.min(35, discount * 0.7) + (imageUrl ? 10 : 0) + recentBoost));
  const opportunityScore = Math.round(Math.min(100, trendScore * 0.72 + (affiliateUrl ? 18 : 8)));

  return {
    source_id: id,
    source_type: "datafeed",
    title,
    detail_link: detailLink || affiliateUrl,
    affiliate_url: affiliateUrl,
    image_url: imageUrl,
    shop_name: shopName,
    price_min: Math.round(salePrice),
    price_max: Math.round(salePrice),
    original_price: Math.round(originalPrice || salePrice),
    commission_rate: 0,
    commission_amount: 0,
    units_sold: 0,
    discount_percent: Math.round(discount),
    trend_score: trendScore,
    trend_label: trendScore >= 70 ? "dang-duoc-quan-tam" : "moi-phat-hien",
    category: portfolio.id,
    visual: portfolio.visual,
    keyword,
    priorities: portfolio.priorities,
    best_for: portfolio.best_for,
    avoid_if: portfolio.avoid_if,
    opportunity_score: opportunityScore
  };
}

async function fetchPortfolioCandidates(token, portfolio, fetchImpl = fetch) {
  const candidates = [];
  const errors = [];
  const sortFields = ["BEST_SELLERS", "RECOMMENDED", "HIGH_COMMISSION_RATE"];
  const hasTikTok = await supportsTikTokProductFeeds(token, fetchImpl);

  if (hasTikTok) {
    const offset = [...portfolio.id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % sortFields.length;
    const tasks = portfolio.keywords.slice(0, 2).map((keyword, index) => {
      const url = new URL(\`${"${API_BASE}"}/v2/tiktokshop_product_feeds\`);
      url.searchParams.set("sort_field", sortFields[(offset + index) % sortFields.length]);
      url.searchParams.set("limit", "30");
      url.searchParams.set("title_keywords", keyword);
      return fetchJson(url.toString(), token, {}, fetchImpl)
        .then((data) => (data?.data?.products || []).map((item) => normalizeCandidate(item, portfolio, keyword)).filter(Boolean));
    });
    const settled = await Promise.allSettled(tasks);
    for (const result of settled) {
      if (result.status === "fulfilled") candidates.push(...result.value);
      else errors.push(clean(result.reason?.message, 180) || "tiktok_candidate_fetch_failed");
    }
  } else {
    errors.push("tiktokshop_unavailable_using_datafeeds");
  }

  const datafeedRows = await loadDatafeedPool(token, fetchImpl);
  for (const keyword of portfolio.keywords) {
    for (const row of datafeedRows) {
      const normalized = normalizeDatafeedCandidate(row, portfolio, keyword);
      if (normalized) candidates.push(normalized);
    }
  }

  const deduped = new Map();
  for (const candidate of candidates) {
    const previous = deduped.get(candidate.source_id);
    if (!previous || candidate.opportunity_score > previous.opportunity_score) deduped.set(candidate.source_id, candidate);
  }
  return { candidates: [...deduped.values()], errors };
}
`;
source = replaceBetween(source, "async function fetchPortfolioCandidates", "\n\nasync function fetchTransactions", fallbackBlock);

if (!source.includes("if (candidate.affiliate_url) return candidate.affiliate_url;")) {
  source = source.replace(
    "async function createAffiliateLink(token, candidate, runId, fetchImpl = fetch) {",
    "async function createAffiliateLink(token, candidate, runId, fetchImpl = fetch) {\n  if (candidate.affiliate_url) return candidate.affiliate_url;"
  );
}

for (const required of [
  "/v1/campaigns", "supportsTikTokProductFeeds", "loadDatafeedPool", "normalizeDatafeedCandidate",
  "tiktokshop_unavailable_using_datafeeds", "if (candidate.affiliate_url) return candidate.affiliate_url;"
]) {
  if (!source.includes(required)) throw new Error(`Thiếu fallback AccessTrade: ${required}`);
}

await writeFile(path, source);
console.log("choice-access-fallback-ok: Publisher campaigns validation + TikTok/datafeed hybrid");
