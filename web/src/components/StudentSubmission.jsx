import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Chip,
  Divider,
  CircularProgress,
  Paper
} from '@mui/material';
import {
  Assignment,
  Send,
  Save,
  Schedule,
  CheckCircle,
  Edit,
  Undo
} from '@mui/icons-material';
import api from '../services/api.js';
import SubmissionFileUpload from './SubmissionFileUpload.jsx';

const StudentSubmission = ({ assignmentId, assignment }) => {
  const [submission, setSubmission] = useState(null);
  const [files, setFiles] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadSubmission();
  }, [assignmentId]);

  const loadSubmission = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const response = await api.request(`/submissions/my/${assignmentId}`);
      
      console.log('🔍 Loading submission response:', response);
      
      if (response.success) {
        setSubmission(response.data.submission);
        setFiles(response.data.files || []);
        setContent(response.data.submission?.content || '');
        console.log('🔍 Submission loaded:', response.data.submission);
        console.log('🔍 Files loaded:', response.data.files);
      }
    } catch (error) {
      console.error('Error loading submission:', error);
      setError('Error al cargar la entrega');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      setError('');
      
      const response = await api.request('/submissions', {
        method: 'POST',
        body: JSON.stringify({
          assignmentId,
          content,
          status: 'draft'
        })
      });

      if (response.success) {
        setSubmission(response.data);
        setSuccess('Borrador guardado exitosamente');
        setTimeout(() => setSuccess(''), 3000);
        // Recargar los datos completos para actualizar archivos
        await loadSubmission(false);
      } else {
        setError(response.error || 'Error al guardar el borrador');
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      setError('Error al guardar el borrador');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && files.length === 0) {
      setError('Debes agregar contenido o al menos un archivo para entregar');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      const response = await api.request('/submissions', {
        method: 'POST',
        body: JSON.stringify({
          assignmentId,
          content,
          status: 'submitted'
        })
      });

      if (response.success) {
        console.log('🔍 Submit response:', response.data);
        setSubmission(response.data);
        setSuccess('¡Tarea entregada exitosamente!');
        setTimeout(() => setSuccess(''), 5000);
        // Recargar los datos completos para actualizar archivos
        console.log('🔍 Reloading submission after submit...');
        await loadSubmission(false);
      } else {
        setError(response.error || 'Error al entregar la tarea');
      }
    } catch (error) {
      console.error('Error submitting:', error);
      setError('Error al entregar la tarea');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelSubmission = async () => {
    if (!window.confirm('¿Estás seguro de que quieres cancelar tu entrega? Podrás volver a entregarla más tarde.')) {
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      const response = await api.request('/submissions', {
        method: 'POST',
        body: JSON.stringify({
          assignmentId,
          content,
          status: 'draft'
        })
      });

      if (response.success) {
        setSubmission(response.data);
        setSuccess('Entrega cancelada. Puedes seguir editando y volver a entregar.');
        setTimeout(() => setSuccess(''), 5000);
        // Recargar los datos completos para actualizar archivos
        await loadSubmission(false);
      } else {
        setError(response.error || 'Error al cancelar la entrega');
      }
    } catch (error) {
      console.error('Error canceling submission:', error);
      setError('Error al cancelar la entrega');
    } finally {
      setSaving(false);
    }
  };

  const handleFileAdded = (file) => {
    setFiles(prev => [...prev, file]);
    setError('');
  };

  const handleFileUpload = async (file) => {
    try {
      // Si no hay submission, crear una primero
      if (!submission) {
        const response = await api.request('/submissions', {
          method: 'POST',
          body: JSON.stringify({
            assignmentId,
            content: content || '',
            status: 'draft'
          })
        });

        if (response.success) {
          setSubmission(response.data);
          // Ahora subir el archivo
          return await api.request(`/submissions/${response.data.id}/files`, {
            method: 'POST',
            body: file
          });
        } else {
          throw new Error(response.error || 'Error al crear la entrega');
        }
      } else {
        // Si ya hay submission, subir directamente
        return await api.request(`/submissions/${submission.id}/files`, {
          method: 'POST',
          body: file
        });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const handleFileDeleted = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const getStatusInfo = () => {
    if (!submission) {
      return { color: 'default', label: 'Sin entregar', icon: <Assignment /> };
    }

    switch (submission.status) {
      case 'draft':
        return { color: 'warning', label: 'Borrador', icon: <Edit /> };
      case 'submitted':
        return { color: 'success', label: 'Entregada', icon: <CheckCircle /> };
      case 'graded':
        return { color: 'info', label: 'Calificada', icon: <CheckCircle /> };
      case 'returned':
        return { color: 'secondary', label: 'Devuelta', icon: <Assignment /> };
      default:
        return { color: 'default', label: 'Sin entregar', icon: <Assignment /> };
    }
  };

  const isSubmitted = submission?.status === 'submitted' || submission?.status === 'graded' || submission?.status === 'returned';
  const isGraded = submission?.status === 'graded' || submission?.status === 'returned';
  const canEdit = !isGraded; // Permitir edición si no está calificada
  const canCancelSubmission = submission?.status === 'submitted' && !isGraded; // Permitir cancelar si está entregada pero no calificada

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  const statusInfo = getStatusInfo();

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" component="h2">
            Mi Entrega
          </Typography>
          <Chip
            icon={statusInfo.icon}
            label={statusInfo.label}
            color={statusInfo.color}
            variant="filled"
          />
        </Box>

        {submission?.submitted_at && (
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary">
              <Schedule fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
              Entregada el: {new Date(submission.submitted_at).toLocaleString('es-ES')}
            </Typography>
          </Box>
        )}

        {submission && submission.grade !== null && (
          <Box mb={2}>
            <Paper sx={{ p: 2, backgroundColor: 'success.light', color: 'white' }}>
              <Typography variant="h6">
                Calificación: {submission.grade} / {assignment?.points || 100}
              </Typography>
              {submission.feedback && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Comentarios:</strong> {submission.feedback}
                </Typography>
              )}
            </Paper>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Content Section */}
        <Box mb={3}>
          <Typography variant="subtitle1" gutterBottom>
            Descripción de tu entrega
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Describe tu trabajo, respuestas, o cualquier información adicional..."
            disabled={!canEdit}
            variant="outlined"
          />
        </Box>

        {/* File Upload Section */}
        <Box mb={3}>
          <SubmissionFileUpload
            submissionId={submission?.id}
            files={files}
            onFileAdded={handleFileAdded}
            onFileDeleted={handleFileDeleted}
            onFileUpload={handleFileUpload}
            disabled={!canEdit}
          />
        </Box>

        {/* Action Buttons */}
        {canEdit && (
          <Box display="flex" gap={2} justifyContent="flex-end">
            {canCancelSubmission ? (
              // Si está entregada pero no calificada, solo mostrar cancelar
              <Button
                variant="outlined"
                startIcon={<Undo />}
                onClick={handleCancelSubmission}
                disabled={saving}
                color="warning"
              >
                {saving ? 'Cancelando...' : 'Cancelar Entrega'}
              </Button>
            ) : (
              // Si está en borrador, mostrar guardar y entregar
              <>
                <Button
                  variant="outlined"
                  startIcon={<Save />}
                  onClick={handleSaveDraft}
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Guardar Borrador'}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Send />}
                  onClick={handleSubmit}
                  disabled={saving || (!content.trim() && files.length === 0)}
                  color="primary"
                >
                  {saving ? 'Entregando...' : 'Entregar Tarea'}
                </Button>
              </>
            )}
          </Box>
        )}

        {canCancelSubmission && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Esta tarea ha sido entregada. Puedes cancelar la entrega para hacer cambios antes de la fecha límite.
          </Alert>
        )}

        {isGraded && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Esta tarea ya ha sido calificada. No puedes hacer cambios adicionales.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentSubmission;
