# 再来一次 · Once Again

Phase 1 browser narrative game based on the supplied PRD. JavaScript, Phaser 3.90, Vite 5.4. No server or account required.

For music, art, and copy requirements, see [`docs/ASSET_STORY_REQUIREMENTS.md`](docs/ASSET_STORY_REQUIREMENTS.md) and the [`story.json` copy template](docs/story.template.json).

The page displays only the borderless game stage. All scenes share a 1280×720 coordinate space and scale proportionally to fit the viewport. Home, help, settings and fullscreen controls are inside the game; there is no surrounding navigation, chapter gallery or footer.

## Run

```sh
npm install
npm run dev
```

`npm run build` creates the static `dist/` deployment. `npm test` verifies save fallback, progression, all ending routes, and story references. `npm run generate:assets` regenerates placeholder chapter backgrounds.

## Preview scope

- Title, screenplay-driven prologue, four chapters, first-run return-to-title beat, second journey, three ending routes and ending cards.
- Chapter 1 uses the supplied **数字勇者** games: the first journey climbs toward a stronger summit Boss and completes its memory after defeat; later journeys can obtain the courage sword and defeat the Boss. The supplied climbing update uses A/D or arrow keys to steer, W/S to adjust speed, and mouse movement to steer. Touch controls provide on-screen steering and speed buttons. P or the pause button pauses. Saves retain height, lane, power, collected items and cleared obstacles. The first journey ends at the stronger summit Boss; later journeys can collect gold and the courage sword before facing the Boss.
- Chapter 2 is a playable top-down survival game: automatic targeting, moving enemy swarms, four hiding areas, solid projectile-blocking walls, three 22-second waves, three distinct random item selections (three choices from a nine-item pool), and a final boss with telegraphed ring projectiles and a targeted blast. Foliage hiding stops attacks, breaks targeting and heals, but uses limited breath and does not grant invulnerability. WASD/arrows move; hold Space in foliage to hide. Touch players can hold/drag on the arena to move and toggle hiding with the bottom-right button. Death offers a fresh run; defeating the boss unlocks the chapter's closing dialogue. Both journeys support this game. Leaving during combat restarts the run when continued.
- Chapter 3 is story only. Each journey follows its original youth screenplay directly into the later story; the former departure minigame and its outcome branches have been removed. Old saves stopped inside that game migrate to the youth dialogue entrance, while current dialogue positions and other chapters remain available.
- Chapter 4 uses the supplied **拾光 v0.2** project: layered platform exploration, scene-piece restoration, station signal puzzle, key and exit. The first journey requires 11 route pieces and keeps three visual gaps; the second requires all 14 pieces placed. Both preserve checkpoint progress. See [integration, journey rules and save compatibility](docs/SHIGUANG.md). Builds include the replacement in `dist/memory-puzzle-offline.html` for offline first-journey play.
- Red curtain transition, typewriter dialogue, optional dialogue choices, local saves with in-memory fallback, reset, audio settings, fullscreen.
- Story dialogue follows the supplied **《再来一次——完整剧情剧本 v0.1》**: all 41 scripted scenes and 575 dialogue boxes are in `public/data/story.json`. The first journey ends at the old house and returns to the title, where “开始新游戏” becomes “再来一次”. The later journey continues into the complete-puzzle revelations and offers Bad Ending《再来一次》, Another Ending《留下》 and True Ending《还没结束》. Each route gets its own scene sequence and closing effect. Stage directions remain presentation guidance; this build uses the available illustrations, transitions and CSS effects rather than claiming final CG or recorded audio.
- The 39 story illustrations from `替换图片.docx` are optimized as WebP and mapped to their dialogue ranges separately for each journey. See [illustration mapping](docs/ILLUSTRATION_REPLACEMENTS.md).
- The title uses a warm illustrated room. Background music loops after the first click or keypress, follows the music volume setting, and continues across scenes using the same track. The three supplied button sounds provide restrained menu, confirmation and chapter-completion feedback, with independent volume control and repeat limits.

