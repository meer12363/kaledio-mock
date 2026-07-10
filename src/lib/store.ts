import type {
  ApplicationStatus,
  CastingCall,
  Conversation,
  MediaItem,
  Message,
  MyApplication,
  MyListing,
  Person,
  Post,
} from "./types";

// In-memory store. Resets when the dev server restarts — fine for the MVP.

const m = (
  id: string,
  title: string,
  kind: string,
  year: string,
  tone: MediaItem["tone"],
  aspect: MediaItem["aspect"] = "wide"
): MediaItem => ({ id, title, kind, year, tone, aspect });

export const people: Person[] = [
  {
    id: "aanya-sharma",
    name: "Aanya Sharma",
    persona: "talent",
    roles: ["Actor"],
    headline: "Actor — features, OTT & ad film | Hindi · English · Marathi",
    bio: "Trained at Drama School Mumbai. Two features, a streaming series and forty-odd ad films later, I'm still chasing parts that scare me a little.",
    location: "Mumbai",
    availability: "open",
    yearsExp: 6,
    skills: ["Method acting", "Improv", "Kathak (trained)", "Horse riding", "Marathi dialects", "Screen combat"],
    credits: [
      { id: "c1", role: "Lead — 'Noor'", project: "Half Light", kind: "Feature Film", year: "2025", note: "Dir. Dev Malhotra · MAMI Official Selection" },
      { id: "c2", role: "Recurring — 'Kiran Rane'", project: "Saltwater", kind: "OTT Series", year: "2024", note: "8 episodes, streaming on Hoiche" },
      { id: "c3", role: "Principal", project: "Aurus Bank — 'First Salary'", kind: "Ad Film", year: "2024", note: "National TVC, 3 spots" },
      { id: "c4", role: "Ensemble — 'Chandni'", project: "Gulmohar Lane", kind: "Theatre", year: "2022", note: "Prithvi Theatre, 40 shows" },
    ],
    portfolio: [
      m("p1", "Half Light", "FEATURE · STILL", "2025", "midnight"),
      m("p2", "Saltwater S1", "OTT SERIES", "2024", "steel"),
      m("p3", "Monologue — Agnes of God", "SELF TAPE", "2025", "noir", "tall"),
      m("p4", "Aurus Bank TVC", "AD FILM", "2024", "sky"),
      m("p5", "Editorial — Verve", "STILL", "2023", "porcelain", "tall"),
      m("p6", "Gulmohar Lane", "THEATRE", "2022", "dusk"),
    ],
    reelTitle: "Acting Reel — 2025",
    reelDuration: "2:47",
    connections: 512,
    hue: 0,
  },
  {
    id: "kabir-mehta",
    name: "Kabir Mehta",
    persona: "creative",
    roles: ["Cinematographer"],
    headline: "Director of Photography | Alexa 35 · anamorphic · available for features",
    bio: "DoP with a soft spot for practical light and handheld intimacy. Shot two features, a series for Hoiche, and more ad film than I'd like to admit.",
    location: "London",
    availability: "booked",
    yearsExp: 11,
    skills: ["Alexa 35", "Anamorphic", "Handheld", "Underwater unit", "DaVinci grade supervision", "Gaffer background"],
    credits: [
      { id: "c1", role: "DoP", project: "Half Light", kind: "Feature Film", year: "2025" },
      { id: "c2", role: "DoP", project: "Saltwater S1–S2", kind: "OTT Series", year: "2024" },
      { id: "c3", role: "DoP", project: "Peppermint — 'Dhaaga'", kind: "Music Video", year: "2023", note: "62M views" },
    ],
    portfolio: [
      m("p1", "Half Light", "FEATURE · FRAME", "2025", "midnight"),
      m("p2", "Dhaaga", "MUSIC VIDEO", "2023", "dusk"),
      m("p3", "Saltwater S2", "OTT SERIES", "2024", "steel"),
      m("p4", "Monsoon tests — 40mm", "CAMERA TEST", "2025", "noir"),
    ],
    reelTitle: "Cinematography Reel — 2025",
    reelDuration: "3:12",
    connections: 883,
    hue: 1,
  },
  {
    id: "ritika-nair",
    name: "Ritika Nair",
    persona: "production",
    roles: ["Casting Director"],
    headline: "Casting Director, Meraki Casting | features · OTT · ad film",
    bio: "Fifteen years of finding the right face for the part. Cast three of last year's top streaming originals. Always watching self-tapes — send good sound.",
    location: "Mumbai",
    availability: "open",
    yearsExp: 15,
    skills: ["Feature casting", "Street casting", "Child artist casting", "Dialect coaching network", "Union paperwork"],
    credits: [
      { id: "c1", role: "Casting Director", project: "Saltwater S1–S2", kind: "OTT Series", year: "2024" },
      { id: "c2", role: "Casting Director", project: "Half Light", kind: "Feature Film", year: "2025" },
      { id: "c3", role: "Casting Director", project: "120 ad films", kind: "Ad Film", year: "2010–now" },
    ],
    portfolio: [
      m("p1", "Saltwater — ensemble", "CASTING", "2024", "steel"),
      m("p2", "Half Light", "CASTING", "2025", "midnight"),
      m("p3", "Meraki open-call day", "BTS", "2025", "porcelain"),
    ],
    reelTitle: "Casting Showcase — 2025",
    reelDuration: "1:58",
    connections: 2140,
    hue: 2,
  },
  {
    id: "dev-malhotra",
    name: "Dev Malhotra",
    persona: "creative",
    roles: ["Director", "Writer"],
    headline: "Director — 'Half Light' (MAMI '25) | developing second feature",
    bio: "I make small films about big feelings. First feature premiered at MAMI; writing the next one in a Goa shack on borrowed money and strong coffee.",
    location: "Delhi",
    availability: "listening",
    yearsExp: 9,
    skills: ["Direction", "Screenwriting", "Actor workshops", "Pitch decks", "Festival strategy"],
    credits: [
      { id: "c1", role: "Director / Writer", project: "Half Light", kind: "Feature Film", year: "2025", note: "MAMI Official Selection" },
      { id: "c2", role: "Director", project: "Peppermint — 'Dhaaga'", kind: "Music Video", year: "2023" },
      { id: "c3", role: "Staff Writer", project: "Crosswind", kind: "TV Series", year: "2019–21" },
    ],
    portfolio: [
      m("p1", "Half Light", "FEATURE", "2025", "midnight"),
      m("p2", "Dhaaga", "MUSIC VIDEO", "2023", "dusk"),
      m("p3", "Monsoon Chess — lookbook", "IN DEVELOPMENT", "2026", "porcelain", "tall"),
    ],
    reelTitle: "Director's Reel — 2025",
    reelDuration: "4:05",
    connections: 1290,
    hue: 3,
  },
  {
    id: "zoya-qureshi",
    name: "Zoya Qureshi",
    persona: "talent",
    roles: ["Singer", "Voice Artist"],
    headline: "Playback singer & VO artist | Hindi · Urdu · Telugu | home studio",
    bio: "Voice behind three chart hooks you've hummed without knowing my name. Treated home studio, 24-hour turnaround on scratch vocals.",
    location: "Hyderabad",
    availability: "open",
    yearsExp: 7,
    skills: ["Playback", "Harmonies", "Ghazal", "VO — commercials", "Dubbing", "Logic Pro"],
    credits: [
      { id: "c1", role: "Playback — 'Raat Bhar'", project: "Saltwater OST", kind: "OTT Series", year: "2024" },
      { id: "c2", role: "Featured vocals", project: "Peppermint — 'Dhaaga'", kind: "Music Video", year: "2023" },
      { id: "c3", role: "Brand voice", project: "Meridian Airlines", kind: "Ad Campaign", year: "2024–now" },
    ],
    portfolio: [
      m("p1", "Raat Bhar", "PLAYBACK", "2024", "dusk", "square"),
      m("p2", "Dhaaga", "FEATURED VOCAL", "2023", "midnight", "square"),
      m("p3", "VO Sampler", "COMMERCIAL VO", "2025", "sky", "square"),
    ],
    reelTitle: "Vocal & VO Reel — 2025",
    reelDuration: "2:15",
    connections: 431,
    hue: 4,
  },
  {
    id: "meher-kapoor",
    name: "Meher Kapoor",
    persona: "talent",
    roles: ["Model", "Actor"],
    headline: "Model & actor | print · runway · ad film | 5'9\"",
    bio: "Campaigns for two beauty majors and a fintech that made my grandmother proud. Moving into acting — currently in scene-study class and loving it.",
    location: "Dubai",
    availability: "open",
    yearsExp: 4,
    skills: ["Runway", "Print", "Ad film", "Scene study", "Yoga (advanced)", "French (conversational)"],
    credits: [
      { id: "c1", role: "Face of campaign", project: "Auréa Skincare", kind: "Ad Campaign", year: "2025" },
      { id: "c2", role: "Principal", project: "Aurus Bank — 'First Salary'", kind: "Ad Film", year: "2024" },
      { id: "c3", role: "Runway", project: "Lakmé Fashion Week", kind: "Runway", year: "2023–25" },
    ],
    portfolio: [
      m("p1", "Auréa — Campaign", "PRINT", "2025", "porcelain", "tall"),
      m("p2", "LFW — Amit Aggarwal", "RUNWAY", "2025", "noir", "tall"),
      m("p3", "Aurus Bank TVC", "AD FILM", "2024", "sky"),
      m("p4", "Test — natural light", "STILL", "2025", "dusk", "tall"),
    ],
    reelTitle: "Model Portfolio Reel — 2025",
    reelDuration: "1:32",
    connections: 350,
    hue: 5,
  },
  {
    id: "sana-iyer",
    name: "Sana Iyer",
    persona: "talent",
    roles: ["Dancer"],
    headline: "Dancer & choreographer | contemporary · hip-hop · bharatanatyam base",
    bio: "Company dancer turned choreographer. Set movement for two music videos and an award-show opener. I teach Sundays — come sweat.",
    location: "Anna Nagar, Chennai",
    availability: "listening",
    yearsExp: 8,
    skills: ["Contemporary", "Hip-hop", "Bharatanatyam", "Choreography", "Movement direction", "Aerial (basic)"],
    credits: [
      { id: "c1", role: "Choreographer", project: "Peppermint — 'Dhaaga'", kind: "Music Video", year: "2023" },
      { id: "c2", role: "Lead dancer", project: "SIMA Awards opener", kind: "Live Event", year: "2024" },
      { id: "c3", role: "Company dancer", project: "Terence Lewis Co.", kind: "Company", year: "2017–21" },
    ],
    portfolio: [
      m("p1", "Dhaaga — movement", "MUSIC VIDEO", "2023", "dusk"),
      m("p2", "Studio session 44", "CHOREO", "2025", "noir", "square"),
      m("p3", "SIMA opener", "LIVE", "2024", "midnight"),
    ],
    reelTitle: "Movement Reel — 2025",
    reelDuration: "2:04",
    connections: 296,
    hue: 6,
  },
  {
    id: "vikram-sethi",
    name: "Vikram Sethi",
    persona: "production",
    roles: ["Producer", "Studio"],
    headline: "Producer, Ashvattha Films | 3 features · 2 series | co-pro friendly",
    bio: "We back first and second features with festival ambition and honest budgets. Slate of five; two shooting this year. Coffee's on me if the script is.",
    location: "Mumbai",
    availability: "open",
    yearsExp: 14,
    skills: ["Line producing", "Co-productions", "Festival sales", "OTT commissioning", "Budgeting"],
    credits: [
      { id: "c1", role: "Producer", project: "Half Light", kind: "Feature Film", year: "2025" },
      { id: "c2", role: "Producer", project: "Saltwater S1–S2", kind: "OTT Series", year: "2024" },
      { id: "c3", role: "Executive Producer", project: "Monsoon Chess", kind: "In Development", year: "2026" },
    ],
    portfolio: [
      m("p1", "Ashvattha slate", "STUDIO", "2026", "midnight"),
      m("p2", "Saltwater S2 — wrap", "BTS", "2025", "steel"),
      m("p3", "Half Light — premiere", "EVENT", "2025", "noir"),
    ],
    reelTitle: "Ashvattha Films — Sizzle",
    reelDuration: "1:45",
    connections: 3005,
    hue: 7,
  },
  {
    id: "tara-dsouza",
    name: "Tara D'Souza",
    persona: "creative",
    roles: ["Writer"],
    headline: "Screenwriter | features & limited series | represented by Firstline",
    bio: "Ex-journalist. I write crime that's really about family and comedies that are really about grief. Two scripts optioned, one shooting.",
    location: "Goa",
    availability: "open",
    yearsExp: 6,
    skills: ["Feature screenplays", "Limited series", "Writers' room", "Punch-up", "Konkani & Hindi dialogue"],
    credits: [
      { id: "c1", role: "Writer", project: "Monsoon Chess", kind: "Feature (pre-prod)", year: "2026" },
      { id: "c2", role: "Story editor", project: "Saltwater S2", kind: "OTT Series", year: "2025" },
      { id: "c3", role: "Writer", project: "'Tide Tables' — optioned", kind: "Limited Series", year: "2024" },
    ],
    portfolio: [
      m("p1", "Monsoon Chess", "SCREENPLAY", "2026", "porcelain", "square"),
      m("p2", "Tide Tables", "LIMITED SERIES", "2024", "steel", "square"),
    ],
    reelTitle: "Selected Pages — Reading",
    reelDuration: "3:40",
    connections: 618,
    hue: 8,
  },
  {
    id: "nikhil-bhandari",
    name: "Nikhil Bhandari",
    persona: "creative",
    roles: ["Composer"],
    headline: "Film composer | orchestral + electronic | Dolby Atmos room",
    bio: "Scores for two features and a series. I like themes you can whistle and low-end you can feel. Atmos mix room in Burbank.",
    location: "Los Angeles",
    availability: "booked",
    yearsExp: 10,
    skills: ["Orchestration", "Sound design", "Atmos mixing", "Live strings contracting", "Trailer music"],
    credits: [
      { id: "c1", role: "Composer", project: "Half Light", kind: "Feature Film", year: "2025" },
      { id: "c2", role: "Composer", project: "Saltwater S1–S2", kind: "OTT Series", year: "2024" },
      { id: "c3", role: "Additional music", project: "Crosswind", kind: "TV Series", year: "2020" },
    ],
    portfolio: [
      m("p1", "Half Light — suite", "SCORE", "2025", "midnight", "square"),
      m("p2", "Saltwater — main titles", "SCORE", "2024", "steel", "square"),
      m("p3", "Sketches Vol. 3", "DEMO", "2025", "dusk", "square"),
    ],
    reelTitle: "Score Reel — 2025",
    reelDuration: "2:58",
    connections: 742,
    hue: 9,
  },
  {
    id: "priya-venkat",
    name: "Priya Venkat",
    persona: "talent",
    roles: ["Voice Artist"],
    headline: "Voice artist | Tamil · Telugu · English | animation & dubbing",
    bio: "400+ episodes of dubbing, 3 animated features, one very popular talking owl. Source-connect ready.",
    location: "Chennai",
    availability: "open",
    yearsExp: 12,
    skills: ["Animation VO", "Dubbing direction", "IVR & e-learning", "Character range 8–80", "Source-Connect"],
    credits: [
      { id: "c1", role: "Lead voice — 'Mira'", project: "The Paper Kite", kind: "Animated Feature", year: "2024" },
      { id: "c2", role: "Dub director", project: "Saltwater (Tamil)", kind: "OTT Series", year: "2024" },
      { id: "c3", role: "Brand voice", project: "Southline Grocers", kind: "Ad Campaign", year: "2022–now" },
    ],
    portfolio: [
      m("p1", "The Paper Kite", "ANIMATION VO", "2024", "sky", "square"),
      m("p2", "Character sampler", "VO DEMO", "2025", "porcelain", "square"),
    ],
    reelTitle: "Voice Reel — 2025",
    reelDuration: "1:50",
    connections: 380,
    hue: 10,
  },
  {
    id: "rohan-chatterjee",
    name: "Rohan Chatterjee",
    persona: "talent",
    roles: ["Actor"],
    headline: "Theatre-first actor | Bengali · Hindi · English | now reading for screen",
    bio: "Twelve years on stage in Kolkata and Mumbai. Chekhov, Karnad, two hundred nights of 'Gulmohar Lane'. Screen is the new frontier.",
    location: "Kolkata",
    availability: "open",
    yearsExp: 12,
    skills: ["Stage acting", "Voice projection", "Bengali theatre", "Sword work", "Direction (assist)"],
    credits: [
      { id: "c1", role: "Lead — 'Amol'", project: "Gulmohar Lane", kind: "Theatre", year: "2019–23" },
      { id: "c2", role: "Supporting", project: "Crosswind", kind: "TV Series", year: "2021" },
      { id: "c3", role: "Vanya", project: "Uncle Vanya (Bengali)", kind: "Theatre", year: "2018" },
    ],
    portfolio: [
      m("p1", "Gulmohar Lane", "THEATRE", "2023", "dusk"),
      m("p2", "Uncle Vanya", "THEATRE", "2018", "noir", "tall"),
      m("p3", "Self tape — 'Saltwater'", "SELF TAPE", "2025", "steel", "tall"),
    ],
    reelTitle: "Stage-to-Screen Reel",
    reelDuration: "2:22",
    connections: 267,
    hue: 11,
  },
  {
    id: "ishaan-verma",
    name: "Ishaan Verma",
    persona: "creative",
    roles: ["Editor"],
    headline: "Editor | features · trailers · branded | Avid + Resolve",
    bio: "Cut one feature, forty commercials and more festival trailers than sleep. Structure nerd. I'll fight for your film in the timeline.",
    location: "Berlin",
    availability: "open",
    yearsExp: 8,
    skills: ["Avid", "Resolve", "Trailer editing", "Doc structure", "Sound-led cutting"],
    credits: [
      { id: "c1", role: "Editor", project: "Half Light", kind: "Feature Film", year: "2025" },
      { id: "c2", role: "Trailer editor", project: "Saltwater S2", kind: "OTT Series", year: "2025" },
      { id: "c3", role: "Editor", project: "Auréa Skincare campaign", kind: "Ad Film", year: "2025" },
    ],
    portfolio: [
      m("p1", "Half Light — trailer", "TRAILER", "2025", "midnight"),
      m("p2", "Saltwater S2 — teaser", "TEASER", "2025", "steel"),
      m("p3", "Auréa — 60s cut", "AD FILM", "2025", "porcelain"),
    ],
    reelTitle: "Editing Reel — 2025",
    reelDuration: "2:36",
    connections: 529,
    hue: 12,
  },
  {
    id: "lena-fernandes",
    name: "Lena Fernandes",
    persona: "production",
    roles: ["Agency"],
    headline: "Founder, Firstline Talent | representing 40 actors & 12 writers",
    bio: "Boutique agency with a simple filter: people we'd bet our own money on. We negotiate hard and answer the phone.",
    location: "New York",
    availability: "open",
    yearsExp: 13,
    skills: ["Talent representation", "Contract negotiation", "Packaging", "Brand deals", "Career strategy"],
    credits: [
      { id: "c1", role: "Agency", project: "Firstline Talent roster", kind: "Representation", year: "2014–now" },
      { id: "c2", role: "Packaging", project: "Tide Tables", kind: "Limited Series", year: "2024" },
    ],
    portfolio: [
      m("p1", "Firstline roster", "AGENCY", "2026", "porcelain", "square"),
      m("p2", "Tide Tables deal", "PACKAGING", "2024", "steel", "square"),
    ],
    reelTitle: "Firstline — Year in Review",
    reelDuration: "1:20",
    connections: 1980,
    hue: 13,
  },
];

