import {build} from 'vite';
import {readFile,writeFile} from 'node:fs/promises';
await build();
const root='public/minigames/shiguang/';
let html=await readFile(root+'index.html','utf8');
let css=await readFile(root+'style.css','utf8');
const background=(await readFile(root+'assets/home-reference.png')).toString('base64');
css=css.replace(/assets\/home-reference\.png/g,`data:image/png;base64,${background}`);
html=html.replace('<link rel="stylesheet" href="style.css">',()=>`<style>${css}</style>`);
for(const file of ['config.js','level-data.js','game.js']){
 const code=(await readFile(root+file,'utf8')).replace(/<\/script/gi,'<\\/script');
 html=html.replace(`<script src="${file}"></script>`,()=>`<script>${code}</script>`);
}
await writeFile('dist/memory-puzzle-offline.html',html,'utf8');
console.log('Built dist/memory-puzzle-offline.html (Shiguang v0.2, self-contained first journey).');
