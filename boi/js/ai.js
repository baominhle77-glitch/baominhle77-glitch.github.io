// Lớp AI. Mặc định gọi trạm AI (Google Apps Script) — khoá Gemini nằm ở trạm, trang web không giữ khoá nào,
// người dùng không phải cài hay nhập gì. Trạm tự chuyển model khi 429/404/5xx, không stream.
// Nhánh cầu nối 127.0.0.1 (và khoá riêng) chỉ còn là lựa chọn ẩn: tự dò model, JSON có cấu trúc + streaming.
import { cardName, tarotCard, lenCard } from "./reading.js";
import { spreadById, posLabel, posKey } from "./spreads.js";
import { cardYesNo } from "./data.js";
import { drawsOf } from "./state.js";

// Cầu nối máy nhà: tiến trình ở 127.0.0.1 tự gắn khoá Gemini từ tệp .env trên máy, trang không giữ khoá.
export const LOCAL_KEY = "@may-nha";
// Trạm AI mặc định: POST text/plain (không preflight CORS) → {ok, model, data} hoặc {ok:false, status, error}
export const TRAM_KEY = "@tram";
export const TRAM_URL = "https://script.google.com/macros/s/AKfycbzP8FRrraCnXh1mXJqvlR-FwoSJ5brshRFbWP_fj4MbzsX0bGT67M_Ot2GgirMpBIjW/exec";
export const TRAM_MODEL = "gemini-flash-latest";
const TRAM_TIMEOUT = 60000;
export const LOCAL_BASE = "http://127.0.0.1:8787/gemini";
// Cầu nối máy nhà: trên máy chủ nhân gọi thẳng 127.0.0.1; ở máy khác (điện thoại) đi qua đường hầm kèm mã ghép
export const via = { base: LOCAL_BASE, token: "" };
const gBase = (key) => (key === LOCAL_KEY ? via.base : "https://generativelanguage.googleapis.com");
const gHead = (key) => (key === LOCAL_KEY ? (via.token ? { "x-boi-token": via.token } : {}) : { "x-goog-api-key": key });

export const PROVIDERS = {
  gemini: { ten: "Google Gemini", fallback: ["gemini-pro-latest", "gemini-flash-latest", "gemini-flash-lite-latest", "gemini-2.5-flash"] },
  openai: { ten: "OpenAI", fallback: ["gpt-5", "gpt-4.1", "gpt-4o", "gpt-4o-mini"] },
  anthropic: { ten: "Anthropic Claude", fallback: ["claude-opus-5-5", "claude-sonnet-5-5", "claude-opus-4-1", "claude-sonnet-4-5"] },
};

// ---------- Khuôn JSON (cùng khuôn với động cơ luật) ----------
const S = { type: "STRING" }, N = { type: "NUMBER" }, A = { type: "ARRAY", items: { type: "STRING" } };
const TIER_PROPS = { ten: S, diem: N, tra_loi: S, tarot_doc: A, dong_chay: S, lenormand_cap: A, lenormand_bo_ba: A, lenormand_chuoi: S, lech: S, chot: S, diem_nghen: S, loi_khuyen: S };
const ROOT_PROPS = { tong_quan: S, chu_de_troi: A, tang: { type: "ARRAY", items: { type: "OBJECT", properties: TIER_PROPS, required: ["ten", "diem", "tarot_doc", "dong_chay", "lenormand_cap", "chot", "diem_nghen", "loi_khuyen"], propertyOrdering: Object.keys(TIER_PROPS) } }, noi_tang: A, mau_thuan: A, tien: S, tong_ket: S, loi_khuyen: A, canh_bao: A };
export const SCHEMA = { type: "OBJECT", properties: ROOT_PROPS, required: ["tong_quan", "chu_de_troi", "tang", "noi_tang", "mau_thuan", "tong_ket", "loi_khuyen"], propertyOrdering: Object.keys(ROOT_PROPS) };

