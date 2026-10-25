# Lõi vẽ chung của thư viện cảnh K3 (Strata Notes): một lõi, hai bố cục (16:9 ngang, 9:16 dọc), mốc theo lời đọc thật.
# Dùng: tệp cảnh của tập (sinh bởi tools/nha_may.py) đặt khung bằng K3_canh.khung.dat_theo_moi_truong() TRƯỚC khi import tệp này.
# Mỗi beat = một Scene con của TrangK3 (B = id beat); construct() gọi self.san(...) cho các dòng có mã DOI (chu() với hằng trong
# tệp cảnh — cổng 7b4 đối chiếu DOI ở đó) rồi self.chay(). Kế hoạch dựng (lời, mốc từ, số khung, trang, chuyển cảnh) đọc từ
# K3_KE_HOACH (json do nha_may.py ghi). Không bản VI (lệnh Chủ tịch 20:3x 17/10): không n_vi, không chu_vi.
# Luật bản sắc K3 áp ở đây như ở tệp cảnh (lint_bs4): chỉ module K3_; không bo góc; không FadeIn/FadeOut toàn cảnh; hiện/vẽ/đổi
# qua K3.hien/ve/doi; không lưới; phông và màu chỉ từ module kênh.
# SX lập 17/10/2026 (phiên local_df559baa, Opus 5.5 xhigh).
import hashlib
import json
import math
import os
import re

import numpy as np
from manim import (Scene, Mobject, VMobject, VGroup, Text, Line, Rectangle, ParametricFunction, FadeOut, config,
                   rate_functions, smooth, ITALIC, TAU, UP, DOWN, LEFT, RIGHT, ORIGIN)

import K3_so_thuc_dia as K3
from K3_so_thuc_dia import GIAY, MUC, DEVON, SILUR, CARBON, JURA, NHAN, chu, chu_nghieng, so_mu
from ngon_ngu import chuan

FPS = 30
CO_CT = 13          # cỡ chữ chú thích cuối trang (= K3.chu_thich_cuoi_trang)
CO_MA = 18          # cỡ dòng mã (DOI) trên mảnh trích dẫn
DAN = 0.15          # hình đi trước tiếng (s)
PAD = 0.5           # đệm cuối beat không có chuyển cảnh ra (s)
PAD_KET = 1.5       # đệm cuối beat cuối tập (s)
GIU_CUOI, T_LAT, T_PHU, GIU_SAU = 0.3, 1.1, 1.2, 0.2
T_VAO = 0.6         # đổi/ẩn phần tử của beat trước ở đầu beat (s)
GOM = 0.12          # gộp các sự kiện cách nhau < GOM s vào một lượt play
MEP_CHONG = 0.05    # phiếu 106: hai khối cách nhau < 0,05 (≈ 6–7 px) coi như chạm
T_TAT = 0.45        # phiếu 106: tắt sớm phần tử beat trước sắp bị phần tử mới đè/chạm (s)
T_CT_TAT = 0.3      # phiếu 106b: thời gian tắt chú thích chân trang bố cục cũ (s)
CT_TRE = 0.5        # phiếu 106b: chân trang bố cục mới chỉ hiện sau khi bản cũ tắt hẳn (cách nhau >= 1 khung)
MEP_DOI = 0.06      # phiếu 106: giấu trọn khối có DOI khi mép lật trang/lớp phủ còn cách nó 0,06
CAP = 0.0096        # chiều cao chữ hoa Georgia / cỡ (đo 17/10: 0.25 ở cỡ 26, 0.135 ở cỡ 14)
MAU = {"GIAY": GIAY, "MUC": MUC, "DEVON": DEVON, "SILUR": SILUR, "CARBON": CARBON, "JURA": JURA, "NHAN": NHAN}
MU = "⁰¹²³⁴⁵⁶⁷⁸⁹"
SO_MU_RE = re.compile("[%s](?: ?[%s])*" % (MU, MU))
MU_TR = str.maketrans(MU, "0123456789")
DOI_RE = re.compile(r"10\.\d{4,9}/\S+")
NEN_CHU = set("acemnorsuvwxz")

_KH = None


def ke_hoach():
    global _KH
    if _KH is None:
        with open(os.environ["K3_KE_HOACH"], encoding="utf-8") as f:
            _KH = json.load(f)
    return _KH


def so_khung(b):
    """Số khung của beat — cùng công thức với nha_may.py (tiếng đệm/cắt đúng số khung này)."""
    sau = (b.get("sau") or {}).get("kieu")
    if sau == "lat_trang":
        return math.ceil((b["dur"] + GIU_CUOI) * FPS) + round(T_LAT * FPS) + round(GIU_SAU * FPS)
    if sau == "phu_lop":
        return math.ceil((b["dur"] + GIU_CUOI) * FPS) + round(T_PHU * FPS) + round(GIU_SAU * FPS)
    return math.ceil((b["dur"] + (PAD_KET if b.get("cuoi") else PAD)) * FPS)


# ------------------------------------------------------------------ chữ
def tach_mu(s):
    """'year 365.242 d³' -> ('year 365.242 d', [(14, '3')]): số chú thích tách khỏi chuỗi gốc, nhớ chỗ gắn."""
    base, gan, i, n = [], [], 0, 0
    for m in SO_MU_RE.finditer(s):
        base.append(s[i:m.start()])
        n += m.start() - i
        gan.append((n, m.group().translate(MU_TR)))
        i = m.end()
    base.append(s[i:])
    return "".join(base), gan


def _duong_de(t, base):
    ys = [t[i].get_bottom()[1] for i, ch in enumerate(base) if ch in NEN_CHU]
    return float(np.median(ys)) if ys else float(t.get_bottom()[1])


class DongChu(VGroup):
    """Một dòng chữ K3 (Georgia) có số chú thích nâng lên đúng sau ký tự đứng trước (so_mu của module kênh).
    Dựng bằng disable_ligatures để chỉ số glyph = chỉ số ký tự (tô một đoạn, gắn số giữa dòng)."""

    def __init__(self, s, size=20, mau=MUC, op=1.0, nghieng=False):
        if DOI_RE.search(s):
            raise ValueError("DOI phải đến từ canh.py (chu() với hằng trong tệp cảnh): %r" % s)
        base, gan = tach_mu(s)
        kw = dict(font=K3.FONT, font_size=size * 4, color=mau, disable_ligatures=True)
        if nghieng:
            kw["slant"] = ITALIC
        t = Text(K3.dich(base), **kw).scale(0.25).set_opacity(op)
        super().__init__(t)
        self.chuoi, self.base, self.goc, self.size, self.mu = s, base, t, size, []
        self.ok = len(t.submobjects) == len(base)
        if gan and not self.ok:
            print("CANH_BAO_GLYPH %d != %d: %r" % (len(t.submobjects), len(base), base))
        sz = max(9, round(size * 0.55))
        top = (_duong_de(t, base) if self.ok else float(t.get_bottom()[1])) + CAP * size + 0.04
        self.mu_idx = []
        for idx, so in gan:
            m = so_mu(so, sz, mau).set_opacity(min(op, 0.9))
            if self.mu and self.mu_idx[-1] == idx:
                x = self.mu[-1].get_right()[0] + 0.025
            elif self.ok and 0 < idx < len(base):
                x = t[idx - 1].get_right()[0] + 0.025
                for j in range(idx, len(base)):
                    t[j].shift(RIGHT * (m.width + 0.05))
            elif self.ok and idx >= len(base):
                # cuối chuỗi: ngay sau glyph cuối có bề rộng (không nối sau số mũ đứng trước khi giữa có chữ)
                gl = [q for q in t[:len(base)] if q.width > 1e-4]
                x = (gl[-1].get_right()[0] if gl else t.get_right()[0]) + 0.025
            else:
                x = t.get_right()[0] + 0.025
            m.move_to([x + m.width / 2, 0, 0]).align_to([0, top, 0], UP)
            self.mu.append(m)
            self.mu_idx.append(idx)
            self.add(m)

    def lat(self, sub, k=1):
        """Các glyph của đoạn `sub` (lần thứ k) trong chuỗi gốc (không tính số chú thích)."""
        i = -1
        for _ in range(k):
            i = self.base.find(sub, i + 1)
            if i < 0:
                raise KeyError("không thấy %r trong %r" % (sub, self.base))
        if not self.ok:
            return [self.goc]
        return [g for g in self.goc[i:i + len(sub)] if g.width > 1e-4 or g.height > 1e-4]


