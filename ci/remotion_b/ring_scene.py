"""K1 content: a sustained finite Marangoni zone and slow outer vortex pairs.

The locked StageOm owns the vessel/material/camera. This episode's actors use
a bounded surface inventory and a smooth velocity profile; they do not equate
steady feeding with sending every particle to the container wall forever.
"""
import json,math
from pathlib import Path
from dataclasses import replace
import cv2
import numpy as np
from scene import BScene,BID,DOC
import scene
from ci.simulation.optical_water import Optics
from ci.simulation.stage_om import StageOm,DO_CAO_DUOI_MAX
from ci.simulation.views import ViewComposer

class RingStage(StageOm):
 def __init__(self,*args,content=None,**kwargs):
  self.content=content or {};super().__init__(*args,**kwargs)
 def clear_radius(self,t):
  a=float(self.content.get('clear_radius',.62));z=float(self.content.get('clear_radius_end',a));begin=float(self.content.get('change_start',3.))
  q=min(1,max(0,(t-begin)/2));q=(1-math.cos(math.pi*q))/2
  return (a+(z-a)*q)*(1-math.exp(-max(0,t-self.optics.impact)/.22))
 def khoi(self,t):
  return .5*max(0,self.clear_radius(t)**2-float(np.min(self.r0))**2)
 def _dye(self,image,t,cx,cy,rx,ry):
  R=max(.12,self.clear_radius(t))
  for i in range(100):
   age=(self.phases[i]*3.8+t)%3.8;q=age/3.8;e=q*q*(3-2*q);a=self.trace_angles[i]
   r=.055+(R-.06)*e;speed=(R-.06)*6*q*(1-q)/3.8
   p=(round(cx+rx*r*math.cos(a)),round(cy+ry*r*math.sin(a)));tail=max(.02,r-speed*.16)
   v=(round(cx+rx*tail*math.cos(a)),round(cy+ry*tail*math.sin(a)))
   cv2.line(image,v,p,(171,199,204),max(1,round(rx*.002)),cv2.LINE_AA)
  # Counter-rotating pairs stay outside the clear zone and move much slower.
  outer=min(.89,R+(1-R)*.45);size=min(.07,(1-R)*.25)
  for group in range(4):
   theta=group*math.pi/2+.3
   for side in (-1,1):
    a0=theta+side*.10
    for j in range(14):
     phase=j*2*math.pi/14+side*t*.18
     u=outer*math.cos(a0)+size*math.cos(phase);v=outer*math.sin(a0)+size*math.sin(phase)
     p=(round(cx+rx*u),round(cy+ry*v));q=(round(cx+rx*(outer*math.cos(a0)+size*math.cos(phase-side*.06))),round(cy+ry*(outer*math.sin(a0)+size*math.sin(phase-side*.06))))
     cv2.line(image,q,p,(165,193,200),max(1,round(rx*.002)),cv2.LINE_AA)
 def _molecules(self,image,t,cx,cy,rx,ry):
  special=self.content.get('molecular_mode')
  if not special:return super()._molecules(image,t,cx,cy,rx,ry)
  for i in range(16):
   arrival=i*.5
   if t<arrival:continue
   angle=i*2.39996+.045*t;r=min(.86,.12+.15*math.sqrt(max(0,t-arrival)));x=cx+rx*r*math.cos(angle);y=cy+ry*r*math.sin(angle);head=max(2,round(rx*.010))
   begin=float(self.content.get('change_start',3.));q=min(1,max(0,(t-begin)/2));q=(1-math.cos(math.pi*q))/2
   length=rx*.10*(1+q if special=='double_tail' else 1)
   if special=='desorb' and i%3==0:
    q=min(1,max(0,(t-begin-i*.04)/2));front=cy+ry*math.sqrt(max(0,1-((x-cx)/rx)**2));bottom=cy+rx*.72*math.sqrt(max(0,1-((x-cx)/rx)**2));y=y*(1-q)+(front+.35*(bottom-front))*q
   pts=[];count=12+round(12*q) if special=='double_tail' else 12;depth=q if special=='desorb' and i%3==0 else 0
   for j in range(count):pts.append((round(x+math.sin(j*2.3+i+t*.5)*head*.55+length*.55*depth*j/(count-1)),round(y-j*length*(1-depth)/(count-1))))
   cv2.polylines(image,[np.asarray(pts,np.int32)],False,(43,50,49),max(1,round(rx*.003)),cv2.LINE_AA)
   if special=='ammonium':
    cv2.circle(image,(round(x),round(y)),max(1,round(head*.6)),(139,171,177),-1,cv2.LINE_AA)
    for k in range(3):
     a=k*2*math.pi/3+t*.18;px=round(x+head*1.5*math.cos(a));py=round(y+head*1.5*math.sin(a));cv2.line(image,(round(x),round(y)),(px,py),(60,67,65),1,cv2.LINE_AA);cv2.circle(image,(px,py),max(1,round(head*.3)),(88,96,93),-1,cv2.LINE_AA)
   else:
    for k in range(head,0,-1):
     f=1-k/head;color=np.asarray([154,105,64])*(1-f)+np.asarray([235,194,143])*f;cv2.circle(image,(round(x)-round(f*head*.2),round(y)-round(f*head*.2)),k,tuple(map(float,color)),-1,cv2.LINE_AA)
 def audit(self):
  return dict(super().audit(),flow_model='finite illustrative Marangoni zone; smooth acceleration/deceleration; slow outer vortex pairs',quantitative_velocity_claims=False,content_parameters=self.content)

def make_stage(bid,width,height,portrait=False,bv=None):
 bv=bv or json.loads((Path(__file__).parent/'ban_ve_B60.json').read_text());b=next(b for b in bv['beats'] if b['id']==bid);o=Optics(**b['optics']);events=b['su_kien'];content=b.get('ring_content',{})
 if not portrait:return RingStage(width,height,o,b['khung']['16x9'],events,b.get('goc_can',90),content=content)
 top=round(height*bv['bo_cuc_doc']['tren']);od=replace(Optics(**dict(b['optics'],**b['optics_duoi'])),section=False)
 lower=dict(content,**b.get('ring_content_duoi',{}))
 return ViewComposer(width,height,[(0,0,RingStage(width,top,o,'toan',events,content=content)),(0,top,RingStage(width,height-top,od,'toan',events,content=lower,do_cao_max=DO_CAO_DUOI_MAX))])

scene.make_stage=lambda width,height:make_stage(BID,width,height,portrait=DOC)
class RingScene(BScene):
 pass
