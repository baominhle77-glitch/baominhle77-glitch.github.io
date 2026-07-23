# 🤝 NHẬT KÝ PHỐI HỢP GIỮA CÁC CÔNG CỤ AI

> File này để các AI/công cụ cùng làm trên repository nắm được phạm vi, bằng chứng kiểm thử và việc còn chờ.

**Thương hiệu hiển thị:** Spirituality Market.  
**Quy tắc điều phối:** đọc `AGENTS.md` và `docs/handover/ACTIVE_TASKS.json` trước khi sửa; không ghi mật khẩu, token hoặc secret vào repository.  
**Quy tắc độ tin cậy:** không kết luận source/production đã hoàn tất nếu chưa có log, test hoặc nghiệm thu thực tế.

---

## Trạng thái mật khẩu và hạ tầng

- **SPARE** (`/`) dùng mật khẩu riêng.
- **Bói toán** (`/boitoan/`) có hai cấp Admin được backend phân loại bằng hai mật khẩu khác nhau; chỉ lưu PBKDF2 hash + salt, không lưu plaintext.
- **MEDORA** (`/medora/`) giữ cơ chế truy cập riêng hiện hành.
- Không commit `*.src.html`, mật khẩu, token hoặc secret.
- Production frontend: `hiennhi89.pages.dev`.
- Backend: `hiennhi89-gate.hiennhi89.workers.dev`.

---

## Nhật ký thay đổi — mới nhất trên cùng

### 2026-07-23 19:33 GMT+7 — ChatGPT GPT-5.6 — BOITOAN-20260723-10 — HOÀN TẤT ✅

- Sửa dứt điểm lỗi xác thực hai lớp: người dùng chỉ đăng nhập **một lần** tại cùng mục `Admin`, backend nhận diện mật khẩu và cấp JWT gắn đúng `device_id`; trang Quản trị không hỏi mật khẩu lần hai.
- Phân cấp:
  - `regular` — Admin thường: quản lý, khóa/mở khóa và xóa member; xóa review; tạo, đóng, mở lại và xóa bài thảo luận chung.
  - `primary` — Admin tổng: toàn bộ quyền Admin thường, cộng quyền xem danh sách/nội dung hội thoại riêng và mở trang cá nhân member ở chế độ impersonation chỉ đọc.
- Backend cưỡng chế quyền độc lập với UI:
  - Admin thường gọi API hội thoại hoặc impersonation nhận `403 owner_device_required`;
  - JWT Admin chỉ dùng được trên đúng thiết bị đã đăng nhập;
  - chỉ một phiên/thiết bị Admin tổng hoạt động; đăng nhập primary trên thiết bị mới thu hồi primary cũ nhưng không thu hồi các phiên regular.
- `ADMIN_TOKEN` cũ không còn được chấp nhận tại Community API.
- Hai mật khẩu chỉ tồn tại dưới dạng PBKDF2-SHA256 hash + salt; không có plaintext trong source, test, log hoặc handover.
- Frontend lưu `market_admin_token` và cấp quyền do server trả về; Admin thường không thấy tab Hội thoại/nút `Xem trang cá nhân`, Admin tổng thấy đầy đủ.
- Cache Bói toán tăng `boitoan-v14` để Safari/iPhone nhận asset mới.
- PR #64 merge Account V6 thành `f5ac80b72005e1bc9f2d934ca4ffbdb57ec427a8`.
- CI cuối trước merge:
  - coordination `30005276397`: success;
  - Account V6/frontend/Worker `30005276313`: success.
- Production run `30007344122`:
  - Cloudflare Pages: success;
  - Worker: success;
  - hậu kiểm production Account V6/Travel/MEDORA: success;
  - trang Quản trị có badge cấp quyền, không còn form mật khẩu lần hai;
  - gate production có endpoint Admin login V6;
  - API phiên Admin không token trả `401 unauthorized`.
- Recorder ghi production `SUCCESS` tại source `b5ed52305192455d161c3e22934e3aeaada61eb3`; workflow gốc chỉ từng báo failure do bước ghi file trạng thái cũ sau khi deployment và smoke test đã đạt.
- Task chuyển `completed`; toàn bộ khóa điều phối đã giải phóng.

### 2026-07-23 18:54 GMT+7 — ChatGPT GPT-5.6 — TRAVEL-20260723-01 — HOÀN TẤT ✅

