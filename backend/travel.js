import { SEED_PLACES } from "../vietnam-travel/data/seed-places.js";

const STORE_KEY = "travel:places:v1";
const STORE_VERSION = 1;
const MAX_PLACES = 1000;
const MAX_MESSAGE = 3800;
const CATEGORY_LABELS = Object.freeze({
  "di-san": "Di sản",
  "thien-nhien": "Thiên nhiên",
  "bien-dao": "Biển đảo",
  "van-hoa": "Văn hóa",
  "tam-linh": "Tâm linh",
  "phieu-luu": "Phiêu lưu",
  "do-thi": "Đô thị",
  "am-thuc": "Ẩm thực",
  "song-nuoc": "Sông nước",
  "nghi-duong": "Nghỉ dưỡng",
  "lich-su": "Lịch sử"
});

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

function cleanMultiline(value, max = 1500) {
  return String(value ?? "")
    .replace(/\r/g, "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " ")
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
  const raw = clean(value, 800);
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return "";
    if (url.username || url.password) return "";
    return url.toString();
  } catch (_) {
    return "";
  }
}

function normalizeCategories(value) {
  const raw = Array.isArray(value) ? value : String(value || "").split(/[,;|]/);
  return [...new Set(raw.map((item) => slugify(clean(item, 40))).filter(Boolean))].slice(0, 10);
}

function normalizeHighlights(value) {
  const raw = Array.isArray(value) ? value : String(value || "").split(/[,;|]/);
  return raw.map((item) => clean(item, 120)).filter(Boolean).slice(0, 12);
}

function boolValue(value, fallback = false) {
  if (typeof value === "boolean") return value;
  const normalized = stripVietnamese(clean(value, 20)).toLowerCase();
  if (["1", "true", "co", "yes", "x", "bat", "hien"].includes(normalized)) return true;
  if (["0", "false", "khong", "no", "tat", "an"].includes(normalized)) return false;
  return fallback;
}

function publicPlace(place) {
  return {
    id: clean(place.id, 80),
    name: clean(place.name, 120),
    province: clean(place.province, 100),
    region: clean(place.region, 60),
    categories: normalizeCategories(place.categories),
    summary: clean(place.summary, 650),
    highlights: normalizeHighlights(place.highlights),
    best_time: clean(place.best_time, 300),
    duration: clean(place.duration, 120),
    address: clean(place.address, 300),
    map_url: normalizeUrl(place.map_url),
    image_url: normalizeUrl(place.image_url),
    source_url: normalizeUrl(place.source_url),
    tips: clean(place.tips, 600),
    featured: !!place.featured,
    published: !!place.published,
    created_at: clean(place.created_at, 40),
    updated_at: clean(place.updated_at, 40)
  };
}

function normalizePlace(input, previous = null) {
  const now = new Date().toISOString();
  const name = clean(input.name ?? previous?.name, 120);
  const province = clean(input.province ?? previous?.province, 100);
  const region = clean(input.region ?? previous?.region, 60);
  const summary = clean(input.summary ?? previous?.summary, 650);
  if (!name || !province || !region || !summary) return null;

  const rawId = clean(input.id ?? previous?.id, 80);
  const id = slugify(rawId || name);
  if (!id) return null;
  const query = encodeURIComponent([name, province].filter(Boolean).join(" "));

  return publicPlace({
    id,
    name,
    province,
    region,
    summary,
    categories: input.categories ?? previous?.categories ?? [],
    highlights: input.highlights ?? previous?.highlights ?? [],
    best_time: input.best_time ?? previous?.best_time ?? "",
    duration: input.duration ?? previous?.duration ?? "",
    address: input.address ?? previous?.address ?? "",
    map_url: input.map_url ?? previous?.map_url ?? `https://www.google.com/maps/search/?api=1&query=${query}`,
    image_url: input.image_url ?? previous?.image_url ?? "",
    source_url: input.source_url ?? previous?.source_url ?? "",
    tips: input.tips ?? previous?.tips ?? "",
    featured: input.featured === undefined ? !!previous?.featured : boolValue(input.featured),
    published: input.published === undefined ? (previous ? !!previous.published : true) : boolValue(input.published, true),
    created_at: previous?.created_at || now,
    updated_at: now
  });
}

