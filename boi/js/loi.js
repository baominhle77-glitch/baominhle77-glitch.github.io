// Ô "Lời gửi khách": đoạn văn xuôi gửi người hỏi, tách khỏi bản giải đầy đủ.
// Cổng kiểm (GĐ 30/10): chỉ CHẶN lỗi cứng — tên lá, chữ cấm, mất dấu, đầu dòng/đánh số/tiêu đề/in đậm, tên vị trí, gọi sai tên.
// Lỗi mềm (độ dài, số đoạn, câu sáo, ý khớp, trái chiều, ngữ cảnh) chỉ là cảnh báo: vẫn dùng bản AI.
// Độ dài theo câu hỏi: câu ngắn 150–300 chữ; câu nhiều mốc (nhiều tháng/nhiều vế) 600–800 chữ, 4–10 đoạn.
// AI lỗi cứng → viết lại đúng 1 lần; vẫn lỗi cứng hoặc AI trống/lỗi mạng → bản theo luật viết xuôi.
import { tyLeDau, NGUONG_DAU } from "./ai.js";
import { tarotCard, lenCard, SCAM, cardScore, lenPairs } from "./reading.js";
import { spreadById, posLabel, posKey } from "./spreads.js";
import { mainTopic } from "./topic.js";
import { tarotMeaning, lenMeaning, capMeaning } from "./data.js";

