# HỘI CHỌN ĐÚNG — GROWTH AUTOPILOT ĐA LĨNH VỰC

**Task-ID hiện hành:** `GROWTH-20260725-02` — `completed`  
**Runtime source:** `8b5ee3de54844aa50e6af87adfaec58d502e7f99` — PR #94  
**Production deploy:** `30121531643` — SUCCESS  
**Internal recorder:** `30121578951` — SUCCESS  
**Trạng thái nguồn affiliate:** chưa kết nối ACCESSTRADE credential; chưa có sản phẩm/link/doanh thu thật.

## 1. Chu trình tự động

Growth Autopilot thực hiện:

1. Lấy sản phẩm từ nguồn affiliate đã kết nối.
2. Tìm theo ba tín hiệu `BEST_SELLERS`, `RECOMMENDED`, `HIGH_COMMISSION_RATE`.
3. Lọc URL/tồn kho/dữ liệu và danh mục rủi ro.
4. Tính trend score và opportunity score.
5. Tuyển hai vòng: ưu tiên đa dạng dải giá trước, sau đó lấp quota; tối đa hai sản phẩm mỗi shop.
6. Tạo deep link có UTM/sub-ID để đối chiếu click và đơn hàng.
7. Cập nhật catalog mà không xóa nhóm cũ nếu nguồn mới chưa đủ dữ liệu.
8. Tạo HTML tĩnh, landing page, hướng dẫn, sitemap và RSS.
9. Gửi URL mới/cập nhật tới IndexNow.
10. Đồng bộ click, đơn, doanh số và hoa hồng vào dashboard owner.

Chủ sở hữu không chọn từng sản phẩm, không gắn từng link và không nhập từng đơn.

## 2. Taxonomy production

Hệ thống hiện hỗ trợ 12 lĩnh vực an toàn:

- Tarot & không gian thực hành.
- Sáng tạo nội dung.
- In 3D.
- Công nghệ & phụ kiện số.
- Nhà cửa & gia dụng.
- Làm đẹp & chăm sóc cá nhân, không gồm thuốc/supplement.
- Thời trang & phụ kiện.
- Mẹ & bé.
- Thú cưng.
- Học tập & văn phòng.
- Thể thao & vận động, không gồm sản phẩm giảm cân.
- Du lịch & di chuyển.

Blocklist gồm thuốc, thực phẩm bổ sung, rượu/nicotine/chất gây nghiện, vũ khí/chất nổ, sản phẩm người lớn, cờ bạc, hóa chất độc, chất phóng xạ và hàng giả.

## 3. Nhịp vận hành

| Nhịp | Công việc |
|---|---|
| Mỗi 5 phút | Đồng bộ click, đơn hàng, giao dịch, snapshot doanh thu và cảnh báo. |
| Mỗi 6 giờ | Rà sản phẩm, tạo/thay deep link, dựng lại SEO, sitemap/RSS và gửi IndexNow. |
| Khi deploy | Chạy Growth cycle ngay, dựng SEO và hậu kiểm production. |
| Owner yêu cầu | `/dongbo-doanhthu`, `/autopilot-chay`, `/doanhthu`, `/ketnoi`. |

Dữ liệu doanh thu được gọi là **gần thời gian thực** vì phụ thuộc thời gian ghi nhận/cache/đối soát của mạng affiliate.

## 4. SEO và phân phối

Mỗi danh mục có landing page và trang hướng dẫn ngay cả khi đang chờ dữ liệu sản phẩm. Trang sản phẩm có canonical, Open Graph, Twitter Card và JSON-LD `Product`, `Offer`, `BreadcrumbList`. Trang danh mục/hướng dẫn có `ItemList`, `FAQPage` và `Article` phù hợp.

- Sitemap/RSS bao phủ 12 danh mục.
- IndexNow được gửi tự động sau deploy SEO.
- Google Search Console API hoạt động khi owner đã xác minh property và cấp service account; thiếu credential thì nhánh Google được bỏ qua an toàn.
- Metadata chia sẻ hỗ trợ hiển thị đường dẫn trên Facebook, Zalo, X, LinkedIn, Pinterest và ứng dụng nhắn tin; hệ thống không tự spam tài khoản chưa được cấp quyền.

## 5. PWA và public/private

- PWA cache hiện hành: `hoi-chon-dung-v4`; cache V3 cũ bị xóa khi activate.
- Public API không trả affiliate URL thô hoặc metadata vận hành.
- Public status route `/api/choice/autopilot/status` trả `404`.
- Owner setup và revenue dashboard không có phiên trả `401/noindex`.
- Public scanner chặn onboarding, credential, Worker/KV/cron, doanh thu và nội dung owner khỏi site công khai.

## 6. Owner endpoints

- `/owner/choice/setup` — trung tâm kết nối, mở bằng `/ketnoi`.
- `/owner/choice/revenue` — dashboard doanh thu, mở bằng `/doanhthu`.

Cả hai dùng vé một lần 10 phút và cookie `HttpOnly; Secure; SameSite=Strict` 12 giờ.

## 7. Bằng chứng production

- Điều phối: `30121459380` — SUCCESS.
- Validation: `30121459426` — SUCCESS, gồm source, materializer, Worker, Affiliate, setup, revenue, SEO, boundary, frontend và WebKit.
- Production: `30121531643` — SUCCESS.
- Production recorder: `3d5373ac6627fe183d0b02f9d72449ad675cea7c`.
- Internal status recorder: `30121578951` — SUCCESS; commit `023328ed3779ea0a63e7852438892cda3fc0ab43`.

## 8. Trạng thái kinh doanh trung thực

Production kỹ thuật đã hoàn tất. Recorder vẫn xác nhận chưa có ACCESSTRADE credential, sản phẩm thật hoặc đơn thật. Owner cần đăng nhập/KYC, khai báo ngân hàng và gửi `/atkey <API_KEY>` một lần. Sau đó hệ thống tự vận hành.
