# D18: cổng chung G1–G9

Python package độc lập: không import Manim, Remotion, cảnh K1 hay adapter tập.
Mọi thể loại dùng cùng policy.py. the_loai/*.json chỉ có nội dung; thêm khóa
ngưỡng/cổng/miễn trừ làm schema đỏ.

Cài requirements.txt và Tesseract English; FFmpeg cần rawvideo/mp4/image2,
libx264/rawvideo/aac, fps/scale/format/freezedetect. Chuẩn bị NLP một lần:

    NLTK_DATA=work/gate_nlp python -m gate_chung.setup
    NLTK_DATA=work/gate_nlp python -m gate_chung \
      --video video.mp4 --plan plan.json --genre the_loai/lich_su.json --out report/

Exit0 chỉ khi tất cả cổng đạt. Luôn xuất gates.json, summary.md, by_second.md;
stdout in bảng giây từng cổng. Metadata sai/thiếu hoặc công cụ đo lỗi đều đỏ.

Kế hoạch gồm duration,format,beats(start/end,narration,words TTS,visual_terms),
objects(id,label,normalized bbox hoặc keyframes,start/end,primary,evidence),
texts(text,role,bbox,start/end,font_size,foreground,background,tts_span),
assets(kind,source,ai_label,landscape_reference), runtime(configured/effective
concurrency,desired,cpu_capacity). Bbox lấy từ bộ dựng thật, không tự kê đạt.
Detector object dùng màu/foreground theo registry, không có tên vật thể cố định
trong gate. Các nhãn được kiểm OCR và pixel; vật mới cần đăng ký trong kế hoạch,
không cần sửa G1–G8 theo đề tài. English dùng POS/WordNet; lời tiếng Việt phải
có noun spans trong kế hoạch, ngoài kiểm tra cụm nghĩa tiếng Việt dùng chung.

- G1: FREEZE và SSIM cấu trúc với khung4s trước, bỏ chữ biên tập; so cảnh với
  mọi beat trước. Dòng chữ thay hoặc hạt nhấp nháy không thay diễn biến mới.
- G2: nguyên toán C17,4fps,240×135,absdiff>6,bỏ pixel lặp>=60%; ngưỡng5/15/60.
  Kết luận>=28/30 cửa sổ, không30/30. Tập dài dùng mỗi30 cửa sổ liên tiếp;
  mẫu ngắn dùng ceil(N×28/30), nên20s cần10/10. Cửa sổ trượt vẫn in TRUOT.
- G3: ảnh dọc không có dải đen/nền trống>8%, vật chính>=60% chiều cao, đo
  Laplacian và tỷ lệ tần số cạnh trên riêng vùng clip thật so với bản ngang, loại chữ. Clip thật/AI không được phóng quá1.0× pixel nguồn. Thiếu nguồn thì chia đôi: clip nguyên khổ ở trên, mô phỏng tương ứng dưới; vật chính tính hợp hàng pixel của cùng nhóm, không tính nền trống. Nguồn mềm
  phải thay bằng bản dọc gốc hoặc nguồn tốt hơn; không nhận upscale là bản gốc.
- G4:2–5 từ/cụm, chặn kết cụm bằng giới từ/mạo từ/liên từ và đối chiếu TTS±0.2s.
- G5: coverage danh từ/thuộc tính với registry và pixel hiện lúc nói; long có
  bề ngang nhìn thấy>=15% khung, màu lấy từ lời không chỉ tự nhận trong plan.
- G6: nền nhãn, lề3%, caption>=28px tại540p; OCR, vật cắt hộp chữ và chữ chồng.
  Loại sai khác do subpixel font khi đo nền, không bỏ qua màu vật xâm nhập.
- G7: dòng nguồn phủ beat tư liệu và nhãn AI minh hoạ(...) phủ insert AI.
  Mỗi nhãn AI/tư liệu phải gắn đúng asset_id và nằm trọn trong render_bbox của
  chính panel clip thật. Nhãn ở panel mô phỏng hoặc cắt qua mép clip làm G7 đỏ.
- G4 chặn phụ đề tả đồ hoạ (arrow/orange/panel/label/diagram/sketch/zoom… và
  cụm tương đương tiếng Việt). Test cả hai lỗi ở tests/test_provenance_captions.py.
- G9: chống méo tỉ lệ, mọi khổ/mọi chủ đề. `layers` khai nguồn MP4/PNG gốc,
  start/end, content_bbox/viewport chuẩn hoá, scale_x/scale_y, source_crop,
  fit và crop_declared. Nguồn phải truy cập được khi đo. Kiểm tĩnh sai số0,5%;
  SIFT+RANSAC đo affine từ pixel nguồn sang pixel MP4, sai số hai trục tối đa1%.
  Không đủ điểm ảnh đối chiếu là đỏ. Cổng in tên lớp, giây, bbox thực và số đo.
  Các crop đồng đều khai báo đúng được chấp nhận; khai scale đều mà pixel bị kéo
  vẫn đỏ. Test mã hoá MP4 ở `gate_chung/tests/test_aspect.py` gồm kéo dọc1,3×,
  fit đều và cover-crop. Khuôn chung: `UniformVideo.tsx` và `ci/frame_layout.py`.
- G8: FFmpeg đủ chức năng,540p/30fps/thời lượng đúng; concurrency thực bằng
  cấu hình. Chọn cấu hình theo CPU thật trước render, không giả số lõi.

Mẫu lịch sử20s: Manim bản đồ/quân/đường đi, Remotion ghép chữ/lời Flite offline.
Chỉ là chiến dịch giả lập, không khẳng định một sự kiện lịch sử. Voice manifest
chứa clocks từ audio được ghép, không đoán timestamps từ độ dài câu.

Chạy regression: python -m unittest discover -s gate_chung/tests -v
Ví dụ adapter K1 nằm ngoài package ở ci/remotion_b/export_gate_plan.py;
đổi adapter/nội dung không đổi thuật toán hay ngưỡng G.
