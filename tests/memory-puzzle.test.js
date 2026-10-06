import test from 'node:test';
import assert from 'node:assert/strict';
import {CONFIG,validateLevel} from '../src/minigames/memory-puzzle/config.js';
import {MemoryPuzzle} from '../src/minigames/memory-puzzle/model.js';
import {GameSave} from '../src/core/GameSave.js';
import {GameManager} from '../src/core/GameManager.js';
const tick=(game,count,input=0)=>{for(let i=0;i<count;i++)game.step(1/60,input);};
function walk(game,x){for(let i=0;i<1800&&Math.abs(game.player.x-x)>3;i++)game.step(1/60,Math.sign(x-game.player.x));assert.ok(Math.abs(game.player.x-x)<=3,`Cannot walk to ${x}, at ${game.player.x}`);}
function jumpTo(game,x,y){game.requestJump();for(let i=0;i<180;i++){game.step(1/60,Math.abs(x-game.player.x)>3?Math.sign(x-game.player.x):0);if(i>5&&game.player.grounded&&Math.abs(game.player.y-y)<1)return;}assert.fail(`Cannot jump to ${x},${y}; at ${game.player.x},${game.player.y}`);}
function solveSegment(game,segment,placeOptional=true){
 const origin=segment.origin;
 walk(game,origin+130);assert.equal(game.interact(),true);
 walk(game,origin+205);jumpTo(game,origin+270,420);assert.equal(game.interact(),true);
 walk(game,origin+300);jumpTo(game,origin+392,340);assert.equal(game.interact(),true);
 for(const piece of game.pieces().filter(p=>p.segmentId===segment.id&&p.index<3))assert.equal(game.place(piece.id,piece.target),true);
 walk(game,origin+459);tick(game,75);
 if(game.variant.id==='complete'){
  assert.equal(game.interact(),true);
  const piece=game.pieces().find(p=>p.segmentId===segment.id&&p.index===3);
  if(placeOptional)assert.equal(game.place(piece.id,piece.target),true);
 }
}
test('both variants are physically solvable without teleporting or circular pickup dependencies',()=>{
 assert.deepEqual(validateLevel(),[]);
 for(const playthrough of [1,2]){
  const game=new MemoryPuzzle({playthrough,onProgress:()=>true});
  for(const segment of CONFIG.segments)solveSegment(game,segment);
  walk(game,3400);assert.equal(game.interact(),false);assert.match(game.message,/钥匙/);
  walk(game,3130);assert.equal(game.interact(),true);walk(game,3400);assert.equal(game.interact(),true);
  assert.equal(game.completed,true);assert.equal(game.variant.completionPieceIds.length,playthrough===1?9:12);
  assert.equal(game.saveStatus,'saved');assert.equal(game.validateSave(game.snapshot()),null);
 }
});
test('second journey requires placed optional pieces, not just collected pieces',()=>{
 const game=new MemoryPuzzle({playthrough:2});
 for(const segment of CONFIG.segments)solveSegment(game,segment,false);
 walk(game,3130);game.interact();walk(game,3400);assert.equal(game.interact(),false);assert.match(game.message,/记忆还没拼完整/);
 for(const p of game.inventory())assert.equal(game.place(p.id,p.target),true);
 assert.equal(game.interact(),true);
});
test('incorrect drops preserve inventory; matching placement restores terrain and reload preserves it',()=>{
 const game=new MemoryPuzzle();walk(game,130);game.interact();const piece=game.pieces()[0],count=game.terrain().length;
 assert.equal(game.place(piece.id,{x:0,y:0}),false);assert.equal(game.pieceStates[piece.id],'inventory');assert.equal(game.terrain().length,count);
 assert.equal(game.place(piece.id,piece.target),true);assert.equal(game.terrain().length,count+1);
 const restored=new MemoryPuzzle({save:game.snapshot()});assert.equal(restored.pieceStates[piece.id],'placed');assert.equal(restored.terrain().length,count+1);
 restored.player.y=900;tick(restored,30);assert.equal(restored.status,'playing');assert.equal(restored.player.y,500);assert.equal(restored.pieceStates[piece.id],'placed');
});
test('save failures are reported and corrupt snapshots are not overwritten',()=>{
 let calls=0;const game=new MemoryPuzzle({save:{schemaVersion:999},onProgress:()=>{calls++;return true;}});
 assert.equal(game.status,'recovery');assert.match(game.error,/存档格式或版本/);game.commit();tick(game,10);assert.equal(calls,0);
 const fresh=new MemoryPuzzle({onProgress:()=>{throw new Error('quota');}});fresh.commit();assert.equal(fresh.saveStatus,'memory');
 assert.equal(game.validateSave(fresh.snapshot()),null);assert.equal(calls,0);
});
test('host keeps puzzle saves separate across journeys and reports storage failures',()=>{
 let raw=null;const save=new GameSave({getItem:()=>raw,setItem:(_,s)=>{raw=s;},removeItem:()=>{raw=null;}}),manager=new GameManager(save);
 const first=new MemoryPuzzle().snapshot();assert.equal(manager.saveMinigameProgress('memoryPuzzle',first),true);
 manager.secondRun();assert.equal(manager.getMinigameSave('memoryPuzzle'),null);
 manager.saveMinigameProgress('memoryPuzzle',new MemoryPuzzle({playthrough:2}).snapshot());
 assert.deepEqual(manager.state.minigameSaves['memoryPuzzle:1'],first);
 assert.equal(new GameManager(save).getMinigameSave('memoryPuzzle').variantId,'complete');
 const unavailable=new GameManager(new GameSave({getItem(){throw Error();},setItem(){throw Error();}}));assert.equal(unavailable.saveMinigameProgress('memoryPuzzle',first),false);
});
