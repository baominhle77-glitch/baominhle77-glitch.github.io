# CLAUDE.md

Mọi phiên Claude (bất kể đăng nhập bằng tài khoản nào) làm việc trong repository này phải:

1. Đọc và tuân thủ @AGENTS.md (thứ tự đọc bắt buộc, khóa phạm vi, kiểm thử, bàn giao).
2. Đọc `docs/handover/DIEM-DUNG.md` **trước tiên** để biết việc đang dở, nhánh đang làm và bước tiếp theo.
3. Nếu `DIEM-DUNG.md` ghi một nhánh đang làm dở: làm tiếp trên **đúng nhánh đó** (fetch rồi checkout), không mở nhánh mới cho cùng việc.
4. Sau **mỗi lượt trả lời có thay đổi**: cập nhật `DIEM-DUNG.md`, commit và push ngay — container cloud có thể bị thu hồi và tài khoản có thể bị đổi bất cứ lúc nào; việc chưa push coi như mất.
5. Luôn trả lời bằng tiếng Việt, gọi chủ dự án là BaoMinh.
6. Khi code hoặc sửa Xưởng Video Mô Phỏng (`video-mo-phong/`): đọc 2 skill `.claude/skills/video-chat-luong-cao/SKILL.md` và `.claude/skills/kiem-chat-luong-video/SKILL.md` trước mỗi lượt code (lệnh GĐ Studio gd-20261024-1220, Chủ tịch duyệt).

7. **Sắp hết limit** (lệnh GĐ Studio 24/10/2026): dừng ở mốc gần nhất đã kiểm chứng, commit + push ngay, cập nhật `docs/handover/DIEM-DUNG.md` (đang làm gì, dừng ở đâu, bước tiếp theo, lệnh để chạy lại). Không để việc dở chưa push.
8. Liên lạc với GĐ Studio (Chủ tịch chọn phương án A): hộp thư `hop_thu/` trên nhánh `studio-hop-thu`. Web ghi `web-*.md`, GĐ ghi `gd-*.md`. Đọc thư mới khi bắt đầu phiên và trước khi báo xong mốc. Chi tiết: `docs/handover/LIEN_KET_STUDIO.md`. Hộp thư Artifact cũ thuộc nick cũ, không dùng nữa.

Quy trình đổi tài khoản chi tiết: `docs/handover/CHUYEN-TAI-KHOAN.md`.
