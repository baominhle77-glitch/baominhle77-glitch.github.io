import argparse,json,traceback,time
from pathlib import Path
from .model import read,validate
from .video import Video
from .motion import sample
from . import gates
from .aspect import G9
from .appearance import G10,G11

def main():
 from .tien_kiem import kiem as tien_kiem
 _ok,_loi=tien_kiem()
 if _loi:
  for d in _loi:print('TIEN_KIEM TRUOT|',d)
  return 1
 p=argparse.ArgumentParser(description='D18 universal G1–G11. Same thresholds for every genre.');p.add_argument('--video',type=Path,required=True);p.add_argument('--plan',type=Path,required=True);p.add_argument('--genre',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args();a.out.mkdir(parents=True,exist_ok=True);plan=read(a.plan);genre=read(a.genre)
 for layer in plan.get('layers',[]):
  path=Path(layer['source']);layer['source']=str((a.plan.parent/path).resolve() if not path.is_absolute() else path)
 for asset in plan.get('assets',[]):
  reference=asset.get('landscape_reference')
  if reference:
   target=Path(reference);target=target if target.is_absolute() else a.plan.parent/target
   if not target.exists() and (a.video.parent/target.name).exists():target=a.video.parent/target.name
   asset['landscape_reference']=str(target.resolve())
 errors=validate(plan,genre)
 if errors:
  report=dict(passed=False,schema_errors=errors);(a.out/'gates.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('SCHEMA_FAIL',errors);return 1
 video=Video(a.video);reports={};tech=gates.G8(video,plan);reports['G8']=tech
 try:frames=sample(a.video,video.duration) if tech['rows'][0]['passed'] else None
 except Exception:frames=None
 for name in ('G1','G2','G3','G4','G5','G6','G7','G9','G10','G11'):
  print('D18_START '+name,flush=True);started=time.monotonic()
  try:
   if name in ('G1','G2') and frames is None:raise RuntimeError('full FFmpeg preflight/decode failed')
   reports[name]=getattr(gates,name)(video,plan,frames) if name in ('G1','G2') else ({'G9':G9,'G10':G10,'G11':G11}[name](video,plan) if name in ('G9','G10','G11') else getattr(gates,name)(video,plan))
  except Exception as exc:reports[name]=dict(passed=False,rows=[gates.row(0,video.duration,False,str(exc))],traceback=traceback.format_exc())
  print('D18_DONE '+name+' '+('DAT' if reports[name]['passed'] else 'TRUOT')+' seconds='+str(round(time.monotonic()-started,2)),flush=True)
 order=lambda k:int(k[1:]);report=dict(schema_version=1,video=str(a.video),plan_id=plan['id'],genre=genre['id'],passed=all(r['passed'] for r in reports.values()),gates={k:reports[k] for k in sorted(reports,key=order)})
 (a.out/'gates.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');lines=['| Gate | Giây đầu | Giây cuối | Kết quả | Số đo / lỗi |','|---|---:|---:|---|---|']
 for name,r in sorted(reports.items(),key=lambda kv:order(kv[0])):
  for q in r['rows']:
   more={k:v for k,v in q.items() if k not in ('start','end','passed','detail')};detail=q['detail']+' '+json.dumps(more,ensure_ascii=False,separators=(',',':'));print(f'{name} {q["start"]:.3f}–{q["end"]:.3f}s '+('DAT' if q['passed'] else 'TRUOT')+' '+detail,flush=True);lines.append(f'| {name} | {q["start"]:.3f} | {q["end"]:.3f} | '+('DAT' if q['passed'] else 'TRUOT')+' | '+detail.replace('|','/')+' |')
  print(name+'_SUMMARY '+json.dumps({k:v for k,v in r.items() if k!='rows' and k!='traceback'},ensure_ascii=False),flush=True)
 (a.out/'by_second.md').write_text('\n'.join(lines)+'\n',encoding='utf-8');summary=['| Gate | Kết quả |','|---|---|']+[f'| {k} | '+('DAT' if v['passed'] else 'TRUOT')+' |' for k,v in sorted(reports.items(),key=lambda kv:order(kv[0]))];(a.out/'summary.md').write_text('\n'.join(summary)+'\n');video.close();print('D18_RESULT '+('DAT' if report['passed'] else 'TRUOT'));return int(not report['passed'])
if __name__=='__main__':raise SystemExit(main())
