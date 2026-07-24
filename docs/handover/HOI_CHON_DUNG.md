# HỘI CHỌN ĐÚNG — AFFILIATE VÀ GROWTH AUTOPILOT V4

**Runtime task:** `GROWTH-20260725-02` — `completed`  
**Production:** `https://hiennhi89.pages.dev/hoi-chon-dung/`  
**Backend public:** `https://hiennhi89-gate.hiennhi89.workers.dev/api/choice/*`  
**Runtime source:** `8b5ee3de54844aa50e6af87adfaec58d502e7f99` — PR #94  
**Production run:** `30121531643` — SUCCESS  
**Internal recorder:** `30121578951` — SUCCESS  
**PWA cache:** `hoi-chon-dung-v4`

## 1. Mô hình sản phẩm

Hội Chọn Đúng là web cộng đồng so sánh và gợi ý sản phẩm. Growth Autopilot tự tìm sản phẩm, lọc rủi ro, chấm điểm xu hướng, tạo deep link affiliate, cập nhật catalog, dựng SEO và đọc hiệu quả thực tế để tối ưu vòng sau.

Taxonomy hiện có 12 nhóm: Tarot, creator, in 3D, công nghệ, gia dụng, làm đẹp, thời trang, mẹ & bé, thú cưng, văn phòng, vận động và du lịch.

## 2. Public UI

Người dùng được xem:

- nhu cầu, ngân sách và ưu tiên;
- giá, nơi bán, điểm mạnh/yếu, tương thích, bảo hành và đổi trả;
- công bố affiliate;
- trang sản phẩm, danh mục và hướng dẫn;
- bình chọn, so sánh, lưu và chia sẻ.

Người dùng không được xem:

- trạng thái nguồn/credential/onboarding;
- Worker, KV, cron, workflow, commit hoặc production;
- doanh thu, hoa hồng, đơn hàng và cảnh báo nội bộ;
- việc chủ sở hữu cần đăng nhập/KYC/cấp quyền.

Public status route trả `404`; public scanner chạy trên source và site sau build.

## 3. Owner/private

- `/ketnoi` mở Trung tâm kết nối owner tại `/owner/choice/setup`.
- `/doanhthu` mở dashboard doanh thu tại `/owner/choice/revenue`.
- Vé dùng một lần 10 phút; cookie bảo mật 12 giờ.
- Không phiên trả `401`; toàn bộ owner route là `noindex/no-store`.

Trung tâm kết nối có sẵn link ACCESSTRADE đăng ký/đăng nhập/ngân hàng/thanh toán/API key, Google Search Console, Bing Webmaster và Pinterest Business.

## 4. Nhịp tự động

- 5 phút: đồng bộ click, đơn, giao dịch, hoa hồng và cảnh báo.
- 6 giờ: discovery đa lĩnh vực, deep link, catalog, SEO, sitemap/RSS và IndexNow.
- Khi deploy: chạy ngay Growth cycle và production smoke.

## 5. SEO

- HTML tĩnh cho sản phẩm.
- Landing page và hướng dẫn cho toàn bộ 12 danh mục, kể cả khi đang chờ nguồn sản phẩm.
- Canonical, Open Graph, Twitter Card.
- JSON-LD Product/Offer/Breadcrumb/ItemList/FAQ/Article.
- Sitemap, RSS và IndexNow tự động.
- Google Search Console API tùy thuộc owner xác minh property và cấp service account.

## 6. Bảo mật và rào chắn

- Không commit secret, API key, ngân hàng hoặc dữ liệu khách hàng.
- Không bịa giá, tồn kho, đánh giá, đơn hàng hoặc doanh thu.
- Block thuốc/supplement, chất gây nghiện, vũ khí/chất nổ, hàng người lớn, cờ bạc, độc chất và hàng giả.
- Không tự spam mạng xã hội; chỉ dùng OAuth/API chính thức sau khi được cấp quyền và kiểm thử.

## 7. Trạng thái hiện tại

Production kỹ thuật hoàn tất. ACCESSTRADE credential vẫn chưa được kết nối; catalog thật và đơn 7 ngày vẫn bằng 0. Owner cần hoàn tất đăng nhập/KYC/ngân hàng và gửi `/atkey <API_KEY>` một lần. Xem `CHOICE_OWNER_SETUP.md` và `CHOICE_GROWTH_AUTOPILOT.md`.

## 8. Bằng chứng

- Điều phối `30121459380` — SUCCESS.
- Validation `30121459426` — SUCCESS.
- Production `30121531643` — SUCCESS.
- Recorder production `3d5373ac6627fe183d0b02f9d72449ad675cea7c`.
- Recorder nội bộ `023328ed3779ea0a63e7852438892cda3fc0ab43`.
