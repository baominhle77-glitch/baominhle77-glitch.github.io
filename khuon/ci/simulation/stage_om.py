"""KHUÔN v1 (GĐ viết, Codex chép NGUYÊN VĂN, cấm sửa; CI kiểm sha256).

StageOm = WaterStage + camera "ôm vật chính" + lịch sự kiện + bố cục 9:16 hai tầng.
Chặn các lỗi lặp của PR 149 (r13–r15):
  - vật chính (bát/đĩa) nhỏ, lệch góc  -> khung 'toan': hộp bao bát >= 70 % khung, lề >= 3 % mỗi phía;
  - đứng hình > 2 s                     -> lịch sự kiện, mỗi khoảng <= 3 s có một sự kiện (giọt/camera/nhập);
  - 9:16 letterbox / tầng cận trống trơn -> 9:16 hai tầng phủ kín khung, CẢ HAI tầng 'toan':
    trên = nhìn nghiêng (mặt cắt nếu beat có section), dưới = nhìn từ trên cao (camera tự nâng tới 0,97).
    Không tầng nào là mặt phẳng trống: bát luôn chiếm >= 70 % mỗi tầng.
Không chứa tên tập, lời, phụ đề. Nội dung beat nằm trong ban_ve_B60.json (Codex viết).
"""
import math
from dataclasses import replace
import numpy as np
import cv2
from .optical_water import WaterStage, Optics
from .transport import impulse_integral
from .views import ViewComposer

LE_MUC_TIEU = 0.04       # lề đặt khung (cổng đòi >= 0,03; trừ hao 1–2 px nhoè khi G12 đo ở 270p)
PHU_MUC_TIEU = 0.78      # vật chính đặt khung (cổng đòi >= 0,70; trừ hao thở camera + vành kính mờ trên nền sáng mà G12 không bắt)
DO_CAO_MIN, DO_CAO_MAX = 0.25, 0.62   # tỉ lệ elip miệng bát (góc nhìn nghiêng)
DO_CAO_DUOI_MAX = 0.97   # tầng dưới 9:16: camera được nâng gần thẳng đứng để bát lấp tầng cao
THO = 0.012              # camera "thở": co tối đa 1,2 % (không bao giờ phình ra khỏi lề)
CAN_NUA_CAO = 0.35       # khung 'can': nửa chiều cao cửa sổ theo toạ độ mặt nước (v)
KIEU_SU_KIEN = ("giot", "camera", "nhap", "ngung_nhap")


def _ease(q):
    q = min(1.0, max(0.0, q))
    return (1 - math.cos(math.pi * q)) / 2


def he_so_sau(o):
    """độ sâu bát / rx, đúng như optical_water.frame()."""
    return 0.72 if o.section else (o.vessel_depth or (0.14 if o.vessel == 'ceramic' else 0.26))


def hop_bat(cx, cy, rx, ry, o):
    """Hộp bao vật chính (vành + thành + đáy nhìn thấy), cùng hình học optical_water.frame()."""
    d = rx * he_so_sau(o)
    day = cy + (1.03 * d if o.section else d + 1.03 * ry)
    return cx - 1.06 * rx, cy - 1.06 * ry, cx + 1.06 * rx, day


