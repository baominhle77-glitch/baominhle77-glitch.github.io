# Trạng thái production

- Trạng thái: `FAILURE`
- Source commit: `757c4341179b185a5d3dffdd0c2a7431baef9da2`
- Hoàn tất UTC: `2026-07-23T12:26:02Z`
- Workflow run: `https://github.com/baominhle77-glitch/baominhle77-glitch.github.io/actions/runs/30006916811`
- Sự kiện: `push`
- Workflow deploy đã tự chạy build, toàn bộ test Account/Travel/Worker, triển khai Pages trước Worker và hậu kiểm production.
- Account V6: cùng một mục Admin; backend phân cấp `regular` và `primary`; trang Quản trị không hỏi mật khẩu lần hai.
- Admin thường: quản lý member, review và bài thảo luận.
- Admin tổng: toàn bộ quyền Admin thường, thêm hội thoại riêng và trang cá nhân member; chỉ một thiết bị primary hoạt động.
- Bảo mật: không lưu mật khẩu plaintext trong source; JWT gắn thiết bị; `ADMIN_TOKEN` cũ không được chấp nhận tại Community API.
