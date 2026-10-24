# Tự chấm C13 — k1t2 bản dựng lại theo C13 (20261025-0052)

- Bài: phần mở "What Soap Does to Water's Skin" (Meniscus Lab tập 2), dài 72 s, giọng thật của Studio (edge-tts, không đổi tốc độ). Làm theo thư GĐ `gd-20261024-2332` (toàn văn C13) và `gd-20261024-2348` (phiên session_0129 nhận lại việc).
- Mã nguồn: `video-mo-phong/bai/k1t2_60s.js`, `kenh/k1.js`, `engine/*`. Commit dựng bản này: **417253c** (nhánh `claude/pensive-lovelace-96zjk7`).
- Cách kiểm:
  - **Trước khi xuất:** `video-mo-phong/qa-tools/kiem_truoc.mjs`, kiểm trên canvas. Kết quả nằm ở `kiem_truoc.json`: in "ĐẠT TIỀN KỲ" ở cả hai khổ.
  - **Sau khi xuất:** `qa-tools/bo_dan_chung.py`, đo trên khung giải mã từ chính tệp video. Kết quả nằm ở `do_luong.json` và `bang_pixel_diff.csv`.
- Các tệp `khung_16x9/t_XXXX.X.jpg`, `khung_9x16/…` là khung ở giây XXXX.X, giải mã từ video.

## Bảng tự chấm 10 mục C13

| # | Mục C13 | Kết quả | Dẫn chứng (giây / khung) |
|---|---|---|---|
| 1 | Vật chính to, ở giữa vùng an toàn; không có vật nhỏ trong góc | ĐẠT (máy kiểm) + soát mắt | Mỗi cú máy đóng khung trọn một nhóm vật vào vùng vật của khổ. Kiểm cả mọi khung lúc máy đứng: có một vật ≥ 2,5 % khung, hoặc nhóm vật trải ≥ 55 % bề ngang vùng an toàn và lệch tâm < 15 %. Vật lớn nhất (trung vị): 16:9 11,4 %, 9:16 5,5 %. Ví dụ: cốc SDS `t_0032.6`, cân + bình `t_0042.2`, bong bóng `t_0028.0`, ống nhỏ giọt cận cảnh `t_0007.3`. **Lưu ý 9:16:** hai vũng so sánh đặt cạnh nhau trên một bàn (`khung_9x16/t_0049.0`, `t_0067.3`). Vũng thật rất dẹt (5 mm cao, ~45 mm rộng), nên mỗi vũng chỉ ~1–2 % khung dù cả cặp trải ~80 % bề ngang |
| 2 | Không vật nào bị khung cắt, trừ khi đang trượt vào/ra | ĐẠT (máy kiểm) | 0 lỗi ở cả hai khổ (`kiem_truoc.json` → `cat_mep` rỗng). Mỗi 0,25 s, máy chiếu hộp bao của từng vật trong sổ `VAT` qua camera. Vật chạm mép chỉ ở lúc máy đang lia: 16:9 ~54–55 s (vũng trái), 40,75 s (cân); 9:16 ~6,9 s (vũng dưới ống nhỏ giọt khi máy đang dí vào) |
| 3 | Không khoảng nào > 4 s mà đổi < 6 % điểm ảnh (4 fps) | ĐẠT | Đo trên video thật: khoảng tĩnh dài nhất **3,25 s** ở cả hai khổ (từ 34,25 s), **0 khoảng > 4 s**. Trung bình 1,18 s (16:9), 1,29 s (9:16). Có 60 / 55 lần đổi hình (`bang_pixel_diff.csv`, `do_luong.json`). Trước khi xuất: dài nhất 3,5 s ở cả 4 pha lấy mẫu |
| 4 | Chuyển động có nghĩa, không rung giả | ĐẠT | Mỗi cú máy neo vào một từ khoá của lời, ví dụ:<br>• "Now add soap" 6,7 s: cận ống nhỏ giọt;<br>• "Deeper, or shallower?" 7,9 s: lùi ra thấy hai đường viền dự đoán;<br>• giọt chạm 10,2 s: dí vào vũng;<br>• "the puddle" 50,0 s: lùi ra thấy cả hai vũng;<br>• "becomes 5.43" 52,0 s: cận vũng phải.<br>Máy chỉ trôi rất chậm (biên độ 5 px, chu kỳ ~27 s), không rung |
| 5 | Chuyển cảnh qua nền tối hoặc match-cut | ĐẠT | Match-cut:<br>• h3 → h4: zoom xuyên màng bóng (`t_0028.8` → `t_0029.9`), ra nhiệt kế;<br>• h4 → c1: vũng nước 25 °C biến thành vũng SDS (`t_0054.4` → `t_0055.4`).<br>Trong cùng beat: lia trên một bàn liền mạch, vật trượt vào/ra khung. Không có cắt cứng |
| 6 | Chiều sâu: bóng, phản chiếu, lớp gần/xa | ĐẠT | Các lớp:<br>• bóng đổ + phản chiếu dưới vật trên bàn (cốc, cân, bình, thước kẹp, nhiệt kế: `t_0042.2`, `t_0045.1`);<br>• bụi nền parallax 0,25;<br>• lớp hạt mờ gần ống kính;<br>• mặt bàn có độ đậm theo chiều sâu |
| 7 | Phụ đề theo cụm 2–5 từ | ĐẠT | Cụm nhỏ nhất 2 từ, lớn nhất 5 từ ở cả hai khổ (`kiem_truoc.json` → `cum_phu_de_min_max` = [2, 5]). Hiện nguyên cụm, từ khoá gạch chân màu đại lượng |
| 8 | Chữ nguồn ≥ 22 px ở 1080p | ĐẠT | Dòng nguồn 24 px, đậm 600, nền mờ mềm (`t_0032.6` góc phải trên) |
| 9 | Tự trích contact sheet | ĐẠT | Có các tệp:<br>• `to_khung_4fps_16x9.jpg`, `to_khung_4fps_9x16.jpg`: 4 khung/giây, có nhãn giây;<br>• `to_khung.jpg`: các khung mốc;<br>• `png_beat/`: 25/50/75 % mỗi beat.<br>Đã soát mắt một lượt; ghi chú ở mục "Soát mắt" |
| 10 | Màu v2 #3F6A9E / #D1834F + vignette mép 22 % (mép/giữa ≈ 0,78) | ĐẠT | Màu: xanh nước `#3F6A9E`, cam sức căng `#D1834F` (`kenh/k1.js`, hằng `K1`).<br>Vignette nhân độ sáng, mép còn 0,78. Đo trên video: so độ sáng sát trong viền với giữa, cùng một hàng (để loại gradient dọc của nền):<br>• 16:9: trung vị **0,769**;<br>• 9:16: trung vị **0,785** |

