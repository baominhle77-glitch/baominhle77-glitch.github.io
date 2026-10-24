# Tự chấm — bài thi k1t2 bản v2 (giọng thật, 72 s, khuôn K1)

- Bài: phần mở "What Soap Does to Water's Skin" (Meniscus Lab tập 2), beat h1 → c1, gói `gd-goi-mau-v1`. Sửa theo thư GĐ `gd-20261024-1650`, `-1652`, `-1705`.
- Thời gian lấy từ giọng thật của Studio (`goi/gd-giong-k1t2-60s`, edge-tts en-US-AndrewNeural). Đã kiểm sha256 sau khi ghép 4 mảnh: khớp `6f155694…`. Không đổi tốc độ giọng.
- Các beat: h1 0–9,72 s; h2 10,22–24,00 s; h3 24,50–28,89 s; h4 29,39–54,11 s; c1 54,61–71,12 s. Video dài 72,0 s.
- Mã: `video-mo-phong/bai/k1t2_60s.js`, `bai/k1t2_moc.js` (mốc từ), `bai/k1t2_giong.mp3`, `kenh/k1.js`, `engine/*`. Trang `video-mo-phong/xuong.html` tự nạp giọng này.
- Mọi khung trong thư mục được giải mã bằng ffmpeg từ CHÍNH tệp MP4 do web xuất từng khung. Công cụ: `video-mo-phong/qa-tools/bo_dan_chung.py`.

## Thư mục này có gì (thư 1705 mục 5 + barem mục 1)

| Tệp | Nội dung |
|---|---|
| `video_16x9.mp4`, `video_9x16.mp4` | Bản đầy đủ có tiếng, 72 s, H.264 + AAC |
| `mau_10s.mp4` | 10 s đầu 16:9, H.264, 1,26 MB |
| `to_khung_4fps_16x9.jpg`, `to_khung_4fps_9x16.jpg` | Tờ ghép 4 khung/giây, có nhãn giây |
| `bang_pixel_diff.csv` | Tỉ lệ điểm ảnh đổi mỗi 0,25 s, hai khổ, cột 0/1 = có tính là một lần đổi hình |
| `png_beat/` | 3 PNG ở 25 %, 50 %, 75 % của mỗi beat, hai khổ (30 tệp) |
| `khung_16x9/`, `khung_9x16/` | JPG ở các mốc barem + 3 khung đầu/giữa/cuối mỗi cú máy |
| `to_khung.jpg` | Tờ ghép các khung 16:9 ở trên |
| `do_luong.json` | Các trường barem; chi tiết từng khổ trong `chi_tiet.kho` |
| `kiem_chu.json` | Kiểm chữ mỗi 0,1 s: 0 lỗi ở cả hai khổ |

## Những điều phải nói trước

1. **Codec.** Chromium ở máy thử không có bộ mã hoá H.264, nên web tự xuất VP9 + Opus. Các tệp mp4 trong thư mục này là bản chuyển mã H.264 + AAC bằng ffmpeg từ chính tệp đó; hình không được dựng lại. Trên Chrome/Edge có H.264, web xuất H.264 + AAC trực tiếp.
2. **Tốc độ xuất** trên máy thử (không GPU): 82,3 s cho 72 s ở 16:9 (×0,87) và 84,5 s ở 9:16 (×0,85). Vẫn **chậm hơn thời gian thực**, còn nợ.
3. **Cách đo đổi hình.** Lấy mẫu 4 fps; một mẫu có > 6 % diện tích khác > 12/255 so với mẫu trước thì tính là một lần đổi hình. Không gộp các mẫu liền nhau, đúng cách GĐ đo trong thư 1650.
4. **Tương phản hộp phụ đề** (đo trên khung thật):
   - Chữ so với hộp: luôn ≥ 6:1.
   - Hộp so với nền ngay quanh hộp: trung vị 5,1:1. Thấp nhất 4,19:1 ở 16:9 (13,5 s). Ở 9:16 thấp nhất 2,33:1 (61,0 s), lúc vũng nước xanh đi ngang phía sau dải phụ đề. Hộp có viền sáng 3 px; viền so với hộp là 6:1.
   - Kết luận: yêu cầu "hộp ≥ 4,5:1" **chưa đạt ở mọi khung**.
