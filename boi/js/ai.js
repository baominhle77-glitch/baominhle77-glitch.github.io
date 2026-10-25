// Lớp AI (phần chính khi có khoá). Khoá chỉ nằm trong localStorage máy người dùng, gọi thẳng nhà cung cấp.
// Gemini mặc định; tự dò model mạnh nhất, lỗi 429/404/503 thì chuyển model dự phòng. JSON có cấu trúc + streaming.
import { cardName, tarotCard, lenCard } from "./reading.js";
import { spreadById, posLabel, posKey } from "./spreads.js";
import { cardYesNo } from "./data.js";

// Cầu nối máy nhà: tiến trình ở 127.0.0.1 tự gắn khoá Gemini từ tệp .env trên máy, trang không giữ khoá.
export const LOCAL_KEY = "@may-nha";
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

export const SYSTEM_READING = `Bạn là người đọc Tarot và Lenormand lão luyện hơn 20 năm, viết tiếng Việt tự nhiên, sắc sảo, thẳng thắn như một người thầy có nghề — không nịnh, không vòng vo, không thổi số, không nói chung chung.

NGUYÊN TẮC BẤT DI BẤT DỊCH
- Chỉ dùng đúng các lá đã lật được cung cấp. Không thêm, bớt, đổi lá, không đổi chiều xuôi/ngược. Ô trống (số không hợp lệ chưa thay) thì không bịa lá.
- Lá lặp (cùng số rút lại trong cùng câu hỏi) = nhấn mạnh chủ đề, KHÔNG phải xác nhận độc lập; nói rõ điều đó.
- Mọi con số tiền lấy đúng từ bảng quy đổi được cung cấp; nói rõ là quy đổi huyền học, không phải dự báo tài chính.
- Không hứa chắc chắn; nêu điều kiện. Câu Có/Không của một lá phụ thuộc câu hỏi (ví dụ 4 Tiền: hỏi "giữ/tiết kiệm" thì nghiêng Có, hỏi "chi/đầu tư/thay đổi" thì nghiêng Không) — không gán một câu trả lời cố định cho lá. Có lá báo gian dối/hao hụt (Mặt Trăng, 7 Kiếm, Ác Quỷ, 5 Kiếm, Con Cáo, Con Rắn, Con Chuột, Mây Đen…) mà câu hỏi liên quan tiền thì cảnh báo lừa đảo cụ thể, thực tế.

CÁCH ĐỌC
1. Tarot đọc theo VỊ TRÍ: mỗi lá nói gì ĐÚNG ở vị trí đó (tiến trình / hiệu quả / kết quả / tín hiệu…), không đọc nghĩa chung chung. Sau đó đọc DÒNG CHẢY giữa các vị trí: lá nào chuyển hướng, đầu–cuối khác nhau ra sao, kết quả và tín hiệu có khớp không.
2. Lenormand: đọc theo CẶP (lá trước = chủ thể, lá sau = tính chất), rồi BỘ BA trượt (lá giữa là cầu nối), rồi CẢ CHUỖI (lá đầu = điểm khởi, lá cuối = xu hướng kết).
3. Phân tích thành phần: chất trội, tỉ lệ Ẩn chính/Ẩn phụ, lá hoàng gia, số lặp, lá cản, lá tiền — chỉ nêu điều thật sự có ý nghĩa.
4. NỐI CHÉO các tầng: tầng nào kéo tầng nào, sợi chỉ xuyên suốt, bước ngoặt, tầng mạnh/yếu nhất.
5. CHỈ RA MÂU THUẪN: Tarot nói một đằng Lenormand một nẻo, tầng điểm cao mà có lá gian dối, kết quả tốt mà tín hiệu yếu… Giải thích mâu thuẫn nghĩa là gì trong đời thực.
6. Chấm điểm từng tầng x/10 (bước 0,5) dựa trên lá, có thể khác bản nháp luật nếu bạn có lý do; với câu hỏi Có/Không ghi rõ CÓ / CÓ CÓ ĐIỀU KIỆN / NGHIÊNG KHÔNG / KHÔNG.
7. "Chốt tầng" là 1–2 câu chốt hạ; "điểm nghẽn" là nút thắt cụ thể; lời khuyên phải làm được ngay (con số, hành động, thời điểm), không sáo rỗng.
8. Tổng kết: gọi người hỏi theo xưng hô được cho, nói thẳng kết luận trước, rồi điều kiện.

VĂN PHONG: câu ngắn gọn, đa dạng, không lặp ý giữa các mục, không dùng emoji, không markdown trong giá trị JSON.`;

