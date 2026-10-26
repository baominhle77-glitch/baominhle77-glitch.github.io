import {bundle} from '@remotion/bundler';
import {selectComposition,renderMedia,renderStill} from '@remotion/renderer';
import fs from 'node:fs';import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../..');
const shortSide=Number(process.env.B_SHORT_SIDE||540);
const out=path.join(root,shortSide===540?'work/B':'work/B1080');fs.mkdirSync(out,{recursive:true});
const serveUrl=await bundle({entryPoint:path.join(import.meta.dirname,'src/index.tsx'),publicDir:path.join(import.meta.dirname,'public')});
const browserExecutable=process.env.B_CHROME||undefined;const reports=[];
for(const format of ['16x9','9x16']){
 const inputProps={format,shortSide};const id='B-'+format;
 const composition=await selectComposition({serveUrl,id,inputProps,browserExecutable,chromiumOptions:{gl:'swangle'},timeoutInMilliseconds:120000});const dom=[];
 const opts={serveUrl,composition,inputProps,browserExecutable,timeoutInMilliseconds:120000,onBrowserLog:log=>{if(log.text.startsWith('B_DOM '))dom.push(JSON.parse(log.text.slice(6)))},chromiumOptions:{gl:'swangle'},logLevel:'error'};
 const t=performance.now();let effectiveConcurrency=2;console.log(`B_REMOTION_START ${format} shortSide=${shortSide} concurrency=2`);
 if(process.argv.includes('--stills')){
  const data=JSON.parse(fs.readFileSync(path.join(import.meta.dirname,'public/data.json')));
  for(const b of data.beats)for(const f of [b.start+4,b.start+Math.floor(b.frames/2),b.start+b.frames-4])await renderStill({...opts,frame:f,output:path.join(out,`frame_${format}_${b.id}_${f}.png`)});
 }else{
  let last=-1;
  const renderOpts={...opts,codec:'h264',outputLocation:path.join(out,`B_60s_${format}.mp4`),concurrency:2,crf:18,pixelFormat:'yuv420p',audioBitrate:'160k',enforceAudioTrack:true,onProgress:p=>{const bucket=Math.floor(p.progress*10);if(bucket>last){last=bucket;console.log(`B_REMOTION_PROGRESS ${format} ${Math.round(p.progress*100)}% frames=${p.renderedFrames}`)}}};
  try{await renderMedia(renderOpts)}catch(error){
   if(!String(error).includes('Maximum for --concurrency is 1'))throw error;
   effectiveConcurrency=1;console.log('B_REMOTION_CPU_CAP: runner exposes one core; retrying concurrency=1 without altering any gate.');
   await renderMedia({...renderOpts,concurrency:1});
  }
 }
 fs.writeFileSync(path.join(out,`dom_${format}.json`),JSON.stringify(dom,null,2));
 reports.push({format,shortSide,wall_s:(performance.now()-t)/1000,requested_concurrency:2,effective_concurrency:effectiveConcurrency});
 console.log('B_REMOTION_END '+JSON.stringify(reports.at(-1)));
 fs.writeFileSync(path.join(out,process.argv.includes('--stills')?'remotion_stills.json':'remotion_render.json'),JSON.stringify(reports,null,2));
}
