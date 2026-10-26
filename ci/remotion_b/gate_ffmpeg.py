"""Select a complete FFmpeg for unchanged fps/freezedetect measurements."""
import json,os,shutil,subprocess,sys
from pathlib import Path
R=Path(__file__).resolve().parents[2];required={'fps','freezedetect','scale','format'}
def filters(binary):
 try:
  p=subprocess.run([str(binary),'-hide_banner','-filters'],capture_output=True,text=True,timeout=15)
  return {line.split()[1] for line in p.stdout.splitlines() if len(line.split())>=3 and len(line.split()[0])==3}
 except (OSError,subprocess.SubprocessError):return set()
def raw_muxer(binary):
 try:return 'rawvideo' in subprocess.check_output([str(binary),'-hide_banner','-muxers'],stderr=subprocess.STDOUT,text=True,timeout=15)
 except (OSError,subprocess.SubprocessError):return False
choices=[shutil.which('ffmpeg'),'/usr/bin/ffmpeg','/usr/local/bin/ffmpeg'];binary=next((Path(x) for x in choices if x and required<=filters(x) and raw_muxer(x)),None)
if binary is None:
 target=R/'work/ffmpeg_runtime'
 subprocess.run([sys.executable,'-m','pip','install','-q','--cache-dir',str(R/'work/pip-cache'),'--target',str(target),'imageio-ffmpeg==0.6.0'],check=True)
 binary=next((target/'imageio_ffmpeg/binaries').glob('ffmpeg-linux-*'))
assert required<=filters(binary) and raw_muxer(binary),'FULL_FFMPEG_FILTERS_MISSING'
bindir=R/'work/B_gate_tools';bindir.mkdir(parents=True,exist_ok=True);link=bindir/'ffmpeg'
if link.exists() or link.is_symlink():link.unlink()
link.symlink_to(binary.resolve())
if os.environ.get('GITHUB_PATH'):
 with open(os.environ['GITHUB_PATH'],'a') as f:f.write(str(bindir)+'\n')
version=subprocess.check_output([str(binary),'-hide_banner','-version'],text=True).splitlines()[0]
report=dict(binary=str(binary),version=version,required_filters=sorted(required),filters_verified=True,gate_code='ci/chuyen_dong_vung.py unchanged')
out=R/'work/B';out.mkdir(parents=True,exist_ok=True);(out/'gate_ffmpeg.json').write_text(json.dumps(report,indent=2));print('B_GATE_FFMPEG '+json.dumps(report),flush=True)
