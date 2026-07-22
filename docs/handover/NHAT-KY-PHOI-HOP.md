# 🤝 NHẬT KÝ PHỐI HỢP GIỮA CÁC CÔNG CỤ AI

> File này để các AI/công cụ khác nhau cùng làm trên repository đọc và nắm được ai đã làm gì, phạm vi nào đang giữ, đã kiểm thử ra sao và việc nào còn chờ.

**Thương hiệu hiển thị:** Cái Chợ của Hiên Nhi.  
**Quy tắc:** mọi agent phải đọc `AGENTS.md` và `docs/handover/ACTIVE_TASKS.json` trước khi sửa. Không ghi giá trị mật khẩu, token hoặc secret vào repository.

---

## Trạng thái mật khẩu theo từng app

- **SPARE** (`/`): dùng mật khẩu riêng.
- **Bói toán** (`/boitoan/`) và **MEDORA** (`/medora/`): dùng chung mật khẩu hiện hành.
- Giá trị mật khẩu không lưu trong repository. Quy trình sửa payload: `tools/decrypt.mjs` → sửa plaintext cục bộ → test → `tools/encrypt.mjs`; không commit plaintext.

## Cơ chế khóa giải mã theo app

- Worker cấp khóa theo `app`: ưu tiên `DECRYPT_KEY_<APP>`, nếu thiếu dùng `DECRYPT_KEY` chung.
- Hiện có `DECRYPT_KEY_SPARE` cho SPARE và `DECRYPT_KEY` cho Bói toán/MEDORA.
- Đổi mật khẩu một app phải đồng bộ payload, gate và Worker secret của đúng app.

## Hạ tầng tóm tắt

- Source chuẩn: `baominhle77-glitch/baominhle77-glitch.github.io`.
- Production frontend: Cloudflare Pages `hiennhi89.pages.dev`.
- Backend: Worker `hiennhi89-gate.hiennhi89.workers.dev`, KV và Telegram.
- Secret chỉ nằm trong GitHub Secrets/Cloudflare Worker Secrets.

---

## Nhật ký thay đổi — mới nhất trên cùng

### 2026-07-23 05:34 GMT+7 — ChatGPT GPT-5.6 — DEPLOY-20260723-03 — CHẨN ĐOÁN DEPLOYMENT ⏳

- `main` mới nhất khi nhận task: `af260cc5c4c0e0013293cc6ce263e2692822d9ad`.
- Commit `af260cc…` là bàn giao thủ công ghi đúng rằng production chưa có bằng chứng; không phải kết quả Cloudflare deploy.
- PR #23 được đóng không merge vì được tạo từ base cũ và sẽ ghi đè các file bàn giao của agent khác.
- Nhánh thay thế: `agent/DEPLOY-20260723-03-production-diagnostics-v2`, tạo trực tiếp từ `af260cc…`.
- Phạm vi chỉ gồm workflow deploy và các file trạng thái/bàn giao; không sửa source ứng dụng đã merge.
- Workflow mới:
  - gắn ID/outcome cho preflight, tích hợp runtime, test source, test Worker, build, Pages, Worker và smoke test;
  - hậu kiểm branding `Cái Chợ của Hiên Nhi`, role cards, CSS mobile, gate runtime và API Reader không phiên;
  - ghi `docs/handover/PRODUCTION_STATUS.md` cho cả `SUCCESS` và `FAILED`;
  - khi lỗi, ghi đúng outcome từng bước, HTTP codes và link GitHub Actions run;
  - giữ thứ tự Pages trước Worker, concurrency production và tránh vòng lặp do commit bàn giao.
- Khóa source `BOITOAN-20260723-02` đã được giải phóng và chuyển sang `recently_completed`; task deploy này giữ riêng vùng hạ tầng cho tới khi có status production.

### 2026-07-23 05:26 GMT+7 — ChatGPT GPT-5.6 — BOITOAN-20260723-02 — SOURCE MERGED / CHỜ PRODUCTION ⛔

- PR #19 đã merge thành commit `ed63ad7dfd8cf85dd58135095175d40a0a913e42`.
- Hai workflow trước merge đã đạt:
  - Run `29962090012` — role system/frontend/SW/Worker: **success**.
  - Run `29962089978` — coordination guard: **success**.
- Source trên `main` hiện đã có:
  - nút Cộng đồng nằm trong nav 5 mục, không còn nút nổi che app;
  - role cards Khách/Reader responsive, không xếp chữ dọc;
  - branding `Cái Chợ của Hiên Nhi`, bỏ cụm `khu vực riêng tư` ở phần hiển thị Bói toán;
  - font hệ thống đa thiết bị, logo trăng khuyết + sao và watermark lặp;
  - khung luận Tarot, Lenormand, Bài Tây, Kinh Dịch, Tử Vi, Bát Tự và phần kết nối toàn trải bài;
  - tài liệu nguồn Drive/Canva tại `docs/research/DIVINATION_SOURCES.md`;
  - không dùng OpenAI Developers/API và không chờ API key.
