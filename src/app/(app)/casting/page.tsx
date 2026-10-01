"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Chip, EmptyState } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { CineVideo } from "@/components/CineVideo";
import { CallSheetCard } from "@/components/CallSheet";
import { recordApplication, useApplications } from "@/lib/applied";
import { IconClapper, IconFire, IconSearch } from "@/components/icons";
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
  deadlineISO?: string;
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
    deadlineISO: c.deadlineISO,
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
  const applications = useApplications();
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
    if (applications[c.id]) return;
    recordApplication(c.id);
    toast(`Sent. ${c.company.split(" ")[0]} will see your profile first thing`, "success");
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
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 p-6 text-white shadow-lift [background:var(--grad-hero)] grad-animate sm:p-7">
        <div className="absolute inset-0 opacity-40 [background:var(--grad-mesh)]" />
        <CineVideo clip="sintel-hero" eager length={18} className="absolute inset-0 h-full w-full" />
        <div className="footage-shade absolute inset-0" />
        <div className="pointer-events-none absolute -right-4 -top-6 anim-float text-[110px] leading-none opacity-15">🎭</div>
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[12px] font-bold backdrop-blur">
            <IconFire size={13} /> {totalRoles} roles casting now
          </span>
          <h1 className="mt-3 font-display text-[40px] font-bold leading-[0.95] sm:text-[56px]">Casting board</h1>
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

        {filtered.map((c, i) => (
          <div key={c.id} className="anim-rise" style={{ animationDelay: `${Math.min(i, 8) * 0.04}s` }}>
            <CallSheetCard
              call={c}
              applied={!!applications[c.id]}
              saved={saved.has(c.id)}
              onApply={() => apply(c)}
              onSave={() => save(c)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
