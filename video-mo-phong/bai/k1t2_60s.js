// Bài thi đầu (lệnh GĐ Studio gd-20261024-1220, sửa theo thư gd-20261024-1650/1652/1705): dựng lại phần mở
// "What Soap Does to Water's Skin" — Meniscus Lab tập 2 (storyboard sha8 dfe35144), beat h1 → c1, khuôn K1.
// Thời gian lấy từ giọng thật của Studio (edge-tts, bai/k1t2_moc.js): beats là nguồn thời gian duy nhất, ~71,6 s.
// Mỗi chuyển động camera neo vào mốc của từ khoá đang được nói; không rung giả.
import { Nut, veChu, phong } from "../engine/canh.js";
import { DongThoiGian } from "../engine/thoigian.js";
import { kep, khoang, layEase, loXo, lerp } from "../engine/easing.js";
import { chiaCum, uocLuongMoc } from "../engine/phude.js";
import {
  K1, rgba, so, veNen, taoBui, veBui, veBan, veVung, veThuocKep, veNhan, veMuiTenCang, veGiot,
  veDongRot, veBong, veNhietKe, veCan, veBinh, veDauChi, veVien, veVungPip, veNguon, veTieuDe, veToGiay
} from "../kenh/k1.js";
import { MOC_GIONG, BEATS } from "./k1t2_moc.js";

export const KHO = {
  "16x9": {
    ten: "16x9", W: 1920, H: 1080, pip: [1552, 36, 1884, 246], an: [40, 40, 1880, 1040],
    phuDe: { cx: 960, cy: 990, maxW: 1240, size: 46 }, daiPhuDe: [320, 950, 1600, 1062], nguon: { x: 1530, y: 72, size: 24, maxW: 860 }, tieuDe: { x: 960, y: 290, size: 56 }
  },
  "9x16": {
    ten: "9x16", W: 1080, H: 1920, pip: [62, 266, 438, 508], an: [65, 270, 1015, 1536],
    phuDe: { cx: 540, cy: 1382, maxW: 860, size: 50 }, daiPhuDe: [90, 1338, 990, 1426], nguon: { x: 1005, y: 302, size: 24, maxW: 540 }, tieuDe: { x: 540, y: 640, size: 58 }
  }
};

const LOI_GOC = {
  h1: "In episode one, this puddle stopped at five point four five, in millimetres, however much water we poured. Now add soap. Deeper, or shallower?",
  h2: "Shallower. Our soap, SDS, cuts the skin's pull from seventy one point nine seven to thirty six point four three millinewtons per metre, about half. Puddle: three point eight six millimetres, calculated.",
  h3: "Yet this weaker skin holds a bubble together. How can less pull hold more?",
  h4: "A fair test needs one temperature. Our soap is SDS, a lab surfactant, in water at twenty five millimolar, a concentration inferred from one paper's text. That is seven point two one grams per litre, calculated, all at twenty five degrees Celsius. Warming plain water from twenty to twenty five barely changes the puddle: five point four five becomes five point four three.",
  c1: "Here are both puddles on one bench, at twenty five degrees. Plain water stands at five point four three millimetres. The SDS one stands at three point eight six, lower by one point five seven millimetres, calculated. In this model, only the skin changes."
};
const LOI = BEATS.map((b) => ({ ...b, n: LOI_GOC[b.id] }));

const NGUON = {
  h1: ["episode 1: NIST SRD 69 row 34 (293.10 K)"],
  h2: ["NIST SRD 69, saturation table, 298.15 K", "Liu et al. 2026, Fig. 5a: SDS alone in water (§4.3), 25 °C, 25.0 mM (inferred)", "calculated: puddle depth from these values"],
  h3: ["Bhamla et al., PLoS One 2017, Conclusion"],
  h4: ["Liu et al. 2026: SDS in water (§4.3), 25.0 mM inferred from text (Fig. 4a)", "PubChem CID 3423265: 288.38 g/mol", "episode 1: NIST SRD 69 row 34 (293.10 K)", "calculated: ρ, γ water NIST SRD 69, 298.15 K"],
  c1: ["calculated: ρ, γ water NIST SRD 69, 298.15 K", "γ SDS: Liu et al. 2026, Fig. 5a, in water (§4.3), 25 °C, 25.0 mM (inferred)"]
};

