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
- **Hội Chọn Đúng** (`/hoi-chon-dung/`) có Growth Autopilot nội bộ; giao diện public không hiển thị trạng thái vận hành hoặc doanh thu.
- Không commit `*.src.html`, mật khẩu, token hoặc secret.
- Production frontend: `hiennhi89.pages.dev`.
- Backend: `hiennhi89-gate.hiennhi89.workers.dev`.

---

## Nhật ký thay đổi — mới nhất trên cùng

### 2026-07-25 01:45 GMT+7 — Claude Code — BOITOAN-20260724-16 — ĐANG LÀM ⏳

- Phạm vi: `boitoan/index.html` (máy diễn giải Lenormand), sổ khóa và nhật ký.
- Vấn đề: phần diễn giải lắp ghép rời rạc — mỗi lá một khối nghĩa riêng, lộ nhãn kỹ thuật
  `Là chủ thể / Là bổ nghĩa` và các đoạn giảng phương pháp ra màn hình người dùng; trải 1–3 lá
  đổ nghĩa cả ba lĩnh vực kể cả khi khách đã chọn một lĩnh vực.
- Đã sửa: đọc theo tổ hợp thành một mạch (nền → chuyện chính → lá cuối chốt); lọc đúng lĩnh vực
  được chọn; bỏ nhãn `Máy ghép câu` và các đoạn giải thích ngữ pháp bàn bài; đổi giọng khối trả lời;
  đổi tiêu đề `Tổng luận phối hợp` → `Lời quẻ`.
- Giữ nguyên: dữ liệu 36 lá, thuật toán rút bài, toàn bộ `<head>` (pbkdf2, backend, `mode: 'approval'`).
- Kiểm thử: vòng tròn giải mã → sửa → mã hóa lại → giải mã lại khớp nội dung, file mã hóa không rò
  plaintext; `node --check` 10 khối script inline hợp lệ; vùng `<head>` giống hệt bản cũ.
- Còn chờ: CI của PR #92 và nghiệm thu thực tế trên iPhone.

### 2026-07-25 01:22 GMT+7 — ChatGPT GPT-5.6 — SEO-20260725-01 — HOÀN TẤT KỸ THUẬT ✅

- Triển khai Growth Autopilot khép kín: tìm sản phẩm → lọc → tạo deep link affiliate → cập nhật catalog/web → dựng SEO → gửi IndexNow → đồng bộ click/đơn/hoa hồng → dashboard owner.
- Worker cron chạy 5 phút để đồng bộ doanh thu; discovery/tạo lại link và SEO chỉ chạy khi đủ 6 giờ. Deploy trigger chạy ngay vòng đầu.
- `backend/choice-revenue.js` đọc AccessTrade order-list/transactions và click KV; tính doanh số, commission pending/approved/rejected, conversion, EPC, approved EPC, AOV, biểu đồ 30 ngày, top sản phẩm/campaign và cảnh báo.
- Dashboard owner-only `/owner/choice/revenue`: đúng Telegram owner dùng `/doanhthu` nhận vé một lần 10 phút; cookie `HttpOnly; Secure; SameSite=Strict` 12 giờ; không phiên `401`; mọi response `noindex/no-store`; không giữ tên, điện thoại hoặc email khách hàng.
- Lệnh owner: `/doanhthu`, `/doanhthu-ngay`, `/doanhthu7`, `/doanhthu30`, `/dongbo-doanhthu`.
- SEO publisher tự tạo HTML tĩnh sản phẩm/danh mục/hướng dẫn, Product/Offer/Breadcrumb/ItemList/FAQ/Article JSON-LD, canonical, Open Graph, Twitter metadata, sitemap và RSS.
- IndexNow key và bulk submission đã deploy; production step IndexNow success. Google Search Console script có nhánh skip an toàn khi chưa có service account.
- Public API sản phẩm có ảnh/thời điểm xác minh nhưng không lộ URL affiliate thô, metadata vận hành hoặc doanh thu.
- PR #91 merge source `a73a807c7fedbcf7d8adad6ad8b0a0cd5d83e4b0`.
- CI điều phối `30116008064`: success.
- Validation cuối `30116312380`: Worker, Affiliate, Revenue, SEO, public-private boundary, frontend và WebKit AES thật đều success.
- Production `30116421342`: source, SEO build, Worker-before-Pages, Growth trigger, Pages, IndexNow, Google step và smoke đều success.
- Production recorder commit `915178f6ead00c4052391caf925ceea385b5fc75`; internal recorder `30116490615`, commit `e9ee55f3d55c14d10b83bbbb48efc794a7c0a6c6`.
- Recorder xác nhận `onboarding_required`, credential false, sản phẩm/đơn thật bằng 0. Đây là external onboarding AccessTrade bắt buộc một lần, không phải lỗi kỹ thuật.
- Sau khi owner đăng nhập/KYC và gửi `/atkey <API_KEY>`, hệ thống tự tạo link, cập nhật web và đồng bộ doanh thu; owner không vận hành từng sản phẩm.
- Task chuyển `completed`; toàn bộ khóa được giải phóng.

