import React, { useState } from 'react';
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
  Alert
} from '@mui/material';
import {
  School,
  Add,
  MoreVert,
  People,
  Assignment,
  CalendarToday,
  Search,
  FilterList
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useDemoData } from '../../contexts/DemoDataContext';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const Courses = () => {
  const navigate = useNavigate();
  const { courses, joinCourse } = useDemoData();
  const { userProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Filtrar cursos según el rol del usuario
  const userCourses = userProfile?.role === 'teacher' 
    ? courses.filter(c => c.teacher.uid === userProfile.uid)
    : courses.filter(c => c.students.some(s => s.uid === userProfile?.uid));

  // Filtrar por búsqueda y asignatura
  const filteredCourses = userCourses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = !filterSubject || course.subject === filterSubject;
    return matchesSearch && matchesSubject;
  });

  // Obtener asignaturas únicas para el filtro
  const subjects = [...new Set(courses.map(c => c.subject))];

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
  const handleJoinCourse = () => {
    if (!joinCode.trim()) {
      toast.error('Ingresa un código de unión');
      return;
    }

    const course = courses.find(c => c.joinCode === joinCode.trim());
    if (!course) {
      toast.error('Código de unión inválido');
      return;
    }

    if (course.students.some(s => s.uid === userProfile?.uid)) {
      toast.error('Ya estás inscrito en este curso');
      return;
    }

    try {
      joinCourse(course.id, {
        uid: userProfile.uid,
        name: userProfile.fullName,
        email: userProfile.email
      });
      
      toast.success('¡Te has unido al curso exitosamente!');
      setJoinDialogOpen(false);
      setJoinCode('');
    } catch (error) {
      toast.error('Error al unirse al curso');
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
            <Button
              variant="outlined"
              startIcon={<Search />}
              onClick={() => setJoinDialogOpen(true)}
              sx={{ borderRadius: 2 }}
            >
              Unirse a Curso
            </Button>
            
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
            <InputLabel>Filtrar por asignatura</InputLabel>
            <Select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              label="Filtrar por asignatura"
            >
              <MenuItem value="">Todas las asignaturas</MenuItem>
              {subjects.map((subject) => (
                <MenuItem key={subject} value={subject}>
                  {subject}
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
                      {course.subject} • {course.grade}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {course.description}
                    </Typography>

                    {/* Estadísticas del curso */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <People sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {course.students.length} estudiantes
                        </Typography>
                      </Box>
                      
                      <Chip 
                        label={course.isActive ? 'Activo' : 'Inactivo'} 
                        color={course.isActive ? 'success' : 'default'} 
                        size="small" 
                      />
                    </Box>

                    {/* Código de unión */}
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="caption" color="text.secondary">
                        Código:
                      </Typography>
                      <Chip 
                        label={course.joinCode} 
                        size="small" 
                        variant="outlined"
                        sx={{ fontFamily: 'monospace' }}
                      />
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
              {searchTerm || filterSubject ? 'No se encontraron cursos' : 'No tienes cursos aún'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {searchTerm || filterSubject 
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
                onClick={() => setJoinDialogOpen(true)}
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
          Ver curso
        </MenuItem>
        {userProfile?.role === 'teacher' && (
          <MenuItem onClick={handleMenuClose}>
            Editar curso
          </MenuItem>
        )}
        <MenuItem onClick={handleMenuClose}>
          Configuración
        </MenuItem>
      </Menu>

      {/* Dialog para unirse a curso */}
      <Dialog open={joinDialogOpen} onClose={() => setJoinDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Unirse a un Curso</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Ingresa el código de unión que te proporcionó tu profesor
          </Alert>
          <TextField
            fullWidth
            label="Código de Unión"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Ej: MATH2024"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setJoinDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleJoinCourse} variant="contained">
            Unirse
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
