# BÀN GIAO HỆ THỐNG — ĐỌC TRƯỚC KHI SỬA

**Cập nhật:** 24/07/2026 03:00 GMT+7  
**Repository chuẩn duy nhất:** `baominhle77-glitch/baominhle77-glitch.github.io`  
**Production:** `SUCCESS`  
**Task đang mở:** xem `docs/handover/ACTIVE_TASKS.json`

## 1. Hệ thống hiện có

| Ứng dụng | Source chính | Production |
|---|---|---|
| SPARE | root | `https://hiennhi89.pages.dev/` |
| Spirituality Market / Bói toán | `boitoan/`, `assets/`, `backend/` | `https://hiennhi89.pages.dev/boitoan/` |
| MEDORA | `medora/` | `https://hiennhi89.pages.dev/medora/` |
| Việt Nam Đi Đâu? | `vietnam-travel/`, `backend/travel.js` | `https://hiennhi89.pages.dev/vietnam-travel/` |

Backend dùng chung: `https://hiennhi89-gate.hiennhi89.workers.dev`.

Kiến trúc: **Cloudflare Pages** phục vụ frontend tĩnh; **Cloudflare Worker** xử lý API/xác thực/Telegram/thanh toán; **Workers KV** lưu phiên và dữ liệu. Push vào `main` kích hoạt `.github/workflows/deploy-pages.yml`.

## 2. Trạng thái Bói toán hiện tại — V11

V11 là source trực tiếp, không còn build bằng chuỗi patch V2–V10. Các script `tools/apply-*.mjs` cũ chỉ còn tương thích lịch sử; **không được đưa chúng trở lại luồng build/deploy**.

Luồng mở ứng dụng bắt buộc:

`backend xác thực → trả khóa → decryptPayload() → injectHtml() → xác nhận DOM không rỗng → reveal()`

Không được gọi `reveal()` trước khi hoàn tất giải mã và bơm DOM. Nếu thiếu khóa, khóa sai, backend từ chối hoặc DOM rỗng thì phải fail-closed và quay về cổng đăng nhập.

Cache hiện hành: `boitoan-v19`; frontend dùng `/assets/gate.js?v=19`.

### Quyền tài khoản

- **Khách:** dùng app, hồ sơ, thảo luận, review, chat và luồng tư vấn/thanh toán.
- **Reader:** các quyền member và hồ sơ Reader/nhận khách/luận giải.
- **Admin thường:** quản lý member, review và bài thảo luận; không đọc hội thoại riêng.
- **Admin tổng:** toàn bộ quyền Admin thường, thêm hội thoại riêng và xem hồ sơ member ở chế độ chỉ đọc; chỉ một thiết bị primary hoạt động.

Backend là nguồn quyết định quyền. JWT Admin gắn thiết bị. Không dùng mật khẩu làm Bearer token và không lưu plaintext secret trong source/log/tài liệu.

## 3. Các bất biến không được phá

1. Không mở khung ứng dụng khi payload AES chưa được giải mã và nạp thành công.
2. `MutationObserver`/branding phải idempotent; không gán DOM vô điều kiện gây vòng lặp WebKit.
3. Worker phải deploy **trước** Pages để frontend mới không gọi backend cũ.
4. Không hạ quyền backend chỉ để UI chạy; UI ẩn nút không thay thế kiểm tra quyền API.
5. Không commit mật khẩu, token, Telegram ID, IP đầy đủ, mã thiết bị, QR hoặc nội dung chat riêng.
6. Không tuyên bố hoàn tất nếu chưa có CI và hậu kiểm production tương ứng.

## 4. Source map cần biết

- `assets/gate.js`: cổng đăng nhập, khôi phục phiên, giải mã và mở app.
- `assets/community.js`: khu vực member/Reader.
- `assets/community-admin.js`: giao diện Admin thường/Admin tổng.
- `backend/community.js`: tài khoản, phiên, RBAC và Community API.
- `backend/worker.js`: router Worker, Telegram, access gate, chat, tư vấn/thanh toán.
- `boitoan/index.html`: payload AES của ứng dụng.
- `boitoan/community*.html`: Community/Admin shell.
- `.github/workflows/deploy-pages.yml`: build, Worker→Pages, production smoke.
- `.github/workflows/validate-role-system.yml`: contract frontend/backend và WebKit AES thật.

## 5. Quy trình tiếp tục công việc

1. Đọc `AGENTS.md`, file này và `docs/handover/ACTIVE_TASKS.json`.
2. Tạo Task-ID + branch riêng; đăng ký phạm vi file trong `ACTIVE_TASKS.json`.
3. Sửa source trực tiếp; không vá nối tiếp bằng runner cũ.
4. Chạy tối thiểu:
   - `node assets/gate.test.mjs`
   - `node assets/account-v2.test.mjs`
   - `node boitoan/sw.test.mjs`
   - `node backend/community.test.mjs`
   - `node backend/account-v2.test.mjs`
   - `node backend/worker.test.mjs`
   - `node tools/admin-v9-return-webkit-check.mjs`
5. Mở PR có dòng `Task-ID: ...`; chỉ merge khi CI đạt.
6. Sau deploy, kiểm Pages + Worker + WebKit/iPhone; cập nhật file bàn giao và giải phóng task.

## 6. Bằng chứng và tài liệu chi tiết

- `docs/handover/BOITOAN_V11_STATUS.md` — nguyên nhân trang trống, hợp đồng V11 và bằng chứng nghiệm thu.
- `docs/handover/BOITOAN_MASTER_SPEC.md` — yêu cầu nghiệp vụ/quyền chi tiết.
- `docs/handover/PRODUCTION_STATUS.md` — trạng thái deploy gần nhất.
- `docs/handover/VIETNAM_TRAVEL.md` — tài liệu ứng dụng du lịch.
- `docs/handover/NHAT-KY-PHOI-HOP.md` — lịch sử phối hợp khi cần truy nguyên.

### Mốc đã xác minh

- Runtime V11: `b298d8b226a3634f6259ce6d2885da0ca2a4535c`
- Sửa production health/smoke: `9cd9dfab6eb925cdfaf597cd794bb03b72c110c3`
- Deploy production cuối: run `30038693404` — `SUCCESS`
- Production audit static/API/WebKit AES thật: run `30038397473` — `SUCCESS`

**Trạng thái bàn giao:** hệ thống đang chạy; chưa có lỗi mở trang trắng đã biết sau V11. Khi phát sinh lỗi mới, ưu tiên xác minh source thực tế trên `main`, Worker production và file Pages production trước khi thêm bất kỳ lớp vá nào.