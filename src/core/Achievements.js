export const ACHIEVEMENTS=[
 {id:'hero-forward',name:'勇往直前',game:'数字勇者',description:'走到本局结尾，没有碰到任何会让你停下的「以后再说」障碍。',icon:'arrow'},
 {id:'station-missed-again',name:'还是......做不到吗',game:'最后一班车',description:'在第二周目再次错过最后一班车。',icon:'arrow'},
 {id:'night-fear',name:'妈妈我怕黑',game:'夜庭',description:'在夜庭里，经历一次微光熄灭。',icon:'moon'},
 {id:'night-flawless',name:'因为太怕痛所以把防御力点满了',game:'夜庭',description:'从第一波到击败 Boss，整局没有受到过伤害。',icon:'shield'},
 {id:'memory-fall',name:'into the rabbit hole',game:'拾光',description:'在回忆的道路上，掉入一次深处。',icon:'hole'},
 {id:'memory-rebel',name:'离经叛道',game:'拾光',description:'尝试一次不符合站牌提示的点灯顺序。',icon:'lights'},
];
const key='zlyc_achievements_v1',ids=new Set(ACHIEVEMENTS.map(item=>item.id));
// Achievements belong to the player, independently of story checkpoints and new runs.
export class AchievementStore{
 constructor(storage=globalThis.localStorage){
  this.storage=storage;this.unlocked={};this.listeners=new Set();
  try{const saved=JSON.parse(storage?.getItem(key)||'null');if(saved?.version===1)for(const [id,time] of Object.entries(saved.unlocked||{}))if(ids.has(id)&&Number.isFinite(time)&&time>0)this.unlocked[id]=time;}catch{}
 }
 isUnlocked(id){return Object.hasOwn(this.unlocked,id);}
 get count(){return Object.keys(this.unlocked).length;}
 onUnlock(listener){this.listeners.add(listener);return ()=>this.listeners.delete(listener);}
 unlock(id){
  if(!ids.has(id)||this.isUnlocked(id))return false;
  this.unlocked[id]=Date.now();
  try{this.storage?.setItem(key,JSON.stringify({version:1,unlocked:this.unlocked}));}catch{}
  const achievement=ACHIEVEMENTS.find(item=>item.id===id);for(const listener of this.listeners)listener(achievement);return true;
 }
}
