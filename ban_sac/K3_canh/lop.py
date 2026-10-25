# 12 lớp cảnh K3 (Strata Notes) — mỗi loại cảnh một lớp tham số hoá: __init__(**tham_so) → bo_cuc_16x9(v) / bo_cuc_9x16(v)
# đặt khung vẽ → ve(v) chạy lõi vẽ chung, trả danh sách Phan (phần tử + mốc lời). Không bản VI (lệnh Chủ tịch 20:3x 17/10).
# Khoá phần tử ổn định giữa các beat cùng trang (lõi giữ nguyên phần tử trùng khoá + trùng hình, đổi nếu khác, ẩn nếu mất).
# SX lập 17/10/2026 (phiên local_df559baa, Opus 5.5 xhigh).
import json
import os
import re

import numpy as np
from manim import (VGroup, VMobject, Line, DashedLine, DashedVMobject, Rectangle, Circle, Arc, ArcBetweenPoints, Polygon,
                   ParametricFunction, PI, TAU, UP, DOWN, LEFT, RIGHT, ORIGIN, UL, UR, DL, DR)

import K3_so_thuc_dia as K3
from K3_so_thuc_dia import GIAY, MUC, DEVON, SILUR, CARBON, JURA, NHAN
from K3_canh.loi import Phan, vong_tay, ngoac, ngoac_doc, vua, dat, ke_hoach, MAU, tach_mu

COT = ["measured", "dated", "counted", "assumed"]
VAT_THAT = os.path.join(os.path.dirname(__file__), "..", "..", "out", "_nghien_cuu", "lam_viec", "pri24548",
                        "vat_that_PRI24548_xem.json")


def lat_dau(t, s):
    """Glyph của đoạn đầu `s` theo từng dòng (DongChu: một dòng; KhoiChu: đoạn có thể vắt sang dòng sau)."""
    if not hasattr(t, "dong"):
        return [t.lat(s)]
    ra = []
    for d in t.dong:
        if not s:
            break
        if s.startswith(d.base):
            ra.append(d.lat(d.base))
            s = s[len(d.base):].lstrip()
        else:
            ra.append(d.lat(s))
            s = ""
    return ra


def chuoi_trong(x):
    if isinstance(x, str):
        return [x]
    if isinstance(x, dict):
        return [s for v in x.values() for s in chuoi_trong(v)]
    if isinstance(x, (list, tuple)):
        return [s for v in x for s in chuoi_trong(v)]
    return []


def mui(a, b, mau=MUC, dam=2.0, op=0.85, dau=0.15):
    """Mũi tên vẽ tay: thân + hai nét đầu (không tô)."""
    a, b = np.array(a, dtype=float), np.array(b, dtype=float)
    d = b - a
    u = d / max(np.linalg.norm(d), 1e-6)
    n = np.array([-u[1], u[0], 0.0])
    g = VGroup(Line(a, b), Line(b, b - u * dau + n * dau * 0.55), Line(b, b - u * dau - n * dau * 0.55))
    return g.set_stroke(mau, dam, op)


def mui_gay(diem, mau=MUC, dam=2.0, op=0.85, dau=0.15):
    """Mũi tên gãy khúc vẽ tay (đi vòng mép ô, không xuyên chữ): thân nhiều đoạn + hai nét đầu ở điểm cuối."""
    p = [np.array(x, dtype=float) for x in diem]
    a, b = p[-2], p[-1]
    u = (b - a) / max(np.linalg.norm(b - a), 1e-6)
    n = np.array([-u[1], u[0], 0.0])
    than = VMobject().set_points_as_corners(p)
    return VGroup(than, Line(b, b - u * dau + n * dau * 0.55), Line(b, b - u * dau - n * dau * 0.55)).set_stroke(mau, dam, op)


def gach(m, mau=MUC, dam=2.4, op=0.85, le=0.08):
    """Gạch chéo (X) qua hộp bao của m."""
    a, b, c, d = m.get_corner(UL), m.get_corner(DR), m.get_corner(DL), m.get_corner(UR)
    e = np.array([le, -le, 0])
    f = np.array([le, le, 0])
    return VGroup(Line(a - e, b + e), Line(c - f, d + f)).set_stroke(mau, dam, op)


def the(m, le=0.14, mau=MUC, op=0.55, nen=0.0, dam=1.3, mau_nen=GIAY):
    r = Rectangle(width=m.width + 2 * le, height=m.height + 2 * le).move_to(m.get_center())
    return r.set_stroke(mau, dam, op).set_fill(mau_nen, nen)


def manh_giay(m, le=0.22, goc=-0.018):
    """Mảnh giấy trích dẫn dán băng dính (trục 7) quanh khối chữ m; chữ không xoay (đọc được)."""
    r = Rectangle(width=m.width + 2 * le, height=m.height + 2 * le).move_to(m.get_center())
    r.set_stroke(MUC, 1.1, 0.5).set_fill(MUC, 0.035).rotate(goc)
    return VGroup(r, K3.bang_dinh(r), m)


def de_nhe(a, b, op=0.45):
    return Line(a, b).set_stroke(MUC, 1, op)


class Ngan:
    """Xếp khối theo chiều dọc trong y0..y1, tránh các khoảng đã chiếm (khe `gap`)."""

    def __init__(self, y0, y1, gap=0.12):
        self.y0, self.y1, self.gap, self.da = y0, y1, gap, []

    def chiem(self, m):
        self.da.append((m.get_bottom()[1], m.get_top()[1]))
        return m

    def dat(self, m, y_mong):
        h = m.height
        for i in range(0, 300):
            for s in ((0,) if i == 0 else (1, -1)):
                yc = y_mong + s * i * 0.03
                b, t = yc - h / 2, yc + h / 2
                if b < self.y0 - 1e-6 or t > self.y1 + 1e-6:
                    continue
                if all(t + self.gap <= db or b - self.gap >= dt for db, dt in self.da):
                    m.move_to([m.get_center()[0], yc, 0])
                    return self.chiem(m)
        m.move_to([m.get_center()[0], min(max(y_mong, self.y0 + h / 2), self.y1 - h / 2), 0])
        print("CANH_BAO_XEP het cho, dat de tai y %.2f" % y_mong)
        return self.chiem(m)


class Lop:
    """Lớp cảnh K3: tham số từ storyboard; bố cục hai khung; ve(v) dùng chung."""

    def __init__(self, **ts):
        self.ts = ts
        self.beat = None
        self.L = None

    # bố cục: hộp nội dung chung (lớp con thêm vị trí riêng)
    def _bc(self, v, doc):
        x0, x1, y0, y1 = v.hop()
        L = dict(doc=doc, x0=x0, x1=x1, y0=y0, y1=y1 if doc else 1.95, y1_trai=y1, x_khia=None if doc else 4.0)
        L["w"], L["h"] = L["x1"] - L["x0"], L["y1"] - L["y0"]
        return L

    def bo_cuc_16x9(self, v):
        return self._bc(v, False)

    def bo_cuc_9x16(self, v):
        return self._bc(v, True)

    @property
    def thua(self):
        """Nhãn của beat không có nguyên văn trong tham số (lớp tự dựng: 'Station 1 · …', nhãn gạch dưới …)."""
        co = set(chuoi_trong(self.ts))
        return [s for s in self.beat.get("labels", []) if s not in co]

    def ve(self, v):
        raise NotImplementedError


# ------------------------------------------------------------------ h1
class TrangVatChung(Lop):
    """Trang mẫu vật: hình vẽ lại PRI 24548-view1 dán băng dính, thẻ tên, ghi chú lề, ghi chú tô một đoạn theo lời."""
    CAO_MM, RONG_MM, DINH_MM = 44.0, 41.0, 7.5
    BAC_MM, GO_MM = 6.5, [9.9, 13.3, 16.7, 20.1, 23.5, 26.9, 30.3, 33.7, 37.1]

    def __init__(self, **ts):
        super().__init__(**ts)
        with open(VAT_THAT, encoding="utf-8") as f:
            rec = json.load(f)
        v1 = rec["view1_mat_ben"]
        so = lambda s: float(re.search(r"\d+(?:[.,]\d+)?", s).group().replace(",", "."))
        assert abs(so(v1["cao_mm"]) - self.CAO_MM) < 0.01 and abs(so(v1["rong_mm"]) - self.RONG_MM) < 0.01, v1
        quy = json.dumps(rec.get("go_vach_xem_lai_2609", {}).get("view1_quy_uoc_ve_cho_AB", ""), ensure_ascii=False)
        so_go = [float(x.replace(",", ".")) for x in re.findall(r"\d+,\d", quy)]
        assert so_go[0] == self.BAC_MM and so_go[2:11] == self.GO_MM, "quy ước vẽ 10 gờ không khớp bản ghi vật thật: %s" % so_go

    def mau_vat(self, cao):
        """Như bia.py mau_vat(): thân chóp, bậc 6,5 mm, 9 gờ cách đều, đới gốc có vân dọc thưa, miệng đài mép vỡ."""
        K = cao / self.CAO_MM
        rong = lambda d: (self.DINH_MM + (self.RONG_MM - self.DINH_MM) * d / self.CAO_MM) * K
        y = lambda d: cao / 2 - d * K
        B = self.BAC_MM
        trai = [[-rong(d) / 2, y(d), 0] for d in (0, B, B + 0.6, self.CAO_MM - 1.5)]
        phai = [[rong(d) / 2, y(d), 0] for d in (0, B, B + 0.6, self.CAO_MM - 2.5)]
        trai[2][0] -= 1.0 * K
        phai[2][0] += 1.0 * K
        C = self.CAO_MM
        day = [[-rong(C) * 0.30, y(C), 0], [-rong(C) * 0.05, y(C - 0.9), 0], [rong(C) * 0.22, y(C - 0.4), 0]]
        than = Polygon(*trai, *day, *reversed(phai)).set_fill(NHAN, 0.16).set_stroke(MUC, 2.6, 0.95)
        g = VGroup(than)
        for d in [B] + self.GO_MM:
            w = rong(d) + (2.0 * K if d > B else 0)
            a = ArcBetweenPoints([-w / 2, y(d), 0], [w / 2, y(d), 0], angle=-0.42)
            g.add(a.set_stroke(MUC, 2.4 if d == B else 1.9, 0.85))
            b = ArcBetweenPoints([-w / 2 + 0.05, y(d) - 0.06, 0], [w / 2 - 0.05, y(d) - 0.06, 0], angle=-0.42)
            g.add(b.set_stroke(NHAN, 1.4, 0.55))
        w0, w1 = rong(37.5), rong(43.0)
        for k in range(8):
            f = (k + 0.5) / 8
            g.add(Line([-w0 / 2 + w0 * f, y(37.6) - 0.03 * np.sin(k), 0], [-w1 / 2 + w1 * f, y(42.6), 0]).set_stroke(MUC, 1.2, 0.35))
        return g

    def bo_cuc_16x9(self, v):
        L = self._bc(v, False)
        L.update(mv=(0.9, 3.95, L["y0"] + 0.55, L["y1_trai"] - 0.05), chu=(L["x0"] + 0.05, 0.3), le_y=L["y1_trai"] - 0.35,
                 rong_chu=5.6, co=22)
        return L

    def bo_cuc_9x16(self, v):
        L = self._bc(v, True)
        L.update(mv=(-0.05, L["x1"], L["y0"] + 0.45, L["y1"]), chu=(L["x0"], -0.25), le_y=L["y1"] - 0.25, rong_chu=3.05, co=19)
        return L

    def ve(self, v):
        L, ts = self.L, self.ts
        x0m, x1m, y0m, y1m = L["mv"]
        mv = self.mau_vat(6.0)
        vua(mv, x0m, x1m, y0m, y1m, ORIGIN)
        out = [Phan("mv:than", mv, "ve", rt=1.4)]
        if ts.get("bang_dinh"):
            out.append(Phan("mv:bang", K3.bang_dinh(mv[0], 0.12), "hien", rt=0.5))
        ten = v.dong(ts["the_ten"], 17, MUC, 0.9, nghieng=True)
        dat(ten, x=mv.get_center()[0], tren=mv.get_bottom()[1] - 0.12)
        vua(ten, L["x0"] if L["doc"] else x0m - 0.6, L["x1"] if L["doc"] else 3.95, ten.get_bottom()[1], ten.get_top()[1])
        out.append(Phan("mv:ten", VGroup(ten, the(ten, 0.08, op=0.4)), "hien"))
        cx0, cx1 = L["chu"]
        le = v.dong(ts["chu_le_trai"], L["co"] + 6, MUC, 0.9, nghieng=True)
        dat(le, trai=cx0, y=L["le_y"])
        out.append(Phan("le:trai", le, "hien"))
        g = ts["ghi_chu_le"]
        gc = v.khoi(g["chu"], L["co"], L["rong_chu"], nghieng=False)
        dat(gc, trai=cx0, tren=le.get_bottom()[1] - 0.45)
        out.append(Phan("le:ghi", gc, "hien", moc=g.get("moc")))
        if g.get("phan_dam"):
            gl = gc.lat(g["phan_dam"])
            out.append(Phan("le:ghi:dam", v.gach_duoi(gl, MAU[g.get("mau_dam", "NHAN")]), "dam", moc=g.get("dam_tai"),
                            glyph=gl, mau=MAU[g.get("mau_dam", "NHAN")], rt=0.6))
        return out


