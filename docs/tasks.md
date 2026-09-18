# Implementation tasks

Read [plan.md](plan.md) before gameplay or architecture work. Read [stack.md](stack.md) before tooling or rendering work. These files define scope and constraints; this file tracks execution.

Work in dependency order. Mark a task complete only when its acceptance criteria pass. When finishing a task, append the actual checks/results under that task and update any affected stack facts. Record a specific blocker if a check cannot run; do not count an unverified criterion as complete.

## Existing groundwork

- [x] Create a TypeScript/PixiJS/Vite smoke screen.
- [x] Move the project to its standalone folder.
- [x] Download character and food PNGs and record their sources.
- [x] Document architecture, stack, and implementation tasks.

These completed preparation steps do not imply that T01 or gameplay is complete.

## T01 — Reproducible development environment

- [x] Complete T01.

Dependencies: none.

Work: verify the required runtime, investigate existing build warnings and dependency findings, add compatible lint/format/test tooling, and initialize local Git if still absent. Preserve existing files. A remote or publication is not required for this task.

Acceptance:

- A clean dependency installation, development-server startup, and production build succeed on Node 16.16.0/npm 8.11.0.
- Type checking, linting, formatting checks, and the selected test runner have documented commands.
- Tooling stays local to this project; unexpected inherited configuration is resolved.
- A standalone Git root exists; installed packages and build output are ignored.
- `stack.md` records actual tooling and any remaining dependency limitations.

Verification (2026-09-17):

- Installed Node `16.16.0` with the local `fnm` version manager and used its npm `8.11.0` for every final check.
- `npm ci` completed from `package-lock.json`; it installed 437 packages. It emitted known deprecation notices from the compatible ESLint 8 tree but no engine mismatch.
- `npm start -- --host 127.0.0.1 --port 4177` reached Vite's ready state and an HTTP request to `/` returned `200 text/html`; the server was then stopped.
- `npm run build` passed after TypeScript checking and generated the production bundle in `dist/`.
- `npm run typecheck`, `npm run lint`, and `npm run format:check` passed.
- `npm test` passed with Jest 29.7.0. No gameplay tests exist yet; `--passWithNoTests` is intentional until T02 adds model behavior.
- `npm audit` was investigated without applying a forced fix. It reports two remaining findings in the Vite 3 development toolchain (one moderate esbuild finding and one high Vite finding); npm's offered Vite 8 remediation is incompatible with required Node 16. Details and the local-development mitigation are recorded in `stack.md`.
- The reported Tailwind warning did not recur during clean install, start, or build. This project has no Tailwind dependency or configuration; the obsolete former parent project does, which was the likely inherited source.
- Initialized `/Users/bartosz/Work/pixiGame` as a standalone local Git root with no remote. `git check-ignore` confirmed both `node_modules/` and `dist/` (including files beneath them) are ignored.

## T02 — First complete playable loop

- [x] Complete T02.

Dependencies: T01.

Work: implement GameApp, GameSession, input, basic rendering, and HTML start/game-over/restart UI. Simple shapes are sufficient for this stage. Add focused rule tests with deterministic randomness.

Acceptance:

- A player can start, move horizontally, catch items, lose all ten lives, and restart.
- Catches and misses follow the rules in `plan.md`; an item cannot be counted twice.
- Model code imports neither PixiJS nor browser DOM APIs.
- Elapsed-time movement and collision handling work at different frame durations.
- Tests cover scoring, misses, terminal state, movement bounds, and complete restart reset.
- Repeated restarts leave one update loop and one set of input listeners.

Verification (2026-09-17):

- Added `GameSession` and typed gameplay data/events under `src/game/`; `rg`/import inspection confirms this layer imports neither PixiJS nor DOM APIs.
- Added a single coordinating `GameApp`, one PixiJS ticker callback, one `InputController`, simple shape rendering, and HTML start/HUD/game-over/restart controls. Restart resets the existing session and does not register another ticker or another set of listeners; disposal paths remove the owned callbacks and listeners.
- `npm test` passed 6 deterministic model tests covering one-time catch scoring, one-time miss penalties, the tenth miss ending the run, no updates after game over, elapsed-time consistency across different frame durations, movement bounds, and complete restart state reset.
- On Node `16.16.0`/npm `8.11.0`, `npm run typecheck`, `npm run lint`, `npm run format:check`, and `npm run build` passed.
- Browser verification against the Vite development server confirmed the start screen, keyboard movement, falling items, life reduction from 10 to 0, game-over score display, and two restart cycles restoring score 0/lives 10. The browser console contained no warnings or errors.
- T02 intentionally uses simple geometric player/item visuals. Supplied asset loading and animation remain scoped to T03.

