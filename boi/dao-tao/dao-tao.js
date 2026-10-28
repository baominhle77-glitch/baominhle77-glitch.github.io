// Trang Đào tạo nhắn tin: Chủ tịch đóng vai khách, agent máy nhà trả lời qua cầu nối; sửa câu → mẫu sửa.
// Không gắn link ở trang khách; noindex. Không lưu bảng ánh xạ bài (trải bài dùng BoiAuto như trang chính).
import { probeBridge, bridge, aiKey, storage } from "../js/store.js";
import { via } from "../js/ai.js";
import { mergeKnowledge } from "../js/data.js";
import { taoBoiAuto } from "../js/auto.js";
import { KENH, GOI, TINH_HUONG, NHAN_CHUYEN, LOI_CAU_NOI_TAT, goc, yeuCauTraLoi, yeuCauMauSua, docTraLoi, sapMauSua, goiTroLy, kiemTraLoiAgent } from "./dao-tao-core.js";

const KEY = "boi.daotao.v1";
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const th = (id) => TINH_HUONG.find((t) => t.id === id);

const st = (() => {
  try { return { kenh: "01", goi: 0, cau_con: 0, trai: "3la", lich_su: [], ...JSON.parse(storage?.getItem(KEY) || "{}") }; } catch (_) { return { kenh: "01", goi: 0, cau_con: 0, trai: "3la", lich_su: [] }; }
})();
const luu = () => { try { storage?.setItem(KEY, JSON.stringify(st)); } catch (_) { /* bỏ qua */ } };
let thDangChon = null, dangGui = false, suaO = -1;

// ---------- Cầu nối ----------
const cauNoi = () => (bridge.ok ? { base: goc(via.base), token: via.token } : { base: "", token: "" });
async function doCauNoi() {
  $("cauNoi").textContent = "Đang dò cầu nối máy nhà…";
  $("thuLai").hidden = true;
  const ok = await probeBridge(globalThis.fetch, { on: true }).catch(() => false);
  $("cauNoi").innerHTML = ok ? `✓ Cầu nối máy nhà sẵn sàng${bridge.xa ? " (qua đường hầm)" : ""}.` : `<span class="err">${esc(LOI_CAU_NOI_TAT)}</span>`;
  $("thuLai").hidden = ok;
  if (ok) taiMau();
  return ok;
}

// ---------- Trải bài (lời gửi khách đi vào luồng chat) ----------
const dbReady = Promise.all(["../data/tarot.json", "../data/lenormand.json"].map((u) => fetch(u).then((r) => r.json())))
  .then(async ([tarot, lenormand]) => {
    const opt = (u) => fetch(u).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    const [a, b] = await Promise.all([opt("../data/tarot_them.json"), opt("../data/lenormand_them.json")]);
    return mergeKnowledge({ tarot, lenormand }, a, b);
  });
const auto = taoBoiAuto(async () => ({ db: await dbReady, settings: {}, key: aiKey(), storage }));

