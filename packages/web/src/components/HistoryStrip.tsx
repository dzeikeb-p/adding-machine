import type { HistoryEntry } from '../types.js';

const METHOD_ICON: Record<string, string> = {
  quadrant: 'Q',
  shuffle: 'S',
  fold: 'F',
  permutation: 'P',
};

interface Props {
  history: HistoryEntry[];
  onRecall: (entry: HistoryEntry) => void;
  onClear: () => void;
}

export function HistoryStrip({ history, onRecall, onClear }: Props) {
  if (history.length === 0) return null;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: '0.5rem',
        }}
      >
        <span className="label">History</span>
        <button className="ctrl-btn" onClick={onClear} aria-label="Clear history">
          Clear
        </button>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {history.map((entry) => (
          <button
            key={entry.id}
            className="history-card"
            onClick={() => onRecall(entry)}
            title={`Recall: ${entry.method} — ${entry.outputText.slice(0, 80)}`}
            aria-label={`Recall ${entry.method} run from ${new Date(entry.timestamp).toLocaleTimeString()}`}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                color: 'var(--color-accent)',
                letterSpacing: '0.08em',
                marginBottom: '0.2rem',
              }}
            >
              {METHOD_ICON[entry.method]} {entry.method.toUpperCase()}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-ink)',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                lineHeight: 1.4,
              }}
            >
              {entry.outputText.split('\n')[0]}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
