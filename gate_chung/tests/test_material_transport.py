"""Physical failure modes, independent of any episode's beat identifiers."""
import unittest
import numpy as np
import cv2
from ci.simulation.transport import surface_radius,radial_velocity,circulation
from ci.simulation.optical_water import WaterStage,Optics
from gate_chung.appearance import dominant_lab_fraction
from gate_chung.video import ssim

class MaterialTransportRegressions(unittest.TestCase):
 def test_opening_is_fast_then_decelerates(self):
  self.assertGreater(surface_radius(.03,.4),.50)
  self.assertGreater(surface_radius(.03,.4)-surface_radius(.03,0),surface_radius(.03,4)-surface_radius(.03,3.6))
  self.assertGreater(radial_velocity(.4,.1),radial_velocity(.4,2))
  self.assertGreater(radial_velocity(.2,.1),radial_velocity(.8,.1))
  self.assertLessEqual(surface_radius(.8,100,True),.975)
 def test_return_cell_has_outward_top_and_inward_bottom(self):
  top=circulation(0,0);top_next=circulation(0,.01);bottom=circulation(.5,0);bottom_next=circulation(.5,.01)
  self.assertGreater(top_next[0],top[0]);self.assertLess(bottom_next[0],bottom[0]);self.assertGreater(top[1],bottom[1])
 def test_shared_water_is_not_a_flat_blue_surface(self):
  stage=WaterStage(320,180);a=stage.frame(.2);b=stage.frame(.8)
  self.assertLess(dominant_lab_fraction(a)[0],.35);self.assertGreater(np.abs(a.astype(float)-b).mean(),2)
  self.assertGreaterEqual(len(stage.flakes),400);self.assertGreater(stage.sizes.std(),.15)
  self.assertTrue(np.all(stage.colors[:,0]>=stage.colors[:,1]));self.assertTrue(np.all(stage.colors[:,1]>=stage.colors[:,2]))
 def test_camera_aspect_does_not_change_physical_mouth_ratio(self):
  optics=Optics(section=True)
  ratios=[]
  for w,h in ((960,540),(540,960),(540,480)):
   stage=WaterStage(w,h,optics);_,_,rx,ry=stage.camera(1.0);ratios.append(ry/rx)
  self.assertLess(max(ratios)-min(ratios),1e-9)
 def test_pepper_is_never_painted_inside_the_return_flow_volume(self):
  stage=WaterStage(480,270,Optics(section=True,ellipse_ratio=.28,camera_y=.3));stage.frame(1.0)
  for x,y in stage.pepper_positions:
   x,y=round(x),round(y)
   if 0<=x<stage.width and 0<=y<stage.height:self.assertFalse(stage.volume_mask[y,x])
 def test_lit_studio_does_not_leave_a_flat_gray_simulation_region(self):
  stage=WaterStage(480,270,Optics(environment='backlit',camera_width=.73,ellipse_ratio=.43))
  image=stage.frame(3)
  self.assertLess(dominant_lab_fraction(image[27:257,14:466])[0],.35)
  self.assertGreater(float(np.ptp(image[3].astype(float),axis=0).max()),10)
 def test_eased_camera_progresses_through_every_four_second_span(self):
  stage=WaterStage(960,540,Optics(environment='backlit',feeding=True,camera_width=.73,camera_y=.40,ellipse_ratio=.43,dolly_amplitude=.12,camera_travel_y=.18))
  for a in np.arange(.533,15.0,1.):
   b=a+4
   frames=[cv2.GaussianBlur(cv2.cvtColor(cv2.resize(stage.frame(t),(240,135)),cv2.COLOR_RGB2GRAY),(0,0),3) for t in (a,b)]
   self.assertLess(ssim(*frames),.97)
