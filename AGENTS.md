# Quy tắc làm video cho mọi AI agent trong repo

## Phương án B — chốt 27/10

Lệnh Chủ tịch 27/10/2026: **từ nay mọi video dùng phương án B; bỏ phương án A.**

- Manim dựng mô phỏng/đồ thị riêng từng beat, không chữ. GitHub Actions dùng matrix song song, `fail-fast: false`; dựng 540p/30fps trước; cache pip, node_modules và media theo fingerprint của beat. Beat không đổi phải dùng lại cache; chỉ dựng lại beat đã sửa hoặc lỗi.
- Remotion ghép beat, phụ đề theo cụm nghĩa 2–5 từ khớp word timings TTS, tiêu đề, chuyển cảnh và clip thực tế/Gemini có nhãn. Bố cục 16:9 và 9:16 được thiết kế riêng. Theo phiếu lượt 4, clip Gemini dọc crop lấp khung, không letterbox.
- Hoàn thiện mẫu **60 giây ở cả hai khổ** tới **0 lỗi C13, C17 ít nhất 28/30 cửa sổ 2 giây ở từng khổ, FREEZE 0**, lời khớp hình; không nới cổng. Tự xem 3 khung mỗi beat ở 540p và MP4 thực trước khi báo. Lỗi còn thì tự sửa tiếp, không chờ GĐ.
- Khi mẫu đạt mọi cổng, gửi Chủ tịch xem và nhận xét; chỉ khi **Chủ tịch xác nhận CHỐT mẫu và cho phép dựng full** mới dựng cả tập, thời lượng >=480 giây. **CẤM dựng full trước xác nhận đó.** Không tự suy ra quyền dựng full từ CI xanh, PR mở, hay lời tự báo của agent.
- Dòng kết của báo cáo `CHỐT: lượt n/20` chỉ ghi số lượt; **không phải** quyết định duyệt mẫu của Chủ tịch.
- Công việc hiện tại ở nhánh `gpt/k1t3-B-remotion`, cùng PR #149. Không merge; không sửa nhánh `gpt/k1t3-c16-c17-01` của phiên khác.
- Không tự chạy workflow cũ dựng full, không thêm `[render-day-du]`, không xuất tập đầy đủ trong lúc chưa chốt mẫu.

Đây là ghi nhớ bền vững của repo cho Codex và các agent đọc `AGENTS.md`. Tệp này không tự thay đổi memory/custom instructions của tài khoản ChatGPT/Codex.