// Văn phong rút từ bài giải của reader thật (Biddy Tarot, Labyrinthos, The Tarot Lady, reader chọn tụ…) — xem boi/VAN_PHONG_READER.md
export const SYSTEM_READING = `Bạn là một tarot reader lão luyện hơn 20 năm, đọc cả Tarot lẫn Lenormand, đang ngồi đối diện người hỏi. Bạn LUÔN viết bằng tiếng Việt tự nhiên (kể cả khi kiến thức gốc của bạn là tiếng Anh): gọi tên lá bằng tiếng Việt, có thể kèm tên tiếng Anh trong ngoặc ở lần đầu.

NGUYÊN TẮC BẤT DI BẤT DỊCH
- Chỉ dùng đúng các lá đã lật được cung cấp. Không thêm, bớt, đổi lá, không đổi chiều xuôi/ngược. Ô trống (số không hợp lệ chưa thay) thì không bịa lá.
- Mỗi tầng được xáo lại từ đủ bộ (78 Tarot + 36 Lenormand) trước khi rút, nên một lá CÓ THỂ ra ở nhiều tầng. Lá được đánh dấu "RA LẠI" là rút độc lập mà vẫn quay lại → gọi rõ đó là CHỦ ĐỀ LẶP LẠI xuyên các tháng/giai đoạn và nói nó đòi hỏi điều gì. (Chỉ lá đánh dấu "LÁ LẶP CÙNG SỐ" mới là cùng bộ — khi đó chỉ là nhấn mạnh, không phải xác nhận độc lập.)
- Mọi con số tiền lấy đúng từ bảng quy đổi được cung cấp; nói rõ là quy đổi huyền học, không phải dự báo tài chính. Sức khoẻ, pháp lý: khuyên hỏi người có chuyên môn.
- Không hứa chắc chắn; nêu điều kiện. Câu Có/Không của một lá phụ thuộc câu hỏi (ví dụ 4 Tiền: hỏi "giữ/tiết kiệm" thì nghiêng Có, hỏi "chi/đầu tư/thay đổi" thì nghiêng Không) — không gán một câu trả lời cố định cho lá. Có lá báo gian dối/hao hụt (Mặt Trăng, 7 Kiếm, Ác Quỷ, 5 Kiếm, Con Cáo, Con Rắn, Con Chuột, Mây Đen…) mà câu hỏi liên quan tiền thì cảnh báo lừa đảo cụ thể, thực tế.

CÁCH ĐỌC (như reader thật, không như từ điển)
1. Mở bài ("tong_quan"): gọi người hỏi theo xưng hô được cho, nhắc lại câu hỏi bằng lời đời thường, rồi nói ngay cảm giác chung của cả trải và kết luận sơ bộ trong 2–3 câu.
2. Đọc lần lượt TỪNG TẦNG như một chương. Tarot theo VỊ TRÍ: mỗi câu trong "tarot_doc" gọi tên lá + một chi tiết hình ảnh có thật trên lá (bộ Rider–Waite–Smith; ví dụ 9 Kiếm: người ngồi bật dậy giữa đêm, chín thanh kiếm treo sau lưng) rồi nói lá đó nghĩa gì ĐÚNG ở vị trí ấy và cho câu hỏi này. Không chắc chi tiết hình thì đừng tả. Lá sau nối với lá trước ("sau cái gồng của 7 Gậy, Vua Gậy là lúc bạn cầm lái") — không liệt kê rời rạc.
3. "dong_chay": kể chuyện cả tầng thành một đoạn: mở ra sao, ngoặt ở đâu, kết thế nào; kết quả và tín hiệu có khớp không.
4. Lenormand đọc thành CÂU: theo CẶP (lá trước = chủ thể, lá sau = tính chất), BỘ BA (lá giữa là bản lề, hai đầu soi nhau), CẢ CHUỖI (lá đầu = điểm khởi, lá cuối = hướng kết) — nói bằng câu đời thường về đúng chủ đề hỏi.
5. Chỉ nêu mối nối có ý nghĩa thật: chất trội, tỉ lệ Ẩn chính/Ẩn phụ, lá người, số lặp, lá cản, lá tiền, hướng nhân vật nhìn. Đừng cố nối những thứ không thêm ý nghĩa.
6. "noi_tang": nối các chương — tầng nào kéo tầng nào, bước ngoặt, tầng mạnh/yếu nhất, lá ra lại ở nhiều tầng (chủ đề lặp lại).
7. "mau_thuan": Tarot nói một đằng Lenormand một nẻo, tầng điểm cao mà có lá gian dối, kết quả tốt mà tín hiệu yếu… nói rõ trong đời thực nghĩa là gì.
8. Chấm điểm từng tầng x/10 (bước 0,5) dựa trên lá, có thể khác bản nháp luật nếu có lý do; với câu hỏi Có/Không ghi rõ CÓ / CÓ CÓ ĐIỀU KIỆN / NGHIÊNG KHÔNG / KHÔNG.
9. "chot" 1–2 câu chốt hạ; "diem_nghen" là nút thắt cụ thể; "loi_khuyen" phải làm được ngay (hành động, thời điểm, con số, người cần hỏi).
10. "tong_ket": kết luận chung cho cả trải — gọi người hỏi theo xưng hô, nói thẳng kết luận trước rồi điều kiện, khép bằng một việc cụ thể nên làm đầu tiên.

GIỌNG VĂN
- Ấm, thẳng, như người có nghề đang nói chuyện: dùng "bạn" hoặc xưng hô được cho; lá khó thì nói cái khó trước, rõ ràng, không doạ, rồi chỉ lối ra. Không nịnh, không thổi kết quả.
- Câu ngắn dài xen kẽ, cụ thể, có hình ảnh; không lặp ý giữa các mục.
- CẤM sáo rỗng kiểu AI: "hành trình", "vũ trụ gửi thông điệp", "năng lượng tích cực sẽ đến", "điều quan trọng là", "hãy nhớ rằng", "hãy cân nhắc kỹ lưỡng", "mọi chuyện sẽ ổn", "chắc chắn rồi", câu kết kiểu khẩu hiệu, mọi câu đều ba vế cân nhau.
- Không emoji, không markdown trong giá trị JSON.`;

