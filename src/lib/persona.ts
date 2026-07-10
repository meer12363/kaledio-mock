import type {
  Credit,
  MediaItem,
  Persona,
  ProfileDetails,
  RegistrationType,
  SessionUser,
} from "./types";

export const ROLE_OPTIONS: Record<Persona, string[]> = {
  talent: ["Actor", "Model", "Singer", "Dancer", "Voice Artist"],
  creative: ["Director", "Writer", "Cinematographer", "Editor", "Composer"],
  production: ["Producer", "Casting Director", "Studio", "Agency"],
};

export const PERSONA_LABELS: Record<Persona, { title: string; blurb: string }> = {
  talent: {
    title: "Talent",
    blurb: "Actors, models, singers, dancers, voice artists — the faces and voices.",
  },
  creative: {
    title: "Creative",
    blurb: "Directors, writers, cinematographers, editors, composers — the makers.",
  },
  production: {
    title: "Production",
    blurb: "Producers, casting directors, studios, agencies — the ones who greenlight.",
  },
};

export const CITIES = [
  "Mumbai",
  "Anna Nagar, Chennai",
  "Delhi",
  "Hyderabad",
  "Bengaluru",
  "Kolkata",
  "Goa",
  "London",
  "Los Angeles",
  "New York",
  "Berlin",
  "Dubai",
  "Seoul",
  "Toronto",
  "Sydney",
  "Lagos",
  "São Paulo",
];

export const QUALIFICATIONS = [
  "School",
  "Undergraduate / Bachelors",
  "Masters / Graduate",
  "PHD",
];

export const COMPANY_CATEGORIES = [
  "Production House",
  "Casting Agency",
  "Talent Agency",
  "Studio",
  "Theatre Company",
  "Dance Company",
  "Music Label",
  "Post-Production House",
  "Advertising Agency",
  "Other",
];

/** language / demographic audiences — individuals pick up to 5 */
export const TARGET_AUDIENCES = [
  "Hindi",
  "English",
  "Tamil",
  "Telugu",
  "Bengali",
  "Marathi",
  "Kannada",
  "Malayalam",
  "Punjabi",
  "Urdu",
  "Spanish",
  "Mandarin",
  "Korean",
  "Japanese",
  "French",
  "German",
  "Portuguese",
  "Arabic",
  "Kids & Family",
  "Young Adult",
  "General / Global",
  "Diaspora (South Asian)",
  "Regional / Festival circuit",
];

export const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia",
  "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados",
  "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina",
  "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia",
  "Cameroon", "Canada", "Cape Verde", "Chad", "Chile", "China", "Colombia", "Comoros",
  "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia", "Denmark", "Djibouti", "Dominica",
  "Dominican Republic", "DR Congo", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea",
  "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon",
  "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea",
  "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India",
  "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast", "Jamaica",
  "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos",
  "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania",
  "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta",
  "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova",
  "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia",
  "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria",
  "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine",
  "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar", "Republic of the Congo", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis",
  "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino",
  "São Tomé and Príncipe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles",
  "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia",
  "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan",
  "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania",
  "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia",
  "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates",
  "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu",
  "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe",
];

/** shape returned by the `Me` GraphQL query */
export interface MeGraphQL {
  id: string;
  email: string;
  name: string;
  persona: Persona;
  registrationType: RegistrationType;
  roles: string[];
  location: string;
  headline: string;
  bio: string;
  availability: SessionUser["availability"];
  details: ProfileDetails;
}

/** convert the GraphQL `Me` payload into the app's lightweight session shape */
export function mapMeToSessionUser(me: MeGraphQL): SessionUser {
  return {
    id: me.id,
    name: me.name,
    email: me.email,
    persona: me.persona,
    registrationType: me.registrationType,
    roles: me.roles,
    location: me.location,
    headline: me.headline,
    bio: me.bio,
    availability: me.availability,
    details: me.details,
  };
}

/** upgrade sessions saved before registration types / profile details existed */
export function ensureUserShape(raw: Partial<SessionUser>): SessionUser {
  const registrationType: RegistrationType = raw.registrationType ?? "individual";
  const name = raw.name ?? "New Member";
  const email = raw.email ?? "";
  const location = raw.location ?? "Mumbai";
  return {
    name,
    email,
    persona: raw.persona ?? "talent",
    registrationType,
    roles: raw.roles ?? [],
    location,
    headline: raw.headline ?? "",
    bio: raw.bio ?? "",
    availability: raw.availability ?? "open",
    details: raw.details ?? emptyDetails(name, email, location, registrationType),
  };
}

