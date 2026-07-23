# Bàn giao hệ thống ba webapp

> **Mọi agent phải đọc `AGENTS.md` trước file này.** Sau đó đọc `docs/handover/ACTIVE_TASKS.json` và `docs/handover/NHAT-KY-PHOI-HOP.md` trước khi sửa.

**Cập nhật:** 23/07/2026 12:22 (GMT+7)  
**Source ứng dụng đã deploy:** `d48ef93137c35e38ee64004dfb0cdaee9c04fd83`  
**Commit ghi trạng thái production:** `dd008ff5edaeac0f33144b88fb0a07f24d8064c4`  
**Task đang hoạt động:** không có.  
**Production:** `SUCCESS`.

## Nguyên tắc độ tin cậy bắt buộc

- **Tuyệt đối không bịa.**
- Mọi khẳng định về source, production, thuật toán hoặc nội dung chuyên môn phải có căn cứ từ source, log, test hoặc tài liệu đã kiểm chứng.
- Khi chưa đủ dữ liệu, ghi rõ **chưa xác lập/chưa đủ chứng cứ**; không tự tạo nội dung chung chung để làm giao diện có vẻ đầy đủ.
- Phân biệt rõ dữ kiện đã kiểm tra, suy luận kỹ thuật và phần chưa xác minh.

---

## 1. Webapp và production

| App | Nguồn | Production |
|---|---|---|
| Bói toán / Spirituality Market | `boitoan/`, `assets/`, `backend/` | `https://hiennhi89.pages.dev/boitoan/` |
| SPARE | root | `https://hiennhi89.pages.dev/` |
| MEDORA | `medora/` | `https://hiennhi89.pages.dev/medora/` |

Repository `baominhle77-glitch.github.io` là nguồn chuẩn duy nhất.

### Bằng chứng production gần nhất

`docs/handover/PRODUCTION_STATUS.md` ghi cho source commit `d48ef931…`:

- Cloudflare Pages `200`;
- Community CSS `200`;
- Gate runtime JS `200`;
- Worker API không phiên `401 unauthorized`, đúng kỳ vọng;
- onboarding công khai `400 invalid_account` với dữ liệu kiểm thử không hợp lệ;
- branding `Spirituality Market` tồn tại;
- marker `community-role-card`, `community-role-options`, `buildBoitoanEntryUI` tồn tại;
- workflow run `29981841325` hoàn tất thành công.

---

## 2. Trạng thái giao diện và branding

Ngày 23/07/2026, BaoMinh kiểm tra trên điện thoại và xác nhận giao diện mobile đạt yêu cầu. Sau đó:

- branding và watermark `Cái Chợ của Hiên Nhi` đã được đổi thành `Spirituality Market`;
- tên PWA Bói toán đã đổi thành `Spirituality Market`;
- cách gọi quyền quản trị được chuẩn hóa thành `Admin`;
- thuật ngữ nghiệp vụ ngân hàng `Tên chủ tài khoản` được giữ nguyên;
- bottom nav 5 mục, nút Cộng đồng, logo/sigil và bố cục mobile được giữ nguyên.

---

## 3. `BOITOAN-20260723-05` — onboarding tài khoản hoàn tất

PR #28 merge thành `d48ef93137c35e38ee64004dfb0cdaee9c04fd83`.

### Cửa sổ đầu ứng dụng

Bói toán ở chế độ approval hiện có ba luồng ngay trên cửa sổ đầu:

1. `Đăng nhập` — dành cho tài khoản Khách hoặc Reader đã có;
2. `Tạo tài khoản` — phải chọn `Khách` hoặc `Reader / Người xem bói`;
3. `Admin` — dùng mật khẩu mã hóa hiện hành để mở app.

Khi đăng ký hoặc đăng nhập thành viên thành công, Worker cấp đồng thời:

- gate JWT để mở app;
- community JWT để dùng hồ sơ, Reader, chat, review và thanh toán;
- khóa giải mã Bói toán từ binding `DECRYPT_KEY_BOITOAN` hoặc fallback `DECRYPT_KEY`.

Thành viên mới vào app ngay, không chờ Admin duyệt Telegram.

### Thông báo Telegram khi đăng ký mới

Thông báo best-effort gửi cho Admin gồm:

- vai trò;
- tên hiển thị;
- tên đăng nhập;
- mã hồ sơ trình duyệt;
- browser và platform;
- kích thước màn hình;
- ngôn ngữ và múi giờ;
- quốc gia;
- IP đã rút gọn `/24` hoặc `/64`;
- thời điểm đăng ký.

Không gửi mật khẩu, thông tin ngân hàng hoặc QR. Cửa sổ đăng ký công bố rõ dữ liệu thiết bị được gửi trước khi người dùng bấm tạo tài khoản.

### An toàn và chống lạm dụng

- Public onboarding chỉ áp dụng cho app `boitoan`.
- `device_id` phải là UUID hợp lệ.
- Username/password/role/profile vẫn dùng validator hiện hữu.
- Endpoint onboarding dùng Cloudflare rate limiter khi binding khả dụng.
- Hồ sơ Reader vẫn cấm đường dẫn trong nội dung công khai và thông tin nhận phí.
- Telegram lỗi không làm mất tài khoản hoặc chặn thành viên vào app; phản hồi trả rõ `telegram_notified`.

