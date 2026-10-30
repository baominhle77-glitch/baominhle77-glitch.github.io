// window.BoiAuto: giải tự động một câu hỏi để lấy ô "Lời gửi khách".
// Dùng đúng cơ chế xáo/khoá hiện có: mỗi câu một seed 32 byte mới (crypto.getRandomValues), mỗi tầng xáo riêng,
// mã khoá SHA-256 có trước khi chọn lá; vị trí lá úp chọn bằng crypto.getRandomValues. Gọi nhiều câu thì xếp hàng,
// câu nào xong câu đó, mỗi câu một kết quả độc lập.
import { createSession, addPickedRound, ensureMapping } from "./state.js";
import { spreadById, SPREADS, defaultYear } from "./spreads.js";
import { suggestSpread, detectTopics } from "./topic.js";
import { analyze } from "./insight.js";
import { chotLoiGuiKhach, doDaiLgk, demChu, kiemLoiGuiKhach, yeuCauVietDaiThem, SYSTEM_LGK } from "./loi.js";
import { goiCoDau, SYSTEM_GON, gonRequest, partialJSON, phanLoaiLoiAI, LOCAL_KEY, GON_MAX_TOKENS, GON_MAX_TOKENS_DAI } from "./ai.js";

// k vị trí khác nhau trong 1..n, đều, không lệch (loại bỏ phần dư)
export function viTriNgauNhien(n, k, rand = globalThis.crypto) {
  const out = new Set();
  const buf = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / n) * n;
  while (out.size < Math.min(k, n)) {
    rand.getRandomValues(buf);
    if (buf[0] < limit) out.add((buf[0] % n) + 1);
  }
  return [...out];
}

