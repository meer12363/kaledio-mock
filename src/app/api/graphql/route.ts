import { createSchema, createYoga } from "graphql-yoga";
import { GraphQLError } from "graphql";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseForToken } from "@/lib/supabase";
import { defaultBio, defaultHeadline, emptyDetails } from "@/lib/persona";
import type { Persona, RegistrationType, SessionUser } from "@/lib/types";

/* ————————————————— context ————————————————— */

interface Ctx {
  db: SupabaseClient;
  token: string | null;
  /** app User.id of the caller, resolved via RLS-safe RPC; null when signed out */
  me: () => Promise<string | null>;
  /** auth.users id of the caller */
  authId: () => Promise<string | null>;
}

function makeContext(request: Request): Ctx {
  const header = request.headers.get("authorization") ?? "";
  const token = /^bearer /i.test(header) ? header.slice(7).trim() : null;
  const db = supabaseForToken(token);
  let meCache: Promise<string | null> | undefined;
  let authCache: Promise<string | null> | undefined;
  return {
    db,
    token,
    me: () =>
      (meCache ??= Promise.resolve(
        db.rpc("current_app_user_id").then((r) => (r.data as string | null) ?? null)
      )),
    authId: () =>
      (authCache ??= token
        ? db.auth.getUser(token).then((r) => r.data.user?.id ?? null)
        : Promise.resolve(null)),
  };
}

function fail(message: string): never {
  throw new GraphQLError(message);
}

async function requireMe(ctx: Ctx): Promise<string> {
  const id = await ctx.me();
  if (!id) fail("You need to be signed in for that.");
  return id;
}

/* ————————————————— formatting ————————————————— */

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

function ago(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < MIN) return "now";
  if (diff < HOUR) return `${Math.floor(diff / MIN)}m`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h`;
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}d`;
  return `${Math.floor(diff / (7 * DAY))}w`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtMessageTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const dayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (d.getTime() >= dayMs) return `Today ${time}`;
  if (d.getTime() >= dayMs - DAY) return `Yesterday ${time}`;
  return `${d.toLocaleDateString("en-US", { weekday: "short" })} ${time}`;
}

const lower = (s: string) => s.toLowerCase();

/* ————————————————— row → GraphQL mapping ————————————————— */

/* eslint-disable @typescript-eslint/no-explicit-any -- PostgREST rows are shaped by select strings */

const PERSON_SELECT = `id, name, persona, roles, location, headline, bio, availability, yearsExp, skills, connectionsCount, hue, reelTitle, reelDuration,
  details:ProfileDetails(profilePictureUrl),
  credits:Credit(id, role, project, kind, year, note, sortOrder),
  portfolio:PortfolioItem(id, title, kind, year, tone, aspect, sortOrder)`;

function mapPerson(row: any) {
  return {
    id: row.id,
    name: row.name,
    persona: lower(row.persona),
    roles: row.roles ?? [],
    headline: row.headline,
    bio: row.bio,
    location: row.location,
    availability: lower(row.availability),
    yearsExp: row.yearsExp,
    skills: row.skills ?? [],
    connections: row.connectionsCount,
    hue: row.hue,
    reelTitle: row.reelTitle,
    reelDuration: row.reelDuration,
    avatarUrl: row.details?.profilePictureUrl ?? "",
    connectionStatus: "none",
    credits: [...(row.credits ?? [])]
      .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
      .map((c: any) => ({ id: c.id, role: c.role, project: c.project, kind: c.kind, year: c.year, note: c.note })),
    portfolio: [...(row.portfolio ?? [])]
      .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
      .map((m: any) => ({ id: m.id, title: m.title, kind: m.kind, year: m.year, tone: lower(m.tone), aspect: lower(m.aspect) })),
  };
}

/** Batch-resolve the viewer's connection status against a list of mapped Person objects (mutates in place). */
async function attachConnectionStatus(ctx: Ctx, people: any[]) {
  const me = await ctx.me();
  if (!me || people.length === 0) return people;
  const ids = people.map((p) => p.id);
  const { data } = await ctx.db
    .from("Connection")
    .select("requesterId, recipientId, status")
    .or(`requesterId.eq.${me},recipientId.eq.${me}`);
  const byOther = new Map<string, string>();
  for (const row of data ?? []) {
    const other = row.requesterId === me ? row.recipientId : row.requesterId;
    if (!ids.includes(other)) continue;
    if (row.status === "ACCEPTED") byOther.set(other, "connected");
    else if (row.status === "PENDING")
      byOther.set(other, row.requesterId === me ? "pending_sent" : "pending_received");
  }
  for (const p of people) {
    p.connectionStatus = byOther.get(p.id) ?? "none";
  }
  return people;
}

function mapAuthor(row: any) {
  return { id: row.id, name: row.name, headline: row.headline, hue: row.hue, avatarUrl: row.details?.profilePictureUrl ?? "" };
}

function mapMedia(row: any) {
  if (!row.mediaTitle) return null;
  return {
    id: `${row.id}-media`,
    title: row.mediaTitle,
    kind: row.mediaKind ?? "",
    year: row.mediaYear ?? "",
    tone: lower(row.mediaTone ?? "MIDNIGHT"),
    aspect: lower(row.mediaAspect ?? "WIDE"),
  };
}

