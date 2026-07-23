# Bàn giao hệ thống ba webapp

> **Mọi agent phải đọc `AGENTS.md` trước file này.** Sau đó đọc `docs/handover/ACTIVE_TASKS.json` và `docs/handover/NHAT-KY-PHOI-HOP.md` trước khi sửa.

**Cập nhật:** 23/07/2026 16:47 (GMT+7)  
**Source ứng dụng đã deploy:** `bc8016a23c342ff93416003293148c06263242f8`  
**Commit ghi trạng thái production:** `b29e3ca66ee1da27631d881be34086ad4e3ac2d5`  
**Commit ghi E2E Reader + WebKit:** `1768f2c073571f51de9ba550a84786ba7b75573c`  
**Task đang hoạt động:** không có.  
**Production:** `SUCCESS`.  
**Reader + WebKit production E2E:** `SUCCESS — 201/200/200/200/200/401/401`.

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

`docs/handover/PRODUCTION_STATUS.md` cho source `bc8016a23c342ff93416003293148c06263242f8`:

- workflow deploy `29996510949`: success;
- Cloudflare Pages `200`;
- trang Admin `200`;
- Community CSS `200`;
- Gate runtime JS `200`;
- Worker/API thảo luận không phiên `401 unauthorized`, đúng kỳ vọng;
- onboarding payload sai `400 invalid_account`;
- thứ tự deploy: Pages trước, Worker sau.

`docs/handover/READER_E2E_STATUS.md` ghi workflow `29996558091`: success:

| Bước | HTTP/kết quả |
|---|---:|
| Đăng ký Reader thật | `201` |
| Đăng nhập từ thiết bị/nền tảng thứ hai | `200` |
| Đọc `/api/community/me` | `200` |
| WebKit gate production | `200` |
| Tự xóa tài khoản thử | `200` |
| Dùng lại token cũ | `401` |
| Đăng nhập lại sau xóa | `401 invalid_login` |

Mã lỗi: `none`. Tài khoản thử `e2e_reader_*` đã tự xóa trong cùng workflow.

---

## 2. `BOITOAN-20260723-09` — WebKit/iPhone crash loop

### Triệu chứng người dùng xác nhận

Safari/WebKit trên iPhone hiển thị: trang `/boitoan/` gặp sự cố liên tục và không thể mở.

### Lỗi gốc

- `applyMarketBranding()` tạo `MutationObserver` theo dõi `childList`.
- Observer gọi `injectCommunity()` sau mỗi mutation.
- Bản Account V3 từng gán `textContent` nhãn `Cộng đồng/Quản trị` vô điều kiện.
- Gán `textContent` tự tạo child-list mutation mới, observer lại gọi hàm, tạo vòng lặp vô hạn và làm tab WebKit sập.

### Runtime đã sửa

`injectCommunity()` hiện idempotent:

- chỉ đổi `href` nếu khác;
- chỉ đổi `textContent` nếu nhãn khác;
- chỉ đổi `aria-label` nếu khác;
- chỉ thêm body class nếu chưa có;
- vẫn giữ đúng một link Cộng đồng/Quản trị.

Marker production: `Account V3 iOS mutation guard`.

PR #43 merge runtime guard thành `4c4fa6911637ff6da5e2cf4da986f496d06ca8e3`.

### WebKit checker

`tools/webkit-production-check.mjs`:

1. mở HTML/CSS/JS production thật trong context WebKit iPhone sạch và theo dõi page crash;
2. tạo document plaintext tối thiểu cùng origin bằng route fulfill;
3. nạp đúng `/assets/gate.js` và `/assets/gate.css` production;
4. kích hoạt phiên Reader, `applyMarketBranding`, `MutationObserver` và `injectCommunity`;
5. yêu cầu đúng một `#gate-community-link`, nhãn đúng, tổng mutation hữu hạn và mutation delta ổn định;
6. xác nhận asset production có marker iOS guard;
7. ghi lỗi cụ thể qua `WEBKIT_E2E_ERROR` nếu thất bại.

Script không phụ thuộc `DECRYPT_KEY` hoặc login key, được `node --check` ở PR CI và ngay trước production run.

PR #45 merge checker cuối thành source `bc8016a23c342ff93416003293148c06263242f8`.

### Bằng chứng

- Account/frontend/Worker CI `29996444259`: success;
- coordination guard `29996444031`: success;
- production deploy `29996510949`: success;
- WebKit production E2E `29996558091`: success;
- WebKit không crash, DOM contract đạt, mutation ổn định.

---

## 3. `BOITOAN-20260723-08` — Hotfix Admin và Reader đa nền tảng

### Lối quản trị Admin

