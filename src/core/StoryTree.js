const clone=value=>JSON.parse(JSON.stringify(value));
export const emptyStoryTrees=()=>({'1':{nodes:{},lastNodeId:null},'2':{nodes:{},lastNodeId:null}});
export function storyNodeId(state){
 const progress=state.sceneProgress?.scene===state.scene?state.sceneProgress:null;
 if(progress?.kind==='dialogue')return `${state.scene}:dialogue:${progress.storyKey}:${progress.index}`;
 if(progress?.kind==='game')return `${state.scene}:game`;
 if(['interlude','ending_select'].includes(state.scene))return state.scene;
 if(state.scene==='credits'&&['NE','TE'].includes(state.flags.ending))return `credits:${state.flags.ending}`;
 return null;
}
export function storySnapshot(state){
 return clone({playthrough:state.playthrough,chapterIndex:state.chapterIndex,scene:state.scene,sceneProgress:state.sceneProgress,flags:state.flags,minigameSaves:state.minigameSaves});
}
export function normalizeStoryTrees(value){
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const result=emptyStoryTrees();
 for(const playthrough of [1,2]){
  const tree=value[playthrough];
  if(!tree||!tree.nodes||typeof tree.nodes!=='object'||Array.isArray(tree.nodes))return null;
  for(const [id,snapshot] of Object.entries(tree.nodes)){
   if(!snapshot||snapshot.playthrough!==playthrough||typeof snapshot.scene!=='string'||!Number.isInteger(snapshot.chapterIndex)||snapshot.chapterIndex<0||snapshot.chapterIndex>3)continue;
   result[playthrough].nodes[id]=storySnapshot({...snapshot,sceneProgress:snapshot.sceneProgress||null,flags:snapshot.flags&&typeof snapshot.flags==='object'?snapshot.flags:{},minigameSaves:snapshot.minigameSaves&&typeof snapshot.minigameSaves==='object'?snapshot.minigameSaves:{}});
  }
  result[playthrough].lastNodeId=result[playthrough].nodes[tree.lastNodeId]?tree.lastNodeId:null;
 }
 return result;
}
export function buildStoryTree(scenes,story,playthrough){
 const groups=[],nodes=[];
 let previous=null;
 function group(id,title,subtitle){const result={id,title,subtitle,nodes:[],branches:[]};groups.push(result);return result;}
 function add(target,node,parents=previous?[previous]:[]){const result={...node,parents,playthrough};target.nodes.push(result);nodes.push(result);previous=result.id;return result;}
 function dialogue(target,scene,key,title){
  (story[key]||[]).forEach((line,index)=>add(target,{id:`${scene}:dialogue:${key}:${index}`,scene,sceneProgress:{scene,kind:'dialogue',storyKey:key,index},title:`${title} · ${index+1}`,description:line.text.replace(/\{TBD\}\s*/g,''),kind:'dialogue'}));
 }
 if(playthrough===1)dialogue(group('prologue','序章','暮色中的房间'),'prologue','prologue','旧掌机');
 for(const chapter of scenes.filter(scene=>scene.minigame)){
  const config=chapter[playthrough===1?'week1':'week2'];
  const target=group(chapter.id,chapter.title,chapter.subtitle);
  dialogue(target,chapter.id,config.dialogueKey,'入场对白');
  add(target,{id:`${chapter.id}:game`,scene:chapter.id,sceneProgress:{scene:chapter.id,kind:'game'},title:chapter.subtitle,description:config.label,kind:'game'});
  dialogue(target,chapter.id,'outro','章节尾声');
 }
 if(playthrough===1){
  add(group('interlude','幕间','再一次的机会'),{id:'interlude',scene:'interlude',sceneProgress:null,title:'再来一次',description:'走完四段人生，开启另一棵剧情树。',kind:'checkpoint'});
 }else{
  const target=group('endings','终幕','这一次，你想留下些什么？');
  add(target,{id:'ending_select',scene:'ending_select',sceneProgress:null,title:'最后的存档',description:'留下、和解，或再走一次。',kind:'checkpoint'});
  const fork=previous;
  for(const [ending,title] of [['NE','珍惜此刻的人生'],['TE','接纳最初的自己'],['BE','未完的循环']]){
   const branch={id:ending,title,nodes:[]};target.branches.push(branch);previous=fork;
   if(ending==='BE')add(branch,{id:'ending:BE',scene:'ch1',sceneProgress:null,ending,title:'再试一次，也许……',description:'重新走进非一周目的回忆。',kind:'ending'});
   else{
    dialogue(branch,'ending',ending,title);
    branch.nodes.forEach(node=>node.ending=ending);
    add(branch,{id:`credits:${ending}`,scene:'credits',sceneProgress:null,ending,title:'旅程的落款',description:'这份人生，已经留下了答案。',kind:'checkpoint'});
   }
  }
 }
 return {groups,nodes};
}
// Older saves only have the current position. Infer compulsory earlier stops,
// while keeping unreached chapters and unchosen endings locked.
export function migrateStoryTrees(state,scenes,story){
 if(state.storyTrees)return false;
 state.storyTrees=emptyStoryTrees();
 for(const playthrough of [1,2]){
  if(playthrough>state.playthrough)continue;
  const {nodes}=buildStoryTree(scenes,story,playthrough);
  const main=nodes.filter(node=>!node.ending);
  let reached=-1;
  if(playthrough<state.playthrough)reached=main.length-1;
  else{
   reached=main.findIndex(node=>node.id===storyNodeId(state));
   if(reached<0&&['ending','credits'].includes(state.scene))reached=main.length-1;
   if(reached<0)reached=main.findIndex(node=>node.scene===state.scene);
  }
  for(const node of main.slice(0,reached+1)){
   state.storyTrees[playthrough].nodes[node.id]=snapshotAt(node,playthrough);
  }
  if(playthrough===2)for(const node of nodes.filter(node=>node.ending&&state.unlockedEndings.includes(node.ending))){
   // An ending being recorded does not mean its later lines or credits were seen.
   if(node.scene==='credits'&&!(state.scene==='credits'&&state.flags.ending===node.ending))continue;
   if(node.scene==='ending'){
    const currentEnding=state.flags.ending===node.ending;
    const lastLine=currentEnding&&state.scene==='credits'?Infinity:currentEnding&&state.scene==='ending'?state.sceneProgress?.index||0:0;
    if(node.sceneProgress.index>lastLine)continue;
   }
   state.storyTrees[playthrough].nodes[node.id]=snapshotAt(node,playthrough);
  }
 }
 const currentNodes=buildStoryTree(scenes,story,state.playthrough).nodes;
 const current=currentNodes.find(node=>node.id===storyNodeId(state))||currentNodes.find(node=>node.scene===state.scene);
 if(current){
  state.sceneProgress=clone(current.sceneProgress);
  state.storyTrees[state.playthrough].nodes[current.id]=storySnapshot(state);
  state.storyTrees[state.playthrough].lastNodeId=current.id;
 }else{const tree=state.storyTrees[state.playthrough];tree.lastNodeId=Object.keys(tree.nodes).at(-1)||null;}
 return true;
}
function snapshotAt(node,playthrough){
 return {playthrough,chapterIndex:/^ch[1-4]$/.test(node.scene)?Number(node.scene.slice(2))-1:node.scene==='prologue'?0:3,scene:node.scene,sceneProgress:clone(node.sceneProgress),flags:node.ending?{ending:node.ending}:{},minigameSaves:{}};
}
