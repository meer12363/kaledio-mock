"use client";

import { useRouter } from "next/navigation";
import { MOCK_SPOTLIGHTS, type Spotlight } from "@/lib/mock";
import type { MediaTone } from "@/lib/types";
import { IconPlus } from "./icons";

const TONE_BG: Record<MediaTone, string> = {
  midnight: "linear-gradient(160deg,#0b1b2b,#123b63)",
  steel: "linear-gradient(160deg,#2e3d4c,#5b7186)",
  sky: "linear-gradient(160deg,#0b66c3,#6fa9e0)",
  noir: "linear-gradient(160deg,#14181d,#2b333d)",
  porcelain: "linear-gradient(160deg,#8fa6bd,#c7d4e1)",
  dusk: "linear-gradient(160deg,#1d2947,#46588f)",
};

const BADGE_STYLE: Record<string, string> = {
  LIVE: "bg-danger text-white",
  HOT: "[background:var(--grad-spotlight)] text-white",
  NEW: "bg-go text-white",
};

function hrefFor(s: Spotlight): string {
  if (s.kind === "creator") return "/search";
  if (s.kind === "call") return "/casting";
  return "/home";
}

export function SpotlightRail() {
  const router = useRouter();
  return (
    <div className="anim-rise">
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">Spotlight</p>
        <span className="text-[11px] font-medium text-ink-400">Swipe →</span>
      </div>
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* add-your-own */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("kaledio:open-create"))}
          className="press group relative flex h-40 w-28 shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line-strong bg-paper text-ink-500 transition-colors hover:border-brand-300 hover:text-brand-600"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600 transition-transform group-hover:scale-110">
            <IconPlus size={20} />
          </span>
          <span className="text-[12px] font-semibold">Add yours</span>
        </button>

        {MOCK_SPOTLIGHTS.map((s) => (
          <button
            key={s.id}
            onClick={() => router.push(hrefFor(s))}
            className="press group relative h-40 w-28 shrink-0 overflow-hidden rounded-2xl text-left shadow-card transition-transform duration-200 hover:-translate-y-1"
            style={{ background: TONE_BG[s.tone] }}
          >
            {/* live/hot ring */}
            {s.badge && (
              <span
                className={`absolute left-2 top-2 z-10 rounded-full px-1.5 py-0.5 text-[9px] font-extrabold tracking-wide ${
                  BADGE_STYLE[s.badge] ?? "bg-white/90 text-ink-900"
                }`}
                style={s.badge === "LIVE" ? { animation: "pulse-dot 1.4s ease-in-out infinite" } : undefined}
              >
                {s.badge}
              </span>
            )}
            <div className="absolute inset-0 opacity-40 [background:var(--grad-mesh)]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-2.5">
              <p className="text-[13px] font-bold leading-tight text-white">{s.title}</p>
              <p className="mt-0.5 text-[11px] font-medium text-white/75">{s.sub}</p>
            </div>
            {/* sheen sweep on hover */}
            <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="absolute -inset-y-2 -left-1/3 w-1/3 rotate-12 bg-white/20 blur-md" style={{ animation: "sweep 0.9s ease" }} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
