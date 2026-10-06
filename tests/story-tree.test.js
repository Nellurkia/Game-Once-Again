import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GameSave,defaults} from '../src/core/GameSave.js';
import {GameManager} from '../src/core/GameManager.js';
import {buildStoryTree} from '../src/core/StoryTree.js';

const scenes=JSON.parse(readFileSync(new URL('../public/data/scenes.json',import.meta.url)));
const story=JSON.parse(readFileSync(new URL('../public/data/story.json',import.meta.url)));
function fixture(state){
 let raw=state?JSON.stringify(state):null;
 const save=new GameSave({getItem:()=>raw,setItem:(_,value)=>raw=value,removeItem:()=>raw=null});
 const manager=new GameManager(save);manager.initializeStoryTrees(scenes,story);
 return {save,manager};
}
test('tree nodes follow each journey and final choices fork from the ending menu',()=>{
 const first=buildStoryTree(scenes,story,1),later=buildStoryTree(scenes,story,2);
 assert.equal(new Set(first.nodes.map(node=>node.id)).size,first.nodes.length);
 assert.equal(new Set(later.nodes.map(node=>node.id)).size,later.nodes.length);
 assert.equal(first.nodes[0].scene,'prologue');
 assert.equal(first.nodes.at(-1).id,`ch4:dialogue:p1_14:${story.p1_14.length-1}`);
 assert.equal(later.nodes[0].id,'ch1:dialogue:p2_01:0');
 assert.ok(!later.nodes.some(node=>node.scene==='prologue'));
 for(const ending of ['BE','NE','TE']){
  const keys=story.endingSequences[ending],firstId=`ending:dialogue:${keys[0]}:0`;
  assert.deepEqual(later.nodes.find(node=>node.id===firstId).parents,['ending_select']);
  assert.deepEqual(later.nodes.find(node=>node.id===`ending:${ending}:card`).parents,[`ending:dialogue:${keys.at(-1)}:${story[keys.at(-1)].length-1}`]);
 }
});
test('unvisited nodes cannot be selected, including an otherwise reached node in another journey',()=>{
 const {manager:m}=fixture();m.startNewGame();m.go('ch1');m.saveGameplayPosition();
 const before=JSON.stringify(m.state);
 assert.equal(m.restoreStoryNode(1,'ch2:game'),false);
 assert.equal(m.restoreStoryNode(2,'ch1:game'),false);
 assert.equal(m.restoreStoryNode(1,'nonexistent'),false);
 assert.equal(JSON.stringify(m.state),before);
 assert.equal(m.restoreStoryNode(1,'ch1:game'),true);
});
test('returning to an earlier dialogue restores its exact line and choices without losing later unlocks or settings',()=>{
 const {save,manager:m}=fixture();m.startNewGame();m.go('ch2');
 m.state.chapterIndex=1;m.setFlag('oldChoice',true);m.saveDialoguePosition('p1_04',0);
 m.setFlag('laterChoice',true);m.saveDialoguePosition('p1_04',1);
 m.saveGameplayPosition();m.state.settings.bgmVolume=.2;m.persist();
 const restored=new GameManager(save);restored.initializeStoryTrees(scenes,story);
 assert.equal(restored.restoreStoryNode(1,'ch2:dialogue:p1_04:0'),true);
 assert.equal(restored.dialogueIndex('p1_04',story.p1_04.length),0);
 assert.deepEqual(restored.state.flags,{oldChoice:true});
 assert.equal(restored.state.settings.bgmVolume,.2);
 assert.ok(restored.state.storyTrees[1].nodes['ch2:dialogue:p1_04:1']);
 assert.ok(restored.state.storyTrees[1].nodes['ch2:game']);
 assert.equal(new GameManager(save).state.sceneProgress.index,0);
});
test('chapter gameplay checkpoints and unlock history remain independent between journeys',()=>{
 const {manager:m}=fixture();m.startNewGame();m.go('ch4');m.state.chapterIndex=3;m.saveGameplayPosition();
 m.saveMinigameProgress('shiguang',{variantId:'first',pieces:[1,2]});
 m.secondRun();m.go('ch4');m.state.chapterIndex=3;m.saveGameplayPosition();
 m.saveMinigameProgress('shiguang',{variantId:'second',pieces:[1,2,3]});
 assert.equal(m.restoreStoryNode(1,'ch4:game'),true);
 assert.deepEqual(m.getMinigameSave('shiguang'),{variantId:'first',pieces:[1,2]});
 assert.equal(m.restoreStoryNode(2,'ch4:game'),true);
 assert.deepEqual(m.getMinigameSave('shiguang'),{variantId:'second',pieces:[1,2,3]});
 assert.equal(m.state.playthrough,2);
});
test('only visited ending branches unlock; restoring an earlier ending keeps recorded endings',()=>{
 const {manager:m}=fixture();m.startNewGame();m.secondRun();m.go('ending_select');
 m.ending('NE');m.saveDialoguePosition('E-A-01',0);m.go('credits');
 assert.equal(m.restoreStoryNode(2,'ending:dialogue:E-T-01:0'),false);
 assert.equal(m.restoreStoryNode(2,'ending:BE:card'),false);
 m.go('ending_select');m.ending('TE');m.saveDialoguePosition('E-T-01',0);
 assert.equal(m.restoreStoryNode(2,'ending:dialogue:E-A-01:0'),true);
 assert.equal(m.state.flags.ending,'NE');
 assert.deepEqual(m.state.unlockedEndings,['NE','TE']);
 m.ending('BE');m.state.sceneProgress={scene:'ending',kind:'ending_card'};m.rememberStoryNode();m.persist();
 assert.equal(m.restoreStoryNode(2,'ending:BE:card'),true);
 assert.equal(m.state.scene,'ending');assert.equal(m.state.chapterIndex,3);
});
test('legacy migration preserves the saved line, reconstructs mandatory past nodes and leaves future nodes locked',()=>{
 const state={...defaults(),scene:'ch2',chapterIndex:1,sceneProgress:{scene:'ch2',kind:'dialogue',storyKey:'p1_04',index:1},flags:{old:true}};
 delete state.storyTrees;
 const {manager:m,save}=fixture(state);
 assert.ok(m.state.storyTrees[1].nodes['prologue:dialogue:prologue:0']);
 assert.ok(m.state.storyTrees[1].nodes['ch1:game']);
 assert.equal(m.state.storyTrees[1].lastNodeId,'ch2:dialogue:p1_04:1');
 assert.equal(m.restoreStoryNode(1,'ch2:game'),false);
 assert.equal(m.restoreStoryNode(2,'ch1:game'),false);
 assert.equal(m.restoreStoryNode(1,'ch2:dialogue:p1_04:1'),true);
 assert.equal(m.state.sceneProgress.index,1);assert.equal(m.state.flags.old,true);
 assert.ok(new GameManager(save).state.storyTrees[1].nodes['ch1:game']);
});
test('legacy later journeys unlock the completed first tree without revealing unchosen endings',()=>{
 const {manager:m}=fixture({...defaults(),playthrough:2,scene:'ch1'});
 assert.ok(m.state.storyTrees[1].nodes[`ch4:dialogue:p1_14:${story.p1_14.length-1}`]);
 assert.ok(m.state.storyTrees[2].nodes['ch1:dialogue:p2_01:0']);
 assert.equal(m.restoreStoryNode(2,'ending_select'),false);
 assert.equal(m.restoreStoryNode(2,'ending:dialogue:E-A-01:0'),false);
});
test('legacy saves with missing or invalid cursors keep their flags at a selectable first line',()=>{
 for(const progress of [null,{scene:'ch2',kind:'dialogue',storyKey:'p1_04',index:99}]){
  const {manager:m}=fixture({...defaults(),scene:'ch2',chapterIndex:1,sceneProgress:progress,flags:{oldChoice:true}});
  assert.equal(m.state.storyTrees[1].lastNodeId,'ch2:dialogue:p1_04:0');
  assert.equal(m.restoreStoryNode(1,'ch2:dialogue:p1_04:0'),true);
  assert.equal(m.state.flags.oldChoice,true);assert.equal(m.state.sceneProgress.index,0);
  assert.equal(m.restoreStoryNode(1,'ch2:game'),false);
 }
});
test('new games and clearing saves erase both trees while keeping volume preferences',()=>{
 const {manager:m,save}=fixture();m.startNewGame();m.go('ch1');m.saveGameplayPosition();
 m.secondRun();m.saveGameplayPosition();m.state.settings.bgmVolume=.3;
 m.startNewGame();assert.equal(m.state.storyTrees,null);assert.equal(m.state.settings.bgmVolume,.3);
 m.go('ch1');m.saveGameplayPosition();m.clearSavedGame();
 assert.equal(save.load(),null);assert.equal(m.state.storyTrees,null);
});
test('a corrupted node snapshot cannot route an unlocked ID into an unreached scene',()=>{
 const {manager:m}=fixture();m.startNewGame();m.go('ch1');m.saveGameplayPosition();
 m.state.storyTrees[1].nodes['ch1:game'].scene='ch4';
 assert.equal(m.restoreStoryNode(1,'ch1:game'),false);
});
