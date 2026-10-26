"""B first-60s entrypoint; reuse A's unchanged full-frame gate functions.
All six beat, scene-difference and 30 two-second thresholds are retained.
The unrelated 29 beats/35-still full-episode check is outside this B scope.
"""
import argparse,sys,json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'ci'))
from chuyen_dong_vung import extract,measure

def main():
 p=argparse.ArgumentParser();p.add_argument('--root',type=Path,required=True);a=p.parse_args();root=a.root
 plan=json.loads((Path(__file__).resolve().parents[1]/'ci/remotion_b/ke_hoach_A.json').read_text())
 rows=[];failures=[]
 for fmt in ('16x9','9x16'):
  path=root/f'B_60s_{fmt}.mp4'
  try:
   report=measure(extract(path,fmt),plan,fmt);rows.append(report)
   for window in report['cua_so_2s']:
    print('C17_WINDOW %s %02d-%02ds mean=%.3f%% union=%.3f%% pairs_ge3=%.3f%% => %s' % (fmt,window['giay_vao'],window['giay_vao']+2,window['tb_pct'],window['gop_pct'],window['cap_ge_3pct_pct'],window['ket_qua']),flush=True)
   failures += [fmt+'/'+b['beat'] for b in report['beats'] if b['ket_qua']!='DAT']
   if not report['cong_2s_dat']:failures.append(fmt+'/2s')
  except Exception as exc:failures.append(fmt+': '+str(exc))
 out=dict(ket_qua='TRUOT' if failures else 'DAT',loi=failures,bao_cao=rows,gate_implementation='ci/chuyen_dong_vung.py unchanged from aca6c94',scope='h1 to 60s, 6 beats; no full-episode claim')
 table=['| Khổ | Giây | TB % | Gộp % | Cặp ≥3% % | Kết quả |','|---|---:|---:|---:|---:|---|']
 for r in rows:
  for w in r['cua_so_2s']:table.append('| %s | %d–%d | %.3f | %.3f | %.3f | %s |' % (r['bo_cuc'],w['giay_vao'],w['giay_vao']+2,w['tb_pct'],w['gop_pct'],w['cap_ge_3pct_pct'],w['ket_qua']))
 (root/'c17_windows.md').write_text('\n'.join(table)+'\n',encoding='utf-8')
 (root/'chuyen_dong_vung.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
 return bool(failures)
if __name__=='__main__':raise SystemExit(main())
