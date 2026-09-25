"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";
import { MediaPlaceholder } from "@/components/Media";
import { Avatar } from "@/components/Avatar";
import {
  IconArrowRight,
  IconBadge,
  IconClapper,
  IconFilm,
  IconMapPin,
  IconUsers,
} from "@/components/icons";
import { useSession } from "@/lib/session";

const TICKER_ROLES = [
  "Actors", "Directors", "Cinematographers", "Casting Directors", "Editors",
  "Composers", "Models", "Singers", "Dancers", "Voice Artists", "Writers",
  "Producers", "Studios", "Agencies", "Choreographers",
];

const PERSONAS = [
  {
    id: "talent",
    icon: IconBadge,
    title: "Talent",
    line: "Actors, models, singers, dancers, voice artists.",
    body: "A profile that works like a portfolio — headshots, reel, credits and an availability switch casting directors actually check.",
  },
  {
    id: "creative",
    icon: IconFilm,
    title: "Creative",
    line: "Directors, writers, DoPs, editors, composers.",
    body: "Your frames and cuts speak first. Get found for the next feature, series or ad film by the people crewing up.",
  },
  {
    id: "production",
    icon: IconUsers,
    title: "Production",
    line: "Producers, casting directors, studios, agencies.",
    body: "Post a call before lunch, shortlist by evening. Filter by role, city and availability instead of scrolling WhatsApp groups.",
  },
];

const STEPS = [
  { n: "01", title: "Build your page", body: "Credits, reel, skills, availability. Fifteen minutes, done properly once." },
  { n: "02", title: "Get on the radar", body: "Casting directors and producers search by role, city and experience — your profile does the rounds without you." },
  { n: "03", title: "Book the work", body: "Apply to calls, take the conversation to messages, and keep your credits growing." },
];

const CASTING_TEASERS = [
  { title: "Female lead — indie feature 'Monsoon Chess'", meta: "Feature Film · Mumbai · Paid", tag: "148 applicants" },
  { title: "Supporting cast (3) — limited series 'North Circular'", meta: "OTT Series · London · Equity rates", tag: "164 applicants" },
  { title: "Editor — feature doc 'The Last Projectionist'", meta: "Documentary · Berlin · €9k fee", tag: "58 applicants" },
];

