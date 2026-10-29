"""Original C17 full-frame v2 mathematics, independent of any episode/scene."""
import math,subprocess
import numpy as np
from . import policy as P

def sample(path,duration):
 p=subprocess.run(['ffmpeg','-nostdin','-v','error','-i',str(path),'-t',str(duration),'-vf',f'fps={P.FPS},scale=240:135,format=gray','-an','-pix_fmt','gray','-f','rawvideo','-'],capture_output=True)
 if p.returncode:raise RuntimeError(p.stderr.decode(errors='replace'))
 return np.frombuffer(p.stdout,dtype=np.uint8).reshape(-1,135,240)
def windows(frames,duration):
 diff=np.abs(frames[1:].astype(np.int16)-frames[:-1].astype(np.int16))>P.PIXEL_DIFFERENCE
 recurring=diff.mean(axis=0)>=P.RECURRING_PIXEL_FRACTION;diff[:,recurring]=False
 rows=[]
 for t in range(0,math.ceil(duration),2):
  indices=[j-1 for j in range(1,len(frames)) if t<=j/P.FPS<min(t+2,duration)];d=diff[indices]
  if not len(d):continue
  area=d.mean(axis=(1,2))*100;mean=float(area.mean());union=float(d.any(axis=0).mean()*100);pairs=float((area>=P.MOTION_PAIR_AREA).mean()*100)
  rows.append(dict(start=t,end=min(t+2,duration),mean_pct=mean,union_pct=union,pairs_ge3_pct=pairs,pass_window=mean>=P.MOTION_MEAN and union>=P.MOTION_UNION and pairs>=P.MOTION_PAIR_FRACTION))
 required=math.ceil(len(rows)*P.WINDOW_PASS_NUMERATOR/P.WINDOW_PASS_DENOMINATOR);count=sum(r['pass_window'] for r in rows)
 rolling=[dict(start=rows[i]['start'],passed=sum(w['pass_window'] for w in rows[i:i+30]),required=28) for i in range(max(0,len(rows)-29))]
 return dict(rows=rows,passed=count,total=len(rows),required=required,rolling_60s=rolling,pass_gate=count>=required and all(w['passed']>=28 for w in rolling))

def beat_motion(frames,beats):
 diff=np.abs(frames[1:].astype(np.int16)-frames[:-1].astype(np.int16))>P.PIXEL_DIFFERENCE;diff[:,diff.mean(axis=0)>=P.RECURRING_PIXEL_FRACTION]=False
 rows=[];previous=[]
 for b in beats:
  idx=[j-1 for j in range(1,len(frames)) if b['start']<=j/P.FPS<b['end']]
  d=diff[idx];areas=d.mean(axis=(1,2))*100;mean=float(areas.mean());union=float(d.any(axis=0).mean()*100);pairs=float((areas>=3).mean()*100)
  low=0;longest=0
  for area in areas:
   low=low+1 if area<.3 else 0;longest=max(longest,low)
  center=frames[min(len(frames)-1,round((b['start']+b['end'])/2*P.FPS))].astype(float);dist=[dict(beat=id,difference=float(np.abs(center-f).mean())) for id,f in previous];previous.append((b['id'],center))
  rows.append(dict(beat=b['id'],start=b['start'],end=b['end'],mean_pct=mean,union_pct=union,pairs_ge3_pct=pairs,low_streak_s=longest/P.FPS,scene_differences=dist,pass_motion=mean>=5 and union>=15 and pairs>=60 and longest/P.FPS<=2,pass_scene=all(x['difference']>=12 for x in dist)))
 return rows
