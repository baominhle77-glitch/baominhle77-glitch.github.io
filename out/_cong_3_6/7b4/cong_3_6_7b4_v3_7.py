# -*- coding: utf-8 -*-
"""Cong nguyen ban §3.6 - 9 tang + tang 7b (25/09/2026, siet 7b.1 lenh GD 10:59; 7b.2 bit H7 lenh GD 11:59), chay duoc. CHI DOC bundle + video + chrome.ass + render.py (+ canh.py neu --canh); ghi bao cao vao --out-dir.
BAN VA 7b.4 (thu GD 121, 11:24 29/09/2026 duyet HUONG; de xuat SX 10:44): them --canh cho ban manim khong co chrome.ass.
BAN v2 (phieu KD 62 L62-1, 04/10/2026): thay bo phan tich chu ve (vung 57fab51e :374-700) bang bo CHUNG MINH luong chay; 57fab51e giu nguyen.
BAN v3 (lenh GD 01:0x + 04:5x 17/10/2026, luat C6 :59; SX lap khi nop chang (ii) Scope Trace t1): CHI them 11 ho ma vao CODE_RE
(ISBN ke ca OpenStax, IEEE, IEC, TIA-EIA, ITU-T, SAE J, STANAG, APP-6, MIL-STD, ADP-ATP-FM, hdl.handle.net) + mau duong/am trong
tools/tu_kiem_code_re.py (DUONG_59/AM_59). Moi dong khac giu nguyen v2 (tier7/7b/C4 khong doi).
CHUA KD cham - nam NGOAI tools/; tools/cong_3_6.py giu a82b27ba toi khi KD cham DAT.
BAN v3.1 (no NX69-1 phieu KD 69 + lenh GD 10:3x/10:4x 17/10/2026; SX lap khi nop ban doc 9:16 Scope Trace t1) - DUNG 3 PHAN:
(1) CHROME_MASK them khung (1080, 1920) = o PiP pip_spec khung_1080x1920 (x 74, y 278, w 308, h 174) -> hop (74, 278, 382, 452);
(2) 4 ho ma IEEE / IEC / TIA-EIA / ADP-ATP-FM siet so hieu: khong nhan nam 19xx/20xx hay khoang nam (2019-2020) dung mot minh
    (ke ca '2019.' cuoi cau); ADP/ATP se-ri 1-7, FM 1-99, so sau gach 1-2 chu so, khong theo don vi do;
(3) 8 mau am KD them vao AM_59 cua tools/tu_kiem_code_re.py. Khong doi nguong, khong doi regex khac, moi dong khac giu nguyen v3.
BAN v3.2 (NX74-1 phieu KD 74 + lenh GD 18:5x 17/10/2026; SX lap truoc K3 chang (ii)) - DUNG 2 PATTERN, moi dong khac giu nguyen v3.1:
(1) IEEE: "nam" chi la 1950-2029 (19[5-9]x / 20[0-2]x) -> nhan so hieu that IEEE 1901-2010, IEEE Std 2030-2011;
    van loai IEEE 2019, IEEE 2019-2020, 'Proc. IEEE 2019.', 'In IEEE 2018, the'. IEC / TIA-EIA KHONG doi.
(2) ADP-ATP-FM: so giua 3 chu so chi khi co phan thap phan theo sau (FM 3-100.21); van loai FM 88-108, FM 1-100 kHz.
Tu kiem: tools/tu_kiem_code_re.py them DUONG_74 (3 ma NX74-1 + 29 ma duong khac cua KD) va AM_KD74 (40 mau am KD). Khong doi nguong.
BAN v3.3 (NX74-2 GD 18:5x 17/10/2026 DUYET + phieu KD 76 mo chang (ii) K3; SX lap 18/10/2026 khi nop chang (ii) K3 Strata Notes t1) -
DUNG 2 CHO, moi dong khac giu nguyen v3.2 (CODE_RE, nguong, tier 1-9 khong doi; tu kiem khong doi):
(1) CHROME_MASK (1080, 1920) them dai phu de doc do tu bo cuc doc THAT cua K3 (183 cue, khung giua moi cue, ban thu
    tru ban tran, |d| > 48) -> hop (72, 1164, 933, 1248); o PiP v3.1 giu nguyen. Kho so sanh warehouse dang rong
    (0 gate_report) nen khong co hash doc cu nao bi so lech; DHASH_KIEU giu nguyen - doi hay khong la viec KD cham.
(2) FONT_FILES them "georgia" + FONT_KENH them K3 = georgia.ttf (kiem tay 18/10/2026, xem cho FONT_KENH).

BAN v3.4 (NX88-9 phieu KD 88 + lenh GD 05:18 va 08:3x 19/10/2026; SX lap 19/10/2026 sau khi nop lai K5 phieu 90) -
CHI THEM 1 TANG, moi dong khac giu nguyen v3.3 6fdb68bd (tang 1-9 va 7b, nguong, CODE_RE, CHROME_MASK, FONT khong doi)
-> chi siet, khong noi:
(1) tang moi 9b_chu_duoi_pip: doc MOI khung BAN TRAN (video truoc khi chong PiP) quanh o PiP + 8 px, OCR tung tu kem hop
    bao (ocr_win_tu.ps1 canh file nay; tools/ocr_win.ps1 cua tang 7 giu nguyen). Tu co chu/so cat o PiP + 8 px va co diem
    muc trong o -> TRUOT (NX83-7: khong dung sai). Duong ke, vach, cham gach, vien duoc di qua (khong phai chu).
    Tu chi 1 ky tu phai co mat >= 2 khung lien nhau (OCR doc nham hinh o vuong co chan thanh "n", K5 f8819).
    Luot 2 chu DON LE (NX88-3: chu "A" mat cat la CHU): OCR khong doc 1 ky tu dung mot minh -> cum muc lien thong dang
    chu cat o duoc ve thanh dong "Section <cum>" roi OCR lai; OCR ra DUNG 1 chu/so (khong kem dau) thi tinh nhu tu 1 ky tu o tren.
    Khong co ban tran / ban tran khac khung / khac so khung / ngoai o khong khop video -> TRUOT (khong chung minh duoc).
(2) them --tran (mac dinh: khoa "ban_tran" trong <video>.render.json) va HERE34 (thu muc file nay, de tim ocr_win_tu.ps1).

BAN v3.5 (phieu KD 95 + lenh GD 12:14 va 12:23 19/10/2026) - CHI SUA TANG 9b, moi dong khac giu nguyen v3.4 0a3ccb77
-> chi siet, khong noi:
(1) Loi 1: them luot 3 tren MOI khung ban tran: nen trung vi o 32 px, bo duong ke thang >= 48 px (tra diem ke nam giua 2
    phan chu), gom cum no 1 px; cum qua nho hoac manh-dai (canh > 48, diem/canh <= 3.5) bo qua; cum co chu (cao 6-48,
    rong 2-48, day 0.08-0.90) o ca muc 20 va 40 -> OCR moi hinh 6 ban ve (cuong do, nhi phan, moi ban them bo nghieng
    +/-0.21), ra 1-16 chu/so -> trung; dong chu dinh lien (cao 6-48, rong <= 240) doc them 1 lan roi van xet tiep nhu duoi;
    OCR ghep theo dong, chu nam ben phai tu "Section" ma OCR thay (toa do OCR co the troi);
    cum khong vua: mo 5x5 tach net manh, bo net manh dai > 48, gom lai xet lan nua; con khong vua (muc 40) -> SOAT -> TRUOT.
    su_kien: danh sach su kien CHUA gop (de doi chieu tung ca).
(2) Loi 2: bo luat 1 ky tu phai >= 2 khung; bo_1_ky_tu_1_khung luon rong. Ngoai le duy nhat: dong KD ky
    "KY9B video=<sha256> f=<a>-<b> hop=x0,y0,x1,y1" trong tep phieu nam ngay trong out/_kiem_dinh/phieu (--ky-kd).
(3) U2: luot 1 OCR lai khi doi > 0.2 % vung doc, HOAC >= 6 diem doi trong o PiP + 8 px, HOAC sau 15 khung.
(4) NX95-1/3: khong cat 200 - doan / mien_ky_kd tra du; ly_do ghi so doan con lai.

BAN v3.6 (phieu KD 98 + lenh GD 16:28 19/10/2026) - CHI SUA TANG 9b, moi dong khac giu nguyen v3.5 7c6aa1a7
-> chi siet, khong noi:
(1) Loi 1: luot 3 chi bo doan ke ngang/doc >= 192 px (hoac het o PiP + 8), khong con 48 px: than chu 52-140 px giu nguyen.
(2) Loi 2: bo loc truoc 'manh dai' (canh > 48, diem/canh <= 3.5) va mo 5x5; tach net bang do thang cuc bo (gia tri rieng nho
    cua hiep phuong sai toa do trong cua so 13x13 <= 1.5): chi bo cum diem thang dai >= 192 px (duong cheo hop bao) hoac phu
    het o PiP + 8; phan day (than chu, cho net cham chu) giu.
(3) Loi 3: cum khong vua co chu (sau khi tach) -> SOAT o CA muc 20 va 40 (v3.5 chi muc 40).
(4) NX98-1: diem muc luot 3 = max theo kenh R, G, B |kenh - nen kenh| (v3.5: trung binh xam); nguong 20 / 40 giu, ly do:
    tuong phan chu nho nhat trong bang mau ban sac 5 kenh do theo max kenh = 86.2 (K1).
(5) NX98-3: hinh cum OCR ra chu khong dung mau [A-Za-z0-9]{1,16} -> su kien SOAT "[soat ocr:<chu>]".
(6) NX98-4/5/8: tep ky ten YYYYMMDD-HHMM_*.md; dong ky cua video: f0 <= f1, <= 900 khung, hop trong vung doc va <= 0.70
    dien tich o PiP + 8; sai -> dong khong mien + TRUOT. Bao khung mien / khung co su kien, theo tung dong.
(7) NX100-2 (ghi bo sung, v3.6 65f0a31f da co, lenh GD 18:15): _lech3 = |kenh - nen| nho nhat giua nen o 32 px va 9 nen
    cuc bo trung vi 72 px (o chua diem + 8 o ke); _net_dai3: cum diem net thang co duong cheo >= T9B3_NET = 128 px = net ve L,
    bo tren ca khung; _hut3 / _bo_hut3: hut diem thang hang voi L vao H, bo cum co >= T9B3_HUT_TL = 0.9 diem trong H; _bo_vet3:
    bo cum cham L ma moi diem cach L <= T9B3_VET = 6 px; _chu_thap3: dau '+' dung (ky hieu ban do) khong tinh la chu. Cum doc
    OCR khong ra chu ma khong cham L thi v3.6 KHONG ra su kien nao (Loi 2 phieu KD 100).

BAN v3.7 (phieu KD 100 + lenh GD 23:31 19/10/2026) - CHI SUA TANG 9b, moi dong khac giu nguyen v3.6 65f0a31f
-> chi siet, khong noi:
(1) Loi 1: trong _lech3, thanh phan lien thong (no 1 px) cua diem > T9B3_MUC theo nen o 32 px co hop <= T9B3_GIU = 190 x 324
    (o PiP + 8 lon nhat) lay lai diem theo nen o 32 px: than / long chu dam 40-160 px khong bi nen cuc bo 72 px xoa. Vung
    dong mau lon hon o (nen ban do, vien dai) van theo nen cuc bo.
(2) Loi 2: MOI cum doc OCR khong ra chu -> SOAT ("[soat ocr:rong]"; cham L: "[soat ocr:rong net]" nhu v3.6).
(3) NX100-1: tong khung co su kien duoc mien moi video <= T9B_KY_TONG = 1800, vuot -> TRUOT; ky_kd bao khung_co_mien va
    dong_khong_mien (dong ky khong mien su kien nao); ngay gio trong ten tep ky phai la ngay gio that.
(4) NX100-2: chu thich (7) o tren va chu thich dau tang 9b.

Dac ta: E:\\Studio\\KE_HOACH_DAY_DU.md §3.6 (dong 133), §18.D (dong 1583), §19.3 + §19.5 (dong 1682, 1715).

Tang 7 (neo nguon) va tang 9 (lop PiP) lay BANG CHUNG TU DIEM ANH cua video (OCR Windows, do vien
PiP), KHONG tin khai bao trong script.json: ban mau tung co script.json moi hon video -> script khai
co nguon nhung video khong co mot ma nao. Mot cong doc khai bao se cho qua dung ban do.

Tang 1-6 va 8 dung NGUONG KHOI DIEM, CHUA HIEU CHINH (chua co kho that de hieu chinh). Kho
so sanh = gate_report.json cua N bai gan nhat; kho rong thi tang do ghi ro "so_sanh_voi": 0.

Moi tang ghi ly do RIENG (rejection_reason tach theo tang, khong gop) - [[autoposter-gate-phai-neu-ly-do]].
Cong KHONG xoa file nao. Khung hinh trich ra nam trong --work do nguoi goi so huu.
Exit: 0 = qua cong, 3 = bi loai, 2 = loi chay (khong ket luan duoc).
"""
import argparse, ast, difflib, glob, hashlib, json, math, os, re, subprocess, sys, time, urllib.parse, urllib.request
from collections import Counter

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
HERE34 = HERE                     # v3.4: ocr_win_tu.ps1 nam canh file nay (khong theo HERE khi HERE doi ve tools/)
OUT_DEFAULT = r"E:\Studio\out\_cong_3_6"
# 7b.4: ban va nam NGOAI tools/ (thu GD 121) -> pip_spec.json + ocr_win.ps1 lay tu tools/, out-dir mac dinh rieng
# (khong ghi vao gate_log chinh). Chep vao tools/ thi khoi nay tu khong con tac dung (pip_spec.json nam canh file).
if not os.path.isfile(os.path.join(HERE, "pip_spec.json")):
    HERE = r"E:\Studio\tools"
    OUT_DEFAULT = r"E:\Studio\out\_cong_3_6\7b4\mac_dinh"
CORPUS_DEFAULT = [r"E:\Studio\warehouse\*\ready\*\gate_report.json",
                  r"E:\Studio\warehouse\*\published\*\gate_report.json"]
WAREHOUSE = r"E:\Studio\warehouse"

# ---- tang 9: hinh hoc PiP doc tu MOT dac ta chung voi render.py (K1, phieu 5 24/09/2026): pip_spec.json canh file nay.
# §19.3 (khung 1920x1080) cho x = W - w - 48 = 1565; dac ta chung ha ve 1564 (CHAN, khop overlay yuv420 cua render).
# Chon khoa theo kich thuoc video (lenh GD 05:38 26/09/2026): 1920x1080 -> khoa goc, 1080x1920 -> "khung_1080x1920";
# kich thuoc khac khong co trong PIP_SPEC -> extract() khong cat o PiP, tier9() LOAI co ly do.
_PS = json.load(open(os.path.join(HERE, "pip_spec.json"), encoding="utf-8"))
_PS_KHOI = [_PS]
if "khung_1080x1920" in _PS:
    _PS_KHOI.append(_PS["khung_1080x1920"])
    if tuple(_PS_KHOI[1]["khung"]) != (1080, 1920):
        raise SystemExit("pip_spec.json: khung_1080x1920 phai co khung [1080, 1920]: %r" % _PS_KHOI[1])
for _k in _PS_KHOI:
    if _k["x"] % 2 or _k["y"] % 2:
        raise SystemExit("pip_spec.json: x,y phai CHAN (K1): %r" % _k)
PIP_SPEC = {tuple(_k["khung"]): (_k["x"], _k["y"], _k["w"], _k["h"]) for _k in _PS_KHOI}
PIP_CROP = 8                      # cat rong hon o PiP 8 px moi phia (= vung CHROME["PIP"] cua render.py)
PIP_CORNER = 12                   # bo goc 12 px: bo qua khi do vien thang
PIP_BORDER_TOL = 60               # lech kenh lon nhat so voi mau nhan, van tinh la diem vien
PIP_BORDER_MIN = 0.75             # ti le diem vien khop toi thieu de coi khung co PiP
PIP_INNER_STD = 6.0               # long o PiP phai co noi dung (khong phang)
PIP_COVER_MIN = 0.98              # "toan bo thoi luong, moi scene" (§19.3)
PIP_MOTION_DIFF = 0.5             # lech trung binh giua 2 mau lien tiep -> co chuyen dong
PIP_MOTION_MIN = 0.5              # ti le cap mau co chuyen dong toi thieu (video that, khong phai anh tinh)

# ---- tang 7: ma nguon so cap (§3.6: DOI/ASTM/ISO/NASA-STD) + arXiv, Eurocode EN + NIST, CODATA (C6; phieu 52 L52-8, them 27/09/2026)
# v3 17/10/2026: + 11 ho ma :59 (ISBN, IEEE, IEC, TIA-EIA, ITU-T, SAE-J, STANAG, APP-6, MIL-STD, ADP-ATP-FM, hdl) - xem cuoi dict
CODE_RE = {
    "DOI": re.compile(r"10\.\d{4,9}/[^\s\"'<>)\]]+"),
    "ISO": re.compile(r"\bISO(?:/IEC)?\s?\d{3,5}(?:-\d+)*(?::\d{4})?"),
    "ASTM": re.compile(r"\bASTM\s?[A-G]\d{1,4}(?:/[A-G]\d{1,4}M?)?(?:-\d{2,4})?"),
    "NASA-STD": re.compile(r"\bNASA-STD-\d{4}"),
    "arXiv": re.compile(r"\barXiv:\s?\d{4}\.\d{4,5}"),
    "EN": re.compile(r"\bEN\s?199\d(?:-\d+)+"),
    # NIST + CODATA (phieu 52 L52-8; CHUAN_BI_NIST_CODATA.md §3): dat CUOI dict - tier7 lay loai khop DAU TIEN
    # (DOI cua NIST 10.6028/... van la DOI). Tu kiem: tools/tu_kiem_code_re.py (mau duong/am, --quet script.json).
    "NIST": re.compile(r"\bNIST\s?(?:SP|IR|TN|HB|GCR|AMS|CSWP|FIPS|SRD|SRM|Special\s+Publication|Technical\s+Note|Handbook|Interagency\s+Report|Internal\s+Report)"
                       r"\s?\d{1,4}[A-Z]?(?:[-.]\d{1,4}[A-Z]?)*(?:\s?(?:Rev\.?\s?|r|v|pt|upd|e)\d{1,4})?"),
    "CODATA": re.compile(r"\bCODATA(?:\s+[Rr]ecommended\s+[Vv]alues)?[\s:(-]{0,2}(?:19[6-9]\d|20\d{2})\)?"),
    # ---- v3 (lenh GD 01:0x 17/10/2026, luat C6 :59 mo them; lap khi nop chang (ii) K2): dat SAU CODATA de 8 loai cu giu
    # nguyen loai khop dau tien. KHONG them (chua co lenh): Wikipedia oldid (01:0x: khong la ma so cap), so tai lieu hang nhu
    # DS40002061B (04:5x), RS-232 (ten goi; van ban la TIA-232-F), MIL-HDBK/MIL-PRF, ITU-R, SAE AS/ARP. IEEE loai tru nam
    # (IEEE 2020) nhung giu IEEE 2030.5. ISBN = 10 hoac 13 chu so (co/khong gach, ke ca OpenStax 978-1-947172-...).
    "ISBN": re.compile(r"\bISBN(?:-1[03])?[:\s]{0,2}(?:\d[-\s]?){9}(?:(?:\d[-\s]?){3})?[\dX]\b"),
    # v3.1: 4 ho duoi khong nhan nam / khoang nam dung mot minh (NX69-1: "IEC 2019", "IEEE 2019-2020", "Proc. IEEE 2019.")
    # v3.2 (NX74-1): IEEE "nam" = 1950-2029 -> nhan IEEE 1901-2010, IEEE Std 2030-2011 (so hieu trung dang nam)
    "IEEE": re.compile(r"\bIEEE(?:\s?Std\.?|\s?Standard)?\s?P?(?!(?:19[5-9]|20[0-2])\d(?:-(?:19|20)\d{2})?(?!\.\d|[\d:-]))\d{3,4}(?:\.\d{1,3}[a-z]{0,2})*(?:-\d{4})?"),
    "IEC": re.compile(r"\bIEC\s?(?!(?:19|20)\d{2}(?:-(?:19|20)\d{2})?(?!\.\d|[\d:-]))\d{3,5}(?:-\d+)*(?::\d{4})?"),
    "TIA-EIA": re.compile(r"\b(?:ANSI/)?(?:TIA|EIA)(?:[-/](?:TIA|EIA))?[-\s]?(?!(?:19|20)\d{2}(?:-(?:19|20)\d{2})?(?!\.\d|[\d:-]))\d{3,4}(?:\.\d{1,2})?(?:-[A-Z0-9]{1,4})*"),
    "ITU-T": re.compile(r"\bITU-T\s?(?:Rec(?:ommendation|\.)?\s?)?[A-Z]\.\d{1,4}(?:\.\d{1,3})?(?:-\d{4})?"),
    "SAE-J": re.compile(r"\bSAE\s?J\s?\d{3,4}(?:[-/]\d{1,3})*(?:_\d{6})?"),
    "STANAG": re.compile(r"\bSTANAG\s?\d{4}(?:\s?Ed(?:ition|\.)?\s?\d{1,2})?"),
    "APP-6": re.compile(r"\bAPP-6(?:\([A-E]\)|[A-E])?(?!\d)"),
    "MIL-STD": re.compile(r"\bMIL-STD-\d{1,5}(?:[-/]\d{1,3})?[A-Z]?"),
    # v3.1: ADP/ATP se-ri 1-7, FM 1-99; so sau gach 1-2 chu so; khong theo don vi do (NX69-1: "FM 88-108", "ATP 10-20 ms")
    # v3.2 (NX74-1): so giua 3 chu so chi khi co phan thap phan (FM 3-100.21)
    "ADP-ATP-FM": re.compile(r"\b(?:(?:ADP|ATP)\s?[1-7]|FM\s?\d{1,2})-(?:\d{1,2}|\d{3}(?=\.\d))(?:\.\d{1,3})?(?![\d.])(?!\s?(?:ms|us|s|Hz|kHz|MHz|GHz|dB)\b|\s?%)"),
    "hdl": re.compile(r"\b(?:hdl\.handle\.net/|hdl:)\d{2,6}(?:\.\d{1,6})*/[^\s\"'<>)\]]+"),
}
OCR_MATCH = 0.90                  # SequenceMatcher: ma khai bao coi la "hien tren man hinh" khi khop >= muc nay

# ---- tang 8: 5 nhom "engagement bait" Meta cong bo 12/2017 (vote/react/share/tag/comment baiting)
BAIT_RE = [
    ("comment_baiting", r"\b(?:comment|type|drop|write)\s+(?:a\s+)?[\"'“‘]?[\w!❤️🔥👍]{1,12}[\"'”’]?\s+(?:if|for|below)\b"),
    ("tag_baiting", r"\btag\s+(?:a\s+friend|someone|your\s+\w+|\d+\s+\w+|a\s+\w+\s+who)\b"),
    ("share_baiting", r"\bshare\s+(?:this\s+)?(?:if|with\s+(?:everyone|all|\d+)|to\s+(?:win|save))\b"),
    ("react_baiting", r"\b(?:like|react|love|haha|wow)\s+(?:this\s+)?(?:if|for)\b"),
    ("vote_baiting", r"\b(?:vote|pick)\s+(?:with|using)\s+(?:reactions?|emojis?)\b|\b👍\s*for\b.*\b❤️\s*for\b"),
]

# ---- tang 1-6: nguong khoi dau, CHUA hieu chinh
T1_IDEA_JACCARD = 0.50
T2_LEAD_JACCARD = 0.35
T2_LEAD_SAME_WORDS = 6
T3_STRUCT_RATIO = 0.85
T4_HAMMING, T4_FRAC, T4_MIN_STD = 5, 0.30, 6.0
T5_HIST_COS, T5_LEN_TOL = 0.97, 0.10
T6_HAMMING = 8
STOP = set("the and that this with from what when your have been they them their there which about into will would "
           "could should than then also just only very more most like explained simply".split())


def sha256(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for blk in iter(lambda: f.read(1 << 20), b""):
            h.update(blk)
    return h.hexdigest()


def words(s):
    return re.findall(r"[a-z0-9]+", (s or "").lower())


# Tang 4 so HINH CUA SCENE, khong so chrome: PiP/phu de/the nguon GIONG NHAU o moi bai cua mot kenh theo thiet ke
# (se lam hai bai khac nhau trong nhu trung) va lop phu them vao lam ban chep lech hash (do 24/09: chep ban mau + PiP
# + the nguon -> hamming 5-13 so voi goc, nguong 5 -> 0/20 khung bi bat). Vung = CHROME cua render.py.
CHROME_MASK = {(1920, 1080): [(1557, 40, 1880, 229), (300, 924, 1620, 1044), (48, 170, 860, 246)],
               # v3.1 (GD 10:4x 17/10/2026): ban doc 9:16 - chi o PiP pip_spec khung_1080x1920 (x 74, y 278, w 308, h 174)
               # v3.3 (NX74-2, GD 18:5x 17/10/2026): + dai phu de doc K3 do that (_build/dai_phu_de.json cua out/M3_SANHO):
               # le 80/155 hop 8 -> x 72-933; MV 680 hop 8 -> day 1248; 2 dong cao 84 -> dinh 1164
               (1080, 1920): [(74, 278, 382, 452), (72, 1164, 933, 1248)]}
DHASH_KIEU = "v2_che_chrome"


def dhash(im):
    im = im.convert("L")
    zones = CHROME_MASK.get(im.size)
    if zones:
        med = int(np.median(np.asarray(im)))
        im = im.copy()
        for z in zones:
            im.paste(med, z)
    g = np.asarray(im.resize((9, 8), Image.LANCZOS), dtype=np.int16)
    bits = (g[:, 1:] > g[:, :-1]).flatten()
    return int("".join("1" if b else "0" for b in bits), 2)


def ham(a, b):
    return bin(a ^ b).count("1")


# ---------------------------------------------------------------- dac trung cua bundle
def load_bundle(bdir):
    sp = json.load(open(os.path.join(bdir, "script.json"), encoding="utf-8"))
    desc_p = os.path.join(bdir, "description.md")
    desc = open(desc_p, encoding="utf-8").read() if os.path.exists(desc_p) else ""
    tj_p = os.path.join(bdir, "titles.json")
    titles = []
    if os.path.exists(tj_p):
        tj = json.load(open(tj_p, encoding="utf-8"))
        titles = [t.get("text", "") for t in tj.get("titles", []) if isinstance(t, dict)]
    return sp, desc, titles


def canh_beat(b):
    """Diem 9 (lenh GD 01:18 28/09/2026): "scene" TUY CHON. Khuon SAMPLE co scene {t, fig, ...};
    khuon canh.py: M1 khong co scene, M2 co scene {kind, ...}. Thieu hoac sai kieu -> {} (khong KeyError)."""
    sc = b.get("scene")
    return sc if isinstance(sc, dict) else {}


def nhan_canh(b):
    """Nhan cau truc 1 beat cho tang 3/5: fig > t (khuon SAMPLE - khong doi) > kind (khuon canh.py M2) > None."""
    sc = canh_beat(b)
    return sc.get("fig") or sc.get("t") or sc.get("kind")


def nguon_beat(b):
    """Diem 8: "src" co the la danh sach dict (SAMPLE), chuoi tron hoac dict (canh.py M2), None.
    Luon tra ve danh sach dict; phan tu chuoi -> {"code": chuoi} (cung cach voi tools/tu_kiem_code_re.py quet()).
    Khuon SAMPLE (danh sach dict) giu nguyen tung phan tu -> tang 7 / 7b khong doi ket qua."""
    s = b.get("src")
    if s is None:
        return []
    if isinstance(s, (str, dict)):
        s = [s]
    return [x if isinstance(x, dict) else {"code": str(x)} for x in s]


def features(sp, titles, video_dur, thumb_p):
    meta, beats = sp.get("meta", {}), sp["beats"]
    idea_txt = " ".join([meta.get("title", ""), meta.get("alt_title", "")] + titles +
                        [" ".join(str(v) for k, v in canh_beat(b).items() if k != "t" and isinstance(v, str))
                         for b in beats if canh_beat(b).get("t") == "section"])   # diem 9: scene tuy chon
    idea = sorted({w for w in words(idea_txt) if len(w) >= 4 and w not in STOP})
    first = beats[0].get("n", "") if beats else ""
    lead = " ".join(re.split(r"(?<=[.!?])\s+", first.strip())[:2])
    seq = [nhan_canh(b) for b in beats]                   # diem 9: fig > t > kind > None
    hist = Counter(seq)
    tot = float(sum(hist.values())) or 1.0
    f = {"idea_tokens": idea, "lead": lead, "struct_seq": seq,
         "struct_hist": {k: v / tot for k, v in sorted(hist.items(), key=lambda kv: str(kv[0]))},   # khoa None + str
         "n_beats": len(beats), "duration_s": round(video_dur, 2),
         "so_beat_khong_scene": sum(1 for b in beats if not canh_beat(b)),          # diem 9 - de KD doc
         "so_beat_src_chuoi": sum(1 for b in beats if isinstance(b.get("src"), str))}   # diem 8
    if thumb_p and os.path.exists(thumb_p):
        f["thumb_dhash"] = "%016x" % dhash(Image.open(thumb_p))
    return f


def load_corpus(patterns, n_recent, self_video_sha):
    reps = []
    for pat in patterns:
        for p in glob.glob(pat):
            try:
                r = json.load(open(p, encoding="utf-8"))
            except Exception as e:                       # bao cao hong: ghi ro, khong bo qua im lang
                reps.append({"_hong": p, "_loi": str(e)})
                continue
            if r.get("video_sha256") != self_video_sha and "dac_trung" in r:
                r["_path"] = p
                reps.append(r)
    ok = [r for r in reps if "_hong" not in r]
    ok.sort(key=lambda r: r.get("ts", ""), reverse=True)
    return ok[:n_recent], [r for r in reps if "_hong" in r]


# ---------------------------------------------------------------- trich khung
def probe(video):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                          "stream=width,height:format=duration", "-of", "json", video],
                         capture_output=True, text=True, check=True).stdout
    j = json.loads(out)
    s = j["streams"][0]
    return int(s["width"]), int(s["height"]), float(j["format"]["duration"])


