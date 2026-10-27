import shutil,os
from pathlib import Path
R=Path.cwd()
for bid in ('h1','h2','h3'):
 root=R/'work/panel-download';found=list(root.rglob(f'panel_9x16_{bid}.mp4'))
 if len(found)!=1:raise SystemExit('Expected exactly one panel '+bid)
 out=R/'work/B_panels'/os.environ.get('B_SHORT_SIDE','540')/bid;out.mkdir(parents=True,exist_ok=True);shutil.copy2(found[0],out/found[0].name)
 for name in ('panel.json','render.log'):
  p=found[0].parent/name
  if p.exists():shutil.copy2(p,out/name)
 print('COLLECT_PANEL',bid,flush=True)
