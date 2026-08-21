// Modernist tokens as used by the Vantage Driver screens.
// Source of truth is design/modernist-styles.css — prefer var(--color-*) in CSS and use these
// only where JS needs a literal (Leaflet polylines, canvas strokes, inline styles).

export const color = {
  bg: '#f3f2f2',
  surface: '#eae9e9',
  text: '#201e1d',
  accent: '#ec3013',
  divider: 'rgba(32,30,29,.40)',
  /** uppercase status labels, Queued/Held states, secondary meta */
  muted: 'rgba(32,30,29,.45)',
  /** hover / active tints on tappable surfaces */
  hover: 'rgba(32,30,29,.08)',
  pressed: 'rgba(32,30,29,.14)',
  /** phone bezel — chrome only, not a UI colour */
  bezel: '#141312',
  mapVoid: '#dddbda',
  neutral: {
    100: '#f8f4f4', 200: '#eae7e7', 300: '#d7d3d3', 400: '#bab6b6', 500: '#9b9797',
    600: '#7d7979', 700: '#605d5d', 800: '#444141', 900: '#2d2b2b',
  },
  accentRamp: {
    100: '#fff2ef', 200: '#ffe0d9', 300: '#ffc4b8', 400: '#ff9783', 500: '#ff563c',
    600: '#dd2b0f', 700: '#ae1800', 800: '#7c1405', 900: '#4d170e',
  },
} as const;

/** Body copy in accent must use 700+; #ec3013 on the ground is 3:1 — chrome and large text only. */
export const accentText = color.accentRamp[700];

/** The two warning panels: accent-100 fill, 1px accent border, 800 heading, 900 body. */
export const warnPanel = {
  background: color.accentRamp[100],
  border: `1px solid ${color.accent}`,
  heading: color.accentRamp[800],
  body: color.accentRamp[900],
} as const;

export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32 } as const;

/** Zero. Everywhere. The bezel and the gesture pill are hardware, not UI. */
export const radius = 0;

export const font = {
  family: '"Archivo", system-ui, sans-serif',
  weight: { body: 400, medium: 600, heading: 800 },
} as const;

export const type = {
  screenKicker: { size: 9, weight: 600, tracking: '.14em', transform: 'uppercase' },
  screenTitle: { size: 19, weight: 800, lineHeight: 1.15, tracking: '-.01em' },
  hero: { size: 46, weight: 800, lineHeight: 0.96, tracking: '-.03em' },
  bigNumber: { size: 28, weight: 800, lineHeight: 1, tracking: '-.02em' },
  amount: { size: 40, weight: 800, lineHeight: 1, tracking: '-.02em' },
  cardTitle: { size: 18, weight: 800, lineHeight: 1.15 },
  rowTitle: { size: 15, weight: 600, lineHeight: 1.2 },
  body: { size: 13, weight: 400, lineHeight: 1.5 },
  bodySmall: { size: 12, weight: 400, lineHeight: 1.45 },
  meta: { size: 11, weight: 400, lineHeight: 1.45 },
  fieldLabel: { size: 10, weight: 600, tracking: '.10em', transform: 'uppercase' },
  sectionLabel: { size: 10, weight: 600, tracking: '.14em', transform: 'uppercase' },
  statusLabel: { size: 9, weight: 600, tracking: '.10em', transform: 'uppercase' },
  tag: { size: 9, weight: 600, tracking: '.08em' },
  buttonLabel: { size: 13, weight: 600 },
  buttonLabelPrimary: { size: 15, weight: 600 },
} as const;

/** Gloves, sunlight, one hand. Nothing tappable goes under 44. */
export const touch = { min: 44, choiceRow: 52, choiceRowTall: 58, keypad: 56, primary: 56 } as const;

export const phone = {
  bezelWidth: 413, bezelHeight: 872, bezelPadding: 10, bezelRadius: 44,
  screenWidth: 393, screenHeight: 852, screenRadius: 34,
  statusBarHeight: 38, gestureBarHeight: 26, gutter: 18,
} as const;

export const rule = { hairline: '1px', section: '2px', accentEdge: '4px' } as const;

export const map = {
  tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '© OpenStreetMap',
  tileFilter: 'grayscale(1) contrast(1.06) brightness(1.03)',
  route: { color: color.accent, weight: 4, opacity: 0.95 },
  routeRun: { color: color.text, weight: 2, opacity: 0.35, dashArray: '5 5' },
  marker: { size: 26, borderWidth: 2, borderColor: color.bg },
  fitPad: 0.16,
} as const;

export const signature = {
  canvas: { width: 321, height: 150 },
  stroke: { color: color.text, lineWidth: 2.4, lineJoin: 'round', lineCap: 'round' },
} as const;

/** Focus is always the accent ring — never the browser default. */
export const focusRing = `outline: 2px solid ${color.accent}; outline-offset: 2px;`;

/** Disabled controls dim AND say what is missing. Never a dead control. */
export const disabledOpacity = 0.45;

export const navigateIntent = (lat: number, lng: number) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
