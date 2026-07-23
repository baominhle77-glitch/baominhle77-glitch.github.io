const PLACE_FIELDS = [
  "slug", "name", "province", "district", "region", "category", "summary",
  "description", "highlights", "experiences", "best_time", "suggested_duration",
  "ticket_info", "opening_hours", "travel_notes", "latitude", "longitude",
  "map_url", "official_url", "tags", "featured", "status", "source_name",
  "source_url", "source_checked_at"
];

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(env, origin, false) });
    }

    try {
      let response;

      if (url.pathname === "/health" && request.method === "GET") {
        response = json({ ok: true, service: "vietnam-travel-api", time: new Date().toISOString() });
      } else if (url.pathname === "/telegram/webhook" && request.method === "POST") {
        response = await handleTelegramWebhook(request, env, ctx);
      } else if (url.pathname === "/api/places" && request.method === "GET") {
        response = await listPlaces(url, env);
      } else if (url.pathname === "/api/places" && request.method === "POST") {
        assertAdmin(request, env);
        response = await createPlace(request, env, "api");
      } else {
        const placeMatch = url.pathname.match(/^\/api\/places\/([^/]+)$/);
        if (placeMatch && request.method === "GET") {
          response = await getPlace(decodeURIComponent(placeMatch[1]), env);
        } else if (placeMatch && request.method === "PUT") {
          assertAdmin(request, env);
          response = await updatePlace(decodeURIComponent(placeMatch[1]), request, env, "api");
        } else if (placeMatch && request.method === "DELETE") {
          assertAdmin(request, env);
          response = await deletePlace(decodeURIComponent(placeMatch[1]), env, "api");
        } else {
          response = json({ error: "not_found" }, 404);
        }
      }

      return withCors(response, env, origin, request.method !== "GET");
    } catch (error) {
      console.error("request_error", error);
      const status = Number(error?.status) || 500;
      const message = status >= 500 ? "server_error" : String(error?.message || "request_error");
      return withCors(json({ error: message }, status), env, origin, request.method !== "GET");
    }
  }
};

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers }
  });
}

function corsHeaders(env, origin, isWrite) {
  const allowed = String(env.ALLOWED_ORIGINS || "*")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const allowOrigin = allowed.includes("*") && !isWrite
    ? "*"
    : (allowed.includes(origin) ? origin : (allowed[0] || ""));

  const headers = {
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Authorization,Content-Type,X-Telegram-Bot-Api-Secret-Token",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
  if (allowOrigin) headers["Access-Control-Allow-Origin"] = allowOrigin;
  return headers;
}

function withCors(response, env, origin, isWrite) {
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders(env, origin, isWrite)).forEach(([key, value]) => headers.set(key, value));
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function assertAdmin(request, env) {
  if (!env.ADMIN_API_TOKEN) throw httpError(503, "admin_token_not_configured");
  const auth = request.headers.get("Authorization") || "";
  if (auth !== `Bearer ${env.ADMIN_API_TOKEN}`) throw httpError(401, "unauthorized");
}

async function readJson(request) {
  const type = request.headers.get("Content-Type") || "";
  if (!type.includes("application/json")) throw httpError(415, "content_type_must_be_json");
  let body;
  try {
    body = await request.json();
  } catch {
    throw httpError(400, "invalid_json");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) throw httpError(400, "invalid_payload");
  return body;
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function normalizeTags(value) {
  if (Array.isArray(value)) return value.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 30).join(",");
  return String(value || "").split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 30).join(",");
}

function cleanText(value, max = 5000) {
  return String(value ?? "").trim().slice(0, max);
}

function normalizePlace(input, partial = false) {
  const out = {};
  for (const field of PLACE_FIELDS) {
    if (partial && !(field in input)) continue;
    const value = input[field];
    if (["latitude", "longitude"].includes(field)) {
      out[field] = value === "" || value == null ? null : Number(value);
      if (out[field] != null && !Number.isFinite(out[field])) throw httpError(400, `${field}_invalid`);
    } else if (field === "featured") {
      out[field] = value === true || Number(value) === 1 ? 1 : 0;
    } else if (field === "tags") {
      out[field] = normalizeTags(value);
    } else if (field === "status") {
      const status = cleanText(value || "published", 20);
      if (!new Set(["published", "draft", "archived"]).has(status)) throw httpError(400, "status_invalid");
      out[field] = status;
    } else {
      out[field] = cleanText(value, field.includes("url") ? 1000 : 5000);
    }
  }

  if (!partial) {
    out.name = cleanText(input.name, 200);
    if (!out.name) throw httpError(400, "name_required");
    out.slug = slugify(input.slug || out.name);
    if (!out.slug) throw httpError(400, "slug_invalid");
    out.province = cleanText(input.province, 120);
    out.category = cleanText(input.category, 120);
    if (!out.province) throw httpError(400, "province_required");
    if (!out.category) throw httpError(400, "category_required");
    out.status = out.status || "published";
  }

  if ("slug" in out && out.slug) out.slug = slugify(out.slug);
  return out;
}

