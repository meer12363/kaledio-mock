"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Card, EmptyState, Skeleton, Tag } from "@/components/ui";
import { IconCheck, IconChat, IconUsers, IconX } from "@/components/icons";
import { gql } from "@/lib/gql";
import { MOCK_PEOPLE } from "@/lib/mock";

interface PersonRow {
  id: string;
  name: string;
  headline: string;
  location: string;
  roles: string[];
  hue: number;
  avatarUrl: string;
}

interface RequestRow {
  id: string;
  sentAgo: string;
  person: PersonRow;
}

const PERSON_ROW_FIELDS = `id name headline location roles hue avatarUrl`;

const toRow = (i: number): PersonRow => {
  const p = MOCK_PEOPLE[i];
  return { id: p.id, name: p.name, headline: p.headline, location: p.location, roles: p.roles, hue: p.hue, avatarUrl: "" };
};
const MOCK_CONNECTIONS: PersonRow[] = [0, 1, 3, 6, 8, 11].map(toRow);
const MOCK_INCOMING: RequestRow[] = [
  { id: "mock-req-1", sentAgo: "2h ago", person: toRow(2) },
  { id: "mock-req-2", sentAgo: "1d ago", person: toRow(9) },
];
const MOCK_OUTGOING: RequestRow[] = [{ id: "mock-out-1", sentAgo: "3d ago", person: toRow(5) }];

type Tab = "connections" | "incoming" | "outgoing";

