# Bàn giao hệ thống ba webapp

> **Mọi agent phải đọc `AGENTS.md` trước file này.** Sau đó đọc
> `docs/handover/ACTIVE_TASKS.json` và `docs/handover/NHAT-KY-PHOI-HOP.md` trước khi sửa.

**Cập nhật:** 23/07/2026 05:34 (GMT+7)  
**`main` tại lúc mở task deploy:** `af260cc5c4c0e0013293cc6ce263e2692822d9ad`  
**Task đang làm:** `DEPLOY-20260723-03`  
**Production:** chưa xác nhận; nguồn chuẩn duy nhất là `docs/handover/PRODUCTION_STATUS.md` sau workflow mới.

Source UI/branding/kho luận đã merge qua PR #19 tại `ed63ad7dfd8cf85dd58135095175d40a0a913e42`. Commit `af260cc…` chỉ cập nhật bàn giao rằng production còn chờ, không phải bằng chứng Cloudflare đã deploy.

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

## 4. `BOITOAN-20260723-02` — source hoàn tất

PR #19 merge thành `ed63ad7dfd8cf85dd58135095175d40a0a913e42`.

Source đã có:

- Nút **Cộng đồng** là mục thứ năm trong bottom nav, không còn nút nổi che giao diện.
- Chọn tài khoản bằng hai role card Khách/Reader; responsive ở chiều rộng iPhone, không còn chữ xếp dọc.
- Branding hiển thị đổi thành **Cái Chợ của Hiên Nhi**; bỏ cụm “khu vực riêng tư” khỏi phần hiển thị Bói toán.
- Font dùng system stack đa thiết bị; tiêu đề dùng serif fallback.
- Logo sigil trăng khuyết + sao dựng bằng CSS; watermark lặp dày hơn.
- Thêm khung luận Tarot, Lenormand, Bài Tây, Kinh Dịch, Tử Vi, Bát Tự và phần kết nối toàn trải bài.
- Không giải mã/ghi đè payload; lớp mới được chèn sau giải mã để giữ nguyên các sửa thuật toán khác.
- OpenAI Developers/API key không còn là phụ thuộc của app hoặc kế hoạch deploy.

Kiểm thử trước merge:

- Run `29962090012`: role system, frontend, service worker, Worker — success.
- Run `29962089978`: Task-ID, branch, phạm vi và bàn giao — success.
- `node --check tools/apply-role-system.mjs` đạt.

Task source đã chuyển sang `recently_completed`; xác minh production được tách thành task deploy riêng để không tiếp tục khóa các file ứng dụng.

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

## 7. `DEPLOY-20260723-03` — đang làm

Nhánh: `agent/DEPLOY-20260723-03-production-diagnostics-v2`, tạo từ `af260cc…` để giữ nguyên bàn giao của agent khác.

PR #23 cũ đã đóng không merge vì dùng base cũ và xung đột các file bàn giao. Nhánh v2 chỉ sửa workflow deploy và trạng thái/bàn giao.

Workflow mới trong `.github/workflows/deploy-pages.yml`:

1. gắn ID/outcome cho preflight, tích hợp runtime, test source, test Worker, build, Pages, Worker và smoke test;
2. deploy Pages trước, Worker sau;
3. hậu kiểm:
   - `/boitoan/community.html` HTTP 200;
   - branding `Cái Chợ của Hiên Nhi`;
   - marker `community-role-card`;
   - CSS HTTP 200 và marker `community-role-options`;
   - gate runtime JS HTTP 200 và marker `applyMarketBranding`;
   - API Reader không phiên HTTP 401 với `unauthorized`;
4. ghi `docs/handover/PRODUCTION_STATUS.md` khi **SUCCESS** hoặc **FAILED**;
5. khi FAILED, ghi outcome từng bước, HTTP codes và link GitHub Actions run;
6. giữ concurrency `cloudflare-production` và tránh vòng lặp do commit handover.

Task deploy chỉ hoàn tất khi status file ghi `SUCCESS`. Nếu `FAILED`, status file là nguồn để sửa đúng bước lỗi; không suy đoán.

## 8. PWA và iOS/Android

- Root và Bói toán có manifest/service worker; không cache navigation, payload HTML hoặc API.
- Đóng gói App Store/Google Play chưa hoàn tất; vẫn cần tài khoản developer, privacy disclosure, test thiết bị và submission.
- Sau production cần test trực tiếp trên iPhone: nav 5 mục, role cards ở 375–430 px, mở khóa app, các mục luận và luồng Khách/Reader.
- Không phụ thuộc OpenAI API để đóng gói app.

## 9. Điều phối đa-agent

- Một PR = một Task-ID.
- Không sửa vùng đang bị khóa trong `docs/handover/ACTIVE_TASKS.json`.
- Hiện chỉ vùng workflow deploy và handover/status bị `DEPLOY-20260723-03` khóa; source ứng dụng đã được giải phóng.
- PR #20, #21 và #23 đã đóng không merge để tránh ghi đè hoặc trùng phạm vi.

## 10. Bước tiếp theo

1. Mở PR từ nhánh diagnostics v2.
2. Chạy role-system CI và coordination guard.
3. Merge khi cả hai đạt.
4. Chờ workflow production tạo `PRODUCTION_STATUS.md`.
5. Nếu SUCCESS, đóng task và giải phóng khóa; nếu FAILED, sửa đúng bước được ghi trong file.
6. Queen Linh tải lại app trên iPhone và gửi ảnh mới để xác nhận trực quan.

---

Xem thêm: `AGENTS.md`, `docs/handover/ROLE_SYSTEM.md`, `docs/handover/PHOI-HOP-DA-AGENT.md`, `docs/research/DIVINATION_SOURCES.md`.
