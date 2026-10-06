export const ARENA={left:48,right:1232,top:156,bottom:590};
export const SHELTERS=[{x:285,y:270,r:61},{x:985,y:278,r:61},{x:310,y:493,r:58},{x:954,y:486,r:58}];
export const WALLS=[{x:472,y:284,w:94,h:48},{x:714,y:441,w:94,h:48}];
export const ITEMS=[
 {id:'ember',name:'余烬灯芯',tag:'伤害',description:'每发伤害 +65%\n让微光也能击退阴影。'},
 {id:'clock',name:'旧怀表',tag:'射速',description:'攻击间隔缩短 30%\n给每一次心跳多一点勇气。'},
 {id:'echo',name:'回声铃',tag:'多重攻击',description:'每次额外发射一枚光弹\n同时追击附近的多个敌人。'},
 {id:'orbit',name:'纸星环',tag:'近身防护',description:'星环每 0.6 秒灼伤近敌\n靠得太近的阴影会受伤。'},
 {id:'boots',name:'轻风鞋',tag:'机动',description:'移动速度 +30%\n更快穿过怪潮与危险区域。'},
 {id:'cloak',name:'苔色披风',tag:'躲藏',description:'屏息时长 +3 秒，藏身回血翻倍\n用片刻安静换一次反击。'},
 {id:'heart',name:'热可可',tag:'生命',description:'生命上限 +40，并恢复 50 点\n还有温暖值得守住。'},
 {id:'shield',name:'旧胸针',tag:'减伤',description:'每次受到的伤害减少 5 点\n至少承受 1 点伤害。'},
 {id:'needle',name:'银色书签',tag:'穿透',description:'光弹可额外穿透两名敌人\n穿过拥挤的回忆。'}
];
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
function blocked(x,y,r){return WALLS.some(w=>Math.hypot(x-clamp(x,w.x,w.x+w.w),y-clamp(y,w.y,w.y+w.h))<r);}
function move(body,dx,dy){
 const x=clamp(body.x+dx,ARENA.left+body.r,ARENA.right-body.r);
 if(!blocked(x,body.y,body.r))body.x=x;
 const y=clamp(body.y+dy,ARENA.top+body.r,ARENA.bottom-body.r);
 if(!blocked(body.x,y,body.r))body.y=y;
}

