import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import http from "node:http"; import fs from "node:fs"; import path from "node:path";
const root = "/home/user/baominhle77-glitch.github.io/video-mo-phong";
const types = { ".js": "text/javascript", ".html": "text/html", ".woff2": "font/woff2", ".json": "application/json", ".mp3": "audio/mpeg" };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split("?")[0])); try { const b = fs.readFileSync(f); r.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" }); r.end(b); } catch { r.writeHead(404); r.end(); } }).listen(8794);
const b = await chromium.launch(); const p = await b.newPage();
await p.goto("http://localhost:8794/xuong.html"); await p.waitForFunction(() => window.XUONG);
const r = await p.evaluate(() => { const out = {}; for (const k of ["16x9", "9x16"]) { const b = window.XUONG.taoBai(k); out[k] = { LOI: b.LOI.map((x) => ({ id: x.id, bd: x.bd, dai: x.dai })), THOI_LUONG: b.THOI_LUONG, chuyenCanh: b.chuyenCanh, M: b.M, VUNG: b.VUNG, cum: b.cum.map((c) => ({ bd: +c.bd.toFixed(2), kt: +c.kt.toFixed(2), chu: c.tu.map((w) => w.text).join(" ") })) }; } return out; });
fs.writeFileSync(process.argv[2], JSON.stringify(r, null, 1)); await b.close(); srv.close();
