import subprocess,sys,time,json,resource
from pathlib import Path
r=Path(__file__).resolve().parents[2];t=time.perf_counter();a=resource.getrusage(resource.RUSAGE_CHILDREN)
p=subprocess.run([sys.executable,'ci/remotion_b/prepare.py','--beat','h3','--jobs','2'],cwd=r)
b=resource.getrusage(resource.RUSAGE_CHILDREN)
out=dict(beat='h3',formats=2,edit_minutes=None,rebuild_wall_s=time.perf_counter()-t,cpu_s=b.ru_utime+b.ru_stime-a.ru_utime-a.ru_stime,exit_code=p.returncode,method='warm rebuild of unchanged beat h3 only; excludes final Remotion recomposition; not claimed as a measured editorial repair')
(r/'work/B/repair_one_beat.json').write_text(json.dumps(out,indent=2));raise SystemExit(p.returncode)
