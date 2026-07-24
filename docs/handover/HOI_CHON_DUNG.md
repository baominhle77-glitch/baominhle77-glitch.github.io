# HỘI CHỌN ĐÚNG — AFFILIATE AUTOPILOT

**Runtime task:** `AFFILIATE-20260724-02` — `completed`  
**Governance task:** `GOVERNANCE-20260724-01` — `completed`  
**Production:** `https://hiennhi89.pages.dev/hoi-chon-dung/`  
**Backend public:** `https://hiennhi89-gate.hiennhi89.workers.dev/api/choice/*`  
**Governance source:** `d72e3552a5a71e6f4ef14a4205b3e6f4ed2d25b5` — PR #89  
**Production run:** `30109841905` — SUCCESS

## 1. Phân tách public và nội bộ

Sự cố ngày 24/07/2026: bước build đã chèn trạng thái Affiliate Autopilot, chế độ dự phòng và thông điệp dành cho chủ sở hữu vào footer public. Đây là lỗi nghiêm trọng vì trang người dùng bị dùng như bảng điều hành nội bộ.

Trạng thái khắc phục production:

- Public UI chỉ chứa thông tin giúp người dùng hiểu, so sánh hoặc mua an toàn.
- Trạng thái credential, onboarding/KYC, nguồn dữ liệu, cron, Worker, KV, deploy, production và hướng dẫn owner chỉ tồn tại trong Telegram/admin/handover nội bộ.
- Public status route `/api/choice/autopilot/status` trả `404`.
- Public status handler đã bị xóa khỏi module materialized, không chỉ bị ẩn ở router.
- Recorder đọc `choice:autopilot:status:v1` trực tiếp từ Cloudflare KV bằng quyền CI.
- PWA sử dụng cache `hoi-chon-dung-v3`, xóa cache V2 và không còn module status trong app shell.
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

Các chi tiết trên không xuất hiện trên sản phẩm public.

## 4. Điểm chạm owner

Kết nối AccessTrade một lần:

1. Đăng nhập/đăng ký tại `https://pub2.accesstrade.vn/`.
2. Mở `https://pub2.accesstrade.vn/profile/api_key`.
3. Gửi `/atkey <API_KEY>` trong Telegram owner.

Webhook kiểm tra đồng thời `chat.id` và `from.id`, yêu cầu xóa tin nhắn chứa key và mã hóa AES-GCM trước khi lưu KV. Đây là luồng owner/private, không hiển thị trên website.

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

## 7. Tiêu chuẩn toàn công ty

- Quy chế công ty toàn cục đã merge tại `4f2c6bf2ba61c041d737e90c12d5aa82205f1d8a`.
- `AGENTS.md` bắt buộc mọi agent phân loại public/member/admin/owner trước khi thiết kế nội dung hoặc API.
- `docs/handover/AUDIENCE_PRIVACY_STANDARD.md` là chuẩn kiểm duyệt áp dụng cho mọi dự án hiện tại và tương lai.
- Ban Thanh tra phải kiểm tra cả source, build-generated content, API, lỗi hiển thị và PWA cache.
- Một nội dung sai đối tượng là lỗi nghiêm trọng và chặn merge/deploy.

## 8. Rào chắn sản phẩm

Blocklist gồm thuốc, sản phẩm giảm/tăng cân, thực phẩm chức năng, rượu bia, nicotine, chất gây nghiện, vũ khí và sản phẩm người lớn.

Không bịa review, đơn hàng, giá, tồn kho hoặc lợi nhuận. Khi nguồn lỗi, giữ catalog gần nhất; cảnh báo chi tiết chỉ gửi nội bộ.

## 9. Bằng chứng kiểm thử và production

- CI điều phối: `30108929684` — SUCCESS.
- Regression Bói toán/Account/Community/Worker, public-private scanner và WebKit AES thật: `30108929401` — SUCCESS.
- Recorder nội bộ trên PR: `30108929479` — SUCCESS.
- Production build/deploy/smoke: `30109841905` — SUCCESS.
- Hậu kiểm production xác nhận public HTML sạch, PWA V3, status public `404`, Worker và Pages đều đạt.
- Recorder KV nội bộ: `30109889703` — SUCCESS; hồ sơ commit `a22f0ef29f7712077e0202d7c89444b0ff288f03`.

## 10. Mốc khôi phục

- Runtime trước governance fix: `c4591418ae92adc77d0201e8e55737cd6ce929db`, PR #86.
- V1: `f57023af442839da852354672bea8036e579a9fd`, PR #84.
