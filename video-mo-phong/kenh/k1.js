// Bộ hình kênh K1 Meniscus Lab theo khuon_kenh của Studio:
// thế giới = bàn quang học trong studio chụp ảnh; khối có bóng đổ, nước trong suốt; không lưới;
// nhãn = đường dẫn mảnh + chữ trần, không khung; số đo hiện bằng thước kẹp vẽ.
// Màu (không thêm hex, sắc độ phụ dùng độ mờ): nền #8E969D → #A7ADB3, mực #1C232B,
// xanh nước #3F6A9E = trọng lực/khối lượng, cam #D1834F = sức căng mặt (màu v2 theo luật C13 của Studio, 24/10/2026).
import { veChu, doChu, rng, ghiHop } from "../engine/canh.js";
import { kep, layEase } from "../engine/easing.js";

export const K1 = { NEN_DUOI: "#8E969D", NEN_TREN: "#A7ADB3", MUC: "#1C232B", NUOC: "#3F6A9E", CANG: "#D1834F" };

export function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

// Làm tròn kiểu ROUND_HALF_UP như hồ sơ Studio
export function so(v, k = 2) {
  const p = Math.pow(10, k);
  return (Math.floor(v * p + 0.5 + 1e-9) / p).toFixed(k);
}

// Nền phông studio chuyển sắc + vùng sáng mềm + tối góc (lớp nền, toạ độ màn hình)
export function veNen(rc) {
  const { ctx, W, H, t } = rc;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, K1.NEN_TREN); g.addColorStop(1, K1.NEN_DUOI);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const lx = W * (0.42 + 0.03 * Math.sin(t * 0.07)); const ly = H * 0.32;
  const r = ctx.createRadialGradient(lx, ly, 0, lx, ly, Math.max(W, H) * 0.7);
  r.addColorStop(0, rgba(K1.NEN_TREN, 0.55)); r.addColorStop(1, rgba(K1.NEN_TREN, 0));
  ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
  const sx = W * 0.18 + Math.sin(t * 0.05) * W * 0.01; const sy = H * 0.12;
  const sb = ctx.createRadialGradient(sx, sy, 0, sx, sy, Math.min(W, H) * 0.45);
  sb.addColorStop(0, rgba(K1.NEN_TREN, 0.5)); sb.addColorStop(0.5, rgba(K1.NEN_TREN, 0.18)); sb.addColorStop(1, rgba(K1.NEN_TREN, 0));
  ctx.fillStyle = sb; ctx.fillRect(0, 0, W, H);
  const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.78);
  v.addColorStop(0, rgba(K1.MUC, 0)); v.addColorStop(1, rgba(K1.MUC, 0.16));
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
}

// Bụi sáng trôi chậm (lớp nền, parallax thấp) — hạt giống cố định
export function taoBui(n, x0, x1, y0, y1, seed = 7) {
  const R = rng(seed);
  return Array.from({ length: n }, () => ({ x: x0 + R() * (x1 - x0), y: y0 + R() * (y1 - y0), r: 1.5 + R() * 4, p: R() * 6.28, v: 4 + R() * 10 }));
}
export function veBui(rc, bui) {
  const { ctx, t } = rc;
  for (const b of bui) {
    const a = 0.10 + 0.08 * Math.sin(t * 0.6 + b.p);
    ctx.fillStyle = rgba(K1.NEN_TREN, a + 0.12);
    ctx.beginPath(); ctx.arc(b.x + Math.sin(t * 0.1 + b.p) * 18, b.y - ((t * b.v) % 140), b.r, 0, Math.PI * 2); ctx.fill();
  }
}

// Mặt bàn: đường mép + mặt bàn tối dần + bóng phản chiếu mờ
export function veBan(rc, x0, x1, y, sau = 260) {
  const { ctx } = rc;
  const g = ctx.createLinearGradient(0, y, 0, y + sau);
  g.addColorStop(0, rgba(K1.MUC, 0.10)); g.addColorStop(1, rgba(K1.MUC, 0.02));
  ctx.fillStyle = g; ctx.fillRect(x0, y, x1 - x0, sau);
  ctx.strokeStyle = rgba(K1.MUC, 0.35); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
}

