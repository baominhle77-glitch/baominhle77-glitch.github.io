import {bundle} from '@remotion/bundler';
import {selectComposition,renderMedia,renderStill} from '@remotion/renderer';
import fs from 'node:fs';import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../..');
const out=path.join(root,'work/B');fs.mkdirSync(out,{recursive:true});
const serveUrl=await bundle({entryPoint:path.join(import.meta.dirname,'src/index.tsx'),publicDir:path.join(import.meta.dirname,'public')});
const browserExecutable=process.env.B_CHROME||undefined;
const reports=[];
for(const format of ['16x9','9x16']){
 const id='B-'+format;const composition=await selectComposition({serveUrl,id,browserExecutable,chromiumOptions:{gl:'swangle'},timeoutInMilliseconds:60000});const dom=[];
 const opts={serveUrl,composition,browserExecutable,onBrowserLog:log=>{if(log.text.startsWith('B_DOM '))dom.push(JSON.parse(log.text.slice(6)))},chromiumOptions:{gl:'swangle'},logLevel:'error'};
 const t=performance.now();
 if(process.argv.includes('--stills')){
  const data=JSON.parse(fs.readFileSync(path.join(import.meta.dirname,'public/data.json')));
  for(const b of data.beats)for(const f of [b.start+4,b.start+Math.floor(b.frames/2),b.start+b.frames-4]){
   await renderStill({...opts,frame:f,output:path.join(out,`frame_${format}_${b.id}_${f}.png`)});
  }
 }else await renderMedia({...opts,codec:'h264',outputLocation:path.join(out,`B_60s_${format}.mp4`),concurrency:2,crf:18,pixelFormat:'yuv420p',audioBitrate:'160k',enforceAudioTrack:true});
 fs.writeFileSync(path.join(out,`dom_${format}.json`),JSON.stringify(dom,null,2));reports.push({format,wall_s:(performance.now()-t)/1000});
}
fs.writeFileSync(path.join(out,process.argv.includes('--stills')?'remotion_stills.json':'remotion_render.json'),JSON.stringify(reports,null,2));
