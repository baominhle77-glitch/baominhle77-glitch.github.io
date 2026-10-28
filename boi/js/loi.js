// Ô "Lời gửi khách": đoạn văn xuôi gửi người hỏi, tách khỏi bản giải đầy đủ.
// Cổng kiểm: 120–220 chữ, 2–4 đoạn, không tên lá, không gạch đầu dòng / đánh số / tiêu đề / in đậm, có dấu.
// AI viết trước; trượt cổng → viết lại đúng 1 lần; vẫn trượt → bản theo luật viết xuôi (cũng không tên lá).
import { tyLeDau, NGUONG_DAU } from "./ai.js";
import { tarotCard, lenCard, SCAM, cardScore, lenPairs } from "./reading.js";
import { spreadById, posLabel, posKey } from "./spreads.js";
import { mainTopic } from "./topic.js";
import { tarotMeaning, lenMeaning, capMeaning } from "./data.js";

export const LGK_MIN = 120;
export const LGK_MAX = 220;
export const demChu = (t) => (String(t || "").trim().match(/\S+/g) || []).length;
export const doanVan = (t) => String(t || "").split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);

// ---------- Cổng kiểm ----------
const namesCache = new WeakMap();
const escRe = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function nameRes(db) {
  if (!namesCache.has(db)) {
    const all = [...(db?.tarot?.la || []), ...(db?.lenormand?.la || [])];
    const list = [];
    for (const c of all) for (const nm of [c.vi, c.en]) {
      if (nm) list.push({ nm, re: new RegExp(`(?<![\\p{L}\\p{N}])${escRe(nm)}(?![\\p{L}\\p{N}])`, "u") });
    }
    namesCache.set(db, list);
  }
  return namesCache.get(db);
}
// Tên lá đúng như trong dữ liệu (viết hoa từng chữ, vd "Mặt Trăng", "Con Rắn", "The Moon") — chữ thường trong câu ("ngôi nhà") không tính
export const tenLaTrong = (text, db) => [...new Set(nameRes(db).filter(({ re }) => re.test(text)).map(({ nm }) => nm))];

// Chữ không được xuất hiện trong lời gửi khách (lệnh Chủ tịch 28/10): không nhắc web, AI, công cụ, máy.
// "AI" xét đúng chữ hoa để không bắt nhầm "ai" (đại từ tiếng Việt).
const B = (x) => `(?<![\\p{L}\\p{N}])(?:${x})(?![\\p{L}\\p{N}])`;
export const CHU_CAM = [
  ["web", new RegExp(B("web|website|trang web|webapp"), "iu")],
  ["app/ứng dụng", new RegExp(B("app|ứng dụng|phần mềm"), "iu")],
  ["AI", new RegExp(B("AI|A\\.I\\.?|trí tuệ nhân tạo|chatbot|bot|GPT|Gemini"), "u")],
  ["hệ thống", new RegExp(B("hệ thống"), "iu")],
  ["máy", new RegExp(B("máy|máy tính|máy móc"), "iu")],
  ["công cụ", new RegExp(B("công cụ"), "iu")],
  ["ngẫu nhiên", new RegExp(B("ngẫu nhiên"), "iu")],
  ["thuật toán", new RegExp(B("thuật toán|algorithm"), "iu")],
  ["seed", new RegExp(B("seed"), "iu")],
  ["mã khoá", new RegExp(B("mã khoá|mã khóa|SHA"), "iu")],
  // tên công cụ
  ["tên công cụ", new RegExp(B("ChatGPT|OpenAI|Claude|Anthropic|Copilot|Google|Apps Script|Playwright|Python|LLM"), "iu")],
  // không khẳng định là người, không chối là máy (lệnh Chủ tịch 28/10)
  ["người thật", new RegExp(B("người thật"), "iu")],
  ["bốc tay", new RegExp(B("bốc tay|bốc bằng tay|xào bằng tay"), "iu")],
  ["tự tay", new RegExp(B("tự tay"), "iu")],
  ["không phải AI", new RegExp(B("không phải (?:là )?(?:AI|A\\.I\\.?|trí tuệ nhân tạo|bot)"), "iu")],
  ["không phải máy", new RegExp(B("không phải (?:là )?máy"), "iu")],
];
export const chuCamTrong = (text) => CHU_CAM.filter(([, re]) => re.test(text)).map(([ten]) => ten);