function seedDocument() {
  const now = new Date().toISOString();
  return {
    version: STORE_VERSION,
    updated_at: now,
    places: SEED_PLACES.map((place) => publicPlace({
      ...place,
      created_at: place.created_at || now,
      updated_at: place.updated_at || now
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
    if (!parsed || !Array.isArray(parsed.places)) throw new Error("invalid_store");
    const places = parsed.places.map((place) => publicPlace(place)).filter((place) => place.id && place.name);
    return {
      version: STORE_VERSION,
      updated_at: clean(parsed.updated_at, 40) || new Date().toISOString(),
      places: places.slice(0, MAX_PLACES)
    };
  } catch (_) {
    const fallback = seedDocument();
    await env.KV.put(`${STORE_KEY}:corrupt:${Date.now()}`, raw.slice(0, 20000), { expirationTtl: 7 * 24 * 60 * 60 });
    await env.KV.put(STORE_KEY, JSON.stringify(fallback));
    return fallback;
  }
}

async function writeDocument(env, places) {
  const document = {
    version: STORE_VERSION,
    updated_at: new Date().toISOString(),
    places: places.slice(0, MAX_PLACES).map(publicPlace)
  };
  await env.KV.put(STORE_KEY, JSON.stringify(document));
  return document;
}

function normalizeSearch(value) {
  return stripVietnamese(value).toLowerCase().replace(/\s+/g, " ").trim();
}

function sortPlaces(places) {
  return [...places].sort((a, b) => Number(b.featured) - Number(a.featured)
    || a.name.localeCompare(b.name, "vi"));
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

function ownerIds(update) {
  const message = update?.message || update?.callback_query?.message;
  const actor = update?.message?.from || update?.callback_query?.from;
  return {
    chatId: message?.chat?.id,
    fromId: actor?.id,
    message,
    callback: update?.callback_query
  };
}

function isOwnerUpdate(update, env) {
  const { chatId, fromId } = ownerIds(update);
  const owner = String(env.TELEGRAM_CHAT_ID || "");
  return !!owner && String(chatId) === owner && String(fromId) === owner;
}

const FIELD_ALIASES = Object.freeze({
  "ten": "name",
  "tên": "name",
  "tinh": "province",
  "tỉnh": "province",
  "thanh pho": "province",
  "thành phố": "province",
  "vung": "region",
  "vùng": "region",
  "loai": "categories",
  "loại": "categories",
  "danh muc": "categories",
  "danh mục": "categories",
  "mo ta": "summary",
  "mô tả": "summary",
  "tom tat": "summary",
  "tóm tắt": "summary",
  "noi bat": "highlights",
  "nổi bật": "highlights",
  "diem noi bat": "highlights",
  "điểm nổi bật": "highlights",
  "thoi diem dep": "best_time",
  "thời điểm đẹp": "best_time",
  "thoi gian dep": "best_time",
  "thời gian đẹp": "best_time",
  "thoi luong": "duration",
  "thời lượng": "duration",
  "dia chi": "address",
  "địa chỉ": "address",
  "ban do": "map_url",
  "bản đồ": "map_url",
  "map": "map_url",
  "anh": "image_url",
  "ảnh": "image_url",
  "nguon": "source_url",
  "nguồn": "source_url",
  "meo": "tips",
  "mẹo": "tips",
  "luu y": "tips",
  "lưu ý": "tips",
  "noi bat trang chu": "featured",
  "nổi bật trang chủ": "featured",
  "featured": "featured",
  "cong khai": "published",
  "công khai": "published",
  "published": "published",
  "id": "id"
});

function parseFields(text) {
  const result = {};
  const lines = cleanMultiline(text, 10000).split("\n").slice(1);
  let lastKey = "";
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const match = line.match(/^([^:：]{1,40})[:：]\s*(.*)$/);
    if (match) {
      const label = stripVietnamese(match[1]).toLowerCase().replace(/\s+/g, " ").trim();
      const key = FIELD_ALIASES[label] || FIELD_ALIASES[match[1].toLowerCase().trim()];
      if (key) {
        result[key] = match[2].trim();
        lastKey = key;
      }
    } else if (lastKey && ["summary", "tips"].includes(lastKey)) {
      result[lastKey] = `${result[lastKey]} ${line}`.trim();
    }
  }
  if (result.categories !== undefined) result.categories = normalizeCategories(result.categories);
  if (result.highlights !== undefined) result.highlights = normalizeHighlights(result.highlights);
  return result;
}

function commandOf(text) {
  const firstLine = String(text || "").trim().split("\n", 1)[0];
  const [head, ...rest] = firstLine.split(/\s+/);
  const command = head.toLowerCase().replace(/@[^\s]+$/, "");
  return { command, arg: clean(rest.join(" "), 100) };
}

function helpText() {
  return [
    "QUẢN TRỊ ĐỊA ĐIỂM DU LỊCH VIỆT NAM",
    "",
    "/travel — mở hướng dẫn này",
    "/ds — danh sách địa điểm",
    "/xem <id> — xem chi tiết",
    "/thongke — thống kê dữ liệu",
    "/an <id> — ẩn khỏi web",
    "/hien <id> — hiện trên web",
    "/xoa <id> — yêu cầu xác nhận xóa",
    "",
    "THÊM ĐỊA ĐIỂM:",
    "/them",
    "Tên: ...",
    "Tỉnh: ...",
    "Vùng: Miền Bắc/Miền Trung/Tây Nguyên/Miền Nam",
    "Loại: thiên nhiên, văn hóa, tâm linh...",
    "Mô tả: ...",
    "Điểm nổi bật: mục 1, mục 2",
    "Thời điểm đẹp: ...",
    "Thời lượng: ...",
    "Địa chỉ: ...",
    "Bản đồ: https://...",
    "Ảnh: https://...",
    "Nguồn: https://...",
    "Mẹo: ...",
    "",
    "SỬA ĐỊA ĐIỂM:",
    "/sua <id>",
    "Mô tả: nội dung mới",
    "Ảnh: https://...",
    "",
    "Chỉ tài khoản Telegram chủ bot mới thực hiện được lệnh quản trị."
  ].join("\n");
}

function formatPlace(place) {
  return [
    `${place.published ? "🟢" : "⚫️"} ${place.name}`,
    `ID: ${place.id}`,
    `Tỉnh/TP: ${place.province}`,
    `Vùng: ${place.region}`,
    `Loại: ${(place.categories || []).map((id) => CATEGORY_LABELS[id] || id).join(", ") || "—"}`,
    `Mô tả: ${place.summary}`,
    place.highlights?.length ? `Nổi bật: ${place.highlights.join(" · ")}` : "",
    place.best_time ? `Thời điểm: ${place.best_time}` : "",
    place.duration ? `Thời lượng: ${place.duration}` : "",
    place.address ? `Địa chỉ: ${place.address}` : "",
    place.tips ? `Mẹo: ${place.tips}` : "",
    place.map_url ? `Bản đồ: ${place.map_url}` : "",
    place.image_url ? `Ảnh: ${place.image_url}` : "",
    place.source_url ? `Nguồn: ${place.source_url}` : "",
    `Cập nhật: ${place.updated_at || "—"}`
  ].filter(Boolean).join("\n");
}

function send(chatId, text, extra = {}) {
  return { method: "sendMessage", body: { chat_id: chatId, text, disable_web_page_preview: true, ...extra } };
}

function callbackAnswer(callbackId, text) {
  return { method: "answerCallbackQuery", body: { callback_query_id: callbackId, text } };
}

function callbackEdit(chatId, messageId, text) {
  return { method: "editMessageText", body: { chat_id: chatId, message_id: messageId, text, disable_web_page_preview: true } };
}

function uniqueId(places, base) {
  const root = slugify(base) || `dia-diem-${Date.now()}`;
  let id = root;
  let suffix = 2;
  const ids = new Set(places.map((place) => place.id));
  while (ids.has(id)) id = `${root}-${suffix++}`;
  return id;
}

async function handleMessageCommand(update, env) {
  const { chatId, message } = ownerIds(update);
  const text = message?.text || "";
  const { command, arg } = commandOf(text);
  const supported = new Set(["/travel", "/dulich", "/diadiem", "/ds", "/xem", "/them", "/sua", "/xoa", "/an", "/hien", "/thongke"]);
  if (!supported.has(command)) return null;

  const document = await readDocument(env);
  const places = [...document.places];

  if (["/travel", "/dulich", "/diadiem"].includes(command)) {
    return { handled: true, calls: [send(chatId, helpText())] };
  }

  if (command === "/ds") {
    const lines = sortPlaces(places).map((place, index) => `${index + 1}. ${place.published ? "🟢" : "⚫️"} ${place.name} — ${place.province}\n   ${place.id}`);
    const chunks = splitMessages([`DANH SÁCH ${places.length} ĐỊA ĐIỂM`, "", ...lines].join("\n"));
    return { handled: true, calls: chunks.map((chunk) => send(chatId, chunk)) };
  }

  if (command === "/thongke") {
    const published = places.filter((place) => place.published).length;
    const byRegion = Object.entries(places.reduce((acc, place) => {
      acc[place.region] = (acc[place.region] || 0) + 1;
      return acc;
    }, {})).sort((a, b) => a[0].localeCompare(b[0], "vi"));
    const textOut = [
      "THỐNG KÊ ĐỊA ĐIỂM",
      `Tổng: ${places.length}`,
      `Đang công khai: ${published}`,
      `Đang ẩn: ${places.length - published}`,
      "",
      ...byRegion.map(([region, count]) => `${region}: ${count}`),
      "",
      `Cập nhật kho: ${document.updated_at}`
    ].join("\n");
    return { handled: true, calls: [send(chatId, textOut)] };
  }

  if (command === "/xem") {
    const place = places.find((item) => item.id === slugify(arg));
    return {
      handled: true,
      calls: [send(chatId, place ? formatPlace(place) : "Không tìm thấy ID. Dùng /ds để xem danh sách.")]
    };
  }

  if (command === "/them") {
    if (places.length >= MAX_PLACES) return { handled: true, calls: [send(chatId, "Kho đã đạt giới hạn 1.000 địa điểm.")] };
    const fields = parseFields(text);
    if (!fields.name || !fields.province || !fields.region || !fields.summary) {
      return { handled: true, calls: [send(chatId, "Thiếu trường bắt buộc: Tên, Tỉnh, Vùng, Mô tả. Gõ /travel để xem mẫu.")] };
    }
    fields.id = uniqueId(places, fields.id || fields.name);
    const place = normalizePlace(fields);
    if (!place) return { handled: true, calls: [send(chatId, "Dữ liệu không hợp lệ. Gõ /travel để xem mẫu.")] };
    await writeDocument(env, [...places, place]);
    return { handled: true, calls: [send(chatId, `Đã thêm địa điểm.\n\n${formatPlace(place)}`)] };
  }

  if (command === "/sua") {
    const id = slugify(arg);
    const index = places.findIndex((item) => item.id === id);
    if (index < 0) return { handled: true, calls: [send(chatId, "Không tìm thấy ID. Dùng /ds để xem danh sách.")] };
    const fields = parseFields(text);
    if (!Object.keys(fields).length) return { handled: true, calls: [send(chatId, "Chưa có trường cần sửa. Gõ /travel để xem mẫu.")] };
    fields.id = places[index].id;
    const updated = normalizePlace(fields, places[index]);
    if (!updated) return { handled: true, calls: [send(chatId, "Dữ liệu sửa không hợp lệ.")] };
    places[index] = updated;
    await writeDocument(env, places);
    return { handled: true, calls: [send(chatId, `Đã cập nhật.\n\n${formatPlace(updated)}`)] };
  }

  if (command === "/an" || command === "/hien") {
    const id = slugify(arg);
    const index = places.findIndex((item) => item.id === id);
    if (index < 0) return { handled: true, calls: [send(chatId, "Không tìm thấy ID. Dùng /ds để xem danh sách.")] };
    const published = command === "/hien";
    places[index] = normalizePlace({ id, published }, places[index]);
    await writeDocument(env, places);
    return { handled: true, calls: [send(chatId, `${published ? "Đã hiện" : "Đã ẩn"} “${places[index].name}” trên web.`)] };
  }

  if (command === "/xoa") {
    const id = slugify(arg);
    const place = places.find((item) => item.id === id);
    if (!place) return { handled: true, calls: [send(chatId, "Không tìm thấy ID. Dùng /ds để xem danh sách.")] };
    return {
      handled: true,
      calls: [send(chatId, `Xác nhận xóa vĩnh viễn “${place.name}” (${place.id})?`, {
        reply_markup: {
          inline_keyboard: [[
            { text: "🗑 Xóa", callback_data: `travel:delete:${place.id}` },
            { text: "Hủy", callback_data: `travel:cancel:${place.id}` }
          ]]
        }
      })]
    };
  }

  return null;
}

async function handleCallback(update, env) {
  const { chatId, callback } = ownerIds(update);
  const data = String(callback?.data || "");
  if (!data.startsWith("travel:")) return null;
  const [, action, rawId] = data.split(":");
  const id = slugify(rawId);
  const messageId = callback?.message?.message_id;
  if (!callback?.id || !Number.isInteger(messageId)) return { handled: true, calls: [] };

  if (action === "cancel") {
    return {
      handled: true,
      calls: [
        callbackAnswer(callback.id, "Đã hủy"),
        callbackEdit(chatId, messageId, "Đã hủy yêu cầu xóa địa điểm.")
      ]
    };
  }

  if (action === "delete") {
    const document = await readDocument(env);
    const place = document.places.find((item) => item.id === id);
    if (!place) {
      return {
        handled: true,
        calls: [
          callbackAnswer(callback.id, "Địa điểm không còn tồn tại"),
          callbackEdit(chatId, messageId, "Địa điểm đã được xóa trước đó.")
        ]
      };
    }
    await writeDocument(env, document.places.filter((item) => item.id !== id));
    return {
      handled: true,
      calls: [
        callbackAnswer(callback.id, "Đã xóa"),
        callbackEdit(chatId, messageId, `Đã xóa vĩnh viễn “${place.name}” (${place.id}).`)
      ]
    };
  }

  return { handled: true, calls: [callbackAnswer(callback.id, "Lệnh không hợp lệ")] };
}

export async function handleTravelTelegramUpdate(update, env) {
  if (!update || !isOwnerUpdate(update, env)) return null;
  if (update.callback_query) return handleCallback(update, env);
  if (update.message?.text) return handleMessageCommand(update, env);
  return null;
}

export async function handleTravelRequest(request, env) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/travel/")) return null;

  if (url.pathname === "/api/travel/health" && request.method === "GET") {
    return json({ ok: true, service: "vietnam-travel", version: STORE_VERSION }, 200, {
      "cache-control": "public, max-age=60"
    });
  }

  if (url.pathname === "/api/travel/places" && request.method === "GET") {
    const document = await readDocument(env);
    const q = normalizeSearch(url.searchParams.get("q"));
    const region = normalizeSearch(url.searchParams.get("region"));
    const category = slugify(url.searchParams.get("category"));
    const places = sortPlaces(document.places.filter((place) => {
      if (!place.published) return false;
      if (region && normalizeSearch(place.region) !== region) return false;
      if (category && !place.categories.includes(category)) return false;
      if (!q) return true;
      return normalizeSearch([
        place.name,
        place.province,
        place.region,
        place.summary,
        place.highlights.join(" "),
        place.categories.join(" ")
      ].join(" ")).includes(q);
    }));
    return json({
      places,
      count: places.length,
      updated_at: document.updated_at,
      version: document.version
    }, 200, {
      "cache-control": "public, max-age=60, stale-while-revalidate=300"
    });
  }

  if (url.pathname === "/api/travel/meta" && request.method === "GET") {
    const document = await readDocument(env);
    const visible = document.places.filter((place) => place.published);
    return json({
      count: visible.length,
      regions: [...new Set(visible.map((place) => place.region))].sort((a, b) => a.localeCompare(b, "vi")),
      categories: Object.entries(CATEGORY_LABELS).map(([id, label]) => ({ id, label }))
    }, 200, { "cache-control": "public, max-age=300" });
  }

  return json({ error: "not_found" }, 404);
}

export const __test = {
  STORE_KEY,
  slugify,
  normalizePlace,
  parseFields,
  commandOf,
  splitMessages,
  readDocument,
  writeDocument,
  isOwnerUpdate
};
