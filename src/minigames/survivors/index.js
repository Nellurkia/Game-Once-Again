import {register} from '../index.js';
import {SurvivorRun,ARENA,SHELTERS,WALLS,ITEMS} from './model.js';

register('survivors',{create(scene,config,onComplete,{onAchievement}={}){
 let run=new SurvivorRun(),overlay=null,lastMode='',destroyed=false,finished=false,hideToggle=false,pointerTarget=null,nudge=null;
 const touch=matchMedia('(pointer: coarse)').matches;
 const keys=new Set();
 const colors={floor:0x14272d,edge:0x38504e,gold:0xf4d69a,mint:0x9ed9bb,pink:0xe990a0};
 const text=(x,y,value,size=16,color='#c2cfc9')=>scene.add.text(x,y,value,{fontFamily:'"Microsoft YaHei", sans-serif',fontSize:`${size}px`,color,lineSpacing:9});
 // Fixed courtyard layout: the same foliage and walls govern both drawing and collision.
 const bg=scene.add.graphics();
 bg.fillStyle(0x101d25);bg.fillRect(0,0,1280,720);
 bg.fillStyle(colors.floor);bg.fillRoundedRect(ARENA.left,ARENA.top,ARENA.right-ARENA.left,ARENA.bottom-ARENA.top,16);
 bg.lineStyle(2,colors.edge);bg.strokeRoundedRect(ARENA.left,ARENA.top,ARENA.right-ARENA.left,ARENA.bottom-ARENA.top,16);
 for(let x=70;x<1220;x+=44)for(let y=177;y<585;y+=42){bg.fillStyle(0x607568,.13);bg.fillCircle(x,y,1);}
 bg.fillStyle(0x7d8272,.08);bg.fillRect(55,357,1170,34);bg.fillRect(608,160,64,425);
 for(const s of SHELTERS){
  bg.fillStyle(0x2f6454,.55);bg.fillCircle(s.x,s.y,s.r);bg.lineStyle(1,0x6ab190,.6);bg.strokeCircle(s.x,s.y,s.r);
  for(let i=0;i<12;i++){const angle=i/12*Math.PI*2;bg.fillStyle(i%2?0x396b58:0x467a5d,.75);bg.fillEllipse(s.x+Math.cos(angle)*32,s.y+Math.sin(angle)*32,38,23);}
 }
 for(const w of WALLS){bg.fillStyle(0x0c1c21,.55);bg.fillRoundedRect(w.x+5,w.y+7,w.w,w.h,7);bg.fillStyle(0x53605a);bg.fillRoundedRect(w.x,w.y,w.w,w.h,7);bg.lineStyle(2,0x849080,.6);bg.strokeRoundedRect(w.x,w.y,w.w,w.h,7);bg.lineBetween(w.x+32,w.y,w.x+32,w.y+w.h);bg.lineBetween(w.x+65,w.y,w.x+65,w.y+w.h);}
 const art=scene.add.graphics();
 const heading=text(48,66,'夜庭',25,'#f0e3bf');
 const stage=text(48,108,'',15,'#9bcdb8');
 const health=text(440,77,'',15,'#f0e3bf');
 const breath=text(760,77,'',15,'#9bcdb8');
 const score=text(1216,83,'',15,'#cabdde').setOrigin(1,0);
 const status=text(640,602,'',14,'#b9cfbe').setOrigin(.5,0);
 const inventory=text(48,636,'道具  0 / 3',14,'#d3bd95');
 text(275,682,touch?'拖动移动 · 自动攻击 · 点右侧躲藏':'方向键移动 · 空格躲藏',touch?14:13,'#8caaa0').setOrigin(0,.5);
 const hideButton=scene.add.rectangle(1090,645,touch?280:222,touch?84:48,0x294c42).setStrokeStyle(1,0x699b7e).setInteractive({useHandCursor:true});
 const hideLabel=text(1090,touch?645:657,'躲藏：关',touch?18:15,'#c7e6c8').setOrigin(.5);
 hideButton.on('pointerdown',()=>{if(['wave','boss'].includes(run.mode)){hideToggle=!hideToggle;window.playGameSfx?.('select');}});

 function cardButton(container,x,y,w,h,label,action){
  const shape=scene.add.rectangle(x,y,w,h,0x315d4e).setStrokeStyle(1,0x92b59c).setInteractive({useHandCursor:true});
  const labelText=text(x,y,label,18,'#f4e8c6').setOrigin(.5);
  shape.on('pointerover',()=>shape.setFillStyle(0x477860));shape.on('pointerout',()=>shape.setFillStyle(0x315d4e));shape.on('pointerdown',action);
  container.add([shape,labelText]);
 }
 function begin(){if(run.mode==='ready'){window.playGameSfx?.('select');keys.clear();run.start();}}
 function pick(index){if(run.mode==='choice'&&run.offers[index]){window.playGameSfx?.('confirm');run.choose(run.offers[index].id);keys.clear();hideToggle=false;}}
 function retry(){window.playGameSfx?.('select');run=new SurvivorRun();run.start();keys.clear();hideToggle=false;pointerTarget=null;nudge=null;}
 function complete(){if(finished||run.mode!=='won')return;finished=true;onComplete({success:true,score:run.kills,flags:{nightGardenCleared:true,nightGardenItems:[...run.items]}});}
 function showOverlay(){
  overlay?.destroy(true);overlay=null;
  if(['wave','boss'].includes(run.mode))return;
  overlay=scene.add.container(0,0).setDepth(20);
  const shade=scene.add.rectangle(640,360,1280,720,0x081317,.88).setInteractive();overlay.add(shade);
  if(run.mode==='choice'){
   overlay.add(text(640,185,'选择道具',30,'#f3dfb4').setOrigin(.5));
   overlay.add(text(640,231,run.items.length===2?'最后一次选择':'选择一件强化本局',16).setOrigin(.5));
   run.offers.forEach((item,i)=>{
    const x=320+i*320;
    const card=scene.add.rectangle(x,405,286,260,0x203b3b).setStrokeStyle(2,0x658b74).setInteractive({useHandCursor:true});
    card.on('pointerover',()=>card.setFillStyle(0x315347));card.on('pointerout',()=>card.setFillStyle(0x203b3b));card.on('pointerdown',()=>pick(i));
    overlay.add(card);overlay.add(text(x,305,`${i+1}  /  ${item.tag}`,14,'#a2c9b0').setOrigin(.5));
    overlay.add(text(x,354,item.name,26,'#f5dca7').setOrigin(.5));
    overlay.add(text(x,421,item.description,16,'#c9d7c7').setOrigin(.5).setAlign('center'));
    overlay.add(text(x,499,touch?'点按选择':'点击选择 · '+(i+1),14,'#ecd0a2').setOrigin(.5));
   });
  }else if(run.mode==='ready'){
   overlay.add(text(640,252,'夜庭',42,'#f5dfa9').setOrigin(.5));
   overlay.add(text(640,314,'生存三波，选择道具，击败 Boss。',20,'#a7d3b6').setOrigin(.5));
   overlay.add(text(640,370,touch?'拖动移动 · 自动攻击 · 躲藏恢复生命':'移动自动攻击 · 草丛躲藏恢复生命',16,'#c2cfc9').setOrigin(.5));
   cardButton(overlay,640,465,270,62,touch?'开始':'开始 · 空格',begin);
  }else if(run.mode==='lost'){
   onAchievement?.('night-fear');
   overlay.add(text(640,280,'微光熄灭',38,'#edc8bd').setOrigin(.5));
   cardButton(overlay,640,370,260,58,touch?'再试一次':'再试一次 · R',retry);
  }else{
   if(run.mode==='won'&&run.damageTaken===0)onAchievement?.('night-flawless');
   overlay.add(text(640,280,'夜色散去',38,'#f5dfa9').setOrigin(.5));
   cardButton(overlay,640,370,280,62,touch?'继续':'继续 · 空格',complete);
  }
 }
 const controls=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d',' '];
 function down(event){
  if(document.querySelector('dialog[open]')||['INPUT','TEXTAREA'].includes(event.target.tagName))return;
  const key=event.key.length===1?event.key.toLowerCase():event.key;
  if(key===' '&&['ready','won'].includes(run.mode)){event.preventDefault();if(!event.repeat){begin();complete();}return;}
  if(controls.includes(key)){event.preventDefault();keys.add(key);}
  if(event.repeat)return;
  if(key==='r'&&run.mode==='lost'){event.preventDefault();retry();}
  if(['1','2','3'].includes(key)&&run.mode==='choice'){event.preventDefault();pick(Number(key)-1);}
 }
 const up=event=>keys.delete(event.key.length===1?event.key.toLowerCase():event.key);
 const resetInput=()=>{keys.clear();pointerTarget=null;hideToggle=false;nudge=null;};
 const pointerDown=(p,objects)=>{if(!objects.length&&p.y>=ARENA.top&&p.y<=ARENA.bottom)pointerTarget={x:p.x,y:p.y};};
 const pointerMove=p=>{if(pointerTarget&&p.isDown)pointerTarget={x:p.x,y:p.y};};
 const pointerUp=()=>{pointerTarget=null;};
 window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',resetInput);
 scene.input.on('pointerdown',pointerDown);scene.input.on('pointermove',pointerMove);scene.input.on('pointerup',pointerUp);scene.input.on('pointerupoutside',pointerUp);

 function draw(time){
  const p=run.player;art.clear();
  art.fillStyle(0x213c3a);art.fillRoundedRect(438,105,260,9,4);art.fillStyle(p.hp<30?0xd97b86:0x9ed9bb);art.fillRoundedRect(438,105,Math.max(1,260*p.hp/p.maxHp),9,4);
  art.fillStyle(0x213c3a);art.fillRoundedRect(758,105,185,9,4);art.fillStyle(0x91bfd2);art.fillRoundedRect(758,105,Math.max(1,185*p.breath/p.maxBreath),9,4);
  if(run.mode==='wave'){art.fillStyle(0x71ac88,.65);art.fillRect(48,140,1184*Math.min(1,run.time/run.roundDuration),3);}
  if(run.boss){
   const b=run.boss;art.fillStyle(0x412d47);art.fillRect(280,128,720,12);art.fillStyle(0xc590c7);art.fillRect(280,128,720*Math.max(0,b.hp/b.maxHp),12);
   if(b.warning){const w=b.warning;art.fillStyle(w.kind==='mark'?0xe67988:0xc5a1dc,.17+(1.2-w.t)*.15);art.lineStyle(2,0xe8a0ba,.8);const x=w.kind==='mark'?w.x:b.x,y=w.kind==='mark'?w.y:b.y;art.fillCircle(x,y,w.kind==='mark'?70:54);art.strokeCircle(x,y,w.kind==='mark'?70:54);}
   art.fillStyle(0x0b1520,.45);art.fillEllipse(b.x,b.y+30,90,20);
   art.fillStyle(0x7d629a);art.fillTriangle(b.x-53,b.y+22,b.x-20,b.y-26,b.x,b.y+30);art.fillTriangle(b.x+53,b.y+22,b.x+20,b.y-26,b.x,b.y+30);
   art.fillStyle(0x493b60);art.fillCircle(b.x,b.y,b.r);art.lineStyle(2,0xcbb0df);art.strokeCircle(b.x,b.y,b.r);
   art.fillStyle(0xf8d5b3);art.fillCircle(b.x-11,b.y-4,4);art.fillCircle(b.x+11,b.y-4,4);
  }
  for(const d of run.drops){art.fillStyle(0xf3d887,.3);art.fillCircle(d.x,d.y,9);art.fillStyle(0xf3d887);art.fillCircle(d.x,d.y,3);}
  for(const e of run.enemies){
   art.fillStyle(e.shooter?0xb08ac5:e.fast?0xc07f8c:0x788aa6);art.fillTriangle(e.x-20,e.y+8,e.x,e.y-9,e.x+20,e.y+8);art.fillCircle(e.x,e.y,e.r);
   art.fillStyle(0x182029);art.fillCircle(e.x-4,e.y-2,2);art.fillCircle(e.x+4,e.y-2,2);
  }
  if(run.orbit){art.lineStyle(1,0xd4bf88,.45);art.strokeCircle(p.x,p.y,88);for(let i=0;i<3;i++){const a=time*.002+i*Math.PI*2/3;art.fillStyle(0xf2d489);art.fillCircle(p.x+Math.cos(a)*88,p.y+Math.sin(a)*88,4);}}
  for(const s of run.shots){art.lineStyle(2,0xf0d293,.4);art.lineBetween(s.x-s.vx*.025,s.y-s.vy*.025,s.x,s.y);art.fillStyle(0xffe7b0);art.fillCircle(s.x,s.y,s.r);}
  for(const s of run.hazards){art.fillStyle(0xdf839d);art.fillCircle(s.x,s.y,s.r);}
  const alpha=p.hidden?.4:p.invulnerable>0&&Math.sin(time*.04)>0?.45:1;
  art.fillStyle(0x8ddeb1,.1);art.fillCircle(p.x,p.y,28);art.fillStyle(0x8dbea6,alpha);art.fillTriangle(p.x-14,p.y+17,p.x,p.y-9,p.x+14,p.y+17);art.fillStyle(0xf4e2b5,alpha);art.fillCircle(p.x,p.y-3,10);art.lineStyle(2,p.hidden?0x8be0b1:0xf8dfad,alpha);art.strokeCircle(p.x,p.y,17);
  for(const e of run.effects){art.lineStyle(2,e.color==='hurt'?0xe6939c:0xf6db9d,Math.min(1,e.life*4));art.strokeCircle(e.x,e.y,e.r+(1-e.life)*8);}
  health.setText(`生命  ${Math.ceil(p.hp)} / ${p.maxHp}`);breath.setText(`屏息  ${p.breath.toFixed(1)} 秒`);score.setText(`击退  ${run.kills}`);
  heading.setText(run.mode==='boss'?'Boss':'夜庭');
  stage.setText(run.mode==='boss'?'最终战':'第 '+run.wave+' / 3 波 · '+Math.max(0,Math.ceil(run.roundDuration-run.time))+' 秒');
  const inShelter=SHELTERS.some(s=>Math.hypot(p.x-s.x,p.y-s.y)<s.r-8);
  status.setText(p.hidden?'躲藏中':p.exhausted&&(hideToggle||keys.has(' '))?'屏息耗尽':run.boss?.warning?'危险！':inShelter?'空格躲藏':'收集微光 · 草丛躲藏');
  inventory.setText(`道具 ${run.items.length} / 3  ${run.items.map(id=>ITEMS.find(item=>item.id===id).name).join(' · ')}`);
  hideLabel.setText(hideToggle||keys.has(' ')?'躲藏：开':'躲藏：关');
 }
 function update(time,delta){
  if(destroyed||finished)return;
  if(document.hidden||document.querySelector('dialog[open]')){resetInput();return;}
  let x=(keys.has('d')||keys.has('ArrowRight')?1:0)-(keys.has('a')||keys.has('ArrowLeft')?1:0);
  let y=(keys.has('s')||keys.has('ArrowDown')?1:0)-(keys.has('w')||keys.has('ArrowUp')?1:0);
  if(nudge){x+=nudge.x;y+=nudge.y;nudge.remaining-=delta/1000;if(nudge.remaining<=0)nudge=null;}
  if(pointerTarget&&!x&&!y){const dx=pointerTarget.x-run.player.x,dy=pointerTarget.y-run.player.y;if(Math.hypot(dx,dy)>8){x=dx;y=dy;}}
  run.step(delta/1000,{x,y,hide:hideToggle||keys.has(' ')});
  if(lastMode!==run.mode){lastMode=run.mode;pointerTarget=null;showOverlay();}
  draw(time);
 }
 scene.events.on('update',update);
 return {move(x,y){nudge={x,y,remaining:.2};},destroy(){destroyed=true;keys.clear();overlay?.destroy(true);scene.events.off('update',update);window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',resetInput);scene.input.off('pointerdown',pointerDown);scene.input.off('pointermove',pointerMove);scene.input.off('pointerup',pointerUp);scene.input.off('pointerupoutside',pointerUp);}};
}});
