"""Independent panel cache: full-beat media keys and files stay intact."""
import argparse,hashlib,json,os,shutil,subprocess,sys,time,resource
from pathlib import Path
from beat_cache import key as full_key
R=Path(__file__).resolve().parents[2];H=Path(__file__).resolve().parent
DURATIONS={'h1':6.,'h2':3.,'h3':7.}
def panel_height(short):
 full=round(short*16/9);top=json.loads((H/'ban_ve_B60.json').read_text())['bo_cuc_doc']['tren'];return full-round(full*top)
def key(bid,short=540):
 clip=next(c for c in json.loads((H/'gemini.json').read_text()) if c['simulation_beat']==bid);calibration=[clip['simulation_optics'],clip.get('portrait_start',clip['start'])]
 h=hashlib.sha256((full_key(bid,short)+(H/'panel_scene.py').read_text()+json.dumps(calibration,sort_keys=True)+str(DURATIONS[bid])+str(short)+'x'+str(panel_height(short))+'x30').encode());return h.hexdigest()
def main():
 p=argparse.ArgumentParser();p.add_argument('--beat',required=True);p.add_argument('--key',action='store_true');p.add_argument('--short-side',type=int,default=540);a=p.parse_args()
 if a.key:print(key(a.beat,a.short_side) if a.beat in DURATIONS else 'none');return
 if a.beat not in DURATIONS:return
 bid=a.beat;root=R/'work/B_panels'/str(a.short_side)/bid;root.mkdir(parents=True,exist_ok=True);target=root/f'panel_9x16_{bid}.mp4';meta=root/'panel.json';digest=key(bid,a.short_side)
 if target.exists() and meta.exists() and json.loads(meta.read_text()).get('source_digest')==digest:print('PANEL_CACHE_HIT',bid);return
 clip=next(c for c in json.loads((H/'gemini.json').read_text()) if c['simulation_beat']==bid);episode=json.loads((H/'ke_hoach_A.json').read_text());offset=(clip.get('portrait_start',clip['start'])-round(episode['beats'][bid]['t0']*30))/30
 env=dict(os.environ,B_TIME_OFFSET=str(offset),B_BEAT=bid,B_FORMAT='9x16',B_SHORT_SIDE=str(a.short_side),B_DURATION=str(DURATIONS[bid]));env.pop('B_AT',None);start=time.perf_counter();before=resource.getrusage(resource.RUSAGE_CHILDREN)
 p=subprocess.run([sys.executable,'-m','manim','render','--resolution',f'{a.short_side},{panel_height(a.short_side)}','--fps','30','--disable_caching','--progress_bar','none','-v','ERROR','--media_dir',str(root/'media'),str(H/'panel_scene.py'),'PanelScene'],env=env,cwd=R,capture_output=True);(root/'render.log').write_bytes(p.stdout+p.stderr)
 if p.returncode:raise RuntimeError((p.stdout+p.stderr).decode(errors='replace')[-2500:])
 src=next((root/'media/videos').rglob('PanelScene.mp4'));shutil.copy2(src,target);after=resource.getrusage(resource.RUSAGE_CHILDREN);data=dict(beat=bid,duration=DURATIONS[bid],width=a.short_side,height=panel_height(a.short_side),fps=30,wall_s=time.perf_counter()-start,cpu_s=after.ru_utime+after.ru_stime-before.ru_utime-before.ru_stime,bytes=target.stat().st_size,source_digest=digest);meta.write_text(json.dumps(data,indent=2)+'\n');print('PANEL_RENDER',json.dumps(data),flush=True)
 for label,t in (('first',.15),('middle',DURATIONS[bid]/2),('last',DURATIONS[bid]-.15)):
  subprocess.run(['ffmpeg','-v','error','-y','-ss',str(t),'-i',str(target),'-frames:v','1',str(root/(label+'.png'))],check=True)
if __name__=='__main__':main()
