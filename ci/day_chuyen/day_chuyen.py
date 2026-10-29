"""Dây chuyền một lệnh cho một tập — lệnh Chủ tịch 29/10 [CONG_NGHIEP_HOA].

  python day_chuyen.py chay <tap> [--den TRAM] [--thu]     chạy tuần tự, ghi sổ tap.json, chạy lại thì đi tiếp từ trạm hỏng
  python day_chuyen.py lo <tap> <tap> ...                   chạy gối nhiều tập: mỗi loại tải một hàng đợi, render theo sức máy
  python day_chuyen.py trang-thai <tap>                     in sổ
  python day_chuyen.py danh-dau <tap> <tram> DAT|CHUA [--giay N] [--ghi-chu ...]   ghi tay (trạm đã làm trước khi có dây chuyền)
  python day_chuyen.py bao-cao [<tap> ...]                  thời gian từng trạm, so với đích 2 tập/ngày, nêu nút thắt số 1

Nguyên tắc:
  * Thứ tự trạm cố định (TRAM). Lệnh của từng trạm nằm trong khuôn kênh the_loai/kenh/<kenh>.json — tập mới chỉ đổi nội dung.
  * Trạm ĐẠT = lệnh rc 0 và mọi tệp `dau_ra` có mặt. Đã ĐẠT thì không bao giờ chạy lại (muốn làm lại: danh-dau ... CHUA).
  * Trạm chưa có lệnh trong khuôn -> CHO_CAU_HINH, tập dừng ở đó và báo (không đoán việc).
  * Mọi tiến trình con chạy BelowNormal; chỉ khởi trạm khi commit < 75 % và RAM trống >= 3 GB + nhu cầu của trạm.
  * Không chạy nền tách rời: lệnh chờ mọi tiến trình con xong.
"""
import argparse
import ctypes
import glob
import json
import os
import shutil
import subprocess
import sys
import threading
import time
from datetime import datetime
from pathlib import Path

GOC_REPO = Path(__file__).resolve().parents[2]
THU_MUC_KHUON = GOC_REPO / "the_loai" / "kenh"
GOC_SO = Path(os.environ.get("DAY_CHUYEN_SO", "E:/Studio/out/_giam_doc/day_chuyen"))
TRAM = ["nguon", "nhap_loi_gpt", "cong_so_lieu", "ho_so", "kiem_tinh", "tts",
        "manim_thu_540", "render_du", "compose", "gate_chung", "d25", "combo_dang"]
TIEN_TO_KENH = {"ML": "meniscus_lab", "ST": "scope_trace", "SN": "strata_notes",
                "TS": "torque_split", "GSB": "grid_square_brief"}
COMMIT_TRAN = 75.0
RAM_SAN_GB = 3.0
BELOW_NORMAL = 0x00004000
GIAY_NGAY = 86400
DICH_TAP_NGAY = 2


# ---------- máy ----------
class _Mem(ctypes.Structure):
    _fields_ = [("dwLength", ctypes.c_ulong), ("dwMemoryLoad", ctypes.c_ulong),
                ("ullTotalPhys", ctypes.c_ulonglong), ("ullAvailPhys", ctypes.c_ulonglong),
                ("ullTotalPageFile", ctypes.c_ulonglong), ("ullAvailPageFile", ctypes.c_ulonglong),
                ("ullTotalVirtual", ctypes.c_ulonglong), ("ullAvailVirtual", ctypes.c_ulonglong),
                ("ullAvailExtendedVirtual", ctypes.c_ulonglong)]


def do_may():
    m = _Mem()
    m.dwLength = ctypes.sizeof(_Mem)
    ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(m))
    commit = 100.0 * (m.ullTotalPageFile - m.ullAvailPageFile) / m.ullTotalPageFile
    return {"commit": round(commit, 1), "ram_gb": round(m.ullAvailPhys / 2**30, 2)}


def may_cho_phep(can_gb):
    d = do_may()
    return d["commit"] < COMMIT_TRAN and d["ram_gb"] >= RAM_SAN_GB + can_gb, d


def pid_song(pid):
    if not pid:
        return False
    h = ctypes.windll.kernel32.OpenProcess(0x1000, False, int(pid))
    if not h:
        return False
    ma = ctypes.c_ulong()
    ctypes.windll.kernel32.GetExitCodeProcess(h, ctypes.byref(ma))
    ctypes.windll.kernel32.CloseHandle(h)
    return ma.value == 259


