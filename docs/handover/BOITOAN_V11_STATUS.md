# Bói toán V11 — trạng thái đã xác minh

- Trạng thái: `SUCCESS`
- Hoàn tất: `2026-07-24T02:39:00+07:00`
- Runtime source merge: `b298d8b226a3634f6259ce6d2885da0ca2a4535c`
- Sửa hậu kiểm Cloudflare: `9cd9dfab6eb925cdfaf597cd794bb03b72c110c3`
- Deploy production cuối: `30038693404` — SUCCESS
- Production audit: `30038397473` — static/API SUCCESS; WebKit AES thật SUCCESS
- Pre-merge validation: `30037623935` — frontend/Worker/WebKit AES thật SUCCESS

## Nguyên nhân lỗi trang trống

Trang Bói toán lưu ứng dụng trong payload AES-GCM. V10 xác minh JWT Admin rồi gọi `reveal()` khi payload chưa được giải mã và chưa được bơm vào `#gate-content`, nên chỉ hiện các thành phần nổi bên ngoài.

## Hợp đồng V11

1. Backend xác thực phiên và cấp khóa giải mã.
2. Frontend chạy `decryptPayload()`.
3. Frontend chạy `injectHtml()`.
4. Frontend xác nhận DOM ứng dụng không rỗng.
5. Chỉ sau đó mới chạy `reveal()`.
6. Thiếu khóa, khóa sai, backend từ chối hoặc DOM rỗng đều fail-closed và quay về cổng đăng nhập.

## Kiến trúc đã đơn giản hóa

- Source Bói toán là source trực tiếp; không còn chuỗi patch V2–V10 trong build/deploy.
- Các runner migration cũ chỉ còn no-op để tương thích lịch sử.
- Worker được deploy trước Pages.
- Cache hiện hành: `boitoan-v19`; `gate.js?v=19`.
- Kiểm thử WebKit dùng payload AES thật và bắt buộc tìm thấy nội dung ứng dụng cùng `.screen.active`, không dùng fixture plaintext.

## Quyền được giữ nguyên

- Khách và Reader: tài khoản, hồ sơ, thảo luận, review, chat và luồng tư vấn/thanh toán.
- Admin thường: quản lý tài khoản, review và bài thảo luận.
- Admin tổng: toàn bộ quyền Admin thường, thêm hội thoại riêng và chế độ xem trang cá nhân member chỉ đọc; một thiết bị primary.
- Không lưu mật khẩu Admin dạng plaintext trong source; JWT gắn thiết bị; backend là nguồn quyết định quyền.
