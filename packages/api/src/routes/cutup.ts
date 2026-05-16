import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import {
  CutUpResultSchema,
  ErrorResponseSchema,
  FoldRequestSchema,
  PermutationRequestSchema,
  QuadrantRequestSchema,
  ShuffleRequestSchema,
  UnifiedRequestSchema,
  foldIn,
  permutate,
  quadrant,
  sha256hex,
  shuffle,
} from '@adding-machine/core';
import { isHash, resolveText, storeText } from '../textStore.js';

// ── Shared response schemas ───────────────────────────────────────────────────

const OkSchema = CutUpResultSchema.openapi('CutUpResult');
const ErrSchema = ErrorResponseSchema.openapi('ErrorResponse');

function ok400() {
  return {
    content: { 'application/json': { schema: ErrSchema } },
    description: 'Invalid request (e.g. phrase too long for permutate mode=all)',
  };
}
function ok404() {
  return {
    content: { 'application/json': { schema: ErrSchema } },
    description: 'Hash not found in store',
  };
}
function ok413() {
  return {
    content: { 'application/json': { schema: ErrSchema } },
    description: 'Input text exceeds 100 KB',
  };
}

// ── Helper ────────────────────────────────────────────────────────────────────

function withId(result: object) {
  return { id: crypto.randomUUID(), ...result };
}

// ── Route definitions ─────────────────────────────────────────────────────────

const quadrantRoute = createRoute({
  method: 'post',
  path: '/v1/cutup/quadrant',
  tags: ['Cut-Up'],
  summary: 'Four-quadrant cut-up',
  description:
    "Gysin's original razor method. Splits the text into four quadrants and reassembles BR|TL on top, BL|TR on bottom. Pass a SHA-256 hash instead of text to reproduce a previously stored cut-up.",
  request: {
    body: {
      content: { 'application/json': { schema: QuadrantRequestSchema.openapi('QuadrantRequest') } },
      required: true,
    },
  },
  responses: {
    200: { content: { 'application/json': { schema: OkSchema } }, description: 'Cut-up result' },
    404: ok404(),
    413: ok413(),
    422: { content: { 'application/json': { schema: ErrSchema } }, description: 'Validation error' },
  },
});

const shuffleRoute = createRoute({
  method: 'post',
  path: '/v1/cutup/shuffle',
  tags: ['Cut-Up'],
  summary: 'Shuffle cut-up',
  description: 'Tokenise by unit (word, ngram, sentence, line, phrase) and randomise order. Pass a SHA-256 hash instead of text to reproduce a previously stored cut-up.',
  request: {
    body: {
      content: { 'application/json': { schema: ShuffleRequestSchema.openapi('ShuffleRequest') } },
      required: true,
    },
  },
  responses: {
    200: { content: { 'application/json': { schema: OkSchema } }, description: 'Cut-up result' },
    404: ok404(),
    413: ok413(),
    422: { content: { 'application/json': { schema: ErrSchema } }, description: 'Validation error' },
  },
});

const foldRoute = createRoute({
  method: 'post',
  path: '/v1/cutup/fold',
  tags: ['Cut-Up'],
  summary: 'Fold-in',
  description: "Burroughs' fold-in: two texts interleaved at a configurable fold ratio. Either text field accepts a SHA-256 hash to reproduce a previously stored cut-up.",
  request: {
    body: {
      content: { 'application/json': { schema: FoldRequestSchema.openapi('FoldRequest') } },
      required: true,
    },
  },
  responses: {
    200: { content: { 'application/json': { schema: OkSchema } }, description: 'Cut-up result' },
    404: ok404(),
    413: ok413(),
    422: { content: { 'application/json': { schema: ErrSchema } }, description: 'Validation error' },
  },
});

const permutateRoute = createRoute({
  method: 'post',
  path: '/v1/cutup/permutate',
  tags: ['Cut-Up'],
  summary: 'Permutation',
  description:
    'Gysin/Sommerville mode. All permutations of a short phrase (≤7 words), or a sampled subset. Pass a SHA-256 hash instead of text to reproduce a previously stored cut-up.',
  request: {
    body: {
      content: {
        'application/json': { schema: PermutationRequestSchema.openapi('PermutationRequest') },
      },
      required: true,
    },
  },
  responses: {
    200: { content: { 'application/json': { schema: OkSchema } }, description: 'Cut-up result' },
    400: ok400(),
    404: ok404(),
    413: ok413(),
    422: { content: { 'application/json': { schema: ErrSchema } }, description: 'Validation error' },
  },
});

// Unified endpoint uses a simplified schema for clean OpenAPI generation
const UnifiedSchema = z
  .object({
    method: z.enum(['quadrant', 'shuffle', 'fold', 'permutation']),
    text: z.string().min(1).max(102400),
    textB: z.string().min(1).max(102400).optional(),
    options: z.record(z.unknown()).optional(),
  })
  .openapi('UnifiedRequest');

