"""B round 2: six authored optical scales, continuous water and live transport.
Analytic Bezier surfaces avoid faceted/wireframe artifacts. Text is Remotion.
"""
import math,os,json
import numpy as np
from manim import *
INK='#1C232B';WATER='#3F6A9E';ORANGE='#D1834F';LIGHT='#A7ADB3';BACK='#8E969D'
DOC=os.environ.get('B_FORMAT','16x9')=='9x16';BID=os.environ.get('B_BEAT','h1')
SHORT=int(os.environ.get('B_SHORT_SIDE','540'))
config.pixel_width=SHORT if DOC else round(SHORT*16/9);config.pixel_height=round(SHORT*16/9) if DOC else SHORT
config.frame_width=8 if DOC else 128/9;config.frame_height=128/9 if DOC else 8;config.frame_rate=30
config.background_color=BACK

def oval(w,h,c,op=1):return Ellipse(width=w,height=h,num_components=128 if w>1 else 8,fill_color=c,fill_opacity=op,stroke_width=0)
def sphere(r,p,c=ORANGE):
 g=VGroup()
 for k in range(4):
  q=k/4;g.add(Circle(radius=r*(1-.82*q),fill_color=interpolate_color(ManimColor(c),ManimColor(LIGHT),q*.75),fill_opacity=1,stroke_width=0).move_to(np.array(p)+[-r*.19*q,r*.24*q,0]))
 return g

def geometry_audit():
 return dict(plate_closed=True,cutaway=False,curve_components=128,exposed_mesh_edges=0,surface='analytic Bezier optical projection; continuous normals',molecular_radius=.13,min_centre_distance=.47,min_required_distance=.26,pepper='flat ellipses with soft shadows, transported radially',pass_geometry=True)