### 2026-07-24 23:41 GMT+7 — ChatGPT GPT-5.6 — GOVERNANCE-20260724-01 — HOÀN TẤT ✅

- Chủ sở hữu phát hiện đúng một lỗi nghiêm trọng: build đã chèn trạng thái Autopilot, chế độ dự phòng và thông điệp dành cho chủ sở hữu lên footer public.
- Đã gỡ hoàn toàn badge/footer/script nội bộ; thay bằng nội dung có ích cho người mua về quyền riêng tư, tương thích, bảo hành, đổi trả và giá cuối cùng.
- PWA tăng từ `hoi-chon-dung-v2` lên `hoi-chon-dung-v3`, xóa cache cũ khi activate và không còn cache module trạng thái.
- Đã xóa public status handler khỏi module materialized; Worker trả `404` cho route trạng thái, còn trigger run nội bộ vẫn bắt buộc secret.
- Recorder không gọi API public; đọc `choice:autopilot:status:v1` trực tiếp từ Cloudflare KV bằng quyền CI và ghi rõ tài liệu owner/internal.
- Dữ liệu sản phẩm public không còn nhãn Autopilot/AccessTrade, điểm xếp hạng nội bộ hoặc UTM mang tên cơ chế vận hành.
- Ban hành `docs/handover/AUDIENCE_PRIVACY_STANDARD.md`, cập nhật `AGENTS.md`, và merge quy chế công ty toàn cục tại `4f2c6bf2ba61c041d737e90c12d5aa82205f1d8a`.
- Cổng `tools/check-public-content.mjs` chạy trên source sau materialize và toàn bộ `_site`; một vi phạm public/private sẽ chặn merge/deploy.
- PR #89 merge source `d72e3552a5a71e6f4ef14a4205b3e6f4ed2d25b5`.
- CI: điều phối `30108929684`, regression/public-private/WebKit `30108929401`, recorder nội bộ `30108929479` — success.
- Production `30109841905`: source boundary, Worker, Pages, PWA V3 và hậu kiểm production đều success; status public trả `404` và nội dung owner/internal không tồn tại trên HTML công khai.
- Recorder `30109889703` đọc KV nội bộ thành công; commit hồ sơ `a22f0ef29f7712077e0202d7c89444b0ff288f03`.
- Task chuyển `completed`; toàn bộ khóa được giải phóng.

### 2026-07-24 22:34 GMT+7 — ChatGPT GPT-5.6 — AFFILIATE-20260724-02 — HOÀN TẤT KỸ THUẬT ✅

- Triển khai Affiliate Autopilot: tự lấy datafeed, lọc rủi ro, tuyển sản phẩm, tạo deep link, đọc giao dịch, cập nhật catalog và chạy theo cron.
- PR #86 runtime source `c4591418ae92adc77d0201e8e55737cd6ce929db`; CI `30104948933`, `30104948983`; production `30105078450`: success.
- PR #87 recorder source `5ba62c6e67ff15eb49e1eb155e3763fa52f71508`; production `30105568525`, recorder `30105641911`: success.
- Trạng thái kinh doanh và onboarding sau governance fix chỉ còn trong kênh owner/internal.

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
