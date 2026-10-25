# Song ngữ C11 (E:\Studio\00_YEU_CAU_BAT_DI_BAT_DICH.md mục C): cùng cảnh, chỉ thay lời đọc + chữ trên màn.
# STUDIO_LANG=en (mặc định, bản ĐĂNG) | vi (bản Chủ tịch DUYỆT NỘI DUNG — không bao giờ đăng).
#
# Lời đọc VI nằm ở trường `n_vi` của từng beat trong script.json. Chỗ nào cảnh bám mốc từ tiếng Anh
# (Beat.w("frame", 2)) thì đặt dấu [[frame#2]] ngay TRƯỚC âm tiết tiếng Việt mà hoạt ảnh phải bắt vào
# ([[frame]] = lần 1). Dấu bị bỏ trước khi đọc TTS. Thiếu dấu ⇒ dựng hỏng ngay (không đoán thời điểm).
#
# Chữ trên màn: module chu() gọi dich(s); bản VI tra `chu_vi.json` cạnh canh.py ({"chữ EN": "chữ VI"}).
# Thiếu khoá ⇒ hỏng (STUDIO_VI_THU=1 thì ghi khoá thiếu vào chu_vi_thieu.json để dịch, không hỏng).
# Mã nguồn trên màn: bọc nguyen("...") ⇒ không bao giờ dịch (luật: mã ASCII nguyên văn).
import json, os, re, unicodedata
from pathlib import Path

LANG = os.environ.get("STUDIO_LANG", "en").lower()
assert LANG in ("en", "vi"), LANG
VI = LANG == "vi"
GIONG_VI = "vi-VN-NamMinhNeural"  # C11: MỘT giọng VI cho mọi kênh (Chủ tịch 25/09: bản kiểm, giọng không quan trọng)
DAU_VI = "BẢN DUYỆT NỘI DUNG — KHÔNG ĐĂNG"
MOC = re.compile(r"\[\[([^\]#]+)(?:#(\d+))?\]\]")


class nguyen(str):
    """Chuỗi giữ nguyên ở mọi ngôn ngữ (mã nguồn, ký hiệu chuẩn, mã DOI)."""


def chuan(s):
    """Chuẩn hoá so khớp từ: NFC, chữ thường, chỉ giữ chữ/số (kể cả chữ có dấu tiếng Việt)."""
    s = unicodedata.normalize("NFC", s).lower()
    return "".join(c for c in s if c.isalnum() or c == "_")


def bo_moc(n_vi):
    """Lời đưa vào TTS: bỏ dấu [[...]]."""
    return re.sub(r"\s+", " ", MOC.sub("", n_vi)).strip()


def ban_do_moc(n_vi):
    """{(từ EN chuẩn hoá, lần k): (âm tiết VI chuẩn hoá, lần xuất hiện)} — lần đếm trên lời đã bỏ dấu."""
    ra, cho, dem = {}, [], {}
    pos = 0
    for m in list(MOC.finditer(n_vi)) + [None]:
        doan = n_vi[pos:m.start()] if m else n_vi[pos:]
        for tok in doan.split():
            c = chuan(tok)
            if not c:
                continue
            dem[c] = dem.get(c, 0) + 1
            for khoa in cho:
                ra[khoa] = (c, dem[c])
            cho = []
        if m:
            khoa = (chuan(m.group(1)), int(m.group(2) or 1))
            assert khoa not in ra and khoa not in cho, f"mốc trùng {m.group(0)}"
            cho.append(khoa)
            pos = m.end()
    assert not cho, f"mốc ở cuối câu, không có âm tiết theo sau: {cho}"
    return ra


def thoi_diem(W, word, k=1, n_vi=None, beat=""):
    """Thời điểm (giây) của từ `word` lần `k` trong words.json W. Bản VI: đổi qua mốc [[word#k]] của n_vi."""
    if VI:
        m = ban_do_moc(n_vi or "")
        khoa = (chuan(word), k)
        if khoa not in m:
            raise ValueError(f"{beat}: n_vi thiếu mốc [[{word}#{k}]]")
        word, k = m[khoa]
    n = 0
    for x in W:
        if chuan(x["w"]) == chuan(word):
            n += 1
            if n == k:
                return x["t"]
    raise ValueError(f"{beat}: không có từ '{word}' lần {k} trong words.json ({LANG})")


def kiem_khop(W, n_vi):
    """Sau TTS VI: chuỗi âm tiết của lời (đã bỏ dấu) phải trùng chuỗi WordBoundary. Trả về None nếu khớp."""
    a = [c for c in (chuan(t) for t in bo_moc(n_vi).split()) if c]
    b = [c for c in (chuan(x["w"]) for x in W) if c]
    for i, (x, y) in enumerate(zip(a, b)):
        if x != y:
            return f"lệch ở âm tiết {i}: lời '{x}' ≠ TTS '{y}'"
    return None if len(a) == len(b) else f"số âm tiết lời {len(a)} ≠ TTS {len(b)}"


_TD, _THIEU = {}, {}


def dich(s, thu_muc=None):
    """Chữ trên màn theo ngôn ngữ. EN: giữ nguyên. VI: tra chu_vi.json (thư mục = STUDIO_CHU_VI hoặc thu_muc)."""
    if not VI or isinstance(s, nguyen) or not str(s).strip():
        return str(s)
    p = Path(os.environ.get("STUDIO_CHU_VI") or Path(thu_muc or os.getcwd()) / "chu_vi.json")
    if p not in _TD:
        _TD[p] = json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}
    if s in _TD[p]:
        return _TD[p][s]
    if os.environ.get("STUDIO_VI_THU"):
        q = p.with_name("chu_vi_thieu.json")
        _THIEU.setdefault(q, json.loads(q.read_text(encoding="utf-8")) if q.exists() else {})[s] = ""
        q.write_text(json.dumps(_THIEU[q], ensure_ascii=False, indent=1), encoding="utf-8")
        return s
    raise KeyError(f"chu_vi.json thiếu bản dịch cho chữ trên màn: {s!r}")


def thu_am(here):
    """Thư mục audio theo ngôn ngữ: audio/ (EN) | audio_vi/ (VI)."""
    return Path(here) / ("audio_vi" if VI else "audio")


def gan_dau(scene):
    """Dấu KHÔNG ĐĂNG cố định ở mép trên, chỉ bản VI. Cổng bản sắc chỉ đo bản EN."""
    if not VI:
        return None
    from manim import Text, UP, config
    d = Text(DAU_VI, font="Segoe UI", font_size=56, color="#D62828", weight="BOLD").scale(0.25)
    d.to_edge(UP, buff=0.08).set_z_index(10 ** 4)
    d.set_opacity(0.85)
    scene.add(d)
    return d