// Tên vị trí / tầng / ô của trải bài (vd "Hao tài", "Khía cạnh khác", "Tháng 11/2026", "Ô 2") không được xuất hiện.
// Nhãn chung trùng chữ thường ngày ("Kết quả", "Diễn biến"…) chỉ tính khi dùng như nhãn: theo sau ":" hoặc nằm trong ngoặc kép.
const VI_TRI_CHUNG = new Set(["Kết quả", "Kết luận", "Diễn biến", "Hiện trạng", "Tổng quan", "Xu hướng", "Thông điệp", "Câu hỏi", "Hiệu quả", "Tiến trình", "Gốc", "Điểm sáng"]);
export function tenViTriCua(session) {
  const out = new Set();
  for (const t of session?.tiers || []) {
    if (t.ten) out.add(String(t.ten).trim());
    for (const p of t.pos || []) if (p) out.add(String(p).trim());
  }
  // chữ có sẵn trong chính câu khách hỏi (vd "4–6 tuần tới") thì nhắc lại được
  const q = String(session?.cauHoi || "");
  return [...out].filter((nm) => nm && !q.includes(nm));
}
export function viTriTrong(text, names) {
  const hit = [];
  for (const nm of names) {
    const e = escRe(nm);
    const re = VI_TRI_CHUNG.has(nm)
      ? new RegExp(`(?:[“"'‘]${e}[”"'’]|(?<![\\p{L}\\p{N}])${e}[ \\t]*:)`, "u")
      : new RegExp(`(?<![\\p{L}\\p{N}])${e}(?![\\p{L}\\p{N}])`, "u");
    if (re.test(text)) hit.push(nm);
  }
  if (/(?<![\p{L}])(?:Ô|ô|Tầng|tầng) \d+(?![\p{N}])/u.test(text)) hit.push("tên tầng/ô");
  return hit;
}

// opts.tenKhach: tên khách của đúng lượt này ("" = gọi "bạn"); opts.xungHo: tên xưng hô đã lưu trong Cài đặt
// (dùng cho bản giải chi tiết) — không được xuất hiện trong lời gửi khách nếu khác tenKhach; opts.session: để lấy tên vị trí.
export function kiemLoiGuiKhach(text, db, opts = {}) {
  const t = String(text || "").trim();
  if (!t) return { ok: false, loi: ["trống"] };
  const loi = [];
  const n = demChu(t);
  if (n < LGK_MIN || n > LGK_MAX) loi.push(`dài ${n} chữ (cần ${LGK_MIN}–${LGK_MAX})`);
  const p = doanVan(t).length;
  if (p < 2 || p > 4) loi.push(`${p} đoạn (cần 2–4)`);
  if (/^[ \t]*(?:[-–—•*+●▪◦·>]|\d+[ \t]*[.)/:]|[a-zA-Z][.)])[ \t]*/m.test(t)) loi.push("có ký tự đầu dòng hoặc đánh số");
  if (/^[ \t]*#{1,6}[ \t]/m.test(t) || /^[^\n.!?]{1,60}:[ \t]*$/m.test(t)) loi.push("có tiêu đề");
  if (/\*\*|__|<\/?(?:b|strong|h\d)\b/i.test(t)) loi.push("có in đậm");
  const ten = tenLaTrong(t, db);
  if (ten.length) loi.push(`có tên lá: ${ten.join(", ")}`);
  const cam = chuCamTrong(t);
  if (cam.length) loi.push(`có chữ cấm: ${cam.join(", ")}`);
  if (tyLeDau(t) < NGUONG_DAU) loi.push("mất dấu");
  const tenKhach = String(opts.tenKhach || "").trim();
  const xh = String(opts.xungHo || "").trim();
  if (xh && xh.toLowerCase() !== tenKhach.toLowerCase() && new RegExp(`(?<![\\p{L}\\p{N}])${escRe(xh)}(?![\\p{L}\\p{N}])`, "iu").test(t)) loi.push(`gọi sai tên: ${xh}`);
  const vt = viTriTrong(t, tenViTriCua(opts.session));
  if (vt.length) loi.push(`có tên vị trí/tầng: ${vt.join(", ")}`);
  // Luật "chung chung" (lệnh 28/10): phải đọc ra thông điệp của chính trải này
  if (opts.session && db && opts.session.rounds?.[0]) {
    const y = yKhop(t, db, opts.session);
    if (y.length < Y_TOI_THIEU) loi.push(`chung chung: chỉ ${y.length} ý khớp nghĩa lá đã trải (cần ≥ ${Y_TOI_THIEU})`);
  }
  const sao = tyLeCauSao(t);
  if (sao > SAO_TOI_DA) loi.push(`chung chung: ${Math.round(sao * 100)} % câu là câu sáo có sẵn`);
  return { ok: !loi.length, loi };
}

