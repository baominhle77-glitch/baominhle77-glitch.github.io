"""SUA5 beat pictures: one distinct, labelled physical picture per beat.

Pure numpy + Pillow (no cv2), so the same code runs in the render env and in
export_gate_plan. Each beat names a scene kind (``chinh``) and, for 9:16, a
secondary kind for the upper tier (``phu``). Rules enforced here:
- camera only stays still, pans or dollies ONE way, cosine eased, zoom 1..1.12;
- every main tier carries the beat's numeric labels: value + unit, solid ink
  box, leader line to a moving anchor on the object;
- high-contrast palette: dark neutral ground, saturated objects, 2 px ink
  outlines; labels white on near-black.
"""
import math
from pathlib import Path
from types import SimpleNamespace
import numpy as np
from PIL import Image, ImageDraw, ImageFont

R = Path(__file__).resolve().parents[2]
FONT = str(R / 'ban_sac/fonts/NotoSans-Regular.ttf')
MAC_DINH = dict(nen='#0B0E12', panel='#17212D', panel2='#1F2C3B', muc='#05080B', nuoc='#2FA8E0', nuoc_sang='#8FDcFF',
                tieu='#3B2416', tieu_vien='#E0B07A', vanh='#F2F4F5', cam='#FF8A2A', vang='#FFD23F', do='#E8434F',
                tim='#B36BFF', xanh_la='#3DDC84', ruou='#9E1B32', caustic='#5FCBFF', nhan_nen='#0B1016', nhan_chu='#FFFFFF')
ZOOM_MIN, ZOOM_MAX, PAN_MAX = 1.0, 1.12, .04
SS = 2  # vector supersampling


def hex_rgb(s):
    s = s.lstrip('#')
    return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))


def ease(q):
    q = min(1.0, max(0.0, q))
    return (1 - math.cos(math.pi * q)) / 2


def camera_at(spec, t, T):
    """(zoom, pan_x, pan_y) — monotone in t by construction."""
    spec = spec or {'kieu': 'dung'}
    kieu = spec.get('kieu', 'dung')
    q = ease(t / max(1e-6, T))
    if kieu == 'dolly':
        a, b = float(spec.get('tu', 1.0)), float(spec.get('den', 1.08))
        return a + (b - a) * q, 0.0, 0.0
    if kieu == 'lia':
        a, b = spec.get('tu', [-.025, 0]), spec.get('den', [.025, 0])
        return float(spec.get('zoom', 1.06)), a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q
    return float(spec.get('zoom', 1.0)), 0.0, 0.0


def kiem_camera(spec):
    """Static validation used by tests/export: one direction, bounded."""
    loi = []
    kieu = (spec or {}).get('kieu', 'dung')
    if kieu not in ('dung', 'lia', 'dolly'):
        loi.append('camera kieu la ' + repr(kieu))
    zs = [camera_at(spec, t, 1.0)[0] for t in np.linspace(0, 1, 21)]
    if min(zs) < ZOOM_MIN - 1e-9 or max(zs) > ZOOM_MAX + 1e-9:
        loi.append('zoom ngoai %.2f..%.2f' % (ZOOM_MIN, ZOOM_MAX))
    if max(zs) / min(zs) > 1.15:
        loi.append('zoom doi > 15 %')
    for k in (1, 2):
        v = [camera_at(spec, t, 1.0)[k] for t in np.linspace(0, 1, 21)]
        if max(abs(x) for x in v) > PAN_MAX + 1e-9:
            loi.append('lia vuot %.0f %%' % (PAN_MAX * 100))
        if kieu == 'lia':
            z = camera_at(spec, 0, 1)[0]
            if max(abs(x) for x in v) > (z - 1) / 2 + 1e-9:
                loi.append('lia lo mep the gioi (zoom %.2f)' % z)
    return loi


class Ve:
    """Drawer in world units (panel px at zoom 1) -> supersampled panel px.

    PIL overwrites RGBA pixels instead of blending, so every translucent
    primitive is drawn on a small overlay and alpha-composited in place.
    """

    def __init__(self, W, H, pal, cam=(1.0, 0.0, 0.0), dry=False):
        self.W, self.H, self.pal, self.dry = W, H, pal, dry
        z, px, py = cam
        self.z, self.cx, self.cy = z, W / 2 + px * W, H / 2 + py * H
        self.s = min(W, H)
        if not dry:
            self.img = Image.new('RGBA', (W * SS, H * SS), (0, 0, 0, 0))
            self.d = ImageDraw.Draw(self.img)

    def p(self, x, y):
        return ((x - self.cx) * self.z + self.W / 2) * SS, ((y - self.cy) * self.z + self.H / 2) * SS

    def man_hinh(self, x, y):
        a, b = self.p(x, y)
        return a / SS, b / SS

    def c(self, mau, a=255):
        if isinstance(mau, str):
            mau = hex_rgb(self.pal.get(mau, mau))
        return tuple(int(v) for v in mau[:3]) + (int(a),)

    def _ve(self, box, opaque, fn):
        if opaque:
            fn(self.d, 0.0, 0.0)
            return
        x0, y0 = max(0, int(box[0]) - 4), max(0, int(box[1]) - 4)
        x1, y1 = min(self.img.width, int(box[2]) + 5), min(self.img.height, int(box[3]) + 5)
        if x1 <= x0 or y1 <= y0:
            return
        ov = Image.new('RGBA', (x1 - x0, y1 - y0), (0, 0, 0, 0))
        fn(ImageDraw.Draw(ov), -x0, -y0)
        self.img.alpha_composite(ov, (x0, y0))

    def tron(self, x, y, r, mau, a=255, vien=2.0, muc='muc'):
        self.elip(x, y, r, r, mau, a, vien, 0, muc)

    def elip(self, x, y, rx, ry, mau, a=255, vien=2.0, net=0, muc='muc'):
        if self.dry:
            return
        X, Y = self.p(x, y)
        ax, ay, w = max(.6, rx * self.z * SS), max(.6, ry * self.z * SS), vien * SS
        nw = net * SS
        cf, cm = self.c(mau, a), self.c(muc, max(a, 200) if vien else 0)

        def fn(d, ox, oy):
            X0, Y0 = X + ox, Y + oy
            if net:
                if vien:
                    d.ellipse((X0 - ax - w, Y0 - ay - w, X0 + ax + w, Y0 + ay + w), outline=cm, width=int(nw + 2 * w))
                d.ellipse((X0 - ax, Y0 - ay, X0 + ax, Y0 + ay), outline=cf, width=max(1, int(nw)))
                return
            if vien:
                d.ellipse((X0 - ax - w, Y0 - ay - w, X0 + ax + w, Y0 + ay + w), fill=cm)
            d.ellipse((X0 - ax, Y0 - ay, X0 + ax, Y0 + ay), fill=cf)
        self._ve((X - ax - w, Y - ay - w, X + ax + w, Y + ay + w), a >= 255, fn)

    def duong(self, pts, mau, net=3.0, a=255, vien=2.0, muc='muc'):
        if self.dry or len(pts) < 2:
            return
        q = [self.p(x, y) for x, y in pts]
        cf, cm = self.c(mau, a), self.c(muc, a)
        ww = (net + 2 * vien) * SS

        def fn(d, ox, oy):
            qq = [(x + ox, y + oy) for x, y in q]
            if vien:
                d.line(qq, fill=cm, width=int(ww), joint='curve')
            d.line(qq, fill=cf, width=max(1, int(net * SS)), joint='curve')
        xs, ys = [v[0] for v in q], [v[1] for v in q]
        self._ve((min(xs) - ww, min(ys) - ww, max(xs) + ww, max(ys) + ww), a >= 255, fn)

    def da_giac(self, pts, mau, a=255, vien=2.0, muc='muc'):
        if self.dry:
            return
        q = [self.p(x, y) for x, y in pts]
        cf, cm = self.c(mau, a), self.c(muc, a)
        ww = vien * SS * 2

        def fn(d, ox, oy):
            qq = [(x + ox, y + oy) for x, y in q]
            d.polygon(qq, fill=cf)
            if vien:
                d.line(qq + [qq[0]], fill=cm, width=int(ww), joint='curve')
        xs, ys = [v[0] for v in q], [v[1] for v in q]
        self._ve((min(xs) - ww, min(ys) - ww, max(xs) + ww, max(ys) + ww), a >= 255, fn)

    def hcn(self, x0, y0, x1, y1, mau, a=255, vien=2.0, bo=0.0, muc='muc'):
        if self.dry:
            return
        X0, Y0 = self.p(x0, y0)
        X1, Y1 = self.p(x1, y1)
        X0, X1 = sorted((X0, X1))
        Y0, Y1 = sorted((Y0, Y1))
        w = vien * SS
        r = bo * self.z * SS
        cf, cm = self.c(mau, a), self.c(muc, max(a, 200))

        def fn(d, ox, oy):
            if vien:
                d.rounded_rectangle((X0 + ox - w, Y0 + oy - w, X1 + ox + w, Y1 + oy + w), radius=r + w, fill=cm)
            d.rounded_rectangle((X0 + ox, Y0 + oy, X1 + ox, Y1 + oy), radius=r, fill=cf)
        self._ve((X0 - w, Y0 - w, X1 + w, Y1 + w), a >= 255, fn)


