"""Renderer state-change telemetry to disjoint visible annotation intervals."""
def visibility_intervals(snapshots,name,text,start,end,fps=30):
 ordered=sorted(snapshots,key=lambda z:z['frame'])
 def present(z):return any(q['name']==name and q.get('text')==text for q in z['boxes'])
 prior=[z for z in ordered if z['frame']/fps<=start]
 initial=prior[-1] if prior else next((z for z in ordered if start<=z['frame']/fps<min(end,start+.25)),None)
 state=bool(initial and present(initial));begin=start if state else None;out=[]
 for z in ordered:
  t=z['frame']/fps
  if t<start or t>=end:continue
  visible=present(z)
  if visible==state:continue
  if state and begin<t:out.append((begin,t))
  state=visible;begin=t if state else None
 if state and begin<end:out.append((begin,end))
 return out