// Mép vũng theo phương trình Young–Laplace 2D (vũng rộng, trọng lực + sức căng mặt).
// Đơn vị ℓc = √(γ / (Δρ g)); φ = góc nghiêng mặt nước, 0 ở đỉnh phẳng, θ ở chân (góc tiếp xúc).
// Độ sâu dưới đỉnh: d = 2ℓc·sin(φ/2) → chiều cao vũng h = 2ℓc·sin(θ/2); dx/dφ = ℓc·cos(φ/2)·cosφ / sinφ.
// Trả về các điểm {x, dn}: x tính từ chỗ phình nhất (φ = 90°), dn = độ sâu chuẩn hoá 0..1.
const PROFIL = new Map();
function profilMep(theta, n = 56) {
  const key = theta.toFixed(4);
  if (PROFIL.has(key)) return PROFIL.get(key);
  const p0 = 0.18; const buoc = 560; const dphi = (theta - p0) / buoc;
  const pts = [{ x: 0, d: 2 * Math.sin(p0 / 2) }];
  let x = 0; let phi = p0;
  for (let i = 0; i < buoc; i++) {
    const pm = phi + dphi / 2;
    x += ((Math.cos(pm / 2) * Math.cos(pm)) / Math.sin(pm)) * dphi;
    phi += dphi;
    if ((i + 1) % (buoc / n) === 0) pts.push({ x, d: 2 * Math.sin(phi / 2) });
  }
  const xm = Math.max(...pts.map((q) => q.x)); const d0 = pts[0].d; const d1 = pts[pts.length - 1].d;
  const out = pts.map((q) => ({ x: q.x - xm, dn: (q.d - d0) / (d1 - d0) }));
  PROFIL.set(key, out);
  return out;
}

