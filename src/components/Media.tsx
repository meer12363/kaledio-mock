"use client";

import { useEffect, useRef, useState } from "react";
import type { MediaItem, MediaTone } from "@/lib/types";
import { IconPause, IconPlay } from "./icons";
import { CameraMark } from "./Logo";

const TONE_GRADIENTS: Record<MediaTone, { from: string; to: string; text: string; dim: string }> = {
  midnight: { from: "#0b1b2b", to: "#123b63", text: "#d9e9f8", dim: "rgba(217,233,248,0.55)" },
  steel: { from: "#2e3d4c", to: "#5b7186", text: "#e8edf2", dim: "rgba(232,237,242,0.55)" },
  sky: { from: "#0b66c3", to: "#6fa9e0", text: "#eef5fc", dim: "rgba(238,245,252,0.6)" },
  noir: { from: "#14181d", to: "#2b333d", text: "#c9d2db", dim: "rgba(201,210,219,0.5)" },
  porcelain: { from: "#e9eef4", to: "#c7d4e1", text: "#2c3844", dim: "rgba(44,56,68,0.55)" },
  dusk: { from: "#1d2947", to: "#46588f", text: "#dde4f8", dim: "rgba(221,228,248,0.55)" },
};

const ASPECTS = { wide: "16 / 9", tall: "4 / 5", square: "1 / 1" } as const;

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Offline stand-in for stills, posters and frames — styled like a graded film frame. */
export function MediaPlaceholder({
  item,
  className = "",
  labels = true,
}: {
  item: MediaItem;
  className?: string;
  labels?: boolean;
}) {
  const tone = TONE_GRADIENTS[item.tone];
  const h = hashCode(item.id + item.title);
  const cx = 18 + (h % 64);
  const cy = 12 + ((h >> 3) % 56);
  const gid = `g-${item.id}-${h % 997}`;

  return (
    <div
      className={`relative overflow-hidden rounded-lg ${className}`}
      style={{ aspectRatio: ASPECTS[item.aspect] }}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 62.5"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={tone.from} />
            <stop offset="100%" stopColor={tone.to} />
          </linearGradient>
          <radialGradient id={`${gid}-glow`} cx={`${cx}%`} cy={`${cy}%`} r="55%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <filter id={`${gid}-grain`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.05" />
            </feComponentTransfer>
          </filter>
        </defs>
        <rect width="100" height="62.5" fill={`url(#${gid})`} />
        <rect width="100" height="62.5" fill={`url(#${gid}-glow)`} />
        <rect width="100" height="62.5" filter={`url(#${gid}-grain)`} />
        {/* viewfinder corner marks */}
        <g stroke={tone.dim} strokeWidth="0.6" fill="none" opacity="0.8">
          <path d="M6 10 V6 H10" />
          <path d="M94 10 V6 H90" />
          <path d="M6 52.5 V56.5 H10" />
          <path d="M94 52.5 V56.5 H90" />
        </g>
      </svg>
      {labels && (
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-3">
          <div>
            <p
              className="text-[13px] font-semibold leading-snug"
              style={{ color: tone.text }}
            >
              {item.title}
            </p>
            <p
              className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em]"
              style={{ color: tone.dim }}
            >
              {item.kind} · {item.year}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function parseDuration(d: string): number {
  const [min, sec] = d.split(":").map(Number);
  return (min || 0) * 60 + (sec || 0);
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
}

const REEL_SCENES: MediaTone[] = ["midnight", "dusk", "steel", "noir"];
const SCENE_SLATES = [
  "INT. STUDIO — NIGHT",
  "EXT. COASTAL ROAD — DAWN",
  "INT. REHEARSAL ROOM — DAY",
  "EXT. CITY ROOFTOP — DUSK",
];

/** Offline showreel: a stylised player that actually plays, scrubs and pauses. */
export function ShowreelPlayer({
  title,
  duration,
  ownerName,
}: {
  title: string;
  duration: string;
  ownerName: string;
}) {
  const total = parseDuration(duration) || 150;
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const raf = useRef<number | null>(null);
  const last = useRef<number>(0);

  useEffect(() => {
    if (!playing) return;
    const tick = (t: number) => {
      if (!last.current) last.current = t;
      const dt = (t - last.current) / 1000;
      last.current = t;
      setProgress((p) => {
        // compressed playback: a full reel plays out in ~24s
        const next = p + dt / 24;
        if (next >= 1) {
          setPlaying(false);
          return 0;
        }
        return next;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      last.current = 0;
    };
  }, [playing]);

  const sceneIdx = Math.min(REEL_SCENES.length - 1, Math.floor(progress * REEL_SCENES.length));

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setProgress(Math.min(0.999, Math.max(0, (e.clientX - rect.left) / rect.width)));
  };

  return (
    <div className="relative overflow-hidden rounded-xl bg-ink-900" style={{ aspectRatio: "16 / 9" }}>
      {/* scene layers */}
      {REEL_SCENES.map((tone, i) => {
        const g = TONE_GRADIENTS[tone];
        return (
          <div
            key={tone}
            className="absolute inset-0 transition-opacity duration-700"
            style={{
              background: `linear-gradient(120deg, ${g.from}, ${g.to})`,
              opacity: i === sceneIdx ? 1 : 0,
              animation: playing && i === sceneIdx ? "reel-shift 9s ease-in-out infinite" : undefined,
            }}
          />
        );
      })}
      {/* vignette */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(6,10,16,0.55))" }} />

      {/* slate caption while playing */}
      <div className="absolute left-4 top-4 flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${playing ? "bg-red-400" : "bg-white/40"}`} style={playing ? { animation: "pulse-dot 1.2s ease-in-out infinite" } : undefined} />
        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/70">
          {playing ? SCENE_SLATES[sceneIdx] : `${ownerName} · ${title}`}
        </span>
      </div>
      <div className="absolute right-4 top-4 text-white/50">
        <CameraMark size={18} />
      </div>

      {/* center play button */}
      {!playing && (
        <button
          onClick={() => setPlaying(true)}
          className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-ink-900 shadow-pop transition-transform duration-200 hover:scale-105 active:scale-95"
          aria-label={`Play ${title}`}
        >
          <IconPlay size={26} className="ml-1" />
        </button>
      )}

      {/* control bar */}
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/60 to-transparent px-4 pb-3 pt-8">
        <button
          onClick={() => setPlaying((p) => !p)}
          className="text-white transition-opacity hover:opacity-80"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <IconPause size={18} /> : <IconPlay size={18} />}
        </button>
        <div
          className="group relative h-4 flex-1 cursor-pointer"
          onClick={seek}
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={Math.round(progress * total)}
        >
          <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/25">
            <div
              className="h-full rounded-full bg-white"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
        <span className="font-mono text-[11px] tabular-nums text-white/80">
          {formatTime(progress * total)} / {duration}
        </span>
      </div>
    </div>
  );
}