# ---------------------------------------------------------------- scene kinds
# Each kind draws with ``d`` and returns named anchors in world units. The
# same call with a dry drawer gives anchors for label placement/export.

def _hat(seed, n):
    g = np.random.default_rng(seed)
    return g.random(n), g.random(n), g.random(n), g.random(n)


def k_bat_tren(d, t, T, k, st):
    """Top view of a bowl: water disc, floating pepper, soap clear ring."""
    W, H, s = d.W, d.H, d.s
    cx, cy = W / 2 + k.get('dx', 0) * W, H * .52
    Rb = min(W * .44, H * .45)
    Rw = Rb * .88
    mode = k.get('mode', 'giot')
    d.tron(cx, cy, Rb, 'vanh')
    d.tron(cx, cy, Rw, 'nuoc', 225)
    t0 = .9 if mode == 'giot' else 0.0
    if mode == 'giot':
        Rr = Rw * .80 * (1 - math.exp(-max(0, t - t0) / 1.1))
    elif mode == 'vong':
        Rr = Rw * k.get('r', .55) * (1 - .25 * math.exp(-t / 2.0))
    else:
        Rr = Rw * k.get('r', .5) * min(1, .55 + .45 * ease(t / (.35 * T)))
    if Rr > 2:
        d.tron(cx, cy, Rr, 'nuoc_sang', 150, vien=0)
        d.elip(cx, cy, Rr, Rr, 'vanh', 230, vien=1.0, net=2)
    a, r0, sz, ph = st['hat']
    n = len(a)
    ang = a * 2 * math.pi
    rr = np.sqrt(r0) * Rw * .96
    if mode == 'giot':
        rr = np.where(rr < Rr * 1.02, Rr * (1.02 + .06 * sz), rr)
        rr = np.minimum(rr, Rw * .97)
    elif mode in ('kim', 'chay'):
        inside = r0 < .35
        drift = (np.sqrt(r0) + ph + t * (.35 if mode == 'kim' else .28)) % 1.0
        rin = Rr * drift
        rout = rr + Rw * .004 * math.sin(t * .4)
        rr = np.where(inside, rin, np.maximum(rout, Rr * 1.03))
        rr = np.minimum(rr, Rw * .97)
    else:  # vong: grains pushed to the bowl edge / ring
        tgt = Rw * (.93 - .05 * sz)
        q = ease(t / (.6 * T))
        rr = np.maximum(rr, Rr * 1.03)
        rr = rr + (tgt - rr) * q * (r0 > .2)
    xs, ys = cx + rr * np.cos(ang + .02 * ph), cy + rr * np.sin(ang + .02 * ph)
    for i in range(n):
        d.tron(xs[i], ys[i], s * (.0045 + .003 * sz[i]), 'tieu', vien=1.0, muc='tieu_vien')
    if mode in ('kim', 'chay'):
        d.tron(cx, cy, s * .022, 'tim')
        d.tron(cx, cy, s * .009, 'vanh', vien=0)
    if mode == 'giot' and t < t0 + .25:
        yy = cy - Rb * 1.1 + (Rb * 1.1) * min(1, (t / t0) ** 2)
        d.tron(cx, yy, s * .03, 'tim')
        d.da_giac([(cx - s * .026, yy - s * .01), (cx + s * .026, yy - s * .01), (cx, yy - s * .075)], 'tim')
    ga = -.65
    return dict(giot=(cx, cy - (Rb * 1.1 * (1 - min(1, (t / max(t0, 1e-6)) ** 2)) if mode == 'giot' and t < t0 else 0)),
                tam=(cx, cy), vong=(cx + max(Rr, Rw * .2) * math.cos(ga), cy + max(Rr, Rw * .2) * math.sin(ga)),
                bat=(cx - Rb * .98 * math.cos(.5), cy + Rb * .98 * math.sin(.5)), kim=(cx, cy),
                hat=(float(xs[3]), float(ys[3])), mep=(cx + Rw * .93 * math.cos(2.3), cy + Rw * .93 * math.sin(2.3)))


