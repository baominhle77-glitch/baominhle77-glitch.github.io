# TIÊU CHUẨN PHÂN TÁCH ĐỐI TƯỢNG VÀ THÔNG TIN NỘI BỘ

**Mức độ:** Bắt buộc — lỗi vi phạm được xếp là lỗi nghiêm trọng và chặn deploy.  
**Áp dụng:** Mọi website, ứng dụng, API, PWA, nội dung, workflow build và dự án tương lai của công ty.

## 1. Bốn nhóm người đọc

Mọi nội dung phải được gắn một nhóm trước khi xuất bản:

1. **Public/User:** người dùng cuối chưa đăng nhập hoặc người truy cập công khai.
2. **Member:** người dùng đã đăng nhập, chỉ thấy dữ liệu và chức năng thuộc tài khoản của họ.
3. **Admin/Operator:** nhân sự vận hành có xác thực và phân quyền.
4. **Owner/Internal:** chủ sở hữu, báo cáo kinh doanh, trạng thái hạ tầng và quyết định nội bộ.

Không được dùng một giao diện cho nhiều nhóm nếu không có kiểm soát truy cập rõ ràng.

## 2. Quy tắc giá trị người dùng

Trước mỗi đoạn chữ, trạng thái, nút hoặc cảnh báo công khai, Ban Sản phẩm phải trả lời được:

- Người dùng đang cần biết điều gì?
- Thông tin này giúp họ quyết định hoặc hoàn thành hành động nào?
- Có thể viết lại theo ngôn ngữ người dùng thay vì ngôn ngữ hệ thống không?
- Nếu bỏ thông tin này, người dùng có mất quyền lợi, an toàn hoặc khả năng hoàn thành tác vụ không?

Nếu không trả lời được, nội dung không được xuất hiện trên giao diện công khai.

## 3. Nội dung cấm trên giao diện công khai

Không công khai trực tiếp hoặc gián tiếp:

- việc chủ sở hữu cần làm, trạng thái onboarding/KYC của chủ sở hữu;
- tên chế độ nội bộ như `onboarding_required`, `not_started`, `fallback`, `recovery`;
- tên hệ thống nền, Worker, KV, cron, pipeline, branch, commit, source, deploy, production;
- API key, token, secret, trigger, binding, endpoint quản trị hoặc trạng thái credential;
- trạng thái vận hành, lỗi nguồn, số đơn/hoa hồng/doanh thu nội bộ;
- hướng dẫn dành cho Telegram owner, admin hoặc nhân sự vận hành;
- thông báo kiểu “công ty đang…”, “chủ sở hữu không cần…”, “hệ thống đang kết nối nguồn…”.

Các nội dung này chỉ được gửi qua kênh owner/admin có xác thực hoặc hồ sơ nội bộ.

## 4. Nội dung được phép công khai

Được phép và nên công khai khi có ích cho người dùng:

- affiliate/quảng cáo và khả năng nhận hoa hồng;
- giá, tồn kho, bảo hành, đổi trả, tương thích và thời điểm cập nhật;
- quyền riêng tư, dữ liệu nào được thu thập và mục đích sử dụng;
- giới hạn, rủi ro, điều kiện dịch vụ và cách xử lý sự cố phía người dùng;
- trạng thái tác vụ của chính người dùng, ví dụ “Đang tải kết quả”, “Thanh toán chưa hoàn tất”.

Phải viết theo ngôn ngữ người dùng, không tiết lộ kiến trúc nội bộ không cần thiết.

## 5. Kiểm soát kỹ thuật

- Build không được chèn nội dung owner/internal vào HTML hoặc JavaScript công khai.
- API trạng thái nội bộ không được public; phải yêu cầu xác thực hoặc đọc trực tiếp từ hạ tầng nội bộ.
- PWA/service worker phải tăng phiên bản cache khi gỡ nội dung nhạy cảm để xóa bản cũ trên thiết bị.
- CI phải chạy `node tools/check-public-content.mjs` trước deploy.
- Smoke test production phải xác nhận nội dung cấm không tồn tại trong HTML công khai.
- Báo cáo owner và dashboard nội bộ phải tách khỏi public site bằng route và quyền truy cập riêng.

## 6. Checklist Ban Thanh tra

Mỗi PR có thay đổi giao diện/API công khai phải đạt đủ:

- [ ] Đã xác định nhóm người đọc cho từng trạng thái và thông báo mới.
- [ ] Mọi nội dung public có giá trị trực tiếp cho người dùng.
- [ ] Không lộ việc chủ sở hữu cần làm hoặc trạng thái vận hành nội bộ.
- [ ] Không lộ credential, endpoint/quy trình quản trị hoặc chỉ số kinh doanh riêng tư.
- [ ] Nội dung build-generated được kiểm tra, không chỉ source trực tiếp.
- [ ] Cache cũ được vô hiệu hóa khi cần.
- [ ] CI và hậu kiểm production đều kiểm tra ranh giới public/private.

Một mục không đạt thì PR chưa được merge/deploy.
