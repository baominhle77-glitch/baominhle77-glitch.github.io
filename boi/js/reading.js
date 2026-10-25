// Giải bài theo luật: Tarot đọc theo vị trí, Lenormand đọc theo cặp (trước = chủ thể, sau = tính chất) rồi cả chuỗi.
import { posLabel, posKey, spreadById } from "./spreads.js";
import { mainTopic } from "./topic.js";
import { tarotMeaning, capMeaning } from "./data.js";

export const tarotCard = (db, id) => db.tarot.la[id];
export const lenCard = (db, id) => db.lenormand.la[id - 1];

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

// Điểm một lá (−2..+2). Lá ngược: năng lượng tốt bị chặn, năng lượng xấu nặng thêm.
export function cardScore(card, rev, money) {
  const base = money ? card.diem_tien : card.diem_chung;
  if (!rev) return base;
  return clamp(base > 0 ? base * 0.25 - 0.75 : base - 0.5, -2, 2);
}

export const SCAM = { tarot: ["The Moon", "Seven of Swords", "The Devil", "Five of Swords"], lenormand: ["Fox", "Snake", "Mice", "Clouds"] };

export function toTen(S) {
  return clamp(Math.round((5.5 + S * 2.25) * 2) / 2, 1, 10);
}
export function band(x) {
  if (x >= 8) return { key: "hi", text: "mạnh, thuận rõ" };
  if (x >= 6.5) return { key: "hi", text: "khá, nghiêng tốt" };
  if (x >= 5) return { key: "mid", text: "trung bình, được hay không tuỳ cách làm" };
  if (x >= 3.5) return { key: "lo", text: "yếu, nhiều lực cản" };
  return { key: "lo", text: "xấu rõ, nên phòng thủ" };
}
export function yesNo(x) {
  if (x >= 6.5) return "CÓ";
  if (x >= 5) return "CÓ, NHƯNG CÓ ĐIỀU KIỆN";
  if (x >= 4) return "NGHIÊNG VỀ KHÔNG";
  return "KHÔNG";
}

export function cardName(db, deck, cell) {
  if (!cell || !cell.ok) return `${cell?.raw ?? "?"} → (ô trống, chờ số thay)`;
  const c = deck === "tarot" ? tarotCard(db, cell.card) : lenCard(db, cell.card);
  return `${String(cell.n).padStart(2, "0")} → ${c.vi} (${c.en})${cell.rev ? " — ngược" : ""}`;
}

export function lenPairs(cells) {
  const ok = cells.filter((c) => c.ok);
  const pairs = [];
  if (ok.length < 2) return pairs;
  for (let i = 0; i + 1 < ok.length; i += 2) pairs.push([ok[i], ok[i + 1]]);
  if (ok.length % 2) pairs.push([ok[ok.length - 2], ok[ok.length - 1]]);
  return pairs;
}

export function pairText(db, a, b, money, topic) {
  const known = db.lenormand.cap[`${a.en}+${b.en}`];
  if (known && money) return { text: known, known: true };
  const day = capMeaning(db, a, b, topic, money);
  if (day) return { text: day, known: true };
  if (known) return { text: known, known: true };
  const sa = money ? a.diem_tien : a.diem_chung;
  const sb = money ? b.diem_tien : b.diem_chung;
  let tone;
  if (sa >= 0.5 && sb >= 0.5) tone = "hai lá cùng thuận → củng cố nhau, việc trôi.";
  else if (sa <= -0.5 && sb <= -0.5) tone = "hai lá cùng xấu → cảnh báo kép, ưu tiên phòng thủ.";
  else if (sa >= 0.5 && sb <= -0.5) tone = `việc tốt nhưng vướng ở khâu sau: ${b.rui_ro.toLowerCase()}`;
  else if (sa <= -0.5 && sb >= 0.5) tone = "vấn đề có lối ra, xấu chuyển dần sang được.";
  else tone = "trung tính, phải nhìn lá xung quanh.";
  const head = a.chu_the.split(",")[0];
  return { text: `${cap(head)} mang tính ${b.tinh_chat.split(",").slice(0, 2).join(",")} — ${tone}`, known: false };
}

function chainText(cards) {
  if (!cards.length) return "";
  if (cards.length === 1) return `Một lá: ${cards[0].chu_the}.`;
  const first = cards[0], last = cards[cards.length - 1];
  const mid = cards.slice(1, -1).map((c) => c.tinh_chat.split(",")[0]).join(" → ");
  return `Khởi từ ${first.chu_the.split(",")[0]}${mid ? `, diễn biến ${mid}` : ""}, kết theo hướng ${last.tinh_chat}.`;
}

