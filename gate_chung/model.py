import json,math,unicodedata,re
from pathlib import Path
from .policy import GENRE_KEYS

def read(path):return json.loads(Path(path).read_text(encoding='utf-8'))
def norm(s):return re.sub(r'[^a-z0-9]+',' ',unicodedata.normalize('NFKD',s.lower()).encode('ascii','ignore').decode()).strip()
def active(item,t):
 # Canonicalize floating arithmetic at edit boundaries (e.g. np.arange).
 # This is a nanosecond rounding, not an editorial timing tolerance.
 t=round(float(t),9)
 return round(float(item['start']),9)<=t<round(float(item['end']),9)
def at(items,t):return [v for v in items if active(v,t)]
def bbox(item,t):
 points=item.get('keyframes')
 if not points:return item.get('bbox')
 if t<=points[0]['time']:return points[0]['bbox']
 for a,b in zip(points,points[1:]):
  if t<=b['time']:
   u=(t-a['time'])/(b['time']-a['time']);return [(1-u)*x+u*y for x,y in zip(a['bbox'],b['bbox'])]
 return points[-1]['bbox']
def pixels(box,w,h):
 x,y,bw,bh=box;return max(0,round(x*w)),max(0,round(y*h)),min(w,round((x+bw)*w)),min(h,round((y+bh)*h))
def overlaps(a,b):return a[0]<b[0]+b[2] and a[0]+a[2]>b[0] and a[1]<b[1]+b[3] and a[1]+a[3]>b[1]
def validate(plan,genre):
 errors=[]
 if set(genre)-GENRE_KEYS:errors.append('Genre contains gate/runtime/threshold settings: '+str(sorted(set(genre)-GENRE_KEYS)))
 for key in ('id','duration','format','beats','texts','objects','runtime'):
  if key not in plan:errors.append('Missing plan field '+key)
 duration=plan.get('duration',0)
 if duration<=0:errors.append('duration must be positive')
 for group in ('beats','texts','objects'):
  for item in plan.get(group,[]):
   if not item.get('id'):errors.append(group+': missing id')
   if not 0<=item.get('start',-1)<item.get('end',-1)<=duration+.05:errors.append(group+': invalid span '+str(item.get('id')))
   if group!='beats':
    boxes=[item.get('bbox')] if not item.get('keyframes') else [p.get('bbox') for p in item['keyframes']]
    if not boxes or any(not b or len(b)!=4 or any(not math.isfinite(float(v)) for v in b) or min(b)<0 or b[2]<=0 or b[3]<=0 or b[0]+b[2]>1.001 or b[1]+b[3]>1.001 for b in boxes):errors.append(group+': invalid normalized bbox '+str(item.get('id')))
 return errors
