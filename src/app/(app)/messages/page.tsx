"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Card, Skeleton } from "@/components/ui";
import { IconArrowLeft, IconSearch, IconSend, IconX } from "@/components/icons";
import { gql } from "@/lib/gql";
import { MOCK_PEOPLE } from "@/lib/mock";
import type { Message } from "@/lib/types";

interface Thread {
  id: string;
  unread: number;
  lastActive: string;
  person: { id: string; name: string; headline: string; hue: number; location: string; avatarUrl: string };
  messages: Message[];
}

interface PersonHit {
  id: string;
  name: string;
  headline: string;
  hue: number;
  avatarUrl: string;
}

const mkThread = (personIdx: number, unread: number, lastActive: string, msgs: Array<[Message["from"], string, string]>): Thread => {
  const p = MOCK_PEOPLE[personIdx];
  return {
    id: `mock-conv-${p.id}`,
    unread,
    lastActive,
    person: { id: p.id, name: p.name, headline: p.headline, hue: p.hue, location: p.location, avatarUrl: "" },
    messages: msgs.map(([from, text, time], i) => ({ id: `mm-${p.id}-${i}`, from, text, time })),
  };
};

const MOCK_THREADS: Thread[] = [
  mkThread(2, 2, "12m", [
    ["them", "Hi! Saw your profile on the Saltwater S3 search — your self-tape setup looks solid.", "Tue 4:12 PM"],
    ["me", "Thank you Ritika! Would love to read for it.", "Tue 4:30 PM"],
    ["them", "Sending sides tonight. Tape by Friday if you can 🎬", "Today 9:44 AM"],
  ]),
  mkThread(3, 0, "2h", [
    ["me", "Congrats on Monsoon Chess getting financed! 🎉", "Mon 11:20 AM"],
    ["them", "Thank you! Apply through the call so Ritika sees you — but tape scene 14 like it's a comedy 😉", "Mon 2:47 PM"],
  ]),
  mkThread(6, 1, "1d", [
    ["them", "The Peppermint brief is unhinged in the best way. Ankle-deep water 😅 Are you taping for it?", "Fri 8:40 PM"],
    ["me", "Cutting my movement tape this weekend!", "Fri 8:52 PM"],
    ["them", "Groundedness over tricks. Show me weight and control 💪", "Fri 9:30 PM"],
  ]),
];

const MOCK_REPLIES = [
  "Love it — let me get back to you by end of day.",
  "Perfect, that works. Talk soon 🎬",
  "Noted! Sending details across shortly.",
  "Amazing. Let me loop in the team and revert ✨",
];

