import {mountMemoryPuzzle} from '../src/minigames/memory-puzzle/index.js';
const key='memoryPuzzle.v1.local.memory-lane.first';
let save=null;
try{const raw=localStorage.getItem(key);if(raw!==null){try{save=JSON.parse(raw);}catch{save=raw;}}}catch{}
mountMemoryPuzzle(document.getElementById('game'),{
 context:{playthrough:1},save,
 onProgress(snapshot){try{localStorage.setItem(key,JSON.stringify(snapshot));return true;}catch{return false;}},
 onComplete(){document.getElementById('status').textContent='本关已完成。';}
});
