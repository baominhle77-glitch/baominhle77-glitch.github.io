#!/usr/bin/env python3
"""Dựng bộ dẫn chứng qa/<phiên bản>/ theo skill kiem-chat-luong-video (mục 1) và thư GĐ gd-20261024-1705 (mục 5).

Mọi khung lấy từ CHÍNH tệp video web đã xuất từng khung (giải mã bằng ffmpeg), không chụp màn hình xem trước.
Dùng: python3 bo_dan_chung.py <thu_muc_ra> <video_16x9.mp4> <video_9x16.mp4> <stats_16x9.json> <stats_9x16.json> <meta.json>

Đầu ra:
- video_16x9.mp4, video_9x16.mp4: bản đầy đủ có tiếng, H.264 + AAC (chuyển mã từ tệp web xuất; web ở máy thử chỉ có VP9 + Opus)
- mau_10s.mp4: 10 giây đầu 16:9, H.264, ≤ 3 MB
- khung_16x9/, khung_9x16/: JPG q82 ở 0 · 0,5 · 1 · 2 · 3 · 5 s, mỗi 5 s, và 3 khung (đầu, giữa, cuối) mỗi cú máy/chuyển cảnh
- to_khung.jpg: tờ ghép các khung 16:9 ở trên; to_khung_4fps_16x9.jpg, to_khung_4fps_9x16.jpg: tờ ghép 4 khung/giây
- png_beat/: 3 PNG ở 25 %, 50 %, 75 % mỗi beat, mỗi khổ
- bang_pixel_diff.csv: tỉ lệ điểm ảnh đổi (> 12/255) giữa hai mẫu liền nhau, mỗi 0,25 s, hai khổ
- do_luong.json: các trường barem + chi tiết từng khổ
"""
import csv
import json
import os
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont
import numpy as np


def chay(cmd):
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def thoi_luong(video):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", video], capture_output=True, text=True, check=True).stdout
    return float(out.strip())


def phong(co):
    try:
        return ImageFont.truetype("DejaVuSans.ttf", co)
    except OSError:
        return ImageFont.load_default()


def moc_khung(dai, chuyen):
    """0,0 · 0,5 · 1,0 · 2,0 · 3,0 · 5,0 s, rồi mỗi 5 s tới hết, cộng 3 khung (đầu, giữa, cuối) mỗi chuyển cảnh."""
    ts = {0.0, 0.5, 1.0, 2.0, 3.0, 5.0}
    t = 10.0
    while t < dai - 1e-6:
        ts.add(t)
        t += 5.0
    ts.add(round(dai - 0.1, 1))
    for _ten, a, b in chuyen:
        for x in (a, (a + b) / 2, b):
            ts.add(round(min(max(x, 0), dai - 0.1), 1))
    return sorted(ts)


def trich(video, t, dich, jpg=True):
    tam = dich + ".tmp.png"
    chay(["ffmpeg", "-y", "-ss", f"{t:.3f}", "-i", video, "-frames:v", "1", tam])
    im = Image.open(tam).convert("RGB")
    if jpg:
        im.save(dich, "JPEG", quality=82, optimize=True)
    else:
        im.save(dich, "PNG", optimize=True)
    os.remove(tam)
    return os.path.getsize(dich)