function mapPost(row: any, likedIds: Set<string>) {
  return {
    id: row.id,
    author: mapAuthor(row.author),
    kind: lower(row.kind),
    timeAgo: ago(row.createdAt),
    text: row.text,
    media: mapMedia(row),
    mediaUrl: row.mediaDataUrl ?? null,
    mediaType: row.mediaMimeType?.startsWith("video/") ? "video" : row.mediaDataUrl ? "image" : null,
    likes: row.seedLikes + (row.likeCount?.[0]?.count ?? 0),
    comments: row.seedComments + (row.commentCount?.[0]?.count ?? 0),
    liked: likedIds.has(row.id),
    castingCallId: row.castingCallId,
  };
}

const CALL_SELECT = `id, title, company, medium, location, compensation, shootDates, deadline, shootStart, requiresAudition, isPublic, description, requirements, tags, seedApplicants, createdAt, postedById,
  postedBy:User!CastingCall_postedById_fkey(id, name, headline, hue, details:ProfileDetails(profilePictureUrl)),
  lookingFor:CastingRole(id, name, brief, sortOrder),
  appCount:Application(count)`;

function mapCall(row: any, appliedIds: Set<string>, bookmarkedIds: Set<string> = new Set()) {
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    medium: row.medium,
    location: row.location,
    compensation: row.compensation,
    shootDates: row.shootDates,
    deadline: fmtDate(row.deadline),
    deadlineISO: String(row.deadline).slice(0, 10),
    shootStartISO: String(row.shootStart).slice(0, 10),
    requiresAudition: row.requiresAudition,
    description: row.description,
    lookingFor: [...(row.lookingFor ?? [])]
      .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
      .map((r: any) => ({ name: r.name, brief: r.brief })),
    requirements: row.requirements ?? [],
    tags: row.tags ?? [],
    applicants: row.seedApplicants + (row.appCount?.[0]?.count ?? 0),
    postedAgo: ago(row.createdAt),
    applied: appliedIds.has(row.id),
    bookmarked: bookmarkedIds.has(row.id),
    postedBy: mapAuthor(row.postedBy),
  };
}

async function myAppliedCallIds(ctx: Ctx): Promise<Set<string>> {
  const me = await ctx.me();
  if (!me) return new Set();
  const { data } = await ctx.db.from("Application").select("callId").eq("applicantId", me);
  return new Set((data ?? []).map((r: any) => r.callId));
}

async function myBookmarkedCallIds(ctx: Ctx): Promise<Set<string>> {
  const me = await ctx.me();
  if (!me) return new Set();
  const { data } = await ctx.db.from("CalendarBookmark").select("callId").eq("userId", me);
  return new Set((data ?? []).map((r: any) => r.callId));
}

/* ————— profile details mapping (DB row ↔ SessionUser.details) ————— */

function detailsToGraph(d: any) {
  const dob = d?.dateOfBirth
    ? String(d.dateOfBirth).slice(0, 10).split("-").reverse().join("/")
    : "";
  return {
    firstName: d?.firstName ?? "",
    middleName: d?.middleName ?? "",
    lastName: d?.lastName ?? "",
    dateOfBirth: dob,
    countryOfOrigin: d?.countryOfOrigin ?? "",
    resumeName: d?.resumeUrl ?? "",
    companyName: d?.companyName ?? "",
    category: d?.category ?? "",
    registrationNumber: d?.registrationNumber ?? "",
    stateOfRegistration: d?.stateOfRegistration ?? "",
    countryOfRegistration: d?.countryOfRegistration ?? "",
    handbookName: d?.handbookUrl ?? "",
    contactNumber: d?.contactNumber ?? "",
    emailAddress: d?.emailAddress ?? "",
    address: d?.address ?? "",
    languagesSpoken: d?.languagesSpoken ?? "",
    languagesWritten: d?.languagesWritten ?? "",
    qualification: d?.qualification ?? "",
    experience: {
      theater: d?.theaterLink ?? "",
      mainstreamMovie: d?.mainstreamLink ?? "",
      television: d?.televisionLink ?? "",
      imdb: d?.imdbLink ?? "",
    },
    certifications: d?.certifications ?? "",
    honors: d?.honors ?? "",
    targetAudience: d?.targetAudience ?? [],
    profilePicture: d?.profilePictureUrl ?? "",
    gallery: d?.gallery ?? [],
  };
}

function detailsToRow(details: SessionUser["details"]) {
  const dobParts = details.dateOfBirth?.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return {
    firstName: details.firstName,
    middleName: details.middleName,
    lastName: details.lastName,
    dateOfBirth: dobParts ? `${dobParts[3]}-${dobParts[2]}-${dobParts[1]}` : null,
    countryOfOrigin: details.countryOfOrigin,
    resumeUrl: details.resumeName,
    companyName: details.companyName,
    category: details.category,
    registrationNumber: details.registrationNumber,
    stateOfRegistration: details.stateOfRegistration,
    countryOfRegistration: details.countryOfRegistration,
    handbookUrl: details.handbookName,
    contactNumber: details.contactNumber,
    emailAddress: details.emailAddress,
    address: details.address,
    languagesSpoken: details.languagesSpoken,
    languagesWritten: details.languagesWritten,
    qualification: details.qualification,
    theaterLink: details.experience.theater,
    mainstreamLink: details.experience.mainstreamMovie,
    televisionLink: details.experience.television,
    imdbLink: details.experience.imdb,
    certifications: details.certifications,
    honors: details.honors,
    targetAudience: details.targetAudience,
    profilePictureUrl: details.profilePicture,
    gallery: details.gallery,
  };
}

