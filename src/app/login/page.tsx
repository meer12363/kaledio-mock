"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthShell, Field, inputClass } from "@/components/AuthShell";
import { GoogleButton } from "@/components/GoogleButton";
import { useSession } from "@/lib/session";
import { gql, ME_QUERY } from "@/lib/gql";
import { mapMeToSessionUser, type MeGraphQL } from "@/lib/persona";
import { supabaseBrowser } from "@/lib/supabase";

export default function LoginPage() {
  const { signIn, cut } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Enter a valid email address.";
    if (password.length < 6) next.password = "Password must be at least 6 characters.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabaseBrowser().auth.signInWithPassword({ email, password });
      if (error || !data.session) {
        setErrors({ form: "Wrong email or password — double-check and try again." });
        return;
      }
      const { me } = await gql<{ me: MeGraphQL | null }>(ME_QUERY);
      if (!me) {
        setErrors({ form: "We couldn't find a profile for this account. Try creating one instead." });
        return;
      }
      signIn(mapMeToSessionUser(me));
      cut("/home", "Cueing your feed");
    } catch {
      setErrors({ form: "Something went wrong signing you in. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      quote="I booked two features off a profile I set up during a chai break."
      credit="Aanya Sharma — Actor, Mumbai"
    >
      <h1 className="font-display text-[40px] font-bold leading-[0.95] text-ink-900 sm:text-[52px]">
        Welcome back
      </h1>
      <p className="mt-2 text-[15px] text-ink-500">
        Pick up where the industry left off.
      </p>

      <div className="mt-8">
        <GoogleButton label="Log in with Google" />
      </div>
      <div className="my-6 flex items-center gap-3 text-xs font-medium text-ink-400">
        <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={submit} noValidate className="space-y-5">
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
        <Field label="Password" error={errors.password}>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputClass(!!errors.password)}
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              {showPw ? "Hide" : "Show"}
            </button>
          </div>
        </Field>

        {errors.form && (
          <p role="alert" className="rounded-lg bg-danger/10 px-3.5 py-2.5 text-sm font-medium text-danger">
            {errors.form}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-brand-600 py-3 text-[15px] font-semibold text-white transition-colors duration-150 hover:bg-brand-500 disabled:opacity-60"
        >
          {submitting ? "Checking the gate list…" : "Log in"}
        </button>
      </form>

      <p className="mt-8 text-sm text-ink-500">
        New to Kaledio?{" "}
        <Link href="/signup" className="font-semibold text-brand-600 hover:text-brand-700">
          Create a profile
        </Link>
      </p>
    </AuthShell>
  );
}
