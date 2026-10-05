import {defaults} from './GameSave.js';
export class GameManager {
 constructor(save){this.save=save;this.state=save.load()||defaults();this.events=new Map();}
 on(event,cb){if(!this.events.has(event))this.events.set(event,new Set());this.events.get(event).add(cb);return ()=>this.events.get(event).delete(cb);}
 emit(event){this.events.get(event)?.forEach(cb=>cb(this.state));}
 persist(){this.save.save(this.state);this.emit('change');}
 startNewGame(){const settings=this.state.settings;this.save.reset();this.state={...defaults(),settings};this.persist();}
 setFlag(k,v){this.state.flags[k]=v;this.persist();}
 go(scene){this.state.scene=scene;this.persist();}
 advanceChapter(){if(this.state.chapterIndex<3){this.state.chapterIndex++;this.go('ch'+(this.state.chapterIndex+1));}else this.go(this.state.playthrough===1?'interlude':'ending_select');return this.state.scene;}
 secondRun(){this.state.playthrough=2;this.state.chapterIndex=0;this.go('ch1');}
 ending(id){if(!this.state.unlockedEndings.includes(id))this.state.unlockedEndings.push(id);this.state.flags.ending=id;if(id==='BE')this.secondRun();else this.go('ending');}
}