export const castingCalls: CastingCall[] = [
  {
    id: "monsoon-chess-lead",
    title: "Female lead, 28–38 — indie feature 'Monsoon Chess'",
    company: "Ashvattha Films",
    postedById: "ritika-nair",
    medium: "Feature Film",
    location: "Mumbai",
    compensation: "Paid — ₹12L, 42 shoot days",
    shootDates: "Sep 15 – Nov 8, 2026",
    deadline: "Jul 28, 2026",
    deadlineISO: "2026-07-28",
    shootStartISO: "2026-09-15",
    requiresAudition: true,
    description:
      "Dev Malhotra's second feature. 'Nalini' is a district-level chess coach in coastal Maharashtra whose estranged daughter returns during the monsoon. The part carries the film — long takes, minimal dialogue, everything in the eyes. Marathi fluency is a genuine advantage; we will workshop for three weeks before camera.",
    lookingFor: [
      { name: "Nalini (Lead)", brief: "28–38, speaks Marathi & Hindi, comfortable with silence and 3-page single takes" },
      { name: "Asha (Supporting)", brief: "18–24, the daughter — swimmer's build, Konkani a plus" },
    ],
    requirements: [
      "Self-tape: scene 14 (sides provided on shortlist), 2 takes max",
      "Recent headshot + full-length, natural light",
      "3-week workshop attendance in Mumbai (paid)",
      "No concurrent commitments Sep–Nov 2026",
    ],
    tags: ["Lead role", "Paid", "Festival film", "Workshop"],
    applicants: 148,
    postedAgo: "3d",
  },
  {
    id: "saltwater-s3-supporting",
    title: "Supporting cast (4 roles) — OTT series 'Saltwater' S3",
    company: "Hoiche Originals × Ashvattha",
    postedById: "ritika-nair",
    medium: "OTT Series",
    location: "Goa",
    compensation: "Paid — per-day union rates",
    shootDates: "Aug – Dec 2026",
    deadline: "Jul 20, 2026",
    deadlineISO: "2026-07-20",
    shootStartISO: "2026-08-03",
    requiresAudition: true,
    description:
      "Season three of the coastal crime drama. Four new recurring roles across the season: a customs officer with a conscience, a shack owner who sees everything, a 19-year-old informer, and a Goan matriarch. Locals and Konkani speakers strongly encouraged.",
    lookingFor: [
      { name: "Customs Officer D'Cunha", brief: "40–55, weary authority, 12 episodes" },
      { name: "Shack owner 'Baba'", brief: "50+, Konkani speaker, 8 episodes" },
      { name: "Informer", brief: "18–22, any gender, bike license required" },
      { name: "Matriarch Philomena", brief: "60+, commanding, 6 episodes" },
    ],
    requirements: [
      "Self-tape with slate: name, height, location",
      "Availability across Aug–Dec (non-consecutive blocks)",
      "Goa-based artists get priority for fitting sessions",
    ],
    tags: ["Recurring", "Paid", "OTT", "Konkani"],
    applicants: 231,
    postedAgo: "1d",
  },
  {
    id: "aurea-campaign-faces",
    title: "Two faces, 25–35 — national skincare campaign",
    company: "Auréa / Bloomfield Advertising",
    postedById: "lena-fernandes",
    medium: "Ad Film",
    location: "London",
    compensation: "Paid — £4,000 + usage, 2 shoot days",
    shootDates: "Jul 24–25, 2026",
    deadline: "Jul 15, 2026",
    deadlineISO: "2026-07-15",
    shootStartISO: "2026-07-24",
    requiresAudition: false,
    description:
      "TVC + print for Auréa's summer range. Looking for two faces with warm, unretouched-looking skin and easy laughter — the brief literally says 'people you'd trust with your house keys'. One day studio, one day South Bank at dawn.",
    lookingFor: [
      { name: "Face A", brief: "25–32, femme-presenting, comfortable on camera without makeup" },
      { name: "Face B", brief: "28–35, masc-presenting, runner's energy" },
    ],
    requirements: [
      "Digitals shot on phone — no filters",
      "Skin close-up in daylight",
      "Usage: 18 months, India + digital worldwide",
    ],
    tags: ["Commercial", "Paid", "Print + TVC"],
    applicants: 312,
    postedAgo: "5d",
  },
  {
    id: "peppermint-dancers",
    title: "8 dancers + assistant choreographer — Peppermint music video",
    company: "Peppermint / Studio Vermilion",
    postedById: "vikram-sethi",
    medium: "Music Video",
    location: "Hyderabad",
    compensation: "Paid — ₹18k/day, 4 days + rehearsal",
    shootDates: "Aug 2–6, 2026",
    deadline: "Jul 22, 2026",
    deadlineISO: "2026-07-22",
    shootStartISO: "2026-08-02",
    requiresAudition: true,
    description:
      "New single from Peppermint, choreography led by Sana Iyer. Contemporary-meets-hip-hop vocabulary in a flooded warehouse set (yes, ankle-deep water — bring a sense of humour). Two days rehearsal in Hyderabad, paid.",
    lookingFor: [
      { name: "Company dancers ×8", brief: "Strong contemporary base, hip-hop comfort, any gender" },
      { name: "Assistant choreographer", brief: "2+ years set experience, notation skills" },
    ],
    requirements: [
      "60-second movement tape to the reference track (link on application)",
      "Full availability Aug 1–6 incl. travel",
      "Comfortable working in water",
    ],
    tags: ["Dance", "Paid", "Music video"],
    applicants: 96,
    postedAgo: "2d",
  },
  {
    id: "gulmohar-lane-revival",
    title: "Ensemble (6) — 'Gulmohar Lane' 10th-anniversary revival",
    company: "Aranya Theatre Collective",
    postedById: "vikram-sethi",
    medium: "Theatre",
    location: "Mumbai",
    compensation: "Paid — per-show + rehearsal stipend",
    shootDates: "Rehearsals Sep; runs Oct–Dec 2026",
    deadline: "Aug 5, 2026",
    deadlineISO: "2026-08-05",
    shootStartISO: "2026-09-01",
    requiresAudition: true,
    description:
      "The play that launched a dozen careers returns to Prithvi. We're recasting the ensemble from scratch — six parts, ages 20 to 70. Open auditions over two weekends; bring a two-minute piece in any language, then we'll read from the text.",
    lookingFor: [
      { name: "Ensemble ×6", brief: "20–70, stage stamina for 40+ shows, Hindi/English/Marathi text" },
    ],
    requirements: [
      "2-minute prepared piece, any language",
      "Full evening availability Oct–Dec",
      "Prior stage experience (college theatre counts)",
    ],
    tags: ["Theatre", "Paid", "Open audition"],
    applicants: 187,
    postedAgo: "6d",
  },
  {
    id: "paper-kite-2-voices",
    title: "Voice cast (3) — animated feature 'The Paper Kite 2'",
    company: "Lantern Animation",
    postedById: "ritika-nair",
    medium: "Feature Film",
    location: "Remote / Chennai",
    compensation: "Paid — session rates, ~20 sessions",
    shootDates: "Sessions from Sep 2026",
    deadline: "Aug 12, 2026",
    deadlineISO: "2026-08-12",
    shootStartISO: "2026-09-07",
    requiresAudition: true,
    description:
      "Sequel to the award-winning animated feature. Recording in Hindi and Tamil simultaneously — bilingual artists can read for both. Remote sessions accepted via Source-Connect for shortlisted artists outside Chennai.",
    lookingFor: [
      { name: "'Mira' (returning, recast)", brief: "Female-reading voice, plays 12, Hindi + Tamil ideal" },
      { name: "'The Kitemaker'", brief: "60+, textured, unhurried" },
      { name: "'Bulbul'", brief: "Comic sidekick, elastic range, sings a little" },
    ],
    requirements: [
      "1-minute character demo (script provided)",
      "Treated recording space or Chennai studio availability",
      "Singing sample optional but loved",
    ],
    tags: ["Voice", "Paid", "Animation", "Remote OK"],
    applicants: 74,
    postedAgo: "12h",
  },
  {
    id: "crosswind-negative-lead",
    title: "Negative lead, 35–50 — prime-time series 'Crosswind' reboot",
    company: "Sterling Television",
    postedById: "lena-fernandes",
    medium: "TV Series",
    location: "Mumbai (Film City)",
    compensation: "Paid — monthly contract, 22 days/month",
    shootDates: "On floor from Sep 2026, 9-month arc",
    deadline: "Jul 30, 2026",
    deadlineISO: "2026-07-30",
    shootStartISO: "2026-09-01",
    requiresAudition: true,
    description:
      "The beloved aviation drama returns, and it needs a villain the audience loves to hate. A corporate raider circling the family airline. Long-arc television: consistency, stamina, and the ability to make a monologue land at 7am matter more than anything.",
    lookingFor: [
      { name: "'Ranveer Oberoi'", brief: "35–50, polished menace, fluent Hindi, TV discipline" },
    ],
    requirements: [
      "Self-tape: provided monologue, one continuous take",
      "Mumbai-based or willing to relocate",
      "9-month exclusivity for the arc",
    ],
    tags: ["TV", "Paid", "Long arc", "Lead"],
    applicants: 119,
    postedAgo: "4d",
  },
  {
    id: "festival-short-dop",
    title: "Cinematographer — NFDC-backed festival short 'Ledger'",
    company: "Turmeric Pictures",
    postedById: "vikram-sethi",
    medium: "Short Film",
    location: "Delhi",
    compensation: "Paid — ₹1.8L project fee, 8 days",
    shootDates: "Oct 10–17, 2026",
    deadline: "Aug 20, 2026",
    deadlineISO: "2026-08-20",
    shootStartISO: "2026-10-10",
    requiresAudition: false,
    description:
      "22-minute short about a night accountant in Old Delhi, shooting entirely between 10pm and 5am. We want available-light confidence and a documentary spine. Camera package (Alexa Mini + Cooke SP3) already locked. Director is a two-time festival alum.",
    lookingFor: [
      { name: "Director of Photography", brief: "Night-exterior experience, small-crew temperament" },
    ],
    requirements: [
      "Reel with night/low-light work",
      "8 consecutive nights in Delhi, Oct 10–17",
      "One prep week (remote OK)",
    ],
    tags: ["Crew", "Paid", "Short film", "Night shoot"],
    applicants: 41,
    postedAgo: "8h",
  },
  {
    id: "north-circular-supporting",
    title: "Supporting cast (3) — limited series 'North Circular'",
    company: "Palimpsest Pictures",
    postedById: "lena-fernandes",
    medium: "OTT Series",
    location: "London",
    compensation: "Paid — UK Equity rates",
    shootDates: "Oct 5 – Dec 12, 2026",
    deadline: "Aug 3, 2026",
    deadlineISO: "2026-08-03",
    shootStartISO: "2026-10-05",
    requiresAudition: true,
    description:
      "Six-part limited series about three generations of a Gujarati family running a 24-hour café on London's North Circular. We're casting three supporting roles and want faces the camera hasn't memorised yet. South Asian diaspora actors strongly encouraged; London-based preferred, but we'll fly the right person.",
    lookingFor: [
      { name: "'Bharat' — the uncle", brief: "45–60, dry comic timing, Gujarati or Hindi a plus" },
      { name: "'Dee' — night-shift regular", brief: "25–35, any gender, London accent" },
      { name: "'Mrs. Okafor'", brief: "50+, warmth with steel underneath" },
    ],
    requirements: [
      "Self-tape: provided sides, two takes max",
      "Right to work in the UK, or willingness to discuss visa sponsorship",
      "Availability across Oct–Dec (block shooting)",
    ],
    tags: ["Recurring", "Paid", "OTT", "Diaspora"],
    applicants: 164,
    postedAgo: "2d",
  },
  {
    id: "berlin-doc-editor",
    title: "Editor — feature documentary 'The Last Projectionist'",
    company: "Kino Herzog GmbH",
    postedById: "vikram-sethi",
    medium: "Documentary",
    location: "Berlin",
    compensation: "Paid — €9,000 project fee, 10 weeks",
    shootDates: "Post runs Aug 17 – Oct 23, 2026",
    deadline: "Jul 25, 2026",
    deadlineISO: "2026-07-25",
    shootStartISO: "2026-08-17",
    requiresAudition: false,
    description:
      "Feature doc about the last single-screen cinemas of Europe, 140 hours of footage across four countries. We need an editor who can find the film in the material — structure instincts matter more than software allegiance. Berlin edit suite provided; remote-hybrid possible after week two.",
    lookingFor: [
      { name: "Editor", brief: "Documentary feature experience, multilingual material (subtitled), patient with archives" },
    ],
    requirements: [
      "Reel or two full-length samples with doc structure work",
      "Two weeks on-site in Berlin to start",
      "Comfortable working from translated transcripts",
    ],
    tags: ["Crew", "Paid", "Documentary", "Hybrid"],
    applicants: 58,
    postedAgo: "1d",
  },
];

