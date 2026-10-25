# -*- coding: utf-8 -*-
"""tools/nha_may_kenh.py — KHUÔN KÊNH CỐ ĐỊNH (lệnh GĐ 20261023-2240 mục 3a): tập mới CHỈ thêm một tệp dữ liệu
tools/tap/<ten>.json; từ t3 KHÔNG tạo nha_may_k<k>_t<n>.py mới. Giữ nguyên mọi tệp nhà máy cũ (t1/t2 vẫn chạy như trước).

Chạy (venv_manim, trong gốc chạy sở hữu — nháp ở ổ D, tự dọn), mọi tham số khác chuyển nguyên cho nhà máy kênh:
  nha_may_kenh.py --tap E:/Studio/tools/tap/ML_K1_t3.json [--buoc ...] [--bo-cuc ...] [--chi ...] [--thu-khong-pip] ...
  nha_may_kenh.py --tap ... --dung-thu <thư mục trong gốc chạy sở hữu>   (thử: không ghi vào thư mục DUNG thật)

Tệp tập (JSON, khoá bắt buộc): kenh, tap, ten, nguon, dung, khoa {tên tệp: [sha256 đủ 64, byte]} (ít nhất storyboard.json,
description.md, thumbnail.png), hang {HẰNG: giá trị} (chỉ các hằng trong HANG_DUOC_DAT của kênh), tuỳ chọn: vung_cam_pip
(sha8 pip_spec; BẮT BUỘC từ tap 3), lop_tap [đường tương đối ban_sac, tệp lớp cảnh của tập], accent, cau_nguoi_goc_vi.
K3–K5 (dàn ý sê-ri): chu_de [[cụm, ...], ...] (phần mở phải nhắc ít nhất một cụm của MỖI nhóm — chủ đề câu hứa tập này),
lop_moi [≤ 2 lớp mới của tập, phải có code trong lop_tap]; k2 phải đọc đúng câu hứa tập tap+1 trong KE_HOACH_TAP.md.
K4: cau_rieng (đường cau_rieng_tap.json; mặc định <dung>/cau_rieng_tap.json). K5: cau_nguoi_goc (câu người trong góc
riêng tập, chỉ khi có raw mặt mới) + cau_nguoi_goc_vi.
Khuôn làm, theo thứ tự:
  1. kiểm sha256 đủ + byte mọi tệp trong khoa (sai -> HO_SO_KHAC_KHOA, hỏi GĐ);
  2. đặt hằng mô-đun của nhà máy kênh (hằng mức mô-đun được đọc như biến toàn cục lúc chạy -> có hiệu lực);
  3. tap >= 3: vung_cam_pip phải trùng sha8 pip_spec hiện hành VÀ storyboard meta.vung_cam_pip phải nêu sha8 đó (L4);
  4. thêm ban_sac/vung_cam.py + lop_tap vào sổ THU_VIEN (khoá cache render, gia_tri tự khai sha8);
  5. canh.py SINH ra được tiêm, ngay sau dòng import lớp trang của kênh: import vung_cam + vung_cam.ap(<mô-đun bố cục>,
     sha8) + import lớp tập — tiêm TRƯỚC khi ghi nên lint BS-4 và doi_ve_trong_canh chạy trên đúng bản cuối;
  6. gia_tri thêm sha8 của khuôn, tệp tập, vung_cam.py;
  7. bước cong gọi vỏ cache tầng out/_cong_3_6/7b4/cong_cache_tang.py (mục 3b, SQ-6; vỏ ghim sha cổng v3.7, báo cáo y hệt
     v3.7 + khoá cache_tang): video + trần + pip_spec + OCR không đổi thì tầng 9/9b + OCR lấy từ cache, chỉ chạy lại
     tầng chữ/gói. Thử K5 t2 16x9 23/10: lượt đủ 2096 s, lượt dùng cache 1,7 s, báo cáo trùng bản gốc 50bc3ada mọi
     trường. Tệp tập "cong_cache": false -> cổng v3.7 trần như cũ.
Kênh có khuôn: K1 (nha_may_k1), K2 (nha_may_k2; tuỳ chọn tập do_bang, cau_pip_caption), K3 (lớp NhaMayK3T2), K4 (lớp
NhaMayK4T2), K5 (lớp NhaMayK5T2; __init__ bỏ ràng buộc tên "_t2", "không mượn câu tập khác" so theo tên tập). Lớp *T2 chỉ
được dùng làm lớp kênh: mọi giá trị riêng tập (khoá, chủ đề, câu hứa, câu người trong góc) đến từ tệp tập.
SX lập 23/10/2026 (phiên local_df559baa).
"""
import hashlib
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import nha_may as NM                                            # noqa: E402

