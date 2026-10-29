"""D18 cong chung 'MOT BAN' (lenh Chu tich 29/10 21:00, luat vi pham lan 2 -> cong code).

1) Truoc khi render lai mot beat / dung lai mot ban: ban cu tu vao Thung rac (KHONG xoa vinh vien)
   kem bien ban D11 (duong dan, bytes, sha256-8) append Python 'ab' CRLF vao _hop_thu/*__giam_doc.md.
2) Compose/G1/tien_kiem tu choi khi mot thu muc beat con >1 ban video (kiem_mot_ban).
Ap cho MOI tap. Import nhe (chi thu vien chuan).

CLI:
  python -m gate_chung.thay_the kiem <B_cache/540>          -> rc 1 neu con ban trung
  python -m gate_chung.thay_the don  <tep|thu_muc>... --ly-do "..."   -> dua vao Thung rac + bien ban
"""
import argparse, hashlib, json, os, subprocess, sys, tempfile, time
from pathlib import Path

BIEN_BAN = Path(os.environ.get('THAY_THE_BIEN_BAN', 'E:/Studio/out/_hop_thu/don_dep__giam_doc.md'))
VIDEO = {'.mp4', '.mov', '.mkv', '.webm'}
CAM_DUOI = {'.py', '.sh', '.bak'}
CAM_DUONG = ('_cho_chu_tich', 'COMBO_DANG', 'venv_manim', '.git')


class LoiThayThe(RuntimeError):
    pass


