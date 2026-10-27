import unittest
from types import SimpleNamespace
import numpy as np,cv2
from gate_chung.appearance import G10,G11,dominant_lab_fraction

class AppearanceRegressions(unittest.TestCase):
 def test_flat_surface_fails_even_though_small_particles_move(self):
  def frame(t):
   image=np.full((150,240,3),[64,105,156],np.uint8);cv2.circle(image,(int(30+t*20),70),6,(10,10,10),-1);return image
  v=SimpleNamespace(width=240,height=150,duration=4,frame=frame);p=dict(simulation_regions=[dict(id='model',start=0,end=4,bbox=[0,0,1,1])],texts=[])
  self.assertFalse(G10(v,p)['passed'])
 def test_lit_depth_gradient_surface_passes(self):
  y,x=np.mgrid[:150,:240];a=np.stack((70+x*.45,90+y*.6,100+x*.3+y*.3),-1).astype(np.uint8)
  v=SimpleNamespace(width=240,height=150,duration=4,frame=lambda t:a);p=dict(simulation_regions=[dict(id='model',start=0,end=4,bbox=[0,0,1,1])],texts=[])
  self.assertTrue(G10(v,p)['passed'])
 def test_nearly_identical_colors_still_count_as_one_population(self):
  a=np.full((100,100,3),[64,105,156],np.uint8);a[::2]+=np.uint8(1)
  f,_=dominant_lab_fraction(a);self.assertGreater(f,.99)
 def test_static_arrow_and_line_fail_but_transported_overlay_passes(self):
  def frame(t):
   a=np.zeros((150,240,3),np.uint8);cv2.arrowedLine(a,(20+int(t*12),70),(100+int(t*12),70),(209,131,79),4);return a
  v=SimpleNamespace(width=240,height=150,duration=5,frame=lambda t:frame(0))
  for kind in ('arrow','line','shape'):
   o=dict(id=kind,start=0,end=5,bbox=[.08,.3,.4,.2],evidence=dict(palette=['#D1834F']));p=dict(beats=[],nontext_overlays=[o],overlay_audit=dict(complete=True,renderer='fixture'))
   self.assertFalse(G11(v,p)['passed'])
   o['keyframes']=[dict(time=0,bbox=[.08,.3,.4,.2]),dict(time=5,bbox=[.4,.3,.4,.2])]
   self.assertFalse(G11(v,p)['passed'],'fabricated moving metadata cannot hide static pixels')
   v.frame=frame;self.assertTrue(G11(v,p)['passed']);v.frame=lambda t:frame(0)
 def test_missing_inventory_is_not_silently_accepted(self):
  v=SimpleNamespace(duration=5);self.assertFalse(G10(v,{})['passed']);self.assertFalse(G11(v,{})['passed'])
 def test_inventory_must_come_from_renderer_snapshots(self):
  from ci.layer_plan import measured_overlays
  with self.assertRaises(ValueError):measured_overlays([dict(frame=0)],960,540,5)
  bar=dict(id='bar',x=100,y=100,w=200,h=10,palette=['#D1834F'])
  result=measured_overlays([dict(frame=0,overlays=[bar]),dict(frame=90,overlays=[bar])],960,540,5)
  self.assertEqual(result[0]['end'],5);self.assertEqual(result[0]['evidence']['palette'],bar['palette'])