class KhoiChu(VGroup):
    """Nhiều DongChu ngắt theo bề rộng đo thật; số chú thích luôn dính chữ đứng trước."""

    def __init__(self, s, dong, buff):
        super().__init__(*dong)
        self.arrange(DOWN, aligned_edge=LEFT, buff=buff)
        self.chuoi, self.dong = s, dong

    def lat(self, sub, k=1):
        for d in self.dong:
            if sub in d.base:
                return d.lat(sub, k)
        raise KeyError("không thấy %r trong %r" % (sub, self.chuoi))


def _tu(s):
    """Tách từ theo khoảng trắng, giữ cụm số chú thích '¹ ²' dính từ trước."""
    giu = SO_MU_RE.sub(lambda m: m.group().replace(" ", "\u0001"), s)
    return [w.replace("\u0001", " ") for w in giu.split(" ") if w]


_SO = re.compile(r"^[≈~+−-]?\d[\d.,]*%?$")
_DV = {"h", "d", "Ma", "Myr", "Gyr", "kyr", "min", "mm", "yr", "s", "%", "km", "cm", "m"}
_THANG = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"}
_DINH_TRUOC = {"·", "—", "–", "/", "±"}
_DINH_SAU = {"/", "±", "≈", "×", "÷", "=", "+", "−", "~", "→", "<", ">", "≤", "≥"}


def _cum(s):
    """Cụm không ngắt giữa: '·' '—' dính từ trước; '/' '±' dính hai phía; toán tử dính số sau; số + đơn vị;
    ngày + tháng + năm; nhóm nghìn '8 766'."""
    out, dinh = [], False
    for w in _tu(s):
        b = tach_mu(w)[0]
        tr = tach_mu(out[-1].split(" ")[-1])[0] if out else ""
        noi = bool(out) and (dinh or b in _DINH_TRUOC or (b in _DV and bool(_SO.match(tr))) or
                             (b in _THANG and bool(_SO.match(tr))) or (bool(_SO.match(b)) and tr in _THANG) or
                             (bool(re.match(r"^\d{3}$", b)) and bool(re.match(r"^\d{1,3}$", tr))))
        if noi:
            out[-1] += " " + w
        else:
            out.append(w)
        dinh = b in _DINH_SAU
    return out


def _goi(dv, do, rong):
    """Xếp tham lam các cụm vào dòng theo bề rộng đo thật; trả danh sách dòng (mỗi dòng là danh sách cụm)."""
    dong, cur = [], []
    for w in dv:
        if cur and do(" ".join(cur + [w])) > rong:
            dong.append(cur)
            cur = [w]
        else:
            cur = cur + [w]
    if cur:
        dong.append(cur)
    return dong


def _mo_coi(dong, do, rong):
    """Dòng cuối chỉ một từ đơn mà dòng trên có ≥ 3 cụm: kéo một cụm xuống nếu vừa."""
    if len(dong) >= 2 and len(dong[-1]) == 1 and " " not in tach_mu(dong[-1][0])[0] and len(dong[-2]) >= 3:
        moi = [dong[-2][-1]] + dong[-1]
        if do(" ".join(moi)) <= rong:
            return dong[:-2] + [dong[-2][:-1], moi]
    return dong


def vong_tay(m, mau=MUC, dam=3.0, op=0.8, le=0.18):
    """Vòng khoanh bút chì quanh chữ/số (như bìa): bầu dục siêu elip hơi lệch, nét vượt quá điểm đầu như vẽ tay."""
    c = m.get_center()
    a, b = m.width / 2 * 1.08 + le, m.height / 2 * 1.25 + le
    s = lambda u: np.sign(u) * np.abs(u) ** (2 / 3)
    f = lambda t: c + np.array([a * (1 + 0.02 * (1 + np.sin(3 * t))) * s(np.cos(t)),
                                b * (1 + 0.025 * (1 + np.cos(2 * t))) * s(np.sin(t)), 0])
    return ParametricFunction(f, t_range=[0.35, 0.35 + TAU + 0.45]).set_stroke(mau, dam, op).rotate(-0.05, about_point=c)


def ngoac(x0, x1, y, h=0.14, huong=-1, mau=MUC, dam=1.6, op=0.85):
    """Ngoặc vuông vẽ tay dưới (huong=-1) hoặc trên (huong=1) một đoạn x0..x1 ở y; có mấu giữa."""
    xm = (x0 + x1) / 2
    v = VMobject().set_points_as_corners([[x0, y, 0], [x0, y + huong * h, 0], [xm - 0.08, y + huong * h, 0],
                                          [xm, y + huong * (h + 0.1), 0], [xm + 0.08, y + huong * h, 0],
                                          [x1, y + huong * h, 0], [x1, y, 0]])
    return v.set_stroke(mau, dam, op)


def ngoac_doc(x, y0, y1, w=0.14, huong=1, mau=MUC, dam=1.6, op=0.85):
    """Ngoặc đứng ở x cho đoạn y0..y1, mở về phía -huong (huong=1: mấu chỉ sang phải)."""
    ym = (y0 + y1) / 2
    v = VMobject().set_points_as_corners([[x, y0, 0], [x + huong * w, y0, 0], [x + huong * w, ym - 0.08, 0],
                                          [x + huong * (w + 0.1), ym, 0], [x + huong * w, ym + 0.08, 0],
                                          [x + huong * w, y1, 0], [x, y1, 0]])
    return v.set_stroke(mau, dam, op)


def vua(m, x0, x1, y0, y1, can=ORIGIN):
    """Thu nhỏ (không phóng to) cho vừa hộp, rồi đặt theo `can` (UL, LEFT, ORIGIN, ...)."""
    k = min(1.0, (x1 - x0) / max(m.width, 1e-6), (y1 - y0) / max(m.height, 1e-6))
    if k < 1:
        m.scale(k)
    sx, sy = int(np.sign(can[0])), int(np.sign(can[1]))
    cx = {-1: x0 + m.width / 2, 0: (x0 + x1) / 2, 1: x1 - m.width / 2}[sx]
    cy = {-1: y0 + m.height / 2, 0: (y0 + y1) / 2, 1: y1 - m.height / 2}[sy]
    m.move_to([cx, cy, 0])
    return k


def dat(m, x=None, y=None, trai=None, phai=None, tren=None, duoi=None):
    """Đặt mobject theo tâm hoặc theo mép."""
    c = m.get_center()
    dx = (x - c[0]) if x is not None else (trai - m.get_left()[0]) if trai is not None else \
        (phai - m.get_right()[0]) if phai is not None else 0
    dy = (y - c[1]) if y is not None else (tren - m.get_top()[1]) if tren is not None else \
        (duoi - m.get_bottom()[1]) if duoi is not None else 0
    return m.shift([dx, dy, 0])


