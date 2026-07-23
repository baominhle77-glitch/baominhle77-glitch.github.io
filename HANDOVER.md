# Bàn giao hệ thống bốn webapp

> **Mọi agent phải đọc `AGENTS.md` trước file này.** Sau đó đọc `docs/handover/ACTIVE_TASKS.json` và `docs/handover/NHAT-KY-PHOI-HOP.md` trước khi sửa.

**Cập nhật:** 23/07/2026 18:58 (GMT+7)  
**Source Bói toán đã deploy:** `bc8016a23c342ff93416003293148c06263242f8`  
**Source Vietnam Travel:** `b3a29cbd5416424a6df16bb4a7bd392a75287f5c`  
**Validation Vietnam Travel:** run `30004367095`  
**Deploy + production smoke Vietnam Travel:** run `30004367100`, job `89196797196`  
**Task đang hoạt động:** `BOITOAN-20260723-10` — Account V6; xem `docs/handover/ACTIVE_TASKS.json`  
**Production hiện tại:** `SUCCESS`  
**Reader + WebKit production E2E:** `SUCCESS — 201/200/200/200/200/401/401`

## Nguyên tắc độ tin cậy bắt buộc

- Không tuyên bố source hoặc production hoàn tất nếu chưa có log/test/nghiệm thu tương ứng.
- Khi chưa đủ dữ liệu, ghi rõ **chưa xác lập/chưa đủ chứng cứ**.
- Không đưa mật khẩu, token, Telegram Chat ID, IP đầy đủ, mã thiết bị cá nhân, QR, chat hoặc secret vào repository.
- Không sửa trực tiếp `main`; dùng Task-ID, branch, PR, CI và file bàn giao.

---

## 1. Webapp và production

| App | Nguồn | Production |
|---|---|---|
| Bói toán / Spirituality Market | `boitoan/`, `assets/`, `backend/` | `https://hiennhi89.pages.dev/boitoan/` |
| SPARE | root | `https://hiennhi89.pages.dev/` |
| MEDORA | `medora/` | `https://hiennhi89.pages.dev/medora/` |
| Việt Nam Đi Đâu? | `vietnam-travel/`, `backend/travel.js` | `https://hiennhi89.pages.dev/vietnam-travel/` |

Repository `baominhle77-glitch/baominhle77-glitch.github.io` là nguồn chuẩn duy nhất. Backend dùng chung: `https://hiennhi89-gate.hiennhi89.workers.dev`.

### Bằng chứng production Bói toán/Reader gần nhất

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

### Bằng chứng production Vietnam Travel

- Source thật trên `main`: `b3a29cbd5416424a6df16bb4a7bd392a75287f5c`.
- Unit test Travel: `5/5` đạt.
- Validation workflow run `30004367095`: success.
- Production deploy + smoke run `30004367100`, job `89196797196`: success.
- Cloudflare Pages, Worker, Travel page, Travel health/API và seed đều đạt.
- Smoke regression cho SPARE, Bói toán và MEDORA đều đạt.

---

## 2. `TRAVEL-20260723-01` — Việt Nam Đi Đâu?

### Chức năng đã triển khai

- PWA công khai, responsive, tối ưu điện thoại/iPhone và có offline shell.
- Tìm kiếm không dấu, lọc theo vùng/loại hình và sắp xếp.
- Lưu yêu thích bằng `localStorage`.
- Trang chi tiết địa điểm, bản đồ, nguồn tham khảo và chia sẻ.
- Seed 20 địa điểm nổi tiếng/đặc thù của Việt Nam.
- API công khai chỉ đọc tại `/api/travel/*`.
- Dữ liệu lưu trong Cloudflare Workers KV, khóa `travel:places:v1`.
- Giới hạn phiên bản KV hiện tại: 1.000 địa điểm.

### Điều khiển bằng Telegram Bot hiện có

- `/travel`, `/dulich`, `/diadiem`: hướng dẫn.
- `/ds [từ khóa]`: danh sách.
- `/xem <id>`: xem chi tiết.
- `/them`: thêm địa điểm bằng các dòng trường.
- `/sua <id>`: sửa.
- `/an <id>`, `/hien <id>`: ẩn/hiện trên web.
- `/xoa <id>`: xóa sau nút xác nhận.
- `/thongke`: thống kê.

Bot chỉ xử lý mutation khi cả `chat.id` và `from.id` khớp `TELEGRAM_CHAT_ID`. Webhook chung vẫn xác thực `X-Telegram-Bot-Api-Secret-Token`.

### Bảo mật và dữ liệu

- Không lưu bot token, webhook secret hoặc Telegram ID dạng giá trị trong source.
- URL nhập qua bot chỉ nhận `https://` và không nhận credential trong URL.
- API chỉ trả bản ghi `published=true`.
- Dữ liệu hỏng được sao lưu tạm 7 ngày dưới khóa `travel:places:v1:corrupt:*`, sau đó khôi phục seed.
- Cloudflare KV có tính nhất quán cuối cùng; cập nhật mới có thể cần tải lại sau một khoảng ngắn tại một số điểm mạng.

