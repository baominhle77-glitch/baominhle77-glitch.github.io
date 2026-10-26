import math,re,subprocess,shutil,difflib
import cv2,numpy as np
from . import policy as P
from .model import at,active,bbox,pixels,overlaps,norm
from .video import gray,rgb,ssim,sharpness,contiguous,capabilities,Video
from .language import phrase_error,visual_nouns,words
from .semantics import role,screen_data
from .motion import sample,windows,beat_motion

def row(start,end,ok,detail,**metrics):return dict(start=round(float(start),3),end=round(float(end),3),passed=bool(ok),detail=detail,**metrics)
def result(rows,**summary):return dict(passed=all(r['passed'] for r in rows),rows=rows,**summary)
def exclude_text(mask,texts,t,keep_visual=True):
 for v in at(texts,t):
  if keep_visual and v.get('role')=='visual_state':continue
  x,y,X,Y=pixels(bbox(v,t),mask.shape[1],mask.shape[0]);mask[max(0,y-3):Y+3,max(0,x-3):X+3]=False
 return mask

def G1(video,plan,frames):
 rows=[];lag=round(P.PROGRESSION_LAG_S*P.FPS);low_start=None;streaks=[]
 for i in range(1,len(frames)):
  t=i/P.FPS;mask=exclude_text(np.ones(frames.shape[1:],bool),plan['texts'],t);mask=exclude_text(mask,plan['texts'],t-1/P.FPS)
  d=np.abs(frames[i].astype(float)-frames[i-1].astype(float));low=bool((d[mask].mean()/255 if mask.any() else 0)<.001)
  if low and low_start is None:low_start=(i-1)/P.FPS
  if not low and low_start is not None:
   if t-low_start>P.FREEZE_LIMIT_S:streaks.append((low_start,t-1/P.FPS))
   low_start=None
  if i%P.FPS or i<lag:continue
  mask=exclude_text(mask,plan['texts'],t-P.PROGRESSION_LAG_S)
  a=cv2.GaussianBlur(frames[i],(0,0),3);b=cv2.GaussianBlur(frames[i-lag],(0,0),3)
  score=ssim(a,b,mask);rows.append(row(t-4,t,score<P.STRUCTURAL_SSIM_LIMIT,'progression: coarse SSIM against4s earlier, editorial text masked',ssim_4s=round(score,6),limit=P.STRUCTURAL_SSIM_LIMIT))
 if low_start is not None and video.duration-low_start>P.FREEZE_LIMIT_S:streaks.append((low_start,video.duration))
 p=subprocess.run(['ffmpeg','-nostdin','-i',str(video.path),'-vf','freezedetect=n=0.001:d=2','-an','-f','null','-'],capture_output=True,text=True)
 if p.returncode:rows.append(row(0,video.duration,False,'freezedetect failed: '+p.stderr[-300:]))
 starts=list(map(float,re.findall(r'freeze_start:\s*([\d.]+)',p.stderr)));ends=list(map(float,re.findall(r'freeze_end:\s*([\d.]+)',p.stderr)))
 spans=[dict(start=s,end=ends[i] if i<len(ends) else video.duration) for i,s in enumerate(starts)]
 for s,e in streaks:rows.append(row(s,e,False,'text-masked content freeze>2s'))
 for s in spans:rows.append(row(s['start'],s['end'],False,'FFmpeg freeze>2s'))
 if not spans and not streaks:rows.append(row(0,video.duration,True,'FREEZE0'))
 for b in beat_motion(frames,plan['beats']):rows.append(row(b['start'],b['end'],b['pass_scene'],'different composition from every prior beat: mean grayscale difference>=12',beat=b['beat'],comparisons=b['scene_differences']))
 return result(rows,freeze_intervals=spans,content_freeze_intervals=streaks)

def G2(video,plan,frames):
 measured=windows(frames,video.duration);rows=[row(w['start'],w['end'],w['pass_window'],'window '+('DAT' if w['pass_window'] else 'TRUOT')+'; gate uses aggregate28/30, not30/30',**{k:v for k,v in w.items() if k not in ('start','end')}) for w in measured['rows']]
 # Window failures remain visible. The gate verdict follows the fixed aggregate.
 beats=beat_motion(frames,plan['beats'])
 for b in beats:rows.append(row(b['start'],b['end'],b['pass_motion'],'per-beat original C17 thresholds',**{k:v for k,v in b.items() if k not in ('start','end')}))
 return dict(passed=measured['pass_gate'] and all(b['pass_motion'] for b in beats),rows=rows,passed_windows=measured['passed'],total_windows=measured['total'],required_windows=measured['required'],rolling_60s=measured['rolling_60s'])

