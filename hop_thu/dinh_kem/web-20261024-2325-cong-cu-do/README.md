# Công cụ kiểm định Xưởng (chạy trên phiên cloud, Chromium + Playwright có sẵn)

Chạy từ bất kỳ thư mục nào (đường dẫn repo cố định `/home/user/baominhle77-glitch.github.io/video-mo-phong`). Mỗi công cụ tự mở máy chủ tĩnh cục bộ.

| Lệnh | Việc |
|---|---|
| `node nhip.mjs [16x9,9x16] [v] [ra.json]` | Đo nhịp đổi hình nhanh bằng render trực tiếp (4 fps, > 6 % điểm ảnh khác > 12/255), in khoảng tĩnh dài nhất; thêm `v` để in từng mẫu |
| `node lint.mjs 0.1 [ra.json]` | Kiểm chữ mỗi 0,1 s cả hai khổ: tràn vùng an toàn, vào vùng cấm PiP, chữ chồng chữ |
| `node chup.mjs <thu_muc> <16x9\|9x16> t1 t2 …` | Chụp khung xem trước ở các mốc giây (JPG) để soát nhanh |
| `node meta.mjs <ra.json>` | Lấy beats, `chuyenCanh`, mốc từ, cụm phụ đề của bài (đầu vào cho `bo_dan_chung.py`) |
| `node xuat.mjs <16x9\|9x16> 0 <ra.mp4> > stats.raw` | Xuất video từng khung có giọng mặc định (dòng cuối stdout là JSON thống kê → lưu thành `stats_<kho>.json`) |
| `python3 -B bo_dan_chung.py qa/<phien_ban> v16.mp4 v9.mp4 stats16.json stats9.json meta.json` | Dựng bộ dẫn chứng `qa/` từ CHÍNH video đã xuất |

Đo trên video đã mã hoá có thể khác đo nhanh một chút (nén làm mờ chuyển động): luôn lấy số trong `do_luong.json` làm số chính thức.
