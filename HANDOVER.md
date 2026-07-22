# Bàn giao hệ thống ba webapp

> **Mọi agent phải đọc `AGENTS.md` trước file này.** Sau đó đọc
> `docs/handover/ACTIVE_TASKS.json` và `docs/handover/NHAT-KY-PHOI-HOP.md` trước khi sửa.

**Cập nhật:** 23/07/2026 05:26 (GMT+7)  
**`main` hiện tại:** `ed63ad7dfd8cf85dd58135095175d40a0a913e42`  
**Task:** `BOITOAN-20260723-02` — trạng thái `blocked` chỉ vì chưa có bằng chứng deploy/smoke test production.

PR #19 đã merge. Source UI/branding/kho luận đã được kiểm thử trước merge. `docs/handover/PRODUCTION_STATUS.md` chưa tồn tại, vì vậy không được khẳng định Cloudflare production đã cập nhật cho đến khi có hậu kiểm.

---

## 1. Webapp và production

| App | Nguồn | Production |
|---|---|---|
| Bói toán / Cái Chợ của Hiên Nhi | `boitoan/`, `assets/`, `backend/` | `https://hiennhi89.pages.dev/boitoan/` |
| SPARE | root | `https://hiennhi89.pages.dev/` |
| MEDORA | `medora/` | `https://hiennhi89.pages.dev/medora/` |

Repository `baominhle77-glitch.github.io` là nguồn chuẩn duy nhất.

## 2. Gate, mã hóa và quyền truy cập

- Nội dung app nằm trong payload AES-256-GCM; không chỉnh ciphertext bằng tay.
- Dùng `tools/decrypt.mjs`, `tools/encrypt.mjs`, `tools/set-password.mjs`; không commit `*.src.html`.
- SPARE ưu tiên `DECRYPT_KEY_SPARE`; Bói toán/MEDORA dùng `DECRYPT_KEY` khi chưa có binding riêng.
- Worker production: `hiennhi89-gate.hiennhi89.workers.dev`.
- Không ghi mật khẩu, token, QR, chat hoặc secret vào repository.

## 3. Khách / Reader / Admin

- Khách và Reader đăng ký/đăng nhập sau gate.
- Reader có hồ sơ, chuyên môn, thông tin nhận phí và QR; backend từ chối link trong hồ sơ/thanh toán.
- Review 1–5 sao; Khách gỡ review của mình, Admin gỡ được, Reader không gỡ được.
- Chat Reader–Khách polling khoảng 1,5 giây, giữ tối đa 30 ngày, có báo phí và trạng thái thanh toán.
- Chat cộng đồng không sao chép sang Telegram.
- Admin chỉ đọc chat khi có `ADMIN_TOKEN` và đúng owner-device ID đã khóa.

Các file chính: `backend/community.js`, `assets/community*.js/css`, `boitoan/community*.html`, `tools/apply-role-system.mjs`.

## 4. Task `BOITOAN-20260723-02`

### Source đã merge

PR #19 merge thành `ed63ad7dfd8cf85dd58135095175d40a0a913e42` với các thay đổi:

- Nút **Cộng đồng** là mục thứ năm trong bottom nav, không còn nút nổi che giao diện.
- Chọn tài khoản bằng hai role card Khách/Reader; responsive ở chiều rộng iPhone, không còn chữ xếp dọc.
- Branding hiển thị đổi thành **Cái Chợ của Hiên Nhi**; bỏ cụm “khu vực riêng tư” khỏi phần hiển thị Bói toán.
- Font dùng system stack đa thiết bị; tiêu đề dùng serif fallback.
- Logo sigil trăng khuyết + sao dựng bằng CSS; watermark lặp dày hơn.
- Thêm khung luận Tarot, Lenormand, Bài Tây, Kinh Dịch, Tử Vi, Bát Tự và phần kết nối toàn trải bài.
- Không giải mã/ghi đè payload; lớp mới được chèn sau giải mã để giữ nguyên các sửa thuật toán khác.

### Kiểm thử đã đạt

- Run `29962090012`: role system, frontend, service worker, Worker — **success**.
- Run `29962089978`: Task-ID, branch, phạm vi và bàn giao — **success**.
- `node --check tools/apply-role-system.mjs` đạt trước merge.

