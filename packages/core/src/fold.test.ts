import { describe, expect, it } from 'vitest';
import { foldIn } from './fold.js';

describe('foldIn', () => {
  it('snapshot: vertical fold at 0.5 interleaves at midpoint', () => {
    const a = 'AAAABBBB\nCCCCDDDD';
    const b = 'EEEEFFFF\nGGGGHHHH';
    const result = foldIn(a, b, { seed: 'fold-test', foldRatio: 0.5 });
    // Each 8-char line: first 4 from A, last 4 from B
    // Line 0: AAAA + FFFF = AAAAFFFF
    // Line 1: CCCC + HHHH = CCCCHHHH
    expect(result.text).toBe('AAAAFFFF\nCCCCHHHH');
    expect(result.method).toBe('fold');
    expect(result.seed).toBe('fold-test');
  });

  it('property: output line count equals min(linesA, linesB)', () => {
    const a = 'one\ntwo\nthree\nfour';
    const b = 'alpha\nbeta';
    const result = foldIn(a, b);
    expect(result.stats.units).toBe(2);
    expect(result.text.split('\n')).toHaveLength(2);
  });

  it('axis=horizontal: top half from A, bottom half from B', () => {
    const a = 'line one\nline two\nline three\nline four';
    const b = 'alpha one\nalpha two\nalpha three\nalpha four';
    const result = foldIn(a, b, { axis: 'horizontal', foldRatio: 0.5 });
    const lines = result.text.split('\n');
    expect(lines[0]).toBe('line one');
    expect(lines[1]).toBe('line two');
    expect(lines[2]).toBe('alpha three');
    expect(lines[3]).toBe('alpha four');
  });

  it('foldRatio=0 takes everything from B', () => {
    const a = 'AAAA\nBBBB';
    const b = 'CCCC\nDDDD';
    const result = foldIn(a, b, { foldRatio: 0 });
    // foldAt = 0 → 0 chars from A, all from B
    expect(result.text).toBe('CCCC\nDDDD');
  });

  it('foldRatio=1 takes everything from A', () => {
    const a = 'AAAA\nBBBB';
    const b = 'CCCC\nDDDD';
    const result = foldIn(a, b, { foldRatio: 1 });
    // foldAt = 4 (=maxWidth) → all chars from A
    expect(result.text).toBe('AAAA\nBBBB');
  });

  it('inputHash covers both inputs', () => {
    const r1 = foldIn('hello', 'world');
    const r2 = foldIn('world', 'hello');
    expect(r1.inputHash).not.toBe(r2.inputHash);
  });

  it('seed is echoed', () => {
    const result = foldIn('a\nb', 'c\nd', { seed: 'my-seed' });
    expect(result.seed).toBe('my-seed');
  });

  it('stats inputChars = len(A) + len(B)', () => {
    const a = 'hello world';
    const b = 'foo bar baz';
    const result = foldIn(a, b);
    expect(result.stats.inputChars).toBe(a.length + b.length);
  });
});
