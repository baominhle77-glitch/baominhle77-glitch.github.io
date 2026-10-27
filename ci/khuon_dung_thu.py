"""KHUÔN v1 — dựng THỬ phần mô phỏng (không chữ, không Remotion) để tự xem nhanh trên máy (chép nguyên văn).
Dùng: python ci/khuon_dung_thu.py --kho 16x9|9x16 --cao 270|540 [--tu 0 --den 60] --out work/B/thu_16x9.mp4
Mã hoá h264_qsv (máy có Intel QSV), không được thì libx264. Cạnh ngắn = --cao."""
import os, sys, argparse, subprocess
from pathlib import Path
R = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(R))
sys.path.insert(0, str(R / 'ci/remotion_b'))
from stage_khuon import doc_ban_ve, make_stage


def main():
    a = argparse.ArgumentParser()
    a.add_argument('--kho', choices=('16x9', '9x16'), required=True)
    a.add_argument('--cao', type=int, default=540)
    a.add_argument('--tu', type=float, default=0.0)
    a.add_argument('--den', type=float, default=None)
    a.add_argument('--ban-ve', default=str(R / 'ci/remotion_b/ban_ve_B60.json'))
    a.add_argument('--out', required=True)
    a = a.parse_args()
    bv = doc_ban_ve(a.ban_ve)
    fps = int(bv['fps'])
    den = a.den if a.den is not None else float(bv['tong_giay'])
    ngan = a.cao
    dai = int(round(ngan * 16 / 9 / 2) * 2)
    W, H = (dai, ngan) if a.kho == '16x9' else (ngan, dai)
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    os.environ.setdefault('ONEVPL_SEARCH_PATH', r'C:\Windows\System32\DriverStore\FileRepository\igdlh64.inf_amd64_a89617337ce7436c')
    vao = ['ffmpeg', '-nostdin', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(fps), '-i', '-']
    ma = [['-c:v', 'h264_qsv', '-global_quality', '23', '-pix_fmt', 'nv12'], ['-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p']]
    stages = {}
    for cach in ma:
        p = subprocess.Popen(vao + cach + [a.out], stdin=subprocess.PIPE)
        try:
            n0, n1 = int(round(a.tu * fps)), int(round(den * fps))
            for n in range(n0, n1):
                T = n / fps
                b = next(x for x in bv['beats'] if x['bat_dau'] <= T + 1e-9 < x['ket_thuc'])
                if b['id'] not in stages:
                    stages[b['id']] = make_stage(b['id'], W, H, a.kho == '9x16', bv)
                p.stdin.write(stages[b['id']].frame(T - b['bat_dau']).tobytes())
            p.stdin.close()
            if p.wait() == 0:
                print('DUNG_THU', a.kho, f'{W}x{H}', cach[1], a.out, flush=True)
                return 0
        except BrokenPipeError:
            p.wait()
        print('ma hoa', cach[1], 'hong -> thu cach sau', flush=True)
    return 1


if __name__ == '__main__':
    sys.exit(main())
