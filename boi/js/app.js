import { SPREADS, spreadById, defaultYear } from "./spreads.js";
import { createSession, addRound, fixCell, applyCorrectionText, errorsOf, reveal, loadSessions, saveSessions, exportJSON, importJSON, MAX, sizesOf } from "./state.js";
import { readRound, summarize, tarotCard, lenCard, cardName } from "./reading.js";
import { moneyTable } from "./money.js";
import { buildPrompt, callAI, DEFAULT_MODEL } from "./ai.js";

const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad = (n) => String(n).padStart(2, "0");

const SETTINGS_KEY = "boi.v1.settings";
const AIKEY_KEY = "boi.v1.aikey";
const store = (() => { try { return globalThis.localStorage; } catch (_) { return null; } })();

let db = null;
let sessions = loadSessions(store);
let current = null;
let draftTiers = [];
let picks = { tarot: [], lenormand: [] };
let gridDeck = "tarot";
let animateRound = -1;
let aiOut = "";

function loadSettings() {
  try { return { xungHo: "Queen Linh", ...(JSON.parse(store?.getItem(SETTINGS_KEY) || "{}")) }; } catch (_) { return { xungHo: "Queen Linh" }; }
}
let settings = loadSettings();
const getKey = () => { try { return store?.getItem(AIKEY_KEY) || ""; } catch (_) { return ""; } };

function persist() {
  if (!saveSessions(sessions, store)) toast("Không lưu được vào máy (bộ nhớ trình duyệt bị chặn). Hãy Xuất JSON để giữ ánh xạ.");
}
function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

// ---------- Ngăn kéo ----------
function openDrawer(id) {
  document.getElementById(id).classList.add("open");
  $("#scrim").classList.add("show");
}
function closeDrawers() {
  document.querySelectorAll(".drawer").forEach((d) => d.classList.remove("open"));
  $("#scrim").classList.remove("show");
}

function renderHistory() {
  const ul = $("#historyList");
  const list = [...sessions].sort((a, b) => (a.lockedAt < b.lockedAt ? 1 : -1));
  ul.innerHTML = list.length ? list.map((s) => `
    <li><button data-open="${esc(s.id)}" class="${current && current.id === s.id ? "active" : ""}">
      ${esc(s.cauHoi || "(không tên)")}
      <small>${esc(spreadById(s.spreadId).ten)} · ${esc(s.lockedAtText)} · ${s.rounds.length} lượt</small>
    </button></li>`).join("") : `<li class="note">Chưa có câu hỏi nào.</li>`;
}

// ---------- Form câu hỏi mới ----------
function fillSpreads() {
  $("#selSpread").innerHTML = SPREADS.map((s) => `<option value="${s.id}">${esc(s.ten)}</option>`).join("");
}
function applySpread() {
  const sp = spreadById($("#selSpread").value);
  const yearEl = $("#inpYear");
  const year = Number(yearEl?.value) || defaultYear();
  draftTiers = sp.tiers(year).map((t) => ({ ...t }));
  $("#formNew").elements.money.checked = sp.money;
  $("#spreadHint").textContent = sp.goiY;
  renderTierEditor(sp, year);
}
function renderTierEditor(sp = spreadById($("#selSpread").value), year = Number($("#inpYear")?.value) || defaultYear()) {
  const totT = draftTiers.reduce((a, t) => a + (Number(t.t) || 0), 0);
  const totL = draftTiers.reduce((a, t) => a + (Number(t.l) || 0), 0);
  $("#tierEditor").innerHTML = `
    ${sp.needsYear ? `<label>Năm<input id="inpYear" type="number" min="1900" max="2200" value="${year}" inputmode="numeric"></label>` : ""}
    ${draftTiers.map((t, i) => `
      <div class="tier-row" data-i="${i}">
        <label>Tầng ${i + 1}<input data-f="ten" value="${esc(t.ten)}"></label>
        <label>Tarot<input data-f="t" type="number" min="0" max="78" value="${t.t}" inputmode="numeric"></label>
        <label>Lenor<input data-f="l" type="number" min="0" max="36" value="${t.l}" inputmode="numeric"></label>
        <button type="button" class="icon-btn" data-del="${i}" aria-label="Xoá tầng">✕</button>
      </div>`).join("")}
    <p class="note">Tổng: ${totT} lá Tarot + ${totL} lá Lenormand · ${draftTiers.length} tầng.</p>`;
}

