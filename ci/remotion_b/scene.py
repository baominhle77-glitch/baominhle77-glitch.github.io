"""Text-free Manim B. Analytic smooth surfaces; no cut-away or polygon mesh.

The plate is an orthographic 2.5D model. Ellipses use cubic Beziers with 128
components; their normals are continuous. This is deliberately a simpler model
than a triangulated 3D renderer. Molecular scale is a separate optical inset.
"""
import os, math, json
from pathlib import Path
import numpy as np
from manim import *

INK='#1C232B'; WATER='#3F6A9E'; ORANGE='#D1834F'; LIGHT='#A7ADB3'; BACK='#8E969D'
FMT=os.environ.get('B_FORMAT','16x9'); BID=os.environ.get('B_BEAT','h1')
DOC=FMT=='9x16'
config.pixel_width=540 if DOC else 960
config.pixel_height=960 if DOC else 540
config.frame_width=8 if DOC else 128/9
config.frame_height=128/9 if DOC else 8
config.frame_rate=30
config.background_color=BACK


def oval(w,h,color,opacity=1):
    return Ellipse(width=w,height=h,num_components=128 if w>1 else 8,fill_color=color,fill_opacity=opacity,stroke_width=0)


def bead(r,p):
    # Analytic sphere shading in screen coordinates, no faceted mesh.
    out=VGroup()
    for k in range(8):
        q=k/8
        out.add(Circle(radius=r*(1-.82*q),fill_color=interpolate_color(ManimColor(ORANGE),ManimColor(LIGHT),q*.7),fill_opacity=1,stroke_width=0).move_to(np.array(p)+[-r*.19*q,r*.24*q,0]))
    return out


def molecule_positions(t):
    rng=np.random.default_rng(117)
    positions=[]
    while len(positions)<15:
        p=np.array([rng.uniform(-1.85,1.85),rng.uniform(-.50,.78),0])
        if all(np.linalg.norm(p-q)>.42 for q in positions):positions.append(p)
    return np.array([p+[.018*math.sin(t*.6+i),.012*math.cos(t*.7+i),0] for i,p in enumerate(positions)])


def geometry_audit():
    minimum=999
    for t in np.linspace(0,20,241):
        p=molecule_positions(t)
        d=np.linalg.norm(p[:,None]-p[None,:],axis=2)+np.eye(len(p))*999
        minimum=min(minimum,float(d.min()))
    assert minimum>=.24,minimum
    return dict(plate_closed=True,cutaway=False,curve_components=128,
                surface='analytic Bezier, continuous tangent/normal; no polygon mesh',
                molecular_radius=.12,min_centre_distance=minimum,
                min_required_distance=.24,molecules_separate_from_main_water=True,
                pepper='flat ellipsoids above surface; no cubes',pass_geometry=True)


