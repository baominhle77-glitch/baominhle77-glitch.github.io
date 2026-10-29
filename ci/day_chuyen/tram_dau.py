"""Sáu trạm đầu của dây chuyền (v2, lệnh GĐ 29/10 — chạy thật bằng K4 t3). Chung mọi kênh dùng bộ do_lai:
storyboard.json (meta + beats) + lớp bổ sung HS (bo_sung.json) + .srt lời khoá + audio TTS.

  python tram_dau.py nguon     --sb S --bs B --ra DIR
  python tram_dau.py loi       --sb S --srt F --ra DIR
  python tram_dau.py so_lieu   --sb S --srt F --ra DIR
  python tram_dau.py ho_so     --sb S --bs B --ra DIR
  python tram_dau.py kiem_tinh --ra DIR [--soat soat_d16.py]
  python tram_dau.py tts       --sb S --srt F --audio A --ra DIR
  python tram_dau.py manim_thu --ra DIR --canh-dir D     (1 khung/beat 540p; cảnh thiếu lớp Manim -> TRƯỢT, liệt kê)

Mỗi trạm ghi DIR/<tram>.json {"dat": bool, "loi": [...], ...} và thoát rc 0 khi ĐẠT, 1 khi TRƯỢT.
Chỉ ĐỌC nguồn; mọi tệp ghi ra nằm trong DIR (sổ tập của dây chuyền).
"""
import argparse
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

MA_NGUON = re.compile(r"(ISBN[\s:]*[0-9X-]{10,17}|DOI[\s:]*10\.\S+|10\.\d{4,9}/\S+|arXiv[\s:]*\S+|ISO\s*\d+|IEEE\s*\S+|https?://\S+|[A-Z]{2,}[\w-]*\s+[A-Z]?\d[\w-]{3,})", re.I)


def doc(p):
    return json.loads(Path(p).read_text(encoding="utf-8"))


