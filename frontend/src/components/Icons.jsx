// ============================================================
//  Iconos en linea (SVG) para no depender de librerias extra.
//  Cada icono acepta className para tamano/color.
// ============================================================
const base = 'w-5 h-5';
const I = (path, viewBox = '0 0 24 24') => ({ className = base } = {}) => (
  <svg className={className} viewBox={viewBox} fill="none" stroke="currentColor" strokeWidth="1.8"
       strokeLinecap="round" strokeLinejoin="round">{path}</svg>
);

export const IconDashboard = I(<><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></>);
export const IconUsers = I(<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>);
export const IconMoney = I(<><rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 12h.01M18 12h.01"/></>);
export const IconDumbbell = I(<><path d="M6.5 6.5 17.5 17.5M3 6v6M6 3h0M6 21h0M3 18v-6M21 18v-6M18 3v0M18 21v0M21 6v6"/><path d="m4.5 4.5 3 3M16.5 16.5l3 3M7.5 4.5l-3 3M19.5 16.5l-3 3"/></>);
export const IconChart = I(<><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></>);
export const IconCalendar = I(<><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>);
export const IconBox = I(<><path d="M21 8 12 3 3 8l9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></>);
export const IconCheck = I(<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></>);
export const IconSun = I(<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/></>);
export const IconMoon = I(<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/>);
export const IconLogout = I(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/></>);
export const IconPlus = I(<><path d="M12 5v14M5 12h14"/></>);
export const IconTrash = I(<><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></>);
export const IconEdit = I(<><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></>);
export const IconMenu = I(<><path d="M3 12h18M3 6h18M3 18h18"/></>);
export const IconX = I(<><path d="M18 6 6 18M6 6l12 12"/></>);
export const IconUser = I(<><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></>);
export const IconAlert = I(<><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><path d="M12 9v4M12 17h.01"/></>);
