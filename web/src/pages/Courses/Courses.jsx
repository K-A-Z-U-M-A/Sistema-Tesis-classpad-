import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  School,
  Add,
  MoreVert,
  People,
  Assignment,
  CalendarToday,
  Search,
  FilterList,
  Delete,
  Edit,
  ContentCopy
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext.tsx';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Courses = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTurn, setFilterTurn] = useState('');
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [courseCode, setCourseCode] = useState('');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Load courses on component mount
  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      let response;
      
      if (userProfile?.role === 'student') {
        // Students see their enrolled courses
        response = await api.request('/courses/my-courses');
      } else {
        // Teachers see their created courses
        response = await api.request('/courses');
      }
      
      if (response.success) setCourses(response.data);
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Error al cargar los cursos');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar por búsqueda y turno, asegurando que el id sea válido (número o UUID)
  const filteredCourses = courses
    .filter(course => {
      const id = course?.id;
      const isNumericId = typeof id === 'number' || /^\d+$/.test(String(id || ''));
      const isUuidId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(id || ''));
      return isNumericId || isUuidId;
    })
    .filter(course => {
      const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (course.turn && course.turn.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesTurn = !filterTurn || course.turn === filterTurn;
      return matchesSearch && matchesTurn;
    });

  // Obtener turnos únicos para el filtro
  const turns = [...new Set(courses.map(c => c.turn).filter(Boolean))];

  // Manejar menú de opciones del curso
  const handleMenuOpen = (event, course) => {
    setMenuAnchor(event.currentTarget);
    setSelectedCourse(course);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedCourse(null);
  };

  // Unirse a un curso
  const handleEnrollCourse = async () => {
    if (!courseCode.trim()) {
      toast.error('Ingresa un código de curso');
      return;
    }

    try {
      const response = await api.request('/courses/enroll', {
        method: 'POST',
        body: JSON.stringify({ course_code: courseCode.trim().toUpperCase() })
      });
      if (response.success) {
        toast.success('¡Te has matriculado en el curso exitosamente!');
        setEnrollDialogOpen(false);
        setCourseCode('');
        loadCourses(); // Reload courses
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      const errorMessage = error.response?.data?.error?.message || 'Error al matricularse en el curso';
      toast.error(errorMessage);
    }
  };

  // Eliminar curso
  const handleDeleteCourse = async (course) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar el curso "${course.name}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const response = await api.deleteCourse(course.id);
      if (response.success) {
        toast.success('Curso eliminado exitosamente');
        loadCourses(); // Recargar la lista
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      const errorMessage = error.response?.data?.error?.message || 'Error al eliminar el curso';
      toast.error(errorMessage);
    }
  };

  // Navegar al curso
  const handleCourseClick = (course) => {
    navigate(`/courses/${course.id}`);
  };

  // Crear nuevo curso
  const handleCreateCourse = () => {
    navigate('/create-course');
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress size={60} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h3" gutterBottom fontWeight="bold">
              Mis Cursos
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {userProfile?.role === 'teacher' ? 'Cursos que impartes' : 'Cursos en los que participas'}
            </Typography>
          </Box>

          <Box display="flex" gap={2}>
            {userProfile?.role === 'student' && (
              <Button
                variant="outlined"
                startIcon={<Search />}
                onClick={() => setEnrollDialogOpen(true)}
                sx={{ borderRadius: 2 }}
              >
                Matricularse en Curso
              </Button>
            )}

            {userProfile?.role === 'teacher' && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreateCourse}
                sx={{ borderRadius: 2 }}
              >
                Crear Curso
              </Button>
            )}
          </Box>
        </Box>
      </motion.div>

      {/* Filtros y búsqueda */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Box display="flex" gap={2} mb={4} flexWrap="wrap">
          <TextField
            placeholder="Buscar cursos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            sx={{ minWidth: 300 }}
          />

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Filtrar por turno</InputLabel>
            <Select
              value={filterTurn}
              onChange={(e) => setFilterTurn(e.target.value)}
              label="Filtrar por turno"
            >
              <MenuItem value="">Todos los turnos</MenuItem>
              {turns.map((turn) => (
                <MenuItem key={turn} value={turn}>
                  {turn}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </motion.div>

      {/* Lista de cursos */}
      {filteredCourses.length > 0 ? (
        <Grid container spacing={3}>
          {filteredCourses.map((course, index) => (
            <Grid item xs={12} sm={6} md={4} key={course.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card
                  sx={{
                    height: '100%',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => handleCourseClick(course)}
                >
                  <CardContent>
                    {/* Header del curso */}
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                      <Box
                        sx={{
                          width: 50,
                          height: 50,
                          borderRadius: 2,
                          backgroundColor: course.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <School sx={{ color: 'white', fontSize: 24 }} />
                      </Box>

                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuOpen(e, course);
                        }}
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>

                    {/* Información del curso */}
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      {course.name}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {course.turn} {course.grade && `• ${course.grade}`}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {course.description}
                    </Typography>

                    {/* Estadísticas del curso */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <People sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {course.student_count || 0} estudiantes
                        </Typography>
                      </Box>

                      <Chip
                        label={course.is_active ? 'Activo' : 'Inactivo'}
                        color={course.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>

                    {/* Código de curso */}
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="caption" color="text.secondary">
                        Código:
                      </Typography>
                      <Chip
                        label={course.course_code || 'N/A'}
                        size="small"
                        variant="outlined"
                        sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}
                      />
                      {course.course_code && (
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(course.course_code);
                            toast.success('Código copiado al portapapeles');
                          }}
                          sx={{ 
                            ml: 0.5,
                            '&:hover': {
                              backgroundColor: 'primary.light',
                              color: 'white'
                            }
                          }}
                        >
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Box textAlign="center" py={8}>
            <School sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom color="text.secondary">
              {searchTerm || filterTurn ? 'No se encontraron cursos' : 'No tienes cursos aún'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {searchTerm || filterTurn
                ? 'Intenta ajustar los filtros de búsqueda'
                : userProfile?.role === 'teacher'
                  ? 'Crea tu primer curso para comenzar'
                  : 'Únete a un curso usando un código de unión'
              }
            </Typography>

            {userProfile?.role === 'teacher' ? (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreateCourse}
                sx={{ borderRadius: 2 }}
              >
                Crear Primer Curso
              </Button>
            ) : (
              <Button
                variant="contained"
                startIcon={<Search />}
                onClick={() => setEnrollDialogOpen(true)}
                sx={{ borderRadius: 2 }}
              >
                Unirse a un Curso
              </Button>
            )}
          </Box>
        </motion.div>
      )}

      {/* Menú de opciones del curso */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={() => {
          handleCourseClick(selectedCourse);
          handleMenuClose();
        }}>
          <Edit sx={{ mr: 1 }} />
          Ver curso
        </MenuItem>
        {userProfile?.role === 'teacher' && selectedCourse && (
          <MenuItem 
            onClick={() => {
              handleMenuClose();
              handleDeleteCourse(selectedCourse);
            }}
            sx={{ color: 'error.main' }}
          >
            <Delete sx={{ mr: 1 }} />
            Eliminar curso
          </MenuItem>
        )}
      </Menu>

      {/* Dialog para unirse a curso */}

      <Dialog open={enrollDialogOpen} onClose={() => setEnrollDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Matricularse en un Curso</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Ingresa el código del curso que te proporcionó tu profesor
          </Alert>
          <TextField
            fullWidth
            label="Código del Curso"
            value={courseCode}
            onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
            placeholder="Ej: MATH2024"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEnrollDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleEnrollCourse} variant="contained">
            Matricularse
          </Button>
        </DialogActions>
      </Dialog>

      {/* FAB para crear curso (solo profesores) */}
      {userProfile?.role === 'teacher' && (
        <Fab
          color="primary"
          aria-label="Crear curso"
          onClick={handleCreateCourse}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            backgroundColor: 'primary.main',
            '&:hover': {
              backgroundColor: 'primary.dark'
            }
          }}
        >
          <Add />
        </Fab>
      )}
    </Container>
  );
};

export default Courses;
