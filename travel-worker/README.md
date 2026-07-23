# Cloudflare Worker + D1 + Telegram Bot

Backend độc lập cho app `dulich-viet-nam/`. Không dùng chung database hoặc secret với các app hiện hữu trong repo.

## Chức năng

- API đọc công khai: danh sách, tìm kiếm, lọc và chi tiết địa điểm.
- API ghi có Bearer token quản trị.
- Telegram webhook chỉ nhận lệnh từ `TELEGRAM_ADMIN_CHAT_ID`.
- Cloudflare D1 lưu địa điểm; `audit_log` ghi lại thao tác xóa.
- Secret không nằm trong GitHub.

## 1. Tạo D1

```bash
cd travel-worker
npm install
npx wrangler login
npx wrangler d1 create vietnam-travel-db
```

Cloudflare trả về `database_id`. Thay đúng giá trị đó trong `wrangler.toml`.

## 2. Tạo bảng và nạp dữ liệu ban đầu

```bash
npm run db:migrate:remote
npm run db:seed:remote
```

## 3. Đặt secret

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_WEBHOOK_SECRET
npx wrangler secret put TELEGRAM_ADMIN_CHAT_ID
npx wrangler secret put ADMIN_API_TOKEN
```

- `TELEGRAM_BOT_TOKEN`: token lấy từ BotFather.
- `TELEGRAM_WEBHOOK_SECRET`: chuỗi ngẫu nhiên riêng, dùng để Telegram ký request webhook.
- `TELEGRAM_ADMIN_CHAT_ID`: Chat ID Telegram duy nhất được phép điều khiển bot.
- `ADMIN_API_TOKEN`: token dùng cho POST/PUT/DELETE API ngoài Telegram.

## 4. Deploy Worker

```bash
npm run check
npm run deploy
```

Sau deploy, Cloudflare trả URL dạng:

```text
https://vietnam-travel-api.<subdomain>.workers.dev
```

Đặt URL này vào `dulich-viet-nam/config.js`:

```js
apiBase: "https://vietnam-travel-api.<subdomain>.workers.dev/api"
```

## 5. Đăng ký Telegram webhook

Không ghi token hoặc secret vào repo. Chạy lệnh dưới đây trên máy cá nhân, thay các biến trước khi gửi:

```bash
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"https://vietnam-travel-api.<subdomain>.workers.dev/telegram/webhook\",\"secret_token\":\"${TELEGRAM_WEBHOOK_SECRET}\",\"allowed_updates\":[\"message\",\"edited_message\"]}"
```

## Lệnh Telegram

```text
/start
/help
/stats
/list [tỉnh]
/search từ khóa
/show ID-hoặc-slug
/add Tên | Tỉnh | Loại | Mô tả | Quận/huyện | Vùng | tag1,tag2
/feature ID
/unfeature ID
/delete ID
/webapp
```

## API

```text
GET    /health
GET    /api/places?q=&province=&region=&category=&featured=1&limit=100&offset=0
GET    /api/places/:id-or-slug
POST   /api/places
PUT    /api/places/:id-or-slug
DELETE /api/places/:id-or-slug
POST   /telegram/webhook
```

API ghi cần header:

```text
Authorization: Bearer <ADMIN_API_TOKEN>
Content-Type: application/json
```

## Bảo mật

- Không dùng token BotFather làm secret webhook.
- Chỉ đặt secret bằng Wrangler/Cloudflare Secrets.
- Giới hạn `ALLOWED_ORIGINS` đúng domain frontend trước production.
- Telegram Bot chỉ là giao diện quản trị; toàn bộ kiểm tra quyền vẫn được thực hiện ở Worker.
