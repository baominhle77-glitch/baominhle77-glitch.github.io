# 🤝 NHẬT KÝ PHỐI HỢP GIỮA CÁC CÔNG CỤ AI

> File này để **các AI/công cụ khác nhau cùng làm trên repo này** (Claude Code, VSCode
> Copilot, Codex…) đọc và nắm được ai đã làm gì, được chủ đồng ý ra sao, tránh giẫm chân.

**Chủ sở hữu:** Hiên Nhi Hiên 89 (baominhle77@gmail.com).
**Nguyên tắc:** Mọi thay đổi Claude ghi ở đây đều **do chủ trực tiếp yêu cầu/đồng ý trong hội thoại**.
Trước khi push: hãy `git fetch` + rebase lên `main` mới nhất để **không đè** việc của công cụ khác.

---

## Trạng thái mật khẩu theo từng app (QUAN TRỌNG)
- **SPARE** (`/` — index.html gốc): dùng **mật khẩu RIÊNG**, khác 2 app kia.
- **Bói toán** (`/boitoan/`) và **MEDORA** (`/medora/`): dùng **chung một mật khẩu**.
- ⚠️ **Giá trị mật khẩu KHÔNG lưu trong repo** (repo công khai). Chủ giữ. Cần sửa nội dung
  app nào thì **hỏi chủ mật khẩu app đó** rồi `tools/decrypt.mjs` → sửa → `tools/encrypt.mjs`.

## Cơ chế khóa giải mã theo app (backend)
- Worker cấp khóa giải mã cho khách ĐƯỢC DUYỆT dựa trên `app`:
  secret **`DECRYPT_KEY_<APP>`** (vd `DECRYPT_KEY_SPARE`), nếu không có thì dùng `DECRYPT_KEY` chung.
- Hiện có: `DECRYPT_KEY_SPARE` (cho SPARE) + `DECRYPT_KEY` chung (cho boitoan, medora).
- Đổi mật khẩu 1 app = (a) mã hóa lại app đó bằng mật khẩu mới, **và** (b) cập nhật secret
  `DECRYPT_KEY_<APP>` tương ứng trên Worker. Thiếu 1 trong 2 → khách duyệt sẽ không mở được.

## Hạ tầng (tóm tắt)
- 1 repo nguồn: `baominhle77-glitch.github.io` (đã gộp MEDORA vào `medora/`).
- Production: **Cloudflare Pages** `hiennhi89.pages.dev` (deploy qua `.github/workflows/deploy-pages.yml`).
- Backend duyệt: Worker `hiennhi89-gate.hiennhi89.workers.dev` (KV + Telegram bot).
- Bí mật (token, DECRYPT_KEY*…) chỉ nằm ở Worker/GitHub Secrets, **không trong repo**.

---

## Nhật ký thay đổi (mới nhất trên cùng)

### 2026-07-22 — Claude Code — THÊM THAI NGUYÊN · CUNG MỆNH · THÂN CUNG (Tứ trụ)  ✅ *(chủ yêu cầu)*
- Chủ yêu cầu (khác nhiệm vụ đang giao VSCode): "lá số nào cũng phải có thai nguyên và cung mệnh — app còn thiếu, thêm hết đi. Đừng làm ảnh hưởng agent khác."
- Đã thêm vào phần **Bát Tự** (`boitoan/index.html`) một khối 3 cung ngay dưới bảng Tứ trụ, hiển thị can-chi, ngũ hành, nạp âm, tàng can (giao diện y hệt thẻ trụ, lưới 3 cột `.pillars.pal3`):
  1. **Thai nguyên (胎元)**: can nguyệt +1, chi nguyệt +3 (干前一位, 支前三位) — dựa trên trụ tháng tiết khí.
  2. **Cung mệnh (命宮)**: cơ số (14 nếu tổng<14, ngược lại 26) − (số tháng-tiết-khí + số giờ), an tại cung Mão 卯. Số địa chi kiểu Dần=1…Sửu=12.
  3. **Thân cung (身宮)**: thuận số tháng, nghịch giờ về cung Dậu 酉 ⇔ `(số tháng + chi giờ − 10) mod 12`.
  - Thiên can 3 cung lấy theo **Ngũ hổ độn (五虎遁)** từ can năm (khớp cách app đã tính can tháng).
- Nguồn công thức: 《三命通會》/ giáo trình Tử Bình (masterso.com, ppfocus). Đã đối chiếu ví dụ chuẩn:
  酉月辰時 → Mệnh **Bính Thìn (丙辰)**; 辰月丑時 → Mệnh **Nhâm Tý (壬子)** + Thân **Bính Ngọ (丙午)**; 辛酉月 → Thai **Nhâm Tý (壬子)**. Khớp 100%.
