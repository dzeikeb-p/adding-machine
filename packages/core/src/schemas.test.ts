import { describe, expect, it } from 'vitest';
import {
  FoldRequestSchema,
  PermutationOptionsSchema,
  PermutationRequestSchema,
  QuadrantOptionsSchema,
  QuadrantRequestSchema,
  ShuffleOptionsSchema,
  ShuffleRequestSchema,
  TEXT_MAX,
  UnifiedRequestSchema,
} from './schemas.js';

describe('TEXT_MAX', () => {
  it('is 100 KB (102400 bytes)', () => {
    expect(TEXT_MAX).toBe(102400);
  });
});

describe('QuadrantRequestSchema', () => {
  it('accepts valid input', () => {
    const result = QuadrantRequestSchema.safeParse({ text: 'hello\nworld' });
    expect(result.success).toBe(true);
  });

  it('rejects empty text', () => {
    expect(QuadrantRequestSchema.safeParse({ text: '' }).success).toBe(false);
  });

  it('rejects text exceeding TEXT_MAX', () => {
    const result = QuadrantRequestSchema.safeParse({ text: 'x'.repeat(TEXT_MAX + 1) });
    expect(result.success).toBe(false);
  });

  it('accepts valid options', () => {
    const result = QuadrantRequestSchema.safeParse({
      text: 'hello',
      options: { iterations: 3, seed: 'abc' },
    });
    expect(result.success).toBe(true);
  });
});

describe('QuadrantOptionsSchema', () => {
  it('rejects iterations < 1', () => {
    expect(QuadrantOptionsSchema.safeParse({ iterations: 0 }).success).toBe(false);
  });
});

describe('ShuffleRequestSchema', () => {
  it('accepts all unit values', () => {
    for (const unit of ['word', 'phrase', 'sentence', 'line', 'ngram'] as const) {
      const r = ShuffleRequestSchema.safeParse({ text: 'hello world', options: { unit } });
      expect(r.success).toBe(true);
    }
  });

  it('rejects invalid unit', () => {
    const r = ShuffleOptionsSchema.safeParse({ unit: 'paragraph' });
    expect(r.success).toBe(false);
  });
});

describe('FoldRequestSchema', () => {
  it('requires both text and textB', () => {
    expect(FoldRequestSchema.safeParse({ text: 'hello' }).success).toBe(false);
    expect(FoldRequestSchema.safeParse({ text: 'hello', textB: 'world' }).success).toBe(true);
  });

  it('rejects foldRatio outside [0,1]', () => {
    const r = FoldRequestSchema.safeParse({
      text: 'a',
      textB: 'b',
      options: { foldRatio: 1.5 },
    });
    expect(r.success).toBe(false);
  });
});

describe('PermutationRequestSchema', () => {
  it('accepts mode=all and mode=sample', () => {
    for (const mode of ['all', 'sample'] as const) {
      const r = PermutationRequestSchema.safeParse({ text: 'I AM', options: { mode } });
      expect(r.success).toBe(true);
    }
  });

  it('rejects invalid mode', () => {
    const r = PermutationOptionsSchema.safeParse({ mode: 'random' });
    expect(r.success).toBe(false);
  });
});

describe('UnifiedRequestSchema', () => {
  it('discriminates on method field', () => {
    const quadrant = UnifiedRequestSchema.safeParse({ method: 'quadrant', text: 'hello' });
    expect(quadrant.success).toBe(true);
    if (quadrant.success) expect(quadrant.data.method).toBe('quadrant');
  });

  it('fold branch requires textB', () => {
    const noB = UnifiedRequestSchema.safeParse({ method: 'fold', text: 'hello' });
    expect(noB.success).toBe(false);
    const withB = UnifiedRequestSchema.safeParse({ method: 'fold', text: 'hello', textB: 'world' });
    expect(withB.success).toBe(true);
  });

  it('rejects unknown method', () => {
    const r = UnifiedRequestSchema.safeParse({ method: 'unknown', text: 'hello' });
    expect(r.success).toBe(false);
  });
});
