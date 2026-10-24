import sys,glob,numpy as np
from PIL import Image
d=sys.argv[1]; a,b=float(sys.argv[2]),float(sys.argv[3])
fs=sorted(glob.glob(d+'/t_*.jpg')); ts=[float(f.split('t_')[1][:-4]) for f in fs]
w,h=(480,270) if '16' in d else (270,480)
prev=None; out=[]
for f,t in zip(fs,ts):
  if t<a-0.25 or t>b: continue
  A=np.asarray(Image.open(f).convert('L').resize((w,h)),dtype=np.int16)
  if prev is not None: out.append(f"{t:.2f}:{(np.abs(A-prev)>12).mean()*100:.1f}")
  prev=A
print(d,' '.join(out))
