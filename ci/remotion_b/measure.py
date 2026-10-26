"""Measurements and honest A/B comparison; missing evidence stays null/red."""
import json,subprocess,sys,os,re,hashlib,time
from datetime import datetime,timezone
from pathlib import Path
from PIL import Image,ImageDraw
R=Path(__file__).resolve().parents[2];H=Path(__file__).resolve().parent;O=R/'work/B'
def read(p,default=None):return json.loads(p.read_text()) if p.exists() else default

def main():
 O.mkdir(parents=True,exist_ok=True)
 gate=subprocess.run([sys.executable,'tools/do_chuyen_dong_vung.py','--root',str(O)],cwd=R)
 motion=read(O/'chuyen_dong_vung.json',{})
 data=read(H/'public/data.json',{});minres=[];freeze=[]
 for fmt in ('16x9','9x16'):
  movie=O/f'B_60s_{fmt}.mp4'
  if not movie.exists():continue
  meta=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height,nb_frames,duration','-of','json',str(movie)]))['streams'][0]
  minres.append(dict(format=fmt,meta=meta,pass_MIN_RES=min(meta['width'],meta['height'])>=540 and int(meta['nb_frames'])==1800))
  p=subprocess.run(['ffmpeg','-nostdin','-i',str(movie),'-vf','freezedetect=n=0.001:d=2','-an','-f','null','-'],capture_output=True,text=True)
  starts=list(map(float,re.findall(r'freeze_start:\s*([\d.]+)',p.stderr)));ends=list(map(float,re.findall(r'freeze_end:\s*([\d.]+)',p.stderr)))
  spans=[max(0,min(60,ends[i] if i<len(ends) else 60)-s) for i,s in enumerate(starts)]
  freeze.append(dict(format=fmt,total_s=sum(spans),max_s=max(spans,default=0),pass_freeze=p.returncode==0 and sum(spans)<=6 and max(spans,default=0)<=4))
  cw,ch=(480,294) if fmt=='16x9' else (270,504)
  sheet=Image.new('RGB',(cw*4,ch*3),'#1C232B');d=ImageDraw.Draw(sheet)
  for i,t in enumerate([.5,5,9,14,19,22,27,33,39,45,53,59.4]):
   dest=O/f'contact_{fmt}_{i}.png';subprocess.run(['ffmpeg','-nostdin','-y','-v','error','-ss',str(t),'-i',str(movie),'-frames:v','1',str(dest)],check=True)
   im=Image.open(dest);im.thumbnail((cw,ch-24));x=i%4*cw;y=i//4*ch;sheet.paste(im,(x,y));d.text((x+8,y+ch-21),f'{t:.1f}s',fill='white')
  sheet.save(O/f'contact_sheet_{fmt}.jpg',quality=94)
 metrics=read(O/'pipeline_metrics.json',[]);cpu=sum(x['cpu_s'] for x in metrics)
 available=[c['id'] for c in data.get('clips',[]) if c['available'] and c['start'] is not None]
 visual=read(H/'evidence/visual_review.json',{'pass_geometry':False})
 dom={fmt:read(O/f'dom_{fmt}.json',[]) for fmt in ('16x9','9x16')}
 layout_pass=all(dom.values()) and visual.get('pass_geometry',False)
 c13=layout_pass and motion.get('ket_qua')=='DAT'
 # Count mesh/wireframe edges from their actual construction: B uses no mesh
 # object and no parallel-grid primitives. Visual inspection records any
 # exposed edge in all 36 preflight images. Never equate this with image CV.
 grid=dict(visible_exposed_mesh_edges=visual.get('exposed_mesh_edges'),method='manual review of 36 native 540p images + analytic geometry construction',pass_grid=visual.get('exposed_mesh_edges')==0)
 baseline=read(H/'A_baseline.json')
 B=dict(sha=os.environ.get('GITHUB_SHA'),run=os.environ.get('GITHUB_RUN_ID'),codex_minutes=(datetime.now(timezone.utc)-datetime.fromisoformat('2026-10-26T14:17:30+00:00')).total_seconds()/60 if not os.environ.get('CI') else float(os.environ.get('B_CODEX_MINUTES','0')),codex_time_scope='elapsed to first push; excludes CI wait and later review',ci_minutes=None,pipeline_minutes=sum(x['wall_s'] for x in metrics)/60,cpu_seconds=cpu,cpu_seconds_per_video_second=cpu/120 if metrics else None,cpu_denominator='120 output seconds: 60s x 2 formats',stages=metrics,repair_one_beat=read(O/'repair_one_beat.json'),bytes={f.name:f.stat().st_size for f in O.glob('B_60s_*.mp4')},gates=dict(C13={'ket_qua':'DAT' if c13 else 'TRUOT','layout_pass':layout_pass,'geometry_pass':visual.get('pass_geometry',False),'scope':'DOM safe/PiP/caption-source and manual geometry; full C13 cannot pass while motion/rhythm fails.'},C16={'ket_qua':'DAT' if len(available)==3 else 'TRUOT','available_clips':available,'sources':data.get('clips',[]),'reason':'Three original Gemini attachments supplied by GĐ; uncut foreground, blurred self-background in portrait.'},C17=motion,MIN_RES=minres,exposed_grid=grid,freeze=freeze))
 if os.environ.get('GITHUB_RUN_ID'):
  import urllib.request
  req=urllib.request.Request(f'https://api.github.com/repos/{os.environ["GITHUB_REPOSITORY"]}/actions/runs/{os.environ["GITHUB_RUN_ID"]}/jobs',headers={'Authorization':'Bearer '+os.environ['GH_TOKEN'],'Accept':'application/vnd.github+json'})
  try:
   jobs=json.load(urllib.request.urlopen(req))['jobs'];start=min(datetime.fromisoformat(j['started_at'].replace('Z','+00:00')) for j in jobs);B['ci_minutes']=(datetime.now(timezone.utc)-start).total_seconds()/60;B['ci_time_scope']='job started to measurement complete, excludes artifact upload/teardown'
  except Exception as exc:B['ci_time_error']=str(exc)
 projection=dict(output_seconds=960,method='linear 8x paired-60s measured render; setup/authoring not linearly scalable',B_cpu_seconds=cpu*8 if metrics else None,B_pipeline_minutes=B['pipeline_minutes']*8 if metrics else None,B_bytes=sum(B['bytes'].values())*8,A_ci_minutes=baseline['ci_minutes']*8,A_cpu_seconds=None)
 report=dict(A=baseline,B=B,extrapolate_8_minutes_x_2_formats=projection,limitations=['A CPU-seconds, Codex editing time and repair timing were not instrumented; kept null.','B analytic 2.5D model has continuous curves, not a physically based 3D ray-traced surface.','Missing Gemini inputs block C16. No gate threshold was lowered.'])
 for dest in (R/'ci/so_sanh_AB.json',O/'so_sanh_AB.json'):dest.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
 failures=[]
 if not c13:failures.append('C13')
 if len(available)!=3:failures.append('C16_MISSING_GEMINI')
 if gate.returncode:failures.append('C17')
 if not all(x['pass_MIN_RES'] for x in minres) or len(minres)!=2:failures.append('MIN_RES')
 if not grid['pass_grid']:failures.append('EXPOSED_GRID')
 if not all(x['pass_freeze'] for x in freeze) or len(freeze)!=2:failures.append('FREEZE')
 (O/'gate_status.json').write_text(json.dumps(dict(result='TRUOT' if failures else 'DAT',failures=failures),indent=2))
 print('B_GATES '+str(failures),flush=True)
 return bool(failures)
if __name__=='__main__':raise SystemExit(main())
