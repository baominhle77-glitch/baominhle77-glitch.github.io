"""Meaning units aligned to measured original or explicitly edited word clocks."""
import json,re,math,sys,shutil
from pathlib import Path
H=Path(__file__).resolve().parent;R=H.parents[1]
sys.path.insert(0,str(R))
from gate_chung.captions import nonoverlapping
from narration_source import for_beat
def tokens(text):
 text=text.lower().replace('35.54','thirty five point five four').replace('25mm','twenty five millimolar').replace('0.5m/s','half a metre per second')
 return re.findall(r"[a-z]+(?:'[a-z]+)?",text)
def apply(data):
 phrases=json.loads((H/'caption_phrases.json').read_text());tts=json.loads((R/'out/M1_MARANGONI_DUNG/_build/tts.json').read_text());plan=json.loads((H/'ke_hoach_A.json').read_text());caps=[];alignment=[]
 for b in data['beats']:
  bid=b['id'];source=for_beat(bid);words=source['words'];i=0;offset=source['offset'];name='narration_'+bid+source['audio'].suffix;shutil.copy2(source['audio'],H/'public'/name);b.update(audio=name,audioStart=round(offset*30),narration=source['narration'])
  for phrase in phrases[bid]:
   assert 2<=len(phrase.split())<=5,phrase
   expected=tokens(phrase);chunk=words[i:i+len(expected)];actual=[q for w in chunk for q in tokens(w['w'])]
   assert actual==expected,(bid,phrase,actual,expected)
   cap=dict(text=phrase,start=round((offset+chunk[0]['t0'])*30),end=min(1800,math.ceil((offset+chunk[-1]['t1']+.045)*30)),beat=bid)
   if cap['start']<1800:caps.append(cap)
   alignment.append(dict(beat=bid,text=phrase,word_start=i,word_end=i+len(expected)-1,tts_start=offset+chunk[0]['t0'],tts_end=offset+chunk[-1]['t1']))
   i+=len(expected)
  assert i==len(words),(bid,i,len(words))
 data['captions']=nonoverlapping(caps);(H/'public/data.json').write_text(json.dumps(data,ensure_ascii=False,indent=2));out=R/'work/B';out.mkdir(parents=True,exist_ok=True);(out/'caption_alignment.json').write_text(json.dumps(alignment,ensure_ascii=False,indent=2));return data
if __name__=='__main__':
 from prepare import source_data
 data=apply(source_data());print('SEMANTIC_CAPTIONS_PASS',len(data['captions']))
