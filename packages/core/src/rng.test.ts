import { describe, expect, it } from 'vitest';
import { makeRng, randomSeed } from './rng.js';

describe('makeRng', () => {
  it('same seed → same sequence', () => {
    const rng1 = makeRng('test-seed');
    const rng2 = makeRng('test-seed');
    for (let i = 0; i < 20; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it('different seeds → different sequences', () => {
    const rng1 = makeRng('seed-alpha');
    const rng2 = makeRng('seed-beta');
    const vals1 = Array.from({ length: 10 }, () => rng1());
    const vals2 = Array.from({ length: 10 }, () => rng2());
    expect(vals1).not.toEqual(vals2);
  });

  it('output is in [0, 1)', () => {
    const rng = makeRng('range-test');
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('randomSeed', () => {
  it('returns a 16-char hex string', () => {
    const seed = randomSeed();
    expect(seed).toHaveLength(16);
    expect(seed).toMatch(/^[0-9a-f]{16}$/);
  });

  it('successive calls return different seeds', () => {
    const seeds = new Set(Array.from({ length: 20 }, () => randomSeed()));
    expect(seeds.size).toBe(20);
  });
});
