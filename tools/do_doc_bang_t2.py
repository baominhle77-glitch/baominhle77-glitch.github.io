# -*- coding: utf-8 -*-
"""Cổng đo độ đọc bảng sau render cho các nhà máy t2 (lệnh GĐ 04:49 23/10, cùng khuôn mục 219
đã ghi số với HỒ SƠ 23:57 22/10 + KĐ: đo trên khung QA cả 1080p lẫn dọc, ngưỡng 17,9 px = cỡ 14
CO_MIN, dưới ngưỡng → DỪNG báo HỒ SƠ tách bảng, KHÔNG tự bỏ hàng — lỗi 111-10).

File MỚI, không sửa nha_may.py/lop.py/thư viện chung (GĐ: "cổng đo sau render là lưới bắt,
thư viện để nguyên"). Từng nha_may_kX_t2.py gọi cong_do_bang() trước cổng 7b4.

Thuật đo = bản 3 (do_doc_bang_k5t2) tổng quát hoá 2 điểm theo bản sắc kênh:
- 2 ngưỡng tách: NG_VACH tìm khung bảng (vạch ngang 28–92 %W, nhóm cùng khoảng x ±25,
  nóc–đáy ≥50 px, lấy nhóm NHIỀU VẠCH nhất — rộng nhất bắt nhầm khung tên bản vẽ, thử 23/10
  K4 9x16 x5/d5; lòng né viền 14 px); NG_MUC đo dải chữ (≥6 điểm mực, không phải vạch ≥60 % lòng,
  bỏ dải <6 px, bỏ dải nét kẻ: cao <12 px mà có run mực liền ≥90 px — nét ngang hộp tô sáng cột
  chạy <60 % lòng nên không bị loại như vạch, thử x2/b1). K5 mực tối trên tờ sáng 1 ngưỡng (toi=True);
  K2 (dao động ký: nền ~7, viền bảng 60–90, chữ ≥100) vạch>50 mực>85; K4 (bản vẽ: nền ~83,
  nét trắng ≥170) vạch>130 mực>130 — hiệu chuẩn trên khung thật 23/10 (probe_do_bang_v2/v3).
- Khung QA: không cố định cuối beat (K4 g4 cuối beat bảng đã rời khung hình) mà quét mẫu 6 khung/s
  bản thu nhỏ 720 ngang, chọn khung NHIỀU DÒNG VẠCH nhất (cấu trúc bảng hiện đủ nhất), đồng hạng
  lấy nhiều mực — chọn theo tổng mực bắt khung chuyển cảnh sáng của K2. Ngưỡng trên bản thu nhỏ
  thích nghi nửa đường từ trung vị khung tới ngưỡng gốc (viền mảnh bị pha loãng khi thu nhỏ —
  thử 23/10 K2 16x9 cả 4 beat 0 vạch ở 480 ngưỡng gốc); video cố định → tất định.

- Chế độ KHÔNG KHUNG (khong_khung=True, ng_vach=None) cho bảng kê chữ không kẻ khung (K1 BangKe,
  quyết GĐ 10:57 23/10): đo dải mực trên TOÀN khung hình với cùng phép lọc dải + ngưỡng 17,9 px;
  chọn khung QA theo nhiều dòng-có-mực nhất (bỏ khung có mực >35 % điểm ảnh — khung tối/chuyển cảnh).
  K1 chữ tối trên nền sáng ~158: mực<120, toi=True (hiệu chuẩn khung m5 23/10).

Khung bằng chứng ghi vào <_build>/qa_doc_bang/<bc>_<beat>_k<khung>.png (ghi đè theo lần dựng);
khung quét tạm vào gốc nháp owned-run (CLAUDE_OWNED_RUN_ROOT) khi có."""
import json
import os
import shutil
import subprocess
import tempfile

import numpy as np
from PIL import Image

FPS = 30
NG_PX = 17.9          # cỡ 14 CO_MIN trên 1080p — chung cả 16x9 lẫn 9x16 (khuôn mục 219)
QUET_FPS = 6          # quét chọn khung: 6 khung/s (bước 5 khung)
DO_LAI = 10           # TRƯỢT -> đo lại ở k+10, k+20 (1/3 s, 2/3 s): chữ bé thật vẫn bé; chữ đang phóng to thì đã đủ cỡ


def _mat_na(im, ng, toi):
    return (im < ng) if toi else (im > ng)


