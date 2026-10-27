"""Content producer bridge: measured source dimensions and native panel assets."""
import json,subprocess,shutil,os
from pathlib import Path
H=Path(__file__).resolve().parent;R=H.parents[1]
def enrich(data):
 short=os.environ.get('B_SHORT_SIDE','540')
 blueprint=json.loads((H/'ban_ve_B60.json').read_text());data['portrait_top']=blueprint['bo_cuc_doc']['tren'];data['blueprint_text']={b['id']:b['vung_chu'] for b in blueprint['beats']}
 for beat in data['beats']:
  beat['media']={};beat['internal_layers']={}
  for fmt in ('16x9','9x16'):
   source=R/'work/B_cache'/short/beat['id']/f'{fmt}_{beat["id"]}.mp4';beat['media'][fmt]=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','json',str(source)]))['streams'][0]
   manifest=source.with_suffix('.layout.json')
   if manifest.exists():beat['internal_layers'][fmt]=json.loads(manifest.read_text())['layers']
 for clip in data['clips']:
  meta=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','json',str(R/clip['path'])]))['streams'][0];clip['source_width']=meta['width'];clip['source_height']=meta['height']
  bid=clip['simulation_beat'];name=f'panel_9x16_{bid}.mp4';source=R/'work/B_panels'/os.environ.get('B_SHORT_SIDE','540')/bid/name
  if not source.exists():raise FileNotFoundError('G3 missing native simulation panel '+str(source))
  shutil.copy2(source,H/'public'/name);clip['panel_src']=name;clip['panel_dimensions']=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','json',str(source)]))['streams'][0]
 (H/'public/data.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n');return data
