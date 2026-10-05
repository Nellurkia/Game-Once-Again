export function resolveBgm(config,scene,baseUrl='./'){
  const path=config?.scenes?.[scene]??config?.default;
  return path?baseUrl+path.replace(/^\/+/, ''):null;
}

export class AudioManager {
  constructor({bgmVolume=.8,createAudio=()=>new Audio()}={}){
    this.bgm=createAudio();
    this.bgm.loop=true;
    this.bgm.preload='metadata';
    this.unlocked=false;
    this.currentTrack=null;
    this.setBgmVolume(bgmVolume);
  }
  playBgm(src){
    if(!src){this.stopAll();return;}
    if(src!==this.currentTrack){
      this.bgm.pause();
      this.bgm.src=src;
      this.currentTrack=src;
    }
    this.resume();
  }
  unlock(){this.unlocked=true;this.resume();}
  resume(){
    if(!this.unlocked||!this.currentTrack||!this.bgm.paused)return;
    // Browsers may reject playback until a valid user gesture. Retry on the next interaction.
    this.bgm.play()?.catch(()=>{});
  }
  setBgmVolume(value){
    const volume=Number(value);
    this.bgm.volume=Number.isFinite(volume)?Math.min(1,Math.max(0,volume)):.8;
  }
  playSfx(){} // Reserved for later sound-effect assets.
  stopAll(){this.bgm.pause();this.bgm.removeAttribute('src');this.currentTrack=null;}
}
