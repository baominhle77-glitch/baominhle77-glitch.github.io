// Trang Đào tạo nhắn tin: Chủ tịch đóng vai khách, agent máy nhà trả lời qua cầu nối; sửa câu → mẫu sửa.
// Không gắn link ở trang khách; noindex. Không lưu bảng ánh xạ bài (trải bài dùng BoiAuto như trang chính).
import { probeBridge, bridge, aiKey, storage } from "../js/store.js";
import { via } from "../js/ai.js";
import { mergeKnowledge } from "../js/data.js";
import { taoBoiAuto } from "../js/auto.js";
import { KENH, GOI, TINH_HUONG, NHAN_CHUYEN, LOI_CAU_NOI_TAT, DANG_NOI_LAI, goc, yeuCauTraLoi, yeuCauMauSua, docTraLoi, sapMauSua, goiTroLy, goiCoThuLai, kiemTraLoiAgent, themHangCho, guiHangCho, docHangCho, boHangCho } from "./dao-tao-core.js";

const KEY = "boi.daotao.v1";
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const th = (id) => TINH_HUONG.find((t) => t.id === id);

// Khách không chọn kiểu trải: agent tự chọn theo câu hỏi. Dữ liệu cũ có "trai" thì bỏ qua.
const st = (() => {
  let x = {};
  try { x = JSON.parse(storage?.getItem(KEY) || "{}") || {}; } catch (_) { x = {}; }
  const { trai: _boQua, ...con } = x;
  return { kenh: "01", goi: 0, cau_con: 0, lich_su: [], ...con };
})();
const luu = () => { try { storage?.setItem(KEY, JSON.stringify(st)); } catch (_) { /* bỏ qua */ } };
let thDangChon = null, dangGui = false, suaO = -1, noiLaiO = -1, dangGuiHang = false, dangLuuMau = 0;

// ---------- Cầu nối ----------
const cauNoi = () => (bridge.ok ? { base: goc(via.base), token: via.token } : { base: "", token: "" });
async function doCauNoi({ guiHang = true } = {}) {
  $("cauNoi").textContent = "Đang dò cầu nối máy nhà…";
  $("thuLai").hidden = true;
  const ok = await probeBridge(globalThis.fetch, { on: true }).catch(() => false);
  $("cauNoi").innerHTML = ok ? `✓ Cầu nối máy nhà sẵn sàng${bridge.xa ? " (qua đường hầm)" : ""}.` : `<span class="err">${esc(LOI_CAU_NOI_TAT)}</span>`;
  $("thuLai").hidden = ok;
  if (ok) (guiHang ? guiLaiHangCho() : Promise.resolve()).then(taiMau);
  return ok;
}
// Lỗi mạng thoáng qua: dò lại cầu nối rồi gửi lại 1 lần; trong lúc đó dưới tin khách (ô i) hiện “Đang nối lại máy nhà…”
const coThuLai = (goi, i, noiLai = () => doCauNoi()) => goiCoThuLai(goi, { noiLai, onNoiLai: (on) => { noiLaiO = on ? i : -1; veChat(); } });
// Mẫu sửa đang chờ gửi (lưu hỏng lúc trước): cầu nối sống thì tự gửi lại, gửi được thì bỏ cờ chờ
async function guiLaiHangCho() {
  if (dangGuiHang || dangLuuMau || !docHangCho(storage).length) return; // đang lưu một mẫu thì để lượt đó tự gửi, tránh trùng
  dangGuiHang = true;
  try {
    const { daGui } = await guiHangCho(storage, (body) => goiTroLy({ ...cauNoi(), path: "/tro_ly/mau_sua", body }));
    for (const m of st.lich_su) if (m.sua && daGui.includes(m.sua.ma)) delete m.sua.cho;
    if (daGui.length) { luu(); veChat(); }
  } finally { dangGuiHang = false; }
}

