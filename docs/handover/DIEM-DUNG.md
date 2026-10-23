# ĐIỂM DỪNG HIỆN TẠI — đọc đầu tiên khi mở phiên mới

> Cập nhật sau **mỗi lượt trả lời có thay đổi**. Ghi ngắn, đủ để một phiên/nick khác làm tiếp ngay. Không ghi mật khẩu, token, khóa.

**Cập nhật:** 24/10/2026 02:40 GMT+7 — Claude Code

## Việc đang làm

- **Dự án:** Xưởng Video Mô Phỏng — app web `video-mo-phong/` (nhập ý tưởng → kịch bản → phong cách → xuất video).
- **Nhánh:** `claude/pensive-lovelace-96zjk7` (đã push; **chưa có PR**, chưa merge vào `main`).
- **Task gần nhất:** `EDU-20261024-01` (V3: bỏ API, viết kịch bản bằng hạn mức nick) — completed.
- **Khóa đang giữ:** không có.
- **Tài liệu chi tiết:** `docs/handover/VIDEO_MO_PHONG.md`.

## Trạng thái

- Xong source V1–V3; kiểm thử Chromium đạt. V3: sao chép lời nhắc → dán vào Claude (hạn mức nick) → dán câu trả lời vào app → dựng video.
- **Chưa** thử với câu trả lời thật từ claude.ai; **chưa** kiểm Safari/iPhone.
- **Chưa lên production:** cần thêm thư mục vào build `_site` trong `.github/workflows/deploy-pages.yml`, nhưng file này đang bị khóa bởi task `GROWTH-20260725-04` (ChatGPT, heartbeat cuối 25/07/2026 — quá hạn khóa 24 giờ). Chờ BaoMinh xác nhận cho đóng task đó.

## Phối hợp với Studio (phiên "giám đốc dự án studio" trên máy Windows của BaoMinh)

- 24/10/2026 ~01:50: đã gửi trả lời cho GĐ Studio (session_01B5Cg4xVYBsBVrjtgTDcAnZ) về web, pipeline, phần dùng chéo và đề xuất liên kết B1–B4 (định dạng chung `edu-video-script/v1`, nút "Xuất gói cho Studio", adapter Manim phía Studio, skill dùng chung). **Chưa sửa gì vì Studio** — chờ BaoMinh/GĐ duyệt.
- Kênh liên lạc chính: Artifact "Hộp thư Studio ↔ Web" https://claude.ai/artifact/YAUssqJCUhige1U5pbyW7N — đọc bằng ArtifactData `list` collection `thu`; trả lời bằng `set` doc_id `web-YYYYMMDD-HHMM`, data `{tu:"web", luc, noi_dung}`. Tin nhắn trực tiếp GĐ → phiên cloud không tới được.
- 02:10: đã trả lời thư `gd-20261024-0205` (7 câu). Đã xin Studio: 1 hồ sơ tập mẫu ĐẠT, khuôn kênh, tiêu chí kiểm định hình/phụ đề. Chưa code B1/B2 — chờ BaoMinh duyệt. 02:40: đã báo GĐ là app bỏ đường API.

## Bước tiếp theo (chờ BaoMinh chọn)

1. Đưa app lên web (sau khi được phép đóng `GROWTH-20260725-04`) — các dòng cần thêm đã ghi trong `VIDEO_MO_PHONG.md` mục Triển khai.
2. Thêm mô phỏng mới (tim mạch, tương tác thuốc, hóa học…).
3. Thêm nhạc nền / chèn ảnh vào cảnh.
4. Mở PR cho nhánh hiện tại khi BaoMinh yêu cầu.

## Quyết định đã chốt với BaoMinh

- App chạy hoàn toàn trên trình duyệt, không backend.
- **KHÔNG dùng API trả phí, không mua credit** — chỉ dùng hạn mức nick Claude (24/10/2026). Kịch bản do Claude bản chat/Claude Code viết rồi dán vào app; đường API đã gỡ.
