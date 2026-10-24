# Tự chấm — bài thi đầu `k1t2_60s` (60 s đầu ho_so_mau, khuôn K1)

- Bài: 60 giây đầu "What Soap Does to Water's Skin" (Meniscus Lab tập 2), beat h1 → c1, gói `gd-goi-mau-v1`.
- Mã dựng: `video-mo-phong/bai/k1t2_60s.js` (bố cục + dòng thời gian), `video-mo-phong/kenh/k1.js` (bộ hình K1), `video-mo-phong/engine/*` (dòng thời gian tua được, đồ thị cảnh + camera, phụ đề động, xuất WebCodecs).
- Mọi khung trong thư mục này giải mã bằng ffmpeg từ CHÍNH tệp MP4 do trang `video-mo-phong/xuong.html` xuất từng khung (không chụp màn hình xem trước). Công cụ dựng bộ dẫn chứng: `video-mo-phong/qa-tools/bo_dan_chung.py`.
- `kiem_chu.json`: kiểm hộp bao chữ ở từng 0,1 s của cả hai khổ (tràn vùng an toàn, vào vùng cấm PiP, chữ chồng chữ). Kết quả: 0 lỗi ở 16:9 và 0 lỗi ở 9:16. Kiểm này chỉ xét chữ với chữ. Nét vẽ đè lên chữ thì mình soát bằng mắt trên tờ ghép, và đã sửa 3 chỗ trước khi nộp (xem mục "Đã sửa").

## Những điều phải nói trước (không giấu)

1. **Chưa có giọng đọc.** Studio chưa gửi tệp edge-tts và words.json, nên video câm. Phụ đề chạy theo mốc từ **ước lượng** (khoảng 2,5 từ/giây, chia theo âm tiết). Trang đã có sẵn ô nạp giọng và ô nạp mốc từ (`xuong.html`); có tệp là xuất lại được ngay, không phải sửa mã.
2. **Codec.** Bộ xuất thử H.264 `avc1.640028` trước. Chromium trong máy thử của mình không có bộ mã hoá H.264, nên tự lùi xuống VP9 (`vp09.00.40.08`). `mau_10s.mp4` là bản chuyển mã H.264 (libx264) từ chính tệp VP9 đó; hình không được dựng lại. Trên Chrome hoặc Edge của máy người dùng (có H.264), web xuất H.264 trực tiếp.
3. **Tốc độ xuất** trên máy thử (không GPU): 64,98 s cho 60 s video ở 16:9 (×0,923) và 62,93 s ở 9:16 (×0,953), **chậm hơn thời gian thực một chút**. Barem không chấm mục này, nhưng skill yêu cầu nhanh hơn thời gian thực, nên mình ghi rõ: việc này còn nợ (dự kiến chuyển sang Worker + OffscreenCanvas).
4. Số đo nhịp trong `do_luong.json` (mức trên cùng) là của bản 16:9. Số của 9:16 nằm trong `chi_tiet.kho.9x16`.

## Mục cứng

| Mã | Kết quả | Dẫn chứng |
|---|---|---|
| H1 khung đứng yên > 3 s | ĐẠT | `do_luong.json`: `khung_lap_lai_toi_da_giay` = 0,033 (16:9 và 9:16). Camera luôn trôi chậm (drift) |
| H2 chữ tràn, bị che, chồng chữ | ĐẠT (theo kiểm máy + soát mắt) | `kiem_chu.json` 0 lỗi; vùng cấm PiP 16:9 [1552,36,1884,246], 9:16 [62,266,438,508] chỉ có nền kênh (ví dụ `khung_16x9/t_0035.0.jpg`, `khung_9x16/t_0040.0.jpg`) |
| H3 sai số liệu | ĐẠT | Lời, nhãn, dòng nguồn chép đúng storyboard. Chiều sâu vũng tính bằng công thức 2ℓc trong mã (`sauVungMm`): nước 25 °C 5,43 mm, SDS 3,86 mm, chênh 1,57; 25,0 mM × 288,38 g/mol = 7,21 g/L. Xem `khung_16x9/t_0020.5.jpg`, `t_0045.0.jpg`, `t_0054.9.jpg` |
| H4 API trả phí / lộ khoá | ĐẠT | Không gọi mạng khi dựng hay xuất. Thư viện vendored: mp4-muxer 5.2.2 (MIT), phông Source Sans 3 (OFL) |
| H5 MediaRecorder | ĐẠT | Đã gỡ MediaRecorder khỏi toàn bộ `video-mo-phong/`. Xuất bằng `VideoEncoder` từng khung (`engine/xuat.js`). `speechSynthesis` chỉ còn ở nút "đọc thử" của trình soạn cũ, không đi vào bản xuất |

