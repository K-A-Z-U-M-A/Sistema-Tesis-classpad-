import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Stack
} from '@mui/material';
import {
  School,
  Message,
  Announcement,
  Help,
  Chat,
  AccessTime,
  Person,
  Search
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
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const courseEntries = useMemo(
    () => Object.entries(messagesByCourse),
    [messagesByCourse]
  );
  const selectedCourseData = selectedCourseId ? messagesByCourse[selectedCourseId] : null;
  const hasCourses = courseEntries.length > 0;

  const filteredMessages = useMemo(() => {
    if (!selectedCourseData) return [];
    if (!searchTerm.trim()) return selectedCourseData.messages;

    const normalizedSearch = searchTerm.toLowerCase();

    return selectedCourseData.messages.filter((message) => {
      const titleMatch = message.title?.toLowerCase().includes(normalizedSearch);
      const contentMatch = message.content?.toLowerCase().includes(normalizedSearch);
      const authorName = message.author?.name?.toLowerCase();
      const authorUsername = message.author?.username?.toLowerCase();

      return (
        titleMatch ||
        contentMatch ||
        authorName?.includes(normalizedSearch) ||
        authorUsername?.includes(normalizedSearch)
      );
    });
  }, [selectedCourseData, searchTerm]);

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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Mensajes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Revisa conversaciones y anuncios recientes de tus cursos
          </Typography>
        </Box>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!hasCourses) {
    return (
      <Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Mensajes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Revisa conversaciones y anuncios recientes de tus cursos
          </Typography>
        </Box>
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Mensajes
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Revisa conversaciones y anuncios recientes de tus cursos
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper'
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={3}>
          <FormControl fullWidth>
            <InputLabel id="messages-course-select-label">Seleccionar curso</InputLabel>
            <Select
              labelId="messages-course-select-label"
              value={selectedCourseId ?? ''}
              label="Seleccionar curso"
              onChange={(event) => {
                setSelectedCourseId(event.target.value);
                setSearchTerm('');
              }}
            >
              {courseEntries.map(([courseId, courseData]) => (
                <MenuItem key={courseId} value={courseId}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light', color: 'primary.dark' }}>
                      <School fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {courseData.course.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {courseData.course.subject} • {courseData.messages.length} mensaje{courseData.messages.length !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Buscar en los mensajes"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              )
            }}
            placeholder="Título, contenido o autor"
            disabled={!selectedCourseData}
          />
        </Stack>
      </Paper>

      {selectedCourseData ? (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            backgroundColor: 'background.paper'
          }}
        >
          <Box
            sx={{
              px: 3,
              py: 2,
              borderBottom: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: 1
            }}
          >
            <Box>
              <Typography variant="h6" fontWeight={700}>
                {selectedCourseData.course.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Conversaciones recientes
              </Typography>
            </Box>
            <Chip
              label={`${filteredMessages.length} mensaje${filteredMessages.length !== 1 ? 's' : ''}`}
              color="primary"
              variant="outlined"
              size="small"
            />
          </Box>

          {filteredMessages.length === 0 ? (
            <Box sx={{ px: 3, py: 6, textAlign: 'center' }}>
              <Alert severity="info" sx={{ justifyContent: 'center' }}>
                {searchTerm ? 'No se encontraron mensajes que coincidan con la búsqueda' : 'No hay mensajes registrados en este curso'}
              </Alert>
            </Box>
          ) : (
            filteredMessages.map((message, msgIndex) => {
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
                    transition: 'background-color 0.2s ease, transform 0.2s ease',
                    backgroundColor: 'background.default',
                    borderLeft: '3px solid',
                    borderLeftColor: getMessageAccentColor(message.type),
                    '&:hover': { backgroundColor: 'grey.50', transform: 'translateX(4px)' }
                  }}
                  onClick={() => handleMessageClick(selectedCourseId, message.id)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Avatar sx={{ width: 48, height: 48, bgcolor: 'grey.100', border: '1px solid', borderColor: 'divider' }}>
                      <Person sx={{ color: 'text.secondary' }} />
                    </Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                        <Typography variant="subtitle2" fontWeight={700}>
                          {authorName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          @{authorUsername}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                          <AccessTime fontSize="inherit" sx={{ fontSize: 14 }} />
                          <Typography variant="caption" color="inherit">
                            {formatDate(message.created_at)}
                          </Typography>
                        </Box>
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
                  {msgIndex < filteredMessages.length - 1 && (
                    <Divider sx={{ mt: 2 }} />
                  )}
                </Box>
              );
            })
          )}
        </Paper>
      ) : (
        <Alert severity="info">
          Selecciona un curso para ver sus mensajes.
        </Alert>
      )}
    </Box>
  );
}
