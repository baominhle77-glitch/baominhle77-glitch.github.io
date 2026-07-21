# 🏗️ Thiết kế hệ thống kiểm soát truy cập

Tài liệu này giải thích **thiết kế, lý do kỹ thuật, và cách bật/tắt từng lớp**.

## Sự thật nền tảng (đọc kỹ)
GitHub Pages là **hosting tĩnh, công khai**. Tự thân nó **không thể**:
- bắt đăng nhập ở tầng máy chủ,
- giấu file dữ liệu khỏi người tải mã nguồn,
- biết IP/thiết bị của khách,
- chặn ai đó lưu lại trang.

Vì vậy các yêu cầu "duyệt từng người", "thấy IP/dữ liệu khách nhập" **bắt buộc có backend**.
Ta giải quyết bằng mô hình **3 lớp**, bật dần theo nhu cầu và công sức bỏ ra.

---

## Lớp A — Chống dò tìm + Khóa mật khẩu (ngăn chặn)
**Mục tiêu:** không lên Google; người có link thấy màn khóa thay vì nội dung.

- `robots.txt`: `Disallow: /` cho mọi bot + chặn riêng bot AI.
- Meta `noindex,nofollow,noarchive,nosnippet` + `referrer:no-referrer` trên mọi trang.
- `assets/gate.js`:
  - Đặt class `gate-locked` lên `<html>` ngay từ `<head>` → CSS che nội dung.
  - Hiện form mật khẩu. Kiểm tra bằng **PBKDF2-SHA256** (200k vòng) ngay trong trình duyệt,
    so khớp với hash lưu sẵn trong `window.GATE.pbkdf2`. **Không gửi mật khẩu đi đâu.**
  - Đúng → lưu cờ mở khóa trong `sessionStorage` (tùy chọn "ghi nhớ máy" → `localStorage`) → hiện nội dung.
- **Giới hạn trung thực:** nội dung vẫn nằm trong DOM/mã nguồn, chỉ bị che. Người rành kỹ thuật
  vẫn xem được qua "View source". Đây là **lớp ngăn chặn**, không phải bảo mật tuyệt đối.

### Đổi mật khẩu
```bash
node tools/set-password.mjs "mat-khau-moi"
# Dán khối pbkdf2 in ra vào window.GATE của TỪNG app cần đổi.
```

---

## Lớp B — Mã hóa nội dung AES (bảo vệ thật, offline)
**Mục tiêu:** tải mã nguồn về cũng chỉ thấy chuỗi mã hóa; không mật khẩu = không đọc được.

- `tools/encrypt.mjs` mã hóa vùng nội dung bằng **AES-256-GCM**, khóa dẫn xuất PBKDF2 từ mật khẩu.
- Trang sau mã hóa chỉ còn: khung + `<div id="gate-content"></div>` + `<script type="application/gate-payload">…</script>`.
- `gate.js` với `mode:'encrypted'` giải mã payload trong trình duyệt rồi chèn nội dung (chạy lại `<script>`).
- Dùng chung **một mật khẩu** cho những người được phép. Không có backend, vẫn offline.

### Bật Lớp B cho một app
```bash
# 1) Giữ bản gốc để còn chỉnh sau:
mv index.html index.src.html
# 2) (Tùy chọn) đánh dấu vùng cần mã hóa bằng <!-- gate:begin --> ... <!-- gate:end -->
# 3) Mã hóa:
node tools/encrypt.mjs index.src.html index.html "mat-khau-cua-ban"
# 4) Trong <head> của index.html, đặt window.GATE.mode = 'encrypted'
# 5) Chỉ commit index.html (đã mã hóa). Giữ index.src.html ở nhánh/máy riêng.
```
> Lưu ý: app Bói toán tải nhiều `data*.js` + có service worker; mã hóa cần cẩn thận từng phần.
> Nên nhờ trợ lý làm & test bằng trình duyệt trước khi merge.

---

## Lớp C — Backend duyệt + Telegram (kiểm soát đầy đủ)
**Mục tiêu:** chỉ chủ phê duyệt từng người; thấy IP/thiết bị; ghi dữ liệu khách nhập.

Kiến trúc:
```
Khách mở web ──▶ gate.js (mode:'approval') ──POST /api/request──▶ Cloudflare Worker
                                                                     │ ghi D1 (IP, UA, thiết bị)
                                                                     ▼
                                                        Telegram cho CHỦ  [✅ Duyệt] [❌ Từ chối]
                                                                     │
   gate.js poll /api/status ◀── cấp JWT khi duyệt ◀──────────────────┘
   (được duyệt → hiện nội dung / nhận khóa giải mã)
Chủ cũng có thể duyệt tại trang /admin (ADMIN_TOKEN, chỉ máy chủ biết).
```

- Endpoint: `/api/request`, `/api/status`, `/api/log` (ghi dữ liệu khách nhập), `/telegram/webhook`,
  `/admin` + `/api/admin/*`.
- Phiên: JWT ký HMAC-SHA256 bằng `SESSION_SECRET`, hết hạn 12 giờ.
- Bảo mật webhook: header `X-Telegram-Bot-Api-Secret-Token`. Bảo mật admin: `ADMIN_TOKEN`.
- Lưu trữ: Cloudflare D1 (`backend/schema.sql`).
- Cài đặt: **`backend/README.md`** (một lần ~5 phút).

### Bật Lớp C trên web
Trong `window.GATE` của mỗi app:
```js
mode: 'approval',
backend: 'https://baominh-gate.<ban>.workers.dev'
```

### Kết hợp B + C (mạnh nhất)
Mã hóa nội dung (B) + backend chỉ trả **khóa giải mã** cho phiên được duyệt (C).
Khi đó: người lạ không đọc được mã nguồn (B) **và** phải được bạn duyệt mới có khóa (C).
`gate.js` đã hỗ trợ: nếu `/api/status` trả `key` và trang có payload mã hóa, nó tự giải mã.
(Để dùng, cần lưu mật khẩu giải mã ở phía Worker và trả về khi duyệt — mở rộng nhỏ trong `decide()`.)

---

## Tự động hóa & bàn giao
- `.github/workflows/deploy-worker.yml`: push đổi `backend/**` → tự deploy Worker (cần secret `CLOUDFLARE_API_TOKEN`).
- `.github/workflows/handover.yml`: mỗi push → cập nhật `docs/handover/STATUS.md` (git tự commit).
- GitHub Pages: merge vào `main` → tự xuất bản. Đảm bảo Settings → Pages → Source = `main` / root.

## Sơ đồ tệp
```
├─ index.html                (SPARE, gate wired)
├─ robots.txt
├─ assets/gate.js, gate.css
├─ boitoan/                  (Bói toán PWA, gate + sw cache v6)
├─ backend/                  (Lớp C: worker.js, wrangler.toml, schema.sql, README.md)
├─ tools/                    (encrypt.mjs, set-password.mjs)
├─ .github/workflows/        (deploy-worker.yml, handover.yml)
├─ docs/ARCHITECTURE.md      (file này)
├─ docs/handover/            (STATUS.md tự sinh, CHANGELOG.md)
└─ HANDOVER.md               (đọc trước tiên)
```
