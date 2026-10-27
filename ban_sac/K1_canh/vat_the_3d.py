"""Reusable physical objects, not scene templates. Units are illustrative."""
import math,os
import numpy as np
from manim import (VGroup, Surface, Sphere, Cylinder, Prism, Line, VMobject,
                   OUT, IN, ManimColor, Polygon, Cone)
from K1_ban_quang_hoc import MUC, NUOC, CANG, NEN_TREN, NEN_DUOI


def mesh_resolution(u,v):
    return (min(u,16),min(v,12)) if os.environ.get('K1_PREVIEW_HEIGHT') else (u,v)


def force_arrow(start,end):
    start,end=np.array(start),np.array(end)
    direction=(end-start)/np.linalg.norm(end-start)
    shaft_end=end-.14*direction
    shaft=Cylinder(radius=.025,height=np.linalg.norm(shaft_end-start),direction=direction,resolution=mesh_resolution(12,2),fill_color=CANG,checkerboard_colors=False,stroke_width=0).move_to((start+shaft_end)/2)
    tip=Cone(direction=direction,base_radius=.08,height=.14,resolution=mesh_resolution(2,12),fill_color=CANG,checkerboard_colors=False,stroke_width=0).shift(end)
    return VGroup(shaft,tip)


def sphere(radius, color, position=(0,0,0), detail=(5,8)):
    if os.environ.get("K1_PREVIEW_HEIGHT"):detail=(min(4,detail[0]),min(6,detail[1]))
    return Sphere(radius=radius, resolution=detail, fill_color=color,
                  checkerboard_colors=False, stroke_width=0).move_to(position)


class PepperGrain(VGroup):
    """A closed eight-face solid; tiny seeds must not become flat low-res spheres."""
    def __init__(self,radius=.035,color=MUC):
        faces=[]
        for sx in (-1,1):
            for sy in (-1,1):
                for sz in (-1,1):
                    points=np.array([[sx*radius,0,0],[0,sy*radius,0],[0,0,sz*radius]])
                    if np.dot(np.cross(points[1]-points[0],points[2]-points[0]),points.mean(axis=0))<0:points=points[::-1]
                    faces.append(Polygon(*points,fill_color=color,fill_opacity=1,stroke_width=0))
        super().__init__(*faces)
        self.set_shade_in_3d(True)


def surface_height(r,t,radius,impulse=False):
    r=np.asarray(r)
    if impulse:
        front=radius-abs((.95*t)%(2*radius)-radius)
        envelope=np.exp(-((r-front)/.45)**2)*math.exp(-t/7)
        return .08*min(1,t*4)*envelope*np.sin(8*(r-front))
    return .065*min(1,t)*np.sin(3.1*r-2.7*t)*np.sin(np.minimum(r,1.3))


def ceramic(radius=3, depth=.65, opening=2*math.pi):
    # Outer and inner curved ceramic walls; an open sector reveals depth.
    wall=Surface(lambda u,v: np.array([(radius+.17*math.sin(v))*math.cos(u),
        (radius+.17*math.sin(v))*math.sin(u),  .01-depth*math.sin(v)]),
        u_range=(0,opening),v_range=(0,math.pi),resolution=mesh_resolution(32,5),
        fill_color=NEN_TREN,checkerboard_colors=False,stroke_width=0)
    rim=Surface(lambda u,v: np.array([(radius+.11*math.cos(v))*math.cos(u),
        (radius+.11*math.cos(v))*math.sin(u), .01+.11*math.sin(v)]),
        u_range=(0,opening),v_range=(0,2*math.pi),resolution=mesh_resolution(40,4),
        fill_color=NEN_TREN,checkerboard_colors=False,stroke_width=0)
    foot=Cylinder(radius=radius*.65,height=.18,resolution=mesh_resolution(20,2),fill_color=NEN_TREN,checkerboard_colors=False,stroke_width=0).move_to([0,0,-depth-.09])
    foot.set_z_index(-50,family=True)
    return VGroup(wall,rim,foot)


def water(radius=2.96, depth=.55, sector=2*math.pi,impulse=False):
    bulk=Surface(lambda u,v: np.array([radius*math.cos(u),radius*math.sin(u),-v]),
        u_range=(0,sector),v_range=(.05,depth),resolution=mesh_resolution(32,2),
        fill_color=NUOC,checkerboard_colors=False,stroke_width=0)
    top=Surface(lambda r,a: np.array([r*math.cos(a),r*math.sin(a),0]),
        u_range=(0,radius),v_range=(0,sector),resolution=mesh_resolution(8,36),
        fill_color=NUOC,checkerboard_colors=False,stroke_width=0)
    points=[part.points.copy() for part in top]
    def wave(t):
        for part,original in zip(top,points):
            p=original.copy(); r=np.hypot(p[:,0],p[:,1])
            p[:,2]=surface_height(r,t,radius,impulse)
            part.set_points(p)
    return VGroup(bulk,top),wave


