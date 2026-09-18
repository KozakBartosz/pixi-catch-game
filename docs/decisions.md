# Decision log

Recorded: 2026-09-17, from the planning discussion and [plan.md](plan.md).

“Adopted” means selected for the implementation plan, not already implemented. Current tooling and verification status belong in [stack.md](stack.md); execution progress belongs in [tasks.md](tasks.md). Assignment constraints are identified separately from our design choices.

## D01 — Preserve the assignment runtime

Status: required constraint.

Decision: support Node.js 16.16.0 and npm 8.11.0, with `npm install && npm start` as the delivery entry point.

Reason: these versions and commands are explicitly specified in the assignment.

Consequence: dependency and test-tool versions must be compatible. A successful build on newer Node is insufficient evidence. Exact-runtime verification remains pending.

## D02 — Use a small TypeScript/PixiJS/Vite application

Status: adopted; initial scaffold exists.

Decision: use the existing standalone scaffold and native HTML/CSS for the interface. The suggested starter repositories are optional; no frontend framework is needed for the planned screens.

Reason: the assignment prioritizes readable organization, and the UI is small. This keeps the project focused on gameplay rather than template infrastructure.

Consequence: application lifecycle and UI wiring are explicit. Exact dependency versions remain in package configuration and the stack snapshot.

## D03 — Horizontal catching defines the gameplay

Status: adopted interpretation of the assignment.

Decision: the character stays at the bottom and moves left/right. Contact catches food automatically. Use idle and horizontal movement animations from the supplied pack.

Reason: the requested mechanic is catching falling objects. Available vertical movement and attack frames do not introduce additional gameplay requirements.

Consequence: combat and vertical movement remain outside scope. Unused source images can stay available without being loaded into the game.

## D04 — Separate simulation from presentation

Status: adopted.

Decision: `GameSession` owns gameplay state and rules without importing PixiJS or DOM APIs. `GameApp` coordinates it with rendering, input, and HTML UI.

Reason: scoring, lives, collision behavior, and progression should be testable without a graphics environment.

Consequence: the view displays model state; it cannot award points or remove lives. Dependencies are supplied explicitly rather than accessed through global services.

## D05 — Apply OOP to behavior, not every data object

Status: adopted refinement of the initial architecture.

Decision: use classes for state and resource ownership; represent players/items as typed data when sufficient and collision calculations as pure functions. Extract spawning/audio classes when their implemented responsibilities justify them.

Reason: the initial one-class-per-concept proposal introduced more structure than the first version needed. Readability is the assignment's main code-quality criterion.

Consequence: prefer composition, focused files, and explicit types. The target module list guides ownership without requiring empty classes, a global event bus, or an entity framework.

## D06 — Use one explicit gameplay update pipeline

Status: adopted.

Decision: advance gameplay through `GameSession.update(dtSeconds, input)` in the order documented in the plan. Resolve each item once and stop gameplay when the session ends. Inject randomness for deterministic tests.

Reason: an explicit order makes catches, misses, and terminal behavior traceable and avoids independent callbacks mutating the same state unpredictably.

Consequence: movement uses elapsed time; large time steps need bounded handling. The exact collision/substep algorithm is still an implementation choice.

## D07 — Return typed events for feedback

Status: adopted.

Decision: updates return events such as `itemCaught`, `lifeLost`, and `gameOver`; rendering and audio consume them.

Reason: effects should follow a resolved gameplay outcome without becoming part of scoring or collision logic.

Consequence: a simple returned event list is sufficient. Event delivery must not replay scoring feedback on later frames or after restart.

## D08 — Scale a fixed logical board

Status: adopted.

Decision: preserve logical board dimensions and aspect ratio while scaling the presentation to the window. Translate pointer coordinates into board coordinates and share the gameplay input contract between keyboard and touch.

Reason: screen size should not change movement speed, collision geometry, or difficulty.

Consequence: layouts may need surrounding space to preserve the aspect ratio. Board dimensions, exact touch interaction, and key bindings remain implementation/tuning choices.

## D09 — Deliver a full session before polish

Status: adopted.

Decision: first implement start → play → game over → restart using simple visuals. Add supplied art, responsive input, levels, and effects in later tasks.

Reason: a complete session tests state ownership and cleanup earlier than isolated polished screens.

Consequence: restart resets the full session and reuses a single application loop. Loading belongs to application/UI lifecycle; gameplay states belong to the session. Pause freezes simulation and spawn timers, with explicit resume after hiding the tab.

