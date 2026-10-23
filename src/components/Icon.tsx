import type { IssueId } from "@/lib/types";

export type IconName =
  | IssueId
  | "call" | "copy" | "map" | "camera" | "arrow" | "locate" | "back" | "mail" | "form" | "check" | "search" | "sun" | "moon";

// One stroke family (24px grid, 2.2 stroke, round joins) for every icon in the app.
const PATHS: Record<IconName, React.ReactNode> = {
  call: <path d="M5 3h4l2 5-3 2a12 12 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A18 18 0 0 1 3 5a2 2 0 0 1 2-2z" />,
  copy: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" />
    </>
  ),
  map: (
    <>
      <path d="M12 21s7-6 7-12a7 7 0 0 0-14 0c0 6 7 12 7 12z" />
      <circle cx="12" cy="9" r="2.5" />
    </>
  ),
  camera: (
    <>
      <path d="M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13" r="4" />
    </>
  ),
  arrow: <path d="M6 18 18 6M8 6h10v10" />,
  locate: (
    <>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </>
  ),
  back: <path d="M15 5 8 12l7 7" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  form: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </>
  ),
  check: <path d="m5 12 5 5 9-10" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-4.5-4.5" />
    </>
  ),
  pothole: (
    <>
      <path d="M2 18h20" />
      <path d="M6 18c1-3 3-4 6-4s5 1 6 4" />
      <path d="M9 10l1.5-3M14 10l-1-4M17 11l2-2" />
    </>
  ),
  streetlight: (
    <>
      <path d="M8 21V6a3 3 0 0 1 3-3h4" />
      <path d="M13 3h6l-1 3h-4z" />
      <path d="M5 21h6" />
    </>
  ),
  signal: (
    <>
      <rect x="8" y="2" width="8" height="16" rx="2" />
      <circle cx="12" cy="6" r="1.5" />
      <circle cx="12" cy="10" r="1.5" />
      <circle cx="12" cy="14" r="1.5" />
      <path d="M12 18v4" />
    </>
  ),
  "sign-traffic": (
    <>
      <path d="M8.5 3h7L20 7.5v7L15.5 19h-7L4 14.5v-7z" />
      <path d="M12 19v3" />
    </>
  ),
  "sign-street-name": (
    <>
      <rect x="3" y="5" width="18" height="7" rx="1" />
      <path d="M12 12v10M7 8.5h10" />
    </>
  ),
  flooding: (
    <>
      <path d="M2 13c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2" />
      <path d="M2 18c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2" />
      <path d="M12 3v5M9.5 5.5 12 8l2.5-2.5" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16M9 7V4h6v3" />
      <path d="M6 7l1 14h10l1-14" />
    </>
  ),
  "abandoned-car": (
    <>
      <path d="M3 16v-4l2-5h14l2 5v4z" />
      <circle cx="7.5" cy="17" r="2" />
      <circle cx="16.5" cy="17" r="2" />
      <path d="M3 12h18" />
    </>
  ),
  federal: (
    <>
      <path d="M3 21h18M5 18h14M6 18v-7M10 18v-7M14 18v-7M18 18v-7" />
      <path d="M4 11h16L12 4z" />
    </>
  ),
};

export function Icon({ name, size = 24, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {PATHS[name]}
    </svg>
  );
}