- Đã test **Chromium (CDP)**: 1990-05-20 giờ Ngọ → Thai **Nhâm Thân**, Mệnh **Nhâm Ngọ**, Thân **Mậu Tý** (khớp tính tay); không lỗi JS; các mục sau vẫn render đủ.
- ⚠️ Chỉ đụng `boitoan/index.html` + file nhật ký này. **Không** đụng SPARE, MEDORA, `sw.js`, `backend/**`, workflow. Mật khẩu boitoan **giữ nguyên** (hiennhi89), chỉ giải mã → sửa JS → mã hóa lại.

### 2026-07-21 — Claude Code — SỬA THUẬT TOÁN BÓI TOÁN (Thần số + Tứ trụ)  ✅ *(chủ yêu cầu)*
- Chủ yêu cầu (khác nhiệm vụ đang giao VSCode): sửa "Tháng cá nhân" tính sai + Tứ trụ chưa dùng tàng can.
- Đã sửa trong `boitoan/index.html` (giải mã bằng mật khẩu boitoan → sửa JS → mã hóa lại, mật khẩu KHÔNG đổi):
  1. **Tháng cá nhân**: sửa công thức thành `rút gọn(Năm cá nhân + tháng dương lịch)`
     (trước đó cộng lặp ngày+tháng sinh vốn đã nằm trong Năm cá nhân → sai).
  2. **Tứ trụ**: cân bằng ngũ hành nay **đếm cả tàng can** trong địa chi (bản/trung/dư khí);
     thập thần xét **tất cả** tàng can (không chỉ tàng chính). Bảng `TANG_CAN` giữ nguyên (đã đúng).
- Đã test Chromium: tháng cá nhân đúng công thức; ngũ hành/thập thần hiện đủ tàng can; không lỗi JS.
- ⚠️ Chỉ đụng `boitoan/index.html` + file nhật ký này. Không đụng SPARE, MEDORA, sw.js, workflow.

### 2026-07-21 — Claude Code — ĐỔI MẬT KHẨU RIÊNG CHO SPARE  ✅ *(chủ yêu cầu)*
- Chủ yêu cầu: "đổi riêng SPARE thành mật khẩu mới, 2 app còn lại giữ nguyên".
- Đã làm:
  1. `backend/worker.js`: `handleStatus` trả khóa **theo app** (`DECRYPT_KEY_<APP>` → fallback `DECRYPT_KEY`).
  2. Đặt secret Worker `DECRYPT_KEY_SPARE` = (mật khẩu mới của SPARE, chủ giữ) + deploy Worker.
  3. Mã hóa lại **chỉ** `index.html` (SPARE) bằng mật khẩu mới + cập nhật `pbkdf2` trong `window.GATE`.
  4. **Không** đụng `boitoan/`, `medora/`, `sw.js`, `deploy-pages.yml` (tôn trọng việc VSCode đang làm).
- Kiểm chứng: SPARE mở bằng mật khẩu mới ✅; mật khẩu cũ vô hiệu ✅; boitoan/medora vẫn mở bằng mật khẩu cũ ✅.

### (trước đó) — Claude Code — nền tảng *(chủ yêu cầu)*
- Dựng 3 lớp bảo vệ (chống dò tìm + khóa mật khẩu, mã hóa AES, duyệt Telegram), watermark chủ sở hữu,
  tính năng "Ghi nhớ máy này", link `hiennhi89.pages.dev`, tự-động-deploy. Chi tiết trong `HANDOVER.md`.

> Công cụ khác (VSCode…) khi thay đổi hãy **thêm một mục nhật ký** vào đây để Claude & Codex nắm được.

### 2026-07-21 — Claude Code — TRỌNG SỐ TÀNG CAN (Tứ trụ)  ✅ *(chủ yêu cầu)*
- Chủ yêu cầu: cân bằng ngũ hành dùng TRỌNG SỐ tàng can thay vì đếm ngang.
- boitoan/index.html: bản khí [1] · 2 can [0.7,0.3] · 3 can [0.6,0.3,0.1]; can lộ =1.0;
  địa chi lệnh tháng ×1.5. Hiển thị điểm 1 chữ số thập phân + ghi chú. Đã test Chromium.

### 2026-07-21 — Claude Code — BẢNG ĐIỂM TÀNG CAN THEO PHÂN DÃ (三命通會)  ✅ *(chủ yêu cầu)*
- Chủ yêu cầu dùng bảng điểm mệnh lý CỔ ĐIỂN, uy tín nhất (nói rõ nguồn).
- Đã thay trọng số 60/30/10 chung bằng **Nhân nguyên tư lệnh phân dã (人元司令分野)** theo
  《Tam Mệnh Thông Hội 三命通會》/《Uyên Hải Tử Bình 渊海子平》 — bảng FENYE theo số ngày tiết khí,
  khớp thứ tự TANG_CAN. Thiên can lộ =1.0; nguyệt lệnh đương quyền ×1.5. Ghi nguồn ngay trong app.
- Chỉ đụng boitoan/index.html + file này. Đã test Chromium.