def extract(video, work, step, w, h):
    os.makedirs(work, exist_ok=True)
    if glob.glob(os.path.join(work, "f_*.jpg")):
        raise RuntimeError("--work da co khung cu, dung thu muc rong de khong tron hai video: %s" % work)
    x0, y0, pw, ph = PIP_SPEC.get((w, h), (0, 0, 0, 0))
    fc = "fps=1/%g,split=2[a][b]" % step
    maps = ["-map", "[a]", "-q:v", "2", os.path.join(work, "f_%05d.jpg")]
    if pw:
        # K1: exact=1 cam ffmpeg tu lam tron toa do crop theo 4:2:0 (truoc: dat x=1557 -> ffmpeg cat ngam o 1556,
        # tang 9 chi qua nho trung hop). exact=1 la tham so co ten (vi tri thu 5 cua crop la keep_aspect).
        fc += ";[b]crop=w=%d:h=%d:x=%d:y=%d:exact=1[c]" % (pw + 2 * PIP_CROP, ph + 2 * PIP_CROP, x0 - PIP_CROP, y0 - PIP_CROP)
        maps += ["-map", "[c]", os.path.join(work, "p_%05d.png")]
    else:
        fc += ";[b]nullsink"
    subprocess.run(["ffmpeg", "-v", "error", "-nostdin", "-i", video, "-filter_complex", fc] + maps, check=True)
    fr = sorted(glob.glob(os.path.join(work, "f_*.jpg")))
    return [(i * step, p) for i, p in enumerate(fr)]


def ocr(work):
    out = os.path.join(work, "ocr.jsonl")
    subprocess.run(["powershell.exe", "-NoLogo", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass",
                    "-File", os.path.join(HERE, "ocr_win.ps1"), "-Dir", work, "-Out", out, "-Filter", "f_*.jpg"],
                   check=True)
    res = {}
    with open(out, encoding="utf-8-sig") as f:
        for line in f:
            if line.strip():
                j = json.loads(line)
                ls = j.get("lines") or []
                res[j["f"]] = [ls] if isinstance(ls, str) else list(ls)
    return res


# ---------------------------------------------------------------- tang 7
def norm(s):
    return re.sub(r"\s+", "", s).upper()


def crossref(doi):
    url = "https://api.crossref.org/works/" + urllib.parse.quote(doi, safe="/")
    req = urllib.request.Request(url, headers={"User-Agent": "StudioSourceCheck/0.1"})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            m = json.load(r)["message"]
        return {"http": 200, "title": (m.get("title") or [""])[0][:140],
                "year": ((m.get("issued") or {}).get("date-parts") or [[None]])[0][0]}
    except urllib.error.HTTPError as e:
        return {"http": e.code}
    except Exception as e:
        return {"http": None, "loi": type(e).__name__}


def tier7(sp, desc, frames, ocr_res, offline):
    declared = []
    for b in sp["beats"]:
        for s in nguon_beat(b):                           # diem 8: chuoi / dict / danh sach -> danh sach dict
            code = s.get("code", "")
            for kind, rx in CODE_RE.items():
                m = rx.search(code)
                if m:
                    declared.append({"beat": b["id"], "loai": kind, "ma": m.group(0).rstrip(".,;"), "hien_luc_s": []})
                    break
    uniq = {}
    for d in declared:
        uniq.setdefault(d["ma"], d)
    screen = []                                           # ma doc duoc bang regex tu OCR
    for t, p in frames:
        for line in ocr_res.get(os.path.basename(p), []):
            nl = norm(line)
            for d in uniq.values():
                nd = norm(d["ma"])
                best = max((difflib.SequenceMatcher(None, nl[i:i + len(nd)], nd).ratio()
                            for i in range(max(1, len(nl) - len(nd) + 1))), default=0.0)
                if best >= OCR_MATCH and (not d["hien_luc_s"] or d["hien_luc_s"][-1] != t):
                    d["hien_luc_s"].append(t)
            for kind, rx in CODE_RE.items():
                for m in rx.finditer(line):
                    screen.append({"t": t, "loai": kind, "ocr": m.group(0).rstrip(".,;")})
    reasons, checked = [], []
    shown = [d for d in uniq.values() if d["hien_luc_s"]]
    for d in uniq.values():
        if not d["hien_luc_s"]:
            reasons.append("ma_khai_bao_khong_hien_tren_man_hinh:%s(beat %s)" % (d["ma"], d["beat"]))
    # ma hien tren man hinh nhung KHONG khai bao (vd ve trong hinh) - chi tinh khi khong khop ma khai bao nao
    extra = []
    for s in screen:
        if not any(difflib.SequenceMatcher(None, norm(s["ocr"]), norm(d["ma"])).ratio() >= OCR_MATCH
                   for d in uniq.values()):
            if all(e["ocr"] != s["ocr"] for e in extra):
                extra.append(s)
    anchors = [(d["loai"], d["ma"]) for d in shown] + [(e["loai"], e["ocr"]) for e in extra]
    if not anchors:
        reasons.insert(0, "khong_co_ma_nguon_so_cap_nao_hien_tren_man_hinh")
    for kind, code in anchors:
        if kind != "DOI":
            checked.append({"ma": code, "kiem": "chi_kiem_dinh_dang"})
            continue
        if offline:
            checked.append({"ma": code, "kiem": "offline"})
            reasons.append("chua_xac_minh_duoc_doi(offline):%s" % code)
            continue
        cr = crossref(code)
        checked.append(dict(ma=code, kiem="crossref", **cr))
        if cr.get("http") != 200:
            reasons.append("doi_khong_ton_tai_tren_crossref(http=%s):%s" % (cr.get("http"), code))
        time.sleep(0.3)
    desc_codes = sorted({m.group(0) for rx in CODE_RE.values() for m in rx.finditer(desc)})
    return {"ok": not reasons, "ly_do": reasons,
            "khai_bao": list(uniq.values()), "ma_ocr_khong_khai_bao": extra,
            "xac_minh": checked, "ma_trong_description (chi ghi, khong chan)": desc_codes,
            "so_khung_ocr": len(frames)}


# ---------------------------------------------------------------- tang 7b (lenh GD 25/09/2026 09:20, tu phieu 22 KD - SIET, khong noi)
# 7b.1 (lenh GD 10:59, tu phieu 28 KD - SIET tiep): L1 font khong mo duoc -> LOAI rieng, khong crash;
# L2 doc cmap qua cuoi file/bang -> bao loi, numGroups (fmt12) va segCountX2 (fmt4, E1 phieu 30
# gop vao 7b.2 theo lenh GD 14:32) deu co tran; L3 them { } \ vao DOI_BAD + so DOI
# theo chu HIEN THI that (bo escape ASS); L4 kiem cmap cua DUNG font tung duong ve (in_figure: segoeui).
# (1) DOI trong chrome.ass == DOI khai bao TUNG BYTE (khong gian hien thi); (2) moi ky tu DOI co glyph
# trong cmap font that cua duong ve; (3) DOI chua ()<>[]{}\ -> LOAI, ly do DOI_CHAR_UNSUPPORTED.
# fontTools KHONG co san (kiem 25/09, khong cai goi moi theo lenh) -> doc cmap TTF truc tiep bang stdlib, format 4 + 12.
# CODE_RE: 27/09/2026 THEM NIST + CODATA (phieu 52 L52-8; CHUAN_BI_NIST_CODATA.md). Mau DOI KHONG doi - diem yeu
# "dung o khoang trang" GD giao KD xet rieng. DOI_RAW_RE duoi day CHI de kiem ky tu,
# quet den khoang trang (DOI theo dinh nghia khong chua khoang trang).
DOI_RAW_RE = re.compile(r"10\.\d{4,9}/\S+")
# 7b.1 L3: them { } \ - render doi { } thanh ( ) (mat thong tin) va \ mo escape ASS -> khai/hien thi co the lech
DOI_BAD = "()<>[]{}\\"
FONT_FILES = {"consolas": r"C:\Windows\Fonts\consola.ttf",
              "segoe ui": r"C:\Windows\Fonts\segoeui.ttf",
              # v3.3: phong K3 (FONT_KENH duoi)
              "georgia": r"C:\Windows\Fonts\georgia.ttf"}
# 7b.1 L4: chu DOI ve TREN HINH (in_figure) do render ve bang F_TINY = segoeui.ttf
# (render.py :55 F_TINY, :720 beat s5d) - khong di qua chrome.ass, phai kiem cmap cua CHINH font nay
FONT_IN_FIGURE = r"C:\Windows\Fonts\segoeui.ttf"


def khai_hien_thi(s):
    """Chu ma render se HIEN THI cho ban khai: ass_txt cua render doi { -> ( va } -> ) (mat thong
    tin); moi ky tu khac di vong escape kha dao (\\ -> \\\\ -> hien thi \\). 7b.1 L3: so trong
    khong gian HIEN THI, khong so trong khong gian escape."""
    return s.replace("{", "(").replace("}", ")")


def ass_hien_thi(s):
    """Chu HIEN THI that tu text ASS (da cat truoc \\N o doc_ass_src): bo escape ASS tung ky tu
    trai->phai: \\\\ -> mot dau \\, \\h -> khoang trang, \\n -> xuong dong mem; \\ le giu nguyen."""
    out, i = [], 0
    while i < len(s):
        if s[i] == "\\" and i + 1 < len(s) and s[i + 1] in "\\hn":
            out.append({"\\": "\\", "h": " ", "n": "\n"}[s[i + 1]])
            i += 2
        else:
            out.append(s[i])
            i += 1
    return "".join(out)


# ---------------------------------------------------------------- 7b.3 / 7b.4 - BAN v2: bo CHUNG MINH luong chay
# v2 (phieu KD 62 L62-1, 04/10/2026): thay bo phan tich chu ve cua 57fab51e (vung :374-700 - luat (a)/(b)/(c) theo
# scope + gap hang) bang bo CHUNG MINH LUONG CHAY dung chung nhanh render va nhanh --canh. Mot hang chuoi co DOI chi
# la "da ve" khi chung minh duoc no CHAY TOI doi so CHU (dung vi tri) cua mot loi goi ve SONG - khong o nhanh chet
# (dieu kien HANG), khong sau return / raise / break, khong trong ham khong ai tham chieu - qua ten / phan tu vong lap
# / tham so ham ma cong suy ra CHAC CHAN (rang buoc duy nhat, khong bi gan lai). Bit 8 duong vong phieu 62:
# 8-1 cat lat, 8-3 split (bien doi, khong phai luong chay) | 8-2, 8-5 dieu kien hang False | 8-4 gan chet bi for de |
# 8-6 ham khong ai goi -> 7-31; 8-10 format, 8-11 join (+ 8-12 % bien module, 8-13 str() nhanh render) GAP ra DOI -> 7-32.
# Import rieng trong vung (giu nguyen dong import dau tep nhu 57fab51e).
import base64 as _b64
import binascii as _binascii
import codecs as _codecs
import operator as _op
import string as _string

TEN_VE_PIL = ("text", "multiline_text")
# v2: vi tri doi so CHU cua loi goi ve PIL - ImageDraw.text(xy, text, ...) / multiline_text(xy, text, ...): vi tri 1
# hoac text=; xy / font / fill / anchor khong phai chu (57fab51e quet MOI doi so).
VI_TRI_PIL = ({1}, {"text"})
# 7b.3 (lenh GD 15:09, bit 7-32): "MAM DOI" — manh hang trong phep ghep chuoi luc chay ma khi noi
# co the thanh DOI: ket thuc "10." + toi da 9 chu so (nua trai), hoac mo dau chu so roi "/" (nua phai).
# v2: nua phai them dang ".<so>/" va "0.<so>/" (cat sau "10" / "1"); them GIUA (ket thuc "10.<so>/", duoi do luc chay
# ghep vao) va NHAN (ket thuc "DOI" / "doi:" / "doi.org/", co the kem "1" / "10" / "10.<so>": phan sau luc chay ghep).
DOI_MAM_TRAI_RE = re.compile(r"10\.\d{0,9}$")
DOI_MAM_PHAI_RE = re.compile(r"^(?:0?\.)?\d{1,9}/\S")
DOI_MAM_GIUA_RE = re.compile(r"10\.\d{4,9}/$")
DOI_MAM_NHAN_RE = re.compile(r"(?:\bDOI\b|\bdoi:|doi\.org/)[\s:]*(?:1(?:0(?:\.\d{0,9})?)?)?$")
# 7b.4 (thu GD 121, 11:24 29/09; de xuat SX 10:44 nhanh (1')/(2')): ban MANIM khong co chrome.ass -> nguon chu that
# la canh.py (--canh). Loi goi ve goc: lop chu cua manim + ham ban sac (nhan THEO TEN, cong khong lan vao tep ban_sac).
TEN_VE_MANIM = ("Text", "MarkupText", "Paragraph", "Tex", "MathTex")
# v2: bo "so" (ban_sac/K1_ban_quang_hoc.py khong co ham so(); loi goi so(...) khong tinh la ve -> DOI qua do 7-31).
HAM_BAN_SAC = ("chu", "nhan", "chu_thich_nguon", "so_hook")
# v2: vi tri doi so CHU cua tung ten ve goc nhanh --canh: ({vi tri} | "*" = moi vi tri, {ten tu khoa}). Ham ban sac theo
# chu ky K1_ban_quang_hoc.py (kiem tay 04/10/2026): chu(s, ...), nhan(diem, s, ...), chu_thich_nguon(scene, s, ...),
# so_hook(gia_tri, don_vi, ...); lop manim: Text / MarkupText(text, ...), Paragraph / Tex / MathTex(*chuoi, ...).
VI_TRI_CANH = {"Text": ({0}, {"text"}), "MarkupText": ({0}, {"text"}), "Paragraph": ("*", set()),
               "Tex": ("*", set()), "MathTex": ("*", set()), "chu": ({0}, {"s"}), "nhan": ({1}, {"s"}),
               "chu_thich_nguon": ({1}, {"s"}), "so_hook": ({0, 1}, {"gia_tri", "don_vi"})}
# (2') phong cua duong ve ham ban sac theo kenh. K1 kiem tay 29/09: ban_sac/K1_ban_quang_hoc.py (sha 67a8543a) :8
# FONTS[0] = "Segoe UI", :13 FONT = FONTS[0], :32 chu() = Text(dich(s), font=FONT); nhan/chu_thich_nguon/so_hook di qua
# chu(). Kenh khac CHUA kiem -> khong co trong bang -> LOAI khong_biet_file_font_cua_duong_ve.
# v3.3 K3 kiem tay 18/10/2026: ban_sac/K3_so_thuc_dia.py :7 FONTS = ["Georgia", "EB Garamond"], :15 FONT = FONTS[0],
# :17-18 FONT = FONT_VI chi khi VI (ban VI bi cam - lenh Chu tich 20:3x 17/10), :38-40 chu(s, ...) = Text(dich(s), font=FONT);
# :45-47 chu_nghieng = cung FONT + slant=ITALIC -> georgiai.ttf: cmap georgia.ttf (sha8 38dffcaf) va georgiai.ttf
# (sha8 d3e4bad2) do bang font_ho_tro() cua cong nay trung nhau 394 ma trong 0x20-0x24F + 0x2000-0x21FF -> mot tep du.
# Duong ve DOI cua K3 = chu() trong canh.py (cong chi doc canh.py).
FONT_KENH = {"K1": FONT_FILES["segoe ui"], "K3": FONT_FILES["georgia"]}
KENH_MODULE_RE = re.compile(r"^(K\d+)_")

_KG = object()              # v2: gia tri KHONG GAP duoc (khong tinh chac chan luc doc ma)
_LAMBDA = object()          # v2: scope than lambda (khong chung minh duoc than lambda co chay)
_TIEP = object()            # v2: _dau_lenh chua ket luan -> di tiep len nut cha
_GIOI = 100000              # v2: tran do dai chuoi / day khi gap (chong no bo nho)
_HAM_DN = (ast.FunctionDef, ast.AsyncFunctionDef)
_VONG = (ast.For, ast.AsyncFor)
_TRY = (ast.Try,) + ((ast.TryStar,) if hasattr(ast, "TryStar") else ())
_COMP = (ast.ListComp, ast.SetComp, ast.GeneratorExp, ast.DictComp)
_BO_QUA = (ast.expr_context, ast.operator, ast.unaryop, ast.boolop, ast.cmpop)
_MATCH = getattr(ast, "Match", None)
_MATCH_CASE = getattr(ast, "match_case", None)
_KHOI_GHEP = (ast.If, ast.While, ast.With, ast.AsyncWith, ast.ClassDef) + _VONG + _TRY + _HAM_DN \
    + ((_MATCH,) if _MATCH is not None else ())
_TIEU_THU = {"list", "tuple", "set", "frozenset", "sorted", "sum", "max", "min", "dict"}
_GIAI_MA = {"b64decode": _b64.b64decode, "b32decode": _b64.b32decode, "b16decode": _b64.b16decode,
            "a85decode": _b64.a85decode, "b85decode": _b64.b85decode, "urlsafe_b64decode": _b64.urlsafe_b64decode,
            "standard_b64decode": _b64.standard_b64decode, "decodebytes": _b64.decodebytes,
            "unhexlify": _binascii.unhexlify, "a2b_base64": _binascii.a2b_base64, "a2b_hex": _binascii.a2b_hex,
            "unquote": urllib.parse.unquote, "unquote_plus": urllib.parse.unquote_plus,
            "unquote_to_bytes": urllib.parse.unquote_to_bytes}
# GAP CHAT: ham giai ma chi tin khi ten CHAC la ham cua dung module nay (import dung, khong bi che / gan lai)
_GIAI_MA_MOD = {"b64decode": "base64", "b32decode": "base64", "b16decode": "base64", "a85decode": "base64",
                "b85decode": "base64", "urlsafe_b64decode": "base64", "standard_b64decode": "base64",
                "decodebytes": "base64", "unhexlify": "binascii", "a2b_base64": "binascii", "a2b_hex": "binascii",
                "unquote": "urllib.parse", "unquote_plus": "urllib.parse", "unquote_to_bytes": "urllib.parse"}
# MANH (7-32): loi goi chac khong tra chu (so / bool) -> khong lan vao doi so cua no
_KHONG_CHU = {"startswith", "endswith", "find", "rfind", "index", "rindex", "count", "isdigit", "isalpha", "isalnum",
              "isspace", "isupper", "islower", "istitle", "isnumeric", "isdecimal", "isidentifier", "isprintable",
              "len", "int", "float", "bool", "isinstance", "issubclass", "hasattr", "callable", "id", "hash", "ord",
              "round", "abs", "textlength", "textbbox", "textsize", "getbbox", "getlength", "getsize"}
_MA_HOA_OK = {"utf-8", "utf8", "utf_8", "latin-1", "latin1", "latin_1", "iso-8859-1", "ascii", "us-ascii", "utf-16",
              "utf16", "utf_16", "utf-32", "utf32", "utf_32", "cp1252", "rot13", "rot_13", "hex", "hex_codec",
              "base64", "base64_codec", "unicode_escape", "raw_unicode_escape", "punycode", "idna", "quopri",
              "quopri_codec", "uu", "uu_codec"}
_PHUONG_THUC_CHUOI = {"format", "format_map", "join", "replace", "split", "rsplit", "splitlines", "partition",
                      "rpartition", "upper", "lower", "strip", "lstrip", "rstrip", "title", "capitalize", "casefold",
                      "swapcase", "center", "ljust", "rjust", "zfill", "expandtabs", "removeprefix", "removesuffix",
                      "translate", "encode", "decode", "__add__", "__mod__", "__mul__", "__rmul__", "__getitem__",
                      "__format__", "__str__", "__repr__"}
_HAM_GHEP = {"str", "chr", "format", "repr", "ascii", "bytes", "bytearray", "map"}
_HAM_GAP = {"str": str, "repr": repr, "ascii": ascii, "chr": chr, "ord": ord, "len": len, "tuple": tuple,
            "list": list, "sorted": sorted, "abs": abs, "hex": hex, "oct": oct, "bin": bin, "bool": bool,
            "float": float}
_HAM_MAP = {"chr": chr, "str": str, "ord": ord}
_HAM_DONG = {"exec", "eval", "compile", "globals", "locals", "vars", "__import__"}
_THUOC_TINH_DONG = {"__dict__", "__builtins__", "_getframe", "f_locals", "f_globals", "getsource", "getsourcelines",
                    "getcomments"}
_SO_SANH = {ast.Eq: _op.eq, ast.NotEq: _op.ne, ast.Lt: _op.lt, ast.LtE: _op.le, ast.Gt: _op.gt, ast.GtE: _op.ge,
            ast.In: lambda a, b: a in b, ast.NotIn: lambda a, b: a not in b}
_PHEP = {ast.Sub: _op.sub, ast.Div: _op.truediv, ast.FloorDiv: _op.floordiv, ast.RShift: _op.rshift,
         ast.BitOr: _op.or_, ast.BitXor: _op.xor, ast.BitAnd: _op.and_}
_CHO_PHAN_TRAM_RE = re.compile(r"%(?:\([^)]*\))?[-#0 +]*(?:\*|\d+)?(?:\.(?:\*|\d+))?[hlL]?[diouxXeEfFgGcrsa]")
_SO_DAI_RE = re.compile(r"\d{5,}")


def _khop_mam(s):
    """v2 (7-32): manh hang mang DOI tron hoac MAM DOI (trai / giua / phai / nhan)."""
    return bool(DOI_RAW_RE.search(s) or DOI_MAM_TRAI_RE.search(s) or DOI_MAM_GIUA_RE.search(s)
                or DOI_MAM_PHAI_RE.search(s) or DOI_MAM_NHAN_RE.search(s))


def _tach_mau_phan_tram(t):
    """Phan chu co dinh cua mau % (tach tai cho trong; %% giu la %)."""
    return [p.replace("\x00", "%") for p in _CHO_PHAN_TRAM_RE.split(t.replace("%%", "\x00"))]


def _tach_mau_ngoac(t):
    """Phan chu co dinh cua mau str.format; mau hong -> ca chuoi."""
    try:
        return [lit for lit, ten, spec, conv in _string.Formatter().parse(t) if lit]
    except ValueError:
        return [t]


def _mau_an_toan(s, kieu):
    """Mau % / {} gap duoc an toan: khong do rong / do chinh xac * hoac >= 5 chu so (no bo nho); {} khong truy cap
    thuoc tinh / chi so ({0.x} {0[i]}) va khong mau long."""
    if kieu == "%":
        for m in re.finditer(r"%(?:\([^)]*\))?[-#0 +]*(\*|\d+)?(?:\.(\*|\d+))?", s):
            if any(g == "*" or (g and len(g) >= 5) for g in m.groups()):
                return False
        return True
    try:
        for lit, ten, spec, conv in _string.Formatter().parse(s):
            if ten is not None and ("." in ten or "[" in ten):
                return False
            if spec and (_SO_DAI_RE.search(spec) or "{" in spec):
                return False
    except ValueError:
        return False
    return True


def _chuoi_trong(v, sau=0):
    """Moi chuoi (bytes doc latin-1) nam trong gia tri da gap (day / dict long nhau)."""
    if sau > 6:
        return []
    if isinstance(v, str):
        return [v]
    if isinstance(v, (bytes, bytearray)):
        return [bytes(v).decode("latin-1")]
    ra = []
    if isinstance(v, (tuple, list)):
        for z in v[:1000]:
            ra.extend(_chuoi_trong(z, sau + 1))
    elif isinstance(v, dict):
        for k, z in list(v.items())[:1000]:
            ra.extend(_chuoi_trong(k, sau + 1))
            ra.extend(_chuoi_trong(z, sau + 1))
    return ra


def _ten_dich(t):
    """Ten (Name.id) bi gan trong dich cua phep gan / vong for (Tuple / List / Starred de quy)."""
    if isinstance(t, ast.Name):
        return {t.id}
    if isinstance(t, (ast.Tuple, ast.List)):
        ra = set()
        for e in t.elts:
            ra |= _ten_dich(e)
        return ra
    if isinstance(t, ast.Starred):
        return _ten_dich(t.value)
    return set()


def _ten_tham_so(a):
    ra = {q.arg for q in a.posonlyargs + a.args + a.kwonlyargs}
    ra |= {q.arg for q in (a.vararg, a.kwarg) if q is not None}
    return ra


def _dem_gan(t, x):
    return sum(1 for n in ast.walk(t) if isinstance(n, ast.Name) and n.id == x and isinstance(n.ctx, ast.Store))


def _dung_doc(tree):
    """Tep doc docstring luc chay (__doc__ / getdoc / cleandoc) -> docstring KHONG duoc mien 7-31."""
    for n in ast.walk(tree):
        if isinstance(n, ast.Name) and n.id in ("__doc__", "getdoc", "cleandoc"):
            return True
        if isinstance(n, ast.Attribute) and n.attr in ("__doc__", "getdoc", "cleandoc"):
            return True
        if isinstance(n, ast.Constant) and isinstance(n.value, str) and "__doc__" in n.value:
            return True
    return False


