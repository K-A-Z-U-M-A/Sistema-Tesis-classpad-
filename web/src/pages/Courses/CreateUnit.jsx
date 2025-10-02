import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  InputAdornment
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Preview,
  Add,
  Delete,
  AttachFile,
  Link,
  VideoLibrary,
  Description,
  ExpandMore,
  Upload,
  CloudUpload,
  InsertDriveFile,
  YouTube,
  Article
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext.tsx';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CreateUnit = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_published: false,
    order: 1
  });
  const [materials, setMaterials] = useState([]);
  const [materialDialog, setMaterialDialog] = useState(false);
  const [materialForm, setMaterialForm] = useState({
    type: 'file',
    title: '',
    description: '',
    url: '',
    file: null
  });
  const [materialTab, setMaterialTab] = useState(0);

  const handleInputChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Materials handlers
  const handleOpenMaterialDialog = () => {
    setMaterialForm({ type: 'file', title: '', description: '', url: '', file: null });
    setMaterialTab(0);
    setMaterialDialog(true);
  };

  const handleCloseMaterialDialog = () => {
    setMaterialDialog(false);
  };

  const handleMaterialFormChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setMaterialForm(prev => ({ ...prev, [field]: value }));
  };

  const handleMaterialTabChange = (event, newValue) => {
    setMaterialTab(newValue);
    const typeByTab = newValue === 0 ? 'file' : newValue === 1 ? 'link' : 'video';
    setMaterialForm(prev => ({ ...prev, type: typeByTab }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setMaterialForm(prev => ({ ...prev, file }));
  };

  const handleAddMaterial = () => {
    if (!materialForm.title.trim()) {
      toast.error('El título del material es requerido');
      return;
    }
    if (materialForm.type !== 'file' && !materialForm.url.trim()) {
      toast.error('La URL es requerida para enlaces y videos');
      return;
    }

    const newMaterial = {
      id: `${Date.now()}`,
      type: materialForm.type,
      title: materialForm.title.trim(),
      description: materialForm.description.trim(),
      url: materialForm.type === 'file' ? '' : materialForm.url.trim(),
      file: materialForm.file || null,
      fileName: materialForm.file?.name || null,
      fileSize: materialForm.file?.size || null,
      fileType: materialForm.file?.type || null,
    };

    setMaterials(prev => [...prev, newMaterial]);
    setMaterialDialog(false);
  };

  const handleRemoveMaterial = (id) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('El título de la unidad es requerido');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('La descripción de la unidad es requerida');
      return;
    }

    try {
      setLoading(true);
      const response = await api.createUnit(courseId, {
        title: formData.title,
        description: formData.description,
        is_published: formData.is_published,
        order_index: formData.order
      });

      if (response.success) {
        const unitId = response.data?.unit?.id || response.data?.id;
        if (unitId && materials.length > 0) {
          // Persist materials sequentially
          for (const material of materials) {
            try {
              if (material.type === 'file' && material.file) {
                const fd = new FormData();
                fd.append('title', material.title);
                fd.append('description', material.description || '');
                fd.append('file', material.file);
                await api.request(`/units/${unitId}/materials/upload`, { method: 'POST', body: fd });
              } else {
                await api.createMaterial(unitId, {
                  type: material.type,
                  title: material.title,
                  description: material.description,
                  url: material.url,
                });
              }
            } catch (e) {
              console.error('Error adding material:', e);
            }
          }
        }
        toast.success('Unidad creada exitosamente');
        navigate(`/courses/${courseId}`);
      } else {
        toast.error(response.error?.message || 'Error al crear la unidad');
      }
    } catch (error) {
      console.error('Error creating unit:', error);
      toast.error('Error al crear la unidad');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/courses/${courseId}`);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box display="flex" alignItems="center" gap={2} mb={4}>
          <Button
            startIcon={<ArrowBack />}
            onClick={handleCancel}
            sx={{ minWidth: 'auto' }}
          >
            Volver
          </Button>
          <Box flex={1}>
            <Typography variant="h4" fontWeight="bold">
              Nueva Unidad
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Crea una nueva unidad para organizar el contenido del curso
            </Typography>
          </Box>
        </Box>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card>
          <CardContent sx={{ p: 4 }}>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* Título */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Título de la Unidad"
                    value={formData.title}
                    onChange={handleInputChange('title')}
                    required
                    placeholder="Ej: Introducción a las Derivadas"
                    helperText="Un título descriptivo que identifique claramente la unidad"
                  />
                </Grid>

                {/* Materiales didácticos */}
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6" fontWeight="bold">
                          Materiales didácticos
                        </Typography>
                        <Button variant="outlined" startIcon={<Add />} onClick={handleOpenMaterialDialog}>
                          Agregar material
                        </Button>
                      </Box>

                      {materials.length === 0 ? (
                        <Box textAlign="center" py={3}>
                          <Description sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            Aún no has agregado materiales a esta unidad
                          </Typography>
                        </Box>
                      ) : (
                        <List>
                          {materials.map((m) => (
                            <React.Fragment key={m.id}>
                              <ListItem>
                                <ListItemText
                                  disableTypography
                                  primary={
                                    <Box display="flex" alignItems="center" gap={1}>
                                      <Chip size="small" label={m.type === 'file' ? 'Archivo' : m.type === 'link' ? 'Enlace' : 'Video'} />
                                      <Box component="span" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>{m.title}</Box>
                                    </Box>
                                  }
                                  secondary={
                                    <Box>
                                      {m.description && (
                                        <Box component="span" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.875rem' }}>{m.description}</Box>
                                      )}
                                      <Box display="flex" gap={2} mt={0.5}>
                                        {m.url && (
                                          <Chip size="small" icon={<Link />} label={m.url} variant="outlined" />
                                        )}
                                        {m.fileName && (
                                          <Chip size="small" icon={<InsertDriveFile />} label={`${m.fileName}${m.fileSize ? ` • ${(m.fileSize/1024/1024).toFixed(2)} MB` : ''}`} />
                                        )}
                                      </Box>
                                    </Box>
                                  }
                                />
                                <ListItemSecondaryAction>
                                  <IconButton edge="end" onClick={() => handleRemoveMaterial(m.id)}>
                                    <Delete />
                                  </IconButton>
                                </ListItemSecondaryAction>
                              </ListItem>
                              <Divider />
                            </React.Fragment>
                          ))}
                        </List>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Descripción */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Descripción"
                    value={formData.description}
                    onChange={handleInputChange('description')}
                    multiline
                    rows={4}
                    required
                    placeholder="Describe los objetivos y contenido de esta unidad..."
                    helperText="Explica qué aprenderán los estudiantes en esta unidad"
                  />
                </Grid>

                {/* Orden */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Orden de la Unidad"
                    type="number"
                    value={formData.order}
                    onChange={handleInputChange('order')}
                    inputProps={{ min: 1 }}
                    helperText="Número de orden en la secuencia del curso"
                  />
                </Grid>

                {/* Estado de publicación */}
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" height="100%">
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.is_published}
                          onChange={handleInputChange('is_published')}
                          color="primary"
                        />
                      }
                      label={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2">
                            Publicar inmediatamente
                          </Typography>
                          <Chip
                            label={formData.is_published ? 'Pública' : 'Borrador'}
                            color={formData.is_published ? 'success' : 'default'}
                            size="small"
                          />
                        </Box>
                      }
                    />
                  </Box>
                </Grid>

                {/* Botones de acción */}
                <Grid item xs={12}>
                  <Box display="flex" gap={2} justifyContent="flex-end" mt={3}>
                    <Button
                      variant="outlined"
                      onClick={handleCancel}
                      disabled={loading}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                      disabled={loading}
                    >
                      {loading ? 'Creando...' : 'Crear Unidad'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Información adicional */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              💡 Consejos para crear una buena unidad
            </Typography>
            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                Usa un título claro y descriptivo que indique el tema principal
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                Incluye objetivos de aprendizaje específicos en la descripción
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                Organiza las unidades en orden lógico de dificultad
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                Puedes crear la unidad como borrador y publicarla más tarde
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialogo para agregar material */}
      <Dialog open={materialDialog} onClose={handleCloseMaterialDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Agregar material</DialogTitle>
        <DialogContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={materialTab} onChange={handleMaterialTabChange}>
              <Tab icon={<AttachFile />} label="Archivo" />
              <Tab icon={<Link />} label="Enlace" />
              <Tab icon={<YouTube />} label="Video" />
            </Tabs>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Título del material"
                value={materialForm.title}
                onChange={handleMaterialFormChange('title')}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción (opcional)"
                value={materialForm.description}
                onChange={handleMaterialFormChange('description')}
                multiline
                rows={3}
              />
            </Grid>

            {materialForm.type === 'file' ? (
              <Grid item xs={12}>
                <Button variant="outlined" component="label" startIcon={<CloudUpload />}>
                  Seleccionar archivo
                  <input type="file" hidden onChange={handleFileChange} />
                </Button>
                {materialForm.file && (
                  <Typography variant="body2" sx={{ ml: 2, display: 'inline' }}>
                    {materialForm.file.name} • {(materialForm.file.size/1024/1024).toFixed(2)} MB
                  </Typography>
                )}
              </Grid>
            ) : (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={materialForm.type === 'video' ? 'URL de YouTube' : 'URL del recurso'}
                  placeholder={materialForm.type === 'video' ? 'https://www.youtube.com/watch?v=...' : 'https://...'}
                  value={materialForm.url}
                  onChange={handleMaterialFormChange('url')}
                  required
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMaterialDialog}>Cancelar</Button>
          <Button variant="contained" onClick={handleAddMaterial}>Agregar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CreateUnit;
