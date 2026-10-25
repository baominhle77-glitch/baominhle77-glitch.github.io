# -*- coding: utf-8 -*-
# Lớp cảnh K1 TẬP 3 (Meniscus Lab, storyboard out/M1_MARANGONI 4a8ffa1d) — tệp riêng của tập: KHÔNG sửa lop.py dùng chung;
# nạp bằng 1 dòng "import K1_canh.lop_t3" do tools/nha_may_kenh.py tiêm vào canh.py (khoá lop_tap của tools/tap/ML_K1_t3.json).
# Hai lớp mới (ban_sac/K1_DAN_Y_SERI.md §t3): KhayTieu (khay nước nông nhìn chéo trên bàn, hạt tiêu nổi, giọt / kim xà phòng ở
# giữa) và DongMarangoni (đĩa nước dày cỡ cm nhìn ngang: kim ở giữa, ba vùng, vòng dừng, dòng về dọc đáy).
# Quy ước như lop.py: hình không chữ, ở vùng F; bước hình (tham_so.buoc) đăng bằng moc_buoc; đổi hình theo mục chữ qua su_chu.
# Màu (trục 3 K1): NUOC nước; CANG sức căng / dòng mặt do sức căng kéo; MUC nét, hạt tiêu, hạt tracer, kim.
# SX lập 24/10/2026 (phiên local_35f672dd, Opus 5.5). Không bản VI (lệnh Chủ tịch).
import numpy as np
from manim import (VGroup, VMobject, Rectangle, RoundedRectangle, Polygon, Line, Circle, Dot, Ellipse, Arc, DashedLine,
                   DashedVMobject, PI, Arrow)

from K1_ban_quang_hoc import MUC, CANG, NUOC, NEN_TREN, nuoc
from K1_canh.lop import (LOP, LopK1, mat_ban, mui_cang, thuoc_dung, phan_tu, vung, mixen, PhepTinh, BangKe, PhanTu,
                         ZoomThang, MuiTenCang, BanQuang, ThuocLc)

# ------------------------------------------------------------------ khay nhìn chéo (toạ độ cục bộ)
KA, KB = 2.2, 0.8          # bán trục mặt nước (ngang, dọc phối cảnh)
SAU = 0.35                 # thành khay
R_VONG = 0.5               # bán kính vòng dừng (tỉ lệ bán kính khay)
N_TIEU = 46


def _e(r, a):
    """Điểm trên mặt nước theo bán kính tương đối r (0..1) và góc a."""
    return np.array([KA * r * np.cos(a), KB * r * np.sin(a), 0.0])


def _tieu(rs, goc):
    return VGroup(*[Dot(_e(r, a), radius=0.04, color=MUC) for r, a in zip(rs, goc)])


class KhayTieu(LopK1):
    """Khay nước nông rắc tiêu nhìn chéo. h1: giọt xà phòng rơi giữa khay, tiêu dạt ra mép. h2: mũi tên cam dài ở vùng nước sạch.
    h3: kim bơm đều, tiêu dừng ở một vòng. p6: tiêu nổi, mặt trượt ra ngoài. w7: vòng làm thước đo. k1: tóm tắt."""

    def hinh(self):
        ts = self.ts
        ns = [x["chu"] for x in ts.get("nhan", [])]
        co = lambda *tu: any(w in s for s in ns for w in tu)
        rng = np.random.default_rng(3)
        goc = rng.uniform(0, 2 * PI, N_TIEU)
        r_rai = np.sqrt(rng.uniform(0.02, 0.85, N_TIEU))
        r_mep = rng.uniform(0.88, 0.96, N_TIEU)
        r_vong = rng.uniform(R_VONG + 0.08, 0.95, N_TIEU)
        self.mat = nuoc(Ellipse(width=2 * KA, height=2 * KB))
        thanh = VGroup(Line([-KA, 0, 0], [-KA, -SAU, 0]), Line([KA, 0, 0], [KA, -SAU, 0]),
                       VMobject().set_points_smoothly([_e(1.0, a) + [0, -SAU, 0] for a in np.linspace(PI, 2 * PI, 25)])
                       ).set_stroke(MUC, 3)
        vien = Ellipse(width=2 * KA, height=2 * KB).set_stroke(MUC, 3)
        hien = [mat_ban(-KA - 0.8, KA + 0.8, y=-KB - SAU), thanh, self.mat, vien]
        an = []
        self.kim = VGroup(Line([0, 2.0, 0], [0, 0.04, 0]).set_stroke(MUC, 4),
                          Circle(radius=0.07).set_fill(MUC, 0.9).set_stroke(MUC, 1).move_to([0, 0.02, 0]))
        self.vong = Ellipse(width=2 * KA * R_VONG, height=2 * KB * R_VONG).set_stroke(CANG, 5)
        self.mui = VGroup(*[mui_cang(_e(R_VONG + 0.05, a), _e(0.93, a), w=6)
                            for a in np.linspace(0, 2 * PI, 8, endpoint=False)])
        # trạng thái đầu của tiêu
        m_giot = self.moc_buoc("giọt")
        m_dat = self.moc_buoc("tiêu dạt")
        m_mui = self.moc_buoc("mũi tên cam")
        do_thuoc = co("measuring tool")
        tom_tat = co("not pushed by soap")
        if m_mui or tom_tat:
            r0 = r_mep
        elif do_thuoc:
            r0 = r_vong
        else:
            r0 = r_rai
        self.tieu = _tieu(r0, goc)
        hien.append(self.tieu)
        if m_giot:
            g0 = Circle(radius=0.13).set_fill(MUC, 0.25).set_stroke(MUC, 1.6).move_to([0, 2.2, 0])
            g1 = Circle(radius=0.07).set_fill(MUC, 0.25).set_stroke(MUC, 1.6).move_to([0, 0.02, 0])
            hien.append(g0)
            an.append(g1)
            self.su(self.t(m_giot), lambda: self.doi(g0, g1))
        if m_dat:
            dat = _tieu(r_mep, goc)
            an.append(dat)
            self.su(self.t(m_dat), lambda: self.doi(self.tieu, dat))
        if m_mui:
            an.append(self.mui)
            self.su(self.t(m_mui), lambda: self.hien(self.mui))
        if do_thuoc:
            hien += [self.kim, self.vong]
            y = -KB * R_VONG - 0.25
            self.thuoc = VGroup(Line([-KA * R_VONG, y, 0], [KA * R_VONG, y, 0]),
                                Line([-KA * R_VONG, y - 0.12, 0], [-KA * R_VONG, y + 0.12, 0]),
                                Line([KA * R_VONG, y - 0.12, 0], [KA * R_VONG, y + 0.12, 0])).set_stroke(MUC, 3)
            an.append(self.thuoc)
        else:
            an += [self.kim, self.vong]
        if tom_tat:
            giot = Circle(radius=0.07).set_fill(MUC, 0.25).set_stroke(MUC, 1.6).move_to([0, 0.02, 0])
            hien.append(giot)
            an.append(self.mui)
        self.tieu_vong = _tieu(r_vong, goc)
        self.tieu_mep = _tieu(r_mep, goc)
        an += [self.tieu_vong, self.tieu_mep]
        self.mui_mong = VGroup(*[mui_cang(_e(0.3, a), _e(0.8, a), w=4)
                                 for a in np.linspace(0, 2 * PI, 8, endpoint=False)])
        an.append(self.mui_mong)
        self.dat_hinh(hien, _khu_trung(hien, an))
        return hien

    def su_chu(self, o):
        s = o["s"]
        if "fed in steadily" in s:
            return lambda: self.hien(self.kim) + self.doi(self.tieu, self.tieu_vong)
        if "stops at a ring" in s or "flow ends where" in s:
            return lambda: self.ve_ra(self.vong)
        if "slides outward" in s:
            return lambda: self.hien(self.mui_mong) + self.doi(self.tieu, self.tieu_mep)
        if "measuring tool" in s:
            return lambda: self.ve_ra(self.thuoc)
        if "pulled by clean water" in s:
            return lambda: self.hien(self.mui)
        return None