// ---------- Vẽ ----------
function veThanh() {
  $("kenh").innerHTML = KENH.map((k) => `<option ${k === st.kenh ? "selected" : ""}>${k}</option>`).join("");
  $("goi").innerHTML = GOI.map((g) => `<option value="${g.v}" ${g.v === Number(st.goi) ? "selected" : ""}>${esc(g.ten)}</option>`).join("");
  $("cauCon").value = st.cau_con;
  $("trai").value = st.trai;
  $("tinhHuong").innerHTML = TINH_HUONG.map((t) => `<button type="button" class="chip${t.chuyen ? " chuyen" : ""}" data-th="${t.id}">${esc(t.ten)}</button>`).join("");
  veNutTrai();
}
function veNutTrai() {
  const coCau = st.lich_su.some((m) => m.vai === "khach");
  $("traiBai").hidden = !(Number(st.goi) > 0 && Number(st.cau_con) > 0 && coCau);
}
function veTin(m, i) {
  if (m.vai === "he_thong") return `<p class="loi-he" role="alert">⚠ ${esc(m.noi_dung)}</p>`;
  if (m.vai === "khach") return `<div class="msg user"><div class="who">Khách${m.tinh_huong ? ` · ${esc(th(m.tinh_huong)?.ten || "")}` : ""}</div>${m.noi_dung.split(/\n+/).map((p) => `<p>${esc(p)}</p>`).join("")}</div>`;
  const nhan = [
    m.chuyen_nguoi ? `<span class="nhan chuyen">${NHAN_CHUYEN}</span>${m.ly_do ? ` <span class="note">${esc(m.ly_do)}</span>` : ""}` : "",
    m.bi_chan?.length ? `<span class="nhan chan">BỊ CHẶN: ${esc(m.bi_chan.join(", "))}</span>` : "",
    m.loai === "loi_gui_khach" ? `<span class="nhan lgk">Lời gửi khách · mã ${esc((m.ma_khoa || "").slice(0, 10))}</span>` : "",
  ].filter(Boolean).join(" ");
  const sua = m.sua ? `<p class="note">✎ Bản Chủ tịch sửa: ${esc(m.sua.ban_chu_tich)}${m.sua.ly_do ? ` — ${esc(m.sua.ly_do)}` : ""}</p>` : "";
  const mau = th(m.tinh_huong)?.mau;
  const form = suaO === i ? `<form class="sua-form" data-sua="${i}">
      <label>Bản đúng<textarea name="ban" rows="3" required>${esc(m.sua?.ban_chu_tich || mau || m.noi_dung)}</textarea></label>
      <label>Lý do<input name="lydo" placeholder="Vì sao sửa"></label>
      <div class="btns"><button class="btn small primary" type="submit">Gửi mẫu sửa</button><button class="btn small ghost" type="button" data-huy>Huỷ</button></div></form>` : "";
  return `<div class="msg assistant"><div class="who">Agent</div>${nhan ? `<div>${nhan}</div>` : ""}${m.noi_dung.split(/\n+/).map((p) => `<p>${esc(p)}</p>`).join("")}
    ${m.ghi_chu ? `<details><summary class="note">Ghi chú kỹ thuật</summary><p class="note">${esc(m.ghi_chu)}</p></details>` : ""}
    ${sua}${suaO === i ? form : `<button type="button" class="btn small ghost" data-sua-mo="${i}">Sửa câu này</button>`}</div>`;
}
function veChat() {
  $("chat").innerHTML = st.lich_su.length ? st.lich_su.map(veTin).join("") : `<p class="note">Chưa có tin nào. Gõ tin của khách hoặc bấm một tình huống khó.</p>`;
  veNutTrai();
}
function veMau(list, err = "") {
  $("mauNote").innerHTML = err ? `<span class="err">${esc(err)}</span>` : list.length ? `Mới nhất ở trên · ${list.length} mẫu.` : "Chưa có mẫu sửa nào.";
  $("mauList").innerHTML = list.map((m) => `<li class="mau-item"><div class="note">Kênh ${esc(m.kenh || "?")} · gói ${esc(m.goi ?? "?")}${m.luc || m.thoi_gian ? ` · ${esc(m.luc || m.thoi_gian)}` : ""}</div>
    ${m.ban_agent ? `<p class="cu">${esc(m.ban_agent)}</p>` : ""}<p>${esc(m.ban_chu_tich || "")}</p>${m.ly_do ? `<p class="note">Lý do: ${esc(m.ly_do)}</p>` : ""}</li>`).join("");
}

// ---------- Hành động ----------
async function taiMau() {
  const c = cauNoi();
  try { veMau(sapMauSua(await goiTroLy({ ...c, path: "/tro_ly/mau_sua", method: "GET" }))); }
  catch (e) { veMau([], e.message); }
}
function baoLoi(msg) { st.lich_su.push({ vai: "he_thong", noi_dung: msg }); luu(); veChat(); }

