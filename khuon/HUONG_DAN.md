# KHUÔN v1 — mẫu 60 s K1 t3 cảnh B (GĐ viết + chạy thử tại máy, 28/10)

Lệnh Chủ tịch 28/10: GĐ viết và chạy thử MÃ KHUÔN CHUNG; **Codex chỉ chép NGUYÊN VĂN vào repo rồi viết nội dung beat**.
Mục đích: chặn ba lỗi lặp của PR 149 (vật chính nhỏ/lệch góc, đứng hình > 2 s, 9:16 letterbox/tầng trống) bằng mã và cổng, không bằng lời dặn.

## 1. Chép tệp (nguyên văn, cấm sửa — CI kiểm sha256)

Lấy từ nhánh `codex-khung`: `git fetch origin codex-khung && git checkout origin/codex-khung -- khuon/` rồi chép `khuon/ci/...` sang `ci/...` cùng đường dẫn.

| Tệp trong nhánh codex-khung | Đích trong repo | sha256 (nội dung LF) |
|---|---|---|
| khuon/ci/simulation/stage_om.py | ci/simulation/stage_om.py | 27221a575e0a1625d46cb4c5eb138574c6a35ad79e7d69448707f5b78b17423f |
| khuon/ci/remotion_b/stage_khuon.py | ci/remotion_b/stage_khuon.py | 68f62d0c4d3d2072c714494a7a305a7acba17dbceddd7b1c8c2c910d7446c419 |
| khuon/ci/kiem_ban_ve.py | ci/kiem_ban_ve.py | 2b2a20392e7793769260f82531076017984dac78c1f19c8800db16ce9f2c0f36 |
| khuon/ci/g12_vat_chinh.py | ci/g12_vat_chinh.py | f315da0050c26bf1438a8dbd407edde58d00193d0fc600e64f3d47bd07e10b9c |
| khuon/ci/khuon_dung_thu.py | ci/khuon_dung_thu.py | 5499d8c937883a2d6c1fe83f4f119ba7ca6f0f89975165f823ce35baf4e8a4e2 |
| khuon/ci/kiem_khuon_sha.py | ci/kiem_khuon_sha.py | 713c5d75bed4ef7e2dccc47ec62ea2117b083a2ffe3129073542ffb43d760b54 |
| khuon/ci/remotion_b/ban_ve_B60.json | ci/remotion_b/ban_ve_B60.json | 8fc5a345… (BẢN MẪU — Codex sửa, không khoá sha) |

Năm tệp đầu được `ci/kiem_khuon_sha.py` khoá sha. Chỉ thêm tệp mới, không đụng `optical_water.py`, `transport.py`, `views.py`.

**Sửa đúng 1 dòng** `ci/remotion_b/scene.py` (dòng 8):

```
from stage_khuon import make_stage as build_stage,base_optics
```

(bỏ hẳn `from stage_spec import ...`). Lời gọi `build_stage(BID, width, height, portrait=DOC)` giữ nguyên.

## 2. Việc của Codex: viết `ban_ve_B60.json`

Bản trong khuôn là **MẪU, mốc beat giả định** (h1 0–9, h2 9–19, h3 19–29, h4 29–41, c1 41–51, p1 51–60). Codex thay mốc thật theo lời/TTS (`public/data.json`) và nội dung beat thật, **giữ nguyên lược đồ**:

```
{
  "phien_ban": "khuon-v1",                 // bắt buộc đúng chuỗi này
  "tong_giay": 60.0, "fps": 30,
  "bo_cuc_doc": {"tren": 0.375},           // 9:16: tầng trên chiếm 0,30..0,50 chiều cao
  "beats": [                               // liền mạch 0..tong_giay, mốc rơi đúng khung hình 30 fps
    {"id": "h1", "bat_dau": 0.0, "ket_thuc": 9.0,
     "loai": "mo_phong" | "clip",          // 'clip' = đoạn clip thật, cổng hình học bỏ qua
     "mo_ta": "…",
     "optics": {…},                        // chỉ trường của dataclass Optics (ellipse_ratio, vessel, shot, impact,
                                           //   feeding, nozzle, section, environment, camera_y, seed, …)
     "optics_duoi": {…},                   // tuỳ chọn: ghi đè optics cho tầng DƯỚI 9:16 (section luôn bị tắt)
     "khung": {"16x9": "toan" | "can"},    // mặc định 'toan'; 'can' chỉ 16:9
     "goc_can": 90.0,                      // tuỳ chọn, chỉ khi khung 16x9 = 'can'
     "su_kien": [                          // t = giây TRONG beat, tăng dần; mọi khoảng (kể cả đầu/cuối beat) <= 3 s
       {"t": 1.0, "kieu": "giot", "manh": 1.0},                      // manh trong (0; 1,5]
       {"t": 3.5, "kieu": "camera", "do_cao": 0.44, "lia": 0.6},     // do_cao 0,25..0,62; lia/lia_doc -1..1
       {"t": 6.0, "kieu": "ngung_nhap"}, {"t": 7.0, "kieu": "nhap"}
     ],
     "khoang_clip": [[0.0, 6.0]],          // giây TUYỆT ĐỐI trong video, nằm trong beat: nơi chèn clip thật (G12 bỏ qua)
     "vung_chu": {"16x9": [[x,y,w,h]], "9x16": [[x,y,w,h]]}   // phân số cả khung: vùng phụ đề/chữ (G12 bỏ qua)
    }
  ]
}
```