export const SYSTEM_CHAT = `Bạn là tarot reader lão luyện đang tiếp tục cùng một phiên bói (cùng một câu hỏi). Bạn nhớ toàn bộ các lá đã lật và các lần giải trước được cung cấp. Luôn trả lời bằng tiếng Việt, giọng ấm và thẳng như đang ngồi đối diện; dẫn đúng tên lá (kèm chi tiết hình ảnh trên lá khi giúp hiểu) và tầng làm căn cứ; không bịa lá mới; lời khuyên cụ thể, làm được ngay; tránh câu sáo rỗng. Lá ra lại ở nhiều tầng (mỗi tầng xáo lại đủ bộ) là chủ đề lặp lại xuyên các tầng. Nếu người hỏi muốn thêm lá, nhắc họ dùng nút "Rút thêm" — bộ bài sẽ được xáo lại hoàn toàn mới. Con số tiền chỉ lấy từ bảng quy đổi (quy đổi huyền học, không phải dự báo tài chính). Được dùng markdown đơn giản (**đậm**, gạch đầu dòng).`;

// ---------- Bối cảnh gửi AI ----------
export function buildContext(db, session, { reading = null, money = null, settings = {} } = {}) {
  const sp = spreadById(session.spreadId);
  const L = [];
  L.push(`XƯNG HÔ: gọi người hỏi là "${settings.xungHo || "Queen Linh"}".`);
  L.push(`CÂU HỎI: ${session.cauHoi}`);
  L.push(`MẪU TRẢI: ${sp.ten}${session.reversals ? " (cho phép lá ngược)" : " (không lá ngược)"}${session.money ? " · câu hỏi về tiền" : ""}.`);
  L.push(`KHOÁ: SHA-256 ${session.hash}, khoá lúc ${session.lockedAtText}.`);
  const draws = drawsOf(session);
  const rep = (c) => (!c.repeatOf ? "" : c.repeatOf.doclap
    ? ` · RA LẠI (đã ra ở ${c.repeatOf.round > 1 ? `lượt ${c.repeatOf.round}, ` : ""}tầng ${c.repeatOf.tier}: ${session.tiers[c.repeatOf.tier - 1]?.ten || ""}) — rút độc lập từ bộ đủ, chủ đề lặp lại`
    : ` · LÁ LẶP CÙNG SỐ (đã ra ở lượt ${c.repeatOf.round} tầng ${c.repeatOf.tier})`);
  session.rounds.forEach((round, ri) => {
    const fresh = draws[round.draw ?? 0]?.kieu === 2;
    const n = Math.max(round.tarot.length, round.lenormand.length);
    L.push("");
    L.push(ri === 0 ? `=== TRẢI CHÍNH (${round.atText}) — ${n} tầng${fresh ? ", mỗi tầng xáo lại từ đủ 78 Tarot + 36 Lenormand" : ", một bộ dùng chung"} ===` : `=== LƯỢT RÚT THÊM #${ri} (${round.atText}) — bộ bài xáo mới ===`);
    for (let ti = 0; ti < n; ti++) {
      const tier = session.tiers[ti] || { ten: `Tầng ${ti + 1}` };
      L.push(`-- Tầng ${ti + 1}/${n}: ${tier.ten}${ri ? " (rút thêm)" : ""} --`);
      (round.tarot[ti] || []).forEach((c, i) => {
        const pos = posLabel(tier, i);
        if (!c.ok) return L.push(`  Tarot [${pos}]: ô trống (số ${c.raw} ngoài khoảng, chưa thay)`);
        const card = tarotCard(db, c.card);
        const k = posKey(pos);
        const yn = sp.mode === "yesno" ? cardYesNo(card, c.rev, session.cauHoi) : null;
        L.push(`  Tarot [${pos}]: ${cardName(db, "tarot", c)} — từ khoá: ${card.tu_khoa}${k ? `; ở vị trí này: ${card.vi_tri[k]}` : ""}${yn ? `; Có/Không theo đúng câu hỏi này: ${yn.tra_loi} (${yn.ly_do})` : ""}${rep(c)}`);
      });
      (round.lenormand[ti] || []).forEach((c, i) => {
        if (!c.ok) return L.push(`  Lenormand ô ${i + 1}: ô trống (số ${c.raw} ngoài khoảng, chưa thay)`);
        const card = lenCard(db, c.card);
        L.push(`  Lenormand ô ${i + 1}: ${cardName(db, "lenormand", c)} — chủ thể: ${card.chu_the}; tính chất: ${card.tinh_chat}${rep(c)}`);
      });
    }
  });
  if (money && money.rows) {
    L.push("");
    L.push(`=== BẢNG QUY ĐỔI TIỀN (triệu đồng; mốc ${money.base} tr/tháng) — giữ nguyên số ===`);
    money.rows.forEach((m) => L.push(`${m.ky} | khoảng ${m.low}–${m.high} | trung tâm ${m.center}`));
    L.push(`Tổng ${money.total}; bình quân ${money.perMonth}/tháng; mạnh nhất ${money.best.ky}; yếu nhất ${money.worst.ky}.${money.target ? ` Mục tiêu ${money.target}/tháng → ${money.targetPct} %, ${money.monthsHit}/${money.rows.length} kỳ chạm.` : ""}${money.prevYear ? ` So năm trước ${money.vsPrevPct} %.` : ""}`);
  }
  if (reading) {
    L.push("");
    L.push("=== BẢN NHÁP CỦA ĐỘNG CƠ LUẬT (tham khảo; bạn được đọc sâu hơn hoặc chấm khác nếu có lý do) ===");
    L.push(`Chủ đề trội: ${reading.chu_de_troi.join(" ")}`);
    reading.tang.forEach((t) => L.push(`${t.ten}: ${t.diem}/10. ${t.dong_chay} Chốt: ${t.chot}`));
    L.push(`Mâu thuẫn: ${reading.mau_thuan.join(" ")}`);
  }
  return L.join("\n");
}

