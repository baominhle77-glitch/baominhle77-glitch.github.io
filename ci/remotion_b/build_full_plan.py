"""Author full beat content from the measured voice timeline; no template edits."""
import json,math,re,sys
from pathlib import Path
from functools import lru_cache
from PIL import ImageFont
R=Path(__file__).resolve().parents[2];H=Path(__file__).resolve().parent;sys.path.insert(0,str(R))
from gate_chung.language import phrase_error
from gate_chung.semantics import spoken_integer,NUMBER_WORDS,unit
from narration_source import for_beat
from full_source_audit import normalized
TITLES=['What pulls the pepper?','Clean water pulls harder','Ring under steady feeding','Tension drives flow','Surface pull changes','Surface drags water','Measuring the flow','Different molecules, different rings','Crowding at the surface','A balance of stresses','Pepper follows the surface','Three flow zones','Beyond the clear zone','Speed builds then falls','A sudden slowdown','Water returns below','Feeding changes the radius','Longer tails, larger zones','Changing the molecular head','Soap leaves the surface','Why the flow stops','Estimating surface speed','A thin moving layer','A thinner soap layer','Predicting the ring radius','Where the model fails','Measuring molecular thresholds','Three kinds of evidence','Measured surface speeds','Calculated quantities','Assumptions behind the numbers','Limits of the experiment','From capillarity to flow','Clean water does the pulling','Next: wine climbs glass']
ALIASES={'ninety nine':'99','zero point four six metres per second':'0.46m/s','half a metre per second':'0.5m/s','thirty six millinewtons per metre':'36mN/m','eighteen point two':'18.2','zero point four six':'0.46','zero point one seven':'0.17','two point seven three':'2.73','eight point two three':'8.23','one point six eight':'1.68','thirty six':'36','twenty five':'25'}
def display(text):
 for a,b in ALIASES.items():text=re.sub(r'\b'+a+r'\b',b,text,flags=re.I)
 return text.strip()
def caption_phrases(narration,events):
 matches=list(re.finditer(r"[a-z]+(?:'[a-z]+)?|\d+",narration.lower()));chunks=[];j=0
 for e in events:
  count=len(normalized(e['w']));end=j+count;assert [m.group() for m in matches[j:end]]==normalized(e['w']),(e,j)
  a=matches[j].start();z=matches[end].start() if end<len(matches) else len(narration);chunks.append(narration[a:z].strip());j=end
 assert j==len(matches)
 import nltk
 flat=[w for e in events for w in e['w'].split()];tags=nltk.pos_tag(flat);ends=[];count=0
 for e in events:count+=len(e['w'].split());ends.append(count)
 @lru_cache(None)
 def solve(i):
  if i==len(events):return 0,[]
  best=None
  for z in range(i+1,min(len(events),i+13)+1):
   raw=' '.join(chunks[i:z]);phrase=display(raw);n=len(phrase.split())
   if n>5:continue
   if phrase_error(phrase):continue
   # Keep a quantity with its unit and do not split a multiword event.
   tail=normalized(raw)[-1];nxt=normalized(events[z]['w'])[0] if z<len(events) else ''
   if tail in NUMBER_WORDS and (unit(nxt) or nxt in NUMBER_WORDS or nxt=='point'):continue
   if tail=='point' or nxt=='per' or tail=='per' or (tail=='half' and nxt in ('a','metre','meter')):continue
   if unit(tail) and unit(nxt):continue
   tag=tags[ends[z-1]-1][1];next_tag=tags[ends[z-1]][1] if z<len(events) else '';punct=raw[-1] in '.?!;:,'
   if not punct and tag in {'IN','TO','DT','CC','PRP$','MD'} and not (tail=='across' and any(unit(x) for x in normalized(raw)[:-1])):continue
   if not punct and ((tag.startswith('JJ') or tag=='VBG') and next_tag.startswith('NN')):continue
   if not punct and tag.startswith('NN') and next_tag.startswith('NN'):continue
   rest=solve(z)
   if rest is None:continue
   punctuation=raw[-1] if raw else '';score=rest[0]+({'.':100,'?':100,'!':100,';':70,':':65,',':40}.get(punctuation,0))-(n-4)**2-8
   if re.search(r'[.!?]\s+\w',raw):score-=150
   if nxt in ('of','than','per'):score-=35
   if not punct and tag.startswith('VB'):
    passive=tag in {'VBN','VBG'} and bool(set(normalized(raw))&{'is','are','was','were','be','been'})
    question=normalized(raw)[0] in {'how','why','what','where','when'} and bool(set(normalized(raw))&{'do','does','did','can','could','should','would','will','must'})
    if not passive and not question:score-=100
   if not punct and tag=='PRP' and next_tag.startswith('VB') and normalized(raw)[0] in {'how','why','what','where','when'}:score-=100
   item=(score,[phrase]+rest[1])
   if best is None or score>best[0]:best=item
  return best
 answer=solve(0)
 if answer is None:raise ValueError(('L6_CANNOT_PHRASE',narration))
 return answer[1]