def _dai_chu(duong, ng_vach, ng_muc, toi):
    """Đo 1 khung PNG. Trả (min_px, [cao dải...], mô_tả); min_px=None nếu không thấy khung bảng.
    ng_vach=None: chế độ KHÔNG KHUNG (bảng kê chữ không kẻ khung, vd K1 BangKe) — đo dải mực
    trên toàn khung hình, cùng các phép lọc dải (<6 px, nét kẻ) và cùng ngưỡng 17,9 px."""
    im = np.asarray(Image.open(duong).convert('L')).astype(np.float32)
    H, W = im.shape
    if ng_vach is None:
        y0, y1 = -1, H
        x0, x1 = 0, W
        g = None
    else:
        mn_k, hs_k, mo_k, g = _tim_khung(im, ng_vach, toi, W, H)
        if g is None:
            return mn_k, hs_k, mo_k
        y0, y1 = min(g[2]), max(g[2])
        x0, x1 = g[0] + 14, g[1] - 14
    lo = _mat_na(im, ng_muc, toi)[y0 + 1:y1, x0:x1]
    tong = lo.sum(axis=1)
    la_vach = np.zeros(lo.shape[0], dtype=bool)
    dau_vach = {}                                     # hàng vạch -> (đầu trái, đầu phải) của run dài nhất
    for i in range(lo.shape[0]):
        r = lo[i]
        if not r.any():
            continue
        d = np.diff(np.concatenate(([0], r.view(np.int8), [0])))
        s, e = np.where(d == 1)[0], np.where(d == -1)[0]
        j = int(np.argmax(e - s))
        la_vach[i] = e[j] - s[j] >= (x1 - x0) * 0.60
        if la_vach[i]:
            dau_vach[i] = (int(s[j]), int(e[j]))
    co_muc = (tong >= 6) & ~la_vach
    bands = []
    yb = None
    for i, v in enumerate(co_muc):
        if v and yb is None:
            yb = i
        elif not v and yb is not None:
            bands.append((yb, i - 1))
            yb = None
    if yb is not None:
        bands.append((yb, len(co_muc) - 1))
    hs, ke, goc = [], 0, 0
    for s, e in bands:
        cao = e - s + 1
        if cao < 6:
            continue
        if cao < 12:                                  # dải mỏng: phân biệt chữ bé thật / nét kẻ hộp tô sáng
            mx = 0
            for i in range(s, e + 1):
                r = lo[i]
                if not r.any():
                    continue
                d = np.diff(np.concatenate(([0], r.view(np.int8), [0])))
                a, b2 = np.where(d == 1)[0], np.where(d == -1)[0]
                mx = max(mx, int((b2 - a).max()))
            if mx >= 90:                              # run mực liền ≥90 px: nét kẻ (glyph chữ bé đứt quãng ngắn)
                ke += 1
                continue
            if _goc_vien(lo, s, e, dau_vach):         # cung bo góc sát hai đầu một vạch viền kề bên
                goc += 1
                continue
        hs.append(cao)
    mn = min(hs) if hs else 0
    if g is None:
        mo = "toan khung (bang ke khong khung)"
    else:
        mo = "bang x %d..%d y %d..%d" % (g[0], g[1], y0, y1)
    if ke:
        mo += " (bo %d dai net ke)" % ke
    if goc:
        mo += " (bo %d dai goc vien)" % goc
    return mn, hs, mo


GOC_KE = 3        # vạch viền cách dải tối đa 3 hàng (hàng 6 điểm mực ngay dưới/trên hàng viền dài)
GOC_X = 14        # mực của dải chỉ được nằm trong 14 px quanh hai đầu vạch đó (đo 24/10: cung góc cách đầu vạch ≤10 px; chữ cách viền ≥32 px)


def _goc_vien(lo, s, e, dau_vach):
    """Dải mỏng (<12 px, run <90) là CUNG BO GÓC của hộp khi: có hàng vạch (run ≥60 % lòng) cách dải
    ≤GOC_KE hàng, và MỌI điểm mực của dải nằm trong GOC_X px quanh đầu trái/phải của vạch đó.
    Đo 24/10 K1 t3 9x16 w6/r1: hộp rộng 67–76 % khung → hàng viền thành vạch, hàng sát nó còn 2 cung
    3–5 px ở hai đầu, tổng 6 điểm = đủ ngưỡng ≥6 → thành dải 6–7 px giả. Chữ bé thật có mực ở giữa → vẫn đo."""
    gan = [v for v in dau_vach if s - GOC_KE <= v < s or e < v <= e + GOC_KE]
    if not gan:
        return False
    xs = np.where(lo[s:e + 1].any(axis=0))[0]
    for v in gan:
        a, b = dau_vach[v]
        if all((a - GOC_X <= x <= a + GOC_X) or (b - GOC_X <= x <= b + GOC_X) for x in xs):
            return True
    return False