// Vũng nước nhìn ngang: đỉnh phẳng, mép là cung meniscus theo góc tiếp xúc θ (mặc định 180° như tập 1).
// h = chiều cao (px) = 2ℓc·sin(θ/2) → ℓc suy ra từ h; w = bề rộng ở chỗ phình nhất. song(x) = độ lệch mặt (px)
export function veVung(rc, { cx, y, w, h, theta = Math.PI, song = null, alpha = 1, bong = true }) {
  const { ctx } = rc;
  const lc = h / (2 * Math.sin(theta / 2));
  const pr = profilMep(theta);
  const k = Math.min(1, (w / 2 - 4) / Math.max(1, -pr[0].x * lc)); // vũng quá hẹp: nén mép cho vừa
  const X = pr.map((q) => q.x * lc * k); const D = pr.map((q) => q.dn * h);
  const yt = y - h;
  ctx.save();
  ctx.globalAlpha *= alpha;
  if (bong) {
    const sg = ctx.createRadialGradient(cx, y + 6, 0, cx, y + 6, w * 0.62);
    sg.addColorStop(0, rgba(K1.MUC, 0.22)); sg.addColorStop(1, rgba(K1.MUC, 0));
    ctx.fillStyle = sg; ctx.beginPath(); ctx.ellipse(cx, y + 8, w * 0.6, Math.max(10, h * 0.18), 0, 0, Math.PI * 2); ctx.fill();
  }
  const duong = () => {
    ctx.beginPath();
    const xl = cx - w / 2 - X[0]; const xr = cx + w / 2 + X[0];
    ctx.moveTo(xl, yt + D[0]);
    for (let x = xl; x < xr; x += 12) ctx.lineTo(x, yt + D[0] + (song ? song(x) : 0));
    for (let i = 0; i < X.length; i++) ctx.lineTo(cx + w / 2 + X[i], yt + D[i]);
    for (let i = X.length - 1; i >= 0; i--) ctx.lineTo(cx - w / 2 - X[i], yt + D[i]);
    ctx.closePath();
  };
  const g = ctx.createLinearGradient(0, yt, 0, y);
  g.addColorStop(0, rgba(K1.NUOC, 0.55)); g.addColorStop(1, rgba(K1.NUOC, 0.84));
  // phản chiếu mờ trên mặt bàn bóng + vệt sáng hội tụ dưới nước
  ctx.save(); ctx.translate(0, 2 * y); ctx.scale(1, -1); ctx.globalAlpha *= 0.06; duong(); ctx.fillStyle = K1.NUOC; ctx.fill(); ctx.restore();
  const cg = ctx.createRadialGradient(cx, y + 4, 0, cx, y + 4, w * 0.45);
  cg.addColorStop(0, rgba(K1.NEN_TREN, 0.35)); cg.addColorStop(1, rgba(K1.NEN_TREN, 0));
  ctx.fillStyle = cg; ctx.beginPath(); ctx.ellipse(cx, y + 6, w * 0.45, Math.max(8, h * 0.12), 0, 0, Math.PI * 2); ctx.fill();
  duong(); ctx.fillStyle = g; ctx.fill();
  ctx.save(); duong(); ctx.clip();
  // khúc xạ: mép bàn nhìn qua nước bị dời lên
  ctx.strokeStyle = rgba(K1.MUC, 0.22); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx - w, y - h * 0.18); ctx.lineTo(cx + w, y - h * 0.18); ctx.stroke();
  // phản xạ phông sáng trên mặt phẳng đỉnh
  const hl = ctx.createLinearGradient(0, yt, 0, yt + Math.min(26, h * 0.3));
  hl.addColorStop(0, rgba(K1.NEN_TREN, 0.8)); hl.addColorStop(1, rgba(K1.NEN_TREN, 0));
  ctx.fillStyle = hl; ctx.fillRect(cx - w, yt - 6, w * 2, Math.min(26, h * 0.3) + 6);
  // vệt sáng trên chỗ mép cong (φ ≈ 40–80°)
  const i0 = Math.round(X.length * 0.18); const i1 = Math.round(X.length * 0.42);
  ctx.strokeStyle = rgba(K1.NEN_TREN, 0.55); ctx.lineWidth = Math.max(2, h * 0.04); ctx.lineCap = "round";
  for (const s of [1, -1]) {
    ctx.beginPath();
    for (let i = i0; i <= i1; i++) ctx.lineTo(cx + s * (w / 2 + X[i] - h * 0.07), yt + D[i] + h * 0.03);
    ctx.stroke();
  }
  ctx.restore();
  duong(); ctx.strokeStyle = rgba(K1.MUC, 0.55); ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
}

// Tiêu đề ngắn (< 6 từ) ở toạ độ màn hình: từng ký tự vào lệch nhau 35 ms bằng back.out(1.4), ra bằng power2.in
export function veTieuDe(rc, text, x, y, { size = 48, t0, t1, weight = 700, nhay = 0.035, mau = K1.MUC, phong: ph }) {
  const { ctx, t } = rc;
  if (t < t0 || t > t1) return;
  const raU = 1 - layEase("power2.in")(kep((t - (t1 - 0.35)) / 0.35));
  ctx.save();
  ctx.font = ph(size, weight);
  ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
  const kt = [...text];
  const rong = ctx.measureText(text).width;
  let xx = x - rong / 2;
  const nay = layEase("back.out(1.4)");
  kt.forEach((c, i) => {
    const cw = ctx.measureText(c).width;
    const u = kep((t - t0 - i * nhay) / 0.35);
    if (u > 0) {
      ctx.save();
      ctx.globalAlpha *= layEase("power2.out")(u) * raU;
      ctx.translate(xx + cw / 2, y - size * 0.3);
      const s = 0.6 + 0.4 * nay(u);
      ctx.scale(s, s);
      ctx.fillStyle = mau; ctx.fillText(c, -cw / 2, size * 0.3);
      ctx.restore();
    }
    xx += cw;
  });
  if (t > t0 + 0.2) ghiHop(rc, x - rong / 2, y - size * 0.72, x + rong / 2, y + size * 0.22, text);
  ctx.restore();
}

