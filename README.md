# Gysin's Adding Machine

A digital instrument implementing Brion Gysin's cut-up and permutation techniques.

- **Web app**: [adding-machine.pages.dev](https://adding-machine.pages.dev) _(Phase 3)_
- **REST API**: [adding-machine.workers.dev](https://adding-machine.workers.dev) _(Phase 2)_
- **MCP server**: `adding-machine.workers.dev/mcp` _(Phase 5)_

## Packages

| Package | Description |
|---|---|
| `@adding-machine/core` | Pure TS library — all four cut-up operations |
| `@adding-machine/api` | Hono + Cloudflare Workers REST API |
| `@adding-machine/mcp` | MCP server (streamable HTTP) |
| `@adding-machine/web` | React + Vite + Tailwind web app |

## Development

```bash
pnpm install
pnpm test           # run all tests
pnpm lint           # biome check
pnpm build          # build all packages
```

## MCP setup _(after Phase 5 deploy)_

```bash
claude mcp add --transport http adding-machine https://adding-machine.workers.dev/mcp
```

---

*"Cut the words and see how they fall." — William S. Burroughs*
