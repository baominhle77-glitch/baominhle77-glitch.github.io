"""Shared producer helper: remove bounded display padding, never hide bad clocks."""
def nonoverlapping(captions,tolerance_frames=6):
 result=[dict(c) for c in sorted(captions,key=lambda c:c['start'])]
 for a,b in zip(result,result[1:]):
  if a['end']>b['start']:
   if a['end']-b['start']>tolerance_frames:raise ValueError('Caption clocks overlap by more than0.2s')
   a['end']=b['start']
  if a['end']<=a['start']:raise ValueError('Empty caption interval')
 return result
