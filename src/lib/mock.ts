// ─────────────────────────────────────────────────────────────
// Mock UI data. Purely for the front-end experience while the
// backend is empty — pages fall back to this so everything feels
// alive. No external images: avatars are initials, media is the
// offline gradient MediaPlaceholder.
// ─────────────────────────────────────────────────────────────

import type { FeedPost } from "@/components/PostCard";
import type { MediaItem, MediaTone } from "./types";

const m = (
  id: string,
  title: string,
  kind: string,
  year: string,
  tone: MediaTone,
  aspect: MediaItem["aspect"] = "wide"
): MediaItem => ({ id, title, kind, year, tone, aspect });

export interface MockPerson {
  id: string;
  name: string;
  roles: string[];
  headline: string;
  location: string;
  hue: number;
  connections: number;
  availability: "open" | "listening" | "booked";
  followers: string;
}

export const MOCK_PEOPLE: MockPerson[] = [
  { id: "aanya-sharma", name: "Aanya Sharma", roles: ["Actor"], headline: "Actor — features, OTT & ad film | Hindi · English · Marathi", location: "Mumbai", hue: 0, connections: 512, availability: "open", followers: "12.4k" },
  { id: "kabir-mehta", name: "Kabir Mehta", roles: ["Cinematographer"], headline: "DoP | Alexa 35 · anamorphic · available for features", location: "London", hue: 1, connections: 883, availability: "booked", followers: "24.1k" },
  { id: "ritika-nair", name: "Ritika Nair", roles: ["Casting Director"], headline: "Casting Director, Meraki Casting | features · OTT · ad film", location: "Mumbai", hue: 2, connections: 2140, availability: "open", followers: "38.7k" },
  { id: "dev-malhotra", name: "Dev Malhotra", roles: ["Director", "Writer"], headline: "Director — 'Half Light' (MAMI '25) | developing second feature", location: "Delhi", hue: 3, connections: 1290, availability: "listening", followers: "19.2k" },
  { id: "zoya-qureshi", name: "Zoya Qureshi", roles: ["Singer", "Voice Artist"], headline: "Playback & VO | Hindi · Urdu · Telugu | home studio", location: "Hyderabad", hue: 4, connections: 431, availability: "open", followers: "8.9k" },
  { id: "meher-kapoor", name: "Meher Kapoor", roles: ["Model", "Actor"], headline: "Model & actor | print · runway · ad film | 5'9\"", location: "Dubai", hue: 5, connections: 350, availability: "open", followers: "56.3k" },
  { id: "sana-iyer", name: "Sana Iyer", roles: ["Dancer"], headline: "Dancer & choreographer | contemporary · hip-hop", location: "Chennai", hue: 6, connections: 296, availability: "listening", followers: "14.0k" },
  { id: "vikram-sethi", name: "Vikram Sethi", roles: ["Producer"], headline: "Producer, Ashvattha Films | 3 features · 2 series", location: "Mumbai", hue: 7, connections: 3005, availability: "open", followers: "9.1k" },
  { id: "tara-dsouza", name: "Tara D'Souza", roles: ["Writer"], headline: "Screenwriter | features & limited series", location: "Goa", hue: 8, connections: 618, availability: "open", followers: "6.5k" },
  { id: "nikhil-bhandari", name: "Nikhil Bhandari", roles: ["Composer"], headline: "Film composer | orchestral + electronic | Atmos room", location: "Los Angeles", hue: 9, connections: 742, availability: "booked", followers: "21.8k" },
  { id: "rohan-chatterjee", name: "Rohan Chatterjee", roles: ["Actor"], headline: "Theatre-first actor | Bengali · Hindi · English", location: "Kolkata", hue: 11, connections: 267, availability: "open", followers: "4.2k" },
  { id: "ishaan-verma", name: "Ishaan Verma", roles: ["Editor"], headline: "Editor | features · trailers · branded | Avid + Resolve", location: "Berlin", hue: 12, connections: 529, availability: "open", followers: "7.7k" },
];

const author = (id: string) => {
  const p = MOCK_PEOPLE.find((x) => x.id === id)!;
  return { id: p.id, name: p.name, headline: p.headline, hue: p.hue, avatarUrl: undefined };
};

