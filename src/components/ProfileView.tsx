"use client";

import { useState } from "react";
import { Avatar, toneOf } from "./Avatar";
import { MediaPlaceholder, ShowreelPlayer } from "./Media";
import { AvailabilityBadge, Card, Tag } from "./ui";
import { IconChat, IconFilm, IconMapPin, IconUsers } from "./icons";
import type { Availability, Credit, MediaItem } from "@/lib/types";

export interface ProfileData {
  name: string;
  roles: string[];
  headline: string;
  bio: string;
  location: string;
  availability: Availability;
  yearsExp?: number;
  skills: string[];
  credits: Credit[];
  portfolio: MediaItem[];
  reelTitle: string;
  reelDuration: string;
  connections: number;
  hue: number;
}

export function ProfileView({
  profile,
  actions,
  aboutExtra,
  avatarSrc,
}: {
  profile: ProfileData;
  actions?: React.ReactNode;
  aboutExtra?: React.ReactNode;
  avatarSrc?: string;
}) {
  const [showAllCredits, setShowAllCredits] = useState(false);
  const tone = toneOf(profile.hue);
  const credits = showAllCredits ? profile.credits : profile.credits.slice(0, 3);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {/* ————— header ————— */}
      <Card className="anim-rise overflow-hidden">
        <div
          className="h-32 sm:h-40"
          style={{
            background: `linear-gradient(115deg, ${tone.bg} 0%, #0b66c3 130%)`,
          }}
        />
        <div className="px-5 pb-6 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="-mt-12 sm:-mt-14">
              <Avatar name={profile.name} hue={profile.hue} size={104} ring src={avatarSrc} />
            </div>
            {actions && <div className="flex flex-wrap gap-2 pt-3">{actions}</div>}
          </div>

          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-ink-900">{profile.name}</h1>
              <AvailabilityBadge status={profile.availability} />
            </div>
            <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-ink-600">{profile.headline}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-ink-500">
              <span className="flex items-center gap-1.5">
                <IconMapPin size={14} /> {profile.location}
              </span>
              {!!profile.yearsExp && (
                <span className="flex items-center gap-1.5">
                  <IconFilm size={14} /> {profile.yearsExp} years in the industry
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <IconUsers size={14} /> {profile.connections.toLocaleString("en-IN")} connections
              </span>
            </div>
            <div className="mt-3.5 flex flex-wrap gap-1.5">
              {profile.roles.map((r) => (
                <span key={r} className="rounded-full bg-brand-50 px-3 py-1 text-[13px] font-semibold text-brand-700">
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-5">
          {/* about */}
          <Card className="anim-rise p-6 sm:p-7">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-400">About</h2>
            <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-ink-800">{profile.bio}</p>
            {aboutExtra}
          </Card>

          {/* showreel — only once the member has published one */}
          {profile.reelTitle && (
            <Card className="anim-rise p-6 sm:p-7">
              <div className="flex items-baseline justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-400">Showreel</h2>
                <span className="text-xs font-medium text-ink-400">
                  {profile.reelTitle} · {profile.reelDuration}
                </span>
              </div>
              <div className="mt-4">
                <ShowreelPlayer
                  title={profile.reelTitle}
                  duration={profile.reelDuration}
                  ownerName={profile.name}
                />
              </div>
            </Card>
          )}

          {/* experience */}
          {profile.credits.length > 0 && (
            <Card className="anim-rise p-6 sm:p-7">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-400">Experience</h2>
              <ol className="mt-4 space-y-0">
                {credits.map((c, i) => (
                  <li key={c.id} className={`flex gap-4 ${i > 0 ? "mt-5 border-t border-line pt-5" : ""}`}>
                    <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-canvas text-ink-400">
                      <IconFilm size={17} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold text-ink-900">{c.role}</p>
                      <p className="text-sm text-ink-600">
                        {c.project} <span className="text-ink-400">· {c.kind} · {c.year}</span>
                      </p>
                      {c.note && <p className="mt-1 text-[13px] text-ink-500">{c.note}</p>}
                    </div>
                  </li>
                ))}
              </ol>
              {profile.credits.length > 3 && (
                <button
                  onClick={() => setShowAllCredits((s) => !s)}
                  className="mt-5 w-full rounded-lg border-t border-line pt-4 text-center text-[13px] font-semibold text-brand-600 hover:text-brand-700"
                >
                  {showAllCredits ? "Show fewer credits" : `Show all ${profile.credits.length} credits`}
                </button>
              )}
            </Card>
          )}

          {/* portfolio */}
          {profile.portfolio.length > 0 && (
            <Card className="anim-rise p-6 sm:p-7">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-400">Portfolio</h2>
              <div className="mt-4 columns-2 gap-3.5 [&>*]:mb-3.5 sm:columns-3">
                {profile.portfolio.map((item) => (
                  <div key={item.id} className="break-inside-avoid transition-transform duration-200 hover:scale-[1.015]">
                    <MediaPlaceholder item={item} />
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* side rail */}
        <aside className="space-y-5">
          {profile.skills.length > 0 && (
            <Card className="anim-rise p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-400">Skills</h2>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {profile.skills.map((s) => (
                  <Tag key={s}>{s}</Tag>
                ))}
              </div>
            </Card>
          )}
          <Card className="anim-rise p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-400">Details</h2>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-xs font-medium text-ink-400">Based in</dt>
                <dd className="mt-0.5 font-medium text-ink-800">{profile.location}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-ink-400">Status</dt>
                <dd className="mt-1"><AvailabilityBadge status={profile.availability} /></dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-ink-400">Works as</dt>
                <dd className="mt-0.5 font-medium text-ink-800">{profile.roles.join(", ")}</dd>
              </div>
            </dl>
          </Card>
        </aside>
      </div>
    </div>
  );
}

export function MessageButton({ onClick, name }: { onClick: () => void; name: string }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
    >
      <IconChat size={16} /> Message {name.split(" ")[0]}
    </button>
  );
}
