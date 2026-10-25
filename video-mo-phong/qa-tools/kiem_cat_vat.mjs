// Kiểm C13 mục 1–2: mỗi 0,1 s, vật nào bị mép khung (trong viền 28 px) hoặc vùng PiP cắt khi vật KHÔNG đang trượt
import { createRequire } from 'module'; const { chromium } = createRequire(import.meta.url)('playwright');
const b = await chromium.launch(); const p = await b.newPage();
p.on('pageerror', (e) => console.log('pageerror:', e.message));
await p.goto('http://127.0.0.1:8765/video-mo-phong/xuong.html'); await p.waitForFunction(() => window.XUONG);
for (const kho of process.argv.slice(2).length ? process.argv.slice(2) : ['16x9', '9x16']) {
  const r = await p.evaluate((kho) => {
    const a = window.XUONG.taoBai(kho); const { W, H, pip } = a.F; const V = 28;
    const camAt = (t) => [a.cam.x(t), a.cam.y(t), a.cam.zoom(t)];
    const man = (b, t) => { const [cx, cy, z] = camAt(t); return [W / 2 + (b[0] - cx) * z, H / 2 + (b[1] - cy) * z, W / 2 + (b[2] - cx) * z, H / 2 + (b[3] - cy) * z]; };
    const giao = (s, r) => s[0] < r[2] && s[2] > r[0] && s[1] < r[3] && s[3] > r[1];
    const loi = []; const lon = [];
    for (let i = 0; i <= a.THOI_LUONG * 10; i++) {
      const t = i / 10;
      if (a.M && a.LOI && a.LOI[3] && t > a.M.more + 0.1 && t < a.LOI[3].bd + 0.7) continue; // zoom xuyên màng bóng (chuyển cảnh)
      for (const v of a.VAT) {
        const bx = v.hop(t); if (!bx) continue;
        const s = man(bx, t);
        if (!giao(s, [0, 0, W, H])) continue;
        const ngoai = s[0] < V || s[1] < V || s[2] > W - V || s[3] > H - V;
        const vaoPip = giao(s, pip);
        if (!ngoai && !vaoPip) continue;
        const b0 = v.hop(Math.max(0, t - 0.1)), b1 = v.hop(t + 0.1);
        let dich = 0;
        if (b0 && b1) { const s0 = man(b0, t - 0.1), s1 = man(b1, t + 0.1); dich = Math.max(...s0.map((q, k) => Math.abs(s1[k] - q))) / 0.2; } else dich = 1e9;
        if (dich > 120) continue; // đang trượt vào/ra (≥ 120 px/s)
        loi.push(`${t.toFixed(1)} ${v.ten} ${ngoai ? 'MEP' : ''}${vaoPip ? 'PIP' : ''} [${s.map((q) => Math.round(q)).join(',')}] v=${Math.round(dich)}`);
      }
    }
    // cỡ vật chính: tỉ lệ diện tích hộp các vật trong khung so với vùng vật
    return loi;
  }, kho);
  console.log(`== ${kho}: ${r.length} lỗi`); console.log(r.slice(0, 80).join('\n'));
}
await b.close();
