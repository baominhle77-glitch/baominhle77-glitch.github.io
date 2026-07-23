# Bàn giao hệ thống ba webapp

> **Mọi agent phải đọc `AGENTS.md` trước file này.** Sau đó đọc `docs/handover/ACTIVE_TASKS.json` và `docs/handover/NHAT-KY-PHOI-HOP.md` trước khi sửa.

**Cập nhật:** 23/07/2026 14:34 (GMT+7)  
**Source ứng dụng đã deploy:** `9a6b53cc7e99d78ab53410df4d3d531aeef31caa`  
**Commit ghi trạng thái production:** `67878700192da449d2df2613a7402f3e68a829c8`  
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

`docs/handover/PRODUCTION_STATUS.md` ghi cho source commit `9a6b53cc…`:

- Cloudflare Pages `200`;
- trang Admin `200`;
- Community CSS `200`;
- Gate runtime JS `200`;
- Worker API Reader không phiên `401 unauthorized`, đúng kỳ vọng;
- API thảo luận không phiên `401 unauthorized`, đúng kỳ vọng;
- onboarding công khai `400 invalid_account` với dữ liệu kiểm thử không hợp lệ;
- workflow production `29988531212` hoàn tất thành công;
- thứ tự deploy: Pages trước, Worker sau.

---

## 2. `BOITOAN-20260723-07` — Admin tổng xem Trang cá nhân member

PR #33 merge thành `9a6b53cc7e99d78ab53410df4d3d531aeef31caa`.

### Lỗi đã xác định

Bản Account V2 trước có nút `Xem giao diện` trong danh sách tài khoản Admin, nhưng luồng chỉ:

1. tạo token `impersonation`;
2. chuyển đến `community.html?admin_view=1`;
3. chạy `loadDashboard()` mặc định.

`loadDashboard()` không đọc `admin_view=1`, nên:

- Khách mở vào danh sách Reader;
- Reader mở vào khu hội thoại;
- không có lệnh gọi `renderProfile()`.

Vì vậy quyền impersonation đã tồn tại nhưng yêu cầu **mở Trang cá nhân của member** chưa được thực hiện đầy đủ.

### Luồng đã triển khai

- Nút Admin đổi thành **`Xem trang cá nhân`**.
- URL dùng `admin_view=profile`.
- Khi token có `mode=impersonation` và query là `profile`, app gọi thẳng `renderProfile()`.
- Trang mở đúng hồ sơ của member đã chọn, không rơi vào dashboard mặc định.
- Header hiển thị nút `Quay lại Admin`.
- Trong hồ sơ có nút `← Quay lại khu vực Admin`.
- Các tab khác vẫn tồn tại để Admin tổng xem giao diện còn lại của member.

### Dữ liệu được hiển thị

Với mọi member:

- tên đăng nhập;
- tên hiển thị;
- vai trò;
- giới thiệu bản thân.

Riêng Reader còn hiển thị:

- mảng chuyên sâu;
- ngân hàng;
- số tài khoản;
- tên chủ tài khoản;
- QR hiện tại nếu có.

### Chế độ chỉ đọc

- Tất cả input, textarea và file input bị khóa khi Admin tổng xem.
- Giao diện ghi rõ `Chế độ chỉ đọc`.
- Không có nút lưu thay đổi.
- Backend tiếp tục chặn mọi request ghi từ token `impersonation` bằng `read_only_impersonation`.
- Thao tác mở giao diện member tiếp tục được ghi audit KV.

### Bằng chứng CI

- coordination guard run `29988447066`: success;
- Account V2/frontend/Worker run `29988447104`: success;
- production run `29988531212`: success.

Contract test bắt buộc:

- `admin_view=profile`;
- điều hướng tới `renderProfile()`;
- nhận diện `mode=impersonation`;
- chuỗi `Chế độ chỉ đọc`;
- nút quay lại Admin;
- không còn URL cũ `admin_view=1`.

---

## 3. `BOITOAN-20260723-06` — Account V2

PR #31 merge thành `61c0dc0efbddf3c865c44d001d022d80cf0185d9`.

### Các lỗi đã sửa

- Đăng nhập, đăng ký và Admin không còn hiển thị chồng trong một card dài.
- Màn đầu chỉ có `Đăng nhập`, `Đăng ký`, `Admin`; chọn xong mới mở biểu mẫu riêng.
- Checkbox/radio trên iPhone dùng kích thước native.
- Trang Bói toán plaintext không còn bị ép gọi `decryptPayload()` sau khi backend tạo tài khoản.
- Chỉ giải mã khi DOM thật sự có `application/gate-payload`.

### Giao diện theo vai trò

