# Responsive presentation research

Reviewed 2026-09-18 against installed PixiJS 7.2.4 declarations and current browser documentation.

## Recommendation

Fill the viewport with the canvas and background; contain-fit the existing 800 × 600 logical world. Use `scale = min(width / 800, height / 600)` and offsets `(width - 800 * scale) / 2`, `(height - 600 * scale) / 2`. Simulation coordinates remain unchanged. Future pointer mapping subtracts the canvas origin and board offset, then divides by scale.

| Approach | Effect | Choice |
| --- | --- | --- |
| Stretch to viewport | Fills area but distorts sprites and apparent movement | Reject |
| Cover/crop | Fills area but hides items and board edges | Reject |
| Resize logical world | Uses every pixel for play but changes distances and difficulty | Defer; requires separate gameplay design |
| Contain fixed world, full-viewport backdrop | Full board visible with stable rules and proportional art | Adopt |

`renderer.resize` changes the output surface; scaling/centering the scene is a separate responsibility. PixiJS 7 supports `resolution` and `autoDensity`; use device pixel ratio capped at 2 to bound backing-buffer cost. `ResizeObserver` follows the actual root size, including layout/fullscreen changes. Use a full-viewport root with `100dvh` and `100vh` fallback; dynamic units follow changing mobile browser chrome. Keep HUD and controls in HTML at readable CSS sizes, including safe-area padding.

Browser fullscreen is separate from filling the browser viewport. `requestFullscreen()` needs transient user activation, is asynchronous, and may reject or be unavailable. Provide a supported-only toggle, catch rejection, and observe `fullscreenchange` to handle Escape. A failure must leave ordinary play intact.

Nearest texture filtering prevents smoothing; arbitrary fractional viewport scales can still produce uneven pixel widths. Exact integer scaling would waste more screen area, so uniform fractional fitting is the chosen tradeoff.

## Sources

- [PixiJS 7.2.4 Application API](https://pixijs.download/v7.2.4/docs/PIXI.Application.html): version-matched application and renderer options.
- [PixiJS Renderer API](https://api.pixijs.io/%40pixi/core/PIXI/Renderer.html): renderer sizing and resolution. Checked against installed `@pixi/core` declarations.
- [MDN ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver): element-size observation and observer disposal.
- [MDN CSS length units](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length): dynamic viewport units.
- [MDN requestFullscreen](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen): activation, support and failure behavior.

Implementation and acceptance criteria: [T04a](tasks.md#t04a--viewport-sized-presentation-and-optional-fullscreen). Adopted decision: [D17](decisions.md#d17--fill-the-viewport-with-a-scaled-logical-board).
