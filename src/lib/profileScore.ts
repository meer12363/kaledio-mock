import type { ProfileDetails, RegistrationType } from "./types";

/** the bits of a profile that count toward the score */
export interface ScorableProfile {
  headline: string;
  bio: string;
  registrationType: RegistrationType;
  details: ProfileDetails;
}

/** anchors on the edit page each item scrolls to */
export type ScoreSection = "photo" | "intro" | "identity" | "contact" | "background" | "experience" | "recognition" | "audience" | "media";

export interface ScoreItem {
  id: string;
  label: string;
  /** short nudge, e.g. "Add a photo" */
  cta: string;
  emoji: string;
  points: number;
  done: boolean;
  section: ScoreSection;
}

export interface ProfileScore {
  score: number;
  items: ScoreItem[];
  /** missing items, biggest wins first */
  next: ScoreItem[];
  tier: Tier;
  nextTier: Tier | null;
}

export interface Tier {
  min: number;
  title: string;
  emoji: string;
  blurb: string;
}

export const TIERS: Tier[] = [
  { min: 0, title: "Extra", emoji: "🎭", blurb: "You're in the background. Step into the light." },
  { min: 25, title: "Supporting Role", emoji: "🎬", blurb: "Casting can see you — now make them look twice." },
  { min: 50, title: "Co-Star", emoji: "🌟", blurb: "Halfway to the marquee. Keep rolling." },
  { min: 75, title: "Lead Role", emoji: "🔥", blurb: "Directors are noticing. Just a few scenes left." },
  { min: 100, title: "Box Office Star", emoji: "🏆", blurb: "A complete profile. Your name's on the poster." },
];

const filled = (v?: string) => !!v && v.trim().length > 0;

export function scoreProfile(p: ScorableProfile): ProfileScore {
  const d = p.details;
  const company = p.registrationType === "company";
  const anyExperience = Object.values(d.experience).some(filled);

  const items: ScoreItem[] = [
    { id: "photo", label: company ? "Logo / profile photo" : "Profile photo", cta: company ? "Upload your logo" : "Add a profile photo", emoji: "📸", points: 15, done: filled(d.profilePicture), section: "photo" },
    { id: "headline", label: "Headline", cta: "Write a headline", emoji: "✍️", points: 10, done: filled(p.headline), section: "intro" },
    { id: "bio", label: "About (40+ characters)", cta: "Tell your story", emoji: "💬", points: 10, done: p.bio.trim().length >= 40, section: "intro" },
    ...(company
      ? [
          { id: "name", label: "Company name", cta: "Add your company name", emoji: "🏢", points: 5, done: filled(d.companyName), section: "identity" as const },
          { id: "category", label: "Category", cta: "Pick a category", emoji: "🗂️", points: 5, done: filled(d.category), section: "identity" as const },
          { id: "registration", label: "Registration details", cta: "Add registration details", emoji: "📜", points: 5, done: filled(d.registrationNumber) && filled(d.countryOfRegistration), section: "identity" as const },
        ]
      : [
          { id: "name", label: "First & last name", cta: "Add your full name", emoji: "🪪", points: 5, done: filled(d.firstName) && filled(d.lastName), section: "identity" as const },
          { id: "dob", label: "Date of birth", cta: "Add your birthday", emoji: "🎂", points: 5, done: filled(d.dateOfBirth), section: "identity" as const },
          { id: "origin", label: "Country of origin", cta: "Add your country", emoji: "🌍", points: 5, done: filled(d.countryOfOrigin), section: "identity" as const },
        ]),
    { id: "contact", label: "Phone & email", cta: "Add contact details", emoji: "📞", points: 5, done: filled(d.contactNumber) && filled(d.emailAddress), section: "contact" },
    { id: "languages", label: "Languages", cta: "Add languages you speak", emoji: "🗣️", points: 5, done: filled(d.languagesSpoken), section: "background" },
    { id: "qualification", label: "Qualification", cta: "Add a qualification", emoji: "🎓", points: 5, done: filled(d.qualification), section: "background" },
    { id: "experience", label: "A link to your work", cta: "Link your best work", emoji: "🎞️", points: 10, done: anyExperience, section: "experience" },
    { id: "recognition", label: "Awards or certifications", cta: "Show off an award", emoji: "🏅", points: 5, done: filled(d.honors) || filled(d.certifications), section: "recognition" },
    { id: "audience", label: "Target audience", cta: "Pick your audience", emoji: "🎯", points: 5, done: d.targetAudience.length > 0, section: "audience" },
    { id: "gallery", label: "3+ photos or videos", cta: d.gallery.length ? `Add ${3 - d.gallery.length} more to your gallery` : "Fill your gallery", emoji: "🖼️", points: 10, done: d.gallery.length >= 3, section: "media" },
    { id: "document", label: company ? "Company handbook" : "Resume PDF", cta: company ? "Attach your handbook" : "Attach your resume", emoji: "📄", points: 5, done: filled(company ? d.handbookName : d.resumeName), section: "media" },
  ];

  const score = items.reduce((sum, i) => sum + (i.done ? i.points : 0), 0);
  let tierIdx = 0;
  TIERS.forEach((t, i) => {
    if (score >= t.min) tierIdx = i;
  });
  return {
    score,
    items,
    next: items.filter((i) => !i.done).sort((a, b) => b.points - a.points),
    tier: TIERS[tierIdx],
    nextTier: TIERS[tierIdx + 1] ?? null,
  };
}