# ------------------------------------------------------------------ bố cục
class BoCuc:
    """Hai bố cục. Ngang 16:9: PiP góc trên phải (x > 4,15; y > 2,05), chú thích cuối trang đáy ≥ -2,75 (vùng phụ đề YouTube).
    Dọc 9:16 (out/M2_UART/_doc/BO_CUC_DOC_9x16.md): vùng an toàn x -3,519..2,963 y -2,133..5,111; ô PiP x < -1,111 y > 3,704;
    sàn nội dung SAN = -1,45 (trên hộp phụ đề 2 hàng px 1164); hàng đầu trang bên phải PiP từ x -0,95."""

    def __init__(self):
        W, H = config.frame_width, config.frame_height
        self.W, self.H = W, H
        self.doc = H > W
        self.ten = "9x16" if self.doc else "16x9"
        if self.doc:
            self.x0, self.x1, self.y1 = -3.30, 2.85, 3.50
            self.dau = (-0.95, 2.85, 3.80, 5.05)
            self.pip = (-4.10, -1.05, 3.62, 7.20)
            self.ct_x, self.ct_x1, self.ct_day = -3.25, 2.85, -1.40
            self.an_toan = (-3.519, 2.963, -1.45, 5.111)
            self.khia = None
        else:
            self.x0, self.x1, self.y1 = -6.30, 6.55, 2.75
            self.dau = (-6.30, 4.00, 2.95, 3.75)
            self.pip = (4.15, 7.20, 2.05, 4.10)
            self.ct_x, self.ct_x1, self.ct_day = -6.25, 6.55, -2.75
            self.an_toan = (-6.85, 6.95, -3.90, 3.90)
            self.khia = (4.00, 1.95)   # phải x 4,0 thì nội dung phải dưới y 1,95 (né PiP)
        self.y_san = self.ct_day

    @property
    def rong(self):
        return self.x1 - self.x0


# ------------------------------------------------------------------ phần tử và sự kiện
class Phan:
    """Một phần tử của beat. kieu: hien (K3.hien) | ve (K3.ve) | doi (K3.doi từ khoá `tu`) | dam (tô glyph + gạch dưới)
    | an (ẩn khoá `tu`) | co (có sẵn từ đầu beat). moc: từ trong lời ('sixty#2' = lần 2); t: giây; tre: trễ thêm sau mốc."""

    def __init__(self, khoa, m=None, kieu="hien", moc=None, t=None, rt=None, tu=None, tre=0.0, glyph=None, mau=None):
        self.khoa, self.m, self.kieu, self.moc, self.t, self.tu, self.tre = khoa, m, kieu, moc, t, tu, tre
        self.rt = rt if rt is not None else (0.9 if kieu in ("hien", "doi") else 0.7)
        self.glyph, self.mau = glyph, mau


def ky(m):
    """Chữ ký hình của phần tử (giữ nguyên qua ranh giới beat nếu trùng)."""
    h = hashlib.sha1()
    for sm in m.family_members_with_points():
        h.update(np.round(sm.points, 2).tobytes())
        h.update(("%s|%.2f|%s|%.2f|%.1f" % (sm.get_fill_color().to_hex() if hasattr(sm, "get_fill_color") else "",
                                           sm.get_fill_opacity() if hasattr(sm, "get_fill_opacity") else 0,
                                           sm.get_stroke_color().to_hex() if hasattr(sm, "get_stroke_color") else "",
                                           sm.get_stroke_opacity() if hasattr(sm, "get_stroke_opacity") else 0,
                                           sm.get_stroke_width() if hasattr(sm, "get_stroke_width") else 0)).encode())
    return h.hexdigest()


class Ve:
    """Ngữ cảnh vẽ một beat: bố cục, lời và mốc, các dòng mã từ tệp cảnh, sổ các chuỗi đã vẽ (để đối chiếu labels)."""

    def __init__(self, bc, b, kh, san):
        self.bc, self.b, self.kh, self.san_d = bc, b, kh, san
        self.ts = b["tham_so"]
        self.da_ve = []

    # --- lời và mốc
    def thoi(self, moc):
        w, _, k = moc.partition("#")
        k = int(k or 1)
        W = self.b["words"]
        c = chuan(w)
        hit = [x["t"] for x in W if chuan(x["w"]) == c]
        if len(hit) < k:
            hit = sorted(set(hit) | {x["t"] for x in W if chuan(x["w"]).startswith(c) and c})
        if len(hit) < k:
            for n in (2, 3):
                for i in range(len(W) - n + 1):
                    if "".join(chuan(x["w"]) for x in W[i:i + n]) == c:
                        hit.append(W[i]["t"])
            hit = sorted(set(hit))
        if len(hit) < k:
            raise KeyError("mốc %r không có trong lời beat %s" % (moc, self.b["id"]))
        return hit[k - 1]

    # --- chữ
    def dong(self, s, size=20, mau=MUC, op=1.0, nghieng=False):
        d = DongChu(s, size, mau, op, nghieng)
        self.da_ve.append(s)
        return d

    def khoi(self, s, size=20, rong=6.0, mau=MUC, op=1.0, nghieng=False, buff=None):
        d = DongChu(s, size, mau, op, nghieng)
        self.da_ve.append(s)
        if d.width <= rong:
            return d
        rr = {}

        def do(x):
            if x not in rr:
                rr[x] = DongChu(x, size, mau, op, nghieng).width
            return rr[x]

        dong = None
        if " · " in s:
            seg = s.split(" · ")
            seg = [x + " ·" for x in seg[:-1]] + [seg[-1]]
            if all(do(x) <= rong for x in seg):
                dong = _goi(seg, do, rong)
        if dong is None:
            dv = []
            for c in _cum(s):
                dv += [c] if (" " not in c or do(c) <= rong) else _tu(c)
            dong = _mo_coi(_goi(dv, do, rong), do, rong)
        return KhoiChu(s, [DongChu(" ".join(x), size, mau, op, nghieng) for x in dong],
                       buff if buff is not None else 0.11 * size / 20)

    def ma(self, duong, s, size=CO_MA, mau=MUC, op=0.85):
        """Dòng có mã DOI: lấy mobject chu() từ tệp cảnh (khoá 'ma:<beat>:<đường tham số>'), kiểm đúng chuỗi."""
        k = "ma:%s:%s" % (self.b["id"], duong)
        if k not in self.san_d:
            raise KeyError("tệp cảnh thiếu dòng mã %s (%r)" % (k, s))
        rows, duoi = self.san_d[k]
        m = rows[0].copy()
        if getattr(m, "chu_goc", None) != s:
            raise ValueError("dòng mã %s khác storyboard: %r != %r" % (k, getattr(m, "chu_goc", None), s))
        m.set_color(mau).set_opacity(op)
        m.scale(size / CO_MA)
        self.da_ve.append(s)
        return m

    def chu_hoac_ma(self, s, size, duong, **kw):
        return self.ma(duong, s, size) if DOI_RE.search(s) else self.dong(s, size, **kw)

    # --- khung chung của trang
    def tieu_de(self, s, size=26):
        """Tiêu đề trang (cột sổ cái đang xét / tên trạm) ở hàng đầu trang (dọc: bên phải PiP)."""
        x0, x1, y0, y1 = self.bc.dau
        t = self.dong(s, size, MUC, 0.95, nghieng=True)
        vua(t, x0, x1, y0 + 0.18, y1, LEFT)
        k = Line(t.get_corner(DOWN + LEFT) + DOWN * 0.08,
                 [min(t.get_right()[0] + 0.25, max(t.get_right()[0], x1)), t.get_bottom()[1] - 0.08, 0])
        return t, k.set_stroke(NHAN, 1.6, 0.7)

    def goc(self, s, size=22, mau=MUC):
        """Ghi chú góc trên phải của trang (dọc: hàng đầu trang bên phải PiP)."""
        x0, x1, y0, y1 = self.bc.dau
        t = self.dong(s, size, mau, 0.9, nghieng=True)
        vua(t, x0, x1, y0 + 0.05, y1, RIGHT if not self.bc.doc else RIGHT + DOWN)
        return t

    def the(self, m, le=0.14, mau=MUC, op=0.55, nen=0.0):
        """Khung chữ nhật mảnh quanh m (thẻ/ô sổ cái; không bo góc)."""
        r = Rectangle(width=m.width + 2 * le, height=m.height + 2 * le).move_to(m.get_center())
        return r.set_stroke(mau, 1.3, op).set_fill(GIAY, nen)

    def gach_duoi(self, glyph, mau=NHAN, dam=2.2, ha=0.06):
        g = VGroup(*glyph)
        return Line(g.get_corner(DOWN + LEFT) + DOWN * ha, g.get_corner(DOWN + RIGHT) + DOWN * ha).set_stroke(mau, dam, 0.9)

    # --- chú thích cuối trang (K3.chu_thich_cuoi_trang: số cố định theo nguồn, cùng khung với chữ có số)
    def khoi_chu_thich(self, so_list):
        if not so_list:
            self.y_san = self.bc.ct_day
            return {}
        rong = self.bc.ct_x1 - self.bc.ct_x - 0.2
        hang = []
        for n in so_list:
            k = "ct%d" % n
            if k in self.san_d:
                rows, duoi = self.san_d[k]
                rows = [r.copy() for r in rows]
                goc = " ".join(r.chu_goc for r in rows) + duoi
                if goc != self.kh["ct"][str(n)]:
                    raise ValueError("chú thích %d trong tệp cảnh khác storyboard:\n%r\n%r" % (n, goc, self.kh["ct"][str(n)]))
                if duoi:
                    last = rows[-1]
                    p = chu(last.chu_goc[-1] + duoi, CO_CT, MUC, 0.8)
                    p.shift(last[-1].get_center() - p[0].get_center())
                    rows[-1] = VGroup(last, *p[1:])
                    rows[-1].chu_goc = last.chu_goc + duoi
            else:
                s = self.kh["ct"][str(n)]
                if DOI_RE.search(s):
                    raise ValueError("chú thích %d có DOI nhưng tệp cảnh không cấp (self.san('ct%d', ...))" % (n, n))
                rows, cur = [], ""
                for w in s.split(" "):
                    thu = (cur + " " + w).strip()
                    if cur and chu(thu, CO_CT, MUC, 0.8).width > rong:
                        rows.append(cur)
                        cur = w
                    else:
                        cur = thu
                rows.append(cur)
                rows = [chu(r, CO_CT, MUC, 0.8) for r in rows]
            for r in rows:
                if r.width > rong + 1e-3:
                    print("NGOAI_VUNG chu_thich %d dòng rộng %.2f > %.2f: %r" % (n, r.width, rong, getattr(r, "chu_goc", "")))
            cot = VGroup(*rows).arrange(DOWN, aligned_edge=LEFT, buff=0.045)
            hang.append(VGroup(so_mu(n, 9), cot).arrange(RIGHT, aligned_edge=UP, buff=0.05))
            self.da_ve.append(self.kh["ct"][str(n)])
        ds = VGroup(*hang).arrange(DOWN, aligned_edge=LEFT, buff=0.06)
        ke = Line([0, 0, 0], [2.2, 0, 0]).set_stroke(MUC, 1, 0.6)
        g = VGroup(ke, ds).arrange(DOWN, aligned_edge=LEFT, buff=0.08)
        dat(g, trai=self.bc.ct_x, duoi=self.bc.ct_day)
        self.y_san = g.get_top()[1] + 0.18
        out = {"ct:ke": ke}
        for n, h in zip(so_list, hang):
            out["ct:%d" % n] = h
        return out

    def hop(self):
        """Hộp nội dung (x0, x1, y0, y1) của beat — sàn là đỉnh khối chú thích + 0,18."""
        return self.bc.x0, self.bc.x1, self.y_san, self.bc.y1


