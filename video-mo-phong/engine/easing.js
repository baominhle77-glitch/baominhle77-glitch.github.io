// Hàm easing theo công thức Penner, đặt tên kiểu GSAP để khớp skill video-chat-luong-cao (mục 3).
// powerN tương ứng: power1 = bậc 2, power2 = bậc 3, power3 = bậc 4, power4 = bậc 5.

const powIn = (n) => (t) => Math.pow(t, n);
const powOut = (n) => (t) => 1 - Math.pow(1 - t, n);
const powInOut = (n) => (t) => (t < 0.5 ? Math.pow(2 * t, n) / 2 : 1 - Math.pow(2 * (1 - t), n) / 2);

const BANG = {
  linear: (t) => t,
  "sine.in": (t) => 1 - Math.cos((t * Math.PI) / 2),
  "sine.out": (t) => Math.sin((t * Math.PI) / 2),
  "sine.inOut": (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  "expo.in": (t) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
  "expo.out": (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  "expo.inOut": (t) => (t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2)
};
for (let n = 1; n <= 4; n++) {
  BANG[`power${n}.in`] = powIn(n + 1);
  BANG[`power${n}.out`] = powOut(n + 1);
  BANG[`power${n}.inOut`] = powInOut(n + 1);
}

function backOut(s) {
  const c3 = s + 1;
  return (t) => 1 + c3 * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
}
function backIn(s) {
  return (t) => (s + 1) * t * t * t - s * t * t;
}

const cache = new Map();

// Nhận tên ("power3.out", "back.out(1.4)") hoặc hàm; mặc định power2.inOut
export function layEase(ten) {
  if (typeof ten === "function") return ten;
  const key = ten || "power2.inOut";
  if (cache.has(key)) return cache.get(key);
  let f = BANG[key];
  const m = /^back\.(in|out)(?:\(([\d.]+)\))?$/.exec(key);
  if (!f && m) f = m[1] === "out" ? backOut(Number(m[2] || 1.70158)) : backIn(Number(m[2] || 1.70158));
  if (!f) throw new Error(`Không có easing "${key}"`);
  cache.set(key, f);
  return f;
}

// Lò xo tắt dần dạng nghiệm đóng (bước từ 0 lên 1), tính được ở bất kỳ t nào mà không cần trạng thái.
// zeta: hệ số tắt (1 = không nảy, 0,7–0,85 nảy nhẹ); f: tần số riêng (Hz).
export function loXo(t, { zeta = 0.78, f = 1.6 } = {}) {
  if (t <= 0) return 0;
  const w0 = 2 * Math.PI * f;
  if (zeta >= 1) return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  const wd = w0 * Math.sqrt(1 - zeta * zeta);
  return 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + (zeta / Math.sqrt(1 - zeta * zeta)) * Math.sin(wd * t));
}

export const kep = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, u) => a + (b - a) * u;

// Ánh xạ t trong [t0, t1] sang [a, b], có kẹp và easing (giống interpolate của các thư viện video)
export function khoang(t, t0, t1, a, b, ease = "linear") {
  const u = kep((t - t0) / (t1 - t0 || 1e-9));
  return lerp(a, b, layEase(ease)(u));
}
