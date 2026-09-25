"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { PostCard, type FeedPost } from "@/components/PostCard";
import { SpotlightRail } from "@/components/SpotlightRail";
import { Button, Card, EmptyState } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { IconClock, IconFire, IconSparkle, IconX } from "@/components/icons";
import { gql } from "@/lib/gql";
import { useSession } from "@/lib/session";
import { readAttachment } from "@/lib/upload";
import { MOCK_CALLS, MOCK_PEOPLE, MOCK_POSTS } from "@/lib/mock";

const EMOJI_SET = [
  "😀", "😄", "😂", "😊", "😍", "🤩", "😎", "🥳",
  "🙌", "👏", "👍", "🙏", "💪", "🤝", "❤️", "🔥",
  "✨", "🌟", "🎉", "🏆", "🎬", "🎥", "🎭", "🎤",
  "🎶", "💃", "🕺", "📸", "🎞️", "🍿", "🎧", "✍️",
];

const PROMPTS = [
  { emoji: "🎬", label: "Share a wrap", placeholder: "That's a wrap on…" },
  { emoji: "📣", label: "Post an update", placeholder: "Some news to share —" },
  { emoji: "✨", label: "Celebrate a win", placeholder: "Thrilled to share that…" },
  { emoji: "🎧", label: "Drop your latest", placeholder: "Just released —" },
];

const TICKER = [
  "29 roles casting now",
  "Half Light premieres tonight at MAMI",
  "Saltwater S3 — 4 recurring roles in Goa",
  "Dhaaga crosses 62M views",
  "Open audition: Gulmohar Lane revival",
  "Voice cast wanted for The Paper Kite 2",
  "8 dancer spots filling fast in Hyderabad",
];

type FeedTab = "foryou" | "following" | "casting";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Up late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const FEED_QUERY = /* GraphQL */ `
  query {
    feed {
      id kind timeAgo text likes comments liked castingCallId mediaUrl mediaType
      media { id title kind year tone aspect }
      author { id name headline hue avatarUrl }
    }
  }
`;

