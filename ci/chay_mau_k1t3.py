"""Render only the first 60s sample plus 35 middle stills; retain failing evidence."""
import json,os,re,subprocess,sys
from pathlib import Path

R=Path.cwd()
B=R/'out/M1_MARANGONI_DUNG/_build'
OUT=B/'mau_540'
FIRST=('h1','h2','h3','h4','c1','p1')

def run(args):
 p=subprocess.run(list(map(str,args)),cwd=R)
 if p.returncode:raise RuntimeError('COMMAND_FAILED '+str(p.returncode)+' '+str(args))

def main():
 OUT.mkdir(parents=True,exist_ok=True)
 run([sys.executable,'ci/chay_ci.py','--tap',R/'tools/tap/ML_K1_t3.json','--buoc','ke_hoach,canh','--bo-cuc','ca_hai'])
 plan=json.loads((B/'ke_hoach.json').read_text(encoding='utf-8'));assert plan['tong_khung']==16601
 review=subprocess.run([sys.executable,'ci/review_k1t3.py','--root',str(R),'--out',str(OUT/'review'),'--beats',','.join(FIRST),'--jobs','4'],cwd=R)
 middle=subprocess.run([sys.executable,'ci/review_k1t3.py','--root',str(R),'--out',str(OUT/'review_mid'),'--stills-only','--jobs','4'],cwd=R)
 report_path=OUT/'review/review.json'
 rows=json.loads(report_path.read_text(encoding='utf-8')) if report_path.exists() else []
 middle_path=OUT/'review_mid/review.json'
 middle_rows=json.loads(middle_path.read_text(encoding='utf-8')) if middle_path.exists() else []
 from review_k1t3 import write_summary
 combined=[]
 for fmt in ('16x9','9x16'):
  for bid in plan['thu_tu']:
   combined.append(next((r for r in rows if r.get('beat')==bid and r.get('format')==fmt),next((r for r in middle_rows if r.get('beat')==bid and r.get('format')==fmt),dict(beat=bid,format=fmt,status='UNRUN'))))
 write_summary(combined,OUT)
 summary=OUT/'summary.md'
 summary.write_text('Scope: first six beats rendered as 540p/30fps clips; all 35 native middle stills checked. Motion of remaining 29 full beats is UNRUN.\n\n'+summary.read_text(encoding='utf-8'),encoding='utf-8')
 failures=[]
 tts=json.loads((B/'tts.json').read_text(encoding='utf-8'))['beats']
 from PIL import Image,ImageDraw
 for fmt in ('16x9','9x16'):
  clips=[]
  for bid in FIRST:
   row=next((r for r in rows if r.get('beat')==bid and r.get('format')==fmt),{})
   if row.get('video') and row.get('frame_count_pass'):clips.append(Path(row['video']))
  if len(clips)==len(FIRST):
   folder=OUT/fmt;folder.mkdir(exist_ok=True)
   playlist=folder/'first60.ffconcat';playlist.write_text('ffconcat version 1.0\n'+''.join("file '%s'\n"%str(p).replace('\\','/') for p in clips),encoding='utf-8')
   mute=folder/'mute60.mp4'
   run(['ffmpeg','-nostdin','-y','-v','error','-f','concat','-safe','0','-i',playlist,'-t','60','-an','-c:v','libx264','-crf','18','-pix_fmt','yuv420p',mute])
   audio=[];filters=[]
   for i,bid in enumerate(FIRST):
    audio+=['-i',str(Path(tts[bid]['mp3']).resolve())]
    start=plan['beats'][bid]['t0']+plan['beats'][bid]['t_chuyen']
    filters.append('[%d:a]adelay=%d:all=1,atrim=0:60[a%d]'%(i+1,round(start*1000),i+1))
   filters.append(''.join('[a%d]'%i for i in range(1,7))+'amix=inputs=6:normalize=0:duration=longest,atrim=0:60[a]')
   movie=OUT/f'mau_00_60_{fmt}_540p.mp4'
   run(['ffmpeg','-nostdin','-y','-v','error','-i',mute,*audio,'-filter_complex',';'.join(filters),'-map','0:v:0','-map','[a]','-c:v','copy','-c:a','aac','-b:a','160k','-t','60',movie])
   frozen=subprocess.run(['ffmpeg','-nostdin','-i',str(movie),'-vf','freezedetect=n=0.001:d=2','-an','-f','null','-'],capture_output=True,text=True,encoding='utf-8',errors='replace')
   if frozen.returncode:raise RuntimeError('FREEZE_COMMAND_FAILED '+frozen.stderr[-2000:])
   starts=[float(x) for x in re.findall(r'freeze_start:\s*([0-9.]+)',frozen.stderr)]
   ends=[float(x) for x in re.findall(r'freeze_end:\s*([0-9.]+)',frozen.stderr)]
   spans=[max(0,min(60,ends[i] if i<len(ends) else 60)-start) for i,start in enumerate(starts)]
   freeze=dict(format=fmt,freeze_s=sum(spans),longest_s=max(spans,default=0),pass_freeze=sum(spans)<=6 and max(spans,default=0)<=4)
   (OUT/f'freeze_{fmt}.json').write_text(json.dumps(freeze,indent=2),encoding='utf-8')
   if not freeze['pass_freeze']:failures.append('FREEZE_'+fmt+' '+str(freeze))

  else:failures.append('THIEU_VIDEO_'+fmt)
  stills=[r for r in middle_rows if r.get('format')==fmt and r.get('image')]
  sheet=Image.new('RGB',(960,9*165),'#1c232b');draw=ImageDraw.Draw(sheet)
  for i,bid in enumerate(plan['thu_tu']):
   row=next((r for r in stills if r['beat']==bid),None)
   x,y=(i%4)*240,(i//4)*165
   if row:
    im=Image.open(row['image']).convert('RGB');im.thumbnail((236,135));sheet.paste(im,(x+(240-im.width)//2,y))
   draw.text((x+8,y+140),bid+(' MISSING' if not row else ''),fill='white')
  sheet.save(OUT/f'contact_sheet_{fmt}.jpg',quality=94)
  diff=[]
  for bid in plan['thu_tu']:
   r=next((r for r in middle_rows if r.get('beat')==bid and r.get('format')==fmt),{})
   diff.append(dict(beat=bid,khac_canh=r.get('scene_difference_min'),tat_ca_hieu_gray=r.get('scene_differences',[]),ket_qua='DAT' if r.get('scene_difference_pass') else 'TRUOT'))
  (OUT/f'khac_canh_35_{fmt}.json').write_text(json.dumps(dict(bo_cuc=fmt,nguong=12,compare='EVERY_PRIOR_BEAT',beats=diff),ensure_ascii=False,indent=2),encoding='utf-8')
 if review.returncode or middle.returncode not in (0,2) or failures:raise SystemExit('K1_REVIEW_FAILED '+str(failures)+' — see review/summary.md for each beat and metric')
 print('K1_REVIEW_FIRST_60S_AND_35_MIDDLE_STILLS_PASS',flush=True)

if __name__=='__main__':main()
