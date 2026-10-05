import {build} from 'vite';
import {resolve} from 'node:path';
import {writeFile} from 'node:fs/promises';

await build();
// Self-contained file:// delivery of the same puzzle; no fetch, remote font or external asset.
const bundle=await build({configFile:false,publicDir:false,logLevel:'warn',build:{write:false,lib:{entry:resolve('standalone/memory-puzzle.js'),name:'MemoryPuzzleOffline',formats:['iife']}}});
const output=Array.isArray(bundle)?bundle[0]:bundle;
const code=output.output.find(file=>file.type==='chunk').code.replace(/<\/script/gi,'<\\/script');
const html=`<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>旧时光 · 回忆拼图（离线版）</title><style>html,body{margin:0;width:100%;height:100%;background:#302c26;overflow:hidden}body{display:flex;align-items:center;justify-content:center}#game{width:min(100vw,177.777778vh);aspect-ratio:16/9}#status{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}</style></head><body><main id="game"></main><span id="status" aria-live="polite"></span><script>${code}</script></body></html>`;
await writeFile(resolve('dist/memory-puzzle-offline.html'),html,'utf8');
console.log('Built dist/memory-puzzle-offline.html (self-contained, first journey).');
