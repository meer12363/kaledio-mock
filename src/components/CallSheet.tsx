"use client";

import Link from "next/link";
import { IconBookmark, IconCheck } from "./icons";
import { daysUntil, useToday } from "@/lib/clock";

/**
 * Casting calls drawn as the thing everyone on a set already reads: a call
 * sheet. Ruled boxes, mono labels, a sheet number and a rubber stamp. Black,
 * white and Kaledio blue only.
 */

export interface SheetCall {
  id: string;
  title: string;
  company: string;
  medium: string;
  location: string;
  compensation: string;
  deadline: string;
  deadlineISO?: string;
  applicants: number;
  roles: number;
  hot?: boolean;
  byName?: string;
}

/** stable "No. 0142" style number per call */
export function sheetNumber(id: string): string {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return String(h % 9000 + 1000);
}

function parseDeadline(call: SheetCall): string | null {
  if (call.deadlineISO) return call.deadlineISO;
  const t = Date.parse(call.deadline);
  if (Number.isNaN(t)) return null;
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** "6 days left" / "Last day" / "Closed", or null before hydration */
export function useCountdown(call: SheetCall): { label: string; urgent: boolean; closed: boolean } | null {
  const today = useToday();
  const iso = parseDeadline(call);
  if (!today || !iso) return null;
  const n = daysUntil(iso, today);
  if (n < 0) return { label: "Closed", urgent: false, closed: true };
  if (n === 0) return { label: "Last day to apply", urgent: true, closed: false };
  if (n === 1) return { label: "Closes tomorrow", urgent: true, closed: false };
  return { label: `${n} days left`, urgent: n <= 5, closed: false };
}

export function Stamp({ children, tone = "blue", className = "" }: { children: React.ReactNode; tone?: "blue" | "ink"; className?: string }) {
  return (
    <span
      className={`inline-block -rotate-6 rounded-[4px] border-2 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase leading-none tracking-[0.14em] ${
        tone === "blue" ? "border-brand-600 text-brand-600" : "border-ink-900 text-ink-900"
      } ${className}`}
    >
      {children}
    </span>
  );
}

function Cell({ label, value, className = "" }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={`min-w-0 px-3 py-2.5 ${className}`}>
      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-ink-400">{label}</p>
      <p className="mt-0.5 truncate text-[13px] font-semibold text-ink-900">{value}</p>
    </div>
  );
}

/** board card */
export function CallSheetCard({
  call,
  applied,
  saved,
  onApply,
  onSave,
}: {
  call: SheetCall;
  applied: boolean;
  saved: boolean;
  onApply: () => void;
  onSave: () => void;
}) {
  const left = useCountdown(call);
  const href = `/casting/${call.id}`;
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-ink-900/15 bg-paper shadow-card transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-brand-600/60">
      {/* sheet header strip */}
      <div className="flex items-center gap-2 border-b border-ink-900/15 bg-ink-900 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-canvas">
        <span>Call sheet</span>
        <span className="opacity-50">No. {sheetNumber(call.id)}</span>
        <span className="ml-auto opacity-80">{call.medium}</span>
      </div>

      <Link href={href} className="relative block px-4 pb-3 pt-4">
        {call.hot && <Stamp className="absolute right-4 top-3">Hot</Stamp>}
        <h2 className="pr-14 font-display text-[18px] font-bold leading-snug text-ink-900 decoration-brand-600 decoration-2 underline-offset-4 group-hover:underline">
          {call.title}
        </h2>
        <p className="mt-1 truncate text-[13px] text-ink-500">{call.company}</p>
      </Link>

      <Link href={href} className="grid grid-cols-3 divide-x divide-ink-900/15 border-y border-ink-900/15">
        <Cell label="Apply by" value={call.deadline} />
        <Cell label="Location" value={call.location} />
        <Cell label="Rate" value={call.compensation} />
      </Link>

      <div className="mt-auto flex items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className={`font-mono text-[11px] font-bold uppercase tracking-wider ${left?.urgent ? "text-brand-600" : "text-ink-500"}`}>
            {left ? (left.urgent ? "● " : "") + left.label : " "}
          </p>
          <p className="text-[12px] text-ink-400">
            {call.roles} {call.roles === 1 ? "role" : "roles"} · {call.applicants} applied
          </p>
        </div>
        <button
          onClick={onSave}
          aria-label={saved ? "Saved to calendar" : "Save to calendar"}
          aria-pressed={saved}
          className="press flex h-9 w-9 items-center justify-center rounded-lg border border-ink-900/15 text-ink-500 transition-colors hover:border-brand-600 hover:text-brand-600"
        >
          <IconBookmark size={16} filled={saved} className={saved ? "text-brand-600" : ""} />
        </button>
        {applied ? (
          <Link href={href} className="flex h-9 items-center gap-1.5 rounded-lg border border-brand-600/50 px-3 text-[13px] font-bold text-brand-600">
            <IconCheck size={14} /> Applied
          </Link>
        ) : (
          <button
            onClick={onApply}
            disabled={left?.closed}
            className="press h-9 rounded-lg bg-brand-600 px-4 text-[13px] font-bold text-white transition-colors hover:bg-brand-500 disabled:opacity-40"
          >
            Apply
          </button>
        )}
      </div>
    </article>
  );
}

