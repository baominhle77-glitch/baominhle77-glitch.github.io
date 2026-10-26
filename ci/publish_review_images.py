"""Host actual run JPGs on an append-only evidence branch for Job Summary.

GitHub Summary cannot embed local files, data URIs or artifact ZIPs. This uses
GitHub's Git Data API with the run's token, never modifying the PR/source ref.
The branch and immutable image URLs contain rendered public-repo evidence only.
"""
import argparse,base64,json,os,time,urllib.error,urllib.request
from pathlib import Path

BRANCH='k1t3-review-evidence'

def api(method,path,payload=None):
 token=os.environ['GH_TOKEN']
 data=None if payload is None else json.dumps(payload).encode('utf-8')
 request=urllib.request.Request('https://api.github.com/repos/'+os.environ['GITHUB_REPOSITORY']+'/'+path,data=data,method=method,headers={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'k1t3-evidence','Content-Type':'application/json'})
 with urllib.request.urlopen(request,timeout=40) as response:return json.load(response)

def head():
 try:return api('GET','git/ref/heads/'+BRANCH)['object']['sha']
 except urllib.error.HTTPError as e:
  if e.code==404:return None
  raise

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--root',type=Path,required=True);a=parser.parse_args()
 if not all(os.environ.get(name) for name in ('GH_TOKEN','GITHUB_RUN_ID','GITHUB_SHA','GITHUB_REPOSITORY')):
  raise SystemExit('Only run inside GitHub Actions with its scoped token')
 run_id=os.environ['GITHUB_RUN_ID'];attempt=os.environ.get('GITHUB_RUN_ATTEMPT','1');repo=os.environ['GITHUB_REPOSITORY'];source=os.environ['GITHUB_SHA']
 images=[]
 for fmt in ('16x9','9x16'):
  sheets=list(a.root.rglob('contact_sheet_'+fmt+'.jpg'))
  if len(sheets)>1:raise SystemExit('Ambiguous current-run contact sheet: '+fmt)
  if sheets:images.append((fmt,sheets[0]))
 # A dispatch may render only one beat. Embed its actual timeline, clearly named.
 if not images:
  for path in a.root.rglob('timeline.jpg'):
   fmt=next((p for p in path.parts if p in ('16x9','9x16')),None)
   if fmt:images.append((fmt+'_'+path.parent.name,path))
 if not images:raise SystemExit('No current-run images to publish; render did not produce evidence')
 tree_entries=[];image_names=[]
 for label,path in images:
  relative=run_id+'-'+attempt+'/'+label+'.jpg'
  blob=api('POST','git/blobs',{'content':base64.b64encode(path.read_bytes()).decode('ascii'),'encoding':'base64'})
  tree_entries.append({'path':relative,'mode':'100644','type':'blob','sha':blob['sha']});image_names.append((label,relative))
 for retry in range(3):
  old=head();payload={'tree':tree_entries}
  if old:payload['base_tree']=api('GET','git/commits/'+old)['tree']['sha']
  tree=api('POST','git/trees',payload)
  commit=api('POST','git/commits',{'message':f'K1 t3 run {run_id} attempt {attempt}: rendered review images','tree':tree['sha'],'parents':[old] if old else [],'author':{'name':'github-actions[bot]','email':'41898282+github-actions[bot]@users.noreply.github.com'}})
  try:
   if old:api('PATCH','git/refs/heads/'+BRANCH,{'sha':commit['sha'],'force':False})
   else:api('POST','git/refs',{'ref':'refs/heads/'+BRANCH,'sha':commit['sha']})
   break
  except urllib.error.HTTPError as error:
   if error.code not in (409,422) or retry==2:raise
   # Another run may have appended evidence. Rebase the image tree on that head.
   if head()==old:raise
 else:raise SystemExit('Could not append run images')
 report={'run_id':run_id,'attempt':attempt,'source_sha':source,'evidence_sha':commit['sha'],'branch':BRANCH,'images':[{'label':label,'url':f'https://raw.githubusercontent.com/{repo}/{commit["sha"]}/{path}'} for label,path in image_names]}
 (a.root/'published_images.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
 print('Published current-run evidence:',commit['sha'],flush=True)

if __name__=='__main__':main()
