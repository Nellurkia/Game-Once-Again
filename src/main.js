import './style.css';
import {GameSave} from './core/GameSave.js';
import {GameManager} from './core/GameManager.js';
import {transition} from './core/Transition.js';
import {loadData} from './systems/Assets.js';
import {Dialogue} from './systems/Dialogue.js';
import {AudioManager,resolveBgm} from './systems/Audio.js';
import {illustration,narrativeIllustration,menuIllustration,narrativePortrait} from './systems/Illustrations.js';
import titleBackground from './assets/title_main_room.png';
import {mountGame} from './scenes/ChapterScene.js';
import './minigames/pacman/index.js';
import './minigames/survivors/index.js';


let storage;try{storage=window.localStorage;}catch{storage=null;}
const save=new GameSave(storage),manager=new GameManager(save);let data,game,dialogue,busy=false;const bridge={};
const audio=new AudioManager({bgmVolume:manager.state.settings.bgmVolume});
document.addEventListener('pointerdown',()=>audio.unlock(),{capture:true});
document.addEventListener('keydown',()=>audio.unlock(),{capture:true});
const icons={sound:'<path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',settings:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/>',expand:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',book:'<path d="M4 4h6l2 2 2-2h6v15h-6l-2 2-2-2H4V4Zm8 2v15"/>',restart:'<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>'};
const icon=id=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[id]||icons.arrow}</svg>`;
document.getElementById('app').innerHTML=`<main class="game-frame" aria-label="再来一次 · 游戏主界面"><div id="screen"></div><div id="curtain"><span></span></div><nav class="game-controls" aria-label="游戏菜单"><button id="brand" aria-label="返回标题" title="返回标题">⌂</button><button id="about" aria-label="游戏说明" title="游戏说明">?</button><button id="settings" aria-label="设置" title="设置">${icon('settings')}</button><button id="fullscreen" aria-label="全屏" title="全屏">${icon('expand')}</button></nav></main><dialog id="modal"><div id="modal-content"></div><button id="close-modal" class="modal-close" aria-label="关闭">×</button></dialog>`;
function fitGame(){const scale=Math.min(window.innerWidth/1280,window.innerHeight/720);document.documentElement.style.setProperty('--game-scale',String(scale));}
window.addEventListener('resize',fitGame);
document.addEventListener('fullscreenchange',fitGame);
fitGame();
const screen=document.getElementById('screen');
function stop(){dialogue?.destroy();dialogue=null;game?.destroy(true);game=null;}
function modal(content){document.getElementById('modal-content').innerHTML=content;document.getElementById('modal').showModal();}
function closeModal(){document.getElementById('modal').close();}
document.getElementById('close-modal').onclick=closeModal;
document.getElementById('modal').onclick=e=>{if(e.target.id==='modal')closeModal();};
function about(){modal(`<span class="eyebrow">ABOUT THE JOURNEY</span><h2>如果人生，可以再来一次。</h2><p>暮年的你在旧游戏机中，重新走进那些未曾忘记的记忆。第一次学会逃避，第二次试着面对。</p><p>这是《再来一次》的第一阶段框架预览。童年迷宫、少年夜庭生存战、第三幕《不要出声》和老年回忆拼图均可游玩。剧情以 {TBD} 标记，背景音乐已加入，章节独立配乐和音效待补充。</p><div class="modal-note">方向键 / WASD：移动<br>空格 / 点击：推进对话<br>所有进度只保存在当前浏览器。</div><p class="muted">主题：暮 · MoBiUs 2026 游戏开发挑战赛</p>`);}
document.getElementById('about').onclick=about;
function settings(){modal(`<span class="eyebrow">PREFERENCES</span><h2>给旅程一点留白。</h2><p>背景音乐已开启，会循环播放。可拖动滑块调整音量，设为 0 即可静音。游戏音效将在后续加入。</p><label class="range-label">背景音乐 <input id="bgm" type="range" min="0" max="1" step=".05" value="${manager.state.settings.bgmVolume}"></label><label class="range-label">游戏音效 <input id="sfx" type="range" min="0" max="1" step=".05" value="${manager.state.settings.sfxVolume}"></label><button class="secondary full" id="erase">清除本地存档</button><p class="muted">清除后将从序章重新开始。</p>`);for(const [id,key] of [['bgm','bgmVolume'],['sfx','sfxVolume']])document.getElementById(id).oninput=e=>{manager.state.settings[key]=Number(e.target.value);if(key==='bgmVolume')audio.setBgmVolume(manager.state.settings[key]);if(save.load())manager.persist();};document.getElementById('erase').onclick=()=>{modal('<h2>清除这份存档？</h2><p>章节进度和已解锁结局将被移除。</p><button class="primary full" id="confirm-erase">确认清除</button>');document.getElementById('confirm-erase').onclick=()=>{save.reset();manager.state.flags={};manager.state.unlockedEndings=[];manager.state.chapterIndex=0;manager.state.playthrough=1;manager.state.scene='prologue';manager.state.sceneProgress=null;manager.state.minigameSaves={};closeModal();render('title');};};}
document.getElementById('settings').onclick=settings;
function staff(){modal(`<span class="eyebrow">THE PEOPLE BEHIND THE STORY</span><h2>制作人员</h2><p>《再来一次》 · MoBiUs 2026 游戏开发挑战赛</p><div class="staff-list"><span>策划 / 文案</span><b>待补充</b><span>程序 / 开发</span><b>待补充</b><span>美术 / 音乐</span><b>待补充</b></div><p class="muted">感谢你陪这段旧时光，再走一遍。</p>`);}
document.getElementById('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{modal('<h2>全屏暂不可用</h2><p>可在浏览器窗口中继续游玩。</p>');}};
document.getElementById('brand').onclick=e=>{e.preventDefault();if(!busy)render('title');};
async function navigate(id,title,resume=false){if(busy)return;busy=true;await transition(title||data.scenes.find(s=>s.id===id)?.title||'再来一次',()=>{manager.go(id,{resume});render(id);});busy=false;}
function start(resume){if(busy)return;if(resume){const saved=save.load();if(!saved)return;manager.state=saved;audio.setBgmVolume(saved.settings.bgmVolume);}else manager.startNewGame();navigate(manager.state.scene,undefined,resume);}
function render(id){stop();audio.playBgm(resolveBgm(data.music,id,import.meta.env.BASE_URL));if(id==='title')title();else if(id==='prologue')narrative('序章 · 暮色中的房间','prologue',()=>{manager.state.chapterIndex=0;navigate('ch1');});else if(/^ch[1-4]$/.test(id))chapter(id);else if(id==='interlude')interlude();else if(id==='ending_select')endings();else if(id==='ending')narrative(manager.state.flags.ending==='TE'?'真正的结局 · 与自己和解':'普通结局 · 此刻的人生',data.story[manager.state.flags.ending]?manager.state.flags.ending:'NE',()=>navigate('credits'));else if(id==='credits')credits();else title();}
function title(){const saved=save.load();screen.innerHTML=`<section class="title-scene" style="--title-art:url('${titleBackground}')" aria-label="暖灯下的旧掌机与回忆"><div class="title-art"></div><div class="title-shade"></div><div class="title-wordmark"><span>再来一次</span><small>ONCE AGAIN · 一段关于人生的慢旅程</small></div><div class="console-menu" aria-label="掌机菜单"><button id="console-continue" ${saved?'':'disabled'}>继续旧存档</button><button id="console-new">开始新游戏</button><button id="console-settings">设置</button></div><nav class="table-menu" aria-label="主菜单"><button class="table-action" id="start">${menuIllustration('button',0)}${menuIllustration('icon',0)}<span>开始新游戏</span></button><button class="table-action" id="continue" ${saved?'':'disabled'}>${menuIllustration('button',1)}${menuIllustration('icon',1)}<span>继续旧存档</span></button><button class="table-action" id="title-settings">${menuIllustration('button',2)}${menuIllustration('icon',2)}<span>设置</span></button><button class="table-action" id="title-staff">${menuIllustration('button',3)}${menuIllustration('icon',3)}<span>制作人员</span></button></nav><div class="room-dust" aria-hidden="true"></div></section>`;const newGame=()=>{if(saved){modal('<h2>开启一段新的旅程？</h2><p>这会替换当前章节进度与结局记录。</p><button class="primary full" id="new-confirm">重新开始 →</button>');document.getElementById('new-confirm').onclick=()=>{closeModal();start(false);};}else start(false);};document.getElementById('start').onclick=newGame;document.getElementById('console-new').onclick=newGame;document.getElementById('continue').onclick=()=>start(true);document.getElementById('console-continue').onclick=()=>start(true);document.getElementById('title-settings').onclick=settings;document.getElementById('console-settings').onclick=settings;document.getElementById('title-staff').onclick=staff;}
function narrative(heading,storyKey,done){
 const lines=data.story[storyKey];
 screen.innerHTML=`<div class="narrative-scene"><div class="narrative-room"><img id="narrative-art" class="narrative-illustration" alt="回忆插图"></div><div class="scene-heading"><span class="eyebrow">A MEMORY RETURNS</span><h2>${heading}</h2></div>${narrativePortrait(manager.state)}<div class="dialogue-box" id="dialogue"></div></div>`;
 dialogue=new Dialogue(document.getElementById('dialogue'),lines,done,(k,v)=>manager.setFlag(k,v),{
  startIndex:manager.dialogueIndex(storyKey,lines.length),
  onProgress:index=>{document.getElementById("narrative-art").src=illustration(narrativeIllustration(storyKey,index,manager.state));manager.saveDialoguePosition(storyKey,index);}
 });
}
function chapter(id){
 const c=data.scenes.find(s=>s.id===id);
 manager.state.chapterIndex=Number(id.slice(2))-1;
 const config=c[manager.state.playthrough===1?'week1':'week2'];
 const progress=manager.getSceneProgress();
 const outro=()=>narrative(c.title+' · 尾声','outro',()=>{const next=manager.advanceChapter();navigate(next);});
 const play=()=>{
  dialogue=null;
  manager.saveGameplayPosition();
  screen.innerHTML=`<div class="play-scene ${c.minigame==='survivors'?'survivor-scene':['memoryPuzzle','shiguang','quietNight'].includes(c.minigame)?'memory-puzzle-scene':''}"><div class="play-header"><span>${c.title}</span><span>${manager.state.playthrough===2?'NEW GAME +':'FIRST JOURNEY'} <i> / </i> ${c.minigame==='pacman'?'记忆迷宫':c.minigame==='survivors'?'夜庭幸存者':'章节预览'}</span></div><div id="phaser-host"></div><div class="dpad"><button data-dir="0,-1" aria-label="向上">↑</button><button data-dir="-1,0" aria-label="向左">←</button><button data-dir="0,1" aria-label="向下">↓</button><button data-dir="1,0" aria-label="向右">→</button></div></div>`;
  const onComplete=result=>{
   Object.entries(result.flags||{}).forEach(([k,v])=>manager.setFlag(k,v));
   setTimeout(()=>{if(!document.getElementById('phaser-host'))return;game?.destroy(true);game=null;outro();},100);
  };
  const playthrough=manager.state.playthrough;
  game=mountGame('phaser-host',{config,minigame:c.minigame,asset:data.manifest.find(a=>a.id===c.asset),onComplete,bridge,context:{playthrough},save:manager.getMinigameSave(c.minigame),onProgress:snapshot=>manager.state.scene===id&&manager.state.playthrough===playthrough?manager.saveMinigameProgress(c.minigame,snapshot):false});
  document.querySelectorAll('[data-dir]').forEach(b=>b.onclick=()=>bridge.move?.(...b.dataset.dir.split(',').map(Number)));
 };
 if(progress?.kind==='game')play();
 else if(progress?.kind==='dialogue'&&progress.storyKey==='outro')outro();
 else narrative(c.title,config.dialogueKey,play);
}
function interlude(){screen.innerHTML=`<div class="center-scene illustrated-center" style="--scene-art:url('${illustration("E2-new-game-plus.png")}')"><div class="orbit">∞</div><span class="eyebrow">FIRST JOURNEY COMPLETE</span><h2>那些遗憾，<br>还有另一个答案。</h2><p>你已经走过四段人生。<br>再走一次相同的路，这一次，试着做出不同的选择。</p><button class="primary" id="ng">再来一次 <span>NEW GAME + →</span></button><span class="small-note">二周目已解锁 · 相同的记忆，不同的目标</span></div>`;document.getElementById('ng').onclick=()=>{manager.secondRun();navigate('ch1');};}
function endings(){screen.innerHTML=`<div class="endings-scene illustrated-center" style="--scene-art:url('${illustration("E1-save-menu.png")}')"><span class="eyebrow">THE LAST SAVE</span><h2>这一次，你想留下些什么？</h2><p>没有完美的存档。只有属于你的人生。</p><div class="ending-options"><button data-ending="NE"><span>01 / 留下</span><strong>珍惜此刻的人生</strong><small>SAVE CURRENT LIFE</small><p>保存这段新的人生，继续向前。</p>${icon('arrow')}</button><button data-ending="TE"><span>02 / 和解</span><strong>接纳最初的自己</strong><small>RESTORE ORIGINAL SAVE</small><p>回到原本的生活，与过去和解。</p>${icon('arrow')}</button><button data-ending="BE"><span>03 / 重来</span><strong>再试一次，也许……</strong><small>NEW GAME +</small><p>重新进入循环，寻找另一个答案。</p>${icon('arrow')}</button></div></div>`;document.querySelectorAll('[data-ending]').forEach(b=>b.onclick=()=>{manager.ending(b.dataset.ending);navigate(manager.state.scene,b.dataset.ending==='BE'?'未完的循环 · 再来一次':'保存这份人生');});}
function credits(){screen.innerHTML=`<div class="center-scene credits illustrated-center" style="--scene-art:url('${illustration("E5-phone-final.png")}')"><span class="tiny-star">✦</span><span class="eyebrow">THANK YOU FOR PLAYING</span><h2>人生不必重来。<br>此刻，就很好。</h2><p>《再来一次》 · MoBiUs 2026<br>一场关于暮色与和解的交互叙事</p><div class="ending-badge">已解锁 ${manager.state.unlockedEndings.length} / 3 个结局 · ${manager.state.flags.ending==='TE'?'与自己和解':'此刻的人生'}</div><button class="primary" id="back-title">回到故事的起点 ${icon('arrow')}</button></div>`;document.getElementById('back-title').onclick=()=>render('title');}
loadData().then(loaded=>{data=loaded;render('title');}).catch(error=>{screen.innerHTML='<div class="center-scene"><h2>故事暂时未能载入</h2><p>请刷新页面再试一次。</p></div>';console.error(error);});
