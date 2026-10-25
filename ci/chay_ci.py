# -*- coding: utf-8 -*-
"""ci/chay_ci.py — vỏ chạy dây chuyền cũ (nha_may_kenh + Manim + cổng 7b4) trên máy GitHub Actions, KHÔNG sửa mã dây chuyền.

Chỉ đổi 2 điều kiện máy, vì máy chạy CI là máy dùng một lần:
  1. bước "may" (D10: commit/RAM/ổ C của máy nhà) -> chỉ ghi số đo, không dừng;
  2. không có iGPU -> dùng thẳng tham số libx264 cũ (X264_LUI) thay QSV, bỏ cặp giải mã h264_qsv.
Mọi tham số khác chuyển nguyên cho tools/nha_may_kenh.py.
"""
import os
import sys
import time

GOC = "E:/Studio"
sys.path.insert(0, GOC + "/tools")
import nha_may as NM            # noqa: E402

NM.QSV[:] = NM.X264_LUI
NM.GIAI_MA_QSV[:] = []


def may_ci(self, lo):
    self.log("máy CI trước lô %s: bỏ cổng D10 máy nhà (runner dùng một lần)" % lo)
    return {}


NM.NhaMay.may = may_ci

import nha_may_kenh             # noqa: E402

t0 = time.time()
try:
    nha_may_kenh.main()
finally:
    print("CI_THOI_GIAN_S %.1f" % (time.time() - t0), flush=True)
