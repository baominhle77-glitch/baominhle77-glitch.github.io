const STORE_KEY = "choice:catalog:v1";
const STATUS_KEY = "choice:autopilot:status:v1";
const CREDENTIAL_KEY = "choice:autopilot:credential:v1";
const LOCK_KEY = "choice:autopilot:lock:v1";
const ONBOARDING_NOTICE_KEY = "choice:autopilot:onboarding-notice:v1";
const API_BASE = "https://api.accesstrade.vn";
const MAX_PRODUCTS_PER_CATEGORY = 6;
const FETCH_TIMEOUT_MS = 12000;
const LOCK_TTL = 15 * 60;
const LEGACY_SEED_IDS = new Set([
  "rider-waite-smith-tarot", "everyday-tarot-mini", "light-seers-tarot",
  "khan-trai-tarot-chong-truot", "boya-by-m1-pro-ii", "ulanzi-mt-44",
  "ulanzi-vl49-rgb", "hollyland-lark-m2", "bambu-lab-pla-basic",
  "esun-pla-plus", "sunlu-petg", "anycubic-standard-resin-v2"
]);

const PORTFOLIO = Object.freeze([
  {
    id: "tarot",
    visual: "✦",
    keywords: ["bài tarot", "khăn trải tarot", "túi đựng tarot"],
    priorities: ["de-dung", "tham-my", "gon-nhe"],
    best_for: ["Người học hoặc thực hành Tarot", "Người muốn phụ kiện gọn và dễ dùng"],
    avoid_if: ["Cần kiểm tra kỹ kích thước, chất liệu và đánh giá mới nhất trước khi mua"]
  },
  {
    id: "creator",
    visual: "◉",
    keywords: ["micro cài áo", "tripod điện thoại", "đèn led quay video"],
    priorities: ["quay-video", "am-thanh", "gon-nhe", "de-dung"],
    best_for: ["Người làm video ngắn, livestream hoặc quay tại bàn", "Người cần thiết bị dễ triển khai"],
    avoid_if: ["Cần đối chiếu cổng kết nối, tải trọng và khả năng tương thích với thiết bị đang dùng"]
  },
  {
    id: "3d",
    visual: "⬡",
    keywords: ["filament PLA", "filament PETG", "resin in 3d"],
    priorities: ["de-in", "on-dinh", "do-ben", "chi-tiet"],
    best_for: ["Người in 3D cần vật tư phổ thông", "Người muốn cân bằng chi phí và độ ổn định"],
    avoid_if: ["Cần kiểm tra đường kính, màu, profile máy và yêu cầu an toàn của từng vật liệu"]
  }
]);

const BLOCKED_TERMS = [
  "thuốc", "giảm cân", "tăng cân", "thực phẩm chức năng", "viên uống", "detox",
  "rượu", "bia", "thuốc lá", "vape", "nicotine", "cần sa", "cbd",
  "dao", "súng", "đạn", "taser", "sex toy", "18+", "kích dục"
];

const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    ...headers
  }
});

function clean(value, max = 500) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function stripVietnamese(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function slugify(value) {
  return stripVietnamese(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

function safeUrl(value) {
  const raw = clean(value, 1600);
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.username || url.password) return "";
    return url.toString();
  } catch (_) {
    return "";
  }
}

function num(value, fallback = 0) {
  const parsed = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
}

function b64(bytes) {
  return btoa(String.fromCharCode(...bytes));
}

function unb64(value) {
  return Uint8Array.from(atob(String(value || "")), (char) => char.charCodeAt(0));
}

async function deriveCredentialKey(env) {
  const secret = clean(env.SESSION_SECRET, 500);
  if (secret.length < 32) throw new Error("session_secret_missing");
  const raw = new TextEncoder().encode(`${secret}:choice-autopilot-credential-v1`);
  const digest = await crypto.subtle.digest("SHA-256", raw);
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

async function encryptCredential(env, token) {
  const key = await deriveCredentialKey(env);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(token);
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data));
  return JSON.stringify({ v: 1, iv: b64(iv), data: b64(encrypted), created_at: new Date().toISOString() });
}

async function decryptCredential(env, raw) {
  const parsed = JSON.parse(raw);
  if (parsed?.v !== 1) throw new Error("credential_version");
  const key = await deriveCredentialKey(env);
  const clear = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: unb64(parsed.iv) },
    key,
    unb64(parsed.data)
  );
  return new TextDecoder().decode(clear);
}

