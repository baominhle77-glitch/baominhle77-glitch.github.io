"""KHUÔN v1 — cầu nối scene.py -> StageOm theo ban_ve_B60.json (chép nguyên văn, cấm sửa).
scene.py chỉ đổi đúng 1 dòng import: from stage_khuon import make_stage as build_stage,base_optics
Thời gian truyền vào stage là giây TRONG beat (như scene.py đang làm: offset + renderer.time)."""
import json
from pathlib import Path
from ci.simulation.optical_water import Optics
from ci.simulation.stage_om import StageOm, dung_doc

H = Path(__file__).resolve().parent
BAN_VE = H / 'ban_ve_B60.json'


def doc_ban_ve(duong=BAN_VE):
    return json.loads(Path(duong).read_text(encoding='utf-8'))


def tim_beat(bv, bid):
    for b in bv['beats']:
        if b['id'] == bid:
            return b
    raise KeyError('ban_ve không có beat %r' % bid)


def base_optics(bid, bv=None):
    return Optics(**tim_beat(bv or doc_ban_ve(), bid)['optics'])


def make_stage(bid, width, height, portrait=False, bv=None):
    bv = bv or doc_ban_ve()
    b = tim_beat(bv, bid)
    o = Optics(**b['optics'])
    sk = b.get('su_kien', [])
    if not portrait:
        return StageOm(width, height, o, b.get('khung', {}).get('16x9', 'toan'), sk, b.get('goc_can', 90.0))
    doc = bv.get('bo_cuc_doc', {})
    od = Optics(**dict(b['optics'], **b.get('optics_duoi', {})))
    return dung_doc(width, height, o, sk, doc.get('tren', 0.375), od)