// ---------- Chốt câu hỏi thật của khách trước khi trải (lệnh 28/10, mẫu sửa số 3) ----------
// Không trải: lời gọi/giục ("ai à", "alo", "ok", "?", "shop ơi"), dưới 4 từ mà không có chủ đề, hỏi về shop/AI/giá,
// tâm sự chưa thành câu hỏi. Đòi hoàn tiền và ý tự hại thì không trải mà chuyển Chủ tịch (như trang đào tạo).
export const HOI_LAI = "Câu hỏi bạn muốn hỏi là gì ạ? Bạn viết rõ giúp shop";
export const CAU_GIU = "Bạn đợi mình chút nhé.";
const RE_GOI = /^(?:(?:ai|ad|admin|shop|chị|anh|em|bạn|bé|cô|chú|mọi người|có ai|ai đó)(?: ơi| à| ạ| đâu| không| hả| đó)*|alo+|a lô|al+o|ok+|oke+|okay|okie|ừ+|ừm+|uh+|ờ+|dạ+|vâng|ạ|hello|helo|hi|hey|chào(?: shop| chị| anh| bạn| em)?|xin chào|hihi+|haha+|hehe+|nhanh lên|lẹ lên|nhanh nha|sao rồi|rồi sao|thế nào rồi|ai vậy|ai thế|có ai không|còn đó không|online không|rep đi|trả lời đi)$/iu;
const RE_HOI_SHOP = /(?<![\p{L}])(?:bot|chatbot|trả lời tự động|tự động|máy trả lời|bốc tay|ai bốc|ai trải|ai xem bài|người thật|chuyển khoản|số tài khoản|stk|bớt cho|giảm giá|bói thử|miễn phí|lừa đảo|lừa tiền|không lừa|uy tín không|hỏi thêm một câu|ngoài gói|không tính tiền|gói (?:\d+|mấy|bao nhiêu) câu|giá (?:gói|bói|xem|một câu|1 câu|vậy|này|cao|đắt)|nói nhảm)(?![\p{L}])/iu;
const RE_AI = /(?<![\p{L}])(?:(?:là|phải|hay|dùng|bằng|hoặc)\s+AI|AI\s+(?:trả lời|bói|trải|viết|nhắn|à|hả|ạ))(?![\p{L}])/iu;
const RE_AI_HOI = /(?<![\p{L}])(?:là|phải|có phải|hay)(?![\p{L}])[^?]{0,12}(?<![\p{L}])(?:ai|AI|bot|máy)(?![\p{L}])/u;
const RE_HOAN_TIEN = /(?<![\p{L}])(?:hoàn tiền|hoàn lại tiền|trả lại tiền|trả tiền lại|refund|đòi lại tiền)(?![\p{L}])/iu;
const RE_TU_HAI = /(?:(?:không|chẳng|chả)(?: còn)? (?:thiết|muốn) sống|muốn chết|tự tử|tự sát|quyên sinh|kết thúc cuộc đời|tự làm hại|tự hại|không muốn tồn tại)/iu;
const RE_CHUA_HOI = /không biết (?:mình |em |tôi )?(?:muốn |nên )?hỏi gì|nghe (?:em|mình|tôi) kể/iu;
const gon = (q) => String(q || "").toLowerCase().normalize("NFC").replace(/[^\p{L}\p{N}\s]+/gu, " ").replace(/\s+/g, " ").trim();
// chủ đề thật (dạng câu "có … không" không tính là chủ đề)
const coChuDe = (q) => { const t = detectTopics(q); return ["tien", "tinh", "viec", "suckhoe", "vanhan", "nam", "ba_thang"].some((k) => t[k]); };
const boHet = (re, q) => q.replace(new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g"), " ");
// → { ok, lyDo, chuyen }  (chuyen: đòi hoàn tiền / ý tự hại → chuyển Chủ tịch)
export function laCauHoiBoi(cauHoi) {
  const q = String(cauHoi || "").trim();
  const g = gon(q);
  if (RE_TU_HAI.test(q)) return { ok: false, chuyen: true, lyDo: "khách có ý tự hại" };
  if (RE_HOAN_TIEN.test(q)) return { ok: false, chuyen: true, lyDo: "khách đòi hoàn tiền" };
  if (!g) return { ok: false, lyDo: "không có chữ" };
  if (RE_GOI.test(g)) return { ok: false, lyDo: "chỉ là lời gọi/giục" };
  if ((RE_HOI_SHOP.test(q) || RE_AI.test(q)) && !coChuDe(boHet(RE_AI, boHet(RE_HOI_SHOP, q)))) return { ok: false, lyDo: "hỏi về shop/AI/giá" };
  if (RE_AI_HOI.test(q) && /(?<![\p{L}])(?:bạn|shop|chị|anh|em|ad|bên)(?![\p{L}])/u.test(q) && !coChuDe(q)) return { ok: false, lyDo: "hỏi về shop/AI/giá" };
  if (RE_CHUA_HOI.test(q)) return { ok: false, lyDo: "tâm sự chưa thành câu hỏi" };
  if (g.split(" ").length < 4 && !coChuDe(q)) return { ok: false, lyDo: "dưới 4 từ, không rõ chủ đề" };
  return { ok: true, lyDo: "" };
}

// Tách tin khách thành các câu hỏi: theo dòng, theo đánh số (1. 2) Câu 3:), theo dấu "?". Đoạn không phải câu hỏi
// (kể chuyện) ghép vào câu hỏi ngay sau làm bối cảnh; lời gọi và câu dẫn ("em hỏi 2 câu:") bỏ đi.
const RE_DANG_HOI = /(?:\?|(?<![\p{L}])(?:không|chưa|sao|thế nào|ra sao|bao giờ|khi nào|nào|gì|mấy|bao nhiêu|được không|nhỉ|hả|à)\s*[.!]*)$/iu;
const RE_CAU_DAN = /^(?:(?:em|mình|tôi|cho em|cho mình|cho tôi)\s+)?(?:xin\s+)?(?:hỏi|có)\s+(?:\d+|hai|ba|bốn|năm|vài|mấy)\s+câu\b.*$|:\s*$/iu;
export function tachCauHoi(text) {
  const doan = String(text || "")
    .replace(/(?:^|\s)(?:câu\s*)?\d{1,2}\s*[.):/-]\s+/giu, "\n")
    .replace(/\?\s*/g, "?\n")
    .split(/\n+/).map((x) => x.trim()).filter(Boolean);
  const cau = [];
  let boiCanh = "";
  for (const d of doan) {
    if (RE_GOI.test(gon(d)) || RE_CAU_DAN.test(d)) continue;
    if (RE_DANG_HOI.test(d)) { cau.push(`${boiCanh}${d}`.trim()); boiCanh = ""; }
    else boiCanh += `${/[.!…]$/u.test(d) ? d : `${d}.`} `;
  }
  const du = boiCanh.trim();
  // không có câu nào dạng hỏi → cả tin là một yêu cầu (vd "Xem giúp em 12 tháng năm 2027"); phần dư có chủ đề thì là một câu
  if (du && (!cau.length || coChuDe(du))) cau.push(du.replace(/\.$/u, ""));
  return cau;
}

