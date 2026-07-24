import { CHOICE_CATEGORIES, SEED_PRODUCTS } from "../hoi-chon-dung/data/seed-products.js";

const STORE_KEY = "choice:catalog:v1";
const STORE_VERSION = 1;
const MAX_PRODUCTS = 500;
const MAX_MESSAGE = 3800;
const CATEGORY_IDS = new Set(CHOICE_CATEGORIES.map((item) => item.id));

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

function normalizeUrl(value) {
  const raw = clean(value, 1200);
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.username || url.password) return "";
    return url.toString();
  } catch (_) {
    return "";
  }
}

function numberValue(value, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, Math.round(value));
  const normalized = clean(value, 40).replace(/[^0-9]/g, "");
  return normalized ? Math.max(0, Number(normalized)) : fallback;
}

function boolValue(value, fallback = false) {
  if (typeof value === "boolean") return value;
  const normalized = stripVietnamese(clean(value, 20)).toLowerCase();
  if (["1", "true", "co", "yes", "bat", "hien", "x"].includes(normalized)) return true;
  if (["0", "false", "khong", "no", "tat", "an"].includes(normalized)) return false;
  return fallback;
}

function listValue(value, maxItems = 12, maxLength = 140) {
  const raw = Array.isArray(value) ? value : String(value || "").split(/[,;|]/);
  return [...new Set(raw.map((item) => clean(item, maxLength)).filter(Boolean))].slice(0, maxItems);
}

function categoryValue(value, fallback = "") {
  const normalized = slugify(value || fallback);
  return CATEGORY_IDS.has(normalized) ? normalized : "";
}

function publicProduct(product) {
  const affiliateUrl = normalizeUrl(product.affiliate_url);
  const merchantUrl = normalizeUrl(product.merchant_url);
  return {
    id: slugify(product.id),
    name: clean(product.name, 140),
    category: categoryValue(product.category),
    visual: clean(product.visual, 8) || "◇",
    summary: clean(product.summary, 700),
    price_min: numberValue(product.price_min),
    price_max: numberValue(product.price_max),
    currency: clean(product.currency, 8) || "VND",
    best_for: listValue(product.best_for),
    avoid_if: listValue(product.avoid_if),
    pros: listValue(product.pros),
    cons: listValue(product.cons),
    tags: listValue(product.tags, 16, 60),
    priorities: listValue(product.priorities, 16, 60).map(slugify).filter(Boolean),
    merchant: clean(product.merchant, 80) || "Nơi bán",
    merchant_url: merchantUrl,
    affiliate_url: affiliateUrl,
    link_ready: !!(affiliateUrl || merchantUrl),
    link_type: affiliateUrl ? "affiliate" : merchantUrl ? "reference" : "none",
    featured: !!product.featured,
    published: !!product.published,
    votes_base: numberValue(product.votes_base),
    created_at: clean(product.created_at, 40),
    updated_at: clean(product.updated_at, 40)
  };
}

function normalizeProduct(input, previous = null) {
  const now = new Date().toISOString();
  const name = clean(input.name ?? previous?.name, 140);
  const category = categoryValue(input.category, previous?.category);
  const summary = clean(input.summary ?? previous?.summary, 700);
  if (!name || !category || !summary) return null;

  const id = slugify(input.id ?? previous?.id ?? name);
  if (!id) return null;

  const priceMin = numberValue(input.price_min ?? previous?.price_min);
  const priceMaxRaw = numberValue(input.price_max ?? previous?.price_max, priceMin);
  const priceMax = Math.max(priceMin, priceMaxRaw);

  return publicProduct({
    id,
    name,
    category,
    visual: input.visual ?? previous?.visual ?? "◇",
    summary,
    price_min: priceMin,
    price_max: priceMax,
    currency: input.currency ?? previous?.currency ?? "VND",
    best_for: input.best_for ?? previous?.best_for ?? [],
    avoid_if: input.avoid_if ?? previous?.avoid_if ?? [],
    pros: input.pros ?? previous?.pros ?? [],
    cons: input.cons ?? previous?.cons ?? [],
    tags: input.tags ?? previous?.tags ?? [],
    priorities: input.priorities ?? previous?.priorities ?? [],
    merchant: input.merchant ?? previous?.merchant ?? "Nơi bán",
    merchant_url: input.merchant_url ?? previous?.merchant_url ?? "",
    affiliate_url: input.affiliate_url ?? previous?.affiliate_url ?? "",
    featured: input.featured === undefined ? !!previous?.featured : boolValue(input.featured),
    published: input.published === undefined ? (previous ? !!previous.published : true) : boolValue(input.published, true),
    votes_base: input.votes_base ?? previous?.votes_base ?? 0,
    created_at: previous?.created_at || now,
    updated_at: now
  });
}