export const SYSTEM_CHAT = `Bạn là người đọc Tarot và Lenormand lão luyện đang tiếp tục cùng một phiên bói (cùng một câu hỏi, cùng bộ bài đã khoá). Bạn nhớ toàn bộ các lá đã lật và các lần giải trước được cung cấp. Trả lời câu hỏi tiếp theo bằng tiếng Việt, thẳng thắn, cụ thể, dẫn đúng tên lá và tầng làm căn cứ; không bịa lá mới. Nếu người hỏi muốn thêm lá, nhắc họ dùng nút "Rút thêm" — lá rút thêm dùng lại đúng bộ đã khoá, số trùng ra đúng lá cũ (lá lặp = nhấn mạnh, không phải xác nhận độc lập). Con số tiền chỉ lấy từ bảng quy đổi (quy đổi huyền học, không phải dự báo tài chính). Được dùng markdown đơn giản (**đậm**, gạch đầu dòng).`;

// ---------- Bối cảnh gửi AI ----------
export function buildContext(db, session, { reading = null, money = null, settings = {} } = {}) {
  const sp = spreadById(session.spreadId);
  const L = [];
  L.push(`XƯNG HÔ: gọi người hỏi là "${settings.xungHo || "Queen Linh"}".`);
  L.push(`CÂU HỎI: ${session.cauHoi}`);
  L.push(`MẪU TRẢI: ${sp.ten}${session.reversals ? " (cho phép lá ngược)" : " (không lá ngược)"}${session.money ? " · câu hỏi về tiền" : ""}.`);
  L.push(`KHOÁ: SHA-256 ${session.hash}, khoá lúc ${session.lockedAtText}.`);
  session.rounds.forEach((round, ri) => {
    L.push("");
    L.push(ri === 0 ? `=== TRẢI CHÍNH (${round.atText}) ===` : `=== LƯỢT RÚT THÊM #${ri} (${round.atText}) — cùng bộ đã khoá ===`);
    const n = Math.max(round.tarot.length, round.lenormand.length);
    for (let ti = 0; ti < n; ti++) {
      const tier = session.tiers[ti] || { ten: `Tầng ${ti + 1}` };
      L.push(`-- Tầng ${ti + 1}: ${tier.ten}${ri ? " (rút thêm)" : ""} --`);
      (round.tarot[ti] || []).forEach((c, i) => {
        const pos = posLabel(tier, i);
        if (!c.ok) return L.push(`  Tarot [${pos}]: ô trống (số ${c.raw} ngoài khoảng, chưa thay)`);
        const card = tarotCard(db, c.card);
        const k = posKey(pos);
        const yn = sp.mode === "yesno" ? cardYesNo(card, c.rev, session.cauHoi) : null;
        L.push(`  Tarot [${pos}]: ${cardName(db, "tarot", c)} — từ khoá: ${card.tu_khoa}${k ? `; ở vị trí này: ${card.vi_tri[k]}` : ""}${yn ? `; Có/Không theo đúng câu hỏi này: ${yn.tra_loi} (${yn.ly_do})` : ""}${c.repeatOf ? ` · LÁ LẶP (đã ra ở lượt ${c.repeatOf.round} tầng ${c.repeatOf.tier})` : ""}`);
      });
      (round.lenormand[ti] || []).forEach((c, i) => {
        if (!c.ok) return L.push(`  Lenormand ô ${i + 1}: ô trống (số ${c.raw} ngoài khoảng, chưa thay)`);
        const card = lenCard(db, c.card);
        L.push(`  Lenormand ô ${i + 1}: ${cardName(db, "lenormand", c)} — chủ thể: ${card.chu_the}; tính chất: ${card.tinh_chat}${c.repeatOf ? ` · LÁ LẶP (đã ra ở lượt ${c.repeatOf.round} tầng ${c.repeatOf.tier})` : ""}`);
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
  return `${buildContext(db, session, opts)}\n\nHãy giải trải chính (và các lượt rút thêm nếu có, gộp vào phần nối tầng/tổng kết). Trả về DUY NHẤT một đối tượng JSON đúng khuôn: tong_quan, chu_de_troi[], tang[{ten, diem, tra_loi, tarot_doc[], dong_chay, lenormand_cap[], lenormand_bo_ba[], lenormand_chuoi, lech, chot, diem_nghen, loi_khuyen}], noi_tang[], mau_thuan[], tien, tong_ket, loi_khuyen[], canh_bao[]. Số tầng trong "tang" bằng số tầng của trải chính; tarot_doc có đúng một câu/đoạn cho mỗi lá Tarot theo thứ tự.`;
}

// Bản sao chép dán vào ChatGPT
export function chatGptPrompt(db, session, opts = {}) {
  const extra = opts.followUp ? `\n\n=== CÂU HỎI TIẾP ===\n${opts.followUp}` : "";
  const hist = (session.chat || []).map((m) => `${m.role === "user" ? "Hỏi" : "Đáp"}: ${m.text}`).join("\n\n");
  return `${SYSTEM_READING}\n\n${buildContext(db, session, opts)}${hist ? `\n\n=== HỎI ĐÁP TRƯỚC ĐÓ ===\n${hist}` : ""}\n\nTrình bày: bảng Tầng | Tarot (số → tên lá) | Lenormand (số → tên lá); từng tầng: đọc Tarot theo vị trí, dòng chảy, Lenormand theo cặp → bộ ba → cả chuỗi, điểm x/10, Chốt tầng, điểm nghẽn, lời khuyên; nối các tầng; mâu thuẫn; bảng tiền nếu có; tổng kết + lời khuyên thực tế.${extra}`;
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
async function streamOnce({ provider, model, key, system, messages, json, onText, signal, fetchImpl }) {
  let full = "";
  const push = (t) => { if (t) { full += t; onText?.(full, t); } };
  if (provider === "gemini") {
    const body = {
      systemInstruction: { parts: [{ text: system }] },
      contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.text }] })),
      generationConfig: json ? { responseMimeType: "application/json", responseSchema: SCHEMA, temperature: 0.9 } : { temperature: 0.9 },
    };
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
  if (e?.timeout) return "AI phản hồi quá lâu nên đã dừng chờ.";
  const net = e instanceof TypeError || /failed to fetch|networkerror|load failed|network/i.test(String(e?.message || ""));
  if (net) return key === LOCAL_KEY ? "Cầu nối AI trên máy đang tắt hoặc không kết nối được." : "Không kết nối được tới AI (mất mạng hoặc bị chặn).";
  if (e?.status === 401 || e?.status === 403) return "Khoá AI không hợp lệ hoặc chưa được cấp quyền.";
  if (e?.status === 429) return "AI đang quá tải hoặc hết hạn mức — thử lại sau ít phút.";
  if (e?.status >= 500) return "Máy chủ AI đang lỗi tạm thời — thử lại sau.";
  return String(e?.message || "Lỗi không rõ.").slice(0, 160);
}
// Gọi lần lượt model (ưu tiên model người dùng chọn), chuyển dự phòng khi 429/404/quá tải
export async function streamWithFallback({ provider, key, model, system, messages, json, onText, onModel, signal, fetchImpl = globalThis.fetch, storage }) {
  if (!key) throw new Error("Chưa có khoá.");
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
