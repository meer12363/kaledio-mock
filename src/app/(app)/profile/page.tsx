"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProfileView, type ProfileData } from "@/components/ProfileView";
import { Card, Skeleton } from "@/components/ui";
import { IconCheck, IconEdit } from "@/components/icons";
import { AVAILABILITY_META } from "@/components/ui";
import { useSession } from "@/lib/session";
import { ProfileStrengthCard } from "@/components/ProfileScore";
import { gql, ME_FIELDS } from "@/lib/gql";
import type { Availability, Credit, MediaItem, ProfileDetails } from "@/lib/types";

const AVAILABILITY_ORDER: Availability[] = ["open", "listening", "booked"];

const EXPERIENCE_LABELS: Array<{ key: keyof ProfileDetails["experience"]; label: string }> = [
  { key: "theater", label: "Theater" },
  { key: "mainstreamMovie", label: "Main Stream Movie" },
  { key: "television", label: "Television" },
  { key: "imdb", label: "IMDB" },
];

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-ink-400">{label}</dt>
      <dd className="mt-0.5 break-words text-sm font-medium text-ink-800">{value}</dd>
    </div>
  );
}

interface MeRich {
  yearsExp: number;
  skills: string[];
  connections: number;
  hue: number;
  reelTitle: string;
  reelDuration: string;
  avatarUrl: string;
  credits: Credit[];
  portfolio: MediaItem[];
}

const EMPTY_RICH: MeRich = {
  yearsExp: 0,
  skills: [],
  connections: 0,
  hue: 3,
  reelTitle: "",
  reelDuration: "",
  avatarUrl: "",
  credits: [],
  portfolio: [],
};

