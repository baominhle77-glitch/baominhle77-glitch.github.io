# Lõi trang cảnh K1 (Meniscus Lab) cho dây chuyền tools/nha_may_k1.py: một lõi, hai bố cục (16:9 ngang, 9:16 dọc), mốc theo lời
# đọc thật. Khuôn: ban_sac/K5_canh/loi.py (công thức khung, soát PiP mọi khung, kiểm vùng) — chép sang, KHÔNG import thư viện K5
# (lint BS-4 K1: tệp cảnh K1 chỉ import module K1_ban_quang_hoc).
# Dùng: tệp cảnh của tập đặt khung bằng K1_canh.khung.dat_doc() / dat_ngang() TRƯỚC khi import tệp này.
# Mỗi beat = một Scene con của TrangK1 (B = id beat); construct() = self.chay(). Kế hoạch dựng (lời, mốc từ, số khung, chuyển cảnh)
# đọc từ K1_KE_HOACH hoặc K3_KE_HOACH (json do nha_may_k1 ghi).
# Chuyển cảnh đầu beat (storyboard K1 t2, cột chuyen): 'zoom_thang' = K1.zoom_thang từ khung rộng 1,5 lần về k = 1 (trục 9, chính);
# 'lay_net' = K1.zoom_thang 1,06 -> 1 (phụ); 'khong (cùng bàn)' và 'khung 0' = 0 s. Mọi hiện / vẽ / đổi qua K1.hien / K1.ve / K1.doi.
# Nguồn trên màn (trục 8 K1): khối chữ nhỏ cỡ 14, canh phải, ghim theo khung — 16:9 sát trái ô PiP (mép phải 1538 px, như
# K1_canh.loi.nguon), 9:16 ngay dưới hàng PiP canh phải (như K1_canh.doc NG_PHAI / NG_TREN).
# SX lập 19/10/2026 (phiên local_df559baa, Opus 5.5). Không bản VI (lệnh Chủ tịch).
import json
import math
import os

import numpy as np
from manim import MovingCameraScene, Text, VGroup, Rectangle, Line, config, DOWN, RIGHT, ORIGIN

import K1_ban_quang_hoc as K1
from K1_ban_quang_hoc import MUC, CANG, chu
from ngon_ngu import chuan

# ------------------------------------------------------------------ công thức khung: hằng số (một chỗ duy nhất)
FPS = 30
DAN = 0.15          # hình đi trước tiếng (s)
PAD = 0.5           # đệm cuối beat (s)
PAD_KET = 1.5       # đệm cuối beat cuối tập (s)
T_ZOOM = 1.6        # K1.zoom_thang (mặc định module)
ZOOM_DAU = 1.5      # zoom_thang: khung camera đầu beat rộng 1,5 lần
T_LAY = 0.8         # lấy nét (phụ)
LAY_DAU = 1.06
TRE_TOI_DA = 0.35   # mốc hình trễ hơn mốc lời quá ngưỡng này thì in TRE_MOC
CO_NGUON = 14       # cỡ chữ nguồn (cỡ nhỏ nhất của kênh, không co)
PIP_SPEC = "E:/Studio/tools/pip_spec.json"
assert not K1.VI, "K1 t2: không bản VI (lệnh Chủ tịch)"


def so_khung_play(rt):
    """Số khung Manim ghi cho một play(run_time=rt): len(np.arange(0, rt, 1/fps)) như Scene.get_time_progression."""
    return len(np.arange(0, rt, 1 / FPS))


def so_khung_cho(t):
    """Số khung của wait(t, frozen_frame=True): int(t / dt) như CairoRenderer.freeze_current_frame."""
    return int(t / (1 / FPS))


# ------------------------------------------------------------------ bố cục (toạ độ MÀN: khung camera k = 1, tâm 0)
def _pip(doc):
    with open(PIP_SPEC, encoding="utf-8") as f:
        d = json.load(f)
    p = d["khung_1080x1920"] if doc else d
    W, H = p["khung"]
    px = W / config.frame_width
    v = 8  # viền ±8 px (pip_spec)
    return ((p["x"] - v - W / 2) / px, (p["x"] + p["w"] + v - W / 2) / px,
            (H / 2 - (p["y"] + p["h"] + v)) / px, (H / 2 - (p["y"] - v)) / px)


