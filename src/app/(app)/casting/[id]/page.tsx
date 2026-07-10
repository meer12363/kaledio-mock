"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Card, Skeleton, Tag } from "@/components/ui";
import {
  IconArrowLeft,
  IconCalendar,
  IconBookmark,
  IconChat,
  IconCheck,
  IconClock,
  IconMapPin,
  IconUsers,
  IconX,
} from "@/components/icons";
import { gql } from "@/lib/gql";
import { useSession } from "@/lib/session";

interface CallDetail {
  id: string;
  title: string;
  company: string;
  medium: string;
  location: string;
  compensation: string;
  shootDates: string;
  deadline: string;
  description: string;
  lookingFor: { name: string; brief: string }[];
  requirements: string[];
  tags: string[];
  applicants: number;
  postedAgo: string;
  applied: boolean;
  requiresAudition: boolean;
  bookmarked: boolean;
  postedBy: { id: string; name: string; headline: string; hue: number; avatarUrl: string };
}

export default function CastingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useSession();
  const [call, setCall] = useState<CallDetail | null | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [justApplied, setJustApplied] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    gql<{ castingCall: CallDetail | null }>(
      `query($id: ID!) {
        castingCall(id: $id) {
          id title company medium location compensation shootDates deadline description requiresAudition bookmarked
          lookingFor { name brief }
          requirements tags applicants postedAgo applied
          postedBy { id name headline hue avatarUrl }
        }
      }`,
      { id }
    )
      .then((d) => setCall(d.castingCall))
      .catch(() => setCall(null));
  }, [id]);

  const toggleBookmark = () => {
    if (!call) return;
    setCall((c) => (c ? { ...c, bookmarked: !c.bookmarked } : c));
    gql(`mutation($callId: ID!) { toggleBookmark(callId: $callId) }`, { callId: call.id }).catch(() => {
      setCall((c) => (c ? { ...c, bookmarked: !c.bookmarked } : c));
    });
  };

  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!call) return;
    setSubmitting(true);
    gql<{ applyToCasting: { id: string; applicants: number; applied: boolean } }>(
      `mutation($id: ID!, $note: String) { applyToCasting(id: $id, note: $note) { id applicants applied } }`,
      { id: call.id, note: note.trim() || undefined }
    )
      .then((d) => {
        setCall((c) => (c ? { ...c, applied: true, applicants: d.applyToCasting.applicants } : c));
        setJustApplied(true);
        setModalOpen(false);
      })
      .finally(() => setSubmitting(false));
  };

  const messagePoster = () => {
    if (!call) return;
    gql<{ startConversation: { id: string } }>(
      `mutation($personId: ID!) { startConversation(personId: $personId) { id } }`,
      { personId: call.postedBy.id }
    ).then((d) => router.push(`/messages?c=${d.startConversation.id}`));
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // clipboard unavailable — feedback still shown
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  if (call === undefined) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-5 w-40" />
        <Card className="space-y-4 p-7">
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-24 w-full" />
        </Card>
      </div>
    );
  }

  if (call === null) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <p className="font-display text-2xl text-ink-900">That call has left the building.</p>
        <p className="mt-2 text-sm text-ink-500">It may have closed or been withdrawn.</p>
        <Link
          href="/casting"
          className="mt-6 inline-block rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Back to the board
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/casting"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-800"
      >
        <IconArrowLeft size={15} /> Casting board
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        {/* main */}
        <div className="space-y-5">
          <Card className="anim-rise p-6 sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{call.medium}</span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  call.requiresAudition ? "bg-amber-50 text-warn" : "bg-canvas text-ink-500"
                }`}
              >
                {call.requiresAudition ? "Requires audition" : "Direct offer"}
              </span>
              <span className="text-xs text-ink-400">posted {call.postedAgo} ago</span>
            </div>
            <h1 className="mt-3.5 font-display text-[1.9rem] font-medium leading-tight tracking-tight text-ink-900">
              {call.title}
            </h1>
            <Link
              href={`/profile/${call.postedBy.id}`}
              className="mt-4 inline-flex items-center gap-2.5 rounded-lg py-1 pr-2 transition-colors hover:bg-canvas"
            >
              <Avatar name={call.postedBy.name} hue={call.postedBy.hue} size={34} src={call.postedBy.avatarUrl || undefined} />
              <span>
                <span className="block text-sm font-semibold text-ink-800">{call.company}</span>
                <span className="block text-xs text-ink-500">via {call.postedBy.name}</span>
              </span>
            </Link>

            <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-5 sm:grid-cols-4">
              {[
                { icon: IconMapPin, label: "Location", value: call.location },
                { icon: IconCalendar, label: "Shoot", value: call.shootDates },
                { icon: IconClock, label: "Apply by", value: call.deadline },
                { icon: IconUsers, label: "Applicants", value: String(call.applicants) },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label}>
                  <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-400">
                    <Icon size={13} /> {label}
                  </dt>
                  <dd className="mt-1 text-[13px] font-semibold leading-snug text-ink-800">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card className="anim-rise p-6 sm:p-7">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-400">The brief</h2>
            <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-ink-800">{call.description}</p>

            <h2 className="mt-8 text-sm font-semibold uppercase tracking-[0.14em] text-ink-400">Looking for</h2>
            <ul className="mt-3 space-y-3">
              {call.lookingFor.map((r) => (
                <li key={r.name} className="rounded-xl border border-line bg-canvas/70 p-4">
                  <p className="text-[15px] font-semibold text-ink-900">{r.name}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-ink-600">{r.brief}</p>
                </li>
              ))}
            </ul>

            <h2 className="mt-8 text-sm font-semibold uppercase tracking-[0.14em] text-ink-400">To apply you&apos;ll need</h2>
            <ul className="mt-3 space-y-2.5">
              {call.requirements.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-ink-700">
                  <IconCheck size={16} className="mt-1 shrink-0 text-brand-600" />
                  {r}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-1.5 border-t border-line pt-5">
              {call.tags.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </div>
          </Card>
        </div>

        {/* apply rail */}
        <aside>
          <div className="sticky top-20 space-y-4">
            <Card className="anim-rise p-5">
              <p className="text-sm font-semibold text-ink-900">{call.compensation}</p>
              <p className="mt-1 text-xs text-ink-500">Closes {call.deadline}</p>

              {call.applied ? (
                <div className="mt-4 rounded-xl bg-go-soft p-4 text-center">
                  <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-go text-white">
                    <IconCheck size={18} />
                  </span>
                  <p className="mt-2.5 text-sm font-semibold text-go">Application sent</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-500">
                    {justApplied
                      ? "Your profile and reel went with it. Fingers crossed."
                      : "You've already applied to this call."}
                  </p>
                  <Link
                    href="/dashboard"
                    className="mt-2.5 inline-block text-xs font-semibold text-brand-600 hover:text-brand-700"
                  >
                    Track it in My Work →
                  </Link>
                </div>
              ) : (
                <button
                  onClick={() => setModalOpen(true)}
                  className="mt-4 w-full rounded-full bg-brand-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                >
                  Apply now
                </button>
              )}

              <button
                onClick={messagePoster}
                className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-full border border-line-strong py-2.5 text-sm font-semibold text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-700"
              >
                <IconChat size={16} /> Message {call.postedBy.name.split(" ")[0]}
              </button>
              <button
                onClick={toggleBookmark}
                aria-pressed={call.bookmarked}
                className={`mt-2.5 flex w-full items-center justify-center gap-2 rounded-full border py-2.5 text-sm font-semibold transition-colors ${
                  call.bookmarked
                    ? "border-brand-300 bg-brand-50 text-brand-700"
                    : "border-line-strong text-ink-700 hover:border-brand-300 hover:text-brand-700"
                }`}
              >
                <IconBookmark size={16} filled={call.bookmarked} />
                {call.bookmarked ? "On your calendar" : "Add to calendar"}
              </button>
              <button
                onClick={share}
                className="mt-2.5 w-full rounded-full py-2 text-[13px] font-semibold text-ink-500 transition-colors hover:bg-canvas"
              >
                {copied ? "Link copied ✓" : "Share this call"}
              </button>
            </Card>

            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">A note on self-tapes</p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-600">
                Natural light, clean sound, slate your name and height. Casting watches the first eight seconds — make them count.
              </p>
            </Card>
          </div>
        </aside>
      </div>

      {/* apply modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center bg-ink-900/50 p-4 sm:items-center"
          onClick={() => setModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`Apply to ${call.title}`}
        >
          <div
            className="anim-rise w-full max-w-lg rounded-2xl bg-paper p-6 shadow-pop sm:p-7"
            onClick={(e) => e.stopPropagation()}
            style={{ animationDuration: "0.25s" }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-ink-900">Apply to this call</h2>
                <p className="mt-0.5 line-clamp-1 text-sm text-ink-500">{call.title}</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                aria-label="Close"
                className="rounded-full p-2 text-ink-400 transition-colors hover:bg-canvas hover:text-ink-800"
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={apply} className="mt-5">
              <div className="flex items-center gap-3 rounded-xl border border-line bg-canvas/70 p-3.5">
                <Avatar name={user?.name ?? "You"} hue={3} size={40} src={user?.details.profilePicture || undefined} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-900">{user?.name}</p>
                  <p className="truncate text-xs text-ink-500">{user?.headline}</p>
                </div>
                <span className="shrink-0 rounded-md bg-brand-50 px-2 py-1 text-[11px] font-semibold text-brand-700">
                  Profile + reel attached
                </span>
              </div>

              <label className="mt-4 block">
                <span className="mb-1.5 block text-sm font-medium text-ink-700">
                  Note to casting <span className="font-normal text-ink-400">(optional)</span>
                </span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  placeholder="Why you, why this part. Two sentences beat two paragraphs."
                  className="w-full resize-none rounded-xl border border-line-strong px-4 py-3 text-[15px] leading-relaxed placeholder:text-ink-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </label>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-full px-5 py-2.5 text-sm font-semibold text-ink-500 transition-colors hover:bg-canvas"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
                >
                  {submitting ? "Sending…" : "Send application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
