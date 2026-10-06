import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {chapterAfterGameKeys,migrateChapterThree} from '../src/core/ChapterContent.js';
import {buildStoryTree,storySnapshot} from '../src/core/StoryTree.js';
import {GameSave,defaults} from '../src/core/GameSave.js';
import {GameManager} from '../src/core/GameManager.js';
const html=readFileSync(new URL('../public/minigames/station-runner/index.html',import.meta.url),'utf8');
const source=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const scenes=JSON.parse(readFileSync(new URL('../public/data/scenes.json',import.meta.url)));
const story=JSON.parse(readFileSync(new URL('../public/data/story.json',import.meta.url)));
const chapter=scenes.find(item=>item.id==='ch3'),clone=value=>JSON.parse(JSON.stringify(value));
function fixture(journey=1,save=null){
 let clock=0,nextFrame,raf=0;const updates=[],results=[],noop=()=>{},elements=new Map();
 const canvasContext=new Proxy({createLinearGradient:()=>({addColorStop:noop})},{get:(target,key)=>target[key]||noop});
 function element(id){
  if(elements.has(id))return elements.get(id);
  const node={style:{},dataset:{},classList:{toggle:noop},hidden:false,addEventListener:noop,setPointerCapture:noop,getContext:()=>canvasContext,buttons:[]};
  Object.defineProperty(node,'innerHTML',{set(value){this.html=value;this.buttons=[...value.matchAll(/data-i="(\d+)"/g)].map(match=>({dataset:{i:match[1]},click(){this.onclick?.();}}));},get(){return this.html;}});
  node.querySelectorAll=()=>node.buttons;node.querySelector=selector=>node.buttons.find(button=>selector.includes(`"${button.dataset.i}"`));elements.set(id,node);return node;
 }
 const sandbox={document:{body:element('body'),hidden:false,getElementById:element,querySelectorAll:()=>[],addEventListener:noop},location:{search:'?embedded=1'},URLSearchParams,matchMedia:()=>({matches:false}),performance:{now:()=>clock},requestAnimationFrame:callback=>{nextFrame=callback;return ++raf;},cancelAnimationFrame:()=>{nextFrame=null;},addEventListener:noop};
 sandbox.window=sandbox;sandbox.parent={playGameSfx:noop};runInNewContext(source,sandbox);
 const api=sandbox.stationRunner,options={journey,save,getSfxVolume:()=>0,onProgress:value=>updates.push(clone(value)),onComplete:value=>results.push(clone(value))};api.start(options);
 const tick=seconds=>{for(let elapsed=0;elapsed<seconds;elapsed+=.02){clock+=20;const callback=nextFrame;nextFrame=null;callback?.(clock);}};
 return {api,options,updates,results,tick,primary:()=>element('overlay').buttons[0].click(),secondary:()=>element('overlay').buttons[1].click()};
}
test('journeys keep distinct departure times and wait for confirmation before counting down',()=>{
 for(const journey of [1,2]){const game=fixture(journey);assert.equal(game.api.inspect().mode,'ready');assert.equal(game.api.inspect().timeLimit,journey===1?44:56);game.tick(2);assert.equal(game.api.inspect().elapsed,0);game.api.handleKey({key:' '});game.tick(1);assert.ok(game.api.inspect().elapsed>=.98);}
});
test('host and manual pauses freeze the countdown; dispose saves once and stops updates',()=>{
 const game=fixture(2);game.primary();game.tick(1);const elapsed=game.api.inspect().elapsed;
 game.api.setHostPaused(true);game.tick(1);assert.equal(game.api.inspect().elapsed,elapsed);assert.equal(game.api.handleKey({key:' '}),false);
 game.api.setHostPaused(false);game.api.pause();game.tick(1);assert.equal(game.api.inspect().elapsed,elapsed);
 game.primary();game.tick(.2);assert.ok(game.api.inspect().elapsed>elapsed);game.api.dispose();const count=game.updates.length;game.tick(1);assert.equal(game.updates.length,count);
});
test('checkpoint restores timers, course, lane and items without first overwriting the save',()=>{
 const game=fixture(2);game.primary();game.tick(3);game.api.handleKey({key:'a'});game.tick(.2);
 const saved=clone(game.api.getSaveData());saved.items=2;saved.meds=1;saved.clocks=1;
 const restored=fixture(2,saved);assert.equal(restored.updates.length,1);assert.equal(restored.api.inspect().mode,'paused');
 for(const key of ['elapsed','route','lane','switchTime','section','items','meds','clocks','stamina','obs'])assert.deepEqual(clone(restored.api.getSaveData()[key]),saved[key]);
 restored.tick(2);assert.equal(restored.api.inspect().elapsed,saved.elapsed);restored.primary();restored.tick(.2);assert.ok(restored.api.inspect().elapsed>saved.elapsed);
 restored.api.handleKey({key:'e'});assert.equal(restored.api.inspect().shield,true);assert.equal(restored.api.inspect().items,1);
});
test('invalid or wrong-journey checkpoints restart safely in the requested journey',()=>{
 const saved=clone(fixture(1).api.getSaveData());assert.equal(fixture(2,saved).api.inspect().journey,2);saved.elapsed=Infinity;
 const game=fixture(1,saved);assert.equal(game.api.inspect().elapsed,0);assert.equal(game.api.inspect().mode,'ready');
});
test('first journey misses even when reaching the platform; completion is explicit and delivered once',()=>{
 const game=fixture(1),saved=clone(game.api.getSaveData());Object.assign(saved,{mode:'playing',route:14499,elapsed:30,obs:[]});
 game.api.start({...game.options,save:saved});game.primary();game.tick(4.2);
 assert.equal(game.api.inspect().mode,'ended');assert.equal(game.api.inspect().result.outcome,'missed');assert.equal(game.results.length,0);
 game.primary();assert.equal(game.results.length,1);assert.equal(game.results[0].journey,1);game.api.handleKey({key:' '});assert.equal(game.results.length,1);
});
test('second journey can win or miss, with independent retry and continue actions',()=>{
 for(const won of [true,false]){
  const game=fixture(2),saved=clone(game.api.getSaveData());Object.assign(saved,{mode:'playing',route:won?14499:1000,elapsed:won?30:55.98,obs:[]});
  game.api.start({...game.options,save:saved});game.primary();game.tick(4.3);assert.equal(game.api.inspect().result.outcome,won?'met':'missed');
  if(won)game.primary();else{const ended=clone(game.api.getSaveData());game.primary();assert.equal(game.api.inspect().journey,2);assert.equal(game.api.inspect().mode,'ready');game.api.start({...game.options,save:ended});game.secondary();}
  assert.equal(game.results.length,1);assert.equal(game.results[0].won,won);
 }
});
test('outcome branches have unique nodes, converge once, and reject unvisited outcomes',()=>{
 const tree=buildStoryTree(scenes,story,2);assert.equal(new Set(tree.nodes.map(node=>node.id)).size,tree.nodes.length);
 assert.deepEqual(tree.nodes.find(node=>node.id==='ch3:dialogue:p2_08:0').parents,[`ch3:dialogue:p2_07:${story.p2_07.length-1}`,`ch3:dialogue:p2_station_missed:${story.p2_station_missed.length-1}`]);
 assert.deepEqual(chapterAfterGameKeys(chapter,1,'missed'),['p1_07']);
 assert.deepEqual(chapterAfterGameKeys(chapter,2,'met'),['p2_07',...chapter.week2.postGameKeys]);assert.deepEqual(chapterAfterGameKeys(chapter,2,'missed'),['p2_station_missed',...chapter.week2.postGameKeys]);
 let raw;const manager=new GameManager(new GameSave({getItem:()=>raw,setItem:(_,value)=>raw=value}));manager.initializeStoryTrees(scenes,story);manager.secondRun();manager.go('ch3');manager.setFlag('youthOutcome','missed');manager.saveDialoguePosition('p2_station_missed',2);
 assert.equal(manager.restoreStoryNode(2,'ch3:dialogue:p2_07:0'),false);assert.equal(manager.restoreStoryNode(2,'ch3:dialogue:p2_station_missed:2'),true);
});
test('existing screenplay saves retain their line and get permission for the on-time branch',()=>{
 const state={...defaults(),playthrough:2,scene:'ch3',chapterIndex:2,chapterContentVersions:{ch3:'youth-story-only-v3'},sceneProgress:{scene:'ch3',kind:'dialogue',storyKey:'p2_07',index:3},storyTrees:{1:{nodes:{},lastNodeId:null},2:{nodes:{},lastNodeId:'ch3:dialogue:p2_07:3'}}};
 state.storyTrees[2].nodes[state.storyTrees[2].lastNodeId]=storySnapshot(state);migrateChapterThree(state,scenes);
 assert.equal(state.sceneProgress.index,3);assert.equal(state.flags.youthOutcome,'met');assert.equal(state.storyTrees[2].nodes['ch3:game'],undefined);assert.equal(state.storyTrees[2].nodes['ch3:dialogue:p2_07:3'].flags.youthOutcome,'met');
});
