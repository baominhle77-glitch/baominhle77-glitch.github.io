# Bàn giao hệ thống ba webapp

> **Mọi agent phải đọc `AGENTS.md` trước file này.** Sau đó đọc
> `docs/handover/ACTIVE_TASKS.json` và `docs/handover/NHAT-KY-PHOI-HOP.md` trước khi sửa.

**Cập nhật:** 23/07/2026 05:26 (GMT+7)  
**`main` hiện tại:** `ed63ad7dfd8cf85dd58135095175d40a0a913e42`  
**Task đang làm:** `DEPLOY-20260723-03`  
**Production:** chưa xác nhận cho commit `ed63ad7`; chỉ chốt theo `docs/handover/PRODUCTION_STATUS.md`.

Source sửa mobile, branding “Cái Chợ của Hiên Nhi” và kho luận đã merge qua PR #19. Sau hơn 5 phút chưa có status commit từ workflow cũ, nên phần deploy được tách sang task chẩn đoán riêng; không tuyên bố production đã cập nhật.

---

## 1. Ứng dụng và nguồn chuẩn

Repository `baominhle77-glitch/baominhle77-glitch.github.io` là nguồn chuẩn duy nhất.

| App | Nguồn | Production |
|---|---|---|
| Bói toán / Cái Chợ của Hiên Nhi | `boitoan/`, `assets/`, `backend/` | `https://hiennhi89.pages.dev/boitoan/` |
| SPARE | root | `https://hiennhi89.pages.dev/` |
| MEDORA | `medora/` | `https://hiennhi89.pages.dev/medora/` |

## 2. Gate, mã hóa và backend

- Nội dung ba app nằm trong payload AES-256-GCM; không chỉnh ciphertext bằng tay.
- Công cụ hợp lệ: `tools/decrypt.mjs`, `tools/encrypt.mjs`, `tools/set-password.mjs`.
- File `*.src.html` không commit.
- SPARE ưu tiên `DECRYPT_KEY_SPARE`; Bói toán/MEDORA dùng `DECRYPT_KEY` nếu chưa có binding riêng.
- Worker source: `backend/worker.js`; production: `hiennhi89-gate.hiennhi89.workers.dev`.
- Session approval và dữ liệu chat cộng đồng vận hành theo backend hiện hành; chat cộng đồng giữ tối đa 30 ngày.

## 3. Hệ thống Khách / Reader / Admin

- Khách và Reader đăng ký/đăng nhập sau gate.
- Reader có hồ sơ, chuyên môn, thông tin nhận phí và QR; backend từ chối link trong hồ sơ/thanh toán.
- Review 1–5 sao; Khách gỡ review của mình, Admin gỡ được, Reader không gỡ được.
- Chat Reader–Khách polling khoảng 1,5 giây, có báo phí và trạng thái thanh toán.
- Chat cộng đồng không sao chép sang Telegram.
- Admin đọc chat chỉ khi có `ADMIN_TOKEN` và đúng owner-device ID đã khóa.

File chính: `backend/community.js`, `assets/community*`, `boitoan/community*.html`, `tools/apply-role-system.mjs`, `docs/handover/ROLE_SYSTEM.md`.

## 4. `BOITOAN-20260723-02` — source đã hoàn tất

PR #19 merge thành `ed63ad7dfd8cf85dd58135095175d40a0a913e42`.

Đã có trong source:

- Nút Cộng đồng là mục thứ năm trong bottom nav, không còn nút nổi che app.
- Chọn Khách/Reader bằng hai thẻ rõ ràng, không xếp chữ dọc trên mobile.
- Branding hiển thị đổi thành “Cái Chợ của Hiên Nhi”.
- Bỏ chuỗi hiển thị “khu vực riêng tư” trong branding/footer/watermark Bói toán.
- Font dùng system sans-serif và serif fallback tương thích iOS/Android/Windows/macOS.
- Logo sigil trăng khuyết + sao bằng CSS; watermark lặp nhiều vị trí.
- Khung luận chuyên sâu Tarot, Lenormand, Bài Tây, Kinh Dịch, Tử Vi, Bát Tự.
- Kết nối toàn trải bài Tarot/Lenormand/Bài Tây thay vì để từng lá đứng rời.
- Bản đồ nguồn Drive/Canva tại `docs/research/DIVINATION_SOURCES.md`.
- Không dùng OpenAI API; không chờ API key.

