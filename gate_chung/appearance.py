"""G10/G11: content-independent rendered surface and overlay checks.

Simulation ROIs and overlay inventories are part of the renderer's plan, not
genre-specific exceptions. Text is masked; vessel rims and physical objects
belong to the simulation, whereas editorial arrows/lines/HUDs are overlays.
"""
import math
import cv2
import numpy as np
from .model import active,bbox,pixels
from . import policy as P

def row(start,end,ok,detail,**kw):return dict(start=float(start),end=float(end),passed=bool(ok),detail=detail,**kw)

def dominant_lab_fraction(image,mask=None):
 """Largest CIE76 ΔE<3 colour population, measured in actual RGB pixels.
 Quantized candidates only choose centres; membership uses unquantized Lab.
 A small palette of exact dominant centres plus neighbours avoids bin-edge
 escapes. Deterministic subsampling bounds runtime without changing colours.
 """
 lab=cv2.cvtColor(image.astype(np.float32)/255,cv2.COLOR_RGB2LAB)
 a=lab.reshape(-1,3) if mask is None else lab[mask]
 if not len(a):return 1.,[0,0,0]
 a=a[::max(1,len(a)//40000)]
 q=np.floor(a/3).astype(np.int16);bins,counts=np.unique(q,axis=0,return_counts=True)
 candidates=bins[np.argsort(counts)[-16:]]*3+1.5;best=0;centre=None
 for c in candidates:
  nearby=np.linalg.norm(a-c,axis=1)<6
  if not nearby.any():continue
  for C in (c,np.median(a[nearby],axis=0)):
   fraction=float((np.linalg.norm(a-C,axis=1)<P.FLAT_DELTA_E).mean())
   if fraction>best:best=fraction;centre=C.tolist()
 return best,centre

def G10(video,plan):
 regions=plan.get('simulation_regions');rows=[]
 if not regions:return dict(passed=False,rows=[row(0,video.duration,False,'G10 missing renderer simulation-region inventory')])
 for sec in range(math.ceil(video.duration)):
  rows.append(row(sec,min(video.duration,sec+1),any(active(r,min(video.duration-.01,sec+.25)) for r in regions),'G10 simulation-region timeline coverage'))
 for region in regions:
  samples=[]
  for sec in np.arange(region['start']+.25,region['end'],1.):
   if any(active(h,float(sec)) for h in region.get('occluded',[])):continue
   image=video.frame(float(sec));x,y,X,Y=pixels(bbox(region,float(sec)),video.width,video.height);patch=image[y:Y,x:X];mask=np.ones(patch.shape[:2],bool)
   for text in plan.get('texts',[]):
    if active(text,float(sec)):
     a,b,A,B=pixels(bbox(text,float(sec)),video.width,video.height);mask[max(0,b-y):min(Y-y,B-y),max(0,a-x):min(X-x,A-x)]=False
   fraction,centre=dominant_lab_fraction(patch,mask);samples.append((float(sec),fraction,centre))
  # A beat fails when a flat material persists throughout its visible span.
  flat=bool(samples) and all(f>P.FLAT_COLOR_FRACTION for _,f,_ in samples)
  for sec,f,centre in samples:rows.append(row(sec,min(region['end'],sec+1),not flat,'G10 ΔE<3 dominant population; >35% throughout a simulation beat is forbidden',region=region['id'],dominant_fraction=round(f,5),lab_centre=centre,limit=P.FLAT_COLOR_FRACTION,persistent_flat=flat))
  if not samples:rows.append(row(region['start'],region['end'],True,'G10 simulation completely occluded by declared footage',region=region['id']))
 return dict(passed=all(r['passed'] for r in rows),rows=rows)

def G11(video,plan):
 audit=plan.get('overlay_audit',{});overlays=plan.get('nontext_overlays');rows=[]
 if overlays is None or not audit.get('complete') or not audit.get('renderer'):
  return dict(passed=False,rows=[row(0,video.duration,False,'G11 missing measured non-text overlay inventory')])
 for overlay in overlays:
  palette=overlay.get('evidence',{}).get('palette')
  if not palette:
   rows.append(row(overlay['start'],overlay['end'],False,'G11 overlay lacks a pixel signature for independent tracking',overlay=overlay['id']));continue
  last=None;still_start=overlay['start'];bad=[]
  for t in np.arange(overlay['start'],overlay['end']+1e-7,.25):
   t=min(float(t),overlay['end']-1e-6);box=np.asarray(bbox(overlay,t))*[video.width,video.height,video.width,video.height]
   # Track the actual coloured shape, not just producer-provided keyframes.
   image=video.frame(t);mask=np.zeros(image.shape[:2],bool)
   for color in palette:
    color=np.array([int(color.lstrip('#')[i:i+2],16) for i in (0,2,4)])
    mask|=np.linalg.norm(image.astype(float)-color,axis=2)<12
   yy,xx=np.where(mask)
   if not len(xx):rows.append(row(t,min(t+.25,overlay['end']),False,'G11 declared overlay missing from actual pixels',overlay=overlay['id']));continue
   observed=np.array([xx.min(),yy.min(),xx.max()-xx.min()+1,yy.max()-yy.min()+1],float)
   if last is not None and np.max(abs(observed-last))>.5:
    still_start=t;last=observed
   if t-still_start>P.FREEZE_LIMIT_S:bad.append((still_start,t))
   if last is None:last=observed
  if bad:rows.append(row(bad[0][0],bad[-1][1],False,'G11 non-text editorial overlay bbox stationary>2s',overlay=overlay['id']))
  else:rows.append(row(overlay['start'],overlay['end'],True,'G11 overlay bbox changes within2s',overlay=overlay['id']))
 if not overlays:
  for beat in plan['beats']:rows.append(row(beat['start'],beat['end'],True,'G11 renderer inventory: no editorial non-text overlays; physical actors/materials remain simulated',renderer=audit['renderer']))
 return dict(passed=all(r['passed'] for r in rows),rows=rows)