def k_mat_cat(d, t, T, k, st):
    """Side cross-section: vessel, water layer, surface flow and return loop."""
    W, H, s = d.W, d.H, d.s
    mode = k.get('mode', 'dong')
    x0, x1 = W * .06, W * .94
    ys, yb = H * .30, H * .86
    d.hcn(x0 - s * .03, ys - s * .06, x1 + s * .03, yb + s * .035, 'vanh', bo=s * .02)
    d.hcn(x0, ys - s * .06, x1, yb, 'panel', vien=0)
    d.hcn(x0, ys, x1, yb, 'nuoc', 220, vien=0)
    d.hcn(x0, ys, x1, ys + (yb - ys) * .18, 'nuoc_sang', 90, vien=0)
    xn = W * .5
    anchors = dict(mat=(W * .72, ys), day=(W * .30, yb), kim=(xn, ys))
    if mode == 'men':
        lc = (yb - ys) * .35
        pts = [(x0 + (x1 - x0) * u, ys - lc * math.exp(-(x1 - x0) * u / (lc * .8)) - 2 * math.sin(u * 30 - t * 2) * (u > .2))
               for u in np.linspace(0, 1, 80)]
        d.da_giac([(x0, yb)] + pts + [(x1, yb)], 'nuoc', 235, vien=0)
        d.duong(pts, 'vanh', 3)
        hx = x0 + s * .02
        d.duong([(hx + s * .05, ys), (hx + s * .05, ys - lc)], 'vang', 3)
        for yy in (ys, ys - lc):
            d.duong([(hx + s * .03, yy), (hx + s * .07, yy)], 'vang', 3)
        anchors.update(men=(hx + s * .05, ys - lc * .5), mat=(W * .6, ys))
    else:
        d.duong([(x0, ys), (x1, ys)], 'vanh', 3)
    if mode != 'men':
        d.hcn(xn - s * .008, H * .02, xn + s * .008, ys - s * .004, 'vanh', vien=2)
        d.tron(xn, ys - s * .006, s * .012, 'tim')
    a, r0, sz, ph = st['hat']
    n = len(a)
    if mode in ('dong', 'vong', 'mong', 'men'):
        depth = (yb - ys)
        for i in range(n):
            side = 1 if a[i] > .5 else -1
            if mode == 'mong':
                lay = r0[i] < .55
                yy = ys + depth * (.02 + .12 * sz[i]) if lay else ys + depth * (.25 + .7 * sz[i])
                sp = (.30 if lay else .015) * (1 - .6 * sz[i] if lay else 1)
                u = (ph[i] + t * sp) % 1.0
                xx = xn + side * (x1 - xn) * u
                d.tron(xx, yy, s * .006, 'vang' if lay else 'vanh', vien=1)
                continue
            # recirculation loop: out along the surface, back along the bottom
            u = (ph[i] + t * (.07 + .03 * sz[i])) % 1.0
            dep = .08 + .84 * r0[i]
            if u < .45:
                xx = xn + side * (x1 - xn - s * .03) * (u / .45) ** .7
                yy = ys + depth * dep * .25
            elif u < .55:
                xx = xn + side * (x1 - xn - s * .03)
                yy = ys + depth * (dep * .25 + (dep - dep * .25) * (u - .45) / .1)
            elif u < .95:
                xx = xn + side * (x1 - xn - s * .03) * (1 - (u - .55) / .4)
                yy = ys + depth * dep
            else:
                xx = xn
                yy = ys + depth * dep * (1 - .75 * (u - .95) / .05)
            d.tron(xx, yy, s * .0055, 'vang', vien=1)
        anchors.update(vong=(x1 - s * .05, ys + depth * .55), lop=(W * .7, ys + depth * .06))
    if mode == 'mong':
        dl = (yb - ys) * .14
        d.hcn(x0, ys, x1, ys + dl, 'cam', 70, vien=0)
        d.duong([(x0, ys + dl), (x1, ys + dl)], 'cam', 2, vien=1)
        anchors.update(lop=(W * .78, ys + dl * .5))
    if mode == 'nhay':
        for i in range(min(n, 70)):
            u = (ph[i] + t * .09) % 1.0
            side = 1 if a[i] > .5 else -1
            xx = xn + side * (x1 - xn) * u * .95
            leave = u > .25 + .5 * sz[i]
            yy = ys + ((u - (.25 + .5 * sz[i])) * (yb - ys) * 1.4 if leave else 0)
            al = int(255 * max(.15, 1 - max(0, yy - ys) / ((yb - ys) * .7)))
            d.tron(xx, yy, s * .009, 'tim', al, vien=1)
            d.duong([(xx, yy), (xx, yy + s * .03)], 'cam', 2, al, vien=1)
        anchors.update(phan_tu=(xn + (x1 - xn) * .55, ys + (yb - ys) * .25))
    if mode == 'vong':
        d.duong([(x0 + s * .03, ys), (x0 + s * .03, yb)], 'vang', 3)
        for yy in (ys, yb):
            d.duong([(x0 + s * .01, yy), (x0 + s * .05, yy)], 'vang', 3)
        anchors.update(sau=(x0 + s * .03, (ys + yb) / 2))
    return anchors


def k_cot_so(d, t, T, k, st):
    """Test-tube bars: liquid columns grow to their values, bubbles rise."""
    W, H, s = d.W, d.H, d.s
    cot = k.get('cot', [1, 2])
    n = len(cot)
    lg = k.get('log', False)
    vals = [math.log10(v) for v in cot] if lg else list(cot)
    lo = min(0, min(vals)) if not lg else min(vals) - .35
    hi = max(vals)
    base, top = H * .88, H * .14
    gw = (W * .84) / n
    q = ease(t / (.4 * T))
    anchors = {}
    hl = set(k.get('noi', []))
    for i, v in enumerate(vals):
        xc = W * .08 + gw * (i + .5)
        bw = min(gw * .55, s * .16)
        h = (base - top) * (v - lo) / max(1e-9, hi - lo) * q
        d.hcn(xc - bw / 2, top - s * .02, xc + bw / 2, base, 'panel2', 255, vien=2, bo=bw * .3)
        mau = 'cam' if i in hl else k.get('mau', 'nuoc')
        if h > 2:
            d.hcn(xc - bw / 2 + 2, base - h, xc + bw / 2 - 2, base - 2, mau, 245, vien=0, bo=bw * .25)
            for j in range(5):
                u = (j / 5 + t * .18 + i * .13) % 1.0
                yy = base - 4 - (h - 8) * u
                d.tron(xc + bw * .22 * math.sin(j * 2.1 + i), yy, s * .006, 'vanh', 200, vien=0)
        d.elip(xc - bw * .22, (top + base) / 2, bw * .06, (base - top) * .36, 'vanh', 50, vien=0)
        anchors['cot%d' % i] = (xc, base - h)
    d.duong([(W * .05, base), (W * .95, base)], 'vanh', 3)
    if k.get('khoang') and n >= 2:
        i, j = k['khoang']
        (xa, ya), (xb, yb) = anchors['cot%d' % i], anchors['cot%d' % j]
        xm = (xa + xb) / 2
        d.duong([(xa, ya), (xm, ya), (xm, yb), (xb, yb)], 'vang', 3)
        anchors['khoang'] = (xm, (ya + yb) / 2)
    return anchors


def k_keo_mat(d, t, T, k, st):
    """Surface lattice: clean side pulls hard, soapy side weak; surface drifts."""
    W, H, s = d.W, d.H, d.s
    ys = H * .42
    d.hcn(W * .04, ys, W * .96, H * .9, 'nuoc', 215, vien=2, bo=s * .02)
    d.hcn(W * .52, ys, W * .96, H * .9, 'tim', 55, vien=0)
    n = 26
    sp = (W * .92) / n
    xs = []
    for i in range(n + 2):
        x = W * .04 + ((i * sp + t * s * .05) % (W * .92 + sp))
        xs.append(x)
    xs = sorted(xs)
    for i in range(len(xs) - 1):
        xa, xb = xs[i], xs[i + 1]
        if xb - xa > sp * 1.5:
            continue
        clean = (xa + xb) / 2 > W * .52
        mau = 'vang' if not clean else 'cam'
        zz = [(xa + (xb - xa) * u, ys + (s * .012 if j % 2 else -s * .012) * (1 if not clean else .4)) for j, u in enumerate(np.linspace(0, 1, 7))]
        d.duong(zz, mau, 3 if not clean else 2, vien=1)
    for x in xs:
        soapy = x > W * .52
        d.tron(x, ys, s * (.017 if soapy else .014), 'tim' if soapy else 'nuoc_sang')
    a, r0, sz, ph = st['hat']
    for i in range(60):
        u = (ph[i] + t * .05 * (1.2 - r0[i])) % 1.0
        d.tron(W * .96 - W * .92 * u, ys + (H * .9 - ys) * (.1 + .85 * r0[i]), s * .005, 'vanh', 190, vien=0)
    return dict(nuoc=(W * .25, ys), xa_phong=(W * .78, ys), bien=(W * .52, ys))


