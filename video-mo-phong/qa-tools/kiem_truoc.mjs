// KIỂM TIỀN KỲ — chạy MỘT lượt trước khi xuất video: kiểm "bản hướng dẫn vẽ" theo C13 bằng máy, in giây nào lỗi gì.
// Chỉ khi mọi mục máy kiểm được đều ĐẠT mới xuất video + dựng qa/ (đỡ vẽ đi vẽ lại, đỡ tốn limit).
// Dùng: node kiem_truoc.mjs [16x9,9x16] [ra.json]
// Kiểm: (3) nhịp đổi hình 4 fps > 6 % · (2) vật bị mép khung cắt khi máy đứng · chữ tràn vùng an toàn / vào PiP / chồng chữ
//       · (7) cụm phụ đề 2–5 từ · (8) chữ nguồn ≥ 22 px · hộp phụ đề so với nền quanh ≥ 4,5:1 · (1) vật chính đủ to
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import http from "node:http"; import fs from "node:fs"; import path from "node:path";
const root = "/home/user/baominhle77-glitch.github.io/video-mo-phong";
const types = { ".js": "text/javascript", ".html": "text/html", ".css": "text/css", ".woff2": "font/woff2", ".json": "application/json", ".mp3": "audio/mpeg" };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split("?")[0])); try { const b = fs.readFileSync(f); r.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" }); r.end(b); } catch { r.writeHead(404); r.end(); } }).listen(8796);
const b = await chromium.launch(); const p = await b.newPage();
const loiTrang = []; p.on("pageerror", (e) => loiTrang.push(e.message));
await p.goto("http://localhost:8796/xuong.html");
await p.waitForFunction(() => window.XUONG, null, { timeout: 20000 });
const khos = (process.argv[2] || "16x9,9x16").split(",");
const kq = await p.evaluate(async (khos) => {
  await window.XUONG.taiPhong();
  const Lum = (r, g, b) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const out = {};
  for (const kho of khos) {
    const bai = window.XUONG.taoBai(kho); const ve = window.XUONG.taoTrinhVe(bai);
    const F = bai.F; const W = F.W; const H = F.H;
    const c = new OffscreenCanvas(W, H); const ctx = c.getContext("2d", { willReadFrequently: true });
    const [w4, h4] = kho === "16x9" ? [480, 270] : [270, 480];
    const s = new OffscreenCanvas(w4, h4); const sx = s.getContext("2d", { willReadFrequently: true });
    const [a0, b0, a1, b1] = F.an; const [p0, q0, p1, q1] = F.pip;
    const R = { nhip: [], catMep: [], chu: [], tuongPhan: [], vatNho: [] };
    let truoc = null; let camTruoc = null;
    const buoc = 0.25;
    for (let i = 0; i <= Math.round(bai.THOI_LUONG / buoc); i++) {
      const t = i * buoc;
      const rc = ve(ctx, t);
      // (3) nhịp
      sx.drawImage(c, 0, 0, w4, h4);
      const d = sx.getImageData(0, 0, w4, h4).data; const g = new Uint8Array(w4 * h4);
      for (let k = 0; k < g.length; k++) g[k] = Math.round(0.299 * d[k * 4] + 0.587 * d[k * 4 + 1] + 0.114 * d[k * 4 + 2]);
      if (truoc) { let n = 0; for (let k = 0; k < g.length; k++) if (Math.abs(g[k] - truoc[k]) > 12) n++; R.nhip.push([t, n / g.length]); }
      truoc = g;
      // (2) vật bị cắt khi máy đứng yên (vật đang trượt vào/ra thì được qua mép)
      const cx = bai.cam.x(t), cy = bai.cam.y(t), z = bai.cam.zoom(t);
      const camDung = camTruoc && Math.abs(cx - camTruoc[0]) * z < 3 && Math.abs(cy - camTruoc[1]) * z < 3 && Math.abs(z / camTruoc[2] - 1) < 0.004;
      camTruoc = [cx, cy, z];
      let vatLon = 0;
      for (const v of bai.VAT || []) {
        const hp = v.hop(t); if (!hp) continue;
        const X0 = W / 2 + (hp[0] - cx) * z, X1 = W / 2 + (hp[2] - cx) * z, Y0 = H / 2 + (hp[1] - cy) * z, Y1 = H / 2 + (hp[3] - cy) * z;
        const trongKhung = X1 > 0 && X0 < W && Y1 > 0 && Y0 < H;
        if (!trongKhung) continue;
        const hp2 = v.hop(t + 0.1); const vatDung = hp2 && Math.abs(hp2[0] - hp[0]) * z < 2 && Math.abs(hp2[1] - hp[1]) * z < 2;
        const cat = X0 < 0 || Y0 < 0 || X1 > W || Y1 > H;
        if (cat && camDung && vatDung) R.catMep.push([t, v.ten]);
        vatLon = Math.max(vatLon, ((Math.min(X1, W) - Math.max(X0, 0)) * (Math.min(Y1, H) - Math.max(Y0, 0))) / (W * H));
      }
      if (t > 0.5) { R.coVat = R.coVat || []; R.coVat.push(vatLon); if (vatLon < 0.025) R.vatNho.push(t); }
      // chữ
      const ds = rc.khungChu.filter((h) => h.alpha > 0.2 && h.x1 > 0 && h.x0 < W && h.y1 > 0 && h.y0 < H);
      for (const h of ds) {
        if (h.x0 < a0 - 1 || h.x1 > a1 + 1 || h.y0 < b0 - 1 || h.y1 > b1 + 1) R.chu.push([t, "tràn vùng an toàn", h.text]);
        if (h.x1 > p0 && h.x0 < p1 && h.y1 > q0 && h.y0 < q1) R.chu.push([t, "vào vùng PiP", h.text]);
      }
      for (let x = 0; x < ds.length; x++) for (let y = x + 1; y < ds.length; y++) {
        const A = ds[x], B = ds[y];
        if (A.text !== B.text && Math.min(A.x1, B.x1) - Math.max(A.x0, B.x0) > 3 && Math.min(A.y1, B.y1) - Math.max(A.y0, B.y0) > 3) R.chu.push([t, "chữ chồng chữ", A.text + " | " + B.text]);
      }
      // tương phản hộp phụ đề: hàng giữa hộp (dưới chữ), tìm dải tối, so với nền ngay ngoài hộp
      const cum = bai.cum.find((q) => t >= q.bd && t < q.kt);
      if (cum) {
        const yb = Math.round(F.phuDe.cy + F.phuDe.size * 0.6);
        const row = ctx.getImageData(0, yb, W, 1).data;
        // chỉ tìm hộp trong dải phụ đề (tránh nhầm vật tối khác cùng hàng); hộp = dải tối liền quanh tâm phụ đề
        const xa = Math.max(0, Math.round(F.phuDe.cx - F.phuDe.maxW / 2 - 80)); const xb = Math.min(W - 1, Math.round(F.phuDe.cx + F.phuDe.maxW / 2 + 80));
        const toi = (x) => Lum(row[x * 4], row[x * 4 + 1], row[x * 4 + 2]) < 0.035;
        let x0 = -1, x1 = -1; const xm = Math.round(F.phuDe.cx);
        if (toi(xm)) { x0 = xm; x1 = xm; while (x0 - 1 >= xa && toi(x0 - 1)) x0--; while (x1 + 1 <= xb && toi(x1 + 1)) x1++; }
        if (x1 - x0 > 60) {
          const xg = Math.round((x0 + x1) / 2);
          const lb = Lum(row[xg * 4], row[xg * 4 + 1], row[xg * 4 + 2]);
          const yTren = Math.round(F.phuDe.cy - F.phuDe.size * 0.78 - 6); const yDuoi = Math.round(F.phuDe.cy + F.phuDe.size * 0.72 + 6);
          const ngoai = [];
          for (const yy of [yTren, yDuoi]) { const r2 = ctx.getImageData(x0, yy, x1 - x0, 1).data; for (let k = 0; k < r2.length; k += 16) ngoai.push(Lum(r2[k], r2[k + 1], r2[k + 2])); }
          ngoai.sort((u, v) => u - v);
          const ln = ngoai[Math.floor(ngoai.length * 0.1)];
          const tp = (Math.max(ln, lb) + 0.05) / (Math.min(ln, lb) + 0.05);
          if (tp < 4.5) R.tuongPhan.push([t, +tp.toFixed(2)]);
        }
      }
    }
    // gom kết quả
    const sk = R.nhip.filter(([, v]) => v > 0.06).map(([t]) => t);
    const moc = [0, ...sk, bai.THOI_LUONG]; const ho = [];
    for (let k = 1; k < moc.length; k++) if (moc[k] - moc[k - 1] > 3.5) ho.push([moc[k - 1], moc[k], +(moc[k] - moc[k - 1]).toFixed(2)]);
    const soTu = bai.cum.map((q) => q.tu.length);
    out[kho] = {
      nhip_ho_tren_3_5s: ho, nhip_dai_nhat: Math.max(...moc.slice(1).map((v, k) => v - moc[k])),
      cat_mep: R.catMep, chu: R.chu, tuong_phan_duoi_4_5: R.tuongPhan,
      vat_nho_duoi_4pt: R.vatNho, co_vat_trung_vi: R.coVat ? R.coVat.slice().sort((u, v) => u - v)[Math.floor(R.coVat.length / 2)] : 0, cum_phu_de_min_max: [Math.min(...soTu), Math.max(...soTu)], co_chu_nguon: F.nguon.size
    };
  }
  return out;
}, khos);
const gom = (ds, k = 1) => { const m = new Map(); for (const x of ds) { const key = x.slice(k).join(" · "); if (!m.has(key)) m.set(key, []); m.get(key).push(x[0]); } return [...m].map(([key, ts]) => `${key} @ ${ts[0]}–${ts[ts.length - 1]} s (${ts.length})`); };
let dat = true;
for (const [kho, r] of Object.entries(kq)) {
  const muc = [
    ["C13-3 nhịp (khoảng > 3,5 s, để dư biên cho nén video)", r.nhip_ho_tren_3_5s.length === 0, r.nhip_ho_tren_3_5s.map(([a, b2, d]) => `${a}→${b2} (${d} s)`)],
    ["C13-2 vật bị cắt mép khi máy đứng", r.cat_mep.length === 0, gom(r.cat_mep)],
    ["Chữ: tràn / PiP / chồng", r.chu.length === 0, gom(r.chu)],
    ["Hộp phụ đề ≥ 4,5:1 với nền quanh", r.tuong_phan_duoi_4_5.length === 0, r.tuong_phan_duoi_4_5.slice(0, 8).map(([t, v]) => `${t} s: ${v}`)],
    ["C13-7 cụm phụ đề 2–5 từ", r.cum_phu_de_min_max[0] >= 2 && r.cum_phu_de_min_max[1] <= 5, [`min ${r.cum_phu_de_min_max[0]}, max ${r.cum_phu_de_min_max[1]}`]],
    ["C13-8 chữ nguồn ≥ 22 px", r.co_chu_nguon >= 22, [`${r.co_chu_nguon} px`]],
    ["C13-1 không có khung gần trống (vật lớn nhất ≥ 2,5 % khung; soát mắt trên contact sheet)", r.vat_nho_duoi_4pt.length === 0, r.vat_nho_duoi_4pt.length ? [`${r.vat_nho_duoi_4pt.length} mẫu, từ ${r.vat_nho_duoi_4pt[0]} s; vật lớn nhất trung vị ${(r.co_vat_trung_vi * 100).toFixed(1)} % khung`] : []]
  ];
  console.log(`\n=== ${kho} — nhịp dài nhất ${r.nhip_dai_nhat.toFixed(2)} s`);
  for (const [ten, ok, ct] of muc) { if (!ok) dat = false; console.log(`${ok ? "ĐẠT " : "TRƯỢT"}  ${ten}${ok ? "" : "\n        " + ct.slice(0, 12).join("\n        ")}`); }
}
if (loiTrang.length) { dat = false; console.log("\nLỖI TRANG:", loiTrang.slice(0, 5)); }
console.log(dat ? "\n>>> ĐẠT TIỀN KỲ: được phép xuất video." : "\n>>> CHƯA ĐẠT: sửa các mục TRƯỢT rồi chạy lại một lần; CHƯA xuất video.");
fs.writeFileSync(process.argv[3] || "kiem_truoc.json", JSON.stringify(kq, null, 1));
await b.close(); srv.close();
process.exit(dat ? 0 : 1);
