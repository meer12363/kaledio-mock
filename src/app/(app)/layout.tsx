"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "@/components/TopNav";
import { ToastProvider } from "@/components/Toast";
import { WelcomeModal } from "@/components/WelcomeModal";
import { LivePulse } from "@/components/LivePulse";
import { CreateMenu } from "@/components/CreateMenu";
import { CreateCastingModal } from "@/components/CreateCastingModal";
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
    <ToastProvider>
      <div className="relative flex min-h-dvh flex-col bg-canvas">
        {/* ambient gradient mesh behind everything */}
        <div className="pointer-events-none fixed inset-0 -z-10 [background:var(--grad-mesh)]" aria-hidden="true" />
        <TopNav />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 md:pb-16">
          {children}
        </main>
        <WelcomeModal />
        <CreateMenu />
        <CreateCastingModal />
        <LivePulse />
      </div>
    </ToastProvider>
  );
}
