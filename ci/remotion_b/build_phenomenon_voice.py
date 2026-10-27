"""Re-edit the sample ending using the original Andrew TTS recordings.
Contiguous spoken sentences are retained; four final words use measured source
word boundaries, short silent joins and pitch-preserving tempo. No new voice
service, altered storyboard or invented word clock is required.
"""
import json,subprocess,hashlib,wave
from pathlib import Path
import numpy as np
R=Path(__file__).resolve().parents[2];H=Path(__file__).resolve().parent;O=R/'assets/k1t3/narration_b';O.mkdir(parents=True,exist_ok=True);RATE=24000
tts=json.loads((R/'out/M1_MARANGONI_DUNG/_build/tts.json').read_text());clips={}
for bid in ('c1','p1','h2','h4','w2'):
 entry=tts['beats'][bid];audio=R/'out/_tts_cache'/Path(entry['mp3']).name;assert hashlib.sha256(audio.read_bytes()).hexdigest()==entry['mp3_sha256'];clips[bid]=(audio,json.loads((R/'out/_tts_cache'/Path(entry['words']).name).read_text()))
def clean(w):return w['w'].lower().strip('.,;:!?')
def extract(bid,first,last):
 audio,words=clips[bid];chunk=words[first:last+1];start=max(0,chunk[0]['t0']-.012);end=chunk[-1]['t1']+.018
 raw=subprocess.check_output(['ffmpeg','-nostdin','-v','error','-i',str(audio),'-af',f'atrim=start={start}:end={end},asetpts=PTS-STARTPTS','-ar',str(RATE),'-ac','1','-f','s16le','pipe:1']);samples=np.frombuffer(raw,dtype=np.int16).copy();fade=min(144,len(samples)//4);samples[:fade]=(samples[:fade]*np.linspace(0,1,fade)).astype(np.int16);samples[-fade:]=(samples[-fade:]*np.linspace(1,0,fade)).astype(np.int16)
 return samples,[dict(w=w['w'],t0=w['t0']-start,t1=w['t1']-start) for w in chunk],dict(beat=bid,audio_sha256=hashlib.sha256(audio.read_bytes()).hexdigest(),source_start=start,source_end=end,word_first=first,word_last=last)
def make(bid,parts,duration,offset,narration):
 samples=[];events=[];provenance=[];elapsed=0
 for i,(source,first,last) in enumerate(parts):
  if i:
   gap=.14 if bid=='c1' else .012;samples.append(np.zeros(round(gap*RATE),dtype=np.int16));elapsed+=len(samples[-1])/RATE
  pcm,words,ref=extract(source,first,last);events.extend(dict(w=w['w'],t0=elapsed+w['t0'],t1=elapsed+w['t1']) for w in words);samples.append(pcm);elapsed+=len(pcm)/RATE;provenance.append(ref)
 source=O/(bid+'_assembly.wav')
 with wave.open(str(source),'wb') as f:f.setnchannels(1);f.setsampwidth(2);f.setframerate(RATE);f.writeframes(np.concatenate(samples).tobytes())
 tempo=elapsed/duration;target=O/(bid+'.wav');subprocess.run(['ffmpeg','-nostdin','-v','error','-y','-i',str(source),'-af',f'atempo={tempo},apad,atrim=duration={duration}','-ar',str(RATE),'-ac','1',str(target)],check=True);source.unlink()
 for w in events:w['t0']/=tempo;w['t1']/=tempo
 words_path=O/(bid+'.words.json');words_path.write_text(json.dumps(events,ensure_ascii=False,indent=2)+'\n')
 return dict(narration=narration,audio_path=str(target.relative_to(R)),audio_sha256=hashlib.sha256(target.read_bytes()).hexdigest(),words_path=str(words_path.relative_to(R)),offset=offset,duration=duration,tempo=tempo,source_spans=provenance,voice=tts['voice'],method='Original cached Andrew TTS; measured source spans, short silent joins, pitch-preserving atempo; word clocks transformed by the same tempo')
def main():
 import argparse
 p=argparse.ArgumentParser();p.add_argument('--only',choices=('all','h4'),default='all');a=p.parse_args()
 path=H/'narration_overrides.json';overrides=json.loads(path.read_text()) if path.exists() else {}
 if a.only=='all':
  c1=clips['c1'][1];p1=clips['p1'][1];begin=next(i for i,w in enumerate(c1) if clean(w)=='every');end=next(i for i,w in enumerate(c1) if clean(w)=='weaker');start=next(i for i,w in enumerate(p1) if clean(w)=='a')
  text='Every patch of that surface pulls on its neighbours. Over clean water the pull is strong; over the soapy spot it is weaker. A flow driven by a difference in pull like this is called a Marangoni flow.'
  overrides['c1']=make('c1',[('c1',begin,end),('p1',start,len(p1)-1)],13.90,44.1667,text)
  parts=[]
  for bid,word in (('p1','flow'),('h2','drags'),('h2','water'),('h2','outward')):
   words=clips[bid][1];index=next(i for i,w in enumerate(words) if clean(w)==word);parts.append((bid,index,index))
  overrides['p1']=make('p1',parts,1.55,58.4,'Flow drags water outward.')
 text='Here is the engine. At twenty five degrees, clean water pulls harder than our soap, SDS at an inferred twenty five millimolar in water: a gap of thirty six millinewtons per metre, calculated. That gap, not the soap itself, does the pulling.'
 overrides['h4']=make('h4',[('h4',0,14),('h4',18,30),('w2',50,50),('h4',35,47)],17.784,24.2667,text)
 path.write_text(json.dumps(overrides,ensure_ascii=False,indent=2)+'\n')
 print({k:dict(words=len(json.loads((R/v['words_path']).read_text())),duration=v['duration'],tempo=v['tempo']) for k,v in overrides.items()})
if __name__=='__main__':main()