class _PhanTichChu:
    """v2 (phieu KD 62 L62-1): bo CHUNG MINH luong chay chu ve, dung chung nhanh render (PIL) va --canh (manim).
    nguon = [(ten tep, ma nguon, duong dan)], che_do = "render" | "canh". Ket qua: ra {doi: "tep:dong"} (DOI cua hang
    CHUNG MINH duoc ve), goc {doi: {ten ve goc}}, loi [7-31 / 7-32], kenh [ma kenh import ^K<so>_ - chi --canh].
    Buoc: (1) chi muc cay (cha / scope tung nut); (2) SONG = nut khong CHAC chet: bo nhanh dieu kien HANG, lenh sau
    return / raise / break / continue / exit(), than vong lap rong chac, generator khong ai tieu thu, than lambda;
    (3) DEN DUOC = ham co def song va duoc tham chieu (ten / thuoc tinh / chuoi getattr) tu vung den duoc, hoac la
    loi vao (dunder; construct/setup/tear_down cua --canh); (4) THAM SO VE = tham so ham noi bo chay toi doi so chu
    cua loi goi ve (diem bat dong); (5) CHUNG MINH = hang chuoi chay toi doi so chu cua loi goi ve SONG trong vung
    DEN DUOC; (6) KET LUAN 7-31 (DOI cua hang ngoai docstring phai chung minh ve o it nhat mot hang) / 7-32 (ghep
    luc chay / ma dong)."""

    def __init__(self, nguon, che_do):
        self.che_do = che_do
        self.cay, self.cha, self.ham_cua = [], {}, {}
        self.cac_ham, self.ham_theo_ten, self.ham_top = [], {}, {}
        self.ten_tep, self.ten_lop, self.ten_global, self.goi = set(), set(), {}, []
        self.song, self.den_duoc, self.tham_ve, self.da_ve = set(), set(), {}, {}
        self.ra, self.goc, self.loi, self._da_bao = {}, {}, [], set()
        self._m_giai, self._dang_giai, self._m_gap, self._dang_gap, self._m_tap = {}, set(), {}, set(), {}
        self._m_gan, self._goi_den, self._vong = {}, None, []
        self._ten_khac, self._nhap, self._nhap_con, self._thuoc_tinh_gan = set(), {}, set(), set()
        self._setattr_dong, self._m_manh, self._m_tra, self._m_ten, self._m_thuoc = False, {}, {}, None, None
        kenh = set()
        for base, src, path in nguon:
            tree = ast.parse(src, filename=path)
            ten_tep = os.path.splitext(base)[0]
            self.ten_tep.add(ten_tep)
            doc = set()
            if not _dung_doc(tree):                 # tep doc __doc__ luc chay -> docstring KHONG mien
                for n in ast.walk(tree):
                    if isinstance(n, (ast.Module, ast.ClassDef) + _HAM_DN):
                        b = n.body
                        if b and isinstance(b[0], ast.Expr) and isinstance(b[0].value, ast.Constant) \
                                and isinstance(b[0].value.value, str):
                            doc.add(id(b[0].value))
            self.cay.append((base, tree, doc))
            self._lap_chi_muc(tree)
            self._lap_ten(tree)
            gl = set()
            for n in ast.walk(tree):
                if isinstance(n, _HAM_DN):
                    self.cac_ham.append(n)
                    self.ham_theo_ten.setdefault(n.name, []).append(n)
                    if self.cha[id(n)][0] is tree:
                        self.ham_top.setdefault((ten_tep, n.name), []).append(n)
                elif isinstance(n, ast.ClassDef):
                    self.ten_lop.add(n.name)
                elif isinstance(n, ast.Call):
                    self.goi.append(n)
                elif isinstance(n, (ast.Global, ast.Nonlocal)):
                    gl.update(n.names)
                ten_mod = []                        # kenh: GIU NGUYEN thuat toan 57fab51e (moi Import / ImportFrom)
                if isinstance(n, ast.Import):
                    ten_mod = [al.name for al in n.names]
                elif isinstance(n, ast.ImportFrom) and n.module:
                    ten_mod = [n.module]
                for t in ten_mod:
                    m = KENH_MODULE_RE.match(t.split(".")[-1])
                    if m:
                        kenh.add(m.group(1))
            self.ten_global[id(tree)] = gl
        self.kenh = sorted(kenh) if che_do == "canh" else []
        self._tinh_song()
        self._tinh_den_duoc()
        self._tinh_tham_ve()
        self._chung_minh()
        self._ket_luan()

    # ------------------------------------------------------------ (1) chi muc
    def _lap_chi_muc(self, tree):
        """cha[id] = (nut cha, ten truong, chi so | None); ham_cua[id] = scope chay: None (module / than lop cap
        module), fd (than ham) hoac _LAMBDA (than lambda). Mac dinh / decorator / chu thich kieu thuoc scope ngoai."""
        self.ham_cua[id(tree)] = None
        ngan = [(tree, None)]
        while ngan:
            n, sc = ngan.pop()
            for f, v in ast.iter_fields(n):
                for i, c in (enumerate(v) if isinstance(v, list) else ((None, v),)):
                    if not isinstance(c, ast.AST) or isinstance(c, _BO_QUA):
                        continue
                    if f == "body" and isinstance(n, _HAM_DN):
                        sc2 = n
                    elif f == "body" and isinstance(n, ast.Lambda):
                        sc2 = _LAMBDA
                    else:
                        sc2 = sc
                    self.cha[id(c)] = (n, f, i)
                    self.ham_cua[id(c)] = sc2
                    ngan.append((c, sc2))

    # ------------------------------------------------------------ (2) song
    def _tinh_song(self):
        for base, tree, doc in self.cay:
            self._vong = []
            self._khoi(tree.body)
        for fd in self.cac_ham:                     # than ham: SONG noi bo; ham co chay hay khong do (3) quyet
            self._vong = []
            self._khoi(fd.body)

    def _khoi(self, ds):
        for st in ds:
            if not self._lenh(st):
                return False
        return True

    def _lenh(self, st):
        """Danh dau lenh SONG; tra True neu chay xong lenh co the toi lenh sau (False = CHAC khong toi)."""
        self.song.add(id(st))
        if isinstance(st, _HAM_DN):
            for e in st.decorator_list + [st.args, st.returns]:
                self._bt(e)
            return True
        if isinstance(st, ast.ClassDef):
            for e in st.decorator_list + st.bases + st.keywords:
                self._bt(e)
            return self._khoi(st.body)
        if isinstance(st, ast.If):
            self._bt(st.test)
            c = self._chan_ly(st.test)
            if c is not None:                       # dieu kien HANG: chi nhanh duoc chon SONG
                return self._khoi(st.body if c else st.orelse)
            a = self._khoi(st.body)
            return self._khoi(st.orelse) or a
        if isinstance(st, ast.While):
            self._bt(st.test)
            c = self._chan_ly(st.test)
            if c is False:
                return self._khoi(st.orelse)
            self._vong.append(False)
            self._khoi(st.body)
            gay = self._vong.pop()
            if c is True:                           # while True: chi ra duoc qua break
                return gay
            return self._khoi(st.orelse) or gay
        if isinstance(st, _VONG):
            self._bt(st.iter)
            self._bt(st.target)
            if self._rong_chac(st.iter):            # lap tren day rong chac: than CHET
                return self._khoi(st.orelse)
            self._vong.append(False)
            self._khoi(st.body)
            gay = self._vong.pop()
            return self._khoi(st.orelse) or gay
        if isinstance(st, _TRY):
            tb = self._khoi(st.body)
            th = []
            for h in st.handlers:
                self.song.add(id(h))
                self._bt(h.type)
                th.append(self._khoi(h.body))
            te = self._khoi(st.orelse) if tb else False
            tf = self._khoi(st.finalbody)
            return tf and ((tb and te) or any(th))
        if isinstance(st, (ast.With, ast.AsyncWith)):
            for it in st.items:
                self._bt(it)
            return self._khoi(st.body)
        if _MATCH is not None and isinstance(st, _MATCH):
            self._bt(st.subject)
            for c in st.cases:
                self.song.add(id(c))
                self._bt(c.pattern)
                self._bt(c.guard)
                self._khoi(c.body)
            return True
        if isinstance(st, (ast.Return, ast.Raise)):
            for c in ast.iter_child_nodes(st):
                self._bt(c)
            return False
        if isinstance(st, ast.Continue):
            return False
        if isinstance(st, ast.Break):
            if self._vong:
                self._vong[-1] = True
            return False
        if isinstance(st, ast.Assert):
            self._bt(st.test)
            c = self._chan_ly(st.test)
            if c is not True:
                self._bt(st.msg)
            return c is not False
        for c in ast.iter_child_nodes(st):
            self._bt(c)
        return not (isinstance(st, ast.Expr) and self._la_thoat(st.value))

    def _bt(self, e):
        """Danh dau bieu thuc SONG: bo nhanh IfExp / BoolOp chet do dieu kien HANG; than lambda khong song (chi mac
        dinh); phan tu comprehension chet khi vong rong chac / dieu kien HANG sai / generator khong ai tieu thu."""
        ngan = [e]
        while ngan:
            n = ngan.pop()
            if n is None or isinstance(n, _BO_QUA):
                continue
            self.song.add(id(n))
            if isinstance(n, ast.Lambda):
                ngan.extend(n.args.defaults + n.args.kw_defaults)
            elif isinstance(n, ast.IfExp):
                ngan.append(n.test)
                c = self._chan_ly(n.test)
                if c is not False:
                    ngan.append(n.body)
                if c is not True:
                    ngan.append(n.orelse)
            elif isinstance(n, ast.BoolOp):
                for v in n.values:
                    ngan.append(v)
                    c = self._chan_ly(v)
                    if c is not None and c == isinstance(n.op, ast.Or):
                        break                       # or gap True / and gap False: phan sau CHET
            elif isinstance(n, _COMP):
                chet = False
                for g in n.generators:
                    self.song.add(id(g))
                    ngan.append(g.iter)
                    if self._rong_chac(g.iter):
                        chet = True
                        break
                    ngan.append(g.target)
                    for dk in g.ifs:
                        ngan.append(dk)
                        if self._chan_ly(dk) is False:
                            chet = True
                            break
                    if chet:
                        break
                if not chet and (not isinstance(n, ast.GeneratorExp) or self._gen_tieu_thu(n)):
                    ngan.extend((n.key, n.value) if isinstance(n, ast.DictComp) else (n.elt,))
            else:
                ngan.extend(ast.iter_child_nodes(n))

    def _gen_tieu_thu(self, n):
        """Generator co CHAC bi tieu thu het: *gen, list/tuple/sorted/...(gen), x.join/extend/update(gen), for."""
        p, f, i = self.cha.get(id(n), (None, None, None))
        if isinstance(p, ast.Starred):
            return True
        if isinstance(p, ast.Call) and f == "args":
            fn = p.func
            if isinstance(fn, ast.Name) and fn.id in _TIEU_THU and fn.id not in self.ham_theo_ten:
                return True
            if isinstance(fn, ast.Attribute) and fn.attr in ("join", "extend", "update", "writelines"):
                return True
        return isinstance(p, _VONG + (ast.comprehension,)) and f == "iter"

    def _chan_ly(self, e):
        """Gia tri chan ly CHAC CHAN (True / False) cua dieu kien qua GAP CHAT (chac=True); None neu phu thuoc luc
        chay / khong gap duoc. Duoc tra None oan (gia tri thuc ra co dinh), KHONG BAO GIO tra sai."""
        if e is None:
            return None
        v = self._gap(e, chac=True)
        if v is _KG:
            return None
        try:
            return bool(v)
        except Exception:
            return None

    @staticmethod
    def _rong_chac(it):
        if isinstance(it, ast.Constant) and isinstance(it.value, (str, bytes)) and not it.value:
            return True
        if isinstance(it, (ast.Tuple, ast.List, ast.Set)) and not it.elts:
            return True
        return isinstance(it, ast.Dict) and not it.keys

    @staticmethod
    def _la_thoat(e):
        if not isinstance(e, ast.Call):
            return False
        f = e.func
        if isinstance(f, ast.Name):
            return f.id in ("exit", "quit")
        return (isinstance(f, ast.Attribute) and isinstance(f.value, ast.Name) and f.value.id in ("sys", "os")
                and f.attr in ("exit", "_exit", "abort"))

    def _song_toan(self, n):
        """Nut SONG va scope cua no chay duoc: module, hoac ham DEN DUOC (than lambda: khong)."""
        if id(n) not in self.song:
            return False
        sc = self.ham_cua.get(id(n))
        return sc is None or (sc is not _LAMBDA and id(sc) in self.den_duoc)

    # ------------------------------------------------------------ (3) den duoc
    def _tinh_den_duoc(self):
        nut_ref = {}
        for base, tree, doc in self.cay:
            for n in ast.walk(tree):
                if id(n) not in self.song:
                    continue
                sc = self.ham_cua.get(id(n))
                if sc is _LAMBDA:
                    continue
                ten = None
                if isinstance(n, ast.Name) and isinstance(n.ctx, ast.Load):
                    ten = n.id
                elif isinstance(n, ast.Attribute):
                    ten = n.attr
                elif isinstance(n, ast.Constant) and isinstance(n.value, str) and n.value.isidentifier():
                    p, f, i = self.cha.get(id(n), (None, None, None))
                    if (isinstance(p, ast.Call) and f == "args" and i == 1 and isinstance(p.func, ast.Name)
                            and p.func.id == "getattr"):
                        ten = n.value
                if ten is not None:
                    nut_ref.setdefault(None if sc is None else id(sc), set()).add(ten)
        refs = set(nut_ref.get(None, ()))
        doi = True
        while doi:
            doi = False
            for fd in self.cac_ham:
                if id(fd) in self.den_duoc or id(fd) not in self.song:
                    continue
                sc = self.ham_cua.get(id(fd))
                if sc is _LAMBDA or (sc is not None and id(sc) not in self.den_duoc):
                    continue
                if self._la_loi_vao(fd) or fd.name in refs:
                    self.den_duoc.add(id(fd))
                    refs |= nut_ref.get(id(fd), set())
                    doi = True

    def _la_loi_vao(self, fd):
        if len(fd.name) > 4 and fd.name[:2] == "__" == fd.name[-2:]:
            return True
        return self.che_do == "canh" and fd.name in ("construct", "setup", "tear_down") and self._la_phuong_thuc(fd)

    def _la_phuong_thuc(self, fd):
        p, f, i = self.cha.get(id(fd), (None, None, None))
        return isinstance(p, ast.ClassDef) and f == "body"

    # ------------------------------------------------------------ (4)(5) loi goi ve / vi tri doi so CHU
    def _ung_vien(self, call):
        """Ham noi bo co the la dich cua loi goi: f(...) -> ham cung ten (khong phai method); tep.f(...) -> ham cap
        module cua tep do (render.py / anh.py); x.m(...) -> method cung ten. Rong = khong phai ham noi bo."""
        f = call.func
        if isinstance(f, ast.Name):
            return [fd for fd in self.ham_theo_ten.get(f.id, ()) if not self._la_phuong_thuc(fd)]
        if isinstance(f, ast.Attribute):
            if isinstance(f.value, ast.Name) and f.value.id in self.ten_tep:
                return list(self.ham_top.get((f.value.id, f.attr), ()))
            return [fd for fd in self.ham_theo_ten.get(f.attr, ()) if self._la_phuong_thuc(fd)]
        return []

    def _goi_toi(self, fd):
        if self._goi_den is None:
            self._goi_den = {}
            for call in self.goi:
                for f in self._ung_vien(call):
                    self._goi_den.setdefault(id(f), []).append(call)
        return self._goi_den.get(id(fd), [])

    def _lech(self, fd, call):
        """So tham so dau bi rang buoc ngam (self / cls): obj.m(...) bo 1; Lop.m(obj, ...) / staticmethod bo 0."""
        if not self._la_phuong_thuc(fd):
            return 0
        tt = {d.id for d in fd.decorator_list if isinstance(d, ast.Name)}
        if "staticmethod" in tt:
            return 0
        if "classmethod" in tt:
            return 1
        f = call.func
        if isinstance(f, ast.Attribute) and not (isinstance(f.value, ast.Name) and f.value.id in self.ten_lop):
            return 1
        return 0

    def _anh_xa(self, fd, call, lech):
        """{tham so | "*vararg" | "**kwarg": [bieu thuc doi so]} cua loi goi; None = khong khop chu ky."""
        a = fd.args
        vt = [q.arg for q in a.posonlyargs + a.args][lech:]
        ra, k = {}, 0
        for e in call.args:
            if isinstance(e, ast.Starred):
                cac = self._phan_tu_lit(e.value)
                if cac is None:
                    break                               # *x khong biet do dai: dung anh xa vi tri
            else:
                cac = [e]
            for x in cac:
                if k < len(vt):
                    ra.setdefault(vt[k], []).append(x)
                elif a.vararg is not None:
                    ra.setdefault("*" + a.vararg.arg, []).append(x)
                else:
                    return None
                k += 1
        ten_kw = {q.arg for q in a.args + a.kwonlyargs}
        for kw in call.keywords:
            if kw.arg is None:
                continue
            if kw.arg in ten_kw:
                ra.setdefault(kw.arg, []).append(kw.value)
            elif a.kwarg is not None:
                ra.setdefault("**" + a.kwarg.arg, []).append(kw.value)
            else:
                return None
        return ra

    def _goi_mo(self, call):
        if any(kw.arg is None for kw in call.keywords):
            return True
        return any(isinstance(e, ast.Starred) and self._phan_tu_lit(e.value) is None for e in call.args)

    @staticmethod
    def _mac_dinh(fd, p):
        a = fd.args
        vt = a.posonlyargs + a.args
        lech = len(vt) - len(a.defaults)
        for i, q in enumerate(vt):
            if q.arg == p:
                return a.defaults[i - lech] if i >= lech else None
        for q, d in zip(a.kwonlyargs, a.kw_defaults):
            if q.arg == p:
                return d
        return None

    def _vi_tri_ve(self, call):
        """[(bieu thuc o vi tri CHU, {ve goc})] cua loi goi; [] neu khong phai loi goi ve. Ten trung ham noi bo ->
        theo ham noi bo (than ham quyet dinh); goc PIL .text / .multiline_text (render) | VI_TRI_CANH (--canh)."""
        uv = self._ung_vien(call)
        if uv:
            return self._vi_tri_boc(call, uv)
        f = call.func
        if self.che_do == "render":
            if isinstance(f, ast.Attribute) and f.attr in TEN_VE_PIL:
                return self._co_dinh(call, VI_TRI_PIL, f.attr)
            return []
        ten = f.id if isinstance(f, ast.Name) else (f.attr if isinstance(f, ast.Attribute) else None)
        if ten not in VI_TRI_CANH:
            return []
        if isinstance(self.cha.get(id(call), (None,))[0], ast.Expr):
            return []                                   # tao mobject roi bo (dung tran thanh mot lenh): khong ve
        return self._co_dinh(call, VI_TRI_CANH[ten], ten)

    def _co_dinh(self, call, cau_hinh, ten):
        vt, kws = cau_hinh
        ra, k = [], 0
        for e in call.args:
            if isinstance(e, ast.Starred):
                cac = self._phan_tu_lit(e.value)
                if cac is None:
                    break
            else:
                cac = [e]
            for x in cac:
                if vt == "*" or k in vt:
                    ra.append((x, {ten}))
                k += 1
        for kw in call.keywords:
            if kw.arg is not None and kw.arg in kws:
                ra.append((kw.value, {ten}))
        return ra

    def _vi_tri_boc(self, call, uv):
        """Ham / method noi bo: doi so o tham so ma than ham dua toi doi so chu (tham_ve); nhieu ung vien cung ten ->
        chi GIAO cac vi tri (moi ung vien deu ve); tham so khong truyen -> gia tri mac dinh (mot ung vien)."""
        chung, goc = None, {}
        for fd in uv:
            tv = self.tham_ve.get(id(fd))
            if not tv:
                return []
            m = self._anh_xa(fd, call, self._lech(fd, call))
            if m is None:
                return []
            cap = {}
            for p, g in tv.items():
                for e in m.get(p, ()):
                    cap.setdefault(id(e), [e, set()])[1].update(g)
            if len(uv) == 1 and not self._goi_mo(call):
                for p, g in tv.items():
                    if p in m or p[:1] == "*":
                        continue
                    d = self._mac_dinh(fd, p)
                    if d is not None:
                        cap.setdefault(id(d), [d, set()])[1].update(g)
            chung = cap if chung is None else {i: chung[i] for i in chung if i in cap}
            for i, (e, g) in cap.items():
                goc.setdefault(i, set()).update(g)
        return [(e, goc[i]) for i, (e, g) in (chung or {}).items()]

    def _tinh_tham_ve(self):
        """Diem bat dong: tham so p cua ham fd la "tham so ve" neu gia tri cua p chay NGUYEN VEN toi doi so chu cua
        mot loi goi ve song trong than fd (truc tiep, hoac qua ham noi bo khac da biet tham so ve)."""
        for _ in range(60):
            doi = False
            for call in self.goi:
                if id(call) not in self.song or self.ham_cua.get(id(call)) in (None, _LAMBDA):
                    continue
                for e, g in self._vi_tri_ve(call):
                    for nhan in self._chay(e):
                        if nhan[0] != "p":
                            continue
                        tv = self.tham_ve.setdefault(nhan[1], {}).setdefault(nhan[2], set())
                        if not g <= tv:
                            tv |= g
                            doi = True
            if not doi:
                break

    def _chung_minh(self):
        for call in self.goi:
            if not self._song_toan(call):
                continue
            for e, g in self._vi_tri_ve(call):
                for nhan in self._chay(e):
                    if nhan[0] == "c":
                        self.da_ve.setdefault(nhan[1], set()).update(g)

    def _chay(self, e, sau=0, da=None):
        """Nguon chay NGUYEN VEN toi bieu thuc e: {("c", id hang chuoi)} | {("p", id ham, ten tham so)}. Chi qua ten
        (rang buoc duy nhat chac chan), phan tu vong lap tren day hang, tham so ham, IfExp (bo nhanh chet). Moi bien
        doi (cat lat, ghep, split, format, goi ham ...) -> khong chay nguyen ven -> rong."""
        if da is None:
            da = set()
        if e is None or sau > 40 or id(e) in da:
            return set()
        da.add(id(e))
        if isinstance(e, ast.Constant):
            return {("c", id(e))} if isinstance(e.value, (str, bytes)) else set()
        if isinstance(e, ast.IfExp):
            c = self._chan_ly(e.test)
            ra = set()
            if c is not False:
                ra |= self._chay(e.body, sau + 1, da)
            if c is not True:
                ra |= self._chay(e.orelse, sau + 1, da)
            return ra
        if not isinstance(e, ast.Name):
            return set()
        g = self._giai(e)
        if g is None:
            return set()
        if g[0] == "expr":
            return self._chay(g[1], sau + 1, da)
        if g[0] == "cac":
            ra = set()
            for x in g[1]:
                ra |= self._chay(x, sau + 1, da)
            return ra
        if g[0] == "param":
            return {("p", id(g[1]), g[2])}
        if g[0] == "vararg":
            return {("p", id(g[1]), "*" + g[1].args.vararg.arg)}
        return set()

    # ------------------------------------------------------------ giai ten: rang buoc DUY NHAT chac chan
    def _giai(self, nm):
        """Ten nm (Load) -> ("expr", bieu thuc) | ("cac", [phan tu]) | ("param", ham, ten) | ("vararg", ham) |
        ("aug", AugAssign) | None (khong chac chan: gan lai, gan trong nhanh / vong, closure, global dong ...)."""
        k = id(nm)
        if k in self._m_giai:
            return self._m_giai[k]
        if k in self._dang_giai:
            return None
        self._dang_giai.add(k)
        try:
            r = self._giai_that(nm)
        finally:
            self._dang_giai.discard(k)
        self._m_giai[k] = r
        return r

    def _giai_that(self, nm):
        x, n, dau = nm.id, nm, True
        if any(x in gl for gl in self.ten_global.values()):
            return None                                 # khai global / nonlocal o dau do: co the bi gan tu xa
        if self.ham_cua.get(id(nm)) is None and (x in self._thuoc_tinh_gan or self._setattr_dong):
            return None                                 # ten cap module: co the bi gan qua thuoc tinh / setattr
        while True:
            pc = self.cha.get(id(n))
            if pc is None:
                return None
            p, f, i = pc
            if dau and isinstance(n, ast.stmt):
                dau = False
                if self._co_walrus(n, x):
                    return None
            if isinstance(p, ast.Lambda) and f == "body":
                if x in _ten_tham_so(p.args):
                    return None
            elif isinstance(p, _COMP) and f in ("elt", "key", "value"):
                rb = set()
                for g in p.generators:
                    rb |= _ten_dich(g.target)
                if x in rb:
                    g0 = p.generators[0]
                    if len(p.generators) == 1 and not g0.ifs and isinstance(g0.target, ast.Name):
                        return self._phan_tu_vong(g0.target, g0.iter, x)
                    return None
            elif isinstance(p, ast.comprehension):
                comp, _f, k = self.cha[id(p)]
                if f == "target":
                    return None
                truoc = comp.generators[:k] if f == "iter" else comp.generators[:k + 1]
                if any(x in _ten_dich(g.target) for g in truoc):
                    return None
                n = comp
                continue
            if isinstance(n, ast.stmt) and i is not None:
                for t in reversed(getattr(p, f)[:i]):
                    tg = self._tap_gan(t)
                    if x in tg or "*" in tg:
                        return self._rang_buoc(t, x)
            r = self._dau_lenh(p, f, x)
            if r is not _TIEP:
                return r
            n = p

    def _dau_lenh(self, p, f, x):
        """Da het lenh truoc trong khoi; quyet dinh tai nut cha p (truong f): tra ket qua / None / _TIEP."""
        if isinstance(p, ast.Module):
            return None                                 # khong co rang buoc truoc no trong module: khong chac
        if isinstance(p, _HAM_DN):
            if f != "body":
                return _TIEP
            a = p.args
            trong = x in self._gan_trong(p.body)
            if x in {q.arg for q in a.posonlyargs + a.args + a.kwonlyargs}:
                return None if trong else ("param", p, x)
            if (a.vararg is not None and a.vararg.arg == x) or (a.kwarg is not None and a.kwarg.arg == x) or trong:
                return None
            q = p
            while True:
                pc = self.cha.get(id(q))
                if pc is None:
                    return None
                q = pc[0]
                if isinstance(q, _HAM_DN + (ast.Lambda,)):
                    return None                         # closure: khong lan
                if isinstance(q, ast.Module):
                    return self._toan_cuc(q, x)
        if isinstance(p, ast.ClassDef):
            return None if f == "body" and x in self._gan_trong(p.body) else _TIEP
        if isinstance(p, _VONG):
            if f == "body":
                if x in _ten_dich(p.target):
                    if self._thoat_som(p.body) or x in self._gan_trong(p.body):
                        return None
                    return self._phan_tu_vong(p.target, p.iter, x)
                return None if x in self._gan_trong(p.body) else _TIEP
            if f == "orelse":
                return None if x in _ten_dich(p.target) or x in self._gan_trong(p.body) else _TIEP
            return _TIEP
        if isinstance(p, ast.While):
            return None if self._co_walrus(p.test, x) or x in self._gan_trong(p.body) else _TIEP
        if isinstance(p, ast.If):
            return None if self._co_walrus(p.test, x) else _TIEP
        if isinstance(p, (ast.With, ast.AsyncWith)):
            for it in p.items:
                if (it.optional_vars is not None and x in _ten_dich(it.optional_vars)) \
                        or self._co_walrus(it.context_expr, x):
                    return None
            return _TIEP
        if isinstance(p, ast.ExceptHandler):
            return None if p.name == x else _TIEP
        if isinstance(p, _TRY):
            if f in ("handlers", "orelse"):
                return None if x in self._gan_trong(p.body) else _TIEP
            if f == "finalbody":
                if x in self._gan_trong(p.body) or x in self._gan_trong(p.orelse) \
                        or any(x in self._gan_trong(h.body) or h.name == x for h in p.handlers):
                    return None
            return _TIEP
        if _MATCH_CASE is not None and isinstance(p, _MATCH_CASE):
            if x in self._ten_mau(p.pattern) or (p.guard is not None and self._co_walrus(p.guard, x)):
                return None
            return _TIEP
        if _MATCH is not None and isinstance(p, _MATCH):
            return None if self._co_walrus(p.subject, x) else _TIEP
        return _TIEP

    def _gan_trong(self, ds):
        r = self._m_gan.get(id(ds))
        if r is None or r[0] is not ds:
            s = set()
            for t in ds:
                s |= self._tap_gan(t)
            r = (ds, s)
            self._m_gan[id(ds)] = r
        return r[1]

    def _tap_gan(self, t):
        """Ten bi gan TRONG SCOPE cua lenh t: dich gan / for / with / except / import ("*" = import *) / global /
        nonlocal / walrus / match / def / class / AnnAssign (ke ca khong gia tri) / del. Khong vao than ham / lop /
        lambda / comprehension long (scope rieng), tru walrus trong comprehension (gan ra scope ngoai)."""
        k = id(t)
        if k in self._m_tap:
            return self._m_tap[k]
        ra, ngan = set(), [t]
        while ngan:
            n = ngan.pop()
            if n is None or isinstance(n, _BO_QUA):
                continue
            if isinstance(n, _HAM_DN):
                ra.add(n.name)
                ngan.extend(n.decorator_list + [n.args, n.returns])
                continue
            if isinstance(n, ast.ClassDef):
                ra.add(n.name)
                ngan.extend(n.decorator_list + n.bases + [kw.value for kw in n.keywords])
                continue
            if isinstance(n, ast.Lambda):
                ngan.extend(n.args.defaults + n.args.kw_defaults)
                continue
            if isinstance(n, (ast.Import, ast.ImportFrom)):
                for al in n.names:
                    ra.add("*" if al.name == "*" else (al.asname or al.name.split(".")[0]))
                continue
            if isinstance(n, (ast.Global, ast.Nonlocal)):
                ra.update(n.names)
                continue
            if isinstance(n, _COMP):
                ngan.extend((n.key, n.value) if isinstance(n, ast.DictComp) else (n.elt,))
                for g in n.generators:
                    ngan.append(g.iter)
                    ngan.extend(g.ifs)
                continue
            if isinstance(n, ast.Name):
                if isinstance(n.ctx, (ast.Store, ast.Del)):
                    ra.add(n.id)
                continue
            if isinstance(n, ast.ExceptHandler) and n.name:
                ra.add(n.name)
            if _MATCH is not None and isinstance(n, ast.pattern):
                for thu in ("name", "rest"):
                    v = getattr(n, thu, None)
                    if isinstance(v, str):
                        ra.add(v)
            ngan.extend(ast.iter_child_nodes(n))
        self._m_tap[k] = ra
        return ra

    def _rang_buoc(self, t, x):
        """Gia tri cua x sau lenh gan GAN NHAT t (cung khoi): chi Assign / AnnAssign / AugAssign ro rang."""
        if isinstance(t, ast.Assign):
            if sum(_dem_gan(d, x) for d in t.targets) != 1 or self._co_walrus(t.value):
                return None
            for d in t.targets:
                if isinstance(d, ast.Name) and d.id == x:
                    return ("expr", t.value)
                if isinstance(d, (ast.Tuple, ast.List)) and any(isinstance(z, ast.Name) and z.id == x for z in d.elts):
                    v = t.value
                    if (any(isinstance(z, ast.Starred) for z in d.elts) or not isinstance(v, (ast.Tuple, ast.List))
                            or len(v.elts) != len(d.elts) or any(isinstance(z, ast.Starred) for z in v.elts)):
                        return None
                    for z, w in zip(d.elts, v.elts):
                        if isinstance(z, ast.Name) and z.id == x:
                            return ("expr", w)
            return None
        if isinstance(t, ast.AnnAssign):
            if t.value is not None and isinstance(t.target, ast.Name) and t.target.id == x:
                return ("expr", t.value)
            return None
        if isinstance(t, ast.AugAssign):
            return ("aug", t) if isinstance(t.target, ast.Name) and t.target.id == x else None
        return None

    def _toan_cuc(self, mod, x):
        """Ten module doc tu trong ham: chi khi duoc gan DUNG MOT lenh cap module (Assign / AnnAssign don), khong ham
        nao khai global x, khong import * sau do."""
        if any(x in gl for gl in self.ten_global.values()) or x in self._thuoc_tinh_gan or self._setattr_dong:
            return None
        cac = [i for i, t in enumerate(mod.body) if x in self._tap_gan(t)]
        if len(cac) != 1:
            return None
        i = cac[0]
        if any("*" in self._tap_gan(t) for t in mod.body[i + 1:]):
            return None
        t = mod.body[i]
        if isinstance(t, ast.Assign) and len(t.targets) == 1 and isinstance(t.targets[0], ast.Name) \
                and not self._co_walrus(t.value):
            return ("expr", t.value)
        if isinstance(t, ast.AnnAssign) and t.value is not None and isinstance(t.target, ast.Name):
            return ("expr", t.value)
        return None

    def _la_enumerate(self, it):
        return (isinstance(it, ast.Call) and isinstance(it.func, ast.Name) and it.func.id == "enumerate"
                and len(it.args) == 1 and not isinstance(it.args[0], ast.Starred)
                and all(kw.arg == "start" for kw in it.keywords) and "enumerate" not in self.ham_theo_ten)

    def _vararg_cua(self, it):
        if not isinstance(it, ast.Name):
            return None
        fd = self.ham_cua.get(id(it))
        if fd is None or fd is _LAMBDA:
            return None
        a = fd.args
        if a.vararg is None or a.vararg.arg != it.id or it.id in self._gan_trong(fd.body):
            return None
        return fd

    def _phan_tu_vong(self, target, it, x):
        """Bien vong lap x (dich target, day it) -> ("cac", [phan tu viet san]) | ("vararg", ham) | None."""
        if isinstance(target, ast.Name):
            if self._la_enumerate(it):
                return None
            fd = self._vararg_cua(it)
            if fd is not None:
                return ("vararg", fd)
            lit = self._phan_tu_lit(it)
            return None if lit is None else ("cac", lit)
        if not isinstance(target, (ast.Tuple, ast.List)) or any(isinstance(z, ast.Starred) for z in target.elts):
            return None
        j = [k for k, z in enumerate(target.elts) if isinstance(z, ast.Name) and z.id == x]
        if len(j) != 1 or _dem_gan(target, x) != 1:
            return None
        j, k = j[0], len(target.elts)
        if k == 2 and self._la_enumerate(it):
            if j == 0:
                return ("cac", [])                      # chi so enumerate: so nguyen, khong phai chu
            fd = self._vararg_cua(it.args[0])
            if fd is not None:
                return ("vararg", fd)
            lit = self._phan_tu_lit(it.args[0])
            return None if lit is None else ("cac", lit)
        lit = self._phan_tu_lit(it)
        if lit is None:
            return None
        ra = []
        for el in lit:
            if not isinstance(el, (ast.Tuple, ast.List)) or len(el.elts) != k \
                    or any(isinstance(z, ast.Starred) for z in el.elts):
                return None
            ra.append(el.elts[j])
        return ("cac", ra)

    def _phan_tu_lit(self, e, sau=0):
        """Phan tu cua day viet san (Tuple / List / Set; ten -> chi Tuple co rang buoc duy nhat chac chan)."""
        if sau > 10:
            return None
        if isinstance(e, ast.Name):
            g = self._giai(e)
            if g is None or g[0] != "expr" or not isinstance(g[1], ast.Tuple):
                return None
            e = g[1]
        if not isinstance(e, (ast.Tuple, ast.List, ast.Set)):
            return None
        ra = []
        for z in e.elts:
            if isinstance(z, ast.Starred):
                con = self._phan_tu_lit(z.value, sau + 1)
                if con is None:
                    return None
                ra.extend(con)
            else:
                ra.append(z)
        return ra

    def _thoat_som(self, ds):
        """Than vong lap co the bo qua phan tu: return / raise / exit() / break / continue cua CHINH vong nay."""
        ngan = [(s, 0) for s in ds]
        while ngan:
            n, vong = ngan.pop()
            if isinstance(n, (ast.Return, ast.Raise)):
                return True
            if isinstance(n, ast.Expr) and self._la_thoat(n.value):
                return True
            if isinstance(n, (ast.Break, ast.Continue)) and vong == 0:
                return True
            if isinstance(n, _HAM_DN + (ast.ClassDef, ast.Lambda)):
                continue
            for f, v in ast.iter_fields(n):
                for c in (v if isinstance(v, list) else [v]):
                    if isinstance(c, ast.AST) and not isinstance(c, _BO_QUA):
                        ngan.append((c, vong + (1 if isinstance(n, _VONG + (ast.While,)) and f == "body" else 0)))
        return False

    @staticmethod
    def _co_walrus(node, x=None):
        if node is None:
            return False
        return any(isinstance(n, ast.NamedExpr) and (x is None or x in _ten_dich(n.target)) for n in ast.walk(node))

    @staticmethod
    def _ten_mau(pat):
        ra = set()
        for n in ast.walk(pat):
            for thu in ("name", "rest"):
                v = getattr(n, thu, None)
                if isinstance(v, str):
                    ra.add(v)
        return ra

    # ------------------------------------------------------------ (6) GAP hang chat / long + ket luan 7-31 / 7-32
    def _lap_ten(self, tree):
        """Chi muc ten cho GAP CHAT (moi tep): _ten_khac = ten bi gan / xoa / tham so / def / class / except / global /
        nonlocal / match (che builtin); _nhap {ten: {(module, ten goc | None)}} ("*" = import *); _nhap_con = module
        con da import (import a.b); _thuoc_tinh_gan = thuoc tinh bi gan / xoa + setattr / delattr ten hang;
        _setattr_dong = setattr / delattr ten dong hoac dung lam gia tri / __setattr__."""
        for n in ast.walk(tree):
            if isinstance(n, ast.Name):
                if isinstance(n.ctx, (ast.Store, ast.Del)):
                    self._ten_khac.add(n.id)
                elif n.id in ("setattr", "delattr"):
                    p, f, i = self.cha.get(id(n), (None, None, None))
                    if (isinstance(p, ast.Call) and f == "func" and len(p.args) >= 2
                            and not any(isinstance(z, ast.Starred) for z in p.args[:2])
                            and isinstance(p.args[1], ast.Constant) and isinstance(p.args[1].value, str)):
                        self._thuoc_tinh_gan.add(p.args[1].value)
                    else:
                        self._setattr_dong = True
            elif isinstance(n, ast.arg):
                self._ten_khac.add(n.arg)
            elif isinstance(n, _HAM_DN + (ast.ClassDef,)):
                self._ten_khac.add(n.name)
            elif isinstance(n, ast.ExceptHandler):
                if n.name:
                    self._ten_khac.add(n.name)
            elif isinstance(n, (ast.Global, ast.Nonlocal)):
                self._ten_khac.update(n.names)
            elif isinstance(n, ast.Import):
                for al in n.names:
                    if al.asname:
                        self._nhap.setdefault(al.asname, set()).add((al.name, None))
                    else:
                        goc = al.name.split(".")[0]
                        self._nhap.setdefault(goc, set()).add((goc, None))
                        self._nhap_con.add(al.name)
            elif isinstance(n, ast.ImportFrom):
                m = "." * (n.level or 0) + (n.module or "")
                for al in n.names:
                    self._nhap.setdefault("*" if al.name == "*" else (al.asname or al.name), set()).add((m, al.name))
            elif isinstance(n, ast.Attribute):
                if isinstance(n.ctx, (ast.Store, ast.Del)):
                    self._thuoc_tinh_gan.add(n.attr)
                elif n.attr in ("__setattr__", "__delattr__", "setattr", "delattr"):
                    self._setattr_dong = True
            elif _MATCH is not None and isinstance(n, ast.pattern):
                for thu in ("name", "rest"):
                    v = getattr(n, thu, None)
                    if isinstance(v, str):
                        self._ten_khac.add(v)

    def _dung_san(self, ten):
        """GAP CHAT: ten builtin CHAC chua bi che / gan lai (khong gan / tham so / def / class / import / thuoc tinh
        trung ten o bat ky tep nao, khong import *, khong setattr dong)."""
        return not (ten in self._ten_khac or ten in self._nhap or ten in self.ham_theo_ten or ten in self.ten_lop
                    or ten in self._thuoc_tinh_gan or "*" in self._nhap or self._setattr_dong)

    def _la_ham_mod(self, f, mod, ten, chac=True):
        """Bieu thuc ham f la mod.ten: ten tu `from mod import ten [as x]`, hoac chuoi thuoc tinh tu ten module
        (`import mod` / `import mod as x` / `import goc.con`). chac: them dieu kien khong bi che / gan lai / setattr /
        import *, va module con phai duoc import o dau do."""
        la_ten = isinstance(f, ast.Name)
        if la_ten:
            goc, sau_goc = f.id, []
        else:
            cham = []
            while isinstance(f, ast.Attribute):
                cham.append(f.attr)
                f = f.value
            if not isinstance(f, ast.Name) or not cham or cham[0] != ten:
                return False
            goc, sau_goc = f.id, cham[:0:-1]
        if chac and ("*" in self._nhap or self._setattr_dong or ten in self._thuoc_tinh_gan
                     or goc in self._ten_khac or goc in self.ham_theo_ten or goc in self.ten_lop
                     or goc in self._thuoc_tinh_gan or any(c in self._thuoc_tinh_gan for c in sau_goc)):
            return False
        nh = self._nhap.get(goc, set())
        if la_ten:
            return nh == {(mod, ten)} if chac else (mod, ten) in nh
        rb = {m if t is None else m + "." + t for m, t in nh}
        if not rb or (chac and len(rb) != 1):
            return False
        if mod not in {b + "".join("." + c for c in sau_goc) for b in rb}:
            return False
        if chac and sau_goc:
            return any(c == mod or c.startswith(mod + ".") for c in self._nhap_con)
        return True

    def _ten_giai_ma(self, f):
        """Ten ham giai ma (base64 / binascii / urllib.parse) cua bieu thuc ham f: theo ten thuoc tinh / ten, hoac bi
        danh `from mod import ten as x`; None neu khong phai."""
        if isinstance(f, ast.Attribute):
            return f.attr if f.attr in _GIAI_MA else None
        if isinstance(f, ast.Name):
            if f.id in _GIAI_MA:
                return f.id
            nh = self._nhap.get(f.id, ())
            if len(nh) == 1:
                m, t = next(iter(nh))
                if t in _GIAI_MA and _GIAI_MA_MOD[t] == m:
                    return t
        return None

    def _gap(self, e, chac=False, sau=0):
        """GAP gia tri hang cua bieu thuc / AugAssign. chac=True (GAP CHAT, cho dieu kien cat nhanh): chi tin rang buoc
        chac chan, builtin khong bi che, khong tin day bien doi duoc gan qua ten -> duoc tra _KG oan nhung KHONG BAO
        GIO tra gia tri sai. chac=False (GAP LONG, chi de NGHI 7-32): tin theo ten. Co tran do dai / do sau."""
        if e is None or sau > 60:
            return _KG
        k = (id(e), chac)
        if k in self._m_gap:
            return self._m_gap[k]
        if k in self._dang_gap:
            return _KG
        self._dang_gap.add(k)
        try:
            v = self._gap_that(e, chac, sau)
        except Exception:
            v = _KG
        finally:
            self._dang_gap.discard(k)
        if isinstance(v, (str, bytes, bytearray, tuple, list)) and len(v) > _GIOI:
            v = _KG
        self._m_gap[k] = v
        return v

    def _gap_that(self, e, chac, sau):
        def g(z):
            return self._gap(z, chac, sau + 1)
        if isinstance(e, ast.Constant):
            return e.value
        if isinstance(e, ast.JoinedStr):
            ra = []
            for z in e.values:
                v = g(z)
                if not isinstance(v, str):
                    return _KG
                ra.append(v)
            return "".join(ra)
        if isinstance(e, ast.FormattedValue):
            v = g(e.value)
            if v is _KG or _kich_thuoc(v) > _GIOI:
                return _KG
            if e.conversion == 115:
                v = str(v)
            elif e.conversion == 114:
                v = repr(v)
            elif e.conversion == 97:
                v = ascii(v)
            spec = ""
            if e.format_spec is not None:
                spec = g(e.format_spec)
                if not isinstance(spec, str) or _SO_DAI_RE.search(spec) or "{" in spec:
                    return _KG
            return format(v, spec)
        if isinstance(e, (ast.Tuple, ast.List, ast.Set)):
            if chac and isinstance(e, ast.Set):
                return _KG                              # thu tu set theo hash: khong chac khi in / ghep / lap
            ra = []
            for z in e.elts:
                if isinstance(z, ast.Starred):
                    v = g(z.value)
                    if not isinstance(v, (tuple, list, str, bytes, dict)):
                        return _KG
                    ra.extend(v)
                else:
                    v = g(z)
                    if v is _KG:
                        return _KG
                    ra.append(v)
                if len(ra) > _GIOI:
                    return _KG
            if isinstance(e, ast.Tuple):
                return tuple(ra)
            return ra if isinstance(e, ast.List) else set(ra)
        if isinstance(e, ast.Dict):
            ra = {}
            for kk, vv in zip(e.keys, e.values):
                v = g(vv)
                if v is _KG:
                    return _KG
                if kk is None:
                    if not isinstance(v, dict):
                        return _KG
                    ra.update(v)
                else:
                    k2 = g(kk)
                    if k2 is _KG:
                        return _KG
                    ra[k2] = v
            return ra
        if isinstance(e, ast.Name):
            if chac and (e.id in self._thuoc_tinh_gan or self._setattr_dong):
                return _KG
            r = self._giai(e)
            if r is None or r[0] not in ("expr", "aug"):
                return _KG
            v = g(r[1])
            if v is _KG or (chac and _bien_doi_duoc(v)):
                return _KG
            return v
        if isinstance(e, ast.AugAssign):
            return self._gap_aug_that(e, chac, sau)
        if isinstance(e, ast.UnaryOp):
            v = g(e.operand)
            if v is _KG:
                return _KG
            if isinstance(e.op, ast.Not):
                return not v
            if isinstance(e.op, ast.USub):
                return -v
            if isinstance(e.op, ast.UAdd):
                return +v
            if isinstance(e.op, ast.Invert):
                return ~v
            return _KG
        if isinstance(e, ast.BinOp):
            a = g(e.left)
            if a is _KG:
                return _KG
            b = g(e.right)
            return _KG if b is _KG else _phep(e.op, a, b)
        if isinstance(e, ast.BoolOp):
            v = _KG
            for z in e.values:
                v = g(z)
                if v is _KG:
                    return _KG
                if bool(v) == isinstance(e.op, ast.Or):
                    return v
            return v
        if isinstance(e, ast.Compare):
            a = g(e.left)
            if a is _KG:
                return _KG
            for op, z in zip(e.ops, e.comparators):
                b = g(z)
                if b is _KG:
                    return _KG
                if isinstance(op, (ast.Is, ast.IsNot)):
                    if not (a is None or b is None or isinstance(a, bool) or isinstance(b, bool)):
                        return _KG
                    r = (a is b) if isinstance(op, ast.Is) else (a is not b)
                else:
                    f = _SO_SANH.get(type(op))
                    if f is None:
                        return _KG
                    r = f(a, b)
                if not r:
                    return False
                a = b
            return True
        if isinstance(e, ast.IfExp):
            c = g(e.test)
            if c is _KG:
                return _KG
            return g(e.body) if c else g(e.orelse)
        if isinstance(e, ast.Subscript):
            v = g(e.value)
            if not isinstance(v, (str, bytes, bytearray, tuple, list, dict)):
                return _KG
            s = e.slice
            if isinstance(s, ast.Slice):
                cat = [None if z is None else g(z) for z in (s.lower, s.upper, s.step)]
                if any(z is _KG for z in cat):
                    return _KG
                return v[slice(*cat)]
            k = g(s)
            return _KG if k is _KG else v[k]
        if isinstance(e, ast.NamedExpr):
            return g(e.value)
        if isinstance(e, ast.Call):
            return self._gap_goi(e, chac, sau)
        return _KG

    def _gap_doi_so(self, e, chac, sau):
        ds, kw = [], {}
        for z in e.args:
            v = self._gap(z, chac, sau + 1)
            if v is _KG:
                return None, None
            ds.append(v)
        for k in e.keywords:
            v = self._gap(k.value, chac, sau + 1)
            if v is _KG:
                return None, None
            kw[k.arg] = v
        return ds, kw

    def _gap_goi(self, e, chac, sau):
        """GAP loi goi: phuong thuc chuoi / bytes, bytes.fromhex / str.maketrans, ham giai ma (base64 / binascii /
        urllib.parse / codecs), builtin (_HAM_GAP / format / bytes / bytearray / str(b, ma) / map) - co tran; GAP
        CHAT: builtin phai _dung_san, ham giai ma phai _la_ham_mod."""
        f = e.func
        if any(isinstance(z, ast.Starred) for z in e.args) or any(k.arg is None for k in e.keywords):
            return _KG
        if isinstance(f, ast.Name) and f.id == "map":
            return self._gap_map(e, chac, sau)
        ds, kw = self._gap_doi_so(e, chac, sau)
        if ds is None:
            return _KG
        if isinstance(f, ast.Attribute):
            ten = f.attr
            if ten in _PHUONG_THUC_CHUOI:
                v = self._gap(f.value, chac, sau + 1)
                if isinstance(v, (str, bytes, bytearray)):
                    return getattr(v, ten)(*ds, **kw) if _phuong_thuc_an_toan(v, ten, ds, kw) else _KG
            if ten in ("fromhex", "maketrans") and isinstance(f.value, ast.Name) \
                    and f.value.id in ("str", "bytes", "bytearray") and (not chac or self._dung_san(f.value.id)):
                kieu = {"str": str, "bytes": bytes, "bytearray": bytearray}[f.value.id]
                return getattr(kieu, ten)(*ds, **kw) if hasattr(kieu, ten) else _KG
            if ten in ("decode", "encode") and (self._la_ham_mod(f, "codecs", ten, chac) or (
                    not chac and isinstance(f.value, ast.Name) and f.value.id == "codecs")):
                mh = ds[1] if len(ds) > 1 else kw.get("encoding", "utf-8")
                if not ds or len(ds) > 3 or not isinstance(mh, str) or mh.lower() not in _MA_HOA_OK:
                    return _KG
                return getattr(_codecs, ten)(*ds, **kw)
        tgm = self._ten_giai_ma(f)
        if tgm is not None:
            if chac and not self._la_ham_mod(f, _GIAI_MA_MOD[tgm], tgm):
                return _KG
            return _GIAI_MA[tgm](*ds, **kw)
        if not isinstance(f, ast.Name):
            return _KG
        ten = f.id
        if chac and not self._dung_san(ten):
            return _KG
        if ten in ("str", "repr", "ascii", "format") and ds and _kich_thuoc(ds[0]) > _GIOI:
            return _KG
        if ten == "str" and (len(ds) > 1 or "encoding" in kw or "errors" in kw):
            mh = ds[1] if len(ds) > 1 else kw.get("encoding", "utf-8")
            if not isinstance(mh, str) or mh.lower() not in _MA_HOA_OK:
                return _KG
            return str(*ds, **kw)
        if ten == "format":
            spec = ds[1] if len(ds) > 1 else ""
            if not isinstance(spec, str) or _SO_DAI_RE.search(spec) or "{" in spec:
                return _KG
            return format(*ds, **kw)
        if ten in ("bytes", "bytearray"):
            if ds and isinstance(ds[0], int) and ds[0] > _GIOI:
                return _KG
            mh = ds[1] if len(ds) > 1 else kw.get("encoding")
            if mh is not None and (not isinstance(mh, str) or mh.lower() not in _MA_HOA_OK):
                return _KG
            return (bytes if ten == "bytes" else bytearray)(*ds, **kw)
        if ten in _HAM_GAP:
            return _HAM_GAP[ten](*ds, **kw)
        return _KG

    def _gap_map(self, e, chac, sau):
        """map(f, day) voi f = chr / str / ord. GAP CHAT chi khi map CHAC bi tieu thu ngay mot lan: doi so duy nhat
        cua x.join / list / tuple / sorted (map la iterator)."""
        if len(e.args) != 2 or e.keywords or not isinstance(e.args[0], ast.Name) or e.args[0].id not in _HAM_MAP:
            return _KG
        if chac:
            if not (self._dung_san("map") and self._dung_san(e.args[0].id)):
                return _KG
            p, fl, i = self.cha.get(id(e), (None, None, None))
            if not (isinstance(p, ast.Call) and fl == "args" and len(p.args) == 1 and not p.keywords and (
                    (isinstance(p.func, ast.Attribute) and p.func.attr == "join")
                    or (isinstance(p.func, ast.Name) and p.func.id in ("list", "tuple", "sorted")))):
                return _KG
        v = self._gap(e.args[1], chac, sau + 1)
        if not isinstance(v, (str, bytes, tuple, list)):
            return _KG
        return [_HAM_MAP[e.args[0].id](z) for z in v]

    def _gap_aug_that(self, t, chac, sau):
        """Gia tri cua ten sau `x op= v`: gia tri rang buoc TRUOC lenh (qua _giai dich) op v."""
        if not isinstance(t.target, ast.Name):
            return _KG
        r = self._giai(t.target)
        if r is None or r[0] not in ("expr", "aug"):
            return _KG
        a = self._gap(r[1], chac, sau + 1)
        if a is _KG or (chac and _bien_doi_duoc(a)):
            return _KG
        b = self._gap(t.value, chac, sau + 1)
        return _KG if b is _KG else _phep(t.op, a, b)

    def _la_ghep(self, n):
        """Nut GHEP chu luc chay (7-32): f-string; + / % / * (ke ca +=); cat lat / chi so; phuong thuc chuoi; ham giai
        ma (ke ca bi danh); bytes.fromhex / str.maketrans; str / chr / format / repr / ascii / bytes / bytearray / map."""
        if isinstance(n, (ast.JoinedStr, ast.Subscript)):
            return True
        if isinstance(n, (ast.BinOp, ast.AugAssign)):
            return isinstance(n.op, (ast.Add, ast.Mod, ast.Mult))
        if isinstance(n, ast.Call):
            f = n.func
            if isinstance(f, ast.Attribute):
                return f.attr in _PHUONG_THUC_CHUOI or f.attr in _GIAI_MA or f.attr in ("fromhex", "maketrans")
            if isinstance(f, ast.Name):
                return f.id in _HAM_GHEP or self._ten_giai_ma(f) is not None
        return False

    def _la_dong(self, n):
        """Ma dong / doc khung -> ten (7-32 ma_dong), None neu khong: ten _HAM_DONG / _THUOC_TINH_DONG; thuoc tinh
        _THUOC_TINH_DONG + exec / eval / __import__ (KHONG .compile: re.compile hop le); getattr ten hang thuoc cac
        nhom do, hoac ten thuoc tinh KHONG gap duoc (getattr dong)."""
        if isinstance(n, ast.Name) and isinstance(n.ctx, ast.Load) \
                and (n.id in _HAM_DONG or n.id in _THUOC_TINH_DONG):
            return n.id
        if isinstance(n, ast.Attribute) and (n.attr in _THUOC_TINH_DONG or n.attr in ("exec", "eval", "__import__")):
            return n.attr
        if isinstance(n, ast.Call) and isinstance(n.func, ast.Name) and n.func.id == "getattr" and len(n.args) >= 2:
            t = n.args[1]
            v = t.value if isinstance(t, ast.Constant) else self._gap(t, False)
            if not isinstance(v, str):
                return "getattr"
            if v in _HAM_DONG or v in _THUOC_TINH_DONG:
                return v
        return None

    def _ghep_nghi_doi(self, n):
        """Nut ghep co the tao DOI luc chay: GAP LONG ra DOI -> co; GAP CHAT duoc (gia tri chac, khong DOI) -> khong;
        cat lat / chi so -> chi khi GAP LONG ra DOI; con lai: manh hang chay toi nut co MAM DOI."""
        v = self._gap(n, False)
        if v is not _KG and any(DOI_RAW_RE.search(s) for s in _chuoi_trong(v)):
            return True
        if self._gap(n, True) is not _KG or isinstance(n, ast.Subscript):
            return False
        return any(_khop_mam(s) for s in self._manh(n))

    def _manh(self, n):
        """Manh hang chuoi (bytes doc latin-1; mau % / {} them phan co dinh) co the chay toi nut n qua ten / tham so /
        thuoc tinh / gia tri tra ve cua ham noi bo (tran 2000 nut, sau 30; khong vao lambda; bo loi goi chac khong
        tra chu _KHONG_CHU) - chi de NGHI 7-32, khong chung minh."""
        k = id(n)
        if k in self._m_manh:
            return self._m_manh[k]
        ra, da, ngan = [], set(), [(n, 0)]
        while ngan and len(da) < 2000:
            z, sau = ngan.pop()
            if z is None or isinstance(z, _BO_QUA) or id(z) in da or sau > 30:
                continue
            da.add(id(z))
            if isinstance(z, ast.Constant):
                if isinstance(z.value, (str, bytes)):
                    s = z.value if isinstance(z.value, str) else z.value.decode("latin-1")
                    ra.append(s)
                    if "%" in s:
                        ra.extend(_tach_mau_phan_tram(s))
                    if "{" in s:
                        ra.extend(_tach_mau_ngoac(s))
                continue
            if isinstance(z, ast.Lambda):
                continue
            if isinstance(z, ast.Name):
                con = self._nguon_ten(z)
            elif isinstance(z, ast.Attribute):
                con = [z.value] + self._chi_muc_thuoc().get(z.attr, [])[:50]
            elif isinstance(z, ast.Call):
                f = z.func
                ten = f.id if isinstance(f, ast.Name) else (f.attr if isinstance(f, ast.Attribute) else None)
                if ten in _KHONG_CHU:
                    continue
                con = [f] + list(z.args) + [kw.value for kw in z.keywords]
                for fd in self._ung_vien(z):
                    con.extend(self._tra_ve(fd))
            elif isinstance(z, ast.Subscript):
                con = [z.value]
            else:
                con = list(ast.iter_child_nodes(z))
            ngan.extend((c, sau + 1) for c in con)
        self._m_manh[k] = ra
        return ra

    def _nguon_ten(self, nm):
        """Bieu thuc nguon cua ten nm: rang buoc chac (_giai) hoac, khi khong giai duoc, chi muc may-alias theo scope
        gan nhat co gan ten (LEGB; ten global / nonlocal / trong lambda -> moi scope) + doi so neu la tham so."""
        g = self._giai(nm)
        if g is not None:
            if g[0] == "expr":
                return [g[1]]
            if g[0] == "cac":
                return list(g[1])
            if g[0] == "aug":
                return [g[1].value, g[1].target]
            if g[0] == "param":
                return self._doi_so_tham_so(g[1], g[2])
            if g[0] == "vararg":
                return self._doi_so_tham_so(g[1], "*" + g[1].args.vararg.arg)
            return []
        nc = self._nguon_comp(nm)
        if nc is not None:
            return nc
        ds = self._chi_muc_ten().get(nm.id, [])
        sc = self.ham_cua.get(id(nm))
        if sc is not _LAMBDA and not any(nm.id in gl for gl in self.ten_global.values()):
            tren, s = [sc], sc
            while s is not None:
                s = self.ham_cua.get(id(s))
                if s is _LAMBDA:
                    tren = None
                    break
                tren.append(s)
            if tren is not None:
                chon = []
                for s in tren:
                    chon = [(s2, v) for s2, v in ds if s2 is s]
                    if chon:
                        break
                ds = chon
        ra = [v for s2, v in ds][:50]
        if sc is not None and sc is not _LAMBDA and nm.id in _ten_tham_so(sc.args):
            ra.extend(self._doi_so_tham_so(sc, nm.id))
        return ra

    def _nguon_comp(self, nm):
        """Ten nm duoc rang buoc boi comprehension bao quanh (scope rieng, Python 3): [day lap cua moi generator co dich
        chua nm]; None neu nm thuoc scope ngoai (ham / lambda / lop / module)."""
        x, n = nm.id, nm
        while True:
            pc = self.cha.get(id(n))
            if pc is None:
                return None
            p, f, i = pc
            if isinstance(p, _HAM_DN + (ast.Lambda, ast.ClassDef, ast.Module)):
                return None
            gs = ()
            if isinstance(p, _COMP) and f in ("elt", "key", "value"):
                gs = p.generators
            elif isinstance(p, ast.comprehension):
                comp, _f, k = self.cha[id(p)]
                gs = comp.generators[:k] if f == "iter" else comp.generators[:k + 1]
                p = comp
            ra = [g.iter for g in gs if x in _ten_dich(g.target)]
            if ra:
                return ra
            n = p

    def _doi_so_tham_so(self, fd, p):
        """Bieu thuc co the vao tham so p ("*ten" = vararg) cua ham fd: doi so khop o moi loi goi (khong khop chu ky /
        goi mo -> moi doi so) + gia tri mac dinh."""
        ra = []
        for call in self._goi_toi(fd):
            m = None if self._goi_mo(call) else self._anh_xa(fd, call, self._lech(fd, call))
            if m is None:
                ra.extend(call.args)
                ra.extend(kw.value for kw in call.keywords)
            else:
                ra.extend(m.get(p, ()))
        if p[:1] != "*":
            d = self._mac_dinh(fd, p)
            if d is not None:
                ra.append(d)
        return ra

    def _chi_muc_ten(self):
        """Chi muc may-alias: ten -> [(scope, bieu thuc tung gan vao ten)]: gan / gan kieu / gan tang / walrus, dich
        for -> day lap (for i, x in enumerate(d): i khong nguon chu, x -> d), with ... as -> context. Dich
        comprehension KHONG vao chi muc (scope rieng, Python 3 - ten trong no do _nguon_comp giai)."""
        if self._m_ten is None:
            self._m_ten = m = {}
            for base, tree, doc in self.cay:
                for n in ast.walk(tree):
                    cap = []
                    if isinstance(n, ast.Assign):
                        cap = [(t, n.value) for t in n.targets]
                    elif isinstance(n, (ast.AnnAssign, ast.AugAssign, ast.NamedExpr)) and n.value is not None:
                        cap = [(n.target, n.value)]
                    elif isinstance(n, _VONG):
                        t, it = n.target, n.iter
                        if isinstance(t, (ast.Tuple, ast.List)) and len(t.elts) == 2 and self._la_enumerate(it) \
                                and self._dung_san("enumerate"):
                            cap = [(t.elts[1], it.args[0])]
                        else:
                            cap = [(t, it)]
                    elif isinstance(n, ast.withitem) and n.optional_vars is not None:
                        cap = [(n.optional_vars, n.context_expr)]
                    for t, v in cap:
                        sc = self.ham_cua.get(id(t))
                        for x in _ten_dich(t):
                            m.setdefault(x, []).append((sc, v))
        return self._m_ten

    def _chi_muc_thuoc(self):
        """Chi muc thuoc tinh: ten thuoc tinh -> [bieu thuc gan vao]: x.a = v / x.a += v / setattr(x, "a", v)."""
        if self._m_thuoc is None:
            self._m_thuoc = m = {}
            for base, tree, doc in self.cay:
                for n in ast.walk(tree):
                    if isinstance(n, (ast.Assign, ast.AnnAssign, ast.AugAssign)) and n.value is not None:
                        for t in (n.targets if isinstance(n, ast.Assign) else [n.target]):
                            for z in ast.walk(t):
                                if isinstance(z, ast.Attribute) and isinstance(z.ctx, ast.Store):
                                    m.setdefault(z.attr, []).append(n.value)
                    elif (isinstance(n, ast.Call) and isinstance(n.func, ast.Name) and n.func.id == "setattr"
                          and len(n.args) == 3 and isinstance(n.args[1], ast.Constant)
                          and isinstance(n.args[1].value, str)):
                        m.setdefault(n.args[1].value, []).append(n.args[2])
        return self._m_thuoc

    def _tra_ve(self, fd):
        """Bieu thuc return / yield / yield from trong than ham fd (khong vao def / class / lambda long)."""
        ra = self._m_tra.get(id(fd))
        if ra is None:
            ra, ngan = [], list(fd.body)
            while ngan:
                z = ngan.pop()
                if isinstance(z, _HAM_DN + (ast.ClassDef, ast.Lambda)):
                    continue
                if isinstance(z, (ast.Return, ast.Yield, ast.YieldFrom)) and z.value is not None:
                    ra.append(z.value)
                ngan.extend(c for c in ast.iter_child_nodes(z) if not isinstance(c, _BO_QUA))
            self._m_tra[id(fd)] = ra
        return ra

    def _bao(self, msg):
        if msg not in self._da_bao:
            self._da_bao.add(msg)
            self.loi.append(msg)

    def _ket_luan(self):
        """(6) 7-32: ma dong; nut GHEP ma GAP LONG ra DOI hoac manh hang chay toi no co MAM DOI (xet CA nhanh chet).
        7-31 (theo DOI): DOI cua hang chuoi / bytes ngoai docstring khong co hang nao CHUNG MINH ve. ra[doi] = hang
        chung minh ve dau tien (thu tu tep nguon, dong); goc[doi] = ten ve goc."""
        cho = []
        for base, tree, doc in self.cay:
            nut = sorted((n for n in ast.walk(tree) if hasattr(n, "lineno")), key=lambda n: (n.lineno, n.col_offset))
            for n in nut:
                ma = self._la_dong(n)
                if ma is not None:
                    self._bao("chu_ghep_luc_chay_nghi_co_doi_khong_suy_ra_khop:%s:%d(ma_dong:%s)"
                              % (base, n.lineno, ma))
                elif self._la_ghep(n) and self._ghep_nghi_doi(n):
                    self._bao("chu_ghep_luc_chay_nghi_co_doi_khong_suy_ra_khop:%s:%d" % (base, n.lineno))
                if isinstance(n, ast.Constant) and isinstance(n.value, (str, bytes)) and id(n) not in doc:
                    s = n.value if isinstance(n.value, str) else n.value.decode("latin-1")
                    for m in DOI_RAW_RE.finditer(s):
                        d0 = m.group(0).rstrip(".,;")
                        if id(n) in self.da_ve:
                            self.ra.setdefault(d0, "%s:%d" % (base, n.lineno))
                            self.goc.setdefault(d0, set()).update(self.da_ve[id(n)])
                        else:
                            cho.append((d0, base, n.lineno))
        for d0, base, dong in cho:
            if d0 not in self.ra:
                self._bao("chu_co_doi_khong_chung_minh_duoc_ve:%s(%s:%d)" % (d0, base, dong))


