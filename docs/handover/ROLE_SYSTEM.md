# Trạng thái hệ thống tài khoản Bói toán

Cập nhật: 2026-07-23 (GMT+7)

## Vai trò

- `Khách`: xem bài, tìm Reader, trò chuyện, đánh giá và tham gia bài thảo luận chung.
- `Reader / Người xem bói`: hồ sơ chuyên môn, thông tin nhận phí, quản lý khách hàng và gửi nội dung luận giải.
- `Admin`: quản lý member, review và bài thảo luận.
- `Admin tổng`: vẫn dùng quyền Admin nhưng chỉ thiết bị đã khóa trong KV mới được đọc hội thoại riêng và mở giao diện member bằng phiên xem chỉ đọc.

Mật khẩu Admin và mã thiết bị cụ thể không lưu trong repository. Thiết bị Admin tổng được ghi vào Workers KV sau khi đăng nhập Admin hợp lệ hoặc bấm nút đặt thiết bị trong trang quản trị.

## Onboarding

- Màn đầu chỉ có ba lựa chọn: `Đăng nhập`, `Đăng ký`, `Admin`.
- Sau khi chọn, hệ thống chuyển sang màn thao tác riêng và có nút quay lại; không render đồng thời các biểu mẫu.
- Đăng ký yêu cầu chọn `Khách` hoặc `Reader / Người xem bói`.
- Trang Bói toán hiện là source plaintext được gate che; sau đăng ký frontend mở trực tiếp bằng phiên hợp lệ, không gọi giải mã AES khi trang không có payload mã hóa.
- Nếu username đã được tạo ở lần thử trước, thành viên dùng nhánh Đăng nhập thay vì đăng ký lại.

## Quyền và dữ liệu

- Mật khẩu member được băm PBKDF2; phiên community 30 ngày.
- Review công khai 1–5 sao; Khách gỡ review của mình, Admin xóa được, Reader không xóa được.
- Admin có thể khóa/mở khóa hoặc xóa tài khoản member và tạo/đóng/xóa bài thảo luận chung.
- Xóa tài khoản loại bỏ hồ sơ, thông tin đăng nhập, phiên và chỉ mục liên quan; lịch sử hội thoại độc lập vẫn tuân theo TTL 30 ngày.
- Chat Reader–Khách giữ tối đa 30 ngày.
- Admin tổng xem được chat và mở giao diện member bằng token `impersonation` chỉ đọc; backend chặn mọi thao tác ghi dưới danh nghĩa member.
- Các thao tác Admin nhạy cảm được ghi audit trong KV.

## Hiển thị giao diện

- Vai trò hiện cạnh tên/avatar trong app và Cộng đồng.
- Khách mặc định vào danh sách Reader; Reader mặc định vào khu Khách hàng/Trò chuyện.
- Cả hai vai trò đều có tab `Thảo luận` và `Trang cá nhân`.

## Cấu trúc

- `backend/community.js`: API tài khoản, Reader, review, chat, bài thảo luận và Admin.
- `assets/community.js`, `assets/community-admin.js`, `assets/community.css`: giao diện theo vai trò.
- `boitoan/community.html`, `boitoan/community-admin.html`: trang member và quản trị.
- `tools/apply-role-system.mjs`: lớp tích hợp nền.
- `tools/apply-account-v2.mjs`: sửa onboarding, lỗi plaintext, badge vai trò và quyền Admin mở rộng.
- `.github/workflows/validate-role-system.yml`: kiểm tra PR.
- `.github/workflows/deploy-pages.yml`: build, test, deploy Pages trước Worker và smoke test production.