async function getAccessToken(env) {
  const direct = clean(env.ACCESSTRADE_API_TOKEN, 1200);
  if (direct) return { token: direct, source: "worker_secret" };
  const encrypted = await env.KV.get(CREDENTIAL_KEY);
  if (!encrypted) return { token: "", source: "none" };
  try {
    return { token: clean(await decryptCredential(env, encrypted), 1200), source: "encrypted_kv" };
  } catch (_) {
    return { token: "", source: "invalid_encrypted_kv" };
  }
}

async function saveAccessToken(env, token) {
  const normalized = clean(token, 1200);
  if (normalized.length < 20) throw new Error("token_too_short");
  await env.KV.put(CREDENTIAL_KEY, await encryptCredential(env, normalized));
  return true;
}

async function fetchJson(url, token, options = {}, fetchImpl = fetch) {
  let lastError = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const response = await fetchImpl(url, {
        ...options,
        signal: controller.signal,
        headers: {
          accept: "application/json",
          authorization: `Token ${token}`,
          "content-type": "application/json",
          ...(options.headers || {})
        }
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(`accesstrade_http_${response.status}`);
      if (data && data.status === false) throw new Error(clean(data.message, 160) || "accesstrade_rejected");
      return data;
    } catch (error) {
      lastError = error;
      if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 250));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError || new Error("accesstrade_unavailable");
}

async function validateAccessToken(token, fetchImpl = fetch) {
  const url = new URL(`${API_BASE}/v2/tiktokshop_product_feeds`);
  url.searchParams.set("sort_field", "RECOMMENDED");
  url.searchParams.set("limit", "1");
  url.searchParams.set("title_keywords", "micro");
  const data = await fetchJson(url.toString(), token, {}, fetchImpl);
  return Array.isArray(data?.data?.products);
}

function blockedTitle(title) {
  const normalized = stripVietnamese(title).toLowerCase();
  return BLOCKED_TERMS.some((term) => normalized.includes(stripVietnamese(term).toLowerCase()));
}

function discountPercent(original, sale) {
  if (!original || !sale || sale >= original) return 0;
  return Math.max(0, Math.min(90, Math.round((1 - sale / original) * 100)));
}