- Tạo PWA công khai `/vietnam-travel/`, tối ưu mobile/iPhone, có tìm kiếm không dấu, lọc vùng/loại, sắp xếp, yêu thích, chi tiết, bản đồ, chia sẻ và offline shell.
- Bộ seed gồm 20 địa điểm nổi tiếng/đặc thù của Việt Nam.
- Dữ liệu động lưu tại Cloudflare KV, khóa `travel:places:v1`; API công khai chỉ đọc ở `/api/travel/*`.
- Điều khiển Telegram owner-only: `/travel`, `/ds`, `/xem`, `/them`, `/sua`, `/an`, `/hien`, `/xoa` có xác nhận và `/thongke`.
- Bảo mật: webhook giữ secret header; module kiểm tra cả `chat.id` và `from.id` khớp `TELEGRAM_CHAT_ID`; source không chứa token, webhook secret hay Telegram ID dạng giá trị.
- Source thật materialize tại `b3a29cbd5416424a6df16bb4a7bd392a75287f5c`; bundle trung gian đã xóa.
- Travel unit test `5/5`, syntax và idempotent integration đạt.
- Validation run `30004367095`: success.
- Production deploy + smoke run `30004367100`, job `89196797196`: success; Pages, Worker, Travel health/API, dữ liệu seed và các app cũ đều đạt.
- Workflow kích hoạt tạm đã xóa; workflow production chuẩn `.github/workflows/deploy-pages.yml` đã bao gồm Vietnam Travel.
- Task chuyển `completed`; khóa điều phối đã giải phóng.

### 2026-07-23 16:47 GMT+7 — ChatGPT GPT-5.6 — BOITOAN-20260723-09 — HOÀN TẤT ✅

- Người dùng mở `/boitoan/` trên iPhone lúc 16:07 và WebKit báo trang gặp sự cố liên tục.
- Lỗi gốc đã xác lập từ source:
  - `applyMarketBranding()` tạo `MutationObserver` theo dõi `childList` và gọi `injectCommunity()`;
  - Account V3 từng gán `textContent` nhãn Cộng đồng/Quản trị ở mọi lần gọi;
  - thao tác đó tự tạo mutation mới, observer gọi lại hàm vô hạn, làm tab WebKit tăng tải và sập.
- Runtime sửa thành idempotent:
  - chỉ đổi `href`, `textContent`, `aria-label` và body class khi giá trị thực sự khác;
  - marker production: `Account V3 iOS mutation guard`;
  - contract test cấm quay lại cách gán `textContent` vô điều kiện.
- PR #43 merge runtime guard thành `4c4fa6911637ff6da5e2cf4da986f496d06ca8e3`.
- Bài browser test được tách thành `tools/webkit-production-check.mjs`, bắt buộc `node --check`, không phụ thuộc khóa giải mã bí mật.
- PR #45 merge checker cuối thành source `bc8016a23c342ff93416003293148c06263242f8`.
- CI trước merge:
  - Account/frontend/Worker `29996444259`: success;
  - coordination guard `29996444031`: success.
- Production deploy `29996510949`: success; Pages/Admin/CSS/Gate `200`, API không phiên `401`, onboarding payload sai `400`.
- **WebKit production E2E** run `29996558091`: success:
  - register Reader `201`;
  - login thiết bị/nền tảng thứ hai `200`;
  - `/api/community/me` `200`;
  - WebKit gate production `200` — trang sạch không crash; fixture cùng origin nạp đúng `gate.js` production, đúng một link Cộng đồng và mutation ổn định;
  - tự xóa account `200`;
  - token cũ `401`;
  - login lại `401 invalid_login`;
  - mã lỗi `none`.
- Tài khoản thử `e2e_reader_*` đã tự xóa. Task chuyển `completed`; không còn khóa file.

### 2026-07-23 15:58 GMT+7 — ChatGPT GPT-5.6 — BOITOAN-20260723-08 — HOÀN TẤT ✅

- Người dùng nghiệm thu trực tiếp trên iPhone và một nền tảng khác, phát hiện:
  - giao diện Admin chỉ có badge nhưng không có lối quản trị rõ ràng;
  - đăng ký Reader báo `Không thực hiện được`.
