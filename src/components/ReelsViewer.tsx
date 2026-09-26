"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "./Avatar";
import { CineVideo } from "./CineVideo";
import { useToast } from "./Toast";
import { IconBookmark, IconComment, IconHeart, IconSend, IconShare, IconX } from "./icons";
import { MOCK_PEOPLE, MOCK_REELS, type Reel } from "@/lib/mock";

const DURATION = 9000; // ms per reel before auto-advance

const fmt = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "")}k` : String(n);

const MOCK_COMMENTS = [
  { who: "Aanya Sharma", hue: 0, text: "This is exactly the energy I needed today 🔥" },
  { who: "Rohan Chatterjee", hue: 11, text: "Taping tonight. Wish me luck 🎭" },
  { who: "Ishaan Verma", hue: 12, text: "The colour on this is unreal" },
  { who: "Tara D'Souza", hue: 8, text: "Saving this for my next pitch deck ✍️" },
];

/** Opens via window event `kaledio:open-reels` (detail: { index }) */
export function ReelsViewer() {
  const [state, setState] = useState<{ open: boolean; index: number }>({ open: false, index: 0 });

  useEffect(() => {
    const onOpen = (e: Event) => {
      const idx = (e as CustomEvent<{ index?: number }>).detail?.index ?? 0;
      setState({ open: true, index: idx });
    };
    window.addEventListener("kaledio:open-reels", onOpen);
    return () => window.removeEventListener("kaledio:open-reels", onOpen);
  }, []);

  if (!state.open) return null;
  return <ReelsOverlay startIndex={state.index} onClose={() => setState((s) => ({ ...s, open: false }))} />;
}

export function openReels(index = 0) {
  window.dispatchEvent(new CustomEvent("kaledio:open-reels", { detail: { index } }));
}

function ReelsOverlay({ startIndex, onClose }: { startIndex: number; onClose: () => void }) {
  const router = useRouter();
  const { toast } = useToast();
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(startIndex);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [hearts, setHearts] = useState<Array<{ id: number; x: number; y: number; reel: string }>>([]);
  const [burst, setBurst] = useState<string | null>(null);
  const [sheetFor, setSheetFor] = useState<Reel | null>(null);
  const [hint, setHint] = useState(true);
  const onAutoMuted = useCallback(() => setMuted(true), []);
  const clickTimer = useRef<number | null>(null);
  const heartSeq = useRef(0);

  // lock body scroll, jump to the tapped reel, and fade the swipe hint
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const el = scroller.current?.children[startIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: "instant" as ScrollBehavior });
    const t = window.setTimeout(() => setHint(false), 2600);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(t);
    };
  }, [startIndex]);

  // track which reel is on screen
  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setActive(Number((e.target as HTMLElement).dataset.idx));
            setPaused(false);
          }
        }
      },
      { root, threshold: 0.6 }
    );
    Array.from(root.children).forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, []);

  const goTo = useCallback((i: number) => {
    const n = MOCK_REELS.length;
    const idx = ((i % n) + n) % n;
    const el = scroller.current?.children[idx] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (sheetFor) {
        if (e.key === "Escape") setSheetFor(null);
        return;
      }
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        goTo(active + 1);
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        goTo(active - 1);
      } else if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active, goTo, onClose, sheetFor]);

  const like = (reel: Reel, force = false) => {
    setLiked((s) => {
      const n = new Set(s);
      if (n.has(reel.id) && !force) n.delete(reel.id);
      else n.add(reel.id);
      return n;
    });
    setBurst(reel.id);
    window.setTimeout(() => setBurst(null), 600);
  };

  const onFrameClick = (reel: Reel, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (clickTimer.current) {
      // double tap → like + floating heart
      window.clearTimeout(clickTimer.current);
      clickTimer.current = null;
      const id = ++heartSeq.current;
      setHearts((h) => [...h, { id, x, y, reel: reel.id }]);
      window.setTimeout(() => setHearts((h) => h.filter((v) => v.id !== id)), 900);
      like(reel, true);
      return;
    }
    clickTimer.current = window.setTimeout(() => {
      clickTimer.current = null;
      setPaused((p) => !p);
    }, 230);
  };

  const share = async (reel: Reel) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/home?reel=${reel.id}`);
    } catch {
      /* ignore */
    }
    toast("Reel link copied — go make someone's day 🎬", "accent");
  };

  return (
    <div className="fixed inset-0 z-[500] select-none bg-black" style={{ animation: "fade-in 0.25s ease-out both" }}>
      {/* chrome */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between p-4">
        <div className="pointer-events-auto flex items-center gap-2">
          <span className="font-display text-xl font-bold text-white">Reels</span>
          <span className="rounded-full bg-volt px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-black">
            {active + 1}/{MOCK_REELS.length}
          </span>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? "Unmute" : "Mute"}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-lg text-white backdrop-blur transition-colors hover:bg-white/20"
          >
            {muted ? "🔇" : "🔊"}
          </button>
          <button
            onClick={onClose}
            aria-label="Close reels"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
          >
            <IconX size={18} />
          </button>
        </div>
      </div>

      {/* desktop up/down */}
      <div className="absolute right-6 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-3 lg:flex">
        <button
          onClick={() => goTo(active - 1)}
          aria-label="Previous reel"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-xl text-white backdrop-blur transition-all hover:scale-105 hover:bg-white/20"
        >
          ↑
        </button>
        <button
          onClick={() => goTo(active + 1)}
          aria-label="Next reel"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-xl text-white backdrop-blur transition-all hover:scale-105 hover:bg-white/20"
        >
          ↓
        </button>
      </div>

      <div ref={scroller} className="no-scrollbar h-full snap-y snap-mandatory overflow-y-scroll overscroll-contain">
        {MOCK_REELS.map((reel, i) => {
          const creator = MOCK_PEOPLE.find((p) => p.id === reel.creatorId)!;
          const isActive = i === active;
          const isLiked = liked.has(reel.id);
          const isSaved = saved.has(reel.id);
          const isFollowing = following.has(reel.creatorId);
          const [c0, c1, c2] = reel.palette;
          const running = isActive && !paused && !sheetFor;
          return (
            <section
              key={reel.id}
              data-idx={i}
              className="relative flex h-[100dvh] w-full snap-start snap-always items-center justify-center overflow-hidden"
            >
              {/* ambient backdrop behind the 9:16 frame (desktop) */}
              <div
                className="absolute inset-0 scale-125 opacity-50 blur-3xl"
                style={{ background: `radial-gradient(50% 60% at 40% 40%, ${c2}, transparent 70%), radial-gradient(50% 60% at 70% 70%, ${c1}, transparent 70%), ${c0}` }}
              />

              {/* the frame */}
              <div className="relative h-full w-full overflow-hidden md:aspect-[9/16] md:h-[calc(100dvh-32px)] md:max-h-[880px] md:w-auto md:rounded-[28px] md:shadow-pop">
                {/* "footage": layered moving light */}
                <div className="absolute inset-0" style={{ background: `linear-gradient(170deg, ${c0} 0%, #000 100%)` }} />
                <div
                  className="absolute -inset-[20%]"
                  style={{
                    background: `radial-gradient(35% 30% at 30% 28%, ${c2} 0%, transparent 65%), radial-gradient(45% 40% at 72% 66%, ${c1} 0%, transparent 70%)`,
                    animation: "ken-burns 11s ease-in-out infinite alternate",
                    animationPlayState: running ? "running" : "paused",
                  }}
                />
                <div
                  className="absolute left-[18%] top-[55%] h-40 w-40 rounded-full opacity-60 blur-3xl"
                  style={{ background: c2, animation: "float-soft 6s ease-in-out infinite", animationPlayState: running ? "running" : "paused" }}
                />
                {/* the hero prop (shows until the footage is ready) */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className="select-none text-[120px] drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)] md:text-[140px]"
                    style={{ animation: "float-soft 4.5s ease-in-out infinite", animationPlayState: running ? "running" : "paused" }}
                  >
                    {reel.prop}
                  </span>
                </div>
                {/* real footage — loads for the reel on screen and its neighbours */}
                {Math.abs(i - active) <= 1 && (
                  <CineVideo
                    clip={reel.clip}
                    eager
                    playing={running}
                    muted={muted}
                    length={DURATION / 1000 + 2}
                    onAutoMuted={onAutoMuted}
                    className="absolute inset-0 h-full w-full"
                  />
                )}
                {/* subtitle burned in */}
                <div className="absolute inset-x-0 top-[62%] flex justify-center px-8">
                  <span className="rounded bg-black/55 px-2.5 py-1 text-center font-mono text-[12px] tracking-wide text-white/90">
                    {reel.subtitle}
                  </span>
                </div>
                {/* shading */}
                <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/70 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                {/* tap zone: tap = pause, double tap = like */}
                <div className="absolute inset-0 z-10" onClick={(e) => onFrameClick(reel, e)} />

                {/* floating hearts */}
                {hearts
                  .filter((h) => h.reel === reel.id)
                  .map((h) => (
                    <span
                      key={h.id}
                      className="pointer-events-none absolute z-20 text-7xl"
                      style={{ left: h.x - 36, top: h.y - 40, animation: "float-up 0.9s ease-out forwards" }}
                    >
                      ❤️
                    </span>
                  ))}

                {/* paused indicator */}
                {isActive && paused && !sheetFor && (
                  <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                    <span className="flex h-20 w-20 items-center justify-center rounded-full bg-black/50 text-3xl text-white backdrop-blur" style={{ animation: "pop-in 0.25s both" }}>
                      ▶
                    </span>
                  </div>
                )}

                {/* progress */}
                <div className="absolute inset-x-3 top-16 z-20 h-[3px] overflow-hidden rounded-full bg-white/20 md:top-4">
                  {isActive && (
                    <div
                      key={`p-${reel.id}-${active}`}
                      className="h-full origin-left rounded-full bg-white"
                      style={{
                        animation: `progress-fill ${DURATION}ms linear forwards`,
                        animationPlayState: running ? "running" : "paused",
                      }}
                      onAnimationEnd={() => goTo(i + 1)}
                    />
                  )}
                </div>

                {/* badge */}
                <div className="absolute left-4 top-20 z-20 md:top-8">
                  <span
                    className={`rounded-md px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] ${
                      reel.kind === "live" ? "bg-danger text-white" : "bg-white text-black"
                    }`}
                    style={reel.kind === "live" ? { animation: "pulse-dot 1.4s ease-in-out infinite" } : undefined}
                  >
                    {reel.kind === "live" ? "● " : ""}
                    {reel.badge}
                  </span>
                </div>

                {/* bottom-left info */}
                <div className="absolute inset-x-0 bottom-0 z-20 p-4 pb-8 pr-20 md:pb-6">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={creator.name} hue={creator.hue} size={36} />
                    <span className="text-[14px] font-bold text-white">{creator.name}</span>
                    <button
                      onClick={() => {
                        setFollowing((s) => {
                          const n = new Set(s);
                          if (n.has(reel.creatorId)) n.delete(reel.creatorId);
                          else {
                            n.add(reel.creatorId);
                            toast(`You're following ${creator.name.split(" ")[0]} ✨`, "accent");
                          }
                          return n;
                        });
                      }}
                      className={`rounded-lg border px-2.5 py-1 text-[12px] font-bold transition-all ${
                        isFollowing ? "border-white/30 bg-white/10 text-white" : "border-white text-white hover:bg-white hover:text-black"
                      }`}
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </button>
                  </div>
                  <h3 className="mt-3 font-display text-[22px] font-bold leading-tight text-white">{reel.title}</h3>
                  <p className="mt-1.5 line-clamp-2 text-[13.5px] leading-snug text-white/85">{reel.caption}</p>
                  <div className="mt-3 flex items-center gap-2 overflow-hidden">
                    <span className="text-sm" style={{ animation: "spin-slow 3s linear infinite", animationPlayState: running ? "running" : "paused" }}>
                      💿
                    </span>
                    <div className="relative min-w-0 flex-1 overflow-hidden">
                      <div className="flex w-max gap-10 font-mono text-[11.5px] text-white/80 anim-marquee" style={{ animationPlayState: running ? "running" : "paused" }}>
                        <span>♫ {reel.audio}</span>
                        <span>♫ {reel.audio}</span>
                      </div>
                    </div>
                  </div>
                  {reel.cta && (
                    <button
                      onClick={() => {
                        onClose();
                        router.push(reel.cta!.href);
                      }}
                      className="press sheen mt-4 w-full rounded-xl py-3 text-[14px] font-bold text-black [background:var(--grad-volt)]"
                    >
                      {reel.cta.label} →
                    </button>
                  )}
                </div>

                {/* right action rail */}
                <div className="absolute bottom-24 right-3 z-20 flex flex-col items-center gap-5 md:bottom-20">
                  <RailButton
                    label={fmt(reel.likes + (isLiked ? 1 : 0))}
                    onClick={() => like(reel)}
                    active={isLiked}
                    icon={
                      <span className="relative inline-flex">
                        <IconHeart
                          size={28}
                          filled={isLiked}
                          className={isLiked ? "text-[#ff4f7b]" : "text-white"}
                          style={burst === reel.id ? { animation: "like-burst 0.55s cubic-bezier(0.34,1.56,0.64,1)" } : undefined}
                        />
                      </span>
                    }
                  />
                  <RailButton label={fmt(reel.comments)} onClick={() => setSheetFor(reel)} icon={<IconComment size={27} className="text-white" />} />
                  <RailButton label={fmt(reel.shares)} onClick={() => share(reel)} icon={<IconShare size={26} className="text-white" />} />
                  <RailButton
                    label={isSaved ? "Saved" : "Save"}
                    onClick={() =>
                      setSaved((s) => {
                        const n = new Set(s);
                        if (n.has(reel.id)) n.delete(reel.id);
                        else {
                          n.add(reel.id);
                          toast("Saved to your collection 📌", "success");
                        }
                        return n;
                      })
                    }
                    active={isSaved}
                    icon={<IconBookmark size={26} filled={isSaved} className={isSaved ? "text-volt" : "text-white"} />}
                  />
                  <span
                    className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-white/80 text-lg"
                    style={{ background: `linear-gradient(135deg, ${c1}, ${c2})`, animation: "spin-slow 6s linear infinite", animationPlayState: running ? "running" : "paused" }}
                  >
                    {reel.prop}
                  </span>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* swipe hint */}
      {hint && (
        <div className="pointer-events-none absolute inset-x-0 bottom-28 z-30 flex flex-col items-center gap-1 text-white" style={{ animation: "fade-in 0.4s both" }}>
          <span className="text-2xl" style={{ animation: "float-soft 1.2s ease-in-out infinite" }}>
            ↑
          </span>
          <span className="rounded-full bg-black/50 px-3 py-1 font-mono text-[11px] uppercase tracking-widest backdrop-blur">
            Swipe for more
          </span>
        </div>
      )}

      {sheetFor && <CommentSheet reel={sheetFor} onClose={() => setSheetFor(null)} />}
    </div>
  );
}

function RailButton({
  icon,
  label,
  onClick,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button onClick={onClick} className="press group flex flex-col items-center gap-1">
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-full backdrop-blur transition-all duration-200 group-hover:scale-110 ${
          active ? "bg-white/20" : "bg-black/25"
        }`}
      >
        {icon}
      </span>
      <span className="font-mono text-[11px] font-bold text-white drop-shadow">{label}</span>
    </button>
  );
}

function CommentSheet({ reel, onClose }: { reel: Reel; onClose: () => void }) {
  const [comments, setComments] = useState(MOCK_COMMENTS);
  const [draft, setDraft] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setComments((c) => [{ who: "You", hue: 3, text }, ...c]);
    setDraft("");
  };

  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} style={{ animation: "backdrop-in 0.2s both" }} />
      <div
        className="relative w-full max-w-md rounded-t-3xl border border-line bg-elevated p-4 pb-6 md:mb-4 md:rounded-3xl"
        style={{ animation: "modal-in 0.3s cubic-bezier(0.22,1,0.36,1) both" }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-ink-900/20" />
        <div className="flex items-center justify-between">
          <p className="font-display text-[16px] font-bold text-ink-900">
            {fmt(reel.comments + comments.length - MOCK_COMMENTS.length)} comments
          </p>
          <button onClick={onClose} aria-label="Close comments" className="rounded-full p-1.5 text-ink-400 hover:bg-ink-900/5 hover:text-ink-900">
            <IconX size={16} />
          </button>
        </div>
        <ul className="mt-3 max-h-72 space-y-3.5 overflow-y-auto">
          {comments.map((c, i) => (
            <li key={`${c.who}-${i}`} className="flex gap-3" style={i === 0 && c.who === "You" ? { animation: "pop-in 0.3s both" } : undefined}>
              <Avatar name={c.who} hue={c.hue} size={32} />
              <div className="min-w-0">
                <p className="text-[12.5px] font-bold text-ink-700">{c.who}</p>
                <p className="text-[13.5px] leading-snug text-ink-900">{c.text}</p>
              </div>
            </li>
          ))}
        </ul>
        <form onSubmit={submit} className="mt-4 flex items-center gap-2">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a comment…"
            className="min-w-0 flex-1 rounded-full border border-line-strong bg-paper px-4 py-2.5 text-sm focus:border-volt-ink focus:outline-none"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            aria-label="Post comment"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-volt text-black transition-opacity disabled:opacity-40"
          >
            <IconSend size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}
