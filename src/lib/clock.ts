"use client";

import { useSyncExternalStore } from "react";

/**
 * Wall-clock time that is safe to render: pages here are prerendered, so the
 * server snapshot is null and the real time only appears after hydration.
 */
function subscribeEvery(ms: number) {
  return (cb: () => void) => {
    const id = window.setInterval(cb, ms);
    return () => window.clearInterval(id);
  };
}

const perSecond = subscribeEvery(1000);
const perMinute = subscribeEvery(60_000);

/** current time, ticking every second (null until mounted) */
export function useNow(): Date | null {
  const sec = useSyncExternalStore(perSecond, () => Math.floor(Date.now() / 1000), () => null);
  return sec === null ? null : new Date(sec * 1000);
}

/** start of today in local time, refreshed each minute (null until mounted) */
export function useToday(): Date | null {
  const day = useSyncExternalStore(
    perMinute,
    () => new Date().toDateString(),
    () => null
  );
  return day === null ? null : new Date(day);
}

/** whole days from `today` until an ISO date (YYYY-MM-DD), negative once passed */
export function daysUntil(iso: string, today: Date): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.round((new Date(y, m - 1, d).getTime() - today.getTime()) / 86_400_000);
}
