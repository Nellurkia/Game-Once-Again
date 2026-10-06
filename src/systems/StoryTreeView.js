import {buildStoryTree} from '../core/StoryTree.js';

export function mountStoryTree(element,{manager,scenes,story,onSelect,onClose}){
 let playthrough=manager.state.playthrough;
 function draw(){
  const {groups,nodes}=buildStoryTree(scenes,story,playthrough);
  const archive=manager.state.storyTrees?.[playthrough]||{nodes:{},lastNodeId:null};
  const unlocked=nodes.filter(node=>archive.nodes[node.id]).length;
  element.innerHTML=`<section class="story-tree-scene" aria-label="剧情树"><header class="story-tree-heading"><span class="eyebrow">THE MEMORY TREE</span><h2>沿着记忆，回到那一刻。</h2><p>左右滑动浏览，选择已亮起的节点继续故事。尚未走到的记忆，会在旅途中解锁。</p></header><div class="story-tree-toolbar"><div class="story-tree-tabs" role="tablist" aria-label="选择周目剧情树"><button id="tree-first" role="tab" aria-selected="${playthrough===1}">一周目 · 最初的记忆</button><button id="tree-later" role="tab" aria-selected="${playthrough===2}">非一周目 · 另一个答案</button></div><div class="story-tree-navigation"><button id="tree-prev" aria-label="向前浏览剧情树">←</button><span class="story-tree-count">已解锁 ${unlocked} / ${nodes.length} 个节点</span><button id="tree-next" aria-label="向后浏览剧情树">→</button></div></div><div class="story-tree-map" role="tabpanel" tabindex="0" aria-label="${playthrough===1?'一周目':'非一周目'}剧情节点"><div class="story-tree-path"></div></div><footer class="story-tree-footer"><button class="secondary" id="tree-back">返回开始界面</button><p>${unlocked?'每个节点保留当时的对白、选择和小游戏进度。':'这棵剧情树尚未开启。走完一周目后，可以进入新的记忆。'}</p><button class="primary" id="tree-resume" ${archive.nodes[archive.lastNodeId]?'':'disabled'}>从上次位置继续 →</button></footer></section>`;
  const path=element.querySelector('.story-tree-path');
  function appendNode(parent,node){
   const unlocked=!!archive.nodes[node.id];
   const button=document.createElement('button');
   button.className=`story-tree-node ${unlocked?'unlocked':'locked'} ${node.id===archive.lastNodeId?'current':''}`;
   button.dataset.nodeId=node.id;
   button.disabled=!unlocked;
   button.setAttribute('aria-label',`${node.title} · ${unlocked?'已解锁':'未解锁'}`);
   if(node.id===archive.lastNodeId)button.setAttribute('aria-current','step');
   const status=document.createElement('span');status.className='story-tree-node-status';status.textContent=unlocked?(node.id===archive.lastNodeId?'上次位置':node.kind==='game'?'小游戏':'已解锁'):'尚未解锁';
   const title=document.createElement('strong');title.textContent=node.title;
   const description=document.createElement('small');description.textContent=unlocked?node.description:'沿着故事前进，让这段记忆亮起来。';
   button.append(status,title,description);
   button.onclick=()=>onSelect(playthrough,node.id,node.title);
   parent.append(button);
  }
  for(const group of groups){
   const column=document.createElement('section');column.className=`story-tree-group ${group.branches.length?'with-branches':''}`;
   column.dataset.branches=String(group.branches.length);
   const heading=document.createElement('h3');heading.textContent=group.title;
   const subtitle=document.createElement('p');subtitle.textContent=group.subtitle;
   const list=document.createElement('div');list.className='story-tree-node-list';
   column.append(heading,subtitle,list);group.nodes.forEach(node=>appendNode(list,node));
   if(group.branches.length){
    const branches=document.createElement('div');branches.className='story-tree-branches';
    for(const branch of group.branches){
     const branchList=document.createElement('div');branchList.className='story-tree-node-list';
     const label=document.createElement('span');label.className='story-tree-branch-label';label.textContent=branch.label||branch.id;branchList.append(label);
     branch.nodes.forEach(node=>appendNode(branchList,node));branches.append(branchList);
    }
    column.append(branches);
   }
   path.append(column);
  }
  const map=element.querySelector('.story-tree-map');
  for(const [id,direction] of [['tree-prev',-1],['tree-next',1]])element.querySelector('#'+id).onclick=()=>map.scrollBy({left:direction*484,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  element.querySelector('#tree-first').onclick=()=>{playthrough=1;draw();};
  element.querySelector('#tree-later').onclick=()=>{playthrough=2;draw();};
  element.querySelector('#tree-back').onclick=onClose;
  element.querySelector('#tree-resume').onclick=()=>onSelect(playthrough,archive.lastNodeId,'回到上次的记忆');
  element.querySelector('.story-tree-node.current')?.scrollIntoView({block:'nearest',inline:'center'});
 }
 draw();
}
