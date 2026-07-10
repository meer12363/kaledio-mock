"use client";

// Full-screen cinematic loader: rotating aperture, wordmark, sweep bar.
// Chords between points 140° apart trace the hexagonal iris envelope.
const BLADES = [
  ["59.0,32.0", "11.3,49.4"],
  ["45.5,55.4", "6.6,22.8"],
  ["18.5,55.4", "27.3,5.4"],
  ["5.0,32.0", "52.7,14.6"],
  ["18.5,8.6", "57.4,41.2"],
  ["45.5,8.6", "36.7,58.6"],
];

export function Aperture({ size = 72 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="30" stroke="var(--color-brand-200)" strokeWidth="2" />
      <g
        style={{
          transformOrigin: "32px 32px",
          animation: "iris-spin 2.6s cubic-bezier(0.6, 0.05, 0.3, 0.95) infinite",
        }}
        stroke="var(--color-brand-600)"
        strokeWidth="2"
        strokeLinecap="round"
      >
        {BLADES.map(([a, b], i) => {
          const [x1, y1] = a.split(",");
          const [x2, y2] = b.split(",");
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
      </g>
      <circle
        cx="32"
        cy="32"
        r="6"
        fill="var(--color-brand-600)"
        style={{
          transformOrigin: "32px 32px",
          animation: "iris-breathe 1.3s ease-in-out infinite",
        }}
      />
    </svg>
  );
}

export function LoadingScreen({ message }: { message: string }) {
  return (
    <div
      className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-paper anim-fade"
      role="status"
      aria-live="polite"
    >
      <Aperture />
      <p className="mt-6 text-xl font-semibold tracking-tight text-ink-900">
        Kaledio
      </p>
      <p className="mt-1.5 text-sm text-ink-500">{message}</p>
      <div className="mt-8 h-0.5 w-44 overflow-hidden rounded-full bg-brand-100">
        <div
          className="h-full w-full rounded-full bg-brand-600"
          style={{ animation: "loader-bar 1.5s cubic-bezier(0.65, 0, 0.35, 1) infinite" }}
        />
      </div>
    </div>
  );
}
