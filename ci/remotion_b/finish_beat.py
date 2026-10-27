"""Native proof frames, six images per matrix job, no extra Manim render."""
import argparse,json,subprocess
from PIL import Image,ImageDraw
from pathlib import Path
from prepare import source_data
p=argparse.ArgumentParser();p.add_argument('--beat',required=True);p.add_argument('--short-side',type=int,default=540);a=p.parse_args();root=Path.cwd();b=next(b for b in source_data()['beats'] if b['id']==a.beat);d=root/'work/B_cache'/str(a.short_side)/a.beat
for fmt in ('16x9','9x16'):
 sheet=Image.new('RGB',(1440,588) if fmt=='16x9' else (810,1008),'#1C232B');draw=ImageDraw.Draw(sheet)
 for i,t in enumerate(.15+(max(.1,b['frames']/30-.30))*q/5 for q in range(6)):
  name=f'{i:02d}'
  dest=d/'stills'/f'{fmt}_{name}.png';dest.parent.mkdir(exist_ok=True);subprocess.run(['ffmpeg','-nostdin','-y','-v','error','-ss',str(t),'-i',str(d/f'{fmt}_{a.beat}.mp4'),'-frames:v','1',str(dest)],check=True)
  w,h=(480,294) if fmt=='16x9' else (270,504);im=Image.open(dest);im.thumbnail((w,h-24));x=i%3*w;y=i//3*h;sheet.paste(im,(x,y));draw.text((x+8,y+h-21),a.beat+f' {t:.2f}s',fill='white')
 sheet.save(d/'stills'/f'simulation_6frames_{fmt}_{a.beat}.jpg',quality=95)
print('B_BEAT_PROOF '+a.beat,flush=True)
