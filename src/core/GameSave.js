const key='zlyc_save_v1';
export const defaults=()=>({version:1,playthrough:1,chapterIndex:0,scene:'prologue',sceneProgress:null,minigameSaves:{},flags:{},unlockedEndings:[],settings:{bgmVolume:.8,sfxVolume:.8}});
export class GameSave {
  constructor(storage=globalThis.localStorage){this.storage=storage;this.memory=null;}
  load(){try{const raw=this.storage?.getItem(key);if(raw){const s=JSON.parse(raw);if(s.version===1&&[1,2].includes(s.playthrough)&&Number.isInteger(s.chapterIndex)&&s.chapterIndex>=0&&s.chapterIndex<=3&&Array.isArray(s.unlockedEndings))return {...defaults(),...s};}}catch{}return this.memory;}
  save(s){this.memory=JSON.parse(JSON.stringify(s));try{if(!this.storage?.setItem)return false;this.storage.setItem(key,JSON.stringify(s));return true;}catch{return false;} }
  reset(){this.memory=null;try{this.storage?.removeItem(key);}catch{}}
}