export default function MyProfilePage() {
  const { user, update } = useSession();
  const [rich, setRich] = useState<MeRich | null>(null);

  useEffect(() => {
    gql<{ me: MeRich | null }>(
      `${ME_FIELDS}
      query { me { ...MeFields } }`
    )
      // guests (and brand-new profiles) have no stored extras yet — start empty
      .then((d) => setRich(d.me ?? EMPTY_RICH))
      .catch(() => setRich(EMPTY_RICH));
  }, [user?.headline, user?.bio]);

  if (!user) return null;

  const d = user.details;
  const isCompany = user.registrationType === "company";

  if (!rich) {
    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <Card className="overflow-hidden">
          <Skeleton className="h-36 w-full rounded-none" />
          <div className="space-y-3 p-7">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-80" />
          </div>
        </Card>
      </div>
    );
  }

  const profile: ProfileData = {
    name: user.name,
    roles: user.roles,
    headline: user.headline,
    bio: user.bio,
    location: user.location,
    availability: user.availability,
    yearsExp: rich.yearsExp,
    skills: rich.skills,
    credits: rich.credits,
    portfolio: rich.portfolio,
    reelTitle: rich.reelTitle,
    reelDuration: rich.reelDuration,
    connections: rich.connections,
    hue: rich.hue,
  };

  const registrationRows: Array<{ label: string; value?: string }> = isCompany
    ? [
        { label: "Company / Group", value: d.companyName },
        { label: "Category", value: d.category },
        { label: "Registration Number", value: d.registrationNumber },
        { label: "State of Registration", value: d.stateOfRegistration },
        { label: "Country of Registration", value: d.countryOfRegistration },
        { label: "Contact Number", value: d.contactNumber },
        { label: "Email Address", value: d.emailAddress },
        { label: "Address", value: d.address },
        { label: "Languages Spoken", value: d.languagesSpoken },
        { label: "Languages Written", value: d.languagesWritten },
        { label: "Qualification", value: d.qualification },
      ]
    : [
        {
          label: "Name",
          value: [d.firstName, d.middleName, d.lastName].filter(Boolean).join(" "),
        },
        { label: "Date of Birth", value: d.dateOfBirth },
        { label: "Country of Origin", value: d.countryOfOrigin },
        { label: "Contact Number", value: d.contactNumber },
        { label: "Email Address", value: d.emailAddress },
        { label: "Address", value: d.address },
        { label: "Languages Spoken", value: d.languagesSpoken },
        { label: "Languages Written", value: d.languagesWritten },
        { label: "Qualification", value: d.qualification },
      ];

  const hasRegistrationInfo = registrationRows.some((r) => r.value);
  const expLinks = EXPERIENCE_LABELS.filter(({ key }) => d.experience[key]);
  const docName = isCompany ? d.handbookName : d.resumeName;

  return (
    <>
      <div className="mx-auto mb-5 max-w-4xl">
        <ProfileStrengthCard compact />
      </div>
      <ProfileView
        profile={profile}
        avatarSrc={rich.avatarUrl || d.profilePicture || undefined}
        actions={
          <>
            <label className="sr-only" htmlFor="availability">Availability status</label>
            <select
              id="availability"
              value={user.availability}
              onChange={(e) => update({ availability: e.target.value as Availability })}
              className="rounded-full border border-line-strong bg-paper px-4 py-2.5 text-sm font-semibold text-ink-700 transition-colors hover:border-brand-300 focus:border-brand-500 focus:outline-none"
            >
              {AVAILABILITY_ORDER.map((a) => (
                <option key={a} value={a}>
                  {AVAILABILITY_META[a].label}
                </option>
              ))}
            </select>
            <Link
              href="/profile/edit"
              className="flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-500"
            >
              <IconEdit size={15} /> Edit profile
            </Link>
          </>
        }
        aboutExtra={
          !hasRegistrationInfo ? (
            <p className="mt-4 rounded-lg bg-brand-50 px-3.5 py-2.5 text-[13px] leading-relaxed text-brand-800">
              Your {isCompany ? "company" : ""} profile is missing its details —{" "}
              <Link href="/profile/edit" className="font-semibold underline">
                complete it now
              </Link>{" "}
              so casting and production can find and verify you.
            </p>
          ) : undefined
        }
      />

      {/* ————— registered details ————— */}
      <div className="mx-auto mt-5 max-w-4xl space-y-5">
        {hasRegistrationInfo && (
          <Card className="anim-rise p-6 sm:p-7">
            <div className="flex items-center justify-between">
              <h2 className="eyebrow">
                {isCompany ? "Company details" : "Personal details"}
              </h2>
              <Link href="/profile/edit" className="text-[13px] font-semibold text-brand-600 hover:text-brand-700">
                Edit
              </Link>
            </div>
            <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-3">
              {registrationRows.map((r) => (
                <Row key={r.label} label={r.label} value={r.value} />
              ))}
            </dl>

            {expLinks.length > 0 && (
              <div className="mt-6 border-t border-line pt-5">
                <h3 className="text-xs font-medium text-ink-400">Experience links</h3>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {expLinks.map(({ key, label }) => (
                    <a
                      key={key}
                      href={d.experience[key]}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-line-strong px-3.5 py-1.5 text-[13px] font-semibold text-brand-700 transition-colors hover:border-brand-300 hover:bg-brand-50"
                    >
                      {label} ↗
                    </a>
                  ))}
                </div>
              </div>
            )}

            {(d.certifications || d.honors) && (
              <div className="mt-6 grid gap-5 border-t border-line pt-5 sm:grid-cols-2">
                {d.certifications && (
                  <div>
                    <h3 className="text-xs font-medium text-ink-400">Certifications / Accreditation</h3>
                    <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-800">{d.certifications}</p>
                  </div>
                )}
                {d.honors && (
                  <div>
                    <h3 className="text-xs font-medium text-ink-400">Honors / Awards</h3>
                    <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-800">{d.honors}</p>
                  </div>
                )}
              </div>
            )}

            {d.targetAudience.length > 0 && (
              <div className="mt-6 border-t border-line pt-5">
                <h3 className="text-xs font-medium text-ink-400">Target Audience</h3>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {d.targetAudience.map((a) => (
                    <span key={a} className="rounded-full bg-brand-50 px-3 py-1 text-[13px] font-semibold text-brand-700">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {docName && (
              <div className="mt-6 border-t border-line pt-5">
                <h3 className="text-xs font-medium text-ink-400">{isCompany ? "Company Handbook" : "Resume"}</h3>
                <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-go-soft px-3 py-1.5 text-[13px] font-medium text-go">
                  <IconCheck size={13} /> {docName}
                </span>
              </div>
            )}
          </Card>
        )}

        {d.gallery.length > 0 && (
          <Card className="anim-rise p-6 sm:p-7">
            <div className="flex items-center justify-between">
              <h2 className="eyebrow">Photo gallery</h2>
              <Link href="/profile/edit" className="text-[13px] font-semibold text-brand-600 hover:text-brand-700">
                Manage
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {d.gallery.map((g, i) => (
                <div key={i} className="overflow-hidden rounded-lg" style={{ aspectRatio: "1 / 1" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g} alt={`Gallery photo ${i + 1}`} className="h-full w-full object-cover transition-transform duration-200 hover:scale-[1.03]" />
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
