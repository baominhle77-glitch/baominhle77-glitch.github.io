# HỘI CHỌN ĐÚNG — AFFILIATE AUTOPILOT

**Task:** `AFFILIATE-20260724-02` — `completed`  
**Production:** `https://hiennhi89.pages.dev/hoi-chon-dung/`  
**Backend:** `https://hiennhi89-gate.hiennhi89.workers.dev/api/choice/*`  
**Runtime source:** `c4591418ae92adc77d0201e8e55737cd6ce929db` — PR #86  
**Recorder source:** `5ba62c6e67ff15eb49e1eb155e3763fa52f71508` — PR #87  
**Production deploy:** `30105568525` — SUCCESS  
**Production recorder:** `30105641911` — SUCCESS  
**Mode hiện tại:** `onboarding_required`

## 1. Mô hình vận hành chuẩn

V1 từng yêu cầu admin chọn sản phẩm và gắn từng link. V2 loại bỏ luồng vận hành thủ công đó. Chủ sở hữu chỉ đưa ý tưởng, bất chợt xem thành quả và khiếu nại; công ty tự vận hành toàn bộ phần còn lại.

Affiliate Autopilot thực hiện:

1. Lấy datafeed sản phẩm từ AccessTrade.
2. Lọc sản phẩm rủi ro, thiếu tồn kho, thiếu shop, URL không an toàn, giá hoặc hoa hồng không hợp lệ.
3. Chấm điểm theo độ phù hợp ngách, sức bán, hoa hồng, mức giảm giá và giao dịch 7 ngày.
4. Tuyển tối đa 6 sản phẩm cho mỗi nhóm Tarot, sáng tạo nội dung và in 3D.
5. Tạo deep link có UTM/sub-ID riêng cho từng sản phẩm.
6. Thay catalog seed khi đã có đủ sản phẩm xác minh; giữ catalog gần nhất nếu nguồn ngoài lỗi.
7. Đọc giao dịch 7 ngày để điều chỉnh trọng số.
8. Chạy ngay sau deploy và theo cron mỗi 6 giờ.
9. Tự gửi trạng thái/cảnh báo qua Telegram.
10. Tự ghi mode production vào `docs/handover/CHOICE_AUTOPILOT_STATUS.md` sau mỗi deploy.

## 2. Trạng thái production đã xác minh

Recorder production ghi:

- mode: `onboarding_required`;
- credential AccessTrade: chưa kết nối;
- cần đăng nhập/KYC một lần: có;
- vòng chạy gần nhất: `2026-07-24T15:31:11.990Z`;
- source deploy: `5ba62c6e67ff15eb49e1eb155e3763fa52f71508`;
- deploy run: `30105568525`;
- recorder run: `30105641911`.

Đây không phải lỗi hệ thống. Worker, trigger bí mật, cron, Pages, PWA, status API và smoke test đều đã đạt. Autopilot dừng đúng ở ranh giới công ty không thể tự giả danh chủ tài khoản để đăng ký, đăng nhập hoặc hoàn thành KYC với mạng affiliate.

## 3. Điểm chạm con người duy nhất

Bot Telegram đã được thiết kế để tự gửi hướng dẫn kết nối một lần:

1. Đăng nhập hoặc đăng ký tại `https://pub2.accesstrade.vn/`.
2. Mở `https://pub2.accesstrade.vn/profile/api_key`.
3. Gửi `/atkey <API_KEY>` trong đúng Telegram owner.

Sau đó:

- webhook kiểm tra đồng thời `chat.id` và `from.id`;
- yêu cầu xóa tin nhắn chứa key;
- key được mã hóa AES-GCM bằng khóa dẫn xuất từ `SESSION_SECRET` trước khi lưu KV;
- Autopilot tự chạy ngay;
- chủ sở hữu không chọn sản phẩm, không tạo deep link, không cập nhật từng URL.

Có thể dùng Worker secret `ACCESSTRADE_API_TOKEN` thay cho `/atkey`.

## 4. Nguồn và rào chắn

| Danh mục | Cụm truy vấn | Rào chắn |
|---|---|---|
| Tarot | bài Tarot, khăn trải, túi đựng | loại claim chữa bệnh/đổi vận; bắt buộc giá, tồn kho, shop |
| Creator | micro cài áo, tripod, đèn LED | kiểm tra tương thích; loại hàng cấm/rủi ro |
| In 3D | PLA, PETG, resin | cảnh báo kích thước, profile và an toàn resin |

Blocklist cứng gồm thuốc, sản phẩm giảm/tăng cân, thực phẩm chức năng, rượu bia, nicotine, chất gây nghiện, vũ khí và sản phẩm người lớn.

## 5. API, cron và KV

| Route | Chức năng |
|---|---|
| `GET /api/choice/autopilot/status` | trạng thái công khai tối giản |
| `POST /api/choice/autopilot/run` | trigger nội bộ bắt buộc secret header |
| `GET /api/choice/products` | catalog công khai, không lộ URL đích thô |
| `GET /r/choice/:id` | đo click và chuyển tới deep link |
| `POST /api/choice/vote` | tín hiệu cộng đồng, khử lặp theo ngày |

Cron Cloudflare: `17 */6 * * *`.

KV:

- `choice:catalog:v1`;
- `choice:autopilot:status:v1`;
- `choice:autopilot:credential:v1`;
- `choice:autopilot:lock:v1`;
- `choice:autopilot:onboarding-notice:v1`;
- các khóa vote/click hiện hữu.

## 6. Telegram

Luồng chính:

- `/chon`, `/autopilot`, `/congty`: bảng điều hành;
- `/atkey <API_KEY>`: kết nối một lần;
- `/autopilot-chay`: chạy lại khi thanh tra/phục hồi.

Các lệnh V1 thêm/sửa/ẩn/xóa sản phẩm chỉ còn là break-glass recovery, không phải công việc thường lệ của chủ sở hữu.

## 7. Bảo mật và tính trung thực

- Trigger deploy là secret ngẫu nhiên đặt bằng `wrangler secret put`.
- Public UI không nhận credential.
- API catalog không trả affiliate URL thô.
- Không lưu IP thô trong thống kê click/vote.
- Không xuất bản sản phẩm thuộc blocklist hoặc thiếu dữ liệu bắt buộc.
- Không bịa review, đơn hàng, giá, tồn kho hoặc lợi nhuận.
- AccessTrade lỗi thì giữ catalog gần nhất và ghi `error`; không giả báo thành công.
- Recorder không ghi key, trigger, URL affiliate thô hoặc doanh thu riêng tư.

## 8. Bằng chứng kiểm thử và production

- Module Autopilot: encryption, safety filter, onboarding, tuyển 18 sản phẩm/deep-link mock và status không rò credential — đạt.
- Integration script idempotent, owner guard, trigger secret, alias `/chon`, scheduled handler — đạt.
- Frontend Bói toán, Account, Service Worker, Community backend, Worker lõi, Affiliate Autopilot và WebKit AES thật — run `30104948983` SUCCESS.
- Điều phối đa-agent — run `30104948933` SUCCESS.
- Production runtime — run `30105078450` SUCCESS.
- Production recorder deploy — run `30105568525` SUCCESS.
- Recorder status — run `30105641911` SUCCESS.

## 9. Mốc khôi phục

V1 production source `f57023af442839da852354672bea8036e579a9fd`, PR #84, run `30100989464`. Chỉ dùng làm mốc rollback; V2 là kiến trúc vận hành chuẩn.