const ME_SELECT = `id, email, name, persona, registrationType, roles, location, headline, bio, availability, yearsExp, skills, connectionsCount, hue, reelTitle, reelDuration,
  details:ProfileDetails(*),
  credits:Credit(id, role, project, kind, year, note, sortOrder),
  portfolio:PortfolioItem(id, title, kind, year, tone, aspect, sortOrder)`;

function mapMe(row: any) {
  const p = mapPerson({ ...row, details: { profilePictureUrl: row.details?.profilePictureUrl } });
  return {
    ...p,
    email: row.email,
    registrationType: lower(row.registrationType),
    details: detailsToGraph(row.details),
  };
}

async function fetchMe(ctx: Ctx) {
  const me = await ctx.me();
  if (!me) return null;
  const { data, error } = await ctx.db.from("User").select(ME_SELECT).eq("id", me).single();
  if (error || !data) return null;
  return mapMe(data);
}

/* ————————————————— schema ————————————————— */

const typeDefs = /* GraphQL */ `
  type MediaItem { id: ID!, title: String!, kind: String!, year: String!, tone: String!, aspect: String! }
  type Credit { id: ID!, role: String!, project: String!, kind: String!, year: String!, note: String }

  type Person {
    id: ID!
    name: String!
    persona: String!
    roles: [String!]!
    headline: String!
    bio: String!
    location: String!
    availability: String!
    yearsExp: Int!
    skills: [String!]!
    credits: [Credit!]!
    portfolio: [MediaItem!]!
    reelTitle: String!
    reelDuration: String!
    connections: Int!
    hue: Int!
    avatarUrl: String!
    connectionStatus: String!
  }

  type ExperienceLinks { theater: String!, mainstreamMovie: String!, television: String!, imdb: String! }

  type ProfileDetailsG {
    firstName: String!, middleName: String!, lastName: String!
    dateOfBirth: String!, countryOfOrigin: String!, resumeName: String!
    companyName: String!, category: String!, registrationNumber: String!
    stateOfRegistration: String!, countryOfRegistration: String!, handbookName: String!
    contactNumber: String!, emailAddress: String!, address: String!
    languagesSpoken: String!, languagesWritten: String!, qualification: String!
    experience: ExperienceLinks!
    certifications: String!, honors: String!
    targetAudience: [String!]!
    profilePicture: String!
    gallery: [String!]!
  }

  type Me {
    id: ID!
    email: String!
    name: String!
    persona: String!
    registrationType: String!
    roles: [String!]!
    location: String!
    headline: String!
    bio: String!
    availability: String!
    yearsExp: Int!
    skills: [String!]!
    credits: [Credit!]!
    portfolio: [MediaItem!]!
    reelTitle: String!
    reelDuration: String!
    connections: Int!
    hue: Int!
    avatarUrl: String!
    details: ProfileDetailsG!
  }

  type PostAuthor { id: ID!, name: String!, headline: String!, hue: Int!, avatarUrl: String! }

  type PostComment { id: ID!, author: PostAuthor!, text: String!, timeAgo: String! }

  type Post {
    id: ID!
    author: PostAuthor!
    kind: String!
    timeAgo: String!
    text: String!
    media: MediaItem
    mediaUrl: String
    mediaType: String
    likes: Int!
    comments: Int!
    liked: Boolean!
    castingCallId: String
  }

  type CastingRole { name: String!, brief: String! }

  type CastingCall {
    id: ID!
    title: String!
    company: String!
    postedBy: PostAuthor!
    medium: String!
    location: String!
    compensation: String!
    shootDates: String!
    deadline: String!
    deadlineISO: String!
    shootStartISO: String!
    requiresAudition: Boolean!
    description: String!
    lookingFor: [CastingRole!]!
    requirements: [String!]!
    tags: [String!]!
    applicants: Int!
    postedAgo: String!
    applied: Boolean!
    bookmarked: Boolean!
  }

  type MyApplication {
    id: ID!
    status: String!
    appliedAgo: String!
    auditionDate: String
    auditionISO: String
    call: CastingCall!
  }

  type ListingApplicant { person: Person!, status: String!, appliedAgo: String!, note: String }

  type MyListing {
    id: ID!
    title: String!
    medium: String!
    location: String!
    compensation: String!
    shootDates: String!
    deadline: String!
    description: String!
    requiresAudition: Boolean!
    postedAgo: String!
    applicants: [ListingApplicant!]!
  }

  type Message { id: ID!, from: String!, text: String!, time: String! }

  type Conversation {
    id: ID!
    person: Person!
    unread: Int!
    lastActive: String!
    messages: [Message!]!
  }

  type ConnectionRequest {
    id: ID!
    person: Person!
    sentAgo: String!
  }

  type CustomEvent {
    id: ID!
    title: String!
    dateISO: String!
    note: String!
  }

  type Query {
    me: Me
    feed: [Post!]!
    postComments(postId: ID!): [PostComment!]!
    castingCalls(medium: String, location: String, query: String): [CastingCall!]!
    castingCall(id: ID!): CastingCall
    people(query: String, role: String, location: String, minYears: Int, availability: String): [Person!]!
    person(id: ID!): Person
    conversations: [Conversation!]!
    myApplications: [MyApplication!]!
    myListings: [MyListing!]!
    connections: [Person!]!
    incomingConnectionRequests: [ConnectionRequest!]!
    outgoingConnectionRequests: [ConnectionRequest!]!
    myBookmarkedCalls: [CastingCall!]!
    myCustomEvents: [CustomEvent!]!
  }

  type Mutation {
    createProfile(name: String!, persona: String!, registrationType: String!, roles: [String!]!, location: String!): Me!
    updateProfile(patch: String!): Me!
    createPost(text: String!, mediaUrl: String, mediaType: String): Post!
    toggleLike(id: ID!): Post
    addComment(postId: ID!, text: String!): Boolean!
    applyToCasting(id: ID!, note: String): CastingCall
    createListing(
      title: String!, medium: String!, location: String!, compensation: String!,
      shootDates: String!, deadline: String!, shootStart: String, description: String!, requiresAudition: Boolean!
    ): MyListing!
    setApplicantStatus(listingId: ID!, personId: ID!, status: String!): Boolean!
    sendMessage(conversationId: ID!, text: String!): [Message!]!
    markRead(conversationId: ID!): Boolean!
    startConversation(personId: ID!): Conversation!
    sendConnectionRequest(personId: ID!): Boolean!
    respondToConnection(connectionId: ID!, accept: Boolean!): Boolean!
    removeConnection(personId: ID!): Boolean!
    toggleBookmark(callId: ID!): Boolean!
    addCustomEvent(title: String!, dateISO: String!, note: String): CustomEvent!
    deleteCustomEvent(id: ID!): Boolean!
  }
`;