// Từ khoá có gạch chân màu đại lượng: cam = sức căng mặt, xanh = trọng lực/khối lượng (chiều sâu vũng)
const CANG = /^(soap|sds|skin|skin's|pull|weaker|bubble|surfactant|half)/i;
const NUOC = /^(puddle|deeper|shallower|millimetres|grams|lower)/i;

// Mô hình vũng của tập 1 (θ 180°): chiều sâu = 2ℓc·sin(θ/2), ℓc = √(γ / ((ρl − ρv) g)); g = 9.80665 m/s².
// Số liệu: NIST SRD 69 (nước, 293.10 K và 298.15 K), Liu et al. 2026 Fig. 5a (SDS 36.43 mN/m, 25 °C).
const G = 9.80665;
export function sauVungMm(gamma, rhoL, rhoV = 0, theta = Math.PI) { return 2 * Math.sqrt(gamma / ((rhoL - rhoV) * G)) * Math.sin(theta / 2) * 1000; }
export const VUNG = {
  nuoc20: 5.4521, // tập 1: 2ℓc = 5.4521 mm (so_lieu.json, NIST hàng 34, 293.10 K)
  nuoc25: sauVungMm(0.071972, 997.0, 0.023075), // ≈ 5.43 mm
  sds25: sauVungMm(0.03643, 997.0, 0.023075) // ≈ 3.86 mm
};

export const THOI_LUONG = 72;
export const FPS = 30;

export function taoBai(tenKho = "16x9", mocTu = null) {
  const F = KHO[tenKho];
  const doc = F.ten === "9x16";

  // --- Mốc từ: giọng thật (mặc định) hoặc tệp nạp vào; không có thì ước lượng trong từng beat ---
  let tu = mocTu && mocTu.length ? mocTu.map((w) => ({ ...w })) : MOC_GIONG.map((w) => ({ ...w }));
  if (!tu.length) tu = LOI.flatMap((b) => uocLuongMoc(b.n, b.bd, b.dai).map((w) => ({ ...w, beat: b.id })));
  tu.forEach((w) => { if (!w.beat) w.beat = ([...LOI].reverse().find((b) => w.start >= b.bd - 0.05) || LOI[0]).id; });
  const tuTrongBai = tu.filter((w) => w.start < THOI_LUONG - 0.3);
  const chuan = (s) => s.toLowerCase().replace(/[^a-z0-9']/g, "");
  const moc = (beat, w, lan = 1) => {
    let dem = 0;
    for (const x of tu) if (x.beat === beat && chuan(x.text).startsWith(w) && ++dem === lan) return x.start;
    return LOI.find((b) => b.id === beat).bd;
  };
  const B = Object.fromEntries(LOI.map((b) => [b.id, b]));
  const M = {
    episode: moc("h1", "episode"), five: moc("h1", "five"), however: moc("h1", "however"), poured: moc("h1", "poured"),
    now: moc("h1", "now"), soap: moc("h1", "soap"), deeper: moc("h1", "deeper"),
    shallower: moc("h2", "shallower"), cuts: moc("h2", "cuts"), seventy: moc("h2", "seventy"), thirty: moc("h2", "thirty"),
    about: moc("h2", "about"), half: moc("h2", "half"), puddle: moc("h2", "puddle"), three: moc("h2", "three", 2), calculated: moc("h2", "calculated"),
    weaker: moc("h3", "weaker"), bubble: moc("h3", "bubble"), how: moc("h3", "how"), more: moc("h3", "more"),
    temperature: moc("h4", "temperature"), soap4: moc("h4", "soap"), surfactant: moc("h4", "surfactant"), millimolar: moc("h4", "millimolar"),
    inferred: moc("h4", "inferred"), that: moc("h4", "that"), seven: moc("h4", "seven"), grams: moc("h4", "grams"), litre: moc("h4", "litre"),
    all: moc("h4", "all"), degrees: moc("h4", "degrees"), warming: moc("h4", "warming"), barely: moc("h4", "barely"), becomes: moc("h4", "becomes"),
    five545: moc("h4", "five", 4),
    both: moc("c1", "both"), bench: moc("c1", "bench"), twentyC: moc("c1", "twenty"), plain: moc("c1", "plain"), sdsC: moc("c1", "sds"),
    lower: moc("c1", "lower"), inC: moc("c1", "in"), only: moc("c1", "only")
  };
  const ti = M.shallower - 0.15; // giọt xà phòng chạm mặt nước ngay trước chữ "Shallower"
  const T3 = Math.max(M.three, M.puddle + 0.8); // đọc số 3.86 khi camera đã tới thước kẹp
  const tX = B.h4.bd - 0.1; // giữa cú zoom xuyên màng bóng (chuyển h3 → h4)
  const tC = B.c1.bd; // biến hình vũng nước 25 °C → vũng SDS (chuyển h4 → c1)

  // --- Bố cục theo khổ (9:16 bố cục lại thật: vật cao hơn, dải 40–60 % chiều cao, phụ đề ~68 %) ---
  const L = doc
    ? { ban: 1120, pxmm: 34, ax: 540, w0: 460, w1: 540, w1b: 600, camY: 930, nhan: 38, so: 44, hook: 84, zDay: 1.9, pxmC: 30, wc: 560 }
    : { ban: 800, pxmm: 32, ax: 960, w0: 640, w1: 800, w1b: 900, camY: 580, nhan: 34, so: 40, hook: 96, zDay: 1.9, pxmC: 32, wc: 560 };
  const hmm = (mm) => mm * L.pxmm;
  const H545 = hmm(VUNG.nuoc20); const H386 = hmm(VUNG.sds25); const H543 = hmm(VUNG.nuoc25);
  const THE_TICH = L.w1b * H545; // diện tích mặt cắt (thể tích trên mỗi đơn vị sâu) sau lần rót thứ hai
  const W2 = THE_TICH / H386; // cùng thể tích, mỏng hơn → loang rộng hơn
  const xKA = L.ax - W2 / 2 - (doc ? 30 : 70); // thước kẹp đứng yên bên trái vùng loang tối đa
  const caoK = hmm(8.6);
  const xRot = L.ax + (doc ? 120 : -200); // dòng rót, tránh số đo và nhãn

  // Lần rót 1: 0 → 4,0 s loang w0 → w1; lần rót 2 ("however much water we poured"): rộng thêm, chiều cao giữ 5.45 mm
  const r2a = M.however - 0.2; const r2b = M.poured + 0.5;
  const hA = (t) => (t < ti + 0.1 ? H545 : lerp(H545, H386, loXo(t - ti - 0.1, { zeta: 0.82, f: 0.9 })));
  const wA = (t) => {
    if (t < r2a) return khoang(t, 0, 4.0, L.w0, L.w1, "power1.out");
    if (t < ti) return khoang(t, r2a, r2b, L.w1, L.w1b, "power1.out");
    return THE_TICH / hA(t);
  };
  const songA = (t) => (x) => {
    const dt = t - ti;
    if (dt < 0) return 0;
    const d = Math.abs(x - L.ax);
    return 9 * Math.exp(-dt * 1.3) * Math.exp(-d / 260) * Math.sin(d * 0.055 - dt * 11);
  };

  const tl = new DongThoiGian();
  const sz = (rc, s) => s / rc.zoom; // cỡ chữ màn hình cố định dù camera zoom
  // hiện: power2.out; ẩn: power2.in (không có mờ dần tuyến tính ở chữ/UI)
  const vaoE = layEase("power2.out"); const raE = layEase("power2.in");
  const u = (t, t0, d = 0.6) => vaoE(kep((t - t0) / d));
  const ra = (t, t1, d = 0.3) => 1 - raE(1 - kep((t1 - t) / d));

  // ===== Camera: lịch cú máy neo vào từ khoá + trôi chậm (sine) để khung không bao giờ đứng yên =====
  const OX = 4200;
  const xNk = OX; const xCoc = OX + (doc ? 330 : 520); const xCan = OX + (doc ? 1000 : 1350); const xC = OX + (doc ? 2400 : 3200);
  // Bộ C (h4 cuối) và c1. 16:9: hai vũng cạnh nhau, thước kẹp ở hai phía ngoài, nhiệt kế ở khe giữa.
  // 9:16: hai kệ xếp chồng (20 °C trên, 25 °C/SDS dưới) — dùng chiều dọc, vũng rộng; thước kẹp bên trái mỗi vũng
  const hmC = (mm) => mm * L.pxmC; const wc = L.wc;
  const xL = doc ? xC : xC - 430; const xR = doc ? xC : xC + 400;
  const yL = doc ? L.ban - 400 : L.ban; const yR = L.ban;
  const wSDS = (wc * hmC(VUNG.nuoc25)) / hmC(VUNG.sds25);
  const xkL = xL - wc / 2 - 36; const xkR0 = doc ? xR - wc / 2 - 36 : xR + wc / 2 + 36; const xkR1 = doc ? xR - wSDS / 2 - 36 : xR + wSDS / 2 + 36;
  const xTh = doc ? xC + wc / 2 + 70 : (xL + wc / 2 + xR - wSDS / 2) / 2;
  const camGoc = new Nut({ x: L.ax, y: L.camY, zoom: 1 });
  const cam = new Nut({
    x: (t) => tl.lay(camGoc, "x", t, camGoc.x) + Math.sin(t * 0.23) * 6,
    y: (t) => tl.lay(camGoc, "y", t, camGoc.y) + Math.sin(t * 0.19 + 1.3) * 4,
    zoom: (t) => tl.lay(camGoc, "zoom", t, camGoc.zoom) * (1 + 0.012 * Math.sin(t * 0.15)),
    rot: 0
  });
  const quay = (t0, dur, dich, e = "power3.inOut") => {
    for (const k of ["x", "y", "zoom"]) if (dich[k] != null) tl.to(camGoc, k, dich[k], t0, dur, e);
  };
  const datCam = (t0, dich) => { for (const k of ["x", "y", "zoom"]) if (dich[k] != null) tl.set(camGoc, k, dich[k], t0); };
  const zP = L.zDay; // zoom đẩy tối đa khi vũng phải nằm gọn trong khung
  const bongY = (t) => L.ban - H386 - khoang(t, M.bubble - 0.2, M.bubble + 2.2, 0, doc ? 380 : 340, "power2.out");
  const bongR = (t) => khoang(t, M.bubble - 0.2, M.bubble + 1.6, 0, doc ? 160 : 140, "back.out(1.3)");
  const mepX = L.ax + W2 / 2 - (doc ? 0 : 170);
  const LICH = doc ? [
    // h1
    [0, 0, { x: L.ax + 20, y: L.ban - 170, zoom: 1.8 }, "set"],
    [M.episode - 0.1, 1.6, { x: L.ax, y: L.camY, zoom: 1.0 }],
    [M.five - 0.25, 0.9, { x: xKA + 230, y: L.ban - 230, zoom: 1.45 }],
    [M.however - 0.2, 1.0, { x: L.ax, y: L.camY, zoom: 0.95 }],
    [M.now - 0.15, 0.8, { x: L.ax - 90, y: L.ban - 260, zoom: 1.3 }],
    [M.deeper - 0.1, 0.8, { x: L.ax, y: L.camY - 20, zoom: 1.0 }],
    [ti, 0.45, { zoom: 1.28, y: L.ban - 60 }, "power3.out"], // giật máy theo cú chạm: hạ xuống sát mặt nước
    [ti + 1.0, 0.8, { zoom: 1.05, y: L.camY - 10 }, "sine.inOut"],
    // h2
    [M.cuts - 0.3, 1.0, { x: L.ax + 300, y: L.ban - 150, zoom: zP }],
    [M.thirty - 0.2, 0.9, { x: L.ax + 120, y: L.ban - 250, zoom: 1.3 }],
    [M.about - 0.1, 0.9, { x: L.ax + 300, y: L.ban - 150, zoom: zP }],
    [M.puddle - 0.15, 0.9, { x: xKA + 220, y: L.ban - 240, zoom: 1.6 }],
    [M.calculated - 0.2, 1.0, { x: L.ax, y: L.camY - 30, zoom: 1.0 }],
    // h3
    [M.bubble - 0.3, 1.2, { x: L.ax, y: L.ban - 380, zoom: 1.1 }],
    [M.how - 0.05, 0.7, { x: L.ax, y: L.ban - H386 - 380, zoom: 1.6 }],
    [M.more + 0.1, tX - M.more - 0.1, { zoom: 9 }, "power3.in"],
    // h4
    [tX, 0, { x: xNk + 170, y: L.ban - 260, zoom: 1.9 }, "set"],
    [tX, 1.2, { zoom: 1.2 }, "expo.out"],
    [M.soap4 - 0.3, 1.0, { x: xCoc, y: L.ban - 220, zoom: 1.6 }],
    [M.surfactant - 0.3, 0.8, { x: xCoc, y: L.ban - 110, zoom: 2.5 }],
    [M.millimolar - 0.1, 0.9, { x: xCoc + 60, y: L.ban - 330, zoom: 1.2 }],
    [M.seven - 0.6, 1.0, { x: xCan, y: L.ban - 260, zoom: 1.2 }],
    [M.grams - 0.25, 0.8, { x: xCan - 150, y: L.ban - 60, zoom: 2.1 }],
    [M.all - 0.2, 0.9, { x: xCan + 60, y: L.ban - 300, zoom: 1.05 }],
    [M.warming - 0.2, 1.2, { x: xC, y: L.ban - 230, zoom: 0.95 }],
    [M.barely - 0.2, 0.8, { x: xkL + 200, y: yL - 40, zoom: 1.45 }],
    [M.becomes - 0.25, 0.9, { x: xkR0 + 200, y: yR - 120, zoom: 1.45 }],
    // c1
    [tC - 0.2, 1.0, { x: xC, y: L.ban - 230, zoom: 0.95 }],
    [M.twentyC - 0.2, 0.8, { x: xC + 200, y: yL - 40, zoom: 1.4 }],
    [M.plain - 0.2, 0.8, { x: xkL + 200, y: yL - 40, zoom: 1.45 }],
    [M.sdsC - 0.25, 0.9, { x: xkR1 + 300, y: yR - 150, zoom: 1.3 }],
    [M.lower - 0.2, 1.0, { x: xC, y: L.ban - 230, zoom: 0.95 }],
    [M.inC - 0.2, 0.6, { x: xR + wSDS / 2 - 100, y: yR - 60, zoom: 2.1 }]
  ] : [
    // h1
    [0, 0, { x: xRot + 60, y: L.ban - 130, zoom: 1.9 }, "set"],
    [M.episode - 0.1, 1.6, { x: L.ax, y: L.camY, zoom: 1.0 }],
    [M.five - 0.25, 0.9, { x: 760, y: 640, zoom: 1.4 }],
    [M.however - 0.2, 1.0, { x: L.ax, y: L.camY, zoom: 0.95 }],
    [M.now - 0.15, 0.8, { x: L.ax - 120, y: L.ban - 380, zoom: 1.3 }],
    [M.deeper - 0.1, 0.8, { x: L.ax, y: L.camY - 20, zoom: 1.0 }],
    [ti, 0.6, { zoom: 1.12 }, "power3.out"],
    // h2
    [M.cuts - 0.3, 1.0, { x: mepX, y: L.ban - H386 - 60, zoom: zP }],
    [M.thirty - 0.2, 0.9, { x: mepX - 150, y: L.ban - H386 - 120, zoom: 1.4 }],
    [M.about - 0.1, 1.1, { x: L.ax, y: L.camY - 20, zoom: 1.0 }],
    [M.puddle - 0.15, 0.9, { x: xKA + 330, y: L.ban - 170, zoom: 1.55 }],
    [M.calculated - 0.2, 1.0, { x: L.ax, y: L.camY - 40, zoom: 1.0 }],
    // h3
    [M.bubble - 0.3, 1.2, { x: L.ax, y: L.ban - 330, zoom: 1.15 }],
    [M.how - 0.05, 0.7, { x: L.ax, y: L.ban - H386 - 340, zoom: 1.7 }],
    [M.more + 0.1, tX - M.more - 0.1, { zoom: 9 }, "power3.in"],
    // h4
    [tX, 0, { x: xNk + 260, y: L.ban - 200, zoom: 1.9 }, "set"],
    [tX, 1.2, { zoom: 1.25 }, "expo.out"],
    [M.soap4 - 0.3, 1.0, { x: xCoc, y: L.ban - 190, zoom: 1.6 }],
    [M.surfactant - 0.3, 0.8, { x: xCoc, y: L.ban - 100, zoom: 2.6 }],
    [M.millimolar - 0.3, 0.9, { x: xCoc + 150, y: L.ban - 230, zoom: 1.25 }],
    [M.seven - 0.5, 1.0, { x: xCan, y: L.ban - 210, zoom: 1.3 }],
    [M.grams - 0.25, 0.8, { x: xCan - 130, y: L.ban - 40, zoom: 2.2 }],
    [M.all - 0.2, 0.9, { x: xCan + 120, y: L.ban - 220, zoom: 1.15 }],
    [M.warming - 0.2, 1.2, { x: xC + 60, y: L.ban - 220, zoom: 0.95 }],
    [M.barely - 0.2, 0.8, { x: xkL + 200, y: L.ban - 150, zoom: 1.6 }],
    [M.becomes - 0.25, 0.9, { x: xkR0 - 200, y: L.ban - 150, zoom: 1.6 }],
    // c1
    [tC - 0.2, 1.0, { x: xC + 60, y: L.ban - 220, zoom: 0.95 }],
    [M.twentyC - 0.2, 0.8, { x: xTh, y: L.ban - 240, zoom: 1.4 }],
    [M.plain - 0.2, 0.8, { x: xkL + 200, y: L.ban - 150, zoom: 1.6 }],
    [M.sdsC - 0.25, 0.9, { x: xkR1 - 200, y: L.ban - 150, zoom: 1.6 }],
    [M.lower - 0.2, 1.0, { x: xC + 60, y: L.ban - 220, zoom: 0.95 }],
    [M.inC - 0.2, 1.0, { x: xR + wSDS / 2 - 140, y: L.ban - 130, zoom: 1.8 }]
  ];
  // khung dọc ít chi tiết theo chiều ngang: cú máy dứt khoát hơn (≥ 0,6 s) để mỗi nhịp đổi hình rõ
  for (const [t0, dur, dich, e] of LICH) {
    if (e === "set") datCam(t0, dich); else quay(t0, doc && dur > 0.6 && e !== "power3.in" ? Math.max(0.6, dur * 0.72) : dur, dich, e);
  }

  // ===== Lớp nền: bụi sáng trôi (parallax thấp) =====
  const bui = taoBui(110, -600, OX + 4000, -400, L.ban + 500, 11);
  const lopNen = new Nut({ ve: (rc) => veBui(rc, bui) });

  // ===== Lớp giữa: bàn quang học và vật thể =====
  const giua = new Nut();
  giua.them(new Nut({ ve: (rc) => veBan(rc, -2000, OX + 5000, L.ban, doc ? 520 : 300) }));

  // --- Bộ A: vũng nước tập 1, rót thêm, giọt xà phòng, sức căng, bong bóng (h1–h3) ---
  giua.them(new Nut({
    opacity: (t) => (t < tX ? 1 : 0),
    ve: (rc) => {
      const { t, ctx } = rc;
      const h = hA(t); const w = wA(t);
      // dự đoán: hai đường viền "sâu hơn?" / "nông hơn?" (vẽ dần), chọn đáp án khi giọt chạm mặt
      const uDd = u(t, M.deeper, 0.5) * ra(t, ti + 1.2, 0.6);
      if (uDd > 0) {
        const h7 = hmm(7.0); const w7 = THE_TICH / h7;
        ctx.save(); ctx.globalAlpha *= uDd; ctx.setLineDash([10, 9]); ctx.strokeStyle = rgba(K1.MUC, 0.6); ctx.lineWidth = 2.5;
        ctx.strokeRect(L.ax - w7 / 2, L.ban - h7, w7, h7);
        ctx.globalAlpha /= uDd; ctx.globalAlpha *= u(t, M.deeper + 0.35, 0.5) * ra(t, ti + 1.2, 0.6);
        ctx.strokeRect(L.ax - W2 / 2, L.ban - H386, W2, H386);
        ctx.restore();
        veChu(rc, "deeper?", L.ax + w7 / 2 + 14, L.ban - h7 + 10, { size: sz(rc, L.nhan * 0.9), color: K1.MUC, align: "left" });
        if (t > M.deeper + 0.35) {
          if (doc) veChu(rc, "shallower?", L.ax + W2 / 2, L.ban + 40, { size: sz(rc, L.nhan * 0.9), color: K1.MUC, align: "right" });
          else veChu(rc, "shallower?", L.ax + W2 / 2 + 14, L.ban - H386 + 34, { size: sz(rc, L.nhan * 0.9), color: K1.MUC, align: "left" });
        }
      }
      // dòng rót: lần 1 dừng ở 4,0 s, lần 2 theo "however much water we poured"; đuôi rơi khỏi khung khi ngừng
      const yTop = L.ban - (doc ? 1400 : 1100);
      const duoi = (tt) => (tt < 0 ? 0 : tt * tt * 2600);
      if (t < 4.6) veDongRot(rc, { x: xRot, yTop, yBot: L.ban - h + 4, w: 22, u: 1, duoi: duoi(t - 4.0) });
      if (t > r2a - 0.3 && t < r2b + 0.8) veDongRot(rc, { x: xRot, yTop: yTop + (1 - u(t, r2a - 0.3, 0.3)) * 900, yBot: L.ban - h + 4, w: 22, u: 1, duoi: duoi(t - r2b) });
      veVung(rc, { cx: L.ax, y: L.ban, w, h, song: songA(t) });
      // mũi tên sức căng (h2): dài theo γ — nước 71.97 → SDS 36.43 mN/m; chỉ vẽ trong phần khung đang thấy
      const uC = u(t, M.cuts, 0.8) * ra(t, M.half + 1.6, 0.5);
      if (uC > 0) {
        const nua = (rc.W / 2 - 80) / rc.zoom;
        const xa = Math.max(L.ax - w / 2, rc.camX - nua); const xb = Math.min(L.ax + w / 2, rc.camX + nua);
        const dai = (doc ? 100 : 120) * (t < M.thirty ? 1 : lerp(1, 36.43 / 71.97, layEase("power2.inOut")(u(t, M.thirty, 1.1))));
        if (xb - xa > 200 / rc.zoom) veMuiTenCang(rc, { xa, xb, y: L.ban - h - 22 / rc.zoom, dai: (dai * 1.2) / rc.zoom, n: 8, u: uC, k: 1 / rc.zoom });
      }
      // giọt xà phòng: ống nhỏ giọt vào, giọt hình thành, rơi, chạm mặt ở ti
      if (t >= M.soap - 0.6 && t < ti + 0.05) {
        const yOng = L.ban - (doc ? 640 : 560) - (1 - layEase("power3.out")(u(t, M.soap - 0.6, 0.6))) * 300;
        ctx.save(); ctx.fillStyle = rgba(K1.MUC, 0.8);
        ctx.fillRect(L.ax - 9, yOng - 600, 18, 600); ctx.beginPath(); ctx.moveTo(L.ax - 9, yOng); ctx.lineTo(L.ax, yOng + 16); ctx.lineTo(L.ax + 9, yOng); ctx.fill(); ctx.restore();
        const r = 14 * layEase("power2.out")(u(t, M.soap - 0.1, 0.5));
        const roi = kep((t - ti + 0.55) / 0.55); // giọt treo ở đầu ống rồi rơi nhanh, chạm mặt ở ti
        const yG = lerp(yOng + 16 + r, L.ban - H545 - r * 0.6, layEase("power2.in")(roi));
        if (r > 0.5) veGiot(rc, { x: L.ax, y: yG, r, keo: roi });
        const uN = u(t, M.soap, 0.6) * ra(t, M.deeper, 0.3);
        if (uN > 0) veNhan(rc, { x0: L.ax + 18, y0: yG, x1: L.ax + (doc ? 120 : 160), y1: yG + 40, text: "+ soap", u: uN, size: sz(rc, L.nhan) });
      }
      // thước kẹp + số đo (móc câu 5.45 mm lớn, sau đó thu về cỡ thường)
      const uK = u(t, 0.15, 0.5);
      const hook = u(t, M.five - 0.05, 0.55) * (1 - u(t, M.poured - 0.6, 0.6));
      let docSo = "";
      if (t < ti + 0.1) docSo = so(khoang(t, M.five - 0.05, M.five + 0.9, 0, 5.45, "expo.out")) + " mm";
      else if (t < T3) docSo = "? mm";
      else docSo = so(khoang(t, T3, T3 + 0.7, 5.45, 3.86, "expo.out")) + " mm";
      if (t < M.five - 0.05) docSo = "";
      const sizeSo = lerp(L.so, L.hook, hook);
      veThuocKep(rc, { x: xKA, y: L.ban, h, cao: caoK, u: uK, phai: false });
      ctx.save(); ctx.setLineDash([6, 8]); ctx.strokeStyle = rgba(K1.MUC, 0.5); ctx.lineWidth = 2; ctx.globalAlpha *= uK;
      ctx.beginPath(); ctx.moveTo(xKA + 4, L.ban - h); ctx.lineTo(L.ax - w / 2 + h * 0.5, L.ban - h); ctx.stroke(); ctx.restore();
      const ySo = L.ban - caoK - 30; const xSo = doc ? xKA + 24 : xKA - 8;
      if (docSo) veChu(rc, docSo, xSo, ySo, { size: sz(rc, sizeSo), weight: 600, align: "left", color: K1.MUC });
      const uPh = u(t, T3, 0.6) * ra(t, M.calculated + 1.2, 0.4);
      if (uPh > 0) veChu(rc, "puddle 3.86 mm (calculated)", xSo, ySo - sz(rc, L.nhan) * 1.5, { size: sz(rc, L.nhan * 0.9), align: "left", color: K1.MUC });
      // nhãn h1
      const xE = doc ? L.ax - 100 : L.ax + 10;
      veNhan(rc, { x0: L.ax + w * (doc ? -0.1 : 0.1), y0: L.ban - h * 0.55, x1: xE, y1: L.ban - h - (doc ? 260 : 170), text: "water, 20 °C (episode 1)", u: u(t, Math.max(M.episode, 1.3), 0.7) * ra(t, M.now - 0.2, 0.4), size: sz(rc, L.nhan), align: "center" });
      veNhan(rc, { x0: L.ax + w * 0.2, y0: L.ban - h, x1: L.ax + w * 0.2 + (doc ? 40 : 70), y1: L.ban - h - (doc ? 170 : 150), text: "shallower", u: u(t, M.shallower + 0.3, 0.6) * ra(t, M.cuts - 0.2, 0.4), size: sz(rc, L.nhan * 1.1), weight: 600 });
      // h2 — hàng γ, thanh dài đúng tỉ lệ 71.97 : 36.43
      const nx = doc ? L.ax + 60 : mepX - 300; const ny = L.ban - H386 - (doc ? 220 : 210);
      const fs = sz(rc, L.nhan * 0.95); const dong = sz(rc, doc ? 92 : 80);
      const thanh = (doc ? 420 : 420) / rc.zoom;
      const veDong = (txt, g, i, uu, k) => {
        if (uu <= 0) return;
        ctx.save(); ctx.globalAlpha *= uu;
        veChu(rc, txt, nx, ny + i * dong, { size: fs, align: "left" });
        const gv = khoang(t, k, k + 0.8, 0, g, "expo.out");
        ctx.fillStyle = rgba(K1.CANG, 0.9); ctx.fillRect(nx, ny + i * dong + fs * 0.45, thanh * (gv / 71.97), fs * 0.5);
        ctx.restore();
      };
      const het = M.puddle - 0.1;
      veDong("water, 25 °C: γ 71.97 mN/m", 71.97, 0, u(t, M.seventy, 0.6) * ra(t, het, 0.4), M.seventy);
      veDong("SDS alone, 25 °C: γ 36.43 mN/m", 36.43, 1, u(t, M.thirty, 0.6) * ra(t, het, 0.4), M.thirty);
      const uG3 = u(t, M.half, 0.5) * ra(t, het, 0.4);
      if (uG3 > 0) { ctx.save(); ctx.globalAlpha *= uG3; veChu(rc, "γ × 0.51 (about half)", nx, ny + 2 * dong + fs * 0.2, { size: fs, weight: 600, align: "left" }); ctx.restore(); }
      // h3 — bong bóng xà phòng mọc từ vũng nước SDS
      const r = bongR(t);
      if (r > 0.5) {
        veBong(rc, { x: L.ax, y: bongY(t), r, u: 1 });
        veNhan(rc, { x0: L.ax - w * 0.3, y0: L.ban - h, x1: L.ax - w * 0.3 - (doc ? 20 : 60), y1: L.ban - h - (doc ? 110 : 90), text: "weaker skin", u: u(t, M.weaker, 0.6) * ra(t, M.how - 0.1, 0.4), size: sz(rc, L.nhan), align: doc ? "center" : "right" });
        veNhan(rc, { x0: L.ax + r * 0.7, y0: bongY(t) - r * 0.7, x1: L.ax + r * 0.7 + (doc ? 50 : 90), y1: bongY(t) - r * 0.7 - 50, text: "soap film", u: u(t, M.bubble + 0.3, 0.6) * ra(t, M.how - 0.1, 0.4), size: sz(rc, L.nhan) });
      }
    }
  }));

  // --- Bộ B (h4): nhiệt kế, cốc SDS, tờ trích bài báo, cân + bình; Bộ C: hai vũng 20/25 °C → c1: nước / SDS ---
  const nhietB = (t) => (t < M.temperature + 0.1 ? 20 : khoang(t, M.temperature + 0.1, M.temperature + 1.6, 20, 25, "power2.inOut"));
  const coc = { x: xCoc, y: L.ban, w: doc ? 200 : 190, h: doc ? 270 : 240 };
  const phanTu = Array.from({ length: 16 }, (_, i) => ({ fx: ((i * 37) % 97) / 97, fy: ((i * 53) % 89) / 89, p: i * 1.7 }));
  giua.them(new Nut({
    opacity: (t) => (t >= tX ? 1 : 0),
    ve: (rc) => {
      const { t, ctx } = rc;
      // match-cut h3 → h4: màng bóng co lại thành bầu nhiệt kế
      const uv = layEase("power3.inOut")(kep((t - tX) / 0.6));
      if (uv < 1) {
        const bx = lerp(rc.camX, xNk, uv); const by = lerp(rc.camY, L.ban + 14, uv);
        const rr = lerp(900 / rc.zoom, 26, uv);
        ctx.save(); ctx.strokeStyle = rgba(K1.MUC, 0.5 * (1 - uv) + 0.2); ctx.lineWidth = 3 / rc.zoom + 2 * uv;
        ctx.beginPath(); ctx.arc(bx, by, rr, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
      // nhiệt kế
      const yy = veNhietKe(rc, { x: xNk, y: L.ban - 30, h: doc ? 440 : 380, gia: nhietB(t), size: L.nhan * 0.9 });
      veNhan(rc, { x0: xNk + 6, y0: yy, x1: xNk + (doc ? 70 : 100), y1: yy - (doc ? 170 : 130), text: "one temperature: 25 °C", u: u(t, M.temperature, 0.7) * ra(t, M.soap4 - 0.3, 0.4), size: sz(rc, L.nhan), weight: 600 });
      // cốc SDS + phân tử (đầu cam ưa nước, đuôi mực) — hình minh hoạ, ghi "our sketch"
      ctx.save();
      const g = ctx.createLinearGradient(0, coc.y - coc.h * 0.7, 0, coc.y);
      g.addColorStop(0, rgba(K1.NUOC, 0.42)); g.addColorStop(1, rgba(K1.NUOC, 0.7));
      ctx.fillStyle = g; ctx.fillRect(coc.x - coc.w / 2, coc.y - coc.h * 0.7, coc.w, coc.h * 0.7);
      ctx.strokeStyle = rgba(K1.MUC, 0.7); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(coc.x - coc.w / 2 - 10, coc.y - coc.h); ctx.lineTo(coc.x - coc.w / 2, coc.y - coc.h + 8); ctx.lineTo(coc.x - coc.w / 2, coc.y); ctx.lineTo(coc.x + coc.w / 2, coc.y); ctx.lineTo(coc.x + coc.w / 2, coc.y - coc.h); ctx.stroke();
      for (const m of phanTu) {
        const px = coc.x - coc.w / 2 + 18 + m.fx * (coc.w - 36) + Math.sin(t * 0.9 + m.p) * 5;
        const py = coc.y - 14 - m.fy * (coc.h * 0.7 - 30) + Math.cos(t * 0.7 + m.p * 2) * 4;
        const a = t * 0.5 + m.p;
        ctx.strokeStyle = rgba(K1.MUC, 0.75); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + 15 * Math.cos(a), py + 15 * Math.sin(a)); ctx.stroke();
        ctx.fillStyle = K1.CANG; ctx.beginPath(); ctx.arc(px, py, 4.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
      veChu(rc, "our sketch", coc.x, coc.y - coc.h * 0.7 - 14, { size: sz(rc, L.nhan * 0.7), italic: true, align: "center" });
      veNhan(rc, { x0: coc.x - coc.w * 0.2, y0: coc.y - coc.h * 0.5, x1: doc ? coc.x - 20 : coc.x - 150, y1: coc.y - coc.h - (doc ? 150 : 90), text: "soap here = SDS (lab surfactant)", u: u(t, M.soap4 + 0.2, 0.7) * ra(t, M.surfactant - 0.3, 0.3), size: sz(rc, L.nhan), align: doc ? "center" : "right" });
      veNhan(rc, { x0: coc.x + coc.w * 0.2, y0: coc.y - coc.h * 0.3, x1: doc ? coc.x + 30 : coc.x + 60, y1: coc.y - coc.h - (doc ? 150 : 230), text: "SDS 25.0 mM in water (inferred)", u: u(t, M.millimolar + 0.5, 0.7) * ra(t, M.seven - 0.6, 0.4), size: sz(rc, L.nhan), align: doc ? "center" : "left" });
      // tờ trích bài báo trượt vào khi lời nói "inferred from one paper's text"
      const vaoG = layEase("power3.out")(kep((t - M.inferred + 0.1) / 0.6)); const raG = layEase("power2.in")(kep((t - M.that + 0.3) / 0.5));
      if (vaoG > 0 && raG < 1) {
        const gw = doc ? 520 : 440; const gh = doc ? 230 : 260;
        const gx0 = doc ? coc.x - gw / 2 + 30 : coc.x + 260; const gy0 = doc ? L.ban - 640 : L.ban - 400;
        veToGiay(rc, {
          x: gx0 + (1 - vaoG) * 1400 + raG * 1400, y: gy0, w: gw, h: gh, size: sz(rc, 23),
          dong: [["Liu et al. 2026", true], ["SDS in water (§4.3)", false], ["25.0 mM inferred from text", false], ["(near Fig. 4a)", false]]
        });
      }
      // cân + bình 1 L: 25.0 mM × 288.38 g/mol = 7.21 g/L
      const g721 = khoang(t, M.seven - 0.2, M.grams + 0.4, 0, 7.21, "power2.out");
      const xCanD = xCan - (doc ? 150 : 130);
      ctx.save(); ctx.fillStyle = rgba(K1.MUC, 0.18);
      const doi = Math.sqrt(g721 / 7.21);
      ctx.beginPath(); ctx.ellipse(xCanD, L.ban - 74, 60 * doi + 1, 26 * doi + 1, 0, Math.PI, 0); ctx.fill(); ctx.restore();
      veCan(rc, { x: xCanD, y: L.ban, doc: so(g721) + " g", size: L.so * 0.85 });
      const xBinh = xCan + (doc ? 170 : 190);
      veBinh(rc, { x: xBinh, y: L.ban, h: doc ? 300 : 300, muc: 0.85 });
      veChu(rc, "1 L", xBinh, L.ban - 160, { size: sz(rc, L.nhan * 0.85), align: "center" });
      const uE = u(t, M.litre, 0.5) * ra(t, M.warming - 0.3, 0.4);
      if (uE > 0) { ctx.save(); ctx.globalAlpha *= uE; veChu(rc, "= 7.21 g/L (calculated)", xCanD, L.ban - (doc ? 150 : 140), { size: sz(rc, L.nhan * 1.1), weight: 600, align: "center" }); ctx.restore(); }
      if (t > M.degrees - 0.4) {
        const pop = layEase("back.out(1.4)")(kep((t - M.degrees + 0.3) / 0.5));
        const xm = xCan + (doc ? 360 : 420);
        ctx.save(); ctx.translate(xm, L.ban); ctx.scale(pop, pop); ctx.translate(-xm, -L.ban);
        veNhietKe(rc, { x: xm, y: L.ban - 20, h: 200, gia: 25, size: L.nhan * 0.7 });
        veChu(rc, "25 °C", xm, L.ban - 250, { size: sz(rc, L.nhan * 0.9), weight: 600, align: "center" });
        ctx.restore();
      }
      // --- Bộ C (h4 cuối) → c1: biến hình vũng 25 °C thành vũng SDS (match-cut), vũng 20 °C thành 25 °C ---
      const uM = layEase("power3.inOut")(kep((t - tC) / 0.6));
      const hL = lerp(hmC(VUNG.nuoc20), hmC(VUNG.nuoc25), uM); const hR = lerp(hmC(VUNG.nuoc25), hmC(VUNG.sds25), uM); const wR = (wc * hmC(VUNG.nuoc25)) / hR;
      if (doc) { // kệ trên
        veBan(rc, xC - 430, xC + 430, yL, 70);
        ctx.save(); ctx.fillStyle = rgba(K1.MUC, 0.22); ctx.fillRect(xC - 430, yL, 860, 12); ctx.restore();
      }
      const cap = [[xL, yL, wc, hL, uM < 0.5 ? "20 °C" : "25 °C", lerp(VUNG.nuoc20, VUNG.nuoc25, uM), false], [xR, yR, wR, hR, "25 °C", lerp(VUNG.nuoc25, VUNG.sds25, uM), !doc]];
      const docSoK = []; // vị trí số đọc của từng thước (để đặt nhãn c1)
      cap.forEach(([cx, yb, ww, hh, nhan, mm, phai], i) => {
        veVung(rc, { cx, y: yb, w: ww, h: hh });
        veChu(rc, nhan, cx, yb + (doc ? 50 : 60), { size: sz(rc, L.nhan), weight: 600, align: "center" });
        const xk = phai ? cx + ww / 2 + 36 : cx - ww / 2 - 36;
        const uk = u(t, M.warming + 1.0 + i * 0.5, 0.5);
        veThuocKep(rc, { x: xk, y: yb, h: hh, cao: hmC(7.5), u: uk, phai });
        const xs = doc ? xk + 24 : xk; const ys = yb - hmC(7.5) - 18;
        docSoK.push([xs, ys]);
        if (uk > 0) {
          const dem = t < tC ? khoang(t, M.warming + 1.0 + i * 0.5, M.warming + 1.8 + i * 0.5, 0, mm, "expo.out") : mm;
          veChu(rc, so(dem) + " mm", xs, ys, { size: sz(rc, L.so * 0.9), weight: 600, align: doc ? "left" : "center" });
        }
      });
      const uW = u(t, M.warming + 0.9, 0.6) * ra(t, M.barely - 0.2, 0.3);
      if (uW > 0) { ctx.save(); ctx.globalAlpha *= uW; veChu(rc, "water: 5.45 → 5.43 mm (20 → 25 °C)", xC, doc ? yR + 115 : L.ban - 400, { size: sz(rc, L.nhan), align: "center" }); ctx.restore(); }
      // c1: nhiệt kế chung, nhãn đọc số, thước so chênh 1.57 mm
      if (t > tC + 0.3) {
        const pop = layEase("back.out(1.4)")(kep((t - M.twentyC + 0.1) / 0.5)) * ra(t, M.inC - 0.1, 0.3);
        if (pop > 0) {
          const xm = doc ? xTh : xTh - 14; const ym = doc ? yL : L.ban;
          ctx.save(); ctx.translate(xm, ym); ctx.scale(pop, pop); ctx.translate(-xm, -ym);
          veNhietKe(rc, { x: xm, y: ym - 20, h: doc ? 200 : 220, gia: 25, size: L.nhan * 0.6 });
          ctx.restore();
        }
        const lech = sz(rc, L.so) * 1.3;
        const uPl = u(t, M.plain, 0.6) * ra(t, M.lower - 0.2, 0.3);
        if (uPl > 0) { ctx.save(); ctx.globalAlpha *= uPl; veChu(rc, "water: 5.43 mm", docSoK[0][0], docSoK[0][1] - lech, { size: sz(rc, L.nhan), weight: 600, align: doc ? "left" : "center" }); ctx.restore(); }
        const uSd = u(t, M.sdsC, 0.6) * ra(t, M.lower - 0.2, 0.3);
        if (uSd > 0) { ctx.save(); ctx.globalAlpha *= uSd; veChu(rc, "SDS 25.0 mM (inferred): 3.86 mm", doc ? docSoK[1][0] : docSoK[1][0] - 150, docSoK[1][1] - lech, { size: sz(rc, L.nhan), weight: 600, align: doc ? "left" : "center" }); ctx.restore(); }
        const uLo = u(t, M.lower, 0.6) * ra(t, M.inC - 0.2, 0.3);
        if (uLo > 0) {
          const yN = yR - hmC(VUNG.nuoc25); const yS = yR - hmC(VUNG.sds25);
          const xa = doc ? xR - wR / 2 : xL - wc / 2; const xb = xR + wR / 2;
          ctx.save(); ctx.globalAlpha *= uLo; ctx.setLineDash([8, 7]); ctx.strokeStyle = rgba(K1.MUC, 0.7); ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(xa, yN); ctx.lineTo(xa + (xb - xa) * layEase("power2.out")(uLo), yN); ctx.stroke();
          ctx.setLineDash([]); ctx.lineWidth = 3; ctx.strokeStyle = K1.MUC;
          const xd = doc ? xR + 150 : xR; ctx.beginPath(); ctx.moveTo(xd, yN + 4); ctx.lineTo(xd, yS - 4); ctx.stroke();
          for (const [yy2, sg] of [[yN + 4, 1], [yS - 4, -1]]) { ctx.beginPath(); ctx.moveTo(xd - 8, yy2 + sg * 10); ctx.lineTo(xd, yy2); ctx.lineTo(xd + 8, yy2 + sg * 10); ctx.stroke(); }
          ctx.restore();
          const uLo2 = u(t, M.lower + 0.3, 0.6) * ra(t, M.inC - 0.2, 0.3);
          if (uLo2 > 0) { ctx.save(); ctx.globalAlpha *= uLo2; veChu(rc, "1.57 mm lower (calculated)", doc ? xC + 60 : xd, doc ? yR + 115 : yR - hmC(7.5) - 18 - sz(rc, L.so) * 1.7, { size: sz(rc, L.nhan), weight: 600, align: "center" }); ctx.restore(); }
        }
        // kết: sức căng (cam) trên mép vũng SDS — "only the skin changes"
        const uK2 = u(t, M.inC, 0.8);
        if (uK2 > 0) {
          const nua = (rc.W / 2 - 80) / rc.zoom;
          const xa = Math.max(xR - wR / 2, rc.camX - nua); const xb = Math.min(xR + wR / 2, rc.camX + nua);
          if (xb - xa > 200 / rc.zoom) veMuiTenCang(rc, { xa, xb, y: yR - hmC(VUNG.sds25) - 22 / rc.zoom, dai: (60 * 1.2) / rc.zoom, n: 6, u: uK2, k: 1 / rc.zoom });
        }
      }
    }
  }));

  // ===== Lớp trước: hạt sáng mờ ở gần ống kính (parallax cao) tạo chiều sâu =====
  const buiTruoc = taoBui(26, -400, OX + 4800, L.ban - 900, L.ban + 300, 29);
  const lopTruoc = new Nut({
    ve: (rc) => {
      const { ctx, t } = rc;
      for (const b of buiTruoc) {
        ctx.fillStyle = rgba(K1.NEN_TREN, 0.16);
        ctx.beginPath(); ctx.arc(b.x + Math.sin(t * 0.13 + b.p) * 30, b.y + Math.cos(t * 0.11 + b.p) * 20, b.r * 9, 0, Math.PI * 2); ctx.fill();
      }
    }
  });

  // ===== Lớp màn hình: dòng nguồn, tiêu đề ngắn =====
  const cum = chiaCum(tuTrongBai, { toiDa: doc ? 3 : 4 });
  const beatTai = (t) => [...LOI].reverse().find((b) => t >= b.bd) || LOI[0];
  const TD = F.tieuDe;
  const TIEU_DE = [
    ["deeper, or shallower?", M.deeper, ti + 0.5, doc ? TD.y : 420],
    ["less pull, longer-lived film?", M.how, tX - 0.35, doc ? TD.y : 200],
    ["barely changes", M.barely, doc ? M.becomes - 0.3 : tC - 0.25, doc ? 575 : TD.y],
    ["both at 25 °C", doc ? M.twentyC + 0.4 : M.bench, M.plain - 0.25, doc ? 575 : TD.y],
    ["only the skin changes", M.only, THOI_LUONG, doc ? 1262 : 880]
  ];
  const man = new Nut({
    ve: (rc) => {
      const { t } = rc;
      const b = beatTai(t);
      const vao = u(t, b.bd + 0.2, 0.5);
      const sau = LOI[LOI.indexOf(b) + 1];
      const roi = sau ? ra(t, sau.bd, 0.3) : 1;
      const nhan = b.id === "h4" && t > M.inferred - 0.1 ? 0 : -1;
      veNguon(rc, NGUON[b.id], { x: F.nguon.x, y: F.nguon.y, size: F.nguon.size, maxW: F.nguon.maxW, u: vao * roi, nhan });
      for (const [txt, t0, t1, y] of TIEU_DE) veTieuDe(rc, txt, TD.x, y, { size: TD.size, t0, t1, phong });
    }
  });

  const canh = {
    nen: (rc) => veNen(rc),
    camera: cam,
    lop: [
      { ten: "nen", parallax: 0.25, goc: lopNen },
      { ten: "giua", parallax: 1, goc: giua },
      { ten: "truoc", parallax: 1.35, goc: lopTruoc },
      { ten: "man", man: true, goc: man }
    ]
  };

  // Các chuyển động camera/chuyển cảnh (để lấy 3 khung đầu–giữa–cuối mỗi cái trong bộ dẫn chứng)
  const chuyenCanh = LICH.filter((c) => c[3] !== "set" && c[1] >= 0.6).map(([t0, dur]) => ["cú máy", t0, t0 + dur]);
  return {
    F, tl, canh, cum, chuyenCanh, M, VUNG, tu: tuTrongBai, THOI_LUONG, FPS, mocGiong: true, LOI,
    phuDe: {
      ...F.phuDe, mau: K1.NEN_TREN, nenHop: K1.MUC, aHop: 0.92, vien: rgba(K1.NEN_TREN, 0.9),
      gachChan: (w) => (CANG.test(w) ? K1.CANG : NUOC.test(w) ? K1.NUOC : null)
    },
    hauKy: (rc) => { veVien(rc); veVungPip(rc, F.pip); }
  };
}
