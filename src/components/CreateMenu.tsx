"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Modal } from "./Modal";
import { useToast } from "./Toast";
import { IconClapper, IconFilm, IconPlus, IconSparkle, IconUser } from "./icons";

interface Action {
  key: string;
  icon: React.ReactNode;
  title: string;
  sub: string;
  tone: string;
}

const ACTIONS: Action[] = [
  { key: "post", icon: <IconPlus size={20} />, title: "Create a post", sub: "Share an update, a wrap or a win", tone: "bg-brand-50 text-brand-600" },
  { key: "call", icon: <IconClapper size={20} />, title: "Post a casting call", sub: "Hire talent & crew for your project", tone: "bg-accent-50 text-accent-600" },
  { key: "reel", icon: <IconFilm size={20} />, title: "Share your reel", sub: "Add work to your portfolio", tone: "bg-pop-50 text-pop-600" },
  { key: "live", icon: <IconSparkle size={20} />, title: "Go live", sub: "Host an AMA or audition room", tone: "bg-go-soft text-go" },
];

export function CreateMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("kaledio:open-create", onOpen);
    return () => window.removeEventListener("kaledio:open-create", onOpen);
  }, []);

  const run = (key: string) => {
    setOpen(false);
    switch (key) {
      case "post":
        if (pathname === "/home") {
          window.dispatchEvent(new CustomEvent("kaledio:compose"));
        } else {
          try {
            sessionStorage.setItem("kaledio.compose", "1");
          } catch {
            /* ignore */
          }
          router.push("/home");
        }
        break;
      case "call":
        window.dispatchEvent(new CustomEvent("kaledio:create-call"));
        break;
      case "reel":
        router.push("/profile/edit");
        break;
      case "live":
        toast("Live rooms are coming soon — you're on the list ✨", "accent");
        break;
    }
  };

  return (
    <Modal open={open} onClose={() => setOpen(false)} labelledBy="create-title" maxWidth="max-w-md">
      <div className="px-5 pb-5 pt-6 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl text-white [background:var(--grad-spotlight)]">
            <IconPlus size={19} />
          </span>
          <h2 id="create-title" className="font-display text-xl font-semibold tracking-tight text-ink-900">
            Create
          </h2>
        </div>
        <div className="mt-4 space-y-2 stagger">
          {ACTIONS.map((a) => (
            <button
              key={a.key}
              onClick={() => run(a.key)}
              className="group flex w-full items-center gap-3.5 rounded-2xl border border-line bg-paper p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift"
            >
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${a.tone}`}>
                {a.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14.5px] font-semibold text-ink-900">{a.title}</span>
                <span className="block text-[13px] leading-snug text-ink-500">{a.sub}</span>
              </span>
              <span className="shrink-0 text-ink-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500">→</span>
            </button>
          ))}
        </div>
        <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[12px] text-ink-400">
          <IconUser size={13} /> Everything you post reaches your network instantly
        </p>
      </div>
    </Modal>
  );
}
