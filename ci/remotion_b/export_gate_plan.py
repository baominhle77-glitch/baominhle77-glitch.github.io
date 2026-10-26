"""K1 content adapter only. gate_chung imports none of this episode's code."""
import argparse,json,sys,re,math,subprocess
from PIL import ImageFont
from pathlib import Path
R=Path(__file__).resolve().parents[2];sys.path.insert(0,str(R));from gate_chung.language import visual_nouns
from gate_chung.model import norm
H=Path(__file__).resolve().parent

def main():
 p=argparse.ArgumentParser();p.add_argument('--video-root',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args();a.out.mkdir(parents=True,exist_ok=True)
 data=json.loads((H/'public/data.json').read_text());original=json.loads((H/'ke_hoach_A.json').read_text());tts=json.loads((R/'out/M1_MARANGONI_DUNG/_build/tts.json').read_text());align=json.loads((a.video_root/'caption_alignment.json').read_text());runtime=json.loads((a.video_root/'remotion_render.json').read_text())
 landscape_texts=[]
 for fmt in ('16x9','9x16'):
  doc=fmt=='9x16';W,HH=(540,960) if doc else (960,540);dom=json.loads((a.video_root/f'dom_{fmt}.json').read_text());texts=[];objects=[];beats=[];assets=[]
  def latest_box(name,text,start):
   found=[(abs(z['frame']/30-max(.15,start)),b) for z in dom for b in z['boxes'] if b['name']==name and b.get('text')==text and z['frame']>=3]
   if not found:
    if name!='caption':raise ValueError((name,text,start))
    font=ImageFont.truetype(str(R/'ban_sac/fonts/NotoSans-Regular.ttf'),30);limit=W*(.82 if doc else .93);lines=[];line=''
    for word in text.split():
     candidate=(line+' '+word).strip()
     if font.getlength(candidate)+24>limit and line:lines.append(line);line=word
     else:line=candidate
    lines.append(line);width=min(limit,math.ceil(max(font.getlength(l) for l in lines))+24);height=36*len(lines)+12;center=W*.035+limit/2;bottom=HH*(1-(.115 if doc else .105))
    return [(center-width/2)/W,(bottom-height)/HH,width/W,height/HH],30
   b=min(found,key=lambda z:z[0])[1];return [b['x']/W,b['y']/HH,b['w']/W,b['h']/HH],b['font']
  def add_text(id,name,text,start,end,role,tts_span=None):
   box,font=latest_box(name,text,start)
   if name=='mechanism':box[3]=min(box[3],(font*1.3+10)/HH)
   item=dict(id=id,start=start,end=end,bbox=box,text=text,role=role,font_size=font,foreground='#1C232B' if role=='source' else '#FFFFFF',background=dict(color='#A7ADB3' if role=='source' else '#1C232B',opacity=.95 if role in ('source','ai_label') else 1.))
   if tts_span:item['tts_span']=tts_span
   texts.append(item);return item
  for b in data['beats']:
   start=b['start']/30;end=(b['start']+b['frames'])/30;bid=b['id'];n=original['beats'][bid]['n'];offset=original['beats'][bid]['t0']+original['beats'][bid]['t_chuyen'];raw=json.loads((R/'out/_tts_cache'/Path(tts['beats'][bid]['words']).name).read_text());events=[dict(text=w['w'],start=offset+w['t0'],end=offset+w['t1']) for w in raw]
   beat=dict(id=bid,start=start,end=end,narration=n,words=events,source_required=True,visual_terms=[],nonvisual_terms=[]);beats.append(beat)
   records=[(z,bx) for z in dom if start<=z['frame']/30<end for bx in z['boxes'] if bx['name'] not in ('caption','gemini')];unique={}
   for z,bx in records:unique[(bx['name'],bx['text'])]=bx
   for (name,text),bx in unique.items():
    seen=[z['frame']/30 for z in dom if start<=z['frame']/30<end and any(q['name']==name and q.get('text')==text for q in z['boxes'])];actual_start=start if name in ('title','source') else min(seen,default=start)
    add_text(bid+'-'+name,name,text,actual_start,end,'title' if name=='title' else ('source' if name=='source' else 'legend'))
   mainbox=([.03,.14,.94,.80] if bid in ('h1','h2','h3') else [.03,.25,.94,.71]) if doc else ([.03,.1,.94,.85] if bid in ('h1','h2','h3') else [.03,.23,.94,.71])
   if bid=='p1':mainbox=[.04,.28,.92,.68] if doc else [.05,.23,.9,.73]
   main=dict(id=bid+'-main',start=start,end=end,bbox=mainbox,label='surface model' if bid in ('h4','c1','p1') else 'bowl of water and pepper',primary=True,kind='model',evidence=dict(background='#8E969D',tolerance=24));objects.append(main)
   # Registered content entities refer to real regions; names/aliases are data,
   # not branches in any common gate. Individual arrows get separate ROIs.
   for name in ('water','bowl','pepper','edge','surface','soap','ring','spot','patch','flow','engine','SDS','gap','arrows','drop'):
    ob=dict(main,id=bid+'-'+name,label=name,primary=False)
    if name=='arrows':
     ob['bbox']=([.08,.18,.52,.09] if doc else [.16,.20,.35,.11]) if bid=='p1' else ([.13,.3,.7,.5] if doc else [.2,.4,.6,.4]);ob['evidence']=dict(palette=['#D1834F'],tolerance=50,min_coverage=.002)
    objects.append(ob)
   for c in [c for c in data['captions'] if c['beat']==bid]:
    source=next(x for x in align if x['beat']==bid and x['text']==c['text']);item=add_text('caption-'+str(c['start']),'caption',c['text'],c['start']/30,c['end']/30,'caption',[source['tts_start'],source['tts_end']]);objects.append(dict(id=item['id']+'-number',start=item['start'],end=item['end'],bbox=item['bbox'],kind='text',label=item['text'],primary=False,evidence=dict(palette=['#FFFFFF'],tolerance=50,min_coverage=.01)))
   candidates=visual_nouns(n)
   for term in candidates:
    word=term['word'];lemma=term['lemma'];matches=[(i,w) for i,w in enumerate(events) if norm(w['text'])==norm(word)]
    if not matches:
     beat['nonvisual_terms'].append(dict(text=word,reason='Narration after60s lies outside this sample.'));continue
    i,w=matches[0];key=lemma.lower();modifiers={'long','short','orange','blue','red','green','white','black','yellow','purple','pink','gray','grey'};j=i
    while j>0 and norm(events[j-1]['text']) in modifiers:j-=1
    begin=events[j]['start']
    aliases={'neighbour':'patch','neighbor':'patch','sketch':'surface','tug':'flow','war':'flow','arrow':'arrows','study':'surface','degree':'water','episode':'soap','metre':'flow','millinewton':'gap','pulling':'flow','pull':'flow','drop':'drop','water':'water','soap':'soap','pepper':'pepper','bowl':'bowl','surface':'surface','ring':'ring','spot':'spot','edge':'edge','gap':'gap','engine':'engine','SDS':'SDS','sds':'SDS','patch':'patch'}
    target=aliases.get(key)
    if term['tag']=='CD':
     cap=next((c for c in texts if c['role']=='caption' and c['start']-.2<=w['start']<c['end']+.2),None)
     if cap:beat['visual_terms'].append(dict(text=word,noun=word,start=w['start'],end=min(60,w['end']),object_ids=[cap['id']+'-number'],attributes={}))
     elif w['start']<60:beat['nonvisual_terms'].append(dict(text=word,reason='Number in spoken connective/quantifier, no displayed measurement.'))
     continue
    if target is None:beat['nonvisual_terms'].append(dict(text=word,reason='Abstract narration/context term, not a separately drawn physical object.'));continue
    beat['visual_terms'].append(dict(text=word,noun=word,start=begin,end=min(60,w['end']),object_ids=[bid+'-'+target],attributes=dict(color='#D1834F',size='long') if bid=='p1' and target=='arrows' else {}))
  for c in data['clips']:
   if not c.get('available') or c['start'] is None:continue
   clip_start=c.get('portrait_start',c['start']) if doc else c['start'];clip_frames=c.get('portrait_frames',c['frames']) if doc else c['frames'];start=clip_start/30;end=(clip_start+clip_frames)/30;add_text('ai-'+c['id'],'gemini',c['label'],start,end,'ai_label')
   meta=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','json',str(R/c['path'])]))['streams'][0]
   layouts=[q for z in dom if start+.15<=z['frame']/30<end for q in z.get('layouts',[]) if q.get('asset')==c['id']];real=next((q for q in layouts if q['name']=='real-video'),None);panel=next((q for q in layouts if q['name']=='simulation-panel'),None)
   display=[real['x']/W,real['y']/HH,real['w']/W,real['h']/HH] if real else [0,0,1,1]
   crop=[0,0,1,1]
   if doc and not panel:
    cw=meta['height']*(W/HH)/meta['width'];crop=[(c.get('focus_x',50)/100)*(1-cw),0,cw,1]
   if panel:
    group='asset-'+c['id'];rx,ry,rw,rh=display
    objects.append(dict(id=group+'-real-primary',label='primary phenomenon in original footage',primary=True,primary_group=group,start=start,end=end,bbox=[rx+.02*rw,ry+.12*rh,.96*rw,.84*rh],evidence=dict(background='#8E969D',tolerance=20)))
    objects.append(dict(id=group+'-simulation-primary',label='same primary phenomenon in simulation',primary=True,primary_group=group,start=start,end=end,bbox=[panel['x']/W+.025,panel['y']/HH+.025,panel['w']/W-.05,panel['h']/HH-.05],evidence=dict(background='#8E969D',tolerance=24)))
   assets.append(dict(id=c['id'],start=start,end=end,kind='ai_video',ai_label=c['label'],source=c['path'],source_dimensions=meta,source_crop=crop,render_bbox=display,reference_texts=[],landscape_reference=str((R/c['path']).resolve()),reference_is_source=True,reference_start=start,reference_in=c['in']))

  run=next(r for r in runtime if r['format']==fmt);plan=dict(schema_version=1,id='K1t3-'+fmt,duration=60,format=fmt,language='en',beats=beats,texts=texts,objects=objects,assets=assets,runtime=run)
  if not doc:landscape_texts=texts.copy()
  (a.out/(fmt+'.json')).write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n')
if __name__=='__main__':main()
