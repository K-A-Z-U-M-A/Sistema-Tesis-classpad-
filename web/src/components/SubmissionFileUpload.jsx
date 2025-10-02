import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  AttachFile,
  CheckCircle,
  Download
} from '@mui/icons-material';
import api from '../services/api.js';

const SubmissionFileUpload = ({ submissionId, files = [], onFileAdded, onFileDeleted, onFileUpload, disabled = false }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      setError('El archivo es demasiado grande. Máximo 50MB.');
      return;
    }

    setUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      let response;
      if (onFileUpload) {
        // Use custom upload function (creates submission if needed)
        response = await onFileUpload(formData);
      } else {
        // Fallback to direct API call
        response = await api.request(`/submissions/${submissionId}/files`, {
          method: 'POST',
          body: formData,
          headers: {} // Let browser set Content-Type
        });
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.success) {
        onFileAdded(response.data);
        setError('');
      } else {
        setError(response.error || 'Error al subir el archivo');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Error al subir el archivo');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      const response = await api.request(`/submissions/${submissionId}/files/${fileId}`, {
        method: 'DELETE'
      });

      if (response.success) {
        onFileDeleted(fileId);
      } else {
        setError(response.error || 'Error al eliminar el archivo');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      setError('Error al eliminar el archivo');
    }
  };

  const handleDownloadFile = async (file) => {
    try {
      console.log('🔍 Downloading file:', file);
      console.log('🔍 File URL:', file.url);
      console.log('🔍 File URL type:', typeof file.url);
      console.log('🔍 Original name:', file.original_name);
      console.log('🔍 All file properties:', Object.keys(file));
      
      // Usar fetch para descargar el archivo con headers específicos
      const response = await fetch(file.url, {
        method: 'GET',
        headers: {
          'Accept': 'application/octet-stream',
        },
        mode: 'cors'
      });
      
      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      console.log('🔍 Blob size:', blob.size, 'bytes');
      console.log('🔍 Blob type:', blob.type);
      
      // Verificar si el blob es válido
      if (blob.size === 0) {
        throw new Error('El archivo descargado está vacío');
      }
      
      // Crear URL del blob
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Crear enlace de descarga
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = file.original_name;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Limpiar después de un delay
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
      
    } catch (error) {
      console.error('Error downloading file:', error);
      setError('Error al descargar el archivo: ' + error.message);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Archivos Adjuntos
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Upload Button */}
      <Box sx={{ mb: 2 }}>
        <input
          accept="*/*"
          style={{ display: 'none' }}
          id="file-upload"
          type="file"
          onChange={handleFileSelect}
          disabled={disabled || uploading}
        />
        <label htmlFor="file-upload">
          <Button
            variant="outlined"
            component="span"
            startIcon={<CloudUpload />}
            disabled={disabled || uploading}
            sx={{ mb: 2 }}
          >
            {uploading ? 'Subiendo...' : 'Subir Archivo'}
          </Button>
        </label>
        
        {uploading && (
          <Box sx={{ width: '100%', mt: 1 }}>
            <LinearProgress variant="determinate" value={uploadProgress} />
            <Typography variant="caption" color="text.secondary">
              {uploadProgress}% completado
            </Typography>
          </Box>
        )}
      </Box>

      {/* Files List */}
      {files.length > 0 && (
        <List dense>
          {files.map((file) => (
            <ListItem
              key={file.id}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                mb: 1,
                backgroundColor: 'background.paper',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
              onClick={() => handleDownloadFile(file)}
            >
              <AttachFile fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <ListItemText
                primary={file.original_name}
                secondary={`${formatFileSize(file.file_size)} • ${file.mime_type} • Click para descargar`}
              />
              <Box sx={{ ml: 1 }}>
                <Chip
                  label="Adjunto"
                  size="small"
                  color="primary"
                  sx={{ height: 16, fontSize: '0.65rem' }}
                />
              </Box>
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadFile(file);
                  }}
                  size="small"
                  title="Descargar archivo"
                >
                  <Download fontSize="small" />
                </IconButton>
                {!disabled && (
                  <IconButton
                    edge="end"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFile(file.id);
                    }}
                    disabled={disabled}
                    size="small"
                    title="Eliminar archivo"
                    sx={{ ml: 1 }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                )}
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}

      {files.length === 0 && !uploading && (
        <Box
          sx={{
            textAlign: 'center',
            py: 3,
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 2,
            backgroundColor: 'grey.50'
          }}
        >
          <AttachFile sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            No hay archivos adjuntos
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Haz clic en "Subir Archivo" para agregar archivos a tu entrega
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default SubmissionFileUpload;
