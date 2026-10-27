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
 methods={'construct','add_world','update',{'h1':'plate_scene','h2':'plate_scene','h3':'plate_scene','h4':'molecular_scene','c1':'molecular_scene','p1':'section_scene'}[beat]}
 for node in tree.body:
  if isinstance(node,ast.ClassDef) and node.name=='BScene':node.body=[x for x in node.body if not isinstance(x,ast.FunctionDef) or x.name in methods]
 plan=json.loads((H/'ke_hoach_A.json').read_text());b=plan['beats'][beat]
 digest=hashlib.sha256(ast.dump(tree,include_attributes=False).encode())
 for p in ('prepare.py','beat_cache.py','../../ci_requirements.txt'):digest.update((H/p).resolve().read_bytes())
 if beat in ('h1','h2','h3'):
  digest.update((H/'../frame_layout.py').resolve().read_bytes());digest.update(json.dumps(json.loads((H/'portrait_layouts.json').read_text())[beat],sort_keys=True).encode())
 digest.update(json.dumps([beat,b['so_khung'],b['t0'],short_side,30,'v3']).encode())
 return digest.hexdigest()
if __name__=='__main__':
 import argparse
 p=argparse.ArgumentParser();p.add_argument('--beat',required=True);p.add_argument('--short-side',type=int,default=540);a=p.parse_args();print(key(a.beat,a.short_side))
