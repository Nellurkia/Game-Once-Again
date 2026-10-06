import './style.css';
import {GameSave} from './core/GameSave.js';
import {GameManager} from './core/GameManager.js';
import {AchievementStore} from './core/Achievements.js';
import {chapterAfterGameKeys} from './core/ChapterContent.js';
import {achievementHomeMarkup,achievementDialogMarkup,notifyAchievement} from './systems/AchievementView.js';
import {transition} from './core/Transition.js';
import {loadData} from './systems/Assets.js';
import {Dialogue} from './systems/Dialogue.js';
import {mountStoryTree} from './systems/StoryTreeView.js';
import {AudioManager,resolveBgm} from './systems/Audio.js';
import {illustration,narrativeIllustration,menuIllustration,narrativePortrait} from './systems/Illustrations.js';
import titleBackground from './assets/title_main_room.png';
import {mountGame} from './scenes/ChapterScene.js';
import './minigames/survivors/index.js';


let storage;try{storage=window.localStorage;}catch{storage=null;}
const save=new GameSave(storage),manager=new GameManager(save);let data,game,dialogue,busy=false;const bridge={};
const achievements=new AchievementStore(storage);
achievements.onUnlock(item=>{notifyAchievement(item);const home=document.querySelector('.title-achievements');if(home)home.outerHTML=achievementHomeMarkup(achievements);});
const audio=new AudioManager({bgmVolume:manager.state.settings.bgmVolume,sfxVolume:manager.state.settings.sfxVolume,baseUrl:import.meta.env.BASE_URL});
window.playGameSfx=(name,options)=>{audio.unlock();return audio.playSfx(name,options);};
document.addEventListener('pointerdown',()=>audio.unlock(),{capture:true});
document.addEventListener('keydown',()=>audio.unlock(),{capture:true});
document.addEventListener('click',event=>{const button=event.target.closest('[data-sfx]');if(button&&!button.disabled)audio.playSfx(button.dataset.sfx);},true);
document.addEventListener('click',event=>{if(event.target.closest('[data-achievements]')){modal(achievementDialogMarkup(achievements));document.getElementById('modal').classList.add('achievements-modal');}});
const icons={sound:'<path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',settings:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/>',expand:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',book:'<path d="M4 4h6l2 2 2-2h6v15h-6l-2 2-2-2H4V4Zm8 2v15"/>',restart:'<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>'};
const icon=id=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[id]||icons.arrow}</svg>`;
document.getElementById('app').innerHTML=`<main class="game-frame" aria-label="再来一次 · 游戏主界面"><div id="screen"></div><div id="curtain"><span></span></div><nav class="game-controls" aria-label="游戏菜单"><button id="brand" data-sfx="select" aria-label="返回标题" title="返回标题">⌂</button><button id="about" data-sfx="select" aria-label="游戏说明" title="游戏说明">?</button><button id="settings" data-sfx="select" aria-label="设置" title="设置">${icon('settings')}</button><button id="fullscreen" data-sfx="select" aria-label="全屏 / 横屏" title="全屏 / 横屏">${icon('expand')}</button></nav></main><aside id="orientation-hint" aria-live="polite"><span id="orientation-message">请横屏游玩，游戏画面会完整适配屏幕。</span><button id="orientation-retry" data-sfx="select">尝试锁定横屏</button></aside><dialog id="modal"><div id="modal-content"></div><button id="close-modal" data-sfx="select" class="modal-close" aria-label="关闭">×</button></dialog>`;
const portraitQuery=window.matchMedia('(orientation: portrait)');
const touchQuery=window.matchMedia('(pointer: coarse)');
const orientationMessage=document.getElementById('orientation-message');
function fitGame(){const viewport=window.visualViewport,width=viewport?.width||document.documentElement.clientWidth||window.innerWidth,height=viewport?.height||document.documentElement.clientHeight||window.innerHeight;const scale=Math.min(width/1280,height/720);document.documentElement.style.setProperty('--game-scale',String(scale));document.body.classList.toggle('mobile-portrait',portraitQuery.matches&&touchQuery.matches);}
async function enterLandscape(){const target=document.getElementById('app');try{if(!document.fullscreenElement){if(!target.requestFullscreen)throw new Error('fullscreen unavailable');await target.requestFullscreen();}const orientation=window.screen.orientation;if(typeof orientation?.lock==='function'){try{await orientation.lock('landscape');orientationMessage.textContent='已切换横屏。若画面尚未转向，请旋转设备。';}catch{orientationMessage.textContent='请旋转手机横屏，游戏会完整适配屏幕。';}}else orientationMessage.textContent='请旋转手机横屏，游戏会完整适配屏幕。';}catch{orientationMessage.textContent='浏览器未能锁定横屏，请手动旋转手机；游戏画面仍会完整显示。';}fitGame();}
window.addEventListener('resize',fitGame);
window.visualViewport?.addEventListener('resize',fitGame);
window.addEventListener('orientationchange',fitGame);
for(const query of [portraitQuery,touchQuery]){if(query.addEventListener)query.addEventListener('change',fitGame);else query.addListener?.(fitGame);}
document.addEventListener('fullscreenchange',()=>{fitGame();if(!document.fullscreenElement)try{window.screen.orientation?.unlock?.();}catch{}});
fitGame();
const screen=document.getElementById('screen');
function stop(){dialogue?.destroy();dialogue=null;game?.destroy(true);game=null;}
function modal(content){document.getElementById('modal').classList.remove('achievements-modal','staff-modal');document.getElementById('modal-content').innerHTML=content;document.getElementById('modal').showModal();}
function closeModal(){document.getElementById('modal').close();}
document.getElementById('close-modal').onclick=closeModal;
document.getElementById('modal').onclick=e=>{if(e.target.id==='modal')closeModal();};
function about(){modal(`<span class="eyebrow">ABOUT THE JOURNEY</span><h2>如果人生，可以再来一次。</h2><p>暮年的你在旧游戏机中，重新走进那些未曾忘记的记忆。第一次学会逃避，第二次试着面对。</p><p>这是《再来一次》的第一阶段框架预览。童年数字勇者、少年夜庭生存战、青年最后一班车、老年回忆拼图均可游玩。剧情已按完整剧本接入；背景音乐与克制的菜单、选择和回忆完成音效已加入。</p><div class="modal-note">方向键 / WASD：移动<br>空格 / 点击：推进对话<br>所有进度只保存在当前浏览器。</div><p class="muted">主题：暮 · MoBiUs 2026 游戏开发挑战赛</p>`);}
document.getElementById('about').onclick=about;
function settings(){modal(`<span class="eyebrow">PREFERENCES</span><h2>给旅程一点留白。</h2><p>背景音乐与轻柔按键音可分别调节；按键音只在菜单、剧情选择和重要记忆完成时播放。</p><label class="range-label">背景音乐 <input id="bgm" type="range" min="0" max="1" step=".05" value="${manager.state.settings.bgmVolume}"></label><label class="range-label">按键音 <input id="sfx" type="range" min="0" max="1" step=".05" value="${manager.state.settings.sfxVolume}"></label><button class="secondary full" id="erase" data-sfx="select">清除本地存档</button><p class="muted">清除后将从序章重新开始。</p>`);for(const [id,key] of [['bgm','bgmVolume'],['sfx','sfxVolume']])document.getElementById(id).oninput=e=>{manager.state.settings[key]=Number(e.target.value);if(key==='bgmVolume')audio.setBgmVolume(manager.state.settings[key]);else audio.setSfxVolume(manager.state.settings[key]);if(save.load())manager.persist();};document.getElementById('erase').onclick=()=>{modal('<h2>清除这份存档？</h2><p>章节进度和已解锁结局将被移除。</p><button class="primary full" id="confirm-erase" data-sfx="confirm">确认清除</button>');document.getElementById('confirm-erase').onclick=()=>{manager.clearSavedGame();closeModal();render('title');};};}
document.getElementById('settings').onclick=settings;
function productionCredits(){return `<div class="production-credits"><p class="production-title">《再来一次·“暮”然回首》 · MoBiUs 2026 游戏开发挑战赛作品</p><section><h3>制作</h3><p>何洋帆　雷远波　杨洪玥　余越　左钰洁</p></section><section><h3>音乐鸣谢（部分）</h3><p>Music: Cute &amp; Silly RPG Music Pack<br>Author: chajamakesmusic<br>License: Creative Commons Attribution 4.0 International (CC BY 4.0)<br>Source: <a href="https://shturl.cc/8P6P5SgylUoJzLuTge1ttyAr0v71zJX55v1aCt4VYk4EoPLMC3V" target="_blank" rel="noopener noreferrer">shturl.cc/8P6P5SgylUoJzLuTge1ttyAr0v71zJX55v1aCt4VYk4EoPLMC3V</a></p></section><section><h3>美术鸣谢</h3><p>Kimi</p></section><section><h3>程序鸣谢</h3><p>ChatGPT、DeepSeek</p></section></div>`;}
function staff(){modal(`<span class="eyebrow">THE PEOPLE BEHIND THE STORY</span><h2>制作人员</h2>${productionCredits()}`);document.getElementById('modal').classList.add('staff-modal');}
document.getElementById('fullscreen').onclick=async()=>{if(document.fullscreenElement){await document.exitFullscreen();return;}await enterLandscape();};
document.getElementById('orientation-retry').onclick=enterLandscape;
document.getElementById('brand').onclick=e=>{e.preventDefault();if(!busy)render('title');};
async function navigate(id,title,resume=false){if(busy)return;busy=true;await transition(title||data.scenes.find(s=>s.id===id)?.title||'再来一次',()=>{manager.go(id,{resume});render(id);});busy=false;}
function start(resume){if(busy)return;if(touchQuery.matches)enterLandscape();if(resume){const saved=save.load();if(!saved)return;manager.state=saved;audio.setBgmVolume(saved.settings.bgmVolume);storyTree();return;}if(manager.state.playthrough===1&&manager.state.flags.firstJourneyComplete){manager.secondRun();navigate('ch1','这一次');return;}manager.startNewGame();navigate(manager.state.scene);}
function storyTree(){stop();mountStoryTree(screen,{manager,scenes:data.scenes,story:data.story,onClose:()=>render('title'),onSelect:(playthrough,id,title)=>{if(busy||!manager.restoreStoryNode(playthrough,id))return;audio.setBgmVolume(manager.state.settings.bgmVolume);navigate(manager.state.scene,title,true);}});}
function render(id){stop();audio.playBgm(resolveBgm(data.music,id,import.meta.env.BASE_URL));if(id==='title')title();else if(id==='prologue')narrative(data.story.sectionTitles.prologue,'prologue',()=>{manager.state.chapterIndex=0;navigate('ch1');});else if(/^ch[1-4]$/.test(id))chapter(id);else if(id==='interlude')interlude();else if(id==='ending_select')endings();else if(id==='ending')endingSequence();else if(id==='credits')credits();else title();}
function title(){
 const saved=save.load(),newJourney=saved&&manager.state.playthrough===1&&manager.state.flags.firstJourneyComplete,startLabel=newJourney?'再來一次':'開始新遊戲';
 screen.innerHTML=`<section class="title-scene${newJourney?' new-journey':''}" style="--title-art:url('${titleBackground}')" aria-label="暖灯下的旧掌机与回忆"><div class="title-art"></div><div class="title-shade"></div><div class="title-wordmark"><span>再来一次</span><small>Once Again</small><strong>“暮”然回首 <i>Look Back</i></strong></div><div class="console-menu" aria-label="掌机菜单"><button id="console-continue" data-sfx="confirm" ${saved?'':'disabled'}>继续旧存档</button><button id="console-new" data-sfx="confirm">${startLabel}</button><button id="console-settings" data-sfx="select">设置</button></div><nav class="table-menu" aria-label="主菜单"><button class="table-action" id="start" data-sfx="confirm">${menuIllustration('button',0)}${menuIllustration('icon',0)}<span>${startLabel}</span></button><button class="table-action" id="continue" data-sfx="confirm" ${saved?'':'disabled'}>${menuIllustration('button',1)}${menuIllustration('icon',1)}<span>继续旧存档</span></button><button class="table-action" id="title-settings" data-sfx="select">${menuIllustration('button',2)}${menuIllustration('icon',2)}<span>设置</span></button><button class="table-action" id="title-staff" data-sfx="select">${menuIllustration('button',3)}${menuIllustration('icon',3)}<span>制作人员</span></button></nav><div class="room-dust" aria-hidden="true"></div></section>`;
 const newGame=()=>{if(newJourney){start(false);return;}if(saved){modal('<h2>开启一段新的旅程？</h2><p>这会替换当前章节进度与结局记录。</p><button class="primary full" id="new-confirm">重新开始 →</button>');document.getElementById('new-confirm').onclick=()=>{closeModal();start(false);};}else start(false);};
 screen.querySelector('.title-scene').insertAdjacentHTML('beforeend',achievementHomeMarkup(achievements));
 document.getElementById('start').onclick=newGame;document.getElementById('console-new').onclick=newGame;document.getElementById('continue').onclick=()=>start(true);document.getElementById('console-continue').onclick=()=>start(true);document.getElementById('title-settings').onclick=settings;document.getElementById('console-settings').onclick=settings;document.getElementById('title-staff').onclick=staff;
}
function narrative(heading,storyKey,done){
 const lines=data.story[storyKey];
 const effect=['p1_13','p1_14','p2_18','E-B-01','E-B-02','E-B-03','E-A-01','E-A-02','E-A-03','E-T-01','E-T-02','E-T-03'].includes(storyKey)?`script-${storyKey.toLowerCase().replaceAll('_','-')}`:'';
 screen.innerHTML=`<div class="narrative-scene ${effect}" aria-label="剧情画面，点击任意空白位置或按空格继续"><div class="narrative-room"><img id="narrative-art" class="narrative-illustration" alt="回忆插图"></div><div class="scene-heading"><span class="eyebrow">A MEMORY RETURNS</span><h2>${heading}</h2></div>${narrativePortrait(manager.state)}<div class="dialogue-box" id="dialogue"></div><span class="narrative-advance-hint">点击任意处 / 空格继续</span></div>`;
 dialogue=new Dialogue(document.getElementById('dialogue'),lines,done,(k,v)=>manager.setFlag(k,v),{
  startIndex:manager.dialogueIndex(storyKey,lines.length),
  onProgress:index=>{const scene=document.querySelector('.narrative-scene');if(scene)scene.dataset.scriptLine=String(index);document.getElementById("narrative-art").src=illustration(narrativeIllustration(storyKey,index,manager.state));manager.saveDialoguePosition(storyKey,index);}
 });
}
function scriptSequence(keys,done,index=0){
 if(index>=keys.length){done();return;}
 const key=keys[index];
 narrative(data.story.sectionTitles?.[key]||'记忆',key,()=>scriptSequence(keys,done,index+1));
}
function chapter(id){
 const c=data.scenes.find(s=>s.id===id);
 manager.state.chapterIndex=Number(id.slice(2))-1;
 const config=c[manager.state.playthrough===1?'week1':'week2'];
 const progress=manager.getSceneProgress();
 const introKeys=config.dialogueKeys||[config.dialogueKey];
 const finishChapter=()=>{
  if(id==='ch4'&&manager.state.playthrough===1){manager.state.flags.firstJourneyComplete=true;busy=true;transition('再来一次',()=>{manager.go('title');render('title');}).then(()=>{busy=false;});return;}
  if(id==='ch4'){navigate('ending_select');return;}
  navigate(manager.advanceChapter());
 };
 if(!c.minigame){
  const keys=[...introKeys,...(config.postGameKeys||[])];
  const savedKey=progress?.kind==='dialogue'?keys.indexOf(progress.storyKey):-1;
  scriptSequence(keys,finishChapter,Math.max(0,savedKey));return;
 }
 const playGame=()=>{
  dialogue=null;
  manager.saveGameplayPosition();
  screen.innerHTML=`<div class="play-scene ${c.minigame==='survivors'?'survivor-scene':['memoryPuzzle','shiguang','numberHero','stationRunner'].includes(c.minigame)?'memory-puzzle-scene':''}${c.minigame==='stationRunner'?' station-runner-scene':''}"><div class="play-header"><span>${c.title}</span><span>${manager.state.playthrough===2?'NEW GAME +':'FIRST JOURNEY'} <i> / </i> ${c.minigame==='numberHero'?'数字勇者':c.minigame==='survivors'?'夜庭幸存者':c.minigame==='stationRunner'?'最后一班车':'章节预览'}</span></div><div id="phaser-host"></div><div class="dpad"><button data-dir="0,-1" aria-label="向上">↑</button><button data-dir="-1,0" aria-label="向左">←</button><button data-dir="0,1" aria-label="向下">↓</button><button data-dir="1,0" aria-label="向右">→</button></div></div>`;
  const afterGame=()=>scriptSequence(chapterAfterGameKeys(c,manager.state.playthrough,manager.state.flags.youthOutcome),finishChapter);
  const onComplete=result=>{
   if(result.success)audio.playSfx('memory');
   Object.entries(result.flags||{}).forEach(([k,v])=>manager.setFlag(k,v));
   setTimeout(()=>{if(!document.getElementById('phaser-host'))return;game?.destroy(true);game=null;afterGame();},100);
  };
  const playthrough=manager.state.playthrough;
  game=mountGame('phaser-host',{config,minigame:c.minigame,asset:data.manifest.find(a=>a.id===c.asset),onComplete,onAchievement:achievementId=>{if(manager.state.scene===id&&manager.state.playthrough===playthrough)achievements.unlock(achievementId);},bridge,context:{playthrough,sfxVolume:manager.state.settings.sfxVolume,getSfxVolume:()=>manager.state.settings.sfxVolume},save:manager.getMinigameSave(c.minigame),onProgress:snapshot=>manager.state.scene===id&&manager.state.playthrough===playthrough?manager.saveMinigameProgress(c.minigame,snapshot):false});
  document.querySelectorAll('[data-dir]').forEach(b=>b.onclick=()=>bridge.move?.(...b.dataset.dir.split(',').map(Number)));
 };
 if(progress?.kind==='game')playGame();
 else{
  const postKeys=chapterAfterGameKeys(c,manager.state.playthrough,manager.state.flags.youthOutcome);
  const allDialogueKeys=[...introKeys,...postKeys];
  const savedKey=progress?.kind==='dialogue'?allDialogueKeys.indexOf(progress.storyKey):-1;
  if(savedKey>=introKeys.length&&savedKey>=0)scriptSequence(postKeys,finishChapter,savedKey-introKeys.length);
  else{
   const start=savedKey>=0?savedKey:0;
   scriptSequence(introKeys,playGame,start);
  }
 }
}
function interlude(){screen.innerHTML=`<div class="center-scene illustrated-center" style="--scene-art:url('${illustration("E2-new-game-plus.png")}')"><div class="orbit">∞</div><span class="eyebrow">FIRST JOURNEY COMPLETE</span><h2>那些遗憾，<br>还有另一个答案。</h2><p>你已经走过四段人生。<br>再走一次相同的路，这一次，试着做出不同的选择。</p><button class="primary" id="ng" data-sfx="confirm">再来一次 <span>NEW GAME + →</span></button><span class="small-note">二周目已解锁 · 相同的记忆，不同的目标</span></div>`;document.getElementById('ng').onclick=()=>{manager.secondRun();navigate('ch1');};}
function endings(){screen.innerHTML=`<div class="endings-scene illustrated-center" style="--scene-art:url('${illustration("E0-ending-choice.png")}')"><span class="eyebrow">THE LAST SAVE</span><h2>最后的选择</h2><div class="ending-options"><button data-sfx="confirm" data-ending="BE"><span>无法抉择，再来一次</span>${icon('arrow')}</button><button data-sfx="confirm" data-ending="NE"><span>留在现在的时间</span>${icon('arrow')}</button><button data-sfx="confirm" data-ending="TE"><span>回到过去的时间</span>${icon('arrow')}</button></div></div>`;document.querySelectorAll('[data-ending]').forEach(b=>b.onclick=()=>{manager.ending(b.dataset.ending);navigate('ending',b.dataset.ending==='TE'?'走进门':b.dataset.ending==='NE'?'留下':'再来一次');});}
function endingSequence(){
 const id=manager.state.flags.ending||'NE',keys=data.story.endingSequences?.[id]||[],progress=manager.getSceneProgress();
 if(progress?.kind==='ending_card'){endingCard(id);return;}
 const saved=progress?.kind==='dialogue'?keys.indexOf(progress.storyKey):-1;
 scriptSequence(keys,()=>endingCard(id),saved>=0?saved:0);
}
function endingCard(id){
 manager.state.sceneProgress={scene:'ending',kind:'ending_card'};manager.rememberStoryNode();manager.persist();
 const type=id==='TE'?'true':id==='NE'?'another':'bad',title=id==='TE'?'True Ending《还没结束》':id==='NE'?'Another Ending《留下》':'Bad Ending《再来一次》';
 const endingCopy=id==='BE'?'<p class="ending-loop" id="ending-loop" aria-live="polite">PLAYTHROUGH 4</p><p class="ending-new-game">NEW GAME?</p>':id==='NE'?'<p>想念还会来。今天要去的地方，也有人在等。</p>':'<p>通话开始，后续谈话留给未来。</p>';
 screen.innerHTML=`<section class="script-ending-card ${type}" aria-label="${title}"><span class="eyebrow">${id==='TE'?'THE STORY CONTINUES':id==='NE'?'ANOTHER ENDING':'BAD ENDING'}</span><h1>${title}</h1>${id==='TE'?'<div class="ending-title-change" aria-live="polite"><span class="title-old">再来一次</span><span class="title-new">这一次</span></div>':''}${endingCopy}<button class="primary" id="ending-return" data-sfx="select" ${id==='BE'?'disabled':''}>回到标题</button></section>`;
 if(id==='TE')setTimeout(()=>screen.querySelector('.ending-title-change')?.classList.add('revealed'),1500);
 if(id==='BE'){
  const loop=document.getElementById('ending-loop'),counts=[4,7,13,29,64];let index=0;
  const timer=setInterval(()=>{index++;if(index<counts.length)loop.textContent=`PLAYTHROUGH ${counts[index]}`;else{clearInterval(timer);loop.textContent='PLAYTHROUGH 4　·　7　·　13　·　29　·　64';screen.querySelector('.script-ending-card')?.classList.add('loop-complete');const button=document.getElementById('ending-return');if(button)button.disabled=false;}},950);
 }
 document.getElementById('ending-return').onclick=()=>{manager.state.flags.endingComplete=true;manager.go('title');render('title');};
}
function credits(){screen.innerHTML=`<div class="center-scene credits illustrated-center" style="--scene-art:url('${illustration("E5-phone-final.png")}')"><span class="tiny-star">✦</span><span class="eyebrow">THANK YOU FOR PLAYING</span><h2>人生不必重来。<br>此刻，就很好。</h2><div class="ending-badge">已解锁 ${manager.state.unlockedEndings.length} / 3 个结局 · ${manager.state.flags.ending==='TE'?'与自己和解':'此刻的人生'}</div>${productionCredits()}<button class="primary" id="back-title">回到故事的起点 ${icon('arrow')}</button></div>`;document.getElementById('back-title').onclick=()=>render('title');}
loadData().then(loaded=>{data=loaded;manager.initializeStoryTrees(data.scenes,data.story);render('title');}).catch(error=>{screen.innerHTML='<div class="center-scene"><h2>故事暂时未能载入</h2><p>请刷新页面再试一次。</p></div>';console.error(error);});
