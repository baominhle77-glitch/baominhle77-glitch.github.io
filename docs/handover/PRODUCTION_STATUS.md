# Trạng thái production

- Trạng thái: `SUCCESS`
- Source commit: `39c169ab8e88669b50a7354845af2cfaefc3c037`
- Hoàn tất UTC: `2026-07-23T08:48:36Z`
- Workflow run: `https://github.com/baominhle77-glitch/baominhle77-glitch.github.io/actions/runs/29992427674`
- Cloudflare Pages: `200`
- URL cuối sau chuyển hướng: `https://hiennhi89.pages.dev/boitoan/community?deploy=39c169ab8e88669b50a7354845af2cfaefc3c037`
- Trang Admin: `200`
- Community CSS: `200`
- Gate runtime JS: `200`
- Cloudflare Worker: `401 unauthorized` khi gọi API Reader không có phiên
- API thảo luận: `401 unauthorized` khi không có phiên
- Onboarding công khai: `400 invalid_account` với dữ liệu kiểm thử không hợp lệ
- Reader E2E production: `skipped`; register/login/me/cleanup `n/a/n/a/n/a/n/a`
- Account V3: plaintext public entry không cần DECRYPT_KEY; badge và bottom navigation Admin mở khu quản trị
- Thứ tự triển khai: Pages trước, Worker sau
