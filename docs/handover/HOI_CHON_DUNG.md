# HỘI CHỌN ĐÚNG — AFFILIATE AUTOPILOT

**Runtime task:** `AFFILIATE-20260724-02` — `completed`  
**Governance task:** `GOVERNANCE-20260724-01` — `in_progress`  
**Production:** `https://hiennhi89.pages.dev/hoi-chon-dung/`  
**Backend public:** `https://hiennhi89-gate.hiennhi89.workers.dev/api/choice/*`

## 1. Phân tách public và nội bộ

Sự cố ngày 24/07/2026: bước build đã chèn trạng thái Affiliate Autopilot, chế độ dự phòng và thông điệp dành cho chủ sở hữu vào footer public. Đây là lỗi nghiêm trọng vì trang người dùng bị dùng như bảng điều hành nội bộ.

Quy tắc mới:

- Public UI chỉ chứa thông tin giúp người dùng hiểu, so sánh hoặc mua an toàn.
- Trạng thái credential, onboarding/KYC, nguồn dữ liệu, cron, Worker, KV, deploy, production và hướng dẫn owner chỉ tồn tại trong Telegram/admin/handover nội bộ.
- Public status route `/api/choice/autopilot/status` bị khóa và phải trả `404`.
- Recorder đọc `choice:autopilot:status:v1` trực tiếp từ Cloudflare KV bằng quyền CI.
- PWA tăng cache từ `hoi-chon-dung-v2` lên `hoi-chon-dung-v3` để xóa HTML/JS cũ khỏi thiết bị.
- `tools/check-public-content.mjs` chặn deploy nếu HTML/JavaScript công khai chứa nội dung owner/internal.

## 2. Nội dung public được phép

Người dùng được xem:

- nhu cầu, ngân sách và ưu tiên của chính họ;
- điểm mạnh, điểm yếu, mức phù hợp và thông tin nơi bán;
- giá, tồn kho, tương thích, bảo hành, đổi trả và cảnh báo an toàn;
- công bố affiliate/hoa hồng cần thiết;
- thông tin quyền riêng tư và giới hạn dịch vụ.

Người dùng không được xem:

- trạng thái Autopilot hoặc credential;
- việc chủ sở hữu cần đăng nhập/KYC;
- tên chế độ như `onboarding_required`, `error`, `fallback`;
- API key, secret, trigger, cron, Worker, KV, source, commit, workflow hoặc production;
- hoa hồng/doanh thu nội bộ và lỗi nguồn.

## 3. Mô hình vận hành nội bộ

Affiliate Autopilot vẫn thực hiện trong nền:

1. Lấy datafeed sản phẩm từ AccessTrade.
2. Lọc hàng rủi ro, thiếu tồn kho, URL không an toàn hoặc dữ liệu không hợp lệ.
3. Chấm điểm theo mức phù hợp, sức bán, giá, giảm giá, hoa hồng và giao dịch 7 ngày.
4. Tuyển tối đa 6 sản phẩm cho mỗi nhóm Tarot, creator và in 3D.
5. Tạo deep link và cập nhật catalog.
6. Giữ catalog gần nhất khi nguồn lỗi.
7. Chạy sau deploy và theo cron mỗi 6 giờ.
8. Gửi trạng thái qua Telegram owner và ghi hồ sơ nội bộ.

Các chi tiết trên không được xuất hiện trên sản phẩm public.

## 4. Điểm chạm owner

Kết nối AccessTrade một lần:

1. Đăng nhập/đăng ký tại `https://pub2.accesstrade.vn/`.
2. Mở `https://pub2.accesstrade.vn/profile/api_key`.
3. Gửi `/atkey <API_KEY>` trong Telegram owner.

Webhook kiểm tra đồng thời `chat.id` và `from.id`, yêu cầu xóa tin nhắn chứa key và mã hóa AES-GCM trước khi lưu KV. Đây là luồng owner/private, không được hiển thị trên website.

## 5. API public và private

| Route | Phân loại | Chức năng |
|---|---|---|
| `GET /api/choice/products` | Public | catalog đã được làm sạch, không lộ URL đích thô hoặc metadata vận hành |
| `POST /api/choice/vote` | Public | bình chọn khử lặp |
| `GET /r/choice/:id` | Public | chuyển tới nơi bán và đo click ẩn danh |
| `GET /api/choice/health` | Public tối giản | kiểm tra dịch vụ, không trả trạng thái kinh doanh/credential |
| `POST /api/choice/autopilot/run` | Internal | bắt buộc trigger secret |
| `GET /api/choice/autopilot/status` | Disabled public | trả `404`; recorder đọc KV trực tiếp |

## 6. Làm sạch dữ liệu sản phẩm

Dữ liệu public không chứa:

- nhãn `Autopilot` hoặc `AccessTrade`;
- điểm xếp hạng nội bộ;
- UTM medium mang tên cơ chế vận hành;
- metadata `source`, credential hoặc trạng thái nội bộ.

Ngôn ngữ public chỉ giải thích giá trị cho người mua, ví dụ “thông tin sản phẩm đã được đối chiếu trước khi đưa vào danh sách”.

## 7. Rào chắn sản phẩm

Blocklist gồm thuốc, sản phẩm giảm/tăng cân, thực phẩm chức năng, rượu bia, nicotine, chất gây nghiện, vũ khí và sản phẩm người lớn.

Không bịa review, đơn hàng, giá, tồn kho hoặc lợi nhuận. Khi nguồn lỗi, giữ catalog gần nhất; cảnh báo chi tiết chỉ gửi nội bộ.

## 8. Kiểm thử bắt buộc

- `node tools/check-public-content.mjs` trên source sau materialize và `_site` trước deploy.
- `backend/choice-public-boundary.test.mjs` kiểm tra status route bị khóa và dữ liệu public không chứa nhãn nội bộ.
- `hoi-chon-dung/app.test.mjs` kiểm tra HTML public, PWA V3 và không gọi status API.
- Smoke production kiểm tra nội dung hữu ích có mặt, nội dung owner/internal vắng mặt và status route trả `404`.

Task chỉ được closeout sau CI, merge, deploy, cache V3 và hậu kiểm production thành công.

## 9. Mốc khôi phục

- V2 runtime trước governance fix: `c4591418ae92adc77d0201e8e55737cd6ce929db`, PR #86.
- V1: `f57023af442839da852354672bea8036e579a9fd`, PR #84.
