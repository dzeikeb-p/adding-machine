# Adding Machine — Decision Log

Each entry records a decision made during the project build.
Format: date · topic · decision · rationale · status.

---

## 2026-05-11 — Project Setup

### Package manager: pnpm
**Decision:** Use pnpm with workspaces.
**Rationale:** Faster installs, strict dependency isolation, native workspace support, and `pnpm-workspace.yaml` gives a clean single-file workspace config. Consistent with the SPEC.
**Status:** Active.

### Monorepo layout: npm workspaces via pnpm
**Decision:** Single repo with four packages (`core`, `api`, `mcp`, `web`) under `packages/`.
**Rationale:** Allows `@adding-machine/core` to be shared by all three consumers with a single source of truth for algorithms. Simpler than a multi-repo setup at this scale.
**Status:** Active.

### Linter + formatter: Biome
**Decision:** Biome replaces eslint + prettier.
**Rationale:** Single tool, single config file, fast (native binary), no plugin hell. The SPEC calls for it explicitly.
**Status:** Active.

### Biome rule: `noNonNullAssertion` disabled
**Decision:** Disabled `lint/style/noNonNullAssertion` in `biome.json`.
**Rationale:** TypeScript's `noUncheckedIndexedAccess` (required by the SPEC) makes every array access return `T | undefined`, so `!` assertions inside bounds-checked loops are necessary. Biome's rule conflicts with this pattern across all four algorithm files.
**Status:** Active.

### Testing framework: Vitest
**Decision:** Vitest for all packages; `@vitest/coverage-v8` for coverage.
**Rationale:** SPEC requirement. Native ESM support, fast, compatible with the Workers environment and Vite-based build chain.
**Status:** Active.

### Coverage threshold: 90%
**Decision:** 90% line/branch/function/statement coverage enforced on `packages/core`.
**Rationale:** Core is the pure algorithmic engine that all other packages depend on. High confidence here means less surface area to debug in the API and MCP layers.
**Status:** Active.

---

## 2026-05-11 — Phase 1: Core Engine

### PRNG: mulberry32
**Decision:** Implement mulberry32 seeded PRNG from scratch in `rng.ts`. Zero runtime dependencies.
**Rationale:** The SPEC requires "zero runtime deps" for core and a seeded RNG for reproducibility. mulberry32 is ~10 lines, fast, passes basic statistical quality tests, and produces a uniform float in [0, 1). `Math.random()` is not seedable in standard JS.
**Status:** Active.

### Seed hashing: djb2
**Decision:** Use a djb2-style hash to convert the string seed to a 32-bit unsigned integer for mulberry32.
**Rationale:** Simple, fast, zero deps. Only needs to be collision-resistant enough that similar-looking seeds produce different sequences, not cryptographically secure.
**Status:** Active.

### Random seed generation: `crypto.getRandomValues()`
**Decision:** `randomSeed()` uses `crypto.getRandomValues()` synchronously; returns a 16-char hex string.
**Rationale:** Available in all target runtimes (Node ≥14.17, Cloudflare Workers, browsers) and is synchronous. Avoids the async `subtle.digest` API.
**Status:** Active.

### SHA-256: pure TypeScript implementation
**Decision:** Implement SHA-256 directly in `sha256.ts` (~85 lines) instead of using Web Crypto or a package.
**Rationale:** Core must be synchronous (all four algorithm functions have sync signatures in the SPEC) and zero runtime deps. `crypto.subtle.digest()` is async-only; `node:crypto` is not available in CF Workers. Pure TS is the only option that satisfies both constraints.
**Status:** Active.

### foldIn text alignment: truncate-to-shorter
**Decision:** When A and B have different line counts, truncate the longer to match the shorter.
**Rationale:** The SPEC explicitly states "pick the shorter convention." Truncating is lossless in the sense that the fold result is deterministic and unambiguous. Padding with empty strings would silently add whitespace-only lines.
**Status:** Active.

### permutate: Heap's algorithm for `mode='all'`
**Decision:** Use the iterative form of Heap's algorithm to generate all permutations.
**Rationale:** Heap's is the standard in-place permutation generator with O(n!) time and O(n) space (no recursion stack blow-up). The iterative variant avoids call-stack limits for n=7.
**Status:** Active.

### permutate: Fisher-Yates sample for `mode='sample'`, large n
**Decision:** For n ≤ 7: generate all permutations then sample. For n > 7: generate `sampleSize` independent Fisher-Yates shuffles.
**Rationale:** For n ≤ 7 (n! ≤ 5040), generating all permutations first guarantees sampling without replacement. For n > 7 the full permutation space is enormous; independent shuffles are astronomically unlikely to collide in practice.
**Status:** Active.