def to_ghep(anh, nhan, ra, cot, rong):
    cao = int(anh[0].height * rong / anh[0].width)
    hang = (len(anh) + cot - 1) // cot
    S = Image.new("RGB", (cot * rong, hang * (cao + 20)), (18, 18, 18))
    d = ImageDraw.Draw(S)
    f = phong(13)
    for i, (im, nh) in enumerate(zip(anh, nhan)):
        x, y = (i % cot) * rong, (i // cot) * (cao + 20)
        S.paste(im.resize((rong, cao)), (x, y + 20))
        d.text((x + 4, y + 3), nh, fill=(255, 255, 255), font=f)
    S.save(ra, "JPEG", quality=78, optimize=True)


def giai_ma(video, fps, w, h, mau=False):
    fmt = "rgb24" if mau else "gray"
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", video, "-vf", f"fps={fps},scale={w}:{h},format={fmt}", "-f", "rawvideo", "-"], capture_output=True, check=True).stdout
    shape = (-1, h, w, 3) if mau else (-1, h, w)
    return np.frombuffer(raw, dtype=np.uint8).reshape(shape)


def do_nhip(video, kho):
    """Khung lặp (30 fps): hai khung liên tiếp coi như giống hệt khi chênh lệch điểm ảnh lớn nhất ≤ 2/255.
    Đổi hình (4 fps): mẫu có > 6 % diện tích khác > 12/255 so với mẫu trước = một lần đổi hình (định nghĩa barem)."""
    w, h = (480, 270) if kho == "16x9" else (270, 480)
    f30 = giai_ma(video, 30, w, h).astype(np.int16)
    lap_dai = hien = 0
    for i in range(1, len(f30)):
        if np.abs(f30[i] - f30[i - 1]).max() <= 2:
            hien += 1
            lap_dai = max(lap_dai, hien)
        else:
            hien = 0
    f4 = giai_ma(video, 4, w, h).astype(np.int16)
    ti_le = [(round(i / 4, 2), float((np.abs(f4[i] - f4[i - 1]) > 12).mean())) for i in range(1, len(f4))]
    su_kien = [t for t, v in ti_le if v > 0.06]
    dai = len(f30) / 30
    moc = [0.0] + su_kien + [dai]
    khoang = [round(b - a, 2) for a, b in zip(moc, moc[1:])]
    lon = max(khoang)
    i_lon = khoang.index(lon)
    return {
        "khung_lap_lai_toi_da_giay": round(lap_dai / 30, 3),
        "so_lan_doi_hinh": len(su_kien),
        "khoang_doi_hinh_dai_nhat_giay": lon,
        "khoang_tinh_dai_nhat_tu_giay": moc[i_lon],
        "khoang_doi_hinh_trung_binh_giay": round(sum(khoang) / len(khoang), 2),
        "so_khoang_tren_4_giay": sum(1 for k in khoang if k > 4),
        "moc_doi_hinh_giay": su_kien,
    }, ti_le


def chuyen_ma(video, ra, dai=None, crf=27, tieng=True):
    cmd = ["ffmpeg", "-y", "-i", video]
    if dai:
        cmd += ["-t", str(dai)]
    cmd += ["-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p", "-crf", str(crf), "-preset", "slow", "-movflags", "+faststart"]
    cmd += ["-c:a", "aac", "-b:a", "96k"] if tieng else ["-an"]
    chay(cmd + [ra])


def main():
    ra, v16, v9, s16, s9, meta_p = sys.argv[1:7]
    meta = json.load(open(meta_p))
    os.makedirs(ra, exist_ok=True)
    tong = {"cach_do": "bo_dan_chung.py: khung giải mã từ chính video web xuất bằng ffmpeg; lặp = chênh lớn nhất ≤ 2/255 ở 30 fps (480 px); đổi hình = mẫu 4 fps có > 6 % diện tích khác > 12/255 so với mẫu trước (không gộp mẫu liền nhau)", "kho": {}}
    bang = {}
    for kho, video, stats in (("16x9", v16, s16), ("9x16", v9, s9)):
        dai = thoi_luong(video)
        thu = os.path.join(ra, f"khung_{kho}")
        os.makedirs(thu, exist_ok=True)
        lon_nhat = 0
        moc = moc_khung(dai, meta[kho]["chuyenCanh"])
        for t in moc:
            lon_nhat = max(lon_nhat, trich(video, t, os.path.join(thu, f"t_{t:06.1f}.jpg")))
        # 3 PNG giữa mỗi beat
        thu_png = os.path.join(ra, "png_beat")
        os.makedirs(thu_png, exist_ok=True)
        for b in meta[kho]["LOI"]:
            for pc in (25, 50, 75):
                t = min(b["bd"] + b["dai"] * pc / 100, dai - 0.1)
                trich(video, t, os.path.join(thu_png, f"{kho}_{b['id']}_{pc:02d}pc_t{t:05.2f}.png"), jpg=False)
        # tờ ghép 4 fps
        w, h = (320, 180) if kho == "16x9" else (180, 320)
        anh = [Image.fromarray(a) for a in giai_ma(video, 4, w, h, mau=True)]
        to_ghep(anh, [f"{i / 4:.2f}" for i in range(len(anh))], os.path.join(ra, f"to_khung_4fps_{kho}.jpg"), 12 if kho == "16x9" else 16, 160 if kho == "16x9" else 90)
        st = json.load(open(stats))
        nhip, ti_le = do_nhip(video, kho)
        bang[kho] = ti_le
        tong["kho"][kho] = {
            "fps_dat": st["fps_dat"], "so_khung": st["so_khung"], "thoi_gian_xuat_giay": st["thoi_gian_xuat_giay"],
            "thoi_luong_video_giay": st["thoi_luong_video_giay"], "ti_le_nhanh_hon_thuc": st["ti_le_nhanh_hon_thuc"],
            "codec_xuat_tu_web": f"{st.get('codec_hinh')} + {st.get('codec_tieng')}", **nhip,
            "so_tep_khung": len(moc), "tep_khung_lon_nhat_kb": round(lon_nhat / 1024, 1)
        }
        chuyen_ma(video, os.path.join(ra, f"video_{kho}.mp4"))
    to_ghep([Image.open(os.path.join(ra, "khung_16x9", f)) for f in sorted(os.listdir(os.path.join(ra, "khung_16x9")))],
            [f"t = {float(f[2:-4]):.1f} s" for f in sorted(os.listdir(os.path.join(ra, "khung_16x9")))], os.path.join(ra, "to_khung.jpg"), 6, 320)
    with open(os.path.join(ra, "bang_pixel_diff.csv"), "w", newline="") as fp:
        wcsv = csv.writer(fp)
        wcsv.writerow(["giay", "ti_le_doi_16x9_phan_tram", "doi_hinh_16x9", "ti_le_doi_9x16_phan_tram", "doi_hinh_9x16"])
        for (t, a), (_t2, b) in zip(bang["16x9"], bang["9x16"]):
            wcsv.writerow([t, round(a * 100, 2), int(a > 0.06), round(b * 100, 2), int(b > 0.06)])
    mau = os.path.join(ra, "mau_10s.mp4")
    for crf in (20, 23, 26, 29):
        chuyen_ma(v16, mau, dai=10, crf=crf, tieng=False)
        if os.path.getsize(mau) <= 3 * 1024 * 1024:
            break
    tong["mau_10s"] = {"tep": "mau_10s.mp4", "kb": round(os.path.getsize(mau) / 1024, 1)}
    tong["chuyen_ma"] = "video_*.mp4 và mau_10s.mp4: chuyển mã H.264 (libx264) + AAC từ chính tệp web xuất từng khung (VP9 + Opus trên máy thử không có bộ mã hoá H.264); không dựng lại hình"
    for k in ("video_16x9.mp4", "video_9x16.mp4"):
        tong[k] = {"kb": round(os.path.getsize(os.path.join(ra, k)) / 1024, 1), "giay": round(thoi_luong(os.path.join(ra, k)), 2)}
    m = tong["kho"]["16x9"]
    do_luong = {k: m[k] for k in ("fps_dat", "so_khung", "thoi_gian_xuat_giay", "thoi_luong_video_giay", "ti_le_nhanh_hon_thuc", "khung_lap_lai_toi_da_giay", "so_lan_doi_hinh", "khoang_doi_hinh_dai_nhat_giay")}
    do_luong["chi_tiet"] = tong
    json.dump(do_luong, open(os.path.join(ra, "do_luong.json"), "w"), ensure_ascii=False, indent=1)
    print(json.dumps({k: {x: v[x] for x in ("fps_dat", "thoi_gian_xuat_giay", "ti_le_nhanh_hon_thuc", "so_lan_doi_hinh", "khoang_doi_hinh_dai_nhat_giay", "khoang_tinh_dai_nhat_tu_giay", "khoang_doi_hinh_trung_binh_giay", "so_khoang_tren_4_giay", "khung_lap_lai_toi_da_giay", "so_tep_khung", "tep_khung_lon_nhat_kb", "codec_xuat_tu_web")} for k, v in tong["kho"].items()}, ensure_ascii=False, indent=1))
    print(json.dumps({k: tong[k] for k in ("mau_10s", "video_16x9.mp4", "video_9x16.mp4")}, ensure_ascii=False))


if __name__ == "__main__":
    main()
