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
  shuffle,
} from '@adding-machine/core';

// ── Shared response schemas ───────────────────────────────────────────────────

const OkSchema = CutUpResultSchema.openapi('CutUpResult');
const ErrSchema = ErrorResponseSchema.openapi('ErrorResponse');

function ok400() {
  return {
    content: { 'application/json': { schema: ErrSchema } },
    description: 'Invalid request (e.g. phrase too long for permutate mode=all)',
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
    "Gysin's original razor method. Splits the text into four quadrants and reassembles BR|TL on top, BL|TR on bottom.",
  request: {
    body: {
      content: { 'application/json': { schema: QuadrantRequestSchema.openapi('QuadrantRequest') } },
      required: true,
    },
  },
  responses: {
    200: { content: { 'application/json': { schema: OkSchema } }, description: 'Cut-up result' },
    413: ok413(),
    422: { content: { 'application/json': { schema: ErrSchema } }, description: 'Validation error' },
  },
});

const shuffleRoute = createRoute({
  method: 'post',
  path: '/v1/cutup/shuffle',
  tags: ['Cut-Up'],
  summary: 'Shuffle cut-up',
  description: 'Tokenise by unit (word, ngram, sentence, line, phrase) and randomise order.',
  request: {
    body: {
      content: { 'application/json': { schema: ShuffleRequestSchema.openapi('ShuffleRequest') } },
      required: true,
    },
  },
  responses: {
    200: { content: { 'application/json': { schema: OkSchema } }, description: 'Cut-up result' },
    413: ok413(),
    422: { content: { 'application/json': { schema: ErrSchema } }, description: 'Validation error' },
  },
});

const foldRoute = createRoute({
  method: 'post',
  path: '/v1/cutup/fold',
  tags: ['Cut-Up'],
  summary: 'Fold-in',
  description: "Burroughs' fold-in: two texts interleaved at a configurable fold ratio.",
  request: {
    body: {
      content: { 'application/json': { schema: FoldRequestSchema.openapi('FoldRequest') } },
      required: true,
    },
  },
  responses: {
    200: { content: { 'application/json': { schema: OkSchema } }, description: 'Cut-up result' },
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
    'Gysin/Sommerville mode. All permutations of a short phrase (≤7 words), or a sampled subset.',
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
  description: 'Single endpoint for all methods. Dispatch via the `method` field.',
  request: {
    body: {
      content: { 'application/json': { schema: UnifiedSchema } },
      required: true,
    },
  },
  responses: {
    200: { content: { 'application/json': { schema: OkSchema } }, description: 'Cut-up result' },
    400: ok400(),
    413: ok413(),
    422: { content: { 'application/json': { schema: ErrSchema } }, description: 'Validation error' },
  },
});

// ── Route handlers ────────────────────────────────────────────────────────────

export function registerCutup(app: OpenAPIHono<{ Bindings: Bindings }>) {
  app.openapi(quadrantRoute, (c) => {
    const { text, options } = c.req.valid('json');
    return c.json(withId(quadrant(text, options)));
  });

  app.openapi(shuffleRoute, (c) => {
    const { text, options } = c.req.valid('json');
    return c.json(withId(shuffle(text, options)));
  });

  app.openapi(foldRoute, (c) => {
    const { text, textB, options } = c.req.valid('json');
    return c.json(withId(foldIn(text, textB, options)));
  });

  app.openapi(permutateRoute, (c) => {
    const { text, options } = c.req.valid('json');
    try {
      return c.json(withId(permutate(text, options)));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Permutation failed';
      return c.json({ error: msg }, 400);
    }
  });

  app.openapi(unifiedRoute, (c) => {
    const body = c.req.valid('json');
    // Re-validate against the discriminated union to get proper types
    const parsed = UnifiedRequestSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Validation failed', issues: parsed.error.issues }, 422);
    }
    const req = parsed.data;
    try {
      let result: object;
      switch (req.method) {
        case 'quadrant':
          result = quadrant(req.text, req.options);
          break;
        case 'shuffle':
          result = shuffle(req.text, req.options);
          break;
        case 'fold':
          result = foldIn(req.text, req.textB, req.options);
          break;
        case 'permutation':
          result = permutate(req.text, req.options);
          break;
      }
      return c.json(withId(result));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Cut-up failed';
      return c.json({ error: msg }, 400);
    }
  });
}
