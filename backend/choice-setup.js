const CREDENTIAL_KEY = "choice:autopilot:credential:v1";
const CATALOG_KEY = "choice:catalog:v1";
const TICKET_PREFIX = "choice:setup:ticket:";
const SESSION_PREFIX = "choice:setup:session:";
const COOKIE_NAME = "choice_owner_setup";
const SETUP_URL = "https://hiennhi89-gate.hiennhi89.workers.dev/owner/choice/setup";
const TICKET_TTL_SECONDS = 10 * 60;
const SESSION_TTL_SECONDS = 12 * 60 * 60;
const enc = new TextEncoder();

const CONNECTIONS = Object.freeze([
  {
    group: "Affiliate & nhận tiền",
    title: "Đăng ký ACCESSTRADE Publisher",
    description: "Tạo tài khoản Publisher miễn phí. Bỏ qua nếu đã có tài khoản.",
    url: "https://workspace.accesstrade.vn/authentication/register?lang=vi",
    action: "Mở trang đăng ký"
  },
  {
    group: "Affiliate & nhận tiền",
    title: "Đăng nhập ACCESSTRADE",
    description: "Đăng nhập Pub2 để quản lý chiến dịch, báo cáo và thanh toán.",
    url: "https://pub2.accesstrade.vn/accounts/login",
    action: "Đăng nhập Pub2"
  },
  {
    group: "Affiliate & nhận tiền",
    title: "Khai báo tài khoản ngân hàng",
    description: "Nhập đúng số tài khoản ngân hàng, tên chủ tài khoản và thông tin thanh toán. Không nhập số thẻ ATM.",
    url: "https://pub2.accesstrade.vn/profile/payment",
    action: "Nhập tài khoản nhận tiền"
  },
  {
    group: "Affiliate & nhận tiền",
    title: "Lịch sử thanh toán",
    description: "Xem hoa hồng đã duyệt, kỳ thanh toán và khoản đã chuyển về ngân hàng.",
    url: "https://pub2.accesstrade.vn/payment",
    action: "Xem lịch sử thanh toán"
  },
  {
    group: "Affiliate & nhận tiền",
    title: "API key ACCESSTRADE",
    description: "Sao chép API key rồi gửi riêng cho bot bằng lệnh /atkey <API_KEY>. Tin nhắn chứa key sẽ được xử lý theo luồng bảo mật.",
    url: "https://pub2.accesstrade.vn/profile/api_key",
    action: "Lấy API key"
  },
  {
    group: "Google & công cụ tìm kiếm",
    title: "Google Search Console",
    description: "Đăng nhập Google, thêm property URL-prefix cho https://hiennhi89.pages.dev/ và chọn phương thức xác minh.",
    url: "https://search.google.com/search-console",
    action: "Mở Search Console"
  },
  {
    group: "Google & công cụ tìm kiếm",
    title: "Bing Webmaster Tools",
    description: "Đăng nhập miễn phí; có thể nhập property đã xác minh từ Google Search Console.",
    url: "https://www.bing.com/webmasters/",
    action: "Mở Bing Webmaster"
  },
  {
    group: "Phân phối hữu cơ",
    title: "Pinterest Business",
    description: "Tạo hoặc chuyển sang tài khoản doanh nghiệp miễn phí để dùng Analytics và chuẩn bị phân phối nội dung hữu cơ.",
    url: "https://business.pinterest.com/vi/getting-started/",
    action: "Tạo tài khoản Business"
  }
]);

function clean(value, max = 500) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function esc(value) {
  return clean(value, 5000)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function b64url(bytes) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function randomToken(size = 32) {
  return b64url(crypto.getRandomValues(new Uint8Array(size)));
}

async function digest(value) {
  return b64url(new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(String(value)))));
}

function parseCookies(request) {
  const result = {};
  for (const part of String(request.headers.get("cookie") || "").split(";")) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    result[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
  }
  return result;
}

function privateHeaders(extra = {}) {
  return {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store, private",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "x-robots-tag": "noindex, nofollow, noarchive",
    "referrer-policy": "no-referrer",
    "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data: https:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
    ...extra
  };
}

async function createOwnerTicket(env) {
  const token = randomToken();
  await env.KV.put(`${TICKET_PREFIX}${await digest(token)}`, JSON.stringify({ created_at: new Date().toISOString() }), {
    expirationTtl: TICKET_TTL_SECONDS
  });
  return `${SETUP_URL}?ticket=${encodeURIComponent(token)}`;
}