class BoCuc:
    """Ngang 16:9: vùng an toàn lề 0,25; PiP góc trên phải (pip_spec, viền ±8 px); sàn nội dung -2,60 (dải phụ đề).
    Nguồn: mép phải 1538 px, mép trên 0,3 dưới mép khung, mép trái ≥ 560 px (K1_canh.loi.nguon).
    Dọc 9:16 (K1_canh.doc): vùng an toàn x 65..940 px, y 270..1248 px; PiP góc trên trái; sàn nội dung -1,40;
    nguồn canh phải ở AN_PHAI - 0,05, mép trên ngay dưới hàng PiP (PIP y0 - 0,12)."""

    def __init__(self):
        W, H = config.frame_width, config.frame_height
        self.W, self.H = W, H
        self.doc = H > W
        self.ten = "9x16" if self.doc else "16x9"
        self.pip = _pip(self.doc)
        if self.doc:
            px = W / 1080
            self.an_toan = ((65 - 540) * px, (940 - 540) * px, (960 - 1248) * px, (960 - 270) * px)
            self.san = -1.40
            self.ng_phai = self.an_toan[1] - 0.05
            self.ng_tren = self.pip[2] - 0.12
            self.ng_trai = self.an_toan[0] + 0.02
        else:
            self.an_toan = (-W / 2 + 0.25, W / 2 - 0.25, -H / 2 + 0.25, H / 2 - 0.25)
            self.san = -2.60
            self.ng_phai = (1538 / 1920 - 0.5) * W
            self.ng_tren = H / 2 - 0.3
            self.ng_trai = (560 / 1920 - 0.5) * W


def k_camera(scene):
    return scene.camera.frame.width / config.frame_width


def hop_man(scene, m):
    """Hộp bao (x0, x1, y0, y1) của m tính theo toạ độ màn (k = 1)."""
    c = scene.camera.frame.get_center()
    k = k_camera(scene)
    return ((m.get_left()[0] - c[0]) / k, (m.get_right()[0] - c[0]) / k,
            (m.get_bottom()[1] - c[1]) / k, (m.get_top()[1] - c[1]) / k)


def man_sang_the_gioi(scene, m):
    """m dựng ở toạ độ màn (k = 1) -> thế giới theo khung camera hiện tại."""
    fr = scene.camera.frame
    m.scale(k_camera(scene), about_point=ORIGIN).shift(fr.get_center())
    return m


def ghim(scene, g):
    """Giữ g bám khung camera (cùng vị trí và cỡ trên màn) khi K1.zoom_thang thu phóng."""
    fr = scene.camera.frame
    w0 = fr.width
    d0 = g.get_center() - fr.get_center()
    trang = {"w": w0}

    def theo(m):
        if abs(fr.width - trang["w"]) > 1e-9:
            m.scale(fr.width / trang["w"])
            trang["w"] = fr.width
        m.move_to(fr.get_center() + d0 * (fr.width / w0))
    g.add_updater(theo)
    return g


