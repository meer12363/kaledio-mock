"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Logo } from "@/components/Logo";
import { CineVideo } from "@/components/CineVideo";
import { LazyStage3D } from "@/components/Stage3DLazy";
import { Tilt } from "@/components/Tilt";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { StageProp } from "@/components/Stage3D";
import { IconArrowRight } from "@/components/icons";
import { useSession } from "@/lib/session";
import { CLIPS, FOOTAGE_CREDIT, type ClipId } from "@/lib/clips";

const TICKER_ROLES = [
  "Actors", "Directors", "Cinematographers", "Casting Directors", "Editors",
  "Composers", "Models", "Singers", "Dancers", "Voice Artists", "Writers",
  "Producers", "Studios", "Agencies", "Choreographers",
];

const STAGE_LINES: Record<StageProp, string> = {
  clapper: "Scene 1, take 1. ACTION! 🎬",
  reel: "Rolling… 🎞️",
  star: "And the award goes to… you 🏆",
  camera: "Camera's hot — smile 🎥",
};

const SHOWING: Array<{ clip: ClipId; tag: string; title: string; meta: string; href: string }> = [
  { clip: "tears-bridge", tag: "Casting", title: "Saltwater S3 — 4 recurring roles", meta: "OTT Series · Goa · closes Jul 20", href: "/casting" },
  { clip: "sintel-dragon", tag: "Premiere", title: "Half Light — premieres tonight", meta: "Feature · MAMI Official Selection", href: "/home" },
  { clip: "spring-forest", tag: "Audition", title: "8 dancers for a flooded-warehouse MV", meta: "Music Video · Hyderabad · ₹18k/day", href: "/casting" },
];

const FEATURES = [
  { emoji: "🎭", title: "Get cast", body: "Live calls from film, OTT, ads, music video and theatre. Apply in one tap." },
  { emoji: "🎞️", title: "Show your reel", body: "Vertical reels, a profile that works like a portfolio, and credits that follow you." },
  { emoji: "🤝", title: "Build the crew", body: "Directors, DoPs, editors, casting — find them by role, city and availability." },
];

