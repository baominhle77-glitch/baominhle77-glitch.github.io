# pixel-diff 4 fps trên khung đã chụp (cùng định nghĩa bo_dan_chung.py): > 6 % diện tích khác > 12/255
import sys,glob,numpy as np
from PIL import Image
d=sys.argv[1]; fs=sorted(glob.glob(d+'/t_*.jpg'))
w,h=(480,270) if Image.open(fs[0]).width>Image.open(fs[0]).height else (270,480)
A=[np.asarray(Image.open(f).convert('L').resize((w,h)),dtype=np.int16) for f in fs]
ts=[float(f.split('t_')[1][:-4]) for f in fs]
ev=[ts[i] for i in range(1,len(A)) if (np.abs(A[i]-A[i-1])>12).mean()>0.06]
moc=[0.0]+ev+[ts[-1]]
kh=[(round(b-a,2),a) for a,b in zip(moc,moc[1:])]
print(d,'so lan doi',len(ev),'dai nhat',max(kh),'>4s:',[k for k in kh if k[0]>4],'>3s:',[k for k in kh if k[0]>3])
