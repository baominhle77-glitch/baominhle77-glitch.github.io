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

### 2026-07-23 05:14 GMT+7 — ChatGPT GPT-5.6 — BOITOAN-20260723-02 — MOBILE + BRANDING + KHO LUẬN ⏳

- Base `a5d3f7afa78f62e7002e151b48121bb4894d2e1f`; branch `agent/BOITOAN-20260723-02-mobile-brand-knowledge`; PR #19.
- Phản hồi từ ảnh iPhone: nút Cộng đồng nổi che thanh điều hướng; loại tài khoản Reader bị xuống dòng dọc; branding cũ và dòng “khu vực riêng tư” cần bỏ.
- Đã sửa:
  - `assets/community.css`: layout mobile, role cards, system-font stack, serif fallback, logo sigil CSS, watermark lặp.
  - `boitoan/community.html`: hai loại tài khoản thành hai thẻ có mô tả rõ.
  - `boitoan/community-admin.html`: đồng bộ thương hiệu.
  - `tools/apply-role-system.mjs`: đưa Cộng đồng vào nav 5 mục; branding sau giải mã; footer/watermark mới; khung luận Tarot/Lenormand/Bài Tây/Kinh Dịch/Tử Vi/Bát Tự; kết nối toàn trải bài.
  - `docs/research/DIVINATION_SOURCES.md`: bản đồ nguồn và phương pháp tổng hợp, không chép nguyên văn.
- Không giải mã/ghi đè payload Bói toán; lớp mới được chèn sau giải mã để giữ nguyên các sửa Tử Vi/Bát Tự của agent khác.
- Nguồn đã rà:
  - Google Drive: giáo trình của chủ, Tarot, Lenormand, cartomancy/Bài Tây, Tử Vi; chưa tìm thấy giáo trình Kinh Dịch chuyên biệt đủ rõ.
  - Canva: `Giáo trình tarot hình ảnh`, 63 trang; không có thiết kế Lenormand phù hợp trong lượt tìm.
- OpenAI Developers: người dùng yêu cầu bỏ; plugin trả `not_installed`, repo không có cấu hình OPENAI; task không phụ thuộc API key.
- Kiểm thử GitHub Actions:
  - Run `29962090012` — role system/frontend/SW/Worker: **success**.
  - Run `29962089978` — coordination guard: **success**.
- Trạng thái: source đã kiểm thử; PR #19 chưa merge; chưa xác nhận production và chưa test trực tiếp E2E trên iPhone sau deploy.

### 2026-07-23 04:31 GMT+7 — ChatGPT GPT-5.6 — COORD-20260723-01 — ĐIỀU PHỐI ĐA-AGENT ✅

- Base: `fc5a147596b34d62ed2464fbcaea038530be83cc`; branch `chore/multi-agent-coordination-20260723`; PR #18.
- Lý do: trong lúc luồng role-system/deploy đang được theo dõi, agent khác merge thêm thay đổi Bát Tự vào `main`. Thay đổi đó được giữ nguyên; task này không sửa logic app.
- Đã tạo:
  - `AGENTS.md` — quy tắc bắt buộc cho mọi agent.
  - `docs/handover/ACTIVE_TASKS.json` — khóa phạm vi máy đọc được.
  - `tools/validate-coordination.mjs` — phát hiện Task-ID, branch hoặc paths trùng nhau.
  - `.github/workflows/coordination-guard.yml` — PR phải có Task-ID, đúng branch, chỉ sửa paths đã khóa và cập nhật bàn giao.
  - `.github/pull_request_template.md`, `.github/copilot-instructions.md`.
  - `docs/handover/PHOI-HOP-DA-AGENT.md` — thỏa thuận vận hành chi tiết.
- Kiểm thử GitHub Actions đạt; PR #18 merge thành `a5d3f7afa78f62e7002e151b48121bb4894d2e1f`.

### 2026-07-22 — Claude Code — THÊM THAI NGUYÊN · CUNG MỆNH · THÂN CUNG (Tứ trụ) ✅

- Thêm vào phần Bát Tự trong `boitoan/index.html` ba cung: Thai nguyên, Cung mệnh, Thân cung; hiển thị can-chi, ngũ hành, nạp âm, tàng can.
- Công thức và ví dụ được agent thực hiện đối chiếu theo tài liệu Tử Bình được ghi trong phiên đó.
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
- Chỉ sửa `boitoan/index.html` và nhật ký.

### 2026-07-21 — Claude Code — ĐỔI MẬT KHẨU RIÊNG CHO SPARE ✅

- Worker trả khóa theo app bằng `DECRYPT_KEY_<APP>` rồi fallback `DECRYPT_KEY`.
- Đặt `DECRYPT_KEY_SPARE`, mã hóa lại chỉ SPARE; Bói toán/MEDORA giữ mật khẩu cũ.
- Kiểm chứng SPARE mở bằng mật khẩu mới, mật khẩu cũ vô hiệu; hai app còn lại không đổi.

### 2026-07-21 — Claude Code — TRỌNG SỐ TÀNG CAN VÀ BẢNG PHÂN DÃ ✅

- Thay trọng số chung bằng bảng Nhân nguyên tư lệnh phân dã theo tài liệu cổ điển đã ghi trong app.
- Thiên can lộ = 1.0; nguyệt lệnh đương quyền ×1.5; hiển thị điểm một chữ số thập phân.
- Chỉ sửa `boitoan/index.html` và nhật ký; đã test Chromium.

### Giai đoạn nền tảng — nhiều agent ✅

- Dựng gate/mã hóa/duyệt Telegram, watermark, ghi nhớ máy, PWA và deploy Cloudflare.
- Chi tiết kiến trúc và trạng thái nằm trong `HANDOVER.md` và `docs/ARCHITECTURE.md`.
