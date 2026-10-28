import React from 'react';
import {AbsoluteFill,OffthreadVideo,Sequence,staticFile} from 'remotion';
import {UniformVideo} from './UniformVideo';
export function sourceLayout(clip:any,width:number,height:number,physicalScale=1,portraitTop=.4){
 const sourceW=clip.source_width,sourceH=clip.source_height;
 if(!(sourceW>0&&sourceH>0))throw Error('G3 missing measured source dimensions');
 const coverScale=Math.max(width*physicalScale/sourceW,height*physicalScale/sourceH);
 if(height>width&&coverScale>1){
  if(!clip.panel_src&&!clip.native_underlay)throw Error('G3 insufficient source: split layout requires simulation panel');
  return {kind:'split',video:{x:0,y:(height*portraitTop-width*sourceH/sourceW)/2,width,height:width*sourceH/sourceW},panel:{x:0,y:height*portraitTop,width,height:height*(1-portraitTop)},scale:width*physicalScale/sourceW};
 }
 const scale=Math.min(width*physicalScale/sourceW,height*physicalScale/sourceH);
 if(scale>1)return {kind:'bounded',video:{x:(width-sourceW/physicalScale)/2,y:(height-sourceH/physicalScale)/2,width:sourceW/physicalScale,height:sourceH/physicalScale},panel:null,scale:1};
 return {kind:'full',video:{x:0,y:0,width,height},panel:null,scale};
}
export const SourceLayout:React.FC<{clip:any;width:number;height:number;opacity:number;start:number;frames:number;physicalScale?:number;portraitTop?:number}>=({clip,width,height,opacity,start,frames,physicalScale=1,portraitTop=.4})=>{
 const layout=sourceLayout(clip,width,height,physicalScale,portraitTop);
 return <Sequence from={start} durationInFrames={frames}><AbsoluteFill style={{backgroundColor:clip.native_underlay&&height>width?'transparent':'#8E969D',opacity}}>
  {clip.native_underlay&&height>width&&<div data-physical-actor="footage-backdrop" style={{position:'absolute',left:0,top:0,width,height:height*portraitTop,background:'#8E969D'}}/>}
  <div data-audit-layout="real-video" data-asset={clip.id} style={{position:'absolute',left:layout.video.x,top:layout.video.y,width:layout.video.width,height:layout.video.height}}><UniformVideo src={staticFile(clip.src)} sourceWidth={clip.source_width} sourceHeight={clip.source_height} layerId={'gemini-'+clip.id} startFrom={Math.round(clip.in*30)} slot={{x:0,y:0,width:layout.video.width,height:layout.video.height}} mode={layout.kind==='full'&&height>width?'cover':'contain'}/><div data-audit="gemini" data-source-asset={clip.id} style={{position:'absolute',left:layout.video.width*.05,top:height>width?12:Math.max(12,height*.04+62-layout.video.y),maxWidth:layout.video.width*.9,fontSize:height>width?22:16,fontWeight:height>width?600:400,color:'white',background:'rgba(28,35,43,.95)',padding:'4px 8px'}}>{clip.label}</div></div>
  {layout.panel&&!clip.native_underlay&&<div data-audit-layout="simulation-panel" data-asset={clip.id} style={{position:'absolute',left:layout.panel.x,top:layout.panel.y,width:layout.panel.width,height:layout.panel.height}}><UniformVideo src={staticFile(clip.panel_src)} sourceWidth={clip.panel_dimensions.width} sourceHeight={clip.panel_dimensions.height} layerId={'panel-'+clip.id} slot={{x:0,y:0,width:layout.panel.width,height:layout.panel.height}}/></div>}
 {layout.panel&&clip.native_underlay&&<div data-audit-layout="simulation-panel" data-asset={clip.id} data-physical-actor="native-lower-view" style={{position:'absolute',left:layout.panel.x,top:layout.panel.y,width:layout.panel.width,height:layout.panel.height}}/>}
 </AbsoluteFill></Sequence>
};
