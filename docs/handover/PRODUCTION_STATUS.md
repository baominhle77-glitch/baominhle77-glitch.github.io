# Trạng thái production

- Trạng thái production: `SUCCESS`
- Kết luận workflow gốc: `FAILURE`
- Source commit: `b5ed52305192455d161c3e22934e3aeaada61eb3`
- Hoàn tất UTC: `2026-07-23T12:32:26Z`
- Workflow run: `https://github.com/baominhle77-glitch/baominhle77-glitch.github.io/actions/runs/30007344122`
- Sự kiện: `push`
- Cloudflare Pages / Worker / hậu kiểm production: `success/success/success`
- Ghi chú: Production đã đạt; workflow chỉ lỗi tại bước ghi trạng thái cũ sau deploy.
- Account V6: cùng một mục Admin; backend phân cấp `regular` và `primary`; trang Quản trị không hỏi mật khẩu lần hai.
- Admin thường: quản lý member, review và bài thảo luận.
- Admin tổng: toàn bộ quyền Admin thường, thêm hội thoại riêng và trang cá nhân member; chỉ một thiết bị primary hoạt động.
- Bảo mật: không lưu mật khẩu plaintext trong source; JWT gắn thiết bị; `ADMIN_TOKEN` cũ không được chấp nhận tại Community API.
