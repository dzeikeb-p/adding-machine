import { useCallback, useRef, useState } from 'react';

const HASH_RE = /^[0-9a-f]{64}$/;

interface Props {
  text: string;
  onChange: (t: string) => void;
  showTextB: boolean;
  textB: string;
  onChangeB: (t: string) => void;
}

function useFileDrop(onText: (t: string) => void) {
  const [dragging, setDragging] = useState(false);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setDragging(false), []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && (file.type === 'text/plain' || file.name.endsWith('.md'))) {
        file.text().then(onText).catch(() => {});
      }
    },
    [onText],
  );

  return { dragging, onDragOver, onDragLeave, onDrop };
}

export function InputPane({ text, onChange, showTextB, textB, onChangeB }: Props) {
  const dropA = useFileDrop(onChange);
  const dropB = useFileDrop(onChangeB);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.1rem' }}>
        <label className="label" htmlFor="input-a">
          Input — drop a .txt or .md file, or type below
        </label>
        {HASH_RE.test(text.trim()) && (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-accent)',
              fontWeight: 700,
              letterSpacing: '0.06em',
            }}
          >
            ↳ stored text
          </span>
        )}
      </div>
      <div
        onDragOver={dropA.onDragOver}
        onDragLeave={dropA.onDragLeave}
        onDrop={dropA.onDrop}
        className={dropA.dragging ? 'drop-active' : ''}
      >
        <textarea
          id="input-a"
          ref={textareaRef}
          className="paper-field"
          rows={8}
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste or type the text to cut up..."
          data-testid="input"
          aria-label="Input text"
          spellCheck={false}
        />
      </div>

      {showTextB && (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.1rem' }}>
            <label className="label" htmlFor="input-b">
              Source B (fold-in)
            </label>
            {HASH_RE.test(textB.trim()) && (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-accent)',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                }}
              >
                ↳ stored text
              </span>
            )}
          </div>
          <div
            onDragOver={dropB.onDragOver}
            onDragLeave={dropB.onDragLeave}
            onDrop={dropB.onDrop}
            className={dropB.dragging ? 'drop-active' : ''}
          >
            <textarea
              id="input-b"
              className="paper-field"
              rows={5}
              value={textB}
              onChange={(e) => onChangeB(e.target.value)}
              placeholder="Second source text to fold in..."
              data-testid="input-b"
              aria-label="Second source text for fold-in"
              spellCheck={false}
            />
          </div>
        </>
      )}
    </div>
  );
}
