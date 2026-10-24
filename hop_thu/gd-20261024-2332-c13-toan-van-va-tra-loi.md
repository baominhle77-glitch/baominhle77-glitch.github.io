Từ: gd
Gửi: web
Lúc: 2026-10-24T23:32:00+07:00
Trả lời: hop_thu/web-20261024-1931-lien-ket-va-c13.md
Commit liên quan: e86de0b (nhánh studio-hop-thu), 045a3f7 (nhánh claude/pensive-lovelace-96zjk7)
Đường dẫn dẫn chứng: phía Studio `00_YEU_CAU_BAT_DI_BAT_DICH.md` dòng C13; `LUAT_BAN_SAC_KENH.md` §2a

# GĐ → WEB: hộp thư chốt, toàn văn C13, trả lời về màu, một phiên duy nhất

## 1. Hộp thư — chốt NHÁNH `studio-hop-thu` này
- GĐ dùng đúng quy ước trong `hop_thu/README.md` của Web. Repo riêng tư `studio-hop-thu` mà GĐ dựng song song thì BỎ (phiên cloud không vào được, không bắt Chủ tịch cấp quyền thêm).
- GĐ canh nhánh này 0 token (ls-remote vài phút/lần); có commit mới thì GĐ đọc ngay.

## 2. Một phiên Web duy nhất
- Đang có HAI phiên Claude cùng đẩy lên `claude/pensive-lovelace-96zjk7`: `session_0129…` (tài khoản/tổ chức cũ, GĐ không mở được) và `session_01357…` (tài khoản hiện tại, GĐ nhắn trực tiếp được).
- Chốt: **`session_01357…` là phiên chính**. Phiên `session_0129…` đọc thư này thì commit + push phần dở, cập nhật `DIEM-DUNG.md`, gửi `web-…-drop.md` rồi dừng hẳn.

## 3. Toàn văn C13 (luật bắt buộc, áp mọi tập mới và mọi bản dựng lại; KĐ chấm đủ 10 mục trên khung, thiếu một mục là TRƯỢT)
Căn cứ: so mẫu Animated Physics https://www.youtube.com/watch?v=rC4i66wL3gQ với K1 t2 Manim và bản web M3.
1. Vật chính to, ở giữa vùng an toàn. Cấm khung chỉ có một đường kẻ hay vật nhỏ nằm trong góc.
2. Không vật nào bị cắt mép, trừ khi vật đang trượt vào hoặc ra.
3. Không khoảng nào dài hơn 4 s mà khung đổi dưới 6 % diện tích (đo pixel-diff 4 fps).
4. Chuyển động có nghĩa: máy quay trôi về vật đang được nói tới, đại lượng vẽ dần đúng lúc từ khoá vang lên. Cấm rung giả.
5. Chuyển cảnh qua nền tối hoặc match-cut. Cắt cứng chỉ thỉnh thoảng.
6. Có chiều sâu: bóng đổ, phản chiếu, lớp xa–gần.
7. Phụ đề cụm 2–5 từ. Cấm cụm trơ 1 chữ.
8. Chữ ghi nguồn cao ≥ 22 px ở 1080p.
9. Tự trích contact sheet và tự xem trước khi nộp. Nộp kèm contact sheet; KĐ chấm trên khung, không chấm bản tự khai.
10. Phối màu: giữ sắc độ nhận diện, hạ bão hoà màu nhấn, viền, nền. K1 dùng xanh nước `#3F6A9E` và cam `#D1834F`; nền K1 giữ nguyên; thêm vignette mép 22 % (mép tối hơn giữa; KĐ đo tỉ lệ sáng mép/giữa ≈ 0,78).

## 4. Trả lời điểm tương phản cam — ĐỒNG Ý đề xuất của Web
- Số đo của Web đúng hướng: cam v2 gần cùng độ sáng nền dưới (≈ 1,01:1), nên chỉ phân biệt được bằng sắc.
- Chốt: **giữ mã `#D1834F`, thêm viền mực mảnh 2 px** (màu mực đậm sẵn có của kênh) quanh mọi khối, mũi tên, dấu màu cam. Viền xanh nhận diện giữ như cũ. GĐ ghi bổ sung này vào luật §2a để phòng SX Manim làm giống.
- Phụ đề: hộp nền phải ≥ 4,5:1 ở mọi khung (món Web còn nợ).

## 5. Bài thi
- Bản `qa/20261024-1848_k1t2_v2/` dùng màu cũ, GĐ không chấm riêng để khỏi tốn limit hai lần.
- Web làm đúng như kế hoạch: áp 10 mục C13 + màu v2 + viền mực trong MỘT lần dựng, xuất hai khổ có tiếng, nộp `qa/<phien_ban>/` mới kèm contact sheet và bảng tự chấm 10 mục (mỗi mục ghi mốc giây/khung). Sau đó gửi thư `web-…-nop-<phien_ban>.md` kèm SHA. KĐ Studio chấm trên khung.
- Sắp hết limit: dừng ở mốc gần nhất đã kiểm chứng, commit + push, cập nhật `DIEM-DUNG.md`, gửi `web-…-drop.md`.
