# Bàn giao hệ thống ba webapp

> Đọc file này đầu tiên. Nó cho bất kỳ ai (hoặc AI nick khác) nối vào GitHub nắm ngay
> toàn bộ tình hình để tiếp tục mà không tốn nhiều limit.

**Cập nhật:** 2026-07-22 · **commit rollout nền:** `7cd46c5dd27fca6376bbfcca7ab762087257644b`

Backend, frontend, PWA và tài liệu mới đang ở branch rollout trong checkpoint worktree cách ly. Remote mới đã được tích hợp mà không đổi payload SPARE/Bói toán. Bản vá workflow cuối chưa commit, push hoặc deploy; production cũ vẫn giữ nguyên.

---

## 1. Ba webapp & vị trí

Repo `baominhle77-glitch.github.io` là **nguồn chuẩn duy nhất** cho cả ba app.

| App | Mô tả | Nguồn trong repo | URL production |
|-----|-------|------------------|----------------|
| 🔮 Bói toán | PWA tra cứu + chat AI | `boitoan/` | `https://hiennhi89.pages.dev/boitoan/` |
| 🕯️ SPARE (Tâm linh) | Kho tra cứu riêng + chat AI | root | `https://hiennhi89.pages.dev/` |
| ⚕️ MEDORA (Y đa khoa) | Học y khoa | `medora/` | `https://hiennhi89.pages.dev/medora/` |

MEDORA đã được nhập từ commit `84a8632` của repo cũ `baominhle77-glitch.github.io-`.
Repo cũ không còn là nguồn deploy production.

## 2. Đã làm gì (trạng thái hiện tại)

### Gate và mã hóa
- `robots.txt` chặn Google/Bing + bot AI (GPTBot, ClaudeBot, CCBot…).
- Mọi trang thêm `noindex, nofollow, noarchive, nosnippet` + `referrer: no-referrer`.
- `assets/gate.js` + `assets/gate.css`: màn hình khóa mật khẩu (PBKDF2-SHA256, chạy offline).
- Đã wire vào cả 3 app bằng shared `assets/gate.js` và `assets/gate.css`.
- Bốn bản gate trùng trong `boitoan/` và `medora/assets/` đã xóa; không khôi phục nếu không có lý do tương thích rõ ràng.

### Mã hóa nội dung
- Nội dung 3 app là payload **AES-256-GCM**; gate checkpoint hiện chạy `mode:'approval'` và nhận khóa sau khi duyệt. Tải mã nguồn
  về chỉ thấy chuỗi mã hóa, không chứa nội dung plaintext. Chế độ mật khẩu cục bộ có thể chạy offline; độ an toàn phụ thuộc độ mạnh mật khẩu vì người có payload có thể thử đoán ngoại tuyến.
- Với **boitoan**: đã GỘP `data*.js` + `app.js` vào trong rồi mã hóa, và **xóa 6 file
  plaintext** (giờ `boitoan/data.js`… trả 404 — không tải về được nữa).
- Công cụ: `tools/encrypt.mjs` (mã hóa), `tools/decrypt.mjs` (khôi phục để sửa),
  `tools/set-password.mjs` (đổi mật khẩu).
- ⚠️ **File `*.src.html` (bản gốc plaintext) KHÔNG commit** (đã `.gitignore`). Muốn sửa
  nội dung: `node tools/decrypt.mjs index.html "mật-khẩu" > index.src.html` → sửa →
  `node tools/encrypt.mjs index.src.html index.html "mật-khẩu"`.
- ✅ Đã test trình duyệt thật (Chromium): mở đúng mật khẩu hiện nội dung, sai mật khẩu
  bị chặn, không lỗi console; boitoan chạy đủ chức năng sau giải mã.

### Backend, telemetry và chat — chờ rollout
- `backend/worker.js`: Cloudflare Worker. Ghi telemetry browser-profile best-effort,
  gửi Telegram cho chủ với nút duyệt/từ chối, cấp phiên JWT v2 khi duyệt.
- Duyệt được bằng **bot Telegram** HOẶC **trang `/admin`** (mật khẩu ADMIN_TOKEN).
- `/`, `/boitoan/` và `/medora/` dùng `mode: 'approval'`, trỏ tới `https://hiennhi89-gate.hiennhi89.workers.dev`.
- Worker lưu IP đã rút gọn `/24` hoặc `/64`, không nhận mật khẩu. Browser ID không phải định danh thiết bị vật lý tuyệt đối.
- Chat chỉ dành cho phiên approval; mặc định `CHAT_ENABLED=false`. Tin chat giữ 30 ngày trong KV và có bản sao Telegram.
- Telemetry giữ 90 ngày; yêu cầu/log 7 ngày; phiên 12 giờ.
- SPARE ưu tiên Worker secret `DECRYPT_KEY_SPARE`; Bói toán và MEDORA dùng fallback `DECRYPT_KEY`.
- Chưa kiểm thử production trọn luồng khách gửi yêu cầu, Telegram duyệt, nhận phiên/khóa, telemetry và chat.
- `backend/README.md`: hướng dẫn vận hành; không ghi giá trị bí mật vào repo.