function serializePlace(row) {
  if (!row) return row;
  return {
    ...row,
    featured: Boolean(row.featured),
    tags: String(row.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean)
  };
}

async function listPlaces(url, env) {
  const params = url.searchParams;
  const where = ["status = ?"];
  const values = [params.get("status") || "published"];

  const exactFilters = [
    ["province", params.get("province")],
    ["region", params.get("region")],
    ["category", params.get("category")]
  ];

  for (const [field, value] of exactFilters) {
    if (value) {
      where.push(`${field} = ?`);
      values.push(value);
    }
  }

  if (params.get("featured") === "1") where.push("featured = 1");

  const query = cleanText(params.get("q"), 200);
  if (query) {
    const like = `%${query}%`;
    where.push("(name LIKE ? OR province LIKE ? OR district LIKE ? OR category LIKE ? OR summary LIKE ? OR tags LIKE ?)");
    values.push(like, like, like, like, like, like);
  }

  const requestedLimit = Number(params.get("limit") || DEFAULT_LIMIT);
  const limit = Math.min(Math.max(Number.isFinite(requestedLimit) ? requestedLimit : DEFAULT_LIMIT, 1), MAX_LIMIT);
  const requestedOffset = Number(params.get("offset") || 0);
  const offset = Math.max(Number.isFinite(requestedOffset) ? requestedOffset : 0, 0);

  const sql = `SELECT * FROM places WHERE ${where.join(" AND ")} ORDER BY featured DESC, name COLLATE NOCASE ASC LIMIT ? OFFSET ?`;
  const result = await env.TRAVEL_DB.prepare(sql).bind(...values, limit, offset).all();
  const countSql = `SELECT COUNT(*) AS total FROM places WHERE ${where.join(" AND ")}`;
  const count = await env.TRAVEL_DB.prepare(countSql).bind(...values).first();

  return json({ data: (result.results || []).map(serializePlace), total: Number(count?.total || 0), limit, offset });
}

async function getPlace(identifier, env) {
  const isId = /^\d+$/.test(identifier);
  const row = await env.TRAVEL_DB
    .prepare(`SELECT * FROM places WHERE ${isId ? "id" : "slug"} = ? LIMIT 1`)
    .bind(isId ? Number(identifier) : identifier)
    .first();
  if (!row) throw httpError(404, "place_not_found");
  return json({ data: serializePlace(row) });
}

async function createPlace(request, env, actor) {
  const input = normalizePlace(await readJson(request));
  const now = new Date().toISOString();
  const columns = [...PLACE_FIELDS, "created_at", "updated_at", "updated_by"];
  const values = columns.map((field) => {
    if (field === "created_at" || field === "updated_at") return now;
    if (field === "updated_by") return actor;
    return input[field] ?? null;
  });
  const placeholders = columns.map(() => "?").join(",");

  try {
    const result = await env.TRAVEL_DB
      .prepare(`INSERT INTO places (${columns.join(",")}) VALUES (${placeholders})`)
      .bind(...values)
      .run();
    return json({ ok: true, id: result.meta.last_row_id, slug: input.slug }, 201);
  } catch (error) {
    if (String(error).includes("UNIQUE")) throw httpError(409, "slug_already_exists");
    throw error;
  }
}

async function updatePlace(identifier, request, env, actor) {
  const input = normalizePlace(await readJson(request), true);
  const entries = Object.entries(input);
  if (!entries.length) throw httpError(400, "no_fields_to_update");

  const isId = /^\d+$/.test(identifier);
  const set = entries.map(([field]) => `${field} = ?`);
  const values = entries.map(([, value]) => value);
  set.push("updated_at = ?", "updated_by = ?");
  values.push(new Date().toISOString(), actor, isId ? Number(identifier) : identifier);

  const result = await env.TRAVEL_DB
    .prepare(`UPDATE places SET ${set.join(", ")} WHERE ${isId ? "id" : "slug"} = ?`)
    .bind(...values)
    .run();

  if (!result.meta.changes) throw httpError(404, "place_not_found");
  return json({ ok: true, updated: result.meta.changes });
}

