// SHA-256 hashes are exactly 64 lowercase hex characters.
const HASH_RE = /^[0-9a-f]{64}$/;

export function isHash(value: string): boolean {
  return HASH_RE.test(value);
}

// Resolve a value: if it's a hash and TEXT_STORE is available, look up the stored text.
// Returns the original text if not a hash, the stored text if found, or null if hash not found.
export async function resolveText(
  value: string,
  store: KVNamespace | undefined,
): Promise<{ text: string; wasHash: boolean } | null> {
  if (!isHash(value)) return { text: value, wasHash: false };
  if (!store) return null;
  const stored = await store.get(`text:${value}`);
  if (!stored) return null;
  return { text: stored, wasHash: true };
}

// Store a text in KV keyed by its SHA-256 hash.
export async function storeText(
  hash: string,
  text: string,
  store: KVNamespace | undefined,
): Promise<void> {
  if (!store) return;
  await store.put(`text:${hash}`, text);
}
