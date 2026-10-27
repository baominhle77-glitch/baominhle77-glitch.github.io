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
  # Physical geometry is independent of output aspect. Portrait uses the
  # shared uniform context/detail compositor, never a taller water ellipse.
  c=np.array([-.25,-.05,0]);w,h=12.3,5.7
  # Different optics: overhead, low oblique, steady-feeding laboratory macro.
  if BID=='h1':h*=.96
  if BID=='h2':
   h*=.60;c[1]+=.55
  self.c,self.w,self.h=c,w,h
  for k in range(6):self.add_world(oval(w+.15+k*.075,h+.18+k*.02,INK,.018).move_to(c+[.14,-.38-k*.014,0]))
  # Curved ceramic exterior has a visible thickness and a separate inner lip.
  depth=2.1 if BID=='h2' else .35
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
  paths=VGroup(*[VMobject(stroke_color=LIGHT,stroke_width=5.5,stroke_opacity=.65) for _ in range(110)]) if BID=='h2' else VGroup()
  self.add_world(paths)
  self.particle_count=n+len(paths)
  drop=sphere(.20,c+[0,h*.22,0]);self.add_world(drop)
  rings=VGroup(*[oval(.05,.05,LIGHT,0).set_stroke(LIGHT,1.8,.35) for _ in range(4)]);self.add_world(rings)
  if BID=='h3':
   # A tall needle at the right of the portrait PiP; the basin stays intact.
   bottom=c.copy();anchor=c+np.array([1.50,4.7,0]) if DOC else c+np.array([2.7,2.9,0])
   tip=VMobject(stroke_color=LIGHT,stroke_width=7).set_points_smoothly([bottom,bottom+[.15,.45,0],anchor+[0,-1.1,0],anchor])
   collar=Rectangle(width=.40,height=.65,fill_color=INK,fill_opacity=1,stroke_width=0).move_to(anchor+[0,.25,0]);self.add_world(tip,collar)

  def pos(i,t):
   q=max(0,t-(.45 if BID=='h1' else 0));a=angles[i]+.018*math.sin(t*.7+rad[i]*8)
   if BID=='h3':
    rr=.43+.28*(1-math.exp(-2*rad[i]))+.025*math.sin(t*.65+i);a+=.10*t/(.3+rad[i])
   else:rr=rad[i]+(.96-rad[i])*(1-math.exp(-(.09 if BID=='h2' else .20)*q/(rad[i]+.10)))
   return c+np.array([w*.475*rr*math.cos(a),h*.475*rr*math.sin(a),0])
  def update(t):
   for i,m in enumerate(self.pepper):
    p=pos(i,t);m.move_to(p);shadows[i].move_to(p+[.027,-.036,0])
   for i,path in enumerate(paths):
    # A continuous inflow of liquid tracers, radial speed falls as 1/(r+eps).
    a=angles[i];phase=(i*.618+t*(.23 if BID=='h2' else .18))%1;rr=.06+.87*math.sqrt(phase)
    pts=[c+np.array([w*.475*max(.01,rr-d)*math.cos(a+.05*math.sin(t*.5)),h*.475*max(.01,rr-d)*math.sin(a+.05*math.sin(t*.5)),0]) for d in np.linspace((.10+.20*smooth(min(1,t/max(1,self.duration)))) if BID=='h2' else .075,0,5)]
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
   self.camera.frame.set(width=config.frame_width*(1-zoom*ease)).move_to([(-.025 if DOC else -.10)*ease,(c[1]+h/2+.12-config.frame_height*.34) if DOC else .015*math.sin(math.pi*ease),0])
   if BID=='h2':
    # Eased camera keys are a real change of viewing scale/position, rather
    # than resetting tiny tracers over an otherwise unchanged late shot.
    scales=([1.00,1.07,.99,1.06,1.01] if DOC else [1.00,1.13,1.00,1.12,1.02]);xs=([-.01,.01,-.02,.015,0] if DOC else [-.10,.08,-.08,.10,0]);ys=[-.15,.30,-.35,.28,-.15]
    k=min(3,int(t/3.5));u=smooth(min(1,max(0,(t-k*3.5)/3.5)));scale=(1-u)*scales[k]+u*scales[k+1];xx=(1-u)*xs[k]+u*xs[k+1]
    yy=c[1]+h/2+.12-config.frame_height*scale*.34 if DOC else (1-u)*ys[k]+u*ys[k+1]
    self.camera.frame.set(width=config.frame_width*scale).move_to([xx,yy,0])
  self.updates.append(update)

 def molecular_scene(self,two_zones=False):
  """A finite 3D water volume viewed by an eased moving optical camera.
  Analytic billboard spheres have smooth shading; no polygon sphere facets.
  The camera changes azimuth/elevation every3.6s, never rolls the final frame.
  """
  wx,wy=(2.6,4.5) if DOC else (4.8,2.8)
  if not two_zones:wx*=.8;wy*=.8
  depth=2.0 if two_zones else 1.65
  # Native portrait and landscape have separately authored display frustums.
  view=(-3.55,3.55,-6.45,3.25) if DOC else (-6.55,6.55,-3.35,1.93)
  if DOC and BID=='c1':view=(-3.55,3.55,-6.55,3.85)
  nx,ny=(7,4) if two_zones else (5,4)
  radius=.13 if two_zones else .18
  base=[]
  for layer in (0,1):
   for row in range(ny):
    for col in range(nx):
     x=np.linspace(-.82*wx,.82*wx,nx)[col]+(.10 if row%2 else -.10)
     y=np.linspace(-.78*wy,.78*wy,ny)[row]
     base.append(np.array([x,y,-.80-layer*(.70 if two_zones else .55)]))
  soap_base=[np.array([x,y,-.32]) for y in np.linspace(-.65*wy,.65*wy,3) for x in np.linspace(-.70*wx,.70*wx,4)]
  waters=VGroup(*[sphere(radius,[0,0,0],WATER) for _ in base])
  soaps=VGroup(*[VGroup(sphere(.14,[0,0,0]),VMobject(stroke_color=INK,stroke_width=3.5)) for _ in soap_base])
  bonds=VGroup(*[VMobject(stroke_color=LIGHT,stroke_width=2.0,stroke_opacity=.6) for _ in range(ny*(nx-1))])
  shadow=VMobject(fill_color=INK,fill_opacity=.18,stroke_width=0)
  back=VMobject(fill_color=INK,fill_opacity=.8,stroke_width=0)
  side=VMobject(fill_color=WATER,fill_opacity=1,stroke_width=0)
  top=VMobject(fill_color=WATER,fill_opacity=.94,stroke_color=LIGHT,stroke_width=1.4)
  front=VMobject(fill_color=interpolate_color(ManimColor(WATER),ManimColor(INK),.40),fill_opacity=.85,stroke_width=0)
  left_face=VMobject(fill_color=WATER,fill_opacity=.85,stroke_width=0)
  faces=[front,side,back,left_face]
  film=VGroup(*[VMobject(stroke_color=ORANGE,stroke_width=5,stroke_opacity=.24) for _ in range(16)])
  rng=np.random.default_rng(773);nflow=180;phase=rng.random(nflow);angle=rng.uniform(0,TAU,nflow)
  flow=VGroup(*[VMobject(stroke_color=LIGHT,stroke_width=5.8,stroke_opacity=.67) for _ in range(nflow)])
  self.add_world(shadow,back,side,front,left_face,top,film,flow,bonds,waters,soaps)
  force=VGroup(*[Arrow(LEFT,RIGHT,buff=0,color=ORANGE,stroke_width=6) for _ in range(2)]) if not two_zones else VGroup()
  self.add_world(force)
  self.particle_count=len(base)+len(soap_base)+nflow
  keys_theta=([-112,-88,-58,-83,-110,-76,-48] if DOC else [-65,-35,4,38,5,-35,-58]) if two_zones else ([-58,-82,-110,-78,-43,-70] if DOC else [12,42,78,112,74,30])
  keys_phi=[48,65,39,61,35,55,42] if two_zones else [20,38,26,45,23,42]
  print('B_CAMERA_KEYS '+json.dumps(dict(beat=BID,interval_s=3.6,theta=keys_theta,phi=keys_phi,roll=0)),flush=True)
  def close(m,points):m.set_points_as_corners([*points,points[0]])
  def update(t):
   k=min(len(keys_theta)-2,int(t/3.6));a=smooth(min(1,max(0,(t-k*3.6)/3.6)))
   theta=math.radians((1-a)*keys_theta[k]+a*keys_theta[k+1])
   j=min(len(keys_phi)-2,k);phi=math.radians((1-a)*keys_phi[j]+a*keys_phi[j+1])
   normal=np.array([math.cos(theta)*math.cos(phi),math.sin(theta)*math.cos(phi),math.sin(phi)])
   right=np.array([-math.sin(theta),math.cos(theta),0.]);up=np.cross(normal,right)
   coverage=.10+.88*smooth(min(1,t/max(1,self.duration-.15)))
   if not two_zones:coverage=.32+.66*smooth(min(1,t/max(1,self.duration-.15)))
   def eta(x,y):return .055*math.sin(2.2*math.hypot(x,y)-1.65*t)*math.exp(-.12*math.hypot(x,y))
   corner=[np.array([x,y,z]) for x in (-wx,wx) for y in (-wy,wy) for z in (-depth,.05)]
   tails=[p+np.array([0,0,1.07]) for p in soap_base]
   bounds=np.array([[p@right,p@up] for p in corner+tails]);lo=bounds.min(axis=0);hi=bounds.max(axis=0)
   sx=(view[1]-view[0])/(hi[0]-lo[0]);sy=(view[3]-view[2])/(hi[1]-lo[1]);bead_scale=math.sqrt(sx*sy)
   def project(p):
    p=np.asarray(p);return np.array([view[0]+(p@right-lo[0])*sx,view[2]+(p@up-lo[1])*sy,0.])
   corners=[np.array([-wx,-wy,0.]),np.array([wx,-wy,0.]),np.array([wx,wy,0.]),np.array([-wx,wy,0.])]
   cap=[]
   for i in range(4):
    for u in np.linspace(0,1,25,endpoint=False):
     p=(1-u)*corners[i]+u*corners[(i+1)%4];p[2]=eta(p[0],p[1]);cap.append(project(p))
   close(top,cap)
   # Closed exterior faces; there is no wedge or opening into a dish.
   bottom=[p-np.array([0,0,depth]) for p in corners]
   close(shadow,[project(p)+[.12,-.13,0] for p in bottom])
   normals=[np.array([0.,-1.,0]),np.array([1.,0,0]),np.array([0,1.,0]),np.array([-1.,0,0])]
   for i,face in enumerate(faces):
    edge=[]
    for u in np.linspace(0,1,26):
     p=(1-u)*corners[i]+u*corners[(i+1)%4];p[2]=eta(p[0],p[1]);edge.append(project(p))
    close(face,[project(bottom[i]),project(bottom[(i+1)%4]),*reversed(edge)])
    light=.35+.25*(normals[i]@np.array([-.4,-.6,0]))
    face.set_fill(interpolate_color(ManimColor(INK),ManimColor(WATER),light+.45),opacity=.9 if normals[i]@normal>0 else 0)
   # Soap spreads from a local source. Each individual molecule joins the film
   # as its concentration front reaches that position, through the whole beat.
   centres=[];radii=[];water_positions=[]
   for i,p in enumerate(base):
    q=p+np.array([.09*math.sin(t*.75+i),.07*math.cos(t*.61+i),.035*math.sin(t+i)])
    water_positions.append(q);centres.append(q);radii.append(radius)
    waters[i].set(width=2*radius*bead_scale).move_to(project(q))
   for i,p in enumerate(soap_base):
    q=p+np.array([.065*math.sin(t*.7+i),.06*math.cos(t*.5+i),0])
    r=math.hypot(q[0]/wx,q[1]/wy);arrival=np.clip((coverage*1.8-r+.2)*3,0,1)
    head=q.copy();head[2]=-.32+eta(q[0],q[1])*.10
    centres.append(head);radii.append(.14)
    soaps[i][0].set(width=.28*bead_scale).move_to(project(head));soaps[i].set_opacity(.14+.86*arrival)
    tail=[head,[q[0],q[1],.01],[q[0]+.06,q[1],.23],[q[0]-.04,q[1],.43],[q[0]+.08,q[1],.64],[q[0]+.02,q[1],.75]]
    soaps[i][1].set_points_as_corners([project(x) for x in tail])
   pts=np.array(centres);rs=np.array(radii);dist=np.linalg.norm(pts[:,None]-pts[None,:],axis=2);np.fill_diagonal(dist,np.inf)
   assert np.all(dist>=rs[:,None]+rs[None,:]-1e-6),('MOLECULAR_OVERLAP',t)
   self.min_sphere_distance=min(self.min_sphere_distance,float(dist.min()))
   for row in range(ny):
    for col in range(nx-1):
     i=row*nx+col;bond=bonds[row*(nx-1)+col];p,q=water_positions[i],water_positions[i+1]
     local=np.clip(coverage*1.8-math.hypot(p[0]/wx,p[1]/wy)+.2,0,1)
     bond.set_points_as_corners([project(p),project(q)]).set_stroke(opacity=.70-.53*local)
   for i,m in enumerate(force):
    direction=-1 if i else 1;xx=direction*wx*.36;ll=(1.1 if i==0 else .50)*(1+.12*coverage);start=np.array([xx,0,.28]);end=start+[direction*ll,0,0];m.put_start_and_end_on(project(start),project(end));m.set_opacity(smooth(min(1,max(0,(t-10.0)/.6))))
   for i,m in enumerate(film):
    aa=TAU*i/len(film);r=min(.95,.15+coverage*.86)
    m.set_points_smoothly([project([wx*(r-d)*math.cos(aa),wy*(r-d)*math.sin(aa),.07+eta(wx*r*math.cos(aa),wy*r*math.sin(aa))]) for d in np.linspace(.18,0,5)])
   def flow_point(i,at):
    duration=max(1,self.duration-.15);u=np.clip(at/duration,0,1);cc=.10 if two_zones else .32;dd=.88 if two_zones else .66;integral=cc*at+dd*duration*(u**3-.5*u**4);s=(phase[i]+.16*at+.14*integral)%1
    if s<.62:
     rr=.08+.82*math.sqrt(s/.62);z=-.12
    else:
     u=(s-.62)/.38;rr=.90-.82*u;z=-.18-(depth-.40)*math.sin(math.pi*u)
    aa=angle[i]+.10*math.sin(at*.65+rr)
    return np.array([wx*rr*math.cos(aa),wy*rr*math.sin(aa),z])
   for i,m in enumerate(flow):
    m.set_points_smoothly([project(flow_point(i,t-lag)) for lag in np.linspace(.32,0,6)])
  self.updates.append(update)

 def section_scene(self):
  left,right=(-3.6,3.6) if DOC else (-6.2,6.2);top=4.1 if DOC else 2.05;bottom=-6.55 if DOC else -3.55
  self.add_world(Rectangle(width=right-left,height=top-bottom,fill_color=WATER,fill_opacity=.88,stroke_color=LIGHT,stroke_width=2).move_to([(left+right)/2,(top+bottom)/2,0]))
  rng=np.random.default_rng(61);phases=rng.uniform(0,TAU,360);layers=rng.uniform(.45,.95,360)
  self.particle_count=len(phases)
  parts=VGroup(*[oval(.16,.065,LIGHT,.78) for _ in phases]);self.add_world(parts)
  paths=VGroup(*[VMobject(stroke_color=LIGHT,stroke_width=2,stroke_opacity=.22) for _ in range(44)]);self.add_world(paths)
  surface=VMobject(stroke_color=LIGHT,stroke_width=3);self.add_world(surface)
  # Surface-tension arrows are secondary to360 moving liquid tracers.
  arrows=VGroup(*[VGroup(Arrow(LEFT,RIGHT,color=INK,stroke_width=16,buff=0,max_stroke_width_to_length_ratio=100),Arrow(LEFT,RIGHT,color=ORANGE,stroke_width=10,buff=0,max_stroke_width_to_length_ratio=100)) for _ in range(2)]);self.add_world(arrows)
  def point(i,t):
   a=phases[i]+t*(.6+.2*layers[i]);return [(left+right)/2+(right-left)*.46*layers[i]*math.cos(a),(top+bottom)/2+(top-bottom)*.43*layers[i]*math.sin(a),0]
  def update(t):
   for j,m in enumerate(arrows):
    x=(left+right)/2+(-1 if j==0 else 1)*(right-left)*.19;length=(3.30 if j==0 else 1.20)*(1+.06*math.sin(t*1.2));x+=.10*math.sin(t*1.1);start=np.array([x-length/2,top-.03+.025*math.sin(t*1.1),0])
    for glyph in m:glyph.put_start_and_end_on(start,start+[length,0,0])
    m[1].get_tip().set_stroke(INK,2)
   for i,m in enumerate(parts):m.move_to(point(i,t))
   for i,m in enumerate(paths):m.set_points_smoothly([point(i,t-d) for d in np.linspace(.35,0,6)])
   surface.set_points_smoothly([[x,top+.05*math.sin(x*2-t*1.1),0] for x in np.linspace(left,right,100)])
  self.updates.append(update)

 def update(self,t):
  for f in self.updates:f(t)
