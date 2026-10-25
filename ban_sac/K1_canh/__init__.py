"""Thư viện cảnh Meniscus Lab (kênh K1): gói K1_canh. Tách nguyên văn từ out/MENISCUS_LAB/canh_ml.py, canh_ml_doc.py,
canh_m1_doc.py và out/M1_NUOC/canh.py (NGUON_TACH.json ghi dòng nguồn, sha256 nguồn và tệp ra).
Dùng: đặt khung trước (K1_canh.khung.dat_doc() cho 9:16, dat_ngang() cho 16:9), rồi import loi, giot, hinh, thiet_bi, doc,
ngang, ngang_m1, doc_ml, doc_m1 và gọi loi.nap_tap(thư mục tập, snap_env, kịch bản) hoặc đặt Beat.TAP.
Mọi mô-đun import K1_ban_quang_hoc (bản sắc kênh, BS-4(a)); lint: ban_sac/lint_bs4.py K1 <tệp>."""
import sys
from pathlib import Path

_BAN_SAC = str(Path(__file__).resolve().parent.parent)
if _BAN_SAC not in sys.path:
    sys.path.insert(0, _BAN_SAC)
import K1_ban_quang_hoc  # noqa: E402,F401  bản sắc kênh Meniscus Lab (BS-4(a))