# ------------------------------------------------------------------ đĩa nhìn ngang (toạ độ cục bộ)
DW, DH = 3.2, 1.0          # nửa bề rộng, bề dày lớp nước
XV = 1.6                   # mép vùng trong suốt = vòng dừng
N_TR = 44


def _vet(xs, dai, y=DH - 0.1):
    """Vệt tracer dọc mặt hai phía kim: độ dài theo dai(x)."""
    g = VGroup()
    for x in xs:
        d = dai(x)
        for s in (-1, 1):
            g.add(Line([s * x, y, 0], [s * (x + d), y, 0]).set_stroke(MUC, 3))
    return g


def _toc(x):
    """Hồ sơ tốc độ mặt (vẽ, không số): tăng tới đỉnh gần kim, giảm dần, sụt gắt ở mép vùng trong suốt."""
    v = min(1.0, x / 0.55) if x < 0.55 else 1.0 - 0.45 * (x - 0.55) / (XV - 0.55 - 0.15)
    if x > XV - 0.15:
        v *= max(0.0, (XV - x) / 0.15)
    return max(0.03, 0.42 * v)


class DongMarangoni(LopK1):
    """Đĩa nước dày nhìn ngang, kim bơm đều ở giữa. p2: dụng cụ + tracer. c2: ba vùng, cặp xoáy vùng ngoài. v1: ngoài gần
    đứng yên, dòng nhanh chỉ trong vùng trong suốt. v2: vệt tracer dài tới đỉnh rồi ngắn dần. v3: khung nhìn lướt tới mép.
    v4: mặt cắt lộ dòng về dọc đáy, một vòng. w1: mặt sạch trở lại, kéo đều không đẩy, vòng = hết xà phòng."""

    def hinh(self):
        ns = [x["chu"] for x in self.ts.get("nhan", [])]
        co = lambda *tu: any(w in s for s in ns for w in tu)
        rng = np.random.default_rng(5)
        nuoc_ = nuoc(Rectangle(width=2 * DW, height=DH)).move_to([0, DH / 2, 0])
        dia = VGroup(Line([-DW - 0.08, -0.06, 0], [DW + 0.08, -0.06, 0]), Line([-DW - 0.08, -0.06, 0], [-DW - 0.08, DH + 0.25, 0]),
                     Line([DW + 0.08, -0.06, 0], [DW + 0.08, DH + 0.25, 0])).set_stroke(MUC, 3)
        kim = Line([0, DH + 1.3, 0], [0, DH, 0]).set_stroke(MUC, 4)
        hien = [mat_ban(-DW - 0.6, DW + 0.6, y=-0.06), nuoc_, dia, kim]
        an = []
        tx = rng.uniform(-DW + 0.15, DW - 0.15, N_TR)
        ty = rng.uniform(0.1, DH - 0.12, N_TR)
        self.tr = VGroup(*[Dot([x, y, 0], radius=0.035, color=MUC) for x, y in zip(tx, ty)])
        m_bom = self.moc_buoc("bơm tiêm")
        if m_bom:
            ong = Rectangle(width=0.36, height=0.9).set_stroke(MUC, 3).move_to([0, DH + 1.75, 0])
            pit0 = Line([-0.16, DH + 2.15, 0], [0.16, DH + 2.15, 0]).set_stroke(MUC, 5)
            pit1 = pit0.copy().shift([0, -0.5, 0])
            can = Line([0, DH + 2.15, 0], [0, DH + 2.6, 0]).set_stroke(MUC, 3)
            can1 = Line([0, DH + 1.65, 0], [0, DH + 2.6, 0]).set_stroke(MUC, 3)
            hien += [ong, pit0, can]
            an += [pit1, can1]
            self.su(self.t(m_bom), lambda: self.doi(pit0, pit1) + self.doi(can, can1))
            self.thuoc = thuoc_dung(DW + 0.45, 0, DH)
            an.append(self.thuoc)
            self.tr_dich = self.tr.copy().shift([0.12, 0, 0])
            for d in self.tr_dich:
                d.shift([0.1 * np.sign(d.get_x()) if d.get_y() > DH * 0.6 else 0, 0, 0])
            an += [self.tr, self.tr_dich]
        else:
            # tracer có mặt từ đầu; vùng trong suốt sát mặt đã bị quét sạch (trừ c2 — quét theo lời)
            quet = not co("clear zone: tracers")
            if quet:
                for d in self.tr:
                    if abs(d.get_x()) < XV and d.get_y() > DH * 0.55:
                        d.set_opacity(0)
            hien.append(self.tr)
        # các vật dùng theo lời / bước
        y = DH
        self.vong = VGroup(DashedLine([-XV, -0.06, 0], [-XV, DH + 0.35, 0]), DashedLine([XV, -0.06, 0], [XV, DH + 0.35, 0])
                           ).set_stroke(CANG, 4)
        self.nguon = Circle(radius=0.13).set_stroke(CANG, 4).move_to([0, y, 0])
        # ba vùng dọc mặt: nguồn sát kim (cam), vùng trong suốt (xanh), vùng ngoài (mực mờ) — hai vùng sau là cặp hai phía
        self.vung = [Rectangle(width=0.5, height=0.12).set_fill(CANG, 0.5).set_stroke(width=0).move_to([0, y + 0.08, 0])]
        self.vung.append(VGroup(*[Rectangle(width=XV - 0.25, height=0.12).set_fill(NUOC, 0.75).set_stroke(width=0)
                                .move_to([s * (0.25 + XV) / 2, y + 0.08, 0]) for s in (-1, 1)]))
        self.vung.append(VGroup(*[Rectangle(width=DW - XV, height=0.12).set_fill(MUC, 0.35).set_stroke(width=0)
                                .move_to([s * (XV + DW) / 2, y + 0.08, 0]) for s in (-1, 1)]))
        self.xoay = VGroup()
        for s in (-1, 1):
            for xc in (XV + 0.45, XV + 1.15):
                for k in (-1, 1):
                    self.xoay.add(Arc(radius=0.16, start_angle=0, angle=1.6 * PI * k).move_to([s * xc + k * 0.17, DH * 0.62, 0])
                                  .set_stroke(MUC, 3))
        self.mui_ngoai = VGroup(*[mui_cang([s * x, y + 0.22, 0], [s * (x + 0.18), y + 0.22, 0], w=4) for s in (-1, 1)
                                  for x in (XV + 0.35, XV + 1.0)])
        self.mui_trong = VGroup(*[mui_cang([s * 0.2, y + 0.22, 0], [s * (XV - 0.1), y + 0.22, 0], w=6) for s in (-1, 1)])
        self.day_trong = VGroup(*[Rectangle(width=XV - 0.12, height=DH).set_fill(NUOC, 0.25).set_stroke(width=0)
                                  .move_to([s * (XV + 0.12) / 2, DH / 2, 0]) for s in (-1, 1)])
        self.ve_day = VGroup(*[mui_cang([s * (XV - 0.05), 0.15, 0], [s * 0.3, 0.15, 0], MUC, w=5) for s in (-1, 1)])
        self.vong_lap = VGroup(*[VGroup(mui_cang([s * 0.15, 0.25, 0], [s * 0.15, DH - 0.2, 0], MUC, w=4),
                                        mui_cang([s * (XV - 0.15), DH - 0.2, 0], [s * (XV - 0.15), 0.25, 0], MUC, w=4))
                                 for s in (-1, 1)])
        self.keo_deu = VGroup(mui_cang([XV + 0.85, y + 0.22, 0], [XV + 0.25, y + 0.22, 0], w=5),
                              mui_cang([XV + 0.85, y + 0.22, 0], [XV + 1.45, y + 0.22, 0], w=5))
        an += [self.vong, self.nguon, *self.vung, self.xoay, self.mui_ngoai, self.mui_trong, self.day_trong, self.ve_day,
               self.vong_lap, self.keo_deu]
        m_vung = self.moc_buoc("ba vùng")
        if m_vung:
            for i, v in enumerate(self.vung):
                self.su(self.t(m_vung) + 0.5 * i, lambda v=v: self.hien(v))
        m_xoay = self.moc_buoc("cặp xoáy")
        if m_xoay:
            self.su(self.t(m_xoay), lambda: self.ve_ra(self.xoay))
        m_dai = self.moc_buoc("dài dần")
        m_ngan = self.moc_buoc("ngắn dần")
        if m_dai or m_ngan:
            xs = np.linspace(0.12, 0.55, 4)
            v1 = _vet(xs, _toc)
            v2 = _vet(np.linspace(0.75, XV - 0.25, 4), _toc)
            an += [v1, v2]
            if m_dai:
                self.su(self.t(m_dai), lambda: self.ve_ra(v1))
            if m_ngan:
                self.su(self.t(m_ngan), lambda: self.ve_ra(v2))
        m_cam = self.moc_buoc("camera lướt")
        if m_cam:
            vet = _vet(np.linspace(0.12, XV - 0.05, 9), _toc)
            k0 = Rectangle(width=0.9, height=DH + 0.5).set_stroke(CANG, 3).move_to([0.55, DH / 2 + 0.1, 0])
            k1 = k0.copy().move_to([XV, DH / 2 + 0.1, 0])
            hien += [vet, k0]
            an.append(k1)
            self.su(self.t(m_cam), lambda: self.doi(k0, k1))
        m_cat = self.moc_buoc("mặt cắt")
        if m_cat:
            self.su(self.t(m_cat), lambda: self.hien(self.day_trong))
            hien.append(self.mui_trong)
        if co("soap runs out"):
            self.xa = VGroup(*[phan_tu(dai=0.28, goc=PI / 2, dau_r=0.05).shift([s * x, DH - 0.05, 0])
                               for s in (-1, 1) for x in np.linspace(0.15, XV - 0.3, 6)
                               if x < XV * (0.55 + 0.4 * rng.uniform())])
            self.xa_het = VGroup(*[p.copy().set_opacity(0) for p in self.xa])
            hien.append(self.xa)
            an.append(self.xa_het)
        self.dat_hinh(hien, _khu_trung(hien, an))
        return hien

    def su_chu(self, o):
        s = o["s"]
        bang = {"centimetre-thick": lambda: self.ve_ra(self.thuoc),
                "olive oil tracers": lambda: self.hien(self.tr),
                "tracers show the motion": lambda: self.doi(self.tr, self.tr_dich),
                "steady pumping": lambda: self.hien(self.mui_trong),
                "source": lambda: self.ve_ra(self.nguon),
                "tracers swept away": lambda: self.quet(),
                "barely moves": lambda: self.hien(self.mui_ngoai),
                "fast flow confined": lambda: self.hien(self.mui_trong),
                "fills the clear zone": lambda: self.hien(self.vung[1]),
                "edge = the ring": lambda: self.ve_ra(self.vong),
                "return flow along": lambda: self.ve_ra(self.ve_day),
                "one loop": lambda: self.hien(self.vong_lap),
                "surface clean again": lambda: self.doi(self.xa, self.xa_het),
                "even pull": lambda: self.hien(self.keo_deu),
                "soap runs out": lambda: self.ve_ra(self.vong)}
        for k, f in bang.items():
            if k in s and (k != "source" or s == "source"):
                return f
        return None

    def quet(self):
        dich, cx = self.tr.copy(), self.nguon.get_x()
        for d in dich:
            if abs(d.get_x() - cx) < XV * self.ty_le and d.get_y() > self._y_mat():
                d.set_opacity(0)
        return self.doi(self.tr, dich)

    def _y_mat(self):
        return self.nguon.get_y() - 0.45 * DH * self.ty_le


