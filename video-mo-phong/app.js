(function () {
  "use strict";
  const { SIMS, C, THEMES, FONTS, setTheme, contrast, font, roundRect, wrapLines } = window.EduSims;
  const { AUDIENCES, TONES } = window.EduAI;
  const STORE_KEY = "video-mo-phong:v2";
  const OLD_STORE_KEY = "video-mo-phong:v1";
  const DT = 1 / 60;
  const WPS = 2.5; // tốc độ đọc phụ đề trung bình (từ/giây)
  const SIZES = { "16:9": [16, 9], "9:16": [9, 16], "1:1": [1, 1] };
  const PLATFORMS = {
    youtube: { label: "YouTube / bài giảng (ngang 16:9)", aspect: "16:9" },
    shorts: { label: "TikTok / Reels / Shorts (dọc 9:16)", aspect: "9:16" },
    facebook: { label: "Facebook / Instagram (vuông 1:1)", aspect: "1:1" }
  };
  const DEFAULT_STYLE = {
    theme: "dem", font: "sans", textScale: 1, titleScale: 1, captionScale: 1, simScale: 1, speed: 1,
    captionPos: "bottom", captionStyle: "box", transition: "fade", showProgress: true, bg: "", ink: "", accent: ""
  };
  const DEFAULT_BRIEF = { idea: "", audience: "pho_thong", tone: "than_thien", targetSec: 60, lang: "vi", platform: "youtube", notes: "", autoStyle: true };

  const $ = (id) => document.getElementById(id);
  const canvas = $("stage");
  const ctx = canvas.getContext("2d");

  let project = load() || sampleProject();
  let selected = 0;
  let playing = false;
  let globalT = 0;
  let lastTick = 0;
  let sim = null;
  let spokenScene = -1;
  let exporting = null;
  const chunkCache = new Map();

  /* ---------- Dữ liệu dự án ---------- */

  function uid() { return Math.random().toString(36).slice(2, 10); }
  function words(s) { return String(s || "").trim().split(/\s+/).filter(Boolean).length; }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  function makeScene(type) {
    const def = SIMS[type];
    const params = {};
    def.params.forEach((q) => { params[q.key] = q.value; });
    const s = { id: uid(), type, title: def.title || def.label, caption: def.caption || "", bullets: (def.bullets || []).slice(), duration: 10, autoDur: true, params };
    s.duration = autoDuration(s);
    return s;
  }

  // Thời lượng tối thiểu để người xem đọc hết chữ trên màn hình + thời gian để mô phỏng kịp diễn ra
  function autoDuration(s) {
    const w = words(s.caption) + (s.type === "bullets" ? words((s.bullets || []).join(" ")) : 0) + words(s.title) * 0.3;
    const read = w / WPS + 1.5;
    const min = s.type === "title" ? 4 : s.type === "bullets" ? 3 + 1.6 * (s.bullets || []).length : 8;
    return Math.round(clamp(Math.max(read, min), 3, 90));
  }

  function sampleProject() {
    const intro = makeScene("title");
    intro.title = "Khoa học qua mô phỏng";
    intro.caption = "Ba ví dụ: con lắc, thuốc trong máu và dịch bệnh.";
    const s1 = makeScene("pendulum");
    const s2 = makeScene("pk");
    const s3 = makeScene("sir");
    const sum = makeScene("bullets");
    sum.title = "Ghi nhớ";
    sum.caption = "Ba ý quan trọng rút ra từ các mô phỏng.";
    sum.bullets = ["Chu kỳ con lắc phụ thuộc chiều dài dây", "Thuốc đạt trạng thái ổn định sau 4–5 lần t½", "R₀ > 1 thì dịch bùng phát"];
    const outro = makeScene("title");
    outro.title = "Cảm ơn bạn đã theo dõi!";
    outro.caption = "Hãy thử tự thay đổi thông số và quan sát kết quả.";
    [intro, s1, s2, s3, sum, outro].forEach((s) => { s.duration = autoDuration(s); });
    return { title: "Khoa học qua mô phỏng", author: "", aspect: "16:9", style: { ...DEFAULT_STYLE }, brief: { ...DEFAULT_BRIEF }, scenes: [intro, s1, s2, s3, sum, outro] };
  }

  const HEX = /^#[0-9a-f]{6}$/i;
  function sanitizeStyle(st) {
    const s = { ...DEFAULT_STYLE, ...(st && typeof st === "object" ? st : {}) };
    if (!THEMES[s.theme]) s.theme = "dem";
    if (!FONTS[s.font]) s.font = "sans";
    s.textScale = clamp(Number(s.textScale) || 1, 0.6, 1.8);
    s.titleScale = clamp(Number(s.titleScale) || 1, 0.6, 1.8);
    s.captionScale = clamp(Number(s.captionScale) || 1, 0.6, 1.8);
    s.simScale = clamp(Number(s.simScale) || 1, 0.6, 1);
    s.speed = clamp(Number(s.speed) || 1, 0.25, 3);
    if (!["bottom", "top", "hidden"].includes(s.captionPos)) s.captionPos = "bottom";
    if (!["box", "outline", "bar"].includes(s.captionStyle)) s.captionStyle = "box";
    if (!["fade", "slide", "zoom", "none"].includes(s.transition)) s.transition = "fade";
    s.showProgress = s.showProgress !== false;
    ["bg", "ink", "accent"].forEach((k) => { if (!HEX.test(String(s[k] || ""))) s[k] = ""; });
    return s;
  }

  function sanitizeBrief(b) {
    const s = { ...DEFAULT_BRIEF, ...(b && typeof b === "object" ? b : {}) };
    s.idea = String(s.idea || "").slice(0, 4000);
    s.notes = String(s.notes || "").slice(0, 1000);
    if (!AUDIENCES[s.audience]) s.audience = "pho_thong";
    if (!TONES[s.tone]) s.tone = "than_thien";
    s.targetSec = clamp(Number(s.targetSec) || 60, 15, 600);
    if (!["vi", "en"].includes(s.lang)) s.lang = "vi";
    if (!PLATFORMS[s.platform]) s.platform = "youtube";
    s.autoStyle = s.autoStyle !== false;
    return s;
  }

  function sanitizeScene(s) {
    if (!s || !SIMS[s.type]) return null;
    const def = SIMS[s.type];
    const params = {};
    def.params.forEach((q) => {
      const v = Number(s.params && s.params[q.key]);
      params[q.key] = Number.isFinite(v) ? clamp(v, q.min, q.max) : q.value;
    });
    const out = {
      id: typeof s.id === "string" ? s.id : uid(), type: s.type,
      title: String(s.title == null ? (def.title || def.label) : s.title).slice(0, 140),
      caption: String(s.caption == null ? "" : s.caption).slice(0, 800),
      bullets: (Array.isArray(s.bullets) ? s.bullets : []).map((x) => String(x).slice(0, 140)).filter((x) => x.trim()).slice(0, 8),
      duration: 0, autoDur: s.autoDur !== false, params
    };
    const d = Number(s.duration);
    out.duration = Number.isFinite(d) && d >= 2 ? Math.min(120, d) : autoDuration(out);
    return out;
  }

  function sanitize(p) {
    if (!p || !Array.isArray(p.scenes)) return null;
    const scenes = p.scenes.map(sanitizeScene).filter(Boolean);
    if (!scenes.length) return null;
    return {
      title: String(p.title || "").slice(0, 120), author: String(p.author || "").slice(0, 80),
      aspect: SIZES[p.aspect] ? p.aspect : "16:9", style: sanitizeStyle(p.style), brief: sanitizeBrief(p.brief), scenes
    };
  }

  function load() {
    try { return sanitize(JSON.parse(localStorage.getItem(STORE_KEY) || localStorage.getItem(OLD_STORE_KEY))); } catch (_) { return null; }
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(project)); } catch (_) { /* trình duyệt chặn lưu: bỏ qua */ }
  }

  /* ---------- Dòng thời gian ---------- */

  function totalDuration() { return project.scenes.reduce((a, s) => a + s.duration, 0); }

  function locate(t) {
    let start = 0;
    for (let i = 0; i < project.scenes.length; i++) {
      const s = project.scenes[i];
      if (t < start + s.duration || i === project.scenes.length - 1) return { index: i, scene: s, local: Math.max(0, Math.min(s.duration, t - start)), start };
      start += s.duration;
    }
    return null;
  }

  function sceneStart(index) { let t = 0; for (let i = 0; i < index; i++) t += project.scenes[i].duration; return t; }

  // Dựng lại mô phỏng khi đổi cảnh, thông số, tốc độ hoặc tua lùi; luôn bước cố định để kết quả lặp lại được.
  function simFor(scene, local) {
    const speed = project.style.speed;
    const key = JSON.stringify([scene.type, scene.params, scene.duration, scene.bullets, speed]);
    if (!sim || sim.sceneId !== scene.id || sim.key !== key || sim.t > local + 1e-9) {
      sim = { sceneId: scene.id, key, inst: SIMS[scene.type].create({ ...scene.params }, scene.duration * speed, scene), t: 0 };
    }
    let guard = 0;
    while (sim.t + DT <= local + 1e-9 && guard++ < 20000) { sim.inst.step(DT * speed); sim.t += DT; }
    return sim.inst;
  }

  /* ---------- Phụ đề tự chia đoạn ---------- */

  // Lời thuyết minh dài được cắt theo câu rồi theo cụm từ, mỗi đoạn hiện trong khoảng thời gian tỉ lệ với độ dài.
  function captionChunks(text, maxWords) {
    const key = `${maxWords}|${text}`;
    if (chunkCache.has(key)) return chunkCache.get(key);
    const out = [];
    String(text || "").split(/(?<=[.!?;…])\s+/).forEach((sentence) => {
      const w = sentence.trim().split(/\s+/).filter(Boolean);
      if (!w.length) return;
      const parts = Math.ceil(w.length / maxWords);
      const per = Math.ceil(w.length / parts);
      for (let i = 0; i < w.length; i += per) out.push(w.slice(i, i + per).join(" "));
    });
    if (chunkCache.size > 300) chunkCache.clear();
    chunkCache.set(key, out);
    return out;
  }

  function currentChunk(scene, local) {
    const maxWords = project.aspect === "9:16" ? 9 : project.aspect === "1:1" ? 12 : 16;
    const chunks = captionChunks(scene.caption, maxWords);
    if (chunks.length <= 1) return chunks[0] || "";
    const weights = chunks.map((c) => words(c) + 1.5);
    const sum = weights.reduce((a, b) => a + b, 0);
    const span = Math.max(0.1, scene.duration - 0.4);
    let acc = 0;
    for (let i = 0; i < chunks.length; i++) {
      acc += weights[i] / sum * span;
      if (local < acc) return chunks[i];
    }
    return chunks[chunks.length - 1];
  }

  /* ---------- Vẽ khung hình ---------- */

  function wrap(text, maxW) { return wrapLines(ctx, text, maxW); }

  // Giảm cỡ chữ cho tới khi vừa số dòng cho phép
  function fitText(text, maxW, maxLines, size, weight, unit) {
    let s = size;
    for (; s > 12; s -= 1) {
      ctx.font = font({ unit }, s, weight);
      if (wrap(text, maxW).length <= maxLines) break;
    }
    ctx.font = font({ unit }, s, weight);
    return { size: s, lines: wrap(text, maxW).slice(0, maxLines) };
  }

  function drawCaption(text, W, H, unit, margin, area) {
    const st = project.style;
    if (!text || st.captionPos === "hidden") return;
    const base = 24 * st.captionScale;
    const { size, lines } = fitText(text, W - 4 * margin, 2, base, 650, unit);
    const lh = size * 1.35 * unit * C.textScale;
    const pad = 11 * unit;
    const bh = lines.length * lh + pad * 2;
    const by = st.captionPos === "top" ? area.top : area.bottom - bh;
    ctx.save();
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    if (st.captionStyle === "box") {
      ctx.fillStyle = C.capBg; roundRect(ctx, margin, by, W - 2 * margin, bh, 14 * unit); ctx.fill();
    } else if (st.captionStyle === "bar") {
      ctx.fillStyle = C.capBg; ctx.fillRect(0, by, W, bh);
    }
    lines.forEach((l, i) => {
      const y = by + pad + i * lh;
      if (st.captionStyle === "outline") {
        ctx.lineJoin = "round"; ctx.lineWidth = Math.max(3, 5 * unit); ctx.strokeStyle = "rgba(0,0,0,.85)";
        ctx.strokeText(l, W / 2, y); ctx.fillStyle = "#ffffff";
      } else ctx.fillStyle = C.capInk;
      ctx.fillText(l, W / 2, y);
    });
    ctx.restore();
  }

  function render(t) {
    const st = project.style;
    setTheme(st);
    const W = canvas.width; const H = canvas.height;
    const unit = Math.min(W, H) / 720;
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, C.bg1); bg.addColorStop(1, C.bg2);
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const loc = locate(t);
    if (!loc) return;
    const { scene, local, index } = loc;
    const inst = simFor(scene, local);
    const portrait = H > W;
    const margin = 28 * unit;
    // Khung dọc chừa vùng an toàn trên/dưới vì nút của TikTok/Reels che mất phần mép
    const safeTop = portrait ? 90 * unit : 0;
    const safeBottom = portrait ? 150 * unit : 0;
    const headH = safeTop + 76 * unit * st.titleScale;
    const capSpace = st.captionPos === "hidden" ? 24 * unit : (100 * st.captionScale + 28) * unit;
    const topCap = st.captionPos === "top";
    const footH = safeBottom + (topCap ? 24 * unit : capSpace);
    const bodyTop = headH + (topCap ? capSpace : 0);
    const raw = { x: margin, y: bodyTop, w: W - 2 * margin, h: Math.max(60 * unit, H - bodyTop - footH) };
    const k = st.simScale;
    const box = { x: raw.x + raw.w * (1 - k) / 2, y: raw.y + raw.h * (1 - k) / 2, w: raw.w * k, h: raw.h * k, unit };

    const animate = playing || exporting;
    const p = animate ? clamp(local / 0.5, 0, 1) : 1;
    const ease = 1 - Math.pow(1 - p, 3);
    ctx.save();
    if (st.transition === "fade") ctx.globalAlpha = ease;
    else if (st.transition === "slide") { ctx.globalAlpha = ease; ctx.translate((1 - ease) * W * 0.06, 0); }
    else if (st.transition === "zoom") { ctx.globalAlpha = ease; const z = 0.94 + 0.06 * ease; ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); }

    if (inst.bigTitle) {
      inst.draw(ctx, { x: 0, y: 0, w: W, h: H, unit }, local);
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const tfit = fitText(scene.title, W * 0.84, 3, (portrait ? 46 : 54) * st.titleScale, 800, unit);
      const lh = tfit.size * 1.22 * unit * C.textScale;
      ctx.font = font({ unit }, 24 * st.captionScale, 500);
      const sub = st.captionPos === "hidden" ? [] : wrap(scene.caption, W * 0.78).slice(0, 4);
      const slh = 24 * st.captionScale * 1.4 * unit * C.textScale;
      const gap = sub.length ? 18 * unit : 0;
      const blockH = tfit.lines.length * lh + gap + sub.length * slh;
      let y = H / 2 - blockH / 2;
      ctx.font = font({ unit }, tfit.size, 800); ctx.fillStyle = C.ink;
      tfit.lines.forEach((l) => { ctx.fillText(l, W / 2, y + lh / 2); y += lh; });
      y += gap;
      ctx.font = font({ unit }, 24 * st.captionScale, 500); ctx.fillStyle = C.muted;
      sub.forEach((l) => { ctx.fillText(l, W / 2, y + slh / 2); y += slh; });
    } else {
      ctx.save(); inst.draw(ctx, box, local); ctx.restore();
      ctx.fillStyle = C.ink; ctx.textAlign = "left"; ctx.textBaseline = "middle";
      const tfit = fitText(scene.title, W - 2 * margin, 1, 30 * st.titleScale, 800, unit);
      ctx.fillText(tfit.lines[0] || "", margin, safeTop + (headH - safeTop) / 2 + 4 * unit);
      drawCaption(currentChunk(scene, local), W, H, unit, margin, { top: headH, bottom: H - safeBottom - 14 * unit });
    }
    ctx.restore();

    const total = totalDuration();
    if (st.showProgress) {
      const barY = H - safeBottom - 6 * unit;
      ctx.fillStyle = C.grid; ctx.fillRect(0, barY, W, 6 * unit);
      ctx.fillStyle = C.a; ctx.fillRect(0, barY, W * Math.min(1, t / total), 6 * unit);
    }
    if (project.author) {
      ctx.font = font({ unit }, 15, 600); ctx.fillStyle = C.muted; ctx.textBaseline = "top"; ctx.textAlign = "right";
      ctx.fillText(project.author, W - margin, safeTop + 10 * unit);
    }

    if (index !== spokenScene) { spokenScene = index; maybeSpeak(scene); }
  }

  function maybeSpeak(scene) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    if (!playing || exporting || !$("readAloud").checked) return;
    const text = [scene.title, scene.caption].filter(Boolean).join(". ");
    if (!text) return;
    const u = new SpeechSynthesisUtterance(text);
    const lang = project.brief.lang === "en" ? "en" : "vi";
    u.lang = lang === "en" ? "en-US" : "vi-VN";
    const voice = window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith(lang));
    if (voice) u.voice = voice;
    window.speechSynthesis.speak(u);
  }

  /* ---------- Phát / tua ---------- */

  function fmtTime(s) { const m = Math.floor(s / 60); const r = Math.floor(s % 60); return `${m}:${String(r).padStart(2, "0")}`; }

  function updateTransport() {
    const total = totalDuration();
    $("seek").value = String(Math.round((globalT / total) * 1000));
    $("timeLabel").textContent = `${fmtTime(globalT)} / ${fmtTime(total)}`;
    $("btnPlay").textContent = playing ? "❚❚ Tạm dừng" : "▶ Phát";
    const loc = locate(globalT);
    document.querySelectorAll("#sceneList li").forEach((li, i) => li.classList.toggle("playing", loc && loc.index === i));
  }

  function tick(now) {
    if (!playing) return;
    const dt = Math.min(0.25, (now - lastTick) / 1000);
    lastTick = now;
    globalT += dt;
    const total = totalDuration();
    if (globalT >= total) {
      globalT = total;
      render(globalT - 1e-6);
      setPlaying(false);
      return;
    }
    render(globalT);
    updateTransport();
    requestAnimationFrame(tick);
  }

  function setPlaying(on) {
    playing = on;
    spokenScene = -1;
    if (on) {
      if (globalT >= totalDuration() - 0.01) globalT = 0;
      lastTick = performance.now();
      requestAnimationFrame(tick);
    } else if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    updateTransport();
  }

  function seekTo(t) {
    globalT = Math.max(0, Math.min(totalDuration(), t));
    render(Math.min(globalT, totalDuration() - 1e-6));
    updateTransport();
  }

  /* ---------- Khung hình theo tỉ lệ ---------- */

  function applySize(quality) {
    const [a, b] = SIZES[project.aspect];
    const short = quality || 720;
    if (a >= b) { canvas.width = Math.round(short * a / b / 2) * 2; canvas.height = short; }
    else { canvas.width = short; canvas.height = Math.round(short * b / a / 2) * 2; }
    canvas.style.aspectRatio = `${a} / ${b}`;
    canvas.parentElement.classList.toggle("portrait", a < b);
  }

  /* ---------- Tối ưu tự động ---------- */

  // Trả về danh sách việc đã điều chỉnh để người dùng thấy rõ app đã sửa gì.
  // Chạy nhiều lần cho cùng kết quả: chỉ báo những gì thực sự thay đổi.
  function optimize() {
    const report = [];
    const target = project.brief.targetSec;
    const before = new Map(project.scenes.map((s) => [s.id, s.duration]));
    const totalBefore = totalDuration();
    const flexible = project.scenes.filter((s) => s.autoDur);
    // Cảnh chữ không kéo dài quá mức đọc (tránh khoảng lặng), phần dư dồn cho cảnh mô phỏng
    const cap = (s, min) => (s.type === "title" ? min + 3 : s.type === "bullets" ? min + 6 : 60);
    const weight = (s) => (s.type === "title" ? 0.3 : s.type === "bullets" ? 1 : 3);
    const mins = new Map(flexible.map((s) => [s.id, autoDuration(s)]));
    flexible.forEach((s) => { s.duration = mins.get(s.id); });
    const fixed = totalDuration() - flexible.reduce((a, s) => a + s.duration, 0);
    let extra = target - fixed - flexible.reduce((a, s) => a + s.duration, 0);
    for (let pass = 0; pass < 5 && extra > 0.5; pass++) {
      const open = flexible.filter((s) => s.duration < cap(s, mins.get(s.id)));
      const wsum = open.reduce((a, s) => a + weight(s), 0);
      if (!wsum) break;
      let used = 0;
      open.forEach((s) => {
        const add = Math.min(extra * weight(s) / wsum, cap(s, mins.get(s.id)) - s.duration);
        s.duration += add; used += add;
      });
      extra -= used;
    }
    flexible.forEach((s) => { s.duration = Math.round(s.duration); });
    const changed = project.scenes.filter((s) => before.get(s.id) !== s.duration).length;
    const totalAfter = totalDuration();
    if (changed) report.push(`Cân thời lượng ${changed} cảnh theo thời gian đọc phụ đề (~${WPS} từ/giây) và độ dài mục tiêu: tổng ${fmtTime(totalBefore)} → ${fmtTime(totalAfter)}.`);
    if (totalAfter > target * 1.1) report.push(`Nội dung cần ít nhất ${fmtTime(totalAfter)} để đọc kịp — dài hơn mục tiêu ${fmtTime(target)}. Hãy rút gọn lời thuyết minh hoặc bỏ bớt cảnh.`);
    else if (totalAfter < target * 0.9) report.push(`Nội dung hiện chỉ đủ cho ${fmtTime(totalAfter)} (mục tiêu ${fmtTime(target)}). Không kéo dài cảnh chữ để tránh khoảng lặng — hãy thêm cảnh hoặc viết lời thuyết minh dài hơn.`);

    // Màu chữ phải đọc được trên nền
    setTheme(project.style);
    if (contrast(C.ink, C.bg1) < 4.5 || contrast(C.ink, C.bg2) < 4.5) {
      const light = contrast("#ffffff", C.bg1) >= contrast("#111111", C.bg1);
      project.style.ink = light ? "#ffffff" : "#111111";
      report.push("Màu chữ quá gần màu nền — đã đổi sang " + (light ? "trắng" : "đen") + " để dễ đọc.");
    }
    if (project.style.accent && contrast(project.style.accent, C.bg1) < 2) {
      project.style.accent = "";
      report.push("Màu nhấn gần như trùng màu nền — đã trả về màu nhấn của chủ đề.");
    }

    const platform = PLATFORMS[project.brief.platform];
    if (platform && platform.aspect !== project.aspect) report.push(`Lưu ý: khung hình đang là ${project.aspect}, khác với nền tảng đã chọn (${platform.aspect}).`);
    if (project.brief.platform === "shorts" && totalDuration() > 180) report.push("Video dọc dài hơn 3 phút có thể không được tính là Shorts/Reels.");

    project.scenes.forEach((s, i) => {
      if (s.type === "bullets" && !s.bullets.length) report.push(`Cảnh ${i + 1} chưa có ý nào — hãy nhập các ý chính.`);
      if (words(s.caption) > 60) report.push(`Cảnh ${i + 1} có lời thuyết minh dài (${words(s.caption)} từ) — phụ đề sẽ tự chia đoạn, nhưng nên tách thành 2 cảnh.`);
    });
    if (!report.length) report.push("Mọi thứ đã ổn: thời lượng, độ tương phản và bố cục đều hợp lý.");
    return report;
  }

  function showReport(list) {
    const ul = $("optReport");
    ul.textContent = "";
    list.forEach((t) => ul.appendChild(el("li", { text: t })));
  }

  /* ---------- Giao diện kịch bản ---------- */

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (k === "text") node.textContent = v;
      else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v);
    });
    (children || []).forEach((c) => node.appendChild(c));
    return node;
  }

  // Hộp xác nhận ngay trong trang (trình xem Artifact chặn confirm()/alert() của trình duyệt)
  function askConfirm(message, okLabel) {
    const dlg = $("confirmDlg");
    if (!dlg || typeof dlg.showModal !== "function") return Promise.resolve(window.confirm(message));
    $("confirmMsg").textContent = message;
    $("confirmOk").textContent = okLabel || "Đồng ý";
    return new Promise((resolve) => {
      const done = () => { dlg.removeEventListener("close", done); resolve(dlg.returnValue === "ok"); };
      dlg.returnValue = "";
      dlg.addEventListener("close", done);
      dlg.showModal();
    });
  }

  function notify(message) {
    const st = $("genStatus");
    st.textContent = message;
    st.scrollIntoView({ block: "nearest" });
  }

  // Lưu tệp: trong Artifact dùng khả năng "downloads" (người xem xác nhận); trên web thường dùng liên kết tải về
  async function saveFile(blob, filename) {
    const dl = window.claude && typeof window.claude.use === "function" ? await window.claude.use("downloads").catch(() => null) : null;
    if (dl) {
      try { await dl.save({ filename, data: blob }); return "saved"; } catch (e) {
        return e && e.code === "declined" ? "declined" : "failed";
      }
    }
    const a = el("a", { href: URL.createObjectURL(blob), download: filename });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 60000);
    return "saved";
  }

  function changed(rerenderList) {
    save();
    sim = null;
    if (rerenderList) renderList();
    seekTo(Math.min(globalT, totalDuration()));
  }

  function renderList() {
    const list = $("sceneList");
    list.textContent = "";
    project.scenes.forEach((s, i) => {
      const actions = el("div", { class: "scene-actions" }, [
        el("button", { type: "button", title: "Lên", "aria-label": "Chuyển cảnh lên", text: "↑", onclick: (e) => { e.stopPropagation(); move(i, -1); } }),
        el("button", { type: "button", title: "Xuống", "aria-label": "Chuyển cảnh xuống", text: "↓", onclick: (e) => { e.stopPropagation(); move(i, 1); } }),
        el("button", { type: "button", title: "Nhân bản", "aria-label": "Nhân bản cảnh", text: "⧉", onclick: (e) => { e.stopPropagation(); duplicate(i); } }),
        el("button", { type: "button", title: "Xóa", "aria-label": "Xóa cảnh", class: "danger", text: "✕", onclick: (e) => { e.stopPropagation(); remove(i); } })
      ]);
      const li = el("li", { class: i === selected ? "active" : "", tabindex: "0", onclick: () => select(i), onkeydown: (e) => { if (e.key === "Enter") select(i); } }, [
        el("div", { class: "scene-meta" }, [
          el("strong", { text: s.title || "(chưa đặt tên)" }),
          el("span", { class: "muted", text: `${SIMS[s.type].label} · ${s.duration}s${s.autoDur ? " · tự động" : ""}` })
        ]),
        actions
      ]);
      list.appendChild(li);
    });
    $("totalLabel").textContent = `Tổng ${fmtTime(totalDuration())} · mục tiêu ${fmtTime(project.brief.targetSec)}`;
    renderEditor();
    updateTransport();
  }

  function select(i) {
    selected = i;
    renderList();
    if (!playing) seekTo(sceneStart(i));
  }

  function move(i, d) {
    const j = i + d; if (j < 0 || j >= project.scenes.length) return;
    const arr = project.scenes; [arr[i], arr[j]] = [arr[j], arr[i]];
    selected = j; changed(true);
  }
  function duplicate(i) {
    const copy = JSON.parse(JSON.stringify(project.scenes[i])); copy.id = uid();
    project.scenes.splice(i + 1, 0, copy); selected = i + 1; changed(true);
  }
  async function remove(i) {
    if (project.scenes.length <= 1) { notify("Video cần ít nhất một cảnh."); return; }
    if (!(await askConfirm(`Xóa cảnh “${project.scenes[i].title}”?`, "Xóa cảnh"))) return;
    project.scenes.splice(i, 1); selected = Math.min(selected, project.scenes.length - 1); changed(true);
  }

  function renderEditor() {
    const box = $("editor");
    box.textContent = "";
    const s = project.scenes[selected];
    if (!s) return;
    const def = SIMS[s.type];
    box.appendChild(el("h2", { text: `Cảnh ${selected + 1}: ${def.label}` }));

    const durInput = el("input", { type: "number", min: "2", max: "120", step: "1" });
    const autoBox = el("input", { type: "checkbox" });
    const refreshDur = () => { durInput.value = String(s.duration); autoBox.checked = s.autoDur; durInput.disabled = s.autoDur; };
    const textChanged = () => {
      if (s.autoDur) { const d = autoDuration(s); if (d !== s.duration) { s.duration = d; refreshDur(); sim = null; renderListLight(); } }
      save(); seekTo(globalT);
    };

    const title = el("input", { type: "text", maxlength: "140" }); title.value = s.title;
    title.addEventListener("input", () => { s.title = title.value; refreshListLabels(); textChanged(); });
    const cap = el("textarea", { rows: "3", maxlength: "800" }); cap.value = s.caption;
    const capInfo = el("span", { class: "muted small" });
    const showCapInfo = () => { capInfo.textContent = `${words(s.caption)} từ · cần ~${Math.ceil(words(s.caption) / WPS)} giây để đọc`; };
    showCapInfo();
    cap.addEventListener("input", () => { s.caption = cap.value; showCapInfo(); textChanged(); });

    box.appendChild(el("div", { class: "field" }, [el("label", { text: "Tiêu đề cảnh" }), title]));
    box.appendChild(el("div", { class: "field" }, [el("label", {}, [document.createTextNode("Lời thuyết minh / phụ đề "), capInfo]), cap]));

    if (s.type === "bullets") {
      const bl = el("textarea", { rows: "5" }); bl.value = s.bullets.join("\n");
      bl.addEventListener("input", () => { s.bullets = bl.value.split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 8); sim = null; textChanged(); });
      box.appendChild(el("div", { class: "field" }, [el("label", { text: "Các ý chính (mỗi dòng một ý, tối đa 8)" }), bl]));
    }

    refreshDur();
    durInput.addEventListener("change", () => { s.duration = clamp(Number(durInput.value) || 10, 2, 120); changed(true); });
    autoBox.addEventListener("change", () => { s.autoDur = autoBox.checked; if (s.autoDur) s.duration = autoDuration(s); changed(true); });
    box.appendChild(el("div", { class: "field row-inline" }, [
      el("label", { text: "Thời lượng (giây)" }), durInput,
      el("label", { class: "check" }, [autoBox, document.createTextNode(" Tự tính theo lời thoại")])
    ]));

    if (def.params.length) {
      box.appendChild(el("h3", { text: "Thông số mô phỏng" }));
      def.params.forEach((q) => {
        const out = el("output", { class: "mono" });
        const range = el("input", { type: "range", min: String(q.min), max: String(q.max), step: String(q.step) });
        range.value = String(s.params[q.key]);
        const show = () => { out.textContent = `${Number(range.value).toLocaleString("vi-VN")} ${q.unit}`.trim(); };
        show();
        range.addEventListener("input", () => { s.params[q.key] = Number(range.value); show(); changed(false); });
        box.appendChild(el("div", { class: "field param" }, [el("label", {}, [document.createTextNode(q.label + " "), out]), range]));
      });
      box.appendChild(el("button", {
        type: "button", text: "Khôi phục thông số mặc định",
        onclick: () => { def.params.forEach((q) => { s.params[q.key] = q.value; }); changed(true); }
      }));
    }
  }

  function renderListLight() {
    const li = $("sceneList").children[selected];
    const s = project.scenes[selected];
    if (li && s) li.querySelector("span").textContent = `${SIMS[s.type].label} · ${s.duration}s${s.autoDur ? " · tự động" : ""}`;
    $("totalLabel").textContent = `Tổng ${fmtTime(totalDuration())} · mục tiêu ${fmtTime(project.brief.targetSec)}`;
  }

  function refreshListLabels() {
    const li = $("sceneList").children[selected];
    if (li) li.querySelector("strong").textContent = project.scenes[selected].title || "(chưa đặt tên)";
  }

  /* ---------- Bảng phong cách ---------- */

  const STYLE_RANGES = [
    ["textScale", "stTextScale", (v) => `${Math.round(v * 100)}%`],
    ["titleScale", "stTitleScale", (v) => `${Math.round(v * 100)}%`],
    ["captionScale", "stCaptionScale", (v) => `${Math.round(v * 100)}%`],
    ["simScale", "stSimScale", (v) => `${Math.round(v * 100)}%`],
    ["speed", "stSpeed", (v) => `×${v.toLocaleString("vi-VN")}`]
  ];

  function syncStyleUi() {
    const st = project.style;
    $("stTheme").value = st.theme; $("stFont").value = st.font;
    $("stCaptionPos").value = st.captionPos; $("stCaptionStyle").value = st.captionStyle;
    $("stTransition").value = st.transition; $("stProgress").checked = st.showProgress;
    STYLE_RANGES.forEach(([k, id, f]) => { $(id).value = String(st[k]); $(id + "Out").textContent = f(st[k]); });
    setTheme(st);
    $("stBg").value = st.bg || C.bg1; $("stInk").value = st.ink || C.ink; $("stAccent").value = st.accent || C.a;
    checkContrast();
  }

  function checkContrast() {
    setTheme(project.style);
    const r = contrast(C.ink, C.bg1);
    const warn = $("contrastWarn");
    if (r < 4.5) { warn.hidden = false; warn.textContent = `Chữ và nền chưa đủ tương phản (${r.toFixed(1)}:1, nên ≥ 4,5:1). Bấm “Tối ưu tự động” để sửa.`; }
    else warn.hidden = true;
  }

  function styleChanged() { save(); sim = null; checkContrast(); seekTo(globalT); }

  /* ---------- Ý tưởng → kịch bản ---------- */

  function syncBriefUi() {
    const b = project.brief;
    $("idea").value = b.idea; $("audience").value = b.audience; $("tone").value = b.tone;
    $("targetSec").value = String(b.targetSec); $("lang").value = b.lang; $("platform").value = b.platform;
    $("notes").value = b.notes; $("autoStyle").checked = b.autoStyle;
  }

  function readBrief() {
    project.brief = sanitizeBrief({
      idea: $("idea").value, audience: $("audience").value, tone: $("tone").value, targetSec: Number($("targetSec").value),
      lang: $("lang").value, platform: $("platform").value, notes: $("notes").value, autoStyle: $("autoStyle").checked
    });
    save();
    return project.brief;
  }

  function setBusy(on) {
    ["btnClaudeWrite", "btnPasteClip", "btnCopyPrompt", "btnTemplate", "btnImport", "btnAuto", "btnExport", "btnPlay"].forEach((id) => { $(id).disabled = on; });
  }

  function needIdea(brief) {
    if (words(brief.idea) >= 2) return false;
    $("genStatus").textContent = "Hãy nhập ý tưởng (ít nhất vài từ) trước.";
    $("idea").focus();
    return true;
  }

  async function copyPrompt() {
    const brief = readBrief();
    if (needIdea(brief)) return;
    const text = window.EduAI.buildPrompt(brief);
    const box = $("promptOut");
    box.value = text;
    let copied = false;
    try { await navigator.clipboard.writeText(text); copied = true; } catch (_) { /* trình duyệt chặn: cho người dùng tự chép */ }
    if (!copied) {
      box.hidden = false; box.focus(); box.select();
      try { copied = document.execCommand("copy"); } catch (_) { copied = false; }
    }
    $("genStatus").textContent = copied
      ? "Đã sao chép lời nhắc. Mở Claude, dán vào khung chat và gửi; xong chép nguyên câu trả lời dán vào ô bên dưới."
      : "Trình duyệt không cho tự sao chép — hãy chép nội dung trong ô xám ở trên (Ctrl/Cmd + C).";
  }

  // Thay kịch bản hiện tại bằng kết quả mới, rồi tối ưu và hiện báo cáo
  function applyResult(result, brief) {
    const scenes = result.scenes.map(sanitizeScene).filter(Boolean);
    if (!scenes.length) throw new Error("Kịch bản không có cảnh hợp lệ (loại cảnh không có trong thư viện).");
    project.scenes = scenes;
    project.title = result.title;
    project.aspect = PLATFORMS[brief.platform].aspect;
    if (brief.autoStyle && result.style) project.style = sanitizeStyle({ ...project.style, ...result.style, bg: "", ink: "", accent: "" });
    selected = 0;
    $("projTitle").value = project.title; $("aspect").value = project.aspect;
    applySize(720);
    showReport(optimize());
    syncStyleUi();
    changed(true); seekTo(0);
    return scenes.length;
  }

  async function confirmReplace() {
    return project.scenes.length <= 1 || askConfirm("Kịch bản mới sẽ thay thế các cảnh hiện tại. Tiếp tục?", "Thay kịch bản");
  }

  async function importPasted() {
    const brief = readBrief();
    const text = $("pasteJson").value;
    if (!text.trim()) { $("genStatus").textContent = "Chưa có nội dung — hãy dán câu trả lời của Claude vào ô trên."; $("pasteJson").focus(); return false; }
    try {
      const result = window.EduAI.parseScript(text, brief);
      if (!(await confirmReplace())) return false;
      setPlaying(false);
      const n = applyResult(result, brief);
      $("genStatus").textContent = `Đã dựng ${n} cảnh, tổng ${fmtTime(totalDuration())}. Xem trước, chỉnh nếu cần rồi xuất video.`;
      return true;
    } catch (err) {
      $("genStatus").textContent = err && err.message ? err.message : String(err);
      return false;
    }
  }

  async function useTemplate() {
    const brief = readBrief();
    if (needIdea(brief) || !(await confirmReplace())) return;
    setPlaying(false);
    const n = applyResult(window.EduAI.templateScript(brief), brief);
    $("genStatus").textContent = `Đã dựng kịch bản mẫu ${n} cảnh. Kịch bản mẫu chỉ có nội dung chung — hãy sửa lời thuyết minh, hoặc dùng “Sao chép lời nhắc” để Claude viết riêng theo ý tưởng.`;
  }

  // Viết kịch bản bằng Claude ngay trong trang — chỉ có khi mở dưới dạng Artifact trên claude.ai (dùng hạn mức nick của người xem)
  let claudeAbort = null;
  const SAMPLE_ERRORS = {
    not_granted: "Bạn chưa cho phép trang này dùng Claude. Hãy dùng cách “Sao chép lời nhắc” bên dưới.",
    sampling_disabled: "Tài khoản này không dùng được Claude trong trang. Hãy dùng cách “Sao chép lời nhắc”.",
    rate_limited: "Nick Claude đang hết lượt hoặc gửi quá nhanh. Đợi một lúc rồi thử lại, hoặc đổi nick.",
    session_expired: "Phiên đăng nhập Claude đã hết hạn. Hãy đăng nhập lại claude.ai rồi thử lại.",
    refused: "Claude từ chối ý tưởng này. Hãy diễn đạt lại theo hướng giáo dục.",
    empty_completion: "Claude không trả lời gì. Hãy rút gọn ý tưởng rồi thử lại.",
    prompt_too_large: "Ý tưởng quá dài. Hãy rút gọn rồi thử lại.",
    cancelled: "Đã dừng viết kịch bản.",
    upstream_error: "Kết nối tới Claude bị gián đoạn. Hãy thử lại."
  };

  async function writeWithClaude() {
    const brief = readBrief();
    if (needIdea(brief)) return false;
    const sample = await window.claude.use("sample").catch(() => null);
    if (!sample) { notify(SAMPLE_ERRORS.not_granted); return false; }
    setBusy(true);
    $("btnStopClaude").hidden = false;
    claudeAbort = new AbortController();
    notify("Claude đang suy nghĩ… (thường 20–90 giây)");
    try {
      const { text, truncated } = await sample(window.EduAI.buildPrompt(brief), {
        signal: claudeAbort.signal,
        onText: ({ text: t }) => { $("genStatus").textContent = `Claude đang viết… ${t.length.toLocaleString("vi-VN")} ký tự`; }
      });
      $("pasteJson").value = text;
      if (truncated) { notify("Câu trả lời bị cắt giữa chừng. Hãy giảm độ dài mục tiêu rồi thử lại."); return false; }
      const result = window.EduAI.parseScript(text, brief);
      setPlaying(false);
      const n = applyResult(result, brief);
      notify(`Claude đã viết xong ${n} cảnh, tổng ${fmtTime(totalDuration())}. Xem trước bên dưới; vừa ý thì bấm “Xuất video”.`);
      setPlaying(true);
      try { canvas.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (_) { /* trình duyệt cũ: bỏ qua */ }
      return true;
    } catch (e) {
      if (e && e.code) {
        if (e.text) $("pasteJson").value = e.text;
        notify(SAMPLE_ERRORS[e.code] || `Không viết được kịch bản (${e.code}). Hãy thử lại hoặc dùng “Sao chép lời nhắc”.`);
      } else notify(e && e.message ? e.message : String(e));
      return false;
    } finally {
      claudeAbort = null;
      $("btnStopClaude").hidden = true;
      setBusy(false);
    }
  }

  /* ---------- Một nút: mở Claude với lời nhắc điền sẵn, tự lấy kịch bản khi quay lại tab ---------- */
  let coSample = false; // trang chạy trong claude.ai và được gọi Claude trực tiếp
  let choKichBan = null; // {loiNhac, brief} khi đang chờ người dùng mang câu trả lời của Claude về

  async function taoBangClaude() {
    if (coSample) { await writeWithClaude(); return; }
    const brief = readBrief();
    if (needIdea(brief)) return;
    const loiNhac = window.EduAI.buildPrompt(brief);
    try { await navigator.clipboard.writeText(loiNhac); } catch (_) { /* không chép được cũng không sao: lời nhắc đã điền sẵn trong link */ }
    const ma = encodeURIComponent(loiNhac);
    const url = ma.length < 14000 ? `https://claude.ai/new?q=${ma}` : "https://claude.ai/new";
    choKichBan = { loiNhac, brief };
    $("btnPasteClip").hidden = false;
    $("genStatus").textContent = "Đã mở Claude ở tab mới. Bấm gửi; khi Claude viết xong, bấm nút Copy dưới câu trả lời rồi quay lại đây — video tự dựng. (Nếu khung chat trống: bấm vào khung và dán, lời nhắc đã được chép sẵn.)";
    window.open(url, "_blank", "noopener");
  }

  // Đọc bộ nhớ tạm; tuNut = người dùng bấm nút (trình duyệt như Safari chỉ cho đọc khi có thao tác bấm)
  async function layTuBoNhoTam(tuNut) {
    let text = "";
    try { text = await navigator.clipboard.readText(); } catch (_) {
      if (tuNut) {
        $("pasteJson").closest("details").open = true; $("pasteJson").focus();
        $("genStatus").textContent = "Trình duyệt không cho đọc bộ nhớ tạm. Hãy dán câu trả lời vào ô bên dưới (Ctrl/Cmd + V, hoặc giữ ngón tay → Dán).";
      }
      return false;
    }
    return nhanCauTraLoi(text, tuNut);
  }

  // Nhận câu trả lời của Claude (từ bộ nhớ tạm hoặc từ thao tác dán), dựng ngay không hỏi lại
  async function nhanCauTraLoi(text, baoLoi) {
    const brief = choKichBan ? choKichBan.brief : readBrief();
    if (!text || !text.trim() || (choKichBan && text.trim() === choKichBan.loiNhac.trim())) {
      if (baoLoi) $("genStatus").textContent = "Chưa thấy câu trả lời của Claude. Trong tab Claude, chờ viết xong rồi bấm nút Copy dưới câu trả lời, sau đó quay lại đây.";
      return false;
    }
    let result;
    try { result = window.EduAI.parseScript(text, brief); } catch (err) {
      if (baoLoi) $("genStatus").textContent = "Câu trả lời chưa đọc được (" + (err && err.message ? err.message : err) + "). Nếu Claude chưa viết xong, chờ xong rồi bấm Copy lại.";
      return false;
    }
    setPlaying(false);
    const n = applyResult(result, brief);
    $("pasteJson").value = text;
    choKichBan = null;
    $("btnPasteClip").hidden = true;
    $("genStatus").textContent = `Xong! Đã dựng ${n} cảnh, tổng ${fmtTime(totalDuration())}, màu và cỡ chữ đã tự chọn. Xem trước bên dưới; vừa ý thì bấm “Xuất video”.`;
    setPlaying(true);
    try { canvas.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (_) { /* trình duyệt cũ: bỏ qua */ }
    return true;
  }

  async function autoMake() {
    const viaClaude = coSample && !$("pasteJson").value.trim();
    if (!(viaClaude ? await writeWithClaude() : await importPasted())) return;
    $("genStatus").textContent += " Đang xuất video…";
    startExport();
  }

  /* ---------- Xuất video ---------- */

  // Xuất từng khung bằng WebCodecs + mp4-muxer (engine/xuat.js) — cùng hàm render(t) với xem trước, không quay màn hình
  async function startExport() {
    setPlaying(false);
    let mod;
    try { mod = await import("./engine/xuat.js"); } catch (_) { mod = null; }
    if (!mod || !mod.hoTroXuat()) {
      $("exportStatus").textContent = "Trình duyệt này chưa hỗ trợ xuất từng khung (WebCodecs). Hãy dùng Chrome hoặc Edge bản mới.";
      return;
    }
    const quality = Number($("quality").value);
    applySize(quality);
    exporting = { huy: new AbortController() };
    toggleExportUi(true);
    sim = null;
    const total = totalDuration();
    try {
      const kq = await mod.xuatMp4({
        W: canvas.width, H: canvas.height, fps: 30, thoiLuong: total,
        bitrate: quality >= 1440 ? 14e6 : quality >= 1080 ? 8e6 : 5e6,
        veKhung: (ctx2, t) => { globalT = t; render(Math.min(t, total - 1e-6)); ctx2.drawImage(canvas, 0, 0); },
        huy: exporting.huy.signal,
        onTienTrinh: (p, i, n) => { $("exportStatus").textContent = `Đang dựng từng khung… ${Math.floor(p * 100)}% (${i}/${n})`; }
      });
      const blob = new Blob([kq.buffer], { type: "video/mp4" });
      const name = `${slug(project.title) || "video-mo-phong"}.mp4`;
      const size = `${(blob.size / 1048576).toFixed(1)} MB`;
      const r = await saveFile(blob, name);
      $("exportStatus").textContent = r === "saved"
        ? `Đã xuất “${name}” (${size}, ${kq.codec}, ${kq.thongKe.so_khung} khung trong ${kq.thongKe.thoi_gian_xuat_giay} s).`
        : r === "declined" ? "Bạn đã từ chối lưu tệp. Bấm “Xuất video” để dựng và lưu lại." : "Không lưu được tệp trong chế độ xem này.";
    } catch (err) {
      $("exportStatus").textContent = err && err.name === "AbortError" ? "Đã dừng xuất video." : "Lỗi xuất video: " + (err && err.message);
    } finally {
      exporting = null;
      toggleExportUi(false);
      applySize(720); seekTo(0);
    }
  }

  function cancelExport() {
    if (exporting) exporting.huy.abort();
  }

  function toggleExportUi(on) {
    $("btnExport").hidden = on; $("btnCancel").hidden = !on;
    ["btnPlay", "btnRestart", "seek", "aspect", "quality", "btnAdd", "btnNew", "btnSample", "btnCopyPrompt", "btnTemplate", "btnImport", "btnAuto"].forEach((id) => { $(id).disabled = on; });
    document.body.classList.toggle("is-exporting", on);
  }

  function slug(s) {
    return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  }

  /* ---------- Khởi động ---------- */

  function fillSelect(id, entries) {
    const sel = $(id);
    entries.forEach(([value, label]) => sel.appendChild(el("option", { value, text: label })));
  }

  function syncProjectFields() {
    $("projTitle").value = project.title;
    $("projAuthor").value = project.author;
    $("aspect").value = project.aspect;
    syncBriefUi();
    syncStyleUi();
  }

  function replaceProject(next) {
    project = next; selected = 0; syncProjectFields(); applySize(720); changed(true); seekTo(0);
  }

  function init() {
    const groups = {};
    Object.entries(SIMS).forEach(([k, d]) => { (groups[d.group] = groups[d.group] || []).push([k, d.label]); });
    Object.entries(groups).forEach(([g, items]) => {
      const og = el("optgroup", { label: g });
      items.forEach(([k, label]) => og.appendChild(el("option", { value: k, text: label })));
      $("addType").appendChild(og);
    });
    fillSelect("audience", Object.entries(AUDIENCES).map(([k, v]) => [k, v.charAt(0).toUpperCase() + v.slice(1)]));
    fillSelect("tone", Object.entries(TONES).map(([k, v]) => [k, v.charAt(0).toUpperCase() + v.slice(1)]));
    fillSelect("platform", Object.entries(PLATFORMS).map(([k, v]) => [k, v.label]));
    fillSelect("stTheme", Object.entries(THEMES).map(([k, v]) => [k, v.label]));
    fillSelect("stFont", Object.entries(FONTS).map(([k, v]) => [k, v.label]));

    $("btnAdd").addEventListener("click", () => {
      project.scenes.splice(selected + 1, 0, makeScene($("addType").value));
      selected += 1; changed(true); seekTo(sceneStart(selected));
    });
    $("btnPlay").addEventListener("click", () => setPlaying(!playing));
    $("btnRestart").addEventListener("click", () => { setPlaying(false); seekTo(0); });
    $("seek").addEventListener("input", (e) => seekTo(totalDuration() * Number(e.target.value) / 1000));
    $("projTitle").addEventListener("input", (e) => { project.title = e.target.value; save(); });
    $("projAuthor").addEventListener("input", (e) => { project.author = e.target.value; save(); seekTo(globalT); });
    $("aspect").addEventListener("change", (e) => { project.aspect = e.target.value; save(); applySize(720); seekTo(globalT); });
    $("btnExport").addEventListener("click", startExport);
    $("btnCancel").addEventListener("click", cancelExport);
    $("btnNew").addEventListener("click", async () => {
      if (!(await askConfirm("Bắt đầu dự án mới? Dự án hiện tại sẽ bị thay thế (hãy lưu tệp .json trước nếu cần).", "Tạo mới"))) return;
      const intro = makeScene("title"); intro.title = "Tên bài học"; intro.caption = "Giới thiệu ngắn về nội dung.";
      replaceProject({ title: "Video mới", author: project.author, aspect: project.aspect, style: project.style, brief: { ...project.brief, idea: "" }, scenes: [intro] });
    });
    $("btnSample").addEventListener("click", async () => {
      if (!(await askConfirm("Mở dự án mẫu? Dự án hiện tại sẽ bị thay thế.", "Mở mẫu"))) return;
      replaceProject(sampleProject());
    });
    $("btnSaveJson").addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
      saveFile(blob, `${slug(project.title) || "du-an-video"}.json`).then((r) => { if (r === "failed") notify("Không lưu được tệp trong chế độ xem này."); });
    });
    $("fileImport").addEventListener("change", async (e) => {
      const file = e.target.files && e.target.files[0]; e.target.value = "";
      if (!file) return;
      try {
        const next = sanitize(JSON.parse(await file.text()));
        if (!next) throw new Error("bad");
        replaceProject(next);
      } catch (_) { notify("Tệp không đúng định dạng dự án của Xưởng Video Mô Phỏng."); }
    });

    // Ý tưởng & AI
    ["idea", "audience", "tone", "targetSec", "lang", "notes", "autoStyle"].forEach((id) => $(id).addEventListener("change", () => { readBrief(); renderListLight(); }));
    $("platform").addEventListener("change", () => {
      readBrief();
      project.aspect = PLATFORMS[project.brief.platform].aspect; $("aspect").value = project.aspect;
      save(); applySize(720); seekTo(globalT);
    });
    $("btnCopyPrompt").addEventListener("click", copyPrompt);
    $("btnTemplate").addEventListener("click", useTemplate);
    $("btnImport").addEventListener("click", importPasted);
    $("btnAuto").addEventListener("click", autoMake);
    $("btnClaudeWrite").addEventListener("click", taoBangClaude);
    $("btnPasteClip").addEventListener("click", () => layTuBoNhoTam(true));
    // Quay lại tab sau khi bấm Copy trong Claude → tự đọc kịch bản (Chrome/Edge hỏi quyền đọc bộ nhớ tạm một lần)
    const khiQuayLai = () => { if (choKichBan && !document.hidden) layTuBoNhoTam(false); };
    window.addEventListener("focus", khiQuayLai);
    document.addEventListener("visibilitychange", khiQuayLai);
    // Dán ở bất kỳ đâu trên trang (ngoài các ô nhập) cũng được nhận là câu trả lời của Claude
    document.addEventListener("paste", (e) => {
      const tg = e.target;
      if (tg && (tg.tagName === "TEXTAREA" || tg.tagName === "INPUT" || tg.isContentEditable)) return;
      const text = e.clipboardData && e.clipboardData.getData("text");
      if (text && /"scenes"/.test(text)) { e.preventDefault(); nhanCauTraLoi(text, true); }
    });
    $("btnStopClaude").addEventListener("click", () => { if (claudeAbort) claudeAbort.abort(); });
    // Nút "Viết bằng Claude" chỉ hiện khi trang chạy trong trình xem claude.ai có khả năng gọi Claude
    if (window.claude && typeof window.claude.use === "function") {
      window.claude.use("sample").then((sample) => {
        if (!sample) return;
        coSample = true;
        $("claudeHint").textContent = "Claude viết ngay trong trang, dùng hạn mức nick Claude đang đăng nhập (lần đầu sẽ hỏi bạn cho phép). Viết xong video tự dựng và tự chọn màu, cỡ chữ.";
      }).catch(() => {});
    }

    // Phong cách
    $("stTheme").addEventListener("change", (e) => { project.style.theme = e.target.value; project.style.bg = ""; project.style.ink = ""; project.style.accent = ""; syncStyleUi(); styleChanged(); });
    $("stFont").addEventListener("change", (e) => { project.style.font = e.target.value; styleChanged(); });
    $("stCaptionPos").addEventListener("change", (e) => { project.style.captionPos = e.target.value; styleChanged(); });
    $("stCaptionStyle").addEventListener("change", (e) => { project.style.captionStyle = e.target.value; styleChanged(); });
    $("stTransition").addEventListener("change", (e) => { project.style.transition = e.target.value; styleChanged(); });
    $("stProgress").addEventListener("change", (e) => { project.style.showProgress = e.target.checked; styleChanged(); });
    STYLE_RANGES.forEach(([k, id, f]) => $(id).addEventListener("input", (e) => { project.style[k] = Number(e.target.value); $(id + "Out").textContent = f(project.style[k]); styleChanged(); }));
    [["stBg", "bg"], ["stInk", "ink"], ["stAccent", "accent"]].forEach(([id, k]) => $(id).addEventListener("input", (e) => { project.style[k] = e.target.value; styleChanged(); }));
    $("btnResetColors").addEventListener("click", () => { project.style.bg = ""; project.style.ink = ""; project.style.accent = ""; syncStyleUi(); styleChanged(); });
    $("btnOptimize").addEventListener("click", () => { readBrief(); showReport(optimize()); syncStyleUi(); changed(true); });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden && exporting) $("exportStatus").textContent = "Bạn vừa rời tab — video có thể bị giật. Nên quay lại tab này cho tới khi xuất xong.";
    });
    if ("speechSynthesis" in window) window.speechSynthesis.getVoices();

    syncProjectFields();
    applySize(720);
    renderList();
    seekTo(0);
  }

  init();
})();
