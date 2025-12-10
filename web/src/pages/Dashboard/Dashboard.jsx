import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Card,
  CardActionArea,
  CardContent,
  LinearProgress,
  Chip,
  CircularProgress,
  Alert,
  AlertTitle,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button
} from '@mui/material';
import {
  School,
  Assignment,
  CheckCircle,
  Schedule,
  TrendingUp,
  People,
  Assessment,
  Warning,
  TrendingDown,
  AccessTime,
  BarChart,
  Notifications,
  ErrorOutline,
  CheckCircleOutline,
  AttachMoney,
  CalendarToday,
  FactCheck,
  AssignmentTurnedIn,
  Bolt
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  BarChart as RechartsBarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Componente de tarjeta de estadística mejorado (Pill Layout Mobile)
const StatCard = ({ title, value, icon, color, subtitle, onClick }) => {
  const formatValue = (val) => {
    if (typeof val === 'string') return val;
    if (val === null || val === undefined) return 'N/A';
    if (typeof val === 'number') {
      if (Number.isInteger(val)) return val.toLocaleString('es-ES');
      return val.toFixed(1);
    }
    return String(val);
  };
  const displayValue = formatValue(value);
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card
        sx={{
          height: { xs: 'auto', sm: '100%' },
          minHeight: { xs: 'auto', sm: 140 },
          background: `linear-gradient(135deg, ${color}15, ${color}05)`,
          border: `1px solid ${color}30`,
          borderRadius: { xs: 4, sm: 3 }, // Pill shape
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          cursor: onClick ? 'pointer' : 'default',
          '&:hover': { transform: onClick ? 'translateY(-4px)' : 'none', boxShadow: onClick ? '0 4px 16px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.08)' }
        }}
        onClick={onClick}
      >
        <CardContent sx={{ p: { xs: 1.5, sm: 3 }, '&:last-child': { pb: { xs: 1.5, sm: 3 } }, height: '100%', display: 'flex', flexDirection: { xs: 'row', sm: 'column' }, justifyContent: 'space-between', alignItems: { xs: 'center', sm: 'flex-start' } }}>
          <Box sx={{ display: { xs: 'flex', sm: 'none' }, alignItems: 'center', width: '100%', gap: 2 }}>
            <Box sx={{ p: 1, borderRadius: '50%', bgcolor: 'rgba(255, 255, 255, 0.9)', color: color, display: 'flex', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
              {React.cloneElement(icon, { sx: { fontSize: 20 } })}
            </Box>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="body1" fontWeight="600" color="text.secondary" noWrap sx={{ fontSize: '0.9rem', lineHeight: 1.1 }}>{title}</Typography>
              {subtitle && <Typography variant="caption" noWrap sx={{ color: color, fontSize: '0.75rem', display: 'block' }}>{subtitle}</Typography>}
            </Box>
            <Typography variant="h4" fontWeight="bold" color="text.primary" sx={{ fontSize: '1.5rem', flexShrink: 0 }}>{displayValue}</Typography>
          </Box>
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, width: '100%', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(255, 255, 255, 0.9)', color: color, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {icon}
            </Box>
          </Box>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Typography variant="h3" color="text.primary" fontWeight="800" sx={{ fontSize: '2.5rem', lineHeight: 1 }}>{displayValue}</Typography>
            <Typography variant="body1" color="text.secondary" fontWeight="500" sx={{ mt: 0.5, fontSize: '1rem' }}>{title}</Typography>
            {subtitle && <Typography variant="caption" sx={{ color: color, fontWeight: 600, mt: 0.5, display: 'block', fontSize: '0.75rem' }}>{subtitle}</Typography>}
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Componente de tarjeta de curso (Pill Layout Mobile)
const CourseCard = ({ course }) => {
  const navigate = useNavigate();
  const progress = course.progress || 0;
  const isActive = course.is_active !== undefined ? course.is_active : (course.isActive !== undefined ? course.isActive : true);
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
      <Card sx={{ height: '100%', cursor: 'pointer', borderRadius: { xs: 4, sm: 3 }, '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }, transition: 'all 0.3s ease' }} onClick={() => navigate(`/courses/${course.id}`)}>
        <CardContent sx={{ p: { xs: 1.5, sm: 3 }, '&:last-child': { pb: { xs: 1.5, sm: 3 } } }}>
          <Box sx={{ display: { xs: 'flex', sm: 'none' }, flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: course.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <School sx={{ color: 'white', fontSize: 20 }} />
              </Box>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="body1" fontWeight="bold" noWrap sx={{ fontSize: '1rem' }}>{course.name}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap display="block">{course.subject}</Typography>
              </Box>
              <Chip label={isActive ? 'Activo' : 'Inactivo'} color={isActive ? 'success' : 'default'} size="small" sx={{ height: 24, fontSize: '0.7rem' }} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 0.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight="500">{course.student_count || 0} alumnos</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '50%' }}>
                <Typography variant="caption" color="text.secondary">{Math.round(progress)}%</Typography>
                <LinearProgress variant="determinate" value={progress} sx={{ flexGrow: 1, height: 6, borderRadius: 3, backgroundColor: 'grey.200', '& .MuiLinearProgress-bar': { backgroundColor: course.color, borderRadius: 3 } }} />
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Box sx={{ width: 40, height: 40, borderRadius: 2, backgroundColor: course.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><School sx={{ color: 'white', fontSize: 20 }} /></Box>
              <Chip label={isActive ? 'Activo' : 'Inactivo'} color={isActive ? 'success' : 'default'} size="small" sx={{ fontSize: '0.75rem', height: 28 }} />
            </Box>
            <Typography variant="h6" gutterBottom sx={{ fontSize: '1.25rem', lineHeight: 1.4 }}>{course.name}</Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: '0.875rem' }}>{course.course_code || course.code} • {course.subject}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.875rem' }}>{course.student_count || 0} estudiantes</Typography>
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>Progreso: {Math.round(progress)}%</Typography>
              <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 3, backgroundColor: 'grey.200', '& .MuiLinearProgress-bar': { backgroundColor: course.color, borderRadius: 3 } }} />
            </Box>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Componente de tarea pendiente (Pill Layout Mobile)
const PendingTask = ({ assignment }) => {
  const navigate = useNavigate();
  const assignmentId = assignment.id ?? assignment.assignment_id;
  const hasDueDate = Boolean(assignment.due_date);
  const dueDate = hasDueDate ? new Date(assignment.due_date) : null;
  const now = new Date();
  const daysLeft = hasDueDate ? Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24)) : null;
  const isOverdue = hasDueDate ? daysLeft < 0 : false;
  const statusKey = !hasDueDate ? 'noDue' : isOverdue ? 'overdue' : daysLeft <= 3 ? 'urgent' : daysLeft <= 7 ? 'soon' : 'scheduled';

  const statusVisuals = {
    overdue: { accent: 'rgba(244,67,54,0.95)', background: 'linear-gradient(135deg, rgba(244,67,54,0.18), rgba(244,67,54,0.05))', borderColor: 'rgba(244,67,54,0.35)', chipColor: 'error', icon: <Warning fontSize="small" color="error" /> },
    urgent: { accent: 'rgba(255,152,0,0.95)', background: 'linear-gradient(135deg, rgba(255,152,0,0.18), rgba(255,152,0,0.05))', borderColor: 'rgba(255,152,0,0.35)', chipColor: 'warning', icon: <AccessTime fontSize="small" color="warning" /> },
    soon: { accent: 'rgba(33,150,243,0.95)', background: 'linear-gradient(135deg, rgba(33,150,243,0.18), rgba(33,150,243,0.05))', borderColor: 'rgba(33,150,243,0.35)', chipColor: 'info', icon: <Schedule fontSize="small" color="info" /> },
    scheduled: { accent: 'rgba(76,175,80,0.95)', background: 'linear-gradient(135deg, rgba(76,175,80,0.18), rgba(76,175,80,0.05))', borderColor: 'rgba(76,175,80,0.35)', chipColor: 'success', icon: <CalendarToday fontSize="small" color="success" /> },
    noDue: { accent: 'rgba(158,158,158,0.95)', background: 'linear-gradient(135deg, rgba(158,158,158,0.18), rgba(158,158,158,0.05))', borderColor: 'rgba(158,158,158,0.35)', chipColor: 'default', icon: <Assignment fontSize="small" color="action" /> }
  };
  const visuals = statusVisuals[statusKey];

  return (
    <Card elevation={0} sx={{ mb: { xs: 1.5, sm: 2 }, borderRadius: { xs: 4, sm: 3 }, border: `1px solid ${visuals.borderColor}`, background: visuals.background, cursor: 'pointer', transition: 'all 0.2s', '&:hover': { transform: 'translateX(4px)', borderColor: visuals.accent } }} onClick={() => navigate(`/assignments/${assignmentId}`)}>
      <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
        <Box sx={{ display: { xs: 'flex', sm: 'none' }, alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: 1, borderRadius: '50%', bgcolor: 'white', display: 'flex', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>{visuals.icon}</Box>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="body1" fontWeight="600" noWrap sx={{ fontSize: '0.95rem' }}>{assignment.title}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap display="block">{assignment.course_name || assignment.subject_name || 'Curso'}</Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            {hasDueDate && <Typography variant="caption" fontWeight="bold" sx={{ color: visuals.accent, fontSize: '0.75rem', display: 'block' }}>{daysLeft === 0 ? 'Hoy' : daysLeft === 1 ? 'Mañana' : isOverdue ? 'Vencida' : `${daysLeft} días`}</Typography>}
          </Box>
        </Box>
        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ fontSize: '1.1rem' }}>{assignment.title}</Typography>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Chip label={assignment.course_name || assignment.subject_name || 'Curso'} size="small" variant="outlined" sx={{ borderColor: 'rgba(0,0,0,0.12)', height: 24 }} />
              </Box>
            </Box>
            <Chip label={!hasDueDate ? 'Sin fecha' : isOverdue ? 'Vencida' : daysLeft === 0 ? 'Para hoy' : daysLeft === 1 ? 'Para mañana' : `${daysLeft} días restantes`} color={visuals.chipColor} size="small" icon={visuals.icon} sx={{ fontWeight: 'bold' }} />
          </Box>
          <Box display="flex" alignItems="center" gap={2} mt={1}>
            {hasDueDate && <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><CalendarToday sx={{ fontSize: 16 }} />{dueDate.toLocaleDateString()}</Typography>}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const PerformanceChart = ({ data }) => {
  if (!data || data.length === 0) return <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}><Typography variant="body2" color="text.secondary">No hay datos disponibles</Typography></Box>;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsBarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 80 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 11 }} interval={0} />
        <YAxis domain={[0, 100]} />
        <Tooltip formatter={(value, name) => [name === 'Promedio (%)' || name.includes('Asistencia') || name.includes('Participación') ? `${value.toFixed(1)}%` : value, name]} labelStyle={{ color: '#000', fontWeight: 'bold' }} />
        <Legend />
        <Bar dataKey="averageGrade" fill="#8884d8" name="Promedio (%)" radius={[8, 8, 0, 0]} />
        <Bar dataKey="attendanceRate" fill="#82ca9d" name="Asistencia (%)" radius={[8, 8, 0, 0]} />
        <Bar dataKey="participationRate" fill="#ffc658" name="Participación (%)" radius={[8, 8, 0, 0]} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

const GradeDistributionChart = ({ gradeDistribution }) => {
  if (!gradeDistribution || Object.values(gradeDistribution).every(v => v === 0)) return <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}><Typography variant="body2" color="text.secondary">No hay calificaciones</Typography></Box>;
  const data = [
    { name: 'Excelente', value: gradeDistribution.excellent || 0, color: '#4CAF50' },
    { name: 'Bueno', value: gradeDistribution.good || 0, color: '#8BC34A' },
    { name: 'Regular', value: gradeDistribution.average || 0, color: '#FFC107' },
    { name: 'Bajo', value: gradeDistribution.poor || 0, color: '#F44336' }
  ].filter(item => item.value > 0);
  return (
    <ResponsiveContainer width="100%" height={200}>
      <RechartsBarChart data={data} layout="vertical" margin={{ top: 5, right: 10, left: 65, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="name" type="category" width={65} tick={{ fontSize: 10 }} />
        <Tooltip />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

const Dashboard = () => {
  const { userProfile, profileComplete } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [teacherStats, setTeacherStats] = useState(null);
  const isTeacher = userProfile?.role === 'teacher';

  useEffect(() => {
    if (userProfile) loadDashboardData();
  }, [userProfile]);


  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Cargar cursos del usuario
      const coursesResponse = await api.getMyCourses();
      const userCourses = coursesResponse.data?.courses || coursesResponse.data || [];
      setCourses(Array.isArray(userCourses) ? userCourses : []);

      // Cargar tareas del usuario
      const assignmentsResponse = await api.getMyAssignments();
      const userAssignments = assignmentsResponse.data?.assignments || assignmentsResponse.data || [];
      setAssignments(Array.isArray(userAssignments) ? userAssignments : []);

      // Cargar estadísticas (para profesores y estudiantes)
      try {
        const statsResponse = await api.getMyStatistics();
        console.log('📊 Statistics Response:', statsResponse);
        if (statsResponse?.data?.statistics) {
          setTeacherStats(statsResponse.data.statistics);
          console.log('✅ Stats loaded:', {
            totalCourses: statsResponse.data.statistics.totalCourses,
            coursesStats: statsResponse.data.statistics.coursesStats?.length || 0
          });
        } else {
          console.warn('⚠️ No statistics data in response');
          setTeacherStats(null);
        }
      } catch (statsError) {
        console.error('❌ Error loading statistics:', statsError);
        setTeacherStats(null);
      }

    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar tareas pendientes para estudiantes
  const pendingTasks = userProfile?.role === 'student'
    ? assignments.filter(a => {
      // Si ya tiene una entrega (submission_id), no es pendiente
      if (a.submission_id) return false;
      // Si no tiene fecha límite, es pendiente
      if (!a.due_date) return true;
      // Si la fecha límite ya pasó o aún no ha pasado, es pendiente
      return true;
    }).sort((a, b) => {
      // Ordenar: primero las vencidas, luego por fecha de vencimiento
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      const dateA = new Date(a.due_date);
      const dateB = new Date(b.due_date);
      const now = new Date();
      const aOverdue = dateA < now;
      const bOverdue = dateB < now;
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      return dateA - dateB;
    })
    : [];

  // Preparar datos para gráficos - SOLO datos reales de la base de datos
  const performanceData = isTeacher && teacherStats?.coursesStats?.length > 0
    ? teacherStats.coursesStats.map(course => ({
      name: course.courseName?.substring(0, 15) || 'Curso',
      fullName: course.courseName,
      averageGrade: course.averageGrade || 0,
      attendanceRate: course.attendanceRate || 0,
      participationRate: course.participationRate || 0,
      studentCount: course.studentCount || 0,
      activeStudentsCount: course.activeStudentsCount || 0,
      assignmentCount: course.assignmentCount || 0,
      publishedAssignments: course.publishedAssignments || 0,
      submissionCount: course.submissionCount || 0,
      gradedSubmissions: course.gradedSubmissions || 0,
      gradeDistribution: course.gradeDistribution || {},
      pendingReviewCount: course.pendingReviewCount || 0,
      upcomingAssignmentsCount: course.upcomingAssignmentsCount || 0,
      attendanceSessionsCount: course.attendanceSessionsCount || 0
    }))
    : [];

  // Calcular estadísticas básicas (solo conteos, no promedios globales)
  const totalCourses = isTeacher
    ? (teacherStats?.totalCourses ?? courses.length ?? 0)
    : (teacherStats?.totalCourses ?? courses.length ?? 0);
  const totalAssignments = isTeacher
    ? (teacherStats?.totalAssignments ?? assignments.length ?? 0)
    : (teacherStats?.totalAssignments ?? assignments.length ?? 0);

  // Para estudiantes - calcular desde las tareas si no hay estadísticas del backend
  const completedAssignments = !isTeacher
    ? (teacherStats?.completedAssignments ??
      assignments.filter(a => a.submission_id || a.submission_status === 'submitted' || a.submission_status === 'graded').length ?? 0)
    : 0;
  const pendingAssignments = !isTeacher
    ? (teacherStats?.pendingAssignments ??
      assignments.filter(a => {
        if (a.submission_id) return false;
        if (!a.due_date) return true;
        return new Date(a.due_date) >= new Date();
      }).length ?? 0)
    : 0;
  const overdueAssignments = !isTeacher
    ? (teacherStats?.overdueAssignments ??
      assignments.filter(a => {
        if (a.submission_id) return false;
        if (!a.due_date) return false;
        return new Date(a.due_date) < new Date();
      }).length ?? 0)
    : 0;
  // Calcular promedio de calificaciones para estudiantes
  const averageGrade = !isTeacher
    ? (teacherStats && typeof teacherStats.averageGrade === 'number' && teacherStats.averageGrade > 0
      ? teacherStats.averageGrade
      : (() => {
        // Intentar calcular desde las tareas si hay calificaciones
        const gradedAssignments = assignments.filter(a =>
          a.grade !== null && a.grade !== undefined && a.submission_status === 'graded'
        );
        if (gradedAssignments.length > 0) {
          const sum = gradedAssignments.reduce((acc, a) => {
            const grade = typeof a.grade === 'number' ? a.grade : parseFloat(a.grade);
            return acc + (isNaN(grade) ? 0 : grade);
          }, 0);
          return sum / gradedAssignments.length;
        }
        return 0;
      })())
    : 0;

  // Para profesores
  // Sumar estudiantes de todos los cursos (cada curso es independiente)
  const totalStudents = isTeacher && teacherStats?.coursesStats
    ? teacherStats.coursesStats.reduce((sum, course) => sum + (course.studentCount ?? 0), 0)
    : isTeacher
      ? courses.reduce((sum, course) => sum + (course.student_count ?? 0), 0)
      : 0;

  // Estudiantes activos (últimos 7 días)
  const totalActiveStudents = isTeacher && teacherStats
    ? (teacherStats.totalActiveStudents ??
      teacherStats.coursesStats?.reduce((sum, course) => sum + (course.activeStudentsCount ?? 0), 0) ?? 0)
    : 0;

  // Sumar tareas pendientes de revisión (por curso)
  const assignmentsPendingReview = isTeacher && teacherStats
    ? (teacherStats.assignmentsPendingReview ?? 0)
    : 0;
  const assignmentsUpcoming = isTeacher && teacherStats
    ? (teacherStats.assignmentsUpcoming ?? 0)
    : 0;

  // Actividad reciente
  const recentSubmissions = isTeacher && teacherStats
    ? (teacherStats.recentSubmissions ?? 0)
    : 0;
  const recentGrades = isTeacher && teacherStats
    ? (teacherStats.recentGrades ?? 0)
    : 0;

  // Tasa de participación promedio
  const averageParticipationRate = isTeacher && teacherStats
    ? (typeof teacherStats.averageParticipationRate === 'number' ? teacherStats.averageParticipationRate : 0)
    : 0;

  // Para estadísticas por curso
  const coursesWithStats = teacherStats?.coursesStats || [];

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
    <Container maxWidth="lg" sx={{ py: { xs: 1.5, sm: 4 }, px: { xs: 1.5, sm: 3 } }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Typography
          variant="h3"
          gutterBottom
          fontWeight="bold"
          sx={{ fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' } }}
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

      {/* Banner de notificación si el perfil no está completo - Solo para estudiantes */}
      {!isTeacher && profileComplete === false && (
        <Alert
          severity="warning"
          sx={{ mt: 2, mb: 3, cursor: 'pointer' }}
          onClick={() => navigate('/profile/complete')}
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/profile/complete')}>
              Completar ahora
            </Button>
          }
        >
          <AlertTitle>¡Completa tu perfil!</AlertTitle>
          Faltan datos personales por completar. Haz clic aquí para completar tu perfil.
        </Alert>
      )}

      {/* Estadísticas principales - Métricas clave */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mt: { xs: 2, sm: 4 } }}>
        {isTeacher ? (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Cursos Activos"
                value={totalCourses}
                icon={<School />}
                color="#007AFF"
                subtitle="Cursos que gestionas"
                onClick={() => navigate('/courses')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Estudiantes Totales"
                value={totalStudents}
                icon={<People />}
                color="#34C759"
                subtitle={totalActiveStudents > 0 ? `${totalActiveStudents} activos (7 días)` : 'Sin actividad reciente'}
                onClick={() => navigate('/people')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Tareas Totales"
                value={totalAssignments}
                icon={<Assignment />}
                color="#FF9500"
                subtitle="En todos los cursos"
                onClick={() => navigate('/assignments')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Tasa de Participación"
                value={averageParticipationRate > 0 ? `${averageParticipationRate.toFixed(1)}%` : '0%'}
                icon={<TrendingUp />}
                color="#9C27B0"
                subtitle="Promedio de entregas"
              />
            </Grid>
          </>
        ) : (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Cursos Matriculados"
                value={totalCourses}
                icon={<School />}
                color="#007AFF"
                subtitle="Mis cursos"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Tareas Totales"
                value={totalAssignments}
                icon={<Assignment />}
                color="#FF9500"
                subtitle="Asignadas"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Tareas Completadas"
                value={completedAssignments}
                icon={<CheckCircle />}
                color="#34C759"
                subtitle="Entregadas"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Promedio"
                value={averageGrade > 0 ? `${averageGrade.toFixed(1)}%` : '0%'}
                icon={<TrendingUp />}
                color="#9C27B0"
                subtitle={averageGrade > 0 ? 'Calificaciones' : 'Sin calificaciones aún'}
              />
            </Grid>
          </>
        )}
      </Grid>

      {/* Estadísticas adicionales para estudiantes */}
      {!isTeacher && (
        <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Tareas Pendientes"
              value={pendingAssignments}
              icon={<Schedule />}
              color="#FF9800"
              subtitle="Por entregar"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Tareas Vencidas"
              value={overdueAssignments}
              icon={<Warning />}
              color="#F44336"
              subtitle="Requieren atención"
            />
          </Grid>
        </Grid>
      )}

      {/* Estadísticas adicionales para profesores - Métricas de actividad */}
      {isTeacher && teacherStats && (
        <>
          <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Tareas Pendientes"
                value={assignmentsPendingReview}
                icon={<Warning />}
                color="#FF5722"
                subtitle="Sin calificar"
                onClick={() => navigate('/assignments')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Tareas Próximas"
                value={assignmentsUpcoming}
                icon={<Schedule />}
                color="#FF9800"
                subtitle="Vencen en 7 días"
                onClick={() => navigate('/assignments')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Entregas Recientes"
                value={recentSubmissions}
                icon={<CheckCircle />}
                color="#4CAF50"
                subtitle="Últimos 7 días"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Calificaciones Recientes"
                value={recentGrades}
                icon={<Assessment />}
                color="#2196F3"
                subtitle="Últimos 7 días"
              />
            </Grid>
            {(teacherStats.totalAttendanceSessions ?? 0) > 0 && (
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Sesiones de Asistencia"
                  value={teacherStats.totalAttendanceSessions ?? 0}
                  icon={<CalendarToday />}
                  color="#00BCD4"
                  subtitle="Total creadas"
                  onClick={() => navigate('/attendance')}
                />
              </Grid>
            )}
            {totalActiveStudents > 0 && (
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Estudiantes Activos"
                  value={totalActiveStudents}
                  icon={<People />}
                  color="#8BC34A"
                  subtitle="Últimos 7 días"
                  onClick={() => navigate('/people')}
                />
              </Grid>
            )}
          </Grid>

          {/* Alertas y notificaciones */}
          {(assignmentsPendingReview > 0 || assignmentsUpcoming > 0 || teacherStats.studentsWithLowAttendance > 0 || teacherStats.studentsWithLowPerformance > 0) && (
            <Grid container spacing={2} sx={{ mt: 2 }}>
              {assignmentsPendingReview > 0 && (
                <Grid item xs={12} md={6}>
                  <Alert
                    severity="warning"
                    icon={<Warning />}
                    onClick={() => navigate('/assignments')}
                    sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }}
                  >
                    <AlertTitle>Tareas Pendientes de Revisión</AlertTitle>
                    Tienes {assignmentsPendingReview} tarea(s) esperando calificación. Revisa y califica para mantener a los estudiantes actualizados.
                  </Alert>
                </Grid>
              )}
              {assignmentsUpcoming > 0 && (
                <Grid item xs={12} md={6}>
                  <Alert
                    severity="info"
                    icon={<Schedule />}
                    onClick={() => navigate('/assignments')}
                    sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }}
                  >
                    <AlertTitle>Tareas Próximas a Vencer</AlertTitle>
                    {assignmentsUpcoming} tarea(s) vencerán en los próximos 7 días. Considera recordar a los estudiantes.
                  </Alert>
                </Grid>
              )}
              {teacherStats.studentsWithLowAttendance > 0 && (
                <Grid item xs={12} md={6}>
                  <Alert
                    severity="error"
                    icon={<ErrorOutline />}
                    onClick={() => navigate('/people')}
                    sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }}
                  >
                    <AlertTitle>Estudiantes con Baja Asistencia</AlertTitle>
                    {teacherStats.studentsWithLowAttendance} estudiante(s) tienen asistencia menor al 70%. Considera contactarlos.
                  </Alert>
                </Grid>
              )}
              {teacherStats.studentsWithLowPerformance > 0 && (
                <Grid item xs={12} md={6}>
                  <Alert
                    severity="error"
                    icon={<ErrorOutline />}
                    onClick={() => navigate('/people')}
                    sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }}
                  >
                    <AlertTitle>Estudiantes con Bajo Rendimiento</AlertTitle>
                    {teacherStats.studentsWithLowPerformance} estudiante(s) tienen promedio menor al 60%. Pueden necesitar apoyo adicional.
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}

          {/* Gráficos y visualizaciones - Solo mostrar si hay datos reales */}
          <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mt: 2 }}>
            {performanceData.length > 0 ? (
              <>
                {/* Primera fila: Gráfico de rendimiento */}
                <Grid item xs={12}>
                  <Card sx={{ borderRadius: 3 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                        Rendimiento y Asistencia por Curso
                      </Typography>
                      <Box sx={{ width: '100%', overflowX: 'auto' }}>
                        <Box sx={{ minWidth: { xs: '500px', sm: '100%' } }}>
                          <PerformanceChart data={performanceData} />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Segunda fila: Resumen por curso mejorado */}
                <Grid item xs={12}>
                  <Card sx={{ borderRadius: 3, display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                        Resumen por Curso
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'row',
                          gap: 2,
                          flex: 1,
                          overflowX: 'auto',
                          overflowY: 'hidden',
                          pb: 1,
                          minHeight: 0
                        }}
                      >
                        {performanceData.length === 0 ? (
                          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4, width: '100%' }}>
                            No hay datos de cursos disponibles
                          </Typography>
                        ) : (
                          performanceData.map((course, index) => (
                            <Card
                              key={index}
                              variant="outlined"
                              sx={{
                                p: { xs: 1.5, sm: 2 },
                                width: '100%',
                                minWidth: { xs: '260px', sm: '280px' },
                                maxWidth: { xs: '300px', sm: '320px' },
                                flexShrink: 0,
                                borderLeft: `4px solid ${coursesWithStats[index]?.color || '#1976d2'}`,
                                '&:hover': {
                                  boxShadow: 3,
                                  transform: 'translateY(-2px)',
                                  transition: 'all 0.2s ease'
                                },
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <Typography
                                variant="subtitle2"
                                fontWeight="bold"
                                gutterBottom
                                sx={{
                                  mb: 1.5,
                                  wordBreak: 'break-word',
                                  lineHeight: 1.3
                                }}
                              >
                                {course.fullName || course.name}
                              </Typography>
                              <Grid container spacing={1.5}>
                                <Grid item xs={6}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                    <People sx={{ fontSize: 16, color: 'text.secondary' }} />
                                    <Typography variant="caption" color="text.secondary">
                                      Estudiantes:
                                    </Typography>
                                  </Box>
                                  <Typography variant="body2" fontWeight="bold">
                                    {course.studentCount || 0}
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                    <Bolt sx={{ fontSize: 16, color: 'success.main' }} />
                                    <Typography variant="caption" color="text.secondary">
                                      Activos:
                                    </Typography>
                                  </Box>
                                  <Typography variant="body2" fontWeight="bold" color="success.main">
                                    {course.activeStudentsCount || 0}
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                    <Assignment sx={{ fontSize: 16, color: 'text.secondary' }} />
                                    <Typography variant="caption" color="text.secondary">
                                      Tareas:
                                    </Typography>
                                  </Box>
                                  <Typography variant="body2" fontWeight="bold">
                                    {course.assignmentCount || 0}
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                    <AssignmentTurnedIn sx={{ fontSize: 16, color: 'text.secondary' }} />
                                    <Typography variant="caption" color="text.secondary">
                                      Entregas:
                                    </Typography>
                                  </Box>
                                  <Typography variant="body2" fontWeight="bold">
                                    {course.submissionCount || 0}
                                  </Typography>
                                </Grid>
                                {course.participationRate > 0 && (
                                  <Grid item xs={12} sx={{ mt: 0.5 }}>
                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                                      Participación:
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <LinearProgress
                                        variant="determinate"
                                        value={course.participationRate}
                                        sx={{ flexGrow: 1, height: 8, borderRadius: 2 }}
                                        color={course.participationRate >= 70 ? 'success' : course.participationRate >= 50 ? 'warning' : 'error'}
                                      />
                                      <Typography variant="caption" fontWeight="bold" sx={{ minWidth: '35px' }}>
                                        {course.participationRate.toFixed(0)}%
                                      </Typography>
                                    </Box>
                                  </Grid>
                                )}
                              </Grid>
                            </Card>
                          ))
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Tercera fila: Distribución de calificaciones */}
                {performanceData.some(c => c.gradeDistribution && Object.values(c.gradeDistribution).some(v => v > 0)) && (
                  <Grid item xs={12}>
                    <Card sx={{ borderRadius: 3 }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                          Distribución de Calificaciones
                        </Typography>
                        <Grid container spacing={{ xs: 2, md: 3 }}>
                          {performanceData.map((course, index) => {
                            const dist = course.gradeDistribution || {};
                            const total = (dist.excellent || 0) + (dist.good || 0) + (dist.average || 0) + (dist.poor || 0);
                            if (total === 0) return null;

                            return (
                              <Grid item xs={12} sm={6} md={4} key={index}>
                                <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, maxWidth: '100%', overflow: 'hidden' }}>
                                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
                                    {course.fullName || course.name}
                                  </Typography>
                                  <GradeDistributionChart gradeDistribution={dist} />
                                </Box>
                              </Grid>
                            );
                          })}
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </>
            ) : coursesWithStats.length > 0 ? (
              /* Si hay cursos pero sin datos de rendimiento, mostrar solo las tarjetas */
              <Grid item xs={12}>
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                      Estadísticas por Curso
                    </Typography>
                    <Grid container spacing={2}>
                      {coursesWithStats.map((course, index) => (
                        <Grid item xs={12} sm={6} md={4} key={course.courseId || index}>
                          <Card
                            variant="outlined"
                            sx={{
                              height: '100%',
                              borderLeft: `4px solid ${course.color || '#1976d2'}`,
                              transition: 'transform 0.2s, box-shadow 0.2s',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: 3
                              }
                            }}
                          >
                            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                              <Typography variant="body1" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1rem' } }}>
                                {course.courseName}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.9rem', sm: '0.875rem' } }}>
                                {course.turn || 'Sin turno'}
                              </Typography>
                              <Divider sx={{ my: 1 }} />
                              <Grid container spacing={1} sx={{ mt: 0.5 }}>
                                <Grid item xs={6}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <People sx={{ fontSize: 18, color: 'text.secondary' }} />
                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.9rem', sm: '0.75rem' } }}>Estudiantes:</Typography>
                                  </Box>
                                  <Typography variant="subtitle2" fontWeight="bold" sx={{ fontSize: { xs: '1.1rem', sm: '0.875rem' }, color: 'text.primary' }}>
                                    {course.studentCount || 0}
                                    {course.activeStudentsCount > 0 && (
                                      <span style={{ fontSize: '0.8rem', color: '#2e7d32', marginLeft: '6px', fontWeight: 'normal' }}>
                                        ({course.activeStudentsCount} act)
                                      </span>
                                    )}
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Assignment sx={{ fontSize: 18, color: 'text.secondary' }} />
                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.9rem', sm: '0.75rem' } }}>Tareas:</Typography>
                                  </Box>
                                  <Typography variant="subtitle2" fontWeight="bold" sx={{ fontSize: { xs: '1.1rem', sm: '0.875rem' } }}>
                                    {course.assignmentCount || 0}
                                    {course.publishedAssignments > 0 && (
                                      <span style={{ fontSize: '0.8rem', color: '#666', marginLeft: '6px', fontWeight: 'normal' }}>
                                        ({course.publishedAssignments} pub)
                                      </span>
                                    )}
                                  </Typography>
                                </Grid>
                                {course.participationRate > 0 && (
                                  <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                      <Typography variant="body2" color="text.secondary">Participación:</Typography>
                                      <Typography variant="body2" fontWeight="bold" color={course.participationRate >= 70 ? 'success.main' : course.participationRate >= 50 ? 'warning.main' : 'error.main'}>
                                        {course.participationRate.toFixed(1)}%
                                      </Typography>
                                    </Box>
                                    <LinearProgress
                                      variant="determinate"
                                      value={course.participationRate}
                                      sx={{ height: 8, borderRadius: 4 }}
                                      color={course.participationRate >= 70 ? 'success' : course.participationRate >= 50 ? 'warning' : 'error'}
                                    />
                                  </Grid>
                                )}
                                {course.attendanceRate > 0 && (
                                  <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <Typography variant="body2" color="text.secondary">Asistencia:</Typography>
                                      <Typography variant="body2" fontWeight="bold" color={course.attendanceRate >= 80 ? 'success.main' : course.attendanceRate >= 70 ? 'warning.main' : 'error.main'}>
                                        {course.attendanceRate.toFixed(1)}%
                                      </Typography>
                                    </Box>
                                    <LinearProgress
                                      variant="determinate"
                                      value={course.attendanceRate}
                                      sx={{ height: 8, borderRadius: 4, mt: 0.5 }}
                                      color={course.attendanceRate >= 80 ? 'success' : course.attendanceRate >= 70 ? 'warning' : 'error'}
                                    />
                                  </Grid>
                                )}
                                {(course.pendingReviewCount > 0 || course.upcomingAssignmentsCount > 0) && (
                                  <Grid item xs={12} sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {course.pendingReviewCount > 0 && (
                                      <Chip
                                        label={`${course.pendingReviewCount} rev`}
                                        size="small"
                                        color="warning"
                                        icon={<Warning sx={{ fontSize: '1rem !important' }} />}
                                        sx={{ fontSize: '0.8rem' }}
                                      />
                                    )}
                                    {course.upcomingAssignmentsCount > 0 && (
                                      <Chip
                                        label={`${course.upcomingAssignmentsCount} prox`}
                                        size="small"
                                        color="info"
                                        icon={<Schedule sx={{ fontSize: '1rem !important' }} />}
                                        sx={{ fontSize: '0.8rem' }}
                                      />
                                    )}
                                  </Grid>
                                )}
                              </Grid>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ) : courses.length > 0 ? (
              /* Si hay cursos pero sin estadísticas detalladas */
              <Grid item xs={12}>
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                      Tus Cursos
                    </Typography>
                    <Grid container spacing={2}>
                      {courses.map((course, index) => (
                        <Grid item xs={12} sm={6} md={4} key={course.id || index}>
                          <Card
                            variant="outlined"
                            sx={{
                              height: '100%',
                              borderLeft: `4px solid ${course.color || '#1976d2'}`,
                              transition: 'transform 0.2s, box-shadow 0.2s',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: 3
                              }
                            }}
                          >
                            <CardContent>
                              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                {course.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                {course.turn || 'Sin turno'}
                              </Typography>
                              <Divider sx={{ my: 1.5 }} />
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2">Estudiantes:</Typography>
                                <Typography variant="body2" fontWeight="bold">
                                  {course.student_count || 0}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2">Tareas:</Typography>
                                <Typography variant="body2" fontWeight="bold">
                                  {course.assignment_count || 0}
                                </Typography>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ) : (
              /* Mensaje si no hay cursos */
              <Grid item xs={12}>
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <School sx={{ fontSize: 64, mb: 2, opacity: 0.3, color: 'text.secondary' }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No tienes cursos todavía
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Crea tu primer curso para comenzar a ver estadísticas
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </>
      )}

      {/* Contenido principal - Solo para estudiantes */}
      {!isTeacher && (
        <Grid container spacing={{ xs: 2, sm: 4 }} sx={{ mt: { xs: 2, sm: 2 } }}>
          {/* Tareas pendientes */}
          <Grid item xs={12}>
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

          {/* Cursos recientes */}
          <Grid item xs={12}>
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
                          Únete a un curso usando un código de inscripción
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </motion.div>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default Dashboard;
