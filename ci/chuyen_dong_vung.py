# -*- coding: utf-8 -*-
"""C17(8): gate trên TOÀN KHUNG 540p, từng beat, không đo ROI nhỏ.

ffmpeg fps=4,scale=240:135,format=gray; pixel động iff abs(I_t-I_t-1)>6.
Loại pixel lặp động trong >=60% CẶP KHUNG toàn video trước khi thống kê.
Mỗi beat: >=60% cặp có >=3% khung động, trung bình >=5%, hợp >=15%,
không có chuỗi >2s mà mỗi cặp có <0.3% diện tích động.
"""
import argparse
import json
import subprocess
from pathlib import Path

import numpy as np

FPS = 4
WIDTH, HEIGHT = 240, 135
DIFF = 6
REPEAT_PCT = .60
PAIR_PCT = 3.
BEAT_PAIRS_GE_3_MIN = 60.
BEAT_MEAN_MIN = 5.
BEAT_UNION_MIN = 15.
LOW_PAIR_PCT = .3
MAX_LOW_STREAK_S = 2.
FIRST = ("h1", "h2", "h3", "h4", "c1", "p1")
# Nhóm khuôn chỉ dùng để so cùng BẢN CHẤT HÌNH; so toàn bộ các beat
# trước cùng nhóm, không chỉ beat liền trước (GĐ 26/10 lần 3).
TEMPLATE={"h1":"mat_nuoc","h2":"mat_nuoc","h3":"mat_nuoc",
          "h4":"hai_khay","c1":"mat_cat","p1":"mat_cat"}
SCENE_DIFF_MIN=12.
MIN_PASS_2S=28


def extract(video, fmt):
    if not video.is_file():
        raise FileNotFoundError(video)
    probe = subprocess.run([
        "ffprobe", "-v", "error", "-select_streams", "v:0",
        "-show_entries", "stream=width,height,duration",
        "-of", "json", str(video)], capture_output=True, text=True)
    if probe.returncode:
        raise RuntimeError("FFPROBE: " + probe.stderr[-1500:])
    meta = json.loads(probe.stdout)["streams"][0]
    expect = (960, 540) if fmt == "16x9" else (540, 960)
    if (int(meta["width"]), int(meta["height"])) != expect:
        raise ValueError("NOT_540P %s %r" % (fmt, meta))
    cmd = ["ffmpeg", "-nostdin", "-hide_banner", "-v", "error",
           "-i", str(video), "-t", "60", "-vf",
           "fps=4,scale=240:135,format=gray",
           "-an", "-f", "rawvideo", "-pix_fmt", "gray", "pipe:1"]
    p = subprocess.run(cmd, capture_output=True)
    if p.returncode:
        raise RuntimeError("FFMPEG: " + p.stderr.decode("utf-8","replace")[-1500:])
    size = WIDTH * HEIGHT
    if len(p.stdout) % size:
        raise RuntimeError("RAW_VIDEO_SIZE bytes=%d frame=%d"%(len(p.stdout),size))
    n = len(p.stdout)//size
    if n < 235 or n > 242:
        raise ValueError("60S_4FPS_EXPECTED_240_FRAMES got=%s" % n)
    return np.frombuffer(p.stdout,dtype=np.uint8).reshape(n,HEIGHT,WIDTH)


