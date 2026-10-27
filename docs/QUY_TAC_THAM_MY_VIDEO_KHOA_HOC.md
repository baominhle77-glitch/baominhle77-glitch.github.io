# QUY TẮC THẨM MỸ VIDEO KHOA HỌC
*Bố cục · màu · kích thước · phân bổ · chuyển động · hook*

Bản 26/10/2026. Áp dụng cho mọi phòng HS/SX/KĐ, phiên web và GPT/GitHub.

Căn cứ gồm ba phần:
- nhận xét của Chủ tịch về K1 t3;
- số đo kênh mẫu Animated Physics (`out\_nghien_cuu\trinh_bay\00_HOC_TRINH_BAY.md`);
- nguồn ngoài ở mục 9.

---

## 0. K1 t3 hỏng ở đâu

| Lỗi | Dẫn chứng |
|---|---|
| Không có cảnh thí nghiệm thật | Cả 553 s chỉ có hình vẽ, kể cả 30 s mở đầu |
| Nhiều đoạn đứng hình | freezedetect: 39 đoạn đứng yên > 4 s, tổng 212 s, tức 38 % bản 16:9. Đoạn dài nhất 9,6 s |
| Chuyển động chỉ là mũi tên | Dòng chảy Marangoni được vẽ bằng mũi tên tĩnh, không có hạt hay chất lỏng chuyển động. Phóng to/thu nhỏ là ghép hình tĩnh, không phải máy quay di chuyển |
| Nhạt | Nền xám tối, tương phản thấp. Khối hình 9:16 chỉ chiếm khoảng 20 % chiều cao. 5 beat chỉ có chữ |

Vì vậy cần hai luật mới:
- **C16:** hook bằng thí nghiệm thật;
- **C17:** chuyển động phải là mô phỏng.

Toàn bộ quy tắc dưới đây đều có số để KĐ đo được.

---

## 1. Hook: 30 giây đầu (luật C16)

Người xem quyết định ở lại hay bỏ đi trong vài giây đầu. YouTube Analytics tách riêng chỉ số "giữ chân 30 s đầu" và "đường giữ chân" để đo đúng việc này (nguồn [3]).

1. **Giây 0–3:** mở thẳng bằng cảnh thí nghiệm hoặc hiện tượng THẬT gây tò mò.
   - Ví dụ Marangoni: giọt xà phòng làm tiêu đen chạy tán loạn, "nước mắt rượu" bò lên thành ly, thuyền giấy tự chạy nhờ xà phòng.
   - Cấm mở bằng logo, lời chào hay thẻ chữ.
2. **Giây 0–30:** có **2–3 clip thực nghiệm khác nhau**, mỗi clip 3–6 s, xen với một câu hỏi lớn ("Vì sao…?").
   - Nguồn được dùng: quay thật, tư liệu có giấy phép, hoặc clip Gemini tả thực.
   - Clip Gemini phải có nhãn góc "AI minh hoạ (Gemini)".
3. **Trong thân bài:** mỗi phần lớn (khoảng 60–90 s) quay lại ít nhất 1 clip thật để minh hoạ đúng điều đang nói.
   - Ví dụ: vừa giải thích xong công thức thì cho xem lại thí nghiệm "giờ đã hiểu".
4. **Cuối tập:** 1 clip thật tổng kết hoặc một ứng dụng ngoài đời.
5. Tổng số đoạn thực tế ≥ 5, trong đó ≥ 2 nằm trong 30 s đầu. Mức này cao hơn C14 cũ (≥ 3).
6. Mỗi clip thật đi kèm một mô phỏng giải thích nó, theo cặp "thấy → hiểu".

## 2. Chuyển động: mô phỏng, không ghép hình tĩnh (luật C17)

**Nguyên tắc gốc:** hiện tượng nào có chuyển động thì trên màn hình phải chuyển động theo đúng vật lý của nó.

| Hiện tượng | CẤM làm | PHẢI làm |
|---|---|---|
| Dòng chảy, Marangoni, đối lưu | Mũi tên tĩnh chỉ hướng | Hạt hoặc vệt màu trôi theo trường vận tốc (≥ 200 hạt). Mặt chất lỏng biến dạng theo thời gian |
| Rơi, dao động, va chạm | Hai hình "trước/sau" | Vật chạy bằng updater theo phương trình (dt), có quỹ đạo mờ phía sau |
| Phóng to vào phân tử, mặt cắt | Cắt sang ảnh to hơn | Máy quay bay vào liên tục 1–2 s, có ease-in-out (`MovingCameraScene`, `frame.animate.scale().move_to()`) |
| Lực, sức căng | Mũi tên đứng yên | Mũi tên co giãn theo đại lượng thật (ValueTracker). Vật bị kéo đi theo |
| Đồ thị, công thức | Hiện cả khối một lúc | Vẽ dần theo lời, điểm chạy trên đồ thị đồng bộ với mô phỏng bên cạnh |

