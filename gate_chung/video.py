import json,subprocess,functools
from pathlib import Path
import cv2,numpy as np
from .model import pixels

class Video:
 def __init__(self,path):
  self.path=Path(path);self.capture=cv2.VideoCapture(str(path))
  if not self.capture.isOpened():raise ValueError('Cannot decode '+str(path))
  self.width=int(self.capture.get(cv2.CAP_PROP_FRAME_WIDTH));self.height=int(self.capture.get(cv2.CAP_PROP_FRAME_HEIGHT));self.fps=self.capture.get(cv2.CAP_PROP_FPS);self.frames=int(self.capture.get(cv2.CAP_PROP_FRAME_COUNT));self.duration=self.frames/self.fps
 def frame_index(self,t):return min(self.frames-1,max(0,int(np.floor(float(t)*self.fps+1e-7))))
 def frame_time(self,t):return self.frame_index(t)/self.fps
 @functools.lru_cache(maxsize=8)
 def frame(self,t):
  self.capture.set(cv2.CAP_PROP_POS_FRAMES,self.frame_index(t));ok,f=self.capture.read()
  if not ok:raise ValueError(f'Decode failed {self.path} at {t}s')
  return cv2.cvtColor(f,cv2.COLOR_BGR2RGB)
 def crop(self,t,box):
  x,y,X,Y=pixels(box,self.width,self.height);return self.frame(t)[y:Y,x:X]
 def close(self):self.capture.release()

def rgb(s):return np.array([int(s.lstrip('#')[i:i+2],16) for i in (0,2,4)],dtype=float)
def gray(image):return cv2.cvtColor(image,cv2.COLOR_RGB2GRAY)
def ssim(a,b,mask=None):
 a=a.astype(np.float32);b=b.astype(np.float32);blur=lambda x:cv2.GaussianBlur(x,(11,11),1.5);ma,mb=blur(a),blur(b);va=blur(a*a)-ma*ma;vb=blur(b*b)-mb*mb;cov=blur(a*b)-ma*mb
 s=((2*ma*mb+6.5025)*(2*cov+58.5225))/((ma*ma+mb*mb+6.5025)*(va+vb+58.5225));return float(s[mask].mean() if mask is not None and mask.any() else s.mean())
def sharpness(image,mask=None):
 g=gray(image).astype(np.float64);lap_image=cv2.Laplacian(g,cv2.CV_64F);grad_image=cv2.Sobel(g,cv2.CV_64F,1,0)**2+cv2.Sobel(g,cv2.CV_64F,0,1)**2;selected=mask if mask is not None else np.ones(g.shape,bool);lap=float(lap_image[selected].var());grad=float(grad_image[selected].mean());return dict(laplacian=lap,gradient=grad,edge_frequency=lap/(grad+1e-9))
def contiguous(mask):
 rows=[];start=None
 for i,v in enumerate([*mask,False]):
  if v and start is None:start=i
  if not v and start is not None:rows.append((start,i));start=None
 return rows

def capabilities():
 def table(flag):
  p=subprocess.run(['ffmpeg','-hide_banner',flag],capture_output=True,text=True,timeout=20)
  if p.returncode:raise RuntimeError(p.stderr)
  return p.stdout
 mux=table('-muxers');enc=table('-encoders');filt=table('-filters');needs={'muxers':['rawvideo','mp4','image2'],'encoders':['rawvideo','libx264','aac'],'filters':['fps','scale','format','freezedetect']};missing=[]
 for kind,names in needs.items():
  source={'muxers':mux,'encoders':enc,'filters':filt}[kind]
  for name in names:
   if not any(name in line.split()[1:2] or (kind=='muxers' and name in (line.split()[1].split(',') if len(line.split())>1 else [])) for line in source.splitlines()):missing.append(kind+'/'+name)
 version=subprocess.check_output(['ffmpeg','-hide_banner','-version'],text=True).splitlines()[0]
 return dict(version=version,required=needs,missing=missing)
