// Các màn của SPA. Mỗi màn trả {title, step, html, mount(el, ctx)}.
import { SPREADS, spreadById, defaultYear } from "./spreads.js";
import { addRound, fixCell, applyCorrectionText, errorsOf, reveal, MAX, sizesOf, exportJSON, importJSON } from "./state.js";
import { tarotCard, lenCard, cardName } from "./reading.js";
import { analyze, ruleFollowUp } from "./insight.js";
import { suggestSpread } from "./topic.js";
import { tarotSVG, lenormandSVG, backSVG } from "./cards.js";
import { readingToMarkdown } from "./markdown.js";
import { LOCAL_KEY, PROVIDERS, SYSTEM_READING, SYSTEM_CHAT, readingRequest, buildContext, chatGptPrompt, streamWithFallback, partialJSON, normalizeReading, discoverModels } from "./ai.js";
import { store, persist, saveSettings, aiKey, setAiKey, aiReady, bridge, getSession, newDraft, lockDraft, removeSession, routeFor, storage } from "./store.js";
import { gmt7 } from "./core.js";

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad = (n) => String(n).padStart(2, "0");
const scoreCls = (x) => (x == null ? "" : x >= 6.5 ? "hi" : x >= 5 ? "mid" : "lo");
const reduced = () => globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function toast(msg) {
  document.querySelectorAll(".toast").forEach((t) => t.remove());
  const t = document.createElement("div");
  t.className = "toast";
  t.setAttribute("role", "status");
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3400);
}
function save() { if (!persist()) toast("Trình duyệt không cho lưu — hãy Xuất JSON ở Lịch sử để giữ ánh xạ."); }

// Markdown tối giản an toàn (đậm, gạch đầu dòng, đoạn)
export function mdLite(text) {
  const blocks = String(text || "").split(/\n{2,}/);
  return blocks.map((b) => {
    const lines = b.split("\n");
    const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/(^|\s)\*(\S.+?)\*(?=\s|$)/g, "$1<i>$2</i>");
    if (lines.every((l) => /^\s*([-*•]|\d+\.)\s+/.test(l))) return `<ul>${lines.map((l) => `<li>${inline(l.replace(/^\s*([-*•]|\d+\.)\s+/, ""))}</li>`).join("")}</ul>`;
    if (/^#{1,4}\s/.test(lines[0])) return `<h3>${inline(lines[0].replace(/^#+\s*/, ""))}</h3>${lines.length > 1 ? `<p>${lines.slice(1).map(inline).join("<br>")}</p>` : ""}`;
    return `<p>${lines.map(inline).join("<br>")}</p>`;
  }).join("");
}

