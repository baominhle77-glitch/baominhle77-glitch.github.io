# 🔄 Đổi username → `hiennhi89` và cách tiếp tục công việc

## A. Các bước đổi tên (bạn tự làm — GitHub không cho API)
1. **Đổi username:** https://github.com/settings/account → mục **Change username** → nhập `hiennhi89` → xác nhận.
2. **Đổi tên repo trang chính (BẮT BUỘC):** vào repo `baominhle77-glitch.github.io` →
   **Settings → General → Rename** → đổi thành **`hiennhi89.github.io`**.
   *(Repo trang cá nhân phải trùng tên username, nếu không trang gốc sẽ hỏng.)*
3. **(Tùy chọn) đổi tên repo MEDORA** `baominhle77-glitch.github.io-` cho gọn (vd `medora`).
4. Kiểm tra: **Settings → Pages** của mỗi repo vẫn để Source = `main` / root.

Sau đó link mới:
- SPARE → `https://hiennhi89.github.io/`
- Bói toán → `https://hiennhi89.github.io/boitoan/`

## B. Đã chuẩn bị sẵn (không hỏng khi đổi)
- Worker `ALLOWED_ORIGINS` đã gồm **cả** `baominhle77-glitch.github.io` **và** `hiennhi89.github.io`
  → phần "xin quyền" (CORS) chạy ngay trên tên miền mới.
- URL backend trong 3 app là `hiennhi89-gate.hiennhi89.workers.dev` — **không đổi** theo username.

## C. Sau khi đổi xong — để Claude tiếp tục làm
Session Claude cũ gắn với tên repo cũ, nên:
1. **Mở một session Claude mới** (Claude Code trên web/app).
2. Nói: *"Tiếp tục dự án 3 webapp, repo giờ là `hiennhi89/hiennhi89.github.io`"* + dán link này.
   GitHub tự chuyển quyền truy cập sang tên mới, Claude đọc/ghi/push tiếp bình thường.
3. **Cloudflare (để Claude tự deploy mà không cần đưa token mỗi lần):**
   - Tạo API token mới (mẫu "Edit Cloudflare Workers") → thêm vào
     **Settings → Secrets and variables → Actions** của repo, tên `CLOUDFLARE_API_TOKEN`.
   - Từ đó, mỗi lần sửa `backend/**` và push, workflow `deploy-worker.yml` **tự deploy** —
     Claude không cần cầm token. (Hoặc đưa token 1 lần trong session để Claude deploy tay.)
4. **Telegram:** token bot đã nằm trong Worker (secret) rồi, thường KHÔNG cần đưa lại.
   Chỉ khi bạn `/revoke` đổi token mới thì đưa token mới để cập nhật Worker.

## D. Thông tin cố định (bàn giao)
- **Worker:** `https://hiennhi89-gate.hiennhi89.workers.dev` · admin: `.../admin`
- **Mật khẩu mở khóa (chủ):** giao riêng trong hội thoại, KHÔNG lưu repo.
- **Bí mật** (bot token, ADMIN_TOKEN, SESSION_SECRET, DECRYPT_KEY): nằm trong **Cloudflare Worker secrets**,
  không nằm trong repo. Xem `backend/HUONG-DAN.md` để tạo lại nếu cần.
- Subdomain workers.dev đã đăng ký: **`hiennhi89`**.
