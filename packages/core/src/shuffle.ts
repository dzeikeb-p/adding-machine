import { makeRng, randomSeed } from './rng.js';
import { sha256hex } from './sha256.js';
import type { CutUpResult, ShuffleOptions } from './types.js';
import {
  tokenizeLines,
  tokenizeNgrams,
  tokenizePhrases,
  tokenizeSentences,
  tokenizeWords,
} from './utils.js';

function fisherYates<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}

export function shuffle(text: string, opts: ShuffleOptions = {}): CutUpResult {
  const t0 = Date.now();
  const seed = opts.seed ?? randomSeed();
  const rng = makeRng(seed);
  const unit = opts.unit ?? 'word';
  const preserveTerminals = opts.preserveTerminals ?? false;

  let chunks: string[];
  let separator: string;

  switch (unit) {
    case 'word':
      chunks = tokenizeWords(text);
      separator = ' ';
      break;
    case 'ngram':
      chunks = tokenizeNgrams(text, opts.ngramSize ?? 3);
      separator = ' ';
      break;
    case 'sentence':
      chunks = tokenizeSentences(text);
      separator = ' ';
      break;
    case 'line':
      chunks = tokenizeLines(text);
      separator = '\n';
      break;
    case 'phrase':
      chunks = tokenizePhrases(text);
      separator = ' ';
      break;
  }

  let result: string[];

  if (preserveTerminals && chunks.length > 0) {
    // Record which positions originally end a sentence (end with .!?)
    const terminals = new Set<number>();
    for (let i = 0; i < chunks.length; i++) {
      if (/[.!?]$/.test(chunks[i]!)) terminals.add(i);
    }
    const terminalChunks = [...terminals].map((i) => chunks[i]!);
    const nonTerminalChunks = chunks.filter((_, i) => !terminals.has(i));

    const shuffledNonTerminals = fisherYates(nonTerminalChunks, rng);
    const shuffledTerminals = fisherYates(terminalChunks, rng);

    result = new Array(chunks.length) as string[];
    let tIdx = 0;
    let ntIdx = 0;
    for (let i = 0; i < chunks.length; i++) {
      if (terminals.has(i)) {
        result[i] = shuffledTerminals[tIdx++]!;
      } else {
        result[i] = shuffledNonTerminals[ntIdx++]!;
      }
    }
  } else {
    result = fisherYates(chunks, rng);
  }

  const outputText = result.join(separator);

  return {
    text: outputText,
    method: 'shuffle',
    seed,
    inputHash: sha256hex(text),
    stats: {
      inputChars: text.length,
      outputChars: outputText.length,
      units: chunks.length,
      durationMs: Date.now() - t0,
    },
  };
}
