# -*- coding: utf-8 -*-
"""tools/nha_may_k1.py — nhà máy một lệnh cho tập K1 Meniscus Lab t2 (lệnh GĐ 20:51 19/10/2026: tập 2 ưu tiên số 1).

Lớp con của tools/nha_may.py (KHÔNG sửa nha_may.py), dựng theo khuôn tools/nha_may_k5.py; chỉ đổi phần riêng của kênh K1:
  * thư viện cảnh ban_sac/K1_canh/ (tệp MỚI trang.py + lop.py; khung.py, __init__.py có sẵn, không sửa) +
    ban_sac/K1_ban_quang_hoc.py + ban_sac/ngon_ngu.py (khoá cache render theo sha các tệp này);
  * đọc hồ sơ tập ở out/M1_XAPHONG (của HỒ SƠ, CHỈ ĐỌC; storyboard và description.md phải đúng sha), ghi mọi thứ
    của SX ở out/M1_XAPHONG_DUNG (canh.py, _build/, _kiem_k1/);
  * chuyển cảnh K1 khai ở beat VÀO: 'khung 0: ...' -> dau, 'khong (cùng bàn)' -> khong, zoom_thang, lay_net; số khung và
    giây chuyển cảnh đầu beat = K1_canh.trang.ke_khung (t_chuyen);
  * tiếng: lời của beat bắt đầu ở giây t_chuyen của beat -> bước nối đệm lặng t_chuyen TRƯỚC lời; phụ đề lệch t_chuyen;
  * tệp cảnh: mỗi beat một lớp TrangK1 (ban_sac/K1_canh/trang.py), lint BS-4 K1;
  * phụ đề: mực MUC #1C232B trên NEN_TREN #A7ADB3 của K1_ban_quang_hoc;
  * adslots: ranh giới c2, c3, b1 (storyboard meta.adslots ghi bằng lời, không trong ngoặc).
Chạy bằng venv_manim TRONG gốc chạy sở hữu (nháp ở ổ D, tự dọn), như nha_may.py:
  nha_may_k1.py E:/Studio/out/M1_XAPHONG/storyboard.json --ten ML_K1_t2 [--buoc ...] [--kho] [--thu-khong-pip] ...
"""
import argparse
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import do_doc_bang_t2 as DDB                                    # noqa: E402
import nha_may as NM                                            # noqa: E402
from nha_may import (BAN_SAC, FPS, KICH, PY, PY_CONG, LINT, CONG, R, doc_json, ghi_moi, ghi_json, chep_x,  # noqa: E402
                     sha_tep, chay)

GOC = NM.GOC
NGUON = GOC + "/out/M1_XAPHONG"          # hồ sơ tập (HỒ SƠ) — chỉ đọc
DUNG = GOC + "/out/M1_XAPHONG_DUNG"      # đầu ra SX
SB_SHA8 = "dfe35144"                     # HỒ SƠ 21:20 19/10 (sau phiếu 99: NX99-1/3/8, m3 nhãn "our sketch")
DESC_SHA8, DESC_BYTE = "76b7e931", 4719  # description.md K1 t2 của HỒ SƠ 21:20 19/10 (LF)
THU_VIEN_K1 = [BAN_SAC + "/K1_canh/" + f for f in ("__init__.py", "khung.py", "trang.py", "lop.py")] + \
              [BAN_SAC + "/K1_ban_quang_hoc.py", BAN_SAC + "/ngon_ngu.py"]
NM.THU_VIEN = THU_VIEN_K1                # render() và gia_tri() của nha_may đọc tên này lúc chạy
NM.MANG = ()                             # mỗi beat K1 vẽ lại bàn của mình: khoá cache không kèm beat trước
CAU_PIP = ("The small picture in the top-right corner is a silent recording of the person behind this channel; the "
           "voice you hear is synthetic, not theirs.")   # câu chung trong bản HỒ SƠ 76b7e931 :44
