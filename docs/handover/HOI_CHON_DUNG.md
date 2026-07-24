# HỘI CHỌN ĐÚNG — AFFILIATE VÀ GROWTH AUTOPILOT

**Runtime task:** `AFFILIATE-20260724-02` — `completed`  
**Governance task:** `GOVERNANCE-20260724-01` — `completed`  
**Growth task:** `SEO-20260725-01` — `completed`  
**Production:** `https://hiennhi89.pages.dev/hoi-chon-dung/`  
**Backend public:** `https://hiennhi89-gate.hiennhi89.workers.dev/api/choice/*`  
**Growth source:** `a73a807c7fedbcf7d8adad6ad8b0a0cd5d83e4b0` — PR #91  
**Production run hiện hành:** `30116421342` — SUCCESS  
**Internal recorder:** `30116490615` — SUCCESS; xem `CHOICE_GROWTH_AUTOPILOT.md`.

## 1. Phân tách public và nội bộ

Sự cố ngày 24/07/2026: bước build từng chèn trạng thái vận hành và thông điệp dành cho chủ sở hữu vào footer public. Lỗi đã được khắc phục và trở thành rào chắn bắt buộc toàn công ty.

Trạng thái hiện hành:

- Public UI chỉ chứa thông tin giúp người dùng hiểu, so sánh hoặc mua an toàn.
- Credential, onboarding/KYC, nguồn dữ liệu, cron, Worker, KV, deploy, production, doanh thu và hướng dẫn owner chỉ tồn tại trong Telegram/dashboard/handover nội bộ.
- Public status route `/api/choice/autopilot/status` trả `404`.
- Public status handler đã bị xóa khỏi module materialized.
- Recorder nội bộ đọc KV bằng quyền CI.
- PWA dùng cache `hoi-chon-dung-v3` và không cache module trạng thái.
- `tools/check-public-content.mjs` chặn deploy nếu HTML/JavaScript công khai chứa nội dung owner/internal.

## 2. Nội dung public được phép

Người dùng được xem:

- nhu cầu, ngân sách và ưu tiên của chính họ;
- điểm mạnh, điểm yếu, mức phù hợp và thông tin nơi bán;
- giá, tồn kho, tương thích, bảo hành, đổi trả và cảnh báo an toàn;
- công bố affiliate/hoa hồng cần thiết;
- thông tin quyền riêng tư và giới hạn dịch vụ;
- trang sản phẩm, danh mục và hướng dẫn SEO đã được làm sạch.

Người dùng không được xem:

- trạng thái Growth/Affiliate Autopilot hoặc credential;
- việc chủ sở hữu cần đăng nhập/KYC;
- tên chế độ nội bộ;
- API key, secret, trigger, cron, Worker, KV, source, commit, workflow hoặc production;
- hoa hồng/doanh thu nội bộ, đơn hàng và lỗi nguồn.

## 3. Mô hình vận hành nội bộ

Affiliate/Growth Autopilot thực hiện trong nền:

1. Lấy datafeed sản phẩm từ AccessTrade.
2. Lọc hàng rủi ro, thiếu tồn kho, URL không an toàn hoặc dữ liệu không hợp lệ.
3. Chấm điểm theo mức phù hợp, sức bán, giá, giảm giá, hoa hồng và giao dịch gần đây.
4. Tuyển tối đa 6 sản phẩm cho mỗi nhóm Tarot, creator và in 3D.
5. Tạo deep link có UTM/sub-ID và cập nhật catalog.
6. Giữ catalog gần nhất khi nguồn lỗi.
7. Mỗi 5 phút đồng bộ click, đơn, doanh số, hoa hồng và cảnh báo.
8. Mỗi 6 giờ chạy discovery, tạo lại trang SEO, sitemap/RSS và thông báo URL mới tới IndexNow.
9. Gửi báo cáo qua Telegram owner và dashboard riêng.

Các chi tiết vận hành không xuất hiện trên sản phẩm public.

## 4. Điểm chạm owner

### AccessTrade một lần

1. Đăng nhập/đăng ký/KYC tại `https://pub2.accesstrade.vn/`.
2. Mở `https://pub2.accesstrade.vn/profile/api_key`.
3. Gửi `/atkey <API_KEY>` trong Telegram owner.

Webhook kiểm tra đồng thời `chat.id` và `from.id`, yêu cầu xóa tin nhắn chứa key và mã hóa AES-GCM trước khi lưu KV. Sau đó hệ thống tự tìm sản phẩm, tạo link, cập nhật web và đồng bộ doanh thu.

Production recorder hiện xác nhận `mode=onboarding_required`, credential `false`, sản phẩm tự tuyển `0`, đơn 7 ngày `0`; đây là trạng thái đúng trước khi kết nối AccessTrade.

### Dashboard doanh thu

- `/doanhthu` — tóm tắt 7 ngày và link dashboard riêng dùng một lần.
- `/doanhthu-ngay`, `/doanhthu7`, `/doanhthu30` — số liệu theo kỳ.
- `/dongbo-doanhthu` — đồng bộ ngay.

Dashboard route `/owner/choice/revenue` không được liên kết công khai. Vé hết hạn sau 10 phút; cookie `HttpOnly; Secure; SameSite=Strict` hết hạn sau 12 giờ. Không phiên trả `401`; route và API đều `noindex/no-store`.

### Google Search Console một lần

Để workflow tự gửi sitemap qua Google API, cần xác minh property, tạo service account, cấp quyền property và đặt GitHub secret `GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT_JSON`. Nếu chưa có, sitemap/HTML/IndexNow vẫn hoạt động bình thường; workflow bỏ qua Google API an toàn.