export const posts: Post[] = [
  {
    id: "post-1",
    authorId: "ritika-nair",
    kind: "casting",
    timeAgo: "1h",
    text: "Saltwater S3 casting is officially open — four recurring roles, shooting in Goa from August. We're prioritising Konkani speakers and Goa-based artists for fittings. Full brief and self-tape instructions on the call. Please, PLEASE slate your height.",
    likes: 214,
    comments: 38,
    castingCallId: "saltwater-s3-supporting",
  },
  {
    id: "post-2",
    authorId: "dev-malhotra",
    kind: "announcement",
    timeAgo: "3h",
    text: "Some personal news: 'Monsoon Chess' is fully financed. Ashvattha Films is producing, we shoot in September on the Konkan coast, and casting for Nalini begins this week. It took three years and eleven drafts. To everyone who read one of them — thank you.",
    media: m("pm2", "Monsoon Chess — first lookbook frame", "IN DEVELOPMENT", "2026", "porcelain"),
    likes: 892,
    comments: 127,
  },
  {
    id: "post-3",
    authorId: "ishaan-verma",
    kind: "trailer",
    timeAgo: "5h",
    text: "Locked the Saltwater S2 teaser at 4am. Sixty seconds, no dialogue, one wave. Sometimes the cut tells you when it's done — you just have to be awake to hear it.",
    media: m("pm3", "Saltwater S2 — Teaser", "TEASER · 0:60", "2026", "steel"),
    likes: 356,
    comments: 44,
  },
  {
    id: "post-4",
    authorId: "aanya-sharma",
    kind: "bts",
    timeAgo: "9h",
    text: "Day 40 of 42 on 'Half Light'. Kabir lit this entire scene with one practical bulb and a bounce board, and it's the best I've ever looked on camera. Hire cinematographers who treat light like dialogue.",
    media: m("pm4", "Half Light — Day 40", "BTS", "2025", "midnight"),
    likes: 641,
    comments: 72,
  },
  {
    id: "post-5",
    authorId: "sana-iyer",
    kind: "casting",
    timeAgo: "14h",
    text: "Choreographing the new Peppermint video and we need EIGHT dancers plus an assistant choreographer. Flooded warehouse, ankle-deep water, the most fun brief I've had in years. Movement tape details on the call — tag a dancer who isn't afraid to get wet.",
    likes: 178,
    comments: 51,
    castingCallId: "peppermint-dancers",
  },
  {
    id: "post-6",
    authorId: "vikram-sethi",
    kind: "announcement",
    timeAgo: "1d",
    text: "Ashvattha update: 'Half Light' has been invited to three international festivals we can't name yet, 'Saltwater' S3 is greenlit, and 'Monsoon Chess' shoots in September. Slate of five, two in production. We are reading scripts again from August 1.",
    likes: 1043,
    comments: 156,
  },
  {
    id: "post-7",
    authorId: "zoya-qureshi",
    kind: "bts",
    timeAgo: "1d",
    text: "Recorded scratch vocals for an animated feature at 2am from my home studio in Hyderabad, and the director approved take two. The 24-hour-turnaround reputation survives another week.",
    media: m("pm7", "Home studio — 2am session", "BTS", "2026", "dusk", "square"),
    likes: 233,
    comments: 29,
  },
  {
    id: "post-8",
    authorId: "lena-fernandes",
    kind: "announcement",
    timeAgo: "2d",
    text: "Firstline is opening its writer roster for the first time in two years. We rep 12 writers; we have room for 3 more. Features and limited series only. If your sample makes us miss a meeting, you're in.",
    likes: 467,
    comments: 88,
  },
  {
    id: "post-9",
    authorId: "kabir-mehta",
    kind: "trailer",
    timeAgo: "2d",
    text: "'Dhaaga' crossed 62 million views. Two years since we shot it in one rained-out night in Alibaug. Dev kept saying 'the weather IS the video'. He was right. Full video on the reel.",
    media: m("pm9", "Peppermint — 'Dhaaga'", "MUSIC VIDEO", "2023", "dusk"),
    likes: 1520,
    comments: 203,
  },
  {
    id: "post-10",
    authorId: "rohan-chatterjee",
    kind: "announcement",
    timeAgo: "3d",
    text: "After 200 nights of 'Gulmohar Lane' I said I'd never do it again. They're reviving it at Prithvi for the 10th anniversary and recasting the whole ensemble. I might audition for my own old part. Is that allowed? Asking for me.",
    likes: 389,
    comments: 95,
    castingCallId: "gulmohar-lane-revival",
  },
  {
    id: "post-11",
    authorId: "priya-venkat",
    kind: "casting",
    timeAgo: "3d",
    text: "The Paper Kite 2 is recording in Hindi AND Tamil simultaneously — bilingual voice artists, this is the gig you've been waiting for. Remote sessions accepted via Source-Connect. I dub-directed the Tamil track on part one; this team is a dream.",
    likes: 156,
    comments: 24,
    castingCallId: "paper-kite-2-voices",
  },
  {
    id: "post-12",
    authorId: "nikhil-bhandari",
    kind: "bts",
    timeAgo: "4d",
    text: "Recorded a 34-piece string section for the 'Half Light' finale today. There's a moment at bar 112 where the room went quiet after the take. That silence is why we do this.",
    media: m("pm12", "Half Light — string session", "SCORE · BTS", "2025", "noir"),
    likes: 578,
    comments: 61,
  },
];

