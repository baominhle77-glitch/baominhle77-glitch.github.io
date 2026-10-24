// Giải sâu bằng AI (tuỳ chọn). Khoá của người dùng chỉ nằm trong trình duyệt, gọi thẳng nhà cung cấp.
import { cardName } from "./reading.js";
import { spreadById } from "./spreads.js";

export const DEFAULT_MODEL = { gemini: "gemini-2.5-flash", anthropic: "claude-sonnet-5-5", openai: "gpt-4o-mini" };

export function buildPrompt(db, session, rounds, summary, money, settings = {}) {
  const who = settings.xungHo || "Queen Linh";
  const sp = spreadById(session.spreadId);
  const L = [];
  L.push(`Bạn là người đọc Tarot + Lenormand lâu năm. Viết lại bản giải dưới đây bằng tiếng Việt, mượt và có chiều sâu như một phiên trò chuyện, xưng hô với người hỏi là "${who}".`);
  L.push("Quy tắc: giọng thẳng, không nịnh, không thổi số; GIỮ NGUYÊN đúng các lá đã lật, không thêm/bớt/đổi lá; lá lặp = nhấn mạnh, không phải xác nhận độc lập; Lenormand đọc theo cặp (lá trước = chủ thể, lá sau = tính chất) rồi cả chuỗi; mọi con số tiền là quy đổi huyền học, không phải dự báo tài chính, giữ đúng các con số trong bảng; ô trống là số không hợp lệ chưa được thay — không tự bịa lá cho ô đó.");
  L.push("Trình bày: (1) bảng Tầng | Tarot (số → tên lá) | Lenormand (số → tên lá); (2) từng tầng: đọc chuỗi Tarot theo vị trí, các cặp Lenormand, điểm x/10, Chốt tầng, điểm nghẽn, lời khuyên; (3) nếu có bảng tiền: giữ bảng Tháng | Tarot | Lenormand | Khoảng thực tế | Con số trung tâm, tổng, bình quân, tháng mạnh/yếu, so với mục tiêu; (4) tổng kết chung + lời khuyên thực tế.");
  L.push("");
  L.push(`CÂU HỎI: ${session.cauHoi}`);
  L.push(`Mẫu trải: ${sp.ten}${session.reversals ? " (có lá ngược)" : " (không lá ngược)"}. Mã khoá SHA-256: ${session.hash} — khoá lúc ${session.lockedAtText}.`);
  for (const r of rounds) {
    L.push("");
    L.push(r.ri === 0 ? `== TRẢI CHÍNH (${r.atText}) ==` : `== LƯỢT RÚT THÊM #${r.ri} (${r.atText}) — cùng bộ đã khoá ==`);
    const round = session.rounds[r.ri];
    r.tiers.forEach((t, ti) => {
      L.push(`-- ${t.ten} --`);
      L.push(`Tarot: ${(round.tarot[ti] || []).map((c) => cardName(db, "tarot", c)).join(" | ") || "—"}`);
      L.push(`Lenormand: ${(round.lenormand[ti] || []).map((c) => cardName(db, "lenormand", c)).join(" | ") || "—"}`);
      t.tarot.forEach((x) => L.push(`  • ${x.text}`));
      t.pairs.forEach((p) => L.push(`  • Cặp ${p.a.vi} + ${p.b.vi}: ${p.text}`));
      if (t.chain) L.push(`  • ${t.chain}`);
      L.push(`  Điểm: ${t.diem ?? "—"}/10${t.yesno ? ` → ${t.yesno}` : ""}. Chốt tầng: ${t.chot} Điểm nghẽn: ${t.nghen}. Lời khuyên: ${t.khuyen.join(" ")}`);
      t.repeats.forEach((x) => L.push(`  • ${x.text}`));
    });
  }
  if (money && money.rows) {
    L.push("");
    L.push(`== QUY ĐỔI TIỀN (triệu đồng, mốc thu nhập ${money.base} tr/tháng) ==`);
    money.rows.forEach((m) => L.push(`${m.ky} | ${m.tarot} | ${m.lenormand} | ${m.low}–${m.high} | ${m.center}`));
    L.push(`Tổng: ${money.total} tr; bình quân ${money.perMonth} tr/tháng; mạnh nhất ${money.best.ky} (${money.best.center}); yếu nhất ${money.worst.ky} (${money.worst.center}).`);
    if (money.target) L.push(`Mục tiêu ${money.target} tr/tháng → đạt ${money.targetPct} %; ${money.monthsHit}/${money.rows.length} kỳ chạm mục tiêu.`);
    if (money.prevYear) L.push(`So năm trước (${money.prevYear} tr): ${money.vsPrevPct >= 0 ? "+" : ""}${money.vsPrevPct} %.`);
  }
  if (summary) {
    L.push("");
    L.push("== TỔNG KẾT THEO LUẬT ==");
    summary.text.forEach((x) => L.push(x));
    summary.advice.forEach((x) => L.push(`- ${x}`));
  }
  return L.join("\n");
}

export async function callAI({ provider, model, key, prompt, fetchImpl = globalThis.fetch }) {
  if (!key) throw new Error("Chưa nhập khoá.");
  const m = model || DEFAULT_MODEL[provider];
  let res, data;
  if (provider === "gemini") {
    res = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
    });
    data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || `Lỗi ${res.status}`);
    return (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("");
  }
  if (provider === "anthropic") {
    res = await fetchImpl("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({ model: m, max_tokens: 8000, messages: [{ role: "user", content: prompt }] }),
    });
    data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || `Lỗi ${res.status}`);
    return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
  }
  if (provider === "openai") {
    res = await fetchImpl("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: m, messages: [{ role: "user", content: prompt }] }),
    });
    data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || `Lỗi ${res.status}`);
    return data.choices?.[0]?.message?.content || "";
  }
  throw new Error("Nhà cung cấp không hỗ trợ.");
}