# ------------------------------------------------------------------ h2, s7
class HaiOSo(Lop):
    """Hai ô số đặt cạnh nhau (đếm được / đo được), ngoặc so sánh, ghi chú lề phải."""

    def bo_cuc_16x9(self, v):
        L = self._bc(v, False)
        nua = (self.beat or {}).get("vao") == "truot_nua"
        L.update(vx0=-0.35 if nua else L["x0"] + 0.4, vx1=L["x1"] - (0.15 if nua else 0.6), ngang=True)
        return L

    def bo_cuc_9x16(self, v):
        L = self._bc(v, True)
        L.update(vx0=L["x0"], vx1=L["x1"], ngang=False)
        return L

    # nấc xếp (đệm ô dọc, khe hai ô dọc, khe chữ ngoặc dọc, khe ket, cỡ ket); nấc 0 = bố cục gốc, beat vừa giữ y nguyên.
    # Nấc 0 tràn (ket ra ngoài vùng an toàn, đè chữ ngoặc, xuống quá đỉnh khối chú thích; SX 20/10 K3 t2 s2/s2d) mới thử
    # nấc sau: ngang đặt ket dưới chữ ngoặc, giữa hai ô; ket dài hơn vùng thì ngắt dòng; dọc khép đệm/khe rồi hạ cỡ ket.
    NAC = ((0.55, 0.35, 0.22, 0.3, 26), (0.4, 0.25, 0.16, 0.2, 26), (0.3, 0.2, 0.12, 0.15, 24), (0.3, 0.18, 0.1, 0.12, 22))

    def ve(self, v):
        n0 = len(v.da_ve)
        for i, nac in enumerate(self.NAC):
            del v.da_ve[n0:]
            out, loi = self._ve(v, nac, i > 0)
            if not loi:
                break
        return out

    @staticmethod
    def _ket_loi(v, t, ng):
        """Lỗi của ket theo đúng ngưỡng kiem_vung (vùng an toàn, đỉnh khối chú thích, chồng chữ ngoặc); vừa -> None."""
        a0, a1, b0, b1 = v.bc.an_toan
        x0, x1, y0, y1 = t.get_left()[0], t.get_right()[0], t.get_bottom()[1], t.get_top()[1]
        if x0 < a0 - 1e-3 or x1 > a1 + 1e-3 or y0 < b0 - 1e-3 or y1 > b1 + 1e-3:
            return "ngoài vùng an toàn"
        if v.y_san > v.bc.ct_day + 1e-6 and y0 < v.y_san - 0.18 - 0.02 and x0 < v.bc.ct_x1:
            return "lấn khối chú thích"
        for m in ng:
            w = min(x1, m.get_right()[0]) - max(x0, m.get_left()[0])
            h = min(y1, m.get_top()[1]) - max(y0, m.get_bottom()[1])
            if w > 0.02 and h > 0.02:
                return "chồng chữ ngoặc"
        return None

    def _ve(self, v, nac, gon):
        L, ts = self.L, self.ts
        dem, khe_o, khe_ng, khe_ket, co_ket = nac
        out = []
        vx0, vx1 = L["vx0"], L["vx1"]
        W = vx1 - vx0
        ot, op_ = ts["o_trai"], ts["o_phai"]
        if L["ngang"]:
            bw = (W - 0.7) / 2
            a = v.khoi(ot["chu"], 24, bw - 0.4)
            b = v.khoi(op_["chu"], 24, bw - 0.4)
            hmax = max(a.height, b.height) + 0.6
            yc = L["y1"] - 0.25 - hmax / 2
            ra = Rectangle(width=bw, height=hmax).move_to([vx0 + bw / 2, yc, 0])
            rb = Rectangle(width=bw, height=hmax).move_to([vx1 - bw / 2, yc, 0])
        else:
            bw = W - 0.55
            a = v.khoi(ot["chu"], 24, bw - 0.4)
            b = v.khoi(op_["chu"], 24, bw - 0.4)
            ha, hb = a.height + dem, b.height + dem
            ra = Rectangle(width=bw, height=ha).move_to([vx0 + bw / 2, L["y1"] - 0.15 - ha / 2, 0])
            rb = Rectangle(width=bw, height=hb).move_to([vx0 + bw / 2, ra.get_bottom()[1] - khe_o - hb / 2, 0])
        for r in (ra, rb):
            r.set_stroke(MUC, 1.6, 0.75)
        a.move_to(ra.get_center())
        b.move_to(rb.get_center())
        ka = "co" if ot.get("tu_dau") else "hien"
        kb = "co" if op_.get("tu_dau") else "hien"
        out += [Phan("ho:a", VGroup(ra, a), ka, moc=ot.get("moc")), Phan("ho:b", VGroup(rb, b), kb, moc=op_.get("moc"))]
        hop2 = VGroup(ra, rb)
        y_duoi = hop2.get_bottom()[1]
        if ts.get("ngoac"):
            g = ts["ngoac"]
            if L["ngang"]:
                n = ngoac(ra.get_left()[0] + 0.1, rb.get_right()[0] - 0.1, y_duoi - 0.12, 0.16, -1)
                t = v.khoi(g["chu"], 22, W)
                dat(t, x=hop2.get_center()[0], tren=n.get_bottom()[1] - 0.12)
            else:
                n = ngoac_doc(ra.get_right()[0] + 0.1, rb.get_bottom()[1] + 0.05, ra.get_top()[1] - 0.05, 0.14, 1)
                t = v.khoi(g["chu"], 22, W)
                dat(t, trai=vx0, tren=y_duoi - khe_ng)
            out += [Phan("ho:ngoac", n, "ve", moc=g.get("moc")), Phan("ho:ngoac:chu", t, "hien", moc=g.get("moc"), tre=0.3)]
            y_duoi = t.get_bottom()[1]
        if ts.get("ngoac_mot"):
            g = ts["ngoac_mot"]
            n = ngoac(ra.get_left()[0] + 0.1, ra.get_right()[0] - 0.1, ra.get_bottom()[1] - 0.12, 0.16, -1) if L["ngang"] else \
                ngoac_doc(ra.get_right()[0] + 0.1, ra.get_bottom()[1] + 0.05, ra.get_top()[1] - 0.05, 0.14, 1)
            t = v.khoi(g["chu"], 20, (ra.width + 0.6) if L["ngang"] else W)
            if L["ngang"]:
                dat(t, trai=ra.get_left()[0], tren=n.get_bottom()[1] - 0.12)
            else:
                dat(t, trai=vx0, tren=y_duoi - khe_ng)
            out += [Phan("ho:ngoac1", n, "ve", moc=g.get("moc")), Phan("ho:ngoac1:chu", t, "hien", moc=g.get("moc"), tre=0.3)]
            y_duoi = min(y_duoi, t.get_bottom()[1])
        loi = None
        if ts.get("ket"):
            g = ts["ket"]
            t = v.dong(g["chu"], co_ket, MUC, 1.0)
            if gon and t.width > W + 1e-3:
                t = v.khoi(g["chu"], co_ket, W)
            if L["ngang"] and not gon:
                dat(t, x=rb.get_center()[0], tren=rb.get_bottom()[1] - 0.35)
            elif L["ngang"]:
                dat(t, x=hop2.get_center()[0], tren=y_duoi - khe_ket)
            else:
                dat(t, trai=vx0, tren=y_duoi - khe_ket)
            gl = lat_dau(t, g["chu"].split(" (")[0])
            dam = v.gach_duoi(gl[0]) if len(gl) == 1 else VGroup(*[v.gach_duoi(x) for x in gl])
            out += [Phan("ho:ket", t, "hien", moc=g.get("moc")),
                    Phan("ho:ket:dam", dam, "dam", moc=g.get("moc"), tre=0.5,
                         glyph=gl[0] if len(gl) == 1 else [x for d in gl for x in d], mau=NHAN, rt=0.5)]
            loi = self._ket_loi(v, t, [p.m for p in out if p.khoa in ("ho:ngoac:chu", "ho:ngoac1:chu")])
        if ts.get("le_phai"):
            g = ts["le_phai"]
            out.append(Phan("trang:goc", v.goc(g["chu"]), "hien", moc=g.get("moc")))
        return out, loi


