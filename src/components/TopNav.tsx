"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./Logo";
import { Avatar } from "./Avatar";
import {
  IconBell,
  IconBriefcase,
  IconChat,
  IconClapper,
  IconEdit,
  IconHome,
  IconLogout,
  IconPlus,
  IconSearch,
  IconUser,
  IconUsers,
} from "./icons";
import { useSession } from "@/lib/session";
import { useToast } from "./Toast";
import { ThemeToggle } from "./ThemeToggle";
import { gql } from "@/lib/gql";
import { AVAILABILITY_META } from "./ui";
import { LIVE_PULSES } from "@/lib/mock";
import type { Availability } from "@/lib/types";

// order: Home · Search · Casting · My Work · Network · Messages
const NAV_ITEMS = [
  { href: "/home", label: "Home", icon: IconHome },
  { href: "/search", label: "Search", icon: IconSearch },
  { href: "/casting", label: "Casting", icon: IconClapper },
  { href: "/dashboard", label: "My Work", icon: IconBriefcase },
  { href: "/connections", label: "Network", icon: IconUsers },
  { href: "/messages", label: "Messages", icon: IconChat },
];

// mobile dock — Create FAB sits in the middle
const MOBILE_LEFT = [
  { href: "/home", label: "Home", icon: IconHome },
  { href: "/casting", label: "Casting", icon: IconClapper },
];
const MOBILE_RIGHT = [
  { href: "/connections", label: "Network", icon: IconUsers },
  { href: "/messages", label: "Inbox", icon: IconChat },
];

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useSession();
  const { toast } = useToast();
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gql<{ conversations: Array<{ unread: number }> }>(`query { conversations { unread } }`)
      .then((d) => setUnread(d.conversations.reduce((s, c) => s + c.unread, 0)))
      .catch(() => setUnread(0));
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen && !bellOpen) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(t)) setMenuOpen(false);
      if (bellRef.current && !bellRef.current.contains(t)) setBellOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setBellOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, bellOpen]);

  if (!user) return null;

  const availability = AVAILABILITY_META[user.availability as Availability];
  const avatarSrc = user.details?.profilePicture || undefined;
  const openCreate = () => window.dispatchEvent(new CustomEvent("kaledio:open-create"));
  // recent activity for the bell (mock)
  const notes = LIVE_PULSES.slice(0, 4);

  return (
    <>
      <header className="sticky top-0 z-[100] px-3 pt-3 sm:px-4">
        <div className="glass mx-auto flex h-16 max-w-6xl items-center gap-2 rounded-2xl border border-line/80 px-3 shadow-pop sm:gap-3 sm:px-4">
          <Link
            href="/home"
            aria-label="Kaledio home"
            className="mr-1 shrink-0 transition-transform duration-200 hover:scale-[1.04] active:scale-95"
          >
            <Logo size={30} wordmark={false} className="sm:hidden" />
            <span className="hidden sm:block">
              <Logo size={30} />
            </span>
          </Link>

          {/* desktop nav */}
          <nav className="hidden flex-1 items-center justify-center gap-0.5 lg:flex" aria-label="Primary">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`group relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13.5px] font-semibold transition-all duration-200 ${
                    active ? "bg-ink-900/[0.07] text-ink-900" : "text-ink-500 hover:bg-ink-900/[0.04] hover:text-ink-900"
                  }`}
                >
                  <span className="relative transition-transform duration-200 group-hover:-translate-y-0.5">
                    <Icon size={18} />
                    {label === "Messages" && unread > 0 && (
                      <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[9.5px] font-bold text-canvas">
                        {unread}
                      </span>
                    )}
                  </span>
                  <span>{label}</span>
                  {active && (
                    <span
                      className="absolute -bottom-[3px] left-1/2 h-[3px] w-6 -translate-x-1/2 rounded-full bg-volt-ink"
                      style={{ boxShadow: "0 0 12px rgba(215,255,58,0.7)" }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* tablet: compact icon nav */}
          <nav className="hidden flex-1 items-center justify-center gap-0.5 md:flex lg:hidden" aria-label="Primary compact">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-label={label}
                  title={label}
                  className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                    active ? "bg-ink-900/[0.08] text-volt-ink" : "text-ink-500 hover:bg-ink-900/[0.04] hover:text-ink-900"
                  }`}
                >
                  <Icon size={19} />
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2 lg:ml-0">
            <Link
              href="/search"
              aria-label="Search"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-500 transition-colors hover:bg-ink-900/[0.05] hover:text-ink-900 md:hidden"
            >
              <IconSearch size={19} />
            </Link>
            <button
              onClick={openCreate}
              className="press sheen hidden items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-bold text-canvas transition-all duration-200 hover:shadow-glow-accent [background:var(--grad-spotlight)] sm:inline-flex"
            >
              <IconPlus size={16} /> Create
            </button>

            <ThemeToggle />

            {/* Notifications */}
            <div className="relative" ref={bellRef}>
              <button
                onClick={() => setBellOpen((o) => !o)}
                aria-label="Notifications"
                aria-expanded={bellOpen}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl text-ink-500 transition-colors hover:bg-ink-900/[0.05] hover:text-ink-900"
              >
                <IconBell size={19} />
                <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-volt" style={{ animation: "ring-pulse 2s ease-out infinite" }} />
              </button>
              {bellOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+10px)] w-80 overflow-hidden rounded-2xl border border-line bg-elevated shadow-pop"
                  style={{ animation: "pop-in 0.22s cubic-bezier(0.34,1.56,0.64,1) both" }}
                >
                  <div className="flex items-center justify-between border-b border-line px-4 py-3">
                    <p className="font-display text-[15px] font-bold text-ink-900">Activity</p>
                    <span className="eyebrow !text-volt-ink">● live</span>
                  </div>
                  <ul className="max-h-80 overflow-y-auto p-1.5">
                    {notes.map((n, i) => (
                      <li key={i}>
                        <button
                          onClick={() => {
                            setBellOpen(false);
                            router.push(n.href);
                          }}
                          className="flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-ink-900/[0.04]"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink-900/[0.06] text-lg">{n.emoji}</span>
                          <span className="min-w-0">
                            <span className="block text-[13px] leading-snug text-ink-800">{n.text}</span>
                            <span className="mt-0.5 block font-mono text-[10.5px] uppercase tracking-wider text-ink-400">{i * 7 + 2}m ago</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Account */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Account menu"
                className={`flex items-center rounded-full p-0.5 transition-all duration-200 ${
                  menuOpen ? "ring-2 ring-volt-ink" : "hover:ring-2 hover:ring-ink-900/20"
                }`}
              >
                <Avatar name={user.name} hue={3} size={34} src={avatarSrc} />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+10px)] w-64 overflow-hidden rounded-2xl border border-line bg-elevated p-2 shadow-pop"
                  style={{ animation: "pop-in 0.22s cubic-bezier(0.34,1.56,0.64,1) both" }}
                >
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-ink-900/[0.04]"
                  >
                    <Avatar name={user.name} hue={3} size={42} src={avatarSrc} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-ink-900">{user.name}</p>
                      <p className="truncate text-xs text-ink-500">{user.headline}</p>
                    </div>
                  </Link>
                  <div className="mx-2.5 mb-2 mt-1 flex items-center gap-1.5 text-xs text-ink-500">
                    <span className={`h-1.5 w-1.5 rounded-full ${availability.dot}`} />
                    {availability.label}
                  </div>
                  <div className="my-1 border-t border-line" />
                  {[
                    { label: "View profile", Icon: IconUser, href: "/profile" },
                    { label: "Edit profile", Icon: IconEdit, href: "/profile/edit" },
                    { label: "My Work", Icon: IconBriefcase, href: "/dashboard" },
                  ].map(({ label, Icon, href }) => (
                    <button
                      key={label}
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        router.push(href);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-900/[0.04] hover:text-ink-900"
                    >
                      <Icon size={17} /> {label}
                    </button>
                  ))}
                  <div className="my-1 border-t border-line" />
                  <ThemeToggle variant="row" />
                  <div className="my-1 border-t border-line" />
                  <button
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      toast("Signed out — see you on set 🎬", "accent");
                      signOut();
                      router.push("/");
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-900/[0.04] hover:text-danger"
                  >
                    <IconLogout size={17} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ————— mobile floating dock ————— */}
      <nav
        className="fixed inset-x-3 bottom-3 z-[100] pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Primary mobile"
      >
        <div className="glass mx-auto flex max-w-md items-center justify-around rounded-2xl border border-line/80 px-2 shadow-pop">
          {MOBILE_LEFT.map(({ href, label, icon: Icon }) => (
            <MobileTab key={href} href={href} label={label} Icon={Icon} active={pathname.startsWith(href)} unread={0} />
          ))}
          <button
            onClick={openCreate}
            aria-label="Create"
            className="press -mt-7 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-canvas shadow-glow-accent ring-4 ring-canvas [background:var(--grad-spotlight)]"
          >
            <IconPlus size={26} />
          </button>
          {MOBILE_RIGHT.map(({ href, label, icon: Icon }) => (
            <MobileTab
              key={href}
              href={href}
              label={label}
              Icon={Icon}
              active={pathname.startsWith(href)}
              unread={label === "Inbox" ? unread : 0}
            />
          ))}
        </div>
      </nav>
    </>
  );
}

function MobileTab({
  href,
  label,
  Icon,
  active,
  unread,
}: {
  href: string;
  label: string;
  Icon: (p: { size?: number }) => React.ReactNode;
  active: boolean;
  unread: number;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative flex flex-1 flex-col items-center gap-0.5 py-2.5 font-mono text-[9.5px] uppercase tracking-wider transition-colors ${
        active ? "text-volt-ink" : "text-ink-400"
      }`}
    >
      <span className={`relative transition-transform duration-200 ${active ? "-translate-y-0.5 scale-110" : ""}`}>
        <Icon size={21} />
        {unread > 0 && (
          <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 font-sans text-[9px] font-bold text-canvas">
            {unread}
          </span>
        )}
      </span>
      {label}
    </Link>
  );
}
