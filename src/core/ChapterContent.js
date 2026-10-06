import {storyNodeId,storySnapshot} from './StoryTree.js';

export const CHAPTER_THREE_VERSION='youth-story-only-v3';
export function migrateChapterThree(state,scenes){
 if(state.chapterContentVersions?.ch3===CHAPTER_THREE_VERSION)return false;
 const chapter=scenes.find(scene=>scene.id==='ch3');if(!chapter||chapter.minigame)return false;
 const clean=snapshot=>{
  for(const key of Object.keys(snapshot.minigameSaves||{}))if(/^(beforeDeparture|quietNight):/.test(key))delete snapshot.minigameSaves[key];
  if(snapshot.flags)for(const key of ['youthOutcome','youthComplete','quietNightComplete','quietNightResponse'])delete snapshot.flags[key];
  if(snapshot.scene!=='ch3')return;
  const progress=snapshot.sceneProgress,key=chapter[snapshot.playthrough===1?'week1':'week2'].dialogueKey;
  if(progress?.kind==='game'||progress?.storyKey==='p2_departure_late')snapshot.sceneProgress={scene:'ch3',kind:'dialogue',storyKey:key,index:0};
  else if(['ch3_departure_w1','ch3_departure_w2'].includes(progress?.storyKey))snapshot.sceneProgress={...progress,storyKey:key};
 };
 for(const playthrough of [1,2]){
  const tree=state.storyTrees?.[playthrough];if(!tree)continue;
  const last=tree.nodes[tree.lastNodeId],next={};
  for(const [id,snapshot] of Object.entries(tree.nodes)){
   clean(snapshot);const migrated=snapshot.scene==='ch3'?storyNodeId(snapshot):id;
   if(migrated&&(!next[migrated]||snapshot===last))next[migrated]=snapshot;
  }
  tree.nodes=next;tree.lastNodeId=last?storyNodeId(last):null;
 }
 clean(state);
 const current=storyNodeId(state),tree=state.storyTrees?.[state.playthrough];
 if(current&&tree){tree.nodes[current]=storySnapshot(state);tree.lastNodeId=current;}
 state.chapterContentVersions={...state.chapterContentVersions,ch3:CHAPTER_THREE_VERSION};return true;
}
