// Động cơ luật sâu: phân tích chủ đề trội, dòng chảy vị trí, Lenormand cặp/bộ ba/chuỗi, nối tầng, mâu thuẫn.
// Kết quả cùng khuôn với JSON mà lớp AI trả về → giao diện dựng chung một kiểu.
import { readTier, tarotCard, lenCard, SCAM, band, yesNo, tierWord, repeatTierName } from "./reading.js";
import { drawsOf } from "./state.js";
import { spreadById, posKey } from "./spreads.js";
import { mainTopic } from "./topic.js";
import { tarotMeaning, lenMeaning, cardYesNo } from "./data.js";
import { moneyTable } from "./money.js";

const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const low = (s) => (s ? s[0].toLowerCase() + s.slice(1) : s);
const strip = (s) => String(s || "").replace(/[.\s]+$/, "");
const pad = (n) => String(n).padStart(2, "0");
const round1 = (x) => Math.round(x * 10) / 10;
const first = (s) => String(s || "").split(",")[0].trim();

function hash32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

export const splitSentences = (text) => String(text).split(/(?<=[.!?…])\s+/).map((s) => s.trim()).filter(Boolean);
const normS = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

// Người viết: chọn biến thể câu theo seed của phiên, không bao giờ lặp một câu đã viết
class Writer {
  constructor(seed) { this.seed = seed; this.used = new Set(); }
  ok(text) { return splitSentences(text).every((s) => s.length < 18 || !this.used.has(normS(s))); }
  mark(text) { splitSentences(text).forEach((s) => { if (s.length >= 18) this.used.add(normS(s)); }); }
  // variants: mảng chuỗi; xoay vòng theo seed + key, lấy biến thể đầu tiên chưa dùng
  pick(key, variants) {
    const list = variants.filter(Boolean);
    if (!list.length) return null;
    const start = hash32(this.seed + "|" + key) % list.length;
    for (let i = 0; i < list.length; i++) {
      const v = list[(start + i) % list.length];
      if (this.ok(v)) { this.mark(v); return v; }
    }
    return null;
  }
  // ghép nhiều phần, mỗi phần là danh sách lựa chọn; phần nào cũng trùng hết thì bỏ phần đó
  join(key, parts) {
    const out = [];
    parts.forEach((alts, i) => { const s = this.pick(`${key}#${i}`, Array.isArray(alts) ? alts : [alts]); if (s) out.push(s); });
    return out.join(" ");
  }
}

const NOUN = {
  tien: { vat: "dòng tiền", ket: "thu nhập", hoi: "chuyện tiền" },
  tinh: { vat: "mối quan hệ", ket: "chuyện tình cảm", hoi: "chuyện tình" },
  viec: { vat: "công việc", ket: "kết quả công việc", hoi: "chuyện công việc" },
  suckhoe: { vat: "sức khoẻ", ket: "xu hướng sức khoẻ", hoi: "chuyện sức khoẻ" },
  cokhong: { vat: "việc đang hỏi", ket: "câu trả lời", hoi: "câu hỏi" },
  vanhan: { vat: "vận", ket: "vận hạn", hoi: "vận hạn" },
  chung: { vat: "việc này", ket: "kết quả", hoi: "câu hỏi" },
};

const SUIT_THEME = {
  wands: ["Lửa (Gậy) trội", "giai đoạn phải ra tay, chạy việc; kết quả đến từ hành động chứ không từ chờ đợi"],
  cups: ["Nước (Cốc) trội", "cảm xúc và các mối quan hệ chi phối; quyết định dễ bị cảm tính kéo đi"],
  swords: ["Khí (Kiếm) trội", "nhiều suy tính, căng thẳng và va chạm — đầu óc mệt hơn tay chân"],
  pentacles: ["Đất (Tiền) trội", "chuyện vật chất, công việc cụ thể là trục chính"],
};
const RANK_THEME = {
  1: "khởi đầu mới", 2: "lựa chọn và cân đối", 3: "mở rộng, hợp tác", 4: "ổn định nhưng đứng yên", 5: "biến động, hao hụt",
  6: "hồi phục, cho và nhận", 7: "thử thách, phải đánh giá lại", 8: "chuyển động, kỷ luật", 9: "gần đích, gồng chặng cuối",
  10: "kết thúc một chu kỳ", 11: "tin tức, học hỏi", 12: "hành động nhanh", 13: "khéo léo, nuôi dưỡng", 14: "làm chủ, cầm trịch",
};
const RANK_NAME = { 1: "Át", 11: "Tiểu đồng", 12: "Hiệp sĩ", 13: "Hoàng hậu", 14: "Vua" };

function shape(scores) {
  if (scores.length < 2) return "mot";
  const first = scores[0], last = scores[scores.length - 1];
  const mid = scores.slice(1, -1);
  if (mid.length && Math.min(...mid) <= Math.min(first, last) - 1) return "trung";
  if (mid.length && Math.max(...mid) >= Math.max(first, last) + 1) return "dinh";
  if (last - first >= 1.25) return "len";
  if (first - last >= 1.25) return "xuong";
  return "ngang";
}