# câu người trong góc: GĐ 11:53 21/10 bỏ câu viết riêng từng tập (NX99-6 / NX89-4 đóng) -> mỗi kênh MỘT câu chung cố
# định = CAU_PIP (HỒ SƠ 12:28 21/10 mục K1: description 76b7e931 không đổi). Tập không có trong bảng -> chỉ bản thử.
CAU_NGUOI_GOC = {"ML_K1_t2": CAU_PIP}
CAU_NGUOI_GOC_VI = {"ML_K1_t2": "ô nhỏ ở góc là mặt thật, im lặng."}
# caption FB/TikTok: câu ngắn chung của nha_may.py :1057 (câu mô tả 144 B đưa FB lên 1 592 > trần 1 500; HỒ SƠ 12:28 mục 4)
CAU_PIP_CAPTION = " The person in the corner is real and silent."
CAU_AI = ("Narration is an AI text-to-speech voice. The diagrams are drawn in code for this video with AI-assisted "
          "tools.")                      # câu khai AI trong bản HỒ SƠ 76b7e931; tệp 4/5 dùng đúng câu này (một câu cả tập)
TRAN_MO_TA_CRLF = 4800                   # như K5 (GĐ 04:26 mục 2): đo trên bản đăng, đếm cả CRLF


class NhaMayK1(NM.NhaMay):
    GIOI = dict(NM.NhaMay.GIOI, mo_ta=("byte", TRAN_MO_TA_CRLF))
    NGUON_GIOI = dict(NM.NhaMay.NGUON_GIOI, mo_ta="GĐ 04:26: 4 800 B CRLF trên bản đăng (trần YouTube Data API "
                                                  "videos.snippet.description 5000 byte UTF-8), cấm < >")
    INK, NEN = (0x1C, 0x23, 0x2B), (0xA7, 0xAD, 0xB3)        # MUC / NEN_TREN của K1_ban_quang_hoc (PALETTE K1)

    def cong(self):
        """Lưới đo độ đọc bảng kê trên bản trần trước cổng gốc (quyết GĐ 10:57 23/10, khuôn mục 219):
        BangKe là bảng kê chữ KHÔNG kẻ khung → chế độ đo không-khung của tools/do_doc_bang_t2.py
        (mực tối <120 trên nền sáng ~158, toi=True — hiệu chuẩn khung m5 23/10); ngưỡng 17,9 px cả 2 khổ."""
        DDB.cong_do_bang(self, ("BangKe",), None, 120, toi=True, khong_khung=True)
        return super().cong()

    def __init__(self, a):
        self.a = a
        self.sb_p = os.path.abspath(a.storyboard).replace("\\", "/")
        if os.path.dirname(self.sb_p).lower() != NGUON.lower():
            raise SystemExit("STORYBOARD_KHONG_O_%s" % NGUON)
        s = sha_tep(self.sb_p)
        if not s.startswith(SB_SHA8):
            raise SystemExit("STORYBOARD_SHA_KHAC %s != %s (hỏi GĐ trước khi dựng)" % (s[:8], SB_SHA8))
        d = sha_tep(NGUON + "/description.md")
        if not d.startswith(DESC_SHA8) or os.path.getsize(NGUON + "/description.md") != DESC_BYTE:
            raise SystemExit("DESCRIPTION_SHA_KHAC %s (hỏi GĐ)" % d[:8])
        self.sb = doc_json(self.sb_p)
        self.thu = DUNG
        self.B = self.thu + "/_build"
        os.makedirs(self.B, exist_ok=True)
        self.canh_p = self.thu + "/canh.py"
        self.kh_p = self.B + "/ke_hoach.json"
        self.ten = a.ten
        self.bo_cuc = NM.BO_CUC if a.bo_cuc == "ca_hai" else (a.bo_cuc,)
        self.chi = [x for x in a.chi.split(",") if x]
        self.accent = tuple(int(x) for x in a.accent.split(","))
        self.vien_kq = {}
        chep_x(NGUON + "/thumbnail.png", self.thu + "/thumbnail.png")
        if os.path.isfile(NGUON + "/thumbnail_FB.png"):  # C12 (Chủ tịch 00:4x 23/10/2026): bìa FB đi cùng gói khi HỒ SƠ đã làm
            chep_x(NGUON + "/thumbnail_FB.png", self.thu + "/thumbnail_FB.png")

    # -------------------------------------------------------------- 8b. dải viền nhận diện (phiếu 108 Lỗi 1, GĐ 22/10)
    VIEN_HEX, VIEN_RGB = "#1F6FD1", (0x1F, 0x6F, 0xD1)   # xanh nước của K1 (LUAT_BAN_SAC_KENH.md :52 ô K1, sha c25e0493)
    VIEN_PX = {"16x9": 28, "9x16": 28}                   # bề dày từng khổ (đo BS-3 trước khi chốt; mốc đầu 28 px như K5)
    AN_TOAN_PX = {"16x9": 33, "9x16": 65}                 # mép vùng an toàn gần khung nhất (K1_canh/trang.py:74,80)

    def vien_tran(self, kb, bc):
        """GĐ quyết Lỗi 1 phiếu 108 (BS-3 9:16 K1 PiP–K2 t1 0,837 < 1,0; như tiền lệ K3/K5): khi có ô PiP, bản trần được
        thêm dải viền VIEN_HEX dày VIEN_PX[bc] ở 4 mép khung (ffmpeg drawbox t=fill, x264 như bản trần), ngoài ô PiP + 8 px
        và ngoài vùng an toàn nên không che chữ/thước kẹp. Ghi _build/<bc>/tran_vien_<sha8>.mp4 (giữ để KĐ truy vết),
        trả đường dẫn cho hop_pip_doan_v2; khai self.vien_kq[bc] vào render.json. Bản thử không PiP: không viền."""
        t, (w, h) = self.VIEN_PX[bc], KICH[bc]
        ps = doc_json(GOC + "/tools/pip_spec.json")            # mot nguon duy nhat cho vi tri PiP (cong 3.6 tang 9 cung doc)
        o = [x for x in [ps] + list(ps.values()) if isinstance(x, dict) and x.get("khung") == [w, h]]
        if len(o) != 1:
            raise SystemExit("VIEN_KHONG_CO_DAC_TA_PIP %s" % bc)
        o = o[0]
        cach_pip = min(o["x"], o["y"], w - o["x"] - o["w"], h - o["y"] - o["h"]) - t
        if cach_pip < 8 or t > self.AN_TOAN_PX[bc]:
            raise SystemExit("VIEN_CHAM_PIP_HAY_VUNG_AN_TOAN %s: t=%d, cách ô PiP %d px" % (bc, t, cach_pip))
        mau = "0x%02X%02X%02X" % self.VIEN_RGB
        vf = ",".join("drawbox=x=%s:y=%s:w=%s:h=%s:color=%s:t=fill" % (x, y, ww, hh, mau) for x, y, ww, hh in
                      (("0", "0", "iw", t), ("0", "ih-%d" % t, "iw", t), ("0", "0", t, "ih"), ("iw-%d" % t, "0", t, "ih")))
        tam = "%s/tran_vien_%s.mp4" % (R, bc)
        cmd = (["ffmpeg", "-nostdin", "-v", "error", "-i", kb["ban_tran"], "-vf", vf, "-map", "0:v:0", "-map", "0:a:0"] +
               NM.X264 + ["-c:a", "copy", "-movflags", "+faststart", tam])
        t0 = NM.time.time()
        rc, _, e = chay(cmd)
        if rc:
            raise SystemExit("VIEN_FFMPEG_LOI %s: %s" % (bc, NM.sach(e[-600:])))
        s = sha_tep(tam)
        dich = "%s/%s/tran_vien_%s.mp4" % (self.B, bc, s[:8])
        chep_x(tam, dich)
        self.vien_kq[bc] = {"hex": self.VIEN_HEX, "rgb": list(self.VIEN_RGB), "px": t,
                            "mep": "4 mép khung (trên, dưới, trái, phải), chỉ khi có ô PiP",
                            "cach_o_pip_px": cach_pip, "an_toan_px": self.AN_TOAN_PX[bc], "loc": vf,
                            "tran_goc": kb["ban_tran"], "tran_goc_sha256": kb["sha"], "tran_vien": dich,
                            "tran_vien_sha256": s, "tran_vien_bytes": os.path.getsize(dich),
                            "ly_do": "GĐ quyết Lỗi 1 phiếu 108 (22/10/2026): LUAT_BAN_SAC_KENH.md :52 ô K1 (sha c25e0493), "
                                     "như tiền lệ K3/K5; màu cũ của K1 để t2 vẫn ≤ 0,3 với t1"}
        self.log("vien %s: %s dày %d px, cách ô PiP %d px -> %s (%s, %.0f s)" % (
            bc, self.VIEN_HEX, t, cach_pip, dich, NM.thong_so_video(dich), NM.time.time() - t0))
        return dich

    # -------------------------------------------------------------- 3. kế hoạch
    @staticmethod
    def vao_cua(chuyen):
        c = chuyen.strip()
        if c.startswith("khung 0"):
            return "dau"
        for k in ("zoom_thang", "lay_net", "khong"):
            if c.startswith(k):
                return k
        raise SystemExit("CHUYEN_KHONG_BIET %r" % chuyen)

    def ke_hoach(self):
        sys.path.insert(0, BAN_SAC)
        from K1_canh import khung
        khung.dat_ngang()
        from K1_canh import trang
        tts = doc_json(self.B + "/tts.json")["beats"]
        meta = self.sb["meta"]
        bs = {b["id"]: b for b in self.sb["beats"]}
        thu = meta["thu_tu_phat"]
        if sorted(thu) != sorted(bs):
            raise SystemExit("THU_TU_PHAT_KHAC_DANH_SACH_BEAT")
        ds, bang = [], []
        for i, bid in enumerate(thu):
            b = dict(bs[bid])
            vao = self.vao_cua(b["chuyen"])
            if (i == 0) != (vao == "dau"):
                raise SystemExit("KHUNG_DAU_SAI %s %s" % (bid, vao))
            b.update(vao=vao, truoc=thu[i - 1] if i else None)
            W = doc_json(tts[bid]["words"])
            b["words"] = [{"t": round(w["t0"], 4), "d": round(w["t1"] - w["t0"], 4), "w": w["w"]} for w in W]
            b["dur"] = tts[bid]["dur"]
            ds.append(b)
        k0 = trang.ke_khung(ds)                  # t_chuyen, so_khung, k0, cuoi (công thức của trang.py, không chép số)
        out = {}
        for b in ds:
            b["khung_dau"] = b.pop("k0")
            b["t0"] = round(b["khung_dau"] / FPS, 4)
            if b["so_khung"] != trang.so_khung(b):
                raise SystemExit("SO_KHUNG_LECH %s" % b["id"])
            out[b["id"]] = b
            bang.append("%s %s t_chuyen %.2f s %d khung" % (b["id"], b["vao"], b["t_chuyen"], b["so_khung"]))
        kh = {"ghi_chu": "kế hoạch dựng K1 t2 sinh bởi tools/nha_may_k1.py; số khung = K1_canh.trang.ke_khung; KHÔNG sửa tay",
              "storyboard_sha256": sha_tep(self.sb_p), "tts_sha256": sha_tep(self.B + "/tts.json"),
              "tong_khung": k0, "thoi_luong_s": round(k0 / FPS, 3), "thu_tu": thu, "ct": None, "seed": 1,
              "beats": out}
        ghi_json(self.kh_p, kh)
        self.log("ke_hoach: %d beat, %d khung = %.2f s; %s" % (len(thu), k0, k0 / FPS, " | ".join(bang)))
        return kh

    # -------------------------------------------------------------- 4. tệp cảnh
    def canh(self):
        kh = doc_json(self.kh_p)
        sb_sha8 = sha_tep(self.sb_p)[:8]
        L = ["# -*- coding: utf-8 -*-",
             "# Tệp cảnh %s — SINH bởi tools/nha_may_k1.py từ out/M1_XAPHONG/storyboard.json sha256-8 %s; KHÔNG sửa tay." % (
                 self.ten, sb_sha8),
             "# Mỗi beat một lớp TrangK1 (ban_sac/K1_canh/trang.py); lớp cảnh + tham số + lời đọc từ _build/ke_hoach.json.",
             "# Dòng nguồn góc trên phải do TrangK1 vẽ từ tham_so.nguon; tập này không có DOI.",
             "import os", "from K1_canh import khung", "",
             "(khung.dat_doc if os.environ.get('K3_BO_CUC') == '9x16' else khung.dat_ngang)()",
             "import K1_ban_quang_hoc  # noqa: E402,F401",
             "from K1_canh.trang import TrangK1  # noqa: E402", ""]
        for bid in kh["thu_tu"]:
            if not re.match(r"^[A-Za-z_][A-Za-z0-9_]*$", bid):
                raise SystemExit("ID_BEAT_KHONG_LAM_TEN_LOP %r" % bid)
            for d, s in self._di(kh["beats"][bid].get("tham_so", {})):
                if NM.DOI_RE.search(s):
                    raise SystemExit("K1_CO_DOI_TRONG_THAM_SO %s %s (chưa có đường vẽ DOI trong canh.py)" % (bid, d))
            L += ["", "class %s(TrangK1):" % bid, "    B = %r" % bid, "", "    def construct(self):", "        self.chay()"]
        src = "\n".join(L) + "\n"
        compile(src, self.canh_p, "exec")
        doi = ghi_moi(self.canh_p, src)
        self.log("canh.py %s (sha8 %s): %d lớp" % ("ghi mới" if doi else "không đổi", sha_tep(self.canh_p)[:8],
                                                  len(kh["thu_tu"])))
        rc, o, e = chay([PY, "-X", "utf8", "-B", LINT, "K1", self.canh_p])
        self.log("lint_bs4 K1 canh.py rc=%d: %s" % (rc, (o + e).strip()[-600:]))
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
        kq.update(lint_rc=rc, lint=(o + e).strip()[-2000:], canh_sha256=sha_tep(self.canh_p))
        ghi_json(self.B + "/canh_kiem.json", kq)
        self.log("doi_ve_trong_canh: doi %s · loi %s · kenh %s" % (sorted(kq.get("doi") or {}), kq.get("loi"),
                                                                    kq.get("kenh")))
        if rc != 0 or kq.get("loi") or "doi" not in kq:
            raise SystemExit("CANH_KHONG_QUA_KIEM")

    # -------------------------------------------------------------- 8. gói cổng
    def description_that(self, kh):
        """description.md của HỒ SƠ (out/M1_XAPHONG, đúng sha) + mốc chương thật; câu ô PiP: câu riêng của tập thay câu
        chung của HỒ SƠ; tập chưa có câu riêng thì chỉ bản thử (bỏ câu chung), bản có PiP dừng."""
        with open(NGUON + "/description.md", encoding="utf-8", newline="") as f:
            t = f.read()
        d0 = t.split("\n", 2)
        if len(d0) < 3 or not d0[0].startswith("# ") or d0[1].strip():
            raise SystemExit("DESCRIPTION_K1_DONG_DAU_KHAC %r" % d0[0][:60])
        t = d0[2]
        if t.count(CAU_PIP) != 1:
            raise SystemExit("DESCRIPTION_K1_THIEU_CAU_PIP")
        if self.a.thu_khong_pip:                       # bản thử: không có ô PiP -> không câu PiP (cả khi tập có câu)
            t = t.replace(" " + CAU_PIP, "")
        elif self.ten in CAU_NGUOI_GOC:
            t = t.replace(CAU_PIP, CAU_NGUOI_GOC[self.ten])
        else:
            raise SystemExit("THIEU_CAU_NGUOI_GOC %s (chờ GĐ quyết raw PiP K1; chỉ chạy --thu-khong-pip)" % self.ten)
        ch = self.chuong(kh)
        dong = t.split("\n")
        vt = [i for i, x in enumerate(dong) if re.match(r"^\d{1,2}:\d{2} \S", x)]
        if len(vt) != len(ch):
            raise SystemExit("DESCRIPTION_SO_DONG_CHUONG %d != %d" % (len(vt), len(ch)))
        for i, (_, _, mm) in zip(vt, ch):
            dong[i] = re.sub(r"^\d{1,2}:\d{2}", mm, dong[i])
        tieu = [i for i, x in enumerate(dong) if x.startswith("Chapters")]
        if len(tieu) != 1 or tieu[0] != vt[0] - 1:
            raise SystemExit("DESCRIPTION_DONG_CHAPTERS %r" % tieu)
        dong[tieu[0]] = "Chapters" + ("\r" if dong[tieu[0]].endswith("\r") else "")
        t = "\n".join(dong)
        s = t.replace("\r\n", "\n").strip()
        b = len(s.encode("utf-8")) + s.count("\n")
        if b > TRAN_MO_TA_CRLF:
            raise SystemExit("MO_TA_QUA_TRAN %d B CRLF > %d" % (b, TRAN_MO_TA_CRLF))
        self.log("description_that: bản đăng %d ký tự · %d B CRLF (trần %d)%s" % (
            len(s), b, TRAN_MO_TA_CRLF, "; bản thử: bỏ câu ô PiP chung" if self.a.thu_khong_pip else ""))
        return t, ch

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
                src = [{"code": c, "cite": b["src"], "in_figure": True} for c in b.get("ma_chuan", [])] or \
                      [{"cite": b["src"]}]
                beats.append({"id": bid, "n": b["n"], "labels": b["labels"], "src": src, "scene": {"kind": b["canh"]},
                              "nguon": b.get("tham_so", {}).get("nguon", [])})
            sp = {"meta": {"title": meta["title"], "alt_title": meta["alt_title"], "voice": meta["voice"],
                           "rate": meta["rate"], "w": w, "h": h, "fps": FPS, "kenh": "K1", "kenh_ten": "Meniscus Lab",
                           "ban_sac": "ban_sac/K1_ban_quang_hoc.py + ban_sac/K1_canh/ (tệp cảnh canh.py)",
                           "nguon": meta["nguon"],
                           "sinh_tu": "storyboard.json sha256 %s (nha_may_k1.py)" % sha_tep(self.sb_p)},
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
            ",".join(self.bo_cuc), "ghi mới" if doi_desc else "không đổi",
            " ".join("%s=%s" % (b, m) for _, b, m in ch), th_sha[:8]))

    # -------------------------------------------------------------- 12. gói nộp + dang/
    def gia_tri(self):
        """Như NhaMay.gia_tri (khuôn nha_may_k5) nhưng mô tả = description.md đã qua description_that (câu ô PiP: câu
        riêng của tập, hoặc đã bỏ ở bản thử); câu khai AI lấy đúng câu trong bản HỒ SƠ."""
        meta = self.sb["meta"]
        g = {"ten": self.ten, "storyboard_sha8": sha_tep(self.sb_p)[:8], "canh_sha8": sha_tep(self.canh_p)[:8],
             "title": meta["title"], "alt_title": meta.get("alt_title", ""), "voice": meta["voice"],
             "nha_may_sha8": sha_tep(NM.__file__)[:8], "nha_may_k1_sha8": sha_tep(os.path.abspath(__file__))[:8],
             "description_ho_so_sha8": sha_tep(NGUON + "/description.md")[:8]}
        for p in THU_VIEN_K1:
            g["tv_%s_sha8" % os.path.basename(p)[:-3].strip("_").lower()] = sha_tep(p)[:8]
        kh = doc_json(self.kh_p)
        with open(self.thu + "/description.md", encoding="utf-8", newline="") as f:
            mo_ta = f.read().replace(chr(13) + chr(10), chr(10)).strip()
        g["chuong"] = chr(10).join("%s %s" % (m, l) for (_, _, m), l in zip(self.chuong(kh), [
            x.split(" ", 1)[1] for x in mo_ta.split(chr(10)) if re.match(r"^\d{1,2}:\d{2} \S", x)]))
        g["tong_khung"], g["thoi_luong"] = str(kh["tong_khung"]), "%.2f" % kh["thoi_luong_s"]
        g["description_sha8"] = sha_tep(self.thu + "/description.md")[:8]
        co_pip = not self.a.thu_khong_pip
        if mo_ta.count(CAU_AI) != 1:
            raise SystemExit("GOI_MO_TA_THIEU_CAU_AI")
        if co_pip and mo_ta.count(CAU_NGUOI_GOC.get(self.ten, "\x00")) != 1:
            raise SystemExit("GOI_MO_TA_THIEU_CAU_NGUOI_GOC %s" % self.ten)
        if not co_pip and (CAU_PIP in mo_ta or "silent recording" in mo_ta):
            raise SystemExit("GOI_BAN_THU_CON_CAU_PIP")
        g["mo_ta"] = mo_ta
        g["cau_ai_en"] = CAU_AI
        g["cau_pip_en"] = CAU_PIP_CAPTION if co_pip else ""
        g["cau_pip_vi"] = (CAU_NGUOI_GOC_VI.get(self.ten, "ô nhỏ ở góc là mặt thật, im lặng.") if co_pip else
                           "bản này chưa có ô nhỏ ở góc (chờ clip mặt mới K1 của Chủ tịch); câu khai ô PiP trong mô tả "
                           "và caption chỉ được thêm khi video có PiP.")
        g["pip_tinh_trang"] = ("Bản nộp có ô PiP (clip mặt mới K1 do Chủ tịch quay, media/identity/K1); câu PiP chung của "
                               "kênh có ở tệp 3 mục 4 (description.md), câu caption ngắn ở tệp 4, tệp 5." if co_pip else
                               "Bản THỬ không có ô PiP; câu người trong góc bỏ khỏi mô tả và caption.")
        g["thumbnail_sha8"] = sha_tep(self.thu + "/thumbnail.png")[:8]
        g["srt_sha8"] = sha_tep("%s/phu_de/%s.en.srt" % (self.B, self.ten))[:8]
        fp = self.B + "/ffprobe.json"
        ff = doc_json(fp) if os.path.exists(fp) else {}
        for bc, x in ff.items():
            g["video_%s" % bc] = os.path.basename(x["video"])
            g["sha8_%s" % bc], g["sha_%s" % bc] = x["sha256"][:8], x["sha256"]
            g["bytes_%s" % bc], g["giay_%s" % bc] = str(x["bytes"]), "%.3f" % x["thoi_luong_s"]
            s = int(x["thoi_luong_s"])
            g["mmss_%s" % bc], g["phut_%s" % bc] = "%dm%02ds" % (s // 60, s % 60), "%d:%02d" % (s // 60, s % 60)
        ap = self.thu + "/adslots.json"
        if os.path.exists(ap):
            ad = doc_json(ap)
            if "16x9" in ff and ad.get("video_sha256") != ff["16x9"]["sha256"]:
                raise SystemExit("GOI_ADSLOTS_KHAC_VIDEO_16x9 (chạy lại bước adslots)")
            vn = lambda x: ("%.2f" % x).replace(".", ",")         # noqa: E731
            ld = [s["lang_dai_s"] for s in ad["slots"]]
            g["adslots_so"] = str(len(ad["slots"]))
            g["adslots_moc"] = chr(10).join(s["at"] for s in ad["slots"])
            g["adslots_the"] = ", ".join(s["beat"] for s in ad["slots"])
            g["adslots_lang"] = "%s–%s s" % (vn(min(ld)), vn(max(ld)))
            g["adslots_sha8"] = sha_tep(ap)[:8]
        return g


def _thay_nguon(ham, cu, moi, ten):
    """Hàm của NhaMay đúng từng dòng, chỉ thay đúng MỘT chỗ mỗi cặp cu -> moi (không chép tay, không sửa nha_may.py)."""
    import inspect
    import textwrap
    src = textwrap.dedent(inspect.getsource(ham))
    for a, b in zip(cu, moi):
        if src.count(a) != 1:
            raise SystemExit("NHA_MAY_%s_DA_DOI (%r)" % (ten.upper(), a))
        src = src.replace(a, b)
    ns = dict(vars(NM))
    exec(compile(src, NM.__file__ + ":%s->k1" % ten, "exec"), ns)
    return ns[ham.__name__]


# gói: thư mục mẫu/kiểm _kiem_k3 -> _kiem_k1 (2 chỗ)
NhaMayK1.goi = _thay_nguon(NM.NhaMay.goi, ['"/_kiem_k3/mau', '"/_kiem_k3'], ['"/_kiem_k1/mau', '"/_kiem_k1'], "goi")
# nối: lời beat K1 bắt đầu ở giây t_chuyen (chuyển cảnh đầu beat lặng) -> đệm round(t_chuyen*FPS)*1600 mẫu lặng TRƯỚC mp3
NhaMayK1.noi = _thay_nguon(NM.NhaMay.noi, ["raw, can = p.stdout, n * 1600 * 8"],
                           ['raw, can = bytes(round(kh["beats"][bid]["t_chuyen"] * FPS) * 1600 * 8) + p.stdout, n * 1600 * 8'],
                           "noi")
# phụ đề: mốc từ = khung_dau/FPS + t_chuyen
NhaMayK1.phu_de = _thay_nguon(NM.NhaMay.phu_de, ['t_off = b["khung_dau"] / FPS'],
                              ['t_off = b["khung_dau"] / FPS + b["t_chuyen"]'], "phu_de")
# PiP (phiếu 108 Lỗi 1): bản trần có dải viền thay bản trần; render.json khai "vien"
# render.json "ban_tran" = ban tran CO VIEN (dau vao that cua hop_pip_doan_v2; tang 9b cong v3.4 so ban_tran voi video
# ngoai o PiP trong vung doc, co ca dai vien); ban tran goc ghi o muc "vien" (tran_goc, tran_goc_sha256)
NhaMayK1.pip = _thay_nguon(NM.NhaMay.pip,
                           ['hop_pip_doan_v2(kb["ban_tran"], vr,',
                            '{"ban_tran": kb["ban_tran"], "ban_tran_sha256": kb["sha"],',
                            '"ket_qua": kq, "giay"'],
                           ['hop_pip_doan_v2(self.vien_tran(kb, bc), vr,',
                            '{"ban_tran": self.vien_kq[bc]["tran_vien"], "ban_tran_sha256": self.vien_kq[bc]["tran_vien_sha256"],',
                            '"ket_qua": kq, "vien": self.vien_kq[bc], "giay"'],
                           "pip")
_adslots_nm = NM.NhaMay.adslots


def _adslots_k1(self):
    """meta.adslots của K1 t2 ghi bằng lời ('ranh giới c2, c3, b1'); nha_may đọc danh sách trong ngoặc -> thêm ngoặc tạm."""
    meta = self.sb["meta"]
    goc = meta.get("adslots", "")
    m = re.search(r"ranh giới ([a-z0-9]+(?:, [a-z0-9]+)+)", goc)
    if not m:
        raise SystemExit("ADSLOT_K1_KHONG_DOC_DUOC %r" % goc)
    meta["adslots"] = goc + " (%s)" % m.group(1)
    try:
        return _adslots_nm(self)
    finally:
        meta["adslots"] = goc


NhaMayK1.adslots = _adslots_k1


def main():
    ap = argparse.ArgumentParser(description="Nhà máy một lệnh cho tập K1 Meniscus Lab t2 (không VI).")
    ap.add_argument("storyboard")
    ap.add_argument("--ten", required=True)
    ap.add_argument("--buoc", default="may,tts,ke_hoach,canh,render,noi,phu_de,goi_cong,pip,cong,ffprobe,adslots,goi")
    ap.add_argument("--bo-cuc", default="ca_hai", choices=["ca_hai", "16x9", "9x16"])
    ap.add_argument("--chi", default="")
    ap.add_argument("--kho", action="store_true")
    ap.add_argument("--thu-khong-pip", action="store_true")
    ap.add_argument("--song-song", type=int, default=2)
    ap.add_argument("--accent", default="232,119,46")         # CANG #E8772E của PALETTE K1 (viền ô PiP)
    ap.add_argument("--offline", action="store_true")
    a = ap.parse_args()
    if not R or not os.path.isdir(R):
        raise SystemExit("THIEU_GOC_CHAY_SO_HUU: chỉ chạy trong gốc chạy sở hữu (nháp ở ổ D, tự dọn)")
    if not R.upper().startswith("D:"):
        raise SystemExit("GOC_CHAY_KHONG_O_D")
    nm = NhaMayK1(a)
    buoc = [x for x in a.buoc.split(",") if x]
    nm.log("nha_may_k1 %s --buoc %s --bo-cuc %s%s%s" % (os.path.basename(nm.sb_p), a.buoc, a.bo_cuc,
                                                      " --chi " + a.chi if a.chi else "", " --kho" if a.kho else ""))
    for x in buoc:
        if x == "may":
            nm.may("dau")
        else:
            getattr(nm, x)()
    nm.log("nha_may_k1 xong: %s" % ",".join(buoc))


if __name__ == "__main__":
    main()
