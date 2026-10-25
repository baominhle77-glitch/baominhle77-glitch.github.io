// CI phòng SX: chụp khung 540p hoặc render đủ tập 1080p có giọng — cùng hàm vẽ với xuất (XUONG.taoTrinhVe).
// node ci_render.mjs khung <thu_muc> <16x9|9x16> [buoc_giay=2]
// node ci_render.mjs video <ra.mp4> <16x9|9x16> [giong.mp3]
// Playwright lấy từ PW_MODULE (mặc định "playwright"); cần ffmpeg cho chế độ video.
import http from "node:http"; import fs from "node:fs"; import path from "node:path";
import { spawn } from "node:child_process"; import { fileURLToPath } from "node:url";
const { chromium } = await import(process.env.PW_MODULE || "playwright");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const types = { ".js": "text/javascript", ".html": "text/html", ".css": "text/css", ".woff2": "font/woff2", ".json": "application/json", ".mp3": "audio/mpeg" };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split("?")[0])); try { const b = fs.readFileSync(f); r.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" }); r.end(b); } catch { r.writeHead(404); r.end(); } }).listen(8797);
const [cheDo, ra, kho, thamSo] = process.argv.slice(2);
if (!["khung", "video"].includes(cheDo) || !ra || !["16x9", "9x16"].includes(kho)) { console.log("Dùng: khung <thu_muc> <kho> [buoc] | video <ra.mp4> <kho> [giong.mp3]"); process.exit(2); }

const b = await chromium.launch(); const p = await b.newPage();
const loiTrang = []; p.on("pageerror", (e) => loiTrang.push(e.message));
await p.goto("http://localhost:8797/xuong.html");
await p.waitForFunction(() => window.XUONG, null, { timeout: 30000 });
const info = await p.evaluate(async (kho) => {
  await window.XUONG.taiPhong();
  const bai = window.XUONG.taoBai(kho, null);
  const ve = window.XUONG.taoTrinhVe(bai); const F = bai.F;
  const c = new OffscreenCanvas(F.W, F.H); const ctx = c.getContext("2d", { alpha: false });
  window.__chup = async (ts, w, h, q) => {
    const out = [];
    for (const t of ts) {
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = "#000"; ctx.fillRect(0, 0, F.W, F.H);
      ve(ctx, t); let src = c;
      if (w !== F.W) { src = new OffscreenCanvas(w, h); src.getContext("2d").drawImage(c, 0, 0, w, h); }
      const u = new Uint8Array(await (await src.convertToBlob({ type: "image/jpeg", quality: q })).arrayBuffer());
      let s = ""; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
      out.push(btoa(s));
    }
    return out;
  };
  return { W: F.W, H: F.H, fps: bai.FPS || 30, tl: bai.THOI_LUONG };
}, kho);
console.log(`bài ${kho}: ${info.W}×${info.H}, ${info.fps} fps, ${info.tl.toFixed(2)} s`);

if (cheDo === "khung") {
  const buoc = +(thamSo || 2); const [w, h] = kho === "16x9" ? [960, 540] : [540, 960];
  fs.mkdirSync(ra, { recursive: true });
  const ts = []; for (let t = 0; t <= info.tl + 1e-6; t += buoc) ts.push(+t.toFixed(3));
  for (let i = 0; i < ts.length; i += 10) {
    const part = await p.evaluate(({ ts, w, h }) => window.__chup(ts, w, h, 0.88), { ts: ts.slice(i, i + 10), w, h });
    part.forEach((s, k) => fs.writeFileSync(path.join(ra, `t_${ts[i + k].toFixed(1).padStart(6, "0")}.jpg`), Buffer.from(s, "base64")));
  }
  fs.writeFileSync(path.join(ra, "thong_tin.json"), JSON.stringify({ ...info, buoc, so_khung: ts.length }));
  console.log(`đã chụp ${ts.length} khung ${w}×${h} vào ${ra}`);
} else {
  const giong = thamSo && fs.existsSync(thamSo) ? thamSo : null;
  const n = Math.round(info.tl * info.fps);
  const args = ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(info.fps), "-c:v", "mjpeg", "-i", "-"];
  if (giong) args.push("-i", giong, "-map", "0:v", "-map", "1:a", "-c:a", "aac", "-b:a", "160k");
  args.push("-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", "-movflags", "+faststart", ra);
  const ff = spawn("ffmpeg", args, { stdio: ["pipe", "inherit", "inherit"] });
  const xong = new Promise((ok) => ff.on("close", ok));
  let moc = 0;
  for (let i = 0; i < n; i += 30) {
    const ts = []; for (let k = i; k < Math.min(n, i + 30); k++) ts.push(k / info.fps);
    const part = await p.evaluate(({ ts, w, h }) => window.__chup(ts, w, h, 0.95), { ts, w: info.W, h: info.H });
    for (const s of part) if (!ff.stdin.write(Buffer.from(s, "base64"))) await new Promise((ok) => ff.stdin.once("drain", ok));
    if ((i / n) * 10 >= moc) { console.log(`… ${Math.round((i / n) * 100)} %`); moc++; }
  }
  ff.stdin.end();
  const ma = await xong;
  console.log(`ffmpeg thoát ${ma}; ${n} khung; giọng: ${giong || "KHÔNG CÓ"}`);
  if (ma !== 0) process.exitCode = 1;
}
if (loiTrang.length) { console.log("LỖI TRANG:", loiTrang.slice(0, 5)); process.exitCode = 1; }
await b.close(); srv.close();
