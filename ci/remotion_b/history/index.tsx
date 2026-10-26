import React,{useLayoutEffect,useRef} from 'react';
import {AbsoluteFill,OffthreadVideo,Audio,Composition,registerRoot,useCurrentFrame,useVideoConfig,staticFile} from 'remotion';
import voice from '../public/history_voice.json';
import {useReadyFont} from '../components/FontReady';
const Movie:React.FC<{format:string}>=({format})=>{
 const frame=useCurrentFrame(),{width,height}=useVideoConfig();const doc=format==='9x16';const t=frame/30;const cap=voice.captions.find(c=>c.start<=t&&t<c.end);const year=t<8?1600:t<12?1601:t<16?1602:1603;const prev=useRef('');const fontReady=useReadyFont();
 useLayoutEffect(()=>{if(!fontReady)return;const boxes=[...document.querySelectorAll('[data-audit]')].map(e=>{const r=e.getBoundingClientRect();return {name:e.getAttribute('data-audit'),text:e.textContent,x:r.x,y:r.y,w:r.width,h:r.height,font:parseFloat(getComputedStyle(e).fontSize)}});const key=JSON.stringify(boxes);if(key!==prev.current){console.log('B_DOM '+JSON.stringify({frame,format,boxes}));prev.current=key;}},[frame,fontReady]);
 return <AbsoluteFill style={{backgroundColor:'#8E969D',fontFamily:'Noto Sans',color:'white'}}><style>{`@font-face{font-family:'Noto Sans';src:url('${staticFile('NotoSans-Regular.ttf')}')}*{box-sizing:border-box}`}</style><OffthreadVideo src={staticFile('history_'+format+'.mp4')} muted/><Audio src={staticFile('history_voice.wav')}/>
 <div data-audit="title" style={{position:'absolute',left:width*.05,top:height*.04,fontSize:32,fontWeight:700,backgroundColor:'#1C232B',padding:'6px 10px'}}>Fictional campaign</div>
 <div data-audit="year" style={{position:'absolute',left:width*.65,top:height*(doc?.14:.14),fontSize:30,fontWeight:700,backgroundColor:'#1C232B',padding:'6px 10px'}}>{year}</div>
 <div data-audit="compass" style={{position:'absolute',left:width*.65,top:height*(doc?.21:.27),fontSize:22,fontWeight:700,backgroundColor:'#1C232B',padding:'5px 8px'}}>North · East</div>
 {cap&&<div style={{position:'absolute',left:width*.05,width:width*.9,top:height*(doc?.86:.81),display:'flex',justifyContent:'center'}}><div data-audit="caption" style={{fontSize:30,fontWeight:700,lineHeight:1.2,backgroundColor:'#1C232B',padding:'6px 12px',textAlign:'center'}}>{cap.text}</div></div>}
 <div data-audit="source" style={{position:'absolute',left:width*.05,top:height*(doc?.94:.93),fontSize:doc?14:13,lineHeight:1.15,color:'#1C232B',backgroundColor:'#A7ADB3',padding:'2px 4px'}}>Fictional scenario · Flite TTS · test fixture</div></AbsoluteFill>
};
const Root=()=> <>{['16x9','9x16'].map(format=><Composition key={format} id={'History-'+format} component={Movie} defaultProps={{format}} durationInFrames={600} fps={30} width={format==='16x9'?960:540} height={format==='16x9'?540:960}/>)}</>;registerRoot(Root);
