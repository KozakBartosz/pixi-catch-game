# Recruitment review

Reviewed: 2026-09-19. Baseline: `d702f80` (`Add responsive pointer controls`).

**Overall: 8.2/10.** Strong small-game architecture and complete core rules. Main weaknesses: lifecycle edge cases, a few presentation/configuration seams, incomplete accessibility transitions, and unresolved background provenance. This is a credible recruitment submission, not a production-ready reusable game platform.

Scope: independent source, configuration, test, documentation, and attribution review. No tests, build, lint, npm, or browser checks rerun by this reviewer. Runtime evidence below comes from the parent review recorded in [docs/tasks.md](docs/tasks.md): Node `16.16.0`, npm `8.11.0`, clean install, quality checks, 40 tests/eight suites, production build, and browser checks. Real touch hardware remains unverified. Scores judge the assignment and current repository; optional product features are not missing requirements.

## Weighted assessment

| Category | Weight | Score / 10 |
| --- | ---: | ---: |
| A. Code readability and organization | 35% | 8.5 |
| B. Future extensibility and extension guidance | 20% | 8.0 |
| C. Core gameplay and correctness | 10% | 9.0 |
| D. PixiJS and rendering | 5% | 8.0 |
| E. Runtime and Git delivery | 8% | 8.5 |
| F. Verification quality | 7% | 8.0 |
| G. Responsive design and pointer controls | 5% | 7.0 |
| H. HTML interface and accessibility | 4% | 7.0 |
| I. Assets and provenance | 3% | 5.0 |
| J. Documentation and visual/audio polish | 3% | 8.0 |

Weighted calculation: `8.5×0.35 + 8×0.20 + 9×0.10 + 8×0.05 + 8.5×0.08 + 8×0.07 + 7×0.05 + 7×0.04 + 5×0.03 + 8×0.03 = 8.175`, rounded to **8.2**. Readability plus extensibility account for 55%; category sub-scores below explain judgment rather than introduce extra weights.

## A. Code readability and organization — 8.5/10

### A1. Responsibility boundaries — 9/10

Good: [GameSession](src/game/GameSession.ts) owns rules without PixiJS/DOM imports. App, input, assets, viewport, audio, and HTML UI have identifiable owners. Typed return events connect resolved outcomes to presentation. No global event bus, inheritance maze, or empty entity abstractions.

Improve: [GameView](src/rendering/GameView.ts) combines background transitions, theme interpolation, animation, item reconciliation, and effects. Still readable at this size; extract only when adding another substantial visual behavior. A generic ECS would reduce clarity here.

### A2. Rule traceability — 9/10

Good: `updateStep` makes movement, spawning, item movement, contact resolution, missed-food penalties, and terminal stopping visible in order. `loseLife` centralizes zero-life termination. Snapshot copies prevent view mutations from changing simulation state.

Improve: document the supported configuration invariants near the constructor. The algorithm assumes positive step/spawn intervals and valid board sizes. Bad configuration can create nonterminating loops; shipped defaults are valid.

### A3. OOP and explicit TypeScript — 9/10

Good: stateful classes own behavior and resources; typed records represent state. Strict TypeScript plus explicit-type lint rules directly satisfy the brief. Discriminated gameplay events are clear extension contracts.

Improve: `themeId: string` permits a model theme with no matching renderer definition; the fallback masks spelling errors. Snapshot interfaces are mutable although snapshots are intended for reading. These are strengthening opportunities, not demonstrated current gameplay defects.

### A4. Naming and local readability — 8/10

Good: `caughtFood`, `spawnTimer`, `remainingSeconds`, and `targetX` describe intent. Domain terminology uses one stage concept. Short methods keep most changes local.

Improve: repeated function-variable signatures add visual weight; explicitly typed function declarations can satisfy the same requirement more simply. Seven positional callbacks in `GameUI` make construction and tests depend on ordering (`actions[5]()`); a named action object would communicate intent better.

### A5. Lifecycle ownership — 7/10

Good: one application ticker, explicit listener disposal, reusable restart, and asset failure/retry handling. Effects and removed item sprites are destroyed.

Actual edge cases: `GameApp.dispose()` returns before cleanup when construction happened but `start()` did not. Disposal during asset loading does not invalidate `loadAttempt`; later progress/error callbacks may update disposed UI, and textures that finish loading after `unload()` can remain cached. The current `main.ts` immediately starts one long-lived instance, so this chiefly limits future mounting/unmounting. Fix the ownership contract before embedding in a routed app.

