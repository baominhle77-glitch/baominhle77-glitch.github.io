"""Khuôn cảnh Manim kênh Torque Split (D17) — tái dùng cho mọi tập của kênh.

Mỗi lớp cảnh = một MÔ PHỎNG chạy suốt beat (C17): hình là hàm thuần của thời gian ``ve(t, T)``
nên cùng một mã cho (a) khung thử 540p một khung/beat (D16) và (b) video đủ beat.
Nội dung riêng của tập (tiêu đề tờ vẽ, nhãn số, dòng bảng, chế độ vi sai) nằm ở ``tap/<tap>.json``,
không nằm trong mã (D18). Số hình học đều TÍNH từ R, L, θ của tập (nhãn CALCULATED), không đo.

Quy ước bố cục: ``beat.layout.N`` (16:9) / ``beat.layout.D`` (9:16), hộp [x, y, w, h] tính % khung, gốc trên-trái.
Cảnh vẽ trong hộp ``stage``; nhãn số ở hộp ``value``; tiêu đề ở ``head``; mã nguồn ở ``source`` (≥ 22 px theo khung 1080).
Phụ đề do khâu ghép (Remotion) đặt, cảnh không vẽ phụ đề.
"""
import json
import math
import os
from functools import lru_cache
from pathlib import Path

import numpy as np
from manim import (DOWN, LEFT, RIGHT, UP, Arc, Circle, DashedLine, Dot, Line, Polygon, Rectangle, RoundedRectangle,
                   Scene, Text, ValueTracker, VGroup, VMobject, always_redraw, config, linear)

GOC = Path(__file__).resolve().parent
PHONG = str(Path(__file__).resolve().parents[3] / "ban_sac/fonts/NotoSans-Regular.ttf")
try:
    import manimpango
    if Path(PHONG).exists():
        manimpango.register_font(PHONG)
except Exception:  # pragma: no cover - thiếu manimpango thì Pango dùng phông hệ thống
    pass

# Bảng màu v2 kênh: nền mực chàm, giấy trắng, đỏ; cam luôn có viền mực.
MAU = dict(nen="#16133A", nen2="#463A8A", giay="#F2F6FA", do="#D6515A", cam="#FF8A2A", vang="#FFD23F",
           xanh="#3DDC84", muc="#05080B", mo="#8C86C8", nhan_nen="#0B1016")
VIEN_MUC = 3.0  # ~2 px ở khung 1080


# ---------------- thời gian & dữ liệu ----------------
def tien(t, T, khoi=.15):
    """0..1: khởi động êm rồi chạy ĐỀU tới hết beat (không phẳng cuối — luật C17/G1)."""
    u = min(1.0, max(0.0, t / max(1e-6, T)))
    if u < khoi:
        return u * u / (2 * khoi) / (1 - khoi / 2)
    return (u - khoi / 2) / (1 - khoi / 2)


def hinh_hoc(so):
    R, L = float(so.get("R", 10.0)), float(so.get("L", 2.5))
    th = math.radians(float(so.get("theta_deg", 90.0)))
    Rf = math.hypot(R, L)
    return dict(R=R, L=L, Rf=Rf, th=th, sr=R * th, sf=Rf * th, ds=(Rf - R) * th, dR=Rf - R,
                ds360=(Rf - R) * 2 * math.pi, ti_so=Rf / R)


def doc_beat():
    """Beat đang vẽ: biến môi trường TS_SB (storyboard_d16.json), TS_BEAT, TS_KHO, TS_TAP (tap/<tap>.json)."""
    sb = json.loads(Path(os.environ["TS_SB"]).read_text(encoding="utf-8"))
    bid = os.environ["TS_BEAT"]
    b = next(x for x in sb["beats"] if x["id"] == bid)
    tap = {}
    p = os.environ.get("TS_TAP")
    if p and Path(p).exists():
        tap = json.loads(Path(p).read_text(encoding="utf-8"))
    rieng = dict(tap.get("chung", {}))
    rieng.update(tap.get("mac_dinh_canh", {}).get(b["scene"], {}))
    rieng.update(tap.get("beat", {}).get(bid, {}))
    return b, rieng, tap.get("so", {}), os.environ.get("TS_KHO", "16x9")


# ---------------- tiện ích vẽ ----------------
@lru_cache(maxsize=512)
def _chu(s, mau, dam):
    return Text(s, font="Noto Sans", color=mau, weight="BOLD" if dam else "NORMAL", font_size=48)


def chu(s, cao, mau=MAU["giay"], dam=False):
    """Chữ cao ``cao`` đơn vị (đã tính px→đơn vị ở lớp gọi). Có bộ nhớ đệm vì vẽ lại mỗi khung."""
    m = _chu(str(s), mau, dam).copy()
    m.set_height(cao)
    return m


def hop_nhan(s, cao, mau_chu=MAU["giay"], nen=MAU["nhan_nen"], vien=MAU["giay"]):
    c = chu(s, cao, mau_chu)
    k = RoundedRectangle(width=c.width + cao * 1.1, height=cao * 2.0, corner_radius=cao * .3,
                         fill_color=nen, fill_opacity=.92, stroke_color=vien, stroke_width=1.5)
    k.move_to(c)
    return VGroup(k, c)


def cam(m):
    """Vật cam bắt buộc viền mực 2 px (bảng màu v2)."""
    return m.set_fill(MAU["cam"], 1).set_stroke(MAU["muc"], VIEN_MUC)