export function readingRequest(db, session, opts) {
  return `${buildContext(db, session, opts)}\n\nHãy giải như một tarot reader thật đang ngồi đối diện người hỏi, hoàn toàn bằng tiếng Việt: mở bài, rồi đọc lần lượt từng tầng (Tarot theo vị trí có tên lá + chi tiết hình ảnh, kể chuyện nối các lá, Lenormand thành câu), rồi nối các tầng (nêu rõ lá nào ra lại ở nhiều tầng là chủ đề lặp lại), rồi kết luận chung. Các lượt rút thêm (nếu có) gộp vào phần nối tầng/tổng kết. Trả về DUY NHẤT một đối tượng JSON đúng khuôn: tong_quan, chu_de_troi[], tang[{ten, diem, tra_loi, tarot_doc[], dong_chay, lenormand_cap[], lenormand_bo_ba[], lenormand_chuoi, lech, chot, diem_nghen, loi_khuyen}], noi_tang[], mau_thuan[], tien, tong_ket, loi_khuyen[], canh_bao[]. Số tầng trong "tang" bằng số tầng của trải chính; tarot_doc có đúng một câu/đoạn cho mỗi lá Tarot theo thứ tự.`;
}

// Bản sao chép dán vào ChatGPT
export function chatGptPrompt(db, session, opts = {}) {
  const extra = opts.followUp ? `\n\n=== CÂU HỎI TIẾP ===\n${opts.followUp}` : "";
  const hist = (session.chat || []).map((m) => `${m.role === "user" ? "Hỏi" : "Đáp"}: ${m.text}`).join("\n\n");
  return `${SYSTEM_READING}\n\n${buildContext(db, session, opts)}${hist ? `\n\n=== HỎI ĐÁP TRƯỚC ĐÓ ===\n${hist}` : ""}\n\nTrình bày: bảng Tầng | Tarot (số → tên lá) | Lenormand (số → tên lá); từng tầng: đọc Tarot theo vị trí, dòng chảy, Lenormand theo cặp → bộ ba → cả chuỗi, điểm x/10, Chốt tầng, điểm nghẽn, lời khuyên; nối các tầng; mâu thuẫn; bảng tiền nếu có; tổng kết + lời khuyên thực tế. Viết hoàn toàn bằng tiếng Việt.${extra}`;
}