### A6. Test readability — 8/10

Good: model tests name observable rules and inject randomness. Hitbox regressions explain the original failure. No private-state patching is needed for normal model scenarios.

Improve: application tests have substantial mock/setup ceremony and callback-index coupling. Keep focused integration coverage, but prefer named actions and reusable boundary fakes as cases grow.

## B. Future extensibility — 8/10

### B1. Stages and difficulty data — 9/10

Good: [stages.ts](src/game/stages.ts) controls thresholds, capped speed/spawn cadence, hazard share, and cycling theme IDs. Spawn-time item speeds prevent abrupt trajectory changes. Endless stages satisfy the optional levels requirement without an artificial final level.

Improve: validate nonempty themes, positive catch thresholds/intervals, coherent bounds, and probabilities if configuration becomes externally editable. `GameSession` shallow-copies configuration; nested stage data remains caller-owned and mutable.

### B2. Adding content — 8/10

Good: [README](README.md) explains adding food assets and stage settings with exact source entry points and attribution steps. Manifest-backed appearances require no scoring change.

Improve: adding a new item behavior currently touches the kind union, session branches, rendering, and possibly audio. That is appropriate for two kinds. Introduce a small typed item-definition table only when several new behaviors establish a real repeated pattern.

### B3. Presentation independence — 8/10

Good: new sound/visual feedback can consume events without changing scoring. Pointer geometry stays outside the model; model speed and bounds still apply.

Improve: `GameView` repeats `800`, `600`, `400`, and `300` while the model exposes configurable board dimensions. Changing board configuration alone would misalign backgrounds/overlays. Pass dimensions into the view before advertising alternate board shapes. Global DOM queries in `GameUI` also prevent straightforward multiple-instance embedding.

### B4. Documented development path — 8/10

Good: stage tuning, themes, food appearances, special-item events, and evidence-driven spawn fairness have concrete routes. Decisions explain why backend, inventory, combat, and a general entity framework are unnecessary now.

Improve: distinguish supported configuration changes from those still requiring view work. A short future roadmap could order replayable seeded sessions, balance experiments, and additional item behavior by actual user value. High scores, networking, and persistence are optional; their absence is not a recruitment failure.

## C. Core gameplay — 9/10

**C1. Required loop: 10/10.** Horizontal bottom player, falling food, one point per catch, one life per miss, ten starting lives, terminal zero-life state, final score, and restart are implemented and have deterministic coverage.

**C2. Timing and collision: 9/10.** Bounded elapsed time, small substeps, stable body hitbox, and one-time resolution are sensible. Existing tests cover movement frame-duration consistency and body contact. More direct maximum-delta collision coverage would strengthen confidence.

**C3. Balance and hazards: 8/10.** Hazards are a documented extension, clearly distinct in shape; they share the life pool and do not award progress. Unconstrained placement can create unavoidable damage. This is an accepted D15 tuning limitation, not an accidental rule violation. Capture seeded examples before adding fairness machinery.

## D. PixiJS/rendering — 8/10

**D1. Engine use: 9/10.** Actual PixiJS sprites/animation, nearest-neighbor art, explicit preloading, and display-object reuse by item ID. No unnecessary frontend framework.

**D2. Rendering correctness and maintainability: 7/10.** Hard-coded board geometry is the main extension seam. Theme interpolation repeatedly rounds each color channel, so small remaining differences can stop changing; the nominal 1.5-second blend is exponential, not a fixed-duration transition. `resetBackground()` resets cycle opacity but not theme tint, so a restart can briefly inherit the prior stage's atmosphere. Low-impact visual issues; an elapsed-time interpolation with explicit start/target tint would be clearer if refined.

## E. Runtime/distribution — 8.5/10

**E1. Required environment: 9/10.** Exact dependency pins, lockfile, `.nvmrc`, engines, and recorded required-runtime execution. `npm start` exists; no backend or secret setup. Recorded clean validation uses `npm ci`; README gives the requested `npm install && npm start` path.

**E2. Git delivery: 8/10.** Local Git history and task commits exist; generated files are ignored. No remote is configured, so there is no reviewer clone URL yet. Local Git meets repository structure; external handoff still needs a destination.

**E3. Toolchain risk: 8/10.** [stack.md](docs/stack.md) discloses two development-tool dependency findings and compatibility constraints. This review did not independently rerun an audit. Keep local dev servers private; reconsider supported tooling when the assignment permits a runtime change. Site-root asset URLs also assume root hosting; subpath deployment needs deliberate base-path handling.

