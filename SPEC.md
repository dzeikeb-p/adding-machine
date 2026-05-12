# Gysin's Adding Machine — Specification

A digital instrument implementing Brion Gysin's cut-up and permutation techniques, exposed as (1) a web app, (2) a REST API, and (3) an MCP server so any AI agent or external system can feed text in and receive a cut-up response.

---

## 0. Context for the implementer

Brion Gysin (1916–1986) was a painter, poet, and inventor working at the Beat Hotel in Paris. In summer 1959 he discovered the **cut-up technique** by accident: a stack of newspapers used as a cutting mat was sliced through with a razor, and the rearranged strips read as coherent (and strange) new prose. The classic procedure as described by Burroughs:

> Take a page. Cut down the middle and across the middle. You have four sections: 1 2 3 4. Now rearrange the sections placing section four with section one and section two with section three.

In 1960 Gysin collaborated with mathematician Ian Sommerville on a **Honeywell Series 200** to generate every permutation of short phrases — most famously "I AM THAT I AM" (the Divine Tautology from Exodus 3:14). These were broadcast on the BBC Third Programme as *The Permutated Poems of Brion Gysin*. The permutations are the "adding machine" — a literal combinatorial engine for language.

Burroughs called the result a **third mind**: the text the human didn't write and the machine didn't author either, emerging from their collision. That's the spirit. The implementation should feel like an instrument, not a toy.

**Three operations to implement** (all are historically grounded):
1. **Quadrant cut-up** — Gysin's actual razor method, applied to text.
2. **Shuffle cut-up** — chunk text by configurable unit (word, n-gram, sentence) and randomize.
3. **Fold-in** — Burroughs' extension: fold a second source into the first.
4. **Permutation** — every reordering of a short phrase (Sommerville mode).

---

## 1. Deliverables

| # | Package | Purpose |
|---|---|---|
| 1 | `@adding-machine/core` | Pure TypeScript library. Zero runtime deps. All four operations as exported functions. The single source of truth. |
| 2 | `@adding-machine/api` | Hono server on Cloudflare Workers. Wraps `core` as a REST API. |
| 3 | `@adding-machine/mcp` | MCP server (streamable HTTP transport) on the same Worker. Wraps `core` as MCP tools. |
| 4 | `@adding-machine/web` | React + Vite + Tailwind web app. Calls the API. Deployed on Cloudflare Pages. |

Repo layout: npm workspaces monorepo.

```
adding-machine/
  package.json              # workspaces root
  pnpm-workspace.yaml       # (or npm/yarn equivalent)
  packages/
    core/                   # 1
    api/                    # 2 — also hosts the MCP server at /mcp
    mcp/                    # 3 — published separately if useful; otherwise mounted into api/
    web/                    # 4
  README.md
  SPEC.md                   # this file
```

> **Note for Claude Code:** prefer mounting the MCP server inside `packages/api` as a route (`/mcp`) rather than running a separate process. One deploy, one URL, fewer moving parts. Keep `packages/mcp` as a thin module exporting the MCP server factory; `api` imports and mounts it.

---

## 2. The core library — algorithms

All functions live in `packages/core/src/` and are pure: same input + same seed → same output. A seeded RNG (e.g. `seedrandom` or a tiny PRNG you implement) is required so results are reproducible and testable.

### 2.1 Types

