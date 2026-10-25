# Lớp cảnh beat K1 (Meniscus Lab) — 12 lớp theo storyboard K1 t2 (dfe35144): VungNuoc, MangMong, PhepTinh, BanQuang, PhanTu,
# ZoomThang, MuiTenCang, OngMaoDan, BangKe, ThuocLc, GiotBan, BongXaPhong.
# Mỗi lớp: __init__(**tham_so); ve(scene, W) dựng cảnh, trả {tên: mobject} (trạng thái cuối) để trang.kiem_vung soát.
# Cách dựng: hình (vật trên bàn quang học, KHÔNG chữ trong hình) ở vùng F; cột chữ (hook / nhan / dong / thuoc / trich) ở vùng C,
# hiện theo mốc lời (W.thoi). 16:9: hình trái, cột chữ phải; 9:16: hình trên, chữ dưới sát sàn. Lớp 'chu' (bảng / phép tính
# không có bước hình): cột chữ trên tấm thẻ bàn (khối có bóng đổ). Hình có mặt từ khung 0 (cảnh vào bằng zoom_thang / lấy nét
# quanh hình); bước hình (tham_so.buoc), thước (thuoc) và một số nhãn đổi hình qua K1.hien / K1.ve / K1.doi.
# Toạ độ: camera về k = 1 tâm 0 sau chuyển cảnh đầu beat, nên toạ độ màn = toạ độ thế giới.
# Màu (trục 3 K1): xanh nước NUOC = nước / khối lượng; cam CANG = sức căng mặt (mũi tên, đánh dấu); mực MUC = nét, chữ.
# SX lập 19/10/2026 (phiên local_df559baa, Opus 5.5). Không bản VI (lệnh Chủ tịch).
import re

import numpy as np
from manim import (VGroup, VMobject, Rectangle, RoundedRectangle, Line, Arrow, Circle, Dot, Ellipse, Arc, AnnularSector,
                   Polygon, config, ORIGIN, UP, DOWN, LEFT, RIGHT, PI)

import K1_ban_quang_hoc as K1
from K1_ban_quang_hoc import MUC, CANG, NUOC, NEN_TREN, chu, nuoc, so_hook
from K1_canh import trang
from K1_canh.trang import FPS

TEN_LOP = ("VungNuoc", "MangMong", "PhepTinh", "BanQuang", "PhanTu", "ZoomThang", "MuiTenCang", "OngMaoDan", "BangKe",
           "ThuocLc", "GiotBan", "BongXaPhong")
CO_CHU = (24, 22, 20, 18, 16)   # cỡ chữ cột (K1.chu), thu dần tới khi vừa
KHE = 0.22                      # khe giữa hai mục chữ
NET = 3.0

# ------------------------------------------------------------------ chữ: đo, xuống dòng
_RONG = {}


def rong(s, co):
    k = (s, co)
    if k not in _RONG:
        _RONG[k] = chu(s, co).width
    return _RONG[k]


def tach(s, co, wmax):
    dong, cur = [], ""
    for w in s.split(" "):
        thu = (cur + " " + w).strip()
        if cur and rong(thu, co) > wmax:
            dong.append(cur)
            cur = w
        else:
            cur = thu
    if cur:
        dong.append(cur)
    return dong


def khoi_chu(s, co, wmax, mau=MUC):
    g = VGroup(*[chu(d, co, mau) for d in tach(s, co, wmax)]).arrange(DOWN, aligned_edge=LEFT, buff=0.08)
    if g.width > wmax:
        g.scale(wmax / g.width)
    return g


def dat_trai_tren(m, x, y):
    m.shift([x - m.get_left()[0], y - m.get_top()[1], 0])
    return m


def so_mm(s):
    m = re.search(r"(\d+(?:\.\d+)?) mm", s)
    return float(m.group(1)) if m else None


# ------------------------------------------------------------------ vật vẽ (toạ độ cục bộ, đơn vị tự do; lớp đặt vừa vùng F)
def mat_ban(x0, x1, y=0.0):
    return VGroup(K1.bong_ban(w=(x1 - x0) * 0.95, y=y - 0.12), Line([x0, y, 0], [x1, y, 0]).set_stroke(MUC, NET))


def vung(w, h, x=0.0, y=0.0):
    """Vũng nước (mô hình góc mép 180°: mép tròn), đáy trên mặt bàn y."""
    r = min(h / 2 * 0.98, w / 2 * 0.98)
    return nuoc(RoundedRectangle(width=w, height=h, corner_radius=r)).move_to([x, y + h / 2, 0])


def thuoc_dung(x, y0, y1, mau=MUC):
    """Thước kẹp đứng (không chữ): thân dọc + hai ngàm ngang."""
    return VGroup(Line([x, y0, 0], [x, y1, 0]), Line([x - 0.28, y0, 0], [x + 0.06, y0, 0]),
                  Line([x - 0.28, y1, 0], [x + 0.06, y1, 0])).set_stroke(mau, NET)


def mui_cang(a, b, mau=CANG, w=6):
    return Arrow(np.array(a, dtype=float), np.array(b, dtype=float), buff=0, stroke_width=w,
                 max_tip_length_to_length_ratio=0.3).set_color(mau)


def phan_tu(dai=1.0, goc=0.0, dau_r=0.11, mau_dau=NUOC):
    """Phân tử SDS vẽ: đầu tròn (ưa nước) + đuôi gấp khúc (kỵ nước), đầu ở gốc toạ độ, đuôi theo hướng goc."""
    n = 8
    pts = [np.array([dau_r + dai * i / n, (0.06 * dai if i % 2 else -0.06 * dai) if i else 0.0, 0]) for i in range(n + 1)]
    duoi = VMobject().set_points_as_corners(pts).set_stroke(MUC, 2.4)
    dau = Circle(radius=dau_r).set_fill(mau_dau, 0.85).set_stroke(MUC, 1.6)
    return VGroup(duoi, dau).rotate(goc, about_point=ORIGIN)