export default function LandingPage() {
  const { user, ready, cut } = useSession();

  const goJoin = () => cut("/signup", "Setting the stage");
  const goLogin = () => cut("/login", "Rolling camera");
  const goFeed = () => cut("/home", "Cueing your feed");

  return (
    <div className="min-h-dvh bg-paper">
      {/* ————— top bar ————— */}
      <header className="sticky top-0 z-50 border-b border-line/70 bg-paper/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Logo size={30} />
          <div className="flex items-center gap-2.5">
            {ready && user ? (
              <button
                onClick={goFeed}
                className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-brand-500"
              >
                Open your feed
              </button>
            ) : (
              <>
                <button
                  onClick={goLogin}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-ink-700 transition-colors duration-150 hover:bg-canvas"
                >
                  Log in
                </button>
                <button
                  onClick={goJoin}
                  className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-brand-500"
                >
                  Join Kaledio
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ————— hero ————— */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:pt-20">
        <div className="anim-rise">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-600">
            The network for film · TV · OTT · ads · music · theatre
          </p>
          <h1 className="mt-5 font-display text-[clamp(2.6rem,6vw,4.3rem)] font-medium leading-[1.04] tracking-tight text-ink-900">
            Where the industry
            <br />
            finds <em className="text-brand-600">its people.</em>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-600">
            Kaledio is where talent gets seen, crews get built and casting gets
            done — one profile, one reel, every set from Anna Nagar to Los Angeles.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <button
              onClick={goJoin}
              className="group inline-flex items-center gap-2 rounded-full bg-brand-600 px-7 py-3.5 text-[15px] font-semibold text-white shadow-pop transition-all duration-200 hover:bg-brand-500"
            >
              Create your profile
              <IconArrowRight size={17} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
            <button
              onClick={goLogin}
              className="rounded-full border border-line-strong px-7 py-3.5 text-[15px] font-semibold text-ink-700 transition-colors duration-150 hover:border-brand-300 hover:text-brand-700"
            >
              I have an account
            </button>
          </div>
          <p className="mt-7 text-sm text-ink-400">
            2,300+ casting calls closed last season · free while in beta
          </p>
        </div>

        {/* collage */}
        <div className="anim-rise relative hidden lg:block" style={{ animationDelay: "0.12s" }}>
          <div className="grid grid-cols-2 gap-4">
            <MediaPlaceholder
              item={{ id: "hero1", title: "Half Light", kind: "Feature · Frame", year: "2025", tone: "midnight", aspect: "tall" }}
              className="mt-10 shadow-lift"
            />
            <div className="flex flex-col gap-4">
              <MediaPlaceholder
                item={{ id: "hero2", title: "Dhaaga", kind: "Music Video", year: "2023", tone: "dusk", aspect: "wide" }}
                className="shadow-lift"
              />
              <MediaPlaceholder
                item={{ id: "hero3", title: "Auréa Campaign", kind: "Print", year: "2025", tone: "porcelain", aspect: "square" }}
                className="shadow-lift"
              />
            </div>
          </div>
          {/* floating casting card */}
          <div className="absolute -left-8 bottom-6 w-72 rounded-xl border border-line bg-paper p-4 shadow-pop">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <IconClapper size={18} />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-ink-900">Casting now</p>
                <p className="text-xs text-ink-500">Lead · Feature film · Mumbai</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-canvas px-3 py-2">
              <div className="flex items-center gap-2">
                <Avatar name="Ritika Nair" hue={2} size={24} />
                <span className="text-xs font-medium text-ink-600">Meraki Casting</span>
              </div>
              <span className="text-xs font-semibold text-brand-600">Apply →</span>
            </div>
          </div>
          {/* floating availability chip */}
          <div className="absolute -right-4 top-4 flex items-center gap-2 rounded-full border border-line bg-paper py-1.5 pl-1.5 pr-4 shadow-lift">
            <Avatar name="Aanya Sharma" hue={0} size={26} />
            <span className="flex items-center gap-1.5 text-xs font-medium text-ink-700">
              <span className="h-1.5 w-1.5 rounded-full bg-go" />
              Open to work
            </span>
          </div>
        </div>
      </section>

      {/* ————— ticker ————— */}
      <div className="overflow-hidden border-y border-line bg-canvas py-3.5" aria-hidden="true">
        <div className="anim-ticker flex w-max whitespace-nowrap">
          {[0, 1].map((rep) => (
            <div key={rep} className="flex">
              {TICKER_ROLES.map((r) => (
                <span
                  key={`${rep}-${r}`}
                  className="mx-5 flex items-center gap-5 text-[13px] font-semibold uppercase tracking-[0.18em] text-ink-400"
                >
                  {r}
                  <span className="h-1 w-1 rounded-full bg-brand-300" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ————— personas ————— */}
      <section id="personas" className="mx-auto max-w-6xl px-5 py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-600">Who it&apos;s for</p>
        <h2 className="mt-4 max-w-2xl font-display text-4xl font-medium tracking-tight text-ink-900">
          Built for every side of the set
        </h2>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {PERSONAS.map(({ id, icon: Icon, title, line, body }) => (
            <button
              key={id}
              onClick={goJoin}
              className="group rounded-2xl border border-line bg-paper p-7 text-left shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors duration-200 group-hover:bg-brand-600 group-hover:text-white">
                <Icon size={22} />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-ink-900">{title}</h3>
              <p className="mt-1 text-sm font-medium text-brand-700">{line}</p>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-600">{body}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600">
                Join as {title.toLowerCase()}
                <IconArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ————— how it works ————— */}
      <section id="how" className="border-y border-line bg-canvas">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-24 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-600">How it works</p>
            <h2 className="mt-4 font-display text-4xl font-medium tracking-tight text-ink-900">
              From first look
              <br />
              to final cut
            </h2>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-ink-600">
              No showbiz gatekeeping, no lost PDFs, no &ldquo;we&apos;ll call
              you.&rdquo; Just a clean line between the work and the people who
              need it.
            </p>
          </div>
          <ol className="space-y-4">
            {STEPS.map(({ n, title, body }) => (
              <li key={n} className="flex gap-6 rounded-2xl border border-line bg-paper p-6 shadow-card">
                <span className="font-display text-3xl font-medium text-brand-200">{n}</span>
                <div>
                  <h3 className="text-[17px] font-semibold text-ink-900">{title}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-ink-600">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ————— casting teaser ————— */}
      <section id="casting" className="mx-auto max-w-6xl px-5 py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-600">On the board right now</p>
            <h2 className="mt-4 font-display text-4xl font-medium tracking-tight text-ink-900">Casting this week</h2>
          </div>
          <button
            onClick={goJoin}
            className="text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700"
          >
            Join to see all calls →
          </button>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {CASTING_TEASERS.map((c) => (
            <button
              key={c.title}
              onClick={goJoin}
              className="group flex flex-col justify-between rounded-2xl border border-line bg-paper p-6 text-left shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift"
            >
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-go-soft px-2.5 py-1 text-xs font-medium text-go">
                  <span className="h-1.5 w-1.5 rounded-full bg-go" /> Accepting applications
                </span>
                <h3 className="mt-4 text-[16px] font-semibold leading-snug text-ink-900">{c.title}</h3>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-500">
                  <IconMapPin size={14} /> {c.meta}
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-xs font-medium text-ink-400">{c.tag}</span>
                <span className="text-sm font-semibold text-brand-600 transition-transform duration-200 group-hover:translate-x-0.5">
                  Apply →
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ————— final CTA ————— */}
      <section className="mx-auto max-w-6xl px-5 pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-brand-900 px-8 py-16 text-center sm:py-20">
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(600px 300px at 70% 0%, rgba(24,120,209,0.35), transparent)" }}
          />
          <h2 className="relative font-display text-[clamp(1.9rem,4vw,3rem)] font-medium tracking-tight text-white">
            Your next credit starts here.
          </h2>
          <p className="relative mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-brand-200">
            Set up your profile tonight. Be on a casting director&apos;s shortlist tomorrow morning.
          </p>
          <button
            onClick={goJoin}
            className="relative mt-8 rounded-full bg-white px-8 py-3.5 text-[15px] font-semibold text-brand-800 transition-transform duration-200 hover:scale-[1.03]"
          >
            Join Kaledio — it&apos;s free
          </button>
        </div>
      </section>

      {/* ————— footer ————— */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-5 py-10">
          <div>
            <Logo size={24} />
            <p className="mt-2 text-sm text-ink-400">The professional network for the entertainment industry.</p>
          </div>
          <nav className="flex flex-wrap gap-x-8 gap-y-2 text-sm font-medium text-ink-600" aria-label="Footer">
            <Link href="#personas" className="transition-colors hover:text-brand-600">Who it&apos;s for</Link>
            <Link href="#how" className="transition-colors hover:text-brand-600">How it works</Link>
            <Link href="#casting" className="transition-colors hover:text-brand-600">Casting</Link>
            <button onClick={goLogin} className="transition-colors hover:text-brand-600">Log in</button>
            <button onClick={goJoin} className="transition-colors hover:text-brand-600">Join</button>
          </nav>
        </div>
        <div className="border-t border-line py-5 text-center text-xs text-ink-400">
          © 2026 Kaledio. Made for the people who make things.
        </div>
      </footer>
    </div>
  );
}