def bong(m, dx=.10, dy=-.12, dam=.18):
    """Lớp bóng mềm dưới vật (lớp gần + bóng, D16)."""
    s = m.copy().set_fill(MAU["muc"], dam).set_stroke(width=0).shift(RIGHT * dx + UP * dy)
    return s


def luoi(dw, dh, buoc=.5, dam=.08):
    g = VGroup()
    x = -dw / 2
    while x <= dw / 2 + 1e-6:
        g.add(Line([x, -dh / 2, 0], [x, dh / 2, 0], stroke_width=1, stroke_color=MAU["giay"], stroke_opacity=dam))
        x += buoc
    y = -dh / 2
    while y <= dh / 2 + 1e-6:
        g.add(Line([-dw / 2, y, 0], [dw / 2, y, 0], stroke_width=1, stroke_color=MAU["giay"], stroke_opacity=dam))
        y += buoc
    return g


def banh_rang(r, rang, goc, mau, rang_cao=.12):
    """Bánh răng phẳng (đa giác răng) quay góc ``goc``."""
    d = []
    n = rang * 4
    for i in range(n):
        a = goc + 2 * math.pi * i / n
        rr = r + (rang_cao if (i % 4) in (1, 2) else 0)
        d.append([rr * math.cos(a), rr * math.sin(a), 0])
    p = Polygon(*d, fill_color=mau, fill_opacity=1, stroke_color=MAU["muc"], stroke_width=VIEN_MUC)
    tam = Circle(radius=r * .28, fill_color=MAU["nen"], fill_opacity=1, stroke_color=MAU["muc"], stroke_width=2)
    nan = Line([0, 0, 0], [r * .8 * math.cos(goc), r * .8 * math.sin(goc), 0], stroke_color=MAU["muc"], stroke_width=4)
    return VGroup(p, tam, nan)


def banh_xe(r, goc, mau=MAU["giay"]):
    lop = Circle(radius=r, fill_color="#2A2740", fill_opacity=1, stroke_color=MAU["muc"], stroke_width=VIEN_MUC)
    vanh = Circle(radius=r * .62, fill_color=mau, fill_opacity=1, stroke_color=MAU["muc"], stroke_width=2)
    nan = VGroup(*[Line([0, 0, 0], [r * .6 * math.cos(goc + k * math.pi / 3), r * .6 * math.sin(goc + k * math.pi / 3), 0],
                        stroke_color=MAU["nen2"], stroke_width=3) for k in range(6)])
    gai = VGroup(*[Line([r * .8 * math.cos(goc + k * math.pi / 8), r * .8 * math.sin(goc + k * math.pi / 8), 0],
                        [r * math.cos(goc + k * math.pi / 8), r * math.sin(goc + k * math.pi / 8), 0],
                        stroke_color=MAU["mo"], stroke_width=2) for k in range(16)])
    return VGroup(lop, gai, vanh, nan)


def mui_ten(a, b, mau, day=6):
    a, b = np.array(a, float), np.array(b, float)
    v = b - a
    n = np.linalg.norm(v)
    if n < 1e-6:
        return VGroup()
    u = v / n
    p = np.array([-u[1], u[0], 0])
    h = min(.3, n * .4)
    than = Line(a, b - u * h * .8, stroke_color=mau, stroke_width=day)
    dau = Polygon(b, b - u * h + p * h * .55, b - u * h - p * h * .55, fill_color=mau, fill_opacity=1, stroke_color=MAU["muc"],
                  stroke_width=1.5)
    return VGroup(than, dau)


def cung(tam, r, a0, a1, mau, day=6):
    if abs(a1 - a0) < 1e-4:
        return VMobject()
    return Arc(radius=r, start_angle=a0, angle=a1 - a0, arc_center=np.array(tam, float), stroke_color=mau, stroke_width=day)


# ---------------- lớp gốc ----------------
class CanhTS(Scene):
    """Gốc mọi cảnh kênh: nền xa (lưới 8 %), lớp gần (``ve``), nhãn/tiêu đề/nguồn theo layout beat."""

    def ve(self, t, T, dw, dh):  # pragma: no cover - lớp con định nghĩa
        raise NotImplementedError

    def construct(self):
        self.b, self.r, so, self.kho = doc_beat()
        self.hh = hinh_hoc(so)
        T = self.b["t1"] - self.b["t0"]
        W, H = config.frame_width, config.frame_height
        ref = 1080 if self.kho == "16x9" else 1920  # px tham chiếu chiều cao khung đích
        self.px = H / ref
        lay = self.b["layout"]["N" if self.kho == "16x9" else "D"]
        self.camera.background_color = MAU["nen"]
        self.add(luoi(W, H))

        def hop(k):
            x, y, w, h = lay[k]
            return (-W / 2 + (x + w / 2) / 100 * W, H / 2 - (y + h / 2) / 100 * H, w / 100 * W, h / 100 * H)

        cx, cy, bw, bh = hop("stage")
        dh = 9.0
        dw = dh * bw / bh
        k = min(bw / dw, bh / dh)
        tt = ValueTracker(0.0)

        def dung():
            g = self.ve(tt.get_value(), T, dw, dh)
            g.scale(k, about_point=np.zeros(3)).shift(RIGHT * cx + UP * cy)
            return g

        self.add(always_redraw(dung))
        cao = lambda p: max(p, 22) * self.px  # noqa: E731 — chữ ≥ 22 px khung 1080
        if self.r.get("tieu_de") and "head" in lay:
            x, y, w, h = hop("head")
            c = chu(self.r["tieu_de"], cao(30), MAU["vang"], dam=True)
            if c.width > w:
                c.set_width(w)
            self.add(c.move_to([x, y, 0]))
        if self.b.get("source_text") and "source" in lay:
            x, y, w, h = hop("source")
            c = chu(self.b["source_text"], cao(self.b.get("source_px", 22)), MAU["giay"])
            if c.width > w:
                c.set_width(w)  # bản rút gọn phải do HS cấp (source_screen_shortened), không cắt chữ
            self.add(c.move_to([x, y, 0]))
        if self.r.get("nhan") and "value" in lay:
            x, y, w, h = hop("value")
            n = hop_nhan(self.r["nhan"], cao(30))
            if n.width > w:
                n.set_width(w)
            self.add(n.move_to([x, y, 0]))
        khung = os.environ.get("TS_KHUNG")
        if khung is not None:
            tt.set_value(float(khung) * T)
            self.wait(1 / config.frame_rate)
            return
        self.play(tt.animate.set_value(T), run_time=T, rate_func=linear)


