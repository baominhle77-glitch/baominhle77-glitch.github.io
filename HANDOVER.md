# Bàn giao hệ thống bốn webapp

> **Mọi agent phải đọc `AGENTS.md` trước file này.** Sau đó đọc `docs/handover/ACTIVE_TASKS.json` và `docs/handover/NHAT-KY-PHOI-HOP.md` trước khi sửa.

**Cập nhật:** 23/07/2026 19:33 (GMT+7)  
**Source Account V6 đã deploy:** `b5ed52305192455d161c3e22934e3aeaada61eb3`  
**Source Vietnam Travel:** `b3a29cbd5416424a6df16bb4a7bd392a75287f5c`  
**Validation Vietnam Travel:** run `30004367095`  
**Deploy + production smoke Account V6:** run `30007344122`  
**Task đang hoạt động:** không có.  
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

### Bằng chứng production Account V6 gần nhất

`docs/handover/PRODUCTION_STATUS.md` ghi:

- trạng thái production: `SUCCESS`;
- source `b5ed52305192455d161c3e22934e3aeaada61eb3`;
- workflow run `30007344122`;
- Cloudflare Pages: success;
- Worker: success;
- hậu kiểm production: success;
- trang Quản trị không còn form mật khẩu lần hai;
- gate production có Account V6 và endpoint `/api/community/admin/login`;
- API `/api/community/admin/session` không token trả `401 unauthorized`.

Workflow gốc từng có conclusion `FAILURE` vì bước ghi file trạng thái cũ chạy sau khi worktree đã bị build thay đổi. Các bước build/test, deploy Pages, deploy Worker và smoke production đều đã success. Recorder mới đọc trực tiếp job steps để phân biệt lỗi ghi trạng thái với lỗi production.

### Reader + WebKit E2E

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

## 2. `BOITOAN-20260723-10` — Account V6 hai cấp Admin

### Luồng đăng nhập

- Cửa đầu vẫn có một lựa chọn **Admin** duy nhất.
- Người dùng nhập một trong hai mật khẩu Admin tại cùng form.
- Backend xác minh PBKDF2-SHA256 và trả cấp `regular` hoặc `primary`.
- Frontend lưu JWT Admin gắn `device_id`, rồi chuyển thẳng tới `community-admin.html`.
- Trang Quản trị không hỏi mật khẩu lần hai.
- Mật khẩu không được dùng làm Bearer token.

### Admin thường — `regular`

- Xem danh sách tài khoản member.
- Khóa/mở khóa member.
- Xóa tài khoản member.
- Xóa review.
- Tạo, đóng, mở lại và xóa bài thảo luận chung.
- Không được đọc hội thoại riêng.
- Không được mở trang cá nhân member bằng phiên impersonation.
- UI ẩn tab Hội thoại và nút `Xem trang cá nhân`; backend vẫn trả `403 owner_device_required` nếu gọi API trực tiếp.

### Admin tổng — `primary`

- Có toàn bộ quyền của Admin thường.
- Xem danh sách và nội dung toàn bộ hội thoại riêng giữa member.
- Mở trang cá nhân member bằng token impersonation chỉ đọc.
- Không thể gửi tin, đăng bình luận hoặc xóa dữ liệu dưới danh nghĩa member.
- Chỉ một thiết bị có phiên Admin tổng hoạt động tại một thời điểm.
- Đăng nhập primary trên thiết bị mới thu hồi các phiên primary cũ nhưng không thu hồi phiên regular.

### Phiên và bảo mật

- JWT Admin có `aud=community-admin`, `level=regular|primary`, `device_id`, `auth_version` và thời hạn.
- Phiên lưu trong Workers KV dưới `community-admin-session:*`.
- JWT chỉ dùng được khi header `x-owner-device-id` khớp thiết bị trong token/session.
- `ADMIN_TOKEN` cũ không còn được chấp nhận tại Community API.
- Hai mật khẩu chỉ tồn tại dưới dạng PBKDF2 hash + salt; không có plaintext trong source, log hoặc tài liệu.
- Đăng xuất gọi `DELETE /api/community/admin/session` và thu hồi phiên server-side.
- Cache Bói toán hiện là `boitoan-v14`.

### Source và build