function MessagesInner() {
  const router = useRouter();
  const params = useSearchParams();
  const selectedId = params.get("c");

  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [filter, setFilter] = useState("");
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [peopleQuery, setPeopleQuery] = useState("");
  const [peopleResults, setPeopleResults] = useState<PersonHit[] | null>(null);
  const [startingWith, setStartingWith] = useState<string | null>(null);

  useEffect(() => {
    gql<{ conversations: Thread[] }>(
      `query {
        conversations {
          id unread lastActive
          person { id name headline hue location avatarUrl }
          messages { id from text time }
        }
      }`
    )
      .then((d) => setThreads([...d.conversations, ...MOCK_THREADS]))
      .catch(() => setThreads(MOCK_THREADS));
  }, []);

  // search people to start a brand-new conversation
  useEffect(() => {
    const q = peopleQuery.trim();
    if (!q) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPeopleResults(null);
      return;
    }
    const handle = window.setTimeout(() => {
      gql<{ people: PersonHit[] }>(
        `query($q: String!) { people(query: $q) { id name headline hue avatarUrl } }`,
        { q }
      )
        .then((d) => setPeopleResults(d.people.slice(0, 6)))
        .catch(() => setPeopleResults([]));
    }, 250);
    return () => window.clearTimeout(handle);
  }, [peopleQuery]);

  const startWith = (personId: string) => {
    setStartingWith(personId);
    gql<{ startConversation: { id: string } }>(
      `mutation($personId: ID!) { startConversation(personId: $personId) { id } }`,
      { personId }
    )
      .then((d) => {
        setPeopleQuery("");
        setPeopleResults(null);
        router.push(`/messages?c=${d.startConversation.id}`);
        // refresh the thread list so the new/updated conversation shows up
        gql<{ conversations: Thread[] }>(
          `query {
            conversations {
              id unread lastActive
              person { id name headline hue location avatarUrl }
              messages { id from text time }
            }
          }`
        ).then((r) => setThreads(r.conversations));
      })
      .finally(() => setStartingWith(null));
  };

  const selected = useMemo(
    () => threads?.find((t) => t.id === selectedId) ?? null,
    [threads, selectedId]
  );

  // mark read when a thread is opened
  useEffect(() => {
    if (!selected || selected.unread === 0) return;
    const id = selected.id;
    if (id.startsWith("mock-conv-")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setThreads((prev) => (prev ? prev.map((t) => (t.id === id ? { ...t, unread: 0 } : t)) : prev));
      return;
    }
    gql(`mutation($id: ID!) { markRead(conversationId: $id) }`, { id })
      .then(() =>
        setThreads((prev) =>
          prev ? prev.map((t) => (t.id === id ? { ...t, unread: 0 } : t)) : prev
        )
      )
      .catch(() => {});
  }, [selected]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [selected?.messages.length, typing, selectedId]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !selected) return;
    setDraft("");

    // mock threads: reply locally so the demo feels alive
    if (selected.id.startsWith("mock-conv-")) {
      const now = "Just now";
      const mine: Message = { id: `mm-out-${Date.now()}`, from: "me", text, time: now };
      setThreads((prev) => (prev ? prev.map((t) => (t.id === selected.id ? { ...t, lastActive: "now", messages: [...t.messages, mine] } : t)) : prev));
      setTyping(true);
      window.setTimeout(() => {
        setTyping(false);
        const reply: Message = { id: `mm-in-${Date.now()}`, from: "them", text: MOCK_REPLIES[Math.floor(Math.random() * MOCK_REPLIES.length)], time: now };
        setThreads((prev) => (prev ? prev.map((t) => (t.id === selected.id ? { ...t, messages: [...t.messages, reply] } : t)) : prev));
      }, 1600);
      return;
    }

    gql<{ sendMessage: Message[] }>(
      `mutation($id: ID!, $text: String!) {
        sendMessage(conversationId: $id, text: $text) { id from text time }
      }`,
      { id: selected.id, text }
    ).then((d) => {
      const [mine, reply] = d.sendMessage;
      if (!mine) return;
      setThreads((prev) =>
        prev
          ? prev.map((t) =>
              t.id === selected.id
                ? { ...t, lastActive: "now", messages: [...t.messages, mine] }
                : t
            )
          : prev
      );
      if (reply) {
        setTyping(true);
        window.setTimeout(() => {
          setTyping(false);
          setThreads((prev) =>
            prev
              ? prev.map((t) =>
                  t.id === selected.id ? { ...t, messages: [...t.messages, reply] } : t
                )
              : prev
          );
        }, 1600);
      }
    });
  };

  const list = threads?.filter((t) =>
    t.person.name.toLowerCase().includes(filter.trim().toLowerCase())
  );

  return (
    <div className="mx-auto max-w-5xl">
      <Card className="overflow-hidden">
        <div className="grid grid-cols-[minmax(0,1fr)] md:grid-cols-[320px_minmax(0,1fr)]" style={{ height: "calc(100dvh - 9.5rem)" }}>
          {/* ————— conversation list ————— */}
          <div
            className={`min-w-0 flex-col border-line md:flex md:border-r ${selected ? "hidden" : "flex"}`}
          >
            <div className="border-b border-line p-4">
              <h1 className="text-lg font-semibold text-ink-900">Messages</h1>
              <div className="relative mt-3">
                <IconSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Search conversations"
                  aria-label="Search conversations"
                  className="w-full rounded-full border border-line bg-canvas py-2 pl-9 pr-3 text-[13px] placeholder:text-ink-300 focus:border-brand-500 focus:bg-paper focus:outline-none"
                />
              </div>
              <div className="relative mt-2">
                <IconSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
                <input
                  value={peopleQuery}
                  onChange={(e) => setPeopleQuery(e.target.value)}
                  placeholder="Find someone new to message"
                  aria-label="Find someone new to message"
                  className="w-full rounded-full border border-brand-200 bg-brand-50/50 py-2 pl-9 pr-8 text-[13px] placeholder:text-brand-400 focus:border-brand-500 focus:bg-paper focus:outline-none"
                />
                {peopleQuery && (
                  <button
                    onClick={() => setPeopleQuery("")}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
                  >
                    <IconX size={14} />
                  </button>
                )}
                {peopleResults && (
                  <div className="absolute inset-x-0 top-[calc(100%+4px)] z-10 max-h-72 overflow-y-auto rounded-xl border border-line bg-paper shadow-lift">
                    {peopleResults.length === 0 ? (
                      <p className="p-4 text-center text-sm text-ink-400">No one matches that search.</p>
                    ) : (
                      peopleResults.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => startWith(p.id)}
                          disabled={startingWith === p.id}
                          className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-canvas disabled:opacity-60"
                        >
                          <Avatar name={p.name} hue={p.hue} size={34} src={p.avatarUrl || undefined} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-semibold text-ink-800">{p.name}</span>
                            <span className="block truncate text-xs text-ink-400">{p.headline}</span>
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {!list &&
                [0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-4">
                    <Skeleton className="h-11 w-11 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-3 w-44" />
                    </div>
                  </div>
                ))}
              {list?.length === 0 && (
                <p className="p-6 text-center text-sm text-ink-400">No conversations found.</p>
              )}
              {list?.map((t) => {
                const last = t.messages[t.messages.length - 1];
                const active = t.id === selectedId;
                return (
                  <button
                    key={t.id}
                    onClick={() => router.push(`/messages?c=${t.id}`)}
                    className={`flex w-full items-start gap-3 border-b border-line/70 p-4 text-left transition-colors duration-150 ${
                      active ? "bg-brand-50/70" : "hover:bg-canvas"
                    }`}
                  >
                    <Avatar name={t.person.name} hue={t.person.hue} size={44} src={t.person.avatarUrl || undefined} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={`truncate text-sm ${t.unread ? "font-bold text-ink-900" : "font-semibold text-ink-800"}`}>
                          {t.person.name}
                        </span>
                        <span className="shrink-0 text-[11px] text-ink-400">{t.lastActive}</span>
                      </span>
                      <span
                        className={`mt-0.5 line-clamp-1 text-[13px] leading-snug ${
                          t.unread ? "font-medium text-ink-800" : "text-ink-500"
                        }`}
                      >
                        {last ? `${last.from === "me" ? "You: " : ""}${last.text}` : "Start the conversation"}
                      </span>
                    </span>
                    {t.unread > 0 && (
                      <span className="mt-1 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[10px] font-bold text-white">
                        {t.unread}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ————— thread ————— */}
          <div className={`min-w-0 flex-col ${selected ? "flex" : "hidden md:flex"}`}>
            {!selected ? (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                  <IconSend size={22} />
                </span>
                <p className="mt-4 text-[15px] font-semibold text-ink-800">Pick a conversation</p>
                <p className="mt-1 max-w-xs text-sm text-ink-500">
                  Casting follow-ups, collabs, contracts — it all happens here.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 border-b border-line p-3.5">
                  <button
                    onClick={() => router.push("/messages")}
                    aria-label="Back to conversations"
                    className="rounded-full p-1.5 text-ink-500 transition-colors hover:bg-canvas md:hidden"
                  >
                    <IconArrowLeft size={18} />
                  </button>
                  <Link href={`/profile/${selected.person.id}`} className="flex min-w-0 items-center gap-3">
                    <Avatar name={selected.person.name} hue={selected.person.hue} size={40} src={selected.person.avatarUrl || undefined} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink-900 hover:text-brand-700">
                        {selected.person.name}
                      </span>
                      <span className="block truncate text-xs text-ink-500">{selected.person.headline}</span>
                    </span>
                  </Link>
                  <Link
                    href={`/profile/${selected.person.id}`}
                    className="ml-auto shrink-0 rounded-full border border-line-strong px-3.5 py-1.5 text-xs font-semibold text-ink-600 transition-colors hover:border-brand-300 hover:text-brand-700"
                  >
                    View profile
                  </Link>
                </div>

                <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-canvas/50 p-4 sm:p-5">
                  {selected.messages.length === 0 && (
                    <p className="py-10 text-center text-sm text-ink-400">
                      No messages yet — say hello. Politely. This industry remembers.
                    </p>
                  )}
                  {selected.messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-[14.5px] leading-relaxed shadow-card ${
                          msg.from === "me"
                            ? "rounded-br-md bg-brand-600 text-white"
                            : "rounded-bl-md border border-line bg-paper text-ink-800"
                        }`}
                      >
                        <p>{msg.text}</p>
                        <p className={`mt-1 text-[10.5px] ${msg.from === "me" ? "text-brand-100" : "text-ink-400"}`}>
                          {msg.time}
                        </p>
                      </div>
                    </div>
                  ))}
                  {typing && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-line bg-paper px-4 py-3 shadow-card">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="h-1.5 w-1.5 rounded-full bg-ink-300"
                            style={{ animation: `pulse-dot 1s ease-in-out ${i * 0.18}s infinite` }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <form onSubmit={send} className="flex items-center gap-2.5 border-t border-line p-3.5">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={`Message ${selected.person.name.split(" ")[0]}…`}
                    aria-label={`Message ${selected.person.name}`}
                    className="min-w-0 flex-1 rounded-full border border-line-strong px-4.5 py-2.5 text-[14.5px] placeholder:text-ink-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  />
                  <button
                    type="submit"
                    disabled={!draft.trim()}
                    aria-label="Send message"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white transition-all duration-150 hover:bg-brand-700 active:scale-95 disabled:opacity-40"
                  >
                    <IconSend size={16} />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl"><Skeleton className="h-[60vh] w-full" /></div>}>
      <MessagesInner />
    </Suspense>
  );
}
