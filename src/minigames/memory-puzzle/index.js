import {MemoryPuzzle} from './model.js';
import {CONFIG} from './config.js';

export function mountMemoryPuzzle(parent,chapter={}){
 const context=chapter.context||{},config=CONFIG;
 const options={playthrough:context.playthrough||1,save:chapter.save??null,onProgress:chapter.onProgress||(()=>false)};
 let model=new MemoryPuzzle(options),destroyed=false,notified=false,overlay=model.status==='recovery'?'recovery':model.completed?'completed':'intro',previousOverlay=null;
 let drag=null,returnGhost=null,flash=null,scroll=0,buttons=[],thumbnails=[],lastTime=0,accumulator=0,hostPaused=false,touchInput=0;
 const keys=new Set(),canvas=document.createElement('canvas');canvas.width=1280;canvas.height=720;canvas.tabIndex=0;canvas.setAttribute('aria-label','老年回忆拼图：左右移动、跳跃、E 拾取，拖动右栏碎片恢复道路。');
 Object.assign(canvas.style,{width:'100%',height:'100%',display:'block',touchAction:'none',outline:'none'});parent.append(canvas);
 const ctx=canvas.getContext('2d');
 const text=(value,x,y,size=16,color='#523f30',align='left')=>{ctx.font=`${size}px "Microsoft YaHei", sans-serif`;ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(value,x,y);};
 const box=(x,y,w,h,color,r=8)=>{ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();};
 const contains=(rect,p)=>p.x>=rect.x&&p.x<=rect.x+rect.w&&p.y>=rect.y&&p.y<=rect.y+rect.h;
 const serial=p=>p.id.replace('S','').replace('-P','·');
 function paragraph(value,x,y,width,size=17,color='#66513d'){
  let line='',row=0;ctx.font=`${size}px "Microsoft YaHei", sans-serif`;
  for(const char of value){if(char==='\n'||ctx.measureText(line+char).width>width){text(line,x,y+row*29,size,color);row++;line=char==='\n'?'':char;}else line+=char;}
  if(line)text(line,x,y+row*29,size,color);return y+(row+1)*29;
 }
 function button(x,y,w,h,label,action){box(x,y,w,h,'#8d674b');text(label,x+w/2,y+h/2,16,'#fff0d0','center');buttons.push({x,y,w,h,action});}
 function piecePath(w,h){
  ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(w*.35,0);ctx.bezierCurveTo(w*.28,-12,w*.72,-12,w*.65,0);ctx.lineTo(w,0);ctx.lineTo(w,h*.38);ctx.bezierCurveTo(w+13,h*.31,w+13,h*.66,w,h*.6);ctx.lineTo(w,h);ctx.lineTo(w*.64,h);ctx.bezierCurveTo(w*.72,h-12,w*.28,h-12,w*.36,h);ctx.lineTo(0,h);ctx.lineTo(0,h*.6);ctx.bezierCurveTo(12,h*.68,12,h*.31,0,h*.38);ctx.closePath();
 }
 function picture(piece,x,y,scale=1,alpha=1,outline=false){
  const {w,h}=piece.target;ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.globalAlpha=alpha;
  piecePath(w,h);ctx.fillStyle=outline?'#f4e8cc':piece.color;ctx.fill();ctx.strokeStyle=outline?'#ad8d63':'#735b42';ctx.lineWidth=1.6/scale;ctx.setLineDash(outline?[6/scale,4/scale]:[]);ctx.stroke();ctx.setLineDash([]);
  if(!outline){
   ctx.save();piecePath(w,h);ctx.clip();const gradient=ctx.createLinearGradient(0,0,0,h);gradient.addColorStop(0,'#fff4d87d');gradient.addColorStop(1,'#5c49342b');ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
   if(piece.motif==='window'){box(w*.18,26,w*.64,64,'#7f8b81',3);ctx.strokeStyle='#ece0bb';ctx.lineWidth=4;ctx.strokeRect(w*.18,26,w*.64,64);ctx.beginPath();ctx.moveTo(w*.5,26);ctx.lineTo(w*.5,90);ctx.moveTo(w*.18,58);ctx.lineTo(w*.82,58);ctx.stroke();}
   if(piece.motif==='tree'){ctx.strokeStyle='#82634b';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(w*.5,112);ctx.lineTo(w*.5,40);ctx.stroke();ctx.fillStyle='#667c57';for(let i=0;i<5;i++){ctx.beginPath();ctx.ellipse(w*.5+Math.cos(i*1.3)*w*.22,50+Math.sin(i*1.3)*20,23,18,0,0,Math.PI*2);ctx.fill();}}
   if(piece.motif==='lamp'){ctx.fillStyle='#fff0bc55';ctx.beginPath();ctx.arc(w/2,55,49,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#775440';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(w/2,72);ctx.lineTo(w/2,112);ctx.stroke();ctx.fillStyle='#f0cc87';ctx.beginPath();ctx.moveTo(w*.3,28);ctx.lineTo(w*.7,28);ctx.lineTo(w*.85,74);ctx.lineTo(w*.15,74);ctx.closePath();ctx.fill();}
   if(piece.colliders.length){const floor=500-piece.target.y;ctx.fillStyle='#93704c';ctx.fillRect(0,floor,w,h-floor);ctx.fillStyle='#d5b175';ctx.fillRect(0,floor,w,7);ctx.strokeStyle='#684e3944';ctx.lineWidth=1;for(let yy=floor+23;yy<h;yy+=21){ctx.beginPath();ctx.moveTo(0,yy);ctx.lineTo(w,yy);ctx.stroke();}}
   for(let i=0;i<25;i++){ctx.fillStyle=i%2?'#fff7d315':'#4c3b2912';ctx.fillRect((i*31+piece.index*7)%w,(i*43)%h,3,2);}
   ctx.restore();
  }
  ctx.restore();
 }
 function keyArt(x,y){ctx.strokeStyle='#d5a03f';ctx.lineWidth=5;ctx.beginPath();ctx.arc(x-9,y,7,0,Math.PI*2);ctx.moveTo(x-2,y);ctx.lineTo(x+18,y);ctx.lineTo(x+18,y+7);ctx.moveTo(x+10,y);ctx.lineTo(x+10,y+5);ctx.stroke();}
 function world(time){
  const vp=config.ui.world;ctx.save();ctx.beginPath();ctx.rect(vp.x,vp.y,vp.width,vp.height);ctx.clip();ctx.translate(-model.cameraX,vp.y);
  const sky=ctx.createLinearGradient(0,0,0,608);sky.addColorStop(0,'#d9c9ad');sky.addColorStop(.65,'#eee0bd');sky.addColorStop(1,'#bb9b76');ctx.fillStyle=sky;ctx.fillRect(model.cameraX,0,1024,608);
  for(const segment of config.segments){
   text(segment.name,segment.origin+50,50,23,'#826c52');text('记忆画面',segment.origin+58,86,13,'#ab9574');
   ctx.globalAlpha=.18;box(segment.origin+45,140,330,120,segment.color,4);ctx.strokeStyle='#8d775d';ctx.lineWidth=3;ctx.strokeRect(segment.origin+80,160,115,78);ctx.strokeRect(segment.origin+230,160,110,78);ctx.globalAlpha=1;
   const optional=config.pieces.find(p=>p.segmentId===segment.id&&p.index===3);
   if(!model.variant.availablePieceIds.includes(optional.id)){box(optional.target.x,optional.target.y,optional.target.w,optional.target.h,'#dfd3ba99',4);text('留白',optional.target.x+75,optional.target.y+100,17,'#b3a183','center');}
  }
  for(const terrain of config.terrain){box(terrain.x,terrain.y,terrain.w,terrain.h,terrain.oneWay?'#aa865e':'#94704d',3);ctx.fillStyle='#d6b780';ctx.fillRect(terrain.x,terrain.y,terrain.w,5);ctx.strokeStyle='#6c4c352c';ctx.lineWidth=1;for(let y=terrain.y+22;y<terrain.y+terrain.h;y+=22){ctx.beginPath();ctx.moveTo(terrain.x,y);ctx.lineTo(terrain.x+terrain.w,y);ctx.stroke();}}
  for(const piece of model.pieces()){
   if(piece.target.x+piece.target.w<model.cameraX||piece.target.x>model.cameraX+1024)continue;
   if(model.pieceStates[piece.id]==='placed')picture(piece,piece.target.x,piece.target.y,1,flash?.id===piece.id?.5+.5*(1-flash.life/.18):1);
   else{
    picture(piece,piece.target.x,piece.target.y,1,.55,true);
    text(serial(piece),piece.target.x+piece.target.w/2,piece.target.y+piece.target.h/2,20,'#92785a','center');
    if(drag?.piece.id===piece.id){const match=model.matches(piece.id,drag.position);ctx.save();ctx.strokeStyle=match?'#557e53':'#caa459';ctx.lineWidth=3;ctx.translate(piece.target.x,piece.target.y);piecePath(piece.target.w,piece.target.h);ctx.stroke();ctx.restore();}
   }
  }
  for(const cp of config.checkpoints){if(cp.x<model.cameraX-20||cp.x>model.cameraX+1024)continue;ctx.strokeStyle=cp.id===model.checkpointId?'#789466':'#bca987';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cp.x,cp.y);ctx.lineTo(cp.x,cp.y-33);ctx.stroke();ctx.fillStyle=cp.id===model.checkpointId?'#789466':'#bca987';ctx.beginPath();ctx.moveTo(cp.x,cp.y-34);ctx.lineTo(cp.x+20,cp.y-27);ctx.lineTo(cp.x,cp.y-20);ctx.fill();}
  const nearby=model.nearestInteraction();
  for(const piece of model.pieces())if(model.pieceStates[piece.id]==='uncollected'){
   const scale=35/piece.target.h,x=piece.pickup.x-piece.target.w*scale/2,y=piece.pickup.y-18+Math.sin(time*.002+piece.index)*3;picture(piece,x,y,scale);
   text(serial(piece),piece.pickup.x,y-14,12,'#795a3d','center');if(nearby?.id===piece.id)text('E 拾取',piece.pickup.x,y-35,15,'#6a583b','center');
  }
  if(!model.keyStates.exitKey){keyArt(config.exitKey.x,config.exitKey.y);if(nearby?.kind==='key')text('E 拿钥匙',config.exitKey.x,config.exitKey.y-30,16,'#765932','center');}
  const door=config.exit;box(door.x-30,door.y-106,60,106,model.completed?'#e7c98b':'#79674f',28);box(door.x-24,door.y-94,48,94,model.completed?'#fff0c1':'#ad8c63',20);ctx.fillStyle='#ead094';ctx.beginPath();ctx.arc(door.x+14,door.y-46,4,0,Math.PI*2);ctx.fill();text('出口',door.x,door.y-126,17,'#7c6345','center');
  const p=model.player,walk=Math.abs(p.vx)>0?Math.sin(time*.018)*5:0;
  ctx.strokeStyle='#6d5745';ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(p.x-5,p.y-12);ctx.lineTo(p.x-6-walk,p.y-1);ctx.moveTo(p.x+5,p.y-12);ctx.lineTo(p.x+6+walk,p.y-1);ctx.moveTo(p.x+10,p.y-27);ctx.lineTo(p.x+18,p.y-16);ctx.lineTo(p.x+20,p.y-1);ctx.stroke();box(p.x-11,p.y-31,22,23,'#71816d',6);ctx.fillStyle='#e8d5ac';ctx.beginPath();ctx.arc(p.x,p.y-40,11,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#e8e0c7';ctx.lineWidth=4;ctx.beginPath();ctx.arc(p.x-1,p.y-42,10,Math.PI*.95,Math.PI*1.85);ctx.stroke();box(p.x-11,p.y-31,23,5,'#ba8264',2);
  if(model.status==='returning'){ctx.fillStyle='#f3e5caaa';ctx.fillRect(model.cameraX,0,1024,608);}
  ctx.restore();
 }
 function inventory(){
  box(1024,56,256,608,'#e2cfaa',0);ctx.strokeStyle='#b79870';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(1024,56);ctx.lineTo(1024,664);ctx.stroke();
  text('拾起的记忆',1152,86,22,'#694e34','center');text('按住切片，拖回场景',1152,113,13,'#8c7051','center');
  const list=model.inventory();scroll=Math.max(0,Math.min(scroll,Math.max(0,Math.ceil(list.length/2)-4)));thumbnails=[];
  if(!list.length){text('附近闪光处有碎片',1152,233,15,'#9c825e','center');text('靠近后按 E 拾取',1152,264,15,'#9c825e','center');}
  list.slice(scroll*2,scroll*2+8).forEach((piece,i)=>{
   const x=1042+(i%2)*116,y=139+Math.floor(i/2)*113;box(x,y,103,105,'#f4e8cc',7);
   const scale=Math.min(78/piece.target.w,72/piece.target.h),w=piece.target.w*scale,h=piece.target.h*scale,rect={x:x+(103-w)/2,y:y+12,w,h,piece};thumbnails.push(rect);
   if(drag?.piece.id!==piece.id)picture(piece,rect.x,rect.y,scale);text(serial(piece),x+51,y+94,13,'#795b3e','center');
  });
  if(list.length>8){button(1044,599,89,30,'↑ 上翻',()=>{scroll=Math.max(0,scroll-1);});button(1156,599,89,30,'↓ 下翻',()=>{scroll++;});}
  const label=model.saveStatus==='saved'?'已保存 · 从安全点继续':model.saveStatus==='memory'?'暂未保存 · 继续游玩时重试':'拾取、拼合后自动保存';text(label,1152,647,12,model.saveStatus==='memory'?'#ab633d':'#8b7153','center');
 }
 function complete(){if(notified||!model.completed)return;notified=true;chapter.onComplete?.({success:true,score:model.variant.completionPieceIds.length,flags:{memoryPuzzleComplete:true,memoryPuzzleFull:model.variant.id==='complete'},levelId:config.id,variantId:model.variant.id});}
 function reset(){model=new MemoryPuzzle({...options,save:null});model.commit();overlay='intro';notified=false;scroll=0;}
 function resume(){overlay=null;clearInputs();canvas.focus();model.commit();}
 function modal(){
  if(!overlay)return;buttons=[];ctx.fillStyle='#352d247a';ctx.fillRect(0,56,1280,608);box(155,115,970,488,'#f4e6ca',18);
  if(overlay==='intro'){
   text('把旧时光，一块一块放回去',640,171,30,'#715136','center');
   paragraph('A / D 或方向键左右移动，Space 跳跃。\n在闪光碎片旁按 E 拾取，再从右栏拖到场景中的同编号缺口。\n拼对后道路立即恢复；放错不会丢失，掉落会回到安全点。\n'+(model.variant.id==='first'?'这一周目：拼好可取得的道路碎片，找到钥匙并抵达出口。':'这一周目：所有记忆碎片都要放回场景，再带钥匙抵达出口。'),205,236,870,18);
   text('当前为可替换示例地图，正式回忆内容待主剧情补充。',640,425,14,'#9c8060','center');
   button(477,476,326,52,'走进记忆  /  空格',resume);
  }else if(overlay==='help'||overlay==='pause'){
   text(overlay==='help'?'操作与当前目标':'在这里歇一会儿',640,166,29,'#715136','center');
   paragraph('A / D、← / →：移动    Space：跳跃    E：拾取 / 开门\n拖动右栏切片，按相同编号匹配缺口；需先拼左侧道路。\nR：回安全点    H：帮助    P：暂停    Esc：取消拖动 / 返回\n掉落不损失碎片。拖放时冻结场景；刷新后从安全点恢复。',205,225,860,17);
   const missing=model.variant.completionPieceIds.filter(id=>model.pieceStates[id]!=='placed').map(id=>serial(config.pieces.find(p=>p.id===id)));
   paragraph((model.keyStates.exitKey?'已拿到钥匙。':'尚需找到出口钥匙。')+' 未拼合：'+(missing.join('、')||'无，可前往出口。'),205,371,855,16);
   if(model.saveStatus==='memory')text('本次进度暂未保存到浏览器。',640,445,17,'#a86539','center');
   button(420,493,440,46,'继续游玩',()=>{overlay=previousOverlay==='intro'?'intro':null;previousOverlay=null;clearInputs();});
  }else if(overlay==='recovery'){
   text('这份存档无法读取',640,178,28,'#715136','center');paragraph(model.error+'\n旧存档已保留。你可以取消并保留存档，或重置当前周目后重新开始。',215,268,850,19);
   button(440,460,400,48,'重置本周目',()=>{overlay='confirm-reset';});
  }else if(overlay==='confirm-reset'){
   text('重置本关当前周目的进度？',640,215,28,'#715136','center');text('其他章节和周目不会受影响。',640,296,18,'#86694d','center');button(350,425,240,50,'返回并保留存档',()=>{overlay='recovery';});button(690,425,240,50,'确认重置此关',reset);
  }else if(overlay==='completed'){
   text(model.variant.id==='complete'?'这段记忆，终于完整了':'带着留白，也能走向前方',640,208,32,'#715136','center');
   paragraph(model.variant.id==='complete'?'本关全部拼图已恢复，出口已经打开。':'本周目需要的道路已恢复，出口已经打开。仍有留白等待下一次回望。',260,304,760,19);
   text(model.saveStatus==='memory'?'本次进度暂未保存到浏览器。':'本关完成，继续后回到总游戏剧情。',640,386,16,'#8b7050','center');button(350,464,310,52,notified?'已完成':'继续故事  /  空格',complete);
  }
 }
 function draw(time){
  buttons=[];ctx.clearRect(0,0,1280,720);world(time);inventory();box(0,0,1280,56,'#ece0c6',0);
  const placed=model.pieces().filter(p=>model.pieceStates[p.id]==='placed').length;
  text('旧时光 · 回忆拼图',24,29,21,'#644d36');text(`${model.variant.id==='first'?'初访 · 可用记忆':'重访 · 完整记忆'}  ${placed} / ${model.pieces().length}`,280,29,16,'#866b4b');text(model.keyStates.exitKey?'钥匙：已取得':'钥匙：未取得',700,29,15,'#82613b');
  button(864,13,70,31,'帮助 H',()=>{if(overlay!=='recovery'&&overlay!=='confirm-reset'){previousOverlay=overlay;overlay='help';cancelDrag();clearInputs();model.commit();}});
  button(945,13,66,31,overlay==='pause'?'继续':'暂停 P',togglePause);
  box(0,664,1280,56,'#eaddbf',0);const hint=drag?(model.matches(drag.piece.id,drag.position)?'松开即可拼合。':'拖近对应轮廓；按 Esc 可取消。'):model.hint();text(hint,23,682,15,'#654d33');
  text('A/D 移动 · Space 跳跃 · E 互动 · R 回安全点',23,707,12,'#9a805e');
  button(825,676,70,32,'←',()=>{touchInput=-1;setTimeout(()=>{touchInput=0;},220);});button(905,676,70,32,'→',()=>{touchInput=1;setTimeout(()=>{touchInput=0;},220);});button(985,676,94,32,'跳跃',()=>model.requestJump());button(1089,676,85,32,'拾取 E',()=>model.interact());button(1184,676,72,32,'回原位',()=>{model.returnToSafety();clearInputs();});
  if(drag){ctx.save();ctx.shadowColor='#40302270';ctx.shadowBlur=14;picture(drag.piece,drag.position.x-model.cameraX,drag.position.y+56,1,config.drag.opacity);ctx.restore();}
  if(returnGhost){const g=returnGhost,ratio=1-g.life/.18;picture(g.piece,g.x+(g.target.x-g.x)*ratio,g.y+(g.target.y-g.y)*ratio,1+(g.target.h/g.piece.target.h-1)*ratio,.8);}
  modal();
 }
 function point(event){const rect=canvas.getBoundingClientRect();return {x:(event.clientX-rect.left)*1280/rect.width,y:(event.clientY-rect.top)*720/rect.height};}
 function clearInputs(){keys.clear();touchInput=0;model.buffer=0;model.player.vx=0;}
 function cancelDrag(){if(!drag)return;returnGhost={piece:drag.piece,x:drag.position.x-model.cameraX,y:drag.position.y+56,target:drag.thumbnail,life:.18};drag=null;clearInputs();model.say('已取消拖动，碎片仍在右栏。');}
 function togglePause(){if(['recovery','confirm-reset','completed'].includes(overlay))return;cancelDrag();clearInputs();if(overlay==='pause')overlay=null;else{overlay='pause';model.commit();}}
 function down(event){
  event.preventDefault();canvas.focus();const p=point(event);
  const buttonHit=[...buttons].reverse().find(b=>contains(b,p));
  // A modal only accepts buttons rendered in its own panel, not the controls behind it.
  if(overlay){if(buttonHit)buttonHit.action();return;}
  if(buttonHit){buttonHit.action();return;}
  if(model.status!=='playing')return;
  const thumbnail=thumbnails.find(t=>contains(t,p));if(!thumbnail)return;
  const piece=thumbnail.piece;drag={piece,thumbnail,offset:{x:(p.x-thumbnail.x)/thumbnail.w*piece.target.w,y:(p.y-thumbnail.y)/thumbnail.h*piece.target.h},position:{x:0,y:0}};
  updateDrag(p);clearInputs();model.tutorial('dragged');canvas.setPointerCapture?.(event.pointerId);
 }
 function updateDrag(p){if(drag)drag.position={x:p.x+model.cameraX-drag.offset.x,y:p.y-56-drag.offset.y};}
 function move(event){if(!drag)return;const p=point(event);if(p.x<0||p.x>1280||p.y<56||p.y>664){cancelDrag();return;}updateDrag(p);}
 function up(event){if(!drag)return;const p=point(event);updateDrag(p);const current=drag;
  if(p.x<1024&&p.y>=56&&p.y<664&&model.place(current.piece.id,current.position)){flash={id:current.piece.id,life:.18};drag=null;}
  else{const feedback=model.message;cancelDrag();model.say(p.x>=1024?'碎片已回到右栏。':feedback);}
  if(canvas.hasPointerCapture?.(event.pointerId))canvas.releasePointerCapture(event.pointerId);
 }
 function wheel(event){if(point(event).x>=1024){event.preventDefault();scroll+=event.deltaY>0?1:-1;}}
 function keydown(event){
  if(document.querySelector('dialog[open]')||['INPUT','TEXTAREA'].includes(event.target.tagName))return;const key=event.key.length===1?event.key.toLowerCase():event.key;
  if(['a','d','ArrowLeft','ArrowRight',' ','e','r','h','p','Escape'].includes(key))event.preventDefault();
  if(key==='Escape'){if(drag)cancelDrag();else if(overlay==='help'){overlay=previousOverlay;previousOverlay=null;}else if(!overlay||overlay==='pause')togglePause();return;}
  if(event.repeat){if(['a','d','ArrowLeft','ArrowRight'].includes(key)&&!overlay&&!drag)keys.add(key);return;}
  if(key===' '&&overlay){if(overlay==='intro')resume();else if(overlay==='completed')complete();return;}
  if(key==='h'&&overlay!=='recovery'&&overlay!=='confirm-reset'){cancelDrag();clearInputs();if(overlay==='help'){overlay=previousOverlay;previousOverlay=null;}else{previousOverlay=overlay;overlay='help';model.commit();}return;}
  if(key==='p'){togglePause();return;}
  if(overlay||drag)return;
  if(['a','d','ArrowLeft','ArrowRight'].includes(key))keys.add(key);
  if(key===' ')model.requestJump();if(key==='e')model.interact();if(key==='r'){model.returnToSafety();clearInputs();}
 }
 const keyup=event=>keys.delete(event.key.length===1?event.key.toLowerCase():event.key);
 function blur(){cancelDrag();clearInputs();if(!overlay&&model.status==='playing')overlay='pause';model.commit();}
 const visibility=()=>{if(document.hidden)blur();};
 canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',cancelDrag);canvas.addEventListener('wheel',wheel,{passive:false});
 window.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);window.addEventListener('blur',blur);document.addEventListener('visibilitychange',visibility);
 function frame(time){
  if(destroyed)return;const dt=Math.min((time-lastTime)/1000||0,.1);lastTime=time;
  const paused=!!document.querySelector('dialog[open]');if(paused&&!hostPaused){cancelDrag();clearInputs();model.commit();}hostPaused=paused;
  if(!overlay&&!drag&&!paused&&!document.hidden){accumulator=Math.min(accumulator+dt,5/60);while(accumulator>=1/60){model.step(1/60,(keys.has('d')||keys.has('ArrowRight')?1:0)-(keys.has('a')||keys.has('ArrowLeft')?1:0)+touchInput);accumulator-=1/60;if(model.status==='returning')clearInputs();}}else accumulator=0;
  if(model.status==='completed'&&overlay!=='help')overlay='completed';if(model.status==='recovery'&&!['recovery','confirm-reset'].includes(overlay))overlay='recovery';
  if(returnGhost){returnGhost.life-=dt;if(returnGhost.life<=0)returnGhost=null;}if(flash){flash.life-=dt;if(flash.life<=0)flash=null;}
  draw(time);requestId=requestAnimationFrame(frame);
 }
 let requestId=requestAnimationFrame(frame);
 return {
  getSaveData:()=>model.snapshot(),
  move(direction){touchInput=direction;setTimeout(()=>{touchInput=0;},200);},
  destroy(){if(destroyed)return;cancelDrag();model.commit();destroyed=true;cancelAnimationFrame(requestId);window.removeEventListener('keydown',keydown);window.removeEventListener('keyup',keyup);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',visibility);canvas.remove();}
 };
}
