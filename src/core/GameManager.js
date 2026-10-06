import {defaults} from './GameSave.js';
import {emptyStoryTrees,storyNodeId,storySnapshot,migrateStoryTrees,buildStoryTree} from './StoryTree.js';
import {migrateChapterThree} from './ChapterContent.js';
export class GameManager {
 constructor(save){this.save=save;this.state=save.load()||defaults();this.events=new Map();}
 on(event,cb){if(!this.events.has(event))this.events.set(event,new Set());this.events.get(event).add(cb);return ()=>this.events.get(event).delete(cb);}
 emit(event){this.events.get(event)?.forEach(cb=>cb(this.state));}
 persist(){const saved=this.save.save(this.state);this.emit('change');return saved;}
 getMinigameSave(id){return this.state.minigameSaves?.[`${id}:${this.state.playthrough}`]??null;}
 saveMinigameProgress(id,snapshot){this.state.minigameSaves??={};this.state.minigameSaves[`${id}:${this.state.playthrough}`]=snapshot;this.rememberStoryNode();return this.persist();}
 clearSavedGame(){const settings=this.state.settings;this.save.reset();this.state={...defaults(),settings};}
 startNewGame(){this.clearSavedGame();this.persist();}
 initializeStoryTrees(scenes,story){this.storyDefinitions={scenes,story};const treeChanged=migrateStoryTrees(this.state,scenes,story),chapterChanged=migrateChapterThree(this.state,scenes);if((treeChanged||chapterChanged)&&this.save.load())this.persist();}
 rememberStoryNode(id=storyNodeId(this.state)){if(!id)return;this.state.storyTrees??=emptyStoryTrees();const tree=this.state.storyTrees[this.state.playthrough];tree.nodes[id]=storySnapshot(this.state);tree.lastNodeId=id;}
 restoreStoryNode(playthrough,id){
  if(![1,2].includes(playthrough)||!this.storyDefinitions)return false;
  const node=buildStoryTree(this.storyDefinitions.scenes,this.storyDefinitions.story,playthrough).nodes.find(node=>node.id===id);
  const snapshot=this.state.storyTrees?.[playthrough]?.nodes[id];
  if(!node||!snapshot||snapshot.playthrough!==playthrough||snapshot.scene!==node.scene)return false;
  if(id!=='ending:BE'&&storyNodeId(snapshot)!==id)return false;
  if(node.ending&&snapshot.flags.ending!==node.ending)return false;
  if(node.outcome&&snapshot.flags.youthOutcome!==node.outcome)return false;
  Object.assign(this.state,JSON.parse(JSON.stringify(snapshot)));
  this.state.storyTrees[playthrough].lastNodeId=id;this.persist();return true;
 }
 setFlag(k,v){this.state.flags[k]=v;this.persist();}
 go(scene,{resume=false}={}){if(!resume||this.state.scene!==scene)this.state.sceneProgress=null;this.state.scene=scene;this.rememberStoryNode();this.persist();}
 getSceneProgress(){const progress=this.state.sceneProgress;return progress?.scene===this.state.scene?progress:null;}
 dialogueIndex(storyKey,lineCount){const progress=this.getSceneProgress();return progress?.kind==='dialogue'&&progress.storyKey===storyKey&&Number.isInteger(progress.index)&&progress.index>=0&&progress.index<lineCount?progress.index:0;}
 saveDialoguePosition(storyKey,index){this.state.sceneProgress={scene:this.state.scene,kind:'dialogue',storyKey,index};this.rememberStoryNode();this.persist();}
 saveGameplayPosition(){this.state.sceneProgress={scene:this.state.scene,kind:'game'};this.rememberStoryNode();this.persist();}
 advanceChapter(){if(this.state.chapterIndex<3){this.state.chapterIndex++;this.go('ch'+(this.state.chapterIndex+1));}else this.go(this.state.playthrough===1?'interlude':'ending_select');return this.state.scene;}
 secondRun(){this.state.playthrough=2;this.state.chapterIndex=0;this.go('ch1');}
 ending(id){if(!this.state.unlockedEndings.includes(id))this.state.unlockedEndings.push(id);this.state.flags.ending=id;if(id==='BE'){this.secondRun();this.rememberStoryNode('ending:BE');this.persist();}else this.go('ending');}
}
