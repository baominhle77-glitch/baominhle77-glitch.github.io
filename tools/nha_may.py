# -*- coding: utf-8 -*-
"""tools/nha_may.py — nhà máy một lệnh cho một tập K3 (lệnh GĐ 18:5x 17/10/2026; phiếu 76 chặng (ii)).

Chạy bằng venv_manim, TRONG gốc chạy sở hữu (nháp ở ổ D, tự dọn): tệp tạm, khung manim, tiếng nối, bản nối trước khi
chép, thư mục làm việc của cổng đều nằm trong gốc đó. Ổ E chỉ nhận: cache cảnh theo sha, bản trần, phụ đề, gói cổng,
video nộp, biên bản JSON/log. Không có bước VI (lệnh chủ tịch 20:3x). Không đăng bài. Không xoá tệp: ghi khác nội dung
= đổi tên bản cũ thành <tệp>.cu_<sha8> rồi ghi; tệp theo nội dung (cache, bản trần) mở "x".

  nha_may.py <storyboard.json> --ten SN_K3_t1
      [--buoc may,tts,ke_hoach,canh,render,noi,phu_de,goi_cong,pip,cong,ffprobe,adslots,goi]
      [--bo-cuc ca_hai|16x9|9x16] [--chi id,id] [--kho] [--thu-khong-pip] [--song-song 2] [--accent R,G,B] [--offline]

Thứ tự: máy (D10: commit < 75 %, RAM trống ≥ 3 GB, C ≥ 50 GB; đo lại trước mỗi lô, 1 dòng vào _build/may_truoc_lo.log)
→ TTS edge (thử lại) → kế hoạch (beat, mốc lời, số khung, chuyển cảnh) → tệp cảnh canh.py (dòng có DOI là chu() trong
tệp cảnh, cổng 7b4 --canh đọc được) → lint BS-4 + doi_ve_trong_canh → render 16:9 và 9:16 theo cache
sha(thư viện + lớp + tham số + lời + bố cục): sửa 1 cảnh chỉ render 1 cảnh → nối (đúng số khung, tiếng đệm/cắt đúng
số khung) → phụ đề .en.srt + ASS hai bố cục → gói cổng (script.json sinh từ storyboard, KHÔNG render.py) → PiP
(hop_pip_doan_v2, không sửa) hoặc bản thử không PiP → cổng 7b4 --canh → ffprobe ≥ 480 s → adslots (mốc mid-roll trong lặng) → gói nộp + dang/ từ mẫu.
--kho: render -s (khung cuối, K3_KHO=1 dừng trước chuyển cảnh ra) mọi beat, ghép tấm JPEG vào _build/kho/ để soi.
"""
import argparse
import ast
import glob
import hashlib
import io
import json
import os
import re
import shutil
import subprocess
import sys
import time

GOC = "E:/Studio"
PY = GOC + "/venv_manim/Scripts/python.exe"
PY_CONG = r"C:\Users\Admin\AppData\Local\Programs\Python\Python311\python.exe"
BAN_SAC = GOC + "/ban_sac"
THU_VIEN = [BAN_SAC + "/K3_canh/" + f for f in ("__init__.py", "khung.py", "loi.py", "lop.py")] + \
           [BAN_SAC + "/K3_so_thuc_dia.py", BAN_SAC + "/ngon_ngu.py"]
CONG = GOC + "/out/_cong_3_6/7b4/cong_3_6_7b4_v3_7.py"   # GĐ 22:50 22/10: đổi sang v3.7 58f363dc (phiếu 117 ĐẠT; v3.7 = v3.4 0a3ccb77 + 9b sửa Lỗi 1/Lỗi 2/NX100-1/-2 phiếu 100)
LINT = BAN_SAC + "/lint_bs4.py"
PIP_DIR = GOC + "/out/_cong_3_6/hop_pip_doan"
PIP_V2_SHA256 = "302d6fc1"
TTS_DIR = GOC + "/tools"
FPS = 30
BO_CUC = ("16x9", "9x16")
KICH = {"16x9": (1920, 1080), "9x16": (1080, 1920)}
TOI_THIEU_S = 480.0
MANG = ("khong", "truot_nua", "truot_trang")      # vào cảnh có mang phần tử của beat trước
DOI_RE = re.compile(r"10\.\d{4,9}/\S+")
DUONG_MA_RE = re.compile(r"^manh\.\d+\.dong_2$")
# Lệnh GĐ 14:26 22/10/2026 (luật 0.8): encoder h264_qsv (iGPU HD 4600), filter vẫn CPU; KHÔNG -init_hw_device/
# hwupload/vpp_qsv (Haswell trả -9); bỏ -sc_threshold/-keyint_min (tuỳ chọn x264). exit != 0 -> lui_x264() lần chạy đó.
# Bổ sung 14:35: GIAI_MA_QSV trước -i nguồn mp4/h264 (nối vlist, thu_khong_pip); chỗ chỉ đọc tiếng/mp3 giữ nguyên.
os.environ.setdefault("ONEVPL_SEARCH_PATH",
                      r"C:\Windows\System32\DriverStore\FileRepository\igdlh64.inf_amd64_a89617337ce7436c")
QSV = ["-c:v", "h264_qsv", "-preset", "medium", "-global_quality", "16", "-pix_fmt", "nv12", "-g", "15",
       "-flags", "+cgop"]
X264_LUI = ["-c:v", "libx264", "-preset", "fast", "-crf", "16", "-pix_fmt", "yuv420p", "-g", "15", "-keyint_min", "15",
            "-sc_threshold", "0", "-flags", "+cgop"]
X264 = QSV      # giữ tên X264 cho nha_may_k*.py (NM.X264)


GIAI_MA_QSV = ["-c:v", "h264_qsv"]      # lệnh GĐ 14:35 22/10: đặt TRƯỚC -i nguồn mp4/h264 (không áp png/lavfi/raw/f32le)


def lui_x264(cmd):
    """argv QSV -> argv libx264 y tham số cũ; xoá luôn mọi cặp giải mã -c:v h264_qsv trước -i (lùi cả giải lẫn mã)."""
    v, n = list(cmd), len(QSV)
    for i in range(len(v) - n + 1):
        if v[i:i + n] == QSV:
            v[i:i + n] = X264_LUI
            break
    else:
        raise SystemExit("LUI_X264: argv khong chua nguyen cum QSV")
    while "h264_qsv" in v:
        j = v.index("h264_qsv")
        if j == 0 or v[j - 1] != "-c:v":
            raise SystemExit("LUI_X264: h264_qsv le loi trong argv")
        del v[j - 1:j + 1]
    return v

R = os.environ.get("CLAUDE_OWNED_RUN_ROOT")


# ------------------------------------------------------------------ tiện ích
def _mau_goc(r):
    phan = [x for x in re.split(r"[\\/]+", r.strip("\\/")) if x]
    ds = [r"[\\/]+".join(re.escape(x) for x in phan)]
    if len(phan[0]) == 2 and phan[0][1] == ":":
        ds.append("/" + re.escape(phan[0][0]) + r"[\\/]+" + r"[\\/]+".join(re.escape(x) for x in phan[1:]))
    return re.compile("|".join("(?:%s)" % x for x in ds), re.IGNORECASE)


GOC_RE = _mau_goc(R) if R else None


def sach(s):
    """Đường gốc chạy sở hữu -> <goc_chay_so_huu> trước khi ghi vào tệp dự án."""
    return GOC_RE.sub("<goc_chay_so_huu>", s) if GOC_RE else s


def sha_tep(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for k in iter(lambda: f.read(1 << 20), b""):
            h.update(k)
    return h.hexdigest()


def doc_json(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def ghi_moi(p, data):
    """Ghi tệp trên E. Trùng nội dung: để nguyên. Khác: đổi tên bản cũ <p>.cu_<sha8> (không xoá) rồi ghi."""
    if isinstance(data, str):
        data = data.encode("utf-8")
    if os.path.exists(p):
        with open(p, "rb") as f:
            cu = f.read()
        if cu == data:
            return False
        bak = "%s.cu_%s" % (p, hashlib.sha256(cu).hexdigest()[:8])
        if not os.path.exists(bak):
            os.rename(p, bak)
    d = os.path.dirname(p)
    if d:
        os.makedirs(d, exist_ok=True)
    tmp = p + ".dang_ghi"
    with open(tmp, "wb") as f:
        f.write(data)
    os.replace(tmp, p)
    return True


def ghi_json(p, obj):
    return ghi_moi(p, sach(json.dumps(obj, ensure_ascii=False, indent=1)) + "\n")


def chep_x(nguon, dich):
    """Chép tệp theo nội dung sang E: đã có cùng sha -> bỏ qua; có mà khác -> lỗi (không ghi đè)."""
    s = sha_tep(nguon)
    if os.path.exists(dich):
        if sha_tep(dich) != s:
            raise SystemExit("TEP_DA_CO_KHAC_NOI_DUNG %s" % dich)
        return s
    os.makedirs(os.path.dirname(dich), exist_ok=True)
    with open(nguon, "rb") as a, open(dich, "xb") as b:
        shutil.copyfileobj(a, b, 1 << 22)
    return s


def chay(cmd, cwd=None, env=None, timeout=None):
    p = subprocess.run(cmd, cwd=cwd, env=env, capture_output=True, text=True, encoding="utf-8", errors="replace",
                       timeout=timeout)
    return p.returncode, p.stdout, p.stderr


def thong_so_video(p):
    rc, o, e = chay(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                     "stream=codec_type,r_frame_rate,start_time,nb_frames", "-of", "csv=p=0", p])
    return o.strip()


def do_dai(p):
    rc, o, e = chay(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p])
    return float(o.strip())