def _khu_trung(hien, an):
    """dat_hinh thu/phóng từng vật một lần: bỏ vật trùng (theo id) và vật đã có trong hien khỏi an."""
    da, ra = {id(m) for m in hien}, []
    for m in an:
        if id(m) not in da:
            da.add(id(m))
            ra.append(m)
    return ra


# ------------------------------------------------------------------ biến thể tập 3 của 7 lớp tập 2 (giữ tên trong LOP)
# Lớp tập 2 chỉ hiểu bước hình tập 2 (bình 1 L, cân, quả cầu, vũng t2...). Tập 3 ghi đè LOP[tên] bằng lớp con dưới đây:
# beat có bước t3 dựng hình t3; beat không có bước t3 về lớp cha (bảng 'chu' giữ nguyên). Tiền lệ K2_canh/lop_t2.py.
class _T3:
    """Trộn vào lớp t3: chọn nhánh theo từ trong kiểu bước (không đánh dấu); đổi hình theo mục chữ qua theo_chu."""

    def co_buoc(self, *tu):
        return any(w in x["kieu"] for x in self.ts.get("buoc", []) for w in tu)

    def theo_chu(self, tu, fn, kieu=None):
        if "_theo" not in self.__dict__:
            self._theo = []
        self._theo.append((tu, kieu, fn))

    def su_chu(self, o):
        for tu, kieu, fn in self.__dict__.get("_theo", []):
            if (kieu is None or o["kieu"] == kieu) and tu in o["s"]:
                return fn
        return super().su_chu(o)

    def xong(self, hien, an):
        # Arrow.scale giữ nguyên cỡ mũi (scale_tips=False): bọc VGroup để mũi co cùng thân, không to quá hình (w3 đè khối nguồn)
        bo = lambda ds: [VGroup(m) if isinstance(m, Arrow) else m for m in ds]
        self.dat_hinh(bo(hien), bo(_khu_trung(hien, an)))
        return hien


