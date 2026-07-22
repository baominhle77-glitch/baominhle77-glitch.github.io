# Nhật ký thay đổi (bàn giao)

## 2026-07-22 — Bật chat và mở rộng quản trị
- Bật chat cho phiên approval; giữ bản sao Telegram 30 ngày như chính sách hiện có.
- `/admin` thêm link ba app, tải phân trang toàn bộ yêu cầu và hồ sơ trình duyệt, cho thu hồi phiên approval.
- Danh sách ghi cả đường mở bằng mật khẩu nhưng không nhận mật khẩu; mã trình duyệt không phải định danh thiết bị vật lý.

## 2026-07-21 (c) — Telemetry, chat và PWA foundation
- Backend: JWT v2 có session thu hồi, IP `/24`/`/64`, browser-profile telemetry 90 ngày, chat approval 30 ngày, CSP admin và rate limit native.
- Frontend: một shared gate cho ba app, telemetry mọi reveal path và chat chỉ cho phiên approval.
- PWA: root/Bói toán dùng cache allowlist, không cache navigation, HTML mã hóa hoặc API; manifest khai icon 192×192 và 512×512 thật.
- CI: chạy test trước deploy, pin Wrangler `4.112.0`; setup không hiển thị `ADMIN_TOKEN` và kiểm phản hồi webhook.
- Chat được giữ tắt ở rollout nền tảng này; bật trong rollout quản trị ngày 2026-07-22.

## 2026-07-21 — Khởi tạo hệ thống kiểm soát truy cập
- Thêm Lớp A (chống dò tìm + khóa mật khẩu) cho cả 3 app: Bói toán, SPARE, MEDORA.
- Thêm `robots.txt`, meta `noindex`, `assets/gate.js` + `gate.css`.
- Thêm Lớp B: `tools/encrypt.mjs` (mã hóa AES) + `tools/set-password.mjs` (đổi mật khẩu).
- Thêm Lớp C: `backend/` (Cloudflare Worker duyệt truy cập + Telegram bot + trang admin).
- Thêm tự động hóa: `deploy-worker.yml`, `handover.yml`.
- Thêm tài liệu: `HANDOVER.md`, `docs/ARCHITECTURE.md`.
- Đã kiểm chứng: PBKDF2 mở khóa đúng/sai; round-trip mã hóa AES; gate render trên Chromium.

## 2026-07-21 (b) — Bật Lớp B (mã hóa) cho cả 3 app + chuẩn bị B+C
- Mã hóa AES-256-GCM nội dung SPARE, boitoan (đã gộp data*.js+app.js, xóa 6 file plaintext), MEDORA.
- Thêm `tools/decrypt.mjs` (khôi phục để sửa); `.gitignore` chặn `*.src.html`.
- Vá `gate.js`: giữ đúng thứ tự chạy script sau giải mã (async=false cho script ngoài).
- `worker.js`: khi duyệt trả `key` giải mã (dùng secret `DECRYPT_KEY`) — sẵn sàng chế độ B+C.
- Đã test trình duyệt thật (Chromium headless) cả 3 app: mở/khóa/sai-mật-khẩu/không-lỗi.

<!-- Các mục mới sẽ được thêm phía trên dòng này. STATUS.md được máy tự sinh sau mỗi push. -->
