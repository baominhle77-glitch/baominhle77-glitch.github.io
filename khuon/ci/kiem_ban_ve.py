"""KHUÔN v1 — kiểm ban_ve_B60.json TRƯỚC khi render (chép nguyên văn, cấm sửa). rc=0 đạt, rc=1 sai.
Dùng: python ci/kiem_ban_ve.py [ci/remotion_b/ban_ve_B60.json]
Kiểm: lược đồ; beat liền mạch 0..tong_giay, khớp khung hình; optics đúng trường Optics; sự kiện hợp lệ và
cách nhau <= 3 s (kể cả từ đầu beat và tới cuối beat); vật chính >= 70 % + lề >= 3 % (khung 'toan')
và mép vòng tiêu nằm trong 80 % giữa (khung 'can', chỉ 16:9), tính bằng chính StageOm ở 16:9 và cả hai tầng
9:16 (đều 'toan'), mỗi 0,25 s."""
import sys, json, math
from dataclasses import fields
from pathlib import Path
R = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(R))
from ci.simulation.optical_water import Optics
from ci.simulation.stage_om import StageOm, KIEU_SU_KIEN, DO_CAO_MIN, DO_CAO_MAX, dung_doc

VAT_CHINH_MIN, LE_MIN, CACH_MAX = 0.70, 0.03, 3.0
TRUONG_OPTICS = {f.name for f in fields(Optics)}
KHO = {'16x9': (960, 540), '9x16': (540, 960)}


