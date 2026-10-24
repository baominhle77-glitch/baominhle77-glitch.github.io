// Đồ thị cảnh: mỗi nút có x, y, scale, rot, opacity, con; camera là một nút riêng.
// Thuộc tính đọc theo thứ tự: hàm (t) → giá trị tween trên dòng thời gian → giá trị gốc.
export const PHONG = "K1Sans";

export class Nut {
  constructor(props = {}) {
    Object.assign(this, { x: 0, y: 0, scale: 1, rot: 0, opacity: 1, con: [], ve: null }, props);
  }
  them(...ns) { this.con.push(...ns); return this; }
}

export function gt(rc, nut, prop) {
  const v = nut[prop];
  if (typeof v === "function" && prop !== "ve") return v(rc.t, rc);
  return rc.tl.lay(nut, prop, rc.t, v);
}

function veNut(rc, nut) {
  const op = gt(rc, nut, "opacity");
  if (op <= 0.002) return;
  const { ctx } = rc;
  ctx.save();
  ctx.translate(gt(rc, nut, "x"), gt(rc, nut, "y"));
  const r = gt(rc, nut, "rot");
  if (r) ctx.rotate(r);
  const s = gt(rc, nut, "scale");
  if (s !== 1) ctx.scale(s, s);
  ctx.globalAlpha *= op;
  if (nut.ve) nut.ve(rc, nut);
  for (const c of nut.con) veNut(rc, c);
  ctx.restore();
}

// Vẽ một khung. canh = { nen(rc), lop: [{goc, parallax, man}], camera: Nut{x,y,zoom,rot} }
export function veKhung(ctx, canh, t, tl, fmt) {
  const { W, H } = fmt;
  const rc = { ctx, t, tl, fmt, W, H, khungChu: [] };
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  if (canh.nen) canh.nen(rc);
  const cam = canh.camera;
  const cx = gt(rc, cam, "x"); const cy = gt(rc, cam, "y");
  const zoom = gt(rc, cam, "zoom"); const rot = gt(rc, cam, "rot");
  rc.zoom = zoom; rc.camX = cx; rc.camY = cy;
  for (const lop of canh.lop) {
    ctx.save();
    if (!lop.man) {
      const p = lop.parallax == null ? 1 : lop.parallax;
      const z = Math.pow(zoom, p);
      ctx.translate(W / 2, H / 2);
      if (rot) ctx.rotate(rot * p);
      ctx.scale(z, z);
      ctx.translate(-(W / 2 + (cx - W / 2) * p), -(H / 2 + (cy - H / 2) * p));
    }
    rc.lopHienTai = lop.ten || "";
    veNut(rc, lop.goc);
    ctx.restore();
  }
  return rc;
}

// --- Chữ: đo, vẽ, ghi lại hộp bao trên màn hình để tự kiểm (tràn vùng an toàn, vào vùng PiP, chồng chữ) ---

export function phong(size, weight = 400, italic = false) {
  return `${italic ? "italic " : ""}${weight} ${Math.round(size * 100) / 100}px ${PHONG}, "Source Sans 3", system-ui, sans-serif`;
}

export function ghiHop(rc, x0, y0, x1, y1, text) {
  const m = rc.ctx.getTransform();
  const pts = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]);
  const xs = pts.map((p) => p[0]); const ys = pts.map((p) => p[1]);
  if (rc.ctx.globalAlpha > 0.05) rc.khungChu.push({ text, lop: rc.lopHienTai, x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys), alpha: rc.ctx.globalAlpha });
}

