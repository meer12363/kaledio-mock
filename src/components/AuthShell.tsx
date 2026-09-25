"use client";

import Link from "next/link";
import { Logo } from "./Logo";
import { MediaPlaceholder } from "./Media";

export function AuthShell({
  children,
  quote,
  credit,
}: {
  children: React.ReactNode;
  quote: string;
  credit: string;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_0.9fr]">
      {/* form side */}
      <div className="flex flex-col px-6 py-6 sm:px-10">
        <Link href="/" aria-label="Back to Kaledio home" className="w-fit">
          <Logo size={28} />
        </Link>
        <div className="anim-rise mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          {children}
        </div>
      </div>

      {/* brand side */}
      <div className="relative hidden overflow-hidden [background:var(--grad-hero)] grad-animate lg:block">
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(700px 480px at 20% 10%, rgba(24,120,209,0.4), transparent)" }}
        />
        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="grid grid-cols-2 gap-4 pt-6">
            <MediaPlaceholder
              item={{ id: "auth1", title: "Saltwater S2", kind: "OTT Series", year: "2025", tone: "steel", aspect: "wide" }}
              className="shadow-pop"
            />
            <MediaPlaceholder
              item={{ id: "auth2", title: "Gulmohar Lane", kind: "Theatre", year: "2023", tone: "dusk", aspect: "wide" }}
              className="mt-10 shadow-pop"
            />
            <MediaPlaceholder
              item={{ id: "auth3", title: "String session", kind: "Score · BTS", year: "2025", tone: "noir", aspect: "wide" }}
              className="shadow-pop"
            />
            <MediaPlaceholder
              item={{ id: "auth4", title: "Auréa Campaign", kind: "Print", year: "2025", tone: "porcelain", aspect: "wide" }}
              className="mt-10 shadow-pop"
            />
          </div>
          <blockquote className="max-w-md">
            <p className="font-display text-2xl font-medium leading-snug text-white">
              &ldquo;{quote}&rdquo;
            </p>
            <footer className="mt-4 text-sm font-medium text-brand-200">{credit}</footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
}

export function Field({
  label,
  error,
  children,
  hint,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-700">{label}</span>
      {children}
      {hint && !error && <span className="mt-1.5 block text-xs text-ink-400">{hint}</span>}
      {error && (
        <span role="alert" className="mt-1.5 block text-xs font-medium text-danger">
          {error}
        </span>
      )}
    </label>
  );
}

export const inputClass = (invalid?: boolean) =>
  `w-full rounded-lg border bg-paper px-3.5 py-2.5 text-[15px] text-ink-900 placeholder:text-ink-300 transition-colors duration-150 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 ${
    invalid ? "border-danger" : "border-line-strong"
  }`;
