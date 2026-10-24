---
name: video-chat-luong-cao
description: Chuẩn bắt buộc khi code hoặc sửa bất kỳ phần nào của Xưởng Video Mô Phỏng (cảnh, mô phỏng, chuyển động, chữ, xuất video). Gồm kiến trúc dòng thời gian tua được, nguyên lý chuyển động, cách kể chuyện giữ chân người xem, thư viện miễn phí được phép dùng, và quy trình xuất từng khung hình. Đọc trước khi viết dòng code đầu tiên của mỗi lượt.
---

# Video chất lượng cao — chuẩn của Xưởng Video Mô Phỏng

Mục tiêu: video do web xuất ra phải ngang tầm video giáo dục mô phỏng của các kênh hàng đầu (Kurzgesagt, 3Blue1Brown, Veritasium, Primer) và web làm video hàng đầu (HyperFrames, Remotion, Motion Canvas). Chủ tịch đã xem bản hiện tại và chấm: đơn điệu, chất lượng thấp, không có mô phỏng thu hút. Mọi thay đổi từ nay phải khắc phục ba điểm đó, có dẫn chứng bằng khung hình (xem skill `kiem-chat-luong-video`).

Ràng buộc cứng: **không API trả phí, không dịch vụ tốn credit, không khoá bí mật trong repo.** Chỉ dùng thư viện mã nguồn mở hoặc miễn phí, chạy hoàn toàn trong trình duyệt.

## 1. Chẩn đoán bản hiện tại (đọc mã 24/10)

- `sims.js` có khoảng 8 khuôn cố định (title, bullets, pendulum, projectile, wave, diffusion, pk, sir). Kịch bản nào cũng bị nhét vào khuôn, nên mọi video trông như nhau.
- Vẽ tay bằng `fillRect`/`fillText`/`arc`. Có 0 chỗ dùng easing, lerp hay spring. Không lia/zoom camera, không chuyển cảnh, chữ đứng yên.
- Xuất bằng `MediaRecorder` + `captureStream`: quay theo thời gian thực, giật khi máy yếu, giới hạn 5 phút. Giọng `speechSynthesis` không được ghi vào tệp.

Không vá từng chỗ. Phải đổi kiến trúc theo mục 2.

## 2. Kiến trúc bắt buộc: dòng thời gian tua được + xuất từng khung

Học từ mã nguồn mở (mục 7). Nguyên tắc chung của các web xịn:

1. **Mọi thứ là hàm của thời gian.** Trạng thái khung hình chỉ phụ thuộc `t` (giây), không phụ thuộc thời gian thực hay số lần gọi. `render(t)` gọi ở bất kỳ `t` nào, theo bất kỳ thứ tự nào, cũng ra cùng một hình. Mô phỏng vật lý: tích phân với bước cố định từ 0 tới `t`, có bộ đệm các mốc đã tính (checkpoint mỗi 1 s) để tua nhanh.
2. **Một dòng thời gian chủ** (GSAP `gsap.timeline({paused:true})` hoặc tự viết) chứa mọi tween. Xem trước bằng `tl.seek(t)` + render; xuất bằng cùng đường đó. Xem trước và xuất là một code.
3. **Đồ thị cảnh (scene graph)** thay vì lệnh vẽ rời: mỗi đối tượng có `x, y, scale, rotation, opacity, color`, có cha-con. Camera là một node: lia/zoom/xoay bằng cách tween camera.
4. **Xuất từng khung, nhanh hơn thời gian thực**: với `i = 0..N-1`, đặt `t = i/fps`, `seek(t)`, render vào canvas, tạo `new VideoFrame(canvas, {timestamp: t*1e6})`, đưa vào `VideoEncoder` (WebCodecs, H.264 `avc1.640028`, mặc định của trình duyệt, miễn phí), ghép bằng `mp4-muxer` (MIT). Không giới hạn độ dài. Có thanh tiến trình, huỷ được, chạy trong Worker + OffscreenCanvas nếu được.
5. **Âm thanh:** cho người dùng nạp tệp giọng đọc (Studio làm giọng bằng edge-tts miễn phí ở máy, kèm mốc thời gian từng câu/từ). `AudioContext.decodeAudioData` → `AudioEncoder` (AAC hoặc Opus) → cùng muxer. Mốc câu/từ điều khiển phụ đề động và nhịp cảnh. Không dùng `speechSynthesis` cho bản xuất.
6. **Hai khổ 16:9 (1920×1080) và 9:16 (1080×1920) từ cùng một kịch bản**: bố cục theo ràng buộc (vùng an toàn, neo), không phải co giãn ảnh. 9:16 chừa 14 % trên, 20 % dưới, 6 % hai bên cho giao diện nền tảng.
7. **Cảnh là module dựng bằng khối** (giống HyperFrames registry): `{id, thoi_luong, khoi_dau(state), dung(tl, ctx)}`. Thư viện khối tối thiểu ở mục 5. Kịch bản JSON chọn và phối khối, không chọn một khuôn duy nhất.