# ------------------------------------------------------------------ cảnh
class TrangK3(Scene):
    """Một beat K3. Lớp con trong tệp cảnh: B = 'id beat'; construct() = self.san(...)* + self.chay()."""
    B = None

    def setup(self):
        self._san = {}
        self._khung = 0
        self._tat = set()        # id phần tử beat trước đã tắt sớm (phiếu 106): đổi/ẩn sau đó thành hiện/bỏ
        self._ten = {}           # id phần tử -> khoá (soát chồng từng khung)
        self._soat = False       # đang trong phần nội dung của beat (không soát lúc lật/phủ)
        self._chong = {}         # (khoá a, khoá b) -> [khung đầu, khung cuối, số khung, w max, h max]
        self._moi_khung = []     # hàm gọi sau nội suy, trước khi vẽ mỗi khung (giấu DOI lúc lật/phủ)
        self._doi_moi = {}       # id khối có DOI -> khung cuối nó còn hiện/đổi
        self._so_lieu = []       # dòng TAT_SOM / CHONG_GIUA / DOI_YEN / DOI_LAT ghi ra K3_SO_LIEU
        self._gach = {}          # id gạch dưới "dam" -> id các glyph nó gạch (gạch của chính chữ đó không tính là chồng)

    def san(self, khoa, m, duoi=""):
        """Dòng có mã từ tệp cảnh: khoa 'ct<n>' (chú thích n, list các dòng chu()) hoặc 'ma:<beat>:<đường>' (một chu())."""
        self._san[khoa] = (list(m) if isinstance(m, (list, tuple)) else [m], duoi)

    # --- khung hình chính xác
    def _choi(self, anims, k, rate_func=None):
        if k <= 0 or not anims:
            return
        kw = {"run_time": (k - 0.5) / FPS}
        if rate_func is not None:
            kw["rate_func"] = rate_func
        self.play(*anims, **kw)
        self._khung += k

    def _cho(self, k):
        if k > 0:
            if self._soat:
                self._soat_khung(self._khung, k)
            self.wait((k + 0.5) / FPS, frozen_frame=True)
            self._khung += k

    # --- dựng trạng thái một beat
    def _dung(self, b, kh, bc):
        from K3_canh.lop import LOP
        v = Ve(bc, b, kh, self._san)
        ct = v.khoi_chu_thich(b["chu_thich"])
        lop = LOP[b["canh"]](**b["tham_so"])
        lop.beat = b
        lop.L = lop.bo_cuc_9x16(v) if bc.doc else lop.bo_cuc_16x9(v)
        phan = lop.ve(v)
        return v, ct, phan

    @staticmethod
    def _cuoi(ct, phan):
        d = dict(ct)
        for p in phan:
            if p.kieu == "an":
                d.pop(p.tu, None)
                continue
            if p.kieu == "doi":
                d.pop(p.tu, None)
            if p.kieu == "dam":
                for g in p.glyph:
                    g.set_color(p.mau)
            if p.m is not None:
                d[p.khoa] = p.m
        return d

    def chay(self):
        kh = ke_hoach()
        b = kh["beats"][self.B]
        bc = BoCuc()
        self._bid, self._bc = b["id"], bc
        K3.nen(self, b["trang"], seed=b["trang"])
        vao = b["vao"]
        P = kh["beats"][b["truoc"]] if b.get("truoc") and vao in ("khong", "truot_nua", "truot_trang") else None
        man = {}
        if P is not None:
            _, ctP, phP = self._dung(P, kh, bc)
            man = self._cuoi(ctP, phP)
            for k, m in man.items():
                self.add(m)
                self._ten[id(m)] = k
        goc = dict(man)
        if vao == "phu_lop":
            for k, m in lop_phu_kin(b["phu_lop_mau"], bc).items():
                man[k] = m
                self.add(m)
        v, ct, phan = self._dung(b, kh, bc)
        thieu = [s for s in b["labels"] if s not in v.da_ve]
        if thieu:
            raise AssertionError("beat %s chưa vẽ labels: %r" % (b["id"], thieu))
        N = so_khung(b)
        if b.get("so_khung") is not None and b["so_khung"] != N:
            raise AssertionError("số khung kế hoạch %s != %s" % (b["so_khung"], N))
        dur = b["dur"]
        su = []   # (t, thứ tự, hàm -> (anims, sau))

        def them(t, f, rt, me=None):
            # me: {"loai", "m" (phần tử hiện ra), "nguon" (phần tử bị đổi/ẩn/tắt)} cho bước tắt sớm phiếu 106
            su.append([max(0.0, t), len(su), f, rt, me])

        khoa_B = set(ct) | {p.khoa for p in phan if p.m is not None}
        # 1) đầu beat: phần tử của beat trước
        cu = {k: m for k, m in man.items() if not k.startswith("phu:")}
        if vao == "truot_nua":
            noi = {k: m for k, m in cu.items() if not k.startswith("ct:")}
            for k in noi:
                man["P:" + k] = man.pop(k)
                self._ten[id(man["P:" + k])] = "P:" + k
            cu = {k: m for k, m in cu.items() if k.startswith("ct:")}
            if bc.doc:
                pp0, pp1, pq0, _ = bc.pip

                def len_pip(m, dy=0.6, g=0.1):
                    """Phần tử trượt lên dy có chạm ô PiP (+ lề) không (SX phiếu 89: nhãn h1 9:16 mờ dần đi vào dải 8 px)."""
                    return (m.get_right()[0] > pp0 - g and m.get_left()[0] < pp1 + g and m.get_top()[1] + dy > pq0 - g)
                them(0.0, lambda ms=list(noi.values()): ([FadeOut(m) if len_pip(m) else FadeOut(m, shift=UP * 0.6) for m in ms],
                                                         lambda: [self.remove(m) for m in ms]), 0.9)
                for k in list(noi):
                    man.pop("P:" + k, None)
            else:
                def _truot(ms=list(noi.items())):
                    def sau():
                        for k, m in ms:
                            if m.get_right()[0] < -bc.W / 2:
                                self.remove(m)
                                man.pop("P:" + k, None)
                    return [m.animate.shift(LEFT * bc.W / 2) for _, m in ms], sau
                them(0.0, _truot, 0.9)
        p0, p1, q0, q1 = bc.pip
        G_PIP = 0.1   # lề quanh ô PiP (KĐ đo ô + 8 px)

        def qua_pip(m, dx):
            """Phần tử trượt ngang dx có quét qua ô PiP (+ lề) không (phiếu 89 Lỗi 1: chữ đi dưới ô PiP lúc trượt trang)."""
            x0, x1 = m.get_left()[0], m.get_right()[0]
            y0, y1 = m.get_bottom()[1], m.get_top()[1]
            a0, a1 = min(x0, x0 + dx), max(x1, x1 + dx)
            return a1 > p0 - G_PIP and a0 < p1 + G_PIP and y1 > q0 - G_PIP and y0 < q1 + G_PIP

        if vao == "truot_trang":
            noi = {k: m for k, m in cu.items() if not k.startswith("ct:")}
            for k in noi:
                man.pop(k)
                self._ten[id(noi[k])] = "P:" + k
            cu = {k: m for k, m in cu.items() if k.startswith("ct:")}
            mo = [m for m in noi.values() if qua_pip(m, -bc.W)]
            tr = [m for m in noi.values() if not qua_pip(m, -bc.W)]
            them(0.0, lambda ms=tr: ([m.animate.shift(LEFT * bc.W) for m in ms],
                                     lambda: [self.remove(m) for m in ms]), 1.0)
            if mo:
                them(0.0, lambda ms=mo: ([FadeOut(m) for m in ms], lambda: [self.remove(m) for m in ms]), 0.5)
        for k, m in list(cu.items()):
            if k not in khoa_B and not k.startswith("ct:"):   # chân trang: mục 2 xử lý (phiếu 106b, hai nhịp)
                them(0.0, lambda m=m, k=k: ([FadeOut(m)], lambda: (self.remove(m), man.pop(k, None))), 0.5,
                     {"loai": "tat", "nguon": m})
        # 2) chú thích cuối trang — phiếu 106b: đổi bố cục theo HAI NHỊP. Mọi phần tử chân trang cũ (kể cả kẻ) không
        #    trùng y hệt bản mới thì tắt hẳn trước, bản mới chỉ hiện/vẽ ở lượt play sau (cách >= 1 khung, do nhóm
        #    sự kiện cắt ở f_ke - 1); không biến hình tại chỗ, không để kẻ trượt qua chữ đang mờ.
        tai = (b["tham_so"].get("chu_thich_tai") if isinstance(b["tham_so"], dict) else None)
        t_moi = v.thoi(tai) - DAN if tai else 0.0
        go = sorted(k for k in man if k.startswith("ct:") and not (k in ct and ky(man[k]) == ky(ct[k])))
        if go:
            t_moi = max(t_moi, CT_TRE)
        for k in go:
            m0 = man.pop(k)
            self._ten[id(m0)] = "cu:" + k
            them(max(0.0, t_moi - CT_TRE), lambda m0=m0: ([FadeOut(m0)], lambda: self.remove(m0)), T_CT_TAT,
                 {"loai": "tat", "nguon": m0})
            self._ghi("CT_DOI %s %s %s tat %.2f moi %.2f" % (b["id"], bc.ten, k, max(0.0, t_moi - CT_TRE), t_moi))
        for k, m in ct.items():
            self._len(k, m, man, them, t_moi, "hien" if k != "ct:ke" else "ve", 0.6)
        # 3) phần tử của lớp
        cho = 0.10
        for p in phan:
            if p.kieu == "co":
                if p.khoa in man and ky(man[p.khoa]) == ky(p.m):
                    self.remove(man[p.khoa])
                    man[p.khoa] = p.m
                    self.add(p.m)
                    self._ten[id(p.m)] = p.khoa
                    continue
                p.kieu = "hien"
            if p.moc:
                t = v.thoi(p.moc) - DAN + p.tre
            elif p.t is not None:
                t = p.t
            else:
                t = cho
                cho += 0.25
            if (vao == "truot_trang" and not p.moc and p.t is None and p.kieu in ("hien", "ve") and p.m is not None
                    and not qua_pip(p.m, bc.W)):
                m = p.m
                m.shift(RIGHT * bc.W)
                self.add(m)
                man[p.khoa] = m
                self._ten[id(m)] = p.khoa
                them(0.0, lambda m=m: ([m.animate.shift(LEFT * bc.W)], None), 1.0)
                continue
            self._len(p.khoa, p.m, man, them, t, p.kieu, p.rt, p)
        # 3b) phiếu 106: phần tử beat trước nằm chỗ cũ tới mốc đổi/ẩn của nó; phần tử mới hiện sớm hơn mà đè/chạm nó
        #     thì tắt nó (cùng họ khoá) trước phần tử mới — không để chữ đè nhau giữa beat
        if vao == "khong" and P is not None:
            self._tat_som(b["id"], goc, su, them, man)
        # 4) chạy theo khung
        su.sort(key=lambda x: (x[0], x[1]))
        nhom = []
        for x in su:
            if nhom and x[0] - nhom[-1][0] < GOM:
                nhom[-1][1].append(x)
            else:
                nhom.append([x[0], [x]])
        het_noi = N if not (b.get("sau") or {}).get("kieu") else math.ceil((dur + GIU_CUOI) * FPS)
        self._soat = True
        for i, (t, xs) in enumerate(nhom):
            f0 = max(self._khung, round(t * FPS))
            if f0 - round(t * FPS) > round(0.35 * FPS):
                print("TRE_MOC beat %s t=%.2f trễ %.2f s" % (b["id"], t, (f0 - round(t * FPS)) / FPS))
            self._cho(f0 - self._khung)
            f_ke = round(nhom[i + 1][0] * FPS) if i + 1 < len(nhom) else het_noi
            k = max(6, min(round(max(x[3] for x in xs) * FPS), f_ke - f0 - 1))
            anims, saus = [], []
            for x in xs:
                a, s_ = x[2]()
                anims += a
                if s_:
                    saus.append(s_)
            self._choi(anims, k)
            for s_ in saus:
                s_()
            for x in xs:
                if x[4] and x[4].get("m") is not None and _khoi_doi(x[4]["m"]):
                    self._doi_moi[id(x[4]["m"])] = self._khung
        if self._khung > het_noi:
            raise AssertionError("beat %s: hình chạy %d khung > %d (lời + giữ)" % (b["id"], self._khung, het_noi))
        self._cho(het_noi - self._khung)
        self._soat = False
        for (a, c), (f0, f1, n, w, h) in sorted(self._chong.items(), key=lambda x: x[1][0]):
            self._ghi("CHONG_GIUA %s %s %s %s khung %d..%d (%d) max %.3fx%.3f" % (b["id"], bc.ten, a, c, f0, f1, n, w, h))
        # 5) chuyển cảnh ra (nằm trong beat này)
        sau = b.get("sau") or {}
        if os.environ.get("K3_KHO") == "1":
            print("KHO %s dừng trước chuyển cảnh ra ở khung %d/%d" % (b["id"], self._khung, N))
            kiem_vung(b["id"], bc, v, man, ct)
            self._xuat_so_lieu()
            return
        if sau.get("kieu") == "lat_trang":
            self._lat_trang(sau["trang"], bc)
        elif sau.get("kieu") == "phu_lop":
            self._phu_lop(sau["mau"], bc)
        self._cho(N - self._khung)
        print("KHUNG_DU_KIEN %s %d %d" % (b["id"], N, self._khung))
        if self._khung != N:
            raise AssertionError("beat %s: %d khung != %d" % (b["id"], self._khung, N))
        kiem_vung(b["id"], bc, v, man, ct)
        self._xuat_so_lieu()

    # --- phiếu 106: tắt sớm, soát chồng từng khung, giấu DOI lúc lật trang
    def _ghi(self, s):
        print(s)
        self._so_lieu = getattr(self, "_so_lieu", [])
        self._so_lieu.append(s)

    def _xuat_so_lieu(self):
        """K3_SO_LIEU = thư mục: ghi <beat>_<bố cục>.txt (TAT_SOM / CHONG_GIUA / DOI_LAT) làm số liệu nộp KĐ."""
        d = os.environ.get("K3_SO_LIEU")
        if not d:
            return
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, "%s_%s.txt" % (self._bid, self._bc.ten)), "w", encoding="utf-8", newline="\n") as f:
            f.write("\n".join(getattr(self, "_so_lieu", []) + ["XONG %s %s khung %d" % (self._bid, self._bc.ten, self._khung)]) + "\n")

    def _tat_som(self, bid, goc, su, them, man):
        """Phần tử O của beat trước còn đứng chỗ cũ tới mốc đổi/ẩn của nó (het). Phần tử mới hiện ở tn < het mà
        hộp (nới MEP_CHONG) chạm hộp O, một bên có chữ -> tắt O (và họ khoá của O còn chờ sau đó) bắt đầu
        tn - 0,5 s, dài T_TAT; lúc tới mốc đổi của O thì phần tử mới hiện (không biến hình từ O đã tắt)."""
        tren = {id(m) for m in self.mobjects}
        het = {}
        for x in su:
            me = x[4]
            if me and me.get("nguon") is not None:
                het[id(me["nguon"])] = min(het.get(id(me["nguon"]), 1e9), x[0])
        ung = {}
        for k, O in goc.items():
            if (k.startswith("phu:") or k.startswith("ct:") or O is None or id(O) not in tren
                    or len(O.get_all_points()) == 0):
                continue
            ung[k] = (O, _hop(O), het.get(id(O), 1e9))
        tat = {}
        for x in su:
            me = x[4]
            if not me or me.get("m") is None or me["loai"] not in ("hien", "ve", "doi", "dam"):
                continue
            m, tn = me["m"], x[0]
            if len(m.get_all_points()) == 0:
                continue
            A = _hop(m)
            for k, (O, B, h) in ung.items():
                if O is me.get("nguon") or O is m or tn >= h - 1e-6 or not (_co_chu(m) or _co_chu(O)):
                    continue
                e = MEP_CHONG
                if A[0] < B[1] + e and B[0] < A[1] + e and A[2] < B[3] + e and B[2] < A[3] + e:
                    if tn < tat.get(k, (1e9,))[0]:
                        tat[k] = (tn, self._ten.get(id(m), "?"))
        doi = True
        while doi:
            doi = False
            for k in list(tat):
                for k2, (O2, _, h2) in ung.items():
                    if k2 in tat or not (k2.startswith(k + ":") or k.startswith(k2 + ":")):
                        continue
                    if h2 > tat[k][0]:
                        tat[k2] = (tat[k][0], "họ " + k)
                        doi = True
        for k, (tn, vi) in sorted(tat.items(), key=lambda x: x[1][0]):
            O = ung[k][0]
            t0 = max(0.0, tn - 0.5)

            def f(O=O):
                if id(O) not in {id(q) for q in self.mobjects}:
                    return [], None
                self._tat.add(id(O))

                def sau():
                    self.remove(O)
                    for kk in [kk for kk, q in man.items() if q is O]:
                        man.pop(kk)
                return [FadeOut(O)], sau
            them(t0, f, T_TAT, {"loai": "tat_som", "nguon": O})
            self._ghi("TAT_SOM %s %s %s t=%.2f (mốc đổi cũ %.2f) vì %s hiện t=%.2f" % (
                bid, self._bc.ten, k, t0, ung[k][2] if ung[k][2] < 1e8 else -1, vi, tn))

    def _soat_khung(self, f, n=1):
        """Soát chồng ở khung f (n khung giống nhau): mọi cặp phần tử đã đăng ký đang trên màn, khác khoá, một bên
        có chữ, không lồng nhau, giao > 0,02 x 0,02, cả hai đang hiện (độ đục > 0,15). Phiếu 106b: soát cả cặp
        ct×ct (chân trang cũ "cu:ct:*" giữ tên riêng nên cặp cũ×mới cùng số vẫn khác khoá) và kẻ chân trang × chữ."""
        ds = []
        for m in self.mobjects:
            k = self._ten.get(id(m))
            if k is None or k.startswith("P:") or k.startswith("phu:"):
                continue
            pts = m.get_all_points()
            if len(pts) == 0:
                continue
            lo, hi = pts.min(axis=0), pts.max(axis=0)
            ds.append((k, m, (lo[0], hi[0], lo[1], hi[1])))
        for i in range(len(ds)):
            ka, ma, A = ds[i]
            for j in range(i + 1, len(ds)):
                kb, mb, B = ds[j]
                if ka == kb:   # phiếu 106b: cặp ct×ct cũng soát (chân trang đè nhau lúc đổi bố cục)
                    continue
                if ka.startswith(kb + ":") or kb.startswith(ka + ":"):   # trang trí của chính phần tử đó (vd vòng
                    continue                                             # khoanh so:but:vong quanh chữ so:but): cố ý
                w = min(A[1], B[1]) - max(A[0], B[0])
                h = min(A[3], B[3]) - max(A[2], B[2])
                if w <= 0.02 or h <= 0.02 or _long(A, B) or _long(B, A):
                    continue
                if not (_co_chu(ma) or _co_chu(mb)) or _duc(ma) <= 0.15 or _duc(mb) <= 0.15:
                    continue
                gc = self._gach_cham(ma, mb)
                if gc is None:
                    gc = self._gach_cham(mb, ma)
                if gc is not None:           # gạch dưới nhấn của chính chữ đó: chữ xuống dòng làm hộp gộp lấn nhau,
                    w, h = gc                # nên so từng nét gạch (kể độ dày nét) với từng glyph của chữ
                    if w <= 0.02 or h <= 0:
                        continue
                elif _co_chu(ma) != _co_chu(mb):   # nét vẽ (dây treo, vòng khoanh, ngoặc, khung) với chữ: hộp bao của
                    nc = _net_cham(mb, ma) if _co_chu(ma) else _net_cham(ma, mb)   # nhóm nét quá rộng, đo điểm trên nét
                    if nc is None:           # (SX 22/10, phiếu 106 lần 2: b3/b4/k1 chồng giả theo hộp bao)
                        continue
                    w, h, sg = nc
                    if sg <= 2 and min(w, h) <= 0.1 and "ct:" not in ka and "ct:" not in kb:
                        continue   # sợi mảnh cắt 1–2 glyph (dây treo vẽ tay cố ý); kẻ chân trang qua chữ (kể cả
                                   # chỉ chạm số mũ ¹) thì vẫn bắt — phiếu 106b
                c = self._chong.setdefault(tuple(sorted((ka, kb))), [f, f, 0, 0.0, 0.0])
                c[1] = f + n - 1
                c[2] += n
                c[3], c[4] = max(c[3], w), max(c[4], h)

    def _gach_cham(self, a, b):
        """a là gạch dưới "dam" mà mọi glyph nó gạch nằm trong chính b (vd ho:ket:dam dưới chữ ho:ket): trả (w, h)
        giao lớn nhất giữa từng nét gạch (nới nửa độ dày nét) và từng glyph của b; không phải cặp đó thì None."""
        g = self._gach.get(id(a))
        if not g or not g <= {id(x) for x in b.get_family()}:
            return None
        hop = []
        for x in b.family_members_with_points():
            q = x.get_all_points()
            if len(q) and _duc(x) > 0.15:
                lo, hi = q.min(axis=0), q.max(axis=0)
                hop.append((lo[0], hi[0], lo[1], hi[1]))
        wm = hm = 0.0
        for s in a.family_members_with_points():
            q = s.get_all_points()
            if not len(q):
                continue
            r = s.get_stroke_width() * 0.01 / 2
            lo, hi = q.min(axis=0), q.max(axis=0)
            for B in hop:
                w = min(hi[0] + r, B[1]) - max(lo[0] - r, B[0])
                h = min(hi[1] + r, B[3]) - max(lo[1] - r, B[2])
                if w > 0 and h > 0:
                    wm, hm = max(wm, w), max(hm, h)
        return wm, hm

    def update_to_time(self, t):
        super().update_to_time(t)
        f = self._khung + round(t * FPS)
        for g in list(self._moi_khung):
            g(f)
        if self._soat:
            self._soat_khung(f)

    def _len(self, k, m, man, them, t, kieu, rt, p=None):
        """Đưa phần tử khoá k lên màn ở t: giữ nếu beat trước để lại y hệt, đổi nếu khác, hiện/vẽ nếu mới."""
        if kieu == "an":
            src = man.get(p.tu)
            if src is not None:
                def f(src=src):
                    if id(src) in self._tat:          # đã tắt sớm (phiếu 106)
                        return [], None
                    return [FadeOut(src)], lambda: (self.remove(src), man.pop(p.tu, None))
                them(t, f, rt, {"loai": "an", "nguon": src})
            return
        if kieu == "dam":
            def f(p=p):
                a = [g.animate.set_color(p.mau) for g in p.glyph]
                if p.m is not None:
                    a.append(K3.ve(p.m))
                    man[p.khoa] = p.m
                return a, None
            if p.m is not None:
                self._ten[id(p.m)] = p.khoa
                self._gach[id(p.m)] = {id(g) for g in p.glyph}
            them(t, f, rt, {"loai": "dam", "m": p.m})
            return
        self._ten[id(m)] = k
        if k in man and kieu != "doi":
            if ky(man[k]) == ky(m):
                self.remove(man[k])
                man[k] = m
                self.add(m)
                return
            kieu, p_tu = "doi", k
        else:
            p_tu = p.tu if (p is not None and kieu == "doi") else None
        if kieu == "doi" and (k.startswith("ct:") or (p_tu or "").startswith("ct:")):
            raise AssertionError("phiếu 106b: chân trang %s không được biến hình tại chỗ (tắt rồi hiện lại)" % k)
        if kieu == "doi":
            # nguồn cùng khoá phải bắt ngay lúc lên lịch: man[k] = m bên dưới ghi đè trước khi hoạt cảnh chạy
            src0 = man.get(p_tu) if p_tu == k else None
            nguon = src0 if p_tu == k else man.get(p_tu)

            def f(m=m, k=k, src_k=p_tu, src0=src0):
                src = src0 if src_k == k else man.get(src_k)
                if src is None or id(src) in self._tat:   # nguồn đã tắt sớm (phiếu 106): hiện mới, không biến hình
                    if src is not None and src_k != k and man.get(src_k) is src:
                        man.pop(src_k, None)
                    man[k] = m
                    return [K3.hien(m)], None
                if src_k != k:
                    man.pop(src_k, None)
                man[k] = m

                def sau():
                    self.remove(src)
                    self.add(m)
                return [K3.doi(src, m)], sau
            them(t if t > 0.05 else 0.0, f, min(rt, T_VAO) if t <= 0.05 else rt, {"loai": "doi", "m": m, "nguon": nguon})
            man[k] = m
            return

        def f(m=m, k=k, kieu=kieu):
            return [K3.ve(m) if kieu == "ve" else K3.hien(m)], None
        man[k] = m
        them(t, f, rt, {"loai": kieu, "m": m})

    # --- chuyển cảnh ra
    def _giau_doi(self, cu, cach, ten):
        """Phiếu 106: không khung nào cắt dở DOI. Khối có DOI trên màn trước chuyển cảnh phải đứng yên >= 1 s (khác thì
        NGOAI_VUNG), rồi giấu trọn (độ đục 0) từ khung đầu mà cach(khối) — khoảng từ mép tờ lật/lớp phủ tới khối —
        còn <= MEP_DOI. Updater rỗng làm khối thành 'đang động' (manim nướng sẵn phần tĩnh: đổi độ đục không hiện).
        Trả hàm gỡ, gọi ngay sau hoạt cảnh."""
        ds = []
        for m in cu:
            kd = [x for x in _khoi_doi(m) if len(x.get_all_points())]
            if not kd:
                continue
            k = self._ten.get(id(m), "?")
            yen = self._khung - self._doi_moi.get(id(m), 0)
            self._ghi("DOI_YEN %s %s %s đứng yên %d khung trước %s ở khung %d" % (self._bid, self._bc.ten, k, yen, ten,
                                                                               self._khung))
            if yen < FPS:
                print("NGOAI_VUNG %s doi_chua_on_dinh %s %s %d khung < %d trước %s" % (self._bid, self._bc.ten, k, yen,
                                                                                     FPS, ten))
            ds += [(k, x) for x in kd]
        an = {}

        def rong(mob, dt):
            return None

        def g(f):
            for k, x in ds:
                if id(x) in an:
                    continue
                d = cach(x)
                if d <= MEP_DOI:
                    x.set_opacity(0)
                    an[id(x)] = f
                    self._ghi("DOI_LAT %s %s %s khung %d cách %.3f <= %.2f giấu trọn %r" % (
                        self._bid, self._bc.ten, k, f, d, MEP_DOI, getattr(x, "chu_goc", "")))
        for _, x in ds:
            x.add_updater(rong)
        self._moi_khung.append(g)

        def go():
            self._moi_khung.remove(g)
            for k, x in ds:
                x.remove_updater(rong)
                if id(x) not in an:
                    print("NGOAI_VUNG %s doi_khong_giau %s %s hết %s chưa giấu" % (self._bid, self._bc.ten, k, ten))
        return go

    def _lat_trang(self, trang_moi, bc):
        """K3.lat_trang (trục 9) với tờ mới mang sẵn nền trang kế (vân giấy, mép, số trang): cùng hình học
        (tờ W+0,2, bóng 0,35, từ W+0,4 về -0,175, smooth, 1,1 s) nên khung cuối = khung đầu của beat sau."""
        W, H = bc.W, bc.H
        cu = list(self.mobjects)
        trang = Rectangle(width=W + 0.2, height=H + 0.2).set_stroke(width=0).set_fill(GIAY, 1)
        bong = Rectangle(width=0.35, height=H + 0.2).set_stroke(width=0).set_fill(MUC, 0.18).next_to(trang, LEFT, buff=0)
        g = K3.nen(self, trang_moi, seed=trang_moi)
        self.remove(g)
        # gáy vải là của cuốn sổ, không của tờ: đứng yên trên cùng, tờ mới trượt dưới nó (phiếu 89: gáy không quét qua ô PiP)
        gay = [m for m in g.submobjects if getattr(m, "k3_gay", False)]
        g.remove(*gay)
        VGroup(bong, trang).set_z_index(50)
        g.set_z_index(51)
        VGroup(*gay).set_z_index(52)
        to = VGroup(bong, trang, g).shift(RIGHT * (W + 0.575))
        self.add(to, *gay)
        go = self._giau_doi(cu, lambda x: bong.get_left()[0] - x.get_right()[0], "lat_trang")
        self._choi([to.animate.shift(LEFT * (W + 0.575))], round(T_LAT * FPS), rate_func=smooth)
        go()
        self.remove(*cu, to, *gay)
        g.add(*gay)
        g.set_z_index(-100)
        self.add(g)

    def _phu_lop(self, mau, bc):
        """K3.phu_lop (trục 9): các lớp đá phủ từ dưới lên kín màn; giữ các lớp lại làm khung đầu của beat sau."""
        cu = list(self.mobjects)
        lop = lop_phu_kin(mau, bc)
        W, H = bc.W, bc.H
        h = (H + 0.2) / len(mau)
        ds = list(lop.values())
        for l in ds:
            l.move_to([0, -H / 2 - h / 2 - 0.1, 0])
            self.add(l)
        go = self._giau_doi(cu, lambda x: x.get_bottom()[1] - max(q.get_top()[1] for q in ds), "phu_lop")
        self._choi([l.animate.move_to([0, -H / 2 - 0.1 + h * (i + 0.5), 0]) for i, l in enumerate(ds)],
                   round(T_PHU * FPS), rate_func=rate_functions.ease_out_cubic)
        go()
        self.remove(*cu)


