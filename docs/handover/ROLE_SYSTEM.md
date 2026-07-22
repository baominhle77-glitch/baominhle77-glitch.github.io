# Trạng thái hệ thống tài khoản Bói toán

Cập nhật: 2026-07-23 (GMT+7)

## Phạm vi đã triển khai

- Vai trò công khai: `Khách`, `Reader / Người luận giải`; quản trị dùng `ADMIN_TOKEN` hiện hành.
- Tài khoản có tên đăng nhập, mật khẩu băm PBKDF2 và phiên 30 ngày; việc đăng ký/đăng nhập chỉ thực hiện sau khi đã qua cổng duyệt Bói toán.
- Khách có hồ sơ cá nhân, không có trường đánh giá.
- Reader có giới thiệu, mảng chuyên sâu, tài khoản ngân hàng và QR; API từ chối đường dẫn trong hồ sơ Reader và thông tin nhận phí.
- Đánh giá công khai 1–5 sao + text; mỗi Khách có một đánh giá đang hoạt động cho mỗi Reader. Khách tự gỡ đánh giá của mình; Admin gỡ được; Reader không có endpoint gỡ.
- Chat Reader–Khách lưu tối đa 30 ngày trong Workers KV, polling 1,5 giây; hỗ trợ tin nhắn thường, nội dung luận giải, báo phí, khách báo đã chuyển khoản và Reader xác nhận.
- Chat Reader–Khách không gửi bản sao Telegram.
- Quyền Admin xem nội dung chat yêu cầu đồng thời `ADMIN_TOKEN` và đúng một owner-device ID đã khóa trong KV. Các Admin khác vẫn quản lý tài khoản/review nhưng không đọc chat.

## Cấu trúc

- `backend/community.js`: API tài khoản, Reader, review, chat, Admin.
- `assets/community.js`, `assets/community-admin.js`, `assets/community.css`: giao diện.
- `boitoan/community.html`, `boitoan/community-admin.html`: trang người dùng và quản trị.
- `tools/apply-role-system.mjs`: vá nối vào Worker/gate/service worker tại thời điểm CI build.
- `.github/workflows/validate-role-system.yml`: kiểm tra PR.
- `.github/workflows/deploy-pages.yml`: build và deploy đồng bộ Pages + Worker.

## Vận hành

1. Sau deploy, mở `/boitoan/`, đăng nhập quyền chủ, bấm `Cộng đồng`.
2. Mở `/boitoan/community-admin.html`, nhập mật khẩu Admin và bấm `Khóa thiết bị chủ này` trên đúng thiết bị của chủ.
3. Owner-device chỉ bind lần đầu; muốn đổi thiết bị phải thực hiện migration KV có chủ đích.
