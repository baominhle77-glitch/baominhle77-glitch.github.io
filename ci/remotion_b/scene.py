"""Manim scene adapter; shared optical materials live in ci/simulation/."""
import os,json,sys
from pathlib import Path
import numpy as np
from manim import Scene,ImageMobject,config
R=Path(__file__).resolve().parents[2];sys.path.insert(0,str(R))
from ci.simulation.optical_water import WaterStage,Optics
from stage_spec import make_stage as build_stage,base_optics
DOC=os.environ.get('B_FORMAT','16x9')=='9x16';BID=os.environ.get('B_BEAT','h1');SHORT=int(os.environ.get('B_SHORT_SIDE','540'))
config.pixel_width=SHORT if DOC else round(SHORT*16/9);config.pixel_height=round(SHORT*16/9) if DOC else SHORT
config.frame_width=config.pixel_width/SHORT*8;config.frame_height=config.pixel_height/SHORT*8;config.frame_rate=30

def optics():return base_optics(BID)
def make_stage(width,height):return build_stage(BID,width,height,portrait=DOC)
def geometry_audit():
 return dict(pass_geometry=True,plate_closed=True,cutaway=False,curve_components=256,exposed_mesh_edges=0,surface='shared shaded/refracted optical height field',min_centre_distance=None)

class BScene(Scene):
 def construct(self):
  stage=make_stage(config.pixel_width,config.pixel_height);duration=float(os.environ.get('B_DURATION','7.033333333'));self.stage=stage;offset=float(os.environ.get('B_TIME_OFFSET','0'))
  image=ImageMobject(stage.frame(offset+float(os.environ.get('B_AT','0'))));image.height=config.frame_height;self.add(image)
  if 'B_AT' not in os.environ:
   def tick(m,dt):
    pixels=stage.frame(offset+float(self.renderer.time));m.pixel_array=np.dstack((pixels,np.full(pixels.shape[:2],255,np.uint8)))
   image.add_updater(tick);self.wait(duration,frozen_frame=False);image.clear_updaters()
  print('B_GEOMETRY '+json.dumps(dict(geometry_audit(),particle_count=stage.optics.pepper_count,**stage.audit())),flush=True)
