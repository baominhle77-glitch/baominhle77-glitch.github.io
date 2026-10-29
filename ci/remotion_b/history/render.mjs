import fs from 'node:fs';import path from 'node:path';
import {bundle} from '@remotion/bundler';import {selectComposition,renderMedia,RenderInternals} from '@remotion/renderer';
const root=path.resolve(import.meta.dirname,'../../..'),pub=path.join(root,'ci/remotion_b/public'),out=path.join(root,'work/D18_history');fs.mkdirSync(out,{recursive:true});
for(const f of ['history_voice.json','history_voice.wav'])fs.copyFileSync(path.join(root,'gate_chung/examples',f),path.join(pub,f));
for(const fmt of ['16x9','9x16']){
 const dir=path.join(root,'work/history_native',fmt);const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(x=>x.isDirectory()?walk(path.join(d,x.name)):[path.join(d,x.name)]);const src=walk(dir).find(p=>p.endsWith('/HistoryProof.mp4'));if(!src)throw Error('missing native history '+fmt);fs.copyFileSync(src,path.join(pub,'history_'+fmt+'.mp4'));
}
const serveUrl=await bundle({entryPoint:path.join(import.meta.dirname,'index.tsx'),publicDir:pub});const browserExecutable=process.env.B_CHROME||undefined;const capacity=RenderInternals.getMaxConcurrency();const configured=Math.min(2,capacity);const metrics=fs.existsSync(path.join(out,'remotion_render.json'))?JSON.parse(fs.readFileSync(path.join(out,'remotion_render.json'))):[];
for(const format of (process.env.B_FORMATS||'16x9,9x16').split(',')){
 const inputProps={format};const composition=await selectComposition({serveUrl,id:'History-'+format,inputProps,browserExecutable,timeoutInMilliseconds:120000,chromiumOptions:{gl:'swangle'}});const dom=[];let actual=null;const start=performance.now();
 await renderMedia({serveUrl,composition,inputProps,browserExecutable,timeoutInMilliseconds:120000,chromiumOptions:{gl:'swangle'},concurrency:configured,onStart:s=>{actual=s.resolvedConcurrency;console.log('RUNTIME_RESOLVED '+actual)},codec:'h264',crf:18,outputLocation:path.join(out,'history_'+format+'.mp4'),onBrowserLog:l=>{if(l.text.startsWith('B_DOM '))dom.push(JSON.parse(l.text.slice(6)))}});
 fs.writeFileSync(path.join(out,'dom_'+format+'.json'),JSON.stringify(dom,null,2));const old=metrics.findIndex(x=>x.format===format);if(old>=0)metrics.splice(old,1);metrics.push({format,desired_concurrency:2,cpu_capacity:capacity,configured_concurrency:configured,effective_concurrency:actual,wall_s:(performance.now()-start)/1000});fs.writeFileSync(path.join(out,'remotion_render.json'),JSON.stringify(metrics,null,2));console.log('HISTORY_RENDER',metrics.at(-1));
}
