import React from "react";
import { Chip } from "@mui/material";

/**
 * StatusChip — color-coded status indicator.
 *
 * Props:
 *   status   {string}  — key from STATUS_CONFIG or raw label
 *   label    {string}  — override label text
 *   size     "small" | "medium"
 *   sx       {object}
 */

const STATUS_CONFIG = {
  // Course / general
  active:       { label: "Activo",       bg: "#E5F6EA", color: "#0D4D25" },
  inactive:     { label: "Inactivo",     bg: "#F0F2F7", color: "#67666B" },
  archived:     { label: "Archivado",    bg: "#F0F2F7", color: "#67666B" },

  // Assignment / unit
  published:    { label: "Publicado",    bg: "#E5F6EA", color: "#0D4D25" },
  draft:        { label: "Borrador",     bg: "#F7F8FB", color: "#67666B" },
  overdue:      { label: "Vencida",      bg: "#FDE9E7", color: "#7D1C15" },
  pending:      { label: "Pendiente",    bg: "#FFF2DC", color: "#6B3C00" },
  graded:       { label: "Calificada",   bg: "#E8F1FF", color: "#003B75" },
  submitted:    { label: "Entregada",    bg: "#E8F1FF", color: "#003B75" },
  late:         { label: "Con demora",   bg: "#FFF2DC", color: "#6B3C00" },
  not_submitted:{ label: "Sin entregar", bg: "#FDE9E7", color: "#7D1C15" },

  // Attendance
  present:      { label: "Presente",    bg: "#E5F6EA", color: "#0D4D25" },
  absent:       { label: "Ausente",     bg: "#FDE9E7", color: "#7D1C15" },
  late_att:     { label: "Tarde",       bg: "#FFF2DC", color: "#6B3C00" },

  // User roles
  teacher:      { label: "Docente",     bg: "#E8F1FF", color: "#003B75" },
  student:      { label: "Estudiante",  bg: "#E5F6EA", color: "#0D4D25" },
  admin:        { label: "Admin",       bg: "#FDE9E7", color: "#7D1C15" },
};

export default function StatusChip({ status, label, size = "small", sx = {} }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG[status?.toLowerCase()] || {
    label: label || status || "—",
    bg: "#F0F2F7",
    color: "#67666B",
  };

  return (
    <Chip
      label={label || config.label}
      size={size}
      sx={{
        backgroundColor: config.bg,
        color: config.color,
        fontWeight: 600,
        border: "none",
        "& .MuiChip-label": { px: 1.25 },
        ...sx,
      }}
    />
  );
}