// ---------- Phân tích thành phần ----------
export function composition(db, cells) {
  const tarot = cells.tarot.filter((c) => c.ok).map((c) => ({ cell: c, card: tarotCard(db, c.card) }));
  const len = cells.lenormand.filter((c) => c.ok).map((c) => ({ cell: c, card: lenCard(db, c.card) }));
  const suits = { wands: 0, cups: 0, swords: 0, pentacles: 0 };
  const ranks = {};
  let majors = 0, courts = 0, rev = 0;
  for (const { card, cell } of tarot) {
    if (cell.rev) rev++;
    if (card.nhom === "major") { majors++; continue; }
    suits[card.chat]++;
    ranks[card.so] = (ranks[card.so] || 0) + 1;
    if (card.so >= 11) courts++;
  }
  return { tarot, len, suits, ranks, majors, courts, rev, minors: tarot.length - majors };
}

function themeLines(w, db, comp, topic, session) {
  const n = NOUN[topic];
  const out = [];
  const { suits, minors, majors, tarot, len } = comp;
  const top = Object.entries(suits).sort((a, b) => b[1] - a[1]);
  if (minors >= 3 && top[0][1] >= Math.max(2, Math.ceil(minors * 0.35)) && top[0][1] > top[1][1]) {
    const [title, mean] = SUIT_THEME[top[0][0]];
    out.push(w.pick("suit", [
      `${title} (${top[0][1]}/${minors} lá Ẩn phụ): ${mean}.`,
      `Chất ${title.split(" ")[0]} chiếm ưu thế với ${top[0][1]} lá — ${mean}.`,
    ]));
  }
  if (topic === "tien" && minors >= 4 && suits.pentacles === 0) {
    out.push(w.pick("nopent", [
      "Không có lá Tiền (Pentacles) nào: tiền không phải trục chính của giai đoạn này, nó đến gián tiếp qua việc khác — đừng kỳ vọng một khoản rơi thẳng vào tay.",
      "Vắng hẳn chất Tiền: nguồn thu sẽ phải đi đường vòng qua công việc, quan hệ hoặc quyết định khác.",
    ]));
  }
  if (topic === "tinh" && minors >= 4 && suits.cups === 0) {
    out.push(w.pick("nocup", ["Không có lá Cốc nào trong trải tình cảm: cảm xúc đang bị lý trí hoặc hoàn cảnh lấn át."]));
  }
  if (tarot.length) {
    const ratio = majors / tarot.length;
    if (ratio >= 0.4) out.push(w.pick("major", [
      `Ẩn chính chiếm ${majors}/${tarot.length} lá: nhiều thứ do hoàn cảnh lớn quyết định, không chỉ do công sức — đây là giai đoạn mang tính bước ngoặt.`,
      `${majors} trên ${tarot.length} lá là Ẩn chính — ${n.vat} đang chịu tác động của những thay đổi lớn hơn việc hằng ngày.`,
    ]));
    else if (tarot.length >= 6 && ratio <= 0.15) out.push(w.pick("minor", [
      `Gần như toàn Ẩn phụ (${majors} Ẩn chính): mọi thứ nằm trong tầm tay xử lý hằng ngày, không có biến cố định mệnh.`,
      `Chỉ ${majors} lá Ẩn chính: ${n.ket} phụ thuộc chủ yếu vào cách làm của chính mình.`,
    ]));
  }
  if (comp.courts >= 3) out.push(w.pick("court", [
    `${comp.courts} lá hoàng gia (người): có nhiều người xen vào ${n.hoi} — ai giúp, ai cản cần phân biệt rõ.`,
    `Nhiều lá người (${comp.courts} lá hoàng gia): kết quả gắn với người khác nhiều hơn là với may rủi.`,
  ]));
  const repRanks = Object.entries(comp.ranks).filter(([, c]) => c >= 2).map(([r, c]) => [Number(r), c])
    .sort((x, y) => y[1] - x[1] || (x[0] >= 11) - (y[0] >= 11)).slice(0, 2);
  for (const [r, cnt] of repRanks) {
    const label = r >= 11 || r === 1 ? `lá ${RANK_NAME[r]}` : `lá số ${r}`;
    out.push(w.pick(`rank${r}`, [
      `${cnt} ${label}: chủ đề “${RANK_THEME[r]}” lặp lại, không phải ngẫu nhiên.`,
      `${cap(label)} xuất hiện ${cnt} lần — nhịp “${RANK_THEME[r]}” là nền của trải này.`,
    ]));
  }
  if (comp.rev >= 2) out.push(w.pick("rev", [`${comp.rev} lá ngược: năng lượng bị chặn hoặc đi chậm hơn bề ngoài.`]));
  const block = [...tarot, ...len].filter((x) => x.card.diem_tien <= -1);
  const gold = [...tarot, ...len].filter((x) => x.card.diem_tien >= 1.5);
  const names = (xs) => [...new Set(xs.map((x) => x.card.vi))].join(", ");
  if (topic === "tien" || session.money) {
    if (gold.length) out.push(w.pick("gold", [`Lá tiền mạnh: ${names(gold)}.`, `Những lá kéo tiền lên: ${names(gold)}.`]));
    if (block.length) out.push(w.pick("block", [`Lá cản: ${names(block)}.`, `Những lá ghìm tiền xuống: ${names(block)}.`]));
  } else if (block.length) out.push(w.pick("block2", [`Lá nặng nhất trong trải: ${names(block)}.`]));
  const people = len.filter((x) => ["Man", "Woman"].includes(x.card.en));
  if (people.length) out.push(w.pick("people", [`Lá người (${names(people)}) xuất hiện: có một nhân vật cụ thể đứng trong câu chuyện, xem lá kề bên để biết vai trò.`]));
  return out.filter(Boolean);
}