// ---------- Nghĩa thật của trải bài ----------
const capFirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const lowFirst = (s) => (/^[A-ZĐÂÊÔƠƯ]{2}/u.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1));
const cauCua = (text) => String(text || "").split(/(?<=[.!?…])\s+/u).map((x) => x.trim()).filter(Boolean);
export const chuDeCua = (session) => { const m = mainTopic(session.cauHoi); return m === "chung" && session.money ? "tien" : m; };

// Câu nghĩa viết lại cho khách: bỏ giọng "lá này/lá bài này nghĩa là", bỏ câu chứa tên lá hay chữ cấm
function lamSach(text, db) {
  return cauCua(text)
    .map((c) => c.replace(/^(?:Đây là )?(?:lá bài|lá này|quân bài)(?: này)?\s+(?:đại diện cho|tượng trưng cho|cho thấy|báo hiệu|là|nói về|của)\s+/iu, "").replace(/^Nó\s+(?:tượng trưng cho|đại diện cho|là)\s+/u, ""))
    .filter((c) => c.length > 12 && !/lá bài|lá này|quân bài/iu.test(c) && !tenLaTrong(c, db).length && !chuCamTrong(c).length)
    .map(capFirst);
}

// Vai của một lá trong mạch: đang diễn ra / gốc rễ (cản hay đẩy) / hướng tới
function vaiCua(tier, i, n) {
  const k = posKey(posLabel(tier, i));
  if (k === "tien_trinh") return "hien";
  if (k === "hieu_qua") return "goc";
  if (k === "ket_qua" || k === "tin_hieu") return "huong";
  return i === 0 ? "hien" : i === n - 1 && n > 1 ? "huong" : "goc";
}

// Toàn bộ nghĩa thật của trải chính, theo tầng và vị trí — dùng cho prompt AI, bản luật và cổng "chung chung"
export function nghiaTrai(db, session, rule = null) {
  const round = session.rounds[0];
  if (!round) return [];
  const topic = chuDeCua(session);
  const n = Math.max(round.tarot.length, round.lenormand.length);
  const out = [];
  for (let ti = 0; ti < n; ti++) {
    const tier = session.tiers[ti] || { ten: `Tầng ${ti + 1}` };
    const tc = round.tarot[ti] || [], lc = round.lenormand[ti] || [];
    const la = [];
    tc.forEach((cell, i) => {
      if (!cell.ok) return;
      const c = tarotCard(db, cell.card);
      const pos = posLabel(tier, i);
      const nghia = tarotMeaning(c, cell.rev, topic, pos) || (cell.rev ? c.rui_ro : topic === "tien" ? c.tien : `${capFirst(c.tu_khoa)}.`);
      const khuyen = cell.rev ? c.tri?.nguoc?.loi_khuyen || c.loi_khuyen : topic === "tinh" && c.tri?.loi_khuyen_tinh ? c.tri.loi_khuyen_tinh : c.loi_khuyen;
      // chi tiết riêng của lá: nghĩa chung (khi khác chủ đề), thời điểm, người liên quan, rủi ro
      const chung = !cell.rev && c.tri?.chung && c.tri.chung !== nghia ? c.tri.chung : null;
      la.push({ deck: "tarot", card: c, rev: !!cell.rev, pos, vai: vaiCua(tier, i, tc.length), nghia, khuyen, diem: cardScore(c, cell.rev, session.money), tu_khoa: c.tu_khoa, chung, thoi_gian: c.tri?.thoi_gian || null, nguoi: c.tri?.nguoi || null, rui_ro: c.rui_ro || null });
    });
    lc.forEach((cell) => {
      if (!cell.ok) return;
      const c = lenCard(db, cell.card);
      la.push({ deck: "lenormand", card: c, rev: false, pos: "", vai: "len", nghia: lenMeaning(c, topic) || capFirst(c.tinh_chat || c.chu_the || ""), khuyen: c.tri?.loi_khuyen_tinh && topic === "tinh" ? c.tri.loi_khuyen_tinh : c.loi_khuyen, diem: session.money ? c.diem_tien : c.diem_chung, tu_khoa: [c.chu_the, c.tinh_chat].filter(Boolean).join(", ") });
    });
    const cap = lenPairs(lc).map(([x, y]) => {
      const a = lenCard(db, x.card), b = lenCard(db, y.card);
      return capMeaning(db, a, b, topic, session.money);
    }).filter(Boolean);
    out.push({ ti, ten: tier.ten, diem: rule?.tang?.[ti]?.diem ?? null, tra_loi: rule?.tang?.[ti]?.tra_loi ?? null, la, cap });
  }
  return out;
}

