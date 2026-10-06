import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const scope={window:{}};vm.createContext(scope);vm.runInContext(readFileSync(new URL('../public/minigames/shiguang/level-data.js',import.meta.url),'utf8'),scope);
const level=scope.window.MEMORY_LEVEL;
test('Shiguang first journey leaves three visual pieces missing; second requires all fourteen',()=>{
 assert.equal(level.pieces.length,14);assert.equal(level.variants.first.completionPieceIds.length,11);assert.equal(level.variants.second.completionPieceIds.length,14);
 const absent=level.pieces.filter(p=>!level.variants.first.availablePieceIds.includes(p.id));assert.equal(absent.length,3);assert.ok(absent.every(p=>p.optional));
 for(const v of Object.values(level.variants))for(const id of v.availablePieceIds){const p=level.pieces.find(p=>p.id===id);assert.ok(p.requires.every(dep=>v.availablePieceIds.includes(dep)));}
 for(const p of level.pieces)assert.ok(level.variants.second.completionPieceIds.includes(p.id));
});
test('chapter four routes to supplied project using a separate save identifier',()=>{
 const scenes=JSON.parse(readFileSync(new URL('../public/data/scenes.json',import.meta.url)));assert.equal(scenes.find(c=>c.id==='ch4').minigame,'shiguang');assert.equal(scenes.find(c=>c.id==='ch3').minigame,'quietNight');
});
