# Q04 — Theme transitions and visual restart

Status: planned. Dependencies: Q03.

## Work

- Replace repeated rounded interpolation from the current tint with elapsed-time interpolation from an explicit start tint to a target tint over 1.5 seconds of active animation time.
- On a target change during a blend, use the currently displayed color as the next start. Repeated rendering of the same target must not restart interpolation.
- Snap exactly to the target at completion. Preserve the independent background day/crossfade/night cycle and pause behavior.
- Restart resets background cycle, current/target tint, transition time, and feedback to the first configured stage's atmosphere before the first visible gameplay frame.
- Extract a small pure interpolation helper only if it improves testability; avoid restructuring unrelated rendering behavior.

Primary files: [GameView](../../src/rendering/GameView.ts), [background cycle](../../src/rendering/backgroundCycle.ts), [GameApp](../../src/app/GameApp.ts).

## Acceptance and verification

- Deterministic tests cover initial, intermediate, and exact final colors; changed targets; repeated same-target renders; pause; and restart from a later theme, including a non-default first configured theme.
- Verify equivalent elapsed active time across different frame partitions within rounding tolerance; the final color matches exactly.
- Browser checks confirm a smooth transition, preserved background cycle, immediate correct restart atmosphere, and retained reduced-motion catch feedback.
- Run required-runtime checks and align documentation describing transition duration and reset behavior.

## Evidence

Not started.
