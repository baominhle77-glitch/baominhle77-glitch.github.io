// Bài thi đầu (lệnh GĐ Studio gd-20261024-1220, sửa theo thư gd-20261024-1650/1652/1705): dựng lại phần mở
// "What Soap Does to Water's Skin" — Meniscus Lab tập 2 (storyboard sha8 dfe35144), beat h1 → c1, khuôn K1.
// Thời gian lấy từ giọng thật của Studio (edge-tts, bai/k1t2_moc.js): beats là nguồn thời gian duy nhất, ~71,6 s.
// Mỗi chuyển động camera neo vào mốc của từ khoá đang được nói; không rung giả.
// Bản C13 (thư GĐ gd-20261024-2332): mỗi cú máy đóng khung TRỌN một nhóm vật (hộp bao thế giới → khung vật của khổ),
// nên khi máy đứng không vật nào bị mép khung cắt; vật chỉ qua mép khi đang trượt vào/ra. Sổ VAT dùng cho bộ kiểm tự động.
import { Nut, veChu, phong } from "../engine/canh.js";
import { DongThoiGian } from "../engine/thoigian.js";
import { kep, khoang, layEase, loXo, lerp } from "../engine/easing.js";
import { chiaCum, uocLuongMoc } from "../engine/phude.js";
import {
  K1, rgba, so, veNen, taoBui, veBui, veBan, veVung, veThuocKep, veNhan, veMuiTenCang, veGiot,
  veDongRot, veBong, veNhietKe, veCan, veBinh, veVien, veVungPip, veNguon, veTieuDe, veToGiay,
  veVignette, veBongDo, phanChieu, VIEN_MUC, veTheSDS
} from "../kenh/k1.js";
import { MOC_GIONG, BEATS } from "./k1t2_moc.js";