# ---------------- 11 cảnh kênh ----------------
class MatBangQueo(CanhTS):
    """Mặt bằng xe quay quanh tâm quay tức thời: tâm cầu sau đi cung R, tâm cầu trước cung Rf (vẽ dần)."""

    def ve(self, t, T, dw, dh):
        h = self.hh
        q = tien(t, T)
        k = (dh - 1.6) / (h["Rf"] + 1.2)
        O = np.array([-dw / 2 + .9, -dh / 2 + .8, 0])
        ph = h["th"] * q
        R, Rf, L = h["R"] * k, h["Rf"] * k, h["L"] * k
        a_f0 = math.atan2(L, R)
        Pr = O + R * np.array([math.cos(ph), math.sin(ph), 0])
        hd = np.array([-math.sin(ph), math.cos(ph), 0])
        Pf = Pr + L * hd
        ngang = np.array([math.cos(ph), math.sin(ph), 0])
        g = VGroup()
        g.add(cung(O, R, 0, h["th"], MAU["mo"], 2), cung(O, Rf, a_f0, a_f0 + h["th"], MAU["mo"], 2))
        g.add(cung(O, R, 0, ph, MAU["do"], 8), cung(O, Rf, a_f0, a_f0 + ph, MAU["cam"], 8))
        g.add(DashedLine(O, Pr, stroke_color=MAU["do"], stroke_width=3), DashedLine(O, Pf, stroke_color=MAU["cam"], stroke_width=3))
        than = Polygon(*[Pr - ngang * .9 * k - hd * .6 * k, Pr + ngang * .9 * k - hd * .6 * k,
                         Pf + ngang * .9 * k + hd * .6 * k, Pf - ngang * .9 * k + hd * .6 * k],
                       fill_color=MAU["nen2"], fill_opacity=1, stroke_color=MAU["giay"], stroke_width=3)
        g.add(bong(than, .14 * k, -.14 * k))
        g.add(than)
        for P in (Pr, Pf):
            for s in (-1, 1):
                w = Rectangle(width=.28 * k, height=.65 * k, fill_color=MAU["muc"], fill_opacity=1, stroke_color=MAU["giay"],
                              stroke_width=1.5).rotate(ph).move_to(P + s * ngang * .8 * k)
                g.add(w)
        g.add(Dot(O, radius=.09, color=MAU["vang"]), Dot(Pr, radius=.12, color=MAU["do"]), cam(Dot(Pf, radius=.13)))
        cao = .34
        g.add(chu("R = %g m" % h["R"], cao, MAU["do"]).next_to((O + Pr) / 2, DOWN + RIGHT * .2, buff=.1))
        g.add(chu("R_f ≈ %.2f m" % h["Rf"], cao, MAU["cam"]).next_to((O + Pf) / 2, UP + LEFT * .3, buff=.12))
        g.add(chu("%d°" % round(math.degrees(ph)), cao, MAU["vang"]).next_to(O, UP + RIGHT, buff=.15))
        return g


class TheBanVe(CanhTS):
    """Tờ vẽ kỹ thuật: khung tên, xe nhỏ chạy cung và nét kích thước vẽ dần suốt beat."""

    def ve(self, t, T, dw, dh):
        h = self.hh
        q = tien(t, T)
        g = VGroup()
        to = Rectangle(width=dw - .4, height=dh - .4, fill_color=MAU["nen2"], fill_opacity=.55, stroke_color=MAU["giay"],
                       stroke_width=3)
        g.add(bong(to, .12, -.12, .25), to, luoi(dw - .6, dh - .6, .6, .12))
        ten_to = ("DRAWING %d" % int(self.r["to_so"])) if "to_so" in self.r else self.r.get("ten_to", "SHEET")
        ten = Rectangle(width=dw * .34, height=1.1, fill_color=MAU["nen"], fill_opacity=1, stroke_color=MAU["giay"],
                        stroke_width=2).move_to([dw / 2 - .2 - dw * .17 - .1, -dh / 2 + .2 + .65, 0])
        g.add(ten, chu(ten_to, .38, MAU["vang"], True).move_to(ten.get_center() + UP * .2),
              chu(self.r.get("ghi_ten", "IDEAL MODEL · CALCULATED"), .22).move_to(ten.get_center() + DOWN * .25))
        k = (dh - 3.2) / (h["Rf"])
        O = np.array([-dw / 2 + 1.3, -dh / 2 + 2.0, 0])
        lap = 2  # xe chạy 2 lượt cung trong beat để chuyển động không dừng
        u = (q * lap) % 1.0
        ph = h["th"] * u
        a_f0 = math.atan2(h["L"], h["R"])
        g.add(cung(O, h["R"] * k, 0, h["th"] * q, MAU["giay"], 2), cung(O, h["Rf"] * k, a_f0, a_f0 + h["th"] * q, MAU["giay"], 2))
        Pr = O + h["R"] * k * np.array([math.cos(ph), math.sin(ph), 0])
        Pf = O + h["Rf"] * k * np.array([math.cos(ph + a_f0), math.sin(ph + a_f0), 0])
        g.add(cung(O, h["R"] * k, 0, ph, MAU["do"], 7), cung(O, h["Rf"] * k, a_f0, a_f0 + ph, MAU["cam"], 7))
        g.add(Line(Pr, Pf, stroke_color=MAU["giay"], stroke_width=9), Dot(Pr, radius=.13, color=MAU["do"]), cam(Dot(Pf, radius=.13)))
        g.add(DashedLine(O, Pr, stroke_color=MAU["giay"], stroke_width=2), Dot(O, radius=.08, color=MAU["vang"]))
        # nét kích thước: thước quay quét theo xe (vật lớn chuyển động)
        thuoc = Line(O, O + (h["Rf"] * k + .5) * np.array([math.cos(ph + a_f0 / 2), math.sin(ph + a_f0 / 2), 0]),
                     stroke_color=MAU["vang"], stroke_width=3, stroke_opacity=.8)
        g.add(thuoc)
        return g


