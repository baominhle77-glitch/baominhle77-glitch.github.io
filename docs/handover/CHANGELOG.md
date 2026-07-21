# Nhật ký thay đổi (bàn giao)

## 2026-07-21 — Khởi tạo hệ thống kiểm soát truy cập
- Thêm Lớp A (chống dò tìm + khóa mật khẩu) cho cả 3 app: Bói toán, SPARE, MEDORA.
- Thêm `robots.txt`, meta `noindex`, `assets/gate.js` + `gate.css`.
- Thêm Lớp B: `tools/encrypt.mjs` (mã hóa AES) + `tools/set-password.mjs` (đổi mật khẩu).
- Thêm Lớp C: `backend/` (Cloudflare Worker duyệt truy cập + Telegram bot + trang admin).
- Thêm tự động hóa: `deploy-worker.yml`, `handover.yml`.
- Thêm tài liệu: `HANDOVER.md`, `docs/ARCHITECTURE.md`.
- Đã kiểm chứng: PBKDF2 mở khóa đúng/sai; round-trip mã hóa AES; gate render trên Chromium.

<!-- Các mục mới sẽ được thêm phía trên dòng này. STATUS.md được máy tự sinh sau mỗi push. -->
