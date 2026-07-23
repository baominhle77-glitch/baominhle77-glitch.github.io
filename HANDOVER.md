# Bàn giao hệ thống ba webapp

> **Mọi agent phải đọc `AGENTS.md` trước file này.** Sau đó đọc `docs/handover/ACTIVE_TASKS.json` và `docs/handover/NHAT-KY-PHOI-HOP.md` trước khi sửa.

**Cập nhật:** 23/07/2026 15:58 (GMT+7)  
**Source ứng dụng đã deploy:** `541194fbc63a73633fb857d4b90c221935b06309`  
**Commit ghi trạng thái production:** `fd2f7e11be0b7e619eb453e8610da20a666447d6`  
**Commit ghi E2E Reader:** `d8b3605e8d4a7bd2fb682e8745732f472cabf977`  
**Task đang hoạt động:** không có.  
**Production:** `SUCCESS`.  
**Reader production E2E:** `SUCCESS — 201/200/200/200/401/401`.

## Nguyên tắc độ tin cậy bắt buộc

- Không tuyên bố source hoặc production hoàn tất nếu chưa có log/test/nghiệm thu tương ứng.
- Khi chưa đủ dữ liệu, ghi rõ **chưa xác lập/chưa đủ chứng cứ**.
- Không đưa mật khẩu, token, IP đầy đủ, mã thiết bị cá nhân, QR, chat hoặc secret vào repository.

---

## 1. Webapp và production

| App | Nguồn | Production |
|---|---|---|
| Bói toán / Spirituality Market | `boitoan/`, `assets/`, `backend/` | `https://hiennhi89.pages.dev/boitoan/` |
| SPARE | root | `https://hiennhi89.pages.dev/` |
| MEDORA | `medora/` | `https://hiennhi89.pages.dev/medora/` |

Repository `baominhle77-glitch/baominhle77-glitch.github.io` là nguồn chuẩn duy nhất.

### Bằng chứng production gần nhất

`docs/handover/PRODUCTION_STATUS.md` ghi cho source `541194fbc63a73633fb857d4b90c221935b06309`:

- workflow deploy `29993031238`: success;
- Cloudflare Pages `200`;
- trang Admin `200`;
- Community CSS `200`;
- Gate runtime JS `200`;
- Worker/API thảo luận không phiên `401 unauthorized`, đúng kỳ vọng;
- onboarding payload sai `400 invalid_account`;
- thứ tự deploy: Pages trước, Worker sau.

`docs/handover/READER_E2E_STATUS.md` ghi workflow `29993081236`: success:

| Bước | HTTP |
|---|---:|
| Đăng ký Reader thật | `201` |
| Đăng nhập từ thiết bị/nền tảng thứ hai | `200` |
| Đọc `/api/community/me` | `200` |
| Tự xóa tài khoản thử | `200` |
| Dùng lại token cũ | `401` |
| Đăng nhập lại sau xóa | `401 invalid_login` |

Mã lỗi an toàn: `none`. Tài khoản thử `e2e_reader_*` đã tự xóa trong cùng workflow.

---

## 2. `BOITOAN-20260723-08` — Hotfix Admin và Reader đa nền tảng

### Lỗi người dùng nghiệm thu

1. Phiên Admin trên app chính chỉ hiện badge; không có lối quản trị rõ ràng.
2. Đăng ký Reader trên một thiết bị/nền tảng khác báo lỗi chung.

### Lối quản trị Admin

- Badge Admin là liên kết cảm ứng tới `community-admin.html`.
- Nhãn hiển thị `Admin · Mở quản trị` hoặc `Admin tổng · Mở quản trị`.
- Bottom navigation đổi mục `Cộng đồng` thành `Quản trị` khi đang ở phiên Admin.
- Trang quản trị có:
  - danh sách member;
  - khóa/mở khóa/xóa member;
  - `Xem trang cá nhân`;
  - xóa review;
  - tạo/đóng/mở lại/xóa bài thảo luận;
  - đọc hội thoại riêng trên đúng thiết bị Admin tổng.

### Contract đăng ký/đăng nhập

- Trang Bói toán hiện là plaintext sau gate; public entry không phụ thuộc `DECRYPT_KEY`.
- Đăng ký/đăng nhập thành công luôn trả:
  - community token;
  - gate token;
  - profile.
- `key` chỉ được trả khi thực sự có secret/payload mã hóa.
- Kiểm tra `SESSION_SECRET` diễn ra trước khi tạo account để tránh account mồ côi do lỗi cấp phiên.

### Account V4 — xác thực phù hợp edge

- Account mới dùng HMAC-SHA256 với:
  - salt ngẫu nhiên riêng từng tài khoản;
  - pepper phía server lấy từ `SESSION_SECRET`.
- Không lưu mật khẩu plaintext hoặc pepper trong KV/source.
- Verify PBKDF2 cũ vẫn được giữ để tương thích account đã tạo trước Account V4.
- PUBLIC_RATE_LIMITER là lớp chống spam best-effort; lỗi binding không được làm hỏng đăng ký hợp lệ.
- Register/login có mã lỗi theo pha để chẩn đoán an toàn.

### Lỗi gốc `500 server`

`handleCommunity()` có `try/catch` nhưng dispatcher từng dùng `return handleRegister(...)`/`return handleLogin(...)` mà không `await`. Rejection bất đồng bộ thoát khỏi catch của module Cộng đồng và bị Worker ngoài cùng đổi thành `{ error: "server" }`.

Bản cuối dùng `return await ...` cho toàn bộ async route, nên:

- lỗi được bắt đúng lớp;
- mã pha được trả đúng;
- production E2E đã vượt toàn bộ luồng.

### Tự xóa và thu hồi phiên

`DELETE /api/community/me` cho member đã xác thực tự xóa chính mình:

- xóa login;
- xóa profile;
- xóa Reader index;
- xóa device mapping;
- thu hồi community session;
- thu hồi gate session.

Token `impersonation` bị chặn bằng `read_only_impersonation`, không thể xóa member.

### Bằng chứng CI/merge

- PR #41 merge source `541194fbc63a73633fb857d4b90c221935b06309`.
- Coordination guard `29992908287`: success.
- Account V4/frontend/Worker `29992908212`: success.
- Production deploy `29993031238`: success.
- Reader production E2E `29993081236`: success.

---

## 3. Admin tổng xem Trang cá nhân member

- Danh sách tài khoản Admin có nút **`Xem trang cá nhân`**.
- URL dùng `admin_view=profile`.
- Token `mode=impersonation` mở thẳng `renderProfile()`.
- Hồ sơ hiển thị tên đăng nhập, tên hiển thị, vai trò và giới thiệu.
- Reader còn hiển thị chuyên môn, ngân hàng, số tài khoản, tên chủ tài khoản và QR nếu có.
- Toàn bộ trường bị khóa, ghi rõ `Chế độ chỉ đọc`.
- Có `Quay lại Admin` và `← Quay lại khu vực Admin`.

---

## 4. Account V2 và vai trò

### Onboarding

- Màn đầu chỉ có `Đăng nhập`, `Đăng ký`, `Admin`.
- Chọn xong mới mở biểu mẫu riêng và có nút quay lại.
- Đăng ký phải chọn `Khách` hoặc `Reader / Người xem bói`.
- Checkbox/radio trên iPhone dùng kích thước native.

### Giao diện theo role

- Khách: danh sách Reader, chat, review, thảo luận, trang cá nhân.
- Reader: khách hàng/hội thoại, hồ sơ chuyên môn, nhận phí, thảo luận, trang cá nhân.
- Badge vai trò: `Khách`, `Reader / Người xem bói`, `Admin`, `Admin tổng`.

### Quyền Admin

- khóa/mở khóa/xóa member;
- xóa review;
- tạo/đóng/mở lại/xóa bài thảo luận;
- xem trang cá nhân member;
- Admin tổng đọc chat và impersonation chỉ đọc có audit.

---

## 5. Telegram khi đăng ký mới

Thông báo best-effort có thể gồm vai trò, tên hiển thị, username, browser/platform, màn hình, ngôn ngữ, múi giờ, quốc gia, IP rút gọn, mã hồ sơ trình duyệt và thời điểm.

Không gửi mật khẩu, thông tin ngân hàng hoặc QR. Telegram chưa có bằng chứng riêng biệt rằng bot đã nhận mọi lần; E2E production xác nhận luồng account, không thay thế kiểm tra delivery của Telegram.

---

## 6. Runtime và build

Các file chính:

- `tools/apply-role-system.mjs` — lớp tài khoản nền;
- `tools/apply-account-v2.mjs` — template Account V2;
- `tools/apply-account-v2-runner.mjs` — runner build;
- `tools/apply-account-v2-profile-view.mjs` — Admin mở hồ sơ member;
- `tools/apply-account-v3-hotfix.mjs` — public entry, Admin navigation, self-delete/session cleanup;
- `tools/apply-account-v4-edge-auth.mjs` — HMAC account mới, limiter fail-open, dispatcher await;
- `assets/gate.js`, `assets/gate.css` — gate/onboarding/Admin navigation;
- `assets/community.js`, `assets/community-admin.js`, `assets/community.css` — giao diện member/Admin;
- `backend/community.js` — account, Reader, review, chat, post, Admin, audit;
- `.github/workflows/validate-role-system.yml` — CI PR;
- `.github/workflows/deploy-pages.yml` — build/test/deploy/smoke;
- `.github/workflows/e2e-reader-production.yml` — E2E thật sau deploy.

Các lớp V3/V4 phải idempotent; CI chạy lặp để bắt lỗi nhân đôi mã.

---

## 7. Dữ liệu và bảo mật

- Community session tối đa 30 ngày; chat giữ tối đa 30 ngày.
- Reader bị cấm chèn đường dẫn vào hồ sơ/thông tin nhận phí.
- Review 1–5 sao; Khách gỡ review của mình, Admin gỡ được, Reader không gỡ được.
- Dữ liệu “thiết bị” là hồ sơ trình duyệt best-effort, không chứng minh chắc chắn thiết bị vật lý.
- Không hardcode mật khẩu Admin, IP hoặc mã thiết bị chủ vào source.

---

## 8. Trạng thái cuối

- Lối quản trị Admin trên app chính: **đã deploy**.
- Reader đăng ký đa nền tảng: **đã nghiệm thu production thật**.
- Admin tổng xem Trang cá nhân member: **đã deploy**.
- Cloudflare production: **SUCCESS**.
- Reader production E2E: **SUCCESS**.
- Active task: **không có**.
- Khóa file: **đã giải phóng**.
- Đóng gói App Store/Google Play: chưa hoàn tất.

---

Xem thêm: `AGENTS.md`, `docs/handover/ACTIVE_TASKS.json`, `docs/handover/NHAT-KY-PHOI-HOP.md`, `docs/handover/PRODUCTION_STATUS.md`, `docs/handover/READER_E2E_STATUS.md`.