def _kich_thuoc(v, sau=0):
    """Uoc do dai khi in gia tri (str / repr / format / %) - chong no bo nho voi day long nhau / so lon."""
    if isinstance(v, (str, bytes, bytearray)):
        return len(v) + 3
    if v is None or isinstance(v, (bool, float)):
        return 32
    if isinstance(v, int):
        return v.bit_length() // 3 + 2
    if isinstance(v, (tuple, list, set, frozenset, dict)):
        if sau > 20:
            return _GIOI + 1
        t = 2
        for z in (v.items() if isinstance(v, dict) else v):
            t += _kich_thuoc(z, sau + 1) + 2
            if t > _GIOI:
                break
        return t
    return 64


def _bien_doi_duoc(v, sau=0):
    """Gia tri co the bi sua TAI CHO sau khi gan ten (list / dict / set / bytearray, ke ca nam trong tuple)."""
    if isinstance(v, (list, dict, set, bytearray)):
        return True
    if isinstance(v, tuple):
        return sau > 20 or any(_bien_doi_duoc(z, sau + 1) for z in v)
    return False


def _phep(op, a, b):
    """Phep hai ngoi khi GAP, co tran chong no bo nho / CPU (+ * % ** << tren chuoi / day / so lon)."""
    day = (str, bytes, bytearray, tuple, list)
    if isinstance(op, ast.Add):
        if isinstance(a, day) and isinstance(b, day) and len(a) + len(b) > _GIOI:
            return _KG
        return a + b
    if isinstance(op, ast.Mult):
        for x, y in ((a, b), (b, a)):
            if isinstance(x, day) and isinstance(y, int) and len(x) * max(y, 0) > _GIOI:
                return _KG
        if isinstance(a, int) and isinstance(b, int) and a.bit_length() + b.bit_length() > 10000:
            return _KG
        return a * b
    if isinstance(op, ast.Mod):
        if isinstance(a, (str, bytes, bytearray)):
            s = a if isinstance(a, str) else bytes(a).decode("latin-1")
            if not _mau_an_toan(s, "%") or _kich_thuoc(b) > _GIOI:
                return _KG
        return a % b
    if isinstance(op, ast.Pow):
        if not (isinstance(a, (int, float)) and isinstance(b, (int, float))) or abs(b) > 256 \
                or (isinstance(a, int) and a.bit_length() * abs(b) > 100000):
            return _KG
        return a ** b
    if isinstance(op, ast.LShift):
        if not (isinstance(a, int) and isinstance(b, int)) or b > 4096 or a.bit_length() + b > 100000:
            return _KG
        return a << b
    f = _PHEP.get(type(op))
    return _KG if f is None else f(a, b)


