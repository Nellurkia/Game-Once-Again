import {buildStoryTree} from '../core/StoryTree.js';

export function mountStoryTree(element,{manager,scenes,story,onSelect,onClose}){
 const laterAvailable=!!manager.state.flags.firstJourneyComplete||manager.state.playthrough===2||Object.keys(manager.state.storyTrees?.[2]?.nodes||{}).length>0;
 let playthrough=laterAvailable?manager.state.playthrough:1;
 function draw(){
  const {groups}=buildStoryTree(scenes,story,playthrough);
  const archive=manager.state.storyTrees?.[playthrough]||{nodes:{},lastNodeId:null};
  // Keep exact dialogue snapshots; show one entry per visited screenplay section.
  function visibleNodes(nodes){
   const sections=new Map();
   for(const node of nodes){
    if(!archive.nodes[node.id])continue;
    const key=node.kind==='dialogue'?node.sceneProgress.storyKey:node.id;
    const previous=sections.get(key);
    if(previous?.id===archive.lastNodeId)continue;
    sections.set(key,node);
   }
   return [...sections.values()];
  }
  const visibleGroups=groups.map(group=>({...group,nodes:visibleNodes(group.nodes),branches:group.branches.map(branch=>({...branch,nodes:visibleNodes(branch.nodes)})).filter(branch=>branch.nodes.length)})).filter(group=>group.nodes.length||group.branches.length);
  element.innerHTML=`<section class="story-tree-scene" aria-label="剧情树"><header class="story-tree-heading"><h2>回到记忆中的那一刻</h2><p>选择一段已走过的故事，继续旅程。</p></header><div class="story-tree-toolbar"><div class="story-tree-tabs" role="tablist" aria-label="选择周目剧情树"><button id="tree-first" role="tab" aria-selected="${playthrough===1}">一周目</button>${laterAvailable?`<button id="tree-later" role="tab" aria-selected="${playthrough===2}">非一周目</button>`:''}</div><div class="story-tree-navigation"><button id="tree-prev" aria-label="向前浏览剧情树">←</button><button id="tree-next" aria-label="向后浏览剧情树">→</button></div></div><div class="story-tree-map" role="tabpanel" tabindex="0" aria-label="${playthrough===1?'一周目':'非一周目'}剧情节点"><div class="story-tree-path"></div></div><footer class="story-tree-footer"><button class="secondary" id="tree-back">返回开始界面</button><button class="primary" id="tree-resume" ${archive.nodes[archive.lastNodeId]?'':'disabled'}>从上次位置继续 →</button></footer></section>`;
  const path=element.querySelector('.story-tree-path');
  function nodeLabel(node){
   const scriptTitle=story.sectionTitles?.[node.sceneProgress?.storyKey];
   return node.kind==='dialogue'?(scriptTitle?.replace(/^.*?·\s*/,'')||node.title.replace(/\s*·\s*\d+$/,'')):node.title;
  }
  function appendNode(parent,node){
   const button=document.createElement('button');
   button.className=`story-tree-node unlocked ${node.id===archive.lastNodeId?'current':''}`;
   button.dataset.sfx='select';
   button.dataset.nodeId=node.id;
   const label=nodeLabel(node);
   button.textContent=label;
   button.setAttribute('aria-label',label+(node.id===archive.lastNodeId?'，上次位置':''));
   if(node.id===archive.lastNodeId)button.setAttribute('aria-current','step');
   button.onclick=()=>onSelect(playthrough,node.id,label);
   parent.append(button);
  }
  for(const group of visibleGroups){
   const column=document.createElement('section');column.className='story-tree-group';
   const heading=document.createElement('h3');heading.textContent=group.title;
   const list=document.createElement('div');list.className='story-tree-node-list';
   column.append(heading,list);group.nodes.filter(node=>!node.afterBranches).forEach(node=>appendNode(list,node));
   for(const branch of group.branches){
    const branchList=document.createElement('div');branchList.className='story-tree-node-list story-tree-visited-branch';
    const label=document.createElement('span');label.className='story-tree-branch-label';label.textContent=branch.label||branch.title||branch.id;
    if(branch.nodes.length!==1||nodeLabel(branch.nodes[0])!==label.textContent)branchList.append(label);
    branch.nodes.forEach(node=>appendNode(branchList,node));column.append(branchList);
   }
   const following=group.nodes.filter(node=>node.afterBranches);
   if(following.length){const joinedList=document.createElement('div');joinedList.className='story-tree-node-list';following.forEach(node=>appendNode(joinedList,node));column.append(joinedList);}
   path.append(column);
  }
  if(!visibleGroups.length){const note=document.createElement('p');note.className='story-tree-empty';note.textContent='这里还没有留下记忆。';path.append(note);}
  const map=element.querySelector('.story-tree-map');
  for(const [id,direction] of [['tree-prev',-1],['tree-next',1]])element.querySelector('#'+id).onclick=()=>map.scrollBy({left:direction*310,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  element.querySelector('#tree-first').onclick=()=>{playthrough=1;draw();};
  const later=element.querySelector('#tree-later');if(later)later.onclick=()=>{playthrough=2;draw();};
  element.querySelector('#tree-back').onclick=onClose;
  element.querySelector('#tree-resume').onclick=()=>onSelect(playthrough,archive.lastNodeId,'回到上次的记忆');
  element.querySelector('.story-tree-node.current')?.scrollIntoView({block:'nearest',inline:'center'});
 }
 draw();
}
