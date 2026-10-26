import React,{useLayoutEffect} from 'react';
import {registerRoot,Composition,AbsoluteFill,OffthreadVideo,Audio,Sequence,staticFile,useCurrentFrame,useVideoConfig,interpolate} from 'remotion';
import data from '../public/data.json';
const INK='#1C232B';const LIGHT='#A7ADB3';
const titles:Record<string,string>={h1:'What pulls the pepper?',h2:'Clean water pulls harder',h3:'Ring under steady feeding',h4:'Tension drives flow',c1:'Molecular model',p1:'Surface drags water'};
const Movie:React.FC<{format:string;shortSide:number}>=({format,shortSide=540})=>{
 const frame=useCurrentFrame();const config=useVideoConfig();const scale=shortSide/540;const width=config.width/scale,height=config.height/scale;const doc=format==='9x16';
 const beat=data.beats.find(b=>frame>=b.start&&frame<b.start+b.frames)!;
 const cap=data.captions.find(c=>frame>=c.start&&frame<c.end);
 const clip=data.clips.find(c=>c.available&&c.start!==null&&frame>=c.start&&frame<c.start+c.frames);
 const clipOpacity=clip?(clip.start===0?interpolate(frame-clip.start,[clip.frames-5,clip.frames],[1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}):interpolate(frame-clip.start,[0,5,clip.frames-5,clip.frames],[0,1,1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})):0;
 const local=frame-beat.start;
 const opacity=beat.start===0?1:interpolate(local,[0,8],[0,1],{extrapolateRight:'clamp'});
 useLayoutEffect(()=>{
  const boxes=[...document.querySelectorAll('[data-audit]')].map(el=>{const r=el.getBoundingClientRect();return {name:el.getAttribute('data-audit'),x:r.x/scale,y:r.y/scale,w:r.width/scale,h:r.height/scale,text:el.textContent,font:parseFloat(getComputedStyle(el).fontSize)}});
  const pip=doc?{x:31,y:133,w:188,h:121}:{x:776,y:18,w:166,h:105};
  for(const b of boxes){
   if(b.x<width*.03-1||b.y<height*.03-1||b.x+b.w>width*.97+1||b.y+b.h>height*.97+1)throw Error('C13_SAFE '+JSON.stringify(b));
   if(b.x<pip.x+pip.w&&b.x+b.w>pip.x&&b.y<pip.y+pip.h&&b.y+b.h>pip.y)throw Error('C13_PIP '+JSON.stringify(b));
   if(b.name==='caption'&&b.font<28)throw Error('C13_FONT');
  }
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
   const a=boxes[i],b=boxes[j];if(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y)throw Error('C13_OVERLAP '+a.name+' '+b.name);
  }
  if(local===0||cap?.start===frame)console.log('B_DOM '+JSON.stringify({frame,format,boxes}));
 },[frame]);
 return <AbsoluteFill style={{backgroundColor:INK,fontFamily:'Noto Sans',color:INK}}><div style={{position:'absolute',width,height,transform:`scale(${scale})`,transformOrigin:'top left'}}>
  <style>{`@font-face{font-family:'Noto Sans';src:url('${staticFile('NotoSans-Regular.ttf')}')}*{box-sizing:border-box}`}</style>
  {data.beats.map(b=><Sequence key={b.id} from={b.start} durationInFrames={b.frames}><OffthreadVideo src={staticFile(format+'_'+b.id+'.mp4')} muted style={{width:'100%',height:'100%',opacity:b.id===beat.id?opacity:1}}/></Sequence>)}
  {data.beats.map(b=><Sequence key={'a'+b.id} from={b.audioStart} durationInFrames={Math.min(1800-b.audioStart,b.frames)}><Audio src={staticFile(b.audio)}/></Sequence>)}
  {clip&&<Sequence from={clip.start!} durationInFrames={clip.frames}><AbsoluteFill style={{backgroundColor:INK,opacity:clipOpacity}}><OffthreadVideo src={staticFile(clip.src!)} startFrom={Math.round(clip.in*30)} muted style={{position:'absolute',width:'100%',height:'100%',objectFit:doc?'cover':'contain',objectPosition:`${clip.focus_x||50}% ${clip.focus_y||50}%`}}/><div data-audit="gemini" style={{position:'absolute',left:width*.05,top:height*.30,fontSize:doc?18:16,color:'white',background:'rgba(28,35,43,.85)',padding:'4px 8px'}}>{clip.label}</div></AbsoluteFill></Sequence>}
  <div data-audit="title" style={{position:'absolute',left:width*.05,top:height*.04,maxWidth:width*(doc?.82:.70),width:'max-content',fontSize:doc?32:32,fontWeight:700,lineHeight:1.18,color:'white',backgroundColor:INK,padding:'7px 10px'}}>{titles[beat.id]}</div>
  {!clip&&['h4','c1','p1'].includes(beat.id)&&<>
    {beat.id==='p1'&&<div data-audit="model-label" style={{position:'absolute',left:width*(doc?.50:.52),top:height*(doc?.125:.04),fontSize:18,fontWeight:700,color:'white',backgroundColor:INK,padding:'6px 8px'}}>Flow cross-section · model</div>}
    {beat.id==='h4'&&<div data-audit="mechanism" style={{position:'absolute',left:width*(doc?.50:.52),top:height*(doc?.125:.04),fontSize:18,lineHeight:1.3,fontWeight:700,color:'white',backgroundColor:INK,padding:'6px 8px'}}>Surface tension falls<div style={{width:180,height:12,marginTop:6,backgroundColor:LIGHT}}><div style={{height:12,width:(1-.50*(.10+.88*interpolate(local,[0,beat.frames],[0,1],{extrapolateRight:'clamp'})))*180,backgroundColor:'#D1834F'}}/></div></div>}
    {beat.id==='c1'&&<div data-audit="molecule-legend" style={{position:'absolute',left:width*(doc?.50:.52),top:height*(doc?.125:.04),fontSize:18,lineHeight:1.3,fontWeight:700,color:'white',backgroundColor:INK,padding:'6px 8px'}}><div>Water-loving head</div><div style={{marginTop:6}}>Water-repelling tail</div></div>}
    {beat.id!=='p1'&&<div data-audit="weak-pull" style={{position:'absolute',left:width*(doc?.50:.52),top:height*(doc?.22:.16),fontSize:20,fontWeight:700,color:'white',backgroundColor:INK,padding:'6px 8px'}}>Weaker pull</div>}
  </>}
  {cap&&<div style={{position:'absolute',left:width*.035,bottom:doc?height*.115:height*.105,width:width*(doc?.82:.93),display:'flex',justifyContent:'center'}}>
    <div data-audit="caption" style={{fontSize:30,fontWeight:800,color:'white',lineHeight:1.2,textAlign:'center',padding:'6px 12px',background:'rgba(28,35,43,.84)',maxWidth:'100%',whiteSpace:doc?'normal':'nowrap'}}>{cap.text}</div>
  </div>}
  <div data-audit="source" style={{position:'absolute',left:width*.05,top:doc?height*.94:height*.93,fontSize:doc?14:13,lineHeight:1.15,backgroundColor:'rgba(167,173,179,.95)',padding:'2px 4px'}}>{beat.id==='h4'?'NIST · Liu · Roché · 25°C · SDS 25 mM (inferred)':'Roché et al. · PRL 2014 · model illustration'}</div>
 </div></AbsoluteFill>
};
const Root=()=> <>{['16x9','9x16'].map(format=><Composition key={format} id={'B-'+format} component={Movie} defaultProps={{format,shortSide:540}} calculateMetadata={({props})=>({width:Math.round((props.format==='16x9'?960:540)*props.shortSide/540),height:Math.round((props.format==='16x9'?540:960)*props.shortSide/540)})} durationInFrames={1800} fps={30} width={format==='16x9'?960:540} height={format==='16x9'?540:960}/>)}</>;
registerRoot(Root);
