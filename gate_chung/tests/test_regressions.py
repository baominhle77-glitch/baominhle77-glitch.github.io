"""D18 regressions: test outcomes of faults, not implementation-shaped snapshots."""
import unittest,json,tempfile,ast
from pathlib import Path
import numpy as np,cv2
from gate_chung.motion import windows
from gate_chung.language import phrase_error,visual_nouns
from gate_chung.model import validate
from gate_chung.video import ssim,sharpness
from gate_chung.gates import G5,G8,background_error
from gate_chung import policy as P

class Regressions(unittest.TestCase):
 def test_twenty_eight_of_thirty_is_acceptance(self):
  rng=np.random.default_rng(18);frames=[]
  for i in range(240):
   if 10<=i/4<12 or 30<=i/4<32:frame=frames[-1].copy()
   else:frame=np.where(rng.random((135,240))<.2,210,70).astype(np.uint8)
   frames.append(frame)
  report=windows(np.array(frames),60);self.assertEqual(report['passed'],28);self.assertTrue(report['pass_gate'])
  for i in range(200,208):frames[i]=frames[199].copy()
  report=windows(np.array(frames),60);self.assertEqual(report['passed'],27);self.assertFalse(report['pass_gate'])

 def test_meaningless_caption_boundaries(self):
  for text in ('One drop of','touched it So','That gap not','bowl down to','đây là của','những người và'):self.assertIsNotNone(phrase_error(text),text)
  for text in ('One drop of soap,','Two blue armies advance','đoàn quân tiến lên'):self.assertIsNone(phrase_error(text),text)
 def test_four_second_repeat_despite_flicker(self):
  rng=np.random.default_rng(3);base=np.full((135,240),130,np.uint8);cv2.rectangle(base,(20,25),(220,110),80,-1);a=base.copy();b=base.copy()
  for _ in range(80):x,y=rng.integers(25,215),rng.integers(30,105);a[y,x]=240
  for _ in range(80):x,y=rng.integers(25,215),rng.integers(30,105);b[y,x]=240
  self.assertGreater(ssim(cv2.GaussianBlur(a,(0,0),3),cv2.GaussianBlur(b,(0,0),3)),P.STRUCTURAL_SSIM_LIMIT)
 def test_genre_cannot_override_thresholds(self):
  plan=dict(id='test',duration=20,format='9x16',beats=[],texts=[],objects=[],runtime={});self.assertTrue(validate(plan,dict(id='history',motion_mean=0)))
 def test_blurred_crop_has_less_edge_frequency(self):
  im=np.zeros((200,200,3),np.uint8);im[::8]=255;im[:,::8]=255;b=cv2.GaussianBlur(im,(0,0),3)
  self.assertLess(sharpness(b)['edge_frequency']/sharpness(im)['edge_frequency'],P.SHARPNESS_RETENTION)
 def test_color_size_is_inferred_without_self_declared_attributes(self):
  nouns=visual_nouns('Long orange arrows point outward.');arrow=next(x for x in nouns if x['lemma']=='arrow');self.assertEqual(arrow['attributes']['size'],'long');self.assertEqual(arrow['attributes']['color_name'],'orange')
 def test_foreign_object_crossing_label(self):
  panel=np.zeros((60,250,3),np.float64);panel[:]=[28,35,43];cv2.putText(panel,'A clear label',(12,40),cv2.FONT_HERSHEY_SIMPLEX,1,(255,255,255),2);text=dict(background=dict(color='#1C232B'),foreground='#FFFFFF');self.assertLess(background_error(panel,text,0),.02);panel[10:45,100:160]=[209,131,79];self.assertGreater(background_error(panel,text,0),.02)
 def test_short_or_wrong_colored_arrow_cannot_hide_behind_plan_claim(self):
  from types import SimpleNamespace
  image=np.zeros((960,540,3),np.uint8);video=SimpleNamespace(width=540,height=960,duration=1,frame=lambda t:image)
  plan=dict(language='en',beats=[dict(start=0,end=1,narration='Long orange arrows',words=[dict(text='Long',start=0,end=.2),dict(text='orange',start=.2,end=.4),dict(text='arrows',start=.4,end=.7)],visual_terms=[dict(text='arrows',noun='arrows',start=0,end=.7,object_ids=['arrow'])])],objects=[dict(id='arrow',label='arrows',start=0,end=1,bbox=[.1,.4,.5,.3],evidence=dict(palette=['#FF8000'],min_coverage=.001))])
  cv2.arrowedLine(image,(100,500),(150,500),(255,128,0),10);self.assertFalse(G5(video,plan)['passed'])
  image[:]=0;cv2.arrowedLine(image,(100,500),(235,500),(255,128,0),10);self.assertTrue(G5(video,plan)['passed'])
  image[:]=0;cv2.arrowedLine(image,(100,500),(235,500),(0,100,255),10);plan['objects'][0]['evidence']['palette']=['#0064FF'];plan['beats'][0]['visual_terms'][0]['attributes']={'color':'#0064FF'};self.assertFalse(G5(video,plan)['passed'])
 def test_actual_concurrency_must_equal_configuration(self):
  from types import SimpleNamespace
  from unittest.mock import patch
  video=SimpleNamespace(width=960,height=540,duration=20,fps=30,frames=600);plan=dict(duration=20,format='16x9',runtime=dict(configured_concurrency=2,effective_concurrency=1))
  with patch('gate_chung.gates.capabilities',return_value=dict(missing=[])):
   self.assertFalse(G8(video,plan)['passed']);plan['runtime']['configured_concurrency']=1;self.assertTrue(G8(video,plan)['passed'])
 def test_measurement_context_and_predicates_are_shared_roles(self):
  from gate_chung.semantics import role,screen_data
  for word in ('second','millimolar','millinewtons','SDS','kilometres','megawatts','NATO'):self.assertEqual(role(word),'data',word)
  for word in ('lab','study','research','chapter'):self.assertEqual(role(word),'context',word)
  nouns=visual_nouns('Pepper races to the edge. An army marches across the map.');self.assertFalse(any(n['word'] in ('races','marches') for n in nouns))
  self.assertIn('millimolar',screen_data('25mM'));self.assertIn('second',screen_data('0.5m/s'))
 def test_caption_padding_cannot_create_two_simultaneous_boxes(self):
  from gate_chung.captions import nonoverlapping
  rows=nonoverlapping([dict(start=0,end=32,text='Over clean water'),dict(start=30,end=60,text='the pull is strong')]);self.assertEqual(rows[0]['end'],rows[1]['start'])
  with self.assertRaises(ValueError):nonoverlapping([dict(start=0,end=60),dict(start=30,end=90)])
 def test_positive_nouns_without_images_fail_g5(self):
  from types import SimpleNamespace
  image=np.zeros((540,960,3),np.uint8);video=SimpleNamespace(width=960,height=540,duration=3,frame=lambda t:image)
  for noun in ('bowl','pepper','arrow','ship','boat','film','wave','map','army','molecule'):
   sentence='The '+noun+' is visible.';plan=dict(language='en',objects=[],texts=[],beats=[dict(start=0,end=3,narration=sentence,words=[dict(text=noun,start=.2,end=.5)],visual_terms=[])])
   report=G5(video,plan);self.assertFalse(report['passed'],noun);self.assertTrue(any(noun in r['detail'] and not r['passed'] for r in report['rows']),noun)
 def test_preposition_does_not_remove_ship_or_boat(self):
  for sentence,noun in (('The ship across the ocean','ship'),('A boat to the island','boat')):
   self.assertIn(noun,[x['lemma'] for x in visual_nouns(sentence)])
 def test_decimal_speech_is_screen_data_not_an_image_object(self):
  from types import SimpleNamespace
  from gate_chung.semantics import role,screen_data
  self.assertEqual(role('four'),'data');self.assertIn('thirty five point five four',screen_data('35.54 mN/m'))
  image=np.zeros((540,960,3),np.uint8);video=SimpleNamespace(width=960,height=540,duration=3,frame=lambda t:image)
  plan=dict(language='en',objects=[],texts=[dict(text='35.54 mN/m',start=0,end=3)],beats=[dict(start=0,end=3,narration='Thirty five point five four millinewtons per metre.',words=[dict(text=w,start=.2+i*.2,end=.4+i*.2) for i,w in enumerate(('Thirty','five','point','five','four','millinewtons','per','metre'))],visual_terms=[])])
  self.assertTrue(G5(video,plan)['passed'])
  plan['texts']=[];self.assertFalse(G5(video,plan)['passed'])
 def test_caption_boundary_uses_the_decoded_frame_clock(self):
  from gate_chung.model import active
  from gate_chung.video import Video
  self.assertFalse(active(dict(start=2,end=3.2),3.1999999999999997))
  self.assertTrue(active(dict(start=3.2,end=4),3.1999999999999997))
  with tempfile.TemporaryDirectory() as folder:
   path=Path(folder)/'clock.mp4';writer=cv2.VideoWriter(str(path),cv2.VideoWriter_fourcc(*'mp4v'),30,(96,54))
   for i in range(30):writer.write(np.full((54,96,3),40 if i<10 else 210,np.uint8))
   writer.release();v=Video(path)
   self.assertEqual(v.frame_index(.324),9);self.assertLess(v.frame(.324).mean(),70)
   self.assertEqual(v.frame_index(10/30),10);self.assertGreater(v.frame(10/30).mean(),180);v.close()
 def test_core_has_no_episode_import(self):
  root=Path(__file__).resolve().parents[1]
  for p in root.glob('*.py'):
   tree=ast.parse(p.read_text())
   for n in ast.walk(tree):
    if isinstance(n,ast.ImportFrom):self.assertFalse((n.module or '').startswith(('ci.remotion_b','scene','manim')))
 def test_hidden_annotation_does_not_span_a_material_insert(self):
  from gate_chung.timeline import visibility_intervals
  from gate_chung.model import active
  detail=dict(name='detail',text='Map detail');source=dict(name='ai',text='AI minh hoạ (Example)')
  snapshots=[dict(frame=120,boxes=[detail]),dict(frame=0,boxes=[detail]),dict(frame=60,boxes=[source])]
  spans=visibility_intervals(snapshots,'detail','Map detail',0,6);self.assertEqual(spans,[(0,2),(4,6)]);self.assertFalse(any(active(dict(start=a,end=b),3) for a,b in spans))
if __name__=='__main__':unittest.main()
