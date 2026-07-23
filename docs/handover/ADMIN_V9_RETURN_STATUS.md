# Admin V9 — quay lại Bói toán

- Trạng thái: `SUCCESS`
- Source commit: `a6d73baece56e11588375a1c00ac8e12c9444598`
- Hoàn tất UTC: `2026-07-23T16:58:49Z`
- Deploy workflow run: `https://github.com/baominhle77-glitch/baominhle77-glitch.github.io/actions/runs/push-or-manual`
- Verification workflow run: `https://github.com/baominhle77-glitch/baominhle77-glitch.github.io/actions/runs/30027374756`
- Static production: `success`; Gate/Admin/SW HTTP `200/200/200`; lần đạt `1`.
- Cài WebKit: `success`.
- Luồng WebKit: `success`.
- Production gate yêu cầu marker `Account V9 Admin return-to-app`, `storedAdminReturnCandidate`, `restoreAdminApp` và `reveal("admin-return")`.
- Trang Quản trị yêu cầu liên kết `← Bói toán` dùng `?admin_return=1`; cache `boitoan-v17`.
- WebKit hợp lệ: JWT Admin được mock server xác nhận thì app mở thẳng, không dựng cổng đăng nhập.
- WebKit không hợp lệ: JWT bị xóa và cổng đăng nhập mới xuất hiện.
- Không sử dụng mật khẩu Admin thật trong bài kiểm tra.