5. **Cận cảnh có cắt vật.** Ở các cận cảnh có chủ đích (thước kẹp, mép nước, cốc, cân), vật ở rìa bị khung cắt ở cả hai khổ. Chữ và mũi tên thì không bị cắt: mũi tên chỉ vẽ trong phần đang thấy, chữ mờ đi trước khi chạm mép, vùng PiP hoặc dải phụ đề. Nếu GĐ coi việc cắt vật trong cận cảnh là "tràn lề", mình sẽ bỏ các cận cảnh đó ở 9:16.

## Mục cứng

| Mã | Kết quả | Dẫn chứng |
|---|---|---|
| H1 khung đứng yên > 3 s | ĐẠT | `khung_lap_lai_toi_da_giay` = 0,033 s ở cả hai khổ |
| H2 chữ tràn, bị che, chồng chữ | ĐẠT theo kiểm máy + soát tờ ghép | `kiem_chu.json` 0 lỗi; vùng PiP chỉ có nền kênh; chữ trong cảnh mờ đi khi lia qua dải phụ đề |
| H3 sai số liệu | ĐẠT | Số chép đúng storyboard. Chiều sâu vũng tính trong mã: h = 2ℓc·sin(θ/2), θ = 180° → nước 25 °C 5,43 mm, SDS 3,86 mm, chênh 1,57 mm. 25,0 mM × 288,38 g/mol = 7,21 g/L. Khung `khung_16x9/t_0021.0.jpg`, `t_0042.6.jpg`, `t_0065.7.jpg` |
| H4 API trả phí / lộ khoá | ĐẠT | Không gọi mạng khi dựng hay xuất; giọng là tệp edge-tts miễn phí của Studio |
| H5 MediaRecorder | ĐẠT | Xuất bằng `VideoEncoder` + `AudioEncoder` từng khung (`engine/xuat.js`) |

## Barem 13 mục (mốc giây theo video)