## Barem 13 mục

| Mã | Điểm | Lý do + khung làm chứng |
|---|---|---|
| A1 Móc câu 0–5 s | 2 | Từ 0,5 s đã có dòng nước đang rót, vũng loang, thước kẹp đếm tới 5.45 mm: "rót bao nhiêu cũng dừng ở 5,45" (`t_0000.5.jpg` → `t_0005.0.jpg`). Không có tiêu đề tĩnh. Trừ 1 vì câu hỏi tò mò "deeper, or shallower?" tới 8,1 s mới hiện (`t_0010.0.jpg`), muộn hơn cửa sổ 0–5 s |
| A2 Nhịp đổi hình | 3 | 16:9: khoảng dài nhất 8,25 s, trung bình 6,0 s (9 lần đổi hình). 9:16: 9,25 s / 5,45 s (10 lần). Mốc ở `do_luong.json` → `moc_doi_hinh_giay` |
| A3 Cho thấy, đừng kể | 2 | Số nói ra đều hiện cùng lúc: 5.45 mm trên thước kẹp (`t_0005.0.jpg`), thanh γ dài đúng tỉ lệ 71.97 : 36.43 (`t_0019.0.jpg`), 3.86 mm (`t_0020.5.jpg`), cân lên 7.21 g (`t_0045.0.jpg`), 5.45 → 5.43 mm (`t_0054.9.jpg`). Trừ 1: trong lúc lia camera giữa hai bộ đồ, có khung gần như trống đúng lúc lời đang nói ("a lab surfactant", `t_0033.8.jpg`; "That is seven", `t_0041.0.jpg`) |
| A4 Vòng tò mò | 2 | Chương h1–h2 đủ vòng: hỏi (`t_0010.0.jpg`) → dự đoán bằng 2 đường viền "deeper?/shallower?" → giọt xà phòng rơi → kết quả "shallower" → giải thích bằng thanh γ (`t_0019.0.jpg`). h3 mở câu hỏi thứ hai ("less pull, longer-lived film?", `t_0027.5.jpg`); câu này được giải ở phần sau tập, ngoài 60 s. Chương h4 là phần dựng phép thử công bằng, chưa có vòng riêng |
| B1 Mô phỏng thật | 2 | Chiều cao vũng tính từ γ, ρ, g. Khi γ giảm, vũng thấp xuống và loang rộng theo bảo toàn thể tích, có lò xo tắt dần và sóng lan (`t_0011.6.jpg` → `t_0020.5.jpg`). Đổi 20 → 25 °C ra chênh rất nhỏ, đúng số (`t_0050.0.jpg`). Trừ 1: bong bóng và phân tử SDS là hình minh hoạ có chuyển động, không phải mô phỏng (phân tử ghi rõ "our sketch", `t_0035.0.jpg`) |
| B2 Đa dạng cảnh | 2 | Có ≥ 4 loại khối trong 60 s: thước kẹp đo, thanh so sánh γ, bộ đếm số chạy, so sánh hai vũng cạnh nhau, cốc phân tử, cân + bình, nhiệt kế, zoom xuyên bong bóng (`t_0029.6.jpg`). Trừ 1: h1–h3 (0–29 s) dùng cùng một bàn và một vũng, chỉ thay góc máy |
| B3 Chiều sâu | 3 | Ba lớp: bụi nền (parallax 0,25), bàn + vật (1), hạt mờ gần ống kính (1,35), cộng camera trôi. Rõ nhất ở các cú zoom `t_0012.5.jpg`, `t_0029.6.jpg` |
| C1 Easing | 3 | Không có tween tuyến tính ở chữ, UI hay camera: power2/3, expo.out, back.out; hiện dần power2.out, ẩn dần power2.in (cả phụ đề). Tuyến tính chỉ còn ở bước nhảy 0 s và đại lượng vật lý. Xem chuyển động camera 6,4–7,6 s trong `mau_10s.mp4` |
| C2 Chuyển cảnh liên tục | 3 | 9/9 chuyển cảnh (16:9) là đẩy/lùi/lia camera hoặc zoom xuyên màng bóng; không có cắt cứng. Mỗi chuyển cảnh có 3 khung đầu/giữa/cuối trong `khung_16x9/` (ví dụ `t_0028.5.jpg` → `t_0029.6.jpg` → `t_0030.6.jpg`) |
| C3 Độ mượt | 3 | `fps_dat` 30 = mục tiêu, 1800 khung; không có chuỗi khung lặp (tối đa 0,033 s). Xem `mau_10s.mp4` |
| D1 Chữ và phụ đề | 1 | Có: phụ đề động theo cụm 2–4 từ (9:16 tối đa 3), từ khoá gạch chân màu đại lượng (cam = sức căng, xanh = chiều sâu), tương phản mực trên hộp nền ≈ 6,6 : 1, cỡ 46 px (16:9) và 50 px (9:16). Trừ 2: **chưa khớp giọng** vì chưa có tệp giọng, mốc từ chỉ là ước lượng (`t_0013.4.jpg`, `khung_9x16/t_0008.4.jpg`) |
| D2 Màu và nhận diện | 3 | Bảng màu K1: nền #8E969D→#A7ADB3, mực #1C232B, xanh #1F6FD1 chỉ cho nước/chiều sâu, cam #E8772E chỉ cho sức căng mặt. Viền xanh 28 px, phông Source Sans 3, nhãn có đường dẫn không khung, nguồn nhỏ góc trên phải (x ≤ 1538 ở 16:9). Dòng nguồn "inferred" sáng lên bằng chữ đậm + gạch mực, không dùng cam (`t_0040.0.jpg`) |
| D3 Hai khổ | 3 | 9:16 được bố cục lại thật: tỉ lệ px/mm, khoá camera, vị trí nhãn và số đo đều khác 16:9, có thêm nhịp cận cảnh riêng (`khung_9x16/t_0006.9.jpg`, `t_0007.9.jpg`). Vùng an toàn [65,270,1015,1536] = 6 % hai bên, 14 % trên, 20 % dưới; kiểm chữ 0 lỗi |

