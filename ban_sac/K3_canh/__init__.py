# Thư viện cảnh K3 (Strata Notes) — mỗi loại cảnh một lớp có tham số; hai bố cục bo_cuc_16x9() / bo_cuc_9x16() dùng chung một lõi vẽ.
# Thứ tự dùng (tệp cảnh sinh bởi tools/nha_may.py): dat_ngang()/dat_doc() của K3_canh.khung TRƯỚC, rồi mới import K3_canh.loi và các lớp.
import sys
from pathlib import Path

_BAN_SAC = Path(__file__).resolve().parent.parent
if str(_BAN_SAC) not in sys.path:
    sys.path.insert(0, str(_BAN_SAC))
import K3_so_thuc_dia  # noqa: F401  (lint_bs4: module kênh K3_)
