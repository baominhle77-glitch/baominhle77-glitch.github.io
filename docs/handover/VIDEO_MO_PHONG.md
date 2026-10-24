# XƯỞNG VIDEO MÔ PHỎNG — `/video-mo-phong/`

**Task tạo:** `EDU-20261023-01` (Claude Code, 23/10/2026) · **V2:** `EDU-20261023-02` (ý tưởng → kịch bản, phong cách, tối ưu tự động)
**Đối tượng đọc của giao diện:** Public/User (giáo viên, người làm nội dung giáo dục). Không có dữ liệu nội bộ.

## Mục đích

Ứng dụng web tĩnh giúp dựng video giáo dục từ các mô phỏng khoa học, xem trước và xuất tệp video ngay trên trình duyệt. Không cần backend, không tải dữ liệu người dùng lên máy chủ.

## Cấu trúc

| File | Vai trò |
|---|---|
| `video-mo-phong/index.html` | Khung giao diện |
| `video-mo-phong/app.css` | Giao diện, responsive (≤900px chuyển 1 cột) |
| `video-mo-phong/sims.js` | Thư viện mô phỏng `window.EduSims.SIMS` |
| `video-mo-phong/app.js` | Kịch bản cảnh, dòng thời gian, phụ đề tự chia đoạn, phong cách, tối ưu tự động, lưu/mở dự án, xuất video |
| `video-mo-phong/ai.js` | Ý tưởng → kịch bản: soạn lời nhắc cho Claude (bản chat), đọc câu trả lời dán vào, hoặc dựng kịch bản mẫu offline theo từ khóa |

## Mô phỏng hiện có

- Chung: cảnh tiêu đề/chữ, cảnh ý chính (gạch đầu dòng, tự thu nhỏ chữ cho vừa khung).
- Vật lý: con lắc đơn (RK4, phi tuyến, có lực cản), ném xiên, sóng truyền trên dây.
- Sinh học: khuếch tán qua màng bán thấm (hạt có seed cố định).
- Y – Dược: dược động học đường uống nhiều liều (mô hình 1 ngăn, cộng chồng Bateman, vùng điều trị/độc), dịch tễ SIR (R₀, ngưỡng miễn dịch cộng đồng).

Thêm mô phỏng mới: khai báo một mục trong `SIMS` với `label`, `group`, `title`, `caption`, `params[]` và `create(values, durationSec)` trả về `{ step(dt), draw(ctx, box, t) }`. `step` luôn nhận bước cố định 1/60 s để xem trước và video xuất ra giống hệt nhau.

## Ý tưởng → kịch bản (V3 — chỉ dùng hạn mức nick Claude)

**Quyết định của BaoMinh (24/10/2026):** không mua API/credit, chỉ dùng hạn mức nick Claude. Đường gọi API bằng khóa (V2) đã **gỡ bỏ** cùng SDK đóng gói; không đưa lại nếu chưa được BaoMinh yêu cầu.