export const MOCK_POSTS: FeedPost[] = [
  {
    id: "mock-1",
    author: author("ritika-nair"),
    kind: "casting",
    timeAgo: "38m",
    text: "🚨 CASTING NOW — 'Saltwater' S3. Four recurring roles shooting in Goa from August. Konkani speakers, this one's for you. Slate your height, tape scene 7. Let's find some faces.",
    media: m("mm1", "Saltwater S3 — Open Call", "CASTING · GOA", "2026", "steel"),
    likes: 428,
    comments: 63,
    liked: false,
    castingTitle: "Saltwater S3 — 4 recurring roles",
    castingMeta: "OTT Series · Goa · closes Jul 20",
    castingCallId: "mock-call-1",
  },
  {
    id: "mock-2",
    author: author("dev-malhotra"),
    kind: "announcement",
    timeAgo: "2h",
    text: "Some personal news 🎬✨ 'Monsoon Chess' is fully financed. We shoot in September on the Konkan coast. Three years, eleven drafts. To everyone who read one — thank you. Casting for Nalini opens this week.",
    media: m("mm2", "Monsoon Chess — First Look", "IN DEVELOPMENT", "2026", "porcelain"),
    likes: 1892,
    comments: 227,
    liked: true,
  },
  {
    id: "mock-3",
    author: author("ishaan-verma"),
    kind: "trailer",
    timeAgo: "5h",
    text: "Locked the Saltwater S2 teaser at 4am. Sixty seconds, no dialogue, one wave 🌊. Sometimes the cut tells you when it's done — you just have to be awake to hear it.",
    media: m("mm3", "Saltwater S2 — Teaser", "TEASER · 0:60", "2026", "midnight"),
    likes: 856,
    comments: 44,
    liked: false,
  },
  {
    id: "mock-4",
    author: author("aanya-sharma"),
    kind: "bts",
    timeAgo: "9h",
    text: "Day 40 of 42 on 'Half Light' 🎥 Kabir lit this entire scene with one practical bulb and a bounce board, and it's the best I've ever looked on camera. Hire cinematographers who treat light like dialogue.",
    media: m("mm4", "Half Light — Day 40", "BTS", "2025", "dusk"),
    likes: 1241,
    comments: 72,
    liked: false,
  },
  {
    id: "mock-5",
    author: author("zoya-qureshi"),
    kind: "bts",
    timeAgo: "14h",
    text: "Recorded scratch vocals for an animated feature at 2am from my home studio 🎧 The director approved take two. The 24-hour-turnaround reputation survives another week 😌",
    likes: 333,
    comments: 29,
    liked: false,
  },
  {
    id: "mock-6",
    author: author("sana-iyer"),
    kind: "casting",
    timeAgo: "1d",
    text: "We need EIGHT dancers + an assistant choreographer 💃 Flooded warehouse, ankle-deep water, the most fun brief I've had in years. Tag a dancer who isn't afraid to get wet 🌊",
    likes: 478,
    comments: 51,
    liked: false,
    castingTitle: "Peppermint MV — 8 dancers",
    castingMeta: "Music Video · Hyderabad · closes Jul 22",
    castingCallId: "mock-call-4",
  },
  {
    id: "mock-7",
    author: author("kabir-mehta"),
    kind: "trailer",
    timeAgo: "2d",
    text: "'Dhaaga' crossed 62 million views 🎉 Two years since we shot it in one rained-out night in Alibaug. Dev kept saying 'the weather IS the video'. He was right.",
    media: m("mm7", "Peppermint — 'Dhaaga'", "MUSIC VIDEO", "2023", "dusk"),
    likes: 3520,
    comments: 203,
    liked: true,
  },
];

// ───────── casting calls ─────────

export interface MockCall {
  id: string;
  title: string;
  company: string;
  postedById: string;
  medium: string;
  location: string;
  compensation: string;
  deadline: string;
  tags: string[];
  applicants: number;
  postedAgo: string;
  tone: MediaTone;
  hot?: boolean;
  roles: number;
}