- `tools/apply-admin-session-v5.mjs` — đăng nhập Admin một lần và JWT gắn thiết bị.
- `tools/apply-admin-levels-v6.mjs` — phân `regular`/`primary`, duy nhất một primary.
- `tools/apply-admin-v5-v6-runner.mjs` — runner idempotent V5–V6.
- `tools/apply-account-v2-runner.mjs` — nối Account V2–V6.
- `backend/account-v2.test.mjs` — test đầy đủ hai cấp quyền và chuyển thiết bị primary.
- `backend/community.test.mjs` — test Community bằng JWT Admin tổng.
- `assets/account-v2.test.mjs`, `assets/gate.test.mjs` — contract frontend và cấm plaintext.

### Bằng chứng

- PR #64 merge Account V6 thành `f5ac80b72005e1bc9f2d934ca4ffbdb57ec427a8`.
- Coordination run `30005276397`: success.
- Account V6/frontend/Worker run `30005276313`: success.
- Production run `30007344122`: Pages/Worker/smoke đều success.
- Recorder production source `b5ed52305192455d161c3e22934e3aeaada61eb3`: `SUCCESS`.

---

## 3. `TRAVEL-20260723-01` — Việt Nam Đi Đâu?

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

## 4. `BOITOAN-20260723-09` — WebKit/iPhone crash loop

### Triệu chứng và lỗi gốc

Safari/WebKit trên iPhone từng báo `/boitoan/` gặp sự cố liên tục. `MutationObserver` gọi `injectCommunity()`; bản cũ gán `textContent` vô điều kiện, tự tạo mutation mới và lặp đến khi tab sập.

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
4. kích hoạt phiên Reader, `MutationObserver` và `injectCommunity`;
5. yêu cầu đúng một link, tổng mutation hữu hạn và mutation delta ổn định;
6. xác nhận asset production có marker iOS guard.

Bằng chứng: CI `29996444259`, coordination `29996444031`, production `29996510949`, WebKit E2E `29996558091` đều success.

---

## 5. Account V4 — Reader đa nền tảng

- Public entry không phụ thuộc `DECRYPT_KEY` khi trang plaintext.
- Đăng ký/đăng nhập thành công trả community token, gate token và profile.
- Account mới dùng HMAC-SHA256 với salt riêng và pepper phía server từ `SESSION_SECRET`.
- Không lưu mật khẩu plaintext hoặc pepper trong KV/source.
- Verify PBKDF2 cũ vẫn được giữ để tương thích dữ liệu cũ.
- PUBLIC_RATE_LIMITER là best-effort; lỗi binding không làm hỏng đăng ký hợp lệ.
- Dispatcher dùng `return await ...` để bắt rejection bất đồng bộ đúng lớp.
- `DELETE /api/community/me` xóa login, profile, Reader index, device mapping, community session và gate session.
- Token impersonation bị chặn bằng `read_only_impersonation`.

Bằng chứng: PR #41, source `541194fbc63a73633fb857d4b90c221935b06309`, production `29993031238`, E2E `29993081236` success.

---

## 6. Admin tổng xem Trang cá nhân member

- Danh sách tài khoản Admin tổng có nút **`Xem trang cá nhân`**.
- URL dùng `admin_view=profile`.
- Token `mode=impersonation` mở thẳng `renderProfile()`.
- Hồ sơ hiển thị tên đăng nhập, tên hiển thị, vai trò, giới thiệu; Reader còn có chuyên môn và dữ liệu nhận phí/QR nếu có.
- Toàn bộ trường bị khóa, ghi rõ `Chế độ chỉ đọc`.
- Có `Quay lại Admin` và `← Quay lại khu vực Admin`.
- Account V6 hiện cưỡng chế chức năng này chỉ dành cho `primary`.

---

## 7. Account V2 và vai trò member

- Màn đầu chỉ có `Đăng nhập`, `Đăng ký`, `Admin`; chọn xong mới mở form riêng.
- Đăng ký chọn `Khách` hoặc `Reader / Người xem bói`.
- Checkbox/radio trên iPhone dùng kích thước native.
- Khách: danh sách Reader, chat, review, thảo luận, trang cá nhân.
- Reader: khách hàng/hội thoại, hồ sơ chuyên môn, nhận phí, thảo luận, trang cá nhân.
- Badge vai trò: `Khách`, `Reader / Người xem bói`, `Admin`, `Admin tổng`.

