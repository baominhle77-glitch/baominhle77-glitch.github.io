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
  intervals=[dict(start_s=s,end_s=min(60,ends[i] if i<len(ends) else 60),duration_s=spans[i]) for i,s in enumerate(starts)]
  freeze.append(dict(format=fmt,total_s=sum(spans),max_s=max(spans,default=0),intervals=intervals,pass_freeze=p.returncode==0 and not intervals,command_ok=p.returncode==0))
  print('FREEZE '+fmt+' '+(json.dumps(intervals) if intervals else 'NONE'),flush=True)
  cw,ch=(480,294) if fmt=='16x9' else (270,504)
  sheet=Image.new('RGB',(cw*4,ch*3),'#1C232B');d=ImageDraw.Draw(sheet)
  for i,t in enumerate([.5,5,9,14,19,22,25,33,39,45,53,59.4]):
   dest=O/f'contact_{fmt}_{i}.png';subprocess.run(['ffmpeg','-nostdin','-y','-v','error','-ss',str(t),'-i',str(movie),'-frames:v','1',str(dest)],check=True)
   im=Image.open(dest);im.thumbnail((cw,ch-24));x=i%4*cw;y=i//4*ch;sheet.paste(im,(x,y));d.text((x+8,y+ch-21),f'{t:.1f}s',fill='white')
  sheet.save(O/f'contact_sheet_{fmt}.jpg',quality=94)
 metrics=read(O/'pipeline_metrics.json',[]);cpu=sum(x['cpu_s'] for x in metrics);cold_cpu=sum(x.get('cold_render_cpu_s',x['cpu_s']) for x in metrics);cold_critical=max((x.get('cold_render_wall_s',x['wall_s']) for x in metrics if x['stage'].startswith('manim/')),default=0)+sum(x['wall_s'] for x in metrics if x['stage']=='remotion')
 common={fmt:read(O/('gate_chung_'+fmt)/'gates.json',{'passed':False}) for fmt in ('16x9','9x16')}
 available=[c['id'] for c in data.get('clips',[]) if c['available'] and c['start'] is not None]
 visual=read(H/'evidence/visual_review.json',{'pass_geometry':False})
 dom={fmt:read(O/f'dom_{fmt}.json',[]) for fmt in ('16x9','9x16')}
 alignment=read(O/'caption_alignment.json',[])
 semantic_pass=bool(alignment) and all(2<=len(c['text'].split())<=5 for c in data.get('captions',[]))
 layout_pass=all(dom.values()) and visual.get('pass_geometry',False) and visual.get('round',0)>=4 and visual.get('c13_errors')==[] and semantic_pass
 c13=layout_pass and motion.get('ket_qua')=='DAT'
 # Count mesh/wireframe edges from their actual construction: B uses no mesh
 # object and no parallel-grid primitives. Visual inspection records any
 # exposed edge in all 36 preflight images. Never equate this with image CV.
 grid=dict(visible_exposed_mesh_edges=visual.get('exposed_mesh_edges'),method='manual review of 36 native 540p images + analytic geometry construction',pass_grid=visual.get('exposed_mesh_edges')==0)
 baseline=read(H/'A_baseline.json')
 h3_stage=next((s for s in metrics if s['stage']=='manim/h3'),{})
 repair=dict(beat='h3',formats=2,edit_minutes=None,rebuild_wall_s=h3_stage.get('cold_render_wall_s'),cpu_s=h3_stage.get('cold_render_cpu_s'),current_run_cache_reused=h3_stage.get('cache_reused'),method='Recorded cold render of the round 4 curved-capillary correction, both native 540p formats; retained per-format measurements survive cache hits. Editing time was not separately instrumented; final Remotion assembly is a separate stage.')
 B=dict(sha=os.environ.get('GITHUB_SHA'),run=os.environ.get('GITHUB_RUN_ID'),codex_minutes=(datetime.now(timezone.utc)-datetime.fromisoformat('2026-10-26T18:12:53+00:00')).total_seconds()/60,codex_time_scope='elapsed round 4 from its first persisted commit 13d8ecc at 2026-10-26T18:12:53Z, including local verification and CI; active editing time was not separately instrumented',active_edit_minutes=None,ci_minutes=None,pipeline_minutes=(max((x['wall_s'] for x in metrics if x['stage'].startswith('manim/')),default=0)+sum(x['wall_s'] for x in metrics if x['stage']=='remotion'))/60,cpu_seconds=cpu,cold_models_plus_current_remotion_cpu_s=cold_cpu,cold_models_plus_current_remotion_minutes=cold_critical/60,cpu_seconds_per_video_second=cpu/120 if metrics else None,cpu_denominator='120 output seconds: 60s x 2 formats',stages=metrics,repair_one_beat=read(O/'repair_one_beat.json',repair),bytes={f.name:f.stat().st_size for f in O.glob('B_60s_*.mp4')},gates=dict(C13={'ket_qua':'DAT' if c13 else 'TRUOT','layout_pass':layout_pass,'geometry_pass':visual.get('pass_geometry',False),'manual_errors':visual.get('c13_errors'),'semantic_captions_pass':semantic_pass,'scope':'Every rendered frame runs DOM safe-margin/overlap/font assertions; manual native geometry review plus semantic TTS alignment. Full C13 cannot pass while motion/rhythm fails.'},C16={'ket_qua':'DAT' if len(available)==3 else 'TRUOT','available_clips':available,'sources':data.get('clips',[]),'reason':'Three original Gemini attachments supplied by GĐ; latest round 4 instruction uses a focal portrait crop covering the whole frame, without letterbox.'},C17=motion,MIN_RES=minres,exposed_grid=grid,freeze=freeze,ffmpeg=read(O/'gate_ffmpeg.json')))
 B['gates']['D18']=common
 if os.environ.get('GITHUB_RUN_ID'):
  import urllib.request
  req=urllib.request.Request(f'https://api.github.com/repos/{os.environ["GITHUB_REPOSITORY"]}/actions/runs/{os.environ["GITHUB_RUN_ID"]}/jobs',headers={'Authorization':'Bearer '+os.environ['GH_TOKEN'],'Accept':'application/vnd.github+json'})
  try:
   jobs=json.load(urllib.request.urlopen(req))['jobs'];start=min(datetime.fromisoformat(j['started_at'].replace('Z','+00:00')) for j in jobs);B['ci_jobs']=[dict(name=j['name'],status=j['status'],conclusion=j.get('conclusion'),started_at=j['started_at'],completed_at=j.get('completed_at'),duration_s=(datetime.fromisoformat(j['completed_at'].replace('Z','+00:00'))-datetime.fromisoformat(j['started_at'].replace('Z','+00:00'))).total_seconds() if j.get('completed_at') else None) for j in jobs];B['ci_minutes']=(datetime.now(timezone.utc)-start).total_seconds()/60;B['ci_time_scope']='job started to measurement complete, excludes artifact upload/teardown'
  except Exception as exc:B['ci_time_error']=str(exc)
 projection=dict(output_seconds=960,method='linear 8x paired-60s measured render; setup/authoring not linearly scalable',B_cpu_seconds=cold_cpu*8 if metrics else None,B_pipeline_minutes=cold_critical/60*8 if metrics else None,B_bytes=sum(B['bytes'].values())*8,A_ci_minutes=baseline['ci_minutes']*8,A_cpu_seconds=None)
 report=dict(A=baseline,B=B,extrapolate_8_minutes_x_2_formats=projection,limitations=['A CPU-seconds, Codex editing time and repair timing were not instrumented; kept null.','B analytic 2.5D model has continuous curves, not a physically based 3D ray-traced surface.','All original Gemini inputs are included. No gate threshold was lowered.'])
 for dest in (R/'ci/so_sanh_AB.json',O/'so_sanh_AB.json'):dest.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
 failures=[]
 for fmt,report_common in common.items():
  if not report_common.get('passed'):failures += [fmt+'/'+g for g,r in report_common.get('gates',{}).items() if not r['passed']] or [fmt+'/D18_MISSING']
 if not c13:failures.append('C13')
 if len(available)!=3:failures.append('C16_MISSING_GEMINI')
 if gate.returncode:failures.append('C17')
 if not all(x['pass_MIN_RES'] for x in minres) or len(minres)!=2:failures.append('MIN_RES')
 if not grid['pass_grid']:failures.append('EXPOSED_GRID')
 if not all(x['pass_freeze'] for x in freeze) or len(freeze)!=2:failures.append('FREEZE')
 (O/'freeze_report.json').write_text(json.dumps(freeze,indent=2))
 (O/'gate_status.json').write_text(json.dumps(dict(result='TRUOT' if failures else 'DAT',failures=failures),indent=2))
 print('B_GATES '+str(failures),flush=True)
 return bool(failures)
if __name__=='__main__':raise SystemExit(main())