KHUON = os.path.abspath(__file__)
VUNG_CAM_P = NM.BAN_SAC + "/vung_cam.py"
CONG_CACHE = NM.GOC + "/out/_cong_3_6/7b4/cong_cache_tang.py"   # vỏ cache tầng 32ed3e09 (ghim cổng v3.7 58f363dc)
# kênh -> mô-đun nhà máy + lớp, mô-đun phụ (hằng đặt cả ở đó), sổ thư viện, mốc tiêm trong canh.py, mô-đun bố cục cho
# vung_cam.ap, hằng được đặt từ JSON, các vá riêng kênh.
KENH = {
    "K1": {"mod": "nha_may_k1", "lop": "NhaMayK1", "thu_vien": "THU_VIEN_K1",
           "moc": "from K1_canh.trang import TrangK1  # noqa: E402", "bo_cuc": "K1_canh.trang",
           "hang": ("CAU_PIP", "CAU_AI", "CAU_PIP_CAPTION", "TRAN_MO_TA_CRLF")},
    # K2: các vá của nha_may_k2_t2.py thành dữ liệu tập — KHONG_PAD (hằng), do_bang (lưới đo bảng), cau_pip_caption
    # (câu caption ngắn thay câu mô tả trong gia_tri), adslots dạng dict (đọc như chuỗi rỗng: ranh giới trạm, dàn ý K2 §1).
    "K2": {"mod": "nha_may_k2", "lop": "NhaMayK2", "thu_vien": "THU_VIEN_K2",
           "moc": "from K2_canh.trang import TrangK2  # noqa: E402", "bo_cuc": "K2_canh.trang",
           "hang": ("CAU_PIP", "CAU_AI", "TRAN_MO_TA_CRLF", "KHONG_PAD"), "caption_gia_tri": True, "adslots_dict": True},
    # K3: khoá đủ 64 ký tự + byte (storyboard, mô tả, bìa); chạy qua nha_may.main() với nha_may.NhaMay = lớp.
    "K3": {"mod": "nha_may_k3_t2", "lop": "NhaMayK3T2", "thu_vien": "THU_VIEN", "phu": "nha_may",
           "moc": "from K3_canh.loi import TrangK3  # noqa: E402", "bo_cuc": "K3_canh.loi",
           "hang": ("CAU_PIP", "CAU_AI", "CAU_PIP_CAPTION", "TRAN_MO_TA_CRLF"),
           "khoa_day_du": True, "dan_y": True, "cong_cha": True, "chay_qua": ("nha_may", "NhaMay")},
    # K4: hằng đặt cả ở nha_may_k4 (hàm của nó đọc NGUON / DUNG / CAU_RIENG / SB_SHA8 / DESC_* của mô-đun đó);
    # K4_canh/loi.py tự nạp lop_t2.py -> không tiêm import tệp đó (canh.py giữ đúng bản t2).
    "K4": {"mod": "nha_may_k4_t2", "lop": "NhaMayK4T2", "thu_vien": "THU_VIEN_K4", "phu": "nha_may_k4",
           "moc": "from K4_canh.loi import TrangK4  # noqa: E402", "bo_cuc": "K4_canh.loi",
           "hang": ("CAU_PIP", "TRAN_MO_TA"), "khoa_day_du": True, "dan_y": True, "cong_cha": True,
           "chay_qua": ("nha_may_k4", "NhaMayK4"), "khong_tiem": ("K4_canh/lop_t2.py",), "cau_rieng": True},
    # K5: sha8 (như nha_may_k5_t2); dàn ý đếm beat từng phần + từ cấm trên cả nhãn + ký tự cấm Stencil.
    "K5": {"mod": "nha_may_k5_t2", "lop": "NhaMayK5T2", "thu_vien": "THU_VIEN_K5", "phu": "nha_may_k5",
           "moc": "from K5_canh.loi import TrangK5  # noqa: E402", "bo_cuc": "K5_canh.loi",
           "hang": ("CAU_PIP", "CAU_AI", "TRAN_MO_TA_CRLF"), "dan_y": True, "cam_nhan": True,
           "chay_qua": ("nha_may_k5", "NhaMayK5"), "k5": True},
}
KHOA_BAT_BUOC = ("storyboard.json", "description.md", "thumbnail.png")


def sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for k in iter(lambda: f.read(1 << 20), b""):
            h.update(k)
    return h.hexdigest()


def doc_tap(p):
    with open(p, encoding="utf-8") as f:
        t = json.load(f)
    thieu = [k for k in ("kenh", "tap", "ten", "nguon", "dung", "khoa", "hang") if k not in t]
    if thieu:
        raise SystemExit("TAP_THIEU_KHOA %s" % thieu)
    if t["kenh"] not in KENH:
        raise SystemExit("KENH_CHUA_CO_KHUON %s (thêm mục KENH trong nha_may_kenh.py, không tạo nha_may_k*_t*.py)" % t["kenh"])
    if not re.fullmatch(r"[A-Za-z0-9]+_%s_t%d" % (t["kenh"], t["tap"]), t["ten"]):
        raise SystemExit("TEN_TAP_KHAC %r (cần <ma>_%s_t%d)" % (t["ten"], t["kenh"], t["tap"]))
    la = sorted(set(t["hang"]) - set(KENH[t["kenh"]]["hang"]))
    if la:
        raise SystemExit("HANG_KHONG_DUOC_DAT %s (chỉ %s)" % (la, KENH[t["kenh"]]["hang"]))
    thieu = [k for k in KHOA_BAT_BUOC if k not in t["khoa"]]
    if thieu:
        raise SystemExit("KHOA_THIEU %s" % thieu)
    if t["tap"] >= 3 and not t.get("vung_cam_pip"):
        raise SystemExit("TAP_%d_THIEU_VUNG_CAM_PIP (lệnh GĐ 2240 mục 3c; pip_spec khoá vung_cam_noi_dung_tu_t3)" % t["tap"])
    if KENH[t["kenh"]].get("dan_y") and not t.get("chu_de"):
        raise SystemExit("TAP_THIEU_CHU_DE (phần mở phải nhắc chủ đề câu hứa tập %d)" % t["tap"])
    return t


def kiem_khoa(t):
    for ten, (s, b) in t["khoa"].items():
        p = t["nguon"] + "/" + ten
        if not os.path.isfile(p):
            raise SystemExit("HO_SO_THIEU_TEP %s" % p)
        s2, b2 = sha(p), os.path.getsize(p)
        if s2 != s or b2 != b:
            raise SystemExit("HO_SO_KHAC_KHOA %s %s %d B (khoá %s %d B; hỏi GĐ)" % (ten, s2[:8], b2, s[:8], b))