export function readTier(db, session, ti, tarotCells = [], lenCells = [], opts = {}) {
  const money = session.money;
  const topic = opts.topic || (mainTopic(session.cauHoi) === "chung" && money ? "tien" : mainTopic(session.cauHoi));
  const tierCfg = session.tiers[ti] || { ten: `Tầng ${ti + 1}`, pos: null };
  const ten = opts.extra ? `${tierCfg.ten || `Tầng ${ti + 1}`} (rút thêm)` : tierCfg.ten || `Tầng ${ti + 1}`;
  const scored = [];
  const repeats = [];
  const empty = [];

  const tarot = tarotCells.map((cell, i) => {
    const pos = posLabel(tierCfg, i);
    if (!cell.ok) { empty.push({ deck: "tarot", i, cell }); return { pos, cell, text: `${pos}: ô trống — số ${cell.raw} ngoài khoảng 01–78, chờ số thay.` }; }
    const c = tarotCard(db, cell.card);
    const s = cardScore(c, cell.rev, money);
    scored.push({ deck: "tarot", card: c, s, cell });
    if (cell.repeatOf) repeats.push({ deck: "tarot", cell, card: c });
    const key = posKey(pos);
    const posMean = key ? c.vi_tri[key] : cap(c.tu_khoa);
    const tri = tarotMeaning(c, cell.rev, topic, pos);
    const body = cell.rev
      ? `ngược — năng lượng bị chặn: ${tri || c.rui_ro}`
      : money ? c.tien : tri || `${cap(c.tu_khoa)}.`;
    return { pos, cell, card: c, score: s, text: `${pos} — ${c.vi}${cell.rev ? " (ngược)" : ""}: ${posMean}. ${body}` };
  });

  const lenCardsOk = [];
  lenCells.forEach((cell, i) => {
    if (!cell.ok) { empty.push({ deck: "lenormand", i, cell }); return; }
    const c = lenCard(db, cell.card);
    lenCardsOk.push(c);
    scored.push({ deck: "lenormand", card: c, s: money ? c.diem_tien : c.diem_chung, cell });
    if (cell.repeatOf) repeats.push({ deck: "lenormand", cell, card: c });
  });
  const pairs = lenPairs(lenCells).map(([x, y]) => {
    const a = lenCard(db, x.card), b = lenCard(db, y.card);
    return { a, b, ...pairText(db, a, b, money, topic) };
  });

  const T = avg(scored.filter((x) => x.deck === "tarot").map((x) => x.s));
  const L = avg(scored.filter((x) => x.deck === "lenormand").map((x) => x.s));
  const S = T == null ? (L ?? 0) : L == null ? T : 0.6 * T + 0.4 * L;
  const diem = scored.length ? toTen(S) : null;
  const b = diem == null ? null : band(diem);

  const sorted = [...scored].sort((x, y) => x.s - y.s);
  const worst = sorted[0], best = sorted[sorted.length - 1];
  const lastTarot = [...tarot].reverse().find((x) => x.card);
  const mode = spreadById(session.spreadId).mode;

  let chot = "Chưa đủ lá để chốt.";
  if (b) {
    chot = `${b.text} (${diem}/10).`;
    if (best && best.s > 0) chot += ` Lá kéo lên mạnh nhất: ${best.card.vi}.`;
    if (worst && worst.s < 0) chot += ` Lá kéo xuống: ${worst.card.vi}.`;
    if (lastTarot && posKey(lastTarot.pos)) chot += ` Hướng kết: ${lastTarot.card.vi_tri.ket_qua.toLowerCase()}.`;
    if (mode === "yesno") chot = `${yesNo(diem)} — ${chot}`;
  }
  const nghen = !worst ? "—"
    : worst.s < 0.25 ? `${worst.card.vi}: ${worst.card.rui_ro}`
    : `Không có lá cản rõ; điểm yếu nhất là ${worst.card.vi} (${worst.card.rui_ro.toLowerCase()})`;
  const khuyen = [];
  if (worst && worst.s < 0.25) khuyen.push(worst.card.loi_khuyen);
  if (best && best.s > 0 && best !== worst) khuyen.push(best.card.loi_khuyen);
  if (!khuyen.length && best) khuyen.push(best.card.loi_khuyen);

  return {
    ten, ti, tarot, pairs, chain: chainText(lenCardsOk), diem, band: b?.key, S, chot, nghen, khuyen,
    yesno: mode === "yesno" && diem != null ? yesNo(diem) : null,
    repeats: repeats.map(({ deck, cell, card }) => ({
      text: `${deck === "tarot" ? "Tarot" : "Lenormand"} số ${String(cell.n).padStart(2, "0")} (${card.vi}) lặp lại từ lượt ${cell.repeatOf.round}, tầng ${cell.repeatOf.tier}, ô ${cell.repeatOf.pos} — lá lặp = nhấn mạnh, không phải xác nhận độc lập.`,
    })),
    empty, scored,
  };
}

