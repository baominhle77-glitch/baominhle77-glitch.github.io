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

### 2026-07-23 10:16 GMT+7 — ChatGPT GPT-5.6 — BOITOAN-20260723-04 — GỠ KHUNG LUẬN AI ⏳

- BaoMinh kiểm tra trực tiếp trên điện thoại và xác nhận **giao diện mobile đạt yêu cầu**.
- Phản hồi cần xử lý: các hộp `Khung luận Tarot`, `Khung luận Lenormand`, `Khung luận Bài Tây`, `Khung luận Kinh Dịch`, `Khung luận Tử Vi`, `Khung luận Bát Tự` và `Kết nối toàn trải bài` quá máy móc, phiến diện, không có giá trị thực tế.
- Nhánh chính thức: `agent/BOITOAN-20260723-04-remove-ai-guides-v2`, tạo từ production source `e71bf5539c8ef796baf5f36d1f6c328ad5d547f5`.
- Thay đổi source hiện tại: chỉ sửa `tools/apply-role-system.mjs`, **xóa 149 dòng, không thêm nội dung thay thế**.
- Đã gỡ các hàm/call/CSS tạo guide và tổng hợp trải bài; giữ nguyên:
  - branding và logo;
  - bottom nav 5 mục và nút Cộng đồng;
  - role cards mobile;
  - nút/luồng `Luận giải chuyên sâu` có sẵn;
  - thuật toán và payload Bói toán;
  - tài khoản, chat, review, thanh toán và Worker.
- Kiểm tra thủ công đã phát hiện một tham chiếu `addMarketGuides()` còn sót ở nhánh thử nghiệm; đã sửa trước khi tạo nhánh v2. Không coi bản thử nghiệm là đạt.
- Nguyên tắc bắt buộc từ người dùng được ghi vào hồ sơ chung: **không bịa; bằng chứng trước, kết luận sau**.

### 2026-07-23 10:14 GMT+7 — ChatGPT GPT-5.6 — DEPLOY-20260723-03 — PRODUCTION SUCCESS ✅

- PR #25 merge thành `5e4e139b2bc09d14dd73fc6990adb428a8d2b40f`.
- Workflow run `29976466953` ghi `SUCCESS` vào `docs/handover/PRODUCTION_STATUS.md`.
- Bằng chứng hậu kiểm:
  - Cloudflare Pages: `200`;
  - URL cuối sau Clean URL redirect: `/boitoan/community?...`;
  - Community CSS: `200`;
  - Gate runtime JS: `200`;
  - Worker API không phiên: `401 unauthorized`, đúng kỳ vọng.
- Task deploy hoàn tất và khóa hạ tầng/bàn giao được giải phóng.

### 2026-07-23 05:34 GMT+7 — ChatGPT GPT-5.6 — DEPLOY-20260723-03 — CHẨN ĐOÁN DEPLOYMENT

- Run đầu tiên deploy Pages và Worker thành công nhưng smoke test báo lỗi do `/boitoan/community.html` trả HTTP `308` sang Clean URL.
- Workflow được sửa dùng `curl -L`, ghi `url_effective`, đồng thời vẫn kiểm tra branding, role cards, CSS, gate runtime và API Reader không phiên.
- Không sửa source ứng dụng trong task hạ tầng này.

### 2026-07-23 05:26 GMT+7 — ChatGPT GPT-5.6 — BOITOAN-20260723-02 — SOURCE MERGED

- PR #19 merge thành `ed63ad7dfd8cf85dd58135095175d40a0a913e42`.
- CI trước merge đạt:
  - Run `29962090012` — role system/frontend/SW/Worker: success.
  - Run `29962089978` — coordination guard: success.
- Source bổ sung branding `Cái Chợ của Hiên Nhi`, role cards responsive, nav 5 mục, font hệ thống, logo/watermark và lớp khung luận.
- Phần khung luận bị người dùng yêu cầu gỡ trong task `BOITOAN-20260723-04`; không được coi đây là tính năng đã được chấp thuận.
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
