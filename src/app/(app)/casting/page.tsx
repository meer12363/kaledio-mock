"use client";

import { useEffect, useMemo, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { Button, Card, Chip, EmptyState, Tag } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { IconBookmark, IconCheck, IconClapper, IconClock, IconFire, IconMapPin, IconSearch, IconUsers } from "@/components/icons";
import { gql } from "@/lib/gql";
import { MOCK_CALLS, MOCK_PEOPLE, type MockCall } from "@/lib/mock";
import type { MediaTone } from "@/lib/types";

interface CardData {
  id: string;
  title: string;
  company: string;
  medium: string;
  location: string;
  compensation: string;
  deadline: string;
  tags: string[];
  applicants: number;
  postedAgo: string;
  hot: boolean;
  roles: number;
  tone: MediaTone;
  byName: string;
  byHue: number;
}

const MEDIUMS = ["All", "Feature Film", "OTT Series", "TV Series", "Ad Film", "Music Video", "Theatre", "Short Film"];
const LOCATIONS = ["All", "Mumbai", "Delhi", "Hyderabad", "Chennai", "Goa", "London", "Berlin", "Remote"];

const ACCENT: Record<MediaTone, string> = {
  midnight: "from-brand-900 to-brand-600",
  steel: "from-slate-600 to-slate-400",
  sky: "from-brand-500 to-brand-300",
  noir: "from-ink-900 to-ink-600",
  porcelain: "from-brand-300 to-brand-100",
  dusk: "from-pop-700 to-brand-500",
};

function fromMock(c: MockCall): CardData {
  const p = MOCK_PEOPLE.find((x) => x.id === c.postedById);
  return {
    id: c.id,
    title: c.title,
    company: c.company,
    medium: c.medium,
    location: c.location,
    compensation: c.compensation,
    deadline: c.deadline,
    tags: c.tags,
    applicants: c.applicants,
    postedAgo: c.postedAgo,
    hot: !!c.hot,
    roles: c.roles,
    tone: c.tone,
    byName: p?.name ?? c.company,
    byHue: p?.hue ?? 2,
  };
}

export default function CastingBoardPage() {
  const { toast } = useToast();
  const [realCalls, setRealCalls] = useState<CardData[]>([]);
  const [medium, setMedium] = useState("All");
  const [location, setLocation] = useState("All");
  const [query, setQuery] = useState("");
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Set<string>>(new Set());

  useEffect(() => {
    gql<{
      castingCalls: Array<{
        id: string; title: string; company: string; medium: string; location: string;
        compensation: string; deadline: string; tags: string[]; applicants: number; postedAgo: string;
        postedBy: { name: string; hue: number };
      }>;
    }>(
      `query {
        castingCalls {
          id title company medium location compensation deadline tags applicants postedAgo
          postedBy { name hue }
        }
      }`
    )
      .then((d) =>
        setRealCalls(
          d.castingCalls.map((c) => ({
            ...c,
            hot: false,
            roles: 1,
            tone: "midnight" as MediaTone,
            byName: c.postedBy?.name ?? c.company,
            byHue: c.postedBy?.hue ?? 2,
          }))
        )
      )
      .catch(() => setRealCalls([]));
  }, []);

  const all = useMemo(() => [...realCalls, ...MOCK_CALLS.map(fromMock)], [realCalls]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((c) => {
      if (medium !== "All" && c.medium !== medium) return false;
      if (location !== "All" && !c.location.includes(location)) return false;
      if (q && !`${c.title} ${c.company} ${c.tags.join(" ")}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [all, medium, location, query]);

  const totalRoles = all.reduce((s, c) => s + c.roles, 0);

  const apply = (c: CardData) => {
    if (applied.has(c.id)) return;
    setApplied((s) => new Set(s).add(c.id));
    toast(`Applied to “${c.title.slice(0, 28)}…” — good luck! 🎬`, "accent");
    if (!c.id.startsWith("mock-")) {
      gql(`mutation($id: ID!) { applyToCasting(id: $id) { id } }`, { id: c.id }).catch(() => {});
    }
  };

  const save = (c: CardData) => {
    setSaved((s) => {
      const n = new Set(s);
      if (n.has(c.id)) n.delete(c.id);
      else {
        n.add(c.id);
        toast("Saved to your calendar 📌", "success");
      }
      return n;
    });
  };

  return (
    <div className="mx-auto max-w-5xl">
      {/* hero */}
      <div className="relative overflow-hidden rounded-2xl border border-brand-900/10 p-6 text-white shadow-lift [background:var(--grad-hero)] grad-animate sm:p-7">
        <div className="absolute inset-0 opacity-40 [background:var(--grad-mesh)]" />
        <div className="pointer-events-none absolute -right-4 -top-6 anim-float text-[110px] leading-none opacity-15">🎭</div>
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[12px] font-bold backdrop-blur">
            <IconFire size={13} /> {totalRoles} roles casting now
          </span>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-[34px]">Casting board</h1>
          <p className="mt-1.5 max-w-md text-[14px] text-white/85">
            Live roles across film, OTT, ad film, music video and theatre. Apply in one tap — new calls drop daily.
          </p>
          <div className="mt-4 max-w-md">
            <div className="relative">
              <IconSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search roles, projects, companies…"
                aria-label="Search casting calls"
                className="w-full rounded-full border border-white/30 bg-paper/95 py-2.5 pl-10 pr-4 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* filters */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {MEDIUMS.map((mm) => (
          <Chip key={mm} active={medium === mm} onClick={() => setMedium(mm)} tone="accent">
            {mm}
          </Chip>
        ))}
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          aria-label="Filter by location"
          className="ml-auto rounded-full border border-line bg-paper px-3.5 py-1.5 text-[13px] font-medium text-ink-600 focus:border-brand-500 focus:outline-none"
        >
          {LOCATIONS.map((l) => (
            <option key={l}>{l === "All" ? "All locations" : l}</option>
          ))}
        </select>
      </div>

      <p className="mt-4 text-[13px] font-medium text-ink-500">{filtered.length} open calls</p>

      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {filtered.length === 0 && (
          <div className="sm:col-span-2">
            <EmptyState
              icon={<IconClapper size={24} />}
              title="Nothing matches those filters"
              hint="Try widening the medium or location — new calls land on the board every day."
              action={
                <Button
                  variant="primary"
                  onClick={() => {
                    setMedium("All");
                    setLocation("All");
                    setQuery("");
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          </div>
        )}

        {filtered.map((c, i) => {
          const isApplied = applied.has(c.id);
          const isSaved = saved.has(c.id);
          const fillingFast = c.applicants > 200;
          return (
            <Card key={c.id} interactive className="anim-rise overflow-hidden" >
              <div style={{ animationDelay: `${Math.min(i, 8) * 0.04}s` }}>
                {/* gradient cap */}
                <div className={`relative h-16 bg-gradient-to-r ${ACCENT[c.tone]}`}>
                  <div className="absolute inset-0 opacity-30 [background:var(--grad-mesh)]" />
                  <div className="absolute left-4 top-3 flex gap-1.5">
                    {c.hot && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-extrabold text-accent-700">
                        <IconFire size={11} /> HOT
                      </span>
                    )}
                    {fillingFast && (
                      <span className="rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                        Filling fast
                      </span>
                    )}
                  </div>
                  <span className="absolute right-4 top-3 rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                    {c.medium}
                  </span>
                  <button
                    onClick={() => save(c)}
                    aria-label={isSaved ? "Saved" : "Save to calendar"}
                    className="press absolute -bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-paper text-ink-500 shadow-lift transition-colors hover:text-brand-600"
                  >
                    <IconBookmark size={16} filled={isSaved} className={isSaved ? "text-brand-600" : ""} />
                  </button>
                </div>

                <div className="p-4">
                  <h2 className="text-[16px] font-bold leading-snug text-ink-900">{c.title}</h2>
                  <div className="mt-2 flex items-center gap-2 text-[13px] text-ink-500">
                    <Avatar name={c.byName} hue={c.byHue} size={20} />
                    <span className="truncate font-medium text-ink-600">{c.company}</span>
                    <span className="text-ink-300">·</span>
                    <span className="shrink-0">{c.postedAgo} ago</span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-ink-500">
                    <span className="flex items-center gap-1.5">
                      <IconMapPin size={14} /> {c.location}
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold text-accent-700">
                      <IconClock size={14} /> {c.deadline}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <IconUsers size={14} /> {c.applicants}
                    </span>
                  </div>

                  <p className="mt-2 text-[13px] font-medium text-ink-700">{c.compensation}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {c.tags.slice(0, 3).map((t) => (
                      <Tag key={t}>{t}</Tag>
                    ))}
                    <span className="ml-auto rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-700">
                      {c.roles} {c.roles === 1 ? "role" : "roles"}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <Button
                      variant={isApplied ? "outline" : "accent"}
                      onClick={() => apply(c)}
                      disabled={isApplied}
                      className="flex-1"
                    >
                      {isApplied ? (
                        <>
                          <IconCheck size={15} /> Applied
                        </>
                      ) : (
                        "Apply now"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