// Tờ giấy trích bài báo nằm trên bàn (vật trong cảnh, không phải chip giao diện): nền sáng, bóng đổ, các dòng chữ
export function veToGiay(rc, { x, y, w, h, dong, size, u = 1 }) {
  const { ctx } = rc;
  if (u <= 0) return;
  ctx.save();
  ctx.fillStyle = rgba(K1.MUC, 0.18); ctx.fillRect(x + 10, y + 12, w, h);
  ctx.fillStyle = K1.NEN_TREN; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = rgba(K1.MUC, 0.6); ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
  let yy = y + size * 1.5;
  dong.forEach(([s, dam], i) => {
    veChu(rc, s, x + size * 0.8, yy, { size: dam ? size * 1.05 : size, weight: dam ? 700 : 400, color: K1.MUC });
    yy += size * (i === 0 ? 1.7 : 1.35);
  });
  ctx.restore();
}

// Thước kẹp đo chiều cao: thân dọc, hàm dưới ở mặt bàn, hàm trên trượt xuống mặt nước
export function veThuocKep(rc, { x, y, h, cao = 260, u = 1, doc = "", size = 34, phai = true }) {
  const { ctx } = rc;
  if (u <= 0) return;
  ctx.save();
  ctx.globalAlpha *= kep(u * 1.5);
  const m = K1.MUC;
  ctx.strokeStyle = m; ctx.fillStyle = m; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x, y + 14); ctx.lineTo(x, y - cao); ctx.stroke();
  for (let i = 0; i <= 20; i++) {
    const yy = y - (cao * i) / 20; const dl = i % 5 === 0 ? 14 : 7;
    ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + (phai ? dl : -dl), yy); ctx.stroke();
  }
  const ham = (yy, len) => { ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x - (phai ? len : -len), yy); ctx.stroke(); };
  ham(y, 46);
  const yt = y - h;
  ham(yt, 46);
  ctx.fillStyle = rgba(m, 0.12); ctx.fillRect(phai ? x - 4 : x - 22, yt - 9, 26, 18);
  if (doc) veChu(rc, doc, x + (phai ? 26 : -26), yt + size * 0.35, { size, weight: 600, color: m, align: phai ? "left" : "right" });
  ctx.restore();
}

// Nhãn: đường dẫn mảnh vẽ dần, rồi chữ hiện (không khung). u: 0..1 tiến trình vào; ra: 0..1 còn lại
export function veNhan(rc, { x0, y0, x1, y1, text, u = 1, size = 32, align = "left", weight = 400, mau = K1.MUC }) {
  const { ctx } = rc;
  if (u <= 0) return null;
  const ul = kep(u / 0.55); const ut = kep((u - 0.35) / 0.65);
  ctx.save();
  ctx.strokeStyle = rgba(mau, 0.85); ctx.lineWidth = 2;
  // nhãn căn giữa: đường dẫn dừng ở mép chữ, không đâm xuyên chữ
  const yd = align === "center" ? y1 + Math.sign(y0 - y1) * size * 0.75 : y1;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + (x1 - x0) * layEase("power2.out")(ul), y0 + (yd - y0) * layEase("power2.out")(ul)); ctx.stroke();
  ctx.fillStyle = mau; ctx.beginPath(); ctx.arc(x0, y0, 4, 0, Math.PI * 2); ctx.fill();
  let hop = null;
  if (ut > 0) {
    ctx.globalAlpha *= layEase("power3.out")(ut);
    const dx = align === "left" ? 10 : align === "right" ? -10 : 0;
    hop = veChu(rc, text, x1 + dx + (1 - ut) * (align === "right" ? 14 : -14), y1 + size * 0.32, { size, weight, color: mau, align });
  }
  ctx.restore();
  return hop;
}

