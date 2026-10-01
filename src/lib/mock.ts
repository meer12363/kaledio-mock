// ─────────────────────────────────────────────────────────────
// Mock UI data. Purely for the front-end experience while the
// backend is empty — pages fall back to this so everything feels
// alive. No external images: avatars are initials, media is the
// offline gradient MediaPlaceholder.
// ─────────────────────────────────────────────────────────────

import type { ClipId } from "./clips";
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
    castingTitle: "Saltwater S3, 4 recurring roles",
    castingMeta: "OTT Series · Goa · closes Oct 20",
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
    clip: "cosmos-eye",
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
    clip: "tears-bridge",
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
    castingTitle: "Peppermint MV, 8 dancers",
    castingMeta: "Music Video · Hyderabad · closes Oct 14",
    castingCallId: "mock-call-4",
  },
  {
    id: "mock-7",
    author: author("kabir-mehta"),
    kind: "trailer",
    timeAgo: "2d",
    text: "'Dhaaga' crossed 62 million views 🎉 Two years since we shot it in one rained-out night in Alibaug. Dev kept saying 'the weather IS the video'. He was right.",
    media: m("mm7", "Peppermint — 'Dhaaga'", "MUSIC VIDEO", "2023", "dusk"),
    clip: "cosmos-field",
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
  /** display date */
  deadline: string;
  /** machine date for countdowns (YYYY-MM-DD) */
  deadlineISO: string;
  tags: string[];
  applicants: number;
  postedAgo: string;
  tone: MediaTone;
  hot?: boolean;
  roles: number;
}

export const MOCK_CALLS: MockCall[] = [
  { id: "mock-call-1", title: "Saltwater S3: supporting cast (4)", company: "Hoiche Originals × Ashvattha", postedById: "ritika-nair", medium: "OTT Series", location: "Goa", compensation: "Union rates", deadline: "Oct 20", deadlineISO: "2026-10-20", tags: ["Recurring", "Paid", "Konkani"], applicants: 231, postedAgo: "1d", tone: "steel", hot: true, roles: 4 },
  { id: "mock-call-2", title: "Monsoon Chess: female lead, 28 to 38", company: "Ashvattha Films", postedById: "ritika-nair", medium: "Feature Film", location: "Mumbai", compensation: "₹12L for 42 days", deadline: "Oct 28", deadlineISO: "2026-10-28", tags: ["Lead", "Paid", "Festival"], applicants: 148, postedAgo: "3d", tone: "midnight", hot: true, roles: 2 },
  { id: "mock-call-3", title: "Two faces, 25 to 35, for a skincare ad", company: "Auréa / Bloomfield", postedById: "meher-kapoor", medium: "Ad Film", location: "Mumbai", compensation: "₹1.5L + usage", deadline: "Oct 9", deadlineISO: "2026-10-09", tags: ["Commercial", "Paid"], applicants: 312, postedAgo: "5d", tone: "porcelain", roles: 2 },
  { id: "mock-call-4", title: "8 dancers and an assistant choreographer", company: "Peppermint / Studio Vermilion", postedById: "sana-iyer", medium: "Music Video", location: "Hyderabad", compensation: "₹18k a day", deadline: "Oct 14", deadlineISO: "2026-10-14", tags: ["Dance", "Paid"], applicants: 96, postedAgo: "2d", tone: "dusk", roles: 9 },
  { id: "mock-call-5", title: "Crosswind reboot: negative lead, 35 to 50", company: "Sterling Television", postedById: "vikram-sethi", medium: "TV Series", location: "Mumbai", compensation: "Monthly contract", deadline: "Nov 2", deadlineISO: "2026-11-02", tags: ["TV", "Paid", "Lead"], applicants: 119, postedAgo: "4d", tone: "noir", roles: 1 },
  { id: "mock-call-6", title: "DoP for the festival short Ledger", company: "Turmeric Pictures", postedById: "vikram-sethi", medium: "Short Film", location: "Mumbai", compensation: "₹1.8L for 8 days", deadline: "Oct 18", deadlineISO: "2026-10-18", tags: ["Crew", "Paid", "Night shoot"], applicants: 41, postedAgo: "8h", tone: "midnight", hot: true, roles: 1 },
  { id: "mock-call-7", title: "The Paper Kite 2: voice cast (3)", company: "Lantern Animation", postedById: "ritika-nair", medium: "Feature Film", location: "Remote / Chennai", compensation: "Session rates", deadline: "Nov 12", deadlineISO: "2026-11-12", tags: ["Voice", "Paid", "Remote"], applicants: 74, postedAgo: "12h", tone: "sky", roles: 3 },
  { id: "mock-call-8", title: "Gulmohar Lane revival: ensemble (6)", company: "Aranya Theatre Collective", postedById: "vikram-sethi", medium: "Theatre", location: "Mumbai", compensation: "Per show + stipend", deadline: "Nov 5", deadlineISO: "2026-11-05", tags: ["Theatre", "Open audition"], applicants: 187, postedAgo: "6d", tone: "dusk", roles: 6 },
];

