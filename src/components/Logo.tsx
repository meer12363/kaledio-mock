/** Badge mark: rounded-square gradient tile with a camera glyph inside. */
export function CameraMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect x="0.5" y="0.5" width="31" height="31" rx="9" fill="url(#kaledio-badge-fill)" />
      <rect x="0.5" y="0.5" width="31" height="31" rx="9" fill="url(#kaledio-badge-gloss)" />
      <path
        d="M9.5 12.5h2.1l1-1.6h6.8l1 1.6h2.1a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 8 21v-7a1.5 1.5 0 0 1 1.5-1.5Z"
        fill="#0a0b0f"
      />
      <circle cx="16" cy="17.1" r="3.1" fill="#ff7a3d" />
      <circle cx="16" cy="17.1" r="1.15" fill="#0a0b0f" />
      <defs>
        <linearGradient id="kaledio-badge-fill" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffb13b" />
          <stop offset="0.55" stopColor="#ff4f7b" />
          <stop offset="1" stopColor="#c94ad8" />
        </linearGradient>
        <linearGradient id="kaledio-badge-gloss" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" stopOpacity="0.28" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Logo({
  size = 28,
  wordmark = true,
  className = "",
}: {
  size?: number;
  wordmark?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <CameraMark size={size} />
      {wordmark && (
        <span
          className="font-display font-extrabold lowercase text-ink-900"
          style={{ fontSize: size * 0.78, letterSpacing: "-0.04em" }}
        >
          kaledio<span className="text-accent-500">.</span>
        </span>
      )}
    </span>
  );
}
