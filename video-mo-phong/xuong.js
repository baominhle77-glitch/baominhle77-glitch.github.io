// Trang Xưởng: xem trước tua được và xuất từng khung — cùng một hàm vẽ cho cả hai (xem trước = xuất).
import { veKhung } from "./engine/canh.js";
import { vePhuDe } from "./engine/phude.js";
import { xuatMp4, giaiMaGiong, docMocTu, hoTroXuat } from "./engine/xuat.js";
import { taoBai, KHO, napK3Anh } from "./bai/k3t4.js";
// Giọng TTS K3 t4 đã được GĐ khóa trên nhánh này; không đổi lời hay thời điểm.

const FONTS = [
  ["400", "normal"], ["600", "normal"], ["700", "normal"], ["400", "italic"]
];
const DAI = {
  latin: "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
  "latin-ext": "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2113,U+2C60-2C7F,U+A720-A7FF",
  greek: "U+0370-0377,U+037A-037F,U+0384-038A,U+038C,U+038E-03A1,U+03A3-03FF",
  vietnamese: "U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB"
};

// Nạp phông trước khung đầu (không tải giữa lúc render)
export async function taiPhong() {
  const jobs = [];
  for (const [w, st] of FONTS) {
    for (const [sub, range] of Object.entries(DAI)) {
      if (st === "italic" && sub !== "latin") continue;
      const file = `fonts/source-sans-3-${sub}-${w}-${st}.woff2`;
      const f = new FontFace("K1Sans", `url(${new URL(file, import.meta.url)})`, { weight: w, style: st, unicodeRange: range });
      jobs.push(f.load().then((ff) => document.fonts.add(ff)).catch(() => null));
    }
  }
  await Promise.all(jobs);
  await document.fonts.ready;
  await napK3Anh(); // đợi ảnh NASA/JSC đã duyệt trước khung đầu
}

export function taoTrinhVe(bai) {
  return (ctx, t) => {
    const rc = veKhung(ctx, bai.canh, t, bai.tl, bai.F);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    (bai.vePhuDe || vePhuDe)(rc, bai.cum, t, bai.phuDe);
    bai.hauKy(rc);
    return rc;
  };
}

// Dùng cho kiểm định tự động (Playwright): vẽ khung t, trả JPEG và danh sách hộp chữ
async function chupKhung(kho, t, mocTu) {
  const bai = taoBai(kho, mocTu);
  const c = new OffscreenCanvas(bai.F.W, bai.F.H);
  const ctx = c.getContext("2d", { alpha: false });
  const rc = taoTrinhVe(bai)(ctx, t);
  const blob = await c.convertToBlob({ type: "image/jpeg", quality: 0.82 });
  return { jpg: new Uint8Array(await blob.arrayBuffer()), chu: rc.khungChu };
}

// Giọng đọc mặc định của bài thi (edge-tts của Studio, miễn phí); kiểm sha256 trước khi dùng
const URL_GIONG = new URL("bai/k3t4_giong.mp3", import.meta.url).href;
async function napGiongMacDinh() {
  const buf = await (await fetch(URL_GIONG)).arrayBuffer();
  const h = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", buf))).map((b) => b.toString(16).padStart(2, "0")).join("");
  if (!buf.byteLength || !h) throw new Error("Tệp giọng K3 t4 không đọc được");
  return giaiMaGiong(buf);
}

async function xuatKho(kho, { mocTu = null, giong = null, onTienTrinh, huy, thoiLuong } = {}) {
  if (giong === "macdinh") giong = await napGiongMacDinh();
  const bai = taoBai(kho, mocTu);
  const ve = taoTrinhVe(bai);
  return xuatMp4({ W: bai.F.W, H: bai.F.H, fps: bai.FPS, thoiLuong: thoiLuong || bai.THOI_LUONG, veKhung: ve, giong, onTienTrinh, huy });
}

window.XUONG = { taiPhong, taoBai, taoTrinhVe, chupKhung, xuatKho, KHO, hoTroXuat };

// ---------------- Giao diện ----------------
const $ = (id) => document.getElementById(id);

