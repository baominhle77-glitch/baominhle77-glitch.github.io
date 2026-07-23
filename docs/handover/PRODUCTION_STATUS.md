# Trạng thái production

- Trạng thái production: `SUCCESS`
- Kết luận workflow gốc: `FAILURE`
- Source commit: `27e6a4de84b8639da282308eda4f9762fc84c795`
- Hoàn tất UTC: `2026-07-23T16:47:38Z`
- Workflow run: `https://github.com/baominhle77-glitch/baominhle77-glitch.github.io/actions/runs/30026591180`
- Sự kiện: `push`
- Cloudflare Pages / Worker / hậu kiểm production: `success/success/success`
- Ghi chú: Production đã đạt; workflow chỉ lỗi tại bước ghi trạng thái cũ sau deploy.
- Account V6: cùng một mục Admin; backend phân cấp `regular` và `primary`; trang Quản trị không hỏi mật khẩu lần hai.
- Admin thường: quản lý member, review và bài thảo luận.
- Admin tổng: toàn bộ quyền Admin thường, thêm hội thoại riêng và trang cá nhân member; chỉ một thiết bị primary hoạt động.
- Bảo mật: không lưu mật khẩu plaintext trong source; JWT gắn thiết bị; `ADMIN_TOKEN` cũ không được chấp nhận tại Community API.
