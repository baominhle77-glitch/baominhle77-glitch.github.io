import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import http from "node:http"; import fs from "node:fs"; import path from "node:path";
const root = "/home/user/baominhle77-glitch.github.io/video-mo-phong";
const types = { ".js": "text/javascript", ".html": "text/html", ".woff2": "font/woff2", ".json": "application/json", ".mp3": "audio/mpeg" };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split("?")[0])); try { const b = fs.readFileSync(f); r.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" }); r.end(b); } catch { r.writeHead(404); r.end(); } }).listen(8792);
const b = await chromium.launch(); const p = await b.newPage();
await p.goto("http://localhost:8792/xuong.html");
await p.waitForFunction(() => window.XUONG, null, { timeout: 20000 });
const res = await p.evaluate(async (buoc) => {
  await window.XUONG.taiPhong();
  const out = {};
  for (const kho of ["16x9", "9x16"]) {
    const bai = window.XUONG.taoBai(kho); const ve = window.XUONG.taoTrinhVe(bai);
    const c = new OffscreenCanvas(bai.F.W, bai.F.H); const ctx = c.getContext("2d");
    const [ax0, ay0, ax1, ay1] = bai.F.an; const [px0, py0, px1, py1] = bai.F.pip;
    const loi = [];
    for (let t = 0; t <= bai.THOI_LUONG - 0.01; t += buoc) {
      const rc = ve(ctx, t);
      const ds = rc.khungChu.filter((h) => h.alpha > 0.2 && h.x1 > 0 && h.x0 < bai.F.W && h.y1 > 0 && h.y0 < bai.F.H);
      for (const h of ds) {
        if (h.x0 < ax0 - 1 || h.x1 > ax1 + 1 || h.y0 < ay0 - 1 || h.y1 > ay1 + 1) loi.push([+t.toFixed(2), "tran_an_toan", h.text, [h.x0, h.y0, h.x1, h.y1].map(Math.round)]);
        if (h.x1 > px0 && h.x0 < px1 && h.y1 > py0 && h.y0 < py1) loi.push([+t.toFixed(2), "vao_PiP", h.text, [h.x0, h.y0, h.x1, h.y1].map(Math.round)]);
      }
      for (let i = 0; i < ds.length; i++) for (let j = i + 1; j < ds.length; j++) {
        const a = ds[i], d = ds[j];
        const ox = Math.min(a.x1, d.x1) - Math.max(a.x0, d.x0), oy = Math.min(a.y1, d.y1) - Math.max(a.y0, d.y0);
        if (ox > 3 && oy > 3 && a.text !== d.text) loi.push([+t.toFixed(2), "chong_chu", a.text + " | " + d.text]);
      }
    }
    out[kho] = loi;
  }
  return out;
}, Number(process.argv[2] || 0.25));
for (const k of Object.keys(res)) {
  const g = new Map();
  for (const [t, loai, txt] of res[k]) { const key = loai + " :: " + txt; if (!g.has(key)) g.set(key, []); g.get(key).push(t); }
  console.log(`== ${k}: ${res[k].length} lỗi khung`);
  for (const [key, ts] of g) console.log(`  ${key}  @ ${ts[0]}–${ts[ts.length - 1]} (${ts.length})`);
}
fs.writeFileSync(process.argv[3] || "lint.json", JSON.stringify(res));
await b.close(); srv.close();
