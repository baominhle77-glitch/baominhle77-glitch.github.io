#!/usr/bin/env python3
"""Dựng bộ dẫn chứng qa/<phiên bản>/ theo barem skill kiem-chat-luong-video, mục 1.

Mọi khung lấy từ CHÍNH tệp video đã xuất (giải mã bằng ffmpeg), không chụp màn hình xem trước.
Dùng: python3 bo_dan_chung.py <thu_muc_ra> <video_16x9.mp4> <video_9x16.mp4> <stats_16x9.json> <stats_9x16.json> <meta.json>
"""
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


def trich_khung(video, t, dich):
    tam = dich + ".png"
    chay(["ffmpeg", "-y", "-ss", f"{t:.3f}", "-i", video, "-frames:v", "1", tam])
    im = Image.open(tam).convert("RGB")
    im.save(dich, "JPEG", quality=82, optimize=True)
    os.remove(tam)
    return os.path.getsize(dich)


def to_ghep(thu_muc, ra, cot=6, rong=320):
    tep = sorted([f for f in os.listdir(thu_muc) if f.endswith(".jpg")], key=lambda f: float(f[2:-4]))
    ims = [Image.open(os.path.join(thu_muc, f)) for f in tep]
    cao = int(ims[0].height * rong / ims[0].width)
    hang = (len(ims) + cot - 1) // cot
    S = Image.new("RGB", (cot * rong, hang * (cao + 24)), (18, 18, 18))
    d = ImageDraw.Draw(S)
    try:
        font = ImageFont.truetype("DejaVuSans.ttf", 15)
    except OSError:
        font = ImageFont.load_default()
    for i, (f, im) in enumerate(zip(tep, ims)):
        x, y = (i % cot) * rong, (i // cot) * (cao + 24)
        S.paste(im.resize((rong, cao)), (x, y + 24))
        d.text((x + 6, y + 4), f"t = {float(f[2:-4]):.1f} s", fill=(255, 255, 255), font=font)
    S.save(ra, "JPEG", quality=80, optimize=True)


def giai_ma_xam(video, fps, w, h):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", video, "-vf", f"fps={fps},scale={w}:{h},format=gray", "-f", "rawvideo", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.uint8).reshape(-1, h, w).astype(np.int16)


def do_nhip(video, kho):
    """Khung lặp (30 fps): hai khung liên tiếp coi như giống hệt khi chênh lệch điểm ảnh lớn nhất ≤ 2/255.
    Đổi hình (lấy mẫu 4 fps): khác > 12/255 trên > 6 % diện tích = một lần đổi hình."""
    w, h = (480, 270) if kho == "16x9" else (270, 480)
    f30 = giai_ma_xam(video, 30, w, h)
    lap_dai = 0
    hien = 0
    for i in range(1, len(f30)):
        if np.abs(f30[i] - f30[i - 1]).max() <= 2:
            hien += 1
            lap_dai = max(lap_dai, hien)
        else:
            hien = 0
    f4 = giai_ma_xam(video, 4, w, h)
    su_kien = []
    for i in range(1, len(f4)):
        ti_le = float((np.abs(f4[i] - f4[i - 1]) > 12).mean())
        if ti_le > 0.06:
            su_kien.append(round(i / 4, 2))
    dai = len(f30) / 30
    moc = [0.0] + su_kien + [dai]
    khoang = [round(b - a, 2) for a, b in zip(moc, moc[1:])]
    # các lần đổi hình liền nhau (cùng một chuyển động camera) gộp thành một "đổi hình"
    gop = []
    for t in su_kien:
        if not gop or t - gop[-1][-1] > 0.26:
            gop.append([t])
        else:
            gop[-1].append(t)
    moc_gop = [0.0] + [g[0] for g in gop] + [dai]
    khoang_gop = [round(b - a, 2) for a, b in zip(moc_gop, moc_gop[1:])]
    return {
        "khung_lap_lai_toi_da_giay": round(lap_dai / 30, 3),
        "so_lan_doi_hinh": len(gop),
        "so_mau_4fps_vuot_nguong": len(su_kien),
        "khoang_doi_hinh_dai_nhat_giay": max(khoang_gop),
        "khoang_doi_hinh_trung_binh_giay": round(sum(khoang_gop) / len(khoang_gop), 2),
        "moc_doi_hinh_giay": [g[0] for g in gop],
        "_khoang_dai_nhat_theo_mau_4fps": max(khoang),
    }


def main():
    ra, v16, v9, s16, s9, meta_p = sys.argv[1:7]
    meta = json.load(open(meta_p))
    os.makedirs(ra, exist_ok=True)
    tong = {"cach_do": "bo_dan_chung.py: khung giải mã từ chính video xuất bằng ffmpeg; lặp = chênh lớn nhất ≤ 2/255 ở 30 fps (480 px); đổi hình = khác > 12/255 trên > 6 % diện tích, lấy mẫu 4 fps, các mẫu liền nhau gộp một lần", "kho": {}}
    for kho, video, stats in (("16x9", v16, s16), ("9x16", v9, s9)):
        dai = thoi_luong(video)
        thu = os.path.join(ra, f"khung_{kho}")
        os.makedirs(thu, exist_ok=True)
        lon_nhat = 0
        moc = moc_khung(dai, meta[kho]["chuyenCanh"])
        for t in moc:
            lon_nhat = max(lon_nhat, trich_khung(video, t, os.path.join(thu, f"t_{t:06.1f}.jpg")))
        st = json.load(open(stats))
        nhip = do_nhip(video, kho)
        tong["kho"][kho] = {
            "fps_dat": st["fps_dat"], "so_khung": st["so_khung"], "thoi_gian_xuat_giay": st["thoi_gian_xuat_giay"],
            "thoi_luong_video_giay": st["thoi_luong_video_giay"], "ti_le_nhanh_hon_thuc": st["ti_le_nhanh_hon_thuc"],
            "codec_xuat_tu_web": st["codec_hinh"], **nhip,
            "so_tep_khung": len(moc), "tep_khung_lon_nhat_kb": round(lon_nhat / 1024, 1)
        }
    to_ghep(os.path.join(ra, "khung_16x9"), os.path.join(ra, "to_khung.jpg"))
    # 10 s đầu bản 16:9, H.264, ≤ 3 MB: chuyển mã từ chính tệp web xuất (Chromium thử nghiệm không có bộ mã hoá H.264)
    mau = os.path.join(ra, "mau_10s.mp4")
    for br in (2300, 2000, 1700):
        chay(["ffmpeg", "-y", "-i", v16, "-t", "10", "-an", "-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p", "-b:v", f"{br}k", "-maxrate", f"{br}k", "-bufsize", f"{br * 2}k", "-preset", "slow", "-movflags", "+faststart", mau])
        if os.path.getsize(mau) <= 3 * 1024 * 1024:
            break
    tong["mau_10s"] = {"tep": "mau_10s.mp4", "kb": round(os.path.getsize(mau) / 1024, 1), "ghi_chu": "chuyển mã H.264 (libx264) từ tệp VP9 do web xuất từng khung; không dựng lại hình"}
    m = tong["kho"]["16x9"]
    do_luong = {
        "fps_dat": m["fps_dat"], "so_khung": m["so_khung"], "thoi_gian_xuat_giay": m["thoi_gian_xuat_giay"],
        "thoi_luong_video_giay": m["thoi_luong_video_giay"], "ti_le_nhanh_hon_thuc": m["ti_le_nhanh_hon_thuc"],
        "khung_lap_lai_toi_da_giay": m["khung_lap_lai_toi_da_giay"], "so_lan_doi_hinh": m["so_lan_doi_hinh"],
        "khoang_doi_hinh_dai_nhat_giay": m["khoang_doi_hinh_dai_nhat_giay"],
        "chi_tiet": tong
    }
    json.dump(do_luong, open(os.path.join(ra, "do_luong.json"), "w"), ensure_ascii=False, indent=1)
    print(json.dumps(do_luong, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
