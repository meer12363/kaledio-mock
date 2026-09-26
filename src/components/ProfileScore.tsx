"use client";

import { useId } from "react";
import Link from "next/link";
import { useSession } from "@/lib/session";
import { scoreProfile, type ProfileScore } from "@/lib/profileScore";

/** Circular 0–100 gauge with a volt→magenta sweep. */
export function ScoreRing({
  score,
  size = 120,
  stroke = 10,
  label = true,
}: {
  score: number;
  size?: number;
  stroke?: number;
  label?: boolean;
}) {
  const id = useId();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#d7ff3a" />
            <stop offset="55%" stopColor="#ffb13b" />
            <stop offset="100%" stopColor="#ff4f7b" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-ink-900/10" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.2, 0.8, 0.2, 1)" }}
        />
      </svg>
      {label && (
        <div className="absolute inset-0 flex flex-col items-center justify-center" role="img" aria-label={`Profile ${score} out of 100`}>
          <span className="font-display font-bold leading-none text-ink-900" style={{ fontSize: size * 0.28 }}>
            {score}
          </span>
          <span className="font-mono text-ink-400" style={{ fontSize: Math.max(9, size * 0.085) }}>
            / 100
          </span>
        </div>
      )}
    </div>
  );
}

export function useProfileScore(): ProfileScore | null {
  const { user } = useSession();
  return user ? scoreProfile(user) : null;
}

/** "Profile strength" nudge card: ring, tier and the next few things to fill in. */
export function ProfileStrengthCard({ compact = false }: { compact?: boolean }) {
  const s = useProfileScore();
  if (!s) return null;
  const complete = s.score >= 100;

  if (compact) {
    return (
      <Link
        href={complete ? "/profile" : `/profile/edit#${s.next[0].section}`}
        className="press flex items-center gap-3.5 rounded-3xl border border-line bg-paper p-3.5 shadow-card transition-colors hover:border-volt-ink/50"
      >
        <ScoreRing score={s.score} size={58} stroke={6} />
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-bold text-ink-900">
            {complete ? "Profile complete 🏆" : `Your profile is ${s.score}% there`}
          </span>
          <span className="block truncate text-[12.5px] text-ink-500">
            {complete ? "You're on the poster." : `${s.next[0].emoji} ${s.next[0].cta} · +${s.next[0].points} pts`}
          </span>
        </span>
        {!complete && (
          <span className="shrink-0 rounded-full bg-volt px-3 py-1.5 text-[12px] font-bold text-black">Finish →</span>
        )}
      </Link>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-paper shadow-card">
      <div className="relative flex items-center gap-4 p-4 [background:var(--grad-hero)]">
        <div className="absolute inset-0 bg-black/35" />
        <div className="relative rounded-full bg-black/40 p-1 backdrop-blur [&_span]:!text-white">
          <ScoreRing score={s.score} size={84} stroke={8} />
        </div>
        <div className="relative min-w-0 text-white">
          <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-white/70">Profile strength</p>
          <p className="mt-1 font-display text-[19px] font-bold leading-tight">
            {s.tier.emoji} {s.tier.title}
          </p>
          <p className="mt-0.5 text-[11.5px] text-white/75">
            {s.nextTier ? `${s.nextTier.min - s.score} pts to ${s.nextTier.title}` : "Maxed out. Legend."}
          </p>
        </div>
      </div>
      {complete ? (
        <p className="p-4 text-[13px] text-ink-600">Every scene filled in. Casting sees the full picture 🎬</p>
      ) : (
        <ul className="space-y-0.5 p-2">
          {s.next.slice(0, 3).map((i) => (
            <li key={i.id}>
              <Link
                href={`/profile/edit#${i.section}`}
                className="group flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition-colors hover:bg-ink-900/[0.04]"
              >
                <span className="text-[16px]">{i.emoji}</span>
                <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink-800 group-hover:text-ink-900">{i.cta}</span>
                <span className="rounded-md bg-volt/15 px-1.5 py-0.5 font-mono text-[10.5px] font-bold text-volt-ink">+{i.points}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="px-4 pb-4">
        <Link
          href={complete ? "/profile" : `/profile/edit#${s.next[0].section}`}
          className="press block rounded-xl py-2.5 text-center text-[13px] font-bold text-black [background:var(--grad-volt)]"
        >
          {complete ? "View your profile" : "Finish my profile →"}
        </Link>
      </div>
    </div>
  );
}