// ---------- Từng tầng ----------
function tarotLine(w, t, x, topic, idx, ti, mode = "", question = "") {
  const c = x.card;
  const name = `${c.vi}${x.cell.rev ? " (ngược)" : ""}`;
  const key = posKey(x.pos);
  const posMean = strip(key ? c.vi_tri[key] : c.tu_khoa);
  const posl = low(x.pos);
  const intro = [
    `${x.pos} — ${name}: ${low(posMean)}.`,
    `Ở vị trí ${posl}, ${name} cho thấy ${low(posMean)}.`,
    `${name} đứng ở ${posl}: ${low(posMean)}.`,
  ];
  const body = [];
  // Lá ra lại luôn được nói ra (gắn sau câu chính), không phải một biến thể có thể bị bỏ
  const repNote = !x.cell.repeatOf ? "" : (x.cell.repeatOf.doclap
    ? `Lá này đã ra ở tầng ${x.cell.repeatOf.tier} và giờ ra lại dù bộ bài xáo lại đủ lá — “${c.tu_khoa.split(",")[0]}” là chủ đề lặp lại, không phải ngẫu nhiên.`
    : `Lá này lặp lại từ tầng ${x.cell.repeatOf.tier} — nhấn mạnh “${c.tu_khoa.split(",")[0]}”, không phải xác nhận độc lập.`);
  const tail = (line) => (repNote ? `${line} ${repNote}` : line);
  const tri = tarotMeaning(c, x.cell.rev, topic, x.pos);
  // Có/Không đọc theo ngữ cảnh câu hỏi (cả lá ngược), không gán một câu trả lời cố định cho lá
  const yn = topic === "cokhong" || mode === "yesno" ? cardYesNo(c, x.cell.rev, question) : null;
  if (x.cell.rev) body.push(tri ? `Ngược: ${low(tri)}` : `Ngược: ${low(c.rui_ro)}`);
  else if (topic === "tinh" && c.tri) body.push(tri, c.tri.loi_khuyen_tinh ? `${tri} ${c.tri.loi_khuyen_tinh}` : tri);
  else if (tri) body.push(tri, `${tri} Điều cần để ý: ${low(c.rui_ro)}`);
  else if (topic === "tien") body.push(c.tien, `Về tiền: ${low(c.tien)}`, `Cảnh báo kèm: ${low(c.rui_ro)}`);
  else if (topic === "tinh") body.push(`Trong chuyện tình cảm, lá này mang năng lượng ${c.tu_khoa}.`, `Năng lượng cảm xúc: ${c.tu_khoa}.`);
  else body.push(`Năng lượng chính: ${c.tu_khoa}.`, `Điều cần để ý: ${low(c.rui_ro)}`);
  if (yn) {
    const ynText = `Xét câu Có/Không${x.cell.rev ? " (lá ngược)" : ""}, lá này nghiêng “${yn.tra_loi}”: ${low(yn.ly_do)}`;
    return tail(w.join(`t${ti}-${idx}`, [intro, body.map((b) => `${b} ${ynText}`)]));
  }
  return tail(w.join(`t${ti}-${idx}`, [intro, body]));
}

function flowLine(w, td, topic, ti) {
  const xs = td.tarot.filter((x) => x.card);
  if (xs.length < 2) return "";
  const sc = xs.map((x) => x.score);
  const first = xs[0], last = xs[xs.length - 1];
  const lo = xs[sc.indexOf(Math.min(...sc))], hi = xs[sc.indexOf(Math.max(...sc))];
  const n = NOUN[topic];
  const sh = shape(sc);
  const V = {
    len: [`Dòng chảy đi lên: mở bằng ${first.card.vi}, khép bằng ${last.card.vi} — càng về cuối ${n.vat} càng sáng.`, `Từ ${first.card.vi} tới ${last.card.vi} là một đường dốc lên; khó ở đầu, khá ở cuối.`],
    xuong: [`Dòng chảy đi xuống: đầu thuận với ${first.card.vi} nhưng cuối hụt ở ${last.card.vi} — đừng tiêu trước phần chưa chắc.`, `Mở tốt (${first.card.vi}) mà kết yếu (${last.card.vi}): phần đầu dễ làm mình chủ quan.`],
    trung: [`Có một vũng trũng ở giữa (${lo.card.vi} tại ${low(lo.pos)}): hai đầu ổn, khúc giữa là chỗ dễ gãy.`, `Đáy nằm ở ${low(lo.pos)} với ${lo.card.vi} — vượt được khúc này thì phần sau đỡ hơn.`],
    dinh: [`Đỉnh nằm ở giữa (${hi.card.vi} tại ${low(hi.pos)}): cao điểm đến sớm rồi chùng xuống, nên chốt lời đúng lúc.`, `${hi.card.vi} ở ${low(hi.pos)} là đỉnh của tầng; sau đó lực giảm dần.`],
    ngang: [`Dòng chảy khá phẳng từ ${first.card.vi} đến ${last.card.vi}: không bứt, không gãy.`, `Các vị trí giữ cùng một mặt bằng — nhịp đều, ít bất ngờ.`],
  };
  const parts = [V[sh] || V.ngang];
  // So vị trí kết quả với tín hiệu mức tiền (mẫu 4 vị trí)
  const kq = xs.find((x) => /kết quả/i.test(x.pos)), th = xs.find((x) => /tín hiệu/i.test(x.pos));
  if (kq && th) {
    if (kq.score - th.score >= 1) parts.push([`Kết quả (${kq.card.vi}) tốt hơn tín hiệu mức tiền (${th.card.vi}): việc thành nhưng con số không cao như mong.`]);
    else if (th.score - kq.score >= 1) parts.push([`Tín hiệu mức tiền (${th.card.vi}) mạnh hơn kết quả (${kq.card.vi}): tiền có thể về nhưng việc chưa trọn vẹn.`]);
    else parts.push([`Kết quả và tín hiệu mức tiền cùng một hướng (${kq.card.vi} – ${th.card.vi}).`]);
  }
  return w.join(`flow${ti}`, parts);
}

