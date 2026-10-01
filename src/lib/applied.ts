"use client";

import { useSyncExternalStore } from "react";

/**
 * Which calls this browser has applied to (and whether a self tape went with
 * it). Kept in localStorage so the board, the call sheet and My Work agree
 * across reloads until applications for mock calls hit the backend.
 */
const KEY = "kaledio.applications.v1";
const EVENT = "kaledio:applications";

export interface LocalApplication {
  at: number;
  tapeSeconds?: number;
}

type Store = Record<string, LocalApplication>;

let cache: Store | null = null;
let raw: string | null = null;

function read(): Store {
  try {
    const next = localStorage.getItem(KEY);
    if (next !== raw || !cache) {
      raw = next;
      cache = next ? (JSON.parse(next) as Store) : {};
    }
  } catch {
    cache = cache ?? {};
  }
  return cache;
}

const EMPTY: Store = {};

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function useApplications(): Store {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function recordApplication(callId: string, app: Omit<LocalApplication, "at"> = {}) {
  const next = { ...read(), [callId]: { at: Date.now(), ...app } };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode: still update this tab */
    cache = next;
  }
  window.dispatchEvent(new Event(EVENT));
}
