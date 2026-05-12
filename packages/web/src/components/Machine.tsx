import { useRef, useState } from 'react';
import { useMachine } from '../hooks/useMachine.js';
import { HistoryStrip } from './HistoryStrip.js';
import { InputPane } from './InputPane.js';
import { MethodSelector } from './MethodSelector.js';
import { OptionsPanel } from './OptionsPanel.js';
import { OutputPane } from './OutputPane.js';

const SECTION: React.CSSProperties = {
  padding: '1.25rem 0',
  borderBottom: '1px solid var(--color-ink)',
};

export function Machine() {
  const {
    state,
    history,
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
  } = useMachine();

  const [cutting, setCutting] = useState(false);
  const leverRef = useRef<HTMLButtonElement>(null);

  function handleCut() {
    if (state.loading || !state.inputText.trim()) return;
    setCutting(true);
    setTimeout(() => setCutting(false), 300);
    run();
  }

  const isPermutation = state.method === 'permutation';
  const leverLabel = state.loading
    ? 'Working...'
    : isPermutation
      ? 'Permutate'
      : 'Cut It Up';

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 1.5rem 4rem' }}>
      {/* Method selector */}
      <div style={{ ...SECTION, borderTop: 'none', paddingTop: '1.5rem' }}>
        <div style={{ marginBottom: '0.75rem' }}>
          <span className="label">Method</span>
        </div>
        <MethodSelector method={state.method} onChange={setMethod} />
      </div>

      {/* Input pane */}
      <div style={SECTION}>
        <InputPane
          text={state.inputText}
          onChange={setInputText}
          showTextB={state.method === 'fold'}
          textB={state.inputTextB}
          onChangeB={setInputTextB}
        />
      </div>

      {/* Options */}
      <div style={SECTION}>
        <div style={{ marginBottom: '0.75rem' }}>
          <span className="label">Options</span>
        </div>
        <OptionsPanel
          method={state.method}
          seed={state.seed}
          onSeedChange={setSeed}
          quadrantOpts={state.options.quadrant}
          shuffleOpts={state.options.shuffle}
          foldOpts={state.options.fold}
          permutationOpts={state.options.permutation}
          onChange={setMethodOptions}
        />
      </div>

      {/* The lever */}
      <div style={{ ...SECTION, borderBottom: 'none' }}>
        <button
          ref={leverRef}
          className={`lever-btn${cutting ? ' cutting' : ''}`}
          onClick={handleCut}
          disabled={state.loading || !state.inputText.trim()}
          data-testid="cut-button"
          aria-label={leverLabel}
          title="⌘/Ctrl+Enter"
        >
          {leverLabel}
        </button>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-rule)',
            marginTop: '0.3rem',
            textAlign: 'right',
          }}
        >
          ⌘ / Ctrl + Enter
        </div>
      </div>

      {/* Error */}
      {state.error && (
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-accent)',
            padding: '0.75rem',
            border: '1px solid var(--color-accent)',
            marginTop: '1rem',
          }}
          role="alert"
        >
          {state.error}
        </div>
      )}

      {/* Output pane */}
      {state.result && !state.error && (
        <div style={{ ...SECTION, borderTop: '1px solid var(--color-ink)', paddingTop: '1.25rem' }}>
          <OutputPane
            result={state.result}
            method={state.method}
            lockSeed={state.lockSeed}
            onRunAgain={runAgain}
            onToggleLock={toggleLockSeed}
          />
        </div>
      )}

      {/* History strip */}
      {history.length > 0 && (
        <div style={{ paddingTop: '1.5rem' }}>
          <hr className="rule" style={{ marginBottom: '1rem' }} />
          <HistoryStrip history={history} onRecall={recallEntry} onClear={clearHistory} />
        </div>
      )}
    </div>
  );
}
