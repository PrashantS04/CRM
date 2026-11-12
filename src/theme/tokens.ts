/**
 * Design tokens — the ONLY place where colours, radii and shadows are defined.
 *
 *  - MUI reads these through `muiTheme.ts`.
 *  - Tailwind reads them as CSS variables (`--pi-*`, written by `cssVars.ts`
 *    and mapped to utility names in `styles/index.css`).
 *  - Charts import `chartSeries` directly.
 *
 * To re-skin the app, change a value here. Never hard-code a hex value elsewhere.
 */

export const palette = {
  // Brand
  brand: '#ee3f34',
  brandDark: '#d53b31',
  brandTint: '#fff5f4',
  brandSoft: '#fff0ef',
  brandBorder: '#f5a8a1',

  // Secondary accent
  teal: '#17938d',
  tealSoft: '#e9f7f5',
  tealText: '#16857d',

  // Text
  ink: '#101827',
  navy: '#172033',
  text: '#26344a',
  textSoft: '#53627a',
  muted: '#6f7e94',
  subtle: '#8490a3',

  // Surfaces and lines
  canvas: '#f5f7fb',
  surface: '#ffffff',
  surfaceAlt: '#f9fafc',
  column: '#f1f5f9',
  line: '#e2e8f0',
  lineSoft: '#edf1f5',
  lineStrong: '#dbe3ed',

  // Neutral chips and pills
  neutralSoft: '#f1f4f7',
  neutralText: '#65738a',

  // Status
  success: '#20a464',
  successSoft: '#eff8f3',
  successStrong: '#29945a',
  warning: '#d29f38',
  warningSoft: '#fff8e8',
  warningText: '#75520d',
  amberSoft: '#fff6e7',
  noticeBg: '#fff7ed',
  noticeBorder: '#fde6bf',
  noticeText: '#825c1a',
  info: '#2866a4',
  infoSoft: '#e7f1ff',
  purple: '#8d58c7',
  purpleSoft: '#f3ebfc',

  // Chart series (ordered)
  chart1: '#203757',
  chart2: '#227d83',
  chart3: '#55aaa5',
  chart4: '#94ceca',
  chart5: '#d2aa55',

  // Overlays
  overlay: '#17203366',
} as const

export type PaletteKey = keyof typeof palette

export const radius = {
  chip: '5px',
  control: '7px',
  input: '6px',
  card: '10px',
  pill: '9px',
  dialog: '12px',
} as const

export const shadow = {
  card: '0 4px 16px #20304a08',
  cardSm: '0 2px 7px #17203308',
  cardHover: '0 7px 20px #20304a12',
  primary: '0 4px 10px #ee3f3430',
  dialog: '0 25px 70px #17203355',
} as const

/** Ordered colours for multi-series charts. */
export const chartSeries = [
  palette.chart1,
  palette.chart2,
  palette.chart3,
  palette.chart4,
  palette.chart5,
] as const

export const fontFamily = 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif'