class KhoangChenh(CanhTS):
    """Hai cung duỗi thẳng thành hai thanh: sau (R·θ) và trước (Rf·θ) cùng lớn; khoảng chênh phóng to ×10."""

    def ve(self, t, T, dw, dh):
        h = self.hh
        q = tien(t, T)
        th = h["th"] * q
        sr, sf = h["R"] * th, h["Rf"] * th
        x0 = -dw / 2 + .8
        k = (dw - 1.8) / h["sf"]
        g = VGroup()
        for i, (s, r, mau, ten) in enumerate(((sr, h["R"], MAU["do"], "rear"), (sf, h["Rf"], MAU["cam"], "front"))):
            y = 2.3 - i * 1.7
            g.add(Line([x0, y, 0], [x0 + h["sf"] * k, y, 0], stroke_color=MAU["mo"], stroke_width=2))
            thanh = Rectangle(width=max(.01, s * k), height=.42, fill_color=mau, fill_opacity=1, stroke_color=MAU["muc"],
                              stroke_width=VIEN_MUC).move_to([x0 + s * k / 2, y, 0])
            g.add(bong(thanh), thanh)
            bx = banh_xe(.42, -s / .42 / k * .02 * 40, MAU["giay"]).move_to([x0 + s * k, y + .7, 0])
            g.add(bx, chu("%s %.2f m" % (ten, s), .32, mau).next_to([x0, y + .62, 0], RIGHT, buff=.05))
        ds = sf - sr
        kinh = Rectangle(width=dw * .5, height=2.6, fill_color=MAU["nen"], fill_opacity=.9, stroke_color=MAU["vang"],
                         stroke_width=3).move_to([0, -2.6, 0])
        g.add(kinh)
        ky = (dw * .5 - .6) / max(h["ds"], 1e-6)
        gx = -dw * .25 + .3
        g.add(Rectangle(width=max(.01, ds * ky), height=.5, fill_color=MAU["do"], fill_opacity=1, stroke_color=MAU["muc"],
                        stroke_width=VIEN_MUC).move_to([gx + ds * ky / 2, -2.35, 0]))
        g.add(chu("Δs = %.2f m  (zoom ×%d)" % (ds, round(ky / k)), .32, MAU["vang"]).move_to([0, -3.35, 0]))
        g.add(chu("θ = %d°" % round(math.degrees(th)), .32, MAU["giay"]).move_to([dw / 2 - 1.2, 3.6, 0]))
        return g


class PhuongTrinh(CanhTS):
    """Dòng công thức + hình quạt quét θ; số đọc chạy theo θ (s = r·θ, CALCULATED)."""

    def ve(self, t, T, dw, dh):
        h = self.hh
        q = tien(t, T)
        th = h["th"] * q
        g = VGroup()
        dong = self.r.get("cong_thuc") or self.b.get("equation_line") or "s = r × θ   (θ in radians)"
        c = chu(dong, .42, MAU["giay"])
        if c.width > dw - .6:
            c.set_width(dw - .6)
        g.add(c.move_to([0, dh / 2 - .7, 0]))
        O = np.array([-dw / 2 + 1.0, -dh / 2 + .9, 0])
        k = (dh - 2.8) / h["Rf"]
        a_f0 = math.atan2(h["L"], h["R"])
        quat = Polygon(O, *[O + h["Rf"] * k * np.array([math.cos(a_f0 + a), math.sin(a_f0 + a), 0])
                            for a in np.linspace(0, max(th, 1e-3), 24)], fill_color=MAU["nen2"], fill_opacity=.8,
                       stroke_width=0)
        g.add(quat, cung(O, h["R"] * k, 0, th, MAU["do"], 8), cung(O, h["Rf"] * k, a_f0, a_f0 + th, MAU["cam"], 8))
        g.add(Line(O, O + h["Rf"] * k * np.array([math.cos(a_f0 + th), math.sin(a_f0 + th), 0]), stroke_color=MAU["giay"],
                   stroke_width=3), Line(O, O + [h["R"] * k, 0, 0], stroke_color=MAU["giay"], stroke_width=3), Dot(O, color=MAU["vang"]))
        bien = dict(th_deg=math.degrees(th), th_rad=th, sr=h["R"] * th, sf=h["Rf"] * th, ds=(h["Rf"] - h["R"]) * th,
                    R=h["R"], Rf=h["Rf"], L=h["L"], ti_so=h["ti_so"], vong_sau=100 * q, vong_truoc=100 * h["ti_so"] * q)
        doc = self.r.get("doc_so") or ["θ = {th_deg:.0f}° = {th_rad:.2f} rad", "s_rear = {R:g} × θ = {sr:.2f} m",
                                       "s_front = {Rf:.2f} × θ = {sf:.2f} m", "Δs = {ds:.2f} m  CALCULATED"]
        x = O[0] + h["Rf"] * k + .6
        for i, d in enumerate(doc):
            m = chu(d.format(**bien), .36, (MAU["vang"] if i == len(doc) - 1 else MAU["giay"]))
            if m.width > dw / 2 - x - .2 + dw / 2:
                m.set_width(max(.5, dw / 2 - x - .2 + dw / 2 - .1))
            g.add(m.move_to([x, 1.4 - i * .8, 0], aligned_edge=LEFT))
        return g


