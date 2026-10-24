# ĐIỂM DỪNG HIỆN TẠI — đọc đầu tiên khi mở phiên mới

> Cập nhật sau **mỗi lượt trả lời có thay đổi**. Ghi ngắn, đủ để một phiên/nick khác làm tiếp ngay. Không ghi mật khẩu, token, khóa.

**Cập nhật:** 24/10/2026 17:40 GMT+7 — Claude Code

## Việc đang làm

- **Dự án:** Xưởng Video Mô Phỏng — app web `video-mo-phong/` (nhập ý tưởng → kịch bản → phong cách → xuất video).
- **Đã phát hành:** PR #128 merge vào `main` (`d69e3c2`). App chạy lâu dài tại **https://baominhle77-glitch.github.io/video-mo-phong/** (GitHub Pages run 40014350114 SUCCESS; Cloudflare deploy run 40014351111 SUCCESS, không đổi nội dung Cloudflare).
- **Nhánh làm tiếp:** `claude/pensive-lovelace-96zjk7` đã được đặt lại từ `main` mới nhất; việc mới mở PR mới.
- **Task gần nhất:** `EDU-20261024-03` (phát hành) — completed.
- **Khóa đang giữ:** không có.
- **Tài liệu chi tiết:** `docs/handover/VIDEO_MO_PHONG.md`.
- **Link thử cho BaoMinh:** https://claude.ai/artifact/QWHDGZg8RMLkrj18mgVAbb (Artifact riêng tư; có nút viết kịch bản bằng Claude dùng hạn mức nick). Cập nhật: sinh lại trang từ `index.html` rồi publish cùng URL (xem `VIDEO_MO_PHONG.md`).

## VIỆC ĐANG LÀM — lệnh GĐ Studio gd-20261024-1220 (Chủ tịch duyệt 24/10), task `EDU-20261024-04`

Đọc lệnh trong hộp thư Artifact (collection `thu`, doc `gd-20261024-1220`); gói tài liệu ở collection `goi` (`gd-skill-web-v1`, `gd-goi-mau-v1`). Thư xác nhận + kế hoạch đã gửi: `web-20261024-1610`.
1. [x] M1: 2 skill nguyên văn ở `.claude/skills/` (sha8 cf4d69c3, 1be9ba54) + dòng 6 trong `CLAUDE.md`.
2. [x] M2: `docs/hoc_tu_ma_nguon.md` (hyperframes Apache-2.0, motion-canvas MIT, remotion chỉ khái niệm).
3. [x] M3: kiến trúc mới trong `video-mo-phong/`: timeline tua được + scene graph + camera + easing tự viết; xuất từng khung WebCodecs + mp4-muxer (H.264 nếu có, không thì VP9); nạp tệp giọng + words.json; bỏ MediaRecorder.
4. [x] M4: bài thi 60 s đầu `ho_so_mau` (K1 tập 2, beat h1–c1), 16:9 + 9:16 → **đã nộp** `qa/20261024-1732_k1t2_60s/` (commit `02c538e`). Tự chấm 32/39, không trượt mục cứng; A2 16:9 dài nhất 8,25 s / TB 6,0 s; 9:16 9,25 / 5,45; kiểm chữ 0 lỗi. Thư báo GĐ: `web-20261024-1740`. **Chờ GĐ chấm**; trượt mục nào thì chỉ sửa mục đó rồi nộp lại (qa/ phiên bản mới).
- **v2 đang làm** theo thư GĐ `gd-20261024-1650`, `-1652`, `-1705` (đọc sau khi nộp v1): nạp giọng thật `goi/gd-giong-k1t2-60s` (+ p1..p4 base64, kiểm sha256; beat h1 0/9.72, h2 10.22/13.776, h3 24.496/4.392, h4 29.388/24.72, c1 54.608/16.512 → bài ~71,62 s, cấm đổi tốc độ giọng); A2 mới: không khoảng nào > 4 s mà < 6 % khung đổi, bằng chuyển động có nghĩa (cấm rung giả); 9:16 bố cục dọc thật (vật 25–60 % chiều cao, không tràn lề 6 %, không sàn trống); phụ đề ≥ 2 từ/cụm, hộp + chữ đều tương phản ≥ 4,5:1; vũng theo profile meniscus góc θ (h = 2√(γ/ρg)·sin(θ/2)); 9:16 ~30 s không được chỉ 1 nhiệt kế; dòng nguồn ≥ 22 px, đậm hơn; chuyển beat bằng match-cut 0,4–0,7 s power3.inOut; tiêu đề < 6 từ vào bằng back.out(1.4)/stagger; qa/ thêm mp4 có tiếng 2 khổ, contact sheet 4 fps, bảng pixel-diff 0,25 s, 3 PNG giữa mỗi beat. Ghi giờ thư đúng đồng hồ.
- Còn nợ (ghi trong `tu_cham.md`): chưa có giọng edge-tts + words.json (D1 chỉ 1 điểm); móc câu tò mò chưa vào 0–5 s (A1); vài khung gần trống khi lia (A3); xuất ×0,92 thời gian thực (chưa nhanh hơn).
- Cách dựng lại bộ dẫn chứng: xuất 2 khổ từ `video-mo-phong/xuong.html` (hoặc `window.XUONG.xuatKho`), rồi `python3 video-mo-phong/qa-tools/bo_dan_chung.py qa/<phien_ban> v16.mp4 v9.mp4 stats16.json stats9.json meta.json` (meta = `chuyenCanh` của `taoBai` mỗi khổ).
- Ràng buộc: không API trả phí, không dịch vụ tốn credit, không khóa trong repo. Mỗi mốc gửi 1 thư (tu: web) kèm SHA + đường dẫn qa/.
- Đã biết: Chromium thử nghiệm không có H.264 encoder (chỉ VP9/AV1/Opus); chờ Studio gửi giọng edge-tts + words.json cho h1–c1.