## T03 — Supplied art and animation

- [x] Complete T03.

Dependencies: T02.

Work: add an explicit asset manifest, preload needed textures, use idle and left/right running animation, and display food sprites.

Acceptance:

- Needed images load before play; loading failure displays a useful retry action.
- Animation follows movement and stops appropriately when idle.
- Hitboxes are intentional and independent of transparent image margins.
- Pixel art remains sharp; attribution and original source records remain available.
- A browser check confirms successful asset requests and no runtime errors.

Verification (2026-09-17):

- Added a typed manifest for two directional idle poses, six-frame left/right run strips, and five food PNGs. `GameAssets` preloads the complete manifest before the start screen becomes usable, reports percentage progress, tracks successfully loaded cache entries, and unloads only its owned textures on failed attempts or disposal.
- Replaced the geometric player and food placeholders with an `AnimatedSprite` and food `Sprite` instances. Browser inspection confirmed directional run strips are selected only while horizontal position changes, the last-facing idle pose is restored when stationary, and the player returns to an idle pose after restart.
- The view aligns character art to the model-owned player rectangle and scales food art to model-owned item rectangles; no transparent pixel bounds enter collision logic. The six existing deterministic model tests still pass unchanged, covering scoring, life loss, one-time resolution, elapsed-time behavior, bounds, and full restart reset.
- Pixi antialiasing remains disabled, every loaded base texture uses `SCALE_MODES.NEAREST`, and the canvas uses `image-rendering: pixelated`. Existing attribution in `public/assets/SOURCES.md` and the original `public/assets/food/readme.txt` remain unchanged and available.
- On Node `16.16.0`/npm `8.11.0`, `npm run format:check`, `npm run typecheck`, `npm run lint`, `npm test` (6 tests), and `npm run build` passed. The production build transformed 469 modules and emitted `dist/` successfully.
- Browser verification against `http://127.0.0.1:4177/` confirmed the character and varied food sprites render sharply, movement/idle behavior works, a run reaches game over, and restart restores score `0`, lives `10`, items, and the idle player. Gameplay continued to produce catches and misses through the unchanged session rules.
- Direct checks returned `200 image/png` for every manifest entry (both idle poses, all 12 run frames, and all five food images). A fresh successful page load produced no console warnings or errors.
- Temporarily removing one required PNG produced a visible “Art failed to load” state with keyboard-focused “Retry loading”. Restoring the file and selecting retry loaded the start screen and art successfully. No test file remained moved or renamed afterward.

Review fixes and verification (2026-09-18):

- Start/restart now require loaded assets and a constructed view. The start screen is initially hidden and its button disabled, including before JavaScript initialization; loading keeps it inaccessible to keyboard activation.
- A temporary local HTTP proxy returned deliberate asset failures without modifying supplied graphics. Browser verification showed only retry available, start hidden/disabled, and lives remaining at 10 after Tab/Enter. Restoring asset responses and selecting retry restored the usable start screen.
- Replaced the placeholder 104 × 28 player hitbox with a stable 48 × 120 body rectangle. Measured idle art is about 51 × 123 at the existing 1.5 scale; wider cape/sword/run silhouettes intentionally do not expand catch geometry. Sprite and model retain their shared center/bottom alignment.
- Added a deterministic regression for food passing just outside the body that the old wide paddle would have caught. Required-runtime checks pass with 8 model tests; integrated T04a checks are recorded separately below.

## T04 — Responsive board and fullscreen

- [ ] Complete T04.

Dependencies: T03.

Work: scale the logical board and adapt HTML layout/fullscreen. Touch/pointer movement is deferred to T04b after T07 (D19).

Acceptance:

- Desktop and narrow portrait layouts expose the full board and usable controls.
- Resizing mid-game preserves session state and logical positions.
- Gameplay speed and collision dimensions are independent of viewport size.
- Keyboard focus loss cannot leave movement stuck.

### T04a — Viewport-sized presentation and optional fullscreen

- [ ] Complete T04a.

Requested on 2026-09-18 after T01–T03 review. Dependencies: T03 review fixes. This is the presentation slice of T04; touch/pointer movement is deferred to T04b after T07.

Problem: the fixed 800 × 600 CSS card wastes desktop space and overflows narrow windows.

Work:

