"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { PostCard, type FeedPost } from "@/components/PostCard";
import { AvailabilityBadge, Card, Skeleton } from "@/components/ui";
import {
  IconBriefcase,
  IconClapper,
  IconClock,
  IconSearch,
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
  const [posts, setPosts] = useState<FeedPost[] | null>(null);
  const [calls, setCalls] = useState<SidebarCall[]>([]);
  const [suggested, setSuggested] = useState<SidebarPerson[]>([]);
  const [myPosts, setMyPosts] = useState<FeedPost[]>([]);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState<{ url: string; kind: "image" | "video" } | null>(null);
  const [attachError, setAttachError] = useState("");
  const [error, setError] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

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

  if (!user) return null;

  const avatarSrc = user.details.profilePicture || undefined;

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
    setComposing(false);
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

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)_280px]">
      {/* ————— left rail ————— */}
      <aside className="hidden lg:block">
        <div className="sticky top-20 space-y-4">
          <Card className="overflow-hidden">
            <div className="h-16 bg-gradient-to-r from-brand-800 to-brand-500" />
            <div className="-mt-7 px-5 pb-5">
              <Avatar name={user.name} hue={3} size={56} ring src={avatarSrc} />
              <Link href="/profile" className="mt-3 block text-[16px] font-semibold text-ink-900 hover:text-brand-700 hover:underline">
                {user.name}
              </Link>
              <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-ink-500">{user.headline}</p>
              <div className="mt-3">
                <AvailabilityBadge status={user.availability as Availability} />
              </div>
              <div className="mt-4 border-t border-line pt-3.5 text-[13px]">
                <Link href="/profile" className="font-semibold text-brand-600 hover:text-brand-700">
                  View my profile →
                </Link>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">Shortcuts</p>
            <nav className="mt-3 space-y-1">
              <Link href="/casting" className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-canvas">
                <IconClapper size={17} className="text-brand-600" /> Casting board
              </Link>
              <Link href="/search" className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-canvas">
                <IconSearch size={17} className="text-brand-600" /> Find people
              </Link>
              <Link href="/connections" className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-canvas">
                <IconUsers size={17} className="text-brand-600" /> Connections
              </Link>
              <Link href="/dashboard" className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-canvas">
                <IconBriefcase size={17} className="text-brand-600" /> My Work / Studio
              </Link>
            </nav>
          </Card>
        </div>
      </aside>

      {/* ————— feed ————— */}
      <section className="min-w-0 space-y-4">
        {/* composer */}
        <Card className="p-4">
          {!composing ? (
            <div className="flex items-center gap-3">
              <Avatar name={user.name} hue={3} size={42} src={avatarSrc} />
              <button
                onClick={() => setComposing(true)}
                className="flex-1 rounded-full border border-line-strong px-5 py-2.5 text-left text-sm text-ink-400 transition-colors duration-150 hover:bg-canvas"
              >
                Share an update, a wrap, a win…
              </button>
            </div>
          ) : (
            <form onSubmit={publish} className="anim-fade">
              <div className="flex items-start gap-3">
                <Avatar name={user.name} hue={3} size={42} src={avatarSrc} />
                <textarea
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={3}
                  placeholder="What's happening on set?"
                  aria-label="Write a post"
                  className="flex-1 resize-none rounded-xl border border-line-strong px-4 py-3 text-[15px] leading-relaxed placeholder:text-ink-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>

              {attachment && (
                <div className="relative ml-[54px] mt-3 max-w-xs overflow-hidden rounded-lg border border-line">
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
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="rounded-full border border-line-strong px-4 py-2 text-[13px] font-semibold text-ink-600 transition-colors hover:border-brand-300 hover:text-brand-700"
                >
                  Photo / video
                </button>
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
                    }}
                    className="rounded-full px-4 py-2 text-sm font-semibold text-ink-500 transition-colors hover:bg-canvas"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!draft.trim()}
                    className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-40"
                  >
                    Post
                  </button>
                </div>
              </div>
            </form>
          )}
        </Card>

        {myPosts.map((p) => (
          <div key={p.id} className="anim-rise">
            <PostCard post={p} />
          </div>
        ))}

        {error && (
          <Card className="p-8 text-center">
            <p className="text-sm font-medium text-ink-700">The feed didn&apos;t load.</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Try again
            </button>
          </Card>
        )}

        {!posts && !error && (
          <>
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
          </>
        )}

        {posts?.length === 0 && !error && myPosts.length === 0 && (
          <Card className="p-10 text-center">
            <p className="text-[15px] font-semibold text-ink-700">The feed is empty for now.</p>
            <p className="mt-1.5 text-sm text-ink-500">Be the first to share an update, a wrap, or a casting call.</p>
          </Card>
        )}

        {posts?.map((p, i) => (
          <div key={p.id} className="anim-rise" style={{ animationDelay: `${Math.min(i, 6) * 0.05}s` }}>
            <PostCard post={p} />
          </div>
        ))}
      </section>

      {/* ————— right rail ————— */}
      <aside className="hidden lg:block">
        <div className="sticky top-20 space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">Closing soon</p>
              <IconClock size={15} className="text-ink-300" />
            </div>
            <ul className="mt-3 space-y-1">
              {calls.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/casting/${c.id}`}
                    className="block rounded-lg px-2.5 py-2.5 transition-colors hover:bg-canvas"
                  >
                    <span className="line-clamp-2 text-[13px] font-semibold leading-snug text-ink-800">
                      {c.title}
                    </span>
                    <span className="mt-1 block text-xs text-ink-400">
                      {c.medium} · {c.location} · closes {c.deadline}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/casting"
              className="mt-2 block border-t border-line px-2.5 pt-3 text-[13px] font-semibold text-brand-600 hover:text-brand-700"
            >
              See the full board →
            </Link>
          </Card>

          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">People to know</p>
            <ul className="mt-3 space-y-1">
              {suggested.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/profile/${p.id}`}
                    className="flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-canvas"
                  >
                    <Avatar name={p.name} hue={p.hue} size={36} src={p.avatarUrl || undefined} />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold text-ink-800">{p.name}</span>
                      <span className="block truncate text-xs text-ink-400">{p.headline}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/search"
              className="mt-2 block border-t border-line px-2.5 pt-3 text-[13px] font-semibold text-brand-600 hover:text-brand-700"
            >
              Search everyone →
            </Link>
          </Card>
        </div>
      </aside>
    </div>
  );
}
