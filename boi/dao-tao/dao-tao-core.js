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
// mau: câu Chủ tịch duyệt làm chuẩn (điền sẵn khi bấm "Sửa câu này"). chuyen: agent không tự trả lời mà chuyển Chủ tịch.
const BRAND = "Tarot debaderlis";
export const TINH_HUONG = [
  { id: "mien-phi", ten: "Đòi bói miễn phí", tin: "Bói thử cho em một câu miễn phí đi, thấy đúng thì em mua gói liền." },
  { id: "mac-ca", ten: "Mặc cả giá", tin: "Giá vậy cao quá, bớt cho em còn một nửa được không? Em là sinh viên." },
  { id: "nghi-lua", ten: "Nghi lừa đảo", tin: "Sao em biết bên chị không lừa? Em chuyển khoản xong rồi chị lặn mất thì sao?" },
  { id: "may-ai", ten: "Hỏi “bạn là AI/máy à” (lần đầu)", tin: "Bạn là máy hay AI trả lời tự động vậy?", mau: `Mình là trợ lý của ${BRAND}, phụ trách trải bài và nhắn với bạn. Mình quay lại câu bạn đang băn khoăn nhé: bạn muốn hỏi về chuyện gì nhất lúc này?` },
  { id: "gang-lan-2", ten: "Khách gặng lần 2, đòi trả lời có/không", tin: "Trả lời thẳng đi: có phải AI không? Có hay không thôi.", chuyen: true },
  { id: "ai-boc", ten: "Hỏi “ai bốc bài / có bốc tay không”", tin: "Ai bốc bài cho em vậy? Có bốc tay không?", mau: `Bài của bạn được xào mới và trải riêng cho đúng câu hỏi, theo cách trải của ${BRAND}. Điều đáng để ý hơn là lời giải nói gì với bạn: mình đi tiếp vào phần đó nhé?` },
  { id: "ngoai-goi", ten: "Hỏi thêm ngoài gói", tin: "Cho em hỏi thêm một câu nữa thôi, câu nhỏ xíu à, không tính tiền nha." },
  { id: "hoan-tien", ten: "Đòi hoàn tiền", tin: "Bói chẳng đúng gì cả, em thấy phí tiền quá, hoàn tiền lại cho em đi." },
  { id: "nang-loi", ten: "Nói nặng lời", tin: "Bói toán toàn nói nhảm, mấy người chỉ giỏi lừa tiền thiên hạ." },
  { id: "lan-man", ten: "Tâm sự lan man", tin: "Dạo này em mệt lắm, đi làm thì sếp khó, về nhà thì mẹ cằn nhằn, người yêu cũ lại nhắn tin, em cũng không biết mình muốn hỏi gì nữa, chị nghe em kể chút được không…" },
];
export const NHAN_CHUYEN = "CHUYỂN CHỦ TỊCH TRẢ LỜI";
export const CAU_GIU_KHACH = "Bạn đợi mình chút nhé.";

// Địa chỉ gốc của cầu nối từ via.base (…/gemini) → bỏ đuôi /gemini
export const goc = (viaBase) => String(viaBase || "").replace(/\/gemini\/?$/, "");

export function yeuCauTraLoi({ kenh, goi, cau_con, lich_su }) {
  return { kenh: String(kenh), goi: Number(goi) || 0, cau_con: Math.max(0, Number(cau_con) || 0), lich_su: (lich_su || []).filter((m) => m.vai === "khach" || m.vai === "agent").map((m) => ({ vai: m.vai, noi_dung: String(m.noi_dung || "") })) };
}

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

// Gọi một route của cầu nối. Không có cầu nối / mạng hỏng / quá hạn → lỗi rõ ràng, không tự rơi về AI khác.
export async function goiTroLy({ fetchImpl = globalThis.fetch, base, token = "", path, method = "POST", body, ms = 90000 }) {
  if (!base) { const e = new Error(LOI_CAU_NOI_TAT); e.tat = true; throw e; }
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
    const e = new Error(err?.name === "AbortError" ? "Agent trả lời quá lâu nên đã dừng chờ." : LOI_CAU_NOI_TAT);
    e.tat = err?.name !== "AbortError";
    throw e;
  } finally { clearTimeout(t); }
  let j = null;
  try { j = await r.json(); } catch (_) { /* không phải JSON */ }
  if (!r.ok) {
    const e = new Error(r.status === 404 ? `Cầu nối chưa có route ${path} (máy nhà chưa cập nhật).` : `Cầu nối báo lỗi ${r.status}${j?.error ? `: ${j.error}` : ""}.`);
    e.status = r.status;
    throw e;
  }
  return j;
}
