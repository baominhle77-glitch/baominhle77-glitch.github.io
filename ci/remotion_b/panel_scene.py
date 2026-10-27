"""Footage lower pane uses the unmodified KHUON v1 lower camera."""
from manim import config
from scene import BScene,SHORT,BID
import scene
from stage_khuon import doc_ban_ve,make_stage
bv=doc_ban_ve();full_height=round(SHORT*16/9);panel_height=full_height-round(full_height*bv['bo_cuc_doc']['tren'])
config.pixel_width=SHORT;config.pixel_height=panel_height
config.frame_width=8;config.frame_height=8*panel_height/SHORT
scene.make_stage=lambda width,height:make_stage(BID,SHORT,full_height,portrait=True,bv=bv).views[1][2]
class PanelScene(BScene):
 pass
