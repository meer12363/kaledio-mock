"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar } from "./Avatar";
import { CineVideo } from "./CineVideo";
import { MediaPlaceholder } from "./Media";
import { Card } from "./ui";
import {
  IconClapper,
  IconComment,
  IconHeart,
  IconSend,
  IconShare,
} from "./icons";
import { gql } from "@/lib/gql";
import { useSession } from "@/lib/session";
import { REACTIONS } from "@/lib/mock";
import { CLIPS, type ClipId } from "@/lib/clips";
import type { MediaItem, PostKind } from "@/lib/types";

interface PostComment {
  id: string;
  author: { id: string; name: string; headline: string; hue: number; avatarUrl?: string };
  text: string;
  timeAgo: string;
}

export interface FeedPost {
  id: string;
  author: { id: string; name: string; headline: string; hue: number; avatarUrl?: string };
  kind: PostKind;
  timeAgo: string;
  text: string;
  media?: MediaItem | null;
  /** real uploaded attachment (data URL) */
  mediaUrl?: string | null;
  mediaType?: "image" | "video" | null;
  /** looping footage for mock trailer / BTS posts */
  clip?: ClipId;
  likes: number;
  comments: number;
  liked: boolean;
  castingCallId?: string | null;
  /** posts composed locally by the signed-in user */
  mine?: boolean;
  castingTitle?: string;
  castingMeta?: string;
}

const KIND_LABELS: Record<PostKind, string> = {
  announcement: "Update",
  casting: "Casting call",
  trailer: "Trailer",
  bts: "Behind the scenes",
};