// Khối chữ đưa cho AI: nghĩa thật từng lá theo vị trí + cặp Lenormand + điểm tầng (không tóm tắt chung)
export function khoiNghiaChoAI(db, session, rule = null) {
  const L = ["=== NGHĨA THẬT CỦA TỪNG LÁ ĐÃ TRẢI (nguồn duy nhất để viết \"loi_gui_khach\") ==="];
  for (const t of nghiaTrai(db, session, rule)) {
    L.push(`-- ${t.ten}${t.diem != null ? ` · ${t.diem}/10` : ""}${t.tra_loi ? ` · ${t.tra_loi}` : ""} --`);
    for (const x of t.la) {
      L.push(`  ${x.deck === "tarot" ? `Tarot [${x.pos}]` : "Lenormand"} ${x.card.vi}${x.rev ? " (ngược)" : ""}: ${x.nghia}${x.khuyen ? ` Lời khuyên của lá: ${x.khuyen}` : ""}`);
    }
    for (const c of t.cap) L.push(`  Cặp Lenormand: ${c}`);
  }
  return L.join("\n");
}

// ---------- Cổng "chung chung" ----------
export const Y_TOI_THIEU = 3;
export const SAO_TOI_DA = 0.4;
const HU = new Set("bạn của và là có này những một các sự cho với đang được sẽ không trong để đã rất như khi thì mà hay hoặc cũng nhưng lại ra vào đến từ bị nên cần mình người việc điều đó đây nó họ cả hơn nhiều ít còn vẫn đều chỉ thể làm muốn thấy về theo trên dưới sau trước lúc thời gian hãy đừng".split(" "));
// cụm chủ đề quá chung (dùng được cho mọi khách) không tính là "ý của lá"
const CUM_CHUNG = new Set(["công việc", "mối quan hệ", "quan hệ", "tình cảm", "cảm xúc", "tài chính", "sức khỏe", "sức khoẻ", "tiền bạc", "cuộc sống", "bản thân", "tương lai", "hiện tại", "thời điểm", "giai đoạn", "tình yêu", "người kia", "đối phương", "kết quả", "kế hoạch"]);
const chuanHoa = (s) => String(s || "").toLowerCase().normalize("NFC").replace(/[^\p{L}\p{N}\s]+/gu, " ").replace(/\s+/g, " ").trim();
// Ý của một lá: các từ khoá + các cụm hai từ có nghĩa trong câu nghĩa (bỏ cụm có hư từ)
function yCuaLa(x) {
  const y = new Set();
  for (const k of String(x.tu_khoa || "").split(/[,;]/)) { const v = chuanHoa(k); if (v.length >= 4 && v.split(" ").some((w) => !HU.has(w))) y.add(v); }
  const w = chuanHoa(`${x.nghia} ${x.khuyen || ""}`).split(" ");
  for (let i = 0; i + 1 < w.length; i++) if (!HU.has(w[i]) && !HU.has(w[i + 1]) && w[i].length > 1 && w[i + 1].length > 1) y.add(`${w[i]} ${w[i + 1]}`);
  return y;
}
const SAO_Y = () => new Set([...Object.values(MO).flat(), ...Object.values(SUIT_Y), ...LOT, ...Object.values(KHUYEN).flatMap((o) => Object.values(o))].flatMap((t) => cauCua(t)).flatMap((c) => { const w = chuanHoa(c).split(" "); const out = []; for (let i = 0; i + 1 < w.length; i++) out.push(`${w[i]} ${w[i + 1]}`); return out; }));
// Các ý (từ khoá/cụm) của lá đã trải có mặt trong lời gửi
export function yKhop(text, db, session) {
  const t = ` ${chuanHoa(text)} `;
  const sao = SAO_Y();
  const hit = new Set();
  for (const tier of nghiaTrai(db, session)) for (const x of tier.la) for (const y of yCuaLa(x)) if (!sao.has(y) && !CUM_CHUNG.has(y) && t.includes(` ${y} `)) hit.add(y);
  return [...hit];
}
// Tỉ lệ câu là câu sáo có sẵn (MO / LOT / KHUYEN / SUIT_Y)
export function tyLeCauSao(text) {
  const bank = [...Object.values(MO).flat(), ...LOT, ...Object.values(KHUYEN).flatMap((o) => Object.values(o)), ...Object.values(SUIT_Y)].flatMap((t) => cauCua(t)).map(chuanHoa).filter((x) => x.length > 20);
  const cau = cauCua(text).map(chuanHoa).filter(Boolean);
  if (!cau.length) return 0;
  return cau.filter((c) => bank.some((b) => c.includes(b) || b.includes(c))).length / cau.length;
}

