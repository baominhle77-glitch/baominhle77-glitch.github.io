# 🟢 HƯỚNG DẪN BẤM-TỪNG-BƯỚC (cho người không rành kỹ thuật)

Mục tiêu: bật **Lớp C** — ai mở web phải xin phép, bạn duyệt bằng **Telegram**, thấy **IP/thiết bị** của họ.
Bạn KHÔNG cần gõ lệnh. Khoảng 5 phút.

> Claude không vào được tài khoản Cloudflare của bạn, nên có 1 việc **bắt buộc bạn bấm**:
> tạo 1 "chìa khóa" (API token) bằng **mẫu có sẵn** (chỉ vài cú bấm). Phần còn lại máy tự chạy.

---

## BƯỚC 1 — Nhắn cho bot Telegram ✅ (bạn đã làm xong)
Claude đã lấy được `chat_id = 8877812376`.

## BƯỚC 2 — Đăng ký Cloudflare miễn phí ✅ (bạn đã đăng nhập)
Nếu chưa: https://dash.cloudflare.com/sign-up (email + mật khẩu + xác minh email).

## BƯỚC 3 — Tạo "chìa khóa" API token (chỉ 4 cú bấm)
1. Bấm thẳng vào link này (đang đăng nhập sẵn): **https://dash.cloudflare.com/profile/api-tokens**
2. Bấm nút **Create Token** (góc phải).
3. Tìm dòng đầu tiên **"Edit Cloudflare Workers"** → bấm **Use template** bên phải dòng đó.
   *(Mẫu này đã có sẵn đủ quyền — bạn KHÔNG cần chọn gì thêm.)*
4. Kéo xuống cuối → **Continue to summary** → **Create Token**.
5. **Copy chuỗi token** hiện ra (chỉ hiện 1 lần). Giữ tạm trong ghi chú/Zalo của bạn.

> Nếu màn hình khác hình dung — **chụp màn hình gửi Claude**, Claude chỉ đúng chỗ bấm.

## BƯỚC 4 — Dán 4 "bí mật" vào GitHub
1. Mở: **https://github.com/baominhle77-glitch/baominhle77-glitch.github.io/settings/secrets/actions**
2. Bấm **New repository secret**, thêm **lần lượt 4 cái** (Name gõ y hệt, Value dán vào):

   | Name | Value |
   |------|-------|
   | `CLOUDFLARE_API_TOKEN` | chuỗi token ở Bước 3 |
   | `TELEGRAM_BOT_TOKEN` | token bot của bạn (chuỗi `8938415735:...`) |
   | `TELEGRAM_CHAT_ID` | `8877812376` |
   | `DECRYPT_KEY` | `minh-bao-2929-khoa` |

   Mỗi cái: gõ Name → dán Value → **Add secret**.

## BƯỚC 5 — Bấm nút chạy
1. Mở: **https://github.com/baominhle77-glitch/baominhle77-glitch.github.io/actions/workflows/setup-backend.yml**
2. Bên phải bấm **Run workflow** → **Run workflow** (nút xanh).
3. Chờ ~1 phút → bấm vào lần chạy → phần **Summary** hiện:
   - **URL Worker** (dạng `https://hiennhi89-gate....workers.dev`)
   - **Mật khẩu trang /admin**
4. **Copy URL Worker gửi cho Claude** → Claude lật công tắc để 3 web bắt đầu "xin phép".

---

## Xong thì thế nào?
- Ai mở web → thấy ô "xin truy cập" → bạn nhận **tin nhắn Telegram** kèm **IP, thiết bị, tên** → bấm ✅/❌.
- Hoặc duyệt tại **`<URL>/admin`** (nhập mật khẩu admin ở Bước 5).

## ⚠️ Bảo mật
Token bot đã lộ trong chat. Sau khi mọi thứ chạy ổn: @BotFather → `/revoke` → lấy token mới →
sửa lại secret `TELEGRAM_BOT_TOKEN` → chạy lại Bước 5.