def _song_song(L=3.4, ti=36.43 / 71.97, y0=0.9, y1=0.0, x0=-1.7, w=6):
    """Hai mũi tên cam cùng gốc: dài (nước sạch) và ngắn theo tỉ lệ γ (xà phòng)."""
    return mui_cang([x0, y0, 0], [x0 + L, y0, 0], w=w), mui_cang([x0, y1, 0], [x0 + L * ti, y1, 0], w=w)


def _vong(r, mau=CANG, w=4, x=0.0, y=0.0):
    return Circle(radius=r).set_stroke(mau, w).set_fill(opacity=0).move_to([x, y, 0])


def _khay_tren(r=1.9, x=0.0, y=0.0):
    """Khay nhìn từ trên (đĩa nước) + kim ở tâm."""
    return VGroup(Circle(radius=r).set_fill(NUOC, 0.12).set_stroke(MUC, 2.4), Dot([0, 0, 0], radius=0.07, color=MUC)).move_to([x, y, 0])


class PhepTinhT3(_T3, PhepTinh):
    """h4: hai mũi tên dài / ngắn, khoảng chênh sáng. w2: bốn đại lượng vào công thức. w4: cạnh hình vuông = √ diện tích.
    r2: vòng nở 1,68 lần."""

    def hinh(self):
        if self.co_buoc("khoảng chênh"):
            m = self.moc_buoc("khoảng chênh")
            dai, ngan = _song_song(y0=0.5)
            x1 = ngan.get_end()[0]
            chenh = Rectangle(width=1.7 - x1, height=0.3).set_stroke(CANG, 3).set_fill(CANG, 0.25).move_to([(x1 + 1.7) / 2, 0, 0])
            gach = DashedLine([1.7, 0.5, 0], [1.7, -0.22, 0]).set_stroke(MUC, 2)
            sach = Circle(radius=0.18).set_fill(NUOC, 0.85).set_stroke(MUC, 1.6).move_to([-2.15, 0.5, 0])
            xp = phan_tu(dai=0.36, dau_r=0.08).shift([-2.45, 0, 0])
            self.su(self.t(m), lambda: self.ve_ra(gach) + self.hien(chenh))
            return self.xong([mat_ban(-2.6, 2.2, y=-0.4), sach, xp, dai, ngan], [chenh, gach])
        if self.co_buoc("bốn đại lượng"):
            m = self.moc_buoc("bốn đại lượng")
            u = mui_cang([-1.6, 1.25, 0], [1.6, 1.25, 0]).set_opacity(0.3)
            u1 = u.copy().set_opacity(1)
            ke = Line([-2.7, 0.92, 0], [2.7, 0.92, 0]).set_stroke(MUC, 1.6, 0.6)
            g = [VGroup(*_song_song(L=0.7, y0=0.18, y1=-0.12, x0=-0.35, w=4)),
                 VGroup(*[mui_cang([-0.35, y, 0], [-0.35 + 0.7 * k, y, 0], MUC, 3) for y, k in ((0.25, 1), (0.0, 0.65), (-0.25, 0.3))]),
                 nuoc(Rectangle(width=0.6, height=0.6)),
                 VGroup(_vong(0.32), Line([0, 0, 0], [0.32, 0, 0]).set_stroke(MUC, 2), Dot([0, 0, 0], radius=0.05, color=MUC))]
            for i, x in enumerate((-2.1, -0.7, 0.7, 2.1)):
                g[i].move_to([x, 0.4, 0])
                self.su(self.t(m) + 0.45 * i, lambda gi=g[i]: self.hien(gi))
            self.theo_chu("u* ≈", lambda: self.doi(u, u1), "dong")
            return self.xong([ke, u], g + [u1])
        if self.co_buoc("√"):
            m = self.moc_buoc("√")
            s = 1.8
            vuong = nuoc(Rectangle(width=s, height=s)).move_to([-0.9, 0.2, 0])
            luoi = VGroup(*[Line([-0.9 - s / 2 + s * i / 10, 0.2 - s / 2, 0], [-0.9 - s / 2 + s * i / 10, 0.2 + s / 2, 0]) for i in range(1, 10)],
                          *[Line([-0.9 - s / 2, 0.2 - s / 2 + s * i / 10, 0], [-0.9 + s / 2, 0.2 - s / 2 + s * i / 10, 0]) for i in range(1, 10)])
            luoi.set_stroke(MUC, 1, 0.35)
            canh = Line([-0.9 - s / 2, 0.2 - s / 2 - 0.12, 0], [-0.9 + s / 2, 0.2 - s / 2 - 0.12, 0]).set_stroke(CANG, 8)
            day = nuoc(Rectangle(width=1.2, height=1.2)).move_to([1.9, -0.4, 0])
            xp = Line([1.3, 0.22, 0], [2.5, 0.22, 0]).set_stroke(CANG, 4)
            self.su(self.t(m), lambda: self.ve_ra(canh))
            self.theo_chu("thinner still", lambda: self.hien(day) + self.ve_ra(xp), "dong")
            return self.xong([vuong, luoi], [canh, day, xp])
        if self.co_buoc("nở rộng"):
            m = self.moc_buoc("nở rộng")
            c0 = _vong(0.75)
            c1 = _vong(0.75 * 1.68)
            cu = _vong(0.75, w=3).set_stroke(opacity=0.35)
            self.su(self.t(m), lambda: self.doi(c0, c1))
            return self.xong([_khay_tren(), cu, c0], [c1])
        return super().hinh()


