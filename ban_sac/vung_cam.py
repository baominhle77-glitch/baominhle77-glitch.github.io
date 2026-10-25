"""Vùng cấm nội dung quanh ô PiP từ tập 3 (lệnh GĐ 20261023-2240 mục 3c; pip_spec khoá `vung_cam_noi_dung_tu_t3`, HỒ SƠ 22:44).

Không sửa thư viện kênh cũ (t1/t2 giữ nguyên byte, cache render cũ còn trúng). canh.py của tập ≥ 3 gọi
    import vung_cam; vung_cam.ap(loi_hoac_trang, "<sha8 pip_spec>")
TRƯỚC khi dựng BoCuc. ap():
- kiểm sha8 pip_spec (sai thì dừng PIP_SPEC_KHAC: vùng cấm phải đúng bản HỒ SƠ đã báo);
- thay `_pip` của mô-đun (K1/K2/K5) bằng hộp bao (ô ±8 px cũ ∪ vùng cấm) -> mọi trường suy từ bc.pip tự dời;
- bọc BoCuc.__init__: bc.pip ∪ vùng cấm (K3/K4 khai pip cứng), rồi đẩy các trường cứng nằm cạnh PiP ở khổ dọc
  (dau, the_trai, ng_tren, y1, cat) ra khỏi vùng cấm; ghi bc.vung_cam = (sha8, hộp màn).
Toạ độ màn: camera k = 1, tâm 0 — cùng quy ước `_pip` của K1/K2/K5.
"""
import hashlib
import json

PIP_SPEC = "E:/Studio/tools/pip_spec.json"
KHOA = "vung_cam_noi_dung_tu_t3"
HO = 0.10     # khoảng hở tối thiểu giữa trường bố cục và mép vùng cấm (≈ 13 px)
HO_DOC = 0.12  # mép trên nội dung dưới hàng PiP (như ng_tren = pip y0 - 0,12 của K1)


def _doc_spec(sha8=None):
    with open(PIP_SPEC, "rb") as f:
        b = f.read()
    s = hashlib.sha256(b).hexdigest()
    if sha8 is not None and not s.startswith(sha8):
        raise SystemExit("PIP_SPEC_KHAC: can %s, dang %s" % (sha8, s[:8]))
    d = json.loads(b.decode("utf-8"))
    if KHOA not in d:
        raise SystemExit("PIP_SPEC_THIEU_" + KHOA)
    return d, s


def hop_man(doc, fw, fh, sha8=None):
    """Vùng cấm (x0, x1, y0, y1) toạ độ màn cho khung fw × fh đơn vị manim."""
    d, _ = _doc_spec(sha8)
    k = d[KHOA]["khung_1080x1920" if doc else "khung_1920x1080"]
    W, H = (1080, 1920) if doc else (1920, 1080)
    x0, y0, x1, y1 = k["vung_cam_x0y0x1y1"]
    px = W / fw
    if abs(H / fh - px) > 1e-3 * px:
        raise SystemExit("VUNG_CAM_TI_LE_KHUNG %r" % ((fw, fh),))
    return ((x0 - W / 2) / px, (x1 - W / 2) / px, (H / 2 - y1) / px, (H / 2 - y0) / px)


def bao(a, b):
    return (min(a[0], b[0]), max(a[1], b[1]), min(a[2], b[2]), max(a[3], b[3]))


def cat(a, b):
    """Hai hộp (x0, x1, y0, y1) có phần chung diện tích dương."""
    return a[0] < b[1] and b[0] < a[1] and a[2] < b[3] and b[2] < a[3]


def _day_khoi(bc, z):
    """Khổ dọc: PiP góc trên trái -> các trường cứng bên phải / bên dưới hàng PiP dời ra khỏi vùng cấm z."""
    if not bc.doc:
        return
    if hasattr(bc, "dau") and cat(bc.dau, z):
        d = bc.dau
        bc.dau = (max(d[0], z[1] + HO), d[1], d[2], d[3])
    if hasattr(bc, "the_trai"):
        bc.the_trai = max(bc.the_trai, z[1] + HO)
    for ten in ("ng_tren", "y1"):
        if hasattr(bc, ten):
            setattr(bc, ten, min(getattr(bc, ten), z[2] - HO_DOC))
    if getattr(bc, "cat", None):
        c = bc.cat
        bc.cat = (c[0], c[1], c[2], min(c[3], z[2] - HO))


def ap(mod, sha8):
    """Áp vùng cấm t3 lên mô-đun bố cục kênh (K1/K2 trang, K3/K4/K5 loi). Gọi một lần, trước BoCuc()."""
    if getattr(mod, "VUNG_CAM", None):
        if mod.VUNG_CAM != sha8:
            raise SystemExit("VUNG_CAM_DA_AP_KHAC %s" % mod.VUNG_CAM)
        return
    _doc_spec(sha8)
    from manim import config

    def z_cua(doc):
        return hop_man(doc, config.frame_width, config.frame_height, sha8)

    if hasattr(mod, "_pip"):
        pip_cu = mod._pip
        mod._pip = lambda doc: bao(pip_cu(doc), z_cua(doc))
    init_cu = mod.BoCuc.__init__

    def init(self, *a, **kw):
        init_cu(self, *a, **kw)
        z = z_cua(self.doc)
        self.pip = bao(self.pip, z)
        _day_khoi(self, z)
        self.vung_cam = (sha8, z)
    mod.BoCuc.__init__ = init
    mod.VUNG_CAM = sha8