def object_mask(image,item,t):
 box=bbox(item,t);x,y,X,Y=pixels(box,image.shape[1],image.shape[0]);crop=image[y:Y,x:X];e=item.get('evidence',{});mask=np.zeros(image.shape[:2],np.uint8)
 if not crop.size:return mask
 if e.get('palette'):
  m=np.zeros(crop.shape[:2],bool)
  for c in e['palette']:m|=np.linalg.norm(crop.astype(float)-rgb(c),axis=2)<=e.get('tolerance',45)
 else:
  bg=rgb(e['background']);m=np.linalg.norm(crop.astype(float)-bg,axis=2)>e.get('tolerance',24)
 mask[y:Y,x:X]=m.astype(np.uint8);return mask

def clip_sharpness(video,t,box,texts):
 x,y,X,Y=pixels(box,video.width,video.height);image=video.frame(t)[y:Y,x:X];mask=np.ones((Y-y,X-x),bool)
 mask[:4]=False;mask[-4:]=False;mask[:,:4]=False;mask[:,-4:]=False
 for label in at(texts,t):
  a,b,A,B=pixels(bbox(label,t),video.width,video.height);mask[max(0,b-y-4):min(Y-y,B-y+4),max(0,a-x-4):min(X-x,A-x+4)]=False
 return sharpness(image,mask)

def component_width(mask):
 count,labels,stats,centroids=cv2.connectedComponentsWithStats(mask.astype(np.uint8),8)
 if count<=1:return 0
 best=stats[1:][np.argmax(stats[1:,cv2.CC_STAT_AREA])];return int(best[cv2.CC_STAT_WIDTH])

def G3(video,plan):
 rows=[];portrait=video.height>video.width;ref=None
 for sec in range(math.ceil(video.duration)):
  t=min(sec+.35,video.duration-.05);image=video.frame(t);prim=at([o for o in plan['objects'] if o.get('primary')],t)
  if not prim:rows.append(row(sec,min(sec+1,video.duration),False,'no primary object registered'));continue
  groups={}
  for o in prim:
   mask=object_mask(image,o,t);mask=exclude_text(mask.astype(bool),plan['texts'],t,keep_visual=False)
   key=o.get('primary_group',o['id']);groups[key]=groups.get(key,np.zeros(video.height,bool))|(mask.sum(axis=1)>=video.width*.03)
  main=max((float(rows.mean()) for rows in groups.values()),default=0)
  if not portrait:rows.append(row(sec,min(sec+1,video.duration),main>0,'landscape primary presence; portrait-specific bands/height not applicable',primary_height=round(main,4)))
  # A band must be almost uniform across the whole width. Text breaks a band;
  # a blurry self-background still fails the independent primary-height test.
  if portrait:
   g=gray(image);dark=(g<12).mean(axis=1)>.98;uniform=(image.max(axis=1)-image.min(axis=1)).max(axis=1)<10
   bands=contiguous(dark|uniform);maximum=max((b-a for a,b in bands),default=0)/video.height
   rows.append(row(sec,min(sec+1,video.duration),main>=P.PORTRAIT_PRIMARY_HEIGHT and maximum<=P.PORTRAIT_EMPTY_LIMIT,'portrait primary height and continuous empty/black band',primary_height=round(main,4),empty_band_height=round(maximum,4)))
  clips=at([a for a in plan.get('assets',[]) if a.get('kind') in ('real_video','ai_video')],t)
  for asset in clips:
   source=asset.get('source_dimensions');display=asset.get('render_bbox',[0,0,1,1]);crop=asset.get('source_crop',[0,0,1,1])
   if not source:rows.append(row(sec,min(sec+1,video.duration),False,'missing original source dimensions'));continue
   scales=[display[2]*video.width/(source['width']*crop[2]),display[3]*video.height/(source['height']*crop[3])];scale=max(scales)
   rows.append(row(sec,min(sec+1,video.duration),scale<=P.MAX_REAL_VIDEO_SCALE+.001,'real/AI footage must not be enlarged; insufficient source requires split layout with simulation',asset=asset['id'],source=source,display_bbox=display,scale=round(scale,5),maximum=P.MAX_REAL_VIDEO_SCALE))
   if not portrait:continue
   reference=asset.get('landscape_reference')
   if not reference:rows.append(row(sec,min(sec+1,video.duration),False,'video asset lacks landscape sharpness reference: '+asset['id']));continue
   if ref is None or str(ref.path)!=reference:ref=Video(reference)
   # Compare the same editorial time, excluding labels/subtitles in each ROI.
   reference_t=t-asset.get('reference_start',0)+asset.get('reference_in',0) if asset.get('reference_is_source') else t
   if not 0<=reference_t<ref.duration:rows.append(row(sec,min(sec+1,video.duration),False,'reference source clock out of range'));continue
   a=clip_sharpness(video,t,asset.get('sharpness_bbox',asset.get('render_bbox',[0,0,1,1])),plan['texts']);b=clip_sharpness(ref,reference_t,asset.get('reference_sharpness_bbox',[0,0,1,1]),asset.get('reference_texts',[]));retention=a['edge_frequency']/max(1e-9,b['edge_frequency']);raw_ratio=a['laplacian']/max(1e-9,b['laplacian'])
   rows.append(row(sec,min(sec+1,video.duration),retention>=P.SHARPNESS_RETENTION,'portrait sharpness: Laplacian variance normalized by edge energy; weak crop requires native portrait or better source',asset=asset['id'],laplacian=round(a['laplacian'],4),landscape_laplacian=round(b['laplacian'],4),laplacian_ratio=round(raw_ratio,4),edge_frequency_retention=round(retention,4),minimum=P.SHARPNESS_RETENTION))
 if ref:ref.close()
 return result(rows)

