#!/usr/bin/env python3
# Cổng máy "hình diễn giải lời" phía SX (GĐ 25/10): đo nhịp đổi hình của tập, so với 7 video cùng chủ đề đã đo.
#   python3 kiem_nhip_canh.py <thu_muc_khung_t_XXXX.X.jpg | tap.mp4> [ket_qua.json]
# Thước (giống hệt khi đo kênh mẫu bằng storyboard YouTube, ô 4,9-5,0 s):
#   lấy 1 ô / 5 s, thu 160x90 xám; "đổi mạnh" = |Δ| xám TB giữa hai ô liền nhau > 18 (thang 0-255);
#   "cụm hình" = aHash 8x8 khác mọi cụm đã có > 10 bit.
# Mẫu đo 25/10 (PBS Eons ×3, Insane Curiosity, Earthly, Deep Space Project, WeltraumNerd):
#   đổi mạnh 7,8-10,8 / phút; cụm 3,8-7,1 / phút; cửa sổ 20 s có đổi mạnh 97-100 %; đứng yên lâu nhất 15-30 s.
#   K3t4 bản 1 (PR #142): 0,1 / phút; 0,4 cụm / phút  -> TRƯỢT.
# Đẩy nét chì quét, tô bóng chạy, rung chữ để "qua" cổng là gian lận: KĐ đối chiếu tờ ghép với lời, gặp là TRƯỢT cả tập.
import json, pathlib, re, subprocess, sys
import numpy as np
from PIL import Image

NGUONG = {"doi_manh_moi_phut": 7.5, "cum_moi_phut": 3.5, "cua_so_20s_co_doi_pct": 95, "dung_yen_lau_nhat_s_toi_da": 30}
BUOC = 5.0


def tu_thu_muc(d):
    ks = sorted((float(m.group(1)), f) for f in pathlib.Path(d).glob("t_*.jpg") if (m := re.match(r"t_0*([0-9.]+)\.jpg$", f.name)))
    chon, moc = [], -1e9
    for t, f in ks:
        if t - moc >= BUOC - 1e-6:
            chon.append(Image.open(f).convert("RGB"))
            moc = t
    return chon, (ks[-1][0] + (ks[1][0] - ks[0][0]) if len(ks) > 1 else BUOC)


def tu_mp4(p):
    sec = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p], capture_output=True, text=True).stdout)
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-vf", f"fps=1/{BUOC},scale=320:180", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
    return [Image.fromarray(x) for x in np.frombuffer(raw, np.uint8).reshape(-1, 180, 320, 3)], sec


def do(o, sec):
    g = [np.asarray(x.convert("L").resize((160, 90)), np.float32) for x in o]
    d = [float(np.abs(a - b).mean()) > 18 for a, b in zip(g, g[1:])]
    cum = []
    for x in o:
        s = np.asarray(x.convert("L").resize((8, 8)), np.float32)
        h = (s > s.mean()).flatten()
        if all((h != c).sum() > 10 for c in cum):
            cum.append(h)
    chay = best = 0
    for x in d:
        chay = 0 if x else chay + 1
        best = max(best, chay)
    phut = sec / 60
    win = [any(d[i:i + 4]) for i in range(max(len(d) - 3, 1))]
    return {"giay": round(sec, 1), "so_o": len(o), "doi_manh_moi_phut": round(sum(d) / phut, 1), "cum_moi_phut": round(len(cum) / phut, 1),
            "cua_so_20s_co_doi_pct": round(100 * float(np.mean(win))), "dung_yen_lau_nhat_s": (best + 1) * BUOC}


def main():
    src = sys.argv[1]
    o, sec = tu_mp4(src) if src.endswith(".mp4") else tu_thu_muc(src)
    r = do(o, sec)
    loi = []
    if r["doi_manh_moi_phut"] < NGUONG["doi_manh_moi_phut"]:
        loi.append(f"đổi hình mạnh {r['doi_manh_moi_phut']}/phút < {NGUONG['doi_manh_moi_phut']} (mẫu cùng chủ đề 7,8-10,8)")
    if r["cum_moi_phut"] < NGUONG["cum_moi_phut"]:
        loi.append(f"cụm hình khác nhau {r['cum_moi_phut']}/phút < {NGUONG['cum_moi_phut']} (mẫu 3,8-7,1) — cảnh lặp lại")
    if r["cua_so_20s_co_doi_pct"] < NGUONG["cua_so_20s_co_doi_pct"]:
        loi.append(f"chỉ {r['cua_so_20s_co_doi_pct']} % cửa sổ 20 s có đổi hình mạnh < {NGUONG['cua_so_20s_co_doi_pct']} % (mẫu 97-100 %)")
    if r["dung_yen_lau_nhat_s"] > NGUONG["dung_yen_lau_nhat_s_toi_da"]:
        loi.append(f"hình đứng yên {r['dung_yen_lau_nhat_s']} s > {NGUONG['dung_yen_lau_nhat_s_toi_da']} s")
    r["loi"], r["ket_luan"] = loi, "ĐẠT" if not loi else "TRƯỢT"
    print(f"nhịp cảnh {r['ket_luan']}: " + json.dumps(r, ensure_ascii=False))
    if len(sys.argv) > 2:
        pathlib.Path(sys.argv[2]).write_text(json.dumps(r, ensure_ascii=False, indent=1), encoding="utf-8")
    sys.exit(1 if loi else 0)


if __name__ == "__main__":
    main()
