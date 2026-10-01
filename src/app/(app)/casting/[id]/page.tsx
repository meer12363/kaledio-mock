"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Card, Skeleton, Tag } from "@/components/ui";
import { CallSheetHeader, CastList, Stamp, useCountdown } from "@/components/CallSheet";
import { SelfTapeBooth, type Take } from "@/components/SelfTapeBooth";
import { IconArrowLeft, IconBookmark, IconChat, IconCheck, IconX } from "@/components/icons";
import { gql } from "@/lib/gql";
import { useSession } from "@/lib/session";
import { recordApplication, useApplications } from "@/lib/applied";
import { MOCK_CALL_DETAILS, MOCK_CALLS, MOCK_PEOPLE } from "@/lib/mock";

interface CallDetail {
  id: string;
  title: string;
  company: string;
  medium: string;
  location: string;
  compensation: string;
  shootDates: string;
  deadline: string;
  deadlineISO?: string;
  description: string;
  lookingFor: { name: string; brief: string }[];
  requirements: string[];
  tags: string[];
  applicants: number;
  postedAgo: string;
  applied: boolean;
  requiresAudition: boolean;
  bookmarked: boolean;
  hot?: boolean;
  postedBy: { id: string; name: string; headline: string; hue: number; avatarUrl: string };
}

/** demo calls live in lib/mock, so their sheets open too instead of dead ending */
function mockDetail(id: string): CallDetail | null {
  const c = MOCK_CALLS.find((x) => x.id === id);
  const d = MOCK_CALL_DETAILS[id];
  if (!c || !d) return null;
  const p = MOCK_PEOPLE.find((x) => x.id === c.postedById);
  return {
    ...c,
    ...d,
    applied: false,
    bookmarked: false,
    postedBy: { id: p?.id ?? c.postedById, name: p?.name ?? c.company, headline: p?.headline ?? "", hue: p?.hue ?? 2, avatarUrl: "" },
  };
}

const STAGES = ["Sent", "Seen by casting", "Shortlisted", "Audition", "Booked"];

