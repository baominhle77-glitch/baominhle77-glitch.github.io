// Quy đổi huyền học từ lá sang khoảng tiền (triệu đồng). Không phải dự báo tài chính.
// S = 0.6·(điểm Tarot TB theo tốc độ) + 0.4·(điểm Lenormand TB theo tốc độ), mỗi lá −2..+2
// V = tốc độ TB (0.4..1.5);  hệ số = kẹp(1 + 0.22·S·V, 0.25, 1.9)
// trung tâm = mốc × hệ số;  biên = 30 % + 5 % × độ lệch chuẩn điểm (tối đa 40 %)
import { tarotCard, lenCard, cardScore } from "./reading.js";
import { spreadById } from "./spreads.js";

export const FORMULA = [
  "Mỗi lá có điểm tiền −2..+2 và hệ số tốc độ (lá nhanh tác động mạnh hơn trong kỳ).",
  "S = 0,6 × điểm Tarot trung bình (gia quyền tốc độ) + 0,4 × điểm Lenormand trung bình (gia quyền tốc độ).",
  "V = tốc độ trung bình của các lá trong kỳ.",
  "Hệ số nhân = 1 + 0,22 × S × V (giới hạn 0,25 – 1,9).",
  "Con số trung tâm = thu nhập hiện tại × hệ số nhân.",
  "Biên = 30 % + 5 % × độ lệch chuẩn điểm các lá (tối đa 40 %) → khoảng = trung tâm × (1 ± biên).",
  "Làm tròn: dưới 10 tr → 0,5 tr; dưới 100 tr → 1 tr; từ 100 tr → 5 tr.",
];

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export function roundNice(x) {
  const step = x < 10 ? 0.5 : x < 100 ? 1 : 5;
  const r = Math.round(x / step) * step;
  return Math.max(0, Math.round(r * 10) / 10) + 0; // +0 bỏ −0
}

function weighted(items) {
  if (!items.length) return null;
  const sv = items.reduce((a, x) => a + x.s * x.v, 0);
  const v = items.reduce((a, x) => a + x.v, 0);
  return v ? sv / v : 0;
}

export function periodEstimate(tarotItems, lenItems, base) {
  const T = weighted(tarotItems), L = weighted(lenItems);
  const S = T == null ? (L ?? 0) : L == null ? T : 0.6 * T + 0.4 * L;
  const all = [...tarotItems, ...lenItems];
  const V = all.length ? all.reduce((a, x) => a + x.v, 0) / all.length : 1;
  const mean = all.length ? all.reduce((a, x) => a + x.s, 0) / all.length : 0;
  const sd = all.length ? Math.sqrt(all.reduce((a, x) => a + (x.s - mean) ** 2, 0) / all.length) : 0;
  const mult = clamp(1 + 0.22 * S * V, 0.25, 1.9);
  const margin = Math.min(0.4, 0.3 + 0.05 * sd);
  const centerRaw = base * mult;
  return {
    S: Math.round(S * 100) / 100, V: Math.round(V * 100) / 100, mult: Math.round(mult * 1000) / 1000,
    margin: Math.round(margin * 1000) / 1000,
    center: roundNice(centerRaw),
    low: roundNice(centerRaw * (1 - margin)),
    high: roundNice(centerRaw * (1 + margin)),
  };
}

function items(db, deck, cells) {
  return cells.filter((c) => c.ok).map((c) => {
    const card = deck === "tarot" ? tarotCard(db, c.card) : lenCard(db, c.card);
    return { card, cell: c, s: deck === "tarot" ? cardScore(card, c.rev, true) : card.diem_tien, v: card.toc_do };
  });
}
const names = (xs) => xs.map((x) => `${String(x.cell.n).padStart(2, "0")} ${x.card.vi}${x.cell.rev ? " (ngược)" : ""}`).join(", ");

// Bảng tiền cho lượt rút chính
export function moneyTable(db, session, ctx = {}) {
  const base = Number(ctx.thuNhap);
  if (!session.money) return null;
  if (!(base > 0)) return { missing: true };
  const round = session.rounds[0];
  if (!round) return null;
  const rows = [];
  if (spreadById(session.spreadId).mode === "canam") {
    const t = items(db, "tarot", round.tarot[0] || []);
    const l = items(db, "lenormand", round.lenormand[0] || []);
    t.forEach((x, i) => {
      // Mỗi tháng: lá Tarot của tháng + toàn bộ Lenormand làm nền năm
      const est = periodEstimate([x], l, base);
      const li = l.length ? l[Math.min(l.length - 1, Math.floor((i * l.length) / Math.max(t.length, 1)))] : null;
      rows.push({ ky: `Tháng ${i + 1}`, tarot: names([x]), lenormand: li ? `${names([li])} (nền năm)` : "—", ...est });
    });
  } else {
    const n = Math.max(round.tarot.length, round.lenormand.length);
    for (let ti = 0; ti < n; ti++) {
      const t = items(db, "tarot", round.tarot[ti] || []);
      const l = items(db, "lenormand", round.lenormand[ti] || []);
      if (!t.length && !l.length) continue;
      rows.push({ ky: session.tiers[ti]?.ten || `Kỳ ${ti + 1}`, tarot: names(t), lenormand: names(l), ...periodEstimate(t, l, base) });
    }
  }
  if (!rows.length) return null;
  const total = roundNice(rows.reduce((a, r) => a + r.center, 0));
  const perMonth = Math.round((total / rows.length) * 10) / 10;
  const best = rows.reduce((a, r) => (r.center > a.center ? r : a), rows[0]);
  const worst = rows.reduce((a, r) => (r.center < a.center ? r : a), rows[0]);
  const target = Number(ctx.mucTieu);
  const out = { rows, total, perMonth, best, worst, base, formula: FORMULA };
  if (target > 0) {
    out.target = target;
    out.targetPct = Math.round((perMonth / target) * 100);
    out.monthsHit = rows.filter((r) => r.center >= target).length;
  }
  const prev = Number(ctx.namTruoc);
  if (prev > 0 && rows.length === 12) {
    out.prevYear = prev;
    out.vsPrevPct = Math.round(((total - prev) / prev) * 100);
  }
  return out;
}
