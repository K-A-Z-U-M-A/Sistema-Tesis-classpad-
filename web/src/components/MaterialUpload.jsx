import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  Typography,
  Alert,
  LinearProgress,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar
} from '@mui/material';
import {
  AttachFile,
  Link,
  YouTube,
  Image,
  VideoLibrary,
  Audiotrack,
  Description,
  Delete,
  Download,
  CloudUpload
} from '@mui/icons-material';
import api from '../services/api';
import toast from 'react-hot-toast';

const MaterialUpload = ({ 
  open, 
  onClose, 
  unitId, 
  onSuccess,
  title = "Agregar Material"
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    file: null
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setFormData(prev => ({ ...prev, file: null, url: '' }));
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (100MB)
      if (file.size > 100 * 1024 * 1024) {
        toast.error('El archivo es demasiado grande. Tamaño máximo: 100MB');
        return;
      }
      
      setFormData(prev => ({ 
        ...prev, 
        file,
        title: prev.title || file.name.split('.')[0]
      }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('El título es requerido');
      return;
    }

    if (activeTab === 0 && !formData.file) {
      toast.error('Selecciona un archivo');
      return;
    }

    if (activeTab === 1 && !formData.url.trim()) {
      toast.error('La URL es requerida');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      if (activeTab === 0) {
        // File upload
        const uploadFormData = new FormData();
        uploadFormData.append('file', formData.file);
        uploadFormData.append('title', formData.title);
        uploadFormData.append('description', formData.description || '');

        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 200);

        const response = await api.request(`/units/${unitId}/materials/upload`, {
          method: 'POST',
          body: uploadFormData
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (response.success) {
          toast.success('Material subido exitosamente');
          onSuccess();
          handleClose();
        } else {
          toast.error(response.error?.message || 'Error al subir el material');
        }
      } else {
        // Link upload
        const response = await api.request(`/units/${unitId}/materials`, {
          method: 'POST',
          body: JSON.stringify({
            title: formData.title,
            description: formData.description || '',
            type: 'link',
            url: formData.url
          })
        });

        if (response.success) {
          toast.success('Material agregado exitosamente');
          onSuccess();
          handleClose();
        } else {
          toast.error(response.error?.message || 'Error al agregar el material');
        }
      }
    } catch (error) {
      console.error('Error uploading material:', error);
      toast.error('Error al procesar la solicitud');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    setFormData({ title: '', description: '', url: '', file: null });
    setActiveTab(0);
    setUploadProgress(0);
    onClose();
  };

  const getFileIcon = (file) => {
    if (!file) return <Description />;
    
    const mimeType = file.type;
    if (mimeType.startsWith('image/')) return <Image />;
    if (mimeType.startsWith('video/')) return <VideoLibrary />;
    if (mimeType.startsWith('audio/')) return <Audiotrack />;
    if (mimeType === 'application/pdf') return <AttachFile />;
    return <Description />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab 
              icon={<AttachFile />} 
              label="Archivo" 
              iconPosition="start"
            />
            <Tab 
              icon={<Link />} 
              label="Enlace" 
              iconPosition="start"
            />
            <Tab 
              icon={<YouTube />} 
              label="Video" 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Título"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            sx={{ mb: 2 }}
            required
          />

          <TextField
            fullWidth
            label="Descripción"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />

          {activeTab === 0 && (
            <Box>
              <input
                type="file"
                id="file-upload"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp,.svg,.mp4,.avi,.mov,.wmv,.webm,.mp3,.wav,.ogg,.zip,.rar,.7z"
              />
              <label htmlFor="file-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUpload />}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  Seleccionar Archivo
                </Button>
              </label>

              {formData.file && (
                <Box sx={{ p: 2, border: '1px dashed #ccc', borderRadius: 1 }}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar>
                      {getFileIcon(formData.file)}
                    </Avatar>
                    <Box flex={1}>
                      <Typography variant="subtitle2">{formData.file.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatFileSize(formData.file.size)}
                      </Typography>
                    </Box>
                    <IconButton 
                      size="small" 
                      onClick={() => setFormData(prev => ({ ...prev, file: null }))}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </Box>
              )}

              <Alert severity="info" sx={{ mt: 1 }}>
                Tipos permitidos: PDF, Word, Excel, PowerPoint, imágenes, videos, audio, archivos comprimidos.
                Tamaño máximo: 100MB
              </Alert>
            </Box>
          )}

          {activeTab === 1 && (
            <TextField
              fullWidth
              label="URL del enlace"
              value={formData.url}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              placeholder="https://ejemplo.com"
              required
            />
          )}

          {activeTab === 2 && (
            <TextField
              fullWidth
              label="URL del video"
              value={formData.url}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              placeholder="https://youtube.com/watch?v=..."
              required
            />
          )}

          {uploading && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Subiendo archivo...
              </Typography>
              <LinearProgress variant="determinate" value={uploadProgress} />
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={uploading}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={uploading || !formData.title.trim()}
        >
          {uploading ? 'Subiendo...' : 'Agregar Material'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MaterialUpload;