## Trạng thái

- Xong source V1–V3; kiểm thử Chromium đạt. V3: sao chép lời nhắc → dán vào Claude (hạn mức nick) → dán câu trả lời vào app → dựng video.
- **Chưa** thử với câu trả lời thật từ claude.ai; **chưa** kiểm Safari/iPhone; trình xem Artifact của app Claude trên iPad báo "browser isn't supported" (giới hạn trình xem/iPadOS) → dùng link GitHub Pages.
- **Chưa lên production:** cần thêm thư mục vào build `_site` trong `.github/workflows/deploy-pages.yml`, nhưng file này đang bị khóa bởi task `GROWTH-20260725-04` (ChatGPT, heartbeat cuối 25/07/2026 — quá hạn khóa 24 giờ). Chờ BaoMinh xác nhận cho đóng task đó.

## Phối hợp với Studio (phiên "giám đốc dự án studio" trên máy Windows của BaoMinh)

- 24/10/2026 ~01:50: đã gửi trả lời cho GĐ Studio (session_01B5Cg4xVYBsBVrjtgTDcAnZ) về web, pipeline, phần dùng chéo và đề xuất liên kết B1–B4 (định dạng chung `edu-video-script/v1`, nút "Xuất gói cho Studio", adapter Manim phía Studio, skill dùng chung). **Chưa sửa gì vì Studio** — chờ BaoMinh/GĐ duyệt.
- Kênh liên lạc chính: Artifact "Hộp thư Studio ↔ Web" https://claude.ai/artifact/YAUssqJCUhige1U5pbyW7N — đọc bằng ArtifactData `list` collection `thu`; trả lời bằng `set` doc_id `web-YYYYMMDD-HHMM`, data `{tu:"web", luc, noi_dung}`. Tin nhắn trực tiếp GĐ → phiên cloud không tới được.
- 02:10: đã trả lời thư `gd-20261024-0205` (7 câu). Đã xin Studio: 1 hồ sơ tập mẫu ĐẠT, khuôn kênh, tiêu chí kiểm định hình/phụ đề. Chưa code B1/B2 — chờ BaoMinh duyệt. 02:40: đã báo GĐ là app bỏ đường API.

## Bước tiếp theo (chờ BaoMinh chọn)

1. Đưa app lên web (sau khi được phép đóng `GROWTH-20260725-04`) — các dòng cần thêm đã ghi trong `VIDEO_MO_PHONG.md` mục Triển khai.
2. Thêm mô phỏng mới (tim mạch, tương tác thuốc, hóa học…).
3. Thêm nhạc nền / chèn ảnh vào cảnh.
4. Mở PR cho nhánh hiện tại khi BaoMinh yêu cầu.

## Quyết định đã chốt với BaoMinh

- App chạy hoàn toàn trên trình duyệt, không backend.
- **KHÔNG dùng API trả phí, không mua credit** — chỉ dùng hạn mức nick Claude (24/10/2026). Kịch bản do Claude bản chat/Claude Code viết rồi dán vào app; đường API đã gỡ.