def table(width=15, length=15):
    # Extruded planks; wood grain is physical relief, not a flat overlay.
    planks=VGroup()
    for i in range(10):
        plank=Prism(dimensions=(width/10-.015,length,.22),fill_color=CANG,
                    fill_opacity=1,stroke_width=0)
        plank.move_to([-width/2+width*(i+.5)/10,0,-1.23])
        planks.add(plank)
    return planks.set_z_index(-100,family=True)


def needle(position=(0,0,1.5), height=2.1):
    shaft=Cylinder(radius=.075,height=height,direction=OUT,resolution=mesh_resolution(12,2),
                   fill_color=NEN_TREN,checkerboard_colors=False,stroke_width=0)
    collar=Cylinder(radius=.18,height=.40,direction=OUT,resolution=mesh_resolution(12,2),
                    fill_color=MUC,checkerboard_colors=False,stroke_width=0)
    shaft.move_to(position);collar.move_to(np.array(position)+[0,0,height/2-.1])
    return VGroup(shaft,collar)


def molecule(position=(0,0,0), tail=5, head_radius=.14):
    head=sphere(head_radius,CANG,detail=(4,6))
    chain=VGroup(*[sphere(.065,MUC,(.05*(-1)**k,0,.18+k*.13),detail=(3,4))
                   for k in range(tail)])
    return VGroup(head,chain).shift(position)


def trail(points,color=CANG,width=3):
    return VMobject(stroke_color=color,stroke_width=width).set_points_smoothly(points)


def cloud(n=320, radius=2.8, seed=7, z=.1, color=MUC, flow='outward',extent=None,surface_radius=3.,impulse=False):
    rng=np.random.default_rng(seed)
    angles=rng.uniform(0,2*math.pi,n);radii=np.sqrt(rng.uniform(.035,.85,n))*radius
    grain_radius=.035 if n>=400 else .045
    group=VGroup(*[PepperGrain(grain_radius,color).rotate(i*2.399,axis=np.array([.3,.7,1])) for i in range(n)])
    paths=VGroup(*[trail([[0,0,z],[.02,0,z]],color=color,width=2.0) for _ in range(24)])
    def position(i,t):
        a=angles[i];r=radii[i];depth_offset=0.
        if flow=='outward':
            r=r+(radius-r)*(.78*(1-math.exp(-t/4)))
            a+=.09*math.sin(t*.6+r)
        elif flow in ('steady','profile','growing','confined'):
            if flow!='confined' or r<radius*.65:
                phase=(r/radius+t*.12)%1
                bound=radius*(extent(t) if flow=='growing' else .65 if flow=='confined' else 1)
                if phase<.65:
                    progress=phase/.65
                    if flow=='profile':progress=progress*progress*(3-2*progress)
                    r=bound*(.10+.80*progress)
                else:
                    progress=(phase-.65)/.35
                    r=bound*(.90-.80*progress)
                    depth_offset=-.70*math.sin(math.pi*progress)
                a+=.04*math.sin(t*.4)
        elif flow=='vortices':
            direction=1 if i%2 else -1
            a+=direction*.65*t
            x=direction*radius*.63+radius*.27*math.cos(a)
            y=radius*.37*math.sin(a)
            return np.array([x,y,float(surface_height(math.hypot(x,y),t,surface_radius,impulse))+grain_radius*.7])
        elif flow=='return':
            phase=t*.65+i
            r=radius*(.55+.30*math.cos(phase))
            depth_offset=-.30-.29*math.sin(phase)
        return np.array([r*math.cos(a),r*math.sin(a),float(surface_height(r,t,surface_radius,impulse))+grain_radius*.7+depth_offset])
    previous=np.zeros((n,3))
    def update(t):
        for i,m in enumerate(group):
            target=position(i,t);m.shift(target-previous[i]);previous[i]=target
        for i,path in enumerate(paths):
            k=(i*max(1,n//24))%n
            path.set_points_smoothly([position(k,max(0,t-lag)) for lag in np.linspace(.55,0,7)])
    update(0)
    return VGroup(group,paths),update