```ts
// packages/core/src/types.ts
export type CutUpMethod = 'quadrant' | 'shuffle' | 'fold' | 'permutation';

export interface CutUpOptions {
  /** PRNG seed. If omitted, uses crypto-strong random and returns the seed used. */
  seed?: string;
}

export interface QuadrantOptions extends CutUpOptions {
  /** How many times to fold + rearrange. Default 1. */
  iterations?: number;
}

export interface ShuffleOptions extends CutUpOptions {
  /** Unit of cutting. Default 'word'. */
  unit?: 'word' | 'phrase' | 'sentence' | 'line' | 'ngram';
  /** When unit='ngram', the n. Default 3. */
  ngramSize?: number;
  /** Preserve sentence-ending punctuation positions. Default false. */
  preserveTerminals?: boolean;
}

export interface FoldOptions extends CutUpOptions {
  /** Where the fold happens, 0..1. Default 0.5 (Burroughs' classic centre-fold). */
  foldRatio?: number;
  /** Direction of fold. Default 'vertical' (column-based). */
  axis?: 'vertical' | 'horizontal';
}

export interface PermutationOptions extends CutUpOptions {
  /** Cap on output lines for safety. Default 5040 (7!). */
  maxLines?: number;
  /** 'all' for every permutation, 'sample' for n random permutations. Default 'all'. */
  mode?: 'all' | 'sample';
  /** Used when mode='sample'. Default 24. */
  sampleSize?: number;
}

export interface CutUpResult {
  text: string;
  method: CutUpMethod;
  seed: string;          // echo back the seed actually used
  inputHash: string;     // sha-256 of input(s), for traceability
  stats: {
    inputChars: number;
    outputChars: number;
    units: number;       // number of cut units produced
    durationMs: number;
  };
}
```

### 2.2 Function signatures

```ts
// packages/core/src/index.ts
export function quadrant(text: string, opts?: QuadrantOptions): CutUpResult;
export function shuffle(text: string, opts?: ShuffleOptions): CutUpResult;
export function foldIn(textA: string, textB: string, opts?: FoldOptions): CutUpResult;
export function permutate(phrase: string, opts?: PermutationOptions): CutUpResult;
```

### 2.3 Algorithm details

**`quadrant`** — Gysin's literal method.
1. Normalize text into a rectangular grid: split into lines; pad to uniform width with spaces.
2. Cut down the middle vertically and across the middle horizontally → 4 sub-grids: `TL, TR, BL, BR`.
3. Reassemble as Burroughs prescribes: `BR | TL` on top, `BL | TR` on bottom (i.e. quadrant 4 with 1, quadrant 2 with 3).
4. Re-flow into prose: collapse the padding, restore single spaces between tokens, fix obvious mid-word splits by leaving them as-is (the artifact is the point — do not "clean" word breaks).
5. If `iterations > 1`, feed the output back through the same operation.

**`shuffle`** — chunk-and-randomize, the most common digital cut-up.
1. Tokenize by `unit`. For `ngram`, treat the text as a word stream and chunk into groups of `ngramSize`.
2. Fisher–Yates shuffle the chunk array using the seeded PRNG.
3. Re-join with appropriate separators (space for word/ngram, newline for line/sentence).
4. If `preserveTerminals`, lock the position of any chunk ending with `.`, `!`, `?` so the final shape still reads like sentences.

**`foldIn`** — Burroughs' fold-in. Two texts, A and B.
1. Render both as line arrays of equal length (pad shorter with empty strings; truncate longer to match — pick the shorter convention).
2. For each line `i`: take the first `floor(lineLength * foldRatio)` chars from A's line, concatenate with the remainder from B's line. (For `axis='horizontal'`, fold by lines instead of by chars: top half from A, bottom half from B.)
3. Concatenate the folded lines.

**`permutate`** — Gysin/Sommerville mode.
1. Split phrase on whitespace into a word array of length `n`.
2. If `n > 7` and `mode='all'`, refuse with a clear error: 8! = 40,320 — too many. Tell the caller to use `mode='sample'` or shorten the phrase.
3. Generate permutations. For `mode='all'`, use Heap's algorithm (in-place, no recursion blow-up). For `mode='sample'`, draw `sampleSize` random permutations without replacement (Floyd's algorithm or rejection sampling).
4. Join permutations one per line.

### 2.4 Testing

