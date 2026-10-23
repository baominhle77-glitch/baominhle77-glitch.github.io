/* Biến ý tưởng thành kịch bản video — chỉ dùng hạn mức của nick Claude, không cần API trả phí.
 * - buildPrompt(): soạn sẵn lời nhắc đầy đủ (thư viện cảnh + định dạng JSON) để dán vào claude.ai hoặc bất kỳ phiên Claude nào.
 * - parseScript(): đọc câu trả lời Claude dán ngược lại (tự bóc khối JSON khỏi phần chữ/khối mã xung quanh).
 * - templateScript(): kịch bản mẫu offline theo từ khóa khi không muốn dùng Claude.
 * Kết quả luôn đi qua sanitize() của app nên thông số sai/thừa đều bị loại hoặc kẹp lại. */
(function (global) {
  "use strict";
  const { SIMS, THEMES, FONTS } = global.EduSims;

  const AUDIENCES = {
    pho_thong: "đại chúng, không cần kiến thức nền",
    hoc_sinh: "học sinh THCS/THPT",
    sinh_vien: "sinh viên y – dược / khoa học",
    chuyen_mon: "người làm chuyên môn (bác sĩ, dược sĩ, giảng viên)",
    benh_nhan: "người bệnh và người nhà"
  };
  const TONES = {
    than_thien: "thân thiện, gần gũi, dễ hiểu",
    hoc_thuat: "học thuật, chính xác, chặt chẽ",
    ke_chuyen: "kể chuyện, có tình huống mở đầu cuốn hút",
    ngan_gon: "ngắn gọn, nhịp nhanh kiểu video mạng xã hội"
  };

  /* ---------- Mô tả thư viện cảnh cho AI ---------- */

  function catalog() {
    return Object.entries(SIMS).map(([key, d]) => {
      const params = d.params.map((q) => `${q.key} (${q.label}${q.unit ? ", " + q.unit : ""}; ${q.min}–${q.max}; mặc định ${q.value})`).join("; ");
      return `- "${key}": ${d.label} [nhóm ${d.group}]${params ? ". Thông số: " + params : ". Không có thông số."}`;
    }).join("\n");
  }

  // Mẫu định dạng JSON đưa vào lời nhắc (Claude bản chat không có chế độ ép schema nên mô tả bằng ví dụ + luật)
  function formatSpec() {
    const example = {
      title: "Tên video",
      style: { theme: Object.keys(THEMES)[0], font: Object.keys(FONTS)[0] },
      scenes: [
        { type: "title", title: "Câu hỏi mở đầu", narration: "Lời thuyết minh 1–3 câu.", bullets: [], duration: 6, params: [] },
        { type: "pk", title: "Tiêu đề cảnh", narration: "…", bullets: [], duration: 15, params: [{ key: "tau", value: 8 }, { key: "thalf", value: 6 }] },
        { type: "bullets", title: "Ghi nhớ", narration: "…", bullets: ["Ý 1", "Ý 2", "Ý 3"], duration: 10, params: [] }
      ]
    };
    return [
      "ĐỊNH DẠNG TRẢ LỜI (bắt buộc):",
      "Chỉ trả lời bằng ĐÚNG MỘT khối mã ```json chứa một object JSON hợp lệ, không thêm chữ nào khác, không chú thích trong JSON.",
      `- style.theme là một trong: ${Object.keys(THEMES).join(", ")}; style.font là một trong: ${Object.keys(FONTS).join(", ")}.`,
      `- scenes[].type là một trong: ${Object.keys(SIMS).join(", ")}.`,
      "- bullets: mảng chuỗi, chỉ có nội dung với cảnh bullets; cảnh khác để [].",
      "- duration: số giây; params: mảng {key, value} với value là số.",
      "Ví dụ cấu trúc (thay nội dung cho đúng ý tưởng):",
      "```json",
      JSON.stringify(example, null, 2),
      "```"
    ].join("\n");
  }

  function systemPrompt() {
    return [
      "Bạn là biên kịch video giáo dục khoa học. Từ ý tưởng của người dùng, hãy viết một kịch bản video hoàn chỉnh, dựng được ngay bằng thư viện cảnh có sẵn dưới đây.",
      "",
      "Thư viện cảnh:",
      catalog(),
      "",
      "Nguyên tắc:",
      "1. Mở đầu bằng một cảnh \"title\" có câu dẫn gây tò mò; kết thúc bằng cảnh tóm tắt (\"bullets\") rồi cảnh \"title\" chào kết hoặc kêu gọi hành động.",
      "2. Chỉ dùng cảnh mô phỏng khi nó thật sự minh họa đúng nội dung. Nếu chủ đề không có mô phỏng phù hợp, dùng cảnh \"bullets\" và \"title\" để giải thích; không gượng ép.",
      "3. Với cảnh mô phỏng, chọn thông số thực tế, nằm trong khoảng cho phép và đúng với ví dụ đang nói. Lời thuyết minh phải khớp với điều người xem thấy trên hình (ví dụ: nói đúng giá trị t½ đã đặt).",
      "4. Kiến thức phải chính xác. Với số liệu y – dược, dùng giá trị điển hình trong sách giáo khoa; nếu chỉ mang tính minh họa thì nói rõ là \"minh họa\". Không đưa chỉ định điều trị hay liều dùng cho cá nhân; nội dung y khoa có câu nhắc tham khảo bác sĩ/dược sĩ ở cảnh cuối.",
      "5. Mỗi lời thuyết minh 1–3 câu, câu ngắn, dễ đọc thành phụ đề. Cảnh \"bullets\" có 3–5 ý, mỗi ý tối đa 12 từ.",
      "6. Thời lượng mỗi cảnh đủ để đọc hết lời thuyết minh với tốc độ khoảng 2,5 từ/giây; cảnh mô phỏng tối thiểu 8 giây. Tổng thời lượng sát với độ dài mục tiêu.",
      "7. Trường params chỉ dùng các khóa của đúng loại cảnh đó; cảnh không có thông số thì để mảng rỗng.",
      "8. Chọn style (theme, font) hợp với đối tượng và chủ đề.",
      "9. Viết bằng ngôn ngữ người dùng yêu cầu."
    ].join("\n");
  }

  function userPrompt(input) {
    return [
      `Ý tưởng: ${input.idea}`,
      `Đối tượng người xem: ${AUDIENCES[input.audience] || input.audience}`,
      `Giọng văn: ${TONES[input.tone] || input.tone}`,
      `Độ dài mục tiêu: khoảng ${input.targetSec} giây`,
      `Ngôn ngữ: ${input.lang === "en" ? "Tiếng Anh" : "Tiếng Việt"}`,
      input.notes ? `Yêu cầu thêm: ${input.notes}` : ""
    ].filter(Boolean).join("\n");
  }

  /* ---------- Lời nhắc & đọc kết quả dán vào ---------- */

  function buildPrompt(input) {
    return [systemPrompt(), "", "YÊU CẦU CỦA TÔI:", userPrompt(input), "", formatSpec()].join("\n");
  }

  // Lấy object JSON từ câu trả lời: ưu tiên khối ```json, nếu không thì cắt từ { đầu tiên tới } cuối cùng
  function extractJson(text) {
    const raw = String(text || "").trim();
    const fence = /```(?:json)?\s*([\s\S]*?)```/i.exec(raw);
    const body = fence ? fence[1] : raw;
    const a = body.indexOf("{"); const b = body.lastIndexOf("}");
    if (a < 0 || b <= a) throw new Error("Không thấy phần kịch bản (JSON) trong nội dung đã dán. Hãy chép nguyên câu trả lời của Claude.");
    const candidate = body.slice(a, b + 1);
    try { return JSON.parse(candidate); } catch (_) { /* thử sửa lỗi sao chép phổ biến bên dưới */ }
    const repaired = candidate
      .replace(/[\u201c\u201d]/g, '"') // ngoặc kép cong do sao chép từ một số trình soạn thảo
      .replace(/,\s*([}\]])/g, "$1"); // dấu phẩy thừa cuối mảng/object
    try { return JSON.parse(repaired); } catch (err) {
      throw new Error("Phần JSON bị lỗi cú pháp (có thể câu trả lời bị cắt giữa chừng). Hãy bảo Claude \"viết lại đầy đủ JSON\" rồi dán lại.");
    }
  }

  function parseScript(text, input) {
    const data = extractJson(text);
    if (!data || !Array.isArray(data.scenes) || !data.scenes.length) throw new Error("Kịch bản không có cảnh nào. Hãy kiểm tra lại nội dung đã dán.");
    return toProject(data, input || {}, "claude");
  }

  /* ---------- Kịch bản mẫu offline ---------- */

  const KEYWORDS = [
    ["pendulum", ["con lac", "dao dong dieu hoa", "pendulum", "chu ky dao dong"]],
    ["projectile", ["nem xien", "nem ngang", "quy dao", "chuyen dong nem", "projectile", "dan dao"]],
    ["wave", ["song co", "song am", "buoc song", "tan so", "song ngang", "song doc", "wave"]],
    ["diffusion", ["khuech tan", "mang te bao", "tham thau", "van chuyen thu dong", "diffusion", "osmosis"]],
    ["pk", ["thuoc", "duoc dong hoc", "lieu", "ban thai", "khang sinh", "sinh kha dung", "nong do mau", "pharmacokinetic"]],
    ["sir", ["dich", "lay lan", "lay nhiem", "virus", "vac xin", "vaccine", "tiem chung", "mien dich cong dong", "r0", "cum"]]
  ];

  function plain(s) {
    return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
  }

  function templateScript(input) {
    const idea = String(input.idea || "").trim();
    // So khớp theo nguyên cụm từ để "liều" không dính vào "tài liệu", "nguyên liệu"…
    const key = ` ${plain(idea).replace(/[^a-z0-9]+/g, " ")} `;
    const picked = KEYWORDS.filter(([, words]) => words.some((w) => key.includes(` ${w} `) && !key.includes(` tai ${w} `) && !key.includes(` nguyen ${w} `))).map(([t]) => t);
    const topic = idea.length > 70 ? idea.slice(0, 67).trim() + "…" : idea;
    const sims = picked.length ? picked : [];
    const scenes = [];
    scenes.push({ type: "title", title: topic || "Bài học mới", narration: `Cùng tìm hiểu: ${topic}.`, bullets: [], params: [] });
    scenes.push({
      type: "bullets", title: "Bạn sẽ nắm được",
      narration: "Đây là các ý chính của video.",
      bullets: sims.length ? sims.map((t) => SIMS[t].title || SIMS[t].label) : ["Khái niệm cốt lõi", "Ví dụ minh họa", "Điều cần ghi nhớ"],
      params: []
    });
    sims.forEach((t) => scenes.push({ type: t, title: SIMS[t].title || SIMS[t].label, narration: SIMS[t].caption || "", bullets: [], params: [] }));
    scenes.push({ type: "bullets", title: "Ghi nhớ", narration: "Tóm tắt lại những điều quan trọng.", bullets: ["Sửa các ý này theo nội dung bài của bạn", "Mỗi ý ngắn gọn, dễ nhớ", "Có thể thêm hoặc bớt ý"], params: [] });
    const medical = sims.includes("pk") || sims.includes("sir");
    scenes.push({ type: "title", title: "Cảm ơn bạn đã theo dõi!", narration: medical ? "Nội dung mang tính giáo dục; hãy hỏi bác sĩ hoặc dược sĩ trước khi dùng thuốc." : "Hãy thử tự thay đổi thông số và quan sát kết quả.", bullets: [], params: [] });
    const style = { theme: medical ? "yte" : (input.audience === "hoc_sinh" ? "phan" : "dem"), font: input.audience === "hoc_sinh" ? "round" : "sans" };
    return toProject({ title: topic || "Video mới", scenes, style }, input, "offline");
  }

  /* ---------- Chuẩn hóa về dạng dự án của app ---------- */

  function toProject(data, input, source) {
    const scenes = (Array.isArray(data.scenes) ? data.scenes : []).filter((s) => s && SIMS[s.type]).map((s) => {
      const params = {};
      if (Array.isArray(s.params)) s.params.forEach((kv) => { if (kv && typeof kv.key === "string") params[kv.key] = Number(kv.value); });
      else if (s.params && typeof s.params === "object") Object.entries(s.params).forEach(([k, v]) => { params[k] = Number(v); });
      return {
        type: s.type,
        title: String(s.title || ""),
        caption: String(s.narration || s.caption || ""),
        bullets: Array.isArray(s.bullets) ? s.bullets.map(String).filter((x) => x.trim()) : [],
        duration: Number(s.duration) || 0,
        autoDur: true,
        params
      };
    });
    return {
      source,
      title: String(data.title || input.idea || "Video mới").slice(0, 120),
      scenes,
      style: data.style && THEMES[data.style.theme] ? { theme: data.style.theme, font: FONTS[data.style.font] ? data.style.font : "sans" } : null
    };
  }

  global.EduAI = { buildPrompt, parseScript, templateScript, AUDIENCES, TONES };
})(typeof window !== "undefined" ? window : globalThis);
