# 再来一次 · Once Again

Phase 1 browser narrative game based on the supplied PRD. JavaScript, Phaser 3.90, Vite 5.4. No server or account required.

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
- Chapters 2–4 intentionally auto-complete after three seconds.
- Red curtain transition, typewriter dialogue, optional dialogue choices, local saves with in-memory fallback, reset, audio settings, fullscreen.
- BE repeats the second journey; NE/TE lead to credits. Endings are recorded locally.
- Text marked `{TBD}` is draft placeholder copy. Title illustration is original SVG scenery. Audio API is intentionally silent.

## Replace content

`public/data/story.json` contains dialogue. `public/data/scenes.json` holds both configurations for each chapter. `public/data/manifest.json` points to replaceable chapter backgrounds. Replace the corresponding asset, or update its manifest path; gameplay source does not need changes. Generated SVG placeholders include their asset filename. Production PNGs can be used by changing the manifest path.

Save key: `zlyc_save_v1`. Progress resumes at the current scene's introduction, not a frame inside a minigame. The terminal three-option menu determines the ending; dialogue choices can set flags for future content. Source story/gameplay documents referenced by the PRD were not supplied, so this implements the PRD and does not claim to reproduce those missing rules.
