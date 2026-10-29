"""Canonical resolution must never stretch, crop, resample time or upscale."""
import tempfile,unittest,subprocess
from pathlib import Path
import cv2,numpy as np
from ci.analysis_video import canonical_540,probe
from ci.chuyen_dong_vung import extract,measure,FIRST

class AnalysisInputRegressions(unittest.TestCase):
 def test_original_gate_still_rejects_a_static_native_video_after_normalization(self):
  with tempfile.TemporaryDirectory() as directory:
   root=Path(directory);src=root/'static.mp4'
   subprocess.run(['ffmpeg','-nostdin','-y','-v','error','-f','lavfi','-i','color=c=navy:s=1920x1080:r=30','-t','60','-c:v','libx264','-preset','ultrafast','-crf','0',str(src)],check=True)
   with self.assertRaisesRegex(ValueError,'NOT_540P'):extract(src,'16x9')
   with canonical_540(src,'16x9') as (path,evidence):frames=extract(path,'16x9')
   self.assertEqual(len(frames),240)
   plan={'beats':{bid:{'t0':i*10,'so_khung':300} for i,bid in enumerate(FIRST)}}
   result=measure(frames,plan,'16x9');self.assertTrue(all(b['ket_qua']=='TRUOT' for b in result['beats']))
 def movie(self,root,w,h):
  picture=np.zeros((h,w,3),np.uint8);cv2.circle(picture,(w//2,h//2),120,(255,255,255),-1)
  png=root/f'{w}x{h}.png';cv2.imwrite(str(png),picture);mp4=png.with_suffix('.mp4')
  subprocess.run(['ffmpeg','-nostdin','-y','-v','error','-loop','1','-i',str(png),'-r','30','-frames:v','3','-c:v','libx264','-preset','ultrafast','-crf','0','-pix_fmt','yuv420p',str(mp4)],check=True)
  return mp4
 def test_native_two_formats_keep_circles_round_and_frame_clock(self):
  with tempfile.TemporaryDirectory() as directory:
   root=Path(directory)
   for fmt,w,h in (('16x9',1920,1080),('9x16',1080,1920)):
    src=self.movie(root,w,h)
    with canonical_540(src,fmt) as (path,evidence):
     self.assertEqual(evidence['uniform_scale'],.5);self.assertEqual(probe(path)['nb_frames'],'3');self.assertEqual(probe(path)['r_frame_rate'],'30/1')
     cap=cv2.VideoCapture(str(path));ok,image=cap.read();cap.release();self.assertTrue(ok)
     y,x=np.where(cv2.cvtColor(image,cv2.COLOR_BGR2GRAY)>180);self.assertLessEqual(abs(np.ptp(x)-np.ptp(y)),1)
    self.assertTrue(src.is_file())
 def test_540_passthrough_and_wrong_aspect_are_not_rewritten(self):
  with tempfile.TemporaryDirectory() as directory:
   root=Path(directory);src=self.movie(root,960,540)
   with canonical_540(src,'16x9') as (path,evidence):self.assertEqual(path,src);self.assertFalse(evidence['proxy_created'])
   with self.assertRaisesRegex(ValueError,'ASPECT_MISMATCH'):
    with canonical_540(src,'9x16'):pass
   small=self.movie(root,480,270)
   with self.assertRaisesRegex(ValueError,'NO_UPSCALE'):
    with canonical_540(small,'16x9'):pass