// ---------- Câu nối (không làm thân bài) ----------
const SUIT_Y = {
  wands: "phần lớn năng lượng nằm ở chuyện phải ra tay: kết quả đến từ việc bạn chủ động làm, không đến từ việc ngồi chờ",
  cups: "cảm xúc và các mối quan hệ đang chi phối nhiều nhất, nên quyết định của bạn dễ bị cảm tính kéo đi",
  swords: "đầu óc bạn đang làm việc nhiều hơn tay chân: suy tính, lo lắng và những cuộc nói chuyện căng là trục chính",
  pentacles: "trục chính là chuyện thực tế: tiền, công việc cụ thể, những gì đo đếm được",
};
const MO = {
  hi: ["Nói gọn trước: hướng đi đang thuận, và phần thuận này có cơ sở chứ không phải may rủi.", "Tin tốt là cửa đang mở, chỉ cần bạn bước đúng nhịp."],
  mid: ["Nói thật lòng: chuyện này được hay không nằm nhiều ở cách bạn làm, không có gì định sẵn.", "Bức tranh không xấu, nhưng cũng chưa đến mức yên tâm buông tay."],
  lo: ["Mình nói thẳng để bạn chuẩn bị: giai đoạn này nhiều lực cản hơn lực đẩy.", "Lúc này chưa phải lúc thuận, và càng cố ép thì càng dễ hụt hơi."],
};
const KHUYEN = {
  tien: { hi: "Tuần này hãy chốt ngay một khoản thu đang treo, và trích ra ít nhất một phần năm để dành trước khi tiêu.", mid: "Trong bảy ngày tới, ghi lại mọi khoản chi rồi cắt một khoản không cần thiết nhất.", lo: "Trước mắt đừng ký, đừng cho vay, đừng đầu tư thêm; ngồi xuống liệt kê các khoản nợ và trả khoản lãi cao nhất trước." },
  tinh: { hi: "Hãy chủ động nói ra một điều bạn vẫn giữ trong lòng, ngắn gọn và thật, trong tuần này.", mid: "Thay vì đoán ý người kia, hãy hỏi thẳng một câu và lắng nghe đến hết trước khi trả lời.", lo: "Cho mình vài ngày không nhắn trước, dành thời gian đó chăm sóc bản thân rồi mới quyết định bước tiếp." },
  viec: { hi: "Viết ra ba việc quan trọng nhất của tuần và làm việc khó nhất vào buổi sáng đầu tiên.", mid: "Chọn một việc đang dở dang và hoàn thành dứt điểm trước khi nhận thêm việc mới.", lo: "Đừng đổi việc hay nhận lời vội; hãy xin một cuộc nói chuyện rõ ràng với người quyết định để biết mình đang đứng ở đâu." },
  suckhoe: { hi: "Giữ nhịp ngủ đều và đi bộ mỗi ngày ít nhất hai mươi phút để giữ đà này.", mid: "Đặt lịch khám định kỳ trong tháng này và mang theo những câu hỏi bạn đang băn khoăn.", lo: "Nếu có dấu hiệu bất thường, hãy đi khám sớm với bác sĩ thay vì tự đoán, và nghỉ ngơi nhiều hơn bình thường." },
  chung: { hi: "Chọn đúng một bước cụ thể và làm nó trong ba ngày tới, khi đà đang thuận.", mid: "Viết ra điều kiện để bạn gật đầu, rồi chỉ tiến khi đủ những điều kiện đó.", lo: "Lùi lại một nhịp, hỏi ý kiến một người bạn tin và chưa quyết định gì lớn trong tuần này." },
};
const LOT = [
  "Điều quan trọng là bạn đã hỏi đúng lúc, khi mọi thứ vẫn còn trong tầm tay mình.",
  "Những gì bạn chuẩn bị bây giờ sẽ quyết định phần lớn kết quả về sau.",
  "Bạn không cần làm mọi thứ cùng lúc, chỉ cần làm đúng việc đầu tiên.",
  "Hãy tin vào cảm nhận của bạn, nhưng kiểm lại bằng những con số và sự việc cụ thể.",
];
const bandKey = (x) => (x == null ? "mid" : x >= 6.5 ? "hi" : x >= 5 ? "mid" : "lo");

