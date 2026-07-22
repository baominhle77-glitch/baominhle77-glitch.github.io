# Backend cổng truy cập

Cloudflare Worker xử lý duyệt người dùng, telemetry truy cập best-effort, trang quản trị và chat qua Telegram cho ba app.

## Giới hạn dữ liệu

- `device_id` nhận diện một hồ sơ trình duyệt, không phải thiết bị vật lý. Xóa storage, đổi trình duyệt hoặc chặn JavaScript tạo ID mới.
- Telemetry chỉ gửi khi trình duyệt online và request tới Worker thành công. Không thể thống kê tuyệt đối mọi lượt truy cập.
- Worker không nhận mật khẩu cổng. IP được rút gọn thành IPv4 `/24` hoặc IPv6 `/64` trước khi lưu và hiển thị.
- Yêu cầu và log giữ 7 ngày; phiên duyệt 12 giờ; sự kiện truy cập 90 ngày; tin nhắn chat 30 ngày.
- Workers KV và rate limit native đều best-effort; không dùng chúng làm ranh giới bảo mật duy nhất.

## Tính năng

- Duyệt hoặc từ chối qua Telegram và `/admin`.
- JWT HS256 v2 có audience, scope và session KV có thể thu hồi.
- Chat chỉ nhận JWT từ luồng approval. Mở bằng mật khẩu cục bộ không cấp quyền chat.
- Tin nhắn chat được lưu trong KV và gửi bản sao tới Telegram. `CHAT_ENABLED=false` mặc định.
- Reader quảng bá do frontend cấu hình; chỉ chấp nhận URL Facebook HTTPS chính xác.
- Duyệt và chat Telegram giả định `TELEGRAM_CHAT_ID` là cuộc trò chuyện riêng với chủ app; group chat không được hỗ trợ.

## Cấu hình

`wrangler.toml` chứa:

- `ALLOWED_ORIGINS`: origin frontend được phép gọi API.
- KV binding `KV`.
- `PUBLIC_RATE_LIMITER`: 10 request trong 60 giây theo route/IP, best-effort theo Cloudflare location.
- `CHAT_RATE_LIMITER`: mỗi luồng đọc và gửi có quota riêng 12 request trong 60 giây theo session, best-effort theo Cloudflare location.

Hai `namespace_id` rate limit phải là chuỗi số nguyên dương và không trùng binding khác trong cùng tài khoản Cloudflare. Kiểm tra trước deploy.

Worker cần sáu secret, không ghi giá trị vào repo:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `TELEGRAM_WEBHOOK_SECRET`
- `ADMIN_TOKEN`
- `SESSION_SECRET`
- `DECRYPT_KEY`

`SESSION_SECRET` phải dài ít nhất 32 ký tự; workflow setup sinh 32 byte ngẫu nhiên và mã hóa thành 64 ký tự hex.

## Cài tự động

Thêm năm GitHub Actions secret theo `HUONG-DAN.md`, rồi chạy `.github/workflows/setup-backend.yml` thủ công. Workflow:

1. Tạo hoặc tìm KV namespace.
2. Chạy `worker.test.mjs`.
3. Đặt Worker secrets; tự sinh `SESSION_SECRET` và `TELEGRAM_WEBHOOK_SECRET`.
4. Deploy Worker bằng Wrangler `4.112.0`.
5. Nối Telegram webhook.

Chạy lại workflow setup sẽ xoay `SESSION_SECRET` và `TELEGRAM_WEBHOOK_SECRET`, làm phiên hiện tại hết hiệu lực. Workflow không hiển thị `ADMIN_TOKEN`.

## Deploy thường xuyên

`.github/workflows/deploy-worker.yml` chạy test rồi deploy khi `backend/**` đổi. Workflow này chỉ cần GitHub secret `CLOUDFLARE_API_TOKEN` và không xoay Worker secrets.

Không deploy Worker mới riêng lẻ khi frontend production còn dùng contract cũ. Rollout frontend và Worker phối hợp.

## Chat

Trước khi bật:

1. Xác nhận bot và webhook hoạt động.
2. Chấp nhận Telegram giữ bản sao nội dung chat.
3. Xác nhận chính sách giữ tin nhắn 30 ngày.
4. Đổi `CHAT_ENABLED` thành `"true"`, chạy test, rồi deploy phối hợp.

Chủ app trả lời khách bằng cách reply đúng tin nhắn bot trên Telegram.

## Xoay hoặc thu hồi bí mật

- Bot token từng lộ: dùng BotFather `/revoke`, cập nhật GitHub/Worker secret rồi nối lại webhook.
- `DECRYPT_KEY` từng lộ: giải mã nguồn cục bộ, mã hóa lại bằng khóa mới, cập nhật PBKDF2 frontend và Worker secret trong cùng rollout. Xóa khỏi file hiện tại không xóa Git history.
- Nghi lộ `ADMIN_TOKEN` hoặc `SESSION_SECRET`: thay ngay; đổi `SESSION_SECRET` thu hồi mọi phiên.
- Nghi lộ Cloudflare token: thu hồi tại Cloudflare, tạo token tối thiểu quyền và cập nhật GitHub secret.

Không gửi secret qua chat, ảnh chụp, tài liệu hoặc commit.
