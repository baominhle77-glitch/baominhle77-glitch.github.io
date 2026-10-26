"""Normalize artifact paths by the verified clip names, not runner paths."""
import argparse,json,shutil
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--short-side',type=int,default=540);a=p.parse_args();root=Path.cwd();download=root/'work/beat-download'
for bid in ('h1','h2','h3','h4','c1','p1'):
 out=root/'work/B_cache'/str(a.short_side)/bid;out.mkdir(parents=True,exist_ok=True)
 for fmt in ('16x9','9x16'):
  found=list(download.rglob(f'{fmt}_{bid}.mp4'))
  if len(found)!=1:raise SystemExit(f'EXPECTED_ONE_CLIP {bid}/{fmt}: {len(found)}')
  shutil.copy2(found[0],out/found[0].name)
 folder=next(download.glob('B-beat-'+str(a.short_side)+'-'+bid))
 metrics=list(folder.rglob('metrics.json'))
 if len(metrics)!=1:raise SystemExit('MISSING_METRICS '+bid)
 shutil.copy2(metrics[0],out/'metrics.json')
 print('B_COLLECT '+bid,flush=True)