/** top of the casting detail page */
export function CallSheetHeader({
  call,
  shootDates,
  requiresAudition,
  postedAgo,
  poster,
}: {
  call: SheetCall;
  shootDates: string;
  requiresAudition: boolean;
  postedAgo: string;
  poster: React.ReactNode;
}) {
  const left = useCountdown(call);
  return (
    <section className="anim-rise overflow-hidden rounded-2xl border border-ink-900/20 bg-paper shadow-card">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-ink-900 px-4 py-2 font-mono text-[10.5px] font-bold uppercase tracking-[0.18em] text-canvas sm:px-6">
        <span>Kaledio call sheet</span>
        <span className="opacity-50">No. {sheetNumber(call.id)}</span>
        <span className="ml-auto opacity-70">Posted {postedAgo} ago</span>
      </div>

      <div className="relative px-4 py-5 sm:px-6 sm:py-6">
        <div className="absolute right-4 top-5 flex flex-col items-end gap-2 sm:right-6">
          {call.hot && <Stamp>Hot</Stamp>}
          <Stamp tone="ink" className="rotate-3">
            {requiresAudition ? "Self tape" : "Direct offer"}
          </Stamp>
        </div>
        <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.18em] text-brand-600">{call.medium}</p>
        <h1 className="mt-2 max-w-[85%] text-balance font-display text-[28px] font-bold leading-[1.05] tracking-[-0.03em] text-ink-900 sm:text-[38px]">
          {call.title}
        </h1>
        <div className="mt-4">{poster}</div>
      </div>

      <dl className="grid grid-cols-2 border-t border-ink-900/20 sm:grid-cols-4 [&>div]:border-ink-900/20 [&>div:nth-child(odd)]:border-r sm:[&>div]:border-r sm:[&>div:last-child]:border-r-0 [&>div:nth-child(-n+2)]:border-b sm:[&>div:nth-child(-n+2)]:border-b-0">
        {[
          { label: "Shoot", value: shootDates },
          { label: "Location", value: call.location },
          { label: "Rate", value: call.compensation },
          { label: "Apply by", value: call.deadline },
        ].map((f) => (
          <div key={f.label} className="px-4 py-3 sm:px-6">
            <dt className="font-mono text-[9.5px] font-bold uppercase tracking-[0.16em] text-ink-400">{f.label}</dt>
            <dd className="mt-1 text-[14px] font-semibold leading-snug text-ink-900">{f.value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-ink-900/20 bg-ink-900/[0.03] px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-wider sm:px-6">
        <span className={left?.urgent ? "text-brand-600" : "text-ink-600"}>{left ? `${left.urgent ? "● " : ""}${left.label}` : " "}</span>
        <span className="text-ink-400">{call.applicants} applied</span>
        <span className="text-ink-400">
          {call.roles} {call.roles === 1 ? "role" : "roles"}
        </span>
      </div>
    </section>
  );
}

/** cast list rows, the way a call sheet lists characters */
export function CastList({ roles }: { roles: Array<{ name: string; brief: string }> }) {
  return (
    <ol className="divide-y divide-ink-900/15 overflow-hidden rounded-xl border border-ink-900/15">
      {roles.map((r, i) => (
        <li key={r.name} className="grid grid-cols-[44px_minmax(0,1fr)] items-start">
          <span className="h-full border-r border-ink-900/15 bg-ink-900/[0.03] py-3 text-center font-mono text-[12px] font-bold text-ink-400">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="px-4 py-3">
            <p className="text-[15px] font-bold text-ink-900">{r.name}</p>
            <p className="mt-0.5 text-[13.5px] leading-relaxed text-ink-600">{r.brief}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
