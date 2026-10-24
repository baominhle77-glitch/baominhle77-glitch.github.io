// Đo nhịp đổi hình nhanh (cùng định nghĩa barem: 4 fps, > 12/255 trên > 6 % diện tích) bằng render trực tiếp, không cần xuất video.
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import http from "node:http"; import fs from "node:fs"; import path from "node:path";
const root = "/home/user/baominhle77-glitch.github.io/video-mo-phong";
const types = { ".js": "text/javascript", ".html": "text/html", ".woff2": "font/woff2", ".json": "application/json", ".mp3": "audio/mpeg" };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split("?")[0])); try { const b = fs.readFileSync(f); r.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" }); r.end(b); } catch { r.writeHead(404); r.end(); } }).listen(8794);
const b = await chromium.launch(); const p = await b.newPage();
p.on("console", m => { if (m.type() === "error") console.log("console:", m.text()); });
await p.goto("http://localhost:8794/xuong.html");
await p.waitForFunction(() => window.XUONG, null, { timeout: 20000 });
const khos = (process.argv[2] || "16x9,9x16").split(",");
const res = await p.evaluate(async (khos) => {
  await window.XUONG.taiPhong();
  const out = {};
  for (const kho of khos) {
    const bai = window.XUONG.taoBai(kho); const ve = window.XUONG.taoTrinhVe(bai);
    const c = new OffscreenCanvas(bai.F.W, bai.F.H); const ctx = c.getContext("2d");
    const [w, h] = kho === "16x9" ? [480, 270] : [270, 480];
    const s = new OffscreenCanvas(w, h); const sx = s.getContext("2d", { willReadFrequently: true });
    let truoc = null; const ti = [];
    for (let i = 0; i <= Math.floor(bai.THOI_LUONG * 4); i++) {
      ve(ctx, i / 4);
      sx.drawImage(c, 0, 0, w, h);
      const d = sx.getImageData(0, 0, w, h).data;
      const g = new Uint8Array(w * h);
      for (let k = 0; k < w * h; k++) g[k] = Math.round(0.299 * d[k * 4] + 0.587 * d[k * 4 + 1] + 0.114 * d[k * 4 + 2]);
      if (truoc) { let n = 0; for (let k = 0; k < g.length; k++) if (Math.abs(g[k] - truoc[k]) > 12) n++; ti.push([i / 4, n / g.length]); }
      truoc = g;
    }
    out[kho] = { ti, dai: bai.THOI_LUONG };
  }
  return out;
}, khos);
for (const k of Object.keys(res)) {
  const { ti, dai } = res[k];
  const sk = ti.filter(([, v]) => v > 0.06).map(([t]) => t);
  const moc = [0, ...sk, dai];
  let lon = 0, at = 0;
  for (let i = 1; i < moc.length; i++) if (moc[i] - moc[i - 1] > lon) { lon = moc[i] - moc[i - 1]; at = moc[i - 1]; }
  const gaps = []; for (let i = 1; i < moc.length; i++) if (moc[i] - moc[i - 1] > 3.0) gaps.push(`${moc[i - 1]}→${moc[i]}`);
  console.log(`== ${k}: ${sk.length} mẫu > 6 %, khoảng tĩnh dài nhất ${lon.toFixed(2)} s từ ${at}; khoảng > 3 s: ${gaps.join(" ") || "không"}`);
  if (process.argv[3] === "v") console.log(ti.map(([t, v]) => `${t}:${(v * 100).toFixed(1)}`).join(" "));
}
fs.writeFileSync(process.argv[4] || "nhip.json", JSON.stringify(res));
await b.close(); srv.close();