def nhiet_ke(muc=0.55, h=2.0):
    ong = RoundedRectangle(width=0.22, height=h, corner_radius=0.11).set_stroke(MUC, 2.4).set_fill(NEN_TREN, 0.6)
    bau = Circle(radius=0.2).set_fill(CANG, 0.9).set_stroke(MUC, 2.4).move_to(ong.get_bottom() + DOWN * 0.1)
    cot = Rectangle(width=0.1, height=h * muc).set_stroke(width=0).set_fill(CANG, 0.9)
    cot.move_to(ong.get_bottom() + UP * (h * muc / 2))
    vach = VGroup(*[Line([0.11, -h / 2 + h * (i + 1) / 6, 0], [0.24, -h / 2 + h * (i + 1) / 6, 0]).set_stroke(MUC, 1.6)
                    for i in range(5)])
    return VGroup(ong, cot, bau, vach)


def binh_1l(s=1.0):
    pts = [(-0.25, 1.6), (0.25, 1.6), (0.25, 1.0), (0.8, 0.0), (-0.8, 0.0), (-0.25, 1.0)]
    v = Polygon(*[np.array([x * s, y * s, 0]) for x, y in pts]).set_stroke(MUC, 2.4).set_fill(NEN_TREN, 0.3)
    n = nuoc(Polygon(*[np.array([x * s, y * s, 0]) for x, y in [(0.47, 0.6), (0.78, 0.04), (-0.78, 0.04), (-0.47, 0.6)]]))
    return VGroup(v, n)


def can(s=1.0):
    de = Rectangle(width=1.4 * s, height=0.35 * s).set_stroke(MUC, 2.4).set_fill(NEN_TREN, 0.5).move_to([0, 0.175 * s, 0])
    dia = Rectangle(width=1.1 * s, height=0.08 * s).set_stroke(MUC, 2.4).move_to([0, 0.42 * s, 0])
    bot = Polygon(*[np.array([x * s, y * s, 0]) for x, y in [(-0.35, 0.46), (0.35, 0.46), (0.0, 0.78)]]).set_stroke(MUC, 1.6)
    bot.set_fill(NEN_TREN, 0.95)
    man = Rectangle(width=0.7 * s, height=0.16 * s).set_stroke(MUC, 1.6).set_fill(MUC, 0.15).move_to([0, 0.2 * s, 0])
    return VGroup(de, dia, bot, man)


def dong_ho(r=1.0):
    vo = Circle(radius=r).set_stroke(MUC, NET).set_fill(NEN_TREN, 0.5)
    vach = VGroup(*[Line(r * 0.85 * np.array([np.cos(a), np.sin(a), 0]), r * np.array([np.cos(a), np.sin(a), 0])).set_stroke(MUC, 2)
                    for a in np.linspace(0, 2 * PI, 12, endpoint=False)])
    kim = Line(ORIGIN, [0, r * 0.8, 0]).set_stroke(CANG, 5)
    return VGroup(vo, vach), kim


def mixen(r=1.0, n=14):
    g = VGroup()
    for i in range(n):
        a = 2 * PI * i / n
        g.add(phan_tu(dai=r * 0.75, goc=a + PI, dau_r=r * 0.13).shift(r * np.array([np.cos(a), np.sin(a), 0])))
    return g


def mang(t_ham, x0=-3.0, x1=3.0, n=41):
    """Màng mỏng nằm ngang: bề dày nửa t(x); polygon cùng số điểm để K1.doi biến hình."""
    xs = np.linspace(x0, x1, n)
    tren = [np.array([x, t_ham(x), 0]) for x in xs]
    duoi = [np.array([x, -t_ham(x), 0]) for x in xs[::-1]]
    return nuoc(Polygon(*(tren + duoi)))


