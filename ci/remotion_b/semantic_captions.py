"""Meaning units aligned to measured original or explicitly edited word clocks."""
import json,re,math,sys,shutil
from pathlib import Path
H=Path(__file__).resolve().parent;R=H.parents[1]
sys.path.insert(0,str(R))
from gate_chung.captions import nonoverlapping
from narration_source import for_beat
def tokens(text):
 from gate_chung.semantics import spoken_integer
 text=text.replace('0.46m/s','zero point four six metres per second')
 text=text.replace('0.5m/s','half a metre per second')
 text=text.replace('mN/m',' millinewtons per metre ').replace('mM',' millimolar ')
 text=re.sub(r'\d+(?:\.\d+)?',lambda m:spoken_integer(int(m.group().split('.')[0]))+(' point '+' '.join(spoken_integer(int(x)) for x in m.group().split('.')[1]) if '.' in m.group() else ''),text)
 return re.findall(r"[a-z]+(?:'[a-z]+)?",text.lower())
def apply(data,alignment_path):
 phrases=json.loads((H/'caption_phrases.json').read_text());tts=json.loads((R/'out/M1_MARANGONI_DUNG/_build/tts.json').read_text());plan=json.loads((H/'ke_hoach_A.json').read_text());caps=[];alignment=[]
 for b in data['beats']:
  bid=b['id'];source=for_beat(bid);words=source['words'];i=0;offset=source['offset'];name='narration_'+bid+source['audio'].suffix;shutil.copy2(source['audio'],H/'public'/name);b.update(audio=name,audioStart=round(offset*30),narration=source['narration'])
  for phrase in phrases[bid]:
   assert 2<=len(phrase.split())<=5,phrase
   expected=tokens(phrase);j=i;actual=[]
   while len(actual)<len(expected) and j<len(words):actual.extend(tokens(words[j]['w']));j+=1
   chunk=words[i:j]
   assert actual==expected,(bid,phrase,actual,expected)
   cap=dict(text=phrase,start=round((offset+chunk[0]['t0'])*30),end=min(data['frames'],math.ceil((offset+chunk[-1]['t1']+.045)*30)),beat=bid)
   if cap['start']<data['frames']:caps.append(cap)
   alignment.append(dict(beat=bid,text=phrase,word_start=i,word_end=j-1,tts_start=offset+chunk[0]['t0'],tts_end=offset+chunk[-1]['t1']))
   i=j
  assert i==len(words),(bid,i,len(words))
 data['captions']=nonoverlapping(caps);(H/'public/data.json').write_text(json.dumps(data,ensure_ascii=False,indent=2));target=Path(alignment_path);target.parent.mkdir(parents=True,exist_ok=True);target.write_text(json.dumps(alignment,ensure_ascii=False,indent=2));return data
if __name__=='__main__':
 import argparse
 from prepare import source_data
 p=argparse.ArgumentParser();p.add_argument('--alignment-out',type=Path,required=True);a=p.parse_args()
 data=apply(source_data(),a.alignment_out);print('SEMANTIC_CAPTIONS_PASS',len(data['captions']))
