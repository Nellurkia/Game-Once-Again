import {buildStoryTree,storyNodeId,storySnapshot} from './StoryTree.js';

export const STORY_TEXT_VERSION='complete-script-v0.1';

function migratePosition(snapshot,story,scenes){
 const progress=snapshot.sceneProgress;
 if(progress?.kind!=='dialogue')return false;
 let key=progress.storyKey;
 if(key==='outro'){
  const chapter=scenes.find(item=>item.id===snapshot.scene);
  const config=chapter?.[snapshot.playthrough===1?'week1':'week2'];
  key=(config?.postGameKeysByOutcome?.[snapshot.flags?.youthOutcome]||config?.postGameKeys||[])[0];
 }
 if(snapshot.scene==='ending'&&story.endingSequences?.[snapshot.flags?.ending]?.includes(key)){}
 else if(snapshot.scene==='ending'&&story.endingSequences?.[snapshot.flags?.ending])key=story.endingSequences[snapshot.flags.ending][0];
 if(!key||!Array.isArray(story[key]))return false;
 progress.storyKey=key;progress.index=0;return true;
}

export function migrateStoryContent(state,scenes,story){
 if(state.storyTextVersion===STORY_TEXT_VERSION)return false;
 for(const journey of [1,2]){
  const tree=state.storyTrees?.[journey];if(!tree)continue;
  const previous=tree.nodes[tree.lastNodeId];
  for(const snapshot of Object.values(tree.nodes))migratePosition(snapshot,story,scenes);
  if(previous){
   if(previous.scene==='interlude'&&journey===1){
    const definitions=buildStoryTree(scenes,story,journey).nodes,last=definitions.at(-1);
    if(last){tree.nodes[last.id]=storySnapshot({...previous,scene:last.scene,sceneProgress:last.sceneProgress});tree.lastNodeId=last.id;continue;}
   }
   migratePosition(previous,story,scenes);
   const id=storyNodeId(previous),definition=buildStoryTree(scenes,story,journey).nodes.find(node=>node.id===id);
   if(definition){tree.nodes[id]=storySnapshot(previous);tree.lastNodeId=id;}
   else{
    const definitions=buildStoryTree(scenes,story,journey).nodes;
    const last=definitions.find(node=>node.id.endsWith(':game')&&node.scene===previous.scene&&tree.nodes[node.id]);
    if(last){tree.nodes[last.id]=storySnapshot({...previous,sceneProgress:last.sceneProgress});tree.lastNodeId=last.id;}
   }
  }
 }
 if(state.scene==='interlude'&&state.playthrough===1){state.flags.firstJourneyComplete=true;state.scene='title';state.sceneProgress=null;}
 migratePosition(state,story,scenes);
 const tree=state.storyTrees?.[state.playthrough],currentId=storyNodeId(state);
 if(tree&&currentId&&buildStoryTree(scenes,story,state.playthrough).nodes.some(node=>node.id===currentId)){
  tree.nodes[currentId]=storySnapshot(state);tree.lastNodeId=currentId;
 }
 state.storyTextVersion=STORY_TEXT_VERSION;return true;
}
