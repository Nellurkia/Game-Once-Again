import {BeforeDeparture} from './model.js';
import {CLOCK,AREAS,ROUTES,ITEMS,OBJECTS,REPLIES,HESITATION,formatTime} from './data.js';
import {illustration} from '../../systems/Illustrations.js';

export function mountBeforeDeparture(parent,chapter={}){
 const model=new BeforeDeparture({playthrough:chapter.context?.playthrough,save:chapter.save,onProgress:chapter.onProgress});
 const root=document.createElement('section');root.className='departure-game';root.setAttribute('aria-label','出门之前 · 青年时期');
 root.innerHTML=`<canvas width="1280" height="720" tabindex="0" aria-label="青年时期地图：方向键或 WASD 移动，E 互动；点击地图可移动。"></canvas><header class="departure-header"><div><span class="eyebrow">BEFORE DEPARTURE</span><h2>出门之前</h2><small>${model.revisit?'这一次，真的走出门。':'原始存档 · 看清那些“再等等”。'}</small></div><div class="departure-clock"><span>今天 <strong id="departure-time"></strong></span><small>19:00 前出门 · 19:30 前到站台</small></div></header><aside class="departure-sidebar"><span class="departure-section-label">A 正在等你</span><strong id="departure-a-state"></strong><p id="departure-message"></p><button id="departure-phone">查看消息 / 回复 A · M</button><div class="departure-hesitation"><span id="departure-hesitation-label"></span><div id="departure-hesitation"></div></div><span class="departure-section-label">背包 · 必需两格，可选两格</span><div id="departure-bag"></div><p id="departure-goal"></p></aside><footer class="departure-footer"><div><strong id="departure-nearby"></strong><p>WASD / 方向键移动 · E 互动 · M 消息 · P 暂停<br>触屏：点物品走近并互动；手柄：摇杆移动，A 互动，B 返回</p></div><div class="departure-actions"><button id="departure-pause">暂停 · P</button><button id="departure-interact">互动 · E</button></div></footer><div class="departure-task" hidden><span id="departure-task-label"></span><progress id="departure-task-progress" max="1"></progress><button id="departure-fast" hidden>加快旧记忆 · F</button></div><div class="departure-overlay" hidden></div>`;
 parent.append(root);
 const $=selector=>root.querySelector(selector),canvas=$('canvas'),c=canvas.getContext('2d');
 const photos={};for(const name of ['Y1-rental-night.png','Y4-door-hesitation.png','Y6-empty-platform.png','Y11-ng-platform-reunion.png','Y10-ng-running-corridor.png']){const img=new Image();img.src=illustration(name);photos[name]=img;}
 let intro=!model.valid(chapter.save),paused=false,destroyed=false,notified=false,last=0,target=null,dialogSignature='',bagSignature='',fast=false,hostPaused=false,sound=null,lastNotice='',gamepadButtons=[];
 const keys=new Set();
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const clear=()=>{keys.clear();target=null;};
 const rect=(x,y,w,h,color,r=0)=>{c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();};
 const text=(value,x,y,size=16,color='#dcd5c8',align='left')=>{c.fillStyle=color;c.font=`${size}px "Microsoft YaHei",sans-serif`;c.textAlign=align;c.textBaseline='middle';c.fillText(value,x,y);};
 function unlockSound(){if(sound||!(chapter.context?.sfxVolume>0))return;try{sound=new (window.AudioContext||window.webkitAudioContext)();}catch{}}
 function chime(){if(!sound)return;try{const now=sound.currentTime,osc=sound.createOscillator(),gain=sound.createGain();osc.type='sine';osc.frequency.setValueAtTime(620,now);osc.frequency.setValueAtTime(780,now+.08);gain.gain.setValueAtTime(.025*(chapter.context?.sfxVolume??0),now);gain.gain.exponentialRampToValueAtTime(.001,now+.2);osc.connect(gain);gain.connect(sound.destination);osc.start(now);osc.stop(now+.22);}catch{}}
 function proceed(){if(model.advanceResult()&&!notified){notified=true;chapter.onComplete?.(model.complete());}}
 function overlay(){
  const s=model.s,signature=JSON.stringify([intro,paused,s.dialog,s.phase,s.resultLine,s.outcome,s.inventory]);
  if(signature===dialogSignature)return;dialogSignature=signature;
  const panel=$('.departure-overlay');panel.replaceChildren();
  if(!intro&&!paused&&!s.dialog&&s.phase!=='result'){panel.hidden=true;return;}
  panel.hidden=false;
  const card=document.createElement('div');card.className='departure-dialog';panel.append(card);
  const eyebrow=document.createElement('span');eyebrow.className='eyebrow';eyebrow.textContent=s.phase==='result'?'A MOMENT RECORDED':'ONE MORE MOMENT';card.append(eyebrow);
  const title=document.createElement('h3');card.append(title);
  const content=document.createElement('p');card.append(content);
  const actions=document.createElement('div');actions.className='departure-dialog-actions';card.append(actions);
  function button(label,action,disabled=false){const b=document.createElement('button');b.textContent=label;b.disabled=disabled;b.onclick=()=>{unlockSound();clear();action();overlay();};actions.append(b);return b;}
  if(intro){title.textContent='今天，A 要走了。';content.textContent='先去桌边看看消息。钥匙和钱包是唯一必需品；其他准备都可以放下。时间一直可见，对话选择时会暂停。';button('走进房间',()=>{intro=false;canvas.focus();});}
  else if(paused){title.textContent='先歇一会儿。';content.textContent='时钟、行动和路线都已暂停。';button('继续 · P',()=>{paused=false;canvas.focus();});}
  else if(s.phase==='result'){
   title.textContent=s.outcome==='SUCCESS_AT_STATION'?'你来了。':s.outcome==='MISSED'?'那个空出来的位置。':'这一次，还能再试。';content.textContent=model.results[s.resultLine];
   const last=s.resultLine===model.results.length-1;
   if(model.revisit&&s.outcome==='FAILED_LATE'){button('再试一次 · 最近检查点',()=>model.retry());button('从门口重试',()=>model.retry('door'),!model.checkpoints.door);}
   button(last?'继续看结果 →':'继续 · Enter',proceed);
   const timeline=document.createElement('details'),summary=document.createElement('summary');summary.textContent='看看这一次的时间线';timeline.append(summary);
   const log=document.createElement('p');log.className='departure-timeline';
   const labels={action_start:'开始行动',action_done:'完成行动',reply:'回复 A',route:'选择路线',left_home:'走出住所',A_state:'A 的等待状态变化',checkpoint:'记下这个时刻',result:'记忆收束',retry:'回到检查点'};
   log.textContent=s.log.slice(-10).map(entry=>`${entry.time} ${labels[entry.event]||entry.event}${entry.cost!==undefined?` · 耗时 ${entry.cost} 分钟`:''}${entry.choice?` · ${REPLIES[entry.choice]?.text||entry.choice}`:''}`).join('\n');timeline.append(log);card.append(timeline);
  }else{
   title.textContent=s.dialog.type==='message'?'A 的消息':s.dialog.type==='door'?'现在，只需要开门。':s.dialog.type==='route'||s.dialog.type==='preview'?'走哪条路？':s.dialog.type==='shop'?'要捎些什么？':s.dialog.type==='inventory'?'给背包留一点空位。':s.dialog.type==='original'?'那时的我，还是说了再等等。':'一条新的消息';
   content.textContent=s.dialog.text;
   if(s.dialog.type==='message')for(const [id,reply] of Object.entries(REPLIES))button(`${reply.text}${reply.cost?` · ${reply.cost} 分钟`:''}`,()=>model.reply(id));
   else if(s.dialog.type==='door'){button('现在走',()=>model.leave('go'));button('再等等 · 5 分钟',()=>model.leave('wait'));button('暂时返回',()=>model.cancel());}
   else if(s.dialog.type==='original')button('看着旧存档继续',()=>model.continueOriginal());
   else if(['route','preview'].includes(s.dialog.type)){
    for(const [id,route] of Object.entries(ROUTES)){
     const b=button(`${route.name} · ${model.routeCost(id)+(route.onward||0)} 分钟\n预计到站 ${formatTime(model.routeETA(id))}`,()=>{if(s.dialog.type==='route')model.chooseRoute(id);else{if(!s.memory.includes(`route_${id}`))s.memory.push(`route_${id}`);model.cancel();}});b.title=route.description;
    }
    button('返回',()=>model.cancel());
   }else if(s.dialog.type==='shop'){for(const id of ['charger','card','coat'])button(`${ITEMS[id]} · 10 分钟`,()=>model.buy(id),s.inventory.includes(id));button('不再准备，继续走',()=>model.cancel());}
   else if(s.dialog.type==='inventory'){for(const id of s.inventory)button(`放下${ITEMS[id]}`,()=>model.drop(id));button('保留这些，返回',()=>model.cancel());}
   else button('我知道了',()=>model.cancel());
  }
 }
 function world(time){
  const s=model.s;rect(0,0,1280,720,'#16212d');
  if(s.phase==='result'){
   const photo=photos[s.outcome==='SUCCESS_AT_STATION'?'Y11-ng-platform-reunion.png':'Y6-empty-platform.png'];
   if(photo?.complete&&photo.naturalWidth){c.globalAlpha=.42;c.drawImage(photo,0,0,1280,720);c.globalAlpha=1;}
   return;
  }
  rect(30,112,905,490,'#202c36',15);c.save();c.beginPath();c.roundRect(30,112,905,490,15);c.clip();
  const photo=photos[s.area==='room'?'Y1-rental-night.png':s.area==='hall'?'Y4-door-hesitation.png':s.area==='platform'?'Y11-ng-platform-reunion.png':'Y10-ng-running-corridor.png'];
  if(photo?.complete&&photo.naturalWidth){c.globalAlpha=.10;c.drawImage(photo,30,112,905,490);c.globalAlpha=1;}
  c.translate(45,125);c.scale(.78,.94);c.translate(-100,-140);
  const home=['room','hall','landing'].includes(s.area);rect(100,140,1120,455,home?'#6b625444':'#334b5844');
  for(let i=0;i<14;i++)rect(100,150+i*32,1120,1,home?'#afa08018':'#adc7c718');
  rect(100,140,1120,32,home?'#ad946366':'#759cac55');
  text(AREAS[s.area],145,164,18,'#eedcbb');
  if(s.area==='room'){
   rect(140,195,190,75,'#766858',9);rect(150,203,58,24,'#ccbea1',5);rect(590,188,160,105,'#927c57',7);rect(1035,340,110,115,'#776251',6);
   rect(450,409,110,65,'#645f4d',9);rect(154,357,160,28,'#857652',5);rect(796,383,115,94,'#6d7162',7);
   rect(570,527,160,32,'#bcaa7844',4);text('门口 →',650,545,16,'#ead6ac','center');
  }else if(s.area==='hall'){
   rect(1030,195,120,172,'#b09862',6);rect(1039,204,102,156,'#695744',5);rect(1124,275,8,8,'#e0c98f',4);
   rect(150,185,142,95,'#132c46',6);rect(220,186,4,93,'#8496a0');rect(151,229,140,4,'#8496a0');
   rect(690,379,160,70,'#87735b',12);rect(335,390,112,65,'#806d50',7);
   if(model.revisit)text('NEW',1100,188,12,'#ddbd78','center');
  }else if(s.area==='landing'){
   rect(180,438,94,94,'#795d46',8);rect(525,205,310,82,'#476577',8);rect(855,345,240,130,'#65737b',7);
   for(let i=0;i<7;i++)rect(290+i*55,347+i*17,180,8,'#a4a89d66');text('楼梯 / 电梯 / 街角小店',690,211,17,'#d6ddd5','center');
  }else if(s.area==='street'){
   rect(100,295,1120,235,'#263946');rect(100,405,1120,2,'#b0ac8444');
   for(let i=0;i<6;i++){rect(170+i*195,205,5,98,'#758b82');rect(155+i*195,197,34,8,'#e1c276',4);if(!reduced){c.fillStyle='#dac48515';c.beginPath();c.ellipse(172+i*195,460,70,35,0,0,Math.PI*2);c.fill();}}
   text('前方 · '+AREAS[s.task?.payload?.target||'entrance'],1090,555,17,'#adc6bd','right');
  }else if(s.area==='store'){
   rect(520,205,420,110,'#9a8158',7);rect(585,158,230,36,'#c2a774',6);text('街角小店',700,178,19,'#352f28','center');
   for(let i=0;i<5;i++){rect(160+i*145,350,82,18,'#7e8876',4);rect(170+i*145,320,14,28,'#b4a577',4);rect(195+i*145,327,20,21,'#638c8b',4);}
  }else{
   rect(100,173,1120,67,'#66787955');rect(100,565,1120,20,'#b39e6044');
   if(s.area==='entrance'){rect(205,195,160,94,'#48626d',7);rect(998,280,180,172,'#65767666',7);text('19:30 · 出发',690,170,19,'#e1c995','center');}
   else{rect(258,358,130,72,'#7d7460',7);rect(950,241,137,89,'#877961',8);if(s.aState!=='LEFT'){rect(917,292,22,39,'#aba38c',5);c.fillStyle='#dbcfb6';c.beginPath();c.arc(928,277,15,0,7);c.fill();text('A',928,245,15,'#f3d9aa','center');}for(let i=0;i<7;i++)rect(125+i*154,548,80,3,'#b2b5a266');}
  }
  for(const object of OBJECTS.filter(object=>object.area===s.area)){
   const near=model.nearest?.id===object.id;
   c.strokeStyle=near?'#e2c98c':'#ada38577';c.lineWidth=near?2:1;c.setLineDash([5,5]);c.beginPath();c.ellipse(object.x,object.y,70,34,0,0,7);c.stroke();c.setLineDash([]);
   rect(object.x-72,object.y+35,144,26,'#172632dd',5);text(object.name,object.x,object.y+48,14,near?'#f4dfb2':'#aab9ba','center');
  }
  c.fillStyle='#0a121844';c.beginPath();c.ellipse(s.x,s.y+22,22,8,0,0,7);c.fill();
  rect(s.x-12,s.y-8,24,35,s.inventory.includes('coat')?'#9b9470':'#a9b9ad',5);rect(s.x-17,s.y+4,10,20,'#756348',4);
  rect(s.x-10,s.y+25,7,13,'#c4c5b4',2);rect(s.x+3,s.y+25,7,13,'#c4c5b4',2);c.fillStyle='#d5ccb4';c.beginPath();c.arc(s.x,s.y-20,14,0,7);c.fill();
  if(target){c.strokeStyle='#c3b480';c.beginPath();c.arc(target.x,target.y,8+Math.sin(time/250)*2,0,7);c.stroke();}
  c.restore();
  const stages=['room','hall','landing','street','store','entrance','platform'];
  stages.forEach((area,i)=>{text(AREAS[area],62+i*130,583,12,s.area===area?'#efd295':'#819599');if(i<6)text('·',168+i*130,583,12,'#607c89');});
 }
 function panel(){
  const s=model.s;
  $('#departure-time').textContent=formatTime(s.minutes);
  $('#departure-a-state').textContent=({WAITING_1:'等你的回答',CONFIDENT:'安心等你',UNSURE:'不确定你会不会来',AT_STATION:'已经到了站台',LEFT:'今天的车已出发',MET:'终于等到你'})[s.aState];
  $('#departure-message').textContent=s.message;
  const level=Math.min(4,Math.floor(s.hesitation/20));$('#departure-hesitation-label').textContent='心里的迟疑 · '+HESITATION[level];
  $('#departure-hesitation').innerHTML=HESITATION.map((_,i)=>`<i class="${i<=level?'lit':''}"></i>`).join('');
  const bag=JSON.stringify([s.hasKey,s.hasPass,s.inventory]);
  if(bag!==bagSignature){bagSignature=bag;$('#departure-bag').innerHTML=`<span class="${s.hasKey?'packed':''}">${s.hasKey?'✓':'○'} 钥匙</span><span class="${s.hasPass?'packed':''}">${s.hasPass?'✓':'○'} 钱包 / 凭证</span>${[0,1].map(i=>`<span>${s.inventory[i]?ITEMS[s.inventory[i]]:'空位 · 不必填满'}</span>`).join('')}`;}
  $('#departure-goal').textContent=!s.hasKey||!s.hasPass?'走近钥匙与钱包，按 E 拿上。':s.leftAt===null?'去门口，决定现在走，还是再准备一下。':s.area==='landing'?'看清路线与预计时间，再做选择。':s.area==='store'?'补给是可选的。还要留出到站的时间。':'19:30 前走到站台，靠近 A。';
  const near=model.nearest;$('#departure-nearby').textContent=near?`${near.name} · E`:'点地图移动，或走近一个物品。';
  const task=$('.departure-task');task.hidden=!s.task;
  if(s.task){$('#departure-task-label').textContent=s.task.type==='original'?'原始存档：一次次等待，钟还在走。':s.task.type==='travel'?`正在去${AREAS[s.task.payload.target]} · 路线耗时 ${s.task.total} 分钟`:`这次准备耗时 ${s.task.total} 分钟`;$('#departure-task-progress').value=1-s.task.remaining/s.task.total;$('#departure-fast').hidden=s.task.type!=='original';$('#departure-fast').textContent=fast?'恢复正常播放 · F':'加快旧记忆 · F';}
  const notice=s.notifications.at(-1);if(notice&&notice!==lastNotice){lastNotice=notice;chime();}
  $('#departure-phone').disabled=!!s.task||s.phase==='result';$('#departure-interact').disabled=!!s.task||!!s.dialog||s.phase==='result';
  if(!model.saved)$('#departure-nearby').textContent+=' · 当前进度仅在本次页面保留';
  overlay();
 }
 function pause(){paused=!paused;clear();model.commit();overlay();}
 $('#departure-pause').onclick=pause;$('#departure-fast').onclick=()=>{fast=!fast;};
 $('#departure-interact').onclick=()=>{unlockSound();model.interact();clear();};
 $('#departure-phone').onclick=()=>{unlockSound();if(!model.s.dialog&&!model.s.task&&model.s.phase==='explore')model.openDialog('message',model.messageText);};
 function down(event){event.preventDefault();unlockSound();if(intro||paused||model.s.dialog||model.s.phase==='result'||model.s.task)return;canvas.focus();const r=canvas.getBoundingClientRect(),x=(event.clientX-r.left)*1280/r.width,y=(event.clientY-r.top)*720/r.height;if(x<30||x>935||y<112||y>570)return;const point={x:(x-45)/.78+100,y:(y-125)/.94+140};const object=OBJECTS.find(object=>object.area===model.s.area&&Math.hypot(point.x-object.x,point.y-object.y)<78);target=object?{x:object.x,y:object.y,id:object.id}:{x:clampPoint(point.x,120,1160),y:clampPoint(point.y,190,555)};}
 const clampPoint=(n,a,b)=>Math.max(a,Math.min(b,n));
 function keydown(event){
  if(document.querySelector('dialog[open]'))return;
  const key=event.key.toLowerCase();if(!['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','e','m','p','escape','enter','f'].includes(key))return;
  if(event.target.tagName==='BUTTON'&&key==='enter')return;
  event.preventDefault();unlockSound();if(event.repeat)return;
  if(intro){if(key==='enter'){intro=false;canvas.focus();}return;}
  if(key==='escape'&&model.s.dialog){model.cancel();clear();return;}
  if(key==='p'||key==='escape'){pause();return;}if(paused)return;
  if(key==='f'&&model.s.task?.type==='original'){fast=!fast;return;}
  if(key==='enter'&&model.s.phase==='result'){proceed();return;}
  if(key==='m'){$('#departure-phone').click();return;}
  if(model.s.dialog)return;
  if(key==='e'){model.interact();clear();return;}target=null;keys.add(key);
 }
 const keyup=event=>keys.delete(event.key.toLowerCase());
 const blur=()=>{paused=true;clear();model.commit();};
 const visibility=()=>{if(document.hidden)blur();};
 canvas.addEventListener('pointerdown',down);window.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);window.addEventListener('blur',blur);document.addEventListener('visibilitychange',visibility);
 function gamepad(){
  let pad;try{pad=[...(navigator.getGamepads?.()||[])].find(Boolean);}catch{}
  if(!pad)return {x:0,y:0};const b=pad.buttons.map(button=>button.pressed),pressed=index=>b[index]&&!gamepadButtons[index];
  if(pressed(9))pause();if(pressed(1)){model.cancel();clear();}
  if(model.s.dialog||paused||model.s.phase==='result'){
   const options=[...root.querySelectorAll('.departure-dialog-actions button:not(:disabled)')];
   const index=options.indexOf(document.activeElement),direction=pressed(13)||pressed(15)?1:pressed(12)||pressed(14)?-1:0;
   if(direction&&options.length)options[(Math.max(0,index)+direction+options.length)%options.length].focus();
  }
  if(pressed(0)){if(intro)intro=false;else if(model.s.dialog||paused||model.s.phase==='result'){const focused=document.activeElement;focused?.closest('.departure-dialog-actions')?focused.click():$('.departure-dialog-actions button:not(:disabled)')?.click();}else model.interact();}
  gamepadButtons=b;return {x:Math.abs(pad.axes[0])>.18?pad.axes[0]:0,y:Math.abs(pad.axes[1])>.18?pad.axes[1]:0};
 }
 function frame(time){
  if(destroyed)return;const dt=Math.min((time-last)/1000||0,.05);last=time;
  const host=!!document.querySelector('dialog[open]');if(host&&!hostPaused){clear();model.commit();}hostPaused=host;
  const pad=host?{x:0,y:0}:gamepad();
  if(!intro&&!paused&&!host&&!document.hidden){
   let dx=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0)+pad.x,dy=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0)+pad.y;
   if(target&&!model.s.dialog&&!model.s.task){const distance=Math.hypot(target.x-model.s.x,target.y-model.s.y);if(distance<32){if(target.id)model.interact(target.id);target=null;}else{dx=(target.x-model.s.x)/distance;dy=(target.y-model.s.y)/distance;}}
   model.step(dt,dx,dy);if(fast&&model.s.task?.type==='original')for(let i=0;i<5;i++)model.step(dt);
  }
  world(time);panel();raf=requestAnimationFrame(frame);
 }
 let raf=requestAnimationFrame(frame);
 return {getSaveData:()=>model.snapshot(),destroy(){if(destroyed)return;model.commit();destroyed=true;cancelAnimationFrame(raf);window.removeEventListener('keydown',keydown);window.removeEventListener('keyup',keyup);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',visibility);sound?.close().catch(()=>{});root.remove();}};
}
