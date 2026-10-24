import sys,glob,os
from PIL import Image,ImageDraw,ImageFont
d,ra,cot,rong=sys.argv[1],sys.argv[2],int(sys.argv[3]),int(sys.argv[4])
fs=sorted(glob.glob(d+'/t_*.jpg'))
if len(sys.argv)>6: fs=[f for f in fs if float(sys.argv[5])<=float(os.path.basename(f)[2:-4])<=float(sys.argv[6])]
a=[Image.open(f) for f in fs]; cao=int(a[0].height*rong/a[0].width)
S=Image.new('RGB',(cot*rong,((len(a)+cot-1)//cot)*(cao+18)),(20,20,20)); dr=ImageDraw.Draw(S)
f=ImageFont.truetype('DejaVuSans.ttf',13)
for i,(im,fn) in enumerate(zip(a,fs)):
  x,y=(i%cot)*rong,(i//cot)*(cao+18); S.paste(im.resize((rong,cao)),(x,y+18)); dr.text((x+3,y+2),os.path.basename(fn)[2:-4],fill='white',font=f)
S.save(ra,quality=80)