/* ————————————————— resolvers ————————————————— */

const POST_SELECT = `id, kind, text, createdAt, mediaTitle, mediaKind, mediaYear, mediaTone, mediaAspect, mediaDataUrl, mediaMimeType, castingCallId, seedLikes, seedComments,
  author:User!Post_authorId_fkey(id, name, headline, hue, details:ProfileDetails(profilePictureUrl)),
  likeCount:Like(count),
  commentCount:Comment(count)`;

async function fetchPost(ctx: Ctx, id: string) {
  const [{ data }, me] = await Promise.all([
    ctx.db.from("Post").select(POST_SELECT).eq("id", id).single(),
    ctx.me(),
  ]);
  if (!data) return null;
  let liked = new Set<string>();
  if (me) {
    const { data: likes } = await ctx.db.from("Like").select("postId").eq("userId", me).eq("postId", id);
    liked = new Set((likes ?? []).map((l: any) => l.postId));
  }
  return mapPost(data, liked);
}

const CONV_SELECT = `id, participantAId, participantBId, lastMessageAt, aLastReadAt, bLastReadAt,
  a:User!Conversation_participantAId_fkey(${PERSON_SELECT.replace(/\n/g, " ")}),
  b:User!Conversation_participantBId_fkey(${PERSON_SELECT.replace(/\n/g, " ")}),
  messages:Message(id, senderId, text, createdAt)`;

function mapConversation(row: any, me: string) {
  const mine = row.participantAId === me;
  const other = mine ? row.b : row.a;
  const lastRead = mine ? row.aLastReadAt : row.bLastReadAt;
  const messages = [...(row.messages ?? [])].sort(
    (x: any, y: any) => new Date(x.createdAt).getTime() - new Date(y.createdAt).getTime()
  );
  const unread = messages.filter(
    (m: any) => m.senderId !== me && (!lastRead || new Date(m.createdAt) > new Date(lastRead))
  ).length;
  return {
    id: row.id,
    person: mapPerson(other),
    unread,
    lastActive: ago(row.lastMessageAt),
    messages: messages.map((m: any) => ({
      id: m.id,
      from: m.senderId === me ? "me" : "them",
      text: m.text,
      time: fmtMessageTime(m.createdAt),
    })),
  };
}

