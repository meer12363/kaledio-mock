"use client";

import { MOCK_PEOPLE, MOCK_REELS } from "@/lib/mock";
import { Avatar } from "./Avatar";
import { IconPlay, IconPlus } from "./icons";
import { openReels } from "./ReelsViewer";

const fmt = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "")}k` : String(n);

export function SpotlightRail() {
  return (
    <section className="anim-rise">
      <div className="mb-3 flex items-end justify-between px-1">
        <div>
          <p className="eyebrow">Spotlight</p>
          <h2 className="font-display text-[22px] font-bold leading-none text-ink-900">
            Reels <span className="grad-text">right now</span>
          </h2>
        </div>
        <button
          onClick={() => openReels(0)}
          className="press rounded-full border border-line-strong px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-ink-700 transition-colors hover:border-volt-ink hover:text-volt-ink"
        >
          Watch all ▶
        </button>
      </div>

      <div className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2">
        {/* add your own */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("kaledio:open-create"))}
          className="press group relative flex aspect-[9/16] w-[128px] shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line-strong bg-paper text-ink-500 transition-colors hover:border-volt-ink hover:text-volt-ink"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-900/[0.06] transition-transform group-hover:scale-110 group-hover:bg-volt group-hover:text-black">
            <IconPlus size={20} />
          </span>
          <span className="font-mono text-[10.5px] font-bold uppercase tracking-wider">Post a reel</span>
        </button>

        {MOCK_REELS.map((r, i) => {
          const creator = MOCK_PEOPLE.find((p) => p.id === r.creatorId)!;
          const [c0, c1, c2] = r.palette;
          return (
            <button
              key={r.id}
              onClick={() => openReels(i)}
              className="press group relative aspect-[9/16] w-[128px] shrink-0 snap-start overflow-hidden rounded-2xl text-left ring-1 ring-white/10 transition-transform duration-300 hover:-translate-y-1 hover:ring-white/30"
              style={{ background: c0 }}
            >
              {/* live-moving footage preview */}
              <div
                className="absolute -inset-[25%]"
                style={{
                  background: `radial-gradient(35% 30% at 30% 30%, ${c2} 0%, transparent 65%), radial-gradient(45% 40% at 70% 70%, ${c1} 0%, transparent 70%)`,
                  animation: `ken-burns ${8 + (i % 3) * 2}s ease-in-out infinite alternate`,
                }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-5xl transition-transform duration-500 group-hover:scale-125">
                {r.prop}
              </span>
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/40" />

              {/* badge */}
              <span
                className={`absolute left-2 top-2 rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${
                  r.kind === "live" ? "bg-danger text-white" : "bg-white/90 text-black"
                }`}
                style={r.kind === "live" ? { animation: "pulse-dot 1.4s ease-in-out infinite" } : undefined}
              >
                {r.kind === "live" ? "● " : ""}
                {r.badge}
              </span>

              {/* hover play */}
              <span className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 scale-75 items-center justify-center rounded-full bg-white/90 text-black opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
                <IconPlay size={18} className="ml-0.5" />
              </span>

              <div className="absolute inset-x-0 bottom-0 p-2.5">
                <p className="line-clamp-2 text-[12.5px] font-bold leading-tight text-white">{r.title}</p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <Avatar name={creator.name} hue={creator.hue} size={16} />
                  <span className="truncate text-[10.5px] font-medium text-white/80">{creator.name.split(" ")[0]}</span>
                  <span className="ml-auto font-mono text-[10px] font-bold text-white/90">▶ {fmt(r.likes * 4)}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
