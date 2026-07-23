# Bàn giao hệ thống bốn webapp

> **Mọi agent phải đọc `AGENTS.md` trước file này.** Sau đó đọc `docs/handover/ACTIVE_TASKS.json` và `docs/handover/NHAT-KY-PHOI-HOP.md` trước khi sửa.

**Cập nhật:** 23/07/2026 18:58 (GMT+7)  
**Repository chuẩn:** `baominhle77-glitch/baominhle77-glitch.github.io`  
**Source Vietnam Travel:** `b3a29cbd5416424a6df16bb4a7bd392a75287f5c`  
**Validation Travel:** run `30004367095`  
**Deploy + production smoke Travel:** run `30004367100`, job `89196797196`  
**Task đang hoạt động:** không có  
**Production:** `SUCCESS`

## Nguyên tắc độ tin cậy bắt buộc

- Không tuyên bố source hoặc production hoàn tất nếu chưa có log/test/nghiệm thu tương ứng.
- Khi chưa đủ dữ liệu, ghi rõ **chưa xác lập/chưa đủ chứng cứ**.
- Không đưa mật khẩu, token, Telegram Chat ID, IP đầy đủ, mã thiết bị cá nhân, QR, chat hoặc secret vào repository.
- Không sửa trực tiếp `main`; dùng Task-ID, branch, PR, CI và file bàn giao.

---

## 1. Webapp và production

| App | Source | Production |
|---|---|---|
| SPARE | root | `https://hiennhi89.pages.dev/` |
| Bói toán / Spirituality Market | `boitoan/`, `assets/`, `backend/` | `https://hiennhi89.pages.dev/boitoan/` |
| MEDORA | `medora/` | `https://hiennhi89.pages.dev/medora/` |
| Việt Nam Đi Đâu? | `vietnam-travel/`, `backend/travel.js` | `https://hiennhi89.pages.dev/vietnam-travel/` |

Backend dùng chung: `https://hiennhi89-gate.hiennhi89.workers.dev`.

---

## 2. Vietnam Travel — `TRAVEL-20260723-01`

### Chức năng đã triển khai

- PWA công khai, responsive, tối ưu điện thoại/iPhone và có offline shell.
- Tìm kiếm không dấu, lọc theo vùng/loại hình, sắp xếp.
- Lưu yêu thích bằng `localStorage`.
- Chi tiết địa điểm, bản đồ, nguồn tham khảo và chia sẻ.
- Seed 20 địa điểm nổi tiếng/đặc thù của Việt Nam.
- API công khai chỉ đọc tại `/api/travel/*`.
- Dữ liệu lưu trong Cloudflare Workers KV, khóa `travel:places:v1`.

### Điều khiển bằng Telegram Bot hiện có

- `/travel`, `/dulich`, `/diadiem`: hướng dẫn.
- `/ds [từ khóa]`: danh sách.
- `/xem <id>`: xem chi tiết.
- `/them`: thêm địa điểm bằng các dòng trường.
- `/sua <id>`: sửa.
- `/an <id>`, `/hien <id>`: ẩn/hiện trên web.
- `/xoa <id>`: xóa sau nút xác nhận.
- `/thongke`: thống kê.

Bot chỉ xử lý mutation khi cả `chat.id` và `from.id` khớp `TELEGRAM_CHAT_ID`. Webhook chung vẫn xác thực `X-Telegram-Bot-Api-Secret-Token`.

### Bảo mật và dữ liệu

- Không lưu bot token, webhook secret hoặc Telegram ID dạng giá trị trong source.
- URL nhập qua bot chỉ nhận `https://` và không nhận credential trong URL.
- API chỉ trả bản ghi `published=true`.
- Dữ liệu hỏng được sao lưu tạm 7 ngày dưới khóa `travel:places:v1:corrupt:*`, sau đó khôi phục seed.
- Giới hạn phiên bản KV hiện tại: 1.000 địa điểm.

### Bằng chứng source và test

- Source thật trên `main`: `b3a29cbd5416424a6df16bb4a7bd392a75287f5c`.
- SHA-256 archive: `1511d9f80024a4a495e955e88680b4400a3d20973afd530edcb509457dbcad30` — đạt.
- Log: `docs/handover/MATERIALIZE_TRAVEL_DIAGNOSTIC.log`.
- Unit test: `5/5` đạt.
- Validation workflow run `30004367095`: `success`.
- Đã test parser tiếng Việt, seed/public filter, quyền chủ bot, thêm/sửa/ẩn/hiện/xóa, lọc vùng/danh mục và tích hợp idempotent vào Worker.

