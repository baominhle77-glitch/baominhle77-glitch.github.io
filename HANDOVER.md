# Bàn giao hệ thống ba webapp

> **Mọi agent phải đọc `AGENTS.md` trước file này.** Sau đó đọc `docs/handover/ACTIVE_TASKS.json` và `docs/handover/NHAT-KY-PHOI-HOP.md` trước khi sửa.

**Cập nhật:** 23/07/2026 10:16 (GMT+7)  
**`main` hiện tại:** `e71bf5539c8ef796baf5f36d1f6c328ad5d547f5`  
**Task đang làm:** `BOITOAN-20260723-04` — gỡ các khung luận AI bổ sung.  
**Production đã xác nhận:** `SUCCESS` cho commit `5e4e139b2bc09d14dd73fc6990adb428a8d2b40f`.

## Nguyên tắc độ tin cậy bắt buộc

- **Tuyệt đối không bịa.**
- Mọi khẳng định về source, production, thuật toán hoặc nội dung chuyên môn phải có căn cứ từ source, log, test hoặc tài liệu đã kiểm chứng.
- Khi chưa đủ dữ liệu, ghi rõ **chưa xác lập/chưa đủ chứng cứ**; không tự tạo nội dung chung chung để làm giao diện có vẻ “đầy đủ”.
- Phải phân biệt rõ: dữ kiện đã kiểm tra, suy luận kỹ thuật và phần chưa xác minh.

---

## 1. Webapp và production

| App | Nguồn | Production |
|---|---|---|
| Bói toán / Cái Chợ của Hiên Nhi | `boitoan/`, `assets/`, `backend/` | `https://hiennhi89.pages.dev/boitoan/` |
| SPARE | root | `https://hiennhi89.pages.dev/` |
| MEDORA | `medora/` | `https://hiennhi89.pages.dev/medora/` |

Repository `baominhle77-glitch.github.io` là nguồn chuẩn duy nhất.

### Bằng chứng production gần nhất

`docs/handover/PRODUCTION_STATUS.md` ghi:

- Pages `200`;
- URL cuối sau Clean URL redirect: `https://hiennhi89.pages.dev/boitoan/community?...`;
- Community CSS `200`;
- Gate runtime JS `200`;
- Worker API không phiên `401 unauthorized`, đúng kỳ vọng;
- branding và role-card markers đều tồn tại.

Workflow run: `29976466953`.

---

## 2. Xác nhận giao diện từ người dùng

Ngày 23/07/2026, BaoMinh kiểm tra trực tiếp trên điện thoại và xác nhận:

- giao diện mobile hiện tại **đạt yêu cầu**;
- vị trí nút Cộng đồng, role cards, branding và bố cục không cần thiết kế lại;
- cần gỡ các phần “Khung luận…” vì quá máy móc, phiến diện và không tạo giá trị thực tế.

Đây là bằng chứng nghiệm thu trực tiếp của người dùng đối với giao diện, không phải suy đoán từ screenshot hay CI.

---

## 3. Task `BOITOAN-20260723-04` — đang làm

Nhánh: `agent/BOITOAN-20260723-04-remove-ai-guides-v2`  
Base: `e71bf5539c8ef796baf5f36d1f6c328ad5d547f5`

### Phạm vi gỡ

Xóa khỏi lớp tích hợp runtime:

- `Khung luận Tarot`;
- `Khung luận Lenormand`;
- `Khung luận Bài Tây`;
- `Khung luận Kinh Dịch`;
- `Khung luận Tử Vi`;
- `Khung luận Bát Tự`;
- `Kết nối toàn trải bài`;
- các hàm/call/CSS chỉ phục vụ các hộp trên.

### Phạm vi giữ nguyên

- giao diện mobile đã được người dùng xác nhận đạt;
- branding, logo, watermark;
- bottom nav 5 mục và nút Cộng đồng;
- role cards Khách/Reader;
- nút và luồng `Luận giải chuyên sâu` có sẵn trong app;
- thuật toán Tarot/Lenormand/Bài Tây/Kinh Dịch/Tử Vi/Bát Tự hiện hữu;
- payload mã hóa;
- tài khoản, chat, review, báo phí/thanh toán;
- Worker và cơ chế bảo vệ Admin.