def khoi_nguon(bc, dong):
    """Khối nguồn ở toạ độ màn (k = 1): các dòng chu(cỡ 14, mực 0,75) xếp xuống, canh phải. Rộng quá dải nguồn thì tách
    dòng tại '; ' hoặc ', ' (không co dưới cỡ 14). Trả (khối, hộp màn) hoặc (None, None) nếu không có nguồn."""
    if not dong:
        return None, None
    tran = bc.ng_phai - bc.ng_trai
    ra = []
    for s in dong:
        m = chu(s, CO_NGUON, MUC, 0.75)
        if m.width <= tran:
            ra.append(m)
            continue
        tu = s.replace("; ", ";\x00").replace(", ", ",\x00").split("\x00")
        cur = ""
        for w in tu:
            thu = (cur + " " + w) if cur else w
            if cur and chu(thu, CO_NGUON).width > tran:
                ra.append(chu(cur, CO_NGUON, MUC, 0.75))
                cur = w
            else:
                cur = thu
        ra.append(chu(cur, CO_NGUON, MUC, 0.75))
        if max(x.width for x in ra) > tran + 1e-6:
            raise ValueError("nguồn %r: một mảnh vẫn rộng hơn %.3f ở cỡ 14" % (s, tran))
    g = VGroup(*ra).arrange(DOWN, aligned_edge=RIGHT, buff=0.08)
    g.move_to([bc.ng_phai - g.width / 2, bc.ng_tren - g.height / 2, 0])
    return g, (g.get_left()[0], g.get_right()[0], g.get_bottom()[1], g.get_top()[1])


# ------------------------------------------------------------------ không chữ nào trong ô PiP ở BẤT KỲ khung nào (NX83-7 / NX90-10)
LE_PIP = 0.03


def o_pip_rong(bc):
    P = bc.pip
    return (P[0] - LE_PIP, P[1] + LE_PIP, P[2] - LE_PIP, P[3] + LE_PIP)


def _cat(A, B, e=0.02):
    return min(A[1], B[1]) - max(A[0], B[0]) > e and min(A[3], B[3]) - max(A[2], B[2]) > e


def _long(A, B):
    return A[0] >= B[0] - 1e-3 and A[1] <= B[1] + 1e-3 and A[2] >= B[2] - 1e-3 and A[3] <= B[3] + 1e-3


# ------------------------------------------------------------------ kế hoạch, mốc
_KH = None


def ke_hoach():
    global _KH
    if _KH is None:
        with open(os.environ.get("K1_KE_HOACH") or os.environ["K3_KE_HOACH"], encoding="utf-8") as f:
            _KH = json.load(f)
    return _KH


# ------------------------------------------------------------------ công thức khung: hàm (nha_may_k1 gọi ke_khung)
def t_chuyen(b):
    """Giây chuyển cảnh ở ĐẦU beat: zoom_thang T_ZOOM, lay_net T_LAY, còn lại ('khong (cùng bàn)', 'khung 0') 0."""
    c = str(b.get("chuyen") or "")
    if c.startswith("zoom_thang"):
        return so_khung_play(T_ZOOM) / FPS
    if c.startswith("lay_net"):
        return so_khung_play(T_LAY) / FPS
    return 0.0


def so_khung(b):
    """Số khung của beat = chuyển cảnh đầu beat + lời + đệm (nha_may_k1 đệm tiếng theo đúng số này)."""
    return math.ceil((t_chuyen(b) + b["dur"] + (PAD_KET if b.get("cuoi") else PAD)) * FPS)


def ke_khung(beats):
    """Đánh dấu beat cuối (đệm PAD_KET), ghi vào từng beat t_chuyen (s), so_khung và k0 (khung đầu beat trong bản nối);
    trả tổng số khung. Lời của beat bắt đầu ở giây t_chuyen -> dây chuyền đệm lặng t_chuyen trước lời."""
    k0 = 0
    for i, b in enumerate(beats):
        b["cuoi"] = i == len(beats) - 1
        b["t_chuyen"] = t_chuyen(b)
        b["so_khung"] = so_khung(b)
        b["k0"] = k0
        k0 += b["so_khung"]
    return k0