# ------------------------------------------------------------------ lớp nền
class LopK1:
    """Lớp nền các cảnh K1. Lớp con khai CHIA ('cot': hình + cột chữ | 'chu': chỉ cột chữ trên thẻ bàn) và hinh() -> danh sách
    vật hiện từ khung 0; bước hình đăng bằng self.su()."""
    CHIA = "cot"
    TI_LE_CHU = 0.46

    def __init__(self, **tham_so):
        self.ts = tham_so
        self.L = None

    # --- thời điểm, sự kiện
    def t(self, moc=None):
        return self.W.thoi(moc) if moc else self.W.t0

    def su(self, t, fn, uu=0):
        self.ev.append((t, uu, len(self.ev), fn))

    def moc_buoc(self, *tu):
        """Mốc của bước hình đầu tiên có kiểu chứa một trong các từ; None nếu không có."""
        for x in self.ts.get("buoc", []):
            if any(w in x["kieu"] for w in tu):
                self.buoc_xong.add(x["kieu"])
                return x["moc"]
        return None

    # --- vùng (toạ độ màn = thế giới, k = 1)
    def _tran(self, x0, x1, y1):
        """Trần y của dải x0..x1: dưới ô PiP / khối nguồn nếu cùng dải ngang."""
        for h in (self.W.bc.pip, self.W.hop_ng):
            if h is not None and min(x1, h[1]) - max(x0, h[0]) > 0 and h[2] - 0.15 < y1:
                y1 = h[2] - 0.15
        return y1

    def vung_noi_dung(self):
        bc = self.W.bc
        a0, a1, b0, b1 = bc.an_toan
        if bc.doc:
            return (a0 + 0.08, a1 - 0.08, bc.san + 0.05, b1 - 0.05)
        return (a0 + 0.30, a1 - 0.30, bc.san + 0.05, b1 - 0.05)

    # --- chữ
    def muc_chu(self):
        """Các mục chữ của beat theo thứ tự mốc lời: {key, s, t, kieu, mui (mốc danh_dau)}."""
        ts = self.ts
        dd = ts.get("danh_dau") or {}
        ds = []
        if ts.get("hook"):
            ds.append(("hook", ts["hook"]))
        for k in ("nhan", "dong", "thuoc", "trich"):
            for x in ts.get(k, []):
                ds.append((k, x))
        ra = []
        for i, (k, x) in enumerate(ds):
            ra.append({"key": "%s_%d_%s" % (k, i, x["moc"]), "s": x["chu"], "moc": x["moc"], "t": self.t(x["moc"]), "kieu": k,
                       "mui": dd.get("moc") if dd.get("tro") == x["chu"] else None, "thu": i})
        ra.sort(key=lambda o: (o["t"], o["thu"]))
        return ra

    def dung_khoi(self, o, co, w):
        if o["kieu"] == "hook":
            gt, _, dv = o["s"].rpartition(" ")
            g = so_hook(gt, dv)
            if g.width > w:
                g.scale(w / g.width)
            return g
        lui = 0.18 if o["kieu"] == "trich" else 0.0
        g = khoi_chu(o["s"], co, w - lui)
        if lui:
            g.shift(RIGHT * lui)
            g = VGroup(Line(g.get_corner(LEFT + UP) + LEFT * 0.12, g.get_corner(LEFT + DOWN) + LEFT * 0.12).set_stroke(MUC, 3), g)
        return g

    def xep_cot(self, Z, os_, can_duoi=False):
        """Xếp mục chữ từ trên xuống trong vùng Z (x0, x1, y0, y1); cỡ 24 -> 16 rồi thu đều. Trả chiều cao đã dùng."""
        if not os_:
            return 0.0
        w, h = Z[1] - Z[0], Z[3] - Z[2]
        for co in CO_CHU:
            bl = [self.dung_khoi(o, co, w) for o in os_]
            tong = sum(x.height for x in bl) + KHE * (len(bl) - 1)
            if tong <= h:
                break
        k = min(1.0, h / tong)
        y = Z[3] if not can_duoi else Z[2] + tong * k
        for o, b in zip(os_, bl):
            b.scale(k)
            dat_trai_tren(b, Z[0], y)
            o["khoi"] = b
            y -= b.height + KHE * k
            self.W.da_ve.append(o["s"])
        return tong * k

    def dang_chu(self, os_):
        for o in os_:
            b = o["khoi"]
            self.su(o["t"], lambda b=b, key=o["key"]: self.hien(b, key))
            if o["mui"]:
                ln = Line(b.get_corner(LEFT + DOWN) + DOWN * 0.07, b.get_corner(RIGHT + DOWN) + DOWN * 0.07).set_stroke(CANG, 5)
                self.su(self.t(o["mui"]), lambda ln=ln: self.ve_ra(ln))
            fn = self.su_chu(o)
            if fn is not None:
                self.su(o["t"], fn)

    def su_chu(self, o):
        """Lớp con: hàm trả hoạt cảnh hình khi một mục chữ hiện (vd. thước kẹp, mực nước đổi); None nếu không."""
        return None

    # --- hiện / vẽ / đổi (K1)
    def hien(self, m, key=None):
        if key:
            self.man[key] = m
        else:
            self.hinh_ds.append(m)
        return [K1.hien(m)]

    def ve_ra(self, m):
        self.hinh_ds.append(m)
        return [K1.ve(m)]

    def doi(self, a, b):
        return [K1.doi(a, b)]

    # --- hình
    def dat_hinh(self, hien, an=()):
        """Thu/phóng các vật cục bộ (hien: có mặt từ khung 0; an: đích biến hình / vật hiện sau) vừa vùng F, giữa vùng."""
        tat = VGroup(*hien, *an)
        if not len(tat.get_all_points()):
            return
        F = self.F
        w, h = F[1] - F[0], F[3] - F[2]
        s = min(1.6, w / max(tat.width, 1e-6), h / max(tat.height, 1e-6))
        c = tat.get_center()
        dich = np.array([(F[0] + F[1]) / 2, (F[2] + F[3]) / 2, 0]) - s * c
        for m in list(hien) + list(an):
            m.scale(s, about_point=ORIGIN).shift(dich)
        self.ty_le = s

    def hinh(self):
        return []

    # --- dựng beat
    def ve(self, sc, W):
        self.sc, self.W, self.b = sc, W, W.b
        self.ev, self.man, self.hinh_ds, self.buoc_xong = [], {}, [], set()
        self.ty_le = 1.0
        L = self.vung_noi_dung()
        os_ = self.muc_chu()
        if self.CHIA == "chu":
            Z = (L[0] + 0.25, L[1] - 0.25, L[2] + 0.25, self._tran(L[0], L[1], L[3]) - 0.25)
            if not W.bc.doc:
                Z = (L[0] + 1.6, L[1] - 1.6, Z[2], Z[3])
            hc = self.xep_cot(Z, os_)
            yt = Z[3]
            xs = [o["khoi"].get_right()[0] for o in os_]
            the = RoundedRectangle(width=(max(xs) - Z[0]) + 0.5, height=hc + 0.5, corner_radius=0.12)
            the.set_fill(NEN_TREN, 0.95).set_stroke(MUC, 1.6, 0.6)
            the.move_to([Z[0] - 0.25 + the.width / 2, yt + 0.25 - the.height / 2, 0])
            the = K1.khoi(the)
            # thẻ (và chữ trong thẻ) dời vào giữa vùng nội dung dưới trần, không dính góc trên trái
            dich = np.array([(L[0] + L[1]) / 2, (Z[2] + Z[3] + 0.5) / 2, 0]) - the.get_center()
            dich[1] = min(dich[1], 0.0)
            the.shift(dich)
            for o in os_:
                o["khoi"].shift(dich)
            self.F = (Z[0], Z[0], Z[2], Z[2])
            co_dinh = [the]
        else:
            if W.bc.doc:
                # chừa 0,15 trên sàn: gạch chân mục mũi (DOWN 0,07 + nét) không lọt dưới sàn (h1, h3 9:16)
                Z = (L[0], L[1], L[2] + 0.15, L[2] + 0.55 * (L[3] - L[2]))
                hc = self.xep_cot(Z, os_, can_duoi=True)
                tren = self._tran(L[0], L[1], L[3])
                self.F = (L[0] + 0.1, L[1] - 0.1, L[2] + hc + 0.35, tren)
            else:
                xc = L[0] + (L[1] - L[0]) * (1 - self.TI_LE_CHU)
                self.xep_cot((xc, L[1], L[2], self._tran(xc, L[1], L[3])), os_)
                self.F = (L[0], xc - 0.35, L[2] + 0.1, self._tran(L[0], xc - 0.35, L[3]))
            co_dinh = self.hinh() or []
        for m in co_dinh:
            sc.add(m)
            self.hinh_ds.append(m)
        self.dang_chu(os_)
        con = [x["kieu"] for x in self.ts.get("buoc", []) if x["kieu"] not in self.buoc_xong]
        if con:
            raise NotImplementedError("beat %s: bước hình chưa dựng: %s" % (self.b["id"], con))
        sc.chuyen_dau(self.b)
        self.chay_su_kien()
        self.man["hinh"] = VGroup(*[m for m in self.hinh_ds if len(m.get_all_points()) or len(m.submobjects)])
        return self.man

    def chay_su_kien(self):
        sc, N = self.sc, trang.so_khung(self.b)
        ev = sorted(self.ev, key=lambda e: (e[0], e[1], e[2]))
        nhom = []
        for e in ev:
            if nhom and e[0] - nhom[-1][0][0] <= 0.25:
                nhom[-1].append(e)
            else:
                nhom.append([e])
        for i, g in enumerate(nhom):
            sc.toi(g[0][0], self.b["id"])
            an = []
            for e in g:
                an += list(e[3]() or [])
            if not an:
                continue
            tiep = nhom[i + 1][0][0] if i + 1 < len(nhom) else 1e9
            d = min(0.6, max(0.2, tiep - sc._khung / FPS - 0.03), (N - 2 - sc._khung) / FPS)
            sc.choi(*an, t=max(1.0 / FPS, d))


