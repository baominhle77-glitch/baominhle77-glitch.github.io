"""Immutable TTS, explicit 540p/30fps, beat-local media/cache and timings."""
import argparse,hashlib,json,math,os,resource,shutil,subprocess,sys,time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor,as_completed
from beat_cache import key as beat_key
R=Path(__file__).resolve().parents[2];HERE=Path(__file__).resolve().parent
FIRST=('h1','h2','h3','h4','c1','p1')
SHORT=540
def read(p):return json.loads(Path(p).read_text(encoding='utf-8'))
def write(p,d):Path(p).parent.mkdir(parents=True,exist_ok=True);Path(p).write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf-8')
def run(cmd,env=None,log=None):
 p=subprocess.run(list(map(str,cmd)),cwd=R,env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=1500)
 if log:Path(log).write_bytes(p.stdout)
 if p.returncode:raise RuntimeError(p.stdout.decode('utf-8','replace')[-3500:])
 return p.stdout

def source_data():
 plan=read(HERE/'ke_hoach_A.json');tts=read(R/'out/M1_MARANGONI_DUNG/_build/tts.json')
 assert hashlib.sha256((R/'out/M1_MARANGONI/storyboard.json').read_bytes()).hexdigest()==plan['storyboard_sha256']
 assert plan['tong_khung']==16601
 beats=[];caps=[];public=HERE/'public';public.mkdir(exist_ok=True)
 shutil.copy2(R/'ban_sac/fonts/NotoSans-Regular.ttf',public/'NotoSans-Regular.ttf')
 for bid in FIRST:
  b=plan['beats'][bid];f0=round(b['t0']*30);frames=min(b['so_khung'],1800-f0)
  raw=tts['beats'][bid];mp=R/'out/_tts_cache'/Path(raw['mp3']).name
  assert hashlib.sha256(mp.read_bytes()).hexdigest()==raw['mp3_sha256'];shutil.copy2(mp,public/mp.name)
  words=read(R/'out/_tts_cache'/Path(raw['words']).name);assert len(words)==len(b['n'].split());offset=b['t0']+b['t_chuyen'];i=0
  while i<len(words):
   take=min(3,len(words)-i)
   if len(words)-i-take==1:take+=1
   chunk=words[i:i+take];i+=take;assert 2<=len(chunk)<=5
   caps.append(dict(text=' '.join(x['w'] for x in chunk),start=round((offset+chunk[0]['t0'])*30),end=min(1800,math.ceil((offset+chunk[-1]['t1']+.045)*30)),beat=bid))
  beats.append(dict(id=bid,start=f0,frames=frames,audio=mp.name,audioStart=round(offset*30),narration=b['n']))
 clips=read(HERE/'gemini.json')
 for c in clips:
  path=R/c['path'] if c.get('path') else None;c['available']=bool(path and path.is_file())
  if c['available']:
   c['sha256']=hashlib.sha256(path.read_bytes()).hexdigest();dest='gemini_'+c['id']+'.mp4';shutil.copy2(path,public/dest);c['src']=dest
 data=dict(beats=beats,captions=[x for x in caps if x['start']<1800],clips=clips,sourceFrameCount=16601,fps=30,frames=1800)
 write(public/'data.json',data);return data

