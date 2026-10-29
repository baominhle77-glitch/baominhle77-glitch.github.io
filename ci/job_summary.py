"""Append actual reports to Actions Summary; never print a green default."""
import argparse,json,os
from pathlib import Path

def main():
 p=argparse.ArgumentParser();p.add_argument('--root',type=Path,default=Path('.'));a=p.parse_args()
 dest=os.environ.get('GITHUB_STEP_SUMMARY')
 if not dest:raise SystemExit('GITHUB_STEP_SUMMARY is not set')
 lines=['## K1 t3 — measured evidence','']
 summaries=list(a.root.rglob('summary.md'))
 combined=[path for path in summaries if path.parent.name=='mau_540']
 summaries=combined or summaries
 if summaries:
  for path in summaries:lines.append(path.read_text(encoding='utf-8'))
 else:lines+=['**Render report missing: validation did not finish.**','']
 measurements={}
 for path in a.root.rglob('review.json'):
  for row in json.loads(path.read_text(encoding='utf-8')):
   key=(row.get('format'),row.get('beat'))
   if key not in measurements or row.get('kind')=='video':measurements[key]=row
 if measurements:
  lines+=['','### C13 measured projected bounds (not filled-pixel coverage)','',
   '| Format/beat | Scope | Subject bbox % | Width × height % | Longest <50% s | Projected pepper centres | Text gap px | Cropped | C13 |',
   '|---|---|---|---|---|---|---|---|---|']
  for key,row in sorted(measurements.items()):
   c=row.get('composition',{})
   def val(name):
    value=c.get(name)
    return 'UNRUN' if value is None else str(round(value,2))
   lines.append('| {}/{} | {} | {} | {} × {} | {} | {} | {} | {} | {} |'.format(*key,row.get('kind','UNRUN'),val('subject_bbox_pct'),val('subject_width_pct'),val('subject_height_pct'),val('max_under_50_s'),val('projected_pepper_centres_min'),val('caption_gap_px'),c.get('subject_clipped','UNRUN'),row.get('C13','UNRUN')))
  lines+=['','A still row checks representative poses, not the complete beat timeline. Clipping is disclosed for the intentional close-up framing; inspect the actual images.','']
 for path in a.root.rglob('chuyen_dong_vung.json'):
  report=json.loads(path.read_text(encoding='utf-8'));lines+=['### Full-frame sample gate: '+report.get('ket_qua','UNRUN'),'']
  lines+=['| Format | Beat | Avg % | Union % | ≥3% pairs % | Longest low s | Difference | Result |','|---|---|---|---|---|---|---|---|']
  for fmt in report.get('bao_cao',[]):
   for b in fmt['beats']:lines.append('| {} | {} | {} | {} | {} | {} | {} | {} |'.format(fmt['bo_cuc'],b['beat'],b['dien_tich_trung_binh_pct'],b['vung_dong_gop_pct'],b['cap_ge_3pct_pct'],b['chuoi_duoi_0_3pct_dai_nhat_s'],b.get('khac_canh'),b['ket_qua']))
   lines+=['',f"**{fmt['bo_cuc']}: {fmt['so_doan_2s_dat']}/30 two-second windows pass; required ≥28/30.**",'']
  for error in report.get('loi',[]):lines.append('- '+str(error))
 publications=list(a.root.rglob('published_images.json'))
 valid=False
 for path in publications:
  publication=json.loads(path.read_text(encoding='utf-8'))
  if publication.get('run_id')!=os.environ.get('GITHUB_RUN_ID') or publication.get('source_sha')!=os.environ.get('GITHUB_SHA'):
   continue
  valid=True
  for entry in publication['images']:
   lines+=['',f"### Actual run image — {entry['label']}",f"![{entry['label']}]({entry['url']})"]
 if not valid:lines+=['','**Actual run images were not published. Inline images are unavailable; see the evidence artifact. This is not an image-review pass.**']
 with open(dest,'a',encoding='utf-8') as f:f.write('\n'.join(lines)+'\n')

if __name__=='__main__':main()
