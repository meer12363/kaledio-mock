"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/ui";
import { ScoreRing } from "@/components/ProfileScore";
import { useToast } from "@/components/Toast";
import { IconArrowLeft, IconCheck, IconX } from "@/components/icons";
import { useSession } from "@/lib/session";
import {
  COMPANY_CATEGORIES,
  COUNTRIES,
  QUALIFICATIONS,
  TARGET_AUDIENCES,
} from "@/lib/persona";
import { scoreProfile, type ScoreItem, type ScoreSection } from "@/lib/profileScore";
import { readAttachment, readImageDownscaled } from "@/lib/upload";
import type { ProfileDetails } from "@/lib/types";

const inputClass =
  "w-full rounded-xl border border-line-strong bg-canvas/50 px-3.5 py-2.5 text-[15px] text-ink-900 placeholder:text-ink-300 transition-all duration-150 focus:border-volt-ink focus:bg-paper focus:outline-none focus:ring-4 focus:ring-volt/15";

const COMMON_LANGUAGES = ["Hindi", "English", "Marathi", "Tamil", "Telugu", "Bengali", "Malayalam", "Kannada", "Gujarati", "Punjabi", "Urdu"];

const CHEERS: Record<string, string> = {
  photo: "Looking sharp — casting loves a face 📸",
  headline: "That headline slaps ✍️",
  bio: "Story unlocked — now they know you 💬",
  name: "Name on the call sheet 🪪",
  dob: "Birthday noted — cake on set? 🎂",
  origin: "Passport stamped 🌍",
  category: "Filed under awesome 🗂️",
  registration: "Officially official 📜",
  contact: "Now they can actually call you 📞",
  languages: "Multilingual menace 🗣️",
  qualification: "Scholar of the screen 🎓",
  experience: "Receipts attached 🎞️",
  recognition: "Trophy cabinet open 🏅",
  audience: "Aim locked 🎯",
  gallery: "Gallery is gallery-ing 🖼️",
  document: "Paperwork: handled 📄",
};

function bioTemplate(role: string, city: string) {
  return `I'm a ${role.toLowerCase()} based in ${city}. I love work that feels honest on screen — the quiet scenes, the messy ones, the ones people remember. Currently open to feature films, OTT series and ad films. Let's make something good.`;
}

function Field({
  label,
  children,
  hint,
  optional = false,
}: {
  label: string;
  children: React.ReactNode;
  hint?: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[13px] font-semibold text-ink-700">
        {label}
        {optional && <span className="ml-1.5 font-normal text-ink-400">(optional)</span>}
      </span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-ink-400">{hint}</span>}
    </label>
  );
}

