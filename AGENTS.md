# Quy tắc làm video cho mọi AI agent trong repo

## Phương án B — chốt 27/10

Lệnh Chủ tịch 27/10/2026: **từ nay mọi video dùng phương án B; bỏ phương án A.**

- Manim dựng mô phỏng/đồ thị riêng từng beat, không chữ. GitHub Actions dùng matrix song song, `fail-fast: false`; dựng 540p/30fps trước; cache pip, node_modules và media theo fingerprint của beat. Beat không đổi phải dùng lại cache; chỉ dựng lại beat đã sửa hoặc lỗi.
- Remotion ghép beat, phụ đề theo cụm nghĩa 2–5 từ khớp word timings TTS, tiêu đề, chuyển cảnh và clip thực tế/Gemini có nhãn. Bố cục 16:9 và 9:16 được thiết kế riêng. Theo bổ sung D18 mới nhất, clip dọc không được phóng quá1.0× nguồn: thiếu nguồn dọc/nét hơn thì chia đôi, giữ clip nguyên khổ phía trên và mô phỏng dọc phía dưới, không để dải trống quá8%.
- Hoàn thiện mẫu **60 giây ở cả hai khổ** tới **0 lỗi C13, C17 ít nhất 28/30 cửa sổ 2 giây ở từng khổ, FREEZE 0**, lời khớp hình; không nới cổng. Tự xem 3 khung mỗi beat ở 540p và MP4 thực trước khi báo. Lỗi còn thì tự sửa tiếp, không chờ GĐ.
- Khi mẫu đạt mọi cổng, gửi Chủ tịch xem và nhận xét; chỉ khi **Chủ tịch xác nhận CHỐT mẫu và cho phép dựng full** mới dựng cả tập, thời lượng >=480 giây. **CẤM dựng full trước xác nhận đó.** Không tự suy ra quyền dựng full từ CI xanh, PR mở, hay lời tự báo của agent.
- Dòng kết của báo cáo `CHỐT: lượt n/20` chỉ ghi số lượt; **không phải** quyết định duyệt mẫu của Chủ tịch.
- Công việc hiện tại ở nhánh `gpt/k1t3-B-remotion`, cùng PR #149. Không merge; không sửa nhánh `gpt/k1t3-c16-c17-01` của phiên khác.
- Không tự chạy workflow cũ dựng full, không thêm `[render-day-du]`, không xuất tập đầy đủ trong lúc chưa chốt mẫu.

Đây là ghi nhớ bền vững của repo cho Codex và các agent đọc `AGENTS.md`. Tệp này không tự thay đổi memory/custom instructions của tài khoản ChatGPT/Codex.

## D18 — Lỗi chung = cổng chung (27/10)

