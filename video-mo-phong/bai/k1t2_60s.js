// Bài thi đầu (lệnh GĐ Studio gd-20261024-1220): dựng lại 60 giây đầu hồ sơ mẫu
// "What Soap Does to Water's Skin" — Meniscus Lab tập 2 (storyboard sha8 dfe35144), beat h1 → c1, khuôn K1.
// Lời, nhãn, dòng nguồn chép đúng storyboard; mốc từ ước lượng 2,5 từ/giây khi chưa có tệp giọng edge-tts.
import { Nut, veChu } from "../engine/canh.js";
import { DongThoiGian } from "../engine/thoigian.js";
import { kep, khoang, layEase, loXo, lerp } from "../engine/easing.js";
import { chiaCum, uocLuongMoc } from "../engine/phude.js";
import {
  K1, rgba, so, veNen, taoBui, veBui, veBan, veVung, veThuocKep, veNhan, veMuiTenCang, veGiot,
  veDongRot, veBong, veNhietKe, veCan, veBinh, veDauChi, veVien, veVungPip, veNguon
} from "../kenh/k1.js";

export const KHO = {
  "16x9": {
    ten: "16x9", W: 1920, H: 1080, pip: [1552, 36, 1884, 246], an: [40, 40, 1880, 1040],
    phuDe: { cx: 960, cy: 990, maxW: 1240, size: 46 }, nguon: { x: 1530, y: 70, size: 21, maxW: 860 }
  },
  "9x16": {
    ten: "9x16", W: 1080, H: 1920, pip: [62, 266, 438, 508], an: [65, 270, 1015, 1536],
    phuDe: { cx: 540, cy: 1300, maxW: 860, size: 50 }, nguon: { x: 1005, y: 300, size: 21, maxW: 540 }
  }
};

const LOI = [
  { id: "h1", bd: 0.0, dai: 9.6, n: "In episode one, this puddle stopped at five point four five, in millimetres, however much water we poured. Now add soap. Deeper, or shallower?" },
  { id: "h2", bd: 10.1, dai: 12.8, n: "Shallower. Our soap, SDS, cuts the skin's pull from seventy one point nine seven to thirty six point four three millinewtons per metre, about half. Puddle: three point eight six millimetres, calculated." },
  { id: "h3", bd: 23.4, dai: 5.6, n: "Yet this weaker skin holds a bubble together. How can less pull hold more?" },
  { id: "h4", bd: 29.5, dai: 25.2, n: "A fair test needs one temperature. Our soap is SDS, a lab surfactant, in water at twenty five millimolar, a concentration inferred from one paper's text. That is seven point two one grams per litre, calculated, all at twenty five degrees Celsius. Warming plain water from twenty to twenty five barely changes the puddle: five point four five becomes five point four three." },
  { id: "c1", bd: 55.2, dai: 17.6, n: "Here are both puddles on one bench, at twenty five degrees. Plain water stands at five point four three millimetres. The SDS one stands at three point eight six, lower by one point five seven millimetres, calculated. In this model, only the skin changes." }
];

const NGUON = {
  h1: ["episode 1: NIST SRD 69 row 34 (293.10 K)"],
  h2: ["NIST SRD 69, saturation table, 298.15 K", "Liu et al. 2026, Fig. 5a: SDS alone in water (§4.3), 25 °C, 25.0 mM (inferred)", "calculated: puddle depth from these values"],
  h3: ["Bhamla et al., PLoS One 2017, Conclusion"],
  h4: ["Liu et al. 2026: SDS in water (§4.3), 25.0 mM inferred from text (Fig. 4a)", "PubChem CID 3423265: 288.38 g/mol", "episode 1: NIST SRD 69 row 34 (293.10 K)", "calculated: ρ, γ water NIST SRD 69, 298.15 K"],
  c1: ["calculated: ρ, γ water NIST SRD 69, 298.15 K", "γ SDS: Liu et al. 2026, Fig. 5a, in water (§4.3), 25 °C, 25.0 mM (inferred)"]
};