export const conversations: Conversation[] = [
  {
    id: "conv-ritika",
    personId: "ritika-nair",
    unread: 2,
    lastActive: "12m",
    messages: [
      { id: "m1", from: "them", text: "Hi! Saw your profile come through on the Saltwater S3 search. Your self-tape setup looks solid.", time: "Tue 4:12 PM" },
      { id: "m2", from: "me", text: "Thank you Ritika! I've been following the series since S1 — would love to read for it.", time: "Tue 4:30 PM" },
      { id: "m3", from: "them", text: "Good. Two things: can you do a Konkani-accented Hindi, and are you free for a fitting in Goa the first week of August?", time: "Tue 5:02 PM" },
      { id: "m4", from: "me", text: "Yes to both — my grandmother is from Mapusa, the accent is basically free of charge.", time: "Tue 5:15 PM" },
      { id: "m5", from: "them", text: "Ha! Perfect. Sending sides tonight. Tape by Friday if you can.", time: "Today 9:41 AM" },
      { id: "m6", from: "them", text: "Sides sent — check your applications tab. Scene 7 and scene 19. Two takes max, natural light.", time: "Today 9:44 AM" },
    ],
  },
  {
    id: "conv-dev",
    personId: "dev-malhotra",
    unread: 0,
    lastActive: "2h",
    messages: [
      { id: "m1", from: "me", text: "Congratulations on Monsoon Chess getting financed! The lookbook frame you posted is gorgeous.", time: "Mon 11:20 AM" },
      { id: "m2", from: "them", text: "Thank you! Three years of nos and then two yeses in one week. The industry is a slot machine with feelings.", time: "Mon 12:05 PM" },
      { id: "m3", from: "me", text: "Ha! If you're doing workshop-based casting for Nalini I'd love to throw my hat in.", time: "Mon 12:11 PM" },
      { id: "m4", from: "them", text: "Apply through the call so Ritika sees you — but between us, tape scene 14 like it's a comedy. Everyone plays it sad. It isn't.", time: "Mon 2:47 PM" },
    ],
  },
  {
    id: "conv-lena",
    personId: "lena-fernandes",
    unread: 1,
    lastActive: "1d",
    messages: [
      { id: "m1", from: "them", text: "We're reviewing profiles for the Auréa campaign. Your grid caught the client's eye — the natural light stuff especially.", time: "Sun 6:30 PM" },
      { id: "m2", from: "me", text: "That's great to hear! The brief mentioned no-makeup digitals — happy to shoot those this week.", time: "Sun 7:12 PM" },
      { id: "m3", from: "them", text: "Do that. Phone camera, window light, no filters. Client wants 'trustworthy', whatever that looks like before coffee.", time: "Yesterday 10:05 AM" },
    ],
  },
  {
    id: "conv-sana",
    personId: "sana-iyer",
    unread: 0,
    lastActive: "3d",
    messages: [
      { id: "m1", from: "me", text: "The Peppermint brief sounds unhinged in the best way. Ankle-deep water??", time: "Fri 8:14 PM" },
      { id: "m2", from: "them", text: "Waist-deep for the finale, but we're not putting that in the call yet 😄 Are you tape-ing for it?", time: "Fri 8:40 PM" },
      { id: "m3", from: "me", text: "Cutting my movement tape this weekend. Any notes on what you want to see?", time: "Fri 8:52 PM" },
      { id: "m4", from: "them", text: "Groundedness over tricks. The water eats anything jumpy. Show me weight and control, sixty seconds, one take.", time: "Fri 9:30 PM" },
    ],
  },
];

