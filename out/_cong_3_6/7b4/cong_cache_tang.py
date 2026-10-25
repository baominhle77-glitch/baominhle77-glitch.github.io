"""Cong 3.6 v3.7 co cache theo tang (lenh GD 20261023-2240 muc 3b, SQ-6). KHONG sua cong v3.7.

Vo boc nay nap nguyen cong_3_6_7b4_v3_7.py (sha256 ghim CONG_SHA, khac thi tu choi) va chay DUNG trinh tu main() cua no.
Khac duy nhat: tang video = trich khung + OCR (tang 7 doc), frame_dhash (tang 4/6), tang 9 (neo PiP), tang 9b (chu duoi PiP)
duoc luu vao cache theo KHOA; lan sau KHOA trung thi dung lai, chi chay tang chu/goi: 1-6 (so kho), 7, 7b, 8.

KHOA = sha256 cua: sha cong v3.7, sha vo nay, sha256 video + khung + thoi luong, step, accent, PIP_SPEC + PIP_CROP (chi phan
cong doc tu pip_spec.json - ngoai le cua HO SO khong lam lech khoa), sha ocr_win.ps1 + ocr_win_tu.ps1, ban tran (duong +
sha256 + nguon), phieu ky KD (sha256). Mot thanh phan doi -> chay day du, ghi cache moi.

Bao cao giong het v3.7 + khoa "cache_tang" (trang thai dung/ghi, khoa, thanh phan, bao cao nguon cua cache, sha tep cache).
--khong-cache: chay day du, ghi de cache (dung khi KD doi chieu).
"""
import argparse, hashlib, importlib.util, json, os, re, sys, time

CONG_P = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cong_3_6_7b4_v3_7.py")
CONG_SHA = "58f363dc953af28a159802ffe549c4253a7b83965f165b25e603b660a406c28a"
TANG_CACHE = ["9_neo_danh_tinh_pip", "9b_chu_duoi_pip"]


def nap_cong():
    h = hashlib.sha256(open(CONG_P, "rb").read()).hexdigest()
    if h != CONG_SHA:
        raise SystemExit("CONG_SHA_KHAC %s (vo cache chi chay tren v3.7 %s)" % (h[:8], CONG_SHA[:8]))
    spec = importlib.util.spec_from_file_location("cong_v3_7", CONG_P)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def ghi_nguyen_tu(p, s):
    t = p + ".tam"
    with open(t, "w", encoding="utf-8", newline="\n") as f:
        f.write(s)
    os.replace(t, p)