// Khách không chọn kiểu trải: agent tự chọn theo câu hỏi ("tu-chon", mặc định). Vẫn nhận "1la" | "3la" | id mẫu trải
// khi truyền tường minh (để test).
export function chonTrai(cauHoi, trai = "tu-chon") {
  if (!trai || trai === "tu-chon" || trai === "auto") return spreadById(suggestSpread(cauHoi).id);
  const sp = SPREADS.find((x) => x.id === trai);
  if (!sp) throw new Error(`Không có mẫu trải "${trai}". Dùng: ${SPREADS.map((x) => x.id).join(", ")}, tu-chon.`);
  return sp;
}

// Tham số trải do agent tự điền, không hỏi khách: năm (câu hỏi nêu năm thì theo năm đó, không thì năm mặc định),
// bảng tiền (mẫu trải tiền hoặc câu hỏi về tiền), tên tầng Có/Không và trải tự do đặt theo chính câu hỏi.
export function thamSoTrai(cauHoi, sp, goiY = suggestSpread(cauHoi)) {
  const nam = sp.needsYear ? (goiY.year >= 1900 && goiY.year <= 2200 ? goiY.year : defaultYear()) : null;
  let tiers = sp.tiers(nam || defaultYear()).map((t) => ({ ...t }));
  const cau = cauHoi.trim().replace(/\s+/g, " ").slice(0, 120);
  if (sp.id === "cokhong") tiers = [cau, "Làm theo hướng đó thì có thuận không?", "Kết quả có giữ được lâu không?"].map((ten, i) => ({ ...tiers[i], ten }));
  if (sp.id === "tudo") tiers = [{ ten: cau, t: 3, l: 3, pos: ["Hiện trạng", "Diễn biến", "Kết quả"] }];
  return { tiers, nam, money: !!(sp.money || goiY.money) };
}

// tenKhach: tên khách của riêng câu này (trống = gọi "bạn"); settings.xungHo KHÔNG được dùng để gọi khách
// trai: mặc định "tu-chon" — mỗi câu (kể cả nhiều câu trong một gói) tự chọn trải riêng theo nội dung câu đó
// AI_THU_LAI: số lượt gọi AI tối đa (mỗi lượt đã gồm chuỗi cầu nối → thử lại → trạm → cứu cầu nối); giữa hai lượt chờ thuLaiMs.
// Bot chỉ gửi khách khi nguon là "ai"/"ai-viet-lai" → phải cố ra bản AI trước khi trả bản luật.
export const AI_THU_LAI = { lan: 2, ms: 3000 };
// Ngân sách thời gian tới khi ô Lời gửi khách đầy đủ (GĐ 30/10): lượt "viết dài thêm" chỉ chạy khi còn kịp trong ngân sách
export const NGAN_SACH_LGK = { ms: 30000, du: 1500 };