// Tên gọi khách chỉ lấy từ lượt này (tenKhach), KHÔNG BAO GIỜ lấy settings.xungHo
export const tenKhachCua = (session, opts = {}) => String(opts.tenKhach ?? session?.tenKhach ?? "").trim().slice(0, 40);

// ---------- Bản theo luật: đọc lại thông điệp từ nghĩa thật của các lá ----------
// Mạch: chuyện đang diễn ra → gốc rễ (điều đang cản/đẩy) → hướng sắp tới → điều nên làm.
export function loiGuiKhachLuat(db, session, rule, opts = {}) {
  const goi = tenKhachCua(session, opts);
  const hash = [...String(session.hash || "")].reduce((a, c) => a + c.charCodeAt(0), 0);
  const pick = (arr, k = 0) => arr[(hash + k) % arr.length];
  const tiers = nghiaTrai(db, session, rule);
  const nhieuTang = tiers.length > 1;
  const tarot = tiers.flatMap((t) => t.la.filter((x) => x.deck === "tarot").map((x) => ({ ...x, ti: t.ti })));
  const len = tiers.flatMap((t) => t.la.filter((x) => x.deck === "lenormand").map((x) => ({ ...x, ti: t.ti })));
  const dung = new Set();
  const lay = (x) => { if (x) dung.add(x); return x; };
  const conLai = (arr) => arr.filter((x) => !dung.has(x));
  // đang diễn ra: lá "hiện" đầu tiên (tầng đầu)
  const hien = lay(tarot.find((x) => x.vai === "hien") || tarot[0] || len[0]);
  // hướng tới: lá "hướng" của tầng cuối
  const lastTi = tiers.length - 1;
  const huong = lay([...conLai(tarot)].reverse().find((x) => x.vai === "huong" && x.ti === lastTi) || [...conLai(tarot)].reverse().find((x) => x.vai === "huong") || conLai(tarot).at(-1) || conLai(len).at(-1));
  // gốc rễ: lá cản mạnh nhất và lá đẩy mạnh nhất còn lại
  const conT = conLai(tarot).length ? conLai(tarot) : conLai(len);
  const can = lay([...conT].sort((a, b) => a.diem - b.diem).find((x) => x.diem < 0));
  const day = lay([...conLai(conT)].sort((a, b) => b.diem - a.diem).find((x) => x.diem > 0));
  // không có lá cản/đẩy rõ thì lá còn lại kể phần giữa của câu chuyện
  const giua = !can && !day ? lay(conLai(conT)[0]) : null;
  const cap = tiers.flatMap((t) => t.cap.map((c) => ({ c, diem: t.diem ?? 5 }))).sort((a, b) => a.diem - b.diem);
  const lenX = conLai(len)[0];

  const s1 = (x) => (x ? lamSach(x.nghia, db) : []);
  const ve = (x) => (x ? lowFirst(s1(x)[0] || "") : "");
  const ve2 = (x) => (x ? s1(x)[1] || "" : "");
  const sach1 = (t) => (t ? lamSach(t, db)[0] || "" : "");
  const khi = (x, mac) => (nhieuTang && x ? (x.ti === 0 ? "khoảng đầu" : x.ti === lastTi ? "về sau" : "khoảng giữa") : mac);

  const q = tenLaTrong(session.cauHoi, db).length || demChu(session.cauHoi) > 18 ? "" : ` “${session.cauHoi}”`;
  const mo = goi ? `${goi} ơi, với câu bạn hỏi${q}, trải bài nói khá rõ về chuyện đang diễn ra.` : `Về câu bạn hỏi${q}, trải bài nói khá rõ về chuyện đang diễn ra.`;
  const p1 = [mo];
  if (hien && ve(hien)) p1.push(`${capFirst(khi(hien, "lúc này"))}, ${ve(hien)}`);
  const yn = tiers.at(-1)?.tra_loi;
  if (yn && spreadById(session.spreadId).mode === "yesno") p1.push(`Nếu cần một câu trả lời gọn, thì đó là: ${yn.toLowerCase()}.`);

  const p2 = [];
  if (can && ve(can)) p2.push(`${pick(["Gốc rễ của chuyện này nằm ở chỗ", "Điều đang níu bạn lại là", "Cái khó nằm ở chỗ"])} ${ve(can)}`);
  if (day && ve(day)) p2.push(`${can ? pick(["Nhưng bù lại,", "Ngược lại,", "Song song đó,"], 1) : pick(["Điều đang đẩy bạn đi tới là", "Lực đẩy lớn nhất đến từ chỗ"], 1)} ${ve(day)}`);
  if (giua && ve(giua)) p2.push(`${pick(["Ở khoảng giữa,", "Trên đường đi,", "Điều đang chi phối chuyện này là"], 2)} ${ve(giua)}`);
  if (cap[0]) p2.push(`Thêm một chi tiết đáng để ý: ${lowFirst(cap[0].c)}`);
  else if (lenX && ve(lenX)) p2.push(`Thêm một chi tiết đáng để ý: ${ve(lenX)}`);

  const p3 = [];
  if (huong && ve(huong)) p3.push(`${capFirst(khi(huong, "thời gian tới"))}, ${ve(huong)}`);
  const khuyenX = [huong, can, hien].find((x) => x?.khuyen && lamSach(x.khuyen, db).length);
  if (khuyenX) p3.push(`Điều nên làm lúc này: ${lowFirst(lamSach(khuyenX.khuyen, db)[0])}`);
  else p3.push(KHUYEN[{ tien: "tien", tinh: "tinh", viec: "viec", suckhoe: "suckhoe" }[chuDeCua(session)] || "chung"][bandKey(rule?.diem_tb)]);

  // độ dài 120–220: thêm câu thứ hai của các lá, hoặc lá còn lại; quá dài thì bớt câu phụ
  const tg = [hien, huong, can, day].find((x) => x?.thoi_gian);
  const ng = [hien, can, day].find((x) => x?.nguoi);
  const rr = [can, hien, huong].find((x) => x?.rui_ro && x.diem <= 0) || [can, hien, huong].find((x) => x?.rui_ro);
  const them = [
    [p1, ve2(hien)], [p3, ve2(huong)], [p2, ve2(can)], [p2, ve2(day)],
    [p2, hien?.chung && sach1(hien.chung) ? `Rộng hơn, ${lowFirst(sach1(hien.chung))}` : ""],
    [p2, ng && sach1(ng.nguoi) ? `Người đáng để ý trong chuyện này là ${lowFirst(sach1(ng.nguoi)).replace(/^một người/u, "một người")}` : ""],
    [p3, tg && sach1(tg.thoi_gian) ? `Về nhịp thời gian, ${lowFirst(sach1(tg.thoi_gian))}` : ""],
    [p2, rr && sach1(rr.rui_ro) ? `Điều cần để ý là ${lowFirst(sach1(rr.rui_ro))}` : ""],
    [p3, huong?.chung && huong !== hien && sach1(huong.chung) ? `Nhìn rộng ra, ${lowFirst(sach1(huong.chung))}` : ""],
    ...conLai(tarot).concat(conLai(len)).map((x) => [p2, ve(x) ? `${pick(["Bên cạnh đó,", "Cũng cần thấy rằng", "Ở một góc khác,"], x.ti)} ${ve(x)}` : ""]),
    [p3, pick(LOT, 2)],
  ];
  const paras = [p1, p2, p3];
  const text = () => paras.filter((p) => p.length).map((p) => p.join(" ")).join("\n\n");
  for (const [p, c] of them) { if (demChu(text()) >= LGK_MIN + 10) break; if (c) p.push(c); }
  for (const p of [p2, p1, p3]) while (demChu(text()) > LGK_MAX && p.length > 1) p.pop();
  if (!p2.length) { p2.push(...p1.splice(1)); }
  return text();
}

