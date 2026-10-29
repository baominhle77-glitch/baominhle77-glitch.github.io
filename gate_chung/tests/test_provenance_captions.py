import unittest
from types import SimpleNamespace
from gate_chung.gates import G4,G7

class ProvenanceAndCaptionRegressions(unittest.TestCase):
 def test_static_short_scene_can_export_its_initial_geometry(self):
  from ci.layer_plan import measured_layers
  layer=dict(id='ending',x=0,y=0,w=960,h=540,source_width=960,source_height=540,scale_x=1,scale_y=1,fit='contain',viewport=dict(x=0,y=0,w=960,h=540))
  dom=[dict(frame=1752,layers=[layer])];spec=dict(id='ending',source='fixture.mp4',start=58.4,end=60)
  rows=measured_layers(dom,960,540,[spec]);self.assertEqual(len(rows),1);self.assertEqual(rows[0]['content_bbox'],[0,0,1,1]);self.assertEqual(rows[0]['scale_x'],rows[0]['scale_y'])
 def test_source_badge_must_stay_inside_its_own_panel_in_both_formats(self):
  for width,height in ((960,540),(540,960)):
   video=SimpleNamespace(duration=1,width=width,height=height)
   asset=dict(id='material',start=0,end=1,kind='ai_video',ai_label='AI minh hoạ (Gemini)',render_bbox=[.05,.15,.9,.32])
   badge=dict(id='badge',start=0,end=1,role='ai_label',text=asset['ai_label'],asset_id='material',bbox=[.08,.52,.4,.04])
   plan=dict(beats=[],assets=[asset],texts=[badge]);self.assertFalse(G7(video,plan)['passed'])
   badge['bbox']=[.08,.18,.4,.04];self.assertTrue(G7(video,plan)['passed'])
   badge['asset_id']='simulation';self.assertFalse(G7(video,plan)['passed'])
   badge['asset_id']='material';badge['bbox']=[.08,.44,.4,.04];self.assertFalse(G7(video,plan)['passed'])
 def test_real_footage_badge_also_requires_containment(self):
  video=SimpleNamespace(duration=1);asset=dict(id='archive',start=0,end=1,kind='real_video',source_label='National archive',render_bbox=[.1,.2,.8,.4]);badge=dict(id='source',start=0,end=1,role='source',asset_id='archive',text='National archive',bbox=[.12,.22,.4,.05]);plan=dict(beats=[],assets=[asset],texts=[badge]);self.assertTrue(G7(video,plan)['passed']);badge['bbox']=[.12,.7,.4,.05];self.assertFalse(G7(video,plan)['passed'])
 def test_graphic_description_is_rejected_as_a_caption(self):
  video=SimpleNamespace(duration=2)
  for text in ('Long orange arrows','An arrow points outward','The lower panel','Read the label','In our sketch','Zoom from the bowl','Mũi tên màu cam'):
   plan=dict(beats=[],texts=[dict(start=0,end=1,role='caption',text=text,tts_span=[0,1])]);self.assertFalse(G4(video,plan)['passed'],text)
  for text in ('Flow drags water outward.','Clean water pulls harder','Two armies move east.','Nước chảy ra ngoài'):
   plan=dict(beats=[],texts=[dict(start=0,end=1,role='caption',text=text,tts_span=[0,1])]);self.assertTrue(G4(video,plan)['passed'],text)
