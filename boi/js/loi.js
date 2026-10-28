// Ô "Lời gửi khách": đoạn văn xuôi gửi người hỏi, tách khỏi bản giải đầy đủ.
// Cổng kiểm: 120–220 chữ, 2–4 đoạn, không tên lá, không gạch đầu dòng / đánh số / tiêu đề / in đậm, có dấu.
// AI viết trước; trượt cổng → viết lại đúng 1 lần; vẫn trượt → bản theo luật viết xuôi (cũng không tên lá).
import { tyLeDau, NGUONG_DAU } from "./ai.js";
import { tarotCard, lenCard, SCAM } from "./reading.js";
import { spreadById } from "./spreads.js";
import { mainTopic } from "./topic.js";

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
];
export const chuCamTrong = (text) => CHU_CAM.filter(([, re]) => re.test(text)).map(([ten]) => ten);

export function kiemLoiGuiKhach(text, db) {
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
  return { ok: !loi.length, loi };
}

// ---------- Bản theo luật, viết xuôi ----------
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
const capFirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const bandKey = (x) => (x == null ? "mid" : x >= 6.5 ? "hi" : x >= 5 ? "mid" : "lo");

export function loiGuiKhachLuat(db, session, rule, settings = {}) {
  const goi = (settings.xungHo || "").trim();
  const round = session.rounds[0];
  const tiers = rule.tang.filter((t) => t.diem != null);
  const mean = rule.diem_tb ?? (tiers.length ? tiers.reduce((a, t) => a + t.diem, 0) / tiers.length : 5);
  const bk = bandKey(mean);
  const topic = { tien: "tien", tinh: "tinh", viec: "viec", suckhoe: "suckhoe" }[session.money ? "tien" : mainTopic(session.cauHoi)] || "chung";
  const yesno = spreadById(session.spreadId).mode === "yesno";
  const hash = [...String(session.hash || "")].reduce((a, c) => a + c.charCodeAt(0), 0);
  const pick = (arr, k = 0) => arr[(hash + k) % arr.length];

  // Đoạn 1: mở + câu trả lời chính
  const p1 = [];
  // câu hỏi có chứa tên lá thì không trích nguyên văn
  const q = tenLaTrong(session.cauHoi, db).length ? "" : ` “${session.cauHoi}”`;
  p1.push(goi ? `${goi} ơi, mình đã đọc kỹ câu bạn hỏi${q}.` : `Về câu bạn hỏi${q}, mình đã đọc kỹ toàn bộ trải bài.`);
  p1.push(pick(MO[bk]));
  if (yesno) {
    const last = tiers[tiers.length - 1];
    if (last?.tra_loi) p1.push(`Nếu cần một câu trả lời gọn, thì đó là: ${last.tra_loi.toLowerCase()}.`);
  } else if (tiers.length >= 2) {
    const best = [...tiers].sort((a, b) => b.diem - a.diem)[0], worst = [...tiers].sort((a, b) => a.diem - b.diem)[0];
    if (best !== worst && best.diem - worst.diem >= 1) p1.push(`Giai đoạn sáng nhất là ${best.ten}, còn ${worst.ten} là lúc bạn cần giữ sức và cẩn trọng hơn.`);
    else p1.push("Các giai đoạn khá đều nhau: không có lúc nào sập, nhưng cũng chưa có cú bứt phá rõ ràng.");
  }

  // Đoạn 2: chủ đề nổi bật (không gọi tên lá)
  const p2 = [];
  const cells = (round?.tarot || []).flat().filter((c) => c.ok).map((c) => tarotCard(db, c.card));
  const len = (round?.lenormand || []).flat().filter((c) => c.ok).map((c) => lenCard(db, c.card));
  const suits = { wands: 0, cups: 0, swords: 0, pentacles: 0 };
  let majors = 0;
  for (const c of cells) { if (c.nhom === "major") majors++; else suits[c.chat]++; }
  const top = Object.entries(suits).sort((a, b) => b[1] - a[1])[0];
  if (top && top[1] >= 2) p2.push(`Điều mình thấy rõ nhất: ${SUIT_Y[top[0]]}.`);
  if (cells.length && majors / cells.length >= 0.4) p2.push("Đây không phải chuyện nhỏ thoáng qua: nó là một bước ngoặt thật trong giai đoạn này của bạn, nên đáng để bạn nghiêm túc với nó.");
  const repeats = (round ? [...round.tarot.flat(), ...round.lenormand.flat()] : []).filter((c) => c.repeatOf?.doclap);
  if (repeats.length) p2.push("Có một chủ đề cứ quay lại ở nhiều giai đoạn khác nhau, nghĩa là chuyện này chưa khép lại: nếu bạn né, nó sẽ còn tìm đến bạn.");
  const scam = cells.some((c) => SCAM.tarot.includes(c.en)) || len.some((c) => SCAM.lenormand.includes(c.en));
  if (scam) p2.push(topic === "tien" ? "Mình thấy có dấu hiệu thông tin chưa rõ ràng quanh chuyện tiền: lời hứa nào cũng nên kiểm chứng, giấy tờ nào cũng nên đọc kỹ trước khi đặt bút." : "Có chỗ chưa minh bạch trong chuyện này: đừng vội tin hết những gì bạn đang được nghe, hãy tự kiểm chứng.");
  if (!p2.length) p2.push("Năng lượng chung khá cân bằng giữa lý trí và cảm xúc, nên bạn có đủ điều kiện để nhìn mọi việc tỉnh táo.");

  // Đoạn 3: lời khuyên làm được
  const p3 = [pick(LOT, 1), KHUYEN[topic][bk]];

  const extra = [...LOT.filter((x) => !p3.includes(x)), "Cứ đi từng bước nhỏ, mỗi bước chắc thì kết quả sẽ tự rõ dần."];
  let paras = [p1, p2, p3];
  const text = () => paras.map((p) => p.join(" ")).join("\n\n");
  let k = 0;
  while (demChu(text()) < LGK_MIN && k < extra.length) { p2.push(extra[k++]); }
  // quá dài thì bỏ bớt câu phụ ở đoạn 2 (giữ câu đầu)
  while (demChu(text()) > LGK_MAX && p2.length > 1) p2.pop();
  paras = paras.map((p) => p.map(capFirst));
  return text();
}