Số đo bắt buộc:
- **Không khoảng nào > 2 s mà màn hình hoàn toàn đứng yên.**
  - Đọc công thức được tối đa 4 s, và trong 4 s đó vẫn phải có một chuyển động phụ.
  - Ngưỡng hiện tại của C13(3) là "4 s đổi < 6 %".
- **Tổng thời gian đứng yên ≤ 10 % thời lượng,** đo bằng `freezedetect=n=0.001:d=2`. K1 t3 hiện ở mức 38 %.
- Mỗi beat có ≥ 1 chuyển động CHÍNH (vật hoặc hiện tượng) và ≥ 1 chuyển động PHỤ:
  - chuyển động phụ có thể là máy quay trôi chậm 2–5 %/10 s, hạt nền, hoặc ánh sáng;
  - "camera trôi chậm" là kỹ thuật của chính kênh mẫu: quỹ đạo 3D và HUD ngay từ 0:00.
- Mũi tên và nhãn chỉ được dùng **chồng lên** một mô phỏng đang chạy, không bao giờ là chuyển động duy nhất.

Các nguyên tắc hoạt hình phải áp dụng, chọn từ 12 nguyên tắc Disney (nguồn [1]):
- **Ease in/out:** mọi chuyển động tăng tốc và giảm tốc. Cấm tốc độ đều kiểu máy (Manim: `rate_func=smooth` hoặc `there_and_back_with_pause`).
- **Arcs (quỹ đạo cong):** vật tự nhiên đi theo đường cong.
- **Anticipation → action → follow-through:** báo trước, hành động, rồi dư âm. Ví dụ: giọt rơi, mặt nước lõm, gợn sóng lan.
- **Secondary action:** trong lúc vật chính chạy, nền có chuyển động nhỏ.
- **Timing:** vật nặng chậm, vật nhẹ nhanh; tốc độ khớp nhịp lời đọc.
- **Squash & stretch:** giọt và mặt chất lỏng phải méo khi va chạm, kéo giãn khi chảy.

## 3. Bố cục

1. **Quy tắc 1/3** (nguồn [2]): đặt vật chính hoặc điểm nóng tại giao điểm các đường 1/3. Chữ đặt ở phần 1/3 còn lại.
   - Chỉ căn giữa khi có một vật duy nhất cần nhấn mạnh tối đa.
2. **Vật chính chiếm 40–70 % chiều cao khung,** ở cả 16:9 và 9:16.
   - Bản 9:16: khối hình chính phải chiếm ≥ 45 % chiều cao. K1 t3 hiện chỉ 20 %.
   - Bản 9:16 dựng lại bố cục dọc (hình trên, chữ dưới), không thu nhỏ bản ngang.
3. **Vùng an toàn:**
   - lề mọi phía ≥ 3 %;
   - 9:16: tránh dải đáy khoảng 20 % và cột phải khoảng 12 %, vì nút và chữ của Shorts/Reels/TikTok nằm ở đó;
   - con số này là ước lượng, SX đo lại trên ảnh chụp thật của từng nền tảng trước khi chốt.
4. **Một điểm nhìn mỗi lúc:** chỉ một vùng sáng hoặc chuyển động mạnh nhất. Mọi thứ khác tối và mờ đi (signaling, nguồn [4]).
5. **Chữ cạnh hình:** chú thích nằm sát vật nó nói, cách tối đa khoảng 10 % khung. Cấm để chú thích ở góc xa (spatial contiguity [4]).
6. **Chiều sâu:** ≥ 3 lớp (nền xa mờ, vật chính, chữ hoặc HUD gần), có bóng đổ. Nhắc lại từ C13(6).

## 4. Màu sắc

1. **Tỉ lệ 60-30-10:**
   - 60 % màu nền;
   - 30 % màu phụ (vật, khối);
   - 10 % màu nhấn, chỉ dùng cho thứ đang được nói tới.
