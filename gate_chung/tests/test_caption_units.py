"""Unit-bearing phrases cannot end in the English preposition per."""
import unittest
from gate_chung.language import phrase_error
class UnitCaptionRegression(unittest.TestCase):
 def test_per_requires_its_denominator(self):
  self.assertIsNotNone(phrase_error('one metre per'))
  self.assertIsNotNone(phrase_error('through a needle onto'))
  self.assertIsNotNone(phrase_error('falling straight into'))
  self.assertIsNone(phrase_error('ten micrometres across'))
  self.assertIsNone(phrase_error('one metre per second'))
  self.assertIsNone(phrase_error('at that point'))

 def test_metres_matches_si_speed_unit(self):
  from gate_chung.gates import G5
  class Clip:duration=1
  def plan(caption):
   return dict(objects=[],texts=[dict(start=0,end=1,text=caption)],beats=[dict(id='x',start=0,end=1,narration='metres',words=[dict(text='metres',start=.1,end=.4)],visual_terms=[],nonvisual_terms=[])])
  self.assertTrue(G5(Clip(),plan('0.46m/s'))['passed'])
  self.assertFalse(G5(Clip(),plan('0.46kg/s'))['passed'])

 def test_property_units_and_grammar_keep_real_objects(self):
  from gate_chung.semantics import role
  from gate_chung.language import visual_nouns
  self.assertEqual(role('megohm'),'data')
  self.assertEqual(role('radius'),'object')
  nouns=visual_nouns('Their liquid is ninety nine per cent pure. A ship crosses the ocean.')
  self.assertNotIn('Their',[n['word'] for n in nouns])
  self.assertNotIn('pure',[n['word'] for n in nouns])
  self.assertIn('ship',[n['lemma'] for n in nouns])

 def test_predicates_do_not_remove_physical_nouns(self):
  from gate_chung.language import visual_nouns
  for text in ('The ship across the ocean.','A boat to the island.','A film over water.','There are waves over water.'):
   self.assertTrue(visual_nouns(text))
  nouns={x['word'].lower() for x in visual_nouns('Pepper grains float, so they ride the surface. The ring marks where flow stops.')}
  self.assertIn('pepper',nouns)
  self.assertIn('ring',nouns)
  self.assertNotIn('float',nouns)
  self.assertNotIn('marks',nouns)

 def test_coordinated_quantity_predicate_keeps_person_nouns(self):
  from gate_chung.language import visual_nouns
  a={n['word'].lower() for n in visual_nouns('The radius grows to the power three quarters, and shrinks as the threshold rises.')}
  b={n['word'].lower() for n in visual_nouns('Doctors and shrinks treat people.')}
  self.assertNotIn('shrinks',a)
  self.assertIn('shrinks',b)

 def test_physical_scalar_homographs_remain_image_nouns(self):
  from gate_chung.gates import G5
  class Clip:duration=1
  for noun in ('root','peak','threshold','radius'):
   p=dict(objects=[],texts=[],beats=[dict(start=0,end=1,narration='The '+noun+' is visible.',words=[dict(text=noun,start=.1,end=.5)],visual_terms=[],nonvisual_terms=[])])
   self.assertFalse(G5(Clip(),p)['passed'],noun)
