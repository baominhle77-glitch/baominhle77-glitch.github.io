# Bàn giao hệ thống ba webapp

> **Mọi agent phải đọc `AGENTS.md` trước file này.** Sau đó đọc `docs/handover/ACTIVE_TASKS.json` và `docs/handover/NHAT-KY-PHOI-HOP.md` trước khi sửa.

**Cập nhật:** 23/07/2026 10:33 (GMT+7)  
**Source ứng dụng đã deploy:** `3322b7c899aeeee3d2e98e26e4cbc97931390a77`  
**Commit ghi trạng thái production:** `43950f904b1801be9448e0a70c04c5fde552d4f1`  
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
| Bói toán / Cái Chợ của Hiên Nhi | `boitoan/`, `assets/`, `backend/` | `https://hiennhi89.pages.dev/boitoan/` |
| SPARE | root | `https://hiennhi89.pages.dev/` |
| MEDORA | `medora/` | `https://hiennhi89.pages.dev/medora/` |

Repository `baominhle77-glitch.github.io` là nguồn chuẩn duy nhất.

### Bằng chứng production gần nhất

`docs/handover/PRODUCTION_STATUS.md` ghi cho source commit `3322b7c…`:

- Cloudflare Pages `200`;
- Community CSS `200`;
- Gate runtime JS `200`;
- Worker API không phiên `401 unauthorized`, đúng kỳ vọng;
- branding `Cái Chợ của Hiên Nhi` tồn tại;
- role-card markers tồn tại;
- workflow run `29976968849` hoàn tất thành công.

---

## 2. Xác nhận trực tiếp từ người dùng

Ngày 23/07/2026, BaoMinh kiểm tra trên điện thoại và xác nhận:

- giao diện mobile hiện tại **đạt yêu cầu**;
- vị trí nút Cộng đồng, role cards, branding và bố cục không cần thiết kế lại;
- các phần “Khung luận…” quá máy móc, phiến diện và không hữu ích nên phải gỡ.

Đây là nghiệm thu trực tiếp của người dùng đối với giao diện, không phải suy đoán từ screenshot hoặc CI.

---

## 3. `BOITOAN-20260723-04` — hoàn tất

PR #26 merge thành `3322b7c899aeeee3d2e98e26e4cbc97931390a77`.

### Đã gỡ hoàn toàn

- `Khung luận Tarot`;
- `Khung luận Lenormand`;
- `Khung luận Bài Tây`;
- `Khung luận Kinh Dịch`;
- `Khung luận Tử Vi`;
- `Khung luận Bát Tự`;
- `Kết nối toàn trải bài`;
- các hàm/call/CSS phục vụ riêng các hộp trên.

### Đã giữ nguyên

- giao diện mobile đã được người dùng xác nhận đạt;
- branding, logo và watermark;
- bottom nav 5 mục và nút Cộng đồng;
- role cards Khách/Reader;
- nút và luồng `Luận giải chuyên sâu` có sẵn;
- thuật toán Tarot/Lenormand/Bài Tây/Kinh Dịch/Tử Vi/Bát Tự hiện hữu;
- payload mã hóa;
- tài khoản, chat, review, báo phí/thanh toán;
- Worker và cơ chế bảo vệ Admin.

### Bằng chứng source và CI

- `tools/apply-role-system.mjs`: xóa 149 dòng, không thêm nội dung luận thay thế.
- Source `main` không còn `marketGuide`, `addMarketGuides`, `renderMarketSynthesis`, `watchMarketResult`, `.market-guide`, `.market-dynamic-analysis` hoặc các chuỗi khung luận.
- Source vẫn còn `injectCommunity`, `applyMarketBranding`, `market-brand-title`.
- CI trước merge:
  - run `29976927421` — coordination guard: success;
  - run `29976927419` — role system/frontend/Worker: success.
- Production run `29976968849`: success.

---

## 4. Gate, mã hóa và quyền truy cập

- Nội dung app nằm trong payload AES-256-GCM; không chỉnh ciphertext bằng tay.
- Dùng `tools/decrypt.mjs`, `tools/encrypt.mjs`, `tools/set-password.mjs`; không commit `*.src.html`.
- SPARE ưu tiên `DECRYPT_KEY_SPARE`; Bói toán/MEDORA dùng `DECRYPT_KEY` khi chưa có binding riêng.
- Worker production: `hiennhi89-gate.hiennhi89.workers.dev`.
- Không ghi mật khẩu, token, QR, chat hoặc secret vào repository.

---

## 5. Khách / Reader / Admin

- Khách và Reader đăng ký/đăng nhập sau gate.
- Reader có hồ sơ, chuyên môn, thông tin nhận phí và QR; backend từ chối link trong hồ sơ/thanh toán.
- Review 1–5 sao; Khách gỡ review của mình, Admin gỡ được, Reader không gỡ được.
- Chat Reader–Khách giữ tối đa 30 ngày, có báo phí và trạng thái thanh toán.
- Chat cộng đồng không sao chép sang Telegram.
- Admin chỉ đọc chat khi có `ADMIN_TOKEN` và đúng owner-device ID đã khóa.

Các file chính: `backend/community.js`, `assets/community*.js/css`, `boitoan/community*.html`, `tools/apply-role-system.mjs`.

---

## 6. Nguồn Drive/Canva

Bản đồ nguồn nằm tại `docs/research/DIVINATION_SOURCES.md`.

- Tarot, Lenormand, cartomancy/Bài Tây và Tử Vi đã có danh sách tài liệu tham khảo.
- Canva có `Giáo trình tarot hình ảnh`, 63 trang.
- Kinh Dịch: chưa xác định được giáo trình chuyên biệt đủ rõ.
- Danh sách nguồn không tự động chứng minh mọi câu luận là đúng; nội dung mới chỉ được đưa vào app khi có quy tắc cụ thể, nguồn đối chiếu và test riêng.
- Không sao chép nguyên văn tài liệu có bản quyền vào source.

---

## 7. OpenAI Developers

- Đã loại khỏi kế hoạch theo yêu cầu người dùng.
- App và quy trình deploy hiện tại không cần OpenAI API key.
- Không thêm dependency OpenAI cho phần này.

---

## 8. PWA và thiết bị

- Root và Bói toán có manifest/service worker; không cache navigation, payload HTML hoặc API.
- Đóng gói App Store/Google Play chưa hoàn tất.
- Sau lần deploy này, BaoMinh chỉ cần đóng hẳn app/tab rồi mở lại hoặc tải lại trang để kiểm tra trực quan rằng các hộp khung luận đã biến mất.

---

## 9. Điều phối đa-agent

- Một PR = một Task-ID.
- `docs/handover/ACTIVE_TASKS.json` hiện không có task đang hoạt động.
- `PRODUCTION_STATUS.md` là nguồn chuẩn về deploy; không suy đoán từ trạng thái merge.

---

## 10. Trạng thái cuối

- Giao diện mobile: người dùng xác nhận **đạt**.
- Khung luận AI bổ sung: **đã gỡ khỏi source và production**.
- Production: **SUCCESS**.
- Khóa file: **đã giải phóng**.
- Việc còn lại: chỉ kiểm tra trực quan sau khi tải lại trên điện thoại; không còn công việc kỹ thuật bắt buộc cho yêu cầu này.

---

Xem thêm: `AGENTS.md`, `docs/handover/ROLE_SYSTEM.md`, `docs/handover/PHOI-HOP-DA-AGENT.md`, `docs/handover/NHAT-KY-PHOI-HOP.md`, `docs/handover/PRODUCTION_STATUS.md`.
