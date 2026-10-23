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
| `video-mo-phong/ai.js` | Ý tưởng → kịch bản: gọi Claude (structured output JSON) hoặc dựng kịch bản mẫu offline theo từ khóa |
| `video-mo-phong/vendor/anthropic-sdk-0.132.0.mjs` | SDK chính thức `@anthropic-ai/sdk@0.132.0` (MIT) đóng gói ESM cho trình duyệt bằng esbuild; nạp lười khi bấm viết kịch bản |

## Mô phỏng hiện có

- Chung: cảnh tiêu đề/chữ, cảnh ý chính (gạch đầu dòng, tự thu nhỏ chữ cho vừa khung).
- Vật lý: con lắc đơn (RK4, phi tuyến, có lực cản), ném xiên, sóng truyền trên dây.
- Sinh học: khuếch tán qua màng bán thấm (hạt có seed cố định).
- Y – Dược: dược động học đường uống nhiều liều (mô hình 1 ngăn, cộng chồng Bateman, vùng điều trị/độc), dịch tễ SIR (R₀, ngưỡng miễn dịch cộng đồng).

Thêm mô phỏng mới: khai báo một mục trong `SIMS` với `label`, `group`, `title`, `caption`, `params[]` và `create(values, durationSec)` trả về `{ step(dt), draw(ctx, box, t) }`. `step` luôn nhận bước cố định 1/60 s để xem trước và video xuất ra giống hệt nhau.

## Ý tưởng → kịch bản (V2)

- Người dùng nhập ý tưởng, người xem, giọng văn, độ dài mục tiêu, nền tảng (quyết định khung 16:9/9:16/1:1), ngôn ngữ, yêu cầu thêm.
- **Có khóa API Claude của chính người dùng:** gọi `client.beta.messages.stream` với `model` mặc định `claude-opus-5-5` (cho chọn Sonnet 5.5/Haiku 5.5), `output_config.effort: "medium"`, `output_config.format` JSON schema (enum loại cảnh, theme, font), `fallbacks: "default"` + beta `server-side-fallback-2026-07-01` (chỉ Opus/Sonnet). Kiểm `stop_reason` refusal/max_tokens; lỗi SDK được dịch sang tiếng Việt theo lớp lỗi.
- Khóa chỉ nằm trong trình duyệt người dùng (localStorage nếu tick "Ghi nhớ"), gửi thẳng tới Anthropic; không qua backend của hệ thống. Không bao giờ đưa khóa của chủ sở hữu vào source.
- **Không có khóa:** kịch bản mẫu offline — so khớp nguyên cụm từ khóa (không dấu) để chọn mô phỏng; nội dung chung, UI ghi rõ cần tự sửa lời.
- Mọi kịch bản đi qua `sanitizeScene()`: bỏ loại cảnh lạ, bỏ thông số lạ, kẹp thông số vào khoảng cho phép.
- "⚡ Làm video tự động" = viết kịch bản → tối ưu → xuất video ngay.

## Phong cách & tối ưu tự động (V2)

- 6 chủ đề màu (`THEMES` trong `sims.js`), 4 kiểu chữ, màu nền/chữ/nhấn tùy chỉnh, cỡ chữ chung/tiêu đề/phụ đề, cỡ hình mô phỏng, tốc độ chuyển động, vị trí + kiểu phụ đề, chuyển cảnh, thanh tiến độ.
- Phụ đề dài tự chia đoạn theo câu/cụm từ (16 từ ngang, 12 vuông, 9 dọc), hiện theo thời gian tỉ lệ độ dài; tiêu đề/phụ đề tự thu nhỏ cho vừa khung; khung dọc chừa vùng an toàn trên/dưới.
- Thời lượng cảnh tự tính theo lời thoại (~2,5 từ/giây, mô phỏng ≥ 8 giây) trừ khi người dùng tắt "Tự tính".
- "🪄 Tối ưu tự động": cân thời lượng về độ dài mục tiêu (cảnh chữ chỉ kéo thêm tối đa 3–6 giây để tránh khoảng lặng, phần dư dồn vào cảnh mô phỏng), sửa màu chữ khi tương phản < 4,5:1 (WCAG), cảnh báo sai khung so với nền tảng, cảnh thiếu ý, lời thoại quá dài. Chạy lại nhiều lần cho cùng kết quả.

