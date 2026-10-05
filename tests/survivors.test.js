import test from 'node:test';
import assert from 'node:assert/strict';
import {SurvivorRun,SHELTERS} from '../src/minigames/survivors/model.js';

test('three distinct rewards lead to the boss; choosing pauses the battle and requires a valid offer',()=>{
 const run=new SurvivorRun({random:()=>.3,roundDuration:.1});run.start();
 for(let wave=1;wave<=3;wave++){
  run.step(.05);run.step(.05);
  assert.equal(run.mode,'choice');assert.equal(run.wave,wave);
  assert.equal(new Set(run.offers.map(i=>i.id)).size,3);
  assert.ok(run.offers.every(i=>!run.items.includes(i.id)));
  const time=run.time;run.step(.05,{x:1});assert.equal(run.time,time);
  assert.equal(run.choose('unknown'),false);
  assert.equal(run.choose(run.offers[0].id),true);
 }
 assert.equal(run.mode,'boss');assert.equal(run.items.length,3);assert.equal(new Set(run.items).size,3);
 assert.ok(run.boss.hp>0);
 run.boss.hp=0;run.step(.01);assert.equal(run.mode,'won');
});
test('hiding requires foliage, suppresses fire and breaks boss lock; breath cannot be held forever',()=>{
 const run=new SurvivorRun({roundDuration:999});run.start();run.spawnTimer=999;
 run.step(.05,{hide:true});assert.equal(run.player.hidden,false);
 Object.assign(run.player,{x:SHELTERS[0].x,y:SHELTERS[0].y,hp:50});
 run.enemies=[{id:1,x:400,y:270,r:12,hp:50,speed:0,heading:0}];
 run.step(.05,{hide:true});assert.equal(run.player.hidden,true);assert.ok(run.player.hp>50);assert.equal(run.shots.length,0);
 for(let i=0;i<82;i++)run.step(.05,{hide:true});
 assert.equal(run.player.hidden,false);assert.equal(run.player.exhausted,true);
 run.step(.05,{hide:false});assert.equal(run.player.exhausted,false);
 run.player.breath=4;run.mode='boss';run.boss={id:99,x:800,y:240,r:33,hp:520,maxHp:520,warning:{kind:'mark',x:285,y:270,t:.5}};
 run.step(.05,{hide:true});assert.equal(run.boss.warning,null);
});
test('walls stop player motion and projectiles; death stops combat rather than completing the chapter',()=>{
 const run=new SurvivorRun({roundDuration:999});run.start();run.spawnTimer=999;
 Object.assign(run.player,{x:500,y:260});
 for(let i=0;i<20;i++)run.step(.05,{y:1});
 assert.ok(run.player.y<284-run.player.r);
 run.projectile({x:500,y:279},{x:500,y:330},150,true);run.step(.05);assert.equal(run.hazards.length,0);
 run.hurt(999);assert.equal(run.mode,'lost');const time=run.time;run.step(.05);assert.equal(run.time,time);
});
