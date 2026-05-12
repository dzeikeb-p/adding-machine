const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';

export function ApiDocs() {
  const docsUrl = `${BASE}/docs`;

  return (
    <div style={{ height: 'calc(100vh - 50px)', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          padding: '0.5rem 1.5rem',
          borderBottom: '1px solid var(--color-ink)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <span className="label">API Reference</span>
        <a
          href={docsUrl}
          target="_blank"
          rel="noreferrer"
          className="ctrl-btn"
          style={{ textDecoration: 'none', fontSize: 'var(--text-xs)' }}
        >
          Open in new tab
        </a>
      </div>
      <iframe
        src={docsUrl}
        title="Adding Machine API Reference"
        style={{ flex: 1, border: 'none', width: '100%' }}
        aria-label="API documentation"
      />
    </div>
  );
}
