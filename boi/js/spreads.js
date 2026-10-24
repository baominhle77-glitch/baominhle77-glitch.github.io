// Mẫu trải. Mỗi mẫu sinh danh sách tầng {ten, t, l, pos} — người dùng sửa được tên/số lá trước khi khoá.
import { gmt7Parts } from "./core.js";

const POS4 = ["Tiến trình", "Hiệu quả", "Kết quả tài chính", "Tín hiệu mức tiền"];
const POS3 = ["Tiến trình", "Hiệu quả", "Kết quả"];
const POS_YN = ["Hiện trạng", "Diễn biến", "Kết luận"];
const POS_VH = ["Gốc", "Diễn biến", "Xu hướng"];

function nextMonths(count, from = gmt7Parts()) {
  const out = [];
  let m = from.month, y = from.year;
  for (let i = 0; i < count; i++) {
    m += 1;
    if (m > 12) { m = 1; y += 1; }
    out.push(`Tháng ${m}/${y}`);
  }
  return out;
}
export function defaultYear(from = gmt7Parts()) {
  return from.month >= 10 ? from.year + 1 : from.year;
}

export const SPREADS = [
  {
    id: "3thang", ten: "3 tháng tới", money: true,
    goiY: "3 tầng (mỗi tháng một tầng) × 4 Tarot + 4 Lenormand = 12 + 12 lá. Tarot theo vị trí: tiến trình → hiệu quả → kết quả tài chính → tín hiệu mức tiền.",
    tiers: () => nextMonths(3).map((ten) => ({ ten, t: 4, l: 4, pos: POS4 })),
  },
  {
    id: "12thang", ten: "12 tháng năm X", money: true, needsYear: true,
    goiY: "12 tầng (tháng 1–12) × 3 Tarot + 3 Lenormand = 36 + 36 lá.",
    tiers: (year) => Array.from({ length: 12 }, (_, i) => ({ ten: `Tháng ${i + 1}/${year}`, t: 3, l: 3, pos: POS3 })),
  },
  {
    id: "canam", ten: "Cả năm (toàn trải)", money: true, needsYear: true, mode: "canam",
    goiY: "1 trải: 12 Tarot (mỗi lá một tháng) + 9 Lenormand (bức tranh chung của năm), so với năm trước.",
    tiers: (year) => [{ ten: `Cả năm ${year}`, t: 12, l: 9, pos: Array.from({ length: 12 }, (_, i) => `Tháng ${i + 1}`) }],
  },
  {
    id: "cokhong", ten: "Có/Không 3 tầng", money: false, mode: "yesno",
    goiY: "3 tầng × 3 Tarot + 3 Lenormand = 9 + 9 lá. Tự đặt tên từng tầng thành câu hỏi Có/Không.",
    tiers: () => ["Bên kia có sạch, có thật không?", "Có nhận được không?", "Giữ được lâu không?"].map((ten) => ({ ten, t: 3, l: 3, pos: POS_YN })),
  },
  {
    id: "tinhcam", ten: "Tình cảm 3 tầng", money: false,
    goiY: "3 tầng × 3 Tarot + 3 Lenormand: bạn đang ở đâu → người kia/đối phương → hướng đi 1–3 tháng.",
    tiers: () => ["Bạn đang ở đâu", "Người kia nghĩ gì, muốn gì", "Hướng đi 1–3 tháng tới"].map((ten) => ({ ten, t: 3, l: 3, pos: POS_VH })),
  },
  {
    id: "vanhan", ten: "Vận hạn", money: false,
    goiY: "5 tầng × 3 + 3 = 15 + 15 lá (giảm còn 12 + 12 bằng cách đặt một số tầng 2 lá).",
    tiers: () => ["Tổng quan", "Hao tài", "Khía cạnh khác", "4–6 tuần tới", "Điểm sáng"].map((ten) => ({ ten, t: 3, l: 3, pos: POS_VH })),
  },
  {
    id: "tudo", ten: "Tự do", money: false,
    goiY: "Số tầng, tên tầng và số lá mỗi tầng tuỳ ý.",
    tiers: () => [{ ten: "Tầng 1", t: 3, l: 3, pos: null }],
  },
];

export const spreadById = (id) => SPREADS.find((s) => s.id === id) || SPREADS[SPREADS.length - 1];

// Tên vị trí của lá thứ i trong tầng
export function posLabel(tier, i) {
  return (tier && tier.pos && tier.pos.length && tier.pos[i]) || `Lá ${i + 1}`;
}

// Vị trí → khoá nghĩa trong dữ liệu
export function posKey(label) {
  const s = (label || "").toLowerCase();
  if (/tiến trình|hiện trạng|gốc/.test(s)) return "tien_trinh";
  if (/hiệu quả|diễn biến/.test(s)) return "hieu_qua";
  if (/tín hiệu/.test(s)) return "tin_hieu";
  if (/kết quả|kết luận|xu hướng/.test(s)) return "ket_qua";
  return null;
}