- Make the game root and canvas fill the available viewport (`100dvh`, with `100vh` fallback), remove the fixed card border/radius, and extend the background across it.
- Preserve the 800 × 600 logical board. Use uniform `min(viewportWidth / 800, viewportHeight / 600)` scale and centered offsets. Keep the entire board visible; surrounding space is decorative, not extra spawn/movement space.
- Resize the PixiJS 7 renderer to the root with `ResizeObserver`; use `autoDensity` and a capped device pixel ratio (maximum 2). Refresh density when resizing. Preserve nearest-neighbor textures.
- Keep HTML HUD and screens readable at native CSS sizes, accommodate safe areas and short/narrow viewports, and keep start/retry/restart reachable.
- Add a user-initiated fullscreen toggle with support detection, rejection handling, and correct state after Escape. Unsupported fullscreen must not prevent viewport-sized play.
- Own and dispose resize/fullscreen listeners without introducing another game loop. Keep scaling isolated from simulation; share computed bounds for later pointer mapping.

Acceptance:

- Browser checks at 1440 × 900, 1920 × 1080, 390 × 844, and 844 × 390 show a viewport-sized canvas, undistorted complete board, and usable HTML controls without horizontal page scrolling.
- Resize while playing preserves score/lives and session continuity; model dimensions, speed and collision geometry stay unchanged.
- Fullscreen entry and exit preserve play; rejection/unsupported behavior remains usable.
- Existing model tests and required-runtime typecheck/lint/format/build pass. Add focused layout math tests if layout calculation is extracted.
- Record actual browser checks and any environment limitation before marking complete.

