"""Actual encoded panels: uniform fit, undeclared stretch and declared cover."""
import tempfile,unittest
from pathlib import Path
import cv2,numpy as np
from gate_chung.aspect import G9,fit
from gate_chung.video import Video

class AspectRegressions(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name)
  rng=np.random.default_rng(918);self.source=rng.integers(20,220,(240,400,3),np.uint8);self.source=cv2.GaussianBlur(self.source,(3,3),0)
  for _ in range(40):
   x,y=rng.integers(10,380),rng.integers(10,220);cv2.circle(self.source,(int(x),int(y)),int(rng.integers(3,15)),tuple(map(int,rng.integers(0,256,3))),2)
  self.path=self.root/'source.png';cv2.imwrite(str(self.path),cv2.cvtColor(self.source,cv2.COLOR_RGB2BGR))
 def tearDown(self):self.tmp.cleanup()
 def evaluate(self,frame,layer):
  path=self.root/'video.mp4';writer=cv2.VideoWriter(str(path),cv2.VideoWriter_fourcc(*'mp4v'),30,(960,540))
  for _ in range(30):writer.write(cv2.cvtColor(frame,cv2.COLOR_RGB2BGR))
  writer.release();video=Video(path)
  try:return G9(video,dict(layers=[dict(id='panel',source=str(self.path),start=0,end=1,**layer)]))
  finally:video.close()
 def test_uniform_scale_passes(self):
  frame=np.full((540,960,3),30,np.uint8);frame[100:340,100:500]=self.source
  report=self.evaluate(frame,dict(scale_x=1,scale_y=1,viewport=[100/960,100/540,400/960,240/540],content_bbox=[100/960,100/540,400/960,240/540]));self.assertTrue(report['passed'],report)
 def test_vertical_stretch_1_3_fails_even_with_forged_equal_scales(self):
  frame=np.full((540,960,3),30,np.uint8);frame[100:412,100:500]=cv2.resize(self.source,(400,312))
  report=self.evaluate(frame,dict(scale_x=1,scale_y=1,viewport=[100/960,100/540,400/960,312/540],content_bbox=[100/960,100/540,400/960,240/540]));self.assertFalse(report['passed']);self.assertTrue(any('pixel registration' in r['detail'] and not r['passed'] for r in report['rows']))
 def test_declared_uniform_cover_crop_passes(self):
  frame=np.full((540,960,3),30,np.uint8);frame[100:340,100:340]=self.source[:,80:320]
  layer=dict(scale_x=1,scale_y=1,viewport=[100/960,100/540,240/960,240/540],content_bbox=[20/960,100/540,400/960,240/540],fit='cover',crop_declared=True)
  report=self.evaluate(frame,layer);self.assertTrue(report['passed'],report)
  layer['crop_declared']=False;self.assertFalse(self.evaluate(frame,layer)['passed'])
 def test_static_nonuniform_scale_fails(self):
  frame=np.full((540,960,3),30,np.uint8);frame[100:340,100:500]=self.source
  report=self.evaluate(frame,dict(scale_x=1,scale_y=1.3,viewport=[100/960,100/540,400/960,240/540],content_bbox=[100/960,100/540,400/960,240/540]));self.assertFalse(report['passed'])
 def test_uniform_layout_formula(self):
  a=fit((1920,1080),(0,0,540,960));self.assertEqual(a['scale_x'],a['scale_y']);self.assertAlmostEqual(a['content_bbox'][2]/a['content_bbox'][3],16/9)
if __name__=='__main__':unittest.main()