- `docs/handover/PRODUCTION_STATUS.md` chưa tồn tại; connector Cloudflare trực tiếp không khả dụng trong workspace hiện tại. Vì vậy chưa xác nhận Pages/Worker đã deploy hoặc giao diện iPhone production đã đúng.
- PR #20 và #21 được đóng không merge vì trùng phạm vi và kém đầy đủ hơn source trên `main`; hành động này tránh ghi đè công việc của agent khác.
- Task source đã hoàn thành tại commit merge; phần xác minh production được tách thành `DEPLOY-20260723-03`.

### 2026-07-23 05:14 GMT+7 — ChatGPT GPT-5.6 — BOITOAN-20260723-02 — MOBILE + BRANDING + KHO LUẬN

- Base `a5d3f7afa78f62e7002e151b48121bb4894d2e1f`; branch `agent/BOITOAN-20260723-02-mobile-brand-knowledge`; PR #19.
- Phản hồi từ ảnh iPhone: nút Cộng đồng nổi che thanh điều hướng; loại tài khoản Reader bị xuống dòng dọc; branding cũ và dòng “khu vực riêng tư” cần bỏ.
- Đã sửa `assets/community.css`, `boitoan/community.html`, `boitoan/community-admin.html`, `tools/apply-role-system.mjs` và `docs/research/DIVINATION_SOURCES.md`.
- Không giải mã/ghi đè payload Bói toán; lớp mới được chèn sau giải mã để giữ nguyên các sửa Tử Vi/Bát Tự của agent khác.
- Nguồn đã rà: Google Drive có Tarot, Lenormand, cartomancy/Bài Tây, Tử Vi; Canva có `Giáo trình tarot hình ảnh` 63 trang; chưa xác định được giáo trình Kinh Dịch chuyên biệt đủ rõ.
- OpenAI Developers bị loại khỏi kế hoạch; repository không phụ thuộc API key.

### 2026-07-23 04:31 GMT+7 — ChatGPT GPT-5.6 — COORD-20260723-01 — ĐIỀU PHỐI ĐA-AGENT ✅

- PR #18 merge thành `a5d3f7afa78f62e7002e151b48121bb4894d2e1f`.
- Đã tạo `AGENTS.md`, sổ khóa phạm vi, validator, workflow guard, mẫu PR và thỏa thuận phối hợp đa-agent.
- Kiểm thử GitHub Actions đạt.

### 2026-07-22 — Claude Code — THÊM THAI NGUYÊN · CUNG MỆNH · THÂN CUNG (Tứ trụ) ✅

- Thêm vào phần Bát Tự trong `boitoan/index.html` ba cung: Thai nguyên, Cung mệnh, Thân cung; hiển thị can-chi, ngũ hành, nạp âm, tàng can.
- Test Chromium không lỗi JS; chỉ sửa `boitoan/index.html` và nhật ký; không sửa backend/workflow.
- Commit merge: `fc5a147596b34d62ed2464fbcaea038530be83cc`.

### 2026-07-23 — ChatGPT GPT-5.6 — COMMUNITY-ROLE-SYSTEM ✅ SOURCE MERGED / PRODUCTION CẦN ĐỐI CHIẾU STATUS

- PR #16 merge thành commit `489b751391007976a2a39c4f25bfdcd36db99e25`.
- Source có tài khoản Khách/Reader/Admin, hồ sơ Reader, review 1–5 sao, chat riêng 30 ngày, báo phí/thanh toán và khóa owner-device cho quyền Admin đọc chat.
- CI PR đã đạt toàn bộ test frontend/backend/Worker.
- Trạng thái production phải đối chiếu `docs/handover/PRODUCTION_STATUS.md`, không suy đoán từ source.

### 2026-07-21 — Claude Code — SỬA THUẬT TOÁN BÓI TOÁN (Thần số + Tứ trụ) ✅

- Sửa Tháng cá nhân thành rút gọn của Năm cá nhân + tháng dương lịch.
- Cân bằng ngũ hành và thập thần xét tàng can; test Chromium không lỗi JS.

### 2026-07-21 — Claude Code — ĐỔI MẬT KHẨU RIÊNG CHO SPARE ✅

- Worker trả khóa theo app bằng `DECRYPT_KEY_<APP>` rồi fallback `DECRYPT_KEY`.
- Đặt `DECRYPT_KEY_SPARE`, mã hóa lại chỉ SPARE; Bói toán/MEDORA giữ mật khẩu cũ.

### 2026-07-21 — Claude Code — TRỌNG SỐ TÀNG CAN VÀ BẢNG PHÂN DÃ ✅

- Thay trọng số chung bằng bảng Nhân nguyên tư lệnh phân dã theo tài liệu cổ điển đã ghi trong app.
- Thiên can lộ = 1.0; nguyệt lệnh đương quyền ×1.5.

### Giai đoạn nền tảng — nhiều agent ✅

- Dựng gate/mã hóa/duyệt Telegram, watermark, ghi nhớ máy, PWA và deploy Cloudflare.
- Chi tiết kiến trúc và trạng thái nằm trong `HANDOVER.md` và `docs/ARCHITECTURE.md`.