/** the extra call sheet fields a casting detail page needs */
export interface MockCallDetail {
  shootDates: string;
  description: string;
  requiresAudition: boolean;
  lookingFor: Array<{ name: string; brief: string }>;
  requirements: string[];
}

export const MOCK_CALL_DETAILS: Record<string, MockCallDetail> = {
  "mock-call-1": {
    shootDates: "Dec 1 to Mar 15", requiresAudition: true,
    description: "Season three goes back to the fishing village. We need four faces who feel like they've lived there their whole lives. Konkani is a big plus. Small parts that come back every episode.",
    lookingFor: [
      { name: "Bosco, 50s", brief: "Owns the boat. Says very little, notices everything." },
      { name: "Rita, 30s", brief: "Runs the fish stall. Loud, warm, funny, nobody's fool." },
      { name: "Twins, 19", brief: "Real siblings preferred. Restless, want out of the village." },
    ],
    requirements: ["Self tape of scene 7 (sides in your inbox after you apply)", "Slate with name, height and city", "Recent unfiltered photos"],
  },
  "mock-call-2": {
    shootDates: "Jan 6 to Feb 17", requiresAudition: true,
    description: "Nalini is a chess coach in a small Konkan town who gets pulled into a tournament she swore off. It's a quiet film. We want someone who can hold the frame without saying much.",
    lookingFor: [
      { name: "Nalini, 28 to 38", brief: "Lead. Sharp, private, funny when she lets herself be." },
      { name: "Aai, 60s", brief: "Her mother. Two scenes, both big ones." },
    ],
    requirements: ["Self tape of the kitchen scene", "Showreel link if you have one", "Marathi or Konkani is a plus"],
  },
  "mock-call-3": {
    shootDates: "Oct 21 to 22", requiresAudition: false,
    description: "Two day shoot for a skincare brand. Natural, no heavy makeup looks. Close ups, so we'll be looking at skin texture and how you hold a look.",
    lookingFor: [{ name: "Two faces, 25 to 35", brief: "Any gender. Comfortable with very close camera." }],
    requirements: ["Three clean photos, no filters", "Your usage fee expectations"],
  },
  "mock-call-4": {
    shootDates: "Oct 26 to 27", requiresAudition: true,
    description: "Flooded warehouse, ankle deep water, one long take. We want dancers who stay grounded and don't panic when the floor is wet.",
    lookingFor: [
      { name: "Dancers (8)", brief: "Contemporary and street. Strong floor work." },
      { name: "Assistant choreographer", brief: "Has run rehearsals for a music video before." },
    ],
    requirements: ["60 second movement tape", "Say if you're fine working in water"],
  },
  "mock-call-5": {
    shootDates: "Nov 20 onwards", requiresAudition: true,
    description: "The reboot needs a villain people love to hate. Daily soap pace, so you need to learn lines fast and stay consistent across months.",
    lookingFor: [{ name: "Raghav, 35 to 50", brief: "Smooth, charming, dangerous. Never raises his voice." }],
    requirements: ["Self tape of the confrontation scene", "Past TV credits"],
  },
  "mock-call-6": {
    shootDates: "Nov 8 to 15", requiresAudition: false,
    description: "Festival short, mostly night exteriors in old Mumbai. Small crew, one light van. We want a DoP who loves available light and moves fast.",
    lookingFor: [{ name: "Director of Photography", brief: "Owns or can arrange a cinema camera package." }],
    requirements: ["Link to your reel", "Two frames you're proud of", "Day rate"],
  },
  "mock-call-7": {
    shootDates: "Recording in December", requiresAudition: true,
    description: "Animated sequel. Recording from home is fine if you have a clean setup. Kids and adults both watch this one, so range matters.",
    lookingFor: [
      { name: "Kite, any age", brief: "The hero. Bright, cheeky, a bit too brave." },
      { name: "Old Crow", brief: "Grumpy narrator. Deep voice, dry humour." },
      { name: "Twins", brief: "Two voices from one actor. Fast switching." },
    ],
    requirements: ["Voice sample, 30 to 60 seconds", "Your mic setup"],
  },
  "mock-call-8": {
    shootDates: "Rehearsals from Nov 15", requiresAudition: true,
    description: "Revival of the Gulmohar Lane play with a new cast. Six weeks of rehearsal, then a run across Mumbai venues. Theatre folks, this one's yours.",
    lookingFor: [{ name: "Ensemble (6)", brief: "Comfortable singing a little and doubling up roles." }],
    requirements: ["Open audition at Prithvi, Nov 8", "Or a self tape of the monologue"],
  },
};

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

