# 🤝 NHẬT KÝ PHỐI HỢP GIỮA CÁC CÔNG CỤ AI

> File này để các AI/công cụ cùng làm trên repository nắm được phạm vi, bằng chứng kiểm thử và việc còn chờ.

**Thương hiệu hiển thị:** Spirituality Market.  
**Quy tắc điều phối:** đọc `AGENTS.md` và `docs/handover/ACTIVE_TASKS.json` trước khi sửa; không ghi mật khẩu, token hoặc secret vào repository.  
**Quy tắc độ tin cậy:** tuyệt đối không bịa. Mọi kết luận về source, production hoặc chuyên môn phải dựa trên source, log, test hoặc tài liệu đã kiểm chứng. Nếu chưa đủ bằng chứng, phải ghi rõ **chưa xác lập/chưa đủ chứng cứ**; không tự điền nội dung chung chung cho đủ giao diện.

---

## Trạng thái mật khẩu và hạ tầng

- **SPARE** (`/`) dùng mật khẩu riêng.
- **Bói toán** (`/boitoan/`) và **MEDORA** (`/medora/`) dùng chung mật khẩu Admin hiện hành.
- Giá trị mật khẩu không lưu trong repository; không commit `*.src.html`.
- Worker cấp khóa theo `app`: ưu tiên `DECRYPT_KEY_<APP>`, nếu thiếu dùng `DECRYPT_KEY` chung.
- Production frontend: `hiennhi89.pages.dev`.
- Backend: `hiennhi89-gate.hiennhi89.workers.dev`.

---

## Nhật ký thay đổi — mới nhất trên cùng

### 2026-07-23 13:56 GMT+7 — ChatGPT GPT-5.6 — BOITOAN-20260723-06 — HOÀN TẤT ✅

- Người dùng kiểm tra production trên iPhone và chỉ ra ba lỗi thực tế: onboarding hiển thị chồng nhiều nhánh, checkbox/radio thành thanh dài, đăng ký báo lỗi chung.
- Nguyên nhân đăng ký đã được xác lập từ source: app Bói toán hiện là plaintext sau gate nhưng frontend cũ vẫn bắt buộc gọi `decryptPayload()` sau khi backend tạo tài khoản. Nếu account đã được tạo, lỗi xảy ra ở bước frontend sau đó.
- PR #31 merge thành `61c0dc0efbddf3c865c44d001d022d80cf0185d9`.
- CI trước merge đều success:
  - run `29986274969` — coordination guard;
  - run `29986275030` — Account V2, frontend, Worker và test tích hợp.
- Production run `29986415052` ghi `SUCCESS`:
  - Cloudflare Pages `200`;
  - trang Admin `200`;
  - Community CSS `200`;
  - gate runtime JS `200`;
  - Worker API Reader và API thảo luận không phiên `401 unauthorized`, đúng kỳ vọng;
  - onboarding công khai trả `400 invalid_account` với dữ liệu kiểm thử không hợp lệ;
  - marker onboarding hai màn hình, nhánh plaintext không ép giải mã, badge vai trò và Admin tổng tồn tại.
- Account V2 đã triển khai:
  - màn đầu chỉ có `Đăng nhập`, `Đăng ký`, `Admin`;
  - chọn xong mới mở màn thao tác riêng, có nút quay lại;
  - checkbox/radio dùng kích thước native trên iPhone;
  - nếu trang không có payload AES thì mở trực tiếp bằng token hợp lệ, chỉ giải mã khi payload thực sự tồn tại;
  - vai trò hiện cạnh tên/avatar và trong giao diện;
  - Khách và Reader có màn mặc định/tab phù hợp chức năng;
  - Admin khóa/mở khóa hoặc xóa member, xóa review, tạo/đóng/mở lại/xóa bài thảo luận;
  - Admin tổng đọc chat riêng và mở giao diện member bằng phiên impersonation chỉ đọc, backend chặn thao tác ghi và ghi audit KV.
- Thiết bị Admin tổng được bind động trong Workers KV sau khi đăng nhập Admin hợp lệ trên thiết bị đó; không hardcode mật khẩu, IP hoặc mã thiết bị vào source.
- PR #30 trùng Task-ID/phạm vi, không mergeable và có workflow chuyên biệt failure đã được ghi chú rồi đóng không merge để tránh ghi đè production.
- Telegram đăng ký mới vẫn là best-effort; cần một đăng ký thật sau khi tải bản mới để nghiệm thu thông báo thực tế.
- Task chuyển `completed`; không còn file bị khóa hoặc PR mở.

