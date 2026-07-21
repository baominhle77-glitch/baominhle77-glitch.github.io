/*!
 * worker.js — Cổng DUYỆT TRUY CẬP (Cloudflare Worker) cho các webapp của Hiên Nhi Hiên 89
 * =============================================================================
 * Chức năng (đáp ứng yêu cầu "chỉ tôi phê duyệt + thấy IP/thiết bị/dữ liệu"):
 *   • Khách bấm vào web -> gửi yêu cầu truy cập (kèm dấu vết thiết bị).
 *   • Worker GHI LẠI: IP thật (cf-connecting-ip), quốc gia, User-Agent, thiết bị.
 *   • Worker gửi tin nhắn Telegram cho CHỦ, có nút ✅ Duyệt / ❌ Từ chối.
 *   • CHỦ duyệt bằng: (a) bot Telegram, hoặc (b) trang /admin trên máy mình.
 *   • Khi được duyệt -> cấp phiên (JWT ký HMAC). Web mới hiển thị nội dung.
 *   • Mọi dữ liệu khách nhập trong web có thể POST /api/log để chủ xem lại.
 *
 * Runtime: Cloudflare Workers (WebCrypto sẵn có, KHÔNG cần npm). Lưu trữ: D1.
 * Bí mật cần đặt (wrangler secret): TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET,
 *   ADMIN_TOKEN, SESSION_SECRET. Biến thường: TELEGRAM_CHAT_ID, ALLOWED_ORIGINS.
 * Xem backend/README.md để cài đặt trong ~5 phút.
 */

/* ----------------------------- tiện ích ----------------------------- */
const json = (obj, status = 200, extra = {}) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...extra },
  });

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allow = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  const ok = allow.length === 0 || allow.includes(origin);
  return {
    "Access-Control-Allow-Origin": ok ? origin || "*" : "null",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

const enc = new TextEncoder();
function b64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function hmacSign(secret, data) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}
async function makeJWT(secret, payload, ttlSec = 60 * 60 * 12) {
  const header = b64url(enc.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = { ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + ttlSec };
  const bodyB64 = b64url(enc.encode(JSON.stringify(body)));
  const sig = await hmacSign(secret, header + "." + bodyB64);
  return header + "." + bodyB64 + "." + sig;
}
async function verifyJWT(secret, token) {
  const parts = (token || "").split(".");
  if (parts.length !== 3) return null;
  const expected = await hmacSign(secret, parts[0] + "." + parts[1]);
  if (expected !== parts[2]) return null;
  try {
    const body = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (body.exp && body.exp < Math.floor(Date.now() / 1000)) return null;
    return body;
  } catch (e) { return null; }
}
function uuid() { return crypto.randomUUID(); }
function esc(s) { return String(s || "").replace(/[<&>]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c])); }

/* ----------------------------- Telegram ----------------------------- */
async function tg(env, method, body) {
  const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.json();
}

async function notifyOwner(env, req) {
  const text =
    `🔐 *Yêu cầu truy cập mới*\n\n` +
    `App: *${esc(req.app)}*\n` +
    `Tên: *${esc(req.name)}*\n` +
    (req.note ? `Lý do: ${esc(req.note)}\n` : "") +
    `IP: \`${esc(req.ip)}\` (${esc(req.country)})\n` +
    `Thiết bị: ${esc(req.ua).slice(0, 120)}\n` +
    `Múi giờ: ${esc((req.device && req.device.tz) || "?")} · MH: ${esc((req.device && req.device.screen) || "?")}\n` +
    `Lúc: ${new Date(req.created_at).toISOString()}`;
  return tg(env, "sendMessage", {
    chat_id: env.TELEGRAM_CHAT_ID,
    text,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[
        { text: "✅ Duyệt", callback_data: "approve:" + req.id },
        { text: "❌ Từ chối", callback_data: "deny:" + req.id },
      ]],
    },
  });
}

/* ----------------------------- D1 helpers ----------------------------- */
async function decide(env, id, status) {
  const token = status === "approved" ? await makeJWT(env.SESSION_SECRET, { sub: id }) : null;
  await env.DB.prepare("UPDATE requests SET status=?, decided_at=?, token=? WHERE id=?")
    .bind(status, Date.now(), token, id).run();
  return token;
}

