# Pixi Catch Game

A small TypeScript/PixiJS game about catching falling food. Move the character along the bottom of the board, earn one point for each food item, and avoid hazards. Missing food or touching a hazard costs one of the ten lives. The run ends at zero lives.

The game uses a fixed 800 × 600 simulation board and scales its presentation to the browser viewport. Catch-based stages continue indefinitely, cycle visual themes, and gradually increase fall speed, spawn frequency, and hazard chance within documented limits.

## Requirements and setup

- Node.js `16.16.0`
- npm `8.11.0`

Use the exact assignment runtime for delivery verification:

```sh
nvm install 16.16.0
nvm use
node --version
npm --version
npm install
npm start
```

`npm start` launches the Vite development server. Open the local URL printed by Vite. The game has no backend or required environment variables.

## Controls

- Move left: `A` or `Left Arrow`
- Move right: `D` or `Right Arrow`
- Touch or pointer: press/hold on the board and drag horizontally
- Start, pause, resume, restart, mute, and fullscreen: use the labelled HTML buttons; they are reachable by keyboard with `Tab` and activated with `Enter` or `Space`
- Leave fullscreen: the `Exit fullscreen` button or the browser's `Escape` shortcut

Switching away from the tab pauses an active run. Returning does not resume it automatically; select `Resume` when ready. Sound is optional, begins only after a start/restart interaction, and can be muted without affecting gameplay.

Pointer input is translated through the current contain-fit viewport into logical board coordinates. Movement keeps the same model-owned speed and bounds as keyboard input, so resizing does not change gameplay.

## Quality checks

```sh
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
```

`npm run build` creates the ignored `dist/` directory. `npm run preview` serves that production build for browser verification. See [docs/tasks.md](docs/tasks.md) for recorded verification evidence and remaining limitations.

Latest delivery verification passed on Node `16.16.0` and npm `8.11.0`: clean `npm ci`, typecheck, lint, format check, all 40 tests in 8 suites, and a production build of 474 modules. Production-preview and native-browser checks also passed; details are recorded in the task ledger.

## Architecture

Gameplay rules do not depend on PixiJS or browser APIs. Presentation consumes typed events emitted by the simulation.

- [`src/app/GameApp.ts`](src/app/GameApp.ts) composes the application, owns its update loop, and coordinates lifecycle, UI, rendering, input, and audio.
- [`src/game/GameSession.ts`](src/game/GameSession.ts) owns score, lives, player movement, item resolution, pause state, and stage progress.
- [`src/game/types.ts`](src/game/types.ts) defines the model and gameplay-event contracts shared at module boundaries.
- [`src/game/stages.ts`](src/game/stages.ts) contains bounded, data-driven stage progression.
- [`src/rendering/GameView.ts`](src/rendering/GameView.ts) renders snapshots and event-driven effects without deciding gameplay outcomes.
- [`src/rendering/GameViewport.ts`](src/rendering/GameViewport.ts) maps the fixed logical board into the current viewport and owns fullscreen behavior.
- [`src/input/InputController.ts`](src/input/InputController.ts), [`src/ui/GameUI.ts`](src/ui/GameUI.ts), and [`src/audio/GameAudio.ts`](src/audio/GameAudio.ts) own their browser-facing concerns and cleanup.
- [`src/assets/assetManifest.ts`](src/assets/assetManifest.ts) lists every asset required at startup.

The model accepts injected randomness, so rule tests remain deterministic. Items retain the fall speed assigned when they spawn; a stage transition does not alter existing trajectories.

## Extending the game

### Change or add stage behavior

Edit `DEFAULT_STAGE_PROGRESSION` in [`src/game/stages.ts`](src/game/stages.ts). It controls catches per stage, speed and spawn-interval growth and caps, hazard probability and cap, and the cyclic theme identifiers. Keep stage rules independent of rendering. If a new setting changes gameplay, add it to `StageProgressionConfig` in [`src/game/types.ts`](src/game/types.ts) and cover its boundaries in [`src/game/stages.test.ts`](src/game/stages.test.ts) or [`src/game/GameSession.test.ts`](src/game/GameSession.test.ts).

Theme identifiers currently select presentation tinting in [`src/rendering/GameView.ts`](src/rendering/GameView.ts). Add a visual theme there without coupling the simulation to PixiJS.

### Add a food appearance

1. Add the image under `public/assets/food/`.
2. Add its site-root URL to `ASSET_MANIFEST.food` in [`src/assets/assetManifest.ts`](src/assets/assetManifest.ts).
3. Record its author, source, and license in [`public/assets/SOURCES.md`](public/assets/SOURCES.md), retaining any supplied license/readme file.
4. Run the automated checks and confirm the asset loads and renders in a browser.

New scoring rules or item kinds belong in the simulation types/session first. Expose resolved outcomes as typed gameplay events, then add optional view/audio feedback. This preserves a testable model and prevents presentation code from changing score or lives.

## Assets and attribution

Character and food art retain their source information and bundled documentation in [`public/assets/SOURCES.md`](public/assets/SOURCES.md). The background files were supplied by the project owner; their original source and license are currently unknown and explicitly recorded there. Sound effects are synthesized with the Web Audio API, so no audio files are distributed.

## Project documentation

- [Context and domain language](CONTEXT.md)
- [Implementation plan](docs/plan.md)
- [Decision log](docs/decisions.md)
- [Technology stack and environment](docs/stack.md)
- [Task ledger and verification evidence](docs/tasks.md)
