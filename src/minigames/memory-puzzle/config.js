// Prototype values from requirement v0.1. Narrative/map contents remain replaceable examples.
export const CONFIG={
 id:'memory-lane',contentVersion:1,
 physics:{moveSpeed:240,gravity:1600,jumpVelocity:-620,maxFallSpeed:900,coyoteTime:.1,jumpBuffer:.12,interactionRadius:56,returnDelay:.25},
 drag:{snapRadius:32,opacity:.85,snapAnimationMs:180,returnAnimationMs:180},
 ui:{width:1280,height:720,world:{x:0,y:56,width:1024,height:608},sidebar:{x:1024,y:56,width:256,height:608}},
 world:{width:3500,height:608,fallY:704},
 spawn:{x:90,y:500},exit:{id:'exit-door',x:3400,y:500,requiredKeyId:'exitKey',consume:false},
 exitKey:{id:'exitKey',x:3130,y:470},carryKey:{enabled:false,id:'carryKey'},
 segments:[],pieces:[],terrain:[],checkpoints:[]
};
const themes=[{name:'片段一 · 旧窗',color:'#c9a36b',motif:'window'},{name:'片段二 · 归路',color:'#9baf91',motif:'tree'},{name:'片段三 · 暖灯',color:'#c39888',motif:'lamp'}];
for(let n=0;n<3;n++){
 const origin=n*1100,id=`S${n+1}`,checkpointId=`safe-${n+1}`;
 const segment={id,origin,...themes[n],pieceIds:[],checkpointId,revealEventId:`reveal-${id}`};
 CONFIG.segments.push(segment);
 CONFIG.checkpoints.push({id:checkpointId,x:origin+70,y:500,safeArea:{x:origin+10,y:450,w:130,h:50}});
 CONFIG.terrain.push({x:origin,y:500,w:470,h:108},{x:origin+800,y:500,w:300,h:108},{x:origin+220,y:420,w:100,h:16,oneWay:true},{x:origin+340,y:340,w:105,h:16,oneWay:true});
 const pickups=[{x:origin+130,y:473},{x:origin+270,y:394},{x:origin+392,y:314},{x:origin+427,y:473}];
 for(let i=0;i<4;i++){
  const pieceId=`${id}-P${i+1}`;segment.pieceIds.push(pieceId);
  CONFIG.pieces.push({id:pieceId,segmentId:id,index:i,name:['一段路','另一段路','前方的路','未完的画面'][i],color:themes[n].color,motif:themes[n].motif,pickup:pickups[i],targetId:`target-${pieceId}`,target:i<3?{x:origin+470+i*110,y:360,w:110,h:220}:{x:origin+860,y:250,w:150,h:210},requires:i>0&&i<3?[`${id}-P${i}`]:[],colliders:i<3?[{x:origin+470+i*110,y:500,w:110,h:108}]:[]});
 }
}
CONFIG.terrain.push({x:3300,y:500,w:200,h:108});
CONFIG.checkpoints.push({id:'safe-exit',x:3240,y:500,safeArea:{x:3180,y:450,w:120,h:50}});
const route=CONFIG.pieces.filter(p=>p.index<3).map(p=>p.id);
CONFIG.variants={
 first:{id:'first',availablePieceIds:[...route],requiredRoutePieceIds:[...route],completionPieceIds:[...route]},
 complete:{id:'complete',availablePieceIds:CONFIG.pieces.map(p=>p.id),requiredRoutePieceIds:[...route],completionPieceIds:CONFIG.pieces.map(p=>p.id)}
};
export function validateLevel(config=CONFIG){
 const errors=[],ids=new Set(),targets=new Set();
 for(const p of config.pieces){
  if(ids.has(p.id)||targets.has(p.targetId))errors.push('Duplicate piece or target ID');ids.add(p.id);targets.add(p.targetId);
  if(!config.segments.some(s=>s.id===p.segmentId))errors.push('Unknown segment');
  if(p.target.x<0||p.target.x+p.target.w>config.world.width||p.target.y<0||p.target.y+p.target.h>config.world.height)errors.push('Target outside world');
  if(!config.terrain.some(t=>p.pickup.x>=t.x&&p.pickup.x<=t.x+t.w&&Math.abs(t.y-p.pickup.y-26)<=2))errors.push('Pickup must have independently accessible base terrain');
 }
 for(const s of config.segments)if(s.pieceIds.length<3||s.pieceIds.length>6||s.pieceIds.some(id=>!ids.has(id))||!config.checkpoints.some(c=>c.id===s.checkpointId))errors.push('Invalid segment');
 for(const v of Object.values(config.variants))if([...v.availablePieceIds,...v.completionPieceIds,...v.requiredRoutePieceIds].some(id=>!ids.has(id))||v.completionPieceIds.some(id=>!v.availablePieceIds.includes(id)))errors.push('Invalid variant');
 if(config.variants.complete.completionPieceIds.length!==config.pieces.length)errors.push('Complete variant must restore all pieces');
 for(const p of config.pieces){const seen=new Set([p.id]);const visit=id=>{if(seen.has(id)){errors.push('Cyclic piece dependency');return;}seen.add(id);const dep=config.pieces.find(p=>p.id===id);if(!dep)errors.push('Unknown dependency');else dep.requires.forEach(visit);seen.delete(id);};p.requires.forEach(visit);}
 return errors;
}