### 2026-07-23 12:20 GMT+7 — ChatGPT GPT-5.6 — BOITOAN-20260723-05 — HOÀN TẤT ✅

- PR #28 merge thành `d48ef93137c35e38ee64004dfb0cdaee9c04fd83`.
- CI trước merge đều success:
  - run `29981811502` — coordination guard;
  - run `29981811526` — role system, frontend và Worker.
- Production run `29981841325` ghi `SUCCESS` cho đúng source commit `d48ef931…`.
- Đã đổi branding và watermark thành `Spirituality Market`, chuẩn hóa cách gọi `Admin`, đưa đăng nhập/đăng ký thành viên lên cửa đầu và giữ Telegram best-effort. Bố cục onboarding này sau đó được thay thế bởi Account V2 theo nghiệm thu iPhone.

### 2026-07-23 10:30 GMT+7 — ChatGPT GPT-5.6 — BOITOAN-20260723-04 — HOÀN TẤT ✅

- PR #26 merge thành `3322b7c899aeeee3d2e98e26e4cbc97931390a77`.
- CI và production run `29976968849` success.
- Đã gỡ hoàn toàn các hộp `Khung luận…`, `Kết nối toàn trải bài` và mã/CSS phục vụ chúng; giữ thuật toán gốc, Cộng đồng, `Luận giải chuyên sâu`, tài khoản, chat, review và thanh toán.

### 2026-07-23 10:14 GMT+7 — ChatGPT GPT-5.6 — DEPLOY-20260723-03 — PRODUCTION SUCCESS ✅

- PR #25 merge thành `5e4e139b2bc09d14dd73fc6990adb428a8d2b40f`.
- Workflow run `29976466953` sửa false-negative do Cloudflare Clean URLs HTTP 308.
- Pages/CSS/Gate `200`, Worker `401 unauthorized` đúng kỳ vọng.

### 2026-07-23 05:26 GMT+7 — ChatGPT GPT-5.6 — BOITOAN-20260723-02 — SOURCE MERGED

- PR #19 merge thành `ed63ad7dfd8cf85dd58135095175d40a0a913e42`.
- Source bổ sung UI mobile, logo/watermark, role cards và lớp khung luận; branding/onboarding và lớp khung luận sau đó đã được thay thế theo yêu cầu mới hơn.

### 2026-07-23 04:31 GMT+7 — ChatGPT GPT-5.6 — COORD-20260723-01 — ĐIỀU PHỐI ĐA-AGENT ✅

- PR #18 merge thành `a5d3f7afa78f62e7002e151b48121bb4894d2e1f`.
- Đã tạo quy tắc, khóa phạm vi, mẫu PR và CI điều phối nhiều agent.

### 2026-07-22 — Claude Code — THAI NGUYÊN · CUNG MỆNH · THÂN CUNG ✅

- Thêm ba cung vào phần Bát Tự; test Chromium không lỗi JS.
- Commit merge: `fc5a147596b34d62ed2464fbcaea038530be83cc`.

### 2026-07-23 — ChatGPT GPT-5.6 — COMMUNITY ROLE SYSTEM ✅

- PR #16 merge thành `489b751391007976a2a39c4f25bfdcd36db99e25`.
- Có tài khoản Khách/Reader/Admin, hồ sơ Reader, review 1–5 sao, chat riêng 30 ngày, báo phí/thanh toán và owner-device guard cho Admin.

### 2026-07-21 — Claude Code — THUẬT TOÁN VÀ MẬT KHẨU ✅

- Sửa Tháng cá nhân; cân bằng ngũ hành/thập thần xét tàng can.
- Tách mật khẩu SPARE bằng `DECRYPT_KEY_SPARE`.
- Áp dụng bảng Nhân nguyên tư lệnh phân dã; thiên can lộ = 1.0, nguyệt lệnh đương quyền ×1.5.

---

Chi tiết kiến trúc và trạng thái hiện hành: `HANDOVER.md`, `docs/ARCHITECTURE.md`, `docs/handover/PRODUCTION_STATUS.md`.
