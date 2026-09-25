"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { CalendarView, type CalendarEvent } from "@/components/CalendarView";
import { Card, EmptyState, Skeleton, Tag } from "@/components/ui";
import {
  IconBriefcase,
  IconCalendar,
  IconCheck,
  IconChevronDown,
  IconClapper,
  IconMapPin,
  IconX,
} from "@/components/icons";
import { gql } from "@/lib/gql";
import { useSession } from "@/lib/session";
import { MOCK_PEOPLE } from "@/lib/mock";
import type { ApplicationStatus } from "@/lib/types";

const STATUS_META: Record<ApplicationStatus, { label: string; chip: string }> = {
  applied: { label: "Applied", chip: "bg-brand-50 text-brand-700" },
  audition_requested: { label: "Audition requested", chip: "bg-accent-50 text-warn" },
  finalized: { label: "Finalized", chip: "bg-go-soft text-go" },
  rejected: { label: "Not selected", chip: "bg-canvas text-ink-500" },
};

type Tab = "work" | "studio";

export default function DashboardPage() {
  const { user } = useSession();
  const [tab, setTab] = useState<Tab>("work");
  if (!user) return null;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 p-6 text-white shadow-lift [background:var(--grad-hero)] grad-animate">
        <div className="absolute inset-0 opacity-40 [background:var(--grad-mesh)]" />
        <div className="pointer-events-none absolute -right-4 -top-6 anim-float text-[100px] leading-none opacity-15">🎯</div>
        <div className="relative">
          <h1 className="font-display text-[40px] font-extrabold leading-[0.95] sm:text-[56px]">My Work</h1>
          <p className="mt-1.5 max-w-md text-[14px] text-white/85">
            Track what you&apos;re applying for, and hire for what you&apos;re making — both live here.
          </p>
        </div>
      </div>

      <div className="mt-5 flex gap-1 border-b border-line">
        <button
          onClick={() => setTab("work")}
          className={`relative flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold transition-colors ${
            tab === "work" ? "text-ink-900" : "text-ink-500 hover:text-ink-800"
          }`}
        >
          <IconCalendar size={15} /> My applications & calendar
          {tab === "work" && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-t-full bg-brand-600" />}
        </button>
        <button
          onClick={() => setTab("studio")}
          className={`relative flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold transition-colors ${
            tab === "studio" ? "text-ink-900" : "text-ink-500 hover:text-ink-800"
          }`}
        >
          <IconBriefcase size={15} /> Studio — my listings
          {tab === "studio" && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-t-full bg-brand-600" />}
        </button>
      </div>

      <div className="mt-6">{tab === "work" ? <MyWorkTab /> : <StudioTab />}</div>
    </div>
  );
}

/* ————————————————— my work: applications + calendar ————————————————— */

interface AppRow {
  id: string;
  status: ApplicationStatus;
  appliedAgo: string;
  auditionDate?: string;
  auditionISO?: string;
  call: {
    id: string;
    title: string;
    company: string;
    medium: string;
    location: string;
    deadline: string;
    shootDates: string;
    shootStartISO: string;
    requiresAudition: boolean;
  };
}

interface BookmarkedCall {
  id: string;
  title: string;
  deadlineISO: string;
}

interface CustomEventRow {
  id: string;
  title: string;
  dateISO: string;
  note: string;
}

const MOCK_APPS: AppRow[] = [
  {
    id: "mock-app-1", status: "audition_requested", appliedAgo: "5d ago",
    auditionDate: "Jul 18, 2026 · 11:00", auditionISO: "2026-07-18",
    call: { id: "mock-call-1", title: "Supporting cast (4) — 'Saltwater' S3", company: "Hoiche Originals", medium: "OTT Series", location: "Goa", deadline: "Jul 20", shootDates: "Aug–Dec 2026", shootStartISO: "2026-08-03", requiresAudition: true },
  },
  {
    id: "mock-app-2", status: "applied", appliedAgo: "3d ago",
    call: { id: "mock-call-3", title: "Two faces, 25–35 — skincare campaign", company: "Auréa", medium: "Ad Film", location: "London", deadline: "Jul 15", shootDates: "Jul 24–25", shootStartISO: "2026-07-24", requiresAudition: false },
  },
  {
    id: "mock-app-3", status: "finalized", appliedAgo: "2w ago",
    call: { id: "mock-call-8", title: "Ensemble (6) — 'Gulmohar Lane' revival", company: "Aranya Theatre", medium: "Theatre", location: "Mumbai", deadline: "Aug 5", shootDates: "Oct–Dec 2026", shootStartISO: "2026-09-01", requiresAudition: true },
  },
];

function MyWorkTab() {
  const [apps, setApps] = useState<AppRow[] | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkedCall[]>([]);
  const [customEvents, setCustomEvents] = useState<CustomEventRow[]>([]);
  const [addingEvent, setAddingEvent] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventNote, setEventNote] = useState("");

  const load = () => {
    gql<{ myApplications: AppRow[]; myBookmarkedCalls: BookmarkedCall[]; myCustomEvents: CustomEventRow[] }>(
      `query {
        myApplications {
          id status appliedAgo auditionDate auditionISO
          call { id title company medium location deadline shootDates shootStartISO requiresAudition }
        }
        myBookmarkedCalls { id title deadlineISO }
        myCustomEvents { id title dateISO note }
      }`
    )
      .then((d) => {
        setApps(d.myApplications.length ? d.myApplications : MOCK_APPS);
        setBookmarks(d.myBookmarkedCalls);
        setCustomEvents(d.myCustomEvents);
      })
      .catch(() => {
        setApps(MOCK_APPS);
        setBookmarks([]);
        setCustomEvents([]);
      });
  };

  useEffect(load, []);

  const events = useMemo<CalendarEvent[]>(() => {
    if (!apps) return [];
    const out: CalendarEvent[] = [];
    for (const a of apps) {
      if (a.auditionISO) {
        out.push({
          dateISO: a.auditionISO,
          kind: "audition",
          label: `Audition — ${a.call.title}`,
          href: `/casting/${a.call.id}`,
        });
      }
      if (a.status === "finalized") {
        out.push({
          dateISO: a.call.shootStartISO,
          kind: "shoot",
          label: `On set — ${a.call.title}`,
          href: `/casting/${a.call.id}`,
        });
      }
    }
    for (const c of bookmarks) {
      out.push({ dateISO: c.deadlineISO, kind: "deadline", label: `Closes — ${c.title}`, href: `/casting/${c.id}` });
    }
    for (const e of customEvents) {
      out.push({ id: e.id, dateISO: e.dateISO, kind: "custom", label: e.title });
    }
    return out;
  }, [apps, bookmarks, customEvents]);

  const addEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventDate) return;
    gql<{ addCustomEvent: CustomEventRow }>(
      `mutation($title: String!, $dateISO: String!, $note: String) {
        addCustomEvent(title: $title, dateISO: $dateISO, note: $note) { id title dateISO note }
      }`,
      { title: eventTitle.trim(), dateISO: eventDate, note: eventNote.trim() || undefined }
    ).then((d) => {
      setCustomEvents((prev) => [...prev, d.addCustomEvent]);
      setEventTitle("");
      setEventDate("");
      setEventNote("");
      setAddingEvent(false);
    });
  };

  const removeEvent = (id: string) => {
    setCustomEvents((prev) => prev.filter((e) => e.id !== id));
    gql(`mutation($id: ID!) { deleteCustomEvent(id: $id) }`, { id }).catch(load);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      {/* ————— tracker ————— */}
      <div className="min-w-0 space-y-4">
        <Card className="anim-rise p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="eyebrow">
              Auditions tracker
            </h2>
            <Link href="/casting" className="text-[13px] font-semibold text-brand-600 hover:text-brand-700">
              Browse the board →
            </Link>
          </div>

          {!apps && (
            <div className="mt-4 space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          )}

          {apps?.length === 0 && (
            <div className="mt-4">
              <EmptyState
                title="No applications yet"
                hint="Apply to a casting call and it shows up here with its status."
                action={
                  <Link href="/casting" className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-500">
                    Find a call
                  </Link>
                }
              />
            </div>
          )}

          <ul className="mt-2 divide-y divide-line">
            {apps?.map((a) => {
              const meta = STATUS_META[a.status];
              return (
                <li key={a.id} className="py-4 first:pt-3 last:pb-1">
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/casting/${a.call.id}`}
                        className="text-[15px] font-semibold leading-snug text-ink-900 hover:text-brand-700 hover:underline"
                      >
                        {a.call.title}
                      </Link>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-500">
                        <span>{a.call.company}</span>
                        <span className="flex items-center gap-1">
                          <IconMapPin size={12} /> {a.call.location}
                        </span>
                        <span className="text-ink-400">applied {a.appliedAgo}</span>
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${meta.chip}`}>
                      {meta.label}
                    </span>
                  </div>
                  {a.status === "audition_requested" && a.auditionDate && (
                    <p className="mt-2.5 flex items-center gap-2 rounded-lg bg-accent-50 px-3.5 py-2.5 text-[13px] font-medium text-warn">
                      <IconClapper size={15} />
                      Audition scheduled: {a.auditionDate} — sides are in your messages.
                    </p>
                  )}
                  {a.status === "finalized" && (
                    <p className="mt-2.5 flex items-center gap-2 rounded-lg bg-go-soft px-3.5 py-2.5 text-[13px] font-medium text-go">
                      <IconCheck size={15} />
                      You&apos;re on the call sheet — {a.call.shootDates}.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      {/* ————— calendar ————— */}
      <aside>
        <Card className="anim-rise sticky top-20 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="eyebrow">Calendar</h2>
            <button
              onClick={() => setAddingEvent((s) => !s)}
              className="text-[13px] font-semibold text-brand-600 hover:text-brand-700"
            >
              {addingEvent ? "Cancel" : "+ Add event"}
            </button>
          </div>
          <p className="mt-1 text-[12px] text-ink-400">
            Shows your auditions, saved deadlines and events — nothing appears automatically.
          </p>

          {addingEvent && (
            <form onSubmit={addEvent} className="anim-fade mt-4 space-y-2.5 rounded-lg border border-line bg-canvas/50 p-3.5">
              <input
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="Event title"
                required
                className="w-full rounded-md border border-line-strong bg-paper px-2.5 py-1.5 text-[13px] focus:border-brand-500 focus:outline-none"
              />
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
                className="w-full rounded-md border border-line-strong bg-paper px-2.5 py-1.5 text-[13px] focus:border-brand-500 focus:outline-none"
              />
              <input
                value={eventNote}
                onChange={(e) => setEventNote(e.target.value)}
                placeholder="Note (optional)"
                className="w-full rounded-md border border-line-strong bg-paper px-2.5 py-1.5 text-[13px] focus:border-brand-500 focus:outline-none"
              />
              <button
                type="submit"
                className="w-full rounded-full bg-brand-600 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-brand-500"
              >
                Save event
              </button>
            </form>
          )}

          <div className="mt-4">
            <CalendarView events={events} onRemoveCustom={removeEvent} />
          </div>
        </Card>
      </aside>
    </div>
  );
}

/* ————————————————— studio: post listings, manage applicants ————————————————— */

interface ListingRow {
  id: string;
  title: string;
  medium: string;
  location: string;
  compensation: string;
  shootDates: string;
  deadline: string;
  description: string;
  requiresAudition: boolean;
  postedAgo: string;
  applicants: Array<{
    person: { id: string; name: string; headline: string; hue: number; avatarUrl: string; roles: string[] };
    status: ApplicationStatus;
    appliedAgo: string;
    note?: string | null;
  }>;
}

const LISTING_MEDIUMS = [
  "Feature Film",
  "Short Film",
  "OTT Series",
  "TV Series",
  "Ad Film",
  "Music Video",
  "Theatre",
  "Documentary",
  "Audio Series",
];

const emptyDraft = {
  title: "",
  medium: "Feature Film",
  location: "",
  compensation: "",
  shootDates: "",
  deadline: "",
  description: "",
  requiresAudition: true,
};

const mockApplicant = (idx: number, status: ApplicationStatus, appliedAgo: string, note?: string) => {
  const p = MOCK_PEOPLE[idx];
  return { person: { id: p.id, name: p.name, headline: p.headline, hue: p.hue, avatarUrl: "", roles: p.roles }, status, appliedAgo, note: note ?? null };
};

const MOCK_LISTINGS: ListingRow[] = [
  {
    id: "mock-listing-1", title: "Supporting cast (3) — anthology 'Glass Harbour'", medium: "Feature Film", location: "Mumbai",
    compensation: "Paid — union rates", shootDates: "Nov 2 – Dec 14, 2026", deadline: "Aug 15", description: "Three interlocking stories set around a container port.",
    requiresAudition: true, postedAgo: "4d ago",
    applicants: [
      mockApplicant(0, "audition_requested", "3d ago", "Konkani-accented Hindi is no problem — happy to tape any scene."),
      mockApplicant(10, "applied", "2d ago", "200 nights of stage work; the harbour-master is my part."),
      mockApplicant(5, "applied", "1d ago"),
      mockApplicant(6, "rejected", "4d ago"),
    ],
  },
  {
    id: "mock-listing-2", title: "Narrators (2) — 'Nightwater' audio series", medium: "Audio Series", location: "Remote",
    compensation: "Paid — per-finished-hour", shootDates: "Aug–Sep 2026", deadline: "Jul 31", description: "Eight-part scripted audio thriller, alternating chapters.",
    requiresAudition: false, postedAgo: "1d ago",
    applicants: [
      mockApplicant(4, "finalized", "22h ago", "Demo attached — chapter one in two reads, warm and cold."),
      mockApplicant(9, "applied", "8h ago"),
    ],
  },
];

function StudioTab() {
  const [listings, setListings] = useState<ListingRow[] | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [draftError, setDraftError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const LISTING_FIELDS = `
    id title medium location compensation shootDates deadline description requiresAudition postedAgo
    applicants { status appliedAgo note person { id name headline hue avatarUrl roles } }
  `;

  useEffect(() => {
    gql<{ myListings: ListingRow[] }>(`query { myListings { ${LISTING_FIELDS} } }`)
      .then((d) => {
        const merged = d.myListings.length ? d.myListings : MOCK_LISTINGS;
        setListings(merged);
        setExpanded(merged[0]?.id ?? null);
      })
      .catch(() => {
        setListings(MOCK_LISTINGS);
        setExpanded(MOCK_LISTINGS[0].id);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setStatus = (listingId: string, personId: string, status: ApplicationStatus) => {
    setListings((prev) =>
      prev
        ? prev.map((l) =>
            l.id === listingId
              ? {
                  ...l,
                  applicants: l.applicants.map((a) =>
                    a.person.id === personId ? { ...a, status } : a
                  ),
                }
              : l
          )
        : prev
    );
    gql(
      `mutation($listingId: ID!, $personId: ID!, $status: String!) {
        setApplicantStatus(listingId: $listingId, personId: $personId, status: $status)
      }`,
      { listingId, personId, status }
    ).catch(() => {});
  };

  const publish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim() || !draft.location.trim() || !draft.deadline.trim()) {
      setDraftError("Title, location and application deadline are required.");
      return;
    }
    setSubmitting(true);
    gql<{ createListing: ListingRow }>(
      `mutation($title: String!, $medium: String!, $location: String!, $compensation: String!, $shootDates: String!, $deadline: String!, $description: String!, $requiresAudition: Boolean!) {
        createListing(title: $title, medium: $medium, location: $location, compensation: $compensation, shootDates: $shootDates, deadline: $deadline, description: $description, requiresAudition: $requiresAudition) { ${LISTING_FIELDS} }
      }`,
      {
        ...draft,
        title: draft.title.trim(),
        compensation: draft.compensation.trim() || "Compensation on request",
        shootDates: draft.shootDates.trim() || "Dates TBC",
        description: draft.description.trim(),
      }
    )
      .then((d) => {
        setListings((prev) => [d.createListing, ...(prev ?? [])]);
        setExpanded(d.createListing.id);
        setPosting(false);
        setDraft(emptyDraft);
        setDraftError("");
      })
      .finally(() => setSubmitting(false));
  };

  const input =
    "w-full rounded-lg border border-line-strong bg-paper px-3.5 py-2.5 text-[15px] placeholder:text-ink-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-[15px] text-ink-500">
          Post a role, a project, or a job — anyone can hire on Kaledio, not just production accounts.
        </p>
        <button
          onClick={() => setPosting(true)}
          className="rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-500"
        >
          + Post a casting call
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {!listings &&
          [0, 1].map((i) => (
            <Card key={i} className="space-y-3 p-6">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-3.5 w-1/2" />
              <Skeleton className="h-14 w-full" />
            </Card>
          ))}

        {listings?.length === 0 && (
          <EmptyState
            title="No listings yet"
            hint="Post your first casting call or job, and applicants will land here."
            action={
              <button onClick={() => setPosting(true)} className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-500">
                Post a casting call
              </button>
            }
          />
        )}

        {listings?.map((l) => {
          const open = expanded === l.id;
          const pending = l.applicants.filter((a) => a.status === "applied").length;
          return (
            <Card key={l.id} className="anim-rise overflow-hidden">
              <button
                onClick={() => setExpanded(open ? null : l.id)}
                aria-expanded={open}
                className="flex w-full items-start justify-between gap-4 p-5 text-left transition-colors hover:bg-canvas/60 sm:p-6"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[16px] font-semibold leading-snug text-ink-900">{l.title}</h2>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        l.requiresAudition ? "bg-accent-50 text-warn" : "bg-canvas text-ink-500"
                      }`}
                    >
                      {l.requiresAudition ? "Requires audition" : "Direct offer"}
                    </span>
                  </div>
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-500">
                    <span>{l.medium}</span>
                    <span className="flex items-center gap-1">
                      <IconMapPin size={12} /> {l.location}
                    </span>
                    <span>closes {l.deadline}</span>
                    <span className="text-ink-400">posted {l.postedAgo}</span>
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    <Tag>{l.applicants.length} applicant{l.applicants.length === 1 ? "" : "s"}</Tag>
                    {pending > 0 && <Tag>{pending} awaiting review</Tag>}
                    <Tag>{l.compensation}</Tag>
                  </div>
                </div>
                <IconChevronDown
                  size={18}
                  className={`mt-1 shrink-0 text-ink-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                />
              </button>

              {open && (
                <div className="anim-fade border-t border-line bg-canvas/50 px-5 py-4 sm:px-6">
                  {l.applicants.length === 0 ? (
                    <p className="py-6 text-center text-sm text-ink-400">
                      No applications yet — this listing just went live.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {l.applicants.map((a) => {
                        const meta = STATUS_META[a.status];
                        return (
                          <li key={a.person.id} className="rounded-xl border border-line bg-paper p-4">
                            <div className="flex flex-wrap items-center gap-3">
                              <Link href={`/profile/${a.person.id}`} className="shrink-0">
                                <Avatar name={a.person.name} hue={a.person.hue} size={44} src={a.person.avatarUrl || undefined} />
                              </Link>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Link
                                    href={`/profile/${a.person.id}`}
                                    className="text-[15px] font-semibold text-ink-900 hover:text-brand-700 hover:underline"
                                  >
                                    {a.person.name}
                                  </Link>
                                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${meta.chip}`}>
                                    {meta.label}
                                  </span>
                                </div>
                                <p className="mt-0.5 truncate text-[13px] text-ink-500">
                                  {a.person.roles.join(" · ")} — applied {a.appliedAgo}
                                </p>
                              </div>
                            </div>
                            {a.note && (
                              <p className="mt-3 border-l-2 border-brand-200 pl-3 text-[13px] italic leading-relaxed text-ink-600">
                                &ldquo;{a.note}&rdquo;
                              </p>
                            )}
                            <div className="mt-3.5 flex flex-wrap gap-2 border-t border-line pt-3.5">
                              {l.requiresAudition && a.status === "applied" && (
                                <button
                                  onClick={() => setStatus(l.id, a.person.id, "audition_requested")}
                                  className="inline-flex items-center gap-1.5 rounded-full border border-warn/40 px-4 py-1.5 text-[13px] font-semibold text-warn transition-colors hover:bg-accent-50"
                                >
                                  <IconClapper size={14} /> Request audition
                                </button>
                              )}
                              {a.status !== "finalized" && (
                                <button
                                  onClick={() => setStatus(l.id, a.person.id, "finalized")}
                                  className="inline-flex items-center gap-1.5 rounded-full bg-go px-4 py-1.5 text-[13px] font-semibold text-white transition-colors hover:opacity-90"
                                >
                                  <IconCheck size={14} /> Finalize
                                </button>
                              )}
                              {a.status !== "rejected" && (
                                <button
                                  onClick={() => setStatus(l.id, a.person.id, "rejected")}
                                  className="inline-flex items-center gap-1.5 rounded-full border border-line-strong px-4 py-1.5 text-[13px] font-semibold text-ink-500 transition-colors hover:border-danger/40 hover:text-danger"
                                >
                                  <IconX size={14} /> Reject
                                </button>
                              )}
                              {(a.status === "finalized" || a.status === "rejected") && (
                                <button
                                  onClick={() => setStatus(l.id, a.person.id, "applied")}
                                  className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-ink-400 transition-colors hover:bg-canvas hover:text-ink-700"
                                >
                                  Undo
                                </button>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* ————— post modal ————— */}
      {posting && (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 backdrop-blur-sm p-4 sm:items-center"
          onClick={() => setPosting(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Post a casting call"
        >
          <div
            className="anim-rise max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-2xl bg-paper p-6 shadow-pop sm:p-7"
            onClick={(e) => e.stopPropagation()}
            style={{ animationDuration: "0.25s" }}
          >
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-semibold text-ink-900">Post a casting call</h2>
              <button
                onClick={() => setPosting(false)}
                aria-label="Close"
                className="rounded-full p-2 text-ink-400 transition-colors hover:bg-canvas hover:text-ink-800"
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={publish} className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink-700">Title</span>
                <input
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="e.g. Two leads, 20s — road-trip feature"
                  className={input}
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-ink-700">Medium</span>
                  <select
                    value={draft.medium}
                    onChange={(e) => setDraft({ ...draft, medium: e.target.value })}
                    className={input}
                  >
                    {LISTING_MEDIUMS.map((mm) => (
                      <option key={mm}>{mm}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-ink-700">Location</span>
                  <input
                    value={draft.location}
                    onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                    placeholder="City, or Remote"
                    className={input}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-ink-700">Compensation</span>
                  <input
                    value={draft.compensation}
                    onChange={(e) => setDraft({ ...draft, compensation: e.target.value })}
                    placeholder="e.g. Paid — day rates"
                    className={input}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-ink-700">Shoot dates</span>
                  <input
                    value={draft.shootDates}
                    onChange={(e) => setDraft({ ...draft, shootDates: e.target.value })}
                    placeholder="e.g. Nov 2026"
                    className={input}
                  />
                </label>
              </div>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink-700">Application deadline</span>
                <input
                  type="date"
                  value={draft.deadline}
                  onChange={(e) => setDraft({ ...draft, deadline: e.target.value })}
                  className={input}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink-700">The brief</span>
                <textarea
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  rows={4}
                  placeholder="Roles, tone, what you need in the tape."
                  className={`${input} resize-none leading-relaxed`}
                />
              </label>

              <button
                type="button"
                role="switch"
                aria-checked={draft.requiresAudition}
                onClick={() => setDraft({ ...draft, requiresAudition: !draft.requiresAudition })}
                className="flex w-full items-center justify-between rounded-xl border border-line bg-canvas/70 px-4 py-3.5 text-left transition-colors hover:border-brand-200"
              >
                <span>
                  <span className="block text-sm font-semibold text-ink-900">Requires audition</span>
                  <span className="mt-0.5 block text-[13px] text-ink-500">
                    {draft.requiresAudition
                      ? "Applicants can be called in to tape or read before selection."
                      : "Direct offer — you'll finalize straight from profiles and reels."}
                  </span>
                </span>
                <span
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
                    draft.requiresAudition ? "bg-brand-600" : "bg-line-strong"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-card transition-all duration-200 ${
                      draft.requiresAudition ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </span>
              </button>

              {draftError && (
                <p role="alert" className="text-xs font-medium text-danger">
                  {draftError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPosting(false)}
                  className="rounded-full px-5 py-2.5 text-sm font-semibold text-ink-500 transition-colors hover:bg-canvas"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-500 disabled:opacity-60"
                >
                  {submitting ? "Publishing…" : "Publish listing"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
