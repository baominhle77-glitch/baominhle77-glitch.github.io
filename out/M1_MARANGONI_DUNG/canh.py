# -*- coding: utf-8 -*-
# Tệp cảnh ML_K1_t3 — SINH bởi tools/nha_may_k1.py từ out/M1_XAPHONG/storyboard.json sha256-8 9fa65270; KHÔNG sửa tay.
# Mỗi beat một lớp TrangK1 (ban_sac/K1_canh/trang.py); lớp cảnh + tham số + lời đọc từ _build/ke_hoach.json.
# Dòng nguồn góc trên phải do TrangK1 vẽ từ tham_so.nguon; tập này không có DOI.
import os
from K1_canh import khung

(khung.dat_doc if os.environ.get('K3_BO_CUC') == '9x16' else khung.dat_ngang)()
import K1_ban_quang_hoc  # noqa: E402,F401
from K1_canh.trang import TrangK1  # noqa: E402
import vung_cam  # noqa: E402 — vùng cấm PiP từ t3 (lệnh GĐ 2240 mục 3c)
import K1_canh.trang as _vc_bo_cuc  # noqa: E402
vung_cam.ap(_vc_bo_cuc, 'b3747a29')
import K1_canh.lop_t3  # noqa: E402,F401 — lớp cảnh của tập
from K1_canh.mo_phong_c17_v2 import SceneK1T3 as TrangK1


class h1(TrangK1):
    B = 'h1'

    def construct(self):
        self.chay()

class h2(TrangK1):
    B = 'h2'

    def construct(self):
        self.chay()

class h3(TrangK1):
    B = 'h3'

    def construct(self):
        self.chay()

class h4(TrangK1):
    B = 'h4'

    def construct(self):
        self.chay()

class c1(TrangK1):
    B = 'c1'

    def construct(self):
        self.chay()

class p1(TrangK1):
    B = 'p1'

    def construct(self):
        self.chay()

class p2(TrangK1):
    B = 'p2'

    def construct(self):
        self.chay()

class p3(TrangK1):
    B = 'p3'

    def construct(self):
        self.chay()

class p4(TrangK1):
    B = 'p4'

    def construct(self):
        self.chay()

class p5(TrangK1):
    B = 'p5'

    def construct(self):
        self.chay()

class p6(TrangK1):
    B = 'p6'

    def construct(self):
        self.chay()

class c2(TrangK1):
    B = 'c2'

    def construct(self):
        self.chay()

class v1(TrangK1):
    B = 'v1'

    def construct(self):
        self.chay()

class v2(TrangK1):
    B = 'v2'

    def construct(self):
        self.chay()

class v3(TrangK1):
    B = 'v3'

    def construct(self):
        self.chay()

class v4(TrangK1):
    B = 'v4'

    def construct(self):
        self.chay()

class v5(TrangK1):
    B = 'v5'

    def construct(self):
        self.chay()

class v6(TrangK1):
    B = 'v6'

    def construct(self):
        self.chay()

class v7(TrangK1):
    B = 'v7'

    def construct(self):
        self.chay()

class c3(TrangK1):
    B = 'c3'

    def construct(self):
        self.chay()

class w1(TrangK1):
    B = 'w1'

    def construct(self):
        self.chay()

class w2(TrangK1):
    B = 'w2'

    def construct(self):
        self.chay()

class w3(TrangK1):
    B = 'w3'

    def construct(self):
        self.chay()

class w4(TrangK1):
    B = 'w4'

    def construct(self):
        self.chay()

class w5(TrangK1):
    B = 'w5'

    def construct(self):
        self.chay()

class w6(TrangK1):
    B = 'w6'

    def construct(self):
        self.chay()

class w7(TrangK1):
    B = 'w7'

    def construct(self):
        self.chay()

class b1(TrangK1):
    B = 'b1'

    def construct(self):
        self.chay()

class r1(TrangK1):
    B = 'r1'

    def construct(self):
        self.chay()

class r2(TrangK1):
    B = 'r2'

    def construct(self):
        self.chay()

class r3(TrangK1):
    B = 'r3'

    def construct(self):
        self.chay()

class r4(TrangK1):
    B = 'r4'

    def construct(self):
        self.chay()

class s8(TrangK1):
    B = 's8'

    def construct(self):
        self.chay()

class k1(TrangK1):
    B = 'k1'

    def construct(self):
        self.chay()

class k2(TrangK1):
    B = 'k2'

    def construct(self):
        self.chay()
