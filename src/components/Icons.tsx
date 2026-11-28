const PATHS = {
  chart: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </>
  ),
  receipt: (
    <>
      <path d="M5 3.5h14v17l-2.4-1.6-2.3 1.6-2.3-1.6-2.3 1.6-2.3-1.6L5 20.5z" />
      <path d="M9 8.5h6M9 12.5h6" />
    </>
  ),
  list: (
    <>
      <path d="M10 6h10M10 12h10M10 18h10" />
      <path d="m3.5 6 1.3 1.3L7.3 4.8M3.5 12l1.3 1.3 2.5-2.5M3.5 18l1.3 1.3 2.5-2.5" />
    </>
  ),
  repeat: (
    <>
      <path d="m17 2.5 3.5 3.5-3.5 3.5" />
      <path d="M3.5 11V10A4 4 0 0 1 7.5 6h13" />
      <path d="m7 21.5-3.5-3.5L7 14.5" />
      <path d="M20.5 13v1a4 4 0 0 1-4 4h-13" />
    </>
  ),
  minus: <path d="M5 12h14" />,
  plus: <path d="M12 5v14M5 12h14" />,
  chevronLeft: <path d="m15 18-6-6 6-6" />,
  chevronRight: <path d="m9 18 6-6-6-6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
    </>
  ),
  moon: <path d="M20.5 13.2A8.5 8.5 0 1 1 10.8 3.5a6.6 6.6 0 0 0 9.7 9.7z" />,
  monitor: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2.5" />
      <path d="M8.5 20h7M12 16v4" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </>
  ),
  logout: (
    <>
      <path d="M14.5 4H18a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3.5" />
      <path d="M10 16.5 5.5 12 10 7.5M5.5 12H15" />
    </>
  ),
  pencil: (
    <>
      <path d="M4 20h4L19 9a2.83 2.83 0 0 0-4-4L4 16z" />
      <path d="m13.5 6.5 4 4" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16M10 11v6M14 11v6" />
      <path d="m6 7 .9 12.1A2 2 0 0 0 8.9 21h6.2a2 2 0 0 0 2-1.9L18 7M9 7V4.5h6V7" />
    </>
  ),
  file: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </>
  ),
  upload: (
    <>
      <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5" />
      <path d="M4 15v3a2.5 2.5 0 0 0 2.5 2.5h11A2.5 2.5 0 0 0 20 18v-3" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  more: (
    <>
      <circle cx="5" cy="12" r="1.3" fill="currentColor" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" />
      <circle cx="19" cy="12" r="1.3" fill="currentColor" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M10.6 5.1A9.6 9.6 0 0 1 12 5c6 0 9.5 7 9.5 7a17 17 0 0 1-2.6 3.5M6.6 6.6C3.9 8.4 2.5 12 2.5 12S6 19 12 19a9 9 0 0 0 5.4-1.6" />
      <path d="M3 3l18 18M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </>
  ),
  arrowUp: <path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" />,
  arrowDown: <path d="M12 5v14M5.5 12.5 12 19l6.5-6.5" />,
  sparkles: (
    <>
      <path d="M12 3.5 13.8 9l5.7 1.8-5.7 1.8L12 18.2l-1.8-5.6L4.5 10.8 10.2 9z" />
      <path d="M19 3v3M17.5 4.5h3" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5" />
      <path d="M4 15v3a2.5 2.5 0 0 0 2.5 2.5h11A2.5 2.5 0 0 0 20 18v-3" />
    </>
  ),
  share: (
    <>
      <path d="M12 3.5v11M8 7.5l4-4 4 4" />
      <path d="M8.5 10.5H7a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6.5a2 2 0 0 0-2-2h-1.5" />
    </>
  ),
  squarePlus: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="3.5" />
      <path d="M12 8.5v7M8.5 12h7" />
    </>
  ),
  home: (
    <>
      <path d="M3.5 10.5 12 3.5l8.5 7" />
      <path d="M5.5 9v10.5a1 1 0 0 0 1 1h4v-6h3v6h4a1 1 0 0 0 1-1V9" />
    </>
  ),
  scale: (
    <>
      <path d="M12 4v16M7 20h10M5 8h14M12 4l-1 4h2z" />
      <path d="m5 8-3 6a3 3 0 0 0 6 0zM19 8l-3 6a3 3 0 0 0 6 0z" />
    </>
  ),
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  className = "w-5 h-5",
  strokeWidth = 1.8,
}: {
  name: IconName;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {PATHS[name]}
    </svg>
  );
}

/** Marca Homi: um telhado sobre duas pessoas. */
export function LogoMark({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" aria-hidden>
      <g transform="translate(0 4)">
        <path d="M20 49 50 24l30 25" stroke="#fff" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="37" cy="64" r="9" fill="#ff8f6b" />
        <circle cx="63" cy="64" r="9" fill="#7be0c3" />
      </g>
    </svg>
  );
}

export function Logo({ className = "w-9 h-9" }: { className?: string }) {
  return (
    <span
      className={`${className} relative grid place-items-center overflow-hidden rounded-[23%] shadow-[0_8px_20px_-8px_#2b2f77]`}
      style={{ background: "#2b2f77" }}
      role="img"
      aria-label="Homi"
    >
      <LogoMark className="h-full w-full" />
    </span>
  );
}