export default function LandingPage() {
  const { cut } = useSession();
  const [line, setLine] = useState<string | null>(null);

  const enter = () => cut("/home", "Cueing your feed");
  const onProp = useCallback((p: StageProp) => {
    setLine(STAGE_LINES[p]);
    window.setTimeout(() => setLine(null), 1800);
  }, []);

  return (
    <div className="min-h-dvh overflow-x-hidden bg-canvas text-ink-900">
      {/* ————— top bar ————— */}
      <header className="absolute inset-x-0 top-0 z-40">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <span className="[&_*]:!text-white">
            <Logo size={30} />
          </span>
          <div className="flex items-center gap-2 text-white">
            <span className="[&_button]:text-white/80 [&_button:hover]:bg-white/10 [&_button:hover]:text-white">
              <ThemeToggle />
            </span>
            <Link href="/login" className="hidden rounded-full px-4 py-2 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white sm:block">
              Log in
            </Link>
            <button onClick={enter} className="press rounded-full bg-volt px-5 py-2 text-sm font-bold text-black transition-shadow hover:shadow-glow-volt">
              Enter
            </button>
          </div>
        </div>
      </header>

      {/* ————— hero: footage + 3D set ————— */}
      <section className="relative isolate flex min-h-[100svh] items-center overflow-hidden bg-black text-white">
        <div className="absolute inset-0 [background:var(--grad-hero)] opacity-70" />
        <CineVideo clip="tears-city" eager length={24} className="absolute inset-0 h-full w-full opacity-70" />
        <div className="footage-shade absolute inset-0" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-canvas to-transparent" />

        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-4 px-5 pb-16 pt-24 lg:grid-cols-[1.05fr_1fr]">
          <div className="anim-rise relative z-10">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/70">
              ● Film · TV · OTT · Ads · Music · Theatre
            </p>
            <h1 className="mt-5 text-balance font-display text-[clamp(2.7rem,7vw,5.2rem)] font-bold leading-[0.98] tracking-[-0.045em]">
              Where the industry <span className="volt-text">finds its people.</span>
            </h1>
            <p className="mt-6 max-w-md text-[17px] leading-relaxed text-white/80">
              Casting calls, reels and the crews behind them — in one place. Jump straight in, no sign-up needed.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <button
                onClick={enter}
                className="press group inline-flex items-center gap-2 rounded-full bg-volt px-7 py-3.5 text-[15px] font-bold text-black shadow-glow-volt"
              >
                Enter Kaledio
                <IconArrowRight size={17} className="transition-transform duration-200 group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => cut("/casting", "Opening the board")}
                className="press rounded-full border border-white/30 bg-white/5 px-7 py-3.5 text-[15px] font-semibold text-white backdrop-blur transition-colors hover:border-white/60 hover:bg-white/10"
              >
                See who&apos;s casting
              </button>
            </div>
          </div>

          <div className="relative -mx-5 h-[340px] sm:h-[440px] lg:mx-0 lg:h-[560px]">
            <LazyStage3D withCamera className="absolute inset-0" onPropClick={onProp} />
            {line && (
              <span
                key={line}
                className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/70 px-4 py-2 font-display text-[15px] font-bold text-volt backdrop-blur"
                style={{ animation: "pop-in 0.3s cubic-bezier(0.34,1.56,0.64,1) both" }}
              >
                {line}
              </span>
            )}
            <span className="pointer-events-none absolute bottom-2 right-4 font-mono text-[10px] uppercase tracking-[0.18em] text-white/50">
              ✦ drag your cursor · tap the props
            </span>
          </div>
        </div>
      </section>

      {/* ————— ticker ————— */}
      <div className="overflow-hidden border-y border-line py-3.5" aria-hidden="true">
        <div className="anim-ticker flex w-max whitespace-nowrap">
          {[0, 1].map((rep) => (
            <div key={rep} className="flex">
              {TICKER_ROLES.map((r) => (
                <span key={`${rep}-${r}`} className="mx-5 flex items-center gap-5 font-mono text-[12px] font-bold uppercase tracking-[0.18em] text-ink-500">
                  {r}
                  <span className="text-volt-ink">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ————— now showing ————— */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Now showing</p>
            <h2 className="mt-2 font-display text-[clamp(2rem,4.5vw,3.2rem)] font-bold leading-none tracking-[-0.04em]">
              On the board <span className="grad-text">right now</span>
            </h2>
          </div>
          <button onClick={enter} className="font-mono text-[12px] font-bold uppercase tracking-wider text-volt-ink hover:underline">
            Open the feed →
          </button>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {SHOWING.map((s) => (
            <Tilt key={s.title}>
              <Link href={s.href} className="group relative block aspect-[4/5] overflow-hidden rounded-3xl bg-black ring-1 ring-line">
                <div className="absolute inset-0 [background:var(--grad-hero)] opacity-60" />
                <CineVideo clip={s.clip} length={12} className="absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/30" />
                <span className="absolute left-4 top-4 rounded-md bg-white px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-black">
                  {s.tag}
                </span>
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <p className="font-display text-[22px] font-bold leading-tight">{s.title}</p>
                  <p className="mt-1.5 text-[13px] text-white/75">{s.meta}</p>
                  <p className="mt-3 font-mono text-[9.5px] uppercase tracking-wider text-white/45">{CLIPS[s.clip].film} · CC BY</p>
                </div>
              </Link>
            </Tilt>
          ))}
        </div>
      </section>

      {/* ————— what you can do ————— */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="grid gap-5 md:grid-cols-3">
          {FEATURES.map((f) => (
            <Tilt key={f.title} max={6}>
              <button
                onClick={enter}
                className="group h-full w-full rounded-3xl border border-line bg-paper p-7 text-left shadow-card transition-colors hover:border-volt-ink/50"
              >
                <span className="inline-block text-4xl transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110">{f.emoji}</span>
                <h3 className="mt-5 font-display text-[22px] font-bold text-ink-900">{f.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-600">{f.body}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-volt-ink">
                  Try it now <IconArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                </span>
              </button>
            </Tilt>
          ))}
        </div>
      </section>

      {/* ————— final CTA ————— */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="relative overflow-hidden rounded-[32px] bg-black px-8 py-16 text-center text-white sm:py-20">
          <CineVideo clip="cosmos-field" length={16} className="absolute inset-0 h-full w-full opacity-50" />
          <div className="absolute inset-0 bg-black/45" />
          <h2 className="relative font-display text-[clamp(2rem,4.5vw,3.4rem)] font-bold leading-none tracking-[-0.04em]">
            Your next credit starts <span className="volt-text">here.</span>
          </h2>
          <p className="relative mx-auto mt-4 max-w-md text-[15px] text-white/80">No forms, no waiting. Walk onto the set and look around.</p>
          <button onClick={enter} className="press relative mt-8 rounded-full bg-volt px-8 py-3.5 text-[15px] font-bold text-black shadow-glow-volt">
            Enter Kaledio →
          </button>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-[12px] text-ink-500">
          <span>© 2026 Kaledio. Made for the people who make things.</span>
          <span>{FOOTAGE_CREDIT}</span>
        </div>
      </footer>
    </div>
  );
}
