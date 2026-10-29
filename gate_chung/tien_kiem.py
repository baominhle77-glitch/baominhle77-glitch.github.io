"""Cổng TIỀN KIỂM (preflight) — chạy TRƯỚC mọi lần render/ghép/gate (D18).

Gom các lỗi vặt từng tòi ra giữa chừng thành một cổng fail-fast:
 1. lenh  : dependency ngoài trên PATH (tesseract, ffmpeg, ffprobe...) chạy được --version.
 2. modun : import được mọi module gate_chung + module chỉ định thêm (sys.path/thiếu lib lộ ngay).
 3. beat  : danh sách id beat sắp render/ghép phải TRÙNG KHỚP tập id trong storyboard/bản vẽ
            (đủ, không thừa, không thiếu, không trùng lặp).
 4. schema: file cấu hình JSON đọc được; bản vẽ có 'beats' với id duy nhất; file đối chiếu
            (ke_hoach, optics...) không chứa id lạ ngoài bản vẽ.
 5. tep   : tệp bắt buộc (font...) tồn tại.

Dùng:
  python -m gate_chung.tien_kiem --ban-ve ci/remotion_b/ban_ve_B60.json \
      --danh-sach h1,h2,... [--doi-chieu ci/remotion_b/ke_hoach_A.json:beats] \
      [--lenh tesseract,ffmpeg,ffprobe] [--modun ci.remotion_b.measure,...] [--tep duong/dan,...]
Thoát 0 = ĐẠT; thoát 1 = TRƯỢT (in đủ mọi lỗi tìm thấy rồi mới dừng, không dừng ở lỗi đầu).
"""
import argparse,importlib,json,os,pkgutil,shutil,subprocess,sys
from pathlib import Path

LENH_MAC_DINH=['tesseract','ffmpeg','ffprobe']
# Thu muc công cụ ngoài hay bi doi cho (tesseract doi tu C: sang E: ngay 29/10).
# Tien kiem TU VA vao PATH cua tien trinh: tien trinh cu giu PATH cu van chay duoc gate.
THU_MUC_DU_PHONG=[r'E:\Tools\Tesseract-OCR',r'C:\Program Files\Tesseract-OCR',
                  r'E:\Tools\ffmpeg\bin',r'C:\Program Files\ffmpeg\bin']

def va_path():
 """Them User PATH tu registry + cac thu muc du phong vao PATH cua tien trinh nay."""
 them=[]
 try:
  import winreg
  with winreg.OpenKey(winreg.HKEY_CURRENT_USER,'Environment') as k:
   gia_tri=winreg.QueryValueEx(k,'Path')[0]
  them+= [x for x in os.path.expandvars(gia_tri).split(';') if x]
 except Exception:pass
 them+=THU_MUC_DU_PHONG
 hien=os.environ.get('PATH','').split(os.pathsep);da_them=[]
 for d in them:
  if d and d not in hien and Path(d).is_dir():hien.insert(0,d);da_them.append(d)
 os.environ['PATH']=os.pathsep.join(hien)
 return da_them

def _id_beats(du_lieu):
 if isinstance(du_lieu,dict):
  beats=du_lieu.get('beats',du_lieu)
  if isinstance(beats,dict):return list(beats.keys())
  du_lieu=beats
 if isinstance(du_lieu,list):return [b.get('id') if isinstance(b,dict) else b for b in du_lieu]
 return []

