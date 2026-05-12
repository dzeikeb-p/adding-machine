import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';

const MethodInfoSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    endpoint: z.string(),
  })
  .openapi('MethodInfo');

const MethodsResponseSchema = z
  .object({ methods: z.array(MethodInfoSchema) })
  .openapi('MethodsResponse');

const METHODS = [
  {
    id: 'quadrant',
    name: 'Quadrant Cut-Up',
    description:
      "Gysin's literal razor method. Splits text into four quadrants and reassembles them as Burroughs prescribed: BR|TL on top, BL|TR on bottom.",
    endpoint: '/v1/cutup/quadrant',
  },
  {
    id: 'shuffle',
    name: 'Shuffle Cut-Up',
    description:
      'Chunk text by unit (word, ngram, sentence, line, phrase) and randomize with a seeded Fisher–Yates shuffle.',
    endpoint: '/v1/cutup/shuffle',
  },
  {
    id: 'fold',
    name: 'Fold-In',
    description:
      "Burroughs' extension: fold a second source into the first, interleaving the two texts at a configurable ratio.",
    endpoint: '/v1/cutup/fold',
  },
  {
    id: 'permutation',
    name: 'Permutation',
    description:
      'Gysin/Sommerville mode: generate every (or sampled) permutation of a short phrase. Phrases ≤7 words with mode=all; longer phrases require mode=sample.',
    endpoint: '/v1/cutup/permutate',
  },
];

const route = createRoute({
  method: 'get',
  path: '/v1/methods',
  tags: ['Cut-Up'],
  summary: 'List available methods',
  responses: {
    200: {
      content: { 'application/json': { schema: MethodsResponseSchema } },
      description: 'All available cut-up methods',
    },
  },
});

export function registerMethods(app: OpenAPIHono<{ Bindings: Bindings }>) {
  app.openapi(route, (c) => c.json({ methods: METHODS }));
}
