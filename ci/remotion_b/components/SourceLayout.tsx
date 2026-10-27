import React from 'react';
import {AbsoluteFill,OffthreadVideo,Sequence,staticFile} from 'remotion';
import {UniformVideo} from './UniformVideo';
export function sourceLayout(clip:any,width:number,height:number,physicalScale=1){
 const sourceW=clip.source_width,sourceH=clip.source_height;
 if(!(sourceW>0&&sourceH>0))throw Error('G3 missing measured source dimensions');
 const coverScale=Math.max(width*physicalScale/sourceW,height*physicalScale/sourceH);
 if(height>width&&coverScale>1){
  if(!clip.panel_src)throw Error('G3 insufficient source: split layout requires simulation panel');
  return {kind:'split',video:{x:0,y:112,width,height:width*sourceH/sourceW},panel:{x:0,y:448,width,height:height/2},scale:width*physicalScale/sourceW};
 }
 const scale=Math.min(width*physicalScale/sourceW,height*physicalScale/sourceH);
 if(scale>1)return {kind:'bounded',video:{x:(width-sourceW/physicalScale)/2,y:(height-sourceH/physicalScale)/2,width:sourceW/physicalScale,height:sourceH/physicalScale},panel:null,scale:1};
 return {kind:'full',video:{x:0,y:0,width,height},panel:null,scale};
}
export const SourceLayout:React.FC<{clip:any;width:number;height:number;opacity:number;start:number;frames:number;physicalScale?:number}>=({clip,width,height,opacity,start,frames,physicalScale=1})=>{
 const layout=sourceLayout(clip,width,height,physicalScale);
 return <Sequence from={start} durationInFrames={frames}><AbsoluteFill style={{backgroundColor:'#8E969D',opacity}}>
  <div data-audit-layout="real-video" data-asset={clip.id} style={{position:'absolute',left:layout.video.x,top:layout.video.y,width:layout.video.width,height:layout.video.height}}><UniformVideo src={staticFile(clip.src)} sourceWidth={clip.source_width} sourceHeight={clip.source_height} layerId={'gemini-'+clip.id} startFrom={Math.round(clip.in*30)} slot={{x:0,y:0,width:layout.video.width,height:layout.video.height}} mode={layout.kind==='full'&&height>width?'cover':'contain'}/><div data-audit="gemini" data-source-asset={clip.id} style={{position:'absolute',left:layout.video.width*.05,top:Math.max(12,height*.04+62-layout.video.y),maxWidth:layout.video.width*.9,fontSize:height>width?18:16,color:'white',background:'rgba(28,35,43,.95)',padding:'4px 8px'}}>{clip.label}</div></div>
  {layout.panel&&<div data-audit-layout="simulation-panel" data-asset={clip.id} style={{position:'absolute',left:layout.panel.x,top:layout.panel.y,width:layout.panel.width,height:layout.panel.height}}><UniformVideo src={staticFile(clip.panel_src)} sourceWidth={clip.panel_dimensions.width} sourceHeight={clip.panel_dimensions.height} layerId={'panel-'+clip.id} slot={{x:0,y:0,width:layout.panel.width,height:layout.panel.height}}/></div>}
 </AbsoluteFill></Sequence>
};