- Badge Admin là liên kết cảm ứng tới `community-admin.html`.
- Nhãn hiển thị `Admin · Mở quản trị` hoặc `Admin tổng · Mở quản trị`.
- Bottom navigation đổi mục `Cộng đồng` thành `Quản trị` khi đang ở phiên Admin.
- Trang quản trị có danh sách member, khóa/mở khóa/xóa member, `Xem trang cá nhân`, xóa review, quản lý bài thảo luận và đọc hội thoại riêng trên đúng thiết bị Admin tổng.

### Contract đăng ký/đăng nhập

- Public entry không phụ thuộc `DECRYPT_KEY` khi trang plaintext.
- Đăng ký/đăng nhập thành công trả community token, gate token và profile.
- `key` chỉ được trả khi thực sự có secret/payload mã hóa.
- Kiểm tra `SESSION_SECRET` diễn ra trước khi tạo account.

### Account V4

- Account mới dùng HMAC-SHA256 với salt riêng và pepper phía server từ `SESSION_SECRET`.
- Không lưu mật khẩu plaintext hoặc pepper trong KV/source.
- Verify PBKDF2 cũ vẫn được giữ để tương thích dữ liệu cũ.
- PUBLIC_RATE_LIMITER là best-effort; lỗi binding không làm hỏng đăng ký hợp lệ.
- Dispatcher dùng `return await ...` để bắt rejection bất đồng bộ đúng lớp.

### Tự xóa và thu hồi phiên

`DELETE /api/community/me` xóa login, profile, Reader index, device mapping, community session và gate session. Token impersonation bị chặn bằng `read_only_impersonation`.

---

## 4. Admin tổng xem Trang cá nhân member

- Danh sách tài khoản Admin có nút **`Xem trang cá nhân`**.
- URL dùng `admin_view=profile`.
- Token `mode=impersonation` mở thẳng `renderProfile()`.
- Hồ sơ hiển thị tên đăng nhập, tên hiển thị, vai trò, giới thiệu; Reader còn có chuyên môn và dữ liệu nhận phí/QR nếu có.
- Toàn bộ trường bị khóa, ghi rõ `Chế độ chỉ đọc`.
- Có `Quay lại Admin` và `← Quay lại khu vực Admin`.

---

## 5. Account V2 và vai trò

- Màn đầu chỉ có `Đăng nhập`, `Đăng ký`, `Admin`; chọn xong mới mở form riêng.
- Đăng ký chọn `Khách` hoặc `Reader / Người xem bói`.
- Checkbox/radio trên iPhone dùng kích thước native.
- Khách: danh sách Reader, chat, review, thảo luận, trang cá nhân.
- Reader: khách hàng/hội thoại, hồ sơ chuyên môn, nhận phí, thảo luận, trang cá nhân.
- Badge vai trò: `Khách`, `Reader / Người xem bói`, `Admin`, `Admin tổng`.

---

## 6. Runtime và build

Các file chính:

- `tools/apply-role-system.mjs` — lớp tài khoản nền;
- `tools/apply-account-v2.mjs` — template Account V2;
- `tools/apply-account-v2-runner.mjs` — runner build;
- `tools/apply-account-v2-profile-view.mjs` — Admin mở hồ sơ member;
- `tools/apply-account-v3-hotfix.mjs` — public entry, Admin navigation, self-delete/session cleanup, iOS mutation guard;
- `tools/apply-account-v4-edge-auth.mjs` — HMAC account mới, limiter fail-open, dispatcher await;
- `tools/webkit-production-check.mjs` — nghiệm thu WebKit production;
- `assets/gate.js`, `assets/gate.css` — gate/onboarding/Admin navigation;
- `assets/community.js`, `assets/community-admin.js`, `assets/community.css` — giao diện member/Admin;
- `backend/community.js` — account, Reader, review, chat, post, Admin, audit;
- `.github/workflows/validate-role-system.yml` — CI PR;
- `.github/workflows/deploy-pages.yml` — build/test/deploy/smoke;
- `.github/workflows/e2e-reader-production.yml` — Reader + WebKit E2E thật sau deploy.

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

- Lỗi WebKit/iPhone crash loop: **đã sửa và nghiệm thu bằng WebKit production**.
- Lối quản trị Admin trên app chính: **đã deploy**.
- Reader đăng ký đa nền tảng: **đã nghiệm thu production thật**.
- Admin tổng xem Trang cá nhân member: **đã deploy**.
- Cloudflare production: **SUCCESS**.
- Reader + WebKit production E2E: **SUCCESS**.
- Active task: **không có**.
- Khóa file: **đã giải phóng**.
- Đóng gói App Store/Google Play: chưa hoàn tất.