Each operation needs:
- A snapshot test with a fixed seed and a known input (e.g. the opening of *Minutes to Go* or a public-domain stand-in).
- A property test: output length is reasonable relative to input length; seed reproducibility holds; tokens in `shuffle` output equal tokens in input.
- For `permutate("I AM THAT I AM")` with `mode='all'`: assert the output has the expected number of distinct lines (some words repeat, so it's not 5! — compute the actual multiset permutation count and assert against that).

Use Vitest. Test files: `packages/core/src/*.test.ts`. Coverage target: 90%+ on `core`.

---

## 3. REST API — `packages/api`

**Stack:** Hono + Cloudflare Workers. Why: tiny, fast cold starts, same runtime as the MCP server, ships in one `wrangler deploy`.

### 3.1 Endpoints

```
GET  /health                       → { status: 'ok', version, commit }
POST /v1/cutup/quadrant            → CutUpResult
POST /v1/cutup/shuffle             → CutUpResult
POST /v1/cutup/fold                → CutUpResult
POST /v1/cutup/permutate           → CutUpResult
POST /v1/cutup                     → unified endpoint; body includes `method`
GET  /v1/methods                   → metadata describing each method + its options schema
```

### 3.2 Request shape (unified endpoint)

```jsonc
POST /v1/cutup
{
  "method": "shuffle",
  "text": "...",
  "textB": "...",            // only for method='fold'
  "options": { /* per-method, validated against zod schema */ }
}
```

### 3.3 Response

The `CutUpResult` from `core`, plus an `id` (ulid) for the run and a `permalink` (`/v1/results/{id}`) if you implement KV-backed result storage. Storage is **optional** for MVP — if skipped, drop the permalink field.

### 3.4 Validation, errors, limits

- All bodies validated with **zod** schemas exported from `core`. The OpenAPI spec is derived from these via `@hono/zod-openapi`.
- Hard input limit: 100 KB per text field. Reject with `413` and a clear message.
- `permutate` refuses phrases with > 7 unique words when `mode='all'`; returns `400` with the math explained.
- CORS: allow `*` for the public API; lock down if/when auth is added.
- Rate limit: 60 requests / minute / IP via Cloudflare's built-in rate limiter binding. Configurable in `wrangler.toml`.
- No auth in v1. Document this clearly. Add API keys later via Workers KV.

### 3.5 OpenAPI

Serve `/openapi.json` and a Scalar/Stoplight UI at `/docs`. The schema is generated from zod via `@hono/zod-openapi`.

---

## 4. MCP server — `packages/mcp`

**Transport:** streamable HTTP, mounted at `/mcp` on the same Worker as the API. This is the recommended transport for remote MCP servers in 2026 — one URL, works with Claude Code, Claude Desktop, Cursor, and any compliant client.

**SDK:** `@modelcontextprotocol/sdk` (TypeScript).

### 4.1 Tools exposed

| Tool name | Description (visible to LLM) | Input |
|---|---|---|
| `cutup_quadrant` | Apply Brion Gysin's classic four-quadrant cut-up to text. Slices the page into four and reassembles them as Burroughs prescribed. Returns a new text where original phrases collide across the seams. | `{ text: string, iterations?: number, seed?: string }` |
| `cutup_shuffle` | Chunk text into units (word, n-gram, sentence, or line) and randomly reorder. The most flexible cut-up operation. | `{ text: string, unit?, ngramSize?, preserveTerminals?, seed? }` |
| `cutup_fold` | Burroughs' fold-in: fold a second source into the first. Produces hybrid text where two voices interleave. | `{ textA: string, textB: string, foldRatio?: number, axis?: 'vertical'\|'horizontal', seed? }` |
| `cutup_permutate` | Generate every (or sampled) permutation of the words in a short phrase, in the style of Gysin's "I AM THAT I AM." Phrases > 7 words must use `mode='sample'`. | `{ phrase: string, mode?: 'all'\|'sample', sampleSize?: number, seed? }` |

Each tool's input schema is the same zod schema the REST API uses. Each tool implementation calls the same `core` function and returns the result text as a single text content block, with `_meta` carrying `seed`, `stats`, `inputHash`.

### 4.2 Server registration example

For end users to add this to Claude Code once deployed:

```bash
claude mcp add --transport http adding-machine https://adding-machine.workers.dev/mcp
```

Or via JSON:

```jsonc
// ~/.claude.json
{
  "mcpServers": {
    "adding-machine": {
      "type": "http",
      "url": "https://adding-machine.workers.dev/mcp"
    }
  }
}
```

Include both snippets in `README.md`.

### 4.3 Server prompts (optional but nice)

Expose two MCP prompts so clients get suggested workflows:

- `cutup_news` — instructs the model to fetch today's headlines and run them through `cutup_shuffle` at the phrase level. Burroughs did this constantly with *Time* and *Life*.
- `divine_tautology` — runs `cutup_permutate` on `"I AM THAT I AM"` and displays the result with appropriate ceremony.

### 4.4 Resources (optional)

Expose a small set of MCP resources for canonical Gysin/Burroughs source texts in the public domain or under fair-use length (a paragraph each), so an agent can pull a seed text directly:

- `gysin://minutes-to-go/preface` (excerpt)
- `gysin://third-mind/cut-up-method` (the Burroughs essay, excerpt only)
- `gysin://divine-tautology` (the literal phrase `I AM THAT I AM`)

Keep excerpts short. Do not host full copyrighted works.

---

## 5. Web app — `packages/web`

**Stack:** React 18 + Vite + Tailwind v4. Deployed on Cloudflare Pages, configured to call the Workers API at a same-origin route.

### 5.1 Routes

- `/` — the machine. Single-page; everything happens here.
- `/about` — short essay on Gysin, the cut-up, the permutation poems, and what this app does. Links to the API and MCP docs.
- `/api-docs` — embed of `/docs` from the API worker.

### 5.2 The machine interface

The layout is a single column that reads like an instrument panel:

1. **Input pane** (top). A textarea styled as if typed on an IBM Selectric: monospace, slight off-white paper background, subtle paper grain via SVG noise. Below: a second collapsible textarea for source B, only visible when method='fold'. File-drop accepted (`.txt`, `.md`).
2. **Method selector**. Four buttons: `QUADRANT`, `SHUFFLE`, `FOLD-IN`, `PERMUTATE`. Big, blocky, all-caps. Selected button gets a heavy black inverse fill. Switching method swaps the options panel below.
3. **Options panel**. Renders the relevant zod schema as a small form. Seed field is always present with a "🎲 randomize" button next to it.
4. **The lever**. A single large button labeled `CUT IT UP` (or `PERMUTATE` when in permutation mode). On press: a brief mechanical-shutter animation, then the output appears in the output pane.
5. **Output pane**. Same paper styling as input. Above the text: the seed used, the method, and tiny copy/download/share buttons. Below: a `RUN AGAIN` button (new random seed) and a `LOCK SEED` toggle.
6. **History strip** (bottom). The last ~10 runs, each a thumbnail showing the first line of output and the method icon. Click to recall. Persisted in localStorage. Optional later: a "save to permalink" button that calls the API's optional result-storage endpoint.

### 5.3 Aesthetic direction

Beat-era / mechanical / utilitarian. Think *Minutes to Go* pamphlet typography, Selectric monospace for input/output, a single accent color (suggest a deep oxblood red — `#7a1a1a`) used only on the active control and the cut-up "seam" indicator. No drop shadows. No gradients. Hairline rules between sections. Tailwind only — no compiler magic.

> **Claude Code**: before writing any frontend, read `/mnt/skills/public/frontend-design/SKILL.md` for design-token and styling constraints.

### 5.4 Accessibility

- Full keyboard operation: Tab through controls, `⌘/Ctrl+Enter` to run the machine.
- Output region is `aria-live="polite"` so screen readers announce results.
- Color contrast: AA minimum across paper background + ink + accent.

### 5.5 No persistence beyond localStorage in v1

No accounts, no DB. History is per-browser. This is a public toy.

---

## 6. Tech & tooling

- **Language**: TypeScript strict mode everywhere. `noUncheckedIndexedAccess` on.
- **Package manager**: pnpm (workspaces).
- **Testing**: Vitest. Playwright for one web smoke test (load page, run a shuffle, assert output non-empty).
- **Lint/format**: Biome (one tool, less config than eslint+prettier).
- **CI**: GitHub Actions. Three jobs: test core, deploy api (on `main`), deploy web (on `main`). Use Wrangler GitHub Action for the worker, Cloudflare Pages GitHub integration for the web app.
- **Versioning**: Changesets, even if it's overkill for v1 — sets up clean releases when the core lib goes public.

---

## 7. Build phases — order of operations for Claude Code

Work through these in order. Don't move on until the prior phase has a green test suite.

### Phase 1 — Core engine (no UI, no API)
1. Scaffold the monorepo, install deps, set up Biome + Vitest + tsconfig.
2. Implement `core/src/rng.ts` (seeded PRNG) and `core/src/types.ts`.
3. Implement and test `shuffle` first — simplest, builds confidence in the PRNG and tokenization helpers.
4. Implement and test `quadrant`. The padding logic is the tricky part; write the test first.
5. Implement and test `foldIn`.
6. Implement and test `permutate`. Verify the multiset count for `I AM THAT I AM` matches the known mathematical answer.

### Phase 2 — REST API
1. Scaffold a Hono Worker in `packages/api`. Configure `wrangler.toml` for local dev.
2. Wire the four endpoints + the unified `/v1/cutup`. Use the zod schemas from `core`.
3. Add `/openapi.json` and `/docs`.
4. Add the Cloudflare rate-limiter binding.
5. Write one integration test per endpoint with Hono's test client.

### Phase 3 — Web app
1. **Read `/mnt/skills/public/frontend-design/SKILL.md` first.**
2. Scaffold `packages/web` with Vite + React + Tailwind v4.
3. Build the layout from §5.2 with mock data — no API calls yet. Get the aesthetic right.
4. Add a typed API client (generated from the OpenAPI spec, or hand-written — your call).
5. Wire the controls to the API. Add localStorage history.
6. Write one Playwright smoke test.

### Phase 4 — Deploy the API + web app
1. Deploy the Worker (`wrangler deploy` from `packages/api`).
2. Deploy the web app to Pages, with `VITE_API_BASE` pointing at the Worker.
3. Smoke-test the deployed surfaces end-to-end. If the `core` API shape needs adjustment based on real use, fix it now — before MCP locks in tool schemas.

### Phase 5 — MCP server
By this point `core` is battle-tested through the API and web app, so the tool schemas can mirror what's already proven to work.

1. In `packages/mcp`, build an MCP server using `@modelcontextprotocol/sdk` with streamable HTTP transport.
2. Register the four tools. Each tool handler simply calls the corresponding `core` function and wraps the result.
3. Add the two prompts and the three resources from §4.3–4.4.
4. Mount the MCP server at `/mcp` in the Hono app.
5. Write a test that uses the MCP SDK's in-memory transport to call each tool and assert the response shape.
6. Redeploy the Worker. Verify the MCP endpoint with `npx @modelcontextprotocol/inspector https://your-worker.workers.dev/mcp`.
7. Add the Claude Code install snippet to the README.

---

## 8. Stretch goals (do not build in v1)

- **Two-source upload from URLs**: paste a URL, server fetches and cuts up the readable content.
- **Voice mode**: synthesize the permutation output as audio (Gysin performed these on BBC; the original recordings exist).
- **Visual cut-up**: render the quadrant operation as an animated SVG showing the actual razor cuts and rearrangement.
- **Collaborative mode**: WebSocket-based shared session where two writers feed lines into the same machine.
- **API auth + result permalinks**: API keys via Workers KV; KV-backed result storage so any run is shareable as a URL.
- **Dreamachine companion**: a separate route that renders Gysin's stroboscopic Dreamachine (1961, also with Sommerville) as a 78-rpm-equivalent flicker pattern. Add an epilepsy warning and a hold-to-activate gate. Gysin would have wanted this.

---

## 9. Non-goals

- Not an LLM-mediated "smart" cut-up. The whole point is the mechanical, unauthored quality. If you ever feel tempted to add an "AI improve" button, re-read §0.
- Not a general-purpose text manipulation library. Four operations, sharply scoped.
- Not a CMS. No accounts in v1.

---

## 10. References for the implementer

- Burroughs, "The Cut-Up Method of Brion Gysin" (1961/1978) — the canonical procedure.
- Funkhouser, *Prehistoric Digital Poetry* (2007), pg. 39 — on the Sommerville/Honeywell permutation work.
- Gysin & Sommerville, *Permutated Poems* (BBC Third Programme, 1960) — the source for what we're calling "the adding machine."
- *The Third Mind*, Burroughs & Gysin (1978) — the collage manifesto.
- Current MCP transport docs: https://docs.claude.com/en/docs/claude-code/mcp

---

*"Cut the words and see how they fall." — William S. Burroughs*
