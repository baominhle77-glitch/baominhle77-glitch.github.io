"""KHUÔN v1 — CỔNG G12 đo trên VIDEO THẬT (chép nguyên văn, cấm sửa). rc=0 đạt, rc=1 trượt, rc=2 lỗi chạy.
Dùng: python ci/g12_vat_chinh.py --video work/B/B_60s_16x9.mp4 --kho 16x9 [--ban-ve ci/remotion_b/ban_ve_B60.json] [--out g12_16x9.json]
Với mỗi beat 'mo_phong', mỗi tầng khung (16:9 một tầng; 9:16 hai tầng đều 'toan', chia theo bo_cuc_doc.tren), bỏ qua khoang_clip và vung_chu:
  VẬT CHÍNH (tầng 'toan'): nền = mặt bậc 2 khớp theo dải viền 2,5 % của tầng; điểm lệch nền > 18 là vật;
      hộp bao = hàng có >= 12 % điểm vật, cột có >= 8 % điểm vật (bỏ vật mảnh như vòi/giọt);
      ĐẠT khi >= 95 % khung lấy mẫu có hộp bao >= 70 % diện tích tầng và lề >= 3 % mỗi phía.
  KHÔNG PHẲNG (chỉ khi 16:9 đặt khung 'can'): điểm ảnh trùng màu chủ đạo (khoảng cách RGB < 6) <= 35 % ở >= 95 % khung.
  CHUYỂN ĐỘNG (mọi tầng): cặp khung cách 0,5 s, điểm xám đổi > 6 là động;
      TB beat >= 5 %, >= 60 % cặp >= 3 %, không chuỗi cặp tĩnh (< 3 %) nào kéo dài > 2,0 s."""
import sys, json, argparse, subprocess
from pathlib import Path
import numpy as np
import cv2

FPS_DO, NGAN = 4, 270
NGUONG_VAT, HANG, COT = 18, 0.12, 0.08
PHU_MIN, LE_MIN, TI_LE_KHUNG = 0.70, 0.03, 0.95
NGUONG_DONG, CAP_DONG, TB_DONG, TI_LE_CAP, TINH_MAX = 6, 0.03, 0.05, 0.60, 2.0


def doc_khung(video, W, H):
    cmd = ['ffmpeg', '-nostdin', '-v', 'error', '-i', str(video), '-vf', f'fps={FPS_DO},scale={W}:{H}:flags=area',
           '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    n = len(raw) // (W * H * 3)
    return np.frombuffer(raw[:n * W * H * 3], np.uint8).reshape(n, H, W, 3)


def mat_na_chu(h, w, vung, tang):
    """vung_chu (phân số cả khung) -> mặt nạ True = bỏ qua, trong toạ độ tầng."""
    m = np.zeros((h, w), bool)
    x0, y0, tw, th = tang
    for x, y, bw, bh in vung:
        a0, a1 = (x - x0) / tw, (x + bw - x0) / tw
        b0, b1 = (y - y0) / th, (y + bh - y0) / th
        if a1 <= 0 or b1 <= 0 or a0 >= 1 or b0 >= 1:
            continue
        m[max(0, int(b0 * h)):min(h, int(np.ceil(b1 * h))), max(0, int(a0 * w)):min(w, int(np.ceil(a1 * w)))] = True
    return m


def vat_chinh(img, bo):
    h, w = img.shape[:2]
    f = cv2.GaussianBlur(img.astype(np.float32), (5, 5), 0)
    d = max(2, int(round(0.025 * min(w, h))))
    vien = np.zeros((h, w), bool)
    vien[:d], vien[-d:], vien[:, :d], vien[:, -d:] = True, True, True, True
    vien &= ~bo
    yy, xx = np.mgrid[:h, :w].astype(np.float32)
    xx, yy = xx / w - .5, yy / h - .5
    A = np.stack([np.ones_like(xx), xx, yy, xx * xx, yy * yy, xx * yy], -1)
    coef, *_ = np.linalg.lstsq(A[vien], f[vien], rcond=None)
    lech = np.abs(f - A @ coef).max(-1)
    vat = (lech > NGUONG_VAT) & ~bo
    vat = cv2.morphologyEx(vat.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)).astype(bool)
    hang = np.where(vat.mean(1) >= HANG)[0]
    cot = np.where(vat.mean(0) >= COT)[0]
    if not len(hang) or not len(cot):
        return 0.0, 0.0
    y0, y1, x0, x1 = hang[0], hang[-1] + 1, cot[0], cot[-1] + 1
    return (x1 - x0) * (y1 - y0) / (w * h), min(x0 / w, y0 / h, 1 - x1 / w, 1 - y1 / h)


