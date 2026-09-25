"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { PostCard, type FeedPost } from "@/components/PostCard";
import { SpotlightRail } from "@/components/SpotlightRail";
import { Button, Card, EmptyState } from "@/components/ui";
import { useToast } from "@/components/Toast";
import {
  IconBriefcase,
  IconClapper,
  IconClock,
  IconFilm,
  IconFire,
  IconSearch,
  IconSparkle,
  IconUsers,
  IconX,
} from "@/components/icons";
import { gql } from "@/lib/gql";
import { useSession } from "@/lib/session";
import { readAttachment } from "@/lib/upload";
import { MOCK_CALLS, MOCK_PEOPLE, MOCK_POSTS } from "@/lib/mock";
import type { Availability } from "@/lib/types";

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

const TRENDING = ["#nowcasting", "#selftape", "#onset", "#wrapped", "#festival", "#openrole"];

function greeting(): string {
  const h = new Date().getHours();
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

  const openComposer = (ph?: string, starter?: string) => {
    setComposing(true);
    if (ph) setPlaceholder(ph);
    if (starter) setDraft(starter);
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

  // merge real posts (from the DB) ahead of the lively mock feed
  const feed = useMemo(() => [...realPosts, ...MOCK_POSTS], [realPosts]);

  if (!user) return null;

  const avatarSrc = user.details.profilePicture || undefined;

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
    toast("Posted to your feed 🎬", "accent");
    gql<{ createPost: FeedPost }>(
      `mutation($text: String!, $mediaUrl: String, $mediaType: String) {
        createPost(text: $text, mediaUrl: $mediaUrl, mediaType: $mediaType) {
          id kind timeAgo text likes comments liked castingCallId mediaUrl mediaType
          author { id name headline hue avatarUrl }
        }
      }`,
      { text, mediaUrl, mediaType }
    )
      .then((d) => {
        setMyPosts((prev) => prev.map((p) => (p.id === optimistic.id ? { ...d.createPost, mine: true } : p)));
      })
      .catch(() => {});
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[248px_minmax(0,1fr)_300px]">
      {/* ————— left rail ————— */}
      <aside className="hidden lg:block">
        <div className="sticky top-24 space-y-4">
          <ProfileCard
            name={user.name}
            headline={user.headline}
            availability={user.availability as Availability}
            avatarSrc={avatarSrc}
          />

          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">Shortcuts</p>
            <nav className="mt-3 space-y-1">
              {[
                { href: "/casting", label: "Casting board", Icon: IconClapper },
                { href: "/search", label: "Find people", Icon: IconSearch },
                { href: "/connections", label: "My network", Icon: IconUsers },
                { href: "/dashboard", label: "My Work / Studio", Icon: IconBriefcase },
              ].map(({ href, label, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-canvas"
                >
                  <Icon size={17} className="text-brand-600 transition-transform group-hover:scale-110" /> {label}
                </Link>
              ))}
            </nav>
          </Card>
        </div>
      </aside>

      {/* ————— feed ————— */}
      <section className="min-w-0 space-y-4">
        {/* cinematic greeting hero + streak */}
        <div className="anim-rise relative overflow-hidden rounded-2xl border border-brand-900/10 p-5 text-white shadow-lift [background:var(--grad-hero)] grad-animate sm:p-6">
          <div className="absolute inset-0 opacity-40 [background:var(--grad-mesh)]" />
          <div className="pointer-events-none absolute -right-5 -top-8 anim-float text-[110px] leading-none opacity-15">🎬</div>
          <div className="relative">
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-medium text-white/80">{greet},</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur">
                🔥 3-day streak
              </span>
            </div>
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{user.name.split(" ")[0]}</h1>
            <p className="mt-1.5 max-w-md text-[14px] leading-relaxed text-white/85">
              Share your latest work, find your next role, and connect with the people who make it happen.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {PROMPTS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => openComposer(p.placeholder)}
                  className="press inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-[13px] font-semibold text-white backdrop-blur transition-colors hover:bg-white/25"
                >
                  <span>{p.emoji}</span> {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* spotlight / stories rail */}
        <SpotlightRail />

        {/* composer */}
        <div ref={composerRef} className="scroll-mt-24">
          <Card className="overflow-hidden p-4" glow={composing}>
            {!composing ? (
              <div className="flex items-center gap-3">
                <Avatar name={user.name} hue={3} size={42} src={avatarSrc} />
                <button
                  onClick={() => openComposer()}
                  className="flex-1 rounded-full border border-line-strong px-5 py-2.5 text-left text-sm text-ink-400 transition-colors duration-150 hover:border-brand-300 hover:bg-canvas"
                >
                  Share an update, a wrap, a win…
                </button>
              </div>
            ) : (
              <form onSubmit={publish} className="anim-fade">
                <div className="flex items-start gap-3">
                  <Avatar name={user.name} hue={3} size={42} src={avatarSrc} />
                  <textarea
                    ref={draftInput}
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={3}
                    placeholder={placeholder}
                    aria-label="Write a post"
                    className="flex-1 resize-none rounded-xl border border-line-strong px-4 py-3 text-[15px] leading-relaxed placeholder:text-ink-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  />
                </div>

                {attachment && (
                  <div className="anim-scale-in relative ml-[54px] mt-3 max-w-xs overflow-hidden rounded-lg border border-line">
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
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-ink-900/70 text-white"
                    >
                      <IconX size={13} />
                    </button>
                  </div>
                )}
                {attachError && <p className="ml-[54px] mt-2 text-xs font-medium text-danger">{attachError}</p>}

                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInput.current?.click()}
                      className="press rounded-full border border-line-strong px-4 py-2 text-[13px] font-semibold text-ink-600 transition-colors hover:border-brand-300 hover:text-brand-700"
                    >
                      Photo / video
                    </button>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setEmojiOpen((o) => !o)}
                        aria-expanded={emojiOpen}
                        aria-label="Add emoji"
                        className="press rounded-full border border-line-strong px-4 py-2 text-[13px] font-semibold text-ink-600 transition-colors hover:border-brand-300 hover:text-brand-700"
                      >
                        😊 Emoji
                      </button>
                      {emojiOpen && (
                        <div
                          className="absolute bottom-[calc(100%+6px)] left-0 z-20 grid w-64 grid-cols-8 gap-0.5 rounded-2xl border border-line bg-paper p-2 shadow-pop"
                          style={{ animation: "pop-in 0.2s cubic-bezier(0.34,1.56,0.64,1) both" }}
                        >
                          {EMOJI_SET.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => insertEmoji(emoji)}
                              aria-label={`Insert ${emoji}`}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-[17px] transition-transform hover:scale-125 hover:bg-canvas"
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
                      className="rounded-full px-4 py-2 text-sm font-semibold text-ink-500 transition-colors hover:bg-canvas"
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

        {myPosts.map((p) => (
          <div key={p.id} className="anim-pop">
            <PostCard post={p} />
          </div>
        ))}

        {feed.length === 0 && myPosts.length === 0 && (
          <EmptyState
            icon={<IconSparkle size={24} />}
            title="Your feed is just getting started"
            hint="Post your first update or follow more people — wraps, casting calls and premieres show up here."
            action={
              <Button variant="accent" onClick={() => openComposer()}>
                Share your first post
              </Button>
            }
          />
        )}

        {feed.map((p, i) => (
          <div key={p.id} className="anim-rise" style={{ animationDelay: `${Math.min(i, 6) * 0.06}s` }}>
            <PostCard post={p} />
          </div>
        ))}
      </section>

      {/* ————— right rail ————— */}
      <aside className="hidden lg:block">
        <div className="sticky top-24 space-y-4">
          {/* daily goals — gamified */}
          <Card glow className="overflow-hidden">
            <div className="flex items-center gap-2 border-b border-line px-4 py-3">
              <IconFire size={16} className="text-accent-500" />
              <p className="text-[13px] font-bold text-ink-900">Daily goals</p>
              <span className="ml-auto rounded-full bg-accent-50 px-2 py-0.5 text-[11px] font-bold text-accent-700">2 / 3</span>
            </div>
            <ul className="space-y-2.5 p-4">
              {[
                { done: true, label: "Check your feed" },
                { done: true, label: "React to 3 posts" },
                { done: false, label: "Apply to a casting call" },
              ].map((g) => (
                <li key={g.label} className="flex items-center gap-2.5 text-[13px]">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                      g.done ? "bg-go text-white" : "border-2 border-line-strong text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                  <span className={g.done ? "text-ink-400 line-through" : "font-medium text-ink-800"}>{g.label}</span>
                </li>
              ))}
            </ul>
            <div className="px-4 pb-4">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-canvas">
                <div className="h-full rounded-full [background:var(--grad-spotlight)]" style={{ width: "66%" }} />
              </div>
              <p className="mt-2 text-[12px] text-ink-500">Finish 1 more to keep your 🔥 streak alive!</p>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2">
              <IconFire size={16} className="text-accent-500" />
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">Trending</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {TRENDING.map((t) => (
                <Link
                  key={t}
                  href={`/search?q=${encodeURIComponent(t.replace("#", ""))}`}
                  className="press rounded-full bg-canvas px-3 py-1.5 text-[13px] font-semibold text-ink-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
                >
                  {t}
                </Link>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">Closing soon</p>
              <IconClock size={15} className="text-ink-300" />
            </div>
            <ul className="mt-3 space-y-1">
              {MOCK_CALLS.slice(0, 3).map((c) => (
                <li key={c.id}>
                  <Link href="/casting" className="block rounded-lg px-2.5 py-2.5 transition-colors hover:bg-canvas">
                    <span className="line-clamp-2 text-[13px] font-semibold leading-snug text-ink-800">{c.title}</span>
                    <span className="mt-1 block text-xs text-ink-400">
                      {c.medium} · {c.location} · closes {c.deadline}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/casting" className="mt-2 block border-t border-line px-2.5 pt-3 text-[13px] font-semibold text-brand-600 hover:text-brand-700">
              See the full board →
            </Link>
          </Card>

          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">People to know</p>
            <ul className="mt-3 space-y-1">
              {MOCK_PEOPLE.slice(0, 4).map((p) => (
                <li key={p.id}>
                  <Link href={`/profile/${p.id}`} className="group flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-canvas">
                    <Avatar name={p.name} hue={p.hue} size={36} />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold text-ink-800 group-hover:text-brand-700">{p.name}</span>
                      <span className="block truncate text-xs text-ink-400">{p.headline}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/search" className="mt-2 block border-t border-line px-2.5 pt-3 text-[13px] font-semibold text-brand-600 hover:text-brand-700">
              Search everyone →
            </Link>
          </Card>

          <div className="px-2 text-center">
            <IconFilm size={18} className="mx-auto text-ink-300" />
            <p className="mt-1 text-[11px] font-medium text-ink-400">Kaledio — where the industry finds its people</p>
          </div>
        </div>
      </aside>
    </div>
  );
}

// ————— polished profile card (left rail) —————
function ProfileCard({
  name,
  headline,
  availability,
  avatarSrc,
}: {
  name: string;
  headline: string;
  availability: Availability;
  avatarSrc?: string;
}) {
  const availLabel =
    availability === "open" ? "Open to work" : availability === "listening" ? "Open to offers" : "Booked";
  return (
    <Card interactive className="overflow-hidden">
      <div className="relative h-16 [background:var(--grad-hero)] grad-animate">
        <div className="absolute inset-0 opacity-30 [background:var(--grad-mesh)]" />
      </div>
      <div className="px-5 pb-5">
        <div className="-mt-8 mb-2 flex items-end justify-between">
          <Avatar name={name} hue={3} size={64} ring src={avatarSrc} />
          <span className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-go-soft px-2.5 py-1 text-[11px] font-semibold text-go">
            <span className="h-1.5 w-1.5 rounded-full bg-go" style={{ animation: "pulse-dot 2s ease-in-out infinite" }} />
            {availLabel}
          </span>
        </div>
        <Link href="/profile" className="block text-[16px] font-semibold text-ink-900 hover:text-brand-700">
          {name}
        </Link>
        <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-ink-500">{headline}</p>

        {/* mock stat row — dopamine */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-canvas px-3 py-2">
            <p className="text-[15px] font-bold text-ink-900">248</p>
            <p className="text-[11px] font-medium text-ink-500">Profile views</p>
          </div>
          <div className="rounded-xl bg-canvas px-3 py-2">
            <p className="flex items-center gap-1 text-[15px] font-bold text-go">
              +18<span className="text-[11px]">▲</span>
            </p>
            <p className="text-[11px] font-medium text-ink-500">This week</p>
          </div>
        </div>

        <Link
          href="/profile"
          className="mt-4 block border-t border-line pt-3.5 text-[13px] font-semibold text-brand-600 transition-colors hover:text-brand-700"
        >
          View my profile →
        </Link>
      </div>
    </Card>
  );
}
