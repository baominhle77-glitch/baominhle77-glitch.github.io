# ĐIỂM DỪNG HIỆN TẠI — đọc đầu tiên khi mở phiên mới

> Cập nhật sau **mỗi lượt trả lời có thay đổi**. Ghi ngắn, đủ để một phiên/nick khác làm tiếp ngay. Không ghi mật khẩu, token, khóa.

**Cập nhật:** 25/10/2026 01:02 GMT+7 — Claude Code (session_0129 "web hiennhi") — ĐÃ NỘP bản C13

## Việc đang làm

- **Dự án:** Xưởng Video Mô Phỏng — app web `video-mo-phong/` (nhập ý tưởng → kịch bản → phong cách → xuất video).
- **Đã phát hành:** PR #128 merge vào `main` (`d69e3c2`). App chạy lâu dài tại **https://baominhle77-glitch.github.io/video-mo-phong/** (GitHub Pages run 40014350114 SUCCESS; Cloudflare deploy run 40014351111 SUCCESS, không đổi nội dung Cloudflare).
- **Nhánh làm tiếp (BaoMinh chốt 24/10):** luôn làm trên `claude/pensive-lovelace-96zjk7`, kể cả khi phiên mới được giao nhánh khác; việc mới mở PR mới.
- **Task gần nhất:** `EDU-20261024-03` (phát hành) — completed.
- **Khóa đang giữ:** không có.
- **Tài liệu chi tiết:** `docs/handover/VIDEO_MO_PHONG.md`.
- **Link thử cho BaoMinh:** https://claude.ai/artifact/QWHDGZg8RMLkrj18mgVAbb (Artifact riêng tư; có nút viết kịch bản bằng Claude dùng hạn mức nick). Cập nhật: sinh lại trang từ `index.html` rồi publish cùng URL (xem `VIDEO_MO_PHONG.md`).

## VIỆC ĐANG LÀM — lệnh GĐ Studio gd-20261024-1220 (Chủ tịch duyệt 24/10), task `EDU-20261024-04`