def main():
 t=json.loads((H/'full_timeline.json').read_text());phrases={};beats=[];font=ImageFont.truetype(str(R/'ban_sac/fonts/NotoSans-Regular.ttf'),30);tf=ImageFont.truetype(str(R/'ban_sac/fonts/NotoSans-Regular.ttf'),32)
 for index,b in enumerate(t['beats']):
  bid=b['id'];s=for_beat(bid);phrases[bid]=caption_phrases(s['narration'],s['words']);d=b['frames']/30;section=bid in ('p1','p5','v4','c3','w1','w3','w4');molecules=bid in ('p3','p4','v6','v7','c3','w1','w4')
  depth=(.14,.26,.40,.52)[index%4];env=('dark','backlit','bright')[index%3];lower_env=('bright','dark','backlit')[(index//3)%3]
  optics=dict(ellipse_ratio=(.28,.40,.58)[index%3],vessel='ceramic' if index%4==0 else 'glass',shot='wide',impact=.15,feeding=bid!='h1',nozzle=bid in ('h3','p2','c2','v2','v5','c3','w5','w6'),section=section,molecules=molecules,seed=219+index*7,environment=env,vessel_depth=depth)
  lower=dict(ellipse_ratio=.92,section=False,environment=lower_env)
  events=[dict(t=.15,kieu='giot',manh=1.)];pans=[-.9,-.2,.8,.25,-.75,.1,.9,-.4]
  for k in range(1,math.ceil(d/2.4)):
   at=round(k*2.4,4)
   if at>=d-.05:continue
   events.append(dict(t=at,kieu='camera',do_cao=.60 if k%2 else .26,lia=.8 if k%2 else -.8,lia_doc=pans[(k+index)%len(pans)]))
  # Distinct, physically visible injection events accompany long explanations.
  for at in (7.1,13.1,19.1):
   if at<d-.4:events.append(dict(t=at,kieu='giot',manh=.2))
  regions={}
  for fmt,W,HH in [('16x9',960,540),('9x16',540,960)]:
   doc=fmt=='9x16';titlew=min(W*.82,tf.getlength(TITLES[index])+20);sourcew=min(W*.85,455 if bid in ('h4','w2','r2','s8') else 295)
   boxes=[[.05,.385 if doc else .04,titlew/W,(32*1.18+14)/HH],[.05,.94 if doc else .93,sourcew/W,(14*1.15+4)/HH]]
   for phrase in phrases[bid]:
    maxw=W*(.82 if doc else .93);lines=[];line=''
    for w in phrase.split():
     trial=(line+' '+w).strip()
     if font.getlength(trial)+24>maxw and line:lines.append(line);line=w
     else:line=trial
    lines.append(line);cw=min(maxw,max(font.getlength(x) for x in lines)+24);ch=36*len(lines)+12;bottom=HH*(1-(.115 if doc else .20));center=W*(.445 if doc else .5)
    boxes.append([(center-cw/2)/W,(bottom-ch)/HH,cw/W,ch/HH])
   regions[fmt]=boxes
  beats.append(dict(id=bid,bat_dau=b['start']/30,ket_thuc=(b['start']+b['frames'])/30,loai='mo_phong',mo_ta=TITLES[index],optics=optics,optics_duoi=lower,khung={'16x9':'toan'},su_kien=sorted(events,key=lambda e:e['t']),khoang_clip=[],vung_chu=regions))
  b['title']=TITLES[index]
 # Reuse is declared: twelve insertions from the three supplied original files.
 clips=[];sources=('h1','c2','p2');starts=[0,8,19,70,125,180,235,290,345,400,455,485]
 for i,start in enumerate(starts):
  source=sources[i%3];length=6 if i!=1 else 5;bid=next(b['id'] for b in t['beats'] if b['start']/30<=start<(b['start']+b['frames'])/30)
  clips.append(dict(id=f'{source}-{i:02d}',path=f'assets/k1t3/broll_gemini/{source}_16x9.mp4',start=round(start*30),frames=length*30,label='AI minh hoạ (Gemini)',source='GĐ original Gemini attachment; explicitly reused source '+source,source_id=source,reused=i>=3,**{'in':3. if source=='h1' else 0.},focus_x=50,focus_y=50,simulation_beat=bid,native_underlay=True))
  for b in beats:
   a=max(start,b['bat_dau']);z=min(start+length,b['ket_thuc'])
   if a<z:b['khoang_clip'].append([a,z])
 bv=dict(phien_ban='khuon-v1',tong_giay=t['duration'],fps=30,bo_cuc_doc={'tren':.4},beats=beats)
 for p,value in [('ban_ve_B60.json',bv),('caption_phrases.json',phrases),('gemini.json',clips),('full_timeline.json',t)]: (H/p).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
 print('FULL_PLAN',len(beats),'beats',sum(map(len,phrases.values())),'captions',t['duration'],'seconds')
if __name__=='__main__':main()
