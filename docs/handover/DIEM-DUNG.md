# ĐIỂM DỪNG HIỆN TẠI — đọc đầu tiên khi mở phiên mới

> Cập nhật sau **mỗi lượt trả lời có thay đổi**. Ghi ngắn, đủ để một phiên/nick khác làm tiếp ngay. Không ghi mật khẩu, token, khóa.

**Cập nhật:** 23/10/2026 21:10 GMT+7 — Claude Code

## Việc đang làm

- **Dự án:** Xưởng Video Mô Phỏng — app web `video-mo-phong/` (nhập ý tưởng → kịch bản → phong cách → xuất video).
- **Nhánh:** `claude/pensive-lovelace-96zjk7` (đã push; **chưa có PR**, chưa merge vào `main`).
- **Task gần nhất:** `EDU-20261023-02` (V2) — completed; `DOCS-20261023-01` (quy trình đổi tài khoản) — completed.
- **Khóa đang giữ:** không có.
- **Tài liệu chi tiết:** `docs/handover/VIDEO_MO_PHONG.md`.

## Trạng thái

- Xong source V1 + V2; kiểm thử Chromium đạt (Claude dùng API giả lập).
- **Chưa** gọi Claude thật bằng khóa thật; **chưa** kiểm Safari/iPhone.
- **Chưa lên production:** cần thêm thư mục vào build `_site` trong `.github/workflows/deploy-pages.yml`, nhưng file này đang bị khóa bởi task `GROWTH-20260725-04` (ChatGPT, heartbeat cuối 25/07/2026 — quá hạn khóa 24 giờ). Chờ BaoMinh xác nhận cho đóng task đó.

## Bước tiếp theo (chờ BaoMinh chọn)

1. Đưa app lên web (sau khi được phép đóng `GROWTH-20260725-04`) — các dòng cần thêm đã ghi trong `VIDEO_MO_PHONG.md` mục Triển khai.
2. Thêm mô phỏng mới (tim mạch, tương tác thuốc, hóa học…).
3. Thêm nhạc nền / chèn ảnh vào cảnh.
4. Mở PR cho nhánh hiện tại khi BaoMinh yêu cầu.

## Quyết định đã chốt với BaoMinh

- App chạy hoàn toàn trên trình duyệt; AI dùng khóa API Claude của chính người dùng (không qua backend). Không có khóa → kịch bản mẫu offline.
- Mô hình mặc định `claude-opus-5-5`; người dùng tự chọn Sonnet/Haiku nếu muốn rẻ hơn.