class Ve:
    """Ngữ cảnh vẽ một beat (tham số W của lop.ve(scene, W)): bố cục, mốc lời -> giây, sổ chữ đã vẽ (đối chiếu labels)."""

    def __init__(self, scene, bc, b):
        self.scene, self.bc, self.b = scene, bc, b
        self.ts = b.get("tham_so") or {}
        self.t0 = t_chuyen(b)
        self.da_ve = []
        self.hop_ng = None      # hộp màn của khối nguồn
        self.nguon = None       # khối nguồn (thế giới, đã ghim)

    def thoi(self, moc):
        """Giây (tính từ khung 0 của beat) của từ mốc trong lời; 'three#2' = lần 2; hình đi trước tiếng DAN."""
        w, _, k = moc.partition("#")
        k = int(k or 1)
        W = self.b["words"]
        c = chuan(w)
        hit = [x["t"] for x in W if chuan(x["w"]) == c]
        if len(hit) < k:
            hit = sorted(set(hit) | {x["t"] for x in W if c and chuan(x["w"]).startswith(c)})
        if len(hit) < k:
            raise KeyError("mốc %r không có trong lời beat %s" % (moc, self.b["id"]))
        return max(self.t0, self.t0 + hit[k - 1] - DAN)


# ------------------------------------------------------------------ kiểm vùng
def kiem_vung(scene, bid, bc, man, hop_ng):
    """In NGOAI_VUNG (ngoài vùng an toàn, dưới sàn, đè ô PiP, đè khối nguồn) và CHONG (hai khối chữ chồng nhau). Toạ độ màn."""
    a0, a1, b0, b1 = bc.an_toan
    so_loi = 0
    hop = {k: hop_man(scene, m) for k, m in man.items() if m is not None and len(m.get_all_points())}
    for k, A in hop.items():
        loi = []
        if A[0] < a0 - 1e-3 or A[1] > a1 + 1e-3 or A[2] < b0 - 1e-3 or A[3] > b1 + 1e-3:
            loi.append("ngoài vùng an toàn")
        if A[2] < bc.san - 1e-3:
            loi.append("dưới sàn")
        if _cat(A, bc.pip, 0.0):
            loi.append("đè ô PiP")
        if hop_ng is not None and k != "nguon" and _cat(A, hop_ng):
            loi.append("đè khối nguồn")
        if loi:
            so_loi += 1
            print("NGOAI_VUNG %s %s %s x %.2f..%.2f y %.2f..%.2f" % (bid, k, "+".join(loi), *A))
    ks = [k for k in hop if any(isinstance(x, Text) for x in man[k].get_family())]
    for i, a in enumerate(ks):
        for c in ks[i + 1:]:
            A, B = hop[a], hop[c]
            if _cat(A, B) and not (_long(A, B) or _long(B, A)):
                so_loi += 1
                print("CHONG %s %s %s" % (bid, a, c))
    print("KIEM_VUNG %s %s loi=%d phan_tu=%d" % (bid, bc.ten, so_loi, len(hop)))
    return so_loi