const unifiedRoute = createRoute({
  method: 'post',
  path: '/v1/cutup',
  tags: ['Cut-Up'],
  summary: 'Unified cut-up',
  description: 'Single endpoint for all methods. Dispatch via the `method` field. Text fields accept SHA-256 hashes for stored-text lookup.',
  request: {
    body: {
      content: { 'application/json': { schema: UnifiedSchema } },
      required: true,
    },
  },
  responses: {
    200: { content: { 'application/json': { schema: OkSchema } }, description: 'Cut-up result' },
    400: ok400(),
    404: ok404(),
    413: ok413(),
    422: { content: { 'application/json': { schema: ErrSchema } }, description: 'Validation error' },
  },
});

// ── Route handlers ────────────────────────────────────────────────────────────

export function registerCutup(app: OpenAPIHono<{ Bindings: Bindings }>) {
  app.openapi(quadrantRoute, async (c) => {
    const { text: rawText, options } = c.req.valid('json');
    const store = c.env?.TEXT_STORE;
    const resolved = await resolveText(rawText, store);
    if (!resolved) return c.json({ error: `Hash not found: ${rawText}` }, 404);
    const result = quadrant(resolved.text, options);
    await storeText(result.inputHash, resolved.text, store);
    return c.json(withId(result));
  });

  app.openapi(shuffleRoute, async (c) => {
    const { text: rawText, options } = c.req.valid('json');
    const store = c.env?.TEXT_STORE;
    const resolved = await resolveText(rawText, store);
    if (!resolved) return c.json({ error: `Hash not found: ${rawText}` }, 404);
    const result = shuffle(resolved.text, options);
    await storeText(result.inputHash, resolved.text, store);
    return c.json(withId(result));
  });

  app.openapi(foldRoute, async (c) => {
    const { text: rawText, textB: rawTextB, options } = c.req.valid('json');
    const store = c.env?.TEXT_STORE;
    const [resolvedA, resolvedB] = await Promise.all([
      resolveText(rawText, store),
      resolveText(rawTextB, store),
    ]);
    if (!resolvedA) return c.json({ error: `Hash not found: ${rawText}` }, 404);
    if (!resolvedB) return c.json({ error: `Hash not found: ${rawTextB}` }, 404);
    const result = foldIn(resolvedA.text, resolvedB.text, options);
    // Store each source text individually so either can be referenced alone later
    await Promise.all([
      storeText(sha256hex(resolvedA.text), resolvedA.text, store),
      storeText(sha256hex(resolvedB.text), resolvedB.text, store),
    ]);
    return c.json(withId(result));
  });

  app.openapi(permutateRoute, async (c) => {
    const { text: rawText, options } = c.req.valid('json');
    const store = c.env?.TEXT_STORE;
    const resolved = await resolveText(rawText, store);
    if (!resolved) return c.json({ error: `Hash not found: ${rawText}` }, 404);
    try {
      const result = permutate(resolved.text, options);
      await storeText(result.inputHash, resolved.text, store);
      return c.json(withId(result));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Permutation failed';
      return c.json({ error: msg }, 400);
    }
  });

  app.openapi(unifiedRoute, async (c) => {
    const body = c.req.valid('json');
    const store = c.env?.TEXT_STORE;
    const parsed = UnifiedRequestSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Validation failed', issues: parsed.error.issues }, 422);
    }
    const req = parsed.data;
    const resolvedText = await resolveText(req.text, store);
    if (!resolvedText) return c.json({ error: `Hash not found: ${req.text}` }, 404);
    try {
      let result: ReturnType<typeof quadrant>;
      switch (req.method) {
        case 'quadrant':
          result = quadrant(resolvedText.text, req.options as Parameters<typeof quadrant>[1]);
          break;
        case 'shuffle':
          result = shuffle(resolvedText.text, req.options as Parameters<typeof shuffle>[1]);
          break;
        case 'fold': {
          const rawB = req.textB ?? '';
          const resolvedB = await resolveText(rawB, store);
          if (!resolvedB) return c.json({ error: `Hash not found: ${rawB}` }, 404);
          result = foldIn(resolvedText.text, resolvedB.text, req.options as Parameters<typeof foldIn>[2]);
          await Promise.all([
            storeText(sha256hex(resolvedText.text), resolvedText.text, store),
            storeText(sha256hex(resolvedB.text), resolvedB.text, store),
          ]);
          break;
        }
        case 'permutation':
          result = permutate(resolvedText.text, req.options as Parameters<typeof permutate>[1]);
          break;
      }
      await storeText(result.inputHash, resolvedText.text, store);
      return c.json(withId(result));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Cut-up failed';
      return c.json({ error: msg }, 400);
    }
  });
}
