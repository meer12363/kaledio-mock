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
import { gql } from "@/lib/gql";
import { AVAILABILITY_META } from "./ui";
import type { Availability } from "@/lib/types";

const NAV_ITEMS = [
  { href: "/home", label: "Home", icon: IconHome },
  { href: "/search", label: "Search", icon: IconSearch },
  { href: "/casting", label: "Casting", icon: IconClapper },
  { href: "/connections", label: "Network", icon: IconUsers },
  { href: "/dashboard", label: "My Work", icon: IconBriefcase },
  { href: "/messages", label: "Messages", icon: IconChat },
];

// core destinations for the mobile bottom bar (Create sits in the middle as a FAB)
const MOBILE_ITEMS = [
  { href: "/home", label: "Home", icon: IconHome },
  { href: "/search", label: "Search", icon: IconSearch },
  { href: "/casting", label: "Casting", icon: IconClapper },
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
    gql<{ conversations: Array<{ unread: number }> }>(
      `query { conversations { unread } }`
    )
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

  return (
    <>
      <header className="sticky top-0 z-[100] border-b border-line/80 bg-paper/80 backdrop-blur-xl">
        {/* thin animated gradient hairline */}
        <div className="h-0.5 w-full [background:var(--grad-hero)] grad-animate opacity-80" />
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:gap-4">
          <Link
            href="/home"
            aria-label="Kaledio home"
            className="mr-1 transition-transform duration-200 hover:scale-[1.03] active:scale-95 sm:mr-2"
          >
            <Logo size={28} wordmark={false} className="sm:hidden" />
            <span className="hidden sm:block">
              <Logo size={28} />
            </span>
          </Link>

          {/* desktop nav */}
          <nav className="hidden flex-1 items-center justify-center gap-1 md:flex" aria-label="Primary">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`group relative flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-all duration-200 ${
                    active
                      ? "bg-brand-50 text-brand-700"
                      : "text-ink-500 hover:bg-canvas hover:text-ink-800"
                  }`}
                >
                  <span className="relative transition-transform duration-200 group-hover:-translate-y-0.5">
                    <Icon size={19} />
                    {label === "Messages" && unread > 0 && (
                      <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[9.5px] font-bold text-white ring-2 ring-paper">
                        {unread}
                      </span>
                    )}
                  </span>
                  <span>{label}</span>
                  {active && (
                    <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full [background:var(--grad-spotlight)]" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex flex-1 items-center justify-end gap-1.5 sm:gap-2 md:flex-none">
            {/* Create */}
            <button
              onClick={openCreate}
              className="press sheen hidden items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-glow-accent [background:var(--grad-spotlight)] sm:inline-flex"
            >
              <IconPlus size={16} /> Create
            </button>

            {/* Notifications */}
            <div className="relative" ref={bellRef}>
              <button
                onClick={() => setBellOpen((o) => !o)}
                aria-label="Notifications"
                aria-expanded={bellOpen}
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-canvas hover:text-ink-800"
              >
                <IconBell size={20} />
                <span
                  className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-accent-500 ring-2 ring-paper"
                  style={{ animation: "pulse-dot 2s ease-in-out infinite" }}
                />
              </button>
              {bellOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+8px)] w-72 overflow-hidden rounded-2xl border border-line bg-paper p-1.5 shadow-pop"
                  style={{ animation: "pop-in 0.22s cubic-bezier(0.34,1.56,0.64,1) both" }}
                >
                  <div className="flex items-center justify-between px-3 py-2">
                    <p className="text-sm font-semibold text-ink-900">Notifications</p>
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                      Live
                    </span>
                  </div>
                  <div className="rounded-xl bg-canvas px-3 py-6 text-center">
                    <p className="text-2xl">🔔</p>
                    <p className="mt-2 text-[13px] font-semibold text-ink-700">You&apos;re all caught up</p>
                    <p className="mt-0.5 text-xs text-ink-500">New likes, comments and casting replies land here.</p>
                  </div>
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
                className={`flex items-center rounded-full p-0.5 transition-all duration-200 hover:ring-2 hover:ring-brand-100 ${
                  menuOpen ? "ring-2 ring-brand-200" : ""
                }`}
              >
                <Avatar name={user.name} hue={3} size={34} src={avatarSrc} ring />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+8px)] w-64 overflow-hidden rounded-2xl border border-line bg-paper p-2 shadow-pop"
                  style={{ animation: "pop-in 0.22s cubic-bezier(0.34,1.56,0.64,1) both" }}
                >
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-canvas"
                  >
                    <Avatar name={user.name} hue={3} size={42} src={avatarSrc} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink-900">{user.name}</p>
                      <p className="truncate text-xs text-ink-500">{user.headline}</p>
                    </div>
                  </Link>
                  <div className="mx-2.5 mb-2 mt-1 flex items-center gap-1.5 text-xs text-ink-500">
                    <span className={`h-1.5 w-1.5 rounded-full ${availability.dot}`} />
                    {availability.label}
                  </div>
                  <div className="my-1 border-t border-line" />
                  <button
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      router.push("/profile");
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-canvas"
                  >
                    <IconUser size={17} /> View profile
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      router.push("/profile/edit");
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-canvas"
                  >
                    <IconEdit size={17} /> Edit profile
                  </button>
                  <div className="my-1 border-t border-line" />
                  <button
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      toast("Signed out — see you on set 🎬", "accent");
                      signOut();
                      router.push("/");
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-canvas"
                  >
                    <IconLogout size={17} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ————— mobile bottom navigation ————— */}
      <nav
        className="fixed inset-x-0 bottom-0 z-[100] border-t border-line/80 bg-paper/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
        aria-label="Primary mobile"
      >
        <div className="mx-auto flex max-w-md items-center justify-around px-2">
          {MOBILE_ITEMS.slice(0, 2).map(({ href, label, icon: Icon }) => (
            <MobileTab
              key={href}
              href={href}
              label={label}
              Icon={Icon}
              active={pathname.startsWith(href)}
              unread={label === "Inbox" ? unread : 0}
            />
          ))}

          {/* center Create FAB */}
          <button
            onClick={openCreate}
            aria-label="Create a post"
            className="press -mt-6 flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white shadow-glow-accent ring-4 ring-paper [background:var(--grad-spotlight)]"
          >
            <IconPlus size={24} />
          </button>

          {MOBILE_ITEMS.slice(2).map(({ href, label, icon: Icon }) => (
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
      className={`relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors ${
        active ? "text-brand-700" : "text-ink-400"
      }`}
    >
      <span className={`relative transition-transform duration-200 ${active ? "-translate-y-0.5 scale-110" : ""}`}>
        <Icon size={22} />
        {unread > 0 && (
          <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[9px] font-bold text-white ring-2 ring-paper">
            {unread}
          </span>
        )}
      </span>
      {label}
      {active && <span className="absolute bottom-0 h-1 w-1 rounded-full bg-brand-600" />}
    </Link>
  );
}
