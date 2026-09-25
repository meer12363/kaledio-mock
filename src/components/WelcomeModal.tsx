"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "./Modal";
import { Button } from "./ui";
import { useSession } from "@/lib/session";
import { IconClapper, IconSparkle, IconUser, IconUsers } from "./icons";

const SEEN_KEY = "kaledio.welcomed.v1";

const STEPS = [
  {
    icon: <IconUser size={20} />,
    title: "Complete your profile",
    body: "Add your reel, credits and photos so casting and crews can find you.",
    href: "/profile/edit",
    cta: "Edit profile",
  },
  {
    icon: <IconClapper size={20} />,
    title: "Browse casting calls",
    body: "Live roles across film, OTT, ad film, music video and theatre.",
    href: "/casting",
    cta: "Open the board",
  },
  {
    icon: <IconUsers size={20} />,
    title: "Grow your network",
    body: "Connect with directors, DoPs, writers and fellow talent.",
    href: "/search",
    cta: "Find people",
  },
];

export function WelcomeModal() {
  const { user } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    let seen = true;
    try {
      seen = !!localStorage.getItem(SEEN_KEY);
    } catch {
      /* ignore */
    }
    if (!seen) {
      const t = window.setTimeout(() => setOpen(true), 700);
      return () => window.clearTimeout(t);
    }
  }, [user]);

  const dismiss = () => {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  const go = (href: string) => {
    dismiss();
    router.push(href);
  };

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <Modal open={open} onClose={dismiss} labelledBy="welcome-title">
      <div className="relative overflow-hidden px-6 pb-6 pt-8 sm:px-8">
        {/* cinematic header wash */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 [background:var(--grad-hero)] grad-animate opacity-95" />
        <div className="relative">
          <span className="anim-float inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-paper/95 text-accent-500 shadow-lift">
            <IconSparkle size={24} />
          </span>
          <h2 id="welcome-title" className="mt-4 font-display text-2xl font-semibold tracking-tight text-white sm:text-[28px]">
            Welcome to Kaledio, {firstName}
          </h2>
          <p className="mt-1.5 max-w-md text-[14px] leading-relaxed text-white/85">
            The professional network built for the screen. Here&apos;s how to get rolling.
          </p>
        </div>

        <div className="mt-6 space-y-2.5 stagger">
          {STEPS.map((s) => (
            <button
              key={s.title}
              onClick={() => go(s.href)}
              className="group flex w-full items-center gap-3.5 rounded-2xl border border-line bg-paper p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                {s.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14.5px] font-semibold text-ink-900">{s.title}</span>
                <span className="block text-[13px] leading-snug text-ink-500">{s.body}</span>
              </span>
              <span className="shrink-0 text-[13px] font-semibold text-brand-600 opacity-0 transition-opacity group-hover:opacity-100">
                {s.cta} →
              </span>
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button onClick={dismiss} className="text-sm font-semibold text-ink-500 transition-colors hover:text-ink-800">
            Skip for now
          </button>
          <Button variant="accent" onClick={() => go("/profile/edit")}>
            Start with my profile
          </Button>
        </div>
      </div>
    </Modal>
  );
}