async function deletePlace(identifier, env, actor) {
  const isId = /^\d+$/.test(identifier);
  const existing = await env.TRAVEL_DB
    .prepare(`SELECT id, name, slug FROM places WHERE ${isId ? "id" : "slug"} = ? LIMIT 1`)
    .bind(isId ? Number(identifier) : identifier)
    .first();
  if (!existing) throw httpError(404, "place_not_found");

  await env.TRAVEL_DB.prepare("DELETE FROM places WHERE id = ?").bind(existing.id).run();
  await env.TRAVEL_DB.prepare(
    "INSERT INTO audit_log (action, entity_type, entity_id, actor, payload, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind("delete", "place", String(existing.id), actor, JSON.stringify(existing), new Date().toISOString()).run();

  return json({ ok: true, deleted: existing });
}

async function handleTelegramWebhook(request, env, ctx) {
  if (!env.TELEGRAM_WEBHOOK_SECRET) throw httpError(503, "telegram_secret_not_configured");
  const secret = request.headers.get("X-Telegram-Bot-Api-Secret-Token") || "";
  if (secret !== env.TELEGRAM_WEBHOOK_SECRET) throw httpError(401, "telegram_secret_invalid");

  const update = await request.json();
  const message = update?.message || update?.edited_message;
  if (!message?.chat?.id) return json({ ok: true, ignored: true });

  const chatId = String(message.chat.id);
  if (String(env.TELEGRAM_ADMIN_CHAT_ID || "") !== chatId) {
    ctx.waitUntil(sendTelegram(env, chatId, "Bot này chỉ nhận lệnh từ tài khoản quản trị đã cấu hình."));
    return json({ ok: true, unauthorized_chat: true });
  }

  const text = String(message.text || "").trim();
  if (!text.startsWith("/")) return json({ ok: true, ignored: true });

  ctx.waitUntil(processTelegramCommand(text, chatId, env).catch(async (error) => {
    console.error("telegram_command_error", error);
    await sendTelegram(env, chatId, `❌ Lỗi: ${escapeHtml(error?.message || "Không xử lý được lệnh")}`);
  }));

  return json({ ok: true });
}

async function processTelegramCommand(text, chatId, env) {
  const firstSpace = text.indexOf(" ");
  const rawCommand = firstSpace === -1 ? text : text.slice(0, firstSpace);
  const command = rawCommand.split("@")[0].toLowerCase();
  const args = firstSpace === -1 ? "" : text.slice(firstSpace + 1).trim();

  if (command === "/start" || command === "/help") {
    return sendTelegram(env, chatId, telegramHelp(), webAppKeyboard(env));
  }

  if (command === "/webapp") {
    if (!env.WEB_APP_URL) return sendTelegram(env, chatId, "Chưa cấu hình WEB_APP_URL.");
    return sendTelegram(env, chatId, "Mở kho địa điểm du lịch Việt Nam:", webAppKeyboard(env));
  }

  if (command === "/stats") {
    const total = await env.TRAVEL_DB.prepare("SELECT COUNT(*) AS n FROM places").first();
    const published = await env.TRAVEL_DB.prepare("SELECT COUNT(*) AS n FROM places WHERE status = 'published'").first();
    const provinces = await env.TRAVEL_DB.prepare("SELECT COUNT(DISTINCT province) AS n FROM places WHERE status = 'published'").first();
    return sendTelegram(env, chatId,
      `<b>Thống kê kho dữ liệu</b>\n• Tổng bản ghi: ${Number(total?.n || 0)}\n• Đang công khai: ${Number(published?.n || 0)}\n• Tỉnh/thành: ${Number(provinces?.n || 0)}`
    );
  }

  if (command === "/list") {
    const province = cleanText(args, 120);
    const statement = province
      ? env.TRAVEL_DB.prepare("SELECT id, name, province, category, featured FROM places WHERE province LIKE ? ORDER BY featured DESC, name LIMIT 30").bind(`%${province}%`)
      : env.TRAVEL_DB.prepare("SELECT id, name, province, category, featured FROM places ORDER BY updated_at DESC LIMIT 30");
    const result = await statement.all();
    return sendTelegram(env, chatId, formatPlaceList(result.results || [], province ? `Danh sách: ${province}` : "30 địa điểm mới cập nhật"));
  }

  if (command === "/search") {
    if (!args) return sendTelegram(env, chatId, "Cú pháp: <code>/search từ khóa</code>");
    const like = `%${cleanText(args, 120)}%`;
    const result = await env.TRAVEL_DB.prepare(
      "SELECT id, name, province, category, featured FROM places WHERE name LIKE ? OR province LIKE ? OR category LIKE ? OR tags LIKE ? ORDER BY featured DESC, name LIMIT 30"
    ).bind(like, like, like, like).all();
    return sendTelegram(env, chatId, formatPlaceList(result.results || [], `Kết quả: ${args}`));
  }

  if (command === "/show") {
    if (!args) return sendTelegram(env, chatId, "Cú pháp: <code>/show ID-hoặc-slug</code>");
    const response = await getPlace(args, env);
    const payload = await response.json();
    return sendTelegram(env, chatId, formatPlaceDetail(payload.data));
  }

  if (command === "/add") {
    const parts = args.split("|").map((part) => part.trim());
    if (parts.length < 4 || parts.some((part, index) => index < 4 && !part)) {
      return sendTelegram(env, chatId,
        "Cú pháp:\n<code>/add Tên | Tỉnh/thành | Loại hình | Mô tả ngắn | Quận/huyện | Vùng | tag1,tag2</code>"
      );
    }

    const payload = {
      name: parts[0], province: parts[1], category: parts[2], summary: parts[3],
      district: parts[4] || "", region: parts[5] || "", tags: parts[6] || "",
      slug: slugify(parts[0]), featured: 0, status: "published"
    };
    const fakeRequest = new Request("https://internal/api/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const response = await createPlace(fakeRequest, env, `telegram:${chatId}`);
    const result = await response.json();
    return sendTelegram(env, chatId, `✅ Đã thêm <b>${escapeHtml(payload.name)}</b>\nID: <code>${result.id}</code>\nSlug: <code>${escapeHtml(result.slug)}</code>`);
  }

  if (command === "/delete") {
    if (!/^\d+$/.test(args)) return sendTelegram(env, chatId, "Cú pháp: <code>/delete ID</code>");
    const response = await deletePlace(args, env, `telegram:${chatId}`);
    const result = await response.json();
    return sendTelegram(env, chatId, `🗑 Đã xóa #${result.deleted.id}: <b>${escapeHtml(result.deleted.name)}</b>`);
  }

  if (command === "/feature" || command === "/unfeature") {
    if (!/^\d+$/.test(args)) return sendTelegram(env, chatId, `Cú pháp: <code>${command} ID</code>`);
    const value = command === "/feature" ? 1 : 0;
    const fakeRequest = new Request("https://internal/api/places", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured: value })
    });
    await updatePlace(args, fakeRequest, env, `telegram:${chatId}`);
    return sendTelegram(env, chatId, value ? `⭐ Đã đánh dấu nổi bật ID ${args}` : `Đã bỏ nổi bật ID ${args}`);
  }

  return sendTelegram(env, chatId, `Không nhận ra lệnh <code>${escapeHtml(command)}</code>. Gõ /help để xem hướng dẫn.`);
}

