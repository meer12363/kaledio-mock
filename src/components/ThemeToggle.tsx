"use client";

import { useTheme } from "@/lib/theme";

/** Sun ↔ moon switch. `variant="row"` renders a full-width menu item instead of an icon button. */
export function ThemeToggle({ variant = "icon" }: { variant?: "icon" | "row" }) {
  const [theme, toggle] = useTheme();
  const dark = theme === "dark";

  if (variant === "row") {
    return (
      <button
        role="menuitemcheckbox"
        aria-checked={!dark}
        onClick={toggle}
        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-900/[0.04] hover:text-ink-900"
      >
        <span className="flex w-[17px] justify-center text-[15px]">{dark ? "☀️" : "🌙"}</span>
        {dark ? "Light mode" : "Dark mode"}
        <span
          className={`ml-auto flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${dark ? "bg-line-strong" : "bg-volt"}`}
        >
          <span
            className={`h-4 w-4 rounded-full bg-paper shadow-card transition-transform duration-300 ${dark ? "" : "translate-x-4"}`}
          />
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className="press group relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl text-ink-500 transition-colors hover:bg-ink-900/[0.05] hover:text-ink-900"
    >
      {/* sun */}
      <svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        aria-hidden="true"
        className={`absolute transition-all duration-500 ${dark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"}`}
      >
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" />
      </svg>
      {/* moon */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={`absolute transition-all duration-500 ${dark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"}`}
      >
        <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7Z" />
      </svg>
    </button>
  );
}