// ---------- Trải bài (lời gửi khách đi vào luồng chat) ----------
// Tải bộ bài; mạng hỏng thì lần sau tải lại (không giữ lời hứa đã hỏng)
let dbHua = null;
const taiDb = () => (dbHua ||= Promise.all(["../data/tarot.json", "../data/lenormand.json"].map((u) => fetch(u).then((r) => r.json())))
  .then(async ([tarot, lenormand]) => {
    const opt = (u) => fetch(u).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    const [a, b] = await Promise.all([opt("../data/tarot_them.json"), opt("../data/lenormand_them.json")]);
    return mergeKnowledge({ tarot, lenormand }, a, b);
  })
  .catch((err) => { dbHua = null; const e = new Error(`không tải được bộ bài (${err.message})`); e.mang = true; throw e; }));
const auto = taoBoiAuto(async () => ({ db: await taiDb(), settings: {}, key: aiKey(), storage }));

// ---------- Vẽ ----------
function veThanh() {
  $("kenh").innerHTML = KENH.map((k) => `<option ${k === st.kenh ? "selected" : ""}>${k}</option>`).join("");
  $("goi").innerHTML = GOI.map((g) => `<option value="${g.v}" ${g.v === Number(st.goi) ? "selected" : ""}>${esc(g.ten)}</option>`).join("");
  $("cauCon").value = st.cau_con;
  $("tinhHuong").innerHTML = TINH_HUONG.map((t) => `<button type="button" class="chip${t.chuyen ? " chuyen" : ""}" data-th="${t.id}">${esc(t.ten)}</button>`).join("");
  veNutTrai();
}
function veNutTrai() {
  const coCau = st.lich_su.some((m) => m.vai === "khach");
  $("traiBai").hidden = !(Number(st.goi) > 0 && Number(st.cau_con) > 0 && coCau);
}
function veTin(m, i) {
  if (m.vai === "he_thong") return `<p class="loi-he" role="alert">⚠ ${esc(m.noi_dung)}</p>`;
  if (m.vai === "khach") return `<div class="msg user"><div class="who">Khách${m.tinh_huong ? ` · ${esc(th(m.tinh_huong)?.ten || "")}` : ""}</div>${m.noi_dung.split(/\n+/).map((p) => `<p>${esc(p)}</p>`).join("")}${noiLaiO === i ? `<p class="note noi-lai" role="status">${DANG_NOI_LAI}</p>` : ""}</div>`;
  const nhan = [
    m.chuyen_nguoi ? `<span class="nhan chuyen">${NHAN_CHUYEN}</span>${m.ly_do ? ` <span class="note">${esc(m.ly_do)}</span>` : ""}` : "",
    m.bi_chan?.length ? `<span class="nhan chan">BỊ CHẶN: ${esc(m.bi_chan.join(", "))}</span>` : "",
    m.loai === "loi_gui_khach" ? `<span class="nhan lgk">Lời gửi khách · mã ${esc((m.ma_khoa || "").slice(0, 10))}</span>` : "",
  ].filter(Boolean).join(" ");
  // chỉ hiện ở trang đào tạo, không nằm trong lời gửi khách
  const chon = m.loai === "loi_gui_khach" && m.ten_trai ? `<p class="note chon-trai">Agent chọn: ${esc(m.ten_trai)}${m.ly_do_trai ? ` — ${esc(m.ly_do_trai)}` : ""}</p>` : "";
  const sua = m.sua ? `<p class="note">✎ Bản Chủ tịch sửa: ${esc(m.sua.ban_chu_tich)}${m.sua.ly_do ? ` — ${esc(m.sua.ly_do)}` : ""}</p>${m.sua.cho ? `<p class="note cho-gui">⏳ Chưa gửi được về máy nhà — đã giữ lại trên máy này, cầu nối sống sẽ tự gửi.</p>` : ""}` : "";
  const mau = th(m.tinh_huong)?.mau;
  const form = suaO === i ? `<form class="sua-form" data-sua="${i}">
      <label>Bản đúng<textarea name="ban" rows="3" required>${esc(m.sua?.ban_chu_tich || mau || m.noi_dung)}</textarea></label>
      <label>Lý do<input name="lydo" placeholder="Vì sao sửa"></label>
      <div class="btns"><button class="btn small primary" type="submit">Gửi mẫu sửa</button><button class="btn small ghost" type="button" data-huy>Huỷ</button></div></form>` : "";
  return `<div class="msg assistant"><div class="who">Agent</div>${nhan ? `<div>${nhan}</div>` : ""}${m.noi_dung.split(/\n+/).map((p) => `<p>${esc(p)}</p>`).join("")}${chon}
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
  const iKhach = st.lich_su.length - 1;
  try {
    const body = yeuCauTraLoi(st);
    const j = await coThuLai(() => goiTroLy({ ...cauNoi(), path: "/tro_ly/tra_loi", body }), iKhach);
    st.lich_su.push({ ...docTraLoi(j), ...(tinhHuong ? { tinh_huong: tinhHuong } : {}) });
    luu(); veChat();
  } catch (e) {
    baoLoi(e.message);
  } finally { dangGui = false; }
}

async function traiBai() {
  const iKhach = st.lich_su.map((m) => m.vai).lastIndexOf("khach");
  const q = st.lich_su[iKhach]?.noi_dung;
  if (!q) return;
  const b = $("traiBai");
  b.disabled = true; b.textContent = "Đang trải bài…";
  try {
    const r = await coThuLai(() => auto.giai(q), iKhach);
    const k = kiemTraLoiAgent(r.loiGuiKhach);
    st.lich_su.push({ vai: "agent", noi_dung: r.loiGuiKhach, loai: "loi_gui_khach", ma_khoa: r.maKhoa, ten_trai: r.tenTrai, ly_do_trai: r.lyDoTrai, ...(k.ok ? {} : { bi_chan: k.loi }) });
    st.cau_con = Math.max(0, Number(st.cau_con) - 1);
    $("cauCon").value = st.cau_con;
    luu(); veChat();
  } catch (e) { baoLoi(`Chưa trải được bài: ${e.message}`); }
  finally { b.disabled = false; b.textContent = "✦ Trải bài cho câu khách vừa hỏi"; }
}

async function guiMauSua(i, ban, lydo) {
  const m = st.lich_su[i];
  const body = yeuCauMauSua({ kenh: st.kenh, goi: st.goi, lich_su: st.lich_su.slice(0, i), ban_agent: m.noi_dung, ban_chu_tich: ban, ly_do: lydo });
  // giữ bản sửa trước khi gửi: gửi hỏng (cả lần thử lại) thì nằm ở hàng chờ, cầu nối sống sẽ tự gửi
  const ma = `${Date.now().toString(36)}-${i}`;
  m.sua = { ban_chu_tich: body.ban_chu_tich, ly_do: body.ly_do, ma, cho: true };
  themHangCho(storage, ma, body);
  suaO = -1;
  luu(); veChat();
  dangLuuMau++;
  try {
    // nối lại nhưng không xả hàng chờ cùng lúc (bản này đang được gửi lại, tránh gửi trùng)
    await coThuLai(() => goiTroLy({ ...cauNoi(), path: "/tro_ly/mau_sua", body }), -1, () => doCauNoi({ guiHang: false }));
  } catch (e) {
    if (e.quaLuot) baoLoi(e.message);
    return;
  } finally { dangLuuMau--; }
  boHangCho(storage, ma);
  delete m.sua.cho;
  luu(); veChat(); taiMau();
}

// ---------- Gắn sự kiện ----------
veThanh(); veChat();
$("kenh").onchange = (e) => { st.kenh = e.target.value; luu(); };
$("goi").onchange = (e) => { st.goi = Number(e.target.value); st.cau_con = st.goi; $("cauCon").value = st.cau_con; luu(); veNutTrai(); };
$("cauCon").oninput = (e) => { st.cau_con = Math.max(0, Number(e.target.value) || 0); luu(); veNutTrai(); };
$("thuLai").onclick = () => doCauNoi();
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
  catch (err) { btn.disabled = false; alert(err.message); }
});
doCauNoi();
// còn mẫu sửa chờ gửi: mỗi phút (và khi mạng có lại) dò lại cầu nối; sống thì tự gửi
const thuGuiHang = () => { if (docHangCho(storage).length && !dangGuiHang && !dangLuuMau) doCauNoi(); };
setInterval(thuGuiHang, 60000);
addEventListener("online", thuGuiHang);