async function copyText(text, msg = "Đã chép.") {
  try { await navigator.clipboard.writeText(text); toast(msg); }
  catch (_) {
    const ta = document.createElement("textarea");
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); toast(msg); } catch (_) { toast("Không chép được — hãy chọn và sao chép thủ công."); }
    ta.remove();
  }
}
function download(name, text, type = "text/markdown") {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function steps(n) {
  const names = ["Câu hỏi", "Mẫu trải", "Chọn số", "Lật bài", "Giải"];
  return `<p class="step-label">Bước ${n}/5 · ${names[n - 1]}</p><ol class="steps" aria-hidden="true">${names.map((_, i) => `<li class="${i < n ? "on" : ""}"></li>`).join("")}</ol>`;
}
function notFound() {
  return { title: "Không tìm thấy", html: `<h1>Không tìm thấy câu hỏi</h1><p class="lead">Câu hỏi này không có trên máy này. Link chỉ mở được trên đúng máy/trình duyệt đã tạo, hoặc sau khi Nhập JSON.</p><div class="btns"><a class="btn primary" href="#/hoi-moi">Hỏi câu mới</a><a class="btn" href="#/lich-su">Lịch sử &amp; nhập JSON</a></div>` };
}
function lockBox(s, extra = "") {
  return `<div class="lock"><div>🔒 <b>Mã khoá SHA-256</b> — chụp lại trước khi chọn số</div><div class="mono">${s.hash}</div><div class="note">Khoá lúc <b>${esc(s.lockedAtText)}</b>. Bộ Tarot 78 lá và Lenormand 36 lá đã xáo độc lập; câu hỏi này luôn dùng đúng bộ đã khoá.</div>${extra}</div>`;
}

// ================= Trang chủ =================
function home() {
  const recent = [...store.sessions].sort((a, b) => (a.lockedAt < b.lockedAt ? 1 : -1)).slice(0, 3);
  const fan = [tarotSVG({ id: 17, nhom: "major", so: 17, bieu_tuong: "⭐", en: "The Star", vi: "Ngôi Sao" }), backSVG(), lenormandSVG({ id: 31, bieu_tuong: "☀️", en: "Sun", vi: "Mặt Trời" })].join("");
  return {
    title: "Bói Tarot + Lenormand",
    html: `
    <section class="hero">
      <div class="fan" aria-hidden="true">${fan}</div>
      <h1>Hỏi một câu.<br>Bài trả lời thẳng.</h1>
      <p class="lead">Tarot 78 lá + Lenormand 36 lá, xáo và khoá công bằng trước khi bạn chọn số. Giải theo tầng, quy đổi tiền minh bạch, hỏi tiếp như trò chuyện.</p>
      <div class="btns" style="justify-content:center"><a class="btn primary" href="#/hoi-moi">✦ Đặt câu hỏi</a>${recent[0] ? `<a class="btn" href="${routeFor(recent[0])}">Tiếp tục câu gần nhất</a>` : ""}</div>
    </section>
    ${recent.length ? `<section class="card"><h2>Gần đây</h2><ul class="list">${recent.map(itemHTML).join("")}</ul><p><a href="#/lich-su">Xem tất cả →</a></p></section>` : ""}
    <section class="card features">
      <div class="feature"><span class="fi" aria-hidden="true">🔒</span><div><b>Khoá công bằng</b><p class="note">Seed ngẫu nhiên 32 byte → xáo Fisher–Yates; mã SHA-256 hiện trước khi chọn số. Trải xong bấm “Kiểm chứng” để tự tính lại.</p></div></div>
      <div class="feature"><span class="fi" aria-hidden="true">↻</span><div><b>Mỗi câu hỏi một bộ bài</b><p class="note">Rút thêm dùng lại đúng bộ cũ; số trùng ra đúng lá cũ — lá lặp là nhấn mạnh, không phải xác nhận độc lập.</p></div></div>
      <div class="feature"><span class="fi" aria-hidden="true">✧</span><div><b>Giải sâu</b><p class="note">Có khoá Gemini/OpenAI/Claude: AI đọc như người có nghề. Không khoá: động cơ luật vẫn đọc vị trí, cặp, bộ ba, nối tầng và mâu thuẫn.</p></div></div>
    </section>
    <p class="foot">Mang tính chiêm nghiệm. Mọi con số tiền là quy đổi huyền học, không phải dự báo tài chính.</p>`,
  };
}
function itemHTML(s) {
  const st = s.draft ? "Nháp" : !s.rounds.length ? "Đã khoá" : s.ai?.reading ? "Đã giải (AI)" : "Đã lật";
  return `<li><a class="item" href="${routeFor(s)}"><b>${esc(s.cauHoi || "(không tên)")}</b><span class="meta"><span class="chip">${esc(s.draft ? "Chưa chọn mẫu" : spreadById(s.spreadId).ten)}</span><span class="chip">${st}</span><span class="chip">${esc(s.lockedAtText || gmt7(new Date(s.createdAt || Date.now())))}</span></span></a></li>`;
}

// ================= Hỏi mới =================
const EXAMPLES = ["Thu nhập 3 tháng tới của tôi thế nào?", "Có nên ký hợp đồng với bên này không?", "Người ấy có quay lại không?", "Tài chính năm 2027 từng tháng", "Vận hạn 4–6 tuần tới"];
function ask() {
  return {
    title: "Câu hỏi mới", step: 1,
    html: `${steps(1)}<h1>Bạn muốn hỏi gì?</h1>
    <form id="fAsk" class="stack card glow">
      <label for="q">Câu hỏi càng cụ thể, bài càng rõ</label>
      <textarea id="q" name="q" rows="3" required maxlength="500" placeholder="Vd: Thu nhập 3 tháng tới của tôi thế nào?"></textarea>
      <div class="chips" aria-label="Câu hỏi mẫu">${EXAMPLES.map((e) => `<button type="button" class="chip" data-ex="${esc(e)}">${esc(e)}</button>`).join("")}</div>
      <p class="note" id="sug" aria-live="polite"></p>
      <button class="btn primary block" type="submit">Tiếp: chọn mẫu trải →</button>
    </form>`,
    mount(el, ctx) {
      const q = el.querySelector("#q"), sug = el.querySelector("#sug");
      const upd = () => { const v = q.value.trim(); if (!v) { sug.textContent = ""; return; } const s = suggestSpread(v); sug.innerHTML = `Gợi ý: <b>${esc(spreadById(s.id).ten)}</b> — ${esc(s.why)}.`; };
      q.addEventListener("input", upd);
      el.querySelectorAll("[data-ex]").forEach((b) => (b.onclick = () => { q.value = b.dataset.ex; upd(); q.focus(); }));
      el.querySelector("#fAsk").onsubmit = (e) => {
        e.preventDefault();
        const v = q.value.trim();
        if (!v) return;
        const d = newDraft(v, suggestSpread(v));
        ctx.go(`#/trai/${d.id}`);
      };
      setTimeout(() => q.focus(), 50);
    },
  };
}

// ================= Chọn mẫu trải =================
function spreadView(id) {
  const s = getSession(id);
  if (!s) return notFound();
  if (!s.draft) return { redirect: `#/chon-so/${id}` };
  const sug = s.suggestion || suggestSpread(s.cauHoi);
  let cur = s.pendingSpread || sug.id;
  let year = s.pendingYear || sug.year || defaultYear();
  let tiers = spreadById(cur).tiers(year).map((t) => ({ ...t }));
  const sp0 = spreadById(cur);
  return {
    title: "Chọn mẫu trải", step: 2,
    html: `${steps(2)}<h1>Chọn mẫu trải</h1>
    <p class="lead">“${esc(s.cauHoi)}”</p>
    <form id="fSpread" class="stack">
      <div class="spreads" role="radiogroup" aria-label="Mẫu trải">${SPREADS.map((p) => `
        <label class="spread"><input type="radio" name="sp" value="${p.id}" ${p.id === cur ? "checked" : ""}>
          <b>${esc(p.ten)}</b>${p.id === sug.id ? `<span class="chip gold badge">Gợi ý</span>` : ""}
          <span class="note" style="display:block">${esc(p.goiY)}</span>
          ${p.id === sug.id ? `<span class="note" style="display:block">Vì ${esc(sug.why)}.</span>` : ""}
        </label>`).join("")}</div>
      <section class="card">
        <h2>Tầng &amp; số lá</h2>
        <div id="tiers"></div>
        <div class="row wrap"><button type="button" class="btn small" id="addTier">＋ Thêm tầng</button></div>
        <label class="check"><input type="checkbox" name="money" ${sug.money || sp0.money ? "checked" : ""}> Câu hỏi về tiền (bật bảng quy đổi)</label>
        <label class="check"><input type="checkbox" name="rev"> Cho phép lá ngược (Tarot)</label>
      </section>
      <button class="btn primary block" type="submit">🔒 Xáo &amp; khoá bài</button>
      <p class="note">Sau khi khoá, bộ bài và mẫu trải của câu hỏi này cố định. Muốn đổi thì tạo câu hỏi mới.</p>
    </form>`,
    mount(el, ctx) {
      const box = el.querySelector("#tiers");
      const draw = () => {
        const sp = spreadById(cur);
        const tt = tiers.reduce((a, t) => a + (+t.t || 0), 0), tl = tiers.reduce((a, t) => a + (+t.l || 0), 0);
        box.innerHTML = `${sp.needsYear ? `<label>Năm<input id="yr" type="number" inputmode="numeric" min="1900" max="2200" value="${year}"></label>` : ""}
          ${tiers.map((t, i) => `<div class="tier-row" data-i="${i}">
            <label>Tầng ${i + 1}<input data-f="ten" value="${esc(t.ten)}" aria-label="Tên tầng ${i + 1}"></label>
            <label>Tarot<input data-f="t" type="number" inputmode="numeric" min="0" max="78" value="${t.t}"></label>
            <label>Lenor<input data-f="l" type="number" inputmode="numeric" min="0" max="36" value="${t.l}"></label>
            <button type="button" class="icon-btn" data-del="${i}" aria-label="Xoá tầng ${i + 1}">✕</button></div>`).join("")}
          <p class="note">Tổng: <b>${tt}</b> Tarot + <b>${tl}</b> Lenormand · ${tiers.length} tầng.</p>`;
      };
      draw();
      el.querySelectorAll('input[name="sp"]').forEach((r) => (r.onchange = () => {
        cur = r.value;
        tiers = spreadById(cur).tiers(year).map((t) => ({ ...t }));
        el.querySelector('[name="money"]').checked = spreadById(cur).money || sug.money;
        s.pendingSpread = cur; save();
        draw();
      }));
      box.addEventListener("input", (e) => {
        if (e.target.id === "yr") { const y = +e.target.value; if (y >= 1900 && y <= 2200) { year = y; s.pendingYear = y; tiers = spreadById(cur).tiers(year).map((t, i) => ({ ...t, t: tiers[i]?.t ?? t.t, l: tiers[i]?.l ?? t.l })); } return; }
        const row = e.target.closest(".tier-row"); if (!row) return;
        const f = e.target.dataset.f; tiers[+row.dataset.i][f] = f === "ten" ? e.target.value : +e.target.value;
      });
      box.addEventListener("change", (e) => { if (e.target.id === "yr" || (e.target.dataset.f && e.target.dataset.f !== "ten")) draw(); });
      box.addEventListener("click", (e) => { const b = e.target.closest("[data-del]"); if (b && tiers.length > 1) { tiers.splice(+b.dataset.del, 1); draw(); } });
      el.querySelector("#addTier").onclick = () => { const l = tiers[tiers.length - 1] || { t: 3, l: 3, pos: null }; tiers.push({ ten: `Tầng ${tiers.length + 1}`, t: l.t, l: l.l, pos: l.pos }); draw(); };
      el.querySelector("#fSpread").onsubmit = async (e) => {
        e.preventDefault();
        const f = e.target.elements;
        const clean = tiers.map((t, i) => ({ ten: String(t.ten || `Tầng ${i + 1}`).trim().slice(0, 120), t: Math.max(0, Math.min(78, +t.t || 0)), l: Math.max(0, Math.min(36, +t.l || 0)), pos: t.pos || null }));
        if (!clean.some((t) => t.t || t.l)) return toast("Cần ít nhất một lá.");
        const sp = spreadById(cur);
        const locked = await lockDraft(s, { spreadId: sp.id, tiers: clean, money: f.money.checked, reversals: f.rev.checked, nam: sp.needsYear ? year : null });
        toast("Đã xáo & khoá. Hãy chụp mã khoá.");
        ctx.go(`#/chon-so/${locked.id}`, { replace: true });
      };
    },
  };
}

// ================= Chọn số =================
const picksBy = new Map();
function pickView(id) {
  const s = getSession(id);
  if (!s) return notFound();
  if (s.draft) return { redirect: `#/trai/${id}` };
  const sizes = sizesOf(s);
  const extra = s.rounds.length > 0;
  const st = picksBy.get(id) || { tarot: [], lenormand: [], deck: sizes.tarot.some(Boolean) ? "tarot" : "lenormand" };
  picksBy.set(id, st);
  const used = (deck) => new Set(s.rounds.flatMap((r) => (r[deck] || []).flat()).filter((c) => c.ok).map((c) => c.n));
  const needT = sizes.tarot.reduce((a, b) => a + b, 0), needL = sizes.lenormand.reduce((a, b) => a + b, 0);
  const grid = () => {
    const u = used(st.deck);
    let h = "";
    for (let n = 1; n <= MAX[st.deck]; n++) {
      const k = st[st.deck].indexOf(n);
      h += `<button type="button" class="num${u.has(n) ? " used" : ""}${k >= 0 ? " picked" : ""}" data-num="${n}" aria-pressed="${k >= 0}" aria-label="Số ${pad(n)}${u.has(n) ? ", đã rút trước" : ""}">${pad(n)}${k >= 0 ? `<span class="ord">${k + 1}</span>` : ""}</button>`;
    }
    return h;
  };
  const line = () => {
    const t = st.tarot.map(pad).join(" "), l = st.lenormand.map(pad).join(" ");
    return [t && `T: ${t} (${st.tarot.length}${extra ? "" : `/${needT}`})`, l && `L: ${l} (${st.lenormand.length}${extra ? "" : `/${needL}`})`].filter(Boolean).join(" · ") || "Bấm số theo thứ tự muốn lật, hoặc gõ bên dưới.";
  };
  return {
    title: "Chọn số", step: 3,
    html: `${steps(3)}<h1>${extra ? "Rút thêm" : "Chọn số"}</h1>
    <p class="lead">“${esc(s.cauHoi)}” · ${esc(spreadById(s.spreadId).ten)}</p>
    ${lockBox(s)}
    ${extra ? `<p class="note">Rút thêm dùng lại đúng bộ đã khoá. Số có chấm tím là số đã rút — chọn lại sẽ ra đúng lá cũ (lá lặp = nhấn mạnh, không phải xác nhận độc lập).</p>` : `<div class="need"><span class="chip">Tarot ${sizes.tarot.join(" / ")}</span><span class="chip">Lenormand ${sizes.lenormand.join(" / ")}</span></div>`}
    <div class="tabs" role="tablist">
      <button type="button" role="tab" class="btn small" data-deck="tarot" aria-selected="${st.deck === "tarot"}">Tarot 01–78</button>
      <button type="button" role="tab" class="btn small" data-deck="lenormand" aria-selected="${st.deck === "lenormand"}">Lenormand 01–36</button>
    </div>
    <div class="grid-nums" id="grid" role="group" aria-label="Lưới số úp">${grid()}</div>
    <p class="picked-line" id="line" aria-live="polite">${esc(line())}</p>
    <label for="typed">Hoặc gõ số (dấu “/” tách tầng)</label>
    <textarea id="typed" rows="3" placeholder="T: 8 37 50 69/ 68 75 36 22/ 8 36 55 71&#10;Lenor: 22 25 27 29 / 10 20 25 21/ 11 23 26 34"></textarea>
    <div class="btns"><button type="button" class="btn primary" id="go">Lật bài →</button><button type="button" class="btn ghost" id="clr">Xoá chọn</button></div>`,
    mount(el, ctx) {
      const g = el.querySelector("#grid"), ln = el.querySelector("#line");
      el.querySelectorAll("[data-deck]").forEach((b) => (b.onclick = () => { st.deck = b.dataset.deck; el.querySelectorAll("[data-deck]").forEach((x) => x.setAttribute("aria-selected", x === b)); g.innerHTML = grid(); }));
      g.onclick = (e) => {
        const b = e.target.closest("[data-num]"); if (!b) return;
        const n = +b.dataset.num, list = st[st.deck], k = list.indexOf(n);
        if (k >= 0) list.splice(k, 1); else list.push(n);
        g.innerHTML = grid(); ln.textContent = line();
        navigator.vibrate?.(8);
      };
      el.querySelector("#clr").onclick = () => { st.tarot = []; st.lenormand = []; g.innerHTML = grid(); ln.textContent = line(); };
      el.querySelector("#go").onclick = () => {
        let text = el.querySelector("#typed").value.trim();
        if (!text) {
          if (!st.tarot.length && !st.lenormand.length) return toast("Chưa chọn hoặc gõ số nào.");
          text = [st.tarot.length && `T: ${st.tarot.join(" ")}`, st.lenormand.length && `L: ${st.lenormand.join(" ")}`].filter(Boolean).join("\n");
        }
        try {
          const { errors } = addRound(s, text, st.deck);
          picksBy.delete(id);
          save();
          if (errors.length) toast(`Có ${errors.length} số ngoài khoảng — các số hợp lệ đã lật, nhập số thay ở ô trống.`);
          ctx.go(`#/lat/${id}`);
        } catch (err) { toast(err.message); }
      };
    },
  };
}

// ================= Lật bài =================
const flipped = new Set();
function cardFace(deck, cell) {
  if (deck === "tarot") return tarotSVG(tarotCard(store.db, cell.card), { n: cell.n, rev: cell.rev });
  return lenormandSVG(lenCard(store.db, cell.card), { n: cell.n });
}
function cardTile(deck, cell, key, shown) {
  if (!cell.ok) return `<div class="cardcell"><div class="flip errslot" role="img" aria-label="Ô trống, số ${esc(cell.raw)} ngoài khoảng"><div class="flip-inner"><div class="back">?<br>${esc(cell.raw)}</div></div></div><span class="cap err">Số ${esc(cell.raw)} không có</span></div>`;
  const c = deck === "tarot" ? tarotCard(store.db, cell.card) : lenCard(store.db, cell.card);
  return `<div class="cardcell"><button type="button" class="flip${shown ? " shown" : ""}${cell.repeatOf ? " repeat" : ""}" data-key="${key}" aria-label="Lá số ${pad(cell.n)}${shown ? `: ${esc(c.vi)}` : ", bấm để lật"}"><span class="flip-inner"><span class="back">${backSVG(pad(cell.n))}</span><span class="face">${cardFace(deck, cell)}</span></span></button><span class="cap">${shown ? esc(c.vi) + (cell.rev ? " (ngược)" : "") : "&nbsp;"}${cell.repeatOf ? " ↻" : ""}</span></div>`;
}
function fixBox(s, ri) {
  const errs = errorsOf(s.rounds[ri]);
  if (!errs.length) return "";
  return `<div class="fix-box" id="fix"><b>Có ${errs.length} số ngoài khoảng.</b> Đã lật các số hợp lệ và để trống đúng ô lỗi — không tự thay.
    ${errs.map((e) => `<div class="row wrap" style="margin-top:8px"><span class="grow">${e.deck === "tarot" ? "Tarot" : "Lenormand"} · tầng ${e.tier + 1} · ô ${e.idx + 1}: số <b>${esc(e.raw)}</b> (chỉ có 01–${MAX[e.deck]}). Số thay:</span><input style="width:90px" inputmode="numeric" data-fix="${e.deck}|${e.tier}|${e.idx}" aria-label="Số thay cho ô ${e.idx + 1} tầng ${e.tier + 1}" placeholder="01–${MAX[e.deck]}"></div>`).join("")}
    <label style="margin-top:10px">Hoặc gõ kiểu “Là số 04” (thay lần lượt ô trống)<input id="fixText" placeholder="Là số 04"></label>
    <button type="button" class="btn small" id="fixGo" style="margin-top:8px">Thay</button></div>`;
}
function flipView(id, query) {
  const s = getSession(id);
  if (!s) return notFound();
  if (s.draft) return { redirect: `#/trai/${id}` };
  if (!s.rounds.length) return { redirect: `#/chon-so/${id}` };
  const ri = Math.min(+(query.get("r") ?? s.rounds.length - 1) || 0, s.rounds.length - 1);
  const round = s.rounds[ri];
  const fk = `${id}:${ri}`;
  const done = flipped.has(fk);
  const n = Math.max(round.tarot.length, round.lenormand.length);
  let k = 0;
  const rows = [];
  for (let ti = 0; ti < n; ti++) {
    const tier = s.tiers[ti] || { ten: `Tầng ${ti + 1}` };
    rows.push(`<section class="card"><h2>${esc(tier.ten)}${ri ? " · rút thêm" : ""}</h2>
      ${(round.tarot[ti] || []).length ? `<p class="lbl">Tarot</p><div class="spread-row">${round.tarot[ti].map((c, i) => cardTile("tarot", c, `${ti}-t-${i}-${k++}`, done) + "").join("")}</div>` : ""}
      ${(round.lenormand[ti] || []).length ? `<p class="lbl">Lenormand</p><div class="spread-row">${round.lenormand[ti].map((c, i) => cardTile("lenormand", c, `${ti}-l-${i}-${k++}`, done)).join("")}</div>` : ""}
    </section>`);
  }
  return {
    title: "Lật bài", step: 4,
    html: `${steps(4)}<h1>${ri ? `Lượt rút thêm #${ri}` : "Lật bài"}</h1>
    <p class="lead">“${esc(s.cauHoi)}”</p>
    <p class="note mono" style="word-break:normal;white-space:pre-wrap">Đã chọn: ${esc(round.input)}</p>
    ${fixBox(s, ri)}
    <div class="btns"><button type="button" class="btn" id="all">Lật tất cả</button><a class="btn primary" href="#/giai/${id}">Xem giải →</a></div>
    ${rows.join("")}
    <div class="btns"><a class="btn primary block" href="#/giai/${id}">Xem giải →</a></div>`,
    mount(el, ctx) {
      const flipOne = (b) => {
        if (b.classList.contains("shown")) return;
        b.classList.add("shown");
        const cap = b.parentElement.querySelector(".cap");
        const [ti, deck, i] = b.dataset.key.split("-");
        const cell = round[deck === "t" ? "tarot" : "lenormand"][+ti][+i];
        const c = deck === "t" ? tarotCard(store.db, cell.card) : lenCard(store.db, cell.card);
        cap.textContent = c.vi + (cell.rev ? " (ngược)" : "") + (cell.repeatOf ? " ↻" : "");
        b.setAttribute("aria-label", `Lá số ${pad(cell.n)}: ${c.vi}`);
      };
      const all = () => {
        const list = [...el.querySelectorAll(".flip[data-key]:not(.shown)")];
        if (reduced()) list.forEach(flipOne);
        else list.forEach((b, j) => setTimeout(() => flipOne(b), j * 140));
        flipped.add(fk);
      };
      el.querySelectorAll(".flip[data-key]").forEach((b) => (b.onclick = () => flipOne(b)));
      el.querySelector("#all").onclick = all;
      if (!done) setTimeout(all, reduced() ? 0 : 450);
      el.querySelectorAll("[data-fix]").forEach((inp) => (inp.onchange = () => {
        const [deck, tier, idx] = inp.dataset.fix.split("|");
        const r = fixCell(s, ri, deck, +tier, +idx, parseInt(inp.value, 10));
        if (!r.ok) { toast(`Số ${inp.value} vẫn ngoài khoảng 01–${r.max}.`); inp.value = ""; return; }
        save(); delete s.ai; ctx.rerender();
      }));
      const ft = el.querySelector("#fixGo");
      if (ft) ft.onclick = () => {
        const res = applyCorrectionText(s, el.querySelector("#fixText").value);
        if (!res) return toast("Gõ theo dạng “Là số 04”.");
        if (res.rejected.length) toast(`Số ${res.rejected.map((x) => x.to).join(", ")} vẫn ngoài khoảng.`);
        if (res.filled.length) { save(); delete s.ai; ctx.rerender(); }
      };
    },
  };
}

// ================= Giải =================
const live = new Map(); // id → {text, model, err, ctrl}
function readingHTML(r, { streaming = false, aiTiersOnly = false } = {}) {
  if (!r) return "";
  const L = (arr) => (arr && arr.length ? `<ul>${arr.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "");
  const tiers = (r.tang || []).map((t) => `
    <section class="tier">
      <div class="tier-title"><h3>${esc(t.ten)}</h3><span>${t.diem != null ? `<span class="score ${scoreCls(t.diem)}">${t.diem}/10</span>` : ""}${t.tra_loi ? ` <span class="chip gold">${esc(t.tra_loi)}</span>` : ""}</span></div>
      ${t.tarot_doc?.length ? `<p class="lbl">Tarot theo vị trí</p>${L(t.tarot_doc)}` : ""}
      ${t.dong_chay ? `<p class="lbl">Dòng chảy</p><p>${esc(t.dong_chay)}</p>` : ""}
      ${t.lenormand_cap?.length ? `<p class="lbl">Lenormand theo cặp</p>${L(t.lenormand_cap)}` : ""}
      ${t.lenormand_bo_ba?.length ? `<p class="lbl">Bộ ba</p>${L(t.lenormand_bo_ba)}` : ""}
      ${t.lenormand_chuoi ? `<p class="lbl">Cả chuỗi</p><p>${esc(t.lenormand_chuoi)}</p>` : ""}
      ${t.lech ? `<p class="lbl">Lệch giữa hai bộ</p><p>${esc(t.lech)}</p>` : ""}
      ${t.chot || t.diem_nghen || t.loi_khuyen ? `<div class="chot">${t.chot ? `<p><b>Chốt tầng:</b> ${esc(t.chot)}</p>` : ""}${t.diem_nghen ? `<p><b>Điểm nghẽn:</b> ${esc(t.diem_nghen)}</p>` : ""}${t.loi_khuyen ? `<p><b>Lời khuyên:</b> ${esc(t.loi_khuyen)}</p>` : ""}</div>` : ""}
      ${(t.lap || []).map((x) => `<p class="repeat-note">↻ ${esc(x)}</p>`).join("")}
      ${(t.o_trong || []).map((x) => `<p class="err">⚠ ${esc(x)}</p>`).join("")}
    </section>`).join("");
  return `<div class="rd${streaming ? " streaming" : ""}">
    ${r.tong_quan ? `<p class="lead">${esc(r.tong_quan)}</p>` : ""}
    ${r.chu_de_troi?.length ? `<p class="lbl">Chủ đề trội</p>${L(r.chu_de_troi)}` : ""}
    ${tiers}
    ${r.noi_tang?.length ? `<h3>Nối các tầng</h3>${L(r.noi_tang)}` : ""}
    ${r.mau_thuan?.length ? `<h3>Mâu thuẫn</h3>${L(r.mau_thuan)}` : ""}
    ${r.tien ? `<h3>Nhận xét tiền</h3><p>${esc(r.tien)}</p>` : ""}
    ${r.tong_ket ? `<h3>Tổng kết</h3><p>${esc(r.tong_ket)}</p>` : ""}
    ${r.loi_khuyen?.length ? `<h3>Lời khuyên thực tế</h3>${L(r.loi_khuyen)}` : ""}
    ${r.canh_bao?.length ? `<h3>Cảnh báo</h3>${L(r.canh_bao)}` : ""}
  </div>`;
}
function tableHTML(s, ri = 0) {
  const round = s.rounds[ri];
  const n = Math.max(round.tarot.length, round.lenormand.length);
  let rows = "";
  for (let ti = 0; ti < n; ti++) rows += `<tr><td>${esc(s.tiers[ti]?.ten || `Tầng ${ti + 1}`)}</td><td>${(round.tarot[ti] || []).map((c) => esc(cardName(store.db, "tarot", c))).join("<br>") || "—"}</td><td>${(round.lenormand[ti] || []).map((c) => esc(cardName(store.db, "lenormand", c))).join("<br>") || "—"}</td></tr>`;
  return `<div class="table-wrap"><table><caption class="sr-only">Bảng lá theo tầng</caption><thead><tr><th scope="col">Tầng</th><th scope="col">Tarot (số → tên lá)</th><th scope="col">Lenormand (số → tên lá)</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function moneyHTML(m) {
  if (!m) return "";
  if (m.missing) return `<section class="card"><h2>Quy đổi tiền</h2><p class="note">Nhập thu nhập hiện tại/tháng ở <a href="#/cai-dat">Cài đặt</a> để có bảng quy đổi.</p></section>`;
  return `<section class="card"><h2>Quy đổi tiền (triệu đồng)</h2>
    <p class="warn">Quy đổi huyền học, không phải dự báo tài chính. Mốc: ${m.base} tr/tháng.</p>
    <div class="table-wrap"><table><thead><tr><th scope="col">Tháng</th><th scope="col">Tarot</th><th scope="col">Lenormand</th><th scope="col">Khoảng thực tế</th><th scope="col">Con số trung tâm</th></tr></thead><tbody>
    ${m.rows.map((r) => `<tr><td>${esc(r.ky)}</td><td>${esc(r.tarot)}</td><td>${esc(r.lenormand)}</td><td class="n">${r.low} – ${r.high}</td><td class="n"><b>${r.center}</b></td></tr>`).join("")}
    </tbody></table></div>
    <ul><li>Tổng ${m.rows.length} kỳ: <b>${m.total} tr</b> · bình quân <b>${m.perMonth} tr/tháng</b></li><li>Mạnh nhất ${esc(m.best.ky)} (${m.best.center} tr) · yếu nhất ${esc(m.worst.ky)} (${m.worst.center} tr)</li>${m.target ? `<li>So với mục tiêu ${m.target} tr/tháng: ${m.targetPct} % · ${m.monthsHit}/${m.rows.length} kỳ chạm</li>` : ""}${m.prevYear ? `<li>So với năm trước (${m.prevYear} tr): ${m.vsPrevPct >= 0 ? "+" : ""}${m.vsPrevPct} %</li>` : ""}</ul>
    <details><summary>Công thức quy đổi</summary><p class="formula">${m.formula.map(esc).join("\n")}${m.rows.map((r) => `\n${r.ky}: S ${r.S} · V ${r.V} · hệ số ×${r.mult} · biên ±${Math.round(r.margin * 100)} %`).join("")}</p></details></section>`;
}

async function runAI(s, el, ctx, rule) {
  const provider = store.settings.aiProvider || "gemini";
  const key = aiKey(provider);
  if (!key) return toast("Chưa có khoá — thêm ở Cài đặt.");
  const prev = live.get(s.id);
  prev?.ctrl?.abort();
  const st = { text: "", model: "", err: "", ctrl: new AbortController() };
  live.set(s.id, st);
  const out = el.querySelector("#aiOut"), status = el.querySelector("#aiStatus");
  let raf = 0;
  const paint = () => {
    raf = 0;
    const obj = partialJSON(st.text);
    if (out) out.innerHTML = obj ? readingHTML(normalizeReading(obj, rule), { streaming: true }) : `<p class="note streaming">Đang đọc bài…</p>`;
  };
  if (status) status.textContent = "Đang kết nối…";
  try {
    const money = rule._money;
    const { text, model } = await streamWithFallback({
      provider, key, model: store.settings.aiModel || "", storage,
      system: SYSTEM_READING, json: true,
      messages: [{ role: "user", text: readingRequest(store.db, s, { reading: rule, money, settings: store.settings }) }],
      signal: st.ctrl.signal,
      onModel: (m) => { st.model = m; if (status) status.textContent = `Đang giải bằng ${m}…`; },
      onText: (full) => { st.text = full; if (!raf) raf = requestAnimationFrame(paint); },
    });
    const obj = partialJSON(text);
    const reading = normalizeReading(obj, rule);
    if (!reading || !reading.tang.length) throw new Error("AI trả về sai khuôn — thử lại hoặc dùng bản luật.");
    s.ai = { provider, model, at: new Date().toISOString(), rounds: s.rounds.length, reading: { ...reading, _money: null }, raw: text };
    save();
    live.delete(s.id);
    ctx.rerender();
  } catch (e) {
    if (e.name === "AbortError") return;
    live.delete(s.id);
    if (status) status.innerHTML = `<span class="err">Không gọi được AI: ${esc(e.message)}</span>`;
    if (out) out.innerHTML = `<p class="note">Đang hiển thị bản giải bằng động cơ luật bên dưới. Có thể bấm “Chép prompt cho ChatGPT”.</p>`;
  }
}

function readView(id, query) {
  const s = getSession(id);
  if (!s) return notFound();
  if (s.draft) return { redirect: `#/trai/${id}` };
  if (!s.rounds.length) return { redirect: `#/chon-so/${id}` };
  const rule = analyze(store.db, s, store.settings, 0);
  const extras = s.rounds.slice(1).map((_, i) => analyze(store.db, s, store.settings, i + 1));
  const hasKey = aiReady();
  const aiStale = s.ai && s.ai.rounds !== s.rounds.length;
  const viewing = s.ai && query.get("ban") !== "luat" ? "ai" : "luat";
  const aiReading = s.ai ? { ...s.ai.reading, _money: rule._money } : null;
  const shown = viewing === "ai" ? aiReading : rule;
  return {
    title: "Giải bài", step: 5,
    html: `${steps(5)}<h1>Bản giải</h1>
    <p class="lead">“${esc(s.cauHoi)}”</p>
    <p class="note">${esc(spreadById(s.spreadId).ten)} · khoá lúc ${esc(s.lockedAtText)} · <a href="#/kiem-chung/${id}">Kiểm chứng mã khoá</a></p>
    ${tableHTML(s)}
    <section class="card glow" id="aiCard">
      <div class="row wrap"><h2 class="grow" style="margin:0">${viewing === "ai" ? "Giải sâu bằng AI" : "Giải theo luật"}</h2>
        <span class="src">${s.ai ? `<a class="btn small ${viewing === "ai" ? "primary" : ""}" href="#/giai/${id}">Bản AI</a><a class="btn small ${viewing === "luat" ? "primary" : ""}" href="#/giai/${id}?ban=luat">Bản luật</a>` : ""}</span></div>
      <p class="note" id="aiStatus">${viewing === "ai" ? `Giải bởi ${esc(s.ai.model)} · ${esc(gmt7(new Date(s.ai.at)))}${aiStale ? " · <span class='warn'>có lượt rút mới sau bản này — bấm Giải lại</span>" : ""}` : hasKey ? (aiKey() === LOCAL_KEY ? "Cầu nối AI máy nhà sẵn sàng — đang chuẩn bị giải bằng AI." : "Có khoá — đang chuẩn bị giải bằng AI.") : "Chưa có khoá AI: đang dùng động cơ luật. Thêm khoá Gemini ở Cài đặt để AI đọc sâu hơn."}</p>
      <div id="aiOut"></div>
      ${readingHTML(shown)}
    </section>
    ${moneyHTML(rule._money)}
    ${extras.map((r, i) => `<section class="card"><h2>Lượt rút thêm #${i + 1}</h2>${tableHTML(s, i + 1)}<details><summary>Bản giải luật của lượt này</summary>${readingHTML(r)}</details><p><a href="#/lat/${id}?r=${i + 1}">Xem lá đã lật →</a></p></section>`).join("")}
    <section class="card">
      <div class="btns">
        <a class="btn primary" href="#/hoi-tiep/${id}">💬 Hỏi tiếp</a>
        <a class="btn" href="#/chon-so/${id}">＋ Rút thêm</a>
        ${hasKey ? `<button type="button" class="btn" id="reAI">${s.ai ? "Giải lại bằng AI" : "Giải bằng AI"}</button>` : ""}
        <button type="button" class="btn" id="cp">Chép prompt cho ChatGPT</button>
        <button type="button" class="btn ghost" id="md">Tải bản giải (.md)</button>
      </div>
    </section>`,
    mount(el, ctx) {
      el.querySelector("#cp").onclick = () => copyText(chatGptPrompt(store.db, s, { reading: rule, money: rule._money, settings: store.settings }), "Đã chép prompt — dán vào ChatGPT.");
      el.querySelector("#md").onclick = () => download(`giai-${id}.md`, readingToMarkdown(store.db, s, shown));
      const re = el.querySelector("#reAI");
      if (re) re.onclick = () => { delete s.ai; save(); ctx.go(`#/giai/${id}`, { replace: true, force: true }); };
      if (hasKey && !s.ai && !query.get("ban")) {
        const running = live.get(id);
        if (!running) runAI(s, el, ctx, rule);
      }
    },
  };
}

// ================= Hỏi tiếp =================
function followView(id) {
  const s = getSession(id);
  if (!s) return notFound();
  if (s.draft || !s.rounds.length) return { redirect: routeFor(s) };
  s.chat ||= [];
  const hasKey = aiReady();
  const msgs = s.chat.map((m) => `<div class="msg ${m.role}"><div class="who">${m.role === "user" ? esc(store.settings.xungHo || "Bạn") : esc(m.model ? `AI · ${m.model}` : "Động cơ luật")}</div>${mdLite(m.text)}</div>`).join("");
  return {
    title: "Hỏi tiếp",
    html: `<h1>Hỏi tiếp</h1>
    <p class="lead">“${esc(s.cauHoi)}” — cùng bộ bài đã khoá, ${s.rounds.length} lượt lật.</p>
    <p class="note">${hasKey ? "AI nhớ đủ các lá đã lật, bản giải trước và các câu hỏi trước." : "Chưa có khoá AI: động cơ luật trả lời theo tầng/chủ đề bạn nhắc (vd “tháng 12 thế nào?”, “rủi ro gì?”). Có thể chép prompt sang ChatGPT."}</p>
    <div class="chat" id="chat">${msgs || `<p class="note">Ví dụ: “Tầng 2 có rủi ro gì?”, “Tháng nào nên chốt việc lớn?”, “Lá Mặt Trăng ở đây ý là sao?”</p>`}</div>
    <form class="composer" id="fChat"><label class="sr-only" for="ask2">Câu hỏi tiếp</label><textarea id="ask2" rows="1" placeholder="Hỏi tiếp…" required></textarea><button class="btn primary" type="submit" aria-label="Gửi">➤</button></form>
    <div class="btns"><a class="btn small" href="#/giai/${id}">← Bản giải</a><a class="btn small" href="#/chon-so/${id}">＋ Rút thêm lá</a><button type="button" class="btn small" id="cp2">Chép prompt cho ChatGPT</button>${s.chat.length ? `<button type="button" class="btn small ghost" id="clearChat">Xoá hội thoại</button>` : ""}</div>`,
    mount(el, ctx) {
      const ta = el.querySelector("#ask2"), chat = el.querySelector("#chat");
      ta.addEventListener("input", () => { ta.style.height = "auto"; ta.style.height = Math.min(160, ta.scrollHeight) + "px"; });
      ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); el.querySelector("#fChat").requestSubmit(); } });
      el.querySelector("#cp2").onclick = () => {
        const rule = analyze(store.db, s, store.settings, 0);
        copyText(chatGptPrompt(store.db, s, { reading: s.ai?.reading || rule, money: rule._money, settings: store.settings, followUp: ta.value.trim() }), "Đã chép prompt (kèm hội thoại).");
      };
      const cl = el.querySelector("#clearChat");
      if (cl) cl.onclick = () => { if (confirm("Xoá toàn bộ hỏi đáp của câu này?")) { s.chat = []; save(); ctx.rerender(); } };
      chat.lastElementChild?.scrollIntoView?.({ block: "end" });
      el.querySelector("#fChat").onsubmit = async (e) => {
        e.preventDefault();
        const q = ta.value.trim();
        if (!q) return;
        ta.value = "";
        s.chat.push({ role: "user", text: q, at: new Date().toISOString() });
        save();
        const rule = analyze(store.db, s, store.settings, 0);
        chat.querySelector("p.note")?.remove();
        chat.insertAdjacentHTML("beforeend", `<div class="msg user"><div class="who">${esc(store.settings.xungHo || "Bạn")}</div>${mdLite(q)}</div><div class="msg assistant" id="pending"><div class="who">…</div><p class="streaming"></p></div>`);
        const box = chat.querySelector("#pending");
        box.scrollIntoView({ block: "end" });
        if (!hasKey) {
          const text = ruleFollowUp(rule, q);
          s.chat.push({ role: "assistant", text, at: new Date().toISOString() });
          save();
          ctx.rerender();
          return;
        }
        const provider = store.settings.aiProvider || "gemini";
        const base = buildContext(store.db, s, { reading: s.ai?.reading || rule, money: rule._money, settings: store.settings });
        const messages = [{ role: "user", text: `${base}\n\n(Bản giải đã đưa ở trên. Từ đây trả lời các câu hỏi tiếp theo.)` }, { role: "assistant", text: s.ai?.raw || "Đã nắm bản giải và các lá." }, ...s.chat.map((m) => ({ role: m.role, text: m.text }))];
        let raf = 0, cur = "";
        try {
          const { text, model } = await streamWithFallback({
            provider, key: aiKey(provider), model: store.settings.aiModel || "", storage, system: SYSTEM_CHAT, json: false, messages,
            onModel: (m) => { box.querySelector(".who").textContent = `AI · ${m}`; },
            onText: (full) => { cur = full; if (!raf) raf = requestAnimationFrame(() => { raf = 0; box.innerHTML = `<div class="who">${esc(box.querySelector(".who")?.textContent || "AI")}</div><div class="streaming">${mdLite(cur)}</div>`; }); },
          });
          s.chat.push({ role: "assistant", text, model, at: new Date().toISOString() });
        } catch (err) {
          s.chat.push({ role: "assistant", text: `Không gọi được AI (${err.message}). Trả lời theo luật:\n\n${ruleFollowUp(rule, q)}`, at: new Date().toISOString() });
        }
        save();
        ctx.rerender();
      };
    },
  };
}