async function khoiDong() {
  if (!$("stage")) return;
  $("trangThai").textContent = "Đang nạp phông…";
  await taiPhong();
  let kho = "16x9";
  let mocTu = null;
  let giong = null;
  let amThanh = null;
  try {
    giong = await napGiongMacDinh();
    amThanh = new Audio(URL_GIONG);
  } catch { giong = null; }
  let bai = taoBai(kho, mocTu);
  let ve = taoTrinhVe(bai);
  let t = 0; let chay = false; let moc = 0;
  const cv = $("stage"); const ctx = cv.getContext("2d", { alpha: false });

  const dung = () => {
    bai = taoBai(kho, mocTu); ve = taoTrinhVe(bai);
    cv.width = bai.F.W; cv.height = bai.F.H;
    cv.parentElement.classList.toggle("doc", kho === "9x16");
    $("tua").max = String(Math.round(bai.THOI_LUONG * 100));
    veLai();
  };
  const veLai = () => {
    ve(ctx, t);
    $("tua").value = String(Math.round(t * 100));
    $("gio").textContent = `${t.toFixed(1)} / ${bai.THOI_LUONG.toFixed(0)} s`;
  };
  const vong = (now) => {
    if (!chay) return;
    t = Math.min(bai.THOI_LUONG, (now - moc) / 1000);
    veLai();
    if (t >= bai.THOI_LUONG) { dungPhat(); return; }
    requestAnimationFrame(vong);
  };
  const dungPhat = () => { chay = false; $("phat").textContent = "▶ Phát"; if (amThanh) amThanh.pause(); };
  $("phat").onclick = () => {
    if (chay) { dungPhat(); return; }
    if (t >= bai.THOI_LUONG - 0.05) t = 0;
    chay = true; $("phat").textContent = "❚❚ Dừng"; moc = performance.now() - t * 1000;
    if (amThanh) { amThanh.currentTime = t; amThanh.play().catch(() => {}); }
    requestAnimationFrame(vong);
  };
  $("tua").oninput = (e) => { dungPhat(); t = Number(e.target.value) / 100; veLai(); };
  $("kho").onchange = (e) => { kho = e.target.value; dungPhat(); dung(); };
  $("tepGiong").onchange = async (e) => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    giong = await giaiMaGiong(await f.arrayBuffer());
    amThanh = new Audio(URL.createObjectURL(f));
    $("trangThai").textContent = `Đã nạp giọng: ${f.name} (${giong.duration.toFixed(1)} s).`;
  };
  $("tepMoc").onchange = async (e) => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    try {
      mocTu = docMocTu(await f.text());
      $("trangThai").textContent = `Đã nạp ${mocTu.length} mốc từ — phụ đề và nhịp cảnh khớp giọng.`;
      dung();
    } catch (err) { $("trangThai").textContent = "Tệp mốc từ không đọc được: " + err.message; }
  };
  let huy = null;
  $("xuat").onclick = async () => {
    if (!hoTroXuat()) { $("trangThai").textContent = "Trình duyệt này chưa hỗ trợ WebCodecs. Hãy dùng Chrome hoặc Edge bản mới."; return; }
    dungPhat();
    huy = new AbortController();
    $("xuat").disabled = true; $("huy").hidden = false;
    try {
      const kq = await xuatKho(kho, { mocTu, giong, huy: huy.signal, onTienTrinh: (p, i, n) => { $("trangThai").textContent = `Đang xuất từng khung… ${Math.round(p * 100)}% (${i}/${n})`; } });
      const blob = new Blob([kq.buffer], { type: "video/mp4" });
      const ten = `k3t4_${kho}.mp4`;
      const dl = window.claude && typeof window.claude.use === "function" ? await window.claude.use("downloads").catch(() => null) : null;
      if (dl) await dl.save({ filename: ten, data: blob }).catch(() => null);
      else { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = ten; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 60000); }
      $("trangThai").textContent = `Đã xuất ${ten}: ${kq.codec}, ${kq.thongKe.so_khung} khung trong ${kq.thongKe.thoi_gian_xuat_giay} s (×${kq.thongKe.ti_le_nhanh_hon_thuc} thời gian thực).`;
    } catch (err) {
      $("trangThai").textContent = err && err.name === "AbortError" ? "Đã huỷ xuất." : "Lỗi xuất: " + (err && err.message);
    } finally { $("xuat").disabled = false; $("huy").hidden = true; }
  };
  $("huy").onclick = () => huy && huy.abort();
  dung();
  $("trangThai").textContent = hoTroXuat() ? "Sẵn sàng. Kéo thanh tua để xem bất kỳ khung nào." : "Xem trước được; trình duyệt này không xuất được (thiếu WebCodecs).";
}

khoiDong();
