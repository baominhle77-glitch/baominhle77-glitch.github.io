# -*- coding: utf-8 -*-
"""G1.2 (phieu 37, lenh GD 17:19) tren nen G1.1 (lenh GD 15:27 + 16:05): adapter TTS 2 backend.

DIEU KIEN DUNG KHOA (GD chot 15:27 muc 6, kiem 16:05): khoa PHAI thuoc project
KHONG lien ket thanh toan. GD da kiem 25/09/2026 16:05: project duy nhat
gen-lang-client-0718793997, Free tier, chua lien ket thanh toan. Code khong tu
bao dam duoc dieu nay — GD tu kiem bac cua project trong AI Studio khi doi khoa.
CAM tao them project hoac khoa de nhan han muc (thu GD 16:05).

  - "edge"   : edge-tts nhu render.py — GIU NGUYEN backoff giua cac luot hong:
               await asyncio.sleep(min(2**(luot-1), 8)) tuc [1,2,4,8]s
               (L3; render.py LIGHT:844 / v4.4:838). Khac render, KHAI RO:
               (1) het tran KHONG raise RuntimeError ma tra nhanh
                   tts_hong_sau_tran:<tran>;
               (2) goi duoc tu TRONG coroutine: asyncio.run chay o thread rieng
                   (concurrent.futures, stdlib) — M5/K7b;
               (3) ly_do_luot chi ghi type(e).__name__, khong str(e) (L1).
  - "gemini" : gemini-3.8-flash-tts qua REST, CHI bac MIEN PHI. Het han muc Free
               -> "het_han_muc_free", KHONG BAO GIO tu chuyen sang bac co phi
               (khong doi model/endpoint, khong retry quota).

Khoa (lenh G1 nguyen van, giu): CHI doc tu bien moi truong GEMINI_API_KEY luc
chay; khong co thi doc HKCU\\Environment bang winreg. CAM in / ghi log / ghi
file / dua vao loi / chep / ghi sha GIA TRI khoa — moi noi chi ghi bool co_khoa.
Thieu bien -> nhanh "thieu_khoa_tts", khong doan.

L1 (phieu 34 K1): khoa sai dinh dang (CR/LF/khoang trang/ky tu ngoai
[A-Za-z0-9_-] hay do dai la) -> nhanh "khoa_sai_dinh_dang"; gia tri bi bo ngay
trong lay_khoa, KHONG gui request, khong in. Moi chuoi vao ly_do_luot chi la
chu co dinh + ten loai loi (type(e).__name__) — KHONG BAO GIO str(e) cua tang
gui request, khong in body HTTP. Lop chan cuoi _che(): chuoi nao chua khoa ->
thay "[DA_CHE]" truoc khi vao ket qua.

L2 (tai lieu 3.8, trich phieu 34): chi_dao KHONG ghep vao text; di truong rieng
speech_metadata.style cua part (don giong; speaker chi dung da giong — giong o
voiceConfig). Phan hoi da la WAV (RIFF o byte 0) -> ghi NGUYEN, rate doc tu
header; chi boc header khi PCM tho. Kiem sau khi ghi: RIFF o byte 0 va KHONG
RIFF o offset 44 (dau hieu boc 2 lan) -> lech thi nhanh "audio_hai_header".

H1 (thu GD 16:05): so dem request theo model, theo ngay Pacific (00:00 PT;
tu tinh DST My — khong cai goi, Windows khong co tzdata), ghi ra dia
SO_DEM_PATH, khong chua khoa. Chan TRUOC request vuot TRAN_NGAY[model] ->
"het_han_muc_ngay". Gian >= GIAN_GIAY_MODEL[model] giua 2 request (ngu phan con
thieu; tong giay ngu tra o "cho_gian_giay"). MOI lan thu lai cung tru so.
H3: usageMetadata cua request THAT dau tien (chi khi goi_rest=None) ghi vao
USAGE_DAU_TIEN (token vao/ra + byte pcm + rate — do 2 GIA THUYET: token/giay
audio va TPM co tinh dau ra khong). H5: kiem_va_ghi_so() dung chung duoc cho
model text gemini-3.8-flash (so rieng theo ten model trong cung file).

G1.2 (phieu 37; lenh GD 17:19 "gap so bat thuong thi CHAN, khong gui; KHONG
duoc dat lai ve 0"):
  - L37-1/2: so doc khong ra (tep rong, JSON hong, khong phai dict, kieu
    truong sai, khoa trung, khoa ngay khong phai ngay YYYY-MM-DD co that,
    ts_cuoi NaN/Infinity) -> "so_dem_hong"; so hay tep
    canh so khong doc/ghi/khoa duoc (bi khoa byte, PermissionError...) ->
    "so_dem_bi_khoa". Ca hai CHAN truoc request, khong sua so tren dia.
    Tep so CHUA TON TAI (lan chay dau) van hop le -> so moi.
  - L37-3: khoa ngay tuong lai (> hom nay PT) hay ts_cuoi > now o BAT KY model
    nao -> "so_dem_tuong_lai" (dau vet dong ho lech), chan; tran ngu =
    GIAN_GIAY_MODEL[model] (ts_cuoi tuong lai da bi chan nen khong ngu qua).
  - L37-4: doc-sua-ghi so giu khoa tep doc quyen (msvcrt.locking byte 0 cua
    <so>.lock) + ghi nguyen tu (<so>.tmp roi os.replace) — hai tien trinh
    khong mat luot dem, moc gui cuoi luon doc tu dia (H1e/H1h).
  - L37-5: gian tinh theo ts_cuoi MOI NHAT cua model tren MOI ngay trong so —
    khong co ngoai le qua 00:00 PT (ngay moi khong xoa dau vet gui cuoi).
  - L37-6: _ghi_usage_dau_tien chan kieu (usageMetadata thieu / sai kieu ->
    van ghi kem "ghi_chu" — NX-1), KHONG BAO GIO nem; trang thai tra ve de
    nguoi goi ghi ly_do_luot.

M1: than 200 la (candidates null, data sai kieu, parts null...) -> bat
(KeyError, IndexError, ValueError, TypeError, AttributeError) -> nhanh
"tra_ve_khong_co_audio", khong de TypeError bay ra. M2: ok=True chi khi audio
>= GEMINI_MIN_GIAY giay (pcm s16 mono = 2*rate byte/giay -> nguong byte =
int(2*rate*GEMINI_MIN_GIAY)); duoi -> "audio_qua_ngan". M3: khoa cache =
sha256(JSON sort_keys separators co dinh cua 5 truong) — khong noi '|', '|'
trong noi dung khong tron truong. M4: HTTP 400/403 ->
"khoa_hay_quyen_bi_tu_choi:<status>", KHONG retry. M6: 429/RESOURCE_EXHAUSTED
giu "het_han_muc_free" (E-G1-1 15:01). Van ban > GEMINI_MAX_KY_TU ky tu ->
"van_ban_qua_dai:<n>", khong gui mu (uoc "8000 ky tu < 8.192 token vao" la
GIA THUYET ti le ~2-4 ky tu/token; H3 do that).

Ket qua moi lan goi: dict nhu G1 + them "cho_gian_giay" (giay da ngu vi H1):
  {"ok", "backend", "duong", "words" (chi edge), "cache_hit", "co_khoa",
   "nhanh", "ly_do_luot", "cho_gian_giay"}
Cac nhanh dung: thieu_khoa_tts | khoa_sai_dinh_dang | het_han_muc_free
  | het_han_muc_ngay | khoa_hay_quyen_bi_tu_choi:<status> | van_ban_qua_dai:<n>
  | tra_ve_khong_co_audio | audio_qua_ngan | audio_hai_header
  | tts_hong_sau_tran:<so_luot> | backend_khong_biet:<ten>
  | so_dem_hong | so_dem_bi_khoa | so_dem_tuong_lai   (G1.2, phieu 37)
Chuoi trang thai usage (chi vao ly_do_luot, khong phai nhanh): usage_thieu |
  usage_kieu_la:<ten_kieu> | usage_khong_ghi:<ten_loi>
"""
import base64, hashlib, io, json, math, os, re, struct, sys, time

