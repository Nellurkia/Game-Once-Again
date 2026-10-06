import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {AudioManager,resolveBgm} from '../src/systems/Audio.js';

function fixture(){
  const media={paused:true,volume:1,src:'',playCount:0,pause(){this.paused=true;},play(){this.playCount++;this.paused=false;return Promise.resolve();},removeAttribute(){this.src='';}};
  return {media,audio:new AudioManager({createAudio:()=>media,bgmVolume:.35})};
}
test('music waits for interaction, loops and keeps playing across scenes with the same track',()=>{
  const {media,audio}=fixture();
  audio.playBgm('./assets/audio/default.mp3');
  assert.equal(media.playCount,0);
  audio.unlock();
  assert.equal(media.paused,false);
  assert.equal(media.loop,true);
  assert.equal(media.volume,.35);
  media.currentTime=15;
  audio.playBgm('./assets/audio/default.mp3');
  assert.equal(media.currentTime,15);
  assert.equal(media.playCount,1);
  audio.setBgmVolume(0);
  assert.equal(media.volume,0);
  audio.playBgm('./assets/audio/ch1.mp3');
  assert.equal(media.src,'./assets/audio/ch1.mp3');
  assert.equal(media.playCount,2);
  audio.stopAll();
  assert.equal(media.paused,true);
  assert.equal(media.src,'');
});
test('blocked playback can retry on the next gesture without an unhandled rejection',async()=>{
  const {media,audio}=fixture();
  media.play=()=>Promise.reject(new Error('autoplay blocked'));
  audio.playBgm('./default.mp3');
  audio.unlock();
  await Promise.resolve();
  assert.equal(media.paused,true);
  media.play=()=>{media.paused=false;return Promise.resolve();};
  audio.unlock();
  assert.equal(media.paused,false);
});
test('chapter overrides and default music resolve under a deployment subdirectory',()=>{
  const config=JSON.parse(readFileSync(new URL('../public/data/music.json',import.meta.url)));
  assert.ok(existsSync(new URL('../public/'+config.default,import.meta.url)));
  assert.equal(resolveBgm(config,'ch1','/once-again/'),'/once-again/assets/audio/bgm_ch1_pacman.mp3');
  config.scenes.ch1='assets/audio/childhood.mp3';
  assert.equal(resolveBgm(config,'ch1','/once-again/'),'/once-again/assets/audio/childhood.mp3');
  assert.equal(resolveBgm(config,'ch2','/once-again/'),'/once-again/assets/audio/bgm_ch2_night-garden.mp3');
  assert.equal(resolveBgm(config,'unconfigured-scene','/once-again/'),'/once-again/assets/audio/bgm_default.mp3');
});