Design rationale and sources: [responsive research](responsive-research.md), [D17](decisions.md#d17--fill-the-viewport-with-a-scaled-logical-board).

T04a implementation and verification (2026-09-18):

- Implemented `GameViewport` with a root `ResizeObserver`, capped resolution, uniform stage scale/offsets, and fullscreen lifecycle/disposal. Layout math is separate and shared through `getLayout()` for later pointer mapping.
- Root and canvas now fill the viewport. Removed the fixed card treatment; HTML panels, HUD, safe-area spacing, and fullscreen status adapt independently of the logical board. Fullscreen rejection displays a readable message.
- Required Node `16.16.0` / npm `8.11.0`: typecheck, lint, format check, 14 tests (8 model, 3 layout, 3 fullscreen controller), and production build pass.
- Browser checks: approximately 1440 × 900, 1920 × 1080, 390 × 844, and 844 × 390 CSS pixels. The embedded browser applies a 1.13 device/zoom factor, so viewport overrides were compensated and actual DOM sizes checked (large case measured 1920 × 1079). Canvas/root matched the viewport and document width did not overflow. Screens and controls remained usable; character art stayed proportional.
- Resizing an active run retained the score and continued life loss rather than resetting the session. Game-over/restart and fullscreen entry/exit through the button worked. Fresh game tab console had no warnings/errors.
- Remaining browser check: the embedded browser's synthetic Escape did not exit native fullscreen. Browser-initiated `fullscreenchange` exit, unsupported API, and rejected requests are covered by controller tests; physical Escape still needs a normal-browser smoke check. T04a checkbox remains open for that check rather than claiming it was verified.
- T04 remains open only for the native Escape check. T04b was subsequently moved outside T04 completion requirements (D19).

## T05 — Pause and configurable progression

- [x] Complete T05.

Dependencies: T03 and the implemented T04a layout. The outstanding native Escape smoke check remains tracked under T04a and must pass before T07 completion; it does not block T05.

Work: add manual pause, pause on a hidden tab, explicit resume, and data-driven level progression. Choose and document initial tuning values.

Include one stage progression system based on food items caught in the current run (D12). Each new stage increases difficulty and selects a visual theme, implemented in T06. Tune catch thresholds and difficulty settings during this task; earlier level references mean stages.

Acceptance:

- Pause freezes movement and spawn timers; resume causes no catch-up burst.
- Level thresholds apply once, and previously spawned items keep their speed.
- Additional levels can be defined through configuration.
- Difficulty has a documented upper bound.
- Tests cover pause/resume, progression boundaries, and restart resetting level state.
- Stage progress advances through catches rather than elapsed time, and restart resets the catch count and stage.
- Stages continue through parameter-driven progression; theme indices cycle without resetting difficulty or progress (D13).
- Implement provisional hazards (D14): contact costs one life, missing costs nothing, and neither outcome adds score or catch progress. Test one-time resolution and shared-life game over.
- Tune increasing hazard proportions while retaining food availability. Use random in-bounds placement without fairness constraints (D15).
- Apply hazard damage independently without invulnerability or cooldown (D16). Test multiple contacts in one update, one-time resolution per hazard, and immediate game over at zero without negative lives.

Verification and review (2026-09-18):

- Implemented model pause/resume, catch-count stages, parameter-driven difficulty caps and cyclic theme identifiers, per-item spawn-time fall speed, and independent hazard damage with immediate termination at zero. Tuning is recorded in [D20](decisions.md#d20--initial-stage-tuning-and-explicit-pauseresume).
- Added HTML stage HUD, Pause/Resume controls, visibility-triggered pause, input clearing and frozen player animation. Hazards render as spiked crosses and the start instructions explain avoidance. Theme artwork/audio remain T06.
- Parent reviewed the Sol implementation and corrected a TypeScript unreachable-state comparison, added first-ticker-delta suppression after resume, guarded pause/resume against irrelevant states/hidden resumes, and wrapped HUD counters to prevent narrow-screen overlap.
- Required Node `16.16.0` / npm `8.11.0`: 24 tests across 5 suites pass, as do typecheck, lint, format check and production build. The final focused application integration test was rerun after strengthening its input-clearing assertion.
- Coverage includes pause timer preservation, exact catch thresholds, all difficulty caps, theme wrap without difficulty reset, retained item speeds, hazard hits/misses and one-time damage, multiple hits through zero lives, restart progression reset, hidden-tab explicit resume, stale ticker suppression and visibility-listener disposal. The application test uses browser/rendering boundary doubles with the real GameSession.
- Browser check confirmed pause retaining score/lives and frozen visuals across an extended pause, explicit resume, game over and restart to score 0/lives 10/stage 1. Narrow-screen HUD wraps without overlapping fullscreen and exposes Pause/Resume. No new browser console errors were observed.
- Browser limitation: hidden embedded tabs remain `document.hidden === false`, so native tab-switch auto-pause could not be exercised there; the actual visibility-event handler and explicit-resume behavior are verified by the application integration test. Check native tab switching in the T07 browser pass. Stage/hazard outcomes are verified deterministically; initial difficulty still needs playtesting. The independent T04a native Escape check remains open.

## T06 — Visual and audio feedback

- [ ] Complete T06.

Dependencies: T05.

Work: add a coherent background, brief catch/score feedback, life-loss feedback, and sound/mute controls. Drive feedback from gameplay events.

Connect stage progression from T05 to distinct visual atmospheres, such as lighting changes (D12), while keeping food readable.

Cycle prepared themes across endless stages (D13) and make hazards distinguishable from food beyond color alone (D14).

Acceptance:

- Feedback communicates catches and misses without obscuring incoming items.
- Effects are cleaned up on expiry/restart and respect reduced-motion preferences.
- Audio starts after user interaction; mute works and audio failure does not stop gameplay.
- New assets include source/license records.

## T07 — Delivery verification and documentation

- [ ] Complete T07.

Dependencies: T06.

Work: perform final automated and browser checks, document controls and extension points, and inspect Git status for accidental generated files.

Acceptance:

- Required-runtime clean install, start, build, lint, format checks, and rule tests pass.
- Browser checks cover a full game, repeated restart, resize, keyboard input, pause, and mute. Native Escape fullscreen exit is also verified; touch checks belong to deferred T04b.
- HTML controls are keyboard accessible and the end screen presents score plus restart.
- README explains setup, controls, architecture entry points, and adding a level or food appearance.
- The task ledger contains verification evidence and any remaining limitations.
- Source and asset attribution are ready for repository delivery; remote publishing requires a user-specified destination.

## Deferred — Spawn fairness

- [ ] Revisit after playtesting; not required for T01–T07 completion.

Context: D15 deliberately allows unconstrained random placement in the first version.

Later work: evaluate minimum food/hazard separation, reaction time, and reachable catch/escape routes against actual movement speed and fall timing. Use observed unfair scenarios to choose constraints and add repeatable regression cases. Record the selected rules in the decision log before replacing the initial behavior.

## T04b — Touch/pointer movement (deferred until after T07)

- [ ] Revisit T04b after T07; implementation need remains undecided.

Dependencies: T07 and T04a. Moved to the end at the user's request (D19). This task does not block T04, T05–T07, or keyboard-based delivery.

If retained, map pointer coordinates through board scale/offsets into the shared input contract; handle cancellation, capture loss, and focus loss. Verify actual touch/pointer movement and resize mapping. Reassess whether touch is needed before implementation.

Planning verification: task order, dependencies, and related plan/decision/stack references were checked for consistency; local Markdown links resolve. No implementation or completion status changed.
