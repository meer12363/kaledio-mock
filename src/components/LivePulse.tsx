"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LIVE_PULSES, type Pulse } from "@/lib/mock";
import { IconX } from "./icons";

const TONE: Record<Pulse["tone"], { ring: string; chip: string; cta: string }> = {
  brand: { ring: "border-brand-200", chip: "bg-brand-50", cta: "text-brand-700" },
  accent: { ring: "border-accent-200", chip: "bg-accent-50", cta: "text-accent-700" },
  pop: { ring: "border-pop-200", chip: "bg-pop-50", cta: "text-pop-700" },
  go: { ring: "border-go/30", chip: "bg-go-soft", cta: "text-go" },
};

const FIRST_DELAY = 4500;
const VISIBLE_MS = 5600;
const GAP_MS = 6500;

export function LivePulse() {
  const router = useRouter();
  const [pulse, setPulse] = useState<Pulse | null>(null);
  const [leaving, setLeaving] = useState(false);
  const idx = useRef(0);
  const paused = useRef(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    let stopped = false;
    idx.current = Math.floor(Math.random() * LIVE_PULSES.length);
    const clearAll = () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    };

    const hide = () => {
      setLeaving(true);
      timers.current.push(
        window.setTimeout(() => {
          if (stopped) return;
          setPulse(null);
          setLeaving(false);
          schedule(GAP_MS);
        }, 260)
      );
    };

    const show = () => {
      if (stopped) return;
      if (paused.current) {
        // if the user is hovering, wait and retry
        timers.current.push(window.setTimeout(show, 1500));
        return;
      }
      const next = LIVE_PULSES[idx.current % LIVE_PULSES.length];
      idx.current += 1;
      setLeaving(false);
      setPulse(next);
      timers.current.push(window.setTimeout(hide, VISIBLE_MS));
    };

    const schedule = (delay: number) => {
      timers.current.push(window.setTimeout(show, delay));
    };

    schedule(FIRST_DELAY);
    return () => {
      stopped = true;
      clearAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!pulse) return null;
  const t = TONE[pulse.tone];

  return (
    <div className="pointer-events-none fixed bottom-24 left-4 z-[150] w-[min(92vw,20rem)] md:bottom-6">
      <div
        onMouseEnter={() => (paused.current = true)}
        onMouseLeave={() => (paused.current = false)}
        className={`pointer-events-auto flex items-center gap-3 rounded-2xl border bg-paper/95 py-2.5 pl-2.5 pr-2 shadow-pop backdrop-blur ${t.ring}`}
        style={{ animation: `${leaving ? "toast-out" : "pop-in"} 0.32s cubic-bezier(0.34,1.56,0.64,1) both` }}
      >
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl ${t.chip}`} style={{ animation: "float-soft 3s ease-in-out infinite" }}>
          {pulse.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium leading-snug text-ink-800">{pulse.text}</p>
          <button
            onClick={() => {
              setLeaving(true);
              router.push(pulse.href);
            }}
            className={`mt-0.5 text-[12.5px] font-bold ${t.cta} hover:underline`}
          >
            {pulse.cta} →
          </button>
        </div>
        <button
          onClick={() => setLeaving(true)}
          aria-label="Dismiss"
          className="flex h-6 w-6 shrink-0 items-center justify-center self-start rounded-md text-ink-300 transition-colors hover:bg-canvas hover:text-ink-600"
        >
          <IconX size={12} />
        </button>
      </div>
      {/* live indicator */}
      <div className="mt-1.5 flex items-center gap-1.5 pl-2">
        <span className="h-1.5 w-1.5 rounded-full bg-go" style={{ animation: "pulse-dot 1.4s ease-in-out infinite" }} />
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">Live on Kaledio</span>
      </div>
    </div>
  );
}