export const MOCK_CALLS: MockCall[] = [
  { id: "mock-call-1", title: "Supporting cast (4) — 'Saltwater' S3", company: "Hoiche Originals × Ashvattha", postedById: "ritika-nair", medium: "OTT Series", location: "Goa", compensation: "Paid — union rates", deadline: "Jul 20", tags: ["Recurring", "Paid", "Konkani"], applicants: 231, postedAgo: "1d", tone: "steel", hot: true, roles: 4 },
  { id: "mock-call-2", title: "Female lead, 28–38 — 'Monsoon Chess'", company: "Ashvattha Films", postedById: "ritika-nair", medium: "Feature Film", location: "Mumbai", compensation: "Paid — ₹12L, 42 days", deadline: "Jul 28", tags: ["Lead", "Paid", "Festival"], applicants: 148, postedAgo: "3d", tone: "midnight", hot: true, roles: 2 },
  { id: "mock-call-3", title: "Two faces, 25–35 — skincare campaign", company: "Auréa / Bloomfield", postedById: "meher-kapoor", medium: "Ad Film", location: "London", compensation: "Paid — £4,000 + usage", deadline: "Jul 15", tags: ["Commercial", "Paid"], applicants: 312, postedAgo: "5d", tone: "porcelain", roles: 2 },
  { id: "mock-call-4", title: "8 dancers + asst. choreographer", company: "Peppermint / Studio Vermilion", postedById: "sana-iyer", medium: "Music Video", location: "Hyderabad", compensation: "Paid — ₹18k/day", deadline: "Jul 22", tags: ["Dance", "Paid"], applicants: 96, postedAgo: "2d", tone: "dusk", roles: 9 },
  { id: "mock-call-5", title: "Negative lead, 35–50 — 'Crosswind' reboot", company: "Sterling Television", postedById: "vikram-sethi", medium: "TV Series", location: "Mumbai", compensation: "Paid — monthly contract", deadline: "Jul 30", tags: ["TV", "Paid", "Lead"], applicants: 119, postedAgo: "4d", tone: "noir", roles: 1 },
  { id: "mock-call-6", title: "Cinematographer — festival short 'Ledger'", company: "Turmeric Pictures", postedById: "vikram-sethi", medium: "Short Film", location: "Delhi", compensation: "Paid — ₹1.8L, 8 days", deadline: "Aug 20", tags: ["Crew", "Paid", "Night shoot"], applicants: 41, postedAgo: "8h", tone: "midnight", hot: true, roles: 1 },
  { id: "mock-call-7", title: "Voice cast (3) — 'The Paper Kite 2'", company: "Lantern Animation", postedById: "ritika-nair", medium: "Feature Film", location: "Remote / Chennai", compensation: "Paid — session rates", deadline: "Aug 12", tags: ["Voice", "Paid", "Remote"], applicants: 74, postedAgo: "12h", tone: "sky", roles: 3 },
  { id: "mock-call-8", title: "Ensemble (6) — 'Gulmohar Lane' revival", company: "Aranya Theatre Collective", postedById: "vikram-sethi", medium: "Theatre", location: "Mumbai", compensation: "Paid — per-show + stipend", deadline: "Aug 5", tags: ["Theatre", "Open audition"], applicants: 187, postedAgo: "6d", tone: "dusk", roles: 6 },
];

// ───────── spotlight / stories rail ─────────

export interface Spotlight {
  id: string;
  kind: "call" | "creator" | "premiere" | "live";
  title: string;
  sub: string;
  tone: MediaTone;
  badge?: string;
}

export const MOCK_SPOTLIGHTS: Spotlight[] = [
  { id: "sp-live", kind: "live", title: "Live: Casting AMA", sub: "Ritika Nair · now", tone: "noir", badge: "LIVE" },
  { id: "sp-1", kind: "call", title: "Saltwater S3", sub: "4 roles · Goa", tone: "steel", badge: "HOT" },
  { id: "sp-2", kind: "premiere", title: "Half Light", sub: "Premiere tonight", tone: "midnight", badge: "NEW" },
  { id: "sp-3", kind: "creator", title: "Meher Kapoor", sub: "Rising · 56k", tone: "porcelain" },
  { id: "sp-4", kind: "call", title: "Monsoon Chess", sub: "Lead · Mumbai", tone: "dusk", badge: "HOT" },
  { id: "sp-5", kind: "creator", title: "Kabir Mehta", sub: "DoP · 24k", tone: "sky" },
  { id: "sp-6", kind: "premiere", title: "Dhaaga", sub: "62M views", tone: "dusk" },
];

// ───────── continuous "live pulse" popups ─────────

export interface Pulse {
  emoji: string;
  text: string;
  cta: string;
  href: string;
  tone: "brand" | "accent" | "pop" | "go";
}