# ------------------------------------------------------------------ h3 h4 s3e s4 s6a s7a s7b k1
class SoCai(Lop):
    """Sổ cái bốn cột measured / dated / counted / assumed (ngang 4 cột; dọc 2×2) và ô tổng ('the sum')."""

    def _khung(self, v, doc):
        L = self._bc(v, doc)
        if doc:
            L.update(yF=max(L["y0"], -0.30), y_dinh=L["y1"] - 0.05)   # 3.50 - 0.05 = 3.45 đúng byte; SQ-9
            if self.ts.get("ba_viec"):
                L["yF"] = L["y0"]
                return self._luoi_doc(L, [0.62], "1x4", L["yF"] + 0.1)
            return self._luoi_doc(L, [None, None], "2x2", L["yF"] + 0.75)
        else:
            yF = max(L["y0"], -1.40)
            x0, x1, y1 = L["x0"], L["x1"], 1.9
            w = (x1 - x0) / 4
            o = {}
            for i, c in enumerate(COT):
                o[c] = dict(x0=x0 + i * w + 0.14, x1=x0 + (i + 1) * w - 0.1, ydau=y1 - 0.22, y1=y1 - 0.62, y0=yF + 0.85)
            ke = [((x0 + i * w, yF + 0.85), (x0 + i * w, y1)) for i in (1, 2, 3)]
            dau = [((x0, y1 - 0.47), (x1, y1 - 0.47))]
        L.update(o=o, ke=ke, dau=dau, tong=(x0, x1, yF + 0.05, yF + 0.68), yF=yF)
        return L

    def bo_cuc_16x9(self, v):
        return self._khung(v, False)

    def bo_cuc_9x16(self, v):
        return self._khung(v, True)

    # dọc: lưới tự co theo nội dung (đo khô rồi mới vẽ): 2×2 cao thấp theo hàng; thiếu chỗ thì bốn hàng ngang
    CO_TONG = ("o_tong", "mui_ten", "dem_vao_sum", "treo")
    HANG_THU = ((1.55, 0, 0.12, 22), (1.5, -1, 0.08, 21), (1.45, -2, 0.06, 20), (1.3, -3, 0.06, 18))
    _can = None
    _dco = 0
    _gap = None
    _cdau = 22

    def _luoi_doc(self, L, h, che_do, day, XD=1.55):
        x0, x1, y1 = L["x0"], L["x1"], L["y_dinh"]
        yF = L["yF"]
        con = (y1 - day) - sum(x for x in h if x is not None)
        k = sum(1 for x in h if x is None)
        h = [x if x is not None else con / k for x in h]
        bien = [y1]
        for x in h:
            bien.append(bien[-1] - x)
        o = {}
        if che_do == "2x2":
            xm = (x0 + x1) / 2
            for i, c in enumerate(COT):
                cx0, cx1 = (x0, xm) if i % 2 == 0 else (xm, x1)
                cy1, cy0 = (bien[0], bien[1]) if i < 2 else (bien[1], bien[2])
                o[c] = dict(x0=cx0 + 0.12, x1=cx1 - 0.08, ydau=cy1 - 0.22, y1=cy1 - 0.5, y0=cy0 + 0.06)
            ke = [((xm, bien[2] + 0.05), (xm, y1)), ((x0, bien[1]), (x1, bien[1]))]
            dau = [((o[c]["x0"], o[c]["ydau"] - 0.2), (o[c]["x1"] - 0.2, o[c]["ydau"] - 0.2)) for c in COT]
        elif che_do == "1x4":
            w = (x1 - x0) / 4
            for i, c in enumerate(COT):
                o[c] = dict(x0=x0 + i * w + 0.1, x1=x0 + (i + 1) * w - 0.06, ydau=y1 - 0.22, y1=y1 - 0.62, y0=y1 - 0.62)
            ke = [((x0 + i * w, y1 - 0.49), (x0 + i * w, y1)) for i in (1, 2, 3)]
            dau = [((x0, y1 - 0.47), (x1, y1 - 0.47))]
        else:
            for i, c in enumerate(COT):
                o[c] = dict(x0=x0 + XD + 0.1, x1=x1 - 0.08, xdau=x0 + 0.1, ydau=bien[i] - 0.22, y1=bien[i] - 0.08,
                            y0=bien[i + 1] + 0.04, ngang=True)
            ke = [((x0 + XD, bien[4] + 0.05), (x0 + XD, y1))] + [((x0, bien[i]), (x1, bien[i])) for i in (1, 2, 3)]
            dau = []
        L.update(o=o, ke=ke, dau=dau, tong=(x0, x1, yF + 0.05, yF + 0.68), che_do=che_do)
        return L

    # ngang: cột tràn (SX 20/10 K3 t2 s1c/s3) mới co; không ô tổng thì cột kéo xuống chỗ ô tổng, rồi bớt cỡ/khe từng nấc.
    NGANG_THU = ((0, None), (-1, 0.08), (-2, 0.06), (-3, 0.06))

    def _vua_cot(self, v):
        can, o = self._do(v), self.L["o"]
        return all(can.get(c, 0.0) <= o[c]["y1"] - o[c]["y0"] + 1e-3 for c in COT)

    def _ve_ngang(self, v):
        L = self.L
        if self._vua_cot(v):
            return self._ve(v)
        if not any(self.ts.get(k) is not None for k in self.CO_TONG):
            y0 = L["yF"] + 0.1
            for c in COT:
                L["o"][c]["y0"] = y0
            L["ke"] = [((p[0], y0), q) for p, q in L["ke"]]
        for dco, gap in self.NGANG_THU:
            self._dco, self._gap = dco, gap
            if self._vua_cot(v):
                break
        return self._ve(v)

    def ve(self, v):
        L = self.L
        self._dco, self._gap, self._cdau = 0, None, 22
        if self.ts.get("ba_viec"):
            return self._ve(v)
        if not L["doc"]:
            return self._ve_ngang(v)
        can = self._do(v)
        o = L["o"]
        if all(can.get(c, 0.0) <= o[c]["y1"] - o[c]["y0"] + 1e-3 for c in COT):
            return self._ve(v)
        L["yF"] = L["y0"]
        co_tong = any(self.ts.get(k) is not None for k in self.CO_TONG)
        day = L["yF"] + (0.75 if co_tong else 0.1)
        hh = [max(0.62, 0.5 + max(can.get(c, 0.0) for c in COT[2 * r:2 * r + 2]) + 0.12) for r in (0, 1)]
        du = L["y_dinh"] - day - sum(hh)
        if du >= 0:
            self._luoi_doc(L, [x + du / 2 for x in hh], "2x2", day)
            return self._ve(v)
        L["y_dinh"] = L["y1"]
        for XD, dco, gap, cd in self.HANG_THU:
            self._dco, self._gap, self._cdau = dco, gap, cd
            self._luoi_doc(L, [None] * 4, "hang", day, XD)
            can = self._do(v)
            hh = [max(0.45, 0.16 + can.get(c, 0.0)) for c in COT]
            du = L["y_dinh"] - day - sum(hh)
            if du >= 0:
                break
        else:
            print("NGOAI_VUNG so_cai %s luoi doc thieu %.2f" % (self.beat["id"], -du))
        self._luoi_doc(L, [x + max(du, 0) / 4 for x in hh], "hang", day, XD)
        return self._ve(v)

    def _do(self, v):
        n0, ys = len(v.da_ve), v.y_san
        self._can = {}
        try:
            self._ve(v)
            return self._can
        finally:
            del v.da_ve[n0:]
            v.y_san = ys
            self._can = None

    def _ve(self, v):
        L, ts, b = self.L, self.ts, self.beat
        o = L["o"]
        out = []
        moc_cot = ts.get("moc_cot", {})
        tg_cot = {}
        for c in COT:
            m = moc_cot.get(c) or (c if c in b.get("moc", []) and not moc_cot and "cot" in ts and not ts.get("ghi_moc") and
                                   b["id"] == "h3" else None)
            tg_cot[c] = m
        # tiêu đề cột
        dau_cot = {}
        for c in COT:
            t = v.dong(c, self._cdau if L.get("che_do") != "1x4" else 20, MUC, 0.95, nghieng=True)
            dat(t, trai=o[c].get("xdau", o[c]["x0"]), y=o[c]["ydau"])
            dau_cot[c] = t
            out.append(Phan("so:cot:" + c, t, "co" if not tg_cot[c] or moc_cot else "hien", moc=None if moc_cot else tg_cot[c]))
        for i, (p, q) in enumerate(L["ke"]):
            if ts.get("ba_viec") and not L["doc"]:
                p = (p[0], L["dau"][0][0][1] - 0.02)
            out.append(Phan("so:ke:%d" % i, Line([*p, 0], [*q, 0]).set_stroke(MUC, 1.1, 0.35), "co"))
        for i, (p, q) in enumerate(L["dau"]):
            out.append(Phan("so:dau:%d" % i, Line([*p, 0], [*q, 0]).set_stroke(MUC, 1.3, 0.6), "co"))
        con = {c: o[c]["y1"] for c in COT}
        cuoi = {}
        hang_ngang = {}

        def vao_cot(c, m, gap=0.14, moi_dong=False):
            oc = o[c]
            if self._gap is not None:
                gap = min(gap, self._gap)
            h_ = hang_ngang.get(c)
            if oc.get("ngang") and h_ and not moi_dong and h_[0] + m.width <= oc["x1"] + 1e-3:
                dat(m, trai=h_[0], tren=h_[1])
                hang_ngang[c] = (m.get_right()[0] + 0.25, h_[1], min(h_[2], m.get_bottom()[1]))
            else:
                dat(m, trai=oc["x0"], tren=con[c])
                hang_ngang[c] = (m.get_right()[0] + 0.25, m.get_top()[1], m.get_bottom()[1])
            day_ = hang_ngang[c][2] if oc.get("ngang") else m.get_bottom()[1]
            con[c] = day_ - gap
            cuoi[c] = m
            if self._can is not None:
                self._can[c] = max(self._can.get(c, 0.0), oc["y1"] - day_)
            elif day_ < oc["y0"] - 1e-3:
                print("NGOAI_VUNG so_cai %s cot %s tran %.2f" % (b["id"], c, oc["y0"] - day_))
            return m

        rong = lambda c: o[c]["x1"] - o[c]["x0"]
        co = (18 if L["doc"] else 19) + self._dco
        tong = None

        def o_tong(chu_s=None, moc=None, khung_moc=None):
            x0, x1, y0, y1 = L["tong"]
            r = Rectangle(width=x1 - x0, height=y1 - y0).move_to([(x0 + x1) / 2, (y0 + y1) / 2, 0]).set_stroke(MUC, 1.8, 0.8)
            out.append(Phan("so:tong:khung", r, "ve", moc=khung_moc))
            if chu_s:
                t = v.dong(chu_s, 22, MUC, 1.0)
                vua(t, x0 + 0.2, x1 - 0.2, y0 + 0.08, y1 - 0.08, LEFT)
                out.append(Phan("so:tong:chu", t, "hien", moc=moc, tre=0.15))
            return r

        if ts.get("goc_tren_phai"):
            out.append(Phan("trang:goc", v.goc(ts["goc_tren_phai"]), "hien"))
        if ts.get("o_tong") is not None:
            g = ts["o_tong"]
            tong = o_tong(g["chu"] if isinstance(g, dict) else g, g.get("moc") if isinstance(g, dict) else None,
                          g.get("moc") if isinstance(g, dict) else None)
        for i, g in enumerate(ts.get("ghi", [])):
            c = g["cot"]
            t = vao_cot(c, v.khoi(g["chu"], co, rong(c)))
            out.append(Phan("so:ghi:%s:%d" % (c, i), t, "hien", moc=g.get("moc") or tg_cot.get(c), tre=0 if g.get("moc") else 0.6))
        if ts.get("gach_duoi"):
            g = ts["gach_duoi"]
            gl = list(dau_cot[g["cot"]].lat(g["cot"]))
            out.append(Phan("so:gach:" + g["cot"], v.gach_duoi(gl), "dam", moc=g.get("moc"), glyph=gl, mau=NHAN, rt=0.6))
            if self.thua:
                t = vao_cot(g["cot"], v.khoi(self.thua[0], co - 2, rong(g["cot"]), mau=NHAN, nghieng=True))
                out.append(Phan("so:gach:chu", t, "hien", moc=g.get("moc"), tre=0.3))
        if ts.get("the_nhan"):
            g = ts["the_nhan"]
            c = "counted"
            t = v.dong(g["chu"], co - 3, MUC, 0.9, nghieng=True)
            vua(t, 0, rong(c) - 0.3, 0, 1)
            vao_cot(c, t, 0.1, moi_dong=True)
            t.shift(RIGHT * 0.25 + DOWN * 0.05)
            r = the(t, 0.07, op=0.6)
            neo = [m for m in out if m.khoa.startswith("so:ghi:counted")]
            out.append(Phan("so:the", VGroup(r, t), "hien", moc=g.get("moc")))
            if neo:
                a0 = neo[0].m
                ya = a0.dong[0].get_center()[1] if hasattr(a0, "dong") else a0.get_center()[1]
                xl = o[c]["x0"] - 0.06
                day = VMobject().set_points_as_corners([[a0.get_left()[0] - 0.02, ya, 0], [xl, ya, 0], [xl, r.get_center()[1], 0],
                                                        [r.get_left()[0], r.get_center()[1], 0]]).set_stroke(MUC, 1, 0.6)
                out.append(Phan("so:the:day", day, "hien", moc=g.get("moc")))
        if ts.get("nghieng"):
            g = ts["nghieng"]
            c = g.get("cot", "measured")
            t = vao_cot(c, v.khoi(g["chu"], co - 1, rong(c), nghieng=True))
            out.append(Phan("so:nghieng", t, "hien", moc=g.get("moc")))
        if ts.get("mui_ten"):
            if tong is None:
                tong = o_tong()
            mui_cho = []
            for i, g in enumerate(ts["mui_ten"]):
                c = g["cot"]
                t = vao_cot(c, v.khoi(g["tu"], co, rong(c)))
                out.append(Phan("so:mui:%s" % c, t, "hien", moc=g.get("moc")))
                mui_cho.append((c, g, t))
        else:
            mui_cho = []
        for s, c in zip(ts.get("nam_yen", []), ["measured", "dated"]):
            t = vao_cot(c, v.dong(s, co, MUC, 0.75, nghieng=True))
            out.append(Phan("so:yen:%s" % c, t, "hien"))
        for c, g, t in mui_cho:
            y_a = min(t.get_bottom()[1], cuoi[c].get_bottom()[1]) - 0.08
            yt = tong.get_top()[1] + 0.04
            if L["doc"] and L.get("che_do") == "2x2" and COT.index(c) < 2:
                c2 = COT[COT.index(c) + 2]
                o2 = o[c2]
                trong = [p.m for p in out if p.m is not t and len(p.m.get_all_points()) and
                         p.m.width <= o2["x1"] - o2["x0"] + 0.05 and p.m.get_left()[0] >= o2["x0"] - 0.13 and
                         p.m.get_center()[0] <= o2["x1"] + 0.09 and p.m.get_bottom()[1] >= o2["y0"] - 0.07 and
                         p.m.get_top()[1] <= o2["ydau"] + 0.3]
                xr = max([o2["x1"] - 0.1] + [m.get_right()[0] + 0.12 for m in trong])
                if xr > o2["x1"] + 0.03:
                    xr = (L["x0"] - 0.12) if COT.index(c) % 2 == 0 else (L["x1"] + 0.06)
                ys = t.get_center()[1]
                if (xr > t.get_right()[0] + 0.15) or (xr < t.get_left()[0] - 0.15):
                    p0 = [t.get_right()[0] + 0.08, ys, 0] if xr > t.get_right()[0] else [t.get_left()[0] - 0.08, ys, 0]
                    a = mui_gay([p0, [xr, ys, 0], [xr, yt, 0]], NHAN, 2.4, 0.9)
                else:
                    a = mui([xr, y_a, 0], [xr, yt, 0], NHAN, 2.4, 0.9)
            else:
                a = mui([t.get_center()[0], y_a, 0], [t.get_center()[0], yt, 0], NHAN, 2.4, 0.9)
            out.append(Phan("so:mui:%s:ten" % c, a, "ve", moc=g.get("moc"), tre=0.35, rt=0.6))
        if ts.get("treo"):
            g = ts["treo"]
            neo = []
            for s in g["day_tu"]:
                if s in COT:
                    neo.append(cuoi.get(s, dau_cot[s]))
                else:
                    c = "counted"
                    t = vao_cot(c, v.khoi(s, co, rong(c)))
                    out.append(Phan("so:treo:neo", t, "hien"))
                    neo.append(t)
            x0, x1, y0, y1 = L["tong"]
            t = v.dong(g["chu"], 26, MUC, 1.0)
            xc = (neo[0].get_center()[0] + neo[-1].get_center()[0]) / 2
            dat(t, x=xc, y=(y0 + y1) / 2)
            if t.get_right()[0] > x1:
                dat(t, phai=x1 - 0.1)
            day = VGroup(*[de_nhe([n.get_center()[0], n.get_bottom()[1] - 0.05, 0], [t.get_center()[0] + (k - 0.5) * 0.6,
                                                                                   t.get_top()[1] + 0.05, 0], 0.6)
                           for k, n in enumerate(neo)])
            out += [Phan("so:treo:day", day, "ve"), Phan("so:treo:chu", t, "hien")]
            gl = t.lat(g["chu"].split(" (")[0])
            out.append(Phan("so:treo:dam", v.gach_duoi(gl), "dam", moc=g.get("dam_tai"), glyph=gl, mau=NHAN, rt=0.5))
        if ts.get("day_du"):
            for c in COT:
                for i, s in enumerate(ts["dong"].get(c, [])):
                    t = vao_cot(c, v.khoi(s, co - 2, rong(c)), 0.1)
                    out.append(Phan("so:du:%s:%d" % (c, i), t, "hien", moc=moc_cot.get(c), tre=0.3 * i, rt=0.6))
            if ts.get("dem_vao_sum"):
                g = ts["dem_vao_sum"]
                tong = o_tong(g["chu"], g.get("moc"))
            if ts.get("ngoai"):
                g = ts["ngoai"]
                a, d = o["measured"], o["dated"]
                t = v.dong(g["chu"], co - 1, NHAN, 1.0, nghieng=True)
                if L["doc"]:
                    vao_cot("dated", t, 0.1)
                    dat(t, phai=d["x1"])
                x0_ = min(a.get("xdau", a["x0"]), d.get("xdau", d["x0"])) - 0.08
                x1_ = max(a["x1"], d["x1"]) + 0.04
                y1_ = max(dau_cot["measured"].get_top()[1], dau_cot["dated"].get_top()[1]) + 0.1
                y0_ = min(a["y0"], d["y0"]) - 0.02
                if L["doc"]:
                    y0_ = min(y0_, t.get_bottom()[1] - 0.06)
                r = Rectangle(width=x1_ - x0_, height=y1_ - y0_).move_to([(x0_ + x1_) / 2, (y0_ + y1_) / 2, 0])
                r = DashedVMobject(r.set_stroke(NHAN, 1.8, 0.85), num_dashes=60)
                if not L["doc"]:
                    dat(t, phai=x1_ - 0.1, duoi=y0_ + 0.08)
                out += [Phan("so:ngoai", r, "ve", moc=g.get("moc")), Phan("so:ngoai:chu", t, "hien", moc=g.get("moc"), tre=0.3)]
        if ts.get("ba_viec"):
            x0, x1, y0, y1 = L["x0"], L["x1"], L["tong"][2], (o["measured"]["y1"] if not L["doc"] else o["counted"]["y1"])
            yc = (o["measured"]["y1"] if not L["doc"] else o["measured"]["y1"])
            vung_y1 = yc
            ds = []
            for i, g in enumerate(ts["ba_viec"]):
                t = v.khoi(g["chu"], 22 if not L["doc"] else 19, (x1 - x0) - 0.9)
                o_vuong = Rectangle(width=0.22, height=0.22).set_stroke(MUC, 1.5, 0.8)
                ds.append((g, t, o_vuong))
            cur = vung_y1 - 0.05
            for i, (g, t, q) in enumerate(ds):
                dat(t, trai=x0 + 0.55, tren=cur)
                q.move_to([x0 + 0.25, t.dong[0].get_center()[1] if hasattr(t, "dong") else t.get_center()[1], 0])
                cur = t.get_bottom()[1] - 0.22
                out.append(Phan("so:viec:%d" % i, VGroup(q, t), "hien", moc=g.get("moc")))
            if ts.get("but_chi"):
                g = ts["but_chi"]
                t = v.dong(g["chu"], 24, MUC, 0.85, nghieng=True)
                dat(t, phai=x1 - 0.35, tren=cur - 0.1)
                out += [Phan("so:but", t, "hien", moc=g.get("moc")),
                        Phan("so:but:vong", vong_tay(t, MUC, 2.4, 0.7, 0.14), "ve", moc=g.get("moc"), tre=0.45, rt=0.7)]
        return out

    def ve_khung_cot(self):
        pass