def giai_khung_toan(W, H, o, e, lia=0.0, lia_doc=0.0, tho=0.0, e_max=DO_CAO_MAX):
    """Đặt camera để hộp bao bát chiếm >= PHU_MUC_TIEU khung, lề >= LE_MUC_TIEU.
    e: độ cao camera yêu cầu (tỉ lệ elip). Độ phủ theo e tăng tới đỉnh e_dinh (hộp bao chạm cả lề ngang
    lẫn lề dọc) rồi giảm. Nếu e yêu cầu không đủ phủ: e < e_dinh thì nâng camera (e nhỏ nhất đạt phủ),
    e > e_dinh thì hạ camera (e lớn nhất đạt phủ); trong [DO_CAO_MIN, e_max]. Trả (cx, cy, rx, ry, e_dung)."""
    k = he_so_sau(o)
    Wa, Ha = (1 - 2 * LE_MUC_TIEU) * W, (1 - 2 * LE_MUC_TIEU) * H

    def cao(rx, e_):  # chiều cao hộp bao theo rx
        return (1.06 * e_ + (1.03 * k if o.section else k + 1.03 * e_)) * rx

    def rx_vua(e_):
        return min(Wa / 2.12, Ha / (cao(1.0, e_)))

    def phu(e_):
        r_ = rx_vua(e_)
        return 2.12 * r_ * cao(r_, e_) / (W * H)

    X = Ha * 2.12 / Wa
    e_dinh = (X - 1.03 * k) / 1.06 if o.section else (X - k) / 2.09
    e_dinh = min(e_max, max(DO_CAO_MIN, e_dinh))
    e = min(e_max, max(DO_CAO_MIN, e))
    if phu(e) < PHU_MUC_TIEU:
        tang = e < e_dinh
        lo, hi = (e, e_dinh) if tang else (e_dinh, e)
        if phu(e_dinh) < PHU_MUC_TIEU:
            e = e_dinh  # khung quá lệch tỉ lệ: lấy độ phủ lớn nhất có thể (kiem_ban_ve sẽ báo trượt)
        else:
            for _ in range(40):  # chia đôi: ranh giới đạt phủ giữa e yêu cầu và e_dinh
                m = (lo + hi) / 2
                if (phu(m) >= PHU_MUC_TIEU) == tang:
                    hi = m
                else:
                    lo = m
            e = hi if tang else lo
    rx = rx_vua(e)
    s = 1 - tho * THO
    rx *= s
    ry = rx * e
    bw, bh = 2.12 * rx, cao(rx, e)
    du_x, du_y = max(0.0, Wa - bw) / 2, max(0.0, Ha - bh) / 2
    trai = W / 2 - bw / 2 + lia * du_x
    tren = H / 2 - bh / 2 + lia_doc * du_y
    cx = trai + 1.06 * rx
    cy = tren + 1.06 * ry
    return cx, cy, rx, ry, e