// ---------- Chốt: AI → viết lại 1 lần → luật ----------
export const SYSTEM_LGK = `Bạn là tarot reader lão luyện đang nhắn tin riêng cho một khách. Gọi khách đúng tên được cho trong yêu cầu; không có tên thì gọi "bạn", không dùng tên riêng nào khác. Không nêu tên vị trí, tên tầng hay tên ô của trải bài. Lời gửi phải ĐỌC LẠI THÔNG ĐIỆP của chính trải bài cho đúng câu hỏi: tổng hợp nghĩa thật của các lá được cho thành một mạch chuyện liền — chuyện đang diễn ra thế nào → gốc rễ/điều đang cản hoặc đẩy → hướng sắp tới → điều nên làm. Mỗi câu phải bắt nguồn từ nghĩa của ít nhất một lá, có chi tiết cụ thể (người, việc, cảm xúc, thời điểm); cấm câu sáo dùng được cho mọi khách. Viết lời gửi bằng tiếng Việt CÓ DẤU đầy đủ: văn xuôi ${LGK_MIN}–${LGK_MAX} chữ, 2–4 đoạn cách nhau một dòng trống; giọng tự nhiên, ấm, có chiều sâu; trả lời thẳng đúng câu hỏi; kết bằng một lời khuyên làm được ngay. KHÔNG nêu tên bất kỳ lá nào, KHÔNG giải nghĩa từng lá, KHÔNG gạch đầu dòng, KHÔNG đánh số, KHÔNG tiêu đề, KHÔNG in đậm, không emoji. Không nhắc tới web, ứng dụng, AI, công cụ, máy, hệ thống, thuật toán, sự ngẫu nhiên hay mã khoá. Chỉ trả về đúng phần lời gửi.`;