### Hai yêu cầu kèm theo

| Yêu cầu | Kết quả | Dẫn chứng |
|---|---|---|
| Viền mực 2 px quanh mọi khối, mũi tên, dấu cam | ĐẠT (theo mã) | `VIEN_MUC = 2` trong `kenh/k1.js`. Áp cho: mũi tên sức căng (`t_0014.4`, `t_0069.0`), thanh γ (`t_0016.4`), dấu chỉ, đầu phân tử SDS (`t_0034.8`) |
| Hộp phụ đề ≥ 4,5:1 ở mọi khung | ĐẠT (đo trên canvas, mỗi 0,25 s) | Lấy độ sáng giữa hộp, so với phân vị 10 % của dải điểm ảnh sát ngoài hộp: không mẫu nào < 4,5:1 ở cả hai khổ. Hộp mực có quầng sáng 12 px. Chữ so với hộp ≥ 6:1. **Lưu ý:** phép đo chạy trên canvas trước khi nén, không đo trên khung giải mã từ video |

## Soát mắt contact sheet (một lượt)

- Không thấy khung trống, không thấy chữ chồng hay chữ tràn mép.
- Vật chạm mép chỉ xuất hiện lúc máy đang lia (đã nêu ở mục 2).
- 9:16 khoảng 47–58 s và 64–72 s: hai vũng nằm ngang ở giữa khung, phía trên còn trống nhiều. Tiêu đề ngắn ("barely changes", "1.57 mm lower", "only the skin changes") lấp một phần. Nếu GĐ muốn vật to hơn ở 9:16, cách làm là xen cận cảnh từng vũng nhiều hơn (đã có ở 49 s và 52 s).

## Nói trước

1. **Codec.** Máy thử không có bộ mã hoá H.264. Web xuất VP9 + Opus; các tệp `video_*.mp4` ở đây là bản ffmpeg chuyển sang H.264 + AAC, không dựng lại hình. Tốc độ xuất: 103 s cho 72 s (×0,70), vẫn chậm hơn thời gian thực.
2. **Bài học đã đưa vào bộ kiểm tiền kỳ.** Lần xuất đầu (không nộp) đo trên video thật còn khoảng 5,25 s và 5,5 s, dù kiểm canvas báo 3,25 s.
   - Nguyên nhân: mẫu 4 fps của ffmpeg lệch pha ~0,2 s so với lưới kiểm. Một cú máy 0,5 s bị chia đôi thành hai mẫu, mẫu nào cũng < 6 %.
   - Đã sửa: `kiem_truoc.mjs` giờ đo nhịp ở 4 pha lấy mẫu. Đã thêm hai cú máy mạnh ở 6,7 s và 50,0 s.
3. **Mục 1 dùng phép đo của web.** C13 không cho con số, nên ngưỡng "2,5 % khung hoặc nhóm ≥ 55 % bề ngang" là web tự đặt. Điểm chính thức do GĐ chấm.
