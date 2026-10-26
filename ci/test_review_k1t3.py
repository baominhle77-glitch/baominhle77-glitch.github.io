"""Regression tests for false-green gates, all-prior comparison and timing."""
import json,os,sys,tempfile,unittest
from pathlib import Path
import numpy as np
from PIL import Image
sys.path.insert(0,str(Path(__file__).resolve().parent))
from review_k1t3 import motion,compare_every_prior
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'ban_sac'))

class GateTests(unittest.TestCase):
 def test_static_video_fails(self):
  report=motion(np.zeros((24,135,240),dtype=np.uint8))
  self.assertFalse(report['pass_motion']);self.assertEqual(report['avg_pct'],0)

 def test_repeated_ticker_is_removed(self):
  frames=np.zeros((24,135,240),dtype=np.uint8)
  frames[::2,110:135,:]=255
  report=motion(frames)
  self.assertFalse(report['pass_motion']);self.assertEqual(report['avg_pct'],0)

 def test_advected_patch_has_mean_union_and_pair_motion(self):
  frames=np.zeros((40,135,240),dtype=np.uint8)
  for i,frame in enumerate(frames):
   x=(i*35)%200;frame[20:100,x:x+40]=200
  report=motion(frames)
  self.assertTrue(report['pass_motion'],report)

 def test_nonadjacent_duplicate_is_rejected(self):
  with tempfile.TemporaryDirectory() as folder:
   rows=[]
   for bid,value in [('h1',30),('h2',200),('h3',30)]:
    path=Path(folder)/(bid+'.png');Image.new('L',(240,135),value).save(path)
    rows.append(dict(beat=bid,format='16x9',kind='still',image=str(path),status='STILL_ONLY'))
   compare_every_prior(rows,['h1','h2','h3'],'16x9')
   self.assertTrue(rows[1]['scene_difference_pass'])
   self.assertFalse(rows[2]['scene_difference_pass'])
   self.assertEqual(rows[2]['scene_differences'][0]['beat'],'h1')
   self.assertEqual(rows[2]['scene_difference_min'],0)

 def test_single_later_beat_does_not_certify_prior_comparison(self):
  with tempfile.TemporaryDirectory() as folder:
   path=Path(folder)/'h4.png';Image.new('L',(240,135),60).save(path)
   rows=[dict(beat='h4',format='16x9',kind='still',image=str(path),status='STILL_ONLY')]
   compare_every_prior(rows,['h1','h2','h3','h4'],'16x9')
   self.assertIsNone(rows[0]['scene_difference_pass'])
   self.assertEqual(rows[0]['scene_difference_scope'],'PARTIAL_ONLY')

 def test_pepper_is_a_closed_solid_not_a_flat_low_resolution_sphere(self):
  from K1_canh.vat_the_3d import PepperGrain
  from collections import Counter
  grain=PepperGrain(.04)
  self.assertTrue((np.ptp(grain.get_all_points(),axis=0)>.07).all())
  edges=Counter()
  for face in grain:
   vertices=[tuple(np.round(p,8)) for p in face.get_vertices()]
   for i in range(len(vertices)):
    edges[tuple(sorted((vertices[i],vertices[(i+1)%len(vertices)])))]+=1
  self.assertTrue(all(count==2 for count in edges.values()))

 def test_floating_grains_follow_the_same_three_dimensional_water_surface(self):
  from K1_canh.vat_the_3d import cloud,surface_height
  particles,update=cloud(n=4,radius=2.5,surface_radius=3.,flow='outward')
  for t in (0,.5,3.):
   update(t)
   for grain in particles[0]:
    point=grain.get_center()
    expected=float(surface_height(np.hypot(*point[:2]),t,3.))+.045*.7
    self.assertAlmostEqual(point[2],expected,places=6)

 def test_exact_clock_covers_every_locked_beat(self):
  from K1_canh.mo_phong_c17_v2 import SceneK1T3
  scene=object.__new__(SceneK1T3);scene._exact_take=True
  tts=json.loads((Path(__file__).resolve().parents[1]/'out/M1_MARANGONI_DUNG/_build/tts.json').read_text(encoding='utf-8'))
  # Include awkward frame counts that previously accumulated rounded waits.
  for count in (211,344,149,573,475,549,701):
   scene.total_frames=count
   samples=scene.get_time_progression(count/30,'test')
   values=list(samples);samples.close()
   self.assertEqual(len(values),count)
   self.assertEqual(values[0],0)
   self.assertAlmostEqual(values[-1],(count-1)/30)
  self.assertEqual(len(tts['beats']),35)

if __name__=='__main__':unittest.main()
