import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Card, 
  CardContent, 
  Avatar, 
  Chip, 
  CircularProgress, 
  Alert,
  Divider,
  IconButton,
  Collapse,
  Button
} from '@mui/material';
import {
  School,
  Message,
  Announcement,
  Help,
  Chat,
  ExpandMore,
  ExpandLess,
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
  const [expandedCourses, setExpandedCourses] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    loadAllMessages();
  }, []);

  const loadAllMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.request('/messages');
      
      if (response.success) {
        setMessagesByCourse(response.data.messagesByCourse);
        // Expandir el primer curso por defecto
        const courseIds = Object.keys(response.data.messagesByCourse);
        if (courseIds.length > 0) {
          setExpandedCourses({ [courseIds[0]]: true });
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

  const toggleCourseExpansion = (courseId) => {
    setExpandedCourses(prev => ({
      ...prev,
      [courseId]: !prev[courseId]
    }));
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

      {courseEntries.map(([courseId, courseData], index) => (
        <Paper key={courseId} sx={{ mb: 2, overflow: 'hidden' }}>
          <Card>
            <CardContent sx={{ p: 0 }}>
              {/* Course Header */}
              <Box
                sx={{
                  p: 2,
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
                onClick={() => toggleCourseExpansion(courseId)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.dark' }}>
                    <School />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {courseData.course.name}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      {courseData.course.subject} • {courseData.messages.length} mensaje{courseData.messages.length !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                </Box>
                <IconButton sx={{ color: 'primary.contrastText' }}>
                  {expandedCourses[courseId] ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>

              {/* Messages List */}
              <Collapse in={expandedCourses[courseId]}>
                <Box>
                  {courseData.messages.map((message, msgIndex) => (
                    <Box key={message.id}>
                      <Box
                        sx={{
                          p: 2,
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'action.hover' },
                          borderLeft: message.is_pinned ? '4px solid' : 'none',
                          borderLeftColor: message.is_pinned ? 'warning.main' : 'transparent'
                        }}
                        onClick={() => handleMessageClick(courseId, message.id)}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                          <Avatar sx={{ width: 40, height: 40, bgcolor: 'grey.200' }}>
                            <Person />
                          </Avatar>
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
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
                                />
                              )}
                            </Box>
                            
                            {message.title && (
                              <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 0.5 }}>
                                {message.title}
                              </Typography>
                            )}
                            
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                mb: 1,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}
                            >
                              {message.content}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Typography variant="caption" color="text.secondary">
                                Por {message.author.name}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <AccessTime fontSize="small" color="action" />
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(message.created_at)}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                      {msgIndex < courseData.messages.length - 1 && <Divider />}
                    </Box>
                  ))}
                </Box>
              </Collapse>
            </CardContent>
          </Card>
        </Paper>
      ))}
    </Box>
  );
}