class VongXuyen(CanhTS):
    """Hai vòng tròn đồng tâm đúng tỉ lệ; hai chấm chạy trọn 360°, bộ đếm chênh tới (Rf−R)·2π."""

    def ve(self, t, T, dw, dh):
        h = self.hh
        q = tien(t, T)
        ph = 2 * math.pi * q
        k = (dh - 1.4) / 2 / h["Rf"]
        O = np.array([-dw / 2 + h["Rf"] * k + .7, 0, 0])
        g = VGroup(Circle(radius=h["R"] * k, stroke_color=MAU["mo"], stroke_width=2).move_to(O),
                   Circle(radius=h["Rf"] * k, stroke_color=MAU["mo"], stroke_width=2).move_to(O))
        g.add(cung(O, h["R"] * k, math.pi / 2, math.pi / 2 + ph, MAU["do"], 7), cung(O, h["Rf"] * k, math.pi / 2, math.pi / 2 + ph, MAU["cam"], 5))
        for r, mau in ((h["R"], MAU["do"]), (h["Rf"], MAU["cam"])):
            P = O + r * k * np.array([math.cos(math.pi / 2 + ph), math.sin(math.pi / 2 + ph), 0])
            d = Dot(P, radius=.14, color=mau)
            g.add(cam(d) if mau == MAU["cam"] else d)
        x = O[0] + h["Rf"] * k + .7
        g.add(chu("ΔR ≈ %.2f m" % h["dR"], .36, MAU["giay"]).move_to([x, 1.2, 0], aligned_edge=LEFT))
        g.add(chu("%d°" % round(math.degrees(ph)), .36, MAU["vang"]).move_to([x, .4, 0], aligned_edge=LEFT))
        g.add(chu("Δs = %.2f m" % ((h["Rf"] - h["R"]) * ph), .42, MAU["vang"], True).move_to([x, -.5, 0], aligned_edge=LEFT))
        g.add(chu("CALCULATED", .28, MAU["mo"]).move_to([x, -1.2, 0], aligned_edge=LEFT))
        return g


class BangSo(CanhTS):
    """Sổ cái cơ khí: các dòng hiện dần + hai bánh đếm vòng (sau 0→100, trước 0→100·Rf/R) quay suốt beat."""

    def ve(self, t, T, dw, dh):
        h = self.hh
        q = tien(t, T)
        dong = self.r.get("bang") or [["geometry", "R = %g m, R_f ≈ %.2f m" % (h["R"], h["Rf"])]]
        g = VGroup()
        nen = Rectangle(width=dw - .4, height=dh * .58, fill_color=MAU["nen2"], fill_opacity=.6, stroke_color=MAU["giay"],
                        stroke_width=2).move_to([0, dh / 2 - .2 - dh * .29, 0])
        g.add(bong(nen), nen)
        n = len(dong)
        cao = min(.95, (dh * .58 - .4) / max(n, 1))
        for i, (a, b) in enumerate(dong):
            hien = min(1.0, max(0.0, q * (n + 1) - i))  # dòng i trượt vào ở phần (i/(n+1)) của beat
            if hien <= 0:
                continue
            y = dh / 2 - .5 - cao * (i + .5)
            dx = (1 - hien) * 1.5
            g.add(Line([-dw / 2 + .4, y - cao / 2, 0], [dw / 2 - .4, y - cao / 2, 0], stroke_color=MAU["mo"], stroke_width=1.5))
            ca = chu(a, cao * .38, MAU["vang"], True)
            cb = chu(b, cao * .38, MAU["giay"])
            if cb.width > dw * .62:
                cb.set_width(dw * .62)
            g.add(ca.move_to([-dw / 2 + .6 + dx, y, 0], aligned_edge=LEFT).set_opacity(hien),
                  cb.move_to([-dw / 2 + dw * .33 + dx, y, 0], aligned_edge=LEFT).set_opacity(hien))
        vs, vt = 100 * q, 100 * h["ti_so"] * q
        for j, (v, mau, ten) in enumerate(((vs, MAU["do"], "rear"), (vt, MAU["cam"], "front"))):
            x = -dw / 4 + j * dw / 2
            g.add(banh_xe(1.05, -2 * math.pi * v / 25, MAU["giay"]).move_to([x - 1.2, -dh / 2 + 1.5, 0]))
            g.add(chu("%s %.2f rev" % (ten, v), .36, mau).move_to([x + .3, -dh / 2 + 1.5, 0], aligned_edge=LEFT))
        return g


