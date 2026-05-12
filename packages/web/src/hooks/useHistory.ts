import { useCallback, useEffect, useState } from 'react';
import type { HistoryEntry } from '../types.js';

const KEY = 'adding-machine-history';
const MAX = 10;

function load(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function save(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    // localStorage may be unavailable (private browsing, storage full)
  }
}

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>(load);

  useEffect(() => {
    save(history);
  }, [history]);

  const addEntry = useCallback((entry: HistoryEntry) => {
    setHistory((prev) => [entry, ...prev.filter((e) => e.id !== entry.id)].slice(0, MAX));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return { history, addEntry, clearHistory };
}
