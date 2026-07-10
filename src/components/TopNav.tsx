"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./Logo";
import { Avatar } from "./Avatar";
import {
  IconBriefcase,
  IconChat,
  IconClapper,
  IconHome,
  IconLogout,
  IconSearch,
  IconUser,
  IconUsers,
} from "./icons";
import { useSession } from "@/lib/session";
import { gql } from "@/lib/gql";
import { AVAILABILITY_META } from "./ui";
import type { Availability } from "@/lib/types";

const NAV_ITEMS = [
  { href: "/home", label: "Home", icon: IconHome },
  { href: "/search", label: "Search", icon: IconSearch },
  { href: "/casting", label: "Casting Calls", icon: IconClapper },
  { href: "/connections", label: "Connections", icon: IconUsers },
  { href: "/dashboard", label: "My Work", icon: IconBriefcase },
  { href: "/messages", label: "Messages", icon: IconChat },
];

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useSession();
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gql<{ conversations: Array<{ unread: number }> }>(
      `query { conversations { unread } }`
    )
      .then((d) => setUnread(d.conversations.reduce((s, c) => s + c.unread, 0)))
      .catch(() => setUnread(0));
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  if (!user) return null;

  const availability = AVAILABILITY_META[user.availability as Availability];
  const navItems = NAV_ITEMS;
  const avatarSrc = user.details?.profilePicture || undefined;

  return (
    <header className="sticky top-0 z-[100] border-b border-line bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:gap-6">
        <Link href="/home" aria-label="Kaledio home" className="mr-1 sm:mr-2">
          <Logo size={26} wordmark={false} className="sm:hidden" />
          <span className="hidden sm:block">
            <Logo size={26} />
          </span>
        </Link>

        <nav className="flex flex-1 items-center justify-start gap-0.5 overflow-x-auto sm:justify-end sm:gap-2" aria-label="Primary">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative flex h-14 min-w-[44px] shrink-0 flex-col items-center justify-center gap-0.5 px-1.5 text-[11px] font-medium transition-colors duration-150 sm:min-w-[64px] sm:px-3 ${
                  active ? "text-ink-900" : "text-ink-500 hover:text-ink-800"
                }`}
              >
                <span className="relative">
                  <Icon size={21} />
                  {label === "Messages" && unread > 0 && (
                    <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[9.5px] font-bold text-white">
                      {unread}
                    </span>
                  )}
                </span>
                <span className="hidden sm:block">{label}</span>
                {active && (
                  <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-t-full bg-ink-900" />
                )}
              </Link>
            );
          })}

          {/* Profile menu */}
          <div className="relative ml-1 sm:ml-2" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Account menu"
              className={`flex h-14 min-w-[44px] shrink-0 flex-col items-center justify-center gap-0.5 px-1.5 text-[11px] font-medium transition-colors duration-150 sm:min-w-[64px] ${
                pathname === "/profile" ? "text-ink-900" : "text-ink-500 hover:text-ink-800"
              }`}
            >
              <Avatar name={user.name} hue={3} size={22} src={avatarSrc} />
              <span className="hidden sm:block">Me</span>
              {pathname === "/profile" && (
                <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-t-full bg-ink-900" />
              )}
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="anim-rise absolute right-0 top-[calc(100%+4px)] w-64 rounded-xl border border-line bg-paper p-2 shadow-lift"
                style={{ animationDuration: "0.18s" }}
              >
                <div className="flex items-center gap-3 rounded-lg p-2.5">
                  <Avatar name={user.name} hue={3} size={40} src={avatarSrc} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-900">{user.name}</p>
                    <p className="truncate text-xs text-ink-500">{user.headline}</p>
                  </div>
                </div>
                <div className="mx-2.5 mb-2 flex items-center gap-1.5 text-xs text-ink-500">
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
                <div className="my-1 border-t border-line" />
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
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
        </nav>
      </div>
    </header>
  );
}
