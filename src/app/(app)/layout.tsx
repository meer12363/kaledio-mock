"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "@/components/TopNav";
import { ToastProvider } from "@/components/Toast";
import { WelcomeModal } from "@/components/WelcomeModal";
import { LivePulse } from "@/components/LivePulse";
import { CreateMenu } from "@/components/CreateMenu";
import { CreateCastingModal } from "@/components/CreateCastingModal";
import { ReelsViewer } from "@/components/ReelsViewer";
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
      {/* ambient light behind everything */}
      <div className="pointer-events-none fixed inset-0 z-0 [background:var(--grad-mesh)]" aria-hidden="true" />
      <div className="relative z-10 flex min-h-dvh flex-col">
        <TopNav />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-32 pt-6 md:pb-16">{children}</main>
        <WelcomeModal />
        <CreateMenu />
        <CreateCastingModal />
        <ReelsViewer />
        <LivePulse />
      </div>
    </ToastProvider>
  );
}