Đọc lệnh trong hộp thư Artifact (collection `thu`, doc `gd-20261024-1220`); gói tài liệu ở collection `goi` (`gd-skill-web-v1`, `gd-goi-mau-v1`). Thư xác nhận + kế hoạch đã gửi: `web-20261024-1610`.
1. [x] M1: 2 skill nguyên văn ở `.claude/skills/` (sha8 cf4d69c3, 1be9ba54) + dòng 6 trong `CLAUDE.md`.
2. [x] M2: `docs/hoc_tu_ma_nguon.md` (hyperframes Apache-2.0, motion-canvas MIT, remotion chỉ khái niệm).
3. [x] M3: kiến trúc mới trong `video-mo-phong/`: timeline tua được + scene graph + camera + easing tự viết; xuất từng khung WebCodecs + mp4-muxer (H.264 nếu có, không thì VP9); nạp tệp giọng + words.json; bỏ MediaRecorder.
4. [x] M4: bài thi 60 s đầu `ho_so_mau` (K1 tập 2, beat h1–c1), 16:9 + 9:16 → **đã nộp** `qa/20261024-1732_k1t2_60s/` (commit `02c538e`). Tự chấm 32/39, không trượt mục cứng; A2 16:9 dài nhất 8,25 s / TB 6,0 s; 9:16 9,25 / 5,45; kiểm chữ 0 lỗi. Thư báo GĐ: `web-20261024-1736`. **Chờ GĐ chấm**; trượt mục nào thì chỉ sửa mục đó rồi nộp lại (qa/ phiên bản mới).
- **v2 đang làm** theo thư GĐ `gd-20261024-1650`, `-1652`, `-1705` (đọc sau khi nộp v1): nạp giọng thật `goi/gd-giong-k1t2-60s` (+ p1..p4 base64, kiểm sha256; beat h1 0/9.72, h2 10.22/13.776, h3 24.496/4.392, h4 29.388/24.72, c1 54.608/16.512 → bài ~71,62 s, cấm đổi tốc độ giọng); A2 mới: không khoảng nào > 4 s mà < 6 % khung đổi, bằng chuyển động có nghĩa (cấm rung giả); 9:16 bố cục dọc thật (vật 25–60 % chiều cao, không tràn lề 6 %, không sàn trống); phụ đề ≥ 2 từ/cụm, hộp + chữ đều tương phản ≥ 4,5:1; vũng theo profile meniscus góc θ (h = 2√(γ/ρg)·sin(θ/2)); 9:16 ~30 s không được chỉ 1 nhiệt kế; dòng nguồn ≥ 22 px, đậm hơn; chuyển beat bằng match-cut 0,4–0,7 s power3.inOut; tiêu đề < 6 từ vào bằng back.out(1.4)/stagger; qa/ thêm mp4 có tiếng 2 khổ, contact sheet 4 fps, bảng pixel-diff 0,25 s, 3 PNG giữa mỗi beat. Ghi giờ thư đúng đồng hồ.
- **v2 ĐÃ NỘP** `qa/20261024-1848_k1t2_v2/` (video 2 khổ có tiếng, tờ ghép 4 fps, bảng pixel-diff, PNG mỗi beat, tự chấm 34/39). Thư GĐ `web-20261024-1854`. Đo trên video: khoảng tĩnh dài nhất 16:9 3,75 s, 9:16 3,5 s (0 khoảng > 4 s). Task EDU-20261024-04 đã đóng; nếu GĐ cho trượt mục nào thì mở task mới, chỉ sửa mục đó.
- Link chạy thật (sau khi gộp main): https://baominhle77-glitch.github.io/video-mo-phong/xuong.html
- Còn nợ v2 (ghi trong `tu_cham.md`): hộp phụ đề/nền chưa ≥ 4,5:1 ở mọi khung (D1); câu hỏi tò mò chưa vào 0–5 s (A1); 0–29 s cùng một bàn (B2); cận cảnh cắt vật (D3, chờ GĐ phán); xuất ×0,85–0,87 thời gian thực.
- Cách dựng lại bộ dẫn chứng: xuất 2 khổ từ `video-mo-phong/xuong.html` (hoặc `window.XUONG.xuatKho`), rồi `python3 video-mo-phong/qa-tools/bo_dan_chung.py qa/<phien_ban> v16.mp4 v9.mp4 stats16.json stats9.json meta.json` (meta = `chuyenCanh` của `taoBai` mỗi khổ).
- Ràng buộc: không API trả phí, không dịch vụ tốn credit, không khóa trong repo. Mỗi mốc gửi 1 thư (tu: web) kèm SHA + đường dẫn qa/.
- Đã biết: Chromium thử nghiệm không có H.264 encoder (chỉ VP9/AV1/Opus); chờ Studio gửi giọng edge-tts + words.json cho h1–c1.

## Trạng thái

- **25/10 01:02 — EDU-20261024-09 ĐÃ NỘP `qa/20261025-0052_k1t2_c13/`** (dựng từ commit 417253c). Video 2 khổ có tiếng, contact sheet 4 fps, `tu_cham.md` (bảng 10 mục C13 có mốc giây/khung), `kiem_truoc.json`. Đo trên video thật: khoảng tĩnh dài nhất 3,25 s cả 2 khổ, 0 khoảng > 4 s; vignette mép/giữa 0,769 (16:9) / 0,785 (9:16). Khoá đã đóng (completed). Thư nộp: `hop_thu/web-20261025-0105-nop-20261025-0052_k1t2_c13.md` (c9e0280, nhánh `studio-hop-thu`). **Chờ GĐ chấm**; trượt mục nào thì mở task mới, chỉ sửa mục đó.
  - Quy trình mới (CLAUDE.md luật 9): sửa → `node video-mo-phong/qa-tools/kiem_truoc.mjs` một lần → chỉ khi "ĐẠT TIỀN KỲ" mới xuất. Bộ kiểm giờ đo nhịp ở 4 pha lấy mẫu: lần xuất đầu lệch vì ffmpeg lấy mẫu lệch pha ~0,2 s.
  - Xuất: script trong scratchpad của phiên (`xuat.mjs`, `meta.mjs`; bản sao ở `hop_thu/dinh_kem/web-20261024-2325-cong-cu-do/` nhánh `studio-hop-thu`), rồi `python3 -B video-mo-phong/qa-tools/bo_dan_chung.py qa/<pb> v16 v9 s16 s9 meta`.

