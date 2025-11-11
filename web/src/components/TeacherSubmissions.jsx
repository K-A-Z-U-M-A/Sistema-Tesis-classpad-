import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Paper,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Person,
  AttachFile,
  Download,
  Grade,
  Schedule,
  CheckCircle,
  Pending,
  Edit
} from '@mui/icons-material';
import TextField from '@mui/material/TextField';
import toast from 'react-hot-toast';
import api from '../services/api';

const TeacherSubmissions = ({ assignmentId, courseId }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [gradingData, setGradingData] = useState({ grade: '', feedback: '' });
  const [gradingLoading, setGradingLoading] = useState(false);
  const [assignment, setAssignment] = useState(null);

  useEffect(() => {
    loadSubmissions();
    loadAssignment();
  }, [assignmentId]);

  const loadAssignment = async () => {
    try {
      const response = await api.request(`/assignments/${assignmentId}`);
      if (response.success) {
        setAssignment(response.data.assignment);
      }
    } catch (error) {
      console.error('Error loading assignment:', error);
    }
  };

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const response = await api.request(`/submissions/assignment/${assignmentId}`);
      
      if (response.success) {
        setSubmissions(response.data);
        console.log('🔍 Teacher submissions loaded:', response.data);
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
      setError('Error al cargar las entregas');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFile = async (file) => {
    try {
      console.log('🔍 Downloading file:', file);
      
      const response = await fetch(file.url, {
        method: 'GET',
        headers: {
          'Accept': 'application/octet-stream',
        },
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('El archivo descargado está vacío');
      }
      
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = file.original_name;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
      
    } catch (error) {
      console.error('Error downloading file:', error);
      setError('Error al descargar el archivo: ' + error.message);
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'submitted':
        return {
          icon: <CheckCircle />,
          label: 'Entregada',
          color: 'success'
        };
      case 'draft':
        return {
          icon: <Pending />,
          label: 'Borrador',
          color: 'warning'
        };
      case 'graded':
        return {
          icon: <Grade />,
          label: 'Calificada',
          color: 'primary'
        };
      default:
        return {
          icon: <Pending />,
          label: 'Pendiente',
          color: 'default'
        };
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleGradeSubmission = async () => {
    if (!selectedSubmission || !gradingData.grade) {
      toast.error('Por favor ingresa una calificación');
      return;
    }

    const grade = parseFloat(gradingData.grade);
    const maxPoints = assignment?.max_points || 100;

    if (grade < 0 || grade > maxPoints) {
      toast.error(`La calificación debe estar entre 0 y ${maxPoints}`);
      return;
    }

    try {
      setGradingLoading(true);
      const response = await api.request(`/assignments/${assignmentId}/grade`, {
        method: 'PUT',
        body: JSON.stringify({
          student_id: selectedSubmission.student_id,
          grade: grade,
          feedback: gradingData.feedback || null
        })
      });

      if (response.success) {
        toast.success('Tarea calificada correctamente. El estudiante recibirá una notificación.');
        setDialogOpen(false);
        setSelectedSubmission(null);
        setGradingData({ grade: '', feedback: '' });
        loadSubmissions(); // Recargar las entregas
      } else {
        throw new Error(response.error?.message || 'Error al calificar la tarea');
      }
    } catch (error) {
      console.error('Error grading submission:', error);
      toast.error(error.message || 'Error al calificar la tarea');
    } finally {
      setGradingLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (submissions.length === 0) {
    return (
      <Card>
        <CardContent>
          <Box textAlign="center" py={4}>
            <AttachFile sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No hay entregas aún
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Los estudiantes aún no han entregado esta tarea
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Entregas de Estudiantes ({submissions.length})
      </Typography>
      
      {submissions.map((submission, index) => {
        const statusInfo = getStatusInfo(submission.status);
        
        return (
          <Card key={submission.id} sx={{ mb: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar>
                    <Person />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {submission.student_name || 'Estudiante'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {submission.student_email}
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  icon={statusInfo.icon}
                  label={statusInfo.label}
                  color={statusInfo.color}
                  variant="filled"
                />
              </Box>

              {submission.submitted_at && (
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    <Schedule fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                    Entregada el: {new Date(submission.submitted_at).toLocaleString('es-ES')}
                  </Typography>
                </Box>
              )}

              {submission.content && (
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Comentarios del estudiante:
                  </Typography>
                  <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                    <Typography variant="body2">
                      {submission.content}
                    </Typography>
                  </Paper>
                </Box>
              )}

              {submission.files && submission.files.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Archivos adjuntos ({submission.files.length}):
                  </Typography>
                  <List dense>
                    {submission.files.map((file) => (
                      <ListItem
                        key={file.id}
                        sx={{
                          cursor: 'pointer',
                          borderRadius: 1,
                          '&:hover': { backgroundColor: 'action.hover' }
                        }}
                        onClick={() => handleDownloadFile(file)}
                      >
                        <ListItemText
                          primary={file.original_name}
                          secondary={`${formatFileSize(file.file_size)} • ${file.mime_type} • Click para descargar`}
                        />
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
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {submission.grade !== null ? (
                <Box mt={2}>
                  <Paper sx={{ p: 2, backgroundColor: 'success.light', color: 'white' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="h6">
                          Calificación: {submission.grade} / {assignment?.max_points || 100}
                        </Typography>
                        {submission.feedback && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>Comentarios:</strong> {submission.feedback}
                          </Typography>
                        )}
                      </Box>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Edit />}
                        onClick={() => {
                          setSelectedSubmission(submission);
                          setGradingData({ 
                            grade: submission.grade || '', 
                            feedback: submission.feedback || '' 
                          });
                          setDialogOpen(true);
                        }}
                        sx={{ color: 'white', borderColor: 'white', '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' } }}
                      >
                        Editar
                      </Button>
                    </Box>
                  </Paper>
                </Box>
              ) : (
                <Box mt={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Grade />}
                    onClick={() => {
                      setSelectedSubmission(submission);
                      setGradingData({ grade: '', feedback: '' });
                      setDialogOpen(true);
                    }}
                    fullWidth
                  >
                    Calificar Tarea
                  </Button>
                </Box>
              )}

              {index < submissions.length - 1 && <Divider sx={{ mt: 2 }} />}
            </CardContent>
          </Card>
        );
      })}

      {/* Dialog de calificación */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => {
          setDialogOpen(false);
          setSelectedSubmission(null);
          setGradingData({ grade: '', feedback: '' });
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedSubmission?.grade !== null ? 'Editar Calificación' : 'Calificar Tarea'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {selectedSubmission && (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Estudiante: {selectedSubmission.student_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Puntos máximos: {assignment?.max_points || 100}
                </Typography>
              </Box>
            )}
            <TextField
              label="Calificación (puntos)"
              type="number"
              value={gradingData.grade}
              onChange={(e) => setGradingData(prev => ({ ...prev, grade: e.target.value }))}
              fullWidth
              required
              inputProps={{ 
                min: 0, 
                max: assignment?.max_points || 100,
                step: 0.1
              }}
              helperText={`Máximo: ${assignment?.max_points || 100} puntos`}
            />
            <TextField
              label="Comentarios / Retroalimentación"
              value={gradingData.feedback}
              onChange={(e) => setGradingData(prev => ({ ...prev, feedback: e.target.value }))}
              fullWidth
              multiline
              rows={4}
              placeholder="Escribe comentarios sobre la entrega del estudiante..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setDialogOpen(false);
              setSelectedSubmission(null);
              setGradingData({ grade: '', feedback: '' });
            }}
            disabled={gradingLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleGradeSubmission}
            disabled={gradingLoading || !gradingData.grade || parseFloat(gradingData.grade) < 0}
            startIcon={gradingLoading ? <CircularProgress size={20} /> : <Grade />}
          >
            {gradingLoading ? 'Guardando...' : 'Guardar Calificación'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeacherSubmissions;