export const LGK_MIN = 120;
export const LGK_MAX = 220;
// Độ dài lời gửi theo câu hỏi + danh sách mốc phải trả lời đủ (vd đủ 12 tháng)
const RE_NHIEU_MOC = /(?<![\p{L}])(?:từng tháng|mỗi tháng|các tháng|12 tháng|mười hai tháng|cả năm|từng quý|các quý|từng giai đoạn|từng mốc|từng tuần)(?![\p{L}])/iu;
export const laMocThoiGian = (ten) => /^(?:tháng|quý|tuần|năm|cả năm|\d+\s*[–-]\s*\d+\s*(?:tuần|tháng)|đầu năm|giữa năm|cuối năm)(?![\p{L}])/iu.test(String(ten || "").trim());
export function doDaiLgk(session) {
  const q = String(session?.cauHoi || "");
  const tiers = session?.tiers || [];
  const moc = tiers.map((t) => String(t.ten || "").trim()).filter(laMocThoiGian);
  const veHoi = (q.match(/\?/g) || []).length;
  const nhieu = tiers.length >= 4 || moc.length >= 4 || RE_NHIEU_MOC.test(q) || veHoi >= 3;
  return nhieu
    ? { min: 600, max: 800, doanMin: 4, doanMax: 10, nhieu: true, moc }
    : { min: 150, max: 300, doanMin: 2, doanMax: 5, nhieu: false, moc };
}
export function dongDoDai(session) {
  const d = doDaiLgk(session);
  if (!d.nhieu) return `ĐỘ DÀI LỜI GỬI: ${d.min}–${d.max} chữ, ${d.doanMin}–${d.doanMax} đoạn cách nhau một dòng trống.`;
  // câu nhiều mốc (GĐ 30/10 chiều): đo thật ra 386 chữ, mỗi tháng 1–2 câu → nêu rõ số chữ tối thiểu và số câu mỗi mốc
  const moc = d.moc.length
    ? ` Trả lời đủ TỪNG mốc khách hỏi, theo thứ tự: ${d.moc.join(", ")}. MỖI mốc 2–3 câu cụ thể dựa đúng lá của mốc đó: một điều thuận, một điều cần cẩn trọng, một việc nên làm (được gọi tên tháng/mốc thời gian). Có thể gộp 2–3 mốc liền nhau vào một đoạn.`
    : " Trả lời đủ từng vế/mốc khách hỏi, mỗi vế 2–3 câu cụ thể: điều thuận, điều cần cẩn trọng, việc nên làm.";
  return `ĐỘ DÀI LỜI GỬI: TỐI THIỂU ${d.min} chữ (nhắm khoảng ${Math.round((d.min + d.max) / 2)} chữ, không quá ${d.max}), ${d.doanMin}–${d.doanMax} đoạn cách nhau một dòng trống. Dưới ${d.min} chữ là CHƯA ĐẠT.${moc} Thêm một đoạn mở (trả lời thẳng cả năm/cả câu) và một đoạn kết (việc nên làm đầu tiên).`;
}
// Lượt "viết dài thêm" (một lần duy nhất, chỉ khi còn ngân sách thời gian): bản AI đúng ý nhưng ngắn hơn mức tối thiểu
export function yeuCauVietDaiThem(session, banCu, tenKhach, db = null, rule = null) {
  const d = doDaiLgk(session);
  const nghia = db ? khoiNghiaChoAI(db, session, rule) : "";
  return `${dongGoiKhach(tenKhach)}\nCÂU HỎI: ${session.cauHoi}\n${dongDoDai(session)}\n\n${nghia}\n\n(Tên lá, tên tầng, tên vị trí ở trên chỉ để bạn nắm ý — KHÔNG chép vào lời gửi.)\n\nBẢN ĐANG CÓ (${demChu(banCu)} chữ — quá ngắn, cần tối thiểu ${d.min} chữ):\n${banCu}\n\nHãy viết lại thành bản đầy đủ khoảng ${Math.round((d.min + d.max) / 2)} chữ: giữ nguyên câu trả lời thẳng và chiều của bản cũ, mở rộng để MỖI mốc có 2–3 câu cụ thể (điều thuận, điều cần cẩn trọng, việc nên làm) dựa đúng lá của mốc đó. Chỉ trả về lời gửi.`;
}
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
    // tên mốc thời gian (Tháng 3/2027, 4–6 tuần tới…) là điều khách hỏi → được nhắc lại
    if (t.ten && !laMocThoiGian(t.ten)) out.add(String(t.ten).trim());
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
export const DAI_TU = ["bạn", "anh", "chị", "em", "cậu", "mình", "tớ", "cô", "chú", "bác", "ông", "bà", "dì", "cháu", "con", "quý khách", "khách", "người hỏi", "anh chị", "bạn thân mến"];
export const laDaiTu = (x) => DAI_TU.includes(String(x || "").trim().toLowerCase().replace(/\s+/g, " "));
// Tên được gọi ở câu mở đầu ("Lan ơi", "Queen Linh ơi") — "" khi không gọi tên
export const tenGoiDau = (t) => (/^[ \t]*((?:[\p{Lu}][\p{L}]*)(?: [\p{Lu}][\p{L}]*){0,2})[ \t]+ơi(?![\p{L}])/u.exec(String(t || "")) || [])[1] || "";
export function kiemLoiGuiKhach(text, db, opts = {}) {
  const t = String(text || "").trim();
  if (!t) return { ok: false, loi: ["trống"], canhBao: [] };
  const loi = [];      // lỗi cứng → chặn
  const canhBao = [];  // lỗi mềm → vẫn dùng bản AI, chỉ ghi cảnh báo
  const d = doDaiLgk(opts.session);
  const n = demChu(t);
  if (n < d.min || n > d.max) canhBao.push(`dài ${n} chữ (nên ${d.min}–${d.max})`);
  const p = doanVan(t).length;
  if (p < d.doanMin || p > d.doanMax) canhBao.push(`${p} đoạn (nên ${d.doanMin}–${d.doanMax})`);
  if (/^[ \t]*(?:[-–—•*+●▪◦·>]|\d+[ \t]*[.)/:]|[a-zA-Z][.)])[ \t]*/m.test(t)) loi.push("có ký tự đầu dòng hoặc đánh số");
  if (/^[ \t]*#{1,6}[ \t]/m.test(t) || /^[^\n.!?]{1,60}:[ \t]*$/m.test(t)) loi.push("có tiêu đề");
  if (/\*\*|__|<\/?(?:b|strong|h\d)\b/i.test(t)) loi.push("có in đậm");
  const ten = tenLaTrong(t, db);
  if (ten.length) loi.push(`có tên lá: ${ten.join(", ")}`);
  const cam = chuCamTrong(t);
  if (cam.length) loi.push(`có chữ cấm: ${cam.join(", ")}`);
  if (tyLeDau(t) < NGUONG_DAU) loi.push("mất dấu");
  // "gọi sai tên" chỉ khi là TÊN RIÊNG khác tên khách — đại từ xưng hô (bạn, anh, chị, em…) không bao giờ là sai tên
  // (lỗi 30/10: không nhập tên → xưng hô "bạn" → lời gửi gọi "Bạn ơi" bị chặn mọi lượt)
  const tenKhach = String(opts.tenKhach || "").trim();
  const xh = String(opts.xungHo || "").trim();
  const khacTen = (x) => x && !laDaiTu(x) && x.toLowerCase() !== tenKhach.toLowerCase();
  if (khacTen(xh) && new RegExp(`(?<![\\p{L}\\p{N}])${escRe(xh)}(?![\\p{L}\\p{N}])`, "iu").test(t)) loi.push(`gọi sai tên: ${xh}`);
  else {
    const goi = tenGoiDau(t);
    if (khacTen(goi)) loi.push(`gọi sai tên: ${goi}`);
  }
  const vt = viTriTrong(t, tenViTriCua(opts.session));
  if (vt.length) loi.push(`có tên vị trí/tầng: ${vt.join(", ")}`);
  // Luật "chung chung" (28/10) — nay là cảnh báo mềm
  if (opts.session && db && opts.session.rounds?.[0]) {
    const y = yKhop(t, db, opts.session);
    if (y.length < Y_TOI_THIEU) canhBao.push(`chung chung: chỉ ${y.length} ý khớp nghĩa lá đã trải (nên ≥ ${Y_TOI_THIEU})`);
  }
  if (opts.session && nguCanh(opts.session.cauHoi).coNguoi && RE_CAU_DOC_THAN.test(t)) canhBao.push("sai ngữ cảnh: nói “người độc thân” khi khách hỏi về một người cụ thể");
  const tc = cauTraiChieu(t, opts.session);
  if (tc.length) canhBao.push(`trái chiều câu trả lời (${{ tot: "đã nói có/còn", giua: "đã nói có nhưng có điều kiện", xau: "đã nói nghiêng về không" }[chieuTrongLoi(t).chieu]}): “${tc[0].slice(0, 80)}”`);
  const sao = tyLeCauSao(t);
  if (sao > SAO_TOI_DA) canhBao.push(`chung chung: ${Math.round(sao * 100)} % câu là câu sáo có sẵn`);
  return { ok: !loi.length, loi, canhBao };
}