/* ----------------------------- routes ----------------------------- */
async function handleRequest(request, env, url) {
  const body = await request.json().catch(() => ({}));
  const ip = request.headers.get("cf-connecting-ip") || "";
  const country = request.cf ? request.cf.country || "" : "";
  const ua = request.headers.get("user-agent") || "";
  const rec = {
    id: uuid(),
    app: String(body.app || "app").slice(0, 40),
    name: String(body.name || "").slice(0, 80),
    note: String(body.note || "").slice(0, 300),
    ip, country, ua,
    device: body.device || {},
    status: "pending",
    created_at: Date.now(),
  };
  await env.DB.prepare(
    "INSERT INTO requests (id,app,name,note,ip,country,ua,device,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)"
  ).bind(rec.id, rec.app, rec.name, rec.note, rec.ip, rec.country, rec.ua, JSON.stringify(rec.device), rec.status, rec.created_at).run();
  await notifyOwner(env, rec).catch(() => {});
  return json({ id: rec.id, status: "pending" });
}

async function handleStatus(env, url) {
  const id = url.searchParams.get("id");
  if (!id) return json({ error: "missing id" }, 400);
  const row = await env.DB.prepare("SELECT status, token FROM requests WHERE id=?").bind(id).first();
  if (!row) return json({ status: "unknown" });
  var approved = row.status === "approved";
  return json({
    status: row.status,
    token: approved ? row.token : undefined,
    // B+C: chỉ phiên ĐÃ DUYỆT mới nhận khóa giải mã nội dung (nếu có đặt DECRYPT_KEY).
    key: approved && env.DECRYPT_KEY ? env.DECRYPT_KEY : undefined,
  });
}

