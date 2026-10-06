import Phaser from 'phaser';
import {mountShiguang} from '../minigames/shiguang/index.js';
import {mountNumberHero} from '../minigames/number-hero/index.js';
import {getMinigame} from '../minigames/index.js';
import {mountMemoryPuzzle} from '../minigames/memory-puzzle/index.js';
export class ChapterScene extends Phaser.Scene{
 constructor(){super('chapter');}
 preload(){const {asset}=this.game.registry.get('chapter');if(asset)this.load.image('chapter-background',`${import.meta.env.BASE_URL}${asset.src}`);}
 create(){const {config,minigame,onComplete,onAchievement,bridge}=this.game.registry.get('chapter');this.cameras.main.setBackgroundColor('#1a2333');if(this.textures.exists('chapter-background'))this.add.image(640,360,'chapter-background').setDisplaySize(1280,720);this.activeGame=getMinigame(minigame).create(this,config,onComplete,{onAchievement});bridge.move=(dx,dy)=>this.activeGame?.move?.(dx,dy);this.events.once('shutdown',()=>{this.activeGame?.destroy();bridge.move=null;});}
}
export function mountGame(parent,chapter){if(chapter.minigame==='numberHero')return mountNumberHero(document.getElementById(parent),chapter);if(chapter.minigame==='shiguang')return mountShiguang(document.getElementById(parent),chapter);if(chapter.minigame==='memoryPuzzle')return mountMemoryPuzzle(document.getElementById(parent),chapter);return new Phaser.Game({type:Phaser.AUTO,parent,width:1280,height:720,backgroundColor:'#1a2333',scale:{mode:Phaser.Scale.NONE},scene:[ChapterScene],callbacks:{preBoot:game=>game.registry.set('chapter',chapter)},audio:{noAudio:true},render:{antialias:true}});}
