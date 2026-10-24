import React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, CircularProgress,
} from "@mui/material";
import { WarningAmber } from "@mui/icons-material";

/**
 * ConfirmDialog — reusable confirmation dialog.
 *
 * Props:
 *   open           {bool}      — required
 *   onClose        {function}  — called on cancel / backdrop click
 *   onConfirm      {function}  — called on confirm button click
 *   title          {string}    — dialog title (default: "Confirmar accion")
 *   description    {string}    — body text
 *   confirmLabel   {string}    — confirm button text (default: "Confirmar")
 *   cancelLabel    {string}    — cancel button text (default: "Cancelar")
 *   severity       "error"|"warning"|"info"  — visual accent (default: "warning")
 *   loading        {bool}      — shows spinner on confirm button
 *   confirmColor   "error"|"primary"|"warning"  — button color
 */

const SEVERITY_ICON_COLOR = {
  error:   "#B3261E",
  warning: "#7E5700",
  info:    "#6750A4",
};

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Confirmar accion",
  description,
  confirmLabel = "Confirmar",
  cancelLabel  = "Cancelar",
  severity     = "warning",
  loading      = false,
  confirmColor = "error",
}) {
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <WarningAmber sx={{ color: SEVERITY_ICON_COLOR[severity] || SEVERITY_ICON_COLOR.warning, fontSize: 22 }} />
          {title}
        </Box>
      </DialogTitle>

      {description && (
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
            {description}
          </Typography>
        </DialogContent>
      )}

      <DialogActions>
        <Button
          variant="outlined"
          color="inherit"
          onClick={onClose}
          disabled={loading}
          sx={{ color: "#49454F", borderColor: "#CAC4D0" }}
        >
          {cancelLabel}
        </Button>
        <Button
          variant="contained"
          color={confirmColor}
          onClick={onConfirm}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