2. **Tối đa 1 nền + 2 màu chính + 1 màu nhấn** mỗi cảnh, lấy từ bảng v2 của kênh (`LUAT_BAN_SAC_KENH.md` §2a). Không tự thêm hex.
3. **Tương phản chữ/nền ≥ 4,5:1,** chữ lớn ≥ 3:1 (WCAG 2.1, nguồn [5]). Nền xám tối của K1 t3 phải sáng lên hoặc thêm gradient để vật nổi.
4. **Màu có nghĩa:** một đại lượng giữ một màu suốt tập. Ví dụ K1: xanh nước cho trọng lực, cam cho sức căng mặt. Đổi màu = đổi đại lượng.
5. **Cảnh thật và cảnh vẽ phải nối mềm:** chỉnh màu clip thật hơi ngả về tông kênh, chuyển cảnh qua tối hoặc match-cut (C13(5)).

## 5. Kích thước chữ (ở 1080p)

| Loại | 16:9 | 9:16 |
|---|---|---|
| Tiêu đề / câu hỏi lớn | ≥ 64 px | ≥ 72 px |
| Chữ chính, nhãn đại lượng | ≥ 44 px | ≥ 52 px |
| Chữ phụ, đơn vị | ≥ 32 px | ≥ 40 px |
| Chữ nguồn | ≥ 22 px (C13(8)) | ≥ 26 px |
| Phụ đề | Cụm 2–5 từ (C13(7)), cao ≈ 5 % khung | Cụm 2–5 từ (C13(7)), cao ≈ 5 % khung |

Thêm:
- Mỗi màn tối đa khoảng 12 từ chữ trên hình, không tính phụ đề.
- Lời đọc không đọc lại nguyên văn khối chữ trên màn (redundancy, nguồn [4]).

## 6. Phân bổ và nhịp

1. **Đổi hình mỗi 4–8 s.** Đổi hình là cảnh mới, góc máy mới, hoặc một vật mới xuất hiện. Kênh mẫu đo được 4–14 lần/phút.
2. **Cắt cứng ít,** 0,7–2 lần/phút như kênh mẫu. Còn lại chuyển qua tối, fade hoặc match-cut.
3. **Chia đoạn 60–90 s,** mỗi đoạn có một ý (segmenting, nguồn [4]):
   - mở bằng câu hỏi;
   - giữa có mô phỏng;
   - kết bằng clip thật hoặc kết quả số.
4. **Mỗi 60–90 s có một "điểm thưởng"** để kéo lại người xem: clip thí nghiệm mới, cú đảo bất ngờ, hoặc so sánh đời thường.
5. Phân bổ hình cho một tập 8–10 phút:
   - khoảng 15 % thời lượng là cảnh thực tế;
   - khoảng 60 % là mô phỏng chuyển động;
   - khoảng 15 % là công thức hoặc đồ thị vẽ dần;
   - ≤ 10 % là thẻ chữ.
   - Cấm beat chỉ có thẻ chữ dài hơn 3 s.
6. Nghiên cứu 6,9 triệu lượt xem video học trên edX (Guo và cộng sự 2014, nguồn [6]) cho thấy:
   - người xem bám lâu hơn với video có người nói xen hình, nhịp nói nhanh và nhiệt;
   - người xem bám lâu hơn với hình vẽ dần (kiểu Khan Academy) so với slide tĩnh.
   - Đây là lý do mặt thật PiP và hình vẽ dần cùng có mặt.

## 7. Cách làm trong Manim (cho SX/GPT)

- **Dòng chảy:** `VGroup` khoảng 300 `Dot` nhỏ, mỗi chấm có `add_updater(lambda m, dt: m.shift(v(m.get_center())*dt))`, trong đó `v` là trường vận tốc Marangoni (từ vùng sức căng thấp sang vùng cao). Có thể dùng thêm `StreamLines(...).start_animation()`.
- **Mặt chất lỏng:** `always_redraw` một `ParametricFunction` có biên độ theo `ValueTracker` và thời gian.
- **Phóng to:** `MovingCameraScene`, `self.play(self.camera.frame.animate.scale(0.3).move_to(p), run_time=1.5)` (nguồn [7]).
  - Bản 3D dùng `ThreeDScene.move_camera` và `begin_ambient_camera_rotation(rate=0.05)`.
- **Đại lượng sống:** `ValueTracker` + `DecimalNumber` + mũi tên `always_redraw` có độ dài tỉ lệ đại lượng.
- **Giọt và va chạm:** squash/stretch bằng `stretch` theo vận tốc; gợn sóng là các vòng `Circle` lan ra và mờ dần.

