import React from "react";
import { Chip } from "@mui/material";

/**
 * StatusChip — M3 tonal chip for status display.
 * Maps status strings to M3 color tokens.
 */
const STATUS_MAP = {
  // Assignment / content statuses
  published:   { label: "Publicado",   color: "success"  },
  draft:       { label: "Borrador",    color: "default"  },
  archived:    { label: "Archivado",   color: "default"  },
  // Submission / student statuses
  submitted:   { label: "Entregado",   color: "primary"  },
  graded:      { label: "Calificado",  color: "success"  },
  late:        { label: "Tarde",       color: "warning"  },
  pending:     { label: "Pendiente",   color: "warning"  },
  overdue:     { label: "Vencido",     color: "error"    },
  missing:     { label: "Sin Entregar",color: "error"    },
  // Attendance
  present:     { label: "Presente",    color: "success"  },
  absent:      { label: "Ausente",     color: "error"    },
  // User statuses
  active:      { label: "Activo",      color: "success"  },
  inactive:    { label: "Inactivo",    color: "default"  },
};

export default function StatusChip({ status, label, size = "small", sx = {} }) {
  const map = STATUS_MAP[status?.toLowerCase()] || { label: status || "—", color: "default" };
  const displayLabel = label || map.label;

  return (
    <Chip
      label={displayLabel}
      size={size}
      color={map.color}
      sx={{
        fontWeight: 600,
        ...sx,
      }}
    />
  );
}
