"""Episode content/camera data only; native material/view engine is shared."""
import json
from pathlib import Path
from dataclasses import replace
from ci.simulation.optical_water import WaterStage,Optics
from ci.simulation.views import ViewComposer
H=Path(__file__).resolve().parent
def base_optics(bid):return Optics(**json.loads((H/'optics.json').read_text())[bid])
def lower_optics(bid):
 base=base_optics(bid);clips=json.loads((H/'gemini.json').read_text());clip=next((c for c in clips if c['simulation_beat']==bid),None)
 override=clip['simulation_optics'] if clip else json.loads((H/'portrait_views.json').read_text())[bid]['detail']
 return replace(base,**override)
def make_stage(bid,width,height,portrait=False):
 if not portrait:return WaterStage(width,height,base_optics(bid))
 u=width/540;context=json.loads((H/'portrait_views.json').read_text()).get(bid,{}).get('context',{})
 return ViewComposer(width,height,[(0,round(112*u),WaterStage(width,round(304*u),replace(base_optics(bid),**context))),(0,round(448*u),WaterStage(width,round(480*u),lower_optics(bid)))])
