// The host owns journey selection, progress and story navigation.
export function mountStationRunner(parent,chapter){
 const frame=document.createElement('iframe');frame.title=`最后一班车 · ${chapter.context.playthrough===1?'一':'二'}周目`;
 frame.style.cssText='display:block;width:100%;height:100%;border:0';
 frame.src=`${import.meta.env.BASE_URL}minigames/station-runner/index.html?embedded=1`;
 let api,disposed=false,completed=false;
 const pause=()=>api?.setHostPaused(!!document.querySelector('dialog[open]')||document.hidden);
 const observer=new MutationObserver(pause),dialog=document.querySelector('dialog');
 if(dialog)observer.observe(dialog,{attributes:true,attributeFilter:['open']});
 document.addEventListener('visibilitychange',pause);
 const keyboard=event=>{
  if(disposed||document.querySelector('dialog[open]')||['INPUT','TEXTAREA'].includes(event.target.tagName))return;
  if(api?.handleKey({key:event.key,repeat:event.repeat},event.type==='keydown'))event.preventDefault();
 };
 window.addEventListener('keydown',keyboard);window.addEventListener('keyup',keyboard);
 frame.onload=()=>{
  if(disposed)return;
  try{
   api=frame.contentWindow.stationRunner;if(!api)throw Error('游戏资源未加载完成');
   api.start({journey:chapter.context.playthrough,save:chapter.save,getSfxVolume:chapter.context.getSfxVolume,
    onAchievement:id=>!disposed&&chapter.onAchievement?.(id),
    onProgress:snapshot=>!disposed&&chapter.onProgress?.(snapshot),
    onComplete:result=>{
     if(disposed||completed||result.journey!==chapter.context.playthrough)return;completed=true;
     chapter.onComplete({success:true,score:result.progress,flags:{stationRunnerComplete:true,stationOutcome:result.outcome,youthOutcome:result.outcome}});
    }});pause();
  }catch(error){const note=document.createElement('p');note.textContent=`最后一班车加载失败：${error.message}。请刷新后重试。`;parent.replaceChildren(note);}
 };
 parent.append(frame);
 return {destroy(){if(disposed)return;api?.dispose();disposed=true;observer.disconnect();document.removeEventListener('visibilitychange',pause);window.removeEventListener('keydown',keyboard);window.removeEventListener('keyup',keyboard);frame.onload=null;frame.remove();}};
}