def kiem_vung_cam(t):
    """tap >= 3: sha8 pip_spec hiện hành = vung_cam_pip của tệp tập, storyboard meta.vung_cam_pip nêu đúng sha8 đó."""
    s8 = t.get("vung_cam_pip")
    if not s8:
        return
    sys.path.insert(0, NM.BAN_SAC)
    import vung_cam
    vung_cam._doc_spec(s8)                     # sai sha -> PIP_SPEC_KHAC; thiếu khoá -> PIP_SPEC_THIEU_...
    if t["tap"] >= 3:
        with open(t["nguon"] + "/storyboard.json", encoding="utf-8") as f:
            m = json.load(f)["meta"].get("vung_cam_pip")
        if m is None or s8 not in json.dumps(m, ensure_ascii=False):
            raise SystemExit("STORYBOARD_THIEU_META_VUNG_CAM_PIP %r (L4: nêu khoá vung_cam_noi_dung_tu_t3 + sha8 %s)" % (m, s8))


def lop_trong_tep(ps):
    """Tên lớp định nghĩa ở mức mô-đun trong các tệp lớp của tập (ast, không import)."""
    import ast
    ten = set()
    for p in ps:
        with open(p, encoding="utf-8") as f:
            ten |= {n.name for n in ast.parse(f.read(), p).body if isinstance(n, ast.ClassDef)}
    return ten


def dan_y(M, t, cam_nhan=False):
    """kiem_dan_y của nha_may_k{3,4,5}_t2 tham số hoá theo tập (cùng luật dàn ý sê-ri §1–§5 của kênh): giọng M.GIONG
    M.NHIP; nhóm M.NHOM (K5: (tên, số beat) -> đếm đúng từng phần và tổng; K3/K4: 30–40 beat); kết s8 k1 k2; lớp cảnh =
    12 lớp t1 + lớp trong lop_tap; canh_moi chỉ cho lop_moi (≤ 2, có code); C7 ≥ 5; từ cấm M.CAM_RE (+ M.CAM_TRAN nếu
    có; K5 cả trên nhãn) + ký tự cấm M.KY_TU_CAM nếu có; phần mở nhắc chủ đề t["chu_de"]; k2 đọc câu hứa tập tap+1."""
    chu_de = [tuple(x) if isinstance(x, list) else (x,) for x in t["chu_de"]]
    lop_moi = set(t.get("lop_moi", []))
    lop_tap = lop_trong_tep([NM.BAN_SAC + "/" + x for x in t.get("lop_tap", [])])
    if len(lop_moi) > 2 or lop_moi - lop_tap:
        raise SystemExit("LOP_MOI %s (tối đa 2, phải có code trong lop_tap %s)" % (sorted(lop_moi), sorted(lop_tap)))
    lop_co = set(M.LOP_T1) | lop_tap
    nhom = tuple(M.NHOM)
    dem = bool(nhom) and isinstance(nhom[0], tuple)
    ten_nhom = tuple(x for x, _ in nhom) if dem else nhom
    cam = [r for r in (M.CAM_RE, getattr(M, "CAM_TRAN", None)) if r is not None]
    ky_tu_cam = getattr(M, "KY_TU_CAM", "")

    def kiem_dan_y(sb):
        meta, bs = sb["meta"], sb["beats"]
        loi = []
        if meta.get("voice") != M.GIONG or meta.get("rate") != M.NHIP:
            loi.append("giọng %r %r (dàn ý: %s %s)" % (meta.get("voice"), meta.get("rate"), M.GIONG, M.NHIP))
        ct = meta.get("cau_truc") or {}
        if tuple(ct) != ten_nhom:
            loi.append("cau_truc %r != %r" % (list(ct), list(ten_nhom)))
        else:
            if sum(ct.values(), []) != meta.get("thu_tu_phat"):
                loi.append("thu_tu_phat khác nối các nhóm cau_truc")
            sai = ["%s %d != %d" % (x, len(ct[x]), n) for x, n in nhom if len(ct[x]) != n] if dem else []
            if sai:
                loi.append("số beat từng phần khác bảng §1: %s" % ", ".join(sai))
        if ct.get("ket") != ["s8", "k1", "k2"]:
            loi.append("nhóm kết %r != s8 k1 k2" % ct.get("ket"))
        if dem and len(bs) != sum(n for _, n in nhom):
            loi.append("%d beat (bảng §1: %d)" % (len(bs), sum(n for _, n in nhom)))
        if not dem and not 30 <= len(bs) <= 40:
            loi.append("%d beat (dàn ý 30–40)" % len(bs))
        la = sorted({b.get("canh") for b in bs} - lop_co, key=str)
        if la:
            loi.append("lớp cảnh chưa có code %s (tối đa 2 lớp mới / tập, viết ở tệp MỚI trước, khai lop_tap)" % la)
        lai = sorted({b["canh"] for b in bs if b.get("canh_moi") and b.get("canh") in lop_co - lop_moi})
        if lai:
            loi.append("canh_moi gắn lại cho lớp đã có %s" % lai)
        c7 = (meta.get("C7") or {}).get("claim_phan_truc_giac") or []
        if len(c7) < 5:
            loi.append("meta.C7 %d claim < 5" % len(c7))
        for b in bs:
            nhan = " ".join(map(str, b.get("labels", [])))
            for r in cam:
                m = r.search(b.get("n", "") + (" " + nhan if cam_nhan else ""))
                if m:
                    loi.append("từ cấm %s %r" % (b["id"], m.group(0)))
            kt = sorted({c for c in nhan if c in ky_tu_cam})
            if kt:
                loi.append("ký tự cấm trên nhãn %s %r (§3 cmap Stencil)" % (b["id"], "".join(kt)))
        mo = " ".join(b.get("n", "") + " " + " ".join(map(str, b.get("labels", [])))
                      for b in bs if b["id"] in ct.get("mo", [])).lower()
        if not all(any(s.lower() in mo for s in g) for g in chu_de):
            loi.append("phần mở không nói chủ đề câu hứa tập %d %s" % (t["tap"], chu_de))
        h = M.cau_hua(t["tap"] + 1)
        k2 = [b.get("n", "") for b in bs if b["id"] == "k2"]
        if not h:
            loi.append("KE_HOACH_TAP.md chưa có câu hứa tập %d (SX không tự chọn; chờ HỒ SƠ / GĐ ghi dòng %d)" % (
                t["tap"] + 1, t["tap"] + 1))
        elif len(k2) != 1 or h not in k2[0]:
            loi.append("k2 không đọc đúng câu hứa tập %d %r" % (t["tap"] + 1, h))
        return loi
    return kiem_dan_y