### `"I AM THAT I AM"` distinct count: 30
**Decision:** The canonical test asserts exactly 30 distinct lines from `permutate("I AM THAT I AM", { mode: "all" })`.
**Rationale:** Words: I×2, AM×2, THAT×1. Multiset permutation count = 5! / (2! × 2! × 1!) = 120 / 4 = **30**. This is the historically grounded Gysin/Sommerville result that the SPEC explicitly calls out.
**Status:** Active (locked in snapshot test).

---

## 2026-05-11 — Phase 2: REST API

### Zod added to `packages/core` as a runtime dependency
**Decision:** Added `zod` as a `dependencies` entry in core's `package.json`.
**Rationale:** The SPEC states "all bodies validated with zod schemas exported from core." Making schemas part of core enforces a single source of truth. The "zero runtime deps" claim in the SPEC refers to the algorithm functions themselves; the schema layer is a deliberate addition for cross-package consistency.
**Status:** Active. Revisit if core is ever published as a standalone library targeting strict zero-dep environments.

### Schema location: `packages/core/src/schemas.ts`
**Decision:** All zod schemas (options, request bodies, API response) live in `core/src/schemas.ts` and are re-exported from `core/src/index.ts`.
**Rationale:** Ensures the API, MCP server, and web app all validate against identical schemas. Prevents drift where the API accepts inputs the core algorithms would reject, or vice versa.
**Status:** Active.

### API response adds `id` field (UUID v4)
**Decision:** Each API response appends an `id: string` (UUID v4 via `crypto.randomUUID()`) to the `CutUpResult` returned by core.
**Rationale:** The SPEC calls for "an `id` (ulid) for the run." `crypto.randomUUID()` is synchronous, available in CF Workers and Node ≥ 14.17, and produces a globally unique identifier without adding a runtime dependency. The distinction between ULID and UUID v4 is cosmetic at this stage; revisit if time-sortable IDs become useful for result storage.
**Status:** Active. May switch to ULID if/when KV-backed result storage is implemented (Phase stretch goals).

### KV-backed result storage: deferred (MVP)
**Decision:** No result storage, no `permalink` field in the API response.
**Rationale:** The SPEC explicitly marks this as optional for MVP: "if skipped, drop the permalink field." Avoids a KV binding dependency before the API is deployed and tested.
**Status:** Deferred to stretch goals.

### Hono app structure: `createApp()` factory
**Decision:** The Hono app is created by a `createApp()` factory function in `src/app.ts`; `src/index.ts` calls it and exports the result as the default Worker.
**Rationale:** Allows integration tests to import `createApp()` and call `app.request()` in Node/Vitest without a live CF Workers runtime. Clean separation between app logic and the Worker entry point.
**Status:** Active.

### Test resolution: vitest alias for `@adding-machine/core`
**Decision:** `packages/api/vitest.config.ts` aliases `@adding-machine/core` to `../core/src/index.ts`.
**Rationale:** Avoids requiring a `pnpm build` step before running API tests. Vitest/Vite can transpile TypeScript source directly; the alias keeps test and dev cycles fast and removes a manual prerequisite.
**Status:** Active. Production builds use `wrangler` which resolves from `dist/`; the alias is test-only.

### Unified endpoint schema: simplified flat object
**Decision:** `POST /v1/cutup` uses a flat `{ method, text, textB?, options? }` zod schema for OpenAPI generation, then re-parses against the `UnifiedRequestSchema` discriminated union in the handler for type safety.
**Rationale:** `z.discriminatedUnion` does not generate clean OpenAPI `oneOf` output via `@hono/zod-openapi`. The flat schema produces a readable `/openapi.json` and `/docs` page; the discriminated union re-parse ensures the handler receives correctly-typed inputs.
**Status:** Active. May revisit if `@hono/zod-openapi` adds first-class discriminated union support.

### Rate limiter: optional binding
**Decision:** The rate limiter middleware checks `c.env?.RATE_LIMITER` before calling `.limit()`. If the binding is absent (local dev, test), it no-ops.
**Rationale:** CF Workers Rate Limiting API is only available in the deployed Worker environment. Requiring the binding would break `wrangler dev` without configuration and all Vitest tests.
**Status:** Active.

### 413 vs 422 error codes
**Decision:** Input text exceeding 100 KB returns HTTP 413; other validation failures return 422. The distinction is made in the `defaultHook` by checking whether the zod error is `too_big` on the `text` or `textB` field.
**Rationale:** The SPEC explicitly states "reject with 413." HTTP 413 (Content Too Large) is semantically correct for oversized payloads, while 422 (Unprocessable Content) is appropriate for structurally valid but semantically invalid requests.
**Status:** Active.

### Scalar UI: top-level `url` property
**Decision:** Scalar's `apiReference()` is called with `{ url: '/openapi.json' }` (not `{ spec: { url: ... } }`).
**Rationale:** The `spec.url` form was deprecated in `@scalar/hono-api-reference`. Using the top-level `url` silences the deprecation warning and is forward-compatible.
**Status:** Active.

---