def _phuong_thuc_an_toan(v, ten, ds, kw):
    """Phuong thuc chuoi / bytes GAP duoc an toan (khong no bo nho / CPU): mau format, do rong, so lan lap, bang
    translate co tran; ma hoa trong _MA_HOA_OK."""
    if ten in ("format", "format_map"):
        if not isinstance(v, str) or not _mau_an_toan(v, "{}"):
            return False
        if ten == "format_map" and (len(ds) != 1 or kw or not isinstance(ds[0], dict)):
            return False
        return all(_kich_thuoc(z) <= _GIOI for z in list(ds) + list(kw.values()))
    if ten == "__format__":
        return len(ds) == 1 and isinstance(ds[0], str) and not _SO_DAI_RE.search(ds[0]) and "{" not in ds[0]
    if ten == "__mod__":
        s = v if isinstance(v, str) else bytes(v).decode("latin-1")
        return len(ds) == 1 and _mau_an_toan(s, "%") and _kich_thuoc(ds[0]) <= _GIOI
    if ten in ("center", "ljust", "rjust", "zfill"):
        return bool(ds) and isinstance(ds[0], int) and ds[0] <= _GIOI
    if ten == "expandtabs":
        n = ds[0] if ds else kw.get("tabsize", 8)
        return isinstance(n, int) and 0 <= n <= 64 and len(v) * max(n, 1) <= _GIOI
    if ten in ("__mul__", "__rmul__"):
        return len(ds) == 1 and isinstance(ds[0], int) and len(v) * max(ds[0], 0) <= _GIOI
    if ten == "replace":
        return len(ds) >= 2 and hasattr(ds[1], "__len__") and len(v) + (len(v) + 1) * len(ds[1]) <= _GIOI
    if ten == "join":
        if len(ds) != 1 or kw or not isinstance(ds[0], (tuple, list, str, bytes, dict, set, frozenset)):
            return False
        return len(v) * len(ds[0]) + sum(len(z) for z in ds[0] if hasattr(z, "__len__")) <= _GIOI
    if ten == "translate":
        if not ds or len(ds) > 2 or kw:
            return False
        t = ds[0]
        if isinstance(t, dict):
            m = max([len(z) if isinstance(z, str) else 1 for z in t.values()] or [1])
            return len(v) * max(m, 1) <= _GIOI
        return t is None or isinstance(t, (bytes, bytearray))
    if ten in ("encode", "decode"):
        mh = ds[0] if ds else kw.get("encoding", "utf-8")
        return isinstance(mh, str) and mh.lower() in _MA_HOA_OK
    if ten == "__add__":
        return len(ds) == 1 and type(ds[0]) is type(v) and len(v) + len(ds[0]) <= _GIOI
    return True


def _phan_tich(nguon, che_do):
    """Chay bo phan tich v2; loi bat ngo (RecursionError / MemoryError / loi lap trinh) -> ValueError de tier7b LOAI
    khong_doc_duoc_..., khong de lot thanh QUA."""
    try:
        return _PhanTichChu(nguon, che_do)
    except (OSError, SyntaxError, ValueError):
        raise
    except Exception as e:
        raise ValueError("bo phan tich v2 loi %s: %s" % (type(e).__name__, e))


def doi_ve_trong_render(render_p):
    """v2 (phieu KD 62 L62-1): chu THAT da ve cua ban PIL = DOI cua hang chuoi (ngoai docstring) CHUNG MINH chay toi
    doi so chu cua .text / .multiline_text SONG trong vung DEN DUOC cua render.py (+ anh.py canh no, neu co); 7-31 /
    7-32 theo _PhanTichChu; 7-34 doc utf-8-sig (bo BOM; CRLF doc nhu LF). Tra ({doi: "tep:dong"}, [ly do LOAI])."""
    tep = [render_p]
    anh_p = os.path.join(os.path.dirname(os.path.abspath(render_p)), "anh.py")
    if os.path.isfile(anh_p) and os.path.normcase(os.path.abspath(render_p)) != os.path.normcase(anh_p):
        tep.append(anh_p)
    nguon = []
    for p in tep:
        with open(p, encoding="utf-8-sig") as f:
            nguon.append((os.path.basename(p), f.read(), p))
    pt = _phan_tich(nguon, "render")
    return pt.ra, pt.loi


def doi_ve_trong_canh(canh_p):
    """v2 (phieu KD 62 L62-1): nhu doi_ve_trong_render cho ban MANIM (--canh): CHI doc canh.py (khong lan vao tep
    ban_sac); loi goi ve goc = lop chu manim + ham ban sac theo TEN, vi tri doi so chu VI_TRI_CANH; loi vao construct /
    setup / tear_down. Tra (ra {doi: "tep:dong"}, goc {doi: [ten ve goc]}, loi [ly do LOAI], kenh_import [ma kenh])."""
    with open(canh_p, encoding="utf-8-sig") as f:
        src = f.read()
    pt = _phan_tich([(os.path.basename(canh_p), src, canh_p)], "canh")
    return pt.ra, {d: sorted(v) for d, v in pt.goc.items()}, pt.loi, pt.kenh


def doc_ass_src(ass_p):
    """Doc chrome.ass: (fontname cua style Src, [phan code - truoc \\N - cua tung Dialogue style Src])."""
    font, codes = None, []
    with open(ass_p, encoding="utf-8") as f:
        for line in f:
            line = line.rstrip("\n")
            if line.startswith("Style:"):
                parts = [p.strip() for p in line[len("Style:"):].split(",")]
                if len(parts) > 1 and parts[0] == "Src":
                    font = parts[1]
            else:
                m = re.match(r"Dialogue:\s*[^,]*,[^,]*,[^,]*,Src,(?:[^,]*,){5}(.*)$", line)
                if m:
                    txt = re.sub(r"^\{[^}]*\}", "", m.group(1))   # bo tag \an7\pos dau dong
                    codes.append(txt.split("\\N", 1)[0])
    return font, codes


def _u16(d, o):
    # 7b.1 L2: doc qua cuoi du lieu phai BAO LOI, khong tra 0 (int.from_bytes(b"") == 0)
    if o < 0 or o + 2 > len(d):
        raise ValueError("doc u16 qua cuoi du lieu font: offset %d, dai %d" % (o, len(d)))
    return int.from_bytes(d[o:o + 2], "big")


def _u32(d, o):
    if o < 0 or o + 4 > len(d):
        raise ValueError("doc u32 qua cuoi du lieu font: offset %d, dai %d" % (o, len(d)))
    return int.from_bytes(d[o:o + 4], "big")


def font_ho_tro(path):
    """Tra ham hoi: codepoint -> co glyph THAT (gid != 0) trong cmap TTF/TTC. Chi stdlib.
    Uu tien subtable (3,10) fmt 12 roi (3,1)/(0,3)/(0,4) fmt 4. Khong doc duoc -> ValueError."""
    d = open(path, "rb").read()
    base = _u32(d, 12) if d[:4] == b"ttcf" else 0                 # TTC: font dau tien
    cm = None
    for i in range(_u16(d, base + 4)):
        rec = base + 12 + 16 * i
        if d[rec:rec + 4] == b"cmap":
            cm = _u32(d, rec + 8)
    if cm is None:
        raise ValueError("khong co bang cmap: %s" % path)
    subs = {}
    for i in range(_u16(d, cm + 2)):
        p, e = _u16(d, cm + 4 + 8 * i), _u16(d, cm + 6 + 8 * i)
        subs[(p, e)] = cm + _u32(d, cm + 8 + 8 * i)
    so = subs.get((3, 10)) or subs.get((3, 1)) or subs.get((0, 3)) or subs.get((0, 4))
    if so is None:
        raise ValueError("khong co subtable cmap (3,10)/(3,1)/(0,3)/(0,4): %s co %s" % (path, sorted(subs)))
    fmt = _u16(d, so)
    if fmt == 12:
        ng, tlen = _u32(d, so + 12), _u32(d, so + 4)
        # 7b.1 L2: numGroups co TRAN theo do dai bang (moi nhom 12 byte, header 16 byte) va theo file
        if 16 + 12 * ng > tlen or so + 16 + 12 * ng > len(d):
            raise ValueError("cmap fmt12 numGroups=%d vuot do dai (bang length=%d, file=%d): %s"
                             % (ng, tlen, len(d), path))
        gr = [(_u32(d, so + 16 + 12 * i), _u32(d, so + 20 + 12 * i), _u32(d, so + 24 + 12 * i))
              for i in range(ng)]

        def hoi(cp):
            for s0, e0, g0 in gr:
                if s0 <= cp <= e0:
                    return g0 + (cp - s0) != 0
            return False
        return hoi
    if fmt == 4:
        sx2, tlen = _u16(d, so + 6), _u16(d, so + 2)
        # E1 phieu 30 (lenh GD 14:32, gop vao 7b.2): segCountX2 co TRAN theo do dai bang
        # (4 mang x sx2 byte + header 16 byte) va theo file — nhu fmt12; vuot tran ma van nam
        # trong file thi truoc day doc byte bang khac thanh segment -> LOAI sai nhanh
        # doi_ky_tu_ngoai_cmap_font; nay bao loi de ra dung nhanh khong_doc_duoc_cmap.
        if 16 + 4 * sx2 > tlen or so + 16 + 4 * sx2 > len(d):
            raise ValueError("cmap fmt4 segCountX2=%d vuot do dai (bang length=%d, file=%d): %s"
                             % (sx2, tlen, len(d), path))
        n = sx2 // 2
        ends = [_u16(d, so + 14 + 2 * i) for i in range(n)]
        starts = [_u16(d, so + 16 + sx2 + 2 * i) for i in range(n)]
        deltas = [_u16(d, so + 16 + 2 * sx2 + 2 * i) for i in range(n)]
        ro_base = so + 16 + 3 * sx2
        ros = [_u16(d, ro_base + 2 * i) for i in range(n)]

        def hoi(cp):
            if cp > 0xFFFF:
                return False
            for i in range(n):
                if ends[i] >= cp:
                    if starts[i] > cp:
                        return False
                    if ros[i] == 0:
                        return (cp + deltas[i]) & 0xFFFF != 0
                    gid = _u16(d, ro_base + 2 * i + ros[i] + 2 * (cp - starts[i]))
                    return gid != 0 and (gid + deltas[i]) & 0xFFFF != 0
            return False
        return hoi
    raise ValueError("cmap format %d chua ho tro: %s" % (fmt, path))


GIOI_HAN_CANH = [
    "chu() di qua dich(): ban VI doi chu luc chay -> doi chieu chi chac cho ban EN; KHONG mo rong tuyen bo cho ban VI",
    "phong kenh lay tu bang FONT_KENH (K1 kiem tay 29/09), khong doc font= trong tep ban_sac",
    "cong KHONG chung minh video duoc dung tu CHINH canh nay: chi rang buoc sha256 + mtime (canh khong moi hon video)",
    # v2 (phieu KD 62 L62-1, 04/10/2026): bo CHUNG MINH luong chay - gioi han khai (phan con lai do kiem tay KD chan)
    "v2-1 ham ban sac nhan theo TEN (chu/nhan/chu_thich_nguon/so_hook), vi tri doi so chu theo VI_TRI_CANH; cong khong "
    "lan vao tep ban_sac; bo 'so' (K1 khong co so()); thuoc_kep / ham ban sac khac co ve chu khong tinh -> DOI qua do "
    "7-31; loi goi ve dung tran thanh mot lenh KHONG tinh la ve (K1 chu_thich_nguon tra t, khong add - kiem 04/10)",
    "v2-2 dieu kien phu thuoc luc chay -> CA HAI nhanh coi la song (chi cat nhanh khi GAP CHAT ra hang); ten global / "
    "nonlocal / thuoc tinh module / setattr co the gan lai -> xu ly than trong (khong giai, khong gap chat); frame / "
    "ma dong -> 7-32",
    "v2-3 ham duoc tham chieu (ten / thuoc tinh / chuoi getattr) tu vung den duoc coi la DUOC GOI; loi vao = dunder + "
    "construct / setup / tear_down (--canh); lop coi la duoc dung; KHONG lan theo ham dung / decorator",
    "v2-4 (--canh) mobject chu duoc TAO (khong bo) coi la DA VE: KHONG kiem add / play / opacity / vi tri ngoai khung",
    "v2-5 (render) loi goi ve PIL = .text / .multiline_text, chu o vi tri 1 hoac text=",
    "v2-6 chu doc tu tep / mang / ma nguon luc chay KHONG phat hien",
    "v2-7 self.X, closure, lambda, generator khong ai tieu thu: KHONG lan theo de chung minh -> DOI qua do 7-31",
    "v2-8 ham luon raise KHONG coi la diem dung (lenh sau loi goi no van coi la song)",
    "v2-9 ghep ngan / khong co manh hang (chr tu so, ham truyen nhu gia tri ...) co the lot 7-32",
    "v2-10 GAP CHAT khong tin day bien doi duoc (list / dict / set / bytearray) gan qua ten; set -> khong gap chat",
    "v2-11 ham trung ten giua render.py / anh.py -> GIAO cac vi tri ung vien",
    "v2-12 bo self chi voi loi goi obj.m(...)",
    "v2-13 7-31 xet theo DOI: hang co DOI khong chung minh ve -> 7-31, tru khi CUNG DOI do duoc mot hang khac chung "
    "minh ve",
    "v2-14 exec / eval / compile / globals / locals / vars / __import__ / __dict__ / __builtins__ / _getframe / "
    "f_locals / f_globals / getsource / getattr ten dong -> 7-32 (ma_dong)",
    "v2-15 dieu kien theo bien vong lap KHONG loc phan tu (moi phan tu cua day lap coi la co the ve)",
    "v2-16 import * -> GAP CHAT tu choi moi builtin (co the bi che)",
]


def _gio(t):
    return time.strftime("%Y-%m-%dT%H:%M:%S", time.localtime(t))


def tier7b(sp, ass_p, render_p=None, canh_p=None, video_p=None):
    """Bon nhanh LOAI, moi nhanh ly do RIENG (lenh 09:20, siet 7b.1 lenh 10:59, bit H7 7b.2 lenh
    11:59): DOI_CHAR_UNSUPPORTED | ass_doi_khac_khai_bao_tung_byte / ass_co_doi_khong_khai_bao /
    khong_co_chrome_ass_de_doi_chieu | doi_ky_tu_ngoai_cmap_font / khong_biet_file_font_cua_style_Src /
    khong_biet_file_font_cua_duong_ve / khong_doc_duoc_cmap / khong_mo_duoc_file_font |
    in_figure_khac_chu_ve_trong_render / chu_ve_co_doi_khong_khai_in_figure /
    khong_co_render_de_doi_chieu_in_figure / khong_doc_duoc_render_de_doi_chieu.
    7b.2: render_p la render.py cua CHINH bundle (main truyen --render, mac dinh <bundle>/render.py);
    goi kieu cu 2 doi so ma sp co khai in_figure chua DOI -> LOAI khong_co_render_de_doi_chieu_in_figure
    (khong co nguon chu that thi khong duoc qua).
    7b.3 (lenh GD 15:09) them 2 nhanh LOAI tu doi_ve_trong_render, phat hien ngay khi doc render:
    chu_co_doi_khong_chung_minh_duoc_ve (7-31) / chu_ghep_luc_chay_nghi_co_doi_khong_suy_ra_khop (7-32).
    7b.4 (thu GD 121, 11:24 29/09 duyet huong; de xuat SX 10:44): canh_p = canh.py cua ban manim (--canh), CHI co hieu
    luc khi khong co chrome.ass (main khong truyen canh_p khi co --ass). Khong co canh_p -> y nhu cu (khong them khoa).
    Che do canh: moi DOI khai coi la in_figure, doi chieu hai chieu voi doi_ve_trong_canh bang nhanh (4) san co;
    phong = FONT_KENH theo kenh (import ^K<so>_ cua canh, khop meta.kenh) -> (2) nhu cu; LOAI them: khong_co_canh_de_doi_chieu /
    canh_moi_hon_video / khong_co_video_de_so_mtime_canh / canh_va_render_cung_co_khong_biet_nguon_chu_that /
    khong_doc_duoc_canh_de_doi_chieu / khong_biet_file_font_cua_duong_ve (kenh khong xac dinh; DOI ve qua lop manim
    truc tiep). Report them khoa "canh" (duong, sha256, mtime, kenh, phong, gioi_han) + so_doi_ve_trong_canh."""
    reasons, khai = [], []
    for b in sp["beats"]:
        for s in nguon_beat(b):                           # diem 8: chuoi / dict / danh sach -> danh sach dict
            code = s.get("code", "")
            m = DOI_RAW_RE.search(code)
            khai.append({"beat": b["id"], "code": code, "in_figure": bool(s.get("in_figure")),
                         "doi_tho": m.group(0).rstrip(".,;") if m else None})
    dois = [k for k in khai if k["doi_tho"]]
    # (3) DOI chua ky tu CODE_RE khong quet duoc -> LOAI (le ra phai bi chan truoc render)
    for k in dois:
        if any(c in DOI_BAD for c in k["doi_tho"]):
            reasons.append("DOI_CHAR_UNSUPPORTED:%s(beat %s)" % (k["doi_tho"], k["beat"]))
    # 7b.4: che do canh (ban manim) - chi khi CO canh_p va KHONG co chrome.ass. Ly do LOAI gom vao ly_do_canh,
    #       dua vao reasons o nhanh (4) (cung cho voi 7-31/7-32 cua render o che do cu).
    che_do_canh = bool(canh_p) and not os.path.isfile(ass_p)
    canh_info, ve_canh, ly_do_canh, font_kenh = None, None, [], None
    if canh_p and not che_do_canh:
        canh_info = {"duong": os.path.abspath(canh_p),
                     "bo_qua": "co chrome.ass (%s): doi chieu chrome.ass nhu cu" % ass_p}
    elif che_do_canh:
        canh_info = {"duong": os.path.abspath(canh_p), "che_do": "canh (7b.4: khong co chrome.ass)",
                     "gioi_han": GIOI_HAN_CANH}
        if not os.path.isfile(canh_p):
            ly_do_canh.append("khong_co_canh_de_doi_chieu:%s" % canh_p)
        else:
            mt_c = os.path.getmtime(canh_p)
            canh_info.update({"sha256": sha256(canh_p), "byte": os.path.getsize(canh_p), "mtime": _gio(mt_c)})
            if not video_p or not os.path.isfile(video_p):
                ly_do_canh.append("khong_co_video_de_so_mtime_canh:%r" % (video_p,))
            else:
                mt_v = os.path.getmtime(video_p)
                canh_info.update({"video": os.path.abspath(video_p), "video_mtime": _gio(mt_v)})
                if mt_c > mt_v:                     # canh sua sau render khong chung minh chu trong video
                    ly_do_canh.append("canh_moi_hon_video:canh %s > video %s" % (_gio(mt_c), _gio(mt_v)))
            if render_p and os.path.isfile(render_p):
                ly_do_canh.append("canh_va_render_cung_co_khong_biet_nguon_chu_that:%s | %s" % (canh_p, render_p))
            try:
                ve_canh, goc_canh, loi_canh, kenh_import = doi_ve_trong_canh(canh_p)
            except (OSError, SyntaxError, ValueError) as e:
                ly_do_canh.append("khong_doc_duoc_canh_de_doi_chieu:%s: %s: %s" % (canh_p, type(e).__name__, e))
            else:
                ly_do_canh.extend(loi_canh)         # 7-31 / 7-32 tren canh
                kenh_script = (sp.get("meta") or {}).get("kenh")
                kenh = kenh_import[0] if len(kenh_import) == 1 else None
                if kenh and kenh_script is not None and kenh_script != kenh:
                    kenh = None                     # canh import kenh khac meta.kenh -> khong xac dinh duoc phong
                font_kenh = FONT_KENH.get(kenh) if kenh else None
                canh_info.update({"kenh_import": kenh_import, "kenh_script": kenh_script, "kenh": kenh,
                                  "font_kenh": font_kenh, "goc_ve": goc_canh})
                for d in sorted(ve_canh):           # (2') DOI ve qua lop manim truc tiep: phong khong theo kenh
                    la = [x for x in goc_canh.get(d, []) if x not in HAM_BAN_SAC]
                    if la:
                        ly_do_canh.append("khong_biet_file_font_cua_duong_ve:canh_ve_qua_%s:%s(%s)"
                                          % ("+".join(la), d, ve_canh[d]))
    # (1) doi chieu TUNG BYTE voi chrome.ass - hai chieu; chi the nguon khong in_figure (dung nhu write_ass).
    #     7b.1 L3: so trong khong gian HIEN THI that (bo escape ASS), khong so trong khong gian escape.
    font, ass_codes = None, []
    if not os.path.isfile(ass_p):
        if not che_do_canh:                         # 7b.4: che do canh thay chrome.ass bang canh.py
            reasons.append("khong_co_chrome_ass_de_doi_chieu:%s" % ass_p)
    else:
        font, ass_codes = doc_ass_src(ass_p)
        acs_ht = {ass_hien_thi(c) for c in ass_codes}
        for k in dois:
            if not k["in_figure"] and khai_hien_thi(k["code"]) not in acs_ht:
                reasons.append("ass_doi_khac_khai_bao_tung_byte:%s(beat %s)" % (k["code"], k["beat"]))
        kes = {khai_hien_thi(k["code"]) for k in khai if not k["in_figure"]}
        for c in sorted(set(ass_codes)):
            ht = ass_hien_thi(c)
            if DOI_RAW_RE.search(ht) and ht not in kes:
                reasons.append("ass_co_doi_khong_khai_bao:%s" % c)
    # (2) moi ky tu DOI khai bao co glyph trong cmap cua DUNG font ma duong ve do dung (7b.1 L4):
    #     in_figure -> render ve tren hinh bang FONT_IN_FIGURE (segoeui.ttf, render.py :55/:720);
    #     khong in_figure -> font cua Style Src trong chrome.ass. Duong khong xac dinh duoc file font
    #     -> LOAI khong_biet_file_font_cua_duong_ve. Font khong mo duoc (PermissionError/OSError bat ky)
    #     -> LOAI khong_mo_duoc_file_font, van chay tiep de ghi report, KHONG crash exit 2 (7b.1 L1).
    kiem_font, cache, da_bao_style = [], {}, False

    def hoi_font(fp):
        if fp not in cache:
            try:
                cache[fp] = font_ho_tro(fp)
                kiem_font.append(fp)
            except OSError as e:
                cache[fp] = None
                reasons.append("khong_mo_duoc_file_font:%s: %s: %s" % (fp, type(e).__name__, e))
            except ValueError as e:
                cache[fp] = None
                reasons.append("khong_doc_duoc_cmap:%s" % e)
        return cache[fp]

    for k in dois:
        if che_do_canh:                             # 7b.4 (2'): DOI ve bang ham ban sac -> phong cua kenh
            fp = font_kenh
            if not fp or not os.path.isfile(fp):
                reasons.append("khong_biet_file_font_cua_duong_ve:canh(beat %s): kenh=%s phong=%s"
                               % (k["beat"], (canh_info or {}).get("kenh"), fp))
                continue
        elif k["in_figure"]:
            fp = FONT_IN_FIGURE
            if not os.path.isfile(fp):
                reasons.append("khong_biet_file_font_cua_duong_ve:in_figure(beat %s): thieu %s"
                               % (k["beat"], fp))
                continue
        else:
            if not os.path.isfile(ass_p):
                continue                    # da LOAI khong_co_chrome_ass_de_doi_chieu o nhanh (1)
            if font is None:
                if not da_bao_style:
                    reasons.append("chrome_ass_khong_co_style_Src_de_biet_font:%s" % ass_p)
                    da_bao_style = True
                continue
            fp = FONT_FILES.get(font.strip().lower())
            if not fp or not os.path.isfile(fp):
                if not da_bao_style:
                    reasons.append("khong_biet_file_font_cua_style_Src:%s" % font)
                    da_bao_style = True
                continue
        hoi = hoi_font(fp)
        if hoi is None:
            continue
        try:
            thieu = sorted({c for c in k["doi_tho"] if not hoi(ord(c))})
        except ValueError as e:             # fmt4 tra cuu glyph array lazy: doc qua cuoi -> L2
            reasons.append("khong_doc_duoc_cmap:%s" % e)
            cache[fp] = None
            continue
        if thieu:
            reasons.append("doi_ky_tu_ngoai_cmap_font:%s:%s(beat %s)" % (
                ",".join("U+%04X" % ord(c) for c in thieu), k["doi_tho"], k["beat"]))
    # (4) 7b.2 bit H7 (lenh GD 11:59): khai in_figure <-> chu THAT trong loi goi ve cua render,
    #     so TUNG KY TU hai chieu (DOI chuan hoa rstrip ".,;" nhu doi_tho). Khai ma render khong
    #     ve dung chuoi do -> LOAI; render ve DOI ma khong khai in_figure -> LOAI.
    khai_if = {}
    for k in khai:
        if k["in_figure"] or che_do_canh:           # 7b.4: che do canh -> MOI DOI khai coi la in_figure
            for m in DOI_RAW_RE.finditer(k["code"]):
                khai_if.setdefault(m.group(0).rstrip(".,;"), k["beat"])
    ve = None
    if che_do_canh:                                 # 7b.4: nguon chu that = canh.py, so hai chieu nhu render
        reasons.extend(ly_do_canh)
        ve = ve_canh
    elif render_p and os.path.isfile(render_p):
        try:
            ve, loi_doc_render = doi_ve_trong_render(render_p)
        except (OSError, SyntaxError, ValueError) as e:
            reasons.append("khong_doc_duoc_render_de_doi_chieu:%s: %s: %s"
                           % (render_p, type(e).__name__, e))
        else:
            reasons.extend(loi_doc_render)      # 7b.3: 7-31 / 7-32 — LOAI ngay tu khi doc render
    elif khai_if:
        reasons.append("khong_co_render_de_doi_chieu_in_figure:%s (render_p=%r)"
                       % (",".join(sorted(khai_if)), render_p))
    if ve is not None:
        for d in sorted(khai_if):
            if d not in ve:
                reasons.append("in_figure_khac_chu_ve_trong_render:%s(beat %s)" % (d, khai_if[d]))
        for d in sorted(ve):
            if d not in khai_if:
                reasons.append("chu_ve_co_doi_khong_khai_in_figure:%s(%s)" % (d, ve[d]))
    ket = {"ok": not reasons, "ly_do": reasons,
           "chrome_ass": ass_p if os.path.isfile(ass_p) else None, "font_style_src": font,
           "file_font_kiem": sorted(set(kiem_font)), "so_doi_khai_bao": len(dois),
           "so_the_nguon_trong_ass": len(ass_codes),
           "render_doi_chieu": render_p if (render_p and os.path.isfile(render_p) and not che_do_canh) else None,
           "doi_khai_in_figure": sorted(khai_if), "doi_ve_trong_render": None if che_do_canh else ve}
    if canh_p:                                      # 7b.4: khoa moi CHI khi co canh_p (khong canh -> dict y nhu cu)
        if che_do_canh:
            canh_info["so_doi_ve_trong_canh"] = len(ve_canh) if ve_canh is not None else None
            canh_info["doi_ve_trong_canh"] = ve_canh
            ket["so_doi_ve_trong_canh"] = canh_info["so_doi_ve_trong_canh"]
        ket["canh"] = canh_info
    return ket