def va_k5(Lop, M, P, t):
    """K5: __init__ như NhaMayK5T2 nhưng không đòi tên "_t2" (doc_tap đã kiểm tên theo tap); câu người trong góc riêng
    tập từ tệp tập; description_that "không mượn câu người trong góc tập khác" so theo tên tập đang dựng."""
    from nha_may import doc_json, sha_tep
    M.CAU_NGUOI_GOC_T2 = {t["ten"]: t["cau_nguoi_goc"]} if t.get("cau_nguoi_goc") else {}
    M.CAU_NGUOI_GOC_VI_T2 = {t["ten"]: t["cau_nguoi_goc_vi"]} if t.get("cau_nguoi_goc_vi") else {}
    P.CAU_NGUOI_GOC.update(M.CAU_NGUOI_GOC_T2)
    P.CAU_NGUOI_GOC_VI.update(M.CAU_NGUOI_GOC_VI_T2)
    cha = Lop.__mro__[1].__init__

    def __init__(self, a):
        sb_p = os.path.abspath(a.storyboard).replace("\\", "/")
        if os.path.dirname(sb_p).lower() != M.NGUON.lower():
            raise SystemExit("STORYBOARD_KHONG_O_%s" % M.NGUON)
        s = sha_tep(sb_p)
        if not s.startswith(M.SB_SHA8):
            raise SystemExit("STORYBOARD_SHA_KHAC %s != %s (hỏi GĐ trước khi dựng)" % (s[:8], M.SB_SHA8))
        d = sha_tep(M.NGUON + "/description.md")
        if not d.startswith(M.DESC_SHA8) or os.path.getsize(M.NGUON + "/description.md") != M.DESC_BYTE:
            raise SystemExit("DESCRIPTION_SHA_KHAC %s (hỏi GĐ)" % d[:8])
        loi = M.kiem_dan_y(doc_json(sb_p))
        if loi:
            raise SystemExit("DAN_Y_K5_KHONG_DAT: " + " | ".join(loi))
        if not a.thu_khong_pip and a.ten not in M.CAU_NGUOI_GOC_T2:
            raise SystemExit("THIEU_CAU_NGUOI_GOC %s (chờ raw mặt K5 mới; chỉ chạy --thu-khong-pip)" % a.ten)
        cha(self, a)
    Lop.__init__ = __init__
    dt_goc = Lop.description_that

    def description_that(self, kh):
        goc = P.CAU_NGUOI_GOC
        P.CAU_NGUOI_GOC = {(x + "|_t2" if x == self.ten else x + "#" if x.endswith("_t2") else x): c
                           for x, c in goc.items()}       # dt_goc bỏ qua khoá đuôi "_t2" = tập đang dựng
        try:
            return dt_goc(self, kh)
        finally:
            P.CAU_NGUOI_GOC = goc
    Lop.description_that = description_that