def phang(img, bo):
    q = (img[~bo] // 4).astype(np.int32)
    k = q[:, 0] * 4096 + q[:, 1] * 64 + q[:, 2]
    mode = np.bincount(k).argmax()
    c = np.array([mode // 4096, (mode // 64) % 64, mode % 64]) * 4 + 2
    return float((np.abs(img[~bo].astype(np.int32) - c).max(-1) < 6).mean())


def main():
    a = argparse.ArgumentParser()
    a.add_argument('--video', required=True)
    a.add_argument('--kho', choices=('16x9', '9x16'), required=True)
    a.add_argument('--ban-ve', default=str(Path(__file__).resolve().parents[1] / 'ci/remotion_b/ban_ve_B60.json'))
    a.add_argument('--out', default=None)
    a = a.parse_args()
    bv = json.loads(Path(a.ban_ve).read_text(encoding='utf-8'))
    W, H = (int(round(NGAN * 16 / 9 / 2) * 2), NGAN) if a.kho == '16x9' else (NGAN, int(round(NGAN * 16 / 9 / 2) * 2))
    try:
        fr = doc_khung(a.video, W, H)
    except Exception as e:
        print('G12: LOI_CHAY', e)
        return 2
    tren = float(bv.get('bo_cuc_doc', {}).get('tren', 0.375))
    ket, loi = [], []
    for b in bv['beats']:
        if b['loai'] != 'mo_phong':
            continue
        if a.kho == '16x9':
            tangs = [('16x9', (0, 0, 1, 1), b.get('khung', {}).get('16x9', 'toan'))]
        else:
            tangs = [('9x16-tren', (0, 0, 1, tren), 'toan'), ('9x16-duoi', (0, tren, 1, 1 - tren), 'toan')]
        clip = b.get('khoang_clip', [])
        # fps=FPS_DO lấy khung gần nhất trong cả ô 1/FPS_DO: mẫu cách mốc cắt < nửa ô có thể là khung beat kề
        # (chữ/mặt nạ của beat kia) -> bỏ, chỉ đo mẫu chắc chắn thuộc beat này.
        bien = 0.5 / FPS_DO
        idx = [i for i in range(len(fr)) if b['bat_dau'] + bien <= i / FPS_DO < b['ket_thuc'] - bien
               and not any(c0 <= i / FPS_DO < c1 for c0, c1 in clip)]
        vung = b.get('vung_chu', {}).get(a.kho, [])
        for ten, (x, y, tw, th), kieu in tangs:
            X0, Y0, X1, Y1 = int(round(x * W)), int(round(y * H)), int(round((x + tw) * W)), int(round((y + th) * H))
            bo = mat_na_chu(Y1 - Y0, X1 - X0, vung, (x, y, tw, th))
            r = dict(beat=b['id'], tang=ten, kieu=kieu, so_khung=len(idx))
            if len(idx) < 3:
                r['ghi'] = 'beat bị clip che gần hết -> không đo'
                ket.append(r)
                continue
            if kieu == 'toan':
                do = [vat_chinh(fr[i, Y0:Y1, X0:X1], bo) for i in idx]
                dat = [p >= PHU_MIN and l >= LE_MIN for p, l in do]
                r.update(vat_chinh_min=round(min(p for p, _ in do), 3), vat_chinh_tb=round(float(np.mean([p for p, _ in do])), 3),
                         le_min=round(min(l for _, l in do), 3), ti_le_khung_dat=round(float(np.mean(dat)), 3))
                if r['ti_le_khung_dat'] < TI_LE_KHUNG:
                    xau = [round(idx[k] / FPS_DO, 2) for k, v in enumerate(dat) if not v][:6]
                    loi.append(f"{b['id']} {ten}: vật chính/lề trượt ở {1 - r['ti_le_khung_dat']:.0%} khung (vd giây {xau}); min {r['vat_chinh_min']:.1%}, lề min {r['le_min']:.1%}")
            else:
                ph = [phang(fr[i, Y0:Y1, X0:X1], bo) for i in idx]
                r.update(phang_max=round(max(ph), 3), ti_le_khung_dat=round(float(np.mean([v <= .35 for v in ph])), 3))
                if r['ti_le_khung_dat'] < TI_LE_KHUNG:
                    loi.append(f"{b['id']} {ten}: mặt phẳng một màu > 35 % ở {1 - r['ti_le_khung_dat']:.0%} khung")
            # chuyển động: cặp cách 0,5 s, cả hai khung trong beat và ngoài clip
            buoc = FPS_DO // 2
            tap = set(idx)
            cap = []
            for i in idx:
                if i + buoc in tap:
                    g0 = cv2.GaussianBlur(cv2.cvtColor(fr[i, Y0:Y1, X0:X1], cv2.COLOR_RGB2GRAY), (3, 3), 0).astype(np.int16)
                    g1 = cv2.GaussianBlur(cv2.cvtColor(fr[i + buoc, Y0:Y1, X0:X1], cv2.COLOR_RGB2GRAY), (3, 3), 0).astype(np.int16)
                    cap.append((i / FPS_DO, float(((np.abs(g1 - g0) > NGUONG_DONG) & ~bo).mean())))
            if cap:
                v = [m for _, m in cap]
                chuoi, dai, bat = 0.0, 0.0, None
                for t, m in cap:
                    if m < CAP_DONG:
                        bat = t if bat is None else bat
                        dai = max(dai, t + 0.5 - bat)
                    else:
                        bat = None
                r.update(dong_tb=round(float(np.mean(v)), 4), ti_le_cap_dong=round(float(np.mean([m >= CAP_DONG for m in v])), 3), tinh_dai_nhat_s=round(dai, 2))
                if r['dong_tb'] < TB_DONG:
                    loi.append(f"{b['id']} {ten}: chuyển động TB {r['dong_tb']:.1%} < 5 %")
                if r['ti_le_cap_dong'] < TI_LE_CAP:
                    loi.append(f"{b['id']} {ten}: chỉ {r['ti_le_cap_dong']:.0%} cặp động >= 3 % (cần >= 60 %)")
                if dai > TINH_MAX + 1e-6:
                    loi.append(f"{b['id']} {ten}: đứng hình {dai:.1f} s (> 2 s)")
            ket.append(r)
    for r in ket:
        print('  ' + json.dumps(r, ensure_ascii=False))
    kq = dict(cong='G12', kho=a.kho, video=str(a.video), dat=not loi, loi=loi, chi_tiet=ket)
    if a.out:
        Path(a.out).write_text(json.dumps(kq, ensure_ascii=False, indent=1), encoding='utf-8')
    print('G12 %s: %s' % (a.kho, 'DAT' if not loi else 'TRUOT (%d lỗi)' % len(loi)))
    for l in loi:
        print('  - ' + l)
    return 0 if not loi else 1


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.exit(main())