// ---- Lời gửi khách bằng "bản giải gọn" — MỘT hàm dùng chung cho bot BoiAuto và ô Lời gửi khách trên web ----
// Chỉ Claude qua cầu nối (no_luc=low, lược đồ gọn, ≤ 4096 token); cổng chỉ chặn lỗi cứng, lỗi mềm thành cảnh báo.
// Bản luật chỉ khi AI lỗi mạng/trống (hoặc lỗi cứng cả sau lượt viết lại). onText(chữ lời gửi đang chảy).
// → { text, nguon: "ai"|"ai-viet-lai"|"luat", lyDo, moHinh, canhBao[], tongKet, traLoi }
export async function giaiLoiGuiKhach({ db, session: s, rule, settings = {}, key = LOCAL_KEY, fetchImpl, storage, signal, onText, thuLai = AI_THU_LAI.lan, thuLaiMs = AI_THU_LAI.ms, nganSachMs = NGAN_SACH_LGK.ms }) {
  const caiDat = { ...settings, xungHo: s.tenKhach || "bạn" };
  const t0 = Date.now();
  const doDai = doDaiLgk(s);
  // câu nhiều mốc cần nhiều chỗ ra hơn (600–800 chữ + khung JSON)
  const maxTokens = doDai.nhieu ? GON_MAX_TOKENS_DAI : GON_MAX_TOKENS;
  let obj = null, moHinh = "", moHinhVietLai = "", aiLoi = "", cuu = "", lgk = null, msLuot = 0;
  const call = key ? (system, text) => goiCoDau({ provider: "gemini", key, system, json: false, gon: true, maxTokens, messages: [{ role: "user", text }], fetchImpl, storage, signal })
    .then((r) => { moHinhVietLai = r.moHinh || r.model || ""; return r.text; }) : null;
  const chay = (full) => {
    const t = partialJSON(full)?.loi_gui_khach;
    if (typeof t === "string" && t) onText?.(t);
  };
  for (let lan = 1; lan <= (key ? Math.max(1, thuLai) : 1); lan++) {
    if (lan > 1) await new Promise((r) => setTimeout(r, thuLaiMs));
    if (signal?.aborted) throw new DOMException("aborted", "AbortError");
    if (key) {
      const tLuot = Date.now();
      try {
        const res = await goiCoDau({
          provider: "gemini", key, json: true, gon: true, maxTokens, fetchImpl, storage, signal,
          system: SYSTEM_GON,
          messages: [{ role: "user", text: gonRequest(db, s, { reading: rule, money: rule._money, settings: caiDat }) }],
          onText: onText ? chay : undefined,
        });
        cuu = res.cuu || "";
        msLuot = Date.now() - tLuot;
        const o = partialJSON(res.text);
        if (o && String(o.loi_gui_khach || "").trim()) { obj = o; moHinh = res.moHinh || res.model || ""; aiLoi = ""; }
        else aiLoi = "AI trả trống";
      } catch (e) {
        if (e?.name === "AbortError") throw e;
        aiLoi = e.cuu || `AI lỗi: ${phanLoaiLoiAI(e, key)}`;
      }
    }
    lgk = await chotLoiGuiKhach({ db, session: s, rule, reading: obj ? { loi_gui_khach: String(obj.loi_gui_khach) } : null, tenKhach: s.tenKhach, xungHo: settings.xungHo || "", call: obj ? call : null });
    if (lgk.nguon !== "luat") break;
  }
  // Câu nhiều mốc mà bản AI vẫn ngắn hơn mức tối thiểu → một lượt "viết dài thêm" duy nhất, CHỈ khi còn kịp
  // trong ngân sách (ước lượt sau mất ngang lượt vừa rồi). Không kịp hoặc lượt thêm lỗi → giữ bản đang có (cảnh báo mềm).
  let vietDai = "";
  if (key && lgk.nguon !== "luat" && doDai.nhieu && demChu(lgk.text) < doDai.min) {
    const conLai = nganSachMs - (Date.now() - t0);
    if (conLai - NGAN_SACH_LGK.du >= Math.max(msLuot, 1)) {
      try {
        const res = await goiCoDau({
          provider: "gemini", key, json: false, gon: true, maxTokens, fetchImpl, storage, signal, system: SYSTEM_LGK,
          messages: [{ role: "user", text: yeuCauVietDaiThem(s, lgk.text, s.tenKhach || "", db, rule) }],
          onText: onText ? (full) => onText(full) : undefined,
        });
        const moi = String(res.text || "").trim();
        const k = kiemLoiGuiKhach(moi, db, { tenKhach: s.tenKhach || "", xungHo: settings.xungHo || "", session: s });
        if (k.ok && demChu(moi) > demChu(lgk.text)) {
          lgk = { ...lgk, text: moi, canhBao: k.canhBao };
          moHinh = res.moHinh || res.model || moHinh;
          if (lgk.nguon === "ai-viet-lai") moHinhVietLai = moHinh;
          vietDai = "đã viết dài thêm 1 lượt";
        } else vietDai = k.ok ? "lượt viết dài thêm không dài hơn — giữ bản cũ" : `lượt viết dài thêm lỗi cứng (${k.loi.join("; ")}) — giữ bản cũ`;
      } catch (e) {
        if (e?.name === "AbortError") throw e;
        vietDai = "lượt viết dài thêm lỗi — giữ bản cũ";
      }
    } else vietDai = "không đủ thời gian viết dài thêm";
    if (vietDai && !/^đã/u.test(vietDai)) lgk = { ...lgk, canhBao: [...(lgk.canhBao || []), vietDai] };
  }
  const moHinhLoi = lgk.nguon === "ai" ? moHinh : lgk.nguon === "ai-viet-lai" ? (moHinhVietLai || moHinh) : "";
  const lyDo = lgk.nguon === "luat"
    ? (obj ? `${cuu ? `${cuu}; ` : ""}lỗi cứng sau khi viết lại: ${lgk.loi.join("; ")}` : key ? (aiLoi || "AI lỗi: không rõ") : "không gọi AI")
    : cuu;
  if (lyDo && key) console[lgk.nguon === "luat" ? "warn" : "info"]("[loi-gui-khach]", lgk.nguon === "luat" ? "bản theo luật vì:" : "đường AI:", lyDo);
  if (lgk.canhBao?.length) console.info("[loi-gui-khach] cảnh báo nhẹ (vẫn dùng bản AI):", lgk.canhBao.join("; "));
  return { text: lgk.text, nguon: lgk.nguon, lyDo, moHinh: moHinhLoi, canhBao: lgk.canhBao || [], tongKet: String(obj?.tong_ket || ""), traLoi: obj?.tra_loi || null, vietDai, giay: Math.round((Date.now() - t0) / 100) / 10 };
}

