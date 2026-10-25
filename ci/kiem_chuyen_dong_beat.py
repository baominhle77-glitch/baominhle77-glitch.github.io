# -*- coding: utf-8 -*-
"""C17-g: đo VẬT CHÍNH từng beat, 4 fps, trong ROI Manim xuất từ self.F.

Không tính camera đơn độc là bằng chứng vật lý: ngoài pixel gate phải có
object + motion law trong storyboard và updater trong mã scene, KĐ vẫn xem clip.
Ngưỡng khởi điểm nêu công khai: >=0.3% pixels/ROI đổi >=12/255 độ sáng
mới tính một cặp khung động (giảm nhiễu H.264). >=90% cặp, đứng liên tiếp <=2s.
"""
from pathlib import Path
import re
import subprocess

import numpy as np

SAMPLE_FPS = 4
PIXEL_DELTA = 12
MIN_CHANGED_PIXEL_RATIO = 0.003
MIN_MOVING_PAIR_PCT = 90.0
MAX_STILL_S = 2.0

ROI_RE = re.compile(r"C17_ROI\s+(\w+)\s+(16x9|9x16)\s+" +
                    r"([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)")


def parse_roi(log, beat, fmt):
    matches = [m for m in ROI_RE.finditer(log)
               if m.group(1) == beat and m.group(2) == fmt]
    if len(matches) != 1:
        raise ValueError("C17G_THIEU_HOAC_TRUNG_ROI %s %s count=%d" %
                         (fmt, beat, len(matches)))
    vals = [float(v) for v in matches[0].groups()[2:]]
    x, y, w, h = vals
    if min(vals) < 0 or w < .04 or h < .04 or x + w > 1.00001 or y + h > 1.00001:
        raise ValueError("C17G_ROI_BAT_HOP_LE %s/%s %r" % (fmt, beat, vals))
    return vals


def evaluate(video, beat, fmt, start_s, end_s, roi, full_end_s):
    video = Path(video)
    if not video.is_file():
        raise FileNotFoundError(video)
    # ffprobe đọc kích thước thật, không phỏng đoán từ tên khổ hoặc CLI.
    meta = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=width,height", "-of", "csv=p=0", str(video)],
        capture_output=True, text=True)
    if meta.returncode:
        raise RuntimeError("C17G_FFPROBE_LOI %s/%s %s" %
                           (fmt, beat, meta.stderr[-600:]))
    size = meta.stdout.strip().split(",")
    if len(size) != 2:
        raise ValueError("C17G_FFPROBE_KICH_THUOC %r" % meta.stdout)
    width, height = [int(v) for v in size]
    expected = (960, 540) if fmt == "16x9" else (540, 960)
    if (width, height) != expected:
        raise ValueError("C17G_KHONG_PHAI_540P %s/%s %dx%d (can %r)" %
                         (fmt, beat, width, height, expected))
    x, y, w, h = roi
    # YUV420 mặc định crop chia hết cho 2; exact=1 đo đúng hộp gốc.
    px = max(0, int(round(x * width)))
    py = max(0, int(round(y * height)))
    pw = min(width - px, max(1, int(round(w * width))))
    ph = min(height - py, max(1, int(round(h * height))))
    if pw < 24 or ph < 24:
        raise ValueError("C17G_ROI_PIXELS_NHO %s/%s" % (fmt, beat))
    sec = end_s - start_s
    if sec <= 0:
        raise ValueError("C17G_KHOANG_MAU_SAI %s" % beat)

    filter_ = "fps=%d,crop=%d:%d:%d:%d:exact=1,format=gray" % (
        SAMPLE_FPS, pw, ph, px, py)
    cmd = ["ffmpeg", "-nostdin", "-hide_banner", "-v", "error",
           "-i", str(video), "-t", "%.6f" % sec, "-vf", filter_,
           "-f", "rawvideo", "-pix_fmt", "gray", "pipe:1"]
    result = subprocess.run(cmd, capture_output=True)
    if result.returncode:
        raise RuntimeError("C17G_FFMPEG_LOI %s/%s: %s" %
                           (fmt, beat, result.stderr.decode("utf-8", "replace")[-1200:]))
    frame_bytes = pw * ph
    if len(result.stdout) % frame_bytes:
        raise RuntimeError("C17G_FRAME_BYTES %s/%s bytes=%d frame=%d dim=%dx%d crop=%s" %
                           (fmt, beat, len(result.stdout), frame_bytes, width, height, filter_))
    n = len(result.stdout) // frame_bytes
    if n < 2:
        raise RuntimeError("C17G_IT_HON_2_FRAME %s/%s %d" % (fmt, beat, n))
    frames = np.frombuffer(result.stdout, dtype=np.uint8).reshape((n, ph, pw))
    # Chuyển về signed rồi lấy delta; không tính codec noise <12/255.
    diffs = np.abs(np.diff(frames.astype(np.int16), axis=0))
    changed = np.count_nonzero(diffs >= PIXEL_DELTA, axis=(1, 2))
    moving = changed >= max(1, int(frame_bytes * MIN_CHANGED_PIXEL_RATIO))
    moving_pairs = int(np.count_nonzero(moving))
    pairs = n - 1
    ratio = 100.0 * moving_pairs / pairs
    streak = 0
    longest = 0
    for state in moving:
        if state:
            streak = 0
        else:
            streak += 1
            longest = max(longest, streak)
    longest_s = longest / SAMPLE_FPS
    passed = ratio >= MIN_MOVING_PAIR_PCT and longest_s <= MAX_STILL_S
    return {
        "beat": beat,
        "bo_cuc": fmt,
        "t_vao": round(start_s, 4),
        "t_ra": round(end_s, 4),
        "t_ra_day_du": round(full_end_s, 4),
        "doan_mau_cat_beat": bool(end_s < full_end_s - .01),
        "roi_vat_chinh": {"x": x, "y": y, "w": w, "h": h,
                          "pixel_xywh": [px, py, pw, ph]},
        "so_khung_mau": n,
        "so_cap_khung": pairs,
        "so_cap_dong": moving_pairs,
        "ty_le_cap_dong_pct": round(ratio, 3),
        "giay_dung_dai_nhat": round(longest_s, 3),
        "ket_qua": "DAT" if passed else "TRUOT"
    }
