"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "jq.shortlist";

interface ShortlistValue {
  ids: string[];
  ready: boolean;
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  replace: (ids: string[]) => void;
  clear: () => void;
}

const ShortlistContext = createContext<ShortlistValue | null>(null);

export function ShortlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  // Hydration-safe: the server renders the empty state, the client fills it in.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setIds(JSON.parse(raw) as string[]);
    } catch {
      // corrupt or unavailable storage — start empty
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // quota or private mode — the shortlist just won't persist
    }
  }, [ids, ready]);

  const toggle = useCallback((id: string) => {
    setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const value = useMemo<ShortlistValue>(
    () => ({
      ids,
      ready,
      has: (id) => ids.includes(id),
      toggle,
      remove: (id) => setIds((prev) => prev.filter((x) => x !== id)),
      replace: setIds,
      clear: () => setIds([]),
    }),
    [ids, ready, toggle],
  );

  return <ShortlistContext.Provider value={value}>{children}</ShortlistContext.Provider>;
}

export function useShortlist(): ShortlistValue {
  const ctx = useContext(ShortlistContext);
  if (!ctx) throw new Error("useShortlist must be used inside ShortlistProvider");
  return ctx;
}