### Wrangler alias for `@adding-machine/core`
**Decision:** Added `[alias]` in `wrangler.toml` pointing `@adding-machine/core` to `../core/src/index.ts`.
**Rationale:** Wrangler resolves workspace packages from their `exports` field, which points to `dist/index.js`. That file doesn't exist until core is explicitly built. The alias lets wrangler transpile core's TypeScript source directly — the same approach used in `vitest.config.ts`. This eliminates a manual `pnpm --filter @adding-machine/core build` prerequisite for local dev.
**Status:** Active.

---

---

## 2026-05-12 — Phase 3: Web App

### Frontend stack: React 18 + Vite 6 + Tailwind v4
**Decision:** React 18, Vite 6, Tailwind CSS v4, React Router v6.
**Rationale:** SPEC requirement. Tailwind v4 uses a CSS-first configuration (`@theme` block, no `tailwind.config.js`) and a Vite plugin — no separate PostCSS setup needed. Vite 6 is the stable current major.
**Status:** Active.

### Tailwind v4 configuration: CSS-only, no config file
**Decision:** All theme tokens defined in `src/index.css` under `@theme {}`. No `tailwind.config.js`.
**Rationale:** Tailwind v4's CSS-first approach is cleaner and keeps design tokens co-located with CSS. Custom tokens (`--color-paper`, `--color-ink`, `--color-accent`, `--font-mono`) become Tailwind utilities automatically (`bg-paper`, `text-ink`, etc.).
**Status:** Active.

### Aesthetic: paper + ink + oxblood
**Decision:** `#f5f0e8` paper, `#1a1a1a` ink, `#7a1a1a` oxblood accent. IBM Plex Mono for all text. Hairline (1px) borders. No shadows, no gradients, no rounded corners.
**Rationale:** Follows SPEC §5.3 exactly. The accent (`#7a1a1a`) appears only on the active method button, the quadrant seam indicator, error messages, and history method icons.
**Status:** Active.

### Paper grain: inline SVG noise filter
**Decision:** Paper texture is an inline SVG `feTurbulence` filter embedded as a `background-image` data URL on `<body>`, opacity 0.035.
**Rationale:** No external asset, no build step, no extra HTTP request. The SVG is tiny (~200 bytes). This avoids a separate `public/noise.svg` file.
**Status:** Active.

### Font: IBM Plex Mono via Google Fonts
**Decision:** Loaded from Google Fonts CDN in `index.html`.
**Rationale:** IBM Plex Mono is IBM's open-source monospace, closer to the Selectric aesthetic than Courier New, and more readable at small sizes. Weights 400, 500, 700 are loaded.
**Status:** Active. May self-host in Phase 4 for offline use.

### State architecture: `useMachine` + `useHistory` hooks
**Decision:** All machine state lives in `useMachine()`; `useHistory()` manages localStorage independently. Machine.tsx composes both.
**Rationale:** Keeps the component tree presentational. `useMachine` owns method, inputs, options, seed, loading, error, and result. `useHistory` owns the persistent history array. The separation means history persists across page refreshes without coupling it to run state.
**Status:** Active.

### Per-method option state
**Decision:** Options are stored as `{ quadrant: {…}, shuffle: {…}, fold: {…}, permutation: {…} }` — all four methods keep their state simultaneously. Switching methods does not reset the previous method's options.
**Rationale:** Users frequently switch between methods; resetting options on every switch would be frustrating. Memory cost is trivial (four small objects).
**Status:** Active.

### API client: hand-written, no code generation
**Decision:** `src/api.ts` is a hand-written typed client calling `/v1/cutup`. No OpenAPI code generation.
**Rationale:** The API has one meaningful endpoint. Code generation would add a build step and a dev dependency for a single `fetch` call. If the API grows significantly in Phase 5 or beyond, revisit with `openapi-typescript`.
**Status:** Active. Revisit at Phase 5.

### Run ID: `crypto.randomUUID()` in API layer, not web
**Decision:** The web app uses the `id` returned by the API (which uses `crypto.randomUUID()`). The web layer does not generate its own IDs.
**Rationale:** IDs come from the API response; the web app only needs them for history deduplication (`filter(e => e.id !== entry.id)`).
**Status:** Active.

### Playwright: mock API responses via `page.route()`
**Decision:** Smoke tests mock all `**/v1/cutup` requests. No live API required to run the test suite.
**Rationale:** The smoke test verifies UI behavior (input → click → output appears), not API correctness. Mocking avoids a dependency on a running Worker and makes tests fast and deterministic in CI.
**Status:** Active.

### Vite `import.meta.env` types: `vite-env.d.ts`
**Decision:** Added `src/vite-env.d.ts` with `/// <reference types="vite/client" />` and typed `VITE_API_BASE`.
**Rationale:** The root tsconfig uses `"types": []` to avoid pulling in browser or Node globals that conflict between packages. Vite's `ImportMeta.env` type must be added manually.
**Status:** Active.

---

*Log maintained by Claude Code. Updated after every committed decision.*
