---
name: kiem-chat-luong-video
description: Barem chấm và cách nộp dẫn chứng bằng khung hình cho mọi bản của Xưởng Video Mô Phỏng. Dùng sau mỗi lượt sửa có ảnh hưởng tới hình, trước khi báo GĐ Studio. Bản không có thư mục qa/ kèm khung hình bị coi là chưa nộp.
---

# Kiểm chất lượng video — barem + dẫn chứng

Lời tự báo cáo không phải dẫn chứng. Chỉ khung hình và tệp video xuất thật mới được chấm.

## 1. Bộ dẫn chứng phải commit cho mỗi phiên bản

Thư mục `qa/<YYYYMMDD-HHMM>_<ten_ngan>/` trong repo, gồm:

- `khung_16x9/` và `khung_9x16/`: JPG chất lượng 82, mỗi tệp ≤ 250 KB, xuất từ CHÍNH đường xuất video (không chụp màn hình xem trước), ở các mốc: 0,0 · 0,5 · 1,0 · 2,0 · 3,0 · 5,0 s, rồi mỗi 5 s tới hết, và thêm 3 khung giữa mỗi chuyển cảnh (đầu, giữa, cuối). Tên tệp `t_0005.0.jpg` (giây, 1 chữ số thập phân).
- `to_khung.jpg`: tờ ghép (contact sheet) toàn bộ khung 16:9 theo lưới, có nhãn thời điểm.
- `mau_10s.mp4`: 10 giây đầu bản 16:9, ≤ 3 MB, H.264. Dùng để chấm độ mượt (không có thì mục C bị 0).
- `do_luong.json`: `{fps_dat, so_khung, thoi_gian_xuat_giay, thoi_luong_video_giay, ti_le_nhanh_hon_thuc, khung_lap_lai_toi_da_giay, so_lan_doi_hinh, khoang_doi_hinh_dai_nhat_giay}`. Hai trường cuối tính tự động: so sánh khác biệt điểm ảnh giữa khung liên tiếp (lấy mẫu 4 fps; khác > 6 % diện tích = một lần đổi hình).
- `tu_cham.md`: điểm tự chấm theo barem mục 2, mỗi dòng dẫn tên tệp khung làm chứng.

## 2. Barem (mỗi mục 0–3 điểm; ĐẠT khi tổng ≥ 30/39 VÀ không trượt mục cứng)

| Mã | Tiêu chí | 3 điểm khi |
|---|---|---|
| A1 | Móc câu 0–5 s | Khung 0,5–3 s đã có hình chuyển động gây tò mò hoặc câu hỏi; không có tiêu đề tĩnh |
| A2 | Nhịp đổi hình | `khoang_doi_hinh_dai_nhat_giay` ≤ 10 và trung bình ≤ 7 |
| A3 | Cho thấy, đừng kể | Mỗi khẳng định hay con số trong lời có hình minh chứng cùng lúc (đối chiếu kịch bản với khung) |
| A4 | Vòng tò mò | Có ít nhất một chu trình hỏi → dự đoán → chạy → bất ngờ → giải thích trong mỗi chương |
| B1 | Mô phỏng thật | Đối tượng chuyển động theo luật (vật lý/số liệu), đổi tham số thì thấy khác biệt; không phải ảnh minh hoạ tĩnh |
| B2 | Đa dạng cảnh | Không hai cảnh liên tiếp dùng cùng bố cục; ≥ 4 loại khối khác nhau mỗi 60 s |
| B3 | Chiều sâu | Có đủ 3 lớp nền/giữa/trước, có parallax hoặc drift camera |
| C1 | Easing | Không có tween tuyến tính ở chữ/UI/camera (xem `mau_10s.mp4`) |
| C2 | Chuyển cảnh liên tục | ≥ 70 % chuyển cảnh là morph/đẩy camera/phóng to, không cắt cứng vô cớ |
| C3 | Độ mượt | `fps_dat` = fps mục tiêu, không giật hay khung lặp trong `mau_10s.mp4` |
| D1 | Chữ và phụ đề | Phụ đề động theo cụm 2–5 từ, khớp giọng, từ khoá tô màu; tương phản ≥ 4,5:1; cỡ đọc được trên điện thoại |
| D2 | Màu và nhận diện | Mỗi đại lượng một màu cố định; khớp khuôn kênh Studio (`khuon_kenh` trong gói mẫu) |
| D3 | Hai khổ | 9:16 bố cục lại thật (không chỉ cắt/co), tôn trọng vùng an toàn 14 % trên / 20 % dưới / 6 % hai bên |

**Mục cứng (trượt một mục là TRƯỢT cả bản):**
- H1: có khung đứng yên tuyệt đối > 3 s (`khung_lap_lai_toi_da_giay` > 3).
- H2: chữ tràn vùng an toàn hoặc bị che, chữ chồng chữ.
- H3: sai kiến thức hay số liệu so với kịch bản/nguồn.
- H4: dùng API trả phí, dịch vụ tốn credit, hay lộ khoá.
- H5: xuất bằng MediaRecorder/quay màn hình thay vì từng khung.

## 3. Bài thi đầu tiên

Dựng lại 60 giây đầu của hồ sơ mẫu trong gói `gd-goi-mau-v1` (khoá `ho_so_mau`), đủ cả 16:9 và 9:16, theo `khuon_kenh`. Nộp bộ dẫn chứng mục 1. GĐ Studio chấm bằng chính barem này; KĐ Studio có thể chấm chéo. Trượt thì chỉ sửa mục trượt rồi nộp lại.