- Với mọi lỗi mới, tự hỏi: **có phụ thuộc nội dung không?** Không phụ thuộc thì thêm/siết kiểm tra trong `gate_chung/`, có mẫu hồi quy làm cổng đỏ trước khi sửa; có phụ thuộc thì sửa kế hoạch/nội dung trong `the_loai/` và bộ dựng cảnh tương ứng.
- `gate_chung/` chỉ nhận MP4, kế hoạch episode gồm beat/lời/TTS/phụ đề/vật thể/bbox/nhãn/nguồn/telemetry dựng, và JSON thể loại. Không import cảnh hay adapter K1. Ngưỡng G1–G9 dùng chung cho mọi thể loại; JSON thể loại cấm chứa ngưỡng, miễn trừ hay cấu hình cổng.
- Manim: updater sửa đối tượng nào thì đối tượng đó phải nằm trong nhóm động/updater được renderer theo dõi. Không sửa vật static từ updater của một hạt nhỏ rồi để Cairo cache mất diễn biến; G1 phải bắt lỗi này ở mọi thể loại.
- G1 phải đo khung cách4 giây sau khi bỏ chữ biên tập; vệt nhấp nháy/phụ đề thay không thay thế diễn biến mới. FREEZE>2s bị loại.
- G2 giữ ngưỡng C17 và kết luận >=28/30 cửa sổ2s cho60s, không đòi30/30; cửa sổ riêng trượt vẫn phải in ra. Mẫu20s dùng cùng tỷ lệ28/30 (ceil=>10/10). Không nới ngưỡng theo chủ đề.
- G3 đo khổ dọc, vật chính, dải trống/đen và độ nét so với khổ ngang. Clip thật/AI **không được phóng quá1.0×** theo pixel nguồn. Khi thiếu nguồn dọc/nét hơn, dùng bố cục chia đôi: clip nguyên khổ ở trên, mô phỏng Manim tương ứng ở dưới. Đo độ nét trên vùng clip thật; nhóm vật chính tính hợp các hàng pixel thực sự có vật, không tính khoảng nền giữa hai ô. Không gọi nội suy/upscale là nguồn có độ phân giải gốc cao hơn.
- G4–G7 đối chiếu TTS, cụm nghĩa, danh từ hình ảnh/thuộc tính, bbox chữ và nguồn với khung hình thật; G8 kiểm FFmpeg đầy đủ và concurrency hiệu lực phải bằng cấu hình đã chọn theo số lõi thật. Cấm giả số lõi hay ghi telemetry tự nhận đạt.
- Phiếu lượt11: G4 cấm phụ đề kể đồ hoạ (`arrow/orange/panel/label/diagram/sketch/zoom…`, tương đương tiếng Việt); phụ đề phải nói hiện tượng và khớp lời đọc. Nếu sửa ý thì sửa cả audio/mốc từ, không thay riêng chữ làm lệch tiếng. G7/C14 bắt buộc nhãn AI/tư liệu có `asset_id` đúng và bbox nằm trọn trong `render_bbox` của chính panel nguồn. Nhãn đặt trong góc trên-trái clip, không gắn lên mô phỏng hay khoảng giữa các panel. Cả hai quy tắc dùng chung mọi thể loại, có test hồi quy.
- G5 dùng vai từ chung cho số đo/đơn vị/thời gian/ngữ cảnh; số liệu phải khớp chữ hiện trên màn. Không bỏ danh từ thật chỉ vì có nghĩa động từ hoặc đứng trước giới từ: giữ `ship/boat`; cả10 đối chứng `bowl, pepper, arrow, ship, boat, film, wave, map, army, molecule` phải làm G5 đỏ khi có lời mà thiếu hình. Sửa dương tính giả phải giữ các đối chứng dương này.
- G6 đo đúng đồng hồ khung được giải mã, khoảng chữ lấy đầu vào/loại đầu ra; sai số dấu phẩy động ở ranh giới không được chọn câu của khung trước. Giữ nguyên kiểm tra vật thể cắt hộp chữ và test hồi quy vật cắt chữ.
- Công cụ C17 gốc nhận đúng540p. Video HD phải tạo đầu vào đo540p bằng scale đều, mã hóa lossless và giữ số khung/fps; cấm crop, kéo méo, upscale nguồn thấp hoặc thay ngưỡng. MP4 giao giữ nguyên. Kiểm hồi quy video HD đứng vẫn phải trượt sau chuẩn hóa.
- Hồ sơ đo/phụ đề/FFmpeg phải dùng chung root độ phân giải với MP4; kiểm đủ mốc từ trước khi mở browser. Dùng bộ đường dẫn chung, không ghi metadata1080p vào thư mục540p.
- G8 lấy số luồng thực từ callback `onStart.resolvedConcurrency`, đối chiếu với cấu hình đã chọn. In riêng desired/capacity/configured/effective; runner1 lõi chọn1 và phải thực chạy1.
- G9 chống méo tỉ lệ: mọi lớp ảnh/video phải có nguồn gốc/kích thước nguồn, bbox nội dung và viewport đo từ renderer. Chỉ scale đều; contain dùng min(W/w,H/h), cover dùng max và khai báo crop. Tĩnh lệch quá0,5% hoặc điểm ảnh nguồn–khung xuất lệch quá1% thì đỏ, in tên lớp và giây. Không kéo riêng trục X/Y trong panel Manim/FFmpeg/Remotion để lấp khung. Nguồn phải giữ hình học chuẩn trước khi bố cục; khổ dọc dùng khuôn fit/crop chung hoặc cảnh dọc riêng, không sửa hình dạng vật để lấp khung.
- Mọi CI xuất video phải chạy G1–G11; cổng đỏ thì job đỏ và vẫn upload báo cáo lỗi. Mẫu lịch sử giả lập20s phải chạy cùng chính các cổng này để giữ bằng chứng không lệ thuộc vật lý.

## Phiếu lượt13 — hiện tượng sống, G10/G11

