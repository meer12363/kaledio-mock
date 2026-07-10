/**
 * Generates seed SQL for the Kaledio database from the mock data in
 * src/lib/store.ts, so the DB starts life identical to the demo app.
 *
 *   npx tsx scripts/gen-seed-sql.ts > prisma/seed.sql
 *
 * Two demo accounts anchor the per-user data until real auth lands:
 *   demo-talent  (talent / individual)  — owns the seeded applications & DMs
 *   demo-studio  (production / company) — posted the two studio listings
 */

import {
  castingCalls,
  conversations,
  myApplications,
  myListings,
  people,
  posts,
} from "../src/lib/store";
import type { Persona } from "../src/lib/types";

const NOW = Date.now();
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
const arr = (xs: string[]) =>
  xs.length ? `ARRAY[${xs.map(q).join(",")}]` : "ARRAY[]::text[]";
const ts = (ms: number) => `'${new Date(ms).toISOString()}'`;

/** "3d" / "12h" / "1w" / "just now" → absolute timestamp */
function agoToTs(ago: string): number {
  const m = ago.match(/(\d+)\s*(h|d|w|m)/);
  if (!m) return NOW;
  const n = Number(m[1]);
  const unit = m[2] === "h" ? HOUR : m[2] === "w" ? 7 * DAY : m[2] === "m" ? 60_000 : DAY;
  return NOW - n * unit;
}

const personaSql: Record<Persona, string> = {
  talent: "TALENT",
  creative: "CREATIVE",
  production: "PRODUCTION",
};

const lines: string[] = ["BEGIN;"];

// ————— demo accounts —————
lines.push(`
INSERT INTO "User" ("id","email","name","persona","registrationType","roles","location","headline","bio","availability","yearsExp","skills","connectionsCount","hue","reelTitle","reelDuration","isDemo") VALUES
('demo-talent','demo@kaledio.app','Demo Member','TALENT','INDIVIDUAL',ARRAY['Actor'],'Mumbai','Actor — Mumbai | demo account','Demo account that owns the seeded applications and conversations.','OPEN',3,ARRAY['Screen acting','Improv'],34,3,'Acting Reel — 2026','1:48',true),
('demo-studio','studio@kaledio.app','Demo Studio','PRODUCTION','COMPANY',ARRAY['Studio'],'Mumbai','Production studio | demo account','Demo studio account that owns the seeded listings.','OPEN',10,ARRAY['Casting briefs','Budgets that close'],87,7,'Company Sizzle','1:12',true);`);

// ————— the 14 showcase members —————
for (const p of people) {
  lines.push(
    `INSERT INTO "User" ("id","email","name","persona","registrationType","roles","location","headline","bio","availability","yearsExp","skills","connectionsCount","hue","reelTitle","reelDuration","isDemo") VALUES (` +
      [
        q(p.id),
        q(`${p.id}@demo.kaledio.app`),
        q(p.name),
        q(personaSql[p.persona]),
        p.roles.some((r) => r === "Studio" || r === "Agency") ? "'COMPANY'" : "'INDIVIDUAL'",
        arr(p.roles),
        q(p.location),
        q(p.headline),
        q(p.bio),
        q(p.availability.toUpperCase()),
        String(p.yearsExp),
        arr(p.skills),
        String(p.connections),
        String(p.hue),
        q(p.reelTitle),
        q(p.reelDuration),
        "true",
      ].join(",") +
      `);`
  );
  lines.push(
    `INSERT INTO "ProfileDetails" ("userId","emailAddress","address","targetAudience","gallery") VALUES (${q(p.id)},${q(`${p.id}@demo.kaledio.app`)},${q(p.location)},ARRAY[]::text[],ARRAY[]::text[]);`
  );
  p.credits.forEach((c, i) => {
    lines.push(
      `INSERT INTO "Credit" ("id","userId","role","project","kind","year","note","sortOrder") VALUES (${q(`${p.id}-credit-${i}`)},${q(p.id)},${q(c.role)},${q(c.project)},${q(c.kind)},${q(c.year)},${c.note ? q(c.note) : "NULL"},${i});`
    );
  });
  p.portfolio.forEach((mi, i) => {
    lines.push(
      `INSERT INTO "PortfolioItem" ("id","userId","title","kind","year","tone","aspect","sortOrder") VALUES (${q(`${p.id}-media-${i}`)},${q(p.id)},${q(mi.title)},${q(mi.kind)},${q(mi.year)},${q(mi.tone.toUpperCase())},${q(mi.aspect.toUpperCase())},${i});`
    );
  });
}

// ————— public casting calls —————
for (const c of castingCalls) {
  lines.push(
    `INSERT INTO "CastingCall" ("id","title","company","medium","location","compensation","shootDates","deadline","shootStart","requiresAudition","isPublic","description","requirements","tags","seedApplicants","createdAt","postedById") VALUES (` +
      [
        q(c.id),
        q(c.title),
        q(c.company),
        q(c.medium),
        q(c.location),
        q(c.compensation),
        q(c.shootDates),
        `'${c.deadlineISO}T23:59:59Z'`,
        `'${c.shootStartISO}T09:00:00Z'`,
        String(c.requiresAudition),
        "true",
        q(c.description),
        arr(c.requirements),
        arr(c.tags),
        String(c.applicants),
        ts(agoToTs(c.postedAgo)),
        q(c.postedById),
      ].join(",") +
      `);`
  );
  c.lookingFor.forEach((r, i) => {
    lines.push(
      `INSERT INTO "CastingRole" ("id","callId","name","brief","sortOrder") VALUES (${q(`${c.id}-role-${i}`)},${q(c.id)},${q(r.name)},${q(r.brief)},${i});`
    );
  });
}