// Mũi tên sức căng (cam) dọc mặt nước, kéo vào trong; dai tỉ lệ với γ
export function veMuiTenCang(rc, { xa, xb, y, dai, n = 6, u = 1, k = 1 }) {
  const { ctx } = rc;
  if (u <= 0) return;
  ctx.save();
  ctx.strokeStyle = K1.CANG; ctx.fillStyle = K1.CANG; ctx.lineWidth = 5 * k; ctx.lineCap = "round";
  ctx.globalAlpha *= kep(u * 2);
  const mid = (xa + xb) / 2;
  for (let i = 0; i < n; i++) {
    const trai = i < n / 2;
    const k = trai ? i : n - 1 - i;
    const x = trai ? xa + 30 + k * ((mid - xa - 60) / (n / 2)) : xb - 30 - k * ((xb - mid - 60) / (n / 2));
    const d = dai * layEase("power3.out")(kep(u * 1.2 - k * 0.08)) * (trai ? 1 : -1);
    if (Math.abs(d) < 2) continue;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + d, y); ctx.stroke();
    const s = Math.sign(d);
    ctx.beginPath(); ctx.moveTo(x + d + s * 12 * k, y); ctx.lineTo(x + d - s * 6 * k, y - 10 * k); ctx.lineTo(x + d - s * 6 * k, y + 10 * k); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

// Giọt (xà phòng) — trong suốt, viền mực mảnh; keo = độ dãn khi rơi
export function veGiot(rc, { x, y, r, keo = 0 }) {
  const { ctx } = rc;
  ctx.save();
  ctx.translate(x, y); ctx.scale(1 - keo * 0.15, 1 + keo * 0.35);
  ctx.beginPath();
  ctx.moveTo(0, -r * 1.5);
  ctx.bezierCurveTo(r * 0.9, -r * 0.4, r, r * 0.2, r, r * 0.35);
  ctx.arc(0, r * 0.35, r, 0, Math.PI, false);
  ctx.bezierCurveTo(-r, r * 0.2, -r * 0.9, -r * 0.4, 0, -r * 1.5);
  const g = ctx.createLinearGradient(-r, -r, r, r);
  g.addColorStop(0, rgba(K1.NEN_TREN, 0.85)); g.addColorStop(1, rgba(K1.MUC, 0.28));
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = rgba(K1.MUC, 0.6); ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = rgba(K1.NEN_TREN, 0.9); ctx.beginPath(); ctx.ellipse(-r * 0.35, -r * 0.1, r * 0.18, r * 0.32, -0.4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// Dòng rót nước từ trên xuống, mép gợn
export function veDongRot(rc, { x, yTop, yBot, w, u = 1, duoi = 0 }) {
  const { ctx, t } = rc;
  if (u <= 0 || yBot - yTop < 2) return;
  ctx.save();
  ctx.globalAlpha *= kep(u * 3);
  const y0 = yTop + duoi; // đuôi dòng rơi khỏi khung khi ngừng rót
  ctx.beginPath();
  for (let y = y0; y <= yBot; y += 10) ctx.lineTo(x - w / 2 + Math.sin(y * 0.05 + t * 9) * 3, y);
  for (let y = yBot; y >= y0; y -= 10) ctx.lineTo(x + w / 2 + Math.sin(y * 0.045 - t * 8) * 3, y);
  ctx.closePath();
  ctx.fillStyle = rgba(K1.NUOC, 0.55); ctx.fill();
  ctx.strokeStyle = rgba(K1.NEN_TREN, 0.7); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x - w * 0.15, y0); ctx.lineTo(x - w * 0.15, yBot); ctx.stroke();
  ctx.restore();
}

// Bong bóng xà phòng: viền màng mảnh, dải giao thoa cam/xanh quay chậm (chỉ dùng màu kênh + độ mờ)
export function veBong(rc, { x, y, r, u = 1 }) {
  const { ctx, t } = rc;
  if (u <= 0 || r < 1) return;
  ctx.save();
  ctx.globalAlpha *= kep(u * 2);
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
  g.addColorStop(0, rgba(K1.NEN_TREN, 0.08)); g.addColorStop(0.85, rgba(K1.NUOC, 0.10)); g.addColorStop(1, rgba(K1.NUOC, 0.35));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < 3; i++) {
    const a0 = t * (0.5 + i * 0.17) + i * 2.1;
    ctx.strokeStyle = rgba(i === 1 ? K1.CANG : K1.NUOC, 0.35);
    ctx.lineWidth = Math.max(2, r * 0.035);
    ctx.beginPath(); ctx.arc(x, y, r * (0.93 - i * 0.025), a0, a0 + 1.4 + i * 0.3); ctx.stroke();
  }
  ctx.strokeStyle = rgba(K1.MUC, 0.45); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = rgba(K1.NEN_TREN, 0.85); ctx.beginPath(); ctx.ellipse(x - r * 0.42, y - r * 0.45, r * 0.16, r * 0.08, -0.7, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// Nhiệt kế: ống thuỷ tinh, cột chất lỏng (mực đậm), vạch chia 0–40 °C
export function veNhietKe(rc, { x, y, h = 360, gia = 20, min = 0, max = 40, size = 26 }) {
  const { ctx } = rc;
  const w = 26;
  ctx.save();
  ctx.fillStyle = rgba(K1.NEN_TREN, 0.6); ctx.strokeStyle = rgba(K1.MUC, 0.7); ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - w / 2, y - h, w, h, w / 2) : ctx.rect(x - w / 2, y - h, w, h); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y + 14, 26, 0, Math.PI * 2); ctx.fillStyle = K1.MUC; ctx.fill();
  const yy = y - ((gia - min) / (max - min)) * (h - 30);
  ctx.fillStyle = K1.MUC; ctx.fillRect(x - 6, yy, 12, y - yy + 6);
  for (let v = min; v <= max; v += 5) {
    const ty = y - ((v - min) / (max - min)) * (h - 30);
    ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + w / 2, ty); ctx.lineTo(x + w / 2 + (v % 10 === 0 ? 16 : 9), ty); ctx.stroke();
    if (v % 10 === 0) veChu(rc, String(v), x + w / 2 + 22, ty + size * 0.33, { size: size * 0.8, color: rgba(K1.MUC, 0.85) });
  }
  ctx.restore();
  return yy;
}

