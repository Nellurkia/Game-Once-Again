import {mkdir,writeFile} from 'node:fs/promises';
await mkdir(new URL('../public/assets/',import.meta.url),{recursive:true});
for(let n=1;n<=4;n++)await writeFile(new URL(`../public/assets/ch${n}_bg.svg`,import.meta.url),`<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><rect width="1280" height="720" fill="#1a2333"/><text x="32" y="688" fill="#697588" font-family="monospace" font-size="12">ch${n}_bg.svg · PLACEHOLDER</text></svg>`);
console.log('Generated 4 replaceable chapter backgrounds.');