CACHE_MAC_DINH = r"E:\Studio\out\_tts_cache"
SO_DEM_PATH = r"E:\Studio\out\_tts_cache\so_dem_request.json"
USAGE_DAU_TIEN = r"E:\Studio\out\_tts_cache\usage_metadata_dau_tien.json"

GEMINI_MODEL = "gemini-3.8-flash-tts"   # lenh GD 14:15; CHI bac Free cua model nay
GEMINI_URL = ("https://generativelanguage.googleapis.com/v1beta/models/"
              + GEMINI_MODEL + ":generateContent")
TRIES_GEMINI = 3
TRIES_EDGE = 5            # nhu render.py: NoAudioReceived ngau nhien (do 22/09/2026)
EDGE_MIN_BYTES = 2000     # nhu render.py
GEMINI_MAX_KY_TU = 8000   # M6: chan truoc khi gui (gia thuyet ti le ky tu/token, xem docstring)
GEMINI_MIN_GIAY = 0.2     # M2: audio ngan hon 0.2s coi la hong (nguong byte = 2*rate*0.2)
# H1/H5 (AI Studio doc 16:04): tts 3 RPM / 10 RPD; text flash 5 RPM / 20 RPD
TRAN_NGAY = {"gemini-3.8-flash-tts": 10, "gemini-3.8-flash": 20}
GIAN_GIAY_MODEL = {"gemini-3.8-flash-tts": 20.0, "gemini-3.8-flash": 12.0}

