# Vietnam Travel — bàn giao kỹ thuật

**Task-ID:** `TRAVEL-20260723-01`  
**Ứng dụng:** `/vietnam-travel/`  
**Backend:** Worker hiện có, route `/api/travel/*`  
**Kho dữ liệu:** Cloudflare Workers KV, khóa `travel:places:v1`  
**Quản trị:** Telegram Bot hiện có; chỉ chấp nhận update khi cả `chat.id` và `from.id` khớp `TELEGRAM_CHAT_ID`.

## 1. Phạm vi bản đầu

- PWA công khai, tối ưu điện thoại và iPhone.
- Tìm kiếm không dấu; lọc theo vùng và loại hình; sắp xếp.
- Lưu yêu thích trên trình duyệt bằng `localStorage`.
- Chi tiết địa điểm, bản đồ, nguồn tham khảo và chia sẻ.
- Bộ dữ liệu khởi tạo gồm 20 địa điểm nổi tiếng/đặc thù của Việt Nam.
- API công khai chỉ đọc; mọi mutation chỉ đi qua Telegram webhook đã xác thực secret.

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
- Worker tiếp tục xác thực header `X-Telegram-Bot-Api-Secret-Token` ở webhook chung.
- Module Travel kiểm tra chủ bot lần hai bằng `TELEGRAM_CHAT_ID` cho cả chat và người gửi.
- URL nhập qua bot chỉ nhận `https://`, không nhận credential trong URL.
- Dữ liệu hỏng được sao lưu tạm 7 ngày dưới khóa `travel:places:v1:corrupt:*` rồi khôi phục seed.
- Giới hạn tối đa 1.000 địa điểm để giữ payload KV có kiểm soát.
- KV có tính nhất quán cuối cùng; cập nhật vừa thực hiện có thể cần tải lại sau một khoảng ngắn tại một số điểm mạng.

## 4. Build và deploy

- `tools/apply-travel-system.mjs` ghép module vào Worker theo cách idempotent.
- `validate-vietnam-travel.yml` chạy test module và kiểm tra việc ghép Worker hai lần không làm thay đổi source.
- `deploy-vietnam-travel.yml` chỉ chạy sau workflow production chính thành công; nó dựng lại toàn bộ site hiện có cùng `/vietnam-travel/`, deploy Pages trước rồi Worker sau, sau đó smoke test cả app mới và app cũ.

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

## 6. Trạng thái xác minh

Tại thời điểm tạo tài liệu này:

- Unit test Travel: `5/5` đạt ở môi trường cục bộ.
- Syntax check frontend/backend/tool: đạt.
- Fixture kiểm tra tool tích hợp chạy hai lần: đạt, output không đổi.
- CI GitHub, merge, deploy và production E2E: phải lấy trạng thái từ PR/workflow tương ứng; không được suy đoán là đã đạt khi chưa có log.
