import { describe, expect, it } from 'vitest';
import { permutate } from './permutate.js';

describe('permutate', () => {
  it('divine tautology: "I AM THAT I AM" produces exactly 30 distinct lines', () => {
    // 5 words: I(×2), AM(×2), THAT(×1)
    // Distinct permutations = 5! / (2! × 2! × 1!) = 120 / 4 = 30
    const result = permutate('I AM THAT I AM', { mode: 'all' });
    const lines = result.text.split('\n');
    expect(lines).toHaveLength(30);
    const distinct = new Set(lines);
    expect(distinct.size).toBe(30);
  });

  it('mode=all on a unique-word phrase produces n! lines', () => {
    // "one two three" → 3! = 6 permutations, all distinct
    const result = permutate('one two three', { mode: 'all' });
    expect(result.stats.units).toBe(6);
    expect(result.text.split('\n')).toHaveLength(6);
  });

  it('mode=sample returns exactly sampleSize lines', () => {
    const result = permutate('I AM THAT I AM', { mode: 'sample', sampleSize: 10, seed: 'samp' });
    expect(result.text.split('\n')).toHaveLength(10);
  });

  it('mode=sample lines are all distinct', () => {
    const result = permutate('one two three four five', {
      mode: 'sample',
      sampleSize: 20,
      seed: 'distinct-test',
    });
    const lines = result.text.split('\n');
    const distinct = new Set(lines);
    expect(distinct.size).toBe(lines.length);
  });

  it('guard: 8+ words with mode=all throws with explanation', () => {
    expect(() =>
      permutate('one two three four five six seven eight', { mode: 'all' }),
    ).toThrowError(/8! = 40,320|too many|mode='sample'/);
  });

  it('seed reproducibility: same seed + same phrase → same sample order', () => {
    const r1 = permutate('I AM THAT I AM', { mode: 'sample', sampleSize: 5, seed: 'repro' });
    const r2 = permutate('I AM THAT I AM', { mode: 'sample', sampleSize: 5, seed: 'repro' });
    expect(r1.text).toBe(r2.text);
  });

  it('different seeds produce different sample orders', () => {
    const r1 = permutate('I AM THAT I AM', { mode: 'sample', sampleSize: 5, seed: 'alpha' });
    const r2 = permutate('I AM THAT I AM', { mode: 'sample', sampleSize: 5, seed: 'beta' });
    expect(r1.text).not.toBe(r2.text);
  });

  it('maxLines cap is respected', () => {
    const result = permutate('one two three four five', { mode: 'all', maxLines: 5 });
    expect(result.text.split('\n')).toHaveLength(5);
  });

  it('stats.units equals number of permutation lines', () => {
    const result = permutate('alpha beta gamma', { mode: 'all' });
    expect(result.stats.units).toBe(result.text.split('\n').length);
  });

  it('inputHash is sha-256 of the original phrase', () => {
    const r1 = permutate('I AM THAT I AM', { mode: 'all' });
    const r2 = permutate('I AM THAT I AM', { mode: 'sample', sampleSize: 5 });
    expect(r1.inputHash).toBe(r2.inputHash);
    expect(r1.inputHash).toHaveLength(64);
  });
});
