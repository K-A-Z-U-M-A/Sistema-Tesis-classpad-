import { createTheme } from "@mui/material/styles";

// ─── M3 Expressive Tonal Palette ──────────────────────────────────────────────
// Based on: https://m3.material.io/styles/color/the-color-system/key-colors-tones
// Primary: Violet #6750A4 (M3 canonical)
// Secondary: #625B71 | Tertiary: #7D5260
const m3 = {
  // Primary
  primary:            "#6750A4",
  onPrimary:          "#FFFFFF",
  primaryContainer:   "#EADDFF",
  onPrimaryContainer: "#21005D",

  // Secondary
  secondary:            "#625B71",
  onSecondary:          "#FFFFFF",
  secondaryContainer:   "#E8DEF8",
  onSecondaryContainer: "#1D192B",

  // Tertiary
  tertiary:            "#7D5260",
  onTertiary:          "#FFFFFF",
  tertiaryContainer:   "#FFD8E4",
  onTertiaryContainer: "#31111D",

  // Surface & Background
  background:          "#FFFBFE",
  onBackground:        "#1C1B1F",
  surface:             "#FFFBFE",
  onSurface:           "#1C1B1F",
  surfaceVariant:      "#E7E0EC",
  onSurfaceVariant:    "#49454F",
  surfaceContainer:    "#F3EDF7",
  surfaceContainerHigh:"#ECE6F0",
  surfaceContainerLow: "#F7F2FA",
  inverseSurface:      "#313033",
  inverseOnSurface:    "#F4EFF4",
  inversePrimary:      "#D0BCFF",

  // Outline
  outline:        "#79747E",
  outlineVariant: "#CAC4D0",

  // Semantic — using M3 tonal approach
  error:            "#B3261E",
  onError:          "#FFFFFF",
  errorContainer:   "#F9DEDC",
  onErrorContainer: "#410E0B",

  // Success (custom tonal, not in M3 spec but needed)
  success:            "#146C2E",
  successContainer:   "#C6EFD1",
  onSuccessContainer: "#002110",

  // Warning (custom tonal)
  warning:            "#7E5700",
  warningContainer:   "#FFDDB0",
  onWarningContainer: "#2B1700",
};

const fontStack = [
  '"Plus Jakarta Sans"',
  '"Google Sans"',
  '"Inter"',
  "-apple-system",
  "BlinkMacSystemFont",
  '"Segoe UI"',
  "Roboto",
  "sans-serif",
].join(",");

