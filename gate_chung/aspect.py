"""G9: content-independent source-to-frame geometry, including declared crops."""
from pathlib import Path
import math
import cv2,numpy as np
from .video import Video,gray
from .model import active,pixels

STATIC_TOLERANCE=.005
PIXEL_TOLERANCE=.01

def relative_ratio(a,b):return abs(a/b-1) if a>0 and b>0 else math.inf

def fit(source,viewport,mode='contain',crop=None):
 """One scalar, never independently fit width and height."""
 w,h=source;x,y,W,H=viewport;cx,cy,cw,ch=crop or [0,0,1,1]
 if min(w,h,W,H,cw,ch)<=0 or mode not in ('contain','cover'):raise ValueError('invalid uniform-fit geometry')
 s=(min if mode=='contain' else max)(W/(w*cw),H/(h*ch))
 return dict(scale_x=s,scale_y=s,content_bbox=[x+(W-w*cw*s)/2,y+(H-h*ch*s)/2,w*cw*s,h*ch*s],viewport=list(viewport),source_crop=[cx,cy,cw,ch],mode=mode)

def measure_affine(source,rendered,viewport):
 """Measure the actual two axis scales from independent SIFT correspondences.
 ROI is the clipping viewport, not a self-reported content box. RANSAC rejects
 captions, occlusions and other layers. No inferred geometry means gate red.
 """
 x,y,X,Y=pixels(viewport,rendered.shape[1],rendered.shape[0]);target=rendered[y:Y,x:X]
 detector=cv2.SIFT_create(nfeatures=3500,contrastThreshold=.018)
 ka,da=detector.detectAndCompute(gray(source),None);kb,db=detector.detectAndCompute(gray(target),None)
 if da is None or db is None:return dict(passed=False,reason='not enough source/render features')
 pairs=cv2.BFMatcher().knnMatch(da,db,k=2);good=[m for pair in pairs if len(pair)==2 for m,n in [pair] if m.distance<.72*n.distance]
 if len(good)<8:return dict(passed=False,reason='fewer than8 matched features',matches=len(good))
 a=np.float32([ka[m.queryIdx].pt for m in good]);b=np.float32([kb[m.trainIdx].pt for m in good]);matrix,inliers=cv2.estimateAffine2D(a,b,method=cv2.RANSAC,ransacReprojThreshold=1.8,maxIters=4000,confidence=.995,refineIters=20)
 if matrix is None:return dict(passed=False,reason='affine registration failed')
 use=inliers[:,0].astype(bool);count=int(use.sum());support=np.ptp(a[use],axis=0) if count else np.zeros(2)
 # A tiny matching patch cannot prove a whole panel's aspect ratio.
 if count<8 or min(support)<12:return dict(passed=False,reason='insufficient two-dimensional feature support',inliers=count)
 axes=np.linalg.svd(matrix[:,:2],compute_uv=False);error=relative_ratio(axes[0],axes[1]);corners=np.float32([[0,0,1],[source.shape[1],0,1],[source.shape[1],source.shape[0],1],[0,source.shape[0],1]])@matrix.T;lo=corners.min(axis=0);hi=corners.max(axis=0)
 return dict(passed=error<=PIXEL_TOLERANCE,axis_scale=list(map(float,axes)),anisotropy=round(error,6),inliers=count,source_support=list(map(float,support)),measured_bbox=[float(lo[0]+x),float(lo[1]+y),float(hi[0]-lo[0]),float(hi[1]-lo[1])],matrix=matrix.tolist())

def G9(video,plan):
 rows=[];sources={}
 def add(start,end,ok,detail,**kw):rows.append(dict(start=round(start,3),end=round(end,3),passed=bool(ok),detail=detail,**kw))
 layers=plan.get('layers',[])
 if not layers:add(0,video.duration,False,'G9 missing image-layer source/layout registry')
 for sec in range(math.ceil(video.duration)):
  t=min(sec+.5,video.duration-.05);visible=[p for p in layers if active(p,t) and not any(active(h,t) for h in p.get('occluded',[]))]
  add(sec,min(sec+1,video.duration),bool(visible),'G9 source-layer coverage',layers=[p['id'] for p in visible])
 try:
  for layer in layers:
   name=layer['id'];start,end=layer['start'],layer['end'];source=Path(layer['source']);crop=layer.get('source_crop',[0,0,1,1]);viewport=layer['viewport'];box=layer['content_bbox'];sx,sy=layer['scale_x'],layer['scale_y'];kind=layer.get('fit','contain')
   if not source.exists():add(start,end,False,'G9 original source is missing',layer=name,source=str(source));continue
   if source.suffix.lower() in ('.png','.jpg','.jpeg','.webp'):
    still=cv2.cvtColor(cv2.imread(str(source)),cv2.COLOR_BGR2RGB);w,h=still.shape[1],still.shape[0];decoder=None
   else:
    if str(source) not in sources:sources[str(source)]=Video(source)
    decoder=sources[str(source)];w,h=decoder.width,decoder.height
   valid_crop=len(crop)==4 and min(crop)>=0 and crop[2]>0 and crop[3]>0 and crop[0]+crop[2]<=1.00001 and crop[1]+crop[3]<=1.00001
   source_ratio=w*crop[2]/(h*crop[3]);box_ratio=box[2]*video.width/(box[3]*video.height);axis_error=relative_ratio(sx,sy);ratio_error=relative_ratio(box_ratio,source_ratio)
   clipped=box[0]<viewport[0]-.001 or box[1]<viewport[1]-.001 or box[0]+box[2]>viewport[0]+viewport[2]+.001 or box[1]+box[3]>viewport[1]+viewport[3]+.001
   measured_scales=[box[2]*video.width/(w*crop[2]),box[3]*video.height/(h*crop[3])];scale_consistency=max(relative_ratio(sx,measured_scales[0]),relative_ratio(sy,measured_scales[1]))
   static_ok=valid_crop and axis_error<=STATIC_TOLERANCE and ratio_error<=STATIC_TOLERANCE and scale_consistency<=STATIC_TOLERANCE and (not clipped or (kind=='cover' and layer.get('crop_declared') is True))
   add(start,end,static_ok,'G9 static source ratio / equal scales / explicit crop',layer=name,source_dimensions=[w,h],source_crop=crop,scale_x=sx,scale_y=sy,scale_error=round(axis_error,6),aspect_error=round(ratio_error,6),crop_declared=layer.get('crop_declared',False),limit=STATIC_TOLERANCE)
   if not valid_crop:continue
   samples=[min(end-.04,sec+.5) for sec in range(math.floor(start),math.ceil(end)) if start+.20<=min(end-.04,sec+.5)<end-.05]
   for t in samples:
    if any(active(hidden,t) for hidden in layer.get('occluded',[])):continue
    clock=(t-layer.get('timeline_origin',start))*layer.get('playback_rate',1)+layer.get('source_in',0)
    if decoder is not None and not 0<=clock<decoder.duration:add(t,t,False,'G9 source clock out of range',layer=name,source_time=clock);continue
    original=decoder.frame(clock) if decoder else still;x,y,X,Y=pixels(crop,w,h);original=original[y:Y,x:X];measurement=measure_affine(original,video.frame(t),viewport)
    add(t,min(t+1,end),measurement.pop('passed'),'G9 pixel registration: source and rendered panel must have equal axis scales',layer=name,source_time=round(clock,4),limit=PIXEL_TOLERANCE,**measurement)
 finally:
  for decoder in sources.values():decoder.close()
 return dict(passed=bool(rows) and all(r['passed'] for r in rows),rows=rows)
