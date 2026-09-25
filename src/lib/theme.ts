"use client";

import { useSyncExternalStore } from "react";
import { THEME_KEY } from "./theme-script";

export type Theme = "dark" | "light";

const EVENT = "kaledio:theme";

function read(): Theme {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

export function applyTheme(next: Theme) {
  const root = document.documentElement;
  // brief cross-fade so the switch feels smooth rather than a hard cut
  root.classList.add("theme-switching");
  root.setAttribute("data-theme", next);
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    /* storage unavailable — theme still applies for this session */
  }
  window.dispatchEvent(new CustomEvent(EVENT));
  window.setTimeout(() => root.classList.remove("theme-switching"), 400);
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function useTheme(): [Theme, () => void] {
  const theme = useSyncExternalStore<Theme>(subscribe, read, () => "dark");
  return [theme, () => applyTheme(theme === "dark" ? "light" : "dark")];
}