async function onCreate(e) {
  e.preventDefault();
  const f = e.target.elements;
  const cauHoi = f.question.value.trim();
  if (!cauHoi) return;
  const tiers = draftTiers.map((t, i) => ({ ten: String(t.ten || `Tầng ${i + 1}`).trim(), t: Math.max(0, Math.min(78, Number(t.t) || 0)), l: Math.max(0, Math.min(36, Number(t.l) || 0)), pos: t.pos || null }));
  if (!tiers.length) return toast("Cần ít nhất một tầng.");
  const sp = spreadById(f.spread.value);
  const s = await createSession({ cauHoi, spreadId: sp.id, tiers, money: f.money.checked, reversals: f.reversals.checked, nam: sp.needsYear ? Number($("#inpYear")?.value) || defaultYear() : null });
  sessions.push(s);
  persist();
  f.question.value = "";
  openSession(s.id);
  toast("Đã xáo và khoá bài. Hãy chụp lại mã khoá.");
}

// ---------- Phiên ----------
function openSession(id) {
  current = sessions.find((s) => s.id === id) || null;
  picks = { tarot: [], lenormand: [] };
  aiOut = "";
  animateRound = -1;
  $("#secNew").hidden = !!current;
  $("#secSession").hidden = !current;
  renderHistory();
  renderSession();
  closeDrawers();
  window.scrollTo({ top: 0 });
}
function showNew() {
  current = null;
  $("#secNew").hidden = false;
  $("#secSession").hidden = true;
  renderHistory();
  closeDrawers();
}

function usedNumbers(deck) {
  const set = new Set();
  current.rounds.forEach((r) => (r[deck] || []).flat().forEach((c) => c.ok && set.add(c.n)));
  return set;
}

const SUIT_SVG = {
  wands: `<svg viewBox="0 0 60 60"><rect x="27" y="6" width="6" height="48" rx="3" fill="#8b5a2b"/><circle cx="24" cy="16" r="4" fill="#5c9e4a"/><circle cx="36" cy="26" r="4" fill="#5c9e4a"/><circle cx="24" cy="36" r="3.5" fill="#5c9e4a"/></svg>`,
  cups: `<svg viewBox="0 0 60 60"><path d="M14 8h32q0 22-16 26Q14 30 14 8z" fill="#3f6fb5"/><rect x="27" y="33" width="6" height="14" fill="#c9a24a"/><rect x="18" y="46" width="24" height="5" rx="2" fill="#c9a24a"/></svg>`,
  swords: `<svg viewBox="0 0 60 60"><path d="M30 3l5 9v30h-10V12z" fill="#9aa7b8"/><rect x="18" y="41" width="24" height="5" rx="2" fill="#c9a24a"/><rect x="27" y="46" width="6" height="10" fill="#6b4b2b"/></svg>`,
  pentacles: `<svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="22" fill="#e8c35a" stroke="#9b7a22" stroke-width="2"/><path d="M30 13l4.9 15.1H51l-12.9 9.4 4.9 15.1L30 43.3 17 52.6l4.9-15.1L9 28.1h16.1z" fill="none" stroke="#7a5a12" stroke-width="2"/></svg>`,
};
const ROMAN = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"];

function cardHTML(deck, cell, ri, delay) {
  const shown = ri !== animateRound;
  if (!cell.ok) {
    return `<div class="flip errslot" title="Số ${esc(cell.raw)} ngoài khoảng"><div class="flip-inner"><div class="back">?<br><small>${esc(cell.raw)}</small></div></div></div>`;
  }
  let face;
  if (deck === "tarot") {
    const c = tarotCard(db, cell.card);
    const art = c.nhom === "major" ? `<div class="sym">${c.bieu_tuong}</div>` : SUIT_SVG[c.chat];
    const tag = c.nhom === "major" ? ROMAN[c.so] : "";
    face = `<div class="face${cell.rev ? " rev" : ""}"><div class="no"><span>${pad(cell.n)}</span><span>${tag}</span></div>${art}<div class="nm">${esc(c.en)}</div><div class="vi">${esc(c.vi)}</div>${cell.rev ? `<div class="revtag">NGƯỢC</div>` : ""}</div>`;
  } else {
    const c = lenCard(db, cell.card);
    face = `<div class="face len"><div class="no"><span>${pad(cell.n)}</span><span>${c.id}</span></div><div class="sym">${c.bieu_tuong}</div><div class="nm">${esc(c.en)}</div><div class="vi">${esc(c.vi)}</div></div>`;
  }
  return `<div class="flip${shown ? " shown" : ""}${cell.repeatOf ? " repeat" : ""}" style="--d:${delay}ms" data-anim="${shown ? "" : "1"}"><div class="flip-inner"><div class="back">${pad(cell.n)}</div>${face}</div></div>`;
}

