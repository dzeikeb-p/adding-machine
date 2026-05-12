export type CutUpMethod = 'quadrant' | 'shuffle' | 'fold' | 'permutation';

export interface CutUpOptions {
  seed?: string;
}

export interface QuadrantOptions extends CutUpOptions {
  iterations?: number;
}

export interface ShuffleOptions extends CutUpOptions {
  unit?: 'word' | 'phrase' | 'sentence' | 'line' | 'ngram';
  ngramSize?: number;
  preserveTerminals?: boolean;
}

export interface FoldOptions extends CutUpOptions {
  foldRatio?: number;
  axis?: 'vertical' | 'horizontal';
}

export interface PermutationOptions extends CutUpOptions {
  maxLines?: number;
  mode?: 'all' | 'sample';
  sampleSize?: number;
}

export interface CutUpResult {
  text: string;
  method: CutUpMethod;
  seed: string;
  inputHash: string;
  stats: {
    inputChars: number;
    outputChars: number;
    units: number;
    durationMs: number;
  };
}