class StageOm(WaterStage):
    """khung: 'toan' (cả bát, ôm khung) hoặc 'can' (cận mép vòng tiêu).
    su_kien: [{'t': giây trong beat, 'kieu': 'giot'|'camera'|'nhap'|'ngung_nhap', ...}]
      giot: 'manh' (mặc định 1; giọt sau cùng chỗ nên <= 0,4 cho đúng vật lý)
      camera: 'do_cao' (0,25–0,62), 'lia' (-1..1 ngang), 'lia_doc' (-1..1), 'goc' (độ, chỉ khung 'can')
    """

    def __init__(self, width, height, optics=Optics(), khung='toan', su_kien=(), goc_can=90.0, do_cao_max=DO_CAO_MAX):
        if khung not in ('toan', 'can'):
            raise ValueError('khung phải là toan hoặc can')
        self.su_kien = sorted((dict(s) for s in su_kien), key=lambda s: s['t'])
        for s in self.su_kien:
            if s['kieu'] not in KIEU_SU_KIEN:
                raise ValueError('kiểu sự kiện lạ: %r' % s['kieu'])
        giot = [s for s in self.su_kien if s['kieu'] == 'giot']
        if giot:  # giọt đầu tiên là cú va của optical_water (gợn vòng, chấm tối)
            optics = replace(optics, impact=float(giot[0]['t']))
        super().__init__(width, height, optics)
        self.khung, self.goc_can, self.do_cao_max = khung, float(goc_can), float(do_cao_max)
        self._giot = [(float(s['t']), float(s.get('manh', 1.0))) for s in giot] or [(optics.impact, 1.0)]
        self._nhap = []  # (bat_dau, ket_thuc)
        bat = 0.0 if optics.feeding else None
        for s in self.su_kien:
            if s['kieu'] == 'nhap' and bat is None:
                bat = float(s['t'])
            if s['kieu'] == 'ngung_nhap' and bat is not None:
                self._nhap.append((bat, float(s['t'])))
                bat = None
        if bat is not None:
            self._nhap.append((bat, float('inf')))
        cam = [dict(t=0.0, do_cao=optics.ellipse_ratio, lia=0.0, lia_doc=0.0, goc=self.goc_can)]
        for s in self.su_kien:
            if s['kieu'] == 'camera':
                p = dict(cam[-1])
                p.update({k: float(s[k]) for k in ('do_cao', 'lia', 'lia_doc', 'goc') if k in s})
                p['t'] = float(s['t'])
                cam.append(p)
        self._cam = cam

    # ---------- vật lý: khối chất hoạt động bề mặt cộng dồn theo sự kiện ----------
    def khoi(self, t):
        m = sum(s * float(impulse_integral(t - t0)) for t0, s in self._giot if t >= t0)
        for a, b in self._nhap:
            if t > a:
                m += 0.045 * (min(t, b) - a)
        return m

    def ban_kinh_vong(self, t):
        """bán kính mép vùng trống (hạt tiêu gần tâm nhất), theo toạ độ mặt nước."""
        return float(min(0.975, math.sqrt(float(np.min(self.r0)) ** 2 + 2 * self.khoi(t))))

    def dang_nhap(self, t):
        return any(a <= t < b for a, b in self._nhap)

    # ---------- camera ----------
    def _tham_so_cam(self, t):
        cam = self._cam
        i = max(j for j in range(len(cam)) if cam[j]['t'] <= max(0.0, t))
        p = cam[i]
        if i == 0:
            return p
        q = _ease((t - p['t']) / 1.2)  # mỗi lệnh camera chuyển êm trong 1,2 s
        a = cam[i - 1] if q < 1 else p
        return {k: a[k] + (p[k] - a[k]) * q for k in ('do_cao', 'lia', 'lia_doc', 'goc')}

    def camera(self, t):
        W, H, o = self.width, self.height, self.optics
        p = self._tham_so_cam(t)
        tho = (1 + math.sin(0.9 * t)) / 2
        if self.khung == 'toan':
            cx, cy, rx, ry, _ = giai_khung_toan(W, H, o, p['do_cao'], p['lia'], p['lia_doc'], tho, self.do_cao_max)
            return cx, cy, rx, ry
        # 'can': cửa sổ đặt quanh điểm mép vòng tiêu theo hướng 'goc'
        e = min(DO_CAO_MAX + 0.2, max(DO_CAO_MIN, p['do_cao']))
        ry = H / (2 * CAN_NUA_CAO) * (1 + 0.01 * math.sin(0.7 * t))
        rx = ry / e
        hu, hv = W / (2 * rx), H / (2 * ry)
        R = self.ban_kinh_vong(t)
        g = math.radians(p['goc'])
        ux, vy = math.cos(g), math.sin(g)
        # tâm cửa sổ: gần mép vòng, phần ngoài mặt nước hạn chế; nhưng mép vòng luôn trong 60 % giữa cửa sổ
        d_ngoai = max(0.0, 1.0 - 0.6 * (hv * abs(vy) + hu * abs(ux)))
        d_vong = R - 0.3 * min(2 * hv / max(abs(vy), 1e-6), 2 * hu / max(abs(ux), 1e-6))
        d = min(R, max(d_ngoai, d_vong))
        u0, v0 = d * ux, d * vy
        return W / 2 - rx * u0, H / 2 - ry * v0, rx, ry

    def mep_vong_trong_khung(self, t):
        """(x, y) phân số khung của điểm mép vòng tiêu theo hướng camera ('can')."""
        cx, cy, rx, ry = self.camera(t)
        g = math.radians(self._tham_so_cam(t)['goc'])
        R = self.ban_kinh_vong(t)
        return (cx + rx * R * math.cos(g)) / self.width, (cy + ry * R * math.sin(g)) / self.height

    def vat_chinh(self, t):
        """Đo hình học: (phủ, lề_min) của hộp bao bát trong khung (chỉ có nghĩa với 'toan')."""
        cx, cy, rx, ry = self.camera(t)
        x0, y0, x1, y1 = hop_bat(cx, cy, rx, ry, self.optics)
        W, H = self.width, self.height
        phu = (min(x1, W) - max(x0, 0)) * (min(y1, H) - max(y0, 0)) / (W * H)
        return phu, min(x0 / W, y0 / H, 1 - x1 / W, 1 - y1 / H)

    # ---------- vẽ ----------
    def _pepper(self, image, t, cx, cy, rx, ry):
        o = self.optics
        rr = np.minimum(0.975, np.sqrt(self.r0 * self.r0 + 2 * self.khoi(t)))
        angle = self.angles + .025 * np.sin(t * .7 + self.r0 * 8) + (.055 * t if self.dang_nhap(t) or o.feeding else 0)
        rr = np.minimum(rr, .97 - self.sizes * .005) + .003 * np.sin(self.angles * 47 + t * .9)
        xx = cx + rx * rr * np.cos(angle)
        yy = cy + ry * rr * np.sin(angle)
        self.pepper_positions = np.column_stack((xx, yy))
        shadow = np.zeros(image.shape[:2], np.uint8)
        polygons = []
        H, W = image.shape[:2]
        rot_scale = rx * .0085
        for i, p in enumerate(self.flakes):
            if not (-40 < xx[i] < W + 40 and -40 < yy[i] < H + 40):
                polygons.append(None)
                continue
            a = self.turn[i] + .09 * math.sin(t * .6 + i)
            rot = np.array([[math.cos(a), -math.sin(a)], [math.sin(a), math.cos(a)]])
            pts = p @ rot.T * (rot_scale * self.sizes[i])
            pts[:, 1] *= .64
            q = np.rint(pts + [xx[i], yy[i]]).astype(np.int32)
            polygons.append(q)
            cv2.fillPoly(shadow, [q + np.array([1, 2])], 90, lineType=cv2.LINE_AA)
        shadow = cv2.GaussianBlur(shadow, (0, 0), max(.6, rx * .002))
        image[:] = (image.astype(np.float32) * (1 - shadow[..., None] / 380)).astype(np.uint8)
        for i, q in enumerate(polygons):
            if q is None:
                continue
            cv2.fillPoly(image, [q], tuple(map(float, self.colors[i])), lineType=cv2.LINE_AA)
            if self.sizes[i] > .9:
                cv2.line(image, tuple(map(int, q[0])), tuple(map(int, q[1])), tuple(map(float, self.colors[i] + 22)),
                         max(1, round(rx / 500)), cv2.LINE_AA)

    def frame(self, t):
        image = super().frame(t)
        cx, cy, rx, ry = self.camera(t)
        for t0, _ in self._giot[1:]:  # giọt thứ 2 trở đi: rơi 0,45 s rồi tan 0,25 s
            if t0 - 0.45 < t < t0 + 0.25:
                q = min(1.0, max(0.0, (t - (t0 - 0.45)) / 0.45))
                yy = round(cy - ry * .95 * (1 - q * q))
                s = max(2, round(rx * .028 * (1 + .25 * q)))
                if t > t0:
                    s = round(s * max(0.0, 1 - (t - t0) / .25))
                if s >= 1:
                    self._glass_drop(image, round(cx), yy, s)
        return image

    def audit(self):
        a = super().audit()
        a.update(khuon='KHUON v1', khung=self.khung, su_kien=len(self.su_kien))
        return a


def dung_doc(width, height, optics, su_kien=(), ti_le_tren=0.375, optics_duoi=None):
    """9:16 hai tầng phủ kín khung (không letterbox), cả hai 'toan':
    trên = nhìn nghiêng theo optics; dưới = nhìn từ trên cao (bỏ section) theo optics_duoi.
    Hai tầng dùng cùng hạt giống, cùng lịch sự kiện -> cùng một bát, cùng một thời điểm."""
    h_tren = int(round(height * ti_le_tren))
    tren = StageOm(width, h_tren, optics, 'toan', su_kien)
    od = replace(optics_duoi or optics, section=False)
    duoi = StageOm(width, height - h_tren, od, 'toan', su_kien, do_cao_max=DO_CAO_DUOI_MAX)
    return ViewComposer(width, height, [(0, 0, tren), (0, h_tren, duoi)])