// ---------- Chốt: AI → viết lại 1 lần → luật ----------
export const SYSTEM_LGK = `Bạn là tarot reader lão luyện đang nhắn tin riêng cho người hỏi. Viết lời gửi bằng tiếng Việt CÓ DẤU đầy đủ: văn xuôi ${LGK_MIN}–${LGK_MAX} chữ, 2–4 đoạn cách nhau một dòng trống; giọng tự nhiên, ấm, có chiều sâu; trả lời thẳng đúng câu hỏi; kết bằng một lời khuyên làm được ngay. KHÔNG nêu tên bất kỳ lá nào, KHÔNG giải nghĩa từng lá, KHÔNG gạch đầu dòng, KHÔNG đánh số, KHÔNG tiêu đề, KHÔNG in đậm, không emoji. Không nhắc tới web, ứng dụng, AI, công cụ, máy, hệ thống, thuật toán, sự ngẫu nhiên hay mã khoá. Chỉ trả về đúng phần lời gửi.`;

export function yeuCauVietLai(session, reading, loi) {
  const tom = [reading?.tong_quan, ...(reading?.tang || []).map((t) => `${t.ten}: ${t.diem ?? "?"}/10${t.tra_loi ? ` (${t.tra_loi})` : ""}. ${t.chot || ""}`), reading?.tong_ket].filter(Boolean).join("\n");
  return `CÂU HỎI: ${session.cauHoi}\n\nTÓM TẮT BẢN GIẢI (chỉ để bạn nắm ý, không chép tên lá):\n${tom}\n\nBản lời gửi trước bị trả lại vì: ${loi.join("; ")}. Hãy viết lại lời gửi khách đúng mọi yêu cầu.`;
}

// call(system, text) → Promise<string>: gọi AI dạng chữ (đã qua cổng kiểm dấu)
export async function chotLoiGuiKhach({ db, session, rule, reading = null, settings = {}, call = null }) {
  const first = String(reading?.loi_gui_khach || "").trim();
  const k1 = kiemLoiGuiKhach(first, db);
  if (k1.ok) return { text: first, nguon: "ai", loi: [] };
  if (first && call) {
    try {
      const again = String(await call(SYSTEM_LGK, yeuCauVietLai(session, reading, k1.loi)) || "").trim();
      const k2 = kiemLoiGuiKhach(again, db);
      if (k2.ok) return { text: again, nguon: "ai-viet-lai", loi: k1.loi };
      return { text: loiGuiKhachLuat(db, session, rule, settings), nguon: "luat", loi: k2.loi };
    } catch (e) {
      if (e?.name === "AbortError") throw e;
    }
  }
  return { text: loiGuiKhachLuat(db, session, rule, settings), nguon: "luat", loi: k1.loi };
}