class BScene(MovingCameraScene):
 def construct(self):
  self.duration=float(os.environ.get('B_DURATION','7.033333333'));self.updates=[];self.particle_count=0;self.world=VGroup();self.min_sphere_distance=float('inf')
  bg=Rectangle(width=config.frame_width*1.5,height=config.frame_height*1.5,fill_color=BACK,fill_opacity=1,stroke_width=0);bg.set_fill([BACK,LIGHT]).set_sheen_direction(UP);self.add(bg)
  if BID in ('h1','h2','h3'):self.plate_scene()
  elif BID=='h4':self.molecular_scene(two_zones=True)
  elif BID=='c1':self.molecular_scene(two_zones=False)
  else:self.section_scene()
  assert self.particle_count<=400,('PARTICLE_LIMIT',self.particle_count)
  self.add(self.world)
  def tick(m,dt):self.update(float(self.renderer.time))
  at=os.environ.get('B_AT')
  if at is not None:self.update(float(at))
  else:
   self.world.add_updater(tick);self.wait(self.duration,frozen_frame=False);self.world.clear_updaters()
  audit=geometry_audit();audit['particle_count']=self.particle_count;audit['min_centre_distance']=None if math.isinf(self.min_sphere_distance) else self.min_sphere_distance
  print('B_GEOMETRY '+json.dumps(audit),flush=True)

 def add_world(self,*m):self.world.add(*m)
 def plate_scene(self):
  if DOC:
   c=np.array([-.2,-1.10,0]);w,h=6.75,8.65
  else:
   c=np.array([-.25,-.05,0]);w,h=12.3,5.7
  # Different optics: overhead, low oblique, steady-feeding laboratory macro.
  if BID=='h1':h*=.96
  if BID=='h2':
   h*=.88 if DOC else .60
   if not DOC:c[1]+=.55
   else:c[1]=-.75
  self.c,self.w,self.h=c,w,h
  for k in range(6):self.add_world(oval(w+.15+k*.075,h+.18+k*.02,INK,.018).move_to(c+[.14,-.38-k*.014,0]))
  # Curved ceramic exterior has a visible thickness and a separate inner lip.
  depth=(2.0 if DOC else 2.1) if BID=='h2' else (1.3 if DOC and BID=='h1' else .35)
  for k in range(16):
   q=k/15;self.add_world(oval(w+.24,h+.22,interpolate_color(ManimColor(INK),ManimColor(LIGHT),.28+.72*q)).move_to(c+[0,-depth+depth*q,0]))
  self.add_world(oval(w+.12,h+.11,LIGHT).move_to(c+[0,.035,0]))
  water=oval(w-.11,h-.11,WATER).move_to(c);self.add_world(water)
  self.add_world(oval(w*.91,h*.88,LIGHT,.08).move_to(c+[0,.045,0]))
  # Curved moving specular reflection is tied to surface-wave displacement.
  highlights=VGroup()
  for j in range(2):
   arc=ParametricFunction(lambda a: c+np.array([w*.46*math.cos(a),h*.43*math.sin(a),0]),t_range=(.55+j*.015,2.55-j*.015),color=LIGHT,stroke_width=1.5,stroke_opacity=.08+j*.025)
   highlights.add(arc)
  self.add_world(highlights)
  rng=np.random.default_rng(219);n=280 if BID=='h2' else 320
  angles=rng.uniform(0,TAU,n);rad=np.sqrt(rng.uniform(.025,.91,n));self.pepper=VGroup();shadows=VGroup()
  for a in angles:
   shadows.add(oval(.11,.045,INK,.20).rotate(a));self.pepper.add(oval(.085,.038,INK).rotate(a))
  self.add_world(shadows,self.pepper)
  # Advected dye/tracer filaments make the velocity field visible, not arrows.
  paths=VGroup(*[VMobject(stroke_color=LIGHT,stroke_width=2.6,stroke_opacity=.42) for _ in range(110)]) if BID=='h2' else VGroup()
  self.add_world(paths)
  self.particle_count=n+len(paths)
  drop=sphere(.20,c+[0,h*.22,0]);self.add_world(drop)
  rings=VGroup(*[oval(.05,.05,LIGHT,0).set_stroke(LIGHT,1.8,.35) for _ in range(4)]);self.add_world(rings)
  if BID=='h3':
   # A tall needle at the right of the portrait PiP; the basin stays intact.
   x=1.50 if DOC else -.45;bottom=c+[x,h*.15,0]
   tip=Line(bottom,bottom+[0,3.2 if DOC else 2.1,0],color=LIGHT,stroke_width=7)
   collar=Rectangle(width=.40,height=.65,fill_color=INK,fill_opacity=1,stroke_width=0).move_to(tip.get_end()+[0,.25,0]);self.add_world(tip,collar)
  def pos(i,t):
   q=max(0,t-(.45 if BID=='h1' else 0));a=angles[i]+.018*math.sin(t*.7+rad[i]*8)
   if BID=='h3':
    rr=.43+.28*(1-math.exp(-2*rad[i]))+.025*math.sin(t*.65+i);a+=.10*t/(.3+rad[i])
   else:rr=rad[i]+(.96-rad[i])*(1-math.exp(-.20*q/(rad[i]+.10)))
   return c+np.array([w*.475*rr*math.cos(a),h*.475*rr*math.sin(a),0])
  def update(t):
   for i,m in enumerate(self.pepper):
    p=pos(i,t);m.move_to(p);shadows[i].move_to(p+[.027,-.036,0])
   for i,path in enumerate(paths):
    # A continuous inflow of liquid tracers, radial speed falls as 1/(r+eps).
    a=angles[i];phase=(i*.618+t*.18)%1;rr=.06+.87*math.sqrt(phase)
    pts=[c+np.array([w*.475*max(.01,rr-d)*math.cos(a+.05*math.sin(t*.5)),h*.475*max(.01,rr-d)*math.sin(a+.05*math.sin(t*.5)),0]) for d in np.linspace(.075,0,5)]
    path.set_points_smoothly(pts)
   for j,m in enumerate(rings):
    q=max(0,t-.45-j*.18);p=min(.99,.07+q*.38);m.stretch_to_fit_width(max(.04,w*p));m.stretch_to_fit_height(max(.04,h*p));m.move_to(c).set_stroke(LIGHT,1.6,max(0,.45*(1-p))*math.exp(-q/4))
   if BID=='h1':
    q=min(1,t/.45);yy=.20+(h*.22-.20)*(1-q*q);drop.move_to(c+[0,yy,0]).set_opacity(max(0,1-(t-.45)*9))
   else:drop.set_opacity(0)
   for j,a in enumerate(highlights):a.set_stroke(opacity=.18+.035*math.sin(t*.9+j))
   # Camera flight towards the visible soap impact, smooth and bounded.
   ease=smooth(min(1,t/max(1,self.duration)))
   zoom=0 if DOC else (.025 if BID=='h1' else .035)
   self.camera.frame.set(width=config.frame_width*(1-zoom*ease)).move_to([(-.025 if DOC else -.10)*ease,0 if DOC else .015*math.sin(math.pi*ease),0])
  self.updates.append(update)

 def molecular_scene(self,two_zones=False):
  # A distinct low-angle surface view; the entire water stays filled and closed.
  left,right=(-3.6,3.6) if DOC else (-6.2,6.2)
  y=2.25 if DOC else 1.35;bottom=-6.40 if DOC else -3.55
  water=Rectangle(width=right-left,height=y-bottom,fill_color=WATER,fill_opacity=.86,stroke_width=0).move_to([(left+right)/2,(y+bottom)/2,0]);self.add_world(water)
  front=Rectangle(width=right-left,height=.20,fill_color=INK,fill_opacity=.22,stroke_width=0).move_to([(left+right)/2,bottom-.08,0]);self.add_world(front)
  surface=VMobject(stroke_color=LIGHT,stroke_width=3);self.add_world(surface)
  n=(9 if DOC else 17) if two_zones else (7 if DOC else 11);radius=.13 if two_zones else .21;spacing=(right-left-.6)/(n-1);xs=np.linspace(left+.3,right-.3,n)
  waters=VGroup();bonds=VGroup();base=[]
  for row in range(3):
   for i,x in enumerate(xs):
    p=np.array([x,y-.9-row*.85,0]);base.append(p);waters.add(sphere(radius,p,WATER))
  for row in range(3):
   for i in range(n-1):bonds.add(Line(base[row*n+i],base[row*n+i+1],color=LIGHT,stroke_width=2.4,stroke_opacity=.75))
  self.add_world(bonds,waters)
  soap=VGroup();sx=np.linspace(.25 if two_zones else left+.7,right-.7,(3 if DOC else 4) if two_zones else (4 if DOC else 6))
  for x in sx:
   head=sphere(.15,[x,y-.30,0]);tail=VMobject(stroke_color=INK,stroke_width=4).set_points_as_corners([[x,y-.30,0],[x,y-.03,0],[x+.09,y+.19,0],[x-.04,y+.39,0],[x+.10,y+.61,0],[x+.04,y+.80,0]])
   soap.add(VGroup(head,tail))
  self.add_world(soap)
  tracers=VGroup(*[oval(.14,.055,LIGHT,.65) for _ in range(260)]);self.add_world(tracers)
  self.particle_count=len(waters)+len(soap)+len(tracers)
  rng=np.random.default_rng(773);phase=rng.random(260);depth=rng.uniform(.15,2.7,260)
  def update(t):
   insertion=.18+.82*smooth(min(1,max(0,(t-.8)/4)))
   wave=lambda x:.04*math.sin(1.8*x-1.1*t)+.018*math.cos(3*x-.8*t)
   surface.set_points_smoothly([[x,y+wave(x),0] for x in np.linspace(left,right,80)])
   positions=[]
   for i,p in enumerate(base):
    xx=p[0]+.06*math.sin(t*.5+i)+.09*insertion*math.sin(p[0]);yy=p[1]+.035*math.cos(t*.6+i);positions.append(np.array([xx,yy,0]));waters[i].move_to(positions[-1])
   for row in range(3):
    for i in range(n-1):
     bond=bonds[row*(n-1)+i];bond.put_start_and_end_on(positions[row*n+i],positions[row*n+i+1]);bond.set_opacity(.75-.52*insertion*(.5+.5*math.sin(xs[i])))
   for i,m in enumerate(soap):
    # Heads appear wholly inside liquid; spheres never straddle the interface.
    m.set_opacity(insertion);m.shift(np.array([sx[i]+.07*math.sin(t*.6+i),y-.30,0])-m[0].get_center())
   all_centres=np.array(positions+[m[0].get_center() for m in soap]);radii=np.array([radius]*len(positions)+[.15]*len(soap));dist=np.linalg.norm(all_centres[:,None]-all_centres[None,:],axis=2);np.fill_diagonal(dist,np.inf)
   assert np.all(dist>=radii[:,None]+radii[None,:]-1e-6),('MOLECULAR_OVERLAP',t)
   self.min_sphere_distance=min(self.min_sphere_distance,float(dist.min()))
   for i,m in enumerate(tracers):
    x=left+((phase[i]+t*.055/(.3+depth[i]))%1)*(right-left);m.move_to([x,y-.30-depth[i]+.04*math.sin(x+t),0])
   ease=smooth(min(1,t/max(1,self.duration)));self.camera.frame.set(width=config.frame_width*(1-(.005 if DOC else .012)*ease)).move_to([0,-.04*ease,0])
  self.updates.append(update)

 def section_scene(self):
  left,right=(-3.6,3.6) if DOC else (-6.2,6.2);top=3.0 if DOC else 2.05;bottom=-6.55 if DOC else -3.55
  self.add_world(Rectangle(width=right-left,height=top-bottom,fill_color=WATER,fill_opacity=.88,stroke_color=LIGHT,stroke_width=2).move_to([(left+right)/2,(top+bottom)/2,0]))
  rng=np.random.default_rng(61);phases=rng.uniform(0,TAU,360);layers=rng.uniform(.45,.95,360)
  self.particle_count=len(phases)
  parts=VGroup(*[oval(.16,.065,LIGHT,.78) for _ in phases]);self.add_world(parts)
  paths=VGroup(*[VMobject(stroke_color=LIGHT,stroke_width=2,stroke_opacity=.22) for _ in range(44)]);self.add_world(paths)
  surface=VMobject(stroke_color=LIGHT,stroke_width=3);self.add_world(surface)
  def point(i,t):
   a=phases[i]+t*(.6+.2*layers[i]);return [(left+right)/2+(right-left)*.46*layers[i]*math.cos(a),(top+bottom)/2+(top-bottom)*.43*layers[i]*math.sin(a),0]
  def update(t):
   for i,m in enumerate(parts):m.move_to(point(i,t))
   for i,m in enumerate(paths):m.set_points_smoothly([point(i,t-d) for d in np.linspace(.35,0,6)])
   surface.set_points_smoothly([[x,top+.05*math.sin(x*2-t*1.1),0] for x in np.linspace(left,right,100)])
  self.updates.append(update)

 def update(self,t):
  for f in self.updates:f(t)