# ---------------------------------------------------------------- tang 9
def tier9(work, frames, w, h, accent):
    if (w, h) not in PIP_SPEC:
        return {"ok": False, "ly_do": ["no_identity_layer:khong_co_dac_ta_pip_cho_khung_%dx%d" % (w, h)]}
    _, _, pw, ph = PIP_SPEC[(w, h)]
    acc = np.array(accent, dtype=np.int16)
    c, k = PIP_CROP, PIP_CORNER
    # 27/09/2026 (phieu 52 KD, L52-1..L52-7): HOAN ve hinh hoc 70b9ca62 - do 2 dong o CA 4 canh (1 728 diem khi 307x173).
    # Ban 101dd42f (26/09) bo dong KE TRONG canh duoi/phai khi w, h le vi tin rang overlay 4:2:0 tron dong do 50 %;
    # do lai tren video x264 that (WATER 217/217 khung; clip_x264_mau 20/20 o: khop trung binh dong ke trong = 1,0
    # o 16/20 o, >= 0,979 o 4 o con lai): hien tuong chi co o duong PNG cua phep thu -> bo dong do lam cong LONG hon
    # (E1/E2 cua KD: cu LOAI 0,672 / 0,586, moi DAT 0,782). Nguong PIP_BORDER_TOL / PIP_BORDER_MIN khong doi.
    # Ho so: out/_cong_3_6/DOI_SHA_PHIEU_52_NIST_CODATA.md.
    per, inner_prev, moves = [], None, []
    for t, fp in frames:
        pp = fp.replace("f_", "p_").replace(".jpg", ".png")
        a = np.asarray(Image.open(pp).convert("RGB"), dtype=np.int16)
        edges = np.concatenate([
            a[c:c + 2, c + k:c + pw - k].reshape(-1, 3), a[c + ph - 2:c + ph, c + k:c + pw - k].reshape(-1, 3),
            a[c + k:c + ph - k, c:c + 2].reshape(-1, 3), a[c + k:c + ph - k, c + pw - 2:c + pw].reshape(-1, 3)])
        border = float((np.abs(edges - acc).max(axis=1) <= PIP_BORDER_TOL).mean())
        inner = a[c + 6:c + ph - 6, c + 6:c + pw - 6].mean(axis=2)
        std = float(inner.std())
        if inner_prev is not None:
            moves.append(float(np.abs(inner - inner_prev).mean()))
        inner_prev = inner
        per.append({"t": t, "vien": round(border, 3), "std": round(std, 1),
                    "co_pip": border >= PIP_BORDER_MIN and std >= PIP_INNER_STD})
    n = len(per) or 1
    cover = sum(p["co_pip"] for p in per) / n
    motion = (sum(m >= PIP_MOTION_DIFF for m in moves) / len(moves)) if moves else 0.0
    reasons = []
    if cover < PIP_COVER_MIN:
        reasons.append("no_identity_layer:pip_co_mat_%.1f%%_khung<%.0f%%" % (100 * cover, 100 * PIP_COVER_MIN))
    if cover >= PIP_COVER_MIN and motion < PIP_MOTION_MIN:
        reasons.append("no_identity_layer:pip_khong_chuyen_dong_%.0f%%_cap_mau" % (100 * motion))
    gaps = [p["t"] for p in per if not p["co_pip"]]
    return {"ok": not reasons, "ly_do": reasons, "o_pip": PIP_SPEC[(w, h)], "mau_nhan": list(accent),
            "dong_vien_do": {"tren": 2, "duoi": 2, "trai": 2, "phai": 2},
            "ti_le_khung_co_pip": round(cover, 4), "ti_le_cap_mau_chuyen_dong": round(motion, 4),
            "so_khung": len(per), "khung_thieu_pip_s (20 dau)": gaps[:20],
            "vien_trung_vi": float(np.median([p["vien"] for p in per])) if per else None}


# ---------------------------------------------------------------- tang 9b (v3.4, NX88-9)
# Chu/so KHONG duoc di duoi o PiP + 8 px o BAT KY khung nao (NX83-7, khong dung sai). Ban cuoi da bi o PiP phu nen
# bang chung lay tu BAN TRAN (video truoc khi chong PiP): doc MOI khung vung o PiP + 8 px + le T9B_LE px, OCR Windows
# tung tu kem hop bao; tu co chu/so ma hop bao cat o PiP + 8 px VA co diem muc (|Y - trung vi hop| > T9B_MUC) nam
# trong o -> TRUOT. Duong ke, vach, cham gach, vien (khong phai chu) OCR khong doc thanh chu nen duoc di qua.
# Rang buoc ban tran voi video: cung khung, cung so khung, va ngoai o PiP (+2 px) hai ban gan nhu trung tung khung.
T9B_LE = 40                       # le quanh o PiP + 8 px de OCR thay ca tu chi lan mot phan vao o
T9B_PHONG = 2                     # phong anh truoc OCR (chu so luoi ~10 px cao)
T9B_DOI = 24                      # muc xam coi la diem doi giua 2 khung
T9B_DOI_TI_LE = 0.002             # ti le diem doi toi thieu de OCR lai khung (khung khong doi dung chung ket qua)
T9B_MUC = 40                      # diem muc: lech xam so voi trung vi hop bao cua tu
T9B_MUC_MIN = 2                   # so diem muc toi thieu (theo diem anh goc) trong phan hop bao nam trong o
T9B_KHOP = 6.0                    # lech xam trung binh lon nhat ngoai o giua ban tran va video (2 lan ma hoa x264)
T9B_KHOP_MIN = 0.99               # ti le khung khop toi thieu
T9B_CHU = re.compile(r"[A-Za-z0-9]")
# Luot 2 - chu DON LE (NX88-3: chu "A" mat cat la CHU). OCR Windows khong doc 1 ky tu dung mot minh (thu K4 cu f262-269:
# phong 2-6 lan, dao mau, lap 3 lan deu khong doc) nhung doc duoc khi co chu dan dung truoc cung co chu. Nen: tach cum muc
# lien thong co dang chu cat o PiP + 8 px, ve tung cum thanh 1 dong "Section <cum>" (phong FONT_IN_FIGURE) roi OCR.
T9B_DON_CAO = (8, 48)             # cao cum muc (px goc) coi la co the la 1 ky tu
T9B_DON_RONG = (4, 48)            # rong cum muc (px goc); vach cham gach rong 2-4 px bi loai
T9B_DON_DAY = (0.12, 0.80)        # ti le diem muc trong hop cum (o dac / khung rong bi loai)
T9B_DON_DONG = 20                 # so cum moi anh ghep
T9B_DON_CO = 64                   # co chu dan (px)
T9B_DON_DAN = "Section "          # chu dan
T9B_DON_KY = re.compile(r"[A-Za-z0-9]")    # ket qua OCR 1 cum phai DUNG 1 chu/so


from PIL import ImageDraw, ImageFont                       # v3.4 tang 9b luot 2 (anh ghep chu dan)
from PIL import ImageFilter                                # v3.6 luot 3: nen cuc bo (trung vi)


def _cum_muc(m):
    """Cum lien thong 8 huong cua mat na m, theo doan chay tung hang. [(y0, x0, y1, x1, so_diem, [(y, x0, x1)])]"""
    runs, hang = [], []
    for y in range(m.shape[0]):
        r, ids = m[y], []
        if r.any():
            dd = np.diff(np.concatenate(([0], r.astype(np.int8), [0])))
            for s0, s1 in zip(np.nonzero(dd == 1)[0], np.nonzero(dd == -1)[0]):
                ids.append(len(runs))
                runs.append((y, int(s0), int(s1)))
        hang.append(ids)
    cha = list(range(len(runs)))

    def goc(i):
        while cha[i] != i:
            cha[i] = cha[cha[i]]
            i = cha[i]
        return i
    for y in range(1, len(hang)):
        A, B, i, j = hang[y - 1], hang[y], 0, 0
        while i < len(A) and j < len(B):
            _, a0, a1 = runs[A[i]]
            _, b0, b1 = runs[B[j]]
            if a0 <= b1 and b0 <= a1:
                cha[goc(A[i])] = goc(B[j])
            if a1 < b1:
                i += 1
            else:
                j += 1
    nhom = {}
    for i, r in enumerate(runs):
        nhom.setdefault(goc(i), []).append(r)
    return [(min(r[0] for r in rs), min(r[1] for r in rs), max(r[0] for r in rs) + 1, max(r[2] for r in rs),
             sum(r[2] - r[1] for r in rs), rs) for rs in nhom.values()]