def measure(frames, plan, fmt):
    changed = (np.abs(np.diff(frames.astype(np.int16),axis=0)) > DIFF)
    total_pairs = len(changed)
    # Mặt nạ toàn video phải tính TRƯỚC khi cắt từng beat. Loại chuyển
    # động lặp cố định (ticker, vòng quay bé, shimmer giả chạy mọi lúc).
    repeated = (np.count_nonzero(changed,axis=0)/total_pairs) >= REPEAT_PCT
    effective = changed & (~repeated)[None,:,:]
    pixel_base = float(WIDTH*HEIGHT)
    area = 100*np.count_nonzero(effective,axis=(1,2))/pixel_base
    beat_rows=[]
    earlier={}
    for bid in FIRST:
        b=plan["beats"][bid]
        t0=float(b["t0"])
        t1=t0+int(b["so_khung"])/30.
        t1_seen=min(60.,t1)
        # diff[j-1] chính là cặp có khung cuối tại t=j/FPS.
        idx=[j-1 for j in range(1,len(frames))
             if t0 <= j/FPS < t1_seen]
        if not idx:
            raise RuntimeError("BEAT_EMPTY %s [%f,%f)"%(bid,t0,t1_seen))
        beat = effective[idx]
        ar = area[idx]
        # Khác cảnh = trung bình độ khác biệt grayscale khung giữa beat.
        # Đo trên khung GỐC trước khi bỏ lớp lặp, vì đây là phép so bối
        # cảnh/khung máy của toàn hình, không phải phép đo diện tích động.
        center_t=(t0+t1_seen)*.5
        center_idx=min(len(frames)-1,max(0,int(round(center_t*FPS))))
        center_frame=frames[center_idx].astype(np.int16)
        kind=TEMPLATE[bid]
        prev=earlier.get(kind,[])
        differences=[(prior_id,float(np.abs(center_frame-prior_img).mean()))
                     for prior_id,prior_img in prev]
        closest=min(differences,key=lambda x:x[1]) if differences else None
        khac_canh=None if closest is None else closest[1]
        khac_dat=(khac_canh is None or khac_canh>=SCENE_DIFF_MIN)
        prev_id=None if closest is None else closest[0]
        earlier.setdefault(kind,[]).append((bid,center_frame))
        above = 100.*np.count_nonzero(ar>=PAIR_PCT)/len(ar)
        mean = float(ar.mean())
        union = 100.*np.count_nonzero(beat.any(axis=0))/pixel_base
        low = ar<LOW_PAIR_PCT
        streak=longest=0
        for is_low in low:
            streak = streak+1 if is_low else 0
            longest=max(longest,streak)
        longest_s=longest/FPS
        passed=(above>=BEAT_PAIRS_GE_3_MIN and mean>=BEAT_MEAN_MIN
                and union>=BEAT_UNION_MIN and longest_s<=MAX_LOW_STREAK_S
                and khac_dat)
        row={
            "beat":bid,"bo_cuc":fmt,
            "t_vao_s":round(t0,4),"t_ra_do_s":round(t1_seen,4),
            "t_ra_beat_s":round(t1,4),
            "beat_bi_cat_o_60s": t1>60.01,
            "so_cap":len(idx),
            "dien_tich_trung_binh_pct":round(mean,3),
            "vung_dong_gop_pct":round(union,3),
            "cap_ge_3pct_pct":round(above,3),
            "chuoi_duoi_0_3pct_dai_nhat_s":round(longest_s,3),
            "loai_khuon":kind,
            "khac_canh_nguong":SCENE_DIFF_MIN,
            "khac_canh_voi_tat_ca_cung_khuon":[
                {"beat":oid,"hieu_gray":round(val,3)}
                for oid,val in differences],
            "khac_canh":(None if khac_canh is None else round(khac_canh,3)),
            "khac_canh_so_voi":prev_id,
            "khac_canh_dat":khac_dat,
            "loi_lap_canh":(not khac_dat),
            "ket_qua":"DAT" if passed else "TRUOT"}
        beat_rows.append(row)
        print("C17_8 %s/%s avg=%.2f%% union=%.2f%% >=3%%=%.2f%% "
              "low_streak=%.2fs khac_canh=%s => %s"%
              (fmt,bid,mean,union,above,longest_s,
               "first" if khac_canh is None else "%.2f"%khac_canh,
               row["ket_qua"]),flush=True)
    # Cổng phụ GĐ: 30 đoạn rời nhau dài 2 giây trên 60s;
    # đoạn ĐẠT iff diện tích TB >=5%, hợp >=15%, >=60% cặp >=3%.
    windows=[]
    for section in range(30):
        left,right=section*2.,(section+1)*2.
        idx=[j-1 for j in range(1,len(frames))
             if left <= j/FPS < right]
        if not idx:
            raise RuntimeError("EMPTY_2S_WINDOW %s %d"%(fmt,section))
        q=area[idx]
        wmean=float(q.mean())
        wunion=100.*np.count_nonzero(effective[idx].any(axis=0))/pixel_base
        wabove=100.*np.count_nonzero(q>=PAIR_PCT)/len(q)
        ok=wmean>=BEAT_MEAN_MIN and wunion>=BEAT_UNION_MIN and wabove>=BEAT_PAIRS_GE_3_MIN
        windows.append({"giay_vao":left,"tb_pct":round(wmean,3),
                        "gop_pct":round(wunion,3),
                        "cap_ge_3pct_pct":round(wabove,3),
                        "ket_qua":"DAT" if ok else "TRUOT"})
    nwin=sum(q["ket_qua"]=="DAT" for q in windows)
    print("C17_8_2S %s %d/30 >=%d => %s"%(fmt,nwin,MIN_PASS_2S,
           "DAT" if nwin>=MIN_PASS_2S else "TRUOT"),flush=True)
    return {
        "bo_cuc":fmt,"so_khung_4fps":len(frames),"so_cap":total_pairs,
        "pixel_bo_lap":int(repeated.sum()),
        "bo_lap_pct":round(100.*repeated.mean(),3),
        "dien_tich_dong_trung_binh_toan_mau_pct":round(float(area.mean()),3),
        "cap_co_chuyen_dong_pct":round(100.*np.count_nonzero(area>0)/len(area),3),
        "beats":beat_rows,"so_doan_2s_dat":nwin,
        "so_doan_2s":30,"cua_so_2s":windows,
        "cong_2s_dat":nwin>=MIN_PASS_2S}