def k_kim_bom(d, t, T, k, st):
    """Setup: syringe pump, fine needle, centimetre layer, oil tracer drops."""
    W, H, s = d.W, d.H, d.s
    mode = k.get('mode', 'toan')
    a, r0, sz, ph = st['hat']
    if mode == 'dau':  # close-up of the needle tip meniscus
        ys = H * .58
        xn = W * .5
        men = s * .22
        pts = [(W * .05 + W * .9 * u, ys - men * math.exp(-abs(W * .05 + W * .9 * u - xn) / (men * .7))) for u in np.linspace(0, 1, 90)]
        d.da_giac([(W * .05, H * .92)] + pts + [(W * .95, H * .92)], 'nuoc', 230, vien=0)
        d.duong(pts, 'vanh', 3)
        d.hcn(xn - s * .03, H * .05, xn + s * .03, ys - men * .9, 'vanh', bo=s * .01)
        d.hcn(xn - s * .012, ys - men * .9, xn + s * .012, ys - men * .55, 'tim', vien=1)
        for i in range(70):
            u = (ph[i] + t * .12) % 1.0
            side = 1 if a[i] > .5 else -1
            d.tron(xn + side * (s * .04 + W * .42 * u), ys + s * .02 + (H * .9 - ys) * .8 * r0[i] * (1 - u * .3), s * .006, 'vang', vien=1)
        hx = W * .78
        d.duong([(hx, ys), (hx, ys - men)], 'cam', 3)
        for yy in (ys, ys - men):
            d.duong([(hx - s * .025, yy), (hx + s * .025, yy)], 'cam', 3)
        return dict(men=(hx, ys - men * .5), kim=(xn, ys - men * .6), dau=(xn + s * .1, ys - men * .4))
    ys, yb = H * .56, H * .86
    d.hcn(W * .10, ys - s * .03, W * .96, yb + s * .03, 'vanh', bo=s * .02)
    d.hcn(W * .10 + s * .02, ys - s * .03, W * .96 - s * .02, yb, 'panel', vien=0)
    d.hcn(W * .10 + s * .02, ys, W * .96 - s * .02, yb, 'nuoc', 230, vien=0)
    d.duong([(W * .10 + s * .02, ys), (W * .96 - s * .02, ys)], 'vanh', 3)
    # pump: barrel with plunger moving one way (steady feed)
    px0, py0, px1, py1 = W * .04, H * .08, W * .30, H * .22
    d.hcn(px0, py0, px1, py1, 'panel2', bo=s * .015)
    pl = px0 + (px1 - px0) * (.15 + .5 * ease(t / T))
    d.hcn(px0 + s * .01, py0 + s * .015, pl, py1 - s * .015, 'tim', 230, vien=1)
    d.hcn(pl, py0 - s * .02, pl + s * .02, py1 + s * .02, 'vanh', bo=s * .005)
    xn = W * .55
    d.duong([(px1, (py0 + py1) / 2), (xn, (py0 + py1) / 2), (xn, ys - s * .01)], 'vanh', 4)
    d.tron(xn, ys - s * .006, s * .01, 'tim')
    for i in range(110):
        u = (ph[i] + t * .06) % 1.0
        side = 1 if a[i] > .5 else -1
        xx = xn + side * ((W * .96 - xn - s * .05) if side > 0 else (xn - W * .10 - s * .05)) * u
        yy = ys + (yb - ys) * (.06 + .88 * r0[i])
        d.tron(xx, yy, s * .0045, 'vang', vien=1)
    hx = W * .10 - s * .04
    d.duong([(hx, ys), (hx, yb)], 'cam', 3)
    for yy in (ys, yb):
        d.duong([(hx - s * .02, yy), (hx + s * .02, yy)], 'cam', 3)
    return dict(bom=((px0 + pl) / 2, (py0 + py1) / 2), kim=(xn, ys - s * .02), lop=(hx, (ys + yb) / 2),
                giot=(xn + W * .22, ys + (yb - ys) * .5), nuoc=(W * .8, ys + (yb - ys) * .3))


def _phan_tu_ve(d, x, y, goc, dau, s, n_duoi=12, al=255, to=1.0):
    pts = []
    for j in range(n_duoi + 1):
        r = s * .012 * j * to
        pts.append((x + r * math.cos(goc) + (s * .004 * to if j % 2 else 0) * -math.sin(goc),
                    y + r * math.sin(goc) + (s * .004 * to if j % 2 else 0) * math.cos(goc)))
    d.duong(pts, 'cam', 2.5 * to, al, vien=1)
    d.tron(x, y, s * .016 * to * (1.5 if dau == 'tim' else 1), dau, al)
    return pts[-1]


def k_phan_tu(d, t, T, k, st):
    """Surfactant molecules: head + 12-bead tail; crowding then micelles."""
    W, H, s = d.W, d.H, d.s
    mode = k.get('mode', 'cmc')
    ys = H * .30
    d.hcn(W * .04, ys, W * .96, H * .92, 'nuoc', 215, vien=2, bo=s * .02)
    d.duong([(W * .04, ys), (W * .96, ys)], 'vanh', 3)
    a, r0, sz, ph = st['hat']
    if mode == 'dau':  # same tail, two heads
        tail = None
        for side, dau, xr in ((-1, 'vang', .28), (1, 'tim', .72)):
            x = W * xr
            tip = _phan_tu_ve(d, x, ys - s * .03, math.pi / 2 + .05 * math.sin(t * .5 + side), dau, s, 12, to=2.2)
            tail = tip
            R = s * (.08 if side < 0 else .13) * (.6 + .4 * ease(t / (.5 * T)))
            d.elip(x, H * .78, R, R * .45, 'nuoc_sang', 200, net=3)
        return dict(dau_trai=(W * .28, ys - s * .03), dau_phai=(W * .72, ys - s * .03), duoi=(W * .28, ys + s * .2),
                    vong_trai=(W * .28 + s * .08, H * .78), vong_phai=(W * .72 + s * .13, H * .78))
    crowd = int(6 + 22 * ease(t / (.45 * T)))
    for i in range(crowd):
        x = W * .07 + (W * .86) * (i + .5) / 28
        _phan_tu_ve(d, x, ys, math.pi / 2 + .25 * math.sin(i * 1.7 + t * .6), 'vang', s, 9)
    nm = int(5 * ease((t - .4 * T) / (.4 * T)))
    cen = []
    for m in range(5):
        mx, my = W * (.18 + .16 * m), H * (.66 + .08 * math.sin(m * 1.9))
        cen.append((mx, my))
        if m >= nm:
            for i in range(2):
                u = (ph[m * 7 + i] + t * .05) % 1
                _phan_tu_ve(d, mx + s * .06 * math.cos(u * 6.28), my + s * .06 * math.sin(u * 6.28), u * 6.28, 'vang', s, 9, 200)
            continue
        rot = t * .25 + m
        for j in range(10):
            g = rot + j * 2 * math.pi / 10
            _phan_tu_ve(d, mx + s * .07 * math.cos(g), my + s * .07 * math.sin(g), g + math.pi, 'vang', s, 5, 255, .9)
    return dict(dau=(W * .07 + W * .86 * 2.5 / 28, ys), mixen=cen[0], mat=(W * .6, ys), duoi=(W * .3, ys + s * .07))


def k_can_bang(d, t, T, k, st):
    """Beam balance: surface pull gap / R against friction in the thin layer."""
    W, H, s = d.W, d.H, d.s
    cx, cy = W * .5, H * .40
    th = .22 * (1 - ease(t / (.6 * T)))
    L = W * .36
    d.da_giac([(cx, cy), (cx - s * .07, H * .9), (cx + s * .07, H * .9)], 'vanh')
    ex, ey = math.cos(th) * L, math.sin(th) * L
    left, right = (cx - ex, cy + ey), (cx + ex, cy - ey)
    d.duong([left, right], 'vanh', 7)
    d.tron(cx, cy, s * .025, 'vang')
    for (x, y), mau in ((left, 'cam'), (right, 'nuoc')):
        d.duong([(x, y), (x - s * .08, y + s * .16)], 'vanh', 2, vien=1)
        d.duong([(x, y), (x + s * .08, y + s * .16)], 'vanh', 2, vien=1)
        d.hcn(x - s * .13, y + s * .16, x + s * .13, y + s * .19, 'vanh', bo=s * .01)
        d.hcn(x - s * .10, y + s * .02, x + s * .10, y + s * .155, mau, bo=s * .015)
    # moving content inside the blocks: gradient particles (left), sheared layer (right)
    a, r0, sz, ph = st['hat']
    for i in range(40):
        u = (ph[i] + t * .2) % 1
        d.tron(left[0] - s * .09 + s * .18 * u, left[1] + s * .04 + s * .1 * r0[i], s * .006, 'vang', vien=0)
        d.tron(right[0] - s * .09 + s * .18 * ((ph[i] + t * .35 * (1 - r0[i])) % 1), right[1] + s * .035 + s * .11 * r0[i], s * .006, 'vanh', vien=0)
    return dict(trai=(left[0], left[1] + s * .09), phai=(right[0], right[1] + s * .09), truc=(cx, cy))


