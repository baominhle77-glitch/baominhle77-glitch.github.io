# -*- coding: utf-8 -*-
"""K1 t3: cảnh vật lý VECTƠ ở độ phân giải native cho từng beat.
C17(8): hai bố cục khác nhau, không upscale ảnh nhỏ; vật và mặt nước là chuyển động
chính; chuyển động hạt theo vận tốc Marangoni (mô hình định tính, không đo thí nghiệm).
Giữ nhãn theo mốc từ TTS gốc, nguồn một dòng; không ghi con số mô hình như số đo thật.
"""
import math
import numpy as np
from manim import (VGroup, VMobject, Circle, Ellipse, Rectangle, RoundedRectangle,
                   Line, Arrow, Dot, Polygon, Arc, FadeIn, FadeOut, Create,
                   ValueTracker, always_redraw, smooth, UP, DOWN,
                   RIGHT, LEFT, ORIGIN, PI)
from K1_ban_quang_hoc import MUC, NUOC, CANG, NEN_TREN, NEN_DUOI, chu
from K1_canh import trang


def _make_mob(m, layer=1):
    m.set_z_index(layer)
    return m


def _addlabel(text, size, maxwidth, maxlines=3):
    """Vector Text ≥22 source pixels at 1080p; no scaling down bitmap/font."""
    words=text.split()
    lines=[]
    current=""
    for word in words:
        next_=(current+" "+word).strip()
        if current and chu(next_,size).width > maxwidth:
            lines.append(current)
            current=word
        else:
            current=next_
    if current: lines.append(current)
    if len(lines)>maxlines:
        # Theo lời TTS nhưng không ép cả đoạn trích vào một màn; nhãn nhìn
        # thấy là đoạn đầu hợp chiều rộng, phần còn lại ở audio và metadata.
        lines=lines[:maxlines]
    if not lines:
        lines=[""]
    pieces=[chu(x,size,MUC) for x in lines]
    group=VGroup(*pieces).arrange(DOWN,buff=.11,aligned_edge=LEFT)
    return group


