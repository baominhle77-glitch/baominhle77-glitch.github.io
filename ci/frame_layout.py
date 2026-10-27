"""Topic-independent FFmpeg portrait panels with one scalar per source layer.
Context stays complete; detail is an explicitly declared, uniformly scaled crop.
The emitted manifest is consumed by the same G9 pixel gate as Remotion layers.
"""
import json,subprocess
from pathlib import Path

def probe(path):return json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','json',str(path)]))['streams'][0]

def portrait_panels(source,target,short=540,at=None,detail_crop=None):
 w,h=(lambda q:(q['width'],q['height']))(probe(source));W=short;H=round(short*16/9);u=short/540
 slots=[dict(id='context',viewport=[16*u,112*u,508*u,304*u],crop=[0,0,1,1],mode='contain'),dict(id='detail',viewport=[16*u,448*u,508*u,480*u],crop=detail_crop or [.10,.15,.80,.45],mode='cover')]
 filters=[f'color=c=0x8E969D:s={W}x{H}:r=30[base]', '[0:v]split=2[v0][v1]'];layers=[];last='base'
 for i,item in enumerate(slots):
  x,y,bw,bh=item['viewport'];cx,cy,cw,ch=item['crop'];X=round(w*cx/2)*2;Y=round(h*cy/2)*2;cw=round(w*cw/2)*2;ch=round(h*ch/2)*2;bw=round(bw/2)*2;bh=round(bh/2)*2
  s=(min if item['mode']=='contain' else max)(bw/cw,bh/ch)
  sw=round(cw*s/2)*2;sh=round(ch*s/2)*2
  # The scale filter receives one dimension; the other follows source DAR.
  scaled=f'{sw}:-2' if abs(sw/cw-s)<=abs(sh/ch-s) else f'-2:{sh}'
  if scaled.startswith('-2:'):sw=round(cw*sh/ch/2)*2
  else:sh=round(ch*sw/cw/2)*2
  actual_crop=[X/w,Y/h,cw/w,ch/h];dx=round(x+(bw-sw)/2);dy=round(y+(bh-sh)/2)
  tail=f'pad={bw}:{bh}:({bw}-iw)/2:({bh}-ih)/2:color=0x8E969D' if item['mode']=='contain' else f'crop={bw}:{bh}:(iw-{bw})/2:(ih-{bh})/2'
  filters.extend([f'[v{i}]crop={cw}:{ch}:{X}:{Y},scale={scaled}:flags=lanczos,setsar=1,{tail}[panel{i}]',f'[{last}][panel{i}]overlay={round(x)}:{round(y)}:shortest=1[out{i}]']);last='out'+str(i)
  layers.append(dict(id=item['id'],source=str(Path(source).resolve()),viewport=[x/W,y/H,bw/W,bh/H],content_bbox=[dx/W,dy/H,sw/W,sh/H],source_crop=actual_crop,scale_x=sw/cw,scale_y=sh/ch,fit=item['mode'],crop_declared=item['mode']=='cover'))
 target=Path(target);target.parent.mkdir(parents=True,exist_ok=True);args=['ffmpeg','-nostdin','-v','error','-y']
 if at is not None:args+=['-ss',str(at)]
 args+=['-i',str(source),'-filter_complex',';'.join(filters),'-map','['+last+']','-an']
 args+=['-frames:v','1'] if at is not None else ['-r','30','-c:v','libx264','-threads','2','-crf','18','-pix_fmt','yuv420p']
 subprocess.run(args+[str(target)],check=True)
 if at is None:target.with_suffix('.layout.json').write_text(json.dumps(dict(width=W,height=H,layers=layers),indent=2)+'\n')
 return layers
