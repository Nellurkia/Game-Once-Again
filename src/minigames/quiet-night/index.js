import {QuietNight,SPOTS,RESPONSES} from './model.js';
export function mountQuietNight(parent,chapter={}){
 const model=new QuietNight({playthrough:chapter.context?.playthrough,save:chapter.save,onProgress:chapter.onProgress});
 const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=720;canvas.tabIndex=0;canvas.setAttribute('aria-label','不要出声：方向键移动，E 躲藏或打开游戏机，P 暂停。');canvas.style.cssText='width:100%;height:100%;display:block;touch-action:none;outline:none';parent.append(canvas);
 const c=canvas.getContext('2d'),keys=new Set();let intro=true,paused=false,destroyed=false,notified=false,last=0,buttons=[],pointer=null,hostPaused=false;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const rect=(x,y,w,h,color,r=0)=>{c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();};
 const text=(s,x,y,size=18,color='#dfd8d4',align='left')=>{c.font=`${size}px "Microsoft YaHei",sans-serif`;c.textAlign=align;c.textBaseline='middle';c.fillStyle=color;c.fillText(s,x,y);};
 const button=(x,y,w,label,action)=>{rect(x,y,w,42,'#46596c',8);text(label,x+w/2,y+21,17,'#f2e8d3','center');buttons.push({x,y,w,h:42,action});};
 function clear(){keys.clear();pointer=null;}
 function proceed(){if(model.phase==='done'){if(notified)return;notified=true;chapter.onComplete?.({success:true,score:0,flags:{quietNightComplete:true,quietNightResponse:model.response,saidFear:model.response==='fear'}});}else model.advance();}
 function draw(time){
  buttons=[];rect(0,0,1280,720,'#111a28');
  const arcade=model.phase==='arcade';
  text('不要出声',40,39,27,'#efe0c6');text(model.revisit?'重访童年 · 可以改变自己的回应':'童年的夜晚 · 躲起来，等它过去',210,40,16,'#a3aab7');button(902,18,96,paused?'继续 P':'暂停 P',()=>{paused=!paused;clear();model.commit();});
  c.save();c.beginPath();c.rect(28,88,1224,536);c.clip();
  if(arcade){
   rect(28,88,1224,536,'#101d2b');for(let i=0;i<75;i++)rect(60+(i*167)%1160,110+(i*67+time*.012)%500,2,2,'#52667c');
   c.save();if(!reduced&&model.gameTime>28)c.filter=`blur(${(model.gameTime-28)/11}px)`;
   for(const b of model.bullets){rect(b.x-58,b.y-16,116,32,'#623d5470',3);text(b.text,b.x,b.y,21,'#d99cac','center');}
   c.fillStyle=model.invulnerable?'#f1cba2':'#afd7df';c.beginPath();c.moveTo(model.x,model.y-15);c.lineTo(model.x-12,model.y+12);c.lineTo(model.x,model.y+6);c.lineTo(model.x+12,model.y+12);c.closePath();c.fill();c.restore();
   const sleep=Math.max(0,(model.gameTime-25)/23);rect(28,88,1224,536*sleep*.40,'#080e18');rect(28,624-536*sleep*.40,1224,536*sleep*.40,'#080e18');
   text('困意',65,596,15,'#8d9baa');rect(115,590,215,8,'#2c394b',4);rect(115,590,215*model.gameTime/48,8,'#a3bdc9',4);
  }else{
   const g=c.createLinearGradient(0,88,0,624);g.addColorStop(0,'#263247');g.addColorStop(1,'#343447');rect(28,88,1224,536,g);
   rect(28,513,1224,111,'#37303b');for(let i=0;i<13;i++)rect(28,522+i*9,1224,1,'#463846');
   rect(73,173,120,342,'#171e2d',5);rect(82,183,102,322,'#353545',3);rect(183,184,4,320,'#d6ab7d');rect(163,344,7,7,'#e4b982',3);text('房门',132,545,16,'#b9a7a8','center');
   rect(315,385,240,108,'#65576a',8);rect(310,372,245,40,'#9b93a7',9);rect(319,374,70,29,'#dad0cc',9);rect(322,420,225,12,'#a497ab');rect(322,475,14,51,'#706071');rect(530,475,14,51,'#706071');
   rect(715,426,155,18,'#82716c',4);rect(730,444,12,77,'#675b5c');rect(844,444,12,77,'#675b5c');rect(750,395,54,32,'#c2b99e',5);rect(762,401,27,17,'#aad5b6',2);
   rect(1000,225,144,290,'#625966',5);rect(1010,235,59,267,'#716573',3);rect(1075,235,59,267,'#716573',3);rect(1060,354,4,20,'#d3b59e');rect(1081,354,4,20,'#d3b59e');
   rect(590,158,212,149,'#151e32',5);for(let i=0;i<15;i++)rect(601+(i*43)%187,171+(i*29)%121,2,2,'#d5c4a8');rect(693,158,5,149,'#657184');rect(590,229,212,5,'#657184');
   for(const w of model.waves){c.strokeStyle=model.hidden?'#bd8a9a28':'#cc8c9c65';c.lineWidth=4;c.beginPath();c.ellipse(w.x,367,24,164,0,-1.4,1.4);c.stroke();if(model.returned)text(['“你为什么总这样？”','“都是你不肯听。”','“别吵了……”'][w.id%3],w.x,270+(w.id%3)*60,17,'#d8a7ad','center');}
   if(!model.hidden){rect(model.x-10,476,20,31,'#a5a5b4',4);c.fillStyle='#e2ccb5';c.beginPath();c.arc(model.x,464,12,0,Math.PI*2);c.fill();rect(model.x-9,505,6,16,'#202537');rect(model.x+3,505,6,16,'#202537');}
   for(const s of SPOTS)text(model.hidden===s.id?'藏在这里 · E 出来':s.name+' · E',s.x,570,15,model.hidden===s.id?'#d9d9b8':'#b7adbc','center');
   text(model.consoleReady?'游戏机 · E 打开':'游戏机 · 先藏一会儿',790,550,15,'#c9c6ae','center');
  }
  if(model.exposure>0)rect(28,88,1224,536,`rgba(157,99,120,${model.exposure*.17})`);c.restore();
  if(arcade&&model.canLeave)button(455,102,370,'Ⅱ 暂停游戏机 · 回到房间',()=>{model.leave();clear();});
  const hint=arcade?(model.canLeave?'可以继续躲避，也可以暂停掌机，回到房间。':'躲开那些词句。不计分，不会死亡，困意会慢慢到来。'):model.returned?model.message:model.consoleReady?'游戏机亮着。靠近书桌，按 E 打开。':model.message;
  text(hint,40,654,17,'#d0c7ca');text(arcade?'方向键 / WASD / 按住画面移动 · P 暂停':'A/D 或方向键移动 · E 躲藏 / 互动 · P 暂停',40,693,14,'#8e97a9');
  if(!arcade){button(840,674,85,'←',()=>{model.step(.05,-1);});button(940,674,85,'→',()=>{model.step(.05,1);});button(1040,674,195,'互动 E',()=>model.interact());}
  if(!model.saved)text('暂未写入浏览器，进度仅保留在本次页面',1240,74,12,'#dbb68e','right');
  if(intro||paused||['response','ending','done'].includes(model.phase)){
   buttons=[];rect(28,88,1224,536,'#0b101cd9',12);rect(225,153,830,430,'#293345',20);
   if(intro){text('今晚，先照顾好自己。',640,215,30,'#eddbc2','center');['靠近被窝、床底或衣柜，按 E 躲藏，再按 E 出来。','藏满 3 秒，并在房间待过 12 秒后，可以到书桌打开游戏机。','在掌机里移动，躲开词句，直到困倦入睡。',model.revisit?'这一次，掌机中会出现“暂停”。你可以回来选择自己的回应。':'这一夜，孩子无法让争吵停止，也没有真正说出口。'].forEach((s,i)=>text(s,640,292+i*40,17,'#c9cbd4','center'));button(485,500,310,'走进房间 / Enter',()=>{intro=false;clear();canvas.focus();});}
   else if(paused){text('先歇一会儿',640,245,30,'#eddbc2','center');text('房间和掌机都已暂停。',640,332,19,'#c9cbd4','center');button(485,459,310,'继续 / P',()=>{paused=false;clear();});}
   else if(model.phase==='response'){text('门外的声音，终于有了句子。',640,221,27,'#eddbc2','center');text('你不能替他们解决问题。你可以决定怎样回应。',640,303,19,'#c9cbd4','center');['hide','silent','fear'].forEach((r,i)=>button(275+i*250,427,230,RESPONSES[r].title,()=>model.choose(r)));}
   else {const r=RESPONSES[model.response];text(r.title,640,226,27,'#eddbc2','center');text(model.phase==='done'?'这一段记忆，先留在这里。':r.lines[model.line],640,343,19,'#d9d4d3','center');button(485,483,310,model.phase==='done'?'继续故事 / Enter':'继续 / Enter',proceed);}
  }
 }
 function keydown(e){if(document.querySelector('dialog[open]'))return;const k=e.key.toLowerCase();if(['arrowleft','arrowright','arrowup','arrowdown','a','d','w','s','e','p','escape','enter',' '].includes(k))e.preventDefault();if(e.repeat)return;
  if(intro){if(k==='enter')intro=false;return;}if(k==='p'||k==='escape'){paused=!paused;clear();model.commit();return;}if(paused)return;
  if(k==='enter'&&['ending','done'].includes(model.phase)){proceed();return;}if(k==='e')model.interact();if(k===' '&&model.canLeave)model.leave();keys.add(k);
 }
 const keyup=e=>keys.delete(e.key.toLowerCase());const blur=()=>{clear();paused=true;model.commit();};const visibility=()=>{if(document.hidden)blur();};
 const point=e=>{const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*1280/r.width,y:(e.clientY-r.top)*720/r.height};};
 function down(e){e.preventDefault();canvas.focus();const p=point(e),b=buttons.find(b=>p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h);if(b){b.action();return;}if(intro||paused)return;pointer=p;canvas.setPointerCapture(e.pointerId);}
 const move=e=>{if(pointer)pointer=point(e);};const up=()=>{pointer=null;};
 canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);window.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);window.addEventListener('blur',blur);document.addEventListener('visibilitychange',visibility);
 function frame(time){if(destroyed)return;const dt=Math.min((time-last)/1000||0,.05);last=time;const host=!!document.querySelector('dialog[open]');if(host&&!hostPaused){clear();model.commit();}hostPaused=host;
  if(!intro&&!paused&&!host&&!document.hidden){let dx=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),dy=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);if(pointer){dx=Math.abs(pointer.x-model.x)>8?Math.sign(pointer.x-model.x):0;dy=model.phase==='arcade'&&Math.abs(pointer.y-model.y)>8?Math.sign(pointer.y-model.y):0;}model.step(dt,dx,dy);}draw(time);raf=requestAnimationFrame(frame);
 }
 let raf=requestAnimationFrame(frame);
 return {destroy(){if(destroyed)return;model.commit();destroyed=true;cancelAnimationFrame(raf);window.removeEventListener('keydown',keydown);window.removeEventListener('keyup',keyup);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',visibility);canvas.remove();}};
}