def kiem(bv):
    loi, bang = [], []
    for k in ('phien_ban', 'tong_giay', 'fps', 'beats'):
        if k not in bv:
            loi.append('thiếu khoá gốc %r' % k)
    if loi:
        return loi, bang
    if bv['phien_ban'] != 'khuon-v1':
        loi.append('phien_ban phải là khuon-v1')
    fps, tong = int(bv['fps']), float(bv['tong_giay'])
    tren = float(bv.get('bo_cuc_doc', {}).get('tren', 0.375))
    if not 0.3 <= tren <= 0.5:
        loi.append('bo_cuc_doc.tren phải trong 0,30..0,50')
    moc, ids = 0.0, set()
    for b in bv['beats']:
        bid = b.get('id', '?')
        if bid in ids:
            loi.append(f'{bid}: id trùng')
        ids.add(bid)
        for k in ('bat_dau', 'ket_thuc', 'loai'):
            if k not in b:
                loi.append(f'{bid}: thiếu {k}')
        if any(k not in b for k in ('bat_dau', 'ket_thuc', 'loai')):
            continue
        a, z = float(b['bat_dau']), float(b['ket_thuc'])
        if abs(a - moc) > 0.5 / fps:
            loi.append(f'{bid}: bat_dau {a} không nối liền beat trước ({moc})')
        for v in (a, z):
            if abs(v * fps - round(v * fps)) > 1e-6:
                loi.append(f'{bid}: mốc {v} không rơi đúng khung hình {fps} fps')
        if z <= a:
            loi.append(f'{bid}: ket_thuc <= bat_dau')
            continue
        moc = z
        for c in b.get('khoang_clip', []):
            if not (len(c) == 2 and a - 1e-6 <= c[0] < c[1] <= z + 1e-6):
                loi.append(f'{bid}: khoang_clip {c} phải nằm trong [{a}, {z}]')
        for kho, ds in b.get('vung_chu', {}).items():
            if kho not in KHO:
                loi.append(f'{bid}: vung_chu khổ lạ {kho}')
            for h in ds:
                if not (len(h) == 4 and all(0 <= x <= 1 for x in h) and h[0] + h[2] <= 1 and h[1] + h[3] <= 1):
                    loi.append(f'{bid}: vung_chu {h} phải là [x,y,w,h] phân số trong khung')
        if b['loai'] == 'clip':
            continue
        if b['loai'] != 'mo_phong':
            loi.append(f'{bid}: loai phải là mo_phong hoặc clip')
            continue
        op = b.get('optics')
        if not isinstance(op, dict):
            loi.append(f'{bid}: thiếu optics')
            continue
        la = set(op) - TRUONG_OPTICS
        if la:
            loi.append(f'{bid}: optics có trường lạ {sorted(la)}')
            continue
        la = set(b.get('optics_duoi', {})) - TRUONG_OPTICS
        if la:
            loi.append(f'{bid}: optics_duoi có trường lạ {sorted(la)}')
            continue
        if b.get('khung', {}).get('16x9', 'toan') not in ('toan', 'can'):
            loi.append(f'{bid}: khung.16x9 phải là toan hoặc can')
        sk = b.get('su_kien', [])
        dur = z - a
        tg = [float(s.get('t', -1)) for s in sk]
        if tg != sorted(tg):
            loi.append(f'{bid}: su_kien phải xếp theo t tăng dần')
        for s in sk:
            t, kieu = float(s.get('t', -1)), s.get('kieu')
            if kieu not in KIEU_SU_KIEN:
                loi.append(f'{bid}: kiểu sự kiện lạ {kieu!r}')
            if not 0 <= t < dur:
                loi.append(f'{bid}: sự kiện t={t} ngoài beat (0..{dur})')
            if kieu == 'giot' and not 0 < float(s.get('manh', 1)) <= 1.5:
                loi.append(f'{bid}: giot.manh phải trong (0, 1,5]')
            if kieu == 'camera':
                if not any(k in s for k in ('do_cao', 'lia', 'lia_doc', 'goc')):
                    loi.append(f'{bid}: camera t={t} không đổi gì')
                if 'do_cao' in s and not DO_CAO_MIN <= float(s['do_cao']) <= DO_CAO_MAX:
                    loi.append(f'{bid}: camera do_cao {s["do_cao"]} ngoài {DO_CAO_MIN}..{DO_CAO_MAX}')
                for k in ('lia', 'lia_doc'):
                    if k in s and not -1 <= float(s[k]) <= 1:
                        loi.append(f'{bid}: camera {k} ngoài -1..1')
        moc_sk = [0.0] + sorted(t for t in tg if 0 <= t < dur) + [dur]
        hong = max(moc_sk[i + 1] - moc_sk[i] for i in range(len(moc_sk) - 1))
        if hong > CACH_MAX + 1e-6:
            loi.append(f'{bid}: có khoảng {hong:.2f} s không sự kiện (tối đa {CACH_MAX} s) -> sẽ đứng hình')
        if any(l.startswith(bid + ':') for l in loi):
            continue
        # đo hình học bằng chính StageOm
        o = Optics(**op)
        od = Optics(**dict(op, **b.get('optics_duoi', {})))
        W, H = KHO['16x9']
        s16 = StageOm(W, H, o, b.get('khung', {}).get('16x9', 'toan'), sk, b.get('goc_can', 90.0))
        doc = dung_doc(*KHO['9x16'], o, sk, tren, od)
        tang = [s16] + [v[2] for v in doc.views]
        ten = ['16x9', '9x16-tren', '9x16-duoi']
        xau = {n: (9.0, 9.0, 0.0) for n in ten}  # phủ min, lề min, mép vòng lệch tâm max
        t = 0.0
        while t < dur:
            for n, st in zip(ten, tang):
                p, l, m = xau[n]
                if st.khung == 'toan':
                    phu, le = st.vat_chinh(t)
                    xau[n] = (min(p, phu), min(l, le), m)
                elif st.ban_kinh_vong(t) > 0.12:
                    x, y = st.mep_vong_trong_khung(t)
                    xau[n] = (p, l, max(m, abs(x - .5), abs(y - .5)))
            t += 0.25
        for n, st in zip(ten, tang):
            p, l, m = xau[n]
            if st.khung == 'toan':
                if p < VAT_CHINH_MIN:
                    loi.append(f'{bid} {n}: vật chính chỉ {p:.1%} khung (cần >= 70 %)')
                if l < LE_MIN:
                    loi.append(f'{bid} {n}: lề {l:.1%} (cần >= 3 %)')
                bang.append(f'{bid} {n}: toan  vật chính min {p:.1%}  lề min {l:.1%}')
            else:
                if m > 0.40:
                    loi.append(f'{bid} {n}: mép vòng tiêu ra khỏi 80 % giữa khung (lệch {m:.2f})')
                bang.append(f'{bid} {n}: can   mép vòng lệch tâm max {m:.2f} (<= 0,40)')
    if abs(moc - tong) > 0.5 / max(1, fps):
        loi.append(f'beat cuối kết thúc {moc}, tong_giay {tong}')
    return loi, bang


def main():
    p = Path(sys.argv[1]) if len(sys.argv) > 1 else R / 'ci/remotion_b/ban_ve_B60.json'
    try:
        bv = json.loads(p.read_text(encoding='utf-8'))
    except Exception as e:
        print('KIEM_BAN_VE: TRUOT không đọc được', p, e)
        return 1
    loi, bang = kiem(bv)
    for d in bang:
        print('  ' + d)
    if loi:
        print('KIEM_BAN_VE: TRUOT (%d lỗi)' % len(loi))
        for l in loi:
            print('  - ' + l)
        return 1
    print('KIEM_BAN_VE: DAT (%d beat)' % len(bv['beats']))
    return 0


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.exit(main())
