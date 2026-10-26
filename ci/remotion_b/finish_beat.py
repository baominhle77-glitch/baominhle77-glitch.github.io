"""Native proof frames, six images per matrix job, no extra Manim render."""
import argparse,json,subprocess
from pathlib import Path
from prepare import source_data
p=argparse.ArgumentParser();p.add_argument('--beat',required=True);p.add_argument('--short-side',type=int,default=540);a=p.parse_args();root=Path.cwd();b=next(b for b in source_data()['beats'] if b['id']==a.beat);d=root/'work/B_cache'/str(a.short_side)/a.beat
for fmt in ('16x9','9x16'):
 for name,t in [('first',.15),('middle',b['frames']/60),('last',max(.1,b['frames']/30-.15))]:
  dest=d/'stills'/f'{fmt}_{name}.png';dest.parent.mkdir(exist_ok=True);subprocess.run(['ffmpeg','-nostdin','-y','-v','error','-ss',str(t),'-i',str(d/f'{fmt}_{a.beat}.mp4'),'-frames:v','1',str(dest)],check=True)
print('B_BEAT_PROOF '+a.beat,flush=True)
