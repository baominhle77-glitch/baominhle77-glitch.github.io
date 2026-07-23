# Vietnam Travel — bàn giao kỹ thuật

**Task-ID:** `TRAVEL-20260723-01`  
**Trạng thái:** `COMPLETED`  
**Cập nhật:** `23/07/2026 18:54 GMT+7`  
**Source materialize:** `b3a29cbda57621e1c946fbdd128678bbf3949737`  
**Ứng dụng production:** `https://hiennhi89.pages.dev/vietnam-travel/`  
**Backend production:** `https://hiennhi89-gate.hiennhi89.workers.dev/api/travel/*`  
**Kho dữ liệu:** Cloudflare Workers KV, khóa `travel:places:v1`  
**Quản trị:** Telegram Bot hiện có; chỉ chấp nhận update khi cả `chat.id` và `from.id` khớp `TELEGRAM_CHAT_ID`.

## 1. Phạm vi bản đầu

- PWA công khai, tối ưu điện thoại và iPhone.
- Tìm kiếm không dấu; lọc theo vùng và loại hình; sắp xếp.
- Lưu yêu thích trên trình duyệt bằng `localStorage`.
- Chi tiết địa điểm, bản đồ, nguồn tham khảo và chia sẻ.
- Bộ dữ liệu khởi tạo gồm 20 địa điểm nổi tiếng/đặc thù của Việt Nam.
- API công khai chỉ đọc; mọi mutation chỉ đi qua Telegram webhook đã xác thực secret.
- Dữ liệu có thể mở rộng tối đa 1.000 địa điểm trong phiên bản KV hiện tại.

## 2. Lệnh Telegram

- `/travel`, `/dulich`, `/diadiem`: mở hướng dẫn.
- `/ds`: danh sách địa điểm.
- `/xem <id>`: xem chi tiết.
- `/them` rồi nhập các dòng `Tên:`, `Tỉnh:`, `Vùng:`, `Loại:`, `Mô tả:` và trường tùy chọn.
- `/sua <id>` rồi nhập trường cần đổi.
- `/an <id>` và `/hien <id>`: ẩn/hiện trên web.
- `/xoa <id>`: bot gửi nút xác nhận; chỉ xóa sau callback xác nhận.
- `/thongke`: thống kê nhanh.

Các trường hỗ trợ: Tên, Tỉnh/Thành phố, Vùng, Loại, Mô tả, Điểm nổi bật, Thời điểm đẹp, Thời lượng, Địa chỉ, Bản đồ, Ảnh, Nguồn, Mẹo, Nổi bật trang chủ, Công khai.

## 3. Bảo mật và dữ liệu

- Không có bot token, webhook secret hoặc Telegram ID dạng giá trị trong source.
- Worker tiếp tục xác thực header `X-Telegram-Bot-Api-Secret-Token` ở webhook chung.
- Module Travel kiểm tra chủ bot lần hai bằng `TELEGRAM_CHAT_ID` cho cả chat và người gửi.
- URL nhập qua bot chỉ nhận `https://`, không nhận credential trong URL.
- Dữ liệu hỏng được sao lưu tạm 7 ngày dưới khóa `travel:places:v1:corrupt:*`, sau đó seed được khôi phục.
- API công khai chỉ trả địa điểm có `published=true`.
- Cloudflare KV có tính nhất quán cuối cùng; cập nhật mới có thể cần tải lại sau một khoảng ngắn ở một số điểm mạng.

## 4. Build và deploy

- `tools/apply-travel-system.mjs` ghép Travel API và Telegram handler vào Worker hiện có theo cách idempotent.
- `.github/workflows/materialize-vietnam-travel-v2.yml` đã kiểm checksum archive, bung source trong staging và chạy test.
- `.github/workflows/deploy-vietnam-travel-pr.yml` kiểm secret, chạy test, build toàn bộ bốn app, deploy Cloudflare Pages trước rồi Worker, sau đó smoke test production.
- Workflow deploy kiểm soát dùng chung concurrency group `cloudflare-production` để tránh hai lần ghi production đồng thời.

## 5. File chính

- `vietnam-travel/index.html`
- `vietnam-travel/app.css`
- `vietnam-travel/app.js`
- `vietnam-travel/data/seed-places.js`
- `vietnam-travel/manifest.webmanifest`
- `vietnam-travel/sw.js`
- `backend/travel.js`
- `backend/travel.test.mjs`
- `tools/apply-travel-system.mjs`

## 6. Bằng chứng xác minh

### Materialize và test

- Archive SHA-256: `1511d9f80024a4a495e955e88680b4400a3d20973afd530edcb509457dbcad30` — đạt.
- Log: `docs/handover/MATERIALIZE_TRAVEL_DIAGNOSTIC.log`.
- Unit test Travel: `5/5` đạt.
- Các luồng đã test: slug/parser tiếng Việt; tự seed và chỉ trả bản ghi công khai; chặn Telegram không phải chủ bot; thêm/sửa/ẩn/hiện/xóa; lọc vùng và danh mục.
- Syntax check frontend, backend, service worker, seed và tool tích hợp: đạt.

### Cloudflare production

Workflow `Deploy Vietnam Travel qua PR kiểm soát`, run `30004472078`: `SUCCESS`.

Các bước cùng đạt:

1. Kiểm tra Cloudflare deploy token và các Worker secret cần thiết.
2. Tích hợp module Travel vào Worker và chạy test source/Worker.
3. Build SPARE + Bói toán + MEDORA + Vietnam Travel.
4. Deploy Cloudflare Pages.
5. Deploy Cloudflare Worker.
6. Hậu kiểm production.

Smoke test yêu cầu và đã đạt:

- `/vietnam-travel/` trả `200` và chứa tiêu đề `Việt Nam Đi Đâu?`.
- `/api/travel/health` trả `200` và service `vietnam-travel`.
- `/api/travel/places` trả `200` và có seed `vinh-ha-long`.
- Trang gốc SPARE trả `200`.
- Bói toán/Spirituality Market trả `200` và đúng marker thương hiệu.
- MEDORA trả `200`.

## 7. Nghiệm thu Telegram trực tiếp

Phần kỹ thuật và secret đã qua workflow; để nghiệm thu giao diện hội thoại thực tế, chủ bot gửi `/travel` trong Telegram. Bot phải trả hướng dẫn lệnh ở mục 2. Đây là thao tác không được tự động gửi thay chủ tài khoản trong CI.
