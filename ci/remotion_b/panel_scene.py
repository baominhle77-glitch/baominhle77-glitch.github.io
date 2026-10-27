"""Native540×480 simulation panels, sharing the exact full simulation updates.
The optical projection is authored for the lower panel; no rotated/cropped scene.
"""
import math
import numpy as np
from manim import *
from scene import BScene,BID,DOC,SHORT,oval,LIGHT,WATER
config.pixel_width=SHORT;config.pixel_height=round(SHORT*8/9);config.frame_width=8;config.frame_height=64/9;config.frame_rate=30
class PanelScene(BScene):
 def plate_scene(self):
  super().plate_scene()
  if BID=='h3':
   drops=VGroup(*[oval(.07,.10,LIGHT) for _ in range(8)]);waves=VGroup(*[oval(.1,.1,LIGHT,0).set_stroke(LIGHT,2,.4) for _ in range(3)]);self.add_world(drops,waves);self.particle_count+=len(drops)
   def feed(t):
    anchor=self.c+np.array([1.5,4.7,0]);p0=anchor;p1=anchor+[0,-1.1,0];p2=self.c+[.15,.45,0];p3=self.c
    for i,m in enumerate(drops):
     q=(i/8+t*.55)%1;point=(1-q)**3*p0+3*(1-q)**2*q*p1+3*(1-q)*q*q*p2+q**3*p3;m.move_to(point)
    for i,m in enumerate(waves):
     q=(t*.55+i/3)%1;scale=.05+.88*q;m.stretch_to_fit_width(self.w*scale);m.stretch_to_fit_height(self.h*scale);m.move_to(self.c).set_stroke(opacity=.35*(1-q))
   self.updates.append(feed)
 def update(self,t):
  super().update(t)
  # A camera close-up changes one scalar, preserving circles and proportions.
  # This is a declared detail viewport; the upper pane retains full context.
  keys=[3.7,4.2,3.8,4.1];k=min(2,int(t/3.2));u=smooth(min(1,max(0,(t-k*3.2)/3.2)));width=(1-u)*keys[k]+u*keys[k+1]
  self.camera.frame.set(width=width).move_to(self.c+[.10*math.sin(t*.6),0,0])
