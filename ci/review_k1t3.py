"""Render → inspectable frames → measured gates. No gate is waived on failure.

Local: python ci/review_k1t3.py --root <external runtime> --beats h1 --formats 16x9
CI: --beats all --formats 16x9,9x16. --stills-only is preparation, never a pass.
"""
import argparse,ast,hashlib,json,os,subprocess,sys,time
from concurrent.futures import ThreadPoolExecutor,as_completed
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw

HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE))
from chuyen_dong_vung import DIFF,REPEAT_PCT,PAIR_PCT


def command(args,cwd=None,env=None):
    p=subprocess.run(list(map(str,args)),cwd=cwd,env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
    if p.returncode:raise RuntimeError(p.stdout.decode('utf-8','replace')[-5000:])
    return p.stdout


def decode(video):
    raw=command(['ffmpeg','-nostdin','-v','error','-i',video,'-vf','fps=4,scale=240:135,format=gray','-an','-f','rawvideo','-pix_fmt','gray','pipe:1'])
    return np.frombuffer(raw,dtype=np.uint8).reshape(-1,135,240)


def motion(frames):
    if len(frames)<2:raise ValueError('Fewer than two decoded frames')
    changed=np.abs(np.diff(frames.astype(np.int16),axis=0))>DIFF
    # Standalone-beat report is conservative: recurrent-pixel masking is applied
    # over this whole beat. The 60s gate independently masks over the whole sample.
    repeat=changed.mean(axis=0)>=REPEAT_PCT
    effective=changed & ~repeat
    area=effective.mean(axis=(1,2))*100
    longest=streak=0
    for x in area<.3:
        streak=streak+1 if x else 0;longest=max(longest,streak)
    avg=float(area.mean());union=float(effective.any(axis=0).mean()*100);above=float((area>=PAIR_PCT).mean()*100)
    return dict(avg_pct=round(avg,3),union_pct=round(union,3),pairs_ge_3_pct=round(above,3),low_streak_s=longest/4,
                pass_motion=avg>=5 and union>=15 and above>=60 and longest/4<=2)


def fingerprint(root,plan,bid,fmt,still_only,tier="final"):
    source=(root/'ban_sac/K1_canh/mo_phong_c17_v2.py').read_text(encoding='utf-8')
    tree=ast.parse(source)
    for cls in [n for n in tree.body if isinstance(n,ast.ClassDef) and n.name=='SceneK1T3']:
        cls.body=[n for n in cls.body if not isinstance(n,ast.FunctionDef) or not n.name.startswith('beat_') or n.name=='beat_'+bid]
    for node in tree.body:
        if isinstance(node,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='CAPTIONS' for t in node.targets):
            value=ast.literal_eval(node.value)
            node.value=ast.Dict(keys=[ast.Constant(bid)],values=[ast.Constant(value[bid])])
    digest=hashlib.sha256(ast.dump(tree,include_attributes=False).encode())
    for path in [root/'ban_sac/K1_canh/vat_the_3d.py',root/'ban_sac/K1_canh/khung.py',root/'ban_sac/K1_ban_quang_hoc.py',root/'ban_sac/fonts/NotoSans-Regular.ttf',root/'out/M1_MARANGONI_DUNG/canh.py',Path(__file__),plan]:
        digest.update(path.read_bytes())
    digest.update(json.dumps([bid,fmt,still_only,tier]).encode())
    return digest.hexdigest()


def render_one(root,out,plan,bid,fmt,still_only=False,tier="final"):
    folder=out/fmt/bid;folder.mkdir(parents=True,exist_ok=True)
    env=dict(os.environ,K1_MAU_540='1',K3_BO_CUC=fmt,K3_KE_HOACH=str(plan),PYTHONPATH=str(root/'ban_sac'),PYTHONIOENCODING='utf-8')
    fps=15 if tier=='preview' else 30
    if tier=='preview':env['K1_PREVIEW_HEIGHT']='360'
    else:env.pop('K1_PREVIEW_HEIGHT',None)
    env.update(OPENBLAS_NUM_THREADS='1',OMP_NUM_THREADS='1')
    if still_only:env['K1_MID_STILL']='1'
    args=[sys.executable,'-m','manim','render','--frame_rate',str(fps),'--disable_caching','--progress_bar','none','-v','ERROR','--media_dir',folder/(tier+'_media'),root/'out/M1_MARANGONI_DUNG/canh.py',bid]
    if still_only:args.insert(4,'-s')
    key=fingerprint(root,plan,bid,fmt,still_only,tier)
    cache=folder/(tier+('_still.json' if still_only else '_video.json'))
    if cache.exists():
        old=json.loads(cache.read_text(encoding='utf-8'))
        paths=[old.get('image')] if still_only else [old.get('video'),*(old.get('stills') or [])]
        if old.get('source_digest')==key and old.get('exit_code')==0 and all(x and Path(x).is_file() for x in paths):
            old['cache_reused']=True;return old
    t=time.perf_counter();row=dict(beat=bid,format=fmt,kind='still' if still_only else 'video',status='TRUOT',source_digest=key,tier=tier,render_fps=fps)
    p=subprocess.run(list(map(str,args)),cwd=root,env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
    log=p.stdout.decode('utf-8','replace');(folder/'render.log').write_text(log,encoding='utf-8')
    row.update(wall_s=round(time.perf_counter()-t,3),exit_code=p.returncode)
    if p.returncode:
        row['error']=log[-3000:];return row
    if fingerprint(root,plan,bid,fmt,still_only,tier)!=key:
        row['error']='SOURCE_CHANGED_DURING_RENDER';return row
    if f'C13_PREFLIGHT {bid} {fmt} PASS' not in log:
        row['error']='C13 preflight evidence missing';return row
    rows_composition=[json.loads(line.split(' ',1)[1]) for line in log.splitlines() if line.startswith('C13_COMPOSITION ')]
    if len(rows_composition)!=1:
        row['error']='Missing C13 composition measurement';return row
    row['composition']=rows_composition[0]
    row['C13']='DAT' if row['composition']['pass'] else 'TRUOT'
    row['C13_scope']='label boxes and projected visible subject/stage bounds; artistic quality still requires viewing'
    if still_only:
        row['image']=str(next((folder/(tier+'_media')).rglob('*.png')));row['status']='STILL_ONLY' if row['composition']['pass'] else 'TRUOT';
        if row['status']=='TRUOT':row['error']='C13_COMPOSITION '+json.dumps(row['composition'])
        cache.write_text(json.dumps(row,ensure_ascii=False,indent=2),encoding='utf-8');return row
    video=next((folder/(tier+'_media')).rglob(bid+'.mp4'));row['video']=str(video)
    meta=json.loads(command(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height,nb_frames,r_frame_rate,duration','-of','json',video]))['streams'][0]
    source_frames=json.loads(plan.read_text(encoding='utf-8'))['beats'][bid]['so_khung']
    expected=round(source_frames*fps/30)
    row.update(actual_frames=int(meta['nb_frames']),expected_frames=expected,duration_s=float(meta['duration']))
    short=360 if tier=='preview' else 540
    expect_size=(short*16//9,short) if fmt=='16x9' else (short,short*16//9)
    row['frame_count_pass']=int(meta['nb_frames'])==expected
    if (meta['width'],meta['height'])!=expect_size or meta['r_frame_rate']!=str(fps)+'/1' or not row['frame_count_pass']:
        row['error']='Wrong dimensions, fps or encoded frame count';return row
    times=[min(.5,expected/(2*fps)),expected/(2*fps),max(0,(expected-1)/fps-.25)]
    row['stills']=[]
    for label,at in zip(('first','middle','last'),times):
        dest=folder/(label+'.png')
        command(['ffmpeg','-nostdin','-y','-v','error','-ss',at,'-i',video,'-frames:v','1',dest]);row['stills'].append(str(dest))
    row.update(motion(decode(video)))
    # This is the actual timeline sheet, not repeated static stand-ins.
    contact=folder/'timeline.jpg'
    command(['ffmpeg','-nostdin','-y','-v','error','-i',video,'-vf','fps=1/3,scale=384:216:force_original_aspect_ratio=decrease,pad=384:216:(ow-iw)/2:(oh-ih)/2,tile=4x5','-frames:v','1',contact])
    row['contact_sheet']=str(contact);row['status']='DAT' if row['pass_motion'] and row['composition']['pass'] else 'TRUOT'
    if not row['pass_motion']:row['error']='Motion threshold failed'
    if not row['composition']['pass']:row['error']='C13_COMPOSITION '+json.dumps(row['composition'])
    cache.write_text(json.dumps(row,ensure_ascii=False,indent=2),encoding='utf-8')
    return row


def compare_every_prior(rows,order,fmt):
    earlier=[]
    for bid in order:
        r=next((r for r in rows if r['beat']==bid and r['format']==fmt),None)
        if not r:continue
        path=r.get('image') if r['kind']=='still' else (r.get('stills') or [None,None])[1]
        if not path:continue
        im=np.asarray(Image.open(path).convert('L').resize((240,135)),dtype=np.int16)
        diffs=[dict(beat=old,gray_mean=float(np.abs(im-past).mean())) for old,past in earlier]
        r['scene_differences']=diffs;r['scene_difference_min']=min((d['gray_mean'] for d in diffs),default=None)
        expected=order[:order.index(bid)]
        available={name for name,_ in earlier}
        r['scene_difference_scope']='ALL_PRIOR' if set(expected)<=available else 'PARTIAL_ONLY'
        r['scene_difference_pass']=all(d['gray_mean']>=12 for d in diffs) if r['scene_difference_scope']=='ALL_PRIOR' else None
        if any(d['gray_mean']<12 for d in diffs):
            r['status']='TRUOT';r['error']='Repeated middle frame: '+str([d for d in diffs if d['gray_mean']<12])
        earlier.append((bid,im))


def write_summary(rows,out):
    lines=['# K1 t3 — actual local/run evidence','',('PREVIEW 360p/15fps — not final 540p validation.' if any(r.get('tier')=='preview' for r in rows) else 'FINAL 540p/30fps measurements.'),'',
           '| Beat | Format | Frames | C13 boxes | Avg % | Union % | ≥3% pairs % | Difference | Result |',
           '|---|---|---|---|---|---|---|---|---|']
    for r in rows:
        lines.append('| {beat} | {format} | {actual_frames}/{expected_frames} | {C13} | {avg_pct} | {union_pct} | {pairs_ge_3_pct} | {scene_difference_min} ({scene_difference_scope}) | {status} |'.format_map(__import__('collections').defaultdict(lambda:'unrun',r)))
    for r in rows:
        if r.get('error'):lines+=['',f"**{r['format']}/{r['beat']} — {r['status']}**",'```',r['error'],'```']
    (out/'summary.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')


def main():
    p=argparse.ArgumentParser();p.add_argument('--root',type=Path,default=Path.cwd());p.add_argument('--out',type=Path)
    p.add_argument('--beats',default='all');p.add_argument('--formats',default='16x9,9x16');p.add_argument('--jobs',type=int,default=4);p.add_argument('--tier',choices=['preview','final'],default='final');p.add_argument('--stills-only',action='store_true')
    a=p.parse_args();root=a.root.resolve();out=(a.out or root/'out/M1_MARANGONI_DUNG/_build/review_3d').resolve();out.mkdir(parents=True,exist_ok=True)
    plan=root/'out/M1_MARANGONI_DUNG/_build/ke_hoach.json';order=json.loads(plan.read_text(encoding='utf-8'))['thu_tu']
    beats=order if a.beats=='all' else a.beats.split(',');formats=a.formats.split(',')
    if not set(beats)<=set(order) or not set(formats)<={'16x9','9x16'}:p.error('Unknown beat/format')
    rows=[]
    with ThreadPoolExecutor(max_workers=a.jobs) as pool:
        jobs={pool.submit(render_one,root,out,plan,bid,fmt,a.stills_only,a.tier):(bid,fmt) for fmt in formats for bid in beats}
        for future in as_completed(jobs):
            try:r=future.result()
            except Exception as e:r=dict(beat=jobs[future][0],format=jobs[future][1],status='TRUOT',error=repr(e))
            rows.append(r);print(json.dumps({k:v for k,v in r.items() if k not in ['error','stills']},ensure_ascii=False),flush=True)
            (out/'review.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
    # On a selective retry, retain only source-matching, verified existing clips.
    present={(r['format'],r['beat']) for r in rows}
    for fmt in formats:
        for bid in order:
            if (fmt,bid) in present:continue
            cache=out/fmt/bid/(a.tier+('_still.json' if a.stills_only else '_video.json'))
            if not cache.exists():continue
            previous=json.loads(cache.read_text(encoding='utf-8'))
            paths=[previous.get('image')] if a.stills_only else [previous.get('video'),*(previous.get('stills') or [])]
            if previous.get('source_digest')==fingerprint(root,plan,bid,fmt,a.stills_only,a.tier) and all(path and Path(path).is_file() for path in paths):
                previous['cache_reused']=True;rows.append(previous)
    for fmt in formats:compare_every_prior(rows,order,fmt)
    rows.sort(key=lambda r:(r['format'],order.index(r['beat']) if r['beat'] in order else 99))
    (out/'review.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8');write_summary(rows,out)
    if any(r['status']=='TRUOT' for r in rows):return 1
    if a.beats=='all' and any(r.get('scene_difference_scope')!='ALL_PRIOR' for r in rows):return 1
    return 0 if not a.stills_only else 2

if __name__=='__main__':raise SystemExit(main())
