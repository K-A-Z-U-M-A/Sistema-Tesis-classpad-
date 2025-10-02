import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  AttachFile,
  Link,
  Upload,
  Close
} from '@mui/icons-material';
import api from '../services/api';
import toast from 'react-hot-toast';

const AssignmentMaterialUpload = ({ 
  assignmentId, 
  open, 
  onClose, 
  onSuccess 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'document',
    url: ''
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    if (selectedFile) {
      setFormData(prev => ({
        ...prev,
        title: selectedFile.name.split('.')[0] || ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUploading(true);

    try {
      if (!formData.title.trim()) {
        throw new Error('El título es requerido');
      }

      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('type', formData.type);

      if (file) {
        submitData.append('file', file);
      } else if (formData.url) {
        submitData.append('url', formData.url);
      } else {
        throw new Error('Debe proporcionar un archivo o una URL');
      }

      await api.uploadAssignmentMaterial(assignmentId, submitData);
      
      toast.success('Material agregado exitosamente');
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error uploading material:', error);
      setError(error.message || 'Error al subir el material');
      toast.error(error.message || 'Error al subir el material');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      type: 'document',
      url: ''
    });
    setFile(null);
    setError('');
    setUploading(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <AttachFile />
          <Typography variant="h6">Agregar Material</Typography>
        </Box>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Título"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            margin="normal"
            disabled={uploading}
          />

          <TextField
            fullWidth
            label="Descripción"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            multiline
            rows={3}
            margin="normal"
            disabled={uploading}
          />

          <FormControl fullWidth margin="normal" disabled={uploading}>
            <InputLabel>Tipo de Material</InputLabel>
            <Select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              label="Tipo de Material"
            >
              <MenuItem value="document">Documento</MenuItem>
              <MenuItem value="pdf">PDF</MenuItem>
              <MenuItem value="image">Imagen</MenuItem>
              <MenuItem value="video">Video</MenuItem>
              <MenuItem value="audio">Audio</MenuItem>
              <MenuItem value="link">Enlace</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Subir Archivo
            </Typography>
            <Button
              variant="outlined"
              component="label"
              startIcon={<Upload />}
              disabled={uploading}
              fullWidth
            >
              {file ? file.name : 'Seleccionar Archivo'}
              <input
                type="file"
                hidden
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.avi,.mp3,.wav"
              />
            </Button>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              O proporcionar URL
            </Typography>
            <TextField
              fullWidth
              label="URL del material"
              name="url"
              value={formData.url}
              onChange={handleInputChange}
              placeholder="https://ejemplo.com/material"
              disabled={uploading || !!file}
            />
          </Box>

          {uploading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography variant="caption" color="text.secondary">
                Subiendo material...
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={uploading}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={uploading}
            startIcon={<AttachFile />}
          >
            Agregar Material
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AssignmentMaterialUpload;
