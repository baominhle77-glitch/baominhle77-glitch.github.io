// Khởi động SPA: tải dữ liệu lá, hash router, hiệu ứng chuyển trang, nút Back.
import { ROUTES, toast, esc } from "./views.js";
import { store } from "./store.js";

const view = document.getElementById("view");
const back = document.getElementById("btnBack");
let idx = 0;
function syncIdx(fresh) {
  const st = history.state;
  if (st && Number.isInteger(st.idx)) idx = st.idx;
  else { idx = fresh ? 0 : idx + 1; history.replaceState({ idx }, "", location.href); }
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

function transition(fn, { scroll = true } = {}) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const run = () => { fn(); if (scroll) window.scrollTo(0, 0); };
  if (document.startViewTransition && !reduced) document.startViewTransition(run);
  else {
    run();
    if (!reduced) { view.classList.remove("view-enter"); void view.offsetWidth; view.classList.add("view-enter"); }
  }
}

const ctx = {
  go(hash, { replace = false, force = false } = {}) {
    if (hash === location.hash && force) return transition(render);
    if (replace) { location.replace(hash); }
    else location.hash = hash;
  },
  rerender() { const y = window.scrollY; render(); window.scrollTo(0, y); },
};

window.addEventListener("hashchange", () => { syncIdx(false); transition(render); });
back.onclick = () => { if (idx > 0) history.back(); else location.hash = "#/"; };

async function init() {
  try {
    const [tarot, lenormand] = await Promise.all(["data/tarot.json", "data/lenormand.json"].map((u) => fetch(u).then((r) => { if (!r.ok) throw new Error(u); return r.json(); })));
    store.db = { tarot, lenormand };
  } catch (err) {
    view.innerHTML = `<h1>Không tải được dữ liệu lá</h1><p class="err">${esc(err.message)}</p><p><button class="btn primary" onclick="location.reload()">Tải lại</button></p>`;
    return;
  }
  syncIdx(true);
  render();
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
  window.addEventListener("storage", (e) => { if (e.key?.startsWith("boi.v1.")) toast("Dữ liệu vừa đổi ở tab khác — tải lại trang để đồng bộ."); });
}
init();