## Background music

The supplied `mondamusic-game-game-music-529603(1).mp3` remains the title/default track. The five additional tracks are assigned in `public/data/music.json`: `躲藏游戏机` for the prologue, `吃豆人？` for Chapter 1, `夜庭` for Chapter 2, `收拾东西站台` for Chapter 3, and `回忆拼图平板跳跃 截取` for Chapter 4.

Edit `public/data/music.json` to assign music by scene. `default` is the fallback track; a `null` scene entry uses that default. Paths are relative to `public/` and work when hosted under a subdirectory, such as `/once-again/`.

To replace chapter music, place the new MP3 in `public/assets/audio/` and change the corresponding entry, for example:

```json
"ch1": "assets/audio/bgm_ch1_childhood.mp3"
```

The chapter's introduction, minigame and closing dialogue share the selected track. Both playthroughs use the same chapter entry. Switching to a different track starts it from the beginning; moving between scenes assigned the same track preserves playback position.

## Replace content

`public/data/story.json` contains the screenplay dialogue, separated into scene keys. `public/data/scenes.json` specifies which sections precede or follow each minigame and which ending branches unlock. `docs/story.template.json` mirrors the playable copy. `public/data/manifest.json` points to replaceable chapter backgrounds.

Chapter routing from `scenes.json` is bundled with the application during `npm run build`. Rebuild and redeploy after editing it. This keeps minigame IDs synchronized with their implementation, even if a browser or CDN retains an older public JSON file. Story, manifest and music requests bypass the browser cache.

Save key: `zlyc_save_v1`. **Continue opens the story tree**, with independent trees for the first and later journeys. The later-journey tab stays hidden until the first journey is complete. Only visited sections, gameplay checkpoints and ending branches appear. Dialogue lines in the same screenplay section share one concise entry, restoring its last visited line (or the exact current line for the current section). Unvisited nodes are hidden and rejected by the save manager. Selecting a node restores its exact dialogue cursor, choices and minigame checkpoint; achievements, volume settings and both trees' unlock history are retained. The three screenplay endings appear as separate branches and only unlock when visited. Tree navigation itself does not change the save. New games and clearing saves reset both trees.

Old saves are migrated automatically: the saved dialogue/gameplay position is preserved, compulsory earlier nodes are reconstructed, and future nodes and unchosen endings stay locked. Inferred earlier nodes restart their section, since older saves did not store historical choices or checkpoints. Chapter 2 restarts combat, while chapters 1 and 4 retain detailed checkpoints and chapter 3 retains its dialogue cursor. Saves from the former Chapter 1 maze start the new game at its entrance. Saves from the removed chapter-three game migrate to the youth dialogue; other chapters and ending unlocks remain available. See [story tree and save rules](docs/STORY_TREE.md). The terminal three-option menu determines the ending; dialogue choices can set flags for future content. The PRD does not define detailed plot text or all branch rules; this build follows the supplied screenplay for dialogue and ending routes.

## 旅途成就

主页显示五枚成就徽章，未解锁为灰色、已解锁为暖金色；点击查看名称与条件。达成时出现一次轻提示。成就独立保存在 `zlyc_achievements_v1`，跨周目、重新开局、剧情节点回溯和清除剧情存档保留；浏览器清除网站数据会同时移除成就。

- **勇往直前**：数字勇者有停顿障碍的一周目，走到结尾且从未碰到「以后再说」障碍。碰撞记录随小游戏存档保存；旧存档会从障碍命中记录恢复，记录不足时不补发。二周目没有该障碍，不自动授予。
- **妈妈我怕黑**：夜庭死亡一次，即刻解锁。
- **因为太怕痛所以把防御力点满了**：夜庭一整局从三波战斗到击败 Boss 没受过伤害。治疗不能抹去受伤记录，重试开启新的挑战。
- **into the rabbit hole**：拾光实际掉入地图深处；手动按 R 返回安全点不计入。
- **离经叛道**：在拾光的信号灯谜题中按错点亮顺序。