# ------------------------------------------------------------------ 12 lớp
class VungNuoc(LopK1):
    """Vũng nước trên bàn (mô hình tập 1): thước kẹp đo sâu; rót thêm chỉ loang rộng; giọt xà phòng; mũi tên sức căng co;
    mực nước hạ theo thước / nhãn '−29 %'."""

    def hinh(self):
        ts = self.ts
        ds = [so_mm(x["chu"]) for x in ([ts["hook"]] if ts.get("hook") else []) + ts.get("thuoc", [])]
        ds = [d for d in ds if d]
        d0 = ds[0] if ds else 5.43
        self.k = 1.3 / 5.45
        w = 4.2
        h = d0 * self.k
        self.w, self.d0 = w, d0
        moc_rot = self.moc_buoc("rót")
        w_max = w * (1.4 if moc_rot else 1.0)
        self.xt = w_max / 2 + 0.45
        self.vung = vung(w, h)
        ban = mat_ban(-w_max / 2 - 0.9, w_max / 2 + 0.9)
        hien = [ban, self.vung]
        an = []
        if moc_rot:
            self.vung_rong = vung(w_max, h)
            an.append(self.vung_rong)
            self.su(self.t(moc_rot), lambda: self.doi(self.vung, self.vung_rong))
        moc_xp = self.moc_buoc("xà phòng")
        if moc_xp:
            g0 = Circle(radius=0.13).set_fill(MUC, 0.25).set_stroke(MUC, 1.6).move_to([0.6, h + 1.6, 0])
            g1 = g0.copy().scale(0.5).move_to([0.6, h + 0.02, 0])
            g0.set_opacity(0)
            hien.append(g0)
            an.append(g1)
            self.su(self.t(moc_xp), lambda: self.doi(g0, g1))
        moc_co = self.moc_buoc("mũi tên cam")
        if moc_co:
            y = h + 0.12
            m0 = VGroup(mui_cang([-0.15, y, 0], [-1.85, y, 0]), mui_cang([0.15, y, 0], [1.85, y, 0]))
            m1 = VGroup(mui_cang([-0.15, y, 0], [-0.15 - 1.7 * 0.51, y, 0]), mui_cang([0.15, y, 0], [0.15 + 1.7 * 0.51, y, 0]))
            hien.append(m0)
            an.append(m1)
            self.su(self.t(moc_co), lambda: self.doi(m0, m1))
        self.thuoc = thuoc_dung(self.xt, 0, h)
        self.cac_muc = []
        for d in ds[1:] + ([round(d0 * 0.71, 2)] if any("29 %" in x["chu"] for x in ts.get("nhan", [])) else []):
            if abs(d - d0) > 1e-6:
                v = vung(w_max if moc_rot else w, d * self.k)
                tt = thuoc_dung(self.xt, 0, d * self.k)
                self.cac_muc.append((d, v, tt))
                an += [v, tt]
        an.append(self.thuoc)
        self.dat_hinh(hien, an)
        self.da_thuoc = False
        return hien

    def ha(self, d):
        for dd, v, tt in self.cac_muc:
            if abs(dd - d) < 1e-6:
                a = self.doi(self.vung, v)
                if self.da_thuoc:
                    return a + self.doi(self.thuoc, tt)
                self.da_thuoc = True
                self.thuoc.become(tt)
                return a + self.ve_ra(self.thuoc)
        return []

    def su_chu(self, o):
        d = so_mm(o["s"]) if o["kieu"] in ("hook", "thuoc") else None
        if d is not None and abs(d - self.d0) < 1e-6:
            def f():
                if self.da_thuoc:
                    return []
                self.da_thuoc = True
                return self.ve_ra(self.thuoc)
            return f
        if d is not None:
            return lambda d=d: self.ha(d)
        if o["kieu"] == "nhan" and "29 %" in o["s"]:
            return lambda: self.ha(round(self.d0 * 0.71, 2))
        return None