function tripleLines(w, db, cells, topic, ti) {
  const ok = cells.filter((c) => c.ok).map((c) => lenCard(db, c.card));
  const out = [];
  for (let i = 0; i + 2 < ok.length; i++) {
    const [a, b, c] = ok.slice(i, i + 3);
    const s = (x) => (topic === "tien" ? x.diem_tien : x.diem_chung);
    const verdict = s(c) - s(a) >= 1 ? "chiều tốt lên" : s(a) - s(c) >= 1 ? "chiều xấu đi" : "giữ nguyên nhịp";
    out.push(w.pick(`tri${ti}-${i}`, [
      `${a.vi} – ${b.vi} – ${c.vi}: ${first(a.chu_the)} (${first(b.tinh_chat)}) dẫn tới ${first(c.chu_the)} — ${verdict}.`,
      `Bộ ba ${a.vi}/${b.vi}/${c.vi}: khởi là ${first(a.chu_the)}, qua bước ${first(b.tinh_chat)}, kết ở ${first(c.chu_the)} — ${verdict}.`,
    ]));
  }
  return out.filter(Boolean);
}

function chainLine(w, db, cells, td, topic, ti) {
  const ok = cells.filter((c) => c.ok).map((c) => lenCard(db, c.card));
  if (!ok.length) return "";
  const s = (x) => (topic === "tien" ? x.diem_tien : x.diem_chung);
  const pos = ok.filter((x) => s(x) >= 0.5).length, neg = ok.filter((x) => s(x) <= -0.5).length;
  const tone = pos > neg ? "nghiêng thuận" : neg > pos ? "nghiêng cản" : "giằng co";
  const known = td.pairs.filter((p) => p.known);
  const last = ok[ok.length - 1];
  const lastTri = lenMeaning(last, topic);
  const nguoi = ok.filter((x) => x.tri?.nguoi && (x.en === "Man" || x.en === "Woman" || x.en === "Child"));
  return w.join(`chain${ti}`, [
    [`${td.chain} Tổng thể ${tone} (${pos} lá thuận, ${neg} lá cản).`, `Chuỗi Lenormand ${tone}: ${pos} thuận, ${neg} cản. ${td.chain}`],
    known.length ? [`Cặp đáng chú ý nhất: ${known[0].a.vi} + ${known[0].b.vi} — ${low(known[0].text)}`] : [],
    lastTri ? [`Lá khép chuỗi là ${last.vi}: ${low(lastTri)}`, `Chuỗi kết ở ${last.vi} — ${low(lastTri)}`] : [],
    nguoi.length ? [`${nguoi[0].vi} trong chuỗi chỉ người: ${low(nguoi[0].tri.nguoi)}`] : [],
  ]);
}

function chotLine(w, td, topic, mode, ti) {
  const n = NOUN[topic];
  const best = [...td.scored].sort((a, b) => b.s - a.s)[0];
  const worst = [...td.scored].sort((a, b) => a.s - b.s)[0];
  if (td.diem == null) return "Chưa đủ lá để chốt.";
  const b = band(td.diem);
  const yn = mode === "yesno" ? `${yesNo(td.diem)} — ` : "";
  const V = td.diem >= 6.5
    ? [`${yn}${cap(td.ten)} là tầng sáng (${td.diem}/10): ${n.vat} có lực đẩy thật, chủ yếu nhờ ${best.card.vi}.`, `${yn}Chốt: thuận — ${best.card.vi} kéo cả tầng lên, ${worst.s < 0 ? `chỉ cần canh ${worst.card.vi}` : "không có lá cản đáng kể"} (${td.diem}/10).`]
    : td.diem >= 5
    ? [`${yn}Chốt: ${b.text} (${td.diem}/10) — được hay không nằm ở cách xử lý ${worst.card.vi}.`, `${yn}${cap(td.ten)} ở mức giữa (${td.diem}/10): có ${best.card.vi} đỡ nhưng ${worst.card.vi} ghìm lại.`]
    : [`${yn}Chốt: ${b.text} (${td.diem}/10). ${worst.card.vi} là lực kéo xuống chính; tầng này phải phòng thủ.`, `${yn}${cap(td.ten)} yếu (${td.diem}/10): ${worst.card.vi} lấn át, ${best.s > 0 ? `${best.card.vi} chỉ đỡ được một phần` : "không có lá nào đỡ"}.`];
  return w.pick(`chot${ti}`, V) || `${yn}${td.ten}: ${td.diem}/10.`;
}