export default function CastingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isGuest } = useSession();
  const applications = useApplications();
  const [call, setCall] = useState<CallDetail | null | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [boothOpen, setBoothOpen] = useState(false);
  const [tape, setTape] = useState<Take | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sendError, setSendError] = useState("");
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
      .then((d) => setCall(d.castingCall ?? mockDetail(id)))
      .catch(() => setCall(mockDetail(id)));
  }, [id]);

  // free the tape's memory when leaving the page
  const tapeRef = useRef<Take | null>(null);
  useEffect(() => {
    tapeRef.current = tape;
  }, [tape]);
  useEffect(() => () => {
    if (tapeRef.current) URL.revokeObjectURL(tapeRef.current.url);
  }, []);

  const isMock = id.startsWith("mock-");
  const local = applications[id];
  const applied = !!call?.applied || !!local;

  const countdown = useCountdown(
    call
      ? { ...call, roles: call.lookingFor.length || 1 }
      : { id, title: "", company: "", medium: "", location: "", compensation: "", deadline: "", applicants: 0, roles: 0 }
  );

  const toggleBookmark = () => {
    if (!call) return;
    setCall((c) => (c ? { ...c, bookmarked: !c.bookmarked } : c));
    if (isMock) return;
    gql(`mutation($callId: ID!) { toggleBookmark(callId: $callId) }`, { callId: call.id }).catch(() => {
      setCall((c) => (c ? { ...c, bookmarked: !c.bookmarked } : c));
    });
  };

  const finishApply = (applicants?: number) => {
    recordApplication(id, { tapeSeconds: tape ? Math.round(tape.seconds) : undefined });
    setCall((c) => (c ? { ...c, applied: true, applicants: applicants ?? c.applicants + 1 } : c));
    setJustApplied(true);
    setModalOpen(false);
    navigator.vibrate?.([20, 40, 20]);
  };

  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!call) return;
    setSendError("");
    if (isMock) {
      finishApply();
      return;
    }
    setSubmitting(true);
    const fullNote = [note.trim(), tape ? `Self tape attached (${Math.round(tape.seconds)}s)` : ""].filter(Boolean).join("\n\n");
    gql<{ applyToCasting: { id: string; applicants: number; applied: boolean } }>(
      `mutation($id: ID!, $note: String) { applyToCasting(id: $id, note: $note) { id applicants applied } }`,
      { id: call.id, note: fullNote || undefined }
    )
      .then((d) => finishApply(d.applyToCasting.applicants))
      .catch(() => setSendError(isGuest ? "Make a free account to send this. Your tape stays here while you do." : "That didn't send. Check your connection and try again."))
      .finally(() => setSubmitting(false));
  };

  const messagePoster = () => {
    if (!call) return;
    if (isMock) {
      router.push("/messages");
      return;
    }
    gql<{ startConversation: { id: string } }>(
      `mutation($personId: ID!) { startConversation(personId: $personId) { id } }`,
      { personId: call.postedBy.id }
    ).then((d) => router.push(`/messages?c=${d.startConversation.id}`));
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // clipboard unavailable, feedback still shown
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  if (call === undefined) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
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
        <Stamp tone="ink">Wrapped</Stamp>
        <p className="mt-5 font-display text-2xl font-bold text-ink-900">This call has wrapped.</p>
        <p className="mt-2 text-sm text-ink-500">It closed or the production pulled it. Plenty more on the board.</p>
        <Link href="/casting" className="mt-6 inline-block rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-500">
          Back to the board
        </Link>
      </div>
    );
  }

  const roles = call.lookingFor.map((r) => r.name);
  const tapeSeconds = tape ? Math.round(tape.seconds) : local?.tapeSeconds;

  return (
    <div className="mx-auto max-w-5xl pb-20 lg:pb-0">
      <Link href="/casting" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-800">
        <IconArrowLeft size={15} /> Casting board
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-5">
          <CallSheetHeader
            call={{ ...call, roles: call.lookingFor.length || 1 }}
            shootDates={call.shootDates}
            requiresAudition={call.requiresAudition}
            postedAgo={call.postedAgo}
            poster={
              <Link href={`/profile/${call.postedBy.id}`} className="inline-flex items-center gap-2.5 rounded-lg py-1 pr-2 transition-colors hover:bg-ink-900/[0.04]">
                <Avatar name={call.postedBy.name} hue={call.postedBy.hue} size={34} src={call.postedBy.avatarUrl || undefined} />
                <span>
                  <span className="block text-sm font-semibold text-ink-800">{call.company}</span>
                  <span className="block text-xs text-ink-500">Casting by {call.postedBy.name}</span>
                </span>
              </Link>
            }
          />

          <Card className="anim-rise p-5 sm:p-7">
            <h2 className="eyebrow">The brief</h2>
            <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-ink-800">{call.description}</p>

            {call.lookingFor.length > 0 && (
              <>
                <h2 className="mt-8 eyebrow">Cast list</h2>
                <div className="mt-3">
                  <CastList roles={call.lookingFor} />
                </div>
              </>
            )}

            {call.requirements.length > 0 && (
              <>
                <h2 className="mt-8 eyebrow">Bring this</h2>
                <ul className="mt-3 space-y-2.5">
                  {call.requirements.map((r) => (
                    <li key={r} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-ink-700">
                      <IconCheck size={16} className="mt-1 shrink-0 text-brand-600" />
                      {r}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {call.tags.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-1.5 border-t border-line pt-5">
                {call.tags.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* ——— apply rail ——— */}
        <aside>
          <div className="sticky top-24 space-y-4">
            <Card className="anim-rise overflow-hidden">
              {applied ? (
                <div className="p-5">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white"
                      style={justApplied ? { animation: "pop-in 0.45s cubic-bezier(0.34,1.56,0.64,1) both" } : undefined}
                    >
                      <IconCheck size={20} />
                    </span>
                    <div>
                      <p className="font-display text-[18px] font-bold leading-tight text-ink-900">{justApplied ? "You're in the pile" : "You applied"}</p>
                      <p className="text-[12.5px] text-ink-500">{tapeSeconds ? `With a ${tapeSeconds}s self tape` : "Profile sent"}</p>
                    </div>
                  </div>
                  {/* where it is right now */}
                  <ol className="mt-5 space-y-0">
                    {STAGES.map((s, i) => (
                      <li key={s} className="flex items-center gap-3">
                        <span className="flex w-4 flex-col items-center">
                          <span className={`h-3 w-3 rounded-full border-2 ${i === 0 ? "border-brand-600 bg-brand-600" : "border-ink-900/25"}`} />
                          {i < STAGES.length - 1 && <span className={`h-5 w-0.5 ${i === 0 ? "bg-brand-600/40" : "bg-ink-900/10"}`} />}
                        </span>
                        <span className={`-mt-5 text-[13px] ${i === 0 ? "font-bold text-ink-900" : "text-ink-400"} ${i === STAGES.length - 1 ? "mt-0" : ""}`}>{s}</span>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-ink-500">We&apos;ll ping you the second casting opens it. Most calls move within a week.</p>
                  <Link href="/dashboard" className="mt-3 inline-block text-[13px] font-bold text-brand-600 hover:underline">
                    Track it in My Work →
                  </Link>
                </div>
              ) : (
                <div className="p-5">
                  <p className="text-[15px] font-bold text-ink-900">{call.compensation}</p>
                  <p className={`mt-0.5 font-mono text-[11px] font-bold uppercase tracking-wider ${countdown?.urgent ? "text-brand-600" : "text-ink-400"}`}>
                    {countdown ? countdown.label : `Apply by ${call.deadline}`}
                  </p>
                  <button
                    onClick={() => setModalOpen(true)}
                    disabled={countdown?.closed}
                    className="press mt-4 w-full rounded-lg bg-brand-600 py-3 text-[15px] font-bold text-white transition-colors hover:bg-brand-500 disabled:opacity-40"
                  >
                    {call.requiresAudition ? "Tape and apply" : "Apply"}
                  </button>
                </div>
              )}
              <div className="grid grid-cols-2 border-t border-line">
                <button onClick={messagePoster} className="flex items-center justify-center gap-1.5 border-r border-line py-3 text-[13px] font-semibold text-ink-600 transition-colors hover:bg-ink-900/[0.03] hover:text-ink-900">
                  <IconChat size={15} /> Message
                </button>
                <button
                  onClick={toggleBookmark}
                  aria-pressed={call.bookmarked}
                  className={`flex items-center justify-center gap-1.5 py-3 text-[13px] font-semibold transition-colors hover:bg-ink-900/[0.03] ${call.bookmarked ? "text-brand-600" : "text-ink-600 hover:text-ink-900"}`}
                >
                  <IconBookmark size={15} filled={call.bookmarked} /> {call.bookmarked ? "Saved" : "Save"}
                </button>
              </div>
              <button onClick={share} className="w-full border-t border-line py-2.5 text-[12.5px] font-semibold text-ink-500 transition-colors hover:bg-ink-900/[0.03]">
                {copied ? "Link copied ✓" : "Send this to a friend"}
              </button>
            </Card>

            {call.requiresAudition && (
              <Card className="p-5">
                <p className="eyebrow">Self tape tips</p>
                <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-ink-600">
                  <li>Face a window. Daylight beats any ring light.</li>
                  <li>Slate first: name, height, city.</li>
                  <li>Casting decides in the first eight seconds. Start strong.</li>
                </ul>
              </Card>
            )}
          </div>
        </aside>
      </div>

      {/* phones: the apply button would sit below the whole brief, so pin it */}
      {!applied && !countdown?.closed && (
        <div className="fixed inset-x-3 bottom-24 z-30 lg:hidden md:bottom-4">
          <button
            onClick={() => setModalOpen(true)}
            className="press flex w-full items-center justify-between rounded-xl bg-brand-600 px-5 py-3.5 text-white shadow-pop"
          >
            <span className="text-left">
              <span className="block text-[15px] font-bold">{call.requiresAudition ? "Tape and apply" : "Apply"}</span>
              <span className="block font-mono text-[10.5px] uppercase tracking-wider text-white/75">{countdown ? countdown.label : `Apply by ${call.deadline}`}</span>
            </span>
            <span className="text-[13px] font-semibold text-white/85">{call.compensation} →</span>
          </button>
        </div>
      )}

      {/* ——— apply sheet ——— */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[300] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`Apply to ${call.title}`}
        >
          <div className="anim-rise w-full max-w-lg overflow-hidden rounded-t-2xl bg-paper shadow-pop sm:rounded-2xl" onClick={(e) => e.stopPropagation()} style={{ animationDuration: "0.25s" }}>
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ink-400">Applying to</p>
                <h2 className="mt-0.5 truncate text-[16px] font-bold text-ink-900">{call.title}</h2>
              </div>
              <button onClick={() => setModalOpen(false)} aria-label="Close" className="rounded-full p-2 text-ink-400 transition-colors hover:bg-ink-900/[0.05] hover:text-ink-800">
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={apply} className="space-y-4 px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3 rounded-xl border border-line p-3">
                <Avatar name={user?.name ?? "You"} hue={3} size={40} src={user?.details.profilePicture || undefined} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-900">{user?.name}</p>
                  <p className="truncate text-xs text-ink-500">{user?.headline || "Your profile goes with it"}</p>
                </div>
                <span className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-400">Profile ✓</span>
              </div>

              {/* self tape */}
              <div className={`rounded-xl border p-3 ${tape ? "border-brand-600/50" : "border-dashed border-line-strong"}`}>
                {tape ? (
                  <div className="flex items-center gap-3">
                    <video src={tape.url} muted playsInline className="h-14 w-24 shrink-0 rounded-md bg-black object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink-900">Take {tape.n} attached</p>
                      <p className="text-xs text-ink-500">{Math.round(tape.seconds)} seconds, slate burned in</p>
                    </div>
                    <button type="button" onClick={() => setBoothOpen(true)} className="text-[12.5px] font-bold text-brand-600 hover:underline">
                      Redo
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-ink-900 font-mono text-[10px] font-bold text-canvas">REC</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink-900">{call.requiresAudition ? "This one needs a self tape" : "Add a self tape"}</p>
                      <p className="text-xs text-ink-500">Shoot it right here. Takes two minutes.</p>
                    </div>
                    <button type="button" onClick={() => setBoothOpen(true)} className="press rounded-lg bg-ink-900 px-3.5 py-2 text-[13px] font-bold text-canvas">
                      Record
                    </button>
                  </div>
                )}
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink-700">
                  Note to casting <span className="font-normal text-ink-400">(optional)</span>
                </span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Why you, why this part. Two lines beat two paragraphs."
                  className="w-full resize-none rounded-xl border border-line-strong bg-transparent px-4 py-3 text-[15px] leading-relaxed placeholder:text-ink-300 focus:border-brand-600 focus:outline-none"
                />
              </label>

              {sendError && (
                <p role="alert" className="rounded-lg bg-danger/10 px-3.5 py-2.5 text-sm font-medium text-danger">
                  {sendError}{" "}
                  {isGuest && (
                    <Link href="/signup" className="font-bold underline">
                      Sign up
                    </Link>
                  )}
                </p>
              )}

              <div className="flex items-center justify-between gap-2 pt-1">
                <p className="text-[12px] text-ink-400">{call.requiresAudition && !tape ? "You can send without a tape, but casting will ask." : " "}</p>
                <button type="submit" disabled={submitting} className="press shrink-0 rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-500 disabled:opacity-60">
                  {submitting ? "Sending…" : "Send it"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {boothOpen && (
        <SelfTapeBooth
          slate={{ name: user?.name ?? "Your name", project: call.title, roles }}
          onClose={() => setBoothOpen(false)}
          onUse={(t) => {
            if (tape) URL.revokeObjectURL(tape.url);
            setTape(t);
            setBoothOpen(false);
          }}
        />
      )}
    </div>
  );
}