class TrucLien(CanhTS):
    """Trục các-đăng bị khoá: hai đầu cùng tốc độ, sọc xoắn tăng dần (wind-up), vệt lốp cào đường tích luỹ."""

    def ve(self, t, T, dw, dh):
        q = tien(t, T)
        g = VGroup()
        y = .3
        xa, xb = -dw / 2 + 1.6, dw / 2 - 1.6
        duong = Line([-dw / 2 + .2, y - 1.6, 0], [dw / 2 - .2, y - 1.6, 0], stroke_color=MAU["mo"], stroke_width=4)
        g.add(duong)
        goc = -t * 4.0
        for x in (xa, xb):
            g.add(bong(Circle(radius=1.1).move_to([x, y - .5, 0]).set_fill(MAU["muc"], 1)), banh_xe(1.1, goc).move_to([x, y - .5, 0]))
        truc = Rectangle(width=xb - xa - 2.4, height=.5, fill_color=MAU["nen2"], fill_opacity=1, stroke_color=MAU["giay"],
                         stroke_width=2).move_to([(xa + xb) / 2, y + 1.2, 0])
        g.add(truc)
        xoan = 6 * q  # số vòng lệch pha dọc trục tăng dần = xoắn đàn hồi minh hoạ
        L = truc.width
        for i in range(14):
            pha = (i / 14 + goc / (2 * math.pi)) % 1.0
            for s in range(2):
                x0 = truc.get_left()[0] + (pha + s * .5) % 1.0 * L
                lech = xoan * .08
                g.add(Line([x0, y + 1.0, 0], [x0 + .18 + lech, y + 1.4, 0], stroke_color=MAU["cam"], stroke_width=4))
        khoa = cam(RoundedRectangle(width=.9, height=.8, corner_radius=.12)).move_to([(xa + xb) / 2, y + 1.2, 0])
        g.add(khoa, chu("LOCK", .22, MAU["muc"], True).move_to(khoa))
        for x in (xa, xb):
            g.add(Line([x, y - .5, 0], [x, y + 1.2, 0], stroke_color=MAU["giay"], stroke_width=5))
        so_vet = int(18 * q)
        for i in range(so_vet):
            vx = xa - 1.0 - i * .22
            if vx < -dw / 2 + .2:
                break
            g.add(Line([vx, y - 1.68, 0], [vx - .14, y - 1.68, 0], stroke_color=MAU["do"], stroke_width=5, stroke_opacity=.85))
        m = mui_ten([(xa + xb) / 2 - .5, y + 2.1, 0], [(xa + xb) / 2 - .5 - (.4 + 2.2 * q), y + 2.1, 0], MAU["do"])
        m2 = mui_ten([(xa + xb) / 2 + .5, y + 2.1, 0], [(xa + xb) / 2 + .5 + (.4 + 2.2 * q), y + 2.1, 0], MAU["do"])
        g.add(m, m2, chu("wind-up", .34, MAU["do"]).move_to([(xa + xb) / 2, y + 2.7, 0]),
              chu("tyre scuff", .3, MAU["do"]).move_to([xa - 1.0, y - 2.2, 0]))
        return g


class BanhLan(CanhTS):
    """Hai lốp lăn trên mặt đường chạy: vết tiếp xúc dẹt, mũi tên trượt dao động, đường vân chạy."""

    def ve(self, t, T, dw, dh):
        q = tien(t, T)
        g = VGroup()
        y0 = -1.4
        for j, (mau, ten, toc) in enumerate(((MAU["do"], "rear patch", 1.0), (MAU["cam"], "front patch", 1.03))):
            x = -dw / 4 + j * dw / 2
            r = min(1.6, dw / 4 - .4)
            nen = Line([x - dw / 4 + .2, y0 - r, 0], [x + dw / 4 - .2, y0 - r, 0], stroke_color=MAU["giay"], stroke_width=4)
            van = VGroup(*[Line([x - dw / 4 + .2 + ((i * .5 + t * 1.6 * toc) % (dw / 2 - .4)), y0 - r - .15, 0],
                                [x - dw / 4 + .4 + ((i * .5 + t * 1.6 * toc) % (dw / 2 - .4)), y0 - r - .35, 0],
                                stroke_color=MAU["mo"], stroke_width=2) for i in range(int((dw / 2 - .4) / .5))])
            lop = banh_xe(r, -t * 1.6 * toc / r).move_to([x, y0, 0])
            dep = .06 + .05 * math.sin(2 * math.pi * t / 1.7 + j)
            lop.stretch(1 - dep, 1, about_point=[x, y0 - r, 0])
            mieng = Rectangle(width=r * .9, height=.16, fill_color=mau, fill_opacity=1, stroke_color=MAU["muc"],
                              stroke_width=VIEN_MUC).move_to([x, y0 - r + .02, 0])
            truot = .25 + .55 * (.5 + .5 * math.sin(2 * math.pi * t / 2.3 + j * 1.3)) * (.4 + .6 * q)
            g.add(van, nen, bong(lop.copy()), lop, mieng, mui_ten([x - truot / 2, y0 - r - .6, 0], [x + truot / 2, y0 - r - .6, 0], mau),
                  chu(ten, .3, mau).move_to([x, y0 + r + .45, 0]))
        g.add(chu("slip · deformation · rolling radius", .3, MAU["giay"]).move_to([0, dh / 2 - .5, 0]))
        return g