function scoreCls(x) { return x == null ? "" : x >= 6.5 ? "hi" : x >= 5 ? "mid" : "lo"; }

function renderRound(ri) {
  const round = current.rounds[ri];
  const rd = readRound(db, current, ri);
  const tiersHTML = rd.tiers.map((t, ti) => {
    const tc = round.tarot[ti] || [], lc = round.lenormand[ti] || [];
    let k = 0;
    return `
    <div class="tier-block">
      <h4>${esc(t.ten)} ${t.diem != null ? `<span class="score ${scoreCls(t.diem)}">${t.diem}/10</span>` : ""}${t.yesno ? ` · <strong>${t.yesno}</strong>` : ""}</h4>
      ${tc.length ? `<div class="spread-row">${tc.map((c) => cardHTML("tarot", c, ri, 120 * k++)).join("")}</div>` : ""}
      ${lc.length ? `<div class="spread-row">${lc.map((c) => cardHTML("lenormand", c, ri, 120 * k++)).join("")}</div>` : ""}
      ${t.tarot.length ? `<strong>Tarot theo vị trí</strong><ul>${t.tarot.map((x) => `<li>${esc(x.text)}</li>`).join("")}</ul>` : ""}
      ${t.pairs.length || t.chain ? `<strong>Lenormand theo cặp</strong><ul>${t.pairs.map((p) => `<li><b>${esc(p.a.vi)} + ${esc(p.b.vi)}</b>: ${esc(p.text)}${p.known ? "" : ` <span class="note">(luật ghép chung)</span>`}</li>`).join("")}${t.chain ? `<li>${esc(t.chain)}</li>` : ""}</ul>` : ""}
      <div class="chot"><b>Chốt tầng:</b> ${esc(t.chot)}<br><b>Điểm nghẽn:</b> ${esc(t.nghen)}<br><b>Lời khuyên:</b> ${esc(t.khuyen.join(" "))}</div>
      ${t.repeats.map((x) => `<div class="repeat-note">↻ ${esc(x.text)}</div>`).join("")}
    </div>`;
  }).join("");
  const rows = rd.tiers.map((t, ti) => `<tr><td>${esc(t.ten)}</td><td>${(round.tarot[ti] || []).map((c) => esc(cardName(db, "tarot", c))).join("<br>") || "—"}</td><td>${(round.lenormand[ti] || []).map((c) => esc(cardName(db, "lenormand", c))).join("<br>") || "—"}</td></tr>`).join("");
  return { rd, html: `
    <section class="card">
      <h3>${ri === 0 ? "Trải chính" : `Rút thêm #${ri}`} <span class="note">· ${esc(round.atText)}</span></h3>
      <p class="note mono">Đã gõ: ${esc(round.input)}</p>
      <div class="table-wrap"><table><thead><tr><th>Tầng</th><th>Tarot (số → tên lá)</th><th>Lenormand (số → tên lá)</th></tr></thead><tbody>${rows}</tbody></table></div>
      ${tiersHTML}
    </section>` };
}

function renderMoney(m) {
  if (!m) return "";
  if (m.missing) return `<section class="card"><h3>Quy đổi tiền</h3><p class="note">Nhập thu nhập hiện tại/tháng trong ⚙ Cài đặt để có bảng quy đổi.</p></section>`;
  return `<section class="card">
    <h3>Quy đổi tiền (triệu đồng)</h3>
    <p class="warn">Quy đổi huyền học, không phải dự báo tài chính. Mốc: ${m.base} tr/tháng.</p>
    <div class="table-wrap"><table><thead><tr><th>Tháng/Kỳ</th><th>Tarot</th><th>Lenormand</th><th>Khoảng thực tế</th><th>Con số trung tâm</th></tr></thead><tbody>
      ${m.rows.map((r) => `<tr><td>${esc(r.ky)}</td><td>${esc(r.tarot)}</td><td>${esc(r.lenormand)}</td><td class="num-cell">${r.low} – ${r.high}</td><td class="num-cell"><b>${r.center}</b><br><small class="note">S ${r.S} · V ${r.V} · ×${r.mult}</small></td></tr>`).join("")}
    </tbody></table></div>
    <ul>
      <li>Tổng ${m.rows.length} kỳ: <b>${m.total} tr</b> · bình quân <b>${m.perMonth} tr/tháng</b></li>
      <li>Mạnh nhất: ${esc(m.best.ky)} (${m.best.center} tr) · yếu nhất: ${esc(m.worst.ky)} (${m.worst.center} tr)</li>
      ${m.target ? `<li>So với mục tiêu ${m.target} tr/tháng: đạt ${m.targetPct} % · ${m.monthsHit}/${m.rows.length} kỳ chạm mục tiêu</li>` : ""}
      ${m.prevYear ? `<li>So với năm trước (${m.prevYear} tr): ${m.vsPrevPct >= 0 ? "+" : ""}${m.vsPrevPct} %</li>` : ""}
    </ul>
    <details><summary>Công thức quy đổi</summary><p class="formula">${m.formula.map(esc).join("\n")}</p></details>
  </section>`;
}

function renderFix() {
  const ri = current.rounds.length - 1;
  if (ri < 0) return "";
  const errs = errorsOf(current.rounds[ri]);
  if (!errs.length) return "";
  return `<div class="fix-box">
    <b>Có ${errs.length} số ngoài khoảng — đã lật các số hợp lệ, để trống đúng ô lỗi.</b>
    ${errs.map((e) => `<div class="row" style="margin-top:.4rem">
      <span>${e.deck === "tarot" ? "Tarot" : "Lenormand"} · tầng ${e.tier + 1} · ô ${e.idx + 1}: số <b>${esc(e.raw)}</b> không có (chỉ 01–${MAX[e.deck]}). Số thay:</span>
      <input style="width:72px" inputmode="numeric" data-fix="${e.deck}|${e.tier}|${e.idx}" placeholder="01–${MAX[e.deck]}">
    </div>`).join("")}
    <p class="note">Hoặc gõ vào ô lật bài: “Là số 04” — chỉ thay đúng ô trống đầu tiên.</p>
  </div>`;
}

function renderGrid() {
  const used = usedNumbers(gridDeck);
  const max = MAX[gridDeck];
  const order = picks[gridDeck];
  let html = "";
  for (let n = 1; n <= max; n++) {
    const k = order.indexOf(n);
    html += `<button type="button" class="num${used.has(n) ? " used" : ""}${k >= 0 ? " picked" : ""}" data-num="${n}">${pad(n)}${k >= 0 ? `<span class="ord">${k + 1}</span>` : ""}</button>`;
  }
  return html;
}
function pickedLine() {
  const t = picks.tarot.map(pad).join(" "), l = picks.lenormand.map(pad).join(" ");
  return `${t ? `T: ${t}` : ""}${t && l ? " · " : ""}${l ? `L: ${l}` : ""}` || "Bấm số để chọn (theo thứ tự), hoặc gõ bên dưới.";
}

function renderSession() {
  const el = $("#secSession");
  if (!current) { el.innerHTML = ""; return; }
  const s = current;
  const sp = spreadById(s.spreadId);
  const sizes = sizesOf(s);
  const rounds = s.rounds.map((_, ri) => renderRound(ri));
  const summary = rounds.length ? summarize(db, s, rounds.map((r) => r.rd), settings) : null;
  const money = rounds.length ? moneyTable(db, s, settings) : null;
  const aiOn = !!settings.aiOn;
  el.innerHTML = `
    <section class="card">
      <h2>${esc(s.cauHoi)}</h2>
      <p class="note">${esc(sp.ten)} · ${s.tiers.length} tầng · Tarot ${sizes.tarot.join("/")} · Lenormand ${sizes.lenormand.join("/")}${s.reversals ? " · có lá ngược" : ""}${s.money ? " · câu hỏi tiền" : ""}</p>
      <div class="lock">
        <div>🔒 <b>Mã khoá SHA-256</b> (chụp lại trước khi chọn số):</div>
        <div class="mono">${s.hash}</div>
        <div>Khoá lúc: <b>${esc(s.lockedAtText)}</b> · Bộ Tarot 78 lá và Lenormand 36 lá đã xáo độc lập; câu hỏi này luôn dùng đúng bộ đã khoá.</div>
        ${s.revealed && s.verify ? `<div style="margin-top:.4rem">Seed: <span class="mono">${s.seed}</span><br>Tính lại: <span class="mono">${s.verify.recomputed}</span><br>${s.verify.hashOk && s.verify.mappingOk ? `<span class="ok-badge">✔ Khớp — bài không bị đổi sau khi khoá.</span>` : `<span class="bad-badge">✘ Không khớp!</span>`}</div>` : ""}
      </div>
      <h3>${s.rounds.length ? "Rút thêm (cùng bộ đã khoá)" : "Chọn số"}</h3>
      <div class="tabs">
        <button type="button" class="btn small${gridDeck === "tarot" ? " on" : ""}" data-deck="tarot">Tarot 01–78</button>
        <button type="button" class="btn small${gridDeck === "lenormand" ? " on" : ""}" data-deck="lenormand">Lenormand 01–36</button>
      </div>
      <div class="grid-nums" id="grid">${renderGrid()}</div>
      <div class="picked-line" id="pickedLine">${esc(pickedLine())}</div>
      <label>Hoặc gõ số<textarea id="inpDraw" rows="3" placeholder="T: 8 37 50 69/ 68 75 36 22/ 8 36 55 71&#10;Lenor: 22 25 27 29 / 10 20 25 21/ 11 23 26 34"></textarea></label>
      <p class="note">“/” tách tầng; không có “/” thì chia theo số lá từng tầng của mẫu. Số đã rút có chấm nhỏ — chọn lại sẽ ra đúng lá cũ (lá lặp).</p>
      <div class="btns">
        <button type="button" class="btn primary" id="btnDraw">Lật bài</button>
        <button type="button" class="btn small" id="btnClearPicks">Xoá chọn</button>
      </div>
      ${renderFix()}
    </section>
    ${rounds.map((r) => r.html).join("")}
    ${renderMoney(money)}
    ${summary ? `<section class="card"><h3>Tổng kết</h3>${summary.text.map((x) => `<p>${esc(x)}</p>`).join("")}${summary.advice.length ? `<h4>Lời khuyên thực tế</h4><ul>${summary.advice.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}</section>` : ""}
    ${rounds.length ? `<section class="card">
      <div class="btns">
        <button type="button" class="btn" id="btnReveal">${s.revealed ? "Kiểm tra lại seed" : "Công khai seed &amp; kiểm tra"}</button>
        <button type="button" class="btn" id="btnCopyPrompt">Chép prompt</button>
        ${aiOn ? `<button type="button" class="btn primary" id="btnAI">Giải sâu bằng AI</button>` : ""}
        <button type="button" class="btn small" id="btnDelete">Xoá câu hỏi</button>
      </div>
      <p class="note">“Chép prompt” để dán vào ChatGPT/Claude/Gemini nếu không dùng khoá.${aiOn ? "" : " Bật giải sâu bằng AI trong ⚙ Cài đặt nếu muốn gọi thẳng từ đây."}</p>
      ${aiOut ? `<div class="ai-out" id="aiOut">${esc(aiOut)}</div>` : ""}
    </section>` : ""}`;
  el._ctx = { rounds, summary, money };
  // Hiệu ứng lật cho lượt vừa rút
  requestAnimationFrame(() => {
    el.querySelectorAll('.flip[data-anim="1"]').forEach((f) => {
      const d = parseInt(f.style.getPropertyValue("--d"), 10) || 0;
      setTimeout(() => f.classList.add("shown"), 60 + d);
    });
    animateRound = -1;
  });
}

function onDraw() {
  const box = $("#inpDraw");
  let text = box.value.trim();
  if (text) {
    const fixed = applyCorrectionText(current, text);
    if (fixed) {
      if (fixed.filled.length) toast(`Đã thay ${fixed.filled.map((f) => `ô ${f.idx + 1} tầng ${f.tier + 1} → ${pad(f.to)}`).join(", ")}.`);
      if (fixed.rejected.length) toast(`Số ${fixed.rejected.map((f) => f.to).join(", ")} vẫn ngoài khoảng.`);
      if (!fixed.filled.length && !fixed.rejected.length) toast("Không còn ô trống nào để thay.");
      box.value = "";
      persist();
      renderSession();
      return;
    }
  } else {
    if (!picks.tarot.length && !picks.lenormand.length) return toast("Chưa chọn hoặc gõ số nào.");
    text = [picks.tarot.length ? `T: ${picks.tarot.join(" ")}` : "", picks.lenormand.length ? `L: ${picks.lenormand.join(" ")}` : ""].filter(Boolean).join("\n");
  }
  try {
    const { errors } = addRound(current, text, gridDeck);
    animateRound = current.rounds.length - 1;
    picks = { tarot: [], lenormand: [] };
    persist();
    renderSession();
    if (errors.length) toast(`Có ${errors.length} số ngoài khoảng — nhập số thay ở khung đỏ.`);
  } catch (err) {
    toast(err.message);
  }
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast("Đã chép prompt. Dán vào ChatGPT để giải sâu.");
  } catch (_) {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); toast("Đã chép prompt."); } catch (_) { toast("Không chép được, hãy chọn và sao chép thủ công."); }
    ta.remove();
  }
}

