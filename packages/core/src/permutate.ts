import { makeRng, randomSeed } from './rng.js';
import { sha256hex } from './sha256.js';
import type { CutUpResult, PermutationOptions } from './types.js';

// Heap's iterative algorithm — generates all n! permutations in-place
function heapPermutations(words: string[]): string[][] {
  const n = words.length;
  const result: string[][] = [];
  const a = words.slice();
  const c = new Array(n).fill(0) as number[];

  result.push(a.slice());
  let i = 0;
  while (i < n) {
    if (c[i]! < i) {
      if (i % 2 === 0) {
        const tmp = a[0]!;
        a[0] = a[i]!;
        a[i] = tmp;
      } else {
        const tmp = a[c[i]!]!;
        a[c[i]!] = a[i]!;
        a[i] = tmp;
      }
      result.push(a.slice());
      c[i]!;
      c[i] = c[i]! + 1;
      i = 0;
    } else {
      c[i] = 0;
      i++;
    }
  }
  return result;
}

function fisherYatesSample<T>(arr: T[], k: number, rng: () => number): T[] {
  const a = arr.slice();
  const end = Math.min(k, a.length);
  for (let i = 0; i < end; i++) {
    const j = i + Math.floor(rng() * (a.length - i));
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a.slice(0, end);
}

export function permutate(phrase: string, opts: PermutationOptions = {}): CutUpResult {
  const t0 = Date.now();
  const seed = opts.seed ?? randomSeed();
  const rng = makeRng(seed);
  const mode = opts.mode ?? 'all';
  const sampleSize = opts.sampleSize ?? 24;
  const maxLines = opts.maxLines ?? 5040;

  const words = phrase
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  const n = words.length;

  if (n > 7 && mode === 'all') {
    throw new Error(
      `Phrase has ${n} words — ${n}! = ${factorial(n).toLocaleString()} permutations is too many. Use mode='sample' or shorten the phrase to 7 words or fewer.`,
    );
  }

  let permutations: string[][];

  if (mode === 'all') {
    permutations = heapPermutations(words);
    // Deduplicate (multiset permutations — some words may repeat)
    const seen = new Set<string>();
    permutations = permutations.filter((p) => {
      const key = p.join('\x00');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  } else {
    // mode='sample'
    if (n <= 7) {
      // Generate all, deduplicate, then sample
      let all = heapPermutations(words);
      const seen = new Set<string>();
      all = all.filter((p) => {
        const key = p.join('\x00');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      permutations = fisherYatesSample(all, sampleSize, rng);
    } else {
      // Large n: generate sampleSize independent shuffles
      const seen = new Set<string>();
      permutations = [];
      let attempts = 0;
      const maxAttempts = sampleSize * 10;
      while (permutations.length < sampleSize && attempts < maxAttempts) {
        const perm = fisherYatesSample(words, words.length, rng);
        const key = perm.join('\x00');
        if (!seen.has(key)) {
          seen.add(key);
          permutations.push(perm);
        }
        attempts++;
      }
    }
  }

  // Apply maxLines cap
  if (permutations.length > maxLines) {
    permutations = permutations.slice(0, maxLines);
  }

  const outputText = permutations.map((p) => p.join(' ')).join('\n');

  return {
    text: outputText,
    method: 'permutation',
    seed,
    inputHash: sha256hex(phrase),
    stats: {
      inputChars: phrase.length,
      outputChars: outputText.length,
      units: permutations.length,
      durationMs: Date.now() - t0,
    },
  };
}

function factorial(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}
