/* Thư viện mô phỏng cho Xưởng Video Mô Phỏng.
 * Mỗi mô phỏng: { label, group, params[], create(values, durationSec) -> { step(dt), draw(ctx, box, t) } }.
 * step() luôn được gọi với bước cố định nên kết quả lặp lại y hệt giữa xem trước và lúc xuất video. */
(function (global) {
  "use strict";

  const C = {
    ink: "#e8eefc", muted: "#9fb0d0", grid: "rgba(159,176,208,.18)", axis: "rgba(232,238,252,.55)",
    a: "#5ec8ff", b: "#ffb454", c: "#7ee081", d: "#ff7a90", e: "#c59bff"
  };

  function px(box, size) { return Math.max(10, Math.round(size * box.unit)); }
  function font(box, size, weight) { return `${weight || 600} ${px(box, size)}px system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif`; }

  // Chia vùng vẽ thành phần mô phỏng + phần đồ thị, tự đổi bố cục theo khung ngang/dọc.
  function split(box, ratio) {
    const r = ratio || 0.55;
    if (box.w >= box.h) {
      const w1 = box.w * r;
      return [{ x: box.x, y: box.y, w: w1, h: box.h }, { x: box.x + w1, y: box.y, w: box.w - w1, h: box.h }];
    }
    const h1 = box.h * r;
    return [{ x: box.x, y: box.y, w: box.w, h: h1 }, { x: box.x, y: box.y + h1, w: box.w, h: box.h - h1 }];
  }

  function inset(r, m) { return { x: r.x + m, y: r.y + m, w: Math.max(1, r.w - 2 * m), h: Math.max(1, r.h - 2 * m) }; }

  function fmt(n, d) {
    if (!Number.isFinite(n)) return "—";
    return n.toLocaleString("vi-VN", { maximumFractionDigits: d == null ? 1 : d, minimumFractionDigits: 0 });
  }

  // Đồ thị nhiều đường: series = [{ color, label, points:[[x,y]...] }]
  // Làm tròn trục lên mốc "đẹp" (1, 2, 2,5, 5 × 10ⁿ) để nhãn số dễ đọc trên video
  function niceStep(span) {
    const raw = span / 4; const mag = Math.pow(10, Math.floor(Math.log10(raw || 1)));
    const f = raw / mag;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * mag;
  }

  function chart(ctx, box, r, opt) {
    if (!opt.fixedY) opt = { ...opt, yMax: opt.yMin + niceStep(opt.yMax - opt.yMin) * 4 };
    if (opt.niceX) opt = { ...opt, xMax: opt.xMin + niceStep(opt.xMax - opt.xMin) * 4 };
    const pad = { l: px(box, 52), r: px(box, 14), t: px(box, 30), b: px(box, 40) };
    const g = { x: r.x + pad.l, y: r.y + pad.t, w: r.w - pad.l - pad.r, h: r.h - pad.t - pad.b };
    const X = (v) => g.x + (v - opt.xMin) / (opt.xMax - opt.xMin || 1) * g.w;
    const Y = (v) => g.y + g.h - (v - opt.yMin) / (opt.yMax - opt.yMin || 1) * g.h;
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = C.grid;
    ctx.fillStyle = C.muted;
    ctx.font = font(box, 13, 500);
    for (let i = 0; i <= 4; i++) {
      const yv = opt.yMin + (opt.yMax - opt.yMin) * i / 4;
      const yy = Y(yv);
      ctx.beginPath(); ctx.moveTo(g.x, yy); ctx.lineTo(g.x + g.w, yy); ctx.stroke();
      ctx.textAlign = "right"; ctx.textBaseline = "middle";
      ctx.fillText(fmt(yv, opt.yDigits == null ? 1 : opt.yDigits), g.x - 6, yy);
    }
    for (let i = 0; i <= 4; i++) {
      const xv = opt.xMin + (opt.xMax - opt.xMin) * i / 4;
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillText(fmt(xv, opt.xDigits == null ? 1 : opt.xDigits), X(xv), g.y + g.h + 6);
    }
    ctx.strokeStyle = C.axis;
    ctx.beginPath(); ctx.moveTo(g.x, g.y); ctx.lineTo(g.x, g.y + g.h); ctx.lineTo(g.x + g.w, g.y + g.h); ctx.stroke();
    ctx.fillStyle = C.ink; ctx.font = font(box, 14, 700);
    ctx.textAlign = "left"; ctx.textBaseline = "bottom";
    if (opt.yLabel) ctx.fillText(opt.yLabel, g.x, g.y - 8);
    ctx.textAlign = "right"; ctx.textBaseline = "bottom";
    if (opt.xLabel) ctx.fillText(opt.xLabel, g.x + g.w, g.y + g.h + pad.b);

    (opt.bands || []).forEach((band) => {
      ctx.fillStyle = band.color;
      const y1 = Y(Math.min(band.to, opt.yMax)); const y2 = Y(Math.max(band.from, opt.yMin));
      ctx.fillRect(g.x, y1, g.w, y2 - y1);
      if (band.label) { ctx.fillStyle = band.text || C.muted; ctx.font = font(box, 12, 600); ctx.textAlign = "left"; ctx.textBaseline = "bottom"; ctx.fillText(band.label, g.x + 6, y2 - 3); }
    });

    ctx.save();
    ctx.beginPath(); ctx.rect(g.x, g.y - 2, g.w, g.h + 4); ctx.clip();
    opt.series.forEach((s) => {
      if (!s.points.length) return;
      ctx.strokeStyle = s.color; ctx.lineWidth = Math.max(2, 2.5 * box.unit); ctx.lineJoin = "round";
      ctx.beginPath();
      s.points.forEach((p, i) => (i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1]))));
      ctx.stroke();
      const last = s.points[s.points.length - 1];
      ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(X(last[0]), Y(last[1]), Math.max(3, 4 * box.unit), 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();

    let lx = g.x + 8;
    ctx.font = font(box, 13, 600); ctx.textBaseline = "top"; ctx.textAlign = "left";
    opt.series.forEach((s) => {
      if (!s.label) return;
      ctx.fillStyle = s.color; ctx.fillRect(lx, g.y + 6, px(box, 12), px(box, 4));
      ctx.fillStyle = C.ink; ctx.fillText(s.label, lx + px(box, 16), g.y);
      lx += px(box, 24) + ctx.measureText(s.label).width;
    });
    ctx.restore();
    return { X, Y, g };
  }

  // Bảng số liệu nhỏ góc khung
  function readout(ctx, box, x, y, rows) {
    ctx.save();
    ctx.font = font(box, 15, 600);
    const lh = px(box, 22);
    let maxW = 0;
    rows.forEach((r) => { maxW = Math.max(maxW, ctx.measureText(`${r[0]}: ${r[1]}`).width); });
    ctx.fillStyle = "rgba(8,14,28,.72)";
    ctx.strokeStyle = "rgba(159,176,208,.25)";
    roundRect(ctx, x, y, maxW + px(box, 24), lh * rows.length + px(box, 14), px(box, 10));
    ctx.fill(); ctx.stroke();
    ctx.textBaseline = "top"; ctx.textAlign = "left";
    rows.forEach((r, i) => {
      ctx.fillStyle = C.muted; ctx.fillText(`${r[0]}: `, x + px(box, 12), y + px(box, 7) + i * lh);
      const w = ctx.measureText(`${r[0]}: `).width;
      ctx.fillStyle = r[2] || C.ink; ctx.fillText(String(r[1]), x + px(box, 12) + w, y + px(box, 7) + i * lh);
    });
    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  function arrow(ctx, x1, y1, x2, y2, color, width) {
    const a = Math.atan2(y2 - y1, x2 - x1); const hl = Math.max(8, width * 4);
    ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - hl * Math.cos(a - 0.4), y2 - hl * Math.sin(a - 0.4));
    ctx.lineTo(x2 - hl * Math.cos(a + 0.4), y2 - hl * Math.sin(a + 0.4));
    ctx.closePath(); ctx.fill(); ctx.restore();
  }

  // Bộ sinh số ngẫu nhiên có hạt giống: mỗi lần dựng lại cảnh cho đúng cùng một chuyển động.
  function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }

  const SIMS = {};

  SIMS.title = {
    label: "Cảnh tiêu đề / chữ", group: "Chung",
    params: [],
    caption: "Hôm nay chúng ta cùng tìm hiểu qua mô phỏng trực quan.",
    title: "Bài học mới",
    create() {
      return {
        step() {},
        draw(ctx, box, t) {
          const cx = box.x + box.w / 2; const cy = box.y + box.h / 2;
          ctx.save();
          for (let i = 0; i < 3; i++) {
            const r = (Math.min(box.w, box.h) * (0.18 + i * 0.12)) + Math.sin(t * 1.2 + i) * 6 * box.unit;
            ctx.strokeStyle = [C.a, C.b, C.e][i]; ctx.globalAlpha = 0.35; ctx.lineWidth = 3 * box.unit;
            ctx.beginPath(); ctx.arc(cx, cy, r, t * 0.4 + i, t * 0.4 + i + Math.PI * 1.3); ctx.stroke();
          }
          ctx.restore();
        },
        bigTitle: true
      };
    }
  };

  SIMS.pendulum = {
    label: "Con lắc đơn", group: "Vật lý",
    title: "Dao động của con lắc đơn",
    caption: "Chu kỳ con lắc phụ thuộc chiều dài dây và gia tốc trọng trường, gần như không phụ thuộc khối lượng.",
    params: [
      { key: "L", label: "Chiều dài dây", unit: "m", min: 0.2, max: 5, step: 0.1, value: 1.5 },
      { key: "theta0", label: "Góc lệch ban đầu", unit: "°", min: 5, max: 170, step: 1, value: 35 },
      { key: "g", label: "Gia tốc trọng trường", unit: "m/s²", min: 1, max: 25, step: 0.1, value: 9.8 },
      { key: "damp", label: "Lực cản (giảm dần biên độ)", unit: "", min: 0, max: 1, step: 0.01, value: 0.05 }
    ],
    create(p) {
      let th = p.theta0 * Math.PI / 180; let om = 0; let time = 0;
      const hist = []; const trail = [];
      const acc = (a, w) => -(p.g / p.L) * Math.sin(a) - p.damp * w;
      const T0 = 2 * Math.PI * Math.sqrt(p.L / p.g);
      return {
        step(dt) {
          // Runge–Kutta bậc 4 cho phương trình phi tuyến θ'' = -(g/L)·sinθ - b·θ'
          const k1a = om, k1w = acc(th, om);
          const k2a = om + k1w * dt / 2, k2w = acc(th + k1a * dt / 2, om + k1w * dt / 2);
          const k3a = om + k2w * dt / 2, k3w = acc(th + k2a * dt / 2, om + k2w * dt / 2);
          const k4a = om + k3w * dt, k4w = acc(th + k3a * dt, om + k3w * dt);
          th += dt / 6 * (k1a + 2 * k2a + 2 * k3a + k4a);
          om += dt / 6 * (k1w + 2 * k2w + 2 * k3w + k4w);
          time += dt;
          hist.push([time, th * 180 / Math.PI]);
          trail.push(th); if (trail.length > 40) trail.shift();
        },
        draw(ctx, box) {
          const [ra, rb] = split(box, 0.5);
          const area = inset(ra, px(box, 20));
          const pivot = { x: area.x + area.w / 2, y: area.y + px(box, 20) };
          const scale = Math.min(area.h * 0.8, area.w * 0.45) / Math.max(p.L, 0.2);
          const len = p.L * scale;
          ctx.save();
          ctx.strokeStyle = C.axis; ctx.lineWidth = 4 * box.unit;
          ctx.beginPath(); ctx.moveTo(pivot.x - 60 * box.unit, pivot.y); ctx.lineTo(pivot.x + 60 * box.unit, pivot.y); ctx.stroke();
          ctx.setLineDash([6, 6]); ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(pivot.x, pivot.y); ctx.lineTo(pivot.x, pivot.y + len + 20 * box.unit); ctx.stroke();
          ctx.setLineDash([]);
          trail.forEach((a, i) => {
            ctx.fillStyle = `rgba(94,200,255,${(i / trail.length) * 0.35})`;
            ctx.beginPath(); ctx.arc(pivot.x + len * Math.sin(a), pivot.y + len * Math.cos(a), 6 * box.unit, 0, Math.PI * 2); ctx.fill();
          });
          const bx = pivot.x + len * Math.sin(th); const by = pivot.y + len * Math.cos(th);
          ctx.strokeStyle = C.ink; ctx.lineWidth = 2.5 * box.unit;
          ctx.beginPath(); ctx.moveTo(pivot.x, pivot.y); ctx.lineTo(bx, by); ctx.stroke();
          const grad = ctx.createRadialGradient(bx - 6, by - 6, 2, bx, by, 22 * box.unit);
          grad.addColorStop(0, "#ffe2b0"); grad.addColorStop(1, C.b);
          ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(bx, by, 20 * box.unit, 0, Math.PI * 2); ctx.fill();
          // vectơ vận tốc tiếp tuyến
          const v = om * p.L; const vs = scale * 0.35;
          arrow(ctx, bx, by, bx + Math.cos(th) * v * vs, by - Math.sin(th) * v * vs, C.c, 3 * box.unit);
          ctx.restore();
          readout(ctx, box, area.x, area.y + area.h - px(box, 104), [
            ["Góc", `${fmt(th * 180 / Math.PI, 1)}°`, C.b],
            ["Vận tốc", `${fmt(Math.abs(v), 2)} m/s`, C.c],
            ["Chu kỳ (góc nhỏ) T ≈ 2π√(L/g)", `${fmt(T0, 2)} s`]
          ]);
          const win = 10; const t1 = Math.max(win, time);
          const pts = hist.filter((h) => h[0] >= t1 - win);
          chart(ctx, box, inset(rb, px(box, 10)), {
            xMin: t1 - win, xMax: t1, yMin: -p.theta0 * 1.1, yMax: p.theta0 * 1.1, yDigits: 0, fixedY: true,
            xLabel: "thời gian (s)", yLabel: "góc lệch θ (°)",
            series: [{ color: C.b, label: "θ(t)", points: pts }]
          });
        }
      };
    }
  };

  SIMS.projectile = {
    label: "Ném xiên (chuyển động ném)", group: "Vật lý",
    title: "Chuyển động ném xiên",
    caption: "Theo phương ngang vật chuyển động đều, theo phương đứng vật chịu gia tốc trọng trường g.",
    params: [
      { key: "v0", label: "Vận tốc ban đầu", unit: "m/s", min: 2, max: 60, step: 1, value: 20 },
      { key: "angle", label: "Góc ném", unit: "°", min: 5, max: 85, step: 1, value: 45 },
      { key: "g", label: "Gia tốc trọng trường", unit: "m/s²", min: 1, max: 25, step: 0.1, value: 9.8 },
      { key: "slow", label: "Làm chậm (lần)", unit: "×", min: 0.25, max: 4, step: 0.25, value: 1 }
    ],
    create(p) {
      const a = p.angle * Math.PI / 180; const vx = p.v0 * Math.cos(a); const vy0 = p.v0 * Math.sin(a);
      const tf = 2 * vy0 / p.g; const range = vx * tf; const hmax = vy0 * vy0 / (2 * p.g);
      let simT = 0; const path = [];
      const pos = (t) => [vx * t, vy0 * t - 0.5 * p.g * t * t];
      return {
        step(dt) {
          simT += dt / p.slow;
          // Bay xong thì dừng 1,5 s rồi ném lại để cảnh dài vẫn có chuyển động.
          if (simT > tf + 1.5) { simT = 0; path.length = 0; }
          const tt = Math.min(simT, tf); path.push(pos(tt));
        },
        draw(ctx, box) {
          const r = inset(box, px(box, 34));
          const span = Math.max(range, hmax * 1.6, 1) * 1.08;
          const sc = Math.min(r.w / span, (r.h * 0.85) / Math.max(hmax * 1.15, 0.5));
          const ox = r.x + (r.w - range * sc) / 2; const oy = r.y + r.h;
          const X = (x) => ox + x * sc; const Y = (y) => oy - y * sc;
          ctx.save();
          ctx.strokeStyle = C.axis; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(r.x, oy); ctx.lineTo(r.x + r.w, oy); ctx.stroke();
          ctx.setLineDash([5, 7]); ctx.strokeStyle = "rgba(159,176,208,.4)"; ctx.beginPath();
          for (let i = 0; i <= 60; i++) { const q = pos(tf * i / 60); i ? ctx.lineTo(X(q[0]), Y(q[1])) : ctx.moveTo(X(q[0]), Y(q[1])); }
          ctx.stroke(); ctx.setLineDash([]);
          ctx.strokeStyle = C.a; ctx.lineWidth = 3 * box.unit; ctx.beginPath();
          path.forEach((q, i) => (i ? ctx.lineTo(X(q[0]), Y(q[1])) : ctx.moveTo(X(q[0]), Y(q[1]))));
          ctx.stroke();
          const tt = Math.min(simT, tf); const q = pos(tt);
          const bx = X(q[0]); const by = Y(q[1]);
          const vs = 3 * box.unit * Math.min(1, 25 / p.v0) * 1.4;
          const vyNow = vy0 - p.g * tt;
          arrow(ctx, bx, by, bx + vx * vs, by, C.c, 2.5 * box.unit);
          arrow(ctx, bx, by, bx, by - vyNow * vs, C.d, 2.5 * box.unit);
          ctx.fillStyle = C.b; ctx.beginPath(); ctx.arc(bx, by, 11 * box.unit, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = C.muted; ctx.font = font(box, 13, 600); ctx.textAlign = "center";
          ctx.fillText(`tầm xa ${fmt(range, 1)} m`, X(range), oy + px(box, 18));
          ctx.fillText(`h max ${fmt(hmax, 1)} m`, X(range / 2), Y(hmax) - px(box, 14));
          ctx.restore();
          readout(ctx, box, r.x, r.y, [
            ["t", `${fmt(tt, 2)} s`],
            ["vₓ (không đổi)", `${fmt(vx, 1)} m/s`, C.c],
            ["v_y", `${fmt(vyNow, 1)} m/s`, C.d],
            ["Thời gian bay", `${fmt(tf, 2)} s`]
          ]);
        }
      };
    }
  };

  SIMS.wave = {
    label: "Sóng truyền trên dây", group: "Vật lý",
    title: "Sóng cơ: phần tử dao động tại chỗ",
    caption: "Sóng truyền năng lượng đi xa, còn mỗi phần tử môi trường chỉ dao động quanh vị trí cân bằng.",
    params: [
      { key: "A", label: "Biên độ", unit: "cm", min: 1, max: 10, step: 0.5, value: 4 },
      { key: "f", label: "Tần số", unit: "Hz", min: 0.1, max: 3, step: 0.05, value: 0.5 },
      { key: "lambda", label: "Bước sóng", unit: "cm", min: 10, max: 100, step: 1, value: 40 }
    ],
    create(p) {
      let time = 0; const L = 100;
      return {
        step(dt) { time += dt; },
        draw(ctx, box) {
          const r = inset(box, px(box, 40));
          const midY = r.y + r.h * 0.5; const sx = r.w / L; const sy = (r.h * 0.35) / 10;
          const k = 2 * Math.PI / p.lambda; const w = 2 * Math.PI * p.f;
          const y = (x) => p.A * Math.sin(w * time - k * x);
          ctx.save();
          ctx.strokeStyle = C.grid; ctx.beginPath(); ctx.moveTo(r.x, midY); ctx.lineTo(r.x + r.w, midY); ctx.stroke();
          ctx.strokeStyle = C.a; ctx.lineWidth = 3 * box.unit; ctx.beginPath();
          for (let i = 0; i <= 300; i++) {
            const x = L * i / 300; const yy = x <= p.f * p.lambda * time ? y(x) : 0;
            i ? ctx.lineTo(r.x + x * sx, midY - yy * sy) : ctx.moveTo(r.x + x * sx, midY - yy * sy);
          }
          ctx.stroke();
          for (let i = 0; i <= 20; i++) {
            const x = L * i / 20; const yy = x <= p.f * p.lambda * time ? y(x) : 0;
            ctx.fillStyle = i === 10 ? C.b : "rgba(232,238,252,.7)";
            ctx.beginPath(); ctx.arc(r.x + x * sx, midY - yy * sy, (i === 10 ? 9 : 5) * box.unit, 0, Math.PI * 2); ctx.fill();
          }
          // Mũi tên chiều truyền sóng
          const front = Math.min(L, p.f * p.lambda * time);
          arrow(ctx, r.x + Math.max(0, front - 12) * sx, r.y + r.h * 0.9, r.x + front * sx, r.y + r.h * 0.9, C.c, 3 * box.unit);
          ctx.restore();
          readout(ctx, box, r.x, r.y - px(box, 10), [
            ["Tốc độ truyền v = λ·f", `${fmt(p.lambda * p.f, 1)} cm/s`, C.c],
            ["Chu kỳ T = 1/f", `${fmt(1 / p.f, 2)} s`],
            ["Phần tử màu cam", "chỉ lên – xuống", C.b]
          ]);
        }
      };
    }
  };

  SIMS.diffusion = {
    label: "Khuếch tán qua màng", group: "Sinh học",
    title: "Khuếch tán qua màng bán thấm",
    caption: "Phân tử đi từ nơi nồng độ cao sang nơi nồng độ thấp cho tới khi hai bên cân bằng.",
    params: [
      { key: "nLeft", label: "Số phân tử bên trái", unit: "", min: 20, max: 400, step: 10, value: 240 },
      { key: "nRight", label: "Số phân tử bên phải", unit: "", min: 0, max: 400, step: 10, value: 20 },
      { key: "pore", label: "Độ thấm của màng (kích thước lỗ)", unit: "%", min: 2, max: 60, step: 1, value: 18 },
      { key: "temp", label: "Nhiệt độ (tốc độ chuyển động)", unit: "", min: 0.3, max: 3, step: 0.1, value: 1 }
    ],
    create(p) {
      const R = rng(20261023 + p.nLeft * 7 + p.nRight);
      const parts = [];
      const add = (n, side) => {
        for (let i = 0; i < n; i++) {
          const a = R() * Math.PI * 2; const sp = 0.12 + R() * 0.18;
          parts.push({ o: side, x: side ? 0.52 + R() * 0.46 : 0.02 + R() * 0.46, y: 0.02 + R() * 0.96, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp });
        }
      };
      add(p.nLeft, 0); add(p.nRight, 1);
      const hist = []; let time = 0; let acc = 0;
      const gaps = 9; const poreH = (p.pore / 100) / gaps;
      const inPore = (y) => { const seg = 1 / gaps; const c = (Math.floor(y / seg) + 0.5) * seg; return Math.abs(y - c) < poreH / 2; };
      const count = () => { let l = 0; parts.forEach((q) => { if (q.x < 0.5) l++; }); return [l, parts.length - l]; };
      hist.push([0, ...count()]);
      return {
        step(dt) {
          time += dt; const s = dt * p.temp;
          parts.forEach((q) => {
            const nx = q.x + q.vx * s; const ny = q.y + q.vy * s;
            if ((q.x < 0.5) !== (nx < 0.5) && !inPore(ny)) q.vx = -q.vx;
            else q.x = nx;
            q.y = ny;
            if (q.x < 0.005 || q.x > 0.995) { q.vx = -q.vx; q.x = Math.min(0.995, Math.max(0.005, q.x)); }
            if (q.y < 0.005 || q.y > 0.995) { q.vy = -q.vy; q.y = Math.min(0.995, Math.max(0.005, q.y)); }
          });
          acc += dt; if (acc >= 0.25) { acc = 0; hist.push([time, ...count()]); }
        },
        draw(ctx, box) {
          const [ra, rb] = split(box, 0.55);
          const r = inset(ra, px(box, 18));
          ctx.save();
          ctx.fillStyle = "rgba(94,200,255,.06)"; ctx.fillRect(r.x, r.y, r.w, r.h);
          ctx.strokeStyle = C.axis; ctx.lineWidth = 2; ctx.strokeRect(r.x, r.y, r.w, r.h);
          const mx = r.x + r.w / 2; const seg = r.h / gaps;
          ctx.strokeStyle = C.e; ctx.lineWidth = 6 * box.unit;
          for (let i = 0; i < gaps; i++) {
            const c = r.y + (i + 0.5) * seg; const half = (poreH * r.h) / 2;
            ctx.beginPath(); ctx.moveTo(mx, r.y + i * seg); ctx.lineTo(mx, c - half); ctx.moveTo(mx, c + half); ctx.lineTo(mx, r.y + (i + 1) * seg); ctx.stroke();
          }
          const rad = Math.max(2, 4 * box.unit);
          parts.forEach((q) => {
            ctx.fillStyle = q.o ? C.a : C.b; // tô theo nơi xuất phát để thấy rõ sự pha trộn
            ctx.beginPath(); ctx.arc(r.x + q.x * r.w, r.y + q.y * r.h, rad, 0, Math.PI * 2); ctx.fill();
          });
          ctx.restore();
          const last = hist[hist.length - 1];
          readout(ctx, box, r.x + px(box, 8), r.y + px(box, 8), [["Trái", last[1], C.b], ["Phải", last[2], C.a]]);
          const t1 = Math.max(10, time);
          chart(ctx, box, inset(rb, px(box, 10)), {
            xMin: 0, xMax: t1, yMin: 0, yMax: parts.length, yDigits: 0, xDigits: 0, fixedY: true,
            xLabel: "thời gian (s)", yLabel: "số phân tử",
            series: [
              { color: C.b, label: "bên trái", points: hist.map((h) => [h[0], h[1]]) },
              { color: C.a, label: "bên phải", points: hist.map((h) => [h[0], h[2]]) }
            ]
          });
        }
      };
    }
  };

  SIMS.pk = {
    label: "Dược động học: uống thuốc nhiều liều", group: "Y – Dược",
    title: "Nồng độ thuốc trong máu khi dùng nhiều liều",
    caption: "Sau khoảng 4–5 lần thời gian bán thải, nồng độ thuốc dao động ổn định quanh trạng thái cân bằng.",
    params: [
      { key: "dose", label: "Liều mỗi lần", unit: "mg", min: 10, max: 2000, step: 10, value: 500 },
      { key: "F", label: "Sinh khả dụng F", unit: "%", min: 5, max: 100, step: 1, value: 80 },
      { key: "ka", label: "Hằng số hấp thu ka", unit: "1/giờ", min: 0.1, max: 5, step: 0.05, value: 1.2 },
      { key: "thalf", label: "Thời gian bán thải t½", unit: "giờ", min: 0.5, max: 48, step: 0.5, value: 6 },
      { key: "Vd", label: "Thể tích phân bố Vd", unit: "L", min: 5, max: 500, step: 1, value: 40 },
      { key: "tau", label: "Khoảng cách liều τ", unit: "giờ", min: 1, max: 48, step: 1, value: 8 },
      { key: "n", label: "Số liều", unit: "", min: 1, max: 20, step: 1, value: 6 },
      { key: "mec", label: "Nồng độ tối thiểu có hiệu quả", unit: "mg/L", min: 0, max: 100, step: 0.5, value: 6 },
      { key: "mtc", label: "Nồng độ bắt đầu gây độc", unit: "mg/L", min: 0, max: 200, step: 0.5, value: 20 }
    ],
    create(p, duration) {
      const ke = Math.LN2 / p.thalf; const ka = Math.abs(p.ka - ke) < 1e-6 ? p.ka * 1.001 : p.ka;
      const total = p.n * p.tau + Math.max(p.tau, 3 * p.thalf);
      // Mô hình 1 ngăn, hấp thu bậc 1 — cộng chồng phương trình Bateman cho từng liều
      const conc = (t) => {
        let c = 0;
        for (let i = 0; i < p.n; i++) {
          const td = t - i * p.tau; if (td < 0) break;
          c += (p.F / 100) * p.dose * ka / (p.Vd * (ka - ke)) * (Math.exp(-ke * td) - Math.exp(-ka * td));
        }
        return c;
      };
      const N = 600; const all = []; let cmax = 0;
      for (let i = 0; i <= N; i++) { const t = total * i / N; const c = conc(t); all.push([t, c]); cmax = Math.max(cmax, c); }
      const css = (p.F / 100) * p.dose / (p.Vd * ke * p.tau);
      const yMax = Math.max(cmax, p.mtc || 0, p.mec || 0) * 1.15 || 1;
      let time = 0; const playFor = Math.max(1, (duration || 10) * 0.85);
      return {
        step(dt) { time += dt; },
        draw(ctx, box) {
          const frac = Math.min(1, time / playFor);
          const tNow = total * frac;
          const pts = all.filter((q) => q[0] <= tNow);
          const cNow = conc(tNow);
          const bands = [];
          if (p.mec > 0 && p.mtc > p.mec) bands.push({ from: p.mec, to: p.mtc, color: "rgba(126,224,129,.12)", label: "vùng điều trị", text: C.c });
          if (p.mtc > 0) bands.push({ from: p.mtc, to: yMax * 2, color: "rgba(255,122,144,.12)", label: "vùng có nguy cơ độc", text: C.d });
          const r = inset(box, px(box, 16));
          const plot = chart(ctx, box, r, {
            xMin: 0, xMax: total, yMin: 0, yMax, xDigits: 0, niceX: true,
            xLabel: "thời gian (giờ)", yLabel: "nồng độ trong máu (mg/L)",
            bands, series: [{ color: C.a, label: "C(t)", points: pts }]
          });
          ctx.save();
          for (let i = 0; i < p.n; i++) {
            const td = i * p.tau; if (td > tNow) break;
            const x = plot.X(td);
            ctx.fillStyle = C.b; ctx.beginPath();
            ctx.moveTo(x, plot.g.y + plot.g.h); ctx.lineTo(x - 6 * box.unit, plot.g.y + plot.g.h + 10 * box.unit); ctx.lineTo(x + 6 * box.unit, plot.g.y + plot.g.h + 10 * box.unit); ctx.fill();
          }
          ctx.restore();
          readout(ctx, box, plot.g.x + plot.g.w - px(box, 270), plot.g.y + px(box, 26), [
            ["Thời điểm", `${fmt(tNow, 1)} giờ`],
            ["Nồng độ hiện tại", `${fmt(cNow, 2)} mg/L`, C.a],
            ["Nồng độ TB khi ổn định", `${fmt(css, 2)} mg/L`],
            ["ke = ln2 / t½", `${fmt(ke, 3)} /giờ`]
          ]);
        }
      };
    }
  };

  SIMS.sir = {
    label: "Dịch tễ: lây lan bệnh (mô hình SIR)", group: "Y – Dược",
    title: "Một dịch bệnh lan truyền như thế nào?",
    caption: "Khi hệ số lây nhiễm cơ bản R₀ lớn hơn 1, số ca mắc tăng nhanh rồi giảm dần khi người miễn dịch tăng lên.",
    params: [
      { key: "R0", label: "Hệ số lây nhiễm cơ bản R₀", unit: "", min: 0.5, max: 10, step: 0.1, value: 2.5 },
      { key: "days", label: "Số ngày mắc bệnh trung bình", unit: "ngày", min: 1, max: 30, step: 1, value: 7 },
      { key: "vacc", label: "Tỷ lệ đã có miễn dịch ban đầu", unit: "%", min: 0, max: 95, step: 1, value: 0 },
      { key: "span", label: "Số ngày mô phỏng", unit: "ngày", min: 30, max: 365, step: 5, value: 160 }
    ],
    create(p, duration) {
      const gamma = 1 / p.days; const beta = p.R0 * gamma;
      let S = 1 - p.vacc / 100 - 0.001; let I = 0.001; let Rr = p.vacc / 100;
      const series = [[0, S, I, Rr]]; const h = 0.1;
      for (let d = 0; d < p.span; d += h) {
        const nI = beta * S * I;
        S -= nI * h; I += (nI - gamma * I) * h; Rr += gamma * I * h;
        series.push([d + h, S, I, Rr]);
      }
      let peak = series[0]; series.forEach((s) => { if (s[2] > peak[2]) peak = s; });
      let time = 0; const playFor = Math.max(1, (duration || 10) * 0.85);
      return {
        step(dt) { time += dt; },
        draw(ctx, box) {
          const frac = Math.min(1, time / playFor); const dNow = p.span * frac;
          const pts = series.filter((s) => s[0] <= dNow);
          const [ra, rb] = split(box, 0.62);
          chart(ctx, box, inset(ra, px(box, 10)), {
            xMin: 0, xMax: p.span, yMin: 0, yMax: 100, xDigits: 0, yDigits: 0, fixedY: true,
            xLabel: "ngày", yLabel: "% dân số",
            series: [
              { color: C.a, label: "Có thể nhiễm", points: pts.map((s) => [s[0], s[1] * 100]) },
              { color: C.d, label: "Đang mắc", points: pts.map((s) => [s[0], s[2] * 100]) },
              { color: C.c, label: "Đã khỏi / miễn dịch", points: pts.map((s) => [s[0], s[3] * 100]) }
            ]
          });
          // Lưới 100 người minh họa tỷ lệ hiện tại
          const cur = pts[pts.length - 1]; const r = inset(rb, px(box, 24));
          const cols = 10; const cell = Math.min(r.w / cols, (r.h - px(box, 70)) / 10);
          const gx = r.x + (r.w - cell * cols) / 2; const gy = r.y;
          const nI = Math.round(cur[2] * 100); const nR = Math.round(cur[3] * 100);
          for (let i = 0; i < 100; i++) {
            const col = i < nR ? C.c : i < nR + nI ? C.d : C.a;
            ctx.fillStyle = col; ctx.beginPath();
            ctx.arc(gx + (i % cols + 0.5) * cell, gy + (Math.floor(i / cols) + 0.5) * cell, cell * 0.36, 0, Math.PI * 2); ctx.fill();
          }
          ctx.save(); ctx.fillStyle = C.muted; ctx.font = font(box, 14, 600); ctx.textAlign = "center"; ctx.textBaseline = "top";
          ctx.fillText(`Ngày ${fmt(dNow, 0)} · đỉnh dịch ~ ngày ${fmt(peak[0], 0)} (${fmt(peak[2] * 100, 1)}% đang mắc)`, r.x + r.w / 2, gy + cell * 10 + px(box, 12));
          ctx.fillText(`Ngưỡng miễn dịch cộng đồng ≈ 1 − 1/R₀ = ${p.R0 > 1 ? fmt((1 - 1 / p.R0) * 100, 0) + "%" : "không cần"}`, r.x + r.w / 2, gy + cell * 10 + px(box, 36));
          ctx.restore();
        }
      };
    }
  };

  global.EduSims = { SIMS, C, font, px, roundRect };
})(typeof window !== "undefined" ? window : globalThis);
