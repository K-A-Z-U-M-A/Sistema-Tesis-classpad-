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
  FormControl,
  InputLabel,
  Select,
  TextField,
  Alert,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  Assignment,
  MoreVert,
  People,
  CalendarToday,
  Search,
  FilterList,
  School,
  CheckCircle,
  Schedule,
  Warning,
  Notifications,
  Visibility,
  VisibilityOff,
  SortByAlpha,
  AccessTime,
  Subject
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext.tsx';
import apiService from '../../services/api.js';
import toast from 'react-hot-toast';

const Assignments = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const api = apiService;
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [sortBy, setSortBy] = useState('dueDate'); // dueDate, title, course
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc
  const [showOnlyPending, setShowOnlyPending] = useState(false);
  const [showOnlyWithPendingSubmissions, setShowOnlyWithPendingSubmissions] = useState(false);
  
  // Filtro de estado de entregas
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState('');
  
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  // Estados para datos de la API
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  // Cargar datos de la API
  useEffect(() => {
    const loadData = async () => {
      try {
        // console.log('🔍 Iniciando carga de datos...');
        setLoading(true);
        setError(null);

        // Cargar cursos del usuario
        // console.log('🔍 Cargando cursos del usuario...');
        const coursesResponse = await api.request('/courses');
        // console.log('🔍 Respuesta de cursos:', coursesResponse);
        if (coursesResponse.success) {
          setCourses(coursesResponse.data || []);
          // console.log('🔍 Cursos establecidos:', coursesResponse.data);
        }

        // Cargar todas las tareas de los cursos del usuario
        const allAssignments = [];
        if (coursesResponse.success && coursesResponse.data) {
          for (const course of coursesResponse.data) {
            try {
              // console.log(`🔍 Cargando tareas para curso ${course.id} (${course.name})...`);
              const assignmentsResponse = await api.request(`/assignments/course/${course.id}`);
              // console.log(`🔍 Respuesta de tareas para curso ${course.id}:`, assignmentsResponse);
              if (assignmentsResponse.success && assignmentsResponse.data) {
                // Agregar información del curso a cada tarea
                const courseAssignments = assignmentsResponse.data.map(assignment => {
                  
                  return {
                    ...assignment,
                    courseId: course.id,
                    course: {
                      ...course,
                      // Agregar información del profesor si no existe
                      teacher: course.teacher || { id: course.owner_id, display_name: course.owner_name },
                      // Agregar información de estudiantes si no existe
                      students: course.students || []
                    },
                    dueDate: assignment.due_date ? new Date(assignment.due_date) : new Date(),
                    maxPoints: assignment.max_points || 100,
                    submissions: assignment.submissions || []
                  };
                });
                // console.log(`🔍 Tareas procesadas para curso ${course.id}:`, courseAssignments);
                allAssignments.push(...courseAssignments);
              }
            } catch (error) {
              console.warn(`Error loading assignments for course ${course.id}:`, error);
            }
          }
        }

        // console.log('🔍 Todas las tareas cargadas:', allAssignments);
        setAssignments(allAssignments);
      } catch (error) {
        console.error('❌ Error loading data:', error);
        console.error('❌ Error details:', {
          message: error.message,
          stack: error.stack,
          response: error.response
        });
        setError('Error al cargar los datos: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    if (userProfile) {
      // console.log('🔍 Usuario autenticado, cargando datos...', userProfile);
      // console.log('🔍 Token actual:', localStorage.getItem('authToken'));
      loadData();
    } else {
      // console.log('❌ Usuario no autenticado');
      // console.log('🔍 userProfile:', userProfile);
      setLoading(false);
    }
  }, [userProfile]);

  // Filtrar tareas según el rol del usuario
  const userAssignments = userProfile?.role === 'teacher'
    ? assignments.filter(a => {
        const course = courses.find(c => c.id === a.courseId);
        const isTeacher = course && course.teacher?.id === userProfile?.id;
        // console.log(`🔍 Tarea ${a.title}: curso=${course?.name}, teacher=${course?.teacher?.id}, user=${userProfile?.id}, isTeacher=${isTeacher}`);
        return isTeacher;
      })
    : assignments.filter(a => {
        const course = courses.find(c => c.id === a.courseId);
        const isStudent = course && course.students?.some(s => s.id === userProfile?.id);
        // console.log(`🔍 Tarea ${a.title}: curso=${course?.name}, students=${course?.students?.length}, user=${userProfile?.id}, isStudent=${isStudent}`);
        return isStudent;
      });

  // console.log('🔍 Tareas filtradas para el usuario:', userAssignments);
  // console.log('🔍 Total assignments:', assignments.length);
  // console.log('🔍 Total courses:', courses.length);
  // console.log('🔍 User profile:', userProfile);

  // Obtener cursos del usuario para el filtro
  const userCourses = userProfile?.role === 'teacher'
    ? courses.filter(c => c.teacher?.id === userProfile?.id)
    : courses.filter(c => c.students?.some(s => s.id === userProfile?.id));

  // Obtener todas las materias únicas de los cursos del usuario
  const userSubjects = [...new Set(
    userCourses.map(course => course.subject).filter(Boolean)
  )];

  // Obtener estado de la tarea
  const getAssignmentStatus = (assignment) => {
    if (userProfile?.role === 'student') {
      const hasSubmission = assignment.submissions?.some(s => s.student_id === userProfile.id);
      if (hasSubmission) return 'completed';

      const daysLeft = Math.ceil((new Date(assignment.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysLeft < 0) return 'overdue';
      if (daysLeft <= 3) return 'urgent';
      if (daysLeft <= 7) return 'pending';
      return 'upcoming';
    } else {
      // Para profesores: estado basado en entregas y fecha de vencimiento
      const totalStudents = assignment.course?.students?.length || 0;
      const submittedCount = assignment.submissions?.length || 0;
      
      // Primero verificar si está vencida
      const daysLeft = Math.ceil((new Date(assignment.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysLeft < 0) return 'overdue';
      
      // Luego verificar estado de entregas
      if (totalStudents === 0) return 'no_students';
      if (submittedCount === 0) return 'no_submissions';
      if (submittedCount === totalStudents) return 'all_submitted';
      return 'partial_submitted';
    }
  };

  // Filtrar por búsqueda, curso, estado y materia
  const filteredAssignments = userAssignments.filter(assignment => {
    const course = courses.find(c => c.id === assignment.courseId);
    const assignmentStatus = getAssignmentStatus(assignment);
    
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = !filterCourse || assignment.courseId === filterCourse;
    const matchesSubject = !filterSubject || course?.subject === filterSubject;
    const matchesDeliveryStatus = !deliveryStatusFilter || assignmentStatus === deliveryStatusFilter;
    
    // Filtro especial para mostrar solo tareas pendientes (para estudiantes)
    const matchesPending = !showOnlyPending || 
                          (userProfile?.role === 'student' && 
                           (assignmentStatus === 'pending' || 
                            assignmentStatus === 'urgent' || 
                            assignmentStatus === 'overdue'));
    
    // Filtro especial para profesores: mostrar solo tareas con entregas pendientes
    const matchesPendingSubmissions = !showOnlyWithPendingSubmissions || 
                                     (userProfile?.role === 'teacher' && 
                                      (assignmentStatus === 'no_submissions' || 
                                       assignmentStatus === 'partial_submitted'));
    
    return matchesSearch && matchesCourse && matchesSubject && matchesDeliveryStatus && matchesPending && matchesPendingSubmissions;
  });




  // Ordenar tareas
  const sortedAssignments = [...filteredAssignments].sort((a, b) => {
    const courseA = courses.find(c => c.id === a.courseId);
    const courseB = courses.find(c => c.id === b.courseId);
    
    let comparison = 0;
    
    switch (sortBy) {
      case 'dueDate':
        comparison = new Date(a.dueDate) - new Date(b.dueDate);
        break;
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'course':
        comparison = (courseA?.name || '').localeCompare(courseB?.name || '');
        break;
      case 'subject':
        comparison = (courseA?.subject || '').localeCompare(courseB?.subject || '');
        break;
      default:
        comparison = 0;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });


  // Obtener estadísticas de entregas para profesores
  const getSubmissionStats = (assignment) => {
    const course = courses.find(c => c.id === assignment.courseId);
    const totalStudents = course?.students?.length || 0;
    const submittedCount = assignment.submissions?.length || 0;
    const pendingCount = totalStudents - submittedCount;
    
    return {
      total: totalStudents,
      submitted: submittedCount,
      pending: pendingCount,
      percentage: totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0
    };
  };

  // Obtener color del estado
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'overdue': return 'error';
      case 'urgent': return 'warning';
      case 'pending': return 'default';
      case 'all_submitted': return 'success';
      case 'partial_submitted': return 'warning';
      case 'no_submissions': return 'error';
      case 'no_students': return 'default';
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
      case 'all_submitted': return 'Todas entregadas';
      case 'partial_submitted': return 'Entregas parciales';
      case 'no_submissions': return 'Sin entregas';
      case 'no_students': return 'Sin estudiantes';
      default: return 'Activa';
    }
  };

  // Contar tareas pendientes para el badge de notificación
  const getPendingAssignmentsCount = () => {
    if (userProfile?.role === 'student') {
      return userAssignments.filter(assignment => {
        const status = getAssignmentStatus(assignment);
        return status === 'pending' || status === 'urgent' || status === 'overdue';
      }).length;
    }
    return 0;
  };

  // Manejar clic en tarea para navegar a los detalles
  const handleAssignmentClick = (assignment) => {
    navigate(`/assignments/${assignment.id}`);
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

  // Mostrar loading
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <LinearProgress sx={{ width: '100%' }} />
        </Box>
      </Container>
    );
  }

  // Mostrar error
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={() => window.location.reload()} variant="contained">
          Reintentar
        </Button>
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
              Tareas
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {userProfile?.role === 'teacher' ? 'Gestiona las tareas de tus cursos' : 'Tareas asignadas'}
            </Typography>
          </Box>

        </Box>
      </motion.div>

      {/* Filtros y búsqueda */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {/* Primera fila: Filtros principales */}
        <Box display="flex" gap={2} mb={3} flexWrap="wrap" alignItems="center">
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

          {userSubjects.length > 0 && (
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Filtrar por materia</InputLabel>
              <Select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                label="Filtrar por materia"
              >
                <MenuItem value="">Todas las materias</MenuItem>
                {userSubjects.map((subject) => (
                  <MenuItem key={subject} value={subject}>
                    {subject}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Filtro de estado de entregas */}
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Estado de entregas</InputLabel>
            <Select
              value={deliveryStatusFilter}
              onChange={(e) => setDeliveryStatusFilter(e.target.value)}
              label="Estado de entregas"
            >
              <MenuItem value="">Todos los estados</MenuItem>
              {userProfile?.role === 'student' ? (
                <>
                  <MenuItem value="pending">Pendientes</MenuItem>
                  <MenuItem value="urgent">Urgentes</MenuItem>
                  <MenuItem value="overdue">Vencidas</MenuItem>
                  <MenuItem value="completed">Completadas</MenuItem>
                </>
              ) : (
                <>
                  <MenuItem value="all_submitted">Todas entregadas</MenuItem>
                  <MenuItem value="partial_submitted">Entregas parciales</MenuItem>
                  <MenuItem value="no_submissions">Sin entregas</MenuItem>
                  <MenuItem value="overdue">Vencidas</MenuItem>
                  <MenuItem value="no_students">Sin estudiantes</MenuItem>
                </>
              )}
            </Select>
          </FormControl>
        </Box>

        {/* Segunda fila: Ordenamiento y acciones */}
        <Box display="flex" gap={2} mb={4} flexWrap="wrap" alignItems="center">
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Ordenar por</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              label="Ordenar por"
            >
              <MenuItem value="dueDate">Fecha de entrega</MenuItem>
              <MenuItem value="title">Título</MenuItem>
              <MenuItem value="course">Curso</MenuItem>
              <MenuItem value="subject">Materia</MenuItem>
              </Select>
            </FormControl>

          <IconButton
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            color={sortOrder === 'asc' ? 'primary' : 'default'}
            title={`Ordenar ${sortOrder === 'asc' ? 'descendente' : 'ascendente'}`}
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
          >
            <SortByAlpha />
          </IconButton>

          <Divider orientation="vertical" flexItem />

          {userProfile?.role === 'student' && (
            <Button
              variant={showOnlyPending ? 'contained' : 'outlined'}
              onClick={() => setShowOnlyPending(!showOnlyPending)}
              startIcon={showOnlyPending ? <Visibility /> : <VisibilityOff />}
              color="warning"
              sx={{ borderRadius: 2 }}
            >
              {showOnlyPending ? 'Mostrar todas' : 'Solo pendientes'}
            </Button>
          )}

          {userProfile?.role === 'teacher' && (
            <Button
              variant={showOnlyWithPendingSubmissions ? 'contained' : 'outlined'}
              onClick={() => setShowOnlyWithPendingSubmissions(!showOnlyWithPendingSubmissions)}
              startIcon={showOnlyWithPendingSubmissions ? <Visibility /> : <VisibilityOff />}
              color="error"
              sx={{ borderRadius: 2 }}
            >
              {showOnlyWithPendingSubmissions ? 'Mostrar todas' : 'Con entregas pendientes'}
            </Button>
          )}
        </Box>

        {/* Estadísticas rápidas */}
        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
          <Chip
            icon={<Assignment />}
            label={`${sortedAssignments.length} tarea${sortedAssignments.length !== 1 ? 's' : ''}`}
            color="primary"
            variant="outlined"
          />
          
          {userProfile?.role === 'student' && (
            <>
              <Chip
                icon={<Notifications />}
                label={`${getPendingAssignmentsCount()} pendiente${getPendingAssignmentsCount() !== 1 ? 's' : ''}`}
                color="warning"
                variant="outlined"
              />
              <Chip
                icon={<School />}
                label={`${userCourses.length} curso${userCourses.length !== 1 ? 's' : ''}`}
                color="info"
                variant="outlined"
              />
            </>
          )}

          {userProfile?.role === 'teacher' && (
            <>
              <Chip
                icon={<People />}
                label={`${userAssignments.reduce((acc, assignment) => {
                  const stats = getSubmissionStats(assignment);
                  return acc + stats.pending;
                }, 0)} entregas pendientes`}
                color="warning"
                variant="outlined"
              />
              <Chip
                icon={<School />}
                label={`${userSubjects.length} materia${userSubjects.length !== 1 ? 's' : ''}`}
                color="info"
                variant="outlined"
              />
            </>
          )}
        </Box>
      </motion.div>

      {/* Lista de tareas */}
      {sortedAssignments.length > 0 ? (
        <Grid container spacing={3}>
          {sortedAssignments.map((assignment, index) => {
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

                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Subject sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {course?.subject}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          •
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {course?.name}
                      </Typography>
                      </Box>

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
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <People sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {getSubmissionStats(assignment).submitted} / {getSubmissionStats(assignment).total} entregas
                              </Typography>
                            </Box>

                            <Typography variant="body2" color="text.secondary">
                              {getSubmissionStats(assignment).percentage}%
                            </Typography>
                          </Box>
                          
                          {/* Barra de progreso de entregas mejorada */}
                          <Box
                            sx={{
                              width: '100%',
                              height: 10,
                              backgroundColor: 'grey.200',
                              borderRadius: 5,
                              overflow: 'hidden',
                              position: 'relative',
                              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
                            }}
                          >
                            <Box
                              sx={{
                                width: `${getSubmissionStats(assignment).percentage}%`,
                                height: '100%',
                                background: getSubmissionStats(assignment).percentage === 100 
                                  ? 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)' 
                                  : getSubmissionStats(assignment).percentage >= 75 
                                    ? 'linear-gradient(135deg, #8bc34a 0%, #aed581 100%)'
                                    : getSubmissionStats(assignment).percentage >= 50 
                                      ? 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)' 
                                      : getSubmissionStats(assignment).percentage > 0 
                                        ? 'linear-gradient(135deg, #2196f3 0%, #42a5f5 100%)'
                                        : 'linear-gradient(135deg, #9e9e9e 0%, #bdbdbd 100%)',
                                transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative',
                                borderRadius: 5,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                              }}
                            >
                              {/* Efecto de brillo animado */}
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                                  animation: 'shimmer 2.5s infinite',
                                  '@keyframes shimmer': {
                                    '0%': { transform: 'translateX(-100%)' },
                                    '100%': { transform: 'translateX(100%)' }
                                  }
                                }}
                              />
                              
                              {/* Efecto de pulsación cuando está completo */}
                              {getSubmissionStats(assignment).percentage === 100 && (
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    background: 'rgba(255,255,255,0.3)',
                                    animation: 'pulse 2s infinite',
                                    '@keyframes pulse': {
                                      '0%': { opacity: 0.5 },
                                      '50%': { opacity: 1 },
                                      '100%': { opacity: 0.5 }
                                    }
                                  }}
                                />
                              )}
                            </Box>
                          </Box>
                          
                          {/* Mensajes de estado mejorados */}
                          {getSubmissionStats(assignment).percentage === 100 && (
                            <Typography variant="caption" color="success.main" sx={{ mt: 0.5, display: 'block', fontWeight: 'medium' }}>
                              🎉 Todas las entregas completadas
                            </Typography>
                          )}
                          {getSubmissionStats(assignment).percentage > 0 && getSubmissionStats(assignment).percentage < 100 && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                              Faltan {getSubmissionStats(assignment).pending} estudiante{getSubmissionStats(assignment).pending !== 1 ? 's' : ''} por entregar
                            </Typography>
                          )}
                          {getSubmissionStats(assignment).percentage === 0 && (
                            <Typography variant="caption" color="warning.main" sx={{ mt: 0.5, display: 'block', fontWeight: 'medium' }}>
                              ⏰ Esperando las primeras entregas
                            </Typography>
                          )}
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
              {searchTerm || filterCourse || deliveryStatusFilter ? 'No se encontraron tareas' : 'No tienes tareas aún'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {searchTerm || filterCourse || deliveryStatusFilter
                ? 'Intenta ajustar los filtros de búsqueda'
                : userProfile?.role === 'teacher'
                  ? 'Crea tu primera tarea para comenzar'
                  : 'Las tareas aparecerán cuando te unas a un curso'
              }
            </Typography>

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
          if (userProfile?.role === 'teacher') {
            navigate(`/assignments/${selectedAssignment.id}/edit`);
          } else {
            navigate(`/assignments/${selectedAssignment.id}`);
          }
          handleMenuClose();
        }}>
          {userProfile?.role === 'teacher' ? 'Editar tarea' : 'Ver tarea'}
        </MenuItem>
        {userProfile?.role === 'teacher' && (
          <MenuItem onClick={() => {
            navigate(`/assignments/${selectedAssignment.id}`);
            handleMenuClose();
          }}>
            Ver entregas
          </MenuItem>
        )}
        <MenuItem onClick={handleMenuClose}>
          Configuración
        </MenuItem>
      </Menu>


    </Container>
  );
};

export default Assignments;