def _ghep_don(gt, d, ki, ox0, oy0, ox1, oy1):
    """Luot 2: cum muc dang chu cat o (ox0, oy0, ox1, oy1) (toa do vung doc) -> anh ghep s_<khung>_<so>.png, moi cum 1 dong
    "Section <cum>". Tra {ten anh: [{y: dai dong, x_dan, hop (vung doc), trong: so diem muc trong o}]}."""
    v = np.abs(gt - float(np.median(gt)))
    ds = []
    for y0, x0, y1, x1, so, rs in _cum_muc(v > T9B_MUC):
        hh, ww = y1 - y0, x1 - x0
        if not (T9B_DON_CAO[0] <= hh <= T9B_DON_CAO[1] and T9B_DON_RONG[0] <= ww <= T9B_DON_RONG[1]):
            continue
        if not (T9B_DON_DAY[0] <= so / float(hh * ww) <= T9B_DON_DAY[1]):
            continue
        trong = sum(max(0, min(r1, ox1) - max(r0, ox0)) for y, r0, r1 in rs if oy0 <= y < oy1)
        if trong >= T9B_MUC_MIN:
            ds.append((y0, x0, y1, x1, trong, rs))
    meta = {}
    if not ds:
        return meta
    F = ImageFont.truetype(FONT_IN_FIGURE, T9B_DON_CO)
    _, t, _, b = F.getbbox(T9B_DON_DAN.strip())
    dan_w, cao, dong = int(F.getlength(T9B_DON_DAN)), b - t, T9B_DON_CO + 48
    for k0 in range(0, len(ds), T9B_DON_DONG):
        lo, gl = ds[k0:k0 + T9B_DON_DONG], []
        for y0, x0, y1, x1, trong, rs in lo:
            a = np.zeros((y1 - y0, x1 - x0), np.float32)
            for y, r0, r1 in rs:
                a[y - y0, r0 - x0:r1 - x0] = v[y, r0:r1]
            a = 255 - np.clip(a * 255.0 / max(float(a.max()), 1.0), 0, 255)
            sc = cao / float(y1 - y0)
            gl.append(Image.fromarray(a.astype(np.uint8)).resize((max(1, int(round((x1 - x0) * sc))), cao), Image.LANCZOS))
        cv = Image.new("L", (60 + dan_w + max(g.size[0] for g in gl) + 60, 80 + dong * len(gl)), 255)
        dr = ImageDraw.Draw(cv)
        ten = "s_%06d_%02d.png" % (ki, k0 // T9B_DON_DONG)
        meta[ten] = []
        for i, (g, c) in enumerate(zip(gl, lo)):
            yt = 40 + i * dong
            dr.text((60, yt - t), T9B_DON_DAN, font=F, fill=0)
            cv.paste(g, (60 + dan_w, yt))
            meta[ten].append({"y": [yt - 12, yt + cao + 12], "x_dan": 60 + dan_w, "hop": [c[1], c[0], c[3], c[2]], "trong": c[4]})
        cv.save(os.path.join(d, ten))
    return meta


def tim_ban_tran(video):
    rj = video + ".render.json"
    if not os.path.isfile(rj):
        return None, "khong_co_%s" % os.path.basename(rj)
    try:
        j = json.load(open(rj, encoding="utf-8"))
    except Exception as e:
        return None, "render.json_hong:%s" % type(e).__name__
    p = j.get("ban_tran")
    if not p:
        return None, "render.json_khong_khai_ban_tran"
    return p, "render.json:ban_tran"


def _ong_doc(video, cw, ch, x, y):
    return subprocess.Popen(["ffmpeg", "-v", "error", "-nostdin", "-i", video, "-vf", "crop=%d:%d:%d:%d" % (cw, ch, x, y),
                             "-f", "rawvideo", "-pix_fmt", "rgb24", "-fps_mode", "passthrough", "-"],
                            stdout=subprocess.PIPE)


# ---------------------------------------------------------------- tang 9b v3.6 (phieu KD 98, lenh GD 16:28 19/10/2026)
# v3.7 (phieu KD 100, lenh GD 23:31 19/10/2026): them T9B3_GIU trong _lech3 (Loi 1) va soat moi cum doc OCR rong (Loi 2);
# cac dong duoi ghi them phan GD 18:15 da co o v3.6 65f0a31f (NX100-2)
# v3.6 giu nguyen luot 1 va luot 2 cua v3.5; luot 3 chay tren MOI khung ban tran:
#  - nen = trung vi o 32x32 (tren anh thu 4x4) noi song tuyen, TINH RIENG tung kenh R, G, B; diem muc = max theo kenh
#    cua |kenh - nen| nho nhat giua nen o 32 px va 9 nen cuc bo trung vi 72 px (_lech3, GD 18:15); v3.7: thanh phan diem muc
#    theo nen 32 px vua o PiP + 8 (T9B3_GIU) lay lai diem theo nen 32 px (than / long chu dam)
#  - (GD 18:15) net ve L = cum diem net thang duong cheo >= T9B3_NET (_net_dai3), bo tren ca khung; _hut3 / _bo_hut3 hut diem
#    thang hang voi L, bo cum >= T9B3_HUT_TL trong H; _bo_vet3 bo vet giao net (cach L <= T9B3_VET); _chu_thap3 dau '+' dung
#    |kenh - nen kenh| > T9B3_MUC (doc) / T9B3_MUC_SOAT (soat) (NX98-1: tuong phan chu nho nhat cua bang mau ban sac 5 kenh
#    do theo max kenh la 86.2 (K1); trung binh xam bo sot chu mau, vd K4 DO tren NEN chi 6.3)
#  - tach duong ke ngang/doc: chi bo doan thang lien >= T9B3_KE = 192 px (cat bang chieu rong / cao o PiP + 8 neu nho hon),
#    dai hon moi hop chu (Loi 1: chu 52-140 px giu nguyen than); diem ke nam giua 2 phan chu (cach <= T9B3_LIEN) duoc tra lai
#  - gom cum: mat na no T9B3_NO px roi lien thong 8 huong (chu Stencil dut net, U1); diem cua cum = diem muc that
#  - cum cat o PiP + 8 px (>= 2 diem trong o), cao >= 6 va rong >= 2:
#      * vua co chu (cao 6-48, rong 2-48, day 0.08-0.90) -> ve thanh dong "Section <cum>" OCR 1 lan cho moi hinh cum khac
#        nhau; OCR ra 1-16 chu/so (T9B3_KY) -> TRUNG (loai "doc") tai MOI khung co cum do; OCR ra chu KHAC mau nay (khong
#        rong) -> SOAT (NX98-3, loai "soat", chu "[soat ocr:<chu>]"); cum cach net dai <= T9B3_CHAM px ma OCR khong ra
#        chu -> SOAT ("[soat ocr:rong net]", net cat qua chu lam OCR hong); v3.7: cum doc OCR rong o cho khac cung SOAT
#        ("[soat ocr:rong]"; v3.6 65f0a31f khong ra su kien)
#      * dong chu dinh lien (cao 6-48, rong <= 240): doc them 1 lan roi xet tiep nhu cum khong vua
#      * khong vua co chu: tach net (Loi 2) - diem "thang" la diem co do lech nho nhat cua dam diem trong cua so 13x13
#        (gia tri rieng nho cua ma tran hiep phuong sai toa do) <= T9B3_TUYEN (net 1-3 px, ke ca xien/cong); chi bo cum diem
#        thang dai >= T9B3_KE (duong cheo hop bao) hoac phu het chieu rong / cao o PiP + 8 (duong ke, khong phai chu); phan
#        day (than chu, cho net cham chu) giu nguyen, diem bo nam giua 2 phan con lai duoc tra; gom lai xet 1 lan nua
#      * khong tach duoc, hoac sau khi tach van khong vua -> SOAT (ca muc 20 va 40, Loi 3) -> TRUOT; soat nam trong hop
#        soat khac cung khung thi chi giu hop lon
#  - KHONG co luat 1 ky tu phai co mat >= 2 khung: moi trung deu tinh; bo_1_ky_tu_1_khung luon rong.
#  - Ngoai le DUY NHAT: dong KD ky "KY9B video=<sha256 video> f=<a>-<b> hop=x0,y0,x1,y1" trong tep phieu ten
#    YYYYMMDD-HHMM_*.md nam ngay trong out/_kiem_dinh/phieu/ (--ky-kd): trung cung sha video, khung trong [a, b], hop su kien
#    nam trong hop ky -> mien, ghi lai. Dong cua video nay phai: a <= b, b - a + 1 <= T9B_KY_KHUNG, hop nam trong vung doc,
#    x0 < x1, y0 < y1, dien tich <= T9B_KY_DT x dien tich o PiP + 8 (NX98-4/5/8); sai 1 dong -> dong do khong mien va TRUOT.
#    Bao tong khung mien / khung co su kien, va theo tung dong.
#  - Khong cat danh sach (NX95-3): doan, mien tra du; ly_do in 8 doan dau va ghi so con lai.
T9B_NHIP = 15                     # luot 1 (U2): OCR lai it nhat moi 15 khung
T9B_DOI_O = 6                     # luot 1 (U2): >= 6 diem doi (> T9B_DOI) trong o PiP + 8 so voi khung OCR truoc -> OCR
T9B3_THU = 4                      # luot 3: thu anh 4x4 de tinh nen
T9B3_NEN = 8                      # luot 3: o trung vi 8x8 tren anh thu = 32x32 px goc
T9B3_MUC = 20                     # luot 3: diem muc (max kenh) de doc va soat (U4 tuong phan 32 > 20; NX98-1 ban sac >= 86)
T9B3_MUC_SOAT = 40                # luot 3: muc thu 2 (mat na sach hon cho chu dam)
T9B3_KE = 192                     # doan thang ngang/doc >= 192 px (hoac het o PiP + 8) = duong ke; cum thang dai >= 192 = net ve
T9B3_LIEN = 3                     # tra diem ke nam giua 2 phan chu cach <= 3 px
T9B3_NO = 1                       # no mat na 1 px khi gom cum
T9B3_CAO = (6, 48)
T9B3_RONG = (2, 48)
T9B3_DAY = (0.08, 0.90)
T9B3_TUYEN_R = 6                  # cua so (2R+1)^2 = 13x13 tinh do thang cuc bo
T9B3_TUYEN = 1.5                  # gia tri rieng nho <= 1.5 px^2 = diem net thang (net 1-3 px); than chu / cho cham > 2.5
T9B3_KY = re.compile(r"[A-Za-z0-9]{1,16}")
T9B3_DONG = 240                   # cum cao vua co chu, rong 48..240 px (dong chu dinh lien) -> them 1 lan doc
T9B3_NGHIENG = 0.21               # luot 3: ve them ban bo nghieng +/- 0.21 (chu nghieng K3/K4)
T9B3_CUC_THU = 8                  # luot 3 (GD 18:15): nen cuc bo = trung vi 9x9 tren anh thu 8x8 = cua so 72x72 px goc
T9B3_CUC = 9                      # (p98 cao: cua so 28 px xoa than chu 80-140 px tuong phan 30; 72 px chi xoa vung dong mau day > ~36 px)
T9B3_NET = 128                    # cum diem net thang (moi huong, net <= ~4 px) duong cheo hop bao >= 128 px = net ve (duong dong
                                  # muc, khung), bo tren ca khung. Chu net manh <= 4 px lon nhat: SegoeLight cao ~88 px (net 0,05 x cao),
                                  # hop ~88x88, cheo ~124 < 128 (p98 cao: 72 px bo net 4x80 cua 'l' SegoeLight 80 px)
T9B3_VET = 6                       # cum con lai cham net va moi diem cach net <= 6 px = vet giao net, bo
T9B3_CHAM = 2                      # cum doc cach net dai L <= 2 px ma OCR khong ra chu -> "[soat ocr:rong net]" (v3.7: cum
                                   # doc OCR rong o MOI cho deu soat, xem rong trong tier9b)
T9B3_GIU = (190, 324)              # v3.7 (Loi 1 phieu KD 100): thanh phan lien thong (no T9B3_GIU_NO px) cua diem > T9B3_MUC theo
                                   # nen o 32 px co hop <= cao x rong o PiP + 8 lon nhat (16:9 189x323, 9:16 190x324) -> lay lai
                                   # diem muc theo nen o 32 px (than / long chu dam ma trung vi cuc bo 72 px xoa); vung dong mau
                                   # lon hon o (nen ban do, vien dai) van theo nen cuc bo (K5moi16 179 khung: so cum khong doi)
T9B3_GIU_NO = 1
T9B3_HUT_TL = 0.9                  # cum co ti le diem trong H (net dai + diem hut) >= muc nay thi bo ca cum
T9B3_HUT = 10              # luot 3: nua do dai doan thang huong (21 diem) de hut diem du thang hang voi net dai
T9B3_HUT_PHU = 19          # so diem (mat na muc 20 no 1 px) toi thieu tren doan 21 diem
T9B3_HUT_DAU = 3           # so diem cuoi moi dau doan xet cham net dai cung huong
T9B3_HUT_GOC = 15.0        # do lech huong toi da (do) giua doan va net dai tai diem cham
T9B3_HUT_LAP = 24          # so luot lan toi da
T9B_KY_THU_MUC = r"E:\Studio\out\_kiem_dinh\phieu"
T9B_KY_TEN = re.compile(r"^\d{8}-\d{4}_.+\.md$")                         # NX98-8
T9B_KY_RE = re.compile(r"^KY9B video=([0-9a-f]{64}) f=(\d+)-(\d+) hop=(\d+),(\d+),(\d+),(\d+)\s*$")
T9B_KY_KHUNG = 900                # NX98-4: 1 dong ky mien toi da 900 khung (30 s o 30 fps)
T9B_KY_DT = 0.70                  # NX98-4: hop ky toi da 0.70 dien tich o PiP + 8
T9B_KY_TONG = 1800                # NX100-1 (v3.7): tong khung co su kien duoc mien moi video toi da 1800 (60 s o 30 fps); vuot -> TRUOT


def _nen3(g):
    H, W = g.shape
    s, n = T9B3_THU, T9B3_NEN
    hy, hx = -(-H // s), -(-W // s)
    p = np.pad(g, ((0, hy * s - H), (0, hx * s - W)), mode="edge").reshape(hy, s, hx, s).mean(axis=(1, 3))
    ny, nx = -(-hy // n), -(-hx // n)
    p = np.pad(p, ((0, ny * n - hy), (0, nx * n - hx)), mode="edge")
    t = np.median(p.reshape(ny, n, nx, n).transpose(0, 2, 1, 3).reshape(ny, nx, n * n), axis=2).astype(np.float32)
    return np.asarray(Image.fromarray(t).resize((nx * n * s, ny * n * s), Image.BILINEAR))[:H, :W]


def _lech3(g):
    """|kenh - nen| nho nhat giua nen o 32 px (v3.6) va nen cuc bo (GD 18:15): trung vi T9B3_CUC x T9B3_CUC tren anh thu
    T9B3_CUC_THU (cua so 72 px goc) cua o chua diem va 8 o ke ben. Diem mep / trong vung dong mau rong (vien dai mau, nen
    ban do) -> co o ke cung mau -> ~0; net manh / than chu rong < ~36 px -> moi o ke deu la nen -> giu nguyen.
    v3.7 (Loi 1 phieu KD 100): thanh phan diem > T9B3_MUC theo nen o 32 px (no T9B3_GIU_NO) co hop <= T9B3_GIU -> lay lai
    |kenh - nen o 32 px| tren ca thanh phan (than va long chu dam 40-160 px; chu vua o PiP + 8 thi nam trong 1 thanh phan)."""
    H, W = g.shape
    s = T9B3_CUC_THU
    t = np.asarray(Image.fromarray(g.astype(np.uint8)).resize((max(1, W // s), max(1, H // s)), Image.BOX).filter(
        ImageFilter.MedianFilter(T9B3_CUC)), np.float32)
    h, w = t.shape
    iy, ix = np.minimum(np.arange(H) * h // H, h - 1), np.minimum(np.arange(W) * w // W, w - 1)
    e8 = e = np.abs(g - _nen3(g))
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            e = np.minimum(e, np.abs(g - t[np.clip(iy + dy, 0, h - 1)][:, np.clip(ix + dx, 0, w - 1)]))
    m8 = e8 > T9B3_MUC                                     # v3.7 (Loi 1 phieu KD 100): giu than va long chu
    if m8.any():
        for y0, x0, y1, x1, _, rs in _cum_muc(_no3(m8, T9B3_GIU_NO)):
            if y1 - y0 <= T9B3_GIU[0] and x1 - x0 <= T9B3_GIU[1]:
                for y, r0, r1 in rs:
                    e[y, r0:r1] = e8[y, r0:r1]
    return e


def _diem3(at):
    """Do muc luot 3 (NX98-1): max theo kenh |kenh - nen kenh|; anh xam (3 kenh bang nhau) tinh 1 lan."""
    if np.array_equal(at[:, :, 0], at[:, :, 1]) and np.array_equal(at[:, :, 1], at[:, :, 2]):
        return _lech3(at[:, :, 0].astype(np.float32))
    dk = None
    for i in range(3):
        e = _lech3(at[:, :, i].astype(np.float32))
        dk = e if dk is None else np.maximum(dk, e)
    return dk


def _chay3(a, L):
    W = a.shape[1]
    if W < L:
        return np.zeros_like(a)
    cs = np.cumsum(np.pad(a, ((0, 0), (1, 0))).astype(np.int32), axis=1)
    st = (cs[:, L:] - cs[:, :-L]) == L
    c2 = np.cumsum(np.pad(st, ((0, 0), (1, 0))).astype(np.int32), axis=1)
    x = np.arange(W)
    return (c2[:, np.minimum(x, W - L) + 1] - c2[:, np.maximum(0, x - L + 1)]) > 0


def _dich3(r, d, truc, dau):
    o = np.zeros_like(r)
    for s in range(1, d + 1):
        if truc == 0:
            if dau > 0:
                o[s:] |= r[:-s]
            else:
                o[:-s] |= r[s:]
        elif dau > 0:
            o[:, s:] |= r[:, :-s]
        else:
            o[:, :-s] |= r[:, s:]
    return o


def _tra3(r, L):
    """Diem cua L nam giua 2 phan cua r (theo doc hoac ngang, cach <= T9B3_LIEN) -> tra lai cho r."""
    d = T9B3_LIEN
    return r | (L & ((_dich3(r, d, 0, 1) & _dich3(r, d, 0, -1)) | (_dich3(r, d, 1, 1) & _dich3(r, d, 1, -1))))


def _tach3(dk, muc, ke):
    """Mat na diem muc da tach duong ke (doan thang ngang >= ke[0] / doc >= ke[1]), tra diem ke nam giua 2 phan chu."""
    m = dk > muc
    k_ = _chay3(m, ke[0]) | _chay3(m.T, ke[1]).T
    return _tra3(m & ~k_, k_)


def _net_dai3(m, k=None):
    """Diem net thang (moi huong, _tuyen3 <= T9B3_TUYEN) thuoc cum net thang co duong cheo hop bao >= T9B3_NET. Diem duong ke k
    nam giua 2 phan net thang (cach <= T9B3_LIEN, lech <= 2 px) noi 2 phan truoc khi do (net bi duong ke cat)."""
    tu = m & (_tuyen3(m) <= T9B3_TUYEN)
    if k is not None:
        nn, nd = tu.copy(), tu.copy()                  # no ngang / doc 2 px: net xien cat duong ke lech 1-2 px 2 ben
        for s in (1, 2):
            nn[:, s:] |= tu[:, :-s]
            nn[:, :-s] |= tu[:, s:]
            nd[s:] |= tu[:-s]
            nd[:-s] |= tu[s:]
        d = T9B3_LIEN
        tu = tu | (k & ((_dich3(nn, d, 0, 1) & _dich3(nn, d, 0, -1)) | (_dich3(nd, d, 1, 1) & _dich3(nd, d, 1, -1))))
    L = np.zeros_like(m)
    for y0, x0, y1, x1, _, rs in _cum_muc(tu):
        if math.hypot(x1 - x0, y1 - y0) >= T9B3_NET:
            for y, r0, r1 in rs:
                L[y, r0:r1] = True
    return L


def _bo_vet3(r, L):
    """Bo cum cua r cham net dai L ma moi diem cach L <= T9B3_VET (vet cho giao net / net day hon 3 px)."""
    if not L.any():
        return r
    sat, gan = _no3(L, 1), _no3(L, T9B3_VET)
    out = np.zeros_like(r)
    for y0, x0, y1, x1, _, rs in _cum_muc(r):
        pts = np.zeros((y1 - y0, x1 - x0), bool)
        for y, r0, r1 in rs:
            pts[y - y0, r0 - x0:r1 - x0] = True
        if (pts & sat[y0:y1, x0:x1]).any() and not (pts & ~gan[y0:y1, x0:x1]).any():
            continue
        out[y0:y1, x0:x1] |= pts
    return out


def _bo_hut3(r, H):
    """Bo cum cua r co ti le diem nam trong H (net dai + diem hut) >= T9B3_HUT_TL. Khong cat diem le: cum giu thi giu ca cum (chu)."""
    if not H.any():
        return r
    out = np.zeros_like(r)
    for y0, x0, y1, x1, _, rs in _cum_muc(r):
        pts = np.zeros((y1 - y0, x1 - x0), bool)
        for y, r0, r1 in rs:
            pts[y - y0, r0 - x0:r1 - x0] = True
        if (pts & H[y0:y1, x0:x1]).sum() >= T9B3_HUT_TL * pts.sum():
            continue
        out[y0:y1, x0:x1] |= pts
    return out


def _huong3(pq):
    """Huong chinh (rad, [0, pi)) cua cac diem pq trong cua so 13x13 quanh moi diem."""
    R = T9B3_TUYEN_R
    H, W = pq.shape
    q = pq.astype(np.float64)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float64)
    n = np.maximum(_tong3(q, R), 1.0)
    mx, my = _tong3(q * xx, R) / n, _tong3(q * yy, R) / n
    vxx = _tong3(q * xx * xx, R) / n - mx * mx
    vyy = _tong3(q * yy * yy, R) / n - my * my
    vxy = _tong3(q * xx * yy, R) / n - mx * my
    return np.mod(0.5 * np.arctan2(2.0 * vxy, vxx - vyy), np.pi)


def _hut3(r, m, L):
    """Diem du r nam tren doan thang 16 huong dai 2*T9B3_HUT+1 phu >= T9B3_HUT_PHU diem cua m (no 1 px), ma o T9B3_HUT_DAU
    diem cuoi 1 dau doan co diem L cung huong (lech <= T9B3_HUT_GOC) -> nhap vao L; lan dan toi da T9B3_HUT_LAP luot.
    Net cat chu (khac huong) khong hut than chu. Tra L moi."""
    if not L.any() or not r.any():
        return L
    H, W = m.shape
    P = T9B3_HUT + 1
    Wp = W + 2 * P
    mp = np.pad(_no3(m, 1), P).ravel()
    Lp = np.pad(L, P).ravel().copy()
    gp = np.pad(np.where(L, _huong3(L), 0.0), P).ravel().copy()
    t = np.arange(-T9B3_HUT, T9B3_HUT + 1)
    dau = np.r_[0:T9B3_HUT_DAU, 2 * T9B3_HUT + 1 - T9B3_HUT_DAU:2 * T9B3_HUT + 1]
    lech = math.radians(T9B3_HUT_GOC)
    hg = []
    for k in range(16):
        a = k * math.pi / 16
        hg.append((a, np.round(t * math.sin(a)).astype(np.int64) * Wp + np.round(t * math.cos(a)).astype(np.int64)))
    ys, xs = np.nonzero(r)
    con = (ys + P) * Wp + xs + P
    for _ in range(T9B3_HUT_LAP):
        if not len(con):
            break
        hut = np.zeros(len(con), bool)
        goc = np.zeros(len(con))
        for a, o_ in hg:
            g = con[:, None] + o_[None, :]
            ok = mp[g].sum(1) >= T9B3_HUT_PHU
            if not ok.any():
                continue
            gd = g[:, dau]
            d = np.abs(gp[gd] - a)
            ok &= (Lp[gd] & (np.minimum(d, np.pi - d) <= lech)).any(1)
            moi = ok & ~hut
            hut |= ok
            goc[moi] = a
        if not hut.any():
            break
        Lp[con[hut]] = True
        gp[con[hut]] = goc[hut]
        con = con[~hut]
    return Lp.reshape(H + 2 * P, Wp)[P:P + H, P:P + W]


def _tach_hai3(dk, ke):
    return _tach_ba3(dk, ke)[:2]


def _tach_ba3(dk, ke):
    """(mat na muc 20, muc 40, net dai L). Mat na muc 20 va 40: bo duong ke ngang/doc (nhu _tach3), bo net dai L (tinh 1 lan o muc 20, dung cho ca 2 muc),
    tra diem ke/net nam giua 2 phan chu, bo ca cum chi gom net/diem hut (H), roi bo vet giao net."""
    m20, m40 = dk > T9B3_MUC, dk > T9B3_MUC_SOAT
    k20 = _chay3(m20, ke[0]) | _chay3(m20.T, ke[1]).T
    k40 = _chay3(m40, ke[0]) | _chay3(m40.T, ke[1]).T
    L = _net_dai3(m20 & ~k20, k20)
    H = _hut3(m20 & ~k20 & ~L, m20, L)
    return (_bo_vet3(_bo_hut3(_tra3(m20 & ~k20 & ~L, k20 | L), H), L), _bo_vet3(_bo_hut3(_tra3(m40 & ~k40 & ~L, k40 | L), H), L), L)


def _cham3(L, hop, pq):
    """Cum (hop, mat na pq) cach net dai L <= T9B3_CHAM px."""
    f = np.zeros_like(L)
    f[hop[1]:hop[3], hop[0]:hop[2]] = pq
    return bool((_no3(f, T9B3_CHAM) & L).any())


def _chu_thap3(pq):
    """Dau cong dung: 1 thanh ngang + 1 thanh doc (moi thanh 1-4 px, phu >= 80 %) cat nhau gan giua, khong con diem nao
    khac -> ky hieu ban do (dau ngam), khong phai chu/so."""
    h, w = pq.shape
    if h < 9 or w < 9:
        return False
    hr = np.nonzero(pq.sum(1) >= 0.8 * w)[0]
    vc = np.nonzero(pq.sum(0) >= 0.8 * h)[0]
    if not (1 <= len(hr) <= 4 and 1 <= len(vc) <= 4) or hr[-1] - hr[0] != len(hr) - 1 or vc[-1] - vc[0] != len(vc) - 1:
        return False
    if min(hr[0], h - 1 - hr[-1]) < 0.35 * h or min(vc[0], w - 1 - vc[-1]) < 0.35 * w:
        return False
    r = pq.copy()
    r[max(0, hr[0] - 1):hr[-1] + 2, :] = False      # diem le sat 1 px canh thanh (muc 40 thanh bi vo)
    r[:, max(0, vc[0] - 1):vc[-1] + 2] = False
    return not r.any()


def _no3(q, d):
    p = np.pad(q, d)
    o = np.zeros_like(q)
    for dy in range(2 * d + 1):
        for dx in range(2 * d + 1):
            o |= p[dy:dy + q.shape[0], dx:dx + q.shape[1]]
    return o


def _cum3(q, o):
    """Cum (gom bang no T9B3_NO) cua mat na q cat o (ox0, oy0, ox1, oy1) >= T9B_MUC_MIN diem. [(hop, so_diem, mat_na_cat)]"""
    ox0, oy0, ox1, oy1 = o
    kq = []
    for cy0, cx0, cy1, cx1, _, rs in _cum_muc(_no3(q, T9B3_NO)):
        lab = np.zeros((cy1 - cy0, cx1 - cx0), bool)
        for y, r0, r1 in rs:
            lab[y - cy0, r0 - cx0:r1 - cx0] = True
        pq = q[cy0:cy1, cx0:cx1] & lab
        if int(pq[max(0, oy0 - cy0):max(0, oy1 - cy0), max(0, ox0 - cx0):max(0, ox1 - cx0)].sum()) < T9B_MUC_MIN:
            continue
        ys, xs = np.nonzero(pq)
        y0, x0, y1, x1 = int(ys.min()), int(xs.min()), int(ys.max()) + 1, int(xs.max()) + 1
        kq.append(((cx0 + x0, cy0 + y0, cx0 + x1, cy0 + y1), int(len(ys)), pq[y0:y1, x0:x1]))
    return kq


def _tong3(a, R):
    """Tong cua so (2R+1)^2 quanh moi diem (ngoai anh = 0)."""
    H, W = a.shape
    cc = np.pad(a, ((R + 1, R), (R + 1, R))).cumsum(0).cumsum(1)
    return cc[2 * R + 1:, 2 * R + 1:] - cc[:H, 2 * R + 1:] - cc[2 * R + 1:, :W] + cc[:H, :W]


def _tuyen3(pq):
    """Gia tri rieng nho cua hiep phuong sai toa do cac diem pq trong cua so 13x13 quanh moi diem (px^2). Net thang/cong
    rong 1-3 px: <= ~1; than chu, cho net cat/cham chu, mang dac: lon hon."""
    R = T9B3_TUYEN_R
    H, W = pq.shape
    q = pq.astype(np.float64)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float64)
    n = np.maximum(_tong3(q, R), 1.0)
    mx, my = _tong3(q * xx, R) / n, _tong3(q * yy, R) / n
    vxx = _tong3(q * xx * xx, R) / n - mx * mx
    vyy = _tong3(q * yy * yy, R) / n - my * my
    vxy = _tong3(q * xx * yy, R) / n - mx * my
    return (vxx + vyy) / 2.0 - np.sqrt(((vxx - vyy) / 2.0) ** 2 + vxy ** 2)


def _tach_net3(pq, hop, o):
    """Cum khong vua co chu (Loi 2): bo cum diem thang (net 1-3 px, moi huong) dai >= T9B3_KE (duong cheo hop bao) hoac phu het
    chieu rong / cao o PiP + 8; tra diem bo nam giua 2 phan con lai; gom lai thanh cum con (toa do vung doc).
    Khong bo duoc gi -> None."""
    tu = pq & (_tuyen3(pq) <= T9B3_TUYEN)
    ow, oh = o[2] - o[0], o[3] - o[1]
    L = np.zeros_like(pq)
    for y0, x0, y1, x1, _, rs in _cum_muc(tu):
        if math.hypot(x1 - x0, y1 - y0) >= T9B3_KE or x1 - x0 >= ow or y1 - y0 >= oh:
            for y, r0, r1 in rs:
                L[y, r0:r1] = True
    if not L.any():
        return None
    r = _tra3(pq & ~L, L)
    kq = []
    for (a, b, c, e), n, p2 in _cum3(r, (o[0] - hop[0], o[1] - hop[1], o[2] - hop[0], o[3] - hop[1])):
        kq.append(((a + hop[0], b + hop[1], c + hop[0], e + hop[1]), n, p2))
    return kq


def _bo_nghieng3(a, sh):
    """Dich dong y sang phai round(sh * (h - 1 - y)) px tren nen trang 255 (bo nghieng chu), cat le trang."""
    h, w = a.shape
    e = int(np.ceil(abs(sh) * h)) + 2
    r = np.full((h, w + 2 * e), 255, np.uint8)
    for y in range(h):
        dx = int(round(sh * (h - 1 - y)))
        r[y, e + dx:e + dx + w] = a[y]
    cs = np.nonzero((r < 255).any(axis=0))[0]
    return r[:, max(0, int(cs.min()) - 2):int(cs.max()) + 3] if len(cs) else r


def _xet3(hop, n, pq, o, sau=False):
    """Phan loai cum luot 3: [("doc"|"soat", hop, so diem, mat na)]. Vua co chu -> doc; khong vua -> tach net thang dai roi xet
    lai 1 lan; khong tach duoc / van khong vua -> soat (moi muc, Loi 3)."""
    ww, hh = hop[2] - hop[0], hop[3] - hop[1]
    if hh < T9B3_CAO[0] or ww < T9B3_RONG[0]:
        return []
    if hh <= T9B3_CAO[1] and ww <= T9B3_RONG[1] and T9B3_DAY[0] <= n / float(hh * ww) <= T9B3_DAY[1]:
        return [] if _chu_thap3(pq) else [("doc", hop, n, pq)]
    if sau:
        return [("soat", hop, n, pq)]
    kq = []
    if hh <= T9B3_CAO[1] and ww <= T9B3_DONG and T9B3_DAY[0] <= n / float(hh * ww) <= T9B3_DAY[1]:
        kq.append(("doc", hop, n, pq))                     # dong chu dinh lien: doc them, van xet tiep
    tach = _tach_net3(pq, hop, o)
    if tach is None:
        return kq + [("soat", hop, n, pq)]
    for h2, n2, p2 in tach:
        kq += _xet3(h2, n2, p2, o, True)
    return kq


def _khung3(qs, o):
    """Luot 3 cho 1 khung: qs = mat na moi muc. [(lo, hop, so, pq)]; soat nam trong hop soat khac cung khung bi bo."""
    ra = []
    for q in qs:
        for hop0, so0, pq0 in _cum3(q, o):
            ra += _xet3(hop0, so0, pq0, o)
    st = [i for i, r in enumerate(ra) if r[0] == "soat"]

    def trong(a, b):
        return b[0] <= a[0] and b[1] <= a[1] and a[2] <= b[2] and a[3] <= b[3]
    bo = set()
    for i in st:
        for j in st:
            if i != j and j not in bo and trong(ra[i][1], ra[j][1]) and (ra[i][1] != ra[j][1] or j < i):
                bo.add(i)
                break
    return [r for i, r in enumerate(ra) if i not in bo]


def _ve3(d, ds):
    """Luot 3: anh ghep v_<so>.png, moi cum 1 dong "Section <cum>". ds = [(khoa, anh xam cum)]."""
    meta = {}
    if not ds:
        return meta
    F = ImageFont.truetype(FONT_IN_FIGURE, T9B_DON_CO)
    _, t, _, b = F.getbbox(T9B_DON_DAN.strip())
    dan_w, cao, dong = int(F.getlength(T9B_DON_DAN)), b - t, T9B_DON_CO + 48
    for k0 in range(0, len(ds), T9B_DON_DONG):
        lo, gl = ds[k0:k0 + T9B_DON_DONG], []
        for _, a in lo:
            sc = cao / float(a.shape[0])
            gl.append(Image.fromarray(a).resize((max(1, int(round(a.shape[1] * sc))), cao), Image.LANCZOS))
        cv = Image.new("L", (60 + dan_w + max(g.size[0] for g in gl) + 60, 80 + dong * len(gl)), 255)
        dr = ImageDraw.Draw(cv)
        ten = "v_%05d.png" % (k0 // T9B_DON_DONG)
        meta[ten] = []
        for i, (g, (khoa, _)) in enumerate(zip(gl, lo)):
            yt = 40 + i * dong
            dr.text((60, yt - t), T9B_DON_DAN, font=F, fill=0)
            cv.paste(g, (60 + dan_w, yt))
            meta[ten].append({"y": [yt - 12, yt + cao + 12], "x_dan": 60 + dan_w, "khoa": khoa})
        cv.save(os.path.join(d, ten))
    return meta


def _doc_ky_kd(p):
    """Tep phieu KD ky mien tang 9b (ten YYYYMMDD-HHMM_*.md, ngay trong T9B_KY_THU_MUC). Tra (dong ky, sha256 tep, loi)."""
    if not p:
        return [], None, None
    ap_ = os.path.abspath(p)
    if os.path.normcase(os.path.dirname(ap_)) != os.path.normcase(os.path.abspath(T9B_KY_THU_MUC)) or not os.path.isfile(ap_):
        return [], None, "tep_ky_khong_nam_ngay_trong_%s" % T9B_KY_THU_MUC
    if not T9B_KY_TEN.match(os.path.basename(ap_)):
        return [], None, "tep_ky_ten_khong_dung_YYYYMMDD-HHMM_*.md(%s)" % os.path.basename(ap_)
    try:                                                   # NX100-1 (v3.7): ngay gio trong ten phai la ngay gio that
        time.strptime(os.path.basename(ap_)[:13], "%Y%m%d-%H%M")
    except ValueError:
        return [], None, "tep_ky_ten_ngay_gio_sai(%s)" % os.path.basename(ap_)
    ky = []
    for so, line in enumerate(open(ap_, encoding="utf-8-sig"), 1):
        mm = T9B_KY_RE.match(line.strip())
        if mm:
            ky.append({"video": mm.group(1), "f": [int(mm.group(2)), int(mm.group(3))],
                       "hop": [int(mm.group(i)) for i in range(4, 8)], "dong": so})
    return ky, sha256(ap_), None


def _kiem_ky(ky, vung, dt_o):
    """NX98-4/5: gioi han tung dong ky cua video nay. Tra (dong dung, [(so dong, ly do)])."""
    dung, sai = [], []
    for x in ky:
        (f0, f1), (h0, h1, h2, h3) = x["f"], x["hop"]
        ly = []
        if f0 > f1:
            ly.append("f%d>f%d" % (f0, f1))
        elif f1 - f0 + 1 > T9B_KY_KHUNG:
            ly.append("%d_khung>%d" % (f1 - f0 + 1, T9B_KY_KHUNG))
        if not (h0 < h2 and h1 < h3):
            ly.append("hop_rong")
        elif not (vung[0] <= h0 and vung[1] <= h1 and h2 <= vung[2] and h3 <= vung[3]):
            ly.append("hop_ra_ngoai_vung_doc")
        elif (h2 - h0) * (h3 - h1) > T9B_KY_DT * dt_o:
            ly.append("hop_%.2f_o>%.2f" % ((h2 - h0) * (h3 - h1) / float(dt_o), T9B_KY_DT))
        if ly:
            sai.append((x.get("dong"), ",".join(ly)))
        else:
            dung.append(x)
    return dung, sai


def _tru_ky(f0, f1, hop, ky, dem=None):
    """Bo cac khung [f0, f1] da duoc ky (hop nam trong hop ky). Tra cac doan con lai. dem[i] = [so su kien, so khung] dong i bo."""
    con = [[f0, f1]]
    for i, x in enumerate(ky):
        if not (x["hop"][0] <= hop[0] and x["hop"][1] <= hop[1] and hop[2] <= x["hop"][2] and hop[3] <= x["hop"][3]):
            continue
        moi, bo = [], 0
        for a, b in con:
            if b < x["f"][0] or a > x["f"][1]:
                moi.append([a, b])
                continue
            bo += min(b, x["f"][1]) - max(a, x["f"][0]) + 1
            if a < x["f"][0]:
                moi.append([a, x["f"][0] - 1])
            if b > x["f"][1]:
                moi.append([x["f"][1] + 1, b])
        con = moi
        if dem is not None and bo:
            dem[i][0] += 1
            dem[i][1] += bo
    return con


def _doan_lien(fs):
    r = []
    for f in fs:
        if r and r[-1][1] == f - 1:
            r[-1][1] = f
        else:
            r.append([f, f])
    return r


def tier9b(video, tran, tran_nguon, work, w, h, dur, ky_kd=None):
    base = {"ban_tran": tran and os.path.abspath(tran), "nguon_ban_tran": tran_nguon, "bo_1_ky_tu_1_khung": []}
    if (w, h) not in PIP_SPEC:
        return dict(base, ok=False, ly_do=["chu_duoi_pip:khong_co_dac_ta_pip_cho_khung_%dx%d" % (w, h)])
    if not tran or not os.path.isfile(tran):
        return dict(base, ok=False, ly_do=["chu_duoi_pip:khong_co_ban_tran_de_do(%s)" % (tran_nguon or "khong_khai")])
    tw, th, _ = probe(tran)
    if (tw, th) != (w, h):
        return dict(base, ok=False, ly_do=["chu_duoi_pip:ban_tran_khac_khung_%dx%d" % (tw, th)])
    ky_all, ky_sha, ky_loi = _doc_ky_kd(ky_kd)
    if ky_loi:
        return dict(base, ok=False, ly_do=["chu_duoi_pip:%s" % ky_loi])
    base["ban_tran_sha256"] = sha256(tran)
    vsha = sha256(video) if ky_all else None
    x0, y0, pw, ph = PIP_SPEC[(w, h)]
    a0, b0, a1, b1 = x0 - PIP_CROP, y0 - PIP_CROP, x0 + pw + PIP_CROP, y0 + ph + PIP_CROP      # o PiP + 8 px (nua mo)
    X0, Y0 = max(0, a0 - T9B_LE) // 2 * 2, max(0, b0 - T9B_LE) // 2 * 2
    cw, ch = (min(w, a1 + T9B_LE) - X0) // 2 * 2, (min(h, b1 + T9B_LE) - Y0) // 2 * 2
    X1, Y1 = X0 + cw, Y0 + ch
    ky, ky_sai = _kiem_ky([x for x in ky_all if x["video"] == vsha], [X0, Y0, X1, Y1], (a1 - a0) * (b1 - b0))
    if ky_kd:
        base["ky_kd"] = {"tep": os.path.abspath(ky_kd), "sha256": ky_sha, "so_dong": len(ky_all),
                         "dong_dung_video": len(ky) + len(ky_sai), "dong_ap_dung": len(ky),
                         "dong_vuot_gioi_han": [{"dong": a, "ly_do": b} for a, b in ky_sai],
                         "gioi_han": {"khung_moi_dong": T9B_KY_KHUNG, "dien_tich_hop_toi_da_o_pip8": T9B_KY_DT,
                                      "hop_trong_vung_doc": [X0, Y0, X1, Y1]}}
    o = (a0 - X0, b0 - Y0, a1 - X0, b1 - Y0)
    ke = (min(T9B3_KE, o[2] - o[0]), min(T9B3_KE, o[3] - o[1]))
    ngoai = np.ones((ch, cw), bool)
    ngoai[max(0, y0 - 2 - Y0):y0 + ph + 2 - Y0, max(0, x0 - 2 - X0):x0 + pw + 2 - X0] = False
    d = os.path.join(work, "t9b")
    os.makedirs(d, exist_ok=False)
    n = cw * ch * 3
    pt, pv = _ong_doc(tran, cw, ch, X0, Y0), _ong_doc(video, cw, ch, X0, Y0)
    k, ref, ocr_k, lech, lech_xau = 0, None, [], [], 0
    don = {}                                               # luot 2: anh ghep -> cac cum
    l3_truoc, l3 = None, []                                # luot 3: ma bam mat na khung truoc, ket qua khung truoc
    l3_anh, l3_khung, l3_soat = {}, {}, {}                 # khoa hinh cum -> anh / khung co; (hop, so diem) soat -> khung co
    l3_net = set()                                         # khoa hinh cum doc cham net dai L
    ly_do_ocr = Counter()
    try:
        while True:
            bt, bv = pt.stdout.read(n), pv.stdout.read(n)
            if len(bt) < n or len(bv) < n:
                break
            at = np.frombuffer(bt, np.uint8).reshape(ch, cw, 3)
            gt = at.mean(axis=2)
            gv = np.frombuffer(bv, np.uint8).reshape(ch, cw, 3).mean(axis=2)
            m = float(np.abs(gt - gv)[ngoai].mean())
            lech.append(m)
            lech_xau += m > T9B_KHOP
            ly = None
            if ref is None:
                ly = "dau"
            else:
                dd = np.abs(gt - ref) > T9B_DOI
                if float(dd.mean()) > T9B_DOI_TI_LE:
                    ly = "ti_le"
                elif int(dd[o[1]:o[3], o[0]:o[2]].sum()) >= T9B_DOI_O:
                    ly = "trong_o"
                elif k - ocr_k[-1] >= T9B_NHIP:
                    ly = "nhip"
            if ly:
                ly_do_ocr[ly] += 1
                ref = gt
                ocr_k.append(k)
                Image.fromarray(at).resize((cw * T9B_PHONG, ch * T9B_PHONG), Image.LANCZOS).save(
                    os.path.join(d, "u_%06d.jpg" % k), quality=95)
                don.update(_ghep_don(gt, d, k, a0 - X0, b0 - Y0, a1 - X0, b1 - Y0))
            # luot 3: moi khung
            dk = _diem3(at)
            q20, q40, L3 = _tach_ba3(dk, ke)
            hs = hashlib.md5(np.packbits(q20).tobytes() + np.packbits(q40).tobytes() + np.packbits(L3).tobytes()).digest()
            if hs != l3_truoc:
                l3_truoc, l3 = hs, []
                for lo, hop, so, pq in _khung3((q20, q40), o):
                    if lo == "doc":
                        khoa = (hop, hashlib.md5(np.packbits(pq).tobytes() + bytes(pq.shape)).hexdigest()[:16])
                        if khoa not in l3_anh:
                            v = dk[hop[1]:hop[3], hop[0]:hop[2]] * _no3(pq, 1)
                            vm = (255 - np.clip(v * 255.0 / max(float(v.max()), 1.0), 0, 255)).astype(np.uint8)
                            nh = np.where(pq, 0, 255).astype(np.uint8)
                            l3_anh[khoa] = [vm, nh] + [_bo_nghieng3(a_, sg * T9B3_NGHIENG)
                                                       for a_ in (nh, vm) for sg in (1, -1)]
                        if khoa not in l3_net and _cham3(L3, hop, pq):
                            l3_net.add(khoa)
                        l3.append(("doc", khoa))
                    else:
                        l3.append(("soat", (hop, so)))
            for lo, khoa in l3:
                (l3_khung if lo == "doc" else l3_soat).setdefault(khoa, []).append(k)
            k += 1
        du_t = len(bt) > 0 or bool(pt.stdout.read(1))
        du_v = len(bv) > 0 or bool(pv.stdout.read(1))
    finally:
        pt.stdout.close()
        pv.stdout.close()
        pt.wait()
        pv.wait()
    out = os.path.join(work, "t9b_ocr.jsonl")
    subprocess.run(["powershell.exe", "-NoLogo", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass",
                    "-File", os.path.join(HERE34, "ocr_win_tu.ps1"), "-Dir", d, "-Out", out, "-Filter", "u_*.jpg"], check=True)
    cham = {}                                              # khung OCR -> [(chu, hop toan cuc, so diem muc trong o, luot)]
    with open(out, encoding="utf-8-sig") as f:
        for line in f:
            if not line.strip():
                continue
            j = json.loads(line)
            ki = int(j["f"][2:8])
            g = None
            for s, x, y, ww, hh in (j.get("w") or []):
                if not T9B_CHU.search(s):
                    continue
                gx0, gy0 = X0 + x / T9B_PHONG, Y0 + y / T9B_PHONG
                gx1, gy1 = gx0 + ww / T9B_PHONG, gy0 + hh / T9B_PHONG
                if not (gx1 > a0 and gx0 < a1 and gy1 > b0 and gy0 < b1):
                    continue
                if g is None:
                    g = np.asarray(Image.open(os.path.join(d, j["f"])).convert("L"), dtype=np.float32)
                hp = g[max(0, y):y + hh, max(0, x):x + ww]
                if not hp.size:
                    continue
                muc = np.abs(hp - np.median(hp)) > T9B_MUC
                ix0 = int(max(0, (a0 - X0) * T9B_PHONG - x))
                iy0 = int(max(0, (b0 - Y0) * T9B_PHONG - y))
                ix1 = int(min(ww, (a1 - X0) * T9B_PHONG - x))
                iy1 = int(min(hh, (b1 - Y0) * T9B_PHONG - y))
                so = int(muc[iy0:iy1, ix0:ix1].sum()) // (T9B_PHONG * T9B_PHONG)
                if so >= T9B_MUC_MIN:
                    cham.setdefault(ki, []).append((s, [round(gx0), round(gy0), round(gx1), round(gy1)], so, "luot1"))
    don_tu = 0                                             # luot 2: so cum OCR doc ra chu/so sau chu dan
    if don:
        out2 = os.path.join(work, "t9b_ocr_don.jsonl")
        subprocess.run(["powershell.exe", "-NoLogo", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass",
                        "-File", os.path.join(HERE34, "ocr_win_tu.ps1"), "-Dir", d, "-Out", out2, "-Filter", "s_*.png"],
                       check=True)
        with open(out2, encoding="utf-8-sig") as f:
            for line in f:
                if not line.strip():
                    continue
                j = json.loads(line)
                ki = int(j["f"][2:8])
                for s, x, y, ww, hh in (j.get("w") or []):
                    for c in don.get(j["f"], []):
                        if not (c["y"][0] <= y + hh / 2.0 <= c["y"][1] and x + ww > c["x_dan"] + 4):
                            continue
                        if x < c["x_dan"] - 8:                 # OCR noi chu dan voi cum ("SectionA"): bo phan chu dan
                            s = s[len(T9B_DON_DAN.strip()):]
                        if T9B_DON_KY.fullmatch(s):
                            hx0, hy0, hx1, hy1 = c["hop"]
                            cham.setdefault(ki, []).append((s, [X0 + hx0, Y0 + hy0, X0 + hx1, Y0 + hy1], c["trong"], "luot2"))
                            don_tu += 1
                        break
    # luot 3: OCR moi hinh cum khac nhau 1 lan
    meta3 = _ve3(d, [(kh, a) for kh, aa in sorted(l3_anh.items(), key=lambda t: (t[0][0][1], t[0][0][0], t[0][1]))
                     for a in aa])                          # moi hinh cum 6 dong: muc dam, nhi phan, nhi/muc bo nghieng +/-
    doc3, doc3_khac = {}, {}                               # khoa -> chu doc duoc (dung luat) / doc ra nhung khong dung luat
    if meta3:
        out3 = os.path.join(work, "t9b_ocr_luot3.jsonl")
        subprocess.run(["powershell.exe", "-NoLogo", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass",
                        "-File", os.path.join(HERE34, "ocr_win_tu.ps1"), "-Dir", d, "-Out", out3, "-Filter", "v_*.png"],
                       check=True)
        with open(out3, encoding="utf-8-sig") as f:
            for line in f:
                if not line.strip():
                    continue
                j = json.loads(line)
                ws = j.get("w") or []
                for c in meta3.get(j["f"], []):              # theo dong: chu ben phai tu "Section" OCR thay (toa do OCR co the troi)
                    dg = [t for t in ws if c["y"][0] <= t[2] + t[4] / 2.0 <= c["y"][1]]
                    dn = [t for t in dg if t[0].startswith(T9B_DON_DAN.strip())]
                    if dn:
                        xr = dn[0][1] + dn[0][3]
                        ung = [dn[0][0][len(T9B_DON_DAN.strip()):]] + [t[0] for t in dg if t is not dn[0] and t[1] >= xr - 4]
                    else:
                        ung = [t[0] for t in dg if t[1] + t[3] > c["x_dan"] + 4]
                    for s in ung:
                        if T9B3_KY.fullmatch(s):
                            doc3.setdefault(c["khoa"], s)          # giu lan doc dung luat dau tien theo thu tu ban ve
                            break
                        if s:
                            doc3_khac.setdefault(c["khoa"], s)
    for kh in doc3:
        doc3_khac.pop(kh, None)
    fps = k / dur if dur else 0.0
    ke_ = ocr_k[1:] + [k]                                  # khung OCR dai dien cho cac khung khong doi sau no
    nhip = dict(zip(ocr_k, ke_))
    sk = []                                                # su kien: (f0, f1, chu, hop toan cuc, loai, luot)
    for ki in sorted(cham):
        for s, hop, so, lu in cham[ki]:
            sk.append((ki, nhip[ki] - 1, s, hop, "doc", lu))
    for khoa, s in doc3.items():
        hop = [X0 + khoa[0][0], Y0 + khoa[0][1], X0 + khoa[0][2], Y0 + khoa[0][3]]
        for f0, f1 in _doan_lien(l3_khung[khoa]):
            sk.append((f0, f1, s, hop, "doc", "luot3"))
    for khoa, s in doc3_khac.items():                      # NX98-3: OCR ra chu khong dung mau -> soat
        hop = [X0 + khoa[0][0], Y0 + khoa[0][1], X0 + khoa[0][2], Y0 + khoa[0][3]]
        for f0, f1 in _doan_lien(l3_khung[khoa]):
            sk.append((f0, f1, "[soat ocr:%s]" % s, hop, "soat", "luot3"))
    rong = [kh for kh in l3_khung if kh not in doc3 and kh not in doc3_khac]
    rong_net = [kh for kh in rong if kh in l3_net]
    for khoa in rong:                                      # v3.7 (Loi 2 phieu KD 100): MOI cum doc OCR khong ra chu -> soat
        hop = [X0 + khoa[0][0], Y0 + khoa[0][1], X0 + khoa[0][2], Y0 + khoa[0][3]]
        for f0, f1 in _doan_lien(l3_khung[khoa]):
            sk.append((f0, f1, "[soat ocr:rong net]" if khoa in l3_net else "[soat ocr:rong]", hop, "soat", "luot3"))
    for (hp, so), fs in l3_soat.items():
        hop = [X0 + hp[0], Y0 + hp[1], X0 + hp[2], Y0 + hp[3]]
        for f0, f1 in _doan_lien(fs):
            sk.append((f0, f1, "[soat %dx%d %dd]" % (hp[2] - hp[0], hp[3] - hp[1], so), hop, "soat", "luot3"))
    mien, sk2 = [], []
    dem = [[0, 0] for _ in ky]
    f_truoc, f_sau, f_mien = set(), set(), set()
    for f0, f1, s, hop, lo, lu in sk:
        con = _tru_ky(f0, f1, hop, ky, dem) if ky else [[f0, f1]]
        f_truoc.update(range(f0, f1 + 1))
        if con != [[f0, f1]]:
            mien.append({"f": [f0, f1], "chu": s, "hop": hop, "loai": lo, "luot": lu, "con_lai": con})
            f_mien.update(set(range(f0, f1 + 1)).difference(*[range(a, b + 1) for a, b in con]))
        for a, b in con:
            sk2.append((a, b, s, hop, lo, lu))
            f_sau.update(range(a, b + 1))
    if ky_kd:
        base["ky_kd"].update(khung_co_mien=len(f_mien), tran_tong_khung_mien=T9B_KY_TONG,
                             dong_khong_mien=[x.get("dong") for x, e in zip(ky, dem) if not e[0]],
                             khung_co_su_kien_truoc_mien=len(f_truoc), khung_mien=len(f_truoc) - len(f_sau),
                             ti_le_khung_mien=round((len(f_truoc) - len(f_sau)) / float(len(f_truoc)), 4) if f_truoc else 0.0,
                             theo_dong=[{"dong": x.get("dong"), "f": x["f"], "hop": x["hop"], "so_su_kien_mien": e[0],
                                         "so_khung_mien": e[1]} for x, e in zip(ky, dem)])
    sk2.sort(key=lambda t: (t[0], t[1]))
    doan = []
    for f0, f1, s, hop, lo, lu in sk2:
        if doan and f0 <= doan[-1]["f_cuoi"] + 1:
            x = doan[-1]
            x["f_cuoi"] = max(x["f_cuoi"], f1)
            x["tu"].add(s)
            x["loai"].add(lo)
            x["luot"].add(lu)
            x["so_su_kien"] += 1
        else:
            doan.append({"f_dau": f0, "f_cuoi": f1, "tu": {s}, "hop_dau": hop, "loai": {lo}, "luot": {lu}, "so_su_kien": 1})
    for x in doan:
        x["tu"], x["luot"] = sorted(x["tu"]), sorted(x["luot"])
        x["loai"] = "doc" if "doc" in x["loai"] else "soat"
        x["t_dau_s"] = round(x["f_dau"] / fps, 3) if fps else None
    so_khung = sum(x["f_cuoi"] - x["f_dau"] + 1 for x in doan)
    khop = 1.0 - lech_xau / (len(lech) or 1)
    reasons = []
    if not k:
        reasons.append("chu_duoi_pip:khong_doc_duoc_khung_nao")
    if du_t or du_v:
        reasons.append("chu_duoi_pip:ban_tran_khac_so_khung_video(%s_con_khung)" % ("ban_tran" if du_t else "video"))
    if k and khop < T9B_KHOP_MIN:
        reasons.append("chu_duoi_pip:ban_tran_khong_khop_video_ngoai_o_%.1f%%_khung<%.0f%%" % (100 * khop, 100 * T9B_KHOP_MIN))
    if len(f_mien) > T9B_KY_TONG:                          # NX100-1 (v3.7)
        reasons.append("chu_duoi_pip:ky_kd_mien_%d_khung>%d_tran_tong_moi_video" % (len(f_mien), T9B_KY_TONG))
    if ky_sai:
        reasons.append("chu_duoi_pip:ky_kd_%d_dong_vuot_gioi_han_khong_ap_dung: %s" % (
            len(ky_sai), "; ".join("dong %s %s" % (a, b) for a, b in ky_sai[:8])))
    if doan:
        nd = sum(x["loai"] == "doc" for x in doan)
        reasons.append("chu_duoi_pip:%d_doan_%d_khung_trong_o_pip+%dpx(doc_%d,soat_%d): %s%s" % (
            len(doan), so_khung, PIP_CROP, nd, len(doan) - nd,
            "; ".join("f%d-f%d %s %s" % (x["f_dau"], x["f_cuoi"], x["loai"], "/".join(x["tu"])[:40]) for x in doan[:8]),
            "" if len(doan) <= 8 else "; ... (+%d doan, du trong 'doan')" % (len(doan) - 8)))
    return dict(base, ok=not reasons, ly_do=reasons, o_pip_cong_8=[a0, b0, a1, b1], vung_doc=[X0, Y0, X1, Y1],
                so_khung=k, so_khung_ocr=len(ocr_k), ly_do_khung_ocr=dict(ly_do_ocr),
                lech_ngoai_o={"trung_vi": round(float(np.median(lech)), 2) if lech else None,
                              "lon_nhat": round(max(lech), 2) if lech else None, "ti_le_khop": round(khop, 4)},
                so_cum_don=sum(len(x) for x in don.values()), so_anh_don=len(don), so_chu_don=don_tu,
                luot3={"so_hinh_cum_doc": len(l3_anh), "so_hinh_doc_ra_chu": len(doc3), "so_anh": len(meta3),
                       "so_cum_soat": len(l3_soat), "so_hinh_soat_ocr": len(doc3_khac), "so_hinh_cham_net": len(l3_net), "so_hinh_rong_net": len(rong_net), "so_hinh_rong": len(rong),
                       "doc_ra": sorted("%s@%d,%d,%d,%d" % (s, X0 + kh[0][0], Y0 + kh[0][1], X0 + kh[0][2], Y0 + kh[0][3])
                                        for kh, s in doc3.items()),
                       "doc_ra_khong_tinh": sorted("%s@%d,%d,%d,%d" % (s, X0 + kh[0][0], Y0 + kh[0][1], X0 + kh[0][2],
                                                                      Y0 + kh[0][3]) for kh, s in doc3_khac.items())},
                so_doan=len(doan), so_doan_soat=sum(x["loai"] == "soat" for x in doan), so_khung_co_chu=so_khung,
                doan=doan, mien_ky_kd=mien,
                su_kien=[{"f_dau": f0, "f_cuoi": f1, "chu": s, "hop": hop, "loai": lo, "luot": lu} for f0, f1, s, hop, lo, lu in sk2])


# ---------------------------------------------------------------- tang 1-6, 8
def jacc(a, b):
    a, b = set(a), set(b)
    return len(a & b) / float(len(a | b) or 1)


def grams(s, n=3):
    w = words(s)
    return {" ".join(w[i:i + n]) for i in range(max(0, len(w) - n + 1))}


def cos(a, b):
    ks = set(a) | set(b)
    va, vb = [a.get(k, 0) for k in ks], [b.get(k, 0) for k in ks]
    na, nb = math.sqrt(sum(x * x for x in va)), math.sqrt(sum(x * x for x in vb))
    return sum(x * y for x, y in zip(va, vb)) / (na * nb or 1)


def corpus_tiers(f, corpus, frame_hashes):
    lab = lambda r: r.get("nhan", r.get("_path"))
    res = {}
    t = {"ok": True, "ly_do": [], "so_sanh_voi": len(corpus)}
    for r in corpus:
        j = jacc(f["idea_tokens"], r["dac_trung"].get("idea_tokens", []))
        if j >= T1_IDEA_JACCARD:
            t["ly_do"].append("trung_y_tuong_jaccard_%.2f:%s" % (j, lab(r)))
    res["1_y_tuong"] = t
    t = {"ok": True, "ly_do": [], "so_sanh_voi": len(corpus)}
    for r in corpus:
        other = r["dac_trung"].get("lead", "")
        j = jacc(grams(f["lead"]), grams(other))
        same = words(f["lead"])[:T2_LEAD_SAME_WORDS] == words(other)[:T2_LEAD_SAME_WORDS] and words(other)
        if j >= T2_LEAD_JACCARD or same:
            t["ly_do"].append("trung_lead_%s:%s" % ("6_tu_dau" if same else "jaccard_%.2f" % j, lab(r)))
    res["2_lead"] = t
    t = {"ok": True, "ly_do": [], "so_sanh_voi": len(corpus)}
    for r in corpus:
        q = difflib.SequenceMatcher(None, f["struct_seq"], r["dac_trung"].get("struct_seq", [])).ratio()
        if q >= T3_STRUCT_RATIO:
            t["ly_do"].append("trung_trinh_tu_canh_%.2f:%s" % (q, lab(r)))
    res["3_cau_truc"] = t
    t = {"ok": True, "ly_do": [], "so_sanh_voi": len(corpus), "khung_du_thong_tin": len(frame_hashes)}
    t["khong_cung_kieu_hash"] = [lab(r) for r in corpus if r.get("dhash_kieu") != DHASH_KIEU]
    for r in corpus:
        oh = [int(x, 16) for x in r.get("frame_dhash", [])] if r.get("dhash_kieu") == DHASH_KIEU else []
        if oh and frame_hashes:
            hit = sum(any(ham(x, y) <= T4_HAMMING for y in oh) for x in frame_hashes) / float(len(frame_hashes))
            if hit >= T4_FRAC:
                t["ly_do"].append("trung_hinh_%.0f%%_khung:%s" % (100 * hit, lab(r)))
    res["4_hinh_anh"] = t
    t = {"ok": True, "ly_do": [], "so_sanh_voi": len(corpus)}
    for r in corpus:
        o = r["dac_trung"]
        c = cos(f["struct_hist"], o.get("struct_hist", {}))
        nb = abs(f["n_beats"] - o.get("n_beats", 0)) / float(max(f["n_beats"], o.get("n_beats", 0), 1))
        du = abs(f["duration_s"] - o.get("duration_s", 0)) / float(max(f["duration_s"], o.get("duration_s", 0), 1))
        if c >= T5_HIST_COS and nb <= T5_LEN_TOL and du <= T5_LEN_TOL:
            t["ly_do"].append("khuon_dinh_dang_hoan_doi_duoc(cos=%.3f,beat%+.0f%%,dur%+.0f%%):%s" % (c, 100 * nb, 100 * du, lab(r)))
    res["5_trung_cau_truc"] = t
    t = {"ok": True, "ly_do": [], "so_sanh_voi": len(corpus)}
    if "thumb_dhash" not in f:
        t["ly_do"].append("khong_co_thumbnail_de_kiem")
    else:
        for r in corpus:
            o = r["dac_trung"].get("thumb_dhash")
            if o and ham(int(f["thumb_dhash"], 16), int(o, 16)) <= T6_HAMMING:
                t["ly_do"].append("trung_thumbnail_hamming_%d:%s" % (ham(int(f["thumb_dhash"], 16), int(o, 16)), lab(r)))
    res["6_trung_thumbnail"] = t
    for v in res.values():
        v["ok"] = not v["ly_do"]
    return res


def tier8(texts):
    hits = []
    for src, txt in texts:
        for name, rx in BAIT_RE:
            for m in re.finditer(rx, txt, re.I):
                hits.append("%s:%s:%r" % (name, src, txt[max(0, m.start() - 20):m.end() + 20]))
    return {"ok": not hits, "ly_do": hits, "nguon_quet": [s for s, _ in texts]}


# ---------------------------------------------------------------- chi so
def metrics(log_p, warehouse):
    runs = [json.loads(l) for l in open(log_p, encoding="utf-8") if l.strip()] if os.path.exists(log_p) else []
    n = len(runs)
    last = runs[-20:]
    depth = {}
    if os.path.isdir(warehouse):
        for ch in sorted(os.listdir(warehouse)):
            rd = os.path.join(warehouse, ch, "ready")
            if os.path.isdir(rd):
                depth[ch] = sum(os.path.isdir(os.path.join(rd, x)) for x in os.listdir(rd))
    by_tier = Counter(t for r in runs for t in r.get("tang_truot", []))
    return {"gate_pass_rate": round(sum(r["qua"] for r in runs) / float(n), 4) if n else None,
            "gate_pass_rate_20_luot_cuoi": round(sum(r["qua"] for r in last) / float(len(last)), 4) if last else None,
            "so_luot": n,
            "warehouse_depth": depth if depth else ("warehouse_chua_ton_tai:%s" % warehouse
                                                    if not os.path.isdir(warehouse) else 0),
            "rejection_reason_theo_tang": dict(sorted(by_tier.items()))}


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--bundle", required=True, help="thu muc co script.json, description.md, titles.json, thumbnail.png")
    ap.add_argument("--video", required=True)
    ap.add_argument("--work", required=True, help="thu muc RONG do nguoi goi so huu (khung trich + ocr.jsonl)")
    ap.add_argument("--accent", required=True, help="mau nhan kenh R,G,B (vien PiP §19.3)")
    ap.add_argument("--label", required=True, help="nhan bai trong bao cao/log")
    ap.add_argument("--step", type=float, default=3.0, help="giay giua hai khung mau")
    ap.add_argument("--out-dir", default=OUT_DEFAULT)
    ap.add_argument("--corpus", nargs="*", default=CORPUS_DEFAULT)
    ap.add_argument("--n-recent", type=int, default=30)
    ap.add_argument("--offline", action="store_true", help="khong goi Crossref -> DOI chua xac minh = TRUOT")
    ap.add_argument("--ass", default=None,
                    help="chrome.ass de doi chieu DOI tung byte (tang 7b); mac dinh <thu_muc_video>\\_build\\chrome.ass")
    ap.add_argument("--render", default=None,
                    help="render.py da dung bundle, de doi chieu khai in_figure voi chu THAT ve tren hinh "
                         "(7b.2 bit H7); mac dinh <bundle>\\render.py")
    ap.add_argument("--canh", default=None,
                    help="7b.4: canh.py da dung video (ban manim) = nguon chu that de doi chieu DOI; CHI co hieu luc khi "
                         "khong co --ass va khong co <thu_muc_video>\\_build\\chrome.ass. Khong --canh -> 7b y nhu cu")
    ap.add_argument("--tran", default=None,
                    help="v3.4 tang 9b: ban tran (video truoc khi chong PiP) cua --video; mac dinh khoa ban_tran "
                         "trong <video>.render.json. Khong co -> tang 9b TRUOT")
    ap.add_argument("--ky-kd", default=None,
                    help="v3.5/v3.6 tang 9b: tep phieu KD YYYYMMDD-HHMM_*.md (ngay trong out/_kiem_dinh/phieu) co dong KY9B mien doan da ky")
    a = ap.parse_args()
    accent = tuple(int(x) for x in a.accent.split(","))
    ts = time.strftime("%Y-%m-%dT%H:%M:%S")

    sp, desc, titles = load_bundle(a.bundle)
    w, h, dur = probe(a.video)
    vsha = sha256(a.video)
    sp_p = os.path.join(a.bundle, "script.json")
    bind = {"video": os.path.abspath(a.video), "video_sha256": vsha, "script_sha256": sha256(sp_p),
            "video_mtime": time.strftime("%Y-%m-%dT%H:%M:%S", time.localtime(os.path.getmtime(a.video))),
            "script_mtime": time.strftime("%Y-%m-%dT%H:%M:%S", time.localtime(os.path.getmtime(sp_p))),
            "khung": [w, h], "thoi_luong_s": round(dur, 2)}
    warn = []
    if os.path.getmtime(sp_p) > os.path.getmtime(a.video):
        warn.append("script.json_MOI_HON_video: video khong duoc dung tu script nay -> khai bao trong script khong chung minh gi")

    frames = extract(a.video, a.work, a.step, w, h)
    ocr_res = ocr(a.work)
    fh = []
    for _, p in frames:
        im = Image.open(p)
        if float(np.asarray(im.convert("L"), dtype=np.float32).std()) >= T4_MIN_STD:
            fh.append(dhash(im))
    feat = features(sp, titles, dur, os.path.join(a.bundle, "thumbnail.png"))
    if feat["so_beat_khong_scene"]:                       # diem 9: khong LOAI, ghi ro tang 1/3/5 thieu du lieu canh
        warn.append("script_khong_co_scene_o_%d/%d_beat: tang 3/5 so sanh cau truc theo nhan rong, tang 1 khong co doan section"
                    % (feat["so_beat_khong_scene"], feat["n_beats"]))
    if feat["so_beat_src_chuoi"]:                         # diem 8: chuoi tron = ma nguon, khong cite / in_figure
        warn.append("src_la_chuoi_o_%d/%d_beat: ca chuoi duoc coi la code (khong cite, khong in_figure)"
                    % (feat["so_beat_src_chuoi"], feat["n_beats"]))
    corpus, broken = load_corpus(a.corpus, a.n_recent, vsha)

    tiers = corpus_tiers(feat, corpus, fh)
    tiers["7_neo_nguon_so_cap"] = tier7(sp, desc, frames, ocr_res, a.offline)
    tiers["7b_doi_ass_cmap"] = tier7b(sp, a.ass or os.path.join(
        os.path.dirname(os.path.abspath(a.video)), "_build", "chrome.ass"),
        a.render or os.path.join(a.bundle, "render.py"),
        None if a.ass else a.canh, a.video)         # 7b.4: co --ass -> bo qua --canh
    if a.canh and a.ass:
        tiers["7b_doi_ass_cmap"]["canh"] = {"duong": os.path.abspath(a.canh),
                                            "bo_qua": "co --ass: doi chieu chrome.ass nhu cu"}
    tiers["8_caption_moi_tuong_tac"] = tier8([("titles.json", t) for t in titles] +
                                             [("script.meta.title", sp.get("meta", {}).get("title", "")),
                                              ("description.md", desc)])
    tiers["9_neo_danh_tinh_pip"] = tier9(a.work, frames, w, h, accent)
    tran, tran_nguon = (a.tran, "--tran") if a.tran else tim_ban_tran(a.video)      # v3.4 tang 9b
    tiers["9b_chu_duoi_pip"] = tier9b(a.video, tran, tran_nguon, a.work, w, h, dur, ky_kd=a.ky_kd)
    tiers = dict(sorted(tiers.items()))
    failed = [k for k, v in tiers.items() if not v["ok"]]

    csha = sha256(os.path.abspath(__file__))              # sha ban cong dang chay -> bao cao + gate_log (lenh GD 20:20 27/09)
    rep = {"cong": "§3.6 (9 tang)", "ts": ts, "nhan": a.label, "qua_cong": not failed, "tang_truot": failed,
           "rejection_reason": {k: tiers[k]["ly_do"] for k in failed}, "canh_bao": warn,
           "kho_so_sanh": {"so_bai": len(corpus), "bao_cao_hong": broken, "mau": a.corpus},
           "rang_buoc": bind, "video_sha256": vsha, "tang": tiers, "dac_trung": feat,
           "frame_dhash": ["%016x" % x for x in fh], "dhash_kieu": DHASH_KIEU,
           "ma_cong_sha256": csha[:12], "cong_sha256": csha}
    os.makedirs(os.path.join(a.out_dir, "reports"), exist_ok=True)
    stem = "%s__%s" % (re.sub(r"[^\w.-]+", "_", a.label), ts.replace(":", ""))
    rp = os.path.join(a.out_dir, "reports", stem + ".json")
    log_p = os.path.join(a.out_dir, "gate_log.jsonl")
    with open(log_p, "a", encoding="utf-8") as f:
        f.write(json.dumps({"ts": ts, "nhan": a.label, "video_sha256": vsha, "qua": not failed,
                            "tang_truot": failed, "bao_cao": rp, "cong_sha256": csha}, ensure_ascii=False) + "\n")
    with open(os.path.join(a.out_dir, "rejection_reason.log"), "a", encoding="utf-8") as f:
        for k in failed:                                   # MOT DONG MOT TANG - khong gop
            f.write("%s\t%s\t%s\t%s\n" % (ts, a.label, k, " | ".join(tiers[k]["ly_do"])))
    rep["chi_so"] = metrics(log_p, WAREHOUSE)
    js = json.dumps(rep, ensure_ascii=False, indent=1)
    open(rp, "w", encoding="utf-8").write(js)
    if failed:                                             # rejected\ - GIU LAI, KHONG XOA (§3.6)
        os.makedirs(os.path.join(a.out_dir, "rejected"), exist_ok=True)
        open(os.path.join(a.out_dir, "rejected", stem + ".json"), "w", encoding="utf-8").write(js)

    print("CONG §3.6 [%s]: %s" % (a.label, "QUA" if not failed else "LOAI"))
    for k, v in tiers.items():
        print("  %-26s %s  %s" % (k, "ok " if v["ok"] else "TRUOT", " | ".join(v["ly_do"])[:300]))
    for x in warn:
        print("  CANH BAO:", x)
    print("  chi_so:", json.dumps(rep["chi_so"], ensure_ascii=False))
    print("  bao_cao:", rp)
    return 0 if not failed else 3


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    try:
        sys.exit(main())
    except SystemExit:
        raise
    except Exception as e:
        print("LOI_CHAY (khong ket luan): %s: %s" % (type(e).__name__, e))
        sys.exit(2)
