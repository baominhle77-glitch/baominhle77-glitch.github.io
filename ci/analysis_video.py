"""Uniform, lossless 540p input adapter for the original 540p motion gate.

Delivered MP4s remain untouched. No threshold, frame clock, crop or ROI changes.
"""
from contextlib import contextmanager
from pathlib import Path
import json,subprocess,tempfile

def probe(path):
 return json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height,r_frame_rate,nb_frames','-of','json',str(path)]))['streams'][0]

@contextmanager
def canonical_540(video,fmt):
 video=Path(video)
 if fmt not in ('16x9','9x16'):raise ValueError('Unsupported analysis format: '+fmt)
 src=probe(video);target=(960,540) if fmt=='16x9' else (540,960);w,h=int(src['width']),int(src['height'])
 if w*target[1]!=h*target[0]:raise ValueError('ASPECT_MISMATCH: analysis must preserve source geometry')
 s=target[0]/w
 if s>1:raise ValueError('NO_UPSCALE_GATE_INPUT: source is below540p')
 evidence=dict(source=str(video),source_dimensions=[w,h],analysis_dimensions=list(target),uniform_scale=s,frame_rate=src['r_frame_rate'],source_untouched=True)
 if s==1:
  yield video,dict(evidence,proxy_created=False);return
 with tempfile.TemporaryDirectory(prefix='motion-540-') as directory:
  proxy=Path(directory)/'analysis.mp4'
  subprocess.run(['ffmpeg','-nostdin','-y','-v','error','-i',str(video),'-map','0:v:0','-vf',f'scale={target[0]}:{target[1]}:flags=area,setsar=1','-an','-c:v','libx264','-preset','ultrafast','-crf','0','-fps_mode','passthrough',str(proxy)],check=True)
  out=probe(proxy)
  assert (out['width'],out['height'])==target and out['r_frame_rate']==src['r_frame_rate']
  if src.get('nb_frames') not in (None,'N/A'):assert out['nb_frames']==src['nb_frames']
  yield proxy,dict(evidence,proxy_created=True,encoding='libx264 CRF0 lossless after uniform area downscale')