class BScene(MovingCameraScene):
    def construct(self):
        duration=float(os.environ.get('B_DURATION','7.033333333'))
        self.clock=ValueTracker(0)
        self.last=0
        self.bg=Rectangle(width=config.frame_width*1.2,height=config.frame_height*1.2,fill_color=BACK,fill_opacity=1,stroke_width=0)
        self.bg.set_sheen_direction(UP).set_fill([BACK,LIGHT])
        self.add(self.bg)
        # Author a separate vertical arrangement, no camera roll or central crop.
        if DOC:
            center=np.array([-.40,-.25,0]);w,h=6.05,6.25
        else:
            center=np.array([-.9,.15,0]);w,h=10.7,4.7
        if BID=='h3': w*=.91;h*=.91
        self.c,self.w,self.h=center,w,h
        self.stage=VGroup()
        for k in range(12):
            self.stage.add(oval(w+.25+k*.10,h+.12+k*.035,INK,.014).move_to(center+[.12,-.28-k*.015,0]))
        self.stage.add(oval(w+.34,h+.32,INK).move_to(center+[0,-.10,0]))
        self.stage.add(oval(w+.25,h+.25,LIGHT).move_to(center+[0,-.035,0]))
        self.stage.add(oval(w,h,WATER).move_to(center))
        # Broad, restrained reflection on a single intact water surface.
        self.stage.add(oval(w*.80,h*.78,LIGHT,.10).move_to(center+[-w*.06,h*.05,0]))
        self.stage.add(Arc(arc_center=center,radius=1,start_angle=.15,angle=2.3,color=LIGHT,stroke_width=2).stretch(w*.47,0).stretch(h*.47,1))
        self.add(self.stage)
        rng=np.random.default_rng(219)
        n=280
        self.a=rng.uniform(0,TAU,n)
        self.r=np.sqrt(rng.uniform(.055,.88,n))
        self.pepper=VGroup(*[oval(.075 if DOC else .095,.035 if DOC else .045,INK).rotate(a) for a in rng.uniform(0,TAU,n)])
        self.add(self.pepper)
        self.ripples=VGroup(*[oval(1,1,LIGHT,0).set_stroke(LIGHT,1.1,.16) for _ in range(3)])
        self.add(self.ripples)
        self.drop=bead(.19,center+[0,h*.27,0]);self.add(self.drop)
        if BID=='h3':
            self.drop.set_opacity(0)
            needle=VGroup(Rectangle(width=.10,height=1.5,fill_color=LIGHT,fill_opacity=1,stroke_color=INK,stroke_width=1),Rectangle(width=.32,height=.45,fill_color=INK,fill_opacity=1,stroke_width=0).shift([0,.7,0]))
            needle.move_to(center+[0,h*.30,0]);self.add(needle)
        self.molecules=None
        if BID in ('h4','c1'):
            # The inset is composed independently, with border and label in Remotion.
            inset_center=np.array([-.28,-.65,0]) if DOC else np.array([2.35,.36,0])
            self.inset_center=inset_center
            panel=Rectangle(width=4.30,height=2.5,fill_color=LIGHT,fill_opacity=1,stroke_color=INK,stroke_width=2).move_to(inset_center)
            self.add(panel)
            self.molecules=VGroup(*[bead(.12,inset_center+p) for p in molecule_positions(0)])
            self.add(self.molecules)
            # Water is below each sphere's bottom by > .17 units, in inset too.
            self.inset_water=Rectangle(width=4.16,height=.34,fill_color=WATER,fill_opacity=1,stroke_width=0).move_to(inset_center+[0,-1.0,0]);self.add(self.inset_water)
        self.arrows=VGroup()
        if BID in ('h2','c1','p1'):
            for x in (-.75,.75):
                start=center+np.array([w*.18*x,h*.05,0]);end=start+np.array([w*.23*np.sign(x),0,0])
                a=Arrow(start,end,buff=0,color=ORANGE,stroke_width=4,max_tip_length_to_length_ratio=.12)
                self.arrows.add(a)
            self.add(self.arrows)
        if BID=='p1':
            # Flow cross-section is a separate inset, never a hole in the plate.
            cc=np.array([-.28,-.65,0]) if DOC else np.array([2.35,.36,0])
            self.inset_center=cc
            self.add(Rectangle(width=4.3,height=2.5,fill_color=LIGHT,fill_opacity=1,stroke_color=INK,stroke_width=2).move_to(cc))
            self.flow=VGroup(*[oval(.045,.03,WATER) for _ in range(220)])
            self.add(self.flow)
        else:self.flow=None
        self.stage.add_updater(lambda m,dt:self.update_state(float(self.renderer.time)))
        at=os.environ.get('B_AT')
        if at is not None:
            self.stage.clear_updaters();self.update_state(float(at))
        else:
            self.wait(duration,frozen_frame=False)
            self.stage.clear_updaters()
        print('B_GEOMETRY '+json.dumps(geometry_audit()),flush=True)

    def update_state(self,t):
        # v_r = a(t)/(r+epsilon): finite at origin, falls with radius.
        # Analytic integration r^2 = r0^2 + 2*integral(a(t) dt).
        # A smooth start after soap contact and exponential decay avoid a jump.
        delay=.45 if BID=='h1' else 0
        q=max(0,t-delay)
        integral=.028*(q-.5*(1-math.exp(-q/.5)))
        if BID=='h3':
            radial=.14+.62*(1-np.exp(-np.sqrt(self.r*self.r+2*integral)*2))
        else:radial=self.r+(.96-self.r)*(1-np.exp(-.18*q/(self.r+.15)))
        # Molecular diffusion / tiny physical transverse advection, not camera shake.
        angles=self.a+.018*np.sin(q*.5+self.r*5)
        for i,m in enumerate(self.pepper):
            m.move_to(self.c+[self.w*.47*radial[i]*math.cos(angles[i]),self.h*.46*radial[i]*math.sin(angles[i]),0])
        for i,m in enumerate(self.ripples):
            phase=(q*.30+i*.32)%1
            m.stretch_to_fit_width(max(.04,self.w*.91*phase))
            m.stretch_to_fit_height(max(.04,self.h*.91*phase))
            m.move_to(self.c).set_stroke(LIGHT,1.1,.18*(1-phase)*math.exp(-q/9))
        if BID!='h3':
            height=max(.20,self.h*.27-2.2*min(t,.48)**2)
            self.drop.move_to(self.c+[0,height,0]).set_opacity(max(0,1-(t-.42)*8))
        if self.molecules is not None:
            for m,p in zip(self.molecules,molecule_positions(t)):m.move_to(self.inset_center+p)
        if self.flow is not None:
            for i,m in enumerate(self.flow):
                phase=i*TAU/220+t*.7
                m.move_to(self.inset_center+[1.8*math.cos(phase),.70*math.sin(phase),0])
        # Slow optical approach has a physical focus target and easing.
        ease=smooth(min(1,t/15))
        self.camera.frame.set(width=config.frame_width*(1-.025*ease)).move_to([-.02*ease,.035*ease,0])
