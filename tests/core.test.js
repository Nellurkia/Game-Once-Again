import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GameSave,defaults} from '../src/core/GameSave.js';
import {GameManager} from '../src/core/GameManager.js';
function fixture(){let value=null;const storage={getItem:()=>value,setItem:(_,s)=>value=s,removeItem:()=>value=null};const save=new GameSave(storage);return {save,manager:new GameManager(save),storage};}
test('both journeys reach endings and all three ending choices route to their screenplay',()=>{
 const {manager:m}=fixture();m.startNewGame();m.go('ch1');
 for(let i=0;i<4;i++)m.advanceChapter();assert.equal(m.state.scene,'interlude');
 m.secondRun();for(let i=0;i<4;i++)m.advanceChapter();assert.equal(m.state.scene,'ending_select');
 for(const ending of ['BE','NE','TE']){
  m.ending(ending);assert.equal(m.state.scene,'ending');assert.equal(m.state.flags.ending,ending);
  assert.equal(m.state.playthrough,2);assert.equal(m.state.chapterIndex,3);assert.equal(m.state.sceneProgress,null);
 }
 assert.deepEqual(m.state.unlockedEndings,['BE','NE','TE']);
});
test('save survives manager recreation and resets',()=>{const {save,manager:m}=fixture();m.startNewGame();m.advanceChapter();m.setFlag('saidFear',true);const restored=new GameManager(save);assert.equal(restored.state.chapterIndex,1);assert.equal(restored.state.flags.saidFear,true);save.reset();assert.equal(save.load(),null);});
test('unavailable storage uses memory and malformed save does not crash',()=>{const save=new GameSave({getItem(){throw Error();},setItem(){throw Error();},removeItem(){throw Error();}});const m=new GameManager(save);m.startNewGame();m.setFlag('test',true);assert.equal(save.load().flags.test,true);save.reset();assert.equal(save.load(),null);assert.equal(new GameSave({getItem:()=>'{oops'}).load(),null);});
test('scene configs and story keys resolve for both journeys',()=>{const scenes=JSON.parse(readFileSync(new URL('../public/data/scenes.json',import.meta.url)));const story=JSON.parse(readFileSync(new URL('../public/data/story.json',import.meta.url)));assert.equal(scenes.length,11);for(const c of scenes.filter(c=>c.minigame))for(const week of ['week1','week2'])assert.ok(story[c[week].dialogueKey]?.length);});
test('reloading a chapter preserves the dialogue line and choices, while a new scene resets its cursor',()=>{
 const {save,manager}=fixture();
 manager.go('ch2');
 manager.saveDialoguePosition('ch2_w1',2);
 manager.setFlag('saidYes',true);
 const restored=new GameManager(save);
 restored.go('ch2',{resume:true});
 assert.equal(restored.dialogueIndex('ch2_w1',4),2);
 assert.equal(restored.state.flags.saidYes,true);
 assert.equal(restored.dialogueIndex('ch2_w2',4),0);
 restored.go('ch3');
 assert.equal(restored.getSceneProgress(),null);
 restored.saveDialoguePosition('outro',1);
 restored.go('ch3');
 assert.equal(restored.getSceneProgress(),null);
 restored.saveGameplayPosition();
 assert.equal(new GameManager(save).getSceneProgress().kind,'game');
 restored.startNewGame();
 assert.equal(restored.getSceneProgress(),null);
});
test('legacy saves and invalid dialogue cursors safely start at the first line',()=>{
 const old={...defaults(),scene:'ch1'};
 delete old.sceneProgress;
 const manager=new GameManager(new GameSave({getItem:()=>JSON.stringify(old)}));
 assert.equal(manager.state.scene,'ch1');
 assert.equal(manager.dialogueIndex('ch1_w1',3),0);
 for(const index of [-1,100,'1',1.5]){
  manager.state.sceneProgress={scene:'ch1',kind:'dialogue',storyKey:'ch1_w1',index};
  assert.equal(manager.dialogueIndex('ch1_w1',3),0);
 }
 manager.state.sceneProgress={scene:'ch2',kind:'dialogue',storyKey:'ch1_w1',index:1};
 assert.equal(manager.dialogueIndex('ch1_w1',3),0);
});