def _tim_khung(im, ng_vach, toi, W, H):
    """Tìm khung bảng qua vạch ngang (đường đo CÓ KHUNG, nguyên thuật cũ). Trả (None,[],mô_tả,g);
    g=None khi không thấy."""
    mv = _mat_na(im, ng_vach, toi)
    vach = []
    for y in range(H):
        r = mv[y]
        if not r.any():
            continue
        d = np.diff(np.concatenate(([0], r.view(np.int8), [0])))
        s, e = np.where(d == 1)[0], np.where(d == -1)[0]
        i = int(np.argmax(e - s))
        if W * 0.28 <= e[i] - s[i] <= W * 0.92:
            vach.append((y, int(s[i]), int(e[i])))
    nhom = []
    for y, s, e in vach:
        for g in nhom:
            if abs(s - g[0]) <= 25 and abs(e - g[1]) <= 25:
                g[2].append(y)
                break
        else:
            nhom.append([s, e, [y]])
    nhom = [g for g in nhom if max(g[2]) - min(g[2]) >= 50]
    if not nhom:
        return None, [], "khong thay khung bang (%d vach le)" % len(vach), None
    g = max(nhom, key=lambda g: (len(g[2]), g[1] - g[0]))
    return 0, [], "", g


def _chon_khung(video, kd, sk, ng_vach, ng_muc, toi, goc_nhap):
    """Quét beat ở bản thu nhỏ 480 ngang, QUET_FPS khung/s; trả khung toàn cục có NHIỀU DÒNG VẠCH
    nhất (dòng có run 28–92 %W theo mặt nạ vạch — cấu trúc bảng), đồng hạng lấy tổng mực lớn hơn."""
    d = tempfile.mkdtemp(prefix="quet_", dir=goc_nhap)
    try:
        subprocess.run(["ffmpeg", "-nostdin", "-v", "error",
                        "-ss", "%.4f" % (kd / FPS), "-i", video, "-t", "%.4f" % (sk / FPS),
                        "-vf", "fps=%d,scale=720:-2" % QUET_FPS, "-y", d + "/q%04d.png"], check=True)
        fs = sorted(f for f in os.listdir(d) if f.endswith(".png"))
        if not fs:
            raise SystemExit("DO_DOC_BANG_QUET_RONG %s khung %d+%d" % (video, kd, sk))
        diem = []
        for f in fs:
            a = np.asarray(Image.open("%s/%s" % (d, f)).convert('L')).astype(np.float32)
            W = a.shape[1]
            med = float(np.median(a))
            ngm = med - (med - ng_muc) * 0.5 if toi else med + (ng_muc - med) * 0.5
            if ng_vach is None:                       # không khung: nhiều DÒNG CÓ MỰC nhất, đồng hạng nhiều mực
                m = _mat_na(a, ngm, toi)
                muc = int(m.sum())
                if muc > a.size * 0.35:               # khung tối/chuyển cảnh: không phải chữ trên nền sáng
                    diem.append((0, 0))
                else:
                    diem.append((int(sum(1 for r in m if int(r.sum()) >= 6)), muc))
                continue
            ngv = med - (med - ng_vach) * 0.5 if toi else med + (ng_vach - med) * 0.5
            mv = _mat_na(a, ngv, toi)
            dong = 0
            for r in mv:
                if not r.any():
                    continue
                dd = np.diff(np.concatenate(([0], r.view(np.int8), [0])))
                s, e = np.where(dd == 1)[0], np.where(dd == -1)[0]
                mx = (e - s).max()
                if W * 0.28 <= mx <= W * 0.92:
                    dong += 1
            diem.append((dong, int(_mat_na(a, ngm, toi).sum())))
        i = max(range(len(diem)), key=lambda i: diem[i])
        return min(kd + i * (FPS // QUET_FPS), kd + sk - 1)
    finally:
        shutil.rmtree(d, ignore_errors=True)


def _trich(video, k, duong):
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-ss", "%.4f" % (k / FPS + 0.0005),
                    "-i", video, "-frames:v", "1", "-y", duong], check=True)


