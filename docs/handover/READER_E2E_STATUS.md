# Trạng thái E2E Reader production

- Trạng thái: `FAILURE`
- Source commit: `4c4fa6911637ff6da5e2cf4da986f496d06ca8e3`
- Hoàn tất UTC: `2026-07-23T09:24:53Z`
- Deploy workflow run: `https://github.com/baominhle77-glitch/baominhle77-glitch.github.io/actions/runs/29995127965`
- E2E workflow run: `https://github.com/baominhle77-glitch/baominhle77-glitch.github.io/actions/runs/29995170573`
- Register / login thiết bị 2 / me / WebKit app / delete / token revoked / login sau xóa: `201/200/200/crash/n/a/n/a/n/a`
- Mã lỗi an toàn: `webkit_page_failure`
- WebKit: mở trang `/boitoan/` sau khi nạp phiên Reader đã xác thực; tab không crash, chỉ có một link Cộng đồng và tổng mutation hữu hạn.
- Dữ liệu thử: tài khoản có tiền tố `e2e_reader_`; workflow gọi API tự xóa và xác nhận token cùng đăng nhập đều bị thu hồi.
