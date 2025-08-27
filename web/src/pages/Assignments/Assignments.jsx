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
  Alert,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  Assignment,
  Add,
  MoreVert,
  People,
  CalendarToday,
  Search,
  FilterList,
  School,
  CheckCircle,
  Schedule,
  Warning
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useDemoData } from '../../contexts/DemoDataContext';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const Assignments = () => {
  const navigate = useNavigate();
  const { assignments, courses, createAssignment } = useDemoData();
  const { userProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  // Formulario para crear tarea
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
    unitId: '',
    dueDate: '',
    maxPoints: 100
  });

  // Filtrar tareas según el rol del usuario
  const userAssignments = userProfile?.role === 'teacher'
    ? assignments.filter(a => courses.find(c => c.id === a.courseId)?.teacher.uid === userProfile.uid)
    : assignments.filter(a => {
        const course = courses.find(c => c.id === a.courseId);
        return course && course.students.some(s => s.uid === userProfile?.uid);
      });

  // Filtrar por búsqueda, curso y estado
  const filteredAssignments = userAssignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = !filterCourse || assignment.courseId === filterCourse;
    const matchesStatus = !filterStatus || getAssignmentStatus(assignment) === filterStatus;
    return matchesSearch && matchesCourse && matchesStatus;
  });

  // Obtener cursos del usuario para el filtro
  const userCourses = userProfile?.role === 'teacher'
    ? courses.filter(c => c.teacher.uid === userProfile.uid)
    : courses.filter(c => c.students.some(s => s.uid === userProfile?.uid));

  // Obtener estado de la tarea
  const getAssignmentStatus = (assignment) => {
    if (userProfile?.role === 'student') {
      const hasSubmission = assignment.submissions.some(s => s.studentId === userProfile.uid);
      if (hasSubmission) return 'completed';

      const daysLeft = Math.ceil((new Date(assignment.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysLeft < 0) return 'overdue';
      if (daysLeft <= 3) return 'urgent';
      return 'pending';
    }
    return 'active';
  };

  // Obtener color del estado
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'overdue': return 'error';
      case 'urgent': return 'warning';
      case 'pending': return 'default';
      default: return 'primary';
    }
  };

  // Obtener texto del estado
  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Completada';
      case 'overdue': return 'Vencida';
      case 'urgent': return 'Urgente';
      case 'pending': return 'Pendiente';
      default: return 'Activa';
    }
  };

  // Manejar menú de opciones de la tarea
  const handleMenuOpen = (event, assignment) => {
    setMenuAnchor(event.currentTarget);
    setSelectedAssignment(assignment);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedAssignment(null);
  };

  // Crear nueva tarea
  const handleCreateAssignment = async () => {
    if (!formData.title.trim() || !formData.courseId || !formData.dueDate) {
      toast.error('Completa todos los campos requeridos');
      return;
    }

    try {
      const assignmentData = {
        ...formData,
        dueDate: new Date(formData.dueDate),
        maxPoints: parseInt(formData.maxPoints)
      };

      createAssignment(assignmentData);

      toast.success('¡Tarea creada exitosamente!');
      setCreateDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        courseId: '',
        unitId: '',
        dueDate: '',
        maxPoints: 100
      });
    } catch (error) {
      toast.error('Error al crear la tarea');
      console.error('Error:', error);
    }
  };

  // Navegar a la tarea
  const handleAssignmentClick = (assignment) => {
    navigate(`/assignments/${assignment.id}`);
  };

  // Formatear fecha
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calcular días restantes
  const getDaysLeft = (dueDate) => {
    const daysLeft = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return `Vencida hace ${Math.abs(daysLeft)} días`;
    if (daysLeft === 0) return 'Vence hoy';
    if (daysLeft === 1) return 'Vence mañana';
    return `Vence en ${daysLeft} días`;
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
              Tareas
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {userProfile?.role === 'teacher' ? 'Gestiona las tareas de tus cursos' : 'Tareas asignadas'}
            </Typography>
          </Box>

          {userProfile?.role === 'teacher' && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{ borderRadius: 2 }}
            >
              Crear Tarea
            </Button>
          )}
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
            placeholder="Buscar tareas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            sx={{ minWidth: 300 }}
          />

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Filtrar por curso</InputLabel>
            <Select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              label="Filtrar por curso"
            >
              <MenuItem value="">Todos los cursos</MenuItem>
              {userCourses.map((course) => (
                <MenuItem key={course.id} value={course.id}>
                  {course.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {userProfile?.role === 'student' && (
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Filtrar por estado</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Filtrar por estado"
              >
                <MenuItem value="">Todos los estados</MenuItem>
                <MenuItem value="pending">Pendientes</MenuItem>
                <MenuItem value="urgent">Urgentes</MenuItem>
                <MenuItem value="overdue">Vencidas</MenuItem>
                <MenuItem value="completed">Completadas</MenuItem>
              </Select>
            </FormControl>
          )}
        </Box>
      </motion.div>

      {/* Lista de tareas */}
      {filteredAssignments.length > 0 ? (
        <Grid container spacing={3}>
          {filteredAssignments.map((assignment, index) => {
            const course = courses.find(c => c.id === assignment.courseId);
            const status = getAssignmentStatus(assignment);

            return (
              <Grid item xs={12} sm={6} md={4} key={assignment.id}>
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
                    onClick={() => handleAssignmentClick(assignment)}
                  >
                    <CardContent>
                      {/* Header de la tarea */}
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                        <Box
                          sx={{
                            width: 50,
                            height: 50,
                            borderRadius: 2,
                            backgroundColor: course?.color || '#007AFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Assignment sx={{ color: 'white', fontSize: 24 }} />
                        </Box>

                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMenuOpen(e, assignment);
                          }}
                        >
                          <MoreVert />
                        </IconButton>
                      </Box>

                      {/* Información de la tarea */}
                      <Typography variant="h6" gutterBottom fontWeight="bold">
                        {assignment.title}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {course?.name} • {course?.subject}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {assignment.description}
                      </Typography>

                      {/* Estado y fecha */}
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Chip
                          label={getStatusText(status)}
                          color={getStatusColor(status)}
                          size="small"
                        />

                        <Box textAlign="right">
                          <Typography variant="caption" color="text.secondary">
                            {getDaysLeft(assignment.dueDate)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(assignment.dueDate)}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Puntos y progreso */}
                      <Box sx={{ mb: 2 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="body2" color="text.secondary">
                            Puntos: {assignment.maxPoints}
                          </Typography>
                          {userProfile?.role === 'student' && (
                            <Typography variant="body2" color="text.secondary">
                              {assignment.submissions.some(s => s.studentId === userProfile.uid) ? 'Entregada' : 'Pendiente'}
                            </Typography>
                          )}
                        </Box>

                        {userProfile?.role === 'student' && (
                          <LinearProgress
                            variant="determinate"
                            value={assignment.submissions.some(s => s.studentId === userProfile.uid) ? 100 : 0}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: 'grey.200',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: course?.color || '#007AFF',
                                borderRadius: 3
                              }
                            }}
                          />
                        )}
                      </Box>

                      {/* Estadísticas para profesores */}
                      {userProfile?.role === 'teacher' && (
                        <Box>
                          <Divider sx={{ my: 1 }} />
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box display="flex" alignItems="center" gap={1}>
                              <People sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {assignment.submissions.length} entregas
                              </Typography>
                            </Box>

                            <Typography variant="body2" color="text.secondary">
                              {course?.students.length || 0} estudiantes
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Box textAlign="center" py={8}>
            <Assignment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom color="text.secondary">
              {searchTerm || filterCourse || filterStatus ? 'No se encontraron tareas' : 'No tienes tareas aún'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {searchTerm || filterCourse || filterStatus
                ? 'Intenta ajustar los filtros de búsqueda'
                : userProfile?.role === 'teacher'
                  ? 'Crea tu primera tarea para comenzar'
                  : 'Las tareas aparecerán cuando te unas a un curso'
              }
            </Typography>

            {userProfile?.role === 'teacher' && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setCreateDialogOpen(true)}
                sx={{ borderRadius: 2 }}
              >
                Crear Primera Tarea
              </Button>
            )}
          </Box>
        </motion.div>
      )}

      {/* Menú de opciones de la tarea */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={() => {
          handleAssignmentClick(selectedAssignment);
          handleMenuClose();
        }}>
          Ver tarea
        </MenuItem>
        {userProfile?.role === 'teacher' && (
          <MenuItem onClick={handleMenuClose}>
            Editar tarea
          </MenuItem>
        )}
        <MenuItem onClick={handleMenuClose}>
          Configuración
        </MenuItem>
      </Menu>

      {/* Dialog para crear tarea */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Crear Nueva Tarea</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Título de la Tarea"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ej: Ejercicios de Matrices"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                multiline
                rows={3}
                placeholder="Describe la tarea y los requisitos..."
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Curso</InputLabel>
                <Select
                  value={formData.courseId}
                  onChange={(e) => setFormData(prev => ({ ...prev, courseId: e.target.value }))}
                  label="Curso"
                >
                  {userCourses.map((course) => (
                    <MenuItem key={course.id} value={course.id}>
                      {course.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Fecha de Entrega"
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Puntos Máximos"
                type="number"
                value={formData.maxPoints}
                onChange={(e) => setFormData(prev => ({ ...prev, maxPoints: e.target.value }))}
                inputProps={{ min: 1, max: 1000 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreateAssignment} variant="contained">
            Crear Tarea
          </Button>
        </DialogActions>
      </Dialog>

      {/* FAB para crear tarea (solo profesores) */}
      {userProfile?.role === 'teacher' && (
        <Fab
          color="primary"
          aria-label="Crear tarea"
          onClick={() => setCreateDialogOpen(true)}
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

export default Assignments;