// Cân điện tử + đĩa; doc = chuỗi số hiển thị
export function veCan(rc, { x, y, doc = "0.00 g", size = 30 }) {
  const { ctx } = rc;
  ctx.save();
  ctx.fillStyle = rgba(K1.MUC, 0.85); ctx.fillRect(x - 130, y - 56, 260, 56);
  ctx.fillStyle = rgba(K1.MUC, 0.55); ctx.fillRect(x - 110, y - 72, 220, 12);
  ctx.fillStyle = K1.NEN_TREN; ctx.fillRect(x - 70, y - 46, 140, 36);
  veChu(rc, doc, x + 60, y - 18, { size, weight: 600, color: K1.MUC, align: "right" });
  ctx.restore();
}

// Bình 1 L (hình côn) có vạch mức, chứa nước
export function veBinh(rc, { x, y, h = 300, muc = 0.8 }) {
  const { ctx } = rc;
  const top = y - h; const nk = 40; const day = 150;
  ctx.save();
  const duong = () => { ctx.beginPath(); ctx.moveTo(x - nk / 2, top); ctx.lineTo(x - nk / 2, top + h * 0.3); ctx.lineTo(x - day, y); ctx.lineTo(x + day, y); ctx.lineTo(x + nk / 2, top + h * 0.3); ctx.lineTo(x + nk / 2, top); };
  ctx.save(); duong(); ctx.clip();
  const ym = y - h * 0.7 * muc;
  const g = ctx.createLinearGradient(0, ym, 0, y); g.addColorStop(0, rgba(K1.NUOC, 0.45)); g.addColorStop(1, rgba(K1.NUOC, 0.75));
  ctx.fillStyle = g; ctx.fillRect(x - day, ym, day * 2, y - ym);
  ctx.restore();
  duong(); ctx.strokeStyle = rgba(K1.MUC, 0.7); ctx.lineWidth = 3; ctx.stroke();
  ctx.restore();
}

