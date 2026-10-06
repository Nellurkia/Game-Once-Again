export const CHAPTER_THREE_VERSION='before-departure-v1';
// A replacement game must never interpret the former childhood checkpoint.
export function migrateChapterThree(state,scenes){
 if(state.chapterContentVersions?.ch3===CHAPTER_THREE_VERSION)return false;
 const chapter=scenes.find(scene=>scene.id==='ch3');if(chapter?.minigame!=='beforeDeparture')return false;
 const clean=snapshot=>{
  for(const key of Object.keys(snapshot.minigameSaves||{}))if(key.startsWith('quietNight:'))delete snapshot.minigameSaves[key];
  if(snapshot.flags?.quietNightComplete)delete snapshot.flags.saidFear;
  if(snapshot.flags){delete snapshot.flags.quietNightComplete;delete snapshot.flags.quietNightResponse;}
 };
 for(const playthrough of [1,2]){
  const tree=state.storyTrees?.[playthrough];if(!tree)continue;
  const ids=Object.keys(tree.nodes).filter(id=>id.startsWith('ch3:'));
  const prior=ids.length?JSON.parse(JSON.stringify(tree.nodes[ids[0]])):null;
  for(const id of ids)delete tree.nodes[id];
  if(prior){
   const key=chapter[playthrough===1?'week1':'week2'].dialogueKey,id=`ch3:dialogue:${key}:0`;
   prior.sceneProgress={scene:'ch3',kind:'dialogue',storyKey:key,index:0};clean(prior);tree.nodes[id]=prior;
   if(ids.includes(tree.lastNodeId))tree.lastNodeId=id;
  }
  for(const snapshot of Object.values(tree.nodes))clean(snapshot);
 }
 clean(state);
 if(state.scene==='ch3'){
  const key=chapter[state.playthrough===1?'week1':'week2'].dialogueKey;
  state.sceneProgress={scene:'ch3',kind:'dialogue',storyKey:key,index:0};state.chapterIndex=2;
  const tree=state.storyTrees?.[state.playthrough],id=`ch3:dialogue:${key}:0`;
  if(tree){tree.nodes[id]=JSON.parse(JSON.stringify({playthrough:state.playthrough,chapterIndex:2,scene:'ch3',sceneProgress:state.sceneProgress,flags:state.flags,minigameSaves:state.minigameSaves}));tree.lastNodeId=id;}
 }
 state.chapterContentVersions={...state.chapterContentVersions,ch3:CHAPTER_THREE_VERSION};return true;
}