// ————— the signed-in member's applications (talent/creative side) —————

export const myApplications: MyApplication[] = [
  {
    id: "app-saltwater",
    callId: "saltwater-s3-supporting",
    status: "audition_requested",
    appliedAgo: "5d ago",
    auditionDate: "Jul 18, 2026 · 11:00",
    auditionISO: "2026-07-18",
  },
  {
    id: "app-aurea",
    callId: "aurea-campaign-faces",
    status: "applied",
    appliedAgo: "3d ago",
  },
  {
    id: "app-gulmohar",
    callId: "gulmohar-lane-revival",
    status: "finalized",
    appliedAgo: "2w ago",
  },
  {
    id: "app-peppermint",
    callId: "peppermint-dancers",
    status: "rejected",
    appliedAgo: "1w ago",
  },
];

const appliedCalls = new Set<string>(myApplications.map((a) => a.callId));

export function applyToCall(id: string): CastingCall | undefined {
  const call = castingCalls.find((c) => c.id === id);
  if (call && !appliedCalls.has(id)) {
    appliedCalls.add(id);
    call.applicants += 1;
    myApplications.unshift({
      id: `app-${id}`,
      callId: id,
      status: "applied",
      appliedAgo: "just now",
    });
  }
  return call;
}

export function hasApplied(id: string): boolean {
  return appliedCalls.has(id);
}