class BangKeT3(_T3, BangKe):
    """p3: cốc nước + chai SDS, thang nồng độ log, vạch 8,23 mM. v6: đuôi dài dần, vòng phồng. w5: r* ~ Qa^(3/4).
    r3: vòng 15 mm vẽ nét đứt (ước lượng)."""

    def hinh(self):
        if self.co_buoc("chai SDS", "thang nồng độ"):
            m1, m2 = self.moc_buoc("chai SDS"), self.moc_buoc("thang nồng độ")
            xl = lambda c: -2.4 + 1.6 * np.log10(c)
            truc = VGroup(Line([xl(1), 2.4, 0], [xl(1000), 2.4, 0]).set_stroke(MUC, 3),
                          *[Line([xl(d * k), 2.4, 0], [xl(d * k), 2.4 + (0.3 if k == 1 else 0.14), 0]).set_stroke(MUC, 2 if k == 1 else 1.2)
                            for d in (1, 10, 100) for k in range(1, 10)], Line([xl(1000), 2.4, 0], [xl(1000), 2.7, 0]).set_stroke(MUC, 2))
            coc = nuoc(Rectangle(width=1.1, height=1.3)).move_to([-1.1, 0.65, 0])
            chai = VGroup(Polygon(*[np.array([x + 1.0, y, 0]) for x, y in [(-0.42, 0), (0.42, 0), (0.42, 1.3), (0.14, 1.65), (0.14, 1.95),
                                                                        (-0.14, 1.95), (-0.14, 1.65), (-0.42, 1.3)]]).set_stroke(MUC, 2.4).set_fill(NEN_TREN, 0.6),
                          Rectangle(width=0.84, height=0.5).set_stroke(MUC, 1.6).set_fill(CANG, 0.15).move_to([1.0, 0.7, 0]))
            vach = VGroup(Line([xl(8.23), 2.15, 0], [xl(8.23), 2.95, 0]).set_stroke(CANG, 7), Dot([xl(8.23), 2.4, 0], radius=0.09, color=CANG))
            hai = Line([xl(1), 3.15, 0], [xl(100), 3.15, 0]).set_stroke(NUOC, 7)
            # khổ dọc vùng hình thấp: cốc + chai đứng trái thang, thang hạ xuống cùng nền (hình dẹt, không teo)
            for v in (truc, vach, hai):
                v.shift([0, -1.95, 0])
            coc.scale(0.55).move_to([-3.75, 0.36, 0])
            chai.scale(0.55, about_point=np.array([1.0, 0, 0])).shift([-3.95, 0, 0])
            if m1:
                self.su(self.t(m1), lambda: self.hien(coc) + self.hien(chai))
            if m2:
                self.su(self.t(m2), lambda: self.ve_ra(vach))
            self.theo_chu("orders of magnitude", lambda: self.ve_ra(hai), "dong")
            return self.xong([mat_ban(-4.3, 2.6), truc], [coc, chai, vach, hai])
        if self.co_buoc("phồng dần"):
            m = self.moc_buoc("phồng dần")
            pts = [phan_tu(dai=d, dau_r=0.16).shift([-2.8, 0, 0]) for d in (0.8, 1.2, 1.6)]
            vs = [_vong(r, x=1.5) for r in (0.22, 0.6, 1.3)]
            kim = Dot([1.5, 0, 0], radius=0.07, color=MUC)
            for i in (1, 2):
                self.su(self.t(m) + 0.9 * (i - 1), lambda i=i: self.doi(pts[0], pts[i]) + self.doi(vs[0], vs[i]))
            return self.xong([pts[0], vs[0], kim], pts[1:] + vs[1:])
        if self.co_buoc("đường cong"):
            m = self.moc_buoc("đường cong")
            X = lambda x: -2.0 + 4.0 * x
            Y = lambda x: -1.2 + 1.7 * x ** 0.75
            truc = VGroup(Line([-2.0, -1.2, 0], [2.3, -1.2, 0]), Line([-2.0, -1.2, 0], [-2.0, 0.7, 0])).set_stroke(MUC, 3)
            thang = DashedLine([-2.0, -1.2, 0], [2.0, 0.5, 0]).set_stroke(MUC, 2, 0.4)
            cong = VMobject().set_points_smoothly([np.array([X(x), Y(x), 0]) for x in np.linspace(0, 1, 40) ** 1.5]).set_stroke(MUC, 5)
            dau = VGroup(*[VGroup(Dot([X(x), Y(x), 0], radius=0.08, color=CANG),
                                  DashedLine([X(x), -1.2, 0], [X(x), Y(x), 0]).set_stroke(CANG, 2),
                                  DashedLine([-2.0, Y(x), 0], [X(x), Y(x), 0]).set_stroke(CANG, 2)) for x in (0.45, 0.9)])
            self.su(self.t(m), lambda: self.ve_ra(cong))
            self.theo_chu("1.68", lambda: self.ve_ra(dau), "dong")
            return self.xong([truc, thang], [cong, dau])
        if self.co_buoc("ước lượng"):
            m = self.moc_buoc("ước lượng")
            vong = _vong(1.0, MUC, 2.4)
            mo = vong.copy().set_stroke(opacity=0.25)
            dut = DashedVMobject(_vong(1.0, CANG, 6), num_dashes=28)
            self.su(self.t(m), lambda: self.doi(vong, mo) + self.ve_ra(dut))
            return self.xong([_khay_tren(), vong], [mo, dut])
        return super().hinh()


class PhanTuT3(_T3, PhanTu):
    """p4: dưới / trên cmc — phân tử dư gom thành mixen, kim bơm hiện lại ở góc. v7: đổi đầu (SDS → C12TAB), giữ đuôi, vòng lớn hơn."""

    def hinh(self):
        if self.co_buoc("quả cầu nhỏ", "kim bơm"):
            m1, m2 = self.moc_buoc("quả cầu nhỏ"), self.moc_buoc("kim bơm")
            coc = nuoc(Rectangle(width=4.4, height=2.4)).move_to([0, 0, 0])
            mat = VGroup(*[phan_tu(dai=0.5, goc=PI / 2, dau_r=0.09).shift([x, 1.2, 0]) for x in np.linspace(-1.95, 1.95, 12)])
            rng = np.random.default_rng(5)
            le = VGroup(*[phan_tu(dai=0.36, goc=a, dau_r=0.07).shift([x, y, 0]) for x, y, a in
                          zip(rng.uniform(-1.7, 1.7, 8), rng.uniform(-0.9, 0.6, 8), rng.uniform(0, 2 * PI, 8))])
            het = le.copy().set_opacity(0)
            mx = VGroup(mixen(0.32, 10).move_to([-0.9, -0.35, 0]), mixen(0.32, 10).move_to([0.9, -0.15, 0]))
            kim = VGroup(Line([1.75, 2.7, 0], [1.75, 1.3, 0]).set_stroke(MUC, 5), _vong(0.16, w=4, x=1.75, y=1.26))
            if m1:
                self.su(self.t(m1), lambda: self.doi(le, het) + self.hien(mx))
            if m2:
                self.su(self.t(m2), lambda: self.ve_ra(kim))
            return self.xong([coc, mat, le], [het, mx, kim])
        if self.co_buoc("đổi đầu"):
            m = self.moc_buoc("đổi đầu")
            self.pt = phan_tu(dai=2.4, dau_r=0.22).shift([-2.4, 0, 0])
            dau2 = RoundedRectangle(width=0.62, height=0.62, corner_radius=0.12).set_fill(NUOC, 0.85).set_stroke(MUC, 1.6)
            dau2.move_to([-2.4 + 0.22 - 0.31, 0, 0])
            v0, v1 = _vong(0.55, x=1.7), _vong(1.0, x=1.7)
            kim = Dot([1.7, 0, 0], radius=0.07, color=MUC)
            self.su(self.t(m), lambda: self.doi(self.pt[1], dau2))
            self.theo_chu("larger zone", lambda: self.doi(v0, v1), "nhan")
            return self.xong([self.pt, v0, kim], [dau2, v1])
        return super().hinh()

    def su_chu(self, o):
        if "pt" not in self.__dict__ and "negative" in o["s"]:
            return None
        return super().su_chu(o)


