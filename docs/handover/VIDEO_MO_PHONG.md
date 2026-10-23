# XƯỞNG VIDEO MÔ PHỎNG — `/video-mo-phong/`

**Task tạo:** `EDU-20261023-01` (Claude Code, 23/10/2026)
**Đối tượng đọc của giao diện:** Public/User (giáo viên, người làm nội dung giáo dục). Không có dữ liệu nội bộ.

## Mục đích

Ứng dụng web tĩnh giúp dựng video giáo dục từ các mô phỏng khoa học, xem trước và xuất tệp video ngay trên trình duyệt. Không cần backend, không tải dữ liệu người dùng lên máy chủ.

## Cấu trúc

| File | Vai trò |
|---|---|
| `video-mo-phong/index.html` | Khung giao diện |
| `video-mo-phong/app.css` | Giao diện, responsive (≤900px chuyển 1 cột) |
| `video-mo-phong/sims.js` | Thư viện mô phỏng `window.EduSims.SIMS` |
| `video-mo-phong/app.js` | Kịch bản cảnh, dòng thời gian, vẽ phụ đề, lưu/mở dự án, xuất video |

## Mô phỏng hiện có

- Chung: cảnh tiêu đề/chữ.
- Vật lý: con lắc đơn (RK4, phi tuyến, có lực cản), ném xiên, sóng truyền trên dây.
- Sinh học: khuếch tán qua màng bán thấm (hạt có seed cố định).
- Y – Dược: dược động học đường uống nhiều liều (mô hình 1 ngăn, cộng chồng Bateman, vùng điều trị/độc), dịch tễ SIR (R₀, ngưỡng miễn dịch cộng đồng).

Thêm mô phỏng mới: khai báo một mục trong `SIMS` với `label`, `group`, `title`, `caption`, `params[]` và `create(values, durationSec)` trả về `{ step(dt), draw(ctx, box, t) }`. `step` luôn nhận bước cố định 1/60 s để xem trước và video xuất ra giống hệt nhau.

## Xuất video

- `canvas.captureStream(30)` + `MediaRecorder`; ưu tiên MP4 (H.264) nếu trình duyệt hỗ trợ, ngược lại WebM.
- Ghi theo thời gian thực; người dùng phải giữ tab mở. Tùy chọn thu giọng đọc từ micro trong lúc xuất.
- Đọc phụ đề bằng giọng máy (Web Speech) chỉ dùng khi xem trước — trình duyệt không cho ghi âm thanh này vào video.
- Khung hình: 16:9, 9:16, 1:1; chất lượng 720p/1080p.

## Lưu trữ

- Tự lưu `localStorage` khóa `video-mo-phong:v1` (có try/catch).
- Xuất/nhập dự án `.json`; dữ liệu nhập được làm sạch và kẹp trong giới hạn thông số.

## Kiểm thử đã chạy (23/10/2026)

- `node --check` cho `app.js`, `sims.js`.
- `node tools/check-public-content.mjs video-mo-phong` — OK.
- Chromium (Playwright): mở trang, chụp đủ 7 loại mô phỏng ở khung 16:9 và 9:16, không có lỗi console; xuất thử video 3 giây → tải về `.mp4` thành công.
- Chưa kiểm trên Safari/iPhone thật.

## Triển khai

Chưa được thêm vào bước build `_site` của `.github/workflows/deploy-pages.yml` vì workflow đang bị khóa bởi task `GROWTH-20260725-04`. Muốn đưa lên Cloudflare Pages cần một task riêng thêm dòng:

```
mkdir -p _site/video-mo-phong
cp video-mo-phong/index.html video-mo-phong/app.css video-mo-phong/app.js video-mo-phong/sims.js _site/video-mo-phong/
```

và thêm `video-mo-phong/index.html`, `video-mo-phong/app.js`, `video-mo-phong/sims.js` vào `DEFAULT_ROOTS` của `tools/check-public-content.mjs`.