# \A..\Z + fullmatch: '$' cua re.match khop ca truoc '\n' cuoi chuoi — khoa+LF
# se lot qua '^...$' (do duoc bang ca A1/A4 khi tu thu G1.1)
KHOA_DINH_DANG_RE = re.compile(r"\A[A-Za-z0-9_\-]{20,128}\Z")


# ---------------------------------------------------------------- khoa (L1)
def lay_khoa(env=None, doc_reg=None):
    """Tra (co_khoa: bool, khoa: str|None, nhanh_loi: str|None).
    Khoa sai dinh dang -> (True, None, "khoa_sai_dinh_dang"): gia tri bi bo ngay
    tai day, khong tra ra ngoai, khong in. Nguoi goi ben ngoai chi dung [0]."""
    env = os.environ if env is None else env
    k = env.get("GEMINI_API_KEY")
    if not k:
        if doc_reg is None:
            def doc_reg():
                import winreg
                with winreg.OpenKey(winreg.HKEY_CURRENT_USER, "Environment") as h:
                    return winreg.QueryValueEx(h, "GEMINI_API_KEY")[0]
        try:
            v = doc_reg()
            k = str(v) if v else None
        except OSError:
            k = None
    if not k:
        return False, None, None
    if not KHOA_DINH_DANG_RE.fullmatch(k):
        return True, None, "khoa_sai_dinh_dang"
    return True, k, None


def _che(s, khoa):
    """L1 lop chan cuoi: chuoi chua gia tri khoa -> thay [DA_CHE]."""
    if khoa and khoa in s:
        return s.replace(khoa, "[DA_CHE]")
    return s


