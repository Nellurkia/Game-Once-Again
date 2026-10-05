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

- Title, prologue, four chapters, interlude, second journey, ending selection, ending and credits.
- Chapter 1: arrows/WASD or on-screen buttons; collect five memories and reach the glowing room. Shadows reset your position, retaining collected memories. Second-run configuration changes target and removes shadow collisions.
- Chapter 2 is a playable top-down survival game: automatic targeting, moving enemy swarms, four hiding areas, solid projectile-blocking walls, three 22-second waves, three distinct random item selections (three choices from a nine-item pool), and a final boss with telegraphed ring projectiles and a targeted blast. Foliage hiding stops attacks, breaks targeting and heals, but uses limited breath and does not grant invulnerability. WASD/arrows move; hold Space in foliage to hide. Touch players can hold/drag on the arena to move and toggle hiding with the bottom-right button. Death offers a fresh run; defeating the boss unlocks the chapter's closing dialogue. Both journeys support this game. Leaving during combat restarts the run when continued.
- Chapters 3–4 intentionally auto-complete after three seconds.
- Red curtain transition, typewriter dialogue, optional dialogue choices, local saves with in-memory fallback, reset, audio settings, fullscreen.
- BE repeats the second journey; NE/TE lead to credits. Endings are recorded locally.
- Text marked `{TBD}` is draft placeholder copy. The title uses a warm illustrated room. Background music loops after the first click or keypress, follows the music volume setting, and continues across scenes using the same track. Sound effects remain placeholders.

## Background music

The supplied `mondamusic-game-game-music-529603(1).mp3` is stored as `public/assets/audio/bgm_default.mp3` and currently plays in all scenes.

Edit `public/data/music.json` to assign music by scene. `default` is the fallback track; a `null` scene entry uses that default. Paths are relative to `public/` and work when hosted under a subdirectory, such as `/once-again/`.

To add chapter music later, place the new MP3 in `public/assets/audio/`, then change the corresponding entry, for example:

```json
"ch1": "assets/audio/bgm_ch1_childhood.mp3"
```

The chapter's introduction, minigame and closing dialogue share the selected track. Both playthroughs use the same chapter entry. Switching to a different track starts it from the beginning; moving between scenes assigned the same track preserves playback position.

## Replace content

`public/data/story.json` contains dialogue. `public/data/scenes.json` holds both configurations for each chapter. `public/data/manifest.json` points to replaceable chapter backgrounds. Replace the corresponding asset, or update its manifest path; gameplay source does not need changes. Generated SVG placeholders include their asset filename. Production PNGs can be used by changing the manifest path.

Save key: `zlyc_save_v1`. Each displayed dialogue line automatically saves its story section and line index. Continue restores that same line in the prologue, chapter introduction, chapter closing dialogue or ending; its typewriter animation starts again. Chapter saves distinguish dialogue from gameplay, so loading closing dialogue skips the completed minigame. Loading during gameplay restarts that minigame. Old saves without dialogue positions remain compatible and start at the scene's introduction. New games and clearing a save reset dialogue positions. The terminal three-option menu determines the ending; dialogue choices can set flags for future content. Source story/gameplay documents referenced by the PRD were not supplied, so this implements the PRD and does not claim to reproduce those missing rules.
