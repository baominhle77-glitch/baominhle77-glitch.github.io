"""Measured B pipeline. Separate beat assets allow local repair and rebuild."""
import json,os,resource,subprocess,sys,time
from pathlib import Path
R=Path(__file__).resolve().parents[2];OUT=R/'work/B';OUT.mkdir(parents=True,exist_ok=True)
rows=[]
for name,cmd in [('manim',[sys.executable,'ci/remotion_b/prepare.py','--jobs','2']),('remotion',['node','ci/remotion_b/render.mjs'])]:
 t=time.perf_counter();before=resource.getrusage(resource.RUSAGE_CHILDREN)
 p=subprocess.run(cmd,cwd=R)
 after=resource.getrusage(resource.RUSAGE_CHILDREN)
 rows.append(dict(stage=name,wall_s=time.perf_counter()-t,cpu_s=after.ru_utime+after.ru_stime-before.ru_utime-before.ru_stime,exit_code=p.returncode))
 (OUT/'pipeline_metrics.json').write_text(json.dumps(rows,indent=2))
 if p.returncode:raise SystemExit(p.returncode)
