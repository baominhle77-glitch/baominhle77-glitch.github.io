// Khởi động SPA: tải dữ liệu lá, hash router, hiệu ứng chuyển trang, nút Back.
import { ROUTES, NEEDS_DB, toast, esc } from "./views.js";
import { store, probeBridge, bridge, setGhep, setCauNoiAn, aiKey, storage, persist } from "./store.js";
import { taoBoiAuto } from "./auto.js";
import { mergeKnowledge } from "./data.js";

const view = document.getElementById("view");
const back = document.getElementById("btnBack");
let idx = 0;
// Nhớ vị trí cuộn theo từng bước lịch sử: quay lại thì về đúng chỗ đang đọc, đi tới thì lên đầu trang
const scrollAt = new Map();
function syncIdx(fresh) {
  const st = history.state;
  const prev = idx;
  if (st && Number.isInteger(st.idx)) idx = st.idx;
  else { idx = fresh ? 0 : idx + 1; history.replaceState({ idx }, "", location.href); }
  return idx < prev ? "back" : "fwd";
}

function parse() {
  const raw = location.hash.replace(/^#/, "") || "/";
  const [path, qs = ""] = raw.split("?");
  return { path: path || "/", query: new URLSearchParams(qs) };
}

function resolve() {
  const { path, query } = parse();
  for (const [re, fn, tab] of ROUTES) {
    const m = path.match(re);
    if (m) return { v: fn(m, query), tab, path };
  }
  return { v: { title: "Không có trang", html: `<h1>Không có trang này</h1><p><a class="btn primary" href="#/">Về trang chủ</a></p>` }, tab: "", path };
}

function render() {
  if (!store.db && NEEDS_DB.test(parse().path)) { view.innerHTML = `<p class="note">Đang tải bộ bài…</p>`; dbReady.then(render); return; }
  const { v, tab, path } = resolve();
  if (v.redirect) { location.replace(v.redirect); return; }
  view.innerHTML = v.html;
  document.title = `${v.title} · Bói Tarot + Lenormand`;
  document.querySelectorAll(".tabbar a").forEach((a) => (a.dataset.tab === tab ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
  back.hidden = path === "/";
  v.mount?.(view, ctx);
  const h1 = view.querySelector("h1");
  if (h1) { h1.setAttribute("tabindex", "-1"); h1.focus({ preventScroll: true }); }
}

function transition(fn, { scroll = true, dir = "fwd", y = 0 } = {}) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.dataset.nav = dir;
  const run = () => { fn(); if (scroll) window.scrollTo(0, y); };
  if (document.startViewTransition && !reduced) {
    try { document.startViewTransition(run); return; } catch (_) { /* trình duyệt từ chối → chuyển thường */ }
  }
  run();
  if (!reduced) { view.classList.remove("view-enter"); void view.offsetWidth; view.classList.add("view-enter"); }
}

const ctx = {
  go(hash, { replace = false, force = false } = {}) {
    if (hash === location.hash && force) return transition(render);
    if (replace) { location.replace(hash); }
    else location.hash = hash;
  },
  rerender() { const y = window.scrollY; render(); window.scrollTo(0, y); },
};

if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.addEventListener("hashchange", () => {
  const from = idx;
  scrollAt.set(from, window.scrollY);
  const dir = syncIdx(false);
  const y = dir === "back" ? scrollAt.get(idx) || 0 : 0;
  transition(render, { dir, y });
});
back.onclick = () => { if (idx > 0) history.back(); else location.hash = "#/"; };

const dbReady = Promise.all(["data/tarot.json", "data/lenormand.json"].map((u) => fetch(u).then((r) => { if (!r.ok) throw new Error(u); return r.json(); })))
  .then(async ([tarot, lenormand]) => {
    // Kho tri thức giải offline: thiếu tệp thì vẫn giải bằng dữ liệu gốc
    const opt = (u) => fetch(u).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    const [tThem, lThem] = await Promise.all([opt("data/tarot_them.json"), opt("data/lenormand_them.json")]);
    store.db = mergeKnowledge({ tarot, lenormand }, tThem, lThem);
  });

// Cho trợ lý tự động: window.BoiAuto.giai(cauHoi, {tenKhach}) → Promise<{loiGuiKhach, maKhoa, trai, lyDoTrai, …}>;
// kiểu trải agent tự chọn theo câu hỏi (trai chỉ truyền khi test)
window.BoiAuto = taoBoiAuto(async () => {
  await dbReady;
  // đợi dò 127.0.0.1 xong (≤ 1,2 s) để bot trên máy nhà đi 127.0.0.1 → Worker → trạm
  try { await (bridge.daDo || probeBridge()); } catch (_) { /* vẫn đi Worker */ }
  return { db: store.db, settings: store.settings, key: aiKey(), storage, onSession: (s) => { store.sessions.push(s); persist(); } };
});

async function init() {
  dbReady.catch((err) => {
    view.innerHTML = `<h1>Không tải được dữ liệu lá</h1><p class="err">${esc(err.message)}</p><p><button class="btn primary" type="button" id="rl">Tải lại</button></p>`;
    document.getElementById("rl").onclick = () => location.reload();
  });
  // Link ghép một lần (?ghep=<mã>): lưu mã cầu nối máy nhà rồi xoá khỏi thanh địa chỉ
  const ghep = new URLSearchParams(location.search).get("ghep");
  if (ghep && /^[\w-]{20,}$/.test(ghep)) { setGhep(ghep); history.replaceState(null, "", location.pathname + location.hash); toast("Đã ghép cầu nối AI máy nhà."); }
  // ?cau-noi=1 bật / ?cau-noi=0 tắt cầu nối Claude trên máy này (mặc định bật)
  const cau = new URLSearchParams(location.search).get("cau-noi");
  if (cau === "1" || cau === "0") { setCauNoiAn(cau === "1"); history.replaceState(null, "", location.pathname + location.hash); }
  syncIdx(true);
  render();
  // Dò cầu nối lúc mở trang và mỗi khi quay lại tab / có mạng lại; trạng thái đổi thì vẽ lại màn hiện tại
  let last = null;
  const reprobe = () => probeBridge().then((ok) => { if (ok !== last) { const was = last; last = ok; if (ok || was) ctx.rerender(); } });
  reprobe();
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") reprobe(); });
  window.addEventListener("online", reprobe);
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
  window.addEventListener("storage", (e) => { if (e.key?.startsWith("boi.v1.")) toast("Dữ liệu vừa đổi ở tab khác — tải lại trang để đồng bộ."); });
}
init();