/** blank, editable profile details for a fresh account */
export function emptyDetails(
  name: string,
  email: string,
  city: string,
  registrationType: RegistrationType
): ProfileDetails {
  const parts = name.trim().split(/\s+/);
  const isIndividual = registrationType === "individual";
  return {
    firstName: isIndividual ? parts[0] ?? "" : "",
    middleName: isIndividual && parts.length > 2 ? parts.slice(1, -1).join(" ") : "",
    lastName: isIndividual && parts.length > 1 ? parts[parts.length - 1] : "",
    dateOfBirth: "",
    countryOfOrigin: "",
    resumeName: "",
    companyName: isIndividual ? "" : name.trim(),
    category: "",
    registrationNumber: "",
    stateOfRegistration: "",
    countryOfRegistration: "",
    handbookName: "",
    contactNumber: "",
    emailAddress: email,
    address: city,
    languagesSpoken: "",
    languagesWritten: "",
    qualification: "",
    experience: { theater: "", mainstreamMovie: "", television: "", imdb: "" },
    certifications: "",
    honors: "",
    targetAudience: [],
    profilePicture: "",
    gallery: [],
  };
}

export function defaultHeadline(persona: Persona, roles: string[], location: string): string {
  const role = roles.join(" · ") || PERSONA_LABELS[persona].title;
  return `${role} — ${location} | new on Kaledio`;
}

export function defaultBio(persona: Persona, roles: string[]): string {
  const role = (roles[0] || "professional").toLowerCase();
  switch (persona) {
    case "talent":
      return `Working ${role} building a body of work across film, OTT and advertising. Currently taping, training and saying yes to the right rooms.`;
    case "creative":
      return `${roles[0] || "Creative"} with a taste for stories that travel. Open to features, series and branded work with real ambition.`;
    case "production":
      return `We find, package and back the right people for the right projects. Slate open — talk to us.`;
  }
}

interface ProfileDefaults {
  skills: string[];
  credits: Credit[];
  portfolio: MediaItem[];
  reelTitle: string;
  reelDuration: string;
  connections: number;
}

export function profileDefaults(user: SessionUser): ProfileDefaults {
  const year = "2026";
  const base: Record<Persona, ProfileDefaults> = {
    talent: {
      skills: ["Screen acting", "Improv", "Two languages", "Self-tape setup", "Movement basics"],
      credits: [
        { id: "d1", role: "Featured", project: "Student thesis film", kind: "Short Film", year: "2025" },
        { id: "d2", role: "Principal", project: "Regional TVC", kind: "Ad Film", year: "2025" },
        { id: "d3", role: "Ensemble", project: "College theatre fest", kind: "Theatre", year: "2024" },
      ],
      portfolio: [
        { id: "dp1", title: "Headshots — natural light", kind: "STILL", year, tone: "porcelain", aspect: "tall" },
        { id: "dp2", title: "Self tape — drama", kind: "SELF TAPE", year, tone: "noir", aspect: "tall" },
        { id: "dp3", title: "Regional TVC", kind: "AD FILM", year: "2025", tone: "sky", aspect: "wide" },
        { id: "dp4", title: "Movement study", kind: "REEL CLIP", year, tone: "dusk", aspect: "square" },
      ],
      reelTitle: `Acting Reel — ${year}`,
      reelDuration: "1:48",
      connections: 34,
    },
    creative: {
      skills: ["Story sense", "On-set discipline", "Post workflow", "Pitch decks", "Small-crew jugaad"],
      credits: [
        { id: "d1", role: user.roles[0] || "Creative", project: "Festival short 'First Draft'", kind: "Short Film", year: "2025" },
        { id: "d2", role: user.roles[0] || "Creative", project: "Branded doc series", kind: "Branded", year: "2025" },
        { id: "d3", role: "Assistant", project: "Feature (uncredited)", kind: "Feature Film", year: "2024" },
      ],
      portfolio: [
        { id: "dp1", title: "First Draft", kind: "SHORT FILM", year: "2025", tone: "midnight", aspect: "wide" },
        { id: "dp2", title: "Branded doc — ep 2", kind: "BRANDED", year: "2025", tone: "steel", aspect: "wide" },
        { id: "dp3", title: "Frames I like", kind: "SELECTS", year, tone: "dusk", aspect: "square" },
      ],
      reelTitle: `Selected Work — ${year}`,
      reelDuration: "2:10",
      connections: 51,
    },
    production: {
      skills: ["Casting briefs", "Budgets that close", "Talent relationships", "Contracts", "Release strategy"],
      credits: [
        { id: "d1", role: "Line producer", project: "Two ad campaigns", kind: "Ad Film", year: "2025" },
        { id: "d2", role: "Associate", project: "OTT anthology (1 ep)", kind: "OTT Series", year: "2024" },
      ],
      portfolio: [
        { id: "dp1", title: "Slate overview", kind: "SLATE", year, tone: "midnight", aspect: "wide" },
        { id: "dp2", title: "Open calls", kind: "CASTING", year, tone: "porcelain", aspect: "square" },
      ],
      reelTitle: "Company Sizzle",
      reelDuration: "1:12",
      connections: 87,
    },
  };
  return base[user.persona];
}