---

## 8. Runtime và workflow chính

### Travel

- `vietnam-travel/index.html`, `app.css`, `app.js`, `data/seed-places.js`.
- `vietnam-travel/manifest.webmanifest`, `sw.js`, `icon.svg`.
- `backend/travel.js`, `backend/travel.test.mjs`.
- `tools/apply-travel-system.mjs`.
- `.github/workflows/validate-vietnam-travel.yml`.

### Bói toán/Account

- `tools/apply-role-system.mjs` — lớp tài khoản nền.
- `tools/apply-account-v2.mjs` — template Account V2.
- `tools/apply-account-v2-runner.mjs` — runner V2–V6.
- `tools/apply-account-v2-profile-view.mjs` — hồ sơ member chỉ đọc.
- `tools/apply-account-v3-hotfix.mjs` — public entry, navigation, self-delete, iOS guard.
- `tools/apply-account-v4-edge-auth.mjs` — HMAC member, limiter fail-open, dispatcher await.
- `tools/apply-admin-session-v5.mjs` — JWT Admin gắn thiết bị.
- `tools/apply-admin-levels-v6.mjs` — regular/primary.
- `tools/apply-admin-v5-v6-runner.mjs` — runner riêng V5–V6.
- `tools/webkit-production-check.mjs` — nghiệm thu WebKit.
- `assets/gate.js`, `assets/gate.css` — gate/onboarding/Admin navigation.
- `assets/community.js`, `assets/community-admin.js`, `assets/community.css` — UI member/Admin.
- `backend/community.js` — account, Reader, review, chat, post, Admin, audit.

### CI/deploy

- `.github/workflows/validate-role-system.yml` — CI Account PR.
- `.github/workflows/deploy-pages.yml` — build/test/deploy/smoke bốn app.
- `.github/workflows/record-production-deploy.yml` — ghi trạng thái production từ job steps thực tế.
- `.github/workflows/e2e-reader-production.yml` — Reader + WebKit E2E.

Các lớp tích hợp phải idempotent; CI chạy lặp để bắt lỗi nhân đôi mã.

---

## 9. Dữ liệu và bảo mật

- Community session tối đa 30 ngày; chat giữ tối đa 30 ngày.
- Reader bị cấm chèn đường dẫn vào hồ sơ/thông tin nhận phí.
- Review 1–5 sao; Khách gỡ review của mình, Admin gỡ được, Reader không gỡ được.
- Dữ liệu “thiết bị” là hồ sơ trình duyệt best-effort, không chứng minh chắc chắn thiết bị vật lý.
- Không hardcode mật khẩu Admin, IP, Telegram ID hoặc mã thiết bị chủ vào source.
- Admin password hash và salt không phải plaintext, nhưng vẫn không được sao chép ra ngoài mục đích build/test của repository.

---

## 10. Trạng thái cuối

- Account V6 hai cấp Admin: **đã merge, deploy và smoke test production thành công**.
- Admin đăng nhập một lần: **đã triển khai; không còn màn mật khẩu lần hai**.
- Admin thường: **member/review/post**.
- Admin tổng: **toàn bộ quyền Admin thường + hội thoại riêng + trang cá nhân member; một thiết bị primary**.
- Vietnam Travel source: **đã có trên `main`**.
- Vietnam Travel Cloudflare Pages + Worker: **đã deploy và smoke test thành công**.
- Điều khiển Travel qua Telegram: **đã tích hợp và test quyền/lệnh; chờ chủ bot gửi `/travel` để nghiệm thu hội thoại trực tiếp**.
- Lỗi WebKit/iPhone crash loop: **đã sửa và nghiệm thu bằng WebKit production**.
- Reader đăng ký đa nền tảng: **đã nghiệm thu production thật**.
- Cloudflare production: **SUCCESS**.
- Reader + WebKit production E2E: **SUCCESS**.
- Active task: **không có**.
- Khóa file: **đã giải phóng**.
- Đóng gói App Store/Google Play: chưa hoàn tất.