- **25/10 00:06 — EDU-20261024-09, session_0129 ("web hiennhi") tiếp bản C13 của session_01357 (commit 22db989).** Thêm: cú máy ≤ 0,5 s; nhãn SDS 16:9 sang trái cốc; tiêu đề kết lên trên; chữ cảnh tự mờ ở vùng dòng nguồn (`vungNguon` + `engine/canh.js`). Kiểm chữ 0 lỗi hai khổ. **Còn hở nhịp:** 16:9 2,5→7 s (cú `M.however`), 9:16 34,25→40,75 s (cú `M.millimolar + 0.75` không đủ 6 %). Sau đó: xuất 2 khổ có tiếng, dựng `qa/` + tự chấm 10 mục, thư `hop_thu/web-…-nop-….md`. Công cụ đo: `hop_thu/dinh_kem/web-20261024-2325-cong-cu-do/` (nhánh `studio-hop-thu`). **BaoMinh nhắc tiết kiệm limit: chỉ chạy đo 1 lượt sau mỗi đợt sửa.**

- **24/10/2026 23:53 — `EDU-20261024-09` TẠM DỪNG ở session_01357; khoá đã chuyển cho session_0129** (thư GĐ `gd-20261024-2348`: dùng hết limit nick Nhi trước; 01357 chỉ chạy lại khi GĐ nhắn hoặc có thư `web-…-drop.md` của 0129). Việc: dựng lại k1t2 một lần đủ C13 10 mục + màu v2 + viền mực 2 px + vignette 22 % (thư `gd-20261024-2332` mục 5; hộp thư = nhánh `studio-hop-thu`).
  - **XONG trong mã** (`video-mo-phong/bai/k1t2_60s.js`, `kenh/k1.js`, `engine/phude.js`, `engine/canh.js`):
    - Mục 1–2: mỗi cú máy đóng khung trọn một nhóm vật (`khung()` + vùng `F.vat`); sổ `VAT` (hộp bao thế giới theo t); các nhóm vật trên bàn cách xa nhau; ống nhỏ giọt trọn vẹn; thước kẹp đi theo mép vũng; hai vũng c1 trên CÙNG một bàn (bỏ kệ xếp chồng 9:16); bong bóng 9:16 bay cao 660. **Bộ kiểm cắt vật: 0 lỗi cả 2 khổ.**
    - Mục 3: chỉnh khung trong cùng nhóm 0,6 s power3.inOut, lệch dọc xen kẽ ±D (`D` 90/170 px), mặt bàn đậm hơn; thẻ "SDS molecule (our sketch)" ở "a lab surfactant"; phân tử SDS bơi lên xếp hàng ở mặt nước. **Đo nhanh 4 fps (khung JPEG, chưa nén video): 16:9 khoảng dài nhất 4,5 s từ 2,5 s — CÒN TRƯỢT; 9:16 4,25 s từ 34,25 s — CÒN TRƯỢT.** Các khoảng > 3 s: 16:9 từ 2,5 / 7,0 / 55,25 / 58,75 s; 9:16 từ 7,0 / 34,25 / 58,75 s.
    - Mục 6: bóng đổ + phản chiếu (`veBongDo`, `phanChieu`) cho thước kẹp, nhiệt kế, cốc, cân, bình.
    - Mục 7: phụ đề hiện cả cụm 2–5 từ, không mờ dần; hộp mực + quầng sáng 12 px (NEN_TREN) để hộp luôn ≥ 4,5:1 so với nền quanh nó (chưa đo trên khung).
    - Mục 8: dòng nguồn 24 px, đậm 600.
    - Mục 10: viền mực 2 px quanh mũi tên cam, thanh γ, đầu phân tử, gạch chân phụ đề, thẻ phân tử; dải giao thoa bong bóng bỏ màu cam; vignette mới `veVignette` (multiply, `MUC_VIGNETTE` 0,78) thay vignette cũ trong `veNen`, áp cả vùng PiP. **Chưa đo tỉ lệ sáng mép/giữa.**
  - **CÒN LẠI (theo thứ tự):**
    1. Sửa 2 khoảng > 4 s: 16:9 2,5–7,0 s (cú `however` đổi chưa đủ: thử chừa trời nhiều hơn hoặc tăng D); 9:16 34,25–38,5 s (cú `millimolar + 0.75`). Để dư biên vì video nén đo thấp hơn 0,5–1 điểm %.
    2. Đo vignette mép/giữa ≈ 0,78, chỉnh `MUC_VIGNETTE`.
    3. Soát tờ ghép bằng mắt: vị trí tiêu đề 9:16 (`TIEU_DE`), nhãn có bị đè không.
    4. Xuất 2 khổ có tiếng: `window.XUONG.xuatKho(kho, { giong: "macdinh" })`. Dựng `qa/<YYYYMMDD-HHMM>_k1t2_c13/` bằng `qa-tools/bo_dan_chung.py`, kèm `tu_cham.md` 10 mục C13 (mỗi mục ghi mốc giây/khung).
    5. Gửi thư `hop_thu/web-…-nop-<phien_ban>.md` kèm SHA, rồi đóng `EDU-20261024-09`.
  - **Lệnh chạy lại:** ở gốc repo chạy `python3 -m http.server 8765 --bind 127.0.0.1 &`, rồi `node video-mo-phong/qa-tools/kiem_cat_vat.mjs`. Đo nhịp: `node video-mo-phong/qa-tools/chup_khung.mjs /tmp/f16 16x9 4 & node video-mo-phong/qa-tools/chup_khung.mjs /tmp/f9 9x16 4; wait; python3 video-mo-phong/qa-tools/nhip_nhanh.py /tmp/f16; python3 video-mo-phong/qa-tools/nhip_nhanh.py /tmp/f9`. Chi tiết trong `qa-tools/README-C13.md`.

