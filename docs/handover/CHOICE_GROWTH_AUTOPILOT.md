# HỘI CHỌN ĐÚNG — GROWTH AUTOPILOT, LINK AFFILIATE VÀ DOANH THU

**Task-ID:** `SEO-20260725-01` — `completed`  
**Runtime source:** `a73a807c7fedbcf7d8adad6ad8b0a0cd5d83e4b0` — PR #91  
**Production deploy:** `30116421342` — SUCCESS  
**Internal recorder:** `30116490615` — SUCCESS  
**Trạng thái nguồn affiliate:** `onboarding_required`; chưa có credential, sản phẩm affiliate thật hoặc doanh thu thật.

## 1. Mục tiêu vận hành

Growth Autopilot khép kín chu trình:

1. Tìm sản phẩm từ nguồn affiliate đã kết nối.
2. Lọc sản phẩm rủi ro, thiếu tồn kho, URL không an toàn hoặc thông tin không đủ.
3. Tự chấm điểm và tuyển sản phẩm theo ba ngách Tarot, sáng tạo nội dung và in 3D.
4. Tự tạo deep link affiliate có UTM/sub-ID riêng cho từng sản phẩm.
5. Cập nhật catalog và trang công khai.
6. Tạo HTML tĩnh cho sản phẩm, danh mục và hướng dẫn.
7. Cập nhật sitemap/RSS và gửi URL thay đổi tới công cụ tìm kiếm.
8. Đồng bộ click, đơn hàng, doanh số và hoa hồng về dashboard owner riêng.
9. Dùng hiệu quả thực tế để điều chỉnh vòng tuyển sản phẩm tiếp theo.

Chủ sở hữu không chọn từng sản phẩm, không gắn từng link và không nhập từng đơn hàng.

## 2. Nhịp tự động

| Nhịp | Công việc |
|---|---|
| Mỗi 5 phút | Đồng bộ đơn hàng/giao dịch, đọc click nội bộ, cập nhật snapshot doanh thu và cảnh báo. |
| Mỗi 6 giờ | Rà lại sản phẩm, tạo/thay deep link, xuất bản lại trang SEO, sitemap, RSS và gửi tín hiệu IndexNow. |
| Khi deploy | Chạy ngay Growth Autopilot, đồng bộ doanh thu, dựng SEO và hậu kiểm production. |
| Theo yêu cầu owner | `/dongbo-doanhthu` đồng bộ ngay; `/autopilot-chay` chạy lại vòng sản phẩm. |

AccessTrade có thể ghi nhận/cập nhật đơn hàng chậm theo thời gian cache và đối soát của nguồn. Dashboard được gọi là **gần thời gian thực**, không cam kết tức thời tuyệt đối.

## 3. Link affiliate

Module `backend/choice-autopilot.js`:

- lấy sản phẩm từ AccessTrade Publisher API;
- tạo deep link cho từng sản phẩm;
- dùng `utm_source=hoi-chon-dung`;
- dùng `utm_medium=recommendation` ở dữ liệu public đã materialize;
- gắn campaign theo danh mục/vòng chạy;
- gắn `utm_content` theo source product ID để đối chiếu đơn hàng;
- không đưa affiliate URL thô vào API catalog công khai;
- người dùng đi qua `/r/choice/:id`, hệ thống đo click ẩn danh rồi chuyển hướng.

Catalog chỉ thay sản phẩm cũ khi vòng mới có đủ sản phẩm và link đã xác minh. Khi nguồn lỗi, giữ catalog gần nhất.

## 4. Trung tâm doanh thu owner-only

Module `backend/choice-revenue.js` cung cấp dashboard riêng tại:

`https://hiennhi89-gate.hiennhi89.workers.dev/owner/choice/revenue`

Không có liên kết công khai. Luồng truy cập:

1. Đúng tài khoản Telegram owner gửi `/doanhthu`.
2. Bot tạo vé ngẫu nhiên dùng một lần, hết hạn sau 10 phút.
3. Vé được đổi thành cookie `HttpOnly; Secure; SameSite=Strict`, hiệu lực 12 giờ.
4. Dashboard và API riêng đều `no-store`, `noindex`, `DENY frame`, CSP chặt.
5. Truy cập trực tiếp không có phiên nhận `401`.

Dashboard hiển thị:

- hôm nay, 7 ngày và 30 ngày;
- click, số đơn, doanh số ghi nhận;
- hoa hồng tổng, đang chờ, đã duyệt và bị từ chối;
- tỷ lệ đơn/click;
- EPC tổng và EPC đã duyệt;
- giá trị đơn trung bình;
- biểu đồ 30 ngày;
- sản phẩm và campaign tạo doanh thu;
- đơn hàng gần nhất;
- cảnh báo nhiều click không có đơn, tỷ lệ từ chối cao hoặc hoa hồng giảm.

Dashboard không lưu/hiển thị tên, số điện thoại hoặc email khách hàng.

### Lệnh Telegram owner

- `/doanhthu` — tóm tắt 7 ngày và link dashboard riêng.
- `/doanhthu-ngay` — số liệu hôm nay.
- `/doanhthu7` — số liệu 7 ngày.
- `/doanhthu30` — số liệu 30 ngày.
- `/dongbo-doanhthu` — buộc đồng bộ ngay.

