# Bàn giao hệ thống ba webapp

> Đọc file này đầu tiên. Nó cho bất kỳ ai (hoặc AI nick khác) nối vào GitHub nắm ngay
> toàn bộ tình hình để tiếp tục mà không tốn nhiều limit.

**Cập nhật:** 2026-07-22 · **commit production:** `8790f37f429987a716d62ab1e3d43ceb1053a3d7`

Backend, frontend và PWA mới đã rollout lên Cloudflare production. GitHub Actions run `#9` hoàn tất Pages trước Worker; smoke test read-only ba app, manifest/icon, Worker, `/admin` và CORS đều đạt. Payload SPARE/Bói toán giữ nguyên Git blob hash.

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

### Backend, telemetry và chat
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

### PWA và cửa hàng ứng dụng
- Root và Bói toán có manifest/SW; SW không cache navigation, HTML mã hóa hoặc API.
- Chỉ có icon 512×512 thật. Còn thiếu icon 192×192 thật, nên chưa tuyên bố đạt điều kiện quảng bá cài đặt Chrome.
- ChPlay/App Store chưa hoàn tất. Cần tài khoản developer, đóng gói, listing, privacy disclosure, test và submission riêng.

### Tự động hóa — production đã rollout
- `.github/workflows/deploy-pages.yml`: trên `main`, kiểm tra token và tên binding `DECRYPT_KEY_SPARE` trên Worker, test cả frontend/Worker, deploy Pages trước rồi mới deploy Worker. Wrangler giữ nguyên Worker secrets; Worker không chạy nếu preflight hoặc Pages lỗi.
- `.github/workflows/deploy-worker.yml`: chỉ chạy thủ công từ `main`, dùng cho khôi phục; không còn tự deploy từ branch khác.
- `.github/workflows/setup-backend.yml`: nhận `DECRYPT_KEY_SPARE` riêng cho SPARE.
- `.github/workflows/handover.yml`: được thiết kế để cập nhật `docs/handover/STATUS.md`; hiện chưa tạo được file này trên `main`.
- Đích web là Cloudflare Pages, không phải GitHub Pages. Wrangler được pin tại `4.112.0` để giảm biến động phiên bản CLI.
- Production run `#9` cho commit `8790f37` thành công. Smoke test xác nhận HTTP 200 cho `/`, `/boitoan/`, `/medora/`, hai manifest, icon Bói, Worker root và `/admin`; CORS OPTIONS trả HTTP 204 đúng origin Pages.

## 3. Việc bạn cần làm (một lần, tùy chọn mức bảo vệ)

| Muốn mức nào | Bạn cần làm |
|--------------|-------------|
| Gate/mã hóa | Đã rollout production; giữ khóa và payload đồng bộ khi đổi mật khẩu. |
| Telemetry/approval/chat | Đã rollout, chat vẫn tắt; còn test đầu-cuối approval/Telegram/telemetry có ghi dữ liệu. |
| PWA | Nền tảng an toàn xong; thiếu icon 192 thật. |
| ChPlay/App Store | Chưa đóng gói hoặc submit. |

## 4. Cách tiếp tục công việc (cho nick/AI khác)
1. Bắt đầu từ `main` sạch tại hoặc sau commit production `8790f37`; không dùng worktree có sửa đổi dở.
2. Chạy full suite trong `backend/`, `assets/`, root và `boitoan/`.
3. Independent Reviewer từng trả `BLOCK` vì Worker tự deploy từ mọi branch và chạy song song Pages. Hai blocker đã sửa trước rollout; không có verdict Reviewer lần hai.
4. Trước lần setup hoặc đổi rate-limit binding, xác nhận namespace `89001`/`89002` không trùng trong tài khoản Cloudflare.
5. Test E2E production có ghi KV/Telegram cần chủ động tạo dữ liệu thử và dọn dữ liệu nếu cần; smoke test hiện tại chỉ đọc.
6. Rotate/revoke mọi credential từng lộ. `TELEGRAM_CHAT_ID` hiện là Worker secret, không còn trong `wrangler.toml`.
7. Deploy frontend và Worker bằng workflow phối hợp; không chạy Worker riêng nếu contract frontend thay đổi.

## 5. Bí mật / mật khẩu
- **Mật khẩu cổng hiện tại** được bàn giao RIÊNG trong hội thoại, **không lưu trong repo**.
  Repo chỉ chứa hash PBKDF2; vẫn có rủi ro bị thử đoán ngoại tuyến nếu mật khẩu yếu. Đổi bất cứ lúc nào bằng `tools/set-password.mjs`.
- Worker cần secret binding: `ADMIN_TOKEN`, `DECRYPT_KEY`, `DECRYPT_KEY_SPARE`, `SESSION_SECRET`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_WEBHOOK_SECRET`.
- Giá trị token, mật khẩu và secret chỉ giữ ngoài repo; **không chép vào tài liệu hoặc commit**.

---
_Xem thiết kế chi tiết & lý do kỹ thuật trong `docs/ARCHITECTURE.md`._