function normalizeCandidate(raw, portfolio, keyword) {
  const id = clean(raw?.id, 120);
  const title = clean(raw?.title, 180);
  const detailLink = safeUrl(raw?.detail_link);
  const imageUrl = safeUrl(raw?.main_image_url);
  const shopName = clean(raw?.shop?.name, 120);
  const saleMin = num(raw?.sales_price?.minimum_amount);
  const saleMax = num(raw?.sales_price?.maximum_amount, saleMin);
  const originalMin = num(raw?.original_price?.minimum_amount, saleMin);
  const commissionRate = num(raw?.commission?.rate) / 100;
  const commissionAmount = num(raw?.commission?.amount);
  const unitsSold = Math.round(num(raw?.units_sold));
  const region = clean(raw?.sale_region, 12).toUpperCase();
  if (!id || !title || !detailLink || !shopName || !raw?.has_inventory) return null;
  if (region && region !== "VN") return null;
  if (blockedTitle(title)) return null;
  if (!saleMin || saleMin < 20000 || saleMin > 10000000) return null;
  if (commissionRate < 1 || commissionAmount <= 0) return null;

  const discount = discountPercent(originalMin, saleMin);
  const opportunityScore = Math.round(
    Math.min(42, Math.log10(unitsSold + 1) * 13)
    + Math.min(32, commissionRate * 0.75)
    + Math.min(14, discount * 0.35)
    + (imageUrl ? 5 : 0)
    + 7
  );

  return {
    source_id: id,
    title,
    detail_link: detailLink,
    image_url: imageUrl,
    shop_name: shopName,
    price_min: Math.round(saleMin),
    price_max: Math.max(Math.round(saleMin), Math.round(saleMax || saleMin)),
    original_price: Math.round(originalMin || saleMin),
    commission_rate: commissionRate,
    commission_amount: Math.round(commissionAmount),
    units_sold: unitsSold,
    discount_percent: discount,
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
  const tasks = portfolio.keywords.map((keyword, index) => {
    const url = new URL(`${API_BASE}/v2/tiktokshop_product_feeds`);
    url.searchParams.set("sort_field", index % 2 === 0 ? "BEST_SELLERS" : "HIGH_COMMISSION_RATE");
    url.searchParams.set("limit", "20");
    url.searchParams.set("title_keywords", keyword);
    return fetchJson(url.toString(), token, {}, fetchImpl)
      .then((data) => (data?.data?.products || []).map((item) => normalizeCandidate(item, portfolio, keyword)).filter(Boolean));
  });
  const settled = await Promise.allSettled(tasks);
  const candidates = [];
  const errors = [];
  for (const result of settled) {
    if (result.status === "fulfilled") candidates.push(...result.value);
    else errors.push(clean(result.reason?.message, 180) || "candidate_fetch_failed");
  }
  const deduped = new Map();
  for (const candidate of candidates) {
    const previous = deduped.get(candidate.source_id);
    if (!previous || candidate.opportunity_score > previous.opportunity_score) deduped.set(candidate.source_id, candidate);
  }
  return { candidates: [...deduped.values()], errors };
}

async function fetchTransactions(token, fetchImpl = fetch) {
  const until = new Date();
  const since = new Date(until.getTime() - 7 * 24 * 60 * 60 * 1000);
  const url = new URL(`${API_BASE}/v1/transactions`);
  url.searchParams.set("since", since.toISOString());
  url.searchParams.set("until", until.toISOString());
  url.searchParams.set("limit", "200");
  url.searchParams.set("utm_source", "hoi-chon-dung");
  try {
    const data = await fetchJson(url.toString(), token, {}, fetchImpl);
    const rows = Array.isArray(data?.data) ? data.data : [];
    const byProduct = {};
    let commission = 0;
    let revenue = 0;
    for (const row of rows) {
      const sourceId = clean(row?.utm_content || row?._utm_content || row?.product_id, 120);
      const amount = num(row?.commission);
      const value = num(row?.transaction_value);
      if (sourceId) {
        byProduct[sourceId] ||= { orders: 0, commission: 0, revenue: 0, approved: 0, rejected: 0 };
        byProduct[sourceId].orders += 1;
        byProduct[sourceId].commission += amount;
        byProduct[sourceId].revenue += value;
        if (Number(row?.status) === 1) byProduct[sourceId].approved += 1;
        if (Number(row?.status) === 2) byProduct[sourceId].rejected += 1;
      }
      commission += amount;
      revenue += value;
    }
    return { orders: rows.length, commission: Math.round(commission), revenue: Math.round(revenue), by_product: byProduct };
  } catch (error) {
    return { orders: 0, commission: 0, revenue: 0, by_product: {}, error: clean(error?.message, 180) };
  }
}

function performanceBoost(candidate, metrics) {
  const item = metrics?.by_product?.[candidate.source_id];
  if (!item) return 0;
  const approval = item.orders ? item.approved / item.orders : 0;
  return Math.min(28, item.orders * 4 + approval * 12 + Math.log10(item.commission + 1) * 3);
}

async function createAffiliateLink(token, candidate, runId, fetchImpl = fetch) {
  const data = await fetchJson(
    `${API_BASE}/v2/tiktokshop_product_feeds/create_link`,
    token,
    {
      method: "POST",
      body: JSON.stringify({
        product_url: candidate.detail_link,
        product_id: candidate.source_id,
        utm_source: "hoi-chon-dung",
        utm_medium: "autopilot",
        utm_campaign: `${candidate.category}-${runId.slice(0, 10)}`,
        utm_content: candidate.source_id,
        sub1: candidate.category,
        sub2: String(candidate.opportunity_score)
      })
    },
    fetchImpl
  );
  return safeUrl(data?.data?.aff_short_url) || safeUrl(data?.data?.aff_url);
}

function toProduct(candidate, affiliateUrl, rank, previous) {
  const now = new Date().toISOString();
  const id = slugify(`at-${candidate.category}-${candidate.source_id}`);
  const soldText = candidate.units_sold > 0
    ? `${candidate.units_sold.toLocaleString("vi-VN")} lượt bán được ghi nhận trên nguồn`
    : "Có tồn kho tại thời điểm kiểm tra";
  const discountText = candidate.discount_percent > 0
    ? `giá đang thấp hơn khoảng ${candidate.discount_percent}% so với giá gốc hiển thị`
    : "giá được đối chiếu tại thời điểm cập nhật";
  return {
    id,
    name: candidate.title,
    category: candidate.category,
    visual: candidate.visual,
    summary: `${candidate.title} từ ${candidate.shop_name}; ${soldText}, ${discountText}. Hệ thống tự chọn dựa trên độ phù hợp, sức bán và tính khả dụng.`,
    price_min: candidate.price_min,
    price_max: candidate.price_max,
    currency: "VND",
    best_for: candidate.best_for,
    avoid_if: candidate.avoid_if,
    pros: [
      soldText,
      candidate.discount_percent > 0 ? `Mức giảm hiển thị khoảng ${candidate.discount_percent}%` : "Đã kiểm tra tồn kho",
      `Được Autopilot xếp hạng ${candidate.opportunity_score}/100`
    ],
    cons: [
      "Giá, tồn kho và chính sách có thể thay đổi tại nơi bán",
      "Cần đọc đánh giá gần nhất và kiểm tra thông số trước khi đặt hàng"
    ],
    tags: [...new Set([candidate.keyword, candidate.shop_name, "autopilot", "accesstrade"])],
    priorities: candidate.priorities,
    merchant: candidate.shop_name,
    merchant_url: candidate.detail_link,
    affiliate_url: affiliateUrl,
    featured: rank < 2,
    published: true,
    votes_base: Number(previous?.votes_base || 0),
    autopilot_managed: true,
    source: "accesstrade:tiktokshop",
    source_product_id: candidate.source_id,
    image_url: candidate.image_url,
    units_sold: candidate.units_sold,
    opportunity_score: candidate.opportunity_score,
    last_verified_at: now,
    created_at: previous?.created_at || now,
    updated_at: now
  };
}

async function readCatalog(env) {
  try {
    const raw = await env.KV.get(STORE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && Array.isArray(parsed.products)
      ? parsed
      : { version: 2, updated_at: new Date().toISOString(), products: [] };
  } catch (_) {
    return { version: 2, updated_at: new Date().toISOString(), products: [] };
  }
}

async function writeCatalog(env, products) {
  const document = { version: 2, updated_at: new Date().toISOString(), products: products.slice(0, 500) };
  await env.KV.put(STORE_KEY, JSON.stringify(document));
  return document;
}

async function notifyOwner(env, text) {
  const token = clean(env.TELEGRAM_BOT_TOKEN, 300);
  const chatId = clean(env.TELEGRAM_CHAT_ID, 80);
  if (!token || !chatId) return false;
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: clean(text, 3800),
        disable_web_page_preview: true
      })
    });
    return response.ok;
  } catch (_) {
    return false;
  }
}

