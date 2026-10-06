// Shared keyboard, pointer and touch controls for the two supplied worlds.
window.createNumberHeroControls=function({canvas,getYaw,setYaw}){
 const keys={},touch={x:0,y:0},velocity={x:0,y:0};let started=false,manualPause=false,hostPaused=false,disposed=false,lookId=null,lastX=0,joyId=null;
 const abort=new AbortController(),listen=(target,event,fn)=>target.addEventListener(event,fn,{signal:abort.signal});
 const style=document.createElement('style');style.textContent=`
 html,body{cursor:auto!important;touch-action:none;overscroll-behavior:none}
 canvas{touch-action:none}#lock{display:none!important}
 #hero-pause{position:fixed;left:20px;top:116px;z-index:18;padding:10px 16px;border:1px solid #7fe39a66;border-radius:8px;background:#101b22dc;color:#e5dbbc;cursor:pointer}
 #hero-guide{position:fixed;inset:0;z-index:45;display:flex;align-items:center;justify-content:center;background:#050912c9;backdrop-filter:blur(3px)}
 #hero-guide[hidden]{display:none}#hero-guide .hero-panel{max-width:610px;text-align:center;padding:34px;background:#111c27;border:1px solid #bba77888;border-radius:16px;color:#e7dbc0;line-height:2}
 #hero-guide h2{font-size:27px;margin-bottom:12px}#hero-guide p{font-size:15px;margin:10px 0 22px}#hero-start{padding:13px 35px;border:1px solid #d8bf85;border-radius:9px;background:#d8bf85;color:#16202b;font:inherit;cursor:pointer}
 #hero-stick{display:none;position:fixed;bottom:32px;left:35px;width:140px;height:140px;border-radius:50%;background:#e4d4a323;border:2px solid #e4d4a34d;z-index:19;touch-action:none}
 #hero-knob{position:absolute;left:43px;top:43px;width:50px;height:50px;border-radius:50%;background:#e4d4a399;pointer-events:none}
 #hero-look{display:none;position:fixed;right:36px;bottom:34px;color:#e4d4a3;pointer-events:none;font-size:13px;background:#10202cb0;padding:12px;border-radius:9px;z-index:17}
 .box{max-height:calc(100vh - 36px);overflow:auto}.embedded #c2{right:190px}.embedded #c1{top:18px}.embedded #c3,.embedded #hint{bottom:18px}
 @media(pointer:coarse){#hero-stick,#hero-look{display:block}#hint,#c3{display:none!important}}
 `;document.head.append(style);
 const pause=document.createElement('button');pause.id='hero-pause';pause.textContent='暂停 · P';
 const guide=document.createElement('section');guide.id='hero-guide';guide.innerHTML='<div class="hero-panel"><h2>数字勇者</h2><p>WASD / 方向键移动，Q / E 转向<br>按住鼠标拖动调整方向<br>手机：左侧摇杆移动，右侧滑动转向<br>靠近敌人自动交战，击败后获得力量</p><button id="hero-start">开始攀登</button></div>';
 const stick=document.createElement('div');stick.id='hero-stick';stick.setAttribute('aria-label','移动摇杆');stick.innerHTML='<div id="hero-knob"></div>';
 const hint=document.createElement('div');hint.id='hero-look';hint.textContent='右侧滑动 · 转向';document.body.append(pause,guide,stick,hint);
 const clear=()=>{for(const k in keys)keys[k]=false;touch.x=touch.y=velocity.x=velocity.y=0;joyId=lookId=null;stick.firstChild.style.transform='';};
 function show(){guide.hidden=started&&!manualPause&&!hostPaused;pause.textContent=manualPause?'继续 · P':'暂停 · P';guide.querySelector('h2').textContent=started?'攀登暂停':'数字勇者';guide.querySelector('p').hidden=started;guide.querySelector('button').textContent=started?'继续攀登':'开始攀登';guide.querySelector('button').disabled=hostPaused;}
 listen(guide.querySelector('button'),'click',()=>{started=true;manualPause=false;show();canvas.focus();});
 listen(pause,'click',()=>{manualPause=!manualPause;clear();show();});
 listen(window,'keydown',e=>{const k=e.key.toLowerCase();if(['p','escape'].includes(k)&&!e.repeat){manualPause=!manualPause;clear();show();e.preventDefault();return;}if(!started||manualPause||hostPaused)return;keys[k]=true;if(['w','a','s','d','q','e','arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();});
 listen(window,'keyup',e=>{keys[e.key.toLowerCase()]=false;});
 listen(window,'blur',()=>{if(started)manualPause=true;clear();show();});
 canvas.tabIndex=0;
 listen(canvas,'pointerdown',e=>{if(!started||manualPause||hostPaused||document.getElementById('modal')?.classList.contains('on'))return;if(e.pointerType==='touch'&&e.clientX<innerWidth*.42)return;lookId=e.pointerId;lastX=e.clientX;canvas.setPointerCapture(e.pointerId);canvas.focus();});
 listen(canvas,'pointermove',e=>{if(e.pointerId!==lookId)return;setYaw(getYaw()-(e.clientX-lastX)/innerWidth*3.8);lastX=e.clientX;});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])listen(canvas,event,()=>{lookId=null;});
 function moveStick(e){const b=stick.getBoundingClientRect(),dx=e.clientX-(b.left+b.width/2),dy=e.clientY-(b.top+b.height/2),l=Math.hypot(dx,dy),radius=b.width*.34,scale=Math.max(radius,l);touch.x=dx/scale;touch.y=-dy/scale;if(l<radius*.14)touch.x=touch.y=0;stick.firstChild.style.transform=`translate(${touch.x*radius}px,${-touch.y*radius}px)`;}
 listen(stick,'pointerdown',e=>{if(!started||manualPause||hostPaused)return;joyId=e.pointerId;stick.setPointerCapture(e.pointerId);moveStick(e);});
 listen(stick,'pointermove',e=>{if(joyId===e.pointerId)moveStick(e);});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])listen(stick,event,()=>{joyId=null;touch.x=touch.y=0;stick.firstChild.style.transform='';});
 show();
 return {keys,get paused(){return disposed||!started||manualPause||hostPaused;},begin(){started=true;manualPause=false;show();},setHostPaused(value){hostPaused=!!value;if(hostPaused)clear();show();},clear,
  move(dt){let x=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0)+touch.x,y=(keys.w||keys.arrowup?1:0)-(keys.s||keys.arrowdown?1:0)+touch.y;const length=Math.hypot(x,y);if(length>1){x/=length;y/=length;}const k=1-Math.exp(-dt*22);velocity.x+=(x-velocity.x)*k;velocity.y+=(y-velocity.y)*k;setYaw(getYaw()+((keys.q?1:0)-(keys.e?1:0))*2.1*dt);return {...velocity};},
  dispose(){disposed=true;abort.abort();clear();style.remove();pause.remove();guide.remove();stick.remove();hint.remove();}
 };
};
