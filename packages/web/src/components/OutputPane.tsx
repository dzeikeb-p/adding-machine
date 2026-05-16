import { useState } from 'react';
import type { ApiResult, Method } from '../types.js';

interface Props {
  result: ApiResult;
  method: Method;
  lockSeed: boolean;
  onRunAgain: () => void;
  onToggleLock: () => void;
}

function copyText(text: string, onCopied?: () => void) {
  navigator.clipboard.writeText(text).then(() => onCopied?.()).catch(() => {});
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

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="ctrl-btn"
      onClick={() => copyText(text, () => { setCopied(true); setTimeout(() => setCopied(false), 1500); })}
      aria-label={label}
    >
      {copied ? 'Copied!' : label}
    </button>
  );
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
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
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
          <CopyButton text={result.text} label="Copy" />
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

      {/* Share reference */}
      <div
        style={{
          marginTop: '0.75rem',
          padding: '0.6rem 0.75rem',
          border: '1px solid var(--color-rule)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem',
        }}
      >
        <span className="label" style={{ color: 'var(--color-rule)' }}>
          Reproduce this cut-up
        </span>

        {/* Single hash (all methods except fold) */}
        {!result.inputHashB && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-ink)', wordBreak: 'break-all', flex: 1 }}>
              {result.inputHash}
            </span>
            <CopyButton text={result.inputHash} label="Copy hash" />
          </div>
        )}

        {/* Two hashes for fold-in */}
        {result.inputHashB && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="label" style={{ fontWeight: 400, minWidth: '60px' }}>Input A</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-ink)', wordBreak: 'break-all', flex: 1 }}>
                {result.inputHash}
              </span>
              <CopyButton text={result.inputHash} label="Copy" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="label" style={{ fontWeight: 400, minWidth: '60px' }}>Input B</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-ink)', wordBreak: 'break-all', flex: 1 }}>
                {result.inputHashB}
              </span>
              <CopyButton text={result.inputHashB} label="Copy" />
            </div>
          </>
        )}

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-rule)' }}>
          {result.inputHashB
            ? <>Paste hash A into Input, hash B into Source B, use seed <strong style={{ color: 'var(--color-ink)' }}>{result.seed}</strong> — identical result on any device.</>
            : <>Paste this hash as the input + use seed <strong style={{ color: 'var(--color-ink)' }}>{result.seed}</strong> — identical result on any device.</>
          }
        </div>
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
