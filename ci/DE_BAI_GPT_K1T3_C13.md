# Đề bài GPT — sửa mã cảnh K1 t3 (Meniscus Lab, Marangoni) cho đạt C13

Phương án A1+E (Chủ tịch chốt 25/10/2026): GPT sửa mã qua PR, GitHub dựng bằng dây chuyền cũ (nha_may + Manim + cổng 7b4),
Claude (GĐ) chỉ duyệt. Mặt thật (PiP) chèn ở máy nhà — KHÔNG đưa ảnh/video mặt thật lên repo này (repo công khai).

## Nhánh và cách chạy
- Nhánh gốc: `studio-dung` (repo baominhle77-glitch/baominhle77-glitch.github.io). Thư mục gốc nhánh = `E:\Studio` của máy nhà.
- Mở PR từ nhánh `gpt/k1t3-c13-01` vào `studio-dung`. Mỗi lần đẩy, Actions `dung-tap` (windows-latest) tự dựng
  `ke_hoach,canh,render,noi,phu_de` cả 16:9 lẫn 9:16 qua `ci/chay_ci.py` → `tools/nha_may_kenh.py --tap tools/tap/ML_K1_t3.json`,
  rồi tải lên artifact `dung-<số>` (video trần + khung kho). Xem log bước "Dựng" để biết lỗi.
- Tệp tập: `tools/tap/ML_K1_t3.json` → nhà máy `tools/nha_may_k1_v2.py` (kế thừa `tools/nha_may_k1.py`, `tools/nha_may.py`),
  lớp cảnh của tập `ban_sac/K1_canh/lop_t3.py` (dùng `ban_sac/K1_canh/{khung,lop,trang}.py`, `ban_sac/K1_ban_quang_hoc.py`,
  `ban_sac/vung_cam.py`). Lời đọc + mốc: `out/M1_MARANGONI/storyboard.json`; TTS đã đo: `out/M1_MARANGONI_DUNG/_build/tts.json`.

## Được sửa / cấm sửa
- ĐƯỢC sửa: `ban_sac/K1_canh/lop_t3.py` (chính); nếu thật cần: `ban_sac/K1_canh/*.py`, `tools/nha_may_k1_v2.py`.
- CẤM sửa: `out/M1_MARANGONI/*` (storyboard, mô tả, bìa đã khoá sha trong tệp tập — sửa là dừng HO_SO_KHAC_KHOA),
  `tools/tap/ML_K1_t3.json`, `tools/pip_spec.json` (vùng cấm PiP), `out/_cong_3_6/**` (cổng 7b4), `tools/nha_may.py`,
  `tools/nha_may_kenh.py`, `.github/**`, `ci/chay_ci.py`. Cấm hạ ngưỡng, cấm mẹo qua cổng đo.

## Lỗi phải sửa (khung trượt: `ci/c13_k1t3/16x9_tam_01.jpg`, `ci/c13_k1t3/9x16_tam_01.jpg`; luật: `ci/C13_D16.md`, `LUAT_BAN_SAC_KENH.md` §2a)
1. **Đốm xám mờ** (elip màu MUC, opacity ≈ 0,17) phủ lên hình ở mọi beat — đây là mẹo làm khung "đổi" cho qua đo H3, không
   phải chuyển động có nghĩa (C13 mục 3–4). Bỏ hẳn. Thay bằng chuyển động thật: máy quay trôi về vật đang nói, đại lượng vẽ dần
   đúng từ khoá; mỗi ≤ 4 s khung đổi ≥ 6 % diện tích.
2. **9:16 hình bị ép thành dải mỏng** (khung vật cao ≈ 10–14 % chiều cao, nằm giữa 4 dòng nguồn và 4–5 dòng chữ) — C13 mục 1:
   vật chính to, ở giữa vùng an toàn. Đích: khung bao vật chính ≥ 55 % bề ngang VÀ ≥ 25 % chiều cao vùng an toàn; khối nguồn gọn
   1–2 dòng, chữ nguồn ≥ 22 px (ở 1080p); không để nửa dưới khung trống.
3. **16:9 hình chỉ ≈ 40 % bề ngang** và phần lớn khung là nền trống — đích nhóm vật chính ≥ 55 % bề ngang, lề ≥ 3 %.
4. **Phiếu KĐ 122 (còn nợ):** H3 đứng hình dài nhất 61 s (đích ≤ 4 s); H7 cụm phụ đề phải 2–5 từ, cấm 1 chữ trơ; H1/H6 vật nhỏ
   (vật chính ≥ 2,5 % diện tích, có bóng đổ + lớp xa–gần); H10 màu: chỉ hex bảng v2 §2a, viền mực 2 px quanh màu cam,
   vignette K1 22 % (đã có ở nha_may_k1_v2 — đừng phá).
5. Giữ trống vùng cấm PiP (`ban_sac/vung_cam.py`, sha8 trong tệp tập) ở cả 2 khổ — mặt thật sẽ chèn vào đó ở máy nhà.
6. Không đổi lời, mốc giây, thứ tự beat, tổng thời lượng (TTS đã đo 510,3 s ≥ 480 s).

## Nộp
- PR mô tả theo bảng: lỗi → dòng mã đã sửa → khung chứng minh (lấy từ artifact của lượt Actions trên PR: ít nhất 1 khung/beat
  cho mỗi khổ, ghép contact sheet; C13 mục 9: tự xem trước khi nộp).
- Actions trên PR phải xanh. Không commit bí mật, không commit video mặt thật, không chạm tệp ngoài danh sách được sửa.
- Chỉ dùng chế độ Trò chuyện + GitHub. GĐ duyệt PR; trượt thì GĐ ghi MỘT phiếu gom mọi lỗi (trần 2 vòng, D16).