- Đã triển khai lối quản trị rõ:
  - badge `Admin/Admin tổng · Mở quản trị` là liên kết cảm ứng tới `community-admin.html`;
  - mục `Cộng đồng` ở bottom navigation đổi thành `Quản trị` khi đang ở phiên Admin;
  - trong trang quản trị vẫn có `Tài khoản member → Xem trang cá nhân`.
- Đã sửa contract đăng ký/đăng nhập:
  - trang plaintext không còn phụ thuộc `DECRYPT_KEY`;
  - mọi public entry thành công trả cả community token và gate token;
  - `key` chỉ là tùy chọn khi có payload mã hóa.
- Đã bổ sung `DELETE /api/community/me` cho member tự xóa tài khoản đã xác thực; xóa login, profile, Reader index, device mapping, community session và gate session. Phiên impersonation không được tự xóa member.
- Account V4:
  - account mới dùng HMAC-SHA256 với salt ngẫu nhiên và pepper phía server từ `SESSION_SECRET`;
  - không lưu mật khẩu plaintext hoặc pepper trong KV/source;
  - vẫn đọc được bản ghi PBKDF2 cũ;
  - rate limiter best-effort fail-open nếu binding lỗi.
- Lỗi gốc production `500 server` được xác định: `handleCommunity()` return Promise của các async handler mà không `await`, khiến rejection thoát khỏi `try/catch`. Đã đổi dispatcher thành `return await ...` cho mọi route async.
- PR #41 merge source `541194fbc63a73633fb857d4b90c221935b06309`.
- CI trước merge:
  - coordination guard `29992908287`: success;
  - Account V4/frontend/Worker `29992908212`: success.
- Production deploy `29993031238`: success; Pages/Admin/CSS/Gate `200`, API không phiên `401`, onboarding dữ liệu sai `400`.
- **E2E production thật** run `29993081236`: success:
  - register Reader `201`;
  - login từ thiết bị/nền tảng thứ hai `200`;
  - đọc `/me` `200`;
  - tự xóa `200`;
  - token cũ bị thu hồi `401`;
  - login lại sau xóa `401 invalid_login`;
  - mã lỗi an toàn `none`.
- Tài khoản thử có tiền tố `e2e_reader_` đã tự xóa trong cùng workflow.
- Task chuyển `completed`; không còn khóa file.

### 2026-07-23 14:34 GMT+7 — ChatGPT GPT-5.6 — BOITOAN-20260723-07 — HOÀN TẤT ✅

- Nút `Xem giao diện` cũ chỉ mở dashboard mặc định, không gọi `renderProfile()`.
- PR #33 merge source `9a6b53cc7e99d78ab53410df4d3d531aeef31caa`.
- Đổi thành `Xem trang cá nhân`, dùng `admin_view=profile`, mở hồ sơ đúng member ở chế độ chỉ đọc, có nút quay lại Admin.
- CI `29988447066`, `29988447104` và production `29988531212` đều success.

### 2026-07-23 13:56 GMT+7 — ChatGPT GPT-5.6 — BOITOAN-20260723-06 — HOÀN TẤT ✅

- PR #31 merge source `61c0dc0efbddf3c865c44d001d022d80cf0185d9`.
- Triển khai Account V2: onboarding hai màn hình, input iPhone, nhánh plaintext, badge vai trò, giao diện theo role, quyền Admin và impersonation chỉ đọc.
- CI `29986274969`, `29986275030`; production `29986415052`: success.

### 2026-07-23 12:20 GMT+7 — ChatGPT GPT-5.6 — BOITOAN-20260723-05 — HOÀN TẤT ✅

- PR #28 merge source `d48ef93137c35e38ee64004dfb0cdaee9c04fd83`.
- Đổi branding thành `Spirituality Market`, chuẩn hóa `Admin`, đưa đăng nhập/đăng ký member lên cửa đầu. Bố cục này sau đó được Account V2 thay thế.

### 2026-07-23 10:30 GMT+7 — ChatGPT GPT-5.6 — BOITOAN-20260723-04 — HOÀN TẤT ✅

- PR #26 merge source `3322b7c899aeeee3d2e98e26e4cbc97931390a77`.
- Gỡ các hộp `Khung luận…` và `Kết nối toàn trải bài`; giữ thuật toán gốc, Cộng đồng, tài khoản, chat, review và thanh toán.