def kiem(ban_ve=None,danh_sach=None,doi_chieu=(),lenh=None,modun=(),tep=()):
 loi=[];ok=[]
 da_them=va_path()
 if da_them:ok.append('path: tu va PATH tien trinh + '+', '.join(da_them[:4]))
 for cmd in (lenh if lenh is not None else LENH_MAC_DINH):
  duong=shutil.which(cmd)
  if not duong:loi.append(f'lenh: {cmd} KHONG co tren PATH');continue
  try:
   co=f'-version' if cmd in ('ffmpeg','ffprobe') else '--version'
   r=subprocess.run([cmd,co],capture_output=True,text=True,timeout=20)
   dong=(r.stdout or r.stderr).splitlines()[0] if (r.stdout or r.stderr) else ''
   (ok if r.returncode==0 else loi).append(f'lenh: {cmd} = {dong}' if r.returncode==0 else f'lenh: {cmd} chay loi rc={r.returncode}')
  except Exception as e:loi.append(f'lenh: {cmd} chay loi: {e}')
 import gate_chung
 ten_mo_dun=['gate_chung.'+m.name for m in pkgutil.iter_modules(gate_chung.__path__) if m.name not in ('setup','tests','examples')]
 for ten in ten_mo_dun+list(modun):
  try:importlib.import_module(ten);ok.append(f'modun: {ten}')
  except Exception as e:loi.append(f'modun: import {ten} LOI: {type(e).__name__}: {e}')
 id_chuan=None
 if ban_ve is not None:
  try:
   du_lieu=json.loads(Path(ban_ve).read_text(encoding='utf-8'));id_chuan=_id_beats(du_lieu)
   if None in id_chuan or len(set(id_chuan))!=len(id_chuan):loi.append(f'schema: {ban_ve} id beat thieu/trung lap: {id_chuan}')
   else:ok.append(f'schema: {ban_ve} {len(id_chuan)} beat, id duy nhat')
  except Exception as e:loi.append(f'schema: {ban_ve} doc loi: {e}');id_chuan=None
 if danh_sach is not None:
  ds=[x for x in danh_sach if x]
  if len(set(ds))!=len(ds):loi.append(f'beat: danh sach render co id trung lap')
  if id_chuan is not None:
   thieu=sorted(set(id_chuan)-set(ds));thua=sorted(set(ds)-set(id_chuan))
   if thieu or thua:loi.append(f'beat: danh sach render KHONG KHOP ban ve — thieu={thieu} thua={thua}')
   else:ok.append(f'beat: danh sach render khop ban ve ({len(ds)} beat)')
 for muc in doi_chieu:
  duong,_,khoa=str(muc).partition(':')
  try:
   du_lieu=json.loads(Path(duong).read_text(encoding='utf-8'))
   if khoa:du_lieu=du_lieu.get(khoa,{}) if isinstance(du_lieu,dict) else du_lieu
   ids=_id_beats(du_lieu)
   if id_chuan is not None:
    la=sorted(set(ids)-set(id_chuan))
    if la:loi.append(f'schema: {duong} chua id la ngoai ban ve: {la}')
    else:ok.append(f'schema: {duong} ({len(ids)} id, deu thuoc ban ve)')
   else:ok.append(f'schema: {duong} doc duoc ({len(ids)} id)')
  except Exception as e:loi.append(f'schema: {duong} doc loi: {e}')
 for duong in tep:
  (ok if Path(duong).exists() else loi).append(('tep: co '+str(duong)) if Path(duong).exists() else f'tep: THIEU {duong}')
 return ok,loi

def main(argv=None):
 p=argparse.ArgumentParser(description='Cong TIEN KIEM chay truoc moi render/ghep/gate')
 p.add_argument('--ban-ve',type=Path);p.add_argument('--danh-sach',help='id beat sap render, phay cach')
 p.add_argument('--doi-chieu',action='append',default=[],help='file.json[:khoa] can khop id voi ban ve')
 p.add_argument('--lenh',default=','.join(LENH_MAC_DINH));p.add_argument('--modun',default='');p.add_argument('--tep',action='append',default=[])
 a=p.parse_args(argv)
 ok,loi=kiem(ban_ve=a.ban_ve,danh_sach=a.danh_sach.split(',') if a.danh_sach else None,doi_chieu=a.doi_chieu,
             lenh=[x for x in a.lenh.split(',') if x],modun=[x for x in a.modun.split(',') if x],tep=a.tep)
 for d in ok:print('DAT  |',d)
 for d in loi:print('TRUOT|',d)
 print(f'TIEN_KIEM {"DAT" if not loi else "TRUOT"} ({len(ok)} dat, {len(loi)} truot)')
 return 0 if not loi else 1

if __name__=='__main__':sys.exit(main())
