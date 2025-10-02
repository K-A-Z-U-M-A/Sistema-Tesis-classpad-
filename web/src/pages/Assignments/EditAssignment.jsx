import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Delete,
  AttachFile,
  Add
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import MaterialList from '../../components/MaterialList';
import AssignmentMaterialUpload from '../../components/AssignmentMaterialUpload';

const EditAssignment = () => {
  const { courseId, assignmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [assignment, setAssignment] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    due_date: '',
    due_time: '',
    points: 100,
    status: 'published'
  });

  const isTeacher = user?.role === 'teacher';

  useEffect(() => {
    if (!isTeacher) {
      navigate(`/courses/${courseId}`);
      return;
    }
    loadAssignmentData();
  }, [assignmentId, isTeacher]);

  const loadAssignmentData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Cargar datos de la tarea
      const assignmentRes = await api.request(`/assignments/${assignmentId}`);
      if (!assignmentRes.success) {
        throw new Error('No se pudo cargar la tarea');
      }
      
      const assignmentData = assignmentRes.data.assignment;
      setAssignment(assignmentData);
      
      // Cargar datos del formulario
      setFormData({
        title: assignmentData.title || '',
        description: assignmentData.description || '',
        instructions: assignmentData.instructions || '',
        due_date: assignmentData.due_date ? assignmentData.due_date.split(' ')[0] : '',
        due_time: assignmentData.due_date && assignmentData.due_date.includes(' ') ? assignmentData.due_date.split(' ')[1] : '',
        points: assignmentData.points || 100,
        status: assignmentData.status || 'published'
      });
      
      // Los adjuntos ya vienen en la respuesta principal
      setAttachments(assignmentRes.data.attachments || []);
      
      // Cargar materiales
      const materialsRes = await api.getAssignmentMaterials(assignmentId);
      if (materialsRes.success) {
        setMaterials(materialsRes.data || []);
      }
      
    } catch (err) {
      console.error('Error loading assignment:', err);
      setError(err.message || 'Error al cargar la tarea');
      toast.error('Error al cargar la tarea');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const updateData = {
        title: formData.title,
        description: formData.description,
        instructions: formData.description, // Usar description como instructions
        due_date: formData.due_date || null,
        due_time: formData.due_time || null,
        points: formData.points,
        status: formData.status
      };

      const response = await api.updateAssignment(assignmentId, updateData);
      
      if (response.success) {
        toast.success('Tarea actualizada correctamente');
        navigate(`/courses/${courseId}/assignments/${assignmentId}`);
      } else {
        throw new Error(response.error?.message || 'Error al actualizar la tarea');
      }
      
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast.error(error.message || 'Error al actualizar la tarea');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await api.deleteAssignment(assignmentId);
      
      if (response.success) {
        toast.success('Tarea eliminada correctamente');
        navigate(`/courses/${courseId}`);
      } else {
        throw new Error(response.error?.message || 'Error al eliminar la tarea');
      }
      
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error(error.message || 'Error al eliminar la tarea');
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    try {
      await api.request(`/assignments/${assignmentId}/attachments/${attachmentId}`, { method: 'DELETE' });
      toast.success('Adjunto eliminado');
      loadAssignmentData();
    } catch (error) {
      toast.error('No se pudo eliminar el adjunto');
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    try {
      await api.deleteAssignmentMaterial(materialId);
      toast.success('Material eliminado');
      loadAssignmentData();
    } catch (error) {
      console.error('Error deleting material:', error);
      toast.error('Error al eliminar el material');
    }
  };

  const handleMaterialUploadSuccess = () => {
    loadAssignmentData();
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={() => navigate(`/courses/${courseId}`)}
        >
          Volver al curso
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={() => navigate(`/courses/${courseId}/assignments/${assignmentId}`)}
          sx={{ mb: 2 }}
        >
          Volver a la tarea
        </Button>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            Editar Tarea
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setDeleteDialogOpen(true)}
            >
              Eliminar
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Formulario de edición */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Título */}
          <TextField
            fullWidth
            label="Título de la tarea"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            required
          />

          {/* Descripción e Instrucciones */}
          <TextField
            fullWidth
            label="Descripción e Instrucciones"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            multiline
            rows={6}
            helperText="Describe la tarea, incluyendo objetivos, requisitos e instrucciones detalladas para los estudiantes"
          />

          {/* Fecha y hora límite */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Fecha límite"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
            <TextField
              label="Hora límite"
              type="time"
              value={formData.due_time}
              onChange={(e) => setFormData(prev => ({ ...prev, due_time: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
          </Box>

          {/* Puntos */}
          <TextField
            label="Puntos máximos"
            type="number"
            value={formData.points}
            onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) || 100 }))}
            inputProps={{ min: 1, max: 1000 }}
            sx={{ width: 200 }}
          />

          {/* Estado */}
          <FormControl sx={{ width: 200 }}>
            <InputLabel>Estado</InputLabel>
            <Select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              label="Estado"
            >
              <MenuItem value="draft">Borrador</MenuItem>
              <MenuItem value="published">Publicado</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Adjuntos */}
      {attachments.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Adjuntos ({attachments.length})
          </Typography>
          {attachments.map((attachment) => (
            <Box key={attachment.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <AttachFile />
              <Typography variant="body2" sx={{ flex: 1 }}>
                {attachment.title || attachment.filename}
              </Typography>
              <Button
                size="small"
                color="error"
                onClick={() => handleDeleteAttachment(attachment.id)}
              >
                Eliminar
              </Button>
            </Box>
          ))}
        </Paper>
      )}

      {/* Materiales */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Materiales ({materials.length})
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => setUploadDialogOpen(true)}
          >
            Agregar Material
          </Button>
        </Box>
        
        <MaterialList 
          materials={materials}
          onDelete={handleDeleteMaterial}
          showDelete={true}
        />
      </Paper>

      {/* Botones de acción */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          onClick={() => navigate(`/courses/${courseId}/assignments/${assignmentId}`)}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSave}
          disabled={saving || !formData.title.trim()}
        >
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </Box>

      {/* Dialog para confirmar eliminación */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que quieres eliminar esta tarea? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button color="error" onClick={handleDelete}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para subir materiales */}
      <AssignmentMaterialUpload
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        assignmentId={assignmentId}
        onSuccess={handleMaterialUploadSuccess}
      />
    </Container>
  );
};

export default EditAssignment;