class MatCatViSai(CanhTS):
    """Mặt cắt vi sai giữa. Chế độ (tap json ``che_do``): thang_re | hanh_tinh | ba_vi_tri | khoa."""

    def toc(self, t, T):
        q = tien(t, T)
        che = self.r.get("che_do", "thang_re")
        d = .0 if q < .35 else min(1.0, (q - .35) / .4) * .35  # chênh xuất hiện khi vào cua
        if che == "khoa":
            d = .3 * min(1.0, q / .3) * (1.0 if q < .55 else max(0.0, 1 - (q - .55) / .1))
        wc = 2.4
        return wc, wc * (1 + d), wc * (1 - d), d

    def ve(self, t, T, dw, dh):
        che = self.r.get("che_do", "thang_re")
        if che == "ba_vi_tri":
            return self._ba(t, T, dw, dh)
        wc, wf, wr, d = self.toc(t, T)
        # tích phân góc gần đúng theo hàm tốc độ (đều tay, đủ cho minh hoạ quay)
        n = 40
        ts = np.linspace(0, t, n)
        def goc(i):
            if t <= 0:
                return 0.0
            v = np.array([self.toc(x, T)[i] for x in ts])
            return float(((v[1:] + v[:-1]) / 2 * np.diff(ts)).sum())
        gc, gf, gr = goc(0), goc(1), goc(2)
        g = VGroup()
        if che == "hanh_tinh":
            vanh = Circle(radius=3.0, fill_color=MAU["nen2"], fill_opacity=1, stroke_color=MAU["giay"], stroke_width=4)
            g.add(bong(vanh), vanh, banh_rang(1.1, 12, gf, MAU["cam"]))
            for i in range(3):
                a = gc + i * 2 * math.pi / 3
                g.add(banh_rang(.75, 8, -gf * 1.5 + gc * 2.5, MAU["giay"]).move_to([1.95 * math.cos(a), 1.95 * math.sin(a), 0]))
            g.add(chu("sun → front", .3, MAU["cam"]).move_to([0, -3.5, 0]), chu("ring → rear", .3, MAU["giay"]).move_to([0, 3.5, 0]),
                  chu("planet carrier", .28, MAU["vang"]).move_to([dw / 2 - 2.0, 2.6, 0]))
            return g
        vo = Circle(radius=2.6, fill_color=MAU["nen2"], fill_opacity=1, stroke_color=MAU["giay"], stroke_width=4)
        g.add(bong(vo), vo, banh_rang(2.6, 30, gc, MAU["nen2"], .16).set_opacity(.9))
        g.add(banh_rang(1.0, 12, gf, MAU["cam"]).move_to([-1.35, 0, 0]), banh_rang(1.0, 12, -gr, MAU["giay"]).move_to([1.35, 0, 0]))
        g.add(banh_rang(.6, 8, (gf - gr) * 1.6, MAU["vang"]).move_to([0, 1.45, 0]),
              banh_rang(.6, 8, -(gf - gr) * 1.6, MAU["vang"]).move_to([0, -1.45, 0]))
        g.add(Rectangle(width=dw / 2 - 2.4, height=.4, fill_color=MAU["cam"], fill_opacity=1, stroke_color=MAU["muc"],
                        stroke_width=VIEN_MUC).move_to([-(dw / 4 + 1.2), 0, 0]),
              Rectangle(width=dw / 2 - 2.4, height=.4, fill_color=MAU["giay"], fill_opacity=1, stroke_color=MAU["muc"],
                        stroke_width=2).move_to([dw / 4 + 1.2, 0, 0]))
        g.add(chu("front ω %.2f" % (wf / wc), .3, MAU["cam"]).move_to([-(dw / 4 + 1.2), .65, 0]),
              chu("rear ω %.2f" % (wr / wc), .3, MAU["giay"]).move_to([dw / 4 + 1.2, .65, 0]))
        nhan = "straight: equal speeds" if d < 1e-3 else ("LOCKED: speeds linked" if che == "khoa" and tien(t, T) >= .6 else "turn: speed difference")
        g.add(chu(nhan, .34, MAU["vang"]).move_to([0, -3.3, 0]))
        if che == "khoa" and tien(t, T) >= .55:
            g.add(cam(Rectangle(width=.5, height=5.6)).move_to([0, 0, 0]).set_opacity(min(1.0, (tien(t, T) - .55) / .05)))
        return g

    def _ba(self, t, T, dw, dh):
        q = tien(t, T)
        g = VGroup()
        khung = Rectangle(width=dw * .5, height=dh - 1.2, stroke_color=MAU["mo"], stroke_width=2)
        g.add(khung)
        vt = [("front", [0, dh / 2 - 1.6, 0], MAU["giay"]), ("centre", [0, 0, 0], MAU["cam"]), ("rear", [0, -dh / 2 + 1.6, 0], MAU["giay"])]
        for i, (ten, p, mau) in enumerate(vt):
            sang = 1.0 if min(2, int(q * 3)) == i else .45
            bo = Circle(radius=.9, fill_color=MAU["nen2"], fill_opacity=1, stroke_color=mau, stroke_width=4).move_to(p)
            g.add(bo, banh_rang(.55, 10, t * (2.0 + i * .7), mau).move_to(p).set_opacity(sang))
            g.add(chu(ten, .34, mau).move_to([dw * .25 + 1.3, p[1], 0]))
            if i != 1:
                for s in (-1, 1):
                    g.add(banh_xe(.55, -t * 3 * (1 + .04 * s * (q > .3))).move_to([s * (dw * .25 + .1), p[1], 0]))
                    g.add(Line(p, [s * (dw * .25 + .1), p[1], 0], stroke_color=MAU["giay"], stroke_width=4))
        g.add(Line(vt[0][1], vt[2][1], stroke_color=MAU["cam"], stroke_width=6))
        return g


