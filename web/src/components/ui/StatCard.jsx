import React from "react";
import { Box, Typography } from "@mui/material";

/**
 * StatCard — M3 Expressive tonal card for dashboard stats.
 * Uses primaryContainer / secondaryContainer background for tonal hierarchy.
 *
 * Props:
 *   title      {string}  — card label (also accepted as `label`)
 *   value      {string|number}
 *   icon       {node}
 *   color      {"primary" | "secondary" | "tertiary" | "success" | "warning" | "error" | "default"}
 *   subtitle   {string}  — secondary text (also accepted as `context`)
 *   onClick    {function} — makes the card clickable with pointer cursor
 */
export default function StatCard({ title, label, value, icon, color = "primary", subtitle, context, onClick }) {
  // Accept both naming conventions used across the codebase
  const resolvedTitle    = title    ?? label;
  const resolvedSubtitle = subtitle ?? context;
  const containerMap = {
    primary:   { bg: "primaryContainer",   text: "onPrimaryContainer" },
    secondary: { bg: "secondaryContainer", text: "onSecondaryContainer" },
    tertiary:  { bg: "tertiaryContainer",  text: "onTertiaryContainer" },
    success:   { bg: "successContainer",   text: "onSuccessContainer" },
    warning:   { bg: "warningContainer",   text: "onWarningContainer" },
    error:     { bg: "errorContainer",     text: "onErrorContainer" },
  };

  const tokens = containerMap[color] || containerMap.primary;

  return (
    <Box
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => (e.key === "Enter" || e.key === " ") && onClick() : undefined}
      sx={{
        borderRadius: "28px",
        backgroundColor: tokens.bg,
        p: 3,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        minHeight: 140,
        transition: "box-shadow 200ms, transform 200ms",
        cursor: onClick ? "pointer" : "default",
        outline: "none",
        "&:hover": onClick ? {
          boxShadow: "0px 1px 2px rgba(0,0,0,0.30), 0px 2px 6px 2px rgba(0,0,0,0.15)",
          transform: "translateY(-2px)",
        } : {
          boxShadow: "0px 1px 2px rgba(0,0,0,0.30), 0px 2px 6px 2px rgba(0,0,0,0.15)",
          transform: "translateY(-1px)",
        },
        "&:focus-visible": onClick ? {
          outline: "2px solid",
          outlineColor: "primary.main",
          outlineOffset: "2px",
        } : {},
      }}
    >
      {icon && (
        <Box sx={{ color: tokens.text, display: "flex", alignItems: "center" }}>
          {React.cloneElement(icon, { sx: { fontSize: 28, ...icon.props?.sx } })}
        </Box>
      )}
      <Box>
        <Typography
          variant="displaySmall"
          sx={{ fontSize: "2rem", fontWeight: 700, color: tokens.text, lineHeight: 1.1 }}
        >
          {value}
        </Typography>
        <Typography
          variant="labelLarge"
          sx={{ color: tokens.text, opacity: 0.8, mt: 0.25, display: "block" }}
        >
          {resolvedTitle}
        </Typography>
        {resolvedSubtitle && (
          <Typography
            variant="bodySmall"
            sx={{ color: tokens.text, opacity: 0.6, mt: 0.5, display: "block" }}
          >
            {resolvedSubtitle}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
