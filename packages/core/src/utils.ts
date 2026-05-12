export function tokenizeWords(text: string): string[] {
  return text.split(/\s+/).filter((w) => w.length > 0);
}

export function tokenizeSentences(text: string): string[] {
  // Split on sentence-ending punctuation followed by whitespace or end of string
  const parts = text.split(/(?<=[.!?])\s+/);
  return parts.filter((s) => s.length > 0);
}

export function tokenizeLines(text: string): string[] {
  return text.split('\n');
}

export function tokenizeNgrams(text: string, n: number): string[] {
  const words = tokenizeWords(text);
  if (words.length === 0) return [];
  const grams: string[] = [];
  for (let i = 0; i < words.length; i += n) {
    grams.push(words.slice(i, i + n).join(' '));
  }
  return grams;
}

// Split text into "phrases" on clause boundaries (, ; : —)
export function tokenizePhrases(text: string): string[] {
  const parts = text.split(/(?<=[,;:—])\s+/);
  return parts.filter((p) => p.length > 0);
}

// Pad all lines to the same width with trailing spaces
export function padLines(lines: string[], width?: number): string[] {
  const w = width ?? Math.max(0, ...lines.map((l) => l.length));
  return lines.map((l) => l.padEnd(w, ' '));
}
