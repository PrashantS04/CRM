import { createTheme } from '@mui/material/styles'
import { fontFamily, palette, radius, shadow } from './tokens'

/** MUI theme derived entirely from design tokens. */
export const muiTheme = createTheme({
  palette: {
    primary: { main: palette.brand, dark: palette.brandDark, contrastText: palette.surface },
    secondary: { main: palette.teal },
    success: { main: palette.success },
    warning: { main: palette.warning },
    info: { main: palette.info },
    error: { main: palette.brand },
    text: { primary: palette.text, secondary: palette.muted },
    background: { default: palette.canvas, paper: palette.surface },
    divider: palette.line,
  },
  shape: { borderRadius: 7 },
  typography: {
    fontFamily,
    fontSize: 14,
    h1: { fontSize: 30, fontWeight: 700, letterSpacing: '-0.8px', color: palette.ink },
    h2: { fontSize: 18, fontWeight: 700, color: palette.navy },
    button: { textTransform: 'none', fontWeight: 600, fontSize: 13 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: radius.control,
          padding: '9px 14px',
          lineHeight: 1.25,
        },
        contained: { boxShadow: shadow.primary },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: radius.input,
          fontSize: 14,
          backgroundColor: palette.surface,
          color: palette.text,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: palette.lineStrong },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: palette.subtle },
        },
        input: { padding: '10px 11px', height: 20 },
      },
    },
    MuiSelect: {
      styleOverrides: { select: { minHeight: 20, display: 'flex', alignItems: 'center' } },
    },
    MuiInputLabel: {
      styleOverrides: { root: { fontSize: 14 } },
    },
    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 0, borderBottom: `1px solid ${palette.line}` },
        list: { gap: 18 },
        indicator: { height: 2, backgroundColor: palette.brand },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 0,
          minWidth: 0,
          padding: '0 2px 12px',
          color: palette.muted,
          fontWeight: 600,
          '&.Mui-selected': { color: palette.brand },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: radius.dialog, boxShadow: shadow.dialog },
        root: { '& .MuiBackdrop-root': { backgroundColor: palette.overlay } },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '13px 14px',
          fontSize: 13,
          borderBottom: `1px solid ${palette.lineSoft}`,
          color: palette.text,
        },
        head: {
          backgroundColor: palette.surfaceAlt,
          color: palette.neutralText,
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.2px',
        },
      },
    },
    MuiCheckbox: { defaultProps: { size: 'small' } },
    MuiSwitch: { defaultProps: { color: 'primary' } },
  },
})