async function guiTin(text) {
  if (dangGui) return;
  dangGui = true;
  st.lich_su.push({ vai: "khach", noi_dung: text, ...(thDangChon ? { tinh_huong: thDangChon } : {}) });
  const tinhHuong = thDangChon;
  thDangChon = null;
  luu(); veChat();
  try {
    const j = await goiTroLy({ ...cauNoi(), path: "/tro_ly/tra_loi", body: yeuCauTraLoi(st) });
    st.lich_su.push({ ...docTraLoi(j), ...(tinhHuong ? { tinh_huong: tinhHuong } : {}) });
    luu(); veChat();
  } catch (e) {
    if (e.tat) doCauNoi();
    baoLoi(e.message);
  } finally { dangGui = false; }
}

async function traiBai() {
  const q = [...st.lich_su].reverse().find((m) => m.vai === "khach")?.noi_dung;
  if (!q) return;
  const b = $("traiBai");
  b.disabled = true; b.textContent = "Đang trải bài…";
  try {
    const r = await auto.giai(q, { trai: st.trai });
    const k = kiemTraLoiAgent(r.loiGuiKhach);
    st.lich_su.push({ vai: "agent", noi_dung: r.loiGuiKhach, loai: "loi_gui_khach", ma_khoa: r.maKhoa, ...(k.ok ? {} : { bi_chan: k.loi }) });
    st.cau_con = Math.max(0, Number(st.cau_con) - 1);
    $("cauCon").value = st.cau_con;
    luu(); veChat();
  } catch (e) { baoLoi(`Chưa trải được bài: ${e.message}`); }
  finally { b.disabled = false; b.textContent = "✦ Trải bài cho câu khách vừa hỏi"; }
}

async function guiMauSua(i, ban, lydo) {
  const m = st.lich_su[i];
  const body = yeuCauMauSua({ kenh: st.kenh, goi: st.goi, lich_su: st.lich_su.slice(0, i), ban_agent: m.noi_dung, ban_chu_tich: ban, ly_do: lydo });
  await goiTroLy({ ...cauNoi(), path: "/tro_ly/mau_sua", body });
  m.sua = { ban_chu_tich: body.ban_chu_tich, ly_do: body.ly_do };
  suaO = -1;
  luu(); veChat(); taiMau();
}

// ---------- Gắn sự kiện ----------
veThanh(); veChat();
$("kenh").onchange = (e) => { st.kenh = e.target.value; luu(); };
$("goi").onchange = (e) => { st.goi = Number(e.target.value); st.cau_con = st.goi; $("cauCon").value = st.cau_con; luu(); veNutTrai(); };
$("cauCon").oninput = (e) => { st.cau_con = Math.max(0, Number(e.target.value) || 0); luu(); veNutTrai(); };
$("trai").onchange = (e) => { st.trai = e.target.value; luu(); };
$("thuLai").onclick = doCauNoi;
$("taiMau").onclick = taiMau;
$("traiBai").onclick = traiBai;
$("phienMoi").onclick = () => { if (!st.lich_su.length || confirm("Xoá lịch sử chat của phiên này?")) { st.lich_su = []; suaO = -1; luu(); veChat(); } };
$("tinhHuong").onclick = (e) => {
  const b = e.target.closest("[data-th]"); if (!b) return;
  thDangChon = b.dataset.th;
  $("tin").value = th(thDangChon).tin;
  $("tin").focus();
};
$("tin").addEventListener("input", () => { if (!$("tin").value.trim()) thDangChon = null; });
$("fTin").onsubmit = (e) => {
  e.preventDefault();
  const t = $("tin").value.trim();
  if (!t) return;
  $("tin").value = "";
  guiTin(t);
};
$("chat").addEventListener("click", (e) => {
  const mo = e.target.closest("[data-sua-mo]");
  if (mo) { suaO = +mo.dataset.suaMo; veChat(); return; }
  if (e.target.closest("[data-huy]")) { suaO = -1; veChat(); }
});
$("chat").addEventListener("submit", async (e) => {
  const f = e.target.closest("[data-sua]"); if (!f) return;
  e.preventDefault();
  const btn = f.querySelector("button[type=submit]");
  btn.disabled = true;
  try { await guiMauSua(+f.dataset.sua, f.elements.ban.value, f.elements.lydo.value); }
  catch (err) { btn.disabled = false; alert(err.message); if (err.tat) doCauNoi(); }
});
doCauNoi();