class MangMong(LopK1):
    """Màng xà phòng trên vòm kính kéo lên qua mặt dung dịch (thí nghiệm Bhamla 2017): vân giao thoa; màng mỏng dần."""

    def hinh(self):
        R = 1.6
        be = nuoc(Rectangle(width=5.0, height=0.8)).move_to([0, 0.4, 0])
        vom = Arc(radius=R, start_angle=0, angle=PI).set_stroke(MUC, 2.4, 0.7).shift([0, 0.8, 0])
        self.mang = AnnularSector(inner_radius=R + 0.02, outer_radius=R + 0.16, angle=PI, start_angle=0).set_fill(NUOC, 0.35)
        self.mang.set_stroke(NUOC, 1.6, 0.9).shift([0, 0.8, 0])
        ban = mat_ban(-2.9, 2.9)
        hien = [ban, be, vom, self.mang]
        an = []
        m = self.moc_buoc("vân giao thoa")
        if m:
            van = VGroup(*[Arc(radius=R + 0.09, start_angle=PI / 2 - a, angle=2 * a).set_stroke(c, 4).shift([0, 0.8, 0])
                           for a, c in ((0.45, CANG), (0.3, NUOC), (0.16, MUC))])
            an.append(van)
            self.su(self.t(m), lambda: self.ve_ra(van))
        m = self.moc_buoc("mỏng dần")
        if m:
            mong = AnnularSector(inner_radius=R + 0.02, outer_radius=R + 0.06, angle=PI, start_angle=0).set_fill(NUOC, 0.35)
            mong.set_stroke(NUOC, 1.6, 0.9).shift([0, 0.8, 0])
            an.append(mong)
            self.su(self.t(m), lambda: self.doi(self.mang, mong))
        self.dat_hinh(hien, an)
        return hien


class PhepTinh(LopK1):
    """Phép tính trên thẻ bàn; có bước hình (h4) thì hình bên: bình 1 L, cân 7,21 g, nhiệt kế 25 °C, dòng nguồn 'inferred' tô cam."""
    TI_LE_CHU = 0.55

    def __init__(self, **ts):
        super().__init__(**ts)
        self.CHIA = "cot" if ts.get("buoc") else "chu"

    def hinh(self):
        hien, an = [mat_ban(-2.4, 2.4)], []
        binh = binh_1l().move_to([-1.2, 0.8, 0])
        hien.append(binh)
        m = self.moc_buoc("cân")
        if m:
            c = can().move_to([0.6, 0.4, 0])
            an.append(c)
            self.su(self.t(m), lambda: self.hien(c))
        m = self.moc_buoc("nhiệt kế")
        if m:
            nk = nhiet_ke(0.5).move_to([1.95, 1.25, 0])
            an.append(nk)
            self.su(self.t(m), lambda: self.ve_ra(nk))
        m = self.moc_buoc("inferred")
        if m:
            self.su(self.t(m), self.sang_inferred)
        self.dat_hinh(hien, an)
        return hien

    def sang_inferred(self):
        ng = self.W.nguon
        if ng is None:
            return []
        ds = [x for x in ng if "inferred" in getattr(x, "text", "")]
        if not ds:
            raise ValueError("beat %s: không thấy dòng nguồn có 'inferred'" % self.b["id"])
        # tô cam chính dòng nguồn (không thêm vật mới: hộp khối nguồn giữ nguyên, hình không đè khối nguồn)
        return [ds[0].animate.set_color(CANG).set_opacity(1.0)]


