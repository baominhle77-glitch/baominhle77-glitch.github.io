"""Light loader for the SUA5 beat pictures (no manim): spec + label layout.

Used by canh_scene.py (render) and export_gate_plan.py (numeric_labels for G16),
so both see the same label boxes and anchors.
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
R = HERE.parents[1]
sys.path.insert(0, str(R / 'ci' / 'simulation'))
from canh_beat import CanhStage  # noqa: E402

CANH = HERE / 'canh_k1t3.json'
BAN_VE = HERE / 'ban_ve_B60.json'
THE_LOAI = R / 'the_loai' / 'khoa_hoc_vat_ly.json'
KHO = {'16x9': (960, 540), '9x16': (540, 960)}


def _doc(p):
    return json.loads(Path(p).read_text(encoding='utf-8'))


def bang_mau():
    tl = _doc(THE_LOAI)
    return dict(tl.get('canh', {}).get('bang_mau', {}))


def spec(bid, fmt):
    c = _doc(CANH)
    bv = _doc(BAN_VE)
    b = next(x for x in bv['beats'] if x['id'] == bid)
    s = dict(c['beats'][bid])
    s['T'] = float(b['ket_thuc']) - float(b['bat_dau'])
    avoid = [list(v) for v in b.get('vung_chu', {}).get(fmt, [])]
    avoid += [c.get('tranh', {}).get(bid, {}).get(fmt)] if c.get('tranh', {}).get(bid, {}).get(fmt) else []
    return s, avoid, float(bv.get('bo_cuc_doc', {}).get('tren', .4)), c.get('su_kien', {})


def stage(bid, fmt, width=None, height=None):
    s, avoid, tren, _ = spec(bid, fmt)
    W0, H0 = KHO[fmt]
    st = CanhStage(W0, H0, s, palette=bang_mau(), portrait=fmt == '9x16', top=tren, avoid=avoid)
    if not width or (width, height) == (W0, H0):
        return st
    # labels are laid out once on the 540p grid, then reused at any size
    co_dinh = {L['id']: L['bbox'] for L in st.labels}
    return CanhStage(width, height, s, palette=bang_mau(), portrait=fmt == '9x16', top=tren, avoid=avoid, nhan_co_dinh=co_dinh)


def layout(bid, fmt):
    """Numeric labels as frame fractions + fact registry entries."""
    s, avoid, tren, facts = spec(bid, fmt)
    st = stage(bid, fmt)
    out = []
    for L in st.label_layout():
        f = facts.get(L['fact']) if L.get('fact') else None
        src = next(n for n in s['nhan'] if n['id'] == L['id'])
        out.append(dict(L, spoken=list(src.get('noi', [])), fact_source=(f or {}).get('nguon'), main_kind=s['chinh']['kieu'],
                        camera=s.get('camera')))
    return out