export const theme = createTheme({
  palette: {
    mode: "light",

    primary:   { main: m3.primary,   light: "#9A82DB", dark: "#4A3980", contrastText: m3.onPrimary },
    secondary: { main: m3.secondary, light: "#8E849E", dark: "#3D3750", contrastText: m3.onSecondary },
    error:     { main: m3.error,     light: "#D9534F", dark: "#8C1D18", contrastText: m3.onError },
    warning:   { main: m3.warning,   light: "#C98A00", dark: "#5A3D00", contrastText: "#FFFFFF" },
    success:   { main: m3.success,   light: "#2DA050", dark: "#0A4A1A", contrastText: "#FFFFFF" },
    info:      { main: m3.primary,   light: "#9A82DB", dark: "#4A3980", contrastText: m3.onPrimary },

    background: { default: m3.background, paper: m3.surface },
    text: {
      primary:   m3.onSurface,
      secondary: m3.onSurfaceVariant,
      disabled:  "#B0AABC",
    },
    divider: m3.outlineVariant,

    action: {
      hover:             "rgba(103,80,164,0.08)",
      selected:          m3.secondaryContainer,
      focus:             "rgba(103,80,164,0.12)",
      disabledBackground: m3.surfaceVariant,
      disabled:          "#B0AABC",
    },

    // Custom M3 tokens exposed for sx prop usage
    primaryContainer:        m3.primaryContainer,
    onPrimaryContainer:      m3.onPrimaryContainer,
    secondaryContainer:      m3.secondaryContainer,
    onSecondaryContainer:    m3.onSecondaryContainer,
    tertiaryContainer:       m3.tertiaryContainer,
    onTertiaryContainer:     m3.onTertiaryContainer,
    surfaceVariant:          m3.surfaceVariant,
    onSurfaceVariant:        m3.onSurfaceVariant,
    surfaceContainer:        m3.surfaceContainer,
    surfaceContainerHigh:    m3.surfaceContainerHigh,
    surfaceContainerLow:     m3.surfaceContainerLow,
    outline:                 m3.outline,
    outlineVariant:          m3.outlineVariant,
    successContainer:        m3.successContainer,
    onSuccessContainer:      m3.onSuccessContainer,
    warningContainer:        m3.warningContainer,
    onWarningContainer:      m3.onWarningContainer,
    errorContainer:          m3.errorContainer,
    onErrorContainer:        m3.onErrorContainer,
  },

  typography: {
    fontFamily: fontStack,
    // M3 Type Scale
    displayLarge:  { fontSize: "3.5625rem",  fontWeight: 400, lineHeight: 1.14, letterSpacing: "-0.025rem" },
    displayMedium: { fontSize: "2.8125rem",  fontWeight: 400, lineHeight: 1.16, letterSpacing: "0" },
    displaySmall:  { fontSize: "2.25rem",    fontWeight: 400, lineHeight: 1.22, letterSpacing: "0" },
    headlineLarge: { fontSize: "2rem",       fontWeight: 400, lineHeight: 1.25, letterSpacing: "0" },
    headlineMedium:{ fontSize: "1.75rem",    fontWeight: 400, lineHeight: 1.29, letterSpacing: "0" },
    headlineSmall: { fontSize: "1.5rem",     fontWeight: 400, lineHeight: 1.33, letterSpacing: "0" },
    titleLarge:    { fontSize: "1.375rem",   fontWeight: 700, lineHeight: 1.27, letterSpacing: "0" },
    titleMedium:   { fontSize: "1rem",       fontWeight: 600, lineHeight: 1.5,  letterSpacing: "0.009375rem" },
    titleSmall:    { fontSize: "0.875rem",   fontWeight: 600, lineHeight: 1.43, letterSpacing: "0.00625rem" },
    labelLarge:    { fontSize: "0.875rem",   fontWeight: 600, lineHeight: 1.43, letterSpacing: "0.00625rem" },
    labelMedium:   { fontSize: "0.75rem",    fontWeight: 600, lineHeight: 1.33, letterSpacing: "0.03125rem" },
    labelSmall:    { fontSize: "0.6875rem",  fontWeight: 600, lineHeight: 1.45, letterSpacing: "0.03125rem" },
    bodyLarge:     { fontSize: "1rem",       fontWeight: 400, lineHeight: 1.5,  letterSpacing: "0.03125rem" },
    bodyMedium:    { fontSize: "0.875rem",   fontWeight: 400, lineHeight: 1.43, letterSpacing: "0.015625rem" },
    bodySmall:     { fontSize: "0.75rem",    fontWeight: 400, lineHeight: 1.33, letterSpacing: "0.025rem" },
    // MUI variant mapping to M3 scale
    h1:       { fontSize: "2rem",       fontWeight: 700, lineHeight: 1.25, letterSpacing: "-0.01em" },
    h2:       { fontSize: "1.75rem",    fontWeight: 700, lineHeight: 1.29, letterSpacing: "-0.005em" },
    h3:       { fontSize: "1.375rem",   fontWeight: 700, lineHeight: 1.27, letterSpacing: "0" },
    h4:       { fontSize: "1.125rem",   fontWeight: 600, lineHeight: 1.35, letterSpacing: "0" },
    h5:       { fontSize: "1rem",       fontWeight: 600, lineHeight: 1.5,  letterSpacing: "0" },
    h6:       { fontSize: "0.875rem",   fontWeight: 600, lineHeight: 1.43, letterSpacing: "0" },
    subtitle1:{ fontSize: "1rem",       fontWeight: 500, lineHeight: 1.5  },
    subtitle2:{ fontSize: "0.875rem",   fontWeight: 600, lineHeight: 1.57 },
    body1:    { fontSize: "1rem",       fontWeight: 400, lineHeight: 1.5  },
    body2:    { fontSize: "0.875rem",   fontWeight: 400, lineHeight: 1.43 },
    button:   { fontSize: "0.875rem",   fontWeight: 600, textTransform: "none", letterSpacing: "0.00625rem" },
    caption:  { fontSize: "0.75rem",    fontWeight: 400, lineHeight: 1.33, letterSpacing: "0.025rem" },
    overline: { fontSize: "0.6875rem",  fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" },
  },

  // M3 Shape Scale — 5 levels
  shape: { borderRadius: 16 },

  shadows: [
    "none",
    "0px 1px 2px rgba(0,0,0,0.30), 0px 1px 3px 1px rgba(0,0,0,0.15)",
    "0px 1px 2px rgba(0,0,0,0.30), 0px 2px 6px 2px rgba(0,0,0,0.15)",
    "0px 4px 8px 3px rgba(0,0,0,0.15), 0px 1px 3px rgba(0,0,0,0.30)",
    "0px 6px 10px 4px rgba(0,0,0,0.15), 0px 2px 3px rgba(0,0,0,0.30)",
    "0px 8px 12px 6px rgba(0,0,0,0.15), 0px 4px 4px rgba(0,0,0,0.30)",
    "0px 10px 14px 8px rgba(0,0,0,0.15), 0px 6px 6px rgba(0,0,0,0.30)",
    "0px 1px 2px rgba(0,0,0,0.30), 0px 1px 3px 1px rgba(0,0,0,0.15)",
    "0px 1px 2px rgba(0,0,0,0.30), 0px 2px 6px 2px rgba(0,0,0,0.15)",
    "0px 4px 8px 3px rgba(0,0,0,0.15), 0px 1px 3px rgba(0,0,0,0.30)",
    "0px 6px 10px 4px rgba(0,0,0,0.15), 0px 2px 3px rgba(0,0,0,0.30)",
    "0px 8px 12px 6px rgba(0,0,0,0.15), 0px 4px 4px rgba(0,0,0,0.30)",
    "0px 10px 14px 8px rgba(0,0,0,0.15), 0px 6px 6px rgba(0,0,0,0.30)",
    "0px 10px 14px 8px rgba(0,0,0,0.15), 0px 6px 6px rgba(0,0,0,0.30)",
    "0px 10px 14px 8px rgba(0,0,0,0.15), 0px 6px 6px rgba(0,0,0,0.30)",
    "0px 10px 14px 8px rgba(0,0,0,0.15), 0px 6px 6px rgba(0,0,0,0.30)",
    "0px 10px 14px 8px rgba(0,0,0,0.15), 0px 6px 6px rgba(0,0,0,0.30)",
    "0px 10px 14px 8px rgba(0,0,0,0.15), 0px 6px 6px rgba(0,0,0,0.30)",
    "0px 10px 14px 8px rgba(0,0,0,0.15), 0px 6px 6px rgba(0,0,0,0.30)",
    "0px 10px 14px 8px rgba(0,0,0,0.15), 0px 6px 6px rgba(0,0,0,0.30)",
    "0px 10px 14px 8px rgba(0,0,0,0.15), 0px 6px 6px rgba(0,0,0,0.30)",
    "0px 10px 14px 8px rgba(0,0,0,0.15), 0px 6px 6px rgba(0,0,0,0.30)",
    "0px 10px 14px 8px rgba(0,0,0,0.15), 0px 6px 6px rgba(0,0,0,0.30)",
    "0px 10px 14px 8px rgba(0,0,0,0.15), 0px 6px 6px rgba(0,0,0,0.30)",
    "0px 10px 14px 8px rgba(0,0,0,0.15), 0px 6px 6px rgba(0,0,0,0.30)",
  ],

  breakpoints: { values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1440 } },

  components: {

    // ── Button (M3 Filled / Outlined / Text / Tonal) ─────────────────────────
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: "100px",      // M3 Expressive pill
          textTransform: "none",
          fontWeight: 600,
          fontSize: "0.875rem",
          letterSpacing: "0.00625rem",
          lineHeight: 1,
          height: 40,
          paddingLeft: 24,
          paddingRight: 24,
          boxShadow: "none",
          transition: "background-color 200ms, box-shadow 200ms, transform 100ms",
          "&:hover":        { boxShadow: "none" },
          "&:active":       { transform: "scale(0.98)", boxShadow: "none" },
          "&:focus-visible":{ outline: `3px solid ${m3.primaryContainer}`, outlineOffset: 2 },
        },
        sizeSmall: { height: 32,  fontSize: "0.8125rem", paddingLeft: 16, paddingRight: 16 },
        sizeLarge: { height: 48,  fontSize: "0.9375rem", paddingLeft: 32, paddingRight: 32 },
        contained: {
          backgroundColor: m3.primary,
          color: m3.onPrimary,
          "&:hover": { backgroundColor: "#7965AF", boxShadow: "0px 1px 2px rgba(0,0,0,0.30), 0px 1px 3px 1px rgba(0,0,0,0.15)" },
        },
        outlined: {
          borderColor: m3.outline,
          borderWidth: "1px",
          color: m3.primary,
          "&:hover": { borderWidth: "1px", backgroundColor: "rgba(103,80,164,0.08)" },
        },
        text: {
          color: m3.primary,
          "&:hover": { backgroundColor: "rgba(103,80,164,0.08)" },
        },
        // M3 Tonal Button (secondary variant)
        containedSecondary: {
          backgroundColor: m3.secondaryContainer,
          color: m3.onSecondaryContainer,
          "&:hover": { backgroundColor: "#D5C8F0", boxShadow: "0px 1px 2px rgba(0,0,0,0.30), 0px 1px 3px 1px rgba(0,0,0,0.15)" },
        },
        containedError: {
          backgroundColor: m3.error,
          color: m3.onError,
          "&:hover": { backgroundColor: "#C1392E" },
        },
      },
    },

    // ── IconButton ───────────────────────────────────────────────────────────
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: "50%",
          transition: "background-color 200ms",
          "&:hover": { backgroundColor: "rgba(103,80,164,0.08)" },
          "&:focus-visible": { outline: `3px solid ${m3.primaryContainer}`, outlineOffset: 2 },
        },
        sizeSmall: { borderRadius: "50%", padding: 6 },
      },
    },

    // ── Card (M3 Filled Card) ────────────────────────────────────────────────
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 28,               // M3 Extra Large shape
          boxShadow: "none",
          border: `1px solid ${m3.outlineVariant}`,
          backgroundColor: m3.surface,
          transition: "box-shadow 200ms, transform 200ms",
          "&:hover": {
            boxShadow: "0px 1px 2px rgba(0,0,0,0.30), 0px 1px 3px 1px rgba(0,0,0,0.15)",
          },
        },
      },
    },

    MuiCardContent: {
      styleOverrides: {
        root: { padding: "20px", "&:last-child": { paddingBottom: "20px" } },
      },
    },

    // ── Paper (M3 Surface) ───────────────────────────────────────────────────
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: "none", borderRadius: 16 },
        outlined: { border: `1px solid ${m3.outlineVariant}` },
        elevation1: { boxShadow: "0px 1px 2px rgba(0,0,0,0.30), 0px 1px 3px 1px rgba(0,0,0,0.15)" },
        elevation2: { boxShadow: "0px 1px 2px rgba(0,0,0,0.30), 0px 2px 6px 2px rgba(0,0,0,0.15)" },
        elevation3: { boxShadow: "0px 4px 8px 3px rgba(0,0,0,0.15), 0px 1px 3px rgba(0,0,0,0.30)" },
      },
    },

    // ── Chip (M3 Assist / Filter / Input Chips) ──────────────────────────────
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: "100px",          // M3 pill chip
          fontWeight: 500,
          fontSize: "0.875rem",
          height: 32,
          border: `1px solid ${m3.outlineVariant}`,
          transition: "background-color 200ms, box-shadow 200ms",
          "&:hover": { boxShadow: "0px 1px 2px rgba(0,0,0,0.30)" },
        },
        label: { paddingLeft: 12, paddingRight: 12 },
        sizeSmall: { height: 24, fontSize: "0.75rem" },
        colorPrimary: {
          backgroundColor: m3.primaryContainer,
          color: m3.onPrimaryContainer,
          border: "none",
        },
        colorSecondary: {
          backgroundColor: m3.secondaryContainer,
          color: m3.onSecondaryContainer,
          border: "none",
        },
        colorSuccess: {
          backgroundColor: m3.successContainer,
          color: m3.onSuccessContainer,
          border: "none",
        },
        colorError: {
          backgroundColor: m3.errorContainer,
          color: m3.onErrorContainer,
          border: "none",
        },
        colorWarning: {
          backgroundColor: m3.warningContainer,
          color: m3.onWarningContainer,
          border: "none",
        },
      },
    },

    // ── TextField & OutlinedInput (M3 Filled / Outlined) ─────────────────────
    // Using 16px radius — prevents label notch clipping bug
    MuiTextField: {
      defaultProps: { variant: "outlined" },
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: "16px",
            backgroundColor: m3.surfaceContainerLow,
            transition: "background-color 200ms",
            "& fieldset": {
              borderColor: m3.outline,
              borderWidth: "1px",
              transition: "border-color 200ms",
            },
            "&:hover fieldset":       { borderColor: m3.onSurface },
            "&:hover":                { backgroundColor: m3.surfaceContainer },
            "&.Mui-focused fieldset": { borderColor: m3.primary, borderWidth: "2px" },
            "&.Mui-focused":          { backgroundColor: m3.surfaceContainerLow },
            "&.Mui-error fieldset":   { borderColor: m3.error },
            "&.Mui-disabled":         { backgroundColor: m3.surfaceVariant },
          },
          "& .MuiInputLabel-root": {
            color: m3.onSurfaceVariant,
            "&.Mui-focused": { color: m3.primary },
            "&.Mui-error":   { color: m3.error },
          },
          "& .MuiFormHelperText-root": { fontSize: "0.75rem", marginTop: "4px" },
        },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: "16px",
          backgroundColor: m3.surfaceContainerLow,
          "& fieldset": { borderColor: m3.outline, borderWidth: "1px" },
          "&:hover fieldset":       { borderColor: m3.onSurface },
          "&.Mui-focused fieldset": { borderColor: m3.primary, borderWidth: "2px" },
          "&.Mui-error fieldset":   { borderColor: m3.error },
        },
      },
    },

    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: "0.875rem",
          color: m3.onSurfaceVariant,
          "&.Mui-focused": { color: m3.primary },
        },
      },
    },

    MuiFormHelperText: {
      styleOverrides: { root: { fontSize: "0.75rem", marginTop: 4 } },
    },

    // ── AppBar (M3 Top App Bar) ───────────────────────────────────────────────
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: m3.surface,
          borderBottom: `1px solid ${m3.outlineVariant}`,
          boxShadow: "none",
          color: m3.onSurface,
        },
      },
    },

    MuiToolbar: {
      styleOverrides: {
        root: { minHeight: "64px !important", padding: "0 16px" },
      },
    },

    // ── Drawer (M3 Navigation Drawer) ────────────────────────────────────────
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: m3.surfaceContainerLow,
          borderRight: `1px solid ${m3.outlineVariant}`,
          boxShadow: "none",
        },
      },
    },

    // ── Dialog (M3 Dialog) ───────────────────────────────────────────────────
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 28,
          boxShadow: "0px 4px 8px 3px rgba(0,0,0,0.15), 0px 1px 3px rgba(0,0,0,0.30)",
          backgroundImage: "none",
          backgroundColor: m3.surfaceContainerHigh,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: "1.375rem",
          fontWeight: 700,
          padding: "24px 24px 16px",
          color: m3.onSurface,
          fontFamily: fontStack,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: { root: { padding: "8px 24px 16px" } },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: { padding: "12px 24px 24px", gap: "8px", "& > :not(:first-of-type)": { marginLeft: 0 } },
      },
    },

    // ── Tabs (M3 Primary Tab) ────────────────────────────────────────────────
    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 48 },
        indicator: { height: 3, borderRadius: "3px 3px 0 0", backgroundColor: m3.primary },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
          fontSize: "0.875rem",
          color: m3.onSurfaceVariant,
          minHeight: 48,
          minWidth: 0,
          padding: "0 16px",
          transition: "color 200ms",
          "&.Mui-selected": { color: m3.primary, fontWeight: 600 },
          "&:hover":        { backgroundColor: "rgba(103,80,164,0.08)" },
          "&:focus-visible":{ outline: `3px solid ${m3.primaryContainer}`, outlineOffset: -3, borderRadius: 4 },
        },
      },
    },

    // ── ListItemButton (M3 Nav Item) ─────────────────────────────────────────
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: "100px",          // M3 Stadium pill for nav items
          transition: "background-color 200ms",
          "&:focus-visible": { outline: `3px solid ${m3.primaryContainer}`, outlineOffset: -3 },
        },
      },
    },

    // ── Alert (M3 tonal alerts) ───────────────────────────────────────────────
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 16, fontSize: "0.875rem", alignItems: "flex-start" },
        standardInfo:    { backgroundColor: m3.primaryContainer,  color: m3.onPrimaryContainer,  "& .MuiAlert-icon": { color: m3.primary } },
        standardSuccess: { backgroundColor: m3.successContainer,  color: m3.onSuccessContainer,  "& .MuiAlert-icon": { color: m3.success } },
        standardWarning: { backgroundColor: m3.warningContainer,  color: m3.onWarningContainer,  "& .MuiAlert-icon": { color: m3.warning } },
        standardError:   { backgroundColor: m3.errorContainer,    color: m3.onErrorContainer,    "& .MuiAlert-icon": { color: m3.error } },
      },
    },

    // ── Menu ─────────────────────────────────────────────────────────────────
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: "0px 4px 8px 3px rgba(0,0,0,0.15), 0px 1px 3px rgba(0,0,0,0.30)",
          border: `1px solid ${m3.outlineVariant}`,
          backgroundImage: "none",
          backgroundColor: m3.surfaceContainerHigh,
          minWidth: 180,
        },
        list: { padding: "8px" },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: "8px 12px",
          fontSize: "0.875rem",
          minHeight: 40,
          transition: "background-color 200ms",
          color: m3.onSurface,
          "&:hover":    { backgroundColor: `rgba(103,80,164,0.08)` },
          "&.Mui-selected": {
            backgroundColor: m3.secondaryContainer,
            color: m3.onSecondaryContainer,
            "&:hover": { backgroundColor: m3.secondaryContainer },
          },
        },
      },
    },

    // ── Tooltip ───────────────────────────────────────────────────────────────
    MuiTooltip: {
      defaultProps: { arrow: true },
      styleOverrides: {
        tooltip: { backgroundColor: m3.inverseSurface, borderRadius: 8, fontSize: "0.75rem", fontWeight: 500, padding: "6px 12px", color: m3.inverseOnSurface },
        arrow: { color: m3.inverseSurface },
      },
    },

    // ── Badge ─────────────────────────────────────────────────────────────────
    MuiBadge: {
      styleOverrides: {
        badge: { fontSize: "0.6875rem", fontWeight: 700, minWidth: 18, height: 18, padding: "0 4px", lineHeight: "18px" },
      },
    },

    // ── LinearProgress ────────────────────────────────────────────────────────
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: "100px", backgroundColor: m3.primaryContainer, height: 4 },
        bar:  { borderRadius: "100px" },
      },
    },

    MuiCircularProgress: { defaultProps: { size: 28, thickness: 4 } },

    // ── Skeleton ──────────────────────────────────────────────────────────────
    MuiSkeleton: {
      styleOverrides: {
        root:    { borderRadius: 12, backgroundColor: m3.surfaceVariant },
        rounded: { borderRadius: 16 },
      },
    },

    // ── FAB ───────────────────────────────────────────────────────────────────
    MuiFab: {
      styleOverrides: {
        root: {
          borderRadius: 16,                // M3 FAB is rounded square
          backgroundColor: m3.primaryContainer,
          color: m3.onPrimaryContainer,
          boxShadow: "0px 1px 2px rgba(0,0,0,0.30), 0px 1px 3px 1px rgba(0,0,0,0.15)",
          "&:hover": {
            backgroundColor: m3.primaryContainer,
            boxShadow: "0px 1px 2px rgba(0,0,0,0.30), 0px 2px 6px 2px rgba(0,0,0,0.15)",
          },
        },
      },
    },

    // ── Divider ───────────────────────────────────────────────────────────────
    MuiDivider: {
      styleOverrides: { root: { borderColor: m3.outlineVariant } },
    },

    // ── Avatar ────────────────────────────────────────────────────────────────
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontSize: "0.9375rem",
          fontWeight: 600,
          backgroundColor: m3.primaryContainer,
          color: m3.onPrimaryContainer,
        },
        colorDefault: { backgroundColor: m3.primaryContainer, color: m3.onPrimaryContainer },
      },
    },

    // ── Table ─────────────────────────────────────────────────────────────────
    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-head": {
            backgroundColor: m3.surfaceContainer,
            fontWeight: 600,
            fontSize: "0.75rem",
            color: m3.onSurfaceVariant,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            borderBottom: `1px solid ${m3.outlineVariant}`,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: m3.outlineVariant, fontSize: "0.875rem", padding: "12px 16px" },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: { "&:hover": { backgroundColor: `rgba(103,80,164,0.04)` } },
      },
    },

    // ── Accordion ─────────────────────────────────────────────────────────────
    MuiAccordion: {
      defaultProps: { disableGutters: true, elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: "16px !important",
          border: `1px solid ${m3.outlineVariant}`,
          backgroundColor: m3.surfaceContainerLow,
          marginBottom: 8,
          "&:before": { display: "none" },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: { minHeight: 52, padding: "0 16px", "&.Mui-expanded": { minHeight: 52 } },
        content: { margin: "12px 0", "&.Mui-expanded": { margin: "12px 0" } },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: { root: { padding: "0 16px 16px" } },
    },

    // ── Autocomplete ──────────────────────────────────────────────────────────
    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: "0px 4px 8px 3px rgba(0,0,0,0.15), 0px 1px 3px rgba(0,0,0,0.30)",
          border: `1px solid ${m3.outlineVariant}`,
          backgroundColor: m3.surfaceContainerHigh,
        },
        listbox: {
          padding: "8px",
          "& .MuiAutocomplete-option": {
            borderRadius: 8,
            padding: "8px 12px",
            "&[aria-selected=true]": {
              backgroundColor: m3.secondaryContainer,
              color: m3.onSecondaryContainer,
            },
          },
        },
      },
    },

    // ── Select ────────────────────────────────────────────────────────────────
    MuiSelect: {
      styleOverrides: {
        root: { borderRadius: "16px" },
      },
    },

    // ── CssBaseline ───────────────────────────────────────────────────────────
    MuiCssBaseline: {
      styleOverrides: {
        "*": { boxSizing: "border-box" },
        html: { fontSize: "16px", WebkitTextSizeAdjust: "100%" },
        body: {
          fontFamily: fontStack,
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          backgroundColor: m3.background,
          color: m3.onSurface,
        },
        // M3 scrollbar
        "::-webkit-scrollbar": { width: 8, height: 8 },
        "::-webkit-scrollbar-track": { background: "transparent" },
        "::-webkit-scrollbar-thumb": { background: m3.outlineVariant, borderRadius: "100px" },
        "::-webkit-scrollbar-thumb:hover": { background: m3.outline },
        // Reduced motion
        "@media (prefers-reduced-motion: reduce)": {
          "*, *::before, *::after": {
            animationDuration: "0.01ms !important",
            animationIterationCount: "1 !important",
            transitionDuration: "0.01ms !important",
          },
        },
      },
    },
  },
});

export default theme;
