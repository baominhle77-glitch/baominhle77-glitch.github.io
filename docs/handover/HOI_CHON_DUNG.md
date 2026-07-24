# HỘI CHỌN ĐÚNG — AFFILIATE AUTOPILOT

**Task hiện tại:** `AFFILIATE-20260724-02`  
**Production hiện hành:** `https://hiennhi89.pages.dev/hoi-chon-dung/`  
**Backend:** `https://hiennhi89-gate.hiennhi89.workers.dev/api/choice/*`  
**Trạng thái V2:** source đang chờ CI, merge, deploy và hậu kiểm production. Không được ghi V2 hoàn tất trước khi các bước đó đạt.

## 1. Quyết định sản phẩm

V1 là một MVP có người vận hành: catalog seed và link affiliate phải được chủ sở hữu hoặc admin cập nhật. Cách này không đúng mô hình công ty AI, vì chủ sở hữu chỉ đưa ý tưởng, bất chợt xem thành quả và khiếu nại khi chưa đạt.

V2 thay luồng chính bằng **Affiliate Autopilot**:

1. Tự lấy datafeed sản phẩm từ AccessTrade.
2. Tự lọc ngành hàng rủi ro và sản phẩm thiếu tồn kho, URL an toàn, hoa hồng hoặc dữ liệu tối thiểu.
3. Tự chấm điểm theo độ phù hợp ngách, sức bán, mức hoa hồng, giá/giảm giá và dữ liệu đơn hàng gần đây.
4. Tự tuyển tối đa 6 sản phẩm cho mỗi nhóm Tarot, sáng tạo nội dung và in 3D.
5. Tự tạo deep link có UTM/sub-ID theo sản phẩm.
6. Tự thay catalog seed sau khi có đủ sản phẩm đã xác minh; giữ catalog gần nhất nếu nguồn ngoài lỗi.
7. Tự đọc giao dịch 7 ngày để tăng hoặc giảm trọng số sản phẩm.
8. Tự chạy ngay sau deploy và theo cron mỗi 6 giờ.
9. Tự gửi trạng thái hoặc cảnh báo qua Telegram; không giao việc chọn sản phẩm hay gắn từng link cho chủ sở hữu.

## 2. Điểm chạm duy nhất có thể cần chủ sở hữu

Công ty không thể tự thực hiện đăng ký/KYC hoặc đăng nhập một tài khoản affiliate đứng tên chủ sở hữu. Khi chưa có credential, Autopilot chuyển sang `onboarding_required` và bot tự gửi đúng ba bước:

1. Đăng nhập hoặc đăng ký tại `https://pub2.accesstrade.vn/`.
2. Mở `https://pub2.accesstrade.vn/profile/api_key` và sao chép API key.
3. Gửi `/atkey <API_KEY>` trong Telegram owner.

Tin nhắn chứa API key được yêu cầu xóa ngay sau khi webhook nhận. Key được mã hóa AES-GCM trước khi lưu KV, bằng khóa dẫn xuất từ `SESSION_SECRET`. Có thể thay bằng Worker secret `ACCESSTRADE_API_TOKEN`; tuyệt đối không commit credential.

Sau bước kết nối một lần, chủ sở hữu không chọn sản phẩm, không tạo deep link và không cập nhật từng URL.

## 3. Nguồn và chiến lược danh mục

| Danh mục | Cụm truy vấn tự động | Rào chắn |
|---|---|---|
| Tarot | bài Tarot, khăn trải, túi đựng | loại claim đổi vận/chữa bệnh; yêu cầu giá, tồn kho và shop |
| Creator | micro cài áo, tripod điện thoại, đèn LED | kiểm tra tương thích; loại hàng cấm/rủi ro |
| In 3D | PLA, PETG, resin in 3D | cảnh báo kích thước/profile/an toàn resin |

Blocklist cứng gồm thuốc, sản phẩm giảm/tăng cân, thực phẩm chức năng, rượu bia, nicotine, chất gây nghiện, vũ khí và sản phẩm người lớn.

## 4. API và lịch chạy

| Route | Chức năng |
|---|---|
| `GET /api/choice/autopilot/status` | trạng thái công khai tối giản; không trả doanh thu hoặc credential |
| `POST /api/choice/autopilot/run` | trigger nội bộ sau deploy; bắt buộc secret header |
| `GET /api/choice/products` | catalog công khai; không lộ URL đích thô |
| `GET /r/choice/:id` | đo click và chuyển hướng tới deep link |
| `POST /api/choice/vote` | tín hiệu cộng đồng, khử lặp theo ngày |

Cron Cloudflare: `17 */6 * * *`.

KV chính:

- `choice:catalog:v1`: catalog; document V2 có sản phẩm Autopilot.
- `choice:autopilot:status:v1`: trạng thái vòng chạy.
- `choice:autopilot:credential:v1`: AccessTrade key đã mã hóa nếu không dùng Worker secret.
- `choice:autopilot:lock:v1`: khóa chống chạy chồng, TTL 15 phút.
- `choice:autopilot:onboarding-notice:v1`: chống spam thông báo onboarding.
- Các khóa vote/click hiện hữu tiếp tục được giữ.

## 5. Telegram

Luồng chính:

- `/chon`, `/autopilot`, `/congty`: bảng điều hành trạng thái.
- `/atkey <API_KEY>`: kết nối một lần; chỉ đúng `chat.id` và `from.id` owner mới được xử lý.
- `/autopilot-chay`: chạy lại thủ công khi cần thanh tra hoặc phục hồi.

Các lệnh V1 thêm/sửa/ẩn/xóa sản phẩm được giữ như **break-glass recovery**, không phải công việc thường lệ của chủ sở hữu.

## 6. Bảo mật và tính trung thực

- Trigger deploy là secret ngẫu nhiên, đặt bằng `wrangler secret put`; không có trong source hoặc frontend.
- Public UI chỉ đọc trạng thái, không nhận credential.
- API catalog không trả affiliate URL thô; người dùng đi qua redirect nội bộ.
- Không lưu IP thô trong thống kê click/vote.
- Không xuất bản sản phẩm thuộc blocklist hoặc thiếu dữ liệu bắt buộc.
- Không bịa review, đơn hàng, giá, tồn kho hoặc lợi nhuận.
- Nếu AccessTrade lỗi, giữ catalog gần nhất và ghi `error`; không giả báo thành công.

## 7. Kiểm thử V2

Bộ test module hiện bao phủ:

- mã hóa/giải mã credential;
- lọc sản phẩm rủi ro;
- thiếu credential phải chuyển `onboarding_required`;
- tự tuyển 18 sản phẩm và tạo deep link bằng mock API;
- status API không rò token/hoa hồng;
- integration script idempotent, trigger bí mật và owner guard;
- PWA cache V2 có `autopilot-ui.js`;
- HTML sau build có badge/footer Autopilot.

Bằng chứng CI và production sẽ được bổ sung sau khi PR merge và workflow hậu kiểm đạt.

## 8. V1 production đã được xác minh

V1 từng deploy thành công ở source `f57023af442839da852354672bea8036e579a9fd`, PR #84, workflow `30100989464`. Thông tin này chỉ là mốc khôi phục; V2 mới là kiến trúc vận hành chuẩn theo mô hình công ty.
