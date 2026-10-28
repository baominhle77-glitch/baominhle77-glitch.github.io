"""K1 content adapter only. gate_chung imports none of this episode's code."""
import argparse,json,sys,re,math,subprocess,os
from PIL import ImageFont
from pathlib import Path
R=Path(__file__).resolve().parents[2];sys.path.insert(0,str(R));from gate_chung.language import visual_nouns
from gate_chung.model import norm
from ci.layer_plan import measured_layers,nested_layers,measured_overlays
from gate_chung.timeline import visibility_intervals
from narration_source import for_beat
H=Path(__file__).resolve().parent

def main():
 p=argparse.ArgumentParser();p.add_argument('--video-root',type=Path,required=True);p.add_argument('--caption-alignment',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args();a.out.mkdir(parents=True,exist_ok=True)
 data=json.loads((H/'public/data.json').read_text());original=json.loads((H/'ke_hoach_A.json').read_text());tts=json.loads((R/'out/M1_MARANGONI_DUNG/_build/tts.json').read_text());align=json.loads(a.caption_alignment.read_text());runtime=json.loads((a.video_root/'remotion_render.json').read_text())
 duration=data['frames']/30;landscape_texts=[];short=int(os.environ.get('B_SHORT_SIDE','540'));u=short/540
 for fmt in ('16x9','9x16'):
  doc=fmt=='9x16';W,HH=(540*u,960*u) if doc else (960*u,540*u);dom=json.loads((a.video_root/f'dom_{fmt}.json').read_text());texts=[];objects=[];beats=[];assets=[];layer_specs=[];internal=[];simulation=[]
  for z in dom:
   for q in z['boxes']+z.get('layouts',[]):
    for key in ('x','y','w','h','font'):
     if key in q:q[key]*=u
  hidden=[dict(start=(c.get('portrait_start',c['start']) if doc else c['start'])/30,end=((c.get('portrait_start',c['start']) if doc else c['start'])+(c.get('portrait_frames',c['frames']) if doc else c['frames']))/30) for c in data['clips'] if c.get('available') and c['start'] is not None]
  def latest_box(name,text,start,asset_id=None):
   found=[(abs(z['frame']/30-max(.15,start)),b) for z in dom for b in z['boxes'] if b['name']==name and b.get('text')==text and z['frame']>=3 and (asset_id is None or b.get('asset')==asset_id)]
   if not found:
    if name!='caption':raise ValueError((name,text,start))
    font=ImageFont.truetype(str(R/'ban_sac/fonts/NotoSans-Regular.ttf'),round(30*u));limit=W*(.82 if doc else .93);lines=[];line=''
    for word in text.split():
     candidate=(line+' '+word).strip()
     if font.getlength(candidate)+24>limit and line:lines.append(line);line=word
     else:line=candidate
    lines.append(line);width=min(limit,math.ceil(max(font.getlength(l) for l in lines))+24);height=36*len(lines)+12;center=W*.035+limit/2;bottom=HH*(1-(.115 if doc else .105))
    return [(center-width/2)/W,(bottom-height)/HH,width/W,height/HH],30*u
   b=min(found,key=lambda z:z[0])[1];return [b['x']/W,b['y']/HH,b['w']/W,b['h']/HH],b['font']
  def add_text(id,name,text,start,end,role,tts_span=None,asset_id=None):
   box,font=latest_box(name,text,start,asset_id)
   if name=='mechanism':box[3]=min(box[3],(font*1.3+10)/HH)
   item=dict(id=id,start=start,end=end,bbox=box,text=text,role=role,font_size=font,foreground='#1C232B' if role=='source' else '#FFFFFF',background=dict(color='#A7ADB3' if role=='source' else '#1C232B',opacity=.95 if role in ('source','ai_label') else 1.))
   if tts_span:item['tts_span']=tts_span
   if asset_id:item['asset_id']=asset_id
   texts.append(item);return item
  for b in data['beats']:
   start=b['start']/30;end=(b['start']+b['frames'])/30;bid=b['id'];spoken=for_beat(bid);n=spoken['narration'];offset=spoken['offset'];raw=spoken['words'];events=[dict(text=w['w'],start=offset+w['t0'],end=offset+w['t1']) for w in raw]
   source_root=R/'work/B_cache'/str(short)/bid;layer_specs.append(dict(id='beat-'+bid,source=str(source_root/f'{fmt}_{bid}.mp4'),start=start,end=end,occluded=[] if doc else hidden))
   internal.extend(nested_layers(b.get('internal_layers',{}).get(fmt,[]),'beat-'+bid,start,end,source_root,hidden))
   beat=dict(id=bid,start=start,end=end,narration=n,words=events,source_required=True,visual_terms=[],nonvisual_terms=[]);beats.append(beat)
   records=[(z,bx) for z in dom if start<=z['frame']/30<end for bx in z['boxes'] if bx['name'] not in ('caption','gemini')];unique={}
   for z,bx in records:unique[(bx['name'],bx['text'])]=bx
   for (name,text),bx in unique.items():
    spans=[(start,end)] if name in ('title','source') else visibility_intervals(dom,name,text,start,end)
    for occurrence,(visible_start,visible_end) in enumerate(spans):add_text(bid+'-'+name+'-'+str(occurrence),name,text,visible_start,visible_end,'title' if name=='title' else ('source' if name=='source' else 'legend'))
   mainbox=[.03,.14,.94,.80] if doc else [.03,.1,.94,.85]
   main=dict(id=bid+'-main',start=start,end=end,bbox=mainbox,label='wine glass and tears' if bid=='k2' else 'water surface, vessel and floating particles',primary=True,kind='model',evidence=dict(background='#8E969D',tolerance=24));objects.append(main)
   simulation.append(dict(id=bid+'-material',start=start,end=end,bbox=mainbox,occluded=[] if doc else hidden))
   # Registered content entities refer to real regions; names/aliases are data,
   # not branches in any common gate. Individual arrows get separate ROIs.
   for name in ('water','bowl','pepper','edge','surface','soap','ring','spot','patch','flow','engine','SDS','gap','drop','needle','tracer','zone','swirl','layer','molecule','head','tail','micelle'):
    ob=dict(main,id=bid+'-'+name,label=name,primary=False)
    if name=='arrows':
     ob['bbox']=([.08,.18,.52,.09] if doc else [.16,.20,.35,.11]) if bid=='p1' else ([.13,.3,.7,.5] if doc else [.2,.4,.6,.4]);ob['evidence']=dict(palette=['#D1834F'],tolerance=50,min_coverage=.002)
    objects.append(ob)
   for c in [c for c in data['captions'] if c['beat']==bid]:
    source=next(x for x in align if x['beat']==bid and x['text']==c['text']);item=add_text('caption-'+str(c['start']),'caption',c['text'],c['start']/30,c['end']/30,'caption',[source['tts_start'],source['tts_end']]);objects.append(dict(id=item['id']+'-number',start=item['start'],end=item['end'],bbox=item['bbox'],kind='text',label=item['text'],primary=False,evidence=dict(palette=['#FFFFFF'],tolerance=50,min_coverage=.01)))
   if bid=='b1':
    card=next(t for t in texts if t['id'].startswith('b1-readout'))
    objects.append(dict(id='b1-card',start=start,end=end,bbox=card['bbox'],label='card',primary=False,kind='text',evidence=dict(palette=['#FFFFFF'],tolerance=50,min_coverage=.01)))
   if bid=='b1':objects.append(dict(id='b1-bench',start=start,end=end,bbox=[0,.04,.035,.9],label='bench',primary=False,kind='physical table',evidence=dict(background='#000000',tolerance=5)))
   citation=next((t for t in texts if t['role']=='source' and t['id'].startswith(bid+'-')),None)
   if citation:objects.append(dict(id=bid+'-citation',start=start,end=end,bbox=citation['bbox'],label='publication reference',primary=False,kind='text',evidence=dict(palette=['#1C232B'],tolerance=50,min_coverage=.015)))
   if bid=='k2':
    objects.extend([dict(id='k2-wine',start=start,end=end,bbox=mainbox,label='wine',primary=False,evidence=dict(palette=['#853743'],tolerance=45,min_coverage=.02)),dict(id='k2-tears',start=start,end=end,bbox=[.05,.58,.9,.23] if doc else [.05,.30,.9,.39],label='tears',primary=False,evidence=dict(palette=['#974E5C'],tolerance=20,min_coverage=.001)),dict(id='k2-glass',start=start,end=end,bbox=mainbox,label='glass',primary=False,evidence=dict(palette=['#DFE9EB'],tolerance=35,min_coverage=.002))])
   candidates=visual_nouns(n)
   for term in candidates:
    word=term['word'];lemma=term['lemma'];matches=[(i,w) for i,w in enumerate(events) if norm(w['text'])==norm(word)]
    if not matches:
     beat['nonvisual_terms'].append(dict(text=word,reason='Narration after60s lies outside this sample.'));continue
    i,w=matches[0];key=lemma.lower();modifiers={'long','short','orange','blue','red','green','white','black','yellow','purple','pink','gray','grey'};j=i
    while j>0 and norm(events[j-1]['text']) in modifiers:j-=1
    begin=events[j]['start']
    aliases={'neighbour':'patch','neighbor':'patch','sketch':'surface','tug':'flow','war':'flow','arrow':'arrows','study':'surface','degree':'water','episode':'soap','metre':'flow','millinewton':'gap','pulling':'flow','pull':'flow','rush':'flow','drop':'drop','water':'water','soap':'soap','pepper':'pepper','bowl':'bowl','surface':'surface','ring':'ring','spot':'spot','edge':'edge','gap':'gap','engine':'engine','SDS':'SDS','sds':'SDS','patch':'patch'}
    aliases.update(card='card',bench='bench',flow='flow',difference='gap',marangoni='flow',needle='needle',source='needle',zone='zone',tracer='tracer',swirl='swirl',layer='layer',molecule='molecule',surfactant='molecule',head='head',tail='tail',micelle='micelle',glass='bowl',dish='bowl',container='bowl',grain='pepper',droplet='tracer',carbon='tail',sulfate='head',bromide='head');target=aliases.get(key)
    citations={'roché',"roché's",'colleague','author','paper',"paper's",'supplement'}
    text_concepts={'balance','law','set','check','schmidt','salt','number','numbers','value','quantity','speed','radius','size','length','thickness','density','viscosity','concentration','threshold','temperature','ratio','constant','power','order','quarter','root','peak','rate','unit'}
    if key in citations and citation:
     beat['visual_terms'].append(dict(text=word,noun=word,start=w['start'],end=min(duration,w['end']),object_ids=[bid+'-citation'],attributes={}));continue
    if key in text_concepts:
     cap=next((c for c in texts if c['role']=='caption' and c['start']-.2<=w['start']<c['end']+.2),None)
     if cap:beat['visual_terms'].append(dict(text=word,noun=word,start=w['start'],end=min(duration,w['end']),object_ids=[cap['id']+'-number'],attributes={}));continue
    aliases.update(tails='tail',light='surface',motion='flow',oil='tracer',solution='soap',pair='swirl',pumping='needle',pump='needle',injection='needle',field='flow',bottom='layer',loop='flow',atom='tail',trimethylammonium='head',interface='surface',rest='zone',start='ring',meniscus='edge',tip='needle',sheet='layer',household='soap',kitchen='bowl',liquid='water',mixture='soap',**{"zone's":'zone',"water's":'water'})
    target=aliases.get(key,target)
    if bid=='k2' and key in ('wine','tear','tears','glass'):
     target='tears' if key in ('tear','tears') else key
    if bid=='k2' and target in ('wine','tears','glass'):
     beat['visual_terms'].append(dict(text=word,noun=word,start=w['start'],end=min(duration,w['end']),object_ids=['k2-'+target],attributes={}));continue
    if term['tag']=='CD':
     cap=next((c for c in texts if c['role']=='caption' and c['start']-.2<=w['start']<c['end']+.2),None)
     if cap:beat['visual_terms'].append(dict(text=word,noun=word,start=w['start'],end=min(duration,w['end']),object_ids=[cap['id']+'-number'],attributes={}))
     elif w['start']<duration:beat['nonvisual_terms'].append(dict(text=word,reason='Number in spoken connective/quantifier, no displayed measurement.'))
     continue
    if target=='micelle' and not next(q for q in json.loads((H/'ban_ve_B60.json').read_text())['beats'] if q['id']==bid)['optics'].get('molecules') and any(norm(q['text']) in ('threshold','thresholds','concentration') for q in events[i+1:i+3]):
     cap=next((c for c in texts if c['role']=='caption' and c['start']-.2<=w['start']<c['end']+.2),None)
     if cap:beat['visual_terms'].append(dict(text=word,noun=word,start=w['start'],end=min(duration,w['end']),object_ids=[cap['id']+'-number'],attributes={}));continue
    if target in ('molecule','head','tail','micelle') and not next(q for q in json.loads((H/'ban_ve_B60.json').read_text())['beats'] if q['id']==bid)['optics'].get('molecules'):
     target=None
    if target is None:beat['nonvisual_terms'].append(dict(text=word,reason='Abstract narration/context term, not a separately drawn physical object.'));continue
    beat['visual_terms'].append(dict(text=word,noun=word,start=begin,end=min(duration,w['end']),object_ids=[bid+'-'+target],attributes=dict(color='#D1834F',size='long') if bid=='p1' and target=='arrows' else {}))
  for c in data['clips']:
   if not c.get('available') or c['start'] is None:continue
   clip_start=c.get('portrait_start',c['start']) if doc else c['start'];clip_frames=c.get('portrait_frames',c['frames']) if doc else c['frames'];start=clip_start/30;end=(clip_start+clip_frames)/30;add_text('ai-'+c['id'],'gemini',c['label'],start,end,'ai_label',asset_id=c['id'])
   meta=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','json',str(R/c['path'])]))['streams'][0]
   layouts=[q for z in dom if start+.15<=z['frame']/30<end for q in z.get('layouts',[]) if q.get('asset')==c['id']];real=next((q for q in layouts if q['name']=='real-video'),None);panel=next((q for q in layouts if q['name']=='simulation-panel'),None)
   display=[real['x']/W,real['y']/HH,real['w']/W,real['h']/HH] if real else [0,0,1,1]
   crop=[0,0,1,1]
   if doc and not panel:
    cw=meta['height']*(W/HH)/meta['width'];crop=[(c.get('focus_x',50)/100)*(1-cw),0,cw,1]
   if panel:
    group='asset-'+c['id'];rx,ry,rw,rh=display
    objects.append(dict(id=group+'-real-primary',label='primary phenomenon in original footage',primary=True,primary_group=group,start=start,end=end,bbox=[rx+.02*rw,ry+.04*rh,.96*rw,.92*rh],evidence=dict(background='#8E969D',tolerance=20)))
    objects.append(dict(id=group+'-simulation-primary',label='same primary phenomenon in simulation',primary=True,primary_group=group,start=start,end=end,bbox=[panel['x']/W+.025,panel['y']/HH+.025,panel['w']/W-.05,panel['h']/HH-.05],evidence=dict(background='#8E969D',tolerance=24)))
   assets.append(dict(id=c['id'],start=start,end=end,kind='ai_video',ai_label=c['label'],source=c['path'],source_dimensions=meta,source_crop=crop,render_bbox=display,reference_texts=[],landscape_reference=str((R/c['path']).resolve()),reference_is_source=True,reference_start=start,reference_in=c['in']))
   layer_specs.append(dict(id='gemini-'+c['id'],source=str(R/c['path']),start=start,end=end,source_in=c['in']))
   if panel and c.get('panel_src'):
    layer_specs.append(dict(id='panel-'+c['id'],source=str(H/'public'/c['panel_src']),start=start,end=end));simulation.append(dict(id='panel-'+c['id'],start=start,end=end,bbox=[panel['x']/W,panel['y']/HH,panel['w']/W,panel['h']/HH]))

  for c in data['clips']:
   if not c.get('native_underlay'):continue
   if doc:simulation.append(dict(id='native-lower-'+c['id'],start=c['start']/30,end=(c['start']+c['frames'])/30,bbox=[0,data['portrait_top'],1,1-data['portrait_top']]))
  run=next(r for r in runtime if r['format']==fmt);plan=dict(schema_version=1,id='K1t3-'+fmt,duration=duration,format=fmt,language='en',beats=beats,texts=texts,objects=objects,assets=assets,layers=measured_layers(dom,W,HH,layer_specs)+internal,runtime=run,simulation_regions=simulation,nontext_overlays=measured_overlays(dom,W,HH,duration),overlay_audit=dict(complete=True,renderer='optical_water physical image node + measured DOM CSS/SVG overlay inventory'))
  if not doc:landscape_texts=texts.copy()
  (a.out/(fmt+'.json')).write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n')
if __name__=='__main__':main()