- CI xanh không thay cho §8 của `docs/QUY_TAC_THAM_MY_VIDEO_KHOA_HOC.md`. Trước khi dựng đủ, xuất một khung540p mỗi beat, tự chấm vật liệu/ánh sáng/chiều sâu/góc máy/vật chính; kiểm đoạn động ngắn để phân biệt hiện tượng thật với sơ đồ. Sau dựng, xem6 khung mô phỏng mỗi beat và các mốc GĐ chỉ ra.
- Bộ dựng chung `ci/simulation/` cung cấp vật liệu, camera và vận chuyển; tên beat/nội dung/nguồn chỉ khai trong adapter của tập. Không dùng mặt màu phẳng, mũi tên hay đường tĩnh thay dòng chảy. Lỗi khuôn phải sửa trong bộ dựng chung.
- G10/G11 là cổng chung mọi thể loại, chạy trên cả hai khổ540p và1080p; không có ngưỡng/miễn trừ trong JSON thể loại. G10 đo CIE76 ΔE<3, loại vùng mô phỏng có>35% cùng màu suốt beat. G11 kiểm inventory overlay phi chữ và theo dấu bbox từ pixel thật; overlay đứng>2s trượt, metadata chuyển động giả không đủ để qua. Nền của hộp chữ thuộc lớp chữ; thiết bị/vật thể vật lý thuộc cảnh, không phải overlay biên tập.
- K1 lần này dùng>=400 mảnh tiêu méo (640), cỡ±40%, màu nâu/xám/đen và bóng mềm; yêu cầu mới này thay giới hạn<=400 của phiếu cũ. Tiêu chỉ nổi trên mặt. Hạt dò trong nước có màu/hình riêng, chạy theo ô tuần hoàn; không dùng tiêu làm hạt dò dưới mặt.
- Giữ nguyên ngưỡng C17/C13/G1–G9. Matrix540p trước, chỉ dựng native1080p sau cổng540p xanh. Cả1080p vẫn là mẫu60s; không tự dựng full hoặc merge.

## Quy trình chuẩn và KHUÔN v1 — 28/10

- Đọc `dao_tao/QUY_TRINH_CHUAN.md`; hướng dẫn cụ thể mới nhất là `khuon/HUONG_DAN.md` từ ref `codex-khung` (KHUON v1).
- GĐ sở hữu mã khuôn. Sáu tệp `khuon/ci/**/*.py` chép nguyên văn sang `ci/`; không sửa dù gặp lỗi. Không sửa `optical_water.py`, `transport.py`, `views.py` để vá riêng mẫu. Lỗi API khuôn phải ghi vào bảng `trao_doi/CODEX_NOI.md` cho GĐ.
- Codex viết nội dung ở `ci/remotion_b/ban_ve_B60.json`, đúng lược đồ v1 và mốc frame/TTS thật; không dùng mốc mẫu. Các nối ghép với Remotion/CI phải dùng bố cục và vùng chữ của bản vẽ, không thay thuật toán khuôn.
- Thứ tự CI: `kiem_khuon_sha` → `kiem_ban_ve` → render → G12 hai khổ → `gate_chung` (giữ G1–G11 hiện có). Lỗi ở bước trước dừng bước sau; vẫn lưu artifact chẩn đoán.
- Thử270p/15fps và kiểm bản vẽ trước khi đẩy. Mỗi lượt một commit; không đẩy chồng khi run trước chưa xong. Chi tiết L1–L8 và số đo ghi vào `CODEX_NOI.md`; trong chat chỉ trả một dòng SHA.
- XONG cần cả CI, GĐ kiểm mắt và Chủ tịch chốt mẫu theo D17. Không merge, không dựng full trước chốt.

## Chủ tịch chốt mẫu và giao FULL K1 t3 — 28/10

- Mẫu60s PR149 @0c07c71c đã được Chủ tịch CHỐT theo tin GĐ28/10 06:5x. Quyền dựng full hiện đã có cho **K1 t3 Marangoni**,35beat h1–k2, hai khổ,>=480s; không tự mở rộng quyền này sang tập khác.
- Làm trên nhánh mới `gpt/k1t3-full` từ0c07c71c, PR riêng vềmain; PR149 giữ làm mẫu đã chốt, không sửa hoặc merge.
- KHUÔN v1 giữ nguyên SHA và tên `ci/remotion_b/ban_ve_B60.json`; khi nguồn full sẵn sàng, nội dung tệp đó là bản vẽ full. Giọng Andrew, không làm chậm để kéo dài.
- Nguồn35beat được yêu cầu EN nguyên văn1441từ; nếu đối chiếu với L1–L8/G4 có mâu thuẫn, ghi đúng câu và mốc vào `CODEX_NOI.md`, không lén sửa nguồn hoặc nới cổng. XONG cần MP4 hai khổ,540p/1080p,>=480s và CI tất cả xanh.
