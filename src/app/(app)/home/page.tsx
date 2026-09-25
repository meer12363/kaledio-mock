"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { PostCard, type FeedPost } from "@/components/PostCard";
import { AvailabilityBadge, Button, Card, EmptyState, Skeleton } from "@/components/ui";
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
import type { Availability } from "@/lib/types";

interface SidebarCall {
  id: string;
  title: string;
  medium: string;
  location: string;
  deadline: string;
}

interface SidebarPerson {
  id: string;
  name: string;
  headline: string;
  hue: number;
  avatarUrl: string;
}

const EMOJI_SET = [
  "😀", "😄", "😂", "😊", "😍", "🤩", "😎", "🥳",
  "🙌", "👏", "👍", "🙏", "💪", "🤝", "❤️", "🔥",
  "✨", "🌟", "🎉", "🏆", "🎬", "🎥", "🎭", "🎤",
  "🎶", "💃", "🕺", "📸", "🎞️", "🍿", "🎧", "✍️",
];

// interactive prompts that open the composer with a themed placeholder
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
      id
      kind
      timeAgo
      text
      likes
      comments
      liked
      castingCallId
      mediaUrl
      mediaType
      media { id title kind year tone aspect }
      author { id name headline hue avatarUrl }
    }
    castingCalls {
      id
      title
      medium
      location
      deadline
    }
    people {
      id
      name
      headline
      hue
      avatarUrl
    }
  }
