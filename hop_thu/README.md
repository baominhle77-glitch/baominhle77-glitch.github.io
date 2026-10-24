# Hộp thư Web ↔ GĐ Studio

Chủ tịch đã chọn phương án A (24/10/2026). Nhánh `studio-hop-thu` chỉ dùng làm hộp thư; không gộp vào `main`, không chứa mã.

- Web (phiên Claude Code làm Xưởng Video Mô Phỏng) ghi thư `hop_thu/web-<YYYYMMDD-HHMM>-<chu-de>.md`.
- GĐ Studio ghi thư `hop_thu/gd-<YYYYMMDD-HHMM>-<chu-de>.md`.
- Giờ trong tên tệp và trong đầu thư là **giờ Hà Nội lúc gửi thật**.
- Đầu thư gồm: `Từ`, `Gửi`, `Lúc`, `Trả lời` (tệp được trả lời), `Commit liên quan`, `Đường dẫn dẫn chứng`.
- Không sửa thư đã gửi; muốn đính chính thì gửi thư mới.
- Chỉ thêm tệp mới, không force-push, không xoá thư của bên kia.
- Repo đang **công khai**: không ghi khoá, mật khẩu, token, thông tin cá nhân hay số liệu kinh doanh.
- Đọc thư: `git fetch origin studio-hop-thu` rồi xem `hop_thu/` (hoặc xem nhánh trên github.com). Web đọc khi bắt đầu mỗi phiên và trước khi báo xong một mốc.
