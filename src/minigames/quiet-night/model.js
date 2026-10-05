export const SPOTS=[{id:'blanket',name:'被窝',x:340},{id:'underbed',name:'床底',x:480},{id:'wardrobe',name:'衣柜',x:1060}];
export const RESPONSES={hide:{title:'躲回去',lines:['孩子回到了被窝，把游戏机轻轻放下。','今晚还没有准备好，也可以先保护自己。','争吵并没有被解决。它从来不是孩子的责任。']},silent:{title:'沉默',lines:['孩子站在门边，没有开口。','门外的人看见了他，停下片刻。','不需要解释，也可以让别人知道自己在这里。']},fear:{title:'我害怕',lines:['孩子：我害怕。','门外静了一会儿。一个大人走近，在门边蹲下来。','“对不起，让你害怕了。不是你的错。”','分歧还在，今晚也没有一下子变好。','但这一次，有人陪孩子回到了房间。']},sleep:{title:'夜还没有结束，孩子先睡着了',lines:['屏幕里的字渐渐看不清了。','争吵仍隔着门传来，手里的游戏机慢慢垂下。','孩子没有说出口。夜晚终于在困倦中远去了。']}};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export class QuietNight {
 constructor({playthrough=1,save=null,onProgress=()=>false}={}){
  this.revisit=playthrough!==1;this.onProgress=onProgress;this.phase='room';this.x=590;this.y=400;this.hidden=null;this.roomTime=0;this.hiddenTime=0;this.gameTime=0;this.exposure=0;this.invulnerable=0;this.waveClock=0;this.waves=[];this.bullets=[];this.spawnClock=0;this.serial=0;this.message='找一处藏身的地方。靠近后按 E。';this.response=null;this.line=0;this.returned=false;this.saved=true;this.saveClock=0;
  if(save&&save.version===1&&save.revisit===this.revisit&&['room','arcade','response','ending','done'].includes(save.phase)&&['roomTime','hiddenTime','gameTime','x','y'].every(k=>Number.isFinite(save[k]))&&(!save.response||RESPONSES[save.response])){
   this.phase=save.phase;this.roomTime=clamp(save.roomTime,0,3600);this.hiddenTime=clamp(save.hiddenTime,0,3600);this.gameTime=clamp(save.gameTime,0,48);this.x=clamp(save.x,70,1160);this.y=clamp(save.y,150,575);this.returned=this.revisit&&!!save.returned;this.response=save.response;this.line=Number.isInteger(save.line)?clamp(save.line,0,5):0;
   if(['ending','done'].includes(this.phase)&&!this.response)this.phase='room';if(this.phase==='response'&&!this.revisit)this.phase='room';
  }
 }
 snapshot(){return {version:1,revisit:this.revisit,phase:this.phase,x:this.x,y:this.y,roomTime:this.roomTime,hiddenTime:this.hiddenTime,gameTime:this.gameTime,returned:this.returned,response:this.response,line:this.line};}
 commit(){try{this.saved=this.onProgress(this.snapshot())===true;}catch{this.saved=false;}}
 get consoleReady(){return this.roomTime>=12&&this.hiddenTime>=3;}
 get canLeave(){return this.revisit&&this.phase==='arcade'&&this.gameTime>=8;}
 interact(){
  if(this.phase!=='room')return;
  if(this.hidden){this.hidden=null;this.message='离开了藏身处。';return;}
  if(this.x<175){if(this.returned){this.phase='response';this.commit();}else{this.x=245;this.exposure=1;this.message=this.revisit?'门后的声音把你推了回来。先去看看游戏机。':'门被声浪推回。孩子没有说话。';}return;}
  const spot=SPOTS.find(s=>Math.abs(s.x-this.x)<62);if(spot){this.hidden=spot.id;this.message=`藏进${spot.name}。按 E 可以出来。`;return;}
  if(Math.abs(this.x-775)<75){if(this.consoleReady){this.phase='arcade';this.x=640;this.y=520;this.bullets=[];this.commit();}else this.message='先躲一会儿：在任意藏身处累计停留 3 秒，等夜晚过去片刻。';}
 }
 leave(){if(!this.canLeave)return false;this.phase='room';this.returned=true;this.x=775;this.hidden=null;this.waves=[];this.message='游戏暂停了，门外的争吵没有。可以走向房门，也可以再躲一会儿。';this.commit();return true;}
 choose(response){if(this.phase!=='response'||!this.revisit||!['hide','silent','fear'].includes(response))return false;this.finish(response);return true;}
 finish(response){this.response=response;this.phase='ending';this.line=0;this.commit();}
 advance(){if(this.phase!=='ending')return;this.line++;if(this.line>=RESPONSES[this.response].lines.length)this.phase='done';this.commit();}
 step(dt,dx=0,dy=0){
  if(!['room','arcade'].includes(this.phase))return;dt=clamp(dt,0,.05);this.exposure=Math.max(0,this.exposure-dt);this.invulnerable=Math.max(0,this.invulnerable-dt);
  if(this.phase==='room'){
   this.roomTime+=dt;if(this.hidden)this.hiddenTime+=dt;else this.x=clamp(this.x+dx*235*dt,75,1160);
   this.waveClock+=dt;if(this.waveClock>=2.6){this.waveClock=0;this.waves.push({x:100,hit:false,id:this.serial++});}
   for(const wave of this.waves){wave.x+=235*dt;if(!wave.hit&&!this.hidden&&Math.abs(wave.x-this.x)<25){wave.hit=true;this.exposure=.65;if(!this.returned)this.x=Math.min(1160,this.x+35);}}
   this.waves=this.waves.filter(w=>w.x<1230);
  }else{
   this.gameTime+=dt;const length=Math.hypot(dx,dy)||1;this.x=clamp(this.x+dx/length*285*dt,110,1170);this.y=clamp(this.y+dy/length*285*dt,145,575);
   this.spawnClock+=dt;if(this.spawnClock>.72){this.spawnClock=0;const n=this.serial++;this.bullets.push({x:140+(n*193)%960,y:108,vx:Math.sin(n*2.4)*45,vy:82+(n%4)*13,text:['为什么','都是你','别吵了'][n%3]});}
   for(const b of this.bullets){b.x+=b.vx*dt;b.y+=b.vy*dt;if(!this.invulnerable&&Math.abs(b.x-this.x)<58&&Math.abs(b.y-this.y)<27){this.exposure=.65;this.invulnerable=1.2;}}
   this.bullets=this.bullets.filter(b=>b.y<630);if(this.gameTime>=48)this.finish('sleep');
  }
  this.saveClock+=dt;if(this.saveClock>=2){this.saveClock=0;this.commit();}
 }
}