// ---------- Nghĩa thật của trải bài ----------
const capFirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const lowFirst = (s) => (/^[A-ZĐÂÊÔƠƯ]{2}/u.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1));
const cauCua = (text) => String(text || "").split(/(?<=[.!?…])\s+/u).map((x) => x.trim()).filter(Boolean);
export const chuDeCua = (session) => { const m = mainTopic(session.cauHoi); return m === "chung" && session.money ? "tien" : m; };

// Câu nghĩa viết lại cho khách: bỏ giọng "lá này/lá bài này nghĩa là", bỏ câu chứa tên lá hay chữ cấm
// Ngữ cảnh của câu hỏi để lọc câu nghĩa không hợp (hỏi về một người cụ thể ↔ đang độc thân; làm thuê ↔ kinh doanh)
const RE_CO_NGUOI = /(?<![\p{L}])(?:người ấy|anh ấy|cô ấy|người kia|đối phương|người yêu|bạn trai|bạn gái|chồng|vợ|crush|người cũ|người yêu cũ|ex|anh ta|cô ta|người đó)(?![\p{L}])/iu;
const RE_DOC_THAN = /(?<![\p{L}])(?:độc thân|chưa có người yêu|chưa có ai|tìm người yêu|tìm nửa kia|có người yêu|lấy chồng|lấy vợ|duyên mới|người mới|nửa kia)(?![\p{L}])/iu;
const RE_LAM_THUE = /(?<![\p{L}])(?:đi làm|làm thuê|công ty|sếp|lương|nhân viên|đổi việc|nghỉ việc|xin việc|phỏng vấn|thăng chức|đồng nghiệp)(?![\p{L}])/iu;
const RE_KINH_DOANH = /(?<![\p{L}])(?:kinh doanh|buôn bán|cửa hàng|shop|bán hàng|doanh thu|mở quán|khởi nghiệp|khách hàng)(?![\p{L}])/iu;
export function nguCanh(cauHoi) {
  const q = String(cauHoi || "");
  // "bao giờ có người yêu" là hỏi khi còn độc thân, dù có chữ "người yêu"
  const docThan = RE_DOC_THAN.test(q);
  return { coNguoi: RE_CO_NGUOI.test(q) && !docThan, docThan, lamThue: RE_LAM_THUE.test(q), kinhDoanh: RE_KINH_DOANH.test(q) };
}
const RE_CAU_DOC_THAN = /(?<![\p{L}])(?:người độc thân|đang độc thân|nếu (?:bạn )?(?:còn |đang )?độc thân|cuộc sống độc thân)(?![\p{L}])/iu;
const RE_CAU_CO_DOI = /(?<![\p{L}])(?:người có đôi|người đã có (?:đôi|gia đình|người yêu)|mối quan hệ hiện tại|nếu (?:bạn )?đã có (?:đôi|người yêu)|hai bạn|cả hai)(?![\p{L}])/iu;
const RE_CAU_KINH_DOANH = /(?<![\p{L}])(?:kinh doanh|buôn bán|doanh nghiệp|cửa hàng|doanh thu)(?![\p{L}])/iu;
const RE_CAU_LAM_THUE = /(?<![\p{L}])(?:sếp|cấp trên|đồng nghiệp|tăng lương|thăng chức|nhân viên)(?![\p{L}])/iu;
export function hopNguCanh(cau, nc = {}) {
  if (nc.coNguoi && RE_CAU_DOC_THAN.test(cau)) return false;
  if (nc.docThan && RE_CAU_CO_DOI.test(cau)) return false;
  if (nc.lamThue && !nc.kinhDoanh && RE_CAU_KINH_DOANH.test(cau)) return false;
  if (nc.kinhDoanh && !nc.lamThue && RE_CAU_LAM_THUE.test(cau)) return false;
  return true;
}

