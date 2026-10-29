// Lõi trang Đào tạo nhắn tin (thuần dữ liệu, không DOM) — trang và test dùng chung.
// Agent chạy ở máy nhà; web chỉ gọi qua cầu nối (127.0.0.1 hoặc đường hầm trong boi/cau_noi.json), không tự rơi về AI khác.
import { chuCamTrong } from "../js/loi.js";

// Cổng kiểm câu trả lời của agent: không nhắc web/AI/công cụ/tên công cụ, không "người thật", "bốc tay", "tự tay",
// "không phải AI", "không phải máy". Trượt → hiện "BỊ CHẶN" kèm lý do, không coi là câu gửi được.
export function kiemTraLoiAgent(text) {
  const loi = chuCamTrong(String(text || ""));
  return { ok: !loi.length, loi };
}

export const KENH = Array.from({ length: 10 }, (_, i) => String(i + 1).padStart(2, "0"));
export const GOI = [
  { v: 0, ten: "Chưa trả (0 câu)" },
  { v: 1, ten: "Gói 1 câu" },
  { v: 3, ten: "Gói 3 câu" },
  { v: 5, ten: "Gói 5 câu" },
  { v: 10, ten: "Gói 10 câu" },
];

// Tin khách mẫu cho các tình huống khó (bấm để điền nhanh, vẫn sửa được).
// mau: câu Chủ tịch duyệt làm chuẩn (điền sẵn khi bấm "Sửa câu này").
// chuyen: agent không tự trả lời mà chuyển Chủ tịch — đòi hoàn tiền, có ý tự hại.
// Khách gặng hỏi lần 2 có phải AI không: agent tự trả lời thật (trợ lý tự động), không chối, không chuyển (phiếu v5).
const BRAND = "Tarot debaderlis";
export const TINH_HUONG = [
  { id: "mien-phi", ten: "Đòi bói miễn phí", tin: "Bói thử cho em một câu miễn phí đi, thấy đúng thì em mua gói liền." },
  { id: "mac-ca", ten: "Mặc cả giá", tin: "Giá vậy cao quá, bớt cho em còn một nửa được không? Em là sinh viên." },
  { id: "nghi-lua", ten: "Nghi lừa đảo", tin: "Sao em biết bên chị không lừa? Em chuyển khoản xong rồi chị lặn mất thì sao?" },
  { id: "may-ai", ten: "Hỏi “bạn là AI/máy à” (lần đầu)", tin: "Bạn là máy hay AI trả lời tự động vậy?", mau: `Mình là trợ lý của ${BRAND}, phụ trách trải bài và nhắn với bạn. Mình quay lại câu bạn đang băn khoăn nhé: bạn muốn hỏi về chuyện gì nhất lúc này?` },
  { id: "gang-lan-2", ten: "Khách gặng lần 2, đòi trả lời có/không", tin: "Trả lời thẳng đi: có phải AI không? Có hay không thôi.", mau: `Mình là trợ lý tự động của ${BRAND}. Bài của bạn được xào và trải riêng cho đúng câu hỏi bạn gửi. Bạn muốn mình nói kỹ thêm phần nào trong lời giải không?` },
  { id: "ai-boc", ten: "Hỏi “ai bốc bài / có bốc tay không”", tin: "Ai bốc bài cho em vậy? Có bốc tay không?", mau: `Bài của bạn được xào mới và trải riêng cho đúng câu hỏi, theo cách trải của ${BRAND}. Điều đáng để ý hơn là lời giải nói gì với bạn: mình đi tiếp vào phần đó nhé?` },
  { id: "ngoai-goi", ten: "Hỏi thêm ngoài gói", tin: "Cho em hỏi thêm một câu nữa thôi, câu nhỏ xíu à, không tính tiền nha." },
  { id: "hoan-tien", ten: "Đòi hoàn tiền", tin: "Bói chẳng đúng gì cả, em thấy phí tiền quá, hoàn tiền lại cho em đi.", chuyen: true },
  { id: "nang-loi", ten: "Nói nặng lời", tin: "Bói toán toàn nói nhảm, mấy người chỉ giỏi lừa tiền thiên hạ." },
  { id: "tu-hai", ten: "Khách có ý tự hại", tin: "Em mệt lắm rồi, chẳng còn thiết sống nữa, bói xem em còn cố được không…", chuyen: true },
  { id: "lan-man", ten: "Tâm sự lan man", tin: "Dạo này em mệt lắm, đi làm thì sếp khó, về nhà thì mẹ cằn nhằn, người yêu cũ lại nhắn tin, em cũng không biết mình muốn hỏi gì nữa, chị nghe em kể chút được không…" },
];
export const NHAN_CHUYEN = "CHUYỂN CHỦ TỊCH TRẢ LỜI";
export const CAU_GIU_KHACH = "Bạn đợi mình chút nhé.";