def lop_phu_kin(mau, bc):
    """Các lớp phủ kín màn của phu_lop (chỉ số 0 = lớp dưới cùng), khoá 'phu:<TÊN MÀU>'."""
    W, H = bc.W, bc.H
    h = (H + 0.2) / len(mau)
    out = {}
    for i, c in enumerate(mau):
        r = Rectangle(width=W + 0.2, height=h).set_stroke(MUC, 2.5, 1).set_fill(K3.loang(MAU[c]), 1)
        r.move_to([0, -H / 2 - 0.1 + h * (i + 0.5), 0]).set_z_index(50)
        out["phu:" + c] = r
    return out


def _hop(m):
    return (m.get_left()[0], m.get_right()[0], m.get_bottom()[1], m.get_top()[1])


def _co_chu(m):
    return any(isinstance(x, Text) for x in m.get_family())


def _duc(m):
    """Độ đục lớn nhất trong họ (tô; nét nếu nét dày > 0) — phần tử đang mờ dần/thấm dần dưới 0,15 coi như chưa hiện."""
    d = 0.0
    for x in m.family_members_with_points():
        if not isinstance(x, VMobject):
            return 1.0
        try:
            d = max(d, float(np.max(x.get_fill_opacities())))
            if x.get_stroke_width() > 0:
                d = max(d, float(np.max(x.get_stroke_opacities())))
        except Exception:
            return 1.0
    return d


