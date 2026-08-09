import React from "react";
import { Box, Typography, Button } from "@mui/material";

/**
 * EmptyState — compact empty state display.
 *
 * Props:
 *   icon         {node}      — MUI icon (auto-sized to 36px)
 *   title        {string}    — required
 *   description  {string}    — optional
 *   action       {node}      — optional CTA button or any node
 *   compact      {bool}      — reduce vertical spacing (default false)
 *   sx           {object}
 */
export default function EmptyState({ icon, title, description, action, compact = false, sx = {} }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        py: compact ? 3 : 5,
        px: 3,
        ...sx,
      }}
    >
      {icon && (
        <Box
          sx={{
            mb: 1.5,
            color: "#D9DCE3",
            "& svg": { fontSize: compact ? 36 : 44 },
          }}
        >
          {icon}
        </Box>
      )}
      <Typography
        variant={compact ? "body2" : "h5"}
        fontWeight={600}
        color="text.primary"
        sx={{ mb: description ? 0.5 : 0 }}
      >
        {title}
      </Typography>
      {description && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: 320, lineHeight: 1.5 }}
        >
          {description}
        </Typography>
      )}
      {action && <Box sx={{ mt: 2.5 }}>{action}</Box>}
    </Box>
  );
}