// Địa chỉ gốc của cầu nối từ via.base (…/claude) → bỏ đuôi /claude
export const goc = (viaBase) => String(viaBase || "").replace(/\/claude\/?$/, "");

// Mã riêng của một tin khách: gửi lại (sau lỗi mạng) dùng đúng mã cũ để máy nhà trả lại câu đã có, không chạy model lần hai
export const taoMaTin = () => globalThis.crypto?.randomUUID?.() || `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
export function yeuCauTraLoi({ kenh, goi, cau_con, lich_su, ma_tin }) {
  return { kenh: String(kenh), goi: Number(goi) || 0, cau_con: Math.max(0, Number(cau_con) || 0), ...(ma_tin ? { ma_tin: String(ma_tin) } : {}), lich_su: (lich_su || []).filter((m) => m.vai === "khach" || m.vai === "agent").map((m) => ({ vai: m.vai, noi_dung: String(m.noi_dung || "") })) };
}

// Trang đào tạo: mỗi lần bấm một tình huống (tin khách có tinh_huong) là một cuộc chat mới. Tin gõ tay sau đó thuộc
// cuộc của tình huống gần nhất phía trên. Gửi cầu nối chỉ lịch sử của đúng cuộc đó, để tin của tình huống khác
// (vd tự hại) không làm sai câu trả lời của tình huống sau. Chưa có tình huống nào thì cả lịch sử là một cuộc.
export function dauCuoc(lich_su, i = (lich_su || []).length - 1) {
  for (let k = Math.min(i, (lich_su || []).length - 1); k >= 0; k--) if (lich_su[k]?.vai === "khach" && lich_su[k].tinh_huong) return k;
  return 0;
}
// Lịch sử của cuộc chứa tin thứ i, tính tới hết tin i (denCuoi: false → không lấy tin i, dùng cho mẫu sửa)
export const lichSuCuoc = (lich_su, i = (lich_su || []).length - 1, { denCuoi = true } = {}) => (lich_su || []).slice(dauCuoc(lich_su, i), denCuoi ? i + 1 : i);

export function yeuCauMauSua({ kenh, goi, lich_su, ban_agent, ban_chu_tich, ly_do }) {
  return { kenh: String(kenh), goi: Number(goi) || 0, lich_su: yeuCauTraLoi({ kenh, goi, lich_su }).lich_su, ban_agent: String(ban_agent || ""), ban_chu_tich: String(ban_chu_tich || "").trim(), ly_do: String(ly_do || "").trim() };
}

// Phản hồi /tro_ly/tra_loi → tin agent để hiện trong khung chat
export function docTraLoi(j) {
  if (!j || typeof j !== "object") throw new Error("Cầu nối trả về không đọc được.");
  if (j.chuyen_nguoi) {
    const t = String(j.tra_loi || "").trim() || CAU_GIU_KHACH;
    const k = kiemTraLoiAgent(t);
    return { vai: "agent", noi_dung: t, chuyen_nguoi: true, ly_do: String(j.ly_do || ""), ghi_chu: String(j.ghi_chu_ky_thuat || ""), ...(k.ok ? {} : { bi_chan: k.loi }) };
  }
  const t = String(j.tra_loi || "").trim();
  if (!t) throw new Error("Agent trả lời rỗng.");
  const k = kiemTraLoiAgent(t);
  return { vai: "agent", noi_dung: t, ghi_chu: String(j.ghi_chu_ky_thuat || ""), ...(k.ok ? {} : { bi_chan: k.loi }) };
}

// Danh sách mẫu đã sửa: mới nhất trên đầu (theo thời gian nếu có, không thì theo thứ tự trả về đảo ngược)
export function sapMauSua(j) {
  const list = Array.isArray(j) ? j : Array.isArray(j?.mau) ? j.mau : Array.isArray(j?.mau_sua) ? j.mau_sua : [];
  const t = (m) => Date.parse(m.luc || m.thoi_gian || m.at || "") || 0;
  return list.map((m, i) => ({ ...m, _i: i })).sort((a, b) => (t(b) - t(a)) || (b._i - a._i));
}

export const LOI_CAU_NOI_TAT = "Cầu nối máy nhà đang tắt hoặc đường hầm chưa mở — chưa gọi được agent. Bật cầu nối ở máy nhà rồi bấm Thử lại.";
export const LOI_QUA_LUOT = "Máy nhà đang quá lượt (429) — đợi ít phút rồi gửi lại.";
export const DANG_NOI_LAI = "Đang nối lại máy nhà…";

// Gọi một route của cầu nối. Không có cầu nối / mạng hỏng → lỗi có cờ mang (để nối lại rồi gửi lại); quá hạn → lỗi
// không có cờ mang; 429 → báo quá lượt, không báo “cầu nối tắt”. Không tự rơi về AI khác.
export async function goiTroLy({ fetchImpl = globalThis.fetch, base, token = "", path, method = "POST", body, ms = 90000 }) {
  if (!base) { const e = new Error(LOI_CAU_NOI_TAT); e.tat = true; e.mang = true; throw e; }
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  let r;
  try {
    r = await fetchImpl(`${base}${path}`, {
      method, signal: c.signal,
      headers: { ...(method === "POST" ? { "content-type": "application/json" } : {}), ...(token ? { "x-boi-token": token } : {}) },
      ...(method === "POST" ? { body: JSON.stringify(body) } : {}),
    });
  } catch (err) {
    const het = err?.name === "AbortError";
    const e = new Error(het ? "Agent trả lời quá lâu nên đã dừng chờ." : LOI_CAU_NOI_TAT);
    e.tat = !het;
    e.mang = !het;
    throw e;
  } finally { clearTimeout(t); }
  let j = null;
  try { j = await r.json(); } catch (_) { /* không phải JSON */ }
  if (!r.ok) {
    const e = new Error(r.status === 429 ? LOI_QUA_LUOT : r.status === 404 ? `Cầu nối chưa có route ${path} (máy nhà chưa cập nhật).` : `Cầu nối báo lỗi ${r.status}${j?.error ? `: ${j.error}` : ""}.`);
    e.status = r.status;
    if (r.status === 429) e.quaLuot = true;
    throw e;
  }
  return j;
}

// Lỗi mạng của đường hầm (fetch ném lỗi, không phải hết giờ; hoặc chưa có địa chỉ cầu nối): thử lại tối đa 4 lần, chờ
// 2 s, 5 s, 10 s, 20 s; trước mỗi lần nối lại (dò lại cầu nối, đọc lại địa chỉ đường hầm) rồi gửi lại đúng yêu cầu đó.
// Hết 4 lần mới báo lỗi. Hết giờ (90 s) hay 429 thì không thử lại.
// goi: hàm gọi lại từ đầu (lấy địa chỉ mới nhất mỗi lần). onNoiLai({lan, tong}) khi đang nối lại, onNoiLai(null) khi xong.
export const LICH_THU_LAI = [2000, 5000, 10000, 20000];
const ngu = (ms) => new Promise((r) => setTimeout(r, ms));
export async function goiCoThuLai(goi, { noiLai, onNoiLai, lich = LICH_THU_LAI, cho = ngu } = {}) {
  try { return await goi(); } catch (e) {
    if (!e?.mang || !noiLai) throw e;
    let loi = e;
    try {
      for (let k = 0; k < lich.length; k++) {
        onNoiLai?.({ lan: k + 1, tong: lich.length });
        await cho(lich[k]);
        try { await noiLai(); } catch (_) { /* dò hỏng: lần gọi lại sẽ báo lỗi */ }
        try { return await goi(); } catch (e2) { loi = e2; if (!e2?.mang) throw e2; }
      }
      throw loi;
    } finally { onNoiLai?.(null); }
  }
}

// Hàng chờ mẫu sửa: bấm lưu mà gửi hỏng thì bản Chủ tịch sửa nằm lại ở localStorage, cầu nối sống thì tự gửi lại.
export const HANG_CHO_KEY = "boi.daotao.mau-cho.v1";
export function docHangCho(storage) {
  try { const x = JSON.parse(storage?.getItem(HANG_CHO_KEY) || "[]"); return Array.isArray(x) ? x.filter((m) => m && m.body) : []; } catch (_) { return []; }
}
function ghiHangCho(storage, list) {
  try { if (list.length) storage?.setItem(HANG_CHO_KEY, JSON.stringify(list)); else storage?.removeItem(HANG_CHO_KEY); return true; } catch (_) { return false; }
}
export function themHangCho(storage, ma, body) {
  const list = docHangCho(storage).filter((m) => m.ma !== ma);
  list.push({ ma, body, luc: new Date().toISOString() });
  return ghiHangCho(storage, list);
}
export const boHangCho = (storage, ma) => ghiHangCho(storage, docHangCho(storage).filter((m) => m.ma !== ma));
// Gửi lần lượt từ cũ tới mới; gửi được cái nào bỏ cái đó khỏi hàng, hỏng thì dừng và giữ phần còn lại.
export async function guiHangCho(storage, gui) {
  const list = docHangCho(storage);
  const daGui = [];
  while (list.length) {
    try { await gui(list[0].body); } catch (_) { break; }
    daGui.push(list.shift().ma);
    ghiHangCho(storage, list);
  }
  return { daGui, con: list.length };
}
