A cut-up and permutation engine for text, after Brion Gysin and the 1960 Honeywell 200. Quadrant, shuffle, fold-in, and permutation operations exposed as a web app, a REST API, and an MCP server.

> *"Cut the words and see how they fall."* — William S. Burroughs

---

## What this is

Brion Gysin discovered the cut-up by accident in summer 1959 at the Beat Hotel in Paris. A stack of newspapers used as a cutting mat was sliced through with a razor; the rearranged strips read as new, coherent prose. William S. Burroughs systematised the technique: take a page, cut down and across the middle, rearrange the four sections.

In 1960, Gysin collaborated with mathematician Ian Sommerville on a Honeywell Series 200 mainframe to generate every permutation of short phrases — most famously `I AM THAT I AM` (the Divine Tautology from Exodus 3:14). These were broadcast on the BBC Third Programme as *The Permutated Poems of Brion Gysin*. The computer was Gysin's adding machine: a combinatorial engine for language.

Burroughs called the result a **third mind** — the text neither the human wrote nor the machine authored, emerging from their collision. That is the spirit of this instrument.

## Operations

Four operations, all historically grounded:

- **Quadrant** — Gysin's literal razor method. Slice the page down the middle and across the middle, then reassemble the four sections as Burroughs prescribed (`4|1` over `2|3`).
- **Shuffle** — Chunk text by configurable unit (word, n-gram, sentence, line) and randomize. The most flexible digital cut-up.
- **Fold-in** — Burroughs' extension. Fold a second source into the first; two voices interleave along the seam.
- **Permutate** — Sommerville mode. Generate every reordering of a short phrase, in the style of `I AM THAT I AM`.

All operations are deterministic given a seed. Same input + same seed = same output, always.

## Three surfaces

| Surface | URL | For |
|---|---|---|
| Web app | https://adding-machine-amt.pages.dev | Humans with a textarea and a curiosity |
| REST API | https://adding-machine-api.sheartworldwide.workers.dev | Scripts, pipelines, anything that speaks HTTP |
| MCP server | https://adding-machine-api.sheartworldwide.workers.dev/mcp | Claude Code, Claude Desktop, Cursor, any MCP-compliant agent |

## Quick start

### Web app

Open https://adding-machine-amt.pages.dev. Paste text. Pick a method. Pull the lever.

### REST API

```bash
curl -X POST https://adding-machine-api.sheartworldwide.workers.dev/v1/cutup \
  -H "Content-Type: application/json" \
  -d '{
    "method": "shuffle",
    "text": "The hallucinogenic drugs are forbidden because they would reveal the truth.",
    "options": { "unit": "word", "seed": "beat-hotel" }
  }'
```

Full OpenAPI docs at https://adding-machine-api.sheartworldwide.workers.dev/docs.

### MCP server (Claude Code)

```bash
claude mcp add --transport http adding-machine https://adding-machine-api.sheartworldwide.workers.dev/mcp
```

Or by editing `~/.claude.json` directly:

```jsonc
{
  "mcpServers": {
    "adding-machine": {
      "type": "http",
      "url": "https://adding-machine-api.sheartworldwide.workers.dev/mcp"
    }
  }
}
```

Then ask the agent to `cutup_shuffle` any text, or run `cutup_permutate` on a short phrase. The four tools are `cutup_quadrant`, `cutup_shuffle`, `cutup_fold`, and `cutup_permutate`. Two prompts (`cutup_news`, `divine_tautology`) ship suggested workflows.

## Library use

The core is a zero-dependency TypeScript library, usable on its own:

```ts
import { shuffle, permutate, foldIn, quadrant } from "@adding-machine/core";

const result = shuffle("rub out the word", {
  unit: "word",
  seed: "tangier-1959",
});

console.log(result.text);
console.log(result.seed, result.stats);
```

## Repo layout

```
adding-machine/
  packages/
    core/    # zero-dep TypeScript library — the four operations
    api/     # Hono on Cloudflare Workers — REST API + mounted MCP server
    mcp/     # MCP server factory (mounted into api at /mcp)
    web/     # React + Vite + Tailwind — the instrument panel
  SPEC.md    # full specification
  README.md
```

The MCP server lives inside the API worker as a route, not as a separate process. One deploy, one URL.

## Develop locally

Requires Node 20+ and pnpm.

```bash
pnpm install
pnpm test                 # vitest across the workspace
pnpm --filter core test   # just the core algorithms
pnpm --filter api dev     # wrangler dev — API + MCP on localhost:8787
pnpm --filter web dev     # vite dev — web app on localhost:5173
```

The web app reads `VITE_API_BASE` to find the API; in dev it points at `http://localhost:8787`.

## Deploy

```bash
pnpm --filter api deploy   # wrangler deploy
pnpm --filter web build    # Cloudflare Pages auto-deploys from main
```

Smoke-test the MCP endpoint after deploy:

```bash
npx @modelcontextprotocol/inspector https://adding-machine-api.sheartworldwide.workers.dev/mcp
```

## Design notes

- **Determinism.** Everything runs through a seeded PRNG. If a seed isn't passed, one is generated and echoed back in the response. Any cut-up you like, you can reproduce.
- **No LLMs in the loop.** The point is the mechanical, unauthored quality. The machine adds nothing of its own; it only rearranges. There is no "AI improve" button and there will not be one.
- **Permutation safety.** `permutate` refuses phrases longer than 7 words in `mode='all'` (8! is 40,320 lines, which isn't a poem, it's a denial of service). Use `mode='sample'` for longer phrases.
- **Input limits.** 100 KB per text field. The API rate-limits at 60 req/min/IP via Cloudflare.

## Lineage

- Burroughs, *The Cut-Up Method of Brion Gysin* (1961)
- Gysin & Sommerville, *Permutated Poems* — BBC Third Programme, 1960
- Burroughs & Gysin, *The Third Mind* (1978)
- Gysin, Beiles, Corso & Burroughs, *Minutes to Go* (1960)
- Funkhouser, *Prehistoric Digital Poetry* (2007) — on the Sommerville/Honeywell work

## License

MIT for the code. The excerpts shipped as MCP resources are quoted under fair use and kept deliberately short.

---

*Gysin would have wanted this.*