| Mã | Điểm | Lý do + dẫn chứng |
|---|---|---|
| A1 Móc câu 0–5 s | 2 | Có chuyển động ngay từ đầu (`t_0000.5.jpg`, `t_0002.5.jpg`):<br>• 0 s: cận cảnh dòng nước rót, vũng loang;<br>• 0,1–1,7 s: máy lùi ra;<br>• 2,35 s: thước kẹp đếm tới 5.45 mm.<br>Trừ 1: câu hỏi "deeper, or shallower?" tới 7,96 s mới hiện |
| A2 Nhịp đổi hình | 3 | 16:9: khoảng tĩnh dài nhất 3,75 s (từ 36,75 s), trung bình 1,16 s, 0 khoảng > 4 s. 9:16: 3,5 s / 1,24 s, 0 khoảng > 4 s (`bang_pixel_diff.csv`). Mỗi cú máy gắn với một từ khoá trong lời, không rung giả |
| A3 Cho thấy, đừng kể | 3 | Mỗi khẳng định có hình cùng lúc:<br>• "however much water we poured" (5,0–6,5 s): rót lần hai, vũng rộng ra, chiều cao giữ 5.45 (`t_0005.8.jpg`);<br>• 14,2 / 16,1 s: thanh γ đúng tỉ lệ 71.97 : 36.43;<br>• 20,8 s: 3.86 mm (`t_0021.0.jpg`);<br>• 30,7 s: nhiệt kế 20 → 25 °C;<br>• 38,4 s: tờ trích bài báo khi nói "inferred from one paper's text" (`khung_16x9/t_0040.0.jpg`);<br>• 40,8–42,6 s: cân đếm tới 7.21 g;<br>• 47–53 s: 5.45 → 5.43;<br>• 64,9 s: thước so 1.57 mm |
| A4 Vòng tò mò | 2 | Chương h1–h2 đủ vòng:<br>• hỏi (7,96 s) → dự đoán bằng 2 đường viền;<br>• giọt rơi, chạm mặt ở 10,17 s;<br>• kết quả "Shallower" → giải thích bằng thanh γ.<br>Trừ 1: câu hỏi h3 (27,4 s) được giải ở phần sau tập, ngoài bài thi; h4 là phần dựng phép thử, không có vòng riêng |
| B1 Mô phỏng thật | 3 | Mép vũng theo phương trình Young–Laplace 2D với góc θ, chiều cao từ γ, bề rộng theo bảo toàn thể tích. Đổi γ thì hình đổi theo luật:<br>• 10,2 s: giọt xà phòng (lò xo tắt dần + sóng lan);<br>• 54,6 s: vũng nước 25 °C biến thành vũng SDS;<br>• 47–53 s: 20 → 25 °C ra chênh rất nhỏ.<br>Ghi chú: bong bóng và phân tử SDS là hình minh hoạ, có ghi "our sketch" |
| B2 Đa dạng cảnh | 2 | Hơn 4 loại khối: thước kẹp, thanh so sánh, bộ đếm, đường viền dự đoán, bong bóng, nhiệt kế, cốc phân tử cận cảnh, tờ bài báo, cân + bình, hai kệ so sánh (9:16), thước so chênh. Trừ 1: 0–29 s vẫn là cùng một bàn và một vũng, chỉ đổi cú máy |
| B3 Chiều sâu | 3 | Ba lớp: bụi nền (parallax 0,25), bàn + vật (1), hạt mờ gần ống kính (1,35), cộng camera trôi chậm |
| C1 Easing | 3 | Cú máy dùng power3.inOut / expo.out / sine.inOut; chữ hiện power2.out, ẩn power2.in; tiêu đề ngắn so le 35 ms/ký tự với back.out(1.4). Tuyến tính chỉ dùng cho đại lượng vật lý (`mau_10s.mp4`) |
| C2 Chuyển cảnh liên tục | 3 | Không cắt cứng, không fade đen. Chuyển beat bằng match-cut 0,6 s power3.inOut:<br>• h3 → h4: màng bóng co lại thành bầu nhiệt kế (`t_0029.3.jpg` → `t_0029.9.jpg`);<br>• h4 → c1: vũng nước 25 °C biến thành vũng SDS (`t_0054.9.jpg` → `t_0055.4.jpg`);<br>• h1 → h2: giọt hoà vào mặt nước |
| C3 Độ mượt | 3 | `fps_dat` 30 = mục tiêu, 2160 khung; khung lặp tối đa 0,033 s |
| D1 Chữ và phụ đề | 2 | Đạt:<br>• phụ đề khớp từng từ của giọng thật;<br>• cụm 2–5 từ (16:9: 47 cụm; 9:16: 57 cụm; không cụm nào 1 từ);<br>• từ khoá gạch chân màu đại lượng;<br>• chữ/hộp ≥ 6:1, cỡ 46 / 50 px;<br>• 9:16 phụ đề ở 72 % chiều cao.<br>Trừ 1: hộp/nền chưa ≥ 4,5:1 ở mọi khung (mục 4 ở trên) |
| D2 Màu và nhận diện | 3 | Bảng màu K1, không thêm hex: xanh chỉ cho nước/chiều sâu, cam chỉ cho sức căng mặt. Viền xanh 28 px, phông Source Sans 3. Dòng nguồn 24 px có nền mờ mềm để đọc được trên điện thoại |
| D3 Hai khổ | 2 | Đạt: 9:16 bố cục lại thật:<br>• vật đặt trong dải 40–60 % chiều cao;<br>• so sánh 20/25 °C và nước/SDS dùng hai kệ xếp chồng (`khung_9x16/t_0049.0.jpg`, `t_0065.7.jpg`);<br>• lịch cú máy riêng; vùng an toàn [65,270,1015,1536].<br>Trừ 1: cận cảnh vẫn cắt vật ở rìa (mục 5 ở trên) |

**Tổng tự chấm: 34/39, không trượt mục cứng.** Điểm chính thức là điểm GĐ chấm từ video và khung hình.

## Còn nợ

- Hộp phụ đề so với nền: chưa đạt ≥ 4,5:1 ở mọi khung (D1).
- Đưa câu hỏi tò mò vào trong 0–5 s (A1).
- Cảnh 0–29 s đa dạng hơn (B2).
- Xuất nhanh hơn thời gian thực (Worker + OffscreenCanvas).