export function PostCard({ post }: { post: FeedPost }) {
  const { user } = useSession();
  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.likes);
  const [commentCount, setCommentCount] = useState(post.comments);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [comments, setComments] = useState<PostComment[] | null>(null);
  const [copied, setCopied] = useState(false);
  const [burst, setBurst] = useState(false);
  const [reaction, setReaction] = useState<string | null>(post.liked ? "❤️" : null);
  const [pickerOpen, setPickerOpen] = useState(false);

  // optimistic posts don't exist on the server until createPost confirms
  const isPending = post.id.startsWith("pending-");

  const pickReaction = (emoji: string) => {
    setPickerOpen(false);
    setBurst(true);
    window.setTimeout(() => setBurst(false), 600);
    setReaction((prev) => {
      if (prev === emoji) {
        setLikes((n) => Math.max(0, n - 1));
        setLiked(false);
        return null;
      }
      if (!prev) setLikes((n) => n + 1);
      setLiked(true);
      return emoji;
    });
    if (!isPending && !liked) {
      gql(`mutation($id: ID!) { toggleLike(id: $id) { id } }`, { id: post.id }).catch(() => {});
    }
  };

  const toggleLike = () => {
    if (reaction) {
      // clear reaction
      setReaction(null);
      setLiked(false);
      setLikes((n) => Math.max(0, n - 1));
      return;
    }
    setReaction("❤️");
    if (!liked) {
      setBurst(true);
      window.setTimeout(() => setBurst(false), 600);
    }
    setLiked((l) => !l);
    setLikes((n) => (liked ? n - 1 : n + 1));
    if (!isPending) {
      gql(`mutation($id: ID!) { toggleLike(id: $id) { id likes liked } }`, { id: post.id }).catch(() => {
        // revert on failure
        setLiked(liked);
        setLikes(post.likes);
      });
    }
  };

  const openComments = () => {
    setCommentsOpen((o) => !o);
    if (comments !== null || isPending) return;
    gql<{ postComments: PostComment[] }>(
      `query($postId: ID!) {
        postComments(postId: $postId) {
          id text timeAgo
          author { id name headline hue avatarUrl }
        }
      }`,
      { postId: post.id }
    )
      .then((d) => setComments(d.postComments))
      .catch(() => setComments([]));
  };

  const addComment = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !user) return;
    const optimistic: PostComment = {
      id: `local-${Date.now()}`,
      author: {
        id: user.id ?? "me",
        name: user.name,
        headline: user.headline,
        hue: 3,
        avatarUrl: user.details?.profilePicture || undefined,
      },
      text,
      timeAgo: "now",
    };
    setComments((c) => [...(c ?? []), optimistic]);
    setCommentCount((n) => n + 1);
    setDraft("");
    if (!isPending) {
      gql(`mutation($postId: ID!, $text: String!) { addComment(postId: $postId, text: $text) }`, {
        postId: post.id,
        text,
      }).catch(() => {
        // best-effort — the optimistic comment stays visible either way
      });
    }
  };

  const share = async () => {
    const url = `${window.location.origin}${post.castingCallId ? `/casting/${post.castingCallId}` : `/profile/${post.author.id}`}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // clipboard unavailable — still show feedback so the button isn't dead
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const profileHref = post.mine ? "/profile" : `/profile/${post.author.id}`;

  return (
    <Card interactive className="overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <Link href={profileHref} aria-label={`${post.author.name}'s profile`}>
            <Avatar name={post.author.name} hue={post.author.hue} size={44} src={post.author.avatarUrl || undefined} />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link
                href={profileHref}
                className="truncate text-[15px] font-semibold text-ink-900 hover:text-brand-700 hover:underline"
              >
                {post.author.name}
              </Link>
              <span className="text-ink-300">·</span>
              <span className="shrink-0 text-xs text-ink-400">{post.timeAgo}</span>
            </div>
            <p className="truncate text-[13px] text-ink-500">{post.author.headline}</p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              post.kind === "casting"
                ? "text-white shadow-glow-accent [background:var(--grad-spotlight)]"
                : post.kind === "trailer"
                ? "bg-pop-50 text-pop-700"
                : post.kind === "bts"
                ? "bg-accent-50 text-accent-700"
                : "bg-brand-50 text-brand-700"
            }`}
          >
            {KIND_LABELS[post.kind]}
          </span>
        </div>

        <p className="mt-3.5 whitespace-pre-line text-[15px] leading-relaxed text-ink-800">
          {post.text}
        </p>
      </div>

      {post.mediaUrl && (
        <div className="px-4 pb-4 sm:px-5">
          <div className="overflow-hidden rounded-xl bg-black">
            {post.mediaType === "video" ? (
              <video src={post.mediaUrl} controls className="max-h-[480px] w-full" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.mediaUrl} alt="" className="max-h-[480px] w-full object-cover" />
            )}
          </div>
        </div>
      )}

      {!post.mediaUrl && post.clip && <ClipPlayer clip={post.clip} media={post.media} />}

      {!post.mediaUrl && !post.clip && post.media && (
        <div className="px-4 pb-4 sm:px-5">
          <MediaPlaceholder item={post.media} />
        </div>
      )}

      {post.castingCallId && (
        <div className="px-4 pb-4 sm:px-5">
          <Link
            href={`/casting/${post.castingCallId}`}
            className="group flex items-center gap-3.5 rounded-xl border border-line bg-canvas p-4 transition-colors duration-150 hover:border-brand-300 hover:bg-brand-50/60"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
              <IconClapper size={19} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-ink-900">
                {post.castingTitle ?? "View casting call"}
              </span>
              <span className="block truncate text-xs text-ink-500">
                {post.castingMeta ?? "Details, roles and how to apply"}
              </span>
            </span>
            <span className="shrink-0 text-sm font-semibold text-brand-600 transition-transform duration-150 group-hover:translate-x-0.5">
              View →
            </span>
          </Link>
        </div>
      )}

      {/* reaction summary */}
      {likes > 0 && (
        <div className="flex items-center gap-2 px-4 pb-1 pt-1 sm:px-5">
          <span className="flex -space-x-1">
            {["❤️", "🔥", "👏"].map((e, i) => (
              <span
                key={e}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-paper text-[11px] ring-1 ring-line"
                style={{ zIndex: 3 - i }}
              >
                {e}
              </span>
            ))}
          </span>
          <span className="text-[12.5px] text-ink-500">
            {reaction ? "You" : "Aanya"} and {(likes - (reaction ? 1 : 0)).toLocaleString("en-IN")} others
          </span>
        </div>
      )}

      <div className="flex items-center gap-1 border-t border-line px-2 py-1 sm:px-3">
        {/* react control with hover picker */}
        <div
          className="relative"
          onMouseEnter={() => setPickerOpen(true)}
          onMouseLeave={() => setPickerOpen(false)}
        >
          {pickerOpen && (
            <div
              className="absolute bottom-[calc(100%+6px)] left-0 z-20 flex items-center gap-0.5 rounded-full border border-line bg-paper px-1.5 py-1 shadow-pop"
              style={{ animation: "pop-in 0.18s cubic-bezier(0.34,1.56,0.64,1) both" }}
            >
              {REACTIONS.map((e) => (
                <button
                  key={e}
                  onClick={() => pickReaction(e)}
                  aria-label={`React ${e}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[20px] transition-transform duration-150 hover:-translate-y-1 hover:scale-125"
                >
                  {e}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={toggleLike}
            aria-pressed={liked}
            className={`press flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors duration-150 ${
              reaction ? "text-accent-600" : "text-ink-500 hover:bg-canvas hover:text-ink-800"
            }`}
          >
            <span className="relative inline-flex">
              {reaction ? (
                <span
                  className="text-[17px] leading-none"
                  style={burst ? { animation: "like-burst 0.55s cubic-bezier(0.34,1.56,0.64,1)" } : undefined}
                >
                  {reaction}
                </span>
              ) : (
                <IconHeart size={17} />
              )}
              {burst && (
                <span
                  className="pointer-events-none absolute inset-0 rounded-full border-2 border-accent-500"
                  style={{ animation: "heart-ring 0.6s ease-out forwards" }}
                />
              )}
            </span>
            {reaction ? "Reacted" : "React"}
          </button>
        </div>
        <button
          onClick={openComments}
          aria-expanded={commentsOpen}
          className="press flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold text-ink-500 transition-colors duration-150 hover:bg-canvas hover:text-ink-800"
        >
          <IconComment size={17} />
          {commentCount}
        </button>
        <button
          onClick={share}
          className="press ml-auto flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold text-ink-500 transition-colors duration-150 hover:bg-canvas hover:text-ink-800"
        >
          <IconShare size={17} />
          {copied ? "Link copied" : "Share"}
        </button>
      </div>

      {commentsOpen && (
        <div className="border-t border-line bg-canvas/60 px-4 py-3.5 sm:px-5">
          {comments === null && !isPending && (
            <p className="mb-3 text-[13px] text-ink-400">Loading comments…</p>
          )}
          {comments && comments.length > 0 && (
            <ul className="mb-3 space-y-2">
              {comments.map((c) => (
                <li key={c.id} className="flex items-start gap-2.5 rounded-lg bg-paper px-3.5 py-2.5 shadow-card">
                  <Avatar name={c.author.name} hue={c.author.hue} size={28} src={c.author.avatarUrl || undefined} />
                  <div className="min-w-0">
                    <p className="text-[13px]">
                      <span className="font-semibold text-ink-900">{c.author.name}</span>
                      <span className="ml-2 text-xs text-ink-400">{c.timeAgo}</span>
                    </p>
                    <p className="mt-0.5 whitespace-pre-line text-sm leading-relaxed text-ink-700">{c.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {comments && comments.length === 0 && (
            <p className="mb-3 text-[13px] text-ink-400">No comments yet — start the conversation.</p>
          )}
          <form onSubmit={addComment} className="flex items-center gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a comment…"
              aria-label="Add a comment"
              className="min-w-0 flex-1 rounded-full border border-line-strong bg-paper px-4 py-2 text-sm placeholder:text-ink-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              aria-label="Post comment"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white transition-colors hover:bg-brand-500 disabled:opacity-40"
            >
              <IconSend size={15} />
            </button>
          </form>
        </div>
      )}
    </Card>
  );
}

/** in-feed autoplaying scene: muted by default, tap for sound */
function ClipPlayer({ clip, media }: { clip: ClipId; media?: MediaItem | null }) {
  const [muted, setMuted] = useState(true);
  return (
    <div className="px-4 pb-4 sm:px-5">
      <div className="group relative aspect-video overflow-hidden rounded-xl bg-black">
        {media && <MediaPlaceholder item={{ ...media, aspect: "wide" }} className="absolute inset-0 h-full" />}
        <CineVideo clip={clip} muted={muted} length={16} onAutoMuted={() => setMuted(true)} className="absolute inset-0 h-full w-full" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent" />
        <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-danger" style={{ animation: "pulse-dot 1.4s ease-in-out infinite" }} />
          Playing
        </span>
        <span className="absolute bottom-3 left-3 font-mono text-[10px] uppercase tracking-wider text-white/60">
          {CLIPS[clip].film} · CC BY Blender Foundation
        </span>
        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? "Unmute video" : "Mute video"}
          className="press absolute bottom-2.5 right-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-base text-white backdrop-blur transition-colors hover:bg-black/80"
        >
          {muted ? "🔇" : "🔊"}
        </button>
      </div>
    </div>
  );
}
