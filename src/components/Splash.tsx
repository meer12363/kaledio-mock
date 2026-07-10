"use client";

// Launch splash: the camera mark draws itself in, the wordmark rises, then the
// whole screen lifts away. Plays once per browser session.
export function Splash({ leaving }: { leaving: boolean }) {
  return (
    <div
      className="fixed inset-0 z-[1100] flex flex-col items-center justify-center bg-paper transition-opacity duration-500"
      style={{ opacity: leaving ? 0 : 1 }}
      role="status"
      aria-label="Kaledio is starting"
    >
      <svg width="88" height="88" viewBox="0 0 32 32" fill="none" aria-hidden="true" className="text-brand-600">
        <rect
          x="2.5"
          y="9"
          width="27"
          height="19"
          rx="4.5"
          stroke="currentColor"
          strokeWidth="1.6"
          pathLength={1}
          style={{ strokeDasharray: 1, animation: "splash-draw 0.9s cubic-bezier(0.65, 0, 0.35, 1) both" }}
        />
        <path
          d="M10.5 9 L13 4.5 h6 L21.5 9"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
          pathLength={1}
          style={{ strokeDasharray: 1, animation: "splash-draw 0.5s cubic-bezier(0.65, 0, 0.35, 1) 0.55s both" }}
        />
        <circle
          cx="16"
          cy="18.5"
          r="5.5"
          stroke="currentColor"
          strokeWidth="1.6"
          pathLength={1}
          style={{ strokeDasharray: 1, animation: "splash-draw 0.7s cubic-bezier(0.65, 0, 0.35, 1) 0.45s both" }}
        />
        <circle
          cx="16"
          cy="18.5"
          r="1.6"
          fill="currentColor"
          style={{ transformBox: "fill-box", transformOrigin: "center", animation: "splash-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) 1.05s both" }}
        />
        <circle
          cx="25.2"
          cy="13.4"
          r="1.4"
          fill="currentColor"
          style={{ transformBox: "fill-box", transformOrigin: "center", animation: "splash-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) 1.15s both" }}
        />
      </svg>
      <p
        className="mt-5 overflow-hidden text-[26px] font-semibold tracking-tight text-ink-900"
        aria-hidden="true"
      >
        <span className="inline-block" style={{ animation: "splash-rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) 1.1s both" }}>
          Kaledio
        </span>
      </p>
      <p
        className="mt-1 text-[13px] font-medium text-ink-400"
        style={{ animation: "fade-in 0.6s ease-out 1.45s both" }}
      >
        Where the industry finds its people
      </p>
    </div>
  );
}
