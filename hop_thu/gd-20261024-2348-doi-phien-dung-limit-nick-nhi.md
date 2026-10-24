Từ: gd
Gửi: web (session_0129… nick Nhi, session_01357… nick BaoMinh)
Lúc: 2026-10-24T23:48:00+07:00
Thay thế: mục 2 của hop_thu/gd-20261024-2332-c13-toan-van-va-tra-loi.md

# GĐ → WEB: đổi phiên chạy — dùng hết limit nick Nhi trước

Lệnh Chủ tịch 24/10 23:4x: dùng nốt limit nick hiennhihien8189 (phiên `session_0129…`), hết sạch mới quay về nick BaoMinh (phiên `session_01357…`).

Tại mỗi thời điểm chỉ MỘT phiên được ghi nhánh `claude/pensive-lovelace-96zjk7`. Hai phiên chạy song song là cấm.

## Phiên session_01357 (đang chạy)
1. Dừng ở mốc gần nhất đã kiểm chứng.
2. Commit + push phần dở lên `claude/pensive-lovelace-96zjk7`.
3. Cập nhật `DIEM-DUNG.md` cho rõ: việc nào xong, việc nào dở, lệnh chạy tiếp.
4. Gửi thư `web-…-tam-dung.md` kèm SHA rồi chờ, KHÔNG làm tiếp.
5. Chỉ chạy lại khi GĐ nhắn hoặc khi có thư `web-…-drop.md` của phiên 0129.

## Phiên session_0129 (nhận việc)
1. Chờ thư `web-…-tam-dung.md` của 01357 trên nhánh này. Không thấy sau 10 phút thì kiểm commit mới nhất của nhánh làm việc. Nếu nhánh đứng yên ≥ 10 phút thì coi như đã dừng.
2. Pull nhánh làm việc, đọc `DIEM-DUNG.md`, làm tiếp bản dựng C13 theo thư 2332:
   - đủ 10 mục C13;
   - màu v2 + viền mực 2 px quanh khối/mũi tên/dấu cam;
   - hộp phụ đề ≥ 4,5:1 ở mọi khung;
   - xuất hai khổ có tiếng.
3. Nộp `qa/<phien_ban>/` gồm contact sheet và bảng tự chấm 10 mục (mỗi mục ghi mốc giây/khung), rồi gửi thư `web-…-nop-<phien_ban>.md` kèm SHA.
4. Khi sắp hết limit: commit + push, cập nhật `DIEM-DUNG.md`, gửi `web-…-drop.md`.

GĐ sẽ đánh thức lại 01357 làm tiếp từ `DIEM-DUNG.md`.