async function exchangeOwnerTicket(env, token) {
  const key = `${TICKET_PREFIX}${await digest(token)}`;
  if (!await env.KV.get(key)) return null;
  await env.KV.delete?.(key);
  const session = randomToken();
  await env.KV.put(`${SESSION_PREFIX}${await digest(session)}`, JSON.stringify({ created_at: new Date().toISOString() }), {
    expirationTtl: SESSION_TTL_SECONDS
  });
  return session;
}

async function ownerSessionValid(request, env) {
  const token = parseCookies(request)[COOKIE_NAME];
  if (!token) return false;
  return !!await env.KV.get(`${SESSION_PREFIX}${await digest(token)}`);
}

async function revokeOwnerSession(request, env) {
  const token = parseCookies(request)[COOKIE_NAME];
  if (token) await env.KV.delete?.(`${SESSION_PREFIX}${await digest(token)}`);
}

async function readSetupStatus(env) {
  const credentialConnected = !!clean(env.ACCESSTRADE_API_TOKEN, 1200) || !!await env.KV.get(CREDENTIAL_KEY);
  let catalogProducts = 0;
  try {
    const catalog = JSON.parse(await env.KV.get(CATALOG_KEY) || "{}");
    catalogProducts = Array.isArray(catalog.products) ? catalog.products.length : 0;
  } catch (_) { /* keep zero */ }
  return { credential_connected: credentialConnected, catalog_products: catalogProducts };
}

function connectionCards() {
  const groups = [...new Set(CONNECTIONS.map((item) => item.group))];
  return groups.map((group) => {
    const cards = CONNECTIONS.filter((item) => item.group === group).map((item) => `
      <article class="card">
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.description)}</p>
        <a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${esc(item.action)}</a>
      </article>`).join("");
    return `<section><h2>${esc(group)}</h2><div class="grid">${cards}</div></section>`;
  }).join("");
}

function setupHtml(status) {
  const accessState = status.credential_connected ? "Đã kết nối API" : "Chưa kết nối API";
  return `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex,nofollow,noarchive"><title>Trung tâm kết nối chủ sở hữu</title><style>
:root{--bg:#071d19;--panel:#0e3029;--text:#f7f3e8;--muted:#a8bdb7;--line:#2a5149;--accent:#dcec6d;--sand:#ead7b5}*{box-sizing:border-box}body{margin:0;background:linear-gradient(150deg,#061713,#0a2922);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif;line-height:1.55}.shell{width:min(1050px,calc(100% - 28px));margin:auto}header{border-bottom:1px solid var(--line);padding:20px 0}header .shell{display:flex;justify-content:space-between;align-items:center;gap:16px}.brand{font-weight:900;letter-spacing:.06em}.logout{border:1px solid var(--line);background:transparent;color:var(--text);border-radius:999px;padding:9px 13px;cursor:pointer}main{padding:42px 0 70px}.hero{display:grid;grid-template-columns:1.3fr .7fr;gap:20px;align-items:start}h1,h2,h3{font-family:Georgia,serif;font-weight:500;line-height:1.15}h1{font-size:clamp(2.6rem,7vw,5.2rem);margin:0}.lead{color:var(--muted);max-width:720px}.status{border:1px solid var(--line);background:var(--panel);border-radius:20px;padding:20px}.status strong,.status span{display:block}.status span{color:var(--muted);font-size:.8rem;margin-top:4px}.money{margin:28px 0;background:var(--sand);color:#173b34;border-radius:18px;padding:20px}.money h2{margin-top:0}.money ul{margin-bottom:0}section{margin-top:34px}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.card{border:1px solid var(--line);background:var(--panel);border-radius:18px;padding:20px}.card h3{margin:0 0 8px}.card p{color:var(--muted);min-height:54px}.card a{display:inline-flex;min-height:44px;align-items:center;padding:0 16px;border-radius:999px;background:var(--accent);color:#173b34;text-decoration:none;font-weight:850}.note{margin-top:30px;border-left:4px solid var(--accent);padding:14px 18px;background:rgba(220,236,109,.08)}@media(max-width:720px){.hero,.grid{grid-template-columns:1fr}.card p{min-height:auto}}
</style></head><body><header><div class="shell"><div class="brand">HỘI CHỌN ĐÚNG · OWNER</div><form action="/owner/choice/setup/logout" method="post"><button class="logout" type="submit">Đăng xuất</button></form></div></header><main class="shell"><div class="hero"><div><h1>Trung tâm kết nối</h1><p class="lead">Các nút dưới đây chỉ dành cho chủ sở hữu để đăng ký, đăng nhập, khai báo tài khoản nhận tiền hoặc cấp quyền một lần. Không có nội dung nào trong trang này xuất hiện trên website công khai.</p></div><aside class="status"><strong>${esc(accessState)}</strong><span>ACCESSTRADE</span><strong>${Number(status.catalog_products || 0).toLocaleString("vi-VN")} sản phẩm</strong><span>Catalog hiện có</span></aside></div><section class="money"><h2>Tiền affiliate được nhận như thế nào?</h2><ul><li>ACCESSTRADE tự chuyển khoản vào tài khoản ngân hàng đã khai báo; không cần bấm rút từng lần.</li><li>Điều kiện thông thường: hoa hồng được duyệt từ 200.000đ và thông tin ngân hàng đầy đủ, chính xác.</li><li>Có hai đợt thanh toán ngày 18 và 25 hằng tháng; nếu trùng ngày nghỉ thì chuyển sang ngày làm việc kế tiếp.</li><li>Điền số tài khoản ngân hàng, không điền dãy số trên thẻ ATM.</li></ul></section>${connectionCards()}<div class="note"><strong>Sau khi lấy API key:</strong> quay lại Telegram công ty và gửi <code>/atkey &lt;API_KEY&gt;</code>. Công ty sẽ tự tìm sản phẩm, tạo link, cập nhật web, SEO và đồng bộ doanh thu.</div></main></body></html>`;
}

