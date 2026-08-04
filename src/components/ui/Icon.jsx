// Set de iconos lineales propios (un solo estilo consistente en toda la app).
// Se amplía agregando entradas a PATHS; nunca se mezclan con otros sets ni con emoji.
const PATHS = {
  home: 'M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9',
  menu: 'M4 7h16M4 12h16M4 17h16',
  x: 'M6 6l12 12M18 6 6 18',
  'log-out': 'M15 17l5-5-5-5M20 12H9M12 19H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6',
  key: 'M15.5 8.5a3.5 3.5 0 1 1-3.5 3.5M9 15l-5.5 5.5M5 18l2 2M3.5 20.5l1 1M13.5 10.5 21 3',
  'chevron-down': 'M6 9l6 6 6-6',
  bell: 'M6 8a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 12 6 8ZM9.5 17a2.5 2.5 0 0 0 5 0',
  building: 'M4 21V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v16M20 21v-9a1 1 0 0 0-1-1h-7M8 8h.01M8 12h.01M8 16h.01M4 21h16',
  users: 'M16 11a4 4 0 1 0-4-4M8 21v-2a4 4 0 0 1 4-4h1M16 21v-2a4 4 0 0 0-3-3.87M20 21v-2a4 4 0 0 0-3-3.87',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4a1 1 0 0 0-1-1H6.5A2.5 2.5 0 0 0 4 5.5v14ZM4 19.5A2.5 2.5 0 0 1 6.5 17H20',
  folder: 'M3 7a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7Z',
  cash: 'M3 8h18v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8Zm0 0V6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2M12 16a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  chat: 'M4 4h16v11H8l-4 4V4Z',
  'check-square': 'M9 12l2 2 4-4M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5Z',
  award: 'M12 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm-3 2-1 6 4-2 4 2-1-6',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM4.6 10.4l-1.2-.7 1-1.8 1.3.4a7 7 0 0 1 1.6-1l.2-1.3h2l.2 1.3a7 7 0 0 1 1.6 1l1.3-.4 1 1.8-1.2.7a7 7 0 0 1 0 1.9l1.2.7-1 1.8-1.3-.4a7 7 0 0 1-1.6 1l-.2 1.3h-2l-.2-1.3a7 7 0 0 1-1.6-1l-1.3.4-1-1.8 1.2-.7a7 7 0 0 1 0-1.9Z',
  chart: 'M4 20V10M12 20V4M20 20v-7',
  plus: 'M12 5v14M5 12h14',
  pencil: 'M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 16v4Z',
  trash: 'M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m1 0v12a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V7h10Z',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm9 2-4.3-4.3',
  upload: 'M12 16V4m0 0L7 9m5-5 5 5M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2',
  download: 'M12 4v12m0 0-5-5m5 5 5-5M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2',
  more: 'M12 5h.01M12 12h.01M12 19h.01',
  'check-circle': 'M9 12l2 2 4-4M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  'alert-triangle': 'M12 9v4m0 4h.01M10.3 3.9 2.5 17a1 1 0 0 0 .9 1.5h17.2a1 1 0 0 0 .9-1.5L13.7 3.9a1 1 0 0 0-1.7 0Z',
  clock: 'M12 7v5l3 3M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  'help-circle': 'M9.5 9.5a2.5 2.5 0 1 1 3.3 2.4c-.5.2-.8.7-.8 1.2v.4m0 3h.01M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  calendar: 'M8 3v3m8-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z',
  image: 'M4 6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6Zm1 11 5-5 3 3 2.5-2.5L20 16M9.5 9.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z',
  'chevron-left': 'M15 6l-6 6 6 6',
  'chevron-right': 'M9 6l6 6-6 6',
  sun: 'M12 5V3m0 18v-2m7-7h2M3 12h2m11.7-4.7 1.4-1.4M5.9 18.1l1.4-1.4m9.4 0 1.4 1.4M5.9 5.9l1.4 1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
}

export default function Icon({ name, className = 'h-5 w-5', strokeWidth = 1.75 }) {
  const d = PATHS[name]
  if (!d) return null
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d={d} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