def G4(video,plan):
 rows=[];caps=[t for t in plan['texts'] if t.get('role')=='caption']
 for c in caps:
  problem=phrase_error(c['text']);span=c.get('tts_span');valid=span is not None and abs(c['start']-span[0])<=P.TTS_TOLERANCE and abs(c['end']-min(video.duration,span[1]))<=P.TTS_TOLERANCE
  rows.append(row(c['start'],c['end'],not problem and valid,problem or ('TTS ±0.2s' if valid else 'missing/incorrect TTS word clock'),text=c['text'],tts_span=span))
 spoken=[b for b in plan['beats'] if b.get('narration')]
 if spoken and not caps:rows.append(row(0,video.duration,False,'spoken video has no captions'))
 for b in spoken:
  events=b.get('words',[])
  if not events:rows.append(row(b['start'],b['end'],False,'narration lacks TTS word events'))
  for w in events:
   if w['start']>=video.duration:continue
   if not any(c['start']-P.TTS_TOLERANCE<=w['start'] and c['end']+P.TTS_TOLERANCE>=min(video.duration,w['end']) for c in caps):rows.append(row(w['start'],min(video.duration,w['end']),False,'spoken word has no aligned caption',text=w['text']))
 return result(rows)

def G5(video,plan):
 rows=[];registry={o['id']:o for o in plan['objects']};language=plan.get('language','en')
 for beat in plan['beats']:
  terms=beat.get('visual_terms',[]);nonvisual=beat.get('nonvisual_terms',[])
  try:candidates=visual_nouns(beat.get('narration',''),language)
  except Exception as exc:rows.append(row(beat['start'],beat['end'],False,'NLP model unavailable: '+str(exc)));continue
  covered={norm(t.get('noun',t.get('text',''))) for t in terms};exempt={norm(x['text']) for x in nonvisual if len(x.get('reason',''))>=12}
  if language!='en' and beat.get('narration') and not terms:rows.append(row(beat['start'],beat['end'],False,'non-English narration requires visual noun spans in plan'))
  for noun in candidates:
   times=[(i,w) for i,w in enumerate(beat.get('words',[])) if norm(w['text'])==norm(noun['word'])]
   if times and all(beat['words'][max(0,i-noun.get('modifier_count',0))]['start']>=video.duration for i,w in times):continue
   if norm(noun['word']) not in covered and norm(noun['lemma']) not in covered:
    rows.append(row(beat['start'],beat['end'],False,'unmapped visual noun: '+noun['word'],sentence=beat['narration']))
  for w in beat.get('words',[]):
   if w['start']>=video.duration or role(w['text'].strip('.,;:!?'))!='data':continue
   token=w['text'].strip('.,;:!?');visible=' '.join(t['text'] for t in at(plan['texts'],min(video.duration-.01,w['start']+.1)));normalized=screen_data(visible);key=token.lower()
   ok=key in normalized or (key in {'point','points'} and bool(re.search(r'\d+\.\d+',visible))) or (key in {'second','seconds','metre','meter'} and ('m/s' in visible or 'per second' in normalized)) or (key in {'year','years','century','centuries'} and bool(re.search(r'\d{3,4}',visible)))
   rows.append(row(w['start'],min(video.duration,w['end']),ok,'measurement/time/symbol must map to visible screen data, not a physical-image noun',term=token,screen=visible))
  for term in terms:
   start,end=term['start'],min(video.duration,term['end'])
   if start>=video.duration:continue
   items=[registry[k] for k in term.get('object_ids',[]) if k in registry]
   if not items:rows.append(row(start,end,False,'visual noun has no object binding',sentence=beat['narration'],term=term['text']));continue
   for t in np.arange(start+.05,max(start+.051,end),.25):
    found=[]
    for obj in items:
     if not active(obj,float(t)):continue
     image=video.frame(float(t));mask=object_mask(image,obj,float(t));x,y,X,Y=pixels(bbox(obj,float(t)),video.width,video.height);roi=mask[y:Y,x:X];present=roi.size and roi.mean()>=obj.get('evidence',{}).get('min_coverage',.015)
     attrs=dict(term.get('attributes',{}));inferred=next((c.get('attributes',{}) for c in candidates if norm(c['word'])==norm(term.get('noun',term['text']))),{});attrs.update(inferred);width=0.;color_ok=True
     if attrs.get('color') or attrs.get('color_name'):
      crop=image[y:Y,x:X].astype(float);colored=color_pixels(crop,attrs)
      ys,xs=np.where(colored);width=component_width(colored)/video.width;color_ok=bool(len(xs)>max(3,roi.size*.002))
     else:
      ys,xs=np.where(roi);width=(int(xs.max())-int(xs.min())+1)/video.width if len(xs) else 0.
     long_ok=attrs.get('size')!='long' or width>=P.LONG_WIDTH
     found.append((present and color_ok and long_ok,obj['id'],width))
    ok=any(x[0] for x in found);rows.append(row(t,min(t+.25,end),ok,'visual object + attributes verified from frame pixels',term=term['text'],sentence=beat['narration'],objects=[dict(id=k,visible_width=round(w,4),passed=p) for p,k,w in found]))
 return result(rows)