class BanQuang(LopK1):
    """Bàn quang học: hai vũng cạnh nhau (nước / SDS) với thước kẹp; hoặc bánh xà phòng gia dụng mờ đi; hoặc hạt tiêu trên nước."""

    def hinh(self):
        ts = self.ts
        self.k = 1.3 / 5.45
        hien, an = [], []
        self.thuoc_moc = {}
        if ts.get("thuoc"):
            ds = [so_mm(x["chu"].split(":")[-1]) for x in ts["thuoc"]]
            hien.append(mat_ban(-4.2, 4.2))
            for i, (x, d) in enumerate(zip(ts["thuoc"], ds)):
                xc = -1.9 + 3.8 * i
                hien.append(vung(2.6, d * self.k, x=xc))
                tt = thuoc_dung(xc + 1.75, 0, d * self.k)
                an.append(tt)
                self.thuoc_moc[x["moc"]] = tt
            hien.append(Line([-0.15, 1.6, 0], [0.15, 1.6, 0]).set_stroke(MUC, 0))
        elif self.moc_buoc("xà phòng"):
            m = self.moc_buoc("xà phòng")
            hien.append(mat_ban(-2.6, 2.6))
            banh = RoundedRectangle(width=1.8, height=0.7, corner_radius=0.25).set_fill(NEN_TREN, 1).set_stroke(MUC, 2.4)
            banh.move_to([-1.0, 0.35, 0])
            coc = vung(1.6, 0.9, x=1.3)
            hien += [banh, coc]
            mo = banh.copy().set_opacity(0.15)
            an.append(mo)
            self.su(self.t(m), lambda: self.doi(banh, mo))
        else:
            m = self.moc_buoc("tiêu")
            hien.append(mat_ban(-2.6, 2.6))
            dia = vung(4.2, 0.6)
            hien.append(dia)
            rng = np.random.default_rng(7)
            tieu = VGroup(*[Dot([x, 0.6 + 0.03, 0], radius=0.045, color=MUC) for x in rng.uniform(-1.6, 1.6, 26)])
            an.append(tieu)
            if m:
                self.su(self.t(m), lambda: self.hien(tieu))
        self.dat_hinh(hien, an)
        return hien

    def su_chu(self, o):
        tt = self.thuoc_moc.get(o["moc"]) if o["kieu"] == "thuoc" else None
        if tt is not None:
            return lambda tt=tt: self.ve_ra(tt)
        return None


class PhanTu(LopK1):
    """Một phân tử SDS: vũng thu nhỏ biến mất (lao vào thang nm), phân tử lớn hiện; đầu sulfate viền cam khi nói 'negative'."""

    def hinh(self):
        hien, an = [mat_ban(-1.6, 1.6, y=-1.2)], []
        v = vung(2.2, 0.5, y=-1.2)
        hien.append(v)
        self.pt = phan_tu(dai=3.4, dau_r=0.45).move_to([0, 0, 0])
        an.append(self.pt)
        m = self.moc_buoc("phân tử")
        nho = v.copy().scale(0.05).set_opacity(0)
        an.append(nho)
        self.dat_hinh(hien, an)
        if m:
            self.su(self.t(m), lambda: self.doi(v, nho) + self.hien(self.pt))
        else:
            hien.append(self.pt)
        return hien

    def su_chu(self, o):
        if o["kieu"] == "nhan" and "negative" in o["s"]:
            dau = self.pt[1]
            return lambda: self.doi(dau, dau.copy().set_stroke(CANG, 5))
        return None


class ZoomThang(LopK1):
    """Thang nm: mặt nước một lớp phân tử (đầu trong nước, đuôi lên không khí); hoặc mixen cầu ~2,2 nm; hoặc ba thước ℓc."""

    def hinh(self):
        ts = self.ts
        hien, an = [], []
        m = self.moc_buoc("zoom_thang")
        if m:
            v = vung(2.0, 0.45, y=-1.0)
            hien += [mat_ban(-1.4, 1.4, y=-1.0), v]
            nuoc_ = nuoc(Rectangle(width=6.0, height=1.6)).move_to([0, -0.2, 0])
            lop = VGroup(*[phan_tu(dai=0.8, goc=PI / 2, dau_r=0.12).shift([x, 0.6, 0]) for x in np.linspace(-2.7, 2.7, 13)])
            mat = VGroup(nuoc_, lop)
            nho = v.copy().scale(0.05).set_opacity(0)
            an += [mat, nho]
            self.su(self.t(m), lambda: self.doi(v, nho) + self.hien(mat))
        elif ts.get("trich"):
            nuoc_ = nuoc(Rectangle(width=5.0, height=3.4)).set_fill(NUOC, 0.15)
            mx = mixen(1.1)
            hien += [nuoc_, mx]
            th = VGroup(Line([-1.1, -1.45, 0], [1.1, -1.45, 0]), Line([-1.1, -1.35, 0], [-1.1, -1.55, 0]),
                        Line([1.1, -1.35, 0], [1.1, -1.55, 0])).set_stroke(MUC, NET)
            an.append(th)
            for x in ts.get("nhan", []):
                if "nm" in x["chu"] and "about" in x["chu"]:
                    self.su(self.t(x["moc"]), lambda: self.ve_ra(th))
        else:
            ls = []
            for x in ts.get("nhan", []):
                g = re.search(r"ℓc (\d+\.\d+) mm", x["chu"])
                if g:
                    ls.append((x["moc"], float(g.group(1))))
            for i, (moc, l) in enumerate(ls):
                y = 1.0 - 0.9 * i
                thanh = Rectangle(width=l * 1.6, height=0.36).set_fill(NUOC, 0.55).set_stroke(MUC, 1.6)
                thanh.move_to([-2.2 + l * 0.8, y, 0])
                an.append(thanh)
                self.su(self.t(moc), lambda m_=thanh: self.hien(m_))
            hien.append(Line([-2.2, 1.4, 0], [-2.2, 1.0 - 0.9 * max(0, len(ls) - 1) - 0.4, 0]).set_stroke(MUC, NET))
        self.dat_hinh(hien, an)
        return hien


