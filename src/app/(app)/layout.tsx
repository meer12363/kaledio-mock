"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "@/components/TopNav";
import { useSession } from "@/lib/session";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, ready, needsOnboarding } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!ready || user) return;
    router.replace(needsOnboarding ? "/onboarding" : "/login");
  }, [ready, user, needsOnboarding, router]);

  if (!ready || !user) {
    return <div className="min-h-dvh bg-canvas" aria-hidden="true" />;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <TopNav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-6">
        {children}
      </main>
    </div>
  );
}
