import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BeforeDeparture} from '../src/minigames/before-departure/model.js';
import {CLOCK,OBJECTS,ROUTES} from '../src/minigames/before-departure/data.js';
import {GameSave,defaults} from '../src/core/GameSave.js';
import {GameManager} from '../src/core/GameManager.js';
const scenes=JSON.parse(readFileSync(new URL('../public/data/scenes.json',import.meta.url)));
const story=JSON.parse(readFileSync(new URL('../public/data/story.json',import.meta.url)));
const tick=(m,seconds,dx=0,dy=0)=>{for(let i=0;i<Math.ceil(seconds*10);i++)m.step(.1,dx,dy);};
const finishTask=m=>{for(let i=0;m.s.task&&i<5000;i++)m.step(.1);assert.equal(m.s.task,null);};
function interact(m,id){const object=OBJECTS.find(object=>object.id===id);m.s.area=object.area;m.s.x=object.x;m.s.y=object.y;return m.interact(id);}
function prepare(m){interact(m,'key');finishTask(m);interact(m,'wallet');finishTask(m);}
function leave(m,time=1080){prepare(m);m.s.minutes=time;interact(m,'door');m.leave('go');}
test('clock advances stably during exploration and pauses throughout a readable message',()=>{
 const m=new BeforeDeparture();tick(m,30);assert.ok(Math.abs(m.s.minutes-(CLOCK.start+30*CLOCK.minutesPerSecond))<1e-6);
 m.openDialog('message','A');const time=m.s.minutes;tick(m,120,1);assert.equal(m.s.minutes,time);assert.equal(m.s.x,620);
 m.cancel();tick(m,1);assert.ok(m.s.minutes>time);
});
test('key and wallet actions consume exactly their shown costs and repeated pickup gives nothing extra',()=>{
 const m=new BeforeDeparture();const start=m.s.minutes;prepare(m);assert.ok(Math.abs(m.s.minutes-start-4)<1e-6);
 assert.equal(m.s.hasKey,true);assert.equal(m.s.hasPass,true);assert.equal(m.s.inventory.length,0);
 const before=m.s.minutes;interact(m,'wallet');assert.equal(m.s.minutes,before);assert.equal(m.s.task,null);
});
test('all three replies have visible, deterministic time and waiting-state effects',()=>{
 for(const [reply,cost,state] of [['go',1,'CONFIDENT'],['wait',5,'UNSURE'],['silent',0,'WAITING_1']]){
  const m=new BeforeDeparture({playthrough:2});m.openDialog('message','A');assert.equal(m.reply(reply),true);
  assert.equal(m.s.minutes,CLOCK.start+cost);assert.equal(m.s.aState,state);assert.equal(m.s.dialog,null);
 }
});
test('first journey cannot rewrite the departure, but shows the waiting cost and finishes as a memory',()=>{
 const m=new BeforeDeparture();leave(m,1080);assert.equal(m.s.dialog.type,'original');assert.equal(m.s.leftAt,null);
 m.continueOriginal();finishTask(m);assert.equal(m.s.phase,'result');assert.equal(m.s.outcome,'MISSED');assert.equal(m.s.aState,'LEFT');
 assert.equal(m.complete().flags.youthLeftHome,false);assert.ok(m.s.log.some(entry=>entry.event==='action_start'&&entry.action==='original'));
});
test('every non-first journey can succeed with only key and pass, without optional collecting or a required reply',()=>{
 for(const playthrough of [2,3]){
  const m=new BeforeDeparture({playthrough});leave(m);assert.equal(m.s.area,'landing');
  interact(m,'routes');m.chooseRoute('stairs');finishTask(m);assert.equal(m.s.area,'entrance');
  interact(m,'gate');interact(m,'a');assert.equal(m.s.outcome,'SUCCESS_AT_STATION');assert.equal(m.s.aState,'MET');assert.equal(m.s.inventory.length,0);
 }
});
test('leaving at exactly 19:00 is accepted, leaving after it retains a readable late failure',()=>{
 for(const [time,outcome] of [[1140,'SUCCESS_AT_STATION'],[1140.01,'FAILED_LATE']]){
  const m=new BeforeDeparture({playthrough:2});leave(m,time);assert.equal(m.s.area,'landing');m.s.minutes=1150;interact(m,'a');assert.equal(m.s.outcome,outcome);
 }
});
test('A departure happens only once at 19:30 and interrupts an unfinished costly action',()=>{
 const m=new BeforeDeparture({playthrough:2});m.s.minutes=1169.9;m.beginTask('wait',5);tick(m,2);
 assert.equal(m.s.phase,'result');assert.equal(m.s.outcome,'FAILED_LATE');assert.equal(m.s.task,null);
 const transitions=m.s.log.filter(entry=>entry.event==='A_state'&&entry.to==='LEFT');assert.equal(transitions.length,1);
 tick(m,30);assert.equal(m.s.log.filter(entry=>entry.event==='A_state'&&entry.to==='LEFT').length,1);
});
test('arriving at exactly 19:30 never meets an already departed A',()=>{
 const m=new BeforeDeparture({playthrough:2});leave(m,1140);m.s.minutes=1170;m.updateA();interact(m,'a');assert.equal(m.s.outcome,'FAILED_LATE');
});
test('route ETA and actual cost agree; all three routes have deterministic destinations',()=>{
 for(const id of Object.keys(ROUTES)){
  const m=new BeforeDeparture({playthrough:2});leave(m);interact(m,'routes');const before=m.s.minutes,cost=m.routeCost(id);
  assert.equal(m.routeETA(id),before+cost+(ROUTES[id].onward||0));assert.equal(m.chooseRoute(id),true);finishTask(m);
  assert.ok(Math.abs(m.s.minutes-before-cost)<1e-6);assert.equal(m.s.area,ROUTES[id].target);
 }
});
test('two optional slots cannot replace essential items, and dropping frees a slot without losing the keys',()=>{
 const m=new BeforeDeparture({playthrough:2});prepare(m);
 for(const id of ['photo','notebook']){interact(m,id);finishTask(m);}
 assert.equal(interact(m,'coat'),false);assert.equal(m.s.dialog.type,'inventory');assert.equal(m.s.inventory.length,2);
 m.drop('photo');m.cancel();interact(m,'coat');finishTask(m);assert.deepEqual(m.s.inventory,['notebook','coat']);assert.equal(m.s.hasKey,true);
});
test('repeated optional inspection cannot duplicate rewards and increases hesitation only by its known cost',()=>{
 const m=new BeforeDeparture();interact(m,'photo');finishTask(m);const start=m.s.minutes,h=m.s.hesitation;
 interact(m,'photo');finishTask(m);assert.deepEqual(m.s.inventory,['photo']);assert.deepEqual(m.s.memory,['room_photo']);
 assert.ok(Math.abs(m.s.minutes-start-3)<1e-6);assert.equal(m.s.hesitation,h+3);
});
test('optional items provide their stated value and are never required to leave',()=>{
 const m=new BeforeDeparture({playthrough:2});m.s.inventory=['card','coat'];const h=m.s.hesitation;
 assert.equal(m.routeCost('elevator'),23);m.beginTravel('stairs',18,'entrance');assert.equal(m.s.hesitation,h);
 const first=new BeforeDeparture();first.s.inventory=['card'];assert.equal(first.routeCost('elevator'),26);
});
test('high hesitation slightly slows movement while leaving the player in control; travelling reduces it',()=>{
 const m=new BeforeDeparture({playthrough:2});m.s.hesitation=100;const x=m.s.x;tick(m,1,1);
 assert.ok(m.s.x>x+190);assert.equal(m.s.area,'room');assert.equal(m.s.phase,'explore');
 m.beginTravel('stairs',18,'entrance');tick(m,2);assert.ok(m.s.hesitation<100);
});
test('door and station retries restore coherent time, inventory and A state, not a doomed late attempt',()=>{
 const m=new BeforeDeparture({playthrough:2});leave(m,1080);const doorTime=m.checkpoints.door.minutes;
 interact(m,'routes');m.chooseRoute('stairs');finishTask(m);assert.ok(m.checkpoints.entrance);
 m.s.minutes=1170;m.updateA();m.finish('FAILED_LATE');assert.equal(m.retry(),true);assert.equal(m.s.area,'entrance');assert.equal(m.s.phase,'explore');assert.ok(m.s.minutes<1170);
 m.s.minutes=1170;m.finish('FAILED_LATE');assert.equal(m.retry('door'),true);assert.equal(m.s.minutes,doorTime);assert.equal(m.s.area,'hall');assert.equal(m.s.leftAt,null);assert.equal(m.checkpoints.entrance,undefined);
});
test('save reload resumes a partially completed action and result dialogue; other game and journey saves are ignored',()=>{
 const m=new BeforeDeparture({playthrough:2});interact(m,'key');tick(m,1);
 const restored=new BeforeDeparture({playthrough:2,save:m.snapshot()});assert.equal(restored.s.task.remaining,m.s.task.remaining);finishTask(restored);assert.equal(restored.s.hasKey,true);
 restored.finish('FAILED_LATE');restored.advanceResult();const result=new BeforeDeparture({playthrough:2,save:restored.snapshot()});assert.equal(result.s.resultLine,1);
 assert.equal(new BeforeDeparture({playthrough:1,save:m.snapshot()}).s.task,null);
 assert.equal(new BeforeDeparture({playthrough:2,save:{version:1,revisit:true,phase:'room'}}).s.minutes,CLOCK.start);
});
test('checkpoint memory can retry from the room and full snapshots remain bounded and serializable',()=>{
 const m=new BeforeDeparture({playthrough:2});m.s.memory.push('route_stairs');m.finish('FAILED_LATE');assert.equal(m.retry('room'),true);
 assert.ok(m.s.memory.includes('route_stairs'));assert.equal(m.s.hasKey,false);assert.equal(m.s.minutes,CLOCK.start);
 for(let i=0;i<150;i++)m.log('reading');assert.equal(m.s.log.length,100);assert.ok(JSON.stringify(m.snapshot()).length<50000);
});
test('save failure is reported and malformed snapshots cannot soft-lock the chapter',()=>{
 const m=new BeforeDeparture({onProgress:()=>{throw Error('storage');}});m.commit();assert.equal(m.saved,false);
 const broken=m.snapshot();broken.state.minutes=NaN;assert.equal(new BeforeDeparture({save:broken}).s.minutes,CLOCK.start);
 const badItems=m.snapshot();badItems.state.inventory=['undefined'];assert.equal(new BeforeDeparture({save:badItems}).s.inventory.length,0);
});
test('old chapter-three saves migrate to the new introduction, preserve other chapters and do not unlock the replacement game',()=>{
 const old={...defaults(),scene:'ch3',chapterIndex:2,chapterContentVersions:{},sceneProgress:{scene:'ch3',kind:'game'},minigameSaves:{'quietNight:1':{phase:'arcade'},'shiguang:1':{pieces:[1]}},flags:{quietNightComplete:true,saidFear:true,otherFlag:true}};
 let raw=JSON.stringify(old);const save=new GameSave({getItem:()=>raw,setItem:(_,value)=>raw=value});const m=new GameManager(save);m.initializeStoryTrees(scenes,story);
 assert.equal(m.state.sceneProgress.storyKey,'ch3_departure_w1');assert.equal(m.state.minigameSaves['quietNight:1'],undefined);assert.deepEqual(m.state.minigameSaves['shiguang:1'],{pieces:[1]});
 assert.equal(m.state.flags.otherFlag,true);assert.equal(m.state.flags.saidFear,undefined);
 assert.equal(m.restoreStoryNode(1,'ch3:game'),false);assert.equal(m.restoreStoryNode(1,'ch2:game'),true);
 assert.equal(m.state.minigameSaves['quietNight:1'],undefined);
 const again=new GameManager(save);again.initializeStoryTrees(scenes,story);assert.equal(again.state.scene,'ch2');
});
test('a real new-game checkpoint survives reload and keeps first and later journey snapshots independent',()=>{
 let raw=null;const save=new GameSave({getItem:()=>raw,setItem:(_,value)=>raw=value});const m=new GameManager(save);m.initializeStoryTrees(scenes,story);m.startNewGame();m.go('ch3');m.state.chapterIndex=2;m.saveGameplayPosition();
 const game=new BeforeDeparture();m.saveMinigameProgress('beforeDeparture',game.snapshot());const loaded=new GameManager(save);loaded.initializeStoryTrees(scenes,story);
 assert.equal(loaded.getSceneProgress().kind,'game');assert.equal(loaded.getMinigameSave('beforeDeparture').kind,'before-departure-v1');
 loaded.secondRun();loaded.go('ch3');loaded.state.chapterIndex=2;loaded.saveGameplayPosition();loaded.saveMinigameProgress('beforeDeparture',new BeforeDeparture({playthrough:2}).snapshot());
 assert.equal(loaded.restoreStoryNode(1,'ch3:game'),true);assert.equal(loaded.getMinigameSave('beforeDeparture').revisit,false);
 assert.equal(loaded.restoreStoryNode(2,'ch3:game'),true);assert.equal(loaded.getMinigameSave('beforeDeparture').revisit,true);
});
test('only the visited youth outcome unlocks its tree branch and it restores the correct aftermath',()=>{
 let raw=null;const m=new GameManager(new GameSave({getItem:()=>raw,setItem:(_,value)=>raw=value}));m.initializeStoryTrees(scenes,story);m.startNewGame();m.secondRun();m.go('ch3');m.state.chapterIndex=2;
 m.setFlag('youthOutcome','SUCCESS_AT_STATION');m.saveDialoguePosition('ch3_departure_success',0);
 assert.equal(m.restoreStoryNode(2,'ch3:dialogue:ch3_departure_late:0'),false);
 assert.equal(m.restoreStoryNode(2,'ch3:dialogue:ch3_departure_success:0'),true);assert.equal(m.state.flags.youthOutcome,'SUCCESS_AT_STATION');
});