function nghenLine(w, td, ti) {
  const worst = [...td.scored].sort((a, b) => a.s - b.s)[0];
  if (!worst) return "—";
  return w.pick(`ng${ti}`, worst.s < 0.25
    ? [`${worst.card.vi}: ${low(worst.card.rui_ro)}`, `Nút thắt là ${worst.card.vi} — ${low(worst.card.rui_ro)}`]
    : [`Không có lá cản rõ; điểm mỏng nhất là ${worst.card.vi} (${low(strip(worst.card.rui_ro))}).`]) || worst.card.vi;
}

function khuyenLine(w, td, ti) {
  const sorted = [...td.scored].sort((a, b) => a.s - b.s);
  const worst = sorted[0], best = sorted[sorted.length - 1];
  const parts = [];
  if (worst && worst.s < 0.25) parts.push([worst.card.loi_khuyen, `Với ${worst.card.vi}: ${low(worst.card.loi_khuyen)}`]);
  if (best && best !== worst && best.s > 0) parts.push([`Tận dụng ${best.card.vi}: ${low(best.card.loi_khuyen)}`, best.card.loi_khuyen]);
  if (!parts.length && best) parts.push([best.card.loi_khuyen]);
  return w.join(`kh${ti}`, parts);
}

// ---------- Toàn bộ ----------
export function analyze(db, session, settings = {}, roundIndex = 0) {
  const round = session.rounds[roundIndex];
  if (!round) return null;
  const topic = mainTopic(session.cauHoi) === "chung" && session.money ? "tien" : mainTopic(session.cauHoi);
  const n = NOUN[topic];
  const who = settings.xungHo || "Queen Linh";
  const mode = spreadById(session.spreadId).mode;
  const w = new Writer(session.hash + ":" + roundIndex);
  const count = Math.max(round.tarot.length, round.lenormand.length);
  const tds = [];
  for (let ti = 0; ti < count; ti++) tds.push(readTier(db, session, ti, round.tarot[ti] || [], round.lenormand[ti] || [], { extra: roundIndex > 0 }));

  const comp = composition(db, { tarot: round.tarot.flat(), lenormand: round.lenormand.flat() });
  const chu_de_troi = themeLines(w, db, comp, topic, session);

  const tang = tds.map((td, ti) => {
    const T = avg(td.scored.filter((x) => x.deck === "tarot").map((x) => x.s));
    const L = avg(td.scored.filter((x) => x.deck === "lenormand").map((x) => x.s));
    const hasT = td.scored.some((x) => x.deck === "tarot"), hasL = td.scored.some((x) => x.deck === "lenormand");
    const lech = hasT && hasL && Math.abs(T - L) >= 1.2
      ? w.pick(`lech${ti}`, T > L
        ? [`Tarot (${round1(T)}) sáng hơn Lenormand (${round1(L)}): bề mặt và tinh thần ổn, nhưng thực tế cụ thể có vướng — tin phần Lenormand ${topic === "tien" ? "khi tính tiền" : "khi xét thực tế"}.`, `Hai bộ lệch nhau: Tarot thuận còn Lenormand cản — ý định tốt, chi tiết thực tế chưa theo kịp.`]
        : [`Lenormand (${round1(L)}) thuận hơn Tarot (${round1(T)}): sự việc bên ngoài có lối, nhưng tâm thế bên trong đang chùn.`, `Hai bộ lệch nhau: thực tế mở hơn cảm giác — nỗi lo lớn hơn sự thật.`])
      : null;
    return {
      ten: td.ten,
      diem: td.diem,
      tra_loi: mode === "yesno" && td.diem != null ? yesNo(td.diem) : null,
      tarot_doc: td.tarot.map((x, i) => (x.card ? tarotLine(w, td, x, topic, i, ti, mode, session.cauHoi) : x.text)).filter(Boolean),
      dong_chay: flowLine(w, td, topic, ti),
      lenormand_cap: td.pairs.map((p, i) => w.pick(`cap${ti}-${i}`, [
        `${p.a.vi} + ${p.b.vi}: ${p.text}`,
        `Cặp ${p.a.vi} → ${p.b.vi} (${p.known ? "cặp quen" : "ghép theo luật"}): ${low(p.text)}`,
      ])).filter(Boolean),
      lenormand_bo_ba: tripleLines(w, db, round.lenormand[ti] || [], topic, ti),
      lenormand_chuoi: chainLine(w, db, round.lenormand[ti] || [], td, topic, ti),
      lech,
      _lech: lech ? { T: round1(T), L: round1(L) } : null,
      chot: chotLine(w, td, topic, mode, ti),
      diem_nghen: nghenLine(w, td, ti),
      loi_khuyen: khuyenLine(w, td, ti),
      lap: td.repeats.map((r) => r.text),
      o_trong: td.empty.map((e) => `${e.deck === "tarot" ? "Tarot" : "Lenormand"} ô ${e.i + 1}: số ${e.cell.raw} ngoài khoảng, chờ số thay.`),
      _td: td,
    };
  });

  // Nối tầng
  const noi_tang = [];
  const scored = tang.filter((t) => t.diem != null);
  if (scored.length >= 2) {
    const sorted = [...scored].sort((a, b) => b.diem - a.diem);
    noi_tang.push(w.pick("noi-best", [
      `Tầng mạnh nhất là ${sorted[0].ten} (${sorted[0].diem}/10), yếu nhất là ${sorted[sorted.length - 1].ten} (${sorted[sorted.length - 1].diem}/10).`,
      `${sorted[0].ten} dẫn đầu với ${sorted[0].diem}/10; ${sorted[sorted.length - 1].ten} đáy với ${sorted[sorted.length - 1].diem}/10.`,
    ]));
    let jump = null;
    for (let i = 1; i < scored.length; i++) {
      const d = scored[i].diem - scored[i - 1].diem;
      if (!jump || Math.abs(d) > Math.abs(jump.d)) jump = { d, from: scored[i - 1], to: scored[i] };
    }
    if (jump && Math.abs(jump.d) >= 1.5) noi_tang.push(w.pick("noi-jump", jump.d > 0
      ? [`Bước nhảy lớn nhất: từ ${jump.from.ten} sang ${jump.to.ten} tăng ${jump.d} điểm — đây là điểm chuyển mình.`]
      : [`Cú rơi lớn nhất: từ ${jump.from.ten} sang ${jump.to.ten} giảm ${-jump.d} điểm — chuẩn bị trước cho khúc này.`]));
    const d = scored[scored.length - 1].diem - scored[0].diem;
    noi_tang.push(w.pick("noi-trend", d >= 1
      ? [`Nhìn cả trải, ${n.vat} đi lên: tầng cuối hơn tầng đầu ${d} điểm.`, `Xu hướng chung tốt dần — đoạn sau gánh cho đoạn đầu.`]
      : d <= -1
      ? [`Nhìn cả trải, ${n.vat} đi xuống về cuối (${d} điểm) — phần đầu là lúc phải tích luỹ.`, `Xu hướng chung giảm dần; đừng lấy đà của tầng đầu để hứa cho tầng cuối.`]
      : [`Cả trải đi ngang: không có tầng nào bứt hẳn — ổn định nhưng không đột phá.`, `Các tầng sát điểm nhau; ${n.ket} giữ mặt bằng hơn là bùng nổ.`]));
    // sợi chỉ xuyên tầng: cùng lá ở nhiều tầng
    const where = new Map();
    tang.forEach((t, ti) => t._td.scored.forEach((x) => {
      const k = `${x.deck}:${x.cell.card}`;
      if (!where.has(k)) where.set(k, { x, tiers: new Set() });
      where.get(k).tiers.add(ti + 1);
    }));
    const fresh = drawsOf(session)[round.draw ?? 0]?.kieu === 2;
    const unit = tierWord(session);
    for (const { x, tiers } of where.values()) {
      if (tiers.size < 2) continue;
      const kw = (x.card.tu_khoa || "").split(",")[0];
      noi_tang.push(w.pick(`thread-${x.deck}-${x.cell.card}`, fresh
        ? [`${x.card.vi} ra ở cả ${[...tiers].map((t) => repeatTierName(session, t)).join(" và ")} dù mỗi ${unit} xáo lại đủ bộ: “${kw}” là chủ đề lặp lại xuyên các ${unit} — việc này chưa xong, nó còn quay lại.`]
        : [`${x.card.vi} có mặt ở tầng ${[...tiers].join(" và ")}: sợi chỉ xuyên suốt là “${kw}” — nhấn mạnh, không phải bằng chứng thêm.`]));
    }
    // dịch chuyển chất
    const dom = tang.map((t) => {
      const c = composition(db, { tarot: (round.tarot[t._td.ti] || []), lenormand: [] });
      const e = Object.entries(c.suits).sort((a, b) => b[1] - a[1])[0];
      return e[1] >= 2 ? e[0] : null;
    });
    if (dom[0] && dom[dom.length - 1] && dom[0] !== dom[dom.length - 1]) {
      noi_tang.push(w.pick("shift", [`Năng lượng dịch từ ${SUIT_THEME[dom[0]][0].split(" (")[0]} ở tầng đầu sang ${SUIT_THEME[dom[dom.length - 1]][0].split(" (")[0]} ở tầng cuối: ${SUIT_THEME[dom[dom.length - 1]][1]}.`]));
    }
  }

  // Mâu thuẫn
  const mau_thuan = tang.filter((t) => t._lech).map((t, i) => w.pick(`mt-lech${i}`, [
    `${t.ten}: Tarot và Lenormand trái chiều (${t._lech.T} so với ${t._lech.L}) — đừng chỉ nghe một bộ.`,
    `${t.ten} có độ vênh giữa hai bộ bài (Tarot ${t._lech.T}, Lenormand ${t._lech.L}).`,
  ])).filter(Boolean);
  const scamCards = comp.tarot.concat(comp.len).filter((x) => SCAM[x.card.nhom ? "tarot" : "lenormand"].includes(x.card.en));
  tang.forEach((t, ti) => {
    const bad = t._td.scored.filter((x) => SCAM[x.deck].includes(x.card.en));
    if (t.diem >= 6 && bad.length) mau_thuan.push(w.pick(`mt-scam${ti}`, [
      `${t.ten} điểm khá (${t.diem}/10) nhưng có ${bad.map((x) => x.card.vi).join(", ")}: bề ngoài thuận, bên trong có chỗ không thật — kiểm tra người và giấy tờ.`,
    ]));
  });
  if (mode === "yesno" && scored.length >= 2) {
    const yes = scored.filter((t) => t.diem >= 5), no = scored.filter((t) => t.diem < 5);
    if (yes.length && no.length) mau_thuan.push(w.pick("mt-yn", [`Các tầng không cùng câu trả lời: ${yes.map((t) => t.ten).join("; ")} nghiêng Có, còn ${no.map((t) => t.ten).join("; ")} nghiêng Không — kết luận chung phải có điều kiện.`]));
  }
  if (!mau_thuan.length) mau_thuan.push(w.pick("mt-none", ["Không có mâu thuẫn lớn: Tarot và Lenormand nói cùng một hướng ở các tầng.", "Hai bộ bài khá đồng thuận; không thấy tín hiệu trái chiều đáng kể."]));

  // Tiền
  const money = session.money ? moneyTable(db, session, settings) : null;
  let tien = null;
  if (money && money.rows) {
    tien = w.join("tien", [
      [`Quy đổi (mốc ${money.base} tr/tháng): tổng ${money.total} tr cho ${money.rows.length} kỳ, bình quân ${money.perMonth} tr/tháng; mạnh nhất ${money.best.ky} (~${money.best.center} tr), yếu nhất ${money.worst.ky} (~${money.worst.center} tr).`],
      money.target ? [money.targetPct >= 100 ? `So với mục tiêu ${money.target} tr/tháng: đạt khoảng ${money.targetPct} % — có cửa chạm mục tiêu ở ${money.monthsHit}/${money.rows.length} kỳ.` : `So với mục tiêu ${money.target} tr/tháng: mới khoảng ${money.targetPct} % — nói thẳng là chưa tới, ${money.monthsHit}/${money.rows.length} kỳ chạm mục tiêu.`] : [],
      money.prevYear ? [`So với năm trước (${money.prevYear} tr): ${money.vsPrevPct >= 0 ? "+" : ""}${money.vsPrevPct} %.`] : [],
      ["Đây là quy đổi huyền học, không phải dự báo tài chính."],
    ]);
  }

  // Tổng kết + lời khuyên
  const mean = scored.length ? round1(avg(scored.map((t) => t.diem))) : null;
  const bm = mean == null ? null : band(mean);
  const tong_ket = mean == null ? `${who}, chưa có lá hợp lệ để kết luận.` : w.join("tk", [
    [`${who}, nói thẳng: ${n.ket} trung bình ${mean}/10 — ${bm.text}.`, `${who}, kết luận không vòng vo: ${mean}/10, ${bm.text}.`],
    mode === "yesno" ? [`Câu trả lời theo từng tầng: ${scored.map((t) => `${t.ten} → ${t.tra_loi}`).join("; ")}.`] : [],
    roundIndex > 0 ? ["Đây là lượt rút thêm trên cùng bộ đã khoá — chỉ làm rõ, không lật lại kết luận của trải chính."] : [],
    money && money.target && money.targetPct < 100 ? [`Muốn chạm ${money.target} tr/tháng thì cần một nguồn thu thêm ngoài nhịp hiện tại — bài không cho thấy nó tự đến.`] : [],
    money && money.target && money.targetPct >= 100 ? [`Mục tiêu ${money.target} tr/tháng nằm trong tầm, với điều kiện giữ nhịp ở các tầng yếu.`] : [],
    scamCards.length ? [`Điểm phải canh nhất là ${[...new Set(scamCards.map((x) => x.card.vi))].join(", ")} — dấu hiệu gian dối hoặc hao hụt.`] : [],
  ]);

  const loi_khuyen = [];
  const canh_bao = [];
  if (scamCards.length) {
    canh_bao.push(w.pick("cb-scam", topic === "tinh"
      ? ["Có lá báo không thật/che giấu: đừng tin lời hứa khi hành động chưa khớp lời nói."]
      : ["Cảnh giác lừa đảo: không chuyển tiền, đặt cọc hay “nạp để rút” cho lời mời lãi cao; gọi lại số chính thức để xác minh."]));
  }
  const heavy = comp.tarot.concat(comp.len).filter((x) => ["The Tower", "Ten of Swords", "Five of Pentacles", "Coffin", "Scythe"].includes(x.card.en));
  if (heavy.length) canh_bao.push(w.pick("cb-heavy", [`Có lá biến cố (${[...new Set(heavy.map((x) => x.card.vi))].join(", ")}): giữ quỹ dự phòng, không dồn hết vốn hay cảm xúc vào một chỗ.`]));
  if (topic === "tien" && mean != null) {
    loi_khuyen.push(w.pick("lk-tien", mean >= 6.5
      ? ["Giai đoạn thuận: chủ động chốt việc, tăng giá hoặc doanh số, nhưng trích ngay 20–30 % phần dư để tích luỹ."]
      : mean >= 5
      ? ["Không có cú hích lớn: tiền tăng nhờ làm đều tay; theo dõi thu chi hằng tuần."]
      : ["Ưu tiên phòng thủ: giữ quỹ dự phòng 3 tháng chi tiêu, hoãn khoản chi lớn không bắt buộc."]));
  }
  if (topic === "tinh" && mean != null) loi_khuyen.push(w.pick("lk-tinh", [mean >= 6 ? "Chủ động nói rõ điều mình muốn; thời điểm đang mở." : "Lùi một bước, quan sát hành động thay vì lời nói trước khi đầu tư thêm cảm xúc."]));
  if (scored.length) {
    const worstT = [...scored].sort((a, b) => a.diem - b.diem)[0];
    const bestT = [...scored].sort((a, b) => b.diem - a.diem)[0];
    if (worstT.loi_khuyen) loi_khuyen.push(w.pick("lk-worst", [`Cho ${worstT.ten}: ${low(splitSentences(worstT.loi_khuyen)[0] || "")}`]));
    if (bestT !== worstT) loi_khuyen.push(w.pick("lk-best", [`Dồn lực vào ${bestT.ten} — tầng có lực đẩy tốt nhất.`]));
  }

  return {
    nguon: "luat",
    chu_de: topic,
    tong_quan: w.pick("tq", [
      `Câu hỏi “${session.cauHoi}” được đọc trên ${comp.tarot.length} lá Tarot và ${comp.len.length} lá Lenormand, chia ${tang.length} tầng.`,
      `Trải ${spreadById(session.spreadId).ten.toLowerCase()} cho câu hỏi “${session.cauHoi}”: ${comp.tarot.length} Tarot + ${comp.len.length} Lenormand.`,
    ]),
    chu_de_troi,
    tang: tang.map(({ _td, _lech, ...t }) => t),
    noi_tang: noi_tang.filter(Boolean),
    mau_thuan: mau_thuan.filter(Boolean),
    tien,
    tong_ket,
    loi_khuyen: loi_khuyen.filter(Boolean),
    canh_bao: canh_bao.filter(Boolean),
    diem_tb: mean,
    _money: money,
    _cards: tds.flatMap((td) => td.scored.map((x) => ({
      deck: x.deck, vi: x.card.vi, en: x.card.en, rev: !!x.cell?.rev, tang: td.ten,
      nghia: x.deck === "tarot" ? tarotMeaning(x.card, !!x.cell?.rev, topic) : lenMeaning(x.card, topic),
      khuyen: x.cell?.rev ? x.card.tri?.nguoc?.loi_khuyen || x.card.loi_khuyen
        : topic === "tinh" && x.card.tri?.loi_khuyen_tinh ? x.card.tri.loi_khuyen_tinh : x.card.loi_khuyen || null,
    }))),
  };
}