# ------------------------------------------------------------------ t1 t2 t3 b1
class TheTram(Lop):
    """Thẻ trạm: tên trạm lớn, dải sổ cái thu nhỏ 4 ô (cột đang xét tô Devon), các dòng phụ theo lời."""

    def bo_cuc_16x9(self, v):
        L = self._bc(v, False)
        L.update(co_ten=40, o_w=2.55, o_h=0.55, hang=1, co_phu=24)
        return L

    def bo_cuc_9x16(self, v):
        L = self._bc(v, True)
        L.update(co_ten=34, o_w=2.85, o_h=0.5, hang=2, co_phu=21)
        return L

    def ve(self, v):
        L, ts = self.L, self.ts
        ten_s = ("Station %d · %s" % (ts["so"], ts["ten"])) if ts.get("so") else ts["ten"]
        if ten_s not in self.beat.get("labels", []):
            raise AssertionError("tên trạm %r không có trong labels %r" % (ten_s, self.beat.get("labels")))
        ten = v.khoi(ten_s, L["co_ten"], L["w"] - 0.2)
        sang = set(COT) if ts.get("cot_sang") == "all" else {ts.get("cot_sang"), ts.get("cot_sang_2")}
        o = []
        for c in COT:
            t = v.dong(c, 18, MUC, 0.95, nghieng=True)
            r = Rectangle(width=L["o_w"], height=L["o_h"])
            if c in sang:
                r.set_stroke(NHAN, 2.2, 0.95).set_fill(NHAN, 0.28)
            else:
                r.set_stroke(MUC, 1.2, 0.45).set_fill(GIAY, 0)
            t.move_to(r.get_center())
            o.append(VGroup(r, t))
        dai = VGroup(*o).arrange(RIGHT, buff=0.12) if L["hang"] == 1 else \
            VGroup(VGroup(o[0], o[1]).arrange(RIGHT, buff=0.12), VGroup(o[2], o[3]).arrange(RIGHT, buff=0.12)).arrange(DOWN, buff=0.12)
        phu = [v.khoi(g["chu"], L["co_phu"], L["w"] - 0.2, nghieng=True) for g in ts.get("dong_phu", [])]
        tat = VGroup(ten, dai, *phu).arrange(DOWN, buff=0.42)
        for p in phu:
            p.shift(UP * 0.1)
        vua(tat, L["x0"], L["x1"], L["y0"] + 0.1, L["y1"] - 0.05, ORIGIN)
        ke = Line(ten.get_corner(DL) + DOWN * 0.12, ten.get_corner(DR) + DOWN * 0.12).set_stroke(NHAN, 1.8, 0.7)
        out = [Phan("tram:ten", ten, "hien", rt=1.0), Phan("tram:ke", ke, "ve", rt=0.6)]
        for c, m in zip(COT, o):
            out.append(Phan("tram:o:" + c, m, "hien", rt=0.5))
        for i, (g, p) in enumerate(zip(ts.get("dong_phu", []), phu)):
            out.append(Phan("tram:phu:%d" % i, p, "hien", moc=g.get("moc")))
        return out


# ------------------------------------------------------------------ s3 s3a s4a s1a
class ManhTrichDan(Lop):
    """Mảnh trích dẫn dán băng dính (+ dòng mã DOI từ tệp cảnh), ghi chú nghiêng, dòng sổ cái tô đoạn, sơ đồ nhỏ,
    Trái Đất với mũi tên xích đạo và mũi tên gạch chéo 'measured → sum'."""

    def bo_cuc_16x9(self, v):
        L = self._bc(v, False)
        L.update(rong_manh=7.2, co=24, ngang=True)
        return L

    def bo_cuc_9x16(self, v):
        L = self._bc(v, True)
        L.update(rong_manh=L["w"] - 0.6, co=21, ngang=False)
        return L

    def ve(self, v):
        L, ts = self.L, self.ts
        out = []
        if ts.get("tieu_de_trang"):
            t, k = v.tieu_de(ts["tieu_de_trang"])
            out += [Phan("trang:tieu_de", t, "co"), Phan("trang:tieu_de_ke", k, "co")]
        khoi = []   # (Phan..., mobject để xếp)
        for i, g in enumerate(ts.get("manh", [])):
            t = v.khoi(g["chu"], L["co"], L["rong_manh"])
            if g.get("dong_2"):
                d2 = v.chu_hoac_ma(g["dong_2"], 18, "manh.%d.dong_2" % i, mau=MUC, op=0.85)
                t = VGroup(t, d2).arrange(DOWN, aligned_edge=LEFT, buff=0.16)
            m = manh_giay(t)
            khoi.append(m)
            out.append(Phan("manh:%d" % i, m, "hien", moc=g.get("moc")))
        if ts.get("so_do_nho"):
            g = ts["so_do_nho"]
            t = v.khoi(g["chu"], L["co"] - 3, L["rong_manh"])
            m = VGroup(t, the(t, 0.12, NHAN, 0.7))
            khoi.append(m)
            out.append(Phan("manh:so_do", m, "hien", moc=g.get("moc")))
        if ts.get("dong_so_cai"):
            g = ts["dong_so_cai"]
            dau = v.dong(g["cot"], 18, MUC, 0.8, nghieng=True)
            t = v.khoi(g["chu"], L["co"] - 1, L["rong_manh"])
            m = VGroup(dau, t).arrange(DOWN, aligned_edge=LEFT, buff=0.1)
            ke = Line(m.get_corner(DL) + DOWN * 0.1, m.get_corner(DR) + DOWN * 0.1 + RIGHT * 0.3).set_stroke(MUC, 1.1, 0.5)
            nhom = VGroup(m, ke)
            khoi.append(nhom)
            out.append(Phan("manh:so_cai", VGroup(m, ke), "hien", moc=g.get("moc")))
            if g.get("phan_dam"):
                gl = t.lat(g["phan_dam"])
                gd = v.gach_duoi(gl, MAU[g.get("mau_dam", "NHAN")])
                nhom.add(gd)  # vạch đậm dời/co cùng khối (trước: đứng lại chỗ dựng, thành vạch cam lạc ở s3a)
                out.append(Phan("manh:so_cai:dam", gd, "dam", moc=g.get("dam_tai"),
                                glyph=gl, mau=MAU[g.get("mau_dam", "NHAN")], rt=0.6))
        cheo = None
        if ts.get("gach_cheo"):
            g = ts["gach_cheo"]
            a = v.dong(g["tu"], 20, MUC, 0.95, nghieng=True)
            b = v.dong(g["den"], 20, MUC, 0.95)
            ra, rb = the(a, 0.1, NHAN, 0.9, 0.25, mau_nen=NHAN), the(b, 0.12, MUC, 0.8, dam=1.8)
            A, B = VGroup(ra, a), VGroup(rb, b)
            VGroup(A, B).arrange(RIGHT, buff=1.9)
            m = mui(A.get_right() + RIGHT * 0.1, B.get_left() + LEFT * 0.1, MUC, 2.0, 0.85)
            x = gach(Rectangle(width=0.44, height=0.36).move_to(m.get_center()), NHAN, 2.6, 0.95)
            nh = v.dong(g["chu"], 20, MUC, 0.9, nghieng=True)
            nh.next_to(VGroup(A, B), DOWN, buff=0.2)
            cheo = VGroup(A, B, m, x, nh)
            khoi.append(cheo)
            out += [Phan("cheo:ab", VGroup(A, B, m), "hien"), Phan("cheo:x", x, "ve", moc=g.get("moc"), rt=0.5),
                    Phan("cheo:chu", nh, "hien", moc=g.get("moc"), tre=0.35)]
        dat_ = None
        if ts.get("mui_ten_xich_dao"):
            R = 1.05
            tr = Circle(radius=R).set_stroke(MUC, 2.0, 0.9).set_fill(JURA, 0.22)
            xd = ArcBetweenPoints([-R, 0, 0], [R, 0, 0], angle=0.5).set_stroke(MUC, 1.3, 0.6)
            vong = Arc(radius=R * 1.22, start_angle=-0.55, angle=1.25).set_stroke(NHAN, 2.4, 0.95)
            p = vong.get_end()
            tang = np.array([-np.sin(-0.55 + 1.25), np.cos(-0.55 + 1.25), 0])
            dau = mui(p - tang * 0.2, p + tang * 0.02, NHAN, 2.4, 0.95, 0.16)
            dat_ = VGroup(tr, xd, vong, dau)
            out.append(Phan("cheo:trai_dat", dat_, "hien"))
        y1 = L["y1"] if not L["ngang"] else L["y1"]
        cot = VGroup(*khoi).arrange(DOWN, aligned_edge=LEFT, buff=0.4) if khoi else VGroup()
        if ts.get("nghieng"):
            g = ts["nghieng"]
            t = v.khoi(g["chu"], L["co"] - 3, L["rong_manh"], nghieng=True)
            t.next_to(cot, DOWN, buff=0.35, aligned_edge=LEFT) if len(cot) else None
            cot.add(t)
            out.append(Phan("manh:nghieng", t, "hien", moc=g.get("moc")))
        if dat_ is not None:
            if L["ngang"]:
                tat = VGroup(cot, dat_).arrange(RIGHT, buff=1.0, aligned_edge=UP)
            else:
                tat = VGroup(dat_, cot).arrange(DOWN, buff=0.45)
        else:
            tat = cot
        vua(tat, L["x0"] + (0.3 if L["ngang"] else 0), L["x1"] - (0.3 if L["ngang"] else 0), L["y0"] + 0.1, y1 - 0.1,
            LEFT + UP if L["ngang"] else UP)
        if L["ngang"] and dat_ is None:
            tat.shift(RIGHT * 0.4)
        return out