## F. Verification — 8/10

Good: 40 recorded passing tests cover core rules, progression caps, hazards, pause/restart, viewport math, fullscreen failure, optional audio failure, and pointer lifecycle. Browser evidence includes game over, repeated restart, native tab pause, native fullscreen Escape, and layout checks.

Gaps: no direct GameView or GameUI tests; no asynchronous asset-disposal regression; no real touch-device run. Audio tests mostly cover state/fallback rather than actual cue emission. `jest --passWithNoTests` remains from initial setup and would silently accept an accidentally empty suite. Remove that scaffold allowance now. Test count alone is not proof of these untested behaviors.

## G. Responsive/pointer experience — 7/10

Good: contain fitting preserves logical speed/hitboxes, safe-area CSS supports narrow screens, pointer capture handles dragging, and mapping reads live viewport geometry. Cancellation, capture loss, blur, and keyboard priority have focused tests.

Improve: start-screen instructions mention keyboard only, hiding the new touch interaction from its main audience. Portrait layout necessarily leaves substantial decorative space; acceptable fixed-board tradeoff. Real touch plus orientation changes during a held drag still need a device check. Input clearing drops the active pointer target but does not explicitly release DOM pointer capture; tighten ownership when adding more pointer interactions.

## H. HTML game-over/accessibility — 7/10

Good: real HTML end screen with score/restart, semantic buttons, visible keyboard focus, mute/fullscreen pressed states, live HUD, and focused retry after loading failure. This satisfies the requested HTML end screen.

Improve: `GameUI.render()` changes visibility without moving focus to Resume/Play again or announcing the game-over heading. A keyboard user can lose context when a focused control becomes hidden. Screen transitions need intentional focus/announcement behavior; do not claim full accessibility from native buttons alone. Visual gameplay itself has no nonvisual equivalent, which was not required by the assignment.

## I. Assets/provenance — 5/10

Good: required character/food sources are recorded; food's supplied readme is retained; synthesized audio needs no distributed sound license. No invented ownership claim for backgrounds.

Delivery risk: all three background files have unknown original source/license. Disclosure does not establish permission to redistribute. Resolve provenance or replace with clearly licensed/self-created art before public delivery. Character/food source attribution is present, but [SOURCES.md](public/assets/SOURCES.md) points to external usage terms rather than preserving clear license text locally; the food readme describes files, not a license grant. This is a provenance assessment, not a legal determination.

## J. Documentation and polish — 8/10

**J1. Documentation: 8/10.** Setup, controls, architecture, extension steps, decisions, and verification evidence are unusually useful for a small submission. Some planning-era text remains stale: D01 says runtime verification is pending; the open-choice list still says standalone Git setup is pending; stack test-script prose still describes waiting for T02. Mark historical statements as superseded instead of leaving contradictory current status.

**J2. Visual/audio bonus: 8/10.** Animated character, background cycle, stage tinting, catch sparkle, damage feedback, synthesized cues, and persistent-in-run mute provide the requested bonuses. Reduced-motion changes catch feedback. More polished hazards, richer cues, saved mute preference, and score popups are optional polish, not missing requirements.

## Prioritized improvements

1. **Before public redistribution:** resolve background provenance; preserve explicit asset license evidence where available. Highest delivery uncertainty.
2. **Small user-facing correction:** describe press/hold/drag on the start screen. Add intentional focus/announcements for pause and game over.
3. **Before lifecycle reuse:** make disposal idempotent from construction onward, invalidate async asset work, and clean up late results. Add targeted regressions for disposal during loading and rejection.
4. **Verification hygiene:** remove `--passWithNoTests`; close actual-touch/orientation coverage. Avoid rerunning unrelated checks solely to inflate evidence.
5. **Before broadening configuration:** share board dimensions with GameView; validate configuration invariants and protect nested stage data. Keep the simple model rather than introducing a framework.
6. **Documentation maintenance:** reconcile stale pending/deferred language while retaining decision history.
7. **Optional polish/playtesting:** refine exact theme blending/reset; capture seeded unfair sequences; improve hazard art and audio only after observing their value.

Recruitment emphasis: keep the current explicit simulation and small module boundaries. The best next work improves lifecycle guarantees, extension contracts, and discoverability. Adding more features would contribute less than making these existing contracts precise.