def ket(ra, tram, loi, **them):
    ra = Path(ra)
    ra.mkdir(parents=True, exist_ok=True)
    kq = {"tram": tram, "dat": not loi, "so_loi": len(loi), "loi": loi, **them}
    (ra / f"{tram}.json").write_text(json.dumps(kq, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{tram} {'DAT' if not loi else 'TRUOT'} {len(loi)} loi" + ("" if not loi else ": " + " | ".join(map(str, loi[:8]))))
    return 0 if not loi else 1


def doc_srt(p):
    cues = []
    for khoi in re.split(r"\r?\n\r?\n", Path(p).read_text(encoding="utf-8-sig").strip()):
        d = khoi.splitlines()
        if len(d) < 3:
            continue
        m = re.match(r"(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)", d[1])
        if not m:
            continue
        g = list(map(int, m.groups()))
        cues.append({"t0": g[0] * 3600 + g[1] * 60 + g[2] + g[3] / 1000, "t1": g[4] * 3600 + g[5] * 60 + g[6] + g[7] / 1000,
                     "text": " ".join(d[2:])})
    return cues


def bang_nguon(bs):
    return {n["ma"]: n for n in (bs.get("meta_bo_sung", {}).get("nguon_bang") or [])}


# ---------- trạm ----------
def t_nguon(a):
    sb, bs = doc(a.sb), doc(a.bs)
    bang = bang_nguon(bs)
    loi = []
    ma_cua = {}
    for ma, n in bang.items():
        m = MA_NGUON.search(n.get("tren_man", ""))
        if not m:
            loi.append(f"{ma}: tren man '{n.get('tren_man')}' khong co ma kiem duoc (ISBN/DOI/arXiv/ISO/IEEE/so tai lieu)")
            continue
        so = re.sub(r"\W", "", m.group(0)).upper()
        if so in ma_cua and ma_cua[so] != ma:
            loi.append(f"{ma} va {ma_cua[so]} dung CHUNG ma {m.group(0)} nhung mo ta khac nhau — mot trong hai sai nguon")
        ma_cua[so] = ma
    dung = {}
    for b in sb["beats"]:
        s = b.get("source")
        if s not in bang:
            loi.append(f"{b['id']}: nguon {s} khong co trong bang nguon")
        dung.setdefault(s, []).append(b["id"])
    return ket(a.ra, "nguon", loi, nguon_dung=dung, bang=list(bang))


def t_loi(a):
    sb = doc(a.sb)
    p = Path(a.srt)
    if not p.exists():
        return ket(a.ra, "loi", [f"chua co loi khoa {p} — tram nhap_loi_gpt phai qua GPT Chat (D19)"])
    sha1 = hashlib.sha1(p.read_bytes()).hexdigest()
    loi, canh_bao = [], []
    mong = sb.get("meta", {}).get("srt_sha")
    if mong and mong != sha1:
        # Nguồn khoá duy nhất là BAN_DO_TAP_3_4 (GĐ chốt 29/10): .srt ở đó dùng nguyên; meta cũ chỉ là cảnh báo.
        canh_bao.append(f"srt sha1 {sha1[:8]} khac meta.srt_sha {mong[:8]} (meta lap 25/10 tu ban goc khac) — theo BAN_DO dung nguyen .srt nay")
    cues = doc_srt(p)
    if not cues:
        loi.append("srt rong")
    return ket(a.ra, "loi", loi, canh_bao=canh_bao, srt=p.as_posix(), sha1=sha1, so_cue=len(cues), het=cues[-1]["t1"] if cues else 0,
               ghi_chu="loi da khoa (BAN_DO_TAP_3_4) — dung nguyen, khong gui GPT")


def t_so_lieu(a):
    sb = doc(a.sb)
    cues = doc_srt(a.srt)
    beats = sb["beats"]
    loi, co_so = [], []
    for c in cues:
        so = re.findall(r"\d+(?:[.,]\d+)?", c["text"])
        if not so:
            continue
        giua = (c["t0"] + c["t1"]) / 2
        b = next((b for b in beats if b["t0"] <= giua < b["t1"] + 1e-6), None)
        if b is None:
            loi.append(f"cue {c['t0']:.2f}s co so {so} nhung khong thuoc beat nao")
            continue
        if not b.get("source"):
            loi.append(f"{b['id']}: noi so {so} ma beat khong co ma nguon")
        co_so.append({"beat": b["id"], "so": so, "nguon": b.get("source")})
    return ket(a.ra, "so_lieu", loi, cau_co_so=len(co_so), chi_tiet=co_so)


def t_ho_so(a):
    sb, bs = doc(a.sb), doc(a.bs)
    lop = bs.get("lop_theo_canh") or {}
    clip = {}
    for c in bs.get("clip_that") or []:
        clip.setdefault(c["beat"], []).append(c)
    loi = []
    for b in sb["beats"]:
        if b.get("scene") in lop:
            b["lop"] = lop[b["scene"]]
        else:
            loi.append(f"{b['id']}: canh {b.get('scene')} chua co lop xa/gan + bong trong bo_sung.lop_theo_canh")
        if b["id"] in clip:
            b["clip_that"] = clip[b["id"]]
    sb.setdefault("meta", {})["bo_sung"] = Path(a.bs).as_posix()
    sb["meta"]["C7"] = bs.get("meta_bo_sung", {}).get("C7")
    ra = Path(a.ra)
    ra.mkdir(parents=True, exist_ok=True)
    (ra / "storyboard_d16.json").write_text(json.dumps(sb, ensure_ascii=False, indent=1), encoding="utf-8")
    return ket(a.ra, "ho_so", loi, ban_ve=(ra / "storyboard_d16.json").as_posix(), so_beat=len(sb["beats"]),
               canh=sorted({b.get("scene") for b in sb["beats"]}), so_clip_that=sum(map(len, clip.values())))


def t_kiem_tinh(a):
    sys.path.insert(0, str(Path(a.soat).parent))
    import importlib
    soat = importlib.import_module(Path(a.soat).stem).soat
    tong, nb, ds = soat(str(Path(a.ra) / "storyboard_d16.json"))
    loi = [f"{bid} {ma}: {mo}" for bid, ma, mo in ds]
    return ket(a.ra, "kiem_tinh", loi, tong_giay=round(tong, 2), so_beat=nb)


def t_tts(a):
    sb = doc(a.sb)
    cues = doc_srt(a.srt)
    loi = []
    p = Path(a.audio)
    if not p.exists():
        return ket(a.ra, "tts", [f"chua co audio {p} — goi tools/tts_adapter.py (v3)"])
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)],
                       capture_output=True, text=True)
    dai = float(r.stdout.strip() or 0)
    het = cues[-1]["t1"] if cues else 0
    if abs(dai - het) > 1.0:
        loi.append(f"audio {dai:.2f}s lech srt {het:.2f}s > 1 s")
    if dai < 480:
        loi.append(f"audio {dai:.2f}s < 480 s")
    t1 = sb["beats"][-1]["t1"]
    if abs(t1 - het) > 1.0:
        loi.append(f"beat cuoi ket {t1:.2f}s lech srt {het:.2f}s")
    return ket(a.ra, "tts", loi, audio=p.as_posix(), giay=round(dai, 3), sha8=hashlib.sha256(p.read_bytes()).hexdigest()[:8])


def t_manim_thu(a):
    sb = doc(Path(a.ra) / "storyboard_d16.json")
    canh = sorted({b.get("scene") for b in sb["beats"]})
    co = set()
    for f in Path(a.canh_dir).glob("*.py") if a.canh_dir and Path(a.canh_dir).exists() else []:
        co |= set(re.findall(r"^class\s+(\w+)\s*\(", f.read_text(encoding="utf-8", errors="replace"), re.M))
    thieu = [c for c in canh if c not in co]
    loi = [f"canh {c}: chua co lop Manim trong {a.canh_dir} (khuon beat kenh)" for c in thieu]
    return ket(a.ra, "manim_thu", loi, canh_can=canh, canh_co=sorted(co & set(canh)))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("tram", choices=["nguon", "loi", "so_lieu", "ho_so", "kiem_tinh", "tts", "manim_thu"])
    for k in ("sb", "bs", "srt", "audio", "ra", "canh-dir"):
        ap.add_argument(f"--{k}")
    ap.add_argument("--soat", default="E:/Studio/out/_ho_so/TS_K4_t3/_lam/soat_d16.py")
    a = ap.parse_args()
    sys.exit({"nguon": t_nguon, "loi": t_loi, "so_lieu": t_so_lieu, "ho_so": t_ho_so, "kiem_tinh": t_kiem_tinh,
              "tts": t_tts, "manim_thu": t_manim_thu}[a.tram](a))


if __name__ == "__main__":
    main()
