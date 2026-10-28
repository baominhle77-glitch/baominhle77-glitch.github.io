"""Beat content: a qualitative wine-film/tear preview, rendered natively.

This is a new physical subject for the closing promise, not a modification of
the locked water-stage template. Both camera rasters depict the same rising
film and falling tears; no static arrows or explanatory overlay geometry.
"""
import math
import cv2
import numpy as np
from ci.simulation.optical_water import Optics
from ci.simulation.views import ViewComposer

class WineStage:
 def __init__(self,width,height,high=False):
  self.width,self.height,self.high=width,height,high
  self.y,self.x=np.mgrid[:height,:width].astype(np.float32)
  self.optics=Optics(pepper_count=0,vessel='wine glass',ellipse_ratio=.55 if high else .32)
 def frame(self,t):
  W,H=self.width,self.height;x,y=self.x,self.y
  cx=W*(.5+.006*math.sin(t*.75));top=H*(.08+.008*math.sin(t*.67));height=H*.84;rx=W*(.44+.002*math.sin(t*.7))
  u=(x-cx)/rx;v=(y-top)/height
  table=146+30*(1-x/W)+23*(1-y/H)+3*np.sin(x*.037+y*.018)
  image=np.stack((table+4,table+8,table+10),-1)
  radius=np.sqrt(np.maximum(.04,1-.60*np.maximum(0,v)**2))
  inside=(v>=0)&(v<=1)&(np.abs(u)<radius)
  wall=(v>=-.025)&(v<=1.025)&(np.abs(u)<radius+.025)
  glass=168+18*np.cos(u*2)+10*np.sin(v*2.3)+22*np.exp(-((u+.78)/.05)**2)+30*np.exp(-((u-.8)/.035)**2)
  glass_color=np.stack((glass+3,glass+11,glass+15),-1)
  glint=8*np.exp(-((u+.78)/.05)**2)+10*np.exp(-((u-.8)/.035)**2)
  transmission=image*.72+np.array([70,90,100])*.28+glint[...,None]
  image[wall]=transmission[wall]
  # Film is tinted by wine; changing normals move reflected studio light.
  film_front=.70-.43*min(1,max(0,t)/4.4)+.018*np.sin(u*8+t*1.3)
  wet=inside&(v>film_front)
  waves=16*np.sin(6*u+4*v-t*1.35)+13*np.cos(10*v-3*u+t*1.8)
  bulk=(v>.73+.012*np.sin(u*7+t*1.1))&inside
  film=np.stack((180+waves,135+waves*.85,134+waves*.8),-1)
  film+=np.exp(-((u+.5+.035*np.sin(t+v*8))/.15)**2)[...,None]*np.array([24,28,29])
  image[wet]=(.68*film+.32*image)[wet]
  red=np.stack((133+waves,55+waves*.5,67+waves*.65),-1)
  image[bulk]=red[bulk]
  # Meniscus curves around the glass wall; the bulk never becomes a flat bar.
  men_y=top+height*(.73+.012*np.sin(np.linspace(-1,1,180)*7+t*1.1))
  men=np.column_stack((cx+rx*np.linspace(-.81,.81,180),men_y)).round().astype(np.int32)
  cv2.polylines(image,[men],False,(193,133,141),max(1,round(W*.003)),cv2.LINE_AA)
  for i in range(16):
   a=-.86+1.72*(i+.5)/16;phase=(t*.19+i*.137)%1
   # Wetting precedes detachment; gravity accelerates the falling parcel.
   vf=.27+.43*phase*phase;xx=cx+rx*a;yy=top+height*vf
   sx=max(2,round(W*(.006+.003*(i%3))));sy=max(3,round(sx*(1.4+phase)))
   if yy+sy<top+height*.73 and t>.3:
    cv2.ellipse(image,(round(xx),round(yy)),(sx,sy),0,0,360,(151,78,92),-1,cv2.LINE_AA)
    cv2.ellipse(image,(round(xx-sx*.22),round(yy-sy*.3)),(max(1,sx//3),max(1,sy//3)),0,0,360,(234,201,206),-1,cv2.LINE_AA)
  # Curved bowl outline and a smooth reflective elliptical lip.
  rows=np.linspace(0,1,180);rad=np.sqrt(1-.60*rows**2)
  for side in (-1,1):
   pts=np.column_stack((cx+side*rx*rad,top+height*rows)).round().astype(np.int32);cv2.polylines(image,[pts],False,(222,232,235),max(1,round(W*.005)),cv2.LINE_AA)
  lip_y=round(top);lip_ry=max(3,round(H*(.035 if self.high else .025)))
  cv2.ellipse(image,(round(cx),lip_y),(round(rx),lip_ry),0,0,360,(223,233,235),max(1,round(W*.005)),cv2.LINE_AA)
  cv2.ellipse(image,(round(cx),round(top+height)),(round(rx*math.sqrt(.4)),max(2,round(H*.025))),0,0,180,(208,221,225),max(1,round(W*.004)),cv2.LINE_AA)
  return np.clip(image,0,255).astype(np.uint8)
 def audit(self):
  return dict(renderer='native qualitative wine-film content',pepper_count=0,closed_surface=True,arrows=0,exposed_mesh_edges=0,phenomenon='wine wetting film rises; liquid tears detach and accelerate downward',quantitative_claims=False)

def make_stage(width,height,portrait=False):
 if not portrait:return WineStage(width,height)
 top=round(height*.4)
 return ViewComposer(width,height,[(0,0,WineStage(width,top)),(0,top,WineStage(width,height-top,True))])
