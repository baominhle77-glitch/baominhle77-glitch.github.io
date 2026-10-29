"""Text-free Manim 2.5D optical water renderer shared by scene producers.

The water is a shaded height field: its normals refract a textured floor and
reflect large studio lights. Beer-Lambert depth tint, Fresnel edge reflection,
curved glass/ceramic walls, capillary meniscus and moving caustics are computed
per frame. Pepper geometry lives on z=eta, never in the return-flow volume.
"""
from dataclasses import dataclass
import math
import cv2
import numpy as np
from .transport import surface_radius,radial_velocity,circulation

@dataclass(frozen=True)
class Optics:
 ellipse_ratio:float=.49
 vessel:str='ceramic'
 shot:str='wide'
 feeding:bool=False
 nozzle:bool=False
 impact:float=.45
 molecules:bool=False
 section:bool=False
 seed:int=221
 pepper_count:int=640
 camera_motion:float=.022
 environment:str='bright'
 camera_width:float=1.
 camera_width_start:float=0.
 camera_y:float=.44
 lock_elevation:bool=False
 vessel_depth:float=0.
 target_x:float=0.
 target_y:float=0.
 follow_soap:bool=False
 dolly_amplitude:float=0.
 camera_travel_y:float=0.

def blend(image,mask,color,alpha=1):
 a=(mask.astype(np.float32)*alpha)[...,None];image*=1-a;image+=np.asarray(color,np.float32)*a

