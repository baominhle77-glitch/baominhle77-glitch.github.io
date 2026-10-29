"""Apply only authorized L6 edits using original Andrew word-clock spans.

No atempo, time stretching, invented pauses, or new narration. The untouched
beats retain their original MP3 and word events. Full timing follows ffprobe.
"""
import hashlib,json,math,subprocess,wave
from pathlib import Path
import numpy as np

R=Path(__file__).resolve().parents[2];H=Path(__file__).resolve().parent
S=json.loads((R/'out/M1_MARANGONI/storyboard.json').read_text())
T=json.loads((R/'out/M1_MARANGONI_DUNG/_build/tts.json').read_text())
P=json.loads((H/'ke_hoach_A.json').read_text())
O=R/'assets/k1t3/narration_full';RATE=24000
def original(bid):
 q=T['beats'][bid];a=R/'out/_tts_cache'/Path(q['mp3']).name;w=R/'out/_tts_cache'/Path(q['words']).name
 assert hashlib.sha256(a.read_bytes()).hexdigest()==q['mp3_sha256']
 return a,json.loads(w.read_text()),w
def word(bid,term):
 _,ws,_=original(bid);i=next(i for i,w in enumerate(ws) if w['w'].lower().strip('.,;:?!')==term);return bid,i,i
ABOUT=word('r1','about');SIX=('w2',50,50);THIRTY=('h4',30,30);UNIT=('h4',35,37)
EDITS={
 'h4':[('h4',0,14),('h4',18,29),ABOUT,THIRTY,SIX,('h4',35,47)],
 'c1':[('c1',8,30)],
 'p1':[('c1',17,30),('p1',15,18),('p1',23,46)],
 'p3':[('p3',0,27),('p3',33,52)],
 'c2':[('c2',6,35)],
 'v4':[('v4',0,31),('v4',35,42)],
 'c3':[('c3',0,11),('c3',16,16),('c3',30,30),('c3',18,19),('c3',20,38)],
 'w2':[('w2',0,27),ABOUT,THIRTY,SIX,UNIT,('w2',33,54)],
 'b1':[('b1',0,18),word('p3','measured'),word('r2','for'),('p3',27,27),('b1',24,27)],
 'r2':[('r2',0,4),ABOUT,THIRTY,SIX,UNIT,('r2',10,49)],
 'r3':[('r3',0,23),('r3',12,12),('r3',26,50)],
 's8':[('s8',7,20),('s8',23,29),ABOUT,THIRTY,SIX,UNIT,('s8',37,50)],
}
TEXT={
 'h4':'Here is the engine. At twenty five degrees, clean water pulls harder than our soap, SDS at an inferred twenty five millimolar in water: a gap of about thirty six millinewtons per metre, calculated. That gap, not the soap itself, does the pulling.',
 'c1':'Every patch of that surface pulls on its neighbours. Over clean water the pull is strong; over the soapy spot it is weaker.',
 'p1':'Over clean water the pull is strong; over the soapy spot it is weaker. The surface is dragged outward, and the water just below is dragged along. A flow driven by a difference in pull like this is called a Marangoni flow.',
 'p3':'They tested eight surfactants, bought ninety nine per cent pure, with different tails and heads. Their micelle thresholds span two orders of magnitude. One of them is SDS. Another study measured its threshold at twenty five degrees, with no salt added: eight point two three, in millimolar units.',
 'c2':'Under steady pumping, Roché saw three zones: the source at the needle, a clear zone around it where tracers are swept away, and an outer zone with pairs of swirls.',
 'v4':'Where does the water go? It cannot pile up at the edge. Below the clear zone, the paper traces a flow that follows the bottom of the container back towards the source. Surface out and bottom back make one loop.',
 'c3':'Now the open question: why does the flow stop at a ring? Molecules leave the needle. Each one rides the surface outward, but it can also leave the surface and dissolve into the water below.',
 'w2':"How fast should the surface go? Roché's speed law, with its constant set to one, uses the pull gap, viscosity, density and patch size. Take our gap of about thirty six millinewtons per metre, water's viscosity at twenty five degrees, and Roché's own patch estimate of fifteen millimetres: zero point four six metres per second, calculated.",
 'b1':'Time for the card on the bench. Three kinds of numbers appear on it: measured by Roché and colleagues, measured for SDS, and calculated from both.',
 'r2':'Calculated: a pull gap of about thirty six millinewtons per metre, a surface speed of zero point four six metres per second, a moving layer of zero point one seven millimetres, a soap layer a hundred times thinner, and a ring one point six eight times wider for double the pumping.',
 'r3':"Our assumptions. Roché's constants are set to one, as in the paper. The patch size is Roché's estimate, not our measurement. The gap uses the SDS value at an inferred twenty five millimolar, while that estimate assumed a threshold of ten millimolar and a surface tension gap of its own.",
 's8':"Water's capillary length at twenty degrees came to two point seven three, in millimetres. SDS opens a gap in pull of about thirty six millinewtons per metre. That gap drives the surface at zero point four six metres per second, calculated.",
}
def duration(path):
 return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(path)]))
