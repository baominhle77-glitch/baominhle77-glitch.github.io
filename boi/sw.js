// Service worker của boi/: chạy offline phần luật (trang, mã, dữ liệu lá). Gọi AI luôn đi thẳng mạng, không cache.
const CACHE = "boi-v24";
const CORE = [
  "./", "index.html", "manifest.webmanifest", "css/app.css",
  "js/app.js", "js/views.js", "js/store.js", "js/state.js", "js/core.js", "js/parser.js", "js/spreads.js", "js/topic.js",
  "js/pick.js", "js/loi.js", "js/auto.js", "js/reading.js", "js/insight.js", "js/money.js", "js/cards.js", "js/markdown.js", "js/ai.js", "js/data.js",
  "data/tarot.json", "data/lenormand.json", "data/tarot_them.json", "data/lenormand_them.json",
  "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png",
];
const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];
// Trạm AI (Apps Script) và nơi nó chuyển hướng tới: không bao giờ cache
const NO_CACHE_HOSTS = ["script.google.com", "script.googleusercontent.com"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("boi-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return; // POST tới trạm AI đi thẳng mạng
  const url = new URL(req.url);
  if (NO_CACHE_HOSTS.includes(url.hostname)) return;
  const same = url.origin === self.location.origin && url.pathname.startsWith(new URL(self.registration.scope).pathname);
  const font = FONT_HOSTS.includes(url.hostname);
  if (!same && !font) return;
  // Trang Đào tạo nhắn tin không nằm trong ứng dụng chính: đi thẳng mạng, không trả nhầm index.html
  if (same && url.pathname.includes("/dao-tao/")) return;
  // Địa chỉ đường hầm đổi liên tục: luôn đọc mạng, không lưu vào bộ nhớ đệm
  if (same && url.pathname.endsWith("/cau_noi.json")) return;
  if (font) {
    e.respondWith(caches.open(CACHE).then(async (c) => (await c.match(req)) || fetch(req).then((r) => { if (r.ok || r.type === "opaque") c.put(req, r.clone()); return r; })));
    return;
  }
  // Có sẵn thì trả ngay, đồng thời lấy bản mới cho lần sau
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const key = req.mode === "navigate" ? "index.html" : req;
    const hit = await c.match(key, { ignoreSearch: req.mode === "navigate" });
    const net = fetch(req).then((r) => { if (r.ok) c.put(key, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