def read_probe(p):return json.loads(run(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height,nb_frames,duration,r_frame_rate','-of','json',p]))['streams'][0]
def validate(p,fmt,b):
 m=read_probe(p);want=(round(SHORT*16/9),SHORT) if fmt=='16x9' else (SHORT,round(SHORT*16/9))
 assert (m['width'],m['height'])==want and m['r_frame_rate']=='30/1' and int(m['nb_frames'])==b['frames'],m
 return m

def render_one(item,force=False):
 fmt,b,at=item;bid=b['id'];cache=R/'work/B_cache'/str(SHORT)/bid;digest=beat_key(bid,SHORT)
 folder=cache/'media'/fmt/('at_'+str(at) if at is not None else 'video');folder.mkdir(parents=True,exist_ok=True)
 cached=cache/f'{fmt}_{bid}.mp4';meta_path=cache/f'{fmt}.json';dest=HERE/'public'/cached.name
 if at is None and not force and cached.exists() and meta_path.exists() and read(meta_path).get('source_digest')==digest:
  validate(cached,fmt,b);shutil.copy2(cached,dest);row=read(meta_path);row.update(cache_reused=True,wall_s=0.,cpu_s=0.);print('B_BEAT_CACHE_HIT '+fmt+'/'+bid,flush=True);return row
 env=dict(os.environ,B_FORMAT=fmt,B_BEAT=bid,B_DURATION=str(b['frames']/30),B_SHORT_SIDE=str(SHORT),PYTHONPATH=str(R/'ban_sac'),OPENBLAS_NUM_THREADS='1',OMP_NUM_THREADS='1');env.pop('B_AT',None)
 cached.with_suffix('.layout.json').unlink(missing_ok=True)
 if at is not None:env['B_AT']=str(at)
 resolution=f'{SHORT},{round(SHORT*16/9)}' if fmt=='9x16' else f'{round(SHORT*16/9)},{SHORT}'
 args=[sys.executable,'-m','manim','render','--resolution',resolution,'--fps','30','--disable_caching','--progress_bar','none','-v','ERROR','--media_dir',folder,HERE/'scene.py','BScene']
 if at is not None:args.insert(4,'-s')
 t=time.perf_counter();r0=resource.getrusage(resource.RUSAGE_CHILDREN);print(f'B_BEAT_START {fmt}/{bid} frames={b["frames"]} resolution={resolution} fps=30',flush=True)
 run(args,env,folder/'render.log')
 if at is not None:return dict(format=fmt,beat=bid,at=at,image=str(next((folder/'images').rglob('*.png'))),wall_s=time.perf_counter()-t)
 src=next((folder/'videos').rglob('BScene.mp4'))
 run(['ffmpeg','-nostdin','-y','-v','error','-i',src,'-frames:v',b['frames'],'-an','-c:v','libx264','-threads','2','-crf','18','-pix_fmt','yuv420p',cached]);validate(cached,fmt,b);shutil.copy2(cached,dest)
 r1=resource.getrusage(resource.RUSAGE_CHILDREN);row=dict(format=fmt,beat=bid,frames=b['frames'],wall_s=time.perf_counter()-t,cpu_s=r1.ru_utime+r1.ru_stime-r0.ru_utime-r0.ru_stime,bytes=dest.stat().st_size,source_digest=digest,cache_reused=False)
 write(meta_path,row);print('B_BEAT_END '+json.dumps(row),flush=True);return row

def main():
 global SHORT
 p=argparse.ArgumentParser();p.add_argument('--stills',action='store_true');p.add_argument('--jobs',type=int,default=1);p.add_argument('--beat',choices=FIRST);p.add_argument('--data-only',action='store_true');p.add_argument('--force',action='store_true');p.add_argument('--short-side',type=int,choices=[540,1080],default=540);a=p.parse_args();SHORT=a.short_side
 data=source_data()
 if a.data_only:return
 items=[(fmt,b,t) for b in data['beats'] if not a.beat or b['id']==a.beat for fmt in ('16x9','9x16') for t in ([.15,b['frames']/60,max(.1,b['frames']/30-.15)] if a.stills else [None])]
 t=time.perf_counter();r0=resource.getrusage(resource.RUSAGE_CHILDREN);rows=[];errors=[]
 with ThreadPoolExecutor(max_workers=a.jobs) as pool:
  futures={pool.submit(render_one,item,a.force):item for item in items}
  for future in as_completed(futures):
   try:rows.append(future.result())
   except Exception as exc:
    item=futures[future];errors.append(dict(format=item[0],beat=item[1]['id'],error=str(exc)));print('B_BEAT_FAILED '+json.dumps(errors[-1]),flush=True)
 r1=resource.getrusage(resource.RUSAGE_CHILDREN);report=dict(beat=a.beat,rows=rows,errors=errors,wall_s=time.perf_counter()-t,cpu_s=r1.ru_utime+r1.ru_stime-r0.ru_utime-r0.ru_stime)
 dest=R/'work/B_cache'/str(SHORT)/a.beat/'metrics.json' if a.beat and not a.stills else R/'work'/('B_stills.json' if a.stills else 'B_render.json');write(dest,report)
 if a.stills and not errors:
  from PIL import Image,ImageDraw
  order={(bid,at):i for i,(bid,at) in enumerate((b['id'],x) for b in data['beats'] for x in [.15,b['frames']/60,max(.1,b['frames']/30-.15)])}
  for fmt in ('16x9','9x16'):
   chosen=sorted((r for r in rows if r['format']==fmt),key=lambda r:order[(r['beat'],r['at'])]);cw,ch=(480,294) if fmt=='16x9' else (270,504)
   sheet=Image.new('RGB',(cw*3,ch*6),'#1C232B');d=ImageDraw.Draw(sheet)
   for i,row in enumerate(chosen):
    im=Image.open(row['image']);im.thumbnail((cw,ch-24));x=i%3*cw;y=i//3*ch;sheet.paste(im,(x,y));d.text((x+8,y+ch-21),row['beat']+' '+str(round(row['at'],2))+'s',fill='white')
   sheet.save(R/'work'/f'B_preflight_{fmt}.jpg',quality=94)
 print('B_PREPARE_END '+json.dumps(report),flush=True)
 if errors:raise SystemExit(1)
if __name__=='__main__':main()