export const dongGoiKhach = (tenKhach) => (tenKhach ? `GỌI KHÁCH: gọi đúng tên “${tenKhach}”, không dùng tên nào khác.` : `GỌI KHÁCH: không có tên — gọi “bạn”, không dùng tên riêng nào.`);
export function yeuCauVietLai(session, reading, loi, tenKhach = tenKhachCua(session), db = null, rule = null) {
  const nghia = db ? khoiNghiaChoAI(db, session, rule) : [reading?.tong_quan, reading?.tong_ket].filter(Boolean).join("\n");
  return `${dongGoiKhach(tenKhach)}\nCÂU HỎI: ${session.cauHoi}\n\n${nghia}\n\n(Tên lá, tên tầng, tên vị trí ở trên chỉ để bạn nắm ý — KHÔNG chép vào lời gửi.)\n\nBản lời gửi trước bị trả lại vì: ${loi.join("; ")}. Hãy viết lại lời gửi khách đúng mọi yêu cầu, đọc ra thông điệp riêng của trải này.`;
}

// call(system, text) → Promise<string>: gọi AI dạng chữ (đã qua cổng kiểm dấu)
// tenKhach: tên khách của lượt này; xungHo: tên xưng hô đã lưu (bị chặn trong lời gửi nếu khác tenKhach)
export async function chotLoiGuiKhach({ db, session, rule, reading = null, tenKhach, xungHo = "", call = null }) {
  const ten = tenKhachCua(session, { tenKhach });
  const opts = { tenKhach: ten, xungHo, session };
  const luat = () => loiGuiKhachLuat(db, session, rule, { tenKhach: ten });
  const first = String(reading?.loi_gui_khach || "").trim();
  const k1 = kiemLoiGuiKhach(first, db, opts);
  if (k1.ok) return { text: first, nguon: "ai", loi: [] };
  if (first && call) {
    try {
      const again = String(await call(SYSTEM_LGK, yeuCauVietLai(session, reading, k1.loi, ten, db, rule)) || "").trim();
      const k2 = kiemLoiGuiKhach(again, db, opts);
      if (k2.ok) return { text: again, nguon: "ai-viet-lai", loi: k1.loi };
      return { text: luat(), nguon: "luat", loi: k2.loi };
    } catch (e) {
      if (e?.name === "AbortError") throw e;
    }
  }
  return { text: luat(), nguon: "luat", loi: k1.loi };
}
