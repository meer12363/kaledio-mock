/** Badge mark: rounded-square blue tile with a white camera glyph inside. */
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
      <rect x="0.5" y="0.5" width="31" height="31" rx="9" fill="var(--color-brand-600)" />
      <rect x="0.5" y="0.5" width="31" height="31" rx="9" fill="url(#kaledio-badge-gloss)" />
      <path
        d="M9.5 12.5h2.1l1-1.6h6.8l1 1.6h2.1a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 8 21v-7a1.5 1.5 0 0 1 1.5-1.5Z"
        fill="white"
      />
      <circle cx="16" cy="17.1" r="3.1" fill="var(--color-brand-600)" />
      <circle cx="16" cy="17.1" r="1.15" fill="white" />
      <defs>
        <linearGradient id="kaledio-badge-gloss" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" stopOpacity="0.16" />
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
          className="font-bold uppercase tracking-wide text-ink-900"
          style={{ fontSize: size * 0.62, letterSpacing: "0.03em" }}
        >
          Kaledio
        </span>
      )}
    </span>
  );
}
