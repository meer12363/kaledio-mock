const TONES: Array<{ bg: string; fg: string }> = [
  { bg: "#0c3157", fg: "#d9e9f8" },
  { bg: "#dce7f2", fg: "#08519d" },
  { bg: "#10161c", fg: "#e4e9ee" },
  { bg: "#b3d3f1", fg: "#0a4076" },
  { bg: "#2c3844", fg: "#d3dae1" },
  { bg: "#eef2f6", fg: "#2c3844" },
  { bg: "#08519d", fg: "#d9e9f8" },
  { bg: "#1b2a3a", fg: "#b3d3f1" },
  { bg: "#e7eef6", fg: "#0c3157" },
  { bg: "#0b66c3", fg: "#eef5fc" },
  { bg: "#33465c", fg: "#d9e9f8" },
  { bg: "#cfdded", fg: "#10314f" },
  { bg: "#122336", fg: "#7fb4e6" },
  { bg: "#4a5560", fg: "#eef2f6" },
];

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export function toneOf(hue: number) {
  return TONES[((hue % TONES.length) + TONES.length) % TONES.length];
}

export function Avatar({
  name,
  hue,
  size = 40,
  ring = false,
  src,
}: {
  name: string;
  hue: number;
  size?: number;
  ring?: boolean;
  /** uploaded profile picture (data URL) — takes over from initials */
  src?: string;
}) {
  const tone = toneOf(hue);
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- data URLs don't go through next/image
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className={`inline-block shrink-0 select-none rounded-full object-cover ${
          ring ? "ring-2 ring-paper shadow-card" : ""
        }`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className={`inline-flex select-none items-center justify-center rounded-full font-semibold ${
        ring ? "ring-2 ring-paper shadow-card" : ""
      }`}
      style={{
        width: size,
        height: size,
        background: tone.bg,
        color: tone.fg,
        fontSize: Math.max(10, size * 0.36),
        letterSpacing: "0.02em",
      }}
      aria-hidden="true"
    >
      {initialsOf(name)}
    </span>
  );
}