export default function HomePage() {
  const { user } = useSession();
  const { toast } = useToast();
  const [realPosts, setRealPosts] = useState<FeedPost[]>([]);
  const [myPosts, setMyPosts] = useState<FeedPost[]>([]);
  const [tab, setTab] = useState<FeedTab>("foryou");
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");
  const [placeholder, setPlaceholder] = useState("What's happening on set?");
  const [attachment, setAttachment] = useState<{ url: string; kind: "image" | "video" } | null>(null);
  const [attachError, setAttachError] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const draftInput = useRef<HTMLTextAreaElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gql<{ feed: FeedPost[] }>(FEED_QUERY)
      .then((d) => setRealPosts(d.feed))
      .catch(() => setRealPosts([]));
  }, []);

  const openComposer = (ph?: string) => {
    setComposing(true);
    if (ph) setPlaceholder(ph);
    requestAnimationFrame(() => {
      composerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      draftInput.current?.focus();
    });
  };

  useEffect(() => {
    let armed = false;
    try {
      armed = !!sessionStorage.getItem("kaledio.compose");
      if (armed) sessionStorage.removeItem("kaledio.compose");
    } catch {
      /* ignore */
    }
    if (!armed) return;
    const t = window.setTimeout(() => openComposer(), 60);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onCompose = () => openComposer();
    window.addEventListener("kaledio:compose", onCompose);
    return () => window.removeEventListener("kaledio:compose", onCompose);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const greet = useMemo(() => greeting(), []);

  const feed = useMemo(() => {
    const all = [...realPosts, ...MOCK_POSTS];
    if (tab === "casting") return all.filter((p) => p.kind === "casting");
    if (tab === "following") return all.filter((_, i) => i % 2 === 0);
    return all;
  }, [realPosts, tab]);

  if (!user) return null;

  const avatarSrc = user.details.profilePicture || undefined;
  const firstName = user.name.split(" ")[0];

  const insertEmoji = (emoji: string) => {
    const el = draftInput.current;
    const at = el ? el.selectionStart : draft.length;
    const end = el ? el.selectionEnd : draft.length;
    setDraft((d) => d.slice(0, at) + emoji + d.slice(end));
    if (el) {
      el.focus();
      const caret = at + emoji.length;
      requestAnimationFrame(() => el.setSelectionRange(caret, caret));
    }
  };

  const onAttach = async (file?: File) => {
    if (!file) return;
    setAttachError("");
    try {
      setAttachment(await readAttachment(file));
    } catch (e) {
      setAttachError(e instanceof Error ? e.message : "Could not read that file.");
    }
  };

  const publish = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const optimistic: FeedPost = {
      id: `pending-${Date.now()}`,
      author: { id: "me", name: user.name, headline: user.headline, hue: 3, avatarUrl: avatarSrc },
      kind: "announcement",
      timeAgo: "now",
      text,
      mediaUrl: attachment?.url ?? null,
      mediaType: attachment?.kind ?? null,
      likes: 0,
      comments: 0,
      liked: false,
      mine: true,
    };
    setMyPosts((prev) => [optimistic, ...prev]);
    setDraft("");
    const mediaUrl = attachment?.url;
    const mediaType = attachment?.kind;
    setAttachment(null);
    setEmojiOpen(false);
    setComposing(false);
    setPlaceholder("What's happening on set?");
    toast("Posted — the industry is watching 🎬", "accent");
    gql<{ createPost: FeedPost }>(
      `mutation($text: String!, $mediaUrl: String, $mediaType: String) {
        createPost(text: $text, mediaUrl: $mediaUrl, mediaType: $mediaType) {
          id kind timeAgo text likes comments liked castingCallId mediaUrl mediaType
          author { id name headline hue avatarUrl }
        }
      }`,
      { text, mediaUrl, mediaType }
    )
      .then((d) => setMyPosts((prev) => prev.map((p) => (p.id === optimistic.id ? { ...d.createPost, mine: true } : p))))
      .catch(() => {});
  };

  return (
    <div className="space-y-8">
      {/* ═════════ editorial hero ═════════ */}
      <section className="anim-rise relative overflow-hidden rounded-[28px] border border-white/10 [background:var(--grad-hero)] grad-animate">
        <div className="absolute inset-0 opacity-50 [background:var(--grad-mesh)]" />
        <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full bg-[#ff4f7b]/30 blur-3xl" />
        <div className="relative grid gap-6 p-6 sm:p-9 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/70">
              {greet} — {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
            </p>
            <h1 className="mt-3 break-words font-display text-[34px] font-extrabold leading-[0.95] text-white min-[420px]:text-[40px] sm:text-[56px] xl:text-[68px]">
              {firstName}, your next role is <span className="volt-text">out there.</span>
            </h1>
            <div className="no-scrollbar -mx-6 mt-6 flex gap-2 overflow-x-auto px-6 sm:mx-0 sm:flex-wrap sm:px-0">
              {PROMPTS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => openComposer(p.placeholder)}
                  className="press inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/20 bg-black/20 px-4 py-2 text-[13px] font-semibold text-white backdrop-blur transition-all hover:border-white/50 hover:bg-black/35"
                >
                  <span>{p.emoji}</span> {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* bento stats */}
          <div className="grid grid-cols-2 gap-2.5">
            <Link href="/profile" className="press group min-w-0 rounded-2xl bg-black/30 p-3.5 backdrop-blur sm:p-4 transition-colors hover:bg-black/45">
              <p className="truncate font-mono text-[9.5px] uppercase tracking-[0.14em] text-white/60">Streak</p>
              <p className="mt-1 font-display text-[22px] font-extrabold leading-none min-[380px]:text-[26px] sm:text-3xl text-volt">🔥 3</p>
              <p className="text-[12px] text-white/70">days on set</p>
            </Link>
            <Link href="/profile" className="press group min-w-0 rounded-2xl bg-black/30 p-3.5 backdrop-blur sm:p-4 transition-colors hover:bg-black/45">
              <p className="truncate font-mono text-[9.5px] uppercase tracking-[0.14em] text-white/60">Profile views</p>
              <p className="mt-1 font-display text-[22px] font-extrabold leading-none min-[380px]:text-[26px] sm:text-3xl text-white">248</p>
              <p className="text-[12px] font-semibold text-go">▲ 18 this week</p>
            </Link>
            <Link href="/dashboard" className="press group min-w-0 rounded-2xl bg-black/30 p-3.5 backdrop-blur sm:p-4 transition-colors hover:bg-black/45">
              <p className="truncate font-mono text-[9.5px] uppercase tracking-[0.14em] text-white/60">Applications</p>
              <p className="mt-1 font-display text-[22px] font-extrabold leading-none min-[380px]:text-[26px] sm:text-3xl text-white">3</p>
              <p className="text-[12px] text-white/70">1 audition booked</p>
            </Link>
            <Link href="/casting" className="press group min-w-0 rounded-2xl bg-white p-3.5 transition-transform sm:p-4 hover:-translate-y-0.5">
              <p className="truncate font-mono text-[9.5px] uppercase tracking-[0.14em] text-black/50">Matches</p>
              <p className="mt-1 font-display text-[22px] font-extrabold leading-none min-[380px]:text-[26px] sm:text-3xl text-black">12</p>
              <p className="text-[12px] font-semibold text-black/70">roles for you →</p>
            </Link>
          </div>
        </div>

        {/* live ticker */}
        <div className="relative flex items-center gap-3 overflow-hidden border-t border-white/15 bg-black/35 py-2.5 backdrop-blur">
          <span className="ml-4 shrink-0 rounded bg-danger px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white" style={{ animation: "pulse-dot 1.4s ease-in-out infinite" }}>
            ● Live
          </span>
          <div className="relative min-w-0 flex-1 overflow-hidden">
            <div className="flex w-max anim-marquee gap-10 font-mono text-[12px] uppercase tracking-wider text-white/85">
              {[...TICKER, ...TICKER].map((t, i) => (
                <span key={i} className="flex items-center gap-10">
                  {t} <span className="text-accent-400">✦</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═════════ reels ═════════ */}
      <SpotlightRail />

      {/* ═════════ feed + side column ═════════ */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 space-y-4">
          {/* composer */}
          <div ref={composerRef} className="scroll-mt-28">
            <Card className={`overflow-hidden p-4 transition-shadow ${composing ? "grad-border shadow-glow-accent" : ""}`}>
              {!composing ? (
                <div className="flex items-center gap-3">
                  <Avatar name={user.name} hue={3} size={44} src={avatarSrc} />
                  <button
                    onClick={() => openComposer()}
                    className="flex-1 rounded-2xl border border-line-strong bg-canvas/60 px-5 py-3 text-left text-[15px] text-ink-400 transition-colors duration-150 hover:border-volt/60 hover:text-ink-600"
                  >
                    Share an update, a wrap, a win…
                  </button>
                  <button
                    onClick={() => openComposer()}
                    className="press hidden h-12 w-12 items-center justify-center rounded-2xl text-xl text-black sm:flex [background:var(--grad-volt)]"
                    aria-label="New post"
                  >
                    ✦
                  </button>
                </div>
              ) : (
                <form onSubmit={publish} className="anim-fade">
                  <div className="flex items-start gap-3">
                    <Avatar name={user.name} hue={3} size={44} src={avatarSrc} />
                    <textarea
                      ref={draftInput}
                      autoFocus
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={3}
                      placeholder={placeholder}
                      aria-label="Write a post"
                      className="flex-1 resize-none rounded-2xl border border-line-strong bg-canvas/60 px-4 py-3 text-[16px] leading-relaxed focus:border-volt focus:outline-none"
                    />
                  </div>

                  {attachment && (
                    <div className="anim-scale-in relative ml-14 mt-3 max-w-xs overflow-hidden rounded-xl border border-line">
                      {attachment.kind === "video" ? (
                        <video src={attachment.url} className="max-h-56 w-full" controls />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={attachment.url} alt="" className="max-h-56 w-full object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => setAttachment(null)}
                        aria-label="Remove attachment"
                        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white"
                      >
                        <IconX size={13} />
                      </button>
                    </div>
                  )}
                  {attachError && <p className="ml-14 mt-2 text-xs font-medium text-danger">{attachError}</p>}

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInput.current?.click()}
                        className="press rounded-xl border border-line-strong px-3.5 py-2 text-[13px] font-semibold text-ink-600 transition-colors hover:border-volt hover:text-volt"
                      >
                        📸 Media
                      </button>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setEmojiOpen((o) => !o)}
                          aria-expanded={emojiOpen}
                          aria-label="Add emoji"
                          className="press rounded-xl border border-line-strong px-3.5 py-2 text-[13px] font-semibold text-ink-600 transition-colors hover:border-volt hover:text-volt"
                        >
                          😊 Emoji
                        </button>
                        {emojiOpen && (
                          <div
                            className="absolute bottom-[calc(100%+6px)] left-0 z-20 grid w-64 grid-cols-8 gap-0.5 rounded-2xl border border-line bg-elevated p-2 shadow-pop"
                            style={{ animation: "pop-in 0.2s cubic-bezier(0.34,1.56,0.64,1) both" }}
                          >
                            {EMOJI_SET.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => insertEmoji(emoji)}
                                aria-label={`Insert ${emoji}`}
                                className="flex h-7 w-7 items-center justify-center rounded-md text-[17px] transition-transform hover:scale-125 hover:bg-white/5"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <input
                      ref={fileInput}
                      type="file"
                      accept="image/*,video/*"
                      className="sr-only"
                      onChange={(e) => {
                        onAttach(e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setComposing(false);
                          setDraft("");
                          setAttachment(null);
                          setAttachError("");
                          setEmojiOpen(false);
                          setPlaceholder("What's happening on set?");
                        }}
                        className="rounded-xl px-3.5 py-2 text-sm font-semibold text-ink-500 transition-colors hover:text-ink-900"
                      >
                        Cancel
                      </button>
                      <Button type="submit" variant="accent" disabled={!draft.trim()}>
                        Post
                      </Button>
                    </div>
                  </div>
                </form>
              )}
            </Card>
          </div>

          {/* feed tabs */}
          <div className="sticky top-[88px] z-20 -mx-1 flex items-center gap-1 rounded-2xl border border-line bg-paper/80 p-1 backdrop-blur-xl">
            {(
              [
                { id: "foryou", label: "For you" },
                { id: "following", label: "Following" },
                { id: "casting", label: "Casting 🔥" },
              ] as Array<{ id: FeedTab; label: string }>
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative flex-1 rounded-xl py-2.5 text-[13.5px] font-bold transition-all duration-200 ${
                  tab === t.id ? "bg-ink-900 text-canvas" : "text-ink-500 hover:text-ink-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {myPosts.map((p) => (
            <div key={p.id} className="anim-pop">
              <PostCard post={p} />
            </div>
          ))}

          {feed.length === 0 && myPosts.length === 0 && (
            <EmptyState
              icon={<IconSparkle size={24} />}
              title="Nothing here yet"
              hint="Follow more people or switch tabs — wraps, casting calls and premieres show up here."
              action={
                <Button variant="accent" onClick={() => openComposer()}>
                  Share your first post
                </Button>
              }
            />
          )}

          <div key={tab} className="space-y-4">
            {feed.map((p, i) => (
              <div key={p.id} className="anim-rise" style={{ animationDelay: `${Math.min(i, 6) * 0.06}s` }}>
                <PostCard post={p} />
              </div>
            ))}
          </div>
        </section>

        {/* ═════════ side column ═════════ */}
        <aside className="hidden lg:block">
          <div className="sticky top-[96px] space-y-4">
            {/* daily goals */}
            <Card className="overflow-hidden">
              <div className="flex items-center gap-2 border-b border-line px-4 py-3">
                <IconFire size={16} className="text-accent-500" />
                <p className="font-display text-[15px] font-bold text-ink-900">Daily goals</p>
                <span className="ml-auto rounded-full bg-volt px-2 py-0.5 font-mono text-[10.5px] font-bold text-black">2/3</span>
              </div>
              <ul className="space-y-2.5 p-4">
                {[
                  { done: true, label: "Check your feed" },
                  { done: true, label: "React to 3 posts" },
                  { done: false, label: "Apply to a casting call" },
                ].map((g) => (
                  <li key={g.label} className="flex items-center gap-2.5 text-[13.5px]">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-md text-[11px] font-bold ${
                        g.done ? "bg-volt text-black" : "border border-line-strong text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                    <span className={g.done ? "text-ink-400 line-through" : "font-semibold text-ink-900"}>{g.label}</span>
                  </li>
                ))}
              </ul>
              <div className="px-4 pb-4">
                <div className="h-2 w-full overflow-hidden rounded-full bg-canvas">
                  <div className="h-full rounded-full [background:var(--grad-volt)]" style={{ width: "66%" }} />
                </div>
                <p className="mt-2 text-[12px] text-ink-500">One more to keep the 🔥 alive.</p>
              </div>
            </Card>

            {/* closing soon */}
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <p className="eyebrow">Closing soon</p>
                <IconClock size={15} className="text-ink-400" />
              </div>
              <ul className="mt-3 space-y-1">
                {MOCK_CALLS.slice(0, 4).map((c) => (
                  <li key={c.id}>
                    <Link href="/casting" className="group flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-white/[0.03]">
                      <span className="mt-0.5 rounded-md bg-accent-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-accent-600">{c.deadline}</span>
                      <span className="min-w-0">
                        <span className="line-clamp-2 text-[13px] font-semibold leading-snug text-ink-800 group-hover:text-ink-900">{c.title}</span>
                        <span className="mt-0.5 block text-[11.5px] text-ink-500">
                          {c.medium} · {c.location}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href="/casting" className="mt-2 block border-t border-line px-2 pt-3 text-[13px] font-bold text-volt hover:underline">
                Open the board →
              </Link>
            </Card>

            {/* people */}
            <Card className="p-4">
              <p className="eyebrow">Rising this week</p>
              <ul className="mt-3 space-y-1">
                {MOCK_PEOPLE.slice(0, 5).map((p, i) => (
                  <li key={p.id}>
                    <Link href={`/profile/${p.id}`} className="group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.03]">
                      <span className="w-4 font-mono text-[11px] font-bold text-ink-400">{String(i + 1).padStart(2, "0")}</span>
                      <Avatar name={p.name} hue={p.hue} size={34} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-bold text-ink-900">{p.name}</span>
                        <span className="block truncate text-[11.5px] text-ink-500">{p.roles.join(" · ")}</span>
                      </span>
                      <span className="font-mono text-[11px] font-bold text-go">{p.followers}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </aside>
      </div>
    </div>
  );
}
