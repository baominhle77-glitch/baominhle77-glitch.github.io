import json,sys
from pathlib import Path
R=Path(__file__).resolve().parents[3];sys.path.insert(0,str(R));from gate_chung.language import visual_nouns
H=R/'work/D18_history';voice=json.loads((R/'gate_chung/examples/history_voice.json').read_text());metrics=json.loads((H/'remotion_render.json').read_text())
for fmt in ('16x9','9x16'):
 W,HH=(960,540) if fmt=='16x9' else (540,960);doc=fmt=='9x16';dom=json.loads((H/f'dom_{fmt}.json').read_text());texts=[]
 def text(id,name,content,start,end,role,clock=None):
  choices=[b for z in dom if z['frame']>=3 for b in z['boxes'] if b['name']==name and b['text']==content]
  if not choices:raise ValueError((name,content))
  q=choices[0];d=dict(id=id,start=start,end=end,bbox=[q['x']/W,q['y']/HH,q['w']/W,q['h']/HH],text=content,role=role,font_size=q['font'],foreground='#1C232B' if role=='source' else '#FFFFFF',background=dict(color='#A7ADB3' if role=='source' else '#1C232B',opacity=1.))
  if clock:d['tts_span']=clock
  texts.append(d);return d
 text('title','title','Fictional campaign',0,20,'title');text('source','source','Fictional scenario · Flite TTS · test fixture',0,20,'source')
 compass=text('compass','compass','North · East',0,20,'visual_state')
 years=[]
 for i,(start,end,year) in enumerate(((0,8,1600),(8,12,1601),(12,16,1602),(16,20,1603))):years.append(text('year'+str(year),'year',str(year),start,end,'visual_state'))
 for i,c in enumerate(voice['captions']):text('caption'+str(i),'caption',c['text'],c['start'],c['end'],'caption',c['tts_span'])
 box=[.04,.20,.92,.71] if doc else [.04,.1,.92,.82];objects=[dict(id='map',label='fictional map',start=0,end=20,bbox=box,primary=True,evidence=dict(background='#8E969D'))]
 for name,palette in (('armies',['#3F6A9E']),('route',['#D1834F']),('troops',['#3F6A9E','#D1834F'])):objects.append(dict(id=name,label=name,start=0,end=20,bbox=box,primary=False,evidence=dict(palette=palette,tolerance=50,min_coverage=.002)))
 objects.append(dict(id='compass',label='north/east compass',start=0,end=20,bbox=compass['bbox'],kind='text',primary=False,evidence=dict(palette=['#FFFFFF'],tolerance=50,min_coverage=.01)))
 for y in years:objects.append(dict(id=y['id'],label=y['text'],start=y['start'],end=y['end'],bbox=y['bbox'],kind='text',primary=False,evidence=dict(palette=['#FFFFFF'],tolerance=50,min_coverage=.01)))
 narration=' '.join(c['text']+'.' for c in voice['captions']);terms=[]
 for c in visual_nouns(narration):
  match=next((w for w in voice['words'] if w['text'].lower()==c['word'].lower()),None)
  if not match:continue
  name=c['lemma'];target={'army':'armies','armies':'armies','route':'route','troop':'troops','troops':'troops','1601':'year1601','year':'year1601','east':'compass','north':'compass'}.get(name)
  if target:terms.append(dict(text=c['word'],noun=c['word'],start=match['start'],end=match['end'],object_ids=[target]))
 beat=dict(id='fictional-campaign',start=0,end=20,narration=narration,words=voice['words'],visual_terms=terms,source_required=True)
 plan=dict(schema_version=1,id='history20-'+fmt,format=fmt,duration=20,language='en',beats=[beat],texts=texts,objects=objects,assets=[],runtime=next(m for m in metrics if m['format']==fmt));(H/('plan_'+fmt+'.json')).write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n')