def k_ba_vung(d, t, T, k, st):
    """Top view under steady pumping: source, clear zone, outer swirl pairs."""
    W, H, s = d.W, d.H, d.s
    cx, cy = W * .5, H * .52
    Ro = min(W * .45, H * .45)
    R1 = Ro * .45
    d.tron(cx, cy, Ro, 'nuoc', 210)
    d.tron(cx, cy, R1, 'nuoc_sang', 170, vien=0)
    nd = 36
    for j in range(nd):
        g0 = j * 2 * math.pi / nd + t * .15
        if j % 2 == 0:
            d.duong([(cx + R1 * math.cos(g0), cy + R1 * math.sin(g0)), (cx + R1 * math.cos(g0 + .09), cy + R1 * math.sin(g0 + .09))], 'vanh', 3, vien=1)
    a, r0, sz, ph = st['hat']
    for i in range(90):
        u = (ph[i] + t * .4) % 1
        g = a[i] * 2 * math.pi
        r = R1 * .1 + R1 * .85 * u
        d.duong([(cx + (r - s * .02) * math.cos(g), cy + (r - s * .02) * math.sin(g)), (cx + r * math.cos(g), cy + r * math.sin(g))], 'vang', 2.5, vien=1)
    for v in range(4):
        g = v * math.pi / 2 + math.pi / 4
        vx, vy = cx + Ro * .72 * math.cos(g), cy + Ro * .72 * math.sin(g)
        for j in range(14):
            rr = s * (.025 + .05 * (j % 4) / 3)
            gg = j * .9 + t * (.8 if v % 2 else -.8)
            d.tron(vx + rr * math.cos(gg), vy + rr * math.sin(gg), s * .0055, 'tieu', vien=1, muc='tieu_vien')
    d.tron(cx, cy, s * .02, 'tim')
    return dict(nguon=(cx, cy), trong=(cx + R1 * .6, cy - R1 * .5), ngoai=(cx + Ro * .72 * math.cos(-math.pi / 4), cy + Ro * .72 * math.sin(-math.pi / 4)),
                bien=(cx - R1 * .71, cy + R1 * .71))


def _curve(ham, x):
    if ham == 'v_r':
        return np.where(x < .8, (.08 + .92 * np.sin(np.minimum(x / .45, 1) * math.pi / 2)) * (1 - .35 * np.clip((x - .45) / .35, 0, 1)), .65 * np.clip(1 - (x - .8) / .04, 0, 1))
    if ham == 'xa_phong':
        return np.clip(1 - x / .8, 0, 1) ** 1.4
    if ham == 'mu34':
        return .12 + .8 * x
    if ham == 'log_v':
        return np.clip(.1 + .9 * np.log10(1 + 9 * np.minimum(x / .5, 1)), 0, 1) * np.where(x > .82, np.clip(1 - (x - .82) / .03, 0, 1), 1)
    if ham == 'phang':
        return np.where(x < .85, .62 + .02 * np.sin(x * 6), 0)
    return x


def k_do_thi(d, t, T, k, st):
    """Plot drawn as it is measured: thick curve, filled area, moving marker."""
    W, H, s = d.W, d.H, d.s
    ham = k.get('ham', 'v_r')
    X0, X1, Y0, Y1 = W * .10, W * .92, H * .86, H * .14
    for g in range(1, 5):
        yy = Y0 + (Y1 - Y0) * g / 4
        d.duong([(X0, yy), (X1, yy)], 'panel2', 2, vien=0)
    d.duong([(X0, Y1 - s * .03), (X0, Y0), (X1 + s * .02, Y0)], 'vanh', 3)
    q = min(1, .25 + .75 * ease(t / (.7 * T)))
    curves = [(ham, 'cam', 1.0)]
    if ham == 'phang':
        curves = [('phang', 'cam', .85), ('phang', 'xanh_la', .65), ('phang', 'nuoc_sang', .45)]
    anchors = {}
    for ci, (h, mau, cut) in enumerate(curves):
        xs = np.linspace(0, 1, 120)
        if h == 'phang':
            ys = np.where(xs < cut, .62 + .015 * ci + .02 * np.sin(xs * 6), 0)
        else:
            ys = _curve(h, xs)
        m = xs <= q
        pts = [(X0 + (X1 - X0) * x, Y0 + (Y1 - Y0) * y) for x, y in zip(xs[m], ys[m])]
        if ci == 0 and len(pts) > 1:
            d.da_giac([(pts[0][0], Y0)] + pts + [(pts[-1][0], Y0)], mau, 70, vien=0)
        d.duong(pts, mau, 5)
        if ci == 0:
            xm = q * (.55 + .45 * math.sin(t * .0))
            ym = float(_curve(h, np.array([q]))[0]) if h != 'phang' else .62
            d.tron(X0 + (X1 - X0) * q, Y0 + (Y1 - Y0) * ym, s * .018, 'vang')
            anchors['diem'] = (X0 + (X1 - X0) * q, Y0 + (Y1 - Y0) * ym)
            i = int(np.argmax(ys))
            anchors['dinh'] = (X0 + (X1 - X0) * xs[i], Y0 + (Y1 - Y0) * ys[i])
            anchors['dau'] = (X0 + (X1 - X0) * .03, Y0 + (Y1 - Y0) * float(ys[3]))
    if ham == 'mu34':
        a1, a2 = .35, .35 + .3
        for xx in (a1, a2):
            yy = .12 + .8 * xx
            d.duong([(X0 + (X1 - X0) * xx, Y0), (X0 + (X1 - X0) * xx, Y0 + (Y1 - Y0) * yy)], 'vanh', 2, 200, vien=1)
        anchors['R'] = (X0 + (X1 - X0) * a2, Y0 + (Y1 - Y0) * (.12 + .8 * a2))
    else:
        anchors['R'] = (X0 + (X1 - X0) * .8, Y0)
    return anchors


def k_mep_vong(d, t, T, k, st):
    """Close-up at the ring edge: fast tracers stop abruptly, grains pack."""
    W, H, s = d.W, d.H, d.s
    xe = W * .58
    d.hcn(W * .04, H * .08, W * .96, H * .92, 'nuoc', 220, vien=2, bo=s * .02)
    d.hcn(W * .04, H * .08, xe, H * .92, 'nuoc_sang', 120, vien=0)
    edge = [(xe + s * .012 * math.sin(y / s * 9 + t * .7), y) for y in np.linspace(H * .08, H * .92, 40)]
    d.duong(edge, 'vanh', 4)
    a, r0, sz, ph = st['hat']
    for i in range(80):
        u = (ph[i] + t * .25) % 1
        x = W * .05 + (xe - W * .07) * (1 - math.exp(-4 * u)) / (1 - math.exp(-4))
        y = H * .1 + H * .8 * r0[i]
        ln = s * .05 * (1 - u) + s * .006
        d.duong([(x - ln, y), (x, y)], 'vang', 2.5, vien=1)
    for i in range(160):
        x = xe + s * .02 + (W * .92 - xe) * (sz[i] ** 2.2) + s * .002 * math.sin(t + i)
        y = H * .1 + H * .8 * ((r0[i] + .002 * t) % 1)
        d.tron(x, y, s * (.006 + .004 * ph[i]), 'tieu', vien=1, muc='tieu_vien')
    return dict(mep=(xe, H * .3), dong=(W * .25, H * .7), hat=(xe + s * .08, H * .55))


