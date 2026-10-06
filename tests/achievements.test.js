import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {AchievementStore} from '../src/core/Achievements.js';
import {GameSave,defaults} from '../src/core/GameSave.js';
import {GameManager} from '../src/core/GameManager.js';
import {buildStoryTree,storySnapshot} from '../src/core/StoryTree.js';
import {migrateChapterThree,CHAPTER_THREE_VERSION} from '../src/core/ChapterContent.js';
import {SurvivorRun} from '../src/minigames/survivors/model.js';

const scenes=JSON.parse(readFileSync(new URL('../public/data/scenes.json',import.meta.url)));
const story=JSON.parse(readFileSync(new URL('../public/data/story.json',import.meta.url)));
const storage=()=>{const values=new Map();return {getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};};

test('achievements persist independently of new games, journey changes and story restoration; duplicate events notify once',()=>{
 const disk=storage(),awards=new AchievementStore(disk),manager=new GameManager(new GameSave(disk));let notifications=0;
 awards.onUnlock(()=>notifications++);assert.equal(awards.unlock('night-fear'),true);assert.equal(awards.unlock('night-fear'),false);assert.equal(awards.unlock('unknown'),false);
 manager.initializeStoryTrees(scenes,story);manager.startNewGame();manager.go('ch1');manager.saveGameplayPosition();manager.secondRun();
 assert.equal(manager.restoreStoryNode(1,'ch1:game'),true);manager.startNewGame();manager.clearSavedGame();
 assert.equal(new AchievementStore(disk).isUnlocked('night-fear'),true);assert.equal(notifications,1);assert.equal(awards.count,1);
});

test('malformed or unavailable storage does not interrupt gameplay or duplicate awards',()=>{
 const unavailable={getItem(){throw Error('blocked');},setItem(){throw Error('quota');}};
 const awards=new AchievementStore(unavailable);assert.equal(awards.unlock('memory-fall'),true);assert.equal(awards.unlock('memory-fall'),false);assert.equal(awards.count,1);
 assert.equal(new AchievementStore({getItem:()=>'{bad'}).count,0);
 assert.equal(new AchievementStore({getItem:()=>JSON.stringify({version:1,unlocked:{'night-fear':1,'invalid':1,'memory-fall':-4}})}).count,1);
});

test('night garden tracks damage throughout a run, including damage that was later healed',()=>{
 const run=new SurvivorRun();run.start();run.player.armor=100;run.hurt(12);assert.equal(run.damageTaken,1);
 run.hurt(12);assert.equal(run.damageTaken,1);run.player.hp=run.player.maxHp;assert.equal(run.damageTaken,1);
 const retry=new SurvivorRun();assert.equal(retry.damageTaken,0);
 run.player.invulnerable=0;run.hurt(999);assert.equal(run.mode,'lost');assert.equal(run.damageTaken,101);
});

test('removing chapter three preserves both story trees and converts former gameplay checkpoints to dialogue',()=>{
 for(const journey of [1,2]){
  const state={...defaults(),playthrough:journey,chapterIndex:2,scene:'ch3',sceneProgress:{scene:'ch3',kind:'game'},chapterContentVersions:{ch3:'before-departure-screenplay-v2'},storyTrees:{1:{nodes:{},lastNodeId:null},2:{nodes:{},lastNodeId:null}},minigameSaves:{['beforeDeparture:'+journey]:{location:'station'},['shiguang:'+journey]:{keep:true}},flags:{youthOutcome:'FAILED_LATE',firstJourneyComplete:true}};
  const tree=state.storyTrees[journey];tree.nodes['ch3:game']=storySnapshot(state);tree.lastNodeId='ch3:game';
  tree.nodes['ch2:game']=storySnapshot({...state,scene:'ch2',chapterIndex:1,sceneProgress:{scene:'ch2',kind:'game'}});
  assert.equal(migrateChapterThree(state,scenes),true);
  const key=journey===1?'p1_06':'p2_06';assert.equal(state.sceneProgress.storyKey,key);
  assert.equal(tree.nodes['ch3:game'],undefined);assert.equal(tree.lastNodeId,`ch3:dialogue:${key}:0`);assert.ok(tree.nodes['ch2:game']);
  assert.equal(state.minigameSaves['beforeDeparture:'+journey],undefined);assert.deepEqual(state.minigameSaves['shiguang:'+journey],{keep:true});assert.equal(state.flags.youthOutcome,undefined);
  assert.equal(state.chapterContentVersions.ch3,CHAPTER_THREE_VERSION);assert.equal(migrateChapterThree(state,scenes),false);
  const definitions=buildStoryTree(scenes,story,journey);assert.ok(definitions.groups.some(group=>group.id==='ch3'));assert.ok(!definitions.nodes.some(node=>node.id==='ch3:game'));
  const chapter=scenes.find(scene=>scene.id==='ch3');for(const post of chapter[journey===1?'week1':'week2'].postGameKeys)assert.ok(definitions.nodes.some(node=>node.id===`ch3:dialogue:${post}:0`));
 }
});

test('youth dialogue lines and later chapters keep their cursor during the removal migration',()=>{
 for(const [key,index,expected] of [['ch3_departure_w2',4,'p2_06'],['p2_10',2,'p2_10']]){
  const state={...defaults(),playthrough:2,scene:'ch3',chapterContentVersions:{},sceneProgress:{scene:'ch3',kind:'dialogue',storyKey:key,index}};
  migrateChapterThree(state,scenes);assert.equal(state.sceneProgress.storyKey,expected);assert.equal(state.sceneProgress.index,index);
 }
 const state={...defaults(),scene:'ch4',chapterContentVersions:{},sceneProgress:{scene:'ch4',kind:'dialogue',storyKey:'p1_10',index:2}};
 migrateChapterThree(state,scenes);assert.deepEqual(state.sceneProgress,{scene:'ch4',kind:'dialogue',storyKey:'p1_10',index:2});
});
