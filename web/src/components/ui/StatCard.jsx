import React from "react";
import { Box, Typography, Card, CardContent, Skeleton } from "@mui/material";

/**
 * StatCard — compact metric display card.
 *
 * Props:
 *   icon      {node}           — MUI icon element
 *   value     {string|number}  — main metric value
 *   label     {string}         — metric name
 *   context   {string}         — optional secondary context text
 *   action    {node}           — optional bottom action
 *   color     {string}         — accent color key: "primary"|"success"|"warning"|"error"
 *   loading   {bool}
 *   onClick   {function}
 *   sx        {object}
 */

const COLOR_MAP = {
  primary: { bg: "#E8F1FF", icon: "#0A7AFF" },
  success: { bg: "#E5F6EA", icon: "#24A148" },
  warning: { bg: "#FFF2DC", icon: "#E78000" },
  error:   { bg: "#FDE9E7", icon: "#D93025" },
  default: { bg: "#F0F2F7", icon: "#67666B" },
};

export default function StatCard({
  icon,
  value,
  label,
  context,
  action,
  color = "primary",
  loading = false,
  onClick,
  sx = {},
}) {
  const colors = COLOR_MAP[color] || COLOR_MAP.default;

  return (
    <Card
      sx={{
        height: "100%",
        cursor: onClick ? "pointer" : "default",
        "&:hover": onClick ? { borderColor: "#D9DCE3", boxShadow: "0px 2px 8px rgba(0,0,0,0.08)" } : {},
        ...sx,
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: "20px !important" }}>
        {loading ? (
          <Box>
            <Skeleton width={40} height={40} variant="rounded" sx={{ mb: 1.5 }} />
            <Skeleton width="60%" height={32} sx={{ mb: 0.75 }} />
            <Skeleton width="80%" height={18} />
          </Box>
        ) : (
          <>
            {/* Icon */}
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "12px",
                backgroundColor: colors.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 1.5,
                color: colors.icon,
                "& svg": { fontSize: 22 },
              }}
            >
              {icon}
            </Box>

            {/* Value */}
            <Typography
              variant="h2"
              component="p"
              sx={{ fontWeight: 700, fontSize: "1.75rem", lineHeight: 1.15, color: "#1C1B1F", mb: 0.25 }}
            >
              {value ?? "—"}
            </Typography>

            {/* Label */}
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              {label}
            </Typography>

            {/* Context */}
            {context && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                {context}
              </Typography>
            )}

            {/* Optional action */}
            {action && <Box sx={{ mt: 1.5 }}>{action}</Box>}
          </>
        )}
      </CardContent>
    </Card>
  );
}
