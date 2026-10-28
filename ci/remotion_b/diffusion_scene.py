"""w4 content: momentum and solute penetrate water at different rates.

Native optical cell views, with sigma_momentum / sigma_solute = sqrt(10^4).
The moving refracted field and advected tracers remain physical scene actors;
no stationary vector arrows, grid, or editorial graphic stands in for flow.
"""
import math
import cv2
import numpy as np
from scene import BScene,DOC
import scene
from ci.simulation.optical_water import Optics
from ci.simulation.views import ViewComposer

class DiffusionStage:
 def __init__(self,width,height,chemical=False):
  self.width,self.height,self.chemical=width,height,chemical
  self.y,self.x=np.mgrid[:height,:width].astype(np.float32)
  self.rng=np.random.default_rng(1743);self.phases=self.rng.random(180);self.depths=np.abs(self.rng.normal(0,.7,180))
  self.optics=Optics(pepper_count=0,vessel='optical glass cell',ellipse_ratio=.5 if chemical else .3)
 def frame(self,t):
  W,H=self.width,self.height;x,y=self.x,self.y
  panx=.009*W*math.sin(t*.7);pany=.009*H*math.cos(t*.6)
  left,right=.055*W+panx,.945*W+panx;top,bottom=.085*H+pany,.915*H+pany
  u=(x-left)/(right-left);v=(y-top)/(bottom-top)
  light=148+30*(1-x/W)+25*(1-y/H)+3*np.sin(x*.04+y*.01)
  image=np.stack((light+2,light+8,light+11),-1)
  mask=((u>.0)&(u<1)&(v>0)&(v<1))
  eta=.24+.012*np.sin(u*12-t*1.2)+.007*np.sin(u*21+t*.9)
  glass=image*.70+np.array([60,78,88])*.30
  image[mask]=glass[mask]
  water=mask&(v>eta)
  z=np.maximum(0,v-eta)
  sigma=min(.39,.10*math.sqrt(t+1));solute=sigma/100
  speed=np.exp(-z*z/(2*sigma*sigma))
  normal=17*np.sin(8*u+7*v-t*1.4)+15*np.cos(12*v-5*u+t*1.3)
  caustic=12*np.sin(23*u+13*v-t*(.8+speed))
  base=163-32*z+normal+caustic
  colors=np.stack((base*.77,base*.94+5,base+13),-1)
  image[water]=colors[water]
  # Concentration is a smooth, thin distribution inside the liquid, not a bar.
  concentration=np.exp(-z*z/(2*solute*solute))*water
  alpha=concentration[...,None]*.32
  image=image*(1-alpha)+np.array([198,153,107])*alpha
  for i in range(150):
   depth=min(.60,float(self.depths[i])*sigma);a=(self.phases[i]+t*(.15*math.exp(-depth*depth/(2*sigma*sigma))+.015))%1
   px=left+(right-left)*(.04+.92*a);vv=.24+depth+.006*math.sin(i+t*.8);py=top+(bottom-top)*vv
   lag=.018+.065*math.exp(-depth*depth/(2*sigma*sigma));qx=px-(right-left)*lag
   cv2.line(image,(round(max(left+2,qx)),round(py)),(round(px),round(py)),(165,207,218),max(1,round(W*.002)),cv2.LINE_AA)
  if self.chemical:
   for i in range(48):
    a=(self.phases[i]+t*.075)%1;px=left+(right-left)*(.04+.92*a);depth=abs(math.sin(i*2.4+t*.7))*solute
    py=top+(bottom-top)*(.24+depth+.006*math.sin(a*12-t*1.2));cv2.circle(image,(round(px),round(py)),max(1,round(W*.004)),(202,156,103),-1,cv2.LINE_AA)
  # A transparent curved lip and soft glass edges provide physical context.
  radius=max(4,round(H*.025));cv2.rectangle(image,(round(left),round(top)),(round(right),round(bottom)),(215,229,232),max(1,round(W*.004)),cv2.LINE_AA)
  cv2.ellipse(image,(round((left+right)/2),round(top)),(round((right-left)/2),radius),0,180,360,(228,238,237),max(1,round(W*.004)),cv2.LINE_AA)
  return np.clip(image,0,255).astype(np.uint8)
 def audit(self):
  return dict(renderer='native optical diffusion content',pepper_count=0,closed_surface=True,arrows=0,schmidt_number=10000,diffusion_length_ratio=100,model_scope='qualitative transport; ratio follows the narrated Schmidt-number assumption')

def make_stage(width,height,portrait=False):
 if not portrait:return DiffusionStage(width,height,True)
 top=round(height*.4)
 return ViewComposer(width,height,[(0,0,DiffusionStage(width,top)),(0,top,DiffusionStage(width,height-top,True))])

scene.make_stage=lambda width,height:make_stage(width,height,portrait=DOC)
class DiffusionScene(BScene):
 pass
