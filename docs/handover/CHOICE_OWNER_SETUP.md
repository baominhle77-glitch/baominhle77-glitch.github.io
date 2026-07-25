# HỘI CHỌN ĐÚNG — TRUNG TÂM KẾT NỐI CHỦ SỞ HỮU

**Task hiện hành:** `GROWTH-20260725-03` — `completed`  
**AccessTrade/Search source:** `219ff22c4dcff1c2576b6008dd652e6ae5a5314f` — PR #104  
**Production recovery source:** `aa8de287587e03c565be75806c7139f8959c8fba` — PR #106  
**Production deploy:** `30142147938` — SUCCESS  
**Credential bootstrap:** `30142378416` — SUCCESS  
**Phân loại:** Owner/Internal — không sao chép nội dung này lên website hoặc API công khai.

## 1. Trạng thái kết nối hiện tại

AccessTrade đã được kết nối thành công bằng kênh RSA-OAEP dùng một lần:

- Credential đã được kiểm tra bằng Publisher API chung.
- Key gốc không được commit vào repository hoặc đưa vào log.
- Worker lưu credential dưới dạng AES-GCM trong Cloudflare KV.
- RSA keypair tạm đã bị xóa sau khi dùng.
- Bootstrap được khóa one-time để không thể ghi đè lại bằng cùng đường vận hành.
- Growth Autopilot trả trạng thái `active`.
- Vòng đầu đã tuyển và gắn link affiliate cho `24` sản phẩm thật.

PR vận hành tạm #107 đã đóng **không merge**; workflow tạm và ciphertext không đi vào `main`.

## 2. Vì sao Telegram từng báo key chưa sẵn sàng

Luồng cũ dùng riêng API TikTok Shop để xác thực. Một Publisher key có thể hợp lệ nhưng chưa được cấp quyền TikTok Shop, dẫn đến báo sai rằng key chưa sẵn sàng.

Production hiện hành:

1. Xác thực key qua `/v1/campaigns` của Publisher.
2. Thử TikTok Shop khi tài khoản có quyền.
3. Nếu TikTok Shop trả lỗi quyền, tự chuyển sang `/v1/datafeeds`.
4. Dùng `aff_link` do AccessTrade cấp sẵn khi có.
5. Không bắt chủ sở hữu gửi lại hoặc chọn từng sản phẩm.

## 3. Trung tâm kết nối owner

Endpoint:

`https://hiennhi89-gate.hiennhi89.workers.dev/owner/choice/setup`

Đúng tài khoản Telegram owner có thể gửi:

- `/ketnoi`
- `/caidat`
- `/setup`

Bot tạo vé dùng một lần 10 phút, đổi thành cookie `HttpOnly; Secure; SameSite=Strict` trong 12 giờ. Không có phiên trả `401`; response là `noindex/no-store` và không được liên kết từ public site.

## 4. Nhận tiền affiliate

- Hoa hồng thuộc tài khoản ACCESSTRADE Publisher của chủ sở hữu.
- ACCESSTRADE chuyển tiền vào tài khoản ngân hàng đã khai báo.
- Không cần bấm rút từng đơn.
- Repository, public UI và dashboard không lưu thông tin ngân hàng.
- Dashboard chỉ hiển thị số liệu tổng hợp click, đơn, doanh số và hoa hồng.

## 5. Google Search Console và Bing Webmaster

Hai file xác minh đã được deploy ở gốc website và được production smoke kiểm tra đúng nội dung:

- Google: `https://hiennhi89.pages.dev/google91001f63e8104533.html`
- Bing: `https://hiennhi89.pages.dev/BingSiteAuth.xml`

Hai file được đưa vào cả workflow deploy chính và Growth SEO 6 giờ, nên không bị mất trong lần xuất bản sau.

Trạng thái kỹ thuật: file đã live. Bước còn lại phụ thuộc giao diện tài khoản của nền tảng: chủ sở hữu bấm **Verify/Xác minh** trong Google Search Console và Bing Webmaster nếu dashboard vẫn đang chờ xác minh. Công ty không có connector điều khiển trực tiếp hai giao diện đăng nhập này.

## 6. Bảo mật

- Không lặp hoặc ghi lại API key plaintext trong tài liệu.
- Nhánh từng dùng để chẩn đoán không được merge; source production được tái dựng sạch.
- Bootstrap chỉ chấp nhận credential có SHA-256 đúng với key chủ sở hữu đã cung cấp.
- Public API không trả credential, URL affiliate thô, trạng thái onboarding hoặc dữ liệu doanh thu nội bộ.
- Public status route tiếp tục trả `404`.

## 7. Bằng chứng

- PR #104 coordination `30141399269`: SUCCESS.
- PR #104 validation `30141399267`: SUCCESS, gồm Publisher fallback, RSA/AES, SEO Google/Bing, boundary và WebKit.
- Production recovery `30142147938`: SUCCESS.
- Production recorder commit `a770da880580d68c52981b9c59f1686c438538a3`.
- Credential bootstrap `30142378416`: SUCCESS.
- Bootstrap result: `connected=true`, `autopilot_ok=true`, `selected_products=24`, `mode=active`.
- Temporary operation PR #107: closed, not merged.