// ================= Lịch sử =================
function historyView() {
  const list = [...store.sessions].sort((a, b) => (a.lockedAt < b.lockedAt ? 1 : -1));
  return {
    title: "Lịch sử",
    html: `<h1>Lịch sử câu hỏi</h1>
    <label for="filter" class="sr-only">Tìm</label><input id="filter" type="search" placeholder="Tìm câu hỏi…">
    <ul class="list" id="hl" style="margin-top:12px">${list.map((s) => itemHTML(s).replace("</a></li>", `</a><button type="button" class="btn small ghost" data-del="${esc(s.id)}" style="margin-top:6px" aria-label="Xoá câu hỏi">Xoá</button></li>`)).join("") || `<li class="note">Chưa có câu hỏi nào.</li>`}</ul>
    <section class="card"><h2>Sao lưu</h2><p class="note">Bảng ánh xạ chỉ nằm trên máy này. Xuất JSON để giữ hoặc chuyển sang máy khác; nhập lại không ghi đè câu đã có.</p>
    <div class="btns"><button type="button" class="btn" id="exp">Xuất JSON</button><label class="btn">Nhập JSON<input type="file" id="imp" accept="application/json,.json" hidden></label></div></section>`,
    mount(el, ctx) {
      el.querySelector("#filter").oninput = (e) => { const v = e.target.value.toLowerCase(); el.querySelectorAll("#hl li").forEach((li) => (li.hidden = v && !li.textContent.toLowerCase().includes(v))); };
      el.querySelectorAll("[data-del]").forEach((b) => (b.onclick = () => { if (confirm("Xoá câu hỏi này và bảng ánh xạ của nó? Nên Xuất JSON trước.")) { removeSession(b.dataset.del); ctx.rerender(); } }));
      el.querySelector("#exp").onclick = () => download(`boi-tarot-lenormand-${new Date().toISOString().slice(0, 10)}.json`, exportJSON(store.sessions.filter((s) => !s.draft)), "application/json");
      el.querySelector("#imp").onchange = async (e) => {
        const f = e.target.files[0]; if (!f) return;
        try { const n = importJSON(await f.text(), store.sessions); save(); toast(`Đã nhập ${n} câu hỏi.`); ctx.rerender(); } catch (err) { toast(`Không nhập được: ${err.message}`); }
      };
    },
  };
}

