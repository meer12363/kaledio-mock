"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/ui";
import { IconArrowLeft, IconCheck, IconX } from "@/components/icons";
import { useSession } from "@/lib/session";
import {
  COMPANY_CATEGORIES,
  COUNTRIES,
  QUALIFICATIONS,
  TARGET_AUDIENCES,
} from "@/lib/persona";
import { readAttachment, readImageDownscaled } from "@/lib/upload";
import type { ProfileDetails } from "@/lib/types";

const inputClass =
  "w-full rounded-lg border border-line-strong bg-paper px-3.5 py-2.5 text-[15px] text-ink-900 placeholder:text-ink-300 transition-colors duration-150 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";

function Field({
  label,
  children,
  hint,
  optional = false,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  optional?: boolean;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-sm font-medium text-ink-700">
        {label}
        {optional && <span className="ml-1.5 font-normal text-ink-400">(optional)</span>}
      </span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-ink-400">{hint}</span>}
    </label>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-6 sm:p-7">
      <h2 className="eyebrow">{title}</h2>
      {hint && <p className="mt-1.5 text-[13px] text-ink-500">{hint}</p>}
      <div className="mt-5 grid gap-5 sm:grid-cols-2">{children}</div>
    </Card>
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
  const [d, setD] = useState<ProfileDetails | null>(user ? { ...user.details, experience: { ...user.details.experience }, targetAudience: [...user.details.targetAudience], gallery: [...user.details.gallery] } : null);
  const [headline, setHeadline] = useState(user?.headline ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const galleryInput = useRef<HTMLInputElement>(null);

  if (!user || !d) return null;

  const isCompany = user.registrationType === "company";
  const audienceCap = isCompany ? TARGET_AUDIENCES.length : MAX_AUDIENCE_INDIVIDUAL;

  const set = <K extends keyof ProfileDetails>(key: K, value: ProfileDetails[K]) =>
    setD((prev) => (prev ? { ...prev, [key]: value } : prev));

  const setExp = (key: keyof ProfileDetails["experience"], value: string) =>
    setD((prev) => (prev ? { ...prev, experience: { ...prev.experience, [key]: value } } : prev));

  const toggleAudience = (a: string) => {
    setD((prev) => {
      if (!prev) return prev;
      const has = prev.targetAudience.includes(a);
      if (!has && prev.targetAudience.length >= audienceCap) return prev;
      return {
        ...prev,
        targetAudience: has
          ? prev.targetAudience.filter((x) => x !== a)
          : [...prev.targetAudience, a],
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
      setD((prev) =>
        prev ? { ...prev, gallery: [...prev.gallery, ...attachments.map((a) => a.url)] } : prev
      );
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "One of those files couldn't be read.");
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const displayName = isCompany
      ? d.companyName.trim() || user.name
      : [d.firstName, d.middleName, d.lastName].map((s) => s.trim()).filter(Boolean).join(" ") || user.name;
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
      setSaved(true);
      window.setTimeout(() => router.push("/profile"), 900);
    } catch {
      setSaveError("Couldn't save your profile — check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-800"
      >
        <IconArrowLeft size={15} /> Back to profile
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[40px] font-bold leading-[0.95] text-ink-900 sm:text-[52px]">
            Edit {isCompany ? "company profile" : "profile"}
          </h1>
          <p className="mt-1 text-[15px] text-ink-500">
            Everything here stays editable — change it as often as the industry changes its mind.
          </p>
        </div>
        <span className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
          {isCompany ? "Company / Group account" : "Individual account"}
        </span>
      </div>

      <form onSubmit={save} className="mt-6 space-y-5">
        {/* ————— intro ————— */}
        <Section title="Intro" hint="Shown at the top of your profile and in search results.">
          <div className="sm:col-span-2">
            <Field label="Headline">
              <input value={headline} onChange={(e) => setHeadline(e.target.value)} maxLength={120} className={inputClass} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="About">
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} maxLength={600} className={`${inputClass} resize-none leading-relaxed`} />
            </Field>
          </div>
        </Section>

        {/* ————— identity ————— */}
        {isCompany ? (
          <Section title="Company identity">
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
          <Section title="Identity">
            <Field label="First Name">
              <input value={d.firstName} onChange={(e) => set("firstName", e.target.value)} autoComplete="given-name" className={inputClass} />
            </Field>
            <Field label="Middle Name" optional>
              <input value={d.middleName} onChange={(e) => set("middleName", e.target.value)} autoComplete="additional-name" className={inputClass} />
            </Field>
            <Field label="Last Name">
              <input value={d.lastName} onChange={(e) => set("lastName", e.target.value)} autoComplete="family-name" className={inputClass} />
            </Field>
            <Field label="Date of Birth" hint="Shown as DD/MM/YYYY on your profile.">
              <input
                type="date"
                value={ddmmyyyyToInput(d.dateOfBirth)}
                onChange={(e) => set("dateOfBirth", inputToDdmmyyyy(e.target.value))}
                className={inputClass}
              />
            </Field>
            <Field label="Country of Origin">
              <select value={d.countryOfOrigin} onChange={(e) => set("countryOfOrigin", e.target.value)} className={inputClass}>
                <option value="">Select a country</option>
                {COUNTRIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
          </Section>
        )}

        {/* ————— contact ————— */}
        <Section title="Contact">
          <Field label="Contact Number">
            <input type="tel" value={d.contactNumber} onChange={(e) => set("contactNumber", e.target.value)} autoComplete="tel" placeholder="+91 98…" className={inputClass} />
          </Field>
          <Field label="Email Address">
            <input type="email" value={d.emailAddress} onChange={(e) => set("emailAddress", e.target.value)} autoComplete="email" className={inputClass} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Address">
              <textarea value={d.address} onChange={(e) => set("address", e.target.value)} rows={2} className={`${inputClass} resize-none`} />
            </Field>
          </div>
        </Section>

        {/* ————— background ————— */}
        <Section title="Background">
          <Field label="Languages Spoken" hint="Comma-separated.">
            <input value={d.languagesSpoken} onChange={(e) => set("languagesSpoken", e.target.value)} placeholder="Hindi, English, Tamil" className={inputClass} />
          </Field>
          <Field label="Languages Written" hint="Comma-separated.">
            <input value={d.languagesWritten} onChange={(e) => set("languagesWritten", e.target.value)} placeholder="Hindi, English" className={inputClass} />
          </Field>
          <div className="sm:col-span-2">
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

        {/* ————— experience links ————— */}
        <Section title="Experience" hint="Link your best work per medium — a reel, a page, a listing.">
          <Field label="Theater">
            <input type="url" value={d.experience.theater} onChange={(e) => setExp("theater", e.target.value)} placeholder="https://…" className={inputClass} />
          </Field>
          <Field label="Main Stream Movie">
            <input type="url" value={d.experience.mainstreamMovie} onChange={(e) => setExp("mainstreamMovie", e.target.value)} placeholder="https://…" className={inputClass} />
          </Field>
          <Field label="Television">
            <input type="url" value={d.experience.television} onChange={(e) => setExp("television", e.target.value)} placeholder="https://…" className={inputClass} />
          </Field>
          <Field label="IMDB">
            <input type="url" value={d.experience.imdb} onChange={(e) => setExp("imdb", e.target.value)} placeholder="https://www.imdb.com/name/…" className={inputClass} />
          </Field>
        </Section>

        {/* ————— recognition ————— */}
        <Section title="Recognition">
          <div className="sm:col-span-2">
            <Field label="Certifications / Accreditation">
              <textarea value={d.certifications} onChange={(e) => set("certifications", e.target.value)} rows={2} placeholder="One per line" className={`${inputClass} resize-none`} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Honors / Awards">
              <textarea value={d.honors} onChange={(e) => set("honors", e.target.value)} rows={2} placeholder="One per line" className={`${inputClass} resize-none`} />
            </Field>
          </div>
        </Section>

        {/* ————— target audience ————— */}
        <Card className="p-6 sm:p-7">
          <h2 className="eyebrow">Target Audience</h2>
          <p className="mt-1.5 text-[13px] text-ink-500">
            {isCompany
              ? "The audiences your work is made for."
              : `Pick up to ${MAX_AUDIENCE_INDIVIDUAL} — ${d.targetAudience.length}/${MAX_AUDIENCE_INDIVIDUAL} selected.`}
          </p>
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Target audience">
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
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-all duration-150 ${
                    on
                      ? "border-brand-600 bg-brand-600 text-white"
                      : capped
                        ? "border-line text-ink-300"
                        : "border-line-strong bg-paper text-ink-600 hover:border-brand-300 hover:text-brand-700"
                  }`}
                >
                  {on && <IconCheck size={13} />}
                  {a}
                </button>
              );
            })}
          </div>
        </Card>

        {/* ————— media ————— */}
        <Card className="p-6 sm:p-7">
          <h2 className="eyebrow">Media & documents</h2>

          <div className="mt-5 flex items-center gap-5">
            <Avatar name={user.name} hue={3} size={72} src={d.profilePicture || undefined} />
            <div>
              <p className="text-sm font-semibold text-ink-800">Profile Picture</p>
              <div className="mt-2 flex items-center gap-2">
                <label className="cursor-pointer rounded-full border border-line-strong px-4 py-1.5 text-[13px] font-semibold text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-700">
                  {d.profilePicture ? "Replace" : "Upload"}
                  <input type="file" accept="image/*" className="sr-only" onChange={(e) => onProfilePic(e.target.files?.[0])} />
                </label>
                {d.profilePicture && (
                  <button type="button" onClick={() => set("profilePicture", "")} className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-ink-500 transition-colors hover:bg-canvas">
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-7 border-t border-line pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ink-800">
                Photo & Video Gallery <span className="font-normal text-ink-400">({d.gallery.length}/{MAX_GALLERY})</span>
              </p>
              <button
                type="button"
                onClick={() => galleryInput.current?.click()}
                disabled={d.gallery.length >= MAX_GALLERY}
                className="rounded-full border border-line-strong px-4 py-1.5 text-[13px] font-semibold text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-700 disabled:opacity-40"
              >
                Add media
              </button>
              <input ref={galleryInput} type="file" accept="image/*,video/*" multiple className="sr-only" onChange={(e) => { onGallery(e.target.files); e.target.value = ""; }} />
            </div>
            {d.gallery.length === 0 ? (
              <p className="mt-3 rounded-lg border border-dashed border-line-strong px-4 py-6 text-center text-[13px] text-ink-400">
                No media yet — stills, headshots, posters, BTS clips.
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {d.gallery.map((g, i) => (
                  <div key={i} className="group relative overflow-hidden rounded-lg" style={{ aspectRatio: "1 / 1" }}>
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
              </div>
            )}
          </div>

          <div className="mt-7 border-t border-line pt-6">
            <p className="text-sm font-semibold text-ink-800">
              {isCompany ? "Company Handbook" : "PDF of Resume"}{" "}
              {!isCompany && <span className="font-normal text-ink-400">(optional)</span>}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <label className="cursor-pointer rounded-full border border-line-strong px-4 py-1.5 text-[13px] font-semibold text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-700">
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
                    className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-ink-500 transition-colors hover:bg-canvas"
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
          </div>
        </Card>

        {saveError && (
          <p role="alert" className="rounded-lg bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
            {saveError}
          </p>
        )}

        <div className="flex items-center justify-end gap-2 pb-4">
          <Link href="/profile" className="rounded-full px-5 py-2.5 text-sm font-semibold text-ink-500 transition-colors hover:bg-canvas">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-brand-600 px-7 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-500 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save profile"}
          </button>
        </div>
      </form>

      {saved && (
        <div role="status" aria-live="polite" className="anim-rise fixed bottom-6 left-1/2 z-[300] flex -translate-x-1/2 items-center gap-2 rounded-full border border-line-strong bg-elevated px-5 py-2.5 text-sm font-medium text-ink-900 shadow-pop">
          <IconCheck size={15} className="text-go" /> Profile saved
        </div>
      )}
    </div>
  );
}