`;

export default function HomePage() {
  const { user } = useSession();
  const { toast } = useToast();
  const [posts, setPosts] = useState<FeedPost[] | null>(null);
  const [calls, setCalls] = useState<SidebarCall[]>([]);
  const [suggested, setSuggested] = useState<SidebarPerson[]>([]);
  const [myPosts, setMyPosts] = useState<FeedPost[]>([]);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");
  const [placeholder, setPlaceholder] = useState("What's happening on set?");
  const [attachment, setAttachment] = useState<{ url: string; kind: "image" | "video" } | null>(null);
  const [attachError, setAttachError] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [error, setError] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const draftInput = useRef<HTMLTextAreaElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gql<{
      feed: (FeedPost & { castingCallId?: string })[];
      castingCalls: SidebarCall[];
      people: SidebarPerson[];
    }>(FEED_QUERY)
      .then((d) => {
        const callIndex = new Map(d.castingCalls.map((c) => [c.id, c]));
        setPosts(
          d.feed.map((p) => {
            const call = p.castingCallId ? callIndex.get(p.castingCallId) : undefined;
            return call
              ? { ...p, castingTitle: call.title, castingMeta: `${call.medium} · ${call.location} · closes ${call.deadline}` }
              : p;
          })
        );
        setCalls(d.castingCalls.slice(0, 3));
        setSuggested(d.people.slice(0, 4));
      })
      .catch(() => setError(true));
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

  // open the composer when arriving from a "Create" button
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

  // "Create" button on the feed page opens the composer in place
  useEffect(() => {
    const onCompose = () => openComposer();
    window.addEventListener("kaledio:compose", onCompose);
    return () => window.removeEventListener("kaledio:compose", onCompose);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const greet = useMemo(() => greeting(), []);

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
      .catch(() => {
        // keep the optimistic post visible even if the write failed
      });
  };

  const feedEmpty = posts?.length === 0 && myPosts.length === 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)_300px]">
      {/* ————— left rail ————— */}
      <aside className="hidden lg:block">
        <div className="sticky top-24 space-y-4">
          <Card interactive className="overflow-hidden">
            <div className="relative h-20 [background:var(--grad-hero)] grad-animate">
              <div className="absolute inset-0 opacity-30 [background:var(--grad-mesh)]" />
            </div>
            <div className="-mt-9 px-5 pb-5">
              <Avatar name={user.name} hue={3} size={60} ring src={avatarSrc} />
              <Link href="/profile" className="mt-3 block text-[16px] font-semibold text-ink-900 hover:text-brand-700">
                {user.name}
              </Link>
              <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-ink-500">{user.headline}</p>
              <div className="mt-3">
                <AvailabilityBadge status={user.availability as Availability} />
              </div>
              <Link
                href="/profile"
                className="mt-4 block border-t border-line pt-3.5 text-[13px] font-semibold text-brand-600 transition-colors hover:text-brand-700"
              >
                View my profile →
              </Link>
            </div>
          </Card>

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
        {/* cinematic greeting hero */}
        <div className="anim-rise relative overflow-hidden rounded-2xl border border-brand-900/10 p-5 text-white shadow-lift [background:var(--grad-hero)] grad-animate sm:p-6">
          <div className="absolute inset-0 opacity-40 [background:var(--grad-mesh)]" />
          <div className="pointer-events-none absolute -right-6 -top-8 anim-float text-[120px] leading-none opacity-15">🎬</div>
          <div className="relative">
            <p className="text-[13px] font-medium text-white/80">{greet},</p>
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              {user.name.split(" ")[0]}
            </h1>
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

        {error && (
          <Card className="p-8 text-center">
            <p className="text-sm font-medium text-ink-700">The feed didn&apos;t load.</p>
            <Button variant="primary" className="mt-3" onClick={() => window.location.reload()}>
              Try again
            </Button>
          </Card>
        )}

        {!posts && !error && (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <Card key={i} className="space-y-3 p-5">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-11 w-11 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-40" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                </div>
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-4/5" />
                <Skeleton className="h-44 w-full" />
              </Card>
            ))}
          </div>
        )}

        {feedEmpty && !error && (
          <EmptyState
            icon={<IconSparkle size={24} />}
            title="Your feed is just getting started"
            hint="Post your first update or follow more people — wraps, casting calls and premieres will show up here."
            action={
              <Button variant="accent" onClick={() => openComposer()}>
                Share your first post
              </Button>
            }
          />
        )}

        {posts?.map((p, i) => (
          <div key={p.id} className="anim-rise" style={{ animationDelay: `${Math.min(i, 6) * 0.06}s` }}>
            <PostCard post={p} />
          </div>
        ))}
      </section>

      {/* ————— right rail ————— */}
      <aside className="hidden lg:block">
        <div className="sticky top-24 space-y-4">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <IconFire size={16} className="text-accent-500" />
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">Trending on Kaledio</p>
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
            {calls.length === 0 ? (
              <p className="mt-3 text-[13px] text-ink-400">No open calls just yet — check back soon.</p>
            ) : (
              <ul className="mt-3 space-y-1">
                {calls.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/casting/${c.id}`}
                      className="block rounded-lg px-2.5 py-2.5 transition-colors hover:bg-canvas"
                    >
                      <span className="line-clamp-2 text-[13px] font-semibold leading-snug text-ink-800">{c.title}</span>
                      <span className="mt-1 block text-xs text-ink-400">
                        {c.medium} · {c.location} · closes {c.deadline}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/casting"
              className="mt-2 block border-t border-line px-2.5 pt-3 text-[13px] font-semibold text-brand-600 hover:text-brand-700"
            >
              See the full board →
            </Link>
          </Card>

          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">People to know</p>
            {suggested.length === 0 ? (
              <p className="mt-3 text-[13px] text-ink-400">New members will appear here as they join.</p>
            ) : (
              <ul className="mt-3 space-y-1">
                {suggested.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/profile/${p.id}`}
                      className="group flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-canvas"
                    >
                      <Avatar name={p.name} hue={p.hue} size={36} src={p.avatarUrl || undefined} />
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-semibold text-ink-800 group-hover:text-brand-700">
                          {p.name}
                        </span>
                        <span className="block truncate text-xs text-ink-400">{p.headline}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/search"
              className="mt-2 block border-t border-line px-2.5 pt-3 text-[13px] font-semibold text-brand-600 hover:text-brand-700"
            >
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