def _khoi_doi(m):
    """Các khối trên cùng trong họ m có chuỗi DOI (chu_goc của chu(), hoặc .text của Text)."""
    s = getattr(m, "chu_goc", None)
    if not isinstance(s, str) and isinstance(m, Text):
        s = m.text
    if isinstance(s, str) and DOI_RE.search(s):
        return [m]
    out = []
    for x in m.submobjects:
        out += _khoi_doi(x)
    return out


def kiem_vung(bid, bc, v, man, ct):
    """In NGOAI_VUNG (ra ngoài vùng an toàn, đè ô PiP, lấn xuống khối chú thích) và CHONG (hai khối chữ chồng nhau)."""
    a0, a1, b0, b1 = bc.an_toan
    p0, p1, q0, q1 = bc.pip
    ct_top = v.y_san - 0.18
    so_loi = 0
    hop = {}
    for k, m in man.items():
        if k.startswith("P:") or k.startswith("phu:") or m is None or len(m.get_all_points()) == 0:
            continue
        x0, x1, y0, y1 = _hop(m)
        hop[k] = (x0, x1, y0, y1)
        loi = []
        if x0 < a0 - 1e-3 or x1 > a1 + 1e-3 or y0 < b0 - 1e-3 or y1 > b1 + 1e-3:
            loi.append("ngoài vùng an toàn")
        if x1 > p0 and x0 < p1 and y1 > q0 and y0 < q1:
            loi.append("đè ô PiP")
        if bc.khia and x1 > bc.khia[0] and y1 > bc.khia[1] and not (x1 > p0 and y1 > q0):
            loi.append("lấn khía PiP")
        if not k.startswith("ct:") and ct and y0 < ct_top - 0.02 and x0 < bc.ct_x1:
            loi.append("lấn khối chú thích")
        if loi:
            so_loi += 1
            print("NGOAI_VUNG %s %s %s x %.2f..%.2f y %.2f..%.2f" % (bid, k, "+".join(loi), x0, x1, y0, y1))
    ks = [k for k in hop if _co_chu(man[k])]
    for i, a in enumerate(ks):
        for b_ in ks[i + 1:]:
            A, B = hop[a], hop[b_]
            w = min(A[1], B[1]) - max(A[0], B[0])
            h = min(A[3], B[3]) - max(A[2], B[2])
            if w > 0.02 and h > 0.02 and not (a.split(":")[0] == b_.split(":")[0] == "ct"):
                if _long(A, B) or _long(B, A):
                    continue
                print("CHONG %s %s %s %.2fx%.2f" % (bid, a, b_, w, h))
    print("KIEM_VUNG %s %s loi=%d phan_tu=%d" % (bid, bc.ten, so_loi, len(hop)))


