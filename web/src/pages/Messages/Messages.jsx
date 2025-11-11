import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  ButtonBase
} from '@mui/material';
import {
  School,
  Message,
  Announcement,
  Help,
  Chat,
  AccessTime,
  Person
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const getMessageTypeIcon = (type) => {
  switch (type) {
    case 'announcement':
      return <Announcement color="primary" />;
    case 'discussion':
      return <Chat color="secondary" />;
    case 'question':
      return <Help color="warning" />;
    default:
      return <Message color="action" />;
  }
};

const getMessageTypeColor = (type) => {
  switch (type) {
    case 'announcement':
      return 'primary';
    case 'discussion':
      return 'secondary';
    case 'question':
      return 'warning';
    default:
      return 'default';
  }
};

const getMessageAccentColor = (type) => {
  switch (type) {
    case 'announcement':
      return 'primary.main';
    case 'discussion':
      return 'secondary.main';
    case 'question':
      return 'warning.main';
    default:
      return 'divider';
  }
};

const getMessageTypeLabel = (type) => {
  switch (type) {
    case 'announcement':
      return 'Anuncio';
    case 'discussion':
      return 'Discusión';
    case 'question':
      return 'Pregunta';
    default:
      return 'Mensaje';
  }
};

export default function Messages() {
  const [messagesByCourse, setMessagesByCourse] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadAllMessages();
  }, []);

  useEffect(() => {
    const courseIds = Object.keys(messagesByCourse);

    if (courseIds.length === 0) {
      setSelectedCourseId(null);
      return;
    }

    if (!selectedCourseId || !messagesByCourse[selectedCourseId]) {
      setSelectedCourseId(courseIds[0]);
    }
  }, [messagesByCourse, selectedCourseId]);

  const loadAllMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.request('/messages');
      
      if (response.success) {
        setMessagesByCourse(response.data.messagesByCourse);
        const courseIds = Object.keys(response.data.messagesByCourse);
        if (courseIds.length > 0) {
          setSelectedCourseId(courseIds[0]);
        }
      } else {
        throw new Error('Error al cargar los mensajes');
      }
    } catch (err) {
      console.error('Error loading messages:', err);
      setError(err.message);
      toast.error('Error al cargar los mensajes');
    } finally {
      setLoading(false);
    }
  };

  const handleMessageClick = (courseId, messageId) => {
    navigate(`/courses/${courseId}?tab=messages&message=${messageId}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Hoy';
    } else if (diffDays === 2) {
      return 'Ayer';
    } else if (diffDays <= 7) {
      return `Hace ${diffDays - 1} días`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 700 }}>
          Mensajes
        </Typography>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const courseEntries = Object.entries(messagesByCourse);
  const selectedCourseData = selectedCourseId ? messagesByCourse[selectedCourseId] : null;

  if (courseEntries.length === 0) {
    return (
      <Box>
        <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 700 }}>
          Mensajes
        </Typography>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Message sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No hay mensajes
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Los mensajes de tus cursos aparecerán aquí
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 700 }}>
        Mensajes
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Todos los mensajes de tus cursos
      </Typography>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          backgroundColor: 'grey.50',
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Selecciona un curso
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {courseEntries.map(([courseId, courseData]) => {
            const isSelected = courseId === selectedCourseId;
            return (
              <ButtonBase
                key={courseId}
                onClick={() => setSelectedCourseId(courseId)}
                sx={{
                  borderRadius: '9999px',
                  px: 2,
                  py: 1,
                  border: '1px solid',
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  backgroundColor: isSelected ? 'primary.main' : 'grey.100',
                  color: isSelected ? 'primary.contrastText' : 'text.primary',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? 3 : 0,
                  '&:hover': {
                    boxShadow: isSelected ? 3 : 1,
                    backgroundColor: isSelected ? 'primary.dark' : 'grey.200',
                    borderColor: 'primary.main'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: isSelected ? 'primary.dark' : 'grey.200',
                      color: isSelected ? 'primary.contrastText' : 'text.primary'
                    }}
                  >
                    <School fontSize="small" />
                  </Avatar>
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {courseData.course.name}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }} noWrap>
                      {courseData.course.subject} • {courseData.messages.length} mensaje{courseData.messages.length !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                </Box>
              </ButtonBase>
            );
          })}
        </Box>
      </Paper>

      {selectedCourseData && (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            backgroundColor: 'background.paper'
          }}
        >
          <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight={700}>
              {selectedCourseData.course.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Conversaciones recientes
            </Typography>
          </Box>

          {selectedCourseData.messages.map((message, msgIndex) => {
            const authorName = message.author?.name || 'Usuario';
            const authorUsername =
              message.author?.username ||
              authorName
                .toLowerCase()
                .replace(/\s+/g, '')
                .replace(/[^a-z0-9_]/g, '');

            return (
              <Box
                key={message.id}
                sx={{
                  px: 3,
                  py: 2,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                  backgroundColor: 'background.default',
                  borderLeft: '3px solid',
                  borderLeftColor: getMessageAccentColor(message.type),
                  '&:hover': { backgroundColor: 'grey.50' }
                }}
                onClick={() => handleMessageClick(selectedCourseId, message.id)}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Avatar sx={{ width: 48, height: 48, bgcolor: 'grey.100', border: '1px solid', borderColor: 'divider' }}>
                    <Person sx={{ color: 'text.secondary' }} />
                  </Avatar>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {authorName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        @{authorUsername}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        • {formatDate(message.created_at)}
                      </Typography>
                    </Box>

                    {message.title && (
                      <Typography variant="subtitle1" fontWeight="medium" sx={{ mt: 0.5 }}>
                        {message.title}
                      </Typography>
                    )}

                    <Typography variant="body1" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                      {message.content}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Chip
                        icon={getMessageTypeIcon(message.type)}
                        label={getMessageTypeLabel(message.type)}
                        color={getMessageTypeColor(message.type)}
                        size="small"
                        variant="outlined"
                      />
                      {message.is_pinned && (
                        <Chip
                          label="Fijado"
                          color="warning"
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>
                </Box>
                {msgIndex < selectedCourseData.messages.length - 1 && (
                  <Divider sx={{ mt: 2 }} />
                )}
              </Box>
            );
          })}
        </Paper>
      )}
    </Box>
  );
}