# ---------- khuôn + sổ ----------
def kenh_cua(tap):
    tt = tap.split("_")[0]
    if tt not in TIEN_TO_KENH:
        raise SystemExit(f"LOI khong ro kenh cua tap {tap} (tien to {tt})")
    return TIEN_TO_KENH[tt]


def doc_khuon(kenh):
    p = THU_MUC_KHUON / f"{kenh}.json"
    if not p.exists():
        raise SystemExit(f"LOI chua co khuon kenh {p}")
    return json.loads(p.read_text(encoding="utf-8"))


def duong_so(tap):
    return GOC_SO / tap / "tap.json"


def doc_so(tap):
    p = duong_so(tap)
    if p.exists():
        return json.loads(p.read_text(encoding="utf-8"))
    return {"tap": tap, "kenh": kenh_cua(tap), "bien": {}, "tram": {t: {"trang_thai": "CHUA"} for t in TRAM}}


def ghi_so(so):
    p = duong_so(so["tap"])
    p.parent.mkdir(parents=True, exist_ok=True)
    tam = p.with_suffix(".json.dang_ghi")
    tam.write_text(json.dumps(so, ensure_ascii=False, indent=1), encoding="utf-8")
    os.replace(tam, p)


def bien_tap(so, khuon):
    b = {"tap": so["tap"], "kenh": so["kenh"], "repo": GOC_REPO.as_posix(),
         "so": duong_so(so["tap"]).parent.as_posix(), "py": khuon.get("py", sys.executable).replace("\\", "/")}
    ma = "_".join(so["tap"].split("_")[1:])  # TS_K4_t3 -> K4_t3
    b.update({"ma": ma, "ma_nho": ma.replace("_", "").lower(), "dc": Path(__file__).resolve().parent.as_posix()})
    b.update(khuon.get("bien", {}))
    b.update(so.get("bien", {}))
    for _ in range(3):
        b = {k: (v.format(**b) if isinstance(v, str) else v) for k, v in b.items()}
    return b


def tram_tiep(so):
    for t in TRAM:
        if so["tram"].get(t, {}).get("trang_thai") != "DAT":
            return t
    return None


# ---------- chạy một trạm ----------
def bat_dau_tram(so, khuon, tram):
    cfg = khuon["tram"].get(tram) or {}
    if not cfg.get("lenh"):
        so["tram"][tram] = {**so["tram"].get(tram, {}), "trang_thai": "CHO_CAU_HINH",
                            "ghi_chu": cfg.get("ghi_chu", "khuon kenh chua co lenh cho tram nay")}
        ghi_so(so)
        return None
    b = bien_tap(so, khuon)
    lenh = cfg["lenh"].format(**b)
    log = duong_so(so["tap"]).parent / f"{tram}.log"
    bash = shutil.which("bash") or "C:/Program Files/Git/bin/bash.exe"
    fh = open(log, "ab")
    fh.write(f"\n===== {datetime.now():%Y-%m-%d %H:%M:%S} {tram}: {lenh}\n".encode("utf-8"))
    fh.flush()
    p = subprocess.Popen([bash, "-lc", lenh], cwd=b.get("cwd", GOC_REPO.as_posix()), stdout=fh,
                         stderr=subprocess.STDOUT, creationflags=BELOW_NORMAL)
    cu = so["tram"].get(tram, {})
    so["tram"][tram] = {"trang_thai": "DANG", "pid": p.pid, "bat_dau": time.time(),
                        "lan": cu.get("lan", 0) + 1, "lich_su": cu.get("lich_su", []), "log": log.as_posix()}
    ghi_so(so)
    return p, fh, b


