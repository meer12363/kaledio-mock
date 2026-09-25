"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell, Field, inputClass } from "@/components/AuthShell";
import {
  IconArrowLeft,
  IconBadge,
  IconCheck,
  IconFilm,
  IconUser,
  IconUsers,
} from "@/components/icons";
import { useSession } from "@/lib/session";
import { CITIES, PERSONA_LABELS, ROLE_OPTIONS, mapMeToSessionUser, type MeGraphQL } from "@/lib/persona";
import { gql } from "@/lib/gql";
import { supabaseBrowser } from "@/lib/supabase";
import type { Persona, RegistrationType } from "@/lib/types";

const PERSONA_ICONS = { talent: IconBadge, creative: IconFilm, production: IconUsers };
const PERSONAS: Persona[] = ["talent", "creative", "production"];

const REG_TYPES: Array<{ id: RegistrationType; icon: typeof IconUser; title: string; blurb: string }> = [
  { id: "individual", icon: IconUser, title: "Individual", blurb: "You're one person — an actor, a DoP, a casting director, a composer." },
  { id: "company", icon: IconUsers, title: "Company / Group", blurb: "A studio, agency, production house, theatre company or collective." },
];

/** Mandatory first-run gate — collects just enough to use the platform.
 *  Reached after any auth method (email or Google) if no profile row exists yet. */