# ------------------------------------------------------------------ s3d
class VachSinhTruong(Lop):
    """Sơ đồ vạch sinh trưởng: so_dai dải × so_vach_mot_dai cung (K3.vach_sinh_truong), ranh giới dải đậm, nhãn có đường dẫn."""

    def bo_cuc_16x9(self, v):
        L = self._bc(v, False)
        L.update(so_do=(0.6, 3.95, L["y0"] + 0.3, L["y1_trai"] - 0.1), nhan=(L["x0"], 0.0), co=21, ngang=True)
        return L

    def bo_cuc_9x16(self, v):
        L = self._bc(v, True)
        L.update(so_do=(-1.2, L["x1"], L["y0"] + 1.9, L["y1"]), nhan=(L["x0"], L["x1"]), co=19, ngang=False)
        return L

    def ve(self, v):
        L, ts = self.L, self.ts
        tam = np.array([*ts["tam"], 0.0])
        r0, r1, n, nd = ts["r0"], ts["r1"], ts["so_vach_mot_dai"], ts["so_dai"]
        goc = ts["goc"] * PI / 180
        dai = VGroup()
        for k in range(nd):
            ra = r0 + (r1 - r0) * k / nd
            rb = r0 + (r1 - r0) * (k + 1) / nd
            dai.add(K3.vach_sinh_truong(tam, ra, rb, n, goc))
        bien = VGroup()
        for k in range(1, nd):
            r = r0 + (r1 - r0) * k / nd
            bien.add(Arc(radius=r, start_angle=PI / 2 - goc / 2, angle=goc, arc_center=tam).set_stroke(MUC, 2.6, 0.85))
        vo = Arc(radius=r1, start_angle=PI / 2 - goc / 2, angle=goc, arc_center=tam).set_stroke(MUC, 3.4, 0.95)
        sd = VGroup(dai, bien, vo)
        x0, x1, y0, y1 = L["so_do"]
        vua(sd, x0, x1, y0, y1, ORIGIN)
        k_ = min((x1 - x0) / sd.width, (y1 - y0) / sd.height)
        sd.scale(k_ * 0.98)
        sd.move_to([(x0 + x1) / 2, (y0 + y1) / 2, 0])
        out = [Phan("vst:dai", dai, "ve", rt=1.4), Phan("vst:bien", bien, "ve", rt=0.6), Phan("vst:vo", vo, "ve", rt=0.6)]
        nh = ts["nhan"]
        neo = [vo.point_from_proportion(0.2), bien[0].point_from_proportion(0.85) if len(bien) else sd.get_center(), None]
        if L["ngang"]:
            nx0, nx1 = L["nhan"][0], x0 - 0.35
            ng = Ngan(L["y0"] + 0.1, L["y1_trai"] - 0.05, 0.3)
            ys = [vo.get_center()[1] + 0.2, sd.get_center()[1] - 0.2, L["y0"] + 0.3]
        else:
            nx0, nx1 = L["nhan"][0], L["nhan"][1]
            ng = Ngan(L["y0"] + 0.05, y0 - 0.15, 0.22)
            ys = [y0 - 0.4, y0 - 1.0, L["y0"] + 0.3]
        for i, g in enumerate(nh):
            t = v.khoi(g["chu"], L["co"] - (3 if g.get("tu_dau") else 0), nx1 - nx0, nghieng=bool(g.get("tu_dau")))
            dat(t, trai=nx0)
            ng.dat(t, ys[i] if i < len(ys) else L["y0"] + 0.3)
            out.append(Phan("vst:nhan:%d" % i, t, "co" if g.get("tu_dau") else "hien", moc=g.get("moc")))
            if i < 2 and neo[i] is not None:
                a = [t.get_right()[0] + 0.1, t.get_center()[1], 0] if L["ngang"] else [t.get_center()[0] * 0 + min(t.get_right()[0], nx1) * 0 +
                                                                                        (t.get_left()[0] + 0.3), t.get_top()[1] + 0.06, 0]
                if not L["ngang"]:
                    a = [min(neo[i][0], t.get_right()[0] - 0.1), t.get_top()[1] + 0.06, 0]
                out.append(Phan("vst:dan:%d" % i, mui(a, neo[i], MUC, 1.4, 0.7, 0.12), "ve", moc=g.get("moc"), tre=0.3, rt=0.5))
        return out


# ------------------------------------------------------------------ s3b s3c s2 s2a s2b k2
class CotDiaTang(Lop):
    """Cột địa tầng: lớp đá (cũ ở dưới) + ô 'today', nhãn cạnh lớp, tuổi ranh giới có vạch sai số, đinh vàng GSSP,
    ngoặc khoảng thời gian, chấm trôi, ô gạch, mảnh trích, câu hỏi kết, tên kênh."""

    def __init__(self, **ts):
        super().__init__(**ts)
        self.goc_ts = None
        if ts.get("giu_cua"):
            self.goc_ts = ke_hoach()["beats"][ts["giu_cua"]]["tham_so"]

    @property
    def lop_ds(self):
        return (self.goc_ts or self.ts)["lop"]

    def _bc_cot(self, v, doc):
        L = self._bc(v, doc)
        base = self.goc_ts or self.ts
        y_duoi = L["y0"] + (0.75 if base.get("ghi_duoi") else 0.15)
        if doc:
            L.update(cx0=L["x0"] + 0.05, cx1=L["x0"] + 1.55, cy0=y_duoi, cy1=L["y1"] - 0.1, trai=None,
                     phai=(L["x0"] + 1.85, L["x1"]), co=18)
        else:
            L.update(cx0=-2.95, cx1=-0.75, cy0=y_duoi, cy1=L["y1_trai"] - 0.15, trai=(L["x0"], -3.2),
                     phai=(-0.45, L["x1"]), co=20)
        return L

    def bo_cuc_16x9(self, v):
        return self._bc_cot(v, False)

    def bo_cuc_9x16(self, v):
        return self._bc_cot(v, True)

    def _dung_lai(self):
        """Beat này dựng lại cột của beat CotDiaTang ngay trước (khác danh sách lớp / ô trên / khoảng trống / ghi dưới):
        nhãn cạnh lớp cũ phải rời trang TRƯỚC khi cột đổi và hộp kỷ mới vào (phiếu 89 Lỗi 2, GĐ 02:22 19/10)."""
        b = self.beat
        if b.get("vao") != "khong" or not b.get("truoc"):
            return False
        P = ke_hoach()["beats"].get(b["truoc"])
        if not P or P.get("canh") != "CotDiaTang":
            return False
        pt = P["tham_so"]
        if pt.get("giu_cua"):
            pt = ke_hoach()["beats"][pt["giu_cua"]]["tham_so"]
        base = self.goc_ts or self.ts
        hinh = lambda q: (q.get("lop"), q.get("o_tren"), bool(q.get("khoang_trong_giua")), bool(q.get("ghi_duoi")))
        return hinh(pt) != hinh(base)

    def _cot(self, v, base, out, phu_lop, t_cot=None):
        """Dựng cột (luôn từ tham số gốc nếu giu_cua) — trả {tên lớp: (y0, y1)} và các mốc biên.
        t_cot: mọi phần của cột đổi/vào cùng một lượt ở giây t_cot (beat dựng lại cột)."""
        L = self.L
        cx0, cx1, cy0, cy1 = L["cx0"], L["cx1"], L["cy0"], L["cy1"]
        lop = base["lop"]
        co_tren = bool(base.get("o_tren"))
        gap = 0.38 if base.get("khoang_trong_giua") else 0.0
        h_tren = 0.42 if co_tren else 0.0
        h = (cy1 - cy0 - h_tren - gap - (0.08 if co_tren else 0)) / len(lop)
        vt, y = {}, cy0
        for i, (ma, ten) in enumerate(lop):
            if base.get("khoang_trong_giua") and i == len(lop) - 1:
                y += gap
            d = K3.lop_da(cx0, cx1, y, y + h, MAU[ma])
            d.set_z_index(-10)
            nh = v.dong(ten, 16, MUC, 0.9, nghieng=True)
            vua(nh, cx0 + 0.06, cx1 - 0.06, y + 0.05, y + h - 0.06, ORIGIN)
            vt[ten] = (y, y + h)
            if phu_lop:
                out.append(Phan("cot:lop:" + ma, d, "doi", tu="phu:" + ma, t=0.0, rt=1.0))
            else:
                out.append(Phan("cot:lop:" + ma, d, "co" if self.goc_ts else "hien", t=t_cot, rt=0.6))
            out.append(Phan("cot:ten:" + ma, nh, "co" if self.goc_ts else "hien", t=t_cot, rt=0.6 if t_cot is not None else 0.5))
            y += h
        if base.get("khoang_trong_giua"):
            yg = vt[lop[-1][1]][0] - gap / 2
            zz = VGroup()
            for dy in (-0.07, 0.07):
                pts = [[cx0 + (cx1 - cx0) * k / 8, yg + dy + (0.05 if k % 2 else -0.05), 0] for k in range(9)]
                zz.add(VMobject().set_points_as_corners(pts).set_stroke(MUC, 1.4, 0.7))
            out.append(Phan("cot:khoang", zz, "ve", t=t_cot, rt=0.6 if t_cot is not None else None))
        if co_tren:
            y += 0.08
            r = Rectangle(width=cx1 - cx0, height=h_tren).move_to([(cx0 + cx1) / 2, y + h_tren / 2, 0]).set_stroke(MUC, 1.4, 0.7)
            t = v.dong(base["o_tren"], 16, MUC, 0.9, nghieng=True).move_to(r.get_center())
            vt[base["o_tren"]] = (y, y + h_tren)
            out.append(Phan("cot:tren", VGroup(r, t), "co" if self.goc_ts else "hien", t=t_cot,
                            rt=0.6 if t_cot is not None else None))
        bien = {}
        names = [t for _, t in lop]
        if "Devonian" in vt:
            bien["day_devon"] = vt["Devonian"][0]
            bien["dinh_devon"] = vt["Devonian"][1]
        return vt, bien

    def ve(self, v):
        L, ts, b = self.L, self.ts, self.beat
        base = self.goc_ts or ts
        out = []
        phu_lop = b.get("vao") == "phu_lop"
        # dựng lại cột: nhãn cũ mờ ra ở 0–0,5 s (khoá nhãn mới khác khoá cũ), cột đổi một lượt 0,5–1,1 s,
        # nhãn mới vào đúng dải ở 1,1 s; không có quãng nào nhãn số đứng cạnh dải của kỷ khác
        dl = self._dung_lai()
        T_COT, T_NHAN = (0.5, 1.1) if dl else (None, None)
        vt, bien = self._cot(v, base, out, phu_lop, T_COT)
        cx0, cx1 = L["cx0"], L["cx1"]
        px0, px1 = L["phai"]
        ngan_phai = Ngan(L["y0"] + 0.05, L["y1"] - 0.02, 0.14)
        ngan_trai = Ngan(L["y0"] + 0.05, L["y1_trai"] - 0.05, 0.14) if L["trai"] else None
        co = L["co"]
        if base.get("tieu_de"):
            t, k = v.tieu_de(base["tieu_de"], 24)
            out += [Phan("trang:tieu_de", t, "co"), Phan("trang:tieu_de_ke", k, "co")]
        # --- tuổi ranh giới (s2; giữ nguyên ở s2a/s2b)
        for i, g in enumerate(base.get("moc_tuoi", [])):
            y = bien[g["bien"]]
            t = v.dong(g["chu"], co, MUC, 1.0)
            if ngan_trai is not None:
                dat(t, phai=L["trai"][1] - 0.3)
                ngan_trai.dat(t, y)
                dan = de_nhe([t.get_right()[0] + 0.06, t.get_center()[1], 0], [cx0 - 0.24, y, 0], 0.55)
            else:
                dat(t, trai=px0 + 0.3)  # dọc: chừa mũi đinh vàng (s2b, k2) cạnh cột; cùng chỗ ở s2/s2a để không nhảy
                ngan_phai.dat(t, y + 0.2)
                dan = de_nhe([t.get_left()[0] - 0.06, t.get_center()[1], 0], [cx1 + 0.04, y, 0], 0.55)
            kieu = "co" if self.goc_ts else "hien"
            out += [Phan("cot:tuoi:%d" % i, t, kieu, moc=None if self.goc_ts else g.get("moc")),
                    Phan("cot:tuoi_dan:%d" % i, dan, "co" if self.goc_ts else "ve", moc=None if self.goc_ts else g.get("moc"), tre=0.2)]
            if base.get("vach_sai_so"):
                ss = float(re.search(r"± ([\d.]+)", g["chu"]).group(1))
                hh = 0.035 + 0.17 * ss / 1.36
                xb = cx0 - 0.13
                vs = VGroup(Line([xb, y - hh, 0], [xb, y + hh, 0]), Line([xb - 0.06, y - hh, 0], [xb + 0.06, y - hh, 0]),
                            Line([xb - 0.06, y + hh, 0], [xb + 0.06, y + hh, 0])).set_stroke(NHAN, 2.2, 0.95)
                out.append(Phan("cot:sai_so:%d" % i, vs, "co" if self.goc_ts else "ve", moc=None if self.goc_ts else g.get("moc"),
                                tre=0.4))
        # --- nhãn cạnh lớp (s3b, s3c)
        nc = sorted([(g, vt[g["lop"]]) for g in ts.get("nhan_canh", [])], key=lambda q: -(q[1][0] + q[1][1]))
        y_day = None
        for g, (y0, y1) in nc:
            yc = (y0 + y1) / 2
            t = v.khoi(g["chu"], co, px1 - px0)
            dat(t, trai=px0)
            # ngang: trần 1,95 của làn phải chỉ để chữ dài không chạm ô PiP; nhãn ngắn (mép phải < khía 4,0) được lên
            # tới đỉnh hộp, để nhãn dải mỏng trên cùng ('today') đứng đúng cạnh dải của nó (phiếu 89 NX79-4)
            if L["x_khia"] is not None and t.get_right()[0] < L["x_khia"] - 0.15:
                ngan_phai.y1 = L["y1_trai"] - 0.05
            ngan_phai.dat(t, yc if y_day is None else min(yc, y_day - ngan_phai.gap - t.height / 2))
            ngan_phai.y1 = L["y1"] - 0.02
            y_day = t.get_bottom()[1]
            dan = de_nhe([t.get_left()[0] - 0.06, t.get_center()[1], 0], [cx1 + 0.04, yc, 0], 0.5)
            if not (y0 - 1e-3 <= t.get_center()[1] <= y1 + 1e-3):
                print("NHAN_LECH_DAI %s %s tam %.2f ngoai dai %.2f..%.2f" % (b["id"], g["lop"], t.get_center()[1], y0, y1))
            if dl:
                k = "cot:nhan_moi:" + g["lop"]
                t_n = None if g.get("moc") else T_NHAN
                out += [Phan(k + ":dan", dan, "hien", moc=g.get("moc"), t=t_n, rt=0.5),
                        Phan(k, t, "hien", moc=g.get("moc"), t=t_n, rt=0.5)]
                continue
            k = "cot:nhan:" + g["lop"]
            kieu = "co" if g.get("tu_dau") else "hien"
            out += [Phan(k + ":dan", dan, kieu, moc=g.get("moc")), Phan(k, t, kieu, moc=g.get("moc"))]
        if ts.get("ghi_duoi"):
            g = ts["ghi_duoi"]
            t = v.khoi(g["chu"], co - 1, L["w"] - 0.2, nghieng=True)
            dat(t, trai=L["x0"] + (0.0 if L["doc"] else 0.0), tren=L["cy0"] - 0.18)
            out.append(Phan("cot:ghi_duoi", t, "hien", moc=g.get("moc")))
        # --- đinh vàng GSSP (s2b, k2)
        dinh_chu = {}
        for i, g in enumerate(ts.get("dinh_vang", [])):
            y = bien[g["bien"]]
            dv = Polygon([cx1 + 0.02, y, 0], [cx1 + 0.3, y + 0.09, 0], [cx1 + 0.3, y - 0.09, 0]).set_fill(NHAN, 1).set_stroke(MUC, 1, 0.8)
            t = v.khoi(g["chu"], co - 1, px1 - px0 - 0.25)
            dat(t, trai=px0 + 0.2)
            ngan_phai.dat(t, y)
            dinh_chu[g["bien"]] = t
            dan = de_nhe([t.get_left()[0] - 0.06, t.get_center()[1], 0], [cx1 + 0.32, y, 0], 0.5)
            kieu = "co" if g.get("tu_dau") else "hien"
            out += [Phan("cot:dinh:%d" % i, dv, kieu, moc=g.get("moc")), Phan("cot:dinh_chu:%d" % i, VGroup(dan, t), kieu,
                                                                              moc=g.get("moc"), tre=0.2)]
        # --- s2a
        if ts.get("ngoac_dung"):
            g = ts["ngoac_dung"]
            y0, y1 = vt[g["lop"]]
            n = ngoac_doc(cx1 + 0.12, y0 + 0.03, y1 - 0.03, 0.14, 1, NHAN, 2.0, 0.95)
            t = v.dong(g["chu"], co, NHAN, 1.0)
            dat(t, trai=px0 + 0.15)
            ngan_phai.dat(t, (y0 + y1) / 2)
            out += [Phan("cot:ngoac", n, "ve", moc=g.get("moc")), Phan("cot:ngoac_chu", t, "hien", moc=g.get("moc"), tre=0.3)]
        if ts.get("cham_troi"):
            g = ts["cham_troi"]
            y0, y1 = vt["Devonian"]
            ch = Circle(radius=0.075).set_fill(MUC, 0.9).set_stroke(MUC, 1, 0.9).move_to([cx1 - 0.3, y0 + (y1 - y0) * 0.68, 0])
            hoi = v.dong("?", 20, MUC, 0.95).next_to(ch, RIGHT, buff=0.06)
            t = v.khoi(g["chu"], co - 1, px1 - px0 - 0.2, nghieng=True)
            dat(t, trai=px0 + 0.15)
            ngan_phai.dat(t, ch.get_center()[1] + 0.35)
            dan = de_nhe([t.get_left()[0] - 0.06, t.get_center()[1], 0], ch.get_center() + RIGHT * 0.09, 0.5)
            out.append(Phan("cot:cham", VGroup(ch, hoi, dan, t), "co" if g.get("tu_dau") else "hien", moc=g.get("moc")))
        if ts.get("o_gach"):
            g = ts["o_gach"]
            t = v.dong(g["chu"], co + 2, MUC, 1.0)
            r = the(t, 0.16, MUC, 0.8, dam=1.6)
            m = VGroup(r, t)
            dat(m, trai=px0 + 0.15)
            ngan_phai.dat(m, L["y0"] + 0.6)
            out += [Phan("cot:o_gach", m, "hien", moc=g.get("moc")), Phan("cot:o_gach_x", gach(r, NHAN, 2.2, 0.9), "ve",
                                                                           moc=g.get("moc"), tre=0.45, rt=0.5)]
        # --- s2b
        if ts.get("manh"):
            g = ts["manh"]
            neo = dinh_chu.get("dinh_devon")
            if L["doc"]:
                rong = min(px1 - px0 - 0.3, L["x1"] - px0 - 0.45)
                for _ in range(4):
                    t = v.khoi(g["chu"], co - 3, rong)
                    m = manh_giay(t, 0.12)
                    dat(m, trai=px0 + 0.1)
                    du = m.get_right()[0] - (L["x1"] - 0.02)
                    if du <= 0:
                        break
                    rong -= du + 0.05
                ngan_phai.dat(m, L["y1"] - 0.02 - m.height / 2)
            else:
                t = v.khoi(g["chu"], co - 2, px1 - px0 - 0.6)
                m = manh_giay(t, 0.18)
                dat(m, trai=px0 + 0.15)
                ngan_phai.dat(m, (neo.get_bottom()[1] - 0.16 - m.height / 2) if neo is not None else
                              (L["y0"] + 0.4 + m.height / 2))
            out.append(Phan("cot:manh", m, "hien", moc=g.get("moc")))
        if ts.get("nghieng"):
            g = ts["nghieng"]
            t = v.khoi(g["chu"], co - 1, px1 - px0 - 0.2, nghieng=True)
            dat(t, trai=px0 + 0.15)
            ngan_phai.dat(t, L["y0"] + 0.2)
            out.append(Phan("cot:nghieng", t, "hien", moc=g.get("moc")))
        # --- k2
        if ts.get("cau_hoi"):
            g = ts["cau_hoi"]
            t = v.khoi(g["chu"], co + 6, px1 - px0 - 0.2)
            dat(t, trai=px0 + 0.15)
            ngan_phai.dat(t, L["y1"] - 0.3 - t.height / 2 - (0.0 if L["doc"] else 0.0))
            out.append(Phan("cot:hoi", t, "hien", moc=g.get("moc")))
        if ts.get("so_sanh_sai_so"):
            g = ts["so_sanh_sai_so"]
            t = v.khoi(g["chu"], co, px1 - px0 - 1.1)
            vs = VGroup()
            for j, ss in enumerate((1.36, 0.19)):
                hh = 0.035 + 0.17 * ss / 1.36
                xb = j * 0.32
                vs.add(VGroup(Line([xb, -hh, 0], [xb, hh, 0]), Line([xb - 0.06, -hh, 0], [xb + 0.06, -hh, 0]),
                              Line([xb - 0.06, hh, 0], [xb + 0.06, hh, 0])).set_stroke(NHAN, 2.2, 0.95))
            m = VGroup(vs, t).arrange(RIGHT, buff=0.35)
            dat(m, trai=px0 + 0.15)
            ngan_phai.dat(m, (L["y0"] + L["y1"]) / 2 - 0.3)
            out.append(Phan("cot:so_sanh", m, "hien", moc=g.get("moc")))
        if ts.get("ten_kenh"):
            t = v.dong(ts["ten_kenh"], 34, NHAN, 1.0, nghieng=True)
            dat(t, trai=px0 + 0.15)
            ngan_phai.dat(t, L["y0"] + 0.35)
            out.append(Phan("cot:ten_kenh", t, "hien", t=max(0.5, b["dur"] - 2.6), rt=1.2))
        return out


