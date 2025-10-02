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
  Pending
} from '@mui/icons-material';
import api from '../services/api';

const TeacherSubmissions = ({ assignmentId }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadSubmissions();
  }, [assignmentId]);

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

              {submission.grade !== null && (
                <Box mt={2}>
                  <Paper sx={{ p: 2, backgroundColor: 'success.light', color: 'white' }}>
                    <Typography variant="h6">
                      Calificación: {submission.grade}
                    </Typography>
                    {submission.feedback && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>Comentarios:</strong> {submission.feedback}
                      </Typography>
                    )}
                  </Paper>
                </Box>
              )}

              {index < submissions.length - 1 && <Divider sx={{ mt: 2 }} />}
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
};

export default TeacherSubmissions;
