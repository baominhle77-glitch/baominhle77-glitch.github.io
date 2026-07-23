# Trạng thái E2E Reader production

- Trạng thái: `FAILURE`
- Source commit: `d9f90eb87f59651fba2a52b220adb91258a30d5b`
- Hoàn tất UTC: `2026-07-23T09:36:43Z`
- Deploy workflow run: `https://github.com/baominhle77-glitch/baominhle77-glitch.github.io/actions/runs/29995893312`
- E2E workflow run: `https://github.com/baominhle77-glitch/baominhle77-glitch.github.io/actions/runs/29995942577`
- Register / login thiết bị 2 / me / WebKit gate / delete / token revoked / login sau xóa: `201/200/200/failure/n/a/n/a/n/a`
- Mã lỗi an toàn: `webkit_timeout_or_process_failure`
- WebKit pha 1: mở HTML/CSS/JS production thật ở trạng thái sạch và theo dõi crash.
- WebKit pha 2: tài liệu plaintext tối thiểu cùng origin nạp đúng `/assets/gate.js` production, kích hoạt phiên Reader, MutationObserver và nav; yêu cầu đúng một link và mutation ổn định.
- Dữ liệu thử: tài khoản có tiền tố `e2e_reader_`; workflow gọi API tự xóa và xác nhận token cùng đăng nhập đều bị thu hồi.
