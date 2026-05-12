import { describe, expect, it } from 'vitest';
import { quadrant } from './quadrant.js';

// 4-line, 8-char-wide input (spaces to pad if needed)
const GRID_INPUT = 'AAAABBBB\nCCCCDDDD\nEEEEFFFF\nGGGGHHHH';

describe('quadrant', () => {
  it('snapshot: 4-row 8-col grid reassembles as expected', () => {
    const result = quadrant(GRID_INPUT, { seed: 'grid-test' });
    // Expected (Burroughs BR|TL top, BL|TR bottom):
    // Row 0: BR_row0(FFFF) + TL_row0(AAAA) = FFFFAAAA
    // Row 1: BR_row1(HHHH) + TL_row1(CCCC) = HHHHCCCC
    // Row 2: BL_row0(EEEE) + TR_row0(BBBB) = EEEBBBB  → EEEEBBBB
    // Row 3: BL_row1(GGGG) + TR_row1(DDDD) = GGGGDDDD
    expect(result.text).toBe('FFFFAAAA\nHHHHCCCC\nEEEEBBBB\nGGGGDDDD');
    expect(result.method).toBe('quadrant');
    expect(result.seed).toBe('grid-test');
  });

  it('property: output char count is within 10% of input', () => {
    const text =
      'The quick brown fox jumps over\nthe lazy dog and then\nwalks away slowly into\nthe dark forest alone';
    const result = quadrant(text);
    const ratio = result.stats.outputChars / result.stats.inputChars;
    expect(ratio).toBeGreaterThan(0.9);
    expect(ratio).toBeLessThan(1.1);
  });

  it('iterations=2 produces a different result from iterations=1', () => {
    const text = 'AAAABBBB\nCCCCDDDD\nEEEEFFFF\nGGGGHHHH';
    const r1 = quadrant(text, { seed: 'iter-test', iterations: 1 });
    const r2 = quadrant(text, { seed: 'iter-test', iterations: 2 });
    expect(r2.text).not.toBe(r1.text);
  });

  it('single line returns text unchanged', () => {
    const text = 'just one line here';
    const result = quadrant(text, { seed: 'single-line' });
    expect(result.text).toBe(text);
  });

  it('seed is echoed in result', () => {
    const result = quadrant(GRID_INPUT, { seed: 'echo-me' });
    expect(result.seed).toBe('echo-me');
  });

  it('generates a random seed when none provided', () => {
    const result = quadrant(GRID_INPUT);
    expect(result.seed).toHaveLength(16); // randomSeed() returns 16-char hex
  });

  it('inputHash is sha-256 of original input regardless of iterations', () => {
    const r1 = quadrant(GRID_INPUT, { iterations: 1 });
    const r2 = quadrant(GRID_INPUT, { iterations: 2 });
    expect(r1.inputHash).toBe(r2.inputHash);
    expect(r1.inputHash).toHaveLength(64);
  });
});
