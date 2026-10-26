"""Prepare immutable A narration and text-free Manim beat assets for Remotion."""
import argparse,hashlib,json,math,os,resource,shutil,subprocess,sys,time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
R=Path(__file__).resolve().parents[2]; HERE=Path(__file__).resolve().parent
FIRST=('h1','h2','h3','h4','c1','p1')

def read(p):return json.loads(Path(p).read_text(encoding='utf-8'))
def write(p,d):Path(p).parent.mkdir(parents=True,exist_ok=True);Path(p).write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf-8')
def run(cmd,env=None,log=None):
 p=subprocess.run(list(map(str,cmd)),cwd=R,env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
 if log:Path(log).write_bytes(p.stdout)
 if p.returncode:raise RuntimeError(p.stdout.decode('utf-8','replace')[-3500:])
 return p.stdout

def source_data():
 plan=read(HERE/'ke_hoach_A.json');tts=read(R/'out/M1_MARANGONI_DUNG/_build/tts.json')
 storyboard=R/'out/M1_MARANGONI/storyboard.json'
 assert hashlib.sha256(storyboard.read_bytes()).hexdigest()==plan['storyboard_sha256']
 assert plan['tong_khung']==16601
 beats=[];caps=[]
 public=HERE/'public';public.mkdir(exist_ok=True)
 for bid in FIRST:
  b=plan['beats'][bid];f0=round(b['t0']*30);frames=min(b['so_khung'],1800-f0)
  if frames<=0:continue
  raw=tts['beats'][bid];mp=R/'out/_tts_cache'/Path(raw['mp3']).name
  assert hashlib.sha256(mp.read_bytes()).hexdigest()==raw['mp3_sha256']
  shutil.copy2(mp,public/mp.name)
  words=read(R/'out/_tts_cache'/Path(raw['words']).name)
  assert len(words)==len(b['n'].split())
  offset=b['t0']+b['t_chuyen']
  # Partition into 2–5 words without a singleton tail.
  i=0
  while i<len(words):
   take=min(3,len(words)-i)
   if len(words)-i-take==1:take+=1
   chunk=words[i:i+take];i+=take
   text=' '.join(x['w'] for x in chunk)
   assert 2<=len(chunk)<=5
   caps.append(dict(text=text,start=round((offset+chunk[0]['t0'])*30),end=min(1800,math.ceil((offset+chunk[-1]['t1']+.045)*30)),beat=bid))
  beats.append(dict(id=bid,start=f0,frames=frames,audio=mp.name,audioStart=round(offset*30),narration=b['n']))
 clips=read(HERE/'gemini.json')
 for c in clips:
  path=R/c['path'] if c.get('path') else None
  c['available']=bool(path and path.is_file())
  if c['available']:
   c['sha256']=hashlib.sha256(path.read_bytes()).hexdigest();dest='gemini_'+c['id']+'.mp4';shutil.copy2(path,public/dest);c['src']=dest
 data=dict(beats=beats,captions=[x for x in caps if x['start']<1800],clips=clips,sourceFrameCount=16601,fps=30,frames=1800)
 write(public/'data.json',data)
 return data

def render_one(item):
 fmt,b,at=item
 folder=R/'work/B_manim'/fmt/b['id']/('at_'+str(at) if at is not None else 'video')
 folder.mkdir(parents=True,exist_ok=True)
 env=dict(os.environ,B_FORMAT=fmt,B_BEAT=b['id'],B_DURATION=str(b['frames']/30),PYTHONPATH=str(R/'ban_sac'),OPENBLAS_NUM_THREADS='1',OMP_NUM_THREADS='1')
 env.pop('B_AT',None)
 if at is not None:env['B_AT']=str(at)
 args=[sys.executable,'-m','manim','render','--disable_caching','--progress_bar','none','-v','ERROR','--media_dir',folder,HERE/'scene.py','BScene']
 if at is not None:args.insert(4,'-s')
 begin=time.perf_counter();run(args,env,folder/'render.log');elapsed=time.perf_counter()-begin
 if at is not None:return dict(format=fmt,beat=b['id'],at=at,image=str(next((folder/'images').rglob('*.png'))),wall_s=elapsed)
 src=next((folder/'videos').rglob('BScene.mp4'));dest=HERE/'public'/f'{fmt}_{b["id"]}.mp4'
 run(['ffmpeg','-nostdin','-y','-v','error','-i',src,'-frames:v',b['frames'],'-an','-c:v','libx264','-crf','18','-pix_fmt','yuv420p',dest])
 meta=read_probe(dest);assert int(meta['nb_frames'])==b['frames'],meta
 return dict(format=fmt,beat=b['id'],frames=b['frames'],wall_s=elapsed,bytes=dest.stat().st_size)

def read_probe(p):return json.loads(run(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height,nb_frames,duration','-of','json',p]))['streams'][0]

def main():
 p=argparse.ArgumentParser();p.add_argument('--stills',action='store_true');p.add_argument('--jobs',type=int,default=2);p.add_argument('--beat');a=p.parse_args()
 data=source_data();items=[]
 for fmt in ('16x9','9x16'):
  for b in data['beats']:
   if a.beat and b['id']!=a.beat:continue
   times=[.15,b['frames']/60,max(.1,b['frames']/30-.15)] if a.stills else [None]
   items.extend((fmt,b,t) for t in times)
 started=time.perf_counter();r0=resource.getrusage(resource.RUSAGE_CHILDREN)
 with ThreadPoolExecutor(max_workers=a.jobs) as pool:rows=list(pool.map(render_one,items))
 r1=resource.getrusage(resource.RUSAGE_CHILDREN)
 report=dict(rows=rows,wall_s=time.perf_counter()-started,cpu_s=r1.ru_utime+r1.ru_stime-r0.ru_utime-r0.ru_stime)
 write(R/'work'/('B_stills.json' if a.stills else 'B_render.json'),report)
 if a.stills:
  from PIL import Image,ImageDraw
  for fmt in ('16x9','9x16'):
   chosen=[r for r in rows if r['format']==fmt];cw,ch=(480,294) if fmt=='16x9' else (270,504)
   sheet=Image.new('RGB',(cw*3,ch*6),'#1C232B');d=ImageDraw.Draw(sheet)
   for i,row in enumerate(chosen):
    im=Image.open(row['image']);im.thumbnail((cw,ch-24));x=(i%3)*cw;y=(i//3)*ch;sheet.paste(im,(x,y));d.text((x+8,y+ch-21),row['beat']+' '+str(round(row['at'],2))+'s',fill='white')
   sheet.save(R/'work'/f'B_preflight_{fmt}.jpg',quality=94)
 print(json.dumps(report),flush=True)
if __name__=='__main__':main()
