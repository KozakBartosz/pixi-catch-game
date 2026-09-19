# Q05 — Pointer ownership and verification gaps

Status: planned. Dependencies: Q02, Q03, Q04.

## Work

- Release active DOM pointer capture when clearing input on pause, restart, blur, and disposal. Handle already-lost capture and reentrant lostpointercapture safely; clear ownership consistently.
- Preserve single-pointer ownership, board-start rejection, live coordinate mapping, clamping, model speed limits, and current keyboard semantics.
- Remove --passWithNoTests from the test script and align the stack's script description.
- Add a focused maximum-frame-delta collision regression asserting observable one-time catch/damage and terminal behavior. Review existing coverage first to avoid duplicates.
- Verify Q01–Q04 regressions cover their actual boundaries rather than merely mock calls that cannot prove behavior. Do not add tests just to increase counts.

Primary files: [InputController](../../src/input/InputController.ts), [input tests](../../src/input/InputController.test.ts), [model tests](../../src/game/GameSession.test.ts), [package.json](../../package.json).

## Acceptance and verification

- Boundary tests prove capture release on clearing/disposal, safe capture loss, and no retained movement target after cancellation. Existing resize and keyboard-priority behavior stays intact.
- Normal test discovery runs the suite; a deliberately empty test selection fails using the existing Jest tooling, without deleting test files.
- Browser checks cover drag/release, dragging outside the board, pause/resume, resize, and separate HTML controls.
- Real touch-device check covers portrait/landscape, rotation during a held drag, interruption/backgrounding, return and explicit resume, and restart. Record device, OS/browser, observations, and any failures.
- If hardware is unavailable, retain this task as partially verified with the exact device gap. Synthetic pointer events do not close real-touch acceptance. Independent Q06/Q07 preparation may continue, but final plan completion awaits this check.
- Run required-runtime checks. Update environment facts only from observed results.

## Evidence

Not started.
