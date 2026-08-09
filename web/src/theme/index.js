import { createTheme } from "@mui/material/styles";

const tokens = {
  primary: "#0A7AFF",
  primaryHover: "#0067D8",
  primaryLight: "#4DA3FF",
  primaryContainer: "#E8F1FF",
  onPrimaryContainer: "#003B75",
  background: "#F5F6FA",
  surface: "#FFFFFF",
  surfaceVariant: "#F0F2F7",
  surfaceContainer: "#F7F8FB",
  surfaceContainerHigh: "#ECEEF4",
  textPrimary: "#1C1B1F",
  textSecondary: "#67666B",
  textDisabled: "#98979D",
  outline: "#D9DCE3",
  outlineVariant: "#E7E9EF",
  success: "#24A148",
  successContainer: "#E5F6EA",
  onSuccessContainer: "#0D4D25",
  warning: "#E78000",
  warningContainer: "#FFF2DC",
  onWarningContainer: "#6B3C00",
  error: "#D93025",
  errorContainer: "#FDE9E7",
  onErrorContainer: "#7D1C15",
};

const fontFamily = [
  "Inter",
  "-apple-system",
  "BlinkMacSystemFont",
  '"Segoe UI"',
  "Roboto",
  "Helvetica",
  "Arial",
  "sans-serif",
].join(",");

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: tokens.primary, light: tokens.primaryLight, dark: tokens.primaryHover, contrastText: "#FFFFFF" },
    secondary: { main: tokens.success, light: "#4DBC6E", dark: "#1A7D38", contrastText: "#FFFFFF" },
    error: { main: tokens.error, light: "#E55E53", dark: "#AD261E", contrastText: "#FFFFFF" },
    warning: { main: tokens.warning, light: "#F0A040", dark: "#C06800", contrastText: "#FFFFFF" },
    success: { main: tokens.success, light: "#4DBC6E", dark: "#1A7D38", contrastText: "#FFFFFF" },
    info: { main: tokens.primary, light: tokens.primaryLight, dark: tokens.primaryHover, contrastText: "#FFFFFF" },
    background: { default: tokens.background, paper: tokens.surface },
    text: { primary: tokens.textPrimary, secondary: tokens.textSecondary, disabled: tokens.textDisabled },
    divider: tokens.outline,
    action: {
      hover: "rgba(10,122,255,0.06)",
      selected: tokens.primaryContainer,
      focus: "rgba(10,122,255,0.12)",
      disabledBackground: tokens.surfaceVariant,
      disabled: tokens.textDisabled,
    },
  },

  typography: {
    fontFamily,
    h1: { fontSize: "1.875rem", fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.02em" },
    h2: { fontSize: "1.5rem", fontWeight: 650, lineHeight: 1.25, letterSpacing: "-0.015em" },
    h3: { fontSize: "1.25rem", fontWeight: 650, lineHeight: 1.3, letterSpacing: "-0.01em" },
    h4: { fontSize: "1.125rem", fontWeight: 600, lineHeight: 1.35 },
    h5: { fontSize: "1rem", fontWeight: 600, lineHeight: 1.4 },
    h6: { fontSize: "0.9375rem", fontWeight: 600, lineHeight: 1.5 },
    subtitle1: { fontSize: "1rem", fontWeight: 500, lineHeight: 1.5 },
    subtitle2: { fontSize: "0.875rem", fontWeight: 600, lineHeight: 1.57 },
    body1: { fontSize: "0.9375rem", lineHeight: 1.6 },
    body2: { fontSize: "0.875rem", lineHeight: 1.57 },
    button: { fontSize: "0.9375rem", fontWeight: 600, textTransform: "none", letterSpacing: "0.005em" },
    caption: { fontSize: "0.75rem", lineHeight: 1.5, letterSpacing: "0.01em" },
    overline: { fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" },
  },

  shape: { borderRadius: 16 },
  spacing: 4,

  shadows: [
    "none",
    "0px 1px 2px rgba(0,0,0,0.06)",
    "0px 1px 4px rgba(0,0,0,0.07)",
    "0px 2px 8px rgba(0,0,0,0.08)",
    "0px 3px 12px rgba(0,0,0,0.09)",
    "0px 4px 16px rgba(0,0,0,0.10)",
    "0px 6px 20px rgba(0,0,0,0.10)",
    "0px 8px 24px rgba(0,0,0,0.11)",
    "0px 10px 28px rgba(0,0,0,0.12)",
    "0px 12px 32px rgba(0,0,0,0.12)",
    "0px 14px 36px rgba(0,0,0,0.13)",
    "0px 16px 40px rgba(0,0,0,0.13)",
    "0px 18px 44px rgba(0,0,0,0.14)",
    "0px 20px 48px rgba(0,0,0,0.14)",
    "0px 22px 52px rgba(0,0,0,0.15)",
    "0px 24px 56px rgba(0,0,0,0.15)",
    "0px 26px 60px rgba(0,0,0,0.16)",
    "0px 28px 64px rgba(0,0,0,0.16)",
    "0px 30px 68px rgba(0,0,0,0.17)",
    "0px 32px 72px rgba(0,0,0,0.17)",
    "0px 34px 76px rgba(0,0,0,0.18)",
    "0px 36px 80px rgba(0,0,0,0.18)",
    "0px 38px 84px rgba(0,0,0,0.19)",
    "0px 40px 88px rgba(0,0,0,0.19)",
    "0px 42px 92px rgba(0,0,0,0.20)",
  ],

  breakpoints: { values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1440 } },

  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 20,
          textTransform: "none",
          fontWeight: 600,
          fontSize: "0.9375rem",
          boxShadow: "none",
          lineHeight: 1,
          height: 44,
          paddingLeft: 20,
          paddingRight: 20,
          transition: "background-color 150ms ease, border-color 150ms ease, color 150ms ease",
          "&:hover": { boxShadow: "none" },
          "&:active": { transform: "scale(0.98)", boxShadow: "none" },
          "&:focus-visible": { outline: "3px solid #E8F1FF", outlineOffset: 2 },
        },
        sizeSmall: { height: 36, fontSize: "0.875rem", paddingLeft: 14, paddingRight: 14, borderRadius: 18 },
        sizeLarge: { height: 52, fontSize: "1rem", paddingLeft: 24, paddingRight: 24, borderRadius: 22 },
        contained: { "&:hover": { backgroundColor: "#0067D8", boxShadow: "none" } },
        containedError: { backgroundColor: "#D93025", "&:hover": { backgroundColor: "#B5281E" } },
        outlined: { borderWidth: "1.5px", "&:hover": { borderWidth: "1.5px", backgroundColor: "rgba(10,122,255,0.05)" } },
        text: { "&:hover": { backgroundColor: "rgba(10,122,255,0.06)" } },
        textError: { "&:hover": { backgroundColor: "rgba(217,48,37,0.06)" } },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          transition: "background-color 150ms ease",
          "&:hover": { backgroundColor: "rgba(0,0,0,0.05)" },
          "&:focus-visible": { outline: "3px solid #E8F1FF", outlineOffset: 2 },
        },
        sizeSmall: { borderRadius: 8, padding: 6 },
      },
    },

    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: "none",
          border: "1px solid #E7E9EF",
          backgroundColor: "#FFFFFF",
          transition: "border-color 150ms ease, box-shadow 150ms ease",
        },
      },
    },

    MuiCardContent: {
      styleOverrides: {
        root: { padding: "20px", "&:last-child": { paddingBottom: "20px" } },
      },
    },

    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: "none", borderRadius: 16 },
        outlined: { border: "1px solid #E7E9EF" },
        elevation1: { boxShadow: "0px 1px 4px rgba(0,0,0,0.07)" },
        elevation2: { boxShadow: "0px 2px 8px rgba(0,0,0,0.08)" },
        elevation3: { boxShadow: "0px 4px 12px rgba(0,0,0,0.09)" },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 100, fontWeight: 500, fontSize: "0.8125rem", height: 28, transition: "background-color 150ms ease" },
        label: { paddingLeft: 10, paddingRight: 10 },
        sizeSmall: { height: 22, fontSize: "0.75rem" },
      },
    },

    MuiTextField: {
      defaultProps: { variant: "outlined" },
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 14,
            backgroundColor: "#FFFFFF",
            "& fieldset": { borderColor: "#D9DCE3", borderWidth: "1.5px", transition: "border-color 150ms ease" },
            "&:hover fieldset": { borderColor: "#0A7AFF" },
            "&.Mui-focused fieldset": { borderColor: "#0A7AFF", borderWidth: 2 },
            "&.Mui-error fieldset": { borderColor: "#D93025" },
            "&.Mui-disabled": { backgroundColor: "#F0F2F7" },
          },
          "& .MuiInputLabel-root": { color: "#67666B", "&.Mui-focused": { color: "#0A7AFF" } },
        },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          "& fieldset": { borderColor: "#D9DCE3", borderWidth: "1.5px" },
          "&:hover fieldset": { borderColor: "#0A7AFF" },
          "&.Mui-focused fieldset": { borderColor: "#0A7AFF", borderWidth: 2 },
        },
      },
    },

    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundColor: "#FFFFFF", borderBottom: "1px solid #E7E9EF", boxShadow: "none", color: "#1C1B1F" },
      },
    },

    MuiToolbar: {
      styleOverrides: {
        root: { minHeight: "64px !important", padding: "0 20px" },
      },
    },

    MuiDrawer: {
      styleOverrides: {
        paper: { backgroundColor: "#FFFFFF", borderRight: "1px solid #E7E9EF", boxShadow: "none" },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 24, boxShadow: "0px 8px 32px rgba(0,0,0,0.16)", backgroundImage: "none" },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: { fontSize: "1.125rem", fontWeight: 600, padding: "20px 24px 12px", color: "#1C1B1F" },
      },
    },
    MuiDialogContent: {
      styleOverrides: { root: { padding: "8px 24px 16px" } },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: { padding: "12px 20px 20px", gap: "8px", "& > :not(:first-of-type)": { marginLeft: 0 } },
      },
    },

    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 48, borderBottom: "1px solid #E7E9EF" },
        indicator: { height: 2.5, borderRadius: 2, backgroundColor: "#0A7AFF" },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
          fontSize: "0.9375rem",
          color: "#67666B",
          minHeight: 48,
          minWidth: 0,
          padding: "0 16px",
          transition: "color 150ms ease",
          "&.Mui-selected": { color: "#0A7AFF", fontWeight: 600 },
          "&:focus-visible": { outline: "3px solid #E8F1FF", outlineOffset: -3, borderRadius: 4 },
        },
      },
    },

    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: "background-color 150ms ease",
          "&:focus-visible": { outline: "3px solid #E8F1FF", outlineOffset: -3 },
        },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 14, fontSize: "0.875rem", alignItems: "flex-start" },
        standardInfo: { backgroundColor: "#E8F1FF", color: "#003B75", "& .MuiAlert-icon": { color: "#0A7AFF" } },
        standardSuccess: { backgroundColor: "#E5F6EA", color: "#0D4D25", "& .MuiAlert-icon": { color: "#24A148" } },
        standardWarning: { backgroundColor: "#FFF2DC", color: "#6B3C00", "& .MuiAlert-icon": { color: "#E78000" } },
        standardError: { backgroundColor: "#FDE9E7", color: "#7D1C15", "& .MuiAlert-icon": { color: "#D93025" } },
      },
    },

    MuiMenu: {
      styleOverrides: {
        paper: { borderRadius: 16, boxShadow: "0px 8px 24px rgba(0,0,0,0.12)", border: "1px solid #E7E9EF", backgroundImage: "none", minWidth: 180 },
        list: { padding: "6px" },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: "8px 12px",
          fontSize: "0.9375rem",
          minHeight: 40,
          transition: "background-color 150ms ease",
          "&:hover": { backgroundColor: "#F0F2F7" },
          "&.Mui-selected": { backgroundColor: "#E8F1FF", color: "#0A7AFF", "&:hover": { backgroundColor: "#E8F1FF" } },
        },
      },
    },

    MuiTooltip: {
      defaultProps: { arrow: true },
      styleOverrides: {
        tooltip: { backgroundColor: "#1C1B1F", borderRadius: 8, fontSize: "0.8125rem", fontWeight: 500, padding: "6px 12px" },
        arrow: { color: "#1C1B1F" },
      },
    },

    MuiBadge: {
      styleOverrides: {
        badge: { fontSize: "0.6875rem", fontWeight: 700, minWidth: 18, height: 18, padding: "0 4px", lineHeight: "18px" },
      },
    },

    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 100, backgroundColor: "#E8F1FF", height: 6 },
        bar: { borderRadius: 100 },
      },
    },

    MuiCircularProgress: { defaultProps: { size: 28, thickness: 4 } },

    MuiSkeleton: {
      styleOverrides: {
        root: { borderRadius: 10, backgroundColor: "rgba(0,0,0,0.06)" },
        rounded: { borderRadius: 16 },
      },
    },

    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: "0px 4px 12px rgba(0,0,0,0.14)",
          "&:hover": { boxShadow: "0px 6px 16px rgba(0,0,0,0.16)" },
        },
      },
    },

    MuiDivider: {
      styleOverrides: { root: { borderColor: "#E7E9EF" } },
    },

    MuiAvatar: {
      styleOverrides: {
        root: { fontSize: "0.9375rem", fontWeight: 600, backgroundColor: "#E8F1FF", color: "#0A7AFF" },
        colorDefault: { backgroundColor: "#E8F1FF", color: "#0A7AFF" },
      },
    },

    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-head": {
            backgroundColor: "#F7F8FB",
            fontWeight: 600,
            fontSize: "0.8125rem",
            color: "#67666B",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            borderBottom: "1px solid #D9DCE3",
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: "#E7E9EF", fontSize: "0.9375rem", padding: "12px 16px" },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: { "&:hover": { backgroundColor: "#F7F8FB" } },
      },
    },

    MuiAccordion: {
      defaultProps: { disableGutters: true, elevation: 0 },
      styleOverrides: {
        root: { borderRadius: "14px !important", border: "1px solid #E7E9EF", marginBottom: 8, "&:before": { display: "none" } },
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

    MuiInputLabel: {
      styleOverrides: {
        root: { fontSize: "0.9375rem", color: "#67666B", "&.Mui-focused": { color: "#0A7AFF" } },
      },
    },

    MuiFormHelperText: {
      styleOverrides: { root: { fontSize: "0.8125rem", marginTop: 4 } },
    },

    MuiAutocomplete: {
      styleOverrides: {
        paper: { borderRadius: 16, boxShadow: "0px 8px 24px rgba(0,0,0,0.12)", border: "1px solid #E7E9EF" },
        listbox: {
          padding: "6px",
          "& .MuiAutocomplete-option": {
            borderRadius: 8,
            padding: "8px 12px",
            "&[aria-selected=true]": { backgroundColor: "#E8F1FF", color: "#0A7AFF" },
          },
        },
      },
    },

    MuiCssBaseline: {
      styleOverrides: {
        "*": { boxSizing: "border-box" },
        html: { fontSize: "16px", WebkitTextSizeAdjust: "100%" },
        body: { fontFamily, WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" },
        "::-webkit-scrollbar": { width: 6, height: 6 },
        "::-webkit-scrollbar-track": { background: "transparent" },
        "::-webkit-scrollbar-thumb": { background: "#D9DCE3", borderRadius: 100 },
        "::-webkit-scrollbar-thumb:hover": { background: "#98979D" },
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