export const KHO = {
  "16x9": {
    ten: "16x9", W: 1920, H: 1080, pip: [1552, 36, 1884, 246], an: [40, 40, 1880, 1040],
    vat: [130, 280, 1790, 925],
    phuDe: { cx: 960, cy: 990, maxW: 1240, size: 46 }, daiPhuDe: [320, 950, 1600, 1062], vungNguon: [640, 40, 1545, 225], nguon: { x: 1530, y: 72, size: 24, maxW: 860 }, tieuDe: { x: 960, y: 290, size: 56 }
  },
  "9x16": {
    ten: "9x16", W: 1080, H: 1920, pip: [62, 266, 438, 508], an: [65, 270, 1015, 1536],
    vat: [100, 560, 980, 1310],
    phuDe: { cx: 540, cy: 1382, maxW: 860, size: 50 }, daiPhuDe: [90, 1338, 990, 1426], vungNguon: [450, 278, 1015, 545], nguon: { x: 1005, y: 302, size: 24, maxW: 540 }, tieuDe: { x: 540, y: 640, size: 58 }
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
    shallower: moc("h2", "shallower"), sds2: moc("h2", "sds"), cuts: moc("h2", "cuts"), seventy: moc("h2", "seventy"), thirty: moc("h2", "thirty"),
    about: moc("h2", "about"), half: moc("h2", "half"), puddle: moc("h2", "puddle"), three: moc("h2", "three", 2), calculated: moc("h2", "calculated"),
    weaker: moc("h3", "weaker"), bubble: moc("h3", "bubble"), how: moc("h3", "how"), more: moc("h3", "more"),
    temperature: moc("h4", "temperature"), soap4: moc("h4", "soap"), surfactant: moc("h4", "surfactant"), millimolar: moc("h4", "millimolar"),
    inferred: moc("h4", "inferred"), that: moc("h4", "that"), seven: moc("h4", "seven"), grams: moc("h4", "grams"), litre: moc("h4", "litre"),
    all: moc("h4", "all"), degrees: moc("h4", "degrees"), warming: moc("h4", "warming"), barely: moc("h4", "barely"), becomes: moc("h4", "becomes"),
    five545: moc("h4", "five", 4), puddle4: moc("h4", "puddle"),
    both: moc("c1", "both"), bench: moc("c1", "bench"), twentyC: moc("c1", "twenty"), plain: moc("c1", "plain"), sdsC: moc("c1", "sds"),
    lower: moc("c1", "lower"), calcC: moc("c1", "calculated"), inC: moc("c1", "in"), only: moc("c1", "only")
  };
  const ti = M.shallower - 0.15; // giọt xà phòng chạm mặt nước ngay trước chữ "Shallower"
  const T3 = Math.max(M.three, M.puddle + 0.8); // đọc số 3.86 khi camera đã tới thước kẹp
  const tX = B.h4.bd - 0.1; // giữa cú zoom xuyên màng bóng (chuyển h3 → h4)
  const tC = B.c1.bd; // biến hình vũng nước 25 °C → vũng SDS (chuyển h4 → c1)

  // --- Bố cục theo khổ (9:16 bố cục lại thật: vật cao hơn, dải 40–60 % chiều cao, phụ đề ~68 %) ---
  const L = doc
    ? { ban: 1120, pxmm: 34, ax: 540, w0: 460, w1: 540, w1b: 600, camY: 930, nhan: 38, so: 44, hook: 84, zDay: 1.9, pxmC: 30, wc: 400 }
    : { ban: 800, pxmm: 32, ax: 960, w0: 640, w1: 800, w1b: 900, camY: 580, nhan: 34, so: 40, hook: 96, zDay: 1.9, pxmC: 32, wc: 560 };
  const hmm = (mm) => mm * L.pxmm;
  const H545 = hmm(VUNG.nuoc20); const H386 = hmm(VUNG.sds25); const H543 = hmm(VUNG.nuoc25);
  const THE_TICH = L.w1b * H545; // diện tích mặt cắt (thể tích trên mỗi đơn vị sâu) sau lần rót thứ hai
  const W2 = THE_TICH / H386; // cùng thể tích, mỏng hơn → loang rộng hơn
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

  // ===== Vị trí các nhóm vật trên bàn (thế giới). Mỗi nhóm cách nhóm kế đủ xa để một cú máy đóng khung trọn
  // một nhóm mà không chạm nhóm khác (C13 mục 2); máy lia giữa các nhóm = vật trượt vào/ra khung. =====
  const OX = 4200;
  const xNk = OX; const xCoc = OX + (doc ? 1150 : 1700); const xCan = OX + (doc ? 2500 : 3600); const xC = OX + (doc ? 4000 : 5800);
  const hNk = doc ? 440 : 380;
  const coc = { x: xCoc, y: L.ban, w: doc ? 240 : 190, h: doc ? 320 : 240 };
  const xCanD = xCan - (doc ? 150 : 170); const xBinh = xCan + (doc ? 120 : 150); const xNk2 = xCan + (doc ? 330 : 400);
  // Bộ C (h4 cuối, c1): hai vũng trên CÙNG một bàn ("both puddles on one bench"), thước kẹp ở hai phía ngoài.
  // Vũng phải giữ mép trái khi biến hình nước 25 °C → SDS (loang sang phải), nên khe giữa hai vũng không đổi.
  const hmC = (mm) => mm * L.pxmC; const wc = L.wc;
  const G = doc ? 170 : 420;
  const xL = xC - G / 2 - wc / 2; const xRl = xC + G / 2; const yL = L.ban; const yR = L.ban;
  const wSDS = (wc * hmC(VUNG.nuoc25)) / hmC(VUNG.sds25);
  const uM = (t) => layEase("power3.inOut")(kep((t - tC) / 0.6));
  const hL = (t) => lerp(hmC(VUNG.nuoc20), hmC(VUNG.nuoc25), uM(t)); const hR = (t) => lerp(hmC(VUNG.nuoc25), hmC(VUNG.sds25), uM(t));
  const wR = (t) => (wc * hmC(VUNG.nuoc25)) / hR(t); const xR = (t) => xRl + wR(t) / 2;
  const xkL = xL - wc / 2 - 36; const xkR = (t) => xRl + wR(t) + 36;
  const caoKC = hmC(7.5);
  // h2: hàng γ đặt giữa phía trên vũng
  const nx = L.ax - (doc ? 210 : 230); const ny = L.ban - H386 - (doc ? 330 : 300);
  const bongY = (t) => L.ban - H386 - khoang(t, M.bubble - 0.2, M.bubble + 2.2, 0, doc ? 660 : 340, "power2.out");
  const bongR = (t) => khoang(t, M.bubble - 0.2, M.bubble + 1.6, 0, doc ? 160 : 140, "back.out(1.3)");
  // ống nhỏ giọt trọn vẹn (bóp cao su + ống thuỷ tinh): trượt vào từ trên khi "Now add soap", rút lên sau khi giọt rơi
  const yTip = L.ban - (doc ? 470 : 420); const ongVao = M.soap - 0.6; const ongRa = ti + 0.25;
  const yOng = (t) => yTip - (1 - layEase("power3.out")(kep((t - ongVao) / 0.6))) * 520 - layEase("power2.in")(kep((t - ongRa) / 0.7)) * 900;
  const xKA = (t) => L.ax - wA(t) / 2 - (doc ? 64 : 84); // thước kẹp đứng sát mép vũng, lùi theo khi vũng loang

  // ===== Sổ vật (hộp bao thế giới theo t): dùng để đóng khung cú máy và để tự kiểm "không vật nào bị cắt mép" =====
  const VAT = [];
  const vat = (ten, hop) => { VAT.push({ ten, hop }); return hop; };
  const bVungA = vat("vũng A", (t) => (t < tX ? [L.ax - wA(t) / 2 - 6, L.ban - hA(t) - 12, L.ax + wA(t) / 2 + 6, L.ban + 18] : null));
  const bKepA = vat("thước kẹp A", (t) => (t < tX && t > 0.15 ? [xKA(t) - 24, L.ban - caoK - 8, xKA(t) + 52, L.ban + 18] : null));
  const bOng = vat("ống nhỏ giọt", (t) => (t > ongVao && t < ongRa + 0.7 ? [L.ax - 26, yOng(t) - 262, L.ax + 26, yOng(t) + 20] : null));
  const bBong = vat("bong bóng", (t) => { const r = bongR(t); return t < tX && r > 0.5 ? [L.ax - r - 3, bongY(t) - r - 3, L.ax + r + 3, bongY(t) + r + 3] : null; });
  const bNk = vat("nhiệt kế", (t) => (t >= tX ? [xNk - 30, L.ban - 30 - hNk - 4, xNk + 64, L.ban + 46] : null));
  const bCoc = vat("cốc SDS", (t) => (t >= tX ? [coc.x - coc.w / 2 - 14, coc.y - coc.h - 4, coc.x + coc.w / 2 + 4, coc.y + 8] : null));
  const giay = { w: doc ? 520 : 440, h: doc ? 230 : 260 };
  giay.x = doc ? coc.x - giay.w / 2 : coc.x + coc.w / 2 + 70; giay.y = doc ? L.ban - coc.h - 320 - giay.h : L.ban - 400;
  const vaoG = (t) => layEase("power3.out")(kep((t - M.inferred + 0.1) / 0.6)); const raG = (t) => layEase("power2.in")(kep((t - M.that + 0.3) / 0.5));
  const xGiay = (t) => giay.x + (1 - vaoG(t)) * 1400 + raG(t) * 1400;
  // thẻ phân tử SDS: trượt vào ở "a lab surfactant", trượt ra trước khi tờ bài báo vào cùng chỗ
  const vaoT = (t) => layEase("power3.out")(kep((t - M.surfactant + 0.1) / 0.6)); const raT = (t) => layEase("power2.in")(kep((t - M.millimolar - 0.2) / 0.5));
  const xThe = (t) => giay.x + (1 - vaoT(t)) * 1400 + raT(t) * 1400;
  vat("thẻ phân tử SDS", (t) => (vaoT(t) > 0 && raT(t) < 1 ? [xThe(t) - 2, giay.y - 2, xThe(t) + giay.w + 12, giay.y + giay.h + 14] : null));
  const bGiay = [giay.x, giay.y - 4, giay.x + giay.w + 12, giay.y + giay.h + 14];
  vat("tờ bài báo", (t) => (vaoG(t) > 0 && raG(t) < 1 ? [xGiay(t) - 2, giay.y - 2, xGiay(t) + giay.w + 12, giay.y + giay.h + 14] : null));
  const bCan = vat("cân", (t) => (t >= tX ? [xCanD - 132, L.ban - 76, xCanD + 132, L.ban + 8] : null));
  const bBinh = vat("bình 1 L", (t) => (t >= tX ? [xBinh - 154, L.ban - 304, xBinh + 154, L.ban + 8] : null));
  const bNk2 = vat("nhiệt kế 25 °C", (t) => (t > M.degrees - 0.4 ? [xNk2 - 30, L.ban - 224, xNk2 + 52, L.ban + 30] : null));
  const bVungL = vat("vũng trái", (t) => (t >= tX ? [xL - wc / 2 - 6, yL - hL(t) - 8, xL + wc / 2 + 6, yL + 18] : null));
  const bVungR = vat("vũng phải", (t) => (t >= tX ? [xRl - 6, yR - hR(t) - 8, xRl + wR(t) + 6, yR + 18] : null));
  const bKepL = vat("thước kẹp trái", (t) => (t > M.warming + 1.0 ? [xkL - 24, yL - caoKC - 8, xkL + 52, yL + 18] : null));
  const bKepR = vat("thước kẹp phải", (t) => (t > M.warming + 1.5 ? [xkR(t) - 52, yR - caoKC - 8, xkR(t) + 24, yR + 18] : null));

  // ===== Camera: mỗi cú máy = đóng khung trọn một nhóm vật vào vùng vật của khổ (F.vat), neo vào từ khoá đang nói =====
  const [R0, R1, R2, R3] = F.vat; const RW = R2 - R0; const RH = R3 - R1; const RX = (R0 + R2) / 2; const RY = (R1 + R3) / 2;
  const hop = (...bs) => bs.filter(Boolean).reduce((a, c) => [Math.min(a[0], c[0]), Math.min(a[1], c[1]), Math.max(a[2], c[2]), Math.max(a[3], c[3])]);
  const noi = ([x0, y0, x1, y1], l, tr, p, d) => [x0 - l, y0 - tr, x1 + p, y1 + d];
  // zoom vừa khít (trừ 3 % cho trôi máy), tâm hộp đặt vào tâm vùng vật
  // dy: lệch tâm hộp theo chiều dọc (px màn hình) — các cú chỉnh khung liền nhau lệch xen kẽ ±D để mép bàn nhảy rõ (C13 mục 3)
  const khung = (b, zMax = 2.2, dy = 0) => {
    const z = Math.min(zMax, (RW / (b[2] - b[0])) * 0.97, (RH / (b[3] - b[1])) * 0.97);
    const du = Math.max(0, (RH - (b[3] - b[1]) * z) / 2); // chỉ lệch trong phần vùng vật còn trống: hộp không ra khỏi vùng
    const lech = Math.max(-du, Math.min(du, dy));
    return { x: (b[0] + b[2]) / 2 - (RX - F.W / 2) / z, y: (b[1] + b[3]) / 2 - (RY + lech - F.H / 2) / z, zoom: z };
  };
  const K = (b, zMax = 2.2) => ({ hop: b, zMax });
  const D = doc ? 170 : 90;
  const camGoc = new Nut({ x: L.ax, y: L.camY, zoom: 1 });
  const cam = new Nut({
    x: (t) => tl.lay(camGoc, "x", t, camGoc.x) + Math.sin(t * 0.23) * 5,
    y: (t) => tl.lay(camGoc, "y", t, camGoc.y) + Math.sin(t * 0.19 + 1.3) * 3,
    zoom: (t) => tl.lay(camGoc, "zoom", t, camGoc.zoom) * (1 + 0.008 * Math.sin(t * 0.15)),
    rot: 0
  });
  const quay = (t0, dur, dich, e = "power3.inOut") => {
    for (const k of ["x", "y", "zoom"]) if (dich[k] != null) tl.to(camGoc, k, dich[k], t0, dur, e);
  };
  const datCam = (t0, dich) => { for (const k of ["x", "y", "zoom"]) if (dich[k] != null) tl.set(camGoc, k, dich[k], t0); };
  const so5 = (t) => [xKA(t) - 30, L.ban - caoK - (doc ? 150 : 150), xKA(t) + (doc ? 300 : 280), L.ban - caoK]; // số đo trên thước kẹp
  const thanhG = [nx - 20, ny - 60, nx + (doc ? 440 : 470), ny + (doc ? 250 : 230)];
  const nhomA = (t) => hop(bVungA(t), bKepA(t), so5(t));
  const nhomC = (t) => hop(bVungL(t), bVungR(t), [xkL - 24, yL - caoKC - 120, xkR(t) + 24, yL + 70]);
  const nhomCL = (t) => hop(bVungL(t), [xkL - 24, yL - caoKC - 120, xkL + 52, yL + 70]);
  const nhomCR = (t) => hop(bVungR(t), [xkR(t) - 52, yR - caoKC - 120, xkR(t) + 24, yR + 70]);
  const nhomB3 = hop(bCan(tX), bBinh(tX), [xNk2 - 30, L.ban - 260, xNk2 + 52, L.ban + 30], [xCanD - 140, L.ban - 190, xCanD + 140, L.ban]);
  const LICH = [
    // h1 — mở bằng cận cảnh dòng rót + vũng (vật to giữa khung), lùi ra thấy thước kẹp, số đo 5.45 mm nảy lớn
    [0, 0, khung(noi(bVungA(1.2), 20, 170, 20, 0), 2.0), "set"],
    [M.episode - 0.1, 1.6, K(noi(hop(bVungA(2.6), bKepA(2.6)), 40, doc ? 620 : 380, 40, 0)), "power3.inOut"], // rộng, chừa trời cho dòng rót
    [M.five - 0.25, 0.9, K(noi(nhomA(3.2), 0, 30, 0, -10), 2.0)],
    [M.however - 0.2, 1.0, K(noi(hop(bVungA(6.6), bKepA(6.6)), doc ? 40 : 160, doc ? 260 : 420, doc ? 40 : 160, 0))], // lần rót 2: lùi vừa, dòng rót chảy vào từ trên
    [M.now - 0.15, 0.6, K(doc ? [L.ax - 180, yTip - 360, L.ax + 180, yTip - 30] : [L.ax - 200, yTip - 290, L.ax + 200, yTip + 40], 2.2)], // 9:16: ống đặt cao để mép dưới khung nằm trên đỉnh vũng (vũng cao 185 px) // "Now add soap": cận ống nhỏ giọt vừa trượt vào (vũng ra ngoài khung, không bị cắt)
    [M.deeper - 0.1, 0.8, K(noi(hop(bVungA(8), bOng(8), [L.ax - W2 / 2 - 6, L.ban - hmm(7) - 8, L.ax + W2 / 2 + 6, L.ban]), 0, 0, 170, 0))],
    [ti, 0.5, K(noi(bVungA(ti), 10, 60, 10, 10), 2.0), "power3.out"], // giọt chạm mặt: dí máy vào vũng
    [ti + 0.6, 1.3, K(nhomA(ti + 2.2)), "power2.out"], // vũng loang: máy lùi theo
    // h2 — sức căng: mũi tên cam dọc trọn mặt nước; hàng γ trên vũng; chiều sâu 3.86 mm
    [M.cuts - 0.3, 0.9, K(noi(hop(bVungA(M.cuts), bKepA(M.cuts)), 0, 60, 0, 0), 2.0)],
    [M.seventy - 0.3, 0.9, K(hop(bVungA(M.seventy), bKepA(M.seventy), thanhG))],
    [M.thirty - 0.2, 0.9, doc ? K(noi(hop(bVungA(M.thirty), bKepA(M.thirty)), 0, 40, 0, 0), 2.0) : K(noi(hop(bVungA(M.thirty), bKepA(M.thirty), thanhG), 40, 20, 40, 60))],
    [M.about - 0.1, 0.9, K(noi(hop(bVungA(M.about), bKepA(M.about)), 0, 80, 0, 0), 2.0)],
    [M.puddle - 0.15, 0.9, K(nhomA(M.puddle + 1))],
    [M.calculated - 0.2, 1.0, K(noi(nhomA(M.calculated), 60, doc ? 700 : 420, 60, 20))], // chừa trời: bong bóng sắp mọc
    [M.weaker - 0.2, 0.8, K(noi(hop(bVungA(M.weaker), bKepA(M.weaker)), 0, 60, 0, 0), 2.0)], // "weaker skin": sát mặt vũng
    // h3 — bong bóng mọc từ vũng SDS, máy nâng theo rồi dí vào riêng bong bóng, xuyên màng (match-cut sang h4)
    [M.bubble - 0.3, 1.2, K(hop(bVungA(M.bubble), bBong(M.bubble + 2.2)))],
    [M.how - 0.05, 0.7, K(noi(bBong(M.how + 0.7), 60, 60, 60, 60), 2.2), "power3.inOut"],
    [M.more + 0.1, tX - M.more - 0.1, { zoom: 9 }, "power3.in"],
    // h4 — nhiệt kế (một nhiệt độ) → cốc SDS (+ tờ bài báo) → cân + bình (7.21 g/L) + nhiệt kế 25 °C → hai vũng
    [tX, 0, { ...khung(bNk(tX)), zoom: khung(bNk(tX)).zoom * 1.4 }, "set"],
    [tX, 1.2, K(noi(bNk(tX), 40, 40, 200, 0)), "expo.out"],
    [M.temperature + 0.2, 1.0, K(noi(bNk(tX), 120, 60, 120, 0), 1.6)],
    [M.soap4 - 0.3, 1.0, K(noi(bCoc(tX), 40, 40, 40, 0), 2.2), "power3.inOut"],
    [M.surfactant - 0.2, 0.9, K(hop(bCoc(tX), bGiay))], // thẻ phân tử SDS trượt vào cạnh cốc
    [M.millimolar + 0.75, 0.8, K(noi(bCoc(tX), 60, doc ? 60 : 120, 60, 10), doc ? 2.6 : 2.2)], // thẻ đã ra: dí vào mặt nước có lớp SDS
    [M.inferred - 0.1, 0.6, K(hop(bCoc(tX), bGiay))], // "inferred from one paper's text": lùi ra thấy cốc cạnh tờ bài báo
    [M.inferred - 0.3, 0.9, K(hop(bCoc(tX), bGiay))], // tờ bài báo vào
    [M.seven - 0.5, 1.0, K(nhomB3), "power3.inOut"],
    [M.grams - 0.25, 0.8, K(hop(bCan(tX), bBinh(tX)), 2.2)],
    [M.all - 0.2, 0.9, K(noi(nhomB3, 40, 40, 40, 20))],
    [M.warming - 0.2, 1.2, K(nhomC(M.warming + 2)), "power3.inOut"],
    [M.barely - 0.2, 0.8, K(nhomCL(M.barely), 2.0)],
    [M.puddle4 - 0.2, 0.6, K(nhomC(M.puddle4)), "power3.inOut"], // "the puddle": lùi ra thấy cả hai vũng (đổi hình rõ giữa hai cận cảnh)
    [M.becomes - 0.25, 0.9, K(nhomCR(M.becomes), 2.0)],
    // c1 — vũng 25 °C biến thành vũng SDS; đọc từng vũng; thước so chênh 1.57 mm; mũi tên sức căng trên vũng SDS
    [tC - 0.2, 1.0, K(nhomC(tC + 0.6)), "power3.inOut"],
    [M.twentyC - 0.2, 0.8, K(noi(nhomC(tC + 0.6), 40, 160, 40, 40))],
    [M.plain - 0.2, 0.8, K(nhomCL(M.plain), 2.0)],
    [M.sdsC - 0.25, 0.9, K(nhomCR(M.sdsC), 2.0)],
    [M.lower - 0.2, 1.0, K(noi(nhomC(M.lower), 0, 60, 0, 0))],
    [M.calcC - 0.2, 0.8, K(noi(nhomCR(M.calcC), 0, 40, 0, 0), 2.0)],
    [M.inC - 0.1, 1.0, K(noi(nhomC(M.inC), 0, doc ? 200 : 100, 0, 0))]
  ];
  // chỉnh khung trong cùng nhóm vật: 0,6 s power3.inOut (dứt khoát, đổi hình rõ); lia sang nhóm khác / easing riêng: giữ thời lượng ghi
  let dau = 1;
  for (const [t0, dur, dich0, e] of LICH) {
    const dich = dich0.hop ? khung(dich0.hop, dich0.zMax, e ? 0 : (dau = -dau) * D) : dich0;
    if (e === "set") datCam(t0, dich); else quay(t0, e ? dur : Math.min(dur, 0.5), dich, e);
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
      if (t > ongVao && t < ongRa + 0.7) {
        const yo = yOng(t);
        // ống thuỷ tinh 170 px (dung dịch SDS bên trong) + bóp cao su mực 70 px: cả ống luôn trọn trong khung khi đứng
        ctx.save();
        ctx.fillStyle = rgba(K1.NEN_TREN, 0.55); ctx.strokeStyle = rgba(K1.MUC, 0.75); ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(L.ax - 11, yo - 170); ctx.lineTo(L.ax - 11, yo - 22); ctx.lineTo(L.ax - 3, yo + 16); ctx.lineTo(L.ax + 3, yo + 16); ctx.lineTo(L.ax + 11, yo - 22); ctx.lineTo(L.ax + 11, yo - 170); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = rgba(K1.NUOC, 0.5); ctx.fillRect(L.ax - 8, yo - 80, 16, 70);
        ctx.fillStyle = rgba(K1.MUC, 0.88);
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(L.ax - 22, yo - 240, 44, 74, 20) : ctx.rect(L.ax - 22, yo - 240, 44, 74); ctx.fill();
        ctx.fillRect(L.ax - 16, yo - 172, 32, 10);
        ctx.restore();
        if (t < ti + 0.05) {
          const r = 14 * layEase("power2.out")(u(t, M.soap - 0.1, 0.5));
          const roi = kep((t - ti + 0.55) / 0.55); // giọt treo ở đầu ống rồi rơi nhanh, chạm mặt ở ti
          const yG = lerp(yo + 16 + r, L.ban - H545 - r * 0.6, layEase("power2.in")(roi));
          if (r > 0.5) veGiot(rc, { x: L.ax, y: yG, r, keo: roi });
        }
        const uN = u(t, M.soap, 0.6) * ra(t, M.deeper, 0.3);
        if (uN > 0) veNhan(rc, { x0: L.ax + 14, y0: yo - 120, x1: L.ax + (doc ? 110 : 150), y1: yo - 150, text: "+ soap (SDS)", u: uN, size: sz(rc, L.nhan) });
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
      const xK = xKA(t);
      if (uK > 0) { veBongDo(rc, xK + 14, L.ban, 90, 0.22 * uK); phanChieu(rc, L.ban, () => veThuocKep(rc, { x: xK, y: L.ban, h, cao: caoK, u: uK, phai: false })); }
      veThuocKep(rc, { x: xK, y: L.ban, h, cao: caoK, u: uK, phai: false });
      ctx.save(); ctx.setLineDash([6, 8]); ctx.strokeStyle = rgba(K1.MUC, 0.5); ctx.lineWidth = 2; ctx.globalAlpha *= uK;
      ctx.beginPath(); ctx.moveTo(xK + 4, L.ban - h); ctx.lineTo(L.ax - w / 2 + h * 0.5, L.ban - h); ctx.stroke(); ctx.restore();
      const ySo = L.ban - caoK - 30; const xSo = doc ? xK + 24 : xK - 8;
      if (docSo) veChu(rc, docSo, xSo, ySo, { size: sz(rc, sizeSo), weight: 600, align: "left", color: K1.MUC });
      const uPh = u(t, T3, 0.6) * ra(t, M.calculated + 1.2, 0.4);
      if (uPh > 0) veChu(rc, "puddle 3.86 mm (calculated)", xSo, ySo - sz(rc, L.nhan) * 1.5, { size: sz(rc, L.nhan * 0.9), align: "left", color: K1.MUC });
      // nhãn h1
      const xE = doc ? L.ax - 100 : L.ax + 10;
      veNhan(rc, { x0: L.ax + w * (doc ? -0.1 : 0.1), y0: L.ban - h * 0.55, x1: xE, y1: L.ban - h - (doc ? 260 : 170), text: "water, 20 °C (episode 1)", u: u(t, Math.max(M.episode, 1.3), 0.7) * ra(t, Math.min(M.now - 0.2, M.however - 0.2), 0.4), size: sz(rc, L.nhan), align: "center" });
      veNhan(rc, { x0: L.ax + w * 0.2, y0: L.ban - h, x1: L.ax + w * 0.2 + (doc ? 40 : 70), y1: L.ban - h - (doc ? 170 : 150), text: "shallower", u: u(t, M.shallower + 0.3, 0.6) * ra(t, M.cuts - 0.2, 0.4), size: sz(rc, L.nhan * 1.1), weight: 600 });
      // h2 — hàng γ, thanh dài đúng tỉ lệ 71.97 : 36.43
      const fs = sz(rc, L.nhan * 0.95); const dong = sz(rc, doc ? 92 : 80);
      const thanh = (doc ? 420 : 420) / rc.zoom;
      const veDong = (txt, g, i, uu, k) => {
        if (uu <= 0) return;
        ctx.save(); ctx.globalAlpha *= uu;
        veChu(rc, txt, nx, ny + i * dong, { size: fs, align: "left" });
        const gv = khoang(t, k, k + 0.8, 0, g, "expo.out");
        const bw = thanh * (gv / 71.97); const v = VIEN_MUC / rc.zoom;
        if (bw > 0.5) {
          ctx.fillStyle = K1.MUC; ctx.fillRect(nx - v, ny + i * dong + fs * 0.45 - v, bw + 2 * v, fs * 0.5 + 2 * v);
          ctx.fillStyle = K1.CANG; ctx.fillRect(nx, ny + i * dong + fs * 0.45, bw, fs * 0.5);
        }
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
      // vật đặt trên bàn: bóng đổ + phản chiếu mờ (C13 mục 6)
      const datBan = (x, rong, ve) => { veBongDo(rc, x, L.ban, rong); phanChieu(rc, L.ban, ve); ve(); };
      // nhiệt kế
      let yy = 0;
      datBan(xNk, 120, () => { yy = veNhietKe(rc, { x: xNk, y: L.ban - 30, h: hNk, gia: nhietB(t), size: L.nhan * 0.9 }); });
      veNhan(rc, { x0: xNk + 6, y0: yy, x1: xNk + (doc ? 70 : 100), y1: yy - (doc ? 170 : 130), text: "one temperature: 25 °C", u: u(t, M.temperature, 0.7) * ra(t, M.soap4 - 0.3, 0.4), size: sz(rc, L.nhan), weight: 600 });
      // cốc SDS + phân tử (đầu cam ưa nước có viền mực, đuôi mực) — hình minh hoạ, ghi "our sketch".
      // "a lab surfactant": phần lớn phân tử bơi lên xếp hàng ở mặt nước (đầu trong nước, đuôi chĩa ra ngoài)
      const yMat = coc.y - coc.h * 0.7;
      const veCoc = () => {
        ctx.save();
        const g = ctx.createLinearGradient(0, yMat, 0, coc.y);
        g.addColorStop(0, rgba(K1.NUOC, 0.42)); g.addColorStop(1, rgba(K1.NUOC, 0.7));
        ctx.fillStyle = g; ctx.fillRect(coc.x - coc.w / 2, yMat, coc.w, coc.h * 0.7);
        ctx.strokeStyle = rgba(K1.MUC, 0.7); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(coc.x - coc.w / 2 - 10, coc.y - coc.h); ctx.lineTo(coc.x - coc.w / 2, coc.y - coc.h + 8); ctx.lineTo(coc.x - coc.w / 2, coc.y); ctx.lineTo(coc.x + coc.w / 2, coc.y); ctx.lineTo(coc.x + coc.w / 2, coc.y - coc.h); ctx.stroke();
        ctx.restore();
      };
      datBan(coc.x, coc.w * 1.3, veCoc);
      ctx.save();
      const nLen = phanTu.filter((m, i) => i % 3 !== 2).length;
      let k = 0;
      phanTu.forEach((m, i) => {
        let px = coc.x - coc.w / 2 + 18 + m.fx * (coc.w - 36) + Math.sin(t * 0.9 + m.p) * 5;
        let py = coc.y - 14 - m.fy * (coc.h * 0.7 - 30) + Math.cos(t * 0.7 + m.p * 2) * 4;
        let a = t * 0.5 + m.p;
        if (i % 3 !== 2) { // lên mặt nước, xếp hàng đều
          const uS = layEase("power2.inOut")(kep((t - M.surfactant - 0.1 - k * 0.06) / 1.1));
          const xs = coc.x - coc.w / 2 + 14 + ((k + 0.5) / nLen) * (coc.w - 28);
          px = lerp(px, xs, uS); py = lerp(py, yMat + 7, uS); a = lerp(a, -Math.PI / 2 + 0.15 * Math.sin(t + m.p), uS);
          k++;
        }
        ctx.strokeStyle = rgba(K1.MUC, 0.8); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + 15 * Math.cos(a), py + 15 * Math.sin(a)); ctx.stroke();
        ctx.fillStyle = K1.MUC; ctx.beginPath(); ctx.arc(px, py, 4.5 + VIEN_MUC / rc.zoom, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = K1.CANG; ctx.beginPath(); ctx.arc(px, py, 4.5, 0, Math.PI * 2); ctx.fill();
      });
      ctx.restore();
      veChu(rc, "our sketch", coc.x, coc.y - 16, { size: sz(rc, L.nhan * 0.7), italic: true, align: "center" });
      veNhan(rc, { x0: coc.x - coc.w * 0.2, y0: coc.y - coc.h * 0.5, x1: doc ? coc.x - 20 : coc.x - 150, y1: coc.y - coc.h - (doc ? 150 : 90), text: "soap here = SDS (lab surfactant)", u: u(t, M.soap4 + 0.2, 0.7) * ra(t, M.surfactant + 1.6, 0.3), size: sz(rc, L.nhan), align: doc ? "center" : "right" });
      veNhan(rc, { x0: coc.x + coc.w * 0.3, y0: yMat + 4, x1: doc ? coc.x + 30 : coc.x - 40, y1: coc.y - coc.h - (doc ? 150 : 110), text: "SDS 25.0 mM in water (inferred)", u: u(t, M.millimolar + 0.5, 0.7) * ra(t, M.seven - 0.6, 0.4), size: sz(rc, L.nhan), align: doc ? "center" : "right" });
      if (vaoT(t) > 0 && raT(t) < 1) {
        veTheSDS(rc, { x: xThe(t), y: giay.y, w: giay.w, h: giay.h, size: sz(rc, 23), dong: ["SDS molecule (our sketch)", "water-loving head", "oily tail"] });
      }
      // tờ trích bài báo trượt vào khi lời nói "inferred from one paper's text"
      if (vaoG(t) > 0 && raG(t) < 1) {
        veToGiay(rc, {
          x: xGiay(t), y: giay.y, w: giay.w, h: giay.h, size: sz(rc, 23),
          dong: [["Liu et al. 2026", true], ["SDS in water (§4.3)", false], ["25.0 mM inferred from text", false], ["(near Fig. 4a)", false]]
        });
      }
      // cân + bình 1 L: 25.0 mM × 288.38 g/mol = 7.21 g/L
      const g721 = khoang(t, M.seven - 0.2, M.grams + 0.4, 0, 7.21, "power2.out");
      datBan(xCanD, 300, () => {
        ctx.save(); ctx.fillStyle = rgba(K1.MUC, 0.18);
        const doi = Math.sqrt(g721 / 7.21);
        ctx.beginPath(); ctx.ellipse(xCanD, L.ban - 74, 60 * doi + 1, 26 * doi + 1, 0, Math.PI, 0); ctx.fill(); ctx.restore();
        veCan(rc, { x: xCanD, y: L.ban, doc: so(g721) + " g", size: L.so * 0.85 });
      });
      datBan(xBinh, 320, () => veBinh(rc, { x: xBinh, y: L.ban, h: 300, muc: 0.85 }));
      veChu(rc, "1 L", xBinh, L.ban - 160, { size: sz(rc, L.nhan * 0.85), align: "center" });
      const uE = u(t, M.litre, 0.5) * ra(t, M.warming - 0.3, 0.4);
      if (uE > 0) { ctx.save(); ctx.globalAlpha *= uE; veChu(rc, "= 7.21 g/L (calculated)", xCanD, L.ban - (doc ? 150 : 140), { size: sz(rc, L.nhan * 1.1), weight: 600, align: "center" }); ctx.restore(); }
      if (t > M.degrees - 0.4) {
        const pop = layEase("back.out(1.4)")(kep((t - M.degrees + 0.3) / 0.5));
        ctx.save(); ctx.translate(xNk2, L.ban); ctx.scale(pop, pop); ctx.translate(-xNk2, -L.ban);
        datBan(xNk2, 80, () => veNhietKe(rc, { x: xNk2, y: L.ban - 20, h: 200, gia: 25, size: L.nhan * 0.8 }));
        veChu(rc, "25 °C", xNk2, L.ban - 250, { size: sz(rc, L.nhan * 0.9), weight: 600, align: "center" });
        ctx.restore();
      }
      // --- Bộ C (h4 cuối) → c1: hai vũng trên cùng một bàn; biến hình vũng 25 °C thành vũng SDS (match-cut), 20 °C → 25 °C ---
      const m = uM(t);
      const cap = [
        [xL, wc, hL(t), m < 0.5 ? "20 °C" : "25 °C", lerp(VUNG.nuoc20, VUNG.nuoc25, m), xkL, false],
        [xR(t), wR(t), hR(t), "25 °C", lerp(VUNG.nuoc25, VUNG.sds25, m), xkR(t), true]
      ];
      const docSoK = []; // vị trí số đọc của từng thước (để đặt nhãn c1)
      cap.forEach(([cx, ww, hh, nhan, mm, xk, phai], i) => {
        veVung(rc, { cx, y: L.ban, w: ww, h: hh });
        veChu(rc, nhan, cx, L.ban + (doc ? 50 : 60), { size: sz(rc, L.nhan), weight: 600, align: "center" });
        const uk = u(t, M.warming + 1.0 + i * 0.5, 0.5);
        if (uk > 0) { veBongDo(rc, xk + (phai ? -14 : 14), L.ban, 90, 0.22 * uk); phanChieu(rc, L.ban, () => veThuocKep(rc, { x: xk, y: L.ban, h: hh, cao: caoKC, u: uk, phai })); }
        veThuocKep(rc, { x: xk, y: L.ban, h: hh, cao: caoKC, u: uk, phai });
        const xs = xk; const ys = L.ban - caoKC - 18;
        docSoK.push([xs, ys]);
        if (uk > 0) {
          const dem = t < tC ? khoang(t, M.warming + 1.0 + i * 0.5, M.warming + 1.8 + i * 0.5, 0, mm, "expo.out") : mm;
          veChu(rc, so(dem) + " mm", xs, ys, { size: sz(rc, L.so * 0.9), weight: 600, align: "center" });
        }
      });
      const uW = u(t, M.warming + 0.9, 0.6) * ra(t, M.barely - 0.2, 0.3);
      if (uW > 0) { ctx.save(); ctx.globalAlpha *= uW; veChu(rc, "water: 5.45 → 5.43 mm (20 → 25 °C)", xC, L.ban - caoKC - (doc ? 170 : 150), { size: sz(rc, L.nhan), align: "center" }); ctx.restore(); }
      // c1: nhãn đọc số, thước so chênh 1.57 mm
      if (t > tC + 0.3) {
        const lech = sz(rc, L.so) * 1.3;
        const uPl = u(t, M.plain, 0.6) * ra(t, M.lower - 0.2, 0.3);
        if (uPl > 0) { ctx.save(); ctx.globalAlpha *= uPl; veChu(rc, "water: 5.43 mm", xL, docSoK[0][1] - lech, { size: sz(rc, L.nhan), weight: 600, align: "center" }); ctx.restore(); }
        const uSd = u(t, M.sdsC, 0.6) * ra(t, M.lower - 0.2, 0.3);
        if (uSd > 0) { ctx.save(); ctx.globalAlpha *= uSd; veChu(rc, "SDS 25.0 mM (inferred): 3.86 mm", xR(t), docSoK[1][1] - lech, { size: sz(rc, L.nhan), weight: 600, align: "center" }); ctx.restore(); }
        const uLo = u(t, M.lower, 0.6) * ra(t, M.inC - 0.2, 0.3);
        if (uLo > 0) {
          const yN = yR - hmC(VUNG.nuoc25); const yS = yR - hmC(VUNG.sds25);
          const xa = xL - wc / 2; const xb = xRl + wR(t);
          ctx.save(); ctx.globalAlpha *= uLo; ctx.setLineDash([8, 7]); ctx.strokeStyle = rgba(K1.MUC, 0.7); ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(xa, yN); ctx.lineTo(xa + (xb - xa) * layEase("power2.out")(uLo), yN); ctx.stroke();
          ctx.setLineDash([]); ctx.lineWidth = 3; ctx.strokeStyle = K1.MUC;
          const xd = xR(t); ctx.beginPath(); ctx.moveTo(xd, yN + 4); ctx.lineTo(xd, yS - 4); ctx.stroke();
          for (const [yy2, sg] of [[yN + 4, 1], [yS - 4, -1]]) { ctx.beginPath(); ctx.moveTo(xd - 8, yy2 + sg * 10); ctx.lineTo(xd, yy2); ctx.lineTo(xd + 8, yy2 + sg * 10); ctx.stroke(); }
          ctx.restore();
          const uLo2 = u(t, M.lower + 0.3, 0.6) * ra(t, M.inC - 0.2, 0.3);
          if (uLo2 > 0) { ctx.save(); ctx.globalAlpha *= uLo2; veChu(rc, "1.57 mm lower (calculated)", xC, L.ban - caoKC - (doc ? 170 : 150), { size: sz(rc, L.nhan), weight: 600, align: "center" }); ctx.restore(); }
        }
        // kết: sức căng (cam, viền mực) dọc trọn mặt vũng SDS — "only the skin changes"
        const uK2 = u(t, M.inC, 0.8);
        if (uK2 > 0) veMuiTenCang(rc, { xa: xRl, xb: xRl + wR(t), y: yR - hmC(VUNG.sds25) - 22 / rc.zoom, dai: (60 * 1.2) / rc.zoom, n: 6, u: uK2, k: 1 / rc.zoom });
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

  // ===== B2: match-cut mặt nước → cận cảnh vi mô → về bàn, không thêm chữ hay đổi camera/TTS =====
  // Toàn bộ vật mới nằm trong F.vat, cách nguồn/PiP/phụ đề; màn hình vẫn giữ hộp nguồn và chữ cũ.
  const canhB2 = new Nut({
    ve: (rc) => {
      const { t, ctx, W, H } = rc;
      if (t < M.cuts || t >= M.puddle) return;
      const aVao = layEase("power2.inOut")(kep((t - M.cuts) / 0.4));
      const aRa = layEase("power2.inOut")(kep((M.puddle - t) / 0.4));
      const a = Math.min(aVao, aRa);
      if (a <= 0) return;

      ctx.save();
      ctx.globalAlpha *= a;
      // Match-cut theo đường mặt nước: thay toàn cảnh bàn bằng mặt phân cách phóng đại.
      // Phông sáng như K1 gốc để giữ tương phản hộp phụ đề, không phủ chữ màn hình.
      veNen(rc);
      const xl = doc ? 145 : 250;
      const xr = doc ? 935 : 1670;
      const day = doc ? 1250 : 870;
      const co = khoang(t, M.thirty - 0.12, M.thirty + 1.05, 0, 1, "power3.inOut");
      const mat = (doc ? 800 : 490) + co * (doc ? 160 : 100);
      const song = (x) => 8 * Math.sin((x - xl) * 0.012 - t * 2.2);
      const giua = (xl + xr) / 2;
      const rong = xr - xl;

      // Lớp xa: quầng sáng ở sau mặt nước và bóng tiếp xúc rộng (không có mặt bàn).
      const bong = ctx.createRadialGradient(giua, mat + 85, 4, giua, mat + 85, rong * 0.57);
      bong.addColorStop(0, rgba(K1.MUC, 0.26));
      bong.addColorStop(1, rgba(K1.MUC, 0));
      ctx.fillStyle = bong;
      ctx.fillRect(xl - 25, mat - 110, rong + 50, 275);
      for (let i = 0; i < 4; i++) {
        const xx = xl + (i + 0.5) * rong / 4 + 16 * Math.sin(t * 0.35 + i);
        const yy = mat + 75 + i * 28;
        ctx.strokeStyle = rgba(K1.NEN_TREN, 0.24);
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.ellipse(xx, yy, rong * 0.19, 42 + i * 16, -0.15, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Lớp giữa: màng nước mặt cắt lớn, nổi khối nhờ tô chuyển sắc và đường viền.
      const nuoc = ctx.createLinearGradient(0, mat, 0, day);
      nuoc.addColorStop(0, rgba(K1.NUOC, 0.68));
      nuoc.addColorStop(0.65, rgba(K1.NUOC, 0.91));
      nuoc.addColorStop(1, rgba(K1.MUC, 0.62));
      ctx.beginPath();
      ctx.moveTo(xl, mat + song(xl));
      for (let i = 1; i <= 48; i++) {
        const x = xl + rong * i / 48;
        ctx.lineTo(x, mat + song(x));
      }
      ctx.lineTo(xr, day);
      ctx.lineTo(xl, day);
      ctx.closePath();
      ctx.fillStyle = nuoc;
      ctx.fill();
      ctx.strokeStyle = K1.MUC;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Mặt sáng và lớp gần: hạt SDS minh hoạ, cam có viền mực 2 px.
      ctx.strokeStyle = rgba(K1.NEN_TREN, 0.78);
      ctx.lineWidth = 8;
      ctx.beginPath();
      for (let i = 0; i <= 48; i++) {
        const x = xl + rong * i / 48;
        const y = mat + song(x) + 7;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      const coMuiTen = lerp(1, 36.43 / 71.97, co);
      for (let i = 0; i < 9; i++) {
        const x = xl + 62 + i * (rong - 124) / 8;
        const y = mat + song(x) - 35 + 4 * Math.sin(t * 1.2 + i);
        const r = doc ? 10 : 12;
        ctx.strokeStyle = K1.MUC;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y - 5); ctx.lineTo(x + 7, y - 35); ctx.lineTo(x - 5, y - 55);
        ctx.stroke();
        ctx.fillStyle = K1.MUC;
        ctx.beginPath(); ctx.arc(x, y, r + VIEN_MUC, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = K1.CANG;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }

      // Sức căng thu về ~0,51 lần đúng lúc đọc 36,43 mN/m; hướng kéo vào trong.
      const mui = (x, dir) => {
        const dai = (doc ? 148 : 210) * coMuiTen;
        const y = mat - (doc ? 105 : 115);
        const x2 = x + dir * dai;
        for (const [mau, dayNet] of [[K1.MUC, 10], [K1.CANG, 6]]) {
          ctx.strokeStyle = mau; ctx.lineWidth = dayNet;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y); ctx.stroke();
        }
        ctx.fillStyle = K1.CANG; ctx.strokeStyle = K1.MUC; ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x2, y);
        ctx.lineTo(x2 - dir * 17, y - 12);
        ctx.lineTo(x2 - dir * 17, y + 12);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      };
      mui(xl + rong * 0.25, 1);
      mui(xr - rong * 0.25, -1);

      // Quét sáng có nghĩa khi đọc "millinewtons per metre" (18,0–19,2 s).
      // Dải chuyển trên khối nước tạo nhịp đổi hình đủ lớn mà không rung camera.
      const quet = khoang(t, 18.0, 19.2, -0.3, 1.3, "power2.inOut");
      if (quet > -0.3 && quet < 1.3) {
        const x = xl + quet * rong;
        const g = ctx.createLinearGradient(x - 245, 0, x + 245, 0);
        g.addColorStop(0, rgba(K1.NEN_TREN, 0));
        g.addColorStop(0.5, rgba(K1.NEN_TREN, 0.72));
        g.addColorStop(1, rgba(K1.NEN_TREN, 0));
        const trai = Math.max(xl, x - 245), phai = Math.min(xr, x + 245);
        if (phai > trai) {
          ctx.fillStyle = g;
          ctx.fillRect(trai, mat + 30, phai - trai, Math.max(0, day - mat - 60));
        }
      }
      ctx.restore();
    }
  });

  // ===== Lớp màn hình: dòng nguồn, tiêu đề ngắn =====
  const cum = chiaCum(tuTrongBai, { toiDa: doc ? 3 : 4 });
  const beatTai = (t) => [...LOI].reverse().find((b) => t >= b.bd) || LOI[0];
  const TD = F.tieuDe;
  const TIEU_DE = [
    ["Will soap flatten the puddle?", 0.1, 2.4, doc ? TD.y : 420, 0], // A1: đọc trọn câu ≥ 1,5 s trước nhãn đo
    ["deeper, or shallower?", M.deeper, ti + 0.5, doc ? TD.y : 420],
    ["less pull, longer-lived film?", M.how, tX - 0.35, doc ? TD.y : 200],
    ["barely changes", M.barely, doc ? M.becomes - 0.3 : tC - 0.25, doc ? 575 : TD.y],
    ["both at 25 °C", doc ? M.twentyC + 0.4 : M.bench, M.plain - 0.25, TD.y],
    ["only the skin changes", M.only, THOI_LUONG, doc ? TD.y : TD.y]
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
      for (const [txt, t0, t1, y, nhay] of TIEU_DE) veTieuDe(rc, txt, TD.x, y, { size: TD.size, t0, t1, phong, nhay });
    }
  });

  const canh = {
    nen: (rc) => veNen(rc),
    camera: cam,
    lop: [
      { ten: "nen", parallax: 0.25, goc: lopNen },
      { ten: "giua", parallax: 1, goc: giua },
      { ten: "truoc", parallax: 1.35, goc: lopTruoc },
      { ten: "b2", man: true, goc: canhB2 },
      { ten: "vignette", man: true, goc: new Nut({ ve: (rc) => veVignette(rc) }) },
      { ten: "man", man: true, goc: man }
    ]
  };

  // Các chuyển động camera/chuyển cảnh (để lấy 3 khung đầu–giữa–cuối mỗi cái trong bộ dẫn chứng)
  const chuyenCanh = [
    ...LICH.filter((c) => c[3] !== "set" && c[1] >= 0.6).map(([t0, dur]) => ["cú máy", t0, t0 + dur]),
    ["match-cut B2 sang cận mặt nước", M.cuts, M.cuts + 0.4],
    ["match-cut B2 trở lại bàn", M.puddle - 0.4, M.puddle]
  ];
  return {
    F, tl, canh, cum, chuyenCanh, M, VUNG, VAT, cam, tu: tuTrongBai, THOI_LUONG, FPS, mocGiong: true, LOI,
    phuDe: {
      ...F.phuDe, mau: K1.NEN_TREN, nenHop: K1.MUC, quang: K1.NEN_TREN, doQuang: 12, vienGach: K1.MUC,
      gachChan: (w) => (CANG.test(w) ? K1.CANG : NUOC.test(w) ? K1.NUOC : null)
    },
    hauKy: (rc) => { veVien(rc); veVungPip(rc, F.pip); }
  };
}