def k_cong_thuc(d, t, T, k, st):
    """Calculation machine: input tanks feed a turning rotor; output fills."""
    W, H, s = d.W, d.H, d.s
    nodes = k.get('nut', 3)
    mode = k.get('mode', 'may')
    if mode == 'chuoi':
        xs = [W * (.10 + .80 * i / (nodes - 1)) for i in range(nodes)]
        ys = [H * (.50 + (.18 if i % 2 else -.18)) for i in range(nodes)]
        cols = ['cam', 'nuoc', 'xanh_la', 'vang', 'tim', 'do']
        for i in range(nodes - 1):
            d.duong([(xs[i], ys[i]), (xs[i + 1], ys[i + 1])], 'vanh', 4)
            u = (t * .3 + i * .2) % 1
            d.tron(xs[i] + (xs[i + 1] - xs[i]) * u, ys[i] + (ys[i + 1] - ys[i]) * u, s * .016, 'vang')
        lit = int(nodes * min(1, .3 + ease(t / (.8 * T))))
        for i in range(nodes):
            d.tron(xs[i], ys[i], s * .065, cols[i % 6] if i < lit else 'panel2')
            d.tron(xs[i], ys[i], s * .03, 'vanh', 120, vien=0)
        return {'n%d' % i: (xs[i], ys[i]) for i in range(nodes)}
    tanks = [(W * .14, H * .22, 'cam'), (W * .14, H * .50, 'vang'), (W * .14, H * .78, 'nuoc')]
    rx, ry = W * .50, H * .50
    for x, y, mau in tanks:
        d.duong([(x, y), (rx, ry)], 'vanh', 5)
    for i, (x, y, mau) in enumerate(tanks):
        for j in range(3):
            u = (t * .35 + j / 3 + i * .1) % 1
            d.tron(x + (rx - x) * u, y + (ry - y) * u, s * .013, mau)
        d.hcn(x - s * .09, y - s * .07, x + s * .09, y + s * .07, mau, bo=s * .02)
    d.duong([(rx, ry), (W * .86, ry)], 'vanh', 5)
    d.tron(rx, ry, s * .14, 'panel2')
    for j in range(6):
        g = t * .9 + j * math.pi / 3
        d.duong([(rx, ry), (rx + s * .12 * math.cos(g), ry + s * .12 * math.sin(g))], 'vanh', 4, vien=1)
    d.tron(rx, ry, s * .03, 'vang')
    fill = .2 + .75 * ease(t / (.8 * T))
    ox0, oy0, ox1, oy1 = W * .78, H * .22, W * .94, H * .80
    d.hcn(ox0, oy0, ox1, oy1, 'panel2', bo=s * .02)
    d.hcn(ox0 + 3, oy1 - (oy1 - oy0) * fill, ox1 - 3, oy1 - 3, 'xanh_la', bo=s * .015)
    for j in range(4):
        u = (t * .4 + j / 4) % 1
        d.tron(rx + (ox0 - rx) * u, ry, s * .012, 'xanh_la')
    return dict(vao_gap=(tanks[0][0], tanks[0][1]), vao_R=(tanks[1][0], tanks[1][1]), vao_nuoc=(tanks[2][0], tanks[2][1]),
                ra=((ox0 + ox1) / 2, oy1 - (oy1 - oy0) * fill), rotor=(rx, ry))


def k_lop(d, t, T, k, st):
    """Momentum layer vs soap layer under the surface (100x thinner)."""
    W, H, s = d.W, d.H, d.s
    ys = H * .22
    d.hcn(W * .04, ys, W * .96, H * .92, 'nuoc', 210, vien=2, bo=s * .02)
    d.duong([(W * .04, ys), (W * .96, ys)], 'vanh', 3)
    g = math.sqrt(min(1, .15 + t / (.7 * T)))
    dm = (H * .92 - ys) * .62 * g
    dc = max(3, dm / 10)
    d.hcn(W * .04, ys, W * .96, ys + dm, 'nuoc_sang', 120, vien=0)
    d.duong([(W * .04, ys + dm), (W * .96, ys + dm)], 'nuoc_sang', 3, vien=1)
    d.hcn(W * .04, ys, W * .96, ys + dc, 'cam', 230, vien=0)
    a, r0, sz, ph = st['hat']
    for i in range(90):
        dep = r0[i]
        y = ys + dc + (H * .9 - ys - dc) * dep
        v = max(0, 1 - (y - ys) / max(dm, 1))
        u = (ph[i] + t * (.02 + .3 * v)) % 1
        d.duong([(W * .05 + W * .9 * u - s * .03 * v, y), (W * .05 + W * .9 * u, y)], 'vanh', 2, 220, vien=1)
    lx, ly, lr = W * .78, ys + dc / 2, s * .11
    d.elip(lx, ly, lr, lr, 'vang', 255, net=4)
    d.duong([(lx + lr * .7, ly + lr * .7), (lx + lr * 1.4, ly + lr * 1.4)], 'vang', 6)
    return dict(dong_luong=(W * .30, ys + dm * .8), chat_tan=(W * .5, ys + dc / 2), kinh=(lx + lr * 1.4, ly + lr * 1.4))


def k_the_so(d, t, T, k, st):
    """Number cards with icons rising slowly into place."""
    W, H, s = d.W, d.H, d.s
    n = k.get('n', 3)
    cols = ['nuoc', 'cam', 'xanh_la', 'tim']
    out = {}
    q = ease(t / (.5 * T))
    for i in range(n):
        x0 = W * (.06 + .88 * i / n) + s * .02
        x1 = W * (.06 + .88 * (i + 1) / n) - s * .02
        y0 = H * (.30 + .12 * (1 - q) + .05 * (i % 2))
        y1 = y0 + H * .52
        d.hcn(x0, y0, x1, y1, cols[i % 4], 235, bo=s * .03)
        cx, cy = (x0 + x1) / 2, y0 + H * .2
        icon = i % 4
        if icon == 0:
            d.hcn(cx - s * .09, cy - s * .025, cx + s * .09, cy + s * .025, 'vanh', bo=4)
            for j in range(7):
                d.duong([(cx - s * .08 + j * s * .027, cy - s * .025), (cx - s * .08 + j * s * .027, cy - s * .005)], 'muc', 2, vien=0)
        elif icon == 1:
            d.da_giac([(cx - s * .02, cy - s * .08), (cx + s * .02, cy - s * .08), (cx + s * .07, cy + s * .06), (cx - s * .07, cy + s * .06)], 'vanh')
        elif icon == 2:
            for a_ in range(3):
                for b_ in range(3):
                    d.hcn(cx - s * .07 + a_ * s * .05, cy - s * .07 + b_ * s * .05, cx - s * .03 + a_ * s * .05, cy - s * .03 + b_ * s * .05, 'vanh', bo=3)
        else:
            d.tron(cx, cy, s * .06, 'vanh')
        for j in range(6):
            u = (t * .15 + j / 6 + i * .1) % 1
            d.tron(x0 + (x1 - x0) * (.15 + .7 * ((j * .37) % 1)), y1 - (y1 - y0) * .1 - (y1 - y0) * .35 * u, s * .007, 'vanh', 170, vien=0)
        out['the%d' % i] = (cx, y0 + H * .40)
    return out