## Xuất video

- `canvas.captureStream(30)` + `MediaRecorder`; ưu tiên MP4 (H.264) nếu trình duyệt hỗ trợ, ngược lại WebM.
- Ghi theo thời gian thực; người dùng phải giữ tab mở. Tùy chọn thu giọng đọc từ micro trong lúc xuất.
- Đọc phụ đề bằng giọng máy (Web Speech) chỉ dùng khi xem trước — trình duyệt không cho ghi âm thanh này vào video.
- Khung hình: 16:9, 9:16, 1:1; chất lượng 720p/1080p/1440p.

## Lưu trữ

- Tự lưu `localStorage` khóa `video-mo-phong:v2` (đọc được dự án cũ `v1`), cài đặt AI ở `video-mo-phong:ai`; mọi truy cập có try/catch.
- Xuất/nhập dự án `.json`; dữ liệu nhập được làm sạch và kẹp trong giới hạn thông số.

## Kiểm thử đã chạy (23/10/2026)

- `node --check` cho `app.js`, `sims.js`.
- `node tools/check-public-content.mjs video-mo-phong` — OK.
- Chromium (Playwright): mở trang, chụp đủ 7 loại mô phỏng ở khung 16:9 và 9:16, không có lỗi console; xuất thử video 3 giây → tải về `.mp4` thành công.
- Chưa kiểm trên Safari/iPhone thật.

### V2 (23/10/2026)

- `node --check` 3 file JS; `check-public-content video-mo-phong` OK (4 file); `validate-coordination` OK. File vendor `.mjs` không nằm trong phạm vi quét của checker (chỉ quét `.html`/`.js`).
- Chromium Playwright: kịch bản offline (chọn đúng mô phỏng theo ý tưởng, không bắt nhầm "tài liệu"/"nồng độ"); luồng Claude chạy với **API giả lập** bằng `page.route` — xác nhận request gửi `claude-opus-5-5`, effort `medium`, `fallbacks: "default"`, beta header, `json_schema`, stream, header truy cập trực tiếp từ trình duyệt; khóa sai (401) báo lỗi tiếng Việt; thông số lạ bị bỏ, `n=99` kẹp còn 20; đổi chủ đề/font/cỡ chữ/phụ đề; cảnh báo + tự sửa tương phản; tối ưu lặp lại không báo thay đổi giả; "Làm video tự động" tải về `.mp4`.
- **Chưa gọi Claude thật** (môi trường kiểm thử chặn mạng ra Anthropic và không có khóa): cần một lần thử với khóa thật để xác nhận chất lượng kịch bản.

## Triển khai

Chưa được thêm vào bước build `_site` của `.github/workflows/deploy-pages.yml` vì workflow đang bị khóa bởi task `GROWTH-20260725-04`. Muốn đưa lên Cloudflare Pages cần một task riêng thêm dòng:

```
mkdir -p _site/video-mo-phong
mkdir -p _site/video-mo-phong/vendor
cp video-mo-phong/index.html video-mo-phong/app.css video-mo-phong/app.js video-mo-phong/sims.js video-mo-phong/ai.js _site/video-mo-phong/
cp video-mo-phong/vendor/anthropic-sdk-0.132.0.mjs video-mo-phong/vendor/LICENSE-anthropic-sdk.txt _site/video-mo-phong/vendor/
```

Lưu ý: file `.mjs` phải được phục vụ với MIME `text/javascript` (Cloudflare Pages làm sẵn). Thêm `video-mo-phong/index.html`, `video-mo-phong/app.js`, `video-mo-phong/sims.js`, `video-mo-phong/ai.js` vào `DEFAULT_ROOTS` của `tools/check-public-content.mjs`.