function unauthorizedHtml() {
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>Không có quyền truy cập</title></head><body><h1>Không có quyền truy cập</h1><p>Hãy gửi /ketnoi trong Telegram owner để nhận liên kết đăng nhập dùng một lần.</p></body></html>`;
}

function ownerUpdate(update, env) {
  const message = update?.message;
  const owner = String(env.TELEGRAM_CHAT_ID || "");
  return !!owner && String(message?.chat?.id || "") === owner && String(message?.from?.id || "") === owner;
}

function send(chatId, text) {
  return { method: "sendMessage", body: { chat_id: chatId, text, disable_web_page_preview: true } };
}

export async function handleChoiceSetupTelegram(update, env) {
  if (!ownerUpdate(update, env) || !update?.message?.text) return null;
  const command = String(update.message.text).trim().split(/\s+/, 1)[0].toLowerCase().split("@")[0];
  if (!["/ketnoi", "/caidat", "/setup"].includes(command)) return null;
  const status = await readSetupStatus(env);
  const url = await createOwnerTicket(env);
  const lines = [
    "HỘI CHỌN ĐÚNG — TRUNG TÂM KẾT NỐI OWNER",
    `ACCESSTRADE: ${status.credential_connected ? "đã kết nối API" : "chưa kết nối API"}`,
    `Catalog hiện có: ${status.catalog_products}`,
    "",
    "Mở liên kết riêng dưới đây trong 10 phút:",
    url,
    "",
    "Trang gồm sẵn nút đăng ký/đăng nhập ACCESSTRADE, khai báo ngân hàng, API key, Google Search Console, Bing và Pinterest Business."
  ];
  return { handled: true, calls: [send(update.message.chat.id, lines.join("\n"))] };
}

export async function handleChoiceSetupRequest(request, env) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/owner/choice/setup")) return null;

  if (url.pathname === "/owner/choice/setup" && request.method === "GET") {
    const ticket = clean(url.searchParams.get("ticket"), 200);
    if (ticket) {
      const session = await exchangeOwnerTicket(env, ticket);
      if (!session) return new Response(unauthorizedHtml(), { status: 401, headers: privateHeaders() });
      return new Response(null, {
        status: 303,
        headers: privateHeaders({
          location: SETUP_URL,
          "set-cookie": `${COOKIE_NAME}=${encodeURIComponent(session)}; Max-Age=${SESSION_TTL_SECONDS}; Path=/owner/choice/setup; HttpOnly; Secure; SameSite=Strict`
        })
      });
    }
    if (!await ownerSessionValid(request, env)) {
      return new Response(unauthorizedHtml(), { status: 401, headers: privateHeaders() });
    }
    return new Response(setupHtml(await readSetupStatus(env)), { status: 200, headers: privateHeaders() });
  }

  if (url.pathname === "/owner/choice/setup/logout" && request.method === "POST") {
    await revokeOwnerSession(request, env);
    return new Response(null, {
      status: 303,
      headers: privateHeaders({
        location: SETUP_URL,
        "set-cookie": `${COOKIE_NAME}=; Max-Age=0; Path=/owner/choice/setup; HttpOnly; Secure; SameSite=Strict`
      })
    });
  }

  return new Response(JSON.stringify({ error: "not_found" }), {
    status: 404,
    headers: { ...privateHeaders(), "content-type": "application/json; charset=utf-8" }
  });
}

export const __test = {
  CONNECTIONS,
  COOKIE_NAME,
  SETUP_URL,
  createOwnerTicket,
  exchangeOwnerTicket,
  ownerSessionValid,
  readSetupStatus,
  setupHtml,
  ownerUpdate
};
