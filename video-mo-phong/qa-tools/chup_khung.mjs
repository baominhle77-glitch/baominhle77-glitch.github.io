// node chup.mjs <outdir> <kho> <fps> [t0] [t1]  — chụp khung qua XUONG.chupKhung (cùng hàm vẽ với xuất)
import { createRequire } from 'module'; const { chromium } = createRequire(import.meta.url)('playwright');
import fs from 'fs';
const [out, kho, fps, t0 = '0', t1 = '72'] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage();
p.on('console', (m) => { if (m.type() === 'error') console.log('console:', m.text()); });
p.on('pageerror', (e) => console.log('pageerror:', e.message));
await p.goto('http://127.0.0.1:8765/video-mo-phong/xuong.html');
await p.waitForFunction(() => window.XUONG);
await p.evaluate(() => window.XUONG.taiPhong());
const ts = [];
for (let t = +t0; t <= +t1 + 1e-6; t += 1 / +fps) ts.push(+t.toFixed(3));
const chu = {};
for (let i = 0; i < ts.length; i += 8) {
  const part = await p.evaluate(async ({ kho, ts }) => {
    const r = [];
    for (const t of ts) { const k = await window.XUONG.chupKhung(kho, t, null); r.push([t, Array.from(k.jpg), k.chu]); }
    return r;
  }, { kho, ts: ts.slice(i, i + 8) });
  for (const [t, jpg, c] of part) { fs.writeFileSync(`${out}/t_${t.toFixed(2).padStart(6, '0')}.jpg`, Buffer.from(jpg)); chu[t] = c; }
}
fs.writeFileSync(`${out}/chu.json`, JSON.stringify(chu));
await b.close();
