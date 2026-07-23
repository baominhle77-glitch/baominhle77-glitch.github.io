# Trạng thái E2E Reader production

- Trạng thái: `SUCCESS`
- Source commit: `bc8016a23c342ff93416003293148c06263242f8`
- Hoàn tất UTC: `2026-07-23T09:45:34Z`
- Deploy workflow run: `https://github.com/baominhle77-glitch/baominhle77-glitch.github.io/actions/runs/29996510949`
- E2E workflow run: `https://github.com/baominhle77-glitch/baominhle77-glitch.github.io/actions/runs/29996558091`
- Register / login thiết bị 2 / me / WebKit gate / delete / token revoked / login sau xóa: `201/200/200/200/200/401/401`
- Mã lỗi an toàn: `none`
- WebKit pha 1: mở HTML/CSS/JS production thật ở trạng thái sạch và theo dõi crash.
- WebKit pha 2: tài liệu plaintext tối thiểu cùng origin nạp đúng `/assets/gate.js` production, kích hoạt phiên Reader, MutationObserver và nav; yêu cầu đúng một link và mutation ổn định.
- Script kiểm thử: `tools/webkit-production-check.mjs`, đã được `node --check` trong CI và trước khi chạy.
- Dữ liệu thử: tài khoản có tiền tố `e2e_reader_`; workflow gọi API tự xóa và xác nhận token cùng đăng nhập đều bị thu hồi.
