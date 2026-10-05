import {register} from './index.js';
for(const [id,name,symbol] of [['runner','人生跑酷','↗'],['puzzle','关系拼图','◇']])register(id,{create(scene,config,onComplete){
 scene.add.text(640,215,symbol,{fontSize:'80px',color:'#c9b7d8'}).setOrigin(.5);scene.add.text(640,328,name,{fontFamily:'sans-serif',fontSize:'32px',color:'#ede5db'}).setOrigin(.5);scene.add.text(640,385,config.label,{fontFamily:'sans-serif',fontSize:'22px',color:'#b6b7c4'}).setOrigin(.5);const count=scene.add.text(640,483,'章节框架预览 · 3 秒后继续',{fontFamily:'sans-serif',fontSize:'17px',color:'#838e9f'}).setOrigin(.5);
 if(id==='puzzle'){scene.add.rectangle(640,438,240,6,0x354155);scene.add.rectangle(580,438,120,6,0xb9a8cd);}
 let seconds=3;const t=scene.time.addEvent({delay:1000,repeat:2,callback:()=>{seconds--;count.setText(`章节框架预览 · ${seconds} 秒后继续`);if(!seconds)onComplete({success:true,score:0,flags:{}});}});return {destroy(){t.remove();}};
}});