class ZoomThangT3(_T3, ZoomThang):
    """c1: khay → mặt nước chia ô, ô kéo ô bên (nước sạch kéo mạnh, chỗ xà phòng kéo yếu). c3: đĩa → lớp phân tử ở mặt cạnh kim.
    s8: lùi khay → vũng tập 2 → vũng tập 1, thước ℓc, mũi tên cam kéo mặt khay."""

    def hinh(self):
        if self.co_buoc("từ khay xuống"):
            m = self.moc_buoc("từ khay xuống")
            rng = np.random.default_rng(9)
            khay = VGroup(nuoc(Ellipse(width=4.0, height=1.4)),
                          *[Dot([x, y, 0], radius=0.035, color=MUC) for x, y in zip(rng.uniform(-1.5, 1.5, 24), rng.uniform(-0.4, 0.4, 24))])
            nho = khay.copy().scale(0.05).set_opacity(0)
            nuoc_ = nuoc(Rectangle(width=6.3, height=1.4)).move_to([0, -0.5, 0])
            xs = np.linspace(-2.7, 2.7, 7)
            o = VGroup(*[Rectangle(width=0.86, height=0.3).set_stroke(MUC, 1.6).set_fill(MUC if i == 3 else NUOC, 0.25 if i == 3 else 0.1)
                         .move_to([x, 0.37, 0]) for i, x in enumerate(xs)])
            manh, yeu = VGroup(), VGroup()
            for i in range(6):
                xb = (xs[i] + xs[i + 1]) / 2
                for j, sgn in ((i, -1), (i + 1, 1)):
                    d = 0.2 if j == 3 else 0.42
                    (yeu if j == 3 else manh).add(mui_cang([xb, 0.8, 0], [xb + sgn * d, 0.8, 0], w=4))
            mat = VGroup(nuoc_, o)
            self.su(self.t(m), lambda: self.doi(khay, nho) + self.hien(mat))
            self.theo_chu("pulls its neighbours", lambda: self.hien(VGroup(manh, yeu)), "nhan")
            self.theo_chu("strong pull", lambda: self.doi(manh, manh.copy().set_stroke(width=9)), "nhan")
            self.theo_chu("weaker pull", lambda: self.doi(yeu, yeu.copy().set_stroke(width=9)), "nhan")
            return self.xong([khay], [nho, mat, manh, yeu])
        if self.co_buoc("từ đĩa xuống"):
            m = self.moc_buoc("từ đĩa xuống")
            dia = VGroup(nuoc(Rectangle(width=4.4, height=0.9)), Line([0, 1.6, 0], [0, 0.45, 0]).set_stroke(MUC, 4))
            nho = dia.copy().scale(0.05).set_opacity(0)
            nuoc_ = nuoc(Rectangle(width=6.0, height=1.8)).move_to([0, -0.5, 0])
            kim = Line([-2.6, 2.0, 0], [-2.6, 0.42, 0]).set_stroke(MUC, 6)
            lop = VGroup(*[phan_tu(dai=0.5, goc=PI / 2, dau_r=0.09).shift([x, 0.4, 0]) for x in np.linspace(-2.25, 2.7, 13)])
            chim = VGroup(lop[4], lop[8], lop[11])
            chim1 = VGroup(*[p.copy().rotate(PI / 3).shift([0.15, -0.95 - 0.2 * k, 0]) for k, p in enumerate(chim)])
            mui = mui_cang([-2.2, 1.15, 0], [2.4, 1.15, 0])
            gan = VGroup(nuoc_, kim, lop)
            self.su(self.t(m), lambda: self.doi(dia, nho) + self.hien(gan))
            self.theo_chu("ride the surface", lambda: self.ve_ra(mui), "nhan")
            self.theo_chu("dissolve", lambda: self.doi(chim, chim1), "nhan")
            return self.xong([dia], [nho, gan, chim1, mui])
        if self.co_buoc("zoom_thang lùi"):
            m1, m2, m3 = self.moc_buoc("zoom_thang lùi"), self.moc_buoc("thước ℓc"), self.moc_buoc("kéo mặt khay")
            rng = np.random.default_rng(4)
            khay = VGroup(nuoc(Ellipse(width=4.4, height=1.6)),
                          *[Dot([x, y, 0], radius=0.04, color=MUC) for x, y in zip(rng.uniform(-1.7, 1.7, 26), rng.uniform(-0.45, 0.45, 26))])
            khay.move_to([0, 0.9, 0])
            nho = khay.copy().scale(0.38).move_to([-2.5, 0.5, 0])
            v2 = VGroup(vung(0.9, 0.32, x=-0.45), vung(0.9, 0.2, x=0.55))
            v1 = vung(1.5, 0.6, x=2.3)
            th = thuoc_dung(3.25, 0, 0.3, CANG)
            keo = VGroup(mui_cang([-2.35, 0.95, 0], [-1.75, 0.95, 0], w=5), mui_cang([-2.65, 0.95, 0], [-3.25, 0.95, 0], w=5))
            if m1:
                self.su(self.t(m1), lambda: self.doi(khay, nho))
                self.su(self.t(m1) + 0.7, lambda: self.hien(v2))
                self.su(self.t(m1) + 1.4, lambda: self.hien(v1))
            if m2:
                self.su(self.t(m2), lambda: self.ve_ra(th))
            if m3:
                self.su(self.t(m3), lambda: self.hien(keo))
            return self.xong([mat_ban(-3.4, 3.4), khay], [nho, v2, v1, th, keo])
        return super().hinh()


class MuiTenCangT3(_T3, MuiTenCang):
    """p1: chỗ xà phòng giữa mặt nước; mũi tên dài (nước sạch) và ngắn (xà phòng) kéo ngược nhau; mặt trượt ra phía mũi tên dài,
    nước bên dưới bị kéo theo; cặp mũi tên chớp sáng."""

    def hinh(self):
        if not self.co_buoc("trượt về", "chớp sáng"):
            return super().hinh()
        m1, m2 = self.moc_buoc("trượt về"), self.moc_buoc("chớp sáng")
        nuoc_ = nuoc(Rectangle(width=6.4, height=1.6)).move_to([0, -0.8, 0])
        xp = Rectangle(width=1.2, height=0.12).set_stroke(width=0).set_fill(MUC, 0.35).move_to([0, 0.06, 0])
        xp1 = Rectangle(width=2.2, height=0.12).set_stroke(width=0).set_fill(MUC, 0.3).move_to([0, 0.06, 0])
        hat = VGroup(*[Dot([x, 0.03, 0], radius=0.05, color=MUC) for x in (-2.7, -2.0, -1.3, 1.3, 2.0, 2.7)])
        hat1 = VGroup(*[Dot([x + 0.5 * np.sign(x), 0.03, 0], radius=0.05, color=MUC) for x in (-2.7, -2.0, -1.3, 1.3, 2.0, 2.7)])
        dai = VGroup(mui_cang([0.6, 0.45, 0], [2.7, 0.45, 0]), mui_cang([-0.6, 0.45, 0], [-2.7, 0.45, 0]))
        ngan = VGroup(mui_cang([0.6, 0.45, 0], [0.05, 0.45, 0]), mui_cang([-0.6, 0.45, 0], [-0.05, 0.45, 0]))
        duoi = VGroup(mui_cang([0.9, -0.55, 0], [2.5, -0.55, 0], NUOC, 5), mui_cang([-0.9, -0.55, 0], [-2.5, -0.55, 0], NUOC, 5))
        sang = VGroup(dai.copy(), ngan.copy()).set_stroke(width=12).set_opacity(0.45)
        if m1:
            self.su(self.t(m1), lambda: self.doi(hat, hat1) + self.doi(xp, xp1))
        if m2:
            self.su(self.t(m2), lambda: self.hien(sang))
        self.theo_chu("long arrow", lambda: self.hien(dai), "nhan")
        self.theo_chu("short arrow", lambda: self.hien(ngan), "nhan")
        self.theo_chu("water below", lambda: self.hien(duoi), "nhan")
        return self.xong([nuoc_, xp, hat], [xp1, hat1, dai, ngan, duoi, sang])


