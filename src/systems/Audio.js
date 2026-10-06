export function resolveBgm(config,scene,baseUrl='./'){
  const path=config?.scenes?.[scene]??config?.default;
  return path?baseUrl+path.replace(/^\/+/, ''):null;
}

const SFX={
  select:{path:'assets/audio/sfx-select.mp3',volume:.32,cooldown:220},
  confirm:{path:'assets/audio/sfx-confirm.mp3',volume:.4,cooldown:300},
  memory:{path:'assets/audio/sfx-memory.mp3',volume:.48,cooldown:900},
};

export class AudioManager {
  constructor({bgmVolume=.8,sfxVolume=.8,baseUrl='./',createAudio=()=>new Audio()}={}){
    this.bgm=createAudio();
    this.bgm.loop=true;
    this.bgm.preload='metadata';
    this.baseUrl=baseUrl;
    this.createAudio=createAudio;
    this.sfxPlayers=new Map();
    this.sfxPlayedAt=new Map();
    this.unlocked=false;
    this.currentTrack=null;
    this.setBgmVolume(bgmVolume);
    this.setSfxVolume(sfxVolume);
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
  playSfx(name,{volume=1}={}){
    const sound=SFX[name];
    if(!sound||!this.unlocked||this.sfxVolume<=0)return false;
    const now=globalThis.performance?.now?.()??Date.now(),last=this.sfxPlayedAt.get(name)??-Infinity;
    if(now-last<sound.cooldown)return false;
    for(const [otherName,otherPlayer] of this.sfxPlayers)if(otherName!==name)otherPlayer.pause();
    let player=this.sfxPlayers.get(name);
    if(!player){player=this.createAudio();player.preload='auto';player.src=this.baseUrl+sound.path;this.sfxPlayers.set(name,player);}
    player.volume=Math.min(1,Math.max(0,this.sfxVolume*sound.volume*volume));
    try{player.currentTime=0;}catch{}
    this.sfxPlayedAt.set(name,now);
    player.play()?.catch(()=>{});
    return true;
  }
  setSfxVolume(value){const volume=Number(value);this.sfxVolume=Number.isFinite(volume)?Math.min(1,Math.max(0,volume)):.8;}
  stopAll(){this.bgm.pause();this.bgm.removeAttribute('src');this.currentTrack=null;for(const player of this.sfxPlayers.values())player.pause();}
}