Camera tự ôm vật chính: KHÔNG có trường zoom/góc tự do. Bát/đĩa luôn ≥ 70 % khung, lề ≥ 3 % ở 16:9 và ở CẢ HAI tầng 9:16
(trên = nhìn nghiêng/mặt cắt; dưới = nhìn từ trên cao). Không letterbox.

## 3. Lệnh cổng (thứ tự trong CI, mọi bước rc≠0 là dừng)

```
python ci/kiem_khuon_sha.py                                   # khuôn nguyên văn + scene.py đã đổi import
python ci/kiem_ban_ve.py ci/remotion_b/ban_ve_B60.json        # lược đồ + hình học + lịch sự kiện, TRƯỚC render
# ... render như cũ (prepare.py / Remotion) ra work/B/B_60s_16x9.mp4 và B_60s_9x16.mp4 ...
python ci/g12_vat_chinh.py --video work/B/B_60s_16x9.mp4 --kho 16x9 --out work/B/g12_16x9.json
python ci/g12_vat_chinh.py --video work/B/B_60s_9x16.mp4 --kho 9x16 --out work/B/g12_9x16.json
python -m gate_chung ...                                       # G1–G8 giữ như cũ
```

G12 (trên video thật, mỗi beat `mo_phong`, mỗi tầng, bỏ `khoang_clip` + `vung_chu`): ≥ 95 % khung có vật chính ≥ 70 % và lề ≥ 3 %;
chuyển động TB ≥ 5 %, ≥ 60 % cặp khung (cách 0,5 s) ≥ 3 %, không đoạn đứng > 2 s. rc 0 đạt / 1 trượt / 2 lỗi chạy.
Dựng thử nhanh không Remotion: `python ci/khuon_dung_thu.py --kho 16x9 --cao 270 --out work/B/thu_16x9.mp4`.

## 4. Kết quả GĐ chạy tại máy (bản vẽ mẫu)

- kiem_ban_ve: ĐẠT (mọi tầng vật chính min 76,1 %, lề 4,0 %). Thử âm bản vẽ hỏng: TRƯỢT đúng 3 lỗi.
- kiem_khuon_sha: ĐẠT trên bản sao có scene.py đã đổi import; sửa 1 byte stage_om.py → TRƯỢT. Trên scene.py gốc → TRƯỢT (đúng, chưa đổi import).
- Dựng 540p (h264_qsv, 1800 khung, 60,000 s) hai khổ — G12 16x9 ĐẠT (vật chính min 72,7 %, lề min 3,7 %, động TB 16,8–26,6 %, đứng dài nhất 0 s);
  G12 9x16 ĐẠT (min 70,9 % h2 tầng trên); ffmpeg freezedetect d=2: 0 đoạn. Thử âm G12 với video tĩnh: TRƯỢT 24 lỗi.
- Tờ khung (1 khung/2 s): `khuon/bang_chung/to_khung_540_16x9.jpg`, `khuon/bang_chung/to_khung_540_9x16.jpg`.
- gate_chung G1–G8 KHÔNG chạy được tại máy (cần Remotion + gói gate_chung trong CI) → chạy trong CI như cũ.

Lưu ý nội dung (không phải lỗi cổng): 9:16 c1/p1 tầng trên là mặt cắt bị dẹt, ô tuần hoàn khó thấy — nên tăng `bo_cuc_doc.tren`
(tối đa 0,50) hoặc làm rõ ô tuần hoàn bằng nội dung; h2–h4 trông gần giống nhau → phân biệt bằng optics/sự kiện của từng beat.