// ---------- Cùng chiều với câu trả lời thẳng (lệnh 28/10) ----------
// Đã trả lời "còn/có/nghiêng tốt" thì không câu nào được đảo ngược (tan vỡ, người mới, thất bại…);
// đã trả lời "nghiêng về không/xấu" thì không câu nào hứa chắc thành. "giua" (có, nhưng có điều kiện) = tốt + không hứa chắc.
// Lá cản vẫn được nói, nhưng như điều đang che/làm chậm câu trả lời (câu có chữ che/chậm/níu/vướng/cản đứng trước thì cho qua).
// đảo ngược riêng của chuyện tình cảm (chỉ xét khi câu hỏi về tình cảm/một người) và đảo ngược chung (mọi câu hỏi)
const RE_DAO_TINH = /(?<![\p{L}])(?:tan vỡ|đổ vỡ|chia tay|chia ly|chia lìa|chấm dứt|kết thúc|người mới|duyên mới|tình mới|buông tay|rời đi|rời xa|ra đi|hết tình cảm|không còn tình cảm|hết yêu|hết thương|không còn yêu|không còn thương|nguội lạnh|ly hôn|ly thân|đường ai nấy đi|mỗi người một ngả|cắt đứt)(?![\p{L}])/iu;
const RE_DAO_TOT = /(?<![\p{L}])(?:thất bại|không thành|đổ bể|mất trắng|thất bát|vô vọng|không có kết quả|tan thành mây khói)(?![\p{L}])/iu;
const RE_HUA_CHAC = /(?<![\p{L}])(?:chắc chắn(?: sẽ)? (?:thành|được|đạt|có|đến|thắng|thuận|tốt)|nhất định (?:sẽ )?(?:thành|được|đạt)|chắc như đinh đóng cột|không gì cản (?:nổi|được))(?![\p{L}])/iu;
const RE_DAO_XAU = /(?<![\p{L}])(?:thành công rực rỡ|thành công mỹ mãn|viên mãn|mỹ mãn|toại nguyện|như ý|thuận buồm xuôi gió|suôn sẻ|mọi việc đều tốt|kết quả tốt đẹp|gắn kết bền chặt|cam kết bền vững|hạnh phúc trọn vẹn|thăng hoa|đơm hoa kết trái|thành hiện thực|về chung một nhà)(?![\p{L}])/iu;
const RE_PHU_DINH = /(?:không|chưa|chẳng|đừng|tránh|thay vì|chứ không|không phải|chưa phải|không hẳn|khỏi)\s+(?:\S+\s+){0,2}$/iu;
const RE_KHUNG_CAN = /(?:che|chậm|níu|vướng|cản|trì hoãn|ngăn)/iu;
const khop = (re, cau) => {
  const g = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
  for (const m of cau.matchAll(g)) {
    const truoc = cau.slice(0, m.index);
    if (RE_PHU_DINH.test(truoc)) continue; // "đừng vội buông tay", "chưa chắc chắn" — không đảo chiều
    if (RE_KHUNG_CAN.test(truoc)) continue; // nói như điều đang che/làm chậm câu trả lời
    return true;
  }
  return false;
};
// Câu có ngược chiều câu trả lời không (chieu: "tot" | "giua" | "xau"; tinh: câu hỏi về tình cảm/một người)
export function traiChieu(cau, chieu, tinh = true) {
  if (!chieu) return false;
  if (chieu === "xau") return khop(RE_DAO_XAU, cau) || khop(RE_HUA_CHAC, cau);
  return khop(RE_DAO_TOT, cau) || (tinh && khop(RE_DAO_TINH, cau)) || (chieu === "giua" && khop(RE_HUA_CHAC, cau));
}
// Câu hỏi về tình cảm/một người? (theo câu hỏi của phiên; không có câu hỏi thì chỉ xét ý đảo ngược chung)
export const laCauTinh = (session) => !!session?.cauHoi && (chuDeCua(session) === "tinh" || nguCanh(session.cauHoi).coNguoi);
// Chiều câu trả lời mà chính lời gửi đã nói (đọc 3 câu đầu); không thấy câu trả lời rõ thì null
const RE_NOI_GIUA = /có điều kiện|nhưng (?:đang )?(?:bị )?(?:che|kéo chậm|vướng)/iu;
const RE_NOI_XAU = /nghiêng (?:rõ )?về (?:phía )?không|câu trả lời (?:gọn )?là:? (?:không|chưa|nghiêng về không)|đang nguội đi|không còn (?:thương|yêu|như trước)|nhạt dần|khó hơn bạn mong|chưa (?:thuận|tới lúc)/iu;
const RE_NOI_TOT = /nghiêng (?:rõ )?về (?:phía )?có|câu trả lời (?:gọn )?là:? (?:có|còn)|vẫn còn (?:thương|yêu)|hướng thuận/iu;
export function chieuTrongLoi(text) {
  const cau = cauCua(String(text || "").replace(/\n+/g, " ")).slice(0, 3);
  for (let i = 0; i < cau.length; i++) {
    const c = cau[i];
    if (RE_NOI_XAU.test(c)) return { chieu: "xau", i };
    if (RE_NOI_TOT.test(c)) return { chieu: RE_NOI_GIUA.test(c) ? "giua" : "tot", i };
    if (RE_NOI_GIUA.test(c) && /câu trả lời|nói gọn/iu.test(c)) return { chieu: "giua", i };
  }
  return null;
}
// Các câu trái chiều trong lời gửi (bỏ qua chính câu trả lời)
export function cauTraiChieu(text, session = null) {
  const tl = chieuTrongLoi(text);
  if (!tl) return [];
  const tinh = laCauTinh(session);
  return cauCua(String(text || "").replace(/\n+/g, " ")).filter((c, i) => i !== tl.i && traiChieu(c, tl.chieu, tinh));
}