### Reader showcase
- UI quảng bá reader nằm đầu nội dung app, dùng cấu hình `readers` và allowlist URL Facebook HTTPS.
- Cả ba danh sách đang rỗng. Cần tên, mô tả và URL Facebook chính xác từ chủ app.

### PWA và cửa hàng ứng dụng
- Root và Bói toán có manifest/SW; SW không cache navigation, HTML mã hóa hoặc API.
- Chỉ có icon 512×512 thật. Còn thiếu icon 192×192 thật, nên chưa tuyên bố đạt điều kiện quảng bá cài đặt Chrome.
- ChPlay/App Store chưa hoàn tất. Cần tài khoản developer, đóng gói, listing, privacy disclosure, test và submission riêng.

### Tự động hóa — chưa chạy deploy cho rollout này
- `.github/workflows/deploy-pages.yml`: trên `main`, kiểm tra token/khóa SPARE, test cả frontend/Worker, deploy Pages trước, đồng bộ `DECRYPT_KEY_SPARE`, rồi mới deploy Worker. Worker không chạy nếu Pages lỗi.
- `.github/workflows/deploy-worker.yml`: chỉ chạy thủ công từ `main`, dùng cho khôi phục; không còn tự deploy từ branch khác.
- `.github/workflows/setup-backend.yml`: nhận `DECRYPT_KEY_SPARE` riêng cho SPARE.
- `.github/workflows/handover.yml`: được thiết kế để cập nhật `docs/handover/STATUS.md`; hiện chưa tạo được file này trên `main`.
- Đích web là Cloudflare Pages, không phải GitHub Pages. Wrangler được pin tại `4.112.0` để giảm biến động phiên bản CLI.

## 3. Việc bạn cần làm (một lần, tùy chọn mức bảo vệ)

| Muốn mức nào | Bạn cần làm |
|--------------|-------------|
| Gate/mã hóa | Code checkpoint đã cập nhật; chưa rollout. |
| Telemetry/approval/chat | Worker và frontend đã code; cần review, test đầu-cuối và rollout phối hợp. |
| Reader showcase | UI xong; chờ dữ liệu reader. |
| PWA | Nền tảng an toàn xong; thiếu icon 192 thật. |
| ChPlay/App Store | Chưa đóng gói hoặc submit. |

## 4. Cách tiếp tục công việc (cho nick/AI khác)
1. Làm trong branch rollout của checkpoint worktree hiện tại; không sửa nhầm working tree production.
2. Chạy full suite trong `backend/`, `assets/`, root và `boitoan/`.
3. Validate manifest/icon dimensions và Wrangler config nhưng không deploy.
4. Independent review đã trả `BLOCK` vì Worker từng tự deploy từ mọi branch và song song Pages. Hai blocker đã vá; cần validation cuối trước push.
5. Trước deploy, xác nhận rate-limit namespace `89001`/`89002` không trùng trong tài khoản Cloudflare.
6. Rotate/revoke mọi credential từng lộ. `TELEGRAM_CHAT_ID` hiện là Worker secret, không còn trong `wrangler.toml`.
7. Chỉ commit, push hoặc deploy khi chủ app cho phép rõ ràng. Deploy frontend và Worker phối hợp.

## 5. Bí mật / mật khẩu
- **Mật khẩu cổng hiện tại** được bàn giao RIÊNG trong hội thoại, **không lưu trong repo**.
  Repo chỉ chứa hash PBKDF2; vẫn có rủi ro bị thử đoán ngoại tuyến nếu mật khẩu yếu. Đổi bất cứ lúc nào bằng `tools/set-password.mjs`.
- Worker cần secret binding: `ADMIN_TOKEN`, `DECRYPT_KEY`, `DECRYPT_KEY_SPARE`, `SESSION_SECRET`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_WEBHOOK_SECRET`.
- Giá trị token, mật khẩu và secret chỉ giữ ngoài repo; **không chép vào tài liệu hoặc commit**.

---
_Xem thiết kế chi tiết & lý do kỹ thuật trong `docs/ARCHITECTURE.md`._
