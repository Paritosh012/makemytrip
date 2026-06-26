// Lightweight inline SVG icons (stroke-based, inherit currentColor).
const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  viewBox: "0 0 24 24",
};

export const IconPlane = (p) => (
  <svg {...base} {...p}><path d="M17.8 19.2 16 11l3.5-3.5a2.1 2.1 0 0 0-3-3L13 8 4.8 6.2a.9.9 0 0 0-.9 1.4L8 12l-2 3-2-.5a.7.7 0 0 0-.7 1.1l2 2.4 2.4 2a.7.7 0 0 0 1.1-.7L10 18l3-2 3.4 4.1a.9.9 0 0 0 1.4-.9Z"/></svg>
);
export const IconSearch = (p) => (
  <svg {...base} {...p}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
);
export const IconPin = (p) => (
  <svg {...base} {...p}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
);
export const IconCalendar = (p) => (
  <svg {...base} {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
);
export const IconShield = (p) => (
  <svg {...base} {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>
);
export const IconCheck = (p) => (
  <svg {...base} {...p}><path d="m20 6-11 11-5-5"/></svg>
);
export const IconClock = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
);
export const IconUsers = (p) => (
  <svg {...base} {...p}><path d="M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1"/><circle cx="9" cy="7" r="4"/><path d="M22 19v-1a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/></svg>
);
export const IconArrowRight = (p) => (
  <svg {...base} {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>
);
export const IconMenu = (p) => (
  <svg {...base} {...p}><path d="M4 6h16M4 12h16M4 18h16"/></svg>
);
export const IconClose = (p) => (
  <svg {...base} {...p}><path d="M18 6 6 18M6 6l12 12"/></svg>
);
export const IconStore = (p) => (
  <svg {...base} {...p}><path d="M3 9 4.5 4h15L21 9M4 9v11h16V9M4 9h16M9 20v-6h6v6"/></svg>
);
export const IconHeadset = (p) => (
  <svg {...base} {...p}><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M4 14a2 2 0 0 0 2 2h1v-5H6a2 2 0 0 0-2 2Zm16 0a2 2 0 0 1-2 2h-1v-5h1a2 2 0 0 1 2 2Z"/><path d="M18 16v1a3 3 0 0 1-3 3h-3"/></svg>
);
export const IconWallet = (p) => (
  <svg {...base} {...p}><path d="M3 7a2 2 0 0 1 2-2h13v4"/><path d="M3 7v10a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-3"/><path d="M21 11v4h-4a2 2 0 0 1 0-4Z"/></svg>
);