class BanQuangT3(_T3, BanQuang):
    """r4: khay tiêu cạnh chai nước rửa chén; chai mờ đi. k2: ly rượu vang, màng chất lỏng leo thành ly thành giọt."""

    def hinh(self):
        self.thuoc_moc = {}
        if self.co_buoc("nước rửa chén"):
            m = self.moc_buoc("nước rửa chén")
            rng = np.random.default_rng(6)
            khay = VGroup(vung(2.8, 0.4, x=-1.1), *[Dot([x, 0.43, 0], radius=0.04, color=MUC) for x in rng.uniform(-2.3, 0.1, 16)])
            chai = VGroup(Polygon(*[np.array([x + 1.7, y, 0]) for x, y in [(-0.45, 0), (0.45, 0), (0.45, 1.5), (0.15, 1.85), (0.15, 2.2),
                                                                        (-0.15, 2.2), (-0.15, 1.85), (-0.45, 1.5)]]).set_stroke(MUC, 2.4).set_fill(NEN_TREN, 0.6),
                          nuoc(Rectangle(width=0.84, height=1.0)).move_to([1.7, 0.55, 0]))
            mo = chai.copy().set_opacity(0.15)
            self.su(self.t(m), lambda: self.doi(chai, mo))
            return self.xong([mat_ban(-2.8, 2.6), khay, chai], [mo])
        if self.co_buoc("rượu vang"):
            m = self.moc_buoc("rượu vang")
            f = lambda x: 1.2 + 1.4 * (x / 0.9) ** 2
            ly = VGroup(VMobject().set_points_smoothly([np.array([x, f(x), 0]) for x in np.linspace(-0.9, 0.9, 31)]),
                        Line([0, 1.2, 0], [0, 0.12, 0]), Line([-0.6, 0.08, 0], [0.6, 0.08, 0])).set_stroke(MUC, 3)
            xm = 0.9 * np.sqrt(0.55 / 1.4)
            ruou = nuoc(Polygon(*[np.array([x, f(x), 0]) for x in np.linspace(-xm, xm, 17)]))
            mang_ = VGroup(*[VMobject().set_points_smoothly([np.array([s * x * 0.97, f(x) - 0.03, 0]) for x in np.linspace(xm, 0.8, 8)])
                             .set_stroke(NUOC, 7, 0.75) for s in (-1, 1)])
            giot = VGroup(*[Dot([s * 0.97 * x, f(x) - 0.06, 0], radius=0.06, color=NUOC) for s in (-1, 1) for x in (0.66, 0.74)])
            self.su(self.t(m), lambda: self.ve_ra(VGroup(mang_, giot)))
            return self.xong([mat_ban(-1.6, 1.6), ly, ruou], [mang_, giot])
        return super().hinh()


class ThuocLcT3(_T3, ThuocLc):
    """w3: mặt nước cắt ngang, lớp chuyển động mỏng ℓν ở trên (tốc độ giảm theo chiều sâu); thước 0,17 mm kẹp bề dày lớp."""

    def hinh(self):
        if not self.ts.get("thuoc"):
            return super().hinh()
        khoi = nuoc(Rectangle(width=5.6, height=1.1)).move_to([0, -0.55, 0])
        lop = Rectangle(width=5.6, height=0.32).set_stroke(width=0).set_fill(NUOC, 0.5).move_to([0, -0.16, 0])
        lop1 = lop.copy().set_fill(NUOC, 0.85)
        mat = mui_cang([-2.2, 0.18, 0], [0.4, 0.18, 0])
        ho_so = VGroup(*[mui_cang([-2.2, y, 0], [-2.2 + d, y, 0], NUOC, 4) for y, d in ((-0.06, 1.6), (-0.16, 0.9), (-0.26, 0.4))])
        th = thuoc_dung(2.3, -0.32, 0, CANG)
        self.theo_chu("measured", lambda: self.hien(mat), "nhan")
        self.theo_chu("moving layer", lambda: self.hien(lop) + self.hien(ho_so), "nhan")
        self.theo_chu("thin sheet", lambda: self.doi(lop, lop1), "nhan")
        self.theo_chu("mm", lambda: self.ve_ra(th), "thuoc")
        return self.xong([khoi], [lop, lop1, mat, ho_so, th])


LOP.update(KhayTieu=KhayTieu, DongMarangoni=DongMarangoni, PhepTinh=PhepTinhT3, BangKe=BangKeT3, PhanTu=PhanTuT3,
           ZoomThang=ZoomThangT3, MuiTenCang=MuiTenCangT3, BanQuang=BanQuangT3, ThuocLc=ThuocLcT3)


# ------------------------------------------------------------------ v3 (Phiếu 122 + C13, SX 25/10/2026): bàn nền, hình giữa, đốm nhịp, viền mực cam
# H1/H6: cảnh 'cot' có bàn nền (thẻ NEN_TREN viền mực + bóng đổ, z −10) phủ vùng hình: lớp gần trên phông xa; hình phóng tới
#   V3_TRAN lần (cũ 1,6) vừa bàn. 16:9 bàn lùi V3_LUI_TRAI khỏi mép trái: tâm khối nội dung lớn nhất (viền bàn) ≈ 0,32 bề ngang.
# H3: đốm mực mờ (MUC 0,17, z −5: Δ ≈ 23 > 16 trên bàn, < 24 so trung vị hàng nên không thành "nội dung") đổi giữa hai đầu bàn
#   (không chồng nhau, hiệu ≈ 2 diện tích đốm ≥ 8 % khung) mỗi ≤ V3_GIAN s, đầu/cuối beat ≤ V3_DAU_CUOI s; đi cùng nhóm sự kiện
#   khi kịp (H4: đổi gắn mốc lời).
# H10: mọi nét / mảng cam (CANG) có viền mực nền (background stroke rộng hơn nét V3_VIEN đơn vị = 1,5 mỗi bên ≈ 2 px).
import K1_ban_quang_hoc as K1
from K1_canh import trang

V3_TRAN = 3.0
V3_LUI_TRAI = 1.1
V3_DOM_OP = 0.17
V3_GIAN, V3_DAU_CUOI, V3_TRUOT = 2.8, 1.2, 0.6
V3_VIEN = 3.0
_CANG_HEX = str(CANG).lower()[:7]


def _la_cang(c):
    try:
        return c is not None and c.to_hex().lower()[:7] == _CANG_HEX
    except AttributeError:
        return str(c).lower()[:7] == _CANG_HEX


