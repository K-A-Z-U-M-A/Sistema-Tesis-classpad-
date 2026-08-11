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
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  IconButton,
  Tooltip,
  Grid
} from '@mui/material';
import {
  School,
  Message,
  Announcement,
  Help,
  Chat,
  AccessTime,
  Person,
  Search,
  Add as AddIcon,
  Forum,
  PushPin,
  ArrowForward,
  Clear,
  FilterList,
  Campaign,
  MarkEmailRead,
  Share,
  Send
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import PageContainer from '../../components/ui/PageContainer';
import { useAuth } from '../../contexts/AuthContext';

// Color & Icon Helpers for M3 Design System
const getMessageTypeIcon = (type) => {
  switch (type) {
    case 'announcement':
      return <Campaign sx={{ fontSize: 18 }} />;
    case 'discussion':
      return <Chat sx={{ fontSize: 18 }} />;
    case 'question':
      return <Help sx={{ fontSize: 18 }} />;
    default:
      return <Message sx={{ fontSize: 18 }} />;
  }
};

const getMessageTypeColor = (type) => {
  switch (type) {
    case 'announcement':
      return { bg: '#EADDFF', text: '#21005D', border: '#6750A4', main: '#6750A4' };
    case 'discussion':
      return { bg: '#E8DEF8', text: '#1D192B', border: '#625B71', main: '#625B71' };
    case 'question':
      return { bg: '#FFDDB0', text: '#2B1700', border: '#7E5700', main: '#7E5700' };
    default:
      return { bg: '#F3EDF7', text: '#1C1B1F', border: '#79747E', main: '#79747E' };
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
  const { user } = useAuth();
  const [messagesByCourse, setMessagesByCourse] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState('ALL'); // 'ALL' or specific ID
  const [selectedType, setSelectedType] = useState('all'); // 'all', 'announcement', 'discussion', 'question'
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Create Message Modal State
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    course_id: '',
    title: '',
    content: '',
    type: 'announcement',
    is_pinned: false
  });

  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'docente' || user?.role === 'admin';

  const courseEntries = useMemo(
    () => Object.entries(messagesByCourse),
    [messagesByCourse]
  );

  const totalMessageCount = useMemo(() => {
    return courseEntries.reduce((acc, [, data]) => acc + (data.messages?.length || 0), 0);
  }, [courseEntries]);

  // Aggregate messages depending on course selection
  const allMessagesList = useMemo(() => {
    if (selectedCourseId === 'ALL') {
      const combined = [];
      courseEntries.forEach(([cId, data]) => {
        (data.messages || []).forEach(msg => {
          combined.push({
            ...msg,
            courseId: cId,
            courseName: data.course.name,
            subject: data.course.subject
          });
        });
      });
      // Sort pinned first, then newest date
      return combined.sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return new Date(b.created_at) - new Date(a.created_at);
      });
    }

    const courseData = messagesByCourse[selectedCourseId];
    if (!courseData) return [];
    return (courseData.messages || []).map(msg => ({
      ...msg,
      courseId: selectedCourseId,
      courseName: courseData.course.name,
      subject: courseData.course.subject
    })).sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [messagesByCourse, selectedCourseId, courseEntries]);

  // Filter messages by type & search term
  const filteredMessages = useMemo(() => {
    return allMessagesList.filter((message) => {
      // Type match
      if (selectedType !== 'all' && message.type !== selectedType) {
        return false;
      }

      // Search term match
      if (!searchTerm.trim()) return true;
      const query = searchTerm.toLowerCase();
      const titleMatch = message.title?.toLowerCase().includes(query);
      const contentMatch = message.content?.toLowerCase().includes(query);
      const authorName = message.author?.name?.toLowerCase();
      const courseMatch = message.courseName?.toLowerCase().includes(query);

      return titleMatch || contentMatch || authorName?.includes(query) || courseMatch;
    });
  }, [allMessagesList, selectedType, searchTerm]);

  useEffect(() => {
    loadAllMessages();
  }, []);

  const loadAllMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.request('/messages');
      
      if (response.success) {
        setMessagesByCourse(response.data.messagesByCourse || {});
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

  const handleCreateMessageSubmit = async (e) => {
    e.preventDefault();
    if (!createFormData.course_id || !createFormData.content.trim()) {
      toast.error('Selecciona un curso e ingresa el contenido del mensaje');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.request('/messages', {
        method: 'POST',
        body: JSON.stringify(createFormData)
      });

      if (res.success || res.id) {
        toast.success('Mensaje publicado con éxito');
        setOpenCreateModal(false);
        setCreateFormData({
          course_id: '',
          title: '',
          content: '',
          type: 'announcement',
          is_pinned: false
        });
        loadAllMessages();
      } else {
        throw new Error(res.error?.message || 'No se pudo publicar el mensaje');
      }
    } catch (err) {
      console.error('Error posting message:', err);
      toast.error(err.message || 'Error al publicar el mensaje');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMessageClick = (courseId, messageId) => {
    navigate(`/courses/${courseId}?tab=messages&message=${messageId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Hace un momento';
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays <= 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <PageContainer>
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="450px" gap={2}>
          <CircularProgress size={48} sx={{ color: '#6750A4' }} />
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            Cargando mensajes del sistema...
          </Typography>
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer sx={{ pb: 6 }}>
      {/* ─── HEADER BANNER ────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2.5,
          mb: 4,
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: '28px',
          background: 'linear-gradient(135deg, #F3EDF7 0%, #EADDFF 100%)',
          border: '1px solid',
          borderColor: 'rgba(103,80,164,0.15)',
          boxShadow: '0 8px 24px rgba(103,80,164,0.06)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
          <Avatar
            sx={{
              width: 56,
              height: 56,
              bgcolor: '#6750A4',
              color: '#FFFFFF',
              boxShadow: '0 8px 20px rgba(103,80,164,0.25)'
            }}
          >
            <Forum sx={{ fontSize: 30 }} />
          </Avatar>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 800, color: '#1C1B1F', letterSpacing: '-0.5px' }}>
                Centro de Mensajes
              </Typography>
              <Chip
                label={`${totalMessageCount} en total`}
                size="small"
                sx={{
                  bgcolor: 'rgba(103,80,164,0.12)',
                  color: '#6750A4',
                  fontWeight: 700,
                  fontSize: '0.75rem'
                }}
              />
            </Stack>
            <Typography variant="body2" sx={{ color: '#49454F', maxWidth: 600 }}>
              Revisa anuncios importantes, dudas y conversaciones recientes de todas tus asignaturas.
            </Typography>
          </Box>
        </Box>

        {isTeacherOrAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              // Pre-select first course if available
              if (courseEntries.length > 0) {
                setCreateFormData(prev => ({ ...prev, course_id: courseEntries[0][0] }));
              }
              setOpenCreateModal(true);
            }}
            sx={{
              bgcolor: '#6750A4',
              color: '#FFFFFF',
              px: 3,
              py: 1.25,
              borderRadius: '100px',
              textTransform: 'none',
              fontWeight: 700,
              boxShadow: '0 4px 14px rgba(103,80,164,0.3)',
              '&:hover': {
                bgcolor: '#4A3980',
                boxShadow: '0 6px 20px rgba(103,80,164,0.4)'
              }
            }}
          >
            Nuevo Mensaje
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '16px' }}>
          {error}
        </Alert>
      )}

      {/* ─── COURSE SELECTION CAROUSEL / PILLS ──────────────────────── */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.75rem' }}>
          Filtrar por Asignatura
        </Typography>
        <Stack direction="row" spacing={1.5} sx={{ overflowX: 'auto', pb: 1, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
          <Chip
            clickable
            icon={<Forum sx={{ fontSize: 18 }} />}
            label={`Todos (${totalMessageCount})`}
            onClick={() => setSelectedCourseId('ALL')}
            sx={{
              px: 1.5,
              py: 2.2,
              borderRadius: '100px',
              fontWeight: selectedCourseId === 'ALL' ? 800 : 600,
              fontSize: '0.875rem',
              bgcolor: selectedCourseId === 'ALL' ? '#6750A4' : '#F3EDF7',
              color: selectedCourseId === 'ALL' ? '#FFFFFF' : '#49454F',
              boxShadow: selectedCourseId === 'ALL' ? '0 4px 12px rgba(103,80,164,0.25)' : 'none',
              '&:hover': {
                bgcolor: selectedCourseId === 'ALL' ? '#4A3980' : '#EADDFF'
              },
              '& .MuiChip-icon': {
                color: selectedCourseId === 'ALL' ? '#FFFFFF' : '#6750A4'
              }
            }}
          />

          {courseEntries.map(([cId, cData]) => {
            const isSelected = selectedCourseId === cId;
            const count = cData.messages?.length || 0;
            return (
              <Chip
                key={cId}
                clickable
                icon={<School sx={{ fontSize: 18 }} />}
                label={`${cData.course.name} (${count})`}
                onClick={() => setSelectedCourseId(cId)}
                sx={{
                  px: 1.5,
                  py: 2.2,
                  borderRadius: '100px',
                  fontWeight: isSelected ? 800 : 600,
                  fontSize: '0.875rem',
                  bgcolor: isSelected ? '#6750A4' : '#F3EDF7',
                  color: isSelected ? '#FFFFFF' : '#49454F',
                  boxShadow: isSelected ? '0 4px 12px rgba(103,80,164,0.25)' : 'none',
                  '&:hover': {
                    bgcolor: isSelected ? '#4A3980' : '#EADDFF'
                  },
                  '& .MuiChip-icon': {
                    color: isSelected ? '#FFFFFF' : '#6750A4'
                  }
                }}
              />
            );
          })}
        </Stack>
      </Box>

      {/* ─── FILTERS & SEARCH ROW ────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3.5,
          borderRadius: '24px',
          border: '1px solid',
          borderColor: 'rgba(103,80,164,0.12)',
          bgcolor: '#FFFFFF',
          boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={7}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ rowGap: 1 }}>
              {[
                { id: 'all', label: 'Todos los tipos', icon: <FilterList sx={{ fontSize: 16 }} /> },
                { id: 'announcement', label: 'Anuncios', icon: <Campaign sx={{ fontSize: 16 }} /> },
                { id: 'discussion', label: 'Discusiones', icon: <Chat sx={{ fontSize: 16 }} /> },
                { id: 'question', label: 'Preguntas', icon: <Help sx={{ fontSize: 16 }} /> }
              ].map(typeItem => (
                <Chip
                  key={typeItem.id}
                  clickable
                  icon={typeItem.icon}
                  label={typeItem.label}
                  onClick={() => setSelectedType(typeItem.id)}
                  size="medium"
                  sx={{
                    borderRadius: '100px',
                    fontWeight: selectedType === typeItem.id ? 700 : 500,
                    bgcolor: selectedType === typeItem.id ? '#EADDFF' : '#F7F2FA',
                    color: selectedType === typeItem.id ? '#21005D' : '#49454F',
                    border: '1px solid',
                    borderColor: selectedType === typeItem.id ? '#6750A4' : 'transparent',
                    '&:hover': { bgcolor: '#E8DEF8' },
                    '& .MuiChip-icon': {
                      color: selectedType === typeItem.id ? '#6750A4' : '#79747E'
                    }
                  }}
                />
              ))}
            </Stack>
          </Grid>

          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar título, mensaje o autor..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: '#6750A4' }} />
                  </InputAdornment>
                ),
                endAdornment: searchTerm ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm('')}>
                      <Clear fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
                sx: {
                  borderRadius: '100px',
                  bgcolor: '#F7F2FA',
                  px: 1,
                  '& fieldset': { border: 'none' },
                  '&:hover fieldset': { border: 'none' },
                  '&.Mui-focused fieldset': { border: '1.5px solid #6750A4' }
                }
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* ─── MESSAGES FEED ─────────────────────────────────────────── */}
      <Box>
        {filteredMessages.length === 0 ? (
          /* EXPRESSIVE EMPTY STATE */
          <Paper
            elevation={0}
            sx={{
              p: { xs: 4, sm: 6 },
              textAlign: 'center',
              borderRadius: '28px',
              border: '1px border-dashed',
              borderColor: 'rgba(103,80,164,0.2)',
              background: 'linear-gradient(180deg, #FDFBFF 0%, #F3EDF7 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2.5
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #EADDFF 0%, #D0BCFF 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 24px rgba(103,80,164,0.18)'
              }}
            >
              <Forum sx={{ fontSize: 40, color: '#6750A4' }} />
            </Box>

            <Box sx={{ maxWidth: 460 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#1C1B1F', mb: 1 }}>
                {searchTerm || selectedType !== 'all' ? 'Sin resultados para los filtros' : 'No hay mensajes registrados'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                {searchTerm || selectedType !== 'all'
                  ? 'Prueba ajustando el término de búsqueda o cambiando el filtro de tipo de mensaje.'
                  : 'Las novedades, anuncios del docente y consultas de la asignatura aparecerán agrupadas aquí.'}
              </Typography>
            </Box>

            {isTeacherOrAdmin && !searchTerm && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenCreateModal(true)}
                sx={{
                  bgcolor: '#6750A4',
                  color: '#FFFFFF',
                  borderRadius: '100px',
                  px: 3,
                  py: 1,
                  fontWeight: 700,
                  textTransform: 'none'
                }}
              >
                Publicar primer mensaje
              </Button>
            )}
          </Paper>
        ) : (
          <Stack spacing={2}>
            <AnimatePresence>
              {filteredMessages.map((message, index) => {
                const colorStyle = getMessageTypeColor(message.type);
                const authorName = message.author?.name || message.author_name || 'Usuario';
                const authorRole = message.author?.role === 'teacher' || message.author?.role === 'docente' ? 'Docente' : 'Estudiante';

                return (
                  <motion.div
                    key={message.id || index}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.04 }}
                  >
                    <Paper
                      elevation={0}
                      onClick={() => handleMessageClick(message.courseId, message.id)}
                      sx={{
                        p: { xs: 2.5, sm: 3 },
                        borderRadius: '20px',
                        border: '1px solid',
                        borderColor: message.is_pinned ? 'rgba(126,87,0,0.3)' : 'rgba(103,80,164,0.12)',
                        background: message.is_pinned 
                          ? 'linear-gradient(135deg, #FFFDF8 0%, #FFF8EC 100%)'
                          : '#FFFFFF',
                        borderLeft: `5px solid ${message.is_pinned ? '#7E5700' : colorStyle.main}`,
                        cursor: 'pointer',
                        transition: 'all 200ms ease',
                        position: 'relative',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 24px rgba(103,80,164,0.1)'
                        }
                      }}
                    >
                      {/* Top Header info */}
                      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} sx={{ mb: 1.5 }}>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ rowGap: 0.5 }}>
                          <Chip
                            label={message.courseName}
                            icon={<School sx={{ fontSize: 14 }} />}
                            size="small"
                            sx={{
                              bgcolor: '#F3EDF7',
                              color: '#6750A4',
                              fontWeight: 700,
                              fontSize: '0.75rem'
                            }}
                          />

                          <Chip
                            icon={getMessageTypeIcon(message.type)}
                            label={getMessageTypeLabel(message.type)}
                            size="small"
                            sx={{
                              bgcolor: colorStyle.bg,
                              color: colorStyle.text,
                              fontWeight: 700,
                              fontSize: '0.75rem'
                            }}
                          />

                          {message.is_pinned && (
                            <Chip
                              icon={<PushPin sx={{ fontSize: 14 }} />}
                              label="Fijado"
                              size="small"
                              sx={{
                                bgcolor: '#FFDDB0',
                                color: '#2B1700',
                                fontWeight: 700,
                                fontSize: '0.75rem'
                              }}
                            />
                          )}
                        </Stack>

                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: 'text.secondary' }}>
                          <AccessTime sx={{ fontSize: 14 }} />
                          <Typography variant="caption" fontWeight={500}>
                            {formatDate(message.created_at)}
                          </Typography>
                        </Stack>
                      </Stack>

                      {/* Author & Body */}
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mt: 1 }}>
                        <Avatar
                          sx={{
                            width: 44,
                            height: 44,
                            background: 'linear-gradient(135deg, #6750A4 0%, #7D5260 100%)',
                            color: '#FFFFFF',
                            fontWeight: 700,
                            boxShadow: '0 4px 10px rgba(103,80,164,0.2)'
                          }}
                        >
                          {authorName.charAt(0).toUpperCase()}
                        </Avatar>

                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1C1B1F' }}>
                              {authorName}
                            </Typography>
                            <Chip
                              label={authorRole}
                              size="small"
                              variant="outlined"
                              sx={{
                                height: 18,
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                borderColor: 'divider'
                              }}
                            />
                          </Stack>

                          {message.title && (
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1C1B1F', mt: 0.5 }}>
                              {message.title}
                            </Typography>
                          )}

                          <Typography
                            variant="body2"
                            sx={{
                              mt: 0.75,
                              color: '#49454F',
                              whiteSpace: 'pre-line',
                              lineHeight: 1.6,
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}
                          >
                            {message.content}
                          </Typography>

                          {/* Footer action bar */}
                          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2, pt: 1.5, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={500}>
                              💬 {message.comments_count || 0} comentarios
                            </Typography>

                            <Button
                              size="small"
                              endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                              sx={{
                                color: '#6750A4',
                                fontWeight: 700,
                                textTransform: 'none',
                                p: 0,
                                minWidth: 0,
                                '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
                              }}
                            >
                              Ver conversación
                            </Button>
                          </Stack>
                        </Box>
                      </Box>
                    </Paper>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </Stack>
        )}
      </Box>

      {/* ─── CREATE MESSAGE MODAL ────────────────────────────────────── */}
      <Dialog
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '28px',
            p: 1.5,
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: '#EADDFF', color: '#6750A4' }}>
              <Send fontSize="small" />
            </Avatar>
            <Typography variant="h6" fontWeight={800}>
              Publicar Nuevo Mensaje
            </Typography>
          </Stack>
          <IconButton size="small" onClick={() => setOpenCreateModal(false)}>
            <Clear />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleCreateMessageSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <FormControl fullWidth required size="small">
              <InputLabel id="create-message-course-label">Asignatura / Curso</InputLabel>
              <Select
                labelId="create-message-course-label"
                value={createFormData.course_id}
                label="Asignatura / Curso"
                onChange={(e) => setCreateFormData(prev => ({ ...prev, course_id: e.target.value }))}
                sx={{ borderRadius: '12px' }}
              >
                {courseEntries.map(([cId, cData]) => (
                  <MenuItem key={cId} value={cId}>
                    {cData.course.name} ({cData.course.subject || 'General'})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel id="create-message-type-label">Tipo de Publicación</InputLabel>
                  <Select
                    labelId="create-message-type-label"
                    value={createFormData.type}
                    label="Tipo de Publicación"
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, type: e.target.value }))}
                    sx={{ borderRadius: '12px' }}
                  >
                    <MenuItem value="announcement">📢 Anuncio</MenuItem>
                    <MenuItem value="discussion">💬 Discusión</MenuItem>
                    <MenuItem value="question">❓ Pregunta</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} display="flex" alignItems="center">
                <FormControlLabel
                  control={
                    <Switch
                      checked={createFormData.is_pinned}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, is_pinned: e.target.checked }))}
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body2" fontWeight={600}>
                      Fijar al inicio 📌
                    </Typography>
                  }
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              size="small"
              label="Título del mensaje (Opcional)"
              value={createFormData.title}
              onChange={(e) => setCreateFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ej: Aviso importante sobre la fecha del parcial"
              InputProps={{ sx: { borderRadius: '12px' } }}
            />

            <TextField
              fullWidth
              required
              multiline
              rows={4}
              label="Contenido del mensaje"
              value={createFormData.content}
              onChange={(e) => setCreateFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Escribe el mensaje o anuncio para los alumnos..."
              InputProps={{ sx: { borderRadius: '16px' } }}
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
            <Button
              onClick={() => setOpenCreateModal(false)}
              sx={{ color: '#49454F', textTransform: 'none', fontWeight: 600 }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={16} /> : <Send />}
              sx={{
                bgcolor: '#6750A4',
                color: '#FFFFFF',
                borderRadius: '100px',
                px: 3,
                textTransform: 'none',
                fontWeight: 700,
                '&:hover': { bgcolor: '#4A3980' }
              }}
            >
              {submitting ? 'Publicando...' : 'Publicar Mensaje'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </PageContainer>
  );
}