function currentPrompt() {
  const { rounds, summary, money } = $("#secSession")._ctx;
  return buildPrompt(db, current, rounds.map((r) => r.rd), summary, money, settings);
}

// ---------- Sự kiện ----------
function bind() {
  $("#btnHistory").onclick = () => openDrawer("drawerHistory");
  $("#btnSettings").onclick = () => { fillSettings(); openDrawer("drawerSettings"); };
  $("#scrim").onclick = closeDrawers;
  document.querySelectorAll("[data-close]").forEach((b) => (b.onclick = closeDrawers));
  $("#btnNewQ").onclick = showNew;
  $("#historyList").onclick = (e) => { const b = e.target.closest("[data-open]"); if (b) openSession(b.dataset.open); };

  $("#selSpread").onchange = applySpread;
  $("#tierEditor").addEventListener("input", (e) => {
    if (e.target.id === "inpYear") {
      const sp = spreadById($("#selSpread").value);
      const y = Number(e.target.value);
      if (y >= 1900 && y <= 2200) draftTiers.forEach((t, i) => { const fresh = sp.tiers(y)[i]; if (fresh) t.ten = fresh.ten; });
      draftTiers.forEach((t, i) => { const inp = $(`.tier-row[data-i="${i}"] [data-f="ten"]`); if (inp) inp.value = t.ten; });
      return;
    }
    const row = e.target.closest(".tier-row");
    if (!row) return;
    const t = draftTiers[Number(row.dataset.i)];
    const f = e.target.dataset.f;
    t[f] = f === "ten" ? e.target.value : Number(e.target.value);
  });
  $("#tierEditor").addEventListener("change", (e) => { if (e.target.dataset.f && e.target.dataset.f !== "ten") renderTierEditor(); });
  $("#tierEditor").addEventListener("click", (e) => {
    const b = e.target.closest("[data-del]");
    if (!b) return;
    draftTiers.splice(Number(b.dataset.del), 1);
    renderTierEditor();
  });
  $("#btnAddTier").onclick = () => {
    const last = draftTiers[draftTiers.length - 1] || { t: 3, l: 3, pos: null };
    draftTiers.push({ ten: `Tầng ${draftTiers.length + 1}`, t: last.t, l: last.l, pos: last.pos });
    renderTierEditor();
  };
  $("#formNew").onsubmit = onCreate;

  const sec = $("#secSession");
  sec.addEventListener("click", async (e) => {
    const t = e.target.closest("button");
    if (!t) return;
    if (t.dataset.deck) { gridDeck = t.dataset.deck; renderSession(); return; }
    if (t.dataset.num) {
      const n = Number(t.dataset.num);
      const list = picks[gridDeck];
      const k = list.indexOf(n);
      if (k >= 0) list.splice(k, 1); else list.push(n);
      $("#grid").innerHTML = renderGrid();
      $("#pickedLine").textContent = pickedLine();
      return;
    }
    if (t.id === "btnDraw") return onDraw();
    if (t.id === "btnClearPicks") { picks = { tarot: [], lenormand: [] }; $("#grid").innerHTML = renderGrid(); $("#pickedLine").textContent = pickedLine(); return; }
    if (t.id === "btnReveal") {
      const v = await reveal(current);
      persist();
      renderSession();
      toast(v.hashOk && v.mappingOk ? "Khớp: bài không bị đổi sau khi khoá." : "KHÔNG khớp!");
      return;
    }
    if (t.id === "btnCopyPrompt") return copyText(currentPrompt());
    if (t.id === "btnAI") {
      const key = getKey();
      if (!key) return toast("Chưa có khoá trong ⚙ Cài đặt.");
      t.disabled = true;
      t.textContent = "Đang giải…";
      try {
        aiOut = await callAI({ provider: settings.aiProvider || "gemini", model: settings.aiModel, key, prompt: currentPrompt() });
      } catch (err) {
        aiOut = `Không gọi được AI: ${err.message}. Bạn vẫn có thể bấm “Chép prompt” để dán vào ChatGPT.`;
      }
      renderSession();
      $("#aiOut")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (t.id === "btnDelete") {
      if (!confirm("Xoá câu hỏi này và bảng ánh xạ của nó? Nên Xuất JSON trước.")) return;
      sessions = sessions.filter((s) => s.id !== current.id);
      persist();
      showNew();
    }
  });
  sec.addEventListener("change", (e) => {
    const inp = e.target.closest("[data-fix]");
    if (!inp) return;
    const [deck, tier, idx] = inp.dataset.fix.split("|");
    const n = parseInt(inp.value, 10);
    const r = fixCell(current, current.rounds.length - 1, deck, Number(tier), Number(idx), n);
    if (!r.ok) { toast(`Số ${inp.value} vẫn ngoài khoảng 01–${r.max}.`); inp.value = ""; return; }
    persist();
    renderSession();
  });

  $("#btnExport").onclick = () => {
    const blob = new Blob([exportJSON(sessions)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `boi-tarot-lenormand-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  $("#fileImport").onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const added = importJSON(await file.text(), sessions);
      persist();
      renderHistory();
      toast(`Đã nhập ${added} câu hỏi (bỏ qua câu đã có).`);
    } catch (err) {
      toast(`Không nhập được: ${err.message}`);
    }
    e.target.value = "";
  };

  $("#formSettings").onsubmit = (e) => {
    e.preventDefault();
    const f = e.target.elements;
    settings = {
      xungHo: f.xungHo.value.trim() || "Queen Linh",
      thuNhap: f.thuNhap.value, mucTieu: f.mucTieu.value, namTruoc: f.namTruoc.value,
      aiOn: f.aiOn.checked, aiProvider: f.aiProvider.value, aiModel: f.aiModel.value.trim(),
    };
    try {
      store?.setItem(SETTINGS_KEY, JSON.stringify(settings));
      if (f.aiKey.value) store?.setItem(AIKEY_KEY, f.aiKey.value.trim());
    } catch (_) { toast("Không lưu được cài đặt."); }
    f.aiKey.value = "";
    closeDrawers();
    if (current) renderSession();
    toast("Đã lưu cài đặt.");
  };
  $("#btnForgetKey").onclick = () => { try { store?.removeItem(AIKEY_KEY); } catch (_) {} toast("Đã xoá khoá khỏi máy."); fillSettings(); };
  $("#formSettings").elements.aiProvider.onchange = (e) => { $("#formSettings").elements.aiModel.placeholder = DEFAULT_MODEL[e.target.value]; };
}

function fillSettings() {
  const f = $("#formSettings").elements;
  f.xungHo.value = settings.xungHo || "";
  f.thuNhap.value = settings.thuNhap || "";
  f.mucTieu.value = settings.mucTieu || "";
  f.namTruoc.value = settings.namTruoc || "";
  f.aiOn.checked = !!settings.aiOn;
  f.aiProvider.value = settings.aiProvider || "gemini";
  f.aiModel.value = settings.aiModel || "";
  f.aiModel.placeholder = DEFAULT_MODEL[f.aiProvider.value];
  f.aiKey.value = "";
  f.aiKey.placeholder = getKey() ? "Đã lưu khoá (gõ để thay)" : "Dán khoá vào đây";
}

async function init() {
  const [tarot, lenormand] = await Promise.all(["data/tarot.json", "data/lenormand.json"].map((u) => fetch(u).then((r) => { if (!r.ok) throw new Error(u); return r.json(); })));
  db = { tarot, lenormand };
  document.body.classList.add("has-side");
  fillSpreads();
  applySpread();
  bind();
  renderHistory();
  const last = [...sessions].sort((a, b) => (a.lockedAt < b.lockedAt ? 1 : -1))[0];
  if (last && location.hash !== "#moi") openSession(last.id);
}

init().catch((err) => {
  $("#main").insertAdjacentHTML("afterbegin", `<section class="card err">Không tải được dữ liệu lá (${esc(err.message)}). Tải lại trang.</section>`);
});
