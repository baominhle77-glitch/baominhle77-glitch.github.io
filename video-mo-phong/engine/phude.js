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
  // cụm tối thiểu 2 từ (barem D1: 2–5 từ): cụm 1 từ nhập vào cụm liền trước, hoặc cụm sau nếu là cụm đầu
  for (let i = 0; i < cum.length; i++) {
    if (cum[i].length >= 2 || cum.length < 2) continue;
    if (i > 0 && cum[i - 1].length < 5) { cum[i - 1].push(...cum[i]); cum.splice(i, 1); i--; }
    else if (i + 1 < cum.length && cum[i + 1].length < 5) { cum[i + 1].unshift(...cum[i]); cum.splice(i, 1); i--; }
  }
  return cum.map((tu, i) => {
    const bd = Math.max(0.12, tu[0].start - 0.06);
    const sau = cum[i + 1];
    let kt = tu[tu.length - 1].end + 0.2;
    if (sau) kt = Math.min(kt, Math.max(0.12, sau[0].start - 0.06));
    return { tu, bd, kt };
  });
}

// Vẽ phụ đề tại t trong hệ toạ độ màn hình.
// o: {cx, cy, maxW, size, mau, nenHop, quang, gachChan: (tu) => màu | null, vienGach}
// C13 mục 7: cả cụm (2–5 từ) hiện cùng lúc — không khung nào chỉ có một chữ trơ; từ đang được đọc nảy nhẹ,
// từ khoá được gạch chân màu đại lượng đúng lúc vang lên. Hộp đặc + quầng sáng, không mờ dần (tương phản giữ ≥ 4,5:1 ở mọi khung).
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
  const uCum = vao(kep((t - c.bd) / 0.16)); // hộp nở ngang 88 % → 100 % (không đổi độ mờ)
  const pad = size * 0.32;
  const hw = (tong / 2 + pad) * (0.88 + 0.12 * uCum);
  const y0 = o.cy - size * 0.78; const hh = size * 1.5;
  ctx.save();
  if (o.quang) { // quầng sáng: nền ngay quanh hộp luôn sáng → hộp mực luôn ≥ 4,5:1 so với nền quanh nó
    const q = o.doQuang || 12;
    ctx.fillStyle = o.quang; ctx.fillRect(o.cx - hw - q, y0 - q, 2 * (hw + q), hh + 2 * q);
  }
  ctx.fillStyle = o.nenHop; ctx.fillRect(o.cx - hw, y0, 2 * hw, hh);
  ctx.beginPath(); ctx.rect(o.cx - hw, y0, 2 * hw, hh); ctx.clip();
  let x = o.cx - tong / 2;
  for (const w of c.tu) {
    const rw = doChu(rc, w.text, size, 600);
    const u = kep((t - w.start + 0.04) / 0.22);
    ctx.save();
    const s = u > 0 && u < 1 ? 1 + 0.08 * Math.sin(Math.PI * nay(u)) : 1;
    ctx.translate(x + rw / 2, o.cy + (1 - uCum) * size * 0.3);
    ctx.scale(s, s);
    veChu(rc, w.text, 0, 0, { size, weight: 600, color: o.mau, align: "center", baseline: "middle" });
    const mg = u > 0 && o.gachChan && o.gachChan(w.text);
    if (mg) {
      const gw = rw * vao(kep(u * 1.4)); const gy = size * 0.42; const gh = Math.max(3, size * 0.09);
      if (o.vienGach) { const v = 2; ctx.fillStyle = o.vienGach; ctx.fillRect(-rw / 2 - v, gy - v, gw + 2 * v, gh + 2 * v); }
      ctx.fillStyle = mg; ctx.fillRect(-rw / 2, gy, gw, gh);
    }
    ctx.restore();
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
