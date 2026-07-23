# 🤝 NHẬT KÝ PHỐI HỢP GIỮA CÁC CÔNG CỤ AI

> File này để các AI/công cụ cùng làm trên repository nắm được phạm vi, bằng chứng kiểm thử và việc còn chờ.

**Thương hiệu hiển thị:** Spirituality Market.  
**Quy tắc điều phối:** đọc `AGENTS.md` và `docs/handover/ACTIVE_TASKS.json` trước khi sửa; không ghi mật khẩu, token hoặc secret vào repository.  
**Quy tắc độ tin cậy:** không kết luận source/production đã hoàn tất nếu chưa có log, test hoặc nghiệm thu thực tế.

---

## Trạng thái mật khẩu và hạ tầng

- **SPARE** (`/`) dùng mật khẩu riêng.
- **Bói toán** (`/boitoan/`) và **MEDORA** (`/medora/`) dùng chung mật khẩu Admin hiện hành.
- Giá trị mật khẩu không lưu trong repository; không commit `*.src.html`.
- Production frontend: `hiennhi89.pages.dev`.
- Backend: `hiennhi89-gate.hiennhi89.workers.dev`.

---

## Nhật ký thay đổi — mới nhất trên cùng

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

### 2026-07-23 10:14 GMT+7 — ChatGPT GPT-5.6 — DEPLOY-20260723-03 — PRODUCTION SUCCESS ✅

- PR #25 sửa hậu kiểm Cloudflare Clean URLs HTTP 308.
- Workflow `29976466953`: Pages/CSS/Gate `200`, Worker `401 unauthorized` đúng kỳ vọng.

### 2026-07-23 04:31 GMT+7 — ChatGPT GPT-5.6 — COORD-20260723-01 — ĐIỀU PHỐI ĐA-AGENT ✅

- PR #18 merge source `a5d3f7afa78f62e7002e151b48121bb4894d2e1f`.
- Tạo quy tắc, khóa phạm vi, mẫu PR và CI điều phối nhiều agent.

---

Chi tiết kiến trúc và trạng thái hiện hành: `HANDOVER.md`, `docs/ARCHITECTURE.md`, `docs/handover/PRODUCTION_STATUS.md`, `docs/handover/READER_E2E_STATUS.md`.
