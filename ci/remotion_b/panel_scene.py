"""Native lower pane: same vessel, field and oblique optics as the clip."""
from manim import config
from scene import BScene,SHORT,optics as episode_optics,BID
from dataclasses import replace
import scene,json
from pathlib import Path
from ci.simulation.optical_water import WaterStage
config.pixel_width=SHORT;config.pixel_height=round(SHORT*8/9)
config.frame_width=8;config.frame_height=64/9
# Footage-paired optics use its measured oblique mouth ratio, not the macro
# camera of the separately narrated beat. Shared material/transport is retained.
calibration=next(c['simulation_optics'] for c in json.loads((Path(__file__).parent/'gemini.json').read_text()) if c['simulation_beat']==BID)
scene.make_stage=lambda width,height:WaterStage(width,height,replace(episode_optics(),**calibration))
class PanelScene(BScene):
 pass
