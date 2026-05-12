import { randomSeed } from './rng.js';
import { sha256hex } from './sha256.js';
import type { CutUpResult, FoldOptions } from './types.js';

export function foldIn(textA: string, textB: string, opts: FoldOptions = {}): CutUpResult {
  const t0 = Date.now();
  const seed = opts.seed ?? randomSeed();
  const foldRatio = opts.foldRatio ?? 0.5;
  const axis = opts.axis ?? 'vertical';

  const linesA = textA.split('\n');
  const linesB = textB.split('\n');

  // Truncate to the shorter length
  const lineCount = Math.min(linesA.length, linesB.length);
  const truncA = linesA.slice(0, lineCount);
  const truncB = linesB.slice(0, lineCount);

  let outputLines: string[];

  if (axis === 'horizontal') {
    const splitAt = Math.floor(lineCount * foldRatio);
    outputLines = [...truncA.slice(0, splitAt), ...truncB.slice(splitAt)];
  } else {
    // vertical (default): fold by character position within each line
    const maxWidth = Math.max(0, ...truncA.map((l) => l.length), ...truncB.map((l) => l.length));
    const foldAt = Math.floor(maxWidth * foldRatio);

    outputLines = truncA.map((lineA, i) => {
      const lineB = truncB[i]!;
      const paddedA = lineA.padEnd(maxWidth, ' ');
      const paddedB = lineB.padEnd(maxWidth, ' ');
      return paddedA.slice(0, foldAt) + paddedB.slice(foldAt);
    });
  }

  const outputText = outputLines.join('\n');
  const inputHash = sha256hex(`${textA}\x00${textB}`);

  return {
    text: outputText,
    method: 'fold',
    seed,
    inputHash,
    stats: {
      inputChars: textA.length + textB.length,
      outputChars: outputText.length,
      units: lineCount,
      durationMs: Date.now() - t0,
    },
  };
}