## 5. API public và private

| Route | Phân loại | Chức năng |
|---|---|---|
| `GET /api/choice/products` | Public | catalog đã làm sạch, không lộ URL đích thô hoặc metadata vận hành |
| `POST /api/choice/vote` | Public | bình chọn khử lặp |
| `GET /r/choice/:id` | Public | đo click ẩn danh và chuyển tới deep link affiliate/nơi bán |
| `GET /api/choice/health` | Public tối giản | kiểm tra dịch vụ, không trả trạng thái kinh doanh |
| `POST /api/choice/autopilot/run` | Internal | bắt buộc trigger secret; chạy Growth cycle |
| `GET /api/choice/autopilot/status` | Disabled public | trả `404` |
| `GET /owner/choice/revenue` | Owner/private | dashboard, bắt buộc phiên từ one-time ticket |
| `GET /owner/choice/revenue/api/summary` | Owner/private | snapshot doanh thu gần thời gian thực |
| `POST /owner/choice/revenue/api/refresh` | Owner/private | đồng bộ ngay |

## 6. Làm sạch dữ liệu sản phẩm

Dữ liệu public không chứa:

- nhãn Autopilot/AccessTrade;
- điểm xếp hạng nội bộ;
- UTM mang tên cơ chế vận hành;
- metadata source, credential hoặc trạng thái nội bộ;
- affiliate URL thô.

Dữ liệu public có thể chứa ảnh sản phẩm đã xác minh, thời điểm cập nhật, khoảng giá, ưu/nhược điểm và outbound path nội bộ.

## 7. SEO và phân phối

Growth publisher tự tạo:

- trang HTML tĩnh cho từng sản phẩm;
- trang danh mục Tarot, sáng tạo nội dung và in 3D;
- trang hướng dẫn lựa chọn;
- JSON-LD Product/Offer/Breadcrumb/ItemList/FAQ/Article;
- canonical, Open Graph, Twitter Card;
- sitemap và RSS;
- IndexNow key và bulk URL submission;
- Google Search Console sitemap submission khi đã cấp quyền một lần.

Metadata chia sẻ giúp đường dẫn hiển thị rõ trên Facebook, Zalo, X, LinkedIn, Pinterest và ứng dụng nhắn tin; hệ thống không tự spam hoặc đăng vào tài khoản mạng xã hội chưa được cấp quyền.

Production run xác nhận IndexNow step SUCCESS, sitemap/RSS và trang Product schema đều đã deploy.

## 8. Trung tâm doanh thu

Snapshot nội bộ 30 ngày bao gồm:

- click;
- đơn hàng và doanh số ghi nhận;
- hoa hồng tổng/pending/approved/rejected;
- conversion rate, EPC và approved EPC;
- giá trị đơn trung bình;
- biểu đồ theo ngày;
- top sản phẩm/campaign;
- đơn gần nhất;
- cảnh báo click không có đơn, tỷ lệ từ chối cao và hoa hồng giảm.

Dashboard không lưu hoặc hiển thị tên, điện thoại hay email khách hàng. “Gần thời gian thực” phụ thuộc thời gian ghi nhận/cache/đối soát của mạng affiliate; không tuyên bố tức thời tuyệt đối.

## 9. Tiêu chuẩn toàn công ty

- Quy chế công ty toàn cục merge tại `4f2c6bf2ba61c041d737e90c12d5aa82205f1d8a`.
- `AGENTS.md` bắt buộc mọi agent phân loại public/member/admin/owner trước khi thiết kế nội dung hoặc API.
- `AUDIENCE_PRIVACY_STANDARD.md` áp dụng cho mọi dự án.
- Ban Thanh tra kiểm source, build-generated content, API, lỗi hiển thị và PWA cache.
- Một nội dung sai đối tượng là lỗi nghiêm trọng và chặn merge/deploy.

## 10. Rào chắn sản phẩm

Blocklist gồm thuốc, sản phẩm giảm/tăng cân, thực phẩm chức năng, rượu bia, nicotine, chất gây nghiện, vũ khí và sản phẩm người lớn.

Không bịa review, đơn hàng, giá, tồn kho hoặc lợi nhuận. Khi nguồn lỗi, giữ catalog/snapshot gần nhất; cảnh báo chi tiết chỉ gửi nội bộ.

## 11. Bằng chứng Growth production

- PR #91 merge source `a73a807c7fedbcf7d8adad6ad8b0a0cd5d83e4b0`.
- CI điều phối `30116008064` — SUCCESS.
- Validation cuối `30116312380` — Growth, Revenue, SEO, privacy và WebKit AES thật SUCCESS.
- Production `30116421342` — cấu hình, source, SEO build, Worker, Growth trigger, Pages, IndexNow, Google step và smoke SUCCESS.
- Production recorder commit `915178f6ead00c4052391caf925ceea385b5fc75`.
- Internal recorder `30116490615` — SUCCESS; commit `e9ee55f3d55c14d10b83bbbb48efc794a7c0a6c6`.
- Smoke xác nhận dashboard không phiên `401/noindex`, status public `404`, Product schema, sitemap, RSS, IndexNow key và public boundary đạt.

## 12. Trạng thái kinh doanh cần hiểu đúng

- Hạ tầng Growth/Revenue/SEO đã hoàn tất production.
- Link affiliate thật và doanh thu thật chưa thể phát sinh trước khi AccessTrade được kết nối một lần.
- Google Search Console API chưa được coi là đã cấp quyền chỉ vì workflow step SUCCESS; script có nhánh skip an toàn nếu thiếu secret.
- IndexNow đã được gửi trong production deploy.
- Không cam kết thứ hạng SEO hoặc doanh thu.