def lap(t, dung_thu=None):
    """Đặt hằng + vá nhà máy kênh theo tệp tập; trả mô-đun nhà máy (main() của nó đọc sys.argv)."""
    k = KENH[t["kenh"]]
    M = __import__(k["mod"])
    P = __import__(k["phu"]) if k.get("phu") else None
    hang = {"NGUON": t["nguon"], "DUNG": dung_thu or t["dung"], "SB_SHA8": t["khoa"]["storyboard.json"][0][:8],
            "DESC_SHA8": t["khoa"]["description.md"][0][:8], "DESC_BYTE": t["khoa"]["description.md"][1]}
    if k.get("khoa_day_du"):                                   # K3 / K4: __init__ so startswith + byte cả ba tệp
        hang.update(SB_SHA8=t["khoa"]["storyboard.json"][0], SB_BYTE=t["khoa"]["storyboard.json"][1],
                    DESC_SHA8=t["khoa"]["description.md"][0], BIA_SHA=t["khoa"]["thumbnail.png"][0],
                    BIA_BYTE=t["khoa"]["thumbnail.png"][1])
    if k.get("cau_rieng"):                                     # K4: chỉ đọc; thử --dung-thu vẫn đọc bản thật
        hang["CAU_RIENG"] = t.get("cau_rieng") or t["dung"] + "/cau_rieng_tap.json"
    hang.update({h: tuple(v) if isinstance(v, list) else v for h, v in t["hang"].items()})
    for h, v in hang.items():
        setattr(M, h, v)
        if P is not None and P is not NM:                      # K3: hằng của nha_may chung cho mọi kênh -> không đụng
            setattr(P, h, v)
    if "CAU_PIP" in t["hang"] and not k.get("phu"):
        M.CAU_NGUOI_GOC = {t["ten"]: t["hang"]["CAU_PIP"]}     # GĐ 11:53 21/10: mỗi kênh một câu chung cố định
    if t["kenh"] == "K3" and "CAU_PIP" in t["hang"]:
        M.CAU_NGUOI_GOC = {t["ten"]: t["hang"]["CAU_PIP"]}
    if t.get("cau_nguoi_goc_vi") and not k.get("k5"):
        M.CAU_NGUOI_GOC_VI = {t["ten"]: t["cau_nguoi_goc_vi"]}
    if k.get("dan_y"):
        M.kiem_dan_y = dan_y(M, t, k.get("cam_nhan", False))
    Lop = getattr(M, k["lop"])
    if k.get("k5"):
        va_k5(Lop, M, P, t)
    tv = getattr(M, k["thu_vien"], None)
    if tv is None:
        tv = getattr(P, k["thu_vien"])                         # cùng đối tượng với NM.THU_VIEN
    them = ([VUNG_CAM_P] if t.get("vung_cam_pip") else []) + [NM.BAN_SAC + "/" + x for x in t.get("lop_tap", [])]
    for p in them:
        if not os.path.isfile(p):
            raise SystemExit("THU_VIEN_THIEU_TEP %s" % p)
        if p not in tv:
            tv.append(p)
    tiem = []
    if t.get("vung_cam_pip"):
        tiem += ["import vung_cam  # noqa: E402 — vùng cấm PiP từ t3 (lệnh GĐ 2240 mục 3c)",
                 "import %s as _vc_bo_cuc  # noqa: E402" % k["bo_cuc"],
                 "vung_cam.ap(_vc_bo_cuc, %r)" % t["vung_cam_pip"]]
    tiem += ["import %s  # noqa: E402,F401 — lớp cảnh của tập" % x[:-3].replace("/", ".")
             for x in t.get("lop_tap", []) if x not in k.get("khong_tiem", ())]
    MG = sys.modules[Lop.canh.__module__]                      # mô-đun nơi canh() được viết -> vá ghi_moi ở đó
    canh_goc, ghi_goc = Lop.canh, MG.ghi_moi

    def canh(self):
        """canh() của kênh, nhưng canh.py được tiêm `tiem` ngay sau mốc trước khi ghi (lint + kiểm đổi vẽ chạy trên bản cuối)."""
        def ghi(p, src):
            if os.path.abspath(p) == os.path.abspath(self.canh_p) and tiem:
                if src.count(k["moc"]) != 1:
                    raise SystemExit("CANH_KHONG_THAY_MOC_TIEM %r" % k["moc"])
                src = src.replace(k["moc"], k["moc"] + "\n" + "\n".join(tiem), 1)
                compile(src, self.canh_p, "exec")
            return ghi_goc(p, src)
        MG.ghi_moi = ghi
        try:
            return canh_goc(self)
        finally:
            MG.ghi_moi = ghi_goc
            if tiem:
                with open(self.canh_p, encoding="utf-8") as f:
                    if f.read().count(tiem[-1]) != 1:
                        raise SystemExit("CANH_CHUA_TIEM")
                self.log("canh.py đã tiêm %d dòng sau mốc %s (vung_cam %s, lop_tap %s)" % (
                    len(tiem), k["moc"].split(" import ")[0], t.get("vung_cam_pip"), t.get("lop_tap", [])))
    Lop.canh = canh
    if t.get("do_bang"):
        import do_doc_bang_t2 as DDB
        # K3 / K4: cong() của lớp đã gọi lưới đo của t2 -> tập có do_bang thay bằng lưới của tập + cong() lớp cha
        db, cong_goc = t["do_bang"], (Lop.__mro__[1].cong if k.get("cong_cha") else Lop.cong)

        def cong(self):
            """Lưới đo độ đọc bảng trên bản trần trước cổng gốc (khuôn mục 219); tham số từ tệp tập."""
            DDB.cong_do_bang(self, tuple(db["lop"]), db.get("vach"), db["muc"], **db.get("tuy_chon", {}))
            return cong_goc(self)
        Lop.cong = cong
    if k.get("adslots_dict"):
        adslots_goc = Lop.adslots

        def adslots(self):
            meta = self.sb["meta"]
            goc = meta.get("adslots")
            if not isinstance(goc, dict):
                return adslots_goc(self)
            meta["adslots"] = ""
            try:
                return adslots_goc(self)
            finally:
                meta["adslots"] = goc
        Lop.adslots = adslots
    gia_tri_goc = Lop.gia_tri

    def gia_tri(self):
        g = gia_tri_goc(self)
        if k.get("caption_gia_tri"):
            if not t.get("cau_pip_caption"):
                raise SystemExit("TAP_THIEU_CAU_PIP_CAPTION")
            g["cau_pip_en"] = t["cau_pip_caption"] if g.get("cau_pip_en") else ""
        g["nha_may_kenh_sha8"] = sha(KHUON)[:8]
        g["tap_json"], g["tap_json_sha8"] = os.path.basename(t["_p"]), sha(t["_p"])[:8]
        g["vung_cam_pip"] = t.get("vung_cam_pip") or ""
        return g
    Lop.gia_tri = gia_tri
    for ten in t.get("va_nha_may", []):                        # vá riêng tập (vd nha_may_k1_v2: C13 + màu v2, phiếu 122)
        va = __import__(ten)
        va.ap(Lop, M, t)
        tg = Lop.gia_tri

        def gia_tri_va(self, tg=tg, va=va):
            g = tg(self)
            g.setdefault("va_nha_may_sha8", {})[os.path.basename(va.__file__)] = sha(va.__file__)[:8]
            return g
        Lop.gia_tri = gia_tri_va
    return M


