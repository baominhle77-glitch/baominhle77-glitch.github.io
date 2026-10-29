"""Vẽ một beat kênh Torque Split bằng khuôn canh_ts.py (Manim CE, không cần LaTeX).

  python ve_beat.py --sb storyboard_d16.json --tap tap/K4_t3.json --beat h1 --kho 16x9 --ra DIR [--khung 0.5] [--cao 540]

--khung u   : chỉ 1 khung PNG tại u·T của beat (trạm manim_thu_540, D16 "1 khung/beat 540p")
không --khung: video đủ beat (trạm render_du), fps 30.
Đầu ra: DIR/<beat>_<kho>.png hoặc DIR/<beat>_<kho>.mp4. Máy gọi phải tự đặt mức ưu tiên BelowNormal.
"""
import argparse
import os
import shutil
import sys
import tempfile
from pathlib import Path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sb", required=True)
    ap.add_argument("--tap")
    ap.add_argument("--beat", required=True)
    ap.add_argument("--kho", choices=["16x9", "9x16"], default="16x9")
    ap.add_argument("--ra", required=True)
    ap.add_argument("--khung", type=float)
    ap.add_argument("--cao", type=int, default=540, help="cạnh ngắn (px): 540 thử, 1080 đủ")
    a = ap.parse_args()
    os.environ.update(TS_SB=a.sb, TS_BEAT=a.beat, TS_KHO=a.kho)
    if a.tap:
        os.environ["TS_TAP"] = a.tap
    if a.khung is not None:
        os.environ["TS_KHUNG"] = str(a.khung)
    else:
        os.environ.pop("TS_KHUNG", None)
    from manim import config, tempconfig
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    import json
    import canh_ts
    b = next(x for x in json.loads(Path(a.sb).read_text(encoding="utf-8"))["beats"] if x["id"] == a.beat)
    lop = canh_ts.CANH.get(b["scene"])
    if lop is None:
        print(f"KHONG_CO_CANH {b['scene']}")
        return 2
    w, h = (a.cao * 16 // 9, a.cao) if a.kho == "16x9" else (a.cao, a.cao * 16 // 9)
    ra = Path(a.ra)
    ra.mkdir(parents=True, exist_ok=True)
    tam = Path(tempfile.mkdtemp(prefix="ts_ve_", dir=str(ra)))
    try:
        with tempconfig({"pixel_width": w, "pixel_height": h, "frame_height": 9.0, "frame_width": 9.0 * w / h,
                         "frame_rate": 30, "media_dir": str(tam), "save_last_frame": a.khung is not None,
                         "write_to_movie": a.khung is None, "disable_caching": True, "verbosity": "WARNING",
                         "progress_bar": "none", "output_file": f"{a.beat}_{a.kho}"}):
            canh = lop()
            canh.render()
            duoi = ".png" if a.khung is not None else ".mp4"
            ra_tep = sorted(tam.rglob("*" + duoi), key=lambda p: p.stat().st_mtime)
            if not ra_tep:
                print("KHONG_RA_TEP")
                return 3
            dich = ra / f"{a.beat}_{a.kho}{duoi}"
            shutil.move(str(ra_tep[-1]), dich)
            print("OK", dich.as_posix())
    finally:
        shutil.rmtree(tam, ignore_errors=True)  # thư mục tạm do chính lệnh này tạo trong DIR
    return 0


if __name__ == "__main__":
    sys.exit(main())
