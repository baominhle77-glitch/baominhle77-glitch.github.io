import React,{useLayoutEffect,useRef} from 'react';
import {registerRoot,Composition,AbsoluteFill,OffthreadVideo,Audio,Sequence,staticFile,useCurrentFrame,useVideoConfig,interpolate} from 'remotion';
import data from '../public/data.json';
import {SourceLayout} from '../components/SourceLayout';
import {useReadyFont} from '../components/FontReady';
import {UniformVideo,measureImageLayers} from '../components/UniformVideo';
import {measureNonTextOverlays} from '../components/OverlayAudit';
const INK='#1C232B';const LIGHT='#A7ADB3';
const titles:Record<string,string>={h1:'What pulls the pepper?',h2:'Clean water pulls harder',h3:'Ring under steady feeding',h4:'Tension drives flow',c1:'Surface pull changes',p1:'Surface drags water'};
const Movie:React.FC<{format:string;shortSide:number}>=({format,shortSide=540})=>{
 const frame=useCurrentFrame();const config=useVideoConfig();const scale=shortSide/540;const width=config.width/scale,height=config.height/scale;const doc=format==='9x16';
 const beat=data.beats.find(b=>frame>=b.start&&frame<b.start+b.frames)!;
 const cap=data.captions.find(c=>frame>=c.start&&frame<c.end);
 const clip=(data.clips as any[]).find(c=>{const s=doc?(c.portrait_start??c.start):c.start;const n=doc?(c.portrait_frames??c.frames):c.frames;return c.available&&s!==null&&frame>=s&&frame<s+n});
 const clipStart=clip?(doc?(clip.portrait_start??clip.start):clip.start):0,clipFrames=clip?(doc?(clip.portrait_frames??clip.frames):clip.frames):0;
 const clipOpacity=clip?(clipStart===0?interpolate(frame-clipStart,[clipFrames-5,clipFrames],[1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}):interpolate(frame-clipStart,[0,5,clipFrames-5,clipFrames],[0,1,1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})):0;
 const local=frame-beat.start;
 const opacity=beat.start===0?1:interpolate(local,[0,8],[0,1],{extrapolateRight:'clamp'});
 const lastAudit=useRef('');const fontReady=useReadyFont();
 useLayoutEffect(()=>{
  if(!fontReady)return;
  const boxes=[...document.querySelectorAll('[data-audit]')].map(el=>{const r=el.getBoundingClientRect();return {name:el.getAttribute('data-audit'),asset:el.getAttribute('data-source-asset'),x:r.x/scale,y:r.y/scale,w:r.width/scale,h:r.height/scale,text:el.textContent,font:parseFloat(getComputedStyle(el).fontSize)}});
  for(const b of boxes){
   if(b.x<width*.03-1||b.y<height*.03-1||b.x+b.w>width*.97+1||b.y+b.h>height*.97+1)throw Error('C13_SAFE '+JSON.stringify(b));
   if(b.name==='caption'&&b.font<28)throw Error('C13_FONT');
  }
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
   const a=boxes[i],b=boxes[j];if(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y)throw Error('C13_OVERLAP '+a.name+' '+b.name);
  }
  const layers=measureImageLayers();for(const layer of layers)if(Math.abs(layer.scale_x/layer.scale_y-1)>.005)throw Error('G9 unequal layer scales '+JSON.stringify(layer));
  const overlays=measureNonTextOverlays();const layouts=[...document.querySelectorAll('[data-audit-layout]')].map(el=>{const r=el.getBoundingClientRect();return {name:el.getAttribute('data-audit-layout'),asset:el.getAttribute('data-asset'),x:r.x/scale,y:r.y/scale,w:r.width/scale,h:r.height/scale}});const key=JSON.stringify({boxes,layouts,layers,overlays});if(key!==lastAudit.current){console.log('B_DOM '+JSON.stringify({frame,format,boxes,layouts,layers,overlays}));lastAudit.current=key;}
 },[frame,fontReady]);
 return <AbsoluteFill style={{backgroundColor:INK,fontFamily:'Noto Sans',color:INK}}><div style={{position:'absolute',width,height,transform:`scale(${scale})`,transformOrigin:'top left'}}>
  <style>{`@font-face{font-family:'Noto Sans';src:url('${staticFile('NotoSans-Regular.ttf')}')}*{box-sizing:border-box}`}</style>
  {data.beats.map(b=><Sequence key={b.id} from={b.start} durationInFrames={b.frames}><UniformVideo src={staticFile(format+'_'+b.id+'.mp4')} sourceWidth={(b as any).media[format].width} sourceHeight={(b as any).media[format].height} layerId={'beat-'+b.id} slot={{x:0,y:0,width,height}} opacity={b.id===beat.id?opacity:1}/></Sequence>)}
  {data.beats.map(b=><Sequence key={'a'+b.id} from={b.audioStart} durationInFrames={Math.min(1800-b.audioStart,b.frames)}><Audio src={staticFile(b.audio)}/></Sequence>)}
  {clip&&<SourceLayout clip={clip} width={width} height={height} opacity={clipOpacity} start={clipStart} frames={clipFrames} physicalScale={scale}/>}
  <div data-audit="title" style={{position:'absolute',left:width*.05,top:height*.04,maxWidth:width*(doc?.82:.70),width:'max-content',fontSize:doc?32:32,fontWeight:700,lineHeight:1.18,color:'white',backgroundColor:INK,padding:'7px 10px'}}>{titles[beat.id]}</div>
  {cap&&<div style={{position:'absolute',left:width*.035,bottom:doc?height*.115:height*.105,width:width*(doc?.82:.93),display:'flex',justifyContent:'center'}}>
    <div data-audit="caption" style={{fontSize:30,fontWeight:800,color:'white',lineHeight:1.2,textAlign:'center',padding:'6px 12px',background:INK,maxWidth:'100%',whiteSpace:doc?'normal':'nowrap'}}>{cap.text}</div>
  </div>}
  <div data-audit="source" style={{position:'absolute',left:width*.05,top:doc?height*.94:height*.93,fontSize:doc?14:13,lineHeight:1.15,backgroundColor:'rgba(167,173,179,.95)',padding:'2px 4px'}}>{beat.id==='h4'?'NIST · Liu · Roché · 25°C · SDS 25 mM (inferred)':'Roché et al. · PRL 2014 · model illustration'}</div>
 </div></AbsoluteFill>
};
const Root=()=> <>{['16x9','9x16'].map(format=><Composition key={format} id={'B-'+format} component={Movie} defaultProps={{format,shortSide:540}} calculateMetadata={({props})=>({width:Math.round((props.format==='16x9'?960:540)*props.shortSide/540),height:Math.round((props.format==='16x9'?540:960)*props.shortSide/540)})} durationInFrames={1800} fps={30} width={format==='16x9'?960:540} height={format==='16x9'?540:960}/>)}</>;
registerRoot(Root);