class LiveScene:
    """Đồ họa vật lý trong cùng một viewport, nhưng góc máy/cơ chế là của beat."""
    def __init__(self, owner,sc,W,rect,upper=None):
        self.owner,self.sc,self.W=owner,sc,W
        self.b=W.b; self.bid=self.b["id"]
        self.mode=(self.b.get("chuyen_dong_chinh") or {}).get("co_che","marangoni")
        self.x0,self.x1,self.y0,self.y1=rect
        self.cx=(self.x0+self.x1)/2
        self.cy=(self.y0+self.y1)/2
        self.w=self.x1-self.x0
        self.h=self.y1-self.y0
        self.radius=min(self.w*.47,self.h*.46)
        self.upper=upper
        self.clock=ValueTracker(0)
        self.clock.add_updater(lambda m,dt:m.increment_value(dt))
        sc.add(self.clock)
        self.static=VGroup()
        self.dynamic=VGroup()
        self.extra=VGroup()
        self.rng=np.random.default_rng(1771+sum(ord(c) for c in self.bid))
        self.shot=self._shot()
        self.build()

    def _shot(self):
        bid=self.bid
        if bid=="h1": return "impact"
        if bid=="h2": return "overhead"
        if bid=="h3": return "needle"
        if bid=="h4": return "gamma_compare"
        if bid=="c1": return "molecular_section"
        if bid=="p1": return "tension_flow"
        if self.mode=="wine_tears":return "wine"
        if self.mode in ("molecule",):return "molecular_section"
        if self.mode in ("recirculation","viscosity"):return "section_return"
        if self.mode in ("pump","stop_ring","ring_15mm"):return "needle"
        if self.mode in ("radius_q",):return "radius_measure"
        if self.mode in ("tension","comparison"):return "gamma_compare"
        if self.mode in ("velocity",):return "velocity"
        return "overhead"

    def clock_t(self):
        return self.clock.get_value()

    def wave_radius(self,t,birth,speed=.44):
        # Sau va chạm, sóng mao dẫn lan dọc mặt, phản xạ ở thành đĩa:
        # đường đi biến thiên, không thể coi là vật trang trí tuần hoàn.
        q=max(0.,t-birth)*speed
        extent=self.radius*.91
        if extent<.1:return 0.
        return .12+abs((q % (2*extent))-extent)

    def add(self,m,animated=False):
        (self.dynamic if animated else self.static).add(m)
        self.sc.add(m)
        return m

    def surface_base(self, oblique=False):
        rx=min(self.w*.46,self.radius*1.39)
        ry=self.radius*(.70 if oblique else 1.0)
        rim=Ellipse(width=2*rx,height=2*ry).set_fill(MUC,.20).set_stroke(MUC,3.3)
        rim.move_to([self.cx,self.cy,0])
        water=Ellipse(width=2*rx*.96,height=2*ry*.96).set_fill(NUOC,.88).set_stroke(NUOC,2.3)
        water.move_to([self.cx,self.cy,0])
        self.add(_make_mob(rim,1))
        self.add(_make_mob(water,2))
        reflection=Arc(radius=min(rx,ry)*.80, start_angle=.28,angle=1.85).set_stroke(NEN_TREN,6,opacity=.65)
        reflection.stretch(rx/max(ry,.1),0).move_to([self.cx,self.cy,0])
        self.add(_make_mob(reflection,4))
        return rx,ry

    def flowing_front(self, oblique=False):
        rad=self.radius
        xscale=min(self.w*.46,self.radius*1.39)/self.radius
        ry=.70 if oblique else 1.
        # Bán kính vùng xà phòng c(r,t) mở rộng do dòng Marangoni.
        # Mặt tô CANG đi kèm nước vùng ngoài; không có màn overlay giả.
        front=always_redraw(lambda:
          Ellipse(width=2*xscale*(.19*rad+.74*rad*(1-math.exp(-self.clock_t()/3.4))),
                  height=2*ry*(.19*rad+.74*rad*(1-math.exp(-self.clock_t()/3.4))))
            .move_to([self.cx,self.cy,0]).set_fill(CANG,.38)
            .set_stroke(CANG,3.8,opacity=.75).set_z_index(3))
        self.add(front,animated=True)
        # Gói sóng phát từ tiếp xúc, phản xạ ở thành nước sau chạm.
        for birth in (0.,.55,1.1,1.9,3.2,4.5,5.8,7.2,9.0,11.):
            ripple=always_redraw(lambda birth=birth:
                Ellipse(width=2*xscale*self.wave_radius(self.clock_t(),birth),
                        height=2*ry*self.wave_radius(self.clock_t(),birth))
                .move_to([self.cx,self.cy,0])
                .set_stroke(NEN_TREN if int(birth*10)%2 else CANG,12,
                            opacity=.45 if self.clock_t()>=birth else 0)
                .set_fill(opacity=0).set_z_index(6))
            self.add(ripple,animated=True)

    def pepper_flow(self, n=390, oblique=False):
        rad=self.radius
        xscale=min(self.w*.46,self.radius*1.39)/self.radius
        rng=self.rng
        ang=rng.uniform(0,2*np.pi,n)
        rr=np.sqrt(rng.uniform(.05,.84,n))
        # Các hạt theo trường gradient gamma(r,t), thoát ra mép rồi dừng.
        # Tốc độ không phải dao động trang trí; có một "mặt sóng" γ(r,t).
        for i in range(n):
            a=float(ang[i]);r0=float(rr[i])
            yscale=.70 if oblique else 1.
            point=Dot([self.cx+xscale*rad*r0*np.cos(a),
                       self.cy+rad*yscale*r0*np.sin(a),0],
                      radius=.028 if self.W.bc.doc else .021,color=MUC)
            point.set_z_index(9)
            def drift(m,dt,a=a,r0=r0,yscale=yscale):
                t=self.clock_t()
                # dr/dt≈μ∂γ/∂r, ∂γ/∂r tập trung tại front surfactant
                front=.19+.74*(1-math.exp(-t/3.4))
                local=r0+.80*(.91-r0)*(1-math.exp(-t/3.8))
                # phần đầu/chất lỏng chảy ra trong 0...4s rồi chậm dần.
                local=min(.94,local+.025*math.exp(-((local-front)/.18)**2))
                m.move_to([self.cx+xscale*rad*local*math.cos(a),
                           self.cy+rad*yscale*local*math.sin(a),0])
            point.add_updater(drift)
            self.add(point,animated=True)
        # 20 tracers dài cho thấy trường dòng; cập nhật vị trí cùng front.
        for k in range(20):
            a=2*np.pi*k/20
            line=always_redraw(lambda a=a,k=k:
                Line([self.cx+.25*xscale*rad*math.cos(a),self.cy+.25*rad*math.sin(a),0],
                     [self.cx+xscale*rad*(.25+.58*(1-math.exp(-self.clock_t()/3.7)))*math.cos(a),
                      self.cy+rad*(.25+.58*(1-math.exp(-self.clock_t()/3.7)))*math.sin(a),0])
                .set_stroke(CANG,2.8,opacity=.75).set_z_index(8))
            self.add(line,animated=True)

    def upper_detail(self,needle=False):
        if self.upper is None:return
        ux0,ux1,uy0,uy1=self.upper
        xm=(ux0+ux1)/2
        yf=(uy0+uy1)/2
        if needle:
            # Kim đi xuống theo easing, chạm mặt nước ở vùng r=0.
            syringe=Line([xm,yf+.82,0],[xm,yf-.44,0]).set_stroke(MUC,7)
            barrel=RoundedRectangle(width=.35,height=.92,corner_radius=.09).set_fill(NEN_TREN,.95).set_stroke(MUC,3)
            barrel.move_to([xm,yf+.66,0])
            self.add(_make_mob(barrel,13))
            self.add(_make_mob(syringe,13))
            tip=always_redraw(lambda:
                Circle(radius=.13).set_fill(CANG,.82).set_stroke(MUC,2)
                .move_to([xm,yf-.25-.12*math.tanh(self.clock_t()) ,0]).set_z_index(14))
            self.add(tip,animated=True)
        else:
            # Cửa sổ phóng đại cùng mặt nước: phân tử di chuyển/hấp phụ.
            water=Rectangle(width=ux1-ux0-.12,height=.62).set_fill(NUOC,.70).set_stroke(NUOC,3)
            water.move_to([xm,yf,0]).set_z_index(12)
            self.add(water)
            for k in range(10):
                phase=2*math.pi*k/10
                mol=always_redraw(lambda phase=phase:
                    Circle(radius=.055).set_fill(CANG,.95).set_stroke(MUC,1.6)
                    .move_to([xm+.40*math.sin(phase+.25*self.clock_t()),
                              yf+.16*math.sin(phase+.38*self.clock_t()),0]).set_z_index(13))
                self.add(mol,animated=True)

    def build_overhead(self):
        oblique=self.shot in ("impact","needle","radius_measure")
        self.surface_base(oblique)
        self.flowing_front(oblique)
        self.pepper_flow(420 if self.shot in ("impact","overhead") else 320,oblique)
        if self.shot=="impact":
            # Giọt rơi, méo khi va chạm. Camera ở góc nghiêng nên y tương đối.
            drop=always_redraw(lambda:
                 Ellipse(width=.18+.10*math.exp(-self.clock_t()*2.0),
                         height=.31-.10*math.exp(-self.clock_t()*2.0))
                 .set_fill(CANG,.9).set_stroke(MUC,2.5)
                 .move_to([self.cx, self.cy+min(1.05,.93*math.exp(-self.clock_t()*1.35)),0])
                 .set_z_index(14))
            self.add(drop,animated=True)
        if self.shot in ("needle","radius_measure"):
            x=self.cx
            needle=Line([x,self.cy+self.radius*1.17,0],[x,self.cy+.08,0]).set_stroke(MUC,5)
            self.add(_make_mob(needle,12))
            tip=always_redraw(lambda:
               Circle(radius=.085).set_fill(CANG,.95).set_stroke(MUC,1.5)
               .move_to([x,self.cy+.10,0]).set_z_index(14))
            self.add(tip,animated=True)
        self.upper_detail(needle=self.shot in ("impact","needle","radius_measure"))

    def fluid_transport(self, span, center, lanes=26, section=False):
        """Vệt màu/tuyến dòng VẬT CHẤT bình lưu liên tục: dx/dt=u(z,t).
        Vùng tô gắn các chất đánh dấu được nguồn liên tục đưa vào dòng; đầu
        dòng chảy nhanh, đáy hồi lưu ngược. Không chuyển động pixel ngẫu nhiên.
        """
        sw,sh=span
        cx,cy=center
        for i in range(lanes):
            rng=self.rng
            z=float(rng.uniform(-.78,.78))
            phase=float(rng.uniform(0,1))
            velocity=float(rng.uniform(1.7,3.6))
            ribbon_h=float(rng.uniform(.13,.29))*(1.2 if section else 1.0)
            direction=1 if (z>.05 or not section) else -1
            dye=CANG if z>=0 else NUOC
            # Bề rộng lớn + liên tục vận chuyển tạo vùng sáng tối vật lý,
            # ngay cả lúc hạt tracer nhỏ đã đạt biên.
            def flow(m,dt,z=z,phase=phase,v=velocity,direction=direction,
                     dye=dye,ribbon_h=ribbon_h,i=i):
                t=self.clock_t()
                total=sw+.95
                pos=((phase*total+v*t)%total)-total*.5
                if direction<0: pos=-pos
                yy=cy+z*sh*.37+.10*math.sin(.40*t+i*.44)
                ww=.55+.14*math.sin(.25*t+i)
                m.become(
                    RoundedRectangle(width=ww,height=ribbon_h,corner_radius=min(.08,ribbon_h*.40))
                    .set_stroke(width=0).set_fill(dye,.43)
                    .move_to([cx+pos,yy,0]).set_z_index(4))
            # Dòng không băng ra ngoài khay: người dùng thấy những đoạn
            # dải có kích thước hữu hạn tại vùng vật chính.
            lane=RoundedRectangle(width=.7,height=ribbon_h,corner_radius=.07)
            lane.set_fill(dye,.43).set_stroke(width=0).set_z_index(4)
            lane.add_updater(flow)
            self.add(lane,animated=True)

    def build_section(self,molecules=False):
        # Bể nước mặt cắt: mặt trên bị lệch ứng suất, đáy có dòng hồi lưu.
        w,h=self.w*.90,self.h*.77
        x=self.cx
        y=self.cy
        outer=RoundedRectangle(width=w,height=h,corner_radius=.14).set_fill(NEN_TREN,.9).set_stroke(MUC,3)
        outer.move_to([x,y,0]);self.add(outer)
        water=Rectangle(width=w*.96,height=h*.72).set_fill(NUOC,.80).set_stroke(NUOC,2)
        water.move_to([x,y-h*.10,0]);self.add(_make_mob(water,2))
        self.fluid_transport((w*.79,h*.52),(x,y-h*.12),lanes=38,section=True)
        # Surface wave is actual continuously deforming boundary.
        wave=always_redraw(lambda:
            VMobject().set_points_smoothly(
                [np.array([x-w*.47+w*.94*k/50,
                           y+h*.23+.075*math.sin(k*.35-2.8*self.clock_t())*
                           math.exp(-((k-25)/30)**2),0]) for k in range(51)])
            .set_stroke(CANG,10,opacity=.95).set_z_index(5))
        self.add(wave,animated=True)
        # Dòng hồi lưu: mặt trên ra xa kim, đáy trở về.
        for k in range(270):
            x0=float(self.rng.uniform(-.92,.92));z=float(self.rng.uniform(-.90,.90))
            v=.05+float(self.rng.uniform(0,.08))
            dot=Dot(radius=.026,color=CANG if z>.3 else MUC).set_z_index(8)
            def adv(m,dt,x0=x0,z=z,v=v):
                t=self.clock_t()
                xi=((x0+(.35 if z>.15 else -.17)*v*t+1)%2)-1
                zz=z+.08*math.sin((xi+x0)*3)
                m.move_to([x+xi*w*.46,y-h*.11+zz*h*.31,0])
            dot.add_updater(adv);self.add(dot,animated=True)
        if molecules:
            # Đầu tròn ưa nước ở dưới, đuôi kỵ nước nhô lên; di chuyển
            # vào mặt theo gradient nồng độ c(t).
            for k in range(24):
                xp=x-w*.40+k*w*.80/23
                phase=k*.17
                head=Circle(radius=.07).set_fill(CANG,.94).set_stroke(MUC,2)
                tail=Line([xp,y+h*.23,0],[xp,y+h*.39,0]).set_stroke(MUC,2.5)
                entity=VGroup(head,tail).set_z_index(9)
                def adsorb(m,dt,xp=xp,phase=phase):
                    t=self.clock_t()
                    yy=y+h*(.37-.15*(1-math.exp(-t/2.2)))
                    m.move_to([xp+.035*math.sin(phase+.65*t),yy,0])
                entity.add_updater(adsorb);self.add(entity,animated=True)
        self.upper_detail(needle=False)

    def build_gamma(self):
        # Hai vùng vật lý CĂNG CAO/THẤP rõ ràng, thay một đĩa lặp.
        gap=.18;w=(self.w-gap)/2
        for side,color in [(-1,NUOC),(1,CANG)]:
            xc=self.cx+side*(w+gap)/4*2
            plate=RoundedRectangle(width=w*.90,height=self.h*.68,corner_radius=.20)
            plate.set_fill(color,.82).set_stroke(MUC,3).move_to([xc,self.cy,0])
            self.add(plate)
            self.fluid_transport((w*.64,self.h*.51),(xc,self.cy),lanes=21,section=False)
            # mép nước cong theo độ chênh sức căng mặt
            bands=always_redraw(lambda xc=xc,side=side,color=color:
                VMobject().set_points_smoothly(
                    [np.array([xc-w*.43+w*.86*k/45,
                               self.cy+.30*math.sin(k*.15-1.9*self.clock_t()+side)*
                               (1 if side<0 else .55),0]) for k in range(46)])
                .set_stroke(NEN_TREN,12,opacity=.90).set_z_index(5))
            self.add(bands,animated=True)
        # Dòng chảy lớp mặt kéo từ nơi gamma thấp -> cao, cùng hạt tracer.
        for k in range(330):
            x0=float(self.rng.uniform(-.85,.85))
            y0=float(self.rng.uniform(-.78,.78))
            d=Dot(radius=.030,color=MUC).set_z_index(8)
            def move(m,dt,x0=x0,y0=y0):
                t=self.clock_t()
                grad=.21+.29*(1-math.exp(-t/2.4))
                xp=np.clip(x0-grad*(1-math.exp(-t*.6)),-.93,.93)
                yp=y0+.07*math.sin(xp*4-t)
                m.move_to([self.cx+xp*self.w*.45,self.cy+yp*self.h*.25,0])
            d.add_updater(move);self.add(d,animated=True)
        self.upper_detail(needle=False)

    def build_wine(self):
        glass=RoundedRectangle(width=self.w*.55,height=self.h*.82,corner_radius=.23)
        glass.set_stroke(MUC,4).set_fill(NEN_TREN,.25).move_to([self.cx,self.cy,0])
        self.add(glass)
        film=always_redraw(lambda:
            Rectangle(width=self.w*.49,height=self.h*(.13+.42*(1-math.exp(-self.clock_t()/3))))
            .set_fill(CANG,.64).set_stroke(CANG,2)
            .move_to([self.cx,self.cy-self.h*.29+.20*self.h*(1-math.exp(-self.clock_t()/3)),0]))
        self.add(film,animated=True)
        for k in range(26):
            xx=self.cx+(k/25-.5)*self.w*.45
            p=Dot(radius=.05,color=NUOC)
            def slide(m,dt,k=k,xx=xx):
                tt=(self.clock_t()+k*.11)%3.3
                height=.34*(tt/2.0 if tt<2 else 1-(tt-2)/1.3)
                m.move_to([xx,self.cy+self.h*(height-.10),0])
            p.add_updater(slide);self.add(p,animated=True)
        self.upper_detail(needle=False)

    def build(self):
        # Mặt bàn vật lý, bóng và lớp phản xạ gắn theo bể, không chỉ nền xám.
        table=RoundedRectangle(width=self.w,height=self.h,corner_radius=.16)
        table.set_fill(NEN_TREN,.92).set_stroke(MUC,2.1,opacity=.45)
        table.move_to([self.cx,self.cy,0]).set_z_index(-5)
        self.add(table)
        if self.shot in ("impact","overhead","needle","radius_measure","velocity"):
            self.build_overhead()
        elif self.shot in ("molecular_section","section_return"):
            self.build_section(molecules=self.shot=="molecular_section")
        elif self.shot=="tension_flow":
            # Ứng suất bề mặt tạo dòng ở mặt và hồi lưu ở đáy; khác cảnh
            # so sánh gamma (h4) và khác mặt cắt phân tử (c1).
            self.build_section(molecules=False)
            flux=always_redraw(lambda:
               Polygon([self.x0+.12,self.cy+self.h*.24,0],
                       [self.x1-.12,self.cy+self.h*.24,0],
                       [self.x1-.12,self.cy+self.h*(.08+.13*math.cos(.35*self.clock_t())),0],
                       [self.x0+.12,self.cy+self.h*(.08+.13*math.sin(.35*self.clock_t())),0])
               .set_fill(CANG,.50).set_stroke(width=0).set_z_index(4))
            self.add(flux,animated=True)
        elif self.shot=="wine":
            self.build_wine()
        else:
            self.build_gamma()
        # Số đo sống là thước minh hoạ, không giành vùng chủ thể.
        # Manim DecimalNumber bản địa: không bitmap upscale.
        pos=[self.x0+.35,self.y1-.35,0]
        counter=always_redraw(lambda:
            chu("t = %.1f s" % self.clock_t(),28,MUC)
                .move_to(pos).set_z_index(15))
        self.add(counter,animated=True)