def _sha8(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for k in iter(lambda: f.read(1 << 20), b''):
            h.update(k)
    return h.hexdigest()[:8]


def _cam(p):
    s = str(p).replace('\\', '/')
    if any(c in s for c in CAM_DUONG):
        return 'duong cam'
    n = p.name.lower()
    if p.suffix.lower() in CAM_DUOI or '.bak' in n:
        return 'duoi cam (.py/.sh/.bak)'
    return None


def _ps(script):
    p = subprocess.run(['powershell.exe', '-NoLogo', '-NoProfile', '-NonInteractive', '-Command', script],
                       stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=600)
    return p.returncode, p.stdout.decode('utf-8', 'replace'), p.stderr.decode('utf-8', 'replace')


def cho_trong_thung_rac(o_dia):
    """Byte con trong cua Thung rac o dia (MaxCapacity theo volume - da dung). None neu khong do duoc."""
    d = o_dia.rstrip(':\\/')[:1].upper()
    sc = (
        "$ErrorActionPreference='Stop';"
        f"$g=(mountvol {d}:\\ /L).Trim();$g=$g.Substring($g.IndexOf('{{')).TrimEnd('\\');"
        "$k='HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\BitBucket\\Volume\\'+$g;"
        "$m=(Get-ItemProperty $k).MaxCapacity;$n=(Get-ItemProperty $k).NukeOnDelete;"
        "$u=0;(New-Object -ComObject Shell.Application).NameSpace(10).Items()|%{$u+=[int64]$_.ExtendedProperty('Size')};"
        "Write-Output \"$m $n $u\""
    )
    rc, out, _ = _ps(sc)
    try:
        m, n, u = out.split()[-3:]
        if int(n):
            return 0
        return int(m) * 1024 * 1024 - int(u)
    except Exception:
        return None


def _ghi_bien_ban(dong):
    BIEN_BAN.parent.mkdir(parents=True, exist_ok=True)
    with open(BIEN_BAN, 'ab') as f:
        f.write(('\r\n'.join(dong) + '\r\n').encode('utf-8'))


def dua_vao_thung_rac(duong, ly_do, nguoi='gate_chung.thay_the'):
    """Dua tep/thu muc vao Thung rac. Kiem cho trong truoc; tu choi duong cam. Tra (so tep, bytes)."""
    muc = []
    for x in duong:
        p = Path(x)
        if not p.exists():
            continue
        tep = [q for q in p.rglob('*') if q.is_file()] if p.is_dir() else [p]
        for q in tep + [p]:
            c = _cam(q)
            if c:
                raise LoiThayThe(f'TU CHOI {q}: {c}')
        muc.append((p, [(q, q.stat().st_size, _sha8(q)) for q in tep]))
    if not muc:
        return 0, 0
    tong = sum(b for _, t in muc for _, b, _ in t)
    con = {}
    for p, _ in muc:
        o = str(p.resolve())[:1]
        if o not in con:
            con[o] = cho_trong_thung_rac(o)
    for o, c in con.items():
        can = sum(b for p, t in muc if str(p.resolve())[:1] == o for _, b, _ in t)
        if c is None or can * 1.1 > c:
            raise LoiThayThe(f'TU CHOI: Thung rac o {o}: con {c} B, can {can} B (khong xoa vinh vien)')
    with tempfile.NamedTemporaryFile('w', suffix='.txt', delete=False, encoding='utf-8') as f:
        f.write('\n'.join(str(p.resolve()) for p, _ in muc))
        ds = f.name
    sc = (
        "Add-Type -AssemblyName Microsoft.VisualBasic;"
        f"Get-Content -LiteralPath '{ds}' -Encoding UTF8|%{{ if(Test-Path -LiteralPath $_ -PathType Container)"
        "{[Microsoft.VisualBasic.FileIO.FileSystem]::DeleteDirectory($_,'OnlyErrorDialogs','SendToRecycleBin')}"
        "else{[Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile($_,'OnlyErrorDialogs','SendToRecycleBin')} }"
    )
    rc, out, err = _ps(sc)
    try:
        os.unlink(ds)
    except OSError:
        pass
    con_lai = [str(p) for p, _ in muc if p.exists()]
    dong = [f'', f'## {time.strftime("%Y-%m-%d %H:%M:%S")} | D11 thay_the | {nguoi} | {ly_do}']
    n = 0
    for p, t in muc:
        if str(p) in con_lai:
            continue
        for q, b, s in t:
            dong.append(f'- `{q}` | {b} B | sha256-8 {s} | Thung rac')
            n += 1
    dong.append(f'- Tong: {n} tep | {sum(b for p, t in muc if str(p) not in con_lai for _, b, _ in t)} B')
    _ghi_bien_ban(dong)
    if con_lai:
        raise LoiThayThe(f'Chua vao Thung rac: {con_lai} rc={rc} {err[-300:]}')
    return n, tong


def truoc_render(cache, fmt, bid):
    """Goi truoc khi render lai beat bid kho fmt: ban cu + media trung gian cu vao Thung rac."""
    cache = Path(cache)
    cu = [cache / f'{fmt}_{bid}.mp4', cache / 'media' / fmt / 'video']
    cu += [q for q in cache.glob(f'{fmt}_*.mp4') if q.name != f'{fmt}_{bid}.mp4']
    cu = [q for q in cu if q.exists()]
    return dua_vao_thung_rac(cu, f'render lai {fmt}/{bid}: ban cu bi thay') if cu else (0, 0)


def sau_render(cache, fmt, bid):
    """Goi sau khi da co {fmt}_{bid}.mp4 hop le: ban trung gian (videos/partial) vao Thung rac, giu render.log."""
    v = Path(cache) / 'media' / fmt / 'video'
    cu = [v / 'videos', v / 'partial_movie_files'] + [q for q in v.rglob('partial_movie_files') if q.is_dir()]
    cu = sorted({q for q in cu if q.exists()}, key=lambda q: len(str(q)))
    goc = []
    for q in cu:
        if not any(str(q).startswith(str(g) + os.sep) for g in goc):
            goc.append(q)
    return dua_vao_thung_rac(goc, f'trung gian sau render {fmt}/{bid}') if goc else (0, 0)


def kiem_mot_ban(goc, beat=None):
    """Moi thu muc beat duoi goc chi duoc co 1 video moi kho: dung ten {fmt}_{bid}.mp4, khong ban trung/trung gian.
    Tra danh sach loi (rong = DAT)."""
    goc = Path(goc)
    loi = []
    if not goc.is_dir():
        return [f'khong co thu muc {goc}']
    for d in sorted(x for x in goc.iterdir() if x.is_dir()):
        if beat and d.name not in beat:
            continue
        vid = [q for q in d.rglob('*') if q.is_file() and q.suffix.lower() in VIDEO]
        hop = {f'{k}_{d.name}.mp4' for k in ('16x9', '9x16')}
        for q in vid:
            if q.parent != d or q.name not in hop:
                loi.append(f'{d.name}: ban thua {q.relative_to(goc)}')
    return loi


def kiem_phang(thu_muc, hop_le, tien_to=()):
    """Thu muc phang (vd public/): video chi duoc la ten trong hop_le hoac bat dau bang tien_to."""
    d = Path(thu_muc)
    if not d.is_dir():
        return []
    return [f'ban thua {q.name} trong {d}' for q in d.iterdir()
            if q.is_file() and q.suffix.lower() in VIDEO and q.name not in hop_le and not q.name.startswith(tuple(tien_to))]


def chan_mot_ban(goc, beat=None, ten='compose', them=()):
    loi = kiem_mot_ban(goc, beat) + list(them)
    if loi:
        raise SystemExit(f'{ten} TU CHOI (D18 mot ban): ' + '; '.join(loi[:20]) + (f' ... (+{len(loi)-20})' if len(loi) > 20 else ''))


def main(argv=None):
    a = argparse.ArgumentParser(prog='thay_the')
    s = a.add_subparsers(dest='lenh', required=True)
    k = s.add_parser('kiem'); k.add_argument('goc'); k.add_argument('--beat', nargs='*')
    d = s.add_parser('don'); d.add_argument('duong', nargs='+'); d.add_argument('--ly-do', required=True)
    a = a.parse_args(argv)
    if a.lenh == 'kiem':
        loi = kiem_mot_ban(a.goc, a.beat)
        print(json.dumps(dict(dat=not loi, loi=loi), ensure_ascii=False))
        return 1 if loi else 0
    try:
        n, b = dua_vao_thung_rac(a.duong, a.ly_do)
    except LoiThayThe as e:
        print(str(e)); return 2
    print(f'THUNG_RAC {n} tep {b} B -> bien ban {BIEN_BAN}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
