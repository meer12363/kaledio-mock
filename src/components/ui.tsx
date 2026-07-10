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
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

export function Chip({
  children,
  active = false,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  const Comp = onClick ? "button" : "span";
  return (
    <Comp
      onClick={onClick}
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors duration-150 ${
        active
          ? "border-brand-600 bg-brand-600 text-white"
          : "border-line bg-paper text-ink-600 " + (onClick ? "hover:border-brand-300 hover:text-brand-700" : "")
      }`}
    >
      {children}
    </Comp>
  );
}

export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-canvas px-2 py-0.5 text-xs font-medium text-ink-600">
      {children}
    </span>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-line bg-paper shadow-card ${className}`}>
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line-strong px-6 py-14 text-center">
      <p className="text-[15px] font-semibold text-ink-700">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-ink-500">{hint}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-canvas ${className}`} />;
}
