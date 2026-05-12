import { foldIn, permutate, quadrant, shuffle } from '@adding-machine/core';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

const TEXT_MAX = 102400;

function wrap(result: { text: string; seed: string; stats: object; inputHash: string }) {
  return {
    content: [{ type: 'text' as const, text: result.text }],
    _meta: { seed: result.seed, stats: result.stats, inputHash: result.inputHash },
  };
}

export function registerTools(server: McpServer) {
  server.tool(
    'cutup_quadrant',
    "Apply Brion Gysin's classic four-quadrant cut-up to text. Slices the page into four sections and reassembles them as Burroughs prescribed: bottom-right with top-left on top, bottom-left with top-right below. Original phrases collide across the seams.",
    {
      text: z.string().min(1).max(TEXT_MAX).describe('The text to cut up'),
      iterations: z
        .number()
        .int()
        .min(1)
        .optional()
        .describe('How many times to fold and rearrange. Default 1.'),
      seed: z.string().optional().describe('PRNG seed. Omit for a random seed.'),
    },
    async ({ text, iterations, seed }) => wrap(quadrant(text, { iterations, seed })),
  );

  server.tool(
    'cutup_shuffle',
    'Chunk text into units (word, n-gram, sentence, line, or phrase) and randomly reorder them. The most flexible cut-up operation. Set a seed to reproduce any result exactly.',
    {
      text: z.string().min(1).max(TEXT_MAX).describe('The text to cut up'),
      unit: z
        .enum(['word', 'phrase', 'sentence', 'line', 'ngram'])
        .optional()
        .describe('Unit of cutting. Default: word'),
      ngramSize: z
        .number()
        .int()
        .min(1)
        .optional()
        .describe('N-gram size when unit=ngram. Default 3.'),
      preserveTerminals: z
        .boolean()
        .optional()
        .describe('Keep sentence-ending punctuation at sentence positions. Default false.'),
      seed: z.string().optional().describe('PRNG seed. Omit for a random seed.'),
    },
    async ({ text, unit, ngramSize, preserveTerminals, seed }) =>
      wrap(shuffle(text, { unit, ngramSize, preserveTerminals, seed })),
  );

  server.tool(
    'cutup_fold',
    "Burroughs' fold-in: fold a second source text into the first. Produces hybrid text where two voices interleave at a configurable ratio along each line.",
    {
      textA: z.string().min(1).max(TEXT_MAX).describe('First source text'),
      textB: z.string().min(1).max(TEXT_MAX).describe('Second source text to fold in'),
      foldRatio: z
        .number()
        .min(0)
        .max(1)
        .optional()
        .describe(
          'Where the fold happens, 0..1. Default 0.5 (Burroughs classic centre-fold).',
        ),
      axis: z
        .enum(['vertical', 'horizontal'])
        .optional()
        .describe(
          'vertical = fold by character within each line; horizontal = fold by lines. Default vertical.',
        ),
      seed: z.string().optional().describe('PRNG seed. Omit for a random seed.'),
    },
    async ({ textA, textB, foldRatio, axis, seed }) =>
      wrap(foldIn(textA, textB, { foldRatio, axis, seed })),
  );

  server.tool(
    'cutup_permutate',
    'Generate every (or a sampled subset of) the permutations of the words in a short phrase, in the style of Gysin\'s "I AM THAT I AM." Phrases of more than 7 words must use mode=sample.',
    {
      phrase: z
        .string()
        .min(1)
        .max(TEXT_MAX)
        .describe('The phrase to permutate (7 words or fewer for mode=all)'),
      mode: z
        .enum(['all', 'sample'])
        .optional()
        .describe('all = every distinct permutation; sample = random subset. Default all.'),
      sampleSize: z
        .number()
        .int()
        .min(1)
        .optional()
        .describe('Number of permutations when mode=sample. Default 24.'),
      seed: z.string().optional().describe('PRNG seed. Omit for a random seed.'),
    },
    async ({ phrase, mode, sampleSize, seed }) => {
      try {
        return wrap(permutate(phrase, { mode, sampleSize, seed }));
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Permutation failed';
        return { content: [{ type: 'text' as const, text: `Error: ${msg}` }], isError: true };
      }
    },
  );
}
