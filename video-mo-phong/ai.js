/* Biến ý tưởng thành kịch bản video.
 * - Có khóa API Claude: gọi Claude (SDK chính thức, chạy thẳng trên trình duyệt) để viết kịch bản riêng theo ý tưởng.
 * - Không có khóa: dựng kịch bản mẫu từ từ khóa trong ý tưởng (offline, nội dung chung).
 * Kết quả luôn đi qua sanitize() của app nên thông số sai/thừa đều bị loại hoặc kẹp lại. */
(function (global) {
  "use strict";
  const { SIMS, THEMES, FONTS } = global.EduSims;
  const SDK_URL = "./vendor/anthropic-sdk-0.132.0.mjs";
  const MODELS = {
    "claude-opus-5-5": { label: "Claude Opus 5.5 (chất lượng cao nhất)", fallbacks: true },
    "claude-sonnet-5-5": { label: "Claude Sonnet 5.5 (nhanh, rẻ hơn)", fallbacks: true },
    "claude-haiku-5-5": { label: "Claude Haiku 5.5 (rẻ nhất)", fallbacks: false }
  };

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

  function schema() {
    return {
      type: "object",
      additionalProperties: false,
      required: ["title", "scenes", "style"],
      properties: {
        title: { type: "string", description: "Tên video" },
        scenes: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["type", "title", "narration", "bullets", "duration", "params"],
            properties: {
              type: { type: "string", enum: Object.keys(SIMS) },
              title: { type: "string", description: "Tiêu đề hiện trên màn hình, ngắn" },
              narration: { type: "string", description: "Lời thuyết minh/phụ đề của cảnh" },
              bullets: { type: "array", items: { type: "string" }, description: "Chỉ dùng cho cảnh bullets; cảnh khác để mảng rỗng" },
              duration: { type: "number", description: "Thời lượng cảnh, giây" },
              params: {
                type: "array",
                items: {
                  type: "object", additionalProperties: false, required: ["key", "value"],
                  properties: { key: { type: "string" }, value: { type: "number" } }
                }
              }
            }
          }
        },
        style: {
          type: "object",
          additionalProperties: false,
          required: ["theme", "font"],
          properties: {
            theme: { type: "string", enum: Object.keys(THEMES) },
            font: { type: "string", enum: Object.keys(FONTS) }
          }
        }
      }
    };
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

  /* ---------- Gọi Claude ---------- */

  let sdkPromise = null;
  function loadSdk() {
    if (!sdkPromise) sdkPromise = import(SDK_URL).then((m) => m.default);
    return sdkPromise;
  }

  async function withClaude(input, opts) {
    const Anthropic = await loadSdk();
    const client = new Anthropic({ apiKey: opts.apiKey, dangerouslyAllowBrowser: true, maxRetries: 2 });
    const model = MODELS[opts.model] ? opts.model : "claude-opus-5-5";
    const params = {
      model,
      max_tokens: 64000,
      system: systemPrompt(),
      messages: [{ role: "user", content: userPrompt(input) }],
      output_config: { effort: "medium", format: { type: "json_schema", schema: schema() } }
    };
    // Nếu bị bộ lọc an toàn từ chối, máy chủ tự chạy lại bằng mô hình dự phòng phù hợp
    if (MODELS[model].fallbacks) { params.betas = ["server-side-fallback-2026-07-01"]; params.fallbacks = "default"; }
    let message;
    try {
      const stream = client.beta.messages.stream(params, { signal: opts.signal });
      if (opts.onProgress) stream.on("text", (_delta, snapshot) => opts.onProgress(snapshot.length));
      message = await stream.finalMessage();
    } catch (err) {
      throw new Error(explainError(Anthropic, err));
    }
    if (message.stop_reason === "refusal") throw new Error("Claude từ chối viết kịch bản cho ý tưởng này. Hãy diễn đạt lại ý tưởng theo hướng giáo dục.");
    if (message.stop_reason === "max_tokens") throw new Error("Kịch bản quá dài nên bị cắt giữa chừng. Hãy giảm độ dài mục tiêu rồi thử lại.");
    const text = message.content.filter((b) => b.type === "text").map((b) => b.text).join("");
    let data;
    try { data = JSON.parse(text); } catch (_) { throw new Error("Không đọc được kịch bản trả về. Hãy thử lại."); }
    return toProject(data, input, "ai");
  }

  function explainError(Anthropic, err) {
    if (err instanceof Anthropic.APIUserAbortError) return "Đã hủy tạo kịch bản.";
    if (err instanceof Anthropic.AuthenticationError) return "Khóa API không đúng hoặc đã bị thu hồi. Kiểm tra lại trong mục Cài đặt AI.";
    if (err instanceof Anthropic.PermissionDeniedError) return "Khóa API này chưa được phép dùng mô hình đã chọn.";
    if (err instanceof Anthropic.RateLimitError) return "Đang gửi quá nhiều yêu cầu hoặc tài khoản hết hạn mức. Đợi một chút rồi thử lại.";
    if (err instanceof Anthropic.BadRequestError) return `Yêu cầu không hợp lệ: ${err.message}`;
    if (err instanceof Anthropic.APIConnectionError) return "Không kết nối được tới Claude. Kiểm tra mạng rồi thử lại.";
    if (err instanceof Anthropic.APIError) return `Claude đang gặp sự cố (${err.status || "?"}). Thử lại sau ít phút.`;
    return `Không tạo được kịch bản: ${err && err.message ? err.message : err}`;
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

  function offline(input) {
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
      (Array.isArray(s.params) ? s.params : []).forEach((kv) => { if (kv && typeof kv.key === "string") params[kv.key] = Number(kv.value); });
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

  async function generate(input, opts) {
    if (opts && opts.apiKey) return withClaude(input, opts);
    return offline(input);
  }

  global.EduAI = { generate, MODELS, AUDIENCES, TONES };
})(typeof window !== "undefined" ? window : globalThis);