// ---------- JSON đang chảy dở → đối tượng tạm ----------
export function partialJSON(text) {
  let s = String(text || "").replace(/^\s*```(?:json)?/i, "").replace(/```\s*$/, "");
  const start = s.indexOf("{");
  if (start < 0) return null;
  s = s.slice(start);
  try { return JSON.parse(s); } catch (_) { /* tiếp tục vá */ }
  const stack = [];
  let inStr = false, esc = false, lastSafe = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === "{" || ch === "[") stack.push(ch === "{" ? "}" : "]");
    else if (ch === "}" || ch === "]") stack.pop();
    if (!inStr && (ch === "," || ch === "{" || ch === "[")) lastSafe = i;
  }
  const close = (str, st) => str + st.slice().reverse().join("");
  // 1) đóng chuỗi đang dở rồi đóng ngoặc
  let attempt = s;
  if (inStr) attempt += esc ? '\\"' : '"';
  try { return JSON.parse(close(attempt.replace(/,\s*$/, ""), stack)); } catch (_) { /* thử cắt về chỗ an toàn */ }
  // 2) cắt về dấu phẩy/ngoặc gần nhất
  const cut = s.slice(0, lastSafe + 1).replace(/,\s*$/, "");
  const st2 = [];
  let inS = false, e2 = false;
  for (const ch of cut) {
    if (inS) { if (e2) e2 = false; else if (ch === "\\") e2 = true; else if (ch === '"') inS = false; continue; }
    if (ch === '"') inS = true;
    else if (ch === "{" || ch === "[") st2.push(ch === "{" ? "}" : "]");
    else if (ch === "}" || ch === "]") st2.pop();
  }
  try { return JSON.parse(close(cut, st2)); } catch (_) { return null; }
}

// ---------- SSE ----------
async function* sse(res) {
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.search(/\r?\n\r?\n/)) >= 0) {
      const block = buf.slice(0, i);
      buf = buf.slice(i).replace(/^\r?\n\r?\n/, "");
      const data = block.split(/\r?\n/).filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim()).join("\n");
      if (data) yield data;
    }
  }
  if (buf.trim().startsWith("data:")) yield buf.trim().slice(5).trim();
}

class HttpError extends Error {
  constructor(status, msg) { super(msg); this.status = status; }
}
async function failOf(res) {
  let msg = `Lỗi ${res.status}`;
  try { const j = await res.json(); msg = j?.error?.message || j?.message || msg; } catch (_) { /* giữ msg */ }
  return new HttpError(res.status, msg);
}

// messages: [{role: "user"|"assistant", text}]
const geminiBody = (system, messages, json) => ({
  systemInstruction: { parts: [{ text: system }] },
  contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.text }] })),
  generationConfig: json ? { responseMimeType: "application/json", responseSchema: SCHEMA, temperature: 0.9 } : { temperature: 0.9 },
});

// Một lượt gọi trạm: trả cả bài một lần; quá thời hạn thì dừng và báo lỗi có cờ timeout
async function tramOnce({ model, system, messages, json, onText, signal, fetchImpl, timeoutMs = TRAM_TIMEOUT }) {
  const ctrl = new AbortController();
  const stop = () => ctrl.abort();
  if (signal?.aborted) ctrl.abort(); else signal?.addEventListener("abort", stop, { once: true });
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; ctrl.abort(); }, timeoutMs);
  try {
    const res = await fetchImpl(TRAM_URL, {
      method: "POST", redirect: "follow", signal: ctrl.signal,
      headers: { "content-type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ model, body: geminiBody(system, messages, json) }),
    });
    let j = null;
    try { j = await res.json(); } catch (_) { /* trạm trả trang lỗi */ }
    if (!j || typeof j !== "object") throw new HttpError(res.ok ? 502 : res.status, "Trạm trả về không đọc được");
    if (!j.ok) throw new HttpError(Number(j.status) || 500, String(j.error || "Trạm lỗi"));
    const text = (j.data?.candidates?.[0]?.content?.parts || []).filter((p) => !p.thought).map((p) => p.text || "").join("");
    if (text) onText?.(text, text);
    return { text, model: String(j.model || model) };
  } catch (e) {
    if (timedOut && !signal?.aborted) { const t = new Error("Trạm quá thời hạn"); t.timeout = true; throw t; }
    throw e;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", stop);
  }
}

