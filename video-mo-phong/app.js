(function () {
  "use strict";
  const { SIMS, C, font, px, roundRect } = window.EduSims;
  const STORE_KEY = "video-mo-phong:v1";
  const DT = 1 / 60;
  const SIZES = { "16:9": [16, 9], "9:16": [9, 16], "1:1": [1, 1] };

  const $ = (id) => document.getElementById(id);
  const canvas = $("stage");
  const ctx = canvas.getContext("2d");

  let project = load() || sampleProject();
  let selected = 0;
  let playing = false;
  let globalT = 0;
  let lastTick = 0;
  let sim = null; // { sceneId, key, inst, t }
  let spokenScene = -1;
  let exporting = null;

  /* ---------- Dữ liệu dự án ---------- */

  function uid() { return Math.random().toString(36).slice(2, 10); }

  function makeScene(type) {
    const def = SIMS[type];
    const params = {};
    def.params.forEach((q) => { params[q.key] = q.value; });
    return { id: uid(), type, title: def.title || def.label, caption: def.caption || "", duration: type === "title" ? 5 : 15, params };
  }

  function sampleProject() {
    const intro = makeScene("title");
    intro.title = "Khoa học qua mô phỏng";
    intro.caption = "Ba ví dụ: con lắc, thuốc trong máu và dịch bệnh.";
    const s1 = makeScene("pendulum");
    const s2 = makeScene("pk"); s2.duration = 18;
    const s3 = makeScene("sir"); s3.duration = 18;
    const outro = makeScene("title");
    outro.title = "Cảm ơn bạn đã theo dõi!";
    outro.caption = "Hãy thử tự thay đổi thông số và quan sát kết quả.";
    return { title: "Khoa học qua mô phỏng", author: "", aspect: "16:9", scenes: [intro, s1, s2, s3, outro] };
  }

  function sanitize(p) {
    if (!p || !Array.isArray(p.scenes)) return null;
    const scenes = p.scenes.filter((s) => s && SIMS[s.type]).map((s) => {
      const base = makeScene(s.type);
      const params = { ...base.params };
      SIMS[s.type].params.forEach((q) => {
        const v = Number(s.params && s.params[q.key]);
        if (Number.isFinite(v)) params[q.key] = Math.min(q.max, Math.max(q.min, v));
      });
      return {
        id: typeof s.id === "string" ? s.id : uid(), type: s.type,
        title: String(s.title == null ? base.title : s.title).slice(0, 140),
        caption: String(s.caption == null ? "" : s.caption).slice(0, 600),
        duration: Math.min(120, Math.max(2, Number(s.duration) || base.duration)), params
      };
    });
    if (!scenes.length) return null;
    return { title: String(p.title || "").slice(0, 120), author: String(p.author || "").slice(0, 80), aspect: SIZES[p.aspect] ? p.aspect : "16:9", scenes };
  }

  function load() {
    try { return sanitize(JSON.parse(localStorage.getItem(STORE_KEY))); } catch (_) { return null; }
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

  // Dựng lại mô phỏng khi đổi cảnh, đổi thông số hoặc tua lùi; luôn bước cố định để kết quả lặp lại được.
  function simFor(scene, local) {
    const key = JSON.stringify([scene.type, scene.params, scene.duration]);
    if (!sim || sim.sceneId !== scene.id || sim.key !== key || sim.t > local + 1e-9) {
      sim = { sceneId: scene.id, key, inst: SIMS[scene.type].create({ ...scene.params }, scene.duration), t: 0 };
    }
    let guard = 0;
    while (sim.t + DT <= local + 1e-9 && guard++ < 20000) { sim.inst.step(DT); sim.t += DT; }
    return sim.inst;
  }

  /* ---------- Vẽ khung hình ---------- */

  function wrap(text, maxW) {
    const lines = []; let line = "";
    String(text).split(/\s+/).forEach((word) => {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = word; } else line = test;
    });
    if (line) lines.push(line);
    return lines;
  }

  function render(t) {
    const W = canvas.width; const H = canvas.height;
    const unit = Math.min(W, H) / 720;
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#0b1220"); bg.addColorStop(1, "#141b34");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const loc = locate(t);
    if (!loc) return;
    const { scene, local, index } = loc;
    const inst = simFor(scene, local);
    const margin = 28 * unit;
    const headH = 76 * unit; const footH = 128 * unit;
    const box = { x: margin, y: headH, w: W - 2 * margin, h: H - headH - footH, unit };
    const fadeIn = playing ? Math.min(1, local / 0.45) : 1;

    ctx.save();
    ctx.globalAlpha = fadeIn;
    if (inst.bigTitle) {
      inst.draw(ctx, { x: 0, y: 0, w: W, h: H, unit }, local);
      ctx.fillStyle = C.ink; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = font({ unit }, W > H ? 54 : 46, 800);
      const lines = wrap(scene.title, W * 0.8);
      const lh = 64 * unit; const y0 = H / 2 - (lines.length - 1) * lh / 2 - 30 * unit;
      lines.forEach((l, i) => ctx.fillText(l, W / 2, y0 + i * lh));
      ctx.font = font({ unit }, 24, 500); ctx.fillStyle = C.muted;
      wrap(scene.caption, W * 0.75).forEach((l, i) => ctx.fillText(l, W / 2, y0 + lines.length * lh + 10 * unit + i * 34 * unit));
    } else {
      ctx.save(); inst.draw(ctx, box, local); ctx.restore();
      ctx.fillStyle = C.ink; ctx.font = font({ unit }, 30, 800); ctx.textAlign = "left"; ctx.textBaseline = "middle";
      ctx.fillText(wrap(scene.title, W - 2 * margin)[0] || "", margin, headH / 2 + 4 * unit);
      if (scene.caption) {
        ctx.font = font({ unit }, 24, 600);
        const lines = wrap(scene.caption, W - 4 * margin).slice(0, 3);
        const lh = 32 * unit; const bh = lines.length * lh + 22 * unit;
        const by = H - footH + (footH - bh) / 2 - 8 * unit;
        ctx.fillStyle = "rgba(0,0,0,.6)"; roundRect(ctx, margin, by, W - 2 * margin, bh, 14 * unit); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "top";
        lines.forEach((l, i) => ctx.fillText(l, W / 2, by + 11 * unit + i * lh));
      }
    }
    ctx.restore();

    // Chân khung: tên người dạy + thanh tiến độ bài
    const total = totalDuration();
    ctx.fillStyle = "rgba(159,176,208,.25)"; ctx.fillRect(0, H - 6 * unit, W, 6 * unit);
    ctx.fillStyle = C.a; ctx.fillRect(0, H - 6 * unit, W * Math.min(1, t / total), 6 * unit);
    ctx.font = font({ unit }, 15, 600); ctx.fillStyle = C.muted; ctx.textBaseline = "bottom";
    if (project.author) { ctx.textAlign = "right"; ctx.fillText(project.author, W - margin, H - 14 * unit); }
    ctx.textAlign = "left"; ctx.fillText(`${index + 1}/${project.scenes.length}`, margin, H - 14 * unit);

    if (index !== spokenScene) { spokenScene = index; maybeSpeak(scene); }
  }

  function maybeSpeak(scene) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    if (!playing || exporting || !$("readAloud").checked) return;
    const text = [scene.title, scene.caption].filter(Boolean).join(". ");
    if (!text) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "vi-VN";
    const vi = window.speechSynthesis.getVoices().find((v) => /^vi/i.test(v.lang));
    if (vi) u.voice = vi;
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
      if (exporting) { finishExport(); return; }
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
          el("span", { class: "muted", text: `${SIMS[s.type].label} · ${s.duration}s` })
        ]),
        actions
      ]);
      list.appendChild(li);
    });
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
  function remove(i) {
    if (project.scenes.length <= 1) { alert("Video cần ít nhất một cảnh."); return; }
    if (!confirm(`Xóa cảnh “${project.scenes[i].title}”?`)) return;
    project.scenes.splice(i, 1); selected = Math.min(selected, project.scenes.length - 1); changed(true);
  }

  function renderEditor() {
    const box = $("editor");
    box.textContent = "";
    const s = project.scenes[selected];
    if (!s) return;
    const def = SIMS[s.type];
    box.appendChild(el("h2", { text: `Cảnh ${selected + 1}: ${def.label}` }));

    const title = el("input", { type: "text", maxlength: "140" }); title.value = s.title;
    title.addEventListener("input", () => { s.title = title.value; save(); refreshListLabels(); seekTo(globalT); });
    const cap = el("textarea", { rows: "3", maxlength: "600" }); cap.value = s.caption;
    cap.addEventListener("input", () => { s.caption = cap.value; save(); seekTo(globalT); });
    const dur = el("input", { type: "number", min: "2", max: "120", step: "1" }); dur.value = String(s.duration);
    dur.addEventListener("change", () => { s.duration = Math.min(120, Math.max(2, Number(dur.value) || 10)); dur.value = String(s.duration); changed(true); });

    box.appendChild(el("div", { class: "field" }, [el("label", { text: "Tiêu đề cảnh" }), title]));
    box.appendChild(el("div", { class: "field" }, [el("label", { text: "Phụ đề / lời thuyết minh" }), cap]));
    box.appendChild(el("div", { class: "field" }, [el("label", { text: "Thời lượng (giây)" }), dur]));

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

  function refreshListLabels() {
    const li = $("sceneList").children[selected];
    if (li) li.querySelector("strong").textContent = project.scenes[selected].title || "(chưa đặt tên)";
  }

  /* ---------- Xuất video ---------- */

  function pickMime() {
    if (!window.MediaRecorder) return null;
    const list = ["video/mp4;codecs=avc1.42E01E,mp4a.40.2", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
    return list.find((m) => MediaRecorder.isTypeSupported(m)) || "";
  }

  async function startExport() {
    const mime = pickMime();
    if (mime === null || !canvas.captureStream) {
      $("exportStatus").textContent = "Trình duyệt này chưa hỗ trợ ghi video. Hãy dùng Chrome, Edge, Firefox hoặc Safari bản mới.";
      return;
    }
    setPlaying(false);
    applySize(Number($("quality").value));
    const stream = canvas.captureStream(30);
    let mic = null;
    if ($("useMic").checked) {
      try {
        mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
        mic.getAudioTracks().forEach((tr) => stream.addTrack(tr));
      } catch (_) {
        $("exportStatus").textContent = "Không mở được micro — video sẽ được xuất không có tiếng.";
      }
    }
    const chunks = [];
    const bitrate = Number($("quality").value) >= 1080 ? 8e6 : 5e6;
    let rec;
    try { rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: bitrate } : { videoBitsPerSecond: bitrate }); }
    catch (_) { rec = new MediaRecorder(stream); }
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    exporting = { rec, chunks, mic, stream, cancelled: false };
    rec.onstop = () => {
      const job = exporting; exporting = null;
      if (job.mic) job.mic.getTracks().forEach((tr) => tr.stop());
      job.stream.getTracks().forEach((tr) => tr.stop());
      toggleExportUi(false);
      applySize(720); seekTo(0);
      if (job.cancelled) { $("exportStatus").textContent = "Đã dừng xuất video."; return; }
      const type = rec.mimeType || mime || "video/webm";
      const blob = new Blob(chunks, { type });
      const ext = /mp4/.test(type) ? "mp4" : "webm";
      const name = `${slug(project.title) || "video-mo-phong"}.${ext}`;
      const a = el("a", { href: URL.createObjectURL(blob), download: name });
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 60000);
      $("exportStatus").textContent = `Đã xuất “${name}” (${(blob.size / 1048576).toFixed(1)} MB).` + (ext === "webm" ? " Tệp .webm mở được trên YouTube, Facebook; nếu cần .mp4 hãy dùng công cụ chuyển đổi." : "");
    };
    toggleExportUi(true);
    globalT = 0; sim = null; render(0);
    rec.start(1000);
    $("exportStatus").textContent = "Đang ghi… vui lòng giữ tab này mở.";
    setPlaying(true);
  }

  function finishExport() {
    playing = false;
    updateTransport();
    // Giữ khung cuối thêm một nhịp để bộ ghi nhận đủ hình
    setTimeout(() => { if (exporting && exporting.rec.state !== "inactive") exporting.rec.stop(); }, 300);
  }

  function cancelExport() {
    if (!exporting) return;
    exporting.cancelled = true; playing = false;
    if (exporting.rec.state !== "inactive") exporting.rec.stop();
  }

  function toggleExportUi(on) {
    $("btnExport").hidden = on; $("btnCancel").hidden = !on;
    ["btnPlay", "btnRestart", "seek", "aspect", "quality", "btnAdd", "btnNew", "btnSample"].forEach((id) => { $(id).disabled = on; });
    document.body.classList.toggle("is-exporting", on);
  }

  function slug(s) {
    return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  }

  /* ---------- Khởi động ---------- */

  function syncProjectFields() {
    $("projTitle").value = project.title;
    $("projAuthor").value = project.author;
    $("aspect").value = project.aspect;
  }

  function init() {
    const groups = {};
    Object.entries(SIMS).forEach(([k, d]) => { (groups[d.group] = groups[d.group] || []).push([k, d.label]); });
    Object.entries(groups).forEach(([g, items]) => {
      const og = el("optgroup", { label: g });
      items.forEach(([k, label]) => og.appendChild(el("option", { value: k, text: label })));
      $("addType").appendChild(og);
    });

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
    $("btnNew").addEventListener("click", () => {
      if (!confirm("Bắt đầu dự án mới? Dự án hiện tại sẽ bị thay thế (hãy lưu tệp .json trước nếu cần).")) return;
      const intro = makeScene("title"); intro.title = "Tên bài học"; intro.caption = "Giới thiệu ngắn về nội dung.";
      project = { title: "Video mới", author: project.author, aspect: project.aspect, scenes: [intro] };
      selected = 0; syncProjectFields(); applySize(720); changed(true); seekTo(0);
    });
    $("btnSample").addEventListener("click", () => {
      if (!confirm("Mở dự án mẫu? Dự án hiện tại sẽ bị thay thế.")) return;
      project = sampleProject(); selected = 0; syncProjectFields(); applySize(720); changed(true); seekTo(0);
    });
    $("btnSaveJson").addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
      const a = el("a", { href: URL.createObjectURL(blob), download: `${slug(project.title) || "du-an-video"}.json` });
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 30000);
    });
    $("fileImport").addEventListener("change", async (e) => {
      const file = e.target.files && e.target.files[0]; e.target.value = "";
      if (!file) return;
      try {
        const next = sanitize(JSON.parse(await file.text()));
        if (!next) throw new Error("bad");
        project = next; selected = 0; syncProjectFields(); applySize(720); changed(true); seekTo(0);
      } catch (_) { alert("Tệp không đúng định dạng dự án của Xưởng Video Mô Phỏng."); }
    });
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