// Dấu chỉ cam (≤ 1 mỗi cảnh): vòng mở + đuôi chỉ
export function veDauChi(rc, { x, y, u = 1, r = 16 }) {
  const { ctx } = rc;
  if (u <= 0) return;
  ctx.save();
  ctx.strokeStyle = K1.CANG; ctx.lineWidth = 4; ctx.lineCap = "round";
  const e = layEase("back.out(1.6)")(kep(u));
  ctx.beginPath(); ctx.arc(x, y, r * e, -Math.PI * 0.85, Math.PI * 0.85); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - r * 1.9 * e, y); ctx.lineTo(x - r * 3.2 * e, y); ctx.stroke();
  ctx.restore();
}

// Dải viền xanh nước 28 px ở mép khung = màu nhận diện K1 khi có ô PiP
export function veVien(rc, day = 28) {
  const { ctx, W, H } = rc;
  ctx.save(); ctx.fillStyle = K1.NUOC;
  ctx.fillRect(0, 0, W, day); ctx.fillRect(0, H - day, W, day); ctx.fillRect(0, 0, day, H); ctx.fillRect(W - day, 0, day, H);
  ctx.restore();
}

// Vùng cấm PiP: chỉ được nền trơn màu nền kênh (luật L1/L2 của Studio) — vẽ lại đúng phông nền trong vùng này
export function veVungPip(rc, [x0, y0, x1, y1]) {
  const { ctx } = rc;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip();
  veNen(rc);
  ctx.restore();
}

// Dòng nguồn nhỏ ở góc trên phải (trục 8 của K1); tự xuống dòng trong maxW; nhan = chỉ số dòng được làm sáng
function catDong(rc, s, size, maxW) {
  const tu = s.split(" "); const out = []; let dong = "";
  for (const w of tu) {
    const thu = dong ? dong + " " + w : w;
    if (doChu(rc, thu, size) > maxW && dong) { out.push(dong); dong = w; } else dong = thu;
  }
  if (dong) out.push(dong);
  return out;
}
export function veNguon(rc, dong, { x, y, size = 20, u = 1, nhan = -1, maxW = 9999 } = {}) {
  const { ctx } = rc;
  if (u <= 0) return;
  ctx.save();
  ctx.globalAlpha *= layEase("power2.out")(kep(u));
  // nền mờ mềm sau dòng nguồn (không viền, không góc): đọc được trên điện thoại kể cả khi vật thể đi qua phía sau
  let soDong = 0; let rongMax = 0;
  dong.forEach((s) => catDong(rc, s, size, maxW).forEach((d) => { soDong++; rongMax = Math.max(rongMax, doChu(rc, d, size)); }));
  const cao = soDong * size * 1.28 + dong.length * size * 0.25;
  const g = ctx.createLinearGradient(x - rongMax - 40, 0, x + 24, 0);
  g.addColorStop(0, rgba(K1.NEN_TREN, 0)); g.addColorStop(0.18, rgba(K1.NEN_TREN, 0.78)); g.addColorStop(1, rgba(K1.NEN_TREN, 0.78));
  ctx.fillStyle = g; ctx.fillRect(x - rongMax - 40, y - size * 1.1, rongMax + 64, cao + size * 0.6);
  let yy = y;
  dong.forEach((s, i) => {
    const sang = i === nhan;
    for (const d of catDong(rc, s, size, maxW)) {
      if (sang) {
        const w = doChu(rc, d, size, 600);
        ctx.fillStyle = rgba(K1.MUC, 0.85); ctx.fillRect(x - w, yy + size * 0.28, w, 3);
      }
      veChu(rc, d, x, yy, { size, weight: sang ? 600 : 400, color: K1.MUC, align: "right" });
      yy += size * 1.28;
    }
    yy += size * 0.25;
  });
  ctx.restore();
}
