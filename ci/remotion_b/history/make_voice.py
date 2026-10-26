"""Offline fictional fixture. Word clocks come from assembled audio, not estimates."""
import json,subprocess,wave,io,hashlib
from pathlib import Path
import numpy as np
R=Path(__file__).resolve().parents[3];out=R/'gate_chung/examples';out.mkdir(exist_ok=True);rate=16000;track=np.zeros(rate*20,dtype=np.int16);words=[];caps=[]
phrases=['Two blue armies advance','The orange route grows','The year becomes1601','The troops advance east','This campaign remains fictional']
# The third phrase uses a normal space before the spoken year.
phrases[2]='The year becomes1601'.replace('becomes1601','becomes1601')
phrases[2]='The year becomes 1601'
for i,phrase in enumerate(phrases):
 start=i*4+.2;events=[]
 for j,word in enumerate(phrase.split()):
  p=subprocess.run(['ffmpeg','-v','error','-f','lavfi','-i','flite=text='+word+':voice=slt','-ar',str(rate),'-ac','1','-f','wav','pipe:1'],capture_output=True,check=True)
  with wave.open(io.BytesIO(p.stdout)) as w:raw=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16)
  length=round(.65*rate);fit=np.interp(np.linspace(0,len(raw)-1,length),np.arange(len(raw)),raw).astype(np.int16);t=start+j*.75;k=round(t*rate);track[k:k+length]=fit;event=dict(text=word,start=round(t,3),end=round(t+.65,3));events.append(event);words.append(event)
 caps.append(dict(text=phrase,start=start,end=events[-1]['end']+.05,tts_span=[start,events[-1]['end']]))
p=out/'history_voice.wav'
with wave.open(str(p),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(rate);w.writeframes(track.tobytes())
(out/'history_voice.json').write_text(json.dumps(dict(source='Flite slt, offline word synthesis; each complete word resampled into its registered0.65s slot,0.1s interword silence; fictional test only',sha256=hashlib.sha256(p.read_bytes()).hexdigest(),duration=20,words=words,captions=caps),indent=2)+'\n')
