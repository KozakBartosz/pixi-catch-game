# Catch Game implementation plan

Status: T01–T07 and T04b complete. The delivered game includes supplied art, viewport-sized keyboard/pointer play, pause/resume, catch-based stages, bounded difficulty, hazards, and themed visual/audio feedback. Required-runtime automation and production-browser pointer verification passed; real touch hardware coverage remains unavailable.

Read [stack.md](stack.md) before choosing libraries or changing build configuration. Use [tasks.md](tasks.md) for implementation order and acceptance criteria.

See [decisions.md](decisions.md) for the rationale behind adopted choices and the choices still open.

## Required behavior

- The player moves horizontally at the bottom of the board.
- Food falls from the top. Catching an item awards one point.
- Each missed item removes one life. A session starts with ten lives and ends at zero.
- Each item is resolved exactly once: caught or missed.
- Provisional extension (D14): hazards cost one life on contact and nothing when missed. They grant no points or stage progress and share the same life pool as food penalties. Later stages increase their proportion relative to food.
- Each hazard applies its own damage with no temporary invulnerability or cooldown (D16). Multiple contacts may cost multiple lives in one update; stop at zero lives and end the run without allowing negative lives.
- The project uses TypeScript, readable OOP, explicit variable and attribute types, and separate files for distinct responsibilities.
- Delivery includes a Git repository and supports `npm install && npm start` on the required runtime.

The supplied character pack contains more animations than this game needs. Use left/right running and idle frames. Vertical movement and combat are outside the agreed gameplay scope.

## Architecture

Keep gameplay independent of PixiJS and the DOM. The application coordinates model updates, rendering, input, and HTML UI.

| Module | Responsibility |
| --- | --- |
| `app/GameApp.ts` | Create dependencies, load assets, own one update loop, connect UI actions, and dispose resources. |
| `game/GameSession.ts` | Own session state, score, lives, item lifecycle, and gameplay updates. |
| `game/types.ts` | Typed player/item data, input, session states, and event unions. |
| `game/collision.ts` | Pure hitbox calculations. |
| `game/stages.ts` | Typed stage definitions, catch thresholds, difficulty, and visual-theme identifiers. |
| `rendering/GameView.ts` | Display model state, animate sprites, and manage visual effects. |
| `input/InputController.ts` | Translate keyboard and touch input into gameplay input. |
| `ui/GameUI.ts` | HTML start screen, HUD, pause, game-over screen, and restart controls. |
| `assets/` | Asset manifest and loading helpers in source code; actual images stay under `public/assets/`. |

This is a target layout, not a requirement to create empty modules upfront. Extract spawning or audio into separate classes when the implemented behavior warrants it. Player and item data can remain typed objects; use classes for stateful behavior and lifecycle ownership. Prefer composition and constructor parameters over inheritance hierarchies or global services.

### Update contract

`GameSession.update(dtSeconds, input)` advances the model and returns typed events such as `itemCaught`, `lifeLost`, and `gameOver`. The view and audio consume these events; presentation never decides scoring.

The order is explicit: move player, spawn items, move items, resolve catches, resolve misses, determine game over. Stop processing gameplay once the session ends. Supply randomness through a replaceable function so tests are repeatable.

Movement uses elapsed seconds. Bound unusually large time steps and use substeps or swept collision checks when needed to prevent fast items from passing through the player. Pause freezes simulation time and spawn timers. Clear held input when focus is lost.

### State and lifecycle

The intended states are `loading`, `ready`, `playing`, `paused`, `gameOver`, and a recoverable loading error. The HTML UI receives its root and named actions from the application; transitions focus the visible primary control and announce the final score once, as recorded in D22. Application/UI owns loading; the session owns gameplay states. Restart restores score, lives, player position, items, timers, stage, and input. One `GameApp` owns the global Pixi asset cache at a time. Disposal is permanent and safe from construction onward: it removes listeners, ticker callbacks, input, UI, viewport, audio, view, and renderer resources once; `start()` after disposal does nothing. An in-flight load settles before its acquired assets are unloaded, and late progress, success, and failure cannot revive the disposed app. A live app may retry a failed load; overlapping loads are ignored. The active view is disposed before its textures are unloaded.

### Responsive layout

Use a fixed logical board with a constant aspect ratio, scaled to available space. Keep gameplay coordinates independent of screen pixels and map pointer coordinates back to the board. Window size must not alter speed, hitboxes, or difficulty. The root, canvas and decorative background fill the viewport; uniformly contain-fit and center the logical board inside it (D17). Offer optional user-initiated browser fullscreen, with a usable fallback. Keep HTML controls usable on narrow screens and preserve sharp pixel-art rendering. T04a covers viewport presentation; T04b is deferred until after T07; reassess its need then (D19).

## Delivery stages

1. Verify the required environment and establish formatting, linting, and a compatible test runner.
2. Deliver a complete start → play → lose → restart loop using simple visuals.
3. Integrate the supplied assets, animation, responsive scaling, and optional fullscreen.
4. Add pause and configurable levels.
5. Add background art, restrained catch/life-loss feedback, and optional sound with mute.
6. Verify behavior, document extension points, and prepare reproducible delivery.
7. Add touch/pointer controls (T04b) after delivery verification established the keyboard baseline.

Stages 1–3 cover the core game. Levels, visual polish, and sound are assignment bonuses included in the planned follow-up stages.

## Proposed defaults and extension points

Play is divided into stages that change visual atmosphere and increase difficulty together. Stage advancement uses the number of food items caught in the current run, not elapsed time. Stages are the single progression system; earlier references to levels mean stages. Generate endless stages from progression parameters and cycle prepared visual themes without resetting difficulty. A run ends at zero lives. Initial catch thresholds and difficulty tuning are recorded in D20 and remain subject to playtesting; D12–D14 define the progression rules.

Stage catch thresholds and speeds are tuning decisions, not fixed assignment requirements. Existing items retain their original speed while new items use the new stage settings. Cap difficulty so the game remains playable.

Initially sample spawn positions randomly within board bounds without fairness constraints (D15). Overlaps and unavoidable damage are accepted limitations of this version. Minimum separation, reaction time, and reachable routes are deferred follow-up work.

New levels should require configuration changes. New food appearances should require manifest/configuration entries. Future special-item behavior can extend the item/event types when requested. Combat, inventory, a backend, and a general-purpose entity framework are not needed for this scope.

## Validation priorities

Test observable rules: one award per catch, one penalty per miss, the tenth miss ending play, no updates after game over, pause preserving timers, clean restart, movement bounds, and level transitions. Use deterministic input and randomness. Browser verification covers actual asset loading, animation, resize, keyboard input, focus loss, and repeated restarts. Touch/pointer verification belongs to deferred T04b and does not block T01–T07.