# ------------------------------------------------------------------ s5 s5a s6c
def mat_dong_ho(R):
    g = VGroup(Circle(radius=R).set_stroke(MUC, 1.8, 0.75))
    for a in (0.0, PI / 2, PI, 3 * PI / 2):
        u = np.array([np.cos(a), np.sin(a), 0])
        g.add(Line(u * R * 0.9, u * R).set_stroke(MUC, 1.6, 0.7))
    return g


def cung_gio(R, h, mau=MUC, dam=7, op=0.85, r_k=0.8):
    return Arc(radius=R * r_k, start_angle=PI / 2, angle=-TAU * min(h, 24) / 24).set_stroke(mau, dam, op)


class PhepChia(Lop):
    """Phép chia giờ trong năm cho số vạch: tử số, số chia + chồng lớp mỏng, đồng hồ cung giờ (24 h → kết quả)."""

    def bo_cuc_16x9(self, v):
        L = self._bc(v, False)
        L.update(ngang=True, R=1.25, co=26)
        return L

    def bo_cuc_9x16(self, v):
        L = self._bc(v, True)
        L.update(ngang=False, R=0.95, co=22, R_ben=1.05)
        return L

    def _gio(self, s):
        return float(re.search(r"[\d.]+", s).group())

    def _trai(self, v, w_hu, w_chia):
        """Tử số + số chia (chồng lớp mỏng) + gạch phân số; trả (nhóm, các Phan)."""
        L, ts = self.L, self.ts
        co = L["co"]
        trai, ph, hu_moc = VGroup(), [], None
        if ts.get("hu"):
            g = ts["hu"]
            hu = v.khoi(g["chu"], co, w_hu)
            trai.add(hu)
            ph.append(Phan("ph:hu", hu, "co" if g.get("tu_dau") else "hien", moc=g.get("moc")))
            hu_moc = g.get("moc")
        if ts.get("so_coc"):
            nc = ts["nhan_chia"]
            nc_s = nc["chu"] if isinstance(nc, dict) else nc
            t = v.khoi(nc_s, co - 2, w_chia)
            coc = VGroup()
            for k in range(8):
                coc.add(Rectangle(width=0.8, height=0.07).set_stroke(MUC, 0.8, 0.6).set_fill(NHAN, 0.25 + 0.05 * (k % 2))
                        .move_to([0.03 * np.sin(k * 1.3), k * 0.085, 0]))
            dong = VGroup(coc, t).arrange(RIGHT, buff=0.3)
            trai.add(dong)
            if isinstance(nc, dict):
                ph.append(Phan("ph:chia", dong, "hien", moc=nc.get("moc")))
            else:
                ph.append(Phan("ph:chia", dong, "hien", moc=hu_moc, tre=0.7))
        if len(trai):
            trai.arrange(DOWN, aligned_edge=LEFT, buff=0.35)
            if len(trai) == 2:
                gach_ph = Line(trai[0].get_corner(DL) + DOWN * 0.17, trai[0].get_corner(DR) + DOWN * 0.17 + RIGHT * 0.2)
                gach_ph.set_stroke(MUC, 1.6, 0.7)
                ph.append(Phan("ph:gach", gach_ph, "ve", moc=hu_moc, tre=0.5) if not ts["hu"].get("tu_dau") else
                          Phan("ph:gach", gach_ph, "co"))
                trai.add(gach_ph)
        return trai, ph

    def _dh(self, v, dh_ds, R, co):
        """Mặt đồng hồ + cung giờ đầu + số giờ (số co theo vòng, không tràn mặt)."""
        dhs, cung_moi = VGroup(), []
        for ten, h0, s0, h1, s1 in dh_ds:
            mat = mat_dong_ho(R)
            c0 = cung_gio(R, h0)
            so0 = v.dong(s0, co - 4, MUC, 0.95)
            if so0.width > 1.35 * R:
                so0.scale(1.35 * R / so0.width)
            dhs.add(VGroup(mat, c0, so0))
            cung_moi.append((ten, mat, c0, so0, h1, s1))
        if len(dhs):
            dhs.arrange(RIGHT, buff=0.9)
        return dhs, cung_moi

    def ve(self, v):
        L, ts = self.L, self.ts
        out = []
        co, R = L["co"], L["R"]
        trai, ph_trai = self._trai(v, (L["w"] * 0.55) if L["ngang"] else L["w"] - 0.2,
                                   (L["w"] * 0.5) if L["ngang"] else L["w"] - 1.3)
        # đồng hồ
        dh_ds = []
        g = ts.get("dong_ho", {})
        hai = ts.get("hai_dong_ho")
        if hai:
            dh_ds = [("a", self._gio(g["tu"]), g["tu"], None, None), ("b", self._gio(g["den"]), g["den"], None, None)]
        elif g:
            dh_ds = [("a", self._gio(g["tu"]), g["tu"], self._gio(g["den"]), g["den"])]
        R_dh = R
        dhs, cung_moi = self._dh(v, dh_ds, R, co)
        nhan_dh = None
        if g.get("chu") and not hai:
            nhan_dh = v.khoi(g["chu"], co - 2, (L["w"] * 0.42) if L["ngang"] else L["w"] - 0.2)
        y_tren = L["y1"] - 0.1
        duoi = []
        for k in ("hieu", "so_sanh", "nghieng"):
            if ts.get(k):
                gg = ts[k]
                t = v.khoi(gg["chu"], co - 4 if k == "nghieng" else co - 3, L["w"] - 0.2, nghieng=(k == "nghieng"))
                duoi.append((k, gg, t))
        chua = (0.35 + sum(t.height for _, _, t in duoi) + 0.22 * (len(duoi) - 1) + 0.05) if duoi else 0.1
        # bố cục
        if L["ngang"]:
            phai = VGroup(dhs, *( [nhan_dh] if nhan_dh else [])).arrange(DOWN, buff=0.3) if len(dhs) else VGroup()
            tat = VGroup(*[m for m in (trai, phai) if len(m)]).arrange(RIGHT, buff=1.0, aligned_edge=UP)
        else:
            tat = VGroup(*[m for m in (trai, dhs) if len(m)], *([nhan_dh] if nhan_dh else [])).arrange(DOWN, buff=0.4,
                                                                                                       aligned_edge=LEFT)
            if len(dhs):
                dhs.set_x((L["x0"] + L["x1"]) / 2)
            # chồng dọc mà phải co mạnh (phân số + 1 đồng hồ) thì đặt đồng hồ cạnh phân số, chọn cách ít co hơn
            hop_w, hop_h = L["x1"] - L["x0"] - 0.2, y_tren - L["y0"] - chua
            k_doc = min(1.0, hop_w / tat.width, hop_h / tat.height)
            if len(trai) and len(dhs) == 1 and k_doc < 0.9:
                R2 = L.get("R_ben", 1.05)
                w2 = hop_w - 2 * R2 - 0.6
                trai2, ph2 = self._trai(v, w2, w2 - 1.1)
                dhs2, cm2 = self._dh(v, dh_ds, R2, co)
                nh2 = v.khoi(g["chu"], co - 2, w2) if nhan_dh is not None else None
                cot = VGroup(trai2, *([nh2] if nh2 is not None else [])).arrange(DOWN, buff=0.35, aligned_edge=LEFT)
                tat2 = VGroup(cot, dhs2).arrange(RIGHT, buff=0.5)
                k_ben = min(1.0, hop_w / tat2.width, hop_h / tat2.height)
                if k_ben > k_doc + 0.05:
                    print("BO_CUC phep_chia %s ben_canh k %.2f (chong doc %.2f)" % (self.beat["id"], k_ben, k_doc))
                    trai, ph_trai, dhs, cung_moi, nhan_dh, tat, R_dh = trai2, ph2, dhs2, cm2, nh2, tat2, R2
        out += ph_trai
        vua(tat, L["x0"] + 0.1, L["x1"] - 0.1, L["y0"] + chua, y_tren, UP)
        for ten, mat, c0, so0, h1, s1 in cung_moi:
            moc = g.get("moc") if not hai else None
            out += [Phan("ph:dh:%s:mat" % ten, mat, "co" if hai else "hien"),
                    Phan("ph:dh:%s:cung0" % ten, c0, "co" if hai else "ve", rt=0.8),
                    Phan("ph:dh:%s:so0" % ten, so0, "co" if hai else "hien")]
            if h1 is not None:
                Rr = mat[0].width / 2
                ctr = mat.get_center()
                so1 = v.dong(s1, co - 4, MUC, 0.95)
                so1.scale(Rr / R_dh)
                if so1.width > 1.35 * Rr:
                    so1.scale(1.35 * Rr / so1.width)
                so1.move_to(so0.get_center())
                if h1 <= 24:
                    c1 = cung_gio(Rr, h1).shift(ctr)
                    out += [Phan("ph:dh:%s:cung" % ten, c1, "doi", tu="ph:dh:%s:cung0" % ten, moc=moc, rt=1.2)]
                else:
                    c1 = cung_gio(Rr, h1 - 24, NHAN, 7, 0.95, 0.62).shift(ctr)
                    out += [Phan("ph:dh:%s:vuot" % ten, c1, "ve", moc=moc, rt=0.9)]
                out.append(Phan("ph:dh:%s:so" % ten, so1, "doi", tu="ph:dh:%s:so0" % ten, moc=moc, tre=0.1))
        if nhan_dh is not None:
            out.append(Phan("ph:dh:nhan", nhan_dh, "hien", moc=g.get("moc"), tre=0.5))
        if hai and len(cung_moi) == 2:
            _, mat_b, c_b, _, _, _ = cung_moi[1]
            Rr = mat_b[0].width / 2
            con = Arc(radius=Rr * 0.8, start_angle=PI / 2 - TAU * self._gio(g["den"]) / 24,
                      angle=-TAU * (24 - self._gio(g["den"])) / 24)
            con = DashedVMobject(con.shift(mat_b.get_center()).set_stroke(NHAN, 6, 0.95), num_dashes=6)
            out.append(Phan("ph:dh:thieu", con, "ve", moc=ts.get("hieu", {}).get("moc"), rt=0.6))
        if ts.get("goc_trang"):
            g2 = ts["goc_trang"]
            a = v.goc(g2["tu"])
            b = v.goc(g2["den"])
            out += [Phan("trang:goc0", a, "hien"), Phan("trang:goc", b, "doi", tu="trang:goc0", moc=g.get("moc"), tre=0.9)]
        y = tat.get_bottom()[1] - 0.35
        for k, gg, t in duoi:
            dat(t, trai=L["x0"] + 0.1, tren=y)
            y = t.get_bottom()[1] - 0.22
            out.append(Phan("ph:" + k, t, "hien", moc=gg.get("moc")))
            if t.get_bottom()[1] < L["y0"] - 1e-3:
                print("NGOAI_VUNG phep_chia %s %s tran %.2f" % (self.beat["id"], k, L["y0"] - t.get_bottom()[1]))
        return out


