import type { ApiResult, Method } from '../types.js';

interface Props {
  result: ApiResult;
  method: Method;
  lockSeed: boolean;
  onRunAgain: () => void;
  onToggleLock: () => void;
}

function copyText(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

function downloadText(text: string, method: string) {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `adding-machine-${method}-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export function OutputPane({ result, method, lockSeed, onRunAgain, onToggleLock }: Props) {
  return (
    <div>
      {/* Meta row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: '0.4rem',
        }}
      >
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'baseline' }}>
          <span className="label">Output</span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-accent)',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {result.method}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-rule)',
            }}
          >
            seed: {result.seed}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            className="ctrl-btn"
            onClick={() => copyText(result.text)}
            aria-label="Copy output to clipboard"
          >
            Copy
          </button>
          <button
            className="ctrl-btn"
            onClick={() => downloadText(result.text, method)}
            aria-label="Download output as text file"
          >
            Download
          </button>
        </div>
      </div>

      {/* Seam line for quadrant */}
      {method === 'quadrant' && <div className="seam" aria-hidden="true" />}

      {/* Output text */}
      <div
        className="paper-field"
        role="region"
        aria-live="polite"
        aria-label="Cut-up output"
        data-testid="output"
        style={{
          minHeight: '8rem',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          overflowY: 'auto',
          maxHeight: '400px',
          cursor: 'text',
        }}
      >
        {result.text}
      </div>

      {/* Stats */}
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-rule)',
          marginTop: '0.3rem',
        }}
      >
        {result.stats.units} units · {result.stats.outputChars} chars · {result.stats.durationMs}ms
      </div>

      {/* Action row */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
        <button className="ctrl-btn" onClick={onRunAgain} data-testid="run-again">
          Run Again
        </button>
        <button
          className={`ctrl-btn${lockSeed ? ' active' : ''}`}
          onClick={onToggleLock}
          aria-pressed={lockSeed}
          title={lockSeed ? 'Seed locked — click to unlock' : 'Click to lock current seed'}
        >
          {lockSeed ? '🔒 Seed locked' : '🔓 Lock seed'}
        </button>
      </div>
    </div>
  );
}
