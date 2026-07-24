# 🤝 NHẬT KÝ PHỐI HỢP GIỮA CÁC CÔNG CỤ AI

> File này để các AI/công cụ cùng làm trên repository nắm được phạm vi, bằng chứng kiểm thử và việc còn chờ.

**Thương hiệu hiển thị:** Spirituality Market.  
**Quy tắc điều phối:** đọc `AGENTS.md` và `docs/handover/ACTIVE_TASKS.json` trước khi sửa; không ghi mật khẩu, token hoặc secret vào repository.  
**Quy tắc độ tin cậy:** không kết luận source/production đã hoàn tất nếu chưa có log, test hoặc nghiệm thu thực tế.

---

## Trạng thái mật khẩu và hạ tầng

- **SPARE** (`/`) dùng mật khẩu riêng.
- **Bói toán** (`/boitoan/`) có hai cấp Admin; chỉ lưu PBKDF2 hash + salt, không lưu plaintext.
- **MEDORA** (`/medora/`) giữ cơ chế truy cập riêng hiện hành.
- **Hội Chọn Đúng** (`/hoi-chon-dung/`) đang được nâng từ MVP có người vận hành lên Affiliate Autopilot V2.
- Không commit `*.src.html`, mật khẩu, token hoặc secret.
- Production frontend: `hiennhi89.pages.dev`.
- Backend: `hiennhi89-gate.hiennhi89.workers.dev`.

---

## Nhật ký thay đổi — mới nhất trên cùng

### 2026-07-24 22:05 GMT+7 — ChatGPT GPT-5.6 — AFFILIATE-20260724-02 — ĐANG TRIỂN KHAI 🟡

- Chủ sở hữu khiếu nại đúng: V1 giao việc chọn sản phẩm và gắn link cho “sếp”, trái mô hình công ty full-auto.
- Quyết định kiến trúc V2: **Affiliate Autopilot** tự lấy datafeed AccessTrade, lọc sản phẩm rủi ro, chấm điểm, tạo deep link, thay catalog seed, đọc giao dịch 7 ngày và tự tối ưu.
- Ba ngách khởi đầu vẫn là Tarot, sáng tạo nội dung và in 3D; tối đa 6 sản phẩm/ngách sau mỗi vòng.
- Cron Cloudflare `17 */6 * * *`; pipeline deploy tự tạo trigger secret, deploy Worker rồi gọi vòng chạy đầu ngay lập tức.
- Nếu chưa có tài khoản/API key, trạng thái phải là `onboarding_required`; bot tự gửi đúng link đăng nhập/API key. Đây là điểm chạm con người duy nhất vì liên quan đăng ký/đăng nhập bên thứ ba.
- `/atkey` được bảo vệ đồng thời bằng `chat.id` và `from.id` owner; tin nhắn chứa key được yêu cầu xóa, credential mã hóa AES-GCM trong KV bằng khóa dẫn xuất từ `SESSION_SECRET`.
- `/chon` được chuyển thành alias bảng điều hành `/autopilot`; lệnh chỉnh catalog V1 chỉ còn break-glass recovery.
- Public API/status và frontend không lộ key, trigger hoặc affiliate URL thô.
- PWA cache tăng `hoi-chon-dung-v2` và thêm `autopilot-ui.js`.
- Test cục bộ module đã đạt `5/5`; fixture integration idempotent, owner guard, trigger secret và UI materialize đạt. CI/merge/deploy/production chưa được kết luận ở thời điểm ghi nhật ký này.

### 2026-07-24 21:29 GMT+7 — ChatGPT GPT-5.6 — AFFILIATE-20260724-01 — HOÀN TẤT ✅

- Triển khai PWA công khai **Hội Chọn Đúng** tại `/hoi-chon-dung/`, tối ưu mobile, có bộ chọn theo danh mục/ngân sách/ưu tiên/nhu cầu, so sánh tối đa ba sản phẩm, lưu cục bộ, chia sẻ, cài PWA và bình chọn cộng đồng.
- Seed 12 sản phẩm thuộc Tarot, sáng tạo nội dung và in 3D; `affiliate_url` để trống, link hiện tại chỉ là link tham khảo HTTPS.
- Backend `backend/choice.js` cung cấp catalog/meta/health, vote khử lặp theo ngày và redirect `/r/choice/:id` đo click có khử lặp 5 phút.
- Quản trị Telegram V1: `/chon`, `/dssp`, `/xemsp`, `/themsp`, `/suasp`, `/ansp`, `/hiensp`, `/xoasp`, `/thongkesp`.
- SEO/PWA đủ title, description, canonical, Open Graph, JSON-LD, sitemap, robots và app shell offline.
- Test cục bộ: frontend/SEO/PWA `5/5`; backend/API/vote/click/Telegram `6/6`.
- PR #84 merge thành `f57023af442839da852354672bea8036e579a9fd`.
- CI trước merge: điều phối `30100845932` success; frontend/Worker/WebKit `30100845901` success.
- Production run `30100989464`, job `89506673059`: build, deploy Worker, deploy Pages và hậu kiểm production đều success.
- Task chuyển `completed`; toàn bộ khóa điều phối đã giải phóng. V1 sau đó bị V2 thay thế về mô hình vận hành.

### 2026-07-23 19:33 GMT+7 — ChatGPT GPT-5.6 — BOITOAN-20260723-10 — HOÀN TẤT ✅

- Sửa xác thực hai cấp Admin; người dùng chỉ đăng nhập một lần tại cùng mục Admin.
- `regular`: quản lý member, review, bài thảo luận. `primary`: thêm hội thoại riêng và impersonation chỉ đọc.
- JWT gắn thiết bị; chỉ một thiết bị primary; `ADMIN_TOKEN` cũ không còn được chấp nhận tại Community API.
- Hai mật khẩu chỉ tồn tại dưới dạng PBKDF2-SHA256 hash + salt.
- PR #64 merge thành `f5ac80b72005e1bc9f2d934ca4ffbdb57ec427a8`.
- CI `30005276397`, `30005276313`; production `30007344122`: success.
- Task chuyển `completed`; toàn bộ khóa điều phối đã giải phóng.

### 2026-07-23 18:54 GMT+7 — ChatGPT GPT-5.6 — TRAVEL-20260723-01 — HOÀN TẤT ✅

- Tạo PWA công khai `/vietnam-travel/`, có tìm kiếm không dấu, lọc, sắp xếp, yêu thích, bản đồ, chia sẻ và offline shell.
- Seed 20 địa điểm; dữ liệu động lưu KV `travel:places:v1`.
- Telegram owner-only quản trị địa điểm; webhook kiểm tra cả `chat.id` và `from.id`.
- Travel unit test `5/5`; validation `30004367095`; production `30004367100` success.
- Task chuyển `completed`; khóa điều phối đã giải phóng.