def assemble(bid):
 chunks=[];events=[];spans=[];elapsed=0
 for source,first,last in EDITS[bid]:
  audio,words,_=original(source);ws=words[first:last+1];start=max(0,ws[0]['t0']-.012);end=ws[-1]['t1']+.018
  raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(audio),'-af',f'atrim=start={start}:end={end},asetpts=PTS-STARTPTS','-ar',str(RATE),'-ac','1','-f','s16le','pipe:1']);pcm=np.frombuffer(raw,np.int16).copy();fade=min(96,len(pcm)//4)
  pcm[:fade]=(pcm[:fade]*np.linspace(0,1,fade)).astype(np.int16);pcm[-fade:]=(pcm[-fade:]*np.linspace(1,0,fade)).astype(np.int16)
  events.extend(dict(w=w['w'],t0=elapsed+w['t0']-start,t1=elapsed+w['t1']-start) for w in ws);chunks.append(pcm);elapsed+=len(pcm)/RATE
  spans.append(dict(beat=source,first=first,last=last,start=start,end=end,audio_sha256=hashlib.sha256(audio.read_bytes()).hexdigest()))
 target=O/(bid+'.wav');wp=O/(bid+'.words.json')
 with wave.open(str(target),'wb') as f:f.setnchannels(1);f.setsampwidth(2);f.setframerate(RATE);f.writeframes(np.concatenate(chunks).tobytes())
 wp.write_text(json.dumps(events,ensure_ascii=False,indent=2)+'\n')
 return dict(narration=TEXT[bid],audio_path=str(target.relative_to(R)),words_path=str(wp.relative_to(R)),audio_sha256=hashlib.sha256(target.read_bytes()).hexdigest(),duration=duration(target),voice=T['voice'],tempo=1.0,method='Original Andrew spans at native rate; no atempo or added silence',source_spans=spans)
def main():
 O.mkdir(parents=True,exist_ok=True);overrides={bid:assemble(bid) for bid in EDITS};cursor=0;beats=[]
 for b in S['beats']:
  bid=b['id'];transition=P['beats'][bid]['t_chuyen'];o=overrides.get(bid);a,ws,wp=original(bid)
  if o:a=R/o['audio_path'];wp=R/o['words_path'];d=o['duration'];n=o['narration']
  else:d=duration(a);n=b['n']
  count=math.ceil((transition+d+.5)*30-1e-8);offset=cursor/30+transition
  if o:o['offset']=offset
  beats.append(dict(id=bid,start=cursor,frames=count,audio_path=str(a.relative_to(R)),words_path=str(wp.relative_to(R)),audioStart=round(offset*30),offset=offset,narration=n,duration=d,title=b.get('canh',bid)))
  cursor+=count
 assert cursor/30>=480,(cursor/30,'L6_DURATION')
 (H/'narration_overrides.json').write_text(json.dumps(overrides,ensure_ascii=False,indent=2)+'\n')
 (H/'full_timeline.json').write_text(json.dumps(dict(frames=cursor,fps=30,duration=cursor/30,voice=T['voice'],rate='+0%',beats=beats),ensure_ascii=False,indent=2)+'\n')
 print('FULL_VOICE',cursor,'frames',cursor/30,'seconds',sum(len(b['narration'].split()) for b in beats),'words')
if __name__=='__main__':main()
