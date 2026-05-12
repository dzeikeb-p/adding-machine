import { randomSeed } from './rng.js';
import { sha256hex } from './sha256.js';
import type { CutUpResult, QuadrantOptions } from './types.js';
import { padLines } from './utils.js';

function applyQuadrant(text: string): string {
  const lines = text.split('\n');
  if (lines.length < 2) {
    // Can't cut a single line — return as-is
    return text;
  }

  const padded = padLines(lines);
  const lineWidth = padded[0]!.length;
  const midRow = Math.floor(padded.length / 2);
  const midCol = Math.floor(lineWidth / 2);

  // Each new top row i: right half of bottom row i (BR) + left half of top row i (TL)
  // Each new bottom row i: left half of bottom row i (BL) + right half of top row i (TR)
  const output: string[] = [];

  for (let i = 0; i < midRow; i++) {
    const topRow = padded[i]!;
    const bottomRow = padded[i + midRow]!;
    // BR col half + TL col half
    output.push(bottomRow.slice(midCol) + topRow.slice(0, midCol));
  }
  for (let i = 0; i < midRow; i++) {
    const topRow = padded[i]!;
    const bottomRow = padded[i + midRow]!;
    // BL col half + TR col half
    output.push(bottomRow.slice(0, midCol) + topRow.slice(midCol));
  }

  // If the original had an odd number of lines, the middle row is dropped (it was the cut line).
  // Re-flow: join lines, collapse internal whitespace runs to single space, preserve line breaks.
  return output.map((l) => l.replace(/\s+/g, ' ').trimEnd()).join('\n');
}

export function quadrant(text: string, opts: QuadrantOptions = {}): CutUpResult {
  const t0 = Date.now();
  const seed = opts.seed ?? randomSeed();
  const iterations = opts.iterations ?? 1;

  let current = text;
  for (let i = 0; i < iterations; i++) {
    current = applyQuadrant(current);
  }

  return {
    text: current,
    method: 'quadrant',
    seed,
    inputHash: sha256hex(text),
    stats: {
      inputChars: text.length,
      outputChars: current.length,
      units: text.split('\n').length,
      durationMs: Date.now() - t0,
    },
  };
}