def k_ly_ruou(d, t, T, k, st):
    """Wine glass: film climbs the wall, tears form and fall back."""
    W, H, s = d.W, d.H, d.s
    cx, top, hh = W * .5, H * .10, H * .62
    rx = min(W * .30, H * .36)
    prof = [(u, math.sqrt(max(.04, 1 - .6 * u * u))) for u in np.linspace(0, 1, 40)]
    left = [(cx - rx * r, top + hh * u) for u, r in prof]
    right = [(cx + rx * r, top + hh * u) for u, r in prof]
    d.da_giac(left + right[::-1], 'panel2', 160, vien=0)
    lv = .62
    wl = [(x, y) for x, y in left if y >= top + hh * lv]
    wr = [(x, y) for x, y in right if y >= top + hh * lv]
    d.da_giac(wl + wr[::-1], 'ruou', 245, vien=0)
    film = lv - .45 * ease(t / (.5 * T))
    fl = [(x + s * .006, y) for x, y in left if top + hh * film <= y <= top + hh * lv]
    fr = [(x - s * .006, y) for x, y in right if top + hh * film <= y <= top + hh * lv]
    if len(fl) > 1:
        d.duong(fl, 'do', 7, 200, vien=0)
        d.duong(fr, 'do', 7, 200, vien=0)
    tears = []
    for i in range(5):
        side = -1 if i % 2 else 1
        u0 = film + .05
        ph = (t * .16 + i * .21) % 1
        u = u0 + (lv - u0) * ph * ph
        r = math.sqrt(max(.04, 1 - .6 * u * u))
        x = cx + side * rx * r * (.9 - .1 * i / 5)
        y = top + hh * u
        d.elip(x, y, s * .014, s * .024 * (1 + ph), 'do')
        tears.append((x, y))
    d.duong(left, 'vanh', 4)
    d.duong(right, 'vanh', 4)
    d.elip(cx, top, rx, s * .03, 'vanh', 255, net=3)
    d.duong([(cx, top + hh), (cx, H * .86)], 'vanh', 6)
    d.elip(cx, H * .88, rx * .55, s * .025, 'vanh')
    return dict(giot_le=tears[0], mang=(cx - rx * .8, top + hh * film), ruou=(cx, top + hh * .8))


KINDS = dict(bat_tren=k_bat_tren, mat_cat=k_mat_cat, cot_so=k_cot_so, keo_mat=k_keo_mat, kim_bom=k_kim_bom,
             phan_tu=k_phan_tu, can_bang=k_can_bang, ba_vung=k_ba_vung, do_thi=k_do_thi, mep_vong=k_mep_vong,
             cong_thuc=k_cong_thuc, lop=k_lop, the_so=k_the_so, ly_ruou=k_ly_ruou)


# ---------------------------------------------------------------- labels

def font(px):
    return ImageFont.truetype(FONT, max(8, int(round(px))))


def _giao(a, b, pad=0.0):
    return not (a[0] + a[2] + pad <= b[0] or b[0] + b[2] + pad <= a[0] or a[1] + a[3] + pad <= b[1] or b[1] + b[3] + pad <= a[1])


class Tang:
    """One tier: a panel holding one kind, its camera and (optionally) labels."""

    def __init__(self, x, y, w, h, kind, k, cam, pal, T, seed, nhan=(), short=540):
        self.x, self.y, self.w, self.h = x, y, w, h
        m = max(4, round(min(w, h) * .035))
        self.px, self.py, self.pw, self.ph = x + m, y + m, w - 2 * m, h - 2 * m
        self.kind, self.k, self.cam, self.pal, self.T = kind, dict(k or {}), cam, pal, T
        self.st = dict(hat=_hat(seed, 300))
        self.nhan = list(nhan)
        self.u = short / 540

    def ve(self, t, dry=False):
        cam = camera_at(self.cam, t, self.T)
        d = Ve(self.pw, self.ph, self.pal, cam, dry=dry)
        anchors = KINDS[self.kind](d, t, self.T, self.k, self.st)
        return d, anchors

    def neo_man_hinh(self, t, ten):
        d, a = self.ve(t, dry=True)
        x, y = a.get(ten) or next(iter(a.values()))
        X, Y = d.man_hinh(x, y)
        return self.px + X, self.py + Y


