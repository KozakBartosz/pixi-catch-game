# Quality improvement plan

Status: Q01–Q02 complete; Q03–Q07 planned. Created 2026-09-19 from the [recruitment review](../../score.md) and the follow-up discussion.

Goal: address demonstrated weaknesses in lifecycle, configuration, interaction, verification, and delivery while preserving the small game's readable architecture. “10/10” is an ambition, not a promised review score.

This folder owns the new Q-series task ledger. The [original task ledger](../tasks.md) remains the historical implementation record. Read the [domain context](../../CONTEXT.md), [implementation plan](../plan.md), [decisions](../decisions.md), and [stack](../stack.md) before implementation. Current source and package files take precedence over historical descriptions of implementation status.

## Task order

| Task | Outcome | Dependencies | Status |
| --- | --- | --- | --- |
| [Q01](Q01-lifecycle.md) | Predictable disposal and cleanup of asynchronous asset work | None | Complete |
| [Q02](Q02-ui-transitions.md) | Named UI actions, scoped elements, accessible screen transitions | Q01 | Complete |
| [Q03](Q03-configuration.md) | Validated configuration, shared dimensions, read-only snapshots, typed themes | Q01 | Planned |
| [Q04](Q04-rendering.md) | Exact theme transitions and a complete visual restart | Q03 | Planned |
| [Q05](Q05-input-verification.md) | Pointer ownership and focused regression/device coverage | Q02, Q03, Q04 | Planned |
| [Q06](Q06-assets.md) | Documented asset provenance or replacement artwork | None | Planned |
| [Q07](Q07-delivery.md) | Consistent documentation and fresh delivery evidence | Q01–Q06 | Planned |

Recommended execution: Q01 → Q02 → Q03 → Q04 → Q05 → Q06 → Q07. Q06 can be brought forward if asset information is available; resolve it before public distribution. Dependencies express prerequisites, not a request to launch parallel agents.

## Scope and completion

- Preserve scoring, ten starting lives, catch-based stages, hazard behavior, difficulty defaults, fixed-board viewport scaling, and the DOM/PixiJS-independent simulation.
- Keep explicit TypeScript types, focused stateful classes, and typed gameplay events. Do not introduce an ECS, backend, generic item framework, or a fairness solver.
- Each task includes implementation and its own relevant tests. Q05 closes remaining verification gaps; it does not postpone earlier task testing.
- Use Node 16.16.0 and npm 8.11.0 for checks; record actual executable versions. Use scripts from the current package.json. Avoid dependency changes unless required and compatible.
- For code changes run typecheck, lint, format check, relevant tests, and build as appropriate. Rendering/input/UI changes also need browser checks. The final task runs the complete delivery checks once against the integrated result.
- Record changes, commands/results, browser/device details, and remaining gaps in the task's Evidence section before changing its status here and in its own file. Do not claim an unavailable device check passed.
- Record changed architectural contracts in the decision log when implemented, and align affected plan/README/stack descriptions in that task. Q07 reconciles remaining historical contradictions.
- Missing external information blocks only the dependent acceptance item. Keep completed work and evidence; report precisely what remains. Never mark the whole plan complete with required acceptance gaps.
- Documentation-only work requires local-link and consistency checks, not gameplay test runs. Planning alone does not authorize starting implementation, publishing, or modifying asset files.

## Deferred follow-up

Seeded playtest capture is optional and outside Q01–Q07. Reopen only when investigating balance: capture seed, configuration, stage, player and item state, and expected viable action. A seed reproduces randomness, not an entire interactive run; full replay also needs input and simulation timing. Keep the existing D15 fairness policy until evidence supports a measurable replacement.

Online rankings, additional item behaviors, saved preferences, extra effects, public hosting, and a toolchain/runtime migration are outside this plan. Q07 prepares a local handoff; publishing requires a specified destination and request.

## Planning verification

- 2026-09-19: compared task scope with score.md, current source contracts, package scripts, and project documentation. No implementation tasks started. Local Markdown links checked after creating this folder.
