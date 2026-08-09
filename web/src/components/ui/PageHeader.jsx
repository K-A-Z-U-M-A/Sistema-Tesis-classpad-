import React from "react";
import { Box, Typography, Stack } from "@mui/material";

/**
 * PageHeader — page-level heading row.
 *
 * Props:
 *   title        {string|node}  — required
 *   description  {string|node}  — optional subtitle
 *   action       {node}         — optional action button(s) on the right
 *   sx           {object}       — extra styles
 *   breadcrumb   {node}         — optional breadcrumb above title
 */
export default function PageHeader({ title, description, action, breadcrumb, sx = {} }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: { xs: "flex-start", sm: "center" },
        flexDirection: { xs: "column", sm: "row" },
        gap: { xs: 2, sm: 0 },
        mb: 3,
        ...sx,
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {breadcrumb && <Box sx={{ mb: 0.5 }}>{breadcrumb}</Box>}
        <Typography
          variant="h1"
          component="h1"
          sx={{ fontSize: { xs: "1.5rem", sm: "1.75rem", md: "1.875rem" }, fontWeight: 700, color: "#1C1B1F", lineHeight: 1.2 }}
        >
          {title}
        </Typography>
        {description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, lineHeight: 1.5 }}
          >
            {description}
          </Typography>
        )}
      </Box>
      {action && (
        <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
          {action}
        </Stack>
      )}
    </Box>
  );
}
