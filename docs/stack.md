# Technology stack and environment

Read this file before installing dependencies, changing tooling, or implementing rendering. Read [plan.md](plan.md) for architecture and [tasks.md](tasks.md) for work status.

## Required runtime

The assignment requires Node.js `16.16.0` and npm `8.11.0`. Check both executable versions before verification. An `engines` declaration or a successful build on another Node version does not prove compatibility.

```sh
nvm install 16.16.0
nvm use
node --version
npm --version
npm install
npm start
```

If npm differs, select npm `8.11.0` within the required Node environment. Keep dependency choices compatible with that environment; do not install latest versions blindly.

## Current implementation

Snapshot: 2026-09-18. `package.json`, `package-lock.json`, `.nvmrc`, and `tsconfig.json` are authoritative for exact configuration.

T03 provides a framework-free PixiJS application with a DOM-independent gameplay model, keyboard input, preloaded supplied character/food sprites, directional horizontal animation, recoverable loading UI, and HTML start/HUD/game-over controls. T04a adds a viewport-sized canvas, contain-fitted logical board, density capped at 2, responsive HTML controls, and optional fullscreen. T05 adds pause/resume, a stage HUD, configurable endless catch-based stages, and shape-distinct hazards; each falling item retains its spawn speed. Pointer/touch movement is deferred to T04b after T07; its need will be reassessed then (D19). Jest runs deterministic model tests under Node; browser verification remains necessary for PixiJS, DOM, assets, animation, and input integration.

| Technology | Current version | Purpose |
| --- | --- | --- |
| TypeScript | 4.9.5 | Application language, strict checking. |
| PixiJS | 7.2.4 | Canvas/WebGL rendering and sprite animation. |
| Vite | 3.2.11 | Local development and production bundling. |
| ESLint | 8.57.1 | TypeScript linting with explicit-type rules. |
| Prettier | 2.8.8 | Source and project-configuration formatting. |
| Jest / ts-jest | 29.7.0 / 29.1.2 | Node-based unit tests for the pure gameplay model. |
| HTML/CSS | Browser native | Page layout and game interface. |

Use PixiJS 7 APIs matching the installed package. Examples for other major versions may have different initialization or lifecycle APIs. No Vue/React template is required by the assignment.

Available scripts:

- `npm start`: start the Vite development server.
- `npm run typecheck`: check TypeScript without emitting files.
- `npm run build`: type-check and create the production bundle in `dist/`.
- `npm run preview`: serve the production bundle locally.
- `npm run lint`: lint TypeScript under `src/`.
- `npm run format`: format maintained source and root configuration files.
- `npm run format:check`: verify formatting without changing files.
- `npm test`: run Jest once; it permits no test files until gameplay tests are added in T02.

The lint configuration is rooted in this project and enforces explicit types for variables, parameters, class members, and function returns. The formatting scope deliberately excludes downloaded assets, generated output, the lockfile, and existing prose documents. `node-releases` is overridden to `2.0.27` because its newer transitive release requires Node 18 even though Jest 29 and ts-jest 29 support the required Node 16 runtime.

## Assets

- Character PNGs: `public/assets/characters/`.
- Food PNGs: `public/assets/food/` (64 individual items plus a combined sheet).
- Audio destination: `public/assets/audio/` (no effects added yet).
- Attribution and source URLs: [SOURCES.md](../public/assets/SOURCES.md).
- Original food documentation: [readme.txt](../public/assets/food/readme.txt).

Files under `public/` are served from the site root; for example `/assets/food/Apple.png`. Preserve original asset names until an explicit manifest or documented conversion is introduced. Keep attribution when integrating the art.

## T01 verification and repository location

- The project was moved to `/Users/bartosz/Work/pixiGame`. The old location inside `BraniborskaWEB` is obsolete.
- A standalone local Git repository is initialized at this project root. It has no remote. `.gitignore` excludes `node_modules/`, `dist/`, `.DS_Store`, and log files.
- On 2026-09-17, `npm ci`, `npm start`, `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test`, and `npm run build` passed with Node `16.16.0` and npm `8.11.0`. The development server returned HTTP 200 from `http://127.0.0.1:4177/` during verification.
- The earlier Tailwind warning did not reproduce from this standalone project. It has no Tailwind package or configuration; the obsolete neighboring `BraniborskaWEB` project contains `tailwind.config.ts`, so running from or inheriting configuration from that former location was the likely source.
- `npm audit` reports two unresolved development-server findings: one moderate advisory through Vite's esbuild dependency and one high Vite finding. npm proposes Vite 8.3.0 as the available remediation, but Vite 8 requires a newer Node runtime and is incompatible with the assignment constraint. No forced audit fix was run. Keep the development server bound to a trusted local interface and revisit these findings if the required runtime changes.
- A clean install emits deprecation notices from the Node-16-compatible ESLint 8 dependency tree. These are tooling lifecycle notices rather than installation failures; newer ESLint major versions require a newer runtime/tooling migration.

## Testing boundary

Keep automated unit tests focused on the pure gameplay model and use browser checks for rendering and interaction. T02 introduced deterministic gameplay tests; T03 review added body-hitbox regression coverage. T04a adds layout and fullscreen-controller boundary tests without requiring WebGL or a DOM test package. T05 adds stage/hazard rules and application visibility/ticker integration tests using boundary doubles. There are 24 tests in five suites. T01 verified the configured Jest runner on the required runtime.