def main():
    p=argparse.ArgumentParser()
    p.add_argument("--root",type=Path,default=Path("."))
    a=p.parse_args()
    root=a.root
    try:
        plan=json.loads(next(root.rglob("ke_hoach.json")).read_text(encoding="utf-8"))
        if plan["tong_khung"]!=16601:
            raise ValueError("TTS_KHONG_KHOA_16601")
        reports=[]
        missing=[]
        file_paths={}
        for fmt in ("16x9","9x16"):
            matches=list(root.rglob("mau_00_60_"+fmt+"_540p.mp4"))
            if len(matches)!=1:
                missing.append({"bo_cuc":fmt,"so_tep":len(matches),
                                "ten_tep":"mau_00_60_"+fmt+"_540p.mp4"})
                continue
            file_paths[fmt]=str(matches[0])
            reports.append(measure(extract(matches[0],fmt),plan,fmt))
        failures=[r["bo_cuc"]+"/"+b["beat"] for r in reports for b in r["beats"]
                  if b["ket_qua"]=="TRUOT"]
        failures += ["THIEU_VIDEO_"+x["bo_cuc"] for x in missing]
        failures += ["DOAN_2S_"+r["bo_cuc"]+"_"+str(r["so_doan_2s_dat"])+"/30"
                     for r in reports if not r["cong_2s_dat"]]
        report={
            "chuan":"C17(8) full-frame v2 + khac_canh",
            "video":"K1 t3 mẫu 00:00–01:00, không suy rộng sang full 553s",
            "lay_mau":"ffmpeg fps=4,scale=240:135,format=gray",
            "nguong_pixel_tuyet_doi_lon_hon":6,
            "bo_pixel_dong_lap_neu_ty_le_cap_toan_video_ge_pct":60,
            "nguong_tung_beat":{
                "cap_co_dien_tich_ge_3pct_toi_thieu_pct":60,
                "dien_tich_trung_binh_pct":5,
                "vung_gop_pct":15,
                "chuoi_cap_duoi_0_3pct_toi_da_s":2,
                "khac_canh_toi_thieu_so_voi_moi_beat_truoc_cung_khuon":12,
                "so_doan_2s_dat_toi_thieu_trong_30":28},
            "ket_qua":"TRUOT" if failures else "DAT",
            "loi":failures,"thieu_video":missing,
            "tep_video":file_paths,"bao_cao":reports}
    except Exception as e:
        report={"chuan":"C17(8) full-frame v2 + khac_canh","ket_qua":"TRUOT",
                "loi":[repr(e)]}
    output=root/"chuyen_dong_vung.json"
    output.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
    print("C17_8_REPORT",output,"=>",report["ket_qua"],flush=True)
    if report["ket_qua"]!="DAT":
        raise SystemExit("CHUYEN_DONG_VUNG_TRUOT "+str(report["loi"]))


if __name__=="__main__":
    main()
