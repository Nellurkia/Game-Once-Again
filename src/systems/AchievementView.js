import {ACHIEVEMENTS} from '../core/Achievements.js';
const drawings={
 arrow:'<path d="M12 21V3m-7 7 7-7 7 7"/>',
 moon:'<path d="M20 15A9 9 0 0 1 9 3a9 9 0 1 0 11 12Z"/>',
 shield:'<path d="m12 2 8 3v6c0 5-5 9-8 11-3-2-8-6-8-11V5l8-3Z"/><path d="m8 12 3 3 5-6"/>',
 hole:'<ellipse cx="12" cy="18" rx="9" ry="4"/><path d="M12 2v14m-4-4 4 4 4-4"/>',
 lights:'<path d="M4 17V7m8 10V3m8 14V9M1 21h22"/><circle cx="4" cy="7" r="2"/><circle cx="12" cy="3" r="2"/><circle cx="20" cy="9" r="2"/>',
};
const badge=icon=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${drawings[icon]}</svg>`;
export function achievementHomeMarkup(store){
 return `<div class="title-achievements" aria-label="旅途成就"><button class="achievement-heading" data-achievements data-sfx="select">旅途成就 <span>${store.count} / ${ACHIEVEMENTS.length} · 查看</span></button><div class="achievement-home-list">${ACHIEVEMENTS.map(item=>`<button class="achievement-mini ${store.isUnlocked(item.id)?'unlocked':'locked'}" data-achievements data-sfx="select" aria-label="${item.name}，${store.isUnlocked(item.id)?'已解锁':'未解锁'}">${badge(item.icon)}<span>${item.name}</span></button>`).join('')}</div></div>`;
}
export function achievementDialogMarkup(store){
 return `<div class="achievement-dialog"><span class="eyebrow">MOMENTS TO KEEP</span><h2>旅途成就 <small>${store.count} / ${ACHIEVEMENTS.length}</small></h2><p>成就会留在这个浏览器中，跨周目与新的旅程保留。</p><div class="achievement-list">${ACHIEVEMENTS.map(item=>`<article class="achievement-card ${store.isUnlocked(item.id)?'unlocked':'locked'}">${badge(item.icon)}<div><small>${item.game} · ${store.isUnlocked(item.id)?'已解锁':'未解锁'}</small><h3>${item.name}</h3><p>${item.description}</p></div></article>`).join('')}</div></div>`;
}
const queue=[];let showing=false;
export function notifyAchievement(item){queue.push(item);if(!showing)showNext();}
function showNext(){
 const item=queue.shift();if(!item){showing=false;return;}showing=true;
 const toast=document.createElement('aside');toast.className='achievement-toast';toast.setAttribute('role','status');
 toast.innerHTML=`${badge(item.icon)}<div><span>成就解锁</span><strong>${item.name}</strong></div>`;document.body.append(toast);
 setTimeout(()=>{toast.remove();showNext();},4200);
}
