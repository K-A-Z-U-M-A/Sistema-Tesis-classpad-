import React, { useState } from "react";
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Tabs, Tab, Typography, LinearProgress, Alert,
  CircularProgress,
} from "@mui/material";
import {
  AttachFile, Link, Image, VideoLibrary, Audiotrack,
  Description, CloudUpload,
} from "@mui/icons-material";
import api from "../services/api";
import toast from "react-hot-toast";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getFileIcon = (file) => {
  if (!file) return <Description />;
  if (file.type.startsWith("image/")) return <Image />;
  if (file.type.startsWith("video/")) return <VideoLibrary />;
  if (file.type.startsWith("audio/")) return <Audiotrack />;
  return <AttachFile />;
};

const formatFileSize = (bytes) => {
  if (!bytes) return "";
  const k = 1024, sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

const autoTitle = (file) => {
  if (!file) return "";
  const name = file.name || "";
  const dot  = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  return base.replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
};

const autoTitleFromUrl = (url) => {
  try {
    const u    = new URL(url);
    const host = u.hostname.replace("www.", "");
    return host.charAt(0).toUpperCase() + host.slice(1);
  } catch {
    return url.length > 40 ? url.slice(0, 40) + "..." : url || "Enlace";
  }
};

// ─── MaterialUpload ───────────────────────────────────────────────────────────
const MaterialUpload = ({ open, onClose, unitId, onSuccess, title = "Agregar Material" }) => {
  const [activeTab,       setActiveTab]       = useState(0);
  const [formData,        setFormData]        = useState({ description: "", url: "", file: null });
  const [uploading,       setUploading]       = useState(false);
  const [uploadProgress,  setUploadProgress]  = useState(0);

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
    setFormData((p) => ({ ...p, file: null, url: "" }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      toast.error("El archivo es demasiado grande. Maximo: 100MB");
      return;
    }
    setFormData((p) => ({ ...p, file }));
  };

  const handleSubmit = async () => {
    if (activeTab === 0 && !formData.file) {
      toast.error("Selecciona un archivo");
      return;
    }
    if (activeTab === 1 && !formData.url.trim()) {
      toast.error("Ingresa una URL");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      if (activeTab === 0) {
        // ── File upload — title generated automatically ──
        const computedTitle = autoTitle(formData.file) || formData.file.name;
        const fd = new FormData();
        fd.append("file", formData.file);
        fd.append("title", computedTitle);
        fd.append("description", formData.description || "");

        const interval = setInterval(() => {
          setUploadProgress((p) => { if (p >= 90) { clearInterval(interval); return 90; } return p + 10; });
        }, 200);

        const response = await api.request(`/units/${unitId}/materials/upload`, { method: "POST", body: fd });
        clearInterval(interval);
        setUploadProgress(100);

        if (response.success) { toast.success("Material subido"); onSuccess(); handleClose(); }
        else toast.error(response.error?.message || "Error al subir el material");

      } else {
        // ── Link — title generated from domain ──
        const computedTitle = autoTitleFromUrl(formData.url.trim());
        const response = await api.request(`/units/${unitId}/materials`, {
          method: "POST",
          body: JSON.stringify({
            title: computedTitle,
            description: formData.description || "",
            type: "link",
            url: formData.url.trim(),
          }),
        });
        if (response.success) { toast.success("Material agregado"); onSuccess(); handleClose(); }
        else toast.error(response.error?.message || "Error al agregar el material");
      }
    } catch (error) {
      console.error("Error uploading material:", error);
      toast.error("Error al procesar la solicitud");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    setFormData({ description: "", url: "", file: null });
    setActiveTab(0);
    setUploadProgress(0);
    onClose();
  };

  return (
    <Dialog open={open} onClose={uploading ? undefined : handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>

      <DialogContent>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2.5 }}>
          <Tab icon={<AttachFile sx={{ fontSize: 18 }} />} label="Archivo" iconPosition="start" sx={{ minHeight: 44 }} />
          <Tab icon={<Link sx={{ fontSize: 18 }} />}       label="Enlace"  iconPosition="start" sx={{ minHeight: 44 }} />
        </Tabs>

        {/* ── File tab ── */}
        {activeTab === 0 && (
          <Box>
            <Box
              component="label"
              htmlFor="material-file-input"
              sx={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                border: "1.5px dashed", borderColor: formData.file ? "#0A7AFF" : "#D9DCE3",
                borderRadius: 3, p: 3, cursor: "pointer", mb: 2,
                backgroundColor: formData.file ? "#E8F1FF" : "#F7F8FB",
                transition: "all 150ms ease",
                "&:hover": { borderColor: "#0A7AFF", backgroundColor: "#E8F1FF" },
              }}
            >
              <input
                id="material-file-input"
                type="file"
                hidden
                onChange={handleFileSelect}
                accept="*/*"
                disabled={uploading}
              />
              {formData.file ? (
                <>
                  <Box sx={{ color: "#0A7AFF", mb: 1 }}>{getFileIcon(formData.file)}</Box>
                  <Typography variant="body2" fontWeight={600} sx={{ color: "#0A7AFF", textAlign: "center" }}>
                    {formData.file.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatFileSize(formData.file.size)}
                  </Typography>
                </>
              ) : (
                <>
                  <CloudUpload sx={{ fontSize: 36, color: "#D9DCE3", mb: 1 }} />
                  <Typography variant="body2" fontWeight={500} color="text.secondary">
                    Haz clic para seleccionar un archivo
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Maximo 100MB
                  </Typography>
                </>
              )}
            </Box>

            {formData.file && (
              <Alert severity="info" sx={{ mb: 2, py: 0.75 }}>
                El titulo se generara automaticamente a partir del nombre del archivo.
              </Alert>
            )}

            {uploading && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                  Subiendo... {uploadProgress}%
                </Typography>
                <LinearProgress variant="determinate" value={uploadProgress} sx={{ borderRadius: 100 }} />
              </Box>
            )}

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Descripcion (opcional)"
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              disabled={uploading}
            />
          </Box>
        )}

        {/* ── Link tab ── */}
        {activeTab === 1 && (
          <Box>
            <TextField
              fullWidth
              label="URL del enlace"
              placeholder="https://..."
              value={formData.url}
              onChange={(e) => setFormData((p) => ({ ...p, url: e.target.value }))}
              disabled={uploading}
              sx={{ mb: 2 }}
              InputProps={{ startAdornment: <Link sx={{ mr: 1, fontSize: 18, color: "text.secondary" }} /> }}
            />

            {formData.url && (
              <Alert severity="info" sx={{ mb: 2, py: 0.75 }}>
                Titulo automatico: <strong>{autoTitleFromUrl(formData.url)}</strong>
              </Alert>
            )}

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Descripcion (opcional)"
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              disabled={uploading}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={handleClose} disabled={uploading} sx={{ color: "#67666B", borderColor: "#D9DCE3" }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={uploading || (activeTab === 0 && !formData.file) || (activeTab === 1 && !formData.url.trim())}
          startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {uploading ? "Subiendo..." : "Agregar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MaterialUpload;