// ————— the signed-in producer's listings (production side) —————

export const myListings: MyListing[] = [
  {
    id: "listing-glass-harbour",
    title: "Supporting cast (3) — anthology feature 'Glass Harbour'",
    medium: "Feature Film",
    location: "Mumbai",
    compensation: "Paid — per-day union rates",
    shootDates: "Nov 2 – Dec 14, 2026",
    deadline: "Aug 15, 2026",
    description:
      "Three interlocking stories set around a container port. Casting a dockworker-turned-whistleblower, a harbour-master, and a marine insurance investigator. Workshop-style rehearsal, one week, paid.",
    requiresAudition: true,
    postedAgo: "4d ago",
    applicants: [
      { personId: "aanya-sharma", status: "audition_requested", appliedAgo: "3d ago", note: "Konkani-accented Hindi is no problem — happy to tape any scene." },
      { personId: "rohan-chatterjee", status: "applied", appliedAgo: "2d ago", note: "200 nights of stage work; the harbour-master is my part." },
      { personId: "meher-kapoor", status: "applied", appliedAgo: "1d ago" },
      { personId: "sana-iyer", status: "rejected", appliedAgo: "4d ago" },
    ],
  },
  {
    id: "listing-audio-narrators",
    title: "Narrators (2) — 'Nightwater' audio series",
    medium: "Audio Series",
    location: "Remote",
    compensation: "Paid — per-finished-hour",
    shootDates: "Sessions Aug – Sep 2026",
    deadline: "Jul 31, 2026",
    description:
      "Eight-part scripted audio thriller. Two narrators, alternating chapters. Treated home studio or partner studio required; Source-Connect for direction.",
    requiresAudition: false,
    postedAgo: "1d ago",
    applicants: [
      { personId: "zoya-qureshi", status: "finalized", appliedAgo: "22h ago", note: "Demo attached — chapter one in two reads, warm and cold." },
      { personId: "priya-venkat", status: "applied", appliedAgo: "8h ago" },
    ],
  },
];