## D10 — Define progression through data

Status: adopted architecture; terminology and trigger refined by [D12](#d12--make-progression-visible-through-stages). Tuning is open.

Decision: keep stage catch thresholds, fall speeds, spawn intervals, and eligible food in typed configuration. Stage changes affect newly spawned items; existing items keep their speed.

Reason: configuration makes progression easy to extend, and retaining existing speeds avoids sudden changes to visible trajectories.

Consequence: the original score-based level proposal is superseded by D12's caught-item-based stages. Bounded difficulty remains the working design. Numeric thresholds, speeds, intervals, and the difficulty cap have not been selected.

## D11 — Verify rules separately from browser behavior

Status: adopted.

Decision: use deterministic model tests for scoring, misses, terminal state, pause, restart, bounds, and progression; use browser checks for assets, rendering, resizing, input, and lifecycle integration.

Reason: each check should exercise behavior at the layer that owns it.

Consequence: test-tool selection remains part of environment setup. Record actual results, including runtime versions, before declaring tasks complete.

## Open choices

- Further playtesting of stage catch thresholds, difficulty and hazard share; initial values are adopted in D20.

- Logical board dimensions, hitbox sizes, collision algorithm, and initial balance values.
- Specific food selection, background treatment, audio source, and touch interaction.
- Remote repository destination; standalone local Git setup is still pending.

Resolve these during the relevant task and record consequential choices here. Combat remains outside scope; hazards are provisionally included by D14.

## D12 — Make progression visible through stages

Status: adopted during the design interview on 2026-09-17; visual details and catch thresholds are open.

Decision: divide play into recognizable stages that change visual atmosphere and increase difficulty together, with lighting changes as the initial proposed visual technique. Advance stages based on the number of food items caught during the current run, rather than elapsed survival time. Use one stage progression system rather than separate visual stages and difficulty levels. Exact thresholds remain to be tuned.

Reason: the player should feel progression beyond a changing score or difficulty value.

Consequence: each stage needs configurable visual settings, catch thresholds, and difficulty settings. Count caught items explicitly as the progression metric; its current numerical equivalence to score does not make future bonus points stage progress. Exact palettes, transition effects, and speed/spawn tuning remain undecided. D13 settles the endless progression model. See [CONTEXT.md](../CONTEXT.md) for terminology.

## D13 — Generate endless progression and cycle visual themes

Status: adopted during the design interview; formula and limits remain open.

Decision: derive successive stage settings from configuration and stage number, while cycling through a finite collection of prepared visual themes. A run continues until lives reach zero rather than ending with a final-stage victory.

Reason: repeated themes and parameter-driven progression provide ongoing stages without hand-authoring every stage or generating new artwork.

Consequence: theme selection wraps independently of the stage number; wrapping a theme does not reset difficulty or catch progress. This refines D10: configuration describes progression rules rather than an exhaustive list of stages. Exact formulas and difficulty limits require playtesting.

## D14 — Add avoidable hazards alongside food

Status: provisional, accepted for playtesting; revise if the mechanic does not feel right.

Decision: catching food awards one point; missing food costs one life. Contact with a hazard costs one life, while a hazard leaving the board costs nothing. Hazards award neither points nor catch progress. Each item resolves only once. Later stages increase the proportion of hazards relative to food; exact ratios and spawn rates remain open.

Reason: choosing what to catch adds difficulty beyond simply increasing fall speed. This is an explicit extension to the original assignment, whose missed-item penalty applies to food in this design.

Consequence: item kind must determine contact/miss outcomes. Hazards must be recognizable beyond color alone. Preserve a meaningful supply of food so catch-based progression remains possible. Food penalties and hazard contacts share the same ten-life pool; reaching zero ends the run. D15 settles initial spawn placement; D16 settles simultaneous damage.

## D15 — Start with random spawn placement; defer fairness constraints

Status: adopted for the first version; fairness improvements explicitly deferred.

Decision: sample spawn positions randomly within board bounds using the configured spawn timing and item proportions. Initially impose no minimum separation or guaranteed escape/catch route between food and hazards.

Reason: the user prefers to evaluate the simpler random version first and revisit fairness later.

Consequence: overlapping or unavoidably damaging combinations are an accepted first-version limitation. This does not bypass board bounds, item lifecycle rules, or deterministic randomness in tests. Track reaction-time, separation, and reachable-route constraints as follow-up work rather than a release prerequisite.

## D16 — Apply damage per hazard without temporary protection

Status: adopted; design interview concluded at the user's request.

Decision: each hazard contact removes one life independently. There is no invulnerability window or damage cooldown after a hit. Multiple hazards can remove multiple lives in the same update, until lives reach zero.

Reason: the user declined temporary protection for the initial game.

Consequence: resolve each hazard at most once, clamp lives at zero, and end the run immediately when no lives remain. Missed food still removes one life per item. Tests must cover multiple contacts, one-time resolution, and game over without negative lives. Numerical tuning can proceed during implementation without reopening the interview.

## D17 — Fill the viewport with a scaled logical board

Status: adopted on 2026-09-18; refines D08 for T04a.

Decision: the application root, renderer canvas and decorative background fill the viewport. Uniformly scale and center the fixed 800 × 600 gameplay board using contain fitting. HTML controls retain independent responsive CSS sizing. Offer browser fullscreen only through an explicit control; viewport filling works without it. Cap rendering density at 2 while retaining nearest-neighbor texture sampling.

Reason: the fixed CSS card wastes available space. Stretching distorts art; cover fitting hides gameplay; expanding logical dimensions changes travel times and difficulty across devices. Contain fitting preserves D08 while using the maximum available space for the whole board.

Consequence: differing screen proportions leave decorative space alongside or above/below the board, especially in portrait. This is an intentional tradeoff, not an additional playable area. Fullscreen support is optional and must degrade gracefully. Resize affects only presentation. See [research and references](responsive-research.md) and [T04a](tasks.md#t04a--viewport-sized-presentation-and-optional-fullscreen).

## D18 — Use a stable character-body catch rectangle

Status: adopted on 2026-09-18 during T03 review fixes.

Decision: use a 48 × 120 logical player rectangle aligned to the center and bottom of the supplied character at scale 1.5, with bottom margin 24. Idle opaque bounds are approximately 51 × 123; cape, sword and stride extensions do not change catch geometry between animation frames.

Reason: the earlier 104 × 28 placeholder paddle caught food beside the body and allowed it through the upper body. A stable body rectangle makes contact understandable while keeping collision independent of textures and animation.

Consequence: narrower horizontal reach changes initial catch difficulty intentionally. Animation pixels are not a per-frame collision mask. Geometry remains configuration-driven and independent of viewport scaling.

## D19 — Defer touch controls until after delivery verification

Status: adopted at the user's request; refines the scheduling of D08 and D17.

Decision: move T04b to the end, after T07. Reassess whether touch/pointer movement is needed before implementing it. Keep responsive presentation and keyboard controls in the current delivery scope.

Reason: touch support is not required by the assignment, and the user is unsure it is needed.

Consequence: T04b no longer blocks T04 completion or T05–T07. T05 can use the implemented T04a layout while the native Escape smoke check remains open; that check must be completed before T07 closes. The fixed-board coordinate mapping design remains available for later touch support. Earlier scheduling of touch alongside responsive presentation is superseded by this decision.

## D20 — Initial stage tuning and explicit pause/resume

Status: adopted for T05; values remain subject to playtesting.

Decision: advance one stage every 5 food catches. Starting from stage 1, use fall speed `min(420, 210 + 30 * (stage - 1))`, spawn interval `max(0.4, 0.8 - 0.05 * (stage - 1))` seconds, and hazard probability `min(0.35, 0.05 * (stage - 1))`. Cycle theme identifiers `midnight`, `sunset`, `aurora`; visual theme treatment remains T06. Each item stores its spawn-time fall speed. A running spawn countdown is retained across a stage change; subsequent intervals use the current stage.

Reason: stage 1 introduces food alone. Catch-based advancement increases speed, density and hazard share within bounds, retaining at least a 65% food probability. Configuration allows later tuning without branching stage logic.

Decision: provide HTML Pause/Resume buttons and pause when the document becomes hidden. Returning to the tab never resumes automatically. Clear held input at transitions and discard the first ticker update after start/restart/resume so a stale frame delta cannot advance gameplay. Freeze the current character animation frame during pause.

Consequence: the model stays independent of browser visibility and PixiJS. Application coordination owns visibility and ticker handling; disposal removes its listener. Hazards use a spiked cross shape, distinct from food beyond color; T06 may improve presentation without changing damage rules. Simultaneous contact resolution follows item order and stops immediately at zero lives; contact resolution precedes missed-food penalties.
