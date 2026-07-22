# Hướng dẫn cài backend từng bước

Mục tiêu: bật luồng xin phép qua Telegram, telemetry truy cập best-effort, trang quản trị và nền tảng chat.

## 1. Chuẩn bị Telegram

1. Tạo bot bằng BotFather hoặc dùng bot hiện có.
2. Nhắn một tin cho bot.
3. Lấy chat ID từ Telegram API hoặc công cụ tin cậy.
4. Không chép bot token hoặc chat ID vào repo, ảnh chụp hay hội thoại hỗ trợ.

Bot token đã từng lộ phải được thu hồi bằng BotFather `/revoke` trước khi dùng production.

## 2. Tạo Cloudflare API token

1. Mở `https://dash.cloudflare.com/profile/api-tokens`.
2. Tạo token có đúng quyền cần cho Workers Scripts, Workers KV và Pages của tài khoản này.
3. Giới hạn token vào tài khoản/tài nguyên cần dùng nếu giao diện cho phép.
4. Copy token vào GitHub secret; không lưu trong file hoặc ứng dụng nhắn tin.

## 3. Thêm sáu GitHub Actions secret

Mở `https://github.com/baominhle77-glitch/baominhle77-glitch.github.io/settings/secrets/actions`, chọn **New repository secret**, rồi thêm:

| Name | Value |
|------|-------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token |
| `TELEGRAM_BOT_TOKEN` | bot token mới, chưa lộ |
| `TELEGRAM_CHAT_ID` | chat ID của chủ app |
| `DECRYPT_KEY` | khóa khớp payload Bói toán và MEDORA |
| `DECRYPT_KEY_SPARE` | khóa riêng khớp payload SPARE |
| `ADMIN_TOKEN` | mật khẩu quản trị dài, ngẫu nhiên và riêng biệt |

Không dùng lại ví dụ hoặc giá trị từng xuất hiện trong Git history. Hai khóa giải mã phải khớp payload và cấu hình PBKDF2 frontend tương ứng; nếu chưa xoay đồng bộ, dừng trước deploy.

## 4. Kiểm tra trước khi chạy

1. Xác nhận `ALLOWED_ORIGINS` trong `backend/wrangler.toml` chỉ có domain frontend thật.
2. Xác nhận `namespace_id` `89001` và `89002` không trùng rate-limit binding khác trong tài khoản Cloudflare.
3. Giữ `CHAT_ENABLED="false"` cho tới khi chấp nhận Telegram giữ bản sao chat 30 ngày.
4. Dùng workflow phối hợp: deploy Pages hoàn tất trước rồi mới deploy Worker.

## 5. Chạy setup

1. Mở `https://github.com/baominhle77-glitch/baominhle77-glitch.github.io/actions/workflows/setup-backend.yml`.
2. Chọn **Run workflow**.
3. Mở job summary sau khi workflow xanh.
4. Ghi lại URL Worker. Mật khẩu `/admin` chính là giá trị `ADMIN_TOKEN` đã tự tạo và lưu riêng; workflow không hiển thị nó.
5. Mở URL Worker, xác nhận phản hồi `gate backend OK`.
6. Kiểm thử trọn luồng trên môi trường phối hợp: gửi yêu cầu, duyệt, nhận phiên, giải mã, ghi telemetry, thu hồi phiên.

Chạy lại setup sẽ xoay secret ký phiên và webhook, làm mọi phiên đang hoạt động hết hiệu lực. Cập nhật thường ngày dùng workflow deploy Worker, không dùng setup.

## 6. Sau deploy

- `/admin` hiển thị browser-profile ID, trình duyệt, thông tin màn hình/ngôn ngữ và IP đã rút gọn; không phải danh sách thiết bị vật lý tuyệt đối.
- Người mở bằng mật khẩu cục bộ có thể tạo telemetry nếu online nhưng không có quyền chat.
- Người được approval nhận phiên 12 giờ và có quyền chat khi `CHAT_ENABLED=true`.
- Xác nhận bot webhook không có lỗi và không còn update chờ.
- Thu hồi ngay mọi bot token, Cloudflare token, admin token hoặc khóa giải mã từng lộ.
