# Bàn giao hệ thống ba webapp

> **Mọi agent phải đọc `AGENTS.md` trước file này.** Sau đó đọc `docs/handover/ACTIVE_TASKS.json` và `docs/handover/NHAT-KY-PHOI-HOP.md` trước khi sửa.

**Cập nhật:** 23/07/2026 13:56 (GMT+7)  
**Source ứng dụng đã deploy:** `61c0dc0efbddf3c865c44d001d022d80cf0185d9`  
**Commit ghi trạng thái production:** `52083fda3aa54ea03c727d5a11aba8871c54b9ab`  
**Task đang hoạt động:** không có.  
**Production:** `SUCCESS`.

## Nguyên tắc độ tin cậy bắt buộc

- **Tuyệt đối không bịa.**
- Mọi kết luận về source, production, thuật toán hoặc nội dung chuyên môn phải có căn cứ từ source, log, test hoặc tài liệu đã kiểm chứng.
- Khi chưa đủ dữ liệu, ghi rõ **chưa xác lập/chưa đủ chứng cứ**.
- Không đưa mật khẩu, token, IP đầy đủ, mã thiết bị cá nhân, QR, chat hoặc secret vào repository.

---

## 1. Webapp và production

| App | Nguồn | Production |
|---|---|---|
| Bói toán / Spirituality Market | `boitoan/`, `assets/`, `backend/` | `https://hiennhi89.pages.dev/boitoan/` |
| SPARE | root | `https://hiennhi89.pages.dev/` |
| MEDORA | `medora/` | `https://hiennhi89.pages.dev/medora/` |

Repository `baominhle77-glitch.github.io` là nguồn chuẩn duy nhất.

### Bằng chứng production gần nhất

`docs/handover/PRODUCTION_STATUS.md` ghi cho source commit `61c0dc0e…`:

- Cloudflare Pages `200`;
- trang Admin `200`;
- Community CSS `200`;
- Gate runtime JS `200`;
- Worker API Reader không phiên `401 unauthorized`, đúng kỳ vọng;
- API thảo luận không phiên `401 unauthorized`, đúng kỳ vọng;
- onboarding công khai `400 invalid_account` với dữ liệu kiểm thử không hợp lệ;
- marker Account V2 tồn tại: onboarding hai màn hình, nhánh plaintext không ép giải mã, badge vai trò và Admin tổng;
- workflow production `29986415052` hoàn tất thành công;
- thứ tự deploy: Pages trước, Worker sau.

---

## 2. `BOITOAN-20260723-06` — Account V2 hoàn tất

PR #31 merge thành `61c0dc0efbddf3c865c44d001d022d80cf0185d9`.

### Lỗi đã sửa

Người dùng kiểm tra trực tiếp trên iPhone và xác nhận bản trước có ba vấn đề:

1. Đăng nhập, đăng ký và Admin hiển thị chồng trong một card dài.
2. Checkbox/radio bị CSS input toàn cục kéo thành thanh dài.
3. Đăng ký báo lỗi chung sau khi gửi.

Nguyên nhân lỗi đăng ký đã được xác lập: trang Bói toán production hiện là HTML plaintext được gate che, nhưng frontend cũ vẫn luôn gọi `decryptPayload()` sau khi backend đã tạo account. Account có thể đã được tạo rồi frontend mới lỗi vì DOM không có payload AES.

Account V2 xử lý như sau:

- nếu DOM không có `application/gate-payload`, frontend mở app trực tiếp bằng token hợp lệ;
- chỉ giải mã khi payload mã hóa thực sự tồn tại;
- checkbox/radio trên iPhone được trả về kích thước và appearance native;
- lỗi backend cụ thể được chuyển thành thông báo rõ hơn thay vì chỉ báo lỗi chung.

### Onboarding hai màn hình

- **Màn 1:** chỉ có ba lựa chọn `Đăng nhập`, `Đăng ký`, `Admin`.
- **Màn 2:** chỉ hiện đúng biểu mẫu đã chọn và có nút quay lại.
- Đăng ký yêu cầu chọn `Khách` hoặc `Reader / Người xem bói`.
- Sau đăng ký/đăng nhập thành công, hệ thống lưu gate token, community token và profile để vào app ngay.

Nếu một username đã được tạo trong lần lỗi cũ, người dùng nên chọn **Đăng nhập** bằng đúng thông tin đã dùng thay vì đăng ký lại cùng username.

### Hiển thị vai trò và giao diện theo tài khoản

Vai trò hiện cạnh tên/avatar và trong giao diện theo dạng badge:

- `Khách`;
- `Reader / Người xem bói`;
- `Admin`;
- `Admin tổng` trên thiết bị owner-device đã khóa.

Giao diện theo vai trò:

- Khách mặc định vào danh sách Reader, có trò chuyện, review, thảo luận và trang cá nhân.
- Reader mặc định vào khu khách hàng/hội thoại, có hồ sơ chuyên môn, nhận phí, thảo luận và trang cá nhân.
- Cả Khách và Reader đều xem được bài thảo luận chung và bình luận khi bài còn mở.

### Quyền Admin

Admin hiện có thể:

- xem danh sách member;
- khóa/mở khóa member;
- xóa tài khoản member;
- xóa review công khai;
- tạo, đóng, mở lại hoặc xóa bài thảo luận chung.

### Admin tổng