// Vẽ chữ một dòng; "→" được vẽ bằng nét (phông con không có ký tự mũi tên) để hình giống nhau trên mọi máy.
export function veChu(rc, text, x, y, o = {}) {
  const { ctx } = rc;
  const size = o.size || 32;
  if (rc.khongChu) return { w: 0, x0: x, x1: x, y0: y, y1: y }; // phản chiếu/bóng: không vẽ chữ
  ctx.font = phong(size, o.weight || 400, o.italic);
  ctx.textBaseline = "alphabetic";
  const parts = String(text).split("→");
  const arrowW = size * 0.95;
  const widths = parts.map((p) => ctx.measureText(p).width);
  const total = widths.reduce((a, b) => a + b, 0) + (parts.length - 1) * arrowW;
  let x0 = x;
  if (o.align === "center") x0 = x - total / 2;
  else if (o.align === "right") x0 = x - total;
  const asc = size * 0.72; const desc = size * 0.22;
  let yb = y;
  if (o.baseline === "middle") yb = y + (asc - desc) / 2;
  else if (o.baseline === "top") yb = y + asc;
  // Chữ gần mép vùng an toàn hoặc vùng PiP thì mờ dần, chạm mép thì không vẽ: chữ không bao giờ bị cắt hay bị che
  const m = ctx.getTransform();
  const pts = [[x0, yb - asc], [x0 + total, yb - asc], [x0, yb + desc], [x0 + total, yb + desc]].map(([px, py]) => [m.a * px + m.c * py + m.e, m.b * px + m.d * py + m.f]);
  const sx0 = Math.min(...pts.map((q) => q[0])); const sx1 = Math.max(...pts.map((q) => q[0]));
  const sy0 = Math.min(...pts.map((q) => q[1])); const sy1 = Math.max(...pts.map((q) => q[1]));
  let mo = 1;
  if (rc.fmt && rc.fmt.an) {
    const [a0, b0, a1, b1] = rc.fmt.an;
    mo = Math.min(mo, Math.max(0, Math.min(sx0 - a0, a1 - sx1, sy0 - b0, b1 - sy1) / 36));
  }
  if (rc.fmt && rc.fmt.pip) {
    const [p0, q0, p1, q1] = rc.fmt.pip;
    const tach = Math.max(p0 - sx1, sx0 - p1, q0 - sy1, sy0 - q1);
    mo = Math.min(mo, Math.max(0, tach / 24));
  }
  // chữ trong cảnh (không phải lớp màn hình) mờ đi khi lia qua dải phụ đề: không bao giờ bị hộp phụ đề che
  if (rc.lopHienTai && rc.lopHienTai !== "man") {
    // chữ trong cảnh mờ đi khi lia qua dải phụ đề hoặc vùng dòng nguồn: không chồng lên chữ lớp màn hình
    for (const vung of [rc.fmt && rc.fmt.daiPhuDe, rc.fmt && rc.fmt.vungNguon]) {
      if (!vung) continue;
      const [p0, q0, p1, q1] = vung;
      const tach = Math.max(p0 - sx1, sx0 - p1, q0 - sy1, sy0 - q1);
      mo = Math.min(mo, Math.max(0, tach / 20));
    }
  }
  mo = Math.min(1, mo);
  if (mo <= 0) return { w: total, x0, x1: x0 + total, y0: yb - asc, y1: yb + desc };
  ctx.save();
  ctx.globalAlpha *= mo;
  ctx.fillStyle = o.color || "#1C232B";
  let cx = x0;
  parts.forEach((p, i) => {
    ctx.fillText(p, cx, yb);
    cx += widths[i];
    if (i < parts.length - 1) {
      const ay = yb - size * 0.3;
      ctx.save();
      ctx.strokeStyle = o.color || "#1C232B"; ctx.lineWidth = Math.max(1.5, size * 0.07); ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(cx + size * 0.15, ay); ctx.lineTo(cx + arrowW - size * 0.15, ay);
      ctx.moveTo(cx + arrowW - size * 0.36, ay - size * 0.2); ctx.lineTo(cx + arrowW - size * 0.15, ay); ctx.lineTo(cx + arrowW - size * 0.36, ay + size * 0.2);
      ctx.stroke(); ctx.restore();
      cx += arrowW;
    }
  });
  ghiHop(rc, x0, yb - asc, x0 + total, yb + desc, text);
  ctx.restore();
  return { w: total, x0, x1: x0 + total, y0: yb - asc, y1: yb + desc };
}

export function doChu(rc, text, size, weight = 400) {
  rc.ctx.font = phong(size, weight);
  const parts = String(text).split("→");
  return parts.reduce((a, p) => a + rc.ctx.measureText(p).width, 0) + (parts.length - 1) * size * 0.95;
}

// Bộ sinh số ngẫu nhiên có hạt giống (mulberry32) — cấm Math.random trong khung hình
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
