# Q03 — Configuration and presentation contracts

Status: planned. Dependencies: Q01.

## Work

- Validate configuration once at the model boundary. Require finite numbers, positive simulation/frame/spawn intervals and fall speeds, positive integer lives and catch thresholds, usable board/player/item dimensions, and a nonnegative valid bottom margin.
- Permit valid zero values such as initial spawn delay, progression increments, and hazard probability. Require coherent speed/spawn caps and hazard probabilities within 0–1, with nonnegative increments/decrements and a nonempty supported theme sequence.
- Reject invalid configuration with a specific field/error before starting update loops. Keep shipped defaults unchanged.
- Copy nested stage configuration and theme arrays into session-owned data. Caller mutations after construction must not alter that session.
- Expose deeply read-only snapshot contracts, including player, item entries, and item arrays; preserve independent snapshot copies. Internal mutable simulation state may keep its own types.
- Introduce a small shared theme identifier contract and exhaustive renderer mapping without importing PixiJS into the model. Unknown runtime theme configuration fails clearly; do not mask misspellings with a renderer fallback.
- Pass logical board dimensions from one app configuration into session, viewport, and view. Remove fixed board/center values from background and overlay geometry. Document supported geometry constraints and any fixed character-art scale.

Primary files: [types](../../src/game/types.ts), [GameSession](../../src/game/GameSession.ts), [stages](../../src/game/stages.ts), [GameApp](../../src/app/GameApp.ts), [GameView](../../src/rendering/GameView.ts).

## Acceptance and verification

- Table-driven tests reject invalid fields, NaN/infinity, empty/unknown themes, and inconsistent caps; cover legitimate zero values and shipped defaults.
- Mutating caller-owned nested configuration after construction does not change stage settings. Snapshot consumer types prohibit nested mutation without making internal updates cumbersome.
- Existing scoring, progression, collision, pause, and restart tests pass with unchanged default behavior.
- Verify a second valid board size through model/view/viewport wiring and in a browser; backgrounds and overlays match the board and input mapping remains aligned. Restore the shipped default configuration afterward.
- Run required-runtime checks, record the shared contracts in decisions, and update the README extension instructions to match the supported changes.

## Evidence

Not started.
