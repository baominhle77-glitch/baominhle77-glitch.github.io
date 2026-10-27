import React from 'react';
import {OffthreadVideo} from 'remotion';
type Box={x:number;y:number;width:number;height:number};
export const UniformVideo:React.FC<{src:string;sourceWidth:number;sourceHeight:number;slot:Box;layerId:string;mode?:'contain'|'cover';startFrom?:number;opacity?:number}>=({src,sourceWidth,sourceHeight,slot,layerId,mode='contain',startFrom=0,opacity=1})=>{
 if(!(sourceWidth>0&&sourceHeight>0))throw Error('G9 source dimensions missing: '+layerId);
 const s=(mode==='cover'?Math.max:Math.min)(slot.width/sourceWidth,slot.height/sourceHeight);
 return <div data-layer-viewport={layerId} style={{position:'absolute',left:slot.x,top:slot.y,width:slot.width,height:slot.height,overflow:'hidden',opacity}}>
  <div data-image-layer={layerId} data-source-width={sourceWidth} data-source-height={sourceHeight} data-fit={mode} data-scale={s} style={{position:'absolute',left:(slot.width-sourceWidth*s)/2,top:(slot.height-sourceHeight*s)/2,width:sourceWidth,aspectRatio:`${sourceWidth}/${sourceHeight}`,transform:`scale(${s})`,transformOrigin:'top left'}}><OffthreadVideo src={src} startFrom={startFrom} muted style={{display:'block',width:'100%',height:'auto'}}/></div>
 </div>
};
export function measureImageLayers(){return [...document.querySelectorAll('[data-image-layer]')].map(el=>{
 const id=el.getAttribute('data-image-layer')!,r=el.getBoundingClientRect(),container=document.querySelector(`[data-layer-viewport="${id}"]`)!.getBoundingClientRect();
 const sw=Number(el.getAttribute('data-source-width')),sh=Number(el.getAttribute('data-source-height'));return {id,source_width:sw,source_height:sh,x:r.x,y:r.y,w:r.width,h:r.height,viewport:{x:container.x,y:container.y,w:container.width,h:container.height},scale_x:r.width/sw,scale_y:r.height/sh,fit:el.getAttribute('data-fit')};
 });}
