# 🟢 HƯỚNG DẪN BẤM-TỪNG-BƯỚC (cho người không rành kỹ thuật)

Mục tiêu: bật **Lớp C** — ai mở web phải xin phép, bạn duyệt bằng **Telegram**, thấy **IP/thiết bị** của họ.
Bạn KHÔNG cần gõ lệnh. Chỉ đăng ký 1 tài khoản + copy/dán vài chỗ. Khoảng 5–7 phút.

> Có 2 việc **bắt buộc bạn tự làm** (vì gắn với tài khoản của bạn, không ai làm hộ được):
> đăng ký Cloudflare, và tạo 1 "chìa khóa" (API token). Phần còn lại máy tự chạy.

---

## BƯỚC 1 — Nhắn cho bot Telegram (10 giây)
Mở Telegram → tìm **@Appwebcuatoi_bot** → bấm **Start** hoặc nhắn "hi".
(Việc này để Claude lấy được "chat_id" của bạn.) Rồi báo Claude: "đã nhắn bot".

## BƯỚC 2 — Đăng ký Cloudflare miễn phí (2 phút)
1. Vào **https://dash.cloudflare.com/sign-up**
2. Nhập **email** + **mật khẩu** → bấm đăng ký (giống đăng ký web bình thường).
3. Mở email Cloudflare gửi → bấm link **xác minh**. Xong.

## BƯỚC 3 — Tạo "chìa khóa" API token (2 phút)
1. Vào **https://dash.cloudflare.com/profile/api-tokens**
2. Bấm **Create Token** → kéo xuống **Create Custom Token** → **Get started**.
3. Đặt tên bất kỳ (vd: `web-hiennhi89`). Ở phần **Permissions**, thêm 3 dòng:
   - `Account` · `Workers Scripts` · **Edit**
   - `Account` · `D1` · **Edit**
   - `Account` · `Workers KV Storage` · **Edit**  *(cho chắc)*
4. Bấm **Continue to summary** → **Create Token**.
5. **Copy chuỗi token** hiện ra (chỉ hiện 1 lần!). Giữ tạm trong ghi chú.

## BƯỚC 4 — Dán 4 "bí mật" vào GitHub (2 phút)
1. Vào repo: **https://github.com/baominhle77-glitch/baominhle77-glitch.github.io**
2. **Settings** (tab trên cùng) → cột trái **Secrets and variables** → **Actions**.
3. Bấm **New repository secret**, thêm **lần lượt 4 cái** (Name gõ chính xác):

   | Name (gõ y hệt) | Value (dán vào) |
   |-----------------|-----------------|
   | `CLOUDFLARE_API_TOKEN` | chuỗi token ở Bước 3 |
   | `TELEGRAM_BOT_TOKEN` | token bot của bạn |
   | `TELEGRAM_CHAT_ID` | *(Claude sẽ đưa số này cho bạn sau Bước 1)* |
   | `DECRYPT_KEY` | `minh-bao-2929-khoa` |

   Mỗi cái: gõ Name → dán Value → **Add secret**.

## BƯỚC 5 — Bấm nút chạy (30 giây)
1. Vào tab **Actions** của repo.
2. Cột trái chọn **"Cài đặt Backend Lớp C (bấm 1 lần)"**.
3. Bên phải bấm **Run workflow** → **Run workflow** (nút xanh).
4. Chờ ~1 phút. Khi xong, bấm vào lần chạy → phần **Summary** sẽ hiện:
   - **URL Worker** (dạng `https://hiennhi89-gate....workers.dev`)
   - **Mật khẩu trang /admin**
5. **Copy URL Worker đó gửi cho Claude.** Claude sẽ lật công tắc để 3 app bắt đầu "xin phép".

---

## Xong thì thế nào?
- Ai mở web → thấy ô "xin truy cập" → bạn nhận **tin nhắn Telegram** kèm **IP, thiết bị, tên** → bấm ✅/❌.
- Bạn cũng có thể duyệt tại trang **`<URL>/admin`** (nhập mật khẩu admin ở Bước 5).

## ⚠️ Bảo mật
Token bot bạn đã gửi trong chat nên bị lộ. Sau khi mọi thứ chạy ổn:
@BotFather → `/revoke` → lấy **token mới** → cập nhật lại secret `TELEGRAM_BOT_TOKEN` → chạy lại Bước 5.