class BaDongHo(CanhTS):
    """Ba đồng hồ tốc độ: đầu ra trước, vỏ vi sai (carrier), đầu ra sau; carrier = trung bình (vi sai côn đối xứng lý tưởng)."""

    def ve(self, t, T, dw, dh):
        q = tien(t, T)
        d = .3 * math.sin(math.pi * q)  # chênh vào/ra cua
        w = 1.0
        wf, wr = w * (1 + d), w * (1 - d)
        wc = (wf + wr) / 2
        g = VGroup()
        for i, (ten, v, mau) in enumerate((("front output", wf, MAU["cam"]), ("carrier", wc, MAU["vang"]), ("rear output", wr, MAU["giay"]))):
            x = (i - 1) * dw / 3
            r = min(1.5, dw / 6 - .3)
            mat = Circle(radius=r, fill_color=MAU["nen2"], fill_opacity=1, stroke_color=mau, stroke_width=5).move_to([x, .3, 0])
            g.add(bong(mat), mat)
            for k in range(12):
                a = math.pi / 2 - k * math.pi / 6
                g.add(Line([x + r * .85 * math.cos(a), .3 + r * .85 * math.sin(a), 0], [x + r * math.cos(a), .3 + r * math.sin(a), 0],
                           stroke_color=MAU["giay"], stroke_width=2))
            a = math.pi / 2 - 2 * math.pi * v * t / 3.0
            kim = Line([x, .3, 0], [x + r * .8 * math.cos(a), .3 + r * .8 * math.sin(a), 0], stroke_color=mau, stroke_width=7)
            g.add(kim, Dot([x, .3, 0], color=MAU["muc"]))
            g.add(chu(ten, .3, mau).move_to([x, .3 + r + .45, 0]), chu("ω = %.2f" % v, .34, mau).move_to([x, .3 - r - .45, 0]))
        g.add(chu("ω_carrier = (ω_front + ω_rear) / 2   ideal symmetric bevel only", .3, MAU["vang"]).move_to([0, -dh / 2 + .5, 0]))
        return g


class CanBangMomen(CanhTS):
    """Khớp nhớt: hai bộ đĩa xen kẽ quay theo trục trước/sau; chênh tốc tăng → mô-men cắt nhớt (mũi tên) tăng."""

    def ve(self, t, T, dw, dh):
        q = tien(t, T)
        dw_ = .5 * min(1.0, q / .6)  # chênh tốc trước–sau tăng dần
        wf, wr = 2.0 * (1 + dw_ / 2), 2.0 * (1 - dw_ / 2)
        g = VGroup()
        vo = RoundedRectangle(width=5.2, height=4.6, corner_radius=.3, fill_color=MAU["nen2"], fill_opacity=.9, stroke_color=MAU["giay"],
                              stroke_width=3)
        g.add(bong(vo), vo)
        for i in range(9):
            x = -2.0 + i * .5
            ngoai = i % 2 == 0
            v = wf if ngoai else wr
            pha = (v * t * .6 + i * .3) % 1.0
            mau = MAU["cam"] if ngoai else MAU["giay"]
            dia = Rectangle(width=.16, height=3.8 if ngoai else 3.0, fill_color=mau, fill_opacity=1, stroke_color=MAU["muc"], stroke_width=2)
            g.add(dia.move_to([x, 0, 0]))
            for k in range(3):
                yy = -1.5 + ((pha + k / 3) % 1.0) * 3.0
                g.add(Dot([x, yy, 0], radius=.07, color=MAU["muc"]))
        for i in range(8):
            x = -1.75 + i * .5
            for k in range(4):
                yy = -1.6 + ((t * .8 * (1 + 3 * dw_) + k / 4 + i * .13) % 1.0) * 3.2
                g.add(Line([x - .12, yy, 0], [x + .12, yy + .25 * dw_ + .02, 0], stroke_color=MAU["vang"], stroke_width=2, stroke_opacity=.7))
        Tm = .4 + 3.0 * dw_ * 2
        g.add(mui_ten([-2.8, 2.9, 0], [-2.8 - Tm * .5, 2.9, 0], MAU["do"]), mui_ten([2.8, 2.9, 0], [2.8 + Tm * .5, 2.9, 0], MAU["do"]))
        g.add(chu("Δω = %.2f" % (wf - wr), .36, MAU["vang"]).move_to([0, -2.8, 0]),
              chu("coupling torque rises with Δω", .3, MAU["do"]).move_to([0, 3.5, 0]),
              chu("example, not a fixed split", .28, MAU["giay"]).move_to([0, -3.4, 0]))
        g.add(chu("front", .3, MAU["cam"]).move_to([-dw / 2 + 1.0, 0, 0]), chu("rear", .3, MAU["giay"]).move_to([dw / 2 - 1.0, 0, 0]))
        g.add(Rectangle(width=dw / 2 - 3.0, height=.35, fill_color=MAU["cam"], fill_opacity=1, stroke_color=MAU["muc"],
                        stroke_width=VIEN_MUC).move_to([-(dw / 4 + 1.3), -.6, 0]),
              Rectangle(width=dw / 2 - 3.0, height=.35, fill_color=MAU["giay"], fill_opacity=1, stroke_color=MAU["muc"],
                        stroke_width=2).move_to([dw / 4 + 1.3, -.6, 0]))
        return g


CANH = {c.__name__: c for c in (MatBangQueo, TheBanVe, KhoangChenh, PhuongTrinh, VongXuyen, BangSo, TrucLien, BanhLan,
                                 MatCatViSai, BaDongHo, CanBangMomen)}