export class SurvivorRun {
 constructor({random=Math.random,roundDuration=22}={}){
  this.random=random;this.roundDuration=roundDuration;this.mode='ready';this.wave=1;this.time=0;this.kills=0;
  this.items=[];this.offers=[];this.enemies=[];this.shots=[];this.hazards=[];this.drops=[];this.effects=[];this.damageTaken=0;
  this.player={x:640,y:420,r:13,hp:100,maxHp:100,speed:215,damage:18,interval:.43,projectiles:1,pierce:0,armor:0,breath:4,maxBreath:4,healing:4,hidden:false,exhausted:false,invulnerable:0};
  this.fireTimer=0;this.spawnTimer=.3;this.orbitTimer=0;this.nextId=1;this.boss=null;
 }
 start(){if(this.mode==='ready')this.mode='wave';}
 choices(){
  const pool=ITEMS.filter(item=>!this.items.includes(item.id));
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  return pool.slice(0,3);
 }
 choose(id){
  if(this.mode!=='choice'||!this.offers.some(item=>item.id===id))return false;
  this.items.push(id);const p=this.player;
  if(id==='ember')p.damage*=1.65;
  if(id==='clock')p.interval*=.7;
  if(id==='echo')p.projectiles++;
  if(id==='orbit')this.orbit=true;
  if(id==='boots')p.speed*=1.3;
  if(id==='cloak'){p.maxBreath+=3;p.healing*=2;}
  if(id==='heart'){p.maxHp+=40;p.hp+=50;}
  if(id==='shield')p.armor+=5;
  if(id==='needle')p.pierce+=2;
  p.hp=Math.min(p.maxHp,p.hp+12);p.breath=p.maxBreath;p.exhausted=false;
  this.offers=[];this.time=0;this.spawnTimer=1;this.fireTimer=0;
  if(this.items.length===3){
   this.mode='boss';this.boss={id:this.nextId++,x:640,y:p.y<360?530:210,r:33,hp:1400,maxHp:1400,attackTimer:2,attackCount:0,warning:null};
  }else{this.wave++;this.mode='wave';}
  return true;
 }
 hurt(amount){
  const p=this.player;if(p.invulnerable>0||!['wave','boss'].includes(this.mode))return;
  const previousHp=p.hp;p.hp=Math.max(0,p.hp-Math.max(1,amount-p.armor));this.damageTaken+=previousHp-p.hp;p.invulnerable=.8;
  this.effects.push({x:p.x,y:p.y,r:25,life:.25,color:'hurt'});
  if(p.hp<=0)this.mode='lost';
 }
 spawn(){
  const side=Math.floor(this.random()*4),r=12;
  let x=ARENA.left+18+this.random()*(ARENA.right-ARENA.left-36),y=ARENA.top+18+this.random()*(ARENA.bottom-ARENA.top-36);
  if(side===0)x=ARENA.left+r;if(side===1)x=ARENA.right-r;if(side===2)y=ARENA.top+r;if(side===3)y=ARENA.bottom-r;
  if(distance({x,y},this.player)<130)return;
  const fast=this.wave>=2&&this.random()<.3;
  const shooter=this.wave>=3&&!fast&&this.random()<.22;
  this.enemies.push({id:this.nextId++,x,y,r:fast?10:r,hp:fast?24:30+this.wave*3,speed:fast?125:64+this.wave*9,fast,shooter,fire:1.5,heading:this.random()*Math.PI*2});
 }
 projectile(from,to,speed,hostile=false){
  const angle=Math.atan2(to.y-from.y,to.x-from.x);
  const shot={x:from.x,y:from.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:2.8,r:hostile?5:4,damage:this.player.damage,pierce:this.player.pierce,hits:new Set()};
  (hostile?this.hazards:this.shots).push(shot);
 }
 step(delta,input={}){
  if(!['wave','boss'].includes(this.mode))return;
  const dt=Math.min(Math.max(delta,0),.05),p=this.player;this.time+=dt;
  p.invulnerable=Math.max(0,p.invulnerable-dt);
  const shelter=SHELTERS.find(s=>distance(p,s)<s.r-8);
  if(!input.hide)p.exhausted=false;
  p.hidden=!!(input.hide&&shelter&&!p.exhausted&&p.breath>0);
  if(p.hidden){p.breath=Math.max(0,p.breath-dt);p.hp=Math.min(p.maxHp,p.hp+p.healing*dt);if(p.breath===0)p.exhausted=true;}
  else p.breath=Math.min(p.maxBreath,p.breath+dt*.8);
  let dx=input.x||0,dy=input.y||0;const length=Math.hypot(dx,dy);
  if(length>0)move(p,dx/length*p.speed*dt*(p.hidden?.5:1),dy/length*p.speed*dt*(p.hidden?.5:1));
  // Leaving foliage exposes the player immediately, even if hide is still held.
  if(p.hidden&&!SHELTERS.some(s=>distance(p,s)<s.r-8))p.hidden=false;
  this.spawnTimer-=dt;
  if(this.spawnTimer<=0){if(this.enemies.length<(this.mode==='boss'?18:42))this.spawn();this.spawnTimer=this.mode==='boss'?2.1:Math.max(.35,.9-this.wave*.17);}
  for(const enemy of this.enemies){
   let angle=p.hidden?enemy.heading:Math.atan2(p.y-enemy.y,p.x-enemy.x);
   if(p.hidden&&this.random()<dt*.6)enemy.heading+=1.4;
   if(!enemy.shooter||distance(enemy,p)>230||p.hidden)move(enemy,Math.cos(angle)*enemy.speed*dt,Math.sin(angle)*enemy.speed*dt);
   if(enemy.shooter&&!p.hidden){enemy.fire-=dt;if(enemy.fire<=0){this.projectile(enemy,p,175,true);enemy.fire=2.3;}}
   if(distance(enemy,p)<enemy.r+p.r)this.hurt(12);
  }
  if(this.boss)this.updateBoss(dt);
  this.fireTimer-=dt;
  if(!p.hidden&&this.fireTimer<=0){
   const targets=[...this.enemies,...(this.boss?[this.boss]:[])].filter(e=>e.hp>0&&distance(p,e)<490).sort((a,b)=>distance(p,a)-distance(p,b));
   if(targets.length){for(let i=0;i<p.projectiles;i++)this.projectile(p,targets[i%targets.length],440);this.fireTimer=p.interval;}
  }
  if(this.orbit&&!p.hidden){this.orbitTimer-=dt;if(this.orbitTimer<=0){for(const target of [...this.enemies,...(this.boss?[this.boss]:[])])if(distance(p,target)<88+target.r)target.hp-=16;this.orbitTimer=.6;}}
  for(const shot of this.shots){
   shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;shot.life-=dt;
   if(blocked(shot.x,shot.y,shot.r)){shot.life=0;continue;}
   for(const target of [...this.enemies,...(this.boss?[this.boss]:[])]){
    if(shot.life<=0||target.hp<=0||shot.hits.has(target.id))continue;
    if(distance(shot,target)<target.r+shot.r){target.hp-=shot.damage;shot.hits.add(target.id);this.effects.push({x:shot.x,y:shot.y,r:12,life:.15,color:'hit'});if(shot.pierce--<=0)shot.life=0;}
   }
  }
  for(const shot of this.hazards){
   shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;shot.life-=dt;
   if(blocked(shot.x,shot.y,shot.r)){shot.life=0;continue;}
   if(distance(shot,p)<p.r+shot.r){this.hurt(14);shot.life=0;}
  }
  this.shots=this.shots.filter(s=>s.life>0);this.hazards=this.hazards.filter(s=>s.life>0);
  for(const enemy of this.enemies)if(enemy.hp<=0){this.kills++;this.drops.push({x:enemy.x,y:enemy.y,life:18});}
  this.enemies=this.enemies.filter(e=>e.hp>0);
  for(const drop of this.drops){drop.life-=dt;if(distance(p,drop)<70){const angle=Math.atan2(p.y-drop.y,p.x-drop.x);drop.x+=Math.cos(angle)*180*dt;drop.y+=Math.sin(angle)*180*dt;}if(distance(p,drop)<20){p.hp=Math.min(p.maxHp,p.hp+2);drop.life=0;}}
  this.drops=this.drops.filter(d=>d.life>0).slice(-80);
  for(const effect of this.effects)effect.life-=dt;this.effects=this.effects.filter(e=>e.life>0);
  if(this.mode==='lost')return;
  if(this.boss&&this.boss.hp<=0){this.mode='won';this.hazards=[];return;}
  if(this.mode==='wave'&&this.time>=this.roundDuration){this.mode='choice';this.offers=this.choices();this.enemies=[];this.shots=[];this.hazards=[];p.hidden=false;}
 }
 updateBoss(dt){
  const b=this.boss,p=this.player,enraged=b.hp<b.maxHp*.5;
  if(!p.hidden){const angle=Math.atan2(p.y-b.y,p.x-b.x);move(b,Math.cos(angle)*(enraged?57:40)*dt,Math.sin(angle)*(enraged?57:40)*dt);}
  if(distance(b,p)<b.r+p.r)this.hurt(23);
  if(b.warning){
   b.warning.t-=dt;
   if(b.warning.kind==='mark'&&p.hidden){b.warning=null;b.attackTimer=1.6;return;}
   if(b.warning.t<=0){
    if(b.warning.kind==='mark'){
     this.effects.push({...b.warning,r:70,life:.45,color:'hurt'});
     if(distance(p,b.warning)<70+p.r)this.hurt(28);
    }else{
     const count=enraged?18:12;
     for(let i=0;i<count;i++){const angle=i/count*Math.PI*2;this.projectile(b,{x:b.x+Math.cos(angle),y:b.y+Math.sin(angle)},enraged?185:150,true);}
    }
    b.warning=null;b.attackTimer=enraged?1.7:2.6;
   }
  }else{
   b.attackTimer-=dt;
   if(b.attackTimer<=0){const kind=b.attackCount++%2===0?'burst':'mark';if(kind==='mark'&&p.hidden){b.attackTimer=1;return;}b.warning={kind,x:kind==='mark'?p.x:b.x,y:kind==='mark'?p.y:b.y,t:1.2};}
  }
 }
}