def do_video(video, beats, ng_vach, ng_muc, toi=False, ng_px=NG_PX, ra_png=None, ghi=print):
    """Đo các beat bảng trên 1 video. beats = [(bid, khung_dau, so_khung)]; trả số beat TRƯỢT.
    PNG bằng chứng vào ra_png/ (tên <nhãn video>_<bid>_k<khung>.png) nếu ra_png khác None."""
    goc_nhap = os.environ.get("CLAUDE_OWNED_RUN_ROOT") or tempfile.gettempdir()
    nhan = os.path.splitext(os.path.basename(video))[0]
    truot = 0
    for bid, kd, sk in beats:
        k = _chon_khung(video, kd, sk, ng_vach, ng_muc, toi, goc_nhap)
        if ra_png:
            os.makedirs(ra_png, exist_ok=True)
            png = "%s/%s_%s_k%d.png" % (ra_png, nhan, bid, k)
        else:
            png = "%s/do_%s_%s_k%d.png" % (goc_nhap, nhan, bid, k)
        _trich(video, k, png)
        mn, hs, mo_ta = _dai_chu(png, ng_vach, ng_muc, toi)
        if mn is not None and mn < ng_px:
            for kl in (k + DO_LAI, k + 2 * DO_LAI):
                if kl > kd + sk - 1:
                    break
                png_l = png.replace("_k%d.png" % k, "_k%d_dolai.png" % kl)
                _trich(video, kl, png_l)
                mn_l, hs_l, mo_l = _dai_chu(png_l, ng_vach, ng_muc, toi)
                ghi("do_doc_bang %s %s k%d: min %d px < nguong -> do lai k%d: %d dai cao %s | min %s px"
                    % (nhan, bid, k, mn, kl, len(hs_l), hs_l, mn_l))
                if mn_l is not None and mn_l >= ng_px and len(hs_l) >= len(hs):
                    mo_ta = "%s; khung k%d la khung chuyen canh (chu dang hien), dung k%d %s" % (mo_ta, k, kl, mo_l)
                    k, mn, hs = kl, mn_l, hs_l
                    break
        if mn is None:
            ghi("do_doc_bang %s %s k%d: TRUOT — %s" % (nhan, bid, k, mo_ta))
            truot += 1
        else:
            dat = mn >= ng_px
            ghi("do_doc_bang %s %s k%d: %s; %d dai cao %s | min %d px, nguong %.1f -> %s"
                % (nhan, bid, k, mo_ta, len(hs), hs, mn, ng_px, "DAT" if dat else "TRUOT"))
            if not dat:
                truot += 1
    return truot


def cong_do_bang(nm, lop_bang, ng_vach=None, ng_muc=None, toi=False, ng_px=NG_PX, khong_khung=False):
    """Cổng trong nhà máy, chạy trên bản trần từng bố cục (khung_beat_<bc>.json của bước nối).
    lop_bang = tập tên lớp cảnh bảng dữ liệu của kênh (rỗng → lưới no-op, chỉ ghi log); kênh có lớp bảng
    phải kèm ngưỡng ĐÃ hiệu chuẩn trên khung thật (None → dừng, không đo mò).
    khong_khung=True: kênh bảng kê chữ KHÔNG kẻ khung (K1 BangKe) — chỉ cần ng_muc, đo toàn khung.
    TRƯỢT hoặc thiếu khung bảng → SystemExit: DỪNG báo HỒ SƠ tách bảng, KHÔNG tự bỏ hàng (111-10)."""
    tong_truot = 0
    for bc in nm.bo_cuc:
        j = json.load(open("%s/khung_beat_%s.json" % (nm.B, bc), encoding="utf-8"))
        video = j["ban_tran"]
        if not os.path.exists(video) or os.path.getsize(video) != j["ban_tran_bytes"]:
            raise SystemExit("DO_DOC_BANG_TRAN_LECH %s" % video)
        beats = [(b["beat"], b["khung_dau"], b["so_khung"]) for b in j["beats"] if b["canh"] in lop_bang]
        if beats and (ng_muc is None or (ng_vach is None and not khong_khung)):
            raise SystemExit("DO_DOC_BANG_CHUA_HIEU_CHUAN %s: %d beat lớp bảng nhưng chưa có ngưỡng kênh "
                             "(probe trên khung thật rồi điền ng_vach/ng_muc)" % (bc, len(beats)))
        if not beats:
            nm.log("do_doc_bang %s: 0 beat lop bang %s — luoi bat van cai, khong co gi do" % (bc, sorted(lop_bang)))
            continue
        tong_truot += do_video(video, beats, ng_vach, ng_muc, toi=toi, ng_px=ng_px,
                               ra_png=nm.B + "/qa_doc_bang", ghi=nm.log)
    if tong_truot:
        raise SystemExit("DO_DOC_BANG_TRUOT %d beat — bao HO SO tach bang, khong tu bo hang (muc 219)" % tong_truot)
