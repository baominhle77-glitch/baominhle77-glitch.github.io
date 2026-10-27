"""One native540p material frame/beat/format before full animation rendering."""
import json,sys,argparse
from dataclasses import replace
import cv2,numpy as np
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
R=Path(__file__).resolve().parents[2];sys.path.insert(0,str(R))
from ci.simulation.optical_water import Optics,WaterStage
from ci.remotion_b.stage_spec import make_stage
from gate_chung.appearance import dominant_lab_fraction
H=Path(__file__).resolve().parent

def main():
 p=argparse.ArgumentParser();p.add_argument('--out',type=Path,default=R/'work/R14_preflight');a=p.parse_args();a.out.mkdir(parents=True,exist_ok=True)
 specs=json.loads((H/'optics.json').read_text());layout=json.loads((H/'portrait_layouts.json').read_text());records=[]
 for bid,spec in specs.items():
  t=1.0 if bid=='p1' else 3.0
  wide=a.out/f'native540_16x9_{bid}.png';Image.fromarray(WaterStage(960,540,Optics(**spec)).frame(t)).save(wide)
  doc=a.out/f'native540_9x16_{bid}.png'
  Image.fromarray(make_stage(bid,540,960,portrait=True).frame(t)).save(doc)
  for fmt,file in (('16x9',wide),('9x16',doc)):
   fraction,centre=dominant_lab_fraction(__import__('numpy').array(Image.open(file).convert('RGB')))
   records.append(dict(beat=bid,format=fmt,time=t,image=str(file),dominant_deltaE3_fraction=fraction,pepper_count=spec.get('pepper_count',640)))
 for fmt in ('16x9','9x16'):
  w,h=(480,294) if fmt=='16x9' else (270,504);sheet=Image.new('RGB',(w*3,h*2),'#1C232B');draw=ImageDraw.Draw(sheet)
  for i,r in enumerate(x for x in records if x['format']==fmt):
   im=Image.open(r['image']);im.thumbnail((w,h-24));x=i%3*w;y=i//3*h;sheet.paste(im,(x,y));draw.text((x+8,y+h-21),r['beat']+f' {r["time"]:g}s',fill='white')
  sheet.save(a.out/f'preflight_6beats_{fmt}.jpg',quality=95)
 (a.out/'frames.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n');print(json.dumps(records,ensure_ascii=False))
 for clip in json.loads((H/'gemini.json').read_text()):
  cap=cv2.VideoCapture(str(R/clip['path']));cap.set(cv2.CAP_PROP_POS_MSEC,(clip['in']+.5)*1000);ok,im=cap.read();assert ok;cap.release()
  scene=np.full((960,540,3),[142,150,157],np.uint8);scene[112:416]=cv2.resize(cv2.cvtColor(im,cv2.COLOR_BGR2RGB),(540,304))
  opt=replace(Optics(**specs[clip['simulation_beat']]),**clip['simulation_optics'])
  episode=json.loads((H/'ke_hoach_A.json').read_text());offset=(clip.get('portrait_start',clip['start'])-round(episode['beats'][clip['simulation_beat']]['t0']*30))/30
  scene[448:928]=WaterStage(540,480,opt).frame(.5+offset);picture=Image.fromarray(scene);draw=ImageDraw.Draw(picture);font=ImageFont.truetype(str(R/'ban_sac/fonts/NotoSans-Regular.ttf'),18);draw.rectangle((27,124,225,156),fill='#1C232B');draw.text((35,127),'AI minh hoạ (Gemini)',font=font,fill='white');picture.save(a.out/f'camera_pair_{clip["id"]}.png')
if __name__=='__main__':main()