### Trạng thái còn chờ

- Chưa có `docs/handover/PRODUCTION_STATUS.md`.
- Workspace hiện không có connector Cloudflare trực tiếp; không thể đọc trạng thái Pages/Worker bằng dashboard.
- Chưa smoke test production trên iPhone sau deploy.
- Task được đặt `blocked` để ngăn agent khác sửa chồng các file nhạy cảm trong lúc chờ xác nhận.

## 5. Nguồn Drive/Canva và nâng cấp chuyên môn

Bản đồ nguồn nằm tại `docs/research/DIVINATION_SOURCES.md`:

- Tarot: giáo trình của chủ, `78 Độ Minh Triết`, lịch sử/trường phái, Mary K. Greer, Liz Dean, Court Cards.
- Lenormand: Rana George, Caitlín Matthews, Marcus Katz/Tali Goodwin, Andy Boroveshengra và các bản dịch/giáo trình trong Drive.
- Bài Tây/cartomancy: tài liệu đối chiếu Tarot–Lenormand–cartomancy và giáo trình Gypsy.
- Tử Vi: tài liệu lập và giải Tử Vi trong Drive.
- Canva: `Giáo trình tarot hình ảnh`, 63 trang.
- Kinh Dịch: chưa xác định được giáo trình chuyên biệt đủ rõ; lớp hiện tại chỉ thêm khung luận phổ quát, chưa thay thuật toán quẻ.

Không sao chép nguyên văn tài liệu có bản quyền vào source; chỉ tổng hợp schema, quy tắc và diễn giải mới.

## 6. OpenAI Developers

- Đã loại khỏi kế hoạch theo yêu cầu người dùng.
- Repository không có cấu hình OpenAI API cần thiết cho task này.
- Không yêu cầu API key và không thêm dependency OpenAI.

## 7. Cloudflare và hậu kiểm bắt buộc

Workflow `.github/workflows/deploy-pages.yml` dự kiến chạy từ `main`, build bằng `tools/apply-role-system.mjs`, deploy Pages trước Worker rồi hậu kiểm.

Khi có quyền/connector Cloudflare hoặc workflow status, phải xác nhận:

1. `/boitoan/community.html` trả HTTP 200.
2. API Reader không phiên trả HTTP 401.
3. Bottom nav có 5 mục và Cộng đồng không che nội dung.
4. Role cards không tràn chữ ở 375–430 px.
5. Không còn chuỗi “khu vực riêng tư” ở phần hiển thị Bói toán.
6. Tarot/Lenormand/Bài Tây/Kinh Dịch/Tử Vi/Bát Tự vẫn hoạt động sau mở khóa.
7. Ghi commit, thời gian và kết quả vào `docs/handover/PRODUCTION_STATUS.md`.

## 8. PWA và iOS/Android

- Root và Bói toán có manifest/service worker; không cache navigation, payload HTML hoặc API.
- Đóng gói App Store/Google Play chưa hoàn tất; vẫn cần tài khoản developer, privacy disclosure, test thiết bị và submission.
- Không phụ thuộc OpenAI API để đóng gói app.

## 9. Điều phối đa-agent

- Một PR = một Task-ID.
- Không sửa vùng đang bị khóa trong `docs/handover/ACTIVE_TASKS.json`.
- `tools/apply-role-system.mjs` là điểm build nhạy cảm.
- PR #20 và #21 đã đóng không merge vì trùng phạm vi và kém đầy đủ hơn source của PR #19.

## 10. Bước tiếp theo

1. Xác nhận deploy Cloudflare của commit `ed63ad7…`.
2. Smoke test trên iPhone bằng ảnh/chụp màn hình mới.
3. Nếu đạt, tạo `PRODUCTION_STATUS.md`, chuyển task sang `completed` và giải phóng paths.
4. Sau đó mới mở task nội dung chuyên sâu riêng cho từng hệ bói toán.

---

Xem thêm: `AGENTS.md`, `docs/handover/ROLE_SYSTEM.md`, `docs/handover/PHOI-HOP-DA-AGENT.md`, `docs/research/DIVINATION_SOURCES.md`.
