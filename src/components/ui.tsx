import type { Availability } from "@/lib/types";

export const AVAILABILITY_META: Record<
  Availability,
  { label: string; dot: string; chip: string }
> = {
  open: {
    label: "Open to work",
    dot: "bg-go",
    chip: "bg-go-soft text-go",
  },
  listening: {
    label: "Open to offers",
    dot: "bg-brand-500",
    chip: "bg-brand-50 text-brand-700",
  },
  booked: {
    label: "Booked till late 2026",
    dot: "bg-ink-400",
    chip: "bg-canvas text-ink-600",
  },
};

export function AvailabilityBadge({ status }: { status: Availability }) {
  const meta = AVAILABILITY_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.chip}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${meta.dot}`}
        style={status === "open" ? { animation: "pulse-dot 2s ease-in-out infinite" } : undefined}
      />
      {meta.label}
    </span>
  );
}

export function Chip({
  children,
  active = false,
  onClick,
  tone = "brand",
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  tone?: "brand" | "accent";
}) {
  const Comp = onClick ? "button" : "span";
  const activeCls =
    tone === "accent"
      ? "border-volt bg-volt text-black shadow-glow-volt"
      : "border-ink-900 bg-ink-900 text-canvas";
  return (
    <Comp
      onClick={onClick}
      className={`inline-flex items-center rounded-xl border px-3.5 py-1.5 text-[13px] font-semibold transition-all duration-200 press ${
        active
          ? activeCls
          : "border-line-strong bg-paper text-ink-600 " +
            (onClick ? "hover:border-ink-400 hover:text-ink-900 hover:-translate-y-0.5" : "")
      }`}
    >
      {children}
    </Comp>
  );
}

export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-line bg-white/[0.03] px-2 py-0.5 text-xs font-medium text-ink-600 transition-colors hover:border-ink-400 hover:text-ink-900">
      {children}
    </span>
  );
}

export function Card({
  children,
  className = "",
  interactive = false,
  glow = false,
}: {
  children: React.ReactNode;
  className?: string;
  /** adds hover-lift transition */
  interactive?: boolean;
  /** brand-tinted resting shadow */
  glow?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border border-line bg-paper shadow-card ${
        interactive ? "hover-lift hover:border-white/15" : ""
      } ${glow ? "shadow-lift" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

type ButtonVariant = "primary" | "accent" | "ghost" | "outline";

const BTN_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-ink-900 text-canvas hover:bg-white shadow-sm",
  accent: "text-black font-bold hover:shadow-glow-accent [background:var(--grad-spotlight)]",
  ghost: "text-ink-600 hover:bg-white/[0.05] hover:text-ink-900",
  outline: "border border-line-strong bg-transparent text-ink-800 hover:border-ink-400 hover:text-ink-900",
};

export function Button({
  children,
  variant = "primary",
  className = "",
  type = "button",
  ...rest
}: {
  children: React.ReactNode;
  variant?: ButtonVariant;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={`press sheen inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none ${BTN_VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function EmptyState({
  title,
  hint,
  action,
  icon,
}: {
  title: string;
  hint: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="anim-pop flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-paper/60 px-6 py-14 text-center">
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 anim-float">
          {icon}
        </div>
      )}
      <p className="text-[15px] font-semibold text-ink-800">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-ink-500">{hint}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`shimmer rounded-lg ${className}`} />;
}
