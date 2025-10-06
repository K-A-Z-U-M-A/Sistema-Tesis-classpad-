import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  School,
  Assignment,
  CheckCircle,
  Schedule,
  TrendingUp
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext.tsx';
import api from '../../services/api';

// Componente de tarjeta de estadística
const StatCard = ({ title, value, icon, color, subtitle }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${color}15, ${color}05)`,
        border: `1px solid ${color}20`,
        borderRadius: 3
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box 
          display="flex" 
          alignItems="center" 
          justifyContent="space-between"
          flexDirection={{ xs: 'column', sm: 'row' }}
          gap={{ xs: 1, sm: 0 }}
          textAlign={{ xs: 'center', sm: 'left' }}
        >
          <Box>
            <Typography 
              variant="h4" 
              component="div" 
              color={color} 
              fontWeight="bold"
              sx={{ fontSize: { xs: '1.8rem', sm: '2.125rem' } }}
            >
              {value}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mt: 1,
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              p: { xs: 1, sm: 1.5 },
              borderRadius: 2,
              backgroundColor: `${color}15`,
              color: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {React.cloneElement(icon, { 
              sx: { fontSize: { xs: 20, sm: 24 } } 
            })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  </motion.div>
);

// Componente de tarjeta de curso
const CourseCard = ({ course }) => {
  // Usar datos reales del curso
  const progress = course.progress || 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card sx={{ 
        height: '100%', 
        cursor: 'pointer',
        borderRadius: 3,
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        },
        transition: 'all 0.3s ease'
      }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box 
            display="flex" 
            alignItems="center" 
            justifyContent="space-between" 
            mb={2}
            sx={{ flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 } }}
          >
            <Box
              sx={{
                width: { xs: 35, sm: 40 },
                height: { xs: 35, sm: 40 },
                borderRadius: 2,
                backgroundColor: course.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <School sx={{ color: 'white', fontSize: { xs: 18, sm: 20 } }} />
            </Box>
            <Chip
              label={course.is_active ? 'Activo' : 'Inactivo'}
              color={course.is_active ? 'success' : 'default'}
              size="small"
              sx={{ 
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                height: { xs: 24, sm: 28 }
              }}
            />
          </Box>

          <Typography 
            variant="h6" 
            gutterBottom
            sx={{ 
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
              lineHeight: { xs: 1.3, sm: 1.4 }
            }}
          >
            {course.name}
          </Typography>

          <Typography 
            variant="body2" 
            color="text.secondary" 
            gutterBottom
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          >
            {course.course_code || course.code} • {course.subject}
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            gutterBottom
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          >
            {course.turn || course.grade} • {course.description || 'Sin descripción'}
          </Typography>

          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 2,
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}
          >
            {course.student_count || 0} estudiantes
          </Typography>

          <Box sx={{ mb: 1 }}>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              Progreso: {Math.round(progress)}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: { xs: 4, sm: 6 },
                borderRadius: 3,
                backgroundColor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: course.color,
                  borderRadius: 3
                }
              }}
            />
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Componente de tarea pendiente
const PendingTask = ({ assignment }) => {
  const daysLeft = Math.ceil((new Date(assignment.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysLeft < 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card sx={{ 
        mb: 2,
        borderRadius: 3,
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        },
        transition: 'all 0.3s ease'
      }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box 
            display="flex" 
            alignItems="center" 
            justifyContent="space-between"
            flexDirection={{ xs: 'column', sm: 'row' }}
            gap={{ xs: 1, sm: 0 }}
            textAlign={{ xs: 'center', sm: 'left' }}
          >
            <Box>
              <Typography 
                variant="subtitle1" 
                fontWeight="medium"
                sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
              >
                {assignment.title}
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  display: '-webkit-box',
                  WebkitLineClamp: { xs: 2, sm: 3 },
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {assignment.description}
              </Typography>
            </Box>
            <Box textAlign={{ xs: 'center', sm: 'right' }}>
              <Chip
                label={isOverdue ? 'Vencida' : `${daysLeft} días`}
                color={isOverdue ? 'error' : daysLeft <= 3 ? 'warning' : 'default'}
                size="small"
                sx={{ 
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  height: { xs: 24, sm: 28 }
                }}
              />
              <Typography 
                variant="caption" 
                display="block" 
                color="text.secondary" 
                sx={{ 
                  mt: 1,
                  fontSize: { xs: '0.7rem', sm: '0.75rem' }
                }}
              >
                {assignment.maxPoints} puntos
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const Dashboard = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [statistics, setStatistics] = useState({
    courses_count: 0,
    assignments_count: 0,
    completed_assignments: 0,
    average_grade: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, [userProfile]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Cargar cursos del usuario
      const coursesResponse = await api.getMyCourses();
      const userCourses = coursesResponse.data?.courses || [];
      setCourses(userCourses);

      // Cargar tareas del usuario
      const assignmentsResponse = await api.getMyAssignments();
      const userAssignments = assignmentsResponse.data?.assignments || [];
      setAssignments(userAssignments);

      // Cargar estadísticas del usuario
      const profileResponse = await api.getMyProfile();
      const userStats = profileResponse.data?.statistics || {};
      setStatistics({
        courses_count: userStats.courses_count || userCourses.length,
        assignments_count: userStats.assignments_count || userAssignments.length,
        completed_assignments: userStats.completed_assignments || 0,
        average_grade: userStats.average_grade || 0
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // En caso de error, usar datos por defecto
      setStatistics({
        courses_count: 0,
        assignments_count: 0,
        completed_assignments: 0,
        average_grade: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar tareas pendientes para estudiantes
  const pendingTasks = userProfile?.role === 'student'
    ? assignments.filter(a => a.status === 'pending' || a.status === 'overdue')
    : [];

  // Usar estadísticas reales
  const totalCourses = statistics.courses_count;
  const totalAssignments = statistics.assignments_count;
  const completedAssignments = statistics.completed_assignments;
  const averageGrade = statistics.average_grade;

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 2, sm: 3 } }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Cargando dashboard...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 2, sm: 3 } }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Typography 
          variant="h3" 
          gutterBottom 
          fontWeight="bold"
          sx={{ fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3rem' } }}
        >
          ¡Hola {userProfile?.displayName || userProfile?.display_name || 'Ingeniero'}! 👋
        </Typography>
        <Typography 
          variant="h6" 
          color="text.secondary" 
          gutterBottom
          sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
        >
          Bienvenido a tu dashboard de ClassPad
        </Typography>
      </motion.div>

      {/* Estadísticas principales */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mt: { xs: 2, sm: 4 } }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Cursos Activos"
            value={totalCourses}
            icon={<School />}
            color="#007AFF"
            subtitle="Este semestre"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tareas Totales"
            value={totalAssignments}
            icon={<Assignment />}
            color="#34C759"
            subtitle="Asignadas"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tareas Completadas"
            value={completedAssignments}
            icon={<CheckCircle />}
            color="#FF9500"
            subtitle="Entregadas"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Promedio"
            value={averageGrade.toFixed(1)}
            icon={<TrendingUp />}
            color="#FF3B30"
            subtitle="Calificaciones"
          />
        </Grid>
      </Grid>

      {/* Contenido principal */}
      <Grid container spacing={{ xs: 2, sm: 4 }} sx={{ mt: { xs: 2, sm: 2 } }}>
        {/* Cursos recientes */}
        <Grid item xs={12} lg={8}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <Typography 
              variant="h5" 
              gutterBottom 
              sx={{ 
                mb: 3,
                fontSize: { xs: '1.25rem', sm: '1.5rem' }
              }}
            >
              Mis Cursos
            </Typography>
            <Grid container spacing={{ xs: 2, sm: 3 }}>
              {courses.length > 0 ? (
                courses.map((course) => (
                  <Grid item xs={12} sm={6} key={course.id}>
                    <CourseCard course={course} />
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Card sx={{ borderRadius: 3, textAlign: 'center', py: 4 }}>
                    <CardContent>
                      <School sx={{ fontSize: 48, mb: 2, opacity: 0.5, color: 'text.secondary' }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No tienes cursos inscritos
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {userProfile?.role === 'student' 
                          ? 'Únete a un curso usando un código de inscripción'
                          : 'Crea tu primer curso para comenzar'
                        }
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </motion.div>
        </Grid>

        {/* Tareas pendientes */}
        <Grid item xs={12} lg={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <Typography 
              variant="h5" 
              gutterBottom 
              sx={{ 
                mb: 3,
                fontSize: { xs: '1.25rem', sm: '1.5rem' }
              }}
            >
              Tareas Pendientes
            </Typography>
            {pendingTasks.length > 0 ? (
              pendingTasks.slice(0, 5).map((assignment) => (
                <PendingTask key={assignment.id} assignment={assignment} />
              ))
            ) : (
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    textAlign="center"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                  >
                    ¡No tienes tareas pendientes! 🎉
                  </Typography>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
