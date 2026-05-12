import { z } from 'zod';

export const TEXT_MAX = 102400; // 100 KB

// ── Option schemas ────────────────────────────────────────────────────────────

export const CutUpOptionsSchema = z.object({
  seed: z.string().optional(),
});

export const QuadrantOptionsSchema = CutUpOptionsSchema.extend({
  iterations: z.number().int().min(1).optional(),
});

export const ShuffleOptionsSchema = CutUpOptionsSchema.extend({
  unit: z.enum(['word', 'phrase', 'sentence', 'line', 'ngram']).optional(),
  ngramSize: z.number().int().min(1).optional(),
  preserveTerminals: z.boolean().optional(),
});

export const FoldOptionsSchema = CutUpOptionsSchema.extend({
  foldRatio: z.number().min(0).max(1).optional(),
  axis: z.enum(['vertical', 'horizontal']).optional(),
});

export const PermutationOptionsSchema = CutUpOptionsSchema.extend({
  maxLines: z.number().int().min(1).optional(),
  mode: z.enum(['all', 'sample']).optional(),
  sampleSize: z.number().int().min(1).optional(),
});

// ── Request body schemas ──────────────────────────────────────────────────────

export const QuadrantRequestSchema = z.object({
  text: z.string().min(1).max(TEXT_MAX),
  options: QuadrantOptionsSchema.optional(),
});

export const ShuffleRequestSchema = z.object({
  text: z.string().min(1).max(TEXT_MAX),
  options: ShuffleOptionsSchema.optional(),
});

export const FoldRequestSchema = z.object({
  text: z.string().min(1).max(TEXT_MAX),
  textB: z.string().min(1).max(TEXT_MAX),
  options: FoldOptionsSchema.optional(),
});

export const PermutationRequestSchema = z.object({
  text: z.string().min(1).max(TEXT_MAX),
  options: PermutationOptionsSchema.optional(),
});

export const UnifiedRequestSchema = z.discriminatedUnion('method', [
  QuadrantRequestSchema.extend({ method: z.literal('quadrant') }),
  ShuffleRequestSchema.extend({ method: z.literal('shuffle') }),
  FoldRequestSchema.extend({ method: z.literal('fold') }),
  PermutationRequestSchema.extend({ method: z.literal('permutation') }),
]);

// ── Response schema ───────────────────────────────────────────────────────────

export const CutUpResultSchema = z.object({
  id: z.string().uuid(),
  text: z.string(),
  method: z.enum(['quadrant', 'shuffle', 'fold', 'permutation']),
  seed: z.string(),
  inputHash: z.string(),
  stats: z.object({
    inputChars: z.number(),
    outputChars: z.number(),
    units: z.number(),
    durationMs: z.number(),
  }),
});

export const ErrorResponseSchema = z.object({
  error: z.string(),
  issues: z
    .array(z.object({ message: z.string(), path: z.array(z.unknown()) }))
    .optional(),
});
