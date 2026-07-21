# 📋 BÀN GIAO — Hệ thống kiểm soát truy cập cho 3 webapp của Hiên Nhi Hiên 89

> Đọc file này đầu tiên. Nó cho bất kỳ ai (hoặc AI nick khác) nối vào GitHub nắm ngay
> toàn bộ tình hình để tiếp tục mà không tốn nhiều limit.

**Cập nhật:** 2026-07-21 · **Nhánh làm việc:** `claude/webapp-automation-access-control-3sierx`

---

## 1. Ba webapp & vị trí

| App | Mô tả | Repo | Đường dẫn |
|-----|-------|------|-----------|
| 🔮 Bói toán | PWA tra cứu + chat AI | `baominhle77-glitch.github.io` | `/boitoan/` |
| 🕯️ SPARE (Tâm linh) | Kho tra cứu riêng + chat AI | `baominhle77-glitch.github.io` | `/` (root) |
| ⚕️ MEDORA (Y đa khoa) | Học y khoa | `baominhle77-glitch.github.io-` | `/` (root) |

## 2. Đã làm gì (trạng thái hiện tại)

### ✅ Lớp A — Chống dò tìm + Khóa mật khẩu (ĐÃ BẬT)
- `robots.txt` chặn Google/Bing + bot AI (GPTBot, ClaudeBot, CCBot…).
- Mọi trang thêm `noindex, nofollow, noarchive, nosnippet` + `referrer: no-referrer`.
- `assets/gate.js` + `assets/gate.css`: màn hình khóa mật khẩu (PBKDF2-SHA256, chạy offline).
- Đã wire vào cả 3 app. **Mật khẩu hiện tại xem mục 5.**
- ⚠️ Bản chất: đây là lớp **ngăn chặn**. Nội dung vẫn nằm trong mã nguồn (chỉ bị che).
  Muốn "tải về cũng không đọc được" → bật Lớp B. Muốn "duyệt từng người" → bật Lớp C.

### ✅ Lớp B — Mã hóa nội dung AES (ĐÃ ÁP DỤNG CẢ 3 APP)
- Nội dung 3 app đã được **mã hóa AES-256-GCM** (`mode:'encrypted'`). Tải mã nguồn
  về chỉ thấy chuỗi mã hóa; không mật khẩu = không đọc được gì. Vẫn chạy offline.
- Với **boitoan**: đã GỘP `data*.js` + `app.js` vào trong rồi mã hóa, và **xóa 6 file
  plaintext** (giờ `boitoan/data.js`… trả 404 — không tải về được nữa).
- Công cụ: `tools/encrypt.mjs` (mã hóa), `tools/decrypt.mjs` (khôi phục để sửa),
  `tools/set-password.mjs` (đổi mật khẩu).
- ⚠️ **File `*.src.html` (bản gốc plaintext) KHÔNG commit** (đã `.gitignore`). Muốn sửa
  nội dung: `node tools/decrypt.mjs index.html "mật-khẩu" > index.src.html` → sửa →
  `node tools/encrypt.mjs index.src.html index.html "mật-khẩu"`.
- ✅ Đã test trình duyệt thật (Chromium): mở đúng mật khẩu hiện nội dung, sai mật khẩu
  bị chặn, không lỗi console; boitoan chạy đủ chức năng sau giải mã.

### 🟡 Lớp C — Backend duyệt + Telegram bot (CÓ SẴN, CẦN 5 PHÚT CÀI)
- `backend/worker.js`: Cloudflare Worker. Ghi IP/quốc gia/thiết bị của khách,
  gửi Telegram cho chủ với nút ✅ Duyệt / ❌ Từ chối, cấp phiên JWT khi duyệt.
- Duyệt được bằng **bot Telegram** HOẶC **trang `/admin`** (mật khẩu ADMIN_TOKEN).
- `backend/README.md`: hướng dẫn cài từng bước (~5 phút, việc một-lần của bạn).
- Đây là bước DUY NHẤT cần bạn tự làm (vì gắn với token/tài khoản của bạn).

### ✅ Tự động hóa
- `.github/workflows/deploy-worker.yml`: tự deploy Worker khi push (cần secret `CLOUDFLARE_API_TOKEN`).
- `.github/workflows/handover.yml`: sau mỗi push tự cập nhật `docs/handover/STATUS.md`.
- Đẩy lên web: repo là GitHub Pages. **Merge nhánh vào `main` → tự lên web.**

## 3. Việc bạn cần làm (một lần, tùy chọn mức bảo vệ)

| Muốn mức nào | Bạn cần làm |
|--------------|-------------|
| Chỉ chống dò tìm + khóa (Lớp A) | **Không cần gì.** Chỉ merge PR vào `main`. |
| Thêm mã hóa thật (Lớp B) | Báo tôi, hoặc tự chạy `tools/encrypt.mjs` theo README. |
| Duyệt từng người + Telegram (Lớp C) | Làm theo `backend/README.md` (~5 phút). |
| Deploy Worker tự động | Thêm secret repo `CLOUDFLARE_API_TOKEN`. |

## 4. Cách tiếp tục công việc (cho nick/AI khác)
1. Đọc file này + `docs/ARCHITECTURE.md`.
2. Xem `docs/handover/STATUS.md` để biết commit mới nhất.
3. Làm trên nhánh `claude/webapp-automation-access-control-3sierx`, mở PR nháp.
4. Đổi mật khẩu: `node tools/set-password.mjs "mk-moi"` rồi dán khối in ra vào `window.GATE`.

## 5. Bí mật / mật khẩu
- **Mật khẩu cổng hiện tại** được bàn giao RIÊNG trong hội thoại, **không lưu trong repo**.
  Repo chỉ chứa hash PBKDF2 (không thể đảo ngược). Đổi bất cứ lúc nào bằng `tools/set-password.mjs`.
- Token Telegram, ADMIN_TOKEN, SESSION_SECRET: bạn tự đặt qua `wrangler secret`, **không vào repo**.

---
_Xem thiết kế chi tiết & lý do kỹ thuật trong `docs/ARCHITECTURE.md`._
