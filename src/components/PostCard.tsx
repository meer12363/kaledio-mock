"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar } from "./Avatar";
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
import type { MediaItem, PostKind } from "@/lib/types";

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
  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.likes);
  const [commentCount, setCommentCount] = useState(post.comments);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [myComments, setMyComments] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const toggleLike = () => {
    setLiked((l) => !l);
    setLikes((n) => (liked ? n - 1 : n + 1));
    if (!post.mine) {
      gql(`mutation($id: ID!) { toggleLike(id: $id) { id likes liked } }`, { id: post.id }).catch(() => {
        // revert on failure
        setLiked(liked);
        setLikes(post.likes);
      });
    }
  };

  const addComment = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setMyComments((c) => [...c, text]);
    setCommentCount((n) => n + 1);
    setDraft("");
    if (!post.mine) {
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
    <Card className="overflow-hidden">
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
                ? "bg-brand-50 text-brand-700"
                : "bg-canvas text-ink-500"
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
          <div className="overflow-hidden rounded-lg bg-ink-900">
            {post.mediaType === "video" ? (
              <video src={post.mediaUrl} controls className="max-h-[480px] w-full" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.mediaUrl} alt="" className="max-h-[480px] w-full object-cover" />
            )}
          </div>
        </div>
      )}

      {!post.mediaUrl && post.media && (
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

      <div className="flex items-center gap-1 border-t border-line px-2 py-1 sm:px-3">
        <button
          onClick={toggleLike}
          aria-pressed={liked}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors duration-150 ${
            liked ? "text-brand-600" : "text-ink-500 hover:bg-canvas hover:text-ink-800"
          }`}
        >
          <IconHeart size={17} filled={liked} className={liked ? "scale-110" : ""} />
          {likes.toLocaleString("en-IN")}
        </button>
        <button
          onClick={() => setCommentsOpen((o) => !o)}
          aria-expanded={commentsOpen}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold text-ink-500 transition-colors duration-150 hover:bg-canvas hover:text-ink-800"
        >
          <IconComment size={17} />
          {commentCount}
        </button>
        <button
          onClick={share}
          className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold text-ink-500 transition-colors duration-150 hover:bg-canvas hover:text-ink-800"
        >
          <IconShare size={17} />
          {copied ? "Link copied" : "Share"}
        </button>
      </div>

      {commentsOpen && (
        <div className="border-t border-line bg-canvas/60 px-4 py-3.5 sm:px-5">
          {myComments.length > 0 && (
            <ul className="mb-3 space-y-2">
              {myComments.map((c, i) => (
                <li key={i} className="rounded-lg bg-paper px-3.5 py-2.5 text-sm text-ink-700 shadow-card">
                  <span className="mr-2 font-semibold text-ink-900">You</span>
                  {c}
                </li>
              ))}
            </ul>
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
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:opacity-40"
            >
              <IconSend size={15} />
            </button>
          </form>
        </div>
      )}
    </Card>
  );
}
