"""Content for p4: surface adsorption and subsurface micelle aggregation.

The immutable StageOm still supplies the vessel, fit, optical material and
event camera. This beat adds moving amphiphile aggregates as physical actors.
"""
import json,math
from pathlib import Path
from dataclasses import replace
import cv2
import numpy as np
from manim import config
from scene import BScene,DOC,BID
import scene
from ci.simulation.optical_water import Optics
from ci.simulation.stage_om import DO_CAO_DUOI_MAX
from ring_scene import RingStage
from ci.simulation.views import ViewComposer

class MicelleStage(RingStage):
 def __init__(self,*args,aggregation_start=5.,**kwargs):
  super().__init__(*args,**kwargs);self.aggregation_start=aggregation_start
 def frame(self,t):
  image=super().frame(t);cx,cy,rx,ry=self.camera(t);depth=rx*.72
  progress=min(1,max(0,(t-self.aggregation_start)/1.6));ease=(1-math.cos(math.pi*progress))/2
  canvas=image.copy();head=max(1,round(rx*.006));all_centers=[]
  if self.optics.section:mask=self.volume_mask
  else:mask=((self.x-cx)/rx)**2+((self.y-cy)/ry)**2<.86**2
  for group,ux in enumerate((-.40,.36)):
   middle_x=cx+rx*ux
   if self.optics.section:
    edge=math.sqrt(1-ux*ux);span=(depth-ry)*edge;middle_y=cy+ry*edge+span*.50;vertical=max(head*3.6,span*.20)
   else:middle_y=cy+ry*(.12 if group==0 else -.18);vertical=rx*.10
   horizontal=rx*.105;spread=1.55-.55*ease;centers=[]
   for i in range(8):
    angle=(i+.5)*2*math.pi/8+.20*t+group*.4
    px=middle_x+horizontal*spread*math.cos(angle);py=middle_y+vertical*spread*math.sin(angle);centers.append((px,py));ratio=.48
    tail=(round(middle_x+horizontal*spread*ratio*math.cos(angle)),round(middle_y+vertical*spread*ratio*math.sin(angle)))
    cv2.line(canvas,tail,(round(px),round(py)),(58,63,59),max(1,round(rx*.003)),cv2.LINE_AA)
    cv2.circle(canvas,(round(px),round(py)),head,(193,142,91),-1,cv2.LINE_AA)
    cv2.circle(canvas,(round(px-head*.2),round(py-head*.3)),max(1,head//3),(239,211,164),-1,cv2.LINE_AA)
   all_centers.extend(centers)
  # Actors remain in the water volume; the main free surface stays whole.
  image[mask]=canvas[mask]
  self.micelle_centers=all_centers
  return image
 def audit(self):
  return dict(super().audit(),physical_micelle_groups=2,heads_per_illustrative_group=8,quantitative_aggregation_number_claim=False,aggregation_start=self.aggregation_start)

def make_stage(width,height,portrait=False,bv=None):
 bv=bv or json.loads((Path(__file__).parent/'ban_ve_B60.json').read_text());b=next(b for b in bv['beats'] if b['id']=='p4');o=Optics(**b['optics']);events=b['su_kien'];start=b.get('aggregation_start',5.)
 if not portrait:return MicelleStage(width,height,o,'toan',events,aggregation_start=start)
 top=round(height*bv['bo_cuc_doc']['tren']);od=replace(Optics(**dict(b['optics'],**b['optics_duoi'])),section=False,molecules=False)
 return ViewComposer(width,height,[(0,0,MicelleStage(width,top,o,'toan',events,aggregation_start=start)),(0,top,MicelleStage(width,height-top,od,'toan',events,aggregation_start=start,do_cao_max=DO_CAO_DUOI_MAX))])

scene.make_stage=lambda width,height:make_stage(width,height,portrait=DOC)
class MicelleScene(BScene):
 pass