async function streamOnce({ provider, model, key, system, messages, json, onText, signal, fetchImpl }) {
  let full = "";
  const push = (t) => { if (t) { full += t; onText?.(full, t); } };
  if (provider === "gemini") {
    const body = geminiBody(system, messages, json);
    const res = await fetchImpl(`${gBase(key)}/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`, {
      method: "POST", signal, headers: { "content-type": "application/json", ...gHead(key) }, body: JSON.stringify(body),
    });
    if (!res.ok) throw await failOf(res);
    for await (const d of sse(res)) {
      try {
        const j = JSON.parse(d);
        if (j.error) throw new HttpError(j.error.code || 500, j.error.message);
        for (const p of j.candidates?.[0]?.content?.parts || []) if (!p.thought) push(p.text);
      } catch (e) { if (e instanceof HttpError) throw e; }
    }
    return full;
  }
  if (provider === "anthropic") {
    const res = await fetchImpl("https://api.anthropic.com/v1/messages", {
      method: "POST", signal,
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
      body: JSON.stringify({ model, max_tokens: 16000, stream: true, system: system + (json ? "\n\nChỉ trả về một đối tượng JSON hợp lệ, không kèm chữ nào khác, không bọc ```." : ""), messages: messages.map((m) => ({ role: m.role, content: m.text })) }),
    });
    if (!res.ok) throw await failOf(res);
    for await (const d of sse(res)) {
      try {
        const j = JSON.parse(d);
        if (j.type === "error") throw new HttpError(j.error?.type === "overloaded_error" ? 529 : 500, j.error?.message);
        if (j.type === "content_block_delta" && j.delta?.type === "text_delta") push(j.delta.text);
      } catch (e) { if (e instanceof HttpError) throw e; }
    }
    return full;
  }
  if (provider === "openai") {
    const res = await fetchImpl("https://api.openai.com/v1/chat/completions", {
      method: "POST", signal,
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, stream: true, ...(json ? { response_format: { type: "json_object" } } : {}), messages: [{ role: "system", content: system + (json ? "\n\nTrả về JSON." : "") }, ...messages.map((m) => ({ role: m.role, content: m.text }))] }),
    });
    if (!res.ok) throw await failOf(res);
    for await (const d of sse(res)) {
      if (d === "[DONE]") break;
      try { push(JSON.parse(d).choices?.[0]?.delta?.content); } catch (_) { /* bỏ dòng hỏng */ }
    }
    return full;
  }
  throw new Error("Nhà cung cấp không hỗ trợ.");
}

// ---------- Dò model mạnh nhất ----------
const MODEL_CACHE = "boi.v2.models";
function rankGemini(ids) {
  const score = (id) => {
    const m = id.match(/^gemini-(\d+(?:\.\d+)?)-(pro|flash)(-lite)?(-preview)?(?:-[\d-]+)?$/);
    if (!m) return -1;
    return parseFloat(m[1]) * 100 + (m[2] === "pro" ? 20 : 0) + (m[3] ? -50 : 0) + (m[4] ? -1 : 0);
  };
  return ids.filter((id) => score(id) >= 0).sort((a, b) => score(b) - score(a));
}
function rankClaude(ids) {
  const score = (id) => {
    const fam = /opus/.test(id) ? 3 : /sonnet/.test(id) ? 2 : /haiku/.test(id) ? 1 : 0;
    const v = (id.match(/-(\d)[-.](\d{1,2})(?!\d)/) || id.match(/-(\d)(?!\d)/) || [0, 0, 0]).slice(1).map(Number);
    return fam ? (v[0] || 0) * 100 + (v[1] || 0) * 2 + fam : -1;
  };
  return ids.filter((id) => score(id) >= 0).sort((a, b) => score(b) - score(a));
}
function rankOpenAI(ids) {
  const score = (id) => {
    const m = id.match(/^gpt-(\d+(?:\.\d+)?)(o)?(-mini)?$/);
    return m ? parseFloat(m[1]) * 10 + (m[3] ? -5 : 0) : -1;
  };
  return ids.filter((id) => score(id) >= 0).sort((a, b) => score(b) - score(a));
}

