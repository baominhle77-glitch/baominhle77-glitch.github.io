"""Fingerprint only code reachable by one beat; no opaque cross-beat cache reuse."""
import ast,hashlib,json
from pathlib import Path
H=Path(__file__).resolve().parent
class Specialize(ast.NodeTransformer):
 def __init__(self,beat):self.beat=beat
 def visit_Name(self,node):return ast.copy_location(ast.Constant(self.beat),node) if node.id=='BID' else node
 def truth(self,test):
  try:
   names=[x for x in ast.walk(test) if isinstance(x,ast.Name)]
   if names:return None
   return bool(eval(compile(ast.Expression(ast.fix_missing_locations(test)),'<constant-beat>','eval'),{'__builtins__':{}}))
  except Exception:return None
 def visit_If(self,node):
  node=self.generic_visit(node);v=self.truth(node.test)
  return (node.body if v else node.orelse) if v is not None else node
 def visit_IfExp(self,node):
  node=self.generic_visit(node);v=self.truth(node.test)
  return (node.body if v else node.orelse) if v is not None else node

def key(beat,short_side=540):
 tree=Specialize(beat).visit(ast.parse((H/'scene.py').read_text()))
 methods={'construct','add_world','update','construct'}
 for node in tree.body:
  if isinstance(node,ast.ClassDef) and node.name=='BScene':node.body=[x for x in node.body if not isinstance(x,ast.FunctionDef) or x.name in methods]
 plan=json.loads((H/'full_timeline.json').read_text());b=next(b for b in plan['beats'] if b['id']==beat)
 digest=hashlib.sha256(ast.dump(tree,include_attributes=False).encode())
 for p in ('prepare.py','beat_cache.py','stage_spec.py','stage_khuon.py','../../ci_requirements.txt'):digest.update((H/p).resolve().read_bytes())
 for p in sorted((H/'../simulation').resolve().glob('*.py')):digest.update(p.read_bytes())
 bv=json.loads((H/'ban_ve_B60.json').read_text());content=next(b for b in bv['beats'] if b['id']==beat)
 render_content={k:content[k] for k in ('optics','optics_duoi','khung','su_kien','goc_can','content_scene','aggregation_start','ring_content','ring_content_duoi') if k in content};digest.update(json.dumps([bv['bo_cuc_doc'],render_content],sort_keys=True).encode())
 digest.update(json.dumps([beat,b['frames'],short_side,30,'full-v1']).encode())
 content_scene=content.get('content_scene')
 files={'wine_teaser':('wine_scene.py','wine_teaser.py'),'micelle_scene':('micelle_scene.py','ring_scene.py'),'diffusion_scene':('diffusion_scene.py',),'ring_scene':('ring_scene.py',)}.get(content_scene,())
 for p in files:digest.update((H/p).read_bytes())
 return digest.hexdigest()
if __name__=='__main__':
 import argparse
 p=argparse.ArgumentParser();p.add_argument('--beat',required=True);p.add_argument('--short-side',type=int,default=540);a=p.parse_args();print(key(a.beat,a.short_side))