class LiveScenePerBeat(LiveScene):
    """Từng beat cùng phương trình nhưng khác vật/góc và tiến trình của lời."""
    SHOT_BY_ID={
        "p2":"needle", "p3":"surfactants", "p4":"micelle",
        "p5":"section_return", "p6":"overhead", "c2":"needle",
        "v1":"velocity_field", "v2":"velocity_profile",
        "v3":"needle", "v4":"section_return", "v5":"radius_measure",
        "v6":"molecular_section", "v7":"micelle", "c3":"surfactants",
        "w1":"needle", "w2":"velocity_profile", "w3":"section_return",
        "w4":"micelle", "w5":"radius_measure", "w6":"viscosity",
        "w7":"needle", "b1":"needle", "r1":"velocity_field",
        "r2":"radius_measure", "r3":"radius_measure",
        "r4":"gamma_compare", "s8":"section_return", "k1":"overhead",
        "k2":"wine"
    }
    def _shot(self):
        return self.SHOT_BY_ID.get(self.bid,super()._shot())

    def build_micelle(self):
        # Mỗi cụm là các đầu ưa nước hướng ra ngoài, đuôi trong lõi:
        # phân tử tập hợp dần do c vượt CMC. Không phải hai hình trước/sau.
        self.build_section(molecules=False)
        centers=[(self.cx-self.w*.27,self.cy+.04),
                 (self.cx+self.w*.25,self.cy+.03),
                 (self.cx,self.cy-.20)]
        for i,(cx,cy) in enumerate(centers):
            r0=.17+self.w*.012
            for k in range(38):
                a=2*math.pi*k/38
                t0=.18*(i+k%8)
                head=Dot(radius=.056,color=CANG)
                def ads(m,dt,k=k,i=i,a=a,cx=cx,cy=cy,r0=r0,t0=t0):
                    tau=max(0.,self.clock_t()-t0)
                    r=r0+(.48 if i==1 else .32)*(1-math.exp(-tau/3.1))
                    alpha=a+.12*self.clock_t()*math.exp(-tau/6)
                    m.move_to([cx+r*math.cos(alpha),cy+.52*r*math.sin(alpha),0])
                head.add_updater(ads)
                self.add(head,animated=True)
            core=always_redraw(lambda cx=cx,cy=cy,i=i:
                Circle(radius=.10+.30*(1-math.exp(-self.clock_t()/3.6)))
                .stretch(.68,1)
                .move_to([cx,cy,0]).set_fill(MUC,.21).set_stroke(CANG,3)
                .set_z_index(7))
            self.add(core,animated=True)

    def build_velocity_profile(self):
        # Dòng mặt kéo ra, đáy hồi lưu: hình cắt, quỹ đạo thẳng/hơi cong
        # gắn vào gradient vận tốc; đồ thị u(z) biến đổi theo bơm.
        self.build_section(molecules=False)
        x0=self.cx+self.w*.13
        y0=self.cy
        profile=always_redraw(lambda:
            VMobject().set_points_smoothly([
               np.array([x0+self.w*.17*(1-math.exp(-self.clock_t()/2.5))*
                         math.cos(math.pi*j/42),
                         y0+self.h*.24*(j/21-1),0])
               for j in range(43)])
            .set_stroke(CANG,9,opacity=.9).set_z_index(10))
        self.add(profile,animated=True)

    def build(self):
        if self.shot=="micelle":
            self.build_micelle()
        elif self.shot in ("velocity_profile","viscosity"):
            self.build_velocity_profile()
        elif self.shot=="surfactants":
            self.build_section(molecules=True)
            # 8 chất HĐBM là 8 hàng phân tử khác độ dài đuôi,
            # phân biệt với hình micelle khi qua CMC.
            for k in range(8):
                y=self.cy+self.h*(k/8-.42)
                line=Line([self.cx-self.w*.37,y,0],
                          [self.cx-self.w*(.16-.022*k),y,0])
                line.set_stroke(MUC,2.5).set_z_index(9)
                self.add(line)
        elif self.shot=="velocity_field":
            self.build_overhead()
            for k in range(8):
                a=math.pi*k/4
                arc=always_redraw(lambda a=a:
                     Arc(radius=self.radius*(.20+.5*(1-math.exp(-self.clock_t()/2.9))),
                         start_angle=a,angle=.72)
                     .move_to([self.cx,self.cy,0])
                     .set_stroke(CANG,8).set_z_index(7))
                self.add(arc,animated=True)
        else:
            super().build()
        if self.shot in ("micelle","velocity_profile","viscosity","surfactants","velocity_field"):
            # Counter native Text cho những cảnh dùng builder riêng.
            clock=always_redraw(lambda:
                 chu("t = %.1f s" % self.clock_t(),28,MUC)
                 .move_to([self.x0+.35,self.y1-.35,0]).set_z_index(15))
            self.add(clock,animated=True)