// Web gọi để lưu lại "dữ kiện khách nhập" (tùy app). Cần token phiên hợp lệ.
async function handleLog(request, env) {
  const auth = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const claims = await verifyJWT(env.SESSION_SECRET, auth);
  if (!claims) return json({ error: "unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  const ip = request.headers.get("cf-connecting-ip") || "";
  await env.DB.prepare("INSERT INTO events (id, request_id, app, kind, data, ip, created_at) VALUES (?,?,?,?,?,?,?)")
    .bind(uuid(), claims.sub, String(body.app || "").slice(0, 40), String(body.kind || "input").slice(0, 40),
      JSON.stringify(body.data || {}).slice(0, 4000), ip, Date.now()).run();
  return json({ ok: true });
}

async function handleTelegramWebhook(request, env) {
  // Xác thực webhook đến từ Telegram bằng secret token.
  if (request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== env.TELEGRAM_WEBHOOK_SECRET) {
    return json({ error: "forbidden" }, 403);
  }
  const update = await request.json().catch(() => ({}));
  const cb = update.callback_query;
  if (cb && String(cb.message.chat.id) === String(env.TELEGRAM_CHAT_ID)) {
    const [action, id] = String(cb.data || "").split(":");
    if ((action === "approve" || action === "deny") && id) {
      const status = action === "approve" ? "approved" : "denied";
      await decide(env, id, status);
      await tg(env, "answerCallbackQuery", { callback_query_id: cb.id, text: status === "approved" ? "Đã duyệt ✅" : "Đã từ chối ❌" });
      await tg(env, "editMessageText", {
        chat_id: cb.message.chat.id, message_id: cb.message.message_id,
        text: cb.message.text + `\n\n➡️ ${status === "approved" ? "✅ ĐÃ DUYỆT" : "❌ ĐÃ TỪ CHỐI"} lúc ${new Date().toISOString()}`,
      });
    }
  }
  return json({ ok: true });
}

/* ----------------------------- admin page (máy của chủ) ----------------------------- */
function adminHtml() {
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Bảng duyệt truy cập</title>
<style>body{font-family:system-ui,sans-serif;background:#0d0b14;color:#e8e2f4;margin:0;padding:16px}
h1{color:#d4a94e;font-size:1.1rem}input,button{font:inherit;padding:8px 10px;border-radius:8px;border:1px solid #332a52;background:#161226;color:#e8e2f4}
table{width:100%;border-collapse:collapse;margin-top:12px;font-size:.85rem}td,th{border-bottom:1px solid #332a52;padding:8px;text-align:left;vertical-align:top}
.b{cursor:pointer;margin-right:6px}.ok{background:#1e5f3f}.no{background:#5f2b1e}.pending{color:#d4a94e}.approved{color:#5fbf8a}.denied{color:#e0785a}</style>
</head><body><h1>🔐 Bảng duyệt truy cập</h1>
<p>Nhập ADMIN_TOKEN (chỉ máy của bạn biết) rồi Tải danh sách.</p>
<input id="tok" type="password" placeholder="ADMIN_TOKEN" size="30"><button onclick="load()">Tải danh sách</button>
<div id="out"></div>
<script>
async function api(path,opt){const t=document.getElementById('tok').value;opt=opt||{};opt.headers=Object.assign({'authorization':'Bearer '+t},opt.headers||{});const r=await fetch(path,opt);return r.json();}
async function load(){const d=await api('/api/admin/list');const rows=(d.requests||[]).map(function(r){return '<tr><td class="'+r.status+'">'+r.status+'</td><td>'+r.app+'</td><td>'+esc(r.name)+'<br><small>'+esc(r.note||'')+'</small></td><td>'+r.ip+'<br><small>'+(r.country||'')+'</small></td><td><small>'+esc((r.ua||'').slice(0,80))+'</small></td><td>'+new Date(r.created_at).toLocaleString()+'</td><td>'+(r.status==='pending'?('<button class="b ok" onclick="decide(\\''+r.id+'\\',\\'approve\\')">Duyệt</button><button class="b no" onclick="decide(\\''+r.id+'\\',\\'deny\\')">Từ chối</button>'):'')+'</td></tr>';}).join('');document.getElementById('out').innerHTML='<table><tr><th>TT</th><th>App</th><th>Tên/Lý do</th><th>IP</th><th>Thiết bị</th><th>Lúc</th><th></th></tr>'+rows+'</table>';}
async function decide(id,action){await api('/api/admin/'+action,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id:id})});load();}
function esc(s){return String(s||'').replace(/[<&>]/g,function(c){return{'<':'&lt;','>':'&gt;','&':'&amp;'}[c];});}
</script></body></html>`;
}

async function requireAdmin(request, env) {
  const t = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  return t && t === env.ADMIN_TOKEN;
}

/* ----------------------------- entrypoint ----------------------------- */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    try {
      // Public API cho web
      if (url.pathname === "/api/request" && request.method === "POST")
        return withCors(await handleRequest(request, env, url), cors);
      if (url.pathname === "/api/status" && request.method === "GET")
        return withCors(await handleStatus(env, url), cors);
      if (url.pathname === "/api/log" && request.method === "POST")
        return withCors(await handleLog(request, env), cors);

      // Telegram webhook
      if (url.pathname === "/telegram/webhook" && request.method === "POST")
        return handleTelegramWebhook(request, env);

      // Admin (máy của chủ)
      if (url.pathname === "/admin") return new Response(adminHtml(), { headers: { "content-type": "text/html; charset=utf-8" } });
      if (url.pathname.startsWith("/api/admin/")) {
        if (!(await requireAdmin(request, env))) return json({ error: "unauthorized" }, 401);
        if (url.pathname === "/api/admin/list") {
          const { results } = await env.DB.prepare("SELECT id,app,name,note,ip,country,ua,status,created_at FROM requests ORDER BY created_at DESC LIMIT 100").all();
          return json({ requests: results });
        }
        const bodyA = await request.json().catch(() => ({}));
        if (url.pathname === "/api/admin/approve") { await decide(env, bodyA.id, "approved"); return json({ ok: true }); }
        if (url.pathname === "/api/admin/deny") { await decide(env, bodyA.id, "denied"); return json({ ok: true }); }
      }

      if (url.pathname === "/") return new Response("gate backend OK", { status: 200 });
      return json({ error: "not found" }, 404);
    } catch (e) {
      return json({ error: "server", detail: String(e && e.message || e) }, 500);
    }
  },
};

function withCors(resp, cors) {
  const r = new Response(resp.body, resp);
  Object.entries(cors).forEach(([k, v]) => r.headers.set(k, v));
  return r;
}
