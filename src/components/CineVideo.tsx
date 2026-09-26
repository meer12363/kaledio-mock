"use client";

import { useEffect, useRef, useState } from "react";
import { CLIPS, FALLBACK_MP4, type ClipId } from "@/lib/clips";

/**
 * Muted, looping scene from an open movie. Loads lazily when it nears the
 * viewport, plays while on screen (or when `playing` says so) and loops a
 * `length`-second window starting at the clip's timestamp. Renders nothing
 * visible until the first frame is ready, so whatever sits underneath acts
 * as the poster / fallback.
 */
export function CineVideo({
  clip,
  className = "",
  playing,
  muted = true,
  length = 14,
  eager = false,
  onAutoMuted,
}: {
  clip: ClipId;
  className?: string;
  /** force play/pause; defaults to "while on screen" */
  playing?: boolean;
  muted?: boolean;
  /** seconds of the scene to loop */
  length?: number;
  /** start loading immediately instead of waiting for the viewport.
   *  Without it, a controlled (`playing`) clip waits until it's first asked to play. */
  eager?: boolean;
  /** called when the browser refused sound and we fell back to muted */
  onAutoMuted?: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(eager);
  const [onScreen, setOnScreen] = useState(false);
  const [ready, setReady] = useState(false);
  // 0 = webm source, 1 = mp4 fallback, 2 = give up (show what's underneath)
  const [attempt, setAttempt] = useState(0);
  const [calm, setCalm] = useState(false);

  const c = CLIPS[clip];
  const src = attempt === 0 ? c.src : FALLBACK_MP4;
  const start = attempt === 0 ? c.start : 0;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    setCalm(reduce.matches);
    const loader = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "300px" });
    const watcher = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { threshold: 0.2 });
    loader.observe(el);
    watcher.observe(el);
    return () => {
      loader.disconnect();
      watcher.disconnect();
    };
  }, []);

  // controlled clips (e.g. hover previews) don't fetch anything until first played
  const [wanted, setWanted] = useState(eager || playing === undefined);
  if (playing && !wanted) setWanted(true);
  const load = near && wanted;

  const shouldPlay = attempt < 2 && load && (playing ?? (onScreen && !calm));

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (!shouldPlay) {
      v.pause();
      return;
    }
    v.muted = muted;
    v.play().catch(() => {
      // sound needs a user gesture — retry silently
      if (!v.muted) {
        v.muted = true;
        onAutoMuted?.();
        v.play().catch(() => {});
      }
    });
  }, [shouldPlay, muted, onAutoMuted, src]);

  if (attempt >= 2) return null;

  return (
    <video
      ref={ref}
      key={src}
      src={load ? `${src}#t=${start}` : undefined}
      muted={muted}
      playsInline
      preload={!load ? "none" : shouldPlay ? "auto" : "metadata"}
      aria-hidden="true"
      onLoadedMetadata={(e) => {
        if (e.currentTarget.currentTime < start) e.currentTarget.currentTime = start;
      }}
      onLoadedData={() => setReady(true)}
      onPlaying={() => setReady(true)}
      onTimeUpdate={(e) => {
        const v = e.currentTarget;
        if (v.currentTime > start + length || v.currentTime < start - 0.5) v.currentTime = start;
      }}
      onEnded={(e) => {
        e.currentTarget.currentTime = start;
        e.currentTarget.play().catch(() => {});
      }}
      onError={() => {
        setReady(false);
        setAttempt((a) => a + 1);
      }}
      // hidden until the first frame is decoded; className may set its own resting opacity
      style={ready ? undefined : { opacity: 0 }}
      className={`object-cover transition-opacity duration-700 ${className}`}
    />
  );
}