def _net_cham(ve, chu, n=160):
    """ve không có chữ (dây treo, vòng khoanh, ngoặc, khung), chu có chữ: lấy n điểm đều trên từng nét đang hiện của ve,
    nới nửa độ dày nét + 0,01, xem có điểm nào rơi vào hộp từng glyph đang hiện của chu; trả (w, h) vùng chạm lớn nhất,
    không điểm nào chạm → None. Hộp bao của cả nhóm nét chéo phủ rộng hơn nét thật nhiều nên không dùng để kết luận chồng."""
    hop = []
    for x in chu.family_members_with_points():
        q = x.get_all_points()
        if len(q) and _duc(x) > 0.15:
            lo, hi = q.min(axis=0), q.max(axis=0)
            hop.append((lo[0], hi[0], lo[1], hi[1]))
    if not hop:
        return None
    wm = hm = 0.0
    cham = set()
    for s in ve.family_members_with_points():
        if not isinstance(s, VMobject) or _duc(s) <= 0.15:
            continue
        r = s.get_stroke_width() * 0.01 / 2 + 0.01
        try:
            pts = np.array([s.point_from_proportion(a) for a in np.linspace(0.0, 1.0, n)])
        except Exception:
            pts = s.get_all_points()
        for ib, B in enumerate(hop):
            m = ((pts[:, 0] >= B[0] - r) & (pts[:, 0] <= B[1] + r) & (pts[:, 1] >= B[2] - r) & (pts[:, 1] <= B[3] + r))
            if m.any():
                cham.add(ib)
                p = pts[m]
                wm = max(wm, float(p[:, 0].max() - p[:, 0].min()) + 2 * r)
                hm = max(hm, float(p[:, 1].max() - p[:, 1].min()) + 2 * r)
    return (wm, hm, len(cham)) if cham else None


def _long(A, B):
    """A nằm trọn trong B (chữ trong ô/thẻ của chính nó) — không tính là chồng."""
    return A[0] >= B[0] - 1e-3 and A[1] <= B[1] + 1e-3 and A[2] >= B[2] - 1e-3 and A[3] <= B[3] + 1e-3
