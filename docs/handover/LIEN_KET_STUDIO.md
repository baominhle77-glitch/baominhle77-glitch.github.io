# Liên kết Web (Xưởng Video Mô Phỏng) ↔ GĐ Studio

> **ĐÃ QUYẾT (Chủ tịch, 24/10/2026): phương án A.** Cập nhật: 24/10/2026 19:31 GMT+7 — Claude Code (phiên Web).

## Phương án A — hộp thư trong repo GitHub

- **Nơi để thư:** thư mục `hop_thu/` trên nhánh riêng **`studio-hop-thu`** của repo này. Nhánh chỉ làm hộp thư: không gộp vào `main`, không chứa mã.
- **Ai ghi gì:** Web ghi `hop_thu/web-<YYYYMMDD-HHMM>-<chu-de>.md`; GĐ ghi `hop_thu/gd-<YYYYMMDD-HHMM>-<chu-de>.md`. Giờ là giờ Hà Nội lúc gửi thật.
- **Đánh thức GĐ:** phía Studio có `canh_web_gd.sh` (do GĐ quản lý).
- **Quyền:** Chủ tịch cấp một lần cho máy Studio quyền ghi repo (đăng nhập GitHub CLI, hoặc fine-grained token chỉ cho repo này, chỉ quyền Contents). GĐ không tự đăng nhập hay tạo khoá (luật cấm). Phiên Web trên cloud đã có quyền push sẵn.
- **Vì sao chọn:**
  - không phụ thuộc nick Claude, đổi nick không mất thư;
  - 0 token khi chờ;
  - mỗi thư là một commit có giờ và SHA làm dẫn chứng.
- **Rủi ro đã biết:** repo công khai, GitHub Pages phục vụ repo ra web, nên thư trong `hop_thu/` ai cũng đọc được. Quy ước: **không ghi khoá, mật khẩu, token, thông tin cá nhân, số liệu kinh doanh**. Muốn kín thì sau này chuyển sang repo private `studio-hop-thu`.
- **Hộp thư cũ:** Artifact `claude.ai/artifact/YAUssq…` thuộc nick cũ, GĐ không còn đọc được. Không dùng nữa.

## Quy trình phía Web

1. Đầu mỗi phiên và trước khi báo xong một mốc: `git fetch origin studio-hop-thu`, rồi đọc thư `gd-*.md` mới trong `hop_thu/`.
2. Gửi thư: commit thêm một tệp `web-*.md` vào nhánh `studio-hop-thu` và push. Không force-push, không sửa hay xoá thư cũ.
3. Đầu thư gồm: `Từ`, `Gửi`, `Lúc`, `Trả lời`, `Commit liên quan`, `Đường dẫn dẫn chứng`. Quy ước đầy đủ: `hop_thu/README.md` trên nhánh hộp thư.
4. Ghi tên thư vừa gửi hoặc vừa nhận vào `docs/handover/DIEM-DUNG.md`.

## Thư đã gửi qua hộp thư mới

- `hop_thu/web-20261024-1931-lien-ket-va-c13.md`: xác nhận 3 việc (dừng khi hết limit, liên kết A, C13); xin toàn văn 9 điều C13; báo lo ngại tương phản của cam v2.
