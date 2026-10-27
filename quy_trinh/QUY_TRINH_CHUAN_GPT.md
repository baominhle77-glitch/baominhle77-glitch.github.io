# QUY TRÌNH CHUẨN — Codex dựng video Studio (bản 1, GĐ 27/10)

Bản này thay các phiếu vá từng lượt. 14 lượt PR 149 trượt cùng một nhóm lỗi:
- vật nhỏ, nền trống: r2, r4, r6, r7, r10, r13, r14;
- đứng hình: r2, r10, r14;
- phụ đề: r3, r4, r7–r12.

Lý do: chưa có bản vẽ cố định và khuôn mã cố định. Từ nay mọi lượt làm đúng 5 bước dưới đây. Lỗi nào đã có mã L1–L8 thì sửa ở khuôn, không vá riêng cảnh (D18).

## 1. Vòng một lượt (đúng thứ tự)

1. **Đọc**: lấy `MUC_LUC.md` và phiếu mới nhất trong nhánh `codex-khung`, mở ảnh khung của vòng đó. Mỗi lỗi trong phiếu gán một mã L1–L8. Lỗi chưa có mã thì đặt L9+ và đề xuất khuôn hoặc cổng mới.
2. **Sửa BẢN VẼ trước khi sửa mã** (D16). Tệp `plans/ban_ve_B60.json` có mỗi beat một dòng gồm các trường:
   - `t0` / `t1` (giây);
   - `vat_chinh`;
   - `bbox_16x9` và `bbox_9x16`, dạng [x, y, w, h], tính theo % khung;
   - `nen` (kiểu nền);
   - `su_kien`: danh sách [giây, việc gì đổi, % khung đổi];
   - `camera`: từ → tới, ease;
   - `phu_de`: các cụm 2–5 từ;
   - `mau_nuoc` / `mau_chinh` (hex);
   - `lop_xa_gan`.
3. **Chạy `ci/kiem_ban_ve.py`** (bạn viết, chạy ≤ 30 s, không render). Chỉ đẩy khi 0 lỗi. Bộ kiểm chặn:
   - bbox vật chính < 70 % bề ngang (16:9) hoặc < 60 % chiều cao (9:16);
   - lề < 3 %;
   - khoảng giữa hai sự kiện > 3 s (để dư so với cổng 4 s);
   - nền một màu không có lớp xa–gần;
   - phụ đề ngoài 2–5 từ, số không đơn vị, nhắc "episode/tập" khác;
   - 9:16 ghép ô lặp từ 16:9.
4. **Sửa mã chỉ ở beat lỗi**, dùng khuôn ở mục 2. Không viết lại cảnh đã đạt.
5. **Đẩy MỘT commit mỗi lượt.** Ghi `trao_doi/CODEX_NOI.md` dạng bảng: `mã lỗi phiếu · beat · đã sửa gì · số đo bản vẽ mới`. Không đẩy chồng khi run CI của commit trước chưa xong.

## 2. Tám lỗi lặp → khuôn bắt buộc

| Mã | Lỗi (phiếu, cổng) | Khuôn bắt buộc trong mã chung |
|---|---|---|
| L1 | Vật chính nhỏ, khung trống (G10, mắt) | Hàm chung `om_vat_chinh(vat, khổ)`: camera tự fit để vật chiếm ≥ 70 % bề ngang 16:9 hoặc ≥ 60 % chiều cao 9:16. Mọi cảnh mô phỏng gọi hàm này; cấm đặt camera tay. |
| L2 | Nền một màu > 35 % (G10) | Nền chuẩn = gradient 2 tông + vân hoặc ánh sáng + lớp xa mờ; bàn, đĩa, bát có bóng đổ và phản chiếu. Cấm nền xám phẳng. |
| L3 | Đứng hình: SSIM 4 s > 0,97 (G1), C17 | Mỗi beat ≥ 1 sự kiện mỗi 3 s, lấy từ `su_kien` trong bản vẽ. Camera luôn trôi có ease (zoom/pan 2–4 % mỗi 4 s). Mô phỏng (hạt, dòng chảy) chạy suốt beat, không dừng ở trạng thái cuối. |
| L4 | 9:16 khối chính thấp, dải trống (G3) | 9:16 dựng bố cục dọc riêng: khối chính cao ≥ 0,85 khung, không ghép ô lặp lại cảnh 16:9. Muốn chia hai nửa thì một nửa phải là clip thật. |
| L5 | Cận cảnh mất vật, người xem không biết đang nhìn gì | Cận cảnh phải giữ đối tượng đang được nói tới trong khung (bbox ≥ 40 %) và giữ mép đang chuyển động. Camera bám theo mép đó. |
| L6 | Phụ đề | Cụm 2–5 từ, khớp lời TTS. Số phải có đơn vị và làm tròn có nghĩa (cấm "35.54"). Cấm nhắc tập khác. Viết bộ lint tự chạy trong `kiem_ban_ve.py`. |
| L7 | Mô phỏng lệch tông clip thật | Đo màu trung bình (L\*a\*b) của clip thật cùng đoạn, mô phỏng dùng đúng tông đó (nước trong, thấy đáy, phản chiếu nhẹ). Ghi hex vào bản vẽ. |
| L8 | Lỗi CI kỹ thuật (thiếu ffmpeg, thiếu caption_alignment 1080p) | Mỗi job tự cài đủ phụ thuộc. Đường dẫn alignment truyền bằng tham số, không đoán theo `--video-root`. Các test `gate_chung/tests` phải xanh hết. |

**Cổng chung mới cần thêm (D18): G12 "vật chính ≥ 70 % khi mô phỏng".** Đo bbox vùng khác nền ở mỗi giây, đối chiếu với `bbox` trong bản vẽ. Áp cho cả hai khổ, mọi thể loại.

## 3. Định nghĩa XONG cho mẫu 60 s

- Run `k1t3-B-remotion-60s` xanh G1–G11 (và G12 khi có) ở cả 16:9 và 9:16.
- Run `D18 universal video gates` xanh.
- GĐ xem tờ khung: 0 lỗi mắt mới (L1–L8).
- Sau đó Chủ tịch xem và chốt (D17). Không dựng full tập trước khi Chủ tịch chốt.

## 4. Tiết kiệm limit (bắt buộc)

- Một commit mỗi lượt và sửa HẾT lỗi của phiếu trong lượt đó.
- Chỉ dựng lại beat lỗi. Thử ở 270p/15 fps; dựng 540p một lần.
- Không đọc lại toàn repo mỗi lượt; chỉ đọc phiếu, ảnh và các tệp liên quan tới mã lỗi.
- Trong chat chỉ trả lời 1 dòng. Chi tiết ghi vào `CODEX_NOI.md`.
