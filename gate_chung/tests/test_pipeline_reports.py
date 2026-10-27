"""Common report-routing contract, without any episode content."""
import os
import unittest
from pathlib import Path
from unittest.mock import patch
from ci.remotion_b.output_paths import output_root

class ReportRoutingRegressions(unittest.TestCase):
 def test_metadata_follows_the_selected_resolution(self):
  root=Path('/tmp/video-pipeline')
  with patch.dict(os.environ,{'B_SHORT_SIDE':'1080'}):
   self.assertEqual(output_root(root),root/'work/B1080')
   self.assertEqual(output_root(root,540),root/'work/B')
  with patch.dict(os.environ,{'B_SHORT_SIDE':'540'}):
   self.assertEqual(output_root(root),root/'work/B')
   self.assertEqual(output_root(root,1080),root/'work/B1080')
  with self.assertRaises(ValueError):output_root(root,720)