## 5. SEO publisher

`tools/build-choice-seo.mjs` tạo HTML tĩnh trực tiếp từ catalog công khai:

- `/hoi-chon-dung/san-pham/<id>/`;
- `/hoi-chon-dung/danh-muc/tarot/`;
- `/hoi-chon-dung/danh-muc/sang-tao-noi-dung/`;
- `/hoi-chon-dung/danh-muc/in-3d/`;
- ba trang hướng dẫn nền tảng cho Tarot, quay video và vật liệu in 3D.

Mỗi trang sản phẩm có:

- title, description, canonical;
- Open Graph và Twitter Card;
- JSON-LD `Product`, `Offer`, `BreadcrumbList`;
- khoảng giá, đối tượng phù hợp, ưu/nhược điểm;
- công bố affiliate cạnh điểm chuyển đổi;
- link ngoài `rel="sponsored nofollow noopener"`;
- nội dung HTML có sẵn trong response, không phụ thuộc JavaScript.

Trang danh mục có `ItemList`, `FAQPage`; trang hướng dẫn có `Article` và breadcrumbs.

## 6. Phân phối tìm kiếm và nền tảng lớn

- **Google:** sitemap tự động; script Search Console API sẵn sàng sau một lần cấp service account.
- **Bing và các máy tìm kiếm hỗ trợ IndexNow:** URL mới/cập nhật được gửi tự động sau deploy SEO.
- **Facebook, Zalo, X, LinkedIn, Pinterest và ứng dụng nhắn tin:** Open Graph/Twitter metadata giúp đường dẫn có tiêu đề, mô tả và ảnh chia sẻ rõ ràng. Hệ thống không tự spam/đăng vào tài khoản chưa được cấp quyền.
- **RSS:** `/hoi-chon-dung/feed.xml` giúp công cụ đọc feed hoặc workflow phân phối nội dung tiếp nhận cập nhật mới.

IndexNow và Google là lớp thông báo/lập chỉ mục, không phải cam kết xếp hạng. Nội dung, trải nghiệm người dùng, uy tín nguồn và cạnh tranh vẫn quyết định hiệu quả SEO.

## 7. Điểm chạm bắt buộc một lần

### AccessTrade

Để có link affiliate thật và doanh thu thật:

1. Đăng nhập/đăng ký/KYC tại `https://pub2.accesstrade.vn/`.
2. Mở `https://pub2.accesstrade.vn/profile/api_key`.
3. Gửi `/atkey <API_KEY>` trong Telegram owner.

Sau đó hệ thống tự tạo link, cập nhật web và đồng bộ doanh thu. Recorder production hiện xác nhận credential `false`, sản phẩm tự tuyển `0` và đơn 7 ngày `0`; đây là trạng thái đúng trước khi kết nối.

### Google Search Console

IndexNow, sitemap public và HTML SEO không cần bước này. Để workflow tự gửi sitemap qua Google Search Console API, cần một lần:

1. Xác minh property `https://hiennhi89.pages.dev/` trong Search Console.
2. Tạo Google Cloud service account và bật Search Console API.
3. Thêm email service account vào property Search Console.
4. Lưu JSON credential thành GitHub secret `GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT_JSON`.

Nếu secret chưa có, workflow bỏ qua Google API nhưng vẫn deploy sitemap và gửi IndexNow.

## 8. Ranh giới public/private

Public:

- trang sản phẩm/danh mục/hướng dẫn;
- giá và thông tin lựa chọn;
- disclosure affiliate;
- sitemap, RSS, metadata chia sẻ;
- redirect đo click ẩn danh.

Owner/private:

- credential;
- doanh số/hoa hồng;
- đơn hàng;
- trạng thái nguồn;
- cảnh báo kinh doanh;
- dashboard và lệnh vận hành.

`tools/check-public-content.mjs` tiếp tục chặn nội dung owner/internal xuất hiện trong site public.

## 9. Bằng chứng kiểm thử và production

- PR #91 merge source `a73a807c7fedbcf7d8adad6ad8b0a0cd5d83e4b0`.
- Điều phối PR `30116008064`: SUCCESS.
- Validation cuối `30116312380`: source, Worker, Affiliate Autopilot, Revenue, SEO, privacy, frontend và WebKit AES thật đều SUCCESS.
- Production `30116421342`: cấu hình, source, SEO build, Worker-before-Pages, Growth trigger, Pages, IndexNow, Google step và production smoke đều SUCCESS.
- Production recorder commit `915178f6ead00c4052391caf925ceea385b5fc75`.
- Internal status recorder `30116490615`: SUCCESS; commit `e9ee55f3d55c14d10b83bbbb48efc794a7c0a6c6`.
- Smoke xác nhận dashboard không phiên `401/noindex`, public status `404`, Product schema, sitemap, RSS, IndexNow key và public boundary đều đạt.

## 10. Việc không được diễn giải sai

- Production hạ tầng đã hoàn tất, nhưng **chưa có link affiliate thật/doanh thu thật** vì AccessTrade chưa kết nối.
- “Google step SUCCESS” có thể là nhánh bỏ qua an toàn khi chưa có service account; không đồng nghĩa Search Console đã được cấp quyền.
- IndexNow đã gửi thành công trong deploy production.
- Không cam kết thứ hạng SEO hoặc doanh thu.
