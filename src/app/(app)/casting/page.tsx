"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { Card, Chip, EmptyState, Skeleton, Tag } from "@/components/ui";
import { IconCheck, IconClock, IconMapPin, IconSearch } from "@/components/icons";
import { gql } from "@/lib/gql";

interface CallRow {
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
  applied: boolean;
  postedBy: { id: string; name: string; hue: number; avatarUrl: string };
}

const MEDIUMS = ["All", "Feature Film", "OTT Series", "TV Series", "Ad Film", "Music Video", "Theatre", "Short Film", "Documentary"];
const LOCATIONS = ["All", "Mumbai", "Delhi", "Hyderabad", "Chennai", "Goa", "London", "Berlin", "Remote"];

export default function CastingBoardPage() {
  const [calls, setCalls] = useState<CallRow[] | null>(null);
  const [medium, setMedium] = useState("All");
  const [location, setLocation] = useState("All");
  const [query, setQuery] = useState("");

  useEffect(() => {
    gql<{ castingCalls: CallRow[] }>(
      `query {
        castingCalls {
          id title company medium location compensation deadline tags applicants postedAgo applied
          postedBy { id name hue avatarUrl }
        }
      }`
    )
      .then((d) => setCalls(d.castingCalls))
      .catch(() => setCalls([]));
  }, []);

  const filtered = useMemo(() => {
    if (!calls) return null;
    const q = query.trim().toLowerCase();
    return calls.filter((c) => {
      if (medium !== "All" && c.medium !== medium) return false;
      if (location !== "All" && !c.location.includes(location)) return false;
      if (q && !`${c.title} ${c.company} ${c.tags.join(" ")}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [calls, medium, location, query]);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight text-ink-900">Casting board</h1>
          <p className="mt-1 text-[15px] text-ink-500">
            {calls ? `${calls.length} open calls across the industry` : "Loading the board…"}
          </p>
        </div>
        <div className="relative">
          <IconSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search roles, projects, companies"
            aria-label="Search casting calls"
            className="w-72 rounded-full border border-line-strong bg-paper py-2.5 pl-10 pr-4 text-sm placeholder:text-ink-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {MEDIUMS.map((mm) => (
          <Chip key={mm} active={medium === mm} onClick={() => setMedium(mm)}>
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

      <div className="mt-6 space-y-3.5">
        {!filtered &&
          [0, 1, 2, 3].map((i) => (
            <Card key={i} className="space-y-3 p-5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-2/3" />
            </Card>
          ))}

        {filtered?.length === 0 && (
          <EmptyState
            title="Nothing matches those filters"
            hint="Try widening the medium or location — new calls land on the board every day."
            action={
              <button
                onClick={() => {
                  setMedium("All");
                  setLocation("All");
                  setQuery("");
                }}
                className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Clear filters
              </button>
            }
          />
        )}

        {filtered?.map((c, i) => (
          <Link key={c.id} href={`/casting/${c.id}`} className="block">
            <Card className="anim-rise p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift">
              <div style={{ animationDelay: `${Math.min(i, 6) * 0.04}s` }}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-[16px] font-semibold leading-snug text-ink-900">{c.title}</h2>
                    <div className="mt-1.5 flex items-center gap-2 text-[13px] text-ink-500">
                      <Avatar name={c.postedBy.name} hue={c.postedBy.hue} size={20} src={c.postedBy.avatarUrl || undefined} />
                      <span className="font-medium text-ink-600">{c.company}</span>
                      <span className="text-ink-300">·</span>
                      <span>posted {c.postedAgo} ago</span>
                    </div>
                  </div>
                  {c.applied ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-go-soft px-3 py-1.5 text-xs font-semibold text-go">
                      <IconCheck size={13} /> Applied
                    </span>
                  ) : (
                    <span className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
                      {c.medium}
                    </span>
                  )}
                </div>

                <div className="mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px] text-ink-500">
                  <span className="flex items-center gap-1.5">
                    <IconMapPin size={14} /> {c.location}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <IconClock size={14} /> Closes {c.deadline}
                  </span>
                  <span className="font-medium text-ink-700">{c.compensation}</span>
                </div>

                <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                  {c.tags.map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                  <span className="ml-auto text-xs font-medium text-ink-400">
                    {c.applicants} applicants
                  </span>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