def ket_thuc_tram(so, khuon, tram, p, fh, b, luc_xong=None):
    rc = p.wait()
    fh.close()
    st = so["tram"][tram]
    giay = round((luc_xong or time.time()) - st["bat_dau"], 1)
    thieu = []
    for mau in (khuon["tram"][tram].get("dau_ra") or []):
        duong = mau.format(**b)
        if not glob.glob(duong):
            thieu.append(duong)
    dat = rc == 0 and not thieu
    st["lich_su"].append({"luc": datetime.now().strftime("%Y-%m-%d %H:%M"), "rc": rc, "giay": giay, "thieu": thieu})
    st.update({"trang_thai": "DAT" if dat else "TRUOT", "rc": rc, "giay": giay, "pid": None,
               "xong": datetime.now().strftime("%Y-%m-%d %H:%M")})
    if thieu:
        st["thieu"] = thieu
    ghi_so(so)
    print(f"{so['tap']} {tram} {'DAT' if dat else 'TRUOT'} rc={rc} {giay}s" + (f" thieu={thieu}" if thieu else ""), flush=True)
    return dat


def khoa_tap(so):
    for t, st in so["tram"].items():
        if st.get("trang_thai") == "DANG":
            if pid_song(st.get("pid")):
                raise SystemExit(f"LOI {so['tap']} tram {t} dang chay o pid {st['pid']} — khong chay chong")
            st["trang_thai"] = "TRUOT"
            st["ghi_chu"] = "tien trinh chet giua chung — chay lai tu tram nay"
    ghi_so(so)


def chay(tap, den=None, thu=False):
    so = doc_so(tap)
    khuon = doc_khuon(so["kenh"])
    khoa_tap(so)
    while True:
        tram = tram_tiep(so)
        if tram is None:
            print(f"{tap} XONG DU 12 TRAM")
            return 0
        if thu:
            print(f"{tap} tram tiep: {tram} lenh: {(khuon['tram'].get(tram) or {}).get('lenh')}")
            return 0
        can = (khuon["tram"].get(tram) or {}).get("ram_gb", 0)
        while True:
            ok, d = may_cho_phep(can)
            if ok:
                break
            print(f"{tap} {tram} CHO_MAY commit {d['commit']}% RAM {d['ram_gb']} GB", flush=True)
            time.sleep(60)
        r = bat_dau_tram(so, khuon, tram)
        if r is None:
            print(f"{tap} DUNG tai {tram}: CHO_CAU_HINH — {so['tram'][tram]['ghi_chu']}")
            return 3
        if not ket_thuc_tram(so, khuon, tram, *r):
            print(f"{tap} DUNG tai {tram} — sua roi chay lai cung lenh, cac tram DAT duoc bo qua")
            return 2
        if den and tram == den:
            return 0


# ---------- chạy gối nhiều tập ----------
def lo(taps):
    tai_khe = {}
    so_tap, khuon_tap, dang = {}, {}, {}
    for t in taps:
        so_tap[t] = doc_so(t)
        khuon_tap[t] = doc_khuon(so_tap[t]["kenh"])
        khoa_tap(so_tap[t])
        tai_khe.update(khuon_tap[t].get("khe", {}))
    tai_khe = {"render": 1, "gpt": 1, "nhe": 2, **tai_khe}
    dung = set()
    xong_luc = {}  # pid -> giờ thoát thật (luồng chờ ghi), để sổ không lệch theo nhịp quét
    while True:
        for t, (tram, p, fh, b) in list(dang.items()):
            if p.poll() is not None:
                if not ket_thuc_tram(so_tap[t], khuon_tap[t], tram, p, fh, b, xong_luc.pop(p.pid, None)):
                    dung.add(t)
                del dang[t]
        cho = [t for t in taps if t not in dang and t not in dung and tram_tiep(so_tap[t])]
        if not cho and not dang:
            break
        dem = {}
        for t, (tram, *_r) in dang.items():
            k = khuon_tap[t]["tram"][tram].get("tai", "nhe")
            dem[k] = dem.get(k, 0) + 1
        for t in cho:
            tram = tram_tiep(so_tap[t])
            cfg = khuon_tap[t]["tram"].get(tram) or {}
            k = cfg.get("tai", "nhe")
            if dem.get(k, 0) >= tai_khe.get(k, 1):
                continue
            ok, d = may_cho_phep(cfg.get("ram_gb", 0))
            if not ok:
                continue
            r = bat_dau_tram(so_tap[t], khuon_tap[t], tram)
            if r is None:
                print(f"{t} DUNG tai {tram}: CHO_CAU_HINH")
                dung.add(t)
                continue
            dang[t] = (tram, *r)
            threading.Thread(target=lambda q=r[0]: (q.wait(), xong_luc.__setitem__(q.pid, time.time())), daemon=True).start()
            dem[k] = dem.get(k, 0) + 1
            print(f"{t} BAT_DAU {tram} [{k}] commit {d['commit']}% RAM {d['ram_gb']} GB", flush=True)
        time.sleep(5)
    for t in taps:
        print(t, "XONG" if tram_tiep(so_tap[t]) is None else f"dung o {tram_tiep(so_tap[t])}")