### Diff đã kiểm tra

- `tools/apply-role-system.mjs`: xóa 149 dòng, không thêm nội dung thay thế.
- Không còn marker/hàm: `marketGuide`, `addMarketGuides`, `renderMarketSynthesis`, `watchMarketResult`, `.market-guide`, `.market-dynamic-analysis`.
- Vẫn còn marker bắt buộc: `injectCommunity`, `applyMarketBranding`, `market-brand-title`.
- Một tham chiếu hàm còn sót đã được phát hiện ở nhánh thử nghiệm và sửa trước khi tạo nhánh v2; nhánh thử nghiệm không được coi là bản đạt.

**Lưu ý trạng thái:** production tại commit `e71bf55…` vẫn còn các khung luận cho đến khi PR của task này merge và workflow deploy tiếp theo ghi `SUCCESS`.

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
- Chat Reader–Khách polling khoảng 1,5 giây, giữ tối đa 30 ngày, có báo phí và trạng thái thanh toán.
- Chat cộng đồng không sao chép sang Telegram.
- Admin chỉ đọc chat khi có `ADMIN_TOKEN` và đúng owner-device ID đã khóa.

Các file chính: `backend/community.js`, `assets/community*.js/css`, `boitoan/community*.html`, `tools/apply-role-system.mjs`.

---

## 6. Nguồn Drive/Canva

Bản đồ nguồn nằm tại `docs/research/DIVINATION_SOURCES.md`.

- Tarot, Lenormand, cartomancy/Bài Tây và Tử Vi đã có tài liệu tham khảo được liệt kê.
- Canva có `Giáo trình tarot hình ảnh`, 63 trang.
- Kinh Dịch: chưa xác định được giáo trình chuyên biệt đủ rõ.
- Danh sách nguồn **không tự động chứng minh** mọi câu luận là đúng; muốn đưa nội dung vào app phải có quy tắc cụ thể, nguồn đối chiếu và test riêng.
- Không sao chép nguyên văn tài liệu có bản quyền vào source.

---

## 7. OpenAI Developers

- Đã loại khỏi kế hoạch theo yêu cầu người dùng.
- Repository không cần OpenAI API key cho app hoặc quy trình deploy hiện tại.
- Không thêm dependency OpenAI cho task này.

---

## 8. PWA và thiết bị

- Root và Bói toán có manifest/service worker; không cache navigation, payload HTML hoặc API.
- Đóng gói App Store/Google Play chưa hoàn tất.
- Sau khi gỡ khung luận và deploy, cần tải lại trên iPhone để xác nhận các hộp đã biến mất nhưng bố cục đạt vẫn giữ nguyên.

---

## 9. Điều phối đa-agent

- Một PR = một Task-ID.
- Không sửa vùng đang bị khóa trong `docs/handover/ACTIVE_TASKS.json`.
- Task `BOITOAN-20260723-04` đang khóa `tools/apply-role-system.mjs` và ba file bàn giao chung.
- `PRODUCTION_STATUS.md` là nguồn chuẩn về deploy; không suy đoán từ trạng thái merge.

---

## 10. Bước tiếp theo

1. Mở PR từ nhánh `agent/BOITOAN-20260723-04-remove-ai-guides-v2`.
2. Chạy role-system CI và coordination guard.
3. Chỉ merge khi cả hai đạt.
4. Chờ workflow production ghi `SUCCESS` cho commit mới.
5. Kiểm tra source production không còn các marker khung luận.
6. BaoMinh tải lại app trên iPhone để xác nhận trực quan.

---

Xem thêm: `AGENTS.md`, `docs/handover/ROLE_SYSTEM.md`, `docs/handover/PHOI-HOP-DA-AGENT.md`, `docs/handover/NHAT-KY-PHOI-HOP.md`, `docs/handover/PRODUCTION_STATUS.md`.
