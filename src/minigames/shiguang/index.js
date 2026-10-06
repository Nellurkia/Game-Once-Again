// Keep the supplied game's DOM/CSS isolated while using the host's save and journey.
export function mountShiguang(parent,chapter={}){
 const frame=document.createElement('iframe');
 frame.title='拾光 · 第四幕回忆拼图';
 frame.style.cssText='display:block;width:100%;height:100%;border:0';
 frame.src=`${import.meta.env.BASE_URL}minigames/shiguang/index.html?embedded=1`;
 let api=null,disposed=false,completed=false;
 function hostPause(){api?.setHostPaused(!!document.querySelector('dialog[open]'));}
 const observer=new MutationObserver(hostPause);
 const dialog=document.querySelector('dialog');if(dialog)observer.observe(dialog,{attributes:true,attributeFilter:['open']});
 frame.onload=()=>{
  if(disposed)return;
  try{
   api=frame.contentWindow.MemoryPuzzle;if(!api)throw Error('拾光资源未加载完成');
   api.start({slotId:'once-again',variantId:(chapter.context?.playthrough??1)===1?'first':'second',
    saveAdapter:{write(snapshot){if(chapter.onProgress?.(snapshot)!==true)throw Error('浏览器未能保存，请导出存档');}},
    onReturn(){
     const save=api.getSaveData();if(disposed||completed||!save.completed)return;
     completed=true;
     chapter.onComplete?.({success:true,score:Object.values(save.pieceStates).filter(s=>s==='placed').length,
      flags:{memoryPuzzleComplete:true,memoryPuzzleFull:save.variantId==='second'},levelId:save.levelId,variantId:save.variantId});
    }
   },chapter.save);
   hostPause();
  }catch(error){
   const note=document.createElement('p');note.textContent=`拾光加载失败：${error.message}。请刷新后重试。`;parent.replaceChildren(note);
  }
 };
 parent.append(frame);
 return {getSaveData:()=>api?.getSaveData(),destroy(){if(disposed)return;api?.dispose();disposed=true;observer.disconnect();frame.onload=null;frame.remove();}};
}