def vien_cang(m):
    """Viền mực nền cho mọi lá cam trong m (giữ nguyên nét / mảng cam ở trên)."""
    for x in m.get_family():
        if not isinstance(x, VMobject) or not len(x.points):
            continue
        w = x.get_stroke_width()
        s = w > 0 and x.get_stroke_opacity() > 0 and _la_cang(x.get_stroke_color())
        f = x.get_fill_opacity() > 0 and _la_cang(x.get_fill_color())
        if s or f:
            x.set_stroke(MUC, (w if s else 0) + V3_VIEN, 1, background=True, family=False)


def _vien_anim(a):
    for m in (getattr(a, "mobject", None), getattr(a, "target_mobject", None)):
        if m is not None:
            vien_cang(m)
    for b in getattr(a, "animations", None) or []:
        _vien_anim(b)


class _V3:
    def _ban(self, B):
        b = RoundedRectangle(width=B[1] - B[0], height=B[3] - B[2], corner_radius=0.14)
        b.set_fill(NEN_TREN, 0.95).set_stroke(MUC, 2.4, 0.85).move_to([(B[0] + B[1]) / 2, (B[2] + B[3]) / 2, 0])
        b.set_z_index(-10)
        return K1.khoi(b)

    def _dat_dom(self, B):
        w, h = B[1] - B[0], B[3] - B[2]
        rx, ry = min(2.4, (w - 0.3) / 4), min(1.8, (h - 0.3) / 2)
        self._dom_x = (B[0] + 0.15 + rx, B[1] - 0.15 - rx)
        self._dom = Ellipse(width=2 * rx, height=2 * ry).set_stroke(width=0).set_fill(MUC, V3_DOM_OP)
        self._dom.move_to([self._dom_x[0], (B[2] + B[3]) / 2, 0]).set_z_index(-5)
        self.sc.add(self._dom)

    def _truot(self):
        lo, hi = self._dom_x
        x = lo if abs(self._dom.get_x() - hi) < abs(self._dom.get_x() - lo) else hi
        return self._dom.animate.set_x(x)

    def dat_hinh(self, hien, an=()):
        tat = VGroup(*hien, *an)
        if not len(tat.get_all_points()):
            return
        F = self.F
        w, h = F[1] - F[0], F[3] - F[2]
        s = min(V3_TRAN, w / max(tat.width, 1e-6), h / max(tat.height, 1e-6))
        c = tat.get_center()
        dich = np.array([(F[0] + F[1]) / 2, (F[2] + F[3]) / 2, 0]) - s * c
        for m in list(hien) + list(an):
            m.scale(s, about_point=np.zeros(3)).shift(dich)
        self.ty_le = s

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
            the.set_fill(NEN_TREN, 0.95).set_stroke(MUC, 1.6, 0.6).set_z_index(-10)
            the.move_to([Z[0] - 0.25 + the.width / 2, yt + 0.25 - the.height / 2, 0])
            the = K1.khoi(the)
            dich = np.array([(L[0] + L[1]) / 2, (Z[2] + Z[3] + 0.5) / 2, 0]) - the.get_center()
            dich[1] = min(dich[1], 0.0)
            the.shift(dich)
            for o in os_:
                o["khoi"].shift(dich)
            self.F = (Z[0], Z[0], Z[2], Z[2])
            r = the[1]
            B = (r.get_left()[0], r.get_right()[0], r.get_bottom()[1], r.get_top()[1])
            co_dinh = [the]
        else:
            if W.bc.doc:
                Z = (L[0], L[1], L[2] + 0.15, L[2] + 0.42 * (L[3] - L[2]))  # 9:16: ban >= 0,55 dai
                hc = self.xep_cot(Z, os_, can_duoi=True)
                B = (L[0] + 0.1, L[1] - 0.1, L[2] + hc + 0.35, self._tran(L[0], L[1], L[3]))
            else:
                xc = L[0] + (L[1] - L[0]) * (1 - self.TI_LE_CHU)
                self.xep_cot((xc, L[1], L[2], self._tran(xc, L[1], L[3])), os_)
                x0 = L[0] + V3_LUI_TRAI
                B = (x0, xc - 0.35, L[2] + 0.1, self._tran(x0, L[1], L[3]))  # trần cả dải: nhóm hình gồm cột chữ
            le = 0.3
            self.F = (B[0] + le, B[1] - le, B[2] + le, B[3] - le)
            co_dinh = [self._ban(B)] + (self.hinh() or [])
        for m in co_dinh:
            sc.add(m)
            self.hinh_ds.append(m)
        self._dat_dom(B)
        for m in sc.mobjects:
            vien_cang(m)
        self.dang_chu(os_)
        con = [x["kieu"] for x in self.ts.get("buoc", []) if x["kieu"] not in self.buoc_xong]
        if con:
            raise NotImplementedError("beat %s: bước hình chưa dựng: %s" % (self.b["id"], con))
        sc.chuyen_dau(self.b)
        self.chay_su_kien()
        self.man["hinh"] = VGroup(*[m for m in self.hinh_ds if len(m.get_all_points()) or len(m.submobjects)])
        return self.man

    def chay_su_kien(self):
        sc, N, FPS = self.sc, trang.so_khung(self.b), trang.FPS
        G, D, T = round(V3_GIAN * FPS), round(V3_DAU_CUOI * FPS), round(V3_TRUOT * FPS)
        dong = str(self.b.get("chuyen") or "").startswith(("zoom", "lay"))
        lan = [sc._khung - (round(0.5 * FPS) if dong else G - D)]

        def truot(s):
            sc.cho(s - sc._khung)
            sc.choi(self._truot(), t=V3_TRUOT)
            lan[0] = sc._khung

        def bu(den):
            while den - lan[0] > G:
                s = max(sc._khung, lan[0] + G - T)
                if s + T > min(den, N - 2):
                    break
                truot(s)

        ev = sorted(self.ev, key=lambda e: (e[0], e[1], e[2]))
        nhom = []
        for e in ev:
            if nhom and e[0] - nhom[-1][0][0] <= 0.25:
                nhom[-1].append(e)
            else:
                nhom.append([e])
        for i, g in enumerate(nhom):
            bu(round(g[0][0] * FPS))
            sc.toi(g[0][0], self.b["id"])
            an = []
            for e in g:
                an += list(e[3]() or [])
            if not an:
                continue
            for a in an:
                _vien_anim(a)
            tiep = nhom[i + 1][0][0] if i + 1 < len(nhom) else 1e9
            d = max(1.0 / FPS, min(0.6, max(0.2, tiep - sc._khung / FPS - 0.03), (N - 2 - sc._khung) / FPS))
            k = max(1, round(d * FPS))
            kem = k >= 6 and sc._khung + k - lan[0] > G // 2
            if kem:
                an.append(self._truot())
            sc.choi(*an, t=d)
            if kem:
                lan[0] = sc._khung
        while N - 2 - lan[0] > D:
            s = max(sc._khung, min(lan[0] + G - T, N - 2 - T))
            if s + T > N - 2:
                break
            truot(s)


for _k, _C in list(LOP.items()):
    if not issubclass(_C, _V3):
        LOP[_k] = type(_C.__name__, (_V3, _C), {})