def main():
    m = nap_cong()
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--bundle", required=True)
    ap.add_argument("--video", required=True)
    ap.add_argument("--work", required=True)
    ap.add_argument("--accent", required=True)
    ap.add_argument("--label", required=True)
    ap.add_argument("--step", type=float, default=3.0)
    ap.add_argument("--out-dir", default=m.OUT_DEFAULT)
    ap.add_argument("--corpus", nargs="*", default=m.CORPUS_DEFAULT)
    ap.add_argument("--n-recent", type=int, default=30)
    ap.add_argument("--offline", action="store_true")
    ap.add_argument("--ass", default=None)
    ap.add_argument("--render", default=None)
    ap.add_argument("--canh", default=None)
    ap.add_argument("--tran", default=None)
    ap.add_argument("--ky-kd", default=None)
    ap.add_argument("--cache-dir", default=None, help="mac dinh <out-dir>/cache_tang")
    ap.add_argument("--khong-cache", action="store_true", help="chay day du, ghi de cache")
    a = ap.parse_args()
    accent = tuple(int(x) for x in a.accent.split(","))
    ts = time.strftime("%Y-%m-%dT%H:%M:%S")
    t_bat_dau = time.time()
    gio = {}

    sp, desc, titles = m.load_bundle(a.bundle)
    w, h, dur = m.probe(a.video)
    vsha = m.sha256(a.video)
    sp_p = os.path.join(a.bundle, "script.json")
    bind = {"video": os.path.abspath(a.video), "video_sha256": vsha, "script_sha256": m.sha256(sp_p),
            "video_mtime": time.strftime("%Y-%m-%dT%H:%M:%S", time.localtime(os.path.getmtime(a.video))),
            "script_mtime": time.strftime("%Y-%m-%dT%H:%M:%S", time.localtime(os.path.getmtime(sp_p))),
            "khung": [w, h], "thoi_luong_s": round(dur, 2)}
    warn = []
    if os.path.getmtime(sp_p) > os.path.getmtime(a.video):
        warn.append("script.json_MOI_HON_video: video khong duoc dung tu script nay -> khai bao trong script khong chung minh gi")

    # ---- khoa tang video
    tran, tran_nguon = (a.tran, "--tran") if a.tran else m.tim_ban_tran(a.video)
    tran_sha = m.sha256(tran) if tran and os.path.isfile(tran) else None
    ky_sha = m.sha256(a.ky_kd) if a.ky_kd and os.path.isfile(a.ky_kd) else None
    wsha = hashlib.sha256(open(os.path.abspath(__file__), "rb").read()).hexdigest()
    ocr_ps = [os.path.join(m.HERE, "ocr_win.ps1"), os.path.join(m.HERE34, "ocr_win_tu.ps1")]
    tp = {"cong_sha256": CONG_SHA, "vo_cache_sha256": wsha, "video_sha256": vsha, "khung": [w, h],
          "thoi_luong_s": repr(dur), "step": repr(a.step), "accent": list(accent),
          "pip_spec": sorted([list(k), list(v)] for k, v in m.PIP_SPEC.items()), "pip_crop": m.PIP_CROP,
          "ocr_ps_sha256": [m.sha256(p) if os.path.isfile(p) else None for p in ocr_ps],
          "ban_tran": tran and os.path.abspath(tran), "ban_tran_nguon": tran_nguon, "ban_tran_sha256": tran_sha,
          "ky_kd": a.ky_kd and os.path.abspath(a.ky_kd), "ky_kd_sha256": ky_sha}
    khoa = hashlib.sha256(json.dumps(tp, sort_keys=True, ensure_ascii=True).encode()).hexdigest()
    cdir = a.cache_dir or os.path.join(a.out_dir, "cache_tang")
    cp = os.path.join(cdir, "%s__%s.json" % (vsha[:8], khoa[:16]))
    ca = None
    if not a.khong_cache and os.path.isfile(cp):
        try:
            c = json.load(open(cp, encoding="utf-8"))
            if c.get("khoa") == khoa and c.get("thanh_phan") == json.loads(json.dumps(tp)):
                ca = c
            else:
                warn.append("cache_tang_khong_khop_khoa: chay day du")
        except Exception as e:
            warn.append("cache_tang_hong(%s): chay day du" % type(e).__name__)

    t0 = time.time()
    if ca:
        os.makedirs(a.work, exist_ok=True)
        frames = [(t, os.path.join(a.work, b)) for t, b in ca["frames"]]
        ocr_res = ca["ocr"]
        fh = [int(x, 16) for x in ca["frame_dhash"]]
    else:
        frames = m.extract(a.video, a.work, a.step, w, h)
        ocr_res = m.ocr(a.work)
        fh = []
        for _, p in frames:
            im = m.Image.open(p)
            if float(m.np.asarray(im.convert("L"), dtype=m.np.float32).std()) >= m.T4_MIN_STD:
                fh.append(m.dhash(im))
    gio["khung_ocr"] = round(time.time() - t0, 1)

    t0 = time.time()
    feat = m.features(sp, titles, dur, os.path.join(a.bundle, "thumbnail.png"))
    if feat["so_beat_khong_scene"]:
        warn.append("script_khong_co_scene_o_%d/%d_beat: tang 3/5 so sanh cau truc theo nhan rong, tang 1 khong co doan section"
                    % (feat["so_beat_khong_scene"], feat["n_beats"]))
    if feat["so_beat_src_chuoi"]:
        warn.append("src_la_chuoi_o_%d/%d_beat: ca chuoi duoc coi la code (khong cite, khong in_figure)"
                    % (feat["so_beat_src_chuoi"], feat["n_beats"]))
    corpus, broken = m.load_corpus(a.corpus, a.n_recent, vsha)
    tiers = m.corpus_tiers(feat, corpus, fh)
    tiers["7_neo_nguon_so_cap"] = m.tier7(sp, desc, frames, ocr_res, a.offline)
    tiers["7b_doi_ass_cmap"] = m.tier7b(sp, a.ass or os.path.join(
        os.path.dirname(os.path.abspath(a.video)), "_build", "chrome.ass"),
        a.render or os.path.join(a.bundle, "render.py"),
        None if a.ass else a.canh, a.video)
    if a.canh and a.ass:
        tiers["7b_doi_ass_cmap"]["canh"] = {"duong": os.path.abspath(a.canh),
                                            "bo_qua": "co --ass: doi chieu chrome.ass nhu cu"}
    tiers["8_caption_moi_tuong_tac"] = m.tier8([("titles.json", t) for t in titles] +
                                               [("script.meta.title", sp.get("meta", {}).get("title", "")),
                                                ("description.md", desc)])
    gio["tang_chu"] = round(time.time() - t0, 1)

    t0 = time.time()
    if ca:
        for k in TANG_CACHE:
            tiers[k] = ca["tang"][k]
    else:
        tiers["9_neo_danh_tinh_pip"] = m.tier9(a.work, frames, w, h, accent)
        tiers["9b_chu_duoi_pip"] = m.tier9b(a.video, tran, tran_nguon, a.work, w, h, dur, ky_kd=a.ky_kd)
    gio["tang_9_9b"] = round(time.time() - t0, 1)
    tiers = dict(sorted(tiers.items()))
    failed = [k for k, v in tiers.items() if not v["ok"]]

    os.makedirs(os.path.join(a.out_dir, "reports"), exist_ok=True)
    stem = "%s__%s" % (re.sub(r"[^\w.-]+", "_", a.label), ts.replace(":", ""))
    rp = os.path.join(a.out_dir, "reports", stem + ".json")
    if not ca:
        os.makedirs(cdir, exist_ok=True)
        ca_moi = {"khoa": khoa, "thanh_phan": tp, "ts": ts, "bao_cao_nguon": rp, "work_nguon": os.path.abspath(a.work),
                  "frames": [[t, os.path.basename(p)] for t, p in frames], "ocr": ocr_res,
                  "frame_dhash": ["%016x" % x for x in fh], "tang": {k: tiers[k] for k in TANG_CACHE}}
        ghi_nguyen_tu(cp, json.dumps(ca_moi, ensure_ascii=False, indent=1))
    gio["tong"] = round(time.time() - t_bat_dau, 1)
    ct = {"trang_thai": "dung" if ca else "ghi", "khoa": khoa, "thanh_phan": tp, "tep": os.path.abspath(cp),
          "tep_sha256": m.sha256(cp), "tang_tu_cache": (["khung_ocr", "frame_dhash"] + TANG_CACHE) if ca else [],
          "bao_cao_nguon": ca["bao_cao_nguon"] if ca else rp, "giay": gio,
          "ghi_chu": ("tang 9/9b + OCR lay tu lan chay day du %s (cung khoa); duong anh trong 9b tro ve work cua lan do"
                      % ca["ts"]) if ca else "chay day du, da ghi cache"}

    csha = CONG_SHA
    rep = {"cong": "§3.6 (9 tang)", "ts": ts, "nhan": a.label, "qua_cong": not failed, "tang_truot": failed,
           "rejection_reason": {k: tiers[k]["ly_do"] for k in failed}, "canh_bao": warn,
           "kho_so_sanh": {"so_bai": len(corpus), "bao_cao_hong": broken, "mau": a.corpus},
           "rang_buoc": bind, "video_sha256": vsha, "tang": tiers, "dac_trung": feat,
           "frame_dhash": ["%016x" % x for x in fh], "dhash_kieu": m.DHASH_KIEU,
           "ma_cong_sha256": csha[:12], "cong_sha256": csha, "cache_tang": ct}
    log_p = os.path.join(a.out_dir, "gate_log.jsonl")
    with open(log_p, "a", encoding="utf-8") as f:
        f.write(json.dumps({"ts": ts, "nhan": a.label, "video_sha256": vsha, "qua": not failed,
                            "tang_truot": failed, "bao_cao": rp, "cong_sha256": csha,
                            "cache_tang": ct["trang_thai"], "vo_cache_sha256": wsha}, ensure_ascii=False) + "\n")
    with open(os.path.join(a.out_dir, "rejection_reason.log"), "a", encoding="utf-8") as f:
        for k in failed:
            f.write("%s\t%s\t%s\t%s\n" % (ts, a.label, k, " | ".join(tiers[k]["ly_do"])))
    rep["chi_so"] = m.metrics(log_p, m.WAREHOUSE)
    js = json.dumps(rep, ensure_ascii=False, indent=1)
    open(rp, "w", encoding="utf-8").write(js)
    if failed:
        os.makedirs(os.path.join(a.out_dir, "rejected"), exist_ok=True)
        open(os.path.join(a.out_dir, "rejected", stem + ".json"), "w", encoding="utf-8").write(js)

    print("CONG §3.6 [%s]: %s  (cache_tang: %s, %s s)" % (a.label, "QUA" if not failed else "LOAI",
                                                          ct["trang_thai"], gio["tong"]))
    for k, v in tiers.items():
        print("  %-26s %s  %s" % (k, "ok " if v["ok"] else "TRUOT", " | ".join(v["ly_do"])[:300]))
    for x in warn:
        print("  CANH BAO:", x)
    print("  chi_so:", json.dumps(rep["chi_so"], ensure_ascii=False))
    print("  bao_cao:", rp)
    return 0 if not failed else 3


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    try:
        sys.exit(main())
    except SystemExit:
        raise
    except Exception as e:
        print("LOI_CHAY (khong ket luan): %s: %s" % (type(e).__name__, e))
        sys.exit(2)
