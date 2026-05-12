export type Method = 'quadrant' | 'shuffle' | 'fold' | 'permutation';

export interface ApiResult {
  id: string;
  text: string;
  method: Method;
  seed: string;
  inputHash: string;
  stats: {
    inputChars: number;
    outputChars: number;
    units: number;
    durationMs: number;
  };
}

export interface HistoryEntry {
  id: string;
  method: Method;
  inputText: string;
  outputText: string;
  seed: string;
  timestamp: number;
}

export interface QuadrantOptions {
  iterations?: number;
}

export interface ShuffleOptions {
  unit?: 'word' | 'phrase' | 'sentence' | 'line' | 'ngram';
  ngramSize?: number;
  preserveTerminals?: boolean;
}

export interface FoldOptions {
  foldRatio?: number;
  axis?: 'vertical' | 'horizontal';
}

export interface PermutationOptions {
  mode?: 'all' | 'sample';
  sampleSize?: number;
  maxLines?: number;
}

export type MethodOptions = QuadrantOptions | ShuffleOptions | FoldOptions | PermutationOptions;
