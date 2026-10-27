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
- `gate_chung/` chỉ nhận MP4, kế hoạch episode gồm beat/lời/TTS/phụ đề/vật thể/bbox/nhãn/nguồn/telemetry dựng, và JSON thể loại. Không import cảnh hay adapter K1. Ngưỡng G1–G8 dùng chung cho mọi thể loại; JSON thể loại cấm chứa ngưỡng, miễn trừ hay cấu hình cổng.
- Manim: updater sửa đối tượng nào thì đối tượng đó phải nằm trong nhóm động/updater được renderer theo dõi. Không sửa vật static từ updater của một hạt nhỏ rồi để Cairo cache mất diễn biến; G1 phải bắt lỗi này ở mọi thể loại.
- G1 phải đo khung cách4 giây sau khi bỏ chữ biên tập; vệt nhấp nháy/phụ đề thay không thay thế diễn biến mới. FREEZE>2s bị loại.
- G2 giữ ngưỡng C17 và kết luận >=28/30 cửa sổ2s cho60s, không đòi30/30; cửa sổ riêng trượt vẫn phải in ra. Mẫu20s dùng cùng tỷ lệ28/30 (ceil=>10/10). Không nới ngưỡng theo chủ đề.
- G3 đo khổ dọc, vật chính, dải trống/đen và độ nét so với khổ ngang. Clip thật/AI **không được phóng quá1.0×** theo pixel nguồn. Khi thiếu nguồn dọc/nét hơn, dùng bố cục chia đôi: clip nguyên khổ ở trên, mô phỏng Manim tương ứng ở dưới. Đo độ nét trên vùng clip thật; nhóm vật chính tính hợp các hàng pixel thực sự có vật, không tính khoảng nền giữa hai ô. Không gọi nội suy/upscale là nguồn có độ phân giải gốc cao hơn.
- G4–G7 đối chiếu TTS, cụm nghĩa, danh từ hình ảnh/thuộc tính, bbox chữ và nguồn với khung hình thật; G8 kiểm FFmpeg đầy đủ và concurrency hiệu lực phải bằng cấu hình đã chọn theo số lõi thật. Cấm giả số lõi hay ghi telemetry tự nhận đạt.
- Mọi CI xuất video phải chạy G1–G8; cổng đỏ thì job đỏ và vẫn upload báo cáo lỗi. Mẫu lịch sử giả lập20s phải chạy cùng chính các cổng này để giữ bằng chứng không lệ thuộc vật lý.