- Thiết bị Admin tổng được bind động vào Workers KV sau khi đăng nhập Admin hợp lệ trên chính thiết bị đó hoặc bấm nút đặt thiết bị trong trang quản trị.
- Không hardcode mật khẩu, mã trình duyệt hoặc IP của chủ sở hữu vào source.
- Chỉ đúng owner-device mới đọc được nội dung hội thoại riêng.
- Owner-device có thể mở giao diện của một member bằng token `impersonation` **chỉ đọc**.
- Backend chặn mọi thao tác ghi dưới danh nghĩa member trong phiên này và ghi audit KV cho thao tác Admin nhạy cảm.

### Xóa member

Xóa member loại bỏ hồ sơ, thông tin đăng nhập, phiên và các chỉ mục liên quan. Nội dung hội thoại đã tồn tại vẫn tuân theo TTL 30 ngày và không biến thành quyền đăng bài dưới danh nghĩa người đã xóa.

---

## 3. Telegram khi đăng ký mới

Thông báo best-effort gửi Admin gồm:

- vai trò;
- tên hiển thị;
- tên đăng nhập;
- mã hồ sơ trình duyệt;
- browser/platform;
- kích thước màn hình;
- ngôn ngữ và múi giờ;
- quốc gia;
- IP rút gọn `/24` hoặc `/64`;
- thời điểm đăng ký.

Không gửi mật khẩu, thông tin ngân hàng hoặc QR. Giao diện công bố rõ phạm vi dữ liệu trước khi đăng ký.

**Chưa nghiệm thu thực tế:** cần một đăng ký thật trên điện thoại sau khi tải Account V2 để xác nhận Telegram nhận đúng thông báo. CI chỉ xác nhận contract và luồng best-effort, không thay thế lần kiểm tra bot thật.

---

## 4. Bằng chứng CI và điều phối

- coordination guard run `29986274969`: success;
- Account V2/frontend/Worker run `29986275030`: success;
- production run `29986415052`: success.

PR #30 dùng cùng Task-ID/phạm vi đã được đóng không merge vì:

- trùng với PR #31;
- không mergeable sau khi source mới được tích hợp;
- workflow chuyên biệt của PR #30 còn failure;
- merge tiếp có nguy cơ ghi đè production đã nghiệm thu.

Hiện không còn PR mở.

---

## 5. Runtime và build

Các file chính:

- `tools/apply-role-system.mjs`: lớp tích hợp tài khoản nền;
- `tools/apply-account-v2.mjs`: template Account V2;
- `tools/apply-account-v2-runner.mjs`: runner build dùng trong CI/deploy để sinh runtime an toàn;
- `assets/gate.js`, `assets/gate.css`: gate, staged onboarding và badge trong app;
- `assets/community.js`, `assets/community-admin.js`, `assets/community.css`: giao diện member/Admin theo vai trò;
- `backend/community.js`: account, Reader, review, chat, post, Admin và audit;
- `assets/account-v2.test.mjs`, `backend/account-v2.test.mjs`: contract frontend và integration backend;
- `.github/workflows/validate-role-system.yml`: CI PR;
- `.github/workflows/deploy-pages.yml`: build, test, Pages → Worker và smoke test.

Không chạy trực tiếp template Account V2 trong quy trình chuẩn; workflow dùng `tools/apply-account-v2-runner.mjs`.

---

## 6. Gate, dữ liệu và bảo mật

- Trang Bói toán hiện là plaintext được gate kiểm soát; frontend vẫn hỗ trợ payload mã hóa nếu được đưa trở lại sau này.
- SPARE ưu tiên `DECRYPT_KEY_SPARE`; Bói toán có thể dùng `DECRYPT_KEY_BOITOAN` hoặc fallback `DECRYPT_KEY` khi cần payload mã hóa.
- Mật khẩu member được băm PBKDF2; không lưu plaintext.
- Community session tối đa 30 ngày; chat giữ tối đa 30 ngày.
- Reader vẫn bị cấm chèn đường dẫn vào hồ sơ và thông tin nhận phí.
- Review 1–5 sao; Khách gỡ review của mình, Admin gỡ được, Reader không gỡ được.
- Dữ liệu “thiết bị” là hồ sơ trình duyệt best-effort, không chứng minh chắc chắn một thiết bị vật lý duy nhất.

---

## 7. Những phần giữ nguyên

- Branding `Spirituality Market` và tên PWA.
- Bottom navigation, Cộng đồng và `Luận giải chuyên sâu`.
- Thuật toán Tarot, Lenormand, Bài Tây, Kinh Dịch, Tử Vi và Bát Tự hiện hữu.
- Các hộp `Khung luận…` và `Kết nối toàn trải bài` vẫn đã được gỡ theo `BOITOAN-20260723-04`.
- OpenAI API vẫn không thuộc dependency của app.
- Đóng gói App Store/Google Play chưa hoàn tất.

---

## 8. Trạng thái cuối

- Account V2 source: **đã merge**.
- Cloudflare production: **SUCCESS**.
- PR trùng: **đã đóng không merge**.
- Active task: **không có**.
- Khóa file: **đã giải phóng**.
- Việc cần người dùng kiểm tra: đóng hẳn tab/PWA cũ, mở lại; đăng nhập hoặc tạo một username mới; đăng nhập Admin một lần trên đúng iPhone cần đặt làm Admin tổng; xác nhận Telegram nhận thông báo đăng ký thật.

---

Xem thêm: `AGENTS.md`, `docs/handover/ROLE_SYSTEM.md`, `docs/handover/NHAT-KY-PHOI-HOP.md`, `docs/handover/PRODUCTION_STATUS.md`.