// ================= Kiểm chứng =================
function verifyView(id) {
  const s = getSession(id);
  if (!s) return notFound();
  if (s.draft) return { redirect: `#/trai/${id}` };
  const v = s.verify;
  const mapT = s.mapping.tarot.map((c, i) => `${pad(i + 1)} → ${tarotCard(store.db, c).vi}${s.mapping.tarotRev?.[i] ? " (ngược)" : ""}`).join("\n");
  const mapL = s.mapping.lenormand.map((c, i) => `${pad(i + 1)} → ${lenCard(store.db, c).vi}`).join("\n");
  return {
    title: "Kiểm chứng",
    html: `<h1>Kiểm chứng khoá</h1><p class="lead">“${esc(s.cauHoi)}”</p>
    ${lockBox(s)}
    ${s.revealed && v ? `<section class="card"><h2>Kết quả</h2><p>Seed: <span class="mono">${s.seed}</span></p><p>Mã tính lại: <span class="mono">${v.recomputed}</span></p>
      <p>${v.hashOk && v.mappingOk ? `<span class="ok-badge">✔ Khớp — bài không bị đổi sau khi khoá.</span>` : `<span class="bad-badge">✘ Không khớp!</span>`}</p>
      <details><summary>Bảng ánh xạ Tarot (số → lá)</summary><pre class="mono">${esc(mapT)}</pre></details>
      <details><summary>Bảng ánh xạ Lenormand (số → lá)</summary><pre class="mono">${esc(mapL)}</pre></details></section>`
    : `<section class="card"><p>${s.rounds.length ? "Đã trải xong — có thể công khai seed để tự kiểm tra." : "<span class='warn'>Bạn chưa chọn số. Công khai seed bây giờ sẽ làm mất tác dụng khoá (biết trước lá).</span>"}</p><button type="button" class="btn primary" id="rv">Công khai seed &amp; kiểm tra</button></section>`}
    <section class="card"><h2>Cách tự kiểm</h2><p class="note">Mã khoá = SHA-256( seed_hex + "|" + JSON{v:1, tarot, tarotRev, lenormand} ). Thứ tự xáo: Fisher–Yates với số ngẫu nhiên lấy từ SHA-256(seed ‖ nhãn ‖ bộ đếm 32 bit), nhãn “tarot”, “lenormand”, “tarot-nguoc”; rút số đều bằng loại bỏ phần dư. Mã nguồn công khai trong thư mục <code>boi/js/core.js</code>.</p></section>
    <div class="btns"><a class="btn" href="${routeFor(s)}">← Quay lại câu hỏi</a></div>`,
    mount(el, ctx) {
      const b = el.querySelector("#rv");
      if (b) b.onclick = async () => {
        if (!s.rounds.length && !confirm("Công khai seed trước khi chọn số sẽ làm mất ý nghĩa khoá. Vẫn công khai?")) return;
        const r = await reveal(s); save(); toast(r.hashOk && r.mappingOk ? "Khớp: bài không bị đổi." : "KHÔNG khớp!"); ctx.rerender();
      };
    },
  };
}

