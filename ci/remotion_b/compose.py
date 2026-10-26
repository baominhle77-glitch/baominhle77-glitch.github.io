"""Collect cached beat artifacts, compose only, persist metrics before gates."""
import json,os,resource,shutil,subprocess,sys,time
from pathlib import Path
from prepare import source_data,read_probe
R=Path(__file__).resolve().parents[2];SHORT=int(os.environ.get('B_SHORT_SIDE','540'));O=R/('work/B' if SHORT==540 else 'work/B1080');O.mkdir(parents=True,exist_ok=True)
data=source_data();stages=[];missing=[]
for b in data['beats']:
 bid=b['id'];folder=R/'work/B_cache'/str(SHORT)/bid
 metric=folder/'metrics.json'
 if metric.exists():
  m=json.loads(metric.read_text());stages.append(dict(stage='manim/'+bid,wall_s=m['wall_s'],cpu_s=m['cpu_s'],cache_reused=all(x.get('cache_reused') for x in m['rows'])))
 for fmt in ('16x9','9x16'):
  src=folder/f'{fmt}_{bid}.mp4'
  if not src.is_file():missing.append(str(src));continue
  p=read_probe(src);expected=(round(SHORT*16/9),SHORT) if fmt=='16x9' else (SHORT,round(SHORT*16/9))
  assert (p['width'],p['height'])==expected and int(p['nb_frames'])==b['frames'],p
  shutil.copy2(src,Path(__file__).resolve().parent/'public'/src.name)
if missing:raise SystemExit('B_MISSING_BEAT_ASSETS '+json.dumps(missing))
t=time.perf_counter();before=resource.getrusage(resource.RUSAGE_CHILDREN)
p=subprocess.run(['node','ci/remotion_b/render.mjs'],cwd=R)
after=resource.getrusage(resource.RUSAGE_CHILDREN)
stages.append(dict(stage='remotion',wall_s=time.perf_counter()-t,cpu_s=after.ru_utime+after.ru_stime-before.ru_utime-before.ru_stime,exit_code=p.returncode))
(O/'pipeline_metrics.json').write_text(json.dumps(stages,indent=2))
if p.returncode:raise SystemExit(p.returncode)
verification=[]
for fmt in ('16x9','9x16'):
 f=O/f'B_60s_{fmt}.mp4';m=read_probe(f);assert int(m['nb_frames'])==1800 and abs(float(m['duration'])-60)<.04,m
 verification.append(dict(file=f.name,bytes=f.stat().st_size,ffprobe=m))
(O/'video_verification.json').write_text(json.dumps(verification,indent=2));print('B_VIDEO_VERIFIED '+json.dumps(verification),flush=True)
