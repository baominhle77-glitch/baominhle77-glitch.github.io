"""KHUÔN v1 — kiểm các tệp khuôn còn NGUYÊN VĂN (sha256) và scene.py đã dùng stage_khuon. rc=0 đạt, rc=1 trượt.
Dùng: python ci/kiem_khuon_sha.py   (chạy ở gốc repo; đặt trong CI trước render)"""
import sys, hashlib, re
from pathlib import Path
R = Path(__file__).resolve().parents[1]

SHA = {
    'ci/simulation/stage_om.py': '27221a575e0a1625d46cb4c5eb138574c6a35ad79e7d69448707f5b78b17423f',
    'ci/remotion_b/stage_khuon.py': '68f62d0c4d3d2072c714494a7a305a7acba17dbceddd7b1c8c2c910d7446c419',
    'ci/kiem_ban_ve.py': '2b2a20392e7793769260f82531076017984dac78c1f19c8800db16ce9f2c0f36',
    'ci/g12_vat_chinh.py': '0a2b102a605c55099fb8f4faed22812ba2a4ab68f556898b9db16e734fdc76c4',
    'ci/khuon_dung_thu.py': '5499d8c937883a2d6c1fe83f4f119ba7ca6f0f89975165f823ce35baf4e8a4e2',
}


def main():
    loi = []
    for duong, sha in SHA.items():
        p = R / duong
        if not p.exists():
            loi.append(f'thiếu {duong}')
            continue
        # so theo nội dung LF để không trượt vì git autocrlf
        h = hashlib.sha256(p.read_bytes().replace(b'\r\n', b'\n')).hexdigest()
        if h != sha:
            loi.append(f'{duong}: sha {h[:12]} khác khuôn {sha[:12]} -> đã bị sửa, chép lại nguyên văn từ nhánh codex-khung/khuon/')
    sc = R / 'ci/remotion_b/scene.py'
    if sc.exists():
        t = sc.read_text(encoding='utf-8')
        if not re.search(r'^from stage_khuon import make_stage as build_stage\s*,\s*base_optics', t, re.M):
            loi.append('scene.py chưa import stage_khuon (dòng: from stage_khuon import make_stage as build_stage,base_optics)')
        if re.search(r'^from stage_spec import', t, re.M):
            loi.append('scene.py vẫn import stage_spec -> bỏ dòng đó')
    else:
        loi.append('thiếu ci/remotion_b/scene.py')
    print('KIEM_KHUON_SHA:', 'DAT' if not loi else 'TRUOT (%d lỗi)' % len(loi))
    for l in loi:
        print('  - ' + l)
    return 0 if not loi else 1


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.exit(main())
