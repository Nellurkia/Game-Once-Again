import {CONFIG,validateLevel} from './config.js';
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const copy=value=>JSON.parse(JSON.stringify(value));
export class MemoryPuzzle {
 constructor({playthrough=1,save=null,onProgress=()=>false,config=CONFIG}={}){
  this.config=config;this.variant=config.variants[playthrough===2?'complete':'first'];this.onProgress=onProgress;
  const errors=validateLevel(config);if(errors.length)throw new Error(errors.join('; '));
  this.rawSave=save;this.error=save===null?null:this.validateSave(save);
  this.status=this.error?'recovery':'playing';this.saveStatus='idle';this.message='A / D 移动，Space 跳跃；靠近闪光碎片时按 E。';this.messageTime=7;
  this.pieceStates=Object.fromEntries(this.variant.availablePieceIds.map(id=>[id,'uncollected']));
  this.checkpointId=config.checkpoints[0].id;this.keyStates={exitKey:false,doorOpened:false};this.storyFlags={};this.tutorialFlags={};this.completed=false;
  this.player={...config.spawn,w:24,h:44,vx:0,vy:0,grounded:true};this.cameraX=0;this.coyote=0;this.buffer=0;this.returnTimer=0;this.idle=0;
  if(save!==null&&!this.error)this.restore(save);else this.resetPosition();
 }
 validateSave(s){
  if(!s||typeof s!=='object'||s.schemaVersion!==1||s.contentVersion!==this.config.contentVersion||s.levelId!==this.config.id||s.variantId!==this.variant.id)return '存档格式或版本与当前关卡不匹配。原存档已保留。';
  const validStates=['uncollected','inventory','placed'];
  if(!s.pieceStates||this.variant.availablePieceIds.some(id=>!validStates.includes(s.pieceStates[id]))||Object.keys(s.pieceStates).some(id=>!this.variant.availablePieceIds.includes(id)))return '碎片记录不完整。原存档已保留。';
  if(!this.config.checkpoints.some(c=>c.id===s.checkpointId)||!s.keyStates||typeof s.keyStates.exitKey!=='boolean'||typeof s.keyStates.doorOpened!=='boolean'||typeof s.completed!=='boolean')return '安全点或钥匙记录无效。原存档已保留。';
  for(const flags of [s.storyFlags,s.tutorialFlags])if(!flags||typeof flags!=='object'||Array.isArray(flags)||Object.values(flags).some(v=>typeof v!=='boolean'))return '引导记录无效。原存档已保留。';
  if(s.completed&&(!s.keyStates.exitKey||!s.keyStates.doorOpened||this.variant.completionPieceIds.some(id=>s.pieceStates[id]!=='placed')))return '通关记录与拼图状态不一致。原存档已保留。';
  for(const p of this.config.pieces)if(s.pieceStates[p.id]==='placed'&&p.requires.some(id=>s.pieceStates[id]!=='placed'))return '道路恢复顺序无效。原存档已保留。';
  return null;
 }
 restore(snapshot){
  const s=copy(snapshot);this.pieceStates=s.pieceStates;this.checkpointId=s.checkpointId;this.keyStates=s.keyStates;this.storyFlags=s.storyFlags;this.tutorialFlags=s.tutorialFlags;this.completed=s.completed;this.status=s.completed?'completed':'playing';this.error=null;this.resetPosition();
 }
 importSave(snapshot){const error=this.validateSave(snapshot);if(error){this.say(error);return false;}this.restore(snapshot);this.commit();this.say('已恢复存档，并回到安全位置。');return true;}
 snapshot(){return {schemaVersion:1,contentVersion:this.config.contentVersion,levelId:this.config.id,variantId:this.variant.id,checkpointId:this.checkpointId,pieceStates:{...this.pieceStates},keyStates:{...this.keyStates},storyFlags:{...this.storyFlags},tutorialFlags:{...this.tutorialFlags},completed:this.completed};}
 commit(){if(this.status==='recovery')return false;let saved=false;try{saved=this.onProgress(this.snapshot())===true;}catch{}this.saveStatus=saved?'saved':'memory';this.idle=0;return saved;}
 say(message,seconds=3){this.message=message;this.messageTime=seconds;}
 tutorial(flag){if(!this.tutorialFlags[flag]){this.tutorialFlags[flag]=true;this.commit();}}
 pieces(){return this.config.pieces.filter(p=>this.variant.availablePieceIds.includes(p.id));}
 inventory(){return this.pieces().filter(p=>this.pieceStates[p.id]==='inventory');}
 terrain(){return [...this.config.terrain,...this.pieces().filter(p=>this.pieceStates[p.id]==='placed').flatMap(p=>p.colliders)];}
 resetPosition(){const cp=this.config.checkpoints.find(c=>c.id===this.checkpointId)||this.config.checkpoints[0];Object.assign(this.player,{x:cp.x,y:cp.y,vx:0,vy:0,grounded:true});this.cameraX=clamp(cp.x-this.config.ui.world.width*.4,0,this.config.world.width-this.config.ui.world.width);this.coyote=0;this.buffer=0;}
 returnToSafety(){if(this.status!=='playing')return;this.status='returning';this.returnTimer=this.config.physics.returnDelay;this.player.vx=0;this.player.vy=0;}
 requestJump(){if(this.status==='playing')this.buffer=this.config.physics.jumpBuffer;}
 step(dt,input=0){
  if(this.status==='returning'){this.returnTimer-=dt;if(this.returnTimer<=0){this.resetPosition();this.status='playing';this.say('已回到安全位置，已收集的碎片仍在。');}return;}
  if(this.status!=='playing')return;
  dt=Math.min(dt,1/30);const p=this.player,physics=this.config.physics,terrain=this.terrain(),oldFeet=p.y;
  this.idle+=dt;this.messageTime=Math.max(0,this.messageTime-dt);
  this.coyote=p.grounded?physics.coyoteTime:Math.max(0,this.coyote-dt);this.buffer=Math.max(0,this.buffer-dt);
  p.vx=clamp(input,-1,1)*physics.moveSpeed;
  if(input)this.tutorial('moved');
  if(this.buffer>0&&this.coyote>0){p.vy=physics.jumpVelocity;p.grounded=false;this.coyote=0;this.buffer=0;this.tutorial('jumped');}
  const previousX=p.x;p.x=clamp(p.x+p.vx*dt,p.w/2,this.config.world.width-p.w/2);
  for(const t of terrain)if(!t.oneWay&&p.y>t.y+.1&&p.y-p.h<t.y+t.h&&p.x+p.w/2>t.x&&p.x-p.w/2<t.x+t.w){p.x=previousX;p.vx=0;break;}
  p.vy=Math.min(physics.maxFallSpeed,p.vy+physics.gravity*dt);p.y+=p.vy*dt;p.grounded=false;
  if(p.vy>=0){for(const t of terrain)if(oldFeet<=t.y+.5&&p.y>=t.y&&p.x+p.w/2>t.x&&p.x-p.w/2<t.x+t.w){p.y=t.y;p.vy=0;p.grounded=true;break;}}
  if(p.y-p.h>this.config.world.fallY){this.returnToSafety();return;}
  if(p.grounded){const current=this.config.checkpoints.findIndex(c=>c.id===this.checkpointId);for(let i=current+1;i<this.config.checkpoints.length;i++){const cp=this.config.checkpoints[i];if(Math.abs(cp.x-p.x)<48&&Math.abs(cp.y-p.y)<2){this.checkpointId=cp.id;this.commit();this.say('已到达新的安全位置。');}}}
  const target=clamp(p.x-this.config.ui.world.width*.4,0,this.config.world.width-this.config.ui.world.width);this.cameraX+=(target-this.cameraX)*Math.min(1,dt*8);
 }
 nearestInteraction(){
  const p=this.player,center={x:p.x,y:p.y-p.h/2};
  const items=this.pieces().filter(piece=>this.pieceStates[piece.id]==='uncollected').map(piece=>({kind:'piece',id:piece.id,...piece.pickup}));
  if(!this.keyStates.exitKey)items.push({kind:'key',...this.config.exitKey});
  items.push({kind:'exit',x:this.config.exit.x,y:this.config.exit.y-25});
  return items.map(item=>({...item,distance:Math.hypot(item.x-center.x,item.y-center.y)})).filter(item=>item.distance<=this.config.physics.interactionRadius&&!this.terrain().some(t=>!t.oneWay&&((center.y>t.y+2&&item.y<t.y-2)||(item.y>t.y+2&&center.y<t.y-2))&&Math.min(center.x,item.x)<t.x+t.w&&Math.max(center.x,item.x)>t.x)).sort((a,b)=>a.distance-b.distance)[0]||null;
 }
 interact(){
  if(this.status!=='playing')return false;const item=this.nearestInteraction();if(!item)return false;
  if(item.kind==='piece'){this.pieceStates[item.id]='inventory';this.tutorialFlags.picked=true;this.commit();this.say('碎片在右侧，按住并拖到场景中的对应缺口。',5);return true;}
  if(item.kind==='key'){this.keyStates.exitKey=true;this.commit();this.say('拿到出口钥匙了。拼好本周目需要的碎片，再走到门边按 E。',5);return true;}
  const reason=this.exitReason();if(reason){this.say(reason,5);return false;}
  this.keyStates.doorOpened=true;this.completed=true;this.status='completed';this.commit();return true;
 }
 exitReason(){
  if(!this.keyStates.exitKey)return '这扇门需要一把钥匙。钥匙就在前面的安全平台上。';
  const missing=this.variant.completionPieceIds.filter(id=>this.pieceStates[id]!=='placed');
  if(missing.length){const ids=[...new Set(missing.map(id=>this.config.pieces.find(p=>p.id===id).segmentId))];return '这段记忆还没拼完整：'+ids.map(id=>this.config.segments.find(s=>s.id===id).name).join('、')+'。';}
  return null;
 }
 canPlace(id){const piece=this.config.pieces.find(p=>p.id===id);return this.status==='playing'&&this.pieceStates[id]==='inventory'&&piece&&piece.requires.every(required=>this.pieceStates[required]==='placed');}
 matches(id,position){const piece=this.config.pieces.find(p=>p.id===id);return !!(this.canPlace(id)&&Math.hypot(piece.target.x-position.x,piece.target.y-position.y)<=this.config.drag.snapRadius);}
 place(id,position){
  if(!this.matches(id,position)){this.say(this.pieceStates[id]==='inventory'&&!this.canPlace(id)?'先拼好这块左侧的道路，再来接上它。':'还没对上，试试对应的缺口。');return false;}
  const piece=this.config.pieces.find(p=>p.id===id),p=this.player;this.pieceStates[id]='placed';this.tutorialFlags.placed=true;
  if(piece.colliders.some(t=>p.x+p.w/2>t.x&&p.x-p.w/2<t.x+t.w&&p.y>t.y&&p.y-p.h<t.y+t.h))this.resetPosition();
  const segment=this.config.segments.find(s=>s.id===piece.segmentId);const available=segment.pieceIds.filter(id=>this.variant.availablePieceIds.includes(id));
  if(available.every(id=>this.pieceStates[id]==='placed'))this.storyFlags[segment.revealEventId]=true;
  this.commit();this.say(piece.colliders.length?'道路恢复了，继续向前。':'画面补好了。让这段记忆留在这里。');return true;
 }
 hint(){
  if(this.messageTime>0)return this.message;
  const nearest=this.nearestInteraction();if(nearest)return nearest.kind==='piece'?'按 E 拾取记忆碎片。':nearest.kind==='key'?'按 E 拿起出口钥匙。':'按 E 查看并打开出口。';
  if(this.inventory().length)return '按住右侧的拼图切片，拖到场景中相同编号的轮廓。';
  if(!this.tutorialFlags.jumped)return 'Space 跳跃，上方的小平台也有记忆碎片。';
  if(this.idle>20)return '需要一点提示吗？按 H 查看本段目标和操作。';
  return this.keyStates.exitKey?'带着钥匙走向出口；未拼合的记忆仍可以回头寻找。':'沿途探索，拼好道路，再去寻找出口钥匙。';
 }
}
