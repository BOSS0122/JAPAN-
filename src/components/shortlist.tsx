"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const STORAGE_KEY = "jq.shortlist";

interface State {
  ids: string[];
  /** False until localStorage has been read, so SSR and first paint agree. */
  ready: boolean;
}

const SERVER_STATE: State = { ids: [], ready: false };

let state: State = SERVER_STATE;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function parse(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function hydrate() {
  if (state.ready) return;
  try {
    state = { ids: parse(localStorage.getItem(STORAGE_KEY)), ready: true };
  } catch {
    // private mode or blocked storage — carry on with an empty shortlist
    state = { ids: [], ready: true };
  }
}

function write(ids: string[]) {
  state = { ids, ready: true };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // quota or private mode — the shortlist just won't persist
  }
  emit();
}

function subscribe(listener: () => void): () => void {
  hydrate();
  listeners.add(listener);

  // Keep sibling tabs in sync.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    state = { ids: parse(event.newValue), ready: true };
    emit();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): State {
  return state;
}

function getServerSnapshot(): State {
  return SERVER_STATE;
}

export function useShortlist() {
  const { ids, ready } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback((id: string) => {
    write(
      state.ids.includes(id) ? state.ids.filter((x) => x !== id) : [...state.ids, id],
    );
  }, []);

  const remove = useCallback((id: string) => {
    write(state.ids.filter((x) => x !== id));
  }, []);

  return useMemo(
    () => ({
      ids,
      ready,
      has: (id: string) => ids.includes(id),
      toggle,
      remove,
      clear: () => write([]),
    }),
    [ids, ready, toggle, remove],
  );
}