async function writeStatus(env, patch) {
  const status = {
    version: 2,
    updated_at: new Date().toISOString(),
    ...patch
  };
  await env.KV.put(STATUS_KEY, JSON.stringify(status));
  return status;
}

async function readStatus(env) {
  try {
    const raw = await env.KV.get(STATUS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) { /* ignore */ }
  return {
    version: 2,
    mode: "not_started",
    configured: false,
    updated_at: "",
    last_run_at: "",
    next_action: "connect_accesstrade"
  };
}

async function ensureOnboardingNotice(env) {
  if (await env.KV.get(ONBOARDING_NOTICE_KEY)) return;
  await env.KV.put(ONBOARDING_NOTICE_KEY, "1", { expirationTtl: 7 * 24 * 60 * 60 });
  await notifyOwner(env, [
    "HỘI CHỌN ĐÚNG — AUTOPILOT CẦN KẾT NỐI MỘT LẦN",
    "",
    "1) Đăng nhập hoặc đăng ký miễn phí tại https://pub2.accesstrade.vn/",
    "2) Mở https://pub2.accesstrade.vn/profile/api_key",
    "3) Sao chép API key và gửi: /atkey <API_KEY>",
    "",
    "Bot sẽ xóa tin nhắn chứa key ngay sau khi mã hóa và lưu. Sau đó công ty tự chọn sản phẩm, tạo link và tối ưu; không cần nhập thủ công nữa."
  ].join("\n"));
}

export async function runChoiceAutopilot(env, options = {}) {
  const trigger = clean(options.trigger, 30) || "manual";
  const fetchImpl = options.fetchImpl || fetch;
  if (await env.KV.get(LOCK_KEY)) return { ok: false, skipped: "locked" };
  await env.KV.put(LOCK_KEY, String(Date.now()), { expirationTtl: LOCK_TTL });

  const startedAt = new Date().toISOString();
  const runId = startedAt.replace(/[:.]/g, "-");
  try {
    const credential = await getAccessToken(env);
    if (!credential.token) {
      const status = await writeStatus(env, {
        mode: "onboarding_required",
        configured: false,
        trigger,
        last_run_at: startedAt,
        credential_source: credential.source,
        next_action: "connect_accesstrade",
        onboarding_url: "https://pub2.accesstrade.vn/profile/api_key"
      });
      await ensureOnboardingNotice(env);
      return { ok: false, onboarding_required: true, status };
    }

    await validateAccessToken(credential.token, fetchImpl);
    const metrics = await fetchTransactions(credential.token, fetchImpl);
    const existing = await readCatalog(env);
    const previousBySource = new Map(
      existing.products
        .filter((product) => product?.source_product_id)
        .map((product) => [String(product.source_product_id), product])
    );

    const discovery = await Promise.all(PORTFOLIO.map(async (portfolio) => {
      const result = await fetchPortfolioCandidates(credential.token, portfolio, fetchImpl);
      result.candidates.forEach((candidate) => {
        candidate.opportunity_score = Math.min(100, Math.round(
          candidate.opportunity_score + performanceBoost(candidate, metrics)
        ));
      });
      result.candidates.sort((a, b) => b.opportunity_score - a.opportunity_score || b.units_sold - a.units_sold);
      return { portfolio, ...result };
    }));

    const selected = [];
    const errors = [];
    for (const group of discovery) {
      errors.push(...group.errors.map((error) => `${group.portfolio.id}:${error}`));
      const shortlist = group.candidates.slice(0, MAX_PRODUCTS_PER_CATEGORY * 2);
      let rank = 0;
      for (const candidate of shortlist) {
        if (rank >= MAX_PRODUCTS_PER_CATEGORY) break;
        try {
          const affiliateUrl = await createAffiliateLink(credential.token, candidate, runId, fetchImpl);
          if (!affiliateUrl) continue;
          selected.push(toProduct(candidate, affiliateUrl, rank, previousBySource.get(candidate.source_id)));
          rank += 1;
        } catch (error) {
          errors.push(`${candidate.source_id}:${clean(error?.message, 160)}`);
        }
      }
    }

    if (selected.length < PORTFOLIO.length) throw new Error("insufficient_verified_products");

    const preserved = existing.products.filter((product) => {
      if (product?.autopilot_managed || product?.source === "accesstrade:tiktokshop") return false;
      if (LEGACY_SEED_IDS.has(String(product?.id || ""))) return false;
      return true;
    });
    const document = await writeCatalog(env, [...selected, ...preserved]);

    const status = await writeStatus(env, {
      mode: "active",
      configured: true,
      trigger,
      credential_source: credential.source,
      last_run_at: startedAt,
      selected_products: selected.length,
      preserved_products: preserved.length,
      catalog_products: document.products.length,
      errors: errors.slice(0, 30),
      orders_7d: metrics.orders,
      commission_7d: metrics.commission,
      revenue_7d: metrics.revenue,
      next_run_hint: "every_6_hours"
    });

    if (trigger === "telegram_connect" || trigger === "manual") {
      await notifyOwner(env, [
        "HỘI CHỌN ĐÚNG — AUTOPILOT ĐÃ CHẠY",
        `Đã tự tuyển và gắn link: ${selected.length} sản phẩm`,
        `Đơn 7 ngày: ${metrics.orders}`,
        `Hoa hồng ghi nhận 7 ngày: ${metrics.commission.toLocaleString("vi-VN")}đ`,
        errors.length ? `Cảnh báo không chặn vận hành: ${errors.length}` : "Không có lỗi nguồn dữ liệu."
      ].join("\n"));
    }
    return { ok: true, status };
  } catch (error) {
    const status = await writeStatus(env, {
      mode: "error",
      configured: !!(await getAccessToken(env)).token,
      trigger,
      last_run_at: startedAt,
      error: clean(error?.message, 240) || "autopilot_failed",
      next_action: "automatic_retry"
    });
    await notifyOwner(env, `Hội Chọn Đúng Autopilot gặp lỗi và sẽ tự thử lại: ${status.error}`);
    return { ok: false, error: status.error, status };
  } finally {
    await env.KV.delete?.(LOCK_KEY);
  }
}

export async function handleChoiceAutopilotRequest(request, env) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/choice/autopilot/")) return null;

  if (url.pathname === "/api/choice/autopilot/status" && request.method === "GET") {
    const status = await readStatus(env);
    return json({
      mode: status.mode,
      configured: !!status.configured,
      updated_at: status.updated_at || "",
      last_run_at: status.last_run_at || "",
      selected_products: Number(status.selected_products || 0),
      catalog_products: Number(status.catalog_products || 0),
      orders_7d: Number(status.orders_7d || 0),
      next_run_hint: status.next_run_hint || "",
      needs_owner_login: status.mode === "onboarding_required"
    }, 200, { "cache-control": "public, max-age=60" });
  }

  return json({ error: "not_found" }, 404);
}

