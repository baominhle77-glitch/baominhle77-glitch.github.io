# Đổi username và tiếp tục công việc

> Tài liệu lịch sử. Production hiện dùng Cloudflare Pages `hiennhi89.pages.dev`; đổi GitHub username/repo không phải bước bắt buộc cho deployment hiện tại.

## A. Các bước đổi tên (bạn tự làm — GitHub không cho API)
1. **Đổi username:** https://github.com/settings/account → mục **Change username** → nhập `hiennhi89` → xác nhận.
2. **Đổi tên repo trang chính (BẮT BUỘC):** vào repo `baominhle77-glitch.github.io` →
   **Settings → General → Rename** → đổi thành **`hiennhi89.github.io`**.
   *(Repo trang cá nhân phải trùng tên username, nếu không trang gốc sẽ hỏng.)*
3. **(Tùy chọn) đổi tên repo MEDORA** `baominhle77-glitch.github.io-` cho gọn (vd `medora`).
4. Kiểm tra GitHub redirect và Actions secrets sau đổi tên. Không đổi nguồn deploy Cloudflare Pages nếu không có kế hoạch riêng.

Sau đó link mới:
- SPARE → `https://hiennhi89.github.io/`
- Bói toán → `https://hiennhi89.github.io/boitoan/`

## B. Đã chuẩn bị sẵn (không hỏng khi đổi)
- Worker `ALLOWED_ORIGINS` đã gồm **cả** `baominhle77-glitch.github.io` **và** `hiennhi89.github.io`
  → phần "xin quyền" (CORS) chạy ngay trên tên miền mới.
- URL backend trong 3 app là `hiennhi89-gate.hiennhi89.workers.dev` — **không đổi** theo username.

## C. Sau khi đổi xong
1. Mở workspace từ repo mới và đọc `HANDOVER.md`.
2. Xác nhận remote, GitHub Actions và Cloudflare Pages vẫn trỏ đúng repo trước khi thay đổi.
3. **Cloudflare (để Claude tự deploy mà không cần đưa token mỗi lần):**
   - Tạo API token mới (mẫu "Edit Cloudflare Workers") → thêm vào
     **Settings → Secrets and variables → Actions** của repo, tên `CLOUDFLARE_API_TOKEN`.
   - Từ đó, mỗi lần sửa `backend/**` và push, workflow `deploy-worker.yml` **tự deploy** —
   Công cụ hỗ trợ không cần nhận token trực tiếp.
4. **Telegram:** token bot đã nằm trong Worker (secret) rồi, thường KHÔNG cần đưa lại.
   Chỉ khi bạn `/revoke` đổi token mới thì đưa token mới để cập nhật Worker.

## D. Thông tin cố định (bàn giao)
- **Worker:** `https://hiennhi89-gate.hiennhi89.workers.dev` · admin: `.../admin`
- **Mật khẩu mở khóa (chủ):** giao riêng trong hội thoại, KHÔNG lưu repo.
- **Bí mật** (bot token, chat ID, ADMIN_TOKEN, SESSION_SECRET, DECRYPT_KEY): nằm trong **Cloudflare Worker secrets**,
  không nằm trong repo. Xem `backend/HUONG-DAN.md` để tạo lại nếu cần.
- Subdomain workers.dev đã đăng ký: **`hiennhi89`**.
