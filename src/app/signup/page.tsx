"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthShell, Field, inputClass } from "@/components/AuthShell";
import { GoogleButton } from "@/components/GoogleButton";
import {
  IconArrowLeft,
  IconBadge,
  IconCheck,
  IconFilm,
  IconMail,
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

const REG_TYPES: Array<{
  id: RegistrationType;
  icon: typeof IconUser;
  title: string;
  blurb: string;
}> = [
  {
    id: "individual",
    icon: IconUser,
    title: "Individual",
    blurb: "You're one person — an actor, a DoP, a casting director, a composer.",
  },
  {
    id: "company",
    icon: IconUsers,
    title: "Company / Group",
    blurb: "A studio, agency, production house, theatre company or collective.",
  },
];

export default function SignupPage() {
  const { signIn, cut } = useSession();
  const [step, setStep] = useState(0);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const [regType, setRegType] = useState<RegistrationType | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  const [persona, setPersona] = useState<Persona | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [city, setCity] = useState("Mumbai");
  const [roleError, setRoleError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [finishError, setFinishError] = useState("");

  const isCompany = regType === "company";

  const pickRegType = (t: RegistrationType) => {
    setRegType(t);
    setStep(1);
  };

  const nextFromDetails = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (name.trim().length < 2)
      next.name = isCompany
        ? "Tell us the company or group name."
        : "Tell us your name — it goes on the marquee.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Enter a valid email address.";
    if (password.length < 6) next.password = "Password must be at least 6 characters.";
    setErrors(next);
    if (!Object.keys(next).length) setStep(2);
  };

  const pickPersona = (p: Persona) => {
    setPersona(p);
    setRoles([]);
    setStep(3);
  };

  const toggleRole = (r: string) => {
    setRoleError("");
    setRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  };

  const finish = async () => {
    if (!persona || !regType) return;
    if (roles.length === 0) {
      setRoleError("Pick at least one — you can add more later.");
      return;
    }
    setSubmitting(true);
    setFinishError("");
    try {
      const { data, error } = await supabaseBrowser().auth.signUp({ email, password });
      if (error) {
        setFinishError(
          /already registered|already exists/i.test(error.message)
            ? "An account already exists for that email — try logging in instead."
            : error.message
        );
        return;
      }
      if (!data.session) {
        // email confirmation required before a session is issued
        setAwaitingConfirmation(true);
        return;
      }
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
      setFinishError("Something went wrong creating your profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const stepCount = 4;

  if (awaitingConfirmation) {
    return (
      <AuthShell
        quote="We crewed an entire short film — DoP, editor, composer — in one weekend on here."
        credit="Vikram Sethi — Producer, Ashvattha Films"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <IconMail size={22} />
        </span>
        <h1 className="mt-5 font-display text-3xl font-medium tracking-tight text-ink-900">
          Check your email
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-500">
          We sent a confirmation link to <span className="font-semibold text-ink-800">{email}</span>.
          Click it, then come back and log in to finish setting up your profile.
        </p>
        <Link
          href="/login"
          className="mt-8 block w-full rounded-full bg-brand-600 py-3 text-center text-[15px] font-semibold text-white transition-colors duration-150 hover:bg-brand-700"
        >
          Go to login
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      quote="We crewed an entire short film — DoP, editor, composer — in one weekend on here."
      credit="Vikram Sethi — Producer, Ashvattha Films"
    >
      {/* step indicator */}
      <div className="mb-8 flex items-center gap-2" aria-label={`Step ${step + 1} of ${stepCount}`}>
        {Array.from({ length: stepCount }, (_, s) => (
          <span
            key={s}
            className={`h-1 rounded-full transition-all duration-300 ${
              s === step ? "w-8 bg-brand-600" : s < step ? "w-4 bg-brand-300" : "w-4 bg-line"
            }`}
          />
        ))}
        <span className="ml-2 text-xs font-medium text-ink-400">
          Step {step + 1} of {stepCount}
        </span>
      </div>

      {step === 0 && (
        <>
          <h1 className="font-display text-3xl font-medium tracking-tight text-ink-900">
            Who&apos;s joining Kaledio?
          </h1>
          <p className="mt-2 text-[15px] text-ink-500">
            This decides which profile you&apos;ll build. Free while in beta.
          </p>
          <div className="mt-8 space-y-3">
            {REG_TYPES.map(({ id, icon: Icon, title, blurb }) => (
              <button
                key={id}
                onClick={() => pickRegType(id)}
                className="group flex w-full items-start gap-4 rounded-xl border border-line bg-paper p-5 text-left transition-all duration-150 hover:border-brand-400 hover:shadow-lift"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition-colors duration-150 group-hover:bg-brand-600 group-hover:text-white">
                  <Icon size={20} />
                </span>
                <span>
                  <span className="block text-[16px] font-semibold text-ink-900">{title}</span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-ink-500">{blurb}</span>
                </span>
              </button>
            ))}
          </div>

          <div className="my-6 flex items-center gap-3 text-xs font-medium text-ink-400">
            <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
          </div>
          <GoogleButton label="Sign up with Google" />

          <p className="mt-8 text-sm text-ink-500">
            Already a member?{" "}
            <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
              Log in
            </Link>
          </p>
        </>
      )}

      {step === 1 && (
        <>
          <button
            onClick={() => setStep(0)}
            className="mb-6 flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-800"
          >
            <IconArrowLeft size={15} /> Back
          </button>
          <h1 className="font-display text-3xl font-medium tracking-tight text-ink-900">
            {isCompany ? "Put your company on the map" : "Claim your place on the call sheet"}
          </h1>
          <p className="mt-2 text-[15px] text-ink-500">Takes about two minutes.</p>
          <form onSubmit={nextFromDetails} noValidate className="mt-9 space-y-5">
            <Field label={isCompany ? "Company / group name" : "Full name"} error={errors.name}>
              <input
                type="text"
                autoComplete={isCompany ? "organization" : "name"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isCompany ? "As registered, or as known on set" : "As it should appear in credits"}
                className={inputClass(!!errors.name)}
              />
            </Field>
            <Field label="Email" error={errors.email}>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass(!!errors.email)}
              />
            </Field>
            <Field label="Password" error={errors.password} hint="6+ characters.">
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                className={inputClass(!!errors.password)}
              />
            </Field>
            <button
              type="submit"
              className="w-full rounded-full bg-brand-600 py-3 text-[15px] font-semibold text-white transition-colors duration-150 hover:bg-brand-700"
            >
              Continue
            </button>
          </form>
        </>
      )}

      {step === 2 && (
        <>
          <button
            onClick={() => setStep(1)}
            className="mb-6 flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-800"
          >
            <IconArrowLeft size={15} /> Back
          </button>
          <h1 className="font-display text-3xl font-medium tracking-tight text-ink-900">
            Which side of the camera are you on?
          </h1>
          <p className="mt-2 text-[15px] text-ink-500">
            This shapes your dashboard — talent and creatives get the casting tools, production gets the hiring tools.
          </p>
          <div className="mt-8 space-y-3">
            {PERSONAS.map((p) => {
              const Icon = PERSONA_ICONS[p];
              const meta = PERSONA_LABELS[p];
              return (
                <button
                  key={p}
                  onClick={() => pickPersona(p)}
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

      {step === 3 && persona && (
        <>
          <button
            onClick={() => setStep(2)}
            className="mb-6 flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-800"
          >
            <IconArrowLeft size={15} /> Back
          </button>
          <h1 className="font-display text-3xl font-medium tracking-tight text-ink-900">
            What {isCompany ? "does your company do" : `do you do${name ? `, ${name.trim().split(" ")[0]}` : ""}`}?
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
          {roleError && (
            <p role="alert" className="mt-3 text-xs font-medium text-danger">
              {roleError}
            </p>
          )}

          <div className="mt-7">
            <Field label="Base city">
              <select value={city} onChange={(e) => setCity(e.target.value)} className={inputClass()}>
                {CITIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
          </div>

          {finishError && (
            <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-danger">
              {finishError}
            </p>
          )}

          <button
            onClick={finish}
            disabled={submitting}
            className="mt-8 w-full rounded-full bg-brand-600 py-3 text-[15px] font-semibold text-white transition-colors duration-150 hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting ? "Printing your pass…" : "Create my profile"}
          </button>
        </>
      )}
    </AuthShell>
  );
}
