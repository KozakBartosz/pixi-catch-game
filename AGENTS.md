# Agent instructions

## Before working

- Read [CONTEXT.md](CONTEXT.md) when naming gameplay concepts or changing progression behavior; keep unresolved terminology distinct from adopted rules.

- Read [docs/plan.md](docs/plan.md) for gameplay scope, module boundaries, and lifecycle behavior before implementation.
- Read [docs/decisions.md](docs/decisions.md) before changing architecture or gameplay assumptions. It distinguishes adopted decisions from open tuning choices.
- Read [docs/stack.md](docs/stack.md) before dependency, tooling, or rendering changes. Inspect the actual package/configuration files for current versions and commands.
- Read [docs/tasks.md](docs/tasks.md) when implementing a planned task. Follow its dependencies and acceptance criteria; a request for documentation alone does not start implementation tasks.

## Implementation conventions

- Keep simulation code in `src/game/` independent of PixiJS and the DOM. Route presentation effects through typed gameplay events.
- Use explicit types for variables, class attributes, parameters, and function returns. Use classes for stateful behavior and typed data/functions where they keep the code clearer.
- Create modules as their behavior is implemented. The proposed layout is a responsibility map, not a mandate to generate empty abstractions.
- Preserve the required Node/npm compatibility. Run verification with the required executable versions; configuration declarations alone are not evidence.
- Consult [asset sources](public/assets/SOURCES.md) when integrating or replacing graphics, and retain attribution and supplied documentation.

## Verification and handoff

- Run checks appropriate to the changed behavior using the scripts actually present in `package.json`. Check rendering/input changes in a browser and gameplay rules with deterministic tests once the test runner exists.
- For documentation-only changes, verify local links and consistency with the code and related documents.
- Record checks and remaining gaps under the affected task before marking it complete. Update `stack.md` when installed tooling or environment facts change.
- Keep project documentation in English. Record a changed architectural decision in `decisions.md` and align the plan/tasks that depend on it. Preserve the rationale of superseded decisions with a link to their replacement.
