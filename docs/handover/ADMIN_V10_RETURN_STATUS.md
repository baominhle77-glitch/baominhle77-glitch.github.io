# Admin V10 — quay lại Bói toán

- Trạng thái: `SUCCESS`
- Source commit: `808f8c4df5b328f208c98ba0b639b316ab3b2e60`
- Hoàn tất UTC: `2026-07-23T18:13:01Z`
- Deploy workflow run: `https://github.com/baominhle77-glitch/baominhle77-glitch.github.io/actions/runs/push-or-manual`
- Verification workflow run: `https://github.com/baominhle77-glitch/baominhle77-glitch.github.io/actions/runs/30032516574`
- Static production: `success`; Gate/Admin/Index/SW HTTP `200/200/200/200`; lần đạt `1`.
- Cài WebKit: `success`.
- Luồng WebKit: `success`.
- Production gate yêu cầu marker `Account V10 authoritative Admin return`, `adminReturnCandidate`, `requested || !!token`, `restoreAdminApp` và `reveal("admin-return")`.
- Trang Quản trị dùng `?admin_return=1&v=18`; index tải `gate.js?v=18`; cache `boitoan-v18`.
- WebKit chỉ gieo `market_admin_token` và `gate_device_id`, cố ý xóa session/level/primary/auth_version để mô phỏng đúng lỗi iPhone.
- Backend hợp lệ phải tự phục hồi toàn bộ cờ và mở app; backend từ chối mới xóa token và hiện cổng.
- Không sử dụng mật khẩu Admin thật trong bài kiểm tra.
