# Backend cổng duyệt truy cập — Cài đặt trong ~5 phút

Đây là **Lớp C**: chỉ mình bạn phê duyệt từng người vào web, thấy IP/thiết bị của họ,
và duyệt bằng **bot Telegram** hoặc **trang admin trên máy bạn**.

> Đây là bước một-lần duy nhất cần bạn tự làm, vì nó gắn với **tài khoản & bí mật của bạn**
> (không ai làm hộ được). Sau bước này, mọi thứ chạy tự động mãi.

## 0. Chuẩn bị
- Một tài khoản **Cloudflare** (miễn phí): https://dash.cloudflare.com/sign-up
- App **Telegram** trên điện thoại.
- Máy có **Node.js** (để chạy `npx wrangler`).

## 1. Tạo bot Telegram
1. Mở Telegram, nhắn cho **@BotFather** → `/newbot` → đặt tên → nhận **TOKEN** (dạng `123456:ABC...`).
2. Nhắn 1 tin bất kỳ cho bot vừa tạo (để nó "thấy" bạn).
3. Lấy **CHAT_ID** của bạn: mở trình duyệt vào
   `https://api.telegram.org/bot<TOKEN>/getUpdates` → tìm `"chat":{"id":<SỐ>}`. Số đó là CHAT_ID.

## 2. Đăng nhập & tạo cơ sở dữ liệu
```bash
cd backend
npx wrangler login
npx wrangler d1 create baominh-gate         # copy database_id trả về -> dán vào wrangler.toml
npx wrangler d1 execute baominh-gate --remote --file=schema.sql
```
Sửa `wrangler.toml`: điền `TELEGRAM_CHAT_ID`, `database_id`, và `ALLOWED_ORIGINS` (đúng domain web của bạn).

## 3. Đặt các bí mật
```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN        # dán TOKEN từ BotFather
npx wrangler secret put TELEGRAM_WEBHOOK_SECRET   # tự gõ 1 chuỗi ngẫu nhiên dài
npx wrangler secret put ADMIN_TOKEN               # mật khẩu vào trang /admin của bạn
npx wrangler secret put SESSION_SECRET            # 1 chuỗi ngẫu nhiên dài (ký phiên)
```
Gợi ý tạo chuỗi ngẫu nhiên: `openssl rand -hex 32`

## 4. Deploy & nối Telegram webhook
```bash
npx wrangler deploy                                # -> in ra URL dạng https://baominh-gate.<bạn>.workers.dev
# Nối webhook (thay <TOKEN>, <URL>, <SECRET> cho khớp):
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=<URL>/telegram/webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>"
```

## 5. Bật Lớp C trên web
Trong `window.GATE` của mỗi app, đổi:
```js
mode: 'approval',
backend: 'https://baominh-gate.<bạn>.workers.dev',
```
Xong! Từ giờ ai mở web sẽ phải xin phép; bạn nhận Telegram, bấm ✅/❌ là xong.
Trang quản trị trên máy bạn: `https://baominh-gate.<bạn>.workers.dev/admin`

## Tự động deploy về sau
Đã có sẵn workflow `.github/workflows/deploy-worker.yml`: mỗi lần push thay đổi trong `backend/`
nó tự deploy lại, **miễn là** bạn đã thêm 1 secret repo tên `CLOUDFLARE_API_TOKEN`
(tạo tại Cloudflare → My Profile → API Tokens → template "Edit Cloudflare Workers").

## Ghi lại dữ liệu khách nhập (tùy chọn)
Trong app, sau khi có phiên, gọi:
```js
fetch(backend + '/api/log', {
  method:'POST',
  headers:{'content-type':'application/json','authorization':'Bearer '+localStorage.getItem('gate_token_<app>')},
  body: JSON.stringify({ app:'<app>', kind:'form', data:{ ...dữ liệu khách nhập } })
});
```
Xem lại tại `/admin` hoặc truy vấn D1.
