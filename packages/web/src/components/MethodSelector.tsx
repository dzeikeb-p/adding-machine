import type { Method } from '../types.js';

const METHODS: { id: Method; label: string }[] = [
  { id: 'quadrant', label: 'Quadrant' },
  { id: 'shuffle', label: 'Shuffle' },
  { id: 'fold', label: 'Fold-In' },
  { id: 'permutation', label: 'Permutate' },
];

interface Props {
  method: Method;
  onChange: (m: Method) => void;
}

export function MethodSelector({ method, onChange }: Props) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '-1px' }}>
      {METHODS.map((m) => (
        <button
          key={m.id}
          className={`method-btn${method === m.id ? ' active' : ''}`}
          onClick={() => onChange(m.id)}
          aria-pressed={method === m.id}
          data-testid={`method-${m.id}`}
          style={{ marginRight: '-1px' }}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
