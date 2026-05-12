import { newRandomSeed } from '../api.js';
import type {
  FoldOptions,
  Method,
  PermutationOptions,
  QuadrantOptions,
  ShuffleOptions,
} from '../types.js';

interface Props {
  method: Method;
  seed: string;
  onSeedChange: (s: string) => void;
  quadrantOpts: QuadrantOptions;
  shuffleOpts: ShuffleOptions;
  foldOpts: FoldOptions;
  permutationOpts: PermutationOptions;
  onChange: (patch: object) => void;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
      <span className="label" style={{ minWidth: '90px' }}>
        {label}
      </span>
      {children}
    </div>
  );
}

export function OptionsPanel({
  method,
  seed,
  onSeedChange,
  quadrantOpts,
  shuffleOpts,
  foldOpts,
  permutationOpts,
  onChange,
}: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {/* Seed — always present */}
      <Row label="Seed">
        <input
          className="field-input"
          style={{ flex: 1, maxWidth: '240px' }}
          type="text"
          value={seed}
          onChange={(e) => onSeedChange(e.target.value)}
          placeholder="random"
          aria-label="PRNG seed"
          data-testid="seed-input"
        />
        <button
          className="ctrl-btn"
          onClick={() => onSeedChange(newRandomSeed())}
          title="Generate random seed"
          aria-label="Randomize seed"
        >
          &#x1F3B2; Randomize
        </button>
      </Row>

      {/* Method-specific options */}
      {method === 'quadrant' && (
        <Row label="Iterations">
          <input
            className="field-input"
            style={{ width: '60px' }}
            type="number"
            min={1}
            max={10}
            value={quadrantOpts.iterations ?? 1}
            onChange={(e) =>
              onChange({ iterations: Math.max(1, parseInt(e.target.value, 10) || 1) })
            }
            aria-label="Number of iterations"
          />
        </Row>
      )}

      {method === 'shuffle' && (
        <>
          <Row label="Unit">
            <select
              className="field-input"
              value={shuffleOpts.unit ?? 'word'}
              onChange={(e) => onChange({ unit: e.target.value })}
              aria-label="Shuffle unit"
              data-testid="shuffle-unit"
            >
              <option value="word">Word</option>
              <option value="phrase">Phrase</option>
              <option value="sentence">Sentence</option>
              <option value="line">Line</option>
              <option value="ngram">N-gram</option>
            </select>
          </Row>
          {shuffleOpts.unit === 'ngram' && (
            <Row label="N-gram size">
              <input
                className="field-input"
                style={{ width: '60px' }}
                type="number"
                min={2}
                max={10}
                value={shuffleOpts.ngramSize ?? 3}
                onChange={(e) =>
                  onChange({ ngramSize: Math.max(2, parseInt(e.target.value, 10) || 3) })
                }
                aria-label="N-gram size"
              />
            </Row>
          )}
          <Row label="Terminals">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={shuffleOpts.preserveTerminals ?? false}
                onChange={(e) => onChange({ preserveTerminals: e.target.checked })}
                aria-label="Preserve sentence-ending terminals"
              />
              <span className="label" style={{ fontWeight: 400 }}>
                Preserve terminals
              </span>
            </label>
          </Row>
        </>
      )}

      {method === 'fold' && (
        <>
          <Row label="Fold ratio">
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={foldOpts.foldRatio ?? 0.5}
              onChange={(e) => onChange({ foldRatio: parseFloat(e.target.value) })}
              style={{ flex: 1, maxWidth: '160px', accentColor: 'var(--color-ink)' }}
              aria-label="Fold ratio"
            />
            <span className="label" style={{ fontWeight: 400, minWidth: '2.5rem' }}>
              {((foldOpts.foldRatio ?? 0.5) * 100).toFixed(0)}%
            </span>
          </Row>
          <Row label="Axis">
            {(['vertical', 'horizontal'] as const).map((ax) => (
              <label
                key={ax}
                style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}
              >
                <input
                  type="radio"
                  name="fold-axis"
                  value={ax}
                  checked={(foldOpts.axis ?? 'vertical') === ax}
                  onChange={() => onChange({ axis: ax })}
                  aria-label={`Fold axis: ${ax}`}
                />
                <span className="label" style={{ fontWeight: 400 }}>
                  {ax}
                </span>
              </label>
            ))}
          </Row>
        </>
      )}

      {method === 'permutation' && (
        <>
          <Row label="Mode">
            {(['all', 'sample'] as const).map((m) => (
              <label
                key={m}
                style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}
              >
                <input
                  type="radio"
                  name="perm-mode"
                  value={m}
                  checked={(permutationOpts.mode ?? 'all') === m}
                  onChange={() => onChange({ mode: m })}
                  aria-label={`Permutation mode: ${m}`}
                />
                <span className="label" style={{ fontWeight: 400 }}>
                  {m === 'all' ? 'All' : 'Sample'}
                </span>
              </label>
            ))}
          </Row>
          {permutationOpts.mode === 'sample' && (
            <Row label="Sample size">
              <input
                className="field-input"
                style={{ width: '70px' }}
                type="number"
                min={1}
                max={1000}
                value={permutationOpts.sampleSize ?? 24}
                onChange={(e) =>
                  onChange({ sampleSize: Math.max(1, parseInt(e.target.value, 10) || 24) })
                }
                aria-label="Sample size"
              />
            </Row>
          )}
        </>
      )}
    </div>
  );
}
