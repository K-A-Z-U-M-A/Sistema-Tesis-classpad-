import React from "react";
import { Box, Typography } from "@mui/material";

/**
 * EmptyState — M3 Expressive empty state with tonal icon container.
 */
export default function EmptyState({ icon, title, description, action }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 8,
        px: 4,
        textAlign: "center",
        gap: 2,
      }}
    >
      {icon && (
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: "28px",
            backgroundColor: "primaryContainer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "onPrimaryContainer",
            mb: 1,
          }}
        >
          {React.cloneElement(icon, { sx: { fontSize: 40, ...icon.props?.sx } })}
        </Box>
      )}
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
        <Typography
          variant="h6"
          component="h3"
          sx={{ color: "text.primary", fontWeight: 700 }}
        >
          {title}
        </Typography>
        {description && (
          <Typography
            variant="body2"
            component="p"
            color="text.secondary"
            sx={{ maxWidth: 360, m: 0 }}
          >
            {description}
          </Typography>
        )}
      </Box>
      {action && <Box sx={{ mt: 1 }}>{action}</Box>}
    </Box>
  );
}
