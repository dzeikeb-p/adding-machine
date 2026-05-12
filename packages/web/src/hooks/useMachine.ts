import { useCallback, useEffect, useRef, useState } from 'react';
import { newRandomSeed, runCutup } from '../api.js';
import type {
  ApiResult,
  FoldOptions,
  Method,
  PermutationOptions,
  QuadrantOptions,
  ShuffleOptions,
} from '../types.js';
import { useHistory } from './useHistory.js';

interface PerMethodOptions {
  quadrant: QuadrantOptions;
  shuffle: ShuffleOptions;
  fold: FoldOptions;
  permutation: PermutationOptions;
}

interface MachineState {
  method: Method;
  inputText: string;
  inputTextB: string;
  seed: string;
  lockSeed: boolean;
  options: PerMethodOptions;
  result: ApiResult | null;
  loading: boolean;
  error: string | null;
}

const DEFAULT_OPTIONS: PerMethodOptions = {
  quadrant: { iterations: 1 },
  shuffle: { unit: 'word', preserveTerminals: false },
  fold: { foldRatio: 0.5, axis: 'vertical' },
  permutation: { mode: 'all', sampleSize: 24 },
};

const INITIAL: MachineState = {
  method: 'shuffle',
  inputText: '',
  inputTextB: '',
  seed: '',
  lockSeed: false,
  options: DEFAULT_OPTIONS,
  result: null,
  loading: false,
  error: null,
};

export function useMachine() {
  const [state, setState] = useState<MachineState>(INITIAL);
  const { history, addEntry, clearHistory } = useHistory();
  const leverRef = useRef<HTMLButtonElement | null>(null);

  const setMethod = useCallback((method: Method) => {
    setState((s) => ({ ...s, method, result: null, error: null }));
  }, []);

  const setInputText = useCallback((inputText: string) => {
    setState((s) => ({ ...s, inputText }));
  }, []);

  const setInputTextB = useCallback((inputTextB: string) => {
    setState((s) => ({ ...s, inputTextB }));
  }, []);

  const setSeed = useCallback((seed: string) => {
    setState((s) => ({ ...s, seed }));
  }, []);

  const toggleLockSeed = useCallback(() => {
    setState((s) => ({ ...s, lockSeed: !s.lockSeed }));
  }, []);

  const setMethodOptions = useCallback(
    (patch: Partial<PerMethodOptions[Method]>) => {
      setState((s) => ({
        ...s,
        options: {
          ...s.options,
          [s.method]: { ...s.options[s.method], ...patch },
        },
      }));
    },
    [],
  );

  const execute = useCallback(
    async (overrideSeed?: string) => {
      setState((s) => {
        if (!s.inputText.trim()) return s;
        return { ...s, loading: true, error: null };
      });

      setState((s) => {
        if (!s.inputText.trim()) return s;

        const seed = overrideSeed ?? (s.seed.trim() || undefined);
        const opts = { ...s.options[s.method], seed };

        const req =
          s.method === 'fold'
            ? { method: s.method, text: s.inputText, textB: s.inputTextB, options: opts }
            : { method: s.method, text: s.inputText, options: opts };

        runCutup(req)
          .then((result) => {
            addEntry({
              id: result.id,
              method: s.method,
              inputText: s.inputText,
              outputText: result.text,
              seed: result.seed,
              timestamp: Date.now(),
            });
            setState((prev) => ({
              ...prev,
              result,
              loading: false,
              seed: prev.lockSeed ? prev.seed : result.seed,
            }));
          })
          .catch((err: unknown) => {
            const msg = err instanceof Error ? err.message : 'An error occurred';
            setState((prev) => ({ ...prev, loading: false, error: msg }));
          });

        return s;
      });
    },
    [addEntry],
  );

  const run = useCallback(() => execute(), [execute]);

  const runAgain = useCallback(() => {
    const nextSeed = state.lockSeed ? state.seed : newRandomSeed();
    execute(nextSeed);
  }, [execute, state.lockSeed, state.seed]);

  const recallEntry = useCallback((entry: (typeof history)[number]) => {
    setState((s) => ({
      ...s,
      method: entry.method,
      inputText: entry.inputText,
      seed: entry.seed,
      lockSeed: true,
      result: {
        id: entry.id,
        text: entry.outputText,
        method: entry.method,
        seed: entry.seed,
        inputHash: '',
        stats: { inputChars: 0, outputChars: 0, units: 0, durationMs: 0 },
      },
      error: null,
    }));
  }, []);

  // Keyboard shortcut: Cmd/Ctrl+Enter to run
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        run();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [run]);

  return {
    state,
    history,
    leverRef,
    setMethod,
    setInputText,
    setInputTextB,
    setSeed,
    toggleLockSeed,
    setMethodOptions,
    run,
    runAgain,
    recallEntry,
    clearHistory,
  };
}