# ------------------------------------------------------------------ cảnh
class TrangK1(MovingCameraScene):
    """Một beat K1. Lớp con trong tệp cảnh: B = 'id beat'; construct() = self.chay(). Khung hình đếm chính xác."""
    B = None

    def setup(self):
        super().setup()
        self._khung = 0
        self._o_pip = None
        self._soat = []

    # --- khung hình chính xác
    def choi(self, *anims, t=0.6, rate_func=None):
        """play với đúng round(t·FPS) khung (hoạt cảnh lấy từ K1.hien / K1.ve / K1.doi)."""
        k = max(1, round(t * FPS))
        kw = {"run_time": (k - 0.5) / FPS}
        if rate_func is not None:
            kw["rate_func"] = rate_func
        self.play(*anims, **kw)
        self._khung += so_khung_play(kw["run_time"])

    def cho(self, k):
        if k > 0:
            if self._o_pip is not None:
                self._soat_pip(0)
            self.wait((k + 0.5) / FPS, frozen_frame=not getattr(self, '_co_chuyen_dong_song', False))
            self._khung += so_khung_cho((k + 0.5) / FPS)

    def toi(self, t, bid=""):
        """Chờ tới giây t của beat (mốc lời); trễ quá TRE_TOI_DA thì in TRE_MOC."""
        f = round(t * FPS)
        if self._khung - f > round(TRE_TOI_DA * FPS):
            print("TRE_MOC beat %s t=%.2f trễ %.2f s" % (bid or self.B, t, (self._khung - f) / FPS))
        self.cho(f - self._khung)

    def chuyen_dau(self, b):
        """Chuyển cảnh đầu beat (camera đã đặt rộng ở chay): K1.zoom_thang về k = 1 quanh tâm 0; đếm khung như Manim."""
        c = str(b.get("chuyen") or "")
        if c.startswith("zoom_thang"):
            K1.zoom_thang(self, ORIGIN, 1 / ZOOM_DAU, t=T_ZOOM)
            self._khung += so_khung_play(T_ZOOM)
        elif c.startswith("lay_net"):
            K1.zoom_thang(self, ORIGIN, 1 / LAY_DAU, t=T_LAY)
            self._khung += so_khung_play(T_LAY)
        fr = self.camera.frame
        fr.set(width=config.frame_width)
        fr.move_to(ORIGIN)

    def _soat_pip(self, dt):
        """Soát MỌI khung (updater của cảnh): chữ hiện (độ đục > 0,02) chạm ô PiP."""
        f = int(round(self.renderer.time * FPS))
        for x in self.get_mobject_family_members():
            if not isinstance(x, Text):
                continue
            if max([y.get_fill_opacity() for y in x.get_family()] or [0.0]) <= 0.02:
                continue
            A = hop_man(self, x)
            if _cat(A, self._o_pip, 0.0):
                self._soat.append((f, getattr(x, "text", "?")[:24], A))

    def chay(self):
        from K1_canh.lop import LOP
        kh = ke_hoach()
        bs = kh["beats"]
        b = bs[self.B] if isinstance(bs, dict) else next(x for x in bs if x["id"] == self.B)
        bc = BoCuc()
        N = so_khung(b)
        if b["canh"] not in LOP:
            raise NotImplementedError("beat %s: lớp %s chưa dựng trong K1_canh/lop.py" % (b["id"], b["canh"]))
        c = str(b.get("chuyen") or "")
        he = ZOOM_DAU if c.startswith("zoom_thang") else (LAY_DAU if c.startswith("lay_net") else 1.0)
        fr = self.camera.frame
        fr.move_to(ORIGIN)
        fr.set(width=config.frame_width * he)
        K1.nen(self)
        W = Ve(self, bc, b)
        ng, W.hop_ng = khoi_nguon(bc, W.ts.get("nguon") or [])
        if ng is not None:
            W.nguon = ghim(self, man_sang_the_gioi(self, ng))
            self.add(W.nguon)
            W.da_ve += list(W.ts.get("nguon") or [])
        self._o_pip = o_pip_rong(bc)
        self.add_updater(self._soat_pip)
        lop = LOP[b["canh"]](**W.ts)
        man = lop.ve(self, W) or {}
        thieu = [s for s in b.get("labels", []) if s not in W.da_ve]
        if thieu:
            raise AssertionError("beat %s: labels chưa vẽ: %s" % (b["id"], thieu))
        if self._khung > N:
            raise AssertionError("beat %s: hình chạy %d khung > %d (chuyển cảnh + lời + đệm)" % (b["id"], self._khung, N))
        if ng is not None:
            man["nguon"] = W.nguon
        kiem_vung(self, b["id"], bc, man, W.hop_ng)
        self.cho(N - self._khung)
        print("KHUNG_DU_KIEN %s %d %d" % (b["id"], N, self._khung))
        fs = sorted({f for f, _, _ in self._soat})
        print("SOAT_PIP %s %s khung_cham=%d" % (b["id"], bc.ten, len(fs)))
        for f, s, A in self._soat[:12]:
            print("CHU_TRONG_PIP %s %s f%d %r x %.2f..%.2f y %.2f..%.2f" % (b["id"], bc.ten, f, s, *A))
        if fs and os.environ.get("K1_SOAT_PIP_CHI_IN") != "1":
            raise AssertionError("beat %s: %d khung có chữ chạm ô PiP" % (b["id"], len(fs)))
        if self._khung != N:
            raise AssertionError("beat %s: %d khung != %d" % (b["id"], self._khung, N))