const resolvers = {
  Query: {
    me: (_: unknown, __: unknown, ctx: Ctx) => fetchMe(ctx),

    feed: async (_: unknown, __: unknown, ctx: Ctx) => {
      const [{ data, error }, me] = await Promise.all([
        ctx.db.from("Post").select(POST_SELECT).order("createdAt", { ascending: false }).limit(50),
        ctx.me(),
      ]);
      if (error) fail(error.message);
      let likedIds = new Set<string>();
      if (me) {
        const { data: likes } = await ctx.db.from("Like").select("postId").eq("userId", me);
        likedIds = new Set((likes ?? []).map((l: any) => l.postId));
      }
      return (data ?? []).map((row: any) => mapPost(row, likedIds));
    },

    postComments: async (_: unknown, { postId }: { postId: string }, ctx: Ctx) => {
      const { data, error } = await ctx.db
        .from("Comment")
        .select(`id, text, createdAt, author:User!Comment_authorId_fkey(id, name, headline, hue, details:ProfileDetails(profilePictureUrl))`)
        .eq("postId", postId)
        .order("createdAt", { ascending: true });
      if (error) fail(error.message);
      return (data ?? []).map((c: any) => ({
        id: c.id,
        author: mapAuthor(c.author),
        text: c.text,
        timeAgo: ago(c.createdAt),
      }));
    },

    castingCalls: async (
      _: unknown,
      args: { medium?: string; location?: string; query?: string },
      ctx: Ctx
    ) => {
      let q = ctx.db
        .from("CastingCall")
        .select(CALL_SELECT)
        .eq("isPublic", true)
        .order("createdAt", { ascending: false });
      if (args.medium && args.medium !== "All") q = q.eq("medium", args.medium);
      if (args.location && args.location !== "All") q = q.ilike("location", `%${args.location}%`);
      const [{ data, error }, appliedIds] = await Promise.all([q, myAppliedCallIds(ctx)]);
      if (error) fail(error.message);
      let rows = data ?? [];
      if (args.query) {
        const needle = args.query.toLowerCase();
        rows = rows.filter((c: any) =>
          `${c.title} ${c.company} ${c.description} ${(c.tags ?? []).join(" ")}`.toLowerCase().includes(needle)
        );
      }
      return rows.map((row: any) => mapCall(row, appliedIds));
    },

    castingCall: async (_: unknown, { id }: { id: string }, ctx: Ctx) => {
      const [{ data }, appliedIds, bookmarkedIds] = await Promise.all([
        ctx.db.from("CastingCall").select(CALL_SELECT).eq("id", id).maybeSingle(),
        myAppliedCallIds(ctx),
        myBookmarkedCallIds(ctx),
      ]);
      return data ? mapCall(data, appliedIds, bookmarkedIds) : null;
    },

    people: async (
      _: unknown,
      args: { query?: string; role?: string; location?: string; minYears?: number; availability?: string },
      ctx: Ctx
    ) => {
      let q = ctx.db.from("User").select(PERSON_SELECT).order("connectionsCount", { ascending: false }).limit(100);
      if (args.role && args.role !== "All") q = q.contains("roles", [args.role]);
      if (args.location && args.location !== "All") q = q.ilike("location", `%${args.location}%`);
      if (args.minYears) q = q.gte("yearsExp", args.minYears);
      if (args.availability && args.availability !== "All") q = q.eq("availability", args.availability.toUpperCase());
      const { data, error } = await q;
      if (error) fail(error.message);
      let rows = data ?? [];
      if (args.query) {
        const needle = args.query.toLowerCase();
        rows = rows.filter((p: any) =>
          `${p.name} ${p.headline} ${(p.roles ?? []).join(" ")} ${(p.skills ?? []).join(" ")} ${p.location}`
            .toLowerCase()
            .includes(needle)
        );
      }
      return attachConnectionStatus(ctx, rows.map(mapPerson));
    },

    person: async (_: unknown, { id }: { id: string }, ctx: Ctx) => {
      const { data } = await ctx.db.from("User").select(PERSON_SELECT).eq("id", id).maybeSingle();
      if (!data) return null;
      const [person] = await attachConnectionStatus(ctx, [mapPerson(data)]);
      return person;
    },

    conversations: async (_: unknown, __: unknown, ctx: Ctx) => {
      const me = await ctx.me();
      if (!me) return [];
      const { data, error } = await ctx.db
        .from("Conversation")
        .select(CONV_SELECT)
        .or(`participantAId.eq.${me},participantBId.eq.${me}`)
        .order("lastMessageAt", { ascending: false });
      if (error) fail(error.message);
      return (data ?? []).map((row: any) => mapConversation(row, me));
    },

    myApplications: async (_: unknown, __: unknown, ctx: Ctx) => {
      const me = await ctx.me();
      if (!me) return [];
      const { data, error } = await ctx.db
        .from("Application")
        .select(`id, status, note, auditionAt, createdAt, call:CastingCall!Application_callId_fkey(${CALL_SELECT.replace(/\n/g, " ")})`)
        .eq("applicantId", me)
        .order("createdAt", { ascending: false });
      if (error) fail(error.message);
      const appliedIds = new Set((data ?? []).map((a: any) => a.call?.id).filter(Boolean));
      return (data ?? []).map((a: any) => ({
        id: a.id,
        status: lower(a.status),
        appliedAgo: `${ago(a.createdAt)} ago`,
        auditionDate: a.auditionAt
          ? `${fmtDate(a.auditionAt)} · ${new Date(a.auditionAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
          : null,
        auditionISO: a.auditionAt ? String(a.auditionAt).slice(0, 10) : null,
        call: mapCall(a.call, appliedIds as Set<string>),
      }));
    },

    myListings: async (_: unknown, __: unknown, ctx: Ctx) => {
      const me = await ctx.me();
      if (!me) return [];
      const { data, error } = await ctx.db
        .from("CastingCall")
        .select(`id, title, medium, location, compensation, shootDates, deadline, description, requiresAudition, createdAt,
          applications:Application(id, status, note, createdAt, person:User!Application_applicantId_fkey(${PERSON_SELECT.replace(/\n/g, " ")}))`)
        .eq("postedById", me)
        .order("createdAt", { ascending: false });
      if (error) fail(error.message);
      return (data ?? []).map((l: any) => ({
        id: l.id,
        title: l.title,
        medium: l.medium,
        location: l.location,
        compensation: l.compensation,
        shootDates: l.shootDates,
        deadline: fmtDate(l.deadline),
        description: l.description,
        requiresAudition: l.requiresAudition,
        postedAgo: `${ago(l.createdAt)} ago`,
        applicants: [...(l.applications ?? [])]
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .map((a: any) => ({
            person: mapPerson(a.person),
            status: lower(a.status),
            appliedAgo: `${ago(a.createdAt)} ago`,
            note: a.note || null,
          })),
      }));
    },

    connections: async (_: unknown, __: unknown, ctx: Ctx) => {
      const me = await ctx.me();
      if (!me) return [];
      const { data, error } = await ctx.db
        .from("Connection")
        .select(`requesterId, recipientId, requester:User!Connection_requesterId_fkey(${PERSON_SELECT.replace(/\n/g, " ")}), recipient:User!Connection_recipientId_fkey(${PERSON_SELECT.replace(/\n/g, " ")})`)
        .eq("status", "ACCEPTED")
        .or(`requesterId.eq.${me},recipientId.eq.${me}`);
      if (error) fail(error.message);
      const people = (data ?? []).map((row: any) => mapPerson(row.requesterId === me ? row.recipient : row.requester));
      return attachConnectionStatus(ctx, people);
    },

    incomingConnectionRequests: async (_: unknown, __: unknown, ctx: Ctx) => {
      const me = await ctx.me();
      if (!me) return [];
      const { data, error } = await ctx.db
        .from("Connection")
        .select(`id, createdAt, requester:User!Connection_requesterId_fkey(${PERSON_SELECT.replace(/\n/g, " ")})`)
        .eq("status", "PENDING")
        .eq("recipientId", me)
        .order("createdAt", { ascending: false });
      if (error) fail(error.message);
      return (data ?? []).map((row: any) => ({
        id: row.id,
        person: mapPerson(row.requester),
        sentAgo: `${ago(row.createdAt)} ago`,
      }));
    },

    outgoingConnectionRequests: async (_: unknown, __: unknown, ctx: Ctx) => {
      const me = await ctx.me();
      if (!me) return [];
      const { data, error } = await ctx.db
        .from("Connection")
        .select(`id, createdAt, recipient:User!Connection_recipientId_fkey(${PERSON_SELECT.replace(/\n/g, " ")})`)
        .eq("status", "PENDING")
        .eq("requesterId", me)
        .order("createdAt", { ascending: false });
      if (error) fail(error.message);
      return (data ?? []).map((row: any) => ({
        id: row.id,
        person: mapPerson(row.recipient),
        sentAgo: `${ago(row.createdAt)} ago`,
      }));
    },

    myBookmarkedCalls: async (_: unknown, __: unknown, ctx: Ctx) => {
      const me = await ctx.me();
      if (!me) return [];
      const { data, error } = await ctx.db
        .from("CalendarBookmark")
        .select(`callId, call:CastingCall!CalendarBookmark_callId_fkey(${CALL_SELECT.replace(/\n/g, " ")})`)
        .eq("userId", me);
      if (error) fail(error.message);
      const appliedIds = await myAppliedCallIds(ctx);
      const bookmarkedIds = new Set((data ?? []).map((r: any) => r.callId));
      return (data ?? []).filter((r: any) => r.call).map((r: any) => mapCall(r.call, appliedIds, bookmarkedIds));
    },

    myCustomEvents: async (_: unknown, __: unknown, ctx: Ctx) => {
      const me = await ctx.me();
      if (!me) return [];
      const { data, error } = await ctx.db
        .from("CustomEvent")
        .select("id, title, eventDate, note")
        .eq("userId", me)
        .order("eventDate", { ascending: true });
      if (error) fail(error.message);
      return (data ?? []).map((e: any) => ({
        id: e.id,
        title: e.title,
        dateISO: String(e.eventDate).slice(0, 10),
        note: e.note ?? "",
      }));
    },
  },

  Mutation: {
    createProfile: async (
      _: unknown,
      args: { name: string; persona: string; registrationType: string; roles: string[]; location: string },
      ctx: Ctx
    ) => {
      const authId = await ctx.authId();
      if (!authId) fail("Sign in first.");
      const { data: authUser } = await ctx.db.auth.getUser(ctx.token!);
      const email = authUser.user?.email ?? "";
      const persona = args.persona as Persona;
      const registrationType = args.registrationType as RegistrationType;
      const id = crypto.randomUUID();

      const sessionShape: SessionUser = {
        name: args.name,
        email,
        persona,
        registrationType,
        roles: args.roles,
        location: args.location,
        headline: defaultHeadline(persona, args.roles, args.location),
        bio: defaultBio(persona, args.roles),
        availability: "open",
        details: emptyDetails(args.name, email, args.location, registrationType),
      };

      // Profiles start empty — credits, portfolio, skills and connections
      // only exist once the member publishes them.
      const { error: userErr } = await ctx.db.from("User").insert({
        id,
        authId,
        email,
        name: args.name,
        persona: persona.toUpperCase(),
        registrationType: registrationType.toUpperCase(),
        roles: args.roles,
        location: args.location,
        headline: sessionShape.headline,
        bio: sessionShape.bio,
        availability: "OPEN",
        skills: [],
        connectionsCount: 0,
        hue: Math.floor(Math.random() * 14),
        reelTitle: "",
        reelDuration: "",
      });
      if (userErr) fail(userErr.message);

      const { error: detErr } = await ctx.db
        .from("ProfileDetails")
        .insert({ userId: id, ...detailsToRow(sessionShape.details) });
      if (detErr) fail(detErr.message);

      const meRow = await fetchMe(ctx);
      if (!meRow) fail("Profile creation failed.");
      return meRow;
    },

    updateProfile: async (_: unknown, { patch }: { patch: string }, ctx: Ctx) => {
      const me = await requireMe(ctx);
      let parsed: Partial<SessionUser>;
      try {
        parsed = JSON.parse(patch);
      } catch {
        fail("Invalid patch.");
      }
      const userPatch: Record<string, unknown> = {};
      if (parsed.name) userPatch.name = parsed.name;
      if (parsed.headline !== undefined) userPatch.headline = parsed.headline;
      if (parsed.bio !== undefined) userPatch.bio = parsed.bio;
      if (parsed.availability) userPatch.availability = parsed.availability.toUpperCase();
      if (Object.keys(userPatch).length) {
        const { error } = await ctx.db.from("User").update(userPatch).eq("id", me);
        if (error) fail(error.message);
      }
      if (parsed.details) {
        const { error } = await ctx.db
          .from("ProfileDetails")
          .upsert({ userId: me, ...detailsToRow(parsed.details) });
        if (error) fail(error.message);
      }
      const meRow = await fetchMe(ctx);
      if (!meRow) fail("Profile not found.");
      return meRow;
    },

    createPost: async (
      _: unknown,
      { text, mediaUrl, mediaType }: { text: string; mediaUrl?: string; mediaType?: string },
      ctx: Ctx
    ) => {
      const me = await requireMe(ctx);
      const id = crypto.randomUUID();
      const { error } = await ctx.db.from("Post").insert({
        id,
        authorId: me,
        kind: "ANNOUNCEMENT",
        text,
        mediaDataUrl: mediaUrl ?? null,
        mediaMimeType: mediaType === "video" ? "video/mp4" : mediaType === "image" ? "image/jpeg" : null,
      });
      if (error) fail(error.message);
      const post = await fetchPost(ctx, id);
      if (!post) fail("Post not found after insert.");
      return post;
    },

    toggleLike: async (_: unknown, { id }: { id: string }, ctx: Ctx) => {
      const me = await requireMe(ctx);
      const { data: existing } = await ctx.db
        .from("Like")
        .select("postId")
        .eq("userId", me)
        .eq("postId", id)
        .maybeSingle();
      if (existing) {
        await ctx.db.from("Like").delete().eq("userId", me).eq("postId", id);
      } else {
        await ctx.db.from("Like").insert({ userId: me, postId: id });
      }
      return fetchPost(ctx, id);
    },

    addComment: async (_: unknown, { postId, text }: { postId: string; text: string }, ctx: Ctx) => {
      const me = await requireMe(ctx);
      const { error } = await ctx.db
        .from("Comment")
        .insert({ id: crypto.randomUUID(), postId, authorId: me, text });
      if (error) fail(error.message);
      return true;
    },

    applyToCasting: async (_: unknown, { id, note }: { id: string; note?: string }, ctx: Ctx) => {
      const me = await requireMe(ctx);
      const { error } = await ctx.db.from("Application").insert({
        id: crypto.randomUUID(),
        callId: id,
        applicantId: me,
        note: note ?? "",
        updatedAt: new Date().toISOString(),
      });
      if (error && !/duplicate/i.test(error.message)) fail(error.message);
      const [{ data }, appliedIds] = await Promise.all([
        ctx.db.from("CastingCall").select(CALL_SELECT).eq("id", id).maybeSingle(),
        myAppliedCallIds(ctx),
      ]);
      return data ? mapCall(data, appliedIds) : null;
    },

    createListing: async (
      _: unknown,
      args: {
        title: string;
        medium: string;
        location: string;
        compensation: string;
        shootDates: string;
        deadline: string; // YYYY-MM-DD
        shootStart?: string; // YYYY-MM-DD
        description: string;
        requiresAudition: boolean;
      },
      ctx: Ctx
    ) => {
      const me = await requireMe(ctx);
      const { data: meUser } = await ctx.db.from("User").select("name").eq("id", me).single();
      const id = crypto.randomUUID();
      const deadline = /^\d{4}-\d{2}-\d{2}$/.test(args.deadline)
        ? `${args.deadline}T23:59:59Z`
        : new Date(Date.now() + 30 * DAY).toISOString();
      const shootStart =
        args.shootStart && /^\d{4}-\d{2}-\d{2}$/.test(args.shootStart)
          ? `${args.shootStart}T09:00:00Z`
          : deadline;
      const { error } = await ctx.db.from("CastingCall").insert({
        id,
        title: args.title,
        company: meUser?.name ?? "Independent",
        medium: args.medium,
        location: args.location,
        compensation: args.compensation,
        shootDates: args.shootDates,
        deadline,
        shootStart,
        requiresAudition: args.requiresAudition,
        isPublic: true,
        description: args.description,
        requirements: [],
        tags: [args.medium, args.requiresAudition ? "Audition" : "Direct offer"],
        postedById: me,
      });
      if (error) fail(error.message);
      return {
        id,
        title: args.title,
        medium: args.medium,
        location: args.location,
        compensation: args.compensation,
        shootDates: args.shootDates,
        deadline: fmtDate(deadline),
        description: args.description,
        requiresAudition: args.requiresAudition,
        postedAgo: "now",
        applicants: [],
      };
    },

    setApplicantStatus: async (
      _: unknown,
      args: { listingId: string; personId: string; status: string },
      ctx: Ctx
    ) => {
      await requireMe(ctx);
      const { error } = await ctx.db
        .from("Application")
        .update({ status: args.status.toUpperCase(), updatedAt: new Date().toISOString() })
        .eq("callId", args.listingId)
        .eq("applicantId", args.personId);
      if (error) fail(error.message);
      return true;
    },

    sendMessage: async (
      _: unknown,
      { conversationId, text }: { conversationId: string; text: string },
      ctx: Ctx
    ) => {
      const me = await requireMe(ctx);
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const { error } = await ctx.db
        .from("Message")
        .insert({ id, conversationId, senderId: me, text });
      if (error) fail(error.message);
      const { data: conv } = await ctx.db
        .from("Conversation")
        .select("participantAId")
        .eq("id", conversationId)
        .single();
      const readCol = conv?.participantAId === me ? "aLastReadAt" : "bLastReadAt";
      await ctx.db
        .from("Conversation")
        .update({ lastMessageAt: now, [readCol]: now })
        .eq("id", conversationId);
      return [{ id, from: "me", text, time: fmtMessageTime(now) }];
    },

    markRead: async (_: unknown, { conversationId }: { conversationId: string }, ctx: Ctx) => {
      const me = await requireMe(ctx);
      const { data: conv } = await ctx.db
        .from("Conversation")
        .select("participantAId")
        .eq("id", conversationId)
        .single();
      if (!conv) return false;
      const readCol = conv.participantAId === me ? "aLastReadAt" : "bLastReadAt";
      await ctx.db
        .from("Conversation")
        .update({ [readCol]: new Date().toISOString() })
        .eq("id", conversationId);
      return true;
    },

    startConversation: async (_: unknown, { personId }: { personId: string }, ctx: Ctx) => {
      const me = await requireMe(ctx);
      const { data: existing } = await ctx.db
        .from("Conversation")
        .select(CONV_SELECT)
        .or(
          `and(participantAId.eq.${me},participantBId.eq.${personId}),and(participantAId.eq.${personId},participantBId.eq.${me})`
        )
        .maybeSingle();
      if (existing) return mapConversation(existing, me);
      const id = crypto.randomUUID();
      const { error } = await ctx.db
        .from("Conversation")
        .insert({ id, participantAId: me, participantBId: personId });
      if (error) fail(error.message);
      const { data: created, error: readErr } = await ctx.db
        .from("Conversation")
        .select(CONV_SELECT)
        .eq("id", id)
        .single();
      if (readErr || !created) fail(readErr?.message ?? "Conversation not found.");
      return mapConversation(created, me);
    },

    sendConnectionRequest: async (_: unknown, { personId }: { personId: string }, ctx: Ctx) => {
      const me = await requireMe(ctx);
      if (me === personId) fail("You can't connect with yourself.");
      const { data: existing } = await ctx.db
        .from("Connection")
        .select("id, status")
        .or(
          `and(requesterId.eq.${me},recipientId.eq.${personId}),and(requesterId.eq.${personId},recipientId.eq.${me})`
        )
        .maybeSingle();
      if (existing) return true; // already pending/connected — idempotent
      const { error } = await ctx.db
        .from("Connection")
        .insert({ id: crypto.randomUUID(), requesterId: me, recipientId: personId });
      if (error) fail(error.message);
      return true;
    },

    respondToConnection: async (
      _: unknown,
      { connectionId, accept }: { connectionId: string; accept: boolean },
      ctx: Ctx
    ) => {
      await requireMe(ctx);
      if (accept) {
        const { error } = await ctx.db
          .from("Connection")
          .update({ status: "ACCEPTED", respondedAt: new Date().toISOString() })
          .eq("id", connectionId);
        if (error) fail(error.message);
      } else {
        const { error } = await ctx.db
          .from("Connection")
          .update({ status: "DECLINED", respondedAt: new Date().toISOString() })
          .eq("id", connectionId);
        if (error) fail(error.message);
      }
      return true;
    },

    removeConnection: async (_: unknown, { personId }: { personId: string }, ctx: Ctx) => {
      const me = await requireMe(ctx);
      const { error } = await ctx.db
        .from("Connection")
        .delete()
        .or(
          `and(requesterId.eq.${me},recipientId.eq.${personId}),and(requesterId.eq.${personId},recipientId.eq.${me})`
        );
      if (error) fail(error.message);
      return true;
    },

    toggleBookmark: async (_: unknown, { callId }: { callId: string }, ctx: Ctx) => {
      const me = await requireMe(ctx);
      const { data: existing } = await ctx.db
        .from("CalendarBookmark")
        .select("callId")
        .eq("userId", me)
        .eq("callId", callId)
        .maybeSingle();
      if (existing) {
        await ctx.db.from("CalendarBookmark").delete().eq("userId", me).eq("callId", callId);
      } else {
        await ctx.db.from("CalendarBookmark").insert({ userId: me, callId });
      }
      return true;
    },

    addCustomEvent: async (
      _: unknown,
      { title, dateISO, note }: { title: string; dateISO: string; note?: string },
      ctx: Ctx
    ) => {
      const me = await requireMe(ctx);
      const id = crypto.randomUUID();
      const { error } = await ctx.db
        .from("CustomEvent")
        .insert({ id, userId: me, title, eventDate: dateISO, note: note ?? "" });
      if (error) fail(error.message);
      return { id, title, dateISO, note: note ?? "" };
    },

    deleteCustomEvent: async (_: unknown, { id }: { id: string }, ctx: Ctx) => {
      const me = await requireMe(ctx);
      const { error } = await ctx.db.from("CustomEvent").delete().eq("id", id).eq("userId", me);
      if (error) fail(error.message);
      return true;
    },
  },
};

const { handleRequest } = createYoga({
  schema: createSchema({ typeDefs, resolvers }),
  graphqlEndpoint: "/api/graphql",
  fetchAPI: { Response },
  context: ({ request }) => makeContext(request),
});

const handler = (request: Request) => handleRequest(request, {});

export { handler as GET, handler as POST, handler as OPTIONS };