function lamSach(text, db, nc = {}) {
  return cauCua(text)
    .map((c) => c.replace(/^(?:Đây là )?(?:lá bài|lá này|quân bài)(?: này)?\s+(?:đại diện cho|tượng trưng cho|cho thấy|báo hiệu|là|nói về|của)\s+/iu, "").replace(/^Nó\s+(?:tượng trưng cho|đại diện cho|là)\s+/u, ""))
    .filter((c) => c.length > 12 && !/lá bài|lá này|quân bài/iu.test(c) && !tenLaTrong(c, db).length && !chuCamTrong(c).length && hopNguCanh(c, nc) && !traiChieu(c, nc.chieu, nc.tinh))
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

// ---------- Câu trả lời thẳng cho đúng câu hỏi (rút từ điểm/hướng của trải) ----------
// Câu hỏi dạng "có/còn/nên/sẽ … không" → nói rõ nghiêng về có hay không; câu hỏi mở → nói gọn hướng chung.
const RE_HOI_CN = /(?<![\p{L}])(còn|có|nên|sẽ|được|kịp|đỗ|thành)(?![\p{L}])[^?]*?(?<![\p{L}])(không|chưa)(?![\p{L}])\s*\??\s*$/iu;
// Chiều câu trả lời của trải: "tot" | "giua" | "xau" (cùng thang với câu trả lời thẳng)
const bangTraLoi = (session, tiers, rule) => {
  const yn = spreadById(session.spreadId).mode === "yesno" ? tiers.at(-1)?.tra_loi : null;
  const tb = rule?.diem_tb ?? (tiers.length ? tiers.reduce((a, t) => a + (t.diem ?? 5), 0) / tiers.length : 5);
  return { yn, bk: yn ? (yn === "CÓ" ? "hi" : yn.startsWith("CÓ,") ? "mid" : "lo") : bandKey(tb) };
};
export const chieuTraLoi = (session, tiers, rule) => ({ hi: "tot", mid: "giua", lo: "xau" })[bangTraLoi(session, tiers, rule).bk];
export function traLoiThang(session, tiers, rule, can = null) {
  const { yn, bk } = bangTraLoi(session, tiers, rule);
  const vat = String(can?.tu_khoa || "").split(",")[0].trim();
  const che = vat ? `sự ${vat.replace(/^sự\s+/u, "")}` : "những điều chưa nói ra";
  const m = RE_HOI_CN.exec(String(session.cauHoi || "").trim());
  const tinh = chuDeCua(session) === "tinh";
  if (m) {
    const dt = m[1].toLowerCase();
    if (dt === "còn") return { hi: "Câu trả lời là còn, và điều đó khá rõ.", mid: `Câu trả lời là còn, nhưng đang bị che bởi ${che}.`, lo: tinh ? "Nói thẳng: tình cảm phía người ấy đang nguội đi nhiều." : "Nói thẳng: điều bạn hỏi đang nhạt dần, không còn như trước." }[bk];
    return { hi: `Câu trả lời nghiêng rõ về có.`, mid: `Câu trả lời là có, nhưng có điều kiện: còn vướng ${che}.`, lo: "Câu trả lời nghiêng về không, ít nhất là ở thời điểm này." }[bk];
  }
  if (yn) return `Câu trả lời gọn là: ${yn.toLowerCase()}.`;
  return { hi: "Nói gọn: chuyện này đang đi theo hướng thuận.", mid: `Nói gọn: có tiến triển, nhưng đang bị kéo chậm bởi ${che}.`, lo: "Nói gọn: giai đoạn này khó hơn bạn mong, cần giữ sức." }[bk];
}

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
  const lenX = conLai(len)[0];

  // mọi câu nghĩa phải hợp ngữ cảnh và cùng chiều với câu trả lời thẳng
  const chieu = chieuTraLoi(session, tiers, rule);
  const nc = { ...nguCanh(session.cauHoi), chieu, tinh: laCauTinh(session) };
  const cap = tiers.flatMap((t) => t.cap.flatMap((c) => lamSach(c, db, nc).slice(0, 1).map((x) => ({ c: x, diem: t.diem ?? 5 })))).sort((a, b) => a.diem - b.diem);
  const s1 = (x) => (x ? lamSach(x.nghia, db, nc) : []);
  // không lặp lại một câu nghĩa (hai lá khác nhau có thể cùng một câu): mỗi lá giữ câu đã chọn, câu đã nói thì bỏ qua
  const daNoi = new Set(), cau1 = new Map(), cau2 = new Map(), cauT = new Map();
  const chon = (memo, key, ds) => { if (!memo.has(key)) { const c = ds.find((x) => !daNoi.has(x)) || ""; if (c) daNoi.add(c); memo.set(key, c); } return memo.get(key); };
  const ve = (x) => (x ? lowFirst(chon(cau1, x, s1(x))) : "");
  const ve2 = (x) => (x ? chon(cau2, x, s1(x).filter((c) => c !== cau1.get(x))) : "");
  const sach1 = (t) => (t ? chon(cauT, t, lamSach(t, db, nc)) : "");
  const khi = (x, mac) => (nhieuTang && x ? (x.ti === 0 ? "khoảng đầu" : x.ti === lastTi ? "về sau" : "khoảng giữa") : mac);

  const q = tenLaTrong(session.cauHoi, db).length || demChu(session.cauHoi) > 18 ? "" : ` “${session.cauHoi}”`;
  const mo = goi ? `${goi} ơi, với câu bạn hỏi${q}, trải bài nói khá rõ về chuyện đang diễn ra.` : `Về câu bạn hỏi${q}, trải bài nói khá rõ về chuyện đang diễn ra.`;
  // câu thứ hai luôn là câu trả lời gọn cho đúng câu hỏi
  const p1 = [mo, traLoiThang(session, tiers, rule, can)];
  if (hien && ve(hien)) p1.push(`${capFirst(khi(hien, "lúc này"))}, ${ve(hien)}`);

  const p2 = [];
  // lá cản: nói như điều đang che/làm chậm câu trả lời, không đảo ngược nó
  const moCan = chieu === "xau" ? ["Gốc rễ của chuyện này nằm ở chỗ", "Điều đang níu bạn lại là", "Cái khó nằm ở chỗ"] : ["Điều đang che bớt câu trả lời là", "Điều làm mọi thứ chậm lại nằm ở chỗ", "Điều đang níu chuyện này lại là"];
  if (can && ve(can)) p2.push(`${pick(moCan)} ${ve(can)}`);
  if (day && ve(day)) p2.push(`${can ? pick(["Nhưng bù lại,", "Ngược lại,", "Song song đó,"], 1) : pick(["Điều đang đẩy bạn đi tới là", "Lực đẩy lớn nhất đến từ chỗ"], 1)} ${ve(day)}`);
  if (giua && ve(giua)) p2.push(`${pick(["Ở khoảng giữa,", "Trên đường đi,", "Điều đang chi phối chuyện này là"], 2)} ${ve(giua)}`);
  if (cap[0]) p2.push(`Thêm một chi tiết đáng để ý: ${lowFirst(cap[0].c)}`);
  else if (lenX && ve(lenX)) p2.push(`Thêm một chi tiết đáng để ý: ${ve(lenX)}`);

  const p3 = [];
  if (huong && ve(huong)) p3.push(`${capFirst(khi(huong, "thời gian tới"))}, ${ve(huong)}`);
  const khuyenX = [huong, can, hien].find((x) => x?.khuyen && lamSach(x.khuyen, db, nc).length);
  if (khuyenX) p3.push(`Điều nên làm lúc này: ${lowFirst(lamSach(khuyenX.khuyen, db, nc)[0])}`);
  else p3.push(KHUYEN[{ tien: "tien", tinh: "tinh", viec: "viec", suckhoe: "suckhoe" }[chuDeCua(session)] || "chung"][bandKey(rule?.diem_tb)]);

  // độ dài 120–220: thêm câu thứ hai của các lá, hoặc lá còn lại; quá dài thì bớt câu phụ
  const tg = [hien, huong, can, day].find((x) => x?.thoi_gian);
  const ng = [hien, can, day].find((x) => x?.nguoi);
  const rr = [can, hien, huong].find((x) => x?.rui_ro && x.diem <= 0) || [can, hien, huong].find((x) => x?.rui_ro);
  const them = [
    [p1, ve2(hien)], [p3, ve2(huong)], [p2, ve2(can)], [p2, ve2(day)],
    [p2, ng && sach1(ng.nguoi) ? `Người đáng để ý trong chuyện này là ${lowFirst(sach1(ng.nguoi)).replace(/^một người/u, "một người")}` : ""],
    [p3, tg && sach1(tg.thoi_gian) ? `Về nhịp thời gian, ${lowFirst(sach1(tg.thoi_gian))}` : ""],
    [p2, rr && sach1(rr.rui_ro) ? `Điều cần để ý là ${lowFirst(sach1(rr.rui_ro))}` : ""],
    ...conLai(tarot).concat(conLai(len)).map((x) => [p2, ve(x) ? `${pick(["Bên cạnh đó,", "Cũng cần thấy rằng", "Ở một góc khác,"], x.ti)} ${ve(x)}` : ""]),
    // nghĩa chung (ngoài chủ đề câu hỏi) chỉ dùng sau cùng, khi còn thiếu độ dài
    [p2, hien?.chung && sach1(hien.chung) ? `Rộng hơn, ${lowFirst(sach1(hien.chung))}` : ""],
    [p3, huong?.chung && huong !== hien && sach1(huong.chung) ? `Nhìn rộng ra, ${lowFirst(sach1(huong.chung))}` : ""],
    [p3, pick(LOT, 2)],
  ];
  const paras = [p1, p2, p3];
  const text = () => paras.filter((p) => p.length).map((p) => p.join(" ")).join("\n\n");
  for (const [p, c] of them) { if (demChu(text()) >= LGK_MIN + 10) break; if (c && !traiChieu(c, chieu, nc.tinh)) p.push(c); }
  for (const p of [p2, p1, p3]) while (demChu(text()) > LGK_MAX && p.length > 1) p.pop();
  if (!p2.length) { p2.push(...p1.splice(1)); }
  return text();
}

