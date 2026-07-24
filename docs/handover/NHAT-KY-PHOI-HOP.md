# 🤝 NHẬT KÝ PHỐI HỢP GIỮA CÁC CÔNG CỤ AI

> File này để các AI/công cụ cùng làm trên repository nắm được phạm vi, bằng chứng kiểm thử và việc còn chờ.

**Thương hiệu hiển thị:** Spirituality Market.  
**Quy tắc điều phối:** đọc `AGENTS.md`, `docs/handover/ACTIVE_TASKS.json` và chuẩn đối tượng trước khi sửa; không ghi mật khẩu, token hoặc secret vào repository.  
**Quy tắc độ tin cậy:** không kết luận source/production đã hoàn tất nếu chưa có log, test hoặc nghiệm thu thực tế.

---

## Trạng thái mật khẩu và hạ tầng

- **SPARE** (`/`) dùng mật khẩu riêng.
- **Bói toán** (`/boitoan/`) có hai cấp Admin; chỉ lưu PBKDF2 hash + salt, không lưu plaintext.
- **MEDORA** (`/medora/`) giữ cơ chế truy cập riêng hiện hành.
- **Hội Chọn Đúng** (`/hoi-chon-dung/`) có Affiliate Autopilot nội bộ; giao diện public không được hiển thị trạng thái vận hành.
- Không commit `*.src.html`, mật khẩu, token hoặc secret.
- Production frontend: `hiennhi89.pages.dev`.
- Backend: `hiennhi89-gate.hiennhi89.workers.dev`.

---

## Nhật ký thay đổi — mới nhất trên cùng

### 2026-07-24 22:57 GMT+7 — ChatGPT GPT-5.6 — GOVERNANCE-20260724-01 — ĐANG KHẮC PHỤC KHẨN CẤP 🔴

- Chủ sở hữu phát hiện đúng một lỗi nghiêm trọng: build đã chèn trạng thái Autopilot, chế độ dự phòng và thông điệp dành cho chủ sở hữu lên footer của trang công khai.
- Nguyên nhân gốc: `tools/apply-choice-autopilot-ui.mjs` biến trang người dùng thành bảng báo cáo vận hành; `autopilot-ui.js` gọi status API public; PWA V2 cache lại nội dung sai đối tượng.
- Phạm vi sửa không dừng ở đoạn chữ: gỡ cơ chế chèn, bỏ status module khỏi bundle, tăng cache V3, khóa status route public, làm sạch nhãn nội bộ trong dữ liệu sản phẩm và chuyển recorder sang đọc KV bằng quyền CI.
- Ban hành `docs/handover/AUDIENCE_PRIVACY_STANDARD.md`; cập nhật `AGENTS.md` và quy chế công ty để mọi dự án bắt buộc phân loại public/member/admin/owner trước khi viết nội dung.
- Thêm `tools/check-public-content.mjs`; CI và deploy phải thất bại nếu public HTML/JS có nội dung owner/internal bị cấm.
- Hậu kiểm production mới phải xác nhận trang không chứa `Autopilot`, `onboarding_required`, `chủ sở hữu`, tên hạ tầng hoặc hướng dẫn credential; status endpoint public phải trả `404`.
- Task còn `in_progress`; chưa được kết luận hoàn tất trước khi CI, merge, deploy, làm mới PWA cache và smoke production đạt.

### 2026-07-24 22:34 GMT+7 — ChatGPT GPT-5.6 — AFFILIATE-20260724-02 — HOÀN TẤT KỸ THUẬT ✅

- Triển khai Affiliate Autopilot: tự lấy datafeed, lọc rủi ro, tuyển sản phẩm, tạo deep link, đọc giao dịch, cập nhật catalog và chạy theo cron.
- PR #86 runtime source `c4591418ae92adc77d0201e8e55737cd6ce929db`; CI `30104948933`, `30104948983`; production `30105078450`: success.
- PR #87 recorder source `5ba62c6e67ff15eb49e1eb155e3763fa52f71508`; production `30105568525`, recorder `30105641911`: success.
- Thiếu credential AccessTrade nên nội bộ ở trạng thái onboarding; lỗi GOVERNANCE-20260724-01 phát hiện sau đó là đã đưa trạng thái này lên public UI và đang được khắc phục.

### 2026-07-24 21:29 GMT+7 — ChatGPT GPT-5.6 — AFFILIATE-20260724-01 — HOÀN TẤT ✅

- Triển khai PWA **Hội Chọn Đúng** tại `/hoi-chon-dung/`, có bộ chọn nhu cầu, so sánh, lưu, chia sẻ và bình chọn.
- PR #84 merge `f57023af442839da852354672bea8036e579a9fd`; CI và production `30100989464`: success.
- V1 sau đó được V2 thay thế về mô hình vận hành.

### 2026-07-23 19:33 GMT+7 — ChatGPT GPT-5.6 — BOITOAN-20260723-10 — HOÀN TẤT ✅

- Hoàn thiện xác thực hai cấp Admin, JWT gắn thiết bị và không lưu mật khẩu plaintext.
- PR #64 merge `f5ac80b72005e1bc9f2d934ca4ffbdb57ec427a8`; CI và production success.

### 2026-07-23 18:54 GMT+7 — ChatGPT GPT-5.6 — TRAVEL-20260723-01 — HOÀN TẤT ✅

- Tạo PWA `/vietnam-travel/`, có tìm kiếm, lọc, yêu thích, bản đồ, chia sẻ và offline shell.
- Validation `30004367095`; production `30004367100`: success.