## 3. Nguyên lý chuyển động (cấm vi phạm)

- **Không tween tuyến tính** cho UI, chữ hay camera. Vào: `power3.out`/`expo.out`. Ra: `power2.in`. Chuyển trạng thái: `power2.inOut`. Nảy nhẹ: `back.out(1.4)`. Tuyến tính chỉ dùng cho đại lượng vật lý thật (thời gian, vận tốc đều).
- **Thời lượng:** vi chuyển động 0,2–0,35 s; vào/ra phần tử 0,4–0,7 s; chuyển cảnh 0,6–1,0 s; lia camera 1,2–2,5 s.
- **So le (stagger):** danh sách hay nhóm xuất hiện lệch nhau 40–90 ms, không cùng lúc.
- **Báo trước + vượt đích (anticipation/overshoot)** cho chuyển động quan trọng; nhẹ, không lố.
- **Liên tục giữa các cảnh:** đối tượng của cảnh trước biến hình (morph) hoặc bay sang cảnh sau. Hạn chế cắt cứng; nếu cắt thì theo nhịp câu nói.
- **Camera sống:** luôn có trôi chậm (drift/parallax 1–3 %/10 s) để khung không bao giờ đứng yên tuyệt đối. Zoom vào chi tiết khi lời nói nhắc tới nó.
- **Ba lớp chiều sâu:** nền (gradient/hạt trôi chậm, mờ), giữa (mô phỏng), trước (nhãn, chữ, chú thích). Nền và trước chuyển động khác tốc độ (parallax).
- **Màu có nghĩa:** mỗi đại lượng một màu cố định suốt video; nhấn mạnh bằng độ sáng/viền phát sáng, không bằng đổi màu lung tung. Tương phản chữ ≥ 4,5:1.

## 4. Kể chuyện giữ chân người xem

- **0–5 s là móc câu:** mở bằng hình gây tò mò hoặc nghịch lý (hiện tượng lạ, câu hỏi, con số sốc) đang chuyển động. Cấm mở bằng tiêu đề tĩnh hay "Xin chào".
- **Nhịp đổi hình 6–10 s:** cứ 6–10 giây phải có thay đổi thị giác đáng kể (cảnh mới, zoom, đối tượng mới, đồ thị vẽ thêm, đổi góc). Khung đứng yên quá 3 s là lỗi.
- **Cho thấy, đừng kể:** khi lời nói khẳng định điều gì, mô phỏng phải đang chứng minh điều đó ngay trên màn hình. Con số nói ra phải hiện ra (đếm chạy, kim chỉ, thanh đo).
- **Vòng tò mò:** đặt câu hỏi → thử dự đoán (hiện 2–3 lựa chọn) → mô phỏng chạy → kết quả bất ngờ → giải thích. Lặp vòng này mỗi chương.
- **So sánh và thang đo:** đặt hai trường hợp cạnh nhau (chia đôi màn hình), hoặc đổi tham số trực tiếp để thấy khác biệt.
- **Phụ đề động (kinetic captions):** chữ hiện theo cụm 2–5 từ, khớp mốc giọng, từ khoá được tô màu đại lượng và nảy nhẹ. 9:16 đặt phụ đề ở 60–72 % chiều cao.
- **Kết chương có nhịp lặng ngắn** (0,5–1 s) rồi móc sang chương sau.

