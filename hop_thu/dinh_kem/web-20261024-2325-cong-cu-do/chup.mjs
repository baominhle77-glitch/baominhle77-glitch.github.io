import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import http from "node:http"; import fs from "node:fs"; import path from "node:path";
const root = "/home/user/baominhle77-glitch.github.io/video-mo-phong";
const types = { ".js": "text/javascript", ".css": "text/css", ".html": "text/html", ".woff2": "font/woff2", ".json": "application/json" };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split("?")[0]) === "/" ? "xuong.html" : decodeURIComponent(q.url.split("?")[0])); try { const b = fs.readFileSync(f); r.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" }); r.end(b); } catch { r.writeHead(404); r.end(); } }).listen(8791);
const out = process.argv[2]; const kho = process.argv[3]; const times = process.argv.slice(4).map(Number);
const b = await chromium.launch(); const p = await b.newPage();
const errs = []; p.on("pageerror", e => errs.push("pageerror " + e.message)); p.on("console", m => m.type() === "error" && errs.push(m.text()));
await p.goto("http://localhost:8791/xuong.html");
await p.waitForFunction(() => window.XUONG && document.fonts.status === "loaded", null, { timeout: 20000 });
await p.evaluate(() => window.XUONG.taiPhong());
for (const t of times) {
  const r = await p.evaluate(async ({ kho, t }) => { const k = await window.XUONG.chupKhung(kho, t); return { jpg: Array.from(k.jpg), chu: k.chu }; }, { kho, t });
  fs.writeFileSync(`${out}/${kho}_t${t.toFixed(1)}.jpg`, Buffer.from(r.jpg));
}
console.log("errors", errs);
await b.close(); srv.close();
