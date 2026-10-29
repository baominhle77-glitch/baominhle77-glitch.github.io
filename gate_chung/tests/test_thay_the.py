from pathlib import Path

from gate_chung import thay_the as t


def _tao(p, s=b'x'):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_bytes(s)


def test_mot_ban_dat(tmp_path):
    _tao(tmp_path / 'a1' / '16x9_a1.mp4')
    _tao(tmp_path / 'a1' / '9x16_a1.mp4')
    _tao(tmp_path / 'a1' / 'media' / '16x9' / 'video' / 'render.log')
    assert t.kiem_mot_ban(tmp_path) == []


def test_mot_ban_tu_choi_ban_trung(tmp_path):
    _tao(tmp_path / 'a1' / '16x9_a1.mp4')
    _tao(tmp_path / 'a1' / '16x9_a1_cu.mp4')
    _tao(tmp_path / 'a1' / 'media' / '16x9' / 'video' / 'videos' / 'CanhScene.mp4')
    loi = t.kiem_mot_ban(tmp_path)
    assert len(loi) == 2
    assert t.kiem_mot_ban(tmp_path, ['b2']) == []


def test_phang_va_duong_cam(tmp_path):
    _tao(tmp_path / '16x9_a1.mp4')
    _tao(tmp_path / 'gemini_x.mp4')
    _tao(tmp_path / '16x9_a1_old.mp4')
    assert t.kiem_phang(tmp_path, {'16x9_a1.mp4'}, ('gemini_',)) == [f'ban thua 16x9_a1_old.mp4 trong {tmp_path}']
    assert t._cam(Path('x/a.py')) and t._cam(Path('x/a.mp4.bak')) and t._cam(Path('out/_cho_chu_tich/a.mp4'))
    assert t._cam(Path('x/16x9_a1.mp4')) is None
