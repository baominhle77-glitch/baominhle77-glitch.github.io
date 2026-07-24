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
- **Hội Chọn Đúng** (`/hoi-chon-dung/`) chạy Affiliate Autopilot V2; production hiện `onboarding_required` do chưa kết nối AccessTrade.
- Không commit `*.src.html`, mật khẩu, token hoặc secret.
- Production frontend: `hiennhi89.pages.dev`.
- Backend: `hiennhi89-gate.hiennhi89.workers.dev`.

---

## Nhật ký thay đổi — mới nhất trên cùng

### 2026-07-24 22:34 GMT+7 — ChatGPT GPT-5.6 — AFFILIATE-20260724-02 — HOÀN TẤT ✅

- Khiếu nại của chủ sở hữu được xác nhận đúng: V1 giao việc chọn sản phẩm và gắn link cho “sếp”, trái mô hình công ty full-auto.
- V2 thay luồng chính bằng **Affiliate Autopilot**: tự lấy AccessTrade datafeed, lọc rủi ro, chấm điểm, tuyển sản phẩm, tạo deep link, đọc giao dịch 7 ngày, cập nhật catalog và tự tối ưu.
- Ba ngách khởi đầu: Tarot, sáng tạo nội dung và in 3D; tối đa 6 sản phẩm/ngách mỗi vòng.
- Cron Cloudflare `17 */6 * * *`; pipeline đặt trigger secret, deploy Worker trước Pages, chạy Autopilot ngay sau deploy và hậu kiểm production.
- Credential dùng Worker secret hoặc `/atkey` một lần; webhook kiểm tra đồng thời `chat.id` và `from.id`, yêu cầu xóa tin nhắn chứa key và mã hóa AES-GCM trong KV bằng khóa dẫn xuất từ `SESSION_SECRET`.
- `/chon` trở thành alias bảng điều hành Autopilot; lệnh sửa catalog V1 chỉ còn break-glass recovery.
- Public API/UI không lộ credential, trigger hoặc affiliate URL thô; blocklist loại thuốc, giảm/tăng cân, supplement, rượu bia, nicotine, chất gây nghiện, vũ khí và sản phẩm người lớn.
- Thanh tra được tách theo frontend Bói toán, Account, Service Worker, Community, Worker, Autopilot và WebKit để không che lỗi.
- PR #86 merge runtime source `c4591418ae92adc77d0201e8e55737cd6ce929db`.
- CI trước merge: điều phối `30104948933` success; validation toàn lớp + WebKit AES thật `30104948983` success.
- Production run `30105078450`: source/build, Worker, khởi động Autopilot, Pages và smoke đều success.
- PR #87 merge recorder source `5ba62c6e67ff15eb49e1eb155e3763fa52f71508`.
- Production recorder deploy `30105568525`: success; status recorder `30105641911`: success.
- Mode production được ghi tự động là `onboarding_required`, credential `false`, cần chủ sở hữu đăng nhập/KYC một lần `true`. Đây là ranh giới bên thứ ba bắt buộc, không phải công việc vận hành sản phẩm.
- Sau khi owner gửi `/atkey <API_KEY>`, hệ thống tự chạy; owner không chọn sản phẩm, không tạo link và không cập nhật từng URL.
- Task chuyển `completed`; toàn bộ khóa điều phối đã giải phóng.

### 2026-07-24 21:29 GMT+7 — ChatGPT GPT-5.6 — AFFILIATE-20260724-01 — HOÀN TẤT ✅

- Triển khai PWA công khai **Hội Chọn Đúng** tại `/hoi-chon-dung/`, có bộ chọn nhu cầu, so sánh, lưu, chia sẻ và bình chọn cộng đồng.
- Seed 12 sản phẩm thuộc Tarot, sáng tạo nội dung và in 3D; link khi đó chỉ là tham khảo HTTPS.
- Backend cung cấp catalog/meta/health, vote khử lặp và redirect đo click.
- PR #84 merge `f57023af442839da852354672bea8036e579a9fd`; CI `30100845932`, `30100845901`; production `30100989464`: success.
- V1 sau đó được V2 Autopilot thay thế về mô hình vận hành.

### 2026-07-23 19:33 GMT+7 — ChatGPT GPT-5.6 — BOITOAN-20260723-10 — HOÀN TẤT ✅

- Sửa xác thực hai cấp Admin; người dùng chỉ đăng nhập một lần tại cùng mục Admin.
- `regular`: quản lý member, review, bài thảo luận. `primary`: thêm hội thoại riêng và impersonation chỉ đọc.
- JWT gắn thiết bị; chỉ một thiết bị primary; không lưu mật khẩu plaintext.
- PR #64 merge `f5ac80b72005e1bc9f2d934ca4ffbdb57ec427a8`; CI và production success.

### 2026-07-23 18:54 GMT+7 — ChatGPT GPT-5.6 — TRAVEL-20260723-01 — HOÀN TẤT ✅

- Tạo PWA `/vietnam-travel/`, có tìm kiếm, lọc, yêu thích, bản đồ, chia sẻ và offline shell.
- Seed 20 địa điểm; dữ liệu KV; Telegram owner-only.
- Validation `30004367095`; production `30004367100`: success.
