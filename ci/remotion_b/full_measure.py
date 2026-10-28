"""Full-length delivery contract; reuse the unchanged universal G1–G11 results."""
import argparse,json,math,subprocess,sys
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
R=Path(__file__).resolve().parents[2];H=Path(__file__).resolve().parent;sys.path.insert(0,str(R))
from output_paths import output_root
from gate_chung.motion import sample,windows,beat_motion
from ci.analysis_video import canonical_540

def main():
 p=argparse.ArgumentParser();p.add_argument('--caption-alignment',type=Path,required=True);a=p.parse_args();o=output_root(R);data=json.loads((H/'public/data.json').read_text());duration=data['frames']/30;failures=[];reports={};verification=[]
 assert duration>=480 and len(data['beats'])==35
 assert json.loads(a.caption_alignment.read_text())
 for fmt in ('16x9','9x16'):
  movie=o/f'B_full_{fmt}.mp4';meta=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(movie)]));video=next(s for s in meta['streams'] if s['codec_type']=='video');valid=video['r_frame_rate']=='30/1' and int(video['nb_frames'])==data['frames'] and float(video['duration'])>=480 and abs(float(video['duration'])-duration)<.04
  verification.append(dict(format=fmt,file=movie.name,bytes=movie.stat().st_size,ffprobe=meta,passed=valid));print('FULL_FFPROBE',fmt,video['width'],video['height'],video['duration'],video['nb_frames'],flush=True)
  if not valid:failures.append(fmt+'/TECHNICAL')
  common=json.loads((o/f'gate_chung_{fmt}/gates.json').read_text());reports[fmt]=common
  if not common.get('passed'):failures.extend(fmt+'/'+g for g,r in common['gates'].items() if not r['passed'])
  with canonical_540(movie,fmt) as (proxy,evidence):frames=sample(proxy,duration)
  measured=windows(frames,duration);beats=beat_motion(frames,[dict(id=b['id'],start=b['start']/30,end=(b['start']+b['frames'])/30) for b in data['beats']])
  motion=dict(**measured,beats=beats,canonical_input=evidence)
  for w in measured['rows']:print('C17',fmt,f"{w['start']:.1f}–{w['end']:.1f}",f"mean={w['mean_pct']:.3f}% union={w['union_pct']:.3f}% pairs={w['pairs_ge3_pct']:.3f}%",'DAT' if w['pass_window'] else 'TRUOT',flush=True)
  for b in beats:print('C17_BEAT',fmt,b['beat'],b['mean_pct'],b['union_pct'],b['pairs_ge3_pct'],b['pass_motion'],b['pass_scene'],flush=True)
  if not measured['pass_gate'] or not all(b['pass_motion'] and b['pass_scene'] for b in beats):failures.append(fmt+'/C17')
  (o/f'c17_full_{fmt}.json').write_text(json.dumps(motion,indent=2)+'\n')
  cw,ch=(480,294) if fmt=='16x9' else (270,504);sheet=Image.new('RGB',(cw*5,ch*7),'#1C232B');d=ImageDraw.Draw(sheet);font=ImageFont.truetype(str(R/'ban_sac/fonts/NotoSans-Regular.ttf'),18)
  for i,b in enumerate(data['beats']):
   t=(b['start']+b['frames']/2)/30;dest=o/f'contact_{fmt}_{b["id"]}.png';subprocess.run(['ffmpeg','-v','error','-y','-ss',str(t),'-i',str(movie),'-frames:v','1',str(dest)],check=True);im=Image.open(dest);im.thumbnail((cw,ch-24));x=i%5*cw;y=i//5*ch;sheet.paste(im,(x,y));d.text((x+8,y+ch-23),f'{b["id"]} {t:.2f}s',font=font,fill='white')
  sheet.save(o/f'contact_sheet_full_{fmt}.jpg',quality=90)
 clips=data['clips'];count=len(clips);intervals=sorted((c['start']/30,(c['start']+c['frames'])/30) for c in clips);clip_fail=[]
 if count<5 or any(z-a<4 for a,z in intervals):clip_fail.append('clip_count_or_duration')
 if not intervals or intervals[0][0]>0 or intervals[0][1]<3:clip_fail.append('opening_0_3')
 if sum(a<30 and z>=a+4 for a,z in intervals)<2:clip_fail.append('first30_two_clips')
 gap=max([intervals[0][0],duration-intervals[-1][1]]+[b[0]-a[1] for a,b in zip(intervals,intervals[1:])])
 if gap>60:clip_fail.append('footage_gap_over60')
 c16=dict(passed=not clip_fail,failures=clip_fail,insertions=count,unique_sources=sorted({c['path'] for c in clips}),source_reuse_declared=True,max_uncovered_gap_s=gap,clips=clips)
 if clip_fail:failures.append('C16')
 (o/'video_verification.json').write_text(json.dumps(verification,indent=2)+'\n');(o/'c16_full.json').write_text(json.dumps(c16,ensure_ascii=False,indent=2)+'\n')
 (o/'gate_status.json').write_text(json.dumps(dict(result='TRUOT' if failures else 'DAT',failures=failures,duration_s=duration,frames=data['frames'],beats=35),indent=2)+'\n')
 print('FULL_GATES',failures,flush=True);return bool(failures)
if __name__=='__main__':raise SystemExit(main())