// Tất cả câu trong một bản giải (để kiểm không lặp)
export function allSentences(r) {
  const texts = [r.tong_quan, ...r.chu_de_troi, r.tien, r.tong_ket, ...r.loi_khuyen, ...r.canh_bao, ...r.noi_tang, ...r.mau_thuan];
  for (const t of r.tang) texts.push(...t.tarot_doc, t.dong_chay, ...t.lenormand_cap, ...t.lenormand_bo_ba, t.lenormand_chuoi, t.lech, t.chot, t.diem_nghen, t.loi_khuyen);
  return texts.filter(Boolean).flatMap(splitSentences);
}

// Hỏi tiếp khi không có khoá: trả lời theo tầng/chủ đề được nhắc trong câu hỏi
export function ruleFollowUp(reading, question) {
  const q = String(question || "").toLowerCase();
  const out = [];
  const hit = reading.tang.filter((t, i) => {
    const name = t.ten.toLowerCase();
    const num = name.match(/tháng (\d+)/);
    return q.includes(name) || (num && new RegExp(`tháng\\s*0?${num[1]}(?!\\d)`).test(q)) || new RegExp(`tầng\\s*${i + 1}(?!\\d)`).test(q);
  });
  for (const t of hit) {
    out.push(`**${t.ten}** — ${t.diem ?? "?"}/10. ${t.chot}`);
    if (t.dong_chay) out.push(t.dong_chay);
    out.push(`Điểm nghẽn: ${t.diem_nghen}`);
    out.push(`Lời khuyên: ${t.loi_khuyen}`);
  }
  const fold = (x) => String(x || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");
  const qf = fold(q);
  const seen = new Set();
  for (const c of reading._cards || []) {
    const ten = fold(c.vi);
    if (seen.has(c.deck + c.vi) || !c.nghia || ten.length < 3) continue;
    if (!qf.includes(ten) && !(c.en && q.split(/[^a-z]+/).includes(c.en.toLowerCase()))) continue;
    seen.add(c.deck + c.vi);
    out.push(`**${c.vi}${c.rev ? " (ngược)" : ""}** — ${c.tang}: ${c.nghia}${c.khuyen ? ` Lời khuyên: ${c.khuyen}` : ""}`);
  }
  if (/tiền|bao nhiêu|thu nhập|triệu/.test(q) && reading.tien) out.push(reading.tien);
  if (/rủi ro|lừa|cẩn thận|cảnh báo|nguy/.test(q)) out.push(...(reading.canh_bao.length ? reading.canh_bao : ["Không có lá cảnh báo gian dối rõ trong trải này."]), ...reading.mau_thuan);
  if (/nên làm|lời khuyên|làm gì|cách nào/.test(q)) out.push(...reading.loi_khuyen);
  if (/mâu thuẫn|ngược|trái/.test(q)) out.push(...reading.mau_thuan);
  if (!out.length) {
    out.push(reading.tong_ket, ...reading.noi_tang.slice(0, 2));
    out.push("Muốn hỏi sâu từng tầng, hãy nhắc tên tầng (vd “tháng 12” hoặc “tầng 2”); muốn AI trả lời tự do, thêm khoá ở Cài đặt hoặc bấm “Chép prompt cho ChatGPT”.");
  }
  return [...new Set(out.filter(Boolean))].join("\n\n");
}