export default function OnboardingPage() {
  const router = useRouter();
  const { user, ready, signIn, cut } = useSession();
  const [checking, setChecking] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(0);
  const [regType, setRegType] = useState<RegistrationType | null>(null);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [city, setCity] = useState("Mumbai");
  const [roleError, setRoleError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;
    if (user) {
      router.replace("/home");
      return;
    }
    supabaseBrowser()
      .auth.getSession()
      .then(({ data }) => {
        if (!data.session) {
          router.replace("/login");
          return;
        }
        const meta = data.session.user.user_metadata as { full_name?: string; name?: string };
        setName(meta.full_name ?? meta.name ?? "");
        setEmail(data.session.user.email ?? "");
        setChecking(false);
      });
  }, [ready, user, router]);

  const isCompany = regType === "company";

  const toggleRole = (r: string) => {
    setRoleError("");
    setRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  };

  const finish = async () => {
    if (!persona || !regType) return;
    if (!name.trim()) {
      setStep(0);
      setError("Tell us your name — it goes on the marquee.");
      return;
    }
    if (roles.length === 0) {
      setRoleError("Pick at least one — you can add more later.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const { createProfile } = await gql<{ createProfile: MeGraphQL }>(
        `mutation($name: String!, $persona: String!, $registrationType: String!, $roles: [String!]!, $location: String!) {
          createProfile(name: $name, persona: $persona, registrationType: $registrationType, roles: $roles, location: $location) {
            id email name persona registrationType roles location headline bio availability
            details {
              firstName middleName lastName dateOfBirth countryOfOrigin resumeName
              companyName category registrationNumber stateOfRegistration countryOfRegistration handbookName
              contactNumber emailAddress address languagesSpoken languagesWritten qualification
              experience { theater mainstreamMovie television imdb }
              certifications honors targetAudience profilePicture gallery
            }
          }
        }`,
        { name: name.trim(), persona, registrationType: regType, roles, location: city }
      );
      signIn(mapMeToSessionUser(createProfile));
      cut("/home", "Building your green room");
    } catch {
      setError("Something went wrong creating your profile. Please try again.");
      setSubmitting(false);
    }
  };

  if (checking) return <div className="min-h-dvh bg-paper" aria-hidden="true" />;

  const stepCount = 3;

  return (
    <AuthShell quote="Two minutes now saves you a blank profile later." credit="Kaledio">
      <div className="mb-8 flex items-center gap-2" aria-label={`Step ${step + 1} of ${stepCount}`}>
        {Array.from({ length: stepCount }, (_, s) => (
          <span
            key={s}
            className={`h-1 rounded-full transition-all duration-300 ${
              s === step ? "w-8 bg-brand-600" : s < step ? "w-4 bg-brand-300" : "w-4 bg-line"
            }`}
          />
        ))}
        <span className="ml-2 text-xs font-medium text-ink-400">Step {step + 1} of {stepCount}</span>
      </div>

      {step === 0 && (
        <>
          <h1 className="font-display text-[40px] font-extrabold leading-[0.95] text-ink-900 sm:text-[52px]">
            Welcome to Kaledio
          </h1>
          <p className="mt-2 text-[15px] text-ink-500">
            A couple of essentials before you&apos;re in — {email}
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) {
                setError("Tell us your name — it goes on the marquee.");
                return;
              }
              setError("");
              setStep(1);
            }}
            className="mt-8 space-y-5"
          >
            <Field label="Full name (or company / group name)" error={error}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="As it should appear in credits"
                className={inputClass(!!error)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              {REG_TYPES.map(({ id, icon: Icon, title }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setRegType(id)}
                  aria-pressed={regType === id}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-colors ${
                    regType === id ? "border-brand-600 bg-brand-50" : "border-line hover:border-brand-300"
                  }`}
                >
                  <Icon size={20} className={regType === id ? "text-brand-600" : "text-ink-500"} />
                  <span className="text-[13px] font-semibold text-ink-800">{title}</span>
                </button>
              ))}
            </div>
            <button
              type="submit"
              disabled={!regType}
              className="w-full rounded-full bg-brand-600 py-3 text-[15px] font-semibold text-white transition-colors duration-150 hover:bg-brand-500 disabled:opacity-50"
            >
              Continue
            </button>
          </form>
        </>
      )}

      {step === 1 && (
        <>
          <button onClick={() => setStep(0)} className="mb-6 flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-800">
            <IconArrowLeft size={15} /> Back
          </button>
          <h1 className="font-display text-[40px] font-extrabold leading-[0.95] text-ink-900 sm:text-[52px]">
            Which side of the camera are you on?
          </h1>
          <p className="mt-2 text-[15px] text-ink-500">You can post AND apply either way — this just tailors your dashboard.</p>
          <div className="mt-8 space-y-3">
            {PERSONAS.map((p) => {
              const Icon = PERSONA_ICONS[p];
              const meta = PERSONA_LABELS[p];
              return (
                <button
                  key={p}
                  onClick={() => {
                    setPersona(p);
                    setRoles([]);
                    setStep(2);
                  }}
                  className="group flex w-full items-start gap-4 rounded-xl border border-line bg-paper p-5 text-left transition-all duration-150 hover:border-brand-400 hover:shadow-lift"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition-colors duration-150 group-hover:bg-brand-600 group-hover:text-white">
                    <Icon size={20} />
                  </span>
                  <span>
                    <span className="block text-[16px] font-semibold text-ink-900">{meta.title}</span>
                    <span className="mt-0.5 block text-sm leading-relaxed text-ink-500">{meta.blurb}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {step === 2 && persona && (
        <>
          <button onClick={() => setStep(1)} className="mb-6 flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-800">
            <IconArrowLeft size={15} /> Back
          </button>
          <h1 className="font-display text-[40px] font-extrabold leading-[0.95] text-ink-900 sm:text-[52px]">
            What {isCompany ? "does your company do" : "do you do"}?
          </h1>
          <p className="mt-2 text-[15px] text-ink-500">Pick everything that applies.</p>

          <div className="mt-7 flex flex-wrap gap-2.5" role="group" aria-label="Your roles">
            {ROLE_OPTIONS[persona].map((r) => {
              const on = roles.includes(r);
              return (
                <button
                  key={r}
                  onClick={() => toggleRole(r)}
                  aria-pressed={on}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-150 ${
                    on
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-line-strong bg-paper text-ink-600 hover:border-brand-300 hover:text-brand-700"
                  }`}
                >
                  {on && <IconCheck size={14} />}
                  {r}
                </button>
              );
            })}
          </div>
          {roleError && <p role="alert" className="mt-3 text-xs font-medium text-danger">{roleError}</p>}

          <div className="mt-7">
            <Field label="Base city">
              <select value={city} onChange={(e) => setCity(e.target.value)} className={inputClass()}>
                {CITIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
          </div>

          {error && <p role="alert" className="mt-4 rounded-lg bg-danger/10 px-3.5 py-2.5 text-sm font-medium text-danger">{error}</p>}

          <button
            onClick={finish}
            disabled={submitting}
            className="mt-8 w-full rounded-full bg-brand-600 py-3 text-[15px] font-semibold text-white transition-colors duration-150 hover:bg-brand-500 disabled:opacity-60"
          >
            {submitting ? "Printing your pass…" : "Enter Kaledio"}
          </button>
        </>
      )}
    </AuthShell>
  );
}
