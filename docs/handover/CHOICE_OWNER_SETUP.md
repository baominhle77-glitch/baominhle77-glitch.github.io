# HỘI CHỌN ĐÚNG — TRUNG TÂM KẾT NỐI CHỦ SỞ HỮU

**Task-ID:** `GROWTH-20260725-02` — `completed`  
**Runtime source:** `8b5ee3de54844aa50e6af87adfaec58d502e7f99` — PR #94  
**Production deploy:** `30121531643` — SUCCESS  
**Internal recorder:** `30121578951` — SUCCESS  
**Phân loại:** Owner/Internal — không sao chép nội dung này lên website hoặc API công khai.

## 1. Kết quả production

Trung tâm kết nối owner đã deploy tại:

`https://hiennhi89-gate.hiennhi89.workers.dev/owner/choice/setup`

Không có liên kết công khai. Đúng tài khoản Telegram owner gửi một trong các lệnh:

- `/ketnoi`
- `/caidat`
- `/setup`

Bot tạo vé ngẫu nhiên dùng một lần, hết hạn sau 10 phút. Vé được đổi thành cookie `HttpOnly; Secure; SameSite=Strict`, hiệu lực 12 giờ. Truy cập không có phiên trả `401`; mọi response là `noindex/no-store`, CSP chặt và frame deny.

## 2. Các nút đã mở sẵn

Trang owner có sẵn nút tới:

1. Đăng ký ACCESSTRADE Publisher.
2. Đăng nhập ACCESSTRADE Pub2.
3. Khai báo tài khoản ngân hàng nhận hoa hồng.
4. Xem lịch sử thanh toán.
5. Lấy ACCESSTRADE API key.
6. Google Search Console.
7. Bing Webmaster Tools.
8. Pinterest Business.

Chủ sở hữu chỉ đăng ký, đăng nhập, KYC, khai báo ngân hàng và cấp quyền bắt buộc. Công ty tự xử lý sản phẩm, deep link, web, SEO, click, đơn và hoa hồng sau khi nguồn được kết nối.

## 3. Nhận tiền affiliate

- Hoa hồng thuộc tài khoản ACCESSTRADE Publisher của chủ sở hữu.
- ACCESSTRADE chuyển khoản vào tài khoản ngân hàng đã khai báo; không thiết kế luồng bấm rút từng đơn.
- Trung tâm owner nhắc nhập **số tài khoản ngân hàng**, không nhập dãy số trên thẻ ATM.
- Dashboard doanh thu chỉ đọc dữ liệu tổng hợp; repository và public UI không lưu thông tin ngân hàng.

## 4. Trạng thái kết nối hiện tại

Recorder production xác nhận:

- AccessTrade credential: chưa kết nối.
- Sản phẩm affiliate thật tự tuyển: `0`.
- Đơn ghi nhận 7 ngày: `0`.

Đây là trạng thái đúng trước khi owner hoàn tất đăng nhập/KYC và gửi `/atkey <API_KEY>` trong Telegram. Hạ tầng không được diễn giải thành đã có doanh thu thật.

## 5. Bảo mật và quyền riêng tư

- Không commit API key, token, service account, tài khoản ngân hàng hoặc Telegram ID thực.
- Không lưu tên, email hoặc số điện thoại khách hàng trong dashboard.
- Không tự đăng/spam mạng xã hội khi chưa có quyền OAuth chính thức và adapter đã kiểm thử.
- Public scanner và production smoke xác nhận trang người dùng không lộ onboarding, credential, doanh thu hoặc nội dung owner.

## 6. Bằng chứng

- Điều phối PR: `30121459380` — SUCCESS.
- Validation cuối: `30121459426` — SUCCESS, gồm Worker, Affiliate, setup owner, revenue, SEO, public/private và WebKit AES thật.
- Production: `30121531643` — SUCCESS, gồm Worker-before-Pages, Growth cycle, Pages, PWA V4, 12 nhóm SEO, IndexNow và smoke route private.
- Production recorder: commit `3d5373ac6627fe183d0b02f9d72449ad675cea7c`.
- Internal recorder: `30121578951` — SUCCESS; commit `023328ed3779ea0a63e7852438892cda3fc0ab43`.
