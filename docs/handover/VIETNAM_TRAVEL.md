# Vietnam Travel — bàn giao kỹ thuật

**Task-ID:** `TRAVEL-20260723-01`  
**Trạng thái:** `COMPLETED / PRODUCTION SUCCESS`  
**Hoàn tất:** 23/07/2026 18:54 (GMT+7)  
**Ứng dụng:** `/vietnam-travel/`  
**Backend:** Worker hiện có, route `/api/travel/*`  
**Kho dữ liệu:** Cloudflare Workers KV, khóa `travel:places:v1`  
**Quản trị:** Telegram Bot hiện có; chỉ chấp nhận update khi cả `chat.id` và `from.id` khớp `TELEGRAM_CHAT_ID`.

## 1. Phạm vi đã triển khai

- PWA công khai, tối ưu điện thoại và iPhone, có service worker/offline shell.
- Tìm kiếm không dấu; lọc theo vùng và loại hình; sắp xếp.
- Lưu yêu thích trên trình duyệt bằng `localStorage`.
- Trang chi tiết địa điểm, bản đồ, nguồn tham khảo và chia sẻ.
- Bộ dữ liệu khởi tạo gồm 20 địa điểm nổi tiếng/đặc thù của Việt Nam.
- API công khai chỉ đọc; mọi mutation chỉ đi qua Telegram webhook đã xác thực secret.
- Giới hạn tối đa 1.000 địa điểm trong kho KV.

## 2. Lệnh Telegram

- `/travel`, `/dulich`, `/diadiem`: trợ giúp.
- `/ds [từ khóa]`: danh sách.
- `/xem <id>`: xem chi tiết.
- `/them` rồi nhập các dòng `Tên:`, `Tỉnh:`, `Vùng:`, `Loại:`, `Mô tả:` và các trường tùy chọn.
- `/sua <id>` rồi nhập trường cần đổi.
- `/an <id>` và `/hien <id>`: ẩn/hiện.
- `/xoa <id>`: bot gửi nút xác nhận; xóa chỉ chạy sau callback xác nhận.
- `/thongke`: thống kê nhanh.

Các trường hỗ trợ: Tên, Tỉnh/Thành phố, Vùng, Loại, Mô tả, Nổi bật, Thời điểm đẹp, Thời lượng, Địa chỉ, Bản đồ, Ảnh, Nguồn, Mẹo, Ưu tiên, Công khai.

## 3. Bảo mật và dữ liệu

- Không có bot token, webhook secret hoặc Telegram ID dạng giá trị trong source.
- Worker xác thực header `X-Telegram-Bot-Api-Secret-Token` ở webhook chung.
- Module Travel kiểm tra chủ bot lần hai bằng `TELEGRAM_CHAT_ID` cho cả chat và người gửi.
- URL nhập qua bot chỉ nhận `https://`, không nhận credential trong URL.
- Dữ liệu hỏng được sao lưu tạm 7 ngày dưới khóa `travel:places:v1:corrupt:*` rồi khôi phục seed.
- Cloudflare KV có tính nhất quán cuối cùng; cập nhật vừa thực hiện có thể cần tải lại sau một khoảng ngắn tại một số điểm mạng.

## 4. Build và deploy

- `tools/apply-travel-system.mjs` ghép module Travel vào Worker theo cách idempotent.
- `.github/workflows/validate-vietnam-travel.yml` kiểm tra source, 5 unit test và việc ghép Worker hai lần không làm thay đổi kết quả.
- `.github/workflows/deploy-pages.yml` là workflow production chuẩn: dựng toàn bộ SPARE, Bói toán, MEDORA và Vietnam Travel; deploy Pages trước, Worker sau; smoke test app mới cùng app cũ.
- Các workflow và bundle chỉ dùng để materialize/kích hoạt thử nghiệm đã được xóa sau khi hoàn tất.

## 5. File chính

- `vietnam-travel/index.html`
- `vietnam-travel/app.css`
- `vietnam-travel/app.js`
- `vietnam-travel/data/seed-places.js`
- `vietnam-travel/manifest.webmanifest`
- `vietnam-travel/sw.js`
- `vietnam-travel/icon.svg`
- `backend/travel.js`
- `backend/travel.test.mjs`
- `tools/apply-travel-system.mjs`

## 6. Bằng chứng xác minh cuối

- Source thật được materialize tại commit `b3a29cbd5416424a6df16bb4a7bd392a75287f5c`.
- Unit test Travel: `5/5` đạt.
- Syntax check frontend/backend/tool và kiểm tra idempotent: đạt.
- Validation workflow run `30004367095`: `success`.
- Production deploy + smoke workflow run `30004367100`, job `89196797196`: `success`.
- Trong production run: kiểm tra secrets đạt; Pages deploy đạt; Worker deploy đạt; `/vietnam-travel/`, Travel health/API và dữ liệu seed đạt; root, Bói toán và MEDORA vẫn đạt.
- Bundle `.travel-bundle` đã xóa; source không chứa token/secret.
