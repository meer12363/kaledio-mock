"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IconX } from "./icons";

/**
 * Record a self tape without leaving the app: framing guides, live light and
 * sound checks, a 3-2-1 count, and a digital slate that claps and gets burned
 * into the first seconds of the tape so casting always knows whose tape it is.
 * Falls back to uploading a file when there's no camera.
 */

export interface Take {
  n: number;
  url: string;
  blob: Blob;
  seconds: number;
  light: "dark" | "good" | "bright" | "unknown";
  sound: "quiet" | "good" | "loud" | "unknown";
}

export interface Slate {
  name: string;
  project: string;
  roles: string[];
}

type Phase = "starting" | "setup" | "countdown" | "recording" | "review" | "nocamera";

const MAX_SECONDS = 120;
const SLATE_SECONDS = 3;

const MIME = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"];

const LIGHT_COPY = { dark: "Too dark. Face a window", good: "Light looks good", bright: "Too bright. Step back from the light", unknown: "Checking light" };
const SOUND_COPY = { quiet: "Can't hear you. Move closer", good: "Sound is clear", loud: "Too loud, it'll crackle", unknown: "Say a line to test" };

function lightVerdict(luma: number | null): Take["light"] {
  if (luma === null) return "unknown";
  if (luma < 70) return "dark";
  if (luma > 215) return "bright";
  return "good";
}

function soundVerdict(peak: number | null): Take["sound"] {
  if (peak === null) return "unknown";
  if (peak < 0.02) return "quiet";
  if (peak > 0.6) return "loud";
  return "good";
}

const fmt = (s: number) => {
  const r = Math.round(s);
  return `${Math.floor(r / 60)}:${String(r % 60).padStart(2, "0")}`;
};

/** a short wooden clap: noise burst plus a low knock, no audio files needed */
function playClap(ctx: AudioContext | null) {
  if (!ctx) return;
  const now = ctx.currentTime;
  const len = Math.floor(ctx.sampleRate * 0.09);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4);
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 900;
  const g = ctx.createGain();
  g.gain.value = 0.9;
  noise.connect(hp).connect(g).connect(ctx.destination);
  const knock = ctx.createOscillator();
  const kg = ctx.createGain();
  knock.frequency.setValueAtTime(180, now);
  knock.frequency.exponentialRampToValueAtTime(60, now + 0.08);
  kg.gain.setValueAtTime(0.6, now);
  kg.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  knock.connect(kg).connect(ctx.destination);
  noise.start(now);
  knock.start(now);
  knock.stop(now + 0.12);
}

function drawSlate(g: CanvasRenderingContext2D, w: number, h: number, lines: string[], take: number) {
  const bw = Math.round(w * 0.36);
  const bh = Math.round(h * 0.34);
  const x = Math.round(w * 0.04);
  const y = h - bh - Math.round(h * 0.06);
  const stripe = Math.round(bh * 0.16);
  // clapper stripes
  g.fillStyle = "#0a0b0f";
  g.fillRect(x, y, bw, stripe);
  g.fillStyle = "#ffffff";
  for (let sx = x - stripe; sx < x + bw; sx += stripe * 2) {
    g.beginPath();
    g.moveTo(Math.max(x, sx), y + stripe);
    g.lineTo(Math.min(x + bw, sx + stripe), y);
    g.lineTo(Math.min(x + bw, sx + stripe * 2), y);
    g.lineTo(Math.max(x, sx + stripe), y + stripe);
    g.closePath();
    g.fill();
  }
  // board
  g.fillStyle = "rgba(10,11,15,0.92)";
  g.fillRect(x, y + stripe, bw, bh - stripe);
  g.fillStyle = "#2f7fe6";
  g.font = `bold ${Math.round(bh * 0.09)}px monospace`;
  g.fillText(`KALEDIO SELF TAPE   TAKE ${take}`, x + bw * 0.05, y + stripe + bh * 0.15);
  g.fillStyle = "#ffffff";
  lines.forEach((line, i) => {
    g.font = `${i === 0 ? "bold " : ""}${Math.round(bh * (i === 0 ? 0.14 : 0.085))}px sans-serif`;
    g.fillText(line, x + bw * 0.05, y + stripe + bh * (0.33 + i * 0.15), bw * 0.9);
  });
}