## 8. Phiếu chấm cho KĐ (thêm vào C13)

| # | Mục | Cách đo | Ngưỡng |
|---|---|---|---|
| H1 | Hook thật | Xem 0–30 s | ≥ 2 clip thực nghiệm khác nhau; clip đầu bắt đầu trước giây 3 |
| H2 | Clip thật trong thân bài | Đếm theo beat | ≥ 5 cả tập, mỗi đoạn lớn ≥ 1, có nhãn/nguồn |
| M1 | Đứng hình | `ffmpeg -vf freezedetect=n=0.001:d=2` | Tổng ≤ 10 % thời lượng; không đoạn nào > 4 s |
| M2 | Mô phỏng thật | Xem 3 beat có chuyển động | Hạt, chất lỏng hoặc vật chạy theo vật lý; chỉ có mũi tên = TRƯỢT |
| M3 | Camera | Xem các cảnh phóng to | Máy quay bay liên tục có easing; ghép hình to/nhỏ = TRƯỢT |
| B1 | Cỡ vật chính | Khung beat | 40–70 % chiều cao; 9:16 ≥ 45 % |
| B2 | Màu | Đo hex và tương phản | Đúng bảng v2; chữ ≥ 4,5:1 |
| B3 | Nhịp | Đếm đổi hình | Mỗi 4–8 s; thẻ chữ ≤ 3 s |

Thiếu bất kỳ mục nào = TRƯỢT.

## 9. Nguồn

1. 12 nguyên tắc hoạt hình (Thomas & Johnston, *The Illusion of Life*, 1981): https://en.wikipedia.org/wiki/Twelve_basic_principles_of_animation
2. Quy tắc 1/3: https://en.wikipedia.org/wiki/Rule_of_thirds
3. YouTube, giữ chân khán giả: https://support.google.com/youtube/answer/9314415
4. Mayer, R. E., *Multimedia Learning* (Cambridge University Press, bản 3, 2020). Các nguyên tắc signaling, segmenting, coherence, spatial/temporal contiguity, redundancy.
5. WCAG 2.1, mục 1.4.3 Contrast (Minimum): https://www.w3.org/TR/WCAG21/
6. Guo, Kim & Rubin, "How video production affects student engagement", ACM Learning@Scale 2014: https://dl.acm.org/doi/10.1145/2556325.2566239
7. Manim, MovingCameraScene: https://docs.manim.community/en/stable/reference/manim.scene.moving_camera_scene.MovingCameraScene.html
8. Số đo nội bộ:
   - kênh mẫu Animated Physics rC4i66wL3gQ, trong `out\_nghien_cuu\trinh_bay\00_HOC_TRINH_BAY.md`;
   - freezedetect K1 t3, trong `out\_giam_doc\a1e_k1t3\phieu_pr144_v3.md`.

Các link 1, 2, 3, 5, 7 đã kiểm trả HTTP 200 ngày 26/10. Link 6 chặn máy đọc (403), nhưng bài là bài hội nghị có thật, đã được trích dẫn rộng rãi. Vùng an toàn 9:16 ở mục 3.3 là ước lượng, cần đo lại trên ảnh chụp thật.

### Bổ sung D17/D18 theo phiếu r13

Mô phỏng phải cho thấy hiện tượng đang xảy ra. Trước khi dựng đủ, chấm khung540p
mỗi beat theo §8; sau dựng, xem6 khung mô phỏng/beat và khung từ MP4 thật.
Vật liệu cần ánh sáng, chiều sâu và chuyển động của chính vật/hiện tượng;
mũi tên hoặc hình học tĩnh không thay thế được chuyển động đó. Camera/frustum
có thể đổi giữa các khổ, nhưng không thay kích thước vật lý của vật để lấp khung.

G10 áp mọi thể loại: trong ROI mô phỏng, >35% pixel cùng màu CIE76 ΔE<3 xuyên
suốt beat thì trượt. G11: overlay biên tập phi chữ có bbox pixel đứng>2s thì
trượt; inventory phải từ renderer, metadata chuyển động giả không đủ. Giữ
nguyên C17: TB>=5%, vùng gộp>=15%, >=60% cặp có>=3%; kết luận>=28/30 cửa sổ.
Cổng không tự chấm thẩm mỹ thay người xem. Mẫu60s phải được Chủ tịch chốt
trước mọi lần dựng full>=480s.

Artifact r13 phải có tờ ghép đúng0.5/5/11.5/17/22/30/40/50/59.4s ở cả hai khổ.
