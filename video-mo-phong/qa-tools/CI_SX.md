# CI phòng SX — máy GitHub tự kiểm và render (25/10)

Workflow: `.github/workflows/video-mo-phong-sx.yml`.

1. **Mở PR** từ nhánh `gpt/<k>t<n>-01` vào `claude/pensive-lovelace-96zjk7`, có đụng `video-mo-phong/**`. Máy sẽ:
   - chạy `kiem_truoc` (2 khổ) và `kiem_cat_vat` (2 khổ);
   - chụp khung 540p mỗi 2 s;
   - ghép thành tờ, đẩy lên nhánh `qa-khung/pr-<số>`;
   - bình luận kết quả cùng link ảnh vào PR.

   Mỗi lần đẩy thêm commit, máy chạy lại.
2. **Khi máy ĐẠT**, KĐ chấm C13 trên các tờ ghép.
3. **Khi KĐ ĐẠT**, SX commit lên nhánh với thông điệp có `[render-day-du]`. Máy sẽ:
   - render đủ tập 16:9 và 9:16 bằng `XUONG.taoTrinhVe`, ghép giọng `bai/<mã>_giong.mp3`;
   - kiểm bằng ffprobe: ≥ 480 s và có tiếng;
   - đưa video vào artifact và bình luận vào PR.

   `<mã>` là phần tên tệp bài trong `xuong.js`, đứng trước dấu `_` hoặc `.`.
4. **Trượt** thì sửa đúng mục bị báo rồi đẩy lại. Không ai phải render tay.

Công cụ: `qa-tools/ci_render.mjs`.

```
khung <thư_mục> <16x9|9x16> [bước_giây]
video <ra.mp4> <16x9|9x16> [giọng.mp3]
```