// ---------- Chốt: AI → viết lại 1 lần → luật ----------
export const SYSTEM_LGK = `Bạn là tarot reader lão luyện đang nhắn tin riêng cho một khách. Gọi khách đúng tên được cho trong yêu cầu; không có tên thì gọi "bạn", không dùng tên riêng nào khác. Không nêu tên vị trí, tên tầng hay tên ô của trải bài. Lời gửi phải ĐỌC LẠI THÔNG ĐIỆP của chính trải bài cho đúng câu hỏi: tổng hợp nghĩa thật của các lá được cho thành một mạch chuyện liền — chuyện đang diễn ra thế nào → gốc rễ/điều đang cản hoặc đẩy → hướng sắp tới → điều nên làm. Mỗi câu phải bắt nguồn từ nghĩa của ít nhất một lá, có chi tiết cụ thể (người, việc, cảm xúc, thời điểm); cấm câu sáo dùng được cho mọi khách. Viết lời gửi bằng tiếng Việt CÓ DẤU đầy đủ: văn xuôi, độ dài và số đoạn theo dòng "ĐỘ DÀI LỜI GỬI" trong yêu cầu (câu hỏi nhiều mốc thì trả lời đủ từng mốc), các đoạn cách nhau một dòng trống; giọng tự nhiên, ấm, có chiều sâu; trả lời thẳng đúng câu hỏi; kết bằng một lời khuyên làm được ngay. KHÔNG nêu tên bất kỳ lá nào, KHÔNG giải nghĩa từng lá, KHÔNG gạch đầu dòng, KHÔNG đánh số, KHÔNG tiêu đề, KHÔNG in đậm, không emoji. Không nhắc tới web, ứng dụng, AI, công cụ, máy, hệ thống, thuật toán, sự ngẫu nhiên hay mã khoá. Câu thứ hai phải trả lời thẳng câu hỏi (câu hỏi có/không thì nói rõ nghiêng về có hay không). Chỉ dùng ý hợp ngữ cảnh: khách hỏi về một người cụ thể thì bỏ ý dành cho người độc thân; khách độc thân thì bỏ ý về mối quan hệ hiện tại; làm thuê ↔ kinh doanh cũng vậy. Sau câu trả lời thẳng, MỌI câu phải cùng chiều với nó: đã nói còn/có thì không câu nào nói chia tay, tan vỡ, người mới hay thất bại; đã nói nghiêng về không thì không câu nào hứa chắc thành. Lá cản trở vẫn được nói, nhưng như điều đang che hoặc làm chậm câu trả lời, không phải ý đảo ngược. Chỉ trả về đúng phần lời gửi.`;