- Khách mặc định vào danh sách Reader, có trò chuyện, review, thảo luận và trang cá nhân.
- Reader mặc định vào khu khách hàng/hội thoại, có hồ sơ chuyên môn, nhận phí, thảo luận và trang cá nhân.
- Vai trò hiện cạnh tên/avatar: `Khách`, `Reader / Người xem bói`, `Admin`, `Admin tổng`.

### Quyền Admin

Admin có thể:

- xem danh sách member;
- khóa/mở khóa member;
- xóa tài khoản member;
- xóa review công khai;
- tạo, đóng, mở lại hoặc xóa bài thảo luận chung.

### Admin tổng

- Thiết bị Admin tổng được bind động vào Workers KV sau khi đăng nhập Admin hợp lệ trên thiết bị đó hoặc bấm nút đặt thiết bị trong trang quản trị.
- Không hardcode mật khẩu, mã trình duyệt hoặc IP vào source.
- Chỉ owner-device đọc được hội thoại riêng và tạo phiên impersonation.
- Phiên impersonation chỉ đọc và có audit.

---

## 4. Telegram khi đăng ký mới

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

**Chưa nghiệm thu thực tế:** cần một đăng ký thật trên điện thoại để xác nhận Telegram nhận đúng thông báo. CI chỉ xác nhận contract và luồng best-effort.

---

## 5. Runtime và build

Các file chính:

- `tools/apply-role-system.mjs`: lớp tích hợp tài khoản nền;
- `tools/apply-account-v2.mjs`: template Account V2;
- `tools/apply-account-v2-runner.mjs`: runner build dùng trong CI/deploy;
- `tools/apply-account-v2-profile-view.mjs`: lớp mở thẳng Trang cá nhân member cho Admin tổng;
- `assets/gate.js`, `assets/gate.css`: gate, onboarding và badge trong app;
- `assets/community.js`, `assets/community-admin.js`, `assets/community.css`: giao diện member/Admin;
- `backend/community.js`: account, Reader, review, chat, post, Admin và audit;
- `assets/account-v2.test.mjs`, `backend/account-v2.test.mjs`: contract frontend và integration backend;
- `.github/workflows/validate-role-system.yml`: CI PR;
- `.github/workflows/deploy-pages.yml`: build, test, Pages → Worker và smoke test.

Runner production áp dụng lớp profile-view sau khi sinh Account V2. Script profile-view có tính idempotent: chạy lại không làm lỗi hoặc nhân đôi thay đổi.

---

## 6. Gate, dữ liệu và bảo mật

- Trang Bói toán hiện là plaintext được gate kiểm soát; frontend vẫn hỗ trợ payload mã hóa nếu được đưa trở lại.
- SPARE ưu tiên `DECRYPT_KEY_SPARE`; Bói toán có thể dùng `DECRYPT_KEY_BOITOAN` hoặc fallback `DECRYPT_KEY` khi cần.
- Mật khẩu member được băm PBKDF2; không lưu plaintext.
- Community session tối đa 30 ngày; chat giữ tối đa 30 ngày.
- Reader bị cấm chèn đường dẫn vào hồ sơ và thông tin nhận phí.
- Review 1–5 sao; Khách gỡ review của mình, Admin gỡ được, Reader không gỡ được.
- Dữ liệu “thiết bị” là hồ sơ trình duyệt best-effort, không chứng minh chắc chắn một thiết bị vật lý duy nhất.

---

## 7. Những phần giữ nguyên

- Branding `Spirituality Market` và tên PWA.
- Bottom navigation, Cộng đồng và `Luận giải chuyên sâu`.
- Thuật toán Tarot, Lenormand, Bài Tây, Kinh Dịch, Tử Vi và Bát Tự hiện hữu.
- Các hộp `Khung luận…` và `Kết nối toàn trải bài` vẫn đã được gỡ theo `BOITOAN-20260723-04`.
- OpenAI API không thuộc dependency của app.
- Đóng gói App Store/Google Play chưa hoàn tất.

---

## 8. Trạng thái cuối

- Admin xem Trang cá nhân member: **đã merge và deploy**.
- Cloudflare production: **SUCCESS**.
- Active task: **không có**.
- Khóa file: **đã giải phóng**.
- Việc người dùng cần kiểm tra: đóng tab/PWA cũ, mở lại trang Admin, vào `Tài khoản member` và bấm `Xem trang cá nhân`.

---

Xem thêm: `AGENTS.md`, `docs/handover/ROLE_SYSTEM.md`, `docs/handover/NHAT-KY-PHOI-HOP.md`, `docs/handover/PRODUCTION_STATUS.md`.
