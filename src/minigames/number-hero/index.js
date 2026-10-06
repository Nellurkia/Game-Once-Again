export function mountNumberHero(parent,chapter){
 const frame=document.createElement('iframe');frame.title=`数字勇者 · ${chapter.context.playthrough===1?'一':'二'}周目`;
 frame.style.cssText='display:block;width:100%;height:100%;border:0';
 frame.src=`${import.meta.env.BASE_URL}minigames/number-hero/${chapter.context.playthrough===1?'first':'second'}.html?embedded=1`;
 let api,disposed=false,completed=false;
 const pause=()=>api?.setHostPaused(!!document.querySelector('dialog[open]')||document.hidden);
 const observer=new MutationObserver(pause),dialog=document.querySelector('dialog');if(dialog)observer.observe(dialog,{attributes:true,attributeFilter:['open']});
 document.addEventListener('visibilitychange',pause);
 frame.onload=()=>{if(disposed)return;api=frame.contentWindow.NumberHero;if(!api){parent.innerHTML='<p>数字勇者加载失败，请刷新后重试。</p>';return;}
  try{api.start({save:chapter.save,playthrough:chapter.context.playthrough,sfxVolume:chapter.context.sfxVolume,onProgress:chapter.onProgress,onAchievement:id=>{if(!disposed)chapter.onAchievement?.(id);},onComplete:result=>{if(disposed||completed)return;completed=true;chapter.onComplete(result);}});pause();}
  catch(error){parent.innerHTML=`<p>数字勇者加载失败：${error.message}。请刷新后重试。</p>`;}};
 parent.append(frame);
 return {destroy(){if(disposed)return;disposed=true;api?.dispose();observer.disconnect();document.removeEventListener('visibilitychange',pause);frame.onload=null;frame.remove();}};
}
