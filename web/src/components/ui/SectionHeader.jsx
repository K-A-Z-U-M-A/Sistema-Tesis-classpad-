import React from "react";
import { Box, Typography, Stack } from "@mui/material";

/**
 * SectionHeader — heading for content sections inside a page.
 *
 * Props:
 *   title    {string|node}
 *   action   {node}           optional right-side action
 *   sx       {object}
 */
export default function SectionHeader({ title, action, sx = {} }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", mb: 2, ...sx }}>
      <Typography
        variant="h3"
        component="h2"
        sx={{ flex: 1, fontWeight: 650, fontSize: "1.0625rem", color: "#1C1B1F" }}
      >
        {title}
      </Typography>
      {action && (
        <Stack direction="row" spacing={1}>
          {action}
        </Stack>
      )}
    </Box>
  );
}