class NhaMay:
    def __init__(self, a):
        self.a = a
        self.sb_p = os.path.abspath(a.storyboard).replace("\\", "/")
        self.sb = doc_json(self.sb_p)
        self.thu = os.path.dirname(self.sb_p)
        self.B = self.thu + "/_build"
        os.makedirs(self.B, exist_ok=True)
        self.canh_p = self.thu + "/canh.py"
        self.kh_p = self.B + "/ke_hoach.json"
        self.ten = a.ten
        self.bo_cuc = BO_CUC if a.bo_cuc == "ca_hai" else (a.bo_cuc,)
        self.chi = [x for x in a.chi.split(",") if x]
        self.accent = tuple(int(x) for x in a.accent.split(","))

    # -------------------------------------------------------------- nhật ký và máy
    def log(self, s):
        s = sach(s)
        with open(self.B + "/nha_may.log", "a", encoding="utf-8", newline="\n") as f:
            f.write(time.strftime("%H:%M:%S %d/%m/%Y ") + s + "\n")
        print(s, flush=True)

    PS_MAY = ("$o=Get-CimInstance Win32_OperatingSystem; $p=Get-CimInstance Win32_PerfFormattedData_PerfOS_Memory; "
              "$c=($p.CommittedBytes/$p.CommitLimit)*100; $f=$o.FreePhysicalMemory/1MB; $d=Get-PSDrive C,D,E; "
              "'{0:F1}|{1:F2}|{2:F3}|{3:F2}|{4:F2}' -f $c,$f,($d[0].Free/1GB),($d[1].Free/1GB),($d[2].Free/1GB)")

    def may(self, lo):
        """D10 ngay trước lô: commit < 75 %, RAM trống ≥ 3 GB, C ≥ 50 GB; không xanh thì dừng (C < 50: báo GĐ)."""
        rc, o, e = chay(["powershell.exe", "-NoLogo", "-NoProfile", "-NonInteractive", "-Command", self.PS_MAY],
                        timeout=300)
        c, r, cd, dd, ed = [float(x) for x in o.strip().replace(",", ".").split("|")]
        xanh = c < 75 and r >= 3 and cd >= 50  # lệnh GĐ 13:1x 23/10/2026: C đã dọn qua 50 (don.sh + MEMORY.DMP vào Thùng rác), trả cổng về 50
        dong = ("máy trước lô %s: commit %.1f %% · RAM trống %.2f GB · C %.3f GB · D %.2f · E %.2f "
                "(Get-CimInstance/Get-PSDrive) -> %s" % (lo, c, r, cd, dd, ed, "XANH" if xanh else "KHONG_XANH"))
        with open(self.B + "/may_truoc_lo.log", "a", encoding="utf-8", newline="\n") as f:
            f.write(time.strftime("%H:%M:%S %d/%m/%Y ") + dong + "\n")
        self.log(dong)
        if not xanh:
            if cd < 50:
                self.log("C_DUOI_50_GB: dừng, báo GĐ (không tự dọn C)")
            raise SystemExit(3)
        return {"commit": c, "ram": r, "C": cd, "D": dd, "E": ed}

    # -------------------------------------------------------------- 2. TTS
    def tts(self):
        self.may("tts")
        sys.path.insert(0, TTS_DIR)
        import tts_adapter
        meta = self.sb["meta"]
        bs = {b["id"]: b for b in self.sb["beats"]}
        ra = {}
        for bid in meta["thu_tu_phat"]:
            kq = None
            for lan in range(1, 4):
                kq = tts_adapter.tong_hop(bs[bid]["n"], meta["voice"], backend="edge", rate=meta["rate"])
                if kq["ok"]:
                    break
                time.sleep(2 * lan)
            if not kq["ok"]:
                raise SystemExit("TTS_HONG beat %s: %s %s" % (bid, kq.get("nhanh"), kq.get("ly_do_luot")))
            words = doc_json(kq["words"])
            ra[bid] = {"mp3": kq["duong"].replace("\\", "/"), "words": kq["words"].replace("\\", "/"),
                       "mp3_sha256": sha_tep(kq["duong"]), "dur": round(do_dai(kq["duong"]), 4),
                       "so_tu": len(words), "cache_hit": kq["cache_hit"], "ly_do_luot": kq.get("ly_do_luot")}
        ghi_json(self.B + "/tts.json", {"ghi_chu": "TTS edge (tools/tts_adapter.py, cache E:/Studio/out/_tts_cache); "
                                        "dur = ffprobe format.duration của mp3", "voice": meta["voice"],
                                        "rate": meta["rate"], "backend": "edge", "beats": ra})
        tong = sum(x["dur"] for x in ra.values())
        self.log("tts xong: %d beat, %d trúng cache, tổng lời %.1f s" % (len(ra), sum(x["cache_hit"] for x in ra.values()), tong))

    # -------------------------------------------------------------- 3. kế hoạch
    @staticmethod
    def vao_cua(chuyen):
        c = chuyen.strip()
        if c.startswith("không (khung đầu)"):
            return "dau"
        if c.startswith("lat_trang"):
            return "lat_trang"
        if c.startswith("phu_lop"):
            return "phu_lop"
        if c.startswith("không"):
            if "nửa khung" in c:
                return "truot_nua"
            if "trượt trang" in c:
                return "truot_trang"
            return "khong"
        raise SystemExit("CHUYEN_KHONG_BIET %r" % chuyen)

    def ke_hoach(self):
        sys.path.insert(0, BAN_SAC)
        from K3_canh import khung
        khung.dat_ngang()
        from K3_canh.loi import so_khung
        tts = doc_json(self.B + "/tts.json")["beats"]
        meta = self.sb["meta"]
        bs = {b["id"]: b for b in self.sb["beats"]}
        thu = meta["thu_tu_phat"]
        if sorted(thu) != sorted(bs):
            raise SystemExit("THU_TU_PHAT_KHAC_DANH_SACH_BEAT")
        out, trang, bang = {}, 1, []
        for i, bid in enumerate(thu):
            b = {k: v for k, v in bs[bid].items() if k not in ("n_vi", "labels_vi", "chu_vi")}
            vao = self.vao_cua(b["chuyen"])
            if (i == 0) != (vao == "dau"):
                raise SystemExit("KHUNG_DAU_SAI %s %s" % (bid, vao))
            if vao == "lat_trang":
                trang += 1
            b.update(vao=vao, trang=trang, truoc=thu[i - 1] if i else None, sau=None, cuoi=(i == len(thu) - 1))
            if vao == "phu_lop":
                m = re.search(r"mau=\(([^)]*)\)", b["chuyen"])
                b["phu_lop_mau"] = [x.strip() for x in m.group(1).split(",")]
            if i:
                P = out[thu[i - 1]]
                if vao == "lat_trang":
                    P["sau"] = {"kieu": "lat_trang", "trang": trang}
                elif vao == "phu_lop":
                    P["sau"] = {"kieu": "phu_lop", "mau": b["phu_lop_mau"]}
            W = doc_json(tts[bid]["words"])
            b["words"] = [{"t": round(w["t0"], 4), "d": round(w["t1"] - w["t0"], 4), "w": w["w"]} for w in W]
            b["dur"] = tts[bid]["dur"]
            out[bid] = b
            bang.append("%s | %s -> %s" % (bid, b["chuyen"], vao))
        k0 = 0
        for bid in thu:
            b = out[bid]
            b["so_khung"] = so_khung(b)
            b["khung_dau"], b["t0"] = k0, round(k0 / FPS, 4)
            k0 += b["so_khung"]
        kh = {"ghi_chu": "kế hoạch dựng sinh bởi tools/nha_may.py; số khung = K3_canh.loi.so_khung; KHÔNG sửa tay",
              "storyboard_sha256": sha_tep(self.sb_p), "tts_sha256": sha_tep(self.B + "/tts.json"),
              "tong_khung": k0, "thoi_luong_s": round(k0 / FPS, 3), "thu_tu": thu,
              "ct": meta["ban_sac"]["chu_thich_cuoi_trang"], "beats": out}
        ghi_json(self.kh_p, kh)
        self.log("ke_hoach: %d beat, %d khung = %.2f s; chuyển cảnh:\n  %s" % (len(thu), k0, k0 / FPS, "\n  ".join(bang)))
        return kh

    # -------------------------------------------------------------- 4. tệp cảnh
    @staticmethod
    def _di(o, duong=""):
        if isinstance(o, dict):
            for k, v in o.items():
                yield from NhaMay._di(v, (duong + "." if duong else "") + str(k))
        elif isinstance(o, list):
            for i, v in enumerate(o):
                yield from NhaMay._di(v, (duong + "." if duong else "") + str(i))
        elif isinstance(o, str):
            yield duong, o

    def dong_ma(self, b):
        ra = []
        for d, s in self._di(b["tham_so"]):
            if DOI_RE.search(s):
                if not DUONG_MA_RE.match(d):
                    raise SystemExit("DOI_NGOAI_MANH_DONG_2 beat %s %s" % (b["id"], d))
                ra.append((d, s))
        return ra

    @staticmethod
    def tach_duoi(s):
        """Chú thích kết bằng DOI + dấu đóng (')'): dòng chu() chỉ mang DOI sạch, dấu đóng vẽ riêng (duoi)."""
        ms = list(DOI_RE.finditer(s))
        if not ms:
            return s, ""
        for m in ms:
            raw = m.group(0)
            sach_ = re.match(r"10\.\d{4,9}/[^\s\"'<>)\]]+", raw).group(0).rstrip(".,;")
            duoi = raw[len(sach_):]
            if duoi and m.end() != len(s):
                raise SystemExit("DOI_CO_DUOI_GIUA_CAU %r" % raw)
            if duoi:
                return s[:-len(duoi)], duoi
        return s, ""

    def canh(self):
        sys.path.insert(0, BAN_SAC)
        from manim import config
        config.media_dir = R + "/m"
        from K3_canh import khung
        khung.dat_ngang()
        from K3_so_thuc_dia import chu, MUC
        from K3_canh.loi import BoCuc, CO_CT, CO_MA
        kh = doc_json(self.kh_p)
        rong = {}
        for bc_ten, dat in (("16x9", khung.dat_ngang), ("9x16", khung.dat_doc)):
            dat()
            bc = BoCuc()
            rong[bc_ten] = bc.ct_x1 - bc.ct_x - 0.2
        khung.dat_ngang()

        def chia(s, w):
            rows, cur = [], ""
            for t in s.split(" "):
                thu = (cur + " " + t).strip()
                if cur and chu(thu, CO_CT, MUC, 0.8).width > w:
                    rows.append(cur)
                    cur = t
                else:
                    cur = thu
            rows.append(cur)
            if " ".join(rows) != s:
                raise SystemExit("CHIA_DONG_MAT_CHU %r" % s)
            return rows

        ct_doi = {}
        for n, s in kh["ct"].items():
            if DOI_RE.search(s):
                than, duoi = self.tach_duoi(s)
                ct_doi[n] = {"duoi": duoi, "16x9": chia(than, rong["16x9"]), "9x16": chia(than, rong["9x16"])}
        sb_sha8 = sha_tep(self.sb_p)[:8]
        L = ["# -*- coding: utf-8 -*-",
             "# Tệp cảnh %s — SINH bởi tools/nha_may.py từ storyboard.json sha256-8 %s; KHÔNG sửa tay." % (self.ten, sb_sha8),
             "# Mỗi beat một lớp TrangK3 (ban_sac/K3_canh/loi.py); lớp cảnh + tham số + lời đọc từ _build/ke_hoach.json.",
             "# Dòng có DOI (chú thích cuối trang có DOI, dòng 2 mảnh trích dẫn) là chu() TRONG tệp này (phông Georgia",
             "# của ban_sac/K3_so_thuc_dia.chu; cỡ 13 = CO_CT, 18 = CO_MA của loi.py) để cổng 7b4 --canh đối chiếu; dọc/ngang chia dòng theo bề rộng đo bằng chu().",
             "from K3_canh import khung", "", "khung.dat_theo_moi_truong()",
             "from manim import config  # noqa: E402",
             "from K3_so_thuc_dia import chu, MUC  # noqa: E402",
             "from K3_canh.loi import TrangK3  # noqa: E402", "",
             "DOC = config.frame_height > config.frame_width", ""]
        bang = []
        for bid in kh["thu_tu"]:
            b = kh["beats"][bid]
            ve = [bid] + ([b["truoc"]] if b.get("truoc") and b["vao"] in MANG else [])
            cts = sorted({str(n) for x in ve for n in kh["beats"][x]["chu_thich"]} & set(ct_doi), key=int)
            mas = [(x, d, s) for x in ve for d, s in self.dong_ma(kh["beats"][x])]
            if not re.match(r"^[A-Za-z_][A-Za-z0-9_]*$", bid):
                raise SystemExit("ID_BEAT_KHONG_LAM_TEN_LOP %r" % bid)
            L += ["", "class %s(TrangK3):" % bid, "    B = %r" % bid, "", "    def construct(self):"]
            for n in cts:
                c = ct_doi[n]
                L.append("        if DOC:")
                L.append("            self.san(%r, [%s], duoi=%r)" % ("ct" + n, ", ".join("chu(%r, %d, MUC, 0.8)" % (r, CO_CT) for r in c["9x16"]), c["duoi"]))
                L.append("        else:")
                L.append("            self.san(%r, [%s], duoi=%r)" % ("ct" + n, ", ".join("chu(%r, %d, MUC, 0.8)" % (r, CO_CT) for r in c["16x9"]), c["duoi"]))
            for x, d, s in mas:
                L.append("        self.san(%r, chu(%r, %d, MUC, 0.85))" % ("ma:%s:%s" % (x, d), s, CO_MA))
            L.append("        self.chay()")
            bang.append("%s: ct %s, ma %s" % (bid, ",".join(cts) or "-", ",".join("%s:%s" % (x, d) for x, d, _ in mas) or "-"))
        src = "\n".join(L) + "\n"
        compile(src, self.canh_p, "exec")
        doi = ghi_moi(self.canh_p, src)
        self.log("canh.py %s (sha8 %s): %s" % ("ghi mới" if doi else "không đổi", sha_tep(self.canh_p)[:8], "; ".join(bang)))
        rc, o, e = chay([PY, "-X", "utf8", "-B", LINT, "K3", self.canh_p])
        self.log("lint_bs4 K3 canh.py rc=%d: %s" % (rc, (o + e).strip()[-600:]))
        ma = ("import importlib.util,json,sys\n"
              "s=importlib.util.spec_from_file_location('cong',sys.argv[1]);m=importlib.util.module_from_spec(s)\n"
              "s.loader.exec_module(m)\n"
              "ra,goc,loi,kenh=m.doi_ve_trong_canh(sys.argv[2])\n"
              "print(json.dumps({'doi':ra,'goc':goc,'loi':loi,'kenh':kenh},ensure_ascii=False))\n")
        rc2, o2, e2 = chay([PY_CONG, "-X", "utf8", "-B", "-c", ma, CONG, self.canh_p])
        try:
            kq = json.loads(o2.strip().splitlines()[-1])
        except Exception:
            kq = {"loi_chay": (o2 + e2)[-800:]}
        kq.update(lint_rc=rc, lint=(o + e).strip()[-2000:], canh_sha256=sha_tep(self.canh_p), ct_doi=ct_doi, rong=rong)
        ghi_json(self.B + "/canh_kiem.json", kq)
        self.log("doi_ve_trong_canh: doi %s · loi %s · kenh %s" % (sorted(kq.get("doi", {})), kq.get("loi"), kq.get("kenh")))
        if rc != 0 or kq.get("loi") or "doi" not in kq:
            raise SystemExit("CANH_KHONG_QUA_KIEM")

    # -------------------------------------------------------------- 5. render theo cache
    def khoa_canh(self, kh, bid, bc, src, thu_vien, manim_v):
        tree = ast.parse(src)
        dau = [ast.get_source_segment(src, n) for n in tree.body if not isinstance(n, ast.ClassDef)]
        lop = [ast.get_source_segment(src, n) for n in tree.body if isinstance(n, ast.ClassDef) and n.name == bid]
        b = kh["beats"][bid]
        ids = {bid}
        if b.get("truoc") and b["vao"] in MANG:
            ids.add(b["truoc"])
        for i in list(ids):
            for _, s in self._di(kh["beats"][i]["tham_so"]):
                if s in kh["beats"]:
                    ids.add(s)
        bo = ("khung_dau", "t0")
        goi = {"thu_vien": thu_vien, "dau": dau, "lop": lop, "ct": kh["ct"], "bo_cuc": bc, "manim": manim_v,
               "fps": FPS, "ke_hoach": {i: {k: v for k, v in kh["beats"][i].items() if k not in bo} for i in sorted(ids)}}
        return hashlib.sha256(json.dumps(goi, ensure_ascii=False, sort_keys=True).encode("utf-8")).hexdigest()[:16]

    def render(self):
        import manim
        kh = doc_json(self.kh_p)
        with open(self.canh_p, encoding="utf-8") as f:
            src = f.read()
        thu_vien = {os.path.basename(p): sha_tep(p) for p in THU_VIEN}
        ids = self.chi or kh["thu_tu"]
        kho = self.a.kho
        for bc in self.bo_cuc:
            self.may("render%s %s (%d beat)" % (" -s" if kho else "", bc, len(ids)))
            rec_p = self.B + "/render_%s.json" % bc
            rec = doc_json(rec_p) if os.path.exists(rec_p) else {"beats": {}}
            viec = []
            for bid in ids:
                k = self.khoa_canh(kh, bid, bc, src, thu_vien, manim.__version__)
                dich = "%s/cache_canh/%s/%s.%s.mp4" % (self.B, bc, bid, k)
                if not kho and os.path.exists(dich):
                    rec["beats"][bid] = dict(rec["beats"].get(bid, {}), khoa=k, mp4=dich, cache_hit=True)
                    continue
                viec.append((bid, k, dich))
            self.log("render %s%s: %d việc, %d trúng cache" % (bc, " -s" if kho else "", len(viec), len(ids) - len(viec)))
            chay_ = []
            loi = []
            while viec or chay_:
                while viec and len(chay_) < max(1, self.a.song_song):
                    bid, k, dich = viec.pop(0)
                    md = "%s/m/%s/%s" % (R, bc, bid)
                    os.makedirs(md, exist_ok=True)
                    cmd = [PY, "-X", "utf8", "-B", "-m", "manim", "render", "--frame_rate", "30", "--media_dir", md,
                           "--disable_caching", "--progress_bar", "none", "-v", "WARNING"]
                    if kho:
                        cmd.append("-s")
                    cmd += [self.canh_p, bid]
                    env = dict(os.environ, K3_BO_CUC=bc, K3_KE_HOACH=self.kh_p, PYTHONPATH=BAN_SAC,
                               PYTHONDONTWRITEBYTECODE="1", PYTHONIOENCODING="utf-8")
                    if kho:
                        env["K3_KHO"] = "1"
                    lg = "%s/log_%s_%s.txt" % (R, bc, bid)
                    fo = open(lg, "w", encoding="utf-8")
                    p = subprocess.Popen(cmd, cwd=self.thu, env=env, stdout=fo, stderr=subprocess.STDOUT)
                    chay_.append((p, fo, lg, bid, k, dich, md, time.time()))
                time.sleep(0.5)
                for j in [j for j in chay_ if j[0].poll() is not None]:
                    chay_.remove(j)
                    p, fo, lg, bid, k, dich, md, t0 = j
                    fo.close()
                    with open(lg, encoding="utf-8", errors="replace") as f:
                        out = f.read()
                    r = self._doc_ra(out, bid, bc, kh, p.returncode, kho, md, dich, k, time.time() - t0)
                    rec["beats"][bid] = r
                    if r["loi"]:
                        loi.append(bid)
                    self.log("  %s %s: rc %d · %.0f s · %s" % (bc, bid, p.returncode, time.time() - t0,
                                                              "; ".join(r["loi"]) or "ổn"))
                    for x in (r["ngoai_vung"] + [y for y in r["kiem_vung"] if y in r["loi"]])[:12]:
                        self.log("      " + sach(x)[:400])
            rec.update(ghi_chu="render %s theo cache sha(thư viện + phần chung canh.py + lớp beat + kế hoạch beat/"
                               "beat trước/beat giữ + chú thích + bố cục + manim)" % bc,
                       thu_vien=thu_vien, manim=manim.__version__, canh_sha256=sha_tep(self.canh_p),
                       ke_hoach_sha256=sha_tep(self.kh_p))
            if kho:
                self._ghep_kho(bc, ids)
            else:
                ghi_json(rec_p, rec)
            if loi:
                raise SystemExit("RENDER_LOI %s: %s" % (bc, ",".join(loi)))

    def _doc_ra(self, out, bid, bc, kh, rc, kho, md, dich, k, giay):
        dong = [x.strip() for x in out.splitlines()]
        r = {"khoa": k, "rc": rc, "giay": round(giay, 1), "loi": [],
             "kiem_vung": [x for x in dong if x.startswith("KIEM_VUNG")],
             "ngoai_vung": [x for x in dong if x.startswith("NGOAI_VUNG") or x.startswith("CHONG")],
             "tre_moc": [x for x in dong if x.startswith("TRE_MOC")],
             "khung_du_kien": [x for x in dong if x.startswith("KHUNG_DU_KIEN") or x.startswith("KHO ")]}
        if rc != 0:
            r["loi"].append("rc %d: %s" % (rc, sach(" | ".join(dong[-6:]))[-700:]))
        for x in r["kiem_vung"]:
            m = re.search(r"loi=(\d+)", x)
            if m and int(m.group(1)):
                r["loi"].append(x)
        if r["ngoai_vung"]:
            r["loi"].append("%d dòng NGOAI_VUNG/CHONG" % len(r["ngoai_vung"]))
        if kho:
            pngs = [p for p in glob.glob(md + "/images/**/*.png", recursive=True)]
            if pngs:
                os.makedirs("%s/kho/%s" % (R, bc), exist_ok=True)
                shutil.copyfile(sorted(pngs)[-1], "%s/kho/%s/%s.png" % (R, bc, bid))
            elif rc == 0:
                r["loi"].append("không thấy png -s")
            return r
        if rc == 0:
            mp4 = [p for p in glob.glob(md + "/videos/**/%s.mp4" % bid, recursive=True) if "partial_movie_files" not in p]
            if len(mp4) != 1:
                r["loi"].append("mp4 %d tệp" % len(mp4))
                return r
            n = kh["beats"][bid]["so_khung"]
            ts = thong_so_video(mp4[0])
            r["thong_so"] = ts
            if ts != "video,30/1,0.000000,%d" % n:
                r["loi"].append("thong_so %s != %d khung" % (ts, n))
                return r
            r["sha256"] = chep_x(mp4[0], dich)
            r["mp4"] = dich
            r["cache_hit"] = False
        return r

    def _ghep_kho(self, bc, ids):
        from PIL import Image, ImageDraw
        tw, th, cot, hang = (960, 540, 2, 2) if bc == "16x9" else (540, 960, 4, 1)
        anh = [(bid, "%s/kho/%s/%s.png" % (R, bc, bid)) for bid in ids]
        anh = [x for x in anh if os.path.exists(x[1])]
        moi = cot * hang
        ra = []
        for s in range(0, len(anh), moi):
            tam = Image.new("RGB", (tw * cot, th * hang), (40, 40, 40))
            d = ImageDraw.Draw(tam)
            for i, (bid, p) in enumerate(anh[s:s + moi]):
                im = Image.open(p).convert("RGB").resize((tw, th))
                x, y = (i % cot) * tw, (i // cot) * th
                tam.paste(im, (x, y))
                d.rectangle([x, y, x + 70, y + 26], fill=(200, 0, 0))
                d.text((x + 6, y + 6), bid, fill=(255, 255, 255))
            p = "%s/kho/%s_tam_%02d.jpg" % (self.B, bc, s // moi + 1)
            os.makedirs(os.path.dirname(p), exist_ok=True)
            buf = io.BytesIO()
            tam.save(buf, "JPEG", quality=88)
            ghi_moi(p, buf.getvalue())
            ra.append("%s (%s)" % (p, ",".join(b for b, _ in anh[s:s + moi])))
        self.log("kho %s: %d ảnh -> %s" % (bc, len(anh), " ; ".join(ra)))

    # -------------------------------------------------------------- 6. nối
    def noi(self):
        kh = doc_json(self.kh_p)
        tts = doc_json(self.B + "/tts.json")["beats"]
        for bc in self.bo_cuc:
            self.may("noi " + bc)
            rec = doc_json(self.B + "/render_%s.json" % bc)
            work = "%s/noi_%s" % (R, bc)
            os.makedirs(work, exist_ok=True)
            vl, tong, beats = ["ffconcat version 1.0"], 0, []
            with open(work + "/tieng.f32", "wb") as pcm:
                for bid in kh["thu_tu"]:
                    r = rec["beats"].get(bid) or {}
                    n = kh["beats"][bid]["so_khung"]
                    if not r.get("mp4") or r.get("loi") or not os.path.exists(r["mp4"]):
                        raise SystemExit("THIEU_CANH %s %s" % (bc, bid))
                    ts = thong_so_video(r["mp4"])
                    if ts != "video,30/1,0.000000,%d" % n:
                        raise SystemExit("CANH_SAI_KHUNG %s %s %s" % (bc, bid, ts))
                    # ffconcat không nhận "duration 349/30"; cảnh đã kiểm đúng n khung ở 30/1 nên dùng thời lượng thật của tệp
                    vl += ["file '%s'" % r["mp4"]]
                    p = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", tts[bid]["mp3"], "-map", "0:a:0",
                                        "-ac", "2", "-ar", "48000", "-f", "f32le", "pipe:1"], capture_output=True)
                    if p.returncode:
                        raise SystemExit("GIAI_MA_TIENG %s" % bid)
                    raw, can = p.stdout, n * 1600 * 8
                    pcm.write(raw[:can] if len(raw) >= can else raw + b"\0" * (can - len(raw)))
                    beats.append({"beat": bid, "canh": kh["beats"][bid]["canh"], "khung_dau": tong, "so_khung": n,
                                  "mau_dem": can // 8 - len(raw) // 8, "mp3_mau": len(raw) // 8,
                                  "mp4_sha256": r.get("sha256") or sha_tep(r["mp4"])})
                    tong += n
            with open(work + "/vlist.txt", "w", encoding="utf-8", newline="\n") as f:
                f.write("\n".join(vl) + "\n")
            cmd = ["ffmpeg", "-nostdin", "-v", "error", "-stats", "-f", "concat", "-safe", "0"] + GIAI_MA_QSV + [
                   "-i", "vlist.txt", "-f", "f32le", "-ar", "48000", "-ac", "2", "-i", "tieng.f32", "-map", "0:v:0", "-map", "1:a:0",
                   "-fps_mode", "cfr", "-r", "30"] + X264 + ["-c:a", "aac", "-b:a", "384k", "-ar", "48000", "-ac", "2",
                                                            "-movflags", "+faststart", "ra.mp4"]
            t0 = time.time()
            rc, o, e = chay(cmd, cwd=work)
            if rc and "h264_qsv" in cmd:
                self.log("QSV loi noi %s rc=%s, lui libx264 lan chay nay (lenh GD 14:26 22/10): %s"
                         % (bc, rc, sach(e[-300:])))
                rc, o, e = chay(lui_x264(cmd), cwd=work)
            if rc:
                raise SystemExit("NOI_LOI %s: %s" % (bc, sach(e[-600:])))
            ts = thong_so_video(work + "/ra.mp4")
            if not ts.endswith(",%d" % tong):
                raise SystemExit("NOI_SAI_KHUNG %s %s != %d" % (bc, ts, tong))
            s = sha_tep(work + "/ra.mp4")
            dich = "%s/%s/tran_%s.mp4" % (self.B, bc, s[:8])
            chep_x(work + "/ra.mp4", dich)
            ghi_json(self.B + "/khung_beat_%s.json" % bc,
                     {"ghi_chu": "bản trần %s (chưa phụ đề, chưa PiP): ffconcat cảnh theo cache + tiếng edge đệm/cắt "
                                 "đúng số khung, giải mã+mã hoá h264_qsv gq16 g15 cgop (lùi x264 crf16 nếu QSV lỗi), aac 384k 48 kHz" % bc,
                      "ban_tran": dich, "ban_tran_bytes": os.path.getsize(dich), "sha": s, "tong_khung": tong,
                      "thoi_luong": round(tong / FPS, 3), "giay_ma_hoa": round(time.time() - t0, 1),
                      "render_sha256": sha_tep(self.B + "/render_%s.json" % bc), "beats": beats})
            self.log("noi %s: %d khung = %.2f s, bản trần %s sha8 %s (%.0f s)" % (bc, tong, tong / FPS, dich, s[:8],
                                                                               time.time() - t0))

    # -------------------------------------------------------------- 7. phụ đề (= out/M2_UART/_build/phu_de_v6.py)
    TRAIL = ",.;:!?)]}\"'\u201d\u2019\u2026"
    SUB_LINE, SUB_LINES, SUB_MAX_SEC, SUB_MIN_SEC = 58, 1, 6.0, 0.8
    INK, NEN = (0xEF, 0xE6, 0xD3), (0x2E, 0x2A, 0x26)       # GIAY / MUC của K3 (mực sắt #2E2A26, phiếu 79 Lỗi 5)

    @staticmethod
    def srt_ts(s):
        ms = int(round(s * 1000))
        return "%02d:%02d:%02d,%03d" % (ms // 3600000, ms // 60000 % 60, ms // 1000 % 60, ms % 1000)

    def tokens_for(self, text, words):
        low, cur, out, miss = text.lower(), 0, [], 0
        for w in words:
            i = low.find(w["w"].lower(), cur)
            if i < 0:
                miss += 1
                out.append((w["w"], w["t0"], w["t1"]))
                continue
            end = i + len(w["w"])
            while end < len(text) and text[end] in self.TRAIL:
                end += 1
            out.append((text[cur:end].strip(), w["t0"], w["t1"]))
            cur = end
        if out and text[cur:].strip():
            tok, t0, t1 = out[-1]
            out[-1] = (tok + " " + text[cur:].strip(), t0, t1)
        return out, miss

    def split2(self, s):
        if len(s) <= self.SUB_LINE:
            return s
        best = None
        for i, c in enumerate(s):
            if c == " ":
                m = max(i, len(s) - i - 1)
                if best is None or m < best[0]:
                    best = (m, i)
        return s if best is None else s[:best[1]] + "\n" + s[best[1] + 1:]

    @staticmethod
    def slen(toks):
        return " ".join(x[0] for x in toks)

    def split_sentence(self, s):
        cap = self.SUB_LINE * self.SUB_LINES
        total = len(self.slen(s))
        k = max(-(-total // cap), int(-(-(s[-1][2] - s[0][1]) // self.SUB_MAX_SEC)), 1)
        while True:
            out, start = [], 0
            for i in range(1, k):
                target = total * i / k
                best = None
                for j in range(start + 1, len(s)):
                    L = len(self.slen(s[:j]))
                    if len(self.slen(s[start:j])) > cap:
                        break
                    score = abs(L - target) - (12 if s[j - 1][0][-1:] in (",", ";", ":") else 0)
                    if best is None or score < best[0]:
                        best = (score, j)
                if best is None:
                    break
                out.append(s[start:best[1]])
                start = best[1]
            out.append(s[start:])
            if all(len(self.slen(c)) <= cap for c in out) or k >= len(s):
                return [c for c in out if c]
            k += 1

    def cues_for(self, text, words, t_off, t_end):
        toks, miss = self.tokens_for(text, words)
        sents, cur = [], []
        for tok in toks:
            cur.append(tok)
            if tok[0][-1:] in (".", "?", "!"):
                sents.append(cur)
                cur = []
        if cur:
            sents.append(cur)
        merged = []
        for s in sents:
            if merged and len(self.slen(merged[-1])) < 13 and len(self.slen(merged[-1] + s)) <= self.SUB_LINE * self.SUB_LINES:
                merged[-1] = merged[-1] + s
            else:
                merged.append(s)
        cues = []
        for s in merged:
            cues.extend(self.split_sentence(s))
        out = []
        for j, c in enumerate(cues):
            a = t_off + c[0][1]
            nxt = t_off + cues[j + 1][0][1] if j + 1 < len(cues) else t_end
            e = min(max(t_off + c[-1][2], a + self.SUB_MIN_SEC), nxt - 0.02)
            out.append((a, e, self.split2(" ".join(x[0] for x in c))))
        return out, miss

    @staticmethod
    def ass_ts(s):
        cs = int(round(s * 100))
        return "%d:%02d:%02d.%02d" % (cs // 360000, cs // 6000 % 60, cs // 100 % 60, cs % 100)

    @staticmethod
    def ass_col(rgb, a=0):
        return "&H%02X%02X%02X%02X" % (a, rgb[2], rgb[1], rgb[0])

    @staticmethod
    def ass_txt(s):
        return s.replace("\\", "\\\\").replace("{", "(").replace("}", ")").replace("\n", "\\N")

    # ngang = phu_de_v6 K2 (PlayRes 1920×1080, WrapStyle 2, Consolas 32, hộp 8, lề 300/300) nhưng MV 44 thay 40: đo dải
    # phụ đề thật K3 (_build/dai_phu_de.json 18/10) MV 40 cho đáy hộp 1048, lố 4 px khỏi vùng che phụ đề ngang của cổng
    # (300, 924, 1620, 1044); MV 44 đưa đáy về 1044. dọc = BO_CUC_DOC_9x16.md (PlayRes 1080×1920, WrapStyle 0, Consolas 34,
    # hộp 8, lề 80/155, MV 680)
    ASS_BC = {"16x9": (1920, 1080, 2, 32, 8, 300, 300, 44), "9x16": (1080, 1920, 0, 34, 8, 80, 155, 680)}

    def viet_ass(self, cues, bc):
        W, H, WRAP, FS, BOX, ML, MR, MV = self.ASS_BC[bc]
        box = self.ass_col(self.NEN, 0x40)
        head = ("[Script Info]\nScriptType: v4.00+\nPlayResX: %d\nPlayResY: %d\nWrapStyle: %d\nScaledBorderAndShadow: yes\n\n"
                "[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, "
                "Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, "
                "MarginL, MarginR, MarginV, Encoding\n" % (W, H, WRAP))
        style = "Style: Sub,%s,%d,%s,%s,%s,%s,0,0,0,0,100,100,0,0,3,%d,0,2,%d,%d,%d,1\n" % (
            "Consolas", FS, self.ass_col(self.INK), self.ass_col(self.INK), box, box, BOX, ML, MR, MV)
        ev = "\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n" + "".join(
            "Dialogue: 0,%s,%s,Sub,,0,0,0,,%s\n" % (self.ass_ts(a), self.ass_ts(e), self.ass_txt(s)) for a, e, s in cues)
        return head + style + ev

    def phu_de(self):
        kh = doc_json(self.kh_p)
        tts = doc_json(self.B + "/tts.json")["beats"]
        cues, miss_all, loi = [], 0, []
        for bid in kh["thu_tu"]:
            b = kh["beats"][bid]
            t_off = b["khung_dau"] / FPS
            t_end = (b["khung_dau"] + b["so_khung"]) / FPS
            c, miss = self.cues_for(b["n"], doc_json(tts[bid]["words"]), t_off, t_end)
            for a, e, s in c:
                if a < t_off - 1e-6 or e > t_end + 1e-6 or e <= a:
                    loi.append("cue ngoài beat %s %.2f-%.2f" % (bid, a, e))
                if any(len(x) > self.SUB_LINE for x in s.split("\n")) or s.count("\n") + 1 > self.SUB_LINES:
                    loi.append("cue dài %s %r" % (bid, s))
            cues += c
            miss_all += miss
        # phiếu 79 Lỗi 3: đuôi lặng beat cuối (k2 ~2,4 s) làm cue cuối hết sớm hơn video > 2 s; kéo cue cuối tới cách
        # cuối video 1,0 s (vẫn trong beat cuối, không đụng tiếng/hình)
        if cues and t_end - cues[-1][1] > 2.0:
            cues[-1] = (cues[-1][0], round(t_end - 1.0, 3), cues[-1][2])
        for i in range(len(cues) - 1):
            if cues[i][1] > cues[i + 1][0] + 1e-6:
                loi.append("cue chồng %d" % i)
        if loi:
            raise SystemExit("PHU_DE_LOI: " + "; ".join(loi[:8]))
        srt = "\n".join("%d\n%s --> %s\n%s\n" % (i + 1, self.srt_ts(a), self.srt_ts(e), s) for i, (a, e, s) in enumerate(cues))
        d = self.B + "/phu_de"
        ghi_moi("%s/%s.en.srt" % (d, self.ten), srt)
        for bc in BO_CUC:
            ghi_moi("%s/%s_%s.ass" % (d, self.ten, bc), self.viet_ass(cues, bc))
        ghi_json(d + "/phu_de.json", {"ghi_chu": "cue theo phu_de_v6 (K2) — mốc từ WordBoundary edge + khung_dau; một "
                                                 "danh sách cue cho hai bố cục; .en.srt dùng chung cho ngang và dọc",
                                      "so_cue": len(cues), "tu_khong_khop": miss_all,
                                      "srt_sha256": sha_tep("%s/%s.en.srt" % (d, self.ten)),
                                      "ass_sha256": {bc: sha_tep("%s/%s_%s.ass" % (d, self.ten, bc)) for bc in BO_CUC},
                                      "ke_hoach_sha256": sha_tep(self.kh_p)})
        self.log("phu_de: %d cue, %d từ không khớp chữ lời" % (len(cues), miss_all))

    # -------------------------------------------------------------- 8. gói cổng
    def chuong(self, kh):
        """Mốc chương thật = khung_dau của beat đầu mỗi nhóm meta.cau_truc (cùng thứ tự với dòng chương của description)."""
        ra = []
        for nhom, ds in self.sb["meta"]["cau_truc"].items():
            s = int(kh["beats"][ds[0]]["khung_dau"] // FPS)
            ra.append((nhom, ds[0], "%d:%02d" % (s // 60, s % 60)))
        return ra

    def description_that(self, kh):
        p = self.thu + "/description.md"
        with open(p, encoding="utf-8", newline="") as f:
            t = f.read()
        ch = self.chuong(kh)
        dong = t.split("\n")
        vt = [i for i, x in enumerate(dong) if re.match(r"^\d{1,2}:\d{2} \S", x)]
        if len(vt) != len(ch):
            raise SystemExit("DESCRIPTION_SO_DONG_CHUONG %d != %d" % (len(vt), len(ch)))
        for i, (_, _, mm) in zip(vt, ch):
            dong[i] = re.sub(r"^\d{1,2}:\d{2}", mm, dong[i])
        # NX76-6: mốc đã là giờ thật của tiếng đã render -> dòng tiêu đề bỏ chú 'ước tính từ kịch bản'
        tieu = [i for i, x in enumerate(dong) if x.startswith("Chapters")]
        if len(tieu) != 1 or tieu[0] != vt[0] - 1:
            raise SystemExit("DESCRIPTION_DONG_CHAPTERS %r" % tieu)
        dong[tieu[0]] = "Chapters" + ("\r" if dong[tieu[0]].endswith("\r") else "")
        return "\n".join(dong), ch

    def goi_cong(self):
        kh = doc_json(self.kh_p)
        meta = self.sb["meta"]
        desc, ch = self.description_that(kh)
        doi_desc = ghi_moi(self.thu + "/description.md", desc)
        th_sha = sha_tep(self.thu + "/thumbnail.png")
        for bc in self.bo_cuc:
            w, h = KICH[bc]
            beats = []
            for bid in kh["thu_tu"]:
                b = kh["beats"][bid]
                src = [{"code": c, "cite": b["src"], "in_figure": True} for c in b.get("ma_chuan", [])] or [{"cite": b["src"]}]
                beats.append({"id": bid, "n": b["n"], "labels": b["labels"], "src": src, "scene": {"kind": b["canh"]},
                              "nguon": b.get("nguon", [])})
            sp = {"meta": {"title": meta["title"], "alt_title": meta["alt_title"], "voice": meta["voice"],
                           "rate": meta["rate"], "w": w, "h": h, "fps": FPS, "kenh": "K3", "kenh_ten": "Strata Notes",
                           "ban_sac": "ban_sac/K3_so_thuc_dia.py + ban_sac/K3_canh/ (tệp cảnh canh.py)",
                           "nguon": meta["nguon"], "sinh_tu": "storyboard.json sha256 %s (nha_may.py)" % sha_tep(self.sb_p)},
                  "beats": beats}
            d = "%s/goi_cong/%s" % (self.B, bc)
            ghi_json(d + "/script.json", sp)
            ghi_json(d + "/titles.json", {"titles": [{"text": meta["title"]}, {"text": meta["alt_title"]}]})
            ghi_moi(d + "/description.md", desc)
            with open(self.thu + "/thumbnail.png", "rb") as f:
                ghi_moi(d + "/thumbnail.png", f.read())
            if os.path.exists(d + "/render.py"):
                raise SystemExit("GOI_CONG_CO_RENDER_PY")
        self.log("goi_cong: %s; description.md %s (chương %s); thumbnail sha8 %s" % (
            ",".join(self.bo_cuc), "ghi mới" if doi_desc else "không đổi", " ".join("%s=%s" % (b, m) for _, b, m in ch), th_sha[:8]))

    # -------------------------------------------------------------- 9. PiP / bản thử không PiP
    def ten_ra(self, bc):
        return "%s/%s_%s.mp4" % (self.thu, self.ten, "1080p30" if bc == "16x9" else "doc_1080x1920")

    def pip(self):
        for bc in self.bo_cuc:
            kb = doc_json(self.B + "/khung_beat_%s.json" % bc)
            ass = "%s/phu_de/%s_%s.ass" % (self.B, self.ten, bc)
            if self.a.thu_khong_pip:
                self.may("thu_khong_pip " + bc)
                work = "%s/thu_%s" % (R, bc)
                os.makedirs(work, exist_ok=True)
                cmd = ["ffmpeg", "-nostdin", "-v", "error"] + GIAI_MA_QSV + ["-i", kb["ban_tran"], "-vf",
                       "subtitles=%s:fontsdir='C\\:/Windows/Fonts'" % os.path.basename(ass), "-map", "0:v:0",
                       "-map", "0:a:0"] + X264 + ["-c:a", "copy", "-movflags", "+faststart", work + "/ra.mp4"]
                t0 = time.time()
                rc, o, e = chay(cmd, cwd=os.path.dirname(ass))
                if rc and "h264_qsv" in cmd:
                    self.log("QSV loi thu_khong_pip %s rc=%s, lui libx264 lan chay nay (lenh GD 14:26 22/10): %s"
                             % (bc, rc, sach(e[-300:])))
                    rc, o, e = chay(lui_x264(cmd), cwd=os.path.dirname(ass))
                if rc:
                    raise SystemExit("DOT_PHU_DE_LOI %s: %s" % (bc, sach(e[-600:])))
                s = sha_tep(work + "/ra.mp4")
                dich = "%s/thu/%s_%s_THU_KHONG_PIP_%s.mp4" % (self.B, self.ten, bc, s[:8])
                chep_x(work + "/ra.mp4", dich)
                self.log("thu_khong_pip %s: %s (%s, %.0f s) — bản THỬ, không nộp" % (bc, dich, thong_so_video(dich),
                                                                                  time.time() - t0))
                continue
            cau_hinh = self.B + "/pip_%s.json" % bc
            if not os.path.exists(cau_hinh):
                raise SystemExit("THIEU_CAU_HINH_PIP %s (đoạn raw + lý do chọn; raw K3 media/identity/K3/)" % cau_hinh)
            ch = doc_json(cau_hinh)
            if not os.path.exists(ch.get("raw", "")):
                raise SystemExit("THIEU_RAW_K3 %s" % ch.get("raw"))
            if not sha_tep(PIP_DIR + "/hop_pip_doan_v2.py").startswith(PIP_V2_SHA256):
                raise SystemExit("HOP_PIP_DOAN_V2_DA_DOI")
            self.may("pip " + bc)
            sys.path.insert(0, PIP_DIR)
            from hop_pip_doan_v2 import hop_pip_doan_v2
            ra_cuoi = self.ten_ra(bc)
            if os.path.exists(ra_cuoi):
                raise SystemExit("VIDEO_NOP_DA_CO %s (không ghi đè)" % ra_cuoi)
            vr = "%s/%s" % (R, os.path.basename(ra_cuoi))
            t0 = time.time()
            kq = hop_pip_doan_v2(kb["ban_tran"], vr, accent=self.accent, doan=ch["doan"], ly_do_chon=ch["ly_do_chon"],
                                 tap=ch["tap"], cat_khung=ch.get("cat_khung"), ly_do_2_doan=ch.get("ly_do_2_doan"),
                                 raw=ch["raw"], ass=ass, gop_s=ch.get("gop_s"), thu_muc=R, so_cai=ch.get("so_cai"),
                                 ra_cuoi=ra_cuoi)
            chep_x(vr, ra_cuoi)
            ghi_json(ra_cuoi + ".render.json", {"ban_tran": kb["ban_tran"], "ban_tran_sha256": kb["sha"], "ass": ass,
                                                "ass_sha256": sha_tep(ass), "pip": ch, "accent": list(self.accent),
                                                "ket_qua": kq, "giay": round(time.time() - t0, 1),
                                                "sha256": sha_tep(ra_cuoi), "bytes": os.path.getsize(ra_cuoi)})
            self.log("pip %s: %s (%.0f s)" % (bc, ra_cuoi, time.time() - t0))

    # -------------------------------------------------------------- 10. cổng 7b4 --canh, 11. ffprobe
    def video_nop(self, bc):
        if self.a.thu_khong_pip:
            ds = sorted(glob.glob("%s/thu/%s_%s_THU_KHONG_PIP_*.mp4" % (self.B, self.ten, bc)), key=os.path.getmtime)
            return ds[-1] if ds else None
        return self.ten_ra(bc)

    def cong(self):
        for bc in self.bo_cuc:
            v = self.video_nop(bc)
            if not v or not os.path.exists(v):
                raise SystemExit("THIEU_VIDEO_CHO_CONG %s" % bc)
            self.may("cong " + bc)
            work = "%s/cong_%s" % (R, bc)
            os.makedirs(work, exist_ok=False)
            cmd = [PY_CONG, "-X", "utf8", "-B", CONG, "--bundle", "%s/goi_cong/%s" % (self.B, bc), "--video", v,
                   "--work", work, "--accent", "%d,%d,%d" % self.accent, "--label", "%s_%s" % (self.ten, bc),
                   "--canh", self.canh_p, "--out-dir", self.thu + "/_cong_3_6_7b4_v3_7"]
            if self.a.offline:
                cmd.append("--offline")
            t0 = time.time()
            rc, o, e = chay(cmd, timeout=10800)
            ghi_moi("%s/cong_%s.log" % (self.B, bc), sach("$ %s ... rc=%d %.0f s\n%s\n--- stderr\n%s"
                                                          % (os.path.basename(CONG), rc, time.time() - t0,
                                                             o[-20000:], e[-6000:])))
            self.log("cong %s rc=%d (%.0f s): %s" % (bc, rc, time.time() - t0, sach(o.strip()[-500:])))

    def ffprobe(self):
        ra = {}
        for bc in self.bo_cuc:
            v = self.video_nop(bc)
            if not v or not os.path.exists(v):
                raise SystemExit("THIEU_VIDEO %s" % bc)
            dd = do_dai(v)
            ra[bc] = {"video": v, "sha256": sha_tep(v), "bytes": os.path.getsize(v), "thoi_luong_s": dd,
                      "thong_so": thong_so_video(v), "dat_480": dd >= TOI_THIEU_S}
            self.log("ffprobe %s: %.3f s %s" % (bc, dd, "≥ 480 ĐẠT" if dd >= TOI_THIEU_S else "< 480 KHÔNG ĐẠT"))
        ghi_json(self.B + "/ffprobe.json", ra)
        if not all(x["dat_480"] for x in ra.values()):
            raise SystemExit("DUOI_480_S")

    # -------------------------------------------------------------- 11b. mốc mid-roll
    @staticmethod
    def _gio(t):
        return "%d:%02d:%06.3f" % (int(t // 3600), int(t % 3600 // 60), t % 60)

    def adslots(self):
        """adslots.json cho bản 16:9: mốc = khung_dau beat thẻ trạm (meta.adslots) / 30; mỗi mốc phải rơi vào khoảng lặng
        (RMS ô 20 ms < -50 dBFS) trên tiếng của chính video nộp (ffmpeg -> PCM 48 kHz mono, chỉ đọc)."""
        import numpy as np
        kh = doc_json(self.kh_p)
        ff = doc_json(self.B + "/ffprobe.json")
        if "16x9" not in ff:
            raise SystemExit("ADSLOT_THIEU_FFPROBE_16x9")
        f = ff["16x9"]
        if sha_tep(f["video"]) != f["sha256"]:
            raise SystemExit("ADSLOT_VIDEO_DOI_SAU_FFPROBE")
        ids = []
        for g in re.findall(r"\(([^)]*)\)", self.sb["meta"].get("adslots", "")):
            q = [x.strip() for x in g.split(",") if x.strip()]
            if q and all(x in kh["beats"] for x in q):
                ids = q
        if not ids or any(x not in kh["beats"] for x in ids):
            raise SystemExit("ADSLOT_MOC_KHONG_RO %r" % ids)
        p = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", f["video"], "-map", "0:a:0", "-ac", "1", "-ar", "48000",
                            "-f", "s16le", "-"], capture_output=True)
        if p.returncode != 0 or not p.stdout:
            raise SystemExit("ADSLOT_KHONG_DOC_DUOC_TIENG rc=%d" % p.returncode)
        W, O = 960, 0.02
        a = np.frombuffer(p.stdout[:len(p.stdout) // 2 * 2], dtype="<i2").astype(np.float64) / 32768.0
        n = len(a) // W
        db = 20 * np.log10(np.sqrt(np.mean(a[:n * W].reshape(n, W) ** 2, axis=1)) + 1e-12)
        lang = db < -50.0
        trung_vi = float(np.median(db[~lang])) if (~lang).any() else float("nan")
        slots = []
        for bid in ids:
            b = kh["beats"][bid]
            k = int(b["khung_dau"])
            t = k / FPS
            i = min(int(t / O + 1e-9), n - 1)
            if not (lang[max(i - 1, 0)] and lang[i]):
                raise SystemExit("ADSLOT_KHONG_TRONG_LANG %s t=%.3f db=%.1f/%.1f" % (bid, t, db[max(i - 1, 0)], db[i]))
            l0, l1 = i, i
            while l0 > 0 and lang[l0 - 1]:
                l0 -= 1
            while l1 < n - 1 and lang[l1 + 1]:
                l1 += 1
            ls = [round(l0 * O, 2), round((l1 + 1) * O, 2)]
            slots.append({"at_sec": round(t, 3), "at": self._gio(t), "khung": k, "beat": bid, "kind": "section_card",
                          "label": b["n"], "lang_s": ls, "lang_dai_s": round(ls[1] - ls[0], 2),
                          "tieng_sau_moc_s": round(ls[1] - t, 2)})
        tong = float(f["thoi_luong_s"])
        kc = [round(y["at_sec"] - x["at_sec"], 2) for x, y in zip(slots, slots[1:])]
        vn = lambda x: ("%.2f" % x).replace(".", ",")
        ld = [s["lang_dai_s"] for s in slots]
        ts = [s["tieng_sau_moc_s"] for s in slots]
        the = ", ".join(s["beat"] for s in slots)
        ra = {
            "slug": self.ten.upper(),
            "video": os.path.basename(f["video"]),
            "video_byte": f["bytes"],
            "video_sha256": f["sha256"],
            "total_sec": round(tong, 2),
            "total": self._gio(tong),
            "midroll_eligible": tong >= TOI_THIEU_S,
            "midroll_gate_sec": TOI_THIEU_S,
            "gate_source": "support.google.com/youtube/answer/6175006 — theo trang này, mid-roll chỉ bật được cho video bật "
                           "kiếm tiền dài từ 8 phút trở lên; bản này %s s (ffprobe) nên %s." % (
                               vn(tong), "đủ điều kiện" if tong >= TOI_THIEU_S else "KHÔNG đủ điều kiện"),
            "breakpoint_rule": "support.google.com/youtube/answer/6175006 — trang này khuyên đặt ad slot ở chỗ ngắt tự nhiên "
                               "(lặng tiếng hoặc chuyển cảnh); đặt giữa câu hay giữa hành động thì ít được phát quảng cáo hơn.",
            "not_guaranteed": "Theo cùng trang: có ad slot không bảo đảm quảng cáo sẽ chạy.",
            "unknown": "Khoảng cách tối thiểu giữa hai mid-roll: CHƯA XÁC MINH -> không tự đặt con số, không dựa vào; "
                       "tạm giãn theo đoạn nội dung (mỗi mốc là một thẻ trạm).",
            "luat_dat_moc": "Mid-roll đặt ở mốc chương tự nhiên (thẻ trạm %s theo storyboard meta.adslots) và ghi vào "
                            "adslots.json. Không đặt giữa câu, không đặt giữa một phép tính." % the,
            "cach_tinh_moc": "at_sec = khung_dau của beat thẻ trạm / %d trong _build/ke_hoach.json (mỗi beat đúng số khung đã "
                             "khoá; tiếng đệm/cắt đúng số khung; bước nối và PiP giữ nguyên số khung)." % FPS,
            "kiem_lang": "Đo RMS ô 20 ms trên tiếng của chính bản nộp 16:9 (ffmpeg -> PCM 48 kHz mono, chỉ đọc), ngưỡng "
                         "-50 dBFS (mức nói trung vị %s dBFS): cả %d mốc rơi vào khoảng lặng dài %s–%s s; tiếng thẻ trạm "
                         "bắt đầu %s–%s s sau mốc. Hình: mốc là khung đầu thẻ trạm (chuyển cảnh)." % (
                             ("%.1f" % trung_vi).replace(".", ","), len(slots), vn(min(ld)), vn(max(ld)), vn(min(ts)),
                             vn(max(ts))),
            "khoang_cach_giua_moc_s": kc,
            "midroll_note_1_dong": "Mid-roll: bật; %d ad slot ở thẻ trạm %s (mỗi mốc nằm trong khoảng lặng), dán từ "
                                   "adslots.json vào MANAGE AD SLOTS; khoảng cách tối thiểu chưa xác minh nên không dựa vào."
                                   % (len(slots), the),
            "paste_into": "Studio -> video -> thẻ Kiếm tiền: bật quảng cáo -> tích 'Show mid-roll ads during my video' -> "
                          "MANAGE AD SLOTS -> INSERT AD SLOT (nhập từng mốc 'at' dưới đây). Mid-roll chỉ quản lý được trên "
                          "Studio bản máy tính. SX không bấm gì trên YouTube; Chủ tịch đăng.",
            "slots": slots,
        }
        p_ra = self.thu + "/adslots.json"
        ghi_moi(p_ra, sach(json.dumps(ra, ensure_ascii=False, indent=2) + "\n"))
        self.log("adslots: %d mốc %s, lặng %s–%s s, trung vị nói %.1f dBFS, sha8 %s" % (
            len(slots), " ".join("%s@%s" % (s["beat"], s["at"]) for s in slots), vn(min(ld)), vn(max(ld)), trung_vi,
            sha_tep(p_ra)[:8]))

    # -------------------------------------------------------------- 12. gói nộp + dang/
    # khối đếm: dòng vạch chứa {{X_ky_tu}}; thân = các dòng sau nó tới dòng vạch kế tiếp (hay hết tệp), bỏ trắng hai đầu
    GIOI = {"mo_ta": ("byte", 5000), "fb": ("ky_tu", 1500), "tiktok": ("ky_tu", 700), "ghim_yt": ("ky_tu", 500),
            "ghim_fb": ("ky_tu", 500), "ghim_tt": ("ky_tu", 150)}
    NGUON_GIOI = {"mo_ta": "YouTube Data API videos.snippet.description: 5000 byte UTF-8, cấm < >",
                  "fb": "CACH_VIET_CAPTION_THU_HUT B10 (trần tự đặt; trần kỹ thuật FB Reel CHƯA XÁC MINH)",
                  "tiktok": "CACH_VIET_CAPTION_THU_HUT B10 (trần tự đặt 700; trần kỹ thuật 2200 UTF-16, TikTok Content Posting API)",
                  "ghim_yt": "CACH_VIET_CAPTION_THU_HUT B7", "ghim_fb": "CACH_VIET_CAPTION_THU_HUT B7",
                  "ghim_tt": "CACH_VIET_CAPTION_THU_HUT B7-TT150 (khối TIKTOK tệp 6 ≤ 150 ký tự, luật 14:48 22/10)"}

    def gia_tri(self):
        """Giá trị điền mẫu: {{khoa}} -> chuỗi, lấy từ storyboard meta và các biên bản trong _build (ffprobe, adslots)."""
        meta = self.sb["meta"]
        g = {"ten": self.ten, "storyboard_sha8": sha_tep(self.sb_p)[:8], "canh_sha8": sha_tep(self.canh_p)[:8],
             "title": meta["title"], "alt_title": meta.get("alt_title", ""), "voice": meta["voice"],
             "nha_may_sha8": sha_tep(os.path.abspath(__file__))[:8]}
        for p in THU_VIEN:
            g["tv_%s_sha8" % os.path.basename(p)[:-3].strip("_").lower()] = sha_tep(p)[:8]
        kh = doc_json(self.kh_p)
        g["chuong"] = "\n".join("%s %s" % (m, l) for (_, _, m), l in zip(self.chuong(kh), [
            x.split(" ", 1)[1] for x in open(self.thu + "/description.md", encoding="utf-8").read().split("\n")
            if re.match(r"^\d{1,2}:\d{2} \S", x)]))
        g["tong_khung"], g["thoi_luong"] = str(kh["tong_khung"]), "%.2f" % kh["thoi_luong_s"]
        g["description_sha8"] = sha_tep(self.thu + "/description.md")[:8]
        # NX79-7: mô tả dán lên YouTube = đúng description.md (một nguồn). Câu ô PiP chỉ có khi video nộp có PiP (NX79-6).
        with open(self.thu + "/description.md", encoding="utf-8", newline="") as f:
            mo_ta = f.read().replace(chr(13) + chr(10), chr(10)).strip()
        co_pip = not self.a.thu_khong_pip
        neo = "no photograph or footage is shown."
        if mo_ta.count(neo) != 1:
            raise SystemExit("DESCRIPTION_THIEU_NEO_CAU_PIP")
        if co_pip:
            mo_ta = mo_ta.replace(neo, neo + " The small picture in the corner is a silent recording of the person behind this "
                                            "channel; the voice you hear is synthetic, not theirs.")
        g["mo_ta"] = mo_ta
        g["cau_pip_vi"] = ("ô nhỏ ở góc là mặt thật, im lặng." if co_pip else
                           "bản này chưa có ô nhỏ ở góc (chờ raw K3); câu khai ô PiP trong mô tả và caption chỉ được thêm khi video có PiP.")
        g["cau_pip_en"] = " The person in the corner is real and silent." if co_pip else ""
        g["thumbnail_sha8"] = sha_tep(self.thu + "/thumbnail.png")[:8]
        g["srt_sha8"] = sha_tep("%s/phu_de/%s.en.srt" % (self.B, self.ten))[:8]
        fp = self.B + "/ffprobe.json"
        ff = doc_json(fp) if os.path.exists(fp) else {}
        for bc, x in ff.items():
            g["video_%s" % bc] = os.path.basename(x["video"])
            g["sha8_%s" % bc], g["sha_%s" % bc] = x["sha256"][:8], x["sha256"]
            g["bytes_%s" % bc], g["giay_%s" % bc] = str(x["bytes"]), "%.3f" % x["thoi_luong_s"]
            s = int(x["thoi_luong_s"])                     # cắt phần lẻ như dong_bo_mau_dat.sh (${giay%%.*})
            g["mmss_%s" % bc], g["phut_%s" % bc] = "%dm%02ds" % (s // 60, s % 60), "%d:%02d" % (s // 60, s % 60)
        ap = self.thu + "/adslots.json"
        if os.path.exists(ap):
            ad = doc_json(ap)
            if "16x9" in ff and ad.get("video_sha256") != ff["16x9"]["sha256"]:
                raise SystemExit("GOI_ADSLOTS_KHAC_VIDEO_16x9 (chạy lại bước adslots)")
            vn = lambda x: ("%.2f" % x).replace(".", ",")         # 2 số lẻ: 1 số lẻ in 2,70–2,74 thành "2,7–2,7"
            ld = [s["lang_dai_s"] for s in ad["slots"]]
            g["adslots_so"] = str(len(ad["slots"]))
            g["adslots_moc"] = "\n".join(s["at"] for s in ad["slots"])
            g["adslots_the"] = ", ".join(s["beat"] for s in ad["slots"])
            g["adslots_lang"] = "%s–%s s" % (vn(min(ld)), vn(max(ld)))
            g["adslots_sha8"] = sha_tep(ap)[:8]
        return g

    def goi(self):
        g = self.gia_tri()
        mau_d = self.thu + "/_kiem_k3/mau"
        if not os.path.isdir(mau_d):
            raise SystemExit("THIEU_MAU_GOI %s" % mau_d)
        thu = self.a.thu_khong_pip                       # bản thử không PiP: gói ra _build/thu/goi/, không đụng dang/
        dang_d = self.B + "/thu/goi" if thu else self.thu + "/dang"
        kiem_d = self.B + "/thu/goi" if thu else self.thu + "/_kiem_k3"
        dem_khoa = {"%s_%s" % (k, d) for k in self.GIOI for d in ("ky_tu", "byte", "byte_crlf", "utf16")}
        thieu = set()

        def dien(t, bang):
            def f(m):
                k = m.group(1)
                if k in bang:
                    return bang[k]
                if k not in dem_khoa:
                    thieu.add(k)
                return m.group(0)
            return re.sub(r"\{\{([a-z0-9_]+)\}\}", f, t)

        mau = {}
        for p in sorted(glob.glob(mau_d + "/*")):
            if os.path.isfile(p) and ".cu_" not in os.path.basename(p):
                with open(p, encoding="utf-8", newline="") as f:
                    mau[os.path.basename(p)] = dien(f.read().replace("\r\n", "\n"), g)
        if thieu:
            raise SystemExit("MAU_THIEU_GIA_TRI %s" % sorted(thieu))
        dem = {}
        for ten, t in mau.items():
            dong = t.split("\n")
            for i, x in enumerate(dong):
                if not x.startswith("================"):          # dòng thường chỉ nhắc số đếm (bảng số liệu)
                    continue
                for k in re.findall(r"\{\{([a-z0-9_]+?)_ky_tu\}\}", x):
                    if k not in self.GIOI or k in dem:
                        raise SystemExit("GOI_KHOI_DEM_LA_HAY_TRUNG %s %s" % (ten, k))
                    j = i + 1
                    while j < len(dong) and not dong[j].startswith("================"):
                        j += 1
                    than = "\n".join(dong[i + 1:j]).strip()
                    if "{{" in than:
                        raise SystemExit("GOI_THAN_CON_CHO_TRONG %s %s" % (ten, k))
                    b = len(than.encode("utf-8"))
                    dem[k] = (ten, len(than), b, b + than.count("\n"), than)
        if set(dem) != set(self.GIOI):
            raise SystemExit("GOI_THIEU_KHOI_DEM %s" % sorted(set(self.GIOI) - set(dem)))
        bang = {}
        for k, (ten, c, b, bc, than) in sorted(dem.items()):
            loai, tran = self.GIOI[k]
            if (loai == "byte" and max(b, bc) > tran) or (loai == "ky_tu" and c > tran):
                raise SystemExit("GOI_QUA_TRAN %s %s: %d ký tự, %d byte, %d byte CRLF > %s %d" % (ten, k, c, b, bc, loai, tran))
            if k == "mo_ta" and ("<" in than or ">" in than):
                raise SystemExit("GOI_MO_TA_CO_DAU_NHON")
            bang.update({k + "_ky_tu": str(c), k + "_byte": str(b), k + "_byte_crlf": str(bc),
                         k + "_utf16": str(len(than.encode("utf-16-le")) // 2)})
            self.log("goi đếm %s (%s): %d ký tự · %d byte UTF-8 · %d byte nếu đếm CRLF — trần %d %s (%s)" % (
                k, ten, c, b, bc, tran, "byte" if loai == "byte" else "ký tự", self.NGUON_GIOI[k]))
        ra = []
        for ten, t in mau.items():
            t = dien(t, bang)
            if "{{" in t or "}}" in t:
                raise SystemExit("GOI_CON_CHO_TRONG %s" % ten)
            if ten.endswith(".txt"):                              # dang/: UTF-8 CRLF
                ra.append((dang_d + "/" + ten, t.replace("\n", "\r\n").encode("utf-8")))
            else:
                ra.append((kiem_d + "/" + ten, t.encode("utf-8")))
        srt = "%s/phu_de/%s.en.srt" % (self.B, self.ten)
        kem = [(self.thu + "/thumbnail.png", dang_d + "/2_THUMBNAIL.png"), (srt, "%s/%s.en.srt" % (dang_d, self.ten))]
        fb = self.thu + "/thumbnail_FB.png"              # C12 (Chủ tịch 00:4x 23/10/2026): bìa FB mỗi tập, HỒ SƠ làm ảnh
        if os.path.isfile(fb):
            kem.append((fb, dang_d + "/thumbnail_FB.png"))
        else:
            self.log("goi C12: CHƯA CÓ thumbnail_FB.png -> tập CHƯA SẴN ĐĂNG FB (chờ ảnh của HỒ SƠ, gói vẫn dựng)")
        if not thu:
            kem.append((srt, "%s/%s.en.srt" % (self.thu, self.ten)))
        for nguon, dich in kem:
            with open(nguon, "rb") as f:
                ra.append((dich, f.read()))
        for dich, data in ra:
            os.makedirs(os.path.dirname(dich), exist_ok=True)
            ghi_moi(dich, data)
            self.log("goi%s: %s sha8 %s" % (" THỬ" if thu else "", dich, sha_tep(dich)[:8]))


def main():
    ap = argparse.ArgumentParser(description="Nhà máy một lệnh cho tập K3 (không VI).")
    ap.add_argument("storyboard")
    ap.add_argument("--ten", required=True)
    ap.add_argument("--buoc", default="may,tts,ke_hoach,canh,render,noi,phu_de,goi_cong,pip,cong,ffprobe,adslots,goi")
    ap.add_argument("--bo-cuc", default="ca_hai", choices=["ca_hai", "16x9", "9x16"])
    ap.add_argument("--chi", default="")
    ap.add_argument("--kho", action="store_true")
    ap.add_argument("--thu-khong-pip", action="store_true")
    ap.add_argument("--song-song", type=int, default=2)
    ap.add_argument("--accent", default="123,63,152")
    ap.add_argument("--offline", action="store_true")
    a = ap.parse_args()
    if not R or not os.path.isdir(R):
        raise SystemExit("THIEU_GOC_CHAY_SO_HUU: chỉ chạy trong gốc chạy sở hữu (nháp ở ổ D, tự dọn)")
    if not R.upper().startswith("D:"):
        raise SystemExit("GOC_CHAY_KHONG_O_D")
    nm = NhaMay(a)
    buoc = [x for x in a.buoc.split(",") if x]
    nm.log("nha_may %s --buoc %s --bo-cuc %s%s%s" % (os.path.basename(nm.sb_p), a.buoc, a.bo_cuc,
                                                   " --chi " + a.chi if a.chi else "", " --kho" if a.kho else ""))
    for x in buoc:
        if x == "may":
            nm.may("dau")
        else:
            getattr(nm, x)()
    nm.log("nha_may xong: %s" % ",".join(buoc))


if __name__ == "__main__":
    main()