function seedDocument() {
  const now = new Date().toISOString();
  return {
    version: STORE_VERSION,
    updated_at: now,
    products: SEED_PRODUCTS.map((product) => publicProduct({
      ...product,
      created_at: product.created_at || now,
      updated_at: product.updated_at || now
    }))
  };
}

async function readDocument(env) {
  const raw = await env.KV.get(STORE_KEY);
  if (!raw) {
    const initial = seedDocument();
    await env.KV.put(STORE_KEY, JSON.stringify(initial));
    return initial;
  }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.products)) throw new Error("invalid_store");
    return {
      version: STORE_VERSION,
      updated_at: clean(parsed.updated_at, 40) || new Date().toISOString(),
      products: parsed.products.map(publicProduct).filter((item) => item.id && item.name).slice(0, MAX_PRODUCTS)
    };
  } catch (_) {
    const fallback = seedDocument();
    await env.KV.put(`${STORE_KEY}:corrupt:${Date.now()}`, raw.slice(0, 30000), { expirationTtl: 7 * 24 * 60 * 60 });
    await env.KV.put(STORE_KEY, JSON.stringify(fallback));
    return fallback;
  }
}

async function writeDocument(env, products) {
  const document = {
    version: STORE_VERSION,
    updated_at: new Date().toISOString(),
    products: products.slice(0, MAX_PRODUCTS).map(publicProduct)
  };
  await env.KV.put(STORE_KEY, JSON.stringify(document));
  return document;
}

async function digestHex(value) {
  const bytes = new TextEncoder().encode(String(value));
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return [...digest].map((item) => item.toString(16).padStart(2, "0")).join("");
}

async function anonymousKey(request, env, scope) {
  const raw = [
    String(env.SESSION_SECRET || "choice-public"),
    scope,
    request.headers.get("cf-connecting-ip") || "",
    request.headers.get("user-agent") || ""
  ].join(":");
  return digestHex(raw);
}