function send(chatId, text) {
  return { method: "sendMessage", body: { chat_id: chatId, text, disable_web_page_preview: true } };
}

function deleteMessage(chatId, messageId) {
  return { method: "deleteMessage", body: { chat_id: chatId, message_id: messageId } };
}

export async function handleChoiceAutopilotTelegram(update, env) {
  const message = update?.message;
  if (!message?.text) return null;
  const text = String(message.text).trim();
  const command = text.split(/\s+/, 1)[0].toLowerCase().split("@")[0];
  const chatId = message.chat?.id;
  const messageId = message.message_id;

  if (command === "/autopilot" || command === "/congty") {
    const status = await readStatus(env);
    const credential = await getAccessToken(env);
    const lines = [
      "HỘI CHỌN ĐÚNG — AFFILIATE AUTOPILOT",
      `Trạng thái: ${status.mode || "not_started"}`,
      `Kết nối AccessTrade: ${credential.token ? "đã kết nối" : "chưa kết nối"}`,
      `Lần chạy cuối: ${status.last_run_at || "chưa có"}`,
      `Sản phẩm đang vận hành: ${status.catalog_products || status.selected_products || 0}`,
      `Đơn 7 ngày: ${status.orders_7d || 0}`,
      `Hoa hồng 7 ngày: ${Number(status.commission_7d || 0).toLocaleString("vi-VN")}đ`
    ];
    if (!credential.token) {
      lines.push(
        "",
        "Chỉ cần kết nối một lần:",
        "1) https://pub2.accesstrade.vn/profile/api_key",
        "2) Gửi /atkey <API_KEY>",
        "Bot sẽ xóa tin nhắn chứa key ngay sau khi mã hóa."
      );
    } else {
      lines.push("", "Hệ thống tự chạy 6 giờ/lần. Không cần chọn sản phẩm hoặc gắn link thủ công.");
    }
    return { handled: true, calls: [send(chatId, lines.join("\n"))] };
  }

  if (command === "/atkey") {
    const token = clean(text.slice(text.indexOf(" ") + 1), 1200);
    const calls = [];
    if (Number.isInteger(messageId)) calls.push(deleteMessage(chatId, messageId));
    if (!token || token === text) {
      calls.push(send(chatId, "Thiếu API key. Mở https://pub2.accesstrade.vn/profile/api_key rồi gửi /atkey <API_KEY>."));
      return { handled: true, calls };
    }
    try {
      await validateAccessToken(token);
      await saveAccessToken(env, token);
      const result = await runChoiceAutopilot(env, { trigger: "telegram_connect" });
      calls.push(send(chatId, result.ok
        ? `Đã kết nối và tự vận hành ${result.status.selected_products} sản phẩm. Từ nay không cần gắn link hoặc chọn sản phẩm thủ công.`
        : `Đã lưu kết nối nhưng lần chạy đầu chưa đạt: ${result.error || "sẽ tự thử lại"}.`));
    } catch (error) {
      calls.push(send(chatId, `API key không hợp lệ hoặc AccessTrade chưa sẵn sàng: ${clean(error?.message, 160)}.`));
    }
    return { handled: true, calls };
  }

  if (command === "/autopilot-chay") {
    const result = await runChoiceAutopilot(env, { trigger: "manual" });
    return { handled: true, calls: [send(chatId, result.ok
      ? `Autopilot hoàn tất: ${result.status.selected_products} sản phẩm, ${result.status.orders_7d} đơn trong 7 ngày.`
      : result.onboarding_required
        ? "Chưa có kết nối AccessTrade. Gõ /autopilot để xem đúng bước kết nối một lần."
        : `Autopilot chưa đạt và sẽ tự thử lại: ${result.error || "unknown"}.`)] };
  }

  return null;
}

export const __test = {
  STORE_KEY,
  STATUS_KEY,
  CREDENTIAL_KEY,
  PORTFOLIO,
  slugify,
  safeUrl,
  normalizeCandidate,
  discountPercent,
  blockedTitle,
  encryptCredential,
  decryptCredential,
  saveAccessToken,
  getAccessToken,
  validateAccessToken,
  fetchPortfolioCandidates,
  createAffiliateLink,
  toProduct,
  readStatus
};