### Bằng chứng CI

- coordination guard run `29981811502`: success;
- role system/frontend/Worker run `29981811526`: success;
- production run `29981841325`: success.

---

## 4. `BOITOAN-20260723-04` — gỡ khung luận AI hoàn tất

PR #26 merge thành `3322b7c899aeeee3d2e98e26e4cbc97931390a77`.

Đã gỡ hoàn toàn:

- `Khung luận Tarot`;
- `Khung luận Lenormand`;
- `Khung luận Bài Tây`;
- `Khung luận Kinh Dịch`;
- `Khung luận Tử Vi`;
- `Khung luận Bát Tự`;
- `Kết nối toàn trải bài`;
- các hàm/call/CSS phục vụ riêng các hộp trên.

Đã giữ nguyên thuật toán Tarot/Lenormand/Bài Tây/Kinh Dịch/Tử Vi/Bát Tự, payload mã hóa, `Luận giải chuyên sâu`, tài khoản, chat, review và thanh toán.

---

## 5. Gate, mã hóa và quyền truy cập

- Nội dung app nằm trong payload AES-256-GCM; không chỉnh ciphertext bằng tay.
- Dùng `tools/decrypt.mjs`, `tools/encrypt.mjs`, `tools/set-password.mjs`; không commit `*.src.html`.
- SPARE ưu tiên `DECRYPT_KEY_SPARE`; Bói toán ưu tiên `DECRYPT_KEY_BOITOAN`, nếu thiếu dùng `DECRYPT_KEY` chung.
- Worker production: `hiennhi89-gate.hiennhi89.workers.dev`.
- Không ghi mật khẩu, token, khóa, QR, chat hoặc secret vào repository.

---

## 6. Khách / Reader / Admin

- Khách và Reader đăng ký/đăng nhập ngay tại cửa sổ đầu của Bói toán.
- Reader có hồ sơ, chuyên môn, thông tin nhận phí và QR; backend từ chối link trong hồ sơ/thanh toán.
- Review 1–5 sao; Khách gỡ review của mình, Admin gỡ được, Reader không gỡ được.
- Chat Reader–Khách giữ tối đa 30 ngày, có báo phí và trạng thái thanh toán.
- Chat cộng đồng không sao chép sang Telegram.
- Admin chỉ đọc chat khi có `ADMIN_TOKEN` và đúng owner-device ID đã khóa.

Các file chính: `backend/community.js`, `assets/community*.js/css`, `assets/gate.*`, `boitoan/community*.html`, `tools/apply-role-system.mjs`.

---

## 7. Nguồn Drive/Canva

Bản đồ nguồn nằm tại `docs/research/DIVINATION_SOURCES.md`.

- Tarot, Lenormand, cartomancy/Bài Tây và Tử Vi đã có danh sách tài liệu tham khảo.
- Canva có `Giáo trình tarot hình ảnh`, 63 trang.
- Kinh Dịch: chưa xác định được giáo trình chuyên biệt đủ rõ.
- Danh sách nguồn không tự động chứng minh mọi câu luận là đúng; nội dung mới chỉ được đưa vào app khi có quy tắc cụ thể, nguồn đối chiếu và test riêng.
- Không sao chép nguyên văn tài liệu có bản quyền vào source.

---

## 8. OpenAI Developers

- Đã loại khỏi kế hoạch theo yêu cầu người dùng.
- App và quy trình deploy hiện tại không cần OpenAI API key.
- Không thêm dependency OpenAI cho phần này.

---

## 9. PWA và thiết bị

- Root và Bói toán có manifest/service worker; không cache navigation, payload HTML hoặc API.
- PWA Bói toán hiển thị tên `Spirituality Market`.
- Đóng gói App Store/Google Play chưa hoàn tất.
- Dữ liệu “thiết bị” trong hệ thống là hồ sơ trình duyệt best-effort, không khẳng định là định danh thiết bị vật lý duy nhất.

---

## 10. Điều phối đa-agent và trạng thái cuối

- Một PR = một Task-ID.
- `docs/handover/ACTIVE_TASKS.json` hiện không có task đang hoạt động.
- `PRODUCTION_STATUS.md` là nguồn chuẩn về deploy; không suy đoán từ trạng thái merge.
- Production: **SUCCESS**.
- Khóa file: **đã giải phóng**.
- Việc còn lại: kiểm tra trực quan onboarding và thực hiện một đăng ký thật trên điện thoại để xác nhận Telegram nhận đúng thông báo thực tế; chưa coi lần gửi Telegram thực tế đã được nghiệm thu cho đến khi có đăng ký thật.

---

Xem thêm: `AGENTS.md`, `docs/handover/ROLE_SYSTEM.md`, `docs/handover/PHOI-HOP-DA-AGENT.md`, `docs/handover/NHAT-KY-PHOI-HOP.md`, `docs/handover/PRODUCTION_STATUS.md`.