// ================= Cài đặt =================
function settingsView() {
  const st = store.settings;
  const prov = st.aiProvider || "gemini";
  return {
    title: "Cài đặt",
    html: `<h1>Cài đặt</h1>
    <form id="fSet" class="stack">
      <section class="card stack"><h2>Cách xưng hô</h2><label>Gọi người hỏi là<input name="xungHo" value="${esc(st.xungHo || "Queen Linh")}" maxlength="40"></label></section>
      <fieldset class="card"><legend>Bối cảnh tiền (triệu đồng)</legend>
        <label>Thu nhập hiện tại / tháng<input name="thuNhap" type="number" inputmode="decimal" step="0.1" min="0" value="${esc(st.thuNhap ?? "")}"></label>
        <label>Mục tiêu / tháng<input name="mucTieu" type="number" inputmode="decimal" step="0.1" min="0" value="${esc(st.mucTieu ?? "")}"></label>
        <label>Tổng thu năm trước (để so khi trải cả năm)<input name="namTruoc" type="number" inputmode="decimal" step="0.1" min="0" value="${esc(st.namTruoc ?? "")}"></label>
      </fieldset>
      <fieldset class="card"><legend>Giải sâu bằng AI</legend>
        <p class="note">Có khoá thì AI là phần giải chính. Khoá chỉ lưu trong trình duyệt của máy này và được gửi thẳng tới nhà cung cấp bạn chọn — không qua máy chủ nào khác. Đừng lưu khoá trên máy dùng chung.</p>
        ${bridge.ok ? `<p class="note">✓ Cầu nối AI máy nhà đang chạy — không cần dán khoá: khoá nằm trên máy, trang web không giữ.</p>` : ""}
        <label>Nhà cung cấp<select name="aiProvider">${Object.entries(PROVIDERS).map(([k, p]) => `<option value="${k}" ${k === prov ? "selected" : ""}>${esc(p.ten)}${k === "gemini" ? " (mặc định)" : ""}</option>`).join("")}</select></label>
        <label>Khoá API của bạn<input name="aiKey" type="password" autocomplete="off" placeholder="${aiKey(prov) === LOCAL_KEY ? "Đang dùng cầu nối máy nhà (dán khoá để thay)" : aiKey(prov) ? "Đã lưu khoá (gõ để thay)" : "Dán khoá vào đây"}"></label>
        <label>Model<input name="aiModel" list="models" value="${esc(st.aiModel || "")}" placeholder="Để trống = tự chọn model mạnh nhất"><datalist id="models">${PROVIDERS[prov].fallback.map((m) => `<option value="${m}">`).join("")}</datalist></label>
        <p class="note" id="mlist">Dự phòng khi lỗi 429/404: ${PROVIDERS[prov].fallback.map(esc).join(" → ")}</p>
        <div class="btns"><button type="button" class="btn small" id="testKey">Kiểm tra khoá &amp; dò model</button><button type="button" class="btn small ghost" id="forget">Xoá khoá khỏi máy</button></div>
      </fieldset>
      <button class="btn primary block" type="submit">Lưu cài đặt</button>
    </form>`,
    mount(el, ctx) {
      const f = el.querySelector("#fSet");
      f.elements.aiProvider.onchange = () => { saveSettings({ aiProvider: f.elements.aiProvider.value, aiModel: "" }); ctx.rerender(); };
      f.onsubmit = (e) => {
        e.preventDefault();
        const x = f.elements;
        saveSettings({ xungHo: x.xungHo.value.trim() || "Queen Linh", thuNhap: x.thuNhap.value, mucTieu: x.mucTieu.value, namTruoc: x.namTruoc.value, aiProvider: x.aiProvider.value, aiModel: x.aiModel.value.trim() });
        if (x.aiKey.value.trim()) setAiKey(x.aiProvider.value, x.aiKey.value.trim());
        x.aiKey.value = "";
        toast("Đã lưu cài đặt.");
        ctx.rerender();
      };
      el.querySelector("#forget").onclick = () => { setAiKey(f.elements.aiProvider.value, ""); toast("Đã xoá khoá khỏi máy."); ctx.rerender(); };
      el.querySelector("#testKey").onclick = async () => {
        const p = f.elements.aiProvider.value;
        const k = f.elements.aiKey.value.trim() || aiKey(p);
        if (!k) return toast("Chưa có khoá.");
        if (f.elements.aiKey.value.trim()) setAiKey(p, k);
        try { storage?.removeItem("boi.v2.models"); } catch (_) { /* bỏ qua */ }
        const list = await discoverModels(p, k, { storage });
        el.querySelector("#mlist").textContent = `Thứ tự sẽ thử: ${list.join(" → ")}`;
        toast("Đã dò model.");
      };
    },
  };
}

// Màn cần dữ liệu lá (đợi JSON); các màn khác vẽ ngay
export const NEEDS_DB = /^\/(lat|giai|hoi-tiep|kiem-chung)\//;
export const ROUTES = [
  [/^\/?$/, () => home(), "home"],
  [/^\/hoi-moi$/, () => ask(), "ask"],
  [/^\/trai\/([\w-]+)$/, (m) => spreadView(m[1]), "ask"],
  [/^\/chon-so\/([\w-]+)$/, (m) => pickView(m[1]), "ask"],
  [/^\/lat\/([\w-]+)$/, (m, q) => flipView(m[1], q), "ask"],
  [/^\/giai\/([\w-]+)$/, (m, q) => readView(m[1], q), "ask"],
  [/^\/hoi-tiep\/([\w-]+)$/, (m) => followView(m[1]), "ask"],
  [/^\/lich-su$/, () => historyView(), "history"],
  [/^\/kiem-chung\/([\w-]+)$/, (m) => verifyView(m[1]), "history"],
  [/^\/cai-dat$/, () => settingsView(), "settings"],
];
