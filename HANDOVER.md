# 📋 BÀN GIAO — Hệ thống kiểm soát truy cập cho 3 webapp của BaoMinh

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

### 🟡 Lớp B — Mã hóa nội dung AES (CÓ SẴN, CHƯA ÁP DỤNG)
- `tools/encrypt.mjs`: mã hóa nội dung trang bằng AES-GCM (khóa từ mật khẩu).
  Sau khi mã hóa, mã nguồn chỉ còn chuỗi mã hóa — không mật khẩu = không đọc được.
- `gate.js` chế độ `mode:'encrypted'` tự giải mã trong trình duyệt, vẫn chạy offline.
- Đã kiểm chứng round-trip encrypt↔decrypt khớp WebCrypto trình duyệt.
- **Chưa áp dụng lên app** để tránh làm hỏng (app có script/dữ liệu phức tạp).
  Muốn bật: xem `docs/ARCHITECTURE.md` mục "Bật Lớp B".

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
