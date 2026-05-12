import { describe, expect, it } from 'vitest';
import { createApp } from './app.js';

const app = createApp();

function post(path: string, body: unknown) {
  return app.request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ── Health ────────────────────────────────────────────────────────────────────

describe('GET /health', () => {
  it('returns ok', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.status).toBe('ok');
    expect(body).toHaveProperty('version');
    expect(body).toHaveProperty('commit');
  });
});

// ── Methods ───────────────────────────────────────────────────────────────────

describe('GET /v1/methods', () => {
  it('lists all four methods', async () => {
    const res = await app.request('/v1/methods');
    expect(res.status).toBe(200);
    const body = await res.json() as { methods: unknown[] };
    expect(body.methods).toHaveLength(4);
    const ids = (body.methods as Array<{ id: string }>).map((m) => m.id);
    expect(ids).toContain('quadrant');
    expect(ids).toContain('shuffle');
    expect(ids).toContain('fold');
    expect(ids).toContain('permutation');
  });
});

// ── Quadrant ──────────────────────────────────────────────────────────────────

describe('POST /v1/cutup/quadrant', () => {
  it('returns a valid CutUpResult', async () => {
    const res = await post('/v1/cutup/quadrant', {
      text: 'AAAABBBB\nCCCCDDDD\nEEEEFFFF\nGGGGHHHH',
      options: { seed: 'test' },
    });
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.method).toBe('quadrant');
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('text');
    expect(body).toHaveProperty('seed');
    expect(body).toHaveProperty('inputHash');
    expect(body).toHaveProperty('stats');
  });

  it('returns 413 when text exceeds 100 KB', async () => {
    const res = await post('/v1/cutup/quadrant', { text: 'x'.repeat(102401) });
    expect(res.status).toBe(413);
  });

  it('returns 422 when body is missing text', async () => {
    const res = await post('/v1/cutup/quadrant', {});
    expect(res.status).toBe(422);
  });
});

// ── Shuffle ───────────────────────────────────────────────────────────────────

describe('POST /v1/cutup/shuffle', () => {
  it('returns a valid CutUpResult', async () => {
    const res = await post('/v1/cutup/shuffle', {
      text: 'Take a page cut down the middle and across the middle',
      options: { seed: 'test', unit: 'word' },
    });
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.method).toBe('shuffle');
    expect(body).toHaveProperty('id');
  });

  it('accepts all unit types', async () => {
    for (const unit of ['word', 'sentence', 'line', 'ngram', 'phrase'] as const) {
      const res = await post('/v1/cutup/shuffle', {
        text: 'one two three. four five six. seven eight nine.',
        options: { unit },
      });
      expect(res.status).toBe(200);
    }
  });
});

// ── Fold ──────────────────────────────────────────────────────────────────────

describe('POST /v1/cutup/fold', () => {
  it('returns a valid CutUpResult', async () => {
    const res = await post('/v1/cutup/fold', {
      text: 'AAAABBBB\nCCCCDDDD',
      textB: 'EEEEFFFF\nGGGGHHHH',
      options: { foldRatio: 0.5 },
    });
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.method).toBe('fold');
    expect(body).toHaveProperty('id');
  });

  it('returns 422 when textB is missing', async () => {
    const res = await post('/v1/cutup/fold', { text: 'hello world' });
    expect(res.status).toBe(422);
  });
});

// ── Permutate ─────────────────────────────────────────────────────────────────

describe('POST /v1/cutup/permutate', () => {
  it('returns all 30 permutations of "I AM THAT I AM"', async () => {
    const res = await post('/v1/cutup/permutate', {
      text: 'I AM THAT I AM',
      options: { mode: 'all' },
    });
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.method).toBe('permutation');
    const lines = (body.text as string).split('\n');
    expect(lines).toHaveLength(30);
  });

  it('returns 400 when phrase is too long for mode=all', async () => {
    const res = await post('/v1/cutup/permutate', {
      text: 'one two three four five six seven eight',
      options: { mode: 'all' },
    });
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/too many|mode='sample'/i);
  });

  it('mode=sample returns sampleSize results', async () => {
    const res = await post('/v1/cutup/permutate', {
      text: 'one two three four five six seven eight',
      options: { mode: 'sample', sampleSize: 5, seed: 'test' },
    });
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect((body.text as string).split('\n')).toHaveLength(5);
  });
});

// ── Unified endpoint ──────────────────────────────────────────────────────────

describe('POST /v1/cutup', () => {
  it('dispatches to shuffle', async () => {
    const res = await post('/v1/cutup', {
      method: 'shuffle',
      text: 'the quick brown fox jumps over the lazy dog',
    });
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.method).toBe('shuffle');
  });

  it('dispatches to fold with textB', async () => {
    const res = await post('/v1/cutup', {
      method: 'fold',
      text: 'line one\nline two',
      textB: 'alpha\nbeta',
    });
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.method).toBe('fold');
  });

  it('returns 422 for unknown method', async () => {
    const res = await post('/v1/cutup', { method: 'unknown', text: 'hello' });
    expect(res.status).toBe(422);
  });
});

// ── OpenAPI ───────────────────────────────────────────────────────────────────

describe('GET /openapi.json', () => {
  it('returns a valid OpenAPI 3.0 document', async () => {
    const res = await app.request('/openapi.json');
    expect(res.status).toBe(200);
    const doc = await res.json() as Record<string, unknown>;
    expect(doc.openapi).toBe('3.0.0');
    expect(doc).toHaveProperty('info');
    expect(doc).toHaveProperty('paths');
  });
});

describe('GET /docs', () => {
  it('returns an HTML page', async () => {
    const res = await app.request('/docs');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/html/);
  });
});