export function SelfTapeBooth({
  slate,
  onUse,
  onClose,
}: {
  slate: Slate;
  onUse: (take: Take) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const rafRef = useRef(0);
  const takesRef = useRef<Take[]>([]);
  const usedRef = useRef<string | null>(null);
  const sampleRef = useRef({ lumaSum: 0, lumaN: 0, peak: 0 });

  const [phase, setPhase] = useState<Phase>("starting");
  const [luma, setLuma] = useState<number | null>(null);
  const [level, setLevel] = useState(0);
  const [count, setCount] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [clapped, setClapped] = useState(false);
  const [guides, setGuides] = useState(true);
  const [height, setHeight] = useState("");
  const [role, setRole] = useState(slate.roles[0] ?? "");
  const [takes, setTakes] = useState<Take[]>([]);
  const [pick, setPick] = useState(0);
  const [error, setError] = useState("");
  const [hasCamera, setHasCamera] = useState(false);

  // ——— camera + meters ———
  useEffect(() => {
    let cancelled = false;
    let meter = 0;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          audio: { echoCancellation: false, noiseSuppression: false },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        setHasCamera(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new Ctx();
        audioRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        ctx.createMediaStreamSource(stream).connect(analyser);
        analyserRef.current = analyser;

        const probe = document.createElement("canvas");
        probe.width = 32;
        probe.height = 18;
        const pg = probe.getContext("2d", { willReadFrequently: true })!;
        const wave = new Uint8Array(analyser.fftSize);
        let tick = 0;
        meter = window.setInterval(() => {
          analyser.getByteTimeDomainData(wave);
          let sum = 0;
          for (const v of wave) sum += ((v - 128) / 128) ** 2;
          const rms = Math.sqrt(sum / wave.length);
          setLevel(rms);
          sampleRef.current.peak = Math.max(sampleRef.current.peak, rms);
          if (++tick % 4 === 0 && videoRef.current && videoRef.current.readyState >= 2) {
            pg.drawImage(videoRef.current, 0, 0, 32, 18);
            const px = pg.getImageData(0, 0, 32, 18).data;
            let l = 0;
            for (let i = 0; i < px.length; i += 4) l += 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
            const avg = l / (px.length / 4);
            setLuma(avg);
            sampleRef.current.lumaSum += avg;
            sampleRef.current.lumaN += 1;
          }
        }, 100);
        setPhase("setup");
      } catch {
        if (!cancelled) setPhase("nocamera");
      }
    })();

    const takesAtMount = takesRef;
    const usedAtMount = usedRef;
    return () => {
      cancelled = true;
      window.clearInterval(meter);
      window.clearInterval(rafRef.current);
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioRef.current?.close().catch(() => {});
      // free every take except the one handed back to the application
      takesAtMount.current.forEach((t) => t.url !== usedAtMount.current && URL.revokeObjectURL(t.url));
    };
  }, []);

  // Esc closes (unless mid take)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase !== "recording" && phase !== "countdown") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [phase, onClose]);

  const slateLines = useCallback(
    () => [slate.name, [role, slate.project].filter(Boolean).join(" · "), [height && `Height ${height}`, new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })].filter(Boolean).join("   ")],
    [slate.name, slate.project, role, height]
  );

  const addTake = (t: Omit<Take, "n">) => {
    const take = { ...t, n: takesRef.current.length + 1 };
    takesRef.current = [...takesRef.current, take];
    setTakes(takesRef.current);
    setPick(takesRef.current.length - 1);
    setPhase("review");
  };

  const record = () => {
    const stream = streamRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!stream || !video || !canvas) return;
    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    canvas.width = w;
    canvas.height = h;
    const g = canvas.getContext("2d")!;
    const takeNo = takesRef.current.length + 1;
    const lines = slateLines();
    // a timer, not rAF: rAF stops in background tabs and would freeze the tape
    let started = -1;
    let t = 0;

    const draw = () => {
      const ts = performance.now();
      if (started < 0) started = ts;
      g.drawImage(video, 0, 0, w, h);
      t = (ts - started) / 1000;
      if (t < SLATE_SECONDS) drawSlate(g, w, h, lines, takeNo);
      setElapsed(t);
      if (t >= MAX_SECONDS) stop();
    };

    const mixed = new MediaStream([...canvas.captureStream(30).getVideoTracks(), ...stream.getAudioTracks()]);
    const mimeType = MIME.find((m) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.(m));
    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(mixed, mimeType ? { mimeType } : undefined);
    } catch {
      setError("This browser can't record here. Upload a tape instead.");
      setPhase("nocamera");
      return;
    }
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      window.clearInterval(rafRef.current);
      const blob = new Blob(chunks, { type: rec.mimeType || "video/webm" });
      const s = sampleRef.current;
      addTake({
        url: URL.createObjectURL(blob),
        blob,
        seconds: t,
        light: lightVerdict(s.lumaN ? s.lumaSum / s.lumaN : null),
        sound: soundVerdict(s.peak),
      });
    };
    recorderRef.current = rec;
    sampleRef.current = { lumaSum: 0, lumaN: 0, peak: 0 };
    draw();
    rec.start(500);
    rafRef.current = window.setInterval(draw, 1000 / 30);
    setPhase("recording");
  };

  const stop = () => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  };

  const roll = () => {
    setPhase("countdown");
    setClapped(false);
    setCount(3);
    audioRef.current?.resume().catch(() => {});
    let n = 3;
    const step = () => {
      n -= 1;
      if (n > 0) {
        setCount(n);
        window.setTimeout(step, 800);
        return;
      }
      setCount(0);
      setClapped(true);
      playClap(audioRef.current);
      navigator.vibrate?.(40);
      record();
    };
    window.setTimeout(step, 800);
  };

  const onUpload = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setError("That isn't a video file.");
      return;
    }
    const url = URL.createObjectURL(file);
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.onloadedmetadata = () =>
      addTake({ url, blob: file, seconds: Number.isFinite(probe.duration) ? probe.duration : 0, light: "unknown", sound: "unknown" });
    probe.onerror = () => addTake({ url, blob: file, seconds: 0, light: "unknown", sound: "unknown" });
    probe.src = url;
  };

  const use = () => {
    const t = takes[pick];
    if (!t) return;
    usedRef.current = t.url;
    onUse(t);
  };

  const light = lightVerdict(luma);
  const sound = level > 0 ? soundVerdict(level * 1.6) : "unknown";
  const current = takes[pick];
  const live = phase === "setup" || phase === "countdown" || phase === "recording";

  return (
    <div className="fixed inset-0 z-[500] flex flex-col bg-black text-white" role="dialog" aria-modal="true" aria-label="Self tape booth" style={{ animation: "fade-in 0.2s ease-out both" }}>
      {/* top bar */}
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">Self tape</span>
        <span className="truncate text-[14px] font-semibold">{slate.project}</span>
        {phase === "recording" && (
          <span className="ml-2 flex items-center gap-1.5 rounded bg-[#e5484d] px-2 py-0.5 font-mono text-[11px] font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-white" style={{ animation: "pulse-dot 1s ease-in-out infinite" }} /> REC {fmt(elapsed)}
          </span>
        )}
        <button
          onClick={onClose}
          disabled={phase === "recording" || phase === "countdown"}
          aria-label="Close self tape booth"
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20 disabled:opacity-30"
        >
          <IconX size={17} />
        </button>
      </div>

      <div className="grid min-h-0 flex-1 gap-0 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* ——— the frame ——— */}
        <div className="flex items-center justify-center p-3 sm:p-6">
          <div className="relative aspect-video w-full max-w-4xl overflow-hidden rounded-xl bg-[#0a0b0f] ring-1 ring-white/10">
            {/* live camera (mirrored like a mirror; the recording is not) */}
            <video ref={videoRef} muted playsInline className={`absolute inset-0 h-full w-full -scale-x-100 object-cover ${live ? "" : "hidden"}`} />
            {phase === "review" && current && (
              <video key={current.url} src={current.url} controls playsInline autoPlay className="absolute inset-0 h-full w-full bg-black object-contain" />
            )}
            <canvas ref={canvasRef} className="hidden" />

            {phase === "starting" && (
              <p className="absolute inset-0 flex items-center justify-center font-mono text-[12px] uppercase tracking-[0.2em] text-white/60">Waking up the camera…</p>
            )}

            {phase === "nocamera" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <p className="font-display text-[22px] font-bold">No camera here</p>
                <p className="max-w-sm text-[14px] text-white/70">
                  {error || "Allow camera access in your browser, or upload a tape you shot on your phone."}
                </p>
                <label className="press mt-2 cursor-pointer rounded-lg bg-brand-600 px-5 py-2.5 text-[14px] font-bold">
                  Upload a tape
                  <input type="file" accept="video/*" className="sr-only" onChange={(e) => onUpload(e.target.files?.[0])} />
                </label>
              </div>
            )}

            {/* framing guides */}
            {live && guides && (
              <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                <div className="absolute inset-y-0 left-1/3 border-l border-white/15" />
                <div className="absolute inset-y-0 left-2/3 border-l border-white/15" />
                <div className="absolute inset-x-0 top-1/3 border-t border-dashed border-brand-400/60">
                  <span className="absolute right-2 top-1 font-mono text-[10px] uppercase tracking-wider text-brand-400/90">eyes here</span>
                </div>
                <div className="absolute inset-x-0 top-2/3 border-t border-white/15" />
                <div className="absolute inset-[6%] rounded border border-white/10" />
              </div>
            )}

            {/* slate preview, shown the way it will be burned into the tape */}
            {(phase === "setup" || phase === "countdown" || (phase === "recording" && elapsed < SLATE_SECONDS)) && (
              <div className="pointer-events-none absolute bottom-[6%] left-[4%] w-[36%] min-w-[180px]">
                <div
                  className="h-3 origin-bottom-left rounded-t-sm sm:h-4"
                  style={{
                    background: "repeating-linear-gradient(135deg,#fff 0 12px,#0a0b0f 12px 24px)",
                    transform: clapped ? "rotate(0deg)" : "rotate(-14deg)",
                    transition: "transform 0.12s cubic-bezier(0.5,0,1,1)",
                  }}
                />
                <div className="h-2 sm:h-3" style={{ background: "repeating-linear-gradient(45deg,#fff 0 12px,#0a0b0f 12px 24px)" }} />
                <div className="rounded-b-md bg-[#0a0b0f]/90 p-2.5 sm:p-3">
                  <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-brand-400 sm:text-[10px]">
                    Kaledio self tape · take {takes.length + 1}
                  </p>
                  <p className="mt-1 truncate text-[14px] font-bold sm:text-[17px]">{slate.name}</p>
                  <p className="truncate text-[11px] text-white/75 sm:text-[12px]">{[role, slate.project].filter(Boolean).join(" · ")}</p>
                  <p className="truncate text-[11px] text-white/60 sm:text-[12px]">{height ? `Height ${height}` : "Add your height →"}</p>
                </div>
              </div>
            )}

            {/* 3 2 1 */}
            {phase === "countdown" && count > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <span key={count} className="font-display text-[120px] font-bold leading-none sm:text-[180px]" style={{ animation: "pop-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both" }}>
                  {count}
                </span>
              </div>
            )}
            {phase === "recording" && elapsed < 0.35 && <div className="pointer-events-none absolute inset-0 bg-white/80" style={{ animation: "fade-in 0.3s reverse both" }} />}
          </div>
        </div>

        {/* ——— side panel ——— */}
        <aside className="border-t border-white/10 p-4 sm:p-5 lg:border-l lg:border-t-0">
          {phase !== "review" ? (
            <>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">Your slate</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {slate.roles.length > 1 ? (
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    disabled={!live || phase !== "setup"}
                    aria-label="Role you're reading for"
                    className="col-span-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-[14px] text-white focus:border-brand-400 focus:outline-none"
                  >
                    {slate.roles.map((r) => (
                      <option key={r} className="text-black">
                        {r}
                      </option>
                    ))}
                  </select>
                ) : null}
                <input
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  disabled={phase !== "setup"}
                  placeholder="Height, e.g. 5'7"
                  aria-label="Your height"
                  className="col-span-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-[14px] text-white placeholder:text-white/35 focus:border-brand-400 focus:outline-none"
                />
              </div>

              <p className="mt-5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">Before you roll</p>
              <ul className="mt-2 space-y-2.5 text-[13.5px]">
                <li className="flex items-center gap-2.5">
                  <span className={`h-2 w-2 rounded-full ${light === "good" ? "bg-brand-400" : light === "unknown" ? "bg-white/30" : "bg-white"}`} />
                  <span className={light === "good" ? "text-white" : "text-white/75"}>{LIGHT_COPY[light]}</span>
                </li>
                <li>
                  <div className="flex items-center gap-2.5">
                    <span className={`h-2 w-2 rounded-full ${sound === "good" ? "bg-brand-400" : sound === "unknown" ? "bg-white/30" : "bg-white"}`} />
                    <span className={sound === "good" ? "text-white" : "text-white/75"}>{SOUND_COPY[sound]}</span>
                  </div>
                  <div className="ml-[18px] mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-brand-400 transition-[width] duration-100" style={{ width: `${Math.min(100, level * 260)}%` }} />
                  </div>
                </li>
                <li className="flex items-center gap-2.5">
                  <button onClick={() => setGuides((v) => !v)} className="flex items-center gap-2.5 text-white/75 hover:text-white">
                    <span className={`h-2 w-2 rounded-full ${guides ? "bg-brand-400" : "bg-white/30"}`} />
                    Eyes on the dotted line {guides ? "(guides on)" : "(guides off)"}
                  </button>
                </li>
              </ul>
              <p className="mt-5 text-[12.5px] leading-relaxed text-white/55">
                Slate first: say your name, height and city. The slate card burns into the first {SLATE_SECONDS} seconds so casting sees it even if they skip ahead. Max {MAX_SECONDS / 60} minutes.
              </p>

              <div className="mt-5">
                {phase === "recording" ? (
                  <button onClick={stop} className="press w-full rounded-lg bg-white py-3 text-[15px] font-bold text-black">
                    Cut
                  </button>
                ) : (
                  <button
                    onClick={roll}
                    disabled={phase !== "setup"}
                    className="press w-full rounded-lg bg-brand-600 py-3 text-[15px] font-bold text-white transition-colors hover:bg-brand-500 disabled:opacity-40"
                  >
                    {phase === "countdown" ? "Rolling…" : takes.length ? `Roll take ${takes.length + 1}` : "Roll camera"}
                  </button>
                )}
                {phase === "setup" && (
                  <label className="mt-2 block cursor-pointer text-center text-[12.5px] font-semibold text-white/55 hover:text-white">
                    or upload one you already shot
                    <input type="file" accept="video/*" className="sr-only" onChange={(e) => onUpload(e.target.files?.[0])} />
                  </label>
                )}
              </div>
            </>
          ) : (
            current && (
              <>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">Takes</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {takes.map((t, i) => (
                    <button
                      key={t.url}
                      onClick={() => setPick(i)}
                      aria-pressed={i === pick}
                      className={`rounded-lg border px-3 py-1.5 font-mono text-[12px] font-bold ${
                        i === pick ? "border-brand-400 bg-brand-600 text-white" : "border-white/15 text-white/70 hover:border-white/40"
                      }`}
                    >
                      Take {t.n} · {fmt(t.seconds)}
                    </button>
                  ))}
                </div>

                <p className="mt-5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">Quick check</p>
                <ul className="mt-2 space-y-2 text-[13.5px]">
                  <li className="flex items-center gap-2.5">
                    <span className={`h-2 w-2 rounded-full ${current.light === "good" ? "bg-brand-400" : "bg-white/40"}`} />
                    {current.light === "unknown" ? "Light: we didn't check an uploaded tape" : LIGHT_COPY[current.light]}
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className={`h-2 w-2 rounded-full ${current.sound === "good" ? "bg-brand-400" : "bg-white/40"}`} />
                    {current.sound === "unknown" ? "Sound: we didn't check an uploaded tape" : SOUND_COPY[current.sound]}
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className={`h-2 w-2 rounded-full ${current.seconds >= 15 ? "bg-brand-400" : "bg-white/40"}`} />
                    {current.seconds >= 15 ? `${fmt(current.seconds)} long, good length` : "Pretty short. Did you get the whole scene?"}
                  </li>
                </ul>

                <div className="mt-6 grid gap-2">
                  <button onClick={use} className="press w-full rounded-lg bg-brand-600 py-3 text-[15px] font-bold text-white transition-colors hover:bg-brand-500">
                    Use take {current.n}
                  </button>
                  {hasCamera ? (
                    <button onClick={() => setPhase("setup")} className="press w-full rounded-lg border border-white/20 py-3 text-[14px] font-semibold text-white hover:border-white/50">
                      Go again
                    </button>
                  ) : (
                    <label className="press block w-full cursor-pointer rounded-lg border border-white/20 py-3 text-center text-[14px] font-semibold text-white hover:border-white/50">
                      Upload a different one
                      <input type="file" accept="video/*" className="sr-only" onChange={(e) => onUpload(e.target.files?.[0])} />
                    </label>
                  )}
                </div>
              </>
            )
          )}
        </aside>
      </div>
    </div>
  );
}