class MuiTenCang(LopK1):
    """Mũi tên cam = sức căng kéo dọc mặt. m3: SDS phủ kín mặt, mũi tên co còn 0,51. f4: chỗ mỏng, kéo mạnh hơn, chất lỏng kéo về."""

    def hinh(self):
        hien, an = [], []
        m_pack = self.moc_buoc("phủ kín")
        m_co = self.moc_buoc("co còn")
        if m_pack or m_co:
            nuoc_ = nuoc(Rectangle(width=6.0, height=1.4)).move_to([0, -0.7, 0])
            y = 0.85 if m_pack else 0.35       # có lớp phân tử: mũi tên nằm trên ngọn đuôi, không cắt đuôi
            m0 = VGroup(mui_cang([-0.2, y, 0], [-2.6, y, 0]), mui_cang([0.2, y, 0], [2.6, y, 0]))
            m1 = VGroup(mui_cang([-0.2, y, 0], [-0.2 - 2.4 * 0.51, y, 0]), mui_cang([0.2, y, 0], [0.2 + 2.4 * 0.51, y, 0]))
            hien += [nuoc_, m0]
            an.append(m1)
            if m_pack:
                lop = VGroup(*[phan_tu(dai=0.55, goc=PI / 2, dau_r=0.09).shift([x, -0.05, 0]) for x in np.linspace(-2.8, 2.8, 17)])
                an.append(lop)
                self.su(self.t(m_pack), lambda: self.hien(lop))
            if m_co:
                self.su(self.t(m_co), lambda: self.doi(m0, m1))
        else:
            deu = mang(lambda x: 0.32)
            mong = mang(lambda x: 0.32 - 0.24 * np.exp(-x * x / 0.35))
            self.mang_ = deu
            hien.append(deu)
            # chỗ mỏng căng hơn: mặt bị kéo VỀ chỗ mỏng (Marangoni), cùng chiều chất lỏng kéo về
            cang = VGroup(mui_cang([-1.6, 0.5, 0], [-0.3, 0.5, 0]), mui_cang([1.6, 0.5, 0], [0.3, 0.5, 0]))
            keo = VGroup(mui_cang([-2.6, 0, 0], [-0.9, 0, 0], NUOC), mui_cang([2.6, 0, 0], [0.9, 0, 0], NUOC))
            an += [mong, cang, keo]
            for x in self.ts.get("nhan", []):
                s = x["chu"]
                if "thin spot" in s:
                    self.su(self.t(x["moc"]), lambda: self.doi(self.mang_, mong))
                elif "stronger" in s:
                    self.su(self.t(x["moc"]), lambda: self.hien(cang))
                elif "dragged" in s:
                    self.su(self.t(x["moc"]), lambda: self.hien(keo))
        self.dat_hinh(hien, an)
        return hien


class OngMaoDan(LopK1):
    """Ống mao dẫn trong chậu: 'thoi_bong' — bọt khí nhỏ ở đầu ống (máy đo áp suất bọt cực đại);
    'dang_cao' — hai ống, cột nước dâng 147,2 mm, cột SDS 74,5 mm (theo thước)."""

    def hinh(self):
        ts = self.ts
        hien, an = [mat_ban(-2.4, 2.4)], []
        chau = nuoc(Rectangle(width=4.0, height=1.0)).move_to([0, 0.5, 0])
        hien.append(chau)

        def ong(x, y0=0.35, y1=3.4):
            return VGroup(Line([x - 0.1, y0, 0], [x - 0.1, y1, 0]), Line([x + 0.1, y0, 0], [x + 0.1, y1, 0])).set_stroke(MUC, 2.4)
        if ts.get("che_do") == "thoi_bong":
            hien.append(ong(0))
            bot = Circle(radius=0.26).set_fill(NUOC, 0.08).set_stroke(MUC, 2).move_to([0, 0.35 - 0.24, 0])
            an.append(bot)
            m = self.moc_buoc("bọt khí")
            if m:
                self.su(self.t(m), lambda: self.hien(bot))
        else:
            self.cot = {}
            hs = [so_mm(x["chu"].split(":")[-1]) for x in ts.get("thuoc", [])]
            hmax = max(hs) if hs else 1.0
            for i, (x, hh) in enumerate(zip(ts.get("thuoc", []), hs)):
                xc = -0.9 + 1.8 * i
                hien.append(ong(xc))
                c0 = nuoc(Rectangle(width=0.18, height=0.02)).move_to([xc, 1.0, 0])
                c1 = nuoc(Rectangle(width=0.18, height=2.3 * hh / hmax)).move_to([xc, 1.0 + 1.15 * hh / hmax, 0])
                hien.append(c0)
                an.append(c1)
                self.cot[x["moc"]] = (c0, c1)
        self.dat_hinh(hien, an)
        return hien

    def su_chu(self, o):
        if o["kieu"] == "thuoc" and getattr(self, "cot", None) and o["moc"] in self.cot:
            c0, c1 = self.cot[o["moc"]]
            return lambda: self.doi(c0, c1)
        return None


class BangKe(LopK1):
    """Bảng kê trên thẻ bàn; có bước hình thì hình bên: cốc nước có phân tử gom thành mixen + nhiệt kế (m5), đồng hồ 0,01 s (f5)."""
    TI_LE_CHU = 0.55

    def __init__(self, **ts):
        super().__init__(**ts)
        self.CHIA = "cot" if ts.get("buoc") else "chu"

    def hinh(self):
        hien, an = [mat_ban(-2.4, 2.4)], []
        m = self.moc_buoc("quả cầu")
        if m:
            coc = nuoc(Rectangle(width=2.6, height=2.0)).set_fill(NUOC, 0.18).move_to([-0.6, 1.0, 0])
            rng = np.random.default_rng(3)
            le = VGroup(*[phan_tu(dai=0.32, goc=a, dau_r=0.06).shift([x, y, 0]) for x, y, a in
                          zip(rng.uniform(-1.6, 0.4, 7), rng.uniform(0.3, 1.7, 7), rng.uniform(0, 2 * PI, 7))])
            mx = VGroup(*[mixen(0.22, 10).move_to(p) for p in ([-1.2, 1.4, 0], [-0.1, 0.9, 0], [-1.0, 0.5, 0])])
            hien += [coc, le]
            an.append(mx)
            self.su(self.t(m), lambda: self.hien(mx))
        m = self.moc_buoc("nhiệt kế")
        if m:
            nk = nhiet_ke(0.5).move_to([1.55, 1.25, 0])
            an.append(nk)
            self.su(self.t(m), lambda: self.ve_ra(nk))
        m = self.moc_buoc("đồng hồ")
        if m:
            vo, kim = dong_ho(1.2)
            vo.move_to([0, 1.5, 0])
            kim.shift([0, 1.5, 0])
            quay = kim.copy().rotate(-PI / 3, about_point=[0, 1.5, 0])
            hien += [vo, kim]
            an.append(quay)
            self.su(self.t(m), lambda: self.doi(kim, quay))
        self.dat_hinh(hien, an)
        return hien


