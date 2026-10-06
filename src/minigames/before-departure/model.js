import {CLOCK,AREAS,ROUTES,ITEMS,OBJECTS,REPLIES,formatTime} from './data.js';
const copy=value=>JSON.parse(JSON.stringify(value));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const SAVE_KIND='before-departure-v1';

export class BeforeDeparture{
 constructor({playthrough=1,save=null,onProgress=()=>false}={}){
  this.revisit=playthrough!==1;this.onProgress=onProgress;this.saved=true;this.saveClock=0;
  this.s={minutes:CLOCK.start,hesitation:28,peak:28,area:'room',x:620,y:425,phase:'explore',hasKey:false,hasPass:false,inventory:[],replied:false,delays:0,aState:'WAITING_1',leftAt:null,route:null,visitedStore:false,courage:false,examined:{},memory:[],message:'手机亮了。走近桌面，按 E 看看 A 的消息。',dialog:null,task:null,outcome:null,resultLine:0,notifications:[],log:[]};
  this.checkpoints={};
  if(this.valid(save)){this.s=copy(save.state);this.checkpoints=copy(save.checkpoints||{});}
  this.updateA();if(!this.checkpoints.room)this.checkpoint('room');
 }
 valid(save){
  const s=save?.state;
  return save?.kind===SAVE_KIND&&save.revisit===this.revisit&&s&&Number.isFinite(s.minutes)&&s.minutes>=CLOCK.start&&s.minutes<=CLOCK.departure+30&&Number.isFinite(s.hesitation)&&Number.isFinite(s.x)&&Number.isFinite(s.y)&&AREAS[s.area]&&['explore','result'].includes(s.phase)&&Array.isArray(s.inventory)&&s.inventory.length<=2&&s.inventory.every(id=>ITEMS[id])&&Array.isArray(s.log)&&s.examined&&Array.isArray(s.memory)&&(!s.task||Number.isFinite(s.task.remaining)&&Number.isFinite(s.task.total));
 }
 snapshot(){return {kind:SAVE_KIND,version:1,revisit:this.revisit,state:copy(this.s),checkpoints:copy(this.checkpoints)};}
 commit(){try{this.saved=this.onProgress(this.snapshot())===true;}catch{this.saved=false;}}
 log(event,details={}){this.s.log.push({time:formatTime(this.s.minutes),event,...details});if(this.s.log.length>100)this.s.log.shift();}
 checkpoint(id){this.checkpoints[id]=copy({...this.s,dialog:null,task:null});this.log('checkpoint',{id});this.commit();}
 changeHesitation(delta){this.s.hesitation=clamp(this.s.hesitation+delta,0,100);this.s.peak=Math.max(this.s.peak,this.s.hesitation);}
 updateA(){
  if(this.s.outcome==='SUCCESS_AT_STATION'){this.s.aState='MET';return;}
  const before=this.s.aState;
  this.s.aState=this.s.minutes>=CLOCK.departure?'LEFT':this.s.minutes>=1110?'AT_STATION':this.s.delays>0?'UNSURE':this.s.replied?'CONFIDENT':'WAITING_1';
  if(before!==this.s.aState){this.log('A_state',{from:before,to:this.s.aState});if(this.s.aState==='AT_STATION')this.notice('A：我先去车站。');if(this.s.aState==='LEFT')this.notice('A：我今天走。你想来的话，我等你。车已经出发了。');}
 }
 notice(text){this.s.notifications.push(text);if(this.s.notifications.length>4)this.s.notifications.shift();this.s.message=text;}
 advanceTime(minutes){
  const before=this.s.minutes;this.s.minutes=Math.min(CLOCK.departure+1,this.s.minutes+Math.max(0,minutes));
  if(before<1125&&this.s.minutes>=1125)this.notice('A：我今天真的要走了。19:30 出发。');
  if(before<CLOCK.leaveHome&&this.s.minutes>=CLOCK.leaveHome)this.notice('19:00。离家的窗口开始收紧，站台还会等到 19:30。');
  this.updateA();
 }
 get nearest(){return OBJECTS.filter(object=>object.area===this.s.area).find(object=>Math.hypot(object.x-this.s.x,object.y-this.s.y)<88)||null;}
 get elapsed(){return this.s.minutes-CLOCK.start;}
 get late(){return this.s.leftAt!==null&&this.s.leftAt>CLOCK.leaveHome;}
 get messageText(){return this.s.minutes>=1125?'我今天走。你想来的话，我等你。':this.s.minutes>=1110?'我先去车站。你不用准备得那么完美。':'你到底来不来？今天我会走，19:30 的车。';}
 openDialog(type,text){this.s.dialog={type,text};this.commit();}
 cancel(){if(this.s.dialog){this.s.dialog=null;this.commit();return true;}return false;}
 reply(id){
  if(this.s.dialog?.type!=='message'||!REPLIES[id])return false;
  const choice=REPLIES[id];this.s.dialog=null;this.advanceTime(choice.cost);this.changeHesitation(choice.hesitation);
  if(id==='go'){this.s.replied=true;this.s.delays=0;this.notice(this.revisit?'A：你不用想太多。我在站台等你。':'A：好，我等你。');}
  else if(id==='wait'){this.s.delays++;this.s.replied=false;this.notice('A：没关系，你想清楚再说。');}
  else this.notice('消息留在了屏幕上。A 还在等你的回答。');
  this.updateA();this.log('reply',{choice:id,cost:choice.cost});this.commit();return true;
 }
 interact(id=this.nearest?.id){
  if(this.s.phase!=='explore'||this.s.dialog||this.s.task)return false;
  const object=OBJECTS.find(object=>object.id===id&&object.area===this.s.area);if(!object||Math.hypot(object.x-this.s.x,object.y-this.s.y)>=88)return false;
  if(object.type==='message'){this.openDialog('message',this.messageText);return true;}
  if(object.type==='door'){
   if(!this.s.hasKey||!this.s.hasPass){this.notice('钥匙和钱包里的交通凭证还没拿齐。它们是唯一必须带的东西。');return false;}
   if(!this.checkpoints.door)this.checkpoint('door');
   this.openDialog('door',this.revisit?'钥匙在手里，包也背上了。这一次，我知道等下去会发生什么。':'钥匙在手里，包也背上了。旧存档里，我还是想等一个更好的时候。');return true;
  }
  if(object.type==='preview'||object.type==='route'){this.openDialog(object.type,'楼梯更快，电梯更舒服。每条路线的时间都能提前看见。');return true;}
  if(object.type==='shop'){this.openDialog('shop','这里的东西会让路上舒服一点，但没有一件是出发的必要条件。');return true;}
  if(object.type==='portal'){this.enterArea(object.target);return true;}
  if(object.type==='meet'){this.meet();return true;}
  if(object.type==='detail'){
   if(!this.s.inventory.includes('charger')){this.notice('详细消息需要充电器。没有它也能去站台找 A。');return false;}
   this.advanceTime(object.cost);this.openDialog('note',this.s.inventory.includes('notebook')?'A：带上你写的那些东西吧。不用等全部完成，我也想看看。':'A：我在站台靠窗的位置。今天出发，你来了就一起走。');return true;
  }
  if((object.type==='key'&&this.s.hasKey)||(object.type==='wallet'&&this.s.hasPass)){this.notice('已经放进包里了，不用再确认一次。');return true;}
  if(object.type==='item'){
   if(this.s.inventory.includes(object.item)){this.notice('已经带上了。反复确认，只会多花一点时间。');return this.beginTask('repeat',3,{objectId:object.id});}
   if(this.s.inventory.length>=2){this.openDialog('inventory','两格可选物品已经装满。放下一件，才能带另一件；钥匙与钱包始终保留。');return false;}
  }
  if(object.type==='onward')return this.beginTravel('store-station',object.cost,'entrance');
  if(object.type==='return')return this.beginTravel('return',object.cost,'landing');
  return this.beginTask(object.type,object.cost,{objectId:object.id,item:object.item,text:object.text});
 }
 beginTask(type,cost,payload={}){
  if(this.s.phase!=='explore'||this.s.task)return false;
  this.s.dialog=null;this.s.task={type,total:cost,remaining:cost,payload};this.log('action_start',{action:type,cost});this.commit();return true;
 }
 finishTask(task){
  const p=task.payload;
  switch(task.type){
   case 'key':this.s.hasKey=true;this.notice('钥匙放进了包里。');break;
   case 'wallet':this.s.hasPass=true;this.notice('钱包和交通凭证都在。你已经能出门。');break;
   case 'item':this.s.inventory.push(p.item);this.s.examined[p.objectId]=(this.s.examined[p.objectId]||0)+1;this.notice(p.text||`带上了${ITEMS[p.item]}。`);if(p.item==='photo'&&!this.s.memory.includes('room_photo'))this.s.memory.push('room_photo');break;
   case 'inspect':this.s.examined[p.objectId]=(this.s.examined[p.objectId]||0)+1;this.changeHesitation(this.s.examined[p.objectId]>1?3:1);this.notice(p.text);break;
   case 'repeat':this.changeHesitation(3);break;
   case 'write':this.s.courage=true;this.notice('我写下：“我也害怕。但我想和你一起去看看。”');this.changeHesitation(-5);break;
   case 'wait':this.s.delays++;this.changeHesitation(12);this.notice('再想一会儿，又过去了五分钟。');break;
   case 'original':this.notice('在原始存档中，那句“再等等”，终于变成了“已经来不及”。');this.s.leftAt=null;this.enterArea('landing');break;
   case 'travel':this.enterArea(p.target);if(p.target==='store'){this.s.visitedStore=true;this.notice('到了街角小店。补给是可选的，仍可以直接走。');}break;
   case 'shopItem':this.s.inventory.push(p.item);this.notice(`带上了${ITEMS[p.item]}。小店补给用了十分钟。`);break;
  }
  this.log('action_done',{action:task.type});this.updateA();
 }
 leave(choice){
  if(this.s.dialog?.type!=='door')return false;
  this.s.dialog=null;
  if(choice==='wait')return this.beginTask('wait',5);
  if(choice!=='go')return false;
  if(!this.revisit){this.s.delays++;this.changeHesitation(12);this.openDialog('original','那时的我松开了门把。一次、又一次地说“再等等”。这份旧记忆无法改写，但你可以看清等待的代价。');return true;}
  this.s.leftAt=this.s.minutes;this.log('left_home',{onTime:!this.late});this.enterArea('landing');this.notice(this.late?'你终于开了门，但已经错过 19:00 的同行窗口。仍可以走向车站，或回门口重试。':'门开了。事情还没想全，但我已经走了出去。');this.commit();return true;
 }
 continueOriginal(){if(this.s.dialog?.type!=='original')return false;return this.beginTask('original',Math.max(1,CLOCK.departure+1-this.s.minutes));}
 routeCost(id){const route=ROUTES[id];return route?route.cost-(id==='elevator'&&this.s.inventory.includes('card')&&this.revisit?3:0):null;}
 routeETA(id){const route=ROUTES[id];return route?this.s.minutes+this.routeCost(id)+(route.onward||0):null;}
 chooseRoute(id){
  if(this.s.dialog?.type!=='route'||!ROUTES[id])return false;
  this.s.route=id;if(!this.s.memory.includes(`route_${id}`))this.s.memory.push(`route_${id}`);
  if(id==='elevator')this.changeHesitation(-4);
  return this.beginTravel(id,this.routeCost(id),ROUTES[id].target);
 }
 beginTravel(route,cost,target){this.s.area='street';this.s.x=180;this.s.y=390;if(!this.s.inventory.includes('coat'))this.changeHesitation(1);this.log('route',{route,target,cost});return this.beginTask('travel',cost,{route,target});}
 buy(item){
  if(this.s.dialog?.type!=='shop'||!['charger','card','coat'].includes(item)||this.s.inventory.includes(item))return false;
  if(this.s.inventory.length>=2){this.s.dialog={type:'inventory',text:'包已经满了。可以放下一件可选物品，也可以直接出发。'};this.commit();return false;}
  return this.beginTask('shopItem',10,{item});
 }
 drop(item){if(!this.s.inventory.includes(item))return false;this.s.inventory=this.s.inventory.filter(id=>id!==item);this.notice(`把${ITEMS[item]}放下了。留一点空位，也没关系。`);this.commit();return true;}
 enterArea(area){
  if(!AREAS[area])return;
  this.s.area=area;this.s.x=area==='hall'?450:180;this.s.y=470;this.s.dialog=null;
  if(area==='entrance'&&this.revisit&&!this.late&&this.s.minutes<CLOCK.departure&&!this.checkpoints.entrance)this.checkpoint('entrance');
  this.commit();
 }
 meet(){
  if(!this.revisit){this.finish('MISSED');return;}
  if(this.s.hasKey&&this.s.hasPass&&this.s.leftAt!==null&&this.s.leftAt<=CLOCK.leaveHome&&this.s.minutes<CLOCK.departure){this.finish('SUCCESS_AT_STATION');return;}
  this.finish('FAILED_LATE');
 }
 finish(outcome){if(this.s.phase==='result')return;this.s.phase='result';this.s.dialog=null;this.s.task=null;this.s.outcome=outcome;this.s.resultLine=0;this.updateA();this.log('result',{outcome,leftAt:this.s.leftAt,route:this.s.route,peak:Math.ceil(this.s.peak)});this.commit();}
 get results(){
  if(this.s.outcome==='SUCCESS_AT_STATION')return ['A：“你来了。”',this.s.inventory.includes('notebook')?'“本子也带来了？路上，给我看看吧。”':'我点点头。原来，不需要把一切想明白才出发。','同样的站台，同样的门。这一次，我们真的走向了另一个人生入口。'];
  if(this.s.outcome==='MISSED')return ['站台上，A 曾经坐过的位置已经空了。','“我今天走。你想来的话，我等你。”','我一直想等一个更好的时候。后来，只剩下已经发出的那条消息。','原始存档 · 事件已记录'];
  return [this.late?'我终于走出了门，但那次同行要求在 19:00 前离开住所。':'我走到了这里，19:30 的车已经开走了。','准备、停留和路线的时间，都在钟上留下了痕迹。','可以从最近的有效检查点重试，也可以先把这一次的结果留下。'];
 }
 advanceResult(){if(this.s.phase!=='result')return false;if(this.s.resultLine<this.results.length-1){this.s.resultLine++;this.commit();return false;}return true;}
 retry(id){
  if(!this.revisit||this.s.phase!=='result'||this.s.outcome==='SUCCESS_AT_STATION')return false;
  const target=id||(this.checkpoints.entrance&&!this.late?'entrance':this.checkpoints.door?'door':'room');
  const checkpoint=this.checkpoints[target];if(!checkpoint||!this.valid({kind:SAVE_KIND,revisit:this.revisit,state:checkpoint}))return false;
  const memory=[...new Set([...checkpoint.memory,...this.s.memory])];
  this.s=copy(checkpoint);this.s.memory=memory;this.s.phase='explore';this.s.outcome=null;this.s.dialog=null;this.s.task=null;
  if(target==='room')this.checkpoints={room:copy(this.s)};
  else if(target==='door')delete this.checkpoints.entrance;
  this.updateA();this.notice('回到那个仍能行动的时刻。这一次，可以少等一会儿。');this.log('retry',{checkpoint:target});this.commit();return true;
 }
 complete(){return {success:this.s.outcome==='SUCCESS_AT_STATION',score:0,flags:{departureComplete:true,youthOutcome:this.s.outcome,youthLeftHome:this.revisit&&this.s.leftAt!==null,youthRepliedToA:this.s.replied,youthCarriedNotebook:this.s.inventory.includes('notebook'),youthVisitedStore:this.s.visitedStore,youthHesitationPeak:Math.ceil(this.s.peak),youthRoute:this.s.route}};}
 step(dt,dx=0,dy=0){
  if(this.s.phase!=='explore'||this.s.dialog)return;
  dt=clamp(dt,0,.1);if(!dt)return;
  if(this.s.task){
   const task=this.s.task,amount=Math.min(task.remaining,dt*CLOCK.actionMinutesPerSecond);task.remaining=Math.max(0,task.remaining-amount);this.advanceTime(amount);
   if(task.type==='travel'){this.s.x=180+900*(1-task.remaining/task.total);if(this.revisit)this.changeHesitation(-amount);}
   if(task.remaining<=1e-6){this.s.task=null;this.finishTask(task);this.commit();}
  }else{
   const length=Math.hypot(dx,dy)||1,speed=215*(1-this.s.hesitation/100*.08);
   this.s.x=clamp(this.s.x+dx/length*speed*dt,120,1160);this.s.y=clamp(this.s.y+dy/length*speed*dt,190,555);
   const minutes=dt*CLOCK.minutesPerSecond;this.advanceTime(minutes);
   if(this.s.leftAt!==null&&Math.hypot(dx,dy)>0)this.changeHesitation(-minutes);
   if(this.s.area==='hall'&&this.nearest?.id==='door'&&this.s.hasKey&&this.s.hasPass&&!this.checkpoints.door)this.checkpoint('door');
  }
  if(this.s.minutes>=CLOCK.departure&&this.s.phase==='explore')this.finish(this.revisit?'FAILED_LATE':'MISSED');
  this.saveClock+=dt;if(this.saveClock>=2){this.saveClock=0;this.commit();}
 }
}
