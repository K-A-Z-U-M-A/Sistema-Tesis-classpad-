import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Switch,
  Paper,
  CircularProgress,
  Alert,
  Stack,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Email as EmailIcon,
  Assignment as AssignmentIcon,
  Grade as GradeIcon,
  MenuBook as UnitIcon,
  Campaign as AnnouncementIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  AssignmentTurnedIn as SubmissionIcon,
  QuestionAnswer as MessageIcon,
  GroupAdd as EnrollmentIcon,
  School as TeacherIcon,
  Person as StudentIcon
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import apiService from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const NotificationEmailPreferences = ({ compact = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  const role = user?.role || 'student';
  const isTeacher = role === 'teacher' || role === 'admin';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    email_enabled: true,
    assignments_email: true,
    grades_email: true,
    units_email: true,
    announcements_email: true,
    messages_email: true,
    submissions_email: true,
    enrollments_email: true,
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const response = await apiService.getNotificationPreferences();
      if (response && response.data) {
        setPreferences({
          email_enabled: response.data.email_enabled !== false,
          assignments_email: response.data.assignments_email !== false,
          grades_email: response.data.grades_email !== false,
          units_email: response.data.units_email !== false,
          announcements_email: response.data.announcements_email !== false,
          messages_email: response.data.messages_email !== false,
          submissions_email: response.data.submissions_email !== false,
          enrollments_email: response.data.enrollments_email !== false,
        });
      }
    } catch (error) {
      console.error('Error cargando preferencias de notificación:', error);
      toast.error('No se pudieron cargar las preferencias');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key) => {
    const updated = {
      ...preferences,
      [key]: !preferences[key]
    };

    setPreferences(updated);

    try {
      setSaving(true);
      const res = await apiService.updateNotificationPreferences(updated);
      if (res && res.success) {
        toast.success('Preferencias de correo guardadas', { id: 'pref-toast' });
      }
    } catch (error) {
      console.error('Error guardando preferencias:', error);
      toast.error('Error al guardar preferencia', { id: 'pref-toast' });
      // Revertir en caso de error
      setPreferences(preferences);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      {/* Master Switch Banner */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5 },
          mb: 2.5,
          borderRadius: 3,
          background: preferences.email_enabled
            ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)'
            : 'rgba(0,0,0,0.03)',
          border: '1px solid',
          borderColor: preferences.email_enabled ? 'primary.light' : 'divider',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: { xs: 1.5, sm: 2 },
          transition: 'all 0.2s ease'
        }}
      >
        <Box display="flex" alignItems="flex-start" gap={1.5} sx={{ minWidth: 0, width: '100%' }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: preferences.email_enabled ? 'primary.main' : 'action.disabledBackground',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <EmailIcon fontSize="small" />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
              <Typography variant="subtitle1" fontWeight="700" color="text.primary" sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                Notificaciones por Correo
              </Typography>
              <Chip
                size="small"
                icon={isTeacher ? <TeacherIcon sx={{ fontSize: '13px !important' }} /> : <StudentIcon sx={{ fontSize: '13px !important' }} />}
                label={isTeacher ? 'Docente' : 'Estudiante'}
                variant="outlined"
                color={isTeacher ? 'secondary' : 'primary'}
                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, lineHeight: 1.3 }}>
              Recibe avisos y alertas importantes en tu buzón
            </Typography>
          </Box>
        </Box>

        <Box 
          display="flex" 
          alignItems="center" 
          justifyContent={{ xs: 'space-between', sm: 'flex-end' }} 
          gap={1}
          sx={{ width: { xs: '100%', sm: 'auto' }, pt: { xs: 0.5, sm: 0 }, borderTop: { xs: '1px dashed rgba(0,0,0,0.08)', sm: 'none' } }}
        >
          <Chip
            size="small"
            icon={preferences.email_enabled ? <ActiveIcon fontSize="small" /> : <InactiveIcon fontSize="small" />}
            label={preferences.email_enabled ? 'Activado' : 'Pausado'}
            color={preferences.email_enabled ? 'primary' : 'default'}
            variant={preferences.email_enabled ? 'filled' : 'outlined'}
            sx={{ fontWeight: 600 }}
          />
          <Switch
            checked={preferences.email_enabled}
            onChange={() => handleToggle('email_enabled')}
            color="primary"
            disabled={saving}
          />
        </Box>
      </Paper>

      {/* Category options (disabled when master switch is off) */}
      <Box sx={{ opacity: preferences.email_enabled ? 1 : 0.45, pointerEvents: preferences.email_enabled ? 'auto' : 'none', transition: 'opacity 0.2s ease' }}>
        <Typography variant="caption" color="text.secondary" fontWeight="700" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1.5, px: 0.5 }}>
          {isTeacher ? 'Avisos de Gestión Docente' : 'Avisos Académicos por Correo'}
        </Typography>

        <Stack spacing={1.5}>
          {/* ===================== OPCIONES PARA DOCENTES ===================== */}
          {isTeacher ? (
            <>
              {/* Entregas de Alumnos */}
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 1.5, sm: 1.75 },
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1.5,
                  bgcolor: 'background.paper',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <Box display="flex" alignItems="center" gap={1.5} sx={{ minWidth: 0, flex: 1 }}>
                  <Box sx={{ p: 0.8, borderRadius: 2, bgcolor: '#ccfbf1', color: '#0f766e', display: 'flex', flexShrink: 0 }}>
                    <SubmissionIcon fontSize="small" />
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="body2" fontWeight="600" color="text.primary" sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                      Nuevas Entregas de Tareas
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3 }}>
                      Avisos cuando un alumno envía su trabajo
                    </Typography>
                  </Box>
                </Box>
                <Switch
                  checked={preferences.submissions_email}
                  onChange={() => handleToggle('submissions_email')}
                  color="primary"
                  size={isMobile ? 'small' : 'medium'}
                  disabled={!preferences.email_enabled || saving}
                  sx={{ flexShrink: 0 }}
                />
              </Paper>

              {/* Consultas y Mensajes */}
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 1.5, sm: 1.75 },
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1.5,
                  bgcolor: 'background.paper',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <Box display="flex" alignItems="center" gap={1.5} sx={{ minWidth: 0, flex: 1 }}>
                  <Box sx={{ p: 0.8, borderRadius: 2, bgcolor: '#e0f2fe', color: '#0284c7', display: 'flex', flexShrink: 0 }}>
                    <MessageIcon fontSize="small" />
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="body2" fontWeight="600" color="text.primary" sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                      Consultas y Mensajes de Alumnos
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3 }}>
                      Preguntas y comentarios en el tablón del curso
                    </Typography>
                  </Box>
                </Box>
                <Switch
                  checked={preferences.messages_email}
                  onChange={() => handleToggle('messages_email')}
                  color="info"
                  size={isMobile ? 'small' : 'medium'}
                  disabled={!preferences.email_enabled || saving}
                  sx={{ flexShrink: 0 }}
                />
              </Paper>

              {/* Inscripciones de Alumnos */}
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 1.5, sm: 1.75 },
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1.5,
                  bgcolor: 'background.paper',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <Box display="flex" alignItems="center" gap={1.5} sx={{ minWidth: 0, flex: 1 }}>
                  <Box sx={{ p: 0.8, borderRadius: 2, bgcolor: '#ede9fe', color: '#6d28d9', display: 'flex', flexShrink: 0 }}>
                    <EnrollmentIcon fontSize="small" />
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="body2" fontWeight="600" color="text.primary" sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                      Nuevas Inscripciones de Alumnos
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3 }}>
                      Avisos cuando se matriculan nuevos alumnos en tus cursos
                    </Typography>
                  </Box>
                </Box>
                <Switch
                  checked={preferences.enrollments_email}
                  onChange={() => handleToggle('enrollments_email')}
                  color="secondary"
                  size={isMobile ? 'small' : 'medium'}
                  disabled={!preferences.email_enabled || saving}
                  sx={{ flexShrink: 0 }}
                />
              </Paper>
            </>
          ) : (
            /* ===================== OPCIONES PARA ESTUDIANTES ===================== */
            <>
              {/* Tareas */}
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 1.5, sm: 1.75 },
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1.5,
                  bgcolor: 'background.paper',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <Box display="flex" alignItems="center" gap={1.5} sx={{ minWidth: 0, flex: 1 }}>
                  <Box sx={{ p: 0.8, borderRadius: 2, bgcolor: '#eff6ff', color: '#2563eb', display: 'flex', flexShrink: 0 }}>
                    <AssignmentIcon fontSize="small" />
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="body2" fontWeight="600" color="text.primary" sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                      Nuevas Tareas Asignadas
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3 }}>
                      Avisos inmediatos con fecha límite y puntaje
                    </Typography>
                  </Box>
                </Box>
                <Switch
                  checked={preferences.assignments_email}
                  onChange={() => handleToggle('assignments_email')}
                  color="primary"
                  size={isMobile ? 'small' : 'medium'}
                  disabled={!preferences.email_enabled || saving}
                  sx={{ flexShrink: 0 }}
                />
              </Paper>

              {/* Calificaciones */}
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 1.5, sm: 1.75 },
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1.5,
                  bgcolor: 'background.paper',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <Box display="flex" alignItems="center" gap={1.5} sx={{ minWidth: 0, flex: 1 }}>
                  <Box sx={{ p: 0.8, borderRadius: 2, bgcolor: '#ecfdf5', color: '#059669', display: 'flex', flexShrink: 0 }}>
                    <GradeIcon fontSize="small" />
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="body2" fontWeight="600" color="text.primary" sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                      Calificaciones y Notas
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3 }}>
                      Avisos de notas publicadas y comentarios
                    </Typography>
                  </Box>
                </Box>
                <Switch
                  checked={preferences.grades_email}
                  onChange={() => handleToggle('grades_email')}
                  color="success"
                  size={isMobile ? 'small' : 'medium'}
                  disabled={!preferences.email_enabled || saving}
                  sx={{ flexShrink: 0 }}
                />
              </Paper>

              {/* Unidades y Materiales */}
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 1.5, sm: 1.75 },
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1.5,
                  bgcolor: 'background.paper',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <Box display="flex" alignItems="center" gap={1.5} sx={{ minWidth: 0, flex: 1 }}>
                  <Box sx={{ p: 0.8, borderRadius: 2, bgcolor: '#f5f3ff', color: '#7c3aed', display: 'flex', flexShrink: 0 }}>
                    <UnitIcon fontSize="small" />
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="body2" fontWeight="600" color="text.primary" sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                      Nuevas Unidades y Materiales
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3 }}>
                      Avisos de nuevo contenido o material de estudio
                    </Typography>
                  </Box>
                </Box>
                <Switch
                  checked={preferences.units_email}
                  onChange={() => handleToggle('units_email')}
                  color="secondary"
                  size={isMobile ? 'small' : 'medium'}
                  disabled={!preferences.email_enabled || saving}
                  sx={{ flexShrink: 0 }}
                />
              </Paper>

              {/* Anuncios del Docente */}
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 1.5, sm: 1.75 },
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1.5,
                  bgcolor: 'background.paper',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <Box display="flex" alignItems="center" gap={1.5} sx={{ minWidth: 0, flex: 1 }}>
                  <Box sx={{ p: 0.8, borderRadius: 2, bgcolor: '#fff7ed', color: '#ea580c', display: 'flex', flexShrink: 0 }}>
                    <AnnouncementIcon fontSize="small" />
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="body2" fontWeight="600" color="text.primary" sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                      Anuncios y Mensajes del Docente
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3 }}>
                      Comunicados del profesor en el curso
                    </Typography>
                  </Box>
                </Box>
                <Switch
                  checked={preferences.announcements_email}
                  onChange={() => handleToggle('announcements_email')}
                  color="warning"
                  size={isMobile ? 'small' : 'medium'}
                  disabled={!preferences.email_enabled || saving}
                  sx={{ flexShrink: 0 }}
                />
              </Paper>
            </>
          )}
        </Stack>
      </Box>

      {/* Info notice */}
      <Alert 
        severity="info" 
        sx={{ 
          mt: 2.5, 
          borderRadius: 2, 
          '& .MuiAlert-message': { 
            fontSize: '0.8rem',
            wordBreak: 'break-all'
          } 
        }}
      >
        Los correos son enviados a tu cuenta: <strong>{user?.email}</strong>.
      </Alert>
    </Box>
  );
};

export default NotificationEmailPreferences;