- Người dùng nhập ý tưởng, người xem, giọng văn, độ dài mục tiêu, nền tảng (quyết định khung 16:9/9:16/1:1), ngôn ngữ, yêu cầu thêm.
- "📋 Sao chép lời nhắc": `EduAI.buildPrompt()` ghép thư viện cảnh (tự sinh từ `SIMS`), nguyên tắc biên kịch, yêu cầu của người dùng và định dạng JSON bắt buộc (một khối ```json). Người dùng dán vào claude.ai (hoặc phiên Claude Code bất kỳ) → chép nguyên câu trả lời → dán vào ô "Dán câu trả lời".
- `EduAI.parseScript()`: bóc khối JSON khỏi chữ xung quanh, chỉ sửa lỗi sao chép (ngoặc cong, dấu phẩy thừa) khi lần đọc đầu thất bại; nhận `params` dạng mảng `{key,value}` hoặc object.
- "Kịch bản mẫu nhanh": kịch bản offline theo từ khóa (so khớp nguyên cụm, không dấu).
- Mọi kịch bản đi qua `sanitizeScene()`: bỏ loại cảnh lạ, bỏ thông số lạ, kẹp thông số vào khoảng cho phép.
- "⚡ Dựng & xuất video luôn" = đọc bản dán → tối ưu → xuất video.
- App không gửi bất kỳ yêu cầu mạng nào ra ngoài.

## Bản thử trên claude.ai (Artifact, V3.1)

- Link thử (riêng tư, chỉ BaoMinh mở được): https://claude.ai/artifact/QWHDGZg8RMLkrj18mgVAbb — capabilities `sample` + `downloads`.
- Trang Artifact được sinh từ `video-mo-phong/index.html` (bỏ doctype/html/head/body, đưa `<title>` lên đầu); `app.css`, `sims.js`, `ai.js`, `app.js` đăng kèm qua `files`. Cập nhật: sinh lại trang rồi publish cùng URL.
- Trong Artifact: nút "✨ Viết kịch bản bằng Claude" gọi `claude.use("sample")` — chạy bằng **hạn mức nick của người đang xem**, không cần API; lần đầu claude.ai hỏi cho phép. Trên web thường nút này ẩn, dùng luồng sao chép/dán.
- Lưu video/.json qua `claude.use("downloads").save()` (người xem xác nhận); web thường dùng liên kết tải về.
- `confirm()/alert()` bị trình xem chặn nên app dùng hộp xác nhận `<dialog>` riêng (áp dụng cho cả web thường).
- Thu micro không dùng được trong Artifact (trình xem chặn thiết bị) — app tự xuất không tiếng.

## Phong cách & tối ưu tự động (V2)

- 6 chủ đề màu (`THEMES` trong `sims.js`), 4 kiểu chữ, màu nền/chữ/nhấn tùy chỉnh, cỡ chữ chung/tiêu đề/phụ đề, cỡ hình mô phỏng, tốc độ chuyển động, vị trí + kiểu phụ đề, chuyển cảnh, thanh tiến độ.
- Phụ đề dài tự chia đoạn theo câu/cụm từ (16 từ ngang, 12 vuông, 9 dọc), hiện theo thời gian tỉ lệ độ dài; tiêu đề/phụ đề tự thu nhỏ cho vừa khung; khung dọc chừa vùng an toàn trên/dưới.
- Thời lượng cảnh tự tính theo lời thoại (~2,5 từ/giây, mô phỏng ≥ 8 giây) trừ khi người dùng tắt "Tự tính".
- "🪄 Tối ưu tự động": cân thời lượng về độ dài mục tiêu (cảnh chữ chỉ kéo thêm tối đa 3–6 giây để tránh khoảng lặng, phần dư dồn vào cảnh mô phỏng), sửa màu chữ khi tương phản < 4,5:1 (WCAG), cảnh báo sai khung so với nền tảng, cảnh thiếu ý, lời thoại quá dài. Chạy lại nhiều lần cho cùng kết quả.

## Xuất video

- (Từ 24/10/2026, lệnh GĐ gd-20261024-1220) **đã bỏ MediaRecorder**. Xuất từng khung: `engine/xuat.js` → WebCodecs `VideoEncoder` (thử H.264 `avc1.640028`, không có thì VP9/AV1) + `vendor/mp4-muxer-5.2.2.js` (MIT); tiếng từ tệp giọng nạp vào (`AudioEncoder` AAC/Opus).
- Trang Xưởng `xuong.html` + `xuong.js`: bài thi K1 `bai/k1t2_60s.js`, dòng thời gian tua được (`engine/thoigian.js`), đồ thị cảnh + camera (`engine/canh.js`), phụ đề động (`engine/phude.js`), bộ hình K1 (`kenh/k1.js`).
- Bộ dẫn chứng QA: `qa-tools/bo_dan_chung.py` (ffmpeg, Pillow, numpy). Bản nộp đầu: `qa/20261024-1732_k1t2_60s/`.
- Đọc phụ đề bằng giọng máy (Web Speech) chỉ còn ở nút xem trước của trình soạn cũ — không đi vào bản xuất.
- Khung hình: 16:9, 9:16, 1:1; chất lượng 720p/1080p/1440p.

## Lưu trữ

- Tự lưu `localStorage` khóa `video-mo-phong:v2` (đọc được dự án cũ `v1`), mọi truy cập có try/catch.
- Xuất/nhập dự án `.json`; dữ liệu nhập được làm sạch và kẹp trong giới hạn thông số.

## Kiểm thử đã chạy (23/10/2026)

- `node --check` cho `app.js`, `sims.js`.
- `node tools/check-public-content.mjs video-mo-phong` — OK.
- Chromium (Playwright): mở trang, chụp đủ 7 loại mô phỏng ở khung 16:9 và 9:16, không có lỗi console; xuất thử video 3 giây → tải về `.mp4` thành công.
- Chưa kiểm trên Safari/iPhone thật.

### V2 (23/10/2026)

- `node --check` 3 file JS; `check-public-content video-mo-phong` OK (4 file); `validate-coordination` OK. File vendor `.mjs` không nằm trong phạm vi quét của checker (chỉ quét `.html`/`.js`).
- Chromium Playwright: kịch bản offline (chọn đúng mô phỏng theo ý tưởng, không bắt nhầm "tài liệu"/"nồng độ"); luồng Claude chạy với **API giả lập** bằng `page.route` — xác nhận request gửi `claude-opus-5-5`, effort `medium`, `fallbacks: "default"`, beta header, `json_schema`, stream, header truy cập trực tiếp từ trình duyệt; khóa sai (401) báo lỗi tiếng Việt; thông số lạ bị bỏ, `n=99` kẹp còn 20; đổi chủ đề/font/cỡ chữ/phụ đề; cảnh báo + tự sửa tương phản; tối ưu lặp lại không báo thay đổi giả; "Làm video tự động" tải về `.mp4`.
- (Phần API ở V2 đã gỡ ở V3.)

### V3 (24/10/2026)

- `node --check`, `check-public-content video-mo-phong` OK. Chromium: chặn khi chưa có ý tưởng; sao chép lời nhắc vào clipboard (4,9 nghìn ký tự, có ý tưởng và khối ```json); báo lỗi khi dán rỗng/không có JSON; dán câu trả lời có chữ bao quanh → dựng 4 cảnh, bỏ loại cảnh lạ; kịch bản mẫu; "Dựng & xuất video luôn" tải `.mp4`; **0 yêu cầu mạng ra ngoài**.
- Chưa thử với câu trả lời thật từ claude.ai.

## Triển khai

Chưa được thêm vào bước build `_site` của `.github/workflows/deploy-pages.yml` vì workflow đang bị khóa bởi task `GROWTH-20260725-04`. Muốn đưa lên Cloudflare Pages cần một task riêng thêm dòng:

```
mkdir -p _site/video-mo-phong
cp video-mo-phong/index.html video-mo-phong/app.css video-mo-phong/app.js video-mo-phong/sims.js video-mo-phong/ai.js _site/video-mo-phong/
```

Thêm `video-mo-phong/index.html`, `video-mo-phong/app.js`, `video-mo-phong/sims.js`, `video-mo-phong/ai.js` vào `DEFAULT_ROOTS` của `tools/check-public-content.mjs`.