export function readRound(db, session, ri) {
  const round = session.rounds[ri];
  const n = Math.max(round.tarot.length, round.lenormand.length);
  const tiers = [];
  for (let ti = 0; ti < n; ti++) tiers.push(readTier(db, session, ti, round.tarot[ti] || [], round.lenormand[ti] || [], { extra: ri > 0 }));
  return { ri, atText: round.atText, tiers };
}

const ADVICE_MONEY = {
  scam: "Cảnh giác lừa đảo: không chuyển tiền, đặt cọc hay “nạp để rút” cho bất kỳ lời mời lãi cao nào; gọi lại số chính thức để xác minh.",
  weak: "Giữ quỹ dự phòng tối thiểu 3 tháng chi tiêu; hoãn khoản chi lớn không bắt buộc.",
  strong: "Giai đoạn thuận: chủ động chốt việc, tăng giá/doanh số, nhưng trích ngay 20–30 % khoản dư để tích luỹ.",
  mid: "Không có cú hích lớn: tiền tăng nhờ làm đều tay, theo dõi thu chi hằng tuần.",
};

export function summarize(db, session, rounds, settings = {}) {
  const who = settings.xungHo || "Queen Linh";
  const tiers = rounds.flatMap((r) => r.tiers).filter((t) => t.diem != null);
  if (!tiers.length) return { text: [`${who}, chưa có lá hợp lệ nào để tổng kết.`], advice: [] };
  const main = rounds[0]?.tiers.filter((t) => t.diem != null) || tiers;
  const mean = avg(main.map((t) => t.diem));
  const top = [...main].sort((a, b) => b.diem - a.diem);
  const lines = [];
  const meanTxt = Math.round(mean * 10) / 10;
  lines.push(`${who}, nói thẳng: trải chính trung bình ${meanTxt}/10 — ${band(mean).text}.`);
  if (main.length >= 2) {
    lines.push(`Tầng mạnh nhất: ${top[0].ten} (${top[0].diem}/10). Tầng yếu nhất: ${top[top.length - 1].ten} (${top[top.length - 1].diem}/10).`);
    const d = main[main.length - 1].diem - main[0].diem;
    lines.push(d >= 1 ? "Xu hướng đi lên từ đầu tới cuối trải." : d <= -1 ? "Xu hướng đi xuống về cuối trải — đừng tiêu trước phần chưa chắc." : "Xu hướng đi ngang, không có bước nhảy lớn.");
  }
  const extra = rounds.slice(1).flatMap((r) => r.tiers).filter((t) => t.diem != null);
  if (extra.length) {
    const em = avg(extra.map((t) => t.diem));
    lines.push(`Các lượt rút thêm trung bình ${Math.round(em * 10) / 10}/10 — chỉ làm rõ thêm, không thay kết luận của trải chính.`);
  }
  const reps = tiers.flatMap((t) => t.repeats);
  if (reps.length) lines.push(`Có ${reps.length} lá lặp: lá lặp là nhấn mạnh, không phải xác nhận độc lập.`);
  if (spreadById(session.spreadId).mode === "yesno") lines.push(`Kết luận Có/Không từng tầng: ${main.map((t) => `${t.ten} → ${t.yesno}`).join("; ")}.`);

  const all = tiers.flatMap((t) => t.scored);
  const scam = all.filter((x) => SCAM[x.deck].includes(x.card.en));
  const advice = [];
  if (scam.length) {
    lines.push(`Lá cảnh báo gian dối/hao hụt xuất hiện: ${[...new Set(scam.map((x) => x.card.vi))].join(", ")}.`);
    advice.push(ADVICE_MONEY.scam);
  }
  if (session.money) {
    advice.push(mean >= 6.5 ? ADVICE_MONEY.strong : mean >= 5 ? ADVICE_MONEY.mid : ADVICE_MONEY.weak);
  }
  const worstTier = top[top.length - 1];
  if (worstTier && worstTier.khuyen[0]) advice.push(`Riêng ${worstTier.ten}: ${worstTier.khuyen[0]}`);
  if (top[0] && top[0] !== worstTier && top[0].khuyen[0]) advice.push(`Tận dụng ${top[0].ten}: ${top[0].khuyen[top[0].khuyen.length - 1]}`);
  return { text: lines, advice: [...new Set(advice)], mean };
}