export const dongGoiKhach = (tenKhach) => (tenKhach ? `GỌI KHÁCH: gọi đúng tên “${tenKhach}”, không dùng tên nào khác.` : `GỌI KHÁCH: không có tên — gọi “bạn”, không dùng tên riêng nào.`);
export function yeuCauVietLai(session, reading, loi, tenKhach = tenKhachCua(session), db = null, rule = null) {
  const nghia = db ? khoiNghiaChoAI(db, session, rule) : [reading?.tong_quan, reading?.tong_ket].filter(Boolean).join("\n");
  return `${dongGoiKhach(tenKhach)}\nCÂU HỎI: ${session.cauHoi}\n${dongDoDai(session)}\n\n${nghia}\n\n(Tên lá, tên tầng, tên vị trí ở trên chỉ để bạn nắm ý — KHÔNG chép vào lời gửi.)\n\nBản lời gửi trước bị trả lại vì: ${loi.join("; ")}. Hãy viết lại lời gửi khách đúng mọi yêu cầu, đọc ra thông điệp riêng của trải này.`;
}

// call(system, text) → Promise<string>: gọi AI dạng chữ (đã qua cổng kiểm dấu)
// tenKhach: tên khách của lượt này; xungHo: tên xưng hô đã lưu (bị chặn trong lời gửi nếu khác tenKhach)
export async function chotLoiGuiKhach({ db, session, rule, reading = null, tenKhach, xungHo = "", call = null }) {
  const ten = tenKhachCua(session, { tenKhach });
  const opts = { tenKhach: ten, xungHo, session };
  const luat = () => loiGuiKhachLuat(db, session, rule, { tenKhach: ten });
  const first = String(reading?.loi_gui_khach || "").trim();
  const k1 = kiemLoiGuiKhach(first, db, opts);
  if (k1.ok) return { text: first, nguon: "ai", loi: [], canhBao: k1.canhBao };
  if (first && call) {
    try {
      const again = String(await call(SYSTEM_LGK, yeuCauVietLai(session, reading, k1.loi, ten, db, rule)) || "").trim();
      const k2 = kiemLoiGuiKhach(again, db, opts);
      if (k2.ok) return { text: again, nguon: "ai-viet-lai", loi: k1.loi, canhBao: k2.canhBao };
      return { text: luat(), nguon: "luat", loi: k2.loi, canhBao: [] };
    } catch (e) {
      if (e?.name === "AbortError") throw e;
    }
  }
  return { text: luat(), nguon: "luat", loi: first ? k1.loi : ["AI trả trống"], canhBao: [] };
}
