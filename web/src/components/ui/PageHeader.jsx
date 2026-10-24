import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";

/**
 * PageHeader — M3 page header with optional back button and actions.
 */
export default function PageHeader({
  title,
  subtitle,
  onBack,
  backLabel = "Volver",
  actions,
  sx = {},
}) {
  return (
    <Box sx={{ mb: 4, ...sx }}>
      {onBack && (
        <Button
          startIcon={<ArrowBack />}
          onClick={onBack}
          size="small"
          sx={{ mb: 1.5, color: "text.secondary" }}
        >
          {backLabel}
        </Button>
      )}
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h3"
            component="h1"
            sx={{ color: "text.primary", fontWeight: 700, mb: subtitle ? 0.5 : 0 }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body1" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions && (
          <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
            {actions}
          </Box>
        )}
      </Box>
    </Box>
  );
}
