"""Native camera viewports: compose pixels without resizing either axis.
Each factory renders at the exact slot resolution. The physical scene is
shared; a tall output never changes the vessel's dimensions to fill a frame.
"""
import numpy as np

class ViewComposer:
 def __init__(self,width,height,views,background=(142,150,157)):
  self.width,self.height=width,height;self.views=views;self.background=background;self.optics=views[0][2].optics
  for x,y,stage in views:
   if x<0 or y<0 or x+stage.width>width or y+stage.height>height:raise ValueError('camera viewport outside frame')
 def frame(self,t):
  image=np.full((self.height,self.width,3),self.background,np.uint8)
  for x,y,stage in self.views:
   pixels=stage.frame(t)
   if pixels.shape!=(stage.height,stage.width,3):raise ValueError('camera raster changed aspect')
   image[y:y+stage.height,x:x+stage.width]=pixels
  return image
 def audit(self):
  return dict(self.views[0][2].audit(),views=[dict(viewport=[x,y,s.width,s.height],ellipse_ratio=s.optics.ellipse_ratio,camera_width=s.optics.camera_width,physical_depth_ratio=.72 if s.optics.section else (s.optics.vessel_depth or (.14 if s.optics.vessel=='ceramic' else .26))) for x,y,s in self.views],native_camera_rasters=True)
