# -*- coding: utf-8 -*-
"""D16: first 60s at 540p in two formats + 35 stills/format; no full episode."""
import json, math, os, re, shutil, subprocess
from pathlib import Path
from kiem_chuyen_dong_beat import evaluate, parse_roi, SAMPLE_FPS, PIXEL_DELTA, MIN_CHANGED_PIXEL_RATIO, MIN_MOVING_PAIR_PCT, MAX_STILL_S

R = Path("E:/Studio")
B = R / "out/M1_MARANGONI_DUNG/_build"
SB = R / "out/M1_MARANGONI/storyboard.json"
P = str(R / "venv_manim/Scripts/python.exe")
OUT = B / "mau_540"
OUT.mkdir(parents=True, exist_ok=True)
ENV = dict(os.environ, K1_MAU_540="1", PYTHONPATH=str(R / "ban_sac"), PYTHONIOENCODING="utf-8")
FIRST = ("h1", "h2", "h3", "h4", "c1", "p1")

def run(args, env=ENV):
    p = subprocess.run(list(map(str, args)), cwd=R, env=env,
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    log = p.stdout + "\n" + p.stderr
    if p.returncode or any(x in log for x in ("NGOAI_VUNG", "CHU_TRONG_PIP")):
        raise RuntimeError("RENDER_MAU_LOI rc=%s\n%s" % (p.returncode, log[-3000:]))
    return log

run([P, "ci/chay_ci.py", "--tap", R / "tools/tap/ML_K1_t3.json",
     "--buoc", "ke_hoach,canh", "--bo-cuc", "ca_hai"])
plan = json.loads((B / "ke_hoach.json").read_text(encoding="utf-8"))
if plan["tong_khung"] != 16601:
    raise ValueError("KHOA_TTS_553S_BI_DOI %s" % plan["tong_khung"])
story = json.loads(SB.read_text(encoding="utf-8"))
clips = []
for b in story["beats"]:
    duration = plan["beats"][b["id"]]["so_khung"] / 30
    changes = b.get("doi_hinh") or []
    law = b.get("chuyen_dong_chinh") or {}
    if not (law.get("vat_chuyen_dong") and law.get("luat_chuyen_dong") and law.get("chay_lien_tuc")):
        raise ValueError("C17G_THIEU_VAT_LUAT %s" % b["id"])
    if abs(float(law.get("t_vao_s",-99))) > .001 or abs(float(law.get("t_ra_s",-99)) - duration) > .001:
        raise ValueError("C17G_SAI_KHOANG_CHAY %s" % b["id"])
    if len(changes) < math.ceil(duration/8):
        raise ValueError("B3_THIEU_DOI_HINH %s" % b["id"])
    for cue in changes:
        if not cue.get("moc_tts") or "t_s" not in cue:
            raise ValueError("B3_THIEU_TTS %s" % b["id"])
    clips += b.get("canh_thuc") or []
if len(clips) != 16 or clips[0]["t_vao"] != 0:
    raise ValueError("C16_CLIP_KHONG_DU %s" % len(clips))
(OUT / "canh_thuc.json").write_text(
    json.dumps({"clip":clips, "note":"Gemini clips pending; simulation runs underneath."},
               ensure_ascii=False, indent=2), encoding="utf-8")
tts=json.loads((B / "tts.json").read_text(encoding="utf-8"))["beats"]
motion_rows=[]
ci_failures=[]
# Ghi báo cáo kể cả khi cổng đứng hình toàn khung bị trượt; không thoát sớm.

for bc in ("16x9","9x16"):
    env = dict(ENV, K3_BO_CUC=bc, K3_KE_HOACH=str(B / "ke_hoach.json"))
    folder = OUT / bc
    folder.mkdir(exist_ok=True)
    videos = []
    from PIL import Image, ImageDraw
    thumbs=[]
    for bid in plan["thu_tu"]:
        still = folder / ("khung_" + bid + ".png")
        if not still.exists():
            work = folder / ("still_" + bid)
            debug = run([P, "-m", "manim", "render", "-s", "--disable_caching",
                 "--progress_bar", "none", "-v", "ERROR",
                 "--media_dir", work, R / "out/M1_MARANGONI_DUNG/canh.py", bid], env)
            images = list(work.rglob("*.png"))
            if not images:
                print("MANIM_STATIC_DEBUG", bc, bid, debug[-1800:],
                      sorted(str(x) for x in work.rglob("*"))[-40:], flush=True)
                raise ValueError("THIEU_KHUNG %s/%s" % (bc,bid))
            shutil.copyfile(images[-1],still)
        thumbs.append(Image.open(still).convert("RGB"))
        if bid in FIRST:
            work=folder/("video_"+bid)
            manim_log=run([P, "-m", "manim", "render", "--frame_rate", "30", "--disable_caching",
                 "--progress_bar", "none", "-v", "ERROR", "--media_dir",work,
                 R / "out/M1_MARANGONI_DUNG/canh.py",bid],env)
            files=list(work.rglob(bid+".mp4"))
            if not files: raise ValueError("THIEU_CLIP_MAU %s/%s"%(bc,bid))
            videos.append(files[-1])
            beat_spec=plan["beats"][bid]
            beg=float(beat_spec["t0"])
            full_end=beg+beat_spec["so_khung"]/30
            checked_until=min(60.0,full_end)
            if checked_until>beg:
                roi=parse_roi(manim_log,bid,bc)
                row=evaluate(files[-1],bid,bc,beg,checked_until,roi,full_end)
                motion_rows.append(row)
                print("C17G_BEAT %s/%s t=%.2f..%.2f cap_dong=%.2f%% dung_dai_nhat=%.2fs => %s" %
                      (bc,bid,beg,checked_until,row["ty_le_cap_dong_pct"],
                       row["giay_dung_dai_nhat"],row["ket_qua"]),flush=True)
                if row["ket_qua"]!="DAT":
                    ci_failures.append("C17G_BEAT_TRUOT "+bc+"/"+bid)
    tw,th=(180,105) if bc=="16x9" else (100,180)
    sheet=Image.new("RGB",(tw*5,(th+25)*7),(237,239,241))
    draw=ImageDraw.Draw(sheet)
    for i,(bid,im) in enumerate(zip(plan["thu_tu"],thumbs)):
        im.thumbnail((tw-6,th-3))
        x,y=(i%5)*tw,(i//5)*(th+25)
        sheet.paste(im,(x+(tw-im.width)//2,y))
        draw.text((x+5,y+th+2),bid,fill=(20,24,29))
    sheet.save(OUT/("contact_sheet_"+bc+".jpg"),quality=90)
    playlist=folder/"sample.ffconcat"
    playlist.write_text("ffconcat version 1.0\n"+
         "".join("file '%s'\n"%str(p).replace("\\","/") for p in videos),
         encoding="utf-8")
    silent=folder/"mute60.mp4"
    run(["ffmpeg","-nostdin","-y","-loglevel","error","-f","concat","-safe","0",
         "-i",playlist,"-t","60","-r","30","-an","-c:v","libx264",
         "-crf","18","-pix_fmt","yuv420p",silent],env)
    inputs=[]; filters=[]
    for i,bid in enumerate(FIRST):
        beat=plan["beats"][bid]
        start=beat["t0"]+beat["t_chuyen"]
        inputs += ["-i",tts[bid]["mp3"]]
        filters.append("[%d:a]adelay=%d:all=1,atrim=0:60[a%d]"%(i+1,round(start*1000),i+1))
    filters.append("".join("[a%d]"%i for i in range(1,len(FIRST)+1))+
                  "amix=inputs=6:normalize=0:duration=longest,atrim=0:60[a]")
    movie=OUT/("mau_00_60_"+bc+"_540p.mp4")
    run(["ffmpeg","-nostdin","-y","-loglevel","error","-i",silent,*inputs,
         "-filter_complex",";".join(filters),"-map","0:v:0","-map","[a]",
         "-c:v","copy","-c:a","aac","-b:a","160k","-t","60",movie],env)
    report=run(["ffmpeg","-nostdin","-i",movie,"-vf",
                "freezedetect=n=0.001:d=2","-an","-f","null","-"],env)
    starts=[float(x) for x in re.findall(r"freeze_start:\s*([0-9.]+)",report)]
    ends=[float(x) for x in re.findall(r"freeze_end:\s*([0-9.]+)",report)]
    intervals=[max(0,min(60,ends[i] if i<len(ends) else 60)-s) for i,s in enumerate(starts)]
    frozen=sum(intervals); longest=max(intervals,default=0)
    ok=frozen<=6.0 and longest<=4.0
    row={"format":bc,"duration_s":60,"freeze_s":round(frozen,3),"pct":round(frozen/60*100,3),
         "longest_s":round(longest,3),"pass":ok}
    (OUT/("freeze_"+bc+".json")).write_text(json.dumps(row,indent=2),encoding="utf-8")
    print("C17_FREEZE %s frozen %.3fs pct %.2f%% longest %.3fs => %s"%
          (bc,frozen,frozen/60*100,longest,"DAT" if ok else "TRUOT"),flush=True)
    if not ok:
        ci_failures.append("C17_FREEZE_VUOT_NGUONG "+bc)
report_motion={"thoi_diem":"mau 00:00–01:00, không tuyên bố đã kiểm full",
    "mau_hz":SAMPLE_FPS,"delta_nguong_gray_255":PIXEL_DELTA,
    "ty_le_pixel_roi_doi_toi_thieu":MIN_CHANGED_PIXEL_RATIO,
    "cap_dong_toi_thieu_pct":MIN_MOVING_PAIR_PCT,
    "dung_lien_tiep_toi_da_s":MAX_STILL_S,
    "ket_qua":motion_rows,"so_beat_duoc_do":len(motion_rows),
    "loi":[x for x in ci_failures if x.startswith("C17G_")]}
(OUT/"chuyen_dong_beat.json").write_text(
    json.dumps(report_motion,ensure_ascii=False,indent=2),encoding="utf-8")
if len(motion_rows)!=12:
    ci_failures.append("C17G_THIEU_12_DONG_MAU %d" % len(motion_rows))
if ci_failures:
    raise SystemExit("CI_MAU_TRUOT: "+", ".join(ci_failures))
print("MAU_540_DAT_2_KHO: 60s x 2 + 35 khung/khổ; không dựng toàn tập",flush=True)