- **24/10/2026 23:20 — CẢNH BÁO hộp thư:** lệnh GĐ mới nhất (qua BaoMinh) nói hộp thư là **repo riêng tư** `baominhle77-glitch/studio-hop-thu` (nhánh main), khác với dòng EDU-20261024-08 bên dưới (nhánh `studio-hop-thu` trong repo này). Phiên cloud `session_01357…` thử: `git clone` repo riêng tư báo `could not read Username` (chưa cấp cho môi trường cloud), `add_repo` bị chặn quyền → đã báo `KHONG_VAO_DUOC_HOP_THU`. Khi vào được: đọc `README.md` + `hop_thu/gd-20261024-2320-mo-hop-thu.md`; C13 đủ 9 điều, màu K1 v2 #3F6A9E/#D1834F, vignette K1 22 %; nộp = push qa/ ở nhánh này rồi gửi `hop_thu/web-YYYYMMDD-HHMM-<chu-de>.md` kèm SHA; thư đầu kèm ý kiến về hộp thư; sắp hết limit gửi `web-...-drop.md`. **Có 2 phiên cloud cùng đẩy nhánh này** — luôn `git fetch` trước khi push.

- **24/10 19:31 — task EDU-20261024-08:** GĐ Studio nhắn 3 việc qua BaoMinh. (1) Dừng khi sắp hết limit → `CLAUDE.md` mục 7. (2) Liên kết: **Chủ tịch chọn phương án A** → hộp thư `hop_thu/` trên nhánh `studio-hop-thu` (Web ghi `web-*.md`, GĐ ghi `gd-*.md`); đã gửi thư đầu `hop_thu/web-20261024-1931-lien-ket-va-c13.md`; chi tiết `docs/handover/LIEN_KET_STUDIO.md`. (3) Luật C13: đã đổi màu K1 v2 (xanh #3F6A9E, cam #D1834F) trong `video-mo-phong/kenh/k1.js`; **chưa có toàn văn 9 điều**, đã xin GĐ. Nhận đủ thì áp một lượt cho k1t2, xuất lại 2 khổ, nộp `qa/` mới. **Bước tiếp:** `git fetch origin studio-hop-thu`, đọc thư `gd-*.md` mới.

- **24/10 tối:** trang soạn kịch bản rút còn 3 bước (EDU-20261024-07): ✨ Tạo video bằng Claude → bấm Copy trong Claude → quay lại tab là có video. Đang chờ BaoMinh quyết hướng "thư viện khối cảnh + kế hoạch cảnh JSON" cho Xưởng chất lượng cao.

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
