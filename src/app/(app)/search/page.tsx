"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { AvailabilityBadge, Card, EmptyState, Skeleton, Tag } from "@/components/ui";
import { ConnectButton } from "@/components/ConnectButton";
import { IconChat, IconMapPin, IconSearch } from "@/components/icons";
import { gql } from "@/lib/gql";
import { ROLE_OPTIONS } from "@/lib/persona";
import { MOCK_PEOPLE } from "@/lib/mock";
import type { Availability, ConnectionStatus } from "@/lib/types";

interface PersonRow {
  id: string;
  name: string;
  persona: string;
  roles: string[];
  headline: string;
  location: string;
  availability: Availability;
  yearsExp: number;
  skills: string[];
  connections: number;
  hue: number;
  avatarUrl: string;
  connectionStatus: ConnectionStatus;
}

const LOCATIONS = [
  "All",
  "Mumbai",
  "Delhi",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Goa",
  "London",
  "Berlin",
  "Dubai",
  "Los Angeles",
  "New York",
];
const EXPERIENCE = [
  { label: "Any experience", value: 0 },
  { label: "3+ years", value: 3 },
  { label: "5+ years", value: 5 },
  { label: "10+ years", value: 10 },
];

export default function SearchPage() {
  const router = useRouter();
  const [people, setPeople] = useState<PersonRow[] | null>(null);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("All");
  const [location, setLocation] = useState("All");
  const [minYears, setMinYears] = useState(0);
  const [openOnly, setOpenOnly] = useState(false);

  useEffect(() => {
    const mockRows: PersonRow[] = MOCK_PEOPLE.map((p) => ({
      id: p.id,
      name: p.name,
      persona: "talent",
      roles: p.roles,
      headline: p.headline,
      location: p.location,
      availability: p.availability as Availability,
      yearsExp: 5,
      skills: [],
      connections: p.connections,
      hue: p.hue,
      avatarUrl: "",
      connectionStatus: "none" as ConnectionStatus,
    }));
    gql<{ people: PersonRow[] }>(
      `query {
        people {
          id name persona roles headline location availability yearsExp skills connections hue avatarUrl connectionStatus
        }
      }`
    )
      .then((d) => {
        const seen = new Set(d.people.map((p) => p.id));
        setPeople([...d.people, ...mockRows.filter((m) => !seen.has(m.id))]);
      })
      .catch(() => setPeople(mockRows));
  }, []);

  const filtered = useMemo(() => {
    if (!people) return null;
    const q = query.trim().toLowerCase();
    return people.filter((p) => {
      if (role !== "All" && !p.roles.includes(role)) return false;
      if (location !== "All" && !p.location.includes(location)) return false;
      if (minYears && p.yearsExp < minYears) return false;
      if (openOnly && p.availability === "booked") return false;
      if (q && !`${p.name} ${p.headline} ${p.roles.join(" ")} ${p.skills.join(" ")} ${p.location}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [people, query, role, location, minYears, openOnly]);

  const message = (personId: string) => {
    if (personId && !personId.includes("-")) {
      router.push("/messages");
      return;
    }
    gql<{ startConversation: { id: string } }>(
      `mutation($personId: ID!) { startConversation(personId: $personId) { id } }`,
      { personId }
    )
      .then((d) => router.push(`/messages?c=${d.startConversation.id}`))
      .catch(() => router.push("/messages"));
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 p-6 text-white shadow-lift [background:var(--grad-cool)] grad-animate sm:p-7">
        <div className="absolute inset-0 opacity-40 [background:var(--grad-mesh)]" />
        <div className="pointer-events-none absolute -right-4 -top-6 anim-float text-[110px] leading-none opacity-15">🔍</div>
        <div className="relative">
          <h1 className="font-display text-[40px] font-bold leading-[0.95] sm:text-[56px]">Find people</h1>
          <p className="mt-1.5 max-w-md text-[14px] text-white/85">
            Talent, creatives and production — searchable by role, city and experience.
          </p>
        </div>
      </div>

      {/* search + filters */}
      <div className="mt-5 rounded-2xl border border-line bg-paper p-4 shadow-card">
        <div className="relative">
          <IconSearch size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try 'cinematographer', 'Konkani', 'playback'…"
            aria-label="Search people"
            className="w-full rounded-xl border border-line-strong bg-paper py-3 pl-11 pr-4 text-[15px] placeholder:text-ink-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            aria-label="Filter by role"
            className="rounded-full border border-line bg-paper px-3.5 py-2 text-[13px] font-medium text-ink-600 focus:border-brand-500 focus:outline-none"
          >
            <option>All</option>
            <optgroup label="Talent">
              {ROLE_OPTIONS.talent.map((r) => <option key={r}>{r}</option>)}
            </optgroup>
            <optgroup label="Creative">
              {ROLE_OPTIONS.creative.map((r) => <option key={r}>{r}</option>)}
            </optgroup>
            <optgroup label="Production">
              {ROLE_OPTIONS.production.map((r) => <option key={r}>{r}</option>)}
            </optgroup>
          </select>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            aria-label="Filter by location"
            className="rounded-full border border-line bg-paper px-3.5 py-2 text-[13px] font-medium text-ink-600 focus:border-brand-500 focus:outline-none"
          >
            {LOCATIONS.map((l) => (
              <option key={l}>{l === "All" ? "All locations" : l}</option>
            ))}
          </select>
          <select
            value={minYears}
            onChange={(e) => setMinYears(Number(e.target.value))}
            aria-label="Filter by experience"
            className="rounded-full border border-line bg-paper px-3.5 py-2 text-[13px] font-medium text-ink-600 focus:border-brand-500 focus:outline-none"
          >
            {EXPERIENCE.map((x) => (
              <option key={x.value} value={x.value}>
                {x.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => setOpenOnly((o) => !o)}
            aria-pressed={openOnly}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-medium transition-colors duration-150 ${
              openOnly
                ? "border-go bg-go-soft text-go"
                : "border-line text-ink-600 hover:border-brand-300 hover:text-brand-700"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${openOnly ? "bg-go" : "bg-ink-300"}`} />
            Available now
          </button>
          {filtered && (
            <span className="ml-auto text-[13px] font-medium text-ink-400">
              {filtered.length} {filtered.length === 1 ? "person" : "people"}
            </span>
          )}
        </div>
      </div>

      {/* results */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {!filtered &&
          [0, 1, 2, 3].map((i) => (
            <Card key={i} className="space-y-3 p-5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-14 w-14 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <Skeleton className="h-3 w-full" />
            </Card>
          ))}

        {filtered?.length === 0 && (
          <div className="sm:col-span-2">
            <EmptyState
              title="No one matches that search"
              hint="Try a broader role or drop a filter — the right person is usually one filter away."
              action={
                <button
                  onClick={() => {
                    setQuery("");
                    setRole("All");
                    setLocation("All");
                    setMinYears(0);
                    setOpenOnly(false);
                  }}
                  className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-500"
                >
                  Reset search
                </button>
              }
            />
          </div>
        )}

        {filtered?.map((p, i) => (
          <Card
            key={p.id}
            className="anim-rise flex flex-col p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift"
          >
            <div style={{ animationDelay: `${Math.min(i, 8) * 0.04}s` }} className="flex flex-1 flex-col">
              <div className="flex items-start gap-3.5">
                <Link href={`/profile/${p.id}`}>
                  <Avatar name={p.name} hue={p.hue} size={56} src={p.avatarUrl || undefined} />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/profile/${p.id}`}
                    className="text-[16px] font-semibold text-ink-900 hover:text-brand-700 hover:underline"
                  >
                    {p.name}
                  </Link>
                  <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-ink-500">{p.headline}</p>
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-ink-400">
                    <IconMapPin size={12} /> {p.location} · {p.yearsExp} yrs · {p.connections.toLocaleString("en-IN")} connections
                  </p>
                </div>
              </div>

              <div className="mt-3.5 flex flex-wrap gap-1.5">
                {p.roles.map((r) => (
                  <Tag key={r}>{r}</Tag>
                ))}
                <AvailabilityBadge status={p.availability} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                <Link
                  href={`/profile/${p.id}`}
                  className="flex-1 rounded-full bg-brand-600 py-2 text-center text-[13px] font-semibold text-white transition-colors hover:bg-brand-500"
                >
                  View profile
                </Link>
                <button
                  onClick={() => message(p.id)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-line-strong py-2 text-[13px] font-semibold text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-700"
                >
                  <IconChat size={14} /> Message
                </button>
                <ConnectButton personId={p.id} status={p.connectionStatus} compact />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
