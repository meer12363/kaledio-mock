"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useNow } from "@/lib/clock";
import { useToast } from "./Toast";

/**
 * Call time: new roles go live once a day at 7 PM instead of trickling in,
 * so there's one moment worth coming back for. Counts down before the drop,
 * goes live for three hours, then counts down to tomorrow.
 */

const DROP_HOUR = 19;
const LIVE_HOURS = 3;
const REMIND_KEY = "kaledio.calltime.remind";
const REMIND_EVENT = "kaledio:calltime";

function subscribeRemind(cb: () => void) {
  window.addEventListener(REMIND_EVENT, cb);
  return () => window.removeEventListener(REMIND_EVENT, cb);
}
function readRemind() {
  try {
    return localStorage.getItem(REMIND_KEY) === "1";
  } catch {
    return false;
  }
}

/** what tonight's drop holds; the real version comes from calls scheduled for 7 PM */
const SPLIT = [
  { label: "Lead", n: 2 },
  { label: "Supporting", n: 5 },
  { label: "Crew", n: 3 },
  { label: "Voice", n: 1 },
];
const TONIGHT = { city: "Mumbai", roles: SPLIT.reduce((n, s) => n + s.n, 0), split: SPLIT };

const pad = (n: number) => String(n).padStart(2, "0");

function Digits({ value, label }: { value: string; label: string }) {
  return (
    <span className="flex flex-col items-center">
      <span className="flex gap-0.5">
        {value.split("").map((d, i) => (
          <span key={i} className="flex h-11 w-8 items-center justify-center rounded-md bg-white/10 font-mono text-[26px] font-bold tabular-nums text-white ring-1 ring-white/10 sm:h-12 sm:w-9 sm:text-[28px]">
            {d}
          </span>
        ))}
      </span>
      <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-white/45">{label}</span>
    </span>
  );
}

export function CallTime() {
  const now = useNow();
  const { toast } = useToast();
  const remind = useSyncExternalStore(subscribeRemind, readRemind, () => false);

  const toggleRemind = () => {
    try {
      localStorage.setItem(REMIND_KEY, remind ? "0" : "1");
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(REMIND_EVENT));
    toast(remind ? "Reminder off" : "Done. We'll nudge you at 6:55", "success");
  };

  // before hydration: same box, no numbers, so nothing jumps
  if (!now) return <div className="h-[168px] rounded-2xl bg-black" aria-hidden="true" />;

  const drop = new Date(now);
  drop.setHours(DROP_HOUR, 0, 0, 0);
  const liveUntil = new Date(drop.getTime() + LIVE_HOURS * 3_600_000);
  const live = now >= drop && now < liveUntil;
  const next = now < drop ? drop : new Date(drop.getTime() + 86_400_000);
  const left = Math.max(0, Math.floor((next.getTime() - now.getTime()) / 1000));
  const hh = pad(Math.floor(left / 3600));
  const mm = pad(Math.floor((left % 3600) / 60));
  const ss = pad(left % 60);
  const tomorrow = now >= liveUntil;

  return (
    <section className="relative overflow-hidden rounded-2xl bg-black text-white ring-1 ring-white/10">
      {/* call sheet header strip */}
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em]">
        <span className="text-white/60">Call time</span>
        <span className="text-white">7:00 PM daily</span>
        {live ? (
          <span className="ml-auto flex items-center gap-1.5 text-brand-400">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-400" style={{ animation: "pulse-dot 1.2s ease-in-out infinite" }} />
            Live now
          </span>
        ) : (
          <span className="ml-auto text-white/45">{TONIGHT.city}</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-4 px-4 py-4">
        {live ? (
          <div className="min-w-0 flex-1">
            <p className="font-display text-[24px] font-bold leading-tight">Tonight&apos;s roles are up.</p>
            <p className="mt-1 text-[13.5px] text-white/70">
              {TONIGHT.roles} new roles in {TONIGHT.city}. The early tapes get watched first.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-end gap-2">
              <Digits value={hh} label="hrs" />
              <span className="pb-6 font-mono text-[22px] font-bold text-white/40">:</span>
              <Digits value={mm} label="min" />
              <span className="pb-6 font-mono text-[22px] font-bold text-white/40">:</span>
              <Digits value={ss} label="sec" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[19px] font-bold leading-tight">
                {TONIGHT.roles} roles drop {tomorrow ? "tomorrow" : "tonight"} at 7
              </p>
              <p className="mt-1 flex flex-wrap gap-x-2 text-[12.5px] text-white/60">
                {TONIGHT.split.map((s) => (
                  <span key={s.label}>
                    {s.n} {s.label.toLowerCase()}
                  </span>
                ))}
              </p>
            </div>
          </>
        )}

        {live ? (
          <Link href="/casting" className="press shrink-0 rounded-lg bg-brand-600 px-5 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-brand-500">
            Open the drop
          </Link>
        ) : (
          <button
            onClick={toggleRemind}
            aria-pressed={remind}
            className={`press shrink-0 rounded-lg px-4 py-2.5 text-[13.5px] font-bold transition-colors ${
              remind ? "border border-brand-400/60 text-brand-400" : "bg-white text-black hover:bg-white/90"
            }`}
          >
            {remind ? "✓ Reminder set" : "Remind me"}
          </button>
        )}
      </div>
    </section>
  );
}