// ————— studio listings (unified into CastingCall, posted by demo-studio) —————
const listingDates: Record<string, { deadline: string; shootStart: string }> = {
  "listing-glass-harbour": { deadline: "2026-08-15", shootStart: "2026-11-02" },
  "listing-audio-narrators": { deadline: "2026-07-31", shootStart: "2026-08-10" },
};

for (const l of myListings) {
  const dates = listingDates[l.id] ?? { deadline: "2026-08-31", shootStart: "2026-10-01" };
  lines.push(
    `INSERT INTO "CastingCall" ("id","title","company","medium","location","compensation","shootDates","deadline","shootStart","requiresAudition","isPublic","description","requirements","tags","seedApplicants","createdAt","postedById") VALUES (` +
      [
        q(l.id),
        q(l.title),
        q("Demo Studio"),
        q(l.medium),
        q(l.location),
        q(l.compensation),
        q(l.shootDates),
        `'${dates.deadline}T23:59:59Z'`,
        `'${dates.shootStart}T09:00:00Z'`,
        String(l.requiresAudition),
        "true",
        q(l.description),
        "ARRAY[]::text[]",
        arr([l.medium, l.requiresAudition ? "Audition" : "Direct offer"]),
        "0",
        ts(agoToTs(l.postedAgo)),
        q("demo-studio"),
      ].join(",") +
      `);`
  );
  // real applications from the showcase members
  for (const a of l.applicants) {
    lines.push(
      `INSERT INTO "Application" ("id","callId","applicantId","status","note","createdAt","updatedAt") VALUES (${q(`${l.id}-${a.personId}`)},${q(l.id)},${q(a.personId)},${q(a.status.toUpperCase())},${a.note ? q(a.note) : "''"},${ts(agoToTs(a.appliedAgo))},now());`
    );
  }
}

// ————— demo-talent's applications —————
for (const a of myApplications) {
  lines.push(
    `INSERT INTO "Application" ("id","callId","applicantId","status","note","auditionAt","createdAt","updatedAt") VALUES (${q(a.id)},${q(a.callId)},${q("demo-talent")},${q(a.status.toUpperCase())},'',${a.auditionISO ? `'${a.auditionISO}T11:00:00Z'` : "NULL"},${ts(agoToTs(a.appliedAgo))},now());`
  );
}

// ————— feed posts —————
for (const p of posts) {
  lines.push(
    `INSERT INTO "Post" ("id","authorId","kind","text","createdAt","mediaTitle","mediaKind","mediaYear","mediaTone","mediaAspect","castingCallId","seedLikes","seedComments") VALUES (` +
      [
        q(p.id),
        q(p.authorId),
        q(p.kind.toUpperCase()),
        q(p.text),
        ts(agoToTs(p.timeAgo)),
        p.media ? q(p.media.title) : "NULL",
        p.media ? q(p.media.kind) : "NULL",
        p.media ? q(p.media.year) : "NULL",
        p.media ? q(p.media.tone.toUpperCase()) : "NULL",
        p.media ? q(p.media.aspect.toUpperCase()) : "NULL",
        p.castingCallId ? q(p.castingCallId) : "NULL",
        String(p.likes),
        String(p.comments),
      ].join(",") +
      `);`
  );
}

// ————— demo-talent's conversations —————
const lastActiveMs: Record<string, number> = {
  "conv-ritika": NOW - 12 * 60_000,
  "conv-dev": NOW - 2 * HOUR,
  "conv-lena": NOW - DAY,
  "conv-sana": NOW - 3 * DAY,
};

for (const c of conversations) {
  const end = lastActiveMs[c.id] ?? NOW - DAY;
  const start = end - c.messages.length * 25 * 60_000;
  const msgTimes = c.messages.map((_, i) => start + i * 25 * 60_000);
  const lastMessageAt = msgTimes[msgTimes.length - 1] ?? end;
  // unread = messages after the reader's lastReadAt
  const readUpTo =
    c.unread > 0 ? msgTimes[c.messages.length - c.unread - 1] ?? start - 1 : lastMessageAt;
  lines.push(
    `INSERT INTO "Conversation" ("id","participantAId","participantBId","createdAt","lastMessageAt","aLastReadAt","bLastReadAt") VALUES (${q(c.id)},${q("demo-talent")},${q(c.personId)},${ts(start - HOUR)},${ts(lastMessageAt)},${ts(readUpTo)},${ts(lastMessageAt)});`
  );
  c.messages.forEach((msg, i) => {
    lines.push(
      `INSERT INTO "Message" ("id","conversationId","senderId","text","createdAt") VALUES (${q(`${c.id}-m${i}`)},${q(c.id)},${q(msg.from === "me" ? "demo-talent" : c.personId)},${q(msg.text)},${ts(msgTimes[i])});`
    );
  });
}

lines.push("COMMIT;");

process.stdout.write(lines.join("\n") + "\n");
