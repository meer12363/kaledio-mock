export type Persona = "talent" | "creative" | "production";

export type Availability = "open" | "booked" | "listening";

export type MediaTone =
  | "midnight"
  | "steel"
  | "sky"
  | "noir"
  | "porcelain"
  | "dusk";

export interface MediaItem {
  id: string;
  title: string;
  kind: string; // "SHORT FILM", "AD FILM", "STILL", ...
  year: string;
  tone: MediaTone;
  aspect: "wide" | "tall" | "square";
}

export interface Credit {
  id: string;
  role: string;
  project: string;
  kind: string;
  year: string;
  note?: string;
}

export type ConnectionStatus = "none" | "pending_sent" | "pending_received" | "connected";

export interface Person {
  id: string;
  name: string;
  persona: Persona;
  roles: string[];
  headline: string;
  bio: string;
  location: string;
  availability: Availability;
  yearsExp: number;
  skills: string[];
  credits: Credit[];
  portfolio: MediaItem[];
  reelTitle: string;
  reelDuration: string;
  connections: number;
  hue: number; // avatar tone index
  avatarUrl?: string;
  connectionStatus?: ConnectionStatus;
}

export type PostKind = "announcement" | "casting" | "trailer" | "bts";

export interface Post {
  id: string;
  authorId: string;
  kind: PostKind;
  timeAgo: string;
  text: string;
  media?: MediaItem;
  likes: number;
  comments: number;
  castingCallId?: string;
}

export interface CastingRole {
  name: string;
  brief: string;
}

export interface CastingCall {
  id: string;
  title: string;
  company: string;
  postedById: string;
  medium: string; // Film | TV Series | OTT | Ad Film | Music Video | Theatre
  location: string;
  compensation: string;
  shootDates: string;
  deadline: string;
  /** machine-readable dates for the calendar */
  deadlineISO: string;
  shootStartISO: string;
  requiresAudition: boolean;
  description: string;
  lookingFor: CastingRole[];
  requirements: string[];
  tags: string[];
  applicants: number;
  postedAgo: string;
}

export type ApplicationStatus =
  | "applied"
  | "audition_requested"
  | "finalized"
  | "rejected";

/** the signed-in user's application to a casting call */
export interface MyApplication {
  id: string;
  callId: string;
  status: ApplicationStatus;
  appliedAgo: string;
  auditionDate?: string;
  auditionISO?: string;
}

/** someone who applied to one of the signed-in producer's listings */
export interface ListingApplicant {
  personId: string;
  status: ApplicationStatus;
  appliedAgo: string;
  note?: string;
}

/** a job/casting listing posted by the signed-in production user */
export interface MyListing {
  id: string;
  title: string;
  medium: string;
  location: string;
  compensation: string;
  shootDates: string;
  deadline: string;
  description: string;
  requiresAudition: boolean;
  postedAgo: string;
  applicants: ListingApplicant[];
}

export interface Message {
  id: string;
  from: "me" | "them";
  text: string;
  time: string;
}

export interface Conversation {
  id: string;
  personId: string;
  unread: number;
  lastActive: string;
  messages: Message[];
}

export type RegistrationType = "individual" | "company";

/** Experience links shared by both registration types */
export interface ExperienceLinks {
  theater: string;
  mainstreamMovie: string;
  television: string;
  imdb: string;
}

export interface ProfileDetails {
  // individual identity
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string; // DD/MM/YYYY
  countryOfOrigin: string;
  resumeName: string;
  // company identity
  companyName: string;
  category: string;
  registrationNumber: string;
  stateOfRegistration: string;
  countryOfRegistration: string;
  handbookName: string;
  // shared
  contactNumber: string;
  emailAddress: string;
  address: string;
  languagesSpoken: string;
  languagesWritten: string;
  qualification: string;
  experience: ExperienceLinks;
  certifications: string;
  honors: string;
  targetAudience: string[];
  profilePicture: string; // data URL
  gallery: string[]; // data URLs
}

export interface SessionUser {
  /** app User.id — set once the profile row exists in the database */
  id?: string;
  name: string;
  email: string;
  persona: Persona;
  registrationType: RegistrationType;
  roles: string[];
  location: string;
  headline: string;
  bio: string;
  availability: Availability;
  details: ProfileDetails;
}
