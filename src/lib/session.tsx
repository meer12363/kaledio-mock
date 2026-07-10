"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Splash } from "@/components/Splash";
import { gql, ME_QUERY } from "./gql";
import { mapMeToSessionUser } from "./persona";
import { supabaseBrowser } from "./supabase";
import type { SessionUser } from "./types";

interface SessionContextValue {
  user: SessionUser | null;
  ready: boolean;
  /** true when Supabase has an authenticated session but no Kaledio profile exists yet
   *  (e.g. fresh Google sign-in) — the app should route these to /onboarding, not /login */
  needsOnboarding: boolean;
  /** set the session directly from an already-fetched Me payload */
  signIn: (user: SessionUser) => void;
  signOut: () => void;
  /** persist a patch via the updateProfile mutation, then refresh local state */
  update: (patch: Partial<SessionUser>) => Promise<void>;
  /** Cinematic cut: play the loading screen, then navigate. */
  cut: (path: string, message: string) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function AppProviders({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [ready, setReady] = useState(false);
  const [loader, setLoader] = useState<{ path: string; message: string } | null>(null);
  // splash renders on server + first client paint, so hydration stays consistent
  const [splash, setSplash] = useState(true);
  const [splashLeaving, setSplashLeaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = supabaseBrowser();

    const hydrate = async (hasSession: boolean) => {
      if (!hasSession) {
        if (!cancelled) {
          setUser(null);
          setNeedsOnboarding(false);
        }
        return;
      }
      try {
        const { me } = await gql<{ me: Parameters<typeof mapMeToSessionUser>[0] | null }>(ME_QUERY);
        if (cancelled) return;
        if (me) {
          setUser(mapMeToSessionUser(me));
          setNeedsOnboarding(false);
        } else {
          setUser(null);
          setNeedsOnboarding(true);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          setNeedsOnboarding(false);
        }
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      hydrate(!!data.session).finally(() => {
        if (!cancelled) setReady(true);
      });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      hydrate(!!session);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem("kaledio.splashed")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSplash(false);
      return;
    }
    const fade = window.setTimeout(() => setSplashLeaving(true), 2100);
    const done = window.setTimeout(() => {
      setSplash(false);
      sessionStorage.setItem("kaledio.splashed", "1");
    }, 2600);
    return () => {
      window.clearTimeout(fade);
      window.clearTimeout(done);
    };
  }, []);

  const signIn = useCallback((next: SessionUser) => {
    setUser(next);
    setNeedsOnboarding(false);
  }, []);

  const signOut = useCallback(() => {
    supabaseBrowser()
      .auth.signOut()
      .finally(() => {
        setUser(null);
        setNeedsOnboarding(false);
      });
  }, []);

  const update = useCallback(async (patch: Partial<SessionUser>) => {
    const { updateProfile } = await gql<{ updateProfile: Parameters<typeof mapMeToSessionUser>[0] }>(
      `mutation($patch: String!) {
        updateProfile(patch: $patch) {
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
      { patch: JSON.stringify(patch) }
    );
    setUser(mapMeToSessionUser(updateProfile));
  }, []);

  const cut = useCallback(
    (path: string, message: string) => {
      setLoader({ path, message });
      router.prefetch(path);
      window.setTimeout(() => {
        router.push(path);
        // keep the overlay up briefly while the route paints
        window.setTimeout(() => setLoader(null), 450);
      }, 1500);
    },
    [router]
  );

  const value = useMemo(
    () => ({ user, ready, needsOnboarding, signIn, signOut, update, cut }),
    [user, ready, needsOnboarding, signIn, signOut, update, cut]
  );

  return (
    <SessionContext.Provider value={value}>
      {children}
      {loader && <LoadingScreen message={loader.message} />}
      {splash && <Splash leaving={splashLeaving} />}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside AppProviders");
  return ctx;
}