Kiểm thử PR cuối:

- Run `29962272374`: role system/frontend/SW/Worker — success.
- Run `29962272408`: coordination guard — success.

Cách tích hợp: lớp mới được chèn sau giải mã bằng `tools/apply-role-system.mjs`, không ghi đè payload và không làm mất sửa Tử Vi/Bát Tự của agent khác.

## 5. Nguồn Drive/Canva đã rà

- Tarot: giáo trình của chủ, `78 Độ Minh Triết`, lịch sử/trường phái, Mary K. Greer, Liz Dean, Court Cards.
- Lenormand: Rana George, Caitlín Matthews, Marcus Katz/Tali Goodwin, Andy Boroveshengra và tài liệu dịch/giáo trình trong Drive.
- Bài Tây/cartomancy: tài liệu đối chiếu Tarot–Lenormand–cartomancy và giáo trình Gypsy.
- Tử Vi: tài liệu lập và giải Tử Vi trong Drive.
- Canva: `Giáo trình tarot hình ảnh`, 63 trang.
- Chưa có giáo trình Kinh Dịch chuyên biệt đủ rõ trong lượt rà; chưa thay thuật toán quẻ.

## 6. OpenAI Developers

- Người dùng yêu cầu bỏ vì không lấy được API key.
- Plugin trả `not_installed`; repository không có cấu hình OPENAI được tìm thấy.
- App, deploy và đóng gói iOS không phụ thuộc OpenAI API.

## 7. `DEPLOY-20260723-03` — đang làm

Lý do: workflow cũ không tạo `PRODUCTION_STATUS.md` sau merge `ed63ad7`, trong khi connector hiện không liệt kê push-run và môi trường thực thi không tự xác minh được DNS production.

Nhánh `agent/DEPLOY-20260723-03-production-diagnostics` sửa `.github/workflows/deploy-pages.yml` để:

1. gắn ID/outcome cho preflight, tích hợp, test, build, Pages, Worker và smoke test;
2. hậu kiểm HTTP + marker của branding, role cards, CSS mobile, gate runtime và API 401;
3. ghi `PRODUCTION_STATUS.md` cho cả `SUCCESS` và `FAILED`;
4. ghi link workflow run, HTTP codes và đúng bước lỗi;
5. giữ Pages trước Worker, concurrency production và không tái kích hoạt bởi commit handover.

Task chỉ hoàn tất khi status file ghi `SUCCESS` cho source commit sau merge task deploy.

## 8. PWA và iOS/Android

- Root và Bói toán có manifest/service worker; không cache navigation, payload HTML hay API.
- Đóng gói App Store/Google Play chưa hoàn tất; cần tài khoản developer, privacy disclosure, test thiết bị và submission.
- Sau production cần test trực tiếp trên iPhone: nav 5 mục, role cards ở 375–430 px, mở khóa app, các mục luận và luồng Khách/Reader.

## 9. Điều phối agent

- Một PR = một Task-ID; đọc task lock trước khi sửa.
- Vùng `.github/workflows/deploy-pages.yml` và handover đang bị `DEPLOY-20260723-03` khóa.
- Không ghi secret/token/mật khẩu/QR/dữ liệu chat vào repo.

## 10. Việc tiếp theo

1. Mở PR task deploy diagnostics.
2. Chạy CI PR; sửa mọi lỗi YAML/coordination.
3. Merge và chờ workflow production ghi status.
4. Nếu `FAILED`, mở run link trong status và sửa đúng bước; nếu `SUCCESS`, đóng task và giải phóng khóa.
5. Queen Linh tải lại app trên iPhone để xác nhận trực quan các thay đổi mobile.

---

Xem thêm: `AGENTS.md`, `docs/ARCHITECTURE.md`, `docs/handover/ROLE_SYSTEM.md`, `docs/handover/PHOI-HOP-DA-AGENT.md`, `docs/research/DIVINATION_SOURCES.md`.
