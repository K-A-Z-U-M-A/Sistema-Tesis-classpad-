import React from "react";
import { Box } from "@mui/material";

/**
 * PageContainer — wraps page content with max-width, consistent padding,
 * and optional top/bottom spacing.
 *
 * Props:
 *   maxWidth   {string|number}  — default "1360px"
 *   sx         {object}        — extra styles on the outer Box
 *   children   {node}
 */
export default function PageContainer({ children, maxWidth = "1360px", sx = {}, ...props }) {
  return (
    <Box
      sx={{
        maxWidth,
        mx: "auto",
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 3.5, md: 4 },
        width: "100%",
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
}