class ThuocLc(LopK1):
    """Thước ℓc (độ dài mao dẫn) dựng cạnh vũng: vũng sâu 2 ℓc (mô hình tập 1)."""

    def hinh(self):
        k = 1.3 / 5.45
        h = 5.43 * k
        hien, an = [mat_ban(-3.0, 3.0), vung(4.0, h, x=-0.5)], []
        x = 2.0
        vach = VGroup(Line([x, 0, 0], [x, h / 2, 0]).set_stroke(CANG, 6),
                      *[Line([x - 0.12, y, 0], [x + 0.12, y, 0]).set_stroke(CANG, 3) for y in (0, h / 2)],
                      Line([x - 0.3, h, 0], [x + 0.3, h, 0]).set_stroke(MUC, 1.6, 0.6))
        an.append(vach)
        m = self.moc_buoc("thước")
        if m:
            self.su(self.t(m), lambda: self.ve_ra(vach))
        self.dat_hinh(hien, an)
        return hien


class GiotBan(LopK1):
    """Giọt trên bàn: điểm (R/ℓc)² < 1 tròn, > 1 dẹt. l6: hai giọt hiện theo nhãn; l7: giọt tròn dẹt lại."""

    def hinh(self):
        hien, an = [mat_ban(-3.0, 3.0)], []
        tron = nuoc(Ellipse(width=1.3, height=1.05))
        det = nuoc(Ellipse(width=1.9, height=0.55))
        ns = self.ts.get("nhan", [])
        if any("< 1" in x["chu"] for x in ns):
            tron.move_to([-1.4, 0.525, 0])
            det.move_to([1.4, 0.275, 0])
            an += [tron, det]
            for x in ns:
                if "< 1" in x["chu"]:
                    self.su(self.t(x["moc"]), lambda: self.hien(tron))
                elif "> 1" in x["chu"]:
                    self.su(self.t(x["moc"]), lambda: self.hien(det))
        else:
            tron.move_to([0, 0.525, 0])
            det.move_to([0, 0.275, 0])
            hien.append(tron)
            an.append(det)
            for x in ns:
                if "→ flattened" in x["chu"]:
                    self.su(self.t(x["moc"]), lambda: self.doi(tron, det))
        self.dat_hinh(hien, an)
        return hien


class BongXaPhong(LopK1):
    """Bong bóng xà phòng: hai mặt (ngoài, trong) sáng cam khi nói 'two surfaces'; f6: màng bong bóng < 1 μm cạnh màng vòm
    ~100 μm, đốm đen trước khi vỡ."""

    def hinh(self):
        hien, an = [], []
        if self.ts.get("trich"):
            bong = VGroup(Circle(radius=1.2).set_stroke(NUOC, 2.0), Circle(radius=1.18).set_stroke(NUOC, 1.2)).move_to([-1.6, 1.4, 0])
            be = nuoc(Rectangle(width=2.8, height=0.5)).move_to([1.9, 0.25, 0])
            vom = AnnularSector(inner_radius=1.0, outer_radius=1.25, angle=PI).set_fill(NUOC, 0.35).set_stroke(NUOC, 1.6)
            vom.shift([1.9, 0.5, 0])
            hien += [mat_ban(-3.2, 3.4), bong, be, vom]
            rng = np.random.default_rng(11)
            den = VGroup(*[Dot(1.19 * np.array([np.cos(a), np.sin(a), 0]) + np.array([-1.6, 1.4, 0]), radius=0.06, color=MUC)
                           for a in rng.uniform(0.3, 2.8, 6)])
            an.append(den)
            for x in self.ts.get("nhan", []):
                if "black" in x["chu"]:
                    self.su(self.t(x["moc"]), lambda: self.hien(den))
        else:
            ngoai = Circle(radius=1.6).set_stroke(NUOC, 3)
            trong = Circle(radius=1.45).set_stroke(NUOC, 3)
            bong = VGroup(ngoai, trong).set_fill(NUOC, 0.0)
            hien.append(bong)
            sang = VGroup(ngoai.copy().set_stroke(CANG, 5), trong.copy().set_stroke(CANG, 5))
            ap = VGroup(*[mui_cang(1.3 * np.array([np.cos(a), np.sin(a), 0]), 0.75 * np.array([np.cos(a), np.sin(a), 0]))
                          for a in np.linspace(0, 2 * PI, 8, endpoint=False)])
            an += [sang, ap]
            for x in self.ts.get("nhan", []):
                if "two surfaces" in x["chu"]:
                    self.su(self.t(x["moc"]), lambda: self.doi(bong, sang))
                elif "4γ" in x["chu"]:
                    self.su(self.t(x["moc"]), lambda: self.hien(ap))
        self.dat_hinh(hien, an)
        return hien


LOP = {ten: globals()[ten] for ten in TEN_LOP}