// Từ khoá có gạch chân màu đại lượng: cam = sức căng mặt, xanh = trọng lực/khối lượng (chiều sâu vũng)
const CANG = /^(soap|sds|skin|skin's|pull|weaker|bubble|surfactant|half)/i;
const NUOC = /^(puddle|deeper|shallower|millimetres|grams)/i;

export const THOI_LUONG = 60;
export const FPS = 30;

export function taoBai(tenKho = "16x9", mocTu = null) {
  const F = KHO[tenKho];
  const doc = F.ten === "9x16";
  const W = F.W;

  // --- Mốc từ: từ tệp giọng nếu có, không thì ước lượng ---
  const tu = mocTu || LOI.flatMap((b) => uocLuongMoc(b.n, b.bd, b.dai).map((w) => ({ ...w, beat: b.id })));
  const tuTrongBai = tu.filter((w) => w.start < THOI_LUONG - 0.3);
  if (!mocTu) LOI.forEach((b) => tu.filter((w) => w.beat === b.id).forEach((w) => (w.beat = b.id)));
  const chuan = (s) => s.toLowerCase().replace(/[^a-z0-9']/g, "");
  const moc = (beat, w, lan = 1) => {
    const b = LOI.find((x) => x.id === beat);
    const ds = tu.filter((x) => (x.beat ? x.beat === beat : x.start >= b.bd - 0.05 && x.start < b.bd + b.dai + 0.6));
    let dem = 0;
    for (const x of ds) if (chuan(x.text).startsWith(w) && ++dem === lan) return x.start;
    return b.bd;
  };
  const M = {
    episode: moc("h1", "episode"), five: moc("h1", "five"), poured: moc("h1", "poured"), soap: moc("h1", "soap"), deeper: moc("h1", "deeper"),
    shallower: moc("h2", "shallower"), cuts: moc("h2", "cuts"), seventy: moc("h2", "seventy"), thirty: moc("h2", "thirty"), half: moc("h2", "half"), three: moc("h2", "three"), calculated: moc("h2", "calculated"),
    weaker: moc("h3", "weaker"), bubble: moc("h3", "bubble"), how: moc("h3", "how"), more: moc("h3", "more"),
    temperature: moc("h4", "temperature"), surfactant: moc("h4", "surfactant"), millimolar: moc("h4", "millimolar"), inferred: moc("h4", "inferred"),
    seven: moc("h4", "seven"), grams: moc("h4", "grams"), litre: moc("h4", "litre"), celsius: moc("h4", "celsius"), warming: moc("h4", "warming"), barely: moc("h4", "barely"), becomes: moc("h4", "becomes"),
    bench: moc("c1", "bench"), plain: moc("c1", "plain")
  };
  const ti = M.shallower - 0.12; // giọt xà phòng chạm mặt nước
  const T3 = Math.max(M.three, M.half + 1.85); // đọc số 3.86 khi camera đã lùi xong

  // --- Bố cục theo khổ (bố cục lại thật, không co ảnh) ---
  const L = doc
    ? { ban: 1090, pxmm: 25, ax: 540, w0: 270, w1: 380, ox: 4200, nhan: 38, so: 42, hook: 110, camY: 930 }
    : { ban: 770, pxmm: 30, ax: 1010, w0: 400, w1: 560, ox: 4200, nhan: 34, so: 38, hook: 104, camY: 560 };
  const hmm = (mm) => mm * L.pxmm;
  const H545 = hmm(5.45); const H386 = hmm(3.86);
  const W2 = (L.w1 * 5.45) / 3.86; // cùng thể tích, mỏng hơn → loang rộng hơn

  // chiều cao và bề rộng vũng A theo thời gian (vật lý: thể tích bảo toàn sau khi ngừng rót)
  const hA = (t) => (t < ti + 0.1 ? H545 : lerp(H545, H386, loXo(t - ti - 0.1, { zeta: 0.82, f: 0.9 })));
  const wA = (t) => {
    if (t < ti) return khoang(t, 0, 4.9, L.w0, L.w1, "power1.out");
    return (L.w1 * H545) / hA(t);
  };
  const songA = (t) => (x) => {
    const dt = t - ti;
    if (dt < 0) return 0;
    const d = Math.abs(x - L.ax);
    return 9 * Math.exp(-dt * 1.3) * Math.exp(-d / 260) * Math.sin(d * 0.055 - dt * 11);
  };

  const tl = new DongThoiGian();
  const sz = (rc, s) => s / rc.zoom; // cỡ chữ màn hình cố định dù camera zoom
  const u = (t, t0, d = 0.6) => kep((t - t0) / d);
  const ra = (t, t1, d = 0.3) => kep((t1 - t) / d);

  // ===== Camera: nút gốc chứa tween + trôi chậm (drift) để khung không bao giờ đứng yên =====
  const camGoc = new Nut({ x: L.ax, y: L.camY, zoom: 1.22 });
  const cam = new Nut({
    x: (t) => tl.lay(camGoc, "x", t, camGoc.x) + Math.sin(t * 0.23) * 7,
    y: (t) => tl.lay(camGoc, "y", t, camGoc.y) + Math.sin(t * 0.19 + 1.3) * 5,
    zoom: (t) => tl.lay(camGoc, "zoom", t, camGoc.zoom) * (1 + 0.012 * Math.sin(t * 0.15)),
    rot: 0
  });
  const camTo = (prop, v, bd, dur, e = "power2.inOut") => tl.to(camGoc, prop, v, bd, dur, e);
  // h1: lùi dần từ cận cảnh vũng nước
  camTo("zoom", 1.0, 0, 3.4);
  camTo("y", L.camY - (doc ? 40 : 30), 0, 3.4);
  // h2: zoom vào mép mặt nước khi nói về sức căng, rồi lùi ra khi đọc chiều sâu
  const mepX = L.ax + W2 / 2 - (doc ? 90 : 150);
  camTo("x", mepX, M.cuts - 0.3, 1.8);
  camTo("y", L.ban - H386 + (doc ? 20 : -30), M.cuts - 0.3, 1.8);
  camTo("zoom", doc ? 2.0 : 2.3, M.cuts - 0.3, 1.8);
  camTo("x", L.ax, M.half + 0.25, 1.9);
  camTo("y", L.camY - (doc ? 40 : 30), M.half + 0.25, 1.9);
  camTo("zoom", 1.0, M.half + 0.25, 1.9);
  // h3: bám bong bóng bay lên rồi zoom xuyên màng bóng sang bàn mới
  const bongY = (t) => L.ban - H386 - khoang(t, M.bubble - 0.2, M.bubble + 2.2, 0, doc ? 330 : 340, "power2.out");
  const bongR = (t) => khoang(t, M.bubble - 0.2, M.bubble + 1.6, 0, doc ? 150 : 140, "back.out(1.3)");
  const tXuyen = LOI[3].bd - 0.25; // giữa lúc zoom xuyên bóng
  camTo("y", doc ? 930 : 470, M.bubble + 0.2, 2.0);
  camTo("zoom", 1.15, M.bubble + 0.2, 2.0);
  camTo("zoom", 9, M.more + 0.3, tXuyen - M.more - 0.3, "power3.in");
  // h4: sau cú xuyên, camera ở bàn B (nhiệt kế → cốc SDS → cân + bình → hai vũng 20/25 °C)
  const OX = L.ox;
  const xNk = OX; const xCoc = OX + (doc ? 1100 : 1500); const xCan = OX + (doc ? 2200 : 3000); const xC = OX + (doc ? 3300 : 4600); const xD = OX + (doc ? 4500 : 6200);
  tl.set(camGoc, "x", xNk + (doc ? 60 : 140), tXuyen);
  tl.set(camGoc, "y", doc ? 930 : L.ban - 210, tXuyen);
  tl.set(camGoc, "zoom", 1.9, tXuyen);
  camTo("zoom", 1.25, tXuyen, 1.4, "expo.out");
  camTo("x", xCoc, M.surfactant - 0.5, 1.5);
  camTo("zoom", doc ? 1.15 : 1.2, M.surfactant - 0.5, 1.5);
  camTo("x", xCan + (doc ? 0 : 150), M.seven - 0.6, 1.5);
  camTo("x", xC, M.warming - 0.6, 1.8);
  camTo("y", doc ? 940 : L.ban - 180, M.warming - 0.6, 1.8);
  camTo("zoom", doc ? 1.1 : 1.15, M.warming - 0.6, 1.8);
  // c1: zoom qua thang độ lớn — từ cận cảnh thước kẹp lùi ra toàn bàn
  camTo("x", xD, LOI[4].bd - 0.3, 2.2);
  camTo("zoom", doc ? 0.92 : 0.95, LOI[4].bd - 0.3, 2.2);
  camTo("y", doc ? 960 : L.ban - 200, LOI[4].bd - 0.3, 2.2);

  // ===== Lớp nền: bụi sáng trôi (parallax thấp) =====
  const bui = taoBui(110, -600, OX + 7600, -400, L.ban + 500, 11);
  const lopNen = new Nut({ ve: (rc) => veBui(rc, bui) });

  // ===== Lớp giữa: bàn quang học và vật thể =====
  const giua = new Nut();
  giua.them(new Nut({ ve: (rc) => veBan(rc, -2000, OX + 8000, L.ban, doc ? 420 : 300) }));

  // --- Bộ A: vũng nước tập 1, rót thêm, giọt xà phòng (h1–h3) ---
  const xKA = L.ax - W2 / 2 - (doc ? 40 : 80); // thước kẹp đứng yên bên trái (ngoài vùng loang tối đa)
  giua.them(new Nut({
    opacity: (t) => (t < tXuyen ? 1 : 0),
    ve: (rc) => {
      const { t, ctx } = rc;
      const h = hA(t); const w = wA(t);
      // dự đoán: hai đường viền mờ "sâu hơn?" / "nông hơn?"
      const uDd = u(t, M.deeper, 0.5) * ra(t, ti + 1.2, 0.6);
      if (uDd > 0) {
        ctx.save(); ctx.globalAlpha *= uDd; ctx.setLineDash([10, 9]); ctx.strokeStyle = rgba(K1.MUC, 0.55); ctx.lineWidth = 2.5;
        for (const [hh, ww] of [[hmm(7.0), (L.w1 * H545) / hmm(7.0)], [H386, W2]]) {
          ctx.strokeRect(L.ax - ww / 2, L.ban - hh, ww, hh);
        }
        ctx.restore();
        veChu(rc, "deeper?", L.ax + ((L.w1 * H545) / hmm(7.0)) / 2 + 14, L.ban - hmm(7.0) + 10, { size: sz(rc, L.nhan * 0.9), color: rgba(K1.MUC, 0.95), align: "left" });
        veChu(rc, "shallower?", L.ax + W2 / 2 + 14, L.ban - H386 + 34, { size: sz(rc, L.nhan * 0.9), color: rgba(K1.MUC, 0.95), align: "left" });
      }
      // dòng rót (h1): dừng ở 4,6 s, đuôi rơi khỏi khung
      const tRot = 4.6;
      veDongRot(rc, { x: L.ax + (doc ? 70 : 120), yTop: L.ban - (doc ? 1100 : 900), yBot: L.ban - h + 4, w: 22, u: 1, duoi: t < tRot ? 0 : (t - tRot) * (t - tRot) * 2600 });
      veVung(rc, { cx: L.ax, y: L.ban, w, h, song: songA(t) });
      // mũi tên sức căng (h2): dài theo γ — nước 71.97 → SDS 36.43 mN/m
      const uC = u(t, M.cuts, 0.8) * ra(t, M.half + 1.6, 0.5);
      if (uC > 0) {
        const dai = (doc ? 110 : 120) * (t < M.thirty ? 1 : lerp(1, 36.43 / 71.97, layEase("power2.inOut")(u(t, M.thirty, 1.1))));
        veMuiTenCang(rc, { xa: L.ax - w / 2, xb: L.ax + w / 2, y: L.ban - h - 14 / rc.zoom * 1.6, dai: (dai * 1.2) / rc.zoom, n: 8, u: uC, k: 1 / rc.zoom });
      }
      // giọt xà phòng: ống nhỏ giọt vào, giọt hình thành, rơi quay chậm, chạm mặt ở ti
      if (t >= M.soap - 0.6 && t < ti + 0.05) {
        const yOng = L.ban - (doc ? 640 : 560) - (1 - layEase("power3.out")(u(t, M.soap - 0.6, 0.6))) * 300;
        ctx.save(); ctx.fillStyle = rgba(K1.MUC, 0.8);
        ctx.fillRect(L.ax - 9, yOng - 400, 18, 400); ctx.beginPath(); ctx.moveTo(L.ax - 9, yOng); ctx.lineTo(L.ax, yOng + 16); ctx.lineTo(L.ax + 9, yOng); ctx.fill(); ctx.restore();
        const r = 14 * layEase("power2.out")(u(t, M.soap - 0.1, 0.5));
        const roi = kep((t - M.soap - 0.4) / (ti - M.soap - 0.4));
        const yG = lerp(yOng + 16 + r, L.ban - H545 - r * 0.6, layEase("power2.in")(roi));
        if (r > 0.5) veGiot(rc, { x: L.ax, y: yG, r, keo: roi });
        const uN = u(t, M.soap, 0.6) * ra(t, M.deeper + 0.1, 0.3);
        if (uN > 0) veNhan(rc, { x0: L.ax + 18, y0: yG, x1: L.ax + (doc ? 110 : 160), y1: yG - 30, text: "+ soap", u: uN, size: sz(rc, L.nhan) });
      }
      // thước kẹp + số đo (hook 5.45 mm lớn, sau đó thu về cỡ thường)
      const uK = u(t, 0.15, 0.5);
      const hook = u(t, M.five - 0.05, 0.55) * (1 - u(t, M.soap - 0.4, 0.8));
      let docSo = "";
      if (t < ti + 0.1) docSo = so(khoang(t, M.five - 0.05, M.five + 0.5, 0, 5.45, "expo.out")) + " mm";
      else if (t < T3) docSo = "? mm";
      else docSo = so(khoang(t, T3, T3 + 0.7, 5.45, 3.86, "expo.out")) + " mm";
      if (t < M.five - 0.05) docSo = "";
      const sizeSo = lerp(L.so, L.hook, hook);
      veThuocKep(rc, { x: xKA, y: L.ban, h, cao: hmm(8.6), u: uK, doc: "", size: sizeSo, phai: false });
      ctx.save(); ctx.setLineDash([6, 8]); ctx.strokeStyle = rgba(K1.MUC, 0.5); ctx.lineWidth = 2; ctx.globalAlpha *= uK;
      ctx.beginPath(); ctx.moveTo(xKA - 4, L.ban - h); ctx.lineTo(L.ax - w / 2 + h / 2, L.ban - h); ctx.stroke(); ctx.restore();
      if (docSo) {
        const sx = doc ? xKA + 20 : xKA - 26; const sy = doc ? L.ban - hmm(8.6) - 30 : L.ban - h + sizeSo * 0.35;
        veChu(rc, docSo, sx, sy, { size: sz(rc, sizeSo), weight: 600, align: doc ? "left" : "right", color: K1.MUC });
      }
      const uPh = u(t, T3, 0.6) * ra(t, LOI[2].bd + 0.6, 0.4);
      if (uPh > 0) veChu(rc, "puddle 3.86 mm (calculated)", doc ? xKA + 20 : xKA - 26, doc ? L.ban - hmm(8.6) - 30 + sz(rc, L.nhan) * 1.25 : L.ban - h + sizeSo * 0.35 + sz(rc, L.nhan) * 1.3, { size: sz(rc, L.nhan * 0.9), align: doc ? "left" : "right", color: K1.MUC });
      // nhãn h1/h2
      veNhan(rc, { x0: L.ax - w * (doc ? 0.05 : 0.25), y0: L.ban - h * 0.55, x1: doc ? L.ax - 90 : L.ax - w * 0.25 - 60, y1: L.ban - h - (doc ? 300 : 120), text: "water, 20 °C (episode 1)", u: u(t, M.episode, 0.7) * ra(t, M.deeper, 0.4), size: sz(rc, L.nhan), align: doc ? "center" : "right" });
      if (t > M.deeper - 0.2) {
        const uQ = u(t, M.deeper, 0.6) * ra(t, ti + 0.4, 0.3);
        const qx = doc ? L.ax : L.ax; const qy = L.ban - (doc ? 470 : 420);
        if (uQ > 0) {
          ctx.save(); ctx.globalAlpha *= layEase("power3.out")(uQ);
          const hp = veChu(rc, "deeper, or shallower?", qx, qy, { size: sz(rc, L.nhan * 1.25), weight: 600, align: "center" });
          ctx.restore();
          veDauChi(rc, { x: hp.x1 + sz(rc, 30), y: qy - sz(rc, 12), u: u(t, M.deeper + 0.25, 0.4) * uQ, r: sz(rc, 14) });
        }
      }
      veNhan(rc, { x0: L.ax + w * 0.18, y0: L.ban - h, x1: L.ax + w * 0.18 + (doc ? 40 : 70), y1: L.ban - h - (doc ? 170 : 150), text: "shallower", u: u(t, M.shallower + 0.3, 0.6) * ra(t, M.cuts - 0.2, 0.4), size: sz(rc, L.nhan * 1.1), weight: 600 });
      // h2 — nhãn γ khi zoom vào mép nước; thanh so sánh tỉ lệ đúng 71.97 : 36.43
      const nx = mepX + (doc ? -150 : -90); const ny = L.ban - H386 - (doc ? 150 : 130);
      const uG1 = u(t, M.seventy, 0.6) * ra(t, M.half + 1.4, 0.4);
      const uG2 = u(t, M.thirty, 0.6) * ra(t, M.half + 1.4, 0.4);
      const uG3 = u(t, M.half, 0.5) * ra(t, M.half + 1.5, 0.4);
      const fs = sz(rc, L.nhan * 0.95); const dong = fs * 1.55;
      const thanh = (doc ? 360 : 380) / rc.zoom;
      const veDong = (txt, g, i, uu, k) => {
        if (uu <= 0) return;
        ctx.save(); ctx.globalAlpha *= layEase("power3.out")(uu);
        veChu(rc, txt, nx, ny + i * dong * 1.6, { size: fs, align: "left" });
        const gv = khoang(t, k, k + 0.8, 0, g, "expo.out");
        ctx.fillStyle = rgba(K1.CANG, 0.9); ctx.fillRect(nx, ny + i * dong * 1.6 + fs * 0.45, thanh * (gv / 71.97), fs * 0.42);
        ctx.restore();
      };
      veDong("water, 25 °C: γ 71.97 mN/m", 71.97, 0, uG1, M.seventy);
      veDong("SDS alone, 25 °C: γ 36.43 mN/m", 36.43, 1, uG2, M.thirty);
      if (uG3 > 0) { ctx.save(); ctx.globalAlpha *= layEase("power3.out")(uG3); veChu(rc, "γ × 0.51 (about half)", nx, ny + 2 * dong * 1.6 + fs * 0.4, { size: fs, weight: 600, align: "left" }); ctx.restore(); }
      // h3 — bong bóng xà phòng mọc từ vũng nước SDS
      const r = bongR(t);
      if (r > 0.5) {
        veBong(rc, { x: L.ax, y: bongY(t), r, u: 1 });
        veNhan(rc, { x0: doc ? L.ax + w * 0.25 : L.ax - w * 0.3, y0: L.ban - h, x1: doc ? L.ax + w * 0.25 + 30 : L.ax - w * 0.3 - 60, y1: L.ban - h - (doc ? 80 : 90), text: "weaker skin", u: u(t, M.weaker, 0.6) * ra(t, doc ? M.how - 0.1 : tXuyen - 0.6, 0.4), size: sz(rc, L.nhan), align: doc ? "left" : "right" });
        veNhan(rc, { x0: L.ax + r * 0.7, y0: bongY(t) - r * 0.7, x1: L.ax + r * 0.7 + (doc ? 60 : 90), y1: bongY(t) - r * 0.7 - 50, text: "soap film", u: u(t, M.bubble + 0.3, 0.6) * ra(t, tXuyen - 0.6, 0.4), size: sz(rc, L.nhan) });
        const uQ = u(t, M.how, 0.6) * ra(t, tXuyen - 0.5, 0.3);
        if (uQ > 0) {
          const qy = doc ? L.ban - H386 - 60 : bongY(t) + r + sz(rc, 70);
          ctx.save(); ctx.globalAlpha *= layEase("power3.out")(uQ);
          const hp = veChu(rc, "less pull, longer-lived film?", L.ax, qy, { size: sz(rc, L.nhan * 1.15), weight: 600, align: "center" });
          ctx.restore();
          veDauChi(rc, { x: hp.x1 + sz(rc, 28), y: qy - sz(rc, 12), u: u(t, M.more, 0.4) * uQ, r: sz(rc, 13) });
        }
      }
    }
  }));

  // --- Bộ B: một nhiệt độ, SDS, khối lượng hoà tan (h4 a–c) ---
  const nhietB = (t) => (t < M.temperature + 0.1 ? 20 : khoang(t, M.temperature + 0.1, M.temperature + 1.6, 20, 25, "power2.inOut"));
  giua.them(new Nut({
    opacity: (t) => (t >= tXuyen ? 1 : 0),
    ve: (rc) => {
      const { t, ctx } = rc;
      // vỡ bóng: vòng màng nở ra và tan khi vào cảnh mới
      const uv = u(t, tXuyen, 0.7);
      if (uv < 1) veBong(rc, { x: rc.camX, y: rc.camY, r: (200 + uv * 900) / rc.zoom, u: 1 - uv });
      // nhiệt kế
      const yy = veNhietKe(rc, { x: xNk, y: L.ban - 30, h: doc ? 420 : 380, gia: nhietB(t), size: L.nhan * 0.9 });
      veNhan(rc, { x0: xNk + 6, y0: yy, x1: xNk + (doc ? 120 : 160), y1: yy - (doc ? 150 : 120), text: "one temperature: 25 °C", u: u(t, M.temperature, 0.7) * ra(t, M.surfactant - 0.3, 0.4), size: sz(rc, L.nhan), weight: 600 });
      // cốc SDS
      const coc = { x: xCoc, y: L.ban, w: doc ? 170 : 190, h: doc ? 230 : 240 };
      ctx.save();
      const g = ctx.createLinearGradient(0, coc.y - coc.h * 0.7, 0, coc.y);
      g.addColorStop(0, rgba(K1.NUOC, 0.42)); g.addColorStop(1, rgba(K1.NUOC, 0.7));
      ctx.fillStyle = g; ctx.fillRect(coc.x - coc.w / 2, coc.y - coc.h * 0.7, coc.w, coc.h * 0.7);
      ctx.strokeStyle = rgba(K1.MUC, 0.7); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(coc.x - coc.w / 2 - 10, coc.y - coc.h); ctx.lineTo(coc.x - coc.w / 2, coc.y - coc.h + 8); ctx.lineTo(coc.x - coc.w / 2, coc.y); ctx.lineTo(coc.x + coc.w / 2, coc.y); ctx.lineTo(coc.x + coc.w / 2, coc.y - coc.h); ctx.stroke();
      // phân tử SDS lơ lửng (đầu tròn + đuôi) chuyển động chậm
      for (let i = 0; i < 9; i++) {
        const px = coc.x - coc.w / 2 + 22 + ((i * 37) % (coc.w - 44)) + Math.sin(t * 0.9 + i) * 6;
        const py = coc.y - 20 - ((i * 53) % (coc.h * 0.6 - 30)) + Math.cos(t * 0.7 + i * 2) * 5;
        ctx.strokeStyle = rgba(K1.MUC, 0.7); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + 14 * Math.cos(t * 0.5 + i), py + 14 * Math.sin(t * 0.5 + i)); ctx.stroke();
        ctx.fillStyle = K1.CANG; ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
      veNhan(rc, { x0: coc.x - coc.w * 0.2, y0: coc.y - coc.h * 0.5, x1: doc ? coc.x : coc.x - coc.w * 0.2 - 60, y1: coc.y - coc.h - (doc ? 200 : 120), text: "soap here = SDS (lab surfactant)", u: u(t, M.surfactant, 0.7) * ra(t, M.seven - 0.4, 0.4), size: sz(rc, L.nhan), align: doc ? "center" : "right" });
      veNhan(rc, { x0: coc.x + coc.w * 0.25, y0: coc.y - coc.h * 0.3, x1: doc ? coc.x : coc.x + coc.w * 0.25 + 70, y1: coc.y - coc.h - (doc ? 95 : 40), text: "SDS 25.0 mM in water (inferred)", u: u(t, M.millimolar, 0.7) * ra(t, M.seven - 0.4, 0.4), size: sz(rc, L.nhan), align: doc ? "center" : "left" });
      // cân + bình 1 L: 25.0 mM × 288.38 g/mol = 7.21 g/L
      const g721 = khoang(t, M.seven - 0.2, M.grams + 0.4, 0, 7.21, "power2.out");
      ctx.save(); ctx.fillStyle = rgba(K1.MUC, 0.18);
      const doi = Math.sqrt(g721 / 7.21);
      ctx.beginPath(); ctx.ellipse(xCan - (doc ? 140 : 0), L.ban - 74, 60 * doi + 1, 26 * doi + 1, 0, Math.PI, 0); ctx.fill(); ctx.restore();
      veCan(rc, { x: xCan - (doc ? 140 : 0), y: L.ban, doc: so(g721) + " g", size: L.so * 0.85 });
      veBinh(rc, { x: xCan + (doc ? 170 : 300), y: L.ban, h: doc ? 260 : 300, muc: 0.85 });
      veChu(rc, "1 L", xCan + (doc ? 170 : 300), L.ban - (doc ? 140 : 160), { size: sz(rc, L.nhan * 0.85), align: "center" });
      const uE = u(t, M.litre, 0.6);
      if (uE > 0) { ctx.save(); ctx.globalAlpha *= layEase("power3.out")(uE); veChu(rc, "= 7.21 g/L (calculated)", xCan + (doc ? 30 : 150), L.ban - (doc ? 400 : 470), { size: sz(rc, L.nhan * 1.1), weight: 600, align: "center" }); ctx.restore(); }
      if (t > M.celsius - 0.3) {
        ctx.save(); ctx.globalAlpha *= layEase("power3.out")(u(t, M.celsius - 0.2, 0.5));
        const xm = xCan + (doc ? 390 : 470);
        veNhietKe(rc, { x: xm, y: L.ban - 20, h: 200, gia: 25, size: L.nhan * 0.7 });
        veChu(rc, "25 °C", xm, L.ban - 250, { size: sz(rc, L.nhan * 0.9), weight: 600, align: "center" });
        ctx.restore();
      }
      // --- Bộ C: nước 20 °C và 25 °C cạnh nhau: 5.45 → 5.43 mm ---
      const wc = doc ? 250 : 420;
      const cap = [[xC - (doc ? 205 : 300), 5.45, "20 °C"], [xC + (doc ? 175 : 300), 5.43, "25 °C"]];
      cap.forEach(([cx, mm, nhan], i) => {
        const hh = hmm(mm);
        veVung(rc, { cx, y: L.ban, w: wc, h: hh });
        veChu(rc, nhan, cx, L.ban + (doc ? 55 : 60), { size: sz(rc, L.nhan), weight: 600, align: "center" });
        const uk = u(t, M.warming + 0.3 + i * 0.5, 0.5);
        veThuocKep(rc, { x: cx + wc / 2 + 36, y: L.ban, h: hh, cao: hmm(7.5), u: uk, phai: true });
        if (uk > 0) veChu(rc, so(khoang(t, M.warming + 0.3 + i * 0.5, M.warming + 1.1 + i * 0.5, 0, mm, "expo.out")) + " mm", cx + wc / 2 + 36, L.ban - hmm(7.5) - 18, { size: sz(rc, L.so * 0.9), weight: 600, align: "center" });
      });
      const uW = u(t, M.warming + 0.2, 0.6);
      if (uW > 0) { ctx.save(); ctx.globalAlpha *= layEase("power3.out")(uW); veChu(rc, "water: 5.45 → 5.43 mm (20 → 25 °C)", xC, L.ban - (doc ? 450 : 400), { size: sz(rc, L.nhan), align: "center" }); ctx.restore(); }
      const uB = u(t, M.barely, 0.5);
      if (uB > 0) {
        ctx.save(); ctx.globalAlpha *= layEase("back.out(1.4)")(uB);
        veChu(rc, "barely changes", xC, L.ban - (doc ? 380 : 335), { size: sz(rc, L.nhan * 1.2), weight: 700, align: "center" });
        ctx.restore();
      }
      // --- Bộ D (c1): cùng một bàn, 25 °C: nước 5.43 mm, SDS 3.86 mm ---
      const dW = doc ? 340 : 440;
      const dd = [[xD - (doc ? 240 : 320), 5.43, "water: 5.43 mm", M.plain], [xD + (doc ? 240 : 320), 3.86, "SDS 25.0 mM (inferred): 3.86 mm", THOI_LUONG + 5]];
      dd.forEach(([cx, mm, nhan, k], i) => {
        const hh = hmm(mm); const ww = i === 1 ? (dW * 5.43) / 3.86 * 0.8 : dW;
        veVung(rc, { cx, y: L.ban, w: ww, h: hh });
        const uk = u(t, k, 0.5);
        veThuocKep(rc, { x: cx - ww / 2 - 34, y: L.ban, h: hh, cao: hmm(7.5), u: uk, phai: false });
        if (uk > 0) veChu(rc, nhan, cx, L.ban - hmm(7.5) - 20, { size: sz(rc, L.nhan), weight: 600, align: "center" });
      });
      const uBench = u(t, M.bench, 0.6);
      if (uBench > 0) { ctx.save(); ctx.globalAlpha *= layEase("power3.out")(uBench); veChu(rc, "both at 25 °C", xD, L.ban - (doc ? 420 : 380), { size: sz(rc, L.nhan * 1.15), weight: 600, align: "center" }); ctx.restore(); }
    }
  }));

  // ===== Lớp trước: hạt sáng mờ ở gần ống kính (parallax cao) tạo chiều sâu =====
  const buiTruoc = taoBui(22, -400, OX + 7800, L.ban - 900, L.ban + 300, 29);
  const lopTruoc = new Nut({
    ve: (rc) => {
      const { ctx, t } = rc;
      for (const b of buiTruoc) {
        ctx.fillStyle = rgba(K1.NEN_TREN, 0.10);
        ctx.beginPath(); ctx.arc(b.x + Math.sin(t * 0.13 + b.p) * 30, b.y + Math.cos(t * 0.11 + b.p) * 20, b.r * 9, 0, Math.PI * 2); ctx.fill();
      }
    }
  });

  // ===== Lớp màn hình: dòng nguồn, phụ đề, viền nhận diện, vùng PiP =====
  const cum = chiaCum(tuTrongBai, { toiDa: doc ? 3 : 4 });
  const beatTai = (t) => [...LOI].reverse().find((b) => t >= b.bd) || LOI[0];
  const man = new Nut({
    ve: (rc) => {
      const { t } = rc;
      const b = beatTai(t);
      const vao = u(t, b.bd + 0.2, 0.5);
      const sau = LOI[LOI.indexOf(b) + 1];
      const roi = sau ? ra(t, sau.bd, 0.3) : 1;
      const nhan = b.id === "h4" && t > M.inferred - 0.1 ? 0 : -1;
      veNguon(rc, NGUON[b.id], { x: F.nguon.x, y: F.nguon.y, size: F.nguon.size, maxW: F.nguon.maxW, u: vao * roi, nhan });
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

  return {
    F, tl, canh, cum, tu: tuTrongBai, THOI_LUONG, FPS, mocGiong: Boolean(mocTu),
    phuDe: {
      ...F.phuDe, mau: K1.MUC, nenHop: K1.NEN_TREN,
      gachChan: (w) => (CANG.test(w) ? K1.CANG : NUOC.test(w) ? K1.NUOC : null)
    },
    hauKy: (rc) => { veVien(rc); veVungPip(rc, F.pip); }
  };
}
