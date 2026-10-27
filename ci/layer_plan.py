"""Shared bridge from measured renderer DOM to the content-neutral G9 schema."""
from pathlib import Path

def measured_layers(dom,width,height,specs):
 result=[];declared={x['id'] for x in specs};observed={x['id'] for z in dom for x in z.get('layers',[])}
 if observed-declared:raise ValueError('G9 image layers lack source declarations: '+str(sorted(observed-declared)))
 for spec in specs:
  choices=[(abs(z['frame']/30-(spec['start']+.4)),q) for z in dom if spec['start']+.2<=z['frame']/30<spec['end'] for q in z.get('layers',[]) if q['id']==spec['id'] and min(q['w'],q['h'])>0]
  if not choices:raise ValueError('G9 missing measured DOM geometry: '+spec['id'])
  q=min(choices,key=lambda x:x[0])[1];v=q['viewport'];result.append(dict(spec,source=str(Path(spec['source']).resolve()),scale_x=q['scale_x'],scale_y=q['scale_y'],content_bbox=[q['x']/width,q['y']/height,q['w']/width,q['h']/height],viewport=[v['x']/width,v['y']/height,v['w']/width,v['h']/height],fit=q['fit'],crop_declared=q['fit']=='cover'))
 return result

def nested_layers(items,prefix,start,end,source_root,occluded):
 return [dict(item,id=prefix+'-'+item['id'],source=str((Path(source_root)/Path(item['source']).name).resolve()),start=start,end=end,timeline_origin=start,occluded=occluded) for item in items]