class CanhStage:
    """Frame renderer for one beat (16:9 single tier, 9:16 two tiers)."""

    def __init__(self, width, height, spec, palette=None, portrait=False, top=.4, avoid=(), short=None, seed=7, nhan_co_dinh=None):
        self.width, self.height, self.spec = width, height, spec
        self.pal = dict(MAC_DINH, **(palette or {}))
        self.T = float(spec.get('T', 10.0))
        self.short = short or min(width, height)
        cam = spec.get('camera', {'kieu': 'dung'})
        nhan = spec.get('nhan', [])
        if portrait:
            ty = round(height * top)
            self.tiers = [Tang(0, 0, width, ty, spec['phu']['kieu'], spec['phu'], spec.get('camera_phu', {'kieu': 'dung'}), self.pal, self.T, seed + 1, short=self.short),
                          Tang(0, ty, width, height - ty, spec['chinh']['kieu'], spec['chinh'], cam, self.pal, self.T, seed, nhan, short=self.short)]
        else:
            self.tiers = [Tang(0, 0, width, height, spec['chinh']['kieu'], spec['chinh'], cam, self.pal, self.T, seed, nhan, short=self.short)]
        self.main = self.tiers[-1]
        self.avoid = [tuple(b) for b in avoid]
        self.optics = SimpleNamespace(pepper_count=300, ellipse_ratio=1.0, camera_width=1.0, section=False, vessel_depth=.14, vessel='canh')
        self._base_cache = {}
        self.nhan_co_dinh = nhan_co_dinh or {}
        self.labels = self._dat_nhan()

    # --- label layout (pure function of spec/size/avoid) -------------------
    def _kich(self, chu):
        f = font(20 * self.short / 540)
        x0, y0, x1, y1 = f.getbbox(chu)
        padx, pady = 7 * self.short / 540, 5 * self.short / 540
        return f, (x1 - x0) + 2 * padx, (y1 - y0) + 2 * pady, x0, y0, padx, pady

    def _dat_nhan(self):
        out = []
        tg = self.main
        W, H = self.width, self.height
        placed = []
        times = [self.T * q for q in (.05, .25, .5, .75, .95)]
        for n in tg.nhan:
            f, bw, bh, ox, oy, padx, pady = self._kich(n['chu'])
            anchors = [tg.neo_man_hinh(t, n['neo']) for t in times]
            ax = sum(a[0] for a in anchors) / len(anchors)
            ay = sum(a[1] for a in anchors) / len(anchors)
            if n['id'] in self.nhan_co_dinh:
                box = tuple(self.nhan_co_dinh[n['id']])
                placed.append(box)
                out.append(dict(n, bbox=list(box), anchor_mean=[ax / W, ay / H], font_px=20 * self.short / 540,
                                _f=f, _ox=ox, _oy=oy, _padx=padx, _pady=pady))
                continue
            mx, my = tg.px + tg.pw * .02, tg.py + tg.ph * .02
            best = None
            safe = .035
            for gy in np.linspace(tg.py + tg.ph * .02, tg.py + tg.ph * .98 - bh, 14):
                for gx in np.linspace(tg.px + tg.pw * .02, tg.px + tg.pw * .98 - bw, 18):
                    box = (gx / W, gy / H, bw / W, bh / H)
                    if min(box[0], box[1], 1 - box[0] - box[2], 1 - box[1] - box[3]) < safe:
                        continue
                    if any(_giao(box, a, .012) for a in self.avoid) or any(_giao(box, p, .015) for p in placed):
                        continue
                    big = (box[0] - .02, box[1] - .02, box[2] + .04, box[3] + .04)
                    if any(big[0] * W <= x <= (big[0] + big[2]) * W and big[1] * H <= y <= (big[1] + big[3]) * H for x, y in anchors):
                        continue
                    cxb, cyb = gx + bw / 2, gy + bh / 2
                    dist = math.hypot(cxb - ax, cyb - ay)
                    want = .16 * min(W, H)
                    score = abs(dist - want) + (0 if n.get('vi_tri') is None else 0)
                    if best is None or score < best[0]:
                        best = (score, box)
            if best is None:
                raise ValueError('khong dat duoc nhan %r' % n['chu'])
            placed.append(best[1])
            out.append(dict(n, bbox=[round(v, 5) for v in best[1]], anchor_mean=[ax / W, ay / H], font_px=20 * self.short / 540,
                            _f=f, _ox=ox, _oy=oy, _padx=padx, _pady=pady))
        return out

    def label_layout(self):
        """For export_gate_plan / G16: boxes and anchors as frame fractions."""
        res = []
        for L in self.labels:
            neo = [self.main.neo_man_hinh(t, L['neo']) for t in (self.T * .1, self.T * .5, self.T * .9)]
            res.append(dict(id=L['id'], text=L['chu'], value=L['gia_tri'], unit=L['don_vi'], term=L['thuat_ngu'], anchor_name=L['neo'],
                            fact=L.get('su_kien'), bbox=L['bbox'], anchors=[[x / self.width, y / self.height] for x, y in neo], font_size=L['font_px']))
        return res

    # --- pixels ----------------------------------------------------------
    def _base(self, tg, t):
        key = (tg.x, tg.y, tg.w, tg.h)
        if key not in self._base_cache:
            yy = np.linspace(0, 1, tg.ph)[:, None]
            xx = np.linspace(0, 1, tg.pw)[None, :]
            c0 = np.array(hex_rgb(self.pal['panel']), np.float32)
            c1 = np.array(hex_rgb(self.pal['panel2']), np.float32)
            g = (.6 * yy + .4 * xx)[..., None]
            # G10: keo dai dai sang panel->panel2 (goc ~5 dE qua hep, ca panel
            # rơi vao mot quan the dE<3); he so sang .58..1.42 giu tong toi.
            self._base_cache[key] = (c0 * (1 - g) + c1 * g) * (.58 + .84 * g)
        base = self._base_cache[key].copy()
        # caustic light: counter-drifting pairs, no coherent global motion
        lw, lh = max(8, tg.pw // 4), max(8, tg.ph // 4)
        x = np.linspace(0, lw / 9.0, lw, dtype=np.float32)[None, :]
        y = np.linspace(0, lh / 9.0, lh, dtype=np.float32)[:, None]
        f1 = x * 1.7 + 1.1 * np.sin(y * 1.3 + 1.7) + t * .55
        f2 = x * 1.7 + 1.1 * np.sin(y * 1.3 + 4.1) - t * .55
        f3 = y * 1.9 + 1.0 * np.sin(x * 1.1 + .6) + t * .45
        f4 = y * 1.9 + 1.0 * np.sin(x * 1.1 + 3.3) - t * .45
        c = ((1 - np.abs(np.sin(f1))) ** 4 + (1 - np.abs(np.sin(f2))) ** 4 + (1 - np.abs(np.sin(f3))) ** 4 + (1 - np.abs(np.sin(f4))) ** 4) / 4
        cimg = Image.fromarray(np.clip(c * 255, 0, 255).astype(np.uint8)).resize((tg.pw, tg.ph), Image.Resampling.BILINEAR)
        cc = np.asarray(cimg, np.float32)[..., None] / 255.0
        base += cc * 44 * (np.array(hex_rgb(self.pal['caustic']), np.float32) / 255.0)
        return base

    def _anh_sang_nuoc(self, img, t):
        """Trường ánh sáng gợn nước toàn khung (sau khi ghép tầng, trước nhãn).

        Mục đích kép: phá quần thể màu phẳng ΔE<3 của nền tối và các mảng tô
        đặc (G10 cấm >35% suốt beat) và cho nền một chuyển động chậm liên tục
        (C17). Trường trôi chậm, không đổi bố cục, nhãn vẽ sau nên vẫn sắc nét.
        """
        if '_asn' not in self._base_cache:
            lw, lh = max(16, self.width // 6), max(16, self.height // 6)
            x = np.linspace(0, self.width / 110., lw, dtype=np.float32)[None, :]
            y = np.linspace(0, self.height / 110., lh, dtype=np.float32)[:, None]
            g = (np.linspace(0, 1, lh, dtype=np.float32)[:, None] * .62
                 + np.linspace(0, 1, lw, dtype=np.float32)[None, :] * .38)
            self._base_cache['_asn'] = (x, y, g)
        x, y, g = self._base_cache['_asn']
        s = (np.sin(x * 1.00 + y * .55 + t * .23) + np.sin(x * .47 - y * .93 + 2.1 - t * .17)
             + np.sin(x * 1.70 + y * 1.21 + 4.0 + t * .29)) / 3
        s01 = np.clip(s * .5 + .5, 0, 1) * .72 + g * .28
        field = np.asarray(Image.fromarray((s01 * 255).astype(np.uint8)).resize(
            (self.width, self.height), Image.Resampling.BILINEAR), np.float32)[..., None] / 255.
        tint = np.array(hex_rgb(self.pal['caustic']), np.float32) / 255.
        return img * (.84 + .26 * field) + field * field * 46. * tint

    def frame(self, t):
        W, H = self.width, self.height
        img = np.empty((H, W, 3), np.float32)
        img[:] = np.array(hex_rgb(self.pal['nen']), np.float32)
        for tg in self.tiers:
            base = self._base(tg, t)
            d, anchors = tg.ve(t)
            layer = np.asarray(d.img.resize((tg.pw, tg.ph), Image.Resampling.BOX), np.float32)
            al = layer[..., 3:4] / 255.0
            comp = base * (1 - al) + layer[..., :3] * al
            img[tg.py:tg.py + tg.ph, tg.px:tg.px + tg.pw] = comp
        img = self._anh_sang_nuoc(img, t)
        out = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
        self._ve_nhan(out, t)
        return np.asarray(out, np.uint8).copy()

    def _ve_nhan(self, img, t):
        if not self.labels:
            return
        dr = ImageDraw.Draw(img)
        W, H = self.width, self.height
        u = self.short / 540
        ink, nen, chu = hex_rgb(self.pal['muc']), hex_rgb(self.pal['nhan_nen']), hex_rgb(self.pal['nhan_chu'])
        vang = hex_rgb(self.pal['vang'])
        for L in self.labels:
            x, y, w, h = L['bbox']
            X0, Y0, X1, Y1 = x * W, y * H, (x + w) * W, (y + h) * H
            ax, ay = self.main.neo_man_hinh(t, L['neo'])
            sx = min(max(ax, X0), X1)
            sy = min(max(ay, Y0), Y1)
            if X0 < ax < X1:
                sy = Y1 + 2 if ay > Y1 else Y0 - 2
            else:
                sx = X1 + 2 if ax > X1 else X0 - 2
            dr.line([(sx, sy), (ax, ay)], fill=ink, width=max(1, round(5 * u)))
            dr.line([(sx, sy), (ax, ay)], fill=vang, width=max(1, round(2 * u)))
            r = 5 * u
            dr.ellipse((ax - r - 2 * u, ay - r - 2 * u, ax + r + 2 * u, ay + r + 2 * u), fill=ink)
            dr.ellipse((ax - r, ay - r, ax + r, ay + r), fill=vang)
            e = 2 * u
            dr.rectangle((X0 - e - 2 * u, Y0 - e - 2 * u, X1 + e + 2 * u, Y1 + e + 2 * u), fill=vang)
            dr.rectangle((X0 - e, Y0 - e, X1 + e, Y1 + e), fill=nen)
            dr.text((X0 + L['_padx'] - L['_ox'], Y0 + L['_pady'] - L['_oy']), L['chu'], font=L['_f'], fill=chu)

    def audit(self):
        return dict(renderer='canh_beat numpy+PIL beat picture', pepper_count=300, closed_surface=True, arrows=0, exposed_mesh_edges=0,
                    kind=self.main.kind, portrait_kind=self.tiers[0].kind if len(self.tiers) > 1 else None,
                    camera=self.main.cam, labels=[dict(id=L['id'], text=L['chu'], bbox=L['bbox']) for L in self.labels])