**Tổng tự chấm: 32/39, không trượt mục cứng → tự đánh giá ĐẠT (sát ngưỡng 30).** Điểm chính thức là điểm GĐ chấm từ khung hình.

## Đã sửa trong lượt này (trước khi nộp)

- A2 lúc đầu trượt: khoảng dài nhất 12,5 s (16:9) và 18,5 s (9:16). Đã thêm cú đẩy camera ở 6,4 s (16:9), thêm cận cảnh rồi lùi ra ở 6,4 s và 7,9 s (9:16), và cú đẩy vào cốc SDS ở 33 s + lùi ra ở 40 s.
- 9:16: đường dẫn nhãn "water, 20 °C" và dòng nước rót cắt qua số 5.45 mm → đổi chỗ nhãn, thu cỡ số móc câu.
- 9:16: dòng "puddle 3.86 mm (calculated)" đè lên thước kẹp → đưa lên trên số đo.
- 9:16: đường dẫn nhãn cốc cắt qua chữ nhãn kia → hai nhãn hiện lần lượt ở cùng một chỗ. Nhãn căn giữa: đường dẫn dừng ở mép chữ.
- 9:16: chữ "our sketch" sát hộp phụ đề → nâng lên.
- Gạch chân dòng nguồn đổi từ cam sang mực, để cam chỉ mang nghĩa "sức căng mặt".
- Hàm hiện/ẩn dùng chung trước đây mờ dần tuyến tính → đổi sang power2.out / power2.in (cả phụ đề), để mục C1 đúng thật.
- 16:9: nhãn "+ soap" chạm dòng nguồn ở 7,9–8,1 s (kiểm chữ bắt được) → hạ nhãn xuống dưới giọt.

## Còn nợ

- Nạp giọng edge-tts + words.json của Studio, xuất lại, chấm lại D1.
- Đưa móc câu tò mò vào trong 0–5 s (A1). Giảm các khung gần trống giữa những cú lia (A3).
- Xuất nhanh hơn thời gian thực (Worker + OffscreenCanvas).