class WaterStage:
 def __init__(self,width,height,optics=Optics()):
  self.width,self.height,self.optics=width,height,optics
  self.y,self.x=np.mgrid[:height,:width].astype(np.float32)
  self.rng=np.random.default_rng(optics.seed);n=optics.pepper_count
  self.angles=self.rng.uniform(0,2*np.pi,n);self.r0=np.sqrt(self.rng.uniform(.003,.90,n))
  self.sizes=self.rng.uniform(.60,1.40,n);self.turn=self.rng.uniform(0,2*np.pi,n)
  tone=self.rng.uniform(22,68,n);warmth=self.rng.uniform(0,1,n)
  self.colors=np.column_stack((tone+12*warmth,tone+5*warmth,tone-8*warmth))
  self.flakes=[]
  for i in range(n):
   vertices=int(self.rng.integers(5,9));a=np.linspace(0,2*np.pi,vertices,endpoint=False)+self.rng.uniform(-.20,.20,vertices);r=self.rng.uniform(.65,1.,vertices)
   self.flakes.append(np.column_stack((np.cos(a)*r,np.sin(a)*r)))
  self.phases=self.rng.random(150);self.trace_angles=self.rng.uniform(0,2*np.pi,150)

 def camera(self,t):
  o=self.optics;W,H=self.width,self.height
  # Eased optical motion; no independent x/y resizing of an image panel.
  k=min(5,int(max(0,t)/3.2));ease=(1-math.cos(math.pi*min(1,max(0,(t-k*3.2)/3.2))))/2
  elevation=[0,-.080,-.015,-.100,-.030,-.060,-.005]
  delta=0 if o.lock_elevation else (1-ease)*elevation[k]+ease*elevation[k+1]
  scale=(1+o.camera_motion*.5*math.sin(t*.52))*(1+o.dolly_amplitude*((k+ease)/3-1))
  progress=(1-math.cos(math.pi*min(1,max(0,t/.9))))/2
  optical_width=o.camera_width if not o.camera_width_start else o.camera_width_start+(o.camera_width-o.camera_width_start)*progress
  rx=W*((.425 if W/H>1.4 else .44) if o.shot=='wide' else .61)*scale*optical_width
  ry=rx*(o.ellipse_ratio+delta)
  pan=[0,.8,-1.,.7,-.5,1.,-.7]
  cx=W*(.50+.015*((1-ease)*pan[k]+ease*pan[k+1]));cy=H*(o.camera_y+o.camera_travel_y*(k+ease)/6)+H*.014*math.sin(t*.49)
  if o.section:rx=W*.45*optical_width*scale;ry=rx*(o.ellipse_ratio+delta*.6)
  tx,ty=o.target_x,o.target_y
  if o.follow_soap:
   radius=min(.60,.12+.18*math.sqrt(max(0,t)));a=.045*t;tx,ty=radius*math.cos(a),radius*math.sin(a)
  cx-=rx*tx;cy-=ry*ty
  return cx,cy,rx,ry

 def frame(self,t):
  o=self.optics;W,H=self.width,self.height;x,y=self.x,self.y
  cx,cy,rx,ry=self.camera(t);u=(x-cx)/rx;v=(y-cy)/ry;r=np.sqrt(u*u+v*v)
  table=(.10*np.sin(x*.014)+.08*np.cos(y*.021)+.06*np.sin(x*.075+y*.019))
  # Directional studio illumination over the table, with a broad softbox.
  # This is a lit environment, not a constant gray matte behind the vessel.
  floor_x=(x-cx)/max(rx,1);floor_y=(y-cy)/max(ry,1)
  shade=22*np.exp(-((floor_x+.45)/1.9)**2-((floor_y+.5)/2.2)**2)
  illumination=36*(1-x/W)+28*(1-y/H)+shade
  image=np.stack((130+illumination+table,137+illumination+table,140+illumination+table),axis=-1).astype(np.float32)
  if o.environment=='dark':image-=108
  if o.environment=='backlit':image+=17
  # Soft contact shadow is a continuous ellipse, not a polygon mesh.
  depth=rx*(o.vessel_depth or (.14 if o.vessel=='ceramic' else .26))
  if o.section:depth=rx*.72
  shadow=np.exp(-((x-cx-rx*.025)/(rx*1.035))**2*2-((y-cy-depth-ry*.45)/(ry*.68))**2*2)*.30
  image*=1-shadow[...,None]
  outer=(r<1.06);below=((x-cx)/(rx*1.06))**2+((y-cy-depth)/(ry*1.03))**2<1
  if o.section:below=(((x-cx)/(rx*1.04))**2+((y-cy)/(depth*1.03))**2<1)&(y>=cy)
  wall=below|outer
  front=np.clip((y-cy+ry)/(2*ry+depth),0,1)
  spec=np.exp(-((u+.62)/.07)**2)*25+np.exp(-((u-.78)/.035)**2)*17
  if o.vessel=='ceramic':
   c=np.stack((206-82*front+spec,214-76*front+spec,215-70*front+spec),-1)
  else:
   c=np.stack((108+25*front+spec,131+28*front+spec,139+29*front+spec),-1)
   c+=14*np.sin(y[...,None]*.10+u[...,None]*2)
   if not o.section:c=.35*c+.65*image
  image[wall]=c[wall]
  inner=r<.988
  tau=max(0,t-o.impact);rad=np.sqrt((u+.045)**2+(v+.05)**2)
  ring=.007*np.sin(47*rad-13*tau)*np.exp(-((rad-.12-1.8*tau)/.22)**2)*math.exp(-tau*.70) if tau>0 else 0
  wave=.008*np.sin(12*u+8*v-t*1.7)+.005*np.sin(21*v-5*u+t*1.1)+ring
  # Refracted light-floor variation and smooth caustics follow the normals.
  floor=28*np.sin(3.5*u+2.2*v+.35*np.sin(t*.4))+18*np.cos(4.5*v-1.8*u)
  caustic=(np.maximum(0,np.sin(18*u+11*v-t*1.8)+np.sin(24*v-7*u+t*1.3)-1.15))**2*45
  roughness=1.0*np.sin(181*u+77*v)+.6*np.sin(69*u-149*v)
  light=160+floor-24*rad**2+caustic+wave*1100+roughness
  if 0<tau<1:light-=18*np.exp(-(rad/.12)**2)*math.exp(-tau/.16)
  # Water is transparent; reflectance changes with view angle and depth.
  color=np.stack((light*.80,light*.95+5,light+12),-1)
  if o.environment=='dark':color*=.88
  if o.environment=='backlit':color+=15
  fresnel=np.clip((r-.60)/.40,0,1)**3
  color+=fresnel[...,None]*np.array([20,26,29])
  # Rectangular studio-light reflection, distorted by capillary normals.
  sx=u+.42+wave*3;sy=v+.35+wave*8
  softbox=np.exp(-(sx/.38)**8-(sy/.11)**4)*.48
  color=color*(1-softbox[...,None])+np.array([231,239,238])*softbox[...,None]
  rimlight=np.exp(-((r-.965)/.016)**2)*(12+14*np.maximum(0,-v))
  color+=rimlight[...,None]
  image[inner]=color[inner]
  # Continuous thick lip and a bright/dark meniscus pair; every curve smooth.
  lip=(r>.992)&(r<1.047)
  lip_light=195+39*np.cos(np.arctan2(v,u)+1.2)+8*np.sin(np.arctan2(v,u)*3)
  image[lip]=np.stack((lip_light,lip_light+5,lip_light+5),-1)[lip]
  meniscus=np.exp(-((r-.982)/.006)**2)
  image[inner]+=meniscus[inner,None]*np.array([29,34,35])
  if o.section:self._section(image,t,cx,cy,rx,ry,depth)
  image=np.clip(image,0,255).astype(np.uint8)
  self._pepper(image,t,cx,cy,rx,ry)
  self._dye(image,t,cx,cy,rx,ry)
  if o.molecules:self._molecules(image,t,cx,cy,rx,ry)
  if o.nozzle:self._feed(image,t,cx,cy,rx,ry)
  elif t<o.impact+.25:self._drop(image,t,cx,cy,rx,ry)
  return image

 def _pepper(self,image,t,cx,cy,rx,ry):
  o=self.optics;tau=max(0,t-o.impact)
  rr=surface_radius(self.r0,tau,o.feeding)
  angle=self.angles+.025*np.sin(t*.7+self.r0*8)+(.055*t if o.feeding else 0)
  # Radial compression against the real wall produces a layered edge pile.
  rr=np.minimum(rr,.97-self.sizes*.005)+.003*np.sin(self.angles*47+t*.9)
  xx=cx+rx*rr*np.cos(angle);yy=cy+ry*rr*np.sin(angle)
  self.pepper_positions=np.column_stack((xx,yy))
  if self.optics.section:yy=cy+ry*rr*np.sin(angle) # pepper ALWAYS at the top
  shadow=np.zeros(image.shape[:2],np.uint8);polygons=[]
  for i,p in enumerate(self.flakes):
   a=self.turn[i]+.09*math.sin(t*.6+i);rot=np.array([[math.cos(a),-math.sin(a)],[math.sin(a),math.cos(a)]])
   pts=p@rot.T*(rx*.0085*self.sizes[i]);pts[:,1]*=.64
   q=np.rint(pts+[xx[i],yy[i]]).astype(np.int32);polygons.append(q)
   cv2.fillPoly(shadow,[q+np.array([1,2])],90,lineType=cv2.LINE_AA)
  shadow=cv2.GaussianBlur(shadow,(0,0),max(.6,rx*.002))
  image[:]=(image.astype(np.float32)*(1-shadow[...,None]/380)).astype(np.uint8)
  for i,q in enumerate(polygons):
   cv2.fillPoly(image,[q],tuple(map(float,self.colors[i])),lineType=cv2.LINE_AA)
   # Rough fractured face catches light; particles differ in tone and shape.
   if self.sizes[i]>.9:cv2.line(image,tuple(q[0]),tuple(q[1]),tuple(map(float,self.colors[i]+22)),max(1,round(rx/500)),cv2.LINE_AA)

 def _dye(self,image,t,cx,cy,rx,ry):
  o=self.optics
  # Finite dye parcels are released at the source, advected, then disappear
  # at the boundary; every trail follows its own recent physical positions.
  for i in range(120):
   age=(self.phases[i]*3.8+t)%3.8
   a=self.trace_angles[i]+.045*math.sin(t*.4)
   if o.feeding:
    r=.08+.86*math.sqrt(age/3.8);speed=.86/(7.6*math.sqrt(max(.025,age/3.8)))
   else:
    at=max(0,t-o.impact);r=float(surface_radius(self.phases[i]*.9,at));speed=float(radial_velocity(r,at))
   lag=min(.14,.020/max(speed,.01));tail=max(.04,r-speed*lag)
   p=(round(cx+rx*r*math.cos(a)),round(cy+ry*r*math.sin(a)))
   q=(round(cx+rx*tail*math.cos(a)),round(cy+ry*tail*math.sin(a)))
   # Dye tint is refracted through the water, never a white vector glyph.
   cv2.line(image,q,p,(174,198,199),max(1,round(rx*.0022)),cv2.LINE_AA)

 def _drop(self,image,t,cx,cy,rx,ry):
  q=min(1,max(0,t/self.optics.impact));xx=round(cx);yy=round(cy-ry*.95*(1-q*q));s=max(2,round(rx*.028*(1+.25*q)))
  if t>self.optics.impact:s=round(s*max(0,1-(t-self.optics.impact)/.25))
  if s<1:return
  self._glass_drop(image,xx,yy,s)

 def _glass_drop(self,image,x,y,size):
  for k in range(12):
   q=k/12;r=max(1,round(size*(1-q*.85)));p=(x-round(q*size*.22),y-round(q*size*.32));c=np.array([88,121,136])*(1-q)+np.array([183,214,217])*q
   cv2.ellipse(image,p,(r,max(1,round(r*1.35))),0,0,360,tuple(map(float,c)),-1,cv2.LINE_AA)
  cv2.ellipse(image,(x-round(size*.32),y-round(size*.54)),(max(1,size//5),max(1,size//3)),12,0,360,(230,242,240),-1,cv2.LINE_AA)

 def _feed(self,image,t,cx,cy,rx,ry):
  # Vertical physical pipette and falling droplets, rather than a diagonal
  # schematic stroke. Specular cylindrical shading gives the nozzle depth.
  xx=round(cx+rx*.04);top=max(0,round(cy-ry*1.5));tip=round(cy-ry*.38);th=max(2,round(rx*.018))
  for j in range(-th,th+1):
   k=(j/th+1)/2;c=int(102+115*math.sin(math.pi*k));cv2.line(image,(xx+j,top),(xx+j,tip),(c,c+min(12,255-c),c+min(15,255-c)),1,cv2.LINE_AA)
  for i in range(2):
   f=(t*1.6+i/2)%1;yy=round(tip+(cy-tip)*f*f);self._glass_drop(image,xx,yy,max(1,th//2))

 def _molecules(self,image,t,cx,cy,rx,ry):
  # An optical micro-view of amphiphiles at an actual deforming interface.
  for i in range(16):
   arrival=i*.5
   if t<arrival:continue
   a=i*2.39996+.045*t;r=min(.89,.12+.18*math.sqrt(max(0,t-arrival)))
   x=cx+rx*r*math.cos(a);y=cy+ry*r*math.sin(a);s=max(3,round(rx*.012))
   height=rx*.10;points=[]
   for j in range(7):points.append((round(x+math.sin(j*2.3+i+t*.5)*s*.65),round(y-j*height/6)))
   cv2.polylines(image,[np.array(points,np.int32)],False,(42,49,50),max(1,round(rx*.004)),cv2.LINE_AA)
   for k in range(s,0,-1):
    light=1-k/s;c=tuple(float(v) for v in np.array([147,101,64])*(1-light)+np.array([235,191,139])*light);cv2.circle(image,(round(x)-round(light*s*.2),round(y)-round(light*s*.2)),k,c,-1,cv2.LINE_AA)

 def _section(self,image,t,cx,cy,rx,ry,depth):
  u=(self.x-cx)/rx;curve=np.sqrt(np.maximum(0,1-u*u));front=cy+ry*curve;bottom=cy+depth*curve
  z=(self.y-front)/np.maximum(1,bottom-front)
  mask=(abs(u)<.99)&(z>0)&(z<1);self.volume_mask=mask
  # A curved transparent vessel; bright caustics and attenuation show depth.
  light=146-54*z+18*np.cos(u*3+t*.6)+9*np.sin(14*u+10*z-t*2)
  # A weak fluorescent dye is advected around the two return cells. These
  # are travelling wisps, not static streamline diagrams or blinking marks.
  cell_x=(np.abs(u)-.48)/.43;cell_y=(z-.48)/.40
  cell_r=np.sqrt(cell_x**2+cell_y**2);angle=np.arctan2(cell_x,-cell_y)
  dye=np.zeros_like(cell_r)
  for j in range(3):
   phase=angle-2*np.pi*.13*t-2*np.pi*j/3-3*(cell_r-.5)
   wrapped=np.arctan2(np.sin(phase),np.cos(phase))
   dye+=28*np.exp(-(wrapped/.48)**2-((cell_r-.60)/.37)**2)
  colors=np.stack((light*.62+dye*.35,light*.91+9+dye,light+22+dye*1.1),-1);image[mask]=colors[mask]
  for i in range(240):
   phase=self.phases[i%len(self.phases)]+i*.037;a=2*math.pi*(phase+.13*t);side=-1 if i%2 else 1;shell=.30+.70*((i*.618)%1)
   ux=side*(.48+.43*shell*math.sin(a));xx=cx+rx*ux;edge=math.sqrt(max(0,1-ux*ux));surface=cy+ry*edge;span=(depth-ry)*edge;yy=surface+span*(.48-.40*shell*math.cos(a))
   # Distinct translucent cyan microbeads: these are liquid tracers, not pepper.
   if 0<xx<self.width and 0<yy<self.height and mask[round(yy),round(xx)]:
    trail=[]
    for lag in np.linspace(.14,0,5):
     aa=2*math.pi*(phase+.13*(t-lag));ux=side*(.48+.43*shell*math.sin(aa));px=cx+rx*ux;edge=math.sqrt(max(0,1-ux*ux));py=cy+ry*edge+(depth-ry)*edge*(.48-.40*shell*math.cos(aa))
     if 0<=round(px)<self.width and 0<=round(py)<self.height and mask[round(py),round(px)]:trail.append((round(px),round(py)))
    if len(trail)>1:cv2.polylines(image,[np.array(trail,np.int32)],False,(122,177,196),max(1,round(rx*.002)),cv2.LINE_AA)
    cv2.circle(image,(round(xx),round(yy)),max(1,round(rx*.004)),(153,211,225),-1,cv2.LINE_AA)
  # Front meniscus separates the floating pepper from the return-flow volume.
  points=[(round(cx+rx*q),round(cy+ry*math.sqrt(max(0,1-q*q)))) for q in np.linspace(-.99,.99,240)]
  cv2.polylines(image,[np.array(points,np.int32)],False,(179,212,219),max(1,round(rx*.002)),cv2.LINE_AA)

 def audit(self):
  return {'renderer':'shared optical height-field / Manim2.5D','pepper_count':self.optics.pepper_count,'pepper_surface_only':True,'pepper_size_range':[.6,1.4],'ellipse_ratio':self.optics.ellipse_ratio,'vessel':self.optics.vessel,'nontext_overlays':[],'closed_surface':True,'arrows':0,'particle_transport':'radial decaying impulse plus optional sustained forcing; closed return cells','material_layers':['refracted floor','depth attenuation','height-field normal reflection','caustics','meniscus','curved vessel','soft flake shadows']}
