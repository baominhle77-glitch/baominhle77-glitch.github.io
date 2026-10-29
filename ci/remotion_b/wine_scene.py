"""Closing-promise Manim content; the approved scene adapter stays unchanged."""
from manim import config
from scene import BScene,DOC
import scene
from wine_teaser import make_stage
scene.make_stage=lambda width,height:make_stage(width,height,portrait=DOC)
class WineScene(BScene):
 pass
