# -*- coding: utf-8 -*-
"""K1 t3 C17(8): một mặt nước sống thay hình phác tĩnh, không có lớp chuyển động trang trí.

Cơ chế minh hoạ định tính: c(r,t) của chất hoạt động bề mặt, gamma(c),
gradient gamma gây dòng Marangoni, hạt tiêu/tracer được bình lưu theo vận tốc.
Sóng mao dẫn sau giọt rơi là nghiệm gói sóng lan truyền, không dùng rung ngẫu nhiên.
Thông số hình là chuẩn hóa để dễ thấy, KHÔNG phải dự đoán định lượng của thí nghiệm.
"""
import math

import numpy as np
from manim import ImageMobject, VGroup, ValueTracker, always_redraw
from K1_ban_quang_hoc import CANG, NUOC, MUC, NEN_TREN
from K1_canh import trang


def _rgb(code):
    return np.asarray([int(code[i:i + 2], 16) for i in (1, 3, 5)], dtype=float)


class MatNuocSong:
    """Ảnh động bắt nguồn từ trường nồng độ, mặt nước và quỹ đạo hạt (không nhiễu màn hình)."""
    NX, NY = 290, 182

    def __init__(self, mode, bid, duration, scale):
        self.mode, self.bid = mode, bid
        self.duration = max(float(duration), 1.0)
        self.scale = scale
        rng = np.random.default_rng(314159 + sum(ord(c) for c in bid))
        yy, xx = np.mgrid[0:self.NY, 0:self.NX]
        self.x = (xx + .5) / self.NX * 2 - 1
        self.y = (yy + .5) / self.NY * 2 - 1
        self.rad = np.sqrt((self.x / .92) ** 2 + (self.y / .83) ** 2)
        self.theta = np.arctan2(self.y, self.x)
        self.bowl = self.rad <= .985
        self.water = _rgb(NUOC)
        self.soap = _rgb(CANG)
        self.ink = _rgb(MUC)
        self.back = _rgb(NEN_TREN)
        self.npep = 440
        self.p0 = np.sqrt(rng.uniform(.03, .76, self.npep))
        self.pa = rng.uniform(-np.pi, np.pi, self.npep)
        # Tracer mô phỏng giọt chất đánh dấu hòa vào dòng; khác hạt tiêu hữu hạn.
        self.ntr = 340
        self.t0 = rng.uniform(.035, .90, self.ntr)
        self.ta = rng.uniform(-np.pi, np.pi, self.ntr)
        self.speed = rng.uniform(.07, .14, self.ntr)
        self.phase = rng.uniform(-np.pi, np.pi, self.ntr)

    def _dots(self, img, rr, aa, color, radius=2):
        px = np.rint(self.NX * (.5 + .46 * rr * np.cos(aa))).astype(int)
        py = np.rint(self.NY * (.5 + .415 * rr * np.sin(aa))).astype(int)
        for dx, dy in ((0,0),(1,0),(-1,0),(0,1),(0,-1),
                       (1,1),(-1,1),(1,-1),(-1,-1))[:(9 if radius==2 else 5)]:
            X, Y = px + dx, py + dy
            keep = (X >= 0) & (X < self.NX) & (Y >= 0) & (Y < self.NY)
            img[Y[keep], X[keep], :] = color

    def render(self, t):
        t = max(0., float(t))
        R, a = self.rad, self.theta
        continuous = self.mode not in ("marangoni", "comparison")
        # Nguồn một giọt ở hook; các beat bơm và giải thích duy trì chất hoạt động bề mặt.
        u = 1. - np.exp(-t / (4.5 if continuous else 3.4))
        front = .16 + (.63 if continuous else .73) * u
        # Mô hình radial c(r,t) trơn theo r; gamma = 71.97 - 35.54*c (mN/m).
        c = 1. / (1. + np.exp(np.clip((R-front) / .058, -45, 45)))
        if self.mode in ("molecule", "wine_tears"):
            c = .75 * c + .25 * np.exp(-R * 4)
        gamma = 71.97 - 35.54 * c
        # Phản xạ ánh sáng từ gói sóng mao dẫn phát bởi tác động giọt/bơm.
        # Gói sóng có tốc độ lan hữu hạn, biên độ giảm theo bán kính/thời gian.
        packet = np.zeros_like(R)
        launches = [0.0, .35, .8]
        if continuous:
            launches += list(np.arange(2.2, t + 1., 2.2))
        for birth in launches:
            tau = t - birth
            if tau < 0 or tau > 9:
                continue
            loc = .12 + .118 * tau
            shell = np.exp(-((R - loc) / .145) ** 2)
            packet += (17.5 * np.exp(-.085 * tau) * shell *
                       np.sin(35 * (R - loc) - 4.4 * tau))
        # Vệt dòng làm chỗ sáng/tối thay đổi theo đường sức, KHÔNG chèn nhiễu pixel.
        # Dòng mặt hướng ra ngoài khi d(gamma)/dr > 0; lớp đáy hồi lưu ngược về tâm.
        vel = np.exp(-((R-front)/.20)**2) * (1. - np.exp(-t/.65))
        wake = 11.0 * vel * np.sin(15*R - 3.7*t + 1.8*np.cos(3*a))
        drift = 4.2 * np.sin(9.5*R - 2.1*t + 2*np.sin(a)) * (R < .91)
        light = packet + wake + drift
        mix = np.clip((71.97-gamma)/35.54 * .70, 0, .70)
        rgb = (self.water[None,None,:]*(1-mix[:,:,None]) +
               self.soap[None,None,:]*mix[:,:,None] + light[:,:,None])
        # Mặt nước có mép, viền chiếu sáng; trên hình là khay nhìn từ trên.
        rim = (R > .955) & (R < .995)
        rgb = np.where(rim[:,:,None], self.ink, rgb)
        rgb = np.where(self.bowl[:,:,None], rgb, self.back[None,None,:])
        out = np.ascontiguousarray(np.uint8(np.clip(rgb,0,255)))
        # Hạt tiêu hữu hạn chạy từ trong ra mép bởi trường tốc độ Marangoni.
        # dr/dt = v(r,t) xấp xỉ, giảm dần khi hết gradient; KHÔNG hồi sinh hạt.
        displacement = .51 * (1. - np.exp(-t/3.4))
        pep_r = np.clip(self.p0 + displacement*(.92-self.p0),.025,.945)
        pep_a = self.pa + .019 * np.sin(t*.37+self.pa*3)*(1-np.exp(-t/2))
        self._dots(out, pep_r, pep_a, self.ink.astype(np.uint8), 2)
        # Hạt tracer đi theo trường vận tốc ngoài/trong. Điều kiện biên tuần hoàn
        # biểu diễn đánh dấu liên tục của bơm, KHÔNG gán là tiêu mới sinh.
        if continuous or self.mode in ("marangoni", "tension"):
            tr_r = .035 + np.mod(self.t0 + self.speed*t*(.9+.1*np.sin(self.phase)), .89)
            tr_a = self.ta + .027 * np.sin(2*self.ta + .55*t)
            tr_color = np.uint8(np.clip(self.soap*.80+self.water*.20,0,255))
            self._dots(out, tr_r, tr_a, tr_color, 1)
        # Mặt cắt nhỏ bên dưới: ống dòng hồi lưu và màng phân tử.
        # Dịch chuyển của vệt màu gắn cùng vận tốc mặt, không phải mũi tên độc lập.
        band = max(13, self.NY//11)
        z0 = self.NY-band-2
        xx = np.arange(self.NX)
        flow = (xx / max(1,self.NX-1) + .095*t) % 1
        stripes = (np.sin(flow*17*np.pi)**2)*15
        for j in range(band):
            fade = .25+.75*j/max(1,band-1)
            out[z0+j,:, :] = np.uint8(np.clip(
                self.water*(.55+.20*fade) + self.soap*(.45-.20*fade) +
                (stripes if j < band//3 else -stripes)[:,None],0,255))
        return out

    def radial_cm(self,t):
        return 3.5*(.16+.73*(1-np.exp(-max(0,t)/3.4)))

    def gamma(self,t):
        return 71.97-35.54*(1-np.exp(-max(0,t)/3.4))


def bat_mo_phong(layer):
    """Che phần hình phác cũ bằng BẢN THÂN mặt nước sống; giữ nguyên cột chữ TTS."""
    x0,x1,y0,y1 = layer.F
    if x1-x0 < .5 or y1-y0 < .5:
        L=layer.vung_noi_dung()
        x0,x1=L[0]+.12,L[0]+.54*(L[1]-L[0])
        y0,y1=L[2]+.18,L[3]-.38
    w,h=x1-x0,y1-y0
    if w <= .5 or h <= .5:
        raise ValueError("C17_8_VUNG_HINH_QUA_HEP "+layer.b["id"])
    xc,yc=(x0+x1)/2,(y0+y1)/2
    law=layer.b.get("chuyen_dong_chinh") or {}
    if not all(law.get(k) for k in ("vat_chuyen_dong","luat_chuyen_dong","chay_lien_tuc")):
        raise ValueError("C17_8_THIEU_LUAT "+layer.b["id"])
    sim=MatNuocSong(law["co_che"],layer.b["id"],law["t_ra_s"],(w,h))
    layer._c17_t=ValueTracker(0)
    layer._c17_t.add_updater(lambda mob,dt: mob.increment_value(dt))
    layer.sc.add(layer._c17_t)
    live=always_redraw(lambda: ImageMobject(sim.render(layer._c17_t.get_value()))
                       .stretch_to_fit_width(w).stretch_to_fit_height(h)
                       .move_to([xc,yc,0]))
    layer._c17_hats=live
    layer.sc.add(live)
    layer.hinh_ds.append(live)
    layer.sc._co_chuyen_dong_song=True
    fw,fh=trang.config.frame_width,trang.config.frame_height
    roi=((x0+fw/2)/fw,(fh/2-y1)/fh,w/fw,h/fh)
    if min(roi)<0 or roi[0]+roi[2]>1.00001 or roi[1]+roi[3]>1.00001:
        raise ValueError("C17_8_ROI_NGOAI_KHUNG "+layer.b["id"])
    print("C17_ROI %s %s %.6f %.6f %.6f %.6f" %
          (layer.b["id"],layer.W.bc.ten,*roi),flush=True)
    # Không dùng câu lệnh thay đổi tốc độ chỉ để lách phép đo chuyển động.
    # Các cue TTS vẫn chạy phần sự kiện của lớp cảnh gốc, không đổi lời/mốc.
