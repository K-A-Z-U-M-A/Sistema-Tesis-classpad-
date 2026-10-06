import React from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Chip
} from '@mui/material';
import {
  School,
  Assignment,
  CheckCircle,
  Schedule,
  TrendingUp
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useDemoData } from '../../contexts/DemoDataContext';
import { useAuth } from '../../contexts/AuthContext';

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
        border: `1px solid ${color}20`
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" component="div" color={color} fontWeight="bold">
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor: `${color}15`,
              color: color
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  </motion.div>
);

// Componente de tarjeta de curso
const CourseCard = ({ course }) => {
  const { assignments } = useDemoData();
  const courseAssignments = assignments.filter(a => a.courseId === course.id);
  const completedAssignments = courseAssignments.filter(a =>
    a.submissions.some(s => s.studentId === 'demo-student-1')
  );
  const progress = courseAssignments.length > 0
    ? (completedAssignments.length / courseAssignments.length) * 100
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card sx={{ height: '100%', cursor: 'pointer' }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                backgroundColor: course.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <School sx={{ color: 'white' }} />
            </Box>
            <Chip
              label={course.isActive ? 'Activo' : 'Inactivo'}
              color={course.isActive ? 'success' : 'default'}
              size="small"
            />
          </Box>

          <Typography variant="h6" gutterBottom>
            {course.name}
          </Typography>

          <Typography variant="body2" color="text.secondary" gutterBottom>
            {course.code} • {course.subject}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {course.grade} • {course.semester ? 
              (course.semester === 1 ? '1er Semestre' : 
               course.semester === 2 ? '2do Semestre' :
               course.semester === 3 ? '3er Semestre' :
               course.semester === 4 ? '4to Semestre' :
               course.semester === 5 ? '5to Semestre' :
               course.semester === 6 ? '6to Semestre' :
               course.semester === 7 ? '7mo Semestre' :
               course.semester === 8 ? '8vo Semestre' :
               course.semester === 9 ? '9no Semestre' :
               course.semester === 10 ? '10mo Semestre' :
               course.semester === 11 ? '11vo Semestre' :
               '12vo Semestre') : course.grade}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {course.students.length} estudiantes
          </Typography>

          <Box sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Progreso: {Math.round(progress)}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 6,
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
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="subtitle1" fontWeight="medium">
                {assignment.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {assignment.description}
              </Typography>
            </Box>
            <Box textAlign="right">
              <Chip
                label={isOverdue ? 'Vencida' : `${daysLeft} días`}
                color={isOverdue ? 'error' : daysLeft <= 3 ? 'warning' : 'default'}
                size="small"
              />
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
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
  const { courses, assignments } = useDemoData();

  // Filtrar cursos según el rol del usuario
  const userCourses = userProfile?.role === 'teacher'
    ? courses.filter(c => c.teacher.uid === userProfile.uid)
    : courses.filter(c => c.students.some(s => s.uid === userProfile?.uid));

  // Filtrar tareas pendientes para estudiantes
  const pendingTasks = userProfile?.role === 'student'
    ? assignments.filter(a =>
        userCourses.some(c => c.id === a.courseId) &&
        !a.submissions.some(s => s.studentId === userProfile.uid)
      )
    : [];

  // Calcular estadísticas
  const totalCourses = userCourses.length;
  const totalAssignments = assignments.filter(a =>
    userCourses.some(c => c.id === a.courseId)
  ).length;
  const completedAssignments = assignments.filter(a =>
    userCourses.some(c => c.id === a.courseId) &&
    a.submissions.some(s => s.studentId === userProfile?.uid)
  ).length;
  const averageGrade = completedAssignments > 0
    ? assignments
        .filter(a => a.submissions.some(s => s.studentId === userProfile?.uid))
        .reduce((sum, a) => {
          const submission = a.submissions.find(s => s.studentId === userProfile?.uid);
          return sum + (submission?.grade || 0);
        }, 0) / completedAssignments
    : 0;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Typography variant="h3" gutterBottom fontWeight="bold">
          ¡Hola Ingeniero! 👋
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Bienvenido a tu dashboard de ClassPad
        </Typography>
      </motion.div>

      {/* Estadísticas principales */}
      <Grid container spacing={3} sx={{ mt: 4 }}>
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
      <Grid container spacing={4} sx={{ mt: 2 }}>
        {/* Cursos recientes */}
        <Grid item xs={12} lg={8}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
              Mis Cursos
            </Typography>
            <Grid container spacing={3}>
              {userCourses.map((course) => (
                <Grid item xs={12} sm={6} key={course.id}>
                  <CourseCard course={course} />
                </Grid>
              ))}
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
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
              Tareas Pendientes
            </Typography>
            {pendingTasks.length > 0 ? (
              pendingTasks.slice(0, 5).map((assignment) => (
                <PendingTask key={assignment.id} assignment={assignment} />
              ))
            ) : (
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" textAlign="center">
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
