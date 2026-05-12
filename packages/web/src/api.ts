import type { ApiResult, FoldOptions, Method, MethodOptions } from './types.js';

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';

export interface CutUpRequest {
  method: Method;
  text: string;
  textB?: string;
  options?: MethodOptions & { seed?: string };
}

export async function runCutup(req: CutUpRequest): Promise<ApiResult> {
  const res = await fetch(`${BASE}/v1/cutup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const err = (await res.json()) as { error?: string };
      if (err.error) message = err.error;
    } catch {
      // ignore parse error, use default message
    }
    throw new Error(message);
  }

  return res.json() as Promise<ApiResult>;
}

export function isFoldOptions(opts: MethodOptions): opts is FoldOptions {
  return 'foldRatio' in opts || 'axis' in opts;
}

export function newRandomSeed(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