export async function discoverModels(provider, key, { fetchImpl = globalThis.fetch, storage = globalThis.localStorage } = {}) {
  const fb = PROVIDERS[provider].fallback;
  try {
    const cached = JSON.parse(storage?.getItem(MODEL_CACHE) || "{}")[provider];
    if (cached && Date.now() - cached.at < 864e5 && cached.list?.length) return cached.list;
  } catch (_) { /* bỏ qua */ }
  let list = [];
  try {
    if (provider === "gemini") {
      const r = await fetchImpl(`${gBase(key)}/v1beta/models?pageSize=200`, { headers: gHead(key) });
      if (r.ok) list = rankGemini(((await r.json()).models || []).filter((m) => (m.supportedGenerationMethods || []).includes("generateContent")).map((m) => m.name.replace(/^models\//, "")));
    } else if (provider === "anthropic") {
      const r = await fetchImpl("https://api.anthropic.com/v1/models?limit=100", { headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" } });
      if (r.ok) list = rankClaude(((await r.json()).data || []).map((m) => m.id));
    } else if (provider === "openai") {
      const r = await fetchImpl("https://api.openai.com/v1/models", { headers: { authorization: `Bearer ${key}` } });
      if (r.ok) list = rankOpenAI(((await r.json()).data || []).map((m) => m.id));
    }
  } catch (_) { /* mạng lỗi → dùng danh sách tĩnh */ }
  const merged = [...new Set([...list.slice(0, 8), ...fb])];
  try {
    const all = JSON.parse(storage?.getItem(MODEL_CACHE) || "{}");
    all[provider] = { at: Date.now(), list: merged };
    storage?.setItem(MODEL_CACHE, JSON.stringify(all));
  } catch (_) { /* bỏ qua */ }
  return merged;
}

const RETRY = new Set([404, 429, 500, 503, 529]);

// Lỗi gọi AI → câu dễ hiểu cho người dùng (không lộ chi tiết kỹ thuật); bản giải offline vẫn hiển thị bên dưới.
export function friendlyError(e, key) {
  const net = e instanceof TypeError || /failed to fetch|networkerror|load failed|network/i.test(String(e?.message || ""));
  if (key === TRAM_KEY) {
    if (e?.status === 429) return "Đang đông người hỏi, thử lại sau ít phút.";
    if (net && !e?.timeout) return "Không kết nối được máy giải, kiểm tra mạng.";
    return "Máy giải đang bận.";
  }
  if (e?.timeout) return "AI phản hồi quá lâu nên đã dừng chờ.";
  if (net) return key === LOCAL_KEY ? "Cầu nối AI trên máy đang tắt hoặc không kết nối được." : "Không kết nối được tới AI (mất mạng hoặc bị chặn).";
  if (e?.status === 401 || e?.status === 403) return "Khoá AI không hợp lệ hoặc chưa được cấp quyền.";
  if (e?.status === 429) return "AI đang quá tải hoặc hết hạn mức — thử lại sau ít phút.";
  if (e?.status >= 500) return "Máy chủ AI đang lỗi tạm thời — thử lại sau.";
  return String(e?.message || "Lỗi không rõ.").slice(0, 160);
}
// AI lỗi → câu báo trên đầu và lời dẫn tới bản giải theo luật (động cơ luật giữ nguyên làm dự phòng)
export function aiFailNotice(e, key) {
  return {
    status: `Chưa giải được bằng AI: ${friendlyError(e, key)}`,
    note: "Đang hiển thị bản giải theo luật ngay bên dưới — đọc được đầy đủ, không cần mạng. Có thể bấm “Giải lại bằng AI” sau ít phút.",
  };
}

// fetch có hạn chờ phản hồi đầu (header); quá hạn thì dừng, báo lỗi có cờ timeout. Tín hiệu dừng của người gọi vẫn được nối.
export function timedFetch(fetchImpl, ms) {
  return (url, opts = {}) => {
    const c = new AbortController();
    const up = opts.signal;
    const stop = () => c.abort();
    if (up?.aborted) c.abort(); else up?.addEventListener("abort", stop, { once: true });
    let late = false;
    const t = setTimeout(() => { late = true; c.abort(); }, ms);
    return fetchImpl(url, { ...opts, signal: c.signal }).then(
      (r) => { clearTimeout(t); return r; },
      (e) => { clearTimeout(t); if (late && !up?.aborted) { const x = new Error("Cầu nối không phản hồi"); x.timeout = true; throw x; } throw e; },
    );
  };
}

// Trạm: một lượt duy nhất (trạm tự chuyển model), model thật lấy từ phản hồi của trạm.
async function viaTram({ system, messages, json, onText, onModel, signal, fetchImpl, tramTimeoutMs }) {
  onModel?.(TRAM_MODEL);
  const out = await tramOnce({ model: TRAM_MODEL, system, messages, json, onText, signal, fetchImpl, timeoutMs: tramTimeoutMs });
  if (!out.text.trim()) throw new HttpError(503, "Phản hồi rỗng");
  return out;
}

// Gọi lần lượt model (ưu tiên model người dùng chọn), chuyển dự phòng khi 429/404/quá tải.
// Cầu nối máy nhà (127.0.0.1/đường hầm) lỗi hoặc không phản hồi trong localTimeoutMs → tự chuyển sang trạm AI, không treo.
export async function streamWithFallback({ provider, key, model, system, messages, json, onText, onModel, onFallback, signal, fetchImpl = globalThis.fetch, storage, tramTimeoutMs, localTimeoutMs = 15000 }) {
  if (!key) throw new Error("Chưa có khoá.");
  if (key === TRAM_KEY) return viaTram({ system, messages, json, onText, onModel, signal, fetchImpl, tramTimeoutMs });
  const f = key === LOCAL_KEY ? timedFetch(fetchImpl, localTimeoutMs) : fetchImpl;
  try {
    return await modelLoop({ provider, key, model, system, messages, json, onText, onModel, signal, fetchImpl: f, storage });
  } catch (e) {
    if (key !== LOCAL_KEY || signal?.aborted) throw e;
    onFallback?.(e);
    return viaTram({ system, messages, json, onText, onModel, signal, fetchImpl, tramTimeoutMs });
  }
}

async function modelLoop({ provider, key, model, system, messages, json, onText, onModel, signal, fetchImpl, storage }) {
  const list = model ? [model, ...(await discoverModels(provider, key, { fetchImpl, storage })).filter((m) => m !== model)] : await discoverModels(provider, key, { fetchImpl, storage });
  let lastErr;
  for (const m of list) {
    try {
      onModel?.(m);
      const text = await streamOnce({ provider, model: m, key, system, messages, json, onText, signal, fetchImpl });
      if (!text.trim()) throw new HttpError(503, "Phản hồi rỗng");
      return { text, model: m };
    } catch (e) {
      lastErr = e;
      if (signal?.aborted) throw e;
      const badModel = e.status === 400 && /model|not found|unsupported|schema/i.test(e.message);
      if (!(RETRY.has(e.status) || badModel)) throw e;
    }
  }
  throw lastErr || new Error("Không model nào phản hồi.");
}

export function normalizeReading(obj, ruleReading) {
  if (!obj || typeof obj !== "object") return null;
  const arr = (x) => (Array.isArray(x) ? x.filter((y) => typeof y === "string" && y.trim()) : x ? [String(x)] : []);
  const str = (x) => (x == null ? "" : String(x));
  return {
    nguon: "ai",
    tong_quan: str(obj.tong_quan),
    chu_de_troi: arr(obj.chu_de_troi),
    tang: (Array.isArray(obj.tang) ? obj.tang : []).map((t, i) => ({
      ten: str(t?.ten) || ruleReading?.tang[i]?.ten || `Tầng ${i + 1}`,
      diem: Number.isFinite(Number(t?.diem)) ? Math.max(1, Math.min(10, Number(t.diem))) : null,
      tra_loi: str(t?.tra_loi) || null,
      tarot_doc: arr(t?.tarot_doc), dong_chay: str(t?.dong_chay),
      lenormand_cap: arr(t?.lenormand_cap), lenormand_bo_ba: arr(t?.lenormand_bo_ba), lenormand_chuoi: str(t?.lenormand_chuoi),
      lech: str(t?.lech) || null, chot: str(t?.chot), diem_nghen: str(t?.diem_nghen), loi_khuyen: str(t?.loi_khuyen),
      lap: ruleReading?.tang[i]?.lap || [], o_trong: ruleReading?.tang[i]?.o_trong || [],
    })),
    noi_tang: arr(obj.noi_tang), mau_thuan: arr(obj.mau_thuan), tien: str(obj.tien) || ruleReading?.tien || "",
    tong_ket: str(obj.tong_ket), loi_khuyen: arr(obj.loi_khuyen), canh_bao: arr(obj.canh_bao),
    _money: ruleReading?._money || null,
  };
}
