# 📋 BÀN GIAO — Hệ thống kiểm soát truy cập cho 3 webapp của Hiên Nhi Hiên 89

> Đọc file này đầu tiên. Nó cho bất kỳ ai (hoặc AI nick khác) nối vào GitHub nắm ngay
> toàn bộ tình hình để tiếp tục mà không tốn nhiều limit.

**Cập nhật:** 2026-07-21 · **Nhánh nền:** `main`

PR #9 từ `claude/webapp-automation-access-control-3sierx` đã merge vào `main` tại commit `b141644`. Cloudflare Worker và Telegram webhook đã được kiểm tra ngày 2026-07-21; luồng duyệt đầu-cuối chưa được chạy thử trong phiên này.

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

### ✅ Lớp A — Chống dò tìm + Khóa mật khẩu (ĐÃ BẬT)
- `robots.txt` chặn Google/Bing + bot AI (GPTBot, ClaudeBot, CCBot…).
- Mọi trang thêm `noindex, nofollow, noarchive, nosnippet` + `referrer: no-referrer`.
- `assets/gate.js` + `assets/gate.css`: màn hình khóa mật khẩu (PBKDF2-SHA256, chạy offline).
- Đã wire vào cả 3 app. **Mật khẩu hiện tại xem mục 5.**
- ⚠️ Bản chất: đây là lớp **ngăn chặn**. Nội dung vẫn nằm trong mã nguồn (chỉ bị che).
  Muốn "tải về cũng không đọc được" → bật Lớp B. Muốn "duyệt từng người" → bật Lớp C.

### ✅ Lớp B — Mã hóa nội dung AES (ĐÃ ÁP DỤNG CẢ 3 APP)
- Nội dung 3 app đã được **mã hóa AES-256-GCM** (`mode:'encrypted'`). Tải mã nguồn
  về chỉ thấy chuỗi mã hóa, không chứa nội dung plaintext. Vẫn chạy offline; độ an toàn phụ thuộc độ mạnh mật khẩu vì người có payload có thể thử đoán ngoại tuyến.
- Với **boitoan**: đã GỘP `data*.js` + `app.js` vào trong rồi mã hóa, và **xóa 6 file
  plaintext** (giờ `boitoan/data.js`… trả 404 — không tải về được nữa).
- Công cụ: `tools/encrypt.mjs` (mã hóa), `tools/decrypt.mjs` (khôi phục để sửa),
  `tools/set-password.mjs` (đổi mật khẩu).
- ⚠️ **File `*.src.html` (bản gốc plaintext) KHÔNG commit** (đã `.gitignore`). Muốn sửa
  nội dung: `node tools/decrypt.mjs index.html "mật-khẩu" > index.src.html` → sửa →
  `node tools/encrypt.mjs index.src.html index.html "mật-khẩu"`.
- ✅ Đã test trình duyệt thật (Chromium): mở đúng mật khẩu hiện nội dung, sai mật khẩu
  bị chặn, không lỗi console; boitoan chạy đủ chức năng sau giải mã.

### 🟡 Lớp C — Backend duyệt + Telegram bot (ĐÃ BẬT, CHƯA TEST ĐẦU-CUỐI)
- `backend/worker.js`: Cloudflare Worker. Ghi IP/quốc gia/thiết bị của khách,
  gửi Telegram cho chủ với nút ✅ Duyệt / ❌ Từ chối, cấp phiên JWT khi duyệt.
- Duyệt được bằng **bot Telegram** HOẶC **trang `/admin`** (mật khẩu ADMIN_TOKEN).
- `/`, `/boitoan/` và `/medora/` dùng `mode: 'approval'`, trỏ tới `https://hiennhi89-gate.hiennhi89.workers.dev`.
- Worker trả HTTP 200 với `gate backend OK`; repo cấu hình binding `KV`, Workers API xác nhận 5 secret binding bắt buộc đã tồn tại.
- Bot `@Appwebcuatoi_bot` hoạt động; webhook trỏ đúng Worker, không có lỗi hoặc bản cập nhật chờ tại lúc kiểm tra.
- ⚠️ Chưa kiểm thử trọn luồng khách gửi yêu cầu → Telegram duyệt → nhận phiên/khóa giải mã trong phiên này.
- `backend/README.md`: hướng dẫn vận hành; không ghi giá trị bí mật vào repo.

### ✅ Tự động hóa
- `.github/workflows/deploy-worker.yml`: tự deploy Worker khi push (cần secret `CLOUDFLARE_API_TOKEN`).
- `.github/workflows/deploy-pages.yml`: khi source đổi trên `main`, gộp ba app từ chính repo này và Direct Upload lên Cloudflare Pages project `hiennhi89`; thiếu token làm workflow thất bại rõ ràng.
- `.github/workflows/handover.yml`: được thiết kế để cập nhật `docs/handover/STATUS.md`; hiện chưa tạo được file này trên `main`.
- Đích web là Cloudflare Pages, không phải GitHub Pages. Wrangler được pin tại `4.112.0` để giảm biến động phiên bản CLI.

## 3. Việc bạn cần làm (một lần, tùy chọn mức bảo vệ)

| Muốn mức nào | Bạn cần làm |
|--------------|-------------|
| Chỉ chống dò tìm + khóa (Lớp A) | Đã có trong `main`; kiểm tra web thật trước khi kết luận. |
| Thêm mã hóa thật (Lớp B) | Đã có trong `main`; dùng `tools/encrypt.mjs` khi cần sửa nội dung. |
| Duyệt từng người + Telegram (Lớp C) | Đã bật cho cả ba URL; cần test đầu-cuối. |
| Deploy Worker tự động | Worker đang hoạt động; workflow deploy gần nhất trên `main` kết thúc thành công. |
| Deploy ba app tự động | Giữ secret `CLOUDFLARE_API_TOKEN`; push source lên `main` rồi kiểm tra workflow và ba URL production. |

## 4. Cách tiếp tục công việc (cho nick/AI khác)
1. Đọc file này trước. `docs/ARCHITECTURE.md` và `docs/handover/DOI-TEN-VA-TIEP-TUC.md` còn hướng dẫn cũ về GitHub Pages/D1/repo phụ; production hiện dùng một repo, Cloudflare Pages và Workers KV như code/cấu hình hiện tại.
2. Xem `git log`, GitHub Actions và deployment Cloudflare Pages. `docs/handover/STATUS.md` hiện chưa tồn tại trên `main` dù workflow bàn giao gần nhất báo thành công.
3. Tạo nhánh mới từ `main`, mở PR nháp; không tiếp tục trên nhánh đã merge.
4. Đổi mật khẩu: `node tools/set-password.mjs "mk-moi"` rồi dán khối in ra vào `window.GATE`.

## 5. Bí mật / mật khẩu
- **Mật khẩu cổng hiện tại** được bàn giao RIÊNG trong hội thoại, **không lưu trong repo**.
  Repo chỉ chứa hash PBKDF2; vẫn có rủi ro bị thử đoán ngoại tuyến nếu mật khẩu yếu. Đổi bất cứ lúc nào bằng `tools/set-password.mjs`.
- Cloudflare API xác thực thành công. Worker có các secret binding: `ADMIN_TOKEN`, `DECRYPT_KEY`, `SESSION_SECRET`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`.
- Giá trị token, mật khẩu và secret chỉ giữ ngoài repo; **không chép vào tài liệu hoặc commit**.

---
_Xem thiết kế chi tiết & lý do kỹ thuật trong `docs/ARCHITECTURE.md`._
