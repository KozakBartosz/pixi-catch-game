# Q01 — Application and asset lifecycle

Status: complete. Dependencies: none.

## Problem and scope

GameApp.dispose() currently skips cleanup before start(). Disposal does not invalidate progress/error callbacks, and assets completing after unload can remain cached. Establish an explicit ownership contract without introducing a general lifecycle framework.

Primary files: [GameApp](../../src/app/GameApp.ts), [GameAssets](../../src/assets/GameAssets.ts), [application tests](../../src/app/GameApp.test.ts). Inspect viewport, input, UI, audio, and PixiJS cleanup before choosing the implementation.

## Work

- Distinguish constructed, started, and permanently disposed behavior. Dispose all owned resources from construction onward; repeated disposal is safe. Make start after disposal a documented safe no-op.
- Invalidate pending load attempts on disposal. Guard progress, success, and failure paths so stale callbacks cannot change UI, create a view, or restart activity.
- Ensure assets acquired by a load that completes after disposal are eventually released, including partial success followed by failure. Coordinate cleanup with in-flight work; a token check alone is insufficient.
- Preserve recoverable load failure/retry while the app is alive. Define and prevent overlapping attempts or make their ownership safe. Do not unload textures while an active view still owns their use.
- Document the supported single-application ownership of the global Pixi asset cache; do not claim simultaneous-instance support or add reference counting without an actual requirement.
- Handle asynchronous cleanup failures so void-triggered operations do not create unhandled rejections. Follow installed PixiJS APIs and the existing dependency versions.

## Acceptance and verification

- Construct → dispose without start removes constructed listeners, viewport/input/UI resources, audio, and renderer resources.
- Start → dispose → dispose releases resources once; start after dispose creates no new work.
- Controlled deferred promises cover disposal during loading, late success, late rejection, and progress after disposal. No disposed UI calls or new GameView occur; acquired textures are released after work settles.
- An alive app can recover from failed loading through retry and enter ready/play normally, without duplicate tickers or leaked assets.
- Use observable boundary doubles and deferred promises rather than private-state mutation or timing sleeps. Add asset-loader coverage where app mocks cannot prove actual cleanup.
- Run required-runtime checks and a browser smoke check of loading, start, pause, restart, and recoverable failure/retry. Record what was actually exercised.
- Record the disposal/asset ownership contract in the decision log and align the lifecycle paragraph in the original plan.

## Evidence

- 2026-09-19 review follow-up: added controlled `Assets.unload()` rejection coverage. The test observes all URLs attempted, the failed URL retained for a second cleanup, and no second unload of successful URLs. Added `GameApp` tests for cleanup rejection on immediate dispose and after a pending load resolves following dispose; both observe the cleanup error log, and Jest completes without unhandled rejection. No lifecycle code change was needed. Actual executables: Node `16.16.0`, npm `8.11.0`. Focused Jest command (`src/ui/GameUI.test.ts src/assets/GameAssets.test.ts src/app/GameApp.test.ts`) passed: 12 tests, 3 suites. `npm run typecheck`, `npm run lint`, `npm run format:check`, and `git diff --check` passed.
- 2026-09-19: `GameApp` now disposes resources even before `start()`, rejects subsequent starts, removes ticker/listeners once, invalidates late callbacks, and waits for an in-flight load to settle before unloading. A live app permits one load at a time and retains failure/retry. `GameAssets` unloads all successful URLs after partial failure, including late successes; failed unload URLs remain available for another cleanup attempt. Cleanup rejections from void-triggered app operations are caught and logged.
- Regression coverage uses boundary mocks and deferred promises for construction disposal, repeated disposal, late progress/success/rejection, overlapping retry suppression, partial loader failure, live retry, and ticker ownership. No private state mutation or timing sleeps were used.
- Actual executables: Node `16.16.0`, npm `8.11.0` via registry packages. `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test -- --runInBand` (45 tests, 9 suites), and `npm run build` passed; final Vite build transformed 471 modules.
- In the Codex in-app browser at `http://127.0.0.1:4177/`, verified ready/loading completion, Start, Pause, Resume, Game over, and Play again resetting score/lives/stage to `0/10/1`. Temporarily removed one local food image to force load failure, observed the error and Retry control, restored the file, then verified Retry returned to ready and Start entered play. The image is restored. The induced missing-image request produced an expected browser error; no other browser error was observed.
- Lifecycle ownership is documented in [D21](../decisions.md#d21--single-owner-application-and-asset-lifecycle) and the [original plan](../plan.md#state-and-lifecycle). Remaining gap: browser inspection cannot directly observe GPU/cache release after disposal; deferred unit tests exercise the unload calls and their ordering. Simultaneous `GameApp` instances sharing Pixi's global cache are unsupported by contract.
