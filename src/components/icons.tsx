interface IconProps {
  size?: number;
  className?: string;
  filled?: boolean;
  style?: React.CSSProperties;
}

function Base({
  size = 20,
  className = "",
  children,
  filled = false,
  style,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      style={style}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const IconHome = (p: IconProps) => (
  <Base {...p}>
    <path d="M3.5 10.5 12 3.5l8.5 7v9a1.5 1.5 0 0 1-1.5 1.5h-4.5v-6.5h-5V21H5a1.5 1.5 0 0 1-1.5-1.5v-9Z" />
  </Base>
);

export const IconSearch = (p: IconProps) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20.5 20.5-4.9-4.9" />
  </Base>
);

export const IconClapper = (p: IconProps) => (
  <Base {...p}>
    <rect x="3" y="9.5" width="18" height="11" rx="2" />
    <path d="m3.4 9.3 1-4.4 17 3-.7 4.1" />
    <path d="m8.2 5.8 2 3.4M13 6.7l2 3.3M17.8 7.6l1.8 3" />
  </Base>
);

export const IconChat = (p: IconProps) => (
  <Base {...p}>
    <path d="M21 12a8 8 0 0 1-11.6 7.2L4 21l1.8-5.4A8 8 0 1 1 21 12Z" />
  </Base>
);

export const IconUser = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 20.5c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" />
  </Base>
);

export const IconMapPin = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </Base>
);

export const IconCalendar = (p: IconProps) => (
  <Base {...p}>
    <rect x="3.5" y="5" width="17" height="16" rx="2" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Base>
);

export const IconSend = (p: IconProps) => (
  <Base {...p}>
    <path d="M21 3 10.5 13.5M21 3l-7 18-3.5-7.5L3 10l18-7Z" />
  </Base>
);

export const IconHeart = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 20.5s-8-4.9-8-11a4.6 4.6 0 0 1 8-3.1 4.6 4.6 0 0 1 8 3.1c0 6.1-8 11-8 11Z" />
  </Base>
);

export const IconComment = (p: IconProps) => (
  <Base {...p}>
    <path d="M20.5 11.5a7.5 7.5 0 0 1-7.5 7.5H5.8L3.5 21V11.5a7.5 7.5 0 0 1 7.5-7.5h2a7.5 7.5 0 0 1 7.5 7.5Z" />
    <path d="M8.5 12h7" />
  </Base>
);

export const IconShare = (p: IconProps) => (
  <Base {...p}>
    <path d="M14 5.5 20.5 12 14 18.5v-4C8 14.5 5 16.5 3.5 20 4 14 7 9.9 14 9.4v-3.9Z" />
  </Base>
);

export const IconCheck = (p: IconProps) => (
  <Base {...p}>
    <path d="m4.5 12.5 5 5 10-11" />
  </Base>
);

export const IconX = (p: IconProps) => (
  <Base {...p}>
    <path d="M5.5 5.5l13 13M18.5 5.5l-13 13" />
  </Base>
);

export const IconArrowRight = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 12h16m0 0-6.5-6.5M20 12l-6.5 6.5" />
  </Base>
);

export const IconArrowLeft = (p: IconProps) => (
  <Base {...p}>
    <path d="M20 12H4m0 0 6.5-6.5M4 12l6.5 6.5" />
  </Base>
);

export const IconPlay = (p: IconProps) => (
  <Base {...p} filled>
    <path d="M8 5.5v13a.8.8 0 0 0 1.2.7l10.4-6.5a.8.8 0 0 0 0-1.4L9.2 4.8A.8.8 0 0 0 8 5.5Z" />
  </Base>
);

export const IconPause = (p: IconProps) => (
  <Base {...p} filled>
    <rect x="6.5" y="5" width="3.6" height="14" rx="1" />
    <rect x="13.9" y="5" width="3.6" height="14" rx="1" />
  </Base>
);

export const IconEdit = (p: IconProps) => (
  <Base {...p}>
    <path d="M15.5 5 19 8.5 8.5 19H5v-3.5L15.5 5Z" />
    <path d="m13.5 7 3.5 3.5" />
  </Base>
);

export const IconLogout = (p: IconProps) => (
  <Base {...p}>
    <path d="M14 4H6.5A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20H14" />
    <path d="M10 12h10.5m0 0-4-4m4 4-4 4" />
  </Base>
);

export const IconBadge = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="9" r="5.5" />
    <path d="m8.8 13.5-1.3 7 4.5-2.6 4.5 2.6-1.3-7" />
  </Base>
);

export const IconClock = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2.5" />
  </Base>
);

export const IconUsers = (p: IconProps) => (
  <Base {...p}>
    <circle cx="9" cy="8.5" r="3.5" />
    <path d="M2.8 19.5c1-3 3.4-4.7 6.2-4.7s5.2 1.7 6.2 4.7" />
    <path d="M15.5 5.3a3.5 3.5 0 0 1 0 6.4M18 15.2c1.6.8 2.8 2.2 3.4 4.3" />
  </Base>
);

export const IconChevronDown = (p: IconProps) => (
  <Base {...p}>
    <path d="m6 9.5 6 6 6-6" />
  </Base>
);

export const IconFilm = (p: IconProps) => (
  <Base {...p}>
    <rect x="3.5" y="4" width="17" height="16" rx="2" />
    <path d="M8 4v16M16 4v16M3.5 9h4.5M3.5 15h4.5M16 9h4.5M16 15h4.5" />
  </Base>
);

export const IconBriefcase = (p: IconProps) => (
  <Base {...p}>
    <rect x="3.5" y="7.5" width="17" height="12.5" rx="2" />
    <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3.5 12.5h17" />
  </Base>
);

export const IconBookmark = (p: IconProps) => (
  <Base {...p}>
    <path d="M6.5 4.5h11a1 1 0 0 1 1 1V20l-6.5-4-6.5 4V5.5a1 1 0 0 1 1-1Z" />
  </Base>
);

export const IconMail = (p: IconProps) => (
  <Base {...p}>
    <rect x="3" y="5.5" width="18" height="13" rx="2.2" />
    <path d="m4 7 8 6.2L20 7" />
  </Base>
);

export const IconPlus = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);

export const IconBell = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 9a6 6 0 0 1 12 0c0 4 1.2 5.6 2 6.5H4c.8-.9 2-2.5 2-6.5Z" />
    <path d="M9.5 19a2.5 2.5 0 0 0 5 0" />
  </Base>
);

export const IconSparkle = (p: IconProps) => (
  <Base {...p} filled>
    <path d="M12 2.6c.5 3.9 1.9 5.3 5.8 5.8-3.9.5-5.3 1.9-5.8 5.8-.5-3.9-1.9-5.3-5.8-5.8 3.9-.5 5.3-1.9 5.8-5.8Z" />
    <path d="M18.5 13.5c.3 1.9.9 2.5 2.8 2.8-1.9.3-2.5.9-2.8 2.8-.3-1.9-.9-2.5-2.8-2.8 1.9-.3 2.5-.9 2.8-2.8Z" />
  </Base>
);

export const IconFire = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3s5 3.6 5 9a5 5 0 0 1-10 0c0-1.4.5-2.6 1.2-3.4C8.6 10 9 11 10 11c0-2.5.8-6 2-8Z" />
  </Base>
);
