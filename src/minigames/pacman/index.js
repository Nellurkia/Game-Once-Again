import {register} from '../index.js';
register('pacman',{create(scene,config,onComplete){
 const map=['###############','#.....#.......#','#.###.#.###.#.#','#.#.......#...#','#.#.#####.#.#.#','#...#...#...#.#','###.#.#.###.#.#','#.....#.......#','###############'];
 const size=51,ox=258,oy=124,grid=scene.add.graphics();let px=1,py=1,ended=false,score=0,last=0;const dots=new Map(),ghosts=[{x:11,y:3},{x:5,y:7}];
 map.forEach((row,y)=>[...row].forEach((cell,x)=>{if(cell==='#'){grid.fillStyle(0x303d53);grid.fillRoundedRect(ox+x*size,oy+y*size,size-5,size-5,8);grid.lineStyle(1,0x53627b,.6);grid.strokeRoundedRect(ox+x*size,oy+y*size,size-5,size-5,8);}else{const d=scene.add.circle(ox+x*size+23,oy+y*size+23,3,0xc6b6a0);dots.set(`${x},${y}`,d);}}));
 const target=config.goal==='parents_room'?{x:13,y:1}:{x:13,y:7};scene.add.rectangle(ox+target.x*size+23,oy+target.y*size+23,34,34,config.powerPellet?0x9fc4b0:0xd7b48a,.3).setStrokeStyle(2,0xd8c4a8);scene.add.text(ox+target.x*size+23,oy+target.y*size+22,'⌂',{fontSize:'25px',color:'#efe2c6'}).setOrigin(.5);
 const player=scene.add.circle(ox+size+23,oy+size+23,14,0xf1d4a0);const eyes=ghosts.map(g=>scene.add.circle(ox+g.x*size+23,oy+g.y*size+23,13,PhaserColor(config.ghostColor),.85));
 const counter=scene.add.text(640,70,config.label,{fontFamily:'sans-serif',fontSize:'22px',color:'#e3ded7'}).setOrigin(.5);scene.add.text(640,631,'方向键 / WASD 移动 · 收集至少 5 枚记忆，再抵达亮起的房间',{fontFamily:'sans-serif',fontSize:'17px',color:'#9da7b5'}).setOrigin(.5);
 const walk=(x,y)=>map[y]?.[x]==='.';
 const move=(dx,dy)=>{if(ended||!walk(px+dx,py+dy))return;px+=dx;py+=dy;player.setPosition(ox+px*size+23,oy+py*size+23);const key=`${px},${py}`;if(dots.has(key)){dots.get(key).destroy();dots.delete(key);score++;}if(px===target.x&&py===target.y){if(score>=5){ended=true;onComplete({success:true,score,flags:{saidFear:!!config.powerPellet}});}else counter.setText(`还需要 ${5-score} 枚记忆碎片`);}collision();};
 function collision(){if(!config.powerPellet&&ghosts.some(g=>g.x===px&&g.y===py)){px=1;py=1;player.setPosition(ox+size+23,oy+size+23);counter.setText('没关系，再试一次。记忆碎片仍然保留。');}}
 const keyHandler=e=>{const keys={ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1],ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0]};if(keys[e.key]){e.preventDefault();if(Date.now()-last>95){last=Date.now();move(...keys[e.key]);}}};window.addEventListener('keydown',keyHandler);
 const step=scene.time.addEvent({delay:650,loop:true,callback:()=>{if(ended)return;ghosts.forEach((g,i)=>{const opts=[[0,1],[0,-1],[1,0],[-1,0]].filter(([dx,dy])=>walk(g.x+dx,g.y+dy));if(opts.length){const [dx,dy]=opts[Math.floor(Math.random()*opts.length)];g.x+=dx;g.y+=dy;eyes[i].setPosition(ox+g.x*size+23,oy+g.y*size+23);}});collision();}});
 return {move,destroy(){ended=true;step.remove();window.removeEventListener('keydown',keyHandler);}};
}});
function PhaserColor(hex){return parseInt(hex.replace('#',''),16);}
