# HỘI CHỌN ĐÚNG — GROWTH AUTOPILOT ĐA LĨNH VỰC

**Task hiện hành:** `GROWTH-20260725-03` — `completed`  
**Runtime source:** `219ff22c4dcff1c2576b6008dd652e6ae5a5314f` — PR #104  
**Deploy recovery source:** `aa8de287587e03c565be75806c7139f8959c8fba` — PR #106  
**Production deploy:** `30142147938` — SUCCESS  
**Credential bootstrap:** `30142378416` — SUCCESS  
**Trạng thái affiliate:** AccessTrade connected; Autopilot `active`; `24` sản phẩm thật ở vòng kết nối đầu tiên.

## 1. Chu trình tự động

Growth Autopilot thực hiện:

1. Đọc credential AccessTrade đã mã hóa từ Worker secret hoặc Cloudflare KV.
2. Xác thực qua Publisher API `/v1/campaigns`.
3. Thử nguồn TikTok Shop khi tài khoản được cấp quyền.
4. Nếu TikTok Shop không khả dụng, chuyển sang `/v1/datafeeds` và dùng `aff_link` sẵn có.
5. Lọc URL, giá, danh mục rủi ro và nguồn không đủ dữ liệu.
6. Tính trend score và opportunity score.
7. Tuyển hai vòng: ưu tiên nhiều dải giá rồi lấp quota; tối đa hai sản phẩm mỗi shop.
8. Tạo hoặc dùng deep link affiliate, UTM và sub-ID để đối chiếu click/đơn.
9. Cập nhật catalog mà không xóa nhóm cũ nếu nguồn mới thiếu dữ liệu.
10. Dựng HTML tĩnh, landing page, hướng dẫn, sitemap và RSS.
11. Gửi URL mới/cập nhật tới IndexNow.
12. Đồng bộ click, đơn, doanh số và hoa hồng vào dashboard owner.

Chủ sở hữu không chọn từng sản phẩm, không gắn từng link và không nhập từng đơn.

## 2. Taxonomy production

Hệ thống hỗ trợ 12 lĩnh vực an toàn:

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
| Khi credential được kết nối | Chạy ngay discovery và cập nhật catalog. |
| Khi deploy | Deploy Worker trước Pages; gửi tín hiệu Growth không chặn Pages; hậu kiểm production vẫn bắt buộc. |
| Owner yêu cầu | `/dongbo-doanhthu`, `/autopilot-chay`, `/doanhthu`, `/ketnoi`. |

Dữ liệu doanh thu là **gần thời gian thực** vì phụ thuộc thời gian ghi nhận, cache và đối soát của mạng affiliate.

## 4. Trạng thái sản phẩm

Bootstrap result production:

- `connected`: `true`.
- `autopilot_ok`: `true`.
- `mode`: `active`.
- `selected_products`: `24`.

Đây là sản phẩm affiliate thật được nguồn AccessTrade chấp nhận trong vòng kết nối đầu tiên. Số lượng có thể thay đổi ở các vòng 6 giờ theo dữ liệu tồn kho, link, giá và bộ lọc an toàn.

## 5. SEO và xác minh công cụ tìm kiếm

Mỗi danh mục có landing page và trang hướng dẫn. Trang sản phẩm có canonical, Open Graph, Twitter Card và JSON-LD `Product`, `Offer`, `BreadcrumbList`; danh mục/hướng dẫn có `ItemList`, `FAQPage` và `Article`.

- Sitemap/RSS bao phủ 12 danh mục.
- IndexNow gửi tự động sau deploy SEO.
- File Google Search Console live tại `/google91001f63e8104533.html`.
- File Bing Webmaster live tại `/BingSiteAuth.xml`.
- Hai file được giữ trong deploy chính và workflow SEO 6 giờ.
- Google Search Console API tự gửi sitemap khi service account đã được cấp; nếu chưa có thì bỏ qua an toàn.

## 6. PWA và public/private

- PWA cache hiện hành: `hoi-chon-dung-v4`.
- Public API không trả credential, affiliate URL thô hoặc metadata vận hành.
- Public status route `/api/choice/autopilot/status` trả `404`.
- Owner setup và revenue dashboard không có phiên trả `401/noindex`.
- Credential bootstrap là one-time, `noindex/no-store`; sau khi dùng, RSA keypair bị xóa và route public-key chuyển sang trạng thái đã sử dụng.
- Public scanner chặn onboarding, credential, Worker/KV/cron, doanh thu và nội dung owner khỏi site công khai.

## 7. Bằng chứng production

- PR #104 coordination: `30141399269` — SUCCESS.
- PR #104 validation: `30141399267` — SUCCESS.
- PR #106 coordination: `30142103596` — SUCCESS.
- PR #106 validation: `30142103615` — SUCCESS.
- Production recovery: `30142147938` — SUCCESS.
- Production recorder: `a770da880580d68c52981b9c59f1686c438538a3`.
- Credential bootstrap operation: `30142378416` — SUCCESS.
- Temporary PR #107: closed without merge.

## 8. Trạng thái kinh doanh trung thực

Kết nối kỹ thuật và catalog affiliate đã hoạt động. Chưa được phép diễn giải `24 sản phẩm` thành đã có đơn hoặc doanh thu. Doanh thu chỉ được ghi nhận khi AccessTrade trả giao dịch/click/hoa hồng thực tế; dashboard tiếp tục đồng bộ theo cron.

Việc còn lại phía giao diện tài khoản tìm kiếm: chủ sở hữu bấm **Verify/Xác minh** trong Google Search Console và Bing Webmaster nếu hai nền tảng vẫn hiển thị trạng thái chờ. Không cần tải hoặc chèn thêm file.
