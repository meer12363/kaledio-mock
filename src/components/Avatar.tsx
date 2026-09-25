// jewel-tone gradients that read well on the dark canvas
const TONES: Array<{ bg: string; fg: string }> = [
  { bg: "linear-gradient(135deg,#ff9410,#ff4f7b)", fg: "#1a0a02" },
  { bg: "linear-gradient(135deg,#3d8ef0,#8a2bd6)", fg: "#ffffff" },
  { bg: "linear-gradient(135deg,#3ddc97,#1e7fbf)", fg: "#03140d" },
  { bg: "linear-gradient(135deg,#d7ff3a,#3ddc97)", fg: "#0f1402" },
  { bg: "linear-gradient(135deg,#c94ad8,#ff4f7b)", fg: "#ffffff" },
  { bg: "linear-gradient(135deg,#ffd1a3,#ff7a3d)", fg: "#2a1204" },
  { bg: "linear-gradient(135deg,#1e4fbf,#3ddcd1)", fg: "#ffffff" },
  { bg: "linear-gradient(135deg,#ffb13b,#d7ff3a)", fg: "#1a1402" },
  { bg: "linear-gradient(135deg,#6a1b9a,#c94ad8)", fg: "#ffffff" },
  { bg: "linear-gradient(135deg,#ff5a64,#ff9410)", fg: "#ffffff" },
  { bg: "linear-gradient(135deg,#2b333d,#6c7480)", fg: "#ffffff" },
  { bg: "linear-gradient(135deg,#7ab5f5,#e086ec)", fg: "#0c0a1f" },
  { bg: "linear-gradient(135deg,#0e4c7a,#3ddc97)", fg: "#ffffff" },
  { bg: "linear-gradient(135deg,#a1227e,#ff9410)", fg: "#ffffff" },
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