# ---------------------------------------------------------------- cache (M3)
def khoa_cache(backend, model, giong, chi_dao, van_ban):
    # JSON thu tu co dinh — '|' trong noi dung khong the tron truong (M3/K5)
    j = json.dumps({"backend": backend, "model": model, "giong": giong,
                    "chi_dao": chi_dao or "", "van_ban": van_ban},
                   ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(j.encode("utf-8")).hexdigest()[:16]


def _duong_cache(cache_dir, kc, duoi):
    if not os.path.isdir(cache_dir):
        os.makedirs(cache_dir)
    return os.path.join(cache_dir, "%s.%s" % (kc, duoi))


# ---------------------------------------------------------------- so dem (H1/H5)
def _ngay_pacific(ts):
    """Ngay YYYY-MM-DD theo gio Pacific (reset 00:00 PT). Tu tinh DST My
    (02:00 dia phuong: CN thu 2 thang 3 -> CN dau thang 11), khong can tzdata."""
    import datetime as dt
    t = dt.datetime.fromtimestamp(ts, dt.timezone.utc)

    def cn_thu(n, thang):
        d = dt.datetime(t.year, thang, 1, tzinfo=dt.timezone.utc)
        d += dt.timedelta(days=(6 - d.weekday()) % 7)
        return d + dt.timedelta(days=7 * (n - 1))

    bat_dau = cn_thu(2, 3).replace(hour=10)   # 02:00 PST = 10:00 UTC
    het = cn_thu(1, 11).replace(hour=9)       # 02:00 PDT = 09:00 UTC
    lech = 7 if bat_dau <= t < het else 8     # PDT=UTC-7, PST=UTC-8
    return (t - dt.timedelta(hours=lech)).date().isoformat()


# [0-9] chu khong \d: \d cua re voi str khop ca chu so Unicode (vd U+0662)
NGAY_SO_RE = re.compile(r"\A[0-9]{4}-[0-9]{2}-[0-9]{2}\Z")


def _kiem_so(so):
    """G1.2 L37-1/2: kieu du lieu trong so phai dung het; sai o BAT KY dau ->
    "so_dem_hong" (khong sua, khong dat lai). Tra None khi so lanh.
    Ngay phai la ngay CO THAT (khong 2026-00-00); ts_cuoi phai huu han
    (json nhan NaN/Infinity: NaN lam min(cho, gian) ra NaN -> gui khong gian)."""
    import datetime as dt
    if not isinstance(so, dict):
        return "so_dem_hong"
    for model, m in so.items():
        if not isinstance(model, str) or not isinstance(m, dict):
            return "so_dem_hong"
        for ngay, rec in m.items():
            if not isinstance(ngay, str) or not NGAY_SO_RE.fullmatch(ngay):
                return "so_dem_hong"
            try:
                dt.date.fromisoformat(ngay)
            except ValueError:
                return "so_dem_hong"
            if not isinstance(rec, dict):
                return "so_dem_hong"
            sr, tc = rec.get("so_request"), rec.get("ts_cuoi")
            if not isinstance(sr, int) or isinstance(sr, bool) or sr < 0:
                return "so_dem_hong"
            if (not isinstance(tc, (int, float)) or isinstance(tc, bool)
                    or not math.isfinite(tc) or tc < 0):
                return "so_dem_hong"
    return None


def _khong_trung_khoa(cap):
    """json.load mac dinh giu ban ghi SAU khi khoa trung — so 10 co the thanh 0.
    Khoa trung o bat ky tang nao -> ValueError -> so_dem_hong."""
    d = {}
    for k, v in cap:
        if k in d:
            raise ValueError("khoa trung")
        d[k] = v
    return d


def _doc_so(path):
    """Tra (so: dict|None, nhanh_loi: str|None). G1.2 (phieu 37 L37-1): tep
    CHUA TON TAI -> ({}, None) — lan chay dau, hop le. Moi truong hop khac doc
    khong ra deu CHAN bang nhanh rieng, KHONG BAO GIO tra {} de dat lai so."""
    try:
        with io.open(path, encoding="utf-8") as f:
            d = json.load(f, object_pairs_hook=_khong_trung_khoa)
    except FileNotFoundError:
        return {}, None
    except ValueError:                 # JSON hong / tep rong / cat cut / khong phai UTF-8 / khoa trung
        return None, "so_dem_hong"
    except OSError:                    # bi khoa byte / khong co quyen doc (L37-2)
        return None, "so_dem_bi_khoa"
    loi = _kiem_so(d)
    return (None, loi) if loi else (d, None)


def _co_tuong_lai(so, ngay_nay, now_ts):
    """L37-3: so mang dau vet dong ho lech (khoa ngay > hom nay PT hoac
    ts_cuoi > now, o BAT KY model nao) -> khong tin, chan het."""
    for m in so.values():
        for ngay, rec in m.items():
            if ngay > ngay_nay or rec["ts_cuoi"] > now_ts:
                return True
    return False


def _giu_khoa_tep(path):
    """L37-4: khoa doc quyen quanh doc-sua-ghi so, bang byte 0 cua <so>.lock.
    msvcrt.locking LK_LOCK thu ~10 lan cach 1 s roi OSError -> nguoi goi tra
    so_dem_bi_khoa (chan, khong gui — an toan phia chan). Ngoai Windows
    (khong co msvcrt) chi con ghi nguyen tu — khai o NOP muc 6."""
    fd = os.open(path + ".lock", os.O_CREAT | os.O_RDWR)
    try:
        import msvcrt
    except ImportError:
        return fd
    try:
        msvcrt.locking(fd, msvcrt.LK_LOCK, 1)
    except OSError:
        os.close(fd)
        raise
    return fd


def _tha_khoa_tep(fd):
    try:
        import msvcrt
        try:
            msvcrt.locking(fd, msvcrt.LK_UNLCK, 1)
        except OSError:
            pass
    except ImportError:
        pass
    os.close(fd)


def _ghi_so_nguyen_tu(so, path):
    """L37-4: ghi <so>.tmp roi os.replace — khong bao gio de so viet do."""
    tmp = path + ".tmp"
    with io.open(tmp, "w", encoding="utf-8", newline="\n") as f:
        json.dump(so, f, ensure_ascii=False, indent=1)
        f.flush()
        os.fsync(f.fileno())
    try:
        os.replace(tmp, path)
    except OSError:
        try:
            os.remove(tmp)
        except OSError:
            pass
        raise


def kiem_va_ghi_so(model, path=SO_DEM_PATH, now=None, sleep=None):
    """H1: tra (duoc_gui: bool, nhanh_loi: str|None, da_cho_giay: float).
    Ghi so TRUOC khi gui — moi lan thu lai cung tru. Chan truoc request vuot
    TRAN_NGAY[model]/ngay Pacific; gian >= GIAN_GIAY_MODEL[model] giua 2 request.
    G1.2 (phieu 37): so bat thuong -> CHAN voi nhanh rieng, KHONG dat lai ve 0;
    doc-sua-ghi giu khoa tep + ghi nguyen tu; gian tinh theo ts_cuoi moi nhat
    cua model KE CA ngay truoc (L37-5); tran ngu = gian (L37-3).
    So chi chua so dem + moc thoi gian, khong bao gio chua khoa."""
    now_f = time.time if now is None else now
    sleep_f = time.sleep if sleep is None else sleep
    now_f()   # cham dong ho TRUOC khi giu khoa tep: hai luong cung vao deu qua
              # duoc moc nay roi moi xep hang — khong luong nao giu khoa trong
              # luc con doi luong kia cham dong ho (tranh ket lan nhau)
    d = os.path.dirname(path)
    try:
        if d and not os.path.isdir(d):
            os.makedirs(d, exist_ok=True)
        fd = _giu_khoa_tep(path)
    except OSError:
        return False, "so_dem_bi_khoa", 0.0
    try:
        so, nhanh = _doc_so(path)
        if nhanh:
            return False, nhanh, 0.0
        ts = now_f()                  # sau khi CO khoa: so tren dia la moi nhat (H1e)
        ngay = _ngay_pacific(ts)
        if _co_tuong_lai(so, ngay, ts):
            return False, "so_dem_tuong_lai", 0.0
        m = so.setdefault(model, {})
        rec = m.setdefault(ngay, {"so_request": 0, "ts_cuoi": 0.0})
        if rec["so_request"] >= TRAN_NGAY.get(model, 10):
            return False, "het_han_muc_ngay", 0.0
        gian = GIAN_GIAY_MODEL.get(model, 20.0)
        ts_cuoi = max(r["ts_cuoi"] for r in m.values())   # L37-5: ke ca ngay truoc
        da_cho = 0.0
        if ts_cuoi > 0:
            cho = min(gian - (ts - ts_cuoi), gian)        # tran ngu; ts_cuoi > ts da bi chan o tren
            if cho > 0:
                sleep_f(cho)
                da_cho = cho
        rec["so_request"] += 1
        rec["ts_cuoi"] = now_f()
        try:
            _ghi_so_nguyen_tu(so, path)
        except OSError:
            return False, "so_dem_bi_khoa", 0.0           # khong ghi duoc so -> KHONG gui
        return True, None, da_cho
    finally:
        _tha_khoa_tep(fd)


def _ghi_usage_dau_tien(d, n_pcm, rate, van_ban):
    """H3: chi ghi 1 lan (file chua ton tai), chi so dem/token — khong khoa,
    khong van ban (chi do dai). G1.2 L37-6: duoc goi TRUOC kq.update(ok=True)
    nen KHONG BAO GIO duoc nem — usageMetadata thieu / sai kieu (str, list...)
    van ghi duoc file kem "ghi_chu" (NX-1: phan biet thieu / kieu la / co so).
    Tra None khi em, hay chuoi trang thai co dinh de nguoi goi ghi ly_do_luot."""
    try:
        if os.path.exists(USAGE_DAU_TIEN):
            return None
        if not isinstance(d, dict):
            um, ghi_chu = {}, "usage_kieu_la:%s" % type(d).__name__
        else:
            um = d.get("usageMetadata")
            if um is None:
                um, ghi_chu = {}, "usage_thieu"
            elif not isinstance(um, dict):
                um, ghi_chu = {}, "usage_kieu_la:%s" % type(um).__name__
            else:
                ghi_chu = None

        def _so(x):                    # chi nhan so that; chuoi/bool/list -> None
            return x if isinstance(x, (int, float)) and not isinstance(x, bool) else None

        ghi = {"model": GEMINI_MODEL,
               "promptTokenCount": _so(um.get("promptTokenCount")),
               "candidatesTokenCount": _so(um.get("candidatesTokenCount")),
               "totalTokenCount": _so(um.get("totalTokenCount")),
               "pcm_bytes": n_pcm, "rate_hz": rate,
               "giay_audio": round(n_pcm / (2.0 * rate), 3) if rate else None,
               "so_ky_tu_van_ban": len(van_ban),
               "ghi_chu": ghi_chu,
               "epoch_ghi": time.time()}
        with io.open(USAGE_DAU_TIEN, "w", encoding="utf-8", newline="\n") as f:
            json.dump(ghi, f, ensure_ascii=False, indent=1)
        return ghi_chu
    except Exception as e:             # luoi chan cuoi: viec phu, khong duoc lam hong kq da co audio
        return "usage_khong_ghi:%s" % type(e).__name__


# ---------------------------------------------------------------- gemini (REST, bac Free)
def _goi_rest_urllib(url, payload, headers):
    """Tra (status:int, body:bytes). Loi HTTP tra status that + body; loi mang nem tiep."""
    import urllib.request, urllib.error
    req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()


def _pcm_sang_wav(pcm, path, rate=24000):
    # header RIFF toi thieu, mono s16le — CHI dung cho PCM tho (L2b)
    with open(path, "wb") as f:
        f.write(b"RIFF" + struct.pack("<I", 36 + len(pcm)) + b"WAVEfmt ")
        f.write(struct.pack("<IHHIIHH", 16, 1, 1, rate, rate * 2, 2, 16))
        f.write(b"data" + struct.pack("<I", len(pcm)) + pcm)


def _het_han_muc(status, body):
    # 429 / RESOURCE_EXHAUSTED = het han muc bac Free -> dung ngay, khong retry,
    # khong doi sang bac co phi (lenh GD; M6 giu E-G1-1: chua co bang chung
    # phan biet theo phut / theo ngay thi giu het_han_muc_free).
    return status == 429 or b"RESOURCE_EXHAUSTED" in body


def tong_hop_gemini(van_ban, giong, chi_dao=None, cache_dir=CACHE_MAC_DINH,
                    goi_rest=None, env=None, doc_reg=None,
                    so_dem_path=SO_DEM_PATH, now=None, sleep=None):
    kq = {"ok": False, "backend": "gemini", "duong": None, "words": None,
          "cache_hit": False, "co_khoa": None, "nhanh": None, "ly_do_luot": [],
          "cho_gian_giay": 0.0}
    kc = khoa_cache("gemini", GEMINI_MODEL, giong, chi_dao, van_ban)
    out = _duong_cache(cache_dir, kc, "wav")
    if os.path.exists(out) and os.path.getsize(out) > 44:
        kq.update(ok=True, duong=out, cache_hit=True)
        return kq

    if len(van_ban) > GEMINI_MAX_KY_TU:                      # M6: khong gui mu
        kq["nhanh"] = "van_ban_qua_dai:%d" % len(van_ban)
        return kq

    co_khoa, khoa, loi_khoa = lay_khoa(env=env, doc_reg=doc_reg)
    kq["co_khoa"] = co_khoa
    if loi_khoa:                                             # L1: khoa_sai_dinh_dang
        kq["nhanh"] = loi_khoa
        return kq
    if not co_khoa:
        kq["nhanh"] = "thieu_khoa_tts"
        return kq

    def them(s):                                             # L1 lop chan cuoi
        kq["ly_do_luot"].append(_che(s, khoa))

    part = {"text": van_ban}                                 # L2a: khong ghep chi_dao
    if chi_dao:
        part["speech_metadata"] = {"style": chi_dao}         # truong rieng (phieu 34 K3)
    payload = json.dumps({
        "contents": [{"parts": [part]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": giong}}},
        },
    }).encode("utf-8")
    headers = {"Content-Type": "application/json", "x-goog-api-key": khoa}
    # khong del khoa: lop chan cuoi _che can gia tri de so; van cam moi duong ghi ra

    goi = goi_rest or _goi_rest_urllib
    for luot in range(1, TRIES_GEMINI + 1):
        duoc, nhanh_so, da_cho = kiem_va_ghi_so(GEMINI_MODEL, path=so_dem_path,
                                                now=now, sleep=sleep)   # H1: truoc MOI luot
        kq["cho_gian_giay"] += da_cho
        if not duoc:
            them("luot %d: chan boi so dem ngay Pacific (H1)" % luot)
            kq["nhanh"] = nhanh_so
            return kq
        try:
            status, body = goi(GEMINI_URL, payload, headers)
        except Exception as e:
            # L1: CHI ten loai loi, khong str(e) — header hong (vd putheader) se
            # khong bao gio in gia tri; du co, _che van thay [DA_CHE]
            them("luot %d: loi_gui_request:%s" % (luot, type(e).__name__))
            continue
        if _het_han_muc(status, body):
            them("luot %d: HTTP %d het han muc bac Free" % (luot, status))
            kq["nhanh"] = "het_han_muc_free"
            return kq
        if status in (400, 403):                             # M4: khong retry
            them("luot %d: HTTP %d khoa hay quyen bi tu choi" % (luot, status))
            kq["nhanh"] = "khoa_hay_quyen_bi_tu_choi:%d" % status
            return kq
        if status != 200:
            them("luot %d: HTTP %d" % (luot, status))        # L1: khong in body
            continue
        try:
            d = json.loads(body)
            p = d["candidates"][0]["content"]["parts"][0]["inlineData"]
            raw = base64.b64decode(p["data"], validate=True)
            mime = p.get("mimeType") or ""
        except (KeyError, IndexError, ValueError, TypeError, AttributeError) as e:
            them("luot %d: 200 nhung khong co audio (%s)" % (luot, type(e).__name__))
            kq["nhanh"] = "tra_ve_khong_co_audio"            # M1: khong TypeError bay ra
            return kq
        if raw[:4] == b"RIFF":                               # L2b: WAV san — ghi NGUYEN
            rate = struct.unpack("<I", raw[24:28])[0] if len(raw) >= 28 else 0
            with open(out, "wb") as f:
                f.write(raw)
            n_pcm = max(len(raw) - 44, 0)
        else:                                                # PCM tho — boc 1 lan
            try:
                rate = int(mime.split("rate=")[1].split(";")[0]) if "rate=" in mime else 24000
            except ValueError:
                rate = 24000
            _pcm_sang_wav(raw, out, rate)
            n_pcm = len(raw)
        if not rate:
            rate = 24000
        nguong = int(2 * rate * GEMINI_MIN_GIAY)             # M2: nguong khai so
        if n_pcm < nguong:
            os.remove(out)
            them("luot %d: audio %d byte pcm < nguong %d (%.1f giay o %d Hz)"
                 % (luot, n_pcm, nguong, GEMINI_MIN_GIAY, rate))
            kq["nhanh"] = "audio_qua_ngan"
            return kq
        with open(out, "rb") as f:                           # L2 kiem: dung 1 RIFF o byte 0
            dau = f.read(48)
        if dau[:4] != b"RIFF" or dau[44:48] == b"RIFF":
            os.remove(out)
            them("luot %d: header WAV sai (2 RIFF hoac thieu RIFF dau)" % luot)
            kq["nhanh"] = "audio_hai_header"
            return kq
        if goi_rest is None:
            tt_usage = _ghi_usage_dau_tien(d, n_pcm, rate, van_ban)  # H3; L37-6: khong bao gio nem
            if tt_usage:
                them("luot %d: %s" % (luot, tt_usage))
        kq.update(ok=True, duong=out)
        them("luot %d: OK %d byte pcm, %d Hz" % (luot, n_pcm, rate))
        return kq
    kq["nhanh"] = "tts_hong_sau_tran:%d" % TRIES_GEMINI
    return kq


# ---------------------------------------------------------------- edge (ban cu + L3)
def _chay_asyncio_an_toan(coro):
    """M5/K7b: dang o TRONG event loop -> asyncio.run chay o thread rieng
    (concurrent.futures, stdlib); ngoai loop -> asyncio.run binh thuong."""
    import asyncio
    try:
        asyncio.get_running_loop()
    except RuntimeError:
        return asyncio.run(coro)
    import concurrent.futures
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as ex:
        return ex.submit(asyncio.run, coro).result()


def tong_hop_edge(van_ban, giong, rate="+0%", cache_dir=CACHE_MAC_DINH):
    """Nhu render.py: WordBoundary -> words.json, retry co tran, nguong byte,
    backoff [1,2,4,8]s giua cac luot hong (L3). Khac render da khai o docstring
    dau file: tra nhanh thay vi raise; chay duoc trong coroutine; khong str(e)."""
    import asyncio
    kq = {"ok": False, "backend": "edge", "duong": None, "words": None,
          "cache_hit": False, "co_khoa": None, "nhanh": None, "ly_do_luot": [],
          "cho_gian_giay": 0.0}
    kc = khoa_cache("edge", "edge-tts", giong, rate, van_ban)
    out = _duong_cache(cache_dir, kc, "mp3")
    wj = _duong_cache(cache_dir, kc, "words.json")
    if os.path.exists(out) and os.path.getsize(out) > EDGE_MIN_BYTES and os.path.exists(wj):
        kq.update(ok=True, duong=out, words=wj, cache_hit=True)
        return kq

    import edge_tts

    async def _mot():
        words = []
        with open(out, "wb") as f:
            async for ch in edge_tts.Communicate(van_ban, giong, rate=rate,
                                                 boundary="WordBoundary").stream():
                if ch["type"] == "audio":
                    f.write(ch["data"])
                elif ch["type"] == "WordBoundary":
                    words.append({"t0": ch["offset"] / 1e7,
                                  "t1": (ch["offset"] + ch["duration"]) / 1e7,
                                  "w": ch["text"]})
        return words

    async def _chay():
        for luot in range(1, TRIES_EDGE + 1):
            if os.path.exists(out):
                os.remove(out)  # khong bao gio doc nham ban do dang
            try:
                words = await _mot()
            except Exception as e:
                kq["ly_do_luot"].append("luot %d: %s" % (luot, type(e).__name__))
                if luot < TRIES_EDGE:
                    await asyncio.sleep(min(2 ** (luot - 1), 8))  # L3 = render.py:844
                continue
            n = os.path.getsize(out) if os.path.exists(out) else 0
            if n > EDGE_MIN_BYTES and words:
                with io.open(wj, "w", encoding="utf-8", newline="\n") as f:
                    json.dump(words, f, ensure_ascii=False)
                kq.update(ok=True, duong=out, words=wj)
                kq["ly_do_luot"].append("luot %d: OK %d byte, %d tu" % (luot, n, len(words)))
                return
            kq["ly_do_luot"].append("luot %d: file %d byte (nguong %d), %d moc tu"
                                    % (luot, n, EDGE_MIN_BYTES, len(words)))
            if luot < TRIES_EDGE:
                await asyncio.sleep(min(2 ** (luot - 1), 8))      # L3 = render.py:844
        kq["nhanh"] = "tts_hong_sau_tran:%d" % TRIES_EDGE

    _chay_asyncio_an_toan(_chay())
    return kq


# ---------------------------------------------------------------- cong chung
def tong_hop(van_ban, giong, backend="edge", chi_dao=None, rate="+0%",
             cache_dir=CACHE_MAC_DINH, goi_rest=None, env=None, doc_reg=None,
             so_dem_path=SO_DEM_PATH, now=None, sleep=None):
    if backend == "edge":
        return tong_hop_edge(van_ban, giong, rate=rate, cache_dir=cache_dir)
    if backend == "gemini":
        return tong_hop_gemini(van_ban, giong, chi_dao=chi_dao, cache_dir=cache_dir,
                               goi_rest=goi_rest, env=env, doc_reg=doc_reg,
                               so_dem_path=so_dem_path, now=now, sleep=sleep)
    return {"ok": False, "backend": backend, "duong": None, "words": None,
            "cache_hit": False, "co_khoa": None,
            "nhanh": "backend_khong_biet:%s" % backend, "ly_do_luot": [],
            "cho_gian_giay": 0.0}


if __name__ == "__main__":
    if "--kiem-khoa" in sys.argv:
        # CHI in bool, khong bao gio in gia tri
        print("co_khoa=%s" % lay_khoa()[0])
        sys.exit(0)
    print(__doc__.strip().splitlines()[0])