def main():
    argv = sys.argv[1:]
    if "--tap" not in argv:
        raise SystemExit("THIEU --tap <tools/tap/<ten>.json>")
    i = argv.index("--tap")
    tp = os.path.abspath(argv[i + 1]).replace("\\", "/")
    del argv[i:i + 2]
    dung_thu = None
    if "--dung-thu" in argv:
        i = argv.index("--dung-thu")
        dung_thu = os.path.abspath(argv[i + 1]).replace("\\", "/")
        del argv[i:i + 2]
        if not NM.R or not dung_thu.lower().startswith(NM.R.replace("\\", "/").lower()):
            raise SystemExit("DUNG_THU_NGOAI_GOC_CHAY_SO_HUU")
    if "--ten" in argv or any(not x.startswith("-") and x.endswith(".json") for x in argv):
        raise SystemExit("--ten / storyboard lấy từ tệp tập, không truyền tay")
    t = doc_tap(tp)
    t["_p"] = tp
    kiem_khoa(t)
    kiem_vung_cam(t)
    if t.get("cong_cache", True):
        # NM.NhaMay.cong() đọc NM.CONG lúc gọi -> chỉ đổi trong thân bước cong. Soát canh.py (nha_may.py dòng 421, K3
        # chạy qua nha_may) cũng đọc NM.CONG và cần hàm của cổng v3.7: đổi toàn cục thì K3 dừng CANH_KHONG_QUA_KIEM
        # (thử 23:50 23/10). Vá TRƯỚC lap(): do_bang + cong_cha giữ Lop.__mro__[1].cong lúc lap.
        if not os.path.isfile(CONG_CACHE):
            raise SystemExit("THIEU_VO_CACHE %s" % CONG_CACHE)
        cong_nm = NM.NhaMay.cong

        def cong_cache(self):
            cu, NM.CONG = NM.CONG, CONG_CACHE
            try:
                return cong_nm(self)
            finally:
                NM.CONG = cu
        NM.NhaMay.cong = cong_cache
    M = lap(t, dung_thu)
    k = KENH[t["kenh"]]
    if t.get("accent") and "--accent" not in argv:
        argv += ["--accent", t["accent"]]
    sys.argv = [M.__file__, t["nguon"] + "/storyboard.json", "--ten", t["ten"]] + argv
    if k.get("chay_qua"):                      # main() của mô-đun kênh dựng nhà máy qua tên lớp toàn cục của nó
        Q = __import__(k["chay_qua"][0])
        setattr(Q, k["chay_qua"][1], getattr(M, k["lop"]))
        Q.main()
    else:
        M.main()


if __name__ == "__main__":
    main()