function telegramHelp() {
  return [
    "<b>Việt Nam Đi Đâu? — Bot quản trị</b>",
    "",
    "/stats — Thống kê dữ liệu",
    "/list [tỉnh] — Danh sách mới cập nhật",
    "/search từ khóa — Tìm địa điểm",
    "/show ID-hoặc-slug — Xem chi tiết",
    "/add Tên | Tỉnh | Loại | Mô tả | Quận/huyện | Vùng | tag1,tag2",
    "/feature ID — Đánh dấu nổi bật",
    "/unfeature ID — Bỏ nổi bật",
    "/delete ID — Xóa địa điểm",
    "/webapp — Mở web app",
    "",
    "Bot chỉ chấp nhận Telegram Chat ID quản trị đã đặt trong Cloudflare Secret."
  ].join("\n");
}

function webAppKeyboard(env) {
  if (!env.WEB_APP_URL) return undefined;
  return {
    reply_markup: {
      inline_keyboard: [[{ text: "🌏 Mở kho du lịch", web_app: { url: env.WEB_APP_URL } }]]
    }
  };
}

function formatPlaceList(rows, title) {
  if (!rows.length) return `<b>${escapeHtml(title)}</b>\nKhông có dữ liệu.`;
  const lines = rows.map((row) => `${row.featured ? "⭐ " : ""}<code>#${row.id}</code> <b>${escapeHtml(row.name)}</b> — ${escapeHtml(row.province)} · ${escapeHtml(row.category)}`);
  return `<b>${escapeHtml(title)}</b>\n${lines.join("\n")}`.slice(0, 3900);
}

function formatPlaceDetail(place) {
  return [
    `${place.featured ? "⭐ " : ""}<b>${escapeHtml(place.name)}</b>`,
    `<code>#${place.id}</code> · <code>${escapeHtml(place.slug)}</code>`,
    `${escapeHtml(place.district || "")} ${place.district ? "· " : ""}${escapeHtml(place.province || "")}`,
    escapeHtml(place.category || ""),
    "",
    escapeHtml(place.summary || place.description || "Chưa có mô tả"),
    "",
    `<b>Trạng thái:</b> ${escapeHtml(place.status || "")}`
  ].join("\n").slice(0, 3900);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function sendTelegram(env, chatId, text, extra = {}) {
  if (!env.TELEGRAM_BOT_TOKEN) throw httpError(503, "telegram_bot_token_not_configured");
  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: String(text).slice(0, 4096),
      parse_mode: "HTML",
      disable_web_page_preview: true,
      ...extra
    })
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`telegram_send_failed:${response.status}:${detail.slice(0, 300)}`);
  }
  return response.json();
}