# ------------------------------------------------------------------ s6
class DoNhay(Lop):
    """Độ nhạy: công thức (khoanh phần giữ cố định), ba dòng nếu 399/400/401, ngoặc '1 vạch ≈ … phút'."""

    def bo_cuc_16x9(self, v):
        L = self._bc(v, False)
        L.update(ngang=True, co=26)
        return L

    def bo_cuc_9x16(self, v):
        L = self._bc(v, True)
        L.update(ngang=False, co=22)
        return L

    def ve(self, v):
        L, ts = self.L, self.ts
        out = []
        co = L["co"]
        kh = ts["khoanh"]
        o_goc = tach_mu(kh["o"])[0]   # phiếu 79 Lỗi 6: "365.242 d³ × 24 h" mang số chú thích ³ (NASA); chỉ số glyph theo chuỗi gốc
        ct = v.dong(kh["o"] + " ÷ lines per band", co, MUC, 1.0)
        if ct.ok:
            n0 = len(o_goc)
            x_cat = ct.goc[n0 - 1].get_right()[0]
            for q in ct.goc[n0:]:
                q.shift(RIGHT * 0.4)
            for q in ct.mu:
                if q.get_left()[0] > x_cat:
                    q.shift(RIGHT * 0.4)
        vua(ct, L["x0"] + 0.3, L["x1"] - 0.3, 0, 10, LEFT)
        dat(ct, trai=L["x0"] + 0.35, tren=L["y1"] - 0.25)
        gl = ct.lat(o_goc)
        vong = vong_tay(VGroup(*gl), MUC, 2.6, 0.8, 0.18)
        nh = v.dong(kh["chu"], co - 6, MUC, 0.9, nghieng=True)
        dat(nh, trai=VGroup(*gl).get_left()[0], tren=vong.get_bottom()[1] - 0.08)
        out += [Phan("dn:cong_thuc", ct, "hien"), Phan("dn:vong", vong, "ve", moc=kh.get("moc"), rt=0.8),
                Phan("dn:vong_chu", nh, "hien", moc=kh.get("moc"), tre=0.4)]
        dong = []
        for g in ts["dong"]:
            t = v.dong(g["chu"], co, MUC, 1.0)
            dong.append(t)
        cot = VGroup(*dong).arrange(DOWN, aligned_edge=LEFT, buff=0.32)
        dat(cot, trai=L["x0"] + (1.2 if L["ngang"] else 0.4), tren=nh.get_bottom()[1] - 0.45)
        for i, (g, t) in enumerate(zip(ts["dong"], dong)):
            out.append(Phan("dn:dong:%d" % i, t, "co" if g.get("tu_dau") else "hien", moc=g.get("moc"), tre=0.25 * (i // 2)))
        g = ts["ngoac"]
        n = ngoac_doc(cot.get_right()[0] + 0.25, cot.get_bottom()[1], cot.get_top()[1], 0.16, 1, NHAN, 2.0, 0.95)
        t = v.khoi(g["chu"], co - 2, (L["x1"] - n.get_right()[0] - 0.4) if L["ngang"] else L["w"] - 0.4)
        if L["ngang"]:
            dat(t, trai=n.get_right()[0] + 0.3, y=cot.get_center()[1])
        else:
            dat(t, trai=L["x0"] + 0.4, tren=cot.get_bottom()[1] - 0.35)
        out += [Phan("dn:ngoac", n, "ve", moc=g.get("moc")), Phan("dn:ngoac_chu", t, "hien", moc=g.get("moc"), tre=0.3)]
        return out


# ------------------------------------------------------------------ s6b
class BacThangDongHo(Lop):
    """Bậc thang giờ: mỗi kỳ một thanh màu ICS, chiều dài ∝ số giờ trên 21 h (tính), nhãn 'if N: h'."""

    def bo_cuc_16x9(self, v):
        L = self._bc(v, False)
        L.update(ngang=True, co=20)
        return L

    def bo_cuc_9x16(self, v):
        L = self._bc(v, True)
        L.update(ngang=False, co=18)
        return L

    def ve(self, v):
        L, ts = self.L, self.ts
        out = []
        co = L["co"]
        g = ts["ghi_chu"]
        gc = v.khoi(g["chu"], co - 1, L["w"] - 0.3, nghieng=True)
        dat(gc, trai=L["x0"] + 0.15, duoi=L["y0"] + 0.1)
        bac = ts["bac"]
        gio = [float(re.search(r"([\d.]+) h$", x["chu"]).group(1)) for x in bac]
        if L["ngang"]:
            y_day = gc.get_top()[1] + 0.75
            Hmax = L["y1"] - 0.2 - y_day
            k = Hmax / max(h - 21 for h in gio)
            n = len(bac)
            buoc = (L["w"] - 0.6) / n
            day = Line([L["x0"] + 0.2, y_day, 0], [L["x1"] - 0.2, y_day, 0]).set_stroke(MUC, 1.4, 0.7)
            out.append(Phan("bt:day", day, "co"))
            for i, (x, h) in enumerate(zip(bac, gio)):
                xc = L["x0"] + 0.3 + buoc * (i + 0.5)
                r = Rectangle(width=min(1.2, buoc * 0.5), height=(h - 21) * k).set_fill(MAU[x["ky"]], K3.TO_KY).set_stroke(MUC, 2.5, 1)
                dat(r, x=xc, duoi=y_day)
                t = v.dong(x["chu"], co, MUC, 1.0)
                vua(t, xc - buoc / 2 + 0.05, xc + buoc / 2 - 0.05, 0, 5)
                dat(t, x=xc, tren=y_day - 0.12)
                kieu = "co" if x.get("tu_dau") else "hien"
                out += [Phan("bt:thanh:%d" % i, r, kieu, moc=x.get("moc"), rt=0.7), Phan("bt:chu:%d" % i, t, kieu, moc=x.get("moc"),
                                                                                          tre=0.2)]
        else:
            n = len(bac)
            nhan = [v.dong(x["chu"], co, MUC, 1.0) for x in bac]
            wl = max(t.width for t in nhan)
            x_day = L["x0"] + wl + 0.35
            y_top = L["y1"] - 0.2
            y_bot = gc.get_top()[1] + 0.35
            buoc = (y_top - y_bot) / n
            Wmax = L["x1"] - 0.15 - x_day
            k = Wmax / max(h - 21 for h in gio)
            day = Line([x_day, y_bot, 0], [x_day, y_top, 0]).set_stroke(MUC, 1.4, 0.7)
            out.append(Phan("bt:day", day, "co"))
            for i, (x, h, t) in enumerate(zip(bac, gio, nhan)):
                yc = y_bot + buoc * (i + 0.5)
                r = Rectangle(width=(h - 21) * k, height=min(0.55, buoc * 0.55)).set_fill(MAU[x["ky"]], K3.TO_KY).set_stroke(MUC, 2.5, 1)
                dat(r, trai=x_day, y=yc)
                dat(t, phai=x_day - 0.15, y=yc)
                kieu = "co" if x.get("tu_dau") else "hien"
                out += [Phan("bt:thanh:%d" % i, r, kieu, moc=x.get("moc"), rt=0.7), Phan("bt:chu:%d" % i, t, kieu, moc=x.get("moc"),
                                                                                          tre=0.2)]
        out.append(Phan("bt:ghi", gc, "hien", moc=g.get("moc")))
        return out


# ------------------------------------------------------------------ s1 s1b
class SoDoLaser(Lop):
    """Phác Trái Đất – Mặt Trăng (không theo tỉ lệ): bán trục lớn đọc dọc đường nối tâm, thẻ cột 'measured',
    ô 'not in the sum', ô sai số phóng to, ô trống."""

    def bo_cuc_16x9(self, v):
        L = self._bc(v, False)
        L.update(ngang=True, td=(-5.0, 0.9), R=0.95, tt=(1.3, 0.9), r=0.32, co=20)
        return L

    def bo_cuc_9x16(self, v):
        L = self._bc(v, True)
        L.update(ngang=False, td=(L["x0"] + 0.85, L["y1"] - 0.9), R=0.72, tt=(L["x1"] - 0.45, L["y1"] - 0.9), r=0.26, co=18)
        return L

    def ve(self, v):
        L, ts = self.L, self.ts
        out = []
        co = L["co"]
        td = np.array([*L["td"], 0.0])
        tt = np.array([*L["tt"], 0.0])
        R, r = L["R"], L["r"]
        dat_ = VGroup(Circle(radius=R).set_stroke(MUC, 2.0, 0.9).set_fill(JURA, 0.22),
                      ArcBetweenPoints([-R, 0, 0], [R, 0, 0], angle=0.5).set_stroke(MUC, 1.2, 0.5)).move_to(td)
        trang = Circle(radius=r).set_stroke(MUC, 1.8, 0.9).set_fill(MUC, 0.08).move_to(tt)
        noi = DashedLine(td + RIGHT * (R + 0.08), tt + LEFT * (r + 0.08), dash_length=0.12).set_stroke(MUC, 1.5, 0.65)
        out += [Phan("ld:dat", dat_, "co"), Phan("ld:trang", trang, "co"), Phan("ld:noi", noi, "co")]
        g = ts["thuoc"]
        t = v.khoi(g["chu"], co, noi.get_length() + (0.4 if L["ngang"] else 0.3))
        dat(t, x=noi.get_center()[0], duoi=noi.get_center()[1] + 0.14) if L["ngang"] else dat(t, x=noi.get_center()[0], tren=noi.get_center()[1] - 0.14)
        if L["ngang"] and t.get_left()[0] < td[0] + R + 0.05:
            pass
        out.append(Phan("ld:thuoc", t, "co" if g.get("tu_dau") else "hien", moc=g.get("moc")))
        y_duoi = min(dat_.get_bottom()[1], t.get_bottom()[1], trang.get_bottom()[1])
        if ts.get("nhan_ve"):
            nv = v.dong(ts["nhan_ve"], co - 5, MUC, 0.75, nghieng=True)
            dat(nv, x=td[0] if L["ngang"] else (L["x0"] + L["x1"]) / 2, tren=y_duoi - 0.15)
            if not L["ngang"]:
                dat(nv, trai=L["x0"] + 0.05)
            out.append(Phan("ld:nhan_ve", nv, "hien"))
            y_duoi = nv.get_bottom()[1]
        # thẻ cột
        cot_s = ts.get("cot")
        if cot_s:
            ds = [s for s in self.thua if s.startswith(cot_s + " ")]
            s = ds[0] if ds else cot_s
            a = v.dong(s, co - 1, MUC, 0.95, nghieng=True)
            ra = the(a, 0.1, NHAN, 0.9, 0.25, mau_nen=NHAN)
            tag = VGroup(ra, a)
            if L["ngang"]:
                dat(tag, trai=tt[0] + r + 0.45, y=tt[1])
                if tag.get_right()[0] > L["x1"]:
                    dat(tag, phai=L["x1"])
            else:
                y_tag = min(t.get_bottom()[1], trang.get_bottom()[1])
                if ts.get("phong_sai_so"):
                    gk = VGroup(*t.lat("± 0.08"))
                    y_tag = min(y_tag, gk.get_center()[1] - max(gk.width, gk.height) / 2 - 0.1)
                dat(tag, phai=L["x1"], tren=y_tag - 0.12)
                if ts.get("nhan_ve") or tag.get_left()[0] < dat_.get_right()[0] + 0.15:
                    dat(tag, phai=L["x1"], tren=y_duoi - 0.2)
            out.append(Phan("ld:cot", tag, "hien"))
            y_duoi = min(y_duoi, tag.get_bottom()[1])
        else:
            tag = None
        if ts.get("o_sum"):
            g = ts["o_sum"]
            s_ = v.dong("sum", co + 2, MUC, 1.0)
            rs = the(s_, 0.16, MUC, 0.8, dam=1.8)
            box = VGroup(rs, s_)
            nh = v.dong(g["chu"], co - 1, MUC, 0.9, nghieng=True)
            if L["ngang"]:
                dat(box, x=tag.get_center()[0] if tag else 4.8, tren=min(tag.get_bottom()[1] if tag else 0, y_duoi) - 1.0)
            else:
                dat(box, x=(L["x0"] + L["x1"]) / 2 + 1.2, tren=y_duoi - 1.0)
            nh.next_to(box, DOWN, buff=0.15)
            m = mui(tag.get_bottom() + DOWN * 0.08, box.get_top() + UP * 0.08, MUC, 1.8, 0.8) if tag else VGroup()
            x = gach(Rectangle(width=0.4, height=0.3).move_to(m.get_center()), NHAN, 2.6, 0.95)
            out += [Phan("ld:sum", box, "hien", moc=g.get("moc")), Phan("ld:sum_mui", m, "ve", moc=g.get("moc"), tre=0.3, rt=0.5),
                    Phan("ld:sum_x", x, "ve", moc=g.get("moc"), tre=0.6, rt=0.4), Phan("ld:sum_chu", nh, "hien", moc=g.get("moc"), tre=0.6)]
        if ts.get("nhan_nay"):
            g = ts["nhan_nay"]
            t2 = v.dong(g["chu"], co - 1, MUC, 0.95, nghieng=True)
            if L["ngang"]:
                dat(t2, x=tt[0], duoi=tt[1] + r + 0.25)
                if t2.get_right()[0] > 3.95:
                    dat(t2, phai=3.95)
            else:
                dat(t2, phai=L["x1"], duoi=tt[1] + r + 0.12)
                if t2.get_top()[1] > L["y1"]:
                    dat(t2, phai=L["x1"], tren=y_duoi - 0.15)
                    y_duoi = t2.get_bottom()[1]
            out.append(Phan("ld:nay", t2, "hien", moc=g.get("moc")))
        if ts.get("phong_sai_so"):
            g = ts["phong_sai_so"]
            gl = t.lat("± 0.08")
            kinh = Circle(radius=max(VGroup(*gl).width, VGroup(*gl).height) / 2 + 0.1).move_to(VGroup(*gl).get_center())
            kinh.set_stroke(NHAN, 2.0, 0.9)
            hh = 0.35
            vs = VGroup(Line([0, -hh, 0], [0, hh, 0]), Line([-0.12, -hh, 0], [0.12, -hh, 0]), Line([-0.12, hh, 0], [0.12, hh, 0]),
                        Circle(radius=0.05).set_fill(MUC, 1)).set_stroke(MUC, 2.0, 0.9)
            nh = v.dong(g["chu"], co - 1, MUC, 1.0)
            m = VGroup(vs, nh).arrange(RIGHT, buff=0.3)
            khung = the(m, 0.2, NHAN, 0.8, dam=1.6)
            o = VGroup(khung, m)
            if L["ngang"]:
                dat(o, trai=L["x0"] + 0.2, tren=y_duoi - 0.3)
            else:
                dat(o, trai=L["x0"] + 0.05, tren=y_duoi - 0.15)
            if L["ngang"]:
                dan = de_nhe(kinh.get_bottom(), khung.get_top(), 0.55)
            else:
                dan = de_nhe(kinh.get_center() + (DOWN + LEFT) * (kinh.width / 2 * 0.7071),
                             [khung.get_left()[0] + 0.6, khung.get_top()[1], 0], 0.55)
            out += [Phan("ld:kinh", kinh, "ve", moc=g.get("moc"), rt=0.5),
                    Phan("ld:sai_so_dan", dan, "hien", moc=g.get("moc"), tre=0.3),
                    Phan("ld:sai_so", o, "hien", moc=g.get("moc"), tre=0.3)]
            y_o = o.get_bottom()[1]
            x_o = o.get_right()[0]
        else:
            y_o, x_o = y_duoi, L["x0"]
        if ts.get("o_trong"):
            g = ts["o_trong"]
            nh = v.khoi(g["chu"], co - 1, (L["x1"] - x_o - 2.0) if L["ngang"] else L["w"] - 1.4, nghieng=True)
            r_ = Rectangle(width=0.9, height=0.6).set_stroke(MUC, 1.6, 0.8)
            m = VGroup(r_, nh).arrange(RIGHT, buff=0.3)
            if L["ngang"]:
                dat(m, trai=x_o + 0.6, tren=y_duoi - 0.3)
            else:
                dat(m, trai=L["x0"] + 0.05, tren=y_o - 0.2)
            out.append(Phan("ld:o_trong", m, "hien", moc=g.get("moc")))
        return out


# ------------------------------------------------------------------ s8
class HaiHop(Lop):
    """Hai hộp lưu trữ đóng nắp (không mở, không gì đi ra), vòng khoanh bút chì, nhãn hộp, ghi chú lề trái, ghi chú nghiêng."""

    def bo_cuc_16x9(self, v):
        L = self._bc(v, False)
        L.update(ngang=True, hop=(2.7, 1.55), co=20)
        return L

    def bo_cuc_9x16(self, v):
        L = self._bc(v, True)
        L.update(ngang=False, hop=(2.3, 1.3), co=18)
        return L

    def ve(self, v):
        L, ts = self.L, self.ts
        out = []
        co = L["co"]
        w, h = L["hop"]
        hops = VGroup()
        for k in range(2):
            than = Rectangle(width=w, height=h).set_fill(NHAN, 0.2).set_stroke(MUC, 1.8, 0.9)
            nap = Rectangle(width=w + 0.12, height=0.26).set_fill(NHAN, 0.3).set_stroke(MUC, 1.8, 0.9)
            nap.next_to(than, UP, buff=0)
            nhan_o = Rectangle(width=w * 0.42, height=0.3).set_stroke(MUC, 1.0, 0.6).set_fill(GIAY, 0.85).move_to(than.get_center() + UP * 0.12)
            hops.add(VGroup(than, nap, nhan_o))
        hops.arrange(RIGHT, buff=0.45)
        le = v.khoi(ts["le_trai"], co, (4.2 if L["ngang"] else L["w"] - 0.1), nghieng=True)
        nh = v.khoi(ts["nhan_hop"], co + 2, L["w"] - 0.3)
        ng = ts["nghieng"]
        tn = v.dong(ng["chu"], co, MUC, 0.9, nghieng=True)
        vong = vong_tay(hops, MUC, 2.6, 0.75, 0.22)
        giua = VGroup(hops, vong)
        if L["ngang"]:
            khoi = VGroup(nh, giua, tn).arrange(DOWN, buff=0.16)
            vua(khoi, -1.6, L["x1"] - 0.3, L["y0"] + 0.15, L["y1"] - 0.1, ORIGIN)
            dat(le, trai=L["x0"], tren=L["y1_trai"] - 0.2)
        else:
            khoi = VGroup(le, VGroup(nh, giua, tn).arrange(DOWN, buff=0.16)).arrange(DOWN, buff=0.35)
            vua(khoi, L["x0"], L["x1"], L["y0"] + 0.1, L["y1"] - 0.05, UP)
            dat(le, trai=L["x0"])
        dan = VGroup(*[de_nhe(nh.get_bottom() + DOWN * 0.04, hp[1].get_top() + UP * 0.02, 0.45) for hp in hops])
        out += [Phan("hop:le", le, "hien"), Phan("hop:hai", hops, "hien", rt=1.0), Phan("hop:nhan", VGroup(nh, dan), "hien"),
                Phan("hop:vong", vong, "ve", moc=ts.get("khoanh_tai"), rt=0.9), Phan("hop:nghieng", tn, "hien", moc=ng.get("moc"))]
        return out


LOP = {c.__name__: c for c in (TrangVatChung, HaiOSo, SoCai, TheTram, ManhTrichDan, VachSinhTruong, CotDiaTang, PhepChia, DoNhay,
                               BacThangDongHo, SoDoLaser, HaiHop)}
