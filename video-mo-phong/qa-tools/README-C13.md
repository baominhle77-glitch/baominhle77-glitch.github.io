# Công cụ đo nhanh cho bản dựng C13 (phiên session_01357, 24/10/2026)

Chạy từ gốc repo, có máy chủ tĩnh: `python3 -m http.server 8765 --bind 127.0.0.1`. Kết quả ghi vào thư mục bạn chỉ định (đừng commit thư mục tạm).

- `node video-mo-phong/qa-tools/kiem_cat_vat.mjs [16x9|9x16]` — C13 mục 1–2: mỗi 0,1 s, vật nào trong sổ `VAT` bị mép khung (viền 28 px) hoặc vùng PiP cắt khi vật không trượt (< 120 px/s). Kỳ vọng: `0 lỗi`.
- `node video-mo-phong/qa-tools/chup_khung.mjs <thu_muc> <16x9|9x16> <fps> [t0] [t1]` — chụp khung bằng `XUONG.chupKhung` (cùng hàm vẽ với xuất).
- `python3 video-mo-phong/qa-tools/nhip_nhanh.py <thu_muc>` — C13 mục 3 trên khung đã chụp ở 4 fps (> 6 % diện tích khác > 12/255). Đo trên video nén thường thấp hơn 0,5–1 điểm %: để dư biên.
- `python3 video-mo-phong/qa-tools/nhip_chi_tiet.py <thu_muc> <t0> <t1>` — % đổi từng mẫu trong một đoạn.
- `python3 video-mo-phong/qa-tools/to_ghep.py <thu_muc> <ra.jpg> <so_cot> <rong> [t0 t1]` — tờ ghép.
