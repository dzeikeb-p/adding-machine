import { describe, expect, it } from 'vitest';
import { shuffle } from './shuffle.js';
import { tokenizeWords } from './utils.js';

// Public-domain seed text (Burroughs description excerpt, paraphrased as test fixture)
const FIXTURE =
  'Take a page cut down the middle and across the middle you have four sections ' +
  'rearrange the sections placing section four with section one and section two with section three';

describe('shuffle', () => {
  it('snapshot: fixed seed produces known output', () => {
    const result = shuffle(FIXTURE, { seed: 'test-seed-001', unit: 'word' });
    // Snapshot the first result — run once to capture, then lock it in
    expect(result.seed).toBe('test-seed-001');
    expect(result.method).toBe('shuffle');
    // Lock the output text so regressions are caught
    expect(result.text).toMatchInlineSnapshot(
      `"section one across sections middle a section and placing section down middle three Take the four cut four two with page rearrange sections you have the section with the and"`,
    );
  });

  it('property: word shuffle produces same bag of words as input', () => {
    const result = shuffle(FIXTURE, { seed: 'bag-test', unit: 'word' });
    const inputWords = tokenizeWords(FIXTURE).sort();
    const outputWords = tokenizeWords(result.text).sort();
    expect(outputWords).toEqual(inputWords);
  });

  it('property: seed reproducibility', () => {
    const r1 = shuffle(FIXTURE, { seed: 'repro-seed' });
    const r2 = shuffle(FIXTURE, { seed: 'repro-seed' });
    expect(r1.text).toBe(r2.text);
  });

  it('different seeds produce different results', () => {
    const r1 = shuffle(FIXTURE, { seed: 'seed-a' });
    const r2 = shuffle(FIXTURE, { seed: 'seed-b' });
    expect(r1.text).not.toBe(r2.text);
  });

  it('unit: sentence mode', () => {
    const text = 'Cut the words. See how they fall. The machine speaks.';
    const result = shuffle(text, { seed: 'sent-test', unit: 'sentence' });
    expect(result.stats.units).toBe(3);
    // All sentences present in output
    expect(result.text).toContain('Cut the words.');
    expect(result.text).toContain('See how they fall.');
    expect(result.text).toContain('The machine speaks.');
  });

  it('unit: line mode', () => {
    const text = 'line one\nline two\nline three';
    const result = shuffle(text, { seed: 'line-test', unit: 'line' });
    expect(result.stats.units).toBe(3);
    const lines = result.text.split('\n');
    expect(lines.sort()).toEqual(['line one', 'line three', 'line two']);
  });

  it('unit: ngram mode chunks correctly', () => {
    const text = 'one two three four five six';
    const result = shuffle(text, { seed: 'ngram-test', unit: 'ngram', ngramSize: 2 });
    expect(result.stats.units).toBe(3); // "one two", "three four", "five six"
  });

  it('preserveTerminals keeps terminal-ending chunks at terminal positions', () => {
    const text = 'alpha beta. gamma delta. epsilon zeta.';
    const result = shuffle(text, {
      seed: 'terminal-test',
      unit: 'word',
      preserveTerminals: true,
    });
    const words = result.text.split(' ');
    const terminalPositions = words
      .map((w, i) => ({ w, i }))
      .filter(({ w }) => /[.!?]$/.test(w))
      .map(({ i }) => i);
    // In input, terminals are at positions 1, 3, 5 (0-indexed) out of 6 words
    // With preserveTerminals, those 3 terminal positions should still hold terminal words
    expect(terminalPositions).toHaveLength(3);
    // Terminals in original are at odd positions — verify they are still at those exact positions
    expect(terminalPositions).toEqual([1, 3, 5]);
  });

  it('returns correct stats', () => {
    const result = shuffle('hello world foo bar', { seed: 'stats-test', unit: 'word' });
    expect(result.stats.inputChars).toBe(19);
    expect(result.stats.units).toBe(4);
    expect(result.stats.outputChars).toBe(result.text.length);
    expect(result.stats.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('inputHash is deterministic sha-256 of input', () => {
    const r1 = shuffle(FIXTURE, { seed: 'hash-test' });
    const r2 = shuffle(FIXTURE, { seed: 'other-seed' });
    expect(r1.inputHash).toBe(r2.inputHash); // same input → same hash regardless of seed
    expect(r1.inputHash).toHaveLength(64); // hex sha-256
  });
});