export default function ConnectionsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("connections");
  const [connections, setConnections] = useState<PersonRow[] | null>(null);
  const [incoming, setIncoming] = useState<RequestRow[] | null>(null);
  const [outgoing, setOutgoing] = useState<RequestRow[] | null>(null);

  const load = () => {
    gql<{ connections: PersonRow[]; incomingConnectionRequests: RequestRow[]; outgoingConnectionRequests: RequestRow[] }>(
      `query {
        connections { ${PERSON_ROW_FIELDS} }
        incomingConnectionRequests { id sentAgo person { ${PERSON_ROW_FIELDS} } }
        outgoingConnectionRequests { id sentAgo person { ${PERSON_ROW_FIELDS} } }
      }`
    )
      .then((d) => {
        const seen = new Set(d.connections.map((p) => p.id));
        setConnections([...d.connections, ...MOCK_CONNECTIONS.filter((m) => !seen.has(m.id))]);
        setIncoming([...d.incomingConnectionRequests, ...MOCK_INCOMING]);
        setOutgoing([...d.outgoingConnectionRequests, ...MOCK_OUTGOING]);
      })
      .catch(() => {
        setConnections(MOCK_CONNECTIONS);
        setIncoming(MOCK_INCOMING);
        setOutgoing(MOCK_OUTGOING);
      });
  };

  useEffect(load, []);

  const respond = (connectionId: string, accept: boolean) => {
    setIncoming((prev) => prev?.filter((r) => r.id !== connectionId) ?? prev);
    gql(`mutation($connectionId: ID!, $accept: Boolean!) { respondToConnection(connectionId: $connectionId, accept: $accept) }`, {
      connectionId,
      accept,
    }).then(load);
  };

  const message = (personId: string) => {
    gql<{ startConversation: { id: string } }>(
      `mutation($personId: ID!) { startConversation(personId: $personId) { id } }`,
      { personId }
    )
      .then((d) => router.push(`/messages?c=${d.startConversation.id}`))
      .catch(() => router.push("/messages"));
  };

  const tabs: Array<{ id: Tab; label: string; count?: number }> = [
    { id: "connections", label: "My connections", count: connections?.length },
    { id: "incoming", label: "Requests", count: incoming?.length },
    { id: "outgoing", label: "Pending", count: outgoing?.length },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 p-6 text-white shadow-lift [background:var(--grad-hero)] grad-animate">
        <div className="absolute inset-0 opacity-40 [background:var(--grad-mesh)]" />
        <div className="pointer-events-none absolute -right-4 -top-6 anim-float text-[100px] leading-none opacity-15">🤝</div>
        <div className="relative">
          <h1 className="font-display text-[40px] font-extrabold leading-[0.95] sm:text-[52px]">Your network</h1>
          <p className="mt-1.5 text-[14px] text-white/85">
            {connections?.length ?? 0} connections · {incoming?.length ?? 0} new requests waiting
          </p>
        </div>
      </div>

      <div className="mt-5 flex gap-1 border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-semibold transition-colors ${
              tab === t.id ? "text-ink-900" : "text-ink-500 hover:text-ink-800"
            }`}
          >
            {t.label}
            {!!t.count && (
              <span className="rounded-full bg-canvas px-1.5 py-0.5 text-[11px] font-bold text-ink-600">{t.count}</span>
            )}
            {tab === t.id && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-t-full bg-brand-600" />}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {tab === "connections" && (
          <>
            {!connections && [0, 1, 2].map((i) => <Card key={i} className="p-4"><Skeleton className="h-12 w-full" /></Card>)}
            {connections?.length === 0 && (
              <EmptyState
                title="No connections yet"
                hint="Send a request from anyone's profile or search results to start building your network."
                action={
                  <Link href="/search" className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-500">
                    Find people
                  </Link>
                }
              />
            )}
            {connections?.map((p) => (
              <Card key={p.id} className="flex flex-wrap items-center gap-3 p-4">
                <Link href={`/profile/${p.id}`}>
                  <Avatar name={p.name} hue={p.hue} size={48} src={p.avatarUrl || undefined} />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/profile/${p.id}`} className="text-[15px] font-semibold text-ink-900 hover:text-brand-700 hover:underline">
                    {p.name}
                  </Link>
                  <p className="truncate text-[13px] text-ink-500">{p.headline}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {p.roles.slice(0, 3).map((r) => (
                      <Tag key={r}>{r}</Tag>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => message(p.id)}
                  className="flex items-center gap-1.5 rounded-full border border-line-strong px-4 py-2 text-[13px] font-semibold text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-700"
                >
                  <IconChat size={14} /> Message
                </button>
              </Card>
            ))}
          </>
        )}

        {tab === "incoming" && (
          <>
            {!incoming && [0, 1].map((i) => <Card key={i} className="p-4"><Skeleton className="h-12 w-full" /></Card>)}
            {incoming?.length === 0 && (
              <EmptyState title="No pending requests" hint="Connection requests sent to you will show up here." />
            )}
            {incoming?.map((r) => (
              <Card key={r.id} className="flex flex-wrap items-center gap-3 p-4">
                <Link href={`/profile/${r.person.id}`}>
                  <Avatar name={r.person.name} hue={r.person.hue} size={48} src={r.person.avatarUrl || undefined} />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/profile/${r.person.id}`} className="text-[15px] font-semibold text-ink-900 hover:text-brand-700 hover:underline">
                    {r.person.name}
                  </Link>
                  <p className="truncate text-[13px] text-ink-500">{r.person.headline} · sent {r.sentAgo}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => respond(r.id, true)}
                    className="flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-brand-500"
                  >
                    <IconCheck size={14} /> Accept
                  </button>
                  <button
                    onClick={() => respond(r.id, false)}
                    className="flex items-center gap-1.5 rounded-full border border-line-strong px-4 py-2 text-[13px] font-semibold text-ink-500 transition-colors hover:border-danger/40 hover:text-danger"
                  >
                    <IconX size={14} /> Decline
                  </button>
                </div>
              </Card>
            ))}
          </>
        )}

        {tab === "outgoing" && (
          <>
            {!outgoing && [0, 1].map((i) => <Card key={i} className="p-4"><Skeleton className="h-12 w-full" /></Card>)}
            {outgoing?.length === 0 && (
              <EmptyState
                title="Nothing pending"
                hint="Requests you've sent that haven't been answered yet will show up here."
                action={
                  <Link href="/search" className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-500">
                    <IconUsers size={14} className="mr-1.5 inline" /> Find people
                  </Link>
                }
              />
            )}
            {outgoing?.map((r) => (
              <Card key={r.id} className="flex flex-wrap items-center gap-3 p-4">
                <Link href={`/profile/${r.person.id}`}>
                  <Avatar name={r.person.name} hue={r.person.hue} size={48} src={r.person.avatarUrl || undefined} />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/profile/${r.person.id}`} className="text-[15px] font-semibold text-ink-900 hover:text-brand-700 hover:underline">
                    {r.person.name}
                  </Link>
                  <p className="truncate text-[13px] text-ink-500">Request sent {r.sentAgo}</p>
                </div>
                <span className="rounded-full border border-line-strong px-3.5 py-1.5 text-[13px] font-semibold text-ink-400">
                  Awaiting response
                </span>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
