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
- Chapter 1 uses the supplied **数字勇者** games: the first journey climbs toward a stronger summit Boss and completes its memory after defeat; later journeys can obtain the courage sword and defeat the Boss. WASD/arrows move, Q/E turn, mouse drag turns the camera; touch uses a left joystick and right-side swipe. P/Esc or the pause button pauses. Saves retain position, direction, power, defeated enemies, sword and completion state. The original worlds remain separate, with Three.js bundled locally.
- Chapter 2 is a playable top-down survival game: automatic targeting, moving enemy swarms, four hiding areas, solid projectile-blocking walls, three 22-second waves, three distinct random item selections (three choices from a nine-item pool), and a final boss with telegraphed ring projectiles and a targeted blast. Foliage hiding stops attacks, breaks targeting and heals, but uses limited breath and does not grant invulnerability. WASD/arrows move; hold Space in foliage to hide. Touch players can hold/drag on the arena to move and toggle hiding with the bottom-right button. Death offers a fresh run; defeating the boss unlocks the chapter's closing dialogue. Both journeys support this game. Leaving during combat restarts the run when continued.
- Chapter 3, **出门之前**, is a youth narrative exploration game: prepare key/pass and up to two optional items, respond to A, weigh visible time costs, choose stairs/elevator/shop routes, and reach the platform. The first journey replays the original missed departure; every non-first journey can leave by 19:00 and meet A before 19:30. Late attempts offer room/door/station checkpoints and an option to keep their outcome. Keyboard, touch and standard gamepads are supported. Saves retain location, action/route progress, replies, inventory and result dialogue. See [gameplay and integration](docs/BEFORE_DEPARTURE.md).
- Chapter 4 uses the supplied **拾光 v0.2** project: layered platform exploration, scene-piece restoration, station signal puzzle, key and exit. The first journey requires 11 route pieces and keeps three visual gaps; the second requires all 14 pieces placed. Both preserve checkpoint progress. See [integration, journey rules and save compatibility](docs/SHIGUANG.md). Builds include the replacement in `dist/memory-puzzle-offline.html` for offline first-journey play.
- Red curtain transition, typewriter dialogue, optional dialogue choices, local saves with in-memory fallback, reset, audio settings, fullscreen.
- Story dialogue follows the supplied **《再来一次——完整剧情剧本 v0.1》**: all 41 scripted scenes and 575 dialogue boxes are in `public/data/story.json`. The first journey ends at the old house and returns to the title, where “开始新游戏” becomes “再来一次”. The later journey continues into the complete-puzzle revelations and offers Bad Ending《再来一次》, Another Ending《留下》 and True Ending《还没结束》. Each route gets its own scene sequence and closing effect. Stage directions remain presentation guidance; this build uses the available illustrations, transitions and CSS effects rather than claiming final CG or recorded audio.
- The title uses a warm illustrated room. Background music loops after the first click or keypress, follows the music volume setting, and continues across scenes using the same track. Youth message notifications use synthesized tones; dedicated sound recordings remain optional.

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

Save key: `zlyc_save_v1`. **Continue opens the story tree**, with independent tabs for the first and every non-first journey. Each displayed dialogue line, gameplay checkpoint and visited ending line becomes a selectable node. Locked nodes remain disabled and are rejected by the save manager. Selecting a node restores its exact dialogue cursor, choices and minigame checkpoint; achievements, volume settings and both trees' unlock history are retained. The three screenplay endings appear as separate branches and only unlock when visited. Tree navigation itself does not change the save. New games and clearing saves reset both trees.

Old saves are migrated automatically: the saved dialogue/gameplay position is preserved, compulsory earlier nodes are reconstructed, and future nodes and unchosen endings stay locked. Inferred earlier nodes restart their section, since older saves did not store historical choices or checkpoints. Chapter 2 restarts combat, while chapters 1, 3 and 4 retain detailed checkpoints. Saves from the former Chapter 1 maze start the new game at its entrance. Saves from the former chapter-three game migrate to the new introduction; other chapters and ending unlocks remain available. See [story tree and save rules](docs/STORY_TREE.md). The terminal three-option menu determines the ending; dialogue choices can set flags for future content. The PRD does not define detailed plot text or all branch rules; this build follows the supplied screenplay for dialogue and ending routes.
