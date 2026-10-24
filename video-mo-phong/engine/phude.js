// Phụ đề động: chữ hiện theo cụm 2–5 từ khớp mốc giọng; từ khoá có gạch chân màu đại lượng
// (chữ giữ màu mực để tương phản ≥ 4,5:1 trên nền kênh).
import { layEase, kep } from "./easing.js";
import { veChu, doChu } from "./canh.js";

const DAU_NGAT = /[.,!?;:…]$/;

// words: [{text, start, end}] (giây). Trả về các cụm {tu: [...], bd, kt}
export function chiaCum(words, { toiDa = 4, khoangLang = 0.15 } = {}) {
  const cum = [];
  let hien = [];
  words.forEach((w, i) => {
    hien.push(w);
    const tiep = words[i + 1];
    const ngat = DAU_NGAT.test(w.text) || !tiep || (tiep.start - w.end) >= khoangLang || hien.length >= toiDa;
    if (ngat) { cum.push(hien); hien = []; }
  });
  return cum.map((tu, i) => {
    const bd = Math.max(0.12, tu[0].start - 0.06);
    const sau = cum[i + 1];
    let kt = tu[tu.length - 1].end + 0.2;
    if (sau) kt = Math.min(kt, Math.max(0.12, sau[0].start - 0.06));
    return { tu, bd, kt };
  });
}

// Vẽ phụ đề tại t trong hệ toạ độ màn hình.
// o: {cx, cy, maxW, size, mau, nenHop, gachChan: (tu) => màu | null}
export function vePhuDe(rc, cum, t, o) {
  const c = cum.find((g) => t >= g.bd && t < g.kt);
  if (!c) return;
  const { ctx } = rc;
  let size = o.size;
  const cach = () => size * 0.28;
  const rong = () => c.tu.reduce((a, w) => a + doChu(rc, w.text, size, 600), 0) + cach() * (c.tu.length - 1);
  while (rong() > o.maxW && size > o.size * 0.6) size -= 1;
  const tong = rong();
  const vao = layEase("power3.out"); const nay = layEase("back.out(1.6)");
  const ra = kep((c.kt - t) / 0.12);
  ctx.save();
  ctx.globalAlpha *= ra;
  // hộp nền vuông góc (khuôn K1 cấm chip bo tròn), màu nền kênh, mờ như ASS alpha 0x40 của Studio;
  // hộp nở theo các từ đã nói (không để hộp rỗng)
  let daNoi = 0; let xx = 0;
  c.tu.forEach((w, i) => {
    const rw = doChu(rc, w.text, size, 600);
    const k = vao(kep((t - w.start + 0.04) / 0.22));
    if (k > 0) daNoi = xx + rw * k;
    xx += rw + cach();
  });
  const pad = size * 0.32;
  ctx.fillStyle = o.nenHop;
  ctx.globalAlpha *= 0.82;
  if (daNoi > 0) ctx.fillRect(o.cx - tong / 2 - pad, o.cy - size * 0.78, daNoi + pad * 2, size * 1.5);
  ctx.globalAlpha /= 0.82;
  let x = o.cx - tong / 2;
  for (const w of c.tu) {
    const rw = doChu(rc, w.text, size, 600);
    const u = kep((t - w.start + 0.04) / 0.22);
    if (u > 0) {
      ctx.save();
      const s = 0.86 + 0.14 * nay(u);
      ctx.translate(x + rw / 2, o.cy + (1 - vao(u)) * size * 0.25);
      ctx.scale(s, s);
      ctx.globalAlpha *= vao(u);
      veChu(rc, w.text, 0, 0, { size, weight: 600, color: o.mau, align: "center", baseline: "middle" });
      const mg = o.gachChan && o.gachChan(w.text);
      if (mg) {
        ctx.fillStyle = mg;
        ctx.fillRect(-rw / 2, size * 0.42, rw * vao(kep(u * 1.4)), Math.max(3, size * 0.09));
      }
      ctx.restore();
    }
    x += rw + cach();
  }
  ctx.restore();
}

// Ước lượng mốc từng từ khi chưa có tệp giọng: phân bổ thời lượng theo số âm tiết ước tính + nghỉ ở dấu câu
export function uocLuongMoc(text, bd, dai) {
  const tu = text.split(/\s+/).filter(Boolean);
  const nang = tu.map((w) => Math.max(1, (w.replace(/[^a-zA-Z0-9]/g, "").match(/[aeiouy]+/gi) || []).length) + (DAU_NGAT.test(w) ? 0.8 : 0));
  const tong = nang.reduce((a, b) => a + b, 0);
  let t = bd;
  return tu.map((w, i) => {
    const d = (nang[i] / tong) * dai;
    const lamTron = (DAU_NGAT.test(w) ? d * 0.75 : d * 0.95);
    const r = { text: w, start: t, end: t + lamTron };
    t += d;
    return r;
  });
}
