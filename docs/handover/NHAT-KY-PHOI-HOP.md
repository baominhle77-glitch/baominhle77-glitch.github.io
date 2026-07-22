# 🤝 NHẬT KÝ PHỐI HỢP GIỮA CÁC CÔNG CỤ AI

> File này để các AI/công cụ khác nhau cùng làm trên repository đọc và nắm được ai đã làm gì, phạm vi nào đang giữ, đã kiểm thử ra sao và việc nào còn chờ.

**Chủ sở hữu:** Hiên Nhi Hiên 89.  
**Quy tắc mới:** mọi agent phải đọc `AGENTS.md` và `docs/handover/ACTIVE_TASKS.json` trước khi sửa. Không ghi giá trị mật khẩu, token hoặc secret vào repository.

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

### 2026-07-23 04:24 GMT+7 — ChatGPT GPT-5.6 — COORD-20260723-01 — ĐIỀU PHỐI ĐA-AGENT ⏳

- Base: `fc5a147596b34d62ed2464fbcaea038530be83cc`; branch `chore/multi-agent-coordination-20260723`.
- Lý do: trong lúc luồng role-system/deploy đang được theo dõi, agent khác merge thêm thay đổi Bát Tự vào `main`. Thay đổi đó được giữ nguyên; task này không sửa logic app.
- Đã tạo:
  - `AGENTS.md` — quy tắc bắt buộc cho mọi agent.
  - `docs/handover/ACTIVE_TASKS.json` — khóa phạm vi máy đọc được.
  - `tools/validate-coordination.mjs` — phát hiện Task-ID, branch hoặc paths trùng nhau.
  - `.github/workflows/coordination-guard.yml` — PR phải có Task-ID, đúng branch, chỉ sửa paths đã khóa và cập nhật bàn giao.
  - `.github/pull_request_template.md`, `.github/copilot-instructions.md`.
  - `docs/handover/PHOI-HOP-DA-AGENT.md` — thỏa thuận vận hành chi tiết.
- Đã cập nhật `HANDOVER.md`: tách source mới nhất khỏi production đã xác nhận; ghi rõ role system đã merge nhưng hậu kiểm production mới chưa có `PRODUCTION_STATUS.md`.
- Chờ: chạy CI trên PR, chuyển task sang `completed`, giải phóng khóa và merge nếu mọi check đạt.

### 2026-07-22 — Claude Code — THÊM THAI NGUYÊN · CUNG MỆNH · THÂN CUNG (Tứ trụ) ✅

- Thêm vào phần Bát Tự trong `boitoan/index.html` ba cung: Thai nguyên, Cung mệnh, Thân cung; hiển thị can-chi, ngũ hành, nạp âm, tàng can.
- Công thức và ví dụ được agent thực hiện đối chiếu theo tài liệu Tử Bình được ghi trong phiên đó.
- Test Chromium không lỗi JS; chỉ sửa `boitoan/index.html` và nhật ký; không sửa backend/workflow.
- Commit merge: `fc5a147596b34d62ed2464fbcaea038530be83cc`.

### 2026-07-23 — ChatGPT GPT-5.6 — COMMUNITY-ROLE-SYSTEM ✅ SOURCE MERGED / PRODUCTION CHƯA CHỐT

- PR #16 merge thành commit `489b751391007976a2a39c4f25bfdcd36db99e25`.
- Source có tài khoản Khách/Reader/Admin, hồ sơ Reader, review 1–5 sao, chat riêng 30 ngày, báo phí/thanh toán và khóa owner-device cho quyền Admin đọc chat.
- CI PR đã đạt toàn bộ test frontend/backend/Worker.
- Workflow deploy được bổ sung hậu kiểm trang cộng đồng HTTP 200 và API không phiên HTTP 401.
- Tại thời điểm ghi nhật ký, `docs/handover/PRODUCTION_STATUS.md` chưa xuất hiện trên `main`; không coi production đã xác nhận.

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