export const LIVE_PULSES: Pulse[] = [
  { emoji: "🎬", text: "A casting director just viewed a profile in Mumbai", cta: "Be seen too", href: "/profile/edit", tone: "brand" },
  { emoji: "🔥", text: "3 new lead roles dropped in the last hour", cta: "See roles", href: "/casting", tone: "accent" },
  { emoji: "✨", text: "Aanya just booked a feature through Kaledio", cta: "Your turn", href: "/casting", tone: "pop" },
  { emoji: "📣", text: "Producers are hiring crew right now", cta: "Post your reel", href: "/profile/edit", tone: "brand" },
  { emoji: "🎭", text: "Open audition closes in 2 days — don't miss it", cta: "Apply now", href: "/casting", tone: "accent" },
  { emoji: "👀", text: "Your profile appeared in 12 searches this week", cta: "Boost it", href: "/profile", tone: "go" },
  { emoji: "🎥", text: "A DoP in London is looking for a gaffer", cta: "Connect", href: "/search", tone: "brand" },
  { emoji: "🏆", text: "Someone near you just got shortlisted", cta: "Join a role", href: "/casting", tone: "pop" },
  { emoji: "💬", text: "5 casting DMs sent in your city today", cta: "Open inbox", href: "/messages", tone: "brand" },
  { emoji: "🌟", text: "New this week: 41 verified casting calls", cta: "Explore", href: "/casting", tone: "accent" },
  { emoji: "🎤", text: "Voice artists wanted for an animated feature", cta: "Audition", href: "/casting", tone: "pop" },
  { emoji: "💃", text: "8 dancer spots filling fast for a music video", cta: "Grab one", href: "/casting", tone: "accent" },
];

// reaction palette used across the feed
export const REACTIONS = ["❤️", "🔥", "👏", "🎬", "😮", "🙌"] as const;
export type Reaction = (typeof REACTIONS)[number];

// ───────── full mock profile (for /profile/[id] fallback) ─────────

import type { Person } from "./types";

const SKILLS_BY_ROLE: Record<string, string[]> = {
  Actor: ["Method acting", "Improv", "Screen combat", "Two languages", "Self-tape setup"],
  Cinematographer: ["Alexa 35", "Anamorphic", "Handheld", "DaVinci grade", "Available light"],
  "Casting Director": ["Feature casting", "Street casting", "Union paperwork", "Dialect network"],
  Director: ["Direction", "Screenwriting", "Actor workshops", "Festival strategy"],
  Writer: ["Feature screenplays", "Limited series", "Writers' room", "Punch-up"],
  Singer: ["Playback", "Harmonies", "Ghazal", "Home studio"],
  "Voice Artist": ["Animation VO", "Dubbing", "Character range", "Source-Connect"],
  Model: ["Runway", "Print", "Ad film", "Scene study"],
  Dancer: ["Contemporary", "Hip-hop", "Choreography", "Movement direction"],
  Producer: ["Line producing", "Co-productions", "Festival sales", "Budgeting"],
  Composer: ["Orchestration", "Sound design", "Atmos mixing", "Trailer music"],
  Editor: ["Avid", "Resolve", "Trailer editing", "Doc structure"],
};

export function mockPersonProfile(id: string): Person | null {
  const p = MOCK_PEOPLE.find((x) => x.id === id);
  if (!p) return null;
  const role = p.roles[0];
  const skills = SKILLS_BY_ROLE[role] ?? ["Collaboration", "On-set discipline", "Craft"];
  return {
    id: p.id,
    name: p.name,
    persona: "talent",
    roles: p.roles,
    headline: p.headline,
    bio: `${role} based in ${p.location}. ${p.followers} followers on Kaledio. Available for the right project — let's make something worth watching.`,
    location: p.location,
    availability: p.availability,
    yearsExp: 6,
    skills,
    credits: [
      { id: "mc1", role: `Lead ${role}`, project: "Half Light", kind: "Feature Film", year: "2025", note: "MAMI Official Selection" },
      { id: "mc2", role: role, project: "Saltwater S2", kind: "OTT Series", year: "2024" },
      { id: "mc3", role: role, project: "Peppermint — 'Dhaaga'", kind: "Music Video", year: "2023", note: "62M views" },
    ],
    portfolio: [
      m("mp1", "Half Light", "FEATURE · STILL", "2025", "midnight"),
      m("mp2", "Saltwater S2", "OTT SERIES", "2024", "steel", "tall"),
      m("mp3", "Dhaaga", "MUSIC VIDEO", "2023", "dusk"),
      m("mp4", "Editorial", "STILL", "2024", "porcelain", "tall"),
    ],
    reelTitle: `${role} Reel — 2025`,
    reelDuration: "2:24",
    connections: p.connections,
    hue: p.hue,
    avatarUrl: "",
    connectionStatus: "none",
  };
}