// Bot: gửi khách khi nguon "ai" / "ai-viet-lai" (kể cả khi chỉ có cảnh báo mềm); "luat" thì không gửi.
// moHinh = modelVersion của bên đã viết lời gửi (claude-haiku-5-5 …), "" khi bản luật.
export async function giaiTuDong({ db, cauHoi, trai = "tu-chon", nguoc = false, tenKhach = "", settings = {}, key = null, fetchImpl, storage, onSession, thuLai = AI_THU_LAI.lan, thuLaiMs = AI_THU_LAI.ms, nganSachMs = NGAN_SACH_LGK.ms }) {
  const q = String(cauHoi || "").trim();
  if (!db) throw new Error("Bộ bài chưa tải xong.");
  // chưa phải câu hỏi bói → hỏi lại khách (hoặc chuyển Chủ tịch), không bốc lá
  const kt = laCauHoiBoi(q);
  if (!kt.ok) return kt.chuyen
    ? { chuyenNguoi: true, canHoiLai: false, loiGuiKhach: CAU_GIU, nguon: "chuyen", lyDo: kt.lyDo, maKhoa: null, trai: null, phien: null, tenKhach: String(tenKhach || "").trim() }
    : { canHoiLai: true, loiGuiKhach: HOI_LAI, nguon: "hoi-lai", lyDo: kt.lyDo, maKhoa: null, trai: null, phien: null, tenKhach: String(tenKhach || "").trim() };
  const goiY = suggestSpread(q);
  const sp = chonTrai(q, trai);
  const tuChon = sp.id === goiY.id && (!trai || trai === "tu-chon" || trai === "auto");
  const lyDoTrai = tuChon ? goiY.why : `trải được chỉ định: ${sp.ten}`;
  const ts = thamSoTrai(q, sp, goiY);
  const s = await createSession({ cauHoi: q, tenKhach, spreadId: sp.id, tiers: ts.tiers, money: ts.money, reversals: !!nguoc, nam: ts.nam });
  const caiDat = { ...settings, xungHo: s.tenKhach || "bạn" };
  await ensureMapping(s, 0);
  addPickedRound(s, s.tiers.map((t) => ({ tarot: viTriNgauNhien(78, t.t), lenormand: viTriNgauNhien(36, t.l) })));
  const rule = analyze(db, s, caiDat, 0);
  const r = await giaiLoiGuiKhach({ db, session: s, rule, settings, key, fetchImpl, storage, thuLai, thuLaiMs, nganSachMs });
  // web mở phiên này: ô Lời gửi khách hiện đúng bản bot đã gửi; phần giải chi tiết tự giải đầy đủ khi người bấm
  s.lgk = { text: r.text, nguon: r.nguon, lyDo: r.lyDo, moHinh: r.moHinh, canhBao: r.canhBao, at: new Date().toISOString(), rounds: s.rounds.length };
  s.tuDong = true;
  onSession?.(s);
  return { loiGuiKhach: r.text, maKhoa: s.hash, nguon: r.nguon, moHinh: r.moHinh, lyDo: r.lyDo, canhBao: r.canhBao, vietDai: r.vietDai, giay: r.giay, trai: sp.id, tenTrai: sp.ten, lyDoTrai, phien: s.id, tenKhach: s.tenKhach };
}

