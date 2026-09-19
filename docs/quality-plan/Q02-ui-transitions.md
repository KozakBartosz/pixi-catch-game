# Q02 — UI contracts and screen transitions

Status: complete. Dependencies: Q01.

## Work

- Replace seven positional GameUI callbacks with a typed named actions object. Update app wiring and callback-index-based tests.
- Pass the UI root explicitly and resolve required elements within it. This scopes DOM ownership; global input and asset ownership still do not promise multiple simultaneous game instances.
- Add concise English instructions for press/hold/drag alongside keyboard controls, matching the existing speed-limited movement behavior.
- Detect actual screen-state transitions. Focus Start when loading becomes ready, Resume on pause, and Play again on game over. Announce game over and final score with an appropriate HTML live/status mechanism.
- Define a visible, meaningful focus destination when Start/Resume/Play again becomes hidden, such as the now-visible Pause control. Keep retry focus behavior and handle loading recovery.
- Never refocus on every HUD render or announce every frame. Avoid duplicate result announcements; retain visible focus and usable mute/fullscreen controls.

Primary files: [GameUI](../../src/ui/GameUI.ts), [GameApp](../../src/app/GameApp.ts), [HTML](../../index.html), [styles](../../src/style.css).

## Acceptance and verification

- Focus never remains on a hidden control after each supported transition. Repeated render calls in the same state do not steal focus.
- Scoped element lookup and named action wiring have focused boundary tests. Transition tests exercise loading/retry, ready, playing, paused, and game over.
- Keyboard-only browser checks cover start → pause → resume → game over → restart, including Tab, Enter, and Space. Inspect the announcement and accessible names; report whether a real screen reader was used.
- Narrow portrait and landscape screens show readable instructions and reachable controls without horizontal overflow.
- Run required-runtime code checks and update control documentation if wording or behavior changes. Do not claim complete nonvisual gameplay accessibility.

## Evidence

- 2026-09-19 review follow-up: `GameUI.render()` now writes score, lives, stage, and final score only when their text changes. The regression counts `textContent` setter calls: repeated snapshots add no writes, and a lives-only change writes only lives. Existing transition tests still check one-time game-over announcement and focus. Actual executables: Node `16.16.0`, npm `8.11.0`; focused Jest command passed (12 tests, 3 suites), as did `npm run typecheck`, `npm run lint`, `npm run format:check`, and `git diff --check`. Previous browser evidence below remains the browser check for these transitions; no new browser run was performed for this text-write change.
- 2026-09-19: `GameUI` now takes an explicit root and named `GameUIActions`. App wiring and Q01 callback tests use action names. Root-scoped lookup, all seven action dispatches, retry, and screen transitions have focused tests. Loading, ready, playing, paused, and game-over transitions move focus once to a visible destination; the final score is announced once through a dedicated polite status. Repeated renders preserve focus and do not rewrite the announcement. Start instructions now describe touch press/hold/drag in English. Mute and fullscreen wiring remains intact.
- Actual executables: Node `16.16.0`, npm `8.11.0` (`~/.local/share/fnm/node-versions/v16.16.0/installation/bin`). `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test -- --runInBand` (47 tests, 10 suites), and `npm run build` (474 modules) passed.
- Production preview in the Codex in-app browser at `http://127.0.0.1:4177/`: Enter started the game; Space paused; Resume continued. An unattended full run reached zero lives and displayed `Game over. Final score: 0.` with Play again focused. Space restarted with score/lives/stage `0/10/1` and Pause focused. Tab was exercised on the pause screen; controls remained keyboard reachable. The browser accessibility tree exposed the status text, labeled controls, and expected focus destinations. Mute changed to Sound off (`aria-pressed=true`); fullscreen changed to Exit fullscreen (`aria-pressed=true`) and back. Their existing unit tests also passed.
- Narrow portrait (320×640 override) and landscape (640×320 override) showed controls without horizontal overflow; landscape start instructions were readable. A temporary removal of `dist/assets/backgrounds/day.png` produced the expected loading error and focused Retry loading. The file was restored; Enter on Retry returned to ready and focused Start game. The induced 404 and loader console error were expected.
- Gap: no real screen reader or physical touch device was used. Accessibility claims here cover DOM structure, browser accessibility tree, visual layout, keyboard operation, and focus only. Nonvisual gameplay itself remains outside Q02 scope.