### Kiểm thử và production

- SHA-256 archive: `1511d9f80024a4a495e955e88680b4400a3d20973afd530edcb509457dbcad30` — đạt.
- Log: `docs/handover/MATERIALIZE_TRAVEL_DIAGNOSTIC.log`.
- Đã test parser tiếng Việt, seed/public filter, quyền chủ bot, thêm/sửa/ẩn/hiện/xóa, lọc vùng/danh mục và tích hợp idempotent vào Worker.
- `/vietnam-travel/` trả `200`, đúng tiêu đề `Việt Nam Đi Đâu?`.
- `/api/travel/health` trả `200`, service `vietnam-travel`.
- `/api/travel/places` trả `200`, có seed `vinh-ha-long`.

### Nghiệm thu Telegram trực tiếp

Chủ bot gửi `/travel` trong Telegram và kiểm bot trả hướng dẫn. Đây là thao tác hội thoại thực tế không tự động gửi thay người dùng trong CI.

Tài liệu chi tiết: `docs/handover/VIETNAM_TRAVEL.md`.

---

## 3. `BOITOAN-20260723-09` — WebKit/iPhone crash loop

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

## 4. `BOITOAN-20260723-08` — Hotfix Admin và Reader đa nền tảng

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

## 5. Admin tổng xem Trang cá nhân member

- Danh sách tài khoản Admin có nút **`Xem trang cá nhân`**.
- URL dùng `admin_view=profile`.
- Token `mode=impersonation` mở thẳng `renderProfile()`.
- Hồ sơ hiển thị tên đăng nhập, tên hiển thị, vai trò, giới thiệu; Reader còn có chuyên môn và dữ liệu nhận phí/QR nếu có.
- Toàn bộ trường bị khóa, ghi rõ `Chế độ chỉ đọc`.
- Có `Quay lại Admin` và `← Quay lại khu vực Admin`.

---

## 6. Account V2 và vai trò

- Màn đầu chỉ có `Đăng nhập`, `Đăng ký`, `Admin`; chọn xong mới mở form riêng.
- Đăng ký chọn `Khách` hoặc `Reader / Người xem bói`.
- Checkbox/radio trên iPhone dùng kích thước native.
- Khách: danh sách Reader, chat, review, thảo luận, trang cá nhân.
- Reader: khách hàng/hội thoại, hồ sơ chuyên môn, nhận phí, thảo luận, trang cá nhân.
- Badge vai trò: `Khách`, `Reader / Người xem bói`, `Admin`, `Admin tổng`.

---

## 7. Runtime và build

### Travel

- `vietnam-travel/index.html`
- `vietnam-travel/app.css`
- `vietnam-travel/app.js`
- `vietnam-travel/data/seed-places.js`
- `vietnam-travel/manifest.webmanifest`
- `vietnam-travel/sw.js`
- `vietnam-travel/icon.svg`
- `backend/travel.js`
- `backend/travel.test.mjs`
- `tools/apply-travel-system.mjs`
- `.github/workflows/validate-vietnam-travel.yml`
- `.github/workflows/deploy-pages.yml`

### Bói toán/Account

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

Các lớp tích hợp phải idempotent; CI chạy lặp để bắt lỗi nhân đôi mã.

---

## 8. Dữ liệu và bảo mật

- Community session tối đa 30 ngày; chat giữ tối đa 30 ngày.
- Reader bị cấm chèn đường dẫn vào hồ sơ/thông tin nhận phí.
- Review 1–5 sao; Khách gỡ review của mình, Admin gỡ được, Reader không gỡ được.
- Dữ liệu “thiết bị” là hồ sơ trình duyệt best-effort, không chứng minh chắc chắn thiết bị vật lý.
- Không hardcode mật khẩu Admin, IP, Telegram ID hoặc mã thiết bị chủ vào source.

---

## 9. Trạng thái cuối

- Vietnam Travel source: **đã có trên `main`**.
- Vietnam Travel Cloudflare Pages + Worker: **đã deploy và smoke test thành công**.
- Điều khiển Travel qua Telegram: **đã tích hợp và test quyền/lệnh; chờ chủ bot gửi `/travel` để nghiệm thu hội thoại trực tiếp**.
- Lỗi WebKit/iPhone crash loop: **đã sửa và nghiệm thu bằng WebKit production**.
- Lối quản trị Admin trên app chính: **đã deploy**.
- Reader đăng ký đa nền tảng: **đã nghiệm thu production thật**.
- Admin tổng xem Trang cá nhân member: **đã deploy**.
- Cloudflare production: **SUCCESS**.
- Reader + WebKit production E2E: **SUCCESS**.
- Active task: `BOITOAN-20260723-10` đang thực hiện Account V6; không thuộc phạm vi Travel.
- Khóa Travel: **đã giải phóng**.
- Đóng gói App Store/Google Play: chưa hoàn tất.
