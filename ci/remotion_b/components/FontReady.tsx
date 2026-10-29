import {useEffect,useState} from 'react';
import {delayRender,continueRender,cancelRender} from 'remotion';
/** Shared producer rule: measure/audit/capture after the declared font loads. */
export function useReadyFont(){
 const [ready,setReady]=useState(false);const [handle]=useState(()=>delayRender('Load declared video font'));
 useEffect(()=>{document.fonts.load('700 30px "Noto Sans"').then(()=>{setReady(true);requestAnimationFrame(()=>continueRender(handle))}).catch(cancelRender)},[handle]);
 return ready;
}
