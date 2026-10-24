// Dòng thời gian tua được: mọi tween khai báo trước với thời điểm tuyệt đối,
// giá trị tại t tính trực tiếp nên render(t) gọi ở bất kỳ t nào, theo bất kỳ thứ tự nào cũng ra cùng một hình.
import { layEase } from "./easing.js";

function hexToRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
}

function noiSuy(a, b, u) {
  if (typeof a === "number") return a + (b - a) * u;
  if (typeof a === "string" && a[0] === "#") {
    const x = hexToRgb(a); const y = hexToRgb(b);
    return rgbToHex(x[0] + (y[0] - x[0]) * u, x[1] + (y[1] - x[1]) * u, x[2] + (y[2] - x[2]) * u);
  }
  if (Array.isArray(a)) return a.map((v, i) => noiSuy(v, b[i], u));
  return u < 1 ? a : b;
}

export class DongThoiGian {
  constructor() {
    this.ray = new Map(); // khóa node+thuộc tính → các đoạn {bd, kt, tu, den, ease}
    this.dai = 0;
  }

  // Tween thuộc tính `prop` của `node` tới `den` trong [bd, bd+dur]. `tu` bỏ trống = nối tiếp giá trị trước đó.
  to(node, prop, den, bd, dur = 0.5, ease = "power2.inOut", tu) {
    const k = node;
    if (!this.ray.has(k)) this.ray.set(k, new Map());
    const m = this.ray.get(k);
    if (!m.has(prop)) m.set(prop, []);
    const ds = m.get(prop);
    ds.push({ bd, kt: bd + Math.max(0, dur), tu, den, ease: layEase(ease) });
    ds.sort((a, b) => a.bd - b.bd);
    this.dai = Math.max(this.dai, bd + dur);
    return this;
  }

  set(node, prop, den, luc) { return this.to(node, prop, den, luc, 0, "linear"); }

  // Giá trị tại t; trước đoạn đầu tiên là giá trị gốc của node
  lay(node, prop, t, goc) {
    const m = this.ray.get(node);
    const ds = m && m.get(prop);
    if (!ds) return goc;
    let truoc = goc;
    for (let i = 0; i < ds.length; i++) {
      const d = ds[i];
      if (t < d.bd) return truoc;
      const tu = d.tu === undefined ? truoc : d.tu;
      if (t < d.kt) return noiSuy(tu, d.den, d.ease((t - d.bd) / (d.kt - d.bd)));
      truoc = d.den;
    }
    return truoc;
  }
}