def color_pixels(crop,attrs):
 name=attrs.get('color_name')
 if not name:return np.linalg.norm(crop-rgb(attrs['color']),axis=2)<50
 hsv=cv2.cvtColor(crop.astype(np.uint8),cv2.COLOR_RGB2HSV);h,s,v=hsv[:,:,0],hsv[:,:,1],hsv[:,:,2]
 if name=='white':return (s<45)&(v>190)
 if name=='black':return v<70
 if name in ('gray','grey'):return (s<50)&(v>=70)&(v<=210)
 ranges={'orange':(5,25),'blue':(85,135),'green':(35,85),'yellow':(25,35),'purple':(135,160),'pink':(155,175)}
 if name=='red':return ((h<10)|(h>170))&(s>70)&(v>70)
 lo,hi=ranges[name];return (h>=lo)&(h<=hi)&(s>60)&(v>60)

def background_error(image,text,t):
 crop=image;bg=rgb(text.get('background',{}).get('color','#000000'));fg=rgb(text.get('foreground','#FFFFFF'));d=fg-bg;alpha=np.clip(((crop-bg)*d).sum(axis=2)/max(1,float(d@d)),0,1);fit=bg+alpha[:,:,None]*d
 # Median border estimates a translucent band's actual composited background.
 border=np.concatenate((crop[:2].reshape(-1,3),crop[-2:].reshape(-1,3),crop[:,:2].reshape(-1,3),crop[:,-2:].reshape(-1,3)));observed=np.median(border,axis=0);d2=fg-observed;a2=np.clip(((crop-observed)*d2).sum(axis=2)/max(1,float(d2@d2)),0,1);fit2=observed+a2[:,:,None]*d2
 distance=np.minimum(np.linalg.norm(crop-fit,axis=2),np.linalg.norm(crop-fit2,axis=2))
 # Chromium LCD/subpixel antialiasing produces colored pixels around letters.
 # Exclude a3px neighborhood of the high-contrast glyph core, not the panel.
 core=(np.abs(crop-fg).mean(axis=2)<65).astype(np.uint8);glyph=cv2.dilate(core,np.ones((5,5),np.uint8))>0
 return float(((distance>35)&~glyph).mean())