/** A form "scene": emoji header, live points chip, glows once every item in it is done. */
function Section({
  id,
  emoji,
  title,
  hint,
  items,
  children,
  grid = true,
}: {
  id: ScoreSection;
  emoji: string;
  title: string;
  hint?: string;
  items: ScoreItem[];
  children: React.ReactNode;
  grid?: boolean;
}) {
  const left = items.filter((i) => !i.done).reduce((n, i) => n + i.points, 0);
  const complete = items.length > 0 && left === 0;
  return (
    <section id={id} className="scroll-mt-40 lg:scroll-mt-28">
      <Card className={`relative overflow-hidden p-5 transition-shadow duration-500 sm:p-6 ${complete ? "ring-1 ring-volt/40 shadow-glow-volt" : ""}`}>
        <div className="flex items-start gap-3">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[22px] transition-transform duration-500 ${complete ? "bg-volt/15 rotate-[-6deg] scale-105" : "bg-ink-900/[0.05]"}`}>
            {emoji}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-[19px] font-bold leading-tight text-ink-900">{title}</h2>
            {hint && <p className="mt-0.5 text-[13px] text-ink-500">{hint}</p>}
          </div>
          {items.length > 0 &&
            (complete ? (
              <span className="shrink-0 rounded-full bg-go-soft px-2.5 py-1 font-mono text-[10.5px] font-bold text-go" style={{ animation: "pop-in 0.35s cubic-bezier(0.34,1.56,0.64,1) both" }}>
                ✓ DONE
              </span>
            ) : (
              <span className="shrink-0 rounded-full bg-volt px-2.5 py-1 font-mono text-[10.5px] font-bold text-black">+{left} PTS</span>
            ))}
        </div>
        <div className={`mt-5 ${grid ? "grid gap-4 sm:grid-cols-2" : ""}`}>{children}</div>
      </Card>
    </section>
  );
}

function ddmmyyyyToInput(v: string): string {
  const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
}

function inputToDdmmyyyy(v: string): string {
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
}

const MAX_AUDIENCE_INDIVIDUAL = 5;
const MAX_GALLERY = 12;

export default function ProfileEditPage() {
  const { user, update } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [d, setD] = useState<ProfileDetails | null>(user ? { ...user.details, experience: { ...user.details.experience }, targetAudience: [...user.details.targetAudience], gallery: [...user.details.gallery] } : null);
  const [headline, setHeadline] = useState(user?.headline ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [gain, setGain] = useState<{ key: number; points: number } | null>(null);
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; d: number; e: string; r: number }>>([]);
  const galleryInput = useRef<HTMLInputElement>(null);
  const prevDone = useRef<Set<string> | null>(null);

  const s = useMemo(
    () => (user && d ? scoreProfile({ headline, bio, registrationType: user.registrationType, details: d }) : null),
    [user, d, headline, bio]
  );

  // celebrate every newly-completed item (not the ones already done on arrival)
  useEffect(() => {
    if (!s) return;
    const done = new Set(s.items.filter((i) => i.done).map((i) => i.id));
    const before = prevDone.current;
    prevDone.current = done;
    if (!before) return;
    const fresh = s.items.filter((i) => i.done && !before.has(i.id));
    if (!fresh.length) return;
    const points = fresh.reduce((n, i) => n + i.points, 0);
    toast(`+${points} · ${CHEERS[fresh[0].id] ?? "Nice!"}`, "accent");
    const t = window.setTimeout(() => {
      setGain({ key: Date.now(), points });
      if (s.score === 100) {
        const emoji = ["🎉", "✨", "🏆", "🎬", "⭐", "🍿"];
        setConfetti(
          Array.from({ length: 36 }, (_, i) => ({
            id: Date.now() + i,
            x: Math.random() * 100,
            d: Math.random() * 0.6,
            e: emoji[i % emoji.length],
            r: Math.random() * 360,
          }))
        );
        window.setTimeout(() => setConfetti([]), 2600);
      }
    }, 0);
    return () => window.clearTimeout(t);
  }, [s, toast]);

  // arriving from a "finish your profile" link: jump to the right scene
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const t = window.setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" }), 250);
    return () => window.clearTimeout(t);
  }, []);

  if (!user || !d || !s) return null;

  const isCompany = user.registrationType === "company";
  const audienceCap = isCompany ? TARGET_AUDIENCES.length : MAX_AUDIENCE_INDIVIDUAL;
  const role = user.roles[0] ?? (isCompany ? "Production house" : "Actor");
  const itemsFor = (sec: ScoreSection) => s.items.filter((i) => i.section === sec);
  const previewName = isCompany
    ? d.companyName.trim() || user.name
    : [d.firstName, d.lastName].map((x) => x.trim()).filter(Boolean).join(" ") || user.name;

  const headlineIdeas = isCompany
    ? [`${role} · ${user.location} · Casting now`, "We make ads people don't skip ⏭️", "Indie studio. Big stories. Small egos."]
    : [`${role} · ${user.location} · Open to work`, "Night-shoot survivor. Self-tape pro. 🌙", `${role} who reads the whole script 📖`, "Will cry on cue. Will also make you laugh 😅"];

  const set = <K extends keyof ProfileDetails>(key: K, value: ProfileDetails[K]) =>
    setD((prev) => (prev ? { ...prev, [key]: value } : prev));

  const setExp = (key: keyof ProfileDetails["experience"], value: string) =>
    setD((prev) => (prev ? { ...prev, experience: { ...prev.experience, [key]: value } } : prev));

  const toggleLanguage = (key: "languagesSpoken" | "languagesWritten", lang: string) => {
    const list = d[key].split(",").map((x) => x.trim()).filter(Boolean);
    const next = list.includes(lang) ? list.filter((x) => x !== lang) : [...list, lang];
    set(key, next.join(", "));
  };

  const toggleAudience = (a: string) => {
    setD((prev) => {
      if (!prev) return prev;
      const has = prev.targetAudience.includes(a);
      if (!has && prev.targetAudience.length >= audienceCap) return prev;
      return {
        ...prev,
        targetAudience: has ? prev.targetAudience.filter((x) => x !== a) : [...prev.targetAudience, a],
      };
    });
  };

  const onProfilePic = async (file?: File) => {
    if (!file) return;
    try {
      set("profilePicture", await readImageDownscaled(file, 512));
    } catch {
      setSaveError("That image couldn't be read — try a JPG or PNG.");
    }
  };

  const onGallery = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = MAX_GALLERY - d.gallery.length;
    const picked = Array.from(files).slice(0, room);
    try {
      const attachments = await Promise.all(picked.map(readAttachment));
      setD((prev) => (prev ? { ...prev, gallery: [...prev.gallery, ...attachments.map((a) => a.url)] } : prev));
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "One of those files couldn't be read.");
    }
  };

  const jump = (sec: ScoreSection) => document.getElementById(sec)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const displayName = isCompany
      ? d.companyName.trim() || user.name
      : [d.firstName, d.middleName, d.lastName].map((x) => x.trim()).filter(Boolean).join(" ") || user.name;
    setSaving(true);
    setSaveError("");
    try {
      await update({
        name: displayName,
        email: d.emailAddress.trim() || user.email,
        headline: headline.trim() || user.headline,
        bio: bio.trim() || user.bio,
        details: d,
      });
      toast(s.score === 100 ? "Saved — you're a Box Office Star 🏆" : `Saved at ${s.score}/100 — ${s.tier.title} ${s.tier.emoji}`, "success");
      window.setTimeout(() => router.push("/profile"), 700);
    } catch {
      setSaveError("Couldn't save your profile — check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const tierProgress = s.nextTier ? (s.score - s.tier.min) / (s.nextTier.min - s.tier.min) : 1;

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/profile" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-800">
        <IconArrowLeft size={15} /> Back to profile
      </Link>

      {/* ═════ header ═════ */}
      <div className="relative mt-4 overflow-hidden rounded-[28px] border border-white/10 p-6 text-white [background:var(--grad-hero)] grad-animate sm:p-8">
        <div className="absolute inset-0 opacity-40 [background:var(--grad-mesh)]" />
        <div className="pointer-events-none absolute -right-3 -top-4 anim-float text-[96px] leading-none opacity-20">🎬</div>
        <div className="relative">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/70">
            {isCompany ? "Company / Group account" : "Individual account"} · the director&apos;s cut
          </p>
          <h1 className="mt-2 font-display text-[36px] font-bold leading-[0.98] tracking-[-0.04em] sm:text-[50px]">
            Build a profile <span className="volt-text">casting can&apos;t skip.</span>
          </h1>
          <p className="mt-2 max-w-lg text-[14.5px] text-white/80">
            Every scene you fill in earns points. Hit 100 and you&apos;re a Box Office Star — complete profiles get found far more often.
          </p>
        </div>
      </div>

      {/* ═════ mobile scoreboard (sticky) ═════ */}
      <div className="sticky top-[76px] z-30 mt-4 lg:hidden">
        <button
          type="button"
          onClick={() => s.next[0] && jump(s.next[0].section)}
          className="flex w-full items-center gap-3 rounded-2xl border border-line bg-paper/90 p-2.5 text-left shadow-card backdrop-blur-xl"
        >
          <ScoreRing score={s.score} size={48} stroke={5} />
          <span className="min-w-0 flex-1">
            <span className="block text-[13.5px] font-bold text-ink-900">
              {s.tier.emoji} {s.tier.title}
            </span>
            <span className="block truncate text-[12px] text-ink-500">
              {s.next[0] ? `Next: ${s.next[0].cta} · +${s.next[0].points}` : "Profile complete — legend."}
            </span>
          </span>
        </button>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* ═════ desktop scoreboard ═════ */}
        <aside className="hidden lg:block">
          <div className="sticky top-[96px] space-y-4">
            <Card className="overflow-hidden">
              {/* live preview */}
              <div className="relative h-16 [background:var(--grad-spotlight)]" />
              <div className="-mt-9 px-5">
                <div className="inline-block rounded-full ring-4 ring-paper">
                  <Avatar name={previewName} hue={3} size={64} src={d.profilePicture || undefined} />
                </div>
                <p className="mt-2 truncate font-display text-[18px] font-bold text-ink-900">{previewName}</p>
                <p className="line-clamp-2 text-[12.5px] text-ink-500">{headline || "Your headline goes here…"}</p>
              </div>

              <div className="relative mt-4 flex items-center gap-4 border-t border-line px-5 py-4">
                <ScoreRing score={s.score} size={96} stroke={9} />
                {gain && (
                  <span
                    key={gain.key}
                    className="pointer-events-none absolute left-12 top-2 font-display text-[22px] font-bold text-volt-ink"
                    style={{ animation: "float-up 1.2s ease-out forwards" }}
                  >
                    +{gain.points}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="eyebrow">Your rank</p>
                  <p className="font-display text-[18px] font-bold leading-tight text-ink-900">
                    {s.tier.emoji} {s.tier.title}
                  </p>
                  <p className="mt-0.5 text-[11.5px] leading-snug text-ink-500">{s.tier.blurb}</p>
                </div>
              </div>
              {s.nextTier && (
                <div className="px-5 pb-4">
                  <div className="flex justify-between font-mono text-[10px] font-bold uppercase tracking-wider text-ink-400">
                    <span>{s.tier.title}</span>
                    <span>
                      {s.nextTier.emoji} {s.nextTier.title}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-canvas">
                    <div className="h-full rounded-full transition-all duration-700 [background:var(--grad-volt)]" style={{ width: `${Math.max(4, tierProgress * 100)}%` }} />
                  </div>
                  <p className="mt-1.5 text-[11.5px] text-ink-500">{s.nextTier.min - s.score} pts to go</p>
                </div>
              )}
            </Card>

            {/* checklist */}
            <Card className="p-2">
              <p className="eyebrow px-3 pb-1 pt-2.5">Scene checklist</p>
              <ul>
                {s.items.map((i) => (
                  <li key={i.id}>
                    <button
                      type="button"
                      onClick={() => jump(i.section)}
                      className="group flex w-full items-center gap-2.5 rounded-xl px-3 py-1.5 text-left transition-colors hover:bg-ink-900/[0.04]"
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[11px] font-bold transition-all duration-300 ${
                          i.done ? "scale-100 bg-volt text-black" : "border border-line-strong text-transparent"
                        }`}
                      >
                        ✓
                      </span>
                      <span className={`min-w-0 flex-1 truncate text-[12.5px] ${i.done ? "text-ink-400 line-through" : "font-semibold text-ink-800 group-hover:text-ink-900"}`}>
                        {i.emoji} {i.label}
                      </span>
                      <span className={`font-mono text-[10.5px] font-bold ${i.done ? "text-go" : "text-ink-400"}`}>+{i.points}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </aside>

        {/* ═════ the form ═════ */}
        <form onSubmit={save} className="min-w-0 space-y-4 pb-28">
          {/* photo */}
          <Section id="photo" emoji="📸" title={isCompany ? "Your logo" : "Your headshot"} hint="Profiles with a photo get way more clicks. Make it your best angle." items={itemsFor("photo")} grid={false}>
            <div className="flex flex-wrap items-center gap-5">
              <label className="group relative cursor-pointer">
                <span className={`block rounded-full p-1 ${d.profilePicture ? "[background:var(--grad-spotlight)]" : "border-2 border-dashed border-line-strong"}`}>
                  <span className="block overflow-hidden rounded-full ring-4 ring-paper">
                    <Avatar name={previewName} hue={3} size={112} src={d.profilePicture || undefined} />
                  </span>
                </span>
                <span className="absolute inset-1 flex items-center justify-center rounded-full bg-black/55 text-[26px] opacity-0 transition-opacity group-hover:opacity-100">📷</span>
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => onProfilePic(e.target.files?.[0])} />
              </label>
              <div>
                <p className="text-[15px] font-bold text-ink-900">{d.profilePicture ? "Looking good 😎" : "No photo yet — casting can't cast a blank circle"}</p>
                <p className="mt-0.5 text-[13px] text-ink-500">Tap the circle to {d.profilePicture ? "swap it" : "upload"}. JPG or PNG.</p>
                {d.profilePicture && (
                  <button type="button" onClick={() => set("profilePicture", "")} className="mt-2 rounded-full px-3 py-1 text-[12.5px] font-semibold text-ink-500 transition-colors hover:bg-ink-900/[0.05] hover:text-danger">
                    Remove photo
                  </button>
                )}
              </div>
            </div>
          </Section>

          {/* intro */}
          <Section id="intro" emoji="✍️" title="Your intro" hint="The first thing people read — in search, on your profile, in every application." items={itemsFor("intro")} grid={false}>
            <div className="space-y-4">
              <Field label="Headline" hint={`${headline.length}/120`}>
                <input value={headline} onChange={(e) => setHeadline(e.target.value)} maxLength={120} placeholder="e.g. Actor · Mumbai · Open to work" className={inputClass} />
              </Field>
              <div className="-mt-1 flex flex-wrap gap-1.5">
                <span className="self-center font-mono text-[10px] font-bold uppercase tracking-wider text-ink-400">Try:</span>
                {headlineIdeas.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHeadline(h)}
                    className="press rounded-full border border-line-strong px-3 py-1 text-[12px] font-medium text-ink-600 transition-colors hover:border-volt-ink hover:text-ink-900"
                  >
                    {h}
                  </button>
                ))}
              </div>
              <Field
                label="About"
                hint={
                  bio.trim().length >= 40 ? (
                    <span className="text-go">✓ {bio.length}/600 — story unlocked</span>
                  ) : (
                    <span>
                      {40 - bio.trim().length} more characters to unlock <b className="text-volt-ink">+10 pts</b>
                    </span>
                  )
                }
              >
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={5} maxLength={600} placeholder="Who you are, what you've done, what you want to do next…" className={`${inputClass} resize-none leading-relaxed`} />
              </Field>
              {!bio.trim() && (
                <button
                  type="button"
                  onClick={() => setBio(bioTemplate(role, user.location))}
                  className="press -mt-2 rounded-full bg-ink-900/[0.05] px-3.5 py-1.5 text-[12.5px] font-semibold text-ink-700 transition-colors hover:bg-volt hover:text-black"
                >
                  ✨ Write me a starter bio
                </button>
              )}
            </div>
          </Section>

          {/* identity */}
          {isCompany ? (
            <Section id="identity" emoji="🏢" title="Company identity" hint="The official bits — so talent knows you're legit." items={itemsFor("identity")}>
              <div className="sm:col-span-2">
                <Field label="Name">
                  <input value={d.companyName} onChange={(e) => set("companyName", e.target.value)} className={inputClass} />
                </Field>
              </div>
              <Field label="Category">
                <select value={d.category} onChange={(e) => set("category", e.target.value)} className={inputClass}>
                  <option value="">Select a category</option>
                  {COMPANY_CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Registration Number">
                <input value={d.registrationNumber} onChange={(e) => set("registrationNumber", e.target.value)} className={inputClass} />
              </Field>
              <Field label="State of Registration">
                <input value={d.stateOfRegistration} onChange={(e) => set("stateOfRegistration", e.target.value)} className={inputClass} />
              </Field>
              <Field label="Country of Registration">
                <select value={d.countryOfRegistration} onChange={(e) => set("countryOfRegistration", e.target.value)} className={inputClass}>
                  <option value="">Select a country</option>
                  {COUNTRIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
            </Section>
          ) : (
            <Section id="identity" emoji="🪪" title="The basics" hint="Name on the call sheet, and where you're from." items={itemsFor("identity")}>
              <Field label="First Name">
                <input value={d.firstName} onChange={(e) => set("firstName", e.target.value)} autoComplete="given-name" className={inputClass} />
              </Field>
              <Field label="Last Name">
                <input value={d.lastName} onChange={(e) => set("lastName", e.target.value)} autoComplete="family-name" className={inputClass} />
              </Field>
              <Field label="Middle Name" optional>
                <input value={d.middleName} onChange={(e) => set("middleName", e.target.value)} autoComplete="additional-name" className={inputClass} />
              </Field>
              <Field label="Date of Birth" hint="Shown as DD/MM/YYYY on your profile.">
                <input type="date" value={ddmmyyyyToInput(d.dateOfBirth)} onChange={(e) => set("dateOfBirth", inputToDdmmyyyy(e.target.value))} className={inputClass} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Country of Origin">
                  <select value={d.countryOfOrigin} onChange={(e) => set("countryOfOrigin", e.target.value)} className={inputClass}>
                    <option value="">Select a country</option>
                    {COUNTRIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </Section>
          )}

          {/* contact */}
          <Section id="contact" emoji="📞" title="How to reach you" hint="Only shown to people you connect with." items={itemsFor("contact")}>
            <Field label="Contact Number">
              <input type="tel" value={d.contactNumber} onChange={(e) => set("contactNumber", e.target.value)} autoComplete="tel" placeholder="+91 98…" className={inputClass} />
            </Field>
            <Field label="Email Address">
              <input type="email" value={d.emailAddress} onChange={(e) => set("emailAddress", e.target.value)} autoComplete="email" className={inputClass} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Address" optional>
                <textarea value={d.address} onChange={(e) => set("address", e.target.value)} rows={2} className={`${inputClass} resize-none`} />
              </Field>
            </div>
          </Section>

          {/* background */}
          <Section id="background" emoji="🗣️" title="Languages & training" hint="Tap to add — directors filter by language all the time." items={itemsFor("background")} grid={false}>
            <div className="space-y-5">
              {(
                [
                  ["languagesSpoken", "Languages you speak"],
                  ["languagesWritten", "Languages you read & write"],
                ] as const
              ).map(([key, label]) => {
                const list = d[key].split(",").map((x) => x.trim()).filter(Boolean);
                return (
                  <div key={key}>
                    <p className="mb-2 text-[13px] font-semibold text-ink-700">
                      {label} <span className="font-normal text-ink-400">· {list.length} picked</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {[...COMMON_LANGUAGES, ...list.filter((l) => !COMMON_LANGUAGES.includes(l))].map((lang) => {
                        const on = list.includes(lang);
                        return (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => toggleLanguage(key, lang)}
                            aria-pressed={on}
                            className={`press rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition-all ${
                              on ? "border-volt bg-volt text-black" : "border-line-strong text-ink-600 hover:border-ink-400 hover:text-ink-900"
                            }`}
                          >
                            {on && "✓ "}
                            {lang}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <Field label="Qualification">
                {isCompany ? (
                  <input value={d.qualification} onChange={(e) => set("qualification", e.target.value)} placeholder="e.g. ISO-certified facility, guild memberships" className={inputClass} />
                ) : (
                  <select value={d.qualification} onChange={(e) => set("qualification", e.target.value)} className={inputClass}>
                    <option value="">Select highest qualification</option>
                    {QUALIFICATIONS.map((q) => (
                      <option key={q}>{q}</option>
                    ))}
                  </select>
                )}
              </Field>
            </div>
          </Section>

          {/* experience */}
          <Section id="experience" emoji="🎞️" title="Show your receipts" hint="Link your best work per medium — one link unlocks the points." items={itemsFor("experience")}>
            <Field label="🎭 Theatre">
              <input type="url" value={d.experience.theater} onChange={(e) => setExp("theater", e.target.value)} placeholder="https://…" className={inputClass} />
            </Field>
            <Field label="🎬 Mainstream film">
              <input type="url" value={d.experience.mainstreamMovie} onChange={(e) => setExp("mainstreamMovie", e.target.value)} placeholder="https://…" className={inputClass} />
            </Field>
            <Field label="📺 Television">
              <input type="url" value={d.experience.television} onChange={(e) => setExp("television", e.target.value)} placeholder="https://…" className={inputClass} />
            </Field>
            <Field label="⭐ IMDb">
              <input type="url" value={d.experience.imdb} onChange={(e) => setExp("imdb", e.target.value)} placeholder="https://www.imdb.com/name/…" className={inputClass} />
            </Field>
          </Section>

          {/* recognition */}
          <Section id="recognition" emoji="🏅" title="Trophy cabinet" hint="Awards, festival selections, certifications — don't be modest." items={itemsFor("recognition")}>
            <div className="sm:col-span-2">
              <Field label="Honors / Awards">
                <textarea value={d.honors} onChange={(e) => set("honors", e.target.value)} rows={2} placeholder="One per line — e.g. Best Actor, MAMI 2025" className={`${inputClass} resize-none`} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Certifications / Accreditation">
                <textarea value={d.certifications} onChange={(e) => set("certifications", e.target.value)} rows={2} placeholder="One per line" className={`${inputClass} resize-none`} />
              </Field>
            </div>
          </Section>

          {/* audience */}
          <Section
            id="audience"
            emoji="🎯"
            title="Who's your audience?"
            hint={isCompany ? "The audiences your work is made for." : `Pick up to ${MAX_AUDIENCE_INDIVIDUAL} — ${d.targetAudience.length}/${MAX_AUDIENCE_INDIVIDUAL} selected.`}
            items={itemsFor("audience")}
            grid={false}
          >
            <div className="flex flex-wrap gap-2" role="group" aria-label="Target audience">
              {TARGET_AUDIENCES.map((a) => {
                const on = d.targetAudience.includes(a);
                const capped = !on && d.targetAudience.length >= audienceCap;
                return (
                  <button
                    type="button"
                    key={a}
                    onClick={() => toggleAudience(a)}
                    aria-pressed={on}
                    disabled={capped}
                    className={`press inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-all duration-150 ${
                      on ? "border-volt bg-volt text-black" : capped ? "border-line text-ink-300" : "border-line-strong text-ink-600 hover:border-ink-400 hover:text-ink-900"
                    }`}
                  >
                    {on && <IconCheck size={13} />}
                    {a}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* media */}
          <Section id="media" emoji="🖼️" title="Gallery & documents" hint="Stills, headshots, posters, BTS clips. Three or more unlocks the points." items={itemsFor("media")} grid={false}>
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              {d.gallery.map((g, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-xl" style={{ animation: "pop-in 0.3s cubic-bezier(0.34,1.56,0.64,1) both" }}>
                  {g.startsWith("data:video") ? (
                    <video src={g} className="h-full w-full object-cover" muted playsInline />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={g} alt={`Gallery item ${i + 1}`} className="h-full w-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => setD((prev) => (prev ? { ...prev, gallery: prev.gallery.filter((_, j) => j !== i) } : prev))}
                    aria-label={`Remove item ${i + 1}`}
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <IconX size={13} />
                  </button>
                </div>
              ))}
              {d.gallery.length < MAX_GALLERY && (
                <button
                  type="button"
                  onClick={() => galleryInput.current?.click()}
                  className="press flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line-strong text-ink-500 transition-colors hover:border-volt-ink hover:text-volt-ink"
                >
                  <span className="text-2xl">＋</span>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
                    {d.gallery.length}/{MAX_GALLERY}
                  </span>
                </button>
              )}
              {/* ghost slots nudging toward 3 */}
              {Array.from({ length: Math.max(0, 2 - d.gallery.length) }, (_, i) => (
                <div key={`ghost-${i}`} className="flex aspect-square items-center justify-center rounded-xl bg-ink-900/[0.03] text-2xl opacity-40">
                  {["🎞️", "📸"][i]}
                </div>
              ))}
              <input ref={galleryInput} type="file" accept="image/*,video/*" multiple className="sr-only" onChange={(e) => { onGallery(e.target.files); e.target.value = ""; }} />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-line pt-5">
              <p className="mr-2 text-[13px] font-semibold text-ink-800">📄 {isCompany ? "Company handbook" : "Resume PDF"}</p>
              <label className="press cursor-pointer rounded-full border border-line-strong px-4 py-1.5 text-[13px] font-semibold text-ink-700 transition-colors hover:border-volt-ink hover:text-ink-900">
                {(isCompany ? d.handbookName : d.resumeName) ? "Replace file" : "Upload file"}
                <input
                  type="file"
                  accept={isCompany ? ".pdf,.doc,.docx" : ".pdf"}
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) set(isCompany ? "handbookName" : "resumeName", f.name);
                    e.target.value = "";
                  }}
                />
              </label>
              {(isCompany ? d.handbookName : d.resumeName) && (
                <>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-go-soft px-3 py-1.5 text-[13px] font-medium text-go">
                    <IconCheck size={13} /> {isCompany ? d.handbookName : d.resumeName}
                  </span>
                  <button
                    type="button"
                    onClick={() => set(isCompany ? "handbookName" : "resumeName", "")}
                    className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-ink-500 transition-colors hover:bg-ink-900/[0.05]"
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
          </Section>

          {saveError && (
            <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
              {saveError}
            </p>
          )}

          {/* ═════ sticky save bar ═════ */}
          <div className="sticky bottom-24 z-20 md:bottom-4">
            <div className="flex items-center gap-3 rounded-2xl border border-line bg-elevated/90 p-2.5 pl-4 shadow-pop backdrop-blur-xl">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-display text-[20px] font-bold text-ink-900">{s.score}</span>
                  <span className="font-mono text-[11px] text-ink-400">/100</span>
                  <span className="truncate text-[12.5px] font-semibold text-ink-600">
                    {s.tier.emoji} {s.tier.title}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-canvas">
                  <div className="h-full rounded-full transition-all duration-700 [background:var(--grad-volt)]" style={{ width: `${s.score}%` }} />
                </div>
              </div>
              <Link href="/profile" className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-ink-500 transition-colors hover:text-ink-900 sm:block">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="press rounded-xl px-6 py-2.5 text-sm font-bold text-black transition-shadow hover:shadow-glow-volt disabled:opacity-60 [background:var(--grad-volt)]"
              >
                {saving ? "Saving…" : "Save profile"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 100/100 confetti */}
      {confetti.length > 0 && (
        <div className="pointer-events-none fixed inset-0 z-[400] overflow-hidden" aria-hidden="true">
          {confetti.map((c) => (
            <span
              key={c.id}
              className="absolute -top-10 text-[26px]"
              style={{ left: `${c.x}%`, transform: `rotate(${c.r}deg)`, animation: `confetti-fall 2.2s ${c.d}s cubic-bezier(0.3,0.6,0.5,1) forwards` }}
            >
              {c.e}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