let listingCounter = 0;

export interface NewListingInput {
  title: string;
  medium: string;
  location: string;
  compensation: string;
  shootDates: string;
  deadline: string;
  description: string;
  requiresAudition: boolean;
}

export function createListing(input: NewListingInput): MyListing {
  const listing: MyListing = {
    id: `listing-new-${++listingCounter}`,
    ...input,
    postedAgo: "just now",
    applicants: [],
  };
  myListings.unshift(listing);
  return listing;
}

export function setApplicantStatus(
  listingId: string,
  personId: string,
  status: ApplicationStatus
): MyListing | undefined {
  const listing = myListings.find((l) => l.id === listingId);
  const applicant = listing?.applicants.find((a) => a.personId === personId);
  if (applicant) applicant.status = status;
  return listing;
}

const likedPosts = new Set<string>();

export function toggleLike(id: string): Post | undefined {
  const post = posts.find((p) => p.id === id);
  if (!post) return undefined;
  if (likedPosts.has(id)) {
    likedPosts.delete(id);
    post.likes -= 1;
  } else {
    likedPosts.add(id);
    post.likes += 1;
  }
  return post;
}

export function isLiked(id: string): boolean {
  return likedPosts.has(id);
}

let msgCounter = 100;

const replyPool = [
  "Got it — let me get back to you by end of day.",
  "Noted. Sending details across shortly.",
  "Perfect, that works. Talk soon.",
  "Love it. Let me loop in the team and revert.",
];

export function sendMessage(conversationId: string, text: string): Message[] {
  const conv = conversations.find((c) => c.id === conversationId);
  if (!conv) return [];
  const now = new Date();
  const time = `Today ${now.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}`;
  const mine: Message = { id: `m${++msgCounter}`, from: "me", text, time };
  conv.messages.push(mine);
  conv.unread = 0;
  conv.lastActive = "now";
  // canned reply so the thread never feels dead
  const reply: Message = {
    id: `m${++msgCounter}`,
    from: "them",
    text: replyPool[msgCounter % replyPool.length],
    time,
  };
  conv.messages.push(reply);
  return [mine, reply];
}

export function markRead(conversationId: string): void {
  const conv = conversations.find((c) => c.id === conversationId);
  if (conv) conv.unread = 0;
}

export function startConversation(personId: string): Conversation {
  const existing = conversations.find((c) => c.personId === personId);
  if (existing) return existing;
  const conv: Conversation = {
    id: `conv-${personId}`,
    personId,
    unread: 0,
    lastActive: "now",
    messages: [],
  };
  conversations.unshift(conv);
  return conv;
}