def G6(video,plan):
 rows=[];seen=set()
 for sec in np.arange(.2,video.duration,.5):
  texts=at(plan['texts'],float(sec))
  for a in texts:
   box=bbox(a,float(sec));bg=a.get('background',{});safe=min(box[0],box[1],1-box[0]-box[2],1-box[1]-box[3])>=P.SAFE_MARGIN-.001
   font_ok=a.get('role')!='caption' or a.get('font_size',0)*540/min(video.width,video.height)>=P.MIN_CAPTION_FONT
   patch=video.crop(float(sec),box).astype(float);intrusion=background_error(patch,a,float(sec)) if patch.size else 1
   valid=safe and bg.get('opacity',0)>=.8 and font_ok and intrusion<=.02
   rows.append(row(sec,min(sec+.5,video.duration),valid,'safe margin/background/font + visible object intrusion into text panel',text=a['text'],role=a.get('role'),intrusion_fraction=round(intrusion,4)))
   for b in texts:
    if a['id']<b['id'] and overlaps(box,bbox(b,float(sec))):rows.append(row(sec,min(sec+.5,video.duration),False,'overlapping text boxes',text=a['text']+' / '+b['text']))
   if a['id'] in seen:continue
   seen.add(a['id'])
   if not shutil.which('tesseract'):rows.append(row(sec,sec,False,'tesseract unavailable'));continue
   # Verify text exists, not just a claimed empty rectangle. OCR is cached per
   # text occurrence; pixel/background and overlap checks continue every0.5s.
   im=cv2.resize(patch.astype(np.uint8),None,fx=3,fy=3,interpolation=cv2.INTER_CUBIC);ok,png=cv2.imencode('.png',cv2.cvtColor(im,cv2.COLOR_RGB2BGR));p=subprocess.run(['tesseract','stdin','stdout','--psm','6','-l','eng'],input=png.tobytes(),capture_output=True)
   observed=norm(p.stdout.decode(errors='replace'));expected=norm(a['text']);similar=difflib.SequenceMatcher(None,observed,expected).ratio();rows.append(row(sec,min(sec+.5,video.duration),p.returncode==0 and similar>=.67,'OCR text presence',text=a['text'],observed=observed,similarity=round(similar,3)))
 return result(rows)

def G7(video,plan):
 rows=[]
 for sec in np.arange(.25,video.duration,1.):
  texts=at(plan['texts'],float(sec));beat=next((b for b in plan['beats'] if active(b,float(sec))),None);sources=[t for t in texts if t.get('role')=='source']
  if beat and beat.get('source_required'):rows.append(row(sec,min(sec+1,video.duration),bool(sources),'source line throughout material beat',beat=beat['id']))
  for asset in at(plan.get('assets',[]),float(sec)):
   if asset.get('kind')!='ai_video':continue
   label=asset.get('ai_label');labels=[t for t in texts if t.get('role')=='ai_label' and norm(t['text'])==norm(label or '')];rows.append(row(sec,min(sec+1,video.duration),bool(labels) and bool(re.match(r'^AI minh hoạ \(.+\)$',label or '')),'AI provenance label',asset=asset['id'],label=label))
 return result(rows)

def G8(video,plan):
 rows=[]
 try:
  cap=capabilities();rows.append(row(0,video.duration,not cap['missing'],'FFmpeg muxer/encoder/filter preflight',**cap))
 except Exception as exc:rows.append(row(0,video.duration,False,'FFmpeg preflight failed: '+str(exc)))
 run=plan['runtime'];configured=run.get('configured_concurrency',run.get('requested_concurrency'));actual=run.get('effective_concurrency');rows.append(row(0,video.duration,configured is not None and configured==actual,'actual concurrency must equal configured; report desired/capacity separately',configured=configured,effective=actual,desired=run.get('desired_concurrency'),cpu_capacity=run.get('cpu_capacity')))
 meta_ok=min(video.width,video.height)>=540 and abs(video.duration-plan['duration'])<=1/30+.001 and abs(video.fps-30)<.01 and ((video.height>video.width)==(plan['format']=='9x16'));rows.append(row(0,video.duration,meta_ok,'native540p/30fps and planned duration',width=video.width,height=video.height,fps=video.fps,frames=video.frames,duration=video.duration))
 return result(rows)