### Bằng chứng Cloudflare production

Production deploy + smoke workflow run `30004367100`, job `89196797196`: `SUCCESS`.

Các bước đều đạt:

1. Kiểm tra Cloudflare deploy token và Worker secrets, gồm Telegram.
2. Tích hợp Travel vào Worker và chạy test source/Worker.
3. Build SPARE + Bói toán + MEDORA + Vietnam Travel.
4. Deploy Cloudflare Pages.
5. Deploy Cloudflare Worker.
6. Hậu kiểm production.

Smoke test đạt:

- Vietnam Travel `200`, đúng tiêu đề `Việt Nam Đi Đâu?`.
- `/api/travel/health` `200`, service `vietnam-travel`.
- `/api/travel/places` `200`, có seed `vinh-ha-long`.
- SPARE `200`.
- Bói toán `200`, đúng marker `Spirituality Market`.
- MEDORA `200`.

### Nghiệm thu Telegram còn lại

Chủ bot gửi `/travel` trong Telegram và kiểm bot trả hướng dẫn. Đây là thao tác hội thoại thực tế không tự động gửi thay người dùng trong CI.

Tài liệu chi tiết: `docs/handover/VIETNAM_TRAVEL.md`.

---

## 3. Bói toán / Spirituality Market — trạng thái chính

### WebKit/iPhone crash loop

- Lỗi gốc: `MutationObserver` gọi `injectCommunity()`; bản cũ gán `textContent` vô điều kiện, tự tạo mutation mới và lặp vô hạn.
- Runtime hiện idempotent; marker production `Account V3 iOS mutation guard`.
- Source checker: `bc8016a23c342ff93416003293148c06263242f8`.
- Production deploy `29996510949`: success.
- WebKit production E2E `29996558091`: success; register/login/me/WebKit/delete/token revoked/relogin = `201/200/200/200/200/401/401`.

### Admin và Reader

- Badge Admin/Admin tổng mở trực tiếp trang quản trị.
- Bottom navigation đổi `Cộng đồng` thành `Quản trị` khi có quyền.
- Admin tổng xem hồ sơ member ở chế độ chỉ đọc.
- Public entry không phụ thuộc khóa giải mã khi trang plaintext.
- Account mới dùng HMAC-SHA256 với salt riêng và pepper phía server.
- Reader có thể tự xóa tài khoản; token cũ bị thu hồi.

---

## 4. Runtime và build

### Travel

- `vietnam-travel/index.html`
- `vietnam-travel/app.css`
- `vietnam-travel/app.js`
- `vietnam-travel/data/seed-places.js`
- `vietnam-travel/manifest.webmanifest`
- `vietnam-travel/sw.js`
- `backend/travel.js`
- `backend/travel.test.mjs`
- `tools/apply-travel-system.mjs`
- `.github/workflows/validate-vietnam-travel.yml`
- `.github/workflows/deploy-pages.yml`

### Account/Bói toán

- `tools/apply-role-system.mjs`
- `tools/apply-account-v2-runner.mjs`
- `tools/apply-account-v3-hotfix.mjs`
- `tools/apply-account-v4-edge-auth.mjs`
- `tools/webkit-production-check.mjs`
- `assets/gate.js`, `assets/gate.css`
- `assets/community.js`, `assets/community-admin.js`, `assets/community.css`
- `backend/community.js`

Các lớp tích hợp phải idempotent; CI phải bắt lỗi nhân đôi mã.

---

## 5. Trạng thái cuối

- Vietnam Travel source: **đã có trên `main`**.
- Vietnam Travel Cloudflare Pages + Worker: **đã deploy và smoke test thành công**.
- Điều khiển Travel qua Telegram: **đã tích hợp và test quyền/lệnh; chờ chủ bot gửi `/travel` để nghiệm thu hội thoại trực tiếp**.
- Bói toán WebKit/iPhone crash loop: **đã sửa và nghiệm thu**.
- Reader/Admin đa nền tảng: **đã nghiệm thu production**.
- SPARE, Bói toán, MEDORA: **không bị regression trong smoke Travel**.
- Active task: **không có**.
- Khóa file: **đã giải phóng**.
- Đóng gói App Store/Google Play: chưa hoàn tất.
