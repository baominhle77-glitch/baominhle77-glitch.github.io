# 🤝 NHẬT KÝ PHỐI HỢP GIỮA CÁC CÔNG CỤ AI

> File này để các AI/công cụ cùng làm trên repository nắm được phạm vi, bằng chứng kiểm thử và việc còn chờ.

**Thương hiệu hiển thị:** Cái Chợ của Hiên Nhi.  
**Quy tắc điều phối:** đọc `AGENTS.md` và `docs/handover/ACTIVE_TASKS.json` trước khi sửa; không ghi mật khẩu, token hoặc secret vào repository.  
**Quy tắc độ tin cậy:** tuyệt đối không bịa. Mọi kết luận về source, production hoặc chuyên môn phải dựa trên source, log, test hoặc tài liệu đã kiểm chứng. Nếu chưa đủ bằng chứng, phải ghi rõ **chưa xác lập/chưa đủ chứng cứ**; không tự điền nội dung chung chung cho đủ giao diện.

---

## Trạng thái mật khẩu và hạ tầng

- **SPARE** (`/`) dùng mật khẩu riêng.
- **Bói toán** (`/boitoan/`) và **MEDORA** (`/medora/`) dùng chung mật khẩu hiện hành.
- Giá trị mật khẩu không lưu trong repository; không commit `*.src.html`.
- Worker cấp khóa theo `app`: ưu tiên `DECRYPT_KEY_<APP>`, nếu thiếu dùng `DECRYPT_KEY` chung.
- Production frontend: `hiennhi89.pages.dev`.
- Backend: `hiennhi89-gate.hiennhi89.workers.dev`.

---

## Nhật ký thay đổi — mới nhất trên cùng

### 2026-07-23 10:30 GMT+7 — ChatGPT GPT-5.6 — BOITOAN-20260723-04 — HOÀN TẤT ✅

- BaoMinh đã kiểm tra trực tiếp trên điện thoại và xác nhận giao diện mobile đạt yêu cầu.
- PR #26 merge thành `3322b7c899aeeee3d2e98e26e4cbc97931390a77`.
- Hai CI trước merge đều success:
  - run `29976927421` — coordination guard;
  - run `29976927419` — role system/frontend/Worker.
- Production run `29976968849` ghi `SUCCESS` cho đúng source commit `3322b7c…`:
  - Pages `200`;
  - CSS `200`;
  - gate runtime JS `200`;
  - Worker không phiên `401 unauthorized`, đúng kỳ vọng.
- Source `main` đã đối chiếu lại: không còn `marketGuide`, `addMarketGuides`, `renderMarketSynthesis`, `watchMarketResult`, `.market-guide`, `.market-dynamic-analysis`, các chuỗi `Khung luận…` hoặc `Kết nối toàn trải bài`.
- Vẫn giữ nguyên `injectCommunity`, `applyMarketBranding`, logo, nav 5 mục, role cards, nút/luồng `Luận giải chuyên sâu`, thuật toán gốc, tài khoản, chat, review và thanh toán.
- Task đã chuyển `completed`; không còn vùng file nào bị khóa.
- Nguyên tắc của người dùng được lưu cố định trong bàn giao: **không bịa; bằng chứng trước, kết luận sau**.

### 2026-07-23 10:14 GMT+7 — ChatGPT GPT-5.6 — DEPLOY-20260723-03 — PRODUCTION SUCCESS ✅

- PR #25 merge thành `5e4e139b2bc09d14dd73fc6990adb428a8d2b40f`.
- Workflow run `29976466953` sửa false-negative do Cloudflare Clean URLs HTTP 308.
- Pages/CSS/Gate `200`, Worker `401 unauthorized` đúng kỳ vọng.

### 2026-07-23 05:26 GMT+7 — ChatGPT GPT-5.6 — BOITOAN-20260723-02 — SOURCE MERGED

- PR #19 merge thành `ed63ad7dfd8cf85dd58135095175d40a0a913e42`.
- Source bổ sung branding, role cards responsive, nav 5 mục, font hệ thống, logo/watermark và lớp khung luận.
- Phần khung luận sau đó bị người dùng đánh giá không hữu ích và đã được gỡ hoàn toàn trong `BOITOAN-20260723-04`.
- OpenAI Developers/API đã bị loại khỏi kế hoạch; app không chờ API key.

### 2026-07-23 04:31 GMT+7 — ChatGPT GPT-5.6 — COORD-20260723-01 — ĐIỀU PHỐI ĐA-AGENT ✅

- PR #18 merge thành `a5d3f7afa78f62e7002e151b48121bb4894d2e1f`.
- Đã tạo `AGENTS.md`, sổ khóa phạm vi, validator, workflow guard, mẫu PR và quy tắc phối hợp đa-agent.

### 2026-07-22 — Claude Code — THAI NGUYÊN · CUNG MỆNH · THÂN CUNG ✅

- Thêm ba cung vào phần Bát Tự; test Chromium không lỗi JS.
- Commit merge: `fc5a147596b34d62ed2464fbcaea038530be83cc`.

### 2026-07-23 — ChatGPT GPT-5.6 — COMMUNITY ROLE SYSTEM ✅

- PR #16 merge thành `489b751391007976a2a39c4f25bfdcd36db99e25`.
- Có tài khoản Khách/Reader/Admin, hồ sơ Reader, review 1–5 sao, chat riêng 30 ngày, báo phí/thanh toán và owner-device guard cho Admin.

### 2026-07-21 — Claude Code — THUẬT TOÁN VÀ MẬT KHẨU ✅

- Sửa Tháng cá nhân; cân bằng ngũ hành/thập thần xét tàng can.
- Tách mật khẩu SPARE bằng `DECRYPT_KEY_SPARE`.
- Áp dụng bảng Nhân nguyên tư lệnh phân dã; thiên can lộ = 1.0, nguyệt lệnh đương quyền ×1.5.

---

Chi tiết kiến trúc và trạng thái hiện hành: `HANDOVER.md`, `docs/ARCHITECTURE.md`, `docs/handover/PRODUCTION_STATUS.md`.