async function readCount(env, key) {
  const raw = await env.KV.get(key);
  const value = Number(raw || 0);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

async function incrementCount(env, key) {
  const next = (await readCount(env, key)) + 1;
  await env.KV.put(key, String(next));
  return next;
}

function normalizeSearch(value) {
  return stripVietnamese(value).toLowerCase().replace(/\s+/g, " ").trim();
}

function sortProducts(products) {
  return [...products].sort((a, b) => Number(b.featured) - Number(a.featured)
    || Number(b.votes || b.votes_base) - Number(a.votes || a.votes_base)
    || a.name.localeCompare(b.name, "vi"));
}

async function withLiveStats(env, products) {
  return Promise.all(products.map(async (product) => {
    const [votesAdded, clicks] = await Promise.all([
      readCount(env, `choice:votes:${product.id}`),
      readCount(env, `choice:click-total:${product.id}`)
    ]);
    const safe = publicProduct(product);
    delete safe.affiliate_url;
    delete safe.merchant_url;
    return {
      ...safe,
      votes: safe.votes_base + votesAdded,
      clicks,
      outbound_path: safe.link_ready ? `/r/choice/${safe.id}` : ""
    };
  }));
}

async function handleVote(request, env) {
  const body = await request.json().catch(() => null);
  const id = slugify(body?.product_id);
  if (!id) return json({ error: "invalid_request" }, 400);
  const document = await readDocument(env);
  const product = document.products.find((item) => item.id === id && item.published);
  if (!product) return json({ error: "not_found" }, 404);

  const day = new Date().toISOString().slice(0, 10);
  const fingerprint = await anonymousKey(request, env, `vote:${id}:${day}`);
  const dedupeKey = `choice:vote-dedupe:${fingerprint}`;
  const existed = await env.KV.get(dedupeKey);
  if (!existed) {
    await env.KV.put(dedupeKey, "1", { expirationTtl: 24 * 60 * 60 });
    await incrementCount(env, `choice:votes:${id}`);
  }
  const votesAdded = await readCount(env, `choice:votes:${id}`);
  return json({ ok: true, duplicate: !!existed, product_id: id, votes: product.votes_base + votesAdded });
}

async function handleRedirect(request, env, id) {
  const document = await readDocument(env);
  const product = document.products.find((item) => item.id === id && item.published);
  if (!product) return json({ error: "not_found" }, 404);
  const target = normalizeUrl(product.affiliate_url) || normalizeUrl(product.merchant_url);
  if (!target) return json({ error: "link_unavailable" }, 404);

  const windowKey = Math.floor(Date.now() / (5 * 60 * 1000));
  const fingerprint = await anonymousKey(request, env, `click:${id}:${windowKey}`);
  const dedupeKey = `choice:click-dedupe:${fingerprint}`;
  if (!await env.KV.get(dedupeKey)) {
    await env.KV.put(dedupeKey, "1", { expirationTtl: 5 * 60 });
    const day = new Date().toISOString().slice(0, 10);
    await Promise.all([
      incrementCount(env, `choice:click-total:${id}`),
      incrementCount(env, `choice:click-day:${day}:${id}`)
    ]);
  }

  return new Response(null, {
    status: 302,
    headers: {
      location: target,
      "cache-control": "no-store",
      "referrer-policy": "no-referrer",
      "x-robots-tag": "noindex, nofollow"
    }
  });
}

function splitMessages(text, max = MAX_MESSAGE) {
  const lines = String(text || "").split("\n");
  const chunks = [];
  let current = "";
  for (const line of lines) {
    const addition = current ? `\n${line}` : line;
    if (current && current.length + addition.length > max) {
      chunks.push(current);
      current = line;
    } else {
      current += addition;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

const FIELD_ALIASES = Object.freeze({
  "ten": "name", "tên": "name",
  "id": "id",
  "danh muc": "category", "danh mục": "category", "loai": "category", "loại": "category",
  "bieu tuong": "visual", "biểu tượng": "visual",
  "mo ta": "summary", "mô tả": "summary", "tom tat": "summary", "tóm tắt": "summary",
  "gia tu": "price_min", "giá từ": "price_min",
  "gia den": "price_max", "giá đến": "price_max",
  "tot cho": "best_for", "tốt cho": "best_for",
  "khong hop": "avoid_if", "không hợp": "avoid_if",
  "uu diem": "pros", "ưu điểm": "pros",
  "nhuoc diem": "cons", "nhược điểm": "cons",
  "tag": "tags", "the": "tags", "thẻ": "tags",
  "uu tien": "priorities", "ưu tiên": "priorities",
  "noi ban": "merchant", "nơi bán": "merchant",
  "link tham khao": "merchant_url", "link tham khảo": "merchant_url",
  "link affiliate": "affiliate_url", "affiliate": "affiliate_url",
  "noi bat": "featured", "nổi bật": "featured",
  "cong khai": "published", "công khai": "published"
});

function parseFields(text) {
  const result = {};
  const lines = String(text || "").replace(/\r/g, "").split("\n").slice(1);
  for (const line of lines) {
    const match = line.match(/^\s*([^:：]+)\s*[:：]\s*(.+?)\s*$/);
    if (!match) continue;
    const label = stripVietnamese(match[1]).toLowerCase().replace(/\s+/g, " ").trim();
    const originalLabel = match[1].toLowerCase().replace(/\s+/g, " ").trim();
    const field = FIELD_ALIASES[originalLabel] || FIELD_ALIASES[label];
    if (!field) continue;
    result[field] = clean(match[2], 1500);
  }
  for (const field of ["best_for", "avoid_if", "pros", "cons", "tags", "priorities"]) {
    if (field in result) result[field] = listValue(result[field]);
  }
  return result;
}

function commandOf(text) {
  const first = String(text || "").trim().split(/\s+/, 1)[0].toLowerCase().split("@")[0];
  return { command: first, arg: String(text || "").trim().slice(first.length).trim().split("\n")[0].trim() };
}

function ownerIds(update) {
  const message = update?.message || update?.callback_query?.message;
  const actor = update?.message?.from || update?.callback_query?.from;
  return { chatId: message?.chat?.id, fromId: actor?.id, message, callback: update?.callback_query };
}

function isOwnerUpdate(update, env) {
  const { chatId, fromId } = ownerIds(update);
  const owner = String(env.TELEGRAM_CHAT_ID || "");
  return !!owner && String(chatId) === owner && String(fromId) === owner;
}

function send(chatId, text, extra = {}) {
  return { method: "sendMessage", body: { chat_id: chatId, text, disable_web_page_preview: true, ...extra } };
}

function callbackAnswer(id, text) {
  return { method: "answerCallbackQuery", body: { callback_query_id: id, text } };
}

function callbackEdit(chatId, messageId, text) {
  return { method: "editMessageText", body: { chat_id: chatId, message_id: messageId, text } };
}

function helpText() {
  return [
    "HỘI CHỌN ĐÚNG — QUẢN LÝ SẢN PHẨM",
    "",
    "/dssp — danh sách sản phẩm",
    "/xemsp <id> — xem chi tiết",
    "/thongkesp — tổng số sản phẩm, lượt chọn và click",
    "/ansp <id> · /hiensp <id> — ẩn/hiện",
    "/xoasp <id> — xóa có xác nhận",
    "",
    "Thêm sản phẩm:",
    "/themsp",
    "Tên: ...",
    "Danh mục: tarot | creator | 3d",
    "Mô tả: ...",
    "Giá từ: 300000",
    "Giá đến: 600000",
    "Tốt cho: người mới; quay video",
    "Không hợp: ...",
    "Ưu điểm: ...",
    "Nhược điểm: ...",
    "Tag: ...",
    "Ưu tiên: de-dung; gia-tot",
    "Nơi bán: ...",
    "Link tham khảo: https://...",
    "Link affiliate: https://...",
    "Nổi bật: có",
    "Công khai: có",
    "",
    "Sửa sản phẩm:",
    "/suasp <id>",
    "Link affiliate: https://...",
    "Mô tả: ..."
  ].join("\n");
}

function formatProduct(product, votes = null, clicks = null) {
  const lines = [
    `${product.published ? "🟢" : "⚫️"} ${product.name}`,
    `ID: ${product.id}`,
    `Danh mục: ${product.category}`,
    `Giá: ${product.price_min.toLocaleString("vi-VN")}–${product.price_max.toLocaleString("vi-VN")} ${product.currency}`,
    product.summary,
    `Link: ${product.affiliate_url ? "affiliate" : product.merchant_url ? "tham khảo" : "chưa có"}`,
    votes === null ? "" : `Lượt chọn: ${votes}`,
    clicks === null ? "" : `Click: ${clicks}`
  ];
  return lines.filter(Boolean).join("\n");
}

function uniqueId(products, preferred) {
  const base = slugify(preferred) || `san-pham-${Date.now()}`;
  let candidate = base;
  let counter = 2;
  while (products.some((item) => item.id === candidate)) candidate = `${base}-${counter++}`;
  return candidate;
}

async function handleMessageCommand(update, env) {
  const { chatId, message } = ownerIds(update);
  const text = message?.text || "";
  const { command, arg } = commandOf(text);
  const supported = new Set(["/chon", "/hoichondung", "/dssp", "/xemsp", "/themsp", "/suasp", "/ansp", "/hiensp", "/xoasp", "/thongkesp"]);
  if (!supported.has(command)) return null;

  const document = await readDocument(env);
  const products = [...document.products];

  if (["/chon", "/hoichondung"].includes(command)) return { handled: true, calls: [send(chatId, helpText())] };

  if (command === "/dssp") {
    const category = categoryValue(arg);
    const visible = sortProducts(products.filter((item) => !category || item.category === category));
    const lines = visible.map((item, index) => `${index + 1}. ${item.published ? "🟢" : "⚫️"} ${item.name}\n   ${item.id} · ${item.category}`);
    return { handled: true, calls: splitMessages([`DANH SÁCH ${visible.length} SẢN PHẨM`, "", ...lines].join("\n")).map((chunk) => send(chatId, chunk)) };
  }

  if (command === "/xemsp") {
    const product = products.find((item) => item.id === slugify(arg));
    if (!product) return { handled: true, calls: [send(chatId, "Không tìm thấy ID. Dùng /dssp để xem danh sách.")] };
    const [votesAdded, clicks] = await Promise.all([
      readCount(env, `choice:votes:${product.id}`),
      readCount(env, `choice:click-total:${product.id}`)
    ]);
    return { handled: true, calls: [send(chatId, formatProduct(product, product.votes_base + votesAdded, clicks))] };
  }

  if (command === "/thongkesp") {
    const stats = await Promise.all(products.map(async (product) => ({
      product,
      votes: product.votes_base + await readCount(env, `choice:votes:${product.id}`),
      clicks: await readCount(env, `choice:click-total:${product.id}`)
    })));
    stats.sort((a, b) => b.clicks - a.clicks || b.votes - a.votes);
    const lines = stats.slice(0, 20).map((item, index) => `${index + 1}. ${item.product.name}: ${item.clicks} click · ${item.votes} chọn`);
    return { handled: true, calls: splitMessages([
      "THỐNG KÊ HỘI CHỌN ĐÚNG",
      `Tổng sản phẩm: ${products.length}`,
      `Đang công khai: ${products.filter((item) => item.published).length}`,
      "",
      ...lines
    ].join("\n")).map((chunk) => send(chatId, chunk)) };
  }

  if (command === "/themsp") {
    if (products.length >= MAX_PRODUCTS) return { handled: true, calls: [send(chatId, "Kho đã đạt giới hạn 500 sản phẩm.")] };
    const fields = parseFields(text);
    if (!fields.name || !fields.category || !fields.summary) {
      return { handled: true, calls: [send(chatId, "Thiếu trường bắt buộc: Tên, Danh mục, Mô tả. Gõ /chon để xem mẫu.")] };
    }
    fields.id = uniqueId(products, fields.id || fields.name);
    const product = normalizeProduct(fields);
    if (!product) return { handled: true, calls: [send(chatId, "Dữ liệu không hợp lệ. Link chỉ nhận https:// và danh mục phải là tarot, creator hoặc 3d.")] };
    await writeDocument(env, [...products, product]);
    return { handled: true, calls: [send(chatId, `Đã thêm sản phẩm.\n\n${formatProduct(product)}`)] };
  }

  if (command === "/suasp") {
    const id = slugify(arg);
    const index = products.findIndex((item) => item.id === id);
    if (index < 0) return { handled: true, calls: [send(chatId, "Không tìm thấy ID. Dùng /dssp để xem danh sách.")] };
    const fields = parseFields(text);
    if (!Object.keys(fields).length) return { handled: true, calls: [send(chatId, "Chưa có trường cần sửa. Gõ /chon để xem mẫu.")] };
    fields.id = products[index].id;
    const updated = normalizeProduct(fields, products[index]);
    if (!updated) return { handled: true, calls: [send(chatId, "Dữ liệu sửa không hợp lệ.")] };
    products[index] = updated;
    await writeDocument(env, products);
    return { handled: true, calls: [send(chatId, `Đã cập nhật.\n\n${formatProduct(updated)}`)] };
  }

  if (command === "/ansp" || command === "/hiensp") {
    const id = slugify(arg);
    const index = products.findIndex((item) => item.id === id);
    if (index < 0) return { handled: true, calls: [send(chatId, "Không tìm thấy ID. Dùng /dssp để xem danh sách.")] };
    const published = command === "/hiensp";
    products[index] = normalizeProduct({ id, published }, products[index]);
    await writeDocument(env, products);
    return { handled: true, calls: [send(chatId, `${published ? "Đã hiện" : "Đã ẩn"} “${products[index].name}” trên web.`)] };
  }

  if (command === "/xoasp") {
    const id = slugify(arg);
    const product = products.find((item) => item.id === id);
    if (!product) return { handled: true, calls: [send(chatId, "Không tìm thấy ID. Dùng /dssp để xem danh sách.")] };
    return {
      handled: true,
      calls: [send(chatId, `Xác nhận xóa vĩnh viễn “${product.name}” (${product.id})?`, {
        reply_markup: { inline_keyboard: [[
          { text: "🗑 Xóa", callback_data: `choice:delete:${product.id}` },
          { text: "Hủy", callback_data: `choice:cancel:${product.id}` }
        ]] }
      })]
    };
  }

  return null;
}

async function handleCallback(update, env) {
  const { chatId, callback } = ownerIds(update);
  const data = String(callback?.data || "");
  if (!data.startsWith("choice:")) return null;
  const [, action, rawId] = data.split(":");
  const id = slugify(rawId);
  const messageId = callback?.message?.message_id;
  if (!callback?.id || !Number.isInteger(messageId)) return { handled: true, calls: [] };

  if (action === "cancel") return {
    handled: true,
    calls: [callbackAnswer(callback.id, "Đã hủy"), callbackEdit(chatId, messageId, "Đã hủy yêu cầu xóa sản phẩm.")]
  };

  if (action === "delete") {
    const document = await readDocument(env);
    const product = document.products.find((item) => item.id === id);
    if (!product) return {
      handled: true,
      calls: [callbackAnswer(callback.id, "Sản phẩm không còn tồn tại"), callbackEdit(chatId, messageId, "Sản phẩm đã được xóa trước đó.")]
    };
    await writeDocument(env, document.products.filter((item) => item.id !== id));
    return {
      handled: true,
      calls: [callbackAnswer(callback.id, "Đã xóa"), callbackEdit(chatId, messageId, `Đã xóa vĩnh viễn “${product.name}” (${product.id}).`)]
    };
  }

  return { handled: true, calls: [callbackAnswer(callback.id, "Lệnh không hợp lệ")] };
}

export async function handleChoiceTelegramUpdate(update, env) {
  if (!update || !isOwnerUpdate(update, env)) return null;
  if (update.callback_query) return handleCallback(update, env);
  if (update.message?.text) return handleMessageCommand(update, env);
  return null;
}

export async function handleChoiceRequest(request, env) {
  const url = new URL(request.url);
  const isApi = url.pathname.startsWith("/api/choice/");
  const isRedirect = url.pathname.startsWith("/r/choice/");
  if (!isApi && !isRedirect) return null;

  if (isRedirect && request.method === "GET") {
    return handleRedirect(request, env, slugify(url.pathname.slice("/r/choice/".length)));
  }

  if (url.pathname === "/api/choice/health" && request.method === "GET") {
    return json({ ok: true, service: "hoi-chon-dung", version: STORE_VERSION }, 200, { "cache-control": "public, max-age=60" });
  }

  if (url.pathname === "/api/choice/products" && request.method === "GET") {
    const document = await readDocument(env);
    const q = normalizeSearch(url.searchParams.get("q"));
    const category = categoryValue(url.searchParams.get("category"));
    const products = document.products.filter((product) => {
      if (!product.published) return false;
      if (category && product.category !== category) return false;
      if (!q) return true;
      return normalizeSearch([
        product.name,
        product.summary,
        product.tags.join(" "),
        product.best_for.join(" "),
        product.priorities.join(" ")
      ].join(" ")).includes(q);
    });
    const enriched = sortProducts(await withLiveStats(env, products));
    return json({ products: enriched, count: enriched.length, updated_at: document.updated_at, version: document.version }, 200, {
      "cache-control": "public, max-age=45, stale-while-revalidate=180"
    });
  }

  if (url.pathname === "/api/choice/meta" && request.method === "GET") {
    const document = await readDocument(env);
    return json({
      count: document.products.filter((item) => item.published).length,
      categories: CHOICE_CATEGORIES,
      disclosure: "Hội Chọn Đúng có thể nhận hoa hồng khi người dùng mua qua một số liên kết. Giá mua không tăng vì khoản hoa hồng này."
    }, 200, { "cache-control": "public, max-age=300" });
  }

  if (url.pathname === "/api/choice/vote" && request.method === "POST") return handleVote(request, env);

  return json({ error: "not_found" }, 404);
}

export const __test = {
  STORE_KEY,
  slugify,
  normalizeUrl,
  normalizeProduct,
  parseFields,
  commandOf,
  readDocument,
  writeDocument,
  isOwnerUpdate,
  handleVote,
  handleRedirect,
  splitMessages
};