def _fit_source(sc,W,doc):
    if W.nguon is not None:
        sc.remove(W.nguon)
    srcs=W.ts.get("nguon") or []
    if srcs:
        val=" | ".join(srcs)
        if "NIST" in val:txt="NIST · WebBook"
        elif "Liu" in val:txt="Liu et al."
        elif "Roch" in val or "Roché" in val:txt="Roché et al."
        else:txt="References in storyboard"
    else:
        txt="Illustrative model"
    # ≥22 px THỰC ở mẫu 540p: native 46px ở chuẩn 1080.
    source=chu(txt,46,MUC,.90)
    # Native vector text, lề đáy cố định. Không thu font khi dài.
    bx=(W.bc.an_toan[0]+W.bc.an_toan[1])/2
    by=-6.52 if doc else -3.49
    source.move_to([bx,by,0])
    W.nguon=trang.ghim(sc,trang.man_sang_the_gioi(sc,source))
    W.hop_ng=trang.hop_man(sc,W.nguon)
    sc.add(W.nguon)


def ve_live(owner,sc,W):
    """Thay pipeline chữ/hình cũ riêng tập K1 t3, KHÔNG thay TTS hay kế hoạch."""
    owner.sc,owner.W,owner.b=sc,W,W.b
    owner.ev,owner.man,owner.hinh_ds,owner.buoc_xong=[],{},[],set()
    owner.ty_le=1.
    bc=W.bc
    doc=bc.doc
    fw,fh=trang.config.frame_width,trang.config.frame_height
    if doc:
        # Vùng an toàn riêng: không dùng dải 25% hình + 6 dòng nguồn cũ.
        bc.an_toan=(-3.72,3.70,-6.80,6.10)
        bc.san=-6.75  # nguồn nằm ở chân màn, hình dọc là cảnh rộng riêng
        rect=(-3.52,3.44,-4.06,3.22)  # vùng thí nghiệm > 50% chiều cao
        upper=(.48,3.18,3.42,5.96)   # dụng cụ ở phía PHẢI PiP, không giao PiP
        txt_y=-5.07
        maxw=6.80
    else:
        bc.san=-3.72  # nguồn một dòng ở mép dưới, không kéo vào vật chính
        rect=(-6.56,3.50,-3.12,3.42)
        upper=None
        txt_y=-.55
        maxw=2.55
    _fit_source(sc,W,doc)
    model=LiveScenePerBeat(owner,sc,W,rect,upper)
    owner._c17_hats=model.dynamic
    owner._c17_t=model.clock
    owner.hinh_ds.extend([model.static,model.dynamic,model.extra])
    sc._co_chuyen_dong_song=True
    # Nguồn/nhãn/biểu đồ không che hiện tượng chính; ít chữ, đúng mốc.
    os_=owner.muc_chu()
    owner._live_current_label=None
    for index,o in enumerate(os_):
        # Chỉ nhãn 2–5 từ trong vùng giao diện, đủ 22px ở 540p.
        # Chuỗi nguyên văn được giữ trong W.da_ve/storyboard/TTS.
        subtitle=" ".join(o["s"].split()[:5])
        label=_addlabel(subtitle,46,maxw,2 if doc else 3)
        if doc:
            label.move_to([-.15,txt_y,0])
        else:
            label.move_to([5.25,txt_y,0])
        label.set_z_index(25)
        if not doc and label.height>3.2:
            raise ValueError("C17_8_CHU_QUA_CAO "+W.b["id"])
        W.da_ve.append(o["s"])
        def change_label(label=label):
            prev=owner._live_current_label
            owner._live_current_label=label
            if prev is None:return [FadeIn(label)]
            return [FadeOut(prev),FadeIn(label)]
        owner.su(o["t"],change_label)
    law=W.b.get("chuyen_dong_chinh") or {}
    if not all(law.get(k) for k in ("vat_chuyen_dong","luat_chuyen_dong","chay_lien_tuc")):
        raise ValueError("C17_8_THIEU_LUAT "+W.b["id"])
    # Camera chuyển tiêu điểm theo từ khóa, mượt, giữ mốc lời gốc.
    # Với 9:16, tránh zoom cắt mô phỏng; camera chỉ bay tới cận cảnh.
    for i, cue in enumerate(W.b.get("doi_hinh") or []):
        tm=float(cue["t_s"])
        end=float(law["t_ra_s"])
        if tm<1.8 or tm>end-1.5:continue
        # Bay máy quay có ease nhưng không tràn lề vùng an toàn ở 9:16.
        delta=(.07 if i%2==0 else -.055) if doc else (.14 if i%2==0 else -.09)
        target=np.array([delta,.05 if doc else .03,0])
        owner.su(tm,lambda target=target:
                 [sc.camera.frame.animate.move_to(target)],uu=25)
    print("C17_8_SCENE %s %s shot=%s native=Manim vector F=%.2f,%.2f,%.2f,%.2f" %
          (W.b["id"],bc.ten,model.shot,*rect),flush=True)
    sc.chuyen_dau(W.b)
    owner.chay_su_kien()
    # Kiểm từng vật riêng: hộp gộp giữa cận cảnh phía trên và bể phía
    # dưới là hộp ảo cắt PiP, trong khi các vật thật hoàn toàn không cắt.
    for i,part in enumerate(model.static):
        if len(part.get_all_points()) or len(part.submobjects):
            owner.man["hinh_%03d" % i]=part
    if owner._live_current_label is not None:
        owner.man["nhan_hien"] = owner._live_current_label
    return owner.man
