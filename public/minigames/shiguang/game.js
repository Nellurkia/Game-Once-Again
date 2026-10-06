/* 拾光 v0.2 — 原生 Canvas。正式内容由 level-data.js 与宿主接口替换。 */
(() => {
  'use strict';
  const C = window.MEMORY_CONFIG, L = window.MEMORY_LEVEL;
  const $ = id => document.getElementById(id);
  const playHostSfx = name => {try{window.parent.playGameSfx?.(name);}catch{}};
  const canvas = $('world'), ctx = canvas.getContext('2d');
  const dragCanvas = $('drag-layer'), dc = dragCanvas.getContext('2d');
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
  const pieceById = new Map(L.pieces.map(p=>[p.id,p]));
  const touch = matchMedia('(pointer: coarse)').matches;
  const atlas = document.createElement('canvas');
  atlas.width=L.worldWidth; atlas.height=L.worldHeight;
  const ac = atlas.getContext('2d');
  const keyed = new Set(), transitions = [];
  let state='COVER', context={}, variant, active=false, camera=0, cameraY=0, drag=null;
  let player, save, lastTime=0, accumulator=0, time=0, returnTimer=0;
  let interacted=false, queuedJump=false, hintUntil=0, toastTimer=0, captionZone=-1;
  let idleSeconds=0, saveBlocked=false, corruptRaw=null, storedCandidate=null;
  let modalReturn='PLAYING', disposed=false, writeSequence=0, hostPaused=false;
  const diagnostics={errors:[],lastSaveError:null};

  function setState(next){transitions.push({from:state,to:next});if(transitions.length>100)transitions.shift();state=next;}
  function resize(){
    const viewport=window.visualViewport;
    const scale=Math.min((viewport?.width||innerWidth)/1280,(viewport?.height||innerHeight)/720);
    $('game').style.transform=`translate(-50%,-50%) scale(${scale})`;
  }
  function screenPoint(e){const r=$('game').getBoundingClientRect();return {x:(e.clientX-r.left)*1280/r.width,y:(e.clientY-r.top)*720/r.height};}
  function worldPoint(e){const p=screenPoint(e);return {x:p.x-C.viewport.x+camera,y:p.y-C.viewport.y+cameraY};}
  function clearInputs(){keyed.clear();queuedJump=false;interacted=false;if(player)player.jumpBuffer=0;}
  function toast(text,ms=2600){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,ms);}
  function hint(text,seconds=4){$('hint-text').textContent=text;hintUntil=time+seconds;}
  function keyName(){return `memoryPuzzle.v2.${context.slotId}.${L.id}.${variant.id}`;}
  function newSave(){return {schemaVersion:C.schemaVersion,contentVersion:C.contentVersion,levelId:L.id,variantId:variant.id,
    checkpointId:L.checkpoints[0].id,pieceStates:Object.fromEntries(L.pieces.map(p=>[p.id,'uncollected'])),
    keyStates:{exitKey:false,exitDoor:false},puzzleFlags:{stationProgress:0,stationSignal:false},storyFlags:{},tutorialFlags:{},completed:false};}
  function validateSave(data){
    if(!data||data.schemaVersion!==C.schemaVersion||data.contentVersion!==C.contentVersion||data.levelId!==L.id||data.variantId!==variant.id)throw Error('存档版本或关卡不匹配');
    if(!L.checkpoints.some(p=>p.id===data.checkpointId))throw Error('存档安全点无效');
    if(!data.pieceStates||!data.keyStates||!data.storyFlags||!data.tutorialFlags)throw Error('存档字段不完整');
    for(const p of L.pieces){const s=data.pieceStates[p.id];if(!['uncollected','inventory','placed'].includes(s))throw Error('碎片状态无效');if(!variant.availablePieceIds.includes(p.id)&&s!=='uncollected')throw Error('存档含当前周目不可用的碎片');}
    if(typeof data.keyStates.exitKey!=='boolean'||typeof data.keyStates.exitDoor!=='boolean'||typeof data.completed!=='boolean')throw Error('存档完成状态无效');
    if(!data.puzzleFlags||!Number.isInteger(data.puzzleFlags.stationProgress)||data.puzzleFlags.stationProgress<0||data.puzzleFlags.stationProgress>3||typeof data.puzzleFlags.stationSignal!=='boolean'||data.puzzleFlags.stationSignal!==(data.puzzleFlags.stationProgress===3))throw Error('信号灯状态无效');
    for(const p of L.pieces)if(data.pieceStates[p.id]!=='uncollected'&&!p.requires.every(id=>data.pieceStates[id]==='placed'))throw Error('碎片依赖状态无效');
    if(data.puzzleFlags.stationProgress>0&&!['station-sign','station-waiting'].every(id=>data.pieceStates[id]==='placed'))throw Error('站牌线索缺失');
    if(data.puzzleFlags.stationSignal&&data.pieceStates['station-beam']!=='placed')throw Error('钟楼通路缺失');
    const cp=L.checkpoints.find(p=>p.id===data.checkpointId);if(!cp.requires.every(id=>data.pieceStates[id]==='placed')||(cp.flag&&!data.puzzleFlags[cp.flag]))throw Error('安全点条件不满足');
    if(data.keyStates.exitKey&&(!data.puzzleFlags.stationSignal||data.pieceStates['home-floor']!=='placed'))throw Error('钥匙房间未恢复');
    if(data.completed&&(!data.keyStates.exitKey||!data.keyStates.exitDoor||!data.puzzleFlags.stationSignal||!variant.completionPieceIds.every(id=>data.pieceStates[id]==='placed')))throw Error('完成存档缺少通关条件');
    return JSON.parse(JSON.stringify(data));
  }
  function snapshot(){return JSON.parse(JSON.stringify(save));}
  function reportSaveFailure(e){diagnostics.lastSaveError=String(e);$('save-status').textContent='暂未保存 · 可导出';$('save-status').classList.add('failed');}
  function persist(){
    if(!active)return;
    const data=snapshot(),seq=++writeSequence;
    if(saveBlocked){reportSaveFailure('原存档未能读取，已保留原数据');return;}
    $('save-status').textContent='正在保存…';
    try {
      const write = context.saveAdapter?.write
        ? context.saveAdapter.write(data)
        : localStorage.setItem(keyName(),JSON.stringify(data));
      Promise.resolve(write).then(()=>{if(seq!==writeSequence||disposed)return;$('save-status').textContent='记忆已保存';$('save-status').classList.remove('failed');},e=>reportSaveFailure(e));
      if(typeof context.onProgress==='function')context.onProgress(data);
    }catch(e){reportSaveFailure(e);}
  }
  function loadContext(input={},provided){
    context={slotId:'local',variantId:'first',...input};
    if(!L.variants[context.variantId])throw Error('未知的周目配置，请由总游戏传入 first 或 second');
    variant=L.variants[context.variantId];saveBlocked=false;corruptRaw=null;storedCandidate=null;
    try {
      if(provided!==undefined&&provided!==null){corruptRaw=JSON.stringify(provided);storedCandidate=validateSave(provided);corruptRaw=null;}
      else if(!context.saveAdapter?.write){
        const raw=localStorage.getItem(keyName());if(raw){corruptRaw=raw;storedCandidate=validateSave(JSON.parse(raw));corruptRaw=null;}
      }
    }catch(e){saveBlocked=true;diagnostics.lastSaveError=String(e);}
    save=storedCandidate||newSave();spawn();active=false;setState('COVER');$('cover').hidden=false;
    $('modal').hidden=true;$('story').hidden=true;$('continue-button').hidden=!storedCandidate;
    $('journey-label').textContent=variant.id==='first'?'一周目 · 11 块通路，3 处留白':'二周目 · 全部 14 块必须归位';
    document.querySelector('.cover-controls').textContent=touch?'按住左右移动 · 点按跳跃 / 拖动拼图':'左右移动 + 跳跃 / 鼠标拼接场景';
    updateUI();render();
  }
  function spawn(){
    const point=L.checkpoints.find(p=>p.id===save.checkpointId)||L.checkpoints[0];
    player={x:point.x,y:point.y,vx:0,vy:0,width:C.player.width,height:C.player.height,grounded:false,coyote:0,jumpBuffer:0,facing:1};
    camera=clamp(player.x-350,0,L.worldWidth-1024);cameraY=clamp(player.y+26-350,0,L.worldHeight-608);clearInputs();
  }
  function enter(useSaved){
    if(!useSaved){save=newSave();spawn();}
    active=true;$('cover').hidden=true;setState('PLAYING');idleSeconds=0;updateUI();persist();
    if(save.completed){completionModal(false);return;}
    if(!save.tutorialFlags.entered){
      showModal('把记忆慢慢拼回来','HOW TO PLAY',
        touch
          ? '<p>按住画面下方的左右键移动，点“跳跃”登上平台；靠近信号灯、钥匙或门后点“互动”。</p><p>碰到亮光会自动拾取碎片。按住右侧碎片，把它拖进场景中形状相同的缺口。掉下去会回到安全位置，已经找到的碎片仍会保留。</p>'
          : '<p>在残缺的记忆里走走，拾起碎片，把路接回原来的位置。</p><div class="control-grid"><span><kbd>A</kbd><kbd>D</kbd> / ← →</span><span>左右移动</span><span><kbd>Space</kbd></span><span>跳跃到平台上</span><span><kbd>E</kbd></span><span>操作信号灯、拾取钥匙与开门</span><span>鼠标左键</span><span>按住右侧碎片，直接拖入场景缺口</span></div><p>掉下去会回到安全位置，已找到的碎片仍在。碎片碰到即拾取；新碎片会出现在刚拼好的房间或楼梯里。先接回楼梯，再登高寻找下一块。按 M 查看地图。</p>',
        [{label:'开始走走 →',action:()=>{closeModal();save.tutorialFlags.entered=true;persist();hint('先碰到脚边的碎片，拖回断开的楼梯，再跳上台阶寻找新碎片。',12);}}]);
    }else hint('记忆接着上次的位置，慢慢走就好。',4);
    if(saveBlocked)toast('原存档未能读取，已保留原数据。可从帮助中导出或重置。',6000);
    canvas.focus({preventScroll:true});
  }
  function showModal(title,eyebrow,html,buttons){
    cancelDrag();clearInputs();modalReturn=state==='COMPLETED'?'COMPLETED':'PLAYING';setState(modalReturn==='COMPLETED'?'COMPLETED':'PAUSED');
    $('modal-title').textContent=title;$('modal-eyebrow').textContent=eyebrow;$('modal-body').innerHTML=html;
    $('modal-actions').replaceChildren();buttons.forEach(b=>{const btn=document.createElement('button');btn.textContent=b.label;btn.dataset.sfx=b.light?'select':'confirm';if(b.light)btn.className='light';btn.onclick=b.action;$('modal-actions').append(btn);});
    $('modal').hidden=false;requestAnimationFrame(()=>$('modal-actions').querySelector('button')?.focus());
  }
  function closeModal(){ $('modal').hidden=true;clearInputs();setState(modalReturn);canvas.focus({preventScroll:true}); }
  function showHelp(){
    if(!active)return;
    showModal('走一走，拼一拼','CONTROLS & SAVE',
      (touch
        ? '<p>亮着的碎片碰到即收集。按住下方左右键移动，点“跳跃”登上平台；出现提示后点“互动”。按住右侧碎片，拖近正确缺口后松开。</p>'
        : '<p>亮着的碎片碰到即收集。按 M 看地图；按 R 回到最近的安全点。新房间里可能藏着新碎片。</p><div class="control-grid"><span><kbd>A</kbd><kbd>D</kbd> / ← →</span><span>左右移动</span><span><kbd>Space</kbd></span><span>跳跃。上方的平台也能去。</span><span><kbd>E</kbd></span><span>操作附近信号灯、拾取钥匙，或打开终点门</span><span>鼠标拖动</span><span>观察碎片画面与缺口尺寸，拖近正确位置后松开</span><span><kbd>Esc</kbd> / <kbd>P</kbd></span><span>取消拖动，或暂停与继续</span><span><kbd>R</kbd></span><span>回到最近的安全位置，不清空进度</span></div>')+
      '<h3>记忆会留下来</h3><p>拾取、拼接、拿钥匙与到达安全点时自动保存。刷新后选择“继续上次的回忆”。如果浏览器没有保存成功，可以导出存档随身保留。</p><p>错误位置不会吸附，碎片会回到右栏。拖动时世界会暂时静止。'+(variant.id==='second'?'这次需要把十四块记忆全部拼好；三枚照片碎片需要回访前面的区域。':'先接回通路，进入恢复的房间找新碎片。拼回车站站牌，按图案顺序操作三个信号灯。')+'</p>'+
      (corruptRaw?'<p class="small-note">原存档暂时无法读取，已保留，当前不会覆盖它。请先导出或确认重置。</p>':''),
      [{label:'继续回忆',action:closeModal},{label:'导出存档',light:true,action:exportSave},{label:'导入存档',light:true,action:()=>$('import-file').click()},{label:'重置本关',light:true,action:confirmReset}]);
  }
  function pause(){if(!active||state==='COMPLETED')return;if(drag){cancelDrag();return;}if(!$('modal').hidden){closeModal();return;}if(state==='DIALOGUE'){closeStory();return;}
    persist();showModal('歇一会儿','PAUSED','<p>回忆不会走远。已找到的碎片与拼好的道路都会留下。</p>',[{label:'继续回忆',action:closeModal},{label:'操作与存档',light:true,action:showHelp},{label:'回到标题',light:true,action:returnToTitle}]);}
  function returnToTitle(){persist();active=false;cancelDrag();clearInputs();setState('COVER');$('modal').hidden=true;$('story').hidden=true;$('cover').hidden=false;storedCandidate=snapshot();$('continue-button').hidden=false;}
  function confirmReset(){showModal('重新整理这段回忆？','RESET THIS CHAPTER','<p>只清空本关当前配置的碎片、钥匙与进度，不会修改总游戏的周目。此操作无法撤销；也可以先导出存档。</p>',[{label:'取消',light:true,action:showHelp},{label:'导出存档',light:true,action:exportSave},{label:'确认重新开始',action:()=>{saveBlocked=false;corruptRaw=null;try{if(!context.saveAdapter?.write)localStorage.removeItem(keyName());}catch(e){reportSaveFailure(e);}closeModal();enter(false);}}]);}
  function exportSave(){const raw=corruptRaw||JSON.stringify(snapshot(),null,2);const blob=new Blob([raw],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=corruptRaw?'memory-original-save.json':'memory-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('存档已导出，请保留这个 JSON 文件。');}
  async function importSave(e){const file=e.target.files[0];e.target.value='';if(!file)return;
    try{const validated=validateSave(JSON.parse(await file.text()));showModal('载入这份回忆？','IMPORT SAVE','<p>导入后将替换本关当前配置的进度。文件已经过完整性检查。</p>',[{label:'取消',light:true,action:showHelp},{label:'确认导入',action:()=>{save=validated;saveBlocked=false;corruptRaw=null;spawn();closeModal();updateUI();persist();if(save.completed)completionModal(false);toast('存档已载入。');}}]);}
    catch(err){toast('未能导入：'+err.message,5000);}
  }

  // Pixel scenery is drawn locally, without web requests or external libraries.
  function rect(x,y,w,h,color){ac.fillStyle=color;ac.fillRect(Math.round(x/4)*4,Math.round(y/4)*4,Math.ceil(w/4)*4,Math.ceil(h/4)*4);}
  function pictureFrame(x,y,w,h){rect(x-8,y-8,w+16,h+16,'#6c5939');rect(x-4,y-4,w+8,h+8,'#c19a56');rect(x,y,w,h,'#182d30');}
  function lamp(x,y){rect(x-8,y,16,44,'#a38245');rect(x-26,y-14,52,28,'#d7b571');rect(x-20,y-8,40,16,'#ebcf89');rect(x-20,y+42,40,8,'#705838');
    const g=ac.createRadialGradient(x,y+10,10,x,y+10,100);g.addColorStop(0,'#edbd6637');g.addColorStop(1,'#edbd6600');ac.fillStyle=g;ac.fillRect(x-110,y-90,220,220);}
  function pot(x,y){rect(x-18,y,36,28,'#b88958');rect(x-22,y,44,8,'#cf9e68');rect(x-2,y-42,4,42,'#536647');for(let i=0;i<4;i++){rect(x-20+i*8,y-34-i*9,20,12,i%2?'#778452':'#526545');}}
  function picture(x,y,w,h){rect(x-4,y-4,w+8,h+8,'#aa844d');rect(x,y,w,h,'#bc9d68');rect(x+8,y+h-20,w-16,12,'#8e865b');rect(x+w*.3,y+12,16,16,'#e8c286');rect(x+w*.3-4,y+28,24,h-38,'#756b49');}
  function silhouette(x,y,coat='#b49263',small=false){const s=small?.7:1;rect(x+4,y,20*s,20*s,'#d7bf8d');rect(x,y+20*s,28*s,34*s,coat);rect(x+4,y+54*s,8*s,14*s,'#3c3b2c');rect(x+20*s,y+54*s,8*s,14*s,'#3c3b2c');}
  function buildAtlas(){
    ac.imageSmoothingEnabled=false;
    const sky=ac.createLinearGradient(0,0,0,L.worldHeight);sky.addColorStop(0,'#162d32');sky.addColorStop(.55,'#34463c');sky.addColorStop(1,'#5b5138');ac.fillStyle=sky;ac.fillRect(0,0,L.worldWidth,L.worldHeight);
    for(let i=0;i<210;i++)rect((i*173+71)%L.worldWidth,40+(i*83)%1250,4,4,'#b8b28b36');
    // Rooms have different elevations. Their floors are the actual collision platforms.
    pictureFrame(18,998,210,182);rect(24,1004,196,176,'#6e5e41');lamp(80,1080);picture(145,1030,45,55);
    pictureFrame(516,708,256,196);rect(520,712,248,188,'#69593e');pictureFrame(558,720,170,80);rect(562,724,162,72,'#233b37');pot(730,864);lamp(590,822);
    pictureFrame(1624,704,242,276);rect(1630,710,230,270,'#384f47');rect(1675,730,130,84,'#243b3c');rect(1728,730,8,84,'#a78b51');rect(1675,770,130,8,'#a78b51');lamp(1670,899);
    pictureFrame(2664,244,212,216);rect(2670,250,200,210,'#72634a');pictureFrame(2700,266,130,90);rect(2704,270,122,82,'#253d3f');rect(2760,270,8,82,'#b99b65');pot(2860,430);
    pictureFrame(3144,184,172,116);rect(3150,190,160,110,'#756044');lamp(3170,240);picture(3220,218,32,38);
    // Small fragment-specific details make the inventory images readable without numbered answers.
    for(const p of L.pieces){const t=p.target;
      if(p.id.includes('bridge')||p.id.includes('beam')){for(let y=t.y+20;y<t.y+t.height;y+=44)rect(t.x+8,y,t.width-16,3,'#a9966720');}
      if(p.id.includes('photo')||p.id.includes('ticket')){picture(t.x+12,t.y+16,t.width-24,t.height-45);silhouette(t.x+35,t.y+40,'#87724c',true);}
      if(p.id.includes('stairs')||p.id==='home-shelf'){for(let i=0;i<4;i++){rect(t.x+12+i*44,t.y+t.height-30-i*50,28,30+i*50,'#62553b');rect(t.x+16+i*44,t.y+t.height-26-i*50,6,14,'#b19762');}}
    }
    for(const p of [...L.baseColliders,...L.pieces.flatMap(p=>p.addedColliders)]){
      rect(p.x,p.y,p.width,8,'#c2a168');rect(p.x,p.y+8,p.width,p.height-8,'#6c5a3d');
      if(p.oneWay){rect(p.x+8,p.y+16,6,18,'#786746');rect(p.x+p.width-14,p.y+16,6,18,'#786746');}
      else{for(let x=p.x;x<p.x+p.width;x+=32)rect(x,p.y+16,3,p.height-16,'#4e4933');}
    }
    // Clue is only visible after the sign itself is restored.
    pictureFrame(1428,538,214,112);rect(1434,544,202,100,'#344b42');ac.textAlign='center';ac.fillStyle='#e4cc97';ac.font='14px serif';ac.fillText('末班车 · 信号顺序',1535,567);ac.font='bold 23px serif';ac.fillText('灯 → 月 → 星',1535,600);ac.font='12px serif';ac.fillText('沿着钟梯，依次点亮',1535,631);ac.textAlign='left';
    const ex=L.exit.x;rect(ex-22,228,44,72,'#be9d65');rect(ex-16,234,32,66,'#354936');rect(ex-10,241,20,24,'#627255');rect(ex+5,272,4,4,'#eed89a');
    ac.fillStyle='#c7b78e';ac.font='12px serif';ac.fillText('旧书房',46,985);ac.fillText('钟楼车站',1130,700);ac.fillText('灯亮着的地方',2280,590);
  }

  function puzzlePath(g,w,h){
    const t=Math.min(11,w*.12,h*.08),mx=w*.5,my=h*.5;
    g.beginPath();g.moveTo(0,0);g.lineTo(mx-t,0);g.bezierCurveTo(mx-t,-t,mx+t,-t,mx+t,0);g.lineTo(w,0);
    g.lineTo(w,my-t);g.bezierCurveTo(w+t,my-t,w+t,my+t,w,my+t);g.lineTo(w,h);
    g.lineTo(mx+t,h);g.bezierCurveTo(mx+t,h-t,mx-t,h-t,mx-t,h);g.lineTo(0,h);
    g.lineTo(0,my+t);g.bezierCurveTo(t,my+t,t,my-t,0,my-t);g.closePath();
  }
  function drawPiece(g,p,x,y,scale=1,alpha=1){
    const t=p.target;g.save();g.translate(x,y);g.scale(scale,scale);g.globalAlpha=alpha;
    puzzlePath(g,t.width,t.height);g.shadowColor='#0b140ab0';g.shadowBlur=10;g.shadowOffsetY=4;g.fillStyle='#d6c18b';g.fill();g.shadowBlur=0;g.shadowOffsetY=0;
    g.save();g.clip();g.drawImage(atlas,-t.x,-t.y);g.restore();g.strokeStyle='#ead3a0';g.lineWidth=2/scale;g.stroke();g.restore();
  }
  function thumbnail(p,cv){const g=cv.getContext('2d');g.clearRect(0,0,188,172);g.imageSmoothingEnabled=false;const s=Math.min(150/p.target.width,136/p.target.height);drawPiece(g,p,(188-p.target.width*s)/2,(172-p.target.height*s)/2,s);}
  function availablePieces(){return L.pieces.filter(p=>variant.availablePieceIds.includes(p.id));}
  function currentZone(){return clamp(Math.floor((player.x+player.width/2)/1120),0,2);}
  function placedCount(){return variant.completionPieceIds.filter(id=>save.pieceStates[id]==='placed').length;}
  function remainingIds(){return variant.completionPieceIds.filter(id=>save.pieceStates[id]!=='placed');}
  function ready(o){return (o.requires||[]).every(id=>save.pieceStates[id]==='placed')&&(!o.flag||save.puzzleFlags[o.flag]);}
  function colliders(){return [...L.baseColliders,...L.pieces.filter(p=>save.pieceStates[p.id]==='placed').flatMap(p=>p.addedColliders),...(!save.puzzleFlags.stationSignal?[L.signal.gate]:[])];}
  function canComplete(){return save.keyStates.exitKey&&save.puzzleFlags.stationSignal&&remainingIds().length===0;}
  function updateUI(){
    $('piece-list').replaceChildren();const inventory=availablePieces().filter(p=>save.pieceStates[p.id]==='inventory');
    for(const p of inventory){const button=document.createElement('button');button.className='piece-item'+(!save.tutorialFlags.placed?' first-piece':'');button.dataset.piece=p.id;button.setAttribute('aria-label',`${L.zones.find(z=>z.id===p.segmentId).name} ${p.label}，按住拖入场景`);
      const cv=document.createElement('canvas');cv.width=188;cv.height=172;thumbnail(p,cv);const text=document.createElement('small');text.textContent=p.label;button.append(cv,text);button.addEventListener('pointerdown',e=>beginDrag(e,p,button));$('piece-list').append(button);}
    $('inventory-count').textContent=`${inventory.length} 枚`;$('empty-inventory').hidden=inventory.length>0;
    $('empty-inventory').querySelector('p').innerHTML=placedCount()===variant.completionPieceIds.length?'这段路已慢慢接起<br>找到钥匙，走到门前':'记忆散落在路上<br>碰到亮光即可拾起<br>新碎片藏在恢复的场景里';
    $('progress-count').textContent=`${placedCount()} / ${variant.completionPieceIds.length}`;$('progress-fill').style.width=`${100*placedCount()/variant.completionPieceIds.length}%`;
    $('region-dots').replaceChildren();for(const z of L.zones){const dot=document.createElement('span');dot.className='region-dot'+(variant.completionPieceIds.filter(id=>pieceById.get(id).segmentId===z.id).every(id=>save.pieceStates[id]==='placed')?' complete':'');dot.title=z.name;$('region-dots').append(dot);}
    $('key-status').textContent=save.keyStates.exitKey?'✧ 已取得钥匙':'钥匙未取得';$('key-status').classList.toggle('has-key',save.keyStates.exitKey);
    updateGoal();
  }
  function updateGoal(){
    const local=availablePieces().filter(p=>p.segmentId===L.zones[currentZone()].id&&save.pieceStates[p.id]!=='placed');
    const inv=local.find(p=>save.pieceStates[p.id]==='inventory'),next=local.find(p=>ready(p));
    $('current-goal').textContent=inv?inv.clue:next?next.clue:remainingIds().length?'走进拼好的场景，寻找下一枚碎片':save.keyStates.exitKey?'到灯室的门前，按 E 打开':'进入灯室，寻找旧钥匙';
    if(currentZone()===1&&!save.puzzleFlags.stationSignal&&save.pieceStates['station-sign']==='placed')$('current-goal').textContent='观察修好的站牌，沿钟梯按顺序操作三个信号灯';
  }
  function showMap(){
    if(!active)return;showModal('回忆的高低与转折','MAP · M','<p>金色为已恢复的画面，虚线为缺口。圆点是你的位置；旗帜是安全点。拼图仍要在主场景中完成。</p><canvas id="overview" width="680" height="280" style="width:100%;height:auto;border-radius:8px;background:#233b35"></canvas>',[{label:'回到回忆',action:closeModal}]);
    const g=$('overview').getContext('2d'),sx=660/L.worldWidth,sy=260/L.worldHeight;
    g.save();g.translate(10,10);g.lineWidth=1;
    for(const p of L.baseColliders){g.fillStyle='#7b9173';g.fillRect(p.x*sx,p.y*sy,p.width*sx,Math.max(2,p.height*sy));}
    for(const p of L.pieces){g.strokeStyle=save.pieceStates[p.id]==='placed'?'#dabc80':'#8a9d8270';g.setLineDash(save.pieceStates[p.id]==='placed'?[]:[3,3]);g.strokeRect(p.target.x*sx,p.target.y*sy,p.target.width*sx,p.target.height*sy);}
    g.setLineDash([]);g.fillStyle='#ead3a0';g.font='12px sans-serif';for(const cp of L.checkpoints){g.fillText('⚑',cp.x*sx,cp.y*sy);}
    g.fillStyle='#ffdb7d';g.beginPath();g.arc((player.x+14)*sx,(player.y+26)*sy,5,0,Math.PI*2);g.fill();g.restore();
  }

  function beginDrag(e,p,button){
    if(state!=='PLAYING'||e.button!==0||save.pieceStates[p.id]!=='inventory')return;
    e.preventDefault();clearInputs();const point=screenPoint(e),r=button.querySelector('canvas').getBoundingClientRect();
    const sx=clamp((e.clientX-r.left)/r.width,0,1),sy=clamp((e.clientY-r.top)/r.height,0,1);
    drag={piece:p,pointerId:e.pointerId,button,point,offset:{x:p.target.width*sx,y:p.target.height*sy},valid:false};
    button.setPointerCapture?.(e.pointerId);button.classList.add('is-dragging');setState('DRAGGING');save.tutorialFlags.dragged=true;
    hint('观察画面和尺寸，拖到对应缺口；接近正确位置时才会发亮。Esc 取消。',30);updateDrag(e);
  }
  function updateDrag(e){
    if(!drag||e.pointerId!==drag.pointerId)return;drag.point=screenPoint(e);const pos=worldPoint(e);
    drag.anchor={x:pos.x-drag.offset.x,y:pos.y-drag.offset.y};const t=drag.piece.target;
    drag.valid=drag.point.x>=0&&drag.point.x<1024&&drag.point.y>=56&&drag.point.y<664&&
      t.x+t.width>camera&&t.x<camera+1024&&t.y+t.height>cameraY&&t.y<cameraY+608&&distance(drag.anchor,t)<=C.snapRadius;
  }
  function finishDrag(e){
    if(!drag||e.pointerId!==drag.pointerId)return;updateDrag(e);const session=drag;drag=null;session.button.classList.remove('is-dragging');setState('PLAYING');clearInputs();
    if(session.valid){
      const p=session.piece;save.pieceStates[p.id]='placed';save.tutorialFlags.placed=true;idleSeconds=0;
      if(p.addedColliders.some(c=>overlap(player,c))){spawn();hint('道路接好了，已回到安全位置。',4);}
      else hint('咔哒。走进恢复的场景，看看里面出现了什么。',4);
      updateUI();persist();checkStory(p.segmentId);
    }else{session.button.classList.add('wrong');setTimeout(()=>session.button.classList.remove('wrong'),350);hint('还没对上。碎片已回到右侧，试试对应的缺口。',4);}
    canvas.focus({preventScroll:true});
  }
  function cancelDrag(){if(!drag)return;drag.button.classList.remove('is-dragging');drag=null;dc.clearRect(0,0,1280,720);clearInputs();setState('PLAYING');hint('碎片已回到右侧。',2);}
  function checkStory(segmentId){
    const zone=L.zones.find(z=>z.id===segmentId),items=availablePieces().filter(p=>p.segmentId===segmentId);
    const road=items.filter(p=>!p.optional).every(p=>save.pieceStates[p.id]==='placed'),full=items.every(p=>save.pieceStates[p.id]==='placed');
    if(!road)return;const key=segmentId+(variant.id==='second'&&full?'-full':'-road');if(save.storyFlags[key])return;
    save.storyFlags[key]=true;save.storyFlags.seenAny=true;persist();clearInputs();setState('DIALOGUE');
    $('story-text').textContent=variant.id==='second'&&full?zone.complete:zone.partial;$('story').hidden=false;
  }
  function closeStory(){if(state!=='DIALOGUE')return;$('story').hidden=true;clearInputs();setState('PLAYING');canvas.focus({preventScroll:true});}
  function completionModal(notify=true){
    clearInputs();setState('COMPLETED');const description=variant.id==='second'?'十四块拼图终于归位。这片记忆，第一次有了完整的轮廓。':'十一块通路已接回，仍有三处记忆残缺。带着这些留白，也可以继续向前。';
    showModal(variant.id==='second'?'这次，记忆完整了':'走到了回忆的尽头','CHAPTER COMPLETE',
      `<p>${description}</p><p>你拼好了 ${placedCount()} 块碎片，带着钥匙走完了这段路。</p><p class="small-note">本关已完成。后续剧情与周目由总游戏接管。</p>`,
      [{label:context.onReturn?'继续故事':'回到标题',action:()=>{returnToTitle();if(typeof context.onReturn==='function')context.onReturn();}},{label:'导出这段回忆',light:true,action:exportSave}]);
    modalReturn='COMPLETED';
    if(notify&&typeof context.onComplete==='function')context.onComplete({levelId:L.id,variantId:variant.id,completed:true,completeMemory:variant.id==='second',save:snapshot()});
  }
  function nearestInteraction(){
    const center={x:player.x+player.width/2,y:player.y+player.height/2};let choices=[];
    for(const sw of L.signal.switches)if(ready(sw))choices.push({type:'switch',...sw});
    if(!save.keyStates.exitKey&&ready(L.key))choices.push({type:'key',x:L.key.x,y:L.key.y});if(ready(pieceById.get('home-floor')))choices.push({type:'exit',x:L.exit.x,y:L.exit.y+26});
    choices=choices.map(o=>({...o,distance:distance(center,o)})).filter(o=>o.distance<=C.interactionRadius);choices.sort((a,b)=>a.distance-b.distance);return choices[0]||null;
  }
  function autoCollect(){
    let found=false;for(const p of availablePieces())if(save.pieceStates[p.id]==='uncollected'&&ready(p)&&overlap(player,{x:p.pickup.x-11,y:p.pickup.y-15,width:27,height:38})){
      save.pieceStates[p.id]='inventory';save.tutorialFlags.picked=true;idleSeconds=0;found=true;toast('拾起：'+p.label,1800);hint(p.inside?'拼好的场景里藏着新碎片。看看它能接回哪里。':'碎片在右侧了，观察画面与尺寸，把它拖回主场景。',7);
    }if(found){updateUI();persist();}
  }
  function interact(){
    const item=nearestInteraction();if(!item)return;
    if(item.type==='switch'){
      if(save.puzzleFlags.stationSignal){hint('三个信号灯已经按顺序亮起，右侧的栅门已打开。',4);return;}
      if(save.pieceStates['station-sign']!=='placed'){hint('灯座旁写着：请按站牌上的顺序。先把缺失的站牌拼回来。',6);return;}
      const expected=L.signal.order[save.puzzleFlags.stationProgress];
      if(item.id===expected){save.puzzleFlags.stationProgress++;toast('信号灯亮起：'+item.name+' · '+save.puzzleFlags.stationProgress+'/3');}
      else{save.storyFlags.wrongSignalOrder=true;context.onAchievement?.('memory-rebel');save.puzzleFlags.stationProgress=item.id===L.signal.order[0]?1:0;toast('顺序没有接上，信号灯重新开始。');hint('再看看修好的站牌。按 R 可回安全点，已拼好的路不会消失。',7);}
      if(save.puzzleFlags.stationProgress===3){save.puzzleFlags.stationSignal=true;hint('信号接通，车站右侧的栅门打开了。',8);toast('末班车的信号终于接通。',3500);}
      updateGoal();persist();
    }else if(item.type==='key'){
      save.keyStates.exitKey=true;idleSeconds=0;updateUI();persist();hint('钥匙找到了。走到灯室的门前，按 E 打开。',8);toast('一把温热的旧钥匙',2500);
    }else if(!save.keyStates.exitKey){hint('这扇门需要一把钥匙。看看灯室里。',4);}
    else if(remainingIds().length){const missing=pieceById.get(remainingIds()[0]);hint(missing.clue,8);toast('还有一角记忆没有归位。按 M 看看地图。',3500);}
    else if(canComplete()){save.completed=true;save.keyStates.exitDoor=true;persist();completionModal(true);}
  }

  function overlap(a,b){return a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;}
  function beginReturn(){clearInputs();player.vx=0;player.vy=0;returnTimer=C.returnDelay;setState('RETURNING');}
  function simulate(dt){
    if(hostPaused)return;
    if(state==='RETURNING'){returnTimer-=dt;if(returnTimer<=0){spawn();setState('PLAYING');hint('已回到安全位置，已找到的碎片仍在。',4);}return;}
    if(state!=='PLAYING'&&!(state==='DRAGGING'&&!C.pauseDuringDrag))return;
    const ph=C.physics,solids=colliders(),wasGrounded=player.grounded;
    const left=C.bindings.left.some(k=>keyed.has(k)),right=C.bindings.right.some(k=>keyed.has(k));
    player.vx=((right?1:0)-(left?1:0))*ph.moveSpeed;if(player.vx)player.facing=Math.sign(player.vx);
    if(queuedJump){player.jumpBuffer=ph.jumpBuffer;queuedJump=false;}
    player.coyote=wasGrounded?ph.coyoteTime:Math.max(0,player.coyote-dt);player.jumpBuffer=Math.max(0,player.jumpBuffer-dt);
    if(player.jumpBuffer>0&&player.coyote>0){player.vy=ph.jumpVelocity;player.grounded=false;player.coyote=0;player.jumpBuffer=0;save.tutorialFlags.jumped=true;}
    const prevY=player.y;player.x+=player.vx*dt;player.x=clamp(player.x,0,L.worldWidth-player.width);
    for(const s of solids)if(!s.oneWay&&overlap(player,s)){if(player.vx>0)player.x=s.x-player.width;else if(player.vx<0)player.x=s.x+s.width;}
    player.vy=Math.min(ph.maxFallSpeed,player.vy+ph.gravity*dt);player.y+=player.vy*dt;player.grounded=false;
    for(const s of solids){if(!overlap(player,s))continue;if(s.oneWay&&(player.vy<0||prevY+player.height>s.y+1))continue;
      if(player.vy>=0&&prevY+player.height<=s.y+1){player.y=s.y-player.height;player.vy=0;player.grounded=true;}
      else if(!s.oneWay&&player.vy<0&&prevY>=s.y+s.height-1){player.y=s.y+s.height;player.vy=0;}
    }
    if(player.y>L.fallY){save.storyFlags.fellIntoHole=true;context.onAchievement?.('memory-fall');persist();beginReturn();return;}
    if(player.vx){save.tutorialFlags.moved=true;idleSeconds=0;}
    const zi=currentZone(),zone=L.zones[zi];
    for(const cp of L.checkpoints)if(player.grounded&&ready(cp)&&player.x>=cp.x-20&&player.x<cp.x+120&&Math.abs(player.y-cp.y)<2&&save.checkpointId!==cp.id){save.checkpointId=cp.id;persist();hint('这里留下了一个安全位置。按 R 可以返回。',3);}
    camera=clamp(player.x-350,0,L.worldWidth-1024);cameraY=clamp(player.y+26-350,0,L.worldHeight-608);autoCollect();
    if(captionZone!==zi){captionZone=zi;$('zone-name').textContent=`0${zi+1} / ${zone.name}`;$('region-caption').textContent=zone.caption;updateGoal();}
    if(interacted){interacted=false;interact();}
    idleSeconds+=dt;if(idleSeconds>C.idleHintSeconds){idleSeconds=0;hint('需要一点提示吗？按 H，或点击右上角“操作”。',5);}
  }

  function drawPickup(g,x,y,type){
    const pulse=(Math.sin(time*2.8+x*.02)+1)/2;g.save();g.translate(x-camera,y-cameraY);const glow=g.createRadialGradient(0,0,2,0,0,30+pulse*7);glow.addColorStop(0,'#efce8155');glow.addColorStop(1,'#efce8100');g.fillStyle=glow;g.fillRect(-40,-40,80,80);
    g.fillStyle='#f1d593';if(type==='key'){g.fillRect(-9,-5,9,9);g.fillRect(0,-2,16,4);g.fillRect(11,0,4,7);g.fillRect(19,-2,4,7);g.fillStyle='#4e6245';g.fillRect(-6,-2,3,3);}
    else{g.translate(0,Math.sin(time*2+x)*3);puzzlePath(g,19,23);g.fillStyle='#d9b772';g.fill();g.strokeStyle='#f4dea6';g.lineWidth=1;g.stroke();g.fillStyle='#927c4e';g.fillRect(6,8,8,4);}
    g.restore();
  }
  function drawPlayer(g){
    const x=Math.round((player.x-camera-8)/4)*4,y=Math.round((player.y-cameraY)/4)*4,walk=Math.abs(player.vx)>0&&player.grounded?Math.sin(time*13):0;
    g.save();g.translate(x,y);if(player.facing<0){g.translate(44,0);g.scale(-1,1);}g.fillStyle='#0d1b1866';g.fillRect(4,52,36,4);
    const b=(xx,yy,w,h,c)=>{g.fillStyle=c;g.fillRect(xx,yy,w,h);};
    b(12,0,20,4,'#d7d0ac');b(8,4,28,8,'#d7d0ac');b(8,12,8,8,'#b6b895');b(16,12,20,12,'#dfc298');b(36,16,4,4,'#dfc298');b(28,16,4,4,'#615b3f');
    b(8,24,28,8,'#b36d4d');b(12,32,24,16,'#a08858');b(8,32,8,12,'#897447');b(28,36,8,8,'#d1b487');
    const leg=walk>0?4:0;b(12,48,8,8,'#3b4534');b(28,48-leg,8,8,'#3b4534');b(8,52,12,4,'#2d382c');b(28,52-leg,12,4,'#2d382c');g.restore();
  }
  function drawInteraction(){
    const item=(state==='PLAYING')?nearestInteraction():null;if(!item){$('interaction').hidden=true;return;}
    const text=item.type==='switch'?'操作「'+item.name+'」信号灯':item.type==='key'?'拾起钥匙':canComplete()?'打开这扇门':'看看这扇门';
    $('interaction').innerHTML=(touch?'':'<kbd>E</kbd> ')+text;$('interaction').hidden=false;$('interaction').style.left=clamp(item.x-camera,95,930)+'px';$('interaction').style.top=(item.y-cameraY-31)+'px';
  }
  function render(){
    ctx.clearRect(0,0,1024,608);ctx.imageSmoothingEnabled=false;ctx.drawImage(atlas,camera,cameraY,1024,608,0,0,1024,608);
    const inv=availablePieces().filter(p=>save.pieceStates[p.id]==='inventory');
    for(const p of L.pieces){if(save.pieceStates[p.id]==='placed'||p.target.x+p.target.width<camera-20||p.target.x>camera+1044)continue;
      const t=p.target,visible=variant.availablePieceIds.includes(p.id);ctx.save();ctx.translate(t.x-camera,t.y-cameraY);puzzlePath(ctx,t.width,t.height);ctx.fillStyle=visible?'#1d3028':'#23362ce8';ctx.fill();
      const activeTarget=drag?.piece.id===p.id;
      const highlight=activeTarget?drag.valid:!drag&&!save.tutorialFlags.placed&&inv.some(v=>v.id===p.id);
      ctx.strokeStyle=highlight?'#f4d190':visible?'#a38d5e9c':'#8d82534d';ctx.lineWidth=highlight?3:1;ctx.setLineDash(highlight?[]:[4,6]);ctx.stroke();
      if(visible){ctx.fillStyle='#c1a373aa';ctx.font='10px system-ui';ctx.textAlign='center';ctx.fillText(p.optional?'失落的一角':'缺失的画面',t.width/2,t.height/2+4);}
      if(highlight){ctx.shadowColor='#e8ba6b';ctx.shadowBlur=15;ctx.stroke();}ctx.restore();
    }
    for(const p of availablePieces())if(save.pieceStates[p.id]==='uncollected'&&ready(p)&&p.pickup.x>camera-40&&p.pickup.x<camera+1064)drawPickup(ctx,p.pickup.x,p.pickup.y,'piece');
    if(!save.keyStates.exitKey&&ready(L.key))drawPickup(ctx,L.key.x,L.key.y,'key');
    if(canComplete()&&L.exit.x-camera<1040){ctx.fillStyle='#eac87b';ctx.globalAlpha=.1+(Math.sin(time*2)+1)*.07;ctx.fillRect(L.exit.x-camera-22,228-cameraY,44,72);ctx.globalAlpha=1;}
    // The signal puzzle changes the world, not just a counter.
    const gate=L.signal.gate;if(!save.puzzleFlags.stationSignal){ctx.fillStyle='#859579';for(let x=gate.x;x<gate.x+gate.width;x+=8)ctx.fillRect(x-camera,gate.y-cameraY,4,gate.height);ctx.fillStyle='#bd9f64';ctx.fillRect(gate.x-camera-8,gate.y-cameraY,gate.width+16,8);}
    for(const sw of L.signal.switches)if(ready(sw)){const lit=save.puzzleFlags.stationSignal||L.signal.order.indexOf(sw.id)<save.puzzleFlags.stationProgress;ctx.fillStyle=lit?'#f5d68e':'#637b65';ctx.fillRect(sw.x-camera-10,sw.y-cameraY-10,20,20);ctx.strokeStyle='#d4b77e';ctx.strokeRect(sw.x-camera-10,sw.y-cameraY-10,20,20);ctx.fillStyle=lit?'#35462d':'#e1cd9a';ctx.font='12px serif';ctx.textAlign='center';ctx.fillText(sw.name,sw.x-camera,sw.y-cameraY+4);ctx.textAlign='left';}
    for(const cp of L.checkpoints)if(ready(cp)){ctx.fillStyle=save.checkpointId===cp.id?'#e4c987':'#9b9870';ctx.fillRect(cp.x-camera,cp.y+20-cameraY,3,32);ctx.fillRect(cp.x-camera+3,cp.y+20-cameraY,16,10);}
    drawPlayer(ctx);
    // Slight vignette and restrained pixel grain; no noisy scanline over text.
    const vignette=ctx.createLinearGradient(0,0,0,608);vignette.addColorStop(0,'#0f201a45');vignette.addColorStop(.25,'#0f201a00');vignette.addColorStop(1,'#0f201a33');ctx.fillStyle=vignette;ctx.fillRect(0,0,1024,608);
    if(state==='RETURNING'){ctx.fillStyle=`rgba(20,30,22,${.45*returnTimer/C.returnDelay})`;ctx.fillRect(0,0,1024,608);}
    drawInteraction();dc.clearRect(0,0,1280,720);
    if(drag){drawPiece(dc,drag.piece,drag.point.x-drag.offset.x,drag.point.y-drag.offset.y,1,C.dragOpacity);
      dc.font='12px system-ui';dc.fillStyle=drag.valid?'#f4d7a0':'#e4d5b4';dc.fillText(drag.valid?'松开即可拼合':'拖到对应的缺口',clamp(drag.point.x-50,12,1140),clamp(drag.point.y-32,25,690));}
    if(active&&time>hintUntil){const zi=currentZone(),items=availablePieces().filter(p=>p.segmentId===L.zones[zi].id);
      $('hint-text').textContent=!save.tutorialFlags.picked?'碰到亮光即可拾取 · 拼回楼梯后登高寻找新碎片':inv.length?'右侧碎片可以直接拖入场景 · Space 跳跃 · R 回到安全点':items.some(p=>save.pieceStates[p.id]==='uncollected')?'走进修复的场景寻找新碎片 · M 看地图 · E 操作信号灯':'继续向前走走 · A / D 移动 · Space 跳跃';}
  }
  function frame(timestamp){
    if(disposed)return;const elapsed=lastTime?Math.min((timestamp-lastTime)/1000,.1):0;lastTime=timestamp;time+=elapsed;
    accumulator+=elapsed;let steps=0;while(accumulator>=C.physics.fixedStep&&steps<C.physics.maxSteps){simulate(C.physics.fixedStep);accumulator-=C.physics.fixedStep;steps++;}if(steps===C.physics.maxSteps)accumulator=0;
    render();requestAnimationFrame(frame);
  }
  function onKeyDown(e){
    if(hostPaused)return;
    const codes=Object.values(C.bindings).flat();if(codes.includes(e.code)&&active)e.preventDefault();if(e.repeat)return;
    if(e.code==='Escape'||e.code==='KeyP'){pause();return;}
    if(e.code==='KeyM'&&!$('modal').hidden&&$('overview')){closeModal();return;}
    if(state==='DIALOGUE'&&(e.code==='Space'||e.code==='KeyE')){e.preventDefault();closeStory();return;}
    if(state!=='PLAYING')return;
    if(C.bindings.help.includes(e.code)){showHelp();return;}
    if(C.bindings.map.includes(e.code)){showMap();return;}
    if(C.bindings.return.includes(e.code)){beginReturn();return;}
    if(C.bindings.jump.includes(e.code))queuedJump=true;if(C.bindings.interact.includes(e.code))interacted=true;keyed.add(e.code);
  }
  const onKeyUp=e=>keyed.delete(e.code);
  const touchButtons=[...document.querySelectorAll('#touch-controls [data-touch]')];
  function pressTouch(e){
    e.preventDefault();
    const button=e.currentTarget,action=button.dataset.touch;
    button.setPointerCapture?.(e.pointerId);button.classList.add('is-held');
    if(hostPaused||!active)return;
    if(state==='DIALOGUE'&&(action==='jump'||action==='interact')){closeStory();return;}
    if(state!=='PLAYING')return;
    if(action==='left')keyed.add('KeyA');
    else if(action==='right')keyed.add('KeyD');
    else if(action==='jump')queuedJump=true;
    else if(action==='interact')interacted=true;
  }
  function releaseTouch(e){
    const button=e.currentTarget,action=button.dataset.touch;
    button.classList.remove('is-held');
    if(action==='left')keyed.delete('KeyA');
    if(action==='right')keyed.delete('KeyD');
  }
  function advanceStoryPointer(e){if(state==='DIALOGUE'&&!e.target.closest('button'))closeStory();}
  function loseFocus(){clearInputs();cancelDrag();if(active&&state==='PLAYING')pause();}
  function validateLevel(){const ids=new Set(),targets=new Set();for(const p of L.pieces){if(ids.has(p.id)||targets.has(p.targetId))throw Error('拼图或目标 ID 重复');ids.add(p.id);targets.add(p.targetId);if(p.target.x<0||p.target.y<0||p.target.y+p.target.height>L.worldHeight||p.target.x+p.target.width>L.worldWidth)throw Error('拼图超出地图范围');}
    for(const p of L.pieces){for(const id of p.requires)if(!ids.has(id))throw Error('碎片依赖不存在');if(p.inside){const t=pieceById.get(p.inside).target;if(!p.requires.includes(p.inside)||p.pickup.x<t.x||p.pickup.x>t.x+t.width||p.pickup.y<t.y||p.pickup.y>t.y+t.height)throw Error('隐藏碎片不在前置画面内');}}
    const visiting=new Set(),done=new Set();function visit(p){if(visiting.has(p.id))throw Error('碎片依赖形成循环');if(done.has(p.id))return;visiting.add(p.id);p.requires.forEach(id=>visit(pieceById.get(id)));visiting.delete(p.id);done.add(p.id);}L.pieces.forEach(visit);
    for(const z of L.zones){const n=L.pieces.filter(p=>p.segmentId===z.id).length;if(n<3||n>6)throw Error('每段必须定义 3–6 块拼图');}
    for(const v of Object.values(L.variants)){if(!v.completionPieceIds.every(id=>v.availablePieceIds.includes(id)&&ids.has(id)))throw Error('完成条件引用不可取得碎片');}if(L.variants.second.completionPieceIds.length!==L.pieces.length)throw Error('二周目必须要求全部拼图');}

  $('start-button').onclick=()=>{
    if(storedCandidate){showModal('重新开始这段回忆？','A NEW MEMORY','<p>本关已有存档。重新开始会替换当前配置的进度；也可以回到标题继续上次的回忆。</p>',[{label:'保留，继续上次',light:true,action:()=>{closeModal();save=storedCandidate;spawn();enter(true);}},{label:'确认重新开始',action:()=>{closeModal();enter(false);}}]);}
    else enter(false);
  };
  $('continue-button').onclick=()=>{save=storedCandidate;spawn();enter(true);};
  $('map-button').onclick=showMap;$('help-button').onclick=showHelp;$('pause-button').onclick=pause;$('story-close').onclick=closeStory;$('import-file').onchange=importSave;
  touchButtons.forEach(button=>{button.addEventListener('pointerdown',pressTouch);button.addEventListener('pointerup',releaseTouch);button.addEventListener('pointercancel',releaseTouch);button.addEventListener('lostpointercapture',releaseTouch);});
  document.addEventListener('click',event=>{const button=event.target.closest('[data-sfx]');if(button&&!button.disabled)playHostSfx(button.dataset.sfx);},true);
  $('game').addEventListener('click',advanceStoryPointer);
  window.addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',resize);window.addEventListener('keydown',onKeyDown);window.addEventListener('keyup',onKeyUp);
  window.addEventListener('pointermove',updateDrag);window.addEventListener('pointerup',finishDrag);window.addEventListener('pointercancel',cancelDrag);
  const onVisibility=()=>{if(document.hidden)loseFocus();},onPageHide=()=>{if(active)persist();};
  window.addEventListener('blur',loseFocus);document.addEventListener('visibilitychange',onVisibility);
  window.addEventListener('pagehide',onPageHide);
  window.MemoryPuzzle={
    start(input={},provided){if(disposed)throw Error('关卡已释放，请重新加载资源');loadContext(input,provided);enter(Boolean(storedCandidate));return snapshot();},
    getSaveData:snapshot,
    setHostPaused(value){hostPaused=!!value;clearInputs();cancelDrag();if(hostPaused)persist();},
    inspect(){return {state,variantId:variant.id,player:{...player},camera,cameraY,puzzleFlags:{...save.puzzleFlags},revealedPickupIds:availablePieces().filter(p=>ready(p)&&save.pieceStates[p.id]==='uncollected').map(p=>p.id),placed:placedCount(),inventory:availablePieces().filter(p=>save.pieceStates[p.id]==='inventory').map(p=>p.id),canComplete:canComplete(),diagnostics:{...diagnostics},transitions:[...transitions]};},
    dispose(){persist();disposed=true;active=false;cancelDrag();clearInputs();clearTimeout(toastTimer);window.removeEventListener('keydown',onKeyDown);window.removeEventListener('keyup',onKeyUp);window.removeEventListener('pointermove',updateDrag);window.removeEventListener('pointerup',finishDrag);window.removeEventListener('pointercancel',cancelDrag);window.removeEventListener('blur',loseFocus);window.removeEventListener('resize',resize);window.visualViewport?.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',onVisibility);window.removeEventListener('pagehide',onPageHide);$('game').removeEventListener('click',advanceStoryPointer);touchButtons.forEach(button=>{button.removeEventListener('pointerdown',pressTouch);button.removeEventListener('pointerup',releaseTouch);button.removeEventListener('pointercancel',releaseTouch);button.removeEventListener('lostpointercapture',releaseTouch);});for(const id of ['start-button','continue-button','help-button','map-button','pause-button','story-close'])$(id).onclick=null;$('import-file').onchange=null;}
  };
  try{validateLevel();buildAtlas();loadContext(window.MEMORY_GAME_CONTEXT||{});resize();requestAnimationFrame(()=>{resize();requestAnimationFrame(frame);});}
  catch(e){diagnostics.errors.push(String(e));$('cover').hidden=true;showModal('这段记忆暂时打不开','LOAD ERROR',`<p>${e.message}</p><p>请检查配置与本地文件是否完整。</p>`,[]);console.error(e);}
})();
