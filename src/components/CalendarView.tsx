"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type CalendarEventKind = "audition" | "deadline" | "shoot" | "custom";

export interface CalendarEvent {
  id?: string;
  dateISO: string; // YYYY-MM-DD
  kind: CalendarEventKind;
  label: string;
  href?: string;
}

export const EVENT_META: Record<CalendarEventKind, { label: string; dot: string; chip: string }> = {
  audition: { label: "Audition", dot: "bg-brand-600", chip: "bg-brand-50 text-brand-700" },
  deadline: { label: "Deadline", dot: "bg-warn", chip: "bg-amber-50 text-warn" },
  shoot: { label: "Shoot / rehearsal", dot: "bg-go", chip: "bg-go-soft text-go" },
  custom: { label: "Your event", dot: "bg-ink-500", chip: "bg-canvas text-ink-600" },
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function isoOf(y: number, m: number, day: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function CalendarView({
  events,
  onRemoveCustom,
}: {
  events: CalendarEvent[];
  onRemoveCustom?: (id: string) => void;
}) {
  const today = new Date();
  const todayISO = isoOf(today.getFullYear(), today.getMonth(), today.getDate());
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const list = map.get(e.dateISO) ?? [];
      list.push(e);
      map.set(e.dateISO, list);
    }
    return map;
  }, [events]);

  const step = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Monday-first offset
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const cells: Array<number | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const upcoming = useMemo(
    () =>
      [...events]
        .filter((e) => e.dateISO >= todayISO)
        .sort((a, b) => a.dateISO.localeCompare(b.dateISO))
        .slice(0, 6),
    [events, todayISO]
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[15px] font-semibold text-ink-900">
          {MONTHS[month]} <span className="text-ink-400">{year}</span>
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => step(-1)}
            aria-label="Previous month"
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-canvas hover:text-ink-800"
          >
            ←
          </button>
          <button
            onClick={() => step(1)}
            aria-label="Next month"
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-canvas hover:text-ink-800"
          >
            →
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAYS.map((w) => (
          <span key={w} className="pb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
            {w}
          </span>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <span key={`pad-${i}`} />;
          const iso = isoOf(year, month, day);
          const dayEvents = byDate.get(iso) ?? [];
          const isToday = iso === todayISO;
          return (
            <div
              key={iso}
              className={`mx-auto flex h-11 w-11 flex-col items-center justify-center rounded-lg text-[13px] ${
                isToday
                  ? "bg-brand-600 font-bold text-white"
                  : dayEvents.length
                    ? "bg-canvas font-semibold text-ink-900"
                    : "text-ink-600"
              }`}
              title={dayEvents.map((e) => e.label).join("\n") || undefined}
            >
              {day}
              {dayEvents.length > 0 && (
                <span className="mt-0.5 flex gap-0.5">
                  {dayEvents.slice(0, 3).map((e, j) => (
                    <span
                      key={j}
                      className={`h-1.5 w-1.5 rounded-full ${isToday ? "bg-white" : EVENT_META[e.kind].dot}`}
                    />
                  ))}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-line pt-3.5">
        {(Object.keys(EVENT_META) as CalendarEventKind[]).map((k) => (
          <span key={k} className="flex items-center gap-1.5 text-xs font-medium text-ink-500">
            <span className={`h-1.5 w-1.5 rounded-full ${EVENT_META[k].dot}`} />
            {EVENT_META[k].label}
          </span>
        ))}
      </div>

      <div className="mt-5">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">Coming up</h3>
        {upcoming.length === 0 ? (
          <p className="mt-2.5 text-sm text-ink-400">Nothing on the calendar yet — go tape something.</p>
        ) : (
          <ul className="mt-2.5 space-y-1">
            {upcoming.map((e, i) => {
              const [, m, dd] = e.dateISO.split("-").map(Number);
              const dateLabel = `${dd} ${MONTHS[m - 1].slice(0, 3)}`;
              const inner = (
                <>
                  <span className="w-12 shrink-0 font-mono text-[12px] font-semibold tabular-nums text-ink-500">
                    {dateLabel}
                  </span>
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${EVENT_META[e.kind].dot}`} />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink-800">{e.label}</span>
                </>
              );
              return (
                <li key={`${e.dateISO}-${i}`} className="flex items-center">
                  {e.href ? (
                    <Link href={e.href} className="flex flex-1 items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-canvas">
                      {inner}
                    </Link>
                  ) : (
                    <span className="flex flex-1 items-center gap-2.5 px-2 py-1.5">{inner}</span>
                  )}
                  {e.kind === "custom" && e.id && onRemoveCustom && (
                    <button
                      onClick={() => onRemoveCustom(e.id!)}
                      aria-label={`Remove ${e.label}`}
                      className="shrink-0 rounded-full px-2 py-1 text-xs text-ink-400 transition-colors hover:bg-canvas hover:text-danger"
                    >
                      ✕
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