// Hàng đợi: lời gọi sau chờ lời gọi trước xong (kể cả khi lời trước lỗi)
export function taoBoiAuto(ctx) {
  let hang = Promise.resolve();
  const giai = (cauHoi, opts = {}) => {
    const job = hang.then(async () => giaiTuDong({ ...(await ctx()), cauHoi, ...opts }));
    hang = job.catch(() => {});
    return job;
  };
  // Một tin của khách theo gói: tách đúng soCau câu hỏi đầu để trải (mỗi câu tự chọn trải riêng); câu thừa ghi ra để
  // trang đào tạo báo; không có câu hỏi bói nào thì hỏi lại; đòi hoàn tiền/ý tự hại thì chuyển Chủ tịch.
  const giaiGoi = async (tin, { soCau = Infinity, ...opts } = {}) => {
    const kt = laCauHoiBoi(tin);
    if (kt.chuyen) return { chuyenNguoi: true, lyDo: kt.lyDo, loiGuiKhach: CAU_GIU, cau: [], thua: [] };
    const hop = tachCauHoi(tin).filter((q) => laCauHoiBoi(q).ok);
    if (!hop.length) return { canHoiLai: true, lyDo: kt.lyDo || "chưa thấy câu hỏi bói", loiGuiKhach: HOI_LAI, cau: [], thua: [] };
    const n = Math.max(0, Math.floor(Number(soCau)));
    const lay = Number.isFinite(n) ? hop.slice(0, n) : hop;
    const cau = [];
    for (const q of lay) cau.push({ cauHoi: q, ...(await giai(q, opts)) });
    return { cau, thua: hop.slice(lay.length) };
  };
  return { giai, giaiGoi };
}