# ---------- báo cáo ----------
def bao_cao(taps):
    if not taps:
        taps = [p.parent.name for p in GOC_SO.glob("*/tap.json")]
    tong = {}
    for t in taps:
        so = doc_so(t)
        khuon = doc_khuon(so["kenh"])
        for tram in TRAM:
            g = so["tram"].get(tram, {}).get("giay")
            if g:
                k = (khuon["tram"].get(tram) or {}).get("tai", "nhe")
                tong.setdefault(tram, {"tai": k, "giay": []})["giay"].append(g)
    if not tong:
        print("chua co so do")
        return
    ngan_sach = GIAY_NGAY / DICH_TAP_NGAY
    print(f"Dich {DICH_TAP_NGAY} tap/ngay => moi tai noi tiep duoc {ngan_sach/3600:.1f} h/tap")
    theo_tai = {}
    for tram in TRAM:
        if tram in tong:
            tb = sum(tong[tram]["giay"]) / len(tong[tram]["giay"])
            theo_tai[tong[tram]["tai"]] = theo_tai.get(tong[tram]["tai"], 0) + tb
            print(f"  {tram:14s} [{tong[tram]['tai']:6s}] TB {tb/3600:6.2f} h  ({len(tong[tram]['giay'])} lan do)")
    for k, g in sorted(theo_tai.items(), key=lambda x: -x[1]):
        print(f"  TAI {k:6s}: {g/3600:.2f} h/tap = {g/ngan_sach*100:.0f}% ngan sach")
    k1 = max(theo_tai, key=theo_tai.get)
    tram1 = max((t for t in tong if tong[t]["tai"] == k1), key=lambda t: sum(tong[t]["giay"]) / len(tong[t]["giay"]))
    print(f"NUT_THAT_1: tai {k1}, tram {tram1}")


def main():
    ap = argparse.ArgumentParser()
    sp = ap.add_subparsers(dest="lenh", required=True)
    a = sp.add_parser("chay"); a.add_argument("tap"); a.add_argument("--den"); a.add_argument("--thu", action="store_true")
    a = sp.add_parser("lo"); a.add_argument("taps", nargs="+")
    a = sp.add_parser("trang-thai"); a.add_argument("tap")
    a = sp.add_parser("danh-dau"); a.add_argument("tap"); a.add_argument("tram", choices=TRAM)
    a.add_argument("trang_thai", choices=["DAT", "CHUA"]); a.add_argument("--giay", type=float); a.add_argument("--ghi-chu", default="")
    a = sp.add_parser("dat-bien"); a.add_argument("tap"); a.add_argument("cap", nargs="+", help="ten=gia_tri")
    a = sp.add_parser("bao-cao"); a.add_argument("taps", nargs="*")
    x = ap.parse_args()
    if x.lenh == "chay":
        sys.exit(chay(x.tap, x.den, x.thu))
    if x.lenh == "lo":
        lo(x.taps)
    elif x.lenh == "trang-thai":
        so = doc_so(x.tap)
        for t in TRAM:
            st = so["tram"].get(t, {})
            print(f"{t:14s} {st.get('trang_thai','CHUA'):12s} {st.get('giay','') or ''} {st.get('ghi_chu','')}")
    elif x.lenh == "danh-dau":
        so = doc_so(x.tap)
        st = so["tram"].setdefault(x.tram, {})
        st.update({"trang_thai": x.trang_thai, "ghi_chu": x.ghi_chu or "danh dau tay"})
        if x.giay:
            st["giay"] = x.giay
        ghi_so(so)
        print(x.tap, x.tram, x.trang_thai)
    elif x.lenh == "dat-bien":
        so = doc_so(x.tap)
        for c in x.cap:
            k, v = c.split("=", 1)
            so["bien"][k] = v
        ghi_so(so)
    elif x.lenh == "bao-cao":
        bao_cao(x.taps)


if __name__ == "__main__":
    main()