// ───────── reels (vertical, scrollable) ─────────

export interface Reel {
  id: string;
  kind: "casting" | "bts" | "premiere" | "live" | "creator" | "audition";
  badge: string;
  title: string;
  caption: string;
  creatorId: string;
  audio: string;
  likes: number;
  comments: number;
  shares: number;
  /** three colours for the animated "footage" gradient */
  palette: [string, string, string];
  /** the hero prop floating in the frame */
  prop: string;
  /** real footage playing in the frame */
  clip: ClipId;
  /** subtitle-style line burned into the frame */
  subtitle: string;
  cta?: { label: string; href: string };
}

export const MOCK_REELS: Reel[] = [
  {
    id: "reel-1", kind: "live", badge: "LIVE", title: "Casting AMA — ask me anything",
    caption: "Self-tapes, slating, what makes me stop scrolling. Drop your questions 👇 #casting #selftape",
    creatorId: "ritika-nair", audio: "Live audio · Ritika Nair", likes: 4210, comments: 612, shares: 188,
    palette: ["#1b0f3d", "#6a1b9a", "#ff4f7b"], clip: "tears-bridge", prop: "🎙️", subtitle: "“Slate your height. Always.”",
    cta: { label: "Join the room", href: "/casting" },
  },
  {
    id: "reel-2", kind: "casting", badge: "CASTING", title: "Saltwater S3 is casting 4 roles",
    caption: "Goa. August. Konkani speakers, this one's yours. Tape scene 7 and slate your height 🌊 #nowcasting",
    creatorId: "ritika-nair", audio: "Saltwater — Main Titles · Nikhil Bhandari", likes: 8932, comments: 1204, shares: 902,
    palette: ["#04162b", "#0e4c7a", "#3ddc97"], clip: "sintel-snow", prop: "🌊", subtitle: "4 recurring roles · closes Oct 20",
    cta: { label: "Apply now", href: "/casting" },
  },
  {
    id: "reel-3", kind: "bts", badge: "BTS", title: "One bulb. One bounce. Magic.",
    caption: "Day 40 on Half Light — this whole scene was lit with a single practical. Light is dialogue 🎥",
    creatorId: "kabir-mehta", audio: "original sound · Kabir Mehta", likes: 12840, comments: 733, shares: 1450,
    palette: ["#140a02", "#7a3b06", "#ffb13b"], clip: "elephants-machine", prop: "💡", subtitle: "INT. KITCHEN — NIGHT",
  },
  {
    id: "reel-4", kind: "premiere", badge: "PREMIERE", title: "Half Light premieres tonight",
    caption: "Three years. Eleven drafts. One night. See you at MAMI ✨ #HalfLight #premiere",
    creatorId: "dev-malhotra", audio: "Half Light — Suite · Nikhil Bhandari", likes: 21304, comments: 2210, shares: 3102,
    palette: ["#0b0b1f", "#2b1c6b", "#c94ad8"], clip: "sintel-dragon", prop: "🎬", subtitle: "MAMI Official Selection 2025",
    cta: { label: "Get tickets", href: "/home" },
  },
  {
    id: "reel-5", kind: "audition", badge: "AUDITION", title: "60-second movement tape",
    caption: "Groundedness over tricks. The water eats anything jumpy 💃 Tag a dancer who isn't afraid to get wet",
    creatorId: "sana-iyer", audio: "Dhaaga (Sped Up) · Zoya Qureshi", likes: 6120, comments: 488, shares: 377,
    palette: ["#1a0314", "#8a1450", "#ff9410"], clip: "spring-forest", prop: "💃", subtitle: "8 dancer spots · Hyderabad",
    cta: { label: "Grab a spot", href: "/casting" },
  },
  {
    id: "reel-6", kind: "creator", badge: "RISING", title: "From runway to her first lead",
    caption: "Campaigns → scene study → my first feature audition. Scared? Obviously. Doing it anyway 🦋",
    creatorId: "meher-kapoor", audio: "Glow · Zoya Qureshi", likes: 18450, comments: 1532, shares: 2044,
    palette: ["#1f0b1b", "#b8327a", "#ffd1a3"], clip: "cosmos-field", prop: "🦋", subtitle: "56k followers · Dubai",
  },
  {
    id: "reel-7", kind: "bts", badge: "STUDIO", title: "Scratch vocals at 2am",
    caption: "Director approved take two. The 24-hour turnaround lives another week 🎧",
    creatorId: "zoya-qureshi", audio: "Raat Bhar (demo) · Zoya Qureshi", likes: 5320, comments: 290, shares: 211,
    palette: ["#050d1c", "#123b6e", "#7ab5f5"], clip: "llama-cliff", prop: "🎧", subtitle: "Home studio · Hyderabad",
  },
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