## 5. Thư viện khối tối thiểu cần có (tự viết hoặc dựa thư viện mục 6)

Chữ: tiêu đề động (tách ký tự/từ, so le), phụ đề động, nhãn chỉ có đường dẫn, bộ đếm số chạy, công thức hiện từng phần (KaTeX render ra SVG/ảnh rồi vẽ).
Đồ thị: đường vẽ dần theo thời gian, cột tăng có so le, trục co giãn mượt, điểm dữ liệu chạy theo mô phỏng.
Mô phỏng: vật lý rắn (Matter.js), hạt/chất lỏng (tự viết SPH đơn giản hoặc hạt), lò xo-con lắc, sóng, trường vectơ, quần thể/dịch tễ dạng chấm (từng cá thể di chuyển, không chỉ đường cong), mạch, quỹ đạo.
Chuyển cảnh: morph hình, đẩy/trượt có camera, phóng to vào chi tiết thành cảnh mới, mặt nạ tròn/quét.
Bố cục: chia đôi so sánh, phóng to khung chi tiết (lens), thẻ thông tin trượt vào, mũi tên chú thích vẽ dần.
Nền: gradient trôi, lưới mờ chuyển động, hạt bụi parallax, vignette.

## 6. Thư viện miễn phí được phép (nạp từ cdnjs/jsdelivr, ghim phiên bản)

- **GSAP 3** (miễn phí cả plugin từ 2025, kể cả thương mại): dòng thời gian, easing, SplitText, MorphSVG, MotionPath. Giấy phép GSAP không phải mã nguồn mở: đọc `gsap.com/standard-license` trước khi dùng. Nếu điều khoản cấm loại công cụ này thì thay bằng tự viết tween + easing (Penner) hoặc `animejs` (MIT).
- **Matter.js** (MIT): vật lý 2D. **Three.js** (MIT): 3D khi cần. **D3** (ISC): thang đo, trục, hình học dữ liệu. **KaTeX** (MIT): công thức. **lottie-web** (MIT): hoạt hình vector có sẵn. **mp4-muxer** (MIT): ghép MP4. **simplex-noise** (MIT): chuyển động tự nhiên.
- WebCodecs, OffscreenCanvas, Web Audio: API trình duyệt, miễn phí.
- Cấm: bất kỳ API trả phí hay cần khoá (TTS đám mây, AI tạo hình, render đám mây).

## 7. Học mã nguồn mở (đọc kiến trúc trước khi viết)

- `github.com/heygen-com/hyperframes` (Apache-2.0): cách biến HTML/CSS thành video tất định, cơ chế seek, registry khối, bước lint trước khi render. Được phép mượn mã nếu giữ thông báo bản quyền Apache-2.0.
- `github.com/motion-canvas/motion-canvas` (MIT): dòng thời gian bằng generator, signals, tween, cách tổ chức cảnh. Được phép mượn mã nếu giữ MIT.
- `github.com/remotion-dev/remotion`: CHỈ đọc để học khái niệm (`useCurrentFrame`, `interpolate`, `spring`, `Sequence`). Không chép mã (giấy phép riêng).
- `github.com/3b1b/manim` / ManimCommunity (MIT): cách 3Blue1Brown dàn cảnh toán học, `Transform`, `FadeIn`, camera.

Ghi lại những gì đã học vào `docs/hoc_tu_ma_nguon.md` trong repo (mỗi dự án: ý tưởng chính, tệp đã đọc, áp dụng vào đâu). Đây là bằng chứng của việc học.

## 8. Quy trình mỗi lượt sửa

1. Đọc skill này + `kiem-chat-luong-video`.
2. Chọn đúng một mục tiêu đo được (ví dụ "cảnh mở 0–5 s có móc câu chuyển động").
3. Code.
4. Xuất khung hình và tờ chấm điểm theo `kiem-chat-luong-video`, commit vào `qa/<phien_ban>/`.
5. Báo GĐ Studio qua hộp thư (collection `thu`) kèm đường dẫn `qa/<phien_ban>/` và điểm tự chấm. GĐ sẽ tự tải khung hình về xem; lời tự báo cáo không được tính là dẫn chứng.
